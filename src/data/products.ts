import type { Product } from '../types/index.ts';

export const COFFEE_PRODUCTS: Product[] = [
  {
    id: 'araku-instant-coffee-powder',
    name: 'Araku Instant Coffee Powder',
    slug: 'araku-instant-coffee-powder',
    category: 'Coffee Powder',
    tagline: 'Instant Perfection. Mountain Aroma. 100% Pure Arabica.',
    description: 'Expertly crafted instant coffee powder bringing you the rich aroma and bold taste of 100% pure Arabica from the misty hills of Araku Valley.',
    longDescription: 'Sourced from the lush mountain hills of Araku Valley, our Instant Coffee Powder delivers convenient preparation without compromising on artisanal depth. Using 100% pure shade-grown Arabica beans without any chicory or additives, each granule dissolves smoothly to yield an aromatic, velvety cup with deep chocolate undertones and balanced sweetness.',
    price: 199, // Authoritative price for default 100g variant
    originalPrice: 240,
    discount: '17% OFF',
    rating: 4.9,
    reviewCount: 168,
    images: [
      '/images/products/jars/araku-instant-50g-jar.png',
      '/images/products/jars/araku-instant-100g-jar.png',
      '/images/products/jars/araku-instant-250g-jar.png',
      '/images/products/labels/araku-instant-100g-label.png',
      '/images/sjt_farm_plantation.jpg',
    ],
    weights: ['50g', '100g', '250g'],
    weightPrices: {
      '50g': 99,
      '100g': 199,
      '250g': 479,
    },
    jarImages: {
      '50g': '/images/products/jars/araku-instant-50g-jar.png',
      '100g': '/images/products/jars/araku-instant-100g-jar.png',
      '250g': '/images/products/jars/araku-instant-250g-jar.png',
    },
    labelImages: {
      '50g': '/images/products/labels/araku-instant-50g-label.png',
      '100g': '/images/products/labels/araku-instant-100g-label.png',
      '250g': '/images/products/labels/araku-instant-250g-label.png',
    },
    labelSvgs: {
      '50g': '/images/products/labels/araku-instant-50g-label.svg',
      '100g': '/images/products/labels/araku-instant-100g-label.svg',
      '250g': '/images/products/labels/araku-instant-250g-label.svg',
    },
    strength: 'Medium',
    roastLevel: 'Medium-Dark Artisan Roast',
    flavourNotes: ['Roasted Hazelnut', 'Dark Cacao', 'Brown Sugar'],
    brewMethods: ['Instant Hot Water', 'Iced Black Coffee', 'Warm Milk Kaapi'],
    chicoryRatio: '100% Pure Coffee (0% Chicory)',
    verifiedBlendRatio: '100% Pure Arabica • 0% Chicory',
    ingredients: '100% Pure Coffee Beans (Arabica) | Without Chicory',
    preparationInstructions: [
      'Add 1 tsp (approx. 2 g) of coffee powder into your cup',
      'Pour 150 ml hot water or warm frothed milk',
      'Stir well and enjoy the true taste of Araku!'
    ],
    storageInstructions: 'Keep the jar tightly closed after opening. Store in a cool, dry place away from direct sunlight.',
    shippingInfo: 'Dispatched fresh in safety-sealed glass jar. Express delivery across India in 2–4 business days.',
    stock: 95,
    featured: true,
    isBestseller: true,
    theme: {
      primary: '#11382B',
      secondary: '#0A241C',
      accent: '#D4AF37',
      badge: '#0D2E24',
      border: '#D4AF37',
      bgGrad: 'from-[#0D2E24] via-[#11382B] to-[#0A241C]',
    }
  },
  {
    id: 'araku-special-blend-filter-coffee',
    name: 'Araku Special Blend Filter Coffee',
    slug: 'araku-special-blend-filter-coffee',
    category: 'Filter Coffee',
    tagline: '100% Pure Single-Estate Arabica Filter Coffee',
    description: 'A rich, traditional filter coffee formulation crafted from 100% pure handpicked Arabica beans without chicory for purists who desire authentic aroma.',
    longDescription: 'Crafted for coffee purists and connoisseurs of the South Indian filter tradition. Araku Special Blend is made exclusively from 100% shade-grown Arabica cherries grown at high elevations. Slow-roasted in micro-batches to unlock a silky golden crema and deep aromatic profile that blooms beautifully in traditional brass filters.',
    price: 149, // Authoritative price for default 100g variant
    originalPrice: 185,
    discount: '19% OFF',
    rating: 5.0,
    reviewCount: 134,
    images: [
      '/images/products/jars/araku-special-blend-50g-jar.png',
      '/images/products/jars/araku-special-blend-100g-jar.png',
      '/images/products/jars/araku-special-blend-250g-jar.png',
      '/images/products/labels/araku-special-blend-100g-label.png',
      '/images/sjt_hero_coffee.jpg',
    ],
    weights: ['50g', '100g', '250g'],
    weightPrices: {
      '50g': 69,
      '100g': 149,
      '250g': 329,
    },
    jarImages: {
      '50g': '/images/products/jars/araku-special-blend-50g-jar.png',
      '100g': '/images/products/jars/araku-special-blend-100g-jar.png',
      '250g': '/images/products/jars/araku-special-blend-250g-jar.png',
    },
    labelImages: {
      '50g': '/images/products/labels/araku-special-blend-50g-label.png',
      '100g': '/images/products/labels/araku-special-blend-100g-label.png',
      '250g': '/images/products/labels/araku-special-blend-250g-label.png',
    },
    labelSvgs: {
      '50g': '/images/products/labels/araku-special-blend-50g-label.svg',
      '100g': '/images/products/labels/araku-special-blend-100g-label.svg',
      '250g': '/images/products/labels/araku-special-blend-250g-label.svg',
    },
    strength: 'Medium',
    roastLevel: 'Medium Full Slow Roast',
    flavourNotes: ['Caramelized Jaggery', 'Almond Butter', 'Floral Honey'],
    brewMethods: ['Traditional South Indian Filter', 'Moka Pot', 'French Press'],
    chicoryRatio: '100% Pure Coffee (0% Chicory)',
    verifiedBlendRatio: '100% Pure Filter Coffee • 0% Chicory',
    ingredients: '100% Pure Coffee Beans (Arabica) | Without Chicory',
    preparationInstructions: [
      'Add 2 tbsp (15–20 g) of coffee powder into the upper chamber of your filter',
      'Gently tamp with the pressing disc and pour 100 ml boiling water',
      'Allow 12–15 minutes for dense decoction to collect, blend with hot milk and sugar'
    ],
    storageInstructions: 'Keep the jar tightly closed after opening. Store in a cool, dry place away from direct sunlight.',
    shippingInfo: 'Small-batch roasted and packed in airtight jar. Express delivery across India in 2–4 business days.',
    stock: 80,
    featured: true,
    isBestseller: true,
    theme: {
      primary: '#3A2016',
      secondary: '#26140D',
      accent: '#C5A059',
      badge: '#2E1911',
      border: '#C5A059',
      bgGrad: 'from-[#2E1911] via-[#3A2016] to-[#26140D]',
    }
  },
  {
    id: 'araku-signature-coffee',
    name: 'Araku Signature Coffee Powder',
    slug: 'araku-signature-coffee',
    category: 'Coffee Powder',
    tagline: '80% Arabica Coffee & 20% Roasted Chicory — The Authentic South Indian Blend',
    description: 'A classic South Indian morning staple harmonizing 80% Arabica coffee with 20% roasted chicory for dense, velvety decoction and lasting aroma.',
    longDescription: 'The definitive South Indian filter kaapi blend. Araku Signature balances 80% plantation-harvested Arabica coffee with 20% premium roasted Jamnagar chicory. Engineered to yield thick, syrupy decoction that cuts effortlessly through hot steamed milk, delivering the nostalgic golden froth and comforting warmth of heirloom South Indian households.',
    price: 119, // Authoritative price for default 100g variant
    originalPrice: 155,
    discount: '23% OFF',
    rating: 4.9,
    reviewCount: 210,
    images: [
      '/images/products/jars/araku-signature-50g-jar.png',
      '/images/products/jars/araku-signature-100g-jar.png',
      '/images/products/jars/araku-signature-250g-jar.png',
      '/images/products/labels/araku-signature-100g-label.png',
      '/images/sjt_hero_coffee.jpg',
    ],
    weights: ['50g', '100g', '250g'],
    weightPrices: {
      '50g': 49,
      '100g': 119,
      '250g': 219,
    },
    jarImages: {
      '50g': '/images/products/jars/araku-signature-50g-jar.png',
      '100g': '/images/products/jars/araku-signature-100g-jar.png',
      '250g': '/images/products/jars/araku-signature-250g-jar.png',
    },
    labelImages: {
      '50g': '/images/products/labels/araku-signature-50g-label.png',
      '100g': '/images/products/labels/araku-signature-100g-label.png',
      '250g': '/images/products/labels/araku-signature-250g-label.png',
    },
    labelSvgs: {
      '50g': '/images/products/labels/araku-signature-50g-label.svg',
      '100g': '/images/products/labels/araku-signature-100g-label.svg',
      '250g': '/images/products/labels/araku-signature-250g-label.svg',
    },
    strength: 'Strong',
    roastLevel: 'Dark Full-City Roast',
    flavourNotes: ['Dark Cocoa', 'Toasted Oak', 'Bittersweet Caramel'],
    brewMethods: ['South Indian Filter', 'Moka Pot'],
    chicoryRatio: '80% Coffee : 20% Chicory',
    verifiedBlendRatio: '80% Arabica : 20% Chicory',
    ingredients: '80% Coffee Beans (Arabica) | 20% Chicory',
    preparationInstructions: [
      'Add 2 tbsp (approx. 20 g) into South Indian brass filter',
      'Pour 100 ml boiling water, rest for 15 minutes for dense decoction',
      'Combine 1 part decoction with 3 parts hot milk and jaggery/sugar'
    ],
    storageInstructions: 'Keep the jar tightly closed after opening. Store in a cool, dry place away from direct sunlight.',
    shippingInfo: 'Packed in airtight jar with freshness seal. Delivery across India in 2–4 business days.',
    stock: 120,
    featured: true,
    isBestseller: true,
    theme: {
      primary: '#4A0E17',
      secondary: '#30080E',
      accent: '#D4AF37',
      badge: '#3A0910',
      border: '#D4AF37',
      bgGrad: 'from-[#3A0910] via-[#4A0E17] to-[#30080E]',
    }
  },
  {
    id: 'araku-premium-coffee',
    name: 'Araku Premium Coffee Powder',
    slug: 'araku-premium-coffee',
    category: 'Coffee Powder',
    tagline: 'Bold Decoction & Rich Crema — 70% Arabica Coffee with Chicory',
    description: 'Deeply roasted high-intensity blend crafted for dense body, strong aromatic kick, and thick golden froth.',
    longDescription: 'Created for those who cherish a punchy, heavy-bodied morning cup with high caffeine presence and thick decoction yield. Crafted with slow-roasted Arabica beans harmonized with chicory to create an invigorating South Indian filter kaapi experience that stands up robustly to rich steamed milk.',
    price: 109, // Authoritative price for default 100g variant
    originalPrice: 145,
    discount: '25% OFF',
    rating: 4.8,
    reviewCount: 98,
    images: [
      '/images/products/jars/araku-premium-50g-jar.png',
      '/images/products/jars/araku-premium-100g-jar.png',
      '/images/products/jars/araku-premium-250g-jar.png',
      '/images/products/labels/araku-premium-100g-label.png',
      '/images/sjt_farm_plantation.jpg',
    ],
    weights: ['50g', '100g', '250g'],
    weightPrices: {
      '50g': 49,
      '100g': 109,
      '250g': 199,
    },
    jarImages: {
      '50g': '/images/products/jars/araku-premium-50g-jar.png',
      '100g': '/images/products/jars/araku-premium-100g-jar.png',
      '250g': '/images/products/jars/araku-premium-250g-jar.png',
    },
    labelImages: {
      '50g': '/images/products/labels/araku-premium-50g-label.png',
      '100g': '/images/products/labels/araku-premium-100g-label.png',
      '250g': '/images/products/labels/araku-premium-250g-label.png',
    },
    labelSvgs: {
      '50g': '/images/products/labels/araku-premium-50g-label.svg',
      '100g': '/images/products/labels/araku-premium-100g-label.svg',
      '250g': '/images/products/labels/araku-premium-250g-label.svg',
    },
    strength: 'Strong',
    roastLevel: 'Dark French Roast',
    flavourNotes: ['Heavy Cacao', 'Smoky Cedar', 'Molasses'],
    brewMethods: ['South Indian Filter', 'Moka Pot'],
    chicoryRatio: '70% Coffee : 30% Chicory (Flagged Standard Formulation)',
    verifiedBlendRatio: '70% Arabica : 30% Chicory*',
    ingredients: '70% Coffee Beans (Arabica) | 30% Chicory (Flagged for owner confirmation)',
    flaggedNotice: '*Standard Formulation: 70% Coffee & 30% Chicory (Flagged for product owner confirmation against 70:20 draft ratio)',
    preparationInstructions: [
      'Add 2 tbsp (approx. 20 g) into South Indian brass filter',
      'Pour 100 ml boiling water and allow 12–15 minutes for dense decoction',
      'Stir with hot milk and enjoy a bold, invigorating cup'
    ],
    storageInstructions: 'Keep the jar tightly closed after opening. Store in a cool, dry place away from direct sunlight.',
    shippingInfo: 'Packed in airtight jar with freshness seal. Dispatched within 24 hours of roasting.',
    stock: 85,
    featured: true,
    isNew: true,
    theme: {
      primary: '#16181B',
      secondary: '#0E0F11',
      accent: '#E5A93C',
      badge: '#121416',
      border: '#E5A93C',
      bgGrad: 'from-[#121416] via-[#16181B] to-[#0E0F11]',
    }
  },
  // ACCESSORIES
  {
    id: 'acc-brass-filter',
    name: 'Traditional Brass Coffee Filter',
    slug: 'traditional-brass-coffee-filter',
    category: 'Accessories',
    tagline: 'Pure Heavy-Gauge Brass for Authentic Decoction',
    description: 'Handcrafted solid brass traditional coffee filter with micro-perforated pressing disc for slow, rich extraction.',
    longDescription: 'Crafted with food-grade brass that retains thermal heat during the slow 15-minute drip extraction. Delivers the authentic viscous South Indian decoction that stainless steel cannot replicate.',
    price: 899,
    originalPrice: 1199,
    discount: '25% OFF',
    rating: 4.9,
    reviewCount: 88,
    images: [
      'https://images.unsplash.com/photo-1518832553480-cd0e625ed3e6?q=80&w=1000&auto=format&fit=crop',
      '/images/sjt_hero_coffee.jpg'
    ],
    weights: ['Standard (2–3 Cups)', 'Large (4–6 Cups)'],
    weightPrices: {
      'Standard (2–3 Cups)': 899,
      'Large (4–6 Cups)': 1299
    },
    strength: 'Strong',
    roastLevel: 'N/A',
    flavourNotes: ['Artisanal Brass', 'Heavy Gauge', 'Tinned Interior'],
    brewMethods: ['South Indian Filter'],
    ingredients: '100% Solid Brass with food-safe Kalai tinned lining.',
    shippingInfo: 'Shipped in protective wooden box with polishing cloth.',
    stock: 22,
    featured: false,
    isBestseller: true
  },
  {
    id: 'acc-brass-davara-set',
    name: 'Handcrafted Brass Davara & Tumbler',
    slug: 'brass-davara-tumbler-set',
    category: 'Accessories',
    tagline: 'The Iconic Vessel for Pouring & Frothing Filter Kaapi',
    description: 'Traditional wide-lipped dabarah and curved tumbler engineered for the classic meter-high aeration pour.',
    longDescription: 'Drinking filter coffee from brass isn’t just tradition—it alters the cooling curve and enhances mouthfeel. Polished golden exterior with pure food-grade brass construction.',
    price: 649,
    originalPrice: 850,
    discount: '24% OFF',
    rating: 4.9,
    reviewCount: 65,
    images: [
      'https://images.unsplash.com/photo-1518832553480-cd0e625ed3e6?q=80&w=1000&auto=format&fit=crop',
      '/images/sjt_hero_coffee.jpg'
    ],
    weights: ['Set of 1 (180ml)', 'Set of 2 (180ml)', 'Set of 4 (180ml)'],
    weightPrices: {
      'Set of 1 (180ml)': 649,
      'Set of 2 (180ml)': 1199,
      'Set of 4 (180ml)': 2199
    },
    strength: 'Medium',
    roastLevel: 'N/A',
    flavourNotes: ['Ergonomic Lip', 'Thermal Retention', 'Heirloom Quality'],
    brewMethods: ['South Indian Filter'],
    ingredients: 'Solid Brass with lustrous mirror-finish polish.',
    shippingInfo: 'Protected in bubble wraps and gift-ready SJT craft box.',
    stock: 30,
    featured: false
  },
  {
    id: 'acc-classic-moka-pot',
    name: 'Artisan Moka Pot Express',
    slug: 'artisan-moka-pot-express',
    category: 'Accessories',
    tagline: 'Stovetop Pressure Extraction for Espresso-Strength Coffee',
    description: 'Heavy cast aluminium stovetop brewer with heat-resistant ergonomic wooden handle.',
    longDescription: 'Harnesses 1.5 bars of gentle steam pressure to force water through coffee grounds, yielding a rich concentrated shot reminiscent of espresso in under 5 minutes.',
    price: 1299,
    originalPrice: 1699,
    discount: '23% OFF',
    rating: 4.8,
    reviewCount: 42,
    images: [
      'https://images.unsplash.com/photo-1524350876685-274059332603?q=80&w=1000&auto=format&fit=crop',
      '/images/sjt_hero_coffee.jpg'
    ],
    weights: ['3 Cup (150ml)', '6 Cup (300ml)'],
    weightPrices: {
      '3 Cup (150ml)': 1299,
      '6 Cup (300ml)': 1799
    },
    strength: 'Strong',
    roastLevel: 'N/A',
    flavourNotes: ['Matte Espresso Coating', 'Safety Valve', 'Beechwood Handle'],
    brewMethods: ['Moka Pot'],
    ingredients: 'Food-grade Cast Aluminium & Natural Beechwood.',
    shippingInfo: 'Tested for safety pressure valve before dispatch.',
    stock: 18,
    featured: false
  },
  {
    id: 'acc-french-press',
    name: 'Dual-Mesh Glass French Press',
    slug: 'dual-mesh-glass-french-press',
    category: 'Accessories',
    tagline: 'Borosilicate Glass with Ultra-Fine Silt-Free Filter',
    description: '600ml thermal shock-resistant glass cafetiere with stainless steel dual-screen plunger.',
    longDescription: 'Designed for full immersion brewing. Keeps coffee grounds fully saturated to extract delicate oils and aromatic compounds without releasing bitter sediment into the cup.',
    price: 999,
    originalPrice: 1399,
    discount: '28% OFF',
    rating: 4.7,
    reviewCount: 39,
    images: [
      'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?q=80&w=1000&auto=format&fit=crop'
    ],
    weights: ['350ml (Single)', '600ml (Standard)', '1000ml (Family)'],
    weightPrices: {
      '350ml (Single)': 849,
      '600ml (Standard)': 999,
      '1000ml (Family)': 1399
    },
    strength: 'Medium',
    roastLevel: 'N/A',
    flavourNotes: ['Thermal Glass', 'Anti-Scald Grip', 'Dual Filter Mesh'],
    brewMethods: ['French Press', 'Cold Coffee'],
    ingredients: 'Borosilicate Glass & 304 Stainless Steel.',
    shippingInfo: 'Reinforced shatterproof packaging guaranteed.',
    stock: 25,
    featured: false
  },
  {
    id: 'acc-airtight-canister',
    name: 'Airtight Ceramic Freshness Canister',
    slug: 'airtight-ceramic-freshness-canister',
    category: 'Accessories',
    tagline: 'UV-Blocking Matte Ceramic with CO2 Degassing Valve',
    description: 'Keeps your freshly ground SJT coffee powder protected from light, moisture, and oxygen.',
    longDescription: 'Oxygen and UV rays are the sworn enemies of fresh coffee aroma. This matte black ceramic jar features a silicone airtight seal and a date tracking dial on top of the bamboo lid.',
    price: 799,
    originalPrice: 999,
    discount: '20% OFF',
    rating: 4.9,
    reviewCount: 51,
    images: [
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1000&auto=format&fit=crop'
    ],
    weights: ['500g Capacity', '1kg Capacity'],
    weightPrices: {
      '500g Capacity': 799,
      '1kg Capacity': 1099
    },
    strength: 'Mild',
    roastLevel: 'N/A',
    flavourNotes: ['Date Tracker', 'Bamboo Lid', 'Silicone Airtight Seal'],
    brewMethods: ['All Methods'],
    ingredients: 'Lead-free Ceramic, Natural Bamboo, Silicone Ring.',
    shippingInfo: 'Carefully wrapped with eco-friendly honeycomb paper.',
    stock: 35,
    featured: false
  }
];

