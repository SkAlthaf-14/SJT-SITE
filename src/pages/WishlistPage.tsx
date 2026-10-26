import React from 'react';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useNavigation } from '../context/NavigationContext';
import { EmptyState } from '../components/common/EmptyState';
import { getProductVariantJarImage, getDefaultProductVariant } from '../data/products';

export const WishlistPage: React.FC = () => {
  const { wishlist, removeFromWishlist, moveToCart } = useWishlist();
  const { navigateTo } = useNavigation();

  if (wishlist.length === 0) {
    return (
      <div className="bg-[var(--coffee-bg)] min-h-[70vh] flex items-center justify-center p-4">
        <EmptyState
          icon={Heart}
          title="Your Wishlist is Empty"
          description="Save your favourite single-origin roasts, brass filters, and estate accessories here to revisit anytime."
          actionLabel="Explore Coffee Collection"
          onAction={() => navigateTo('shop')}
        />
      </div>
    );
  }

  return (
    <div className="bg-[var(--coffee-bg)] min-h-screen py-12 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-bold text-[var(--coffee-caramel)] uppercase tracking-[0.25em] block mb-2 font-sans">
              Saved For Later
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[var(--coffee-espresso)]">
              My Wishlist ({wishlist.length})
            </h1>
          </div>

          <button
            onClick={() => navigateTo('shop')}
            className="text-xs font-bold text-[var(--coffee-espresso)] hover:text-[var(--coffee-caramel)] uppercase tracking-wider flex items-center gap-2 group transition-colors"
          >
            <span>Continue Browsing</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlist.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl overflow-hidden border border-[var(--coffee-border)] shadow-xs hover:border-[var(--coffee-border-dark)] hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <div
                onClick={() => navigateTo('product-detail', { product, variant: getDefaultProductVariant(product) })}
                className="relative aspect-[4/3] w-full bg-[var(--coffee-cream)]/50 cursor-pointer group overflow-hidden"
              >
                <img
                  src={getProductVariantJarImage(product)}
                  alt={product.name}
                  className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromWishlist(product.id);
                  }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 hover:bg-rose-50 text-[var(--coffee-text-muted)] hover:text-rose-600 flex items-center justify-center transition-all shadow-xs"
                  title="Remove from wishlist"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[var(--coffee-caramel)] uppercase tracking-wider block mb-1">
                    {product.category}
                  </span>
                  <h3
                    onClick={() => navigateTo('product-detail', { product })}
                    className="font-serif text-base font-bold text-[var(--coffee-espresso)] hover:text-[var(--coffee-caramel)] cursor-pointer line-clamp-1 transition-colors"
                  >
                    {product.name}
                  </h3>
                  <p className="text-xs text-[var(--coffee-text-muted)] line-clamp-2 mt-1 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--coffee-border)]/60 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="font-serif text-lg font-bold text-[var(--coffee-espresso)]">
                      ₹{product.price}
                    </span>
                    <span className="text-[11px] text-[var(--coffee-text-muted)]">
                      for {product.weights[0]}
                    </span>
                  </div>

                  <button
                    onClick={() => moveToCart(product)}
                    className="w-full py-2.5 px-4 bg-[var(--coffee-espresso)] text-[var(--coffee-cream)] hover:bg-[var(--coffee-roast)] rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs active:scale-95"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-[var(--coffee-caramel)]" />
                    <span>Move to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
