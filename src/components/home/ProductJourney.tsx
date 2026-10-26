import React, { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { COFFEE_IMAGES } from '../../data/images';
import { useNavigation } from '../../context/NavigationContext';

export const ProductJourney: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const { navigateTo } = useNavigation();

  const journeySteps = [
    {
      num: '01',
      title: 'Coffee Plant',
      tag: 'Forest Agroforestry',
      desc: 'Our coffee begins under the lush, double-tiered natural shade canopy. Trees like jackfruit, silver oak, and wild figs provide dappled sunlight and rich fallen-leaf humus, allowing roots to draw deep mountain minerals.',
      highlight: 'Shade-grown under native mountain trees',
      image: COFFEE_IMAGES.journey.coffeePlant.url,
      alt: COFFEE_IMAGES.journey.coffeePlant.alt,
    },
    {
      num: '02',
      title: 'Coffee Cherry',
      tag: 'Ripening & Brix Development',
      desc: 'Over 8 to 9 slow months, white fragrant blossom showers develop into dense clusters of glossy cherries. The slow mountain altitude ripening maximizes natural sucrose development inside the fruit.',
      highlight: 'Naturally high brix sugar concentration',
      image: COFFEE_IMAGES.journey.coffeeCherry.url,
      alt: COFFEE_IMAGES.journey.coffeeCherry.alt,
    },
    {
      num: '03',
      title: 'Harvest',
      tag: 'Selective Handpicking',
      desc: 'Skilled harvesting teams make up to four meticulous passes through each plantation block. Only fully ripe, deep crimson cherries are handpicked, leaving green and yellow cherries to mature on the tree.',
      highlight: '100% hand-harvested ripe cherries',
      image: COFFEE_IMAGES.journey.harvest.url,
      alt: COFFEE_IMAGES.journey.harvest.alt,
    },
    {
      num: '04',
      title: 'Processing',
      tag: 'Mountain Stream Washing',
      desc: 'Harvested cherries are pulped using clean mountain water on the estate. The beans undergo slow, natural fermentation to break down fruit mucilage cleanly, unlocking floral clarity and cocoa sweetness.',
      highlight: 'Pulping & natural fermentation',
      image: COFFEE_IMAGES.journey.processing.url,
      alt: COFFEE_IMAGES.journey.processing.alt,
    },
    {
      num: '05',
      title: 'Drying',
      tag: 'Terracotta Sun Patios',
      desc: 'Parchment coffee is spread evenly across open terracotta patios, hand-raked every hour from dawn to dusk for 9 to 12 days until uniform 11% moisture balance is achieved.',
      highlight: 'Natural sun-drying on open patios',
      image: COFFEE_IMAGES.journey.drying.url,
      alt: COFFEE_IMAGES.journey.drying.alt,
    },
    {
      num: '06',
      title: 'Roasting',
      tag: 'Artisan Micro-Batch',
      desc: 'Resting green beans are roasted in small micro-batches. Our roaster meticulously tailors the thermal heat curve, developing caramelized sugars and velvety body without burning the delicate aromatics.',
      highlight: 'Micro-batch roasting with slow heat curves',
      image: COFFEE_IMAGES.journey.roasting.url,
      alt: COFFEE_IMAGES.journey.roasting.alt,
    },
    {
      num: '07',
      title: 'Grinding',
      tag: 'Precision Burr Milling',
      desc: 'Milled through precision chilled steel burrs to ensure uniform particle geometry without heat friction. Calibrated specifically for dense decoction in South Indian filters and espresso moka pots.',
      highlight: 'Chilled burr grinding for zero heat loss',
      image: COFFEE_IMAGES.journey.grinding.url,
      alt: COFFEE_IMAGES.journey.grinding.alt,
    },
    {
      num: '08',
      title: 'Your Cup',
      tag: 'The Daily Kaapi Ritual',
      desc: 'Boiling water slowly drips through the grounds into thick, aromatic decoction. Froth with hot milk in a traditional brass davara tumbler for a memorable, comforting cup.',
      highlight: 'From our farm to your perfect cup',
      image: COFFEE_IMAGES.journey.yourCup.url,
      alt: COFFEE_IMAGES.journey.yourCup.alt,
    },
  ];

  return (
    <section className="py-10 sm:py-16 lg:py-20 bg-[#F7F2EA] border-b border-[#E4D8C8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <span className="text-xs font-bold text-[#A37936] uppercase tracking-[0.25em] block mb-1.5 font-sans">
            Seed to Sip Journey
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#201814] tracking-tight">
            FROM CHERRY TO CUP PROCESS
          </h2>
          <p className="text-xs sm:text-base text-[#6B5B52] mt-2 font-normal leading-relaxed">
            Follow our 8-step journey from high-elevation shade trees to your breakfast tumbler.
          </p>
        </div>

        {/* 8-STEP HORIZONTAL NAVIGATION */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 justify-start lg:justify-center no-scrollbar">
          {journeySteps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold tracking-wider uppercase transition-all duration-200 shrink-0 flex items-center gap-2 border ${
                activeStep === idx
                  ? 'bg-[#24150F] text-[#DFBF82] border-[#24150F] shadow-md scale-105'
                  : 'bg-white text-[#201814] border-[#E4D8C8] hover:bg-[#EDE2D2]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${activeStep === idx ? 'bg-[#C49A5A]' : 'bg-[#E4D8C8]'}`} />
              <span>{step.num}. {step.title}</span>
            </button>
          ))}
        </div>

        {/* ACTIVE STEP SPOTLIGHT CARD */}
        <div className="bg-white rounded-3xl p-5 sm:p-8 lg:p-12 border border-[#E4D8C8] shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
            {/* Left: Step Description */}
            <div className="lg:col-span-7 space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDE2D2] text-[#24150F] text-[11px] sm:text-xs font-bold uppercase">
                <span>Step {journeySteps[activeStep].num} of 08</span>
                <span>•</span>
                <span>{journeySteps[activeStep].tag}</span>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#24150F]">
                {journeySteps[activeStep].title}
              </h3>

              <p className="text-sm sm:text-base text-[#6B5B52] leading-relaxed font-sans">
                {journeySteps[activeStep].desc}
              </p>

              <div className="flex items-center gap-2.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3.5 py-2.5 rounded-xl border border-emerald-200 w-fit max-w-full">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>{journeySteps[activeStep].highlight}</span>
              </div>

              {/* Step Navigation Controls */}
              <div className="pt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setActiveStep((prev) => (prev + 1) % journeySteps.length)}
                  className="px-6 py-2.5 bg-[#24150F] text-[#DFBF82] rounded-xl text-xs font-semibold hover:bg-[#342017] transition-colors flex items-center gap-1.5"
                >
                  <span>
                    {activeStep === journeySteps.length - 1 ? 'Back to Step 01' : 'Next Journey Milestone'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => navigateTo('shop')}
                  className="px-5 py-2.5 bg-white text-[#201814] border border-[#E4D8C8] hover:border-[#C49A5A] rounded-xl text-xs font-semibold transition-colors"
                >
                  Shop This Roast
                </button>
              </div>
            </div>

            {/* Right: Step Image */}
            <div className="lg:col-span-5">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-[#24150F] border border-[#E4D8C8] shadow-md group">
                <img
                  src={journeySteps[activeStep].image}
                  alt={journeySteps[activeStep].alt}
                  className="w-full h-full object-cover object-center transition-all duration-700 group-hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
