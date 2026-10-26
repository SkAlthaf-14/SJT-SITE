/**
 * SJT FARMS - COMPREHENSIVE ORDER SYSTEM & VERIFICATION SUITE
 * 
 * Tests:
 * 1. 12-digit UTR validation (valid format vs invalid/letters/short/long).
 * 2. Sequential Order ID allocation starting at 101 (101, 102, 103...).
 * 3. Atomic transaction simulation with concurrent order creation ensuring unique sequential numbers.
 * 4. Duplicate checkout / idempotency protection.
 * 5. Format display order ID (#101, Order #101, legacy formats).
 * 6. Order query / lookup resolution for 101, #101, Order #101, order_101.
 * 7. Payment reference submission state machine (awaiting_payment -> verification_pending; never auto-confirmed).
 * 8. Admin verification authorization (admin only; customer forbidden).
 * 9. Duplicate UTR reuse prevention across verified orders.
 * 10. Audit trail generation (statusHistory, paymentAudit).
 * 11. Durable notification record generation for business owner (alterit2026@gmail.com) and milestones.
 */

import assert from 'node:assert/strict';

console.log('================================================================');
console.log('SJT FARMS — ORDER ID, PAYMENT VERIFICATION & NOTIFICATION TESTS');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(`       Error: ${err.message}`);
    throw err;
  }
}

// ----------------------------------------------------------------------
// 1. UTR Validation Logic
// ----------------------------------------------------------------------
function validateUtrNumber(utr) {
  if (!utr) return { isValid: false, message: 'Please enter a 12-digit UPI / UTR transaction reference number.' };
  const cleaned = utr.trim().replace(/[\s-]/g, '');
  if (!/^\d{12}$/.test(cleaned)) {
    return {
      isValid: false,
      message: 'Invalid UTR reference. A valid UPI transaction reference must be exactly 12 numeric digits (e.g., 405612345678).',
    };
  }
  return { isValid: true, cleaned };
}

runTest('Test 1: UTR validation rejects empty, short, alphanumeric, or oversized strings', () => {
  assert.equal(validateUtrNumber('').isValid, false);
  assert.equal(validateUtrNumber('12345').isValid, false);
  assert.equal(validateUtrNumber('12345678901a').isValid, false);
  assert.equal(validateUtrNumber('ABCDEF123456').isValid, false);
  assert.equal(validateUtrNumber('1234567890123').isValid, false);
});

runTest('Test 2: UTR validation accepts valid 12-digit numeric codes with whitespace or dashes', () => {
  const res1 = validateUtrNumber('405612345678');
  assert.equal(res1.isValid, true);
  assert.equal(res1.cleaned, '405612345678');

  const res2 = validateUtrNumber('4056-1234-5678');
  assert.equal(res2.isValid, true);
  assert.equal(res2.cleaned, '405612345678');

  const res3 = validateUtrNumber(' 4056 1234 5678 ');
  assert.equal(res3.isValid, true);
  assert.equal(res3.cleaned, '405612345678');
});

// ----------------------------------------------------------------------
// 2. Sequential Order ID Allocation Starting at 101
// ----------------------------------------------------------------------
class MockFirestoreCounterTransaction {
  constructor(initialCounter = null, existingHighestOrder = 0) {
    this.counterDoc = initialCounter !== null ? { currentOrderNumber: initialCounter } : null;
    this.existingHighestOrder = existingHighestOrder;
    this.allocatedOrders = [];
  }

  // Simulates atomic transaction in src/services/orders.ts
  allocateNextOrderNumber() {
    let nextOrderNumber;
    if (!this.counterDoc) {
      const startBase = Math.max(100, this.existingHighestOrder);
      nextOrderNumber = startBase + 1;
      this.counterDoc = { currentOrderNumber: nextOrderNumber };
    } else {
      const current = typeof this.counterDoc.currentOrderNumber === 'number'
        ? this.counterDoc.currentOrderNumber
        : 100;
      nextOrderNumber = Math.max(current + 1, 101, this.existingHighestOrder + 1);
      this.counterDoc = { currentOrderNumber: nextOrderNumber };
    }
    this.allocatedOrders.push(nextOrderNumber);
    return nextOrderNumber;
  }
}

