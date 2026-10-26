/**
 * SJT FARMS — Firebase Cloud Functions Entry Point
 * 
 * Provides:
 * 1. whatsappWebhook (HTTP GET & POST):
 *    - GET: Meta Webhook challenge verification
 *    - POST: HMAC-SHA256 signature verification, deduplication, and chatbot message routing
 * 2. whatsappHealth (HTTP GET):
 *    - Safe diagnostic endpoint checking configuration presence without exposing secrets
 */

import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { getWhatsAppConfig, REQUIRED_FIREBASE_SECRETS } from './config';
import {
  validateWebhookChallenge,
  verifyMetaSignature,
  isDuplicateMessage,
  parseWebhookPayload,
} from './webhookHandler';
import { ChatbotRouter } from './chatbot';
import {
  verifyRazorpayWebhookSignature,
  processGatewayPaymentWebhook,
} from './paymentWebhook';
import {
  reserveUtrTransaction,
  adminVerifyUtrTransaction,
  adminReleaseUtrTransaction,
} from './utrService';

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const chatbot = new ChatbotRouter();

/**
 * Fetcher helper to query order by sequential order number or document ID
 */
async function fetchOrderFromFirestore(orderIdInput: string): Promise<any> {
  const cleanId = orderIdInput.trim().replace(/^#/, '');
  const db = admin.firestore();

  // Try document ID first: order_{id}
  const directDoc = await db.collection('orders').doc(`order_${cleanId}`).get();
  if (directDoc.exists) {
    return directDoc.data();
  }

  // Try numerical orderNumber query
  const numVal = parseInt(cleanId, 10);
  if (!isNaN(numVal)) {
    const qNum = await db.collection('orders').where('orderNumber', '==', numVal).limit(1).get();
    if (!qNum.empty) {
      return qNum.docs[0].data();
    }
  }

  // Try orderId string query
  const qStr = await db.collection('orders').where('orderId', '==', cleanId).limit(1).get();
  if (!qStr.empty) {
    return qStr.docs[0].data();
  }

  return null;
}

/**
 * Primary WhatsApp Cloud API Webhook Function
 * Configured with Firebase Secret Manager secrets in production
 */
export const whatsappWebhook = onRequest(
  {
    secrets: [...REQUIRED_FIREBASE_SECRETS],
    cors: false,
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (req, res) => {
    const config = getWhatsAppConfig();

    // =========================================================================
    // 1. GET: Webhook Subscription Verification (Meta Hub Challenge)
    // =========================================================================
    if (req.method === 'GET') {
      const mode = (req.query['hub.mode'] as string) || null;
      const token = (req.query['hub.verify_token'] as string) || null;
      const challenge = (req.query['hub.challenge'] as string) || null;

      const verification = validateWebhookChallenge(mode, token, challenge);
      res.status(verification.status).send(verification.body);
      return;
    }

    // =========================================================================
    // 2. POST: Inbound Message & Event Processing
    // =========================================================================
    if (req.method === 'POST') {
      const signature = req.headers['x-hub-signature-256'] as string;

      // Validate signature in production if appSecret is configured
      if (config.appSecret) {
        const rawBody = (req as any).rawBody || JSON.stringify(req.body);
        const isValid = verifyMetaSignature(rawBody, signature, config.appSecret);

        if (!isValid) {
          console.warn('[Webhook] Rejected request: Invalid X-Hub-Signature-256.');
          res.status(401).send('Unauthorized: Invalid Signature');
          return;
        }
      }

      // Immediately return 200 OK to Meta to acknowledge receipt within timeout window
      res.status(200).send('EVENT_RECEIVED');

      try {
        const payload = req.body;
        const { messages, statuses } = parseWebhookPayload(payload);

        console.info(`[Webhook Diagnostic] Event received. Messages count: ${messages.length}, Statuses count: ${statuses.length}`);

        // Process Status Updates
        for (const st of statuses) {
          const maskedRecipient = st.recipientId ? `${st.recipientId.slice(0, 3)}****${st.recipientId.slice(-3)}` : 'unknown';
          console.info(`[Webhook Status] Message ${st.messageId} status: ${st.status} (Recipient: ${maskedRecipient}, Code: ${st.errorCode || 'none'})`);
        }

        // Process Incoming Messages
        for (const msg of messages) {
          // Prevent re-processing retried events
          if (isDuplicateMessage(msg.messageId)) {
            console.info(`[Webhook] Duplicate event skipped: ${msg.messageId}`);
            continue;
          }

          const maskedFrom = msg.from ? `${msg.from.slice(0, 3)}****${msg.from.slice(-3)}` : 'unknown';
          console.info(`[Webhook Inbound] Processing message ${msg.messageId} from ${maskedFrom} (Type: ${msg.type})`);

          // Route to stateful chatbot
          await chatbot.handleIncomingMessage(msg, fetchOrderFromFirestore);
        }
      } catch (err: any) {
        console.error('[Webhook] Exception processing incoming message:', err.message);
      }

      return;
    }

    res.status(405).send('Method Not Allowed');
  }
);

/**
 * Diagnostic Health Endpoint (never leaks credentials or secrets)
 */
export const whatsappHealth = onRequest(
  {
    cors: true,
  },
  async (req, res) => {
    const config = getWhatsAppConfig();

    const diagnostics = {
      status: 'operational',
      environment: process.env.NODE_ENV || 'production',
      apiVersion: config.apiVersion,
      storeUrl: config.storeUrl,
      businessPhone: config.businessPhone,
      isAccessTokenSet: Boolean(config.accessToken && config.accessToken.length > 10),
      isAppSecretSet: Boolean(config.appSecret && config.appSecret.length > 5),
      isPhoneNumberIdSet: Boolean(config.phoneNumberId && config.phoneNumberId.length > 5),
      isWebhookVerifyTokenSet: Boolean(config.webhookVerifyToken),
      metaMessagingStatus: 'gated_pending_meta_verification',
      metaAccountRestriction: 'Meta Business Account Locked (error 131031). Business verification required in Meta Business Manager before live messaging can be activated.',
      simulatorStatus: 'fully_operational_independent_of_meta',
      coexistenceNote: 'Phone +91 8121020111 is currently active on WhatsApp Business mobile app.',
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(diagnostics);
  }
);

/**
 * Payment Gateway Webhook Endpoint (e.g. Razorpay)
 * Requires PAYMENT_WEBHOOK_SECRET in environment or Secret Manager.
 * Recovers from database failure with HTTP 500 so gateway retries.
 */
export const paymentGatewayWebhook = onRequest(
  {
    cors: false,
    timeoutSeconds: 30,
    memory: '256MiB',
    secrets: ['PAYMENT_WEBHOOK_SECRET'],
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || '';
    if (!webhookSecret) {
      console.warn('[Payment Webhook] Gateway webhook secret unconfigured.');
      res.status(503).send('Payment gateway webhook not configured.');
      return;
    }

    const signature = req.headers['x-razorpay-signature'] as string | undefined;
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    const isValid = verifyRazorpayWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.warn('[Payment Webhook] Rejected: Invalid gateway signature.');
      res.status(401).send('Unauthorized: Invalid Signature');
      return;
    }

    try {
      // Deterministic event ID fallback to ensure concurrent deliveries always collide on same lock
      const paymentEntityId = req.body?.payload?.payment?.entity?.id;
      const eventName = req.body?.event;
      const deterministicFallback = paymentEntityId && eventName
        ? `${eventName}_${paymentEntityId}`
        : `event_${req.body?.created_at || Date.now()}`;

      const eventId = (req.headers['x-razorpay-event-id'] as string) || req.body?.id || deterministicFallback;
      const expectedAccountId = process.env.RAZORPAY_ACCOUNT_ID || process.env.PAYMENT_GATEWAY_ACCOUNT_ID;

      const result = await processGatewayPaymentWebhook(req.body, eventId, expectedAccountId);

      res.status(200).json({ status: 'ok', ...result });
    } catch (err: any) {
      // Catch database / network infrastructure failures and return HTTP 500 to trigger gateway retry
      console.error('[Payment Webhook] Infrastructure exception during processing:', err?.message || err);
      res.status(500).send('Internal Server Error: Database failure during webhook processing. Retry queued.');
    }
  }
);

/**
 * Customer / Storefront UTR Reference Reservation Endpoint
 * Performs atomic reference reservation in Firestore transaction to prevent duplicate claims.
 */
export const submitUtrReservation = onRequest(
  {
    cors: true,
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ success: false, message: 'Method Not Allowed' });
      return;
    }

    const { orderId, utrNumber, customerContact } = req.body || {};
    if (!orderId || !utrNumber) {
      res.status(400).json({
        success: false,
        message: 'Order ID and UTR reference number are required.',
      });
      return;
    }

    try {
      const db = admin.firestore();
      const result = await reserveUtrTransaction(db, {
        orderIdOrDocId: String(orderId),
        utrNumber: String(utrNumber),
        customerContact: customerContact ? String(customerContact) : undefined,
        actor: 'Customer',
      });

      const httpStatus = result.success
        ? 200
        : result.code === 'ALREADY_RESERVED_ANOTHER_ORDER' ||
          result.code === 'ALREADY_VERIFIED_ANOTHER_ORDER'
        ? 409
        : 400;
      res.status(httpStatus).json(result);
    } catch (err: any) {
      console.error('[submitUtrReservation] Exception:', err?.message || err);
      res.status(500).json({
        success: false,
        message: 'Internal error processing reference reservation.',
      });
    }
  }
);

