import React from 'react';
import { Sprout, Coffee, Sparkles, ShieldCheck } from 'lucide-react';
import { SITE_CONFIG } from '../../data/siteConfig';

export const TrustBar: React.FC = () => {
  // Dynamically map icon names from central configuration
  const iconMap: Record<string, React.ElementType> = {
    Sprout,
    Coffee,
    Sparkles,
    ShieldCheck,
  };

  const trustItems = SITE_CONFIG.trustFeatures;

  return (
    <div className="w-full bg-[#EDE2D2]/70 border-b border-[#E4D8C8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        <div className="grid grid-cols-1 min-[380px]:grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-6 lg:gap-8">
          {trustItems.map((item) => {
            const Icon = iconMap[item.icon] || Coffee;
            return (
              <div
                key={item.id}
                className="flex items-center gap-2 sm:gap-3 group transition-transform duration-300 hover:-translate-y-0.5"
              >
                <div className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 rounded-xl sm:rounded-2xl bg-white flex items-center justify-center text-[#24150F] group-hover:text-[#DFBF82] group-hover:bg-[#24150F] transition-all duration-300 border border-[#E4D8C8] shadow-xs">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:scale-110 text-[#C49A5A]" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-[#201814] tracking-wide font-sans">
                    {item.title}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-[#6B5B52] font-normal leading-tight mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
