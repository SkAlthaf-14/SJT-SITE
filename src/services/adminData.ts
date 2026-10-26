/**
 * SJT FARMS - REAL ADMIN DATA & REAL-TIME FIRESTORE SERVICE
 * 
 * ZERO demo or mock data.
 * All data is streamed live from Cloud Firestore using real-time listeners:
 * - users collection -> Real registered customers & administrator accounts
 * - orders collection -> Real placed orders with live status management
 * - products collection -> Live catalogue with real-time stock & pricing
 * - payments collection -> Authentic transaction ledger
 * - contacts collection -> Live customer concierge messages
 * - reviews collection -> Authentic customer reviews and approvals
 * 
 * ZERO Google Sheets dependency.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  query,
  where,
  limit,
  QuerySnapshot,
  DocumentData,
  Unsubscribe,
  runTransaction,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { OrderDetails, OrderStatus, OrderAuditEntry, PaymentMetadataAuditLog } from '../types';
import { mapFirestoreOrderToDetails, validateUtrNumber, sanitizeFirestorePayload, formatDisplayOrderId } from './orders';
import { queueMilestoneNotification } from './notificationService';
import { FirestoreProduct } from './productsService';

export interface RealCustomer {
  customerId: string;
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  authProvider: string;
  createdAt: string;
  lastLogin: string;
  city?: string;
  state?: string;
  address?: string;
}

export interface RealPaymentRecord {
  paymentId: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  transactionReference: string;
  status?: string;
  createdAt: string;
}

export interface RealContactInquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'closed';
  createdAt: string;
}

export interface RealReviewItem {
  id: string;
  author: string;
  rating: number;
  comment: string;
  status: 'approved' | 'rejected' | 'pending' | 'hidden';
  verified: boolean;
  date: string;
  productName?: string;
  createdAt?: string;
}

export interface AdminKPISummary {
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  processingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  pendingReviews: number;
  unreadContacts: number;
  newContactMessages: number;
  // Payment Verification Overview Cards
  paymentsAwaitingVerification: number;
  verifiedPayments: number;
  rejectedPayments: number;
  flaggedUtrs: number;
  totalPendingPaymentValue: number;
  totalVerifiedPaymentValue: number;
}

export interface AdminRealtimeSubscriptions {
  unsubscribeAll: () => void;
}

/**
 * Calculates strict, 100% real KPI metrics directly from live collections.
 * ZERO fake or simulated values.
 */
export function calculateRealKPIs(
  customers: RealCustomer[],
  orders: OrderDetails[],
  products: FirestoreProduct[],
  reviews: RealReviewItem[],
  contacts: RealContactInquiry[]
): AdminKPISummary {
  const totalCustomers = customers.length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const pendingOrders = orders.filter((o) => (o.orderStatus || '').toLowerCase() === 'pending' || (o.orderStatus || '').toLowerCase() === 'received').length;
  const processingOrders = orders.filter((o) => {
    const s = (o.orderStatus || '').toLowerCase();
    return s === 'processing' || s === 'confirmed' || s === 'packing' || s === 'ready_to_ship' || s === 'shipped';
  }).length;
  const deliveredOrders = orders.filter((o) => (o.orderStatus || '').toLowerCase() === 'delivered').length;
  const cancelledOrders = orders.filter((o) => (o.orderStatus || '').toLowerCase() === 'cancelled').length;
  const completedOrders = deliveredOrders;

  const totalProducts = products.length;
  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const outOfStockProducts = products.filter((p) => p.stock === 0).length;

  const pendingReviews = reviews.filter((r) => r.status === 'pending').length;
  const unreadContacts = contacts.filter((c) => c.status === 'new').length;

  // Real Payment Verification Metrics
  const awaitingVerificationOrders = orders.filter((o) => {
    const v = (o.paymentVerificationStatus || '').toLowerCase();
    const p = (o.paymentStatus || '').toLowerCase();
    return v === 'verification_pending' || v === 'details_submitted' || p.includes('pending') || p.includes('submitted');
  });
  const paymentsAwaitingVerification = awaitingVerificationOrders.length;
  const totalPendingPaymentValue = awaitingVerificationOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const verifiedOrders = orders.filter((o) => {
    const v = (o.paymentVerificationStatus || '').toLowerCase();
    const p = (o.paymentStatus || '').toLowerCase();
    return v === 'paid' || v === 'confirmed' || p === 'paid' || p.includes('paid');
  });
  const verifiedPayments = verifiedOrders.length;
  const totalVerifiedPaymentValue = verifiedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const rejectedPayments = orders.filter((o) => {
    const v = (o.paymentVerificationStatus || '').toLowerCase();
    const p = (o.paymentStatus || '').toLowerCase();
    return v === 'rejected' || p === 'failed' || p.includes('rejected');
  }).length;

  const flaggedUtrs = orders.filter((o) => {
    const v = (o.paymentVerificationStatus || '').toLowerCase();
    return Boolean(o.isFlagged) || v === 'under_review';
  }).length;

  return {
    totalCustomers,
    totalOrders,
    totalRevenue,
    pendingOrders,
    completedOrders,
    processingOrders,
    deliveredOrders,
    cancelledOrders,
    totalProducts,
    lowStockProducts,
    outOfStockProducts,
    pendingReviews,
    unreadContacts,
    newContactMessages: unreadContacts,
    paymentsAwaitingVerification,
    verifiedPayments,
    rejectedPayments,
    flaggedUtrs,
    totalPendingPaymentValue,
    totalVerifiedPaymentValue,
  };
}

