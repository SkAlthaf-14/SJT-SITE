import React, { useState } from 'react';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck, Tag, Check, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigation } from '../context/NavigationContext';
import { getProductVariantJarImage } from '../data/products';

export const CartPage: React.FC = () => {
  const {
    items,
    removeItem,
    updateQuantity,
    couponCode,
    discount,
    applyCoupon,
    removeCoupon,
    subtotal,
    delivery,
    freeShippingThreshold,
    freeShippingRemaining,
    total,
    itemCount,
  } = useCart();

  const { navigateTo } = useNavigation();

  const [inputCoupon, setInputCoupon] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  const freeShippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    const res = applyCoupon(inputCoupon);
    setCouponFeedback({ message: res.message, isError: !res.success });
    if (res.success) setInputCoupon('');
  };

  if (items.length === 0) {
    return (
      <div className="bg-[var(--coffee-bg)] min-h-[70vh] flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-12 border border-[var(--coffee-border)] shadow-sm text-center space-y-5 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-[var(--coffee-cream)] flex items-center justify-center text-[var(--coffee-espresso)] mx-auto border border-[var(--coffee-border)]">
            <ShoppingBag className="w-9 h-9 text-[var(--coffee-caramel)] opacity-70" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[var(--coffee-caramel)] uppercase tracking-[0.25em] block mb-1">
              Your Bag is Empty
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--coffee-espresso)]">
              Your Coffee Awaits
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--coffee-muted)] leading-relaxed">
            Discover our freshly roasted single-estate coffee powders, heritage blends, and traditional brassware.
          </p>
          <button
            onClick={() => navigateTo('shop')}
            className="w-full py-4 bg-[var(--coffee-espresso)] text-[var(--coffee-cream)] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[var(--coffee-roast)] transition-all shadow-md cursor-pointer hover:translate-y-[-1px]"
          >
            Explore Coffee Collection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--coffee-bg)] min-h-screen py-8 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* BREADCRUMB */}
        <nav className="flex items-center gap-2 text-xs text-[var(--coffee-muted)] mb-6 font-medium" aria-label="Breadcrumb">
          <button onClick={() => navigateTo('home')} className="hover:text-[var(--coffee-espresso)] cursor-pointer">
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <button onClick={() => navigateTo('shop')} className="hover:text-[var(--coffee-espresso)] cursor-pointer">
            Shop
          </button>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <span className="text-[var(--coffee-caramel)] font-semibold">Shopping Cart</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold text-[var(--coffee-caramel)] uppercase tracking-[0.25em] block mb-1 font-sans">
              Review Selection
            </span>
            <h1 className="heading-section text-[var(--coffee-espresso)]">
              Shopping Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
            </h1>
          </div>
          <button
            onClick={() => navigateTo('shop')}
            className="text-xs font-bold text-[var(--coffee-caramel)] hover:text-[var(--coffee-espresso)] uppercase tracking-wider transition-colors cursor-pointer self-start sm:self-auto"
          >
            ← Continue Shopping
          </button>
        </div>

        {/* FREE SHIPPING BANNER */}
        <div className="bg-white rounded-2xl p-5 border border-[var(--coffee-border)] shadow-2xs mb-8">
          <div className="flex items-center justify-between text-xs font-semibold mb-2.5">
            {freeShippingRemaining > 0 ? (
              <span className="text-[var(--coffee-text)]">
                Add <strong className="text-[var(--coffee-espresso)] font-bold">₹{freeShippingRemaining}</strong> more for{' '}
                <strong className="text-[#2E5A3D]">FREE Standard Delivery</strong> across India
              </span>
            ) : (
              <span className="text-[#2E5A3D] font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#2E5A3D]" />
                You have unlocked FREE Standard Delivery!
              </span>
            )}
            <span className="text-[var(--coffee-muted)] font-mono">{freeShippingProgress}%</span>
          </div>
          <div className="w-full bg-[var(--coffee-cream)]/70 h-2.5 rounded-full overflow-hidden border border-[var(--coffee-border)]/60">
            <div
              className="bg-gradient-to-r from-[var(--coffee-roast)] to-[var(--coffee-caramel)] h-full rounded-full transition-all duration-500"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CART ITEMS LIST */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-[var(--coffee-border)] shadow-xs space-y-6">
            <div className="divide-y divide-[var(--coffee-border)]/60">
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.selectedWeight}`}
                  className="py-6 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between"
                >
                  <div className="flex gap-4 items-center">
                    <img
                      src={getProductVariantJarImage(item.product, item.selectedWeight)}
                      alt={`${item.product.name} ${item.selectedWeight}`}
                      className="w-20 h-20 rounded-2xl object-contain p-1.5 bg-[var(--coffee-cream)] border border-[var(--coffee-border)] shrink-0"
                      loading="lazy"
                    />
                    <div>
                      <h3
                        onClick={() => navigateTo('product-detail', { product: item.product, variant: item.selectedWeight })}
                        className="font-serif text-base sm:text-lg font-bold text-[var(--coffee-espresso)] hover:text-[var(--coffee-caramel)] cursor-pointer transition-colors"
                      >
                        {item.product.name}
                      </h3>
                      <p className="text-xs text-[var(--coffee-caramel)] font-semibold mt-0.5">
                        Pack Size: {item.selectedWeight}
                      </p>
                      <p className="text-xs text-[var(--coffee-muted)] mt-0.5">₹{item.price} each</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                    {/* Quantity adjuster */}
                    <div className="flex items-center border border-[var(--coffee-border)] rounded-xl bg-[var(--coffee-cream)]/40 overflow-hidden">
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.selectedWeight, item.quantity - 1)
                        }
                        className="p-2 hover:bg-[var(--coffee-cream)] transition-colors text-[var(--coffee-espresso)] cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3.5 text-xs font-bold text-[var(--coffee-espresso)] min-w-[24px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.selectedWeight, item.quantity + 1)
                        }
                        className="p-2 hover:bg-[var(--coffee-cream)] transition-colors text-[var(--coffee-espresso)] cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right min-w-[80px]">
                      <span className="font-serif text-lg font-bold text-[var(--coffee-espresso)]">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>

                    <button
                      onClick={() => removeItem(item.product.id, item.selectedWeight)}
                      className="p-2 text-[var(--coffee-muted)] hover:text-[var(--coffee-error)] transition-colors cursor-pointer rounded-lg hover:bg-rose-50"
                      title="Remove item"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ORDER SUMMARY SIDEBAR */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-8 border border-[var(--coffee-border)] shadow-xs space-y-6 sticky top-24">
            <h2 className="font-serif text-xl font-bold text-[var(--coffee-espresso)] pb-4 border-b border-[var(--coffee-border)]">
              Order Summary
            </h2>

            {/* COUPON INPUT */}
            <div>
              <label className="text-xs font-bold text-[var(--coffee-espresso)] uppercase tracking-wider block mb-2">
                Have a Promo Code?
              </label>
              {couponCode ? (
                <div className="flex items-center justify-between bg-[#F0F5F2] border border-[#C5DDD0] px-3.5 py-2.5 rounded-xl text-xs text-[#2E5A3D]">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Tag className="w-4 h-4 text-[#3D6B4F]" /> <strong>{couponCode}</strong> applied (-₹{discount})
                  </span>
                  <button
                    onClick={removeCoupon}
                    className="text-[#2E5A3D] underline font-semibold text-[11px] cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={inputCoupon}
                    onChange={(e) => setInputCoupon(e.target.value)}
                    placeholder="e.g. FIRSTCUP10"
                    className="flex-1 text-xs px-3.5 py-2.5 border border-[var(--coffee-border)] rounded-xl bg-[var(--coffee-bg)] focus:outline-none focus:border-[var(--coffee-caramel)] focus:ring-1 focus:ring-[var(--coffee-caramel)] uppercase font-semibold tracking-wider"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-[var(--coffee-cream)] text-[var(--coffee-espresso)] hover:bg-[var(--coffee-espresso)] hover:text-[var(--coffee-cream)] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </form>
              )}
              {couponFeedback && (
                <p className={`text-[11px] mt-1.5 ${couponFeedback.isError ? 'text-[var(--coffee-error)]' : 'text-[#2E5A3D]'}`}>
                  {couponFeedback.message}
                </p>
              )}
            </div>

            {/* BREAKDOWN */}
            <div className="space-y-3 text-xs text-[var(--coffee-muted)] border-t border-[var(--coffee-border)] pt-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-[var(--coffee-text)] font-semibold">₹{subtotal}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[#2E5A3D]">
                  <span>Coupon Discount</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Standard Delivery</span>
                <span>
                  {delivery === 0 ? (
                    <span className="text-[#2E5A3D] font-bold uppercase text-[11px]">FREE</span>
                  ) : (
                    `₹${delivery}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-lg font-serif font-extrabold text-[var(--coffee-espresso)] pt-3 border-t border-[var(--coffee-border)]">
                <span>Total Amount</span>
                <span>₹{total}</span>
              </div>
              <p className="text-[10px] text-[var(--coffee-muted)]">Inclusive of all applicable GST & taxes</p>
            </div>

            {/* CHECKOUT BUTTON */}
            <button
              onClick={() => navigateTo('checkout')}
              className="w-full py-4 bg-[var(--coffee-espresso)] text-[var(--coffee-cream)] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[var(--coffee-roast)] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[var(--coffee-espresso)]/20 group cursor-pointer active:scale-[0.99]"
            >
              <span>PROCEED TO CHECKOUT</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-[var(--coffee-muted)] pt-1">
              <ShieldCheck className="w-4 h-4 text-[#3D6B4F]" />
              <span>Safe & Encrypted 256-bit Payment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
