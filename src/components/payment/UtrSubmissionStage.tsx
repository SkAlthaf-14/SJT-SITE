import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { validateUtrNumber, formatDisplayOrderId } from '../../services/orders';
import { PAYMENT_CONFIG } from '../../data/paymentConfig';
import { formatInr } from '../../utils/currencyFormatter';
import { copyToClipboard } from '../../utils/clipboard';

interface UtrSubmissionStageProps {
  orderNumberOrId: string | number;
  total: number;
  customerEmail?: string;
  customerPhone?: string;
  isSubmitting: boolean;
  onSubmitUtr: (utrNumber: string) => Promise<{ success: boolean; message: string }>;
  onSkipOrLater: () => void;
}

export type UtrSubmissionPhase = 'idle' | 'submitting' | 'submitted' | 'error';

export const UtrSubmissionStage: React.FC<UtrSubmissionStageProps> = ({
  orderNumberOrId,
  total,
  isSubmitting,
  onSubmitUtr,
  onSkipOrLater,
}) => {
  const [utrValue, setUtrValue] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [submissionPhase, setSubmissionPhase] = useState<UtrSubmissionPhase>('idle');
  const [submittedUtrText, setSubmittedUtrText] = useState<string | null>(null);
  const [showHelperTips, setShowHelperTips] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<'idle' | 'success' | 'failure'>('idle');

  const displayOrderText = formatDisplayOrderId(orderNumberOrId);
  const isBusy = isSubmitting || submissionPhase === 'submitting';

  const handleCopyUpiId = async () => {
    const success = await copyToClipboard(PAYMENT_CONFIG.merchantVpa);
    if (success) {
      setCopyFeedback('success');
    } else {
      setCopyFeedback('failure');
    }
    setTimeout(() => setCopyFeedback('idle'), 2500);
  };

  const executeSubmission = async (cleanUtr: string) => {
    setValidationError(null);
    setIsNetworkError(false);
    setSubmissionPhase('submitting');

    try {
      const result = await onSubmitUtr(cleanUtr);
      if (result.success) {
        setSubmissionPhase('submitted');
        setSubmittedUtrText(cleanUtr);
      } else {
        setSubmissionPhase('error');
        setValidationError(result.message);
        const lowerMsg = (result.message || '').toLowerCase();
        if (
          lowerMsg.includes('network') ||
          lowerMsg.includes('connection') ||
          lowerMsg.includes('offline') ||
          lowerMsg.includes('failed to fetch')
        ) {
          setIsNetworkError(true);
        }
      }
    } catch (err: any) {
      setSubmissionPhase('error');
      setIsNetworkError(true);
      setValidationError(
        err?.message || 'Network communication failure. Please check your connection and tap retry.'
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy) return;

    // Validate UTR format first (strict client-side format validation)
    const val = validateUtrNumber(utrValue);
    if (!val.valid) {
      setSubmissionPhase('error');
      setValidationError(
        val.message || 'Please enter a valid 12-digit UPI / UTR transaction reference number.'
      );
      return;
    }

    const cleanUtr = utrValue.trim();
    await executeSubmission(cleanUtr);
  };

  const handleRetry = async () => {
    if (!utrValue.trim()) return;
    await executeSubmission(utrValue.trim());
  };

  return (
    <section
      aria-labelledby="utr-stage-heading"
      className="w-full max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD7] shadow-warm-md space-y-6 text-[#20150F] animate-fadeIn"
    >
      {/* 1. STAGE HEADER */}
      <div className="text-center space-y-2 border-b border-[#F0EBE3] pb-5">
        <div className="w-12 h-12 rounded-2xl bg-[#F8F4EC] border border-[#D7AD36]/50 flex items-center justify-center text-[#20150F] mx-auto shadow-xs">
          {submissionPhase === 'submitted' ? (
            <CheckCircle2 className="w-6 h-6 text-[#2E5A3D]" />
          ) : (
            <Clock className="w-6 h-6 text-[#D7AD36] animate-pulse" />
          )}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#B77943]">
          Step 2 of 2: Payment Verification Claim
        </span>
        <h2
          id="utr-stage-heading"
          className="font-serif text-xl sm:text-2xl font-extrabold text-[#20150F]"
        >
          {submissionPhase === 'submitted'
            ? 'Payment Reference Submitted'
            : 'Submit Your UPI / Bank Transaction Reference (UTR)'}
        </h2>
        <p className="text-xs text-[#7A6A5E] max-w-md mx-auto leading-relaxed">
          Your order has been allocated as{' '}
          <strong className="text-[#20150F] font-mono">{displayOrderText}</strong>. Enter the
          12-digit reference number from your payment receipt to link your payment to this order.
        </p>
      </div>

      {/* 2. ORDER SUMMARY BANNER */}
      <div className="p-4 bg-[#F8F4EC] rounded-2xl border border-[#E5DFD7] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A6B] block">
            Customer Order Reference
          </span>
          <span className="font-mono text-base font-bold text-[#20150F]">
            {displayOrderText}
          </span>
        </div>

        <div className="sm:text-right border-t sm:border-t-0 border-[#E5DFD7] pt-2 sm:pt-0 w-full sm:w-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A6B] block">
            Authoritative Payable Total
          </span>
          <span className="font-sans text-xl font-black text-[#20150F] tracking-tight">
            {formatInr(total)}
          </span>
        </div>
      </div>

      {/* 3. SUCCESS / SUBMITTED STATE BANNER */}
      {submissionPhase === 'submitted' ? (
        <div
          role="status"
          aria-live="polite"
          className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3 text-emerald-950 animate-fadeIn"
        >
          <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>UTR Claim Recorded Successfully</span>
          </div>
          <p className="text-xs leading-relaxed text-emerald-800">
            Reference <code className="font-mono font-bold bg-white/70 px-1.5 py-0.5 rounded border border-emerald-200">{submittedUtrText}</code> has been linked to order {displayOrderText}. Your order status is now{' '}
            <strong className="font-bold underline">Payment Pending Verification</strong>.
          </p>
          <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs">
            <span className="text-[11px] text-emerald-800">
              Accounts desk will reconcile this transaction before roasting & dispatch.
            </span>
            <button
              type="button"
              onClick={onSkipOrLater}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              View Order Tracking →
            </button>
          </div>
        </div>
      ) : (
        /* 4. UTR ENTRY FORM */
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="utr-input" className="text-xs font-bold text-[#20150F] block">
                12-Digit UPI / UTR Transaction Reference *
              </label>
              <button
                type="button"
                onClick={() => setShowHelperTips(!showHelperTips)}
                className="text-[11px] text-[#B77943] hover:text-[#20150F] flex items-center gap-1 font-semibold cursor-pointer"
                aria-expanded={showHelperTips}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Where do I find this?</span>
                {showHelperTips ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            </div>

            <div className="relative">
              <input
                id="utr-input"
                name="utrNumber"
                type="text"
                maxLength={22}
                value={utrValue}
                onChange={(e) => {
                  setUtrValue(e.target.value.replace(/[^a-zA-Z0-9]/g, ''));
                  if (validationError) {
                    setValidationError(null);
                    setIsNetworkError(false);
                    setSubmissionPhase('idle');
                  }
                }}
                placeholder="e.g. 423589123456 (12-digit numeric reference)"
                aria-invalid={Boolean(validationError)}
                aria-describedby="utr-helper-text utr-error-text"
                className={`w-full text-base sm:text-sm font-mono font-bold px-4 py-3 min-h-[50px] rounded-xl border bg-[#FAF8F5] text-[#20150F] focus:outline-none focus:ring-2 transition-all ${
                  validationError
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                    : 'border-[#DED2C4] focus:border-[#D7AD36] focus:ring-[#D7AD36]/25'
                }`}
                disabled={isBusy}
                autoFocus
                autoComplete="off"
              />
              {utrValue.trim().length === 12 && /^\d{12}$/.test(utrValue.trim()) && !validationError && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <Check className="w-3.5 h-3.5" />
                  <span>12 digits</span>
                </div>
              )}
            </div>

            {/* ERROR FEEDBACK BANNER */}
            {validationError && (
              <div
                id="utr-error-text"
                role="alert"
                aria-live="assertive"
                className="mt-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1.5 animate-fadeIn"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="font-semibold text-rose-900 leading-relaxed">{validationError}</p>
                </div>
                {isNetworkError && (
                  <div className="pl-6 pt-1">
                    <button
                      type="button"
                      onClick={handleRetry}
                      disabled={isBusy}
                      className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Retry Submission</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <p id="utr-helper-text" className="text-[11px] text-[#7A6A5E] mt-1.5">
              Usually labeled as <strong className="text-[#20150F]">&ldquo;UPI Ref No&rdquo;</strong>,{' '}
              <strong className="text-[#20150F]">&ldquo;UTR&rdquo;</strong>, or{' '}
              <strong className="text-[#20150F]">&ldquo;Bank Reference No&rdquo;</strong> on Google Pay, PhonePe, and Paytm receipts.
            </p>
          </div>

          {/* 5. VISUAL APP RECEIPT HELPER ACCORDION */}
          {showHelperTips && (
            <div className="p-4 bg-[#FCFAF6] rounded-2xl border border-[#D7AD36]/40 text-xs space-y-3 animate-fadeIn">
              <h3 className="font-bold text-[#20150F] text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span>Where to find your 12-digit UTR on your receipt:</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                <div className="p-2.5 bg-white rounded-xl border border-[#E5DFD7] space-y-1">
                  <span className="font-bold text-[#5F259F] block">PhonePe</span>
                  <p className="text-[#7A6A5E]">
                    Tap Transaction → Open Transfer Details → Look for{' '}
                    <strong className="text-[#20150F]">UTR: 4235XXXXXXXX</strong>.
                  </p>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-[#E5DFD7] space-y-1">
                  <span className="font-bold text-[#1A73E8] block">Google Pay</span>
                  <p className="text-[#7A6A5E]">
                    Tap Transaction Details → Look for{' '}
                    <strong className="text-[#20150F]">UPI transaction ID</strong> (12 digits starting with current year).
                  </p>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-[#E5DFD7] space-y-1">
                  <span className="font-bold text-[#002970] block">Paytm</span>
                  <p className="text-[#7A6A5E]">
                    Open Passbook / Order → Look for{' '}
                    <strong className="text-[#20150F]">UPI Ref No</strong> (12 digits).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 6. VERIFICATION SAFEGUARD & FORMAT POLICY */}
          <div className="p-3.5 bg-amber-50/90 rounded-2xl border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-950">Payment Verification Policy</p>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                Entering a 12-digit UTR validates only the reference format and registers your payment as{' '}
                <strong>Verification Pending</strong>. Our accounts desk confirms each payment directly against merchant bank statements before orders are roasted, packed, and dispatched.
              </p>
            </div>
          </div>

          {/* 7. MERCHANT UPI ID FALLBACK & COPY BUTTON */}
          <div className="p-3 bg-[#F8F4EC] rounded-xl border border-[#E5DFD7] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="text-center sm:text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A6B] block">
                Need to re-check merchant UPI ID?
              </span>
              <code className="font-mono text-xs font-bold text-[#20150F]">
                {PAYMENT_CONFIG.merchantVpa}
              </code>
            </div>

            <button
              type="button"
              onClick={handleCopyUpiId}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs ${
                copyFeedback === 'success'
                  ? 'bg-emerald-700 text-white'
                  : copyFeedback === 'failure'
                  ? 'bg-rose-700 text-white'
                  : 'bg-[#20150F] text-[#F7F2EA] hover:bg-[#38261C]'
              }`}
            >
              {copyFeedback === 'success' ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>UPI ID Copied!</span>
                </>
              ) : copyFeedback === 'failure' ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Copy Failed (Select Manually)</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy UPI ID</span>
                </>
              )}
            </button>
          </div>

          {/* 8. SUBMIT BUTTON & ACTIONS */}
          <div className="space-y-2.5 pt-2">
            <button
              type="submit"
              disabled={isBusy || !utrValue.trim()}
              className="w-full py-4 bg-[#20150F] hover:bg-[#38261C] text-[#F7F2EA] rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
            >
              {isBusy ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Submitting Payment Reference...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-[#D7AD36]" />
                  <span>Submit Payment Reference</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onSkipOrLater}
              disabled={isBusy}
              className="w-full py-2.5 text-xs font-semibold text-[#7A6A5E] hover:text-[#20150F] text-center transition-colors cursor-pointer"
            >
              I will enter my UTR later on the order tracking page →
            </button>
          </div>
        </form>
      )}
    </section>
  );
};
