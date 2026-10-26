import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  ChevronRight,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Check,
  Coffee,
} from 'lucide-react';
import { useCart, FREE_SHIPPING_THRESHOLD } from '../context/CartContext';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { GoogleProfileAvatar } from '../components/auth/GoogleProfileAvatar';
import { OrderDetails } from '../types';
import { createOrder, submitPaymentUTR } from '../services/orders';
import { sendOrderNotificationEmail } from '../services/emailService';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { PaymentInterface } from '../components/payment/PaymentInterface';
import { getProductVariantJarImage } from '../data/products';
import { formatInr } from '../utils/currencyFormatter';

export const CheckoutPage: React.FC = () => {
  const { items, subtotal, discount, delivery, total, clearCart } = useCart();
  const { navigateTo } = useNavigation();
  const { user, openAuthModal } = useAuth();

  // Workflow Stage: 'delivery' (Contact & Address) | 'payment' (Payment Interface)
  const [checkoutStage, setCheckoutStage] = useState<'delivery' | 'payment'>('delivery');

  // Contact & Delivery Form State
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Karnataka');
  const [pincode, setPincode] = useState('');

  // UI & Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showMobileSummary, setShowMobileSummary] = useState(false);

  // Allocated Order State (Guarantees Atomic Allocation & Zero Duplicate Orders)
  const [allocatedOrder, setAllocatedOrder] = useState<OrderDetails | null>(null);
  const allocationPromiseRef = React.useRef<Promise<OrderDetails> | null>(null);
  const isSubmittingOrderRef = React.useRef<boolean>(false);

  // Sync profile details if user logs in during checkout (functional updates prevent cascading re-renders)
  useEffect(() => {
    if (user) {
      setFullName((prev) => (!prev && user.name ? user.name : prev));
      setEmail((prev) => (!prev && user.email ? user.email : prev));
      setPhone((prev) => (!prev && user.phone ? user.phone : prev));
    }
  }, [user]);

  const indianStates = [
    'Karnataka', 'Tamil Nadu', 'Kerala', 'Telangana', 'Andhra Pradesh',
    'Maharashtra', 'Delhi', 'Goa', 'Gujarat', 'West Bengal', 'Rajasthan', 'Other State'
  ];

  const validateAddressForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) newErrors.email = 'Valid email is required';
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) newErrors.phone = 'Valid 10-digit mobile number required';
    if (!address.trim()) newErrors.address = 'Street address is required';
    if (!city.trim()) newErrors.city = 'City is required';
    if (!pincode.trim() || pincode.length !== 6) newErrors.pincode = 'Valid 6-digit PIN code required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Validates product prices and stock against Cloud Firestore.
   * Prevents client-side price manipulation.
   */
  const validateCartItemsAgainstFirestore = async () => {
    let verifiedSubtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      try {
        const prodRef = doc(db, 'products', item.product.id);
        const prodSnap = await getDoc(prodRef);

        if (prodSnap.exists()) {
          const pData = prodSnap.data();

          if (pData.status === 'inactive') {
            throw new Error(`Product "${pData.name || item.product.name}" is currently unavailable.`);
          }

          if (typeof pData.stock === 'number' && pData.stock < item.quantity) {
            throw new Error(
              `Only ${pData.stock} units available for "${pData.name || item.product.name}". Please adjust quantity.`
            );
          }

          // Authoritative price from Firestore
          let unitPrice = Number(pData.price) || item.price;
          if (pData.weightPrices && pData.weightPrices[item.selectedWeight]) {
            unitPrice = Number(pData.weightPrices[item.selectedWeight]);
          }

          verifiedSubtotal += unitPrice * item.quantity;
          validatedItems.push({
            ...item,
            price: unitPrice,
          });
        } else {
          verifiedSubtotal += item.price * item.quantity;
          validatedItems.push(item);
        }
      } catch (itemErr: any) {
        throw new Error(itemErr?.message || 'Failed to validate product details.');
      }
    }

    const verifiedDelivery = verifiedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : delivery;
    const verifiedTotal = Math.max(0, verifiedSubtotal - discount + verifiedDelivery);

    return {
      validatedItems,
      verifiedSubtotal,
      verifiedDelivery,
      verifiedTotal,
    };
  };

  /**
   * Helper to ensure an atomic order is created in Firestore starting at 101.
   * If already allocated or currently in-flight, reuses the promise/order to prevent duplicate creation.
   */
  const ensureOrderAllocated = async (methodTitle: string): Promise<OrderDetails> => {
    if (allocatedOrder) {
      return allocatedOrder;
    }
    if (allocationPromiseRef.current) {
      return allocationPromiseRef.current;
    }

    const allocationTask = (async () => {
      const { validatedItems, verifiedSubtotal, verifiedDelivery, verifiedTotal } =
        await validateCartItemsAgainstFirestore();

      const isCod = methodTitle.toLowerCase().includes('cash on delivery') || methodTitle.toLowerCase().includes('cod');

      const orderData: Omit<OrderDetails, 'orderId'> & { orderId?: string } = {
        items: validatedItems,
        subtotal: verifiedSubtotal,
        discount,
        delivery: verifiedDelivery,
        total: verifiedTotal,
        customer: {
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim(),
          state,
          pincode: pincode.trim(),
        },
        paymentMethod: methodTitle,
        paymentStatus: isCod ? 'Cash on Delivery' : 'Awaiting Payment',
        orderStatus: 'received',
        createdAt: new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        estimatedDelivery: '2–4 Business Days',
        paymentVerificationStatus: 'awaiting_payment',
      };

      const authUid = user?.uid || auth.currentUser?.uid;
      const result = await createOrder(orderData, authUid);

      if (!result.success || !result.order) {
        throw new Error(result.message || 'Failed to allocate order.');
      }

      setAllocatedOrder(result.order);
      return result.order;
    })();

    allocationPromiseRef.current = allocationTask;

    try {
      return await allocationTask;
    } catch (err) {
      allocationPromiseRef.current = null;
      throw err;
    }
  };

  /**
   * Proceeds from Contact/Address form to Payment Interface.
   */
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (!validateAddressForm()) {
      return;
    }
    setCheckoutStage('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Confirms order with Cash on Delivery payment.
   */
  const handleConfirmCod = async () => {
    if (isProcessing || isSubmittingOrderRef.current) return;
    isSubmittingOrderRef.current = true;
    setValidationError(null);
    setIsProcessing(true);

    try {
      const order = await ensureOrderAllocated('Cash on Delivery (COD)');
      sendOrderNotificationEmail(order).catch((e) =>
        console.warn('[Checkout] Email notification notice:', e)
      );

      try {
        sessionStorage.setItem('sjt_last_order', JSON.stringify(order));
      } catch {}

      clearCart();
      navigateTo('order-success', { order });
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to place order. Please try again.');
    } finally {
      isSubmittingOrderRef.current = false;
      setIsProcessing(false);
    }
  };

  /**
   * Submits UTR reference number entered by customer in Payment Interface.
   */
  const handleSubmitUtrReference = async (
    utrNumber: string
  ): Promise<{ success: boolean; message: string }> => {
    if (isProcessing || isSubmittingOrderRef.current) {
      return { success: false, message: 'Processing in progress...' };
    }
    isSubmittingOrderRef.current = true;
    setValidationError(null);
    setIsProcessing(true);

    try {
      // Ensure order has been allocated in Firestore
      const order = await ensureOrderAllocated('UPI Payment (PhonePe / GPay / Paytm / QR)');
      const res = await submitPaymentUTR(order.orderId, utrNumber, order.customer.email);

      if (res.success) {
        order.utrNumber = utrNumber;
        order.paymentStatus = 'Verification Pending';
        order.paymentVerificationStatus = 'verification_pending';

        sendOrderNotificationEmail(order).catch((e) =>
          console.warn('[Checkout] Email notification notice:', e)
        );

        try {
          sessionStorage.setItem('sjt_last_order', JSON.stringify(order));
        } catch {}

        clearCart();
        navigateTo('order-success', { order });
        return { success: true, message: res.message };
      } else {
        return { success: false, message: res.message };
      }
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to submit transaction reference.' };
    } finally {
      isSubmittingOrderRef.current = false;
      setIsProcessing(false);
    }
  };

  /**
   * If customer opts to submit UTR later on the tracking page.
   */
  const handleProceedToConfirmationWithoutUtr = async () => {
    if (isProcessing || isSubmittingOrderRef.current) return;
    isSubmittingOrderRef.current = true;
    setIsProcessing(true);
    try {
      const order = await ensureOrderAllocated('UPI Payment (Pending Verification)');
      sendOrderNotificationEmail(order).catch((e) =>
        console.warn('[Checkout] Email notification notice:', e)
      );

      try {
        sessionStorage.setItem('sjt_last_order', JSON.stringify(order));
      } catch {}

      clearCart();
      navigateTo('order-success', { order });
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to proceed to confirmation.');
    } finally {
      isSubmittingOrderRef.current = false;
      setIsProcessing(false);
    }
  };

  // Cart Empty State
  if (items.length === 0) {
    return (
      <div className="bg-[#F8F4EC] min-h-[60vh] flex items-center justify-center py-16 px-4 text-[#20150F]">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-[#E5DFD7] shadow-warm-md text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#F8F4EC] flex items-center justify-center text-[#D7AD36] mx-auto border border-[#D7AD36]/50 shadow-xs">
            <Coffee className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-xl font-bold text-[#20150F]">
            No Items in Checkout
          </h2>
          <p className="text-xs text-[#7A6A5E]">
            Your shopping cart is currently empty. Explore our shade-grown coffee roasts to start an order.
          </p>
          <button
            onClick={() => navigateTo('shop')}
            className="px-6 py-3 bg-[#20150F] text-[#F7F2EA] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#38261C] transition-colors cursor-pointer"
          >
            Return to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F4EC] min-h-screen py-8 sm:py-14 text-[#20150F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* BREADCRUMB */}
        <nav
          className="flex items-center gap-2 text-xs text-[#7A6A5E] font-medium"
          aria-label="Breadcrumb"
        >
          <button
            onClick={() => navigateTo('cart')}
            className="hover:text-[#20150F] transition-colors cursor-pointer"
          >
            Cart
          </button>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <span className="text-[#B77943] font-semibold">Secure Checkout</span>
        </nav>

        {/* 3-STAGE PROGRESS INDICATOR */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-[#E5DFD7] shadow-warm-xs">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <button
              type="button"
              onClick={() => setCheckoutStage('delivery')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer transition-colors ${
                checkoutStage === 'delivery'
                  ? 'text-[#20150F] font-bold'
                  : 'text-[#2E5A3D] font-medium'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono shadow-xs ${
                  checkoutStage === 'delivery'
                    ? 'bg-[#20150F] text-[#F7F2EA]'
                    : 'bg-[#E8F3EC] text-[#2E5A3D] border border-[#C5DDD0]'
                }`}
              >
                {checkoutStage === 'payment' ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  '1'
                )}
              </span>
              <span>Delivery Details</span>
            </button>

            <div
              className={`flex flex-col sm:flex-row items-center justify-center gap-2 transition-colors ${
                checkoutStage === 'payment'
                  ? 'text-[#B77943] font-bold'
                  : 'text-[#7A6A5E] font-medium'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono shadow-xs ${
                  checkoutStage === 'payment'
                    ? 'bg-[#B77943] text-white'
                    : 'bg-[#F8F4EC] text-[#7A6A5E] border border-[#E5DFD7]'
                }`}
              >
                2
              </span>
              <span>Payment</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-[#7A6A5E] font-medium opacity-60">
              <span className="w-6 h-6 rounded-full bg-[#F8F4EC] text-[#7A6A5E] flex items-center justify-center text-[11px] font-mono border border-[#E5DFD7]">
                3
              </span>
              <span>Confirmation</span>
            </div>
          </div>
        </div>

        {/* MOBILE COLLAPSIBLE ORDER SUMMARY */}
        <div className="lg:hidden bg-white rounded-2xl border border-[#E5DFD7] shadow-warm-xs overflow-hidden">
          <button
            type="button"
            onClick={() => setShowMobileSummary(!showMobileSummary)}
            className="w-full p-4 flex items-center justify-between text-left text-xs font-bold text-[#20150F] cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span>Order Summary ({items.length} items)</span>
              <span className="text-[#B77943]">{formatInr(total)}</span>
            </div>
            <div className="flex items-center gap-1 text-[#7A6A5E] text-[11px]">
              <span>{showMobileSummary ? 'Hide' : 'Show Details'}</span>
              {showMobileSummary ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </button>

          {showMobileSummary && (
            <div className="p-4 border-t border-[#F0EBE3] bg-[#FCFAF6] space-y-3">
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.selectedWeight}`}
                  className="flex justify-between text-xs"
                >
                  <span className="text-[#3B2C24]">
                    {item.product.name} ({item.selectedWeight}) × {item.quantity}
                  </span>
                  <span className="font-semibold text-[#20150F]">
                    {formatInr(item.price * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-[#F0EBE3] flex justify-between font-bold text-xs text-[#20150F]">
                <span>Final Payable:</span>
                <span className="text-[#B77943]">{formatInr(total)}</span>
              </div>
            </div>
          )}
        </div>

        {validationError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3 animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span className="font-medium">{validationError}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* STAGE 1: DELIVERY ADDRESS & CONTACT FORM */}
        {/* ========================================================= */}
        {checkoutStage === 'delivery' ? (
          <form onSubmit={handleProceedToPayment}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT: FORM FIELDS */}
              <div className="lg:col-span-8 space-y-6">
                {/* 1. CONTACT INFORMATION */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD7] shadow-warm-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#F0EBE3] pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#20150F] text-[#F7F2EA] text-xs font-bold flex items-center justify-center font-mono">
                        1
                      </span>
                      <h2 className="font-serif text-lg font-bold text-[#20150F]">
                        Contact Information
                      </h2>
                    </div>

                    {user ? (
                      <div className="flex items-center gap-2">
                        <GoogleProfileAvatar user={user} size="xs" />
                        <span className="text-[11px] font-semibold text-[#20150F] bg-[#F8F4EC] px-2.5 py-0.5 rounded-full border border-[#E5DFD7]">
                          {user.name.split(' ')[0]}
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openAuthModal('login')}
                        className="text-xs text-[#B77943] hover:text-[#20150F] font-bold underline cursor-pointer"
                      >
                        Sign In for Auto-Fill
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="text-xs font-bold text-[#20150F] block mb-1.5 font-sans">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Arun Kumar"
                        className="w-full text-sm sm:text-xs min-h-[46px] px-3.5 py-2.5 rounded-xl border border-[#DED2C4] bg-[#FAF8F5] text-[#20150F] focus:outline-none focus:border-[#D7AD36] focus:ring-1 focus:ring-[#D7AD36] transition-colors"
                      />
                      {errors.fullName && (
                        <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.fullName}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#20150F] block mb-1.5 font-sans">
                        Email Address (For Order Receipts) *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="arun@example.com"
                        className="w-full text-sm sm:text-xs min-h-[46px] px-3.5 py-2.5 rounded-xl border border-[#DED2C4] bg-[#FAF8F5] text-[#20150F] focus:outline-none focus:border-[#D7AD36] focus:ring-1 focus:ring-[#D7AD36] transition-colors"
                      />
                      {errors.email && (
                        <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.email}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-[#20150F] block mb-1.5 font-sans">
                        Phone Number (For Courier Tracking & Delivery) *
                      </label>
                      <div className="flex">
                        <span className="text-xs font-semibold px-3.5 flex items-center bg-[#F0EBE3] text-[#20150F] rounded-l-xl border border-r-0 border-[#DED2C4]">
                          +91
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="9876543210"
                          className="flex-1 text-sm sm:text-xs min-h-[46px] px-3.5 py-2.5 rounded-r-xl border border-[#DED2C4] bg-[#FAF8F5] text-[#20150F] focus:outline-none focus:border-[#D7AD36] focus:ring-1 focus:ring-[#D7AD36] transition-colors"
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. SHIPPING ADDRESS */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD7] shadow-warm-xs space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-[#F0EBE3] pb-3.5">
                    <span className="w-6 h-6 rounded-full bg-[#20150F] text-[#F7F2EA] text-xs font-bold flex items-center justify-center font-mono">
                      2
                    </span>
                    <h2 className="font-serif text-lg font-bold text-[#20150F]">
                      Delivery Address
                    </h2>
                  </div>

                  <div className="space-y-4 pt-1">
                    <div>
                      <label className="text-xs font-bold text-[#20150F] block mb-1.5 font-sans">
                        House / Flat No., Building, Street Address *
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. 42, Palm Grove Enclave, Indiranagar"
                        className="w-full text-sm sm:text-xs min-h-[46px] px-3.5 py-2.5 rounded-xl border border-[#DED2C4] bg-[#FAF8F5] text-[#20150F] focus:outline-none focus:border-[#D7AD36] focus:ring-1 focus:ring-[#D7AD36] transition-colors"
                      />
                      {errors.address && (
                        <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.address}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-bold text-[#20150F] block mb-1.5 font-sans">
                          City / Town *
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Bengaluru"
                          className="w-full text-sm sm:text-xs min-h-[46px] px-3.5 py-2.5 rounded-xl border border-[#DED2C4] bg-[#FAF8F5] text-[#20150F] focus:outline-none focus:border-[#D7AD36] focus:ring-1 focus:ring-[#D7AD36] transition-colors"
                        />
                        {errors.city && (
                          <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.city}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#20150F] block mb-1.5 font-sans">
                          State *
                        </label>
                        <select
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full text-sm sm:text-xs min-h-[46px] px-3.5 py-2.5 rounded-xl border border-[#DED2C4] bg-[#FAF8F5] text-[#20150F] focus:outline-none focus:border-[#D7AD36] focus:ring-1 focus:ring-[#D7AD36] transition-colors cursor-pointer"
                        >
                          {indianStates.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#20150F] block mb-1.5 font-sans">
                          6-Digit PIN Code *
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                          placeholder="560038"
                          className="w-full text-sm sm:text-xs min-h-[46px] px-3.5 py-2.5 rounded-xl border border-[#DED2C4] bg-[#FAF8F5] text-[#20150F] focus:outline-none focus:border-[#D7AD36] focus:ring-1 focus:ring-[#D7AD36] transition-colors font-mono"
                        />
                        {errors.pincode && (
                          <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.pincode}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* PROCEED BUTTON ON MOBILE */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-4 min-h-[52px] bg-[#20150F] hover:bg-[#38261C] text-[#F7F2EA] rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-98"
                  >
                    <span>Proceed to Secure Payment</span>
                    <ChevronRight className="w-4 h-4 text-[#D7AD36]" />
                  </button>
                </div>
              </div>

              {/* RIGHT: STICKY ORDER SUMMARY (DESKTOP) */}
              <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD7] shadow-warm-xs space-y-6 sticky top-24">
                <h2 className="font-serif text-xl font-bold text-[#20150F] pb-4 border-b border-[#F0EBE3]">
                  Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})
                </h2>

                {/* Items List */}
                <div className="max-h-60 overflow-y-auto space-y-3 divide-y divide-[#F0EBE3] pr-1">
                  {items.map((item) => (
                    <div
                      key={`${item.product.id}-${item.selectedWeight}`}
                      className="pt-3 first:pt-0 flex gap-3 items-center justify-between"
                    >
                      <div className="flex gap-2.5 items-center min-w-0">
                        <img
                          src={getProductVariantJarImage(item.product, item.selectedWeight)}
                          alt={item.product.name}
                          className="w-12 h-12 rounded-lg object-contain p-0.5 bg-[#F8F4EC] border border-[#E5DFD7] shrink-0"
                          loading="lazy"
                        />
                        <div className="truncate">
                          <h3 className="text-xs font-bold text-[#20150F] truncate">
                            {item.product.name}
                          </h3>
                          <span className="text-[10px] text-[#B77943] font-semibold">
                            {item.selectedWeight} × {item.quantity}
                          </span>
                        </div>
                      </div>
                      <span className="font-sans text-xs font-bold text-[#20150F] shrink-0">
                        {formatInr(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Price Details */}
                <div className="space-y-2 text-xs text-[#7A6A5E] border-t border-[#F0EBE3] pt-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-[#20150F] font-semibold">{formatInr(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-[#2E5A3D]">
                      <span>Discount</span>
                      <span>-{formatInr(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Standard Express Delivery</span>
                    <span>
                      {delivery === 0 ? (
                        <span className="text-[#2E5A3D] font-bold uppercase text-[10px]">FREE</span>
                      ) : (
                        formatInr(delivery)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-sans font-extrabold text-[#20150F] pt-3 border-t border-[#F0EBE3]">
                    <span>Total Payable</span>
                    <span className="text-[#B77943]">{formatInr(total)}</span>
                  </div>
                </div>

                {/* Continue to Payment CTA */}
                <button
                  type="submit"
                  className="w-full py-4 min-h-[52px] bg-[#20150F] hover:bg-[#38261C] text-[#F7F2EA] rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-98"
                >
                  <Lock className="w-4 h-4 text-[#D7AD36]" />
                  <span>CONTINUE TO PAYMENT</span>
                </button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-[#7A6A5E] pt-1">
                  <ShieldCheck className="w-4 h-4 text-[#2E5A3D]" />
                  <span>Direct Estate Dispatch • 100% Genuine Araku Kaapi</span>
                </div>
              </div>
            </div>
          </form>
        ) : (
          /* ========================================================= */
          /* STAGE 2: PREMIUM PAYMENT INTERFACE (MATCHES REFERENCE)   */
          /* ========================================================= */
          <div className="animate-fadeIn py-2">
            <PaymentInterface
              total={total}
              subtotal={subtotal}
              delivery={delivery}
              discount={discount}
              items={items}
              orderNumber={allocatedOrder?.orderNumber}
              onBackToAddress={() => {
                setCheckoutStage('delivery');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onConfirmCod={handleConfirmCod}
              onSubmitUtrReference={handleSubmitUtrReference}
              onProceedToConfirmation={handleProceedToConfirmationWithoutUtr}
              isProcessing={isProcessing}
            />
          </div>
        )}
      </div>
    </div>
  );
};
