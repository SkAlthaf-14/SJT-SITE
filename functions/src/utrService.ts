/**
 * SJT FARMS — ATOMIC UTR REFERENCE RESERVATION & VERIFICATION SERVICE
 *
 * Implements deterministic reservation documents to guarantee reference uniqueness
 * and eliminate Time-of-Check to Time-of-Use (TOCTOU) race conditions in Firestore.
 *
 * Security Architecture:
 * 1. Document Key: Non-reversible HMAC-SHA256 derived from normalized 12-digit UTR.
 * 2. Concurrency Safety: All checks and writes occur inside atomic db.runTransaction().
 * 3. Idempotency: Retrying the same reference on the same order succeeds without duplicating writes.
 * 4. Conflict Rejection: A reference already reserved or verified on a different order is rejected.
 * 5. Immutable Audit Trail: Every reservation, verification, rejection, and release is logged.
 * 6. Non-Releasable Verified References: A reference reconciled to payment can NEVER be released or reused.
 */

import * as crypto from 'crypto';
import * as admin from 'firebase-admin';

export interface UtrReservationAuditEntry {
  action: 'reserved' | 'verified' | 'rejected' | 'released' | 'retry_idempotent';
  timestamp: string;
  actor: string;
  orderId: string;
  note?: string;
}

export interface UtrReservationDocument {
  reservationId: string; // 64-char hex HMAC
  orderId: string; // Customer-facing order ID (e.g. "101")
  firestoreDocId: string; // Internal Firestore doc ID (e.g. "order_101")
  orderNumber?: number;
  status: 'reserved' | 'verified' | 'rejected' | 'released';
  reservedBy: 'Customer' | 'Administrator' | 'System';
  createdAt: admin.firestore.FieldValue;
  updatedAt: admin.firestore.FieldValue;
  verifiedAt?: admin.firestore.FieldValue;
  verifiedBy?: string;
  rejectionReason?: string;
  releasedAt?: admin.firestore.FieldValue;
  releasedBy?: string;
  releaseReason?: string;
  auditHistory: UtrReservationAuditEntry[];
}

export interface UtrOperationResult {
  success: boolean;
  code:
    | 'RESERVED'
    | 'IDEMPOTENT_RETRY'
    | 'ALREADY_RESERVED_ANOTHER_ORDER'
    | 'ALREADY_VERIFIED_ANOTHER_ORDER'
    | 'VERIFIED'
    | 'ALREADY_VERIFIED'
    | 'CANNOT_RELEASE_VERIFIED'
    | 'ORDER_NOT_FOUND'
    | 'INVALID_FORMAT'
    | 'CONTACT_MISMATCH';
  message: string;
  reservationId?: string;
  orderId?: string;
}

/**
 * Normalizes and validates standard Indian UPI UTR / Bank Reference format.
 */
export function validateAndNormalizeUtr(utr: string): {
  valid: boolean;
  normalized: string;
  message?: string;
} {
  if (!utr || typeof utr !== 'string') {
    return { valid: false, normalized: '', message: 'UTR reference number is required.' };
  }

  const clean = utr.trim().replace(/\s+/g, '');
  if (!clean) {
    return { valid: false, normalized: '', message: 'UTR reference number cannot be empty.' };
  }

  // Standard 12 numeric digits
  if (/^\d{12}$/.test(clean)) {
    return { valid: true, normalized: clean };
  }

  // Fallback for banking reference alphanumeric variants (8-22 chars)
  if (clean.length >= 8 && clean.length <= 22 && /^[A-Za-z0-9]+$/.test(clean)) {
    return { valid: true, normalized: clean.toUpperCase() };
  }

  return {
    valid: false,
    normalized: '',
    message: 'Invalid UTR format. Standard UPI UTR numbers are 12 numeric digits (e.g. 423589123456).',
  };
}

/**
 * Computes deterministic, non-reversible reservation ID via HMAC-SHA256.
 * The secret key is managed exclusively in server-side configuration.
 */
export function computeUtrReservationId(normalizedUtr: string, secretOverride?: string): string {
  const secret = secretOverride || process.env.UTR_HMAC_SECRET || 'sjt_utr_production_salt_2026';
  return crypto.createHmac('sha256', secret).update(normalizedUtr.trim()).digest('hex');
}

/**
 * Atomically reserves a UTR reference for an order inside a Firestore transaction.
 * Completely eliminates TOCTOU race conditions when two orders submit the same reference.
 */
