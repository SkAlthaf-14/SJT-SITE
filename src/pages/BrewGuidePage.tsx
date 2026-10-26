import React from 'react';
import { Coffee, ArrowUpRight, Scale, Clock, Sparkles } from 'lucide-react';
import { BREW_GUIDES } from '../data/brewGuides';
import { useNavigation } from '../context/NavigationContext';

export const BrewGuidePage: React.FC = () => {
  const { openBrewModal } = useNavigation();

  return (
    <div className="bg-[var(--coffee-bg)] min-h-screen py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[var(--coffee-caramel)] uppercase tracking-[0.25em] mb-2 font-sans">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Brewing Masterclass</span>
          </div>
          <h1 className="heading-section text-[var(--coffee-espresso)]">
            BREW IT TO PERFECTION
          </h1>
          <p className="text-sm sm:text-base text-[var(--coffee-muted)] mt-3 font-normal leading-relaxed">
            Great coffee is equal parts agricultural passion and kitchen precision. Master the golden ratios and extraction times for your favourite apparatus.
          </p>
        </div>

        {/* 5 COMPREHENSIVE BREW METHOD CARDS */}
        <div className="space-y-8">
          {BREW_GUIDES.map((guide, idx) => (
            <div
              key={guide.id}
              className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[var(--coffee-border)] shadow-xs hover:shadow-warm-md hover:border-[var(--coffee-caramel)]/50 transition-all duration-300 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              {/* Image */}
              <div className="lg:col-span-4 aspect-[4/3] rounded-2xl overflow-hidden bg-[var(--coffee-espresso)] relative shadow-2xs">
                <img
                  src={guide.image}
                  alt={guide.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <span className="absolute top-3 left-3 bg-[var(--coffee-espresso)]/85 backdrop-blur-md text-[var(--coffee-cream)] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-[var(--coffee-caramel)]/30">
                  Method 0{idx + 1}
                </span>
              </div>

              {/* Info */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--coffee-espresso)]">
                    {guide.name}
                  </h2>
                  <span className="text-xs font-semibold text-[var(--coffee-caramel)] bg-[var(--coffee-cream)] px-3 py-1 rounded-full w-fit border border-[var(--coffee-border)]/60">
                    {guide.strength}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[var(--coffee-muted)] leading-relaxed">
                  {guide.shortDesc}
                </p>

                {/* Quick metrics grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="bg-[var(--coffee-bg)] p-3 rounded-xl border border-[var(--coffee-border)]">
                    <span className="text-[10px] text-[var(--coffee-muted)] uppercase font-bold block">Coffee Dose</span>
                    <span className="text-xs font-bold text-[var(--coffee-espresso)]">{guide.coffeeRatio}</span>
                  </div>
                  <div className="bg-[var(--coffee-bg)] p-3 rounded-xl border border-[var(--coffee-border)]">
                    <span className="text-[10px] text-[var(--coffee-muted)] uppercase font-bold block">Water Ratio</span>
                    <span className="text-xs font-bold text-[var(--coffee-espresso)]">{guide.waterRatio}</span>
                  </div>
                  <div className="bg-[var(--coffee-bg)] p-3 rounded-xl border border-[var(--coffee-border)]">
                    <span className="text-[10px] text-[var(--coffee-muted)] uppercase font-bold block">Grind Consistency</span>
                    <span className="text-xs font-bold text-[var(--coffee-espresso)] truncate block">{guide.grind}</span>
                  </div>
                  <div className="bg-[var(--coffee-bg)] p-3 rounded-xl border border-[var(--coffee-border)]">
                    <span className="text-[10px] text-[var(--coffee-muted)] uppercase font-bold block">Extraction Time</span>
                    <span className="text-xs font-bold text-[var(--coffee-espresso)]">{guide.time}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => openBrewModal(guide.id)}
                    className="px-6 py-3.5 bg-[var(--coffee-espresso)] text-[var(--coffee-cream)] hover:bg-[var(--coffee-roast)] rounded-xl text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-2 shadow-sm cursor-pointer hover:translate-y-[-1px]"
                  >
                    <span>Open Interactive Ratio Calculator & Timer</span>
                    <ArrowUpRight className="w-4 h-4 text-[var(--coffee-caramel)]" />
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
