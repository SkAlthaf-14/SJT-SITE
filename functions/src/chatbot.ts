/**
 * SJT FARMS — WhatsApp Stateful Chatbot Engine
 * 
 * Supports English and Telugu conversation states:
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
 * - Interactive Buttons, Interactive Lists, Numbered Fallbacks (1..9), and Commands
 * - Customer Ownership Verification before displaying private order details
 * - Human Handoff with Bot Silence & Reset
 * - Echo and Outgoing Message Loop Prevention
 */

import { MetaWhatsAppClient } from './metaClient';
import { IncomingMessage } from './webhookHandler';
import { getWhatsAppConfig } from './config';

export type ChatLanguage = 'en' | 'te';

export interface UserSession {
  phone: string;
  language: ChatLanguage;
  lastActive: number;
  currentStep: 'menu' | 'product_detail' | 'awaiting_order_id' | 'human_handoff';
  selectedProduct?: string;
  isHandoff: boolean;
}

// In-memory session store (with Firestore persistence capability)
const activeSessions = new Map<string, UserSession>();

export interface CatalogueProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  tagline: string;
  roast: string;
  blend: string;
  variants: { size: string; price: number; jarAsset: string }[];
}

export const OFFICIAL_CATALOGUE: CatalogueProduct[] = [
  {
    id: 'araku-instant-coffee-powder',
    name: 'Araku Instant Coffee Powder',
    slug: 'araku-instant-coffee-powder',
    description: '100% pure shade-grown Arabica from Araku Valley hills with hazelnut & cacao notes.',
    tagline: 'Instant Perfection. Mountain Aroma. 100% Pure Arabica.',
    roast: 'Medium-Dark Artisan Roast',
    blend: '100% Pure Arabica (0% Chicory)',
    variants: [
      { size: '50g', price: 99, jarAsset: '/images/products/jars/araku-instant-50g-jar.png' },
      { size: '100g', price: 199, jarAsset: '/images/products/jars/araku-instant-100g-jar.png' },
      { size: '250g', price: 479, jarAsset: '/images/products/jars/araku-instant-250g-jar.png' },
    ],
  },
  {
    id: 'araku-special-blend-filter-coffee',
    name: 'Araku Special Blend Filter Coffee',
    slug: 'araku-special-blend-filter-coffee',
    description: '100% pure single-estate Arabica crafted for traditional South Indian brass filter brewing.',
    tagline: '100% Pure Single-Estate Arabica Filter Coffee',
    roast: 'Medium Artisan Roast',
    blend: '100% Pure Arabica (0% Chicory)',
    variants: [
      { size: '50g', price: 69, jarAsset: '/images/products/jars/araku-special-blend-50g-jar.png' },
      { size: '100g', price: 149, jarAsset: '/images/products/jars/araku-special-blend-100g-jar.png' },
      { size: '250g', price: 329, jarAsset: '/images/products/jars/araku-special-blend-250g-jar.png' },
    ],
  },
  {
    id: 'araku-signature-coffee',
    name: 'Araku Signature Coffee Powder',
    slug: 'araku-signature-coffee',
    description: 'South Indian filter coffee blend with 80% Arabica and 20% high-grade roasted chicory.',
    tagline: 'Aromatic & Balanced — 80% Arabica Coffee with Chicory',
    roast: 'Dark Roast Kaapi Blend',
    blend: '80% Arabica Coffee • 20% Chicory',
    variants: [
      { size: '50g', price: 49, jarAsset: '/images/products/jars/araku-signature-50g-jar.png' },
      { size: '100g', price: 119, jarAsset: '/images/products/jars/araku-signature-100g-jar.png' },
      { size: '250g', price: 219, jarAsset: '/images/products/jars/araku-signature-250g-jar.png' },
    ],
  },
  {
    id: 'araku-premium-coffee',
    name: 'Araku Premium Coffee Powder',
    slug: 'araku-premium-coffee',
    description: 'Punchy heavy-bodied South Indian filter blend with 70% Arabica and 30% chicory.',
    tagline: 'Bold Decoction & Rich Crema — 70% Arabica Coffee with Chicory',
    roast: 'Deep Bold Kaapi Roast',
    blend: '70% Arabica Coffee • 30% Chicory',
    variants: [
      { size: '50g', price: 49, jarAsset: '/images/products/jars/araku-premium-50g-jar.png' },
      { size: '100g', price: 109, jarAsset: '/images/products/jars/araku-premium-100g-jar.png' },
      { size: '250g', price: 199, jarAsset: '/images/products/jars/araku-premium-250g-jar.png' },
    ],
  },
];

export class ChatbotRouter {
  private client: MetaWhatsAppClient;
  private config = getWhatsAppConfig();

  constructor(client?: MetaWhatsAppClient) {
    this.client = client || new MetaWhatsAppClient();
  }

  private getSession(phone: string): UserSession {
    let session = activeSessions.get(phone);
    if (!session) {
      session = {
        phone,
        language: 'en',
        lastActive: Date.now(),
        currentStep: 'menu',
        isHandoff: false,
      };
      activeSessions.set(phone, session);
    }
    session.lastActive = Date.now();
    return session;
  }