/**
 * Subscribes to all live Firestore collections with onSnapshot().
 * Triggers callback immediately on initial load and every time any document changes.
 */
export function subscribeToAdminDashboard(callbacks: {
  onCustomersUpdate: (customers: RealCustomer[]) => void;
  onOrdersUpdate: (orders: OrderDetails[]) => void;
  onProductsUpdate: (products: FirestoreProduct[]) => void;
  onPaymentsUpdate: (payments: RealPaymentRecord[]) => void;
  onContactsUpdate: (contacts: RealContactInquiry[]) => void;
  onReviewsUpdate: (reviews: RealReviewItem[]) => void;
  onError?: (error: Error) => void;
}): AdminRealtimeSubscriptions {
  const unsubs: Unsubscribe[] = [];

  // 1. Live Customers (users collection)
  try {
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        // Collect raw documents
        const rawDocs: Array<{ id: string; data: DocumentData; createdTime: number }> = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          const createdTime = d.createdAt?.toDate?.()
            ? d.createdAt.toDate().getTime()
            : (typeof d.createdAt === 'string' ? new Date(d.createdAt).getTime() : 0) || 0;
          rawDocs.push({ id: docSnap.id, data: d, createdTime });
        });

        // Sort chronologically ascending to establish canonical, immutable sequential IDs (1, 2, ..., N)
        // with deterministic doc ID tie-breaker so the ID sequence never jumps between refreshes
        rawDocs.sort((a, b) => {
          if (a.createdTime !== b.createdTime) return a.createdTime - b.createdTime;
          return a.id.localeCompare(b.id);
        });

        const list: RealCustomer[] = rawDocs.map((item, index) => {
          const d = item.data;
          const email = (d.email || '').trim();
          // Use authoritative stored customerNumber/customerId if present, else deterministic sequential index + 1
          const assignedSeq = d.customerNumber ?? d.customerId ?? (index + 1);
          return {
            customerId: String(assignedSeq),
            uid: item.id,
            name: d.name || d.displayName || email.split('@')[0] || 'Customer',
            email: email,
            phone: d.phone || d.phoneNumber || '',
            role: d.role || 'customer',
            status: d.status || 'active',
            authProvider: d.provider || d.authProvider || 'email',
            createdAt: d.createdAt?.toDate?.()?.toISOString() || (typeof d.createdAt === 'string' ? d.createdAt : ''),
            lastLogin: d.lastLogin?.toDate?.()?.toISOString() || (typeof d.lastLogin === 'string' ? d.lastLogin : ''),
            city: d.city || d.address?.city || '',
            state: d.state || d.address?.state || '',
            address: d.address?.street || d.address || '',
          };
        });

        // Default list order: newest customers first (descending by createdAt, with customerId tie-breaker)
        list.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (timeB !== timeA) return timeB - timeA;
          const numA = parseInt(a.customerId, 10) || 0;
          const numB = parseInt(b.customerId, 10) || 0;
          return numB - numA;
        });
        callbacks.onCustomersUpdate(list);
      },
      (err) => {
        console.warn('[Admin Data] Users onSnapshot notice:', err);
        callbacks.onError?.(err);
      }
    );
    unsubs.push(unsubUsers);
  } catch (err: any) {
    callbacks.onError?.(err);
  }

  // 2. Live Orders (orders collection)
  try {
    const unsubOrders = onSnapshot(
      collection(db, 'orders'),
      (snap) => {
        const list: OrderDetails[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          if (d) {
            list.push(mapFirestoreOrderToDetails(docSnap.id, d));
          }
        });
        // Sort descending by created date with stable numeric orderNumber tie-breaker
        list.sort((a, b) => {
          const timeA = a.createdAtTimestamp ?? new Date(a.createdAt || 0).getTime();
          const timeB = b.createdAtTimestamp ?? new Date(b.createdAt || 0).getTime();
          if (timeB !== timeA) return timeB - timeA;
          const numA = a.orderNumber ?? (parseInt(String(a.orderId).replace(/\D/g, ''), 10) || 0);
          const numB = b.orderNumber ?? (parseInt(String(b.orderId).replace(/\D/g, ''), 10) || 0);
          return numB - numA;
        });
        callbacks.onOrdersUpdate(list);
      },
      (err) => {
        console.warn('[Admin Data] Orders onSnapshot notice:', err);
        callbacks.onError?.(err);
      }
    );
    unsubs.push(unsubOrders);
  } catch (err: any) {
    callbacks.onError?.(err);
  }

  // 3. Live Products (products collection)
  try {
    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snap) => {
        const list: FirestoreProduct[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          const primaryImage =
            d.imageUrl ||
            (Array.isArray(d.images) && d.images.length > 0
              ? d.images[0]
              : 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80');

          list.push({
            id: docSnap.id,
            name: d.name || '',
            slug: d.slug || docSnap.id,
            category: d.category || 'Coffee Powder',
            tagline: d.tagline || '',
            description: d.description || '',
            longDescription: d.longDescription || '',
            price: Number(d.price) || 0,
            originalPrice: d.originalPrice ? Number(d.originalPrice) : undefined,
            stock: Number(d.stock) || 0,
            status: d.status === 'inactive' ? 'inactive' : 'active',
            rating: Number(d.rating) || 5,
            reviewCount: Number(d.reviewCount) || 0,
            imageUrl: primaryImage,
            images: Array.isArray(d.images) && d.images.length > 0 ? d.images : [primaryImage],
            weights: Array.isArray(d.weights) && d.weights.length > 0 ? d.weights : ['250g', '500g'],
            weightPrices: d.weightPrices || {},
            strength: d.strength || 'Medium',
            roastLevel: d.roastLevel || 'Medium Dark',
            flavourNotes: d.flavourNotes || [],
            brewMethods: d.brewMethods || [],
            chicoryRatio: d.chicoryRatio || '',
            ingredients: d.ingredients || '100% Pure Plantation Coffee Beans',
            shippingInfo: d.shippingInfo || 'Dispatched freshly roasted within 24 hours',
            featured: Boolean(d.featured),
            isBestseller: Boolean(d.isBestseller),
            isNew: Boolean(d.isNew),
            createdAt: d.createdAt?.toDate?.()?.toISOString() || d.createdAt || '',
            updatedAt: d.updatedAt?.toDate?.()?.toISOString() || d.updatedAt || '',
          });
        });
        list.sort((a, b) => a.name.localeCompare(b.name));
        callbacks.onProductsUpdate(list);
      },
      (err) => {
        console.warn('[Admin Data] Products onSnapshot notice:', err);
        callbacks.onError?.(err);
      }
    );
    unsubs.push(unsubProducts);
  } catch (err: any) {
    callbacks.onError?.(err);
  }

  // 4. Live Payments (payments collection)
  try {
    const unsubPayments = onSnapshot(
      collection(db, 'payments'),
      (snap) => {
        const list: RealPaymentRecord[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            paymentId: docSnap.id,
            orderId: d.orderId || '',
            customerId: d.userId || d.customerId || '1',
            customerName: d.customerName || 'Customer',
            customerEmail: d.customerEmail || '',
            amount: Number(d.amount) || 0,
            currency: d.currency || 'INR',
            paymentMethod: d.paymentMethod || 'Online Payment',
            paymentStatus: d.status || d.paymentStatus || 'pending',
            status: d.status || (d.paymentStatus === 'paid' ? 'confirmed' : 'pending'),
            transactionReference: d.transactionId || d.transactionReference || docSnap.id,
            createdAt: d.createdAt?.toDate?.()?.toISOString() || d.createdAt || '',
          });
        });
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        callbacks.onPaymentsUpdate(list);
      },
      (err) => {
        console.warn('[Admin Data] Payments onSnapshot notice:', err);
        callbacks.onError?.(err);
      }
    );
    unsubs.push(unsubPayments);
  } catch (err: any) {
    callbacks.onError?.(err);
  }

  // 5. Live Contacts (contacts collection)
  try {
    const unsubContacts = onSnapshot(
      collection(db, 'contacts'),
      (snap) => {
        const list: RealContactInquiry[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            id: docSnap.id,
            name: d.name || '',
            email: d.email || '',
            phone: d.phone || '',
            topic: d.subject || d.topic || 'General Inquiry',
            message: d.message || '',
            status: d.status || 'new',
            createdAt: d.createdAt?.toDate?.()?.toISOString() || d.createdAt || '',
          });
        });
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        callbacks.onContactsUpdate(list);
      },
      (err) => {
        console.warn('[Admin Data] Contacts onSnapshot notice:', err);
        callbacks.onError?.(err);
      }
    );
    unsubs.push(unsubContacts);
  } catch (err: any) {
    callbacks.onError?.(err);
  }

  // 6. Live Reviews (reviews collection)
  try {
    const unsubReviews = onSnapshot(
      collection(db, 'reviews'),
      (snap) => {
        const list: RealReviewItem[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            id: docSnap.id,
            author: d.customerName || d.author || d.name || 'Patron',
            rating: Number(d.rating) || 5,
            comment: d.review || d.comment || '',
            status: d.status || 'approved',
            verified: d.verified !== false,
            date: d.date || d.createdAt?.toDate?.()?.toISOString()?.split('T')[0] || 'Recently',
            productName: d.productName,
            createdAt: d.createdAt?.toDate?.()?.toISOString() || d.createdAt || '',
          });
        });
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        callbacks.onReviewsUpdate(list);
      },
      (err) => {
        console.warn('[Admin Data] Reviews onSnapshot notice:', err);
        callbacks.onError?.(err);
      }
    );
    unsubs.push(unsubReviews);
  } catch (err: any) {
    callbacks.onError?.(err);
  }

  return {
    unsubscribeAll: () => {
      unsubs.forEach((unsub) => {
        try {
          unsub();
        } catch {}
      });
    },
  };
}

