import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ArrowLeft,
  X,
  Coffee,
  Lock,
  Check,
} from 'lucide-react';
import { CartItem } from '../../types';
import { PAYMENT_CONFIG } from '../../data/paymentConfig';
import { getProductVariantJarImage } from '../../data/products';
import { formatInr } from '../../utils/currencyFormatter';

interface PaymentHeaderProps {
  total: number;
  subtotal: number;
  delivery: number;
  discount: number;
  items: CartItem[];
  orderNumber?: number | string;
  onBackOrClose: () => void;
  isCloseable?: boolean;
}

export const PaymentHeader: React.FC<PaymentHeaderProps> = ({
  total,
  subtotal,
  delivery,
  discount,
  items,
  orderNumber,
  onBackOrClose,
  isCloseable = true,
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  return (
    <div className="w-full bg-[#20150F] text-[#F7F2EA] rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden border border-[#D7AD36]/25 transition-all">
      {/* 1. TOP TRUST MICRO-BAR */}
      <div className="bg-[#170E0A] py-1.5 px-4 text-center border-b border-[#D7AD36]/20 flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#D7AD36] animate-pulse" />
        <span className="text-[11px] font-sans font-semibold tracking-wider uppercase text-[#EAD8B5]">
          Direct From Shade-Grown Estate • 100% Secure Payment
        </span>
      </div>

      {/* 2. REFINED PROVIDER HEADER (MATCHES SCREENSHOT REFERENCE) */}
      <div className="p-4 sm:p-6 relative">
        {/* Top actions row: Back on left, Secure tag on right, Close icon */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <button
            type="button"
            onClick={onBackOrClose}
            aria-label="Back to checkout details"
            className="p-1.5 rounded-full hover:bg-white/10 active:scale-95 text-[#EAD8B5] hover:text-white transition-all cursor-pointer flex items-center gap-1 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2E1F16] border border-[#D7AD36]/30 text-[11px] text-[#D7AD36] font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D7AD36]" />
              <span>Secured by SJT FARMS</span>
            </div>

            {isCloseable && (
              <button
                type="button"
                onClick={onBackOrClose}
                aria-label="Close payment panel"
                className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Merchant Branding Center */}
        <div className="flex flex-col items-center text-center space-y-2 pt-1">
          {/* Logo Badge */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2E1F16] to-[#170E0A] border-2 border-[#D7AD36] shadow-lg flex items-center justify-center p-1.5 relative group">
            <div className="w-full h-full rounded-xl bg-[#20150F] flex items-center justify-center border border-[#D7AD36]/40">
              <Coffee className="w-7 h-7 text-[#D7AD36]" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#2E5A3D] text-white flex items-center justify-center border border-white">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
          </div>

          <div>
            <h1 className="font-serif text-base sm:text-lg font-bold text-white tracking-wide uppercase">
              {PAYMENT_CONFIG.businessEntityName}
            </h1>
            <p className="text-[11px] text-[#D0C2B4] font-sans flex items-center justify-center gap-1.5">
              <span>Verified Merchant</span>
              <span>•</span>
              <span className="text-[#D7AD36]">UPI ID: {PAYMENT_CONFIG.merchantVpa}</span>
            </p>
            {orderNumber && (
              <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-[#EAD8B5]">
                Order #{orderNumber}
              </span>
            )}
          </div>

          {/* DYNAMIC AMOUNT PILL (WITH DROPDOWN ARROW) */}
          <button
            type="button"
            onClick={() => setShowBreakdown(!showBreakdown)}
            aria-expanded={showBreakdown}
            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2F2119] hover:bg-[#3D2B20] border border-[#D7AD36]/50 shadow-md text-white transition-all active:scale-98 cursor-pointer group"
          >
            <span className="font-sans text-xl sm:text-2xl font-black text-[#D7AD36] tracking-tight">
              {formatInr(total)}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-[#EAD8B5] font-sans pl-1 border-l border-white/20">
              <span>{showBreakdown ? 'Hide details' : 'View breakdown'}</span>
              {showBreakdown ? (
                <ChevronUp className="w-3.5 h-3.5 text-[#D7AD36]" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-[#D7AD36] group-hover:translate-y-0.5 transition-transform" />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* 3. COLLAPSIBLE ITEMIZED ORDER BREAKDOWN */}
      {showBreakdown && (
        <div className="bg-[#170E0A] px-5 py-4 border-t border-[#D7AD36]/20 animate-fadeIn text-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="font-bold uppercase tracking-wider text-[10px] text-[#D7AD36]">
              Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})
            </span>
            <span className="text-[10px] text-[#D0C2B4]">Direct Roastery Dispatch</span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1 divide-y divide-white/5">
            {items.map((item) => (
              <div
                key={`${item.product.id}-${item.selectedWeight}`}
                className="pt-2 first:pt-0 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={getProductVariantJarImage(item.product, item.selectedWeight)}
                    alt={item.product.name}
                    className="w-9 h-9 rounded-lg object-contain bg-[#20150F] p-0.5 border border-white/10 shrink-0"
                  />
                  <div className="truncate">
                    <p className="text-[#F7F2EA] font-semibold text-xs truncate">
                      {item.product.name}
                    </p>
                    <p className="text-[10px] text-[#D0C2B4]">
                      {item.selectedWeight} × {item.quantity}
                    </p>
                  </div>
                </div>
                <span className="font-mono font-bold text-[#EAD8B5] shrink-0">
                  {formatInr(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-white/10 space-y-1.5 text-[11px] text-[#D0C2B4]">
            <div className="flex justify-between">
              <span>Items Subtotal</span>
              <span className="font-mono text-[#F7F2EA]">{formatInr(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-[#85E3A0]">
                <span>Special Roastery Discount</span>
                <span className="font-mono">-{formatInr(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Express Delivery Fee</span>
              <span>
                {delivery === 0 ? (
                  <strong className="text-[#85E3A0] font-sans font-bold uppercase text-[10px]">
                    FREE
                  </strong>
                ) : (
                  <span className="font-mono text-[#F7F2EA]">{formatInr(delivery)}</span>
                )}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-white/15 text-xs font-bold text-white">
              <span>Total Payable</span>
              <span className="font-sans text-sm font-bold text-[#D7AD36]">
                {formatInr(total)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
