import React, { useState } from 'react';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { PRODUCTS } from '../../data/products';
import { ProductCard } from '../common/ProductCard';
import { useNavigation } from '../../context/NavigationContext';

export const FeaturedCollection: React.FC = () => {
  const { navigateTo } = useNavigation();
  const [activeTab, setActiveTab] = useState<string>('all');

  const fourCoffeeFamilies = PRODUCTS.filter((p) => p.category !== 'Accessories');

  const filteredProducts =
    activeTab === 'all'
      ? fourCoffeeFamilies
      : fourCoffeeFamilies.filter((p) => {
          if (activeTab === 'instant') return p.id.includes('instant');
          if (activeTab === 'filter') return p.category === 'Filter Coffee';
          if (activeTab === 'kaapi') return p.chicoryRatio && !p.chicoryRatio.includes('0%');
          return true;
        });

  return (
    <section
      id="coffee-collection-section"
      className="py-12 sm:py-16 lg:py-24 bg-[#F8F4EC] border-b border-[#DED2C4] scroll-mt-20 relative overflow-hidden"
      style={{
        backgroundImage: `
          radial-gradient(circle at 85% 12%, rgba(215, 173, 54, 0.08) 0%, transparent 45%),
          radial-gradient(circle at 10% 85%, rgba(18, 61, 47, 0.06) 0%, transparent 45%),
          linear-gradient(180deg, #F8F4EC 0%, #F5EEE2 50%, #F8F4EC 100%)
        `
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ========================================================
            FEATURED COFFEE COLLECTION HEADER
           ======================================================== */}
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EFE3D2] border border-[#DED2C4] text-[#28170F] text-xs font-bold uppercase tracking-[0.22em] mb-2.5 font-sans shadow-warm-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#D7AD36]" />
            <span>ESTATE HARVESTED • ARTISAN ROASTED</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-extrabold text-[#28170F] tracking-tight leading-tight">
            Our Coffee Collection
          </h2>
          <p className="text-xs sm:text-sm text-[#7A6E65] mt-2 font-normal leading-relaxed max-w-xl mx-auto font-sans">
            Explore all four distinctive coffee families and 12 packaging variants, freshly roasted and sealed in glass jars.
          </p>
        </div>

        {/* Compact Family Filter Pills */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-6 max-w-full no-scrollbar">
          {[
            { id: 'all', label: 'All 4 Coffee Families' },
            { id: 'instant', label: 'Instant (100% Arabica)' },
            { id: 'filter', label: 'Special Blend (Filter)' },
            { id: 'kaapi', label: 'Traditional Kaapi (With Chicory)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-xs px-4 py-2 min-h-[38px] rounded-full font-semibold transition-all duration-200 active:scale-95 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'bg-[#28170F] text-[#F8F4EC] shadow-warm-sm ring-1 ring-[#D7AD36]/40'
                  : 'bg-white border border-[#DED2C4] text-[#202124] hover:bg-[#EFE3D2]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* FOUR PRODUCT CARDS GRID (Standard 4-Column Card View) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* TRUST BANNER BELOW CARDS */}
        <div className="mt-12 bg-white rounded-2xl p-5 border border-[#DED2C4] shadow-warm-sm flex flex-wrap items-center justify-around gap-4 text-xs text-[#28170F]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#123D2F]" />
            <span className="font-semibold">Transparent Glass Jars with Gold Caps</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D7AD36]" />
            <span className="font-semibold">300 DPI Verified Label Artworks</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#123D2F]" />
            <span className="font-semibold">50g, 100g, 250g Standard Weights</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#B77943]">₹49 – ₹479 Honest Roastery Pricing</span>
          </div>
        </div>

        {/* BOTTOM CTA */}
        <div className="mt-10 sm:mt-14 text-center">
          <button
            onClick={() => navigateTo('shop')}
            className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 bg-[#28170F] text-[#F8F4EC] hover:bg-[#3A2117] rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 shadow-warm-md hover:-translate-y-0.5 cursor-pointer group max-w-full border border-[#D7AD36]/40"
          >
            <span className="truncate">Shop All 12 Variants & Brewing Accessories</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </section>
  );
};
