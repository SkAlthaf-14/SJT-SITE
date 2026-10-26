/**
 * SJT FARMS - CENTRAL CLIENT CONFIGURATION
 * 
 * IMPORTANT FOR CLIENT / DEVELOPER:
 * This file centralizes all business information, contact details, policies,
 * and trust claims. Real information must be provided by the client.
 * All pending data is clearly marked with '[CLIENT TO PROVIDE]'.
 */

import { WHATSAPP_CONFIG } from '../config/whatsapp';

export interface SiteConfig {
  brand: {
    name: string;
    tagline: string;
    subTagline: string;
    foundedYear: number;
    visualConcept: string;
  };
  contact: {
    phone: string;
    whatsapp: string;
    emailSupport: string;
    emailOrders: string;
    businessNotificationEmail: string;
    businessAddress: string;
    farmLocation: string;
    farmElevation: string;
    roasteryAddress: string;
    businessHours: string;
    dispatchTiming: string;
  };
  legal: {
    fssaiNumber: string;
    gstNumber: string;
    companyLegalName: string;
  };
  social: {
    instagram: string;
    facebook: string;
    youtube: string;
    linkedin: string;
  };
  trustFeatures: {
    id: string;
    title: string;
    subtitle: string;
    icon: string;
  }[];
  shipping: {
    freeShippingThreshold: number;
    standardDeliveryFee: number;
    estimatedDeliveryDays: string;
  };
}

export const SITE_CONFIG: SiteConfig = {
  brand: {
    name: 'SJT FARMS',
    tagline: 'PREMIUM COFFEE FROM THE FARM',
    subTagline: 'From Our Farm. To Your Perfect Cup.',
    foundedYear: 2026,
    visualConcept: 'From Our Farm. To Your Perfect Cup.',
  },

  // Central contact information
  contact: {
    phone: '+91 81210 20111',
    whatsapp: WHATSAPP_CONFIG.formattedPhone, // +91 8121020111
    emailSupport: '[CLIENT TO PROVIDE: Support Email, e.g. hello@sjtfarms.com]',
    emailOrders: '[CLIENT TO PROVIDE: Orders Email, e.g. orders@sjtfarms.com]',
    businessNotificationEmail: 'Alterit2026@gmail.com',
    businessAddress: '[CLIENT TO PROVIDE: Registered Business Address]',
    farmLocation: '[CLIENT TO PROVIDE: Farm Location / Estate Name, Karnataka, India]',
    farmElevation: '[CLIENT TO PROVIDE: Elevation, e.g. 3,800 - 4,200 ft]',
    roasteryAddress: '[CLIENT TO PROVIDE: Roastery & Packaging Unit Address]',
    businessHours: 'Monday – Saturday: 9:00 AM – 6:00 PM IST',
    dispatchTiming: 'Fresh batches dispatched within 24–48 hours of roasting',
  },

  // Compliance and legal registrations
  legal: {
    fssaiNumber: '[CLIENT TO PROVIDE: FSSAI License Number]',
    gstNumber: '[CLIENT TO PROVIDE: GSTIN]',
    companyLegalName: 'SJT FARMS PRIVATE LIMITED',
  },

  // Social media channels
  social: {
    instagram: 'https://www.instagram.com/sjt.farms/',
    facebook: 'https://facebook.com/sjtfarms',   // [CLIENT TO VERIFY]
    youtube: 'https://youtube.com/@sjtfarms',    // [CLIENT TO VERIFY]
    linkedin: 'https://linkedin.com/company/sjtfarms', // [CLIENT TO VERIFY]
  },

  // Trust bar elements (Editable, truthful claims without unsupported certs)
  trustFeatures: [
    {
      id: 'farm-fresh',
      title: 'Farm Fresh',
      subtitle: 'Direct from plantation to pack',
      icon: 'Sprout',
    },
    {
      id: 'quality-coffee',
      title: 'Quality Coffee',
      subtitle: 'Carefully selected ripe cherries',
      icon: 'Coffee',
    },
    {
      id: 'carefully-selected',
      title: 'Carefully Selected',
      subtitle: 'Micro-batch roasted for peak aroma',
      icon: 'Sparkles',
    },
    {
      id: 'freshly-packed',
      title: 'Freshly Packed',
      subtitle: 'Degassing valve aroma lock foil',
      icon: 'ShieldCheck',
    },
  ],

  shipping: {
    freeShippingThreshold: 799,
    standardDeliveryFee: 60,
    estimatedDeliveryDays: '2–5 Business Days',
  },
};
