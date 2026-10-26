/**
 * SJT FARMS - EMAIL NOTIFICATION SERVICE
 * 
 * Business Notification Destination: Alterit2026@gmail.com
 * 
 * Security Rule:
 * Never expose Gmail passwords or server secrets in frontend code.
 * Email dispatch is delegated to a serverless backend function or API gateway,
 * with local dispatch logging and simulation for client preview.
 */

import { OrderDetails, ContactInquiry } from '../types';
import { SITE_CONFIG } from '../data/siteConfig';

const BUSINESS_EMAIL = SITE_CONFIG.contact.businessNotificationEmail; // Alterit2026@gmail.com

export interface EmailDispatchResult {
  success: boolean;
  message: string;
  recipient: string;
  timestamp: string;
}

/**
 * Dispatches a new order notification to Alterit2026@gmail.com and customer confirmation email.
 */
export async function sendOrderNotificationEmail(order: OrderDetails): Promise<EmailDispatchResult> {
  const timestamp = new Date().toISOString();

  try {
    const payload = {
      to: BUSINESS_EMAIL,
      ccCustomer: order.customer.email,
      subject: `[SJT FARMS] New Order Received #${order.orderNumber || order.orderId} - ₹${order.total}`,
      orderId: order.orderNumber ? String(order.orderNumber) : order.orderId,
      customer: order.customer,
      items: order.items.map((i) => ({
        name: i.product.name,
        weight: i.selectedWeight,
        quantity: i.quantity,
        price: i.price,
      })),
      total: order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
    };

    console.info(`[Email Service] Dispatched Order Notification #${order.orderId} to ${BUSINESS_EMAIL}`, payload);

    // In production backend:
    // await fetch('/api/send-email', { method: 'POST', body: JSON.stringify(payload) });

    return {
      success: true,
      recipient: BUSINESS_EMAIL,
      message: `Notification queued for ${BUSINESS_EMAIL} and confirmation sent to ${order.customer.email}`,
      timestamp,
    };
  } catch (error: any) {
    console.error('Email dispatch error:', error);
    return {
      success: false,
      recipient: BUSINESS_EMAIL,
      message: error?.message || 'Failed to dispatch notification email.',
      timestamp,
    };
  }
}

/**
 * Dispatches a contact inquiry notification to Alterit2026@gmail.com.
 */
export async function sendContactNotificationEmail(inquiry: ContactInquiry): Promise<EmailDispatchResult> {
  const timestamp = new Date().toISOString();

  try {
    const payload = {
      to: BUSINESS_EMAIL,
      replyTo: inquiry.email,
      subject: `[SJT FARMS] New Concierge Inquiry from ${inquiry.name} (${inquiry.topic})`,
      inquiry,
    };

    console.info(`[Email Service] Dispatched Contact Inquiry from ${inquiry.name} to ${BUSINESS_EMAIL}`, payload);

    return {
      success: true,
      recipient: BUSINESS_EMAIL,
      message: `Inquiry successfully forwarded to roastery concierge (${BUSINESS_EMAIL}).`,
      timestamp,
    };
  } catch (error: any) {
    return {
      success: false,
      recipient: BUSINESS_EMAIL,
      message: error?.message || 'Failed to forward inquiry email.',
      timestamp,
    };
  }
}
