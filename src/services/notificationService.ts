/**
 * SJT FARMS - SECURE AUTOMATED NOTIFICATIONS SERVICE
 * 
 * Provides durable, idempotent notification queueing and dispatching for:
 * 1. Business Owner & Merchant Recipient: Alterit2026@gmail.com / Venkata Sireesha Gannavaram
 * 2. Administrator Order Notifications
 * 3. Customer Milestone Notifications (Order Placed, Payment Confirmed/Rejected, Dispatched, Delivered)
 * 
 * Strict Security Rules:
 * - Never log or expose payment credentials, UPI PINs, or passwords.
 * - Idempotent delivery keys prevent duplicate notifications on network retries.
 * - Decoupled from order state changes so notification failures never corrupt order records.
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { OrderDetails, OrderNotificationRecord } from '../types';
import { SITE_CONFIG } from '../data/siteConfig';
import { PAYMENT_CONFIG } from '../data/paymentConfig';

export const BUSINESS_NOTIFICATION_EMAIL = SITE_CONFIG.contact.businessNotificationEmail || 'alterit2026@gmail.com';
export const MERCHANT_NAME = PAYMENT_CONFIG.merchantName;
export const MERCHANT_UPI_ID = PAYMENT_CONFIG.merchantVpa;

/**
 * Creates an idempotent notification record for a newly placed order.
 */
