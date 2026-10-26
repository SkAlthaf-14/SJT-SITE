import React from 'react';
import { PRODUCTS } from '../data/products';
import { ProductCard } from '../components/common/ProductCard';
import { Sparkles, ShieldCheck, Heart } from 'lucide-react';

export const AccessoriesPage: React.FC = () => {
  const accessories = PRODUCTS.filter((p) => p.category === 'Accessories');

  return (
    <div className="bg-[var(--coffee-bg)] min-h-screen py-12 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[var(--coffee-caramel)] uppercase tracking-[0.25em] mb-3">
            <Sparkles className="w-4 h-4" />
            <span>Traditional & Modern Gear</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[var(--coffee-espresso)] tracking-tight">
            Coffee Brewing Accessories
          </h1>
          <p className="text-sm sm:text-base text-[var(--coffee-text-muted)] mt-3 font-normal leading-relaxed">
            Heirloom brass filters, artisanal davara tumblers, airtight ceramic jars, and precision stovetop equipment crafted to last a lifetime.
          </p>
        </div>

        {/* ACCESSORIES GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {accessories.map((acc) => (
            <ProductCard key={acc.id} product={acc} />
          ))}
        </div>

        {/* BRASS CARE GUIDE CALLOUT */}
        <div className="mt-16 bg-white rounded-3xl p-8 sm:p-12 border border-[var(--coffee-border)] shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-3">
              <span className="text-xs font-bold text-[var(--coffee-caramel)] uppercase tracking-wider block">
                Heirloom Quality
              </span>
              <h3 className="font-serif text-2xl font-bold text-[var(--coffee-espresso)]">
                How to Care for Solid Brassware
              </h3>
              <p className="text-sm text-[var(--coffee-text-muted)] leading-relaxed">
                Our traditional filters and davara sets are hand-turned from heavy gauge food-grade brass. Over time, brass develops a natural antique patina. To restore golden mirror shine, gently polish with natural tamarind paste or pitambari powder and rinse with warm water. Never place brassware in electric dishwashers.
              </p>
            </div>
            <div className="lg:col-span-4 flex items-center justify-center">
              <div className="bg-[var(--coffee-cream)]/50 p-6 rounded-2xl border border-[var(--coffee-border)] text-center space-y-2 w-full">
                <ShieldCheck className="w-8 h-8 text-[var(--coffee-caramel)] mx-auto" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--coffee-espresso)]">Lifetime Craft Guarantee</h4>
                <p className="text-xs text-[var(--coffee-text-muted)]">Solid brass with food-safe internal tinning</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
