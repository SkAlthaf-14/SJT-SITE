/**
 * SJT FARMS - CENTRAL PAYMENT CONFIGURATION & UPI INTENT BUILDER
 *
 * Provides NPCI-compliant URI generation, direct deep-link construction
 * for Google Pay, PhonePe, and Paytm, device platform detection, and
 * fallback metadata for unsupported browsers or missing apps.
 */

export interface PaymentMerchantConfig {
  merchantVpa: string;
  merchantName: string;
  businessEntityName: string;
  currency: string;
  merchantQrImage: string;
  isGatewayActive: boolean;
  gatewayProvider: 'None (Direct UPI Manual Verification)' | 'Razorpay' | 'Cashfree';
  supportEmail: string;
  supportPhone: string;
}

export const PAYMENT_CONFIG: PaymentMerchantConfig = {
  merchantVpa: 'sirishagannavaram@ybl',
  merchantName: 'Venkata Sireesha Gannavaram',
  businessEntityName: 'SJT FARMS PRIVATE LIMITED',
  currency: 'INR',
  merchantQrImage: '/images/payment/phonepe-qr.png',
  isGatewayActive: false,
  gatewayProvider: 'None (Direct UPI Manual Verification)',
  supportEmail: 'orders@sjtfarms.com',
  supportPhone: '+91 8121020111',
};

export type UpiAppProvider = 'any' | 'phonepe' | 'gpay' | 'paytm';

export interface DevicePlatformInfo {
  isAndroid: boolean;
  isIOS: boolean;
  isMobile: boolean;
  isDesktop: boolean;
  platformName: 'android' | 'ios' | 'desktop' | 'other';
}

/**
 * Detects whether the current device is Android, iOS, or Desktop.
 * Used to construct provider-supported native intents or prompt desktop fallbacks.
 */
export function detectDevicePlatform(): DevicePlatformInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isAndroid: false,
      isIOS: false,
      isMobile: false,
      isDesktop: true,
      platformName: 'desktop',
    };
  }

  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isIOS =
    /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isMobile = isAndroid || isIOS || /webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isDesktop = !isMobile;

  let platformName: 'android' | 'ios' | 'desktop' | 'other' = 'desktop';
  if (isAndroid) platformName = 'android';
  else if (isIOS) platformName = 'ios';
  else if (isDesktop) platformName = 'desktop';
  else platformName = 'other';

  return {
    isAndroid,
    isIOS,
    isMobile,
    isDesktop,
    platformName,
  };
}

export interface UpiIntentParams {
  amount: number;
  orderNumberOrId: string | number;
  merchantVpa?: string;
  merchantName?: string;
  note?: string;
  transactionRef?: string;
}

/**
 * Validates merchant payment configuration.
 * Missing or malformed merchant details fail safely rather than silently using bad data.
 */
