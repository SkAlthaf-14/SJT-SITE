import React, { useState, useEffect } from 'react';
import { X, UserCheck, CheckCircle2, AlertCircle, Loader2, Sparkles, Phone, Mail, User } from 'lucide-react';
import { useBodyScrollLock } from '../../utils/scrollLock';

interface CustomerRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (customer: { name: string; email: string; phone: string }) => void;
}

export const CustomerRegistrationModal: React.FC<CustomerRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Lock background scroll when registration modal is open
  useBodyScrollLock(isOpen, 'customer-registration-modal');

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

  // Pre-fill existing data if available
  useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem('sjt_customer');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.name) setName(parsed.name);
          if (parsed.email) setEmail(parsed.email);
          if (parsed.phone) setPhone(parsed.phone);
        }
      } catch {
        // ignore
      }
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const customerData = { name: name.trim(), email: email.trim(), phone: cleanPhone };
      localStorage.setItem('sjt_customer', JSON.stringify(customerData));
      window.dispatchEvent(new Event('sjt_customer_updated'));

      setSuccessMessage('Customer registration successfully saved!');
      onSuccess?.(customerData);

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(
        err?.message || 'An unexpected error occurred while saving registration. Please retry.'
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Customer Registration"
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-[#24150F]/75 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="min-h-full flex items-start sm:items-center justify-center py-4 sm:py-6">
        <div className="relative bg-[#F7F2EA] w-full max-w-md rounded-3xl p-6 sm:p-8 border border-[#E4D8C8] shadow-2xl z-10 my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#6B5B52] hover:text-[#24150F] rounded-full hover:bg-white/80 transition-colors focus:outline-none"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-5">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[var(--coffee-caramel)] uppercase tracking-[0.2em] mb-1 font-sans">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SJT Customer Club</span>
          </div>
          <h3 className="font-serif text-2xl font-bold text-[var(--coffee-espresso)]">
            Customer Registration
          </h3>
          <p className="text-xs text-[var(--coffee-muted)] mt-1">
            Register your details for order tracking, personalized roasts, and exclusive estate privileges.
          </p>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold">Registration Saved</p>
              <p className="mt-0.5 text-emerald-800 leading-relaxed">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold">Notice</p>
              <p className="mt-0.5 text-rose-800 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#201814] block mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#948277] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-[#E4D8C8] bg-white text-[#201814] focus:outline-none focus:border-[#C49A5A]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#201814] block mb-1.5">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#948277] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. ramesh@example.com"
                className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-[#E4D8C8] bg-white text-[#201814] focus:outline-none focus:border-[#C49A5A]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#201814] block mb-1.5">
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#948277] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                maxLength={14}
                className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-[#E4D8C8] bg-white text-[#201814] focus:outline-none focus:border-[#C49A5A]"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#24150F] text-[#DFBF82] hover:bg-[#342017] disabled:opacity-60 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#C49A5A]" />
                  <span>Saving to Customers Sheet...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 text-[#C49A5A]" />
                  <span>Register Customer</span>
                </>
              )}
            </button>
          </div>
        </form>

        <p className="text-[11px] text-[#948277] text-center mt-4">
          Safe registration • We never store or share private banking credentials.
        </p>
      </div>
      </div>
    </div>
  );
};
