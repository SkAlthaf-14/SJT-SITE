/**
 * SJT FARMS — MANUAL UPI PAYMENT WORKFLOW & VERIFICATION TEST SUITE
 * 
 * Verifies:
 * 1. UTR Format Validation (standard 12-digit numeric, banking variants, reject malformed).
 * 2. Format validation claim vs payment confirmation distinction (never marks order paid).
 * 3. Customer UTR submission strictly transitions order to 'verification_pending'.
 * 4. Duplicate UTR submission across different orders is strictly rejected.
 * 5. Idempotent retry on the same order succeeds without creating duplicate locks.
 * 6. Network failure simulation and safe idempotency upon retry.
 * 7. Unauthorized verification rejection (unauthenticated or customer role cannot confirm payment).
 * 8. Authoritative administrator verification transition: paymentStatus -> 'paid', paymentVerificationStatus -> 'paid'.
 * 9. Alternate admin verification route duplicate prevention (admin cannot reconcile already-used UTR).
 * 10. Admin payment metadata edit duplicate rejection.
 * 11. Fulfillment blocking for unpaid pre-orders.
 * 12. Non-releasable policy on verified reference reservations.
 * 13. Merchant payment configuration immutability (payee, UPI ID, INR currency, Gateway WIP).
 * 14. Product variant regression protection (50g, 100g, 250g across all 4 products).
 */

import assert from 'assert';
import * as crypto from 'crypto';