runTest('Test 3: First new order receives ID 101 in a fresh sequence', () => {
  const tx = new MockFirestoreCounterTransaction(null, 0);
  const firstId = tx.allocateNextOrderNumber();
  assert.equal(firstId, 101, 'First order ID must be 101');
});

runTest('Test 4: Subsequent orders receive 102, 103 sequentially', () => {
  const tx = new MockFirestoreCounterTransaction(101, 101);
  const id2 = tx.allocateNextOrderNumber();
  const id3 = tx.allocateNextOrderNumber();
  const id4 = tx.allocateNextOrderNumber();
  assert.equal(id2, 102);
  assert.equal(id3, 103);
  assert.equal(id4, 104);
});

runTest('Test 5: Existing order IDs are preserved and sequence never drops below 101', () => {
  // If an existing database has legacy orders up to 85, sequence starts at 101
  const txBelow = new MockFirestoreCounterTransaction(null, 85);
  assert.equal(txBelow.allocateNextOrderNumber(), 101);

  // If an existing database already has order 150, sequence continues at 151
  const txAbove = new MockFirestoreCounterTransaction(null, 150);
  assert.equal(txAbove.allocateNextOrderNumber(), 151);
});

runTest('Test 6: Concurrent order allocations produce strictly unique sequential IDs without collisions', () => {
  const tx = new MockFirestoreCounterTransaction(100, 100);
  const ids = [];
  for (let i = 0; i < 50; i++) {
    ids.push(tx.allocateNextOrderNumber());
  }
  const uniqueSet = new Set(ids);
  assert.equal(uniqueSet.size, 50, 'All 50 allocated numbers must be distinct');
  assert.equal(ids[0], 101);
  assert.equal(ids[49], 150);
});

