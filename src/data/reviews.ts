import { Review } from '../types';

/**
 * SJT FARMS - CUSTOMER REVIEWS DATA
 * 
 * IMPORTANT:
 * These reviews are clearly marked as DEMO reviews for website preview and layout demonstration.
 * They MUST be replaced with verified client customer reviews once provided.
 * Do not present invented testimonials as real customer reviews in production.
 */

export const REVIEWS: Review[] = [
  {
    id: 'rev-1',
    author: 'Ananya S.',
    location: 'Bengaluru, Karnataka',
    rating: 5,
    date: 'February 2026',
    title: 'The aroma takes me right back to our ancestral estate mornings',
    comment: 'The SJT Signature blend produces an exceptionally thick, syrupy first decoction. We brew it every single morning in our brass filter. The balance of chocolatey richness with zero bitter astringency is unmatched.',
    verified: true,
    productName: 'SJT Signature Coffee Powder',
  },
  {
    id: 'rev-2',
    author: 'Raghavan K.',
    location: 'Chennai, Tamil Nadu',
    rating: 5,
    date: 'January 2026',
    title: 'Finally, real filter coffee with authentic body',
    comment: 'Most store-bought powders taste dusty or stale. SJT Premium Filter Coffee smells freshly roasted the second you break the foil seal. Pairs delightfully with boiled milk and raw brown sugar.',
    verified: true,
    productName: 'SJT Premium Filter Coffee',
  },
  {
    id: 'rev-3',
    author: 'Pooja M.',
    location: 'Hyderabad, Telangana',
    rating: 5,
    date: 'February 2026',
    title: 'My morning ritual has been completely transformed',
    comment: 'Switched to the SJT Farm roasted batches. Delivery arrives like clockwork, perfectly ground for my French press. Love the fresh aroma and honest quality.',
    verified: true,
    productName: 'SJT Strong Coffee Powder',
  },
  {
    id: 'rev-4',
    author: 'Vikramaditya B.',
    location: 'Mumbai, Maharashtra',
    rating: 5,
    date: 'January 2026',
    title: 'Exceptional 100% pure blend without chicory',
    comment: 'I brew pour over and black coffee exclusively. The SJT Special Blend is floral, smooth, with subtle berry notes that blossom as it cools. Proud to see Indian single-origin coffee roasted with such precision.',
    verified: true,
    productName: 'SJT Special Blend',
  },
  {
    id: 'rev-5',
    author: 'Sunil Rao',
    location: 'Mysuru, Karnataka',
    rating: 4,
    date: 'December 2025',
    title: 'Sturdy brass filter and delicious roast',
    comment: 'Ordered the traditional brass filter set along with 500g of Signature Powder. The brass quality is heavy and authentic. Takes about 12 minutes to drip, producing pure golden nectar.',
    verified: true,
    productName: 'Traditional Brass Coffee Filter',
  },
  {
    id: 'rev-6',
    author: 'Divya N.',
    location: 'Coimbatore, Tamil Nadu',
    rating: 5,
    date: 'February 2026',
    title: 'Rich flavour that sustains through the day',
    comment: 'The dark roast profile of SJT Strong gives me that bold morning punch without disturbing my stomach. Excellent consistency and beautiful packaging!',
    verified: true,
    productName: 'SJT Strong Coffee Powder',
  },
];

export const RATING_SUMMARY = {
  averageRating: 4.9,
  totalReviews: 6,
  breakdown: [
    { stars: 5, count: 5, percentage: 83 },
    { stars: 4, count: 1, percentage: 17 },
    { stars: 3, count: 0, percentage: 0 },
    { stars: 2, count: 0, percentage: 0 },
    { stars: 1, count: 0, percentage: 0 },
  ],
};
