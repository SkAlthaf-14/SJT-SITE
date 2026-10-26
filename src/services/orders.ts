/**
 * SJT FARMS - SECURE ORDERS & SEQUENTIAL ORDER ID SERVICE
 * 
 * Key Requirements:
 * 1. Customer-facing sequential Order IDs starting strictly at 101 (101, 102, 103...).
 * 2. Atomic allocation via Cloud Firestore transaction with protected counter document.
 * 3. Separation of Firestore document ID (order_101) from customer-facing Order ID (101 / Order #101).
 * 4. Preservation of historical orders (e.g., legacy SJT-* prefixes).
 * 5. Strict payment verification states with UTR audit trail.
 * 6. Automated business owner & customer milestone notifications.
 */

import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  runTransaction,
  arrayUnion,
  limit,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from './firebase';
import { OrderDetails, OrderStatus, PaymentStatus, OrderAuditEntry } from '../types';
import { queueAndDispatchOrderNotification } from './notificationService';
import { getProductById, getProductVariantJarImage } from '../data/products';

const ORDERS_STORAGE_KEY = 'sjt_customer_orders';
const ORDER_COUNTER_DOC = 'order_counter';

export interface FirestoreOrderItem {
  productId: string;
  name: string;
  selectedWeight: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface FirestoreOrderDocument {
  firestoreDocId: string;
  orderId: string; // Customer-facing ID e.g. "101"
  orderNumber: number; // Sequential integer e.g. 101
  displayId: string; // Formatted e.g. "Order #101"
  userId: string;
  customerName: string;
  customerEmail: string;
  phone: string;
  items: FirestoreOrderItem[];
  subtotal: number;
  shippingAmount: number;
  totalAmount: number;
  paymentId: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
  utrNumber?: string;
  paymentVerificationStatus?:
    | 'awaiting_payment'
    | 'details_submitted'
    | 'verification_pending'
    | 'confirmed'
    | 'paid'
    | 'rejected'
    | 'payment_failed'
    | 'refund_pending'
    | 'refunded';
  paymentRejectionReason?: string;
  courierName?: string;
  courierTrackingId?: string;
  courierTrackingUrl?: string;
  packedAt?: any;
  shippedAt?: any;
  deliveredAt?: any;
  statusHistory?: OrderAuditEntry[];
  paymentAudit?: {
    verifiedBy?: string;
    verifiedAt?: any;
    rejectionReason?: string;
    notes?: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  createdAt: any;
  updatedAt: any;
  // Backward compatibility fields for storefront rendering
  customer?: {
    userId?: string;
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  total?: number;
  delivery?: number;
  discount?: number;
  paymentMethod?: string;
}

/**
 * Validates UTR / Bank Reference Number format.
 * Standard Indian UPI reference numbers are 12 digits (e.g. 423589123456).
 */
export function validateUtrNumber(utr: string): { valid: boolean; message?: string } {
  const clean = utr.trim().replace(/\s+/g, '');
  if (!clean) {
    return { valid: false, message: 'Please enter the 12-digit UPI / UTR transaction reference number.' };
  }
  // Standard 12-digit numeric check
  if (/^\d{12}$/.test(clean)) {
    return { valid: true };
  }
  // Allow 8-20 alphanumeric characters for specific banking reference variants
  if (clean.length >= 8 && clean.length <= 22) {
    return { valid: true };
  }
  return {
    valid: false,
    message: 'Invalid UTR format. Standard UPI UTR numbers are 12 numeric digits (e.g. 423589123456).',
  };
}

/**
 * Recursively removes all undefined properties from a Firestore data object.
 * Cloud Firestore strictly rejects payloads containing undefined values.
 */
export function sanitizeFirestorePayload<T extends Record<string, any>>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;
  // Preserve Firestore FieldValues (such as serverTimestamp(), arrayUnion(), deleteField(), etc.)
  if ((obj as any)._methodName || (obj.constructor && obj.constructor.name === 'FieldValue')) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => (typeof item === 'object' && item !== null ? sanitizeFirestorePayload(item) : item)) as unknown as T;
  }

  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue; // Strictly omit undefined properties from Firestore documents
    }
    if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
      if ((value as any)._methodName || (value.constructor && value.constructor.name === 'FieldValue')) {
        clean[key] = value;
      } else {
        clean[key] = sanitizeFirestorePayload(value);
      }
    } else {
      clean[key] = value;
    }
  }
  return clean as T;
}

/**
 * Formats a customer-facing order ID consistently.
 * Examples: 101 -> "Order #101", "101" -> "Order #101", "#101" -> "Order #101", "SJT-123456" -> "Order #SJT-123456"
 */
export function formatDisplayOrderId(idOrNum: string | number): string {
  if (typeof idOrNum === 'number') {
    return `Order #${idOrNum}`;
  }
  const clean = String(idOrNum || '').trim();
  if (!clean) return 'Order #--';
  if (clean.startsWith('Order #')) return clean;
  if (clean.startsWith('#')) return `Order ${clean}`;
  return `Order #${clean}`;
}

/**
 * Creates and persists a customer order strictly in Cloud Firestore using atomic transaction.
 * Allocates sequential Order ID starting at 101.
 */
