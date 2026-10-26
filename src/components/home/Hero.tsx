import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Flame,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Compass,
  Check,
} from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useCart } from '../../context/CartContext';
import { COFFEE_PRODUCTS, getProductVariantJarImage } from '../../data/products';
import { Product } from '../../types';

export const Hero: React.FC = () => {
  const { navigateTo } = useNavigation();
  const { addItem, setIsDrawerOpen } = useCart();

  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  const TOTAL_SLIDES = 5;
  const AUTOPLAY_INTERVAL = 6000; // 6 seconds

  // Products from catalogue
  const instantProduct = COFFEE_PRODUCTS.find((p) => p.id === 'araku-instant-coffee-powder') || COFFEE_PRODUCTS[0];
  const specialProduct = COFFEE_PRODUCTS.find((p) => p.id === 'araku-special-blend-filter-coffee') || COFFEE_PRODUCTS[1];
  const signatureProduct = COFFEE_PRODUCTS.find((p) => p.id === 'araku-signature-coffee' || p.id === 'araku-signature-coffee-powder') || COFFEE_PRODUCTS[2];
  const premiumProduct = COFFEE_PRODUCTS.find((p) => p.id === 'araku-premium-coffee' || p.id === 'araku-premium-coffee-powder') || COFFEE_PRODUCTS[3];

  // Dynamic weight selector state for each of the 4 product campaign slides (default 100g)
  const [selectedWeights, setSelectedWeights] = useState<Record<string, string>>({
    [instantProduct.id]: '100g',
    [specialProduct.id]: '100g',
    [signatureProduct.id]: '100g',
    [premiumProduct.id]: '100g',
  });

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % TOTAL_SLIDES);
  }, [TOTAL_SLIDES]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + TOTAL_SLIDES) % TOTAL_SLIDES);
  }, [TOTAL_SLIDES]);

  // Autoplay with pause on hover, keyboard focus, tab visibility, and prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (isPaused) {
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }

    const timer = setInterval(() => {
      nextSlide();
    }, AUTOPLAY_INTERVAL);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPaused, nextSlide]);

  const navScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active product-family pill into view within its horizontal container ONLY.
  // CRITICAL MOBILE FIX: Never call DOM scrollIntoView on activeBtn because that forces all
  // ancestor containers up to window/document to scroll downward every 6 seconds on mobile!
  // Instead, compute the relative horizontal offset and scroll ONLY navScrollRef.current horizontally.
  useEffect(() => {
    const container = navScrollRef.current;
    if (!container) return;
    const activeBtn = container.querySelector<HTMLButtonElement>(`[data-slide-index="${currentSlide}"]`);
    if (!activeBtn) return;

    // Calculate horizontal offset strictly relative to the pill bar container
    const containerRect = container.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    const relativeLeft = btnRect.left - containerRect.left;
    const targetScrollLeft = container.scrollLeft + relativeLeft - (container.clientWidth / 2) + (activeBtn.clientWidth / 2);

    container.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior: 'smooth',
    });
  }, [currentSlide]);

  // Preload all 5 hero background images to prevent flashes or blank frames
  useEffect(() => {
    const urls = [
      '/images/hero/slide1_araku_estate_hero.jpg',
      '/images/hero/slide2_instant_studio.jpg',
      '/images/hero/slide3_special_blend_studio.jpg',
      '/images/hero/slide4_signature_studio.jpg',
      '/images/hero/slide5_premium_studio.jpg',
    ];
    urls.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') prevSlide();
    if (e.key === 'ArrowRight') nextSlide();
  };

  // Touch / Swipe gestures with vertical scroll protection
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (
      touchStartX.current === null ||
      touchEndX.current === null ||
      touchStartY.current === null ||
      touchEndY.current === null
    ) {
      touchStartX.current = null;
      touchStartY.current = null;
      touchEndX.current = null;
      touchEndY.current = null;
      return;
    }

    const deltaX = touchStartX.current - touchEndX.current;
    const deltaY = touchStartY.current - touchEndY.current;

    // Reset coordinates immediately
    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    touchEndY.current = null;

    // SCROLL SAFETY: If vertical movement was greater than horizontal, user was scrolling down the page!
    // Never hijack vertical scrolling!
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      return;
    }

    // Require distinct horizontal gesture (at least 60px and 1.5x larger than any vertical drift)
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX > 0) nextSlide();
      else prevSlide();
    }
  };

  const scrollToCollection = () => {
    const el = document.getElementById('coffee-collection-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    else navigateTo('shop');
  };

  const handleWeightSelect = (productId: string, weight: string) => {
    setSelectedWeights((prev) => ({
      ...prev,
      [productId]: weight,
    }));
  };

  const handleQuickAdd = (product: Product) => {
    const weight = selectedWeights[product.id] || '100g';
    addItem(product, weight, 1);
    setIsDrawerOpen(true);
    setAddedNotice(product.id);
    setTimeout(() => setAddedNotice(null), 2500);
  };

  const handleOpenDetail = (product: Product) => {
    const weight = selectedWeights[product.id] || '100g';
    navigateTo('product-detail', { product, variant: weight });
  };

  // Slide configuration definitions
  const slides = [
    {
      index: 0,
      title: 'The True Taste of Araku',
      navLabel: 'Araku Estate',
      type: 'brand',
      mobileDescription: 'Single-origin coffee hand-harvested from high-altitude plantations in Araku Valley.',
      theme: {
        bgImage: '/images/hero/slide1_araku_estate_hero.jpg',
        badgeBg: 'bg-[#28170F]/90 border-[#D7AD36]/60 text-[#F8F4EC]',
        accentGold: 'text-[#D7AD36]',
        primaryBtn: 'bg-[#D7AD36] hover:bg-[#C49B28] text-[#160E0A] border border-[#D7AD36]/60',
        activePill: 'bg-[#D7AD36] text-[#160E0A] border-[#D7AD36]',
        inactivePill: 'bg-[#160E0A]/80 hover:bg-[#28170F] text-[#F8F4EC]/80 border-[#DED2C4]/30',
        gradientOverlay: 'from-[#160E0A]/95 via-[#160E0A]/75 to-transparent',
        ambientGlow: 'rgba(215, 173, 54, 0.22)',
      },
    },
    {
      index: 1,
      title: 'Araku Instant Coffee Powder',
      navLabel: 'Instant (100% Arabica)',
      product: instantProduct,
      type: 'product',
      theme: {
        bgImage: '/images/hero/slide2_instant_studio.jpg',
        badgeBg: 'bg-[#123D2F]/90 border-[#D7AD36]/60 text-[#F8F4EC]',
        accentGold: 'text-[#D7AD36]',
        primaryBtn: 'bg-[#123D2F] hover:bg-[#0D2E24] text-[#F8F4EC] border border-[#D7AD36]/60',
        activePill: 'bg-[#123D2F] text-[#F8F4EC] border-[#D7AD36] ring-1 ring-[#D7AD36]',
        inactivePill: 'bg-[#160E0A]/80 hover:bg-[#28170F] text-[#F8F4EC]/80 border-[#DED2C4]/30',
        gradientOverlay: 'from-[#0A1A14]/95 via-[#0A1A14]/80 to-transparent',
        ambientGlow: 'rgba(18, 61, 47, 0.35)',
      },
      eyebrow: 'ESTATE GROWN • ZERO CHICORY',
      headline: 'Your Perfect Cup. Made Effortless.',
      description:
        'Expertly crafted instant coffee powder capturing the pure mountain aroma and velvety caramel notes of single-origin Araku Arabica.',
      mobileDescription:
        '100% pure single-origin Arabica instant coffee with velvety caramel notes and zero chicory.',
      prices: instantProduct.weightPrices || { '50g': 99, '100g': 199, '250g': 479 },
      ratioBadge: '100% Pure Arabica • 0% Chicory',
    },
    {
      index: 2,
      title: 'Araku Special Blend Coffee Powder',
      navLabel: 'Special Blend Filter',
      product: specialProduct,
      type: 'product',
      theme: {
        bgImage: '/images/hero/slide3_special_blend_studio.jpg',
        badgeBg: 'bg-[#28170F]/90 border-[#B77943]/60 text-[#F8F4EC]',
        accentGold: 'text-[#B77943]',
        primaryBtn: 'bg-[#28170F] hover:bg-[#3A2117] text-[#F8F4EC] border border-[#B77943]/60',
        activePill: 'bg-[#28170F] text-[#F8F4EC] border-[#B77943] ring-1 ring-[#B77943]',
        inactivePill: 'bg-[#160E0A]/80 hover:bg-[#28170F] text-[#F8F4EC]/80 border-[#DED2C4]/30',
        gradientOverlay: 'from-[#1A0E08]/95 via-[#1A0E08]/80 to-transparent',
        ambientGlow: 'rgba(183, 121, 67, 0.30)',
      },
      eyebrow: 'TRADITIONAL FILTER KAAPI • ZERO CHICORY',
      headline: 'A Richer Ritual. A Deeper Character.',
      description:
        'A rich, traditional filter coffee formulation crafted from 100% pure handpicked Arabica beans for a golden aromatic crema.',
      mobileDescription:
        'Traditional 100% pure filter coffee crafted for a rich aroma and thick golden crema.',
      prices: specialProduct.weightPrices || { '50g': 69, '100g': 149, '250g': 329 },
      ratioBadge: '100% Pure Filter Coffee • 0% Chicory',
    },
    {
      index: 3,
      title: 'Araku Signature Coffee Powder',
      navLabel: 'Signature (80:20)',
      product: signatureProduct,
      type: 'product',
      theme: {
        bgImage: '/images/hero/slide4_signature_studio.jpg',
        badgeBg: 'bg-[#651C2A]/90 border-[#D7AD36]/60 text-[#F8F4EC]',
        accentGold: 'text-[#D7AD36]',
        primaryBtn: 'bg-[#651C2A] hover:bg-[#4D1420] text-[#F8F4EC] border border-[#D7AD36]/60',
        activePill: 'bg-[#651C2A] text-[#F8F4EC] border-[#D7AD36] ring-1 ring-[#D7AD36]',
        inactivePill: 'bg-[#160E0A]/80 hover:bg-[#28170F] text-[#F8F4EC]/80 border-[#DED2C4]/30',
        gradientOverlay: 'from-[#22070D]/95 via-[#22070D]/80 to-transparent',
        ambientGlow: 'rgba(101, 28, 42, 0.30)',
      },
      eyebrow: 'FLAGSHIP MORNING STAPLE • 80:20 RATIO',
      headline: 'A Signature Worth Savoring.',
      description:
        'A classic South Indian morning staple harmonizing 80% Arabica coffee with 20% premium chicory for dense, velvety decoction.',
      mobileDescription:
        'Heirloom South Indian 80:20 kaapi crafted for rich aroma, thick decoction, and golden froth.',
      prices: signatureProduct.weightPrices || { '50g': 49, '100g': 119, '250g': 219 },
      ratioBadge: '80% Arabica : 20% Chicory',
    },
    {
      index: 4,
      title: 'Araku Premium Coffee Powder',
      navLabel: 'Premium Roast (70:30)',
      product: premiumProduct,
      type: 'product',
      theme: {
        bgImage: '/images/hero/slide5_premium_studio.jpg',
        badgeBg: 'bg-[#202124]/90 border-[#D7AD36]/60 text-[#F8F4EC]',
        accentGold: 'text-[#D7AD36]',
        primaryBtn: 'bg-[#202124] hover:bg-[#16181B] text-[#F8F4EC] border border-[#D7AD36]/60',
        activePill: 'bg-[#202124] text-[#F8F4EC] border-[#D7AD36] ring-1 ring-[#D7AD36]',
        inactivePill: 'bg-[#160E0A]/80 hover:bg-[#28170F] text-[#F8F4EC]/80 border-[#DED2C4]/30',
        gradientOverlay: 'from-[#101112]/95 via-[#101112]/80 to-transparent',
        ambientGlow: 'rgba(40, 42, 48, 0.38)',
      },
      eyebrow: 'DEEP INTENSITY ROAST • 70:30 FORMULATION*',
      headline: 'Bold Character. Lasting Impression.',
      description:
        'Deeply roasted high-intensity blend crafted for dense body, strong aromatic presence, and a lingering bittersweet kaapi finish.',
      mobileDescription:
        'Bold 70:30 dark roast kaapi crafted for heavy body, intense aroma, and strong kick.',
      draftNotice: '*Standard Formulation: 70% Coffee & 30% Chicory (subject to owner confirmation)',
      prices: premiumProduct.weightPrices || { '50g': 49, '100g': 109, '250g': 199 },
      ratioBadge: '70% Arabica : 30% Chicory*',
    },
  ];

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="SJT FARMS Realistic Cinematic Coffee Advertising Showcase"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'pan-y' }}
      className="relative w-full overflow-hidden border-b border-[#28170F]/50 bg-[#160E0A]"
    >
      {/* ========================================================
          DESKTOP CAROUSEL (lg: and above) — 100% PRESERVED
         ======================================================== */}
      <div className="hidden lg:flex relative min-h-[82vh] w-full items-center justify-center overflow-hidden">
        {/* SLIDE 1: BRAND HERO — THE TRUE TASTE OF ARAKU */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            currentSlide === 0 ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          {/* Cinematic Araku Estate Veranda Sunrise Background */}
          <div className="absolute inset-0">
            <img
              src="/images/hero/slide1_araku_estate_hero.jpg"
              alt="Araku Valley High-Altitude Coffee Plantation Sunrise, SJT FARMS"
              width={1920}
              height={1080}
              fetchPriority="high"
              className="w-full h-full object-cover object-center scale-100 transition-transform duration-1000 ease-out"
            />
            {/* Multi-layered Vignette for Editorial Contrast */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#160E0A]/95 via-[#160E0A]/75 to-transparent lg:w-[65%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#160E0A] via-transparent to-[#160E0A]/60" />
          </div>

          {/* Content Container */}
          <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 w-full h-full flex items-center pt-8 pb-16 sm:pt-12 sm:pb-20 lg:pt-14 lg:pb-20">
            <div className="grid grid-cols-12 gap-12 items-center w-full">
              {/* Left: Editorial Content */}
              <div className="col-span-7 space-y-6 text-left">
                {/* Eyebrow */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#28170F]/90 backdrop-blur-md border border-[#D7AD36]/50 text-[#F8F4EC] shadow-warm-sm">
                  <span className="w-2 h-2 rounded-full bg-[#D7AD36] animate-pulse shrink-0" />
                  <span className="text-xs font-bold tracking-[0.22em] uppercase font-sans">
                    ESTATE HARVESTED • ARTISAN ROASTED
                  </span>
                </div>

                {/* Main Headline & Supporting Line */}
                <div className="space-y-2">
                  <span className="text-sm font-bold tracking-[0.25em] uppercase text-[#D7AD36] block font-sans">
                    SJT FARMS • ARAKU VALLEY
                  </span>
                  <h1 className="text-5xl lg:text-6xl font-serif font-extrabold text-white tracking-tight leading-[1.1]">
                    The True Taste of Araku.
                  </h1>
                  <p className="font-serif italic text-2xl text-[#EFE3D2] font-normal leading-snug pt-1">
                    From Our High-Altitude Canopy to Your Perfect Cup.
                  </p>
                </div>

                {/* Description */}
                <p className="text-base text-[#F8F4EC]/90 leading-relaxed max-w-xl font-sans font-normal">
                  Discover a distinctive coffee experience inspired by the landscapes and coffee culture of Araku Valley.
                </p>

                {/* CTA Buttons */}
                <div className="pt-2 flex items-center gap-4">
                  <button
                    id="hero-explore-coffee-button"
                    onClick={scrollToCollection}
                    className="h-12 min-h-[48px] px-8 bg-[#D7AD36] hover:bg-[#C49B28] text-[#160E0A] rounded-xl font-bold tracking-wider uppercase text-xs transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2.5 shadow-warm-md cursor-pointer border border-[#D7AD36]/60"
                  >
                    <span>EXPLORE OUR COFFEE</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    id="hero-discover-story-button"
                    onClick={() => navigateTo('our-farm')}
                    className="h-12 min-h-[48px] px-8 bg-[#28170F]/80 hover:bg-[#3A2117] text-[#F8F4EC] border border-[#D7AD36]/50 rounded-xl font-bold tracking-wider uppercase text-xs transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 hover:border-[#EFE3D2] backdrop-blur-md cursor-pointer"
                  >
                    <Compass className="w-4 h-4 text-[#D7AD36]" />
                    <span>DISCOVER OUR STORY</span>
                  </button>
                </div>

                {/* Three Verified Trust Points */}
                <div className="pt-4 border-t border-[#DED2C4]/20 flex items-center gap-6 text-xs text-[#F8F4EC]/90 font-medium">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#D7AD36]" />
                    <span>Estate Harvested in Araku</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#D7AD36]" />
                    <span>Artisan Small-Batch Roasted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#D7AD36]" />
                    <span>Freshness Sealed Glass Jars</span>
                  </div>
                </div>
              </div>

              {/* Right: Signature Glass Jar Grounded on the Estate Table */}
              <div className="flex col-span-5 justify-center relative">
                <div className="relative w-full max-w-md flex flex-col items-center justify-center">
                  <div className="relative z-10 flex flex-col items-center group cursor-pointer" onClick={scrollToCollection}>
                    <img
                      src="/images/products/jars/araku-signature-100g-jar.png"
                      alt="SJT Farms Araku Signature Glass Coffee Jar with Champagne Gold Lid"
                      width={440}
                      height={440}
                      fetchPriority="high"
                      className="w-full max-w-[360px] max-h-[50vh] h-auto object-contain transition-transform duration-500 group-hover:scale-105"
                      style={{ filter: 'none' }}
                    />

                    {/* Realistic Ground Contact Shadow on the Table */}
                    <div className="w-[65%] h-3.5 bg-black/75 rounded-[50%] blur-[6px] -mt-2 pointer-events-none transition-all duration-300 group-hover:w-[70%]" />
                    <div className="w-[45%] h-2 bg-black/90 rounded-[50%] blur-[2px] -mt-2.5 pointer-events-none" />

                    {/* Grounded Product Pill */}
                    <div className="mt-2.5 bg-[#28170F]/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-[#D7AD36]/50 text-white shadow-warm-lg flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-[#D7AD36] animate-pulse shrink-0" />
                      <div>
                        <span className="text-[10px] text-[#D7AD36] uppercase tracking-wider font-bold block">
                          Flagship Kaapi Blend (80:20)
                        </span>
                        <span className="font-serif text-xs font-bold text-[#F8F4EC] block">
                          From ₹49 (50g) • ₹119 (100g)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SLIDES 2–5: INDIVIDUAL COFFEE PRODUCT CAMPAIGNS (DESKTOP) */}
        {slides.slice(1).map((s) => {
          const product = s.product!;
          const theme = s.theme!;
          const currentWeight = selectedWeights[product.id] || '100g';
          const prices = s.prices!;
          const currentPrice = prices[currentWeight as keyof typeof prices] || product.price;
          const jarImage = getProductVariantJarImage(product, currentWeight);
          const isAdded = addedNotice === product.id;

          return (
            <div
              key={s.index}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                currentSlide === s.index ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Campaign Studio Photographic Background */}
              <div className="absolute inset-0">
                <img
                  src={theme.bgImage}
                  alt={`${s.title} Studio Campaign Background, SJT FARMS`}
                  width={1920}
                  height={1080}
                  className="w-full h-full object-cover object-center"
                />
                <div className={`absolute inset-0 bg-gradient-to-r ${theme.gradientOverlay} lg:w-[68%]`} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#160E0A] via-transparent to-[#160E0A]/60" />
              </div>

              {/* Campaign Content Container */}
              <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 w-full h-full flex items-center pt-8 pb-16 sm:pt-12 sm:pb-20 lg:pt-14 lg:pb-20">
                <div className="grid grid-cols-12 gap-12 items-center w-full">
                  {/* Left: Product Campaign Editorial */}
                  <div className="col-span-7 space-y-5 text-left">
                    {/* Eyebrow & Formulation Badge */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-md border shadow-warm-sm ${theme.badgeBg}`}>
                        <span className="w-2 h-2 rounded-full bg-[#D7AD36] animate-pulse shrink-0" />
                        <span className="text-xs font-bold tracking-[0.2em] uppercase font-sans">
                          {s.eyebrow}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-[#F8F4EC]/80 bg-[#160E0A]/70 px-2.5 py-1 rounded-full border border-white/10 font-mono">
                        {s.ratioBadge}
                      </span>
                    </div>

                    {/* Headline & Family Subtitle */}
                    <div className="space-y-2">
                      <span className="text-sm font-bold tracking-[0.22em] uppercase text-[#D7AD36] block font-sans">
                        {s.title}
                      </span>
                      <h2 className="text-4xl lg:text-5xl font-serif font-extrabold text-white tracking-tight leading-[1.15]">
                        {s.headline}
                      </h2>
                    </div>

                    {/* Description */}
                    <p className="text-base text-[#F8F4EC]/90 leading-relaxed max-w-xl font-sans font-normal">
                      {s.description}
                    </p>

                    {/* Draft Notice if applicable */}
                    {s.draftNotice && (
                      <div className="inline-block bg-[#160E0A]/90 border border-amber-500/40 px-3 py-1 rounded-lg text-xs text-amber-300 font-sans">
                        {s.draftNotice}
                      </div>
                    )}

                    {/* Dynamic 50g / 100g / 250g Variant Selector */}
                    <div className="pt-2 space-y-2">
                      <div className="flex items-center justify-between max-w-md">
                        <span className="text-xs uppercase tracking-wider font-bold text-[#D7AD36] font-sans">
                          Select Packaging Size
                        </span>
                        <span className="text-xs text-[#F8F4EC]/70 font-mono">
                          Current: <strong className="text-white">{currentWeight}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {(['50g', '100g', '250g'] as const).map((weight) => {
                          const isSelected = currentWeight === weight;
                          const price = prices[weight];
                          return (
                            <button
                              key={weight}
                              onClick={() => handleWeightSelect(product.id, weight)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider transition-all duration-200 cursor-pointer border flex items-center gap-2 ${
                                isSelected ? theme.activePill : theme.inactivePill
                              }`}
                            >
                              <span>{weight}</span>
                              <span className="text-[11px] opacity-80">₹{price}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Price and Cart / Detail Actions */}
                    <div className="pt-3 flex items-center gap-6">
                      <div className="flex flex-col">
                        <span className="text-xs text-[#D7AD36] uppercase font-bold tracking-wider font-sans">
                          Estate Price
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-serif font-extrabold text-white">
                            ₹{currentPrice}
                          </span>
                          <span className="text-xs text-[#F8F4EC]/70 font-sans">
                            / {currentWeight} glass jar
                          </span>
                        </div>
                      </div>

                      <button
                        id={`hero-buy-button-${product.id}`}
                        onClick={() => handleQuickAdd(product)}
                        className={`h-12 min-h-[48px] px-7 rounded-xl font-bold tracking-wider uppercase text-xs transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2.5 shadow-warm-md cursor-pointer ${theme.primaryBtn}`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-300" />
                            <span>ADDED TO CART</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-4 h-4" />
                            <span>ADD TO CART</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleOpenDetail(product)}
                        className="h-12 min-h-[48px] px-6 bg-white/10 hover:bg-white/20 text-[#F8F4EC] border border-white/20 rounded-xl font-bold tracking-wider uppercase text-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md"
                      >
                        <span>VIEW DETAILS</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#D7AD36]" />
                      </button>
                    </div>
                  </div>

                  {/* Right: Studio Jar Grounded on the Campaign Table */}
                  <div className="flex col-span-5 justify-center relative">
                    <div className="relative w-full max-w-md flex flex-col items-center justify-center">
                      <div
                        className="relative z-10 flex flex-col items-center group cursor-pointer"
                        onClick={() => handleOpenDetail(product)}
                      >
                        {/* Crystal-Sharp Transparent Jar without Blur or Halos */}
                        <img
                          src={jarImage}
                          alt={`${s.title} ${currentWeight} Glass Jar, SJT FARMS`}
                          width={440}
                          height={440}
                          className="w-full max-w-[360px] max-h-[50vh] h-auto object-contain transition-transform duration-500 ease-out group-hover:scale-105"
                          style={{ filter: 'none' }}
                        />

                        {/* Natural Studio Ground Contact Shadow */}
                        <div className="w-[68%] h-3.5 bg-black/80 rounded-[50%] blur-[7px] -mt-2 pointer-events-none transition-all duration-300 group-hover:w-[72%]" />
                        <div className="w-[45%] h-2 bg-black/95 rounded-[50%] blur-[2.5px] -mt-2.5 pointer-events-none" />

                        {/* Floating Variant Badge */}
                        <div className="mt-2.5 bg-[#160E0A]/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-[#D7AD36]/50 text-white shadow-warm-lg flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-[#D7AD36] animate-pulse shrink-0" />
                          <div>
                            <span className="text-[10px] text-[#D7AD36] uppercase tracking-wider font-bold block">
                              Active Selection
                            </span>
                            <span className="font-serif text-xs font-bold text-[#F8F4EC] block">
                              {currentWeight} • ₹{currentPrice}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* DESKTOP CONTROLS & PAGINATION */}
        <button
          onClick={prevSlide}
          aria-label="Previous Slide"
          className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-[#160E0A]/85 hover:bg-[#28170F] text-[#F8F4EC] border border-[#D7AD36]/50 backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-warm-md"
        >
          <ChevronLeft className="w-5 h-5 text-[#D7AD36]" />
        </button>

        <button
          onClick={nextSlide}
          aria-label="Next Slide"
          className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-[#160E0A]/85 hover:bg-[#28170F] text-[#F8F4EC] border border-[#D7AD36]/50 backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-warm-md"
        >
          <ChevronRight className="w-5 h-5 text-[#D7AD36]" />
        </button>

        {/* Desktop 5 Slide Indicators */}
        <div className="absolute bottom-6 z-20 flex items-center gap-2 max-w-full px-2 overflow-x-auto no-scrollbar">
          {slides.map((slide, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Go to slide ${idx + 1}: ${slide.title}`}
              className={`transition-all duration-300 rounded-full cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-xs ${
                currentSlide === idx
                  ? 'bg-[#D7AD36] text-[#160E0A] font-bold shadow-warm-sm'
                  : 'bg-[#160E0A]/80 hover:bg-[#28170F] text-[#F8F4EC]/70 border border-white/20'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  currentSlide === idx ? 'bg-[#160E0A]' : 'bg-[#D7AD36]'
                }`}
              />
              <span className="text-[11px] font-bold tracking-wider uppercase whitespace-nowrap">
                {slide.navLabel}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================
          MOBILE-FIRST RESPONSIVE CAROUSEL (< lg)
          Full-bleed background covering entire hero to bottom edge!
         ======================================================== */}
      <div
        className="flex flex-col justify-between lg:hidden relative w-full min-h-screen min-h-[100dvh] min-h-[100svh] min-[640px]:min-h-[92vh] pt-3 pb-6 px-3 min-[380px]:px-4 text-center overflow-hidden"
        style={{ minHeight: '100svh', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* Full-Slide Dedicated Background Layer Stack (Spans absolute inset-0 from top to bottom) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {slides.map((s, idx) => {
            const isActive = currentSlide === idx;
            const bgImage = s.theme?.bgImage || '/images/hero/slide1_araku_estate_hero.jpg';
            return (
              <div
                key={`mobile-bg-${idx}`}
                className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                  isActive ? 'opacity-100 z-0' : 'opacity-0 -z-10'
                }`}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
              >
                <img
                  src={bgImage}
                  alt=""
                  width={1920}
                  height={1080}
                  fetchPriority={idx === 0 ? 'high' : 'auto'}
                  loading={idx <= 1 ? 'eager' : 'lazy'}
                  className={`w-full h-full object-cover object-center transition-transform duration-[6000ms] ease-out ${
                    isActive ? 'scale-105' : 'scale-100'
                  }`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center center',
                  }}
                />
                {/* Subtle, uniform dark overlay across the entire slide for crisp text contrast */}
                <div
                  className="absolute inset-0 bg-[#160E0A]/40"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(22, 14, 10, 0.40)',
                  }}
                />
                {/* Gentle top header gradient for clean navigation bar harmony */}
                <div
                  className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#160E0A]/50 to-transparent pointer-events-none"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4rem',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Content Container in Natural Document Flow Above Continuous Background */}
        <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center flex-1 justify-between">
          {currentSlide === 0 ? (
            /* ----------------------------------------------------
               SLIDE 0: BRAND HERO (MOBILE)
               ---------------------------------------------------- */
            <div key="slide-0" className="w-full flex flex-col items-center animate-hero-slide-enter">
              {/* 1. Compact Hero Title and Short Description */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#28170F]/90 border border-[#D7AD36]/50 text-[#F8F4EC] text-[10px] font-bold uppercase tracking-[0.2em] mb-2 font-sans shadow-warm-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D7AD36] animate-pulse shrink-0" />
                <span>ESTATE HARVESTED • ARTISAN ROASTED</span>
              </div>

              <span className="text-[10.5px] font-bold tracking-[0.22em] uppercase text-[#D7AD36] block font-sans">
                SJT FARMS • ARAKU VALLEY
              </span>

              <h1 className="text-2xl min-[360px]:text-3xl font-serif font-extrabold text-white tracking-tight leading-tight mt-1">
                The True Taste of Araku.
              </h1>

              <p className="font-serif italic text-xs min-[360px]:text-sm text-[#EFE3D2] leading-snug mt-1">
                From Our High-Altitude Canopy to Your Perfect Cup.
              </p>

              <p className="text-xs text-[#F8F4EC]/85 leading-relaxed max-w-sm mt-2 px-1 font-sans">
                {slides[0].mobileDescription}
              </p>

              {/* 2. Action Buttons */}
              <div className="grid grid-cols-2 gap-2 w-full max-w-xs mt-3.5">
                <button
                  id="mobile-hero-explore-button"
                  onClick={scrollToCollection}
                  className="h-11 min-h-[44px] px-3 bg-[#D7AD36] hover:bg-[#C49B28] text-[#160E0A] rounded-xl font-bold tracking-wider uppercase text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-warm-sm cursor-pointer active:scale-95"
                >
                  <span>EXPLORE COFFEE</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  id="mobile-hero-story-button"
                  onClick={() => navigateTo('our-farm')}
                  className="h-11 min-h-[44px] px-3 bg-[#28170F]/80 hover:bg-[#3A2117] text-[#F8F4EC] border border-[#D7AD36]/50 rounded-xl font-bold tracking-wider uppercase text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Compass className="w-3.5 h-3.5 text-[#D7AD36]" />
                  <span>OUR STORY</span>
                </button>
              </div>

              {/* 3. Verified Trust Badges */}
              <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] text-[#F8F4EC]/85 font-medium pt-2.5">
                <span>• Estate Harvested</span>
                <span>• Artisan Roasted</span>
                <span>• Sealed Glass Jars</span>
              </div>

              {/* 4. Large Clear Product Jar Image (Lid and Base Fully Visible) */}
              <div
                className="relative w-full max-w-[240px] min-[380px]:max-w-[270px] mx-auto my-2 flex flex-col items-center cursor-pointer group"
                onClick={scrollToCollection}
              >
                {/* Soft Ambient Back-light matching the blend */}
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full pointer-events-none blur-2xl opacity-40 transition-all duration-700"
                  style={{ backgroundColor: slides[0].theme?.ambientGlow || 'rgba(215, 173, 54, 0.22)' }}
                />

                <img
                  src="/images/products/jars/araku-signature-100g-jar.png"
                  alt="SJT Farms Araku Signature Glass Coffee Jar"
                  width={320}
                  height={320}
                  className="relative z-10 w-full max-h-[220px] min-[380px]:max-h-[250px] object-contain transition-transform duration-300 group-hover:scale-105"
                  style={{ filter: 'none' }}
                />
                {/* Physical Contact Shadow */}
                <div className="w-[65%] h-3 bg-black/75 rounded-[50%] blur-[5px] -mt-2 pointer-events-none" />
                <div className="w-[45%] h-1.5 bg-black/90 rounded-[50%] blur-[2px] -mt-1.5 pointer-events-none" />

                {/* Grounded Product Pill */}
                <div className="relative z-10 mt-2 bg-[#28170F]/95 backdrop-blur-md px-3 py-1 rounded-full border border-[#D7AD36]/50 text-white shadow-warm-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D7AD36] animate-pulse shrink-0" />
                  <span className="text-[10px] text-[#D7AD36] uppercase tracking-wider font-bold">
                    Flagship Kaapi Blend (80:20) • From ₹49
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* ----------------------------------------------------
               SLIDES 1–4: PRODUCT CAMPAIGNS (MOBILE)
               Exact user-requested order:
               1. Compact hero title and short description
               2. Three size selectors: 50g, 100g, 250g
               3. Selected price and net weight
               4. Primary Shop button and secondary View Details button
               5. Clear, large product jar image
               6. Product-family selector (below)
               ---------------------------------------------------- */
            (() => {
              const activeSlide = slides[currentSlide];
              const product = activeSlide.product!;
              const theme = activeSlide.theme!;
              const currentWeight = selectedWeights[product.id] || '100g';
              const prices = activeSlide.prices!;
              const currentPrice = prices[currentWeight as keyof typeof prices] || product.price;
              const jarImage = getProductVariantJarImage(product, currentWeight);
              const isAdded = addedNotice === product.id;

              return (
                <div key={`slide-${activeSlide.index}`} className="w-full flex flex-col items-center animate-hero-slide-enter">
                  {/* 1. Compact Hero Title and Short Description */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 mb-1">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[9.5px] font-bold tracking-wider uppercase font-sans ${theme.badgeBg}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D7AD36] animate-pulse shrink-0" />
                      <span>{activeSlide.eyebrow}</span>
                    </div>
                    <span className="text-[9.5px] font-mono font-bold text-[#F8F4EC]/85 bg-white/10 px-2 py-0.5 rounded-full border border-white/15">
                      {activeSlide.ratioBadge}
                    </span>
                  </div>

                  <span className="text-[10.5px] font-bold tracking-[0.2em] uppercase text-[#D7AD36] block font-sans">
                    {activeSlide.title}
                  </span>

                  <h2 className="text-2xl min-[360px]:text-3xl font-serif font-extrabold text-white tracking-tight leading-tight mt-0.5">
                    {activeSlide.headline}
                  </h2>

                  <p className="text-xs text-[#F8F4EC]/85 leading-relaxed max-w-sm mt-1.5 px-1 font-sans">
                    {activeSlide.mobileDescription || activeSlide.description}
                  </p>

                  {/* Draft Notice if applicable (e.g. Premium Roast) */}
                  {activeSlide.draftNotice && (
                    <p className="text-[10px] text-amber-300/90 mt-1 font-sans">
                      {activeSlide.draftNotice}
                    </p>
                  )}

                  {/* 2. Three Size Selectors: 50g, 100g, 250g (Fit evenly) */}
                  <div className="grid grid-cols-3 gap-2 w-full max-w-xs mt-3">
                    {(['50g', '100g', '250g'] as const).map((w) => {
                      const isSelected = currentWeight === w;
                      const price = prices[w];
                      return (
                        <button
                          key={w}
                          onClick={() => handleWeightSelect(product.id, w)}
                          className={`h-11 min-h-[44px] rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                            isSelected ? theme.activePill : theme.inactivePill
                          }`}
                        >
                          <span className="text-xs font-bold leading-tight font-sans">{w}</span>
                          <span className="text-[10px] opacity-90 leading-tight font-mono">₹{price}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* 3. Selected Price and Net Weight (Clean horizontal alignment) */}
                  <div className="flex items-center justify-between w-full max-w-xs mt-2 px-1">
                    <div className="flex items-baseline gap-1.5 text-left">
                      <span className="text-2xl font-serif font-extrabold text-[#D7AD36]">
                        ₹{currentPrice}
                      </span>
                      <span className="text-[10px] text-[#F8F4EC]/75 font-sans">
                        / {currentWeight}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-[#F8F4EC] block font-sans">
                        Net Wt: {currentWeight}
                      </span>
                      <span className="text-[10px] text-[#D7AD36] font-medium block">
                        Safety Sealed Glass Jar
                      </span>
                    </div>
                  </div>

                  {/* 4. Primary Shop button and Secondary View Details button */}
                  <div className="grid grid-cols-2 gap-2 w-full max-w-xs mt-2.5">
                    <button
                      id={`mobile-hero-shop-${product.id}`}
                      onClick={() => handleQuickAdd(product)}
                      className={`h-11 min-h-[44px] px-3 rounded-xl font-bold uppercase text-[11px] tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-warm-sm cursor-pointer ${theme.primaryBtn}`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>ADDED!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>SHOP — ₹{currentPrice}</span>
                        </>
                      )}
                    </button>

                    <button
                      id={`mobile-hero-details-${product.id}`}
                      onClick={() => handleOpenDetail(product)}
                      className="h-11 min-h-[44px] px-3 rounded-xl bg-white/10 hover:bg-white/15 text-[#F8F4EC] border border-white/20 font-bold uppercase text-[11px] tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <span>DETAILS</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#D7AD36]" />
                    </button>
                  </div>

                  {/* 5. Clear, Large Product Jar Image (Lid and Base Fully Visible) */}
                  <div
                    className="relative w-full max-w-[240px] min-[380px]:max-w-[270px] mx-auto my-2 flex flex-col items-center cursor-pointer group"
                    onClick={() => handleOpenDetail(product)}
                  >
                    {/* Soft Ambient Back-light matching the blend */}
                    <div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full pointer-events-none blur-2xl opacity-35 transition-all duration-700"
                      style={{ backgroundColor: theme.ambientGlow || 'rgba(215, 173, 54, 0.25)' }}
                    />

                    <img
                      src={jarImage}
                      alt={`${activeSlide.title} ${currentWeight} Glass Jar, SJT FARMS`}
                      width={320}
                      height={320}
                      className="relative z-10 w-full max-h-[220px] min-[380px]:max-h-[250px] object-contain transition-transform duration-300 group-hover:scale-105"
                      style={{ filter: 'none' }}
                    />
                    {/* Realistic Ground Contact Shadow */}
                    <div className="w-[65%] h-3 bg-black/75 rounded-[50%] blur-[5px] -mt-2 pointer-events-none" />
                    <div className="w-[45%] h-1.5 bg-black/90 rounded-[50%] blur-[2px] -mt-1.5 pointer-events-none" />

                    {/* Active Selection Pill */}
                    <div className="relative z-10 mt-2 bg-[#160E0A]/95 backdrop-blur-md px-3 py-1 rounded-full border border-[#D7AD36]/50 text-white shadow-warm-sm flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D7AD36] animate-pulse shrink-0" />
                      <span className="text-[10px] text-[#D7AD36] uppercase tracking-wider font-bold">
                        Active Selection: {currentWeight} • ₹{currentPrice}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()
          )}

          {/* ========================================================
              6. PRODUCT-FAMILY SELECTOR & CAROUSEL CONTROLS (DEDICATED ROW BENEATH JAR)
             ======================================================== */}
          <div className="w-full max-w-sm mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
            {/* Left Touch-Friendly Arrow (44px min touch target) */}
            <button
              onClick={prevSlide}
              aria-label="Previous Slide"
              className="w-11 h-11 min-w-[44px] shrink-0 rounded-full bg-[#28170F]/90 hover:bg-[#3A2117] text-[#F8F4EC] border border-[#D7AD36]/50 flex items-center justify-center transition-all active:scale-95 shadow-warm-sm cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 text-[#D7AD36]" />
            </button>

            {/* Horizontally Scrollable Product-Family Pills */}
            <div
              ref={navScrollRef}
              className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-1 scroll-smooth"
            >
              {slides.map((slide, idx) => {
                const isActive = currentSlide === idx;
                return (
                  <button
                    key={idx}
                    data-slide-index={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-[#D7AD36] text-[#160E0A] font-bold shadow-warm-sm'
                        : 'bg-[#160E0A]/85 text-[#F8F4EC]/75 border border-white/15 hover:bg-[#28170F]'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? 'bg-[#160E0A]' : 'bg-[#D7AD36]'
                      }`}
                    />
                    <span>{slide.navLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Touch-Friendly Arrow (44px min touch target) */}
            <button
              onClick={nextSlide}
              aria-label="Next Slide"
              className="w-11 h-11 min-w-[44px] shrink-0 rounded-full bg-[#28170F]/90 hover:bg-[#3A2117] text-[#F8F4EC] border border-[#D7AD36]/50 flex items-center justify-center transition-all active:scale-95 shadow-warm-sm cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 text-[#D7AD36]" />
            </button>
          </div>

          {/* Pagination Dots */}
          <div className="flex items-center justify-center gap-1.5 pt-2.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  currentSlide === idx ? 'w-5 bg-[#D7AD36]' : 'w-1.5 bg-white/30'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
