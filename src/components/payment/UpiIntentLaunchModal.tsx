import React, { useState, useEffect } from 'react';
import {
  Monitor,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  X,
  AlertCircle,
  ShieldCheck,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import {
  UpiAppProvider,
  PAYMENT_CONFIG,
  getUpiAppLaunchConfig,
  detectDevicePlatform,
} from '../../data/paymentConfig';
import { UpiAppIcon } from './UpiAppIcon';
import { useBodyScrollLock } from '../../utils/scrollLock';
import { formatInr } from '../../utils/currencyFormatter';
import { copyToClipboard } from '../../utils/clipboard';

interface UpiIntentLaunchModalProps {
  isOpen: boolean;
  appProvider: UpiAppProvider;
  total: number;
  orderNumberOrId: string | number;
  onClose: () => void;
  onSwitchToQr: () => void;
  onSelectAnotherApp?: (provider: UpiAppProvider) => void;
  onProceedToUtr: () => void;
}

export const UpiIntentLaunchModal: React.FC<UpiIntentLaunchModalProps> = ({
  isOpen,
  appProvider,
  total,
  orderNumberOrId,
  onClose,
  onSwitchToQr,
  onSelectAnotherApp,
  onProceedToUtr,
}) => {
  const [copiedUpi, setCopiedUpi] = useState<'idle' | 'success' | 'failure'>('idle');
  const [copiedBoth, setCopiedBoth] = useState<'idle' | 'success' | 'failure'>('idle');
  const [hasLaunched, setHasLaunched] = useState(false);

  const platform = detectDevicePlatform();
  const launchConfig = getUpiAppLaunchConfig(
    appProvider,
    {
      amount: total,
      orderNumberOrId,
    },
    platform
  );

  const { displayName, targetUri } = launchConfig;

  // Lock background scroll when intent modal is open
  useBodyScrollLock(isOpen, 'upi-intent-launch-modal');

  // Reset launch state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setHasLaunched(false);
    }
  }, [isOpen]);

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

  const handleCopyAndOpenApp = async () => {
    // Copy UPI ID to clipboard first
    const success = await copyToClipboard(PAYMENT_CONFIG.merchantVpa);
    setCopiedBoth(success ? 'success' : 'failure');
    setTimeout(() => setCopiedBoth('idle'), 2500);

    // Launch app
    setHasLaunched(true);
    try {
      window.location.href = targetUri;
    } catch (e) {
      console.warn('App launch error:', e);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${displayName} Payment Dialog`}
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="min-h-full flex items-start sm:items-center justify-center py-4 sm:py-6">
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#D7AD36]/30 overflow-hidden text-[#20150F] p-5 sm:p-7 space-y-4 animate-scaleIn my-auto z-10">
          {/* TOP MODAL HEADER */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD7]">
            <div className="flex items-center gap-3">
              <UpiAppIcon provider={appProvider} size="md" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-sm sm:text-base font-bold text-[#20150F]">
                    {displayName}
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E5DFD7] text-[#B77943]">
                    {platform.isDesktop ? 'Desktop Mode' : platform.isAndroid ? 'Android' : platform.isIOS ? 'iOS' : 'Mobile'}
                  </span>
                </div>
                <span className="text-[11px] text-[#7A6A5E]">
                  Order #{orderNumberOrId} • Secure UPI Intent
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* VERIFIED AMOUNT & RECIPIENT CARD */}
          <div className="p-3.5 bg-[#F8F4EC] rounded-2xl border border-[#E5DFD7] text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#B77943]">
              Verified Payable Order Total
            </span>
            <div className="font-sans text-2xl sm:text-3xl font-extrabold text-[#20150F] tracking-tight">
              {formatInr(total)}
            </div>
            <p className="text-xs text-[#7A6A5E]">
              Authorized Payee:{' '}
              <strong className="text-[#20150F]">{PAYMENT_CONFIG.merchantName}</strong>
            </p>
            <p className="text-[10px] text-[#8C7A6B]">
              {PAYMENT_CONFIG.businessEntityName} • INR Currency
            </p>
          </div>

          {/* CRITICAL SECURITY & DECLINE EXPLANATION ADVISORY */}
          <div className="p-3 bg-amber-50/90 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
              <span>UPI App Security Advisory</span>
            </div>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              If {displayName} shows <strong>&ldquo;Your payment is declined for security reasons&rdquo;</strong>, this is an automated bank policy blocking web-browser links to personal UPI accounts.
            </p>
            <p className="text-[11px] text-amber-950 font-semibold leading-relaxed">
              💡 Solution: Tap <strong>&ldquo;Copy UPI ID & Open App&rdquo;</strong> below, or tap <strong>&ldquo;Switch to QR Code&rdquo;</strong> to scan directly. Both bypass the web security block.
            </p>
          </div>

          {/* PLATFORM-SPECIFIC VIEW */}
          {platform.isDesktop ? (
            /* DESKTOP BROWSER VIEW */
            <div className="space-y-3">
              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs text-neutral-800 space-y-2">
                <div className="flex items-start gap-2.5">
                  <Monitor className="w-5 h-5 text-[#20150F] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#20150F]">
                      Desktop Computer Detected
                    </p>
                    <p className="text-[11px] text-[#7A6A5E] mt-0.5 leading-relaxed">
                      UPI apps run on mobile phones. To complete your payment easily, view the payment QR code and scan with your phone's camera:
                    </p>
                  </div>
                </div>
              </div>

              {/* PRIMARY DESKTOP ACTION: SWITCH TO DYNAMIC QR */}
              <button
                type="button"
                onClick={onSwitchToQr}
                className="w-full py-3.5 bg-[#20150F] hover:bg-[#38261C] text-[#F7F2EA] rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98"
              >
                <QrCode className="w-4 h-4 text-[#D7AD36]" />
                <span>Show QR Code to Scan with {displayName}</span>
              </button>
            </div>
          ) : (
            /* MOBILE BROWSER VIEW (ANDROID & IOS) */
            <div className="space-y-2.5">
              {/* PRIMARY ACTION 1: COPY UPI ID & LAUNCH */}
              <button
                type="button"
                onClick={handleCopyAndOpenApp}
                className="w-full py-3.5 bg-[#20150F] hover:bg-[#38261C] text-[#F7F2EA] rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98 text-center"
              >
                {copiedBoth === 'success' ? (
                  <>
                    <Check className="w-4 h-4 text-[#D7AD36]" />
                    <span>UPI ID Copied! Opening {displayName}...</span>
                  </>
                ) : copiedBoth === 'failure' ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>Opening {displayName}...</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 text-[#D7AD36]" />
                    <span>Open {displayName} (Pay {formatInr(total)})</span>
                  </>
                )}
              </button>

              {/* ACTION 2: SWITCH TO QR CODE (MOST RELIABLE FALLBACK) */}
              <button
                type="button"
                onClick={onSwitchToQr}
                className="w-full py-2.5 bg-[#F8F4EC] hover:bg-[#EAE2D5] text-[#20150F] rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-[#E5DFD7] cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-[#B77943]" />
                <span>Scan Payment QR Code</span>
              </button>

              {/* ACTION 3: TRY ANOTHER APP IF BLOCKED */}
              {hasLaunched && appProvider !== 'any' && onSelectAnotherApp && (
                <button
                  type="button"
                  onClick={() => onSelectAnotherApp('any')}
                  className="w-full py-2 bg-white hover:bg-neutral-50 text-[#7A6A5E] rounded-xl text-[11px] font-semibold border border-dashed border-[#DED2C4] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-[#0F7938]" />
                  <span>Choose Another UPI App (Google Pay / Paytm / CRED)</span>
                </button>
              )}
            </div>
          )}

          {/* COPY MERCHANT UPI ID BOX (MANUAL FALLBACK) */}
          <div className="p-3 bg-white rounded-xl border border-[#E5DFD7] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A6B]">
                Manual Transfer to UPI ID
              </span>
              <button
                type="button"
                onClick={handleCopyUpiId}
                className={`text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                  copiedUpi === 'success'
                    ? 'text-emerald-700'
                    : copiedUpi === 'failure'
                    ? 'text-rose-600'
                    : 'text-[#20150F] hover:text-[#B77943]'
                }`}
              >
                {copiedUpi === 'success' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#2E5A3D]" />
                    <span>Copied!</span>
                  </>
                ) : copiedUpi === 'failure' ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Failed</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <code className="block font-mono text-xs font-bold text-[#20150F] bg-[#F8F4EC] p-2 rounded-lg border border-[#E5DFD7]">
              {PAYMENT_CONFIG.merchantVpa}
            </code>
          </div>

          {/* SECURITY REASSURANCE */}
          <div className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#E5DFD7] flex items-start gap-2 text-[10px] text-[#7A6A5E]">
            <ShieldCheck className="w-4 h-4 text-[#2E5A3D] shrink-0 mt-0.5" />
            <p>
              SJT FARMS never requests your UPI PIN, passwords, or OTPs. Enter your PIN exclusively within your official bank app.
            </p>
          </div>

          {/* MANDATORY UTR SUBMISSION & CONFIRMATION NOTICE */}
          <div className="pt-2 border-t border-[#E5DFD7] space-y-2">
            <button
              type="button"
              onClick={onProceedToUtr}
              className="w-full py-3 bg-[#EAE2D5] hover:bg-[#DDD2C2] text-[#20150F] rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
            >
              <Check className="w-4 h-4 text-[#2E5A3D]" />
              <span>I&apos;ve Paid — Submit 12-Digit UTR</span>
            </button>

            <p className="text-center text-[10px] text-[#8C7A6B]">
              Orders remain pending verification until your UTR is confirmed by roastery accounts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
