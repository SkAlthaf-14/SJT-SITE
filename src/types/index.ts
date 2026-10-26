export type OrderStatus =
  // Canonical State Machine
  | 'pending'
  | 'received'
  | 'payment_review'
  | 'confirmed'
  | 'processing'
  | 'packing'
  | 'ready_to_ship'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'returned'
  | 'refund_processing'
  | 'refunded'
  // Existing UI Display Labels (preserved for backwards compatibility)
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export type PaymentStatus =
  // Canonical State Machine
  | 'payment_pending'
  | 'payment_pending_verification'
  | 'payment_approved'
  | 'payment_rejected'
  | 'refund_pending'
  | 'pending'
  | 'pending_verification'
  | 'verified'
  | 'paid'
  | 'failed'
  | 'rejected'
  | 'under_review'
  | 'refunded'
  // Existing UI Display Labels
  | 'Pending'
  | 'Awaiting Payment'
  | 'Awaiting payment'
  | 'Payment Details Submitted'
  | 'Verification Pending'
  | 'Verification pending'
  | 'Payment Confirmed'
  | 'Payment Approved'
  | 'Payment approved'
  | 'Payment Rejected'
  | 'Payment rejected'
  | 'Refund Initiated'
  | 'Paid'
  | 'Cash on Delivery'
  | 'Payment Gateway Demo';

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: 'Coffee Powder' | 'Filter Coffee' | 'Specialty' | 'Accessories';
  tagline: string;
  description: string;
  longDescription: string;
  price: number; // Base price for default weight
  originalPrice?: number;
  discount?: string;
  rating: number;
  reviewCount: number;
  images: string[];
  weights: string[];
  weightPrices: Record<string, number>;
  strength: 'Mild' | 'Medium' | 'Strong';
  roastLevel: string;
  flavourNotes: string[];
  brewMethods: string[];
  chicoryRatio?: string;
  ingredients: string;
  shippingInfo: string;
  stock: number;
  featured: boolean;
  isBestseller?: boolean;
  isNew?: boolean;
  jarImages?: Record<string, string>;
  labelImages?: Record<string, string>;
  labelSvgs?: Record<string, string>;
  verifiedBlendRatio?: string;
  theme?: {
    primary: string;
    secondary: string;
    accent: string;
    badge: string;
    border: string;
    bgGrad: string;
  };
  preparationInstructions?: string[];
  storageInstructions?: string;
  flaggedNotice?: string;
}

export interface CartItem {
  product: Product;
  selectedWeight: string;
  price: number;
  quantity: number;
}

export interface Review {
  id: string;
  author: string;
  location: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verified: boolean;
  productName: string;
  isDemo?: boolean;
}

export interface BrewGuide {
  id: string;
  name: string;
  shortDesc: string;
  time: string;
  strength: string;
  grind: string;
  coffeeRatio: string;
  waterRatio: string;
  temp: string;
  image: string;
  steps: {
    title: string;
    description: string;
    durationSeconds?: number;
  }[];
  proTip: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  category: string;
  readTime: string;
  date: string;
  excerpt: string;
  image: string;
  content: string[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  frequency: string;
  days: number;
  discountPercent: number;
  description: string;
  popular?: boolean;
}

export interface OrderAuditEntry {
  status: string;
  timestamp: string;
  actor: string;
  note?: string;
}

export interface PaymentMetadataAuditLog {
  id: string;
  field: 'utrNumber' | 'verificationNotes' | 'assignedStaff' | 'amountReceived' | 'status';
  oldValue: string;
  newValue: string;
  adminUid: string;
  adminEmail: string;
  reason: string;
  timestamp: string;
}

export interface OrderDetails {
  firestoreDocId?: string; // Canonical Firestore document ID (e.g. "order_101")
  orderId: string;
  orderNumber?: number; // Sequential customer-facing ID (e.g. 101, 102...)
  displayId?: string; // Formatted display e.g. "Order #101"
  items: CartItem[];
  subtotal: number;
  discount: number;
  delivery: number;
  total: number;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
  createdAtTimestamp?: number;
  estimatedDelivery: string;
  paymentVerifiedAt?: string;
  paymentVerifiedBy?: string;
  // Authentic PhonePe / UPI Payment & Tracking Fields
  utrNumber?: string;
  amountReceived?: number;
  assignedStaff?: string;
  isFlagged?: boolean;
  flagReason?: string;
  paymentVerificationStatus?:
    | 'awaiting_payment'
    | 'details_submitted'
    | 'verification_pending'
    | 'confirmed'
    | 'paid'
    | 'payment_failed'
    | 'rejected'
    | 'under_review'
    | 'refund_pending'
    | 'refunded';
  paymentRejectionReason?: string;
  courierName?: string;
  courierTrackingId?: string;
  courierTrackingUrl?: string;
  packedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  statusHistory?: OrderAuditEntry[];
  metadataAuditLogs?: PaymentMetadataAuditLog[];
  paymentAudit?: {
    verifiedBy?: string;
    verifiedAt?: string;
    rejectionReason?: string;
    notes?: string;
  };
}

export interface OrderNotificationRecord {
  notificationId: string;
  orderId: string;
  orderNumber?: number;
  type: 'order_created' | 'payment_verified' | 'payment_rejected' | 'dispatched' | 'delivered';
  recipient: string;
  customerEmail: string;
  customerPhone: string;
  customerName: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: 'queued' | 'sent' | 'failed';
  attempts: number;
  createdAt: string;
  sentAt?: string;
  errorMessage?: string;
}

export interface ContactInquiry {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  topic: string;
  message: string;
  createdAt?: string;
}
