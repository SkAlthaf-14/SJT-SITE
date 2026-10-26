/**
 * SJT FARMS — PREMIUM FLOATING WHATSAPP BUTTON & INTERACTIVE CONVERSATION WIDGET
 *
 * Inspired by professional WhatsApp Business conversation design (Yellow Class reference).
 * Provides customer-initiated click-to-chat actions in English & Telugu.
 *
 * Actions:
 *  1. Explore Coffee Catalogue
 *  2. Shop Coffee (Direct site navigation or WhatsApp link)
 *  3. Product Enquiry (Select from 4 coffee blends with 50g/100g/250g variants)
 *  4. Track My Order (Direct order lookup with WhatsApp assistance)
 *  5. Payment Assistance (UPI verification guidance)
 *  6. Direct Concierge Support
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Coffee,
  ShoppingBag,
  Package,
  CreditCard,
  Headphones,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import {
  WHATSAPP_CONFIG,
  WHATSAPP_TEMPLATES,
  buildWhatsAppLink,
  generateProductEnquiryMessage,
  WhatsAppLanguage,
} from '../../config/whatsapp';
import { PRODUCTS, getDefaultProductVariant, getProductVariantJarImage } from '../../data/products';
import { useNavigation } from '../../context/NavigationContext';
import { WhatsAppConciergeChat } from '../concierge/WhatsAppConciergeChat';

export const WhatsAppFloatingWidget: React.FC = () => {
  const { navigateTo, currentPage } = useNavigation();
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<WhatsAppLanguage>(() => {
    try {
      return (localStorage.getItem('sjt_wa_lang') as WhatsAppLanguage) || 'en';
    } catch {
      return 'en';
    }
  });

  const [widgetMode, setWidgetMode] = useState<'simulator' | 'direct'>('simulator');
  const [activeMenu, setActiveMenu] = useState<'main' | 'products' | 'tracking'>('main');
  const [trackOrderIdInput, setTrackOrderIdInput] = useState('');
  const [selectedProductSlug, setSelectedProductSlug] = useState<string>(PRODUCTS[0].slug);
  const [selectedPackSize, setSelectedPackSize] = useState<string>('100g');

  const widgetRef = useRef<HTMLDivElement>(null);

  // Persist language selection
  const handleLanguageChange = (lang: WhatsAppLanguage) => {
    setLanguage(lang);
    try {
      localStorage.setItem('sjt_wa_lang', lang);
    } catch {
      // ignore
    }
  };

  // Close widget on outside click or Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Don't show floating button during full-screen admin mode or checkout to avoid obstruction
  if (currentPage === 'admin' || currentPage === 'admin-login') {
    return null;
  }

  const selectedProduct = PRODUCTS.find((p) => p.slug === selectedProductSlug) || PRODUCTS[0];
  const fourCoffeeBlends = PRODUCTS.filter((p) => p.category !== 'Accessories');

  const openWhatsAppUrl = (message: string) => {
    const url = buildWhatsAppLink(message);
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(message);
        setCopyFeedback(
          language === 'te'
            ? 'వాట్సాప్ విండో ఓపెన్ కాలేదు. సందేశం కాపీ చేయబడింది! వాట్సాప్‌లో +91 8121020111 కి పంపండి.'
            : 'WhatsApp window blocked. Message copied to clipboard! Please paste into WhatsApp to +91 8121020111.'
        );
        setTimeout(() => setCopyFeedback(null), 5000);
      }
    }
  };

  const handleCatalogueClick = () => {
    const msg = WHATSAPP_TEMPLATES.catalogue[language];
    openWhatsAppUrl(msg);
  };

  const handleRecommendationClick = () => {
    const msg = WHATSAPP_TEMPLATES.recommendation[language];
    openWhatsAppUrl(msg);
  };

  const handleShippingClick = () => {
    const msg = WHATSAPP_TEMPLATES.shipping[language];
    openWhatsAppUrl(msg);
  };

  const handleCancellationClick = () => {
    const msg = WHATSAPP_TEMPLATES.cancellation[language]();
    openWhatsAppUrl(msg);
  };

  const handleSupportClick = () => {
    const msg = WHATSAPP_TEMPLATES.customerSupport[language];
    openWhatsAppUrl(msg);
  };

  const handlePaymentHelpClick = () => {
    const msg = WHATSAPP_TEMPLATES.paymentAssistance[language]();
    openWhatsAppUrl(msg);
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = trackOrderIdInput.trim().replace(/^#/, '');
    if (!cleanId) return;
    const msg = WHATSAPP_TEMPLATES.orderTracking[language](cleanId);
    openWhatsAppUrl(msg);
  };

  const handleProductEnquirySubmit = () => {
    const msg = generateProductEnquiryMessage(selectedProduct, selectedPackSize, language);
    openWhatsAppUrl(msg);
  };

  return (
    <div
      ref={widgetRef}
      className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 select-none font-sans"
    >
      {/* POPUP CONVERSATION MODAL / DRAWER */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="SJT Farms WhatsApp Concierge"
          className="mb-3 w-[calc(100vw-2rem)] sm:w-[420px] max-w-[440px] bg-white rounded-3xl border border-[#D4AF37]/40 shadow-2xl overflow-hidden animate-slide-up flex flex-col h-[600px] max-h-[85vh] text-[#201814]"
        >
          {/* Dual-Mode Selector Bar */}
          <div className="bg-[#0A241C] text-[#E8DCC8] px-3 py-1.5 flex items-center justify-between text-xs border-b border-[#D4AF37]/20 shrink-0">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setWidgetMode('simulator')}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  widgetMode === 'simulator'
                    ? 'bg-[#11382B] text-[#D4AF37] border border-[#D4AF37]/50 shadow-xs'
                    : 'text-[#E8DCC8]/70 hover:text-white'
                }`}
              >
                🤖 Simulator (7 Flows)
              </button>
              <button
                type="button"
                onClick={() => setWidgetMode('direct')}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  widgetMode === 'direct'
                    ? 'bg-[#25D366] text-[#0A241C] font-bold shadow-xs'
                    : 'text-[#E8DCC8]/70 hover:text-white'
                }`}
              >
                💬 Direct WhatsApp
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigateTo('whatsapp-concierge');
                }}
                className="text-[10px] text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                title="Expand to Full Page"
              >
                <span>Expand</span>
                <Maximize2 className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-white/60 hover:text-white p-0.5 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {widgetMode === 'simulator' ? (
            <div className="flex-1 overflow-hidden flex flex-col">
              <WhatsAppConciergeChat isOpenInModal={true} onClose={() => setIsOpen(false)} />
            </div>
          ) : (
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* HEADER: Deep Green with Gold Accents */}
              <div className="bg-[#11382B] text-[#F9F5EB] p-4 sm:p-5 flex items-center justify-between border-b border-[#D4AF37]/30 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-[#1B4D3E] border-2 border-[#D4AF37] flex items-center justify-center text-lg shadow-sm">
                      ☕
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#25D366] ring-2 ring-[#11382B]" />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-serif font-bold text-sm sm:text-base text-white tracking-wide">
                        SJT FARMS Direct Chat
                      </h3>
                      <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                    </div>
                    <div className="flex items-center gap-2 text-[10.5px] text-[#EFE3D2]/80">
                      <span>{WHATSAPP_CONFIG.formattedPhone}</span>
                      <span>•</span>
                      <span className="text-[#25D366] font-medium">Click to Chat</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Language Selector */}
                  <div className="flex items-center bg-[#0A241C] rounded-lg p-0.5 border border-[#D4AF37]/30">
                    <button
                      type="button"
                      onClick={() => handleLanguageChange('en')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                        language === 'en'
                          ? 'bg-[#D4AF37] text-[#160E0A]'
                          : 'text-[#EFE3D2]/70 hover:text-white'
                      }`}
                      aria-label="Switch to English"
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLanguageChange('te')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                        language === 'te'
                          ? 'bg-[#D4AF37] text-[#160E0A]'
                          : 'text-[#EFE3D2]/70 hover:text-white'
                      }`}
                      aria-label="Switch to Telugu"
                    >
                      తెలుగు
                    </button>
                  </div>
                </div>
              </div>

              {/* CHAT BODY */}
              <div className="p-4 sm:p-5 overflow-y-auto overscroll-contain bg-[#FCFAF6] flex-1 space-y-3.5">
            {/* Estate Welcome Bubble */}
            <div className="flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded-full bg-[#11382B] text-white flex items-center justify-center text-xs shrink-0 mt-0.5">
                ☕
              </div>
              <div className="bg-white p-3.5 rounded-2xl rounded-tl-xs border border-[#DED2C4] shadow-warm-xs text-xs text-[#2B211C] leading-relaxed">
                <p>{WHATSAPP_TEMPLATES.welcome[language]}</p>
                <span className="block text-[9.5px] text-[#8C7A6B] mt-1 text-right">
                  Araku Valley Roastery Desk
                </span>
              </div>
            </div>

            {copyFeedback && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 animate-fade-in flex items-start gap-2 shadow-sm">
                <span className="text-sm">⚠️</span>
                <span>{copyFeedback}</span>
              </div>
            )}

            {/* SUB-VIEW: MAIN INTERACTIVE MENU */}
            {activeMenu === 'main' && (
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A6B] block px-1">
                  {language === 'te' ? 'సహాయ మెనూ (Click to Chat)' : 'How may we assist you today?'}
                </span>

                {/* 1. Explore Coffee Catalogue */}
                <button
                  type="button"
                  onClick={handleCatalogueClick}
                  className="w-full p-3 bg-white hover:bg-[#F9F5EB] border border-[#DED2C4] hover:border-[#D4AF37] rounded-2xl flex items-center justify-between text-left transition-all shadow-warm-xs group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#11382B]/10 text-[#11382B] flex items-center justify-center group-hover:bg-[#11382B] group-hover:text-white transition-colors">
                      <Coffee className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#201814] block">
                        {language === 'te' ? 'కాఫీ కేటలాగ్ వివరాలు' : 'Explore Coffee Catalogue'}
                      </span>
                      <span className="text-[10.5px] text-[#8C7A6B]">
                        {language === 'te' ? 'అన్ని రకాలు, ప్యాక్ సైజులు & ధరలు' : '4 blends, 12 packaging variants & prices'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8C7A6B] group-hover:text-[#11382B] transition-transform group-hover:translate-x-0.5" />
                </button>

                {/* 2. Specific Product Enquiry (Nested Submenu) */}
                <button
                  type="button"
                  onClick={() => setActiveMenu('products')}
                  className="w-full p-3 bg-white hover:bg-[#F9F5EB] border border-[#DED2C4] hover:border-[#D4AF37] rounded-2xl flex items-center justify-between text-left transition-all shadow-warm-xs group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#A66A3F]/15 text-[#A66A3F] flex items-center justify-center group-hover:bg-[#A66A3F] group-hover:text-white transition-colors">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#201814] block">
                        {language === 'te' ? 'నిర్దిష్ట ఉత్పత్తి విచారణ' : 'Specific Product Enquiry'}
                      </span>
                      <span className="text-[10.5px] text-[#8C7A6B]">
                        {language === 'te' ? '50g, 100g లేదా 250g ఎంచుకోండి' : 'Choose blend & jar size (50g, 100g, 250g)'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8C7A6B] group-hover:text-[#A66A3F] transition-transform group-hover:translate-x-0.5" />
                </button>

                {/* 3. Track My Order (Nested Submenu) */}
                <button
                  type="button"
                  onClick={() => setActiveMenu('tracking')}
                  className="w-full p-3 bg-white hover:bg-[#F9F5EB] border border-[#DED2C4] hover:border-[#D4AF37] rounded-2xl flex items-center justify-between text-left transition-all shadow-warm-xs group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#2E5A3D]/15 text-[#2E5A3D] flex items-center justify-center group-hover:bg-[#2E5A3D] group-hover:text-white transition-colors">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#201814] block">
                        {language === 'te' ? 'నా ఆర్డర్ ట్రాకింగ్' : 'Track My Order'}
                      </span>
                      <span className="text-[10.5px] text-[#8C7A6B]">
                        {language === 'te' ? 'ఆర్డర్ నంబర్ తో తాజా సమాచారం' : 'Live roasting & courier status for #101...'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8C7A6B] group-hover:text-[#2E5A3D] transition-transform group-hover:translate-x-0.5" />
                </button>

                {/* 4. Payment Verification Help */}
                <button
                  type="button"
                  onClick={handlePaymentHelpClick}
                  className="w-full p-3 bg-white hover:bg-[#F9F5EB] border border-[#DED2C4] hover:border-[#D4AF37] rounded-2xl flex items-center justify-between text-left transition-all shadow-warm-xs group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#5F259F]/15 text-[#5F259F] flex items-center justify-center group-hover:bg-[#5F259F] group-hover:text-white transition-colors">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#201814] block">
                        {language === 'te' ? 'UPI పేమెంట్ సహాయం' : 'UPI Payment Verification Help'}
                      </span>
                      <span className="text-[10.5px] text-[#8C7A6B]">
                        {language === 'te' ? 'UTR నిర్ధారణ మరియు రసీదు' : 'Assistance verifying bank UTR reference'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8C7A6B] group-hover:text-[#5F259F] transition-transform group-hover:translate-x-0.5" />
                </button>

                {/* 5. General Concierge Support */}
                <button
                  type="button"
                  onClick={handleSupportClick}
                  className="w-full p-3 bg-white hover:bg-[#F9F5EB] border border-[#DED2C4] hover:border-[#D4AF37] rounded-2xl flex items-center justify-between text-left transition-all shadow-warm-xs group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#25D366]/15 text-[#25D366] flex items-center justify-center group-hover:bg-[#25D366] group-hover:text-white transition-colors">
                      <Headphones className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#201814] block">
                        {language === 'te' ? 'ఎస్టేట్ సపోర్ట్ చాట్' : 'Customer Care Support'}
                      </span>
                      <span className="text-[10.5px] text-[#8C7A6B]">
                        {language === 'te' ? 'నేరుగా మా సిబ్బందితో మాట్లాడండి' : 'Direct conversation with our team'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8C7A6B] group-hover:text-[#25D366] transition-transform group-hover:translate-x-0.5" />
                </button>

                {/* 6. Quick Action Chips: Recommendations, Shipping, Cancellation */}
                <div className="pt-2 border-t border-[#DED2C4]/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A6B] block mb-2">
                    {language === 'te' ? 'ఇతర సహాయం' : 'More Assistance Options'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={handleRecommendationClick}
                      className="px-2.5 py-1 bg-[#F9F5EB] hover:bg-[#EFEAE2] border border-[#DED2C4] rounded-lg text-[11px] font-medium text-[#201814] transition-colors cursor-pointer"
                    >
                      💡 {language === 'te' ? 'కాఫీ సిఫార్సు' : 'Coffee Recommendation'}
                    </button>
                    <button
                      type="button"
                      onClick={handleShippingClick}
                      className="px-2.5 py-1 bg-[#F9F5EB] hover:bg-[#EFEAE2] border border-[#DED2C4] rounded-lg text-[11px] font-medium text-[#201814] transition-colors cursor-pointer"
                    >
                      🚚 {language === 'te' ? 'షిప్పింగ్ & డెలివరీ' : 'Shipping & Delivery'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancellationClick}
                      className="px-2.5 py-1 bg-[#F9F5EB] hover:bg-[#EFEAE2] border border-[#DED2C4] rounded-lg text-[11px] font-medium text-[#201814] transition-colors cursor-pointer"
                    >
                      ↩️ {language === 'te' ? 'రద్దు & రీఫండ్' : 'Cancellation & Refund'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-VIEW: SPECIFIC PRODUCT ENQUIRY */}
            {activeMenu === 'products' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveMenu('main')}
                    className="text-xs font-bold text-[#11382B] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    ← {language === 'te' ? 'వెనుకకు' : 'Back to Menu'}
                  </button>
                  <span className="text-[10px] text-[#8C7A6B]">
                    {language === 'te' ? 'ఉత్పత్తిని ఎంచుకోండి' : 'Choose Blend & Size'}
                  </span>
                </div>

                {/* Blend Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#201814] block">
                    {language === 'te' ? 'కాఫీ రకం:' : 'Coffee Blend:'}
                  </label>
                  <select
                    value={selectedProductSlug}
                    onChange={(e) => {
                      setSelectedProductSlug(e.target.value);
                      const prod = PRODUCTS.find((p) => p.slug === e.target.value);
                      if (prod) {
                        setSelectedPackSize(getDefaultProductVariant(prod));
                      }
                    }}
                    className="w-full text-xs p-2.5 bg-white border border-[#DED2C4] rounded-xl font-medium focus:outline-none focus:border-[#11382B]"
                  >
                    {fourCoffeeBlends.map((b) => (
                      <option key={b.id} value={b.slug}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pack Size Selector (50g, 100g, 250g) */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#201814] block">
                    {language === 'te' ? 'ప్యాక్ సైజ్ ఎంచుకోండి:' : 'Select Jar Size:'}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {selectedProduct.weights.map((w) => {
                      const isSelected = selectedPackSize === w;
                      const price = selectedProduct.weightPrices?.[w] || selectedProduct.price;
                      return (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setSelectedPackSize(w)}
                          className={`p-2 rounded-xl text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#11382B] text-white font-bold ring-2 ring-[#D4AF37]'
                              : 'bg-white text-[#201814] border border-[#DED2C4] hover:bg-[#F9F5EB]'
                          }`}
                        >
                          <span className="block text-xs">{w}</span>
                          <span className={`block text-[10px] ${isSelected ? 'text-[#D4AF37]' : 'text-[#8C7A6B]'}`}>
                            ₹{price}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Variant Preview Card */}
                <div className="p-3 bg-white rounded-2xl border border-[#DED2C4] flex items-center gap-3">
                  <img
                    src={getProductVariantJarImage(selectedProduct, selectedPackSize)}
                    alt={`${selectedProduct.name} ${selectedPackSize}`}
                    className="w-14 h-14 object-contain p-1 rounded-xl bg-[#F9F5EB] border border-[#DED2C4]/60 shrink-0"
                  />
                  <div className="flex-1 min-w-0 text-xs">
                    <span className="font-bold text-[#201814] truncate block">
                      {selectedProduct.name}
                    </span>
                    <span className="text-[#8C7A6B] block text-[11px]">
                      {selectedPackSize} • ₹{selectedProduct.weightPrices?.[selectedPackSize] || selectedProduct.price}
                    </span>
                    <span className="text-[10px] text-[#2E5A3D] font-semibold">
                      ● In Stock at Roastery
                    </span>
                  </div>
                </div>

                {/* Launch Button */}
                <button
                  type="button"
                  onClick={handleProductEnquirySubmit}
                  className="w-full py-3 bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm active:scale-98 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {language === 'te'
                      ? 'వాట్సాప్‌లో విచారించండి'
                      : 'Send Enquiry via WhatsApp'}
                  </span>
                </button>
              </div>
            )}

            {/* SUB-VIEW: ORDER TRACKING ENQUIRY */}
            {activeMenu === 'tracking' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveMenu('main')}
                    className="text-xs font-bold text-[#11382B] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    ← {language === 'te' ? 'వెనుకకు' : 'Back to Menu'}
                  </button>
                  <span className="text-[10px] text-[#8C7A6B]">
                    {language === 'te' ? 'ఆర్డర్ ట్రాకింగ్' : 'Order Tracking'}
                  </span>
                </div>

                <form onSubmit={handleTrackSubmit} className="space-y-2.5">
                  <label className="text-[11px] font-bold text-[#201814] block">
                    {language === 'te' ? 'ఆర్డర్ నంబర్ నమోదు చేయండి:' : 'Enter Order Reference Number:'}
                  </label>
                  <input
                    type="text"
                    value={trackOrderIdInput}
                    onChange={(e) => setTrackOrderIdInput(e.target.value)}
                    placeholder="e.g. 101 or #101"
                    className="w-full text-xs font-mono font-bold p-2.5 bg-white border border-[#DED2C4] rounded-xl focus:outline-none focus:border-[#11382B]"
                  />

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={!trackOrderIdInput.trim()}
                      className="flex-1 py-2.5 bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{language === 'te' ? 'వాట్సాప్‌లో ట్రాక్ చేయండి' : 'WhatsApp Enquiry'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        const clean = trackOrderIdInput.trim().replace(/^#/, '');
                        navigateTo('track-order');
                        if (clean && typeof window !== 'undefined') {
                          window.location.hash = `track-order?order=${clean}`;
                        }
                      }}
                      className="py-2.5 px-3 bg-white hover:bg-[#F9F5EB] text-[#201814] border border-[#DED2C4] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#8C7A6B]" />
                      <span>Web Track</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* FOOTER: Clarification Note */}
          <div className="p-3 bg-[#F5EFEB] border-t border-[#DED2C4] text-[10px] text-[#8C7A6B] text-center shrink-0">
            <span>
              {language === 'te'
                ? 'క్లిక్ చేసినప్పుడు వాట్సాప్‌లో సందేశం సిద్ధమవుతుంది. మీ ఆమోదం తర్వాతే పంపబడుతుంది.'
                : 'Click-to-chat opens WhatsApp with a prefilled message. No automated message is sent until you review and tap send.'}
            </span>
          </div>
            </div>
          )}
        </div>
      )}

      {/* FLOATING ACTION TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 sm:w-15 sm:h-15 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-95 cursor-pointer relative ${
          isOpen
            ? 'bg-[#160E0A] text-white rotate-90 scale-95 ring-4 ring-[#D4AF37]/50'
            : 'bg-[#25D366] hover:bg-[#20BA5A] text-white hover:scale-105 shadow-[0_8px_24px_rgba(37,211,102,0.4)]'
        }`}
        aria-label={isOpen ? 'Close WhatsApp Concierge' : 'Open WhatsApp Concierge (+91 8121020111)'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <>
            <MessageSquare className="w-7 h-7 fill-white" />
            {/* Ambient Pulse Dot */}
            <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-[#D4AF37] ring-2 ring-white animate-pulse" />
          </>
        )}
      </button>
    </div>
  );
};