/**
 * Updates order status in Firestore orders collection.
 * Uses canonical order resolver and enforces prepayment fulfillment safeguard.
 */
export async function updateAdminOrderStatus(
  orderId: string,
  newStatus: OrderStatus | string
): Promise<boolean> {
  const normalizedStatus = newStatus.toLowerCase();
  const { ref: orderDocRef, data: orderData } = await resolveOrderDoc(orderId);
  if (!orderData) {
    throw new Error(`Order #${orderId} could not be located in Firestore.`);
  }

  // Prepayment verification safeguard:
  const isFulfillmentState = ['packed', 'ready_to_ship', 'shipped', 'out for delivery', 'out_for_delivery', 'delivered'].includes(normalizedStatus);
  if (isFulfillmentState) {
    const isCod = Boolean(
      orderData.paymentMethod?.toLowerCase().includes('cash on delivery') ||
      orderData.paymentMethod?.toLowerCase().includes('cod')
    );
    const isPaymentVerified = Boolean(
      orderData.paymentStatus === 'paid' ||
      orderData.paymentStatus === 'payment_approved' ||
      orderData.paymentVerificationStatus === 'paid' ||
      orderData.paymentVerificationStatus === 'confirmed'
    );
    if (!isCod && !isPaymentVerified) {
      throw new Error('Fulfillment Blocked: Prepayment is required. Payment must be verified before marking order as Shipped or Delivered.');
    }
  }

  await updateDoc(orderDocRef, {
    orderStatus: normalizedStatus,
    updatedAt: serverTimestamp(),
  });
  return true;
}

