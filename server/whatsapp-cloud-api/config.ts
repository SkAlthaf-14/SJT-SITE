/**
 * SJT FARMS — WhatsApp Business Cloud API Configuration
 * 
 * SERVER-SIDE ONLY:
 * Never import this file into frontend client code (Vite bundle).
 * Credentials must be loaded from server environment secrets or a secure secrets manager.
 */

export interface WhatsAppCloudConfig {
  /** Meta Graph API version */
  graphApiVersion: string;
  /** Meta Graph API Base URL */
  graphApiBaseUrl: string;
  /** Meta WhatsApp Business Phone Number ID */
  phoneNumberId: string;
  /** Meta WhatsApp Business Account ID (WABA ID) */
  businessAccountId: string;
  /** Meta App ID */
  appId: string;
  /** Meta App Secret (for X-Hub-Signature-256 validation) */
  appSecret: string;
  /** WhatsApp Cloud API System User / Access Token */
  accessToken: string;
  /** Webhook verification token configured in Meta App Dashboard */
  webhookVerifyToken: string;
  /** Canonical store URL for links in messages */
  storeUrl: string;
  /** Public WhatsApp Business Display Number */
  displayPhoneNumber: string;
  /** Whether the Cloud API has all required production secrets configured */
  isConfigured: boolean;
}

export function loadWhatsAppCloudConfig(): WhatsAppCloudConfig {
  const phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID || '';
  const businessAccountId = process.env.META_WA_BUSINESS_ACCOUNT_ID || '';
  const appId = process.env.META_APP_ID || '';
  const appSecret = process.env.META_APP_SECRET || '';
  const accessToken = process.env.META_WA_ACCESS_TOKEN || '';
  const webhookVerifyToken = process.env.META_WA_WEBHOOK_VERIFY_TOKEN || '';
  const graphApiVersion = process.env.META_GRAPH_API_VERSION || 'v21.0';
  const storeUrl = process.env.CANONICAL_STORE_URL || 'https://sjtfarms.com';
  const displayPhoneNumber = '918121020111';

  const isConfigured = Boolean(
    phoneNumberId &&
    accessToken &&
    appSecret &&
    webhookVerifyToken
  );

  return {
    graphApiVersion,
    graphApiBaseUrl: `https://graph.facebook.com/${graphApiVersion}`,
    phoneNumberId,
    businessAccountId,
    appId,
    appSecret,
    accessToken,
    webhookVerifyToken,
    storeUrl,
    displayPhoneNumber,
    isConfigured,
  };
}
