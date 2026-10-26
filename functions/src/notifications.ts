/**
 * SJT FARMS — WhatsApp Order Notifications Engine
 * 
 * Supports business-initiated notifications for order lifecycle milestones:
 * 1. Order Received
 * 2. Payment Pending Verification (After UTR submission)
 * 3. Payment Verified (Reconciled by administrator)
 * 4. Processing / Packed in Roastery
 * 5. Shipped with live courier tracking details
 * 6. Delivered
 * 7. Cancelled / Refund Processed
 * 
 * Important Meta Rule:
 * Business-initiated notifications outside the 24-hour service window MUST use
 * pre-approved Meta Templates.
 * Free-form messages can be sent within an open 24-hour customer window.
 */

import { MetaWhatsAppClient, TemplateComponent } from './metaClient';
import { getWhatsAppConfig } from './config';

export interface OrderNotificationPayload {
  orderNumber: number | string;
  customerPhone: string;
  customerName: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  courierName?: string;
  courierTrackingId?: string;
  courierTrackingUrl?: string;
  language?: 'en' | 'te';
}

export class OrderNotificationDispatcher {
  private client: MetaWhatsAppClient;
  private config = getWhatsAppConfig();

  constructor(client?: MetaWhatsAppClient) {
    this.client = client || new MetaWhatsAppClient();
  }

  /**
   * Dispatches milestone notification based on order status transition
   */
  async dispatchMilestoneNotification(
    event: 'order_received' | 'payment_pending' | 'payment_verified' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
    order: OrderNotificationPayload
  ): Promise<{ success: boolean; error?: string }> {
    const isTe = order.language === 'te';
    const trackingUrl = `${this.config.storeUrl}/#track-order?order=${order.orderNumber}`;

    // Standard free-form notification for within 24-hour window
    let messageText = '';

    switch (event) {
      case 'order_received':
        messageText = isTe
          ? `☕ *SJT FARMS — ఆర్డర్ నమోదు చేయబడింది*\n\nనమస్కారం ${order.customerName},\nమీ ఆర్డర్ #${order.orderNumber} విజయవంతంగా నమోదైంది.\nమొత్తం: ₹${order.totalAmount}\nచెల్లింపు: ${order.paymentMethod}\n\nట్రాకింగ్ పోర్టల్:\n🔗 ${trackingUrl}`
          : `☕ *SJT FARMS — Order Received*\n\nHello ${order.customerName},\nYour coffee order #${order.orderNumber} has been received.\nAmount: ₹${order.totalAmount}\nPayment: ${order.paymentMethod}\n\nLive Order Tracking:\n🔗 ${trackingUrl}`;
        break;

      case 'payment_pending':
        messageText = isTe
          ? `💳 *SJT FARMS — పేమెంట్ వెరిఫికేషన్ పెండింగ్‌లో ఉంది*\n\nనమస్కారం ${order.customerName},\nమీ ఆర్డర్ #${order.orderNumber} కు సమర్పించిన UTR రసీదు అందింది. మా బ్యాంక్ నిర్వాహకులు బ్యాంక్ స్టేట్‌మెంట్‌తో సరిచూసిన తర్వాత ఆర్డర్ కన్ఫర్మ్ చేయబడుతుంది.`
          : `💳 *SJT FARMS — Payment Pending Verification*\n\nHello ${order.customerName},\nWe received your UTR reference for Order #${order.orderNumber}. Our accounts desk will verify it against our bank records before final confirmation.`;
        break;

      case 'payment_verified':
        messageText = isTe
          ? `✅ *SJT FARMS — పేమెంట్ విజయవంతంగా ధృవీకరించబడింది!*\n\nనమస్కారం ${order.customerName},\nఆర్డర్ #${order.orderNumber} పేమెంట్ ₹${order.totalAmount} ధృవీకరించబడింది. మా అరకు రోస్టరీలో మీ కాఫీ ప్యాకింగ్ ప్రారంభమవుతుంది.`
          : `✅ *SJT FARMS — Payment Verified!*\n\nHello ${order.customerName},\nYour payment of ₹${order.totalAmount} for Order #${order.orderNumber} has been confirmed. Fresh roasting and packing has begun!`;
        break;

      case 'processing':
        messageText = isTe
          ? `☕ *SJT FARMS — రోస్టరీలో సిద్ధమవుతోంది*\n\nఆర్డర్ #${order.orderNumber} మా అరకు వ్యాలీ రోస్టరీలో తాజా బ్యాచ్‌గా రోస్ట్ చేయబడి ప్యాక్ చేయబడుతోంది.`
          : `☕ *SJT FARMS — Roasting & Packing*\n\nOrder #${order.orderNumber} is being hand-crafted and sealed in safety glass jars at our Araku roastery.`;
        break;

      case 'shipped':
        messageText = isTe
          ? `🚚 *SJT FARMS — ఆర్డర్ డిస్పాచ్ చేయబడింది!*\n\nనమస్కారం ${order.customerName},\nఆర్డర్ #${order.orderNumber} డిస్పాచ్ అయింది.\nకొరియర్: ${order.courierName || 'Express Courier'}\nట్రాకింగ్ నంబర్: ${order.courierTrackingId || 'N/A'}\n\nలైవ్ ట్రాకింగ్ లింక్:\n🔗 ${order.courierTrackingUrl || trackingUrl}`
          : `🚚 *SJT FARMS — Dispatched!*\n\nHello ${order.customerName},\nYour order #${order.orderNumber} is on its way!\nCourier: ${order.courierName || 'Express Courier'}\nTracking ID: ${order.courierTrackingId || 'N/A'}\n\nTrack Shipment:\n🔗 ${order.courierTrackingUrl || trackingUrl}`;
        break;

      case 'delivered':
        messageText = isTe
          ? `🎉 *SJT FARMS — ఆర్డర్ డెలివరీ పూర్తయింది!*\n\nనమస్కారం ${order.customerName},\nమీ ఆర్డర్ #${order.orderNumber} డెలివరీ అయింది. తాజా అరకు కాఫీని ఆస్వాదించండి! ☕`
          : `🎉 *SJT FARMS — Order Delivered!*\n\nHello ${order.customerName},\nYour order #${order.orderNumber} has been delivered. Enjoy your authentic cup of Araku coffee! ☕`;
        break;

      case 'cancelled':
        messageText = isTe
          ? `⚠️ *SJT FARMS — ఆర్డర్ రద్దు చేయబడింది*\n\nఆర్డర్ #${order.orderNumber} రద్దు చేయబడింది. రీఫండ్ సంబంధించిన వివరాలు 3–5 బ్యాంకు పనిదినాల్లో మీ ఖాతాకు జమ చేయబడతాయి.`
          : `⚠️ *SJT FARMS — Order Cancelled*\n\nOrder #${order.orderNumber} has been cancelled. Any eligible refund will be credited to your originating account within 3–5 business days.`;
        break;
    }

    // Attempt direct send within service window
    const textResult = await this.client.sendTextMessage(order.customerPhone, messageText, true);
    if (textResult.success) {
      return { success: true };
    }

    // If outside 24h window (error 131047), fallback to registered template
    const templateName = `sjt_order_${event}`;
    const components: TemplateComponent[] = [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: order.customerName },
          { type: 'text', text: String(order.orderNumber) },
          { type: 'text', text: String(order.totalAmount) },
        ],
      },
    ];

    const templateResult = await this.client.sendTemplateMessage(
      order.customerPhone,
      templateName,
      isTe ? 'te' : 'en',
      components
    );

    return { success: templateResult.success, error: templateResult.error };
  }
}
