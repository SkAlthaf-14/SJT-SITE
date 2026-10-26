/**
 * SJT FARMS — WHATSAPP CUSTOMER CONCIERGE PAGE
 * 
 * Accessible at `/whatsapp-concierge` or via the header / floating widget.
 * Features:
 * - Full-fidelity interactive WhatsApp chat simulator (all 7 core flows)
 * - Desktop centered layout with helpful roastery facts & quick catalogue preview
 * - Mobile full-width experience
 * - Clear distinction between local simulator mode and Meta Cloud API status
 */

import React, { useEffect } from 'react';
import { WhatsAppConciergeChat } from '../components/concierge/WhatsAppConciergeChat';
import { useNavigation } from '../context/NavigationContext';
import {
  ShieldCheck,
  Coffee,
  Sparkles,
  Info,
  Clock,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { SITE_CONFIG } from '../data/siteConfig';

export const WhatsAppConciergePage: React.FC = () => {
  const { navigateTo } = useNavigation();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'WhatsApp Customer Concierge | SJT FARMS Coffee';
  }, []);

  return (
    <div className="min-h-screen bg-[#F4EFE6] text-[#2B211C] flex flex-col">
      {/* Top Breadcrumb & Status Bar */}
      <div className="bg-[#EFE9DF] border-b border-[#DED2C4] py-2.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-[#7A6A58]">
            <button
              onClick={() => navigateTo('home')}
              className="hover:text-[#11382B] cursor-pointer"
            >
              Home
            </button>
            <span>/</span>
            <span className="font-semibold text-[#11382B]">WhatsApp Concierge Simulator</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Simulator Fully Operational
            </span>
            <span className="hidden md:inline text-[11px] text-[#7A6A58]">
              Cloud API: Ready for Verification
            </span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto w-full px-2 sm:px-6 lg:px-8 py-4 sm:py-8 flex-1 flex flex-col lg:flex-row gap-6">
        {/* Left Side: Desktop Informational Roastery Panel (Hidden on Mobile) */}
        <div className="hidden lg:flex flex-col w-80 shrink-0 space-y-4">
          {/* Brand Card */}
          <div className="bg-white rounded-2xl p-5 border border-[#DED2C4] shadow-xs">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#11382B] text-[#D4AF37] flex items-center justify-center font-serif font-bold text-lg">
                SJT
              </div>
              <div>
                <h1 className="font-serif font-bold text-base text-[#11382B]">SJT FARMS Concierge</h1>
                <p className="text-xs text-[#7A6A58]">{SITE_CONFIG.brand.subTagline}</p>
              </div>
            </div>
            <p className="text-xs text-[#55433C] leading-relaxed">
              Experience our artisanal Araku Valley coffee through our interactive conversational concierge. Explore roast profiles, check real-time pricing, verify orders, or talk to our desk.
            </p>
          </div>

          {/* Operational Status Card */}
          <div className="bg-white rounded-2xl p-5 border border-[#DED2C4] shadow-xs space-y-3 text-xs">
            <h4 className="font-bold text-[#11382B] flex items-center gap-2 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Integration Architecture
            </h4>
            <div className="space-y-2 text-[#55433C]">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Interactive Simulator:</strong> 100% operational locally with full bilingual state machine.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Data Integrity:</strong> Zero fabricated prices, reviews, or delivery dates.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Meta Cloud API:</strong> Gated until business verification is submitted in Meta Manager.
                </span>
              </div>
            </div>
          </div>

          {/* Direct Human Support Card */}
          <div className="bg-gradient-to-br from-[#11382B] to-[#0A241C] text-[#F8F4EC] rounded-2xl p-5 border border-[#D4AF37]/30 shadow-sm space-y-3 text-xs">
            <div className="flex items-center gap-2 text-[#D4AF37] font-bold text-sm">
              <PhoneCall className="w-4 h-4" />
              Need Direct Human Help?
            </div>
            <p className="text-[#E8DCC8]/90 text-[11px] leading-relaxed">
              Our Araku roastery desk is available Monday through Saturday, 9:00 AM – 6:00 PM IST.
            </p>
            <div className="pt-2 border-t border-[#D4AF37]/20 flex flex-col gap-1.5">
              <a
                href="tel:+918121020111"
                className="font-mono font-bold text-sm text-[#D4AF37] hover:underline"
              >
                +91 8121020111
              </a>
              <span className="text-[10px] text-[#E8DCC8]/70">
                Official Business Phone & WhatsApp
              </span>
            </div>
          </div>
        </div>

        {/* Right Side / Mobile Center: High-Fidelity Interactive Chat Applet */}
        <div className="flex-1 flex flex-col min-h-[580px] sm:min-h-[680px] max-h-[820px] bg-white rounded-2xl border border-[#DED2C4] shadow-md overflow-hidden">
          <WhatsAppConciergeChat />
        </div>
      </div>
    </div>
  );
};
