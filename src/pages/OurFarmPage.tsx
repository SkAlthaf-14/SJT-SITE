import React from 'react';
import { Trees, Sun, Droplets, HeartHandshake, ArrowRight, Camera, Sparkles, MapPin, CheckCircle2 } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { SITE_CONFIG } from '../data/siteConfig';
import { COFFEE_IMAGES } from '../data/images';

export const OurFarmPage: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <div className="bg-[#F7F2EA] min-h-screen py-8 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24">
        
        {/* 1. HERO FARM IMAGE SECTION */}
        <section className="relative rounded-3xl overflow-hidden bg-[#170C08] text-white p-8 sm:p-14 lg:p-20 shadow-2xl border border-[#342017]">
          <img
            src={COFFEE_IMAGES.hero.plantation.url}
            alt={COFFEE_IMAGES.hero.plantation.alt}
            className="absolute inset-0 w-full h-full object-cover opacity-45 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#170C08] via-[#170C08]/85 to-transparent" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs font-bold text-[#DFBF82] uppercase tracking-[0.25em] block font-sans">
              Estate Heritage • Shade Canopy
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              FROM OUR FARM. TO YOUR PERFECT CUP.
            </h1>
            <p className="text-sm sm:text-base text-[#EDE2D2]/85 leading-relaxed font-sans font-normal">
              Rooted in the fertile mountain slopes of South India, SJT Farms is dedicated to cultivating coffee under natural multi-tier forest shade, celebrating honest agricultural craft.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#342017]/80 text-[#DFBF82] text-xs border border-[#C49A5A]/30">
                <MapPin className="w-3.5 h-3.5 text-[#C49A5A]" />
                <span>{SITE_CONFIG.contact.farmLocation}</span>
              </span>
            </div>
          </div>
        </section>

        {/* 2. OUR STORY */}
        <section className="bg-white rounded-3xl p-8 sm:p-12 lg:p-16 border border-[#E4D8C8] shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold text-[#A37936] uppercase tracking-[0.2em] block font-sans">
                Our Genesis & Mission
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#201814]">
                OUR STORY
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-[#6B5B52] leading-relaxed">
                <p>
                  SJT Farms was born out of a profound passion for preserving authentic South Indian coffee terroir. While commercial brands often rely on long-stored beans and excessive fillers, our mission is straightforward: grow exceptional coffee, roast it in small batches, and ship it fresh directly to coffee lovers.
                </p>
                <div className="p-4 bg-[var(--coffee-cream)]/70 rounded-2xl border border-[var(--coffee-border)] text-xs text-[var(--coffee-espresso)] font-medium leading-relaxed">
                  Every harvest season, our cherries are hand-selected at peak brix sweetness, washed in fresh mountain water, and patio dried under natural sunlight to honor the soil and every cup we serve.
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-[#24150F] shadow-md border border-[#E4D8C8]">
                <img
                  src={COFFEE_IMAGES.journey.coffeeCherry.url}
                  alt={COFFEE_IMAGES.journey.coffeeCherry.alt}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 3. THE FARM */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-[#A37936] uppercase tracking-[0.25em] block mb-2 font-sans">
              Terroir & Climate
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#201814]">
              THE FARM
            </h2>
            <p className="text-xs sm:text-sm text-[#6B5B52] mt-2">
              Our trees grow in symbiotic balance with native trees, mountain mist, and nutrient-dense soil.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-7 rounded-3xl border border-[#E4D8C8] shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F7F2EA] flex items-center justify-center text-[#24150F] border border-[#E4D8C8]">
                <Trees className="w-6 h-6 text-[#C49A5A]" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#201814]">Shade Agroforestry</h3>
              <p className="text-xs text-[#6B5B52] leading-relaxed">
                Silver oaks, wild figs, and jackfruit trees shelter our plants from severe heat, preserving soil moisture and encouraging slow cherry maturation.
              </p>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-[#E4D8C8] shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F7F2EA] flex items-center justify-center text-[#24150F] border border-[#E4D8C8]">
                <Sun className="w-6 h-6 text-[#C49A5A]" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#201814]">Altitude & Elevation</h3>
              <p className="text-xs text-[#6B5B52] leading-relaxed">
                Cool mountain nights and sunny mornings at high elevation allow bean sugars to synthesize gently, yielding natural sweet cocoa cup profiles.
              </p>
              <span className="text-[11px] text-[#A37936] font-semibold block">
                Elevation: {SITE_CONFIG.contact.farmElevation}
              </span>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-[#E4D8C8] shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F7F2EA] flex items-center justify-center text-[#24150F] border border-[#E4D8C8]">
                <Droplets className="w-6 h-6 text-[#C49A5A]" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#201814]">Mountain Spring Water</h3>
              <p className="text-xs text-[#6B5B52] leading-relaxed">
                Fresh gravity-fed mountain streams provide clean, mineral-balanced water for gentle cherry washing and fermentation on the estate grounds.
              </p>
            </div>
          </div>
        </section>

        {/* 4. COFFEE PLANTS & CULTIVATION */}
        <section className="bg-white rounded-3xl p-8 sm:p-12 lg:p-14 border border-[#E4D8C8] shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 order-2 lg:order-1">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-[#24150F] shadow-md border border-[#E4D8C8]">
                <img
                  src={COFFEE_IMAGES.journey.coffeePlant.url}
                  alt={COFFEE_IMAGES.journey.coffeePlant.alt}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4 order-1 lg:order-2">
              <span className="text-xs font-bold text-[#A37936] uppercase tracking-[0.2em] block font-sans">
                Botanical Precision
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#201814]">
                COFFEE PLANTS & BOTANICAL VARIETIES
              </h2>
              <p className="text-xs sm:text-sm text-[#6B5B52] leading-relaxed">
                We nurture carefully selected Arabica and high-altitude Robusta cultivars chosen specifically for cup clarity, natural disease resistance, and rich body. Arabica delivers floral brightness and delicate sweetness, while shade-grown Robusta imparts thick crema and enduring depth.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <span className="px-3 py-1.5 rounded-xl bg-[#F7F2EA] border border-[#E4D8C8] text-xs font-semibold text-[#201814]">
                  Arabica Selection 795
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-[#F7F2EA] border border-[#E4D8C8] text-xs font-semibold text-[#201814]">
                  Old Paradenia Clones
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-[#F7F2EA] border border-[#E4D8C8] text-xs font-semibold text-[#201814]">
                  Highland CxR Robusta
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. HARVESTING */}
        <section className="bg-white rounded-3xl p-8 sm:p-12 lg:p-14 border border-[#E4D8C8] shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold text-[#A37936] uppercase tracking-[0.2em] block font-sans">
                Human Artistry
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#201814]">
                SELECTIVE HARVESTING
              </h2>
              <p className="text-xs sm:text-sm text-[#6B5B52] leading-relaxed">
                No machines can replicate the discernment of human touch. During harvest season (November to February), our pickers return to the same coffee trees up to four times, plucking only uniformly crimson cherries with high brix sweetness and leaving greener cherries to continue ripening.
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-800 font-semibold bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 w-fit">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Zero mechanical stripping • 100% Selective Handpicked</span>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-[#24150F] shadow-md border border-[#E4D8C8]">
                <img
                  src={COFFEE_IMAGES.journey.harvest.url}
                  alt={COFFEE_IMAGES.journey.harvest.alt}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 6. PROCESSING & DRYING */}
        <section className="bg-white rounded-3xl p-8 sm:p-12 lg:p-14 border border-[#E4D8C8] shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 order-2 lg:order-1">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-[#24150F] shadow-md border border-[#E4D8C8]">
                <img
                  src={COFFEE_IMAGES.journey.drying.url}
                  alt={COFFEE_IMAGES.journey.drying.alt}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4 order-1 lg:order-2">
              <span className="text-xs font-bold text-[#A37936] uppercase tracking-[0.2em] block font-sans">
                Washing & Terracotta Drying
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#201814]">
                ESTATE PROCESSING & DRYING
              </h2>
              <p className="text-xs sm:text-sm text-[#6B5B52] leading-relaxed">
                Immediately after harvest, cherries are floated to remove light defect beans, de-pulped, and naturally fermented in spring water. The parchment coffee is then raked across open terracotta patios under warm sunlight for 9 to 12 days, reaching a stable 11% moisture level for lasting freshness.
              </p>
              <div className="flex items-center gap-2 text-xs text-amber-800 font-semibold bg-amber-50 px-3.5 py-2 rounded-xl border border-amber-200 w-fit">
                <Sun className="w-4 h-4 text-amber-700" />
                <span>Slow sun-drying with hourly hand-raking</span>
              </div>
            </div>
          </div>
        </section>

        {/* 7. ROASTING */}
        <section className="bg-white rounded-3xl p-8 sm:p-12 lg:p-14 border border-[#E4D8C8] shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold text-[#A37936] uppercase tracking-[0.2em] block font-sans">
                Roastery Floor
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#201814]">
                ARTISANAL MICRO-BATCH ROASTING
              </h2>
              <p className="text-xs sm:text-sm text-[#6B5B52] leading-relaxed">
                Roasting is where farm terroir turns into aroma. We roast in micro-batches using slow convective heat curves, unlocking cocoa richness, nuttiness, and caramelized brown sugars without scorching the bean surface.
              </p>
              <div className="flex items-center gap-2 text-xs text-[#24150F] font-semibold bg-[#EDE2D2] px-3.5 py-2 rounded-xl border border-[#E4D8C8] w-fit">
                <Sparkles className="w-4 h-4 text-[#A37936]" />
                <span>Weekly roast schedule for guaranteed cup freshness</span>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-[#24150F] shadow-md border border-[#E4D8C8]">
                <img
                  src={COFFEE_IMAGES.journey.roasting.url}
                  alt={COFFEE_IMAGES.journey.roasting.alt}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 8. FROM FARM TO CUP */}
        <section className="bg-[#24150F] rounded-3xl p-8 sm:p-12 lg:p-16 text-white text-center border border-[#342017] shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <span className="text-xs font-bold text-[#DFBF82] uppercase tracking-[0.25em] block font-sans">
              Direct Transparency
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
              FROM FARM TO CUP
            </h2>
            <p className="text-xs sm:text-sm text-[#EDE2D2]/80 leading-relaxed font-sans">
              By controlling every step from nursery saplings to final milling and airtight pouch sealing, SJT Farms eliminates intermediaries. You receive coffee that was nurtured on our farm and roasted just days ago.
            </p>
            <div className="pt-4">
              <button
                onClick={() => navigateTo('shop')}
                className="px-8 py-3.5 bg-[#C49A5A] text-[#170C08] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#DFBF82] transition-colors inline-flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <span>Taste Fresh Roasts</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* 9. PHOTO GALLERY */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#A37936] uppercase tracking-[0.25em] mb-2 font-sans">
              <Camera className="w-3.5 h-3.5" />
              <span>Estate Moments</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#201814]">
              FARM PHOTO GALLERY
            </h2>
            <p className="text-xs sm:text-sm text-[#6B5B52] mt-2">
              Authentic scenes captured on our plantation trails, drying floors, and cupping tables.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {COFFEE_IMAGES.farmGallery.map((item) => (
              <div
                key={item.id}
                className="group relative aspect-[4/3] rounded-3xl overflow-hidden bg-[#24150F] border border-[#E4D8C8] shadow-sm hover:shadow-xl transition-all"
              >
                <img
                  src={item.url}
                  alt={item.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#24150F]/90 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-[10px] font-bold text-[#DFBF82] uppercase tracking-wider block mb-1">
                    {item.category}
                  </span>
                  <p className="font-serif text-sm font-bold text-white">
                    {item.caption || item.alt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};