export const PRODUCTS: Product[] = COFFEE_PRODUCTS;

/**
 * Backward compatibility aliases for historical order records or Firestore IDs.
 */
export const PRODUCT_ALIASES: Record<string, string> = {
  'sjt-signature': 'araku-signature-coffee',
  'sjt-strong': 'araku-premium-coffee',
  'sjt-premium-filter': 'araku-special-blend-filter-coffee',
  'sjt-special-blend': 'araku-instant-coffee-powder',
  'sjt-heritage-dark': 'araku-premium-coffee',
  'araku-signature-coffee-powder': 'araku-signature-coffee',
  'araku-premium-coffee-powder': 'araku-premium-coffee',
  'araku-instant-coffee': 'araku-instant-coffee-powder',
  'araku-special-blend': 'araku-special-blend-filter-coffee',
};

/**
 * Resolves a product by either primary ID or historical alias.
 */
export function getProductById(id: string): Product | undefined {
  const direct = PRODUCTS.find((p) => p.id === id || p.slug === id);
  if (direct) return direct;
  const aliasId = PRODUCT_ALIASES[id];
  if (aliasId) {
    return PRODUCTS.find((p) => p.id === aliasId || p.slug === aliasId);
  }
  return undefined;
}

/**
 * Returns default variant for a product.
 * Selects '100g' by default if that variant exists, per requirement 2.2.
 */