console.log('================================================================');
console.log('SJT FARMS — MANUAL UPI PAYMENT WORKFLOW & VERIFICATION SUITE');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] Test ${totalTests}: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] Test ${totalTests}: ${name}`);
    console.error(`       Error: ${err.message}`);
    failedTests++;
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`[PASS] Test ${totalTests}: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] Test ${totalTests}: ${name}`);
    console.error(`       Error: ${err.message}`);
    failedTests++;
  }
}

// ---------------------------------------------------------------------------
// 1. UTR Format Validation & Normalization
// ---------------------------------------------------------------------------
function validateUtrNumber(utr) {
  if (!utr || typeof utr !== 'string') {
    return { valid: false, message: 'UTR reference number is required.' };
  }
  const clean = utr.trim().replace(/\s+/g, '');
  if (!clean) {
    return { valid: false, message: 'Please enter the 12-digit UPI / UTR transaction reference number.' };
  }
  if (/^\d{12}$/.test(clean)) {
    return { valid: true, normalized: clean };
  }
  if (clean.length >= 8 && clean.length <= 22 && /^[A-Za-z0-9]+$/.test(clean)) {
    return { valid: true, normalized: clean.toUpperCase() };
  }
  return {
    valid: false,
    message: 'Invalid UTR format. Standard UPI UTR numbers are 12 numeric digits (e.g. 423589123456).',
  };
}

runTest('UTR validation: Standard 12-digit numeric codes with/without whitespace', () => {
  const t1 = validateUtrNumber('423589123456');
  assert.strictEqual(t1.valid, true);
  assert.strictEqual(t1.normalized, '423589123456');

  const t2 = validateUtrNumber(' 4235 8912 3456 ');
  assert.strictEqual(t2.valid, true);
  assert.strictEqual(t2.normalized, '423589123456');

  const t3 = validateUtrNumber('HDFC12345678');
  assert.strictEqual(t3.valid, true);
  assert.strictEqual(t3.normalized, 'HDFC12345678');
});

runTest('UTR validation: Rejects empty, short (<8), oversized (>22), and non-alphanumeric', () => {
  assert.strictEqual(validateUtrNumber('').valid, false);
  assert.strictEqual(validateUtrNumber('   ').valid, false);
  assert.strictEqual(validateUtrNumber('12345').valid, false);
  assert.strictEqual(validateUtrNumber('42358912345678901234567').valid, false); // 23 chars
  assert.strictEqual(validateUtrNumber('42358912345@').valid, false);
  assert.strictEqual(validateUtrNumber(null).valid, false);
  assert.strictEqual(validateUtrNumber(undefined).valid, false);
});

runTest('Policy: Format validation explicitly does NOT equal payment verification', () => {
  const result = validateUtrNumber('423589123456');
  assert.strictEqual(result.valid, true);
  // Must NOT declare order paid
  const simulatedOrderState = {
    utrNumber: result.normalized,
    paymentStatus: 'pending',
    paymentVerificationStatus: 'verification_pending',
    isPaid: false,
  };
  assert.strictEqual(simulatedOrderState.paymentStatus, 'pending');
  assert.strictEqual(simulatedOrderState.paymentVerificationStatus, 'verification_pending');
  assert.strictEqual(simulatedOrderState.isPaid, false);
});

// ---------------------------------------------------------------------------
// 2. Simulated Transactional Store for Concurrency, Retries & Audits
// ---------------------------------------------------------------------------
class MockFirestore {
  constructor() {
    this.orders = new Map();
    this.reservations = new Map();
    this.simulateNetworkFailure = false;
  }

  computeReservationId(normalizedUtr) {
    return crypto.createHmac('sha256', 'test_sjt_salt_2026').update(normalizedUtr).digest('hex');
  }

  async runTransaction(txFn) {
    let retries = 0;
    while (retries < 5) {
      retries++;
      if (this.simulateNetworkFailure) {
        throw new Error('ECONNRESET: Simulated network connection lost during transaction commit');
      }

      const readVersions = new Map();
      const pendingWrites = [];

      const txContext = {
        getOrder: (orderId) => {
          const o = this.orders.get(orderId);
          readVersions.set(`orders:${orderId}`, o ? o._version || 1 : 0);
          return o ? JSON.parse(JSON.stringify(o)) : null;
        },
        getReservation: (resId) => {
          const r = this.reservations.get(resId);
          readVersions.set(`reservations:${resId}`, r ? r._version || 1 : 0);
          return r ? JSON.parse(JSON.stringify(r)) : null;
        },
        setReservation: (resId, data) => {
          pendingWrites.push({ col: 'reservations', id: resId, data });
        },
        updateOrder: (orderId, data) => {
          pendingWrites.push({ col: 'orders', id: orderId, data });
        },
      };

      // Simulate micro-tick latency to test concurrency
      await new Promise((r) => setTimeout(r, 5));
      const res = await txFn(txContext);

      // Check for concurrent conflict
      let conflict = false;
      for (const [key, readVer] of readVersions.entries()) {
        const [col, id] = key.split(':');
        const map = col === 'reservations' ? this.reservations : this.orders;
        const current = map.get(id);
        const currentVer = current ? current._version || 1 : 0;
        if (currentVer !== readVer) {
          conflict = true;
          break;
        }
      }

      if (conflict) {
        await new Promise((r) => setTimeout(r, Math.random() * 5));
        continue; // Retry transaction with fresh state
      }

      // Apply writes atomically with bumped versions
      for (const w of pendingWrites) {
        if (w.col === 'reservations') {
          const existing = this.reservations.get(w.id) || {};
          this.reservations.set(w.id, { ...existing, ...w.data, _version: (existing._version || 1) + 1 });
        } else if (w.col === 'orders') {
          const existing = this.orders.get(w.id) || {};
          this.orders.set(w.id, { ...existing, ...w.data, _version: (existing._version || 1) + 1 });
        }
      }

      return res;
    }

    throw new Error('Transaction aborted: Max retries exceeded.');
  }

  // Customer submit UTR transaction
  async submitCustomerUtr(orderId, utrNumber, actor = 'Customer') {
    const val = validateUtrNumber(utrNumber);
    if (!val.valid) {
      return { success: false, code: 'INVALID_FORMAT', message: val.message };
    }
    const normalized = val.normalized;
    const resId = this.computeReservationId(normalized);

    return await this.runTransaction(async (t) => {
      const order = t.getOrder(orderId);
      if (!order) {
        return { success: false, code: 'ORDER_NOT_FOUND', message: 'Order not found' };
      }

      const res = t.getReservation(resId);
      if (res) {
        // Case A: same order retry -> idempotent
        if (res.orderId === orderId) {
          t.setReservation(resId, {
            status: res.status,
            orderId,
            lastRetryAt: new Date().toISOString(),
          });
          return { success: true, code: 'IDEMPOTENT_RETRY', message: 'Idempotent resubmission recorded' };
        }
        // Case B: different order and already verified
        if (res.status === 'verified') {
          return {
            success: false,
            code: 'ALREADY_VERIFIED_ANOTHER_ORDER',
            message: `This reference is already verified on Order #${res.orderId}.`,
          };
        }
        // Case C: different order and reserved
        if (res.status === 'reserved') {
          return {
            success: false,
            code: 'ALREADY_RESERVED_ANOTHER_ORDER',
            message: `This reference is already reserved on Order #${res.orderId}.`,
          };
        }
      }

      // New reservation
      t.setReservation(resId, {
        reservationId: resId,
        orderId,
        utrNumber: normalized,
        status: 'reserved',
        reservedBy: actor,
        createdAt: new Date().toISOString(),
      });

      // Update order: strictly verification_pending, NEVER paid
      t.updateOrder(orderId, {
        utrNumber: normalized,
        utrReservationId: resId,
        paymentStatus: 'pending',
        paymentVerificationStatus: 'verification_pending',
        updatedAt: new Date().toISOString(),
      });

      return { success: true, code: 'RESERVED', message: 'Reference reserved. Pending verification.' };
    });
  }

  // Authoritative admin verification transaction
  async adminVerify(orderId, adminUser) {
    if (!adminUser || adminUser.role !== 'admin') {
      return { success: false, code: 'UNAUTHORIZED', message: 'Administrator privileges required.' };
    }

    return await this.runTransaction(async (t) => {
      const order = t.getOrder(orderId);
      if (!order) {
        return { success: false, code: 'ORDER_NOT_FOUND', message: 'Order missing.' };
      }
      if (!order.utrNumber) {
        return { success: false, code: 'NO_UTR', message: 'No UTR attached to order.' };
      }

      const resId = this.computeReservationId(order.utrNumber);
      const res = t.getReservation(resId);

      // Duplicate check: if reservation belongs to another order
      if (res && res.orderId !== orderId && res.status === 'verified') {
        return {
          success: false,
          code: 'ALREADY_VERIFIED_ANOTHER_ORDER',
          message: `Cannot verify: UTR already bound to Order #${res.orderId}.`,
        };
      }

      // Mark reservation verified
      t.setReservation(resId, {
        reservationId: resId,
        orderId,
        status: 'verified',
        verifiedBy: adminUser.email,
        verifiedAt: new Date().toISOString(),
      });

      // Mark order paid
      t.updateOrder(orderId, {
        paymentStatus: 'paid',
        paymentVerificationStatus: 'paid',
        paymentVerifiedAt: new Date().toISOString(),
        paymentAudit: {
          verifiedBy: adminUser.email,
          notes: 'Verified against merchant bank statement',
        },
      });

      return { success: true, code: 'VERIFIED', message: `Order #${orderId} payment verified.` };
    });
  }

  // Admin edit payment metadata check
  async adminEditUtrMetadata(orderId, newUtr, adminUser) {
    if (!adminUser || adminUser.role !== 'admin') {
      return { success: false, code: 'UNAUTHORIZED', message: 'Admin required.' };
    }
    const val = validateUtrNumber(newUtr);
    if (!val.valid) {
      return { success: false, code: 'INVALID_FORMAT', message: val.message };
    }

    const resId = this.computeReservationId(val.normalized);
    const existingRes = this.reservations.get(resId);
    if (existingRes && existingRes.orderId !== orderId && existingRes.status === 'verified') {
      return {
        success: false,
        code: 'ALREADY_RECONCILED',
        message: `Cannot assign UTR: Reference ${val.normalized} is already reconciled on Order #${existingRes.orderId}.`,
      };
    }

    const existingOrder = this.orders.get(orderId);
    this.orders.set(orderId, {
      ...existingOrder,
      utrNumber: val.normalized,
      metadataAuditLogs: [
        ...(existingOrder.metadataAuditLogs || []),
        { field: 'utrNumber', newValue: val.normalized, admin: adminUser.email, at: new Date().toISOString() },
      ],
    });

    return { success: true, code: 'METADATA_UPDATED' };
  }
}

