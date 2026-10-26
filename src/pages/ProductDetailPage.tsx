import React, { useState, useEffect } from 'react';
import {
  Star,
  Heart,
  ShoppingBag,
  Zap,
  Truck,
  ShieldCheck,
  Check,
  ChevronRight,
  MessageSquare,
  Share2,
  Copy,
  ExternalLink,
  Languages,
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { PRODUCTS, getDefaultProductVariant, isValidProductVariant, getProductVariantJarImage } from '../data/products';
import { ProductCard } from '../components/common/ProductCard';
import {
  buildWhatsAppLink,
  generateProductEnquiryMessage,
  generateProductShareMessage,
  getProductCanonicalUrl,
  WhatsAppLanguage,
  WHATSAPP_CONFIG,
} from '../config/whatsapp';

export const ProductDetailPage: React.FC = () => {
  const { currentProduct, currentVariant, setCurrentVariant, navigateTo } = useNavigation();
  const product = currentProduct || PRODUCTS[0];

  // Default selection: 100g if available, or variant from URL parameter/context
  const initialWeight =
    currentVariant && isValidProductVariant(product, currentVariant)
      ? currentVariant
      : getDefaultProductVariant(product);

  const [selectedWeight, setSelectedWeight] = useState<string>(initialWeight);
  const [selectedImage, setSelectedImage] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'description' | 'ingredients' | 'brewing' | 'packaging' | 'shipping' | 'reviews'>('description');
  const [pincode, setPincode] = useState<string>('');
  const [pincodeStatus, setPincodeStatus] = useState<string | null>(null);
  const [isAddedRecently, setIsAddedRecently] = useState(false);
  const [waLanguage, setWaLanguage] = useState<WhatsAppLanguage>('en');
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync state when active product or URL variant changes
  useEffect(() => {
    const validWeight =
      currentVariant && isValidProductVariant(product, currentVariant)
        ? currentVariant
        : getDefaultProductVariant(product);
    setSelectedWeight(validWeight);
    setSelectedImage(0);
  }, [product, currentVariant]);

  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const isFavorited = isInWishlist(product.id);
  const currentPrice = product.weightPrices?.[selectedWeight] || product.price;

  // Resolve dynamic jar mockup and label artwork based on active size
  const activeJarImage = getProductVariantJarImage(product, selectedWeight);
  const activeLabelImage = product.labelImages?.[selectedWeight];
  const activeLabelSvg = product.labelSvgs?.[selectedWeight];

  // Dynamic gallery list: always display the selected variant's jar first,
  // followed by its corresponding label artwork, and general lifestyle/farm photos.
  // Exclude all other variant jars and labels so thumbnails never show competing sizes.
  const lifestyleImages = product.images.filter(
    (img) => !img.includes('-jar.png') && !img.includes('-label.') && img !== activeJarImage
  );

  const galleryImages = [
    activeJarImage,
    ...(activeLabelImage ? [activeLabelImage] : []),
    ...lifestyleImages,
  ];

  const displayImage = galleryImages[selectedImage] || activeJarImage;

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
      setPincodeStatus('Please enter a valid 6-digit Indian PIN code');
      return;
    }
    setPincodeStatus(`Available! Fast dispatch in 24 hours. Express courier to ${pincode}.`);
  };

  const handleSelectWeight = (w: string) => {
    setSelectedWeight(w);
    setCurrentVariant(w);
    setSelectedImage(0); // Show matching jar immediately
    if (typeof window !== 'undefined') {
      const newHash = `product/${product.slug}?variant=${encodeURIComponent(w)}`;
      if (window.location.hash !== `#${newHash}`) {
        window.history.replaceState(null, '', `#${newHash}`);
      }
    }
  };

  const handleWhatsAppEnquiry = () => {
    const msg = generateProductEnquiryMessage(product, selectedWeight, waLanguage);
    const link = buildWhatsAppLink(msg);
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const handleWhatsAppShare = () => {
    const msg = generateProductShareMessage(product, selectedWeight, waLanguage);
    const link = buildWhatsAppLink(msg);
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const handleCopyProductLink = async () => {
    const canonicalUrl = getProductCanonicalUrl(product, selectedWeight);
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `SJT FARMS — ${product.name} (${selectedWeight})`,
          text: `Check out ${product.name} (${selectedWeight}) at SJT FARMS for ₹${currentPrice}:`,
          url: canonicalUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(canonicalUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const recommendations = PRODUCTS.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="bg-[#FCFAF6] min-h-screen py-8 sm:py-16 pb-28 lg:pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* BREADCRUMB */}
        <nav className="flex items-center gap-2 text-xs text-[#6D625B] mb-8 font-medium">
          <button onClick={() => navigateTo('home')} className="hover:text-[#2B211C] cursor-pointer">
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <button onClick={() => navigateTo('shop')} className="hover:text-[#2B211C] cursor-pointer">
            Shop
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#A66A3F] font-semibold">{product.name}</span>
        </nav>

        {/* MAIN PRODUCT DETAIL SECTION */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 lg:p-12 border border-[#DED2C4] shadow-warm-md mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            {/* LEFT: LARGE PRODUCT GALLERY */}
            <div className="lg:col-span-6 space-y-4">
              <div className="relative aspect-[1/1] w-full rounded-3xl overflow-hidden bg-gradient-to-b from-[#F9F6F0] to-[#EFEAE2] border border-[#DED2C4] group shadow-warm-sm p-6 sm:p-10 flex items-center justify-center">
                <img
                  src={displayImage}
                  alt={`${product.name} ${selectedWeight}`}
                  width={600}
                  height={600}
                  className="w-full h-full object-contain object-center transition-transform duration-500 ease-out group-hover:scale-105 filter drop-shadow-[0_16px_24px_rgba(0,0,0,0.2)]"
                />

                {product.discount && (
                  <span className="absolute top-4 left-4 bg-[#2A1812] text-[#EFE3D2] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-warm-sm">
                    {product.discount}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-md cursor-pointer border border-[#DED2C4]/60 ${
                    isFavorited
                      ? 'bg-[#2A1812] text-rose-500'
                      : 'bg-white/80 text-[#2B211C] hover:bg-white'
                  } shadow-warm-sm`}
                  aria-label="Wishlist"
                >
                  <Heart className={`w-5 h-5 ${isFavorited ? 'fill-rose-500' : ''}`} />
                </button>
              </div>

              {/* Thumbnails */}
              {galleryImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer p-1 bg-[#F9F6F0] ${
                        selectedImage === idx
                          ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/40 scale-105 shadow-warm-sm'
                          : 'border-[#DED2C4] opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: PRODUCT INFORMATION */}
            <div className="lg:col-span-6 space-y-6">
              {/* 1. Title & Roasting Level */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-[#A66A3F] uppercase tracking-wider">
                    {product.category}
                  </span>
                  <span className="text-[10px] text-[#2B211C] bg-[#EFE3D2] px-2.5 py-0.5 rounded-full font-semibold">
                    {product.roastLevel}
                  </span>
                  {product.isBestseller && (
                    <span className="text-[10px] bg-[#D4AF37] text-[#160E0A] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Bestseller
                    </span>
                  )}
                </div>

                <h1 className="heading-section text-[#2B211C]">
                  {product.name}
                </h1>
                <p className="font-serif italic text-base sm:text-lg text-[#A66A3F] mt-1">
                  "{product.tagline}"
                </p>

                {/* Rating */}
                <div className="flex items-center gap-2 mt-2.5">
                  <div className="flex items-center text-[#D4AF37]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#D4AF37]" />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-[#2B211C]">{product.rating}</span>
                  <span className="text-xs text-[#6D625B]">
                    ({product.reviewCount} verified reviews)
                  </span>
                </div>
              </div>

              {/* 2. Verified Formulation Badge */}
              <div className="p-3 bg-[#F7F1E8] rounded-2xl border border-[#DED2C4] flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[#3D6B4F] shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-[#2B211C] block">Verified Estate Formulation</span>
                  <span className="text-[#6D625B]">{product.verifiedBlendRatio || product.chicoryRatio}</span>
                </div>
              </div>

              {/* Flagged notice if present */}
              {product.flaggedNotice && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900">
                  <span className="font-bold block mb-0.5">⚠️ Formulation Verification Note:</span>
                  <span>{product.flaggedNotice}</span>
                </div>
              )}

              {/* 3. Price Card Display */}
              <div className="p-4 bg-[#F9F6F0] rounded-2xl border border-[#DED2C4] flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-3xl font-extrabold text-[#2A1812]">
                      ₹{currentPrice * quantity}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-[#6D625B] line-through">
                        ₹{Math.round(product.originalPrice * (currentPrice / product.price)) * quantity}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#6D625B]">
                    Includes all taxes • Free shipping on orders over ₹799
                  </span>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-[#3D6B4F]/10 text-[#3D6B4F] border border-[#3D6B4F]/30 rounded-xl shrink-0">
                  ● In Stock ({product.stock})
                </span>
              </div>

              {/* 4. Description */}
              <p className="text-sm text-[#6D625B] leading-relaxed font-sans">
                {product.longDescription}
              </p>

              {/* 5. Pack Weight Selector (50g, 100g, 250g) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#2B211C] uppercase tracking-wider">
                    Select Glass Jar Pack Size:
                  </label>
                  <span className="text-xs text-[#A66A3F] font-semibold">
                    Net Weight: {selectedWeight}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {product.weights.map((w) => {
                    const isSelected = selectedWeight === w;
                    const priceForWeight = product.weightPrices?.[w] || product.price;
                    return (
                      <button
                        key={w}
                        type="button"
                        onClick={() => handleSelectWeight(w)}
                        className={`py-3 px-3 min-h-[44px] rounded-2xl text-xs font-semibold transition-all active:scale-95 text-center cursor-pointer ${
                          isSelected
                            ? 'bg-[#2A1812] text-[#FCFAF6] shadow-warm-md ring-2 ring-[#D4AF37]/80 font-bold scale-[1.02]'
                            : 'bg-[#FCFAF6] text-[#2B211C] border border-[#DED2C4] hover:bg-[#F7F1E8]'
                        }`}
                      >
                        <span className="block text-sm">{w}</span>
                        <span className={`block text-[11px] mt-0.5 ${isSelected ? 'text-[#D4AF37]' : 'text-[#8A796E]'}`}>
                          ₹{priceForWeight}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 6. Quantity Adjuster */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-[#2B211C] uppercase tracking-wider">
                  Quantity:
                </span>
                <div className="flex items-center border border-[#DED2C4] rounded-xl bg-[#FCFAF6]">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-[#F7F1E8] rounded-l-xl transition-colors text-[#2B211C] cursor-pointer min-w-[40px]"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="px-4 text-xs font-bold text-[#2B211C]">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 hover:bg-[#F7F1E8] rounded-r-xl transition-colors text-[#2B211C] cursor-pointer min-w-[40px]"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 7. Action Buttons: Add to Cart & Buy Now */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  className={`py-4 px-6 min-h-[48px] rounded-2xl text-xs font-bold tracking-wider uppercase transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 border border-[#2A1812] cursor-pointer shadow-warm-sm ${
                    isAddedRecently
                      ? 'bg-[#3D6B4F] text-white border-[#3D6B4F]'
                      : 'bg-white text-[#2B211C] hover:bg-[#2A1812] hover:text-[#FCFAF6]'
                  }`}
                >
                  {isAddedRecently ? (
                    <>
                      <Check className="w-4 h-4 animate-scale-in" />
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
                  className="py-4 px-6 min-h-[48px] rounded-2xl text-xs font-bold tracking-wider uppercase bg-[#2A1812] text-[#FCFAF6] hover:bg-[#3B2418] transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 shadow-warm-md hover:-translate-y-0.5 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-[#D4AF37]" />
                  <span>BUY NOW</span>
                </button>
              </div>

              {/* 8. WHATSAPP ENQUIRY & PRODUCT SHARING SECTION */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#0F2920] to-[#16382B] text-[#F9F5EB] border border-[#D4AF37]/35 shadow-warm-md space-y-3.5">
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xs">
                      <MessageSquare className="w-4 h-4 fill-white" />
                    </div>
                    <div>
                      <h4 className="font-serif text-xs sm:text-sm font-bold text-white tracking-wide">
                        WhatsApp Concierge & Sharing
                      </h4>
                      <span className="text-[10px] text-[#D4AF37]">
                        Direct estate support • +91 81210 20111
                      </span>
                    </div>
                  </div>

                  {/* Language Selector (English / తెలుగు) */}
                  <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/15">
                    <button
                      type="button"
                      onClick={() => setWaLanguage('en')}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                        waLanguage === 'en'
                          ? 'bg-[#D4AF37] text-[#160E0A] shadow-xs'
                          : 'text-[#F9F5EB]/80 hover:text-white'
                      }`}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      onClick={() => setWaLanguage('te')}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                        waLanguage === 'te'
                          ? 'bg-[#D4AF37] text-[#160E0A] shadow-xs'
                          : 'text-[#F9F5EB]/80 hover:text-white'
                      }`}
                    >
                      తెలుగు
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-[#F9F5EB]/85 leading-relaxed">
                  {waLanguage === 'te'
                    ? `ఈ ఉత్పత్తి (${product.name} — ${selectedWeight}, ₹${currentPrice}) గురించి మా కాఫీ నిపుణులతో నేరుగా వాట్సాప్‌లో మాట్లాడండి లేదా మిత్రులతో షేర్ చేయండి:`
                    : `Enquire directly with SJT Farms roasters on WhatsApp for ${product.name} (${selectedWeight} at ₹${currentPrice}) or share with coffee enthusiasts:`}
                </p>

                {/* WhatsApp Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleWhatsAppEnquiry}
                    className="py-2.5 px-3 bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <MessageSquare className="w-3.5 h-3.5 fill-white" />
                    <span>{waLanguage === 'te' ? 'వాట్సాప్‌లో అడగండి' : 'Enquire on WhatsApp'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    className="py-2.5 px-3 bg-[#11382B] hover:bg-[#0A241C] text-[#D4AF37] border border-[#D4AF37]/50 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{waLanguage === 'te' ? 'షేర్ చేయండి' : 'Share on WhatsApp'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyProductLink}
                    className="py-2.5 px-3 bg-white/10 hover:bg-white/20 text-[#F9F5EB] border border-white/20 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#25D366]" />
                        <span>Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Share Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 9. PINCODE CHECKER */}
              <div className="pt-2 border-t border-[#DED2C4]">
                <form onSubmit={handleCheckPincode} className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <Truck className="w-4 h-4 text-[#6D625B] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter Delivery Pincode"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-[#DED2C4] rounded-xl bg-[#FCFAF6] focus:outline-none focus:border-[#A66A3F]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#EFE3D2] hover:bg-[#2A1812] hover:text-[#FCFAF6] text-[#2B211C] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Check
                  </button>
                </form>
                {pincodeStatus && (
                  <p className="text-[11px] text-[#3D6B4F] font-medium mt-1.5">
                    {pincodeStatus}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* TABS SECTION */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#DED2C4] shadow-warm-sm mb-16">
          <div className="flex border-b border-[#DED2C4] overflow-x-auto gap-2 sm:gap-6 pb-2 no-scrollbar">
            {[
              { id: 'description', label: 'Full Description' },
              { id: 'ingredients', label: 'Ingredients & Ratio' },
              { id: 'brewing', label: 'Brewing Instructions' },
              { id: 'packaging', label: 'Packaging & 300 DPI Label' },
              { id: 'shipping', label: 'Shipping & Freshness' },
              { id: 'reviews', label: `Reviews (${product.reviewCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-3 text-xs sm:text-sm font-bold tracking-wide uppercase transition-all whitespace-nowrap border-b-2 cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-[#D4AF37] text-[#2A1812]'
                    : 'border-transparent text-[#6D625B] hover:text-[#2B211C]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="pt-6 text-xs sm:text-sm text-[#6D625B] leading-relaxed">
            {activeTab === 'description' && (
              <div className="space-y-4">
                <p>{product.longDescription}</p>
                <p>
                  SJT Farms coffee is cultivated using traditional agroforestry methods in Araku Valley. The intercropping with pepper vines, cardamom, and silver oaks imparts a nuanced richness that cannot be replicated in mechanized full-sun farming.
                </p>
              </div>
            )}

            {activeTab === 'ingredients' && (
              <div className="space-y-3">
                <p className="font-semibold text-[#2B211C]">Ingredients Declaration:</p>
                <p>{product.ingredients}</p>
                <p className="font-semibold text-[#2B211C] mt-4">Verified Blend Ratio:</p>
                <p>{product.verifiedBlendRatio || product.chicoryRatio || '100% Pure Coffee Beans (Arabica)'}</p>
                {product.flaggedNotice && (
                  <p className="text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200 mt-2">
                    ⓘ {product.flaggedNotice}
                  </p>
                )}
              </div>
            )}

            {activeTab === 'brewing' && (
              <div className="space-y-3">
                <p className="font-semibold text-[#2B211C]">Recommended Preparation Steps:</p>
                <ol className="list-decimal pl-5 space-y-2">
                  {(product.preparationInstructions || [
                    'Add 1–2 tsp of coffee powder into your brewer',
                    'Pour boiling water and steep/extract',
                    'Enjoy piping hot with or without milk'
                  ]).map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
                <p className="mt-4 font-semibold text-[#2B211C]">Storage Instructions:</p>
                <p>{product.storageInstructions || 'Keep the jar tightly closed after opening. Store in a cool, dry place away from direct sunlight.'}</p>
              </div>
            )}

            {activeTab === 'packaging' && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-serif text-base font-bold text-[#2B211C]">
                    Physical Glass Jar & 300 DPI Label Artwork ({selectedWeight})
                  </h4>
                  <p className="text-xs text-[#6D625B] mt-1">
                    Standard packaging dimensions: 160 mm × 80 mm at 300 DPI physical print density.
                  </p>
                </div>

                {activeLabelImage && (
                  <div className="bg-[#1C120C] p-4 sm:p-6 rounded-2xl border border-[#D4AF37]/40 flex flex-col items-center">
                    <img
                      src={activeLabelImage}
                      alt={`${product.name} ${selectedWeight} Label Artwork`}
                      className="w-full max-h-[380px] object-contain rounded-xl shadow-lg border border-[#D4AF37]/30"
                    />
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 w-full text-xs text-[#EFE3D2]">
                      <span>{selectedWeight} Variant Label Artwork • 300 DPI</span>
                      <div className="flex gap-2">
                        {activeLabelSvg && (
                          <a
                            href={activeLabelSvg}
                            download
                            className="px-3 py-1.5 bg-[#2A1812] hover:bg-[#3B2418] text-[#D4AF37] border border-[#D4AF37]/50 rounded-lg text-xs font-semibold"
                          >
                            Download Vector SVG
                          </a>
                        )}
                        <a
                          href={activeLabelImage}
                          download
                          className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#C5A059] text-[#160E0A] rounded-lg text-xs font-bold"
                        >
                          Download Print PNG
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-3">
                <p className="font-semibold text-[#2B211C]">Dispatch & Packaging Standards:</p>
                <p>{product.shippingInfo}</p>
                <p>
                  Free delivery across India on all orders above ₹799. Packed in shatterproof bubble wrap and eco-friendly SJT craft presentation box.
                </p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                  <span className="font-bold text-[#2B211C]">{product.rating} out of 5.0</span>
                  <span>({product.reviewCount} customer ratings)</span>
                </div>
                <p>
                  "The aroma when opening the gold-lid glass jar is breathtaking. Authentic Araku flavor with rich crema. Unbeatable everyday ritual." — Verified Customer
                </p>
              </div>
            )}
          </div>
        </div>

        {/* YOU MAY ALSO LIKE */}
        <div>
          <h3 className="heading-section text-[#2B211C] mb-8">
            YOU MAY ALSO LIKE
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.map((rec) => (
              <ProductCard key={rec.id} product={rec} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
