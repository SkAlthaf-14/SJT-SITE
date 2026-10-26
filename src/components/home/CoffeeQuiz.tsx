import React, { useState } from 'react';
import { HelpCircle, Sparkles, CheckCircle2, RotateCcw, ShoppingBag, ArrowRight } from 'lucide-react';
import { PRODUCTS } from '../../data/products';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useNavigation } from '../../context/NavigationContext';

export const CoffeeQuiz: React.FC = () => {
  const [step, setStep] = useState(1);
  const [strength, setStrength] = useState<'Mild' | 'Medium' | 'Strong' | ''>('');
  const [brewMethod, setBrewMethod] = useState<'Filter' | 'Moka Pot' | 'French Press' | 'Pour Over' | ''>('');
  const [flavour, setFlavour] = useState<'Smooth' | 'Bold' | 'Aromatic' | ''>('');

  const { addItem } = useCart();
  const { navigateTo } = useNavigation();

  // Match recommendation algorithm
  const getMatchedProduct = (): Product => {
    if (strength === 'Strong') {
      return PRODUCTS.find((p) => p.id === 'sjt-strong') || PRODUCTS[1];
    }
    if (brewMethod === 'Filter') {
      return PRODUCTS.find((p) => p.id === 'sjt-premium-filter') || PRODUCTS[2];
    }
    if (flavour === 'Aromatic' || strength === 'Mild') {
      return PRODUCTS.find((p) => p.id === 'sjt-special-blend') || PRODUCTS[3];
    }
    return PRODUCTS.find((p) => p.id === 'sjt-signature') || PRODUCTS[0];
  };

  const handleReset = () => {
    setStep(1);
    setStrength('');
    setBrewMethod('');
    setFlavour('');
  };

  const matchedProduct = getMatchedProduct();

  return (
    <section className="py-10 sm:py-16 lg:py-20 bg-[#F7F2EA] relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-5 sm:p-8 lg:p-12 border border-[#E4D8C8] shadow-xl relative overflow-hidden">
          {/* Subtle gold decorative gradient */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#C49A5A]/10 rounded-full blur-3xl pointer-events-none" />

          {/* QUIZ HEADER */}
          <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#A37936] uppercase tracking-[0.2em] mb-1.5 font-sans">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Coffee Finder</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#201814] tracking-tight">
              FIND YOUR PERFECT COFFEE
            </h2>
            <p className="text-xs sm:text-sm text-[#6B5B52] mt-2 font-normal">
              Answer 3 quick sensory questions to discover which SJT Farms roast is calibrated to your palate.
            </p>
          </div>

          {/* STEP 1: STRENGTH */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center">
                <span className="text-[11px] font-bold text-[#A37936] uppercase tracking-wider block mb-1">
                  Question 1 of 3
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#201814]">
                  How strong do you like your coffee?
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { value: 'Mild' as const, title: 'Mild & Delicate', desc: 'Gentle on the palate with sweet, floral clarity' },
                  { value: 'Medium' as const, title: 'Balanced & Smooth', desc: 'Harmonious cocoa notes with comforting body' },
                  { value: 'Strong' as const, title: 'Bold & Intense', desc: 'Deep, heavy-bodied kick that cuts through milk' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setStrength(opt.value);
                      setStep(2);
                    }}
                    className="p-5 rounded-2xl border border-[#E4D8C8] bg-[#F7F2EA] hover:bg-[#24150F] hover:text-[#DFBF82] text-left transition-all duration-200 group flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="font-serif text-base font-bold text-[#201814] group-hover:text-[#DFBF82]">
                        {opt.title}
                      </h4>
                      <p className="text-xs text-[#6B5B52] group-hover:text-[#EDE2D2]/80 mt-1.5 leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#A37936] group-hover:text-[#DFBF82]">
                      <span>Select</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: BREW METHOD */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center">
                <span className="text-[11px] font-bold text-[#A37936] uppercase tracking-wider block mb-1">
                  Question 2 of 3
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#201814]">
                  How do you brew your coffee?
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { value: 'Filter' as const, title: 'South Indian Filter', desc: 'Brass or stainless steel drip filter' },
                  { value: 'Moka Pot' as const, title: 'Moka Pot', desc: 'Stovetop steam pressure extraction' },
                  { value: 'French Press' as const, title: 'French Press', desc: 'Plunger immersion brewing' },
                  { value: 'Pour Over' as const, title: 'Pour Over / Drip', desc: 'Paper filter conical manual pour' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setBrewMethod(opt.value);
                      setStep(3);
                    }}
                    className="p-5 rounded-2xl border border-[#E4D8C8] bg-[#F7F2EA] hover:bg-[#24150F] hover:text-[#DFBF82] text-left transition-all duration-200 group flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="font-serif text-base font-bold text-[#201814] group-hover:text-[#DFBF82]">
                        {opt.title}
                      </h4>
                      <p className="text-xs text-[#6B5B52] group-hover:text-[#EDE2D2]/80 mt-1.5 leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#A37936] group-hover:text-[#DFBF82]">
                      <span>Select</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: FLAVOUR PREFERENCE */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center">
                <span className="text-[11px] font-bold text-[#A37936] uppercase tracking-wider block mb-1">
                  Question 3 of 3
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#201814]">
                  What flavour do you prefer?
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { value: 'Smooth' as const, title: 'Smooth & Chocolaty', desc: 'Creamy milk chocolate and toasted nutty notes' },
                  { value: 'Bold' as const, title: 'Bold & Earthy', desc: 'Dark cocoa, oakwood, and bittersweet finish' },
                  { value: 'Aromatic' as const, title: 'Aromatic & Floral', desc: 'Wild blossom honey and ripe stone fruit sweetness' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setFlavour(opt.value);
                      setStep(4);
                    }}
                    className="p-5 rounded-2xl border border-[#E4D8C8] bg-[#F7F2EA] hover:bg-[#24150F] hover:text-[#DFBF82] text-left transition-all duration-200 group flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="font-serif text-base font-bold text-[#201814] group-hover:text-[#DFBF82]">
                        {opt.title}
                      </h4>
                      <p className="text-xs text-[#6B5B52] group-hover:text-[#EDE2D2]/80 mt-1.5 leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#A37936] group-hover:text-[#DFBF82]">
                      <span>See Result</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: RESULT / YOUR MATCH */}
          {step === 4 && (
            <div className="animate-fadeIn">
              <div className="bg-[#EDE2D2]/40 rounded-2xl p-6 sm:p-8 border border-[#E4D8C8]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
                    <span className="text-xs font-extrabold text-[#A37936] uppercase tracking-widest font-sans">
                      YOUR PERFECT MATCH
                    </span>
                  </div>
                  <button
                    onClick={handleReset}
                    className="text-xs text-[#6B5B52] hover:text-[#24150F] flex items-center gap-1 font-semibold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retake Quiz</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-5 aspect-square rounded-2xl overflow-hidden bg-white border border-[#E4D8C8] shadow-sm">
                    <img
                      src={matchedProduct.images[0]}
                      alt={matchedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="md:col-span-7 space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#A37936] bg-white px-2.5 py-1 rounded-md border border-[#E4D8C8]">
                      {matchedProduct.category}
                    </span>
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#201814]">
                      {matchedProduct.name}
                    </h3>
                    <p className="text-xs text-[#6B5B52] leading-relaxed">
                      {matchedProduct.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 py-1">
                      {matchedProduct.flavourNotes.map((note, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-white text-[#24150F] px-2.5 py-0.5 rounded-full border border-[#E4D8C8] font-semibold"
                        >
                          {note}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="font-serif text-2xl font-bold text-[#24150F]">
                        ₹{matchedProduct.price}
                      </span>
                      <span className="text-xs text-[#6B5B52]">for 250g pack</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <button
                        onClick={() => addItem(matchedProduct)}
                        className="px-5 py-3 bg-[#24150F] text-[#DFBF82] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#342017] transition-colors flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-[#C49A5A]" />
                        <span>Add Match to Cart</span>
                      </button>

                      <button
                        onClick={() => navigateTo('product-detail', { product: matchedProduct })}
                        className="px-5 py-3 bg-white text-[#24150F] border border-[#E4D8C8] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#EDE2D2] transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