  /**
   * Main incoming message entry point
   */
  async handleIncomingMessage(msg: IncomingMessage, firestoreOrdersFetcher?: (orderId: string) => Promise<any>): Promise<void> {
    const session = this.getSession(msg.from);

    // Prevent loop: Ignore echo messages from the business phone itself
    if (msg.from === this.config.businessPhone) {
      return;
    }

    // 1. Check Interactive Button Replies
    if (msg.interactiveType === 'button_reply' && msg.buttonId) {
      await this.routeButtonAction(session, msg.buttonId, firestoreOrdersFetcher);
      return;
    }

    // 2. Check Interactive List Replies
    if (msg.interactiveType === 'list_reply' && msg.listId) {
      await this.routeListAction(session, msg.listId, firestoreOrdersFetcher);
      return;
    }

    // 3. Process Text Input
    const text = (msg.text || '').trim();
    const upperText = text.toUpperCase();

    // Check Language Commands
    if (upperText === 'ENGLISH' || upperText === 'EN') {
      session.language = 'en';
      await this.sendWelcome(session);
      return;
    }
    if (upperText === 'TELUGU' || upperText === 'TE' || text.includes('తెలుగు')) {
      session.language = 'te';
      await this.sendWelcome(session);
      return;
    }

    // Check Reset / Menu Commands (Resets Human Handoff)
    if (upperText === 'MENU' || upperText === 'START' || upperText === 'RESET') {
      session.isHandoff = false;
      session.currentStep = 'menu';
      await this.sendWelcome(session);
      return;
    }

    // If session is currently in Human Handoff, silence the bot so the human agent can chat
    if (session.isHandoff) {
      console.info(`[Chatbot] Session ${session.phone} is in Human Handoff. Automated reply silenced.`);
      return;
    }

    // Command shortcuts
    if (upperText === 'PRODUCTS' || upperText === 'SHOP') {
      await this.sendCatalogueMenu(session);
      return;
    }
    if (upperText === 'PAYMENT' || upperText === 'PAY') {
      await this.sendPaymentAssistance(session);
      return;
    }
    if (upperText === 'ORDER') {
      await this.sendOrderAssistance(session);
      return;
    }
    if (upperText.startsWith('TRACK')) {
      const parts = text.split(/\s+/);
      if (parts.length > 1 && parts[1]) {
        await this.handleOrderTracking(session, parts[1], firestoreOrdersFetcher);
        return;
      }
      session.currentStep = 'awaiting_order_id';
      await this.sendTrackingPrompt(session);
      return;
    }
    if (upperText === 'HELP' || upperText === 'SUPPORT' || upperText.includes('HUMAN') || upperText === 'AGENT') {
      await this.handleHumanHandoff(session);
      return;
    }

    // Numbered input (1 to 9)
    if (/^[1-9]$/.test(text)) {
      await this.handleNumberedOption(session, parseInt(text, 10), firestoreOrdersFetcher);
      return;
    }

    // If awaiting order number for tracking or alphanumeric order query
    if (session.currentStep === 'awaiting_order_id' || /^SJT-\d+/i.test(text) || /^\d{3,6}$/.test(text.replace('#', ''))) {
      const orderId = text.replace(/^#/, '').trim();
      await this.handleOrderTracking(session, orderId, firestoreOrdersFetcher);
      return;
    }

    // Check for common greetings
    const greetings = ['HI', 'HELLO', 'HEY', 'NAMASTE', 'START', 'GOOD MORNING', 'GOOD EVENING'];
    if (greetings.includes(upperText) || upperText.length <= 2) {
      await this.sendWelcome(session);
      return;
    }

    // Graceful invalid input fallback
    const isTe = session.language === 'te';
    const invalidHelp = isTe
      ? 'క్షమించండి, మీ సందేశం గుర్తించబడలేదు. దయచేసి 1 నుండి 7 నంబర్లలో ఒకదాన్ని ఎంచుకోండి లేదా సేవల జాబితా కోసం "MENU" అని టైప్ చేయండి.'
      : "Sorry, we didn't recognize that option. Please reply with a number from 1 to 7, or type 'MENU' for all services, or 'HUMAN' for human assistance.";
    await this.client.sendTextMessage(session.phone, invalidHelp, false);
  }

  /**
   * Welcome Message & Primary Interaction
   */
  async sendWelcome(session: UserSession): Promise<void> {
    const isTe = session.language === 'te';

    const welcomeBody = isTe
      ? '🌿 *SJT FARMS కి స్వాగతం* ☕\n*ప్రకృతి అందించే స్వచ్ఛమైన అమృతం*\n\nస్వాగతం! మా అరకు కాఫీ కలెక్షన్‌ను అన్వేషించడంలో మీకు సహాయం చేయడానికి మేము సంతోషిస్తున్నాము.\nఈ రోజు మేము మీకు ఏ విధంగా సహాయపడగలము?\n\nభాష మార్చడానికి "ENGLISH" అని టైప్ చేయండి.'
      : '🌿 *WELCOME TO SJT FARMS* ☕\n*Pure Goodness from Nature*\n\nWelcome! We\'re delighted to help you discover our Araku coffee collection.\nHow can we help you today?\n\nType "TELUGU" for Telugu.';

    const buttons = isTe
      ? [
          { id: 'btn_catalogue', title: 'Explore Coffee ☕' },
          { id: 'btn_menu', title: 'Main Menu (1-7) 📋' },
          { id: 'btn_track', title: 'Track My Order 📦' },
        ]
      : [
          { id: 'btn_catalogue', title: 'Explore Coffee ☕' },
          { id: 'btn_menu', title: 'Main Menu (1-7) 📋' },
          { id: 'btn_track', title: 'Track My Order 📦' },
        ];

    await this.client.sendInteractiveButtons(session.phone, welcomeBody, buttons, {
      headerText: isTe ? 'SJT FARMS Coffee' : 'SJT FARMS Coffee',
      footerText: isTe ? 'SJT Farms • Pure Goodness from Nature' : 'SJT Farms • Pure Goodness from Nature',
    });
  }

  /**
   * 7-Item Service List (Interactive List or Numbered Fallback)
   */
  async sendAllOptionsList(session: UserSession): Promise<void> {
    const isTe = session.language === 'te';

    const header = isTe ? 'SJT FARMS సేవల మెనూ' : 'SJT FARMS Service Menu';
    const body = isTe
      ? 'కింది 7 ఎంపికలలో ఒకదాన్ని ఎంచుకోండి లేదా 1 నుండి 7 నంబర్ టైప్ చేయండి:'
      : 'Please choose an option below or reply with a number (1–7):';

    const sections = [
      {
        title: isTe ? 'సేవలు' : 'Concierge Services',
        rows: isTe
          ? [
              { id: 'opt_1_explore', title: '1. Explore Coffee', description: '4 ప్రత్యేకమైన అరకు కాఫీ బ్లెండ్లు' },
              { id: 'opt_2_prices', title: '2. Prices & Pack Sizes', description: '50g, 100g, 250g జార్ల ధరలు' },
              { id: 'opt_3_track', title: '3. Track My Order', description: 'ఆర్డర్ నంబర్ తో లైవ్ స్టేటస్' },
              { id: 'opt_4_payment', title: '4. Payment Assistance', description: 'మాన్యువల్ UPI & UTR వెరిఫికేషన్' },
              { id: 'opt_5_shipping', title: '5. Shipping & Delivery', description: 'డెలివరీ సమయం & ఉచిత షిప్పింగ్' },
              { id: 'opt_6_refund', title: '6. Returns & Refunds', description: 'రిటర్న్ రిక్వెస్ట్ & రీఫండ్ పాలసీ' },
              { id: 'opt_7_human', title: '7. Talk to Our Team', description: 'అధికారిక కస్టమర్ కేర్ డెస్క్' },
            ]
          : [
              { id: 'opt_1_explore', title: '1. Explore Coffee', description: '4 authentic Araku valley blends' },
              { id: 'opt_2_prices', title: '2. Prices & Pack Sizes', description: '50g, 100g, 250g glass jar prices' },
              { id: 'opt_3_track', title: '3. Track My Order', description: 'Live order roasting & courier' },
              { id: 'opt_4_payment', title: '4. Payment Assistance', description: 'Manual UPI & UTR verification' },
              { id: 'opt_5_shipping', title: '5. Shipping & Delivery', description: 'Timelines & ₹799 free shipping' },
              { id: 'opt_6_refund', title: '6. Returns & Refunds', description: 'Return request & policy' },
              { id: 'opt_7_human', title: '7. Talk to Our Team', description: 'Connect with roastery concierge' },
            ],
      },
    ];

    await this.client.sendInteractiveList(
      session.phone,
      body,
      isTe ? 'మెనూ ఎంచుకోండి' : 'Select Option',
      sections,
      { headerText: header, footerText: 'SJT Farms Estate • +91 8121020111' }
    );
  }

  /**
   * Handle Numbered Option (1 to 7, with backward compatibility for 8 & 9)
   */
  private async handleNumberedOption(
    session: UserSession,
    optionNum: number,
    firestoreOrdersFetcher?: (orderId: string) => Promise<any>
  ): Promise<void> {
    switch (optionNum) {
      case 1:
        await this.sendCatalogueMenu(session);
        break;
      case 2:
        await this.sendPricesAndSizes(session);
        break;
      case 3:
        session.currentStep = 'awaiting_order_id';
        await this.sendTrackingPrompt(session);
        break;
      case 4:
        await this.sendPaymentAssistance(session);
        break;
      case 5:
        await this.sendShippingInformation(session);
        break;
      case 6:
        await this.sendCancellationInformation(session);
        break;
      case 7:
        await this.handleHumanHandoff(session);
        break;
      case 8:
        await this.sendCancellationInformation(session);
        break;
      case 9:
        await this.handleHumanHandoff(session);
        break;
      default:
        await this.sendAllOptionsList(session);
    }
  }

  private async routeButtonAction(session: UserSession, buttonId: string, firestoreOrdersFetcher?: (orderId: string) => Promise<any>): Promise<void> {
    if (buttonId.startsWith('pack_')) {
      await this.handlePackSizeSelection(session, buttonId);
      return;
    }
    if (buttonId === 'btn_catalogue') {
      await this.sendCatalogueMenu(session);
      return;
    }
    if (buttonId === 'btn_menu') {
      await this.sendAllOptionsList(session);
      return;
    }
    if (buttonId === 'btn_track') {
      session.currentStep = 'awaiting_order_id';
      await this.sendTrackingPrompt(session);
      return;
    }
    if (buttonId === 'btn_human') {
      await this.handleHumanHandoff(session);
      return;
    }
    await this.sendWelcome(session);
  }

  private async routeListAction(session: UserSession, listId: string, firestoreOrdersFetcher?: (orderId: string) => Promise<any>): Promise<void> {
    if (listId === 'opt_1_explore') return this.sendCatalogueMenu(session);
    if (listId === 'opt_2_prices') return this.sendPricesAndSizes(session);
    if (listId === 'opt_3_track' || listId === 'opt_6_track') {
      session.currentStep = 'awaiting_order_id';
      return this.sendTrackingPrompt(session);
    }
    if (listId === 'opt_4_payment' || listId === 'opt_5_payment') return this.sendPaymentAssistance(session);
    if (listId === 'opt_5_shipping' || listId === 'opt_7_shipping') return this.sendShippingInformation(session);
    if (listId === 'opt_6_refund' || listId === 'opt_8_refund') return this.sendCancellationInformation(session);
    if (listId === 'opt_7_human' || listId === 'opt_9_human') return this.handleHumanHandoff(session);
    if (listId === 'opt_3_recommend') return this.sendRecommendations(session);
    if (listId === 'opt_4_order') return this.sendOrderAssistance(session);

    if (listId.startsWith('prod_')) {
      const slug = listId.replace('prod_', '');
      await this.sendVariantSelectorForProduct(session, slug);
      return;
    }
  }

  /**
   * 1. Explore Products (Catalogue List)
   */
  async sendCatalogueMenu(session: UserSession): Promise<void> {
    const isTe = session.language === 'te';
    const header = isTe ? 'అరకు కాఫీ ఉత్పత్తులు' : 'Araku Coffee Collection';
    const body = isTe
      ? 'అరకు లోయలో సహజ సిద్ధంగా పండించిన మా 4 ప్రత్యేకమైన కాఫీ బ్లెండ్లను ఎంచుకోండి:'
      : 'Explore our 4 single-origin and heritage kaapi formulations from Araku Valley. Select a blend below:';

    const sections = [
      {
        title: isTe ? 'కాఫీ రకాలు' : 'Our Blends',
        rows: OFFICIAL_CATALOGUE.map((p) => ({
          id: `prod_${p.slug}`,
          title: p.name.length > 24 ? p.name.slice(0, 24) : p.name,
          description: `${p.blend} • 50g, 100g, 250g`,
        })),
      },
    ];

    await this.client.sendInteractiveList(session.phone, body, isTe ? 'రకాన్ని ఎంచుకోండి' : 'View Blend', sections, {
      headerText: header,
      footerText: 'SJT Farms • 100% Shade-Grown Kaapi',
    });
  }

  /**
   * 2. Check Prices and Pack Sizes
   */
  async sendPricesAndSizes(session: UserSession): Promise<void> {
    const isTe = session.language === 'te';
    let msg = isTe
      ? '☕ *SJT FARMS — అధీకృత ధరల జాబితా (అన్ని పన్నులతో కలిపి)*\n\n'
      : '☕ *SJT FARMS — Official Packaging & Pricing Catalogue*\n\n';

    for (const p of OFFICIAL_CATALOGUE) {
      msg += `*${p.name}* (${p.blend})\n`;
      for (const v of p.variants) {
        msg += `  • ${v.size} Glass Jar: ₹${v.price}\n`;
      }
      msg += `  🔗 ${this.config.storeUrl}/#product/${p.slug}\n\n`;
    }

    msg += isTe
      ? 'ఆర్డర్ చేయుటకు లేదా జార్ వివరాలు చూడటానికి పైన ఉన్న లింక్ ఉపయోగించండి. లేదా ప్యాక్ సైజ్ ఇక్కడ మెసేజ్ చేయండి.'
      : 'To order, visit the direct product links or reply with your chosen blend and pack size (50g, 100g, 250g).';

    await this.client.sendTextMessage(session.phone, msg, false);
  }

  /**
   * 3. Product Recommendations
   */
  async sendRecommendations(session: UserSession): Promise<void> {
    const isTe = session.language === 'te';
    const msg = isTe
      ? `💡 *మీ అభిరుచికి తగిన అరకు కాఫీని ఎలా ఎంచుకోవాలి?*\n\n` +
        `1. *సాంప్రదాయ స్ట్రాంగ్ ఫిల్టర్ కాఫీ ప్రియులకు:*\n` +
        `   👉 *Araku Premium* (70:30) — చిక్కని డికాక్షన్, రిచ్ నురుగు, బ్రాస్ ఫిల్టర్ కాఫీకి అద్భుతం.\n\n` +
        `2. *సమతుల్య అరోమా మరియు మీడియం స్ట్రెంత్ కోసం:*\n` +
        `   👉 *Araku Signature* (80:20) — చాక్లెట్ నోట్స్ మరియు సువాసనతో కూడిన క్లాసిక్ ఫిల్టర్ కాఫీ.\n\n` +
        `3. *స్వచ్ఛమైన కాఫీ కోరుకునే ప్యూరిస్టులకు (0% చికోరి):*\n` +
        `   👉 *Araku Special Blend* (100% అరేబికా) — బ్లాక్ కాఫీ, ఫ్రెంచ్ ప్రెస్ మరియు ఆర్గానిక్ ప్యూర్ కాఫీ.\n\n` +
        `4. *సులువైన మరియు తక్షణ తయారీ కోసం:*\n` +
        `   👉 *Araku Instant* (100% ప్యూర్ ఇన్స్టంట్) — వేడి నీరు లేదా పాలలో తక్షణమే కరిగిపోయే ప్రీమియం కాఫీ.\n\n` +
        `ఏ రకాన్ని ఆర్డర్ చేయాలనుకుంటున్నారో తెలియజేయండి!`
      : `💡 *SJT FARMS Coffee Flavor & Brewing Guide:*\n\n` +
        `1. *For Bold, Strong South Indian Filter Kaapi:*\n` +
        `   👉 *Araku Premium* (70% Arabica : 30% Chicory) — Heavy decoction, velvety golden crema, high caffeine presence.\n\n` +
        `2. *For Balanced, Aromatic Morning Filter Kaapi:*\n` +
        `   👉 *Araku Signature* (80% Arabica : 20% Chicory) — Smooth roasted hazelnut and dark chocolate undertones.\n\n` +
        `3. *For Pure Single-Origin Connoisseurs (Zero Chicory):*\n` +
        `   👉 *Araku Special Blend* (100% Pure Arabica) — Silky golden crema, ideal for pour-over, moka pot, or pure filter.\n\n` +
        `4. *For Instant Convenience without Compromise:*\n` +
        `   👉 *Araku Instant Coffee Powder* (100% Pure Arabica) — Micro-granules dissolving smoothly in hot milk or water.\n\n` +
        `Reply with the blend name or number to view pack sizes!`;

    await this.client.sendTextMessage(session.phone, msg, true);
  }

  /**
   * 4. Place or Complete an Order
   */
  async sendOrderAssistance(session: UserSession): Promise<void> {
    const isTe = session.language === 'te';
    const storeUrl = `${this.config.storeUrl}/shop`;
    const msg = isTe
      ? `🛍️ *ఆర్డర్ నమోదు మరియు షాపింగ్ సహాయం*\n\n` +
        `SJT Farms అధికారిక వెబ్‌సైట్ ద్వారా సురక్షితంగా ఆర్డర్ చేయవచ్చు:\n` +
        `🔗 ${storeUrl}\n\n` +
        `• 50g, 100g, 250g జార్లను కార్ట్‌కు జోడించండి.\n` +
        `• ₹799 కంటే ఎక్కువ ఆర్డర్లపై ఉచిత షిప్పింగ్ లభిస్తుంది.\n` +
        `• డైరెక్ట్ UPI ద్వారా చెల్లించవచ్చు.\n\n` +
        `వాట్సాప్ ద్వారా ఆర్డర్ చేయాలనుకుంటే మీ చిరునామా మరియు కావాల్సిన ప్యాక్ సైజ్ ఇక్కడ పంపండి.`
      : `🛍️ *How to Place an Order with SJT FARMS:*\n\n` +
        `You can place orders through our official website with real-time inventory and delivery tracking:\n` +
        `🔗 ${storeUrl}\n\n` +
        `• Select 50g, 100g, or 250g glass jars.\n` +
        `• Free India-wide express shipping on orders over ₹799.\n` +
        `• Direct UPI payment with bank UTR verification.\n\n` +
        `To order directly on WhatsApp, reply with your product choice, pack size, and shipping address.`;

    await this.client.sendTextMessage(session.phone, msg, true);
  }

  /**
   * 5. Payment Assistance with Strict Verification Safeguards
   */
  async sendPaymentAssistance(session: UserSession): Promise<void> {
    const isTe = session.language === 'te';
    const msg = isTe
      ? `💳 *UPI పేమెంట్ మరియు UTR వెరిఫికేషన్ విధానం*\n\n` +
        `SJT Farms ఆర్డర్లకు డైరెక్ట్ UPI ద్వారా చెల్లించవచ్చు. ఆర్డర్ నమోదు చేసిన తర్వాత మీ UPI యాప్‌లోని 12-అంకెల UTR / ట్రాన్సాక్షన్ నంబర్‌ను వెబ్‌సైట్ చెక్‌అవుట్ లేదా ట్రాకింగ్ పేజీలో సమర్పించండి.\n\n` +
        `*ముఖ్యమైన భద్రతా నియమాలు:*\n` +
        `1. UTR సమర్పించిన తర్వాత ఆర్డర్ "Payment Pending Verification" లో ఉంటుంది.\n` +
        `2. మా అధికారిక బ్యాంక్ నిర్వాహకులు బ్యాంక్ స్టేట్‌మెంట్‌తో సరిచూసిన తర్వాత మాత్రమే ఆర్డర్ "Paid" గా మార్క్ చేయబడుతుంది.\n` +
        `3. వాట్సాప్ మెసేజ్ లేదా స్క్రీన్‌షాట్ పంపినంత మాత్రాన ఆర్డర్ పేమెంట్ పూర్తయినట్లు భావించబడదు.\n` +
        `4. SJT Farms ఎప్పుడూ UPI పిన్ (PIN), OTP, లేదా బ్యాంకింగ్ పాస్‌వర్డ్‌లను అడగదు. ఎవరితోనూ పంచుకోవద్దు.`
      : `💳 *Manual UPI Payment & Verification Policy*\n\n` +
        `Orders on SJT Farms can be paid via Direct UPI. After completing payment in your UPI app (GPay, PhonePe, Paytm, BHIM), submit your 12-digit UTR transaction reference on our website.\n\n` +
        `*Strict Security Rules:*\n` +
        `1. After UTR submission, your order is placed in "Payment Pending Verification" status.\n` +
        `2. Only an authorized administrator reconciles the transaction against actual bank records before confirming payment.\n` +
        `3. Orders are NEVER marked paid merely because a WhatsApp message, screenshot, or UTR was received.\n` +
        `4. SJT Farms will NEVER ask for your UPI PIN, OTP, or passwords. Never disclose your PIN to anyone.`;

    await this.client.sendTextMessage(session.phone, msg, false);
  }

  /**
   * 6. Tracking Prompt & Order Lookup with Customer Ownership Verification
   */
  async sendTrackingPrompt(session: UserSession): Promise<void> {
    const isTe = session.language === 'te';
    const msg = isTe
      ? `📦 *ఆర్డర్ ట్రాకింగ్*\n\nదయచేసి మీ ఆర్డర్ నంబర్ (ఉదా: 101 లేదా SJT-101) ఇక్కడ టైప్ చేయండి.\n\nలేదా మా వెబ్‌సైట్ ట్రాకింగ్ పోర్టల్‌లో లైవ్ స్టేటస్ చూడవచ్చు:\n🔗 ${this.config.storeUrl}/#track-order`
      : `📦 *Live Order Tracking*\n\nPlease reply with your Order Number (e.g. 101 or SJT-101) to check live roasting and dispatch progress.\n\nOr track online anytime:\n🔗 ${this.config.storeUrl}/#track-order`;

    await this.client.sendTextMessage(session.phone, msg, true);
  }

  async handleOrderTracking(session: UserSession, orderId: string, firestoreOrdersFetcher?: (id: string) => Promise<any>): Promise<void> {
    session.currentStep = 'menu';
    const isTe = session.language === 'te';

    if (!firestoreOrdersFetcher) {
      // Offline / unconfigured Firestore fallback
      const trackingUrl = `${this.config.storeUrl}/#track-order?order=${encodeURIComponent(orderId)}`;
      const msg = isTe
        ? `📦 *ఆర్డర్ #${orderId} ట్రాకింగ్*\n\nమీ ఆర్డర్ లైవ్ డెలివరీ స్థితిని మా పోర్టల్‌లో చూడవచ్చు:\n🔗 ${trackingUrl}`
        : `📦 *Order #${orderId} Tracking*\n\nView live status and courier details on our secure portal:\n🔗 ${trackingUrl}`;
      await this.client.sendTextMessage(session.phone, msg, true);
      return;
    }

    try {
      const order = await firestoreOrdersFetcher(orderId);
      if (!order) {
        const notFound = isTe
          ? `❌ ఆర్డర్ #${orderId} కనుగొనబడలేదు. దయచేసి సరైన నంబర్ నమోదు చేయండి లేదా వెబ్‌సైట్ ట్రాకింగ్ పోర్టల్ చూడండి:\n${this.config.storeUrl}/#track-order`
          : `❌ Order #${orderId} could not be found. Please check your order number or visit our tracking portal:\n${this.config.storeUrl}/#track-order`;
        await this.client.sendTextMessage(session.phone, notFound, true);
        return;
      }

      // Customer Ownership Verification:
      // Verify sender's phone matches the phone stored on the order
      const senderDigits = session.phone.replace(/\D/g, '').slice(-10);
      const orderPhoneDigits = (order.phone || order.customer?.phone || '').replace(/\D/g, '').slice(-10);

      const isOwner = Boolean(senderDigits && orderPhoneDigits && senderDigits === orderPhoneDigits);

      if (!isOwner) {
        // Redacted output: do not leak customer full name, street address, or email to unauthorized phone
        const redactedMsg = isTe
          ? `📦 *ఆర్డర్ #${order.orderNumber || orderId}*\n\nస్టేటస్: *${order.orderStatus || 'Processing'}*\nపేమెంట్ స్థితి: *${order.paymentVerificationStatus || order.paymentStatus || 'Pending'}*\n\nవ్యక్తిగత భద్రత దృష్ట్యా పూర్తి చిరునామా దాచబడింది. మీ ఖాతా లేదా అధికారిక ట్రాకింగ్ పోర్టల్ ద్వారా చూడండి:\n🔗 ${this.config.storeUrl}/#track-order?order=${order.orderNumber || orderId}`
          : `📦 *Order #${order.orderNumber || orderId}*\n\nStatus: *${order.orderStatus || 'Processing'}*\nPayment: *${order.paymentVerificationStatus || order.paymentStatus || 'Pending'}*\n\nFor privacy, detailed delivery address is hidden on unverified phone numbers. Access full details on the official tracking portal:\n🔗 ${this.config.storeUrl}/#track-order?order=${order.orderNumber || orderId}`;
        await this.client.sendTextMessage(session.phone, redactedMsg, true);
        return;
      }

      // Verified Owner Output
      const itemsStr = (order.items || [])
        .map((i: any) => `• ${i.name || i.product?.name} (${i.selectedWeight || '100g'}) × ${i.quantity || 1}`)
        .join('\n');

      const fullMsg = isTe
        ? `📦 *ఆర్డర్ #${order.orderNumber || orderId} వివరాలు (ధృవీకరించబడింది)*\n\n` +
          `కస్టమర్: ${order.customerName || order.customer?.fullName}\n` +
          `ఆర్డర్ స్థితి: *${order.orderStatus || 'Processing'}*\n` +
          `పేమెంట్ స్థితి: *${order.paymentVerificationStatus || order.paymentStatus || 'Pending'}*\n` +
          `మొత్తం: ₹${order.totalAmount || order.total}\n\n` +
          `వస్తువులు:\n${itemsStr}\n\n` +
          (order.courierTrackingId ? `కొరియర్: ${order.courierName || 'Express'} (ట్రాకింగ్ నంబర్: ${order.courierTrackingId})\n\n` : '') +
          `లైవ్ ట్రాకింగ్ లింక్:\n🔗 ${this.config.storeUrl}/#track-order?order=${order.orderNumber || orderId}`
        : `📦 *Order #${order.orderNumber || orderId} Details (Verified)*\n\n` +
          `Customer: ${order.customerName || order.customer?.fullName}\n` +
          `Order Status: *${order.orderStatus || 'Processing'}*\n` +
          `Payment Status: *${order.paymentVerificationStatus || order.paymentStatus || 'Pending'}*\n` +
          `Total Amount: ₹${order.totalAmount || order.total}\n\n` +
          `Items:\n${itemsStr}\n\n` +
          (order.courierTrackingId ? `Courier: ${order.courierName || 'Express'} (${order.courierTrackingId})\n\n` : '') +
          `Live Portal Tracking:\n🔗 ${this.config.storeUrl}/#track-order?order=${order.orderNumber || orderId}`;

      await this.client.sendTextMessage(session.phone, fullMsg, true);
    } catch (err: any) {
      console.error('[Chatbot] Order tracking error:', err.message);
      await this.client.sendTextMessage(session.phone, `Could not retrieve order details. Please check ${this.config.storeUrl}/#track-order`, true);
    }
  }

  /**
   * 7. Shipping and Delivery Questions
   */
  async sendShippingInformation(session: UserSession): Promise<void> {
    const isTe = session.language === 'te';
    const msg = isTe
      ? `🚚 *షిప్పింగ్ & డెలివరీ విధానం*\n\n` +
        `• *ఉచిత షిప్పింగ్:* ₹799 కంటే ఎక్కువ మొత్తం గల ఆర్డర్లపై భారతదేశమంతటా ఉచిత షిప్పింగ్.\n` +
        `• *స్టాండర్డ్ డెలివరీ ఛార్జీ:* ₹799 లోపు ఆర్డర్లకు కేవలం ₹60.\n` +
        `• *డిస్పాచ్ సమయం:* ఆర్డర్ ధృవీకరించబడిన 24 గంటలలోపు రోస్టరీ నుండి ఎక్స్‌ప్రెస్ కొరియర్ ద్వారా పంపబడుతుంది.\n` +
        `• *డెలివరీ వ్యవధి:* మెట్రో నగరాల్లో 2–3 రోజులు; ఇతర ప్రాంతాల్లో 3–5 వ్యాపార రోజులు.\n` +
        `• *ప్యాకేజింగ్:* సురక్షితమైన, సీల్డ్ గ్లాస్ జార్లు.\n\n` +
        `మరిన్ని వివరాలకు మా FAQ పేజీని సందర్శించండి:\n🔗 ${this.config.storeUrl}/faq`
      : `🚚 *Shipping & Delivery Information*\n\n` +
        `• *Free Delivery Threshold:* Free express courier across India on orders over ₹799.\n` +
        `• *Standard Shipping Charge:* Flat ₹60 for orders under ₹799.\n` +
        `• *Dispatch Timeline:* Freshly roasted and dispatched within 24 hours of payment verification.\n` +
        `• *Transit Times:* 2–3 business days for major cities; 3–5 days for other locations.\n` +
        `• *Packaging:* Sealed aroma-lock glass jars with multi-layer protective packaging.\n\n` +
        `For more questions, visit our FAQ:\n🔗 ${this.config.storeUrl}/faq`;

    await this.client.sendTextMessage(session.phone, msg, true);
  }

  /**
   * 8. Cancellation and Refund Assistance
   */
  async sendCancellationInformation(session: UserSession): Promise<void> {
    const isTe = session.language === 'te';
    const msg = isTe
      ? `↩️ *ఆర్డర్ రద్దు & రీఫండ్ విధానం*\n\n` +
        `• *రద్దు సమయం:* రోస్టరీ నుండి ఆర్డర్ డిస్పాచ్ కావడానికి ముందే మీరు ఆర్డర్‌ను రద్దు చేసుకోవచ్చు.\n` +
        `• *రీఫండ్ ప్రక్రియ:* రద్దు ధృవీకరించబడిన తర్వాత మీ అసలు UPI అకౌంట్‌కు 3–5 బ్యాంకు పనిదినాల్లో నగదు జమ చేయబడుతుంది.\n` +
        `• *డ్యామేజ్ లేదా సమస్యలు:* పార్సిల్ పాడైతే ఫోటోలతో సహా మాకు తెలియజేస్తే వెంటనే రీప్లేస్‌మెంట్ పంపబడుతుంది.\n\n` +
        `ఆర్డర్ రద్దు కోసం మీ ఆర్డర్ నంబర్‌ను ఇక్కడ పంపండి లేదా మా సపోర్ట్ డెస్క్‌ను సంప్రదించండి.`
      : `↩️ *Cancellation & Refund Policy*\n\n` +
        `• *Cancellation Window:* You may cancel an order before it is dispatched from our Araku roastery.\n` +
        `• *Refund Processing:* Approved refunds are credited directly to your originating UPI account within 3–5 business days.\n` +
        `• *Damaged Shipments:* In the rare event of transit damage, share a photo with our desk for an immediate replacement.\n\n` +
        `To request cancellation, please reply with your Order Number or tap "Talk to a Human".`;

    await this.client.sendTextMessage(session.phone, msg, false);
  }

  /**
   * 9. Talk to a Human / Human Handoff
   */
  async handleHumanHandoff(session: UserSession): Promise<void> {
    session.isHandoff = true;
    session.currentStep = 'human_handoff';
    const isTe = session.language === 'te';

    const msg = isTe
      ? `📞 *అరకు రోస్టరీ కస్టమర్ కేర్ డెస్క్*\n\n` +
        `మీ సందేశం మా కస్టమర్ కేర్ ఎగ్జిక్యూటివ్‌కు పంపబడింది. మా సిబ్బంది త్వరలో మిమ్మల్ని సంప్రదిస్తారు.\n\n` +
        `• పనివేళలు: సోమవారం – శనివారం, ఉదయం 9:00 నుండి సాయంత్రం 6:00 IST\n` +
        `• అధికారిక ఫోన్ / వాట్సాప్: +91 8121020111\n\n` +
        `దయచేసి మీ సందేహం లేదా ఆర్డర్ వివరాలు ఇక్కడ టైప్ చేయండి.\n(ఆటోమేటెడ్ బాట్ మెనూను తిరిగి చూడటానికి "MENU" అని టైప్ చేయండి).`
      : `📞 *SJT FARMS Human Roastery Concierge*\n\n` +
        `Your request has been routed to our human support desk. A team member will assist you shortly.\n\n` +
        `• Roastery Desk Hours: Mon – Sat, 9:00 AM – 6:00 PM IST\n` +
        `• Official Phone / WhatsApp: +91 8121020111\n\n` +
        `Please type your requirement or question here.\n(Type "MENU" at any time to return to the automated assistant).`;

    await this.client.sendTextMessage(session.phone, msg, false);
  }

  /**
   * Sub-flow: Send 3-Button Pack Size Selector for Selected Product
   */
  async sendVariantSelectorForProduct(session: UserSession, slug: string): Promise<void> {
    const product = OFFICIAL_CATALOGUE.find((p) => p.slug === slug);
    if (!product) return;

    const isTe = session.language === 'te';
    const header = product.name.slice(0, 60);
    const body = isTe
      ? `☕ *${product.name}*\n${product.blend}\n\nదయచేసి గ్లాస్ జార్ ప్యాక్ సైజ్ ఎంచుకోండి:`
      : `☕ *${product.name}*\n${product.blend}\n\nPlease select your glass jar pack size:`;

    const buttons = product.variants.map((v) => ({
      id: `pack_${product.slug}_${v.size}`,
      title: `${v.size} — ₹${v.price}`.slice(0, 20),
    }));

    await this.client.sendInteractiveButtons(session.phone, body, buttons, {
      headerText: header,
      footerText: 'SJT Farms Estate Packaging',
    });
  }

  /**
   * Sub-flow: Handle Pack Size Button Selection
   */
  private async handlePackSizeSelection(session: UserSession, buttonId: string): Promise<void> {
    const parts = buttonId.replace('pack_', '').split('_');
    const size = parts.pop() || '100g';
    const slug = parts.join('_');

    const product = OFFICIAL_CATALOGUE.find((p) => p.slug === slug);
    if (!product) return;

    const variant = product.variants.find((v) => v.size === size) || product.variants[1];
    const isTe = session.language === 'te';
    const canonicalUrl = `${this.config.storeUrl}/#product/${product.slug}?variant=${encodeURIComponent(variant.size)}`;

    const text = isTe
      ? `☕ *${product.name}*\n\n` +
        `ఎంచుకున్న ప్యాక్ సైజ్: *${variant.size}*\n` +
        `ధర: *₹${variant.price}* (అన్ని పన్నులతో కలిపి)\n\n` +
        `ఈ ఉత్పత్తి అధికారిక వెబ్‌సైట్ లింక్ మరియు జార్ ఫోటో:\n🔗 ${canonicalUrl}\n\n` +
        `వెబ్‌సైట్‌లో కార్ట్‌కు జోడించి సులభంగా చెక్అవుట్ చేయవచ్చు. లేదా వాట్సాప్ ద్వారా ఆర్డర్ చేయుటకు మీ పూర్తి చిరునామా ఇక్కడ పంపండి.`
      : `☕ *${product.name}*\n\n` +
        `Selected Size: *${variant.size}*\n` +
        `Catalogue Price: *₹${variant.price}* (Includes all taxes)\n\n` +
        `Official Product Link & Packaging Preview:\n🔗 ${canonicalUrl}\n\n` +
        `Add to cart on our website for instant checkout, or reply with your shipping address to place the order via WhatsApp concierge.`;

    if (this.config.storeUrl.startsWith('https://')) {
      const imageUrl = `${this.config.storeUrl}${variant.jarAsset}`;
      await this.client.sendImageMessage(session.phone, imageUrl, `${product.name} (${variant.size}) — ₹${variant.price}`);
    }

    await this.client.sendTextMessage(session.phone, text, true);
  }
}
