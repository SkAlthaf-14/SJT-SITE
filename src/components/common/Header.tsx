import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Heart,
  ShoppingBag,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  User,
  ShieldCheck,
  UserCheck,
  LogOut,
  Package,
  LifeBuoy,
  Truck,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { ProfileAvatar } from '../auth/ProfileAvatar';
import { Logo } from './Logo';
import { useBodyScrollLock } from '../../utils/scrollLock';

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user, isLoading, isAdmin, logoutUser, openAuthModal } = useAuth();
  const { itemCount, setIsDrawerOpen } = useCart();
  const { wishlistCount } = useWishlist();
  const { currentPage, navigateTo, setIsSearchOpen } = useNavigation();

  // Determine display name safely
  const customerDisplayName =
    user?.name ||
    user?.rawUser?.displayName ||
    (user?.email ? user.email.split('@')[0] : 'SJT Patron');

  const customerFirstName = customerDisplayName.split(' ')[0];

  const [registeredCustomer, setRegisteredCustomer] = useState<{
    name: string;
    email: string;
    phone: string;
  } | null>(() => {
    try {
      const stored = localStorage.getItem('sjt_customer') || localStorage.getItem('sjt_registered_customer');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleCustomerUpdate = () => {
      try {
        const stored = localStorage.getItem('sjt_customer') || localStorage.getItem('sjt_registered_customer');
        setRegisteredCustomer(stored ? JSON.parse(stored) : null);
      } catch {
        setRegisteredCustomer(null);
      }
    };

    window.addEventListener('sjt_customer_updated', handleCustomerUpdate);
    return () => window.removeEventListener('sjt_customer_updated', handleCustomerUpdate);
  }, []);

  // Close account dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAccountModal(false);
      }
    };
    if (showAccountModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAccountModal]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent background scrolling when mobile menu is open using centralized lock manager
  useBodyScrollLock(mobileMenuOpen, 'header-mobile-menu');

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Main navigation items as specified in brand design requirements
  const navLinks = [
    { label: 'Shop', page: 'shop' },
    { label: 'Brew Guide', page: 'brew-guide' },
    { label: 'Our Farm', page: 'our-farm' },
    { label: 'About', page: 'about' },
    { label: 'Reviews', page: 'reviews' },
    { label: 'Contact', page: 'contact' },
  ];

  const handleNavClick = (page: string) => {
    navigateTo(page);
    setMobileMenuOpen(false);
    setShowAccountModal(false);
  };

  return (
    <>
      {/* TOP ANNOUNCEMENT BAR */}
      <div className="bg-[#28170F] text-[#F8F4EC] text-[10px] min-[380px]:text-[11px] py-1 sm:py-1.5 px-2.5 sm:px-6 border-b border-[#D7AD36]/30 flex items-center justify-between overflow-hidden">
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden w-full sm:w-auto justify-center sm:justify-start">
          <div className="flex items-center gap-1.5 font-sans font-medium text-[#F8F4EC]/90 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D7AD36] animate-pulse shrink-0" />
            <span className="truncate">
              <span className="min-[380px]:hidden">Estate Harvested • Araku Valley</span>
              <span className="hidden min-[380px]:inline">Estate Harvested in Araku Valley • Artisan Shade-Grown Roasting</span>
            </span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4 shrink-0 text-[#F8F4EC]/90 font-medium">
          <button
            onClick={() => handleNavClick('track-order')}
            className="hover:text-[#D7AD36] transition-colors cursor-pointer flex items-center gap-1"
          >
            <Package className="w-3.5 h-3.5 text-[#D7AD36]" />
            <span>Track Order</span>
          </button>
          <span className="text-[#D7AD36]/40">•</span>
          <button
            onClick={() => handleNavClick('whatsapp-concierge')}
            className="hover:text-[#D7AD36] transition-colors cursor-pointer flex items-center gap-1"
          >
            <LifeBuoy className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Help & Concierge</span>
          </button>
        </div>
      </div>

      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 h-14 sm:h-16 lg:h-[72px] flex items-center ${
          isScrolled
            ? 'glass-header shadow-warm-sm border-b border-[#DED2C4]/90'
            : 'bg-[#F8F4EC] border-b border-[#DED2C4]/80'
        }`}
      >
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between h-full">
            {/* BRAND LOGO */}
            <Logo
              variant="header"
              onClick={() => handleNavClick('home')}
            />

            {/* DESKTOP NAVIGATION */}
            <nav className="hidden lg:flex items-center gap-7 xl:gap-8" aria-label="Main Navigation">
              {navLinks.map((link) => {
                const isActive = currentPage === link.page;
                return (
                  <button
                    key={link.page}
                    onClick={() => handleNavClick(link.page)}
                    className={`relative py-1 text-sm font-semibold tracking-wide transition-colors duration-200 focus:outline-none focus-visible:text-[#A66A3F] cursor-pointer ${
                      isActive ? 'text-[#A66A3F]' : 'text-[#2B211C] hover:text-[#A66A3F]'
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#A66A3F] rounded-full transition-all duration-300" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* HEADER ACTIONS: Search, Wishlist, Cart, Account, Hamburger */}
            <div className="flex items-center gap-1 min-[360px]:gap-1.5 sm:gap-2 shrink-0">
              {/* Search Icon */}
              <button
                id="header-search-button"
                onClick={() => setIsSearchOpen(true)}
                className="w-8 h-8 min-[360px]:w-8.5 min-[360px]:h-8.5 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-[#2B211C] hover:text-[#A66A3F] hover:bg-[#F7F1E8] active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A66A3F] cursor-pointer"
                aria-label="Search coffee products"
              >
                <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>

              {/* Wishlist Icon */}
              <button
                id="header-wishlist-button"
                onClick={() => handleNavClick('wishlist')}
                className="hidden sm:flex relative w-8 h-8 min-[360px]:w-8.5 min-[360px]:h-8.5 sm:w-10 sm:h-10 rounded-xl items-center justify-center text-[#2B211C] hover:text-[#A66A3F] hover:bg-[#F7F1E8] active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A66A3F] cursor-pointer"
                aria-label={`Wishlist with ${wishlistCount} items`}
              >
                <Heart className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                {wishlistCount > 0 && (
                  <span
                    key={wishlistCount}
                    className="absolute top-1 right-1 w-4 h-4 bg-[#A66A3F] text-white text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center animate-cart-pop"
                  >
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Cart Button with Animated Bounce Badge */}
              <button
                id="header-cart-button"
                onClick={() => setIsDrawerOpen(true)}
                className="relative w-8 h-8 min-[360px]:w-8.5 min-[360px]:h-8.5 sm:w-10 sm:h-10 rounded-xl bg-[#2A1812] text-[#F7F1E8] hover:bg-[#3B2418] transition-all active:scale-95 duration-200 flex items-center justify-center shadow-subtle border border-[#A66A3F]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A66A3F] cursor-pointer"
                aria-label={`Shopping cart with ${itemCount} items`}
              >
                <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#EFE3D2]" />
                {itemCount > 0 && (
                  <span
                    key={itemCount}
                    className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-[#A66A3F] text-white text-[9px] sm:text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-[#FCFAF6] animate-cart-pop shadow-warm-sm"
                  >
                    {itemCount}
                  </span>
                )}
              </button>

              {/* Account Dropdown */}
              <div className="relative" ref={dropdownRef}>
                {isLoading ? (
                  <div className="w-8 h-8 min-[360px]:w-8.5 min-[360px]:h-8.5 sm:h-10 sm:w-auto sm:px-3 rounded-full bg-[#3B2418]/5 flex items-center justify-center sm:gap-2 border border-[#DED2C4] animate-pulse">
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-[#A66A3F] border-t-transparent animate-spin" />
                    <span className="text-xs font-semibold text-[#6D625B] hidden sm:inline">Loading...</span>
                  </div>
                ) : user ? (
                  // Logged-in State: Circular avatar on mobile, name pill on tablet/desktop
                  <button
                    id="header-account-button"
                    onClick={() => setShowAccountModal(!showAccountModal)}
                    className="h-8 w-8 min-[360px]:h-8.5 min-[360px]:w-8.5 sm:h-10 sm:w-auto p-0 sm:pl-1.5 sm:pr-2.5 rounded-full bg-[#FCFAF6] hover:bg-[#F7F1E8] text-[#2B211C] transition-all flex items-center justify-center sm:gap-2 border border-[#DED2C4] shadow-warm-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A66A3F] cursor-pointer group shrink-0"
                    aria-label={`User Account Menu for ${customerDisplayName}`}
                  >
                    <ProfileAvatar user={user} size="header" />
                    <span className="hidden sm:inline text-xs font-bold max-w-[85px] md:max-w-[110px] truncate text-[#2B211C]">
                      {customerFirstName}
                    </span>
                    <ChevronDown className="hidden sm:inline w-3.5 h-3.5 text-[#6D625B] group-hover:text-[#2B211C] transition-transform duration-200" />
                  </button>
                ) : (
                  // Logged-out State: Icon-only on mobile, "Account" button on desktop
                  <button
                    id="header-account-button"
                    onClick={() => setShowAccountModal(!showAccountModal)}
                    className="w-8 h-8 min-[360px]:w-8.5 min-[360px]:h-8.5 sm:h-10 sm:w-auto p-0 sm:px-3 sm:px-3.5 rounded-full bg-[#F7F1E8] hover:bg-[#2A1812] text-[#2B211C] hover:text-[#F7F1E8] transition-colors flex items-center justify-center sm:gap-1.5 text-xs font-bold border border-[#DED2C4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A66A3F] cursor-pointer group shrink-0"
                    aria-label="SJT Customer Portal"
                  >
                    <User className="w-4 h-4 text-[#A66A3F] group-hover:text-[#F7F1E8] transition-colors" />
                    <span className="hidden sm:inline">Account</span>
                    <ChevronDown className="hidden sm:inline w-3.5 h-3.5 text-[#6D625B] group-hover:text-[#F7F1E8] transition-colors" />
                  </button>
                )}

                {/* Account Popup Modal: Constrained to viewport so it NEVER overflows horizontally */}
                {showAccountModal && !isLoading && (
                  <div className="absolute right-0 mt-2 w-[calc(100vw-1.25rem)] max-w-xs sm:w-76 bg-[#FCFAF6] rounded-2xl shadow-warm-lg border border-[#DED2C4] p-3.5 z-50 animate-fadeIn text-sm">
                    {user ? (
                      // LOGGED-IN CUSTOMER PORTAL
                      <>
                        <div className="p-3.5 bg-[#F7F1E8] rounded-xl mb-3 border border-[#DED2C4] text-center flex flex-col items-center">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-[#A66A3F] block">
                            SJT Customer Portal
                          </span>
                          <h4 className="font-serif font-bold text-sm text-[#2B211C] mt-0.5">
                            Welcome back, {customerDisplayName}
                          </h4>

                          <div className="my-3">
                            <ProfileAvatar user={user} size="popup" />
                          </div>

                          <p className="font-bold text-xs text-[#2B211C] truncate max-w-[220px]">
                            {customerDisplayName}
                          </p>
                          <p className="text-[11px] text-[#6D625B] truncate max-w-[220px]">
                            {user.email}
                          </p>
                          {isAdmin && (
                            <span className="mt-1.5 text-[9px] font-extrabold uppercase tracking-widest bg-[#2A1812] text-[#EFE3D2] px-2.5 py-0.5 rounded-full border border-[#A66A3F]/40 inline-block">
                              Verified Admin
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <button
                            onClick={() => {
                              navigateTo('dashboard', { tab: 'overview' });
                              setShowAccountModal(false);
                            }}
                            className="w-full text-left py-2 px-2.5 hover:bg-[#F7F1E8] rounded-xl text-[#2B211C] flex items-center justify-between text-xs font-semibold cursor-pointer transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <User className="w-4 h-4 text-[#A66A3F]" />
                              <span>My Account</span>
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-[#A66A3F]" />
                          </button>

                          <button
                            onClick={() => {
                              navigateTo('dashboard', { tab: 'orders' });
                              setShowAccountModal(false);
                            }}
                            className="w-full text-left py-2 px-2.5 hover:bg-[#F7F1E8] rounded-xl text-[#2B211C] flex items-center justify-between text-xs font-semibold cursor-pointer transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-[#A66A3F]" />
                              <span>My Orders</span>
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-[#A66A3F]" />
                          </button>

                          <button
                            onClick={() => {
                              handleNavClick('track-order');
                              setShowAccountModal(false);
                            }}
                            className="w-full text-left py-2 px-2.5 hover:bg-[#F7F1E8] rounded-xl text-[#2B211C] flex items-center justify-between text-xs font-semibold cursor-pointer transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <Truck className="w-4 h-4 text-[#A66A3F]" />
                              <span>Track Live Order</span>
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-[#A66A3F]" />
                          </button>

                          <button
                            onClick={() => {
                              handleNavClick('shop');
                              setShowAccountModal(false);
                            }}
                            className="w-full text-left py-2 px-2.5 hover:bg-[#F7F1E8] rounded-xl text-[#2B211C] flex items-center justify-between text-xs font-semibold cursor-pointer transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <ShoppingBag className="w-4 h-4 text-[#A66A3F]" />
                              <span>Browse Coffee Catalogue</span>
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-[#A66A3F]" />
                          </button>

                          <button
                            onClick={() => {
                              handleNavClick('wishlist');
                              setShowAccountModal(false);
                            }}
                            className="w-full text-left py-2 px-2.5 hover:bg-[#F7F1E8] rounded-xl text-[#2B211C] flex items-center justify-between text-xs font-semibold cursor-pointer transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <Heart className="w-4 h-4 text-[#A66A3F]" />
                              <span>Saved Wishlist</span>
                            </span>
                            {wishlistCount > 0 ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-[#EFE3D2] rounded-full text-[#2B211C]">
                                {wishlistCount}
                              </span>
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-[#A66A3F]" />
                            )}
                          </button>

                          <button
                            onClick={() => {
                              handleNavClick('contact');
                              setShowAccountModal(false);
                            }}
                            className="w-full text-left py-2 px-2.5 hover:bg-[#F7F1E8] rounded-xl text-[#2B211C] flex items-center justify-between text-xs font-semibold cursor-pointer transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <LifeBuoy className="w-4 h-4 text-[#A66A3F]" />
                              <span>Contact Farm Concierge</span>
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-[#A66A3F]" />
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => {
                                handleNavClick('admin');
                                setShowAccountModal(false);
                              }}
                              className="w-full text-left py-2 px-2.5 bg-[#3B2418]/5 hover:bg-[#2A1812] text-[#2B211C] hover:text-[#F7F1E8] rounded-xl flex items-center justify-between text-xs font-bold transition-all cursor-pointer border border-[#DED2C4]"
                            >
                              <span className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-[#A66A3F]" />
                                <span>Admin Management Console</span>
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-[#A66A3F]" />
                            </button>
                          )}

                          <div className="pt-1.5 border-t border-[#DED2C4]">
                            <button
                              onClick={async () => {
                                setShowAccountModal(false);
                                await logoutUser();
                              }}
                              className="w-full text-left py-2 px-2.5 text-[#B93826] hover:bg-[#B93826]/10 rounded-xl flex items-center justify-between text-xs font-bold transition-colors cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <LogOut className="w-4 h-4 text-[#B93826]" />
                                <span>Logout</span>
                              </span>
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      // LOGGED-OUT CUSTOMER PORTAL
                      <>
                        <div className="p-3.5 bg-[#F7F1E8] rounded-xl mb-3 border border-[#DED2C4] text-left">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-[#A66A3F] block">
                            SJT Customer Portal
                          </span>
                          <p className="text-xs text-[#6D625B] mt-0.5">
                            Manage orders, roasts & wishlist
                          </p>

                          <div className="mt-3 space-y-2">
                            <button
                              onClick={() => {
                                setShowAccountModal(false);
                                openAuthModal('register');
                              }}
                              className="w-full py-2.5 px-3 bg-[#2A1812] hover:bg-[#3B2418] text-[#F7F1E8] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-warm-sm"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-[#EFE3D2]" />
                              <span>Register Customer</span>
                            </button>
                            <button
                              onClick={() => {
                                setShowAccountModal(false);
                                openAuthModal('login');
                              }}
                              className="w-full py-2 px-3 bg-white hover:bg-[#F7F1E8] text-[#2B211C] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#DED2C4]"
                            >
                              <User className="w-3.5 h-3.5 text-[#A66A3F]" />
                              <span>Login</span>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <button
                            onClick={() => {
                              handleNavClick('shop');
                              setShowAccountModal(false);
                            }}
                            className="w-full text-left py-2 px-2.5 hover:bg-[#F7F1E8] rounded-xl text-[#2B211C] flex items-center justify-between text-xs font-semibold cursor-pointer transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <ShoppingBag className="w-4 h-4 text-[#A66A3F]" />
                              <span>Browse Coffee Catalogue</span>
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-[#A66A3F]" />
                          </button>

                          <button
                            onClick={() => {
                              handleNavClick('track-order');
                              setShowAccountModal(false);
                            }}
                            className="w-full text-left py-2 px-2.5 hover:bg-[#F7F1E8] rounded-xl text-[#2B211C] flex items-center justify-between text-xs font-semibold cursor-pointer transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <Truck className="w-4 h-4 text-[#A66A3F]" />
                              <span>Track Order Status</span>
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-[#A66A3F]" />
                          </button>

                          <button
                            onClick={() => {
                              handleNavClick('wishlist');
                              setShowAccountModal(false);
                            }}
                            className="w-full text-left py-2 px-2.5 hover:bg-[#F7F1E8] rounded-xl text-[#2B211C] flex items-center justify-between text-xs font-semibold cursor-pointer transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <Heart className="w-4 h-4 text-[#A66A3F]" />
                              <span>Saved Wishlist ({wishlistCount})</span>
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-[#EFE3D2] rounded-full text-[#2B211C]">
                              {wishlistCount}
                            </span>
                          </button>

                          <button
                            onClick={() => {
                              handleNavClick('contact');
                              setShowAccountModal(false);
                            }}
                            className="w-full text-left py-2 px-2.5 hover:bg-[#F7F1E8] rounded-xl text-[#2B211C] flex items-center justify-between text-xs font-semibold cursor-pointer transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <LifeBuoy className="w-4 h-4 text-[#A66A3F]" />
                              <span>Contact Farm Concierge</span>
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-[#A66A3F]" />
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => {
                                handleNavClick('admin');
                                setShowAccountModal(false);
                              }}
                              className="w-full text-left py-2 px-2.5 bg-[#3B2418]/5 hover:bg-[#2A1812] text-[#2B211C] hover:text-[#F7F1E8] rounded-xl flex items-center justify-between text-xs font-bold transition-all cursor-pointer border border-[#DED2C4]"
                            >
                              <span className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-[#A66A3F]" />
                                <span>Admin Management Console</span>
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-[#A66A3F]" />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Hamburger Button with Smooth Icon Animation */}
              <button
                id="header-mobile-menu-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden w-8 h-8 min-[360px]:w-8.5 min-[360px]:h-8.5 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-[#2B211C] hover:text-[#A66A3F] hover:bg-[#F7F1E8] active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A66A3F] cursor-pointer"
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={mobileMenuOpen}
              >
                <div className="w-4 h-3 sm:w-4.5 sm:h-3.5 relative flex flex-col justify-between">
                  <span
                    className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 transform origin-left ${
                      mobileMenuOpen ? 'rotate-45 translate-x-0.5' : ''
                    }`}
                  />
                  <span
                    className={`w-full h-0.5 bg-current rounded-full transition-opacity duration-200 ${
                      mobileMenuOpen ? 'opacity-0' : 'opacity-100'
                    }`}
                  />
                  <span
                    className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 transform origin-left ${
                      mobileMenuOpen ? '-rotate-45 translate-x-0.5' : ''
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE SLIDE-DOWN DRAWER MENU */}
        <div
          className={`lg:hidden fixed inset-x-0 top-14 sm:top-16 lg:top-[72px] bottom-0 bg-[#FCFAF6] z-50 overflow-y-auto overscroll-contain border-t border-[#DED2C4] transition-all duration-300 ease-in-out pb-[max(2rem,env(safe-area-inset-bottom))] ${
            mobileMenuOpen
              ? 'opacity-100 translate-y-0 pointer-events-auto visible'
              : 'opacity-0 -translate-y-2 pointer-events-none invisible'
          }`}
          aria-hidden={!mobileMenuOpen}
        >
          <div className="px-5 py-6 space-y-4 max-w-lg mx-auto">
            {/* Primary Navigation Links */}
            <nav className="flex flex-col space-y-1.5" aria-label="Mobile Navigation">
              {navLinks.map((link) => {
                const isActive = currentPage === link.page;
                return (
                  <button
                    key={link.page}
                    onClick={() => handleNavClick(link.page)}
                    className={`flex items-center justify-between text-left py-3 px-4 rounded-xl text-base font-semibold transition-all duration-200 active:scale-[0.99] ${
                      isActive
                        ? 'bg-[#EFE3D2] text-[#2A1812] shadow-warm-sm font-bold'
                        : 'text-[#2B211C] hover:bg-[#F7F1E8]'
                    }`}
                  >
                    <span>{link.label}</span>
                    <ChevronRight className="w-4 h-4 text-[#A66A3F]" />
                  </button>
                );
              })}
            </nav>

            {/* Quick User Utilities */}
            <div className="pt-4 border-t border-[#DED2C4] space-y-2">
              <button
                onClick={() => handleNavClick('track-order')}
                className="flex items-center justify-between w-full py-3 px-4 text-[#2B211C] hover:bg-[#F7F1E8] active:scale-[0.99] transition-all rounded-xl text-sm font-medium"
              >
                <div className="flex items-center gap-3">
                  <Truck className="w-4 h-4 text-[#A66A3F]" />
                  <span>Track Live Order</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#A66A3F]" />
              </button>

              <button
                onClick={() => handleNavClick('wishlist')}
                className="flex items-center justify-between w-full py-3 px-4 text-[#2B211C] hover:bg-[#F7F1E8] active:scale-[0.99] transition-all rounded-xl text-sm font-medium"
              >
                <div className="flex items-center gap-3">
                  <Heart className="w-4 h-4 text-[#A66A3F]" />
                  <span>My Wishlist</span>
                </div>
                <span className="text-xs font-bold bg-[#EFE3D2] px-2.5 py-0.5 rounded-full text-[#2B211C]">
                  {wishlistCount}
                </span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsDrawerOpen(true);
                }}
                className="flex items-center justify-between w-full py-3 px-4 bg-[#2A1812] text-[#F7F1E8] rounded-xl text-sm font-bold shadow-warm-sm active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-4 h-4 text-[#EFE3D2]" />
                  <span>View Shopping Cart</span>
                </div>
                <span className="text-xs bg-[#A66A3F] text-white px-2.5 py-0.5 rounded-full font-extrabold">
                  {itemCount}
                </span>
              </button>

              {/* Mobile Authentication Section */}
              {isLoading ? (
                <div className="p-4 bg-[#F7F1E8] rounded-2xl border border-[#DED2C4] animate-pulse flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-[#A66A3F] border-t-transparent animate-spin" />
                  <span className="text-xs text-[#6D625B]">Loading profile...</span>
                </div>
              ) : user ? (
                <div className="p-3.5 bg-[#F7F1E8] rounded-2xl border border-[#DED2C4] space-y-3">
                  <div className="flex items-center gap-3">
                    <ProfileAvatar user={user} size="header" />
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-[#A66A3F] block">
                        Welcome back
                      </span>
                      <p className="font-bold text-xs text-[#2B211C] truncate">{customerDisplayName}</p>
                      <p className="text-[11px] text-[#6D625B] truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#DED2C4] grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleNavClick('dashboard')}
                      className="py-2 px-3 bg-[#2A1812] text-[#F7F1E8] rounded-xl text-xs font-bold text-center cursor-pointer shadow-warm-sm active:scale-95 transition-transform"
                    >
                      My Account
                    </button>
                    <button
                      onClick={async () => {
                        setMobileMenuOpen(false);
                        await logoutUser();
                      }}
                      className="py-2 px-3 bg-[#B93826]/10 text-[#B93826] hover:bg-[#B93826]/20 rounded-xl text-xs font-bold text-center border border-[#B93826]/30 cursor-pointer active:scale-95 transition-transform"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-[#F7F1E8] rounded-2xl border border-[#DED2C4] space-y-3">
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#A66A3F] block">
                      SJT Customer Portal
                    </span>
                    <p className="text-xs text-[#6D625B]">Manage orders, roasts & wishlist</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        openAuthModal('register');
                      }}
                      className="py-2.5 px-3 bg-[#2A1812] text-[#F7F1E8] rounded-xl text-xs font-bold text-center cursor-pointer shadow-warm-sm active:scale-95 transition-transform"
                    >
                      Register
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        openAuthModal('login');
                      }}
                      className="py-2.5 px-3 bg-[#EFE3D2] text-[#2B211C] rounded-xl text-xs font-bold text-center border border-[#DED2C4] cursor-pointer active:scale-95 transition-transform"
                    >
                      Login
                    </button>
                  </div>
                </div>
              )}

              {isAdmin && (
                <button
                  onClick={() => handleNavClick('admin')}
                  className="flex items-center justify-between w-full py-2.5 px-4 text-[#A66A3F] hover:bg-[#3B2418]/5 rounded-xl text-xs font-semibold cursor-pointer border border-[#DED2C4]"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin Management Console</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mobile Drawer Footer Note */}
            <div className="pt-4 text-center">
              <p className="text-[11px] text-[#A66A3F] tracking-widest uppercase font-semibold">
                SJT FARMS — Pure Harvested Coffee
              </p>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
