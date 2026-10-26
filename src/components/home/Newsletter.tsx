import React, { useState } from 'react';
import { Mail, CheckCircle2, ArrowRight } from 'lucide-react';
import { subscribeNewsletter } from '../../services/newsletter';

export const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    const res = await subscribeNewsletter(email);
    if (res.success) {
      setStatus('success');
      setEmail('');
    } else {
      setStatus('error');
      setErrorMessage(res.message);
    }
  };

  return (
    <section className="py-14 sm:py-20 lg:py-24 bg-[#2A1812] text-white relative overflow-hidden border-b border-[#3B2418]/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <span className="text-xs font-bold text-[#A66A3F] uppercase tracking-[0.25em] block mb-2 font-sans">
          The SJT Coffee Club
        </span>
        <h2 className="heading-section text-[#FCFAF6] tracking-tight">
          BREW SOMETHING GOOD.
        </h2>
        <p className="text-sm sm:text-base text-[#EFE3D2]/80 mt-2 max-w-xl mx-auto font-normal font-sans">
          Get brewing tips, estate harvest stories, new roast drops, and special offers from SJT Farms delivered to your inbox.
        </p>

        {status === 'success' ? (
          <div className="mt-8 p-4 bg-[#3B2418] rounded-2xl border border-[#A66A3F] max-w-md mx-auto flex items-center justify-center gap-3 text-emerald-300 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-[#EFE3D2]" />
            <span className="text-xs font-semibold text-white">
              Welcome to the SJT Coffee Club! Check your inbox for your welcome note.
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-[#6D625B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === 'error') setStatus('idle');
                  }}
                  placeholder="Enter your email address"
                  className="w-full pl-10 pr-4 py-3.5 text-xs rounded-xl bg-white text-[#2B211C] focus:outline-none focus:ring-2 focus:ring-[#A66A3F]"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 bg-[#A66A3F] hover:bg-[#8B5E3C] text-[#FCFAF6] rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-1.5 shadow-warm-sm shrink-0 cursor-pointer"
              >
                <span>JOIN CLUB</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {status === 'error' && (
              <p className="text-xs text-rose-400 mt-2 text-left">{errorMessage}</p>
            )}
          </form>
        )}

        <p className="text-[11px] text-[#EFE3D2]/50 mt-4">
          No spam, ever. Unsubscribe anytime with 1-click.
        </p>
      </div>
    </section>
  );
};
