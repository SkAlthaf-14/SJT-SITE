/**
 * SJT FARMS — INTERACTIVE WHATSAPP CUSTOMER CONCIERGE SIMULATOR
 * 
 * Luxury WhatsApp Web / Business-style interactive application:
 * - 7 Core Interactive Menu Flows
 * - Bilingual English & Telugu
 * - Real product catalogue with authentic glass jar assets & variant price sync
 * - Real order tracking with customer verification & privacy safeguards
 * - Manual UPI payment assistance with strict PIN/OTP security notices
 * - Shipping calculator (₹60 flat / Free above ₹799)
 * - Returns & Refunds service (Initiate, Status, Policy)
 * - Human support ticket generation & handoff mode
 * - Integrated with CartContext & NavigationContext
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Coffee,
  Package,
  CreditCard,
  Truck,
  RotateCcw,
  Headphones,
  Home,
  ArrowLeft,
  Check,
  CheckCheck,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  ShoppingBag,
  Sparkles,
  Info,
  Clock,
  ChevronRight,
  RefreshCw,
  PhoneCall,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import { PRODUCTS, getDefaultProductVariant, getProductVariantJarImage } from '../../data/products';
import { useCart } from '../../context/CartContext';
import { useNavigation } from '../../context/NavigationContext';
import { getOrderByLookup } from '../../services/orders';
import type { OrderDetails } from '../../types';
import { initiateReturnRequest, checkReturnStatus, ReturnRequest } from '../../services/returns';
import { submitContactForm } from '../../services/contacts';
import { SITE_CONFIG } from '../../data/siteConfig';

export type ConciergeLang = 'en' | 'te';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user' | 'system';
  timestamp: string;
  text?: string;
  type?: 'text' | 'menu' | 'products' | 'prices' | 'track_form' | 'order_card' | 'payment_info' | 'shipping_info' | 'returns_menu' | 'return_form' | 'return_status_form' | 'return_card' | 'handoff_form' | 'handoff_active';
  buttons?: { label: string; actionId: string; variant?: 'primary' | 'secondary' | 'accent' | 'danger' }[];
  data?: any;
}

export const WhatsAppConciergeChat: React.FC<{
  isOpenInModal?: boolean;
  onClose?: () => void;
}> = ({ isOpenInModal = false, onClose }) => {
  const { addItem } = useCart();
  const { navigateTo } = useNavigation();

  const [language, setLanguage] = useState<ConciergeLang>(() => {
    try {
      return (localStorage.getItem('sjt_concierge_lang') as ConciergeLang) || 'en';
    } catch {
      return 'en';
    }
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isHandoffMode, setIsHandoffMode] = useState(false);

  // Form states inside chat
  const [trackOrderId, setTrackOrderId] = useState('');
  const [trackContact, setTrackContact] = useState('');
  const [trackError, setTrackError] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);

  // Return form state
  const [returnOrderId, setReturnOrderId] = useState('');
  const [returnContact, setReturnContact] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [returnError, setReturnError] = useState('');
  const [returnLoading, setReturnLoading] = useState(false);

  // Return status query
  const [returnStatusQuery, setReturnStatusQuery] = useState('');
  const [returnStatusError, setReturnStatusError] = useState('');
  const [returnStatusLoading, setReturnStatusLoading] = useState(false);

  // Human ticket form
  const [ticketName, setTicketName] = useState('');
  const [ticketContact, setTicketContact] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketError, setTicketError] = useState('');
  const [ticketLoading, setTicketLoading] = useState(false);

  // Product selection variant states: { [slug]: selectedPackSize }
  const [productVariants, setProductVariants] = useState<Record<string, string>>({
    'araku-instant-coffee-powder': '100g',
    'araku-special-blend-filter-coffee': '100g',
    'araku-signature-coffee': '100g',
    'araku-premium-coffee': '100g',
  });

  // Track added to cart feedback
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isTyping]);

  // Persist language
  const handleLanguageToggle = (lang: ConciergeLang) => {
    setLanguage(lang);
    try {
      localStorage.setItem('sjt_concierge_lang', lang);
    } catch {}
    
    // Add language changed message and re-render main menu
    pushBotMessage(
      lang === 'te'
        ? 'నమస్కారం! భాష తెలుగుగా మార్చబడింది. 🌿☕'
        : 'Language switched to English. 🌿☕',
      () => sendMainMenu(lang)
    );
  };

  const getNowTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper to push bot message with realistic micro-typing indicator
  const pushBotMessage = (text: string, callback?: () => void, delayMs = 450) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}-${Math.random()}`,
          sender: 'bot',
          timestamp: getNowTime(),
          type: 'text',
          text,
        },
      ]);
      if (callback) callback();
    }, delayMs);
  };

  // -------------------------------------------------------------
  // Initial Greeting & Main Menu
  // -------------------------------------------------------------
  const sendMainMenu = (lang = language) => {
    const isTe = lang === 'te';

    const greetingText = isTe
      ? `🌿 *SJT FARMS కు స్వాగతం* ☕\n*ప్రకృతి నుండి స్వచ్ఛమైన అరకు కాఫీ*\n\nస్వాగతం! మా ప్రత్యేకమైన అరకు కాఫీ ఉత్పత్తులను తెలుసుకోవడానికి మీకు సహాయం చేయడానికి మేము సంతోషిస్తున్నాము.\nఈ రోజు మీకు ఏ విధంగా సహాయపడగలము?`
      : `🌿 *WELCOME TO SJT FARMS* ☕\n*Pure Goodness from Nature*\n\nWelcome! We're delighted to help you discover our Araku coffee collection.\nHow can we help you today?`;

    const buttons = isTe
      ? [
          { label: '☕ కాఫీ ఉత్పత్తులు (Explore)', actionId: 'menu_explore', variant: 'primary' as const },
          { label: '🏷️ ధరలు & ప్యాక్ సైజులు', actionId: 'menu_prices' },
          { label: '📦 నా ఆర్డర్ ట్రాక్ చేయండి', actionId: 'menu_track', variant: 'accent' as const },
          { label: '💳 పేమెంట్ సహాయం (UPI)', actionId: 'menu_payment' },
          { label: '🚚 షిప్పింగ్ & డెలివరీ', actionId: 'menu_shipping' },
          { label: '↩️ రిటర్న్స్ & రీఫండ్స్', actionId: 'menu_returns' },
          { label: '📞 మా టీమ్‌తో మాట్లాడండి', actionId: 'menu_team', variant: 'secondary' as const },
        ]
      : [
          { label: '☕ Explore Coffee', actionId: 'menu_explore', variant: 'primary' as const },
          { label: '🏷️ Prices & Pack Sizes', actionId: 'menu_prices' },
          { label: '📦 Track My Order', actionId: 'menu_track', variant: 'accent' as const },
          { label: '💳 Payment Assistance', actionId: 'menu_payment' },
          { label: '🚚 Shipping & Delivery', actionId: 'menu_shipping' },
          { label: '↩️ Returns & Refunds', actionId: 'menu_returns' },
          { label: '📞 Talk to Our Team', actionId: 'menu_team', variant: 'secondary' as const },
        ];

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `menu-${Date.now()}`,
          sender: 'bot',
          timestamp: getNowTime(),
          type: 'menu',
          text: greetingText,
          buttons,
        },
      ]);
    }, 400);
  };

  // Reset conversation to initial state
  const resetChat = () => {
    setIsHandoffMode(false);
    setMessages([]);
    sendMainMenu();
  };

  useEffect(() => {
    if (messages.length === 0) {
      sendMainMenu();
    }
  }, []);

  // -------------------------------------------------------------
  // Flow 1: Explore Coffee (Catalogue)
  // -------------------------------------------------------------
  const handleExploreCoffee = () => {
    const isTe = language === 'te';
    const introText = isTe
      ? `మా అరకు కాఫీ రకాలను పరిశీలించండి. అరకు లోయలో 3,800+ అడుగుల ఎత్తులో సహజ నీడలో పండించిన ప్రీమియం కాఫీ గింజలతో తాజా బ్యాచ్‌లుగా రోస్ట్ చేయబడింది:`
      : `Here is our signature Araku Valley coffee collection. Shade-grown at 3,800+ ft in the Eastern Ghats and small-batch artisan roasted for rich crema and velvety aroma. Select a blend below to view details and order:`;

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `products-${Date.now()}`,
          sender: 'bot',
          timestamp: getNowTime(),
          type: 'products',
          text: introText,
          buttons: [
            { label: '🏷️ View Full Price List', actionId: 'menu_prices' },
            { label: '🏠 Main Menu', actionId: 'menu_main' },
          ],
        },
      ]);
    }, 500);
  };

  // -------------------------------------------------------------
  // Flow 2: Prices & Pack Sizes
  // -------------------------------------------------------------
  const handlePricesAndPackSizes = () => {
    const isTe = language === 'te';
    const priceText = isTe
      ? `☕ *SJT FARMS — అధీకృత ధరల జాబితా (అన్ని పన్నులతో కలిపి)*\nమా గ్లాస్ జార్లు సురక్షితమైన ఆర్మా-లాక్ సీలింగ్‌తో లభిస్తాయి. మీ అవసరమైన పరిమాణాన్ని ఎంచుకోండి:`
      : `☕ *SJT FARMS — Official Packaging & Price Matrix*\nAll coffees are hermetically sealed in protective glass jars to preserve delicate aromatic oils. Choose your size below:`;

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `prices-${Date.now()}`,
          sender: 'bot',
          timestamp: getNowTime(),
          type: 'prices',
          text: priceText,
          buttons: [
            { label: '☕ Explore Blends in Detail', actionId: 'menu_explore' },
            { label: '🏠 Main Menu', actionId: 'menu_main' },
          ],
        },
      ]);
    }, 500);
  };

  // -------------------------------------------------------------
  // Flow 3: Track My Order
  // -------------------------------------------------------------
  const handleTrackMyOrder = () => {
    const isTe = language === 'te';
    const trackIntro = isTe
      ? `📦 *ఆర్డర్ ట్రాకింగ్ డెస్క్*\nమీ ఆర్డర్ నంబర్ మరియు గోప్యతా ధృవీకరణ కోసం రిజిస్టర్డ్ ఫోన్ లేదా ఈమెయిల్ నమోదు చేయండి:`
      : `📦 *Live Order Tracking*\nPlease enter your Order ID (e.g. 101, #101, or SJT-101) and your registered email or 10-digit mobile number to verify access:`;

    setTrackOrderId('');
    setTrackContact('');
    setTrackError('');

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `track-form-${Date.now()}`,
          sender: 'bot',
          timestamp: getNowTime(),
          type: 'track_form',
          text: trackIntro,
          buttons: [{ label: '🏠 Main Menu', actionId: 'menu_main' }],
        },
      ]);
    }, 450);
  };

  const submitTrackOrder = async (orderIdVal: string, contactVal: string) => {
    const cleanId = orderIdVal.trim();
    const cleanContact = contactVal.trim();

    if (!cleanId) {
      setTrackError(language === 'te' ? 'దయచేసి ఆర్డర్ నంబర్ నమోదు చేయండి.' : 'Please enter your Order ID (e.g. 101 or #101).');
      return;
    }
    if (!cleanContact) {
      setTrackError(language === 'te' ? 'దయచేసి రిజిస్టర్డ్ మొబైల్ లేదా ఈమెయిల్ నమోదు చేయండి.' : 'Please enter your registered phone or email for privacy verification.');
      return;
    }

    setTrackLoading(true);
    setTrackError('');

    try {
      const res = await getOrderByLookup(cleanId, cleanContact);
      setTrackLoading(false);

      if (res.success && res.order) {
        setMessages((prev) => [
          ...prev,
          {
            id: `order-card-${Date.now()}`,
            sender: 'bot',
            timestamp: getNowTime(),
            type: 'order_card',
            data: res.order,
            buttons: [
              { label: '💳 Payment / UTR Assistance', actionId: 'menu_payment' },
              { label: '↩️ Returns / Replacements', actionId: 'menu_returns' },
              { label: '🏠 Main Menu', actionId: 'menu_main' },
            ],
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `order-not-found-${Date.now()}`,
            sender: 'bot',
            timestamp: getNowTime(),
            type: 'text',
            text: language === 'te'
              ? `❌ *ఆర్డర్ కనుగొనబడలేదు లేదా ధృవీకరణ విఫలమైంది*\n\n${res.message || 'నమోదు చేసిన వివరాలు మా రికార్డులతో సరిపోలలేదు.'}\n\nదయచేసి మీ ఆర్డర్ రసీదును పరిశీలించి మళ్లీ ప్రయత్నించండి లేదా మా కస్టమర్ కేర్ బృందాన్ని సంప్రదించండి.`
              : `❌ *Order Not Found or Verification Failed*\n\n${res.message || 'The provided contact details did not match this order reference.'}\n\nPlease check your checkout receipt and try again, or speak with our concierge team.`,
            buttons: [
              { label: '🔄 Try Again', actionId: 'menu_track' },
              { label: '📞 Talk to Our Team', actionId: 'menu_team' },
              { label: '🏠 Main Menu', actionId: 'menu_main' },
            ],
          },
        ]);
      }
    } catch (err: any) {
      setTrackLoading(false);
      setTrackError(err?.message || 'An error occurred while querying the order.');
    }
  };

  // -------------------------------------------------------------
  // Flow 4: Payment Assistance (Manual UPI)
  // -------------------------------------------------------------
  const handlePaymentAssistance = () => {
    const isTe = language === 'te';
    const payText = isTe
      ? `💳 *SJT FARMS — మాన్యువల్ UPI పేమెంట్ మార్గదర్శకాలు*\n\nమా ఖాతా బృందం ప్రతి UPI చెల్లింపును నేరుగా బ్యాంక్ స్టేట్‌మెంట్‌తో సరిచూసి ధృవీకరిస్తుంది.`
      : `💳 *SJT FARMS — Official Manual UPI Payment Guide*\n\nTo keep our shade-grown Araku coffee accessible and free of gateway transaction surcharges, all payments are processed through direct merchant UPI and reconciled with bank statements.`;

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `payment-info-${Date.now()}`,
          sender: 'bot',
          timestamp: getNowTime(),
          type: 'payment_info',
          text: payText,
          buttons: [
            { label: '📦 Track My Order Status', actionId: 'menu_track' },
            { label: '📞 Help from Support Desk', actionId: 'menu_team' },
            { label: '🏠 Main Menu', actionId: 'menu_main' },
          ],
        },
      ]);
    }, 450);
  };

  // -------------------------------------------------------------
  // Flow 5: Shipping & Delivery
  // -------------------------------------------------------------
  const handleShippingAndDelivery = () => {
    const isTe = language === 'te';
    const shipText = isTe
      ? `🚚 *షిప్పింగ్ & డెలివరీ విధానం*\n\n• *ఉచిత షిప్పింగ్:* ₹${SITE_CONFIG.shipping.freeShippingThreshold} కంటే ఎక్కువ ఆర్డర్లపై భారతదేశమంతటా ఉచిత డెలివరీ.\n• *స్టాండర్డ్ షిప్పింగ్ ఛార్జ్:* ₹${SITE_CONFIG.shipping.standardDeliveryFee} ఫ్లాట్ ఛార్జ్ (₹${SITE_CONFIG.shipping.freeShippingThreshold} లోపు ఆర్డర్లకు).\n• *డిస్పాచ్ సమయం:* ఆర్డర్ ధృవీకరించబడిన 24 గంటలలోపు రోస్టరీ నుండి ఎక్స్‌ప్రెస్ కొరియర్ ద్వారా పంపబడుతుంది.\n• *డెలివరీ వ్యవధి:* మెట్రో నగరాల్లో 2–3 రోజులు; ఇతర ప్రాంతాల్లో 3–5 వ్యాపార రోజులు.\n• *ప్యాకేజింగ్:* సురక్షితమైన, సీల్డ్ గ్లాస్ జార్లు బబుల్-కుషన్ రక్షణతో ప్యాక్ చేయబడతాయి.`
      : `🚚 *Shipping & Delivery Information*\n\n• *Free Shipping Threshold:* Complimentary Express Delivery across India on all orders over ₹${SITE_CONFIG.shipping.freeShippingThreshold}.\n• *Standard Shipping Fee:* Flat ₹${SITE_CONFIG.shipping.standardDeliveryFee} for orders below ₹${SITE_CONFIG.shipping.freeShippingThreshold}.\n• *Roastery Dispatch:* Fresh micro-batches are roasted and dispatched within 24 hours of payment reconciliation.\n• *Transit Timelines:* Major metropolitan cities: 2–3 business days; all other regions: 3–5 business days via premium air/surface couriers.\n• *Packaging:* Airtight, safety-sealed glass jars enclosed in custom shock-absorbing protective packaging.`;

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `shipping-info-${Date.now()}`,
          sender: 'bot',
          timestamp: getNowTime(),
          type: 'shipping_info',
          text: shipText,
          buttons: [
            { label: '☕ Explore Coffee Blends', actionId: 'menu_explore' },
            { label: '📦 Track Existing Order', actionId: 'menu_track' },
            { label: '🏠 Main Menu', actionId: 'menu_main' },
          ],
        },
      ]);
    }, 450);
  };

  // -------------------------------------------------------------
  // Flow 6: Returns & Refunds
  // -------------------------------------------------------------
  const handleReturnsAndRefunds = () => {
    const isTe = language === 'te';
    const returnText = isTe
      ? `↩️ *రిటర్న్స్ & రీఫండ్స్ విభాగం*\nదయచేసి కింది ఎంపికలలో ఒకదాన్ని ఎంచుకోండి:`
      : `↩️ *Returns & Refunds Concierge*\nPlease choose how we can assist you with your order:`;

    const buttons = isTe
      ? [
          { label: '📦 రిటర్న్ / రీప్లేస్‌మెంట్ నమోదు (Initiate)', actionId: 'returns_initiate', variant: 'primary' as const },
          { label: '🔍 రిటర్న్ స్థితిని చూడండి (Check Status)', actionId: 'returns_status' },
          { label: '📜 అధికారిక పాలసీ చదవండి (Read Policy)', actionId: 'returns_policy' },
          { label: '🏠 Main Menu', actionId: 'menu_main' },
        ]
      : [
          { label: '📦 Initiate a Return / Replacement', actionId: 'returns_initiate', variant: 'primary' as const },
          { label: '🔍 Check Return Status', actionId: 'returns_status' },
          { label: '📜 Read Return Policy', actionId: 'returns_policy' },
          { label: '🏠 Main Menu', actionId: 'menu_main' },
        ];

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `returns-menu-${Date.now()}`,
          sender: 'bot',
          timestamp: getNowTime(),
          type: 'returns_menu',
          text: returnText,
          buttons,
        },
      ]);
    }, 400);
  };

  const handleInitiateReturn = () => {
    setReturnOrderId('');
    setReturnContact('');
    setReturnReason('');
    setReturnError('');

    const isTe = language === 'te';
    const promptText = isTe
      ? `📦 *రిటర్న్ / రీప్లేస్‌మెంట్ అభ్యర్థన*\nమీ ఆర్డర్ నంబర్, రిజిస్టర్డ్ ఫోన్/ఈమెయిల్ మరియు సమస్య యొక్క సంక్షిప్త కారణాన్ని నమోదు చేయండి:`
      : `📦 *Initiate a Return / Transit Replacement*\nPlease enter your Order ID, your registered phone or email, and a concise reason for the request:`;

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `return-form-${Date.now()}`,
          sender: 'bot',
          timestamp: getNowTime(),
          type: 'return_form',
          text: promptText,
          buttons: [
            { label: '⬅️ Back to Returns Menu', actionId: 'menu_returns' },
            { label: '🏠 Main Menu', actionId: 'menu_main' },
          ],
        },
      ]);
    }, 450);
  };

  const submitReturnForm = async () => {
    if (!returnOrderId.trim()) {
      setReturnError(language === 'te' ? 'దయచేసి ఆర్డర్ నంబర్ నమోదు చేయండి.' : 'Please enter your Order ID.');
      return;
    }
    if (!returnContact.trim()) {
      setReturnError(language === 'te' ? 'దయచేసి రిజిస్టర్డ్ కాంటాక్ట్ నమోదు చేయండి.' : 'Please enter your registered phone or email.');
      return;
    }
    if (!returnReason.trim()) {
      setReturnError(language === 'te' ? 'దయచేసి కారణాన్ని నమోదు చేయండి.' : 'Please state the reason for return/replacement.');
      return;
    }

    setReturnLoading(true);
    setReturnError('');

    try {
      const res = await initiateReturnRequest({
        orderId: returnOrderId,
        contactVerification: returnContact,
        reason: returnReason,
      });

      setReturnLoading(false);

      if (res.success && res.returnId) {
        setMessages((prev) => [
          ...prev,
          {
            id: `return-success-${Date.now()}`,
            sender: 'bot',
            timestamp: getNowTime(),
            type: 'text',
            text: language === 'te'
              ? `✅ *రిటర్న్ అభ్యర్థన విజయవంతంగా నమోదైంది!*\n\nరిఫరెన్స్ నంబర్: *${res.returnId}*\nఆర్డర్ నంబర్: #${returnOrderId}\nస్థితి: *సమీక్షలో ఉంది (Under Review)*\n\nమా కస్టమర్ కేర్ బృందం 24–48 గంటల్లో మీ రికార్డులను సమీక్షించి వాట్సాప్/ఈమెయిల్ ద్వారా రీప్లేస్‌మెంట్ లేదా రీఫండ్ వివరాలను తెలియజేస్తారు.`
              : `✅ *Return Request Successfully Submitted!*\n\nReference ID: *${res.returnId}*\nOrder Reference: #${returnOrderId}\nStatus: *Under Review*\n\nOur concierge desk will review the order records and reach out via WhatsApp/email within 24–48 hours regarding your replacement or refund.`,
            buttons: [
              { label: '🔍 Check Return Status', actionId: 'returns_status' },
              { label: '🏠 Main Menu', actionId: 'menu_main' },
            ],
          },
        ]);
      } else {
        setReturnError(res.message);
      }
    } catch (err: any) {
      setReturnLoading(false);
      setReturnError(err?.message || 'Failed to submit request.');
    }
  };

  const handleCheckReturnStatus = () => {
    setReturnStatusQuery('');
    setReturnStatusError('');

    const isTe = language === 'te';
    const statusPrompt = isTe
      ? `🔍 *రిటర్న్ స్థితి విచారణ*\nమీ రిటర్న్ రిఫరెన్స్ నంబర్ (ఉదా: RET-101-1234) లేదా ఆర్డర్ నంబర్ నమోదు చేయండి:`
      : `🔍 *Check Return Request Status*\nPlease enter your Return Reference ID (e.g. RET-101-1234) or your Order ID:`;

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `return-status-form-${Date.now()}`,
          sender: 'bot',
          timestamp: getNowTime(),
          type: 'return_status_form',
          text: statusPrompt,
          buttons: [
            { label: '⬅️ Back to Returns Menu', actionId: 'menu_returns' },
            { label: '🏠 Main Menu', actionId: 'menu_main' },
          ],
        },
      ]);
    }, 450);
  };

  const submitReturnStatusQuery = async (queryVal: string) => {
    if (!queryVal.trim()) {
      setReturnStatusError(language === 'te' ? 'దయచేసి రిఫరెన్స్ నంబర్ నమోదు చేయండి.' : 'Please enter a Return Reference ID or Order ID.');
      return;
    }

    setReturnStatusLoading(true);
    setReturnStatusError('');

    try {
      const res = await checkReturnStatus(queryVal);
      setReturnStatusLoading(false);

      if (res.success && res.request) {
        setMessages((prev) => [
          ...prev,
          {
            id: `return-card-${Date.now()}`,
            sender: 'bot',
            timestamp: getNowTime(),
            type: 'return_card',
            data: res.request,
            buttons: [
              { label: '📞 Speak with Support', actionId: 'menu_team' },
              { label: '🏠 Main Menu', actionId: 'menu_main' },
            ],
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `return-not-found-${Date.now()}`,
            sender: 'bot',
            timestamp: getNowTime(),
            type: 'text',
            text: res.message || 'No return request found for this reference.',
            buttons: [
              { label: '🔄 Try Another ID', actionId: 'returns_status' },
              { label: '📦 Initiate a Return', actionId: 'returns_initiate' },
              { label: '🏠 Main Menu', actionId: 'menu_main' },
            ],
          },
        ]);
      }
    } catch (err: any) {
      setReturnStatusLoading(false);
      setReturnStatusError(err?.message || 'Error querying return request.');
    }
  };

  const handleReadReturnPolicy = () => {
    const isTe = language === 'te';
    const policyText = isTe
      ? `📜 *SJT FARMS — అధికారిక రిటర్న్ & రీప్లేస్‌మెంట్ పాలసీ*\n\n1. *ఆహార భద్రత నిబంధన:* ఆర్టిసానల్ కాఫీ ఫుడ్ & బెవరేజ్ ఉత్పత్తి కాబట్టి, ఓపెన్ చేసిన కాఫీ ప్యాక్‌లపై సాధారణ రిటర్న్స్ స్వీకరించబడవు.\n2. *ట్రాన్సిట్ డ్యామేజ్ లేదా తప్పు వస్తువు:* పార్సిల్ పాడైతే లేదా తప్పు వస్తువు అందితే, 48 గంటల్లో మాకు ఫోటోలతో తెలియజేస్తే ఎటువంటి అదనపు రుసుము లేకుండా ఉచిత రీప్లేస్‌మెంట్ పంపబడుతుంది.\n3. *ఆర్డర్ రద్దు:* రోస్టరీ నుండి కొరియర్ డిస్పాచ్ కావడానికి ముందే మీరు ఆర్డర్‌ను రద్దు చేసుకోవచ్చు.\n4. *రీఫండ్ కాలవ్యవధి:* ఆమోదించబడిన రీఫండ్లు 3–5 బ్యాంకు పనిదినాల్లో మీ అసలు UPI అకౌంట్‌కు నేరుగా జమ చేయబడతాయి.`
      : `📜 *SJT FARMS — Published Return & Refund Policy*\n\n1. *Perishable Food Quality Standard:* As freshly roasted specialty coffee is a consumable food product, returns are not accepted once the seal is opened.\n2. *Damaged in Transit / Incorrect Item:* In the rare event of transit damage or wrong blend delivery, notify our desk within 48 hours with a photograph for an immediate, complimentary replacement.\n3. *Cancellation Before Dispatch:* You may cancel an order anytime before it leaves our Araku Valley roastery.\n4. *Refund Timelines:* Approved refunds are credited directly to your originating UPI account within 3–5 business days.`;

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `policy-text-${Date.now()}`,
          sender: 'bot',
          timestamp: getNowTime(),
          type: 'text',
          text: policyText,
          buttons: [
            { label: '📦 Initiate a Return / Replacement', actionId: 'returns_initiate' },
            { label: '📞 Contact Support Desk', actionId: 'menu_team' },
            { label: '🏠 Main Menu', actionId: 'menu_main' },
          ],
        },
      ]);
    }, 450);
  };

  // -------------------------------------------------------------
  // Flow 7: Talk to Our Team (Human Handoff)
  // -------------------------------------------------------------
  const handleTalkToTeam = () => {
    setTicketName('');
    setTicketContact('');
    setTicketMessage('');
    setTicketError('');

    const isTe = language === 'te';
    const teamIntro = isTe
      ? `📞 *మా కస్టమర్ కేర్ బృందంతో మాట్లాడండి*\n\nమీ సమస్య లేదా సందేహాన్ని ఇక్కడ వివరించండి. మా రోస్టరీ ప్రతినిధి త్వరలోనే మిమ్మల్ని సంప్రదిస్తారు:`
      : `📞 *SJT FARMS Human Support Desk*\n\nPlease describe your inquiry below so our customer care team has full context to assist you:`;

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `handoff-form-${Date.now()}`,
          sender: 'bot',
          timestamp: getNowTime(),
          type: 'handoff_form',
          text: teamIntro,
          buttons: [
            { label: '🏠 Main Menu', actionId: 'menu_main' },
          ],
        },
      ]);
    }, 400);
  };

  const submitSupportTicket = async () => {
    if (!ticketName.trim()) {
      setTicketError(language === 'te' ? 'దయచేసి మీ పేరు నమోదు చేయండి.' : 'Please enter your name.');
      return;
    }
    if (!ticketContact.trim()) {
      setTicketError(language === 'te' ? 'దయచేసి ఫోన్ లేదా ఈమెయిల్ నమోదు చేయండి.' : 'Please enter your phone or email.');
      return;
    }
    if (!ticketMessage.trim()) {
      setTicketError(language === 'te' ? 'దయచేసి మీ సందేశాన్ని టైప్ చేయండి.' : 'Please describe your request.');
      return;
    }

    setTicketLoading(true);
    setTicketError('');

    try {
      const ticketNum = Math.floor(1000 + Math.random() * 9000);
      const ticketId = `TICK-${ticketNum}`;

      // Submit to real contacts service
      await submitContactForm({
        name: ticketName,
        email: ticketContact.includes('@') ? ticketContact : `${ticketContact.replace(/\D/g, '')}@phone.customer`,
        phone: ticketContact.includes('@') ? '' : ticketContact,
        topic: 'WhatsApp Concierge Inbound',
        message: `[Ticket #${ticketId}] ${ticketMessage}`,
      });

      setTicketLoading(false);
      setIsHandoffMode(true);

      const isTe = language === 'te';
      const ackMsg = isTe
        ? `✅ *సపోర్ట్ టికెట్ నమోదైంది!*\nటికెట్ రిఫరెన్స్: *${ticketId}*\n\nమా కస్టమర్ కేర్ టీమ్‌కు మీ సందేశం చేరింది. పనివేళల్లో (సోమ–శని, 9:00 AM – 6:00 PM IST) త్వరలోనే సంప్రదిస్తారు.\n\nనేరుగా ఫోన్ చేయడానికి: +91 8121020111\n(ఆటోమేటెడ్ బాట్‌కు తిరిగి వెళ్ళడానికి "Resume Bot" పై నొక్కండి).`
        : `✅ *Support Ticket Created!*\nReference: *${ticketId}*\n\nYour message has been assigned to our concierge team. A team member will assist you shortly during working hours (Mon–Sat, 9:00 AM – 6:00 PM IST).\n\nDirect Phone: +91 8121020111\n(Tap "Resume Automated Concierge" anytime to return to the interactive bot).`;

      setMessages((prev) => [
        ...prev,
        {
          id: `ticket-ack-${Date.now()}`,
          sender: 'bot',
          timestamp: getNowTime(),
          type: 'handoff_active',
          text: ackMsg,
          buttons: [
            { label: '🤖 Resume Automated Concierge', actionId: 'menu_main', variant: 'primary' },
          ],
        },
      ]);
    } catch (err: any) {
      setTicketLoading(false);
      setTicketError(err?.message || 'Could not submit ticket.');
    }
  };

  // -------------------------------------------------------------
  // Button Callback Dispatcher
  // -------------------------------------------------------------
  const handleActionClick = (actionId: string, label: string) => {
    // Add customer's button click into chat history
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        timestamp: getNowTime(),
        type: 'text',
        text: label,
      },
    ]);

    // Dispatch
    switch (actionId) {
      case 'menu_main':
        setIsHandoffMode(false);
        sendMainMenu();
        break;
      case 'menu_explore':
        handleExploreCoffee();
        break;
      case 'menu_prices':
        handlePricesAndPackSizes();
        break;
      case 'menu_track':
        handleTrackMyOrder();
        break;
      case 'menu_payment':
        handlePaymentAssistance();
        break;
      case 'menu_shipping':
        handleShippingAndDelivery();
        break;
      case 'menu_returns':
        handleReturnsAndRefunds();
        break;
      case 'menu_team':
        handleTalkToTeam();
        break;
      case 'returns_initiate':
        handleInitiateReturn();
        break;
      case 'returns_status':
        handleCheckReturnStatus();
        break;
      case 'returns_policy':
        handleReadReturnPolicy();
        break;
      default:
        sendMainMenu();
    }
  };

  // -------------------------------------------------------------
  // Text Input Handler (Natural Language & Numbers)
  // -------------------------------------------------------------
  const handleSendMessage = () => {
    const text = inputText.trim();
    if (!text) return;

    setInputText('');
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        timestamp: getNowTime(),
        type: 'text',
        text,
      },
    ]);

    const upper = text.toUpperCase();

    // If currently in human handoff mode and not resetting
    if (isHandoffMode && !['MENU', 'RESET', 'START', 'BOT'].includes(upper)) {
      pushBotMessage(
        language === 'te'
          ? 'మీ సందేశం మా సపోర్ట్ డెస్క్ రికార్డులకు జోడించబడింది. ఆటోమేటెడ్ మెనూకు తిరిగి వెళ్లడానికి "MENU" అని టైప్ చేయండి.'
          : 'Your message has been added to your support request. Type "MENU" anytime to reactivate the automated concierge.'
      );
      return;
    }

    // Numbered menu choices (1 to 7)
    if (text === '1' || upper === 'EXPLORE' || upper === 'PRODUCTS') {
      handleExploreCoffee();
      return;
    }
    if (text === '2' || upper === 'PRICES' || upper === 'SIZES') {
      handlePricesAndPackSizes();
      return;
    }
    if (text === '3' || upper === 'TRACK' || upper.startsWith('TRACK')) {
      handleTrackMyOrder();
      return;
    }
    if (text === '4' || upper === 'PAYMENT' || upper === 'UPI') {
      handlePaymentAssistance();
      return;
    }
    if (text === '5' || upper === 'SHIPPING' || upper === 'DELIVERY') {
      handleShippingAndDelivery();
      return;
    }
    if (text === '6' || upper === 'RETURN' || upper === 'REFUND' || upper === 'RETURNS') {
      handleReturnsAndRefunds();
      return;
    }
    if (text === '7' || upper === 'TEAM' || upper === 'HUMAN' || upper === 'HELP' || upper === 'SUPPORT') {
      handleTalkToTeam();
      return;
    }

    // Language commands
    if (upper === 'TELUGU' || upper === 'TE') {
      handleLanguageToggle('te');
      return;
    }
    if (upper === 'ENGLISH' || upper === 'EN') {
      handleLanguageToggle('en');
      return;
    }

    // Menu reset commands
    if (['MENU', 'START', 'RESET', 'HI', 'HELLO', 'HII', 'HEY', 'NAMASTE'].includes(upper)) {
      setIsHandoffMode(false);
      sendMainMenu();
      return;
    }

    // Fallback guidance
    pushBotMessage(
      language === 'te'
        ? `క్షమించండి, మీ సందేశం గుర్తించబడలేదు. దయచేసి 1 నుండి 7 వరకు నంబర్ ఎంచుకోండి లేదా "MENU" అని టైప్ చేయండి.`
        : `Sorry, we didn't recognize that option. Please tap a button above, reply with a number (1–7), or type 'MENU' for all concierge options.`
    );
  };

  // -------------------------------------------------------------
  // Add product to cart helper
  // -------------------------------------------------------------
  const handleAddToCart = (product: any, size: string) => {
    const price = product.weightPrices?.[size] || product.price;
    addItem(product, size, 1);
    const label = `${product.name} (${size}) — ₹${price}`;
    setAddedNotice(label);
    setTimeout(() => setAddedNotice(null), 3000);

    pushBotMessage(
      language === 'te'
        ? `✅ *కార్ట్‌కు జోడించబడింది:* ${product.name} (${size}) — ₹${price}\n\nవెబ్‌సైట్ చెక్అవుట్‌కు వెళ్లడానికి క్రింది బటన్ నొక్కండి లేదా ఇతర కాఫీ రకాలను పరిశీలించండి:`
        : `✅ *Added to your Bag:* ${product.name} (${size}) — ₹${price}\n\nWould you like to complete checkout on our website or explore more Araku blends?`,
      () => {},
      250
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF7F2] text-[#2B211C] font-sans overflow-hidden select-text">
      {/* =========================================================================
          WHATSAPP BUSINESS HEADER
          ========================================================================= */}
      <div className="bg-gradient-to-r from-[#0D2E24] via-[#11382B] to-[#0D2E24] text-[#F8F4EC] px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between shadow-md border-b border-[#D4AF37]/30 shrink-0 z-10">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#1E5C47] to-[#0A241C] border border-[#D4AF37]/60 flex items-center justify-center text-[#D4AF37] shadow-inner">
              <Coffee className="w-5 h-5" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0D2E24] rounded-full ring-1 ring-emerald-300/50" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-serif font-bold text-sm sm:text-base tracking-wide text-[#F8F4EC] truncate">
                SJT FARMS ☕
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-semibold bg-[#D4AF37]/20 text-[#E5C158] rounded-full border border-[#D4AF37]/40 shrink-0">
                <Sparkles className="w-2.5 h-2.5" />
                Concierge
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-[#E8DCC8]/80 truncate">
              Pure Goodness from Nature • Official Assistant
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Language Toggle */}
          <button
            onClick={() => handleLanguageToggle(language === 'en' ? 'te' : 'en')}
            className="px-2 py-1 text-xs font-semibold rounded-lg bg-[#F8F4EC]/10 hover:bg-[#F8F4EC]/20 text-[#E5C158] border border-[#D4AF37]/40 transition-colors flex items-center gap-1 cursor-pointer"
            title="Switch Language"
          >
            <span>{language === 'en' ? '🇮🇳 తెలుగు' : '🇬🇧 EN'}</span>
          </button>

          {/* Reset Chat */}
          <button
            onClick={resetChat}
            className="p-1.5 sm:p-2 text-[#E8DCC8] hover:text-[#D4AF37] hover:bg-[#F8F4EC]/10 rounded-lg transition-colors cursor-pointer"
            title="Reset Chat"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Close if in modal */}
          {isOpenInModal && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-[#E8DCC8] hover:text-white hover:bg-red-500/30 rounded-lg transition-colors cursor-pointer ml-1"
              title="Close Concierge"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Simulator Mode Status Banner */}
      <div className="bg-[#11382B]/10 border-b border-[#11382B]/20 px-3 py-1.5 text-[11px] text-[#11382B] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shrink-0" />
          <span className="truncate font-medium">
            <strong>Interactive Simulator Mode:</strong> Full 7-menu flows operational locally. Cloud API ready.
          </span>
        </div>
        <span className="hidden sm:inline-block text-[10px] text-[#11382B]/70 shrink-0 font-mono">
          No SMS charged
        </span>
      </div>

      {/* Notification Toast */}
      {addedNotice && (
        <div className="bg-emerald-800 text-white text-xs px-4 py-2 flex items-center justify-between animate-fadeIn shrink-0">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-300" />
            {addedNotice}
          </span>
          <button
            onClick={() => navigateTo('cart')}
            className="underline font-bold text-amber-200 hover:text-white cursor-pointer ml-3"
          >
            View Cart
          </button>
        </div>
      )}

      {/* =========================================================================
          CONVERSATION MESSAGE FEED
          ========================================================================= */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5 bg-[#FAF7F2] bg-opacity-95">
        {/* Security / Notice Badge */}
        <div className="text-center my-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EFE9DF] text-[#635147] text-[11px] rounded-full border border-[#DED2C4]/80 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Official SJT FARMS Automated Concierge • WhatsApp Cloud API Architecture</span>
          </div>
        </div>

        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full animate-fadeIn`}
            >
              {/* Message Bubble */}
              <div
                className={`rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm max-w-[92%] sm:max-w-[85%] md:max-w-[78%] shadow-xs break-words relative ${
                  isUser
                    ? 'bg-[#E7F7ED] text-[#1C3B2B] rounded-br-xs border border-[#C5E8D4]'
                    : 'bg-white text-[#2B211C] rounded-bl-xs border border-[#E8DFD4] shadow-sm'
                }`}
              >
                {/* Text Content */}
                {msg.text && (
                  <div className="whitespace-pre-line leading-relaxed font-sans text-xs sm:text-sm">
                    {msg.text}
                  </div>
                )}

                {/* -------------------------------------------------------------
                    Interactive Component: Products Cards (Explore Coffee)
                    ------------------------------------------------------------- */}
                {msg.type === 'products' && (
                  <div className="mt-3 space-y-3">
                    {PRODUCTS.filter((p) => p.category !== 'Accessories').map((product) => {
                      const selectedSize = productVariants[product.slug] || '100g';
                      const currentPrice = product.weightPrices?.[selectedSize] || product.price;
                      const currentJar = getProductVariantJarImage(product, selectedSize);

                      return (
                        <div
                          key={product.id}
                          className="bg-[#FAF7F2] border border-[#E0D5C7] rounded-xl p-2.5 sm:p-3 hover:border-[#11382B]/40 transition-all shadow-xs"
                        >
                          <div className="flex gap-3 items-start">
                            {/* Product Jar Thumbnail */}
                            <div className="w-16 h-20 sm:w-20 sm:h-24 bg-white rounded-lg border border-[#E0D5C7] p-1 shrink-0 flex items-center justify-center overflow-hidden">
                              <img
                                src={currentJar}
                                alt={product.name}
                                className="w-full h-full object-contain hover:scale-105 transition-transform"
                                onError={(e) => {
                                  // Graceful branded fallback if jar is missing
                                  (e.target as HTMLImageElement).src = '/images/sjt_hero_coffee.jpg';
                                }}
                              />
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-1">
                                <h4 className="font-serif font-bold text-xs sm:text-sm text-[#11382B] leading-snug">
                                  {product.name}
                                </h4>
                                <span className="font-bold text-emerald-800 text-xs sm:text-sm shrink-0">
                                  ₹{currentPrice}
                                </span>
                              </div>

                              <p className="text-[11px] text-[#7A6A58] line-clamp-2 mt-0.5">
                                {product.tagline}
                              </p>

                              <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-[#55433C]">
                                <span className="bg-[#EFE9DF] px-1.5 py-0.5 rounded font-medium">
                                  {product.chicoryRatio}
                                </span>
                                <span className="bg-[#EFE9DF] px-1.5 py-0.5 rounded font-medium">
                                  {product.roastLevel}
                                </span>
                              </div>

                              {/* Pack Size Selector Buttons */}
                              <div className="mt-2 flex items-center gap-1.5">
                                <span className="text-[10px] font-semibold text-[#635147]">Size:</span>
                                {product.weights.map((wt) => {
                                  const isSelected = selectedSize === wt;
                                  return (
                                    <button
                                      key={wt}
                                      onClick={() => {
                                        setProductVariants((prev) => ({ ...prev, [product.slug]: wt }));
                                      }}
                                      className={`px-2 py-0.5 text-[11px] font-bold rounded cursor-pointer transition-all ${
                                        isSelected
                                          ? 'bg-[#11382B] text-white shadow-xs'
                                          : 'bg-white text-[#55433C] border border-[#D5C7B7] hover:bg-[#F3ECE0]'
                                      }`}
                                    >
                                      {wt}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Actions */}
                              <div className="mt-2.5 flex items-center gap-2">
                                <button
                                  onClick={() => handleAddToCart(product, selectedSize)}
                                  className="flex-1 py-1.5 px-2 bg-[#11382B] hover:bg-[#0A241C] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                                >
                                  <ShoppingBag className="w-3.5 h-3.5" />
                                  <span>Add {selectedSize} to Cart</span>
                                </button>
                                <button
                                  onClick={() => navigateTo('product-detail', { product, variant: selectedSize })}
                                  className="py-1.5 px-2.5 bg-white border border-[#D5C7B7] hover:border-[#11382B] text-[#11382B] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                                >
                                  Details
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* -------------------------------------------------------------
                    Interactive Component: Prices Matrix
                    ------------------------------------------------------------- */}
                {msg.type === 'prices' && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-[#DED2C4] bg-[#FAF7F2] text-xs">
                    <div className="bg-[#11382B] text-[#F8F4EC] p-2 font-bold text-center">
                      Official Glass Jar Pricing Matrix
                    </div>
                    <div className="divide-y divide-[#EAE1D4]">
                      {PRODUCTS.filter((p) => p.category !== 'Accessories').map((p) => {
                        const selectedSize = productVariants[p.slug] || '100g';
                        const currentPrice = p.weightPrices?.[selectedSize] || p.price;

                        return (
                          <div key={p.id} className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="font-bold text-[#11382B]">{p.name}</div>
                              <div className="text-[11px] text-[#7A6A58]">{p.chicoryRatio}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                {p.weights.map((w) => (
                                  <button
                                    key={w}
                                    onClick={() => setProductVariants((prev) => ({ ...prev, [p.slug]: w }))}
                                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
                                      selectedSize === w
                                        ? 'bg-[#11382B] text-white'
                                        : 'bg-white border border-[#DED2C4] text-[#55433C]'
                                    }`}
                                  >
                                    {w}
                                  </button>
                                ))}
                              </div>
                              <span className="font-bold text-emerald-800 text-xs min-w-[50px] text-right">
                                ₹{currentPrice}
                              </span>
                              <button
                                onClick={() => handleAddToCart(p, selectedSize)}
                                className="px-2 py-1 bg-[#11382B] text-white text-[10px] font-bold rounded hover:bg-[#0A241C] cursor-pointer"
                              >
                                Buy
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* -------------------------------------------------------------
                    Interactive Component: Track Order Input Form
                    ------------------------------------------------------------- */}
                {msg.type === 'track_form' && (
                  <div className="mt-3 p-3 bg-[#FAF7F2] border border-[#DED2C4] rounded-xl space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-[#55433C] mb-1">
                        Order ID / Number:
                      </label>
                      <input
                        type="text"
                        value={trackOrderId}
                        onChange={(e) => setTrackOrderId(e.target.value)}
                        placeholder="e.g. 101 or #101"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#D5C7B7] bg-white focus:outline-none focus:ring-1 focus:ring-[#11382B]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#55433C] mb-1">
                        Registered Mobile Number or Email (Privacy Verification):
                      </label>
                      <input
                        type="text"
                        value={trackContact}
                        onChange={(e) => setTrackContact(e.target.value)}
                        placeholder="e.g. 9876543210 or name@example.com"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#D5C7B7] bg-white focus:outline-none focus:ring-1 focus:ring-[#11382B]"
                      />
                    </div>

                    {trackError && (
                      <p className="text-[11px] text-red-600 font-semibold">{trackError}</p>
                    )}

                    <button
                      onClick={() => submitTrackOrder(trackOrderId, trackContact)}
                      disabled={trackLoading}
                      className="w-full py-2 bg-[#11382B] hover:bg-[#0A241C] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {trackLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Package className="w-3.5 h-3.5" />}
                      <span>Verify & Track Order</span>
                    </button>
                  </div>
                )}

                {/* -------------------------------------------------------------
                    Interactive Component: Order Details Card
                    ------------------------------------------------------------- */}
                {msg.type === 'order_card' && msg.data && (
                  <div className="mt-3 p-3 bg-[#FAF7F2] border border-[#11382B]/30 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-[#E0D5C7] pb-1.5">
                      <div>
                        <span className="font-bold text-[#11382B]">
                          Order #{msg.data.displayId || msg.data.orderNumber || msg.data.orderId}
                        </span>
                        <div className="text-[10px] text-[#7A6A58]">{msg.data.createdAt}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {msg.data.orderStatus}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#635147]">Customer:</span>
                        <span className="font-semibold text-[#2B211C]">{msg.data.customer?.fullName}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#635147]">Payment Status:</span>
                        <span className="font-bold text-amber-900">{msg.data.paymentStatus}</span>
                      </div>
                      {msg.data.utrNumber && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#635147]">UTR Reference:</span>
                          <span className="font-mono text-[#2B211C]">{msg.data.utrNumber}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#635147]">Total Amount:</span>
                        <span className="font-bold text-emerald-900">₹{msg.data.total}</span>
                      </div>
                    </div>

                    {/* Ordered Items Summary */}
                    <div className="pt-1.5 border-t border-[#E0D5C7]">
                      <div className="font-bold text-[11px] text-[#55433C] mb-1">Items:</div>
                      <ul className="space-y-0.5 text-[11px]">
                        {msg.data.items?.map((item: any, idx: number) => (
                          <li key={idx} className="flex justify-between text-[#2B211C]">
                            <span>
                              • {item.product?.name || item.name} ({item.selectedWeight}) × {item.quantity}
                            </span>
                            <span className="font-medium">₹{item.price * item.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Courier Tracking */}
                    {msg.data.courierTrackingId ? (
                      <div className="pt-1.5 border-t border-[#E0D5C7] text-[11px] bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                        <div className="font-bold text-emerald-900">Courier Tracking Available:</div>
                        <div>Courier: {msg.data.courierName || 'Express Courier'}</div>
                        <div>AWB / Tracking: {msg.data.courierTrackingId}</div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-[#7A6A58] italic">
                        Tracking number will be assigned once dispatched from Araku roastery.
                      </div>
                    )}
                  </div>
                )}

                {/* -------------------------------------------------------------
                    Interactive Component: Payment Assistance Box
                    ------------------------------------------------------------- */}
                {msg.type === 'payment_info' && (
                  <div className="mt-3 space-y-2.5 text-xs">
                    {/* Security Notice */}
                    <div className="bg-red-50 border border-red-200 text-red-900 p-2.5 rounded-xl flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-tight font-medium">
                        <strong>Security Reminder:</strong> SJT FARMS will <u>NEVER</u> ask for your UPI PIN, OTP, net banking password, or card CVV. Entering your UPI PIN sends money; no PIN is ever required to receive refunds.
                      </div>
                    </div>

                    {/* Verified Merchant Details */}
                    <div className="bg-[#FAF7F2] border border-[#DED2C4] p-3 rounded-xl space-y-1.5">
                      <div className="font-bold text-[#11382B] text-xs">Official Merchant Payment Channel:</div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#635147]">Merchant Business Name:</span>
                        <span className="font-bold text-[#2B211C]">SJT FARMS</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#635147]">Registered Support Phone:</span>
                        <span className="font-mono font-bold text-[#11382B]">+91 8121020111</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#635147]">Verified UPI VPA:</span>
                        <span className="font-mono font-bold text-[#11382B]">badaanaresh3-1@okaxis</span>
                      </div>
                    </div>

                    <div className="bg-[#FAF7F2] border border-[#DED2C4] p-2.5 rounded-xl text-[11px] text-[#635147] space-y-1">
                      <div className="font-bold text-[#55433C]">How Manual UPI Verification Works:</div>
                      <div>1. Pay via Google Pay, PhonePe, Paytm, or BHIM.</div>
                      <div>2. Copy the 12-digit UTR reference number from your receipt.</div>
                      <div>3. Submit the UTR on our checkout page or track order page.</div>
                      <div>4. Our accounts desk confirms the transaction against bank records before roasting.</div>
                    </div>
                  </div>
                )}

                {/* -------------------------------------------------------------
                    Interactive Component: Return Initiation Form
                    ------------------------------------------------------------- */}
                {msg.type === 'return_form' && (
                  <div className="mt-3 p-3 bg-[#FAF7F2] border border-[#DED2C4] rounded-xl space-y-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-[#55433C] mb-1">Order ID:</label>
                      <input
                        type="text"
                        value={returnOrderId}
                        onChange={(e) => setReturnOrderId(e.target.value)}
                        placeholder="e.g. 101 or #101"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#D5C7B7] bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#55433C] mb-1">Registered Phone or Email:</label>
                      <input
                        type="text"
                        value={returnContact}
                        onChange={(e) => setReturnContact(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#D5C7B7] bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#55433C] mb-1">
                        Reason for Return / Replacement:
                      </label>
                      <textarea
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                        placeholder="e.g. Seal damaged in transit / wrong variant delivered"
                        rows={2}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#D5C7B7] bg-white focus:outline-none resize-none"
                      />
                    </div>

                    {returnError && (
                      <p className="text-[11px] text-red-600 font-semibold">{returnError}</p>
                    )}

                    <button
                      onClick={submitReturnForm}
                      disabled={returnLoading}
                      className="w-full py-2 bg-[#11382B] hover:bg-[#0A241C] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {returnLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                      <span>Submit Return Request</span>
                    </button>
                  </div>
                )}

                {/* -------------------------------------------------------------
                    Interactive Component: Return Status Query Form
                    ------------------------------------------------------------- */}
                {msg.type === 'return_status_form' && (
                  <div className="mt-3 p-3 bg-[#FAF7F2] border border-[#DED2C4] rounded-xl space-y-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-[#55433C] mb-1">
                        Return ID or Order ID:
                      </label>
                      <input
                        type="text"
                        value={returnStatusQuery}
                        onChange={(e) => setReturnStatusQuery(e.target.value)}
                        placeholder="e.g. RET-101-1234 or 101"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#D5C7B7] bg-white focus:outline-none"
                      />
                    </div>

                    {returnStatusError && (
                      <p className="text-[11px] text-red-600 font-semibold">{returnStatusError}</p>
                    )}

                    <button
                      onClick={() => submitReturnStatusQuery(returnStatusQuery)}
                      disabled={returnStatusLoading}
                      className="w-full py-2 bg-[#11382B] hover:bg-[#0A241C] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {returnStatusLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                      <span>Check Return Status</span>
                    </button>
                  </div>
                )}

                {/* -------------------------------------------------------------
                    Interactive Component: Return Card Details
                    ------------------------------------------------------------- */}
                {msg.type === 'return_card' && msg.data && (
                  <div className="mt-3 p-3 bg-[#FAF7F2] border border-[#11382B]/30 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between items-center border-b border-[#E0D5C7] pb-1">
                      <span className="font-bold text-[#11382B]">{msg.data.id}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        {msg.data.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#635147]">Order Reference:</span>
                      <span className="font-semibold text-[#2B211C]">#{msg.data.orderId}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#635147]">Customer:</span>
                      <span className="font-semibold text-[#2B211C]">{msg.data.customerName}</span>
                    </div>
                    <div className="text-[11px]">
                      <span className="text-[#635147]">Reason:</span>{' '}
                      <span className="italic text-[#2B211C]">{msg.data.reason}</span>
                    </div>
                    <div className="text-[10px] text-[#7A6A58] pt-1 border-t border-[#E0D5C7]">
                      {msg.data.notes}
                    </div>
                  </div>
                )}

                {/* -------------------------------------------------------------
                    Interactive Component: Support Ticket / Human Handoff Form
                    ------------------------------------------------------------- */}
                {msg.type === 'handoff_form' && (
                  <div className="mt-3 p-3 bg-[#FAF7F2] border border-[#DED2C4] rounded-xl space-y-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-[#55433C] mb-1">Your Full Name:</label>
                      <input
                        type="text"
                        value={ticketName}
                        onChange={(e) => setTicketName(e.target.value)}
                        placeholder="e.g. Ramesh Varma"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#D5C7B7] bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#55433C] mb-1">Phone or Email:</label>
                      <input
                        type="text"
                        value={ticketContact}
                        onChange={(e) => setTicketContact(e.target.value)}
                        placeholder="e.g. +91 9876543210"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#D5C7B7] bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#55433C] mb-1">How can we assist you?</label>
                      <textarea
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        placeholder="e.g. Question regarding blend roast date, bulk gift orders, or delivery timing..."
                        rows={2}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#D5C7B7] bg-white focus:outline-none resize-none"
                      />
                    </div>

                    {ticketError && (
                      <p className="text-[11px] text-red-600 font-semibold">{ticketError}</p>
                    )}

                    <button
                      onClick={submitSupportTicket}
                      disabled={ticketLoading}
                      className="w-full py-2 bg-[#11382B] hover:bg-[#0A241C] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {ticketLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Headphones className="w-3.5 h-3.5" />}
                      <span>Assign to Human Concierge</span>
                    </button>
                  </div>
                )}

                {/* -------------------------------------------------------------
                    Interactive Action Buttons (Pills / Cards)
                    ------------------------------------------------------------- */}
                {msg.buttons && msg.buttons.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-[#E8DFD4] flex flex-col gap-1.5">
                    {msg.buttons.map((btn, bIdx) => {
                      const isPrimary = btn.variant === 'primary';
                      const isAccent = btn.variant === 'accent';
                      const isSecondary = btn.variant === 'secondary';

                      return (
                        <button
                          key={bIdx}
                          onClick={() => handleActionClick(btn.actionId, btn.label)}
                          className={`w-full py-2 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-between text-left active:scale-[0.99] ${
                            isPrimary
                              ? 'bg-[#11382B] text-white hover:bg-[#0A241C] shadow-xs'
                              : isAccent
                              ? 'bg-amber-100/80 text-amber-950 border border-amber-300 hover:bg-amber-200/80'
                              : isSecondary
                              ? 'bg-[#FAF7F2] text-[#11382B] border border-[#11382B]/40 hover:bg-[#EFE9DF]'
                              : 'bg-white text-[#2B211C] border border-[#DED2C4] hover:bg-[#F5EFE6]'
                          }`}
                        >
                          <span>{btn.label}</span>
                          <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Timestamp & Read Indicator */}
                <div
                  className={`mt-1 text-[10px] flex items-center gap-1 justify-end ${
                    isUser ? 'text-emerald-700/70' : 'text-[#8A7969]'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {isUser && <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-center gap-1.5 text-xs text-[#7A6A58] p-2 bg-white rounded-xl w-24 border border-[#E8DFD4] shadow-xs animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#11382B] animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#11382B] animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#11382B] animate-bounce [animation-delay:0.4s]" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* =========================================================================
          PERSISTENT QUICK CHIPS
          ========================================================================= */}
      <div className="px-3 py-1.5 bg-[#F4EFE6] border-t border-[#E5DACD] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-xs">
        <button
          onClick={() => handleActionClick('menu_main', '🏠 Main Menu')}
          className="px-2.5 py-1 bg-white hover:bg-[#FAF7F2] text-[#11382B] border border-[#D5C7B7] rounded-full shrink-0 font-medium text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Home className="w-3 h-3" />
          <span>Menu</span>
        </button>
        <button
          onClick={() => handleActionClick('menu_explore', '☕ Explore Coffee')}
          className="px-2.5 py-1 bg-white hover:bg-[#FAF7F2] text-[#11382B] border border-[#D5C7B7] rounded-full shrink-0 font-medium text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Coffee className="w-3 h-3" />
          <span>Blends</span>
        </button>
        <button
          onClick={() => handleActionClick('menu_track', '📦 Track Order')}
          className="px-2.5 py-1 bg-white hover:bg-[#FAF7F2] text-[#11382B] border border-[#D5C7B7] rounded-full shrink-0 font-medium text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Package className="w-3 h-3" />
          <span>Track</span>
        </button>
        <button
          onClick={() => handleActionClick('menu_payment', '💳 Payment')}
          className="px-2.5 py-1 bg-white hover:bg-[#FAF7F2] text-[#11382B] border border-[#D5C7B7] rounded-full shrink-0 font-medium text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
        >
          <CreditCard className="w-3 h-3" />
          <span>UPI</span>
        </button>
        <button
          onClick={() => handleActionClick('menu_team', '📞 Support')}
          className="px-2.5 py-1 bg-white hover:bg-[#FAF7F2] text-[#11382B] border border-[#D5C7B7] rounded-full shrink-0 font-medium text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Headphones className="w-3 h-3" />
          <span>Help</span>
        </button>
      </div>

      {/* =========================================================================
          BOTTOM INPUT BAR
          ========================================================================= */}
      <div className="p-2.5 sm:p-3 bg-white border-t border-[#DED2C4] flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          placeholder={
            language === 'te'
              ? 'సందేశం లేదా నంబర్ (1–7) టైప్ చేయండి...'
              : 'Type a message or number (1–7)...'
          }
          className="flex-1 text-xs sm:text-sm px-3.5 py-2 sm:py-2.5 rounded-full border border-[#D5C7B7] bg-[#FAF7F2] focus:outline-none focus:ring-1 focus:ring-[#11382B] focus:border-[#11382B] transition-all"
        />

        <button
          onClick={handleSendMessage}
          disabled={!inputText.trim()}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#11382B] hover:bg-[#0A241C] disabled:bg-[#C2B5A5] text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-xs"
          title="Send Message"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </div>
    </div>
  );
};
