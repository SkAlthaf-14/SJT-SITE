import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ArrowLeft,
  Copy,
  Check,
  ShieldCheck,
  Smartphone,
  AlertCircle,
  Download,
} from 'lucide-react';
import { generateQRCode, generateQRCodeDataUrl, validateUpiPayload } from '../../utils/qrGenerator';
import { PAYMENT_CONFIG, buildUpiIntentUri, detectDevicePlatform } from '../../data/paymentConfig';
import { useBodyScrollLock } from '../../utils/scrollLock';
import { formatInr, formatInrValue } from '../../utils/currencyFormatter';
import { copyToClipboard } from '../../utils/clipboard';

interface UpiQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  orderNumberOrId: string | number;
  onProceedToUtrSubmission: () => void;
}

export const UpiQrModal: React.FC<UpiQrModalProps> = ({
  isOpen,
  onClose,
  total,
  orderNumberOrId,
  onProceedToUtrSubmission,
}) => {
  const [copiedUpi, setCopiedUpi] = useState<'idle' | 'success' | 'failure'>('idle');
  const [copiedAmount, setCopiedAmount] = useState<'idle' | 'success' | 'failure'>('idle');
  const [useOfficialStandeeQr, setUseOfficialStandeeQr] = useState(false);
  const [qrPngUrl, setQrPngUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const platform = detectDevicePlatform();

  // Dynamic UPI URI generated specifically for this order and exact amount
  const dynamicUpiUri = useMemo(() => {
    return buildUpiIntentUri({
      amount: total,
      orderNumberOrId,
      merchantVpa: PAYMENT_CONFIG.merchantVpa,
      merchantName: PAYMENT_CONFIG.merchantName,
    });
  }, [total, orderNumberOrId]);

  // Validate payload before rendering
  const payloadValidation = useMemo(() => {
    return validateUpiPayload(dynamicUpiUri);
  }, [dynamicUpiUri]);

  // Generate SVG QR Matrix with maintained library & Error Correction Level H
  const qrData = useMemo(() => {
    if (!payloadValidation.valid) return null;
    try {
      return generateQRCode(dynamicUpiUri, { errorCorrectionLevel: 'H', margin: 4 });
    } catch (e) {
      console.error('[UpiQrModal] QR generation failed:', e);
      return null;
    }
  }, [dynamicUpiUri, payloadValidation.valid]);

  // Asynchronously generate high-res PNG for download
  useEffect(() => {
    let isMounted = true;
    if (isOpen && dynamicUpiUri && payloadValidation.valid) {
      generateQRCodeDataUrl(dynamicUpiUri, 600)
        .then((url) => {
          if (isMounted) setQrPngUrl(url);
        })
        .catch((e) => console.warn('[UpiQrModal] DataURL generation warning:', e));
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, dynamicUpiUri, payloadValidation.valid]);

  // Lock background scroll when QR modal is open
  useBodyScrollLock(isOpen, 'upi-qr-modal');

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

  if (!isOpen) return null;

  const handleCopyUpiId = async () => {
    const success = await copyToClipboard(PAYMENT_CONFIG.merchantVpa);
    setCopiedUpi(success ? 'success' : 'failure');
    setTimeout(() => setCopiedUpi('idle'), 2500);
  };

  const handleCopyAmount = async () => {
    const success = await copyToClipboard(formatInrValue(total));
    setCopiedAmount(success ? 'success' : 'failure');
    setTimeout(() => setCopiedAmount('idle'), 2500);
  };

  const handleDownloadQr = () => {
    if (!qrPngUrl) return;
    setDownloading(true);
    try {
      const a = document.createElement('a');
      a.href = qrPngUrl;
      a.download = `SJT-Farms-Order-${orderNumberOrId}-Payment-QR.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.warn('QR download notice:', e);
    } finally {
      setTimeout(() => setDownloading(false), 1000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="UPI QR Code Payment Panel"
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="min-h-full flex items-start sm:items-center justify-center py-4 sm:py-6">
        <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#D7AD36]/30 overflow-hidden text-[#20150F] animate-scaleIn my-auto z-10">
          {/* PANEL HEADER */}
          <div className="bg-[#20150F] text-[#F7F2EA] p-4 sm:p-5 flex items-center justify-between border-b border-[#D7AD36]/25">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#EAD8B5] hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to methods</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-white/10 text-[#D7AD36]">
                Order #{orderNumberOrId}
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close QR Payment panel"
                className="p-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-5 sm:p-7 space-y-4">
            {/* MERCHANT & PAYABLE AMOUNT BANNER */}
            <div className="text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#B77943]">
                Scan & Pay via any UPI App
              </span>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-xs font-medium text-[#7A6A5E]">Total Payable:</span>
                <span className="font-sans text-3xl font-extrabold text-[#20150F] tracking-tight">
                  {formatInr(total)}
                </span>
                <button
                  type="button"
                  onClick={handleCopyAmount}
                  title="Copy exact amount"
                  className={`text-[10px] font-bold underline cursor-pointer transition-colors ${
                    copiedAmount === 'success'
                      ? 'text-emerald-700'
                      : copiedAmount === 'failure'
                      ? 'text-rose-600'
                      : 'text-[#8C7A6B] hover:text-[#20150F]'
                  }`}
                >
                  {copiedAmount === 'success' ? 'Amount Copied!' : copiedAmount === 'failure' ? 'Copy Failed' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-[#7A6A5E]">
                Authorized Payee:{' '}
                <strong className="text-[#20150F] font-bold">
                  {PAYMENT_CONFIG.merchantName}
                </strong>
              </p>
            </div>

            {/* UNMODIFIED, HIGHEST-CONTRAST 1:1 SQUARE QR CODE (NO COVERING LOGOS) */}
            <div className="flex flex-col items-center justify-center">
              <div className="p-3 sm:p-4 bg-white rounded-2xl border-2 border-[#D7AD36] shadow-lg inline-block relative">
                {useOfficialStandeeQr ? (
                  <img
                    src={PAYMENT_CONFIG.merchantQrImage}
                    alt="Official PhonePe Merchant QR - Venkata Sireesha Gannavaram"
                    className="w-56 h-56 sm:w-60 sm:h-60 object-contain rounded-xl aspect-square"
                  />
                ) : qrData ? (
                  /* Standards-compliant vector QR with guaranteed quiet zone and 1:1 aspect ratio */
                  <div className="w-56 h-56 sm:w-60 sm:h-60 bg-white flex items-center justify-center aspect-square">
                    <svg
                      viewBox={qrData.viewBox}
                      className="w-full h-full aspect-square"
                      shapeRendering="crispEdges"
                      role="img"
                      aria-label={`Payment QR Code for Order #${orderNumberOrId} Amount ${formatInr(total)}`}
                    >
                      <rect width="100%" height="100%" fill="#FFFFFF" />
                      <path d={qrData.svgPath} fill="#20150F" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-56 h-56 sm:w-60 sm:h-60 bg-neutral-50 flex flex-col items-center justify-center p-4 text-center text-xs text-rose-700">
                    <AlertCircle className="w-8 h-8 text-rose-600 mb-2" />
                    <p className="font-bold">QR Generation Failed</p>
                    <p className="text-[11px] text-neutral-600 mt-1">
                      Please use the merchant UPI ID below to pay directly in your app.
                    </p>
                  </div>
                )}
              </div>

              {/* Scannable Verified Tag */}
              <div className="flex items-center gap-2 mt-2.5 text-xs text-[#2E5A3D] font-bold">
                <ShieldCheck className="w-4 h-4 text-[#2E5A3D]" />
                <span>Verified NPCI UPI QR • Zero Covering Overlays</span>
              </div>

              {/* Quick Actions for QR */}
              <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                {qrPngUrl && !useOfficialStandeeQr && (
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="text-[#20150F] hover:text-[#B77943] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#D7AD36]" />
                    <span>{downloading ? 'Downloading...' : 'Save QR to Gallery'}</span>
                  </button>
                )}
                <span className="text-neutral-300">•</span>
                <button
                  type="button"
                  onClick={() => setUseOfficialStandeeQr(!useOfficialStandeeQr)}
                  className="text-[#B77943] hover:underline font-semibold cursor-pointer"
                >
                  {useOfficialStandeeQr ? 'Switch to Dynamic Amount QR' : 'View Official Standee QR'}
                </button>
              </div>
            </div>

            {/* MOBILE-SPECIFIC SCANNER GUIDANCE */}
            {platform.isMobile && (
              <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Smartphone className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Paying on this same phone?</span>
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  UPI apps (PhonePe, GPay, Paytm) don't allow scanning your own screen directly.
                  Tap <strong className="text-amber-950">"Save QR to Gallery"</strong> above, then open PhonePe/GPay, tap the <strong className="text-amber-950">Scanner</strong> icon, and select <strong className="text-amber-950">"Upload from Gallery"</strong> to scan instantly! Or simply copy the UPI ID below.
                </p>
              </div>
            )}

            {/* MERCHANT UPI ID BOX WITH ONE-CLICK COPY */}
            <div className="p-3.5 bg-[#F8F4EC] rounded-2xl border border-[#E5DFD7] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A6B]">
                  Merchant UPI ID / VPA
                </span>
                <span className="text-[10px] font-semibold text-[#5F259F]">
                  PhonePe • Google Pay • Paytm • BHIM
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-xl border border-[#E5DFD7]">
                <code className="font-mono text-xs sm:text-sm font-bold text-[#20150F] select-all truncate pl-1">
                  {PAYMENT_CONFIG.merchantVpa}
                </code>
                <button
                  type="button"
                  onClick={handleCopyUpiId}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs ${
                    copiedUpi === 'success'
                      ? 'bg-emerald-700 text-white'
                      : copiedUpi === 'failure'
                      ? 'bg-rose-700 text-white'
                      : 'bg-[#20150F] hover:bg-[#3B2C24] text-[#F7F2EA]'
                  }`}
                >
                  {copiedUpi === 'success' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#D7AD36]" />
                      <span>Copied!</span>
                    </>
                  ) : copiedUpi === 'failure' ? (
                    <>
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Failed</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy UPI ID</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* STEP-BY-STEP INSTRUCTIONS */}
            <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E5DFD7] text-xs space-y-1.5 text-[#7A6A5E]">
              <span className="font-bold text-[#20150F] uppercase tracking-wider text-[10px] block">
                How to Complete Payment:
              </span>
              <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                <li>Open Google Pay, PhonePe, Paytm, or your banking UPI app.</li>
                <li>Scan the QR code above or pay directly to UPI ID: <strong className="text-[#20150F] font-mono">{PAYMENT_CONFIG.merchantVpa}</strong>.</li>
                <li>Verify recipient name (<strong className="text-[#20150F]">{PAYMENT_CONFIG.merchantName}</strong>) and payable amount (<strong className="text-[#20150F]">{formatInr(total)}</strong>).</li>
                <li>Copy the 12-digit UPI / UTR Reference number from your payment receipt.</li>
                <li>Tap below to submit your UTR for roastery reconciliation.</li>
              </ol>
            </div>

            {/* ACTION BUTTONS */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={onProceedToUtrSubmission}
                className="w-full py-3.5 bg-[#20150F] hover:bg-[#38261C] text-[#F7F2EA] rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-98"
              >
                <Check className="w-4 h-4 text-[#D7AD36]" />
                <span>I've Completed Payment — Enter UTR</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 bg-transparent hover:bg-neutral-100 text-[#7A6A5E] rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel & Return to Payment Methods
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