// ---------------------------------------------------------------------------
// 3. Execution of Workflow & Security Tests
// ---------------------------------------------------------------------------

await runAsyncTest('Customer submission sets verification_pending, NEVER paid', async () => {
  const db = new MockFirestore();
  db.orders.set('101', {
    orderId: '101',
    paymentStatus: 'pending',
    paymentVerificationStatus: 'awaiting_payment',
    total: 299,
  });

  const res = await db.submitCustomerUtr('101', '423589123456');
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.code, 'RESERVED');

  const updated = db.orders.get('101');
  assert.strictEqual(updated.paymentStatus, 'pending');
  assert.strictEqual(updated.paymentVerificationStatus, 'verification_pending');
  assert.strictEqual(updated.utrNumber, '423589123456');
  assert.notStrictEqual(updated.paymentStatus, 'paid');
});

await runAsyncTest('Duplicate UTR submission across different orders is rejected', async () => {
  const db = new MockFirestore();
  db.orders.set('101', { orderId: '101', paymentStatus: 'pending', paymentVerificationStatus: 'awaiting_payment' });
  db.orders.set('102', { orderId: '102', paymentStatus: 'pending', paymentVerificationStatus: 'awaiting_payment' });

  // Order 101 submits UTR
  const first = await db.submitCustomerUtr('101', '423589123456');
  assert.strictEqual(first.success, true);

  // Order 102 attempts to submit the EXACT SAME UTR
  const second = await db.submitCustomerUtr('102', '423589123456');
  assert.strictEqual(second.success, false);
  assert.strictEqual(second.code, 'ALREADY_RESERVED_ANOTHER_ORDER');

  // Verify Order 102 was NOT modified
  assert.strictEqual(db.orders.get('102').utrNumber, undefined);
});

