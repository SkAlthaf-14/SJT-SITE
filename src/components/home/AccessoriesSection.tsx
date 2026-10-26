import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { PRODUCTS } from '../../data/products';
import { ProductCard } from '../common/ProductCard';
import { useNavigation } from '../../context/NavigationContext';

export const AccessoriesSection: React.FC = () => {
  const { navigateTo } = useNavigation();
  const accessories = PRODUCTS.filter((p) => p.category === 'Accessories').slice(0, 4);

  return (
    <section className="py-10 sm:py-16 lg:py-20 bg-[#EDE2D2]/40 border-y border-[#E4D8C8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8 sm:mb-12">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#A37936] uppercase tracking-[0.2em] mb-1.5 font-sans">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Artisan Brewing Gear</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#201814] tracking-tight">
              COMPLETE YOUR COFFEE RITUAL
            </h2>
            <p className="text-xs sm:text-base text-[#6B5B52] mt-2 font-normal">
              Heirloom-grade solid brass filters, handcrafted davara tumblers, airtight ceramic storage, and precision extraction tools.
            </p>
          </div>

          <button
            onClick={() => navigateTo('accessories')}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#24150F] hover:text-[#C49A5A] uppercase tracking-wider transition-colors pb-1 border-b-2 border-[#C49A5A]"
          >
            <span>View All Accessories</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* ACCESSORIES GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {accessories.map((accessory) => (
            <ProductCard key={accessory.id} product={accessory} />
          ))}
        </div>
      </div>
    </section>
  );
};
