import React, { useEffect } from 'react';
import { CreditCard, Building2, X, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { PAYMENT_CONFIG } from '../../data/paymentConfig';
import { useBodyScrollLock } from '../../utils/scrollLock';

interface GatewayNoticeModalProps {
  isOpen: boolean;
  type: 'card' | 'netbanking' | null;
  onClose: () => void;
  onSelectUpi: () => void;
  onSelectCod: () => void;
}

export const GatewayNoticeModal: React.FC<GatewayNoticeModalProps> = ({
  isOpen,
  type,
  onClose,
  onSelectUpi,
  onSelectCod,
}) => {
  // Lock background scroll when notice modal is open
  useBodyScrollLock(isOpen, 'gateway-notice-modal');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !type) return null;

  const isCard = type === 'card';
  const title = isCard ? 'Debit / Credit Card Payment' : 'Net Banking Payment';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="min-h-full flex items-start sm:items-center justify-center py-4 sm:py-6">
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#D7AD36]/30 overflow-hidden text-[#20150F] p-6 space-y-5 animate-scaleIn my-auto z-10">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD7]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F8F4EC] border border-[#E5DFD7] flex items-center justify-center text-[#20150F]">
              {isCard ? <CreditCard className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-serif text-sm font-bold text-[#20150F]">{title}</h2>
              <span className="text-[10px] text-[#7A6A5E]">Payment Gateway Status</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informative Content */}
        <div className="space-y-3 text-xs leading-relaxed text-[#5A483E]">
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
              <span>PhonePe Payment Gateway: Work in Progress (WIP)</span>
            </div>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              Official PhonePe Payment Gateway onboarding is currently in progress. In the interim, SJT Farms operates with zero merchant commission surcharges by processing payments via direct, secure <strong>NPCI UPI rails</strong> (PhonePe, Google Pay, Paytm, BHIM) and <strong>Cash on Delivery</strong>.
            </p>
          </div>

          <div className="space-y-2 pt-1 text-[11px]">
            <p className="font-bold text-[#20150F]">
              How to pay with your {isCard ? 'Debit/Credit Card' : 'Bank Account'}:
            </p>
            <ul className="space-y-1.5 pl-4 list-disc text-[#7A6A5E]">
              <li>
                <strong>Using PhonePe or Google Pay:</strong> Your debit and credit cards linked inside PhonePe, GPay, or Paytm work seamlessly with Rupay credit cards and debit accounts.
              </li>
              <li>
                <strong>Direct Bank Transfer:</strong> All UPI transactions transfer funds directly between Indian bank accounts via IMPS with zero fees.
              </li>
              <li>
                <strong>Cash on Delivery:</strong> Pay cash or scan the delivery executive's UPI QR at your doorstep.
              </li>
            </ul>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="space-y-2 pt-2 border-t border-[#E5DFD7]">
          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectUpi();
            }}
            className="w-full py-3.5 bg-[#20150F] hover:bg-[#38261C] text-[#F7F2EA] rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98"
          >
            <span>Proceed via UPI (PhonePe / GPay / Paytm)</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#D7AD36]" />
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectCod();
            }}
            className="w-full py-2.5 bg-[#F8F4EC] hover:bg-[#EAE2D5] text-[#20150F] rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Switch to Cash on Delivery (COD)
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};