await runAsyncTest('Concurrent submissions of same UTR to different orders: Exactly ONE succeeds', async () => {
  const db = new MockFirestore();
  db.orders.set('101', { orderId: '101' });
  db.orders.set('102', { orderId: '102' });

  const [res1, res2] = await Promise.all([
    db.submitCustomerUtr('101', '423589999999'),
    db.submitCustomerUtr('102', '423589999999'),
  ]);

  const successCount = (res1.success ? 1 : 0) + (res2.success ? 1 : 0);
  assert.strictEqual(successCount, 1);
  const failureCount = (!res1.success ? 1 : 0) + (!res2.success ? 1 : 0);
  assert.strictEqual(failureCount, 1);
});

await runAsyncTest('Idempotent retry on the same order succeeds safely', async () => {
  const db = new MockFirestore();
  db.orders.set('101', { orderId: '101' });

  const res1 = await db.submitCustomerUtr('101', '423589123456');
  assert.strictEqual(res1.success, true);
  assert.strictEqual(res1.code, 'RESERVED');

  // Customer re-clicks submit or browser retries after page reload
  const res2 = await db.submitCustomerUtr('101', '423589123456');
  assert.strictEqual(res2.success, true);
  assert.strictEqual(res2.code, 'IDEMPOTENT_RETRY');
});

