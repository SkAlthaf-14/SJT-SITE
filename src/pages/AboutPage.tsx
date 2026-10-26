import React from 'react';
import { Coffee, ShieldCheck, Heart, Sparkles, Award, ArrowRight } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

export const AboutPage: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <div className="bg-[var(--coffee-bg)] min-h-screen py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[var(--coffee-caramel)] uppercase tracking-[0.25em] mb-2 font-sans">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The SJT Legacy</span>
          </div>
          <h1 className="heading-section text-[var(--coffee-espresso)]">
            ROOTED IN THE FARM.{' '}
            <span className="block text-[var(--coffee-caramel)] italic font-serif font-normal">
              ROASTED FOR YOU.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-[var(--coffee-muted)] mt-4 font-normal leading-relaxed">
            SJT Farms was founded on a simple truth: Great Indian filter coffee shouldn't rely on mass-produced supermarket dust. It deserves the respect of single-origin farming, precision roasting, and fresh degassing.
          </p>
        </div>

        {/* STORY / FOUNDING VISION */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 lg:p-16 border border-[var(--coffee-border)] shadow-xs mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-bold text-[var(--coffee-caramel)] uppercase tracking-wider block font-sans">
                Our Philosophy
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[var(--coffee-espresso)]">
                Bridging Generations of South Indian Kaapi Culture
              </h2>
              <p className="text-xs sm:text-sm text-[var(--coffee-muted)] leading-relaxed">
                For generations, the slow drip of a brass filter has anchored South Indian households before sunrise. But as commercial powders substituted genuine estate coffee with filler beans and stale stockpiles, the magic faded.
              </p>
              <p className="text-xs sm:text-sm text-[var(--coffee-muted)] leading-relaxed">
                SJT Farms was conceived to restore that golden aroma. By sourcing directly from shade canopy farms in the Western Ghats and roasting in micro-batches, we preserve the nutty cocoa sweetness that made traditional kaapi a beloved daily ritual.
              </p>
            </div>

            <div className="lg:col-span-6">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-[var(--coffee-bg)] border border-[var(--coffee-border)] shadow-warm-sm">
                <img
                  src="/images/products/jars/araku-signature-100g-jar.png"
                  alt="SJT Farms Araku Signature Coffee Bottle"
                  loading="lazy"
                  className="w-full h-full object-contain p-4 sm:p-6 transition-transform duration-500 hover:scale-105 filter drop-shadow-[0_16px_24px_rgba(42,24,18,0.2)]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* CORE VALUES */}
        <div className="mb-16">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="heading-card text-[var(--coffee-espresso)] text-2xl sm:text-3xl">
              OUR GUIDING VALUES
            </h2>
            <p className="text-xs text-[var(--coffee-muted)] mt-2">
              Every package leaving our estate carries our stamp of integrity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-7 rounded-3xl border border-[var(--coffee-border)] shadow-xs space-y-3 text-center hover:border-[var(--coffee-caramel)]/50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-[var(--coffee-cream)] flex items-center justify-center text-[var(--coffee-espresso)] mx-auto border border-[var(--coffee-border)]/50">
                <Coffee className="w-6 h-6 text-[var(--coffee-caramel)]" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[var(--coffee-espresso)]">Purity of Roast</h3>
              <p className="text-xs text-[var(--coffee-muted)] leading-relaxed">
                No chemical flavouring, no burnt over-roasting to mask stale beans. Just pure caramelization of fresh estate sugars.
              </p>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-[var(--coffee-border)] shadow-xs space-y-3 text-center hover:border-[var(--coffee-caramel)]/50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-[var(--coffee-cream)] flex items-center justify-center text-[var(--coffee-espresso)] mx-auto border border-[var(--coffee-border)]/50">
                <Award className="w-6 h-6 text-[var(--coffee-caramel)]" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[var(--coffee-espresso)]">Traceable Origin</h3>
              <p className="text-xs text-[var(--coffee-muted)] leading-relaxed">
                We celebrate the terroir of our soil, the altitude of our trees, and the people whose hands lovingly cultivate every berry.
              </p>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-[var(--coffee-border)] shadow-xs space-y-3 text-center hover:border-[var(--coffee-caramel)]/50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-[var(--coffee-cream)] flex items-center justify-center text-[var(--coffee-espresso)] mx-auto border border-[var(--coffee-border)]/50">
                <ShieldCheck className="w-6 h-6 text-[var(--coffee-caramel)]" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[var(--coffee-espresso)]">Freshness Assurance</h3>
              <p className="text-xs text-[var(--coffee-muted)] leading-relaxed">
                Dispatched promptly with freshness degassing valves so that the first morning scoop smells like a roastery floor.
              </p>
            </div>
          </div>
        </div>

        {/* BOTTOM CTA */}
        <div className="text-center bg-[var(--coffee-espresso)] text-white rounded-3xl p-8 sm:p-14 border border-[var(--coffee-roast)] shadow-warm-lg">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--coffee-cream)]">
            Ready to Taste the Difference?
          </h2>
          <p className="text-xs sm:text-sm text-[var(--coffee-cream)]/80 mt-2 max-w-md mx-auto">
            Order your fresh pouch today and receive express doorstep delivery across India.
          </p>
          <button
            onClick={() => navigateTo('shop')}
            className="mt-6 px-8 py-3.5 bg-[var(--coffee-caramel)] text-[var(--coffee-espresso)] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[var(--coffee-cream)] transition-all inline-flex items-center gap-2 cursor-pointer shadow-md hover:translate-y-[-1px]"
          >
            <span>Explore Our Roasts</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
