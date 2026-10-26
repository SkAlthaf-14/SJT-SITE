/**
 * SJT FARMS — WhatsApp Cloud API Webhook Handler
 * 
 * Implements:
 * 1. GET Subscription Verification (Meta Hub Challenge-Response)
 * 2. POST HMAC-SHA256 Signature Validation (timingSafeEqual)
 * 3. Idempotent Deduplication (prevents re-processing Meta retries)
 * 4. Message Parsing (text, interactive buttons, interactive lists)
 * 5. Delivery, Failure, and Read-Status Event Tracking
 * 6. Echo and Self-Message Loop Prevention
 */

import crypto from 'crypto';
import { getWhatsAppConfig } from './config';

// 24-hour in-memory deduplication set
const processedMessageIds = new Map<string, number>();
const DEDUP_TTL_MS = 24 * 60 * 60 * 1000;

function cleanupDedupCache(): void {
  const now = Date.now();
  for (const [id, time] of processedMessageIds.entries()) {
    if (now - time > DEDUP_TTL_MS) {
      processedMessageIds.delete(id);
    }
  }
}

/**
 * Validates Meta GET verification challenge
 */
export function validateWebhookChallenge(
  mode: string | null | undefined,
  token: string | null | undefined,
  challenge: string | null | undefined
): { status: number; body: string } {
  const config = getWhatsAppConfig();

  if (mode === 'subscribe' && token === config.webhookVerifyToken) {
    console.info('[Webhook] Meta verification challenge accepted successfully.');
    return { status: 200, body: challenge || '' };
  }

  console.warn('[Webhook] Verification failed: Invalid mode or verify token.');
  return { status: 403, body: 'Forbidden: Invalid verification token' };
}

/**
 * Validates X-Hub-Signature-256 header using timingSafeEqual
 */
export function verifyMetaSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null | undefined,
  appSecret: string
): boolean {
  if (!signatureHeader || !appSecret) {
    return false;
  }

  const parts = signatureHeader.split('=');
  if (parts.length !== 2 || parts[0] !== 'sha256') {
    return false;
  }

  const expectedSignature = parts[1];
  const hmac = crypto.createHmac('sha256', appSecret);
  const bodyBuffer = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody;
  hmac.update(bodyBuffer);
  const calculatedSignature = hmac.digest('hex');

  const expectedBuf = Buffer.from(expectedSignature, 'hex');
  const calcBuf = Buffer.from(calculatedSignature, 'hex');

  if (expectedBuf.length !== calcBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, calcBuf);
}

/**
 * Ensures idempotency by checking message ID
 */
export function isDuplicateMessage(messageId: string): boolean {
  cleanupDedupCache();
  if (processedMessageIds.has(messageId)) {
    return true;
  }
  processedMessageIds.set(messageId, Date.now());
  return false;
}

export interface IncomingMessage {
  messageId: string;
  from: string; // Customer phone e.g. "919876543210"
  timestamp: string;
  type: 'text' | 'interactive' | 'button' | 'unknown';
  text?: string;
  interactiveType?: 'button_reply' | 'list_reply';
  buttonId?: string;
  buttonTitle?: string;
  listId?: string;
  listTitle?: string;
}

export interface MessageStatusUpdate {
  messageId: string;
  recipientId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  errorCode?: number;
  errorMessage?: string;
}

/**
 * Extracts incoming customer messages and delivery statuses from webhook payload
 */
export function parseWebhookPayload(payload: any): {
  messages: IncomingMessage[];
  statuses: MessageStatusUpdate[];
} {
  const messages: IncomingMessage[] = [];
  const statuses: MessageStatusUpdate[] = [];

  if (payload?.object !== 'whatsapp_business_account') {
    return { messages, statuses };
  }

  const entries = payload.entry || [];
  for (const entry of entries) {
    const changes = entry.changes || [];
    for (const change of changes) {
      if (change.field !== 'messages') continue;

      const value = change.value;

      // 1. Parse Status Updates (sent, delivered, read, failed)
      if (Array.isArray(value?.statuses)) {
        for (const st of value.statuses) {
          statuses.push({
            messageId: st.id,
            recipientId: st.recipient_id,
            status: st.status,
            timestamp: st.timestamp,
            errorCode: st.errors?.[0]?.code,
            errorMessage: st.errors?.[0]?.message || st.errors?.[0]?.title,
          });
        }
      }

      // 2. Parse Incoming Messages
      if (Array.isArray(value?.messages)) {
        for (const msg of value.messages) {
          const messageId = msg.id;
          const from = msg.from;
          const timestamp = msg.timestamp;

          // Prevent loop: ignore messages without valid customer sender
          if (!messageId || !from) continue;

          if (msg.type === 'text') {
            messages.push({
              messageId,
              from,
              timestamp,
              type: 'text',
              text: msg.text?.body || '',
            });
          } else if (msg.type === 'interactive') {
            const interactive = msg.interactive || {};
            if (interactive.type === 'button_reply') {
              messages.push({
                messageId,
                from,
                timestamp,
                type: 'interactive',
                interactiveType: 'button_reply',
                buttonId: interactive.button_reply?.id,
                buttonTitle: interactive.button_reply?.title,
              });
            } else if (interactive.type === 'list_reply') {
              messages.push({
                messageId,
                from,
                timestamp,
                type: 'interactive',
                interactiveType: 'list_reply',
                listId: interactive.list_reply?.id,
                listTitle: interactive.list_reply?.title,
              });
            }
          }
        }
      }
    }
  }

  return { messages, statuses };
}
