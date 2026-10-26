import React, { useState, useEffect, useMemo } from 'react';
import { Filter, SlidersHorizontal, Grid3X3, LayoutList, X, RotateCcw, Search } from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { ProductCard } from '../components/common/ProductCard';
import { EmptyState } from '../components/common/EmptyState';
import { useNavigation } from '../context/NavigationContext';
import { subscribeToProducts, FirestoreProduct } from '../services/productsService';
import { useBodyScrollLock } from '../utils/scrollLock';

export const ShopPage: React.FC = () => {
  const { selectedCategory } = useNavigation() as any;

  const [liveProducts, setLiveProducts] = useState<FirestoreProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [category, setCategory] = useState<string>(selectedCategory || 'All');
  const [strength, setStrength] = useState<string>('All');
  const [weight, setWeight] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [maxPrice, setMaxPrice] = useState<number>(2500);
  const [minRating, setMinRating] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);

  // Lock background scroll when mobile filter drawer is open
  useBodyScrollLock(mobileFilterOpen, 'shop-mobile-filter');

  // Close filter drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileFilterOpen) {
        setMobileFilterOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileFilterOpen]);

  // Subscribe to real-time Firestore products collection
  useEffect(() => {
    const unsub = subscribeToProducts((prods) => {
      if (prods && prods.length > 0) {
        setLiveProducts(prods);
      }
    });
    return () => unsub();
  }, []);

  const productSource = useMemo(() => {
    if (liveProducts.length > 0) {
      return liveProducts.filter((p) => p.status !== 'inactive');
    }
    return PRODUCTS;
  }, [liveProducts]);

  const categories = ['All', 'Coffee Powder', 'Filter Coffee', 'Specialty', 'Accessories'];
  const strengths = ['All', 'Mild', 'Medium', 'Strong'];
  const weights = ['All', '50g', '100g', '250g', '500g', '1kg'];

  const filteredProducts = useMemo(() => {
    return (productSource as any[]).filter((p) => {
      // Inline Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          p.name.toLowerCase().includes(q) ||
          p.tagline?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.flavourNotes?.some((n: string) => n.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      // Category filter
      if (category !== 'All' && p.category !== category) return false;

      // Strength filter (skip for accessories)
      if (strength !== 'All' && p.category !== 'Accessories' && p.strength !== strength) return false;

      // Weight filter
      if (weight !== 'All' && !p.weights?.some((w: string) => w.includes(weight))) return false;

      // Price filter
      if (p.price > maxPrice) return false;

      // Rating filter
      if (p.rating < minRating) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'newest') return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });
  }, [searchQuery, category, strength, weight, maxPrice, minRating, sortBy, productSource]);

  const handleResetFilters = () => {
    setCategory('All');
    setStrength('All');
    setWeight('All');
    setMaxPrice(2500);
    setMinRating(0);
    setSortBy('featured');
    setSearchQuery('');
  };

  const hasActiveFilters =
    category !== 'All' ||
    strength !== 'All' ||
    weight !== 'All' ||
    maxPrice < 2500 ||
    minRating > 0 ||
    searchQuery.trim() !== '';

  return (
    <div className="bg-[#FCFAF6] min-h-screen py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* PAGE HEADER */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <span className="text-xs font-bold text-[#A66A3F] uppercase tracking-[0.25em] block mb-2 font-sans">
            Our Complete Collection
          </span>
          <h1 className="heading-section text-[#2B211C] tracking-tight">
            SHOP SJT COFFEE & GEAR
          </h1>
          <p className="text-sm text-[#6D625B] mt-2 font-normal font-sans">
            Freshly roasted coffee powder, authentic brass filters, and brewing essentials shipped directly from our plantation roastery.
          </p>
        </div>

        {/* TOP TOOLBAR: SEARCH, COUNTER, SORT & VIEW SWITCHER */}
        <div className="bg-white p-4 rounded-2xl border border-[#DED2C4] shadow-warm-sm mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="lg:hidden px-4 py-2.5 min-h-[44px] bg-[#F7F1E8] text-[#2B211C] active:scale-95 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-transform border border-[#DED2C4]"
            >
              <Filter className="w-4 h-4 text-[#A66A3F]" />
              <span>Filters</span>
            </button>

            {/* Quick Search Input with comfortable mobile height */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-[#6D625B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search roasts & gear..."
                className="w-full pl-9 pr-7 py-2.5 min-h-[44px] bg-[#FCFAF6] border border-[#DED2C4] rounded-xl text-sm sm:text-xs text-[#2B211C] placeholder-[#6D625B] focus:outline-none focus:border-[#A66A3F] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6D625B] hover:text-[#2B211C] cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <span className="text-xs text-[#6D625B] whitespace-nowrap hidden sm:inline">
              Showing <strong className="text-[#2B211C]">{filteredProducts.length}</strong> of{' '}
              {PRODUCTS.length}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Sort Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6D625B] hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs py-2 px-3 min-h-[40px] rounded-xl border border-[#DED2C4] bg-[#FCFAF6] text-[#2B211C] focus:outline-none focus:border-[#A66A3F] cursor-pointer"
              >
                <option value="featured">Featured Roasts</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">New Arrivals</option>
              </select>
            </div>

            {/* View Switcher (Desktop) */}
            <div className="hidden sm:flex items-center border border-[#DED2C4] rounded-xl overflow-hidden bg-[#FCFAF6]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#2A1812] text-[#FCFAF6]'
                    : 'text-[#6D625B] hover:bg-[#F7F1E8]'
                }`}
                title="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#2A1812] text-[#FCFAF6]'
                    : 'text-[#6D625B] hover:bg-[#F7F1E8]'
                }`}
                title="List view"
              >
                <LayoutList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* MAIN BODY: SIDEBAR + PRODUCT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* DESKTOP SIDEBAR FILTERS */}
          <aside className="hidden lg:block space-y-6 bg-white p-6 rounded-2xl border border-[#DED2C4] shadow-warm-sm h-fit">
            <div className="flex items-center justify-between pb-3 border-b border-[#DED2C4]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#A66A3F]" />
                <h3 className="font-serif font-bold text-sm text-[#2B211C]">Filters</h3>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-[#A66A3F] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* CATEGORY FILTER */}
            <div>
              <h4 className="text-xs font-bold text-[#2B211C] uppercase tracking-wider mb-3">
                Category
              </h4>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`w-full text-left py-2 px-3 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      category === cat
                        ? 'bg-[#2A1812] text-[#FCFAF6] font-semibold'
                        : 'text-[#6D625B] hover:bg-[#F7F1E8]'
                    }`}
                  >
                    <span>{cat}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* COFFEE STRENGTH FILTER */}
            <div className="pt-4 border-t border-[#DED2C4]">
              <h4 className="text-xs font-bold text-[#2B211C] uppercase tracking-wider mb-3">
                Coffee Strength
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {strengths.map((str) => (
                  <button
                    key={str}
                    onClick={() => setStrength(str)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                      strength === str
                        ? 'bg-[#2A1812] text-[#FCFAF6] font-semibold'
                        : 'bg-[#F7F1E8] text-[#6D625B] hover:bg-[#EFE3D2]'
                    }`}
                  >
                    {str}
                  </button>
                ))}
              </div>
            </div>

            {/* WEIGHT FILTER */}
            <div className="pt-4 border-t border-[#DED2C4]">
              <h4 className="text-xs font-bold text-[#2B211C] uppercase tracking-wider mb-3">
                Pack Size
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {weights.map((w) => (
                  <button
                    key={w}
                    onClick={() => setWeight(w)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                      weight === w
                        ? 'bg-[#2A1812] text-[#FCFAF6] font-semibold'
                        : 'bg-[#F7F1E8] text-[#6D625B] hover:bg-[#EFE3D2]'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* PRICE SLIDER */}
            <div className="pt-4 border-t border-[#DED2C4]">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-[#2B211C] uppercase tracking-wider">
                  Max Price
                </h4>
                <span className="text-xs font-bold text-[#2A1812]">₹{maxPrice}</span>
              </div>
              <input
                type="range"
                min={40}
                max={2500}
                step={10}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#2A1812] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#6D625B] mt-1">
                <span>₹40</span>
                <span>₹2500</span>
              </div>
            </div>

            {/* RATING FILTER */}
            <div className="pt-4 border-t border-[#DED2C4]">
              <h4 className="text-xs font-bold text-[#2B211C] uppercase tracking-wider mb-3">
                Minimum Rating
              </h4>
              <div className="space-y-1.5 text-xs">
                {[
                  { stars: 0, label: 'All Ratings' },
                  { stars: 4.8, label: '4.8 ★ & Above' },
                  { stars: 4.5, label: '4.5 ★ & Above' },
                ].map((r) => (
                  <button
                    key={r.stars}
                    onClick={() => setMinRating(r.stars)}
                    className={`w-full text-left py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                      minRating === r.stars
                        ? 'bg-[#EFE3D2] text-[#2B211C] font-semibold'
                        : 'text-[#6D625B] hover:bg-[#F7F1E8]'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* PRODUCT LISTINGS */}
          <div className="lg:col-span-3">
            {filteredProducts.length === 0 ? (
              <EmptyState
                title="No roasts match your active filters"
                description="Try clearing your search query or adjusting your price range, strength, or pack size to view available harvests."
                actionLabel="Clear All Filters"
                onAction={handleResetFilters}
              />
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
                    : 'space-y-6'
                }
              >
                {filteredProducts.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE FILTERS DRAWER */}
      {mobileFilterOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filter Products"
          className="fixed inset-0 z-50 lg:hidden flex overscroll-contain"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileFilterOpen(false)}
            aria-hidden="true"
          />
          <div className="relative ml-auto w-full max-w-xs sm:max-w-sm bg-white h-full shadow-2xl flex flex-col p-6 overflow-y-auto overscroll-contain z-10 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
            <div className="flex items-center justify-between pb-4 border-b border-[#DED2C4]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#A66A3F]" />
                <h3 className="font-serif font-bold text-base text-[#2B211C]">Filters</h3>
              </div>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1.5 text-[#6D625B] hover:text-[#2B211C] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-6 flex-1">
              {/* Category */}
              <div>
                <h4 className="text-xs font-bold text-[#2B211C] uppercase tracking-wider mb-2.5">
                  Category
                </h4>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`w-full text-left py-2 px-3 rounded-xl text-xs transition-colors flex items-center justify-between ${
                        category === cat
                          ? 'bg-[#2A1812] text-[#FCFAF6] font-semibold'
                          : 'text-[#6D625B] hover:bg-[#F7F1E8]'
                      }`}
                    >
                      <span>{cat}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Strength */}
              <div className="pt-4 border-t border-[#DED2C4]">
                <h4 className="text-xs font-bold text-[#2B211C] uppercase tracking-wider mb-2.5">
                  Coffee Strength
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {strengths.map((str) => (
                    <button
                      key={str}
                      onClick={() => setStrength(str)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                        strength === str
                          ? 'bg-[#2A1812] text-[#FCFAF6] font-semibold'
                          : 'bg-[#F7F1E8] text-[#6D625B]'
                      }`}
                    >
                      {str}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pack Size */}
              <div className="pt-4 border-t border-[#DED2C4]">
                <h4 className="text-xs font-bold text-[#2B211C] uppercase tracking-wider mb-2.5">
                  Pack Size
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {weights.map((w) => (
                    <button
                      key={w}
                      onClick={() => setWeight(w)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                        weight === w
                          ? 'bg-[#2A1812] text-[#FCFAF6] font-semibold'
                          : 'bg-[#F7F1E8] text-[#6D625B]'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Slider */}
              <div className="pt-4 border-t border-[#DED2C4]">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-[#2B211C] uppercase tracking-wider">
                    Max Price: ₹{maxPrice}
                  </h4>
                </div>
                <input
                  type="range"
                  min={40}
                  max={2500}
                  step={10}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#2A1812]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#DED2C4] flex items-center gap-3">
              <button
                onClick={handleResetFilters}
                className="flex-1 py-2.5 rounded-xl border border-[#DED2C4] text-xs font-bold text-[#6D625B] hover:bg-[#F7F1E8]"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-2.5 bg-[#2A1812] text-[#FCFAF6] rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm"
              >
                Apply ({filteredProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
