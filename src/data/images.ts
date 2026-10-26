/**
 * SJT FARMS - CENTRAL IMAGE CONFIGURATION
 * 
 * High quality authentic coffee farm and coffee craft photography.
 * Easily replace any image path with client-supplied photographs.
 * All images are properly sourced with meaningful descriptive alt text.
 */

export interface ImageAsset {
  id: string;
  url: string;
  alt: string;
  caption?: string;
  category: 'plantation' | 'cherries' | 'harvest' | 'processing' | 'roasting' | 'grinding' | 'brewing' | 'product';
}

export const COFFEE_IMAGES = {
  // Hero & Brand Imagery
  hero: {
    plantation: {
      url: '/images/sjt_farm_plantation.jpg',
      alt: 'Lush green shade-grown coffee plantation canopy at SJT Farms estate',
      caption: 'Shade-grown coffee canopy at SJT Farms',
    },
    coffeeCup: {
      url: '/images/sjt_hero_coffee.jpg',
      alt: 'Freshly brewed aromatic South Indian filter coffee in traditional brass tumbler with froth',
      caption: 'Traditional brass tumbler filter coffee with dense aromatic froth',
    },
    signaturePouch: {
      url: '/images/sjt_signature_pouch.jpg',
      alt: 'SJT Farms Signature Coffee Powder packaged in eco-laminate freshness pouch',
      caption: 'SJT Farms Signature Coffee Powder Freshness Pouch',
    },
  },

  // Cherry to Cup Journey Photography
  journey: {
    coffeePlant: {
      url: 'https://images.unsplash.com/photo-1524350876685-274059332603?q=80&w=1200&auto=format&fit=crop',
      alt: 'Healthy Coffea Arabica plants thriving under forest canopy shade',
      caption: 'Healthy shade-loving coffee plants growing on mountain slopes',
    },
    coffeeCherry: {
      url: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1200&auto=format&fit=crop',
      alt: 'Glossy deep red coffee cherries ripening on the branch at peak brix sweetness',
      caption: 'Hand-tended crimson coffee cherries at peak ripeness',
    },
    harvest: {
      url: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?q=80&w=1200&auto=format&fit=crop',
      alt: 'Farmers handpicking ripe crimson coffee cherries with meticulous care',
      caption: 'Selective hand-harvesting by skilled farm workers',
    },
    processing: {
      url: 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?q=80&w=1200&auto=format&fit=crop',
      alt: 'Coffee cherries washed and pulped in fresh mountain spring water tanks',
      caption: 'Fresh mountain water pulping and controlled natural fermentation',
    },
    drying: {
      url: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?q=80&w=1200&auto=format&fit=crop',
      alt: 'Parchment coffee beans raked evenly across open terracotta drying patios under natural sunlight',
      caption: 'Sun-drying parchment coffee on estate terracotta patios',
    },
    roasting: {
      url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=1200&auto=format&fit=crop',
      alt: 'Coffee beans roasting evenly inside cast iron drum roaster developing caramel oils',
      caption: 'Artisan micro-batch roasting with slow heat curves',
    },
    grinding: {
      url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1200&auto=format&fit=crop',
      alt: 'Freshly ground aromatic coffee powder milled through chilled burrs',
      caption: 'Micron-calibrated burr grinding for optimal decoction extraction',
    },
    yourCup: {
      url: '/images/sjt_hero_coffee.jpg',
      alt: 'Hot foaming decoction and creamy milk poured into South Indian brass tumbler',
      caption: 'The final masterpiece: your perfect morning cup',
    },
  },

  // Farm Photo Gallery (Section 11)
  farmGallery: [
    {
      id: 'gallery-1',
      url: '/images/sjt_farm_plantation.jpg',
      alt: 'Two-tier forest canopy sheltering young coffee bushes at SJT Farms',
      caption: 'Two-tier shade agroforestry preserving natural mountain biodiversity',
      category: 'plantation',
    },
    {
      id: 'gallery-2',
      url: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1200&auto=format&fit=crop',
      alt: 'Cluster of glossy ripe crimson coffee berries on plantation branch',
      caption: 'Crimson cherries ripening slowly under misty mountain breezes',
      category: 'cherries',
    },
    {
      id: 'gallery-3',
      url: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?q=80&w=1200&auto=format&fit=crop',
      alt: 'Handpicking selected coffee cherries in basket during harvest',
      caption: 'Multi-pass selective harvesting ensuring zero unripe berries',
      category: 'harvest',
    },
    {
      id: 'gallery-4',
      url: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?q=80&w=1200&auto=format&fit=crop',
      alt: 'Parchment coffee raked and turned by hand on sun-drying terraces',
      caption: 'Parchment turning on open terraces for uniform moisture balance',
      category: 'processing',
    },
    {
      id: 'gallery-5',
      url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=1200&auto=format&fit=crop',
      alt: 'Dark glossy roasted Arabica beans emerging from drum roaster',
      caption: 'Freshly roasted beans cooling in perforated stainless tray',
      category: 'roasting',
    },
    {
      id: 'gallery-6',
      url: '/images/sjt_hero_coffee.jpg',
      alt: 'Traditional brass tumbler and davara with piping hot filter coffee',
      caption: 'Authentic South Indian filter kaapi celebration',
      category: 'brewing',
    },
  ] as ImageAsset[],
};
