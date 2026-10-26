import React from 'react';
import { Sprout, Cherry, Sparkles, Flame, Sliders, PackageCheck, Coffee, ArrowRight } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';

export const FarmStory: React.FC = () => {
  const { navigateTo } = useNavigation();

  const journeySteps = [
    { name: 'FARM', desc: 'Shade canopy & mountain soil', icon: Sprout },
    { name: 'HARVEST', desc: 'Selective crimson cherry picking', icon: Cherry },
    { name: 'PROCESS', desc: 'Mountain spring water washed', icon: Sparkles },
    { name: 'ROAST', desc: 'Micro-batch thermal profiling', icon: Flame },
    { name: 'GRIND', desc: 'Precision burr particle calibration', icon: Sliders },
    { name: 'PACK', desc: 'Degassing valve aroma lock', icon: PackageCheck },
    { name: 'YOUR CUP', desc: 'Pure morning satisfaction', icon: Coffee },
  ];

  return (
    <section className="relative py-14 sm:py-20 lg:py-24 bg-[#2A1812] text-white overflow-hidden border-b border-[#3B2418]/30">
      {/* Background Plantation Image with dark cinematic overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/sjt_farm_plantation.jpg"
          alt="SJT Farms Shade Grown Coffee Plantation Western Ghats"
          width={1920}
          height={1080}
          className="w-full h-full object-cover opacity-25 mix-blend-luminosity scale-100 transition-transform duration-1000 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2A1812] via-[#2A1812]/85 to-[#2A1812]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* EDITORIAL HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <span className="text-xs font-bold text-[#A66A3F] uppercase tracking-[0.25em] block mb-2 font-sans">
            Our Estate Story
          </span>
          <h2 className="heading-section text-[#FCFAF6] tracking-tight">
            WHERE EVERY CUP BEGINS
          </h2>
          <p className="text-sm sm:text-base text-[#EFE3D2]/80 mt-2 font-normal font-sans leading-relaxed">
            "Behind every cup is a story of farms, people, patience and careful craftsmanship."
          </p>
        </div>

        {/* HORIZONTAL VISUAL JOURNEY */}
        <div className="mt-6 sm:mt-10 bg-[#3B2418]/40 backdrop-blur-md rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#A66A3F]/30 shadow-warm-lg">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-6 text-center relative">
            {journeySteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="flex flex-col items-center group">
                  {/* Step circle */}
                  <div className="w-14 h-14 rounded-2xl bg-[#2A1812] group-hover:bg-[#A66A3F] text-[#EFE3D2] group-hover:text-white flex items-center justify-center border border-[#A66A3F]/40 transition-all duration-300 shadow-warm-sm group-hover:scale-105 mb-3 cursor-pointer">
                    <Icon className="w-6 h-6 transition-transform group-hover:rotate-6" />
                  </div>

                  <span className="text-[10px] font-bold text-[#A66A3F] uppercase tracking-wider mb-1">
                    0{idx + 1}
                  </span>
                  <h4 className="font-serif text-sm font-bold text-white group-hover:text-[#EFE3D2] transition-colors">
                    {step.name}
                  </h4>
                  <p className="text-[11px] text-[#F7F1E8]/70 mt-1 leading-snug">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 pt-8 border-t border-[#A66A3F]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs sm:text-sm text-[#F7F1E8]/80 max-w-xl text-center sm:text-left">
              From the canopy of silver oaks to your morning breakfast table, every bean is handled with devotion to terroir and tradition.
            </p>
            <button
              onClick={() => navigateTo('our-farm')}
              className="w-full sm:w-auto px-6 py-3 bg-[#A66A3F] hover:bg-[#8B5E3C] text-[#FCFAF6] rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 shadow-warm-sm cursor-pointer"
            >
              <span>Read Full Farm Story</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
