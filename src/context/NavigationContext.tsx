import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, OrderDetails } from '../types';
import { PRODUCTS, getDefaultProductVariant, isValidProductVariant } from '../data/products';
import { clearAllScrollLocks } from '../utils/scrollLock';

export type AdminTab =
  | 'overview'
  | 'orders'
  | 'customers'
  | 'products'
  | 'payments'
  | 'contacts'
  | 'reviews'
  | 'analytics'
  | 'excel';

interface NavigationContextType {
  currentPage: string;
  currentProduct: Product | null;
  currentVariant: string | null;
  setCurrentVariant: (variant: string | null) => void;
  currentOrder: OrderDetails | null;
  selectedCategory: string;
  searchFilter: string;
  dashboardTab: 'overview' | 'orders' | 'profile' | 'tracking';
  adminTab: AdminTab;
  setDashboardTab: (tab: 'overview' | 'orders' | 'profile' | 'tracking') => void;
  setAdminTab: (tab: AdminTab) => void;
  navigateTo: (
    page: string,
    params?: {
      product?: Product;
      variant?: string;
      order?: OrderDetails;
      category?: string;
      search?: string;
      tab?: 'overview' | 'orders' | 'profile' | 'tracking' | AdminTab;
    }
  ) => void;
  openQuickView: (product: Product, initialWeight?: string) => void;
  closeQuickView: () => void;
  quickViewProduct: Product | null;
  quickViewInitialWeight: string | null;
  openBrewModal: (brewId: string) => void;
  closeBrewModal: () => void;
  activeBrewId: string | null;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [currentProduct, setCurrentProduct] = useState<Product | null>(PRODUCTS[0]);
  const [currentVariant, setCurrentVariant] = useState<string | null>(getDefaultProductVariant(PRODUCTS[0]));
  const [currentOrder, setCurrentOrder] = useState<OrderDetails | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'orders' | 'profile' | 'tracking'>('overview');
  const [adminTab, setAdminTab] = useState<AdminTab>('overview');

