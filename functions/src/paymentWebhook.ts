/**
 * SJT FARMS — PRODUCTION-GRADE PAYMENT GATEWAY WEBHOOK & VERIFICATION HANDLER
 *
 * Provides cryptographic signature verification, amount and currency validation,
 * account ID checks, transactional idempotency, and state regression protection.
 *
 * Security Controls Implemented:
 * 1. HMAC-SHA256 signature verification against raw request body using crypto.timingSafeEqual.
 * 2. Strict amount verification: received paise === Math.round(order.total * 100).
 * 3. Currency verification: strictly 'INR'.
 * 4. Gateway Order ID match: verifies payment.order_id matches order.gatewayOrderId.
 * 5. Out-of-order event protection: paid/settled orders are IMMUTABLE against late failed/pending events.
 * 6. Non-captured events (e.g. payment.authorized) never transition order to 'paid'.
 * 7. Transactional idempotency: event deduplication lock is evaluated and committed INSIDE db.runTransaction.
 * 8. Recoverable failure: unhandled exceptions propagate to HTTP 500 to trigger gateway webhook retry.
 * 9. PII and secret redaction: sensitive credentials and customer card numbers are never logged.
 */

import * as crypto from 'crypto';
import * as admin from 'firebase-admin';

export interface RazorpayPaymentEntity {
  id: string;
  amount: number; // in paise
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  order_id?: string;
  method: string;
  email?: string;
  contact?: string;
  notes?: Record<string, string>;
  error_code?: string;
  error_description?: string;
}

export interface RazorpayOrderEntity {
  id: string;
  amount: number; // in paise
  currency: string;
  receipt?: string;
  status: 'created' | 'attempted' | 'paid';
}

export interface RazorpayWebhookPayload {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment?: {
      entity: RazorpayPaymentEntity;
    };
    order?: {
      entity: RazorpayOrderEntity;
    };
    refund?: {
      entity: {
        id: string;
        amount: number;
        currency: string;
        payment_id: string;
        status: string;
      };
    };
  };
  created_at: number;
}

export interface WebhookProcessingResult {
  success: boolean;
  code: 'PROCESSED' | 'DUPLICATE_IGNORED' | 'OUT_OF_ORDER_IGNORED' | 'AMOUNT_MISMATCH' | 'CURRENCY_MISMATCH' | 'ORDER_NOT_FOUND' | 'UNHANDLED_EVENT' | 'GATEWAY_ORDER_MISMATCH' | 'ACCOUNT_MISMATCH';
  message: string;
  orderId?: string;
  paymentId?: string;
}

/**
 * Validates Razorpay Webhook Signature against raw unparsed request body.
 * Uses timingSafeEqual to prevent side-channel timing attacks.
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | undefined,
  webhookSecret: string
): boolean {
  if (!signatureHeader || !webhookSecret) {
    return false;
  }

  try {
    const rawBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8');
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBuffer)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const signatureBuffer = Buffer.from(signatureHeader.trim(), 'utf8');

    if (expectedBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  } catch (err: any) {
    console.error('[Payment Webhook] Signature verification exception:', err?.message);
    return false;
  }
}

/**
 * Processes an authentic payment webhook event idempotently with full data integrity checks.
 * Throws on database infrastructure failure so caller can return HTTP 500 for webhook retry.
 */
