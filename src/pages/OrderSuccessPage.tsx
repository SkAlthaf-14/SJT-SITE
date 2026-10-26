import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Package,
  Truck,
  Home,
  Copy,
  Check,
  Clock,
  QrCode,
  Smartphone,
  AlertCircle,
  Coffee,
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import {
  submitPaymentUTR,
  validateUtrNumber,
  formatDisplayOrderId,
  getOrderByLookup,
  subscribeToSingleOrder,
} from '../services/orders';
import { OrderDetails } from '../types';
import { PAYMENT_CONFIG, buildUpiIntentUri } from '../data/paymentConfig';
import { UpiQrModal } from '../components/payment/UpiQrModal';
import { buildWhatsAppLink, generateOrderSummaryMessage, WhatsAppLanguage } from '../config/whatsapp';
import { formatInr } from '../utils/currencyFormatter';
import { copyToClipboard } from '../utils/clipboard';

export const OrderSuccessPage: React.FC = () => {
  const { currentOrder, navigateTo } = useNavigation();
  const [copiedId, setCopiedId] = useState<'idle' | 'success' | 'failure'>('idle');
  const [copiedUpi, setCopiedUpi] = useState<'idle' | 'success' | 'failure'>('idle');
  const [summaryLang, setSummaryLang] = useState<WhatsAppLanguage>('en');
  const [utrInput, setUtrInput] = useState(currentOrder?.utrNumber || '');
  const [submittedUtr, setSubmittedUtr] = useState<string | null>(null);
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);
  const [utrSuccess, setUtrSuccess] = useState<string | null>(null);
  const [utrError, setUtrError] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [resolvedOrder, setResolvedOrder] = useState<OrderDetails | null>(() => {
    if (currentOrder) {
      try {
        sessionStorage.setItem('sjt_last_order', JSON.stringify(currentOrder));
      } catch {}
      return currentOrder;
    }
    try {
      const stored = sessionStorage.getItem('sjt_last_order');
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  });

  const [isLoadingOrder, setIsLoadingOrder] = useState(false);

  useEffect(() => {
    // Festive celebratory coffee-gold confetti
    try {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#D7AD36', '#20150F', '#B77943', '#F8F4EC'],
      });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    // Check URL search or hash param e.g. /order-success?order=110 or #order-success?order=110
    const urlParams = new URLSearchParams(window.location.search);
    let orderParam = urlParams.get('order');
    if (!orderParam && window.location.hash.includes('order=')) {
      orderParam = new URLSearchParams(window.location.hash.split('?')[1]).get('order');
    }

    const initial = currentOrder || resolvedOrder;
    const lookupTarget =
      orderParam ||
      initial?.firestoreDocId ||
      initial?.orderId ||
      (initial?.orderNumber ? String(initial.orderNumber) : null);

    if (!lookupTarget) return;

    if (!initial) {
      setIsLoadingOrder(true);
    }

    // Subscribe to real-time updates for authoritative database persistence
    const unsubscribe = subscribeToSingleOrder(
      lookupTarget,
      (freshOrder) => {
        setIsLoadingOrder(false);
        if (freshOrder) {
          setResolvedOrder(freshOrder);
          if (freshOrder.utrNumber) {
            setUtrInput(freshOrder.utrNumber);
          }
        }
      },
      (err) => {
        console.warn('[OrderSuccessPage] Real-time order listener notice:', err);
        setIsLoadingOrder(false);
      }
    );

    return () => unsubscribe();
  }, [currentOrder?.orderId, currentOrder?.firestoreDocId]);

  // Prioritize live resolvedOrder from Firestore over stale navigation context
  const activeOrder = resolvedOrder || currentOrder;
  const orderId = activeOrder?.orderId || '101';
  const orderNumber = activeOrder?.orderNumber ?? (parseInt(orderId, 10) || 101);
  const displayId = activeOrder?.displayId || formatDisplayOrderId(orderNumber || orderId);
  const total = Number(activeOrder?.total || 0);

  const isCod = Boolean(
    activeOrder?.paymentMethod?.toLowerCase().includes('cash on delivery') ||
    activeOrder?.paymentMethod?.toLowerCase().includes('cod')
  );

  const isVerified = Boolean(
    activeOrder?.paymentStatus === 'Payment Approved' ||
    activeOrder?.paymentStatus === 'Payment Confirmed' ||
    activeOrder?.paymentStatus === 'payment_approved' ||
    activeOrder?.paymentStatus === 'Paid' ||
    activeOrder?.paymentStatus === 'paid' ||
    activeOrder?.paymentVerificationStatus === 'paid' ||
    activeOrder?.paymentVerificationStatus === 'confirmed'
  );

  const isRejected = Boolean(
    activeOrder?.paymentStatus === 'Payment Rejected' ||
    activeOrder?.paymentStatus === 'payment_rejected' ||
    activeOrder?.paymentVerificationStatus === 'rejected'
  );

  const activeUtr = submittedUtr || activeOrder?.utrNumber;
  const hasUtr = Boolean(activeUtr);

  const customer = activeOrder?.customer || {
    fullName: 'Valued Coffee Connoisseur',
    email: 'customer@sjtfarms.com',
    phone: '9876543210',
    address: '42, Coffee Estate Enclave',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
  };

  const items = activeOrder?.items || [];

  const handleCopyOrderId = async () => {
    const success = await copyToClipboard(String(orderNumber || orderId));
    setCopiedId(success ? 'success' : 'failure');
    setTimeout(() => setCopiedId('idle'), 2500);
  };

  const handleCopyUpiId = async () => {
    const success = await copyToClipboard(PAYMENT_CONFIG.merchantVpa);
    setCopiedUpi(success ? 'success' : 'failure');
    setTimeout(() => setCopiedUpi('idle'), 2500);
  };

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    setUtrError(null);
    setUtrSuccess(null);

    const val = validateUtrNumber(utrInput);
    if (!val.valid) {
      setUtrError(val.message || 'Please enter a valid 12-digit UPI / UTR transaction reference number.');
      return;
    }

    const cleanUtr = utrInput.trim();
    setIsSubmittingUtr(true);
    const res = await submitPaymentUTR(String(orderNumber || orderId), cleanUtr, customer.email || customer.phone);
    setIsSubmittingUtr(false);

    if (res.success) {
      setUtrSuccess('Transaction reference recorded! Verification is pending with our accounts desk.');
      setSubmittedUtr(cleanUtr);
      if (activeOrder) {
        const updated: OrderDetails = {
          ...activeOrder,
          utrNumber: cleanUtr,
          paymentStatus: 'Verification Pending',
          paymentVerificationStatus: 'verification_pending',
        };
        setResolvedOrder(updated);
        try {
          sessionStorage.setItem('sjt_last_order', JSON.stringify(updated));
        } catch {}
      }
    } else {
      setUtrError(res.message);
    }
  };

  // Construct standard mobile UPI intent deep link
  const upiIntentUri = buildUpiIntentUri({
    amount: total,
    orderNumberOrId: orderNumber || orderId,
  });

  return (
    <div className="bg-[#F8F4EC] min-h-screen py-10 sm:py-16 text-[#20150F]">
      <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E5DFD7] shadow-xl text-center space-y-6 animate-fadeIn">
          {/* CELEBRATION ICON */}
          <div className="w-20 h-20 rounded-full bg-[#F8F4EC] flex items-center justify-center text-[#20150F] mx-auto border-2 border-[#D7AD36] relative shadow-warm-xs">
            <CheckCircle2 className="w-10 h-10 text-[#D7AD36]" />
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#20150F] text-[#D7AD36] flex items-center justify-center border border-[#D7AD36]">
              <Coffee className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <span className="text-xs font-bold text-[#B77943] uppercase tracking-[0.25em] font-sans">
              Order Received Successfully
            </span>
            <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#20150F] mt-2">
              YOUR ORDER HAS BEEN RECEIVED
            </h1>
            <p className="text-xs sm:text-sm text-[#7A6A5E] mt-2 max-w-lg mx-auto leading-relaxed">
              {isCod
                ? 'Your order is confirmed. Cash on Delivery payment will be collected by the logistics agent at your doorstep.'
                : isVerified
                ? 'Your payment has been verified by SJT Farms accounts team. Your coffee is scheduled for roasting.'
                : isRejected
                ? 'Payment reference verification was rejected. Please review your transaction and resubmit a valid reference below.'
                : 'Payment verification is pending. Our roastery accounts desk reconciles UPI references before packing and dispatch.'}
            </p>
          </div>

          {/* STATUS BANNER */}
          <div
            className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row items-center justify-between gap-2 text-left ${
              isVerified
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : isRejected
                ? 'bg-rose-50 border-rose-200 text-rose-950'
                : isCod
                ? 'bg-blue-50 border-blue-200 text-blue-900'
                : 'bg-amber-50/80 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-2">
              {isVerified ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              ) : isRejected ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : isCod ? (
                <Truck className="w-4 h-4 text-blue-700 shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-amber-700 shrink-0 animate-pulse" />
              )}
              <span className="font-semibold">
                Payment Status:{' '}
                <strong>
                  {isVerified
                    ? 'Payment Confirmed & Verified'
                    : isRejected
                    ? 'Payment Rejected'
                    : isCod
                    ? 'Cash on Delivery (Pending Delivery)'
                    : hasUtr
                    ? 'UTR Submitted • Verification Pending'
                    : 'Awaiting Payment Reference'}
                </strong>
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold bg-white/90 px-3 py-1 rounded-full border border-current">
              {isVerified
                ? 'Verified by SJT Farms'
                : isRejected
                ? 'Action Required'
                : isCod
                ? 'Doorstep Collection'
                : 'Pending Reconciliation'}
            </span>
          </div>

          {/* PAYMENT REJECTED AUDIT PANEL */}
          {isRejected && (
            <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-950 text-left space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-rose-900">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                Payment Reference Rejected by Accounts Desk
              </span>
              <p className="text-rose-800">
                Reason: <strong>{activeOrder?.paymentRejectionReason || 'UTR transaction reference could not be verified in merchant bank statement.'}</strong>
              </p>
              <p className="text-[11px] text-rose-700">
                Please check your UPI app transaction history and resubmit the correct 12-digit UTR reference below.
              </p>
            </div>
          )}

          {/* VERIFIED ADMINISTRATOR CONFIRMATION PANEL */}
          {isVerified && (
            <div className="p-3 bg-emerald-100/70 rounded-xl border border-emerald-300 text-xs text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-left">
              <span className="font-semibold">
                Payment Confirmed & Verified by <strong>{activeOrder?.paymentVerifiedBy || 'Administrator'}</strong>
              </span>
              {activeOrder?.paymentVerifiedAt && (
                <span className="text-[11px] text-emerald-800 font-medium">
                  Reconciled on {new Date(activeOrder.paymentVerifiedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          )}

          {/* ORDER IDENTIFIER TICKET */}
          <div className="bg-[#FAF7F2] rounded-2xl p-4 sm:p-5 border border-[#E5DFD7] flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
            <div>
              <span className="text-[10px] text-[#8C7A6B] uppercase font-bold tracking-wider block">
                Customer Order Number
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-lg sm:text-xl font-bold text-[#20150F]">
                  {displayId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyOrderId}
                  className="p-1 text-[#8C7A6B] hover:text-[#20150F] rounded transition-colors cursor-pointer"
                  title="Copy Order ID"
                >
                  {copiedId === 'success' ? (
                    <Check className="w-4 h-4 text-[#2E5A3D]" />
                  ) : copiedId === 'failure' ? (
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 border-[#E5DFD7] pt-2 sm:pt-0 w-full sm:w-auto">
              <span className="text-[10px] text-[#8C7A6B] uppercase font-bold tracking-wider block">
                Total Payable Amount
              </span>
              <span className="font-sans text-2xl font-black text-[#20150F] tracking-tight">
                {formatInr(total)}
              </span>
              <span className="block text-[10px] font-semibold text-[#B77943] mt-0.5">
                Method: {currentOrder?.paymentMethod || 'Direct UPI'}
              </span>
            </div>
          </div>

          {/* STATUS TIMELINE */}
          <div className="bg-white rounded-2xl p-5 border border-[#E5DFD7] text-left space-y-3">
            <h3 className="font-serif text-sm font-bold text-[#20150F] pb-2 border-b border-[#F0EBE3] flex items-center justify-between">
              <span>Order Fulfillment Progression</span>
              <span className="text-[10px] text-[#8C7A6B] font-mono font-normal">Chikmagalur & Araku Estate</span>
            </h3>

            <div className="relative pl-6 space-y-4 border-l-2 border-[#E5DFD7] ml-2">
              {/* Stage 1: Order Received */}
              <div className="relative">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-[#2E5A3D] text-white flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <p className="text-xs font-bold text-[#20150F]">Order Received</p>
                <p className="text-[11px] text-[#7A6A5E]">
                  Recorded in SJT Farms Cloud Firestore (Allocated as {displayId}).
                </p>
              </div>

              {/* Stage 2: Payment Verification */}
              <div className="relative">
                <div
                  className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full flex items-center justify-center ${
                    isVerified
                      ? 'bg-[#2E5A3D] text-white'
                      : isRejected
                      ? 'bg-rose-600 text-white'
                      : 'bg-[#D7AD36] text-[#20150F]'
                  }`}
                >
                  {isVerified ? (
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  ) : isRejected ? (
                    <AlertCircle className="w-2.5 h-2.5 stroke-[2.5]" />
                  ) : (
                    <Clock className="w-2.5 h-2.5 stroke-[2.5]" />
                  )}
                </div>
                <p className="text-xs font-bold text-[#20150F]">
                  {isVerified ? 'Payment Confirmed' : isRejected ? 'Payment Rejected' : 'Payment Verification Pending'}
                </p>
                <p className="text-[11px] text-[#7A6A5E]">
                  {isVerified
                    ? (activeOrder?.paymentVerifiedBy
                        ? `Payment verified against merchant bank statement by ${activeOrder.paymentVerifiedBy}.`
                        : 'Payment verified against merchant bank statement.')
                    : isRejected
                    ? `Payment reference rejected: ${activeOrder?.paymentRejectionReason || 'UTR not verified in merchant bank statement.'}. Please resubmit valid UTR.`
                    : activeUtr
                    ? `UTR ${activeUtr} submitted. Verification pending with accounts team.`
                    : isCod
                    ? 'Payment will be collected at doorstep upon delivery.'
                    : 'Awaiting UPI payment reference (UTR) submission.'}
                </p>
              </div>

              {/* Stage 3: Roasting & Packaging */}
              <div className="relative">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-[#E5DFD7] text-[#7A6A5E] flex items-center justify-center text-[9px]">
                  3
                </div>
                <p className="text-xs font-semibold text-[#7A6A5E]">Micro-Batch Roasting & Milling</p>
                <p className="text-[11px] text-[#8C7A6B]">
                  Beans roasted fresh, burr-milled, and sealed in aroma-preserving glass jars.
                </p>
              </div>

              {/* Stage 4: Logistics & Dispatch */}
              <div className="relative">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-[#E5DFD7] text-[#7A6A5E] flex items-center justify-center text-[9px]">
                  4
                </div>
                <p className="text-xs font-semibold text-[#7A6A5E]">Courier Dispatch</p>
                <p className="text-[11px] text-[#8C7A6B]">
                  Handed to express courier partner with live SMS and WhatsApp tracking.
                </p>
              </div>
            </div>
          </div>

          {/* UTR SUBMISSION & UPI INFO (IF PENDING UPI) */}
          {!isCod && !isVerified && (
            <div className="bg-[#FAF7F2] rounded-2xl p-5 sm:p-6 border-2 border-[#D7AD36]/50 text-left space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5DFD7] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#5F259F] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    पे
                  </div>
                  <div>
                    <h3 className="font-serif text-sm font-bold text-[#20150F]">
                      UPI Payment Reference Submission
                    </h3>
                    <p className="text-[10px] text-[#7A6A5E] flex items-center gap-1.5 flex-wrap">
                      <span>Pay {formatInr(total)} to</span>
                      <span className="font-mono font-bold text-[#20150F]">{PAYMENT_CONFIG.merchantVpa}</span>
                      <button
                        type="button"
                        onClick={handleCopyUpiId}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-bold cursor-pointer transition-colors ${
                          copiedUpi === 'success'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : copiedUpi === 'failure'
                            ? 'bg-rose-50 border-rose-300 text-rose-800'
                            : 'bg-white border-[#DED2C4] text-[#5A483E] hover:text-[#20150F]'
                        }`}
                        title="Copy UPI ID"
                      >
                        {copiedUpi === 'success' ? (
                          <Check className="w-3 h-3 text-[#2E5A3D]" />
                        ) : copiedUpi === 'failure' ? (
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedUpi === 'success' ? 'Copied!' : copiedUpi === 'failure' ? 'Failed' : 'Copy'}</span>
                      </button>
                    </p>
                  </div>
                </div>

                {/* Button to open dedicated QR modal on-demand */}
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#D7AD36] text-xs font-bold text-[#20150F] hover:bg-[#FFFDF9] transition-all cursor-pointer shrink-0"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#B77943]" />
                  <span>Show QR Code</span>
                </button>
              </div>

              {/* Submitted UTR badge if present */}
              {activeUtr && !utrSuccess && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    isRejected
                      ? 'bg-rose-50 border-rose-200 text-rose-950'
                      : 'bg-amber-50/80 border-amber-200 text-amber-950'
                  }`}
                >
                  <div>
                    <span
                      className={`text-[10px] font-bold uppercase block ${
                        isRejected ? 'text-rose-700' : 'text-amber-800'
                      }`}
                    >
                      Submitted Reference
                    </span>
                    <span className="font-mono font-bold">
                      UTR: {activeUtr}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isRejected
                        ? 'bg-rose-200/80 text-rose-950'
                        : 'bg-amber-200/80 text-amber-950'
                    }`}
                  >
                    {isRejected ? 'Payment Rejected' : 'Verification Pending'}
                  </span>
                </div>
              )}

              {/* UTR Form */}
              <form onSubmit={handleSubmitUtr} className="space-y-2">
                <label className="text-[11px] font-bold text-[#20150F] block">
                  {activeUtr
                    ? 'Update UTR Reference (if entered incorrectly):'
                    : 'Submit 12-Digit UTR / Transaction Reference:'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={22}
                    value={utrInput}
                    onChange={(e) => setUtrInput(e.target.value.trim())}
                    placeholder="e.g. 423589123456"
                    className="flex-1 text-xs font-mono font-bold px-3 py-2.5 rounded-xl border border-[#DED2C4] bg-white text-[#20150F] focus:outline-none focus:border-[#D7AD36]"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingUtr || !utrInput.trim()}
                    className="px-4 py-2.5 bg-[#20150F] hover:bg-[#38261C] text-[#F7F2EA] text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {isSubmittingUtr ? 'Saving...' : 'Submit UTR'}
                  </button>
                </div>

                {utrSuccess && (
                  <p className="text-xs text-[#2E5A3D] font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{utrSuccess}</span>
                  </p>
                )}
                {utrError && (
                  <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{utrError}</span>
                  </p>
                )}
              </form>

              {/* Payment Actions: Intent App Launch + Dedicated QR Modal Trigger */}
              <div className="pt-1 space-y-2">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <a
                    href={upiIntentUri}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-[#5F259F] hover:bg-[#4D1D82] text-white text-xs font-bold rounded-xl transition-all shadow-xs text-center cursor-pointer active:scale-98"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Open UPI App (Pay {formatInr(total)})</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setIsQrModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-[#20150F] hover:bg-[#38261C] text-[#F7F2EA] text-xs font-bold rounded-xl transition-all shadow-xs text-center cursor-pointer active:scale-98"
                  >
                    <QrCode className="w-3.5 h-3.5 text-[#D7AD36]" />
                    <span>View & Scan Payment QR</span>
                  </button>
                </div>

                <p className="text-[10px] text-[#7A6A5E] text-center sm:text-left leading-relaxed">
                  💡 Note: If your UPI app shows &ldquo;Declined for security reasons&rdquo;, tap <strong>&ldquo;View &amp; Scan Payment QR&rdquo;</strong> to scan or copy our verified merchant UPI ID directly.
                </p>
              </div>
            </div>
          )}

          {/* ORDER ITEMS & DELIVERY DETAILS */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5DFD7] text-left text-xs space-y-3">
            <h3 className="font-serif text-sm font-bold text-[#20150F]">
              Delivery & Package Destination
            </h3>
            <p className="text-[#5A483E] leading-relaxed">
              Recipient: <strong className="text-[#20150F]">{customer.fullName}</strong>
              <br />
              Address: {customer.address}, {customer.city}, {customer.state} - {customer.pincode}
              <br />
              Phone: +91 {customer.phone}
            </p>

            {items.length > 0 && (
              <div className="pt-2 border-t border-[#F0EBE3] space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A6B] block">
                  Ordered Items ({items.length})
                </span>
                {items.map((i) => (
                  <div
                    key={`${i.product.id}-${i.selectedWeight}`}
                    className="flex justify-between text-xs text-[#5A483E]"
                  >
                    <span>
                      {i.product.name} ({i.selectedWeight}) × {i.quantity}
                    </span>
                    <span className="font-mono font-semibold text-[#20150F]">
                      ₹{(i.price * i.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* OPTIONAL WHATSAPP ORDER SUMMARY & CONCIERGE */}
          <div className="bg-[#FAF7F2] rounded-2xl p-4 sm:p-5 border border-[#D7AD36]/40 text-left space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5DFD7] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.073-2.127-.521-1.615-.67-2.66-2.304-2.74-2.411-.079-.107-.648-.864-.648-1.648 0-.785.408-1.171.553-1.33.144-.16.315-.2.42-.2.105 0 .211.002.303.007.098.005.228-.037.356.27.132.316.452 1.1.492 1.18.04.08.067.174.013.28-.053.107-.08.173-.16.267-.079.093-.167.208-.239.28-.08.08-.163.167-.07.327.094.16.417.688.895 1.114.615.548 1.134.718 1.294.798.16.08.254.067.347-.04.093-.107.4-.467.507-.627.107-.16.214-.133.36-.08.147.053.934.44 1.094.52.16.08.267.12.307.187.04.066.04.386-.104.791z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-serif text-xs sm:text-sm font-bold text-[#20150F]">
                    Save Order Summary on WhatsApp (Optional)
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-[#7A6A5E]">
                    Keep an instant copy in your chat or ask our Chikmagalur roastery team for live dispatch assistance.
                  </p>
                </div>
              </div>

              {/* Language toggle */}
              <div className="flex items-center gap-1 bg-white border border-[#E5DFD7] rounded-lg p-0.5 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setSummaryLang('en')}
                  className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                    summaryLang === 'en'
                      ? 'bg-[#20150F] text-[#F8F4EC]'
                      : 'text-[#7A6A5E] hover:text-[#20150F]'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setSummaryLang('te')}
                  className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                    summaryLang === 'te'
                      ? 'bg-[#20150F] text-[#F8F4EC]'
                      : 'text-[#7A6A5E] hover:text-[#20150F]'
                  }`}
                >
                  తెలుగు (Telugu)
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <span className="text-[10px] text-[#7A6A5E]">
                * Your order is authoritative on the website. Opening WhatsApp is completely optional.
              </span>

              {(() => {
                const effectiveOrder: import('../types').OrderDetails = currentOrder || {
                  orderId: String(orderNumber || orderId),
                  orderNumber: typeof orderNumber === 'number' ? orderNumber : 101,
                  displayId,
                  items,
                  subtotal: total,
                  delivery: 0,
                  discount: 0,
                  total,
                  customer,
                  paymentMethod: isCod ? 'Cash on Delivery' : 'Direct UPI',
                  orderStatus: 'received',
                  paymentStatus: isVerified ? 'Payment Confirmed' : 'Verification Pending',
                  createdAt: new Date().toLocaleDateString('en-IN'),
                  estimatedDelivery: '3-5 Business Days',
                };

                return (
                  <a
                    href={buildWhatsAppLink(generateOrderSummaryMessage(effectiveOrder, summaryLang))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs shrink-0 cursor-pointer"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.073-2.127-.521-1.615-.67-2.66-2.304-2.74-2.411-.079-.107-.648-.864-.648-1.648 0-.785.408-1.171.553-1.33.144-.16.315-.2.42-.2.105 0 .211.002.303.007.098.005.228-.037.356.27.132.316.452 1.1.492 1.18.04.08.067.174.013.28-.053.107-.08.173-.16.267-.079.093-.167.208-.239.28-.08.08-.163.167-.07.327.094.16.417.688.895 1.114.615.548 1.134.718 1.294.798.16.08.254.067.347-.04.093-.107.4-.467.507-.627.107-.16.214-.133.36-.08.147.053.934.44 1.094.52.16.08.267.12.307.187.04.066.04.386-.104.791z" />
                    </svg>
                    <span>Continue on WhatsApp</span>
                  </a>
                );
              })()}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigateTo('track-order', { order: currentOrder || undefined })}
              className="flex-1 py-3.5 bg-white border-2 border-[#20150F] text-[#20150F] hover:bg-[#FAF7F2] rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Package className="w-4 h-4 text-[#B77943]" />
              <span>Track My Order ({displayId})</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('shop')}
              className="flex-1 py-3.5 bg-[#20150F] text-[#F7F2EA] hover:bg-[#38261C] rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Continue Shopping</span>
            </button>
          </div>
        </div>
      </div>

      {/* DEDICATED QR MODAL (OPENS ONLY ON DEMAND) */}
      <UpiQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        total={total}
        orderNumberOrId={orderNumber || orderId}
        onProceedToUtrSubmission={() => setIsQrModalOpen(false)}
      />
    </div>
  );
};
