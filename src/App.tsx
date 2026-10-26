import React, { useEffect } from 'react';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { AuthProvider } from './context/AuthContext';
import { clearAllScrollLocks } from './utils/scrollLock';

import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { CartDrawer } from './components/common/CartDrawer';
import { SearchOverlay } from './components/common/SearchOverlay';
import { QuickViewModal } from './components/common/QuickViewModal';
import { BrewDetailModal } from './components/common/BrewDetailModal';
import { AuthModal } from './components/auth/AuthModal';
import { SEOManager } from './components/common/SEOManager';
import { WhatsAppFloatingWidget } from './components/common/WhatsAppFloatingWidget';

// Pages
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { BrewGuidePage } from './pages/BrewGuidePage';
import { OurFarmPage } from './pages/OurFarmPage';
import { AboutPage } from './pages/AboutPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { AccessoriesPage } from './pages/AccessoriesPage';
import { ContactPage } from './pages/ContactPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { FAQPage } from './pages/FAQPage';
import { WishlistPage } from './pages/WishlistPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { CustomerDashboardPage } from './pages/CustomerDashboardPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { WhatsAppConciergePage } from './pages/WhatsAppConciergePage';

const AppContent: React.FC = () => {
  const { currentPage, dashboardTab, adminTab } = useNavigation();

  // Ensure body scroll is unconditionally restored on route transitions
  useEffect(() => {
    clearAllScrollLocks();
  }, [currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case 'whatsapp-concierge':
      case 'concierge':
        return <WhatsAppConciergePage />;
      case 'track-order':
      case 'tracking':
        return <OrderTrackingPage />;
      case 'shop':
        return <ShopPage />;
      case 'product':
      case 'product-detail':
        return <ProductDetailPage />;
      case 'brew-guide':
        return <BrewGuidePage />;
      case 'our-farm':
        return <OurFarmPage />;
      case 'about':
        return <AboutPage />;
      case 'reviews':
        return <ReviewsPage />;
      case 'subscription':
        return <SubscriptionPage />;
      case 'accessories':
        return <AccessoriesPage />;
      case 'contact':
        return <ContactPage />;
      case 'cart':
        return <CartPage />;
      case 'checkout':
        return <CheckoutPage />;
      case 'order-success':
        return <OrderSuccessPage />;
      case 'faq':
        return <FAQPage />;
      case 'wishlist':
        return <WishlistPage />;
      case 'dashboard':
      case 'account':
        return <CustomerDashboardPage initialTab={dashboardTab} />;
      case 'profile':
        return <CustomerDashboardPage initialTab="profile" />;
      case 'orders':
        return <CustomerDashboardPage initialTab="orders" />;
      case 'admin-login':
        return <AdminLoginPage />;
      case 'admin':
        return <AdminDashboardPage initialTab={adminTab} />;
      case 'home':
      default:
        return <HomePage />;
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-[#F7F2EA] text-[#201814] font-sans antialiased">
      {/* Dynamic Canonical URL & SEO Manager */}
      <SEOManager />

      {/* Sticky Header */}
      <Header />

      {/* Main Page Body with Smooth Page Transition */}
      <main key={currentPage} className="flex-1 animate-fadeIn">
        {renderPage()}
      </main>

      {/* Full Editorial Footer */}
      <Footer />

      {/* Global Interactive Overlays */}
      <CartDrawer />
      <SearchOverlay />
      <QuickViewModal />
      <BrewDetailModal />
      <AuthModal />
      <WhatsAppFloatingWidget />
    </div>
  );
};

export default function App() {
  return (
    <CartProvider>
      <WishlistProvider>
        <NavigationProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </NavigationProvider>
      </WishlistProvider>
    </CartProvider>
  );
}