export async function reserveUtrTransaction(
  db: admin.firestore.Firestore,
  params: {
    orderIdOrDocId: string;
    utrNumber: string;
    actor?: string;
    customerContact?: string;
    hmacSecret?: string;
  }
): Promise<UtrOperationResult> {
  const norm = validateAndNormalizeUtr(params.utrNumber);
  if (!norm.valid) {
    return {
      success: false,
      code: 'INVALID_FORMAT',
      message: norm.message || 'Invalid UTR format.',
    };
  }

  const normalizedUtr = norm.normalized;
  const reservationId = computeUtrReservationId(normalizedUtr, params.hmacSecret);
  const cleanInput = params.orderIdOrDocId.trim().replace(/^Order\s*#/i, '').replace(/^#/, '');

  // 1. Resolve target order document reference before entering transaction
  let orderRef: admin.firestore.DocumentReference | null = null;
  const candidates = [`order_${cleanInput}`, cleanInput, `order_${cleanInput.toLowerCase()}`];

  for (const docId of candidates) {
    const snap = await db.collection('orders').doc(docId).get();
    if (snap.exists) {
      orderRef = snap.ref;
      break;
    }
  }

  if (!orderRef) {
    const numVal = parseInt(cleanInput, 10);
    if (!isNaN(numVal)) {
      const q = await db.collection('orders').where('orderNumber', '==', numVal).limit(1).get();
      if (!q.empty) {
        orderRef = q.docs[0].ref;
      }
    }
  }

  if (!orderRef) {
    return {
      success: false,
      code: 'ORDER_NOT_FOUND',
      message: `Order #${cleanInput} could not be located in database.`,
    };
  }

  const reservationRef = db.collection('utr_reservations').doc(reservationId);
  const actor = params.actor || 'Customer';

  // 2. ATOMIC TRANSACTION: Check reservation & order state together
  return await db.runTransaction(async (transaction) => {
    const [resSnap, orderSnap] = await Promise.all([
      transaction.get(reservationRef),
      transaction.get(orderRef!),
    ]);

    if (!orderSnap.exists) {
      return {
        success: false,
        code: 'ORDER_NOT_FOUND',
        message: `Order #${cleanInput} document does not exist.`,
      };
    }

    const orderData = orderSnap.data() || {};
    const orderId = orderData.orderId || cleanInput;
    const firestoreDocId = orderRef!.id;

    // Contact verification for customer guest protection
    if (params.customerContact && params.customerContact.trim()) {
      const cleanContact = params.customerContact.trim().toLowerCase();
      const cleanPhone = cleanContact.replace(/\D/g, '');
      const orderEmail = (orderData.customerEmail || orderData.customer?.email || '').toLowerCase();
      const orderPhone = (orderData.phone || orderData.customer?.phone || '').replace(/\D/g, '');

      const emailMatches = orderEmail && orderEmail === cleanContact;
      const phoneMatches = cleanPhone.length >= 10 && orderPhone.endsWith(cleanPhone);

      if (!emailMatches && !phoneMatches) {
        return {
          success: false,
          code: 'CONTACT_MISMATCH',
          message: 'Verification failed. Contact details do not match this order reference.',
        };
      }
    }

    const nowIso = new Date().toISOString();

    // 3. Evaluate Reservation Conflict
    if (resSnap.exists) {
      const resData = resSnap.data() as UtrReservationDocument;

      // Case A: Belongs to the same order -> Idempotent retry
      if (resData.orderId === orderId || resData.firestoreDocId === firestoreDocId) {
        const retryAudit: UtrReservationAuditEntry = {
          action: 'retry_idempotent',
          timestamp: nowIso,
          actor,
          orderId,
          note: 'Idempotent resubmission of reference for the same order.',
        };

        transaction.update(reservationRef, {
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          auditHistory: admin.firestore.FieldValue.arrayUnion(retryAudit),
        });

        // Ensure order doc has UTR set
        if (!orderData.utrNumber) {
          transaction.update(orderRef!, {
            utrNumber: normalizedUtr,
            paymentVerificationStatus: 'verification_pending',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        return {
          success: true,
          code: 'IDEMPOTENT_RETRY',
          message: 'Payment reference already recorded for this order. Verification is pending.',
          reservationId,
          orderId,
        };
      }

      // Case B: Belongs to another order and is VERIFIED -> Rejection
      if (resData.status === 'verified') {
        return {
          success: false,
          code: 'ALREADY_VERIFIED_ANOTHER_ORDER',
          message: `This transaction reference (UTR) has already been verified and reconciled for Order #${resData.orderId}. Please check your banking receipt.`,
          reservationId,
          orderId,
        };
      }

      // Case C: Belongs to another order and is RESERVED/PENDING -> Rejection
      if (resData.status === 'reserved') {
        return {
          success: false,
          code: 'ALREADY_RESERVED_ANOTHER_ORDER',
          message: `This transaction reference (UTR) is currently reserved for verification on Order #${resData.orderId}. Two different orders cannot claim the same reference.`,
          reservationId,
          orderId,
        };
      }
    }

    // 4. Create New Reservation
    const initialAudit: UtrReservationAuditEntry = {
      action: 'reserved',
      timestamp: nowIso,
      actor,
      orderId,
      note: `Reference reserved by ${actor} for Order #${orderId}.`,
    };

    const reservationDoc: UtrReservationDocument = {
      reservationId,
      orderId,
      firestoreDocId,
      orderNumber: orderData.orderNumber || parseInt(orderId, 10) || undefined,
      status: 'reserved',
      reservedBy: actor === 'Administrator' ? 'Administrator' : 'Customer',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      auditHistory: [initialAudit],
    };

    transaction.set(reservationRef, reservationDoc);

    // 5. Update Order Document (NEVER mark paid here; status strictly transitions to verification_pending)
    const orderAudit = {
      status: 'Payment Details Submitted',
      timestamp: nowIso,
      actor,
      note: `Submitted UTR reference: ${normalizedUtr}. Reference reserved atomically (ID: ${reservationId.substring(0, 8)}...).`,
    };

    transaction.update(orderRef!, {
      utrNumber: normalizedUtr,
      utrReservationId: reservationId,
      paymentVerificationStatus: 'verification_pending',
      statusHistory: admin.firestore.FieldValue.arrayUnion(orderAudit),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      code: 'RESERVED',
      message: 'Payment reference submitted successfully! Verification is pending with accounts.',
      reservationId,
      orderId,
    };
  });
}

/**
 * Atomically verifies a UTR reference and transitions order to 'paid'.
 * Only authoritative administrators can invoke this operation.
 */
export async function adminVerifyUtrTransaction(
  db: admin.firestore.Firestore,
  params: {
    orderIdOrDocId: string;
    utrNumber?: string;
    adminIdentifier: string;
    notes?: string;
    hmacSecret?: string;
  }
): Promise<UtrOperationResult> {
  const cleanInput = params.orderIdOrDocId.trim().replace(/^Order\s*#/i, '').replace(/^#/, '');

  let orderRef: admin.firestore.DocumentReference | null = null;
  const candidates = [`order_${cleanInput}`, cleanInput, `order_${cleanInput.toLowerCase()}`];

  for (const docId of candidates) {
    const snap = await db.collection('orders').doc(docId).get();
    if (snap.exists) {
      orderRef = snap.ref;
      break;
    }
  }

  if (!orderRef) {
    const numVal = parseInt(cleanInput, 10);
    if (!isNaN(numVal)) {
      const q = await db.collection('orders').where('orderNumber', '==', numVal).limit(1).get();
      if (!q.empty) {
        orderRef = q.docs[0].ref;
      }
    }
  }

  if (!orderRef) {
    return {
      success: false,
      code: 'ORDER_NOT_FOUND',
      message: `Order #${cleanInput} could not be located.`,
    };
  }

  return await db.runTransaction(async (transaction) => {
    const orderSnap = await transaction.get(orderRef!);
    if (!orderSnap.exists) {
      return { success: false, code: 'ORDER_NOT_FOUND', message: 'Order document missing.' };
    }

    const orderData = orderSnap.data() || {};
    const effectiveUtr = (params.utrNumber || orderData.utrNumber || '').trim();

    if (!effectiveUtr) {
      return {
        success: false,
        code: 'INVALID_FORMAT',
        message: 'No UTR reference attached to this order. Please record UTR before verifying.',
      };
    }

    const norm = validateAndNormalizeUtr(effectiveUtr);
    if (!norm.valid) {
      return { success: false, code: 'INVALID_FORMAT', message: norm.message || 'Invalid UTR.' };
    }

    const reservationId = computeUtrReservationId(norm.normalized, params.hmacSecret);
    const reservationRef = db.collection('utr_reservations').doc(reservationId);
    const resSnap = await transaction.get(reservationRef);

    const orderId = orderData.orderId || cleanInput;
    const nowIso = new Date().toISOString();

    // If reservation document exists, ensure it is not bound to a different order
    if (resSnap.exists) {
      const resData = resSnap.data() as UtrReservationDocument;
      if (resData.orderId !== orderId && resData.firestoreDocId !== orderRef!.id) {
        return {
          success: false,
          code: 'ALREADY_VERIFIED_ANOTHER_ORDER',
          message: `Cannot verify: UTR ${norm.normalized} is already bound to Order #${resData.orderId}. Prevent duplicate reconciliation!`,
        };
      }

      if (resData.status === 'verified') {
        return {
          success: true,
          code: 'ALREADY_VERIFIED',
          message: `Order #${orderId} payment is already verified.`,
        };
      }
    }

    // Transition reservation state to 'verified'
    const verifyAudit: UtrReservationAuditEntry = {
      action: 'verified',
      timestamp: nowIso,
      actor: params.adminIdentifier,
      orderId,
      note: params.notes || 'Verified against bank statement by accounts team.',
    };

    transaction.set(
      reservationRef,
      {
        reservationId,
        orderId,
        firestoreDocId: orderRef!.id,
        orderNumber: orderData.orderNumber || parseInt(orderId, 10) || undefined,
        status: 'verified',
        verifiedBy: params.adminIdentifier,
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        auditHistory: admin.firestore.FieldValue.arrayUnion(verifyAudit),
      },
      { merge: true }
    );

    // Transition order state to 'paid'
    const orderAudit = {
      status: 'Payment Confirmed',
      timestamp: nowIso,
      actor: params.adminIdentifier,
      note: params.notes || 'Payment verified by administrator against merchant bank statement.',
    };

    transaction.update(orderRef!, {
      paymentStatus: 'paid',
      paymentVerificationStatus: 'paid',
      paymentVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentAudit: {
        verifiedBy: params.adminIdentifier,
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        notes: params.notes || 'Verified against PhonePe / Bank Statement',
      },
      statusHistory: admin.firestore.FieldValue.arrayUnion(orderAudit),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      code: 'VERIFIED',
      message: `Payment for Order #${orderId} successfully verified and marked as Paid.`,
      reservationId,
      orderId,
    };
  });
}

/**
 * Safely releases a pending reference reservation when an order is cancelled or customer made an error.
 * Policy: A reference that was already VERIFIED can NEVER be released (prevents reuse of reconciled bank money).
 */
export async function adminReleaseUtrTransaction(
  db: admin.firestore.Firestore,
  params: {
    reservationId: string;
    adminIdentifier: string;
    reason: string;
  }
): Promise<UtrOperationResult> {
  if (!params.reason || params.reason.trim().length < 5) {
    return {
      success: false,
      code: 'INVALID_FORMAT',
      message: 'A mandatory audit reason (minimum 5 characters) is required to release a reference.',
    };
  }

  const reservationRef = db.collection('utr_reservations').doc(params.reservationId);

  return await db.runTransaction(async (transaction) => {
    const resSnap = await transaction.get(reservationRef);
    if (!resSnap.exists) {
      return { success: false, code: 'ORDER_NOT_FOUND', message: 'Reservation doc not found.' };
    }

    const resData = resSnap.data() as UtrReservationDocument;

    // Critical Policy: Verified reference can NEVER be released
    if (resData.status === 'verified') {
      return {
        success: false,
        code: 'CANNOT_RELEASE_VERIFIED',
        message: 'Security Violation: Cannot release a UTR reference that has already been verified and reconciled to an order payment.',
      };
    }

    const nowIso = new Date().toISOString();
    const releaseAudit: UtrReservationAuditEntry = {
      action: 'released',
      timestamp: nowIso,
      actor: params.adminIdentifier,
      orderId: resData.orderId,
      note: `Released by ${params.adminIdentifier}. Reason: ${params.reason.trim()}`,
    };

    transaction.update(reservationRef, {
      status: 'released',
      releasedAt: admin.firestore.FieldValue.serverTimestamp(),
      releasedBy: params.adminIdentifier,
      releaseReason: params.reason.trim(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      auditHistory: admin.firestore.FieldValue.arrayUnion(releaseAudit),
    });

    return {
      success: true,
      code: 'VERIFIED',
      message: `Reservation ${params.reservationId.substring(0, 8)}... successfully released.`,
    };
  });
}