export function getDefaultProductVariant(product: Product): string {
  if (product.weights && product.weights.includes('100g')) {
    return '100g';
  }
  return product.weights?.[0] || '100g';
}

/**
 * Resolves authoritative price for a product variant.
 */
export function getProductVariantPrice(product: Product, variant?: string): number {
  const chosenVariant = variant || getDefaultProductVariant(product);
  if (product.weightPrices && product.weightPrices[chosenVariant] !== undefined) {
    return product.weightPrices[chosenVariant];
  }
  return product.price;
}

/**
 * Authoritative map of verified packaging jar images for each product variant.
 */
export const VARIANT_JAR_IMAGES: Record<string, Record<string, string>> = {
  'araku-instant-coffee-powder': {
    '50g': '/images/products/jars/araku-instant-50g-jar.png',
    '100g': '/images/products/jars/araku-instant-100g-jar.png',
    '250g': '/images/products/jars/araku-instant-250g-jar.png',
  },
  'araku-instant-coffee': {
    '50g': '/images/products/jars/araku-instant-50g-jar.png',
    '100g': '/images/products/jars/araku-instant-100g-jar.png',
    '250g': '/images/products/jars/araku-instant-250g-jar.png',
  },
  'araku-special-blend-filter-coffee': {
    '50g': '/images/products/jars/araku-special-blend-50g-jar.png',
    '100g': '/images/products/jars/araku-special-blend-100g-jar.png',
    '250g': '/images/products/jars/araku-special-blend-250g-jar.png',
  },
  'araku-special-blend': {
    '50g': '/images/products/jars/araku-special-blend-50g-jar.png',
    '100g': '/images/products/jars/araku-special-blend-100g-jar.png',
    '250g': '/images/products/jars/araku-special-blend-250g-jar.png',
  },
  'araku-signature-coffee': {
    '50g': '/images/products/jars/araku-signature-50g-jar.png',
    '100g': '/images/products/jars/araku-signature-100g-jar.png',
    '250g': '/images/products/jars/araku-signature-250g-jar.png',
  },
  'araku-signature-coffee-powder': {
    '50g': '/images/products/jars/araku-signature-50g-jar.png',
    '100g': '/images/products/jars/araku-signature-100g-jar.png',
    '250g': '/images/products/jars/araku-signature-250g-jar.png',
  },
  'araku-premium-coffee': {
    '50g': '/images/products/jars/araku-premium-50g-jar.png',
    '100g': '/images/products/jars/araku-premium-100g-jar.png',
    '250g': '/images/products/jars/araku-premium-250g-jar.png',
  },
  'araku-premium-coffee-powder': {
    '50g': '/images/products/jars/araku-premium-50g-jar.png',
    '100g': '/images/products/jars/araku-premium-100g-jar.png',
    '250g': '/images/products/jars/araku-premium-250g-jar.png',
  },
};