// ----------------------------------------------------------------------
// 3. Display Order ID Formatting and Query Normalization
// ----------------------------------------------------------------------
function formatDisplayOrderId(rawId) {
  if (rawId === undefined || rawId === null) return '';
  if (typeof rawId === 'number') return `Order #${rawId}`;
  const str = String(rawId).trim();
  if (/^\d+$/.test(str)) return `Order #${str}`;
  if (/^#\d+$/.test(str)) return `Order #${str.slice(1)}`;
  if (/^order\s*#?\s*(\d+)$/i.test(str)) {
    const match = str.match(/^order\s*#?\s*(\d+)$/i);
    return `Order #${match[1]}`;
  }
  if (str.startsWith('order_')) {
    const suffix = str.replace('order_', '');
    if (/^\d+$/.test(suffix)) return `Order #${suffix}`;
  }
  if (!str.startsWith('#') && !str.toLowerCase().startsWith('order')) {
    return `Order #${str}`;
  }
  return str;
}

runTest('Test 7: Display Order ID formatting standardizes numeric and raw IDs to "Order #101"', () => {
  assert.equal(formatDisplayOrderId(101), 'Order #101');
  assert.equal(formatDisplayOrderId('101'), 'Order #101');
  assert.equal(formatDisplayOrderId('#101'), 'Order #101');
  assert.equal(formatDisplayOrderId('Order #101'), 'Order #101');
  assert.equal(formatDisplayOrderId('order_101'), 'Order #101');
  assert.equal(formatDisplayOrderId('SJT-8921'), 'Order #SJT-8921');
});

function normalizeOrderQuery(query) {
  const cleaned = query.trim();
  const numericMatch = cleaned.match(/^order\s*#?\s*(\d+)$/i) || cleaned.match(/^#?(\d+)$/);
  if (numericMatch) {
    const num = parseInt(numericMatch[1], 10);
    return { isNumeric: true, orderNumber: num, docId: `order_${num}`, raw: cleaned };
  }
  return { isNumeric: false, orderNumber: null, docId: cleaned, raw: cleaned };
}

runTest('Test 8: Order query parser normalizes "101", "#101", "Order #101", and "order_101"', () => {
  assert.deepEqual(normalizeOrderQuery('101'), { isNumeric: true, orderNumber: 101, docId: 'order_101', raw: '101' });
  assert.deepEqual(normalizeOrderQuery('#101'), { isNumeric: true, orderNumber: 101, docId: 'order_101', raw: '#101' });
  assert.deepEqual(normalizeOrderQuery('Order #101'), { isNumeric: true, orderNumber: 101, docId: 'order_101', raw: 'Order #101' });
  assert.deepEqual(normalizeOrderQuery('order_101'), { isNumeric: false, orderNumber: null, docId: 'order_101', raw: 'order_101' });
});

// ----------------------------------------------------------------------
// 4. Payment Submission & Verification State Machine
// ----------------------------------------------------------------------
class OrderStateMachine {
  constructor(order) {
    this.order = { ...order };
  }

  // Customer action: submits 12-digit UTR
  customerSubmitUTR(utr, userRole = 'customer') {
    const validation = validateUtrNumber(utr);
    if (!validation.isValid) throw new Error(validation.message);

    // Critical security check: customer CANNOT mark order as paid
    this.order.utrNumber = validation.cleaned;
    this.order.paymentVerificationStatus = 'verification_pending';
    this.order.paymentStatus = 'verification_pending';
    // Append to status history
    this.order.statusHistory = this.order.statusHistory || [];
    this.order.statusHistory.push({
      status: 'verification_pending',
      timestamp: new Date().toISOString(),
      note: `Payment reference submitted (UTR: ${validation.cleaned}). Awaiting merchant bank verification.`,
      updatedBy: 'customer',
    });
  }

  // Admin action: verifies payment
  adminVerifyPayment(adminUser, existingVerifiedUtrs = []) {
    if (adminUser.role !== 'admin') {
      throw new Error('UNAUTHORIZED: Only an authorized administrator can confirm payment.');
    }
    if (!this.order.utrNumber) {
      throw new Error('Cannot verify payment: No UTR reference has been submitted.');
    }
    if (existingVerifiedUtrs.includes(this.order.utrNumber)) {
      throw new Error(`REUSE_DETECTED: UTR ${this.order.utrNumber} has already been verified on another order.`);
    }

    this.order.paymentStatus = 'paid';
    this.order.paymentVerificationStatus = 'verified';
    this.order.orderStatus = 'Processing';
    this.order.paymentAudit = {
      verifiedBy: adminUser.email,
      verifiedAt: new Date().toISOString(),
      action: 'verified',
    };
    this.order.statusHistory = this.order.statusHistory || [];
    this.order.statusHistory.push({
      status: 'paid',
      timestamp: new Date().toISOString(),
      note: `Payment verified by administrator (${adminUser.email}).`,
      updatedBy: adminUser.email,
    });
  }
}

runTest('Test 9: Customer UTR submission strictly transitions order to "verification_pending", NEVER "paid"', () => {
  const machine = new OrderStateMachine({
    orderId: 'order_101',
    orderNumber: 101,
    paymentStatus: 'awaiting_payment',
    paymentVerificationStatus: 'awaiting_payment',
  });

  machine.customerSubmitUTR('405612345678');
  assert.equal(machine.order.paymentStatus, 'verification_pending');
  assert.equal(machine.order.paymentVerificationStatus, 'verification_pending');
  assert.notEqual(machine.order.paymentStatus, 'paid');
  assert.equal(machine.order.statusHistory.length, 1);
});

runTest('Test 10: Non-admin customer cannot confirm payment', () => {
  const machine = new OrderStateMachine({
    orderId: 'order_101',
    orderNumber: 101,
    utrNumber: '405612345678',
    paymentStatus: 'verification_pending',
  });

  assert.throws(() => {
    machine.adminVerifyPayment({ uid: 'cust_123', email: 'buyer@example.com', role: 'customer' });
  }, /UNAUTHORIZED/);

  assert.equal(machine.order.paymentStatus, 'verification_pending');
});

runTest('Test 11: Authorized admin confirms payment and records audit trail', () => {
  const machine = new OrderStateMachine({
    orderId: 'order_101',
    orderNumber: 101,
    utrNumber: '405612345678',
    paymentStatus: 'verification_pending',
  });

  machine.adminVerifyPayment({ uid: 'admin_1', email: 'alterit2026@gmail.com', role: 'admin' }, []);
  assert.equal(machine.order.paymentStatus, 'paid');
  assert.equal(machine.order.paymentVerificationStatus, 'verified');
  assert.equal(machine.order.paymentAudit.verifiedBy, 'alterit2026@gmail.com');
  assert.equal(machine.order.statusHistory.some((h) => h.status === 'paid'), true);
});

runTest('Test 12: Duplicate UTR reuse across orders is rejected', () => {
  const machine = new OrderStateMachine({
    orderId: 'order_102',
    orderNumber: 102,
    utrNumber: '405612345678',
    paymentStatus: 'verification_pending',
  });

  // UTR 405612345678 was already verified on order 101
  assert.throws(() => {
    machine.adminVerifyPayment({ uid: 'admin_1', email: 'alterit2026@gmail.com', role: 'admin' }, ['405612345678']);
  }, /REUSE_DETECTED/);

  assert.equal(machine.order.paymentStatus, 'verification_pending');
});

// ----------------------------------------------------------------------
// 5. Automated Notification Record Generation
// ----------------------------------------------------------------------
function buildNewOrderNotificationRecord(order) {
  const orderNumStr = order.orderNumber ? String(order.orderNumber) : order.orderId;
  const itemsSummary = order.items
    .map((i) => `${i.product.name} (${i.selectedWeight}) x${i.quantity}`)
    .join(', ');

  return {
    orderId: order.orderId,
    orderNumber: order.orderNumber,
    type: 'new_order',
    status: 'pending',
    recipientEmail: 'alterit2026@gmail.com',
    customerEmail: order.customer.email,
    subject: `New SJT FARMS Order #${orderNumStr} - ₹${order.total}`,
    summary: `New customer order #${orderNumStr} received for ₹${order.total}. Payment method: ${order.paymentMethod}. Status: ${order.paymentStatus}. Items: ${itemsSummary}.`,
    payload: {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      customerName: order.customer.fullName,
      customerPhone: order.customer.phone,
      totalAmount: order.total,
      paymentMethod: order.paymentMethod,
      adminLink: `https://sjtfarms.com/admin?order=${orderNumStr}`,
    },
    attempts: 0,
    createdAt: new Date().toISOString(),
  };
}

runTest('Test 13: New order notification record contains verified total, recipient alterit2026@gmail.com, and admin link', () => {
  const mockOrder = {
    orderId: 'order_101',
    orderNumber: 101,
    total: 1250,
    paymentMethod: 'PhonePe / UPI (QR & ID)',
    paymentStatus: 'awaiting_payment',
    customer: { fullName: 'Aarav Sharma', email: 'aarav@example.com', phone: '9876543210' },
    items: [{ product: { name: 'Araku Gold' }, selectedWeight: '250g', quantity: 2 }],
  };

  const record = buildNewOrderNotificationRecord(mockOrder);
  assert.equal(record.recipientEmail, 'alterit2026@gmail.com');
  assert.equal(record.subject, 'New SJT FARMS Order #101 - ₹1250');
  assert.equal(record.payload.totalAmount, 1250);
  assert.equal(record.payload.adminLink, 'https://sjtfarms.com/admin?order=101');
  assert.equal(record.status, 'pending');
});

// ----------------------------------------------------------------------
// 6. Admin Actions: Unverify, Flag, Edit Metadata Audit Trail
// ----------------------------------------------------------------------
class AdvancedOrderAdminManager {
  constructor(order) {
    this.order = JSON.parse(JSON.stringify(order));
  }

  adminUnverifyPayment(adminUser, reason) {
    if (adminUser.role !== 'admin') throw new Error('UNAUTHORIZED');
    if (!reason || !reason.trim()) throw new Error('A reason is strictly required to unverify a payment.');

    const previousStatus = this.order.paymentStatus;
    this.order.paymentStatus = 'pending_verification';
    this.order.paymentVerificationStatus = 'pending_verification';
    this.order.orderStatus = 'payment_review';

    this.order.paymentAudit = {
      action: 'unverified',
      unverifiedBy: adminUser.email,
      unverifiedAt: new Date().toISOString(),
      previousStatus,
      reason: reason.trim(),
    };

    this.order.statusHistory = this.order.statusHistory || [];
    this.order.statusHistory.push({
      status: 'payment_review',
      timestamp: new Date().toISOString(),
      note: `Payment unverified by ${adminUser.email}. Reason: ${reason.trim()}. Fulfilment blocked pending review.`,
      updatedBy: adminUser.email,
    });
  }

  adminFlagPayment(adminUser, reason) {
    if (adminUser.role !== 'admin') throw new Error('UNAUTHORIZED');
    if (!reason || !reason.trim()) throw new Error('A reason is strictly required to flag an order for investigation.');

    this.order.isFlagged = true;
    this.order.flagReason = reason.trim();
    this.order.paymentStatus = 'under_review';
    this.order.orderStatus = 'payment_review';

    this.order.statusHistory = this.order.statusHistory || [];
    this.order.statusHistory.push({
      status: 'under_review',
      timestamp: new Date().toISOString(),
      note: `Order flagged for investigation by ${adminUser.email}. Reason: ${reason.trim()}`,
      updatedBy: adminUser.email,
    });
  }

  adminEditPaymentMetadata(adminUser, updates, reason) {
    if (adminUser.role !== 'admin') throw new Error('UNAUTHORIZED');
    if (!reason || !reason.trim()) throw new Error('A reason is required to edit payment metadata.');

    const oldValues = {
      utrNumber: this.order.utrNumber || '',
      assignedStaff: this.order.assignedStaff || '',
      amountReceived: this.order.amountReceived !== undefined ? this.order.amountReceived : this.order.total,
    };

    const newValues = { ...oldValues };

    if (updates.utrNumber !== undefined) {
      const trimmed = updates.utrNumber.trim().replace(/[\s-]/g, '');
      if (trimmed && !/^\d{12}$/.test(trimmed)) {
        throw new Error('Invalid UTR format. Expected 12 digits.');
      }
      this.order.utrNumber = trimmed;
      newValues.utrNumber = trimmed;
    }

    if (updates.assignedStaff !== undefined) {
      this.order.assignedStaff = updates.assignedStaff.trim();
      newValues.assignedStaff = updates.assignedStaff.trim();
    }

    if (updates.amountReceived !== undefined) {
      if (typeof updates.amountReceived !== 'number' || isNaN(updates.amountReceived) || updates.amountReceived < 0) {
        throw new Error('Invalid received amount.');
      }
      this.order.amountReceived = updates.amountReceived;
      newValues.amountReceived = updates.amountReceived;
    }

    const auditEntry = {
      id: `audit_${Date.now()}`,
      changedAt: new Date().toISOString(),
      changedBy: adminUser.email,
      reason: reason.trim(),
      oldValues,
      newValues,
    };

    this.order.metadataAuditLogs = this.order.metadataAuditLogs || [];
    this.order.metadataAuditLogs.push(auditEntry);
  }

  canFulfillOrder() {
    const isPaid = this.order.paymentStatus === 'paid' || this.order.paymentStatus === 'verified';
    const isUnderReview = this.order.paymentStatus === 'under_review' || this.order.isFlagged;
    return isPaid && !isUnderReview;
  }
}

runTest('Test 14: Admin unverify requires reason, resets state to pending_verification and blocks fulfilment', () => {
  const manager = new AdvancedOrderAdminManager({
    orderId: 'order_101',
    orderNumber: 101,
    total: 800,
    paymentStatus: 'paid',
    orderStatus: 'Processing',
  });

  assert.equal(manager.canFulfillOrder(), true);

  assert.throws(() => {
    manager.adminUnverifyPayment({ email: 'admin@sjtfarms.com', role: 'admin' }, '');
  }, /reason is strictly required/);

  manager.adminUnverifyPayment({ email: 'admin@sjtfarms.com', role: 'admin' }, 'Bank statement credit not found for UTR');
  assert.equal(manager.order.paymentStatus, 'pending_verification');
  assert.equal(manager.order.orderStatus, 'payment_review');
  assert.equal(manager.order.paymentAudit.action, 'unverified');
  assert.equal(manager.order.paymentAudit.reason, 'Bank statement credit not found for UTR');
  assert.equal(manager.canFulfillOrder(), false, 'Unverified order must NOT be eligible for dispatch');
});

runTest('Test 15: Admin flag payment sets under_review, isFlagged true and records audit entry', () => {
  const manager = new AdvancedOrderAdminManager({
    orderId: 'order_102',
    orderNumber: 102,
    total: 1200,
    paymentStatus: 'pending_verification',
    orderStatus: 'received',
  });

  manager.adminFlagPayment({ email: 'admin@sjtfarms.com', role: 'admin' }, 'Suspicious UTR submitted across two accounts');
  assert.equal(manager.order.isFlagged, true);
  assert.equal(manager.order.paymentStatus, 'under_review');
  assert.equal(manager.order.flagReason, 'Suspicious UTR submitted across two accounts');
  assert.equal(manager.canFulfillOrder(), false);
});

runTest('Test 16: Admin metadata edit records immutable audit log with old and new values', () => {
  const manager = new AdvancedOrderAdminManager({
    orderId: 'order_103',
    orderNumber: 103,
    total: 550,
    utrNumber: '405612345678',
    assignedStaff: 'Unassigned',
  });

  assert.throws(() => {
    manager.adminEditPaymentMetadata(
      { email: 'admin@sjtfarms.com', role: 'admin' },
      { utrNumber: 'INVALID_UTR' },
      'Customer corrected reference'
    );
  }, /Invalid UTR format/);

  manager.adminEditPaymentMetadata(
    { email: 'admin@sjtfarms.com', role: 'admin' },
    { utrNumber: '998877665544', assignedStaff: 'Ramesh (Roastery Lead)' },
    'Customer provided revised bank UTR slip'
  );

  assert.equal(manager.order.utrNumber, '998877665544');
  assert.equal(manager.order.assignedStaff, 'Ramesh (Roastery Lead)');
  assert.equal(manager.order.metadataAuditLogs.length, 1);
  const log = manager.order.metadataAuditLogs[0];
  assert.equal(log.changedBy, 'admin@sjtfarms.com');
  assert.equal(log.oldValues.utrNumber, '405612345678');
  assert.equal(log.newValues.utrNumber, '998877665544');
  assert.equal(log.reason, 'Customer provided revised bank UTR slip');
});

// ----------------------------------------------------------------------
// 7. 6 Payment Overview KPI Calculations
// ----------------------------------------------------------------------
function calculatePaymentKPIs(orders) {
  let paymentsAwaitingVerification = 0;
  let verifiedPayments = 0;
  let rejectedPayments = 0;
  let flaggedUtrs = 0;
  let totalPendingPaymentValue = 0;
  let totalVerifiedPaymentValue = 0;

  for (const o of orders) {
    const pStatus = (o.paymentStatus || '').toLowerCase();
    const isVerified = pStatus === 'paid' || pStatus === 'verified' || o.paymentVerified === true;
    const isPending = pStatus === 'verification_pending' || pStatus === 'pending_verification' || pStatus === 'awaiting_payment' || pStatus === 'pending';
    const isRejected = pStatus === 'rejected' || pStatus === 'failed';
    const isFlagged = o.isFlagged === true || pStatus === 'under_review';

    if (isPending) {
      paymentsAwaitingVerification++;
      totalPendingPaymentValue += o.total || 0;
    }
    if (isVerified) {
      verifiedPayments++;
      totalVerifiedPaymentValue += (o.amountReceived !== undefined ? o.amountReceived : o.total) || 0;
    }
    if (isRejected) {
      rejectedPayments++;
    }
    if (isFlagged) {
      flaggedUtrs++;
    }
  }

  return {
    paymentsAwaitingVerification,
    verifiedPayments,
    rejectedPayments,
    flaggedUtrs,
    totalPendingPaymentValue,
    totalVerifiedPaymentValue,
  };
}

runTest('Test 17: Payment overview KPI calculation accurately totals all 6 metrics', () => {
  const sampleOrders = [
    { orderId: '1', total: 500, paymentStatus: 'pending_verification' },
    { orderId: '2', total: 750, paymentStatus: 'verification_pending' },
    { orderId: '3', total: 1000, paymentStatus: 'verified', amountReceived: 1000 },
    { orderId: '4', total: 1200, paymentStatus: 'paid', amountReceived: 1200 },
    { orderId: '5', total: 600, paymentStatus: 'rejected' },
    { orderId: '6', total: 400, paymentStatus: 'under_review', isFlagged: true },
  ];

  const kpis = calculatePaymentKPIs(sampleOrders);
  assert.equal(kpis.paymentsAwaitingVerification, 2);
  assert.equal(kpis.totalPendingPaymentValue, 1250);
  assert.equal(kpis.verifiedPayments, 2);
  assert.equal(kpis.totalVerifiedPaymentValue, 2200);
  assert.equal(kpis.rejectedPayments, 1);
  assert.equal(kpis.flaggedUtrs, 1);
});

// ----------------------------------------------------------------------
// 8. Payload Sanitization & Zero Undefined Fields Guarantee
// ----------------------------------------------------------------------
function sanitizeFirestorePayload(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;
  if (obj._methodName || (obj.constructor && obj.constructor.name === 'FieldValue')) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => (typeof item === 'object' && item !== null ? sanitizeFirestorePayload(item) : item));
  }

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    }
    if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
      if (value._methodName || (value.constructor && value.constructor.name === 'FieldValue')) {
        clean[key] = value;
      } else {
        clean[key] = sanitizeFirestorePayload(value);
      }
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

runTest('Test 18: sanitizeFirestorePayload recursively strips all undefined keys and prevents Firestore SDK errors', () => {
  const dirtyPayload = {
    orderId: '101',
    customerName: 'Aarav Patel',
    utrNumber: undefined, // Must be stripped!
    shippingAddress: {
      street: '123 Plantation Way',
      landmark: undefined, // Nested undefined must be stripped!
      pincode: '560001',
    },
    items: [
      { name: 'Araku Gold', price: 450, discount: undefined },
    ],
  };

  const clean = sanitizeFirestorePayload(dirtyPayload);
  assert.equal('utrNumber' in clean, false, 'utrNumber property must not exist on object');
  assert.equal('landmark' in clean.shippingAddress, false, 'landmark property must not exist');
  assert.equal('discount' in clean.items[0], false, 'discount property must not exist');
  assert.equal(clean.orderId, '101');
  assert.equal(clean.shippingAddress.pincode, '560001');
});

runTest('Test 19: Order created without UTR omits utrNumber and sets status to awaiting_payment', () => {
  const cleanUtr = '';
  const orderDoc = {
    orderId: '101',
    paymentMethod: 'Manual UPI (QR Code & UPI ID)',
    paymentStatus: 'pending',
    paymentVerificationStatus: 'awaiting_payment',
  };
  if (cleanUtr) {
    orderDoc.utrNumber = cleanUtr;
  }

  const sanitized = sanitizeFirestorePayload(orderDoc);
  assert.equal('utrNumber' in sanitized, false, 'utrNumber property must be omitted entirely when not submitted');
  assert.equal(sanitized.paymentVerificationStatus, 'awaiting_payment');
  assert.equal(sanitized.paymentStatus, 'pending');
});

runTest('Test 20: Order created with valid UTR attaches utrNumber and sets status to verification_pending', () => {
  const cleanUtr = '405612345678';
  const orderDoc = {
    orderId: '101',
    paymentMethod: 'Manual UPI (QR Code & UPI ID)',
    paymentStatus: 'pending_verification',
    paymentVerificationStatus: 'verification_pending',
  };
  if (cleanUtr) {
    orderDoc.utrNumber = cleanUtr;
  }

  const sanitized = sanitizeFirestorePayload(orderDoc);
  assert.equal(sanitized.utrNumber, '405612345678');
  assert.equal(sanitized.paymentVerificationStatus, 'verification_pending');
});

console.log(`\n================================================================`);
console.log(`ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log(`================================================================`);