/**
 * Helper to resolve the correct Firestore order document reference and current order data.
 * Supports canonical doc ID ("order_101"), sequential order ID ("101"), displayId ("Order #101"),
 * numeric ID (101), or legacy prefixes ("SJT-...").
 */
async function resolveOrderDoc(orderIdOrDocId: string | number) {
  const rawInput = String(orderIdOrDocId ?? '').trim();
  if (!rawInput) {
    return { ref: null as any, snap: null, data: null, docId: '' };
  }

  const clean = rawInput.replace(/^Order\s*#/i, '').replace(/^#/, '').trim();
  const num = parseInt(clean, 10);
  const isNumeric = !isNaN(num) && String(num) === clean;

  // 1. Direct candidate doc IDs
  const candidates = [
    rawInput,
    clean,
    `order_${clean}`,
    `order_${clean.toLowerCase()}`,
    clean.toLowerCase(),
  ];

  for (const docId of candidates) {
    if (!docId) continue;
    try {
      const directRef = doc(db, 'orders', docId);
      const snap = await getDoc(directRef);
      if (snap.exists()) {
        return { ref: directRef, snap, data: snap.data(), docId: snap.id };
      }
    } catch {
      // Continue to next candidate
    }
  }

  // 2. Query fallbacks: search by orderId, orderNumber, firestoreDocId, or displayId
  const queriesToTry = [
    query(collection(db, 'orders'), where('orderId', '==', clean), limit(1)),
    query(collection(db, 'orders'), where('orderId', '==', rawInput), limit(1)),
    ...(isNumeric
      ? [
          query(collection(db, 'orders'), where('orderNumber', '==', num), limit(1)),
          query(collection(db, 'orders'), where('orderId', '==', num), limit(1)),
        ]
      : []),
    query(collection(db, 'orders'), where('firestoreDocId', '==', rawInput), limit(1)),
    query(collection(db, 'orders'), where('displayId', '==', formatDisplayOrderId(clean)), limit(1)),
  ];

  for (const q of queriesToTry) {
    try {
      const snapQ = await getDocs(q);
      if (!snapQ.empty) {
        const docSnap = snapQ.docs[0];
        return { ref: docSnap.ref, snap: docSnap, data: docSnap.data(), docId: docSnap.id };
      }
    } catch {
      // Try next query
    }
  }

  // Fallback direct reference
  return { ref: doc(db, 'orders', rawInput), snap: null, data: null, docId: rawInput };
}

/**
 * Admin verifies customer UPI payment after verifying against merchant bank records.
 * Security Rules & Robustness:
 * - Checks backend administrator clearance before initiating write.
 * - Single-field index check for duplicate UTR usage across other verified orders (never throws composite index error).
 * - Fully atomic runTransaction: all reads precede all writes.
 * - Updates canonical order and payment record atomically.
 * - Sanitizes Firestore payloads (zero undefined values).
 * - Preserves existing fulfillment status (does not overwrite 'processing', 'packed', 'shipped').
 * - Preserves audit history with server timestamp and verifiedBy.
 * - Dispatches customer milestone notification.
 */
export async function adminVerifyPayment(
  orderIdOrDocId: string | number,
  notes?: string,
  adminIdentifier: string = 'Administrator'
): Promise<{ success: boolean; message: string }> {
  try {
    if (!orderIdOrDocId) {
      return { success: false, message: 'Invalid order reference provided.' };
    }

    // 1. Authoritative Backend Authentication & Authorization Check
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return {
        success: false,
        message: 'Authentication required: You must be logged into the admin portal to approve payments.',
      };
    }

    let isAuthorizedAdmin = false;
    try {
      const tokenResult = await currentUser.getIdTokenResult(false);
      if (tokenResult.claims.admin === true) {
        isAuthorizedAdmin = true;
      }
    } catch (e) {
      console.warn('[Admin Data] Token claim inspect notice:', e);
    }

    if (!isAuthorizedAdmin) {
      try {
        const userDocSnap = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDocSnap.exists() && userDocSnap.data()?.role === 'admin') {
          isAuthorizedAdmin = true;
        }
      } catch (e) {
        console.warn('[Admin Data] User profile check notice:', e);
      }
    }

    if (!isAuthorizedAdmin) {
      return {
        success: false,
        message: 'Forbidden: You do not possess administrator security clearance to verify orders.',
      };
    }

    // 2. Resolve target order document
    const { ref: orderDocRef, data: orderData, docId } = await resolveOrderDoc(orderIdOrDocId);
    if (!orderData || !orderDocRef) {
      return {
        success: false,
        message: `Order #${String(orderIdOrDocId)} could not be located in Firestore.`,
      };
    }

    const targetOrderId = orderData.orderId || docId.replace('order_', '');
    const isAlreadyPaid =
      orderData.paymentStatus === 'paid' ||
      orderData.paymentStatus === 'payment_approved' ||
      orderData.paymentVerificationStatus === 'paid' ||
      orderData.paymentVerificationStatus === 'confirmed';

    if (isAlreadyPaid) {
      return {
        success: false,
        message: `Order #${orderData.orderNumber || targetOrderId} payment is already verified and approved.`,
      };
    }

    const isCod = Boolean(
      orderData.paymentMethod?.toLowerCase().includes('cash on delivery') ||
      orderData.paymentMethod?.toLowerCase().includes('cod')
    );

    let cleanUtr = '';
    if (!isCod) {
      // 3. Strict UPI Payment Validation:
      // Require a non-empty UTR that meets standard 12-digit format
      const rawUtr = String(orderData.utrNumber || '').trim();
      if (!rawUtr) {
        return {
          success: false,
          message: `Cannot approve payment: Order #${orderData.orderNumber || targetOrderId} does not have a submitted UTR reference number. Customer must submit a valid 12-digit UTR before payment can be verified.`,
        };
      }

      const utrValidation = validateUtrNumber(rawUtr);
      if (!utrValidation.valid) {
        return {
          success: false,
          message: `Cannot approve payment: ${utrValidation.message || 'Invalid UTR format. Expected a 12-digit UPI reference number.'}`,
        };
      }
      cleanUtr = rawUtr;

      // 4. UTR Deduplication Audit:
      // Query orders collection to ensure this exact UTR is not already reconciled on another order.
      // Single-field index on utrNumber prevents Firestore composite index error.
      const dupOrdersQuery = query(
        collection(db, 'orders'),
        where('utrNumber', '==', cleanUtr),
        limit(10)
      );
      const dupOrdersSnap = await getDocs(dupOrdersQuery);
      for (const dupDoc of dupOrdersSnap.docs) {
        if (dupDoc.id !== docId && dupDoc.data()?.orderId !== targetOrderId) {
          const dData = dupDoc.data();
          const dPay = (dData?.paymentStatus || '').toLowerCase();
          const dVer = (dData?.paymentVerificationStatus || '').toLowerCase();
          const isReconciled =
            dPay === 'paid' || dPay === 'payment_approved' || dVer === 'paid' || dVer === 'confirmed';
          if (isReconciled) {
            return {
              success: false,
              message: `Cannot verify: UTR ${cleanUtr} has already been reconciled on Order #${dData?.orderNumber || dData?.orderId || dupDoc.id}. Duplicate references cannot be verified!`,
            };
          }
        }
      }
    }

    const orderNumberStr = orderData.orderNumber ? String(orderData.orderNumber) : targetOrderId;
    const payId = orderData.paymentId || `PAY-${orderNumberStr}`;
    const payDocRef = doc(db, 'payments', payId);

    const effectiveNotes = notes || (isCod
      ? 'Cash on delivery payment collected and verified by administrator.'
      : 'Payment verified by administrator against merchant bank statement (PhonePe / Bank dashboard).');

    const auditEntry: OrderAuditEntry = {
      status: 'Payment Approved',
      timestamp: new Date().toISOString(),
      actor: adminIdentifier,
      note: effectiveNotes,
    };

    // 5. Atomic Firestore Transaction for Order and Payment records
    let committedOrderNumber: number | undefined;
    await runTransaction(db, async (t) => {
      // Step A: All reads first
      const freshOrderSnap = await t.get(orderDocRef);
      const paySnap = await t.get(payDocRef);

      if (!freshOrderSnap.exists()) {
        throw new Error(`Order #${targetOrderId} does not exist in Firestore.`);
      }

      const freshData = freshOrderSnap.data();
      committedOrderNumber = freshData.orderNumber;
      const freshPayStatus = (freshData?.paymentStatus || '').toLowerCase();
      const freshVerifyStatus = (freshData?.paymentVerificationStatus || '').toLowerCase();
      if (
        freshPayStatus === 'paid' ||
        freshPayStatus === 'payment_approved' ||
        freshVerifyStatus === 'paid' ||
        freshVerifyStatus === 'confirmed'
      ) {
        return;
      }

      // Keep fulfillment status separate: only change unconfirmed orders to 'confirmed'
      const currentOrderStatus = (freshData.orderStatus || '').toLowerCase();
      const nextOrderStatus =
        currentOrderStatus === 'pending' || currentOrderStatus === 'received' || currentOrderStatus === 'awaiting_payment'
          ? 'confirmed'
          : freshData.orderStatus || 'confirmed';

      const orderUpdatePayload = sanitizeFirestorePayload({
        paymentStatus: 'payment_approved',
        paymentVerificationStatus: 'paid',
        paymentRejectionReason: null,
        orderStatus: nextOrderStatus,
        paymentVerifiedAt: serverTimestamp(),
        paymentVerifiedBy: adminIdentifier,
        paymentAudit: {
          verifiedBy: adminIdentifier,
          verifiedAt: serverTimestamp(),
          notes: effectiveNotes,
        },
        statusHistory: arrayUnion(auditEntry),
        updatedAt: serverTimestamp(),
      });

      const paymentUpdatePayload = sanitizeFirestorePayload({
        paymentId: payId,
        orderId: targetOrderId,
        firestoreDocId: docId,
        status: 'paid',
        paymentStatus: 'payment_approved',
        verifiedNotes: effectiveNotes,
        verifiedBy: adminIdentifier,
        updatedAt: serverTimestamp(),
      });

      // Step B: Atomic writes after reads
      t.update(orderDocRef, orderUpdatePayload);
      t.set(payDocRef, paymentUpdatePayload, { merge: true });
    });

    // 6. Auxiliary UTR Reservation Record (Sync if collection rule 11 is deployed)
    if (!isCod && cleanUtr) {
      try {
        const resDocId = `res_${cleanUtr.replace(/\D/g, '') || cleanUtr.toUpperCase()}`;
        const resDocRef = doc(db, 'utr_reservations', resDocId);
        await setDoc(resDocRef, sanitizeFirestorePayload({
          reservationId: resDocId,
          orderId: targetOrderId,
          firestoreDocId: docId,
          orderNumber: committedOrderNumber,
          status: 'verified',
          verifiedBy: adminIdentifier,
          verifiedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }), { merge: true });
      } catch (resErr) {
        console.warn('[Admin Data] Auxiliary utr_reservations sync notice:', resErr);
      }
    }

    // Dispatch milestone notification to customer
    const normalizedOrder = mapFirestoreOrderToDetails(docId, {
      ...orderData,
      paymentStatus: 'payment_approved',
      paymentVerificationStatus: 'paid',
    });
    queueMilestoneNotification(normalizedOrder, 'payment_verified', effectiveNotes).catch((e) =>
      console.warn('[Admin Data] Milestone notification notice:', e)
    );

    return {
      success: true,
      message: `Payment for Order #${orderData.orderNumber || targetOrderId} successfully approved!`,
    };
  } catch (err: any) {
    console.error('[Admin Data] adminVerifyPayment error:', err);
    return { success: false, message: err?.message || 'Failed to verify payment.' };
  }
}

