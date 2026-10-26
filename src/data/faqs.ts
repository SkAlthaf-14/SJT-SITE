export interface FAQItem {
  id: string;
  category: 'Orders & Shipping' | 'Coffee & Freshness' | 'Brewing & Equipment' | 'Subscriptions';
  question: string;
  answer: string;
}

export const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Coffee & Freshness',
    question: 'How fresh is SJT Farms coffee powder when it arrives?',
    answer: 'Every pouch is roasted and ground in small artisanal batches. We seal each bag within minutes of degassing into high-barrier pouches with one-way freshness valves to lock in delicate aromatic oils. Your coffee typically reaches you within 2 to 5 days of dispatch.'
  },
  {
    id: 'faq-2',
    category: 'Coffee & Freshness',
    question: 'What is the shelf life of SJT Coffee Powder and how should I store it?',
    answer: 'Unopened pouches retain peak fragrance for up to 6 months. Once opened, we recommend storing the powder in an opaque, airtight canister away from heat, moisture, and direct sunlight, and consuming it within 30 to 45 days for optimal aroma.'
  },
  {
    id: 'faq-3',
    category: 'Brewing & Equipment',
    question: 'Which grind size should I choose for South Indian Filter coffee?',
    answer: 'Our standard coffee powder is precision-ground to a medium-fine consistency specifically engineered for traditional South Indian stainless steel and brass filters. It allows the hot water to extract soluble compounds over 12–15 minutes without choking the disc or dripping too quickly.'
  },
  {
    id: 'faq-4',
    category: 'Brewing & Equipment',
    question: 'Does SJT coffee contain chicory?',
    answer: 'We offer both options! Our SJT Signature (85:15) and SJT Premium Filter (70:30) blends contain premium roasted chicory for the authentic thick decoction loved across South India. Our SJT Special Blend is 100% pure single-origin coffee with 0% chicory, ideal for pour overs, French press, or black coffee.'
  },
  {
    id: 'faq-5',
    category: 'Orders & Shipping',
    question: 'What is the shipping cost and delivery timeframe?',
    answer: 'We offer free delivery on all orders above ₹799 across India. Standard orders are dispatched within 24 to 48 hours. Metro deliveries arrive in 2–3 business days; rest of India in 4–5 business days with live SMS and WhatsApp tracking.'
  },
  {
    id: 'faq-6',
    category: 'Orders & Shipping',
    question: 'Can I return or exchange my coffee powder?',
    answer: 'As an artisanal food and beverage product, we do not accept returns on opened coffee pouches. However, if your shipment arrived damaged, torn, or with incorrect items, please contact our support team within 48 hours for an immediate complimentary replacement.'
  },
  {
    id: 'faq-7',
    category: 'Subscriptions',
    question: 'How does the SJT Coffee Subscription work?',
    answer: 'Select your favourite blend, quantity, and delivery frequency (every 15, 30, or 45 days). You receive a recurring 15% discount, complimentary shipping on every cycle, and priority batch roasting. You can pause, adjust, or cancel anytime from your account dashboard with zero fees.'
  },
  {
    id: 'faq-8',
    category: 'Subscriptions',
    question: 'Can I change my coffee blend or delivery frequency later?',
    answer: 'Yes! Simply sign in to your SJT Farms account or reach out via WhatsApp/email at least 48 hours prior to your next scheduled roast date to update your blend, pack size, or shipping address.'
  }
];