/**
 * Resolves authoritative real packaging jar image for a product variant.
 * Guarantees that selecting 50g returns the 50g image, 100g returns 100g, and 250g returns 250g,
 * even when the product object was deserialized from localStorage or Firestore without full fields.
 */
export function getProductVariantJarImage(product?: Partial<Product> | string | null, variant?: string): string {
  if (!product) {
    return variant === '50g'
      ? '/images/products/jars/araku-instant-50g-jar.png'
      : variant === '250g'
      ? '/images/products/jars/araku-instant-250g-jar.png'
      : '/images/products/jars/araku-instant-100g-jar.png';
  }

  const productId = typeof product === 'string' ? product : (product.id || product.slug || '');
  const chosenVariant = variant || (typeof product !== 'string' ? getDefaultProductVariant(product as Product) : '100g');

  // 1. Direct check on product.jarImages if present
  if (typeof product !== 'string' && product.jarImages && product.jarImages[chosenVariant]) {
    return product.jarImages[chosenVariant];
  }

  // 2. Canonical lookup from VARIANT_JAR_IMAGES by id, alias, or slug
  const canonicalId = PRODUCT_ALIASES[productId] || productId;
  const jarMap = VARIANT_JAR_IMAGES[canonicalId] || VARIANT_JAR_IMAGES[productId] || VARIANT_JAR_IMAGES[productId.replace(/-powder$/, '')];
  if (jarMap && jarMap[chosenVariant]) {
    return jarMap[chosenVariant];
  }

  // 3. Normalized slug check for coffee products
  if (
    productId.includes('instant') ||
    productId.includes('special-blend') ||
    productId.includes('signature') ||
    productId.includes('premium')
  ) {
    let base = 'araku-instant';
    if (productId.includes('special-blend')) base = 'araku-special-blend';
    else if (productId.includes('signature')) base = 'araku-signature';
    else if (productId.includes('premium')) base = 'araku-premium';

    return `/images/products/jars/${base}-${chosenVariant}-jar.png`;
  }

  // 4. Check product.images for an asset whose filename contains the specific variant (no array index assumption)
  if (typeof product !== 'string' && Array.isArray(product.images) && product.images.length > 0) {
    const specificVariantMatch = product.images.find(
      (img) => img.includes(`-${chosenVariant}-`) || img.includes(`_${chosenVariant}_`) || img.includes(`-${chosenVariant}.`)
    );
    if (specificVariantMatch) {
      return specificVariantMatch;
    }
    return product.images[0];
  }

  return chosenVariant === '50g'
    ? '/images/products/jars/araku-instant-50g-jar.png'
    : chosenVariant === '250g'
    ? '/images/products/jars/araku-instant-250g-jar.png'
    : '/images/products/jars/araku-instant-100g-jar.png';
}

/**
 * Validates whether a variant name exists for the given product.
 */
export function isValidProductVariant(product: Product, variant?: string): boolean {
  if (!variant) return false;
  return Boolean(product.weights && product.weights.includes(variant));
}
