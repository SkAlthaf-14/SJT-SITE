import React, { useState, useEffect } from 'react';
import { X, Clock, Flame, Scale, Thermometer, Play, Pause, RotateCcw, Lightbulb, ChevronRight } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { BREW_GUIDES } from '../../data/brewGuides';
import { PRODUCTS } from '../../data/products';
import { useCart } from '../../context/CartContext';
import { useBodyScrollLock } from '../../utils/scrollLock';

export const BrewDetailModal: React.FC = () => {
  const { activeBrewId, closeBrewModal, navigateTo } = useNavigation();
  const { addItem } = useCart();

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [scaleMultiplier, setScaleMultiplier] = useState(1); // 1x, 2x, 4x cups

  const guide = BREW_GUIDES.find((g) => g.id === activeBrewId);

  // Lock background scroll when guide modal is open
  useBodyScrollLock(Boolean(guide), 'brew-detail-modal');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && guide) {
        closeBrewModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [guide, closeBrewModal]);

  useEffect(() => {
    setActiveStepIndex(0);
    setTimerSeconds(0);
    setIsTimerRunning(false);
    setScaleMultiplier(1);
  }, [activeBrewId]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  if (!guide) return null;

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Find a matching recommended product
  const recommendedProduct =
    PRODUCTS.find((p) => p.brewMethods.includes(guide.name)) || PRODUCTS[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${guide.name} Masterclass Guide`}
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/60 backdrop-blur-xs p-3 sm:p-6 animate-fade-in"
    >
      <div className="fixed inset-0" onClick={closeBrewModal} aria-hidden="true" />

      <div className="min-h-full flex items-start sm:items-center justify-center py-4 sm:py-6">
        <div className="relative bg-[var(--coffee-warm-white)] w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-[var(--coffee-border)] z-10 my-auto">
        {/* Header with image banner */}
        <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-[var(--coffee-espresso)]">
          <img
            src={guide.image}
            alt={guide.name}
            className="w-full h-full object-cover opacity-60 mix-blend-luminosity scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--coffee-espresso)] via-[var(--coffee-espresso)]/60 to-transparent" />

          {/* Close button */}
          <button
            onClick={closeBrewModal}
            className="absolute top-4 right-4 z-20 p-2 bg-white/20 hover:bg-white text-white hover:text-[var(--coffee-espresso)] rounded-full backdrop-blur-md transition-colors shadow-sm"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 right-6">
            <span className="text-[10px] font-bold text-[var(--coffee-caramel)] uppercase tracking-widest bg-[var(--coffee-espresso)]/60 px-2.5 py-1 rounded-full border border-[var(--coffee-caramel)]/30 backdrop-blur-md">
              SJT Masterclass Guide
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
              {guide.name}
            </h2>
            <p className="text-xs text-[var(--coffee-cream)]/90 mt-1 max-w-xl">
              {guide.shortDesc}
            </p>
          </div>
        </div>

        {/* METRICS & PARAMETERS BAR */}
        <div className="p-4 sm:p-6 bg-white border-b border-[var(--coffee-border)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-[var(--coffee-espresso)] uppercase tracking-wider">
              Brew Parameters
            </h3>
            {/* Multiplier */}
            <div className="flex items-center gap-1 bg-[var(--coffee-cream)]/50 p-1 rounded-xl border border-[var(--coffee-border)]">
              <span className="text-[10px] font-semibold text-[var(--coffee-text-muted)] px-1.5">Servings:</span>
              {[1, 2, 4].map((mult) => (
                <button
                  key={mult}
                  onClick={() => setScaleMultiplier(mult)}
                  className={`text-xs px-2 py-0.5 rounded-lg font-medium transition-all ${
                    scaleMultiplier === mult
                      ? 'bg-[var(--coffee-espresso)] text-white shadow-xs'
                      : 'text-[var(--coffee-text)] hover:bg-[var(--coffee-cream)]'
                  }`}
                >
                  {mult}x
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[var(--coffee-warm-white)] p-3 rounded-xl border border-[var(--coffee-border)] flex items-center gap-2.5">
              <Scale className="w-4 h-4 text-[var(--coffee-caramel)] shrink-0" />
              <div>
                <span className="text-[10px] text-[var(--coffee-text-muted)] block font-medium">Coffee</span>
                <span className="text-xs font-bold text-[var(--coffee-espresso)]">
                  {guide.coffeeRatio}
                </span>
              </div>
            </div>

            <div className="bg-[var(--coffee-warm-white)] p-3 rounded-xl border border-[var(--coffee-border)] flex items-center gap-2.5">
              <Flame className="w-4 h-4 text-[var(--coffee-caramel)] shrink-0" />
              <div>
                <span className="text-[10px] text-[var(--coffee-text-muted)] block font-medium">Water Ratio</span>
                <span className="text-xs font-bold text-[var(--coffee-espresso)]">
                  {guide.waterRatio}
                </span>
              </div>
            </div>

            <div className="bg-[var(--coffee-warm-white)] p-3 rounded-xl border border-[var(--coffee-border)] flex items-center gap-2.5">
              <Thermometer className="w-4 h-4 text-[var(--coffee-caramel)] shrink-0" />
              <div>
                <span className="text-[10px] text-[var(--coffee-text-muted)] block font-medium">Water Temp</span>
                <span className="text-xs font-bold text-[var(--coffee-espresso)]">{guide.temp}</span>
              </div>
            </div>

            <div className="bg-[var(--coffee-warm-white)] p-3 rounded-xl border border-[var(--coffee-border)] flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-[var(--coffee-caramel)] shrink-0" />
              <div>
                <span className="text-[10px] text-[var(--coffee-text-muted)] block font-medium">Brew Time</span>
                <span className="text-xs font-bold text-[var(--coffee-espresso)]">{guide.time}</span>
              </div>
            </div>
          </div>
        </div>

        {/* STEP BY STEP INTERACTIVE GUIDE */}
        <div className="p-4 sm:p-6 space-y-6 max-h-[50vh] overflow-y-auto overscroll-contain">
          {/* Progress bar across steps */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--coffee-text-muted)] mb-2">
              <span>Step {activeStepIndex + 1} of {guide.steps.length}</span>
              <span>{Math.round(((activeStepIndex + 1) / guide.steps.length) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-[var(--coffee-cream)] h-2 rounded-full overflow-hidden flex gap-1 p-0.5">
              {guide.steps.map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveStepIndex(idx)}
                  className={`h-full flex-1 rounded-full cursor-pointer transition-all duration-300 ${
                    idx <= activeStepIndex ? 'bg-[var(--coffee-caramel)]' : 'bg-[var(--coffee-border)]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Current Step Card */}
          <div className="bg-white p-5 rounded-2xl border border-[var(--coffee-border)] shadow-xs">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-7 h-7 rounded-full bg-[var(--coffee-espresso)] text-white text-xs font-bold flex items-center justify-center">
                0{activeStepIndex + 1}
              </span>
              <h4 className="font-serif text-lg font-bold text-[var(--coffee-espresso)]">
                {guide.steps[activeStepIndex].title}
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-[var(--coffee-text-muted)] leading-relaxed pl-10">
              {guide.steps[activeStepIndex].description}
            </p>

            {/* Stepper buttons */}
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-[var(--coffee-border)] pl-10">
              <button
                disabled={activeStepIndex === 0}
                onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-[var(--coffee-border)] text-[var(--coffee-espresso)] disabled:opacity-40 hover:bg-[var(--coffee-cream)]/50 transition-colors"
              >
                Previous Step
              </button>
              <button
                onClick={() =>
                  setActiveStepIndex((prev) =>
                    prev < guide.steps.length - 1 ? prev + 1 : 0
                  )
                }
                className="text-xs font-semibold px-4 py-1.5 rounded-xl bg-[var(--coffee-espresso)] text-white hover:bg-[var(--coffee-deep)] transition-colors flex items-center gap-1.5"
              >
                <span>{activeStepIndex === guide.steps.length - 1 ? 'Start Over' : 'Next Step'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* INTERACTIVE STOPWATCH / TIMER */}
          <div className="bg-[var(--coffee-cream)]/60 p-4 rounded-2xl border border-[var(--coffee-border)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-[var(--coffee-border)] text-[var(--coffee-espresso)]">
                <Clock className="w-6 h-6 text-[var(--coffee-caramel)]" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[var(--coffee-text-muted)] uppercase tracking-wider block">
                  Interactive Extraction Stopwatch
                </span>
                <span className="font-mono text-2xl font-bold text-[var(--coffee-espresso)]">
                  {formatTimer(timerSeconds)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs ${
                  isTimerRunning
                    ? 'bg-amber-600 text-white'
                    : 'bg-[var(--coffee-espresso)] text-white hover:bg-[var(--coffee-deep)]'
                }`}
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isTimerRunning ? 'Pause' : 'Start Timer'}</span>
              </button>
              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimerSeconds(0);
                }}
                className="p-2 bg-white hover:bg-[var(--coffee-cream)]/50 text-[var(--coffee-text-muted)] rounded-xl border border-[var(--coffee-border)] transition-colors"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* PRO TIP */}
          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/60 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-[var(--coffee-espresso)] uppercase tracking-wider">
                Estate Brewer Pro Tip
              </h5>
              <p className="text-xs text-[var(--coffee-text-muted)] mt-0.5 leading-relaxed">
                {guide.proTip}
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER: RECOMMENDED COFFEE PAIRING */}
        <div className="p-4 sm:p-5 bg-white border-t border-[var(--coffee-border)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={recommendedProduct.images[0]}
              alt={recommendedProduct.name}
              className="w-12 h-12 rounded-xl object-cover bg-[var(--coffee-cream)]/30 border border-[var(--coffee-border)]"
            />
            <div>
              <span className="text-[10px] text-[var(--coffee-caramel)] font-bold uppercase tracking-wider block">
                Recommended For This Method
              </span>
              <h4 className="font-serif text-xs sm:text-sm font-bold text-[var(--coffee-espresso)]">
                {recommendedProduct.name}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                addItem(recommendedProduct);
                closeBrewModal();
              }}
              className="flex-1 sm:flex-none px-4 py-2 bg-[var(--coffee-espresso)] text-white hover:bg-[var(--coffee-deep)] rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Add Pairing (₹{recommendedProduct.price})</span>
            </button>
            <button
              onClick={() => {
                closeBrewModal();
                navigateTo('product-detail', { product: recommendedProduct });
              }}
              className="px-3 py-2 bg-[var(--coffee-cream)]/60 hover:bg-[var(--coffee-cream)] text-[var(--coffee-espresso)] rounded-xl text-xs font-semibold transition-colors border border-[var(--coffee-border)]"
            >
              Details
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
