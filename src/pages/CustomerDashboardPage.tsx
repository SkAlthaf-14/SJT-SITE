import React, { useState, useEffect } from 'react';
import {
  Package,
  Heart,
  User as UserIcon,
  Search,
  ExternalLink,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  Truck,
  RotateCw,
  LogOut,
  Coffee,
  MessageSquare,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { GoogleProfileAvatar } from '../components/auth/GoogleProfileAvatar';
import { PRODUCTS } from '../data/products';
import { OrderDetails } from '../types';
import { subscribeCustomerOrders, formatDisplayOrderId } from '../services/orders';
import { buildWhatsAppLink, WHATSAPP_TEMPLATES } from '../config/whatsapp';


interface CustomerDashboardPageProps {
  initialTab?: 'overview' | 'orders' | 'profile' | 'tracking';
}

export const CustomerDashboardPage: React.FC<CustomerDashboardPageProps> = ({
  initialTab = 'overview',
}) => {
  const { user, isLoading, logoutUser, openAuthModal, updateProfileData } = useAuth();
  const { navigateTo } = useNavigation();
  const { wishlist } = useWishlist();
  const { addItem } = useCart();

  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'profile' | 'tracking'>(
    initialTab
  );
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [trackingQuery, setTrackingQuery] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<OrderDetails | null>(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleStartEditProfile = () => {
    if (user) {
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
      setIsEditingProfile(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!updateProfileData) return;
    setIsSavingProfile(true);
    try {
      await updateProfileData({
        fullName: editName,
        phone: editPhone,
      });
      setIsEditingProfile(false);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Sync tab if prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Load customer orders directly from Firestore in real-time
  useEffect(() => {
    if (!user?.uid) {
      setOrders([]);
      return;
    }

    const unsub = subscribeCustomerOrders(
      user.uid,
      user.email,
      (liveOrders) => {
        setOrders(liveOrders);
      },
      (err) => {
        console.warn('[Customer Dashboard] Orders listener notice:', err);
        try {
          const stored = localStorage.getItem('sjt_customer_orders');
          if (stored) setOrders(JSON.parse(stored));
        } catch {}
      }
    );

    return () => unsub();
  }, [user?.uid, user?.email]);


  // Filter recommended coffees (top 3)
  const recommendedCoffees = PRODUCTS.slice(0, 3);

  // If authentication session is being checked, show professional SJT FARMS loading state
  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[var(--coffee-bg)] px-4 py-16 animate-fadeIn">
        <div className="w-12 h-12 rounded-full border-3 border-[var(--coffee-caramel)] border-t-transparent animate-spin mb-4" />
        <h2 className="font-serif text-xl font-bold text-[var(--coffee-espresso)]">SJT FARMS</h2>
        <p className="text-xs text-[var(--coffee-text-muted)] mt-1 tracking-wide">Loading your account...</p>
      </div>
    );
  }

  // If not logged in, show elegant login prompt
  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[var(--coffee-bg)] px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-[var(--coffee-border)] shadow-md text-center space-y-5 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-[var(--coffee-espresso)] flex items-center justify-center text-[var(--coffee-cream)] mx-auto border border-[var(--coffee-caramel)]/30">
            <UserIcon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--coffee-espresso)]">
              Customer Portal
            </h1>
            <p className="text-sm text-[var(--coffee-text-muted)] mt-2">
              Please sign in to access your SJT customer dashboard, order history, and estate privileges.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={() => openAuthModal('login')}
              className="w-full py-3 px-6 bg-[var(--coffee-espresso)] text-[var(--coffee-cream)] hover:bg-[var(--coffee-roast)] rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Sign In to Your Account</span>
              <ArrowRight className="w-4 h-4 text-[var(--coffee-caramel)]" />
            </button>
            <button
              onClick={() => openAuthModal('register')}
              className="w-full py-2.5 px-6 bg-[var(--coffee-cream)] hover:bg-[var(--coffee-cream-dark)] text-[var(--coffee-espresso)] rounded-xl font-semibold text-xs border border-[var(--coffee-border)] transition-colors cursor-pointer"
            >
              Create New SJT Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle Order Search for Tracking
  const handleTrackSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingQuery.trim()) return;
    const clean = trackingQuery.trim().toLowerCase().replace(/^order\s*#?|^#/, '');
    const found = orders.find((o) =>
      o.orderId.toLowerCase().includes(clean) ||
      (o.orderNumber && String(o.orderNumber).includes(clean)) ||
      (o.displayId && o.displayId.toLowerCase().includes(clean))
    );
    setSearchedOrder(found || null);
  };

  return (
    <div className="min-h-screen bg-[var(--coffee-bg)] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
        {/* ============================================================ */}
        {/* 1. HERO HEADER: Welcome back, [Name] + GoogleProfileAvatar   */}
        {/* ============================================================ */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--coffee-border)] shadow-xs relative overflow-hidden">
          {/* Subtle Ambient Decorative Gradient */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[var(--coffee-caramel)]/5 via-[var(--coffee-cream)]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 text-center sm:text-left">
            {/* Google Profile Avatar */}
            <div className="relative group">
              <GoogleProfileAvatar
                user={user}
                size="xl"
                className="shadow-md ring-4 ring-[var(--coffee-caramel)]/20"
              />
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-xs" />
            </div>

            {/* User Meta Information */}
            <div className="flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[var(--coffee-cream)] text-[var(--coffee-roast)] border border-[var(--coffee-border)]">
                  Estate Brew Club
                </span>
                {user.provider === 'google' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center gap-1">
                    <svg className="w-3 h-3" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    Google Connected
                  </span>
                )}
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--coffee-espresso)] tracking-tight">
                Welcome back, {user.name}
              </h1>

              <p className="text-sm text-[var(--coffee-text-muted)] flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[var(--coffee-caramel)]" />
                <span>{user.email}</span>
                {user.phone && (
                  <>
                    <span className="text-[var(--coffee-border-dark)]">•</span>
                    <Phone className="w-3.5 h-3.5 text-[var(--coffee-caramel)]" />
                    <span>{user.phone}</span>
                  </>
                )}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              <button
                onClick={logoutUser}
                className="min-h-[42px] px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 active:scale-95 border border-rose-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                title="Sign out of account"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Navigation Subtabs */}
          <div className="flex items-center gap-2 sm:gap-3 mt-8 pt-6 border-t border-[var(--coffee-border)] overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: 'Overview', icon: Sparkles },
              { id: 'orders', label: `My Orders (${orders.length})`, icon: Package },
              { id: 'profile', label: 'My Profile', icon: UserIcon },
              { id: 'tracking', label: 'Track Order', icon: Truck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`min-h-[44px] px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all active:scale-95 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[var(--coffee-espresso)] text-[var(--coffee-cream)] shadow-xs'
                      : 'bg-[var(--coffee-cream)] text-[var(--coffee-text-muted)] hover:text-[var(--coffee-espresso)] hover:bg-[var(--coffee-cream-dark)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. OVERVIEW TAB: Primary 4 Cards                             */}
        {/* ============================================================ */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            {/* The 4 Main Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Card 1: My Orders */}
              <button
                onClick={() => setActiveTab('orders')}
                className="p-6 bg-white rounded-2xl border border-[var(--coffee-border)] shadow-xs hover:shadow-md hover:border-[var(--coffee-border-dark)] transition-all text-left group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--coffee-cream)] text-[var(--coffee-caramel)] group-hover:bg-[var(--coffee-espresso)] group-hover:text-[var(--coffee-cream)] flex items-center justify-center mb-4 transition-colors">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[var(--coffee-espresso)] mb-1">My Orders</h3>
                <p className="text-xs text-[var(--coffee-text-muted)] mb-3">
                  {orders.length === 0
                    ? 'No orders placed yet'
                    : `${orders.length} estate order${orders.length > 1 ? 's' : ''} recorded`}
                </p>
                <span className="text-xs font-bold text-[var(--coffee-caramel)] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  View Orders <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>

              {/* Card 2: Wishlist */}
              <button
                onClick={() => navigateTo('wishlist')}
                className="p-6 bg-white rounded-2xl border border-[var(--coffee-border)] shadow-xs hover:shadow-md hover:border-[var(--coffee-border-dark)] transition-all text-left group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--coffee-cream)] text-[var(--coffee-caramel)] group-hover:bg-[var(--coffee-espresso)] group-hover:text-[var(--coffee-cream)] flex items-center justify-center mb-4 transition-colors">
                  <Heart className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[var(--coffee-espresso)] mb-1">Wishlist</h3>
                <p className="text-xs text-[var(--coffee-text-muted)] mb-3">
                  {wishlist.length === 0
                    ? 'Explore roasts to save'
                    : `${wishlist.length} coffee${wishlist.length > 1 ? 's' : ''} saved`}
                </p>
                <span className="text-xs font-bold text-[var(--coffee-caramel)] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Open Wishlist <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>

              {/* Card 3: My Profile */}
              <button
                onClick={() => setActiveTab('profile')}
                className="p-6 bg-white rounded-2xl border border-[var(--coffee-border)] shadow-xs hover:shadow-md hover:border-[var(--coffee-border-dark)] transition-all text-left group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--coffee-cream)] text-[var(--coffee-caramel)] group-hover:bg-[var(--coffee-espresso)] group-hover:text-[var(--coffee-cream)] flex items-center justify-center mb-4 transition-colors">
                  <UserIcon className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[var(--coffee-espresso)] mb-1">My Profile</h3>
                <p className="text-xs text-[var(--coffee-text-muted)] mb-3">
                  Manage personal details & address
                </p>
                <span className="text-xs font-bold text-[var(--coffee-caramel)] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  View Profile <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>

              {/* Card 4: Track Order */}
              <button
                onClick={() => setActiveTab('tracking')}
                className="p-6 bg-white rounded-2xl border border-[var(--coffee-border)] shadow-xs hover:shadow-md hover:border-[var(--coffee-border-dark)] transition-all text-left group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--coffee-cream)] text-[var(--coffee-caramel)] group-hover:bg-[var(--coffee-espresso)] group-hover:text-[var(--coffee-cream)] flex items-center justify-center mb-4 transition-colors">
                  <Truck className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[var(--coffee-espresso)] mb-1">Track Order</h3>
                <p className="text-xs text-[var(--coffee-text-muted)] mb-3">
                  Real-time consignment dispatch info
                </p>
                <span className="text-xs font-bold text-[var(--coffee-caramel)] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Track Consignment <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
            </div>

            {/* Recent Orders Section */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--coffee-border)] shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-[var(--coffee-espresso)]">
                    Recent Orders
                  </h2>
                  <p className="text-xs text-[var(--coffee-text-muted)] mt-0.5">
                    Your estate roasted packages in dispatch and delivery
                  </p>
                </div>
                {orders.length > 0 && (
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-[var(--coffee-caramel)] hover:text-[var(--coffee-espresso)] transition-colors"
                  >
                    View All ({orders.length})
                  </button>
                )}
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-10 px-4 bg-[var(--coffee-cream)]/40 rounded-2xl border border-dashed border-[var(--coffee-border)]">
                  <Coffee className="w-10 h-10 text-[var(--coffee-caramel)] mx-auto mb-3" />
                  <p className="font-serif font-bold text-[var(--coffee-espresso)] text-base">
                    No orders placed yet
                  </p>
                  <p className="text-xs text-[var(--coffee-text-muted)] mt-1 max-w-sm mx-auto mb-4">
                    Explore our single-origin harvests freshly roasted on the hills of Chikmagalur.
                  </p>
                  <button
                    onClick={() => navigateTo('shop')}
                    className="py-2.5 px-6 bg-[var(--coffee-espresso)] text-[var(--coffee-cream)] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[var(--coffee-roast)] transition-all cursor-pointer active:scale-95 shadow-xs"
                  >
                    Explore Coffee Catalogue
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 3).map((order) => (
                    <div
                      key={order.orderId}
                      className="p-4 bg-[var(--coffee-cream)]/30 rounded-2xl border border-[var(--coffee-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[var(--coffee-espresso)]">
                            {formatDisplayOrderId(order.orderNumber || order.orderId)}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--coffee-cream)] text-[var(--coffee-roast)] border border-[var(--coffee-border)]">
                            {order.orderStatus}
                          </span>
                          <span className="text-xs text-[var(--coffee-text-muted)]">
                            • {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--coffee-text-muted)]">
                          {order.items.map((i) => `${i.product.name} (${i.selectedWeight}) x${i.quantity}`).join(', ')}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                        <span className="font-bold text-sm text-[var(--coffee-espresso)]">
                          ₹{order.total.toLocaleString('en-IN')}
                        </span>
                        <button
                          onClick={() => {
                            setSearchedOrder(order);
                            setActiveTab('tracking');
                          }}
                          className="px-3.5 py-2 bg-white hover:bg-[var(--coffee-cream)] text-[var(--coffee-espresso)] rounded-xl text-xs font-semibold border border-[var(--coffee-border)] transition-all cursor-pointer active:scale-95"
                        >
                          Track Package
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommended Coffee Section */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E4D8C8] shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#201814]">
                    Recommended Coffee
                  </h2>
                  <p className="text-xs text-[#6B5B52] mt-0.5">
                    Curated single-origin favorites roasted to perfection
                  </p>
                </div>
                <button
                  onClick={() => navigateTo('shop')}
                  className="text-xs font-bold text-[#A37936] hover:text-[#201814] transition-colors"
                >
                  View Full Shop
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {recommendedCoffees.map((product) => (
                  <div
                    key={product.id}
                    className="p-4 bg-[#FBF7F0] rounded-2xl border border-[#E4D8C8] flex flex-col justify-between group hover:border-[#C49A5A] transition-all"
                  >
                    <div>
                      <div className="w-full h-36 rounded-xl overflow-hidden mb-3 bg-[#EAE0D3]">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-[#A37936] uppercase tracking-wider block">
                        {product.roastLevel} Roast
                      </span>
                      <h4 className="font-serif font-bold text-sm text-[#201814] mt-0.5 line-clamp-1">
                        {product.name}
                      </h4>
                      <p className="text-xs text-[#6B5B52] line-clamp-2 mt-1">
                        {product.flavourNotes.join(' • ')}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E4D8C8] flex items-center justify-between">
                      <span className="font-bold text-sm text-[#201814]">
                        ₹{product.price}
                      </span>
                      <button
                        onClick={() => {
                          addItem(product, product.weights[0], 1);
                          navigateTo('cart');
                        }}
                        className="px-3 py-1.5 bg-[#24150F] hover:bg-[#342017] text-[#DFBF82] rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Farm Support Section */}
            <div className="bg-gradient-to-br from-[#24150F] to-[#150B07] text-[#F7F2EA] rounded-3xl p-6 sm:p-8 shadow-md border border-[#C49A5A]/30 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 text-[#DFBF82]">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Direct Farm Support & Concierge
                  </span>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold">
                  Need customized grind size or brewing advice?
                </h3>
                <p className="text-xs sm:text-sm text-[#DFBF82]/80 max-w-xl">
                  Connect with our estate roasters directly. We are delighted to assist with corporate orders, custom grind sizes, or wholesale subscriptions.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
                <a
                  href={buildWhatsAppLink(WHATSAPP_TEMPLATES.customerSupport.en)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>WhatsApp Farm</span>
                </a>
                <button
                  onClick={() => navigateTo('contact')}
                  className="px-4 py-2.5 bg-[#DFBF82] hover:bg-[#E8CE9D] text-[#24150F] rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Contact Page</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 3. MY ORDERS TAB                                             */}
        {/* ============================================================ */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--coffee-border)] shadow-xs space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[var(--coffee-border)] pb-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-[var(--coffee-espresso)]">
                  All Order History
                </h2>
                <p className="text-xs text-[var(--coffee-text-muted)] mt-0.5">
                  Detailed view of all purchases, roast dispatches, and delivery invoices
                </p>
              </div>
              <button
                onClick={() => navigateTo('shop')}
                className="px-4 py-2 bg-[var(--coffee-espresso)] text-[var(--coffee-cream)] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[var(--coffee-roast)] transition-all active:scale-95 shadow-xs"
              >
                + Place New Order
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Package className="w-12 h-12 text-[var(--coffee-caramel)] mx-auto mb-3" />
                <h3 className="font-serif font-bold text-lg text-[var(--coffee-espresso)]">
                  No orders recorded yet
                </h3>
                <p className="text-xs text-[var(--coffee-text-muted)] mt-1 mb-4">
                  Once you order freshly roasted coffee from SJT FARMS, it will appear here.
                </p>
                <button
                  onClick={() => navigateTo('shop')}
                  className="py-2.5 px-6 bg-[var(--coffee-espresso)] text-[var(--coffee-cream)] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[var(--coffee-roast)] transition-all active:scale-95"
                >
                  Browse Coffee
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((ord) => (
                  <div
                    key={ord.orderId}
                    className="p-5 bg-[var(--coffee-cream)]/20 rounded-2xl border border-[var(--coffee-border)] space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--coffee-border)]/60 pb-3">
                      <div>
                        <span className="text-[11px] text-[var(--coffee-text-muted)] uppercase tracking-wider block">
                          Order Number
                        </span>
                        <span className="font-mono font-bold text-base text-[var(--coffee-espresso)]">
                          {formatDisplayOrderId(ord.orderNumber || ord.orderId)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--coffee-cream)] text-[var(--coffee-roast)] border border-[var(--coffee-border)]">
                          {ord.orderStatus}
                        </span>
                        <span className="text-xs text-[var(--coffee-text-muted)]">
                          Placed on {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                        </span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-2">
                      {ord.items.map((it, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs sm:text-sm text-[var(--coffee-text)]"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[var(--coffee-espresso)]">{it.product.name}</span>
                            <span className="text-[11px] text-[var(--coffee-text-muted)]">({it.selectedWeight})</span>
                            <span className="text-[11px] text-[var(--coffee-caramel)] font-bold">x{it.quantity}</span>
                          </div>
                          <span className="font-bold text-[var(--coffee-espresso)]">
                            ₹{(it.price * it.quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Total & Action */}
                    <div className="pt-3 border-t border-[var(--coffee-border)]/60 flex items-center justify-between">
                      <div className="text-xs text-[var(--coffee-text-muted)]">
                        Payment: <span className="font-semibold text-[var(--coffee-espresso)]">{ord.paymentMethod.toUpperCase()}</span> ({ord.paymentStatus})
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-base text-[var(--coffee-espresso)]">
                          Total: ₹{ord.total.toLocaleString('en-IN')}
                        </span>
                        <button
                          onClick={() => {
                            setSearchedOrder(ord);
                            setActiveTab('tracking');
                          }}
                          className="px-4 py-2 bg-[var(--coffee-espresso)] hover:bg-[var(--coffee-roast)] text-[var(--coffee-cream)] rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-xs"
                        >
                          Track Package
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* 4. MY PROFILE TAB                                            */}
        {/* ============================================================ */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--coffee-border)] shadow-xs space-y-6 animate-fadeIn">
            <div className="border-b border-[var(--coffee-border)] pb-4 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-bold text-[var(--coffee-espresso)]">
                  Customer Profile
                </h2>
                <p className="text-xs text-[var(--coffee-text-muted)] mt-0.5">
                  Personal credentials and account security
                </p>
              </div>
              {!isEditingProfile && (
                <button
                  type="button"
                  onClick={handleStartEditProfile}
                  className="px-4 py-2 bg-[var(--coffee-espresso)] hover:bg-[var(--coffee-roast)] text-[var(--coffee-cream)] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Avatar Preview Card */}
              <div className="p-6 bg-[var(--coffee-cream)]/20 rounded-2xl border border-[var(--coffee-border)] text-center space-y-4 flex flex-col items-center justify-center">
                <GoogleProfileAvatar
                  user={user}
                  size="2xl"
                  className="shadow-lg ring-4 ring-[var(--coffee-caramel)]/30"
                />
                <div>
                  <h3 className="font-serif font-bold text-lg text-[var(--coffee-espresso)]">{user.name}</h3>
                  <p className="text-xs text-[var(--coffee-text-muted)]">{user.email}</p>
                </div>
                <div className="px-3 py-1 bg-[var(--coffee-cream)] text-[var(--coffee-roast)] border border-[var(--coffee-border)] rounded-full text-[11px] font-bold">
                  {user.provider === 'google' ? 'Google Account Profile' : 'Email & Password Account'}
                </div>
              </div>

              {/* Account Details Form */}
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--coffee-text-muted)] uppercase mb-1">
                      Full Name {isEditingProfile && <span className="text-[var(--coffee-caramel)]">*</span>}
                    </label>
                    <input
                      type="text"
                      value={isEditingProfile ? editName : user.name}
                      onChange={isEditingProfile ? (e) => setEditName(e.target.value) : undefined}
                      readOnly={!isEditingProfile}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isEditingProfile
                          ? 'bg-white border-2 border-[var(--coffee-caramel)] text-[var(--coffee-espresso)] focus:outline-hidden'
                          : 'bg-[var(--coffee-cream)]/30 border border-[var(--coffee-border)] text-[var(--coffee-espresso)]'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--coffee-text-muted)] uppercase mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      readOnly
                      className="w-full px-3.5 py-2.5 bg-[var(--coffee-cream)]/30 border border-[var(--coffee-border)] rounded-xl text-sm font-semibold text-[var(--coffee-espresso)] opacity-80"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--coffee-text-muted)] uppercase mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={isEditingProfile ? editPhone : (user.phone || 'Not provided')}
                      onChange={isEditingProfile ? (e) => setEditPhone(e.target.value) : undefined}
                      readOnly={!isEditingProfile}
                      placeholder="+91 98765 43210"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isEditingProfile
                          ? 'bg-white border-2 border-[var(--coffee-caramel)] text-[var(--coffee-espresso)] focus:outline-hidden'
                          : 'bg-[var(--coffee-cream)]/30 border border-[var(--coffee-border)] text-[var(--coffee-espresso)]'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--coffee-text-muted)] uppercase mb-1">
                      Authentication Provider
                    </label>
                    <input
                      type="text"
                      value={user.provider?.toUpperCase() || 'FIREBASE AUTHENTICATION'}
                      readOnly
                      className="w-full px-3.5 py-2.5 bg-[var(--coffee-cream)]/30 border border-[var(--coffee-border)] rounded-xl text-sm font-semibold text-[var(--coffee-espresso)] opacity-80"
                    />
                  </div>
                </div>

                {isEditingProfile && (
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isSavingProfile}
                      onClick={handleSaveProfile}
                      className="px-5 py-2.5 bg-[var(--coffee-espresso)] hover:bg-[var(--coffee-roast)] text-[var(--coffee-cream)] text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2 active:scale-95"
                    >
                      {isSavingProfile ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-[var(--coffee-cream)] border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Profile Changes'
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={isSavingProfile}
                      onClick={() => setIsEditingProfile(false)}
                      className="px-4 py-2.5 bg-[var(--coffee-cream)] hover:bg-[var(--coffee-cream-dark)] text-[var(--coffee-espresso)] text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Security Note */}
                <div className="p-4 bg-[var(--coffee-cream)]/40 border border-[var(--coffee-border)] rounded-2xl flex items-start gap-3 text-xs text-[var(--coffee-espresso)] mt-4">
                  <ShieldCheck className="w-5 h-5 text-[var(--coffee-caramel)] shrink-0 mt-0.5" />
                  <p>
                    <strong>Estate Security Standard:</strong> Your authentication is protected by Firebase Authentication with encrypted credentials and secure sessions. SJT FARMS never stores banking passwords, card numbers, or OAuth private secrets in plain text.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 5. TRACK ORDER TAB                                           */}
        {/* ============================================================ */}
        {activeTab === 'tracking' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--coffee-border)] shadow-xs space-y-6 animate-fadeIn">
            <div className="border-b border-[var(--coffee-border)] pb-4">
              <h2 className="font-serif text-2xl font-bold text-[var(--coffee-espresso)]">
                Consignment Dispatch Tracker
              </h2>
              <p className="text-xs text-[var(--coffee-text-muted)] mt-0.5">
                Check delivery milestones for your roasted coffee package
              </p>
            </div>

            {/* Tracking Search Input */}
            <form onSubmit={handleTrackSearch} className="flex gap-2 max-w-lg">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={trackingQuery}
                  onChange={(e) => setTrackingQuery(e.target.value)}
                  placeholder="Enter Order ID (e.g. SJT-2026-...) or AWB"
                  className="w-full px-4 py-2.5 bg-[var(--coffee-cream)]/30 border border-[var(--coffee-border)] rounded-xl text-sm text-[var(--coffee-espresso)] focus:outline-none focus:border-[var(--coffee-caramel)] focus:ring-1 focus:ring-[var(--coffee-caramel)]"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[var(--coffee-espresso)] text-[var(--coffee-cream)] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[var(--coffee-roast)] transition-all cursor-pointer active:scale-95 shadow-xs"
              >
                Track
              </button>
            </form>

            {searchedOrder ? (
              <div className="p-6 bg-[var(--coffee-cream)]/20 rounded-2xl border border-[var(--coffee-border)] space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--coffee-border)]/60 pb-3">
                  <div>
                    <span className="text-[11px] text-[var(--coffee-text-muted)] uppercase tracking-wider block">
                      Tracking Order
                    </span>
                    <span className="font-mono font-bold text-lg text-[var(--coffee-espresso)]">
                      {formatDisplayOrderId(searchedOrder.orderNumber || searchedOrder.orderId)}
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--coffee-cream)] text-[var(--coffee-roast)] border border-[var(--coffee-border)]">
                    Status: {searchedOrder.orderStatus}
                  </span>
                </div>

                {/* Progress Steps */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
                  {[
                    { step: '1', title: 'Order Placed', desc: 'Received & Queued', done: true },
                    { step: '2', title: 'Freshly Roasted', desc: 'Chikmagalur Roastery', done: true },
                    { step: '3', title: 'Dispatched', desc: 'Air Courier Handover', done: searchedOrder.orderStatus !== 'Pending' },
                    { step: '4', title: 'Delivered', desc: 'Doorstep Delivery', done: searchedOrder.orderStatus === 'Delivered' },
                  ].map((s) => (
                    <div
                      key={s.step}
                      className={`p-3.5 rounded-xl border ${
                        s.done
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-white border-[var(--coffee-border)] text-[var(--coffee-text-muted)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            s.done
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[var(--coffee-cream)] text-[var(--coffee-text-muted)]'
                          }`}
                        >
                          {s.done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.step}
                        </span>
                        <span className="font-bold text-xs">{s.title}</span>
                      </div>
                      <p className="text-[11px] opacity-80">{s.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-[var(--coffee-text-muted)] bg-white p-4 rounded-xl border border-[var(--coffee-border)]">
                  <p>
                    <strong className="text-[var(--coffee-espresso)]">Delivery Address:</strong> {searchedOrder.customer?.address || 'Standard Address'}, {searchedOrder.customer?.city || 'Bengaluru'}, {searchedOrder.customer?.state || 'Karnataka'} - {searchedOrder.customer?.pincode || ''}
                  </p>
                </div>
              </div>
            ) : orders.length > 0 ? (
              <div className="text-xs text-[var(--coffee-text-muted)]">
                Tip: You have {orders.length} order(s). Click "Track Package" on any order in your recent orders list to view its journey.
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
