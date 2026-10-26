import React, { useState, useEffect } from 'react';
import { Star, Heart, Eye, ShoppingBag, Check, ShieldCheck, FileText, X, MessageSquare, Share2 } from 'lucide-react';
import { Product } from '../../types';
import { getDefaultProductVariant, getProductVariantJarImage } from '../../data/products';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useNavigation } from '../../context/NavigationContext';
import { useBodyScrollLock } from '../../utils/scrollLock';
import { buildWhatsAppLink, generateProductEnquiryMessage, generateProductShareMessage } from '../../config/whatsapp';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  // Select 100g by default if that variant exists, per requirement 2.2
  const [selectedWeight, setSelectedWeight] = useState<string>(getDefaultProductVariant(product));
  const [isAddedRecently, setIsAddedRecently] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);

  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { navigateTo } = useNavigation();

  // Keep selected weight in sync if product changes
  useEffect(() => {
    setSelectedWeight(getDefaultProductVariant(product));
  }, [product]);

  // Lock background scroll when label artwork modal is open
  useBodyScrollLock(isLabelModalOpen, 'product-label-modal');

  // Close label modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLabelModalOpen) {
        setIsLabelModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLabelModalOpen]);

  const isFavorited = isInWishlist(product.id);
  const currentPrice = product.weightPrices?.[selectedWeight] || product.price;

  // Resolve dynamic jar image and label artwork based on selected weight
  const currentJarImage = getProductVariantJarImage(product, selectedWeight);
  const currentLabelImage = product.labelImages?.[selectedWeight];
  const currentLabelSvg = product.labelSvgs?.[selectedWeight];

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product, selectedWeight, 1);
    setIsAddedRecently(true);
    setTimeout(() => setIsAddedRecently(false), 1600);
  };

  const handleCardClick = () => {
    navigateTo('product-detail', { product, variant: selectedWeight });
  };

  const handleWhatsAppEnquiry = (e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = generateProductEnquiryMessage(product, selectedWeight, 'en');
    window.open(buildWhatsAppLink(msg), '_blank', 'noopener,noreferrer');
  };

  const handleShareProduct = (e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = generateProductShareMessage(product, selectedWeight, 'en');
    window.open(buildWhatsAppLink(msg), '_blank', 'noopener,noreferrer');
  };

  // Product-specific theme backgrounds
  const getThemeHeader = () => {
    if (product.id.includes('instant')) {
      return {
        badgeBg: 'bg-[#11382B]',
        border: 'border-[#11382B]/25 hover:border-[#11382B]/50',
        accent: 'text-[#D4AF37]',
        pillBg: 'bg-[#11382B]/10 text-[#11382B]',
        jarBgGradient: 'from-[#F7FAF8] via-[#EBF4EF] to-[#E3EFE8]',
      };
    }
    if (product.id.includes('special-blend')) {
      return {
        badgeBg: 'bg-[#3A2016]',
        border: 'border-[#3A2016]/25 hover:border-[#3A2016]/50',
        accent: 'text-[#C5A059]',
        pillBg: 'bg-[#3A2016]/10 text-[#3A2016]',
        jarBgGradient: 'from-[#FAF6F2] via-[#F4EBE3] to-[#EAE0D4]',
      };
    }
    if (product.id.includes('signature')) {
      return {
        badgeBg: 'bg-[#4A0E17]',
        border: 'border-[#4A0E17]/25 hover:border-[#4A0E17]/50',
        accent: 'text-[#D4AF37]',
        pillBg: 'bg-[#4A0E17]/10 text-[#4A0E17]',
        jarBgGradient: 'from-[#FAF4F5] via-[#F6E9EB] to-[#EDE0E3]',
      };
    }
    if (product.id.includes('premium')) {
      return {
        badgeBg: 'bg-[#16181B]',
        border: 'border-[#D7AD36]/40 hover:border-[#D7AD36]/70',
        accent: 'text-[#E5A93C]',
        pillBg: 'bg-[#16181B]/10 text-[#16181B]',
        jarBgGradient: 'from-[#FBF8F2] via-[#F3EDE0] to-[#E9E1D2]',
      };
    }
    return {
      badgeBg: 'bg-[#2A1812]',
      border: 'border-[#DED2C4]',
      accent: 'text-[#A66A3F]',
      pillBg: 'bg-[#F7F1E8] text-[#2B211C]',
      jarBgGradient: 'from-[#F9F6F0] via-[#F4EFE6] to-[#EAE3D6]',
    };
  };

  const theme = getThemeHeader();

  return (
    <>
      <div
        onClick={handleCardClick}
        className={`group relative bg-white rounded-3xl overflow-hidden border ${theme.border} shadow-warm-sm hover:shadow-warm-lg transition-all duration-300 hover:-translate-y-1.5 flex flex-col cursor-pointer`}
      >
        {/* TOP BADGES & WISHLIST */}
        <div className="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5 z-10 flex flex-col gap-1 pointer-events-none">
          {product.discount && (
            <span className={`${theme.badgeBg} text-[#F9F5EB] text-[9.5px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full uppercase tracking-wider shadow-warm-sm border border-white/20`}>
              {product.discount}
            </span>
          )}
          {product.isBestseller && (
            <span className="bg-[#D4AF37] text-[#1A100B] text-[9.5px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full uppercase tracking-wider shadow-warm-sm">
              Bestseller
            </span>
          )}
          {product.isNew && (
            <span className="bg-[#11382B] text-[#D4AF37] text-[9.5px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full uppercase tracking-wider shadow-warm-sm border border-[#D4AF37]/30">
              New Roast
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 backdrop-blur-md cursor-pointer ${
            isFavorited
              ? 'bg-[#2A1812] text-rose-400'
              : 'bg-white/90 text-[#2B211C] hover:bg-white hover:text-rose-500'
          } shadow-warm-sm border border-[#DED2C4]/80`}
          aria-label={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* PRODUCT JAR IMAGE CONTAINER */}
        <div className={`relative w-full min-h-[200px] min-[360px]:min-h-[220px] sm:min-h-[250px] aspect-square bg-gradient-to-b ${theme.jarBgGradient} p-3 min-[380px]:p-4 sm:p-5 flex items-center justify-center`}>
          <div className="relative w-full h-full max-w-[240px] min-[360px]:max-w-[260px] sm:max-w-[280px] flex flex-col items-center justify-center">
            <img
              src={currentJarImage}
              alt={`${product.name} ${selectedWeight} Glass Jar Packaging`}
              width={400}
              height={400}
              className="w-full h-auto max-h-[86%] object-contain object-center block transition-transform duration-300 ease-out group-hover:scale-[1.02]"
              style={{ filter: 'none' }}
              loading="lazy"
            />
            {/* Natural Soft Contact Shadow Beneath Jar Base */}
            <div className="w-[62%] h-2.5 sm:h-3 bg-black/55 rounded-[50%] blur-[4px] -mt-1.5 pointer-events-none" />
            <div className="w-[40%] h-1 sm:h-1.5 bg-black/75 rounded-[50%] blur-[1.5px] -mt-1 pointer-events-none" />
          </div>

          {/* Label Inspection & Quick Actions Action Overlay */}
          <div className="absolute inset-0 bg-[#1A0F0A]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-1.5 pointer-events-none p-3 rounded-t-3xl">
            {currentLabelImage && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLabelModalOpen(true);
                }}
                className="pointer-events-auto px-3 py-1.5 bg-white text-[#201814] text-xs font-bold rounded-full shadow-warm-md hover:bg-[#D4AF37] hover:text-[#160E0A] flex items-center gap-1 transition-colors cursor-pointer"
                title="Inspect 300-DPI label packaging artwork"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Label</span>
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              className="pointer-events-auto px-3 py-1.5 bg-[#24150F] text-[#F9F5EB] text-xs font-bold rounded-full shadow-warm-md hover:bg-[#342017] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Details</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppEnquiry}
              className="pointer-events-auto w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-warm-md hover:bg-[#20BA5A] transition-transform active:scale-90 cursor-pointer"
              title="Enquire on WhatsApp"
              aria-label="Enquire on WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-white" />
            </button>

            <button
              type="button"
              onClick={handleShareProduct}
              className="pointer-events-auto w-8 h-8 rounded-full bg-white text-[#201814] flex items-center justify-center shadow-warm-md hover:bg-[#D4AF37] hover:text-[#160E0A] transition-transform active:scale-90 cursor-pointer"
              title="Share on WhatsApp"
              aria-label="Share on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-white">
          <div>
            {/* Category & Star Rating */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] tracking-widest font-bold uppercase text-[#B77943]">
                {product.category}
              </span>
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-[#D7AD36] text-[#D7AD36]" />
                <span className="text-xs font-bold text-[#202124]">{product.rating}</span>
                <span className="text-[11px] text-[#7A6E65]">({product.reviewCount})</span>
              </div>
            </div>

            {/* Product Name (Fixed min-height & line-clamp-2 so titles never truncate with ellipses) */}
            <h3 className="font-serif text-base sm:text-lg font-bold text-[#28170F] group-hover:text-[#B77943] transition-colors leading-snug min-h-[2.85rem] line-clamp-2">
              {product.name}
            </h3>

            {/* Short Description */}
            <p className="text-xs text-[#7A6E65] line-clamp-2 min-h-[2.25rem] mt-1 leading-relaxed">
              {product.description}
            </p>

            {/* Verified Blend & Ingredients Badge */}
            <div className="mt-2.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EFE3D2]/70 border border-[#DED2C4] text-[10.5px] font-semibold text-[#28170F]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#123D2F] shrink-0" />
                <span>{product.verifiedBlendRatio || product.chicoryRatio || '100% Arabica'}</span>
              </div>
            </div>

            {/* Flagged notice if present */}
            {product.flaggedNotice && (
              <div className="mt-1.5 flex items-center gap-1 text-[9.5px] text-[#B77943] bg-[#EFE3D2]/40 rounded-md px-2 py-0.5 border border-[#DED2C4]/60">
                <span className="font-bold">ⓘ</span>
                <span className="truncate">Draft formulation under owner confirmation</span>
              </div>
            )}
          </div>

          {/* DYNAMIC WEIGHT & PRICE SELECTOR */}
          <div className="mt-4 pt-3 border-t border-[#DED2C4]">
            {/* Size options label */}
            <div className="flex items-center justify-between text-[11px] mb-2">
              <span className="font-bold text-[#28170F] uppercase tracking-wider text-[10px]">
                Select Jar Size:
              </span>
              <span className="text-[10.5px] text-[#123D2F] font-semibold">
                ● In Stock ({product.stock} units)
              </span>
            </div>

            {/* Three size buttons (50g, 100g, 250g) with active state */}
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {product.weights.map((w) => {
                const isSelected = selectedWeight === w;
                const priceForWeight = product.weightPrices?.[w] || product.price;
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedWeight(w);
                    }}
                    className={`py-1.5 px-1 min-[360px]:px-2 rounded-xl text-center transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-[#28170F] text-[#F8F4EC] font-bold shadow-warm-sm ring-2 ring-[#D7AD36]/80'
                        : 'bg-white text-[#28170F] hover:bg-[#EFE3D2] font-medium border border-[#DED2C4]'
                    }`}
                  >
                    <span className="text-[11px] block font-sans font-bold leading-tight">{w}</span>
                    <span className={`text-[10px] block font-mono ${isSelected ? 'text-[#D7AD36]' : 'text-[#7A6E65]'}`}>
                      ₹{priceForWeight}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Price & Add to Cart Action */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-serif text-xl sm:text-2xl font-extrabold text-[#28170F]">
                    ₹{currentPrice}
                  </span>
                  {product.originalPrice && (
                    <span className="text-xs text-[#7A6E65] line-through font-mono">
                      ₹{Math.round(product.originalPrice * (currentPrice / product.price))}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[#7A6E65] font-medium block">Glass Jar • {selectedWeight}</span>
              </div>

              {/* ACTIONS: WHATSAPP ENQUIRY & ADD TO CART */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleWhatsAppEnquiry}
                  className="w-10 h-10 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white border border-[#25D366]/30 flex items-center justify-center transition-all active:scale-90 cursor-pointer shrink-0"
                  title="Enquire on WhatsApp"
                  aria-label="Enquire on WhatsApp"
                >
                  <MessageSquare className="w-4 h-4 fill-current" />
                </button>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`px-3.5 sm:px-4 py-2.5 min-h-[42px] rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-warm-sm shrink-0 ${
                    isAddedRecently
                      ? 'bg-[#123D2F] text-white'
                      : 'bg-[#28170F] text-[#F8F4EC] hover:bg-[#3A2117] border border-[#D7AD36]/30'
                  }`}
                >
                  {isAddedRecently ? (
                    <>
                      <Check className="w-4 h-4 animate-scale-in" />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5 text-[#D7AD36]" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FULL-PANORAMIC LABEL ARTWORK MODAL */}
      {isLabelModalOpen && currentLabelImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/80 backdrop-blur-sm p-3 sm:p-6"
          onClick={() => setIsLabelModalOpen(false)}
        >
          <div className="min-h-full flex items-start sm:items-center justify-center py-4 sm:py-6">
            <div
              className="bg-[#1C120C] rounded-3xl max-w-4xl w-full border border-[#D4AF37]/50 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-[#D4AF37]/30 flex items-center justify-between bg-[#24150F]">
                <div>
                  <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block">
                    300 DPI Official Print-Ready Artwork
                  </span>
                  <h3 className="font-serif text-lg font-bold text-white">
                    {product.name} — {selectedWeight} Label Packaging
                  </h3>
                </div>
                <button
                  onClick={() => setIsLabelModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Label Image View */}
              <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1 flex flex-col items-center justify-center bg-[#100A07]">
                <img
                  src={currentLabelImage}
                  alt={`${product.name} Full Label Artwork`}
                  className="w-full max-h-[500px] object-contain rounded-xl border border-[#D4AF37]/30 shadow-lg"
                />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 w-full text-xs text-[#EFE3D2]/80">
                  <span>Standard Dimensions: 160mm × 80mm @ 300 DPI</span>
                  <div className="flex gap-2">
                    {currentLabelSvg && (
                      <a
                        href={currentLabelSvg}
                        download
                        className="px-3 py-1.5 bg-[#2A1812] hover:bg-[#3B2418] text-[#D4AF37] border border-[#D4AF37]/40 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Download SVG
                      </a>
                    )}
                    <a
                      href={currentLabelImage}
                      download
                      className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#C5A059] text-[#160E0A] rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Download PNG (300 DPI)
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
