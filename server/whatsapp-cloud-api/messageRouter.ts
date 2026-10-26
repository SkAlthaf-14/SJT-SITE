/**
 * SJT FARMS — WhatsApp Cloud API Message Router & Interactive Conversation Engine
 * 
 * Supports both standalone Node server and Cloud API integration:
 * - Bilingual interaction (English and Telugu)
 * - Welcome message:
 *   "Welcome to SJT FARMS Coffee! ☕ Discover our Araku coffee collection. How can we help you today?"
 * - 9 Core Service Options:
 *   1. Explore products
 *   2. Check prices and pack sizes
 *   3. Product recommendations
 *   4. Place or complete an order
 *   5. Payment assistance
 *   6. Track an order
 *   7. Shipping and delivery questions
 *   8. Cancellation and refund assistance
 *   9. Talk to a human
 * - Dynamic 50g, 100g, 250g packaging and price resolution
 * - Customer Ownership Verification before displaying private order details
 * - Human Handoff with Bot Silence & Reset
 * - Echo and Outgoing Message Loop Prevention
 */

import { MetaWhatsAppClient } from './metaClient.ts';
import { IncomingWhatsAppMessage } from './webhookHandler.ts';
import { loadWhatsAppCloudConfig } from './config.ts';

// In-memory customer session state
interface CustomerSession {
  language: 'en' | 'te';
  lastActive: number;
  currentStep: 'menu' | 'product_detail' | 'awaiting_order_id' | 'human_handoff';
  isHandoff: boolean;
}

const customerSessions = new Map<string, CustomerSession>();

export interface ProductSummary {
  name: string;
  slug: string;
  description: string;
  blend: string;
  defaultPrice: number;
  sizes: { weight: string; price: number; jarImage: string }[];
}

export const PRODUCTS_CATALOGUE: ProductSummary[] = [
  {
    name: 'Araku Instant Coffee Powder',
    slug: 'araku-instant-coffee-powder',
    description: '100% pure shade-grown Arabica from Araku Valley hills with hazelnut & cacao notes.',
    blend: '100% Pure Arabica (0% Chicory)',
    defaultPrice: 199,
    sizes: [
      { weight: '50g', price: 99, jarImage: '/images/products/jars/araku-instant-50g-jar.png' },
      { weight: '100g', price: 199, jarImage: '/images/products/jars/araku-instant-100g-jar.png' },
      { weight: '250g', price: 479, jarImage: '/images/products/jars/araku-instant-250g-jar.png' },
    ],
  },
  {
    name: 'Araku Special Blend Filter Coffee',
    slug: 'araku-special-blend-filter-coffee',
    description: '100% pure single-estate Arabica crafted for traditional South Indian brass filter brewing.',
    blend: '100% Pure Arabica (0% Chicory)',
    defaultPrice: 149,
    sizes: [
      { weight: '50g', price: 69, jarImage: '/images/products/jars/araku-special-blend-50g-jar.png' },
      { weight: '100g', price: 149, jarImage: '/images/products/jars/araku-special-blend-100g-jar.png' },
      { weight: '250g', price: 329, jarImage: '/images/products/jars/araku-special-blend-250g-jar.png' },
    ],
  },
  {
    name: 'Araku Signature Coffee Powder',
    slug: 'araku-signature-coffee',
    description: 'South Indian filter coffee blend with 80% Arabica and 20% high-grade roasted chicory.',
    blend: '80% Arabica Coffee • 20% Chicory',
    defaultPrice: 119,
    sizes: [
      { weight: '50g', price: 49, jarImage: '/images/products/jars/araku-signature-50g-jar.png' },
      { weight: '100g', price: 119, jarImage: '/images/products/jars/araku-signature-100g-jar.png' },
      { weight: '250g', price: 219, jarImage: '/images/products/jars/araku-signature-250g-jar.png' },
    ],
  },
  {
    name: 'Araku Premium Coffee Powder',
    slug: 'araku-premium-coffee',
    description: 'Punchy heavy-bodied South Indian filter blend with 70% Arabica and 30% chicory.',
    blend: '70% Arabica Coffee • 30% Chicory',
    defaultPrice: 109,
    sizes: [
      { weight: '50g', price: 49, jarImage: '/images/products/jars/araku-premium-50g-jar.png' },
      { weight: '100g', price: 109, jarImage: '/images/products/jars/araku-premium-100g-jar.png' },
      { weight: '250g', price: 199, jarImage: '/images/products/jars/araku-premium-250g-jar.png' },
    ],
  },
];

export class WhatsAppMessageRouter {
  private client: MetaWhatsAppClient;
  private config = loadWhatsAppCloudConfig();

  constructor(client?: MetaWhatsAppClient) {
    this.client = client || new MetaWhatsAppClient();
  }

