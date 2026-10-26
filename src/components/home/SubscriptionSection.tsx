import React, { useState } from 'react';
import { Calendar, CheckCircle2, ArrowRight, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { PRODUCTS } from '../../data/products';
import { useNavigation } from '../../context/NavigationContext';

export const SubscriptionSection: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'frequent' | 'flexible'>('monthly');
  const [selectedBlend, setSelectedBlend] = useState(PRODUCTS[0].id);
  const [selectedWeight, setSelectedWeight] = useState('500g');
  const [subscribedToast, setSubscribedToast] = useState(false);

  const { addItem } = useCart();
  const { navigateTo } = useNavigation();

  const plans = [
    {
      id: 'frequent' as const,
      name: 'FREQUENT',
      frequency: 'Every 15 Days',
      discount: '18% OFF',
      bestFor: 'Daily coffee households & heavy kaapi lovers (3+ cups/day)',
    },
    {
      id: 'monthly' as const,
      name: 'MONTHLY',
      frequency: 'Every 30 Days',
      discount: '15% OFF',
      popular: true,
      bestFor: 'Our most popular routine for 1–2 everyday morning cups',
    },
    {
      id: 'flexible' as const,
      name: 'FLEXIBLE',
      frequency: 'Every 45 Days',
      discount: '12% OFF',
      bestFor: 'Occasional brewers and weekend coffee enthusiasts',
    },
  ];

  const currentProduct = PRODUCTS.find((p) => p.id === selectedBlend) || PRODUCTS[0];
  const basePrice = currentProduct.weightPrices[selectedWeight] || currentProduct.price;
  const discountRate = selectedPlan === 'frequent' ? 0.18 : selectedPlan === 'monthly' ? 0.15 : 0.12;
  const planDiscount = Math.round(basePrice * discountRate);
  const subscriptionPrice = basePrice - planDiscount;

  const handleStartSubscription = () => {
    // Add to cart as discounted subscription
    addItem(currentProduct, selectedWeight, 1);
    setSubscribedToast(true);
    setTimeout(() => {
      setSubscribedToast(false);
      navigateTo('checkout');
    }, 1200);
  };

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-[#FCFAF6] border-b border-[#DED2C4]/60 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#A66A3F] uppercase tracking-[0.25em] mb-2 font-sans">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Effortless Freshness</span>
          </div>
          <h2 className="heading-section text-[#2B211C] tracking-tight">
            NEVER RUN OUT OF GOOD COFFEE.
          </h2>
          <p className="text-sm sm:text-base text-[#6D625B] mt-2 font-normal">
            "Make your morning ritual effortless." Freshly roasted micro-batches delivered automatically to your door.
          </p>
        </div>

        {/* 3 PLANS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-10 sm:mb-14">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative rounded-2xl p-6 sm:p-7 border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#2A1812] text-white border-[#A66A3F] shadow-warm-lg scale-[1.01]'
                    : 'bg-[#FCFAF6] text-[#2B211C] border-[#DED2C4] hover:border-[#A66A3F]/50 shadow-warm-sm'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#A66A3F] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-warm-sm">
                    Most Popular
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        isSelected ? 'text-[#EFE3D2]' : 'text-[#A66A3F]'
                      }`}
                    >
                      {plan.name}
                    </span>
                    <span
                      className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                        isSelected
                          ? 'bg-[#A66A3F]/20 text-[#EFE3D2] border border-[#A66A3F]/30'
                          : 'bg-[#EFE3D2] text-[#5A3825]'
                      }`}
                    >
                      {plan.discount}
                    </span>
                  </div>

                  <h3
                    className={`font-serif text-2xl font-bold ${
                      isSelected ? 'text-[#FCFAF6]' : 'text-[#2B211C]'
                    }`}
                  >
                    {plan.frequency}
                  </h3>

                  <p
                    className={`text-xs mt-3 leading-relaxed ${
                      isSelected ? 'text-[#F7F1E8]/80' : 'text-[#6D625B]'
                    }`}
                  >
                    {plan.bestFor}
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-current/10 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-[#EFE3D2]' : 'text-[#3D6B4F]'
                      }`}
                    />
                    <span>Automatic doorstep delivery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-[#EFE3D2]' : 'text-[#3D6B4F]'
                      }`}
                    />
                    <span>Priority batch roasted on order</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-[#EFE3D2]' : 'text-[#3D6B4F]'
                      }`}
                    />
                    <span>Free shipping included always</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-[#EFE3D2]' : 'text-[#3D6B4F]'
                      }`}
                    />
                    <span>Pause, swap or cancel anytime</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CUSTOMIZE YOUR RECURRING ORDER BAR */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#DED2C4] shadow-warm-md max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Blend Picker */}
            <div>
              <label className="text-xs font-bold text-[#2B211C] uppercase tracking-wider block mb-2">
                1. Select Coffee Blend
              </label>
              <select
                value={selectedBlend}
                onChange={(e) => setSelectedBlend(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-[#DED2C4] bg-[#F7F1E8] font-semibold text-[#2B211C] focus:outline-none focus:border-[#A66A3F]"
              >
                {PRODUCTS.filter((p) => p.category !== 'Accessories').map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Pack Size */}
            <div>
              <label className="text-xs font-bold text-[#2B211C] uppercase tracking-wider block mb-2">
                2. Select Pack Weight
              </label>
              <select
                value={selectedWeight}
                onChange={(e) => setSelectedWeight(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-[#DED2C4] bg-[#F7F1E8] font-semibold text-[#2B211C] focus:outline-none focus:border-[#A66A3F]"
              >
                {currentProduct.weights.map((w) => (
                  <option key={w} value={w}>
                    {w} ({currentProduct.weightPrices[w] ? `₹${currentProduct.weightPrices[w]}` : ''})
                  </option>
                ))}
              </select>
            </div>

            {/* Subscription CTA & Pricing */}
            <div className="text-center md:text-right space-y-2">
              <div>
                <span className="text-[11px] text-[#6D625B]">Subscription Price:</span>
                <div className="flex items-baseline justify-center md:justify-end gap-2">
                  <span className="font-serif text-2xl font-bold text-[#2A1812]">
                    ₹{subscriptionPrice}
                  </span>
                  <span className="text-xs text-[#6D625B] line-through">₹{basePrice}</span>
                  <span className="text-[11px] font-bold text-[#3D6B4F]">
                    Save ₹{planDiscount}
                  </span>
                </div>
              </div>

              <button
                onClick={handleStartSubscription}
                className="w-full py-3.5 px-6 bg-[#2A1812] text-[#FCFAF6] hover:bg-[#3B2418] rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-warm-md hover:-translate-y-0.5 cursor-pointer"
              >
                <span>{subscribedToast ? 'Adding Subscription...' : 'START MY COFFEE ROUTINE'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
