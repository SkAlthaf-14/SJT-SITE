/**
 * SJT FARMS — WhatsApp Cloud API Cloud Functions Configuration
 * 
 * Supports both Firebase Functions v2 Secret Manager (`defineSecret`)
 * and local environment variables (`process.env`) for local emulator testing.
 * 
 * Target Meta Graph API Version: v22.0 (Official 2026 current supported release)
 */

export interface WhatsAppCloudConfig {
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  webhookVerifyToken: string;
  appSecret: string;
  apiVersion: string;
  storeUrl: string;
  businessPhone: string;
}

export function getWhatsAppConfig(): WhatsAppCloudConfig {
  return {
    phoneNumberId: process.env.META_WA_PHONE_NUMBER_ID || '',
    businessAccountId: process.env.META_WA_BUSINESS_ACCOUNT_ID || '',
    accessToken: process.env.META_WA_ACCESS_TOKEN || '',
    webhookVerifyToken: process.env.META_WA_WEBHOOK_VERIFY_TOKEN || 'sjt_farms_wa_verify_2026',
    appSecret: process.env.META_APP_SECRET || '',
    apiVersion: process.env.META_GRAPH_API_VERSION || 'v22.0',
    storeUrl: process.env.STORE_BASE_URL || 'https://sjtfarms.com',
    businessPhone: '918121020111',
  };
}

/**
 * Secret names declared for Firebase Secret Manager
 */
export const REQUIRED_FIREBASE_SECRETS = [
  'META_WA_ACCESS_TOKEN',
  'META_APP_SECRET',
  'META_WA_WEBHOOK_VERIFY_TOKEN',
  'META_WA_PHONE_NUMBER_ID',
  'META_WA_BUSINESS_ACCOUNT_ID',
] as const;