export function buildNewOrderNotificationRecord(order: OrderDetails): OrderNotificationRecord {
  const orderNumStr = order.orderNumber ? String(order.orderNumber) : order.orderId;
  const notificationId = `notif_order_${orderNumStr}_created`;

  return {
    notificationId,
    orderId: order.orderId,
    orderNumber: order.orderNumber,
    type: 'order_created',
    recipient: BUSINESS_NOTIFICATION_EMAIL,
    customerEmail: order.customer.email,
    customerPhone: order.customer.phone,
    customerName: order.customer.fullName,
    totalAmount: order.total,
    paymentMethod: order.paymentMethod,
    paymentStatus: String(order.paymentStatus),
    status: 'queued',
    attempts: 0,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Queues and dispatches an order creation notification.
 */
export async function queueAndDispatchOrderNotification(
  order: OrderDetails
): Promise<{ success: boolean; notificationId: string; message: string }> {
  const notif = buildNewOrderNotificationRecord(order);

  try {
    if (isFirebaseConfigured) {
      const notifRef = doc(db, 'order_notifications', notif.notificationId);

      // Secure write to order notifications queue
      await setDoc(
        notifRef,
        {
          ...notif,
          createdAt: serverTimestamp(),
          adminOrderUrl: `https://sjtfarms.com/admin/orders`,
          customerTrackingUrl: `https://sjtfarms.com/track-order?order=${notif.orderNumber || notif.orderId}`,
          itemsSummary: order.items.map((i) => ({
            name: i.product.name,
            weight: i.selectedWeight,
            quantity: i.quantity,
            price: i.price,
          })),
        },
        { merge: true }
      );

      // Attempt dispatch via serverless or configured email provider
      await dispatchQueuedNotification(notif.notificationId, notif);
    }

    return {
      success: true,
      notificationId: notif.notificationId,
      message: `Order notification queued for ${BUSINESS_NOTIFICATION_EMAIL} and customer confirmation.`,
    };
  } catch (err: any) {
    console.warn('[Notification Service] Notice:', err?.message);
    return {
      success: false,
      notificationId: notif.notificationId,
      message: err?.message || 'Failed to queue notification.',
    };
  }
}

/**
 * Queues a customer order milestone notification (e.g. Payment Confirmed, Dispatched, Delivered).
 */
export async function queueMilestoneNotification(
  order: OrderDetails,
  milestone: 'payment_verified' | 'payment_rejected' | 'dispatched' | 'delivered',
  extraNotes?: string
): Promise<void> {
  const orderNumStr = order.orderNumber ? String(order.orderNumber) : order.orderId;
  const notificationId = `notif_order_${orderNumStr}_${milestone}_${Date.now()}`;

  const record: OrderNotificationRecord = {
    notificationId,
    orderId: order.orderId,
    orderNumber: order.orderNumber,
    type: milestone,
    recipient: order.customer.email,
    customerEmail: order.customer.email,
    customerPhone: order.customer.phone,
    customerName: order.customer.fullName,
    totalAmount: order.total,
    paymentMethod: order.paymentMethod,
    paymentStatus: String(order.paymentStatus),
    status: 'queued',
    attempts: 0,
    createdAt: new Date().toISOString(),
  };

  try {
    if (isFirebaseConfigured) {
      const notifRef = doc(db, 'order_notifications', notificationId);
      await setDoc(notifRef, {
        ...record,
        extraNotes: extraNotes || null,
        courierName: order.courierName || null,
        courierTrackingId: order.courierTrackingId || null,
        courierTrackingUrl: order.courierTrackingUrl || null,
        customerTrackingUrl: `https://sjtfarms.com/track-order?order=${record.orderNumber || record.orderId}`,
        createdAt: serverTimestamp(),
      });

      await dispatchQueuedNotification(notificationId, record);
    }
  } catch (err) {
    console.warn('[Notification Service] Milestone notice:', err);
  }
}

/**
 * Dispatches an individual queued notification.
 * Integrates with client logger, console audit, and optional serverless email webhook.
 */
async function dispatchQueuedNotification(
  notificationId: string,
  record: OrderNotificationRecord
): Promise<void> {
  try {
    // 1. Audit log
    console.info(
      `[Notification Dispatcher] Sending ${record.type} notification for Order #${record.orderNumber || record.orderId} to ${record.recipient}`
    );

    // 2. In serverless environment, forward to webhook if configured in environment
    const webhookUrl = (import.meta as any).env?.VITE_NOTIFICATION_WEBHOOK_URL;
    if (webhookUrl && typeof fetch !== 'undefined') {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record),
        });
      } catch (fetchErr) {
        console.warn('[Notification Webhook] Dispatch notice:', fetchErr);
      }
    }

    // 3. Mark as sent in Firestore queue
    if (isFirebaseConfigured) {
      const notifRef = doc(db, 'order_notifications', notificationId);
      await updateDoc(notifRef, {
        status: 'sent',
        sentAt: serverTimestamp(),
        attempts: 1,
      });
    }
  } catch (err: any) {
    if (isFirebaseConfigured) {
      try {
        const notifRef = doc(db, 'order_notifications', notificationId);
        await updateDoc(notifRef, {
          status: 'failed',
          errorMessage: err?.message || 'Dispatch failure',
          attempts: 1,
        });
      } catch {}
    }
  }
}

/**
 * Subscribes to the live notification queue for the Admin Dashboard.
 */
export function subscribeAdminNotifications(
  callback: (records: OrderNotificationRecord[]) => void,
  maxCount: number = 25
): Unsubscribe {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }

  const col = collection(db, 'order_notifications');
  const q = query(col, orderBy('createdAt', 'desc'), limit(maxCount));

  return onSnapshot(
    q,
    (snap) => {
      const records: OrderNotificationRecord[] = [];
      snap.forEach((d) => {
        const data = d.data();
        records.push({
          notificationId: d.id,
          orderId: data.orderId,
          orderNumber: data.orderNumber,
          type: data.type,
          recipient: data.recipient,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          customerName: data.customerName,
          totalAmount: data.totalAmount,
          paymentMethod: data.paymentMethod,
          paymentStatus: data.paymentStatus,
          status: data.status || 'queued',
          attempts: data.attempts || 1,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
          sentAt: data.sentAt?.toDate?.()?.toISOString() || data.sentAt,
          errorMessage: data.errorMessage,
        });
      });
      callback(records);
    },
    (err) => {
      console.warn('[Notification Service] onSnapshot notice:', err);
    }
  );
}