export async function createOrder(
  order: Omit<OrderDetails, 'orderId'> & { orderId?: string },
  authUid?: string
): Promise<{
  success: boolean;
  orderId: string;
  orderNumber: number;
  displayId: string;
  order?: OrderDetails;
  message: string;
}> {
  try {
    if (!order.customer.email || !order.customer.fullName) {
      throw new Error('Incomplete customer details. Name and email are required.');
    }

    // Always prefer the authoritative Firebase Auth current user UID if available
    const currentAuthUid = auth.currentUser?.uid || authUid || (order.customer as any)?.userId;
    const effectiveUserId = currentAuthUid || 'guest';

    // Safe diagnostic logging (no PII, no credentials, no card numbers)
    console.info('[Checkout Trace] Starting order creation', {
      isAuthenticated: !!auth.currentUser,
      authUidPrefix: auth.currentUser?.uid ? `${auth.currentUser.uid.substring(0, 5)}...` : 'none',
      passedUidPrefix: authUid ? `${authUid.substring(0, 5)}...` : 'none',
      effectiveUserIdPrefix: effectiveUserId !== 'guest' ? `${effectiveUserId.substring(0, 5)}...` : 'guest',
      isFirebaseConfigured,
    });

    const isCod = order.paymentMethod.toLowerCase().includes('cash on delivery') || order.paymentMethod.toLowerCase().includes('cod');
    const isUpi = order.paymentMethod.toLowerCase().includes('upi') || order.paymentMethod.toLowerCase().includes('phonepe');
    const cleanUtr = order.utrNumber ? order.utrNumber.trim() : '';
    const hasUtr = cleanUtr.length >= 6;

    let paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' = 'pending';
    let paymentVerificationStatus: FirestoreOrderDocument['paymentVerificationStatus'] = 'awaiting_payment';

    if (isUpi) {
      // Manual UPI without UTR starts as awaiting_payment; with UTR becomes verification_pending
      paymentVerificationStatus = hasUtr ? 'verification_pending' : 'awaiting_payment';
      paymentStatus = hasUtr ? 'pending' : 'pending';
    } else if (isCod) {
      paymentVerificationStatus = 'awaiting_payment';
      paymentStatus = 'pending';
    } else {
      paymentVerificationStatus = 'awaiting_payment';
      paymentStatus = 'pending';
    }

    const itemsFormatted: FirestoreOrderItem[] = order.items.map((i) => ({
      productId: i.product.id || 'coffee-roast',
      name: i.product.name || 'SJT Roasted Coffee',
      selectedWeight: i.selectedWeight || '100g',
      price: Number(i.price) || 0,
      quantity: Number(i.quantity) || 1,
      imageUrl: getProductVariantJarImage(i.product, i.selectedWeight),
    }));

    let allocatedOrderNumber = 101;
    let firestoreDocId = 'order_101';
    let customerOrderId = '101';
    let displayId = 'Order #101';

    if (isFirebaseConfigured) {
      const counterRef = doc(db, 'counters', ORDER_COUNTER_DOC);

      console.info('[Checkout Trace] Initiating atomic transaction on:', {
        counterDoc: `counters/${ORDER_COUNTER_DOC}`,
      });

      // ATOMIC TRANSACTION: Allocate sequential counter and create order document atomically
      await runTransaction(db, async (transaction) => {
        const counterSnap = await transaction.get(counterRef);
        let currentNum = 100;
        if (counterSnap.exists()) {
          const val = Number(counterSnap.data()?.currentOrderNumber);
          if (!isNaN(val) && val >= 100) {
            currentNum = val;
          }
        }

        allocatedOrderNumber = currentNum + 1;
        firestoreDocId = `order_${allocatedOrderNumber}`;
        customerOrderId = String(allocatedOrderNumber);
        displayId = `Order #${allocatedOrderNumber}`;

        const paymentId = `PAY-${allocatedOrderNumber}`;
        const orderRef = doc(db, 'orders', firestoreDocId);

        console.info('[Checkout Trace] Committing transaction writes:', {
          counterDoc: `counters/${ORDER_COUNTER_DOC}`,
          orderDoc: `orders/${firestoreDocId}`,
          paymentDoc: `payments/${paymentId}`,
          allocatedOrderNumber,
          hasUtr: Boolean(cleanUtr),
        });

        const initialAudit: OrderAuditEntry = {
          status: 'Order Placed',
          timestamp: new Date().toISOString(),
          actor: 'Customer',
          note: `Order placed via online checkout. Payment Method: ${order.paymentMethod}`,
        };

        const firestoreOrder: FirestoreOrderDocument = {
          firestoreDocId,
          orderId: customerOrderId,
          orderNumber: allocatedOrderNumber,
          displayId,
          userId: effectiveUserId,
          customerName: (order.customer.fullName || '').trim(),
          customerEmail: (order.customer.email || '').trim().toLowerCase(),
          phone: (order.customer.phone || '').trim(),
          items: itemsFormatted,
          subtotal: Number(order.subtotal) || 0,
          shippingAmount: Number(order.delivery) || 0,
          totalAmount: Number(order.total) || 0,
          paymentId,
          paymentStatus,
          paymentVerificationStatus,
          orderStatus: 'confirmed',
          statusHistory: [initialAudit],
          shippingAddress: {
            street: (order.customer.address || '').trim(),
            city: (order.customer.city || '').trim(),
            state: (order.customer.state || '').trim(),
            pincode: (order.customer.pincode || '').trim(),
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          customer: {
            userId: effectiveUserId,
            fullName: (order.customer.fullName || '').trim(),
            email: (order.customer.email || '').trim().toLowerCase(),
            phone: (order.customer.phone || '').trim(),
            address: (order.customer.address || '').trim(),
            city: (order.customer.city || '').trim(),
            state: (order.customer.state || '').trim(),
            pincode: (order.customer.pincode || '').trim(),
          },
          total: Number(order.total) || 0,
          delivery: Number(order.delivery) || 0,
          discount: Number(order.discount) || 0,
          paymentMethod: order.paymentMethod,
        };

        // Only include utrNumber if a non-empty reference was actually submitted
        if (cleanUtr) {
          firestoreOrder.utrNumber = cleanUtr;
        }

        const paymentRecord: Record<string, any> = {
          paymentId,
          orderId: customerOrderId,
          firestoreDocId,
          userId: effectiveUserId,
          amount: Number(order.total) || 0,
          paymentMethod: order.paymentMethod,
          transactionId: cleanUtr || `TXN-${allocatedOrderNumber}`,
          status: paymentVerificationStatus || 'awaiting_payment',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        if (cleanUtr) {
          paymentRecord.utrNumber = cleanUtr;
        }

        // 1. Increment counter (strictly sanitized)
        transaction.set(
          counterRef,
          sanitizeFirestorePayload({
            currentOrderNumber: allocatedOrderNumber,
            lastAllocatedOrderId: customerOrderId,
            updatedAt: serverTimestamp(),
          }),
          { merge: true }
        );

        // 2. Write Order (strictly sanitized to guarantee zero undefined values)
        transaction.set(orderRef, sanitizeFirestorePayload(firestoreOrder));

        // 3. Write initial Payment record (strictly sanitized)
        const payRef = doc(db, 'payments', paymentId);
        transaction.set(payRef, sanitizeFirestorePayload(paymentRecord));
      });

      console.info('[Checkout Trace] Atomic transaction committed successfully.');

      // Stock reduction after order commit: only attempted if caller is authenticated admin
      // to avoid triggering permission errors against admin-only /products collection
      const isCallerAdmin = Boolean(auth.currentUser && (auth.currentUser as any).role === 'admin');
      if (isCallerAdmin) {
        for (const item of order.items) {
          try {
            const prodRef = doc(db, 'products', item.product.id);
            const prodSnap = await getDoc(prodRef);
            if (prodSnap.exists()) {
              const currentStock = prodSnap.data()?.stock || 0;
              const newStock = Math.max(0, currentStock - item.quantity);
              await updateDoc(prodRef, {
                stock: newStock,
                updatedAt: serverTimestamp(),
              });
            }
          } catch (stockErr) {
            console.warn('[Orders Service] Stock update notice:', stockErr);
          }
        }
      }
    } else {
      // Local development fallback
      const locals = getLocalOrders();
      const maxNum = locals.reduce((m, o) => Math.max(m, o.orderNumber || 100), 100);
      allocatedOrderNumber = maxNum + 1;
      customerOrderId = String(allocatedOrderNumber);
      displayId = `Order #${allocatedOrderNumber}`;
      firestoreDocId = `order_${allocatedOrderNumber}`;
    }

    const finalOrder: OrderDetails = {
      ...order,
      orderId: customerOrderId,
      orderNumber: allocatedOrderNumber,
      displayId,
      statusHistory: [
        {
          status: 'Order Placed',
          timestamp: new Date().toISOString(),
          actor: 'Customer',
          note: `Order placed via online checkout. Payment Method: ${order.paymentMethod}`,
        },
      ],
      paymentStatus:
        paymentVerificationStatus === 'verification_pending'
          ? 'Verification Pending'
          : isCod
          ? 'Cash on Delivery'
          : 'Awaiting Payment',
      paymentVerificationStatus,
    };

    if (cleanUtr) {
      finalOrder.utrNumber = cleanUtr;
    }

    // Cache locally
    const existingOrders = getLocalOrders();
    const updated = [finalOrder, ...existingOrders.filter((o) => o.orderId !== finalOrder.orderId)];
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));

    // Automated notification dispatch
    queueAndDispatchOrderNotification(finalOrder).catch((e) =>
      console.warn('[Orders Service] Notification queue notice:', e)
    );

    return {
      success: true,
      orderId: customerOrderId,
      orderNumber: allocatedOrderNumber,
      displayId,
      order: finalOrder,
      message: `Order #${allocatedOrderNumber} placed successfully!`,
    };
  } catch (error: any) {
    // Safe diagnostic logging (no PII, credentials, or card details)
    console.error('[Checkout Trace] Order creation failed:', {
      code: error?.code,
      message: error?.message,
      authStatus: auth.currentUser ? 'authenticated' : 'unauthenticated',
      authUidPrefix: auth.currentUser?.uid ? `${auth.currentUser.uid.substring(0, 5)}...` : 'none',
    });

    let displayMessage = error?.message || 'Unable to place order. Please check connection and try again.';
    if (error?.code === 'permission-denied' || String(error?.message).toLowerCase().includes('insufficient permissions')) {
      displayMessage = 'Firebase Permission Denied: The atomic order counter and order creation rules must be deployed in Firebase Console to complete order allocation.';
    }

    return {
      success: false,
      orderId: '',
      orderNumber: 0,
      displayId: '',
      message: displayMessage,
    };
  }
}

