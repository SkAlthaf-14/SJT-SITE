import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Star, ArrowRight, Sparkles } from 'lucide-react';
import { PRODUCTS, getProductVariantJarImage } from '../../data/products';
import { useNavigation } from '../../context/NavigationContext';
import { useBodyScrollLock } from '../../utils/scrollLock';

export const SearchOverlay: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, navigateTo } = useNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sjt_recent_searches');
      return saved ? JSON.parse(saved) : ['Signature Coffee Powder', 'Brass Filter', 'Moka Pot'];
    } catch {
      return ['Signature Coffee Powder', 'Brass Filter', 'Moka Pot'];
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);

  // Lock background scroll when search modal is open
  useBodyScrollLock(isSearchOpen, 'search-overlay');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 100);
    }
  }, [isSearchOpen]);

  if (!isSearchOpen) return null;

  const popularSearches = [
    'South Indian Filter',
    'Chicory Blend',
    'Specialty 100% Pure',
    'Davara Tumbler',
    'Cold Brew',
    'Strong Coffee'
  ];

  const filteredProducts = searchTerm.trim()
    ? PRODUCTS.filter((p) => {
        const query = searchTerm.toLowerCase();
        return (
          p.name.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.strength.toLowerCase().includes(query) ||
          p.flavourNotes.some((n) => n.toLowerCase().includes(query)) ||
          p.brewMethods.some((b) => b.toLowerCase().includes(query))
        );
      })
    : [];

  const handleSelectProduct = (product: (typeof PRODUCTS)[0]) => {
    // Add to recent
    if (searchTerm.trim()) {
      const updated = Array.from(new Set([searchTerm.trim(), ...recentSearches])).slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('sjt_recent_searches', JSON.stringify(updated));
    }
    setIsSearchOpen(false);
    navigateTo('product-detail', { product });
  };

  const handleTagClick = (tag: string) => {
    setSearchTerm(tag);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search Coffee and Brewing Gear"
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/60 backdrop-blur-xs transition-opacity"
    >
      <div className="min-h-[100dvh] px-3 sm:px-4 text-center flex flex-col justify-start sm:justify-center items-center py-6 sm:py-12">
        {/* Backdrop click closer */}
        <div
          className="fixed inset-0"
          onClick={() => setIsSearchOpen(false)}
          aria-hidden="true"
        />

        <div className="w-full max-w-3xl my-auto text-left align-middle transition-all transform bg-[var(--coffee-warm-white)] shadow-2xl rounded-3xl border border-[var(--coffee-border)] overflow-hidden relative z-10 animate-fade-in">
          {/* SEARCH INPUT BAR */}
          <div className="p-4 sm:p-6 bg-white border-b border-[var(--coffee-border)] flex items-center gap-3">
            <Search className="w-5 h-5 text-[var(--coffee-caramel)] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by blend, roast, brew method, or gear..."
              className="flex-1 text-base sm:text-lg bg-transparent border-none focus:outline-none text-[var(--coffee-espresso)] placeholder-[var(--coffee-text-muted)]/60 font-sans"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-[var(--coffee-text-muted)] hover:text-[var(--coffee-espresso)] px-2 py-1 rounded-lg text-xs font-semibold"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setIsSearchOpen(false)}
              className="p-1.5 text-[var(--coffee-text-muted)] hover:text-[var(--coffee-espresso)] hover:bg-[var(--coffee-cream)]/50 rounded-full transition-colors ml-2"
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* SEARCH RESULTS OR SUGGESTIONS */}
          <div className="p-4 sm:p-6 max-h-[65vh] overflow-y-auto overscroll-contain">
            {searchTerm.trim() ? (
              <div>
                <p className="text-xs font-semibold text-[var(--coffee-text-muted)] uppercase tracking-wider mb-4">
                  Matching Coffee & Gear ({filteredProducts.length})
                </p>
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="font-serif text-lg font-bold text-[var(--coffee-espresso)]">No matches found</p>
                    <p className="text-xs text-[var(--coffee-text-muted)] mt-1">
                      Try searching for "Signature", "Filter Coffee", "Brass", or "Moka Pot"
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleSelectProduct(product)}
                        className="flex items-center gap-3 p-3 bg-white hover:bg-[var(--coffee-cream)]/40 rounded-2xl border border-[var(--coffee-border)] cursor-pointer transition-all duration-200 group shadow-xs hover:shadow-sm"
                      >
                        <img
                          src={getProductVariantJarImage(product)}
                          alt={product.name}
                          className="w-16 h-16 object-contain rounded-xl bg-[var(--coffee-cream)]/30 border border-[var(--coffee-border)] shrink-0 p-1"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-serif text-sm font-bold text-[var(--coffee-espresso)] group-hover:text-[var(--coffee-caramel)] truncate transition-colors">
                            {product.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-[var(--coffee-espresso)]">
                              ₹{product.price}
                            </span>
                            <span className="text-[10px] bg-[var(--coffee-cream)] text-[var(--coffee-mocha)] px-2 py-0.5 rounded-full font-semibold uppercase">
                              {product.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-[11px] text-[var(--coffee-text-muted)]">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>{product.rating}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[var(--coffee-caramel)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Popular searches */}
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--coffee-text-muted)] uppercase tracking-wider mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--coffee-caramel)]" />
                    <span>Popular Searches</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleTagClick(tag)}
                        className="text-xs px-3.5 py-1.5 bg-white hover:bg-[var(--coffee-espresso)] hover:text-white text-[var(--coffee-espresso)] rounded-xl border border-[var(--coffee-border)] transition-all duration-200 font-medium shadow-xs"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recent searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[var(--coffee-text-muted)] uppercase tracking-wider mb-3">
                      Recent Searches
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => handleTagClick(tag)}
                          className="text-xs px-3 py-1.5 bg-[var(--coffee-cream)]/50 hover:bg-[var(--coffee-cream)] text-[var(--coffee-text)] rounded-xl transition-colors font-medium flex items-center gap-1.5 border border-[var(--coffee-border)]/60"
                        >
                          <Search className="w-3 h-3 text-[var(--coffee-text-muted)]" />
                          <span>{tag}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Featured quick recommendations */}
                <div className="pt-4 border-t border-[var(--coffee-border)]">
                  <p className="text-xs font-semibold text-[var(--coffee-text-muted)] uppercase tracking-wider mb-3">
                    Trending This Morning
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PRODUCTS.slice(0, 2).map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => handleSelectProduct(prod)}
                        className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[var(--coffee-border)] cursor-pointer hover:bg-[var(--coffee-cream)]/40 transition-colors shadow-xs"
                      >
                        <img
                          src={getProductVariantJarImage(prod)}
                          alt={prod.name}
                          className="w-12 h-12 rounded-xl object-contain border border-[var(--coffee-border)]/60 bg-[var(--coffee-cream)]/30 p-0.5"
                        />
                        <div>
                          <p className="font-serif text-xs font-bold text-[var(--coffee-espresso)]">{prod.name}</p>
                          <p className="text-[11px] text-[var(--coffee-caramel)] font-semibold">₹{prod.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