export async function processGatewayPaymentWebhook(
  event: RazorpayWebhookPayload,
  eventId: string,
  expectedAccountId?: string
): Promise<WebhookProcessingResult> {
  const db = admin.firestore();
  const eventName = event.event;
  const paymentEntity = event.payload.payment?.entity;
  const orderEntity = event.payload.order?.entity;

  // 1. Validate Merchant Account ID if configured
  if (expectedAccountId && event.account_id && event.account_id !== expectedAccountId) {
    console.warn('[Payment Webhook] Account mismatch. Event rejected.', {
      receivedAccountId: event.account_id ? `${event.account_id.slice(0, 4)}***` : 'none',
    });
    return {
      success: false,
      code: 'ACCOUNT_MISMATCH',
      message: 'Webhook account identifier does not match configured merchant account.',
    };
  }

  // 2. Identify Internal Order Reference
  const rawOrderRef =
    paymentEntity?.notes?.orderId ||
    paymentEntity?.notes?.orderNumber ||
    orderEntity?.receipt;

  if (!rawOrderRef) {
    // Record event as unlinked to avoid duplicate reprocessing
    const eventRef = db.collection('gateway_webhook_events').doc(eventId);
    await eventRef.set({
      eventId,
      eventName,
      paymentId: paymentEntity?.id || 'none',
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'unlinked_no_order_reference',
    });

    return {
      success: true,
      code: 'UNHANDLED_EVENT',
      message: 'Webhook acknowledged but no internal order reference was attached.',
    };
  }

  const cleanOrderId = String(rawOrderRef).replace(/^order_/i, '').replace(/^#/, '').trim();
  const candidates = [`order_${cleanOrderId}`, cleanOrderId];

  let orderDocRef: admin.firestore.DocumentReference | null = null;
  let orderData: any = null;

  for (const docId of candidates) {
    const docRef = db.collection('orders').doc(docId);
    const snap = await docRef.get();
    if (snap.exists) {
      orderDocRef = docRef;
      orderData = snap.data();
      break;
    }
  }

  // Fallback lookup by numeric orderNumber
  if (!orderDocRef) {
    const num = parseInt(cleanOrderId, 10);
    if (!isNaN(num)) {
      const q = await db.collection('orders').where('orderNumber', '==', num).limit(1).get();
      if (!q.empty) {
        orderDocRef = q.docs[0].ref;
        orderData = q.docs[0].data();
      }
    }
  }

  if (!orderDocRef || !orderData) {
    const eventRef = db.collection('gateway_webhook_events').doc(eventId);
    await eventRef.set({
      eventId,
      eventName,
      paymentId: paymentEntity?.id || 'none',
      orderRef: cleanOrderId,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'order_not_found',
    });

    return {
      success: false,
      code: 'ORDER_NOT_FOUND',
      message: `Referenced internal order #${cleanOrderId} could not be located in Firestore.`,
    };
  }

  // 3. Currency & Authoritative Amount Verification
  const expectedTotalRupees = Number(orderData.totalAmount || orderData.total || 0);
  const expectedPaise = Math.round(expectedTotalRupees * 100);
  const receivedPaise = Number(paymentEntity?.amount || orderEntity?.amount || 0);
  const receivedCurrency = (paymentEntity?.currency || orderEntity?.currency || 'INR').toUpperCase();

  if (receivedCurrency !== 'INR') {
    return {
      success: false,
      code: 'CURRENCY_MISMATCH',
      message: `Invalid transaction currency: expected INR, received ${receivedCurrency}.`,
      orderId: cleanOrderId,
    };
  }

  // For capture and paid events, amount MUST strictly match order total
  const isSettlementEvent = eventName === 'payment.captured' || eventName === 'order.paid';
  if (isSettlementEvent && receivedPaise !== expectedPaise) {
    console.error('[Payment Webhook] SECURITY ALERT: Transaction amount mismatch!', {
      orderId: cleanOrderId,
      expectedPaise,
      receivedPaise,
    });

    // Record fraud investigation audit entry without marking order as paid
    const fraudAudit = {
      status: 'Payment Flagged',
      timestamp: new Date().toISOString(),
      actor: 'Gateway Webhook Security Engine',
      note: `SECURITY ALERT: Webhook amount ₹${(receivedPaise / 100).toFixed(2)} does not match order total ₹${expectedTotalRupees.toFixed(2)}. Payment withheld.`,
    };

    await orderDocRef.update({
      isFlagged: true,
      flagReason: `Amount mismatch: expected ₹${expectedTotalRupees.toFixed(2)}, received ₹${(receivedPaise / 100).toFixed(2)}`,
      paymentVerificationStatus: 'under_review',
      statusHistory: admin.firestore.FieldValue.arrayUnion(fraudAudit),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: false,
      code: 'AMOUNT_MISMATCH',
      message: `Amount mismatch: expected ₹${expectedTotalRupees.toFixed(2)}, received ₹${(receivedPaise / 100).toFixed(2)}. Order flagged.`,
      orderId: cleanOrderId,
    };
  }

  // 4. Validate Gateway Order ID if internal order already has one allocated
  if (orderData.gatewayOrderId && paymentEntity?.order_id) {
    if (orderData.gatewayOrderId !== paymentEntity.order_id) {
      console.warn('[Payment Webhook] Gateway Order ID mismatch.', {
        orderId: cleanOrderId,
        internalGatewayOrderId: orderData.gatewayOrderId,
        receivedGatewayOrderId: paymentEntity.order_id,
      });

      return {
        success: false,
        code: 'GATEWAY_ORDER_MISMATCH',
        message: 'Payment was initiated for a different gateway order session.',
        orderId: cleanOrderId,
      };
    }
  }

  // 5. ATOMIC IDEMPOTENCY & STATE TRANSITION TRANSACTION
  // Idempotency check happens INSIDE the transaction so concurrent deliveries serialize cleanly.
  const eventRef = db.collection('gateway_webhook_events').doc(eventId);

  const transactionResult = await db.runTransaction(async (t) => {
    // Check if event was already processed
    const tEventSnap = await t.get(eventRef);
    if (tEventSnap.exists) {
      return { duplicate: true };
    }

    // Refresh order doc inside transaction for optimistic concurrency
    const tOrderSnap = await t.get(orderDocRef!);
    const freshOrder = tOrderSnap.data() || orderData;

    const currentPayStatus = (freshOrder.paymentStatus || 'pending').toLowerCase();
    const currentVerifyStatus = (freshOrder.paymentVerificationStatus || '').toLowerCase();

    // Out-of-Order Event Protection:
    // If order is ALREADY paid or confirmed, a late/delayed failed or pending event MUST NOT regress the state!
    const isAlreadyPaid = currentPayStatus === 'paid' || currentVerifyStatus === 'paid' || currentVerifyStatus === 'confirmed';

    let newPaymentStatus: 'paid' | 'failed' | 'pending' | 'refunded' = freshOrder.paymentStatus || 'pending';
    let newVerifyStatus: string = freshOrder.paymentVerificationStatus || 'awaiting_payment';
    let auditNote = '';
    let shouldUpdateOrder = true;

    if (eventName === 'payment.captured' || eventName === 'order.paid') {
      newPaymentStatus = 'paid';
      newVerifyStatus = 'paid';
      auditNote = `Payment of ₹${(receivedPaise / 100).toFixed(2)} authoritatively captured via ${paymentEntity?.method || 'Gateway'}. Gateway Payment ID: ${paymentEntity?.id || 'none'}`;
    } else if (eventName === 'payment.failed') {
      if (isAlreadyPaid) {
        // Safe out-of-order handling: do not revert paid order!
        shouldUpdateOrder = false;
        auditNote = `Out-of-order payment failure event (${paymentEntity?.id || 'none'}) ignored because order is already paid.`;
      } else {
        newPaymentStatus = 'failed';
        newVerifyStatus = 'payment_failed';
        auditNote = `Payment attempt failed via gateway. Code: ${paymentEntity?.error_code || 'none'} - ${paymentEntity?.error_description || 'Transaction declined'}`;
      }
    } else if (eventName === 'payment.authorized') {
      // Authorized but NOT captured: remains pending verification! NEVER mark paid!
      if (!isAlreadyPaid) {
        newPaymentStatus = 'pending';
        newVerifyStatus = 'verification_pending';
        auditNote = `Payment authorized (awaiting automatic capture). Gateway Payment ID: ${paymentEntity?.id}`;
      } else {
        shouldUpdateOrder = false;
      }
    } else if (eventName === 'refund.processed') {
      newPaymentStatus = 'refunded';
      newVerifyStatus = 'refunded';
      auditNote = `Payment refunded via gateway. Gateway Payment ID: ${paymentEntity?.id}`;
    } else {
      // Unhandled informational events
      t.set(eventRef, {
        eventId,
        eventName,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'ignored_event_type',
      });
      return { duplicate: false, ignored: true };
    }

    if (shouldUpdateOrder) {
      const auditEntry = {
        status: newPaymentStatus === 'paid' ? 'Payment Confirmed' : newPaymentStatus === 'failed' ? 'Payment Failed' : 'Payment Updated',
        timestamp: new Date().toISOString(),
        actor: 'Gateway Webhook',
        note: auditNote,
      };

      t.update(orderDocRef!, {
        paymentStatus: newPaymentStatus,
        paymentVerificationStatus: newVerifyStatus,
        gatewayPaymentId: paymentEntity?.id || freshOrder.gatewayPaymentId || null,
        gatewayOrderId: paymentEntity?.order_id || freshOrder.gatewayOrderId || null,
        statusHistory: admin.firestore.FieldValue.arrayUnion(auditEntry),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Commit idempotency record in the same atomic transaction
    t.set(eventRef, {
      eventId,
      eventName,
      orderDocId: orderDocRef!.id,
      paymentId: paymentEntity?.id || null,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'success',
      outOfOrderIgnored: !shouldUpdateOrder,
    });

    return { duplicate: false, outOfOrderIgnored: !shouldUpdateOrder };
  });

  if (transactionResult.duplicate) {
    return {
      success: true,
      code: 'DUPLICATE_IGNORED',
      message: 'Duplicate webhook event received and safely skipped.',
      orderId: cleanOrderId,
      paymentId: paymentEntity?.id,
    };
  }

  if (transactionResult.outOfOrderIgnored) {
    return {
      success: true,
      code: 'OUT_OF_ORDER_IGNORED',
      message: 'Out-of-order failure/pending event was safely ignored to preserve paid order status.',
      orderId: cleanOrderId,
      paymentId: paymentEntity?.id,
    };
  }

  return {
    success: true,
    code: 'PROCESSED',
    message: `Payment event ${eventName} successfully verified and recorded for Order #${cleanOrderId}.`,
    orderId: cleanOrderId,
    paymentId: paymentEntity?.id,
  };
}