/**
 * Subscribes to real-time orders for an authenticated customer.
 */
export function subscribeCustomerOrders(
  userId: string,
  userEmail: string | undefined,
  callback: (orders: OrderDetails[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!userId) {
    callback([]);
    return () => {};
  }

  const ordersCol = collection(db, 'orders');
  const q = query(ordersCol, where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const ordersList: OrderDetails[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        ordersList.push(mapFirestoreOrderToDetails(docSnap.id, d));
      });

      // Sort descending by created date
      ordersList.sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      callback(ordersList);
    },
    (err) => {
      console.warn('[Orders Service] Customer orders onSnapshot notice:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Canonical Payment Statuses
 */
export type CanonicalPaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

/**
 * Canonical Payment Verification Statuses
 */
export type CanonicalVerificationStatus =
  | 'awaiting_payment'
  | 'details_submitted'
  | 'verification_pending'
  | 'paid'
  | 'rejected'
  | 'under_review'
  | 'refund_pending'
  | 'refunded';

/**
 * Normalizes any legacy or provider-specific payment status into the canonical model.
 * Preserves backward compatibility with existing Firestore documents without requiring data migrations.
 */
export function normalizePaymentStatus(status?: string): CanonicalPaymentStatus {
  if (!status) return 'pending';
  const clean = status.trim().toLowerCase();
  if (['paid', 'confirmed', 'payment_succeeded', 'payment confirmed', 'payment_approved', 'payment approved'].includes(clean)) return 'paid';
  if (['failed', 'rejected', 'payment_failed', 'payment rejected', 'payment_rejected'].includes(clean)) return 'failed';
  if (['refunded', 'refund initiated', 'refund_processing'].includes(clean)) return 'refunded';
  return 'pending';
}

/**
 * Normalizes any legacy or provider-specific verification status into the canonical model.
 * Resolves inconsistencies:
 * - 'payment_pending_verification' -> 'verification_pending'
 * - 'confirmed' -> 'paid'
 * - 'payment_succeeded' -> 'paid'
 * - 'payment_failed' -> 'rejected'
 */
export function normalizeVerificationStatus(status?: string): CanonicalVerificationStatus {
  if (!status) return 'awaiting_payment';
  const clean = status.trim().toLowerCase();
  if (['paid', 'confirmed', 'payment_succeeded', 'payment_approved', 'payment approved'].includes(clean)) return 'paid';
  if (['rejected', 'payment_failed', 'payment_rejected', 'payment rejected'].includes(clean)) return 'rejected';
  if (['verification_pending', 'payment_pending_verification', 'details_submitted', 'payment details submitted'].includes(clean)) return 'verification_pending';
  if (['under_review', 'payment flagged'].includes(clean)) return 'under_review';
  if (['refund_pending'].includes(clean)) return 'refund_pending';
  if (['refunded'].includes(clean)) return 'refunded';
  return 'awaiting_payment';
}

/**
 * Normalizes Firestore order document to UI OrderDetails interface.
 */
export function mapFirestoreOrderToDetails(id: string, d: any): OrderDetails {
  const items = Array.isArray(d.items)
    ? d.items.map((i: any) => {
        const prodId = i.productId || i.id || 'coffee-powder';
        const staticMatch = getProductById(prodId);
        const selectedWeight = i.selectedWeight || '100g';
        const resolvedImage = i.imageUrl || getProductVariantJarImage(staticMatch || prodId, selectedWeight);
        return {
          product: {
            id: prodId,
            name: i.name || staticMatch?.name || 'SJT Estate Coffee',
            slug: staticMatch?.slug || prodId,
            category: staticMatch?.category || ('Coffee Powder' as const),
            tagline: staticMatch?.tagline || 'Farm to Cup',
            description: staticMatch?.description || '',
            longDescription: staticMatch?.longDescription || '',
            price: Number(i.price) || staticMatch?.price || 0,
            stock: staticMatch?.stock || 50,
            featured: staticMatch?.featured || false,
            rating: staticMatch?.rating || 5,
            reviewCount: staticMatch?.reviewCount || 1,
            images: resolvedImage
              ? [resolvedImage, ...(staticMatch?.images || [])]
              : (staticMatch?.images || ['/images/products/jars/araku-instant-100g-jar.png']),
            weights: staticMatch?.weights || [selectedWeight],
            weightPrices: staticMatch?.weightPrices || {},
            jarImages: staticMatch?.jarImages,
            labelImages: staticMatch?.labelImages,
            labelSvgs: staticMatch?.labelSvgs,
            strength: staticMatch?.strength || ('Medium' as const),
            roastLevel: staticMatch?.roastLevel || 'Medium Dark',
            flavourNotes: staticMatch?.flavourNotes || [],
            brewMethods: staticMatch?.brewMethods || [],
            ingredients: staticMatch?.ingredients || '100% Pure Coffee Beans',
            shippingInfo: staticMatch?.shippingInfo || 'Directly from Estate',
          },
          selectedWeight,
          price: Number(i.price) || 0,
          quantity: Number(i.quantity) || 1,
        };
      })
    : [];

  const rawStatus = (d.orderStatus || 'confirmed').toLowerCase();
  let status: OrderStatus = 'Confirmed';
  if (rawStatus === 'pending') status = 'Pending';
  else if (rawStatus === 'processing') status = 'Processing';
  else if (rawStatus === 'packed') status = 'Packed';
  else if (rawStatus === 'shipped') status = 'Shipped';
  else if (rawStatus === 'out for delivery' || rawStatus === 'out_for_delivery') status = 'Out for Delivery';
  else if (rawStatus === 'delivered') status = 'Delivered';
  else if (rawStatus === 'cancelled') status = 'Cancelled';

  const rawPay = (d.paymentStatus || 'pending').toLowerCase();
  const rawVerify = (d.paymentVerificationStatus || '').toLowerCase();
  const canonicalPay = normalizePaymentStatus(d.paymentStatus);
  const canonicalVerify = normalizeVerificationStatus(d.paymentVerificationStatus);

  let payStatus: PaymentStatus = 'Awaiting Payment';

  const isCodOrder = Boolean(
    d.paymentMethod?.toLowerCase().includes('cod') ||
    d.paymentMethod?.toLowerCase().includes('cash on delivery')
  );

  if (
    rawPay === 'payment_approved' ||
    rawPay === 'payment approved' ||
    canonicalPay === 'paid' ||
    canonicalVerify === 'paid'
  ) {
    payStatus = 'Payment Approved';
  } else if (canonicalPay === 'failed' || canonicalVerify === 'rejected') {
    payStatus = 'Payment Rejected';
  } else if (canonicalPay === 'refunded' || canonicalVerify === 'refunded') {
    payStatus = 'Refund Initiated';
  } else if (canonicalVerify === 'verification_pending') {
    payStatus = 'Verification Pending';
  } else if (canonicalVerify === 'details_submitted' || (d.utrNumber && canonicalPay === 'pending')) {
    payStatus = 'Payment Details Submitted';
  } else if (isCodOrder) {
    payStatus = 'Cash on Delivery';
  } else if (canonicalPay === 'pending') {
    payStatus = 'Awaiting Payment';
  }

  const rawCreated = d.createdAt;
  let createdAtTimestamp: number | undefined = undefined;
  if (rawCreated?.toMillis) {
    createdAtTimestamp = rawCreated.toMillis();
  } else if (rawCreated?.toDate) {
    createdAtTimestamp = rawCreated.toDate().getTime();
  } else if (typeof rawCreated === 'string') {
    const parsed = new Date(rawCreated).getTime();
    if (!isNaN(parsed)) createdAtTimestamp = parsed;
  }

  const dateStr = d.createdAt?.toDate
    ? d.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : d.createdAt || new Date().toLocaleDateString('en-IN');

  const orderNum = d.orderNumber ? Number(d.orderNumber) : undefined;
  const orderId = d.orderId || id.replace('order_', '');
  const displayId = d.displayId || formatDisplayOrderId(orderNum || orderId);

  return {
    firestoreDocId: id,
    orderId,
    orderNumber: orderNum,
    displayId,
    items,
    subtotal: Number(d.subtotal) || Number(d.totalAmount) || 0,
    discount: Number(d.discount) || 0,
    delivery: Number(d.shippingAmount) || Number(d.delivery) || 0,
    total: Number(d.totalAmount) || Number(d.total) || 0,
    customer: {
      fullName: d.customerName || d.customer?.fullName || 'Customer',
      email: d.customerEmail || d.customer?.email || '',
      phone: d.phone || d.customer?.phone || '',
      address: d.shippingAddress?.street || d.customer?.address || '',
      city: d.shippingAddress?.city || d.customer?.city || '',
      state: d.shippingAddress?.state || d.customer?.state || 'Karnataka',
      pincode: d.shippingAddress?.pincode || d.customer?.pincode || '',
    },
    paymentMethod: d.paymentMethod || 'UPI / PhonePe',
    paymentStatus: payStatus,
    orderStatus: status,
    createdAt: dateStr,
    createdAtTimestamp,
    estimatedDelivery: d.estimatedDelivery || '2–4 Business Days',
    utrNumber: (d.utrNumber || d.transactionReference || d.paymentReference || '').trim() || undefined,
    paymentVerificationStatus: canonicalVerify,
    paymentVerifiedAt:
      d.paymentVerifiedAt?.toDate?.()?.toISOString?.() ||
      (typeof d.paymentVerifiedAt === 'string' ? d.paymentVerifiedAt : undefined) ||
      d.paymentAudit?.verifiedAt?.toDate?.()?.toISOString?.() ||
      (typeof d.paymentAudit?.verifiedAt === 'string' ? d.paymentAudit?.verifiedAt : undefined) ||
      undefined,
    paymentVerifiedBy: d.paymentVerifiedBy || d.paymentAudit?.verifiedBy || undefined,
    paymentRejectionReason: d.paymentRejectionReason || undefined,
    assignedStaff: d.assignedStaff || undefined,
    amountReceived: d.amountReceived !== undefined ? Number(d.amountReceived) : undefined,
    isFlagged: Boolean(d.isFlagged),
    flagReason: d.flagReason || undefined,
    courierName: d.courierName || undefined,
    courierTrackingId: d.courierTrackingId || undefined,
    courierTrackingUrl: d.courierTrackingUrl || undefined,
    packedAt: d.packedAt?.toDate?.()?.toLocaleDateString('en-IN') || d.packedAt || undefined,
    shippedAt: d.shippedAt?.toDate?.()?.toLocaleDateString('en-IN') || d.shippedAt || undefined,
    deliveredAt: d.deliveredAt?.toDate?.()?.toLocaleDateString('en-IN') || d.deliveredAt || undefined,
    statusHistory: d.statusHistory || [],
    metadataAuditLogs: d.metadataAuditLogs || [],
    paymentAudit: d.paymentAudit || undefined,
  };
}

/**
 * Customer submits their 12-digit UPI / UTR transaction reference number.
 * Strict Security:
 * - Validates format.
 * - Prevents duplicate UTR submission across verified orders.
 * - Sets status strictly to 'verification_pending'. NEVER marks as paid.
 * - Records audit event in statusHistory.
 */
export async function submitPaymentUTR(
  orderIdOrQuery: string,
  utrNumber: string,
  customerEmailOrPhone?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const valResult = validateUtrNumber(utrNumber);
    if (!valResult.valid) {
      return { success: false, message: valResult.message || 'Invalid UTR reference number.' };
    }
    const cleanUtr = utrNumber.trim();

    if (isFirebaseConfigured) {
      // 1. Prevent reuse of already confirmed UTR (single-field query avoids missing composite index)
      const duplicateQuery = query(
        collection(db, 'orders'),
        where('utrNumber', '==', cleanUtr),
        limit(5)
      );
      const dupSnap = await getDocs(duplicateQuery);
      const isAlreadyConfirmed = dupSnap.docs.some((docSnap) => {
        const d = docSnap.data();
        const vStatus = (d.paymentVerificationStatus || '').toLowerCase();
        const pStatus = (d.paymentStatus || '').toLowerCase();
        return (
          ['paid', 'confirmed', 'payment_approved'].includes(vStatus) ||
          ['paid', 'confirmed', 'payment_approved', 'payment approved'].includes(pStatus)
        );
      });
      if (isAlreadyConfirmed) {
        return {
          success: false,
          message: 'This transaction reference (UTR) has already been reconciled with another order. Please check your banking receipt.',
        };
      }

      // 2. Locate order doc
      const cleanInput = orderIdOrQuery.trim().replace(/^Order\s*#/i, '').replace(/^#/, '');
      const possibleDocIds = [
        `order_${cleanInput}`,
        cleanInput,
        `order_${cleanInput.toLowerCase()}`,
      ];

      let orderRef = null;
      let orderDoc = null;

      for (const docId of possibleDocIds) {
        const snap = await getDoc(doc(db, 'orders', docId));
        if (snap.exists()) {
          orderRef = doc(db, 'orders', docId);
          orderDoc = snap.data();
          break;
        }
      }

      if (!orderRef || !orderDoc) {
        // Query by orderId or orderNumber field
        const numVal = parseInt(cleanInput, 10);
        const qByField = isNaN(numVal)
          ? query(collection(db, 'orders'), where('orderId', '==', cleanInput), limit(1))
          : query(collection(db, 'orders'), where('orderNumber', '==', numVal), limit(1));
        const fieldSnap = await getDocs(qByField);
        if (!fieldSnap.empty) {
          orderRef = doc(db, 'orders', fieldSnap.docs[0].id);
          orderDoc = fieldSnap.docs[0].data();
        }
      }

      if (!orderRef || !orderDoc) {
        return { success: false, message: `Order #${cleanInput} could not be located.` };
      }

      // Contact verification for guest protection
      if (customerEmailOrPhone && customerEmailOrPhone.trim()) {
        const cleanContact = customerEmailOrPhone.trim().toLowerCase();
        const cleanPhone = cleanContact.replace(/\D/g, '');
        const orderEmail = (orderDoc.customerEmail || orderDoc.customer?.email || '').toLowerCase();
        const orderPhone = (orderDoc.phone || orderDoc.customer?.phone || '').replace(/\D/g, '');

        const emailMatches = orderEmail && orderEmail === cleanContact;
        const phoneMatches = cleanPhone.length >= 10 && orderPhone.endsWith(cleanPhone);

        if (!emailMatches && !phoneMatches) {
          return {
            success: false,
            message: 'Verification failed. Contact details do not match this order reference.',
          };
        }
      }

      const auditEntry: OrderAuditEntry = {
        status: 'Payment Details Submitted',
        timestamp: new Date().toISOString(),
        actor: 'Customer',
        note: `Submitted UTR reference: ${cleanUtr}. Awaiting administrator bank reconciliation.`,
      };

      await updateDoc(orderRef, {
        utrNumber: cleanUtr,
        paymentVerificationStatus: 'verification_pending',
        statusHistory: arrayUnion(auditEntry),
        updatedAt: serverTimestamp(),
      });

      // Update payments collection
      const paymentId = orderDoc.paymentId || `PAY-${orderDoc.orderNumber || cleanInput}`;
      try {
        const payRef = doc(db, 'payments', paymentId);
        await updateDoc(payRef, {
          utrNumber: cleanUtr,
          transactionId: cleanUtr,
          status: 'verification_pending',
          updatedAt: serverTimestamp(),
        });
      } catch {}
    }

    // Update local storage cache
    const local = getLocalOrders();
    const cleanNum = orderIdOrQuery.replace(/\D/g, '');
    const idx = local.findIndex(
      (o) =>
        o.orderId.toUpperCase() === orderIdOrQuery.trim().toUpperCase() ||
        String(o.orderNumber) === cleanNum
    );
    if (idx !== -1) {
      const updated: OrderDetails = {
        ...local[idx],
        utrNumber: cleanUtr,
        paymentStatus: 'Verification Pending',
        paymentVerificationStatus: 'verification_pending',
      };
      updateLocalOrderCache(updated);
    }

    return {
      success: true,
      message: 'Payment reference submitted successfully! Verification is pending with our accounts team.',
    };
  } catch (err: any) {
    console.error('[Orders Service] Submit UTR error:', err);
    return {
      success: false,
      message: err?.message || 'Failed to submit payment details. Please check connection and try again.',
    };
  }
}

/**
 * Securely retrieves an order by Order ID, number, or lookup query.
 * Supports "101", "#101", "Order #101", "order_101", and legacy "SJT-*".
 * Validates contact details (email or 10-digit phone) for guest privacy.
 */
export async function getOrderByLookup(
  orderIdOrQuery: string,
  contactVerification?: string
): Promise<{ success: boolean; order?: OrderDetails; message?: string }> {
  try {
    const raw = orderIdOrQuery.trim();
    if (!raw) {
      return { success: false, message: 'Please provide a valid Order ID (e.g. 101 or #101).' };
    }

    const cleanInput = raw.replace(/^Order\s*#/i, '').replace(/^#/, '').trim();
    const numVal = parseInt(cleanInput, 10);

    // 1. Check Cloud Firestore
    if (isFirebaseConfigured) {
      const candidates = [
        `order_${cleanInput}`,
        cleanInput,
        `order_${cleanInput.toLowerCase()}`,
      ];

      for (const docId of candidates) {
        const snap = await getDoc(doc(db, 'orders', docId));
        if (snap.exists()) {
          const d = snap.data();
          if (verifyContact(d, contactVerification)) {
            return { success: true, order: mapFirestoreOrderToDetails(snap.id, d) };
          } else {
            return {
              success: false,
              message: 'Verification failed. The email or phone number does not match this order reference.',
            };
          }
        }
      }

      // Query by orderNumber or orderId field
      if (!isNaN(numVal) && numVal > 0) {
        const qNum = query(collection(db, 'orders'), where('orderNumber', '==', numVal), limit(1));
        const numSnap = await getDocs(qNum);
        if (!numSnap.empty) {
          const docSnap = numSnap.docs[0];
          const d = docSnap.data();
          if (verifyContact(d, contactVerification)) {
            return { success: true, order: mapFirestoreOrderToDetails(docSnap.id, d) };
          } else {
            return {
              success: false,
              message: 'Verification failed. The email or phone number does not match this order reference.',
            };
          }
        }
      }

      const qStr = query(collection(db, 'orders'), where('orderId', '==', cleanInput), limit(1));
      const strSnap = await getDocs(qStr);
      if (!strSnap.empty) {
        const docSnap = strSnap.docs[0];
        const d = docSnap.data();
        if (verifyContact(d, contactVerification)) {
          return { success: true, order: mapFirestoreOrderToDetails(docSnap.id, d) };
        } else {
          return {
            success: false,
            message: 'Verification failed. The email or phone number does not match this order reference.',
          };
        }
      }
    }

    // 2. Check local storage fallback
    const local = getLocalOrders().find(
      (o) =>
        o.orderId.toUpperCase() === cleanInput.toUpperCase() ||
        String(o.orderNumber) === cleanInput
    );
    if (local) {
      if (verifyContact(local, contactVerification)) {
        return { success: true, order: local };
      }
      return {
        success: false,
        message: 'Verification failed. The email or phone number does not match this order reference.',
      };
    }

    return {
      success: false,
      message: `Order #${cleanInput} was not found. Please verify the order number.`,
    };
  } catch (err: any) {
    console.error('[Orders Service] Order lookup error:', err);
    return {
      success: false,
      message: err?.message || 'Unable to fetch order details at this moment.',
    };
  }
}

function verifyContact(data: any, contactVerification?: string): boolean {
  if (!contactVerification || !contactVerification.trim()) return true;
  const cleanContact = contactVerification.trim().toLowerCase();
  const cleanPhone = cleanContact.replace(/\D/g, '');
  const orderEmail = (data.customerEmail || data.customer?.email || '').toLowerCase();
  const orderPhone = (data.phone || data.customer?.phone || '').replace(/\D/g, '');

  const emailMatches = orderEmail && orderEmail === cleanContact;
  const phoneMatches = cleanPhone.length >= 10 && orderPhone.endsWith(cleanPhone);
  return Boolean(emailMatches || phoneMatches);
}

/**
 * Retrieves all cached orders for the current customer session.
 */
export function getLocalOrders(): OrderDetails[] {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Finds an order by its unique ID or number.
 */
export function getOrderById(orderId: string): OrderDetails | undefined {
  const orders = getLocalOrders();
  const clean = orderId.trim().toUpperCase();
  return orders.find(
    (o) => o.orderId.toUpperCase() === clean || String(o.orderNumber) === clean
  );
}

/**
 * Synchronously updates local order storage and session cache with the latest authoritative order data.
 * Prevents stale React or cached storage from overriding fresh Firestore updates.
 */
export function updateLocalOrderCache(order: OrderDetails): void {
  try {
    if (!order || !order.orderId) return;
    const local = getLocalOrders();
    const cleanId = order.orderId.toUpperCase();
    const cleanNum = order.orderNumber ? String(order.orderNumber) : '';
    const idx = local.findIndex(
      (o) =>
        o.orderId.toUpperCase() === cleanId ||
        (cleanNum && String(o.orderNumber) === cleanNum) ||
        (order.firestoreDocId && o.firestoreDocId === order.firestoreDocId)
    );
    if (idx !== -1) {
      local[idx] = { ...local[idx], ...order };
    } else {
      local.unshift(order);
    }
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(local));

    // Also update sessionStorage last order if it matches
    const sessionRaw = sessionStorage.getItem('sjt_last_order');
    if (sessionRaw) {
      try {
        const sessionOrder = JSON.parse(sessionRaw);
        if (
          sessionOrder.orderId?.toUpperCase() === cleanId ||
          (cleanNum && String(sessionOrder.orderNumber) === cleanNum) ||
          (order.firestoreDocId && sessionOrder.firestoreDocId === order.firestoreDocId)
        ) {
          sessionStorage.setItem('sjt_last_order', JSON.stringify({ ...sessionOrder, ...order }));
        }
      } catch {}
    }
  } catch (err) {
    console.warn('[Orders Service] Failed to update local order cache:', err);
  }
}

/**
 * Real-time listener for an individual order document.
 * Subscribes to Cloud Firestore and automatically synchronizes local cache when updates occur.
 */
export function subscribeToSingleOrder(
  orderIdOrQuery: string,
  callback: (order: OrderDetails | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const raw = (orderIdOrQuery || '').trim();
  if (!raw) {
    callback(null);
    return () => {};
  }

  const clean = raw.replace(/^Order\s*#/i, '').replace(/^#/, '').trim();
  const numVal = parseInt(clean, 10);

  if (!isFirebaseConfigured) {
    const local = getOrderById(clean) || null;
    callback(local);
    return () => {};
  }

  let activeUnsub: Unsubscribe | null = null;
  let isCancelled = false;

  const attachDocListener = (docId: string) => {
    if (isCancelled) return;
    if (activeUnsub) activeUnsub();

    activeUnsub = onSnapshot(
      doc(db, 'orders', docId),
      (snap) => {
        if (!snap.exists()) {
          callback(null);
          return;
        }
        const order = mapFirestoreOrderToDetails(snap.id, snap.data());
        updateLocalOrderCache(order);
        callback(order);
      },
      (err) => {
        console.warn(`[Orders Service] subscribeToSingleOrder error on ${docId}:`, err);
        if (onError) onError(err);
      }
    );
  };

  const primaryDocId = clean.startsWith('order_') ? clean : `order_${clean}`;

  getDoc(doc(db, 'orders', primaryDocId))
    .then((snap) => {
      if (isCancelled) return;
      if (snap.exists()) {
        attachDocListener(primaryDocId);
      } else {
        const promises: Promise<any>[] = [getDoc(doc(db, 'orders', clean))];
        if (!isNaN(numVal) && numVal > 0) {
          promises.push(getDocs(query(collection(db, 'orders'), where('orderNumber', '==', numVal), limit(1))));
        }
        promises.push(getDocs(query(collection(db, 'orders'), where('orderId', '==', clean), limit(1))));

        Promise.all(promises)
          .then(([directSnap, numSnap, strSnap]) => {
            if (isCancelled) return;
            if (directSnap && directSnap.exists()) {
              attachDocListener(clean);
            } else if (numSnap && !numSnap.empty) {
              attachDocListener(numSnap.docs[0].id);
            } else if (strSnap && !strSnap.empty) {
              attachDocListener(strSnap.docs[0].id);
            } else {
              const local = getOrderById(clean) || null;
              callback(local);
            }
          })
          .catch((err) => {
            if (onError) onError(err);
          });
      }
    })
    .catch((err) => {
      if (isCancelled) return;
      console.warn('[Orders Service] subscribeToSingleOrder init error:', err);
      attachDocListener(primaryDocId);
    });

  return () => {
    isCancelled = true;
    if (activeUnsub) {
      activeUnsub();
    }
  };
}

/**
 * Helper to get user-friendly badge styling and description for an order status.
 */
export function getOrderStatusMeta(status: OrderStatus): { label: string; colorClass: string; description: string } {
  switch (status) {
    case 'Confirmed':
      return {
        label: 'Order Confirmed',
        colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        description: 'Your order has been confirmed and forwarded to the roastery floor.',
      };
    case 'Processing':
      return {
        label: 'Roasting & Milling',
        colorClass: 'bg-amber-100 text-amber-800 border-amber-300',
        description: 'Coffee beans are being micro-batch roasted, milled, and degassing-sealed.',
      };
    case 'Packed':
      return {
        label: 'Packed & Sealed',
        colorClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        description: 'Glass jars packed and sealed with tamper-evident ribbon.',
      };
    case 'Shipped':
      return {
        label: 'In Transit',
        colorClass: 'bg-blue-100 text-blue-800 border-blue-300',
        description: 'Handed over to express courier. Tracking code dispatched via SMS/Email.',
      };
    case 'Out for Delivery':
      return {
        label: 'Out for Delivery',
        colorClass: 'bg-cyan-100 text-cyan-800 border-cyan-300',
        description: 'Courier agent is out delivering to your address today.',
      };
    case 'Delivered':
      return {
        label: 'Delivered',
        colorClass: 'bg-emerald-200 text-emerald-900 border-emerald-400',
        description: 'Package delivered. Enjoy your fresh cup!',
      };
    case 'Cancelled':
      return {
        label: 'Cancelled',
        colorClass: 'bg-rose-100 text-rose-800 border-rose-300',
        description: 'Order was cancelled.',
      };
    case 'Pending':
    default:
      return {
        label: 'Verification Pending',
        colorClass: 'bg-neutral-100 text-neutral-800 border-neutral-300',
        description: 'Awaiting payment verification.',
      };
  }
}
