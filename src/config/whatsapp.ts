/**
 * SJT FARMS — CENTRALIZED WHATSAPP CONFIGURATION & MESSAGE ENGINE
 *
 * Primary WhatsApp Business Number: +91 8121020111 (918121020111)
 * Canonical URL: https://sjtfarms.com
 * Supported Languages: English ('en') & Telugu ('te')
 *
 * NOTE:
 * Basic website integration uses standard click-to-chat links (https://wa.me/918121020111?text=...).
 * The Cloud API integration architecture is provided in a separate modular server package.
 * No API credentials or client secrets are exposed here.
 */

import { Product, CartItem, OrderDetails } from '../types';

export type WhatsAppLanguage = 'en' | 'te';

export interface WhatsAppConfig {
  phoneNumber: string; // 918121020111
  formattedPhone: string; // +91 8121020111
  displayPhone: string; // +91 81210 20111
  canonicalUrl: string; // https://sjtfarms.com
  defaultLanguage: WhatsAppLanguage;
  featureFlags: {
    floatingButtonEnabled: boolean;
    productCardEnquiryEnabled: boolean;
    productCardShareEnabled: boolean;
    productDetailEnquiryEnabled: boolean;
    productDetailShareEnabled: boolean;
    orderSuccessSummaryEnabled: boolean;
    interactiveMenuEnabled: boolean;
    cloudApiAutomationEnabled: boolean; // false until owner provides and tests Cloud API credentials
  };
}

export const WHATSAPP_CONFIG: WhatsAppConfig = {
  phoneNumber: '918121020111',
  formattedPhone: '+91 8121020111',
  displayPhone: '+91 81210 20111',
  canonicalUrl: 'https://sjtfarms.com',
  defaultLanguage: 'en',
  featureFlags: {
    floatingButtonEnabled: true,
    productCardEnquiryEnabled: true,
    productCardShareEnabled: true,
    productDetailEnquiryEnabled: true,
    productDetailShareEnabled: true,
    orderSuccessSummaryEnabled: true,
    interactiveMenuEnabled: true,
    cloudApiAutomationEnabled: false, // Client click-to-chat mode active
  },
};

/**
 * Builds standard compliant WhatsApp Click-to-Chat URL.
 * https://wa.me/918121020111?text=ENCODED_MESSAGE
 */
export function buildWhatsAppLink(message: string, customPhone?: string): string {
  const phone = (customPhone || WHATSAPP_CONFIG.phoneNumber).replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message.trim());
  return `https://wa.me/${phone}?text=${encodedMessage}`;
}

/**
 * Professional Bilingual Message Templates (English & Telugu)
 */
