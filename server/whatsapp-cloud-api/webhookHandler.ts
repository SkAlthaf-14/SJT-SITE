/**
 * SJT FARMS — WhatsApp Cloud API Webhook Handler
 * 
 * Implements:
 * 1. GET Webhook Subscription Verification (Meta Challenge-Response)
 * 2. POST Webhook Signature Verification (HMAC-SHA256 timingSafeEqual)
 * 3. In-memory Idempotency & Deduplication Cache
 * 4. Safe Payload Extraction for Text, Interactive Buttons, and Interactive List replies
 */

import crypto from 'crypto';
import { loadWhatsAppCloudConfig } from './config.ts';

// 24-hour in-memory cache to prevent processing duplicate messages on Meta webhook retries
const processedMessageIds = new Map<string, number>();
const DEDUP_TTL_MS = 24 * 60 * 60 * 1000;

function cleanupDedupCache(): void {
  const now = Date.now();
  for (const [id, timestamp] of processedMessageIds.entries()) {
    if (now - timestamp > DEDUP_TTL_MS) {
      processedMessageIds.delete(id);
    }
  }
}

/**
 * Validates Meta GET verification challenge for webhook setup.
 * Meta calls this when you configure or verify the webhook URL in App Dashboard.
 */
export function handleWebhookVerification(
  mode: string | null | undefined,
  token: string | null | undefined,
  challenge: string | null | undefined
): { status: number; body: string } {
  const config = loadWhatsAppCloudConfig();

  if (mode === 'subscribe' && token === config.webhookVerifyToken) {
    console.info('[WhatsApp Webhook] Verification successful for Meta challenge');
    return { status: 200, body: challenge || '' };
  }

  console.warn('[WhatsApp Webhook] Verification failed: Invalid mode or verify token');
  return { status: 403, body: 'Forbidden: Invalid verification token' };
}

/**
 * Validates the X-Hub-Signature-256 header against the raw body buffer and app secret.
 * Protects against spoofing and tampering.
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

  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  const calculatedBuffer = Buffer.from(calculatedSignature, 'hex');

  if (expectedBuffer.length !== calculatedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, calculatedBuffer);
}

/**
 * Checks whether a message ID has already been processed to ensure idempotency.
 */
export function isDuplicateMessage(messageId: string): boolean {
  cleanupDedupCache();
  if (processedMessageIds.has(messageId)) {
    return true;
  }
  processedMessageIds.set(messageId, Date.now());
  return false;
}

export interface IncomingWhatsAppMessage {
  messageId: string;
  from: string; // Customer phone number (e.g. "919876543210")
  timestamp: string;
  type: 'text' | 'interactive' | 'button' | 'unknown';
  text?: string;
  interactiveType?: 'button_reply' | 'list_reply';
  buttonId?: string;
  buttonTitle?: string;
  listId?: string;
  listTitle?: string;
  listDescription?: string;
}

/**
 * Safely parses the Meta WhatsApp Cloud API incoming webhook payload.
 */
export function parseIncomingWebhookPayload(
  payload: any
): IncomingWhatsAppMessage[] {
  const extractedMessages: IncomingWhatsAppMessage[] = [];

  if (payload?.object !== 'whatsapp_business_account') {
    return extractedMessages;
  }

  const entries = payload.entry || [];
  for (const entry of entries) {
    const changes = entry.changes || [];
    for (const change of changes) {
      if (change.field !== 'messages') continue;

      const value = change.value;
      const messages = value?.messages || [];

      for (const msg of messages) {
        const messageId = msg.id;
        const from = msg.from;
        const timestamp = msg.timestamp;

        if (msg.type === 'text') {
          extractedMessages.push({
            messageId,
            from,
            timestamp,
            type: 'text',
            text: msg.text?.body || '',
          });
        } else if (msg.type === 'interactive') {
          const interactive = msg.interactive;
          if (interactive?.type === 'button_reply') {
            extractedMessages.push({
              messageId,
              from,
              timestamp,
              type: 'interactive',
              interactiveType: 'button_reply',
              buttonId: interactive.button_reply?.id,
              buttonTitle: interactive.button_reply?.title,
            });
          } else if (interactive?.type === 'list_reply') {
            extractedMessages.push({
              messageId,
              from,
              timestamp,
              type: 'interactive',
              interactiveType: 'list_reply',
              listId: interactive.list_reply?.id,
              listTitle: interactive.list_reply?.title,
              listDescription: interactive.list_reply?.description,
            });
          }
        } else if (msg.type === 'button') {
          extractedMessages.push({
            messageId,
            from,
            timestamp,
            type: 'button',
            buttonTitle: msg.button?.text,
            buttonId: msg.button?.payload,
          });
        } else {
          extractedMessages.push({
            messageId,
            from,
            timestamp,
            type: 'unknown',
          });
        }
      }
    }
  }

  return extractedMessages;
}