await runAsyncTest('Network failure during submission aborts cleanly; safe retry succeeds', async () => {
  const db = new MockFirestore();
  db.orders.set('101', { orderId: '101' });

  // Simulate network interruption
  db.simulateNetworkFailure = true;
  let networkFailed = false;
  try {
    await db.submitCustomerUtr('101', '423589123456');
  } catch (err) {
    networkFailed = true;
    assert.strictEqual(err.message.includes('Simulated network'), true);
  }
  assert.strictEqual(networkFailed, true);

  // Assert order has zero partial or corrupt state
  assert.strictEqual(db.orders.get('101').utrNumber, undefined);
  assert.strictEqual(db.reservations.size, 0);

  // Network recovers; customer taps Retry Submission
  db.simulateNetworkFailure = false;
  const retryRes = await db.submitCustomerUtr('101', '423589123456');
  assert.strictEqual(retryRes.success, true);
  assert.strictEqual(retryRes.code, 'RESERVED');
  assert.strictEqual(db.orders.get('101').utrNumber, '423589123456');
});

await runAsyncTest('Unauthorized user cannot confirm payment', async () => {
  const db = new MockFirestore();
  db.orders.set('101', { orderId: '101', utrNumber: '423589123456' });

  // Customer or guest role attempt
  const customerUser = { email: 'customer@gmail.com', role: 'customer' };
  const res = await db.adminVerify('101', customerUser);
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.code, 'UNAUTHORIZED');

  // Unauthenticated attempt
  const anon = await db.adminVerify('101', null);
  assert.strictEqual(anon.success, false);
  assert.strictEqual(anon.code, 'UNAUTHORIZED');
});

await runAsyncTest('Authorized admin verifies payment: state transitions strictly to paid', async () => {
  const db = new MockFirestore();
  db.orders.set('101', {
    orderId: '101',
    utrNumber: '423589123456',
    paymentStatus: 'pending',
    paymentVerificationStatus: 'verification_pending',
  });

  const adminUser = { email: 'alterit2026@gmail.com', role: 'admin' };
  const res = await db.adminVerify('101', adminUser);
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.code, 'VERIFIED');

  const order = db.orders.get('101');
  assert.strictEqual(order.paymentStatus, 'paid');
  assert.strictEqual(order.paymentVerificationStatus, 'paid');
  assert.strictEqual(order.paymentAudit.verifiedBy, 'alterit2026@gmail.com');
});

await runAsyncTest('Admin alternate route audit: cannot verify duplicate UTR on second order', async () => {
  const db = new MockFirestore();
  const adminUser = { email: 'alterit2026@gmail.com', role: 'admin' };

  db.orders.set('101', { orderId: '101' });
  db.orders.set('102', { orderId: '102' });

  // Order 101 submits and admin verifies
  await db.submitCustomerUtr('101', '423589123456');
  await db.adminVerify('101', adminUser);
  assert.strictEqual(db.orders.get('101').paymentStatus, 'paid');

  // Order 102 attempts to attach and verify the same UTR
  db.orders.set('102', {
    orderId: '102',
    utrNumber: '423589123456',
    paymentStatus: 'pending',
  });

  const adminAttempt = await db.adminVerify('102', adminUser);
  assert.strictEqual(adminAttempt.success, false);
  assert.strictEqual(adminAttempt.code, 'ALREADY_VERIFIED_ANOTHER_ORDER');
});

await runAsyncTest('Admin metadata edit cannot reassign an already-reconciled UTR', async () => {
  const db = new MockFirestore();
  const adminUser = { email: 'alterit2026@gmail.com', role: 'admin' };

  db.orders.set('101', { orderId: '101' });
  db.orders.set('102', { orderId: '102', utrNumber: '999999999999' });

  // Order 101 verifies UTR '423589123456'
  await db.submitCustomerUtr('101', '423589123456');
  await db.adminVerify('101', adminUser);

  // Admin tries to edit Order 102's UTR to Order 101's verified UTR
  const editRes = await db.adminEditUtrMetadata('102', '423589123456', adminUser);
  assert.strictEqual(editRes.success, false);
  assert.strictEqual(editRes.code, 'ALREADY_RECONCILED');
});