/**
 * Admin rejects customer payment with explicit audit reason.
 * Atomically transitions paymentStatus to 'payment_rejected' and paymentVerificationStatus to 'rejected'.
 */
export async function adminRejectPayment(
  orderIdOrDocId: string | number,
  reason: string,
  adminIdentifier: string = 'Administrator'
): Promise<{ success: boolean; message: string }> {
  try {
    const cleanReason = reason.trim() || 'Payment could not be verified in merchant bank statement.';
    const { ref: orderDocRef, data: orderData, docId } = await resolveOrderDoc(orderIdOrDocId);

    if (!orderData || !orderDocRef) {
      throw new Error(`Order #${String(orderIdOrDocId)} could not be located in Firestore.`);
    }

    const targetOrderId = orderData.orderId || docId.replace('order_', '');
    const auditEntry: OrderAuditEntry = {
      status: 'Payment Rejected',
      timestamp: new Date().toISOString(),
      actor: adminIdentifier,
      note: `Rejection reason: ${cleanReason}`,
    };

    const orderNumberStr = orderData.orderNumber ? String(orderData.orderNumber) : targetOrderId;
    const payId = orderData.paymentId || `PAY-${orderNumberStr}`;
    const payDocRef = doc(db, 'payments', payId);

    await runTransaction(db, async (t) => {
      // Read first
      const freshOrderSnap = await t.get(orderDocRef);
      const paySnap = await t.get(payDocRef);

      if (!freshOrderSnap.exists()) {
        throw new Error(`Order #${targetOrderId} does not exist in Firestore.`);
      }

      // Write after read
      t.update(orderDocRef, sanitizeFirestorePayload({
        paymentStatus: 'payment_rejected',
        paymentVerificationStatus: 'rejected',
        paymentRejectionReason: cleanReason,
        paymentAudit: {
          verifiedBy: adminIdentifier,
          rejectedBy: adminIdentifier,
          verifiedAt: serverTimestamp(),
          rejectionReason: cleanReason,
        },
        statusHistory: arrayUnion(auditEntry),
        updatedAt: serverTimestamp(),
      }));

      t.set(payDocRef, sanitizeFirestorePayload({
        paymentId: payId,
        orderId: targetOrderId,
        firestoreDocId: docId,
        status: 'rejected',
        paymentStatus: 'payment_rejected',
        rejectionReason: cleanReason,
        rejectedBy: adminIdentifier,
        updatedAt: serverTimestamp(),
      }), { merge: true });
    });

    // Dispatch milestone notification to customer
    const normalizedOrder = mapFirestoreOrderToDetails(docId, {
      ...orderData,
      paymentStatus: 'payment_rejected',
      paymentVerificationStatus: 'rejected',
      paymentRejectionReason: cleanReason,
    });
    queueMilestoneNotification(normalizedOrder, 'payment_rejected', cleanReason).catch((e) =>
      console.warn('[Admin Data] Milestone notification notice:', e)
    );

    return {
      success: true,
      message: `Payment for Order #${orderData.orderNumber || targetOrderId} rejected.`,
    };
  } catch (err: any) {
    console.error('[Admin Data] adminRejectPayment error:', err);
    return { success: false, message: err?.message || 'Failed to reject payment.' };
  }
}

