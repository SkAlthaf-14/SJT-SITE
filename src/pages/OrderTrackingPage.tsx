import React, { useState, useEffect } from 'react';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Phone,
  Mail,
  ShieldCheck,
  ChevronRight,
  Flame,
  Box,
  MapPin,
  RefreshCw,
  QrCode,
  Smartphone,
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { OrderDetails } from '../types';
import { getProductVariantJarImage } from '../data/products';
import {
  getOrderByLookup,
  getLocalOrders,
  subscribeCustomerOrders,
  subscribeToSingleOrder,
  submitPaymentUTR,
  validateUtrNumber,
  formatDisplayOrderId,
} from '../services/orders';
import { UpiQrModal } from '../components/payment/UpiQrModal';
import { PAYMENT_CONFIG, buildUpiIntentUri } from '../data/paymentConfig';
import { buildWhatsAppLink, WHATSAPP_TEMPLATES } from '../config/whatsapp';
import { copyToClipboard } from '../utils/clipboard';

export const OrderTrackingPage: React.FC = () => {
  const { currentOrder, navigateTo } = useNavigation();
  const { user } = useAuth();

  // Search state - derive initial query from currentOrder or URL parameters
  const [orderQuery, setOrderQuery] = useState(() => {
    if (currentOrder?.orderId) return currentOrder.orderId;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const orderParam = params.get('order') || params.get('id');
      const hashQuery = window.location.hash.includes('order=')
        ? new URLSearchParams(window.location.hash.split('?')[1]).get('order')
        : null;
      return orderParam || hashQuery || '';
    }
    return '';
  });
  const [contactQuery, setContactQuery] = useState(user?.email || user?.phone || '');
  const [activeOrder, setActiveOrder] = useState<OrderDetails | null>(currentOrder || null);
  const [myOrders, setMyOrders] = useState<OrderDetails[]>(() => (!user?.uid ? getLocalOrders() : []));
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Payment UTR state
  const [utrInput, setUtrInput] = useState('');
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);
  const [utrNotice, setUtrNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedUpi, setCopiedUpi] = useState<'idle' | 'success' | 'failure'>('idle');
  const [copiedOrderId, setCopiedOrderId] = useState<'idle' | 'success' | 'failure'>('idle');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const MERCHANT_UPI_ID = PAYMENT_CONFIG.merchantVpa;
  const MERCHANT_NAME = PAYMENT_CONFIG.merchantName;

  // Real-time synchronization for active order from Cloud Firestore
  useEffect(() => {
    const target =
      activeOrder?.firestoreDocId ||
      activeOrder?.orderId ||
      (activeOrder?.orderNumber ? String(activeOrder.orderNumber) : null) ||
      orderQuery;

    if (!target) return;

    const unsubscribe = subscribeToSingleOrder(
      target,
      (fresh) => {
        if (fresh) {
          setActiveOrder(fresh);
          setMyOrders((prev) => {
            const cleanId = fresh.orderId.toUpperCase();
            const idx = prev.findIndex(
              (o) =>
                o.orderId.toUpperCase() === cleanId ||
                (fresh.orderNumber && o.orderNumber === fresh.orderNumber) ||
                (fresh.firestoreDocId && o.firestoreDocId === fresh.firestoreDocId)
            );
            if (idx !== -1) {
              const updated = [...prev];
              updated[idx] = fresh;
              return updated;
            }
            return prev;
          });
        }
      },
      (err) => console.warn('[OrderTracking] Real-time single order error:', err)
    );

    return () => unsubscribe();
  }, [activeOrder?.orderId, activeOrder?.firestoreDocId, orderQuery]);

  // Check URL params for direct tracking link e.g. /track-order?order=101
  useEffect(() => {
    if (orderQuery && (!activeOrder || (activeOrder.orderId !== orderQuery && String(activeOrder.orderNumber) !== orderQuery))) {
      setIsLoading(true);
      getOrderByLookup(orderQuery)
        .then((res) => {
          setIsLoading(false);
          if (res.success && res.order) {
            setActiveOrder(res.order);
          }
        })
        .catch(() => setIsLoading(false));
    }
  }, [orderQuery]);

  // Load customer orders if signed in
  useEffect(() => {
    if (user?.uid) {
      const unsub = subscribeCustomerOrders(
        user.uid,
        user.email,
        (orders) => {
          setMyOrders(orders);
          // If no active order, default to the most recent
          setActiveOrder((prev) => {
            if (!prev && orders.length > 0) {
              setOrderQuery(orders[0].orderId);
              return orders[0];
            }
            return prev;
          });
        },
        (err) => console.warn('[OrderTracking] Real-time orders listener:', err)
      );
      return () => unsub();
    } else {
      const locals = getLocalOrders();
      setMyOrders(locals);
      setActiveOrder((prev) => {
        if (!prev && locals.length > 0) {
          setOrderQuery(locals[0].orderId);
          return locals[0];
        }
        return prev;
      });
    }
  }, [user]);

  // Handle Order Search / Lookup
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchError(null);
    setUtrNotice(null);

    const cleanOrder = orderQuery.trim().toUpperCase();
    if (!cleanOrder) {
      setSearchError('Please enter a valid Order Number (e.g. 101 or #101).');
      return;
    }

    setIsLoading(true);
    try {
      const res = await getOrderByLookup(cleanOrder, contactQuery);
      if (res.success && res.order) {
        setActiveOrder(res.order);
      } else {
        setSearchError(res.message || 'Order not found. Please verify the order reference number.');
      }
    } catch {
      setSearchError('Unable to fetch order status. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle UTR submission from tracking page
  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    const val = validateUtrNumber(utrInput);
    if (!val.valid) {
      setUtrNotice({ type: 'error', text: val.message || 'Please enter a valid 12-digit UPI / UTR reference number.' });
      return;
    }
    const clean = utrInput.trim();

    setIsSubmittingUtr(true);
    setUtrNotice(null);
    try {
      const res = await submitPaymentUTR(activeOrder.orderId, clean, activeOrder.customer.email || activeOrder.customer.phone);
      if (res.success) {
        setUtrNotice({ type: 'success', text: res.message });
        setUtrInput('');
        // Refresh local view
        setActiveOrder((prev) =>
          prev
            ? {
                ...prev,
                utrNumber: clean,
                paymentStatus: 'Verification Pending',
                paymentVerificationStatus: 'verification_pending',
              }
            : null
        );
      } else {
        setUtrNotice({ type: 'error', text: res.message });
      }
    } catch {
      setUtrNotice({ type: 'error', text: 'Failed to submit payment reference. Please try again.' });
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  const handleCopyUpi = async () => {
    const success = await copyToClipboard(MERCHANT_UPI_ID);
    setCopiedUpi(success ? 'success' : 'failure');
    setTimeout(() => setCopiedUpi('idle'), 2500);
  };

  const handleCopyOrderId = async (id: string) => {
    const success = await copyToClipboard(id);
    setCopiedOrderId(success ? 'success' : 'failure');
    setTimeout(() => setCopiedOrderId('idle'), 2500);
  };

  // Determine stage progression
  const getTimelineProgression = (order: OrderDetails) => {
    const rawOrder = (order.orderStatus || 'received').toLowerCase();
    const rawVerify = (order.paymentVerificationStatus || '').toLowerCase();
    const rawPay = (order.paymentStatus || '').toLowerCase();
    const isPaymentConfirmed =
      rawVerify === 'confirmed' ||
      rawVerify === 'paid' ||
      rawPay === 'paid' ||
      rawPay === 'payment approved' ||
      rawPay === 'payment_approved' ||
      rawPay === 'payment confirmed';
    const isCod = order.paymentMethod.toLowerCase().includes('cod');

    const stages = [
      {
        id: 'placed',
        title: 'Order Received',
        desc: `Received on ${order.createdAt}`,
        completed: true,
        current: false,
        icon: Package,
      },
      {
        id: 'payment',
        title: 'Payment Verification',
        desc: isPaymentConfirmed
          ? 'Payment Confirmed & Reconciled'
          : rawVerify === 'rejected'
          ? `Payment Rejected: ${order.paymentRejectionReason || 'Invalid Reference'}`
          : rawVerify === 'under_review' || order.isFlagged
          ? `Under Review: ${order.flagReason || 'Duplicate or transaction verification in progress'}`
          : rawVerify === 'details_submitted' || rawVerify === 'verification_pending'
          ? `UTR Submitted (${order.utrNumber}) • Verification Pending`
          : isCod
          ? 'Cash on Delivery • Collect on Delivery'
          : 'Awaiting UPI / PhonePe Payment',
        completed: isPaymentConfirmed || isCod,
        current: !isPaymentConfirmed && !isCod,
        icon: isPaymentConfirmed ? CheckCircle2 : Clock,
        highlight: rawVerify === 'rejected' ? 'error' : rawVerify === 'under_review' ? 'warning' : !isPaymentConfirmed && !isCod ? 'warning' : 'success',
      },
      {
        id: 'confirmed',
        title: 'Order Confirmed',
        desc: 'Forwarded to the Chikmagalur roastery floor',
        completed: isPaymentConfirmed || isCod || (rawOrder !== 'pending' && rawOrder !== 'received' && rawOrder !== 'payment_review'),
        current: (isPaymentConfirmed || isCod) && (rawOrder === 'confirmed' || rawOrder === 'processing'),
        icon: CheckCircle2,
      },
      {
        id: 'processing',
        title: 'Preparing Your Coffee',
        desc: 'Micro-batch thermal roasting & precise burr milling',
        completed: ['processing', 'packing', 'packed', 'ready_to_ship', 'shipped', 'out for delivery', 'out_for_delivery', 'delivered'].includes(rawOrder),
        current: rawOrder === 'processing',
        icon: Flame,
      },
      {
        id: 'packed',
        title: 'Packed & Aroma Sealed',
        desc: order.packedAt ? `Packed on ${order.packedAt}` : 'Freshness-sealed in glass jars with tamper ribbon',
        completed: ['packing', 'packed', 'ready_to_ship', 'shipped', 'out for delivery', 'out_for_delivery', 'delivered'].includes(rawOrder),
        current: rawOrder === 'packing' || rawOrder === 'packed' || rawOrder === 'ready_to_ship',
        icon: Box,
      },
      {
        id: 'shipped',
        title: 'Handed to Courier',
        desc: order.courierName
          ? `Dispatched via ${order.courierName} (AWB: ${order.courierTrackingId || 'Active'})`
          : 'Handed over to express logistics partner',
        completed: ['shipped', 'out for delivery', 'out_for_delivery', 'delivered'].includes(rawOrder),
        current: rawOrder === 'shipped' || rawOrder === 'out for delivery' || rawOrder === 'out_for_delivery',
        icon: Truck,
      },
      {
        id: 'delivered',
        title: 'Delivered',
        desc: order.deliveredAt ? `Delivered on ${order.deliveredAt}` : 'Enjoy your authentic South Indian filter kaapi!',
        completed: rawOrder === 'delivered',
        current: rawOrder === 'delivered',
        icon: CheckCircle2,
      },
    ];

    return stages;
  };

  return (
    <div className="bg-[#F8F4EC] min-h-screen py-8 sm:py-14 text-[#201814]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* BREADCRUMB */}
        <nav className="flex items-center gap-2 text-xs text-[#7A6E65] font-medium">
          <button onClick={() => navigateTo('home')} className="hover:text-[#28170F] transition-colors cursor-pointer">
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#B77943] font-semibold">Track Order</span>
        </nav>

        {/* HEADER */}
        <div className="bg-[#28170F] text-[#F8F4EC] rounded-3xl p-6 sm:p-10 border border-[#D7AD36]/30 shadow-warm-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none hidden md:block">
            <img
              src="/images/sjt_farm_plantation.jpg"
              alt="SJT Farms Araku Valley Plantation"
              className="w-full h-full object-cover mix-blend-luminosity"
            />
          </div>

          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#123D2F] border border-[#D7AD36]/40 text-[#D7AD36] text-[11px] font-bold uppercase tracking-widest">
              <Truck className="w-3.5 h-3.5" />
              <span>LIVE ORDER DISPATCH & VERIFICATION</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Track Your SJT Farms Order
            </h1>
            <p className="text-xs sm:text-sm text-[#F8F4EC]/80 leading-relaxed font-sans">
              Follow every step of your coffee from our shade-grown high-altitude estate to your morning cup.
              Track payment verification, roastery roasting, packaging, and express courier dispatch.
            </p>
          </div>
        </div>

        {/* SEARCH & LOOKUP SECTION */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DED2C4] shadow-warm-xs">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
            <div className="md:col-span-5 space-y-1.5">
              <label className="text-xs font-bold text-[#28170F] uppercase tracking-wider block font-sans">
                Order Reference Number *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={orderQuery}
                  onChange={(e) => setOrderQuery(e.target.value)}
                  placeholder="e.g. SJT-894210"
                  className="w-full text-xs font-mono font-bold min-h-[46px] px-3.5 py-2.5 rounded-xl border border-[#DED2C4] bg-[#F8F4EC] focus:outline-none focus:border-[#D7AD36] focus:ring-1 focus:ring-[#D7AD36] uppercase"
                />
              </div>
            </div>

            <div className="md:col-span-4 space-y-1.5">
              <label className="text-xs font-bold text-[#28170F] uppercase tracking-wider block font-sans">
                Email or Mobile (Optional)
              </label>
              <input
                type="text"
                value={contactQuery}
                onChange={(e) => setContactQuery(e.target.value)}
                placeholder="customer@email.com or 9876543210"
                className="w-full text-xs min-h-[46px] px-3.5 py-2.5 rounded-xl border border-[#DED2C4] bg-[#F8F4EC] focus:outline-none focus:border-[#D7AD36] focus:ring-1 focus:ring-[#D7AD36]"
              />
            </div>

            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[46px] px-6 py-2.5 bg-[#28170F] hover:bg-[#3A2117] text-[#F8F4EC] rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95 disabled:opacity-75"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#D7AD36]" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 text-[#D7AD36]" />
                    <span>Track Order</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {searchError && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{searchError}</span>
            </div>
          )}

          {/* QUICK ACCOUNT ORDER SELECTOR (IF LOGGED IN OR LOCAL ORDERS EXIST) */}
          {myOrders.length > 1 && (
            <div className="mt-6 pt-5 border-t border-[#DED2C4]/70">
              <span className="text-[11px] font-bold text-[#7A6E65] uppercase tracking-wider block mb-2 font-sans">
                Your Recent Orders ({myOrders.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {myOrders.slice(0, 5).map((o) => (
                  <button
                    key={o.orderId}
                    onClick={() => {
                      setActiveOrder(o);
                      setOrderQuery(o.orderId);
                      setSearchError(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                      activeOrder?.orderId === o.orderId
                        ? 'bg-[#28170F] text-[#D7AD36] border-[#D7AD36] shadow-xs'
                        : 'bg-[#F8F4EC] text-[#201814] border-[#DED2C4] hover:bg-[#EFE3D2]'
                    }`}
                  >
                    #{o.orderId} (₹{o.total})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ACTIVE ORDER DISPLAY */}
        {activeOrder ? (
          <div className="space-y-8">
            {/* TOP SUMMARY TICKET */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DED2C4] shadow-warm-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h2 className="font-mono text-xl sm:text-2xl font-bold text-[#28170F]">
                    {formatDisplayOrderId(activeOrder.orderNumber || activeOrder.orderId)}
                  </h2>
                  <button
                    onClick={() => handleCopyOrderId(String(activeOrder.orderNumber || activeOrder.orderId))}
                    className="p-1 text-[#7A6E65] hover:text-[#28170F] rounded cursor-pointer transition-colors"
                    title="Copy Order Number"
                  >
                    {copiedOrderId === 'success' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : copiedOrderId === 'failure' ? (
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-[#7A6E65] font-sans">
                  Placed on <strong className="text-[#201814]">{activeOrder.createdAt}</strong> • Customer:{' '}
                  <strong className="text-[#201814]">{activeOrder.customer.fullName}</strong>
                </p>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Fulfillment Status */}
                <div className="px-3.5 py-1.5 rounded-xl bg-[#28170F] text-[#F8F4EC] text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-[#D7AD36] animate-pulse" />
                  <span>Status: {activeOrder.orderStatus}</span>
                </div>

                {/* Payment Status Badge */}
                <div
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
                    activeOrder.paymentStatus === 'Payment Approved' ||
                    activeOrder.paymentStatus === 'Payment Confirmed' ||
                    activeOrder.paymentStatus === 'payment_approved' ||
                    activeOrder.paymentStatus === 'Paid' ||
                    activeOrder.paymentStatus === 'paid' ||
                    activeOrder.paymentVerificationStatus === 'paid' ||
                    activeOrder.paymentVerificationStatus === 'confirmed'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : activeOrder.paymentStatus === 'Payment Rejected' ||
                        activeOrder.paymentStatus === 'payment_rejected' ||
                        activeOrder.paymentVerificationStatus === 'rejected'
                      ? 'bg-rose-50 text-rose-800 border-rose-300'
                      : activeOrder.paymentStatus === 'Verification Pending' ||
                        activeOrder.paymentStatus === 'payment_pending_verification' ||
                        activeOrder.paymentStatus === 'Payment Details Submitted' ||
                        activeOrder.paymentVerificationStatus === 'verification_pending' ||
                        activeOrder.paymentVerificationStatus === 'details_submitted' ||
                        Boolean(activeOrder.utrNumber)
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-neutral-100 text-neutral-800 border-neutral-300'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    Payment:{' '}
                    {activeOrder.paymentStatus === 'Payment Approved' ||
                    activeOrder.paymentStatus === 'payment_approved' ||
                    activeOrder.paymentVerificationStatus === 'paid'
                      ? 'Payment Approved'
                      : activeOrder.paymentStatus === 'Payment Rejected' ||
                        activeOrder.paymentStatus === 'payment_rejected' ||
                        activeOrder.paymentVerificationStatus === 'rejected'
                      ? 'Payment Rejected'
                      : activeOrder.paymentStatus === 'Verification Pending' ||
                        activeOrder.paymentStatus === 'payment_pending_verification' ||
                        activeOrder.paymentVerificationStatus === 'verification_pending'
                      ? 'Verification Pending'
                      : activeOrder.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* COURIER DISPATCH CARD (IF SHIPPED) */}
            {activeOrder.courierName && (
              <div className="bg-[#123D2F] text-[#F8F4EC] rounded-3xl p-6 sm:p-8 border border-[#D7AD36]/40 shadow-warm-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#D7AD36] text-[#160E0A] flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#D7AD36] font-bold uppercase tracking-wider block">
                      Dispatched with Courier Partner
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      {activeOrder.courierName}
                    </h3>
                    <p className="text-xs text-[#F8F4EC]/80 mt-1 font-mono">
                      Tracking ID: <strong className="text-white">{activeOrder.courierTrackingId || 'Active'}</strong>
                    </p>
                  </div>
                </div>

                {activeOrder.courierTrackingUrl && (
                  <a
                    href={activeOrder.courierTrackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 bg-[#D7AD36] hover:bg-[#C5A059] text-[#160E0A] rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 self-start sm:self-auto shadow-sm"
                  >
                    <span>Track on {activeOrder.courierName}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}

            {/* PAYMENT APPROVED & RECONCILED CONFIRMATION CARD */}
            {(() => {
              const rawVerify = (activeOrder.paymentVerificationStatus || '').toLowerCase();
              const rawPay = (activeOrder.paymentStatus || '').toLowerCase();
              const isPaymentConfirmed =
                rawVerify === 'confirmed' ||
                rawVerify === 'paid' ||
                rawPay === 'paid' ||
                rawPay === 'payment approved' ||
                rawPay === 'payment_approved' ||
                rawPay === 'payment confirmed';
              const isCodOrder = Boolean(
                activeOrder.paymentMethod?.toLowerCase().includes('cash on delivery') ||
                activeOrder.paymentMethod?.toLowerCase().includes('cod')
              );

              if (!isPaymentConfirmed) return null;

              return (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-500/40 shadow-warm-md space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DED2C4]">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold uppercase tracking-wider mb-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Payment Approved & Reconciled</span>
                      </div>
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-[#28170F]">
                        Payment Verified for {formatDisplayOrderId(activeOrder.orderNumber || activeOrder.orderId)}
                      </h3>
                      <p className="text-xs text-[#7A6E65] mt-1 font-sans">
                        Reconciled against merchant banking records. Your coffee is scheduled for roasting and packaging.
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-[#7A6E65] uppercase font-bold tracking-wider block">
                        Paid Amount
                      </span>
                      <span className="font-serif text-2xl font-extrabold text-[#28170F]">
                        ₹{activeOrder.total}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
                    <div className="p-3.5 bg-[#F8F4EC] rounded-2xl border border-[#DED2C4]">
                      <span className="text-[10px] text-[#7A6E65] uppercase font-bold tracking-wider block">
                        Payment Method
                      </span>
                      <span className="font-bold text-[#28170F] mt-0.5 block">
                        {activeOrder.paymentMethod}
                      </span>
                    </div>

                    <div className="p-3.5 bg-[#F8F4EC] rounded-2xl border border-[#DED2C4]">
                      <span className="text-[10px] text-[#7A6E65] uppercase font-bold tracking-wider block">
                        UTR / Reference Number
                      </span>
                      {activeOrder.utrNumber ? (
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono font-bold text-[#28170F]">
                            {activeOrder.utrNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              copyToClipboard(activeOrder.utrNumber || '');
                              setUtrNotice({ type: 'success', text: 'UTR copied to clipboard' });
                              setTimeout(() => setUtrNotice(null), 2500);
                            }}
                            className="text-[11px] text-[#B77943] hover:underline cursor-pointer"
                          >
                            Copy
                          </button>
                        </div>
                      ) : (
                        <span className="font-semibold text-[#7A6E65] mt-0.5 block italic">
                          {isCodOrder ? 'Cash on Delivery' : 'Verified by Administrator'}
                        </span>
                      )}
                    </div>

                    <div className="p-3.5 bg-[#F8F4EC] rounded-2xl border border-[#DED2C4]">
                      <span className="text-[10px] text-[#7A6E65] uppercase font-bold tracking-wider block">
                        Verification Status
                      </span>
                      <span className="font-bold text-emerald-800 mt-0.5 block flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{activeOrder.paymentVerifiedBy ? `By ${activeOrder.paymentVerifiedBy}` : 'Authorized by Administrator'}</span>
                      </span>
                      {activeOrder.paymentVerifiedAt && (
                        <span className="text-[10px] text-[#7A6E65] block mt-0.5">
                          {new Date(activeOrder.paymentVerifiedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* PAYMENT VERIFICATION / UTR INPUT CARD (IF PAYMENT STILL PENDING) */}
            {(() => {
              const rawVerify = (activeOrder.paymentVerificationStatus || '').toLowerCase();
              const rawPay = (activeOrder.paymentStatus || '').toLowerCase();
              const isPaymentConfirmed =
                rawVerify === 'confirmed' ||
                rawVerify === 'paid' ||
                rawPay === 'paid' ||
                rawPay === 'payment approved' ||
                rawPay === 'payment_approved' ||
                rawPay === 'payment confirmed';
              const isCodOrder = Boolean(
                activeOrder.paymentMethod?.toLowerCase().includes('cash on delivery') ||
                activeOrder.paymentMethod?.toLowerCase().includes('cod')
              );

              return !isPaymentConfirmed && !isCodOrder && activeOrder.paymentMethod.toLowerCase().includes('upi');
            })() && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#D7AD36]/60 shadow-warm-md space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DED2C4]">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#123D2F]/10 text-[#123D2F] text-[11px] font-bold uppercase tracking-wider mb-1">
                        <QrCode className="w-3.5 h-3.5 text-[#123D2F]" />
                        <span>PhonePe / UPI Payment Action Required</span>
                      </div>
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-[#28170F]">
                        Complete Payment for {formatDisplayOrderId(activeOrder.orderNumber || activeOrder.orderId)}
                      </h3>
                      <p className="text-xs text-[#7A6E65] mt-1 font-sans">
                        Scan the QR code below or pay via UPI ID, then enter your 12-digit UTR reference number.
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-[#7A6E65] uppercase font-bold tracking-wider block">
                        Exact Amount Payable
                      </span>
                      <span className="font-serif text-2xl font-extrabold text-[#28170F]">
                        ₹{activeOrder.total}
                      </span>
                    </div>
                  </div>

                  {(() => {
                    const isRejected =
                      (activeOrder.paymentStatus || '').toLowerCase().includes('rejected') ||
                      (activeOrder.paymentVerificationStatus || '').toLowerCase() === 'rejected';

                    if (isRejected) {
                      return (
                        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs space-y-1.5">
                          <strong className="font-bold flex items-center gap-1.5 text-rose-900 text-xs sm:text-sm">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            Payment Rejected by Accounts Desk
                          </strong>
                          <p className="text-rose-900">
                            Reason: <strong>{activeOrder.paymentRejectionReason || 'Transaction reference not found in merchant bank account statement.'}</strong>
                          </p>
                          {activeOrder.utrNumber && (
                            <p className="font-mono text-[11px] text-rose-900">
                              Rejected Reference: <span className="font-bold">{activeOrder.utrNumber}</span>
                            </p>
                          )}
                          <p className="text-[11px] text-rose-700">
                            Please review your PhonePe / UPI transaction or enter the corrected 12-digit UTR reference below to resubmit.
                          </p>
                        </div>
                      );
                    }

                    if (activeOrder.utrNumber) {
                      return (
                        <div className="p-3.5 bg-amber-50/80 border border-amber-200 text-amber-950 rounded-2xl text-xs flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-amber-800 font-bold uppercase block">
                              Submitted Reference
                            </span>
                            <span className="font-mono font-bold text-amber-950">
                              UTR: {activeOrder.utrNumber}
                            </span>
                          </div>
                          <span className="text-[10px] bg-amber-200/80 text-amber-950 font-bold px-2.5 py-1 rounded-full">
                            Verification Pending
                          </span>
                        </div>
                      );
                    }

                    return null;
                  })()}

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* On-Demand QR Trigger Banner (QR Hidden by Default) */}
                    <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-[#F8F4EC] rounded-2xl border border-[#DED2C4] text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-[#D7AD36] flex items-center justify-center text-[#28170F] shadow-xs">
                        <QrCode className="w-6 h-6 text-[#D7AD36]" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#28170F] uppercase tracking-wider">
                          UPI QR Code Payment
                        </h4>
                        <p className="text-[11px] text-[#7A6E65] mt-0.5">
                          QR code is generated on-demand for ₹{activeOrder.total}. Tap below to view and scan.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsQrModalOpen(true)}
                        className="px-4 py-2.5 bg-[#28170F] hover:bg-[#3B2418] text-[#F8F4EC] rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
                      >
                        <QrCode className="w-4 h-4 text-[#D7AD36]" />
                        <span>View Payment QR Code</span>
                      </button>
                    </div>

                    {/* Instructions & UTR Input Form */}
                    <div className="md:col-span-7 space-y-4">
                      {/* UPI ID box */}
                      <div className="p-3.5 bg-[#F8F4EC] rounded-2xl border border-[#DED2C4] flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] text-[#7A6E65] uppercase font-bold tracking-wider block">
                            Direct UPI ID
                          </span>
                          <span className="font-mono text-sm font-bold text-[#28170F] block">
                            {MERCHANT_UPI_ID}
                          </span>
                          <span className="text-[10px] text-[#123D2F] font-semibold block mt-0.5">
                            Recipient: {MERCHANT_NAME}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyUpi}
                          className={`px-3.5 py-2 border rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs ${
                            copiedUpi === 'success'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : copiedUpi === 'failure'
                              ? 'bg-rose-50 border-rose-300 text-rose-800'
                              : 'bg-white hover:bg-[#EFE3D2] text-[#28170F] border-[#DED2C4]'
                          }`}
                        >
                          {copiedUpi === 'success' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Copied!</span>
                            </>
                          ) : copiedUpi === 'failure' ? (
                            <>
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Failed</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy ID</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Deep link button and QR fallback for payment */}
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <a
                            href={buildUpiIntentUri({
                              amount: activeOrder.total,
                              orderNumberOrId: activeOrder.orderNumber || activeOrder.orderId,
                            })}
                            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-[#5f259f] hover:bg-[#4d1d82] text-white text-xs font-bold rounded-xl transition-colors shadow-xs active:scale-98"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>Pay via PhonePe / UPI App (₹{activeOrder.total})</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => setIsQrModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-[#28170F] hover:bg-[#3B2418] text-[#F8F4EC] text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer active:scale-98"
                          >
                            <QrCode className="w-3.5 h-3.5 text-[#D7AD36]" />
                            <span>Scan Payment QR Code</span>
                          </button>
                        </div>

                        <p className="text-[10px] text-[#7A6E65]">
                          💡 If your UPI app shows &ldquo;Declined for security reasons&rdquo;, this is a bank policy for web links. Tap <strong>&ldquo;Scan Payment QR Code&rdquo;</strong> to scan or copy the UPI ID directly.
                        </p>
                      </div>

                      {/* UTR Form */}
                      <form onSubmit={handleSubmitUtr} className="space-y-3">
                        <div>
                          <label className="text-xs font-bold text-[#28170F] uppercase tracking-wider block mb-1">
                            {activeOrder.utrNumber
                              ? 'Update 12-Digit UTR Reference (if entered incorrectly):'
                              : 'Enter 12-Digit UPI Reference / UTR Number *'}
                          </label>
                          <input
                            type="text"
                            maxLength={24}
                            value={utrInput}
                            onChange={(e) => setUtrInput(e.target.value.replace(/[^A-Za-z0-9]/g, ''))}
                            placeholder="e.g. 428190345612"
                            className="w-full text-xs font-mono font-bold min-h-[46px] px-3.5 py-2.5 rounded-xl border border-[#DED2C4] bg-[#F8F4EC] focus:outline-none focus:border-[#D7AD36] focus:ring-1 focus:ring-[#D7AD36]"
                          />
                          <p className="text-[11px] text-[#7A6E65] mt-1 font-sans">
                            Found in your PhonePe / UPI app transaction receipt (UTR / Bank Reference Number).
                          </p>
                        </div>

                        {utrNotice && (
                          <div
                            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                              utrNotice.type === 'success'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                : 'bg-rose-50 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {utrNotice.type === 'success' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            )}
                            <span>{utrNotice.text}</span>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isSubmittingUtr}
                          className="w-full py-3.5 min-h-[48px] bg-[#28170F] hover:bg-[#3A2117] text-[#F8F4EC] rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95 disabled:opacity-75"
                        >
                          {isSubmittingUtr ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin text-[#D7AD36]" />
                              <span>Submitting Reference...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-[#D7AD36]" />
                              <span>Submit Payment Details for Verification</span>
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

            {/* DETAILED TIMELINE SECTION */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#DED2C4] shadow-warm-xs space-y-6">
              <div className="border-b border-[#DED2C4] pb-4">
                <span className="text-xs font-bold text-[#B77943] uppercase tracking-[0.2em] font-sans block mb-1">
                  Step-by-Step Progress
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#28170F]">
                  Order Fulfillment & Dispatch Journey
                </h3>
              </div>

              {/* Vertical Stepper */}
              <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#DED2C4]">
                {getTimelineProgression(activeOrder).map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.id} className="relative flex items-start gap-4 group">
                      {/* Dot icon */}
                      <div
                        className={`absolute -left-6 sm:-left-8 w-6 sm:w-8 h-6 sm:h-8 rounded-full flex items-center justify-center transition-all ${
                          step.completed
                            ? 'bg-[#123D2F] text-[#F8F4EC] ring-4 ring-[#123D2F]/20'
                            : step.current
                            ? 'bg-[#D7AD36] text-[#160E0A] ring-4 ring-[#D7AD36]/30 animate-pulse'
                            : 'bg-[#F8F4EC] text-[#7A6E65] border border-[#DED2C4]'
                        }`}
                      >
                        <Icon className="w-3 sm:w-4 h-3 sm:h-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4
                            className={`text-sm font-bold ${
                              step.completed
                                ? 'text-[#123D2F]'
                                : step.current
                                ? 'text-[#28170F]'
                                : 'text-[#7A6E65]'
                            }`}
                          >
                            {step.title}
                          </h4>
                          {step.current && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D7AD36]/20 text-[#28170F]">
                              Current Stage
                            </span>
                          )}
                          {step.completed && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800">
                              Completed
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#7A6E65] leading-relaxed font-sans">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ORDER ITEMS & DELIVERY DETAILS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left: Products in Order */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#DED2C4] shadow-warm-xs space-y-4">
                <h3 className="font-serif text-lg font-bold text-[#28170F] pb-3 border-b border-[#DED2C4]">
                  Items in this Order ({activeOrder.items.length})
                </h3>

                <div className="space-y-3 divide-y divide-[#DED2C4]/60">
                  {activeOrder.items.map((item, idx) => (
                    <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={getProductVariantJarImage(item.product, item.selectedWeight)}
                          alt={`${item.product.name} ${item.selectedWeight}`}
                          className="w-14 h-14 rounded-xl object-contain p-1 bg-[#F8F4EC] border border-[#DED2C4]"
                        />
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-[#28170F]">
                            {item.product.name}
                          </h4>
                          <span className="text-[11px] text-[#B77943] font-semibold block mt-0.5">
                            Jar Size: {item.selectedWeight} • Qty: {item.quantity}
                          </span>
                        </div>
                      </div>
                      <span className="font-serif text-sm font-bold text-[#28170F]">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="border-t border-[#DED2C4] pt-4 space-y-1.5 text-xs text-[#7A6E65]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-[#201814] font-semibold">₹{activeOrder.subtotal}</span>
                  </div>
                  {activeOrder.discount > 0 && (
                    <div className="flex justify-between text-emerald-800">
                      <span>Discount</span>
                      <span>-₹{activeOrder.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>
                      {activeOrder.delivery === 0 ? (
                        <span className="text-emerald-800 font-bold uppercase text-[10px]">FREE</span>
                      ) : (
                        `₹${activeOrder.delivery}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-serif font-extrabold text-[#28170F] pt-2 border-t border-[#DED2C4]">
                    <span>Total Amount</span>
                    <span>₹{activeOrder.total}</span>
                  </div>
                </div>
              </div>

              {/* Right: Shipping Address & Concierge Support */}
              <div className="lg:col-span-5 space-y-6">
                {/* Shipping Address */}
                <div className="bg-white rounded-3xl p-6 border border-[#DED2C4] shadow-warm-xs space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#28170F] uppercase tracking-wider pb-2 border-b border-[#DED2C4]">
                    <MapPin className="w-4 h-4 text-[#B77943]" />
                    <span>Delivery Address</span>
                  </div>
                  <div className="text-xs text-[#7A6E65] space-y-1 leading-relaxed">
                    <p className="font-bold text-[#201814]">{activeOrder.customer.fullName}</p>
                    <p>{activeOrder.customer.address}</p>
                    <p>
                      {activeOrder.customer.city}, {activeOrder.customer.state} - {activeOrder.customer.pincode}
                    </p>
                    <p className="pt-1">Phone: +91 {activeOrder.customer.phone}</p>
                    <p>Email: {activeOrder.customer.email}</p>
                  </div>
                </div>

                {/* Concierge & Support Card */}
                <div className="bg-[#EFE3D2] rounded-3xl p-6 border border-[#DED2C4] shadow-warm-xs space-y-3">
                  <span className="text-[10px] font-bold text-[#B77943] uppercase tracking-widest block font-sans">
                    SJT FARMS CONCIERGE
                  </span>
                  <h4 className="font-serif text-base font-bold text-[#28170F]">
                    Need Help With Your Shipment?
                  </h4>
                  <p className="text-xs text-[#7A6E65] leading-relaxed font-sans">
                    Our Chikmagalur estate team is at your disposal for questions regarding roast batches, grinding recommendations, or courier updates.
                  </p>

                  <div className="pt-2 flex flex-col gap-2">
                    <a
                      href={buildWhatsAppLink(
                        activeOrder
                          ? WHATSAPP_TEMPLATES.orderTracking.en(activeOrder.orderNumber || activeOrder.orderId)
                          : WHATSAPP_TEMPLATES.customerSupport.en
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-[#123D2F] hover:bg-[#0A241C] text-[#F8F4EC] rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#D7AD36]" />
                      <span>WhatsApp Support</span>
                    </a>

                    <button
                      onClick={() => navigateTo('contact')}
                      className="px-4 py-2 bg-white hover:bg-[#F8F4EC] text-[#28170F] border border-[#DED2C4] rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email Estate Concierge</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* AUDIT LOG & RECENT STATUS UPDATES */}
            {activeOrder.statusHistory && activeOrder.statusHistory.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DED2C4] shadow-warm-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#DED2C4]">
                  <div>
                    <span className="text-[10px] text-[#B77943] font-bold uppercase tracking-widest block font-sans">
                      Verified Activity Log
                    </span>
                    <h3 className="font-serif text-lg font-bold text-[#28170F]">
                      Chronological Order Journey
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2.5 py-1 bg-[#F8F4EC] rounded-lg border border-[#DED2C4] text-[#28170F]">
                    {activeOrder.statusHistory.length} Milestones Recorded
                  </span>
                </div>

                <div className="space-y-2.5">
                  {activeOrder.statusHistory.map((h, i) => (
                    <div
                      key={i}
                      className="p-3 bg-[#F8F4EC] rounded-xl border border-[#DED2C4] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs"
                    >
                      <div>
                        <strong className="text-[#28170F] font-bold block">{h.status}</strong>
                        {h.note && <p className="text-[11px] text-[#7A6E65] mt-0.5">{h.note}</p>}
                      </div>
                      <span className="text-[10px] text-[#7A6E65] font-mono shrink-0 self-start sm:self-center">
                        {new Date(h.timestamp).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* NO ORDER SEARCHED YET */
          <div className="bg-white rounded-3xl p-10 sm:p-14 border border-[#DED2C4] text-center max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#F8F4EC] flex items-center justify-center text-[#B77943] mx-auto border border-[#DED2C4]">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#28170F]">
              Enter Your Order Reference to Begin
            </h3>
            <p className="text-xs text-[#7A6E65] leading-relaxed max-w-sm mx-auto font-sans">
              Please enter your 6-digit SJT Farms order ID (e.g. SJT-894210) from your order confirmation or invoice to see live roastery & dispatch status.
            </p>
          </div>
        )}
      </div>

      {/* ON-DEMAND QR MODAL (HIDDEN BY DEFAULT) */}
      {activeOrder && (
        <UpiQrModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          total={Number(activeOrder.total || 0)}
          orderNumberOrId={activeOrder.orderNumber || activeOrder.orderId}
          onProceedToUtrSubmission={() => setIsQrModalOpen(false)}
        />
      )}
    </div>
  );
};
