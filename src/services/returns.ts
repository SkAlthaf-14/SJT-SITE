/**
 * SJT FARMS - RETURNS & REFUNDS SERVICE
 * 
 * Provides verifiable handling for customer return and replacement requests:
 * 1. Initiate return request with order ownership verification.
 * 2. Persists genuine requests to Firestore and local storage.
 * 3. Never auto-approves perishable food returns; marks as 'under_review'.
 * 4. Checks return status against genuine records.
 */

import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { getOrderByLookup } from './orders';

const RETURNS_STORAGE_KEY = 'sjt_customer_returns';

export interface ReturnRequest {
  id: string; // e.g. "RET-1001-A2"
  orderId: string;
  customerName: string;
  customerContact: string;
  reason: string;
  items: string[];
  status: 'under_review' | 'replacement_approved' | 'rejected' | 'refund_processing' | 'refunded';
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

function getLocalReturns(): ReturnRequest[] {
  try {
    const raw = localStorage.getItem(RETURNS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalReturn(req: ReturnRequest): void {
  try {
    const existing = getLocalReturns();
    const updated = [req, ...existing.filter((r) => r.id !== req.id)];
    localStorage.setItem(RETURNS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

/**
 * Initiates a verifiable return or transit replacement request.
 */
export async function initiateReturnRequest(params: {
  orderId: string;
  contactVerification: string;
  reason: string;
  items?: string[];
}): Promise<{ success: boolean; returnId?: string; message: string }> {
  try {
    const { orderId, contactVerification, reason, items = [] } = params;

    if (!orderId.trim()) {
      return { success: false, message: 'Please provide a valid Order ID.' };
    }
    if (!reason.trim()) {
      return { success: false, message: 'Please provide a brief reason for return/replacement.' };
    }
    if (!contactVerification.trim()) {
      return { success: false, message: 'Please provide your registered email or phone for verification.' };
    }

    // 1. Verify customer ownership of the order
    const orderCheck = await getOrderByLookup(orderId, contactVerification);
    if (!orderCheck.success || !orderCheck.order) {
      return {
        success: false,
        message: orderCheck.message || 'Verification failed. Could not verify this order with the provided contact details.',
      };
    }

    const order = orderCheck.order;

    // Check for duplicate active return request for the same order
    const localExisting = getLocalReturns().find(
      (r) => r.orderId.toUpperCase() === order.orderId.toUpperCase() && r.status === 'under_review'
    );
    if (localExisting) {
      return {
        success: false,
        message: `An active return request (${localExisting.id}) is already under review for Order #${order.displayId || order.orderId}.`,
      };
    }

    const returnNumber = Math.floor(1000 + Math.random() * 9000);
    const returnId = `RET-${order.orderNumber || order.orderId}-${returnNumber}`;

    const newRequest: ReturnRequest = {
      id: returnId,
      orderId: order.orderId,
      customerName: order.customer.fullName,
      customerContact: contactVerification.trim(),
      reason: reason.trim(),
      items: items.length > 0 ? items : order.items.map((i) => `${i.product.name} (${i.selectedWeight})`),
      status: 'under_review',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: 'Request logged via SJT Concierge. Customer Care desk review required within 24–48 hours.',
    };

    // Save to Firestore if configured
    if (isFirebaseConfigured) {
      try {
        await addDoc(collection(db, 'returns'), {
          ...newRequest,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('[Returns Service] Firestore write notice:', err);
      }
    }

    // Save locally
    saveLocalReturn(newRequest);

    return {
      success: true,
      returnId,
      message: `Return request ${returnId} has been submitted. Our concierge team will review within 24–48 hours.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Unable to submit return request. Please contact support.',
    };
  }
}

/**
 * Checks status of an existing return request by Return ID or Order ID.
 */
export async function checkReturnStatus(
  queryInput: string
): Promise<{ success: boolean; request?: ReturnRequest; message?: string }> {
  try {
    const clean = queryInput.trim().toUpperCase();
    if (!clean) {
      return { success: false, message: 'Please enter a Return ID (e.g. RET-101-xxxx) or Order ID.' };
    }

    // 1. Check Cloud Firestore if configured
    if (isFirebaseConfigured) {
      try {
        const qById = query(collection(db, 'returns'), where('id', '==', clean));
        const snapById = await getDocs(qById);
        if (!snapById.empty) {
          return { success: true, request: snapById.docs[0].data() as ReturnRequest };
        }

        const qByOrder = query(collection(db, 'returns'), where('orderId', '==', clean.replace('#', '')));
        const snapByOrder = await getDocs(qByOrder);
        if (!snapByOrder.empty) {
          return { success: true, request: snapByOrder.docs[0].data() as ReturnRequest };
        }
      } catch (err) {
        console.warn('[Returns Service] Firestore status query notice:', err);
      }
    }

    // 2. Fallback to local storage
    const locals = getLocalReturns();
    const found = locals.find(
      (r) => r.id.toUpperCase() === clean || r.orderId.toUpperCase() === clean.replace('#', '')
    );

    if (found) {
      return { success: true, request: found };
    }

    return {
      success: false,
      message: `No return request found for "${queryInput}". Please verify your reference number or contact support.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Unable to check return status.',
    };
  }
}