export const WHATSAPP_TEMPLATES = {
  welcome: {
    en: 'Welcome to SJT FARMS Coffee! ☕ Discover our Araku coffee collection. How can we help you today?',
    te: 'SJT FARMS Coffee కి స్వాగతం! ☕ మా అరకు కాఫీ ఉత్పత్తులను పరిశీలించండి. ఈ రోజు మేము మీకు ఏ విధంగా సహాయపడగలము?',
  },
  catalogue: {
    en: 'Hello SJT FARMS! ☕\nI would like to explore your authentic coffee collection.\nPlease share your product catalogue, available pack sizes (50g, 100g, 250g), and pricing details.\nWebsite: https://sjtfarms.com/shop',
    te: 'నమస్కారం SJT FARMS! ☕\nనేను మీ స్వచ్ఛమైన అరకు కాఫీ ఉత్పత్తుల వివరాలు తెలుసుకోవాలనుకుంటున్నాను.\nదయచేసి మీ కాఫీ కేటలాగ్, అందుబాటులో ఉన్న ప్యాక్ సైజులు (50g, 100g, 250g) మరియు ధరల వివరాలు పంపగలరు.\nవెబ్‌సైట్: https://sjtfarms.com/shop',
  },
  recommendation: {
    en: 'Hello SJT FARMS! ☕\nI would like a personalized coffee recommendation based on my taste preferences (strong decoction filter kaapi, 100% pure Arabica black coffee, or instant).\nCould you please guide me?',
    te: 'నమస్కారం SJT FARMS! ☕\nనా అభిరుచికి తగిన కాఫీ రకాన్ని ఎంచుకోవడంలో మీ సిఫార్సు కావాలి.\nదయచేసి తగిన కాఫీ రకాన్ని సూచించగలరా?',
  },
  orderTracking: {
    en: (orderId: string | number) =>
      `Hello SJT FARMS! ☕\nI would like to enquire about my order status.\nOrder ID: #${orderId}\nPlease share the current fulfillment and courier tracking status.\nWebsite Tracking: https://sjtfarms.com/#track-order?order=${orderId}`,
    te: (orderId: string | number) =>
      `నమస్కారం SJT FARMS! ☕\nనా ఆర్డర్ డెలివరీ స్థితి గురించి తెలుసుకోవాలనుకుంటున్నాను.\nఆర్డర్ నంబర్: #${orderId}\nదయచేసి ప్రస్తుత ట్రాకింగ్ వివరాలు తెలియజేయండి.\nట్రాకింగ్ లింక్: https://sjtfarms.com/#track-order?order=${orderId}`,
  },
  paymentAssistance: {
    en: (orderId?: string | number, amount?: number) => {
      let msg = 'Hello SJT FARMS! ☕\nI need assistance with my UPI payment verification.';
      if (orderId) msg += `\nOrder ID: #${orderId}`;
      if (amount) msg += `\nAmount Due: ₹${amount.toFixed(2)}`;
      msg += '\nPlease help me verify my transaction reference (UTR) and proceed with order processing.';
      return msg;
    },
    te: (orderId?: string | number, amount?: number) => {
      let msg = 'నమస్కారం SJT FARMS! ☕\nనా UPI పేమెంట్ నిర్ధారణ (UTR Verification) లో సహాయం కావాలి.';
      if (orderId) msg += `\nఆర్డర్ నంబర్: #${orderId}`;
      if (amount) msg += `\nమొత్తం: ₹${amount.toFixed(2)}`;
      msg += '\nదయచేసి నా పేమెంట్ వివరాలు సరిచూసి ఆర్డర్ కన్ఫర్మ్ చేయడంలో సహాయం చేయండి.';
      return msg;
    },
  },
  shipping: {
    en: 'Hello SJT FARMS! ☕\nI have a question about shipping and delivery timelines, dispatch across India, or the ₹799 free shipping threshold.\nPlease provide more details.\nWebsite: https://sjtfarms.com/faq',
    te: 'నమస్కారం SJT FARMS! ☕\nషిప్పింగ్ మరియు డెలివరీ వివరాలు, ఉచిత షిప్పింగ్ (₹799 పైన) గురించి సమాచారం కావాలి.\nదయచేసి సహాయం అందించగలరు.\nవెబ్‌సైట్: https://sjtfarms.com/faq',
  },
  cancellation: {
    en: (orderId?: string | number) =>
      `Hello SJT FARMS! ☕\nI need assistance regarding order cancellation or return/refund policy.${orderId ? `\nOrder ID: #${orderId}` : ''}\nPlease connect me with the support team.`,
    te: (orderId?: string | number) =>
      `నమస్కారం SJT FARMS! ☕\nఆర్డర్ రద్దు (Cancellation) లేదా రీఫండ్ విధానం గురించి సహాయం కావాలి.${orderId ? `\nఆర్డర్ నంబర్: #${orderId}` : ''}\nదయచేసి సహాయం చేయగలరు.`,
  },
  customerSupport: {
    en: 'Hello SJT FARMS Concierge! ☕\nI would like to speak directly with your roastery support desk.\nPlease connect me with a team member.',
    te: 'నమస్కారం SJT FARMS! ☕\nనేను మీ కస్టమర్ కేర్ బృందంతో నేరుగా మాట్లాడాలనుకుంటున్నాను.\nదయచేసి సహాయం అందించగలరు.',
  },
};

/**
 * Builds canonical URL for a product with an optional variant query parameter.
 * e.g., https://sjtfarms.com/#product/araku-premium-coffee?variant=250g
 */
export function getProductCanonicalUrl(product: Product, selectedWeight?: string): string {
  const base = `${WHATSAPP_CONFIG.canonicalUrl}/#product/${product.slug || product.id}`;
  if (selectedWeight) {
    return `${base}?variant=${encodeURIComponent(selectedWeight)}`;
  }
  return base;
}

/**
 * Generates product-specific enquiry message in English or Telugu using actual catalogue data.
 */
