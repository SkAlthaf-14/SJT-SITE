import React from 'react';
import { Sun, CloudSun, Moon, ArrowRight } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';

export const CoffeeExperience: React.FC = () => {
  const { navigateTo } = useNavigation();

  const rituals = [
    {
      time: 'MORNING',
      title: 'Start Slow',
      desc: 'The quiet dawn silence, the first deep breath of roasting chicory, and the sacred slow-drip extraction of thick golden decoction.',
      blend: 'SJT Signature & Traditional Brass Tumbler',
      icon: Sun,
      image: '/images/products/jars/araku-signature-100g-jar.png',
    },
    {
      time: 'AFTERNOON',
      title: 'Take a Moment',
      desc: 'A mindful pause between creative work. A balanced medium roast that gently resets your focus with smooth almond and caramel nuances.',
      blend: 'SJT Special Blend (100% Pure Pour Over)',
      icon: CloudSun,
      image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1000&auto=format&fit=crop',
    },
    {
      time: 'EVENING',
      title: 'End Well',
      desc: 'Unwinding after sunset. A chilled 16-hour cold brew over hand-cut ice, or a velvety light splash of milk with friends.',
      blend: 'SJT Cold Brew Blend & Heritage Dark',
      icon: Moon,
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1000&auto=format&fit=crop',
    },
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-[#FCFAF6] border-b border-[#DED2C4]/60 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* SECTION HEADER */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <span className="text-xs font-bold text-[#A66A3F] uppercase tracking-[0.25em] block mb-2 font-sans">
            The Daily Symphony
          </span>
          <h2 className="heading-section text-[#2B211C] tracking-tight">
            NOT JUST COFFEE.{' '}
            <span className="italic font-serif font-normal text-[#A66A3F] block">
              A DAILY RITUAL.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-[#6D625B] mt-2 font-normal">
            Coffee is more than caffeine—it is the punctuation marks in your day. Discover how each blend elevates a distinct moment.
          </p>
        </div>

        {/* 3 LIFESTYLE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {rituals.map((ritual, idx) => {
            const Icon = ritual.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-2xl overflow-hidden bg-white border border-[#DED2C4] shadow-warm-sm hover:shadow-warm-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
              >
                {/* Visual Image with gradient */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#2A1812]">
                  <img
                    src={ritual.image}
                    alt={ritual.title}
                    width={400}
                    height={300}
                    loading="lazy"
                    className={`w-full h-full object-center transition-transform duration-500 group-hover:scale-105 ${
                      ritual.image.includes('/jars/')
                        ? 'object-contain p-3.5 sm:p-4 filter drop-shadow-[0_12px_20px_rgba(0,0,0,0.45)]'
                        : 'object-cover'
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Time Badge */}
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-[#2A1812]/90 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-[10px] font-bold tracking-widest border border-[#A66A3F]/30">
                    <Icon className="w-3.5 h-3.5 text-[#EFE3D2]" />
                    <span>{ritual.time}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-[#2B211C] group-hover:text-[#704A32] transition-colors">
                      "{ritual.title}"
                    </h3>
                    <p className="text-xs text-[#6D625B] mt-2.5 leading-relaxed font-sans">
                      {ritual.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#DED2C4]/60">
                    <span className="text-[10px] uppercase font-bold text-[#A66A3F] block tracking-wider">
                      Recommended Pairing:
                    </span>
                    <p className="text-xs font-semibold text-[#2B211C] mt-0.5">
                      {ritual.blend}
                    </p>

                    <button
                      onClick={() => navigateTo('shop')}
                      className="mt-4 w-full py-2.5 px-4 bg-[#F7F1E8] hover:bg-[#2A1812] hover:text-[#FCFAF6] text-[#2B211C] text-xs font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 group/btn border border-[#DED2C4] cursor-pointer"
                    >
                      <span>Explore This Routine</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