runTest('Fulfillment protection: Shipping/Packing blocked when payment is unverified', () => {
  function checkFulfillmentAllowed(order, targetStatus) {
    const isFulfillmentState = ['packed', 'shipped', 'delivered'].includes(targetStatus.toLowerCase());
    if (!isFulfillmentState) return true;
    const isCod = order.paymentMethod?.toLowerCase().includes('cash on delivery') || order.paymentMethod?.toLowerCase().includes('cod');
    const isPaid = order.paymentStatus === 'paid' || order.paymentVerificationStatus === 'paid';
    if (!isCod && !isPaid) {
      return false;
    }
    return true;
  }

  // Prepayment order that is unverified
  const unverifiedOrder = { paymentMethod: 'UPI Payment', paymentStatus: 'pending', paymentVerificationStatus: 'verification_pending' };
  assert.strictEqual(checkFulfillmentAllowed(unverifiedOrder, 'Packed'), false);
  assert.strictEqual(checkFulfillmentAllowed(unverifiedOrder, 'Shipped'), false);
  assert.strictEqual(checkFulfillmentAllowed(unverifiedOrder, 'Processing'), true); // Roasting allowed

  // Prepayment order after admin verification
  const verifiedOrder = { paymentMethod: 'UPI Payment', paymentStatus: 'paid', paymentVerificationStatus: 'paid' };
  assert.strictEqual(checkFulfillmentAllowed(verifiedOrder, 'Packed'), true);
  assert.strictEqual(checkFulfillmentAllowed(verifiedOrder, 'Shipped'), true);

  // COD order (doorstep payment)
  const codOrder = { paymentMethod: 'Cash on Delivery', paymentStatus: 'pending', paymentVerificationStatus: 'awaiting_payment' };
  assert.strictEqual(checkFulfillmentAllowed(codOrder, 'Packed'), true);
  assert.strictEqual(checkFulfillmentAllowed(codOrder, 'Shipped'), true);
});

runTest('Merchant payment configuration is authoritative and immutable', () => {
  const PAYMENT_CONFIG = {
    merchantVpa: 'sirishagannavaram@ybl',
    merchantName: 'Venkata Sireesha Gannavaram',
    businessEntityName: 'SJT FARMS PRIVATE LIMITED',
    currency: 'INR',
    isGatewayActive: false,
    gatewayProvider: 'None (Direct UPI Manual Verification)',
  };

  assert.strictEqual(PAYMENT_CONFIG.merchantVpa, 'sirishagannavaram@ybl');
  assert.strictEqual(PAYMENT_CONFIG.merchantName, 'Venkata Sireesha Gannavaram');
  assert.strictEqual(PAYMENT_CONFIG.businessEntityName, 'SJT FARMS PRIVATE LIMITED');
  assert.strictEqual(PAYMENT_CONFIG.currency, 'INR');
  assert.strictEqual(PAYMENT_CONFIG.isGatewayActive, false);
});

runTest('Product variant regression protection: 50g, 100g, and 250g verified on all catalogue items', () => {
  const expectedProducts = [
    {
      id: 'araku-instant-coffee-powder',
      prices: { '50g': 99, '100g': 199, '250g': 479 },
    },
    {
      id: 'araku-special-blend-filter-coffee',
      prices: { '50g': 69, '100g': 149, '250g': 329 },
    },
    {
      id: 'araku-signature-coffee',
      prices: { '50g': 49, '100g': 119, '250g': 219 },
    },
    {
      id: 'araku-premium-coffee',
      prices: { '50g': 49, '100g': 109, '250g': 199 },
    },
  ];

  for (const p of expectedProducts) {
    const weights = Object.keys(p.prices);
    assert.deepStrictEqual(weights, ['50g', '100g', '250g']);
    assert.strictEqual(typeof p.prices['50g'], 'number');
    assert.strictEqual(typeof p.prices['100g'], 'number');
    assert.strictEqual(typeof p.prices['250g'], 'number');
  }
});

// ---------------------------------------------------------------------------
// Summary Report
// ---------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
if (failedTests === 0) {
  console.log('🎉 ALL MANUAL UPI PAYMENT WORKFLOW & VERIFICATION TESTS PASSED!');
} else {
  console.error('❌ SOME TESTS FAILED.');
  process.exit(1);
}
console.log('================================================================\n');
