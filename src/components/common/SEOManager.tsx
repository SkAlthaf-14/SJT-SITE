import React, { useEffect } from 'react';
import { useNavigation } from '../../context/NavigationContext';

const PRODUCTION_DOMAIN = 'https://sjtfarms.com';

interface RouteSEO {
  canonicalUrl: string | null; // null for private/admin routes
  title: string;
  description: string;
  isPrivate?: boolean;
}

export const SEOManager: React.FC = () => {
  const { currentPage, currentProduct } = useNavigation();

  useEffect(() => {
    const getRouteSEO = (): RouteSEO => {
      switch (currentPage) {
        case 'home':
          return {
            canonicalUrl: `${PRODUCTION_DOMAIN}/`,
            title: 'SJT Farms — Premium Coffee Powder from Farm to Cup',
            description:
              'Discover SJT Farms authentic shade-grown coffee powder, crafted in Chikmagalur from farm to cup for rich aroma, bold flavour, and a memorable South Indian filter kaapi experience.',
          };

        case 'shop':
          return {
            canonicalUrl: `${PRODUCTION_DOMAIN}/shop`,
            title: 'SJT Farms — Shop Coffee Powder & Brewing Accessories',
            description:
              'Explore SJT Farms artisanal shade-grown coffee powders, traditional South Indian filter kaapi blends, and handcrafted brassware.',
          };

        case 'product-detail': {
          const productSlug = currentProduct?.slug || 'sjt-signature-coffee-powder';
          const productName = currentProduct?.name || 'Artisan Coffee';
          return {
            canonicalUrl: `${PRODUCTION_DOMAIN}/product/${productSlug}`,
            title: `SJT Farms — ${productName}`,
            description:
              currentProduct?.description ||
              `Authentic shade-grown ${productName} batch roasted at SJT Farms in Chikmagalur.`,
          };
        }

        case 'brew-guide':
          return {
            canonicalUrl: `${PRODUCTION_DOMAIN}/brew-guide`,
            title: 'SJT Farms — Coffee Brew Guide & Extraction Masterclass',
            description:
              'Step-by-step extraction guides from SJT Farms for traditional South Indian filter kaapi, French Press, Pour Over, Moka Pot, and Cold Brew.',
          };

        case 'our-farm':
          return {
            canonicalUrl: `${PRODUCTION_DOMAIN}/our-farm`,
            title: 'SJT Farms — Our Farm & Plantation Heritage',
            description:
              'Tour SJT Farms high-elevation shade-grown coffee estate nestled in the Western Ghats of Chikmagalur. Discover our rich soil and sustainable harvest.',
          };

        case 'about':
          return {
            canonicalUrl: `${PRODUCTION_DOMAIN}/about`,
            title: 'SJT Farms — About Our Coffee Tradition',
            description:
              'Learn about SJT Farms history, our generational dedication to pure shade-grown coffee, and our artisanal roasting philosophy.',
          };

        case 'reviews':
          return {
            canonicalUrl: `${PRODUCTION_DOMAIN}/reviews`,
            title: 'SJT Farms — Customer Reviews & Testimonials',
            description:
              'Read genuine reviews from coffee patrons across India who start their mornings with SJT Farms signature and strong coffee powders.',
          };

        case 'subscription':
          return {
            canonicalUrl: `${PRODUCTION_DOMAIN}/subscription`,
            title: 'SJT Farms — Coffee Subscriptions & Roastery Reserve',
            description:
              'Never run out of fresh roast from SJT Farms. Custom weekly, bi-weekly, or monthly delivery schedules with exclusive savings for subscribers.',
          };

        case 'accessories':
          return {
            canonicalUrl: `${PRODUCTION_DOMAIN}/accessories`,
            title: 'SJT Farms — Brassware & Coffee Accessories',
            description:
              'Handcrafted traditional brass coffee filters, davara tumbler sets, and brewing accessories from SJT Farms built for generational use.',
          };

        case 'contact':
          return {
            canonicalUrl: `${PRODUCTION_DOMAIN}/contact`,
            title: 'SJT Farms — Contact & Concierge Support',
            description:
              'Get in touch with the SJT Farms estate team for inquiries, bulk orders, or customer support.',
          };

        case 'faq':
          return {
            canonicalUrl: `${PRODUCTION_DOMAIN}/faq`,
            title: 'SJT Farms — Frequently Asked Questions',
            description:
              'Everything you need to know about SJT Farms roast profiles, brewing techniques, pan-India shipping, and orders.',
          };

        // Private / Admin / Transactional routes: DO NOT emit canonical URLs
        case 'admin':
        case 'admin-login':
        case 'cart':
        case 'checkout':
        case 'order-success':
        case 'wishlist':
        case 'dashboard':
        case 'account':
        case 'profile':
        case 'orders':
        default:
          return {
            canonicalUrl: null,
            title:
              currentPage === 'admin' || currentPage === 'admin-login'
                ? 'SJT Farms — Admin Portal'
                : 'SJT Farms — Account & Orders',
            description: 'SJT Farms customer and management portal.',
            isPrivate: true,
          };
      }
    };

    const { canonicalUrl, title, description, isPrivate } = getRouteSEO();

    // 1. UPDATE DOCUMENT TITLE
    if (title) {
      document.title = title;
    }

    // 2. MANAGE CANONICAL LINK (<link rel="canonical" href="..." />)
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;

    if (canonicalUrl) {
      // Public indexable page: ensure canonical link exists and has the exact absolute HTTPS URL
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', canonicalUrl);
    } else {
      // Private/admin route: remove canonical link from head
      if (canonicalLink) {
        canonicalLink.remove();
      }
    }

    // 3. MANAGE OG:URL META TAG
    let ogUrlMeta = document.querySelector('meta[property="og:url"]') as HTMLMetaElement | null;
    if (canonicalUrl) {
      if (!ogUrlMeta) {
        ogUrlMeta = document.createElement('meta');
        ogUrlMeta.setAttribute('property', 'og:url');
        document.head.appendChild(ogUrlMeta);
      }
      ogUrlMeta.setAttribute('content', canonicalUrl);
    } else if (ogUrlMeta) {
      ogUrlMeta.remove();
    }

    // 4. MANAGE OG:TITLE & TWITTER:TITLE
    let ogTitleMeta = document.querySelector('meta[property="og:title"]') as HTMLMetaElement | null;
    if (ogTitleMeta && title) {
      ogTitleMeta.setAttribute('content', title);
    }
    let twitterTitleMeta = document.querySelector('meta[name="twitter:title"]') as HTMLMetaElement | null;
    if (twitterTitleMeta && title) {
      twitterTitleMeta.setAttribute('content', title);
    }

    // 5. MANAGE DESCRIPTION META TAGS
    let descMeta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!descMeta) {
      descMeta = document.createElement('meta');
      descMeta.setAttribute('name', 'description');
      document.head.appendChild(descMeta);
    }
    descMeta.setAttribute('content', description);

    let ogDescMeta = document.querySelector('meta[property="og:description"]') as HTMLMetaElement | null;
    if (ogDescMeta) {
      ogDescMeta.setAttribute('content', description);
    }
    let twitterDescMeta = document.querySelector('meta[name="twitter:description"]') as HTMLMetaElement | null;
    if (twitterDescMeta) {
      twitterDescMeta.setAttribute('content', description);
    }

    // 6. MANAGE ROBOTS DIRECTIVE (noindex on private routes, index on public)
    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (isPrivate) {
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.setAttribute('name', 'robots');
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.setAttribute('content', 'noindex, nofollow');
    } else if (robotsMeta) {
      robotsMeta.remove();
    }
  }, [currentPage, currentProduct]);

  return null; // Headless component
};