/**
 * Admin unverifies a previously verified payment.
 * Security Safeguards:
 * - Requires an explicit reason.
 * - Preserves previous verification event in immutable audit log.
 * - Transitions paymentStatus to 'pending_verification' and orderStatus to 'payment_review'.
 * - Blocks dispatch until payment is re-reviewed.
 */
export async function adminUnverifyPayment(
  orderIdOrDocId: string,
  reason: string,
  adminIdentifier: string = 'Administrator'
): Promise<{ success: boolean; message: string }> {
  try {
    const cleanReason = reason.trim();
    if (!cleanReason) {
      return { success: false, message: 'A mandatory reason is required to unverify a payment.' };
    }
    const { ref: orderDocRef, data: orderData, docId } = await resolveOrderDoc(orderIdOrDocId);

    const auditEntry: OrderAuditEntry = {
      status: 'Payment Unverified',
      timestamp: new Date().toISOString(),
      actor: adminIdentifier,
      note: `Unverification reason: ${cleanReason}. Dispatch blocked pending re-verification.`,
    };

    await updateDoc(orderDocRef, {
      paymentStatus: 'pending_verification',
      paymentVerificationStatus: 'verification_pending',
      orderStatus: 'payment_review',
      paymentUnverifiedReason: cleanReason,
      paymentUnverifiedBy: adminIdentifier,
      paymentUnverifiedAt: serverTimestamp(),
      statusHistory: arrayUnion(auditEntry),
      updatedAt: serverTimestamp(),
    });

    const orderNumberStr = orderData?.orderNumber ? String(orderData.orderNumber) : docId.replace('order_', '');
    const payId = orderData?.paymentId || `PAY-${orderNumberStr}`;
    try {
      const payDocRef = doc(db, 'payments', payId);
      await updateDoc(payDocRef, {
        status: 'pending',
        paymentStatus: 'pending_verification',
        unverifiedReason: cleanReason,
        unverifiedBy: adminIdentifier,
        updatedAt: serverTimestamp(),
      });
    } catch {}

    return {
      success: true,
      message: 'Payment has been unverified. Order moved to Payment Review and fulfillment is blocked.',
    };
  } catch (err: any) {
    console.error('[Admin Data] adminUnverifyPayment error:', err);
    return { success: false, message: err?.message || 'Failed to unverify payment.' };
  }
}

