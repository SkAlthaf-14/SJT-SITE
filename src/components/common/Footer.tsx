import React from 'react';
import { Heart, ShieldCheck, Lock } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { SITE_CONFIG } from '../../data/siteConfig';
import { Logo } from './Logo';
import { InstagramIcon } from './InstagramIcon';

export const Footer: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <footer className="bg-[#2A1812] text-[#F7F1E8] border-t border-[#3B2418]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* BRAND COLUMN */}
          <div className="lg:col-span-4 space-y-4">
            <Logo
              variant="light"
              onClick={() => navigateTo('home')}
            />

            <p className="font-serif italic text-base text-[#EFE3D2]">
              "From our farm to your cup."
            </p>

            <p className="text-xs text-[#F7F1E8]/70 leading-relaxed max-w-sm font-sans">
              Cultivating, slow roasting, and finely grinding India's finest shade-grown coffee powder. Dedicated to preserving authentic South Indian filter kaapi tradition and honest agricultural terroir.
            </p>

            {/* Social Media Section */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-[#A66A3F] uppercase tracking-wider block mb-2.5">
                Connect With Us
              </span>
              <div className="flex items-center gap-3">
                <a
                  href={SITE_CONFIG.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-[#3B2418] hover:bg-[#A66A3F] hover:text-[#FCFAF6] flex items-center justify-center transition-all duration-200 text-[#EFE3D2] focus:outline-none focus:ring-2 focus:ring-[#A66A3F] focus:ring-offset-2 focus:ring-offset-[#2A1812]"
                  aria-label="Follow SJT Farms on Instagram (@sjt.farms)"
                  title="Follow SJT Farms on Instagram (@sjt.farms)"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>

                <a
                  href="#facebook"
                  className="w-9 h-9 rounded-full bg-[#3B2418] hover:bg-[#A66A3F] hover:text-[#FCFAF6] flex items-center justify-center transition-all duration-200 text-[#EFE3D2] focus:outline-none focus:ring-2 focus:ring-[#A66A3F] focus:ring-offset-2 focus:ring-offset-[#2A1812]"
                  aria-label="Follow SJT Farms on Facebook"
                  title="Follow SJT Farms on Facebook"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.7 5H18V0h-3.808C10.597 0 9 1.583 9 4.615V8z"/>
                  </svg>
                </a>

                <a
                  href="#youtube"
                  className="w-9 h-9 rounded-full bg-[#3B2418] hover:bg-[#A66A3F] hover:text-[#FCFAF6] flex items-center justify-center transition-all duration-200 text-[#EFE3D2] focus:outline-none focus:ring-2 focus:ring-[#A66A3F] focus:ring-offset-2 focus:ring-offset-[#2A1812]"
                  aria-label="Subscribe to SJT Farms on YouTube"
                  title="Subscribe to SJT Farms on YouTube"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* SHOP COLUMN */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#A66A3F]">
              SHOP
            </h4>
            <ul className="space-y-2.5 text-xs text-[#F7F1E8]/80">
              <li>
                <button
                  onClick={() => navigateTo('shop', { category: 'Coffee Powder' })}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Coffee Powder
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('shop', { category: 'Filter Coffee' })}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Filter Kaapi Blends
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('accessories')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Accessories & Brassware
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('subscription')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Coffee Subscriptions
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('shop')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  New Arrivals
                </button>
              </li>
            </ul>
          </div>

          {/* EXPLORE COLUMN */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#A66A3F]">
              EXPLORE
            </h4>
            <ul className="space-y-2.5 text-xs text-[#F7F1E8]/80">
              <li>
                <button
                  onClick={() => navigateTo('brew-guide')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Brew Guide & Masterclass
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('our-farm')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Our Farm & Origins
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('about')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  About SJT Farms
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('reviews')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Customer Reviews
                </button>
              </li>
            </ul>
          </div>

          {/* HELP COLUMN */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#A66A3F]">
              HELP
            </h4>
            <ul className="space-y-2.5 text-xs text-[#F7F1E8]/80">
              <li>
                <button
                  onClick={() => navigateTo('contact')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Contact Concierge
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('faq')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Shipping & Tracking
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('faq')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Returns & Replacements
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('faq')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Frequently Asked Questions
                </button>
              </li>
            </ul>
          </div>

          {/* LEGAL COLUMN */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#A66A3F]">
              LEGAL
            </h4>
            <ul className="space-y-2.5 text-xs text-[#F7F1E8]/80">
              <li>
                <span className="hover:text-white cursor-pointer">Privacy Policy</span>
              </li>
              <li>
                <span className="hover:text-white cursor-pointer">Terms of Service</span>
              </li>
              <li>
                <span className="hover:text-white cursor-pointer">Refund Policy</span>
              </li>
              <li>
                <span className="hover:text-white cursor-pointer">FSSAI Compliance</span>
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM COPYRIGHT & COMPLIANCE BAR */}
        <div className="mt-14 pt-8 border-t border-[#3B2418] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#F7F1E8]/60">
          <div className="flex items-center gap-4">
            <p>© 2026 SJT Farms. All rights reserved.</p>
            <button
              onClick={() => navigateTo('admin')}
              className="text-[#A66A3F] hover:text-[#EFE3D2] flex items-center gap-1 transition-colors underline decoration-dotted cursor-pointer"
            >
              <Lock className="w-3 h-3" />
              <span>Admin Management</span>
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-4 text-center sm:text-right">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#A66A3F]" />
              <span>Authentic South Indian Coffee Powder</span>
            </span>
            <span className="hidden min-[480px]:inline">•</span>
            <span className="flex items-center gap-1">
              <span>Crafted with</span>
              <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
              <span>for everyday kaapi lovers</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
