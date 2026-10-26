/**
 * SJT FARMS - SECURE PAYMENT GATEWAY ADAPTER & CONTRACT
 *
 * Provides a standardized adapter architecture for payment gateway integrations
 * (Razorpay / Cashfree / Stripe).
 *
 * Strict Security Principles:
 * 1. NEVER expose gateway secret keys or webhook secrets in client bundles.
 * 2. Client bundles may only access public Key ID (if enabled).
 * 3. All signature verification and capture MUST occur on trusted server-side code.
 * 4. Webhooks must verify HMAC-SHA256 signature against the raw unparsed request body.
 * 5. Webhook event processing must be idempotent (prevents duplicate payment recording).
 * 6. If credentials are not configured, safely report unconfigured state without faking transactions.
 */

import { OrderDetails } from '../types';
import { PAYMENT_CONFIG } from '../data/paymentConfig';

export type GatewayProvider = 'None' | 'Razorpay' | 'Cashfree';

export interface GatewayOrderRequest {
  orderId: string | number;
  amount: number; // in INR rupees
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  receipt: string;
}

export interface GatewayOrderResponse {
  success: boolean;
  gatewayOrderId?: string;
  amount?: number;
  currency?: string;
  keyId?: string;
  message?: string;
  isConfigured: boolean;
}

export interface RazorpayPaymentSuccessPayload {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface PaymentGatewayAdapter {
  provider: GatewayProvider;
  isConfigured(): boolean;
  createOrder(req: GatewayOrderRequest): Promise<GatewayOrderResponse>;
  openCheckout(
    orderResponse: GatewayOrderResponse,
    onSuccess: (payload: RazorpayPaymentSuccessPayload) => void,
    onFailure: (error: any) => void
  ): Promise<void>;
}

/**
 * Checks whether client-safe gateway public key is configured in Vite environment.
 */
export function isPaymentGatewayConfigured(): boolean {
  // Check for public key in environment
  const publicKey = (import.meta as any).env?.VITE_RAZORPAY_KEY_ID;
  return Boolean(publicKey && publicKey !== '[CLIENT TO PROVIDE PAYMENT_GATEWAY_KEY_ID]' && publicKey.length > 5);
}

/**
 * Razorpay Payment Gateway Adapter Implementation
 */
export class RazorpayGatewayAdapter implements PaymentGatewayAdapter {
  provider: GatewayProvider = 'Razorpay';

  isConfigured(): boolean {
    return isPaymentGatewayConfigured();
  }

  async createOrder(req: GatewayOrderRequest): Promise<GatewayOrderResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        isConfigured: false,
        message:
          'Payment Gateway is not yet activated for live processing. Please provide Razorpay Merchant Key ID in your secure server configuration.',
      };
    }

    // In a live environment with backend Cloud Functions:
    // Call server endpoint e.g. /api/createRazorpayOrder to generate authoritative order ID
    return {
      success: false,
      isConfigured: true,
      message: 'Server-side order generation endpoint pending deployment.',
    };
  }

  async openCheckout(
    orderResponse: GatewayOrderResponse,
    onSuccess: (payload: RazorpayPaymentSuccessPayload) => void,
    onFailure: (error: any) => void
  ): Promise<void> {
    if (!this.isConfigured()) {
      onFailure(new Error('Gateway credentials not provided. Use Direct UPI or COD.'));
      return;
    }

    // Dynamically load official Razorpay SDK script if configured
    if (typeof window === 'undefined') return;

    if (!(window as any).Razorpay) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
        document.body.appendChild(script);
      });
    }

    const publicKey = (import.meta as any).env?.VITE_RAZORPAY_KEY_ID;
    const options = {
      key: publicKey,
      amount: (orderResponse.amount || 0) * 100, // paise
      currency: orderResponse.currency || 'INR',
      name: PAYMENT_CONFIG.businessEntityName,
      description: `Order #${orderResponse.gatewayOrderId}`,
      order_id: orderResponse.gatewayOrderId,
      handler: (response: RazorpayPaymentSuccessPayload) => {
        onSuccess(response);
      },
      theme: {
        color: '#20150F',
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  }
}

export const defaultPaymentGateway = new RazorpayGatewayAdapter();