export function validateMerchantConfig(
  config: PaymentMerchantConfig = PAYMENT_CONFIG
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!config.merchantVpa || !config.merchantVpa.includes('@')) {
    errors.push('Missing or invalid merchant UPI VPA identifier.');
  }
  if (!config.merchantName || config.merchantName.trim().length === 0) {
    errors.push('Missing merchant payee name.');
  }
  if (!config.currency || config.currency !== 'INR') {
    errors.push(`Invalid currency: expected INR, received ${config.currency}.`);
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Builds a standardized and strictly encoded UPI query string.
 * Uses NPCI mandatory parameters:
 *  - pa: Payee VPA
 *  - pn: Payee Name
 *  - am: Amount (2 decimal places)
 *  - cu: Currency (INR)
 *  - tn: Transaction Note (order reference)
 *  - tr: Transaction Reference ID
 */
export function buildUpiQueryString(
  params: UpiIntentParams,
  configOverride?: PaymentMerchantConfig
): {
  queryString: string;
  amountStr: string;
  vpa: string;
  name: string;
  note: string;
  transactionRef: string;
} {
  const activeConfig = configOverride || PAYMENT_CONFIG;
  const configValidation = validateMerchantConfig(activeConfig);
  if (!configValidation.valid) {
    throw new Error(`Merchant payment configuration error: ${configValidation.errors.join(', ')}`);
  }

  const vpa = (params.merchantVpa || activeConfig.merchantVpa).trim();
  const name = (params.merchantName || activeConfig.merchantName).trim();

  if (!vpa || !vpa.includes('@')) {
    throw new Error('Invalid payee VPA: must be a valid UPI identifier (e.g. name@bank).');
  }
  if (!name) {
    throw new Error('Invalid payee Name: merchant name is required.');
  }

  const note = params.note || `SJT Farms Order #${params.orderNumberOrId}`;
  const rawNum = Number(params.amount);
  const validAmount = isNaN(rawNum) || rawNum < 0 ? 0 : rawNum;
  const amountStr = validAmount.toFixed(2);
  const transactionRef =
    params.transactionRef || `SJT-${params.orderNumberOrId}-${Date.now().toString().slice(-4)}`;

  const searchParams = new URLSearchParams();
  searchParams.set('pa', vpa);
  searchParams.set('pn', name);
  searchParams.set('am', amountStr);
  searchParams.set('cu', PAYMENT_CONFIG.currency);
  searchParams.set('tn', note);
  searchParams.set('tr', transactionRef);

  // Replace '+' with '%20' for spaces, and preserve unencoded '@' in VPA (pa) for standard NPCI UPI compliance
  const queryString = searchParams.toString().replace(/\+/g, '%20').replace(/%40/g, '@');

  return {
    queryString,
    amountStr,
    vpa,
    name,
    note,
    transactionRef,
  };
}

/**
 * Standard NPCI universal UPI URI (triggers system app chooser or QR scanner).
 */
export function buildUpiIntentUri(params: UpiIntentParams): string {
  const { queryString } = buildUpiQueryString(params);
  return `upi://pay?${queryString}`;
}

export interface UpiAppLaunchConfig {
  provider: UpiAppProvider;
  displayName: string;
  targetUri: string;
  universalUri: string;
  androidPackage?: string;
  iosScheme?: string;
  playStoreUrl?: string;
  appStoreUrl?: string;
  brandColor: string;
  brandBg: string;
  brandBorder: string;
  badgeText: string;
  platform: DevicePlatformInfo;
}

/**
 * Builds provider-specific deep link or Android package intent.
 * Strict isolation: Google Pay will NEVER target PhonePe or Paytm.
 */
export function buildAppSpecificUpiUri(
  provider: UpiAppProvider,
  params: UpiIntentParams,
  platformOverride?: DevicePlatformInfo
): string {
  const platform = platformOverride || detectDevicePlatform();
  const { queryString } = buildUpiQueryString(params);

  switch (provider) {
    case 'gpay':
      if (platform.isAndroid) {
        // Direct Android Intent targeting Google Pay package specifically
        return `intent://pay?${queryString}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;
      }
      if (platform.isIOS) {
        // Direct iOS Custom Scheme registered by Google Pay
        return `gpay://upi/pay?${queryString}`;
      }
      // On desktop or fallback
      return `upi://pay?${queryString}`;

    case 'phonepe':
      if (platform.isAndroid) {
        // Direct Android Intent targeting PhonePe package specifically
        return `intent://pay?${queryString}#Intent;scheme=upi;package=com.phonepe.app;end`;
      }
      if (platform.isIOS) {
        // Direct iOS Custom Scheme registered by PhonePe
        return `phonepe://pay?${queryString}`;
      }
      // On desktop or fallback
      return `upi://pay?${queryString}`;

    case 'paytm':
      if (platform.isAndroid) {
        // Direct Android Intent targeting Paytm package specifically
        return `intent://pay?${queryString}#Intent;scheme=upi;package=net.one97.paytm;end`;
      }
      if (platform.isIOS) {
        // Direct iOS Custom Scheme registered by Paytm
        return `paytmmp://pay?${queryString}`;
      }
      // On desktop or fallback
      return `upi://pay?${queryString}`;

    case 'any':
    default:
      // Universal UPI intent (triggers OS-level application chooser)
      return `upi://pay?${queryString}`;
  }
}

/**
 * Returns comprehensive launch configuration, metadata, and store links for a UPI provider.
 */
export function getUpiAppLaunchConfig(
  provider: UpiAppProvider,
  params: UpiIntentParams,
  platformOverride?: DevicePlatformInfo
): UpiAppLaunchConfig {
  const platform = platformOverride || detectDevicePlatform();
  const targetUri = buildAppSpecificUpiUri(provider, params, platform);
  const universalUri = buildUpiIntentUri(params);

  const configs: Record<
    UpiAppProvider,
    Omit<UpiAppLaunchConfig, 'targetUri' | 'universalUri' | 'platform'>
  > = {
    gpay: {
      provider: 'gpay',
      displayName: 'Google Pay',
      androidPackage: 'com.google.android.apps.nbu.paisa.user',
      iosScheme: 'gpay://upi/pay',
      playStoreUrl:
        'https://play.google.com/store/apps/details?id=com.google.android.apps.nbu.paisa.user',
      appStoreUrl: 'https://apps.apple.com/in/app/google-pay-save-pay-grow/id1193357041',
      brandColor: '#4285F4',
      brandBg: '#F8FAFF',
      brandBorder: '#D2E3FC',
      badgeText: 'Google Pay Direct',
    },
    phonepe: {
      provider: 'phonepe',
      displayName: 'PhonePe',
      androidPackage: 'com.phonepe.app',
      iosScheme: 'phonepe://pay',
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.phonepe.app',
      appStoreUrl: 'https://apps.apple.com/in/app/phonepe-secure-payments/id1170055821',
      brandColor: '#5F259F',
      brandBg: '#F9F5FD',
      brandBorder: '#E5D6F8',
      badgeText: 'PhonePe Direct',
    },
    paytm: {
      provider: 'paytm',
      displayName: 'Paytm',
      androidPackage: 'net.one97.paytm',
      iosScheme: 'paytmmp://pay',
      playStoreUrl: 'https://play.google.com/store/apps/details?id=net.one97.paytm',
      appStoreUrl: 'https://apps.apple.com/in/app/paytm-secure-upi-payments/id473941634',
      brandColor: '#002970',
      brandBg: '#F3F7FD',
      brandBorder: '#CDE1FA',
      badgeText: 'Paytm Direct',
    },
    any: {
      provider: 'any',
      displayName: 'Any UPI App',
      androidPackage: undefined,
      iosScheme: 'upi://pay',
      playStoreUrl: undefined,
      appStoreUrl: undefined,
      brandColor: '#F47920',
      brandBg: '#FFF9F3',
      brandBorder: '#FFE2C6',
      badgeText: 'Universal App Chooser',
    },
  };

  const baseConfig = configs[provider] || configs.any;

  return {
    ...baseConfig,
    targetUri,
    universalUri,
    platform,
  };
}
