import React from 'react';
import { Clock, Gauge, Coffee, ArrowUpRight, Sparkles } from 'lucide-react';
import { BREW_GUIDES } from '../../data/brewGuides';
import { useNavigation } from '../../context/NavigationContext';

export const BrewYourWay: React.FC = () => {
  const { openBrewModal } = useNavigation();

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-[#FCFAF6] border-b border-[#DED2C4]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* SECTION HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-12">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#A66A3F] uppercase tracking-[0.2em] mb-2 font-sans">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Brewing Lab</span>
            </div>
            <h2 className="heading-section text-[#2B211C] tracking-tight">
              BREW IT YOUR WAY
            </h2>
            <p className="text-sm sm:text-base text-[#6D625B] mt-2 font-normal">
              Whether you cherish thick South Indian filter decoction or the clean clarity of a pour over, our grind guides help you unlock the perfect cup.
            </p>
          </div>

          <div className="text-xs text-[#6D625B] bg-[#F7F1E8] px-4 py-2.5 rounded-xl border border-[#DED2C4]">
            <span className="font-bold text-[#2B211C]">Click any brew method</span> to open ratio calculators & interactive timer
          </div>
        </div>

        {/* 5 BREW CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {BREW_GUIDES.map((guide) => (
            <div
              key={guide.id}
              onClick={() => openBrewModal(guide.id)}
              className="group bg-white rounded-2xl overflow-hidden border border-[#DED2C4] hover:border-[#A66A3F] shadow-warm-sm hover:shadow-warm-md transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
            >
              {/* IMAGE */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#2A1812]">
                <img
                  src={guide.image}
                  alt={guide.name}
                  width={300}
                  height={225}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {/* Arrow indicator */}
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-[#2B211C] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-warm-sm">
                  <ArrowUpRight className="w-4 h-4 text-[#A66A3F]" />
                </div>

                <div className="absolute bottom-2.5 left-3">
                  <span className="text-[10px] font-bold text-[#EFE3D2] uppercase tracking-wider bg-[#2A1812]/85 px-2 py-0.5 rounded backdrop-blur-xs">
                    {guide.time}
                  </span>
                </div>
              </div>

              {/* CARD BODY */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold text-[#2B211C] group-hover:text-[#704A32] transition-colors">
                    {guide.name}
                  </h3>
                  <p className="text-[11px] text-[#6D625B] mt-1.5 line-clamp-2 leading-relaxed">
                    {guide.shortDesc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#DED2C4]/60 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-[#6D625B]">
                    <span className="flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-[#A66A3F]" /> Strength:
                    </span>
                    <span className="font-semibold text-[#2B211C]">{guide.strength}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#6D625B]">
                    <span className="flex items-center gap-1">
                      <Coffee className="w-3 h-3 text-[#A66A3F]" /> Grind:
                    </span>
                    <span className="font-semibold text-[#2B211C] truncate max-w-[100px] text-right">
                      {guide.grind}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="mt-4 w-full py-2 bg-[#F7F1E8] group-hover:bg-[#2A1812] text-[#2B211C] group-hover:text-[#EFE3D2] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Interactive Guide</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