/**
 * Admin flags a payment for fraud, duplicate UTR, or mismatched amount investigation.
 */
export async function adminFlagPayment(
  orderIdOrDocId: string,
  flagReason: string,
  adminIdentifier: string = 'Administrator'
): Promise<{ success: boolean; message: string }> {
  try {
    const cleanReason = flagReason.trim();
    if (!cleanReason) {
      return { success: false, message: 'Please provide a reason for flagging this payment.' };
    }
    const { ref: orderDocRef, data: orderData, docId } = await resolveOrderDoc(orderIdOrDocId);

    const auditEntry: OrderAuditEntry = {
      status: 'Flagged for Investigation',
      timestamp: new Date().toISOString(),
      actor: adminIdentifier,
      note: `Investigation flag: ${cleanReason}`,
    };

    await updateDoc(orderDocRef, {
      isFlagged: true,
      flagReason: cleanReason,
      paymentVerificationStatus: 'under_review',
      paymentStatus: 'under_review',
      orderStatus: 'payment_review',
      statusHistory: arrayUnion(auditEntry),
      updatedAt: serverTimestamp(),
    });

    const orderNumberStr = orderData?.orderNumber ? String(orderData.orderNumber) : docId.replace('order_', '');
    const payId = orderData?.paymentId || `PAY-${orderNumberStr}`;
    try {
      const payDocRef = doc(db, 'payments', payId);
      await updateDoc(payDocRef, {
        status: 'flagged',
        isFlagged: true,
        flagReason: cleanReason,
        updatedAt: serverTimestamp(),
      });
    } catch {}

    return { success: true, message: 'Transaction flagged for fraud/duplicate investigation.' };
  } catch (err: any) {
    console.error('[Admin Data] adminFlagPayment error:', err);
    return { success: false, message: err?.message || 'Failed to flag payment.' };
  }
}

/**
 * Admin edits permitted payment metadata (e.g., UTR correction, verification notes, staff assignment, amount received).
 * Strict Audit:
 * - Preserves old value, new value, admin UID, timestamp, and mandatory reason in an immutable audit log.
 * - Does not permit changing amount received without audited reconciliation.
 */
export async function adminEditPaymentMetadata(
  orderIdOrDocId: string,
  field: 'utrNumber' | 'verificationNotes' | 'assignedStaff' | 'amountReceived',
  newValue: string,
  reason: string,
  adminUid: string = 'admin',
  adminEmail: string = 'Administrator'
): Promise<{ success: boolean; message: string }> {
  try {
    const cleanReason = reason.trim();
    if (!cleanReason) {
      return { success: false, message: 'A mandatory audit reason is required to edit payment metadata.' };
    }

    if (field === 'utrNumber') {
      const val = validateUtrNumber(newValue);
      if (!val.valid) {
        return { success: false, message: val.message || 'Invalid 12-digit UTR format.' };
      }

      const cleanUtr = newValue.trim();
      const dupQuery = query(
        collection(db, 'orders'),
        where('utrNumber', '==', cleanUtr),
        where('paymentVerificationStatus', 'in', ['paid', 'confirmed']),
        limit(2)
      );
      const dupSnap = await getDocs(dupQuery);
      const { docId: currentDocId } = await resolveOrderDoc(orderIdOrDocId);
      for (const d of dupSnap.docs) {
        if (d.id !== currentDocId && d.data()?.orderId !== currentDocId.replace('order_', '')) {
          return {
            success: false,
            message: `Cannot assign UTR: Reference ${cleanUtr} has already been reconciled on Order #${d.data()?.orderId || d.id}. Duplicate references are prohibited.`,
          };
        }
      }
    }

    if (field === 'amountReceived') {
      const numVal = parseFloat(newValue);
      if (isNaN(numVal) || numVal < 0) {
        return { success: false, message: 'Amount received must be a valid non-negative number.' };
      }
    }

    const { ref: orderDocRef, data: orderData } = await resolveOrderDoc(orderIdOrDocId);
    const oldValue = orderData ? String(orderData[field] || '') : '';

    const auditLog: PaymentMetadataAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      field,
      oldValue,
      newValue,
      adminUid,
      adminEmail,
      reason: cleanReason,
      timestamp: new Date().toISOString(),
    };

    const auditEntry: OrderAuditEntry = {
      status: 'Metadata Edited',
      timestamp: new Date().toISOString(),
      actor: adminEmail,
      note: `Edited ${field} from "${oldValue}" to "${newValue}". Reason: ${cleanReason}`,
    };

    const updates: Record<string, any> = {
      [field]: field === 'amountReceived' ? parseFloat(newValue) : newValue,
      metadataAuditLogs: arrayUnion(auditLog),
      statusHistory: arrayUnion(auditEntry),
      updatedAt: serverTimestamp(),
    };

    await updateDoc(orderDocRef, updates);

    return { success: true, message: `Successfully updated ${field} with immutable audit log recorded.` };
  } catch (err: any) {
    console.error('[Admin Data] adminEditPaymentMetadata error:', err);
    return { success: false, message: err?.message || 'Failed to edit payment metadata.' };
  }
}

