import React from 'react';
import {
  QrCode,
  CreditCard,
  Building2,
  Banknote,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export type OtherPaymentMethodId = 'qr' | 'card' | 'netbanking' | 'cod';

interface OtherPaymentOptionsProps {
  onSelectOption: (id: OtherPaymentMethodId) => void;
  selectedOption?: OtherPaymentMethodId | null;
  codEnabled?: boolean;
}

export const OtherPaymentOptions: React.FC<OtherPaymentOptionsProps> = ({
  onSelectOption,
  selectedOption = null,
  codEnabled = true,
}) => {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-[#20150F] uppercase tracking-wider font-sans">
          Other Payment Options
        </label>
        <span className="text-[11px] text-[#8C7A6B] font-medium hidden sm:inline">
          QR Code, Card & Doorstep payment
        </span>
      </div>

      {/* WHITE CARD WITH ALIGNED ROWS (MATCHES SCREENSHOT REFERENCE) */}
      <div className="bg-white rounded-2xl border border-[#E5DFD7] shadow-xs overflow-hidden divide-y divide-[#F0EBE3]">
        {/* ROW 1: PAY BY UPI QR */}
        <button
          type="button"
          onClick={() => onSelectOption('qr')}
          className={`w-full flex items-center justify-between p-4 sm:p-4.5 text-left transition-colors cursor-pointer group hover:bg-[#FAF7F2] ${
            selectedOption === 'qr' ? 'bg-[#FDF9F2]' : ''
          }`}
        >
          <div className="flex items-center gap-3.5">
            {/* Styled QR Emblem */}
            <div className="w-10 h-10 rounded-xl bg-[#F8F4EC] border border-[#E5DFD7] flex items-center justify-center text-[#20150F] group-hover:scale-105 group-hover:border-[#D7AD36] transition-all shrink-0">
              <QrCode className="w-5 h-5 text-[#20150F]" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-[#20150F] block">
                Pay by UPI QR
              </span>
              <span className="text-[11px] text-[#7A6A5E] block mt-0.5">
                Scan QR using any UPI app (GPay, PhonePe, Paytm, CRED)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pl-2 text-[#8C7A6B] group-hover:text-[#20150F] transition-colors shrink-0">
            <span className="text-[11px] font-semibold text-[#D7AD36] hidden sm:inline">
              Instant Scan
            </span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        {/* ROW 2: DEBIT / CREDIT CARD */}
        <button
          type="button"
          onClick={() => onSelectOption('card')}
          className={`w-full flex items-center justify-between p-4 sm:p-4.5 text-left transition-colors cursor-pointer group hover:bg-[#FAF7F2] ${
            selectedOption === 'card' ? 'bg-[#FDF9F2]' : ''
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#F8F4EC] border border-[#E5DFD7] flex items-center justify-center text-[#20150F] group-hover:scale-105 group-hover:border-[#D7AD36] transition-all shrink-0">
              <CreditCard className="w-5 h-5 text-[#20150F]" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-[#20150F] block">
                Debit / Credit Card
              </span>
              <span className="text-[11px] text-[#7A6A5E] block mt-0.5">
                Visa, MasterCard, RuPay (via UPI & Gateway)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pl-2 shrink-0">
            {/* Card Brand Badges (Matches screenshot logos) */}
            <div className="flex items-center gap-1.5">
              <span className="font-sans font-black italic text-[10px] text-[#1A1F71] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                VISA
              </span>
              <div className="flex -space-x-1 items-center bg-red-50 px-1 py-0.5 rounded border border-red-200">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EB001B] inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#F79E1B] inline-block opacity-85" />
              </div>
              <span className="font-sans font-extrabold text-[9px] text-[#097938] bg-green-50 px-1 py-0.5 rounded border border-green-200">
                RuPay
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8C7A6B] group-hover:text-[#20150F] group-hover:translate-x-0.5 transition-all" />
          </div>
        </button>

        {/* ROW 3: NET BANKING */}
        <button
          type="button"
          onClick={() => onSelectOption('netbanking')}
          className={`w-full flex items-center justify-between p-4 sm:p-4.5 text-left transition-colors cursor-pointer group hover:bg-[#FAF7F2] ${
            selectedOption === 'netbanking' ? 'bg-[#FDF9F2]' : ''
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#F8F4EC] border border-[#E5DFD7] flex items-center justify-center text-[#20150F] group-hover:scale-105 group-hover:border-[#D7AD36] transition-all shrink-0">
              <Building2 className="w-5 h-5 text-[#20150F]" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-[#20150F] block">
                Net Banking
              </span>
              <span className="text-[11px] text-[#7A6A5E] block mt-0.5">
                All major Indian banks supported (SBI, HDFC, ICICI, Axis)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pl-2 text-[#8C7A6B] group-hover:text-[#20150F] transition-colors shrink-0">
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        {/* ROW 4: CASH ON DELIVERY */}
        {codEnabled && (
          <button
            type="button"
            onClick={() => onSelectOption('cod')}
            className={`w-full flex items-center justify-between p-4 sm:p-4.5 text-left transition-colors cursor-pointer group hover:bg-[#FAF7F2] ${
              selectedOption === 'cod' ? 'bg-[#FDF9F2]' : ''
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#F8F4EC] border border-[#E5DFD7] flex items-center justify-center text-[#20150F] group-hover:scale-105 group-hover:border-[#D7AD36] transition-all shrink-0">
                <Banknote className="w-5 h-5 text-[#2E5A3D]" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-[#20150F] block flex items-center gap-1.5">
                  <span>Cash on Delivery</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#E8F3EC] text-[#2E5A3D] uppercase">
                    Doorstep
                  </span>
                </span>
                <span className="text-[11px] text-[#7A6A5E] block mt-0.5">
                  Pay cash or UPI upon delivery by logistics agent
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pl-2 text-[#8C7A6B] group-hover:text-[#20150F] transition-colors shrink-0">
              <span className="text-[10px] font-bold text-[#2E5A3D] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hidden sm:inline">
                Available
              </span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        )}
      </div>
    </div>
  );
};
