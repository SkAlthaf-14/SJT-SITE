import React, { useState } from 'react';
import { Star, Flame, Wind, PackageCheck, Award, Plus, Minus, ShoppingBag, Zap, Truck, Check } from 'lucide-react';
import { PRODUCTS, getProductVariantJarImage } from '../../data/products';
import { useCart } from '../../context/CartContext';
import { useNavigation } from '../../context/NavigationContext';

export const SignatureProduct: React.FC = () => {
  const product = PRODUCTS.find((p) => p.id === 'araku-signature-coffee') || PRODUCTS[0];
  const [selectedWeight, setSelectedWeight] = useState<string>('100g');
  const [quantity, setQuantity] = useState<number>(1);
  const [pincode, setPincode] = useState<string>('');
  const [deliveryStatus, setDeliveryStatus] = useState<string | null>(null);
  const [isAddedRecently, setIsAddedRecently] = useState<boolean>(false);

  const { addItem } = useCart();
  const { navigateTo } = useNavigation();

  const currentPrice = product.weightPrices?.[selectedWeight] || product.price;
  const currentJar = getProductVariantJarImage(product, selectedWeight);

  const handleAddToCart = () => {
    addItem(product, selectedWeight, quantity);
    setIsAddedRecently(true);
    setTimeout(() => setIsAddedRecently(false), 1600);
  };

  const handleBuyNow = () => {
    addItem(product, selectedWeight, quantity);
    navigateTo('checkout');
  };

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.length !== 6) {
      setDeliveryStatus('Please enter a valid 6-digit Indian PIN code');
      return;
    }
    setDeliveryStatus('Delivery available in 2–4 business days via Express Courier.');
  };

  const featureIcons = [
    { icon: Wind, title: 'Rich Aroma', desc: 'Warm nutty cocoa fragrance' },
    { icon: Flame, title: 'Bold Flavour', desc: 'Slow roasted to deep caramel' },
    { icon: PackageCheck, title: 'Freshly Packed', desc: 'Sealed with one-way aroma valve' },
    { icon: Award, title: 'Premium Quality', desc: '100% shade-grown mountain estate' },
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-[#FCFAF6] border-b border-[#DED2C4]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-12 border border-[#DED2C4] shadow-warm-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* LEFT: LARGE PRODUCT PACKAGE IMAGE */}
            <div className="lg:col-span-6 relative">
              <div className="relative aspect-[1/1] w-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#F9F6F0] to-[#EFEAE2] border border-[#DED2C4]/60 shadow-warm-sm group p-8 flex items-center justify-center">
                <img
                  src={currentJar}
                  alt={`${product.name} ${selectedWeight} Glass Jar Packaging`}
                  width={500}
                  height={500}
                  loading="lazy"
                  className="w-full h-full object-contain object-center transition-transform duration-700 group-hover:scale-105 filter drop-shadow-[0_16px_24px_rgba(0,0,0,0.2)]"
                />
                <div className="absolute top-4 left-4 bg-[#4A0E17] text-[#D4AF37] border border-[#D4AF37]/40 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-warm-sm">
                  Flagship Blend
                </div>
              </div>
            </div>

            {/* RIGHT: PRODUCT DETAILS & EDITORIAL ACTIONS */}
            <div className="lg:col-span-6 space-y-6">
              {/* Star Rating & Category */}
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-[#A66A3F]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#A66A3F]" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-[#2B211C] uppercase tracking-wider">
                    Premium Everyday Coffee (4.9 / 5.0)
                  </span>
                </div>

                <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#2B211C] mt-2 tracking-tight">
                  SJT Signature Coffee Powder
                </h2>
                <p className="font-serif italic text-lg text-[#A66A3F] mt-1">
                  "Rich Aroma. Deep Flavour. Smooth Finish."
                </p>
              </div>

              {/* Description */}
              <p className="text-sm text-[#6D625B] leading-relaxed font-sans">
                Carefully crafted coffee powder designed to deliver a rich and satisfying cup from the first sip to the last. Single-origin Arabica harmonized with select plantation cherry for robust body and velvety milk integration.
              </p>

              {/* 4 Feature Icons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {featureIcons.map((feat, idx) => {
                  const Icon = feat.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#F7F1E8] border border-[#DED2C4]/60"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#2A1812] flex items-center justify-center text-[#EFE3D2] shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#2B211C]">{feat.title}</h4>
                        <p className="text-[10px] text-[#6D625B]">{feat.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* WEIGHT SELECTOR */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#2B211C] uppercase tracking-wider">
                    Select Pack Weight:
                  </label>
                  <span className="text-xs text-[#A66A3F] font-semibold">
                    {product.chicoryRatio || '85:15 Traditional Ratio'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {product.weights.map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setSelectedWeight(w)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all text-center cursor-pointer ${selectedWeight === w
                          ? 'bg-[#2A1812] text-[#EFE3D2] shadow-warm-sm'
                          : 'bg-[#F7F1E8] text-[#2B211C] border border-[#DED2C4] hover:bg-[#EFE3D2]'
                        }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              {/* PRICE & QUANTITY */}
              <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center justify-between gap-3 pt-2">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-3xl font-extrabold text-[#2B211C]">
                      ₹{currentPrice * quantity}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-[#6D625B] line-through">
                        ₹{(product.originalPrice * (product.weightPrices[selectedWeight] / product.price)) * quantity}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[#6D625B]">
                    Includes all taxes • Free delivery above ₹799
                  </span>
                </div>

                {/* Quantity adjuster */}
                <div className="flex items-center border border-[#DED2C4] rounded-xl bg-[#F7F1E8]">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2.5 hover:bg-[#EFE3D2] rounded-l-xl transition-colors text-[#2B211C] cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3.5 text-xs font-bold text-[#2B211C]">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2.5 hover:bg-[#EFE3D2] rounded-r-xl transition-colors text-[#2B211C] cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  className={`py-3.5 px-6 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 border border-[#2A1812] cursor-pointer shadow-warm-sm ${isAddedRecently
                      ? 'bg-[#3D6B4F] text-white border-[#3D6B4F]'
                      : 'bg-white text-[#2B211C] hover:bg-[#2A1812] hover:text-[#FCFAF6]'
                    }`}
                >
                  {isAddedRecently ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Cart</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 text-[#A66A3F]" />
                      <span>ADD TO CART</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleBuyNow}
                  className="py-3.5 px-6 rounded-xl text-xs font-bold tracking-wider uppercase bg-[#2A1812] text-[#FCFAF6] hover:bg-[#3B2418] transition-all duration-300 flex items-center justify-center gap-2 shadow-warm-md hover:-translate-y-0.5 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-[#A66A3F]" />
                  <span>BUY NOW</span>
                </button>
              </div>

              {/* PINCODE CHECKER */}
              <div className="pt-4 border-t border-[#DED2C4]">
                <form onSubmit={handleCheckPincode} className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <Truck className="w-4 h-4 text-[#6D625B] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter Delivery Pincode"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-[#DED2C4] rounded-xl bg-[#F7F1E8] focus:outline-none focus:border-[#A66A3F]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#EFE3D2] hover:bg-[#2A1812] hover:text-[#FCFAF6] text-[#2B211C] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Check
                  </button>
                </form>
                {deliveryStatus && (
                  <p className="text-[11px] text-[#3D6B4F] font-medium mt-1.5">
                    {deliveryStatus}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