/**
 * Admin updates order fulfillment status and courier tracking info.
 */
export async function adminUpdateFulfillmentAndTracking(
  orderIdOrDocId: string,
  newStatus: OrderStatus | string,
  tracking?: {
    courierName?: string;
    courierTrackingId?: string;
    courierTrackingUrl?: string;
  },
  adminIdentifier: string = 'Administrator'
): Promise<{ success: boolean; message: string }> {
  try {
    const normalizedStatus = newStatus.toLowerCase();
    const { ref: orderDocRef, data: orderData, docId } = await resolveOrderDoc(orderIdOrDocId);

    // SECURITY SAFEGUARD: Prevent fulfillment/shipment when payment is unverified and prepayment is required
    const isFulfillmentState = ['packed', 'ready_to_ship', 'shipped', 'out for delivery', 'out_for_delivery', 'delivered'].includes(normalizedStatus);
    if (isFulfillmentState && orderData) {
      const isCod = Boolean(
        orderData.paymentMethod?.toLowerCase().includes('cash on delivery') ||
        orderData.paymentMethod?.toLowerCase().includes('cod')
      );
      const isPaymentVerified = Boolean(
        orderData.paymentStatus === 'paid' ||
        orderData.paymentVerificationStatus === 'paid' ||
        orderData.paymentVerificationStatus === 'confirmed'
      );

      if (!isCod && !isPaymentVerified) {
        return {
          success: false,
          message: 'Fulfillment Blocked: Prepayment is required for this order and payment has not been verified against merchant bank statements. Please verify payment in the Payments tab before packing or shipping.',
        };
      }
    }

    const auditEntry: OrderAuditEntry = {
      status: `Status changed to ${newStatus}`,
      timestamp: new Date().toISOString(),
      actor: adminIdentifier,
      note: tracking?.courierName
        ? `Fulfillment update: ${newStatus}. Courier: ${tracking.courierName} (AWB: ${tracking.courierTrackingId || 'N/A'})`
        : `Fulfillment update: ${newStatus}`,
    };

    const updates: Record<string, any> = {
      orderStatus: normalizedStatus,
      statusHistory: arrayUnion(auditEntry),
      updatedAt: serverTimestamp(),
    };

    if (normalizedStatus === 'packed') {
      updates.packedAt = serverTimestamp();
    } else if (normalizedStatus === 'shipped') {
      updates.shippedAt = serverTimestamp();
    } else if (normalizedStatus === 'delivered') {
      updates.deliveredAt = serverTimestamp();
    }

    if (tracking) {
      if (tracking.courierName !== undefined) updates.courierName = tracking.courierName.trim();
      if (tracking.courierTrackingId !== undefined) updates.courierTrackingId = tracking.courierTrackingId.trim();
      if (tracking.courierTrackingUrl !== undefined) updates.courierTrackingUrl = tracking.courierTrackingUrl.trim();
    }

    await updateDoc(orderDocRef, updates);

    // Dispatch milestone notification if shipped or delivered
    if (orderData && (normalizedStatus === 'shipped' || normalizedStatus === 'delivered')) {
      const normalizedOrder = mapFirestoreOrderToDetails(docId, {
        ...orderData,
        orderStatus: normalizedStatus,
        courierName: tracking?.courierName || orderData.courierName,
        courierTrackingId: tracking?.courierTrackingId || orderData.courierTrackingId,
        courierTrackingUrl: tracking?.courierTrackingUrl || orderData.courierTrackingUrl,
      });
      const milestone = normalizedStatus === 'shipped' ? 'dispatched' : 'delivered';
      queueMilestoneNotification(normalizedOrder, milestone).catch((e) =>
        console.warn('[Admin Data] Milestone notification notice:', e)
      );
    }

    return { success: true, message: `Order status updated to ${newStatus} successfully.` };
  } catch (err: any) {
    console.error('[Admin Data] adminUpdateFulfillmentAndTracking error:', err);
    return { success: false, message: err?.message || 'Failed to update order fulfillment.' };
  }
}

/**
 * Updates contact message status in Firestore.
 */
export async function updateAdminContactStatus(
  contactId: string,
  newStatus: 'new' | 'read' | 'replied' | 'closed'
): Promise<void> {
  const contactDocRef = doc(db, 'contacts', contactId);
  await updateDoc(contactDocRef, {
    status: newStatus,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Deletes a contact message from Firestore.
 */
export async function deleteAdminContact(contactId: string): Promise<void> {
  const contactDocRef = doc(db, 'contacts', contactId);
  await deleteDoc(contactDocRef);
}

/**
 * Updates review approval status in Firestore.
 */
export async function updateAdminReviewStatus(
  reviewId: string,
  newStatus: 'approved' | 'rejected' | 'hidden' | 'pending'
): Promise<void> {
  const reviewDocRef = doc(db, 'reviews', reviewId);
  await updateDoc(reviewDocRef, {
    status: newStatus,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Deletes a customer review from Firestore.
 */
export async function deleteAdminReview(reviewId: string): Promise<void> {
  const reviewDocRef = doc(db, 'reviews', reviewId);
  await deleteDoc(reviewDocRef);
}
