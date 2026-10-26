import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Tag, Check, Sparkles } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useNavigation } from '../../context/NavigationContext';
import { useBodyScrollLock } from '../../utils/scrollLock';
import { getProductVariantJarImage } from '../../data/products';

export const CartDrawer: React.FC = () => {
  const {
    items,
    removeItem,
    updateQuantity,
    isDrawerOpen,
    setIsDrawerOpen,
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

  // Lock background body scroll when drawer is open
  useBodyScrollLock(isDrawerOpen, 'cart-drawer');

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, setIsDrawerOpen]);

  if (!isDrawerOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    const res = applyCoupon(inputCoupon);
    setCouponFeedback({ message: res.message, isError: !res.success });
    if (res.success) setInputCoupon('');
  };

  const freeShippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  const handleCheckoutClick = () => {
    setIsDrawerOpen(false);
    navigateTo('checkout');
  };

  const handleViewCartClick = () => {
    setIsDrawerOpen(false);
    navigateTo('cart');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Shopping Cart">
      {/* Backdrop */}
      <div
        onClick={() => setIsDrawerOpen(false)}
        className="absolute inset-0 bg-[var(--coffee-espresso)]/65 backdrop-blur-xs transition-opacity duration-300"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-full sm:w-screen max-w-md bg-[var(--coffee-bg)] shadow-2xl flex flex-col h-full max-h-[100dvh] border-l border-[var(--coffee-border)] animate-slide-up sm:animate-fade-in">
          {/* DRAWER HEADER */}
          <div className="p-5 border-b border-[var(--coffee-border)] bg-white/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[var(--coffee-cream)] flex items-center justify-center text-[var(--coffee-espresso)]">
                <ShoppingBag className="w-4 h-4 text-[var(--coffee-caramel)]" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold text-[var(--coffee-espresso)] tracking-tight">
                  Your Cart
                </h2>
                <span className="text-[11px] text-[var(--coffee-muted)] font-medium">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'} selected
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-2 text-[var(--coffee-muted)] hover:text-[var(--coffee-espresso)] hover:bg-[var(--coffee-cream)] rounded-full transition-colors cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* FREE SHIPPING PROGRESS BAR */}
          <div className="bg-[var(--coffee-cream)]/70 px-5 py-3.5 border-b border-[var(--coffee-border)] shrink-0">
            {freeShippingRemaining > 0 ? (
              <p className="text-xs text-[var(--coffee-text)] font-medium mb-1.5 flex items-center justify-between">
                <span>
                  Add <strong className="text-[var(--coffee-espresso)] font-bold">₹{freeShippingRemaining}</strong> more for{' '}
                  <strong className="text-[var(--coffee-caramel)] font-semibold">FREE Delivery</strong>
                </span>
                <span className="text-[10px] text-[var(--coffee-muted)] font-semibold">{freeShippingProgress}%</span>
              </p>
            ) : (
              <p className="text-xs text-[#2E5A3D] font-semibold mb-1.5 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#2E5A3D]" />
                <span>You unlocked <strong>FREE Standard Delivery</strong> across India!</span>
              </p>
            )}
            <div className="w-full bg-[var(--coffee-border)]/70 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[var(--coffee-roast)] to-[var(--coffee-caramel)] h-full rounded-full transition-all duration-500"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* ITEMS LIST */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 space-y-3.5">
            {items.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-[var(--coffee-cream)] flex items-center justify-center text-[var(--coffee-espresso)] border border-[var(--coffee-border)]">
                  <ShoppingBag className="w-7 h-7 text-[var(--coffee-caramel)] opacity-70" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[var(--coffee-espresso)]">Your cart is empty</h3>
                  <p className="text-xs text-[var(--coffee-muted)] max-w-xs mx-auto mt-1 leading-relaxed">
                    Freshly roasted coffee powders and brassware are ready to brew your morning cup.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    navigateTo('shop');
                  }}
                  className="px-6 py-2.5 bg-[var(--coffee-espresso)] text-[var(--coffee-cream)] rounded-xl text-xs font-bold tracking-wider uppercase hover:bg-[var(--coffee-roast)] transition-all cursor-pointer shadow-sm hover:translate-y-[-1px]"
                >
                  Explore Coffee Blends
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.product.id}-${item.selectedWeight}`}
                  className="flex gap-3.5 p-3.5 bg-white rounded-2xl border border-[var(--coffee-border)] shadow-2xs hover:border-[var(--coffee-caramel)]/50 transition-colors"
                >
                  <img
                    src={getProductVariantJarImage(item.product, item.selectedWeight)}
                    alt={`${item.product.name} ${item.selectedWeight}`}
                    className="w-18 h-18 object-contain p-1 rounded-xl bg-[var(--coffee-cream)] border border-[var(--coffee-border)]/60 shrink-0"
                    loading="lazy"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="font-serif text-sm font-bold text-[var(--coffee-espresso)] line-clamp-1">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeItem(item.product.id, item.selectedWeight)}
                          className="text-[var(--coffee-muted)] hover:text-[var(--coffee-error)] transition-colors p-1 rounded-md"
                          title="Remove item"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[11px] font-semibold text-[var(--coffee-caramel)] uppercase tracking-wide">
                        {item.selectedWeight}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2.5">
                      {/* Quantity stepper */}
                      <div className="flex items-center border border-[var(--coffee-border)] rounded-xl bg-[var(--coffee-cream)]/40 overflow-hidden">
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.selectedWeight, item.quantity - 1)
                          }
                          className="p-1.5 hover:bg-[var(--coffee-cream)] transition-colors text-[var(--coffee-espresso)] cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-[var(--coffee-espresso)] min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.selectedWeight, item.quantity + 1)
                          }
                          className="p-1.5 hover:bg-[var(--coffee-cream)] transition-colors text-[var(--coffee-espresso)] cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="font-serif font-bold text-sm text-[var(--coffee-espresso)]">
                          ₹{item.price * item.quantity}
                        </span>
                        {item.quantity > 1 && (
                          <p className="text-[10px] text-[var(--coffee-muted)]">₹{item.price} each</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* DRAWER FOOTER */}
          {items.length > 0 && (
            <div className="p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] bg-white border-t border-[var(--coffee-border)] space-y-3.5 shadow-lg shrink-0">
              {/* Coupon Bar */}
              {couponCode ? (
                <div className="flex items-center justify-between bg-[#F0F5F2] border border-[#C5DDD0] px-3.5 py-2 rounded-xl text-xs text-[#2E5A3D]">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Tag className="w-3.5 h-3.5 text-[#3D6B4F]" /> Coupon <strong>{couponCode}</strong> applied (-₹{discount})
                  </span>
                  <button
                    onClick={removeCoupon}
                    className="text-[#2E5A3D] hover:underline font-semibold text-[11px] cursor-pointer"
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
                    placeholder="Coupon (e.g. FIRSTCUP10)"
                    className="flex-1 text-xs px-3.5 py-2.5 border border-[var(--coffee-border)] rounded-xl bg-[var(--coffee-bg)] focus:outline-none focus:border-[var(--coffee-caramel)] focus:ring-1 focus:ring-[var(--coffee-caramel)] uppercase tracking-wider font-semibold"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-[var(--coffee-cream)] hover:bg-[var(--coffee-espresso)] hover:text-[var(--coffee-cream)] text-[var(--coffee-espresso)] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </form>
              )}

              {couponFeedback && (
                <p className={`text-[11px] font-medium ${couponFeedback.isError ? 'text-[var(--coffee-error)]' : 'text-[#2E5A3D]'}`}>
                  {couponFeedback.message}
                </p>
              )}

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-[var(--coffee-muted)] border-t border-[var(--coffee-border)]/60 pt-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-[var(--coffee-text)] font-semibold">₹{subtotal}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[#2E5A3D]">
                    <span>Discount</span>
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
                <div className="flex justify-between text-base font-serif font-extrabold text-[var(--coffee-espresso)] pt-2.5 border-t border-[var(--coffee-border)]">
                  <span>Estimated Total</span>
                  <span>₹{total}</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleCheckoutClick}
                  className="w-full py-3.5 bg-[var(--coffee-espresso)] text-[var(--coffee-cream)] rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-[var(--coffee-roast)] transition-all flex items-center justify-center gap-2 shadow-md shadow-[var(--coffee-espresso)]/20 cursor-pointer group active:scale-[0.99]"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={handleViewCartClick}
                  className="w-full py-2.5 bg-[var(--coffee-cream)] text-[var(--coffee-espresso)] rounded-xl text-xs font-semibold hover:bg-[var(--coffee-border)] transition-colors text-center cursor-pointer"
                >
                  View Full Cart & Items
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--coffee-muted)] pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#3D6B4F]" />
                <span>100% Encrypted Checkout • UPI / Cards accepted</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