  private getSession(from: string): CustomerSession {
    let session = customerSessions.get(from);
    if (!session) {
      session = {
        language: 'en',
        lastActive: Date.now(),
        currentStep: 'menu',
        isHandoff: false,
      };
      customerSessions.set(from, session);
    }
    session.lastActive = Date.now();
    return session;
  }

  /**
   * Routes an incoming customer message to the appropriate response handler.
   */
  async routeIncomingMessage(msg: IncomingWhatsAppMessage, firestoreOrdersFetcher?: (orderId: string) => Promise<any>): Promise<void> {
    const from = msg.from;
    const session = this.getSession(from);

    // Prevent echo: ignore messages from the business phone itself
    if (from === '918121020111') {
      return;
    }

    // 1. Interactive Button Reply
    if (msg.interactiveType === 'button_reply' && msg.buttonId) {
      await this.handleButtonReply(from, msg.buttonId, session, firestoreOrdersFetcher);
      return;
    }

    // 2. Interactive List Reply
    if (msg.interactiveType === 'list_reply' && msg.listId) {
      await this.handleListReply(from, msg.listId, session, firestoreOrdersFetcher);
      return;
    }

    // 3. Text Message Processing
    const text = (msg.text || '').trim();
    const upperText = text.toUpperCase();

    // Language switch triggers
    if (upperText === 'TE' || upperText === 'TELUGU' || text.includes('తెలుగు')) {
      session.language = 'te';
      await this.sendWelcomeMenu(from, 'te');
      return;
    }
    if (upperText === 'EN' || upperText === 'ENGLISH') {
      session.language = 'en';
      await this.sendWelcomeMenu(from, 'en');
      return;
    }

    // Reset / Menu commands (resets Human Handoff)
    if (upperText === 'MENU' || upperText === 'START' || upperText === 'RESET') {
      session.isHandoff = false;
      session.currentStep = 'menu';
      await this.sendWelcomeMenu(from, session.language);
      return;
    }

    // Silence bot during active human handoff
    if (session.isHandoff) {
      console.info(`[Router] Session ${from} is in human handoff. Bot response paused.`);
      return;
    }

    // Command shortcuts
    if (upperText === 'PRODUCTS' || upperText === 'SHOP') {
      await this.sendCatalogueList(from, session.language);
      return;
    }
    if (upperText === 'PAYMENT' || upperText === 'PAY') {
      await this.sendPaymentAssistance(from, session.language);
      return;
    }
    if (upperText === 'ORDER') {
      await this.sendShopLink(from, session.language);
      return;
    }
    if (upperText === 'TRACK') {
      session.currentStep = 'awaiting_order_id';
      await this.sendTrackingPrompt(from, session.language);
      return;
    }
    if (upperText === 'HELP' || upperText === 'SUPPORT' || upperText === 'HUMAN') {
      await this.handleHumanHandoff(from, session);
      return;
    }

    // Numbered inputs (1 to 9)
    if (/^[1-9]$/.test(text)) {
      await this.handleNumberedOption(from, parseInt(text, 10), session, firestoreOrdersFetcher);
      return;
    }

    // Order tracking input
    if (session.currentStep === 'awaiting_order_id' || /^\d{3,6}$/.test(text.replace('#', ''))) {
      const orderId = text.replace(/^#/, '').trim();
      await this.handleOrderTracking(from, orderId, session, firestoreOrdersFetcher);
      return;
    }

    // Default fallback: Present welcome menu
    await this.sendWelcomeMenu(from, session.language);
  }

  /**
   * Welcome Message & Primary Interaction
   */
  async sendWelcomeMenu(to: string, lang: 'en' | 'te'): Promise<void> {
    const isTe = lang === 'te';

    const header = 'SJT FARMS Coffee ☕';
    const body = isTe
      ? '🌿 *SJT FARMS కి స్వాగతం* ☕\n*ప్రకృతి అందించే స్వచ్ఛమైన అమృతం*\n\nస్వాగతం! మా అరకు కాఫీ కలెక్షన్‌ను అన్వేషించడంలో మీకు సహాయం చేయడానికి మేము సంతోషిస్తున్నాము.\nఈ రోజు మేము మీకు ఏ విధంగా సహాయపడగలము?\n\nభాష మార్చడానికి "ENGLISH" అని టైప్ చేయండి.'
      : '🌿 *WELCOME TO SJT FARMS* ☕\n*Pure Goodness from Nature*\n\nWelcome! We\'re delighted to help you discover our Araku coffee collection.\nHow can we help you today?\n\nType "TELUGU" for Telugu.';

    const buttons = isTe
      ? [
          { id: 'btn_catalogue', title: 'Explore Coffee ☕' },
          { id: 'btn_all_menu', title: 'Main Menu (1-7) 📋' },
          { id: 'btn_track', title: 'Track My Order 📦' },
        ]
      : [
          { id: 'btn_catalogue', title: 'Explore Coffee ☕' },
          { id: 'btn_all_menu', title: 'Main Menu (1-7) 📋' },
          { id: 'btn_track', title: 'Track My Order 📦' },
        ];

    await this.client.sendInteractiveButtons(to, body, buttons, {
      headerText: header,
      footerText: isTe ? 'SJT Farms • Pure Goodness from Nature' : 'SJT Farms • Pure Goodness from Nature',
    });
  }

  /**
   * Full 7-Item Interactive Main Menu (List Message)
   */
  async sendFullMainMenu(to: string, lang: 'en' | 'te'): Promise<void> {
    const isTe = lang === 'te';

    const header = isTe ? 'SJT FARMS సేవల మెనూ' : 'SJT FARMS Service Menu';
    const body = isTe
      ? 'కింది 7 ఎంపికలలో ఒకదాన్ని ఎంచుకోండి లేదా 1 నుండి 7 నంబర్ టైప్ చేయండి:'
      : 'Please choose an option below or reply with a number (1–7):';

    const sections = [
      {
        title: isTe ? 'సేవలు' : 'SJT Services',
        rows: isTe
          ? [
              { id: 'opt_1_explore', title: '1. Explore Coffee', description: '4 ప్రత్యేకమైన అరకు కాఫీ రకాలు' },
              { id: 'opt_2_prices', title: '2. Prices & Pack Sizes', description: '50g, 100g, 250g జార్ల ధరలు' },
              { id: 'opt_3_track', title: '3. Track My Order', description: 'ఆర్డర్ నంబర్ తో లైవ్ స్టేటస్' },
              { id: 'opt_4_payment', title: '4. Payment Assistance', description: 'మాన్యువల్ UPI & UTR వెరిఫికేషన్' },
              { id: 'opt_5_shipping', title: '5. Shipping & Delivery', description: 'డెలివరీ సమయం & ఉచిత షిప్పింగ్' },
              { id: 'opt_6_refund', title: '6. Returns & Refunds', description: 'రిటర్న్ రిక్వెస్ట్ & రీఫండ్ పాలసీ' },
              { id: 'opt_7_human', title: '7. Talk to Our Team', description: 'అధికారిక కస్టమర్ కేర్ డెస్క్' },
            ]
          : [
              { id: 'opt_1_explore', title: '1. Explore Coffee', description: '4 authentic Araku blends' },
              { id: 'opt_2_prices', title: '2. Prices & Pack Sizes', description: '50g, 100g, 250g packaging & prices' },
              { id: 'opt_3_track', title: '3. Track My Order', description: 'Live order roasting & courier tracking' },
              { id: 'opt_4_payment', title: '4. Payment Assistance', description: 'Manual UPI & UTR verification policy' },
              { id: 'opt_5_shipping', title: '5. Shipping & Delivery', description: 'Timelines & ₹799 free shipping threshold' },
              { id: 'opt_6_refund', title: '6. Returns & Refunds', description: 'Return request & policy' },
              { id: 'opt_7_human', title: '7. Talk to Our Team', description: 'Connect with roastery concierge desk' },
            ],
      },
    ];

    await this.client.sendInteractiveList(
      to,
      body,
      isTe ? 'మెనూ ఎంచుకోండి' : 'Select Option',
      sections,
      {
        headerText: header,
        footerText: 'SJT Farms Coffee • +91 8121020111',
      }
    );
  }

  private async handleNumberedOption(
    to: string,
    num: number,
    session: CustomerSession,
    firestoreOrdersFetcher?: (orderId: string) => Promise<any>
  ): Promise<void> {
    switch (num) {
      case 1:
        await this.sendCatalogueList(to, session.language);
        break;
      case 2:
        await this.sendPricesAndSizes(to, session.language);
        break;
      case 3:
        session.currentStep = 'awaiting_order_id';
        await this.sendTrackingPrompt(to, session.language);
        break;
      case 4:
        await this.sendPaymentAssistance(to, session.language);
        break;
      case 5:
        await this.sendShippingInformation(to, session.language);
        break;
      case 6:
        await this.sendCancellationInformation(to, session.language);
        break;
      case 7:
        await this.handleHumanHandoff(to, session);
        break;
      case 8:
        await this.sendCancellationInformation(to, session.language);
        break;
      case 9:
        await this.handleHumanHandoff(to, session);
        break;
      default:
        await this.sendFullMainMenu(to, session.language);
    }
  }

  private async handleButtonReply(to: string, buttonId: string, session: CustomerSession, firestoreOrdersFetcher?: (orderId: string) => Promise<any>): Promise<void> {
    if (buttonId.startsWith('pack_')) {
      await this.handlePackSizeSelection(to, buttonId, session.language);
      return;
    }
    switch (buttonId) {
      case 'btn_catalogue':
        await this.sendCatalogueList(to, session.language);
        break;
      case 'btn_all_menu':
        await this.sendFullMainMenu(to, session.language);
        break;
      case 'btn_track':
        session.currentStep = 'awaiting_order_id';
        await this.sendTrackingPrompt(to, session.language);
        break;
      default:
        await this.sendWelcomeMenu(to, session.language);
    }
  }

  private async handleListReply(to: string, listId: string, session: CustomerSession, firestoreOrdersFetcher?: (orderId: string) => Promise<any>): Promise<void> {
    if (listId === 'opt_1_explore') return this.sendCatalogueList(to, session.language);
    if (listId === 'opt_2_prices') return this.sendPricesAndSizes(to, session.language);
    if (listId === 'opt_3_track' || listId === 'opt_6_track') {
      session.currentStep = 'awaiting_order_id';
      return this.sendTrackingPrompt(to, session.language);
    }
    if (listId === 'opt_4_payment' || listId === 'opt_5_payment') return this.sendPaymentAssistance(to, session.language);
    if (listId === 'opt_5_shipping' || listId === 'opt_7_shipping') return this.sendShippingInformation(to, session.language);
    if (listId === 'opt_6_refund' || listId === 'opt_8_refund') return this.sendCancellationInformation(to, session.language);
    if (listId === 'opt_7_human' || listId === 'opt_9_human') return this.handleHumanHandoff(to, session);
    if (listId === 'opt_3_recommend') return this.sendRecommendations(to, session.language);
    if (listId === 'opt_4_order') return this.sendShopLink(to, session.language);

    if (listId.startsWith('prod_')) {
      const slug = listId.replace('prod_', '');
      await this.sendPackSizeSelector(to, slug, session.language);
      return;
    }
  }

  /**
   * 1. Explore Products (Interactive Catalogue List)
   */
  async sendCatalogueList(to: string, lang: 'en' | 'te'): Promise<void> {
    const isTe = lang === 'te';
    const header = isTe ? 'మా కాఫీ రకాలు' : 'SJT Farms Coffee Blends';
    const body = isTe
      ? 'అరకు వ్యాలీలో సహజ సిద్ధంగా పండించిన మా 4 కాఫీ బ్లెండ్లను పరిశీలించండి. వివరాలు మరియు ప్యాక్ సైజుల కోసం ఏదైనా రకాన్ని ఎంచుకోండి:'
      : 'Explore our 4 authentic Araku coffee blends available in 50g, 100g, and 250g glass jars. Select a blend to view sizes and prices:';

    const sections = [
      {
        title: isTe ? 'అరకు కాఫీ రకాలు' : 'Araku Blends',
        rows: PRODUCTS_CATALOGUE.map((p) => ({
          id: `prod_${p.slug}`,
          title: p.name.length > 24 ? p.name.slice(0, 24) : p.name,
          description: `${p.blend} • 50g, 100g, 250g`,
        })),
      },
    ];

    await this.client.sendInteractiveList(to, body, isTe ? 'కాఫీ ఎంచుకోండి' : 'View Blends', sections, {
      headerText: header,
      footerText: 'SJT Farms • 100% Shade-Grown Araku Coffee',
    });
  }

  /**
   * 2. Check Prices and Pack Sizes
   */
  async sendPricesAndSizes(to: string, lang: 'en' | 'te'): Promise<void> {
    const isTe = lang === 'te';
    let msg = isTe
      ? '☕ *SJT FARMS — అధీకృత ధరల జాబితా (అన్ని పన్నులతో కలిపి)*\n\n'
      : '☕ *SJT FARMS — Official Packaging & Pricing Catalogue*\n\n';

    for (const p of PRODUCTS_CATALOGUE) {
      msg += `*${p.name}* (${p.blend})\n`;
      for (const s of p.sizes) {
        msg += `  • ${s.weight} Jar: ₹${s.price}\n`;
      }
      msg += `  🔗 ${this.config.storeUrl}/#product/${p.slug}\n\n`;
    }

    msg += isTe
      ? 'ఆర్డర్ చేయుటకు వెబ్‌సైట్ లింక్ ఉపయోగించండి లేదా కావలసిన ప్యాక్ సైజ్ ఇక్కడ మెసేజ్ చేయండి.'
      : 'To order, visit the direct product links or reply with your chosen blend and pack size (50g, 100g, 250g).';

    await this.client.sendTextMessage(to, msg, false);
  }

  /**
   * 3. Product Recommendations
   */
  async sendRecommendations(to: string, lang: 'en' | 'te'): Promise<void> {
    const isTe = lang === 'te';
    const msg = isTe
      ? `💡 *SJT FARMS — కాఫీ ఎంపిక మార్గదర్శకం:*\n\n` +
        `1. *స్ట్రాంగ్ ఫిల్టర్ కాఫీ ప్రియులకు:* 👉 *Araku Premium* (70:30) — చిక్కని డికాక్షన్, రిచ్ నురుగు.\n` +
        `2. *సమతుల్య అరోమా కోసం:* 👉 *Araku Signature* (80:20) — చాక్లెట్ నోట్స్ మరియు క్లాసిక్ ఫిల్టర్ కాఫీ.\n` +
        `3. *స్వచ్ఛమైన కాఫీ కోరుకునేవారికి (0% చికోరి):* 👉 *Araku Special Blend* (100% అరేబికా) — బ్లాక్ కాఫీ & ప్యూర్ కాఫీ.\n` +
        `4. *తక్షణ తయారీ కోసం:* 👉 *Araku Instant* (100% ప్యూర్ ఇన్స్టంట్) — వేడి నీరు లేదా పాలలో తక్షణమే కరిగిపోతుంది.`
      : `💡 *SJT FARMS Coffee Flavor & Brewing Guide:*\n\n` +
        `1. *For Bold, Strong South Indian Filter Kaapi:* 👉 *Araku Premium* (70% Arabica : 30% Chicory) — Heavy decoction, rich golden crema.\n` +
        `2. *For Balanced, Aromatic Morning Filter Kaapi:* 👉 *Araku Signature* (80% Arabica : 20% Chicory) — Smooth roasted hazelnut and dark chocolate notes.\n` +
        `3. *For Pure Single-Origin Connoisseurs (Zero Chicory):* 👉 *Araku Special Blend* (100% Pure Arabica) — Pure shade-grown mountain Arabica.\n` +
        `4. *For Instant Convenience:* 👉 *Araku Instant Coffee Powder* (100% Pure Arabica) — Dissolves smoothly in hot milk or water.`;

    await this.client.sendTextMessage(to, msg, true);
  }

  /**
   * 4. Place or Complete Order (Shop Link)
   */
  async sendShopLink(to: string, lang: 'en' | 'te'): Promise<void> {
    const isTe = lang === 'te';
    const shopUrl = `${this.config.storeUrl}/shop`;

    const message = isTe
      ? `🛍️ *SJT FARMS ఆన్‌లైన్ స్టోర్*\n\nమా పూర్తి కాఫీ శ్రేణిని వెబ్‌సైట్‌లో చూడవచ్చు. కార్ట్‌కు జోడించి, డెలివరీ చిరునామా నమోదు చేసి సులభంగా ఆర్డర్ చేయండి:\n🔗 ${shopUrl}\n\n• ఫ్రీ షిప్పింగ్: ₹799 పైన ఆర్డర్లకు భారతదేశమంతటా ఉచితం\n• డైరెక్ట్ UPI ద్వారా చెల్లింపు`
      : `🛍️ *SJT FARMS Online Store*\n\nBrowse our complete coffee collection on our official website. Select your package size, add to cart, and checkout with fast express courier across India:\n🔗 ${shopUrl}\n\n• Free shipping on orders over ₹799\n• Safe-sealed glass jar packaging`;

    await this.client.sendTextMessage(to, message, true);
  }

  /**
   * 5. Payment Assistance with Strict Verification Safeguards
   */
  async sendPaymentAssistance(to: string, lang: 'en' | 'te'): Promise<void> {
    const isTe = lang === 'te';

    const message = isTe
      ? `💳 *UPI పేమెంట్ మరియు UTR వెరిఫికేషన్ విధానం*\n\nSJT Farms ఆర్డర్లకు డైరెక్ట్ UPI ద్వారా చెల్లించవచ్చు. ఆర్డర్ సమర్పించిన తర్వాత మీ UPI యాప్‌లోని 12-అంకెల UTR / ట్రాన్సాక్షన్ నంబర్‌ను వెబ్‌సైట్‌లో సమర్పించండి.\n\n*ముఖ్యమైన భద్రతా నియమాలు:*\n1. UTR సమర్పించిన తర్వాత ఆర్డర్ "Payment Pending Verification" లో ఉంటుంది.\n2. మా అధీకృత బ్యాంక్ నిర్వాహకులు బ్యాంక్ స్టేట్‌మెంట్‌తో సరిచూసిన తర్వాత మాత్రమే పేమెంట్ కన్ఫర్మ్ చేయబడుతుంది.\n3. వాట్సాప్ మెసేజ్ లేదా స్క్రీన్‌షాట్ ద్వారా మాత్రమే పేమెంట్ పూర్తయినట్లు మార్క్ చేయబడదు.\n4. SJT Farms ఎప్పుడూ UPI పిన్ (PIN), ఓటీపీ (OTP), లేదా పాస్‌వర్డ్‌లను అడగదు. ఎవరితోనూ పంచుకోవద్దు.`
      : `💳 *UPI Payment & UTR Verification Policy*\n\nOrders on SJT Farms can be paid via Direct UPI. After completing payment in your UPI app, submit your 12-digit UTR transaction reference on our website checkout/tracking screen.\n\n*Strict Security Guardrails:*\n1. After UTR submission, your order is placed in "Payment Pending Verification" status.\n2. Only an authorized administrator verifies the actual bank transaction against bank statements.\n3. Orders are NEVER marked paid merely because a WhatsApp message, screenshot, or UTR was received.\n4. SJT Farms will NEVER ask for your UPI PIN, OTP, or banking passwords. Never disclose your PIN to anyone.`;

    await this.client.sendTextMessage(to, message, false);
  }

  /**
   * 6. Tracking Prompt & Order Lookup with Customer Ownership Verification
   */
  async sendTrackingPrompt(to: string, lang: 'en' | 'te'): Promise<void> {
    const isTe = lang === 'te';
    const trackingPortalUrl = `${this.config.storeUrl}/#track-order`;

    const message = isTe
      ? `📦 *ఆర్డర్ ట్రాకింగ్ సహాయం*\n\nమీ ఆర్డర్ స్టేటస్ తెలుసుకోవడానికి మీ ఆర్డర్ నంబర్ (ఉదా: 101 లేదా SJT-101) ఇక్కడ టైప్ చేయండి.\n\nలేదా మా వెబ్‌సైట్ ట్రాకింగ్ పోర్టల్‌లో లైవ్ స్టేటస్ చూడవచ్చు:\n🔗 ${trackingPortalUrl}`
      : `📦 *Live Order Tracking*\n\nTo check your order progress, please reply with your Order Number (e.g. 101 or SJT-101).\n\nYou can also track your live roasting and courier dispatch on our website portal:\n🔗 ${trackingPortalUrl}`;

    await this.client.sendTextMessage(to, message, true);
  }

  async handleOrderTracking(to: string, orderId: string, session: CustomerSession, firestoreOrdersFetcher?: (id: string) => Promise<any>): Promise<void> {
    session.currentStep = 'menu';
    const isTe = session.language === 'te';

    if (!firestoreOrdersFetcher) {
      const trackingUrl = `${this.config.storeUrl}/#track-order?order=${encodeURIComponent(orderId)}`;
      const msg = isTe
        ? `📦 *ఆర్డర్ #${orderId} ట్రాకింగ్*\n\nమా అధికారిక పోర్టల్‌లో లైవ్ స్టేటస్ చూడవచ్చు:\n🔗 ${trackingUrl}`
        : `📦 *Order #${orderId} Tracking*\n\nView live fulfillment status on our official portal:\n🔗 ${trackingUrl}`;
      await this.client.sendTextMessage(to, msg, true);
      return;
    }

    try {
      const order = await firestoreOrdersFetcher(orderId);
      if (!order) {
        const notFound = isTe
          ? `❌ ఆర్డర్ #${orderId} కనుగొనబడలేదు. దయచేసి మీ నంబర్ సరిచూసుకోండి లేదా వెబ్‌సైట్ పోర్టల్ సందర్శించండి:\n🔗 ${this.config.storeUrl}/#track-order`
          : `❌ Order #${orderId} could not be found. Please check your order number or visit our portal:\n🔗 ${this.config.storeUrl}/#track-order`;
        await this.client.sendTextMessage(to, notFound, true);
        return;
      }

      // Customer Ownership Verification
      const senderDigits = to.replace(/\D/g, '').slice(-10);
      const orderDigits = (order.phone || order.customer?.phone || '').replace(/\D/g, '').slice(-10);
      const isOwner = Boolean(senderDigits && orderDigits && senderDigits === orderDigits);

      if (!isOwner) {
        const redacted = isTe
          ? `📦 *ఆర్డర్ #${order.orderNumber || orderId}*\n\nస్టేటస్: *${order.orderStatus || 'Processing'}*\nపేమెంట్: *${order.paymentVerificationStatus || order.paymentStatus || 'Pending'}*\n\nకస్టమర్ గోప్యత దృష్ట్యా చిరునామా దాచబడింది. మీ రిజిస్టర్డ్ ఫోన్ లేదా పోర్టల్ ద్వారా చూడండి:\n🔗 ${this.config.storeUrl}/#track-order?order=${order.orderNumber || orderId}`
          : `📦 *Order #${order.orderNumber || orderId}*\n\nStatus: *${order.orderStatus || 'Processing'}*\nPayment: *${order.paymentVerificationStatus || order.paymentStatus || 'Pending'}*\n\nFor privacy, delivery address is hidden on unverified numbers. View full details on our secure portal:\n🔗 ${this.config.storeUrl}/#track-order?order=${order.orderNumber || orderId}`;
        await this.client.sendTextMessage(to, redacted, true);
        return;
      }

      const itemsStr = (order.items || [])
        .map((i: any) => `• ${i.name || i.product?.name} (${i.selectedWeight || '100g'}) × ${i.quantity || 1}`)
        .join('\n');

      const full = isTe
        ? `📦 *ఆర్డర్ #${order.orderNumber || orderId} వివరాలు (ధృవీకరించబడింది)*\n\n` +
          `కస్టమర్: ${order.customerName || order.customer?.fullName}\n` +
          `ఆర్డర్ స్థితి: *${order.orderStatus || 'Processing'}*\n` +
          `పేమెంట్ స్థితి: *${order.paymentVerificationStatus || order.paymentStatus || 'Pending'}*\n` +
          `మొత్తం: ₹${order.totalAmount || order.total}\n\n` +
          `వస్తువులు:\n${itemsStr}\n\n` +
          `లైవ్ ట్రాకింగ్:\n🔗 ${this.config.storeUrl}/#track-order?order=${order.orderNumber || orderId}`
        : `📦 *Order #${order.orderNumber || orderId} Details (Verified)*\n\n` +
          `Customer: ${order.customerName || order.customer?.fullName}\n` +
          `Order Status: *${order.orderStatus || 'Processing'}*\n` +
          `Payment Status: *${order.paymentVerificationStatus || order.paymentStatus || 'Pending'}*\n` +
          `Total Amount: ₹${order.totalAmount || order.total}\n\n` +
          `Items:\n${itemsStr}\n\n` +
          `Live Portal Tracking:\n🔗 ${this.config.storeUrl}/#track-order?order=${order.orderNumber || orderId}`;

      await this.client.sendTextMessage(to, full, true);
    } catch (err: any) {
      console.error('[Router] Tracking error:', err.message);
      await this.client.sendTextMessage(to, `Order tracking lookup error. Please visit ${this.config.storeUrl}/#track-order`, true);
    }
  }

  /**
   * 7. Shipping and Delivery Questions
   */
  async sendShippingInformation(to: string, lang: 'en' | 'te'): Promise<void> {
    const isTe = lang === 'te';
    const msg = isTe
      ? `🚚 *షిప్పింగ్ & డెలివరీ సమాచారం*\n\n` +
        `• *ఉచిత షిప్పింగ్:* ₹799 కంటే ఎక్కువ మొత్తం ఆర్డర్లపై భారతదేశమంతటా ఉచిత ఎక్స్‌ప్రెస్ కొరియర్.\n` +
        `• *స్టాండర్డ్ చార్జీ:* ₹799 లోపు ఆర్డర్లకు ఫ్లాట్ ₹60.\n` +
        `• *డిస్పాచ్:* పేమెంట్ ధృవీకరించబడిన 24 గంటలలోపు రోస్టరీ నుండి పంపబడుతుంది.\n` +
        `• *సమయం:* 2–4 వ్యాపార రోజులు.\n\n` +
        `మరిన్ని వివరాలకు మా FAQ పేజీ చూడండి:\n🔗 ${this.config.storeUrl}/faq`
      : `🚚 *Shipping & Delivery Information*\n\n` +
        `• *Free Delivery Threshold:* Free express shipping across India on orders over ₹799.\n` +
        `• *Standard Courier Fee:* Flat ₹60 for orders under ₹799.\n` +
        `• *Dispatch Timeline:* Freshly sealed and dispatched within 24 hours of payment verification.\n` +
        `• *Transit:* 2–4 business days across India.\n\n` +
        `Learn more on our FAQ page:\n🔗 ${this.config.storeUrl}/faq`;

    await this.client.sendTextMessage(to, msg, true);
  }

  /**
   * 8. Cancellation and Refund Assistance
   */
  async sendCancellationInformation(to: string, lang: 'en' | 'te'): Promise<void> {
    const isTe = lang === 'te';
    const msg = isTe
      ? `↩️ *ఆర్డర్ రద్దు & రీఫండ్ విధానం*\n\n` +
        `• *రద్దు:* రోస్టరీ నుండి పార్సిల్ డిస్పాచ్ కావడానికి ముందే మీరు ఆర్డర్ రద్దు చేయవచ్చు.\n` +
        `• *రీఫండ్:* రద్దు ధృవీకరించిన తర్వాత 3–5 బ్యాంకు పనిదినాల్లో మీ UPI అకౌంట్‌కు డబ్బులు జమ చేయబడతాయి.\n\n` +
        `ఆర్డర్ రద్దు కోసం మీ ఆర్డర్ నంబర్ పంపండి లేదా సపోర్ట్ డెస్క్‌తో మాట్లాడండి.`
      : `↩️ *Cancellation & Refund Policy*\n\n` +
        `• *Cancellation:* You may cancel your order before it is dispatched from our Araku roastery.\n` +
        `• *Refunds:* Approved refunds are credited directly to your originating UPI account in 3–5 business days.\n\n` +
        `To cancel an order, reply with your Order Number or select "Talk to a Human".`;

    await this.client.sendTextMessage(to, msg, false);
  }

  /**
   * 9. Talk to a Human / Human Handoff
   */
  async handleHumanHandoff(to: string, session: CustomerSession): Promise<void> {
    session.isHandoff = true;
    session.currentStep = 'human_handoff';
    const isTe = session.language === 'te';

    const msg = isTe
      ? `📞 *అరకు రోస్టరీ కస్టమర్ కేర్ డెస్క్*\n\nమీ రిక్వెస్ట్ మా బృందానికి పంపబడింది. మా సిబ్బంది త్వరలో స్పందిస్తారు.\n\n• పనివేళలు: సోమవారం – శనివారం, ఉదయం 9:00 – సాయంత్రం 6:00 IST\n• అధికారిక నంబర్: +91 8121020111\n\n(బాట్ మెనూకి తిరిగి రావడానికి "MENU" అని టైప్ చేయండి).`
      : `📞 *SJT FARMS Human Roastery Concierge*\n\nYour request has been routed to our roastery desk. A representative will message you shortly.\n\n• Desk Hours: Mon – Sat, 9:00 AM – 6:00 PM IST\n• Official Phone: +91 8121020111\n\n(Type "MENU" at any time to return to automated assistant).`;

    await this.client.sendTextMessage(to, msg, false);
  }

  /**
   * Sub-flow: Send 3-Button Pack Size Selector
   */
  async sendPackSizeSelector(to: string, productSlug: string, lang: 'en' | 'te'): Promise<void> {
    const product = PRODUCTS_CATALOGUE.find((p) => p.slug === productSlug);
    if (!product) return;

    const isTe = lang === 'te';
    const header = product.name.slice(0, 60);
    const body = isTe
      ? `☕ *${product.name}*\n${product.blend}\n\nమీకు కావాల్సిన గ్లాస్ జార్ ప్యాక్ సైజ్ ఎంచుకోండి:`
      : `☕ *${product.name}*\n${product.blend}\n\nPlease select your preferred glass jar pack size:`;

    const buttons = product.sizes.map((s) => ({
      id: `pack_${product.slug}_${s.weight}`,
      title: `${s.weight} — ₹${s.price}`.slice(0, 20),
    }));

    await this.client.sendInteractiveButtons(to, body, buttons, {
      headerText: header,
      footerText: 'SJT Farms Estate Packaging',
    });
  }

  /**
   * Sub-flow: Handle Pack Size Button Selection
   */
  private async handlePackSizeSelection(to: string, buttonId: string, lang: 'en' | 'te'): Promise<void> {
    const parts = buttonId.replace('pack_', '').split('_');
    const weight = parts.pop() || '100g';
    const slug = parts.join('_');

    const product = PRODUCTS_CATALOGUE.find((p) => p.slug === slug);
    if (!product) return;

    const size = product.sizes.find((s) => s.weight === weight) || product.sizes[1];
    const isTe = lang === 'te';
    const canonicalUrl = `${this.config.storeUrl}/#product/${product.slug}?variant=${encodeURIComponent(size.weight)}`;

    const message = isTe
      ? `☕ *${product.name}*\n\nఎంచుకున్న సైజ్: *${size.weight}*\nధర: *₹${size.price}* (అన్ని పన్నులతో కలిపి)\n\nప్రత్యక్ష వెబ్‌సైట్ లింక్ మరియు జార్ ఫోటో:\n🔗 ${canonicalUrl}\n\nవెబ్‌సైట్‌లో కార్ట్‌కు జోడించి సులభంగా ఆర్డర్ చేయవచ్చు. లేదా వాట్సాప్ ద్వారా ఆర్డర్ చేయుటకు మీ పూర్తి చిరునామా ఇక్కడ పంపండి.`
      : `☕ *${product.name}*\n\nSelected Size: *${size.weight}*\nCatalogue Price: *₹${size.price}* (Includes all taxes)\n\nCanonical Product Link & Packaging Preview:\n🔗 ${canonicalUrl}\n\nAdd to cart on our website for instant checkout, or reply with your delivery address to order directly via WhatsApp concierge.`;

    if (this.config.storeUrl.startsWith('https://')) {
      const fullImageUrl = `${this.config.storeUrl}${size.jarImage}`;
      await this.client.sendImageMessage(to, fullImageUrl, `${product.name} (${size.weight}) — ₹${size.price}`);
    }

    await this.client.sendTextMessage(to, message, true);
  }
}