/**
 * Administrator Payment Verification Endpoint
 * Validates admin credentials and authoritatively verifies reference reservation to mark order paid.
 */
export const adminVerifyUtr = onRequest(
  {
    cors: true,
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ success: false, message: 'Method Not Allowed' });
      return;
    }

    // Authenticate Admin via Firebase ID Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Unauthorized: Admin authorization token required.' });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch {
      res.status(401).json({ success: false, message: 'Unauthorized: Invalid ID token.' });
      return;
    }

    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const isAdmin = decodedToken.admin === true || (userDoc.exists && userDoc.data()?.role === 'admin');

    if (!isAdmin) {
      res.status(403).json({ success: false, message: 'Forbidden: Administrator privileges required.' });
      return;
    }

    const { orderId, utrNumber, notes } = req.body || {};
    if (!orderId) {
      res.status(400).json({ success: false, message: 'Order ID is required.' });
      return;
    }

    try {
      const result = await adminVerifyUtrTransaction(db, {
        orderIdOrDocId: String(orderId),
        utrNumber: utrNumber ? String(utrNumber) : undefined,
        adminIdentifier: decodedToken.email || decodedToken.uid || 'Administrator',
        notes: notes ? String(notes) : undefined,
      });

      const httpStatus = result.success
        ? 200
        : result.code === 'ALREADY_VERIFIED_ANOTHER_ORDER'
        ? 409
        : 400;
      res.status(httpStatus).json(result);
    } catch (err: any) {
      console.error('[adminVerifyUtr] Exception:', err?.message || err);
      res.status(500).json({ success: false, message: 'Internal error verifying payment.' });
    }
  }
);