  // Modals
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewInitialWeight, setQuickViewInitialWeight] = useState<string | null>(null);
  const [activeBrewId, setActiveBrewId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Sync pathname and hash routing
  useEffect(() => {
    const handleRouteChange = () => {
      clearAllScrollLocks();
      const rawHash = window.location.hash || '';
      const pathname = window.location.pathname.toLowerCase();

      // Ignore OAuth callback hashes so auth processing is not interrupted
      if (
        rawHash.includes('access_token=') ||
        rawHash.includes('id_token=') ||
        rawHash.includes('confirmation_token=') ||
        rawHash.includes('recovery_token=') ||
        rawHash.includes('invite_token=') ||
        rawHash.includes('email_change_token=') ||
        rawHash.includes('error=')
      ) {
        return;
      }

      // Check pathname first
      if (pathname === '/admin/login') {
        setCurrentPage('admin-login');
        return;
      }

      if (pathname.startsWith('/admin')) {
        const sub = pathname.replace('/admin', '').replace(/^\/+/, '');
        setCurrentPage('admin');
        if (sub === 'orders') setAdminTab('orders');
        else if (sub === 'customers') setAdminTab('customers');
        else if (sub === 'products') setAdminTab('products');
        else if (sub === 'payments') setAdminTab('payments');
        else if (sub === 'contacts') setAdminTab('contacts');
        else if (sub === 'reviews') setAdminTab('reviews');
        else if (sub === 'analytics') setAdminTab('analytics');
        else if (sub === 'export' || sub === 'excel') setAdminTab('excel');
        else setAdminTab('overview');
        return;
      }

      // Helper to extract variant from query string or URL search
      const extractVariantFromParams = (queryStr?: string): string | null => {
        if (queryStr) {
          const q = new URLSearchParams(queryStr);
          const v = q.get('variant') || q.get('weight') || q.get('size');
          if (v) return v;
        }
        if (typeof window !== 'undefined' && window.location.search) {
          const searchQ = new URLSearchParams(window.location.search);
          const v = searchQ.get('variant') || searchQ.get('weight') || searchQ.get('size');
          if (v) return v;
        }
        return null;
      };

      // Helper to match product slugs flexibly
      const findProductBySlugOrId = (rawInput: string): Product | undefined => {
        if (!rawInput) return undefined;
        const decoded = decodeURIComponent(rawInput).trim().toLowerCase();
        const slugified = decoded.replace(/\s+/g, '-');
        return PRODUCTS.find(
          (p) =>
            p.slug === decoded ||
            p.id === decoded ||
            p.slug === slugified ||
            p.id === slugified ||
            p.slug.replace(/-powder$/, '') === slugified ||
            p.id.replace(/-powder$/, '') === slugified ||
            slugified.startsWith(p.slug) ||
            p.slug.startsWith(slugified)
        );
      };

      // Check public pathname routing if no hash is present
      const pathRoute = pathname.replace(/^\/+/, '').toLowerCase();
      if (!rawHash && pathRoute) {
        if (pathRoute.startsWith('product/') || pathRoute.startsWith('product-detail/')) {
          const rawSlugWithQuery = pathRoute.replace(/^product(-detail)?\//, '');
          const [rawSlug, queryString] = rawSlugWithQuery.split('?');
          const found = findProductBySlugOrId(rawSlug);
          if (found) {
            const variantParam = extractVariantFromParams(queryString);
            const resolvedVariant = variantParam && isValidProductVariant(found, variantParam)
              ? variantParam
              : getDefaultProductVariant(found);
            setCurrentProduct(found);
            setCurrentVariant(resolvedVariant);
            setCurrentPage('product-detail');
            return;
          }
        }
        if (['shop', 'brew-guide', 'our-farm', 'about', 'reviews', 'subscription', 'accessories', 'contact', 'faq', 'cart', 'checkout', 'wishlist', 'track-order', 'tracking'].includes(pathRoute)) {
          setCurrentPage(pathRoute === 'tracking' ? 'track-order' : pathRoute);
          return;
        }
      }

      // Check hash route fallback
      const hash = rawHash.replace('#', '').toLowerCase() || 'home';
      const [route, param] = hash.split('/');

      if (route === 'track-order' || route === 'tracking') {
        setCurrentPage('track-order');
        return;
      }

      if (route === 'admin') {
        if (param === 'login') {
          setCurrentPage('admin-login');
        } else {
          setCurrentPage('admin');
          if (param && ['orders', 'customers', 'products', 'payments', 'contacts', 'reviews', 'analytics', 'excel'].includes(param)) {
            setAdminTab(param as AdminTab);
          } else {
            setAdminTab('overview');
          }
        }
        return;
      }

      if (route === 'admin-login') {
        setCurrentPage('admin-login');
        return;
      }

      if ((route === 'product' || route === 'product-detail') && param) {
        const [rawSlug, queryString] = param.split('?');
        const found = findProductBySlugOrId(rawSlug);
        if (found) {
          const variantParam = extractVariantFromParams(queryString);
          const resolvedVariant = variantParam && isValidProductVariant(found, variantParam)
            ? variantParam
            : getDefaultProductVariant(found);
          setCurrentProduct(found);
          setCurrentVariant(resolvedVariant);
          setCurrentPage('product-detail');
          return;
        }
      }

      if (route) {
        setCurrentPage(route);
      }
    };

    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);
    handleRouteChange();

    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  const navigateTo = (
    page: string,
    params?: {
      product?: Product;
      variant?: string;
      order?: OrderDetails;
      category?: string;
      search?: string;
      tab?: 'overview' | 'orders' | 'profile' | 'tracking' | AdminTab;
    }
  ) => {
    if (params?.product) {
      setCurrentProduct(params.product);
      const chosenVariant = params.variant && isValidProductVariant(params.product, params.variant)
        ? params.variant
        : getDefaultProductVariant(params.product);
      setCurrentVariant(chosenVariant);
      window.location.hash = `product/${params.product.slug}?variant=${encodeURIComponent(chosenVariant)}`;
    } else if (page === 'home') {
      window.location.hash = '';
    } else if (page === 'admin-login') {
      window.location.hash = 'admin/login';
    } else if (page === 'admin') {
      const tabName = params?.tab || 'overview';
      window.location.hash = tabName === 'overview' ? 'admin' : `admin/${tabName}`;
    } else {
      window.location.hash = page;
    }

    if (params?.order) {
      setCurrentOrder(params.order);
    }

    if (params?.category !== undefined) {
      setSelectedCategory(params.category);
    }

    if (params?.search !== undefined) {
      setSearchFilter(params.search);
    }

    if (params?.tab !== undefined) {
      if (['overview', 'orders', 'profile', 'tracking'].includes(params.tab)) {
        setDashboardTab(params.tab as any);
      }
      if (['overview', 'orders', 'customers', 'products', 'payments', 'contacts', 'reviews', 'analytics', 'excel'].includes(params.tab)) {
        setAdminTab(params.tab as AdminTab);
      }
    }

    setQuickViewProduct(null);
    setQuickViewInitialWeight(null);
    setActiveBrewId(null);
    setIsSearchOpen(false);
    clearAllScrollLocks();

    setCurrentPage(page === 'product' || page === 'product-detail' || params?.product ? 'product-detail' : page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openQuickView = (product: Product, initialWeight?: string) => {
    setQuickViewProduct(product);
    setQuickViewInitialWeight(initialWeight || getDefaultProductVariant(product));
  };

  const closeQuickView = () => {
    setQuickViewProduct(null);
    setQuickViewInitialWeight(null);
  };

  const openBrewModal = (brewId: string) => {
    setActiveBrewId(brewId);
  };

  const closeBrewModal = () => {
    setActiveBrewId(null);
  };

  return (
    <NavigationContext.Provider
      value={{
        currentPage,
        currentProduct,
        currentVariant,
        setCurrentVariant,
        currentOrder,
        selectedCategory,
        searchFilter,
        dashboardTab,
        adminTab,
        setDashboardTab,
        setAdminTab,
        navigateTo,
        openQuickView,
        closeQuickView,
        quickViewProduct,
        quickViewInitialWeight,
        openBrewModal,
        closeBrewModal,
        activeBrewId,
        isSearchOpen,
        setIsSearchOpen,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
