import React, { useState, useEffect, useRef } from 'react';
import { X, Star, Heart, ShoppingBag, Plus, Minus, ArrowRight, Check, MessageSquare } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useBodyScrollLock } from '../../utils/scrollLock';
import { getDefaultProductVariant, getProductVariantJarImage } from '../../data/products';
import { buildWhatsAppLink, generateProductEnquiryMessage } from '../../config/whatsapp';

export const QuickViewModal: React.FC = () => {
  const { quickViewProduct, quickViewInitialWeight, closeQuickView, navigateTo } = useNavigation();
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [selectedWeight, setSelectedWeight] = useState<string>('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAddedRecently, setIsAddedRecently] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Sync state when product opens: default to 100g if available
  useEffect(() => {
    if (quickViewProduct) {
      const initialWeight =
        quickViewInitialWeight || getDefaultProductVariant(quickViewProduct);
      setSelectedWeight(initialWeight);
      setActiveImageIndex(0);
      setQuantity(1);
      setIsAddedRecently(false);
    }
  }, [quickViewProduct, quickViewInitialWeight]);

  // Lock body scroll with centralized manager
  useBodyScrollLock(Boolean(quickViewProduct), 'quick-view-modal');

  // Focus and Escape key listener
  useEffect(() => {
    if (!quickViewProduct) return;

    const focusTimer = setTimeout(() => {
      closeButtonRef.current?.focus({ preventScroll: true });
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeQuickView();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(focusTimer);
    };
  }, [quickViewProduct, closeQuickView]);

  if (!quickViewProduct) return null;

  const isFavorited = isInWishlist(quickViewProduct.id);
  const currentPrice = quickViewProduct.weightPrices[selectedWeight] || quickViewProduct.price;

  // Resolve dynamic jar packaging based on selected weight
  const activeJarImage = getProductVariantJarImage(quickViewProduct, selectedWeight);
  const activeLabelImage = quickViewProduct.labelImages?.[selectedWeight];

  const lifestyleImages = quickViewProduct.images.filter(
    (img) => !img.includes('-jar.png') && !img.includes('-label.') && img !== activeJarImage
  );

  const galleryImages = [
    activeJarImage,
    ...(activeLabelImage ? [activeLabelImage] : []),
    ...lifestyleImages,
  ];

  const displayImage = galleryImages[activeImageIndex] || activeJarImage;

  const handleAddToCart = () => {
    addItem(quickViewProduct, selectedWeight, quantity);
    setIsAddedRecently(true);
    setTimeout(() => {
      setIsAddedRecently(false);
      closeQuickView();
    }, 1200);
  };

  const handleViewFullPage = () => {
    closeQuickView();
    navigateTo('product-detail', { product: quickViewProduct, variant: selectedWeight });
  };

  const handleWhatsAppEnquiry = () => {
    const msg = generateProductEnquiryMessage(quickViewProduct, selectedWeight, 'en');
    window.open(buildWhatsAppLink(msg), '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-[1000] overflow-y-auto modal-glass-backdrop min-h-full flex items-start sm:items-center justify-center p-3 sm:p-6 py-6 sm:py-8"
      style={{
        background: 'rgba(35, 22, 15, 0.45)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-title"
    >
      {/* Backdrop click dismiss */}
      <div
        className="fixed inset-0"
        onClick={closeQuickView}
        aria-hidden="true"
      />

      {/* SOLID MODAL CONTAINER (Never transparent, high-contrast, responsive) */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative bg-[#FCFAF6] w-full max-w-4xl rounded-3xl overflow-y-auto md:overflow-hidden shadow-[0_24px_80px_rgba(42,24,18,0.24)] border border-[#DED2C4] z-[1010] animate-modal-pop max-h-[90vh] md:max-h-[92vh] flex flex-col md:flex-row my-auto sm:my-auto focus:outline-none overscroll-contain"
      >
        {/* Close Button - Solid, high contrast, 44px min touch target */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={closeQuickView}
          className="absolute top-3.5 right-3.5 z-[1020] w-11 h-11 rounded-full bg-white text-[#2A1812] hover:bg-[#F7F1E8] border border-[#DED2C4] shadow-warm-md flex items-center justify-center transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#8A542F]"
          aria-label="Close Quick View modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT PANEL: IMAGE & GALLERY (50% desktop, solid cream surface) */}
        <div className="w-full md:w-1/2 p-5 sm:p-7 bg-[#F7F1E8] flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#DED2C4]">
          <div>
            {/* Product Media Area */}
            <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-[#F5EFEB] border border-[#DED2C4] shadow-warm-sm flex items-center justify-center p-3">
              <img
                src={displayImage}
                alt={`${quickViewProduct.name} ${selectedWeight}`}
                className="w-full h-full object-contain object-center block transition-all duration-300"
              />
              {quickViewProduct.discount && (
                <span className="absolute top-3 left-3 bg-[#2A1812] text-[#EFE3D2] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-warm-sm">
                  {quickViewProduct.discount}
                </span>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {galleryImages.length > 1 && (
              <div className="flex gap-2.5 mt-4 overflow-x-auto pb-1 no-scrollbar">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-14 h-14 aspect-square rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      activeImageIndex === idx
                        ? 'border-[#2A1812] scale-105 shadow-warm-sm'
                        : 'border-transparent opacity-70 hover:opacity-100 hover:border-[#DED2C4]'
                    }`}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#DED2C4]/70 hidden sm:flex items-center justify-between text-[11px] text-[#765F50]">
            <span>100% Shade-Grown Estate Coffee</span>
            <span className="font-semibold text-[#3D6B4F]">Freshly Roasted Batch</span>
          </div>
        </div>

        {/* RIGHT PANEL: PRODUCT INFORMATION (50% desktop, solid reading surface, crisp contrast) */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 bg-[#FCFAF6] flex flex-col justify-between md:overflow-y-auto md:overscroll-contain">
          <div>
            {/* Category & Roast Strength */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold text-[#8A542F] uppercase tracking-wider">
                {quickViewProduct.category}
              </span>
              {quickViewProduct.strength && (
                <span className="text-[10px] font-semibold text-[#5F5148] bg-[#EFE3D2] px-2.5 py-0.5 rounded-full">
                  {quickViewProduct.strength} Roast
                </span>
              )}
            </div>

            {/* Product Title */}
            <h2
              id="quick-view-title"
              className="font-serif text-2xl sm:text-3xl font-bold text-[#2A1812] leading-tight"
            >
              {quickViewProduct.name}
            </h2>

            {/* Tagline */}
            <p className="text-xs font-medium text-[#765F50] mt-1">
              {quickViewProduct.tagline}
            </p>

            {/* Customer Rating */}
            <div className="flex items-center gap-2 mt-2.5">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-[#A66A3F] text-[#A66A3F]" />
                <span className="text-sm font-bold text-[#2A1812]">{quickViewProduct.rating}</span>
              </div>
              <span className="text-xs text-[#765F50]">
                ({quickViewProduct.reviewCount} customer reviews)
              </span>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-[#5F5148] mt-3.5 leading-[1.6]">
              {quickViewProduct.description}
            </p>

            {/* Pack Size Selector */}
            <div className="mt-5">
              <label className="text-xs font-bold text-[#2A1812] uppercase tracking-wider block mb-2">
                Select Pack Size:
              </label>
              <div className="flex flex-wrap gap-2">
                {quickViewProduct.weights.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => {
                      setSelectedWeight(w);
                      setActiveImageIndex(0);
                    }}
                    className={`text-xs px-3.5 py-2 min-h-[40px] rounded-xl font-medium transition-all cursor-pointer ${
                      selectedWeight === w
                        ? 'bg-[#2A1812] text-[#FCFAF6] font-bold shadow-warm-sm border border-[#2A1812]'
                        : 'bg-white border border-[#DED2C4] text-[#2A1812] hover:bg-[#F7F1E8] hover:border-[#A66A3F]'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Prominent Price Display */}
            <div className="mt-5 flex items-baseline gap-2">
              <span className="font-serif text-2xl sm:text-3xl font-bold text-[#2A1812]">
                ₹{currentPrice * quantity}
              </span>
              {quickViewProduct.originalPrice && (
                <span className="text-sm text-[#765F50]/80 line-through">
                  ₹{quickViewProduct.originalPrice * quantity}
                </span>
              )}
              <span className="text-xs text-[#765F50]">
                (₹{currentPrice} / {selectedWeight})
              </span>
            </div>
          </div>

          {/* ACTION BUTTONS & QUANTITY CONTROLS */}
          <div className="mt-6 pt-4 border-t border-[#DED2C4] space-y-3">
            <div className="flex items-center gap-3">
              {/* Quantity Counter */}
              <div className="flex items-center border border-[#DED2C4] rounded-xl bg-white shadow-warm-xs min-h-[44px]">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2.5 min-w-[38px] hover:bg-[#F7F1E8] rounded-l-xl transition-colors text-[#2A1812] flex items-center justify-center cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 text-xs font-bold text-[#2A1812] min-w-[28px] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2.5 min-w-[38px] hover:bg-[#F7F1E8] rounded-r-xl transition-colors text-[#2A1812] flex items-center justify-center cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* WhatsApp Enquiry Button */}
              <button
                type="button"
                onClick={handleWhatsAppEnquiry}
                className="w-11 h-11 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white border border-[#25D366]/30 flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
                title="Enquire on WhatsApp"
                aria-label="Enquire on WhatsApp"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
              </button>

              {/* Add To Cart Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                className={`flex-1 py-3 px-4 min-h-[44px] rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-warm-sm cursor-pointer hover:-translate-y-0.5 active:translate-y-0 ${
                  isAddedRecently
                    ? 'bg-[#3D6B4F] text-white'
                    : 'bg-[#2A1812] text-[#FCFAF6] hover:bg-[#3B2418]'
                }`}
              >
                {isAddedRecently ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 text-[#A66A3F]" />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={() => toggleWishlist(quickViewProduct)}
                className={`min-w-[44px] min-h-[44px] rounded-xl border border-[#DED2C4] transition-colors flex items-center justify-center cursor-pointer ${
                  isFavorited
                    ? 'bg-[#2A1812] text-rose-500 border-[#2A1812]'
                    : 'bg-white text-[#2A1812] hover:bg-[#F7F1E8]'
                }`}
                aria-label={isFavorited ? 'Remove from wishlist' : 'Save to wishlist'}
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>

            {/* View Full Product Specifications Link */}
            <button
              type="button"
              onClick={handleViewFullPage}
              className="w-full text-center text-xs font-semibold text-[#8A542F] hover:text-[#2A1812] flex items-center justify-center gap-1.5 transition-colors py-1.5 cursor-pointer"
            >
              <span>View Full Product Specifications & Brewing Guide</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
