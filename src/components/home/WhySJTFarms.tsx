import React from 'react';
import { Award, Compass, Sparkles, HeartHandshake, ShieldCheck } from 'lucide-react';

export const WhySJTFarms: React.FC = () => {
  const pillars = [
    {
      number: '01',
      title: 'QUALITY FIRST',
      subtitle: 'Rigorous Cherry Selection',
      desc: 'Only fully ripe, crimson coffee cherries handpicked at optimal sugar brix levels are selected. Every lot undergoes meticulous flotation and sorting to eliminate defects before pulping.',
      icon: Award,
    },
    {
      number: '02',
      title: 'FARM TO CUP',
      subtitle: 'Direct Single-Estate Traceability',
      desc: 'Zero middlemen or anonymous commodity auctions. We bring the harvest directly from shade-grown plantation slopes to our micro-roastery, preserving unique regional terroir.',
      icon: Compass,
    },
    {
      number: '03',
      title: 'FRESHNESS MATTERS',
      subtitle: 'Small-Batch Precision Roasting',
      desc: 'Coffee is an agricultural harvest that breathes. We roast in micro-batches and seal immediately in airtight foil pouches with one-way degassing valves to lock in delicate aromatics.',
      icon: Sparkles,
    },
    {
      number: '04',
      title: 'CRAFTED WITH CARE',
      subtitle: 'Honouring Indian Kaapi Heritage',
      desc: 'Whether calibrating our signature chicory ratios for dense, velvety decoction or roast profiling 100% pure single estates, our craft honours both ancestral wisdom and modern precision.',
      icon: HeartHandshake,
    },
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-[#F7F1E8] border-b border-[#DED2C4]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* SECTION HEADER */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <span className="text-xs font-bold text-[#A66A3F] uppercase tracking-[0.25em] block mb-2 font-sans">
            Our Guiding Pillars
          </span>
          <h2 className="heading-section text-[#2B211C] tracking-tight">
            WHY SJT FARMS?
          </h2>
          <p className="text-sm sm:text-base text-[#6D625B] mt-2 font-normal">
            Rooted in our passion for Indian specialty coffee. Every decision we make is guided by four unshakeable commitments to your cup.
          </p>
        </div>

        {/* 4 LARGE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="group relative bg-[#FCFAF6] p-6 sm:p-7 rounded-2xl border border-[#DED2C4] shadow-warm-sm hover:shadow-warm-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  {/* Number & Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-serif text-3xl font-bold text-[#A66A3F] group-hover:text-[#2A1812] transition-colors">
                      {pillar.number}
                    </span>
                    <div className="w-12 h-12 rounded-xl bg-[#F7F1E8] flex items-center justify-center text-[#2B211C] group-hover:bg-[#2A1812] group-hover:text-[#EFE3D2] transition-colors border border-[#DED2C4]">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-[#A66A3F] uppercase tracking-wider block mb-1">
                    {pillar.subtitle}
                  </span>
                  <h3 className="font-serif text-lg font-bold text-[#2B211C] group-hover:text-[#704A32] transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-[#6D625B] mt-3 leading-relaxed font-sans">
                    {pillar.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#DED2C4]/60 flex items-center gap-1.5 text-[11px] font-semibold text-[#A66A3F]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>SJT Farms Verified Standard</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