export function generateProductEnquiryMessage(
  product: Product,
  selectedWeight: string,
  language: WhatsAppLanguage = 'en'
): string {
  const price = product.weightPrices?.[selectedWeight] || product.price;
  const canonicalUrl = getProductCanonicalUrl(product, selectedWeight);

  if (language === 'te') {
    return `నమస్కారం SJT FARMS! ☕
నేను ${product.name}, ${selectedWeight} పట్ల ఆసక్తిగా ఉన్నాను.
ధర: ₹${price}
దయచేసి లభ్యత మరియు డెలివరీ వివరాలు ధృవీకరించగలరు.
Product: ${canonicalUrl}`;
  }

  return `Hello SJT FARMS! ☕
I am interested in ${product.name}, ${selectedWeight}.
Price: ₹${price}
Please confirm availability and delivery details.
Product: ${canonicalUrl}`;
}

/**
 * Generates product sharing message for WhatsApp in English or Telugu.
 */
export function generateProductShareMessage(
  product: Product,
  selectedWeight: string,
  language: WhatsAppLanguage = 'en'
): string {
  const price = product.weightPrices?.[selectedWeight] || product.price;
  const canonicalUrl = getProductCanonicalUrl(product, selectedWeight);

  if (language === 'te') {
    return `☕ SJT FARMS — స్వచ్ఛమైన అరకు కాఫీ
ఉత్పత్తి: ${product.name}
ప్యాక్ సైజ్: ${selectedWeight}
ధర: ₹${price}
షార్ప్ కాఫీ ఆరోమా & రుచికరమైన ఫిల్టర్ కాఫీని ఇక్కడ చూడండి:
${canonicalUrl}`;
  }

  return `☕ SJT FARMS — Authentic Araku Valley Coffee
Product: ${product.name}
Pack size: ${selectedWeight}
Price: ₹${price}
Check out this artisan shade-grown coffee powder from SJT Farms:
${canonicalUrl}`;
}

/**
 * Generates post-order summary message for WhatsApp.
 * Uses only necessary public order details; never leaks tokens, passwords, or private IDs.
 */
export function generateOrderSummaryMessage(
  order: OrderDetails,
  language: WhatsAppLanguage = 'en'
): string {
  const orderId = order.orderNumber || order.orderId;
  const trackingUrl = `${WHATSAPP_CONFIG.canonicalUrl}/#track-order?order=${orderId}`;

  const itemsList = order.items
    .map(
      (item: CartItem) =>
        `• ${item.product.name} (${item.selectedWeight}) × ${item.quantity} = ₹${(
          item.price * item.quantity
        ).toFixed(2)}`
    )
    .join('\n');

  if (language === 'te') {
    return `నమస్కారం SJT FARMS! ☕
నేను వెబ్‌సైట్‌లో ఆర్డర్ నమోదు చేసుకున్నాను:
ఆర్డర్ నంబర్: #${orderId}
తేదీ: ${order.createdAt}

ఆర్డర్ చేసిన వస్తువులు:
${itemsList}

సబ్‌టోటల్: ₹${order.subtotal.toFixed(2)}
డెలివరీ చార్జీ: ${order.delivery === 0 ? 'ఉచితం (FREE)' : `₹${order.delivery.toFixed(2)}`}
${order.discount ? `డిస్కౌంట్: -₹${order.discount.toFixed(2)}\n` : ''}మొత్తం చెల్లించవలసినది: ₹${order.total.toFixed(2)}
పేమెంట్ పద్ధతి: ${order.paymentMethod}
${order.utrNumber ? `సమర్పించిన UTR: ${order.utrNumber}\n` : ''}
ఆర్డర్ ట్రాకింగ్ లింక్: ${trackingUrl}

దయచేసి నా ఆర్డర్ నిర్ధారించి డెసెంబర్/డెలివరీ సమాచారం అందించండి.`;
  }

  return `Hello SJT FARMS! ☕
I have placed an order on your website:
Order ID: #${orderId}
Date: ${order.createdAt}

Order Summary:
${itemsList}

Subtotal: ₹${order.subtotal.toFixed(2)}
Shipping: ${order.delivery === 0 ? 'FREE' : `₹${order.delivery.toFixed(2)}`}
${order.discount ? `Discount: -₹${order.discount.toFixed(2)}\n` : ''}Total Amount: ₹${order.total.toFixed(2)}
Payment Method: ${order.paymentMethod}
${order.utrNumber ? `Submitted UTR: ${order.utrNumber}\n` : ''}
Secure Tracking Link: ${trackingUrl}

Please confirm my order and share roasting & dispatch updates.`;
}
