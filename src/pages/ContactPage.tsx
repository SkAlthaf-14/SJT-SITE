import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, CheckCircle2, Send, HelpCircle, MessageSquare, Sparkles } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { SITE_CONFIG } from '../data/siteConfig';
import { submitContactForm } from '../services/contacts';
import { sendContactNotificationEmail } from '../services/emailService';
import { InstagramIcon } from '../components/common/InstagramIcon';

export const ContactPage: React.FC = () => {
  const { navigateTo } = useNavigation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState('Order & Delivery Query');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMsg('Please fill in your name, email, and message.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    // Submit to Firestore contacts collection
    const result = await submitContactForm({
      name,
      email,
      phone,
      topic,
      message,
    });

    setIsSubmitting(false);

    if (result.success) {
      // Forward notification to Alterit2026@gmail.com
      await sendContactNotificationEmail({ name, email, phone, topic, message });

      setSubmitted(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="bg-[var(--coffee-bg)] min-h-screen py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[var(--coffee-caramel)] uppercase tracking-[0.25em] mb-2 font-sans">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Here For Your Morning Cup</span>
          </div>
          <h1 className="heading-section text-[var(--coffee-espresso)]">
            CONTACT SJT CONCIERGE
          </h1>
          <p className="text-sm text-[var(--coffee-muted)] mt-3 font-normal leading-relaxed">
            Have questions about grind size, farm visits, wholesale inquiries, or your subscription? We are delighted to assist.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* LEFT: CONTACT DETAILS & INFO */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--coffee-border)] shadow-xs space-y-6">
              <h2 className="font-serif text-xl font-bold text-[var(--coffee-espresso)]">
                Reach Out Directly
              </h2>

              <div className="space-y-4 text-xs">
                {/* Phone / WhatsApp */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[var(--coffee-cream)] flex items-center justify-center text-[var(--coffee-espresso)] shrink-0 border border-[var(--coffee-border)]/60">
                    <Phone className="w-4 h-4 text-[var(--coffee-caramel)]" />
                  </div>
                  <div>
                    <span className="font-bold text-[var(--coffee-espresso)] block">Customer Concierge / Phone</span>
                    <span className="text-[var(--coffee-muted)] font-mono text-[11px]">
                      {SITE_CONFIG.contact.phone}
                    </span>
                  </div>
                </div>

                {/* Email Support */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[var(--coffee-cream)] flex items-center justify-center text-[var(--coffee-espresso)] shrink-0 border border-[var(--coffee-border)]/60">
                    <Mail className="w-4 h-4 text-[var(--coffee-caramel)]" />
                  </div>
                  <div>
                    <span className="font-bold text-[var(--coffee-espresso)] block">Email Support</span>
                    <span className="text-[var(--coffee-muted)] font-mono text-[11px]">
                      {SITE_CONFIG.contact.emailSupport}
                    </span>
                  </div>
                </div>

                {/* Farm Location */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[var(--coffee-cream)] flex items-center justify-center text-[var(--coffee-espresso)] shrink-0 border border-[var(--coffee-border)]/60">
                    <MapPin className="w-4 h-4 text-[var(--coffee-caramel)]" />
                  </div>
                  <div>
                    <span className="font-bold text-[var(--coffee-espresso)] block">Farm Estate Location</span>
                    <span className="text-[var(--coffee-muted)] text-[11px]">
                      {SITE_CONFIG.contact.farmLocation}
                    </span>
                    <span className="text-[10px] text-[var(--coffee-caramel)] font-semibold block mt-0.5">
                      Elevation: {SITE_CONFIG.contact.farmElevation}
                    </span>
                  </div>
                </div>

                {/* Dispatch Schedule */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[var(--coffee-cream)] flex items-center justify-center text-[var(--coffee-espresso)] shrink-0 border border-[var(--coffee-border)]/60">
                    <Clock className="w-4 h-4 text-[var(--coffee-caramel)]" />
                  </div>
                  <div>
                    <span className="font-bold text-[var(--coffee-espresso)] block">Operating Hours & Dispatch</span>
                    <span className="text-[var(--coffee-muted)] text-[11px] block">
                      {SITE_CONFIG.contact.businessHours}
                    </span>
                    <span className="text-[var(--coffee-muted)] text-[11px] block mt-0.5">
                      {SITE_CONFIG.contact.dispatchTiming}
                    </span>
                  </div>
                </div>

                {/* Instagram Channel */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[var(--coffee-cream)] flex items-center justify-center text-[var(--coffee-espresso)] shrink-0 border border-[var(--coffee-border)]/60">
                    <InstagramIcon className="w-4 h-4 text-[var(--coffee-caramel)]" />
                  </div>
                  <div>
                    <span className="font-bold text-[var(--coffee-espresso)] block">Official Instagram</span>
                    <a
                      href={SITE_CONFIG.social.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--coffee-caramel)] hover:text-[var(--coffee-espresso)] font-semibold text-[11px] underline transition-colors inline-flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-[var(--coffee-caramel)] rounded-sm"
                      aria-label="Follow SJT Farms on Instagram (@sjt.farms)"
                      title="Follow SJT Farms on Instagram (@sjt.farms)"
                    >
                      @sjt.farms
                    </a>
                    <span className="text-[10px] text-[var(--coffee-muted)] block mt-0.5">
                      Stories, harvest updates & roast showcases
                    </span>
                  </div>
                </div>
              </div>

              {/* QUICK FAQ CTA */}
              <div className="p-4 bg-[var(--coffee-cream)]/60 rounded-2xl border border-[var(--coffee-border)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[var(--coffee-caramel)]" />
                  <span className="text-xs font-semibold text-[var(--coffee-espresso)]">Looking for quick answers?</span>
                </div>
                <button
                  onClick={() => navigateTo('faq')}
                  className="text-xs font-bold text-[var(--coffee-caramel)] underline hover:text-[var(--coffee-espresso)] cursor-pointer"
                >
                  View FAQs
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: CONTACT FORM */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10 border border-[var(--coffee-border)] shadow-xs">
            <h2 className="font-serif text-2xl font-bold text-[var(--coffee-espresso)] mb-1.5">
              Send Us a Message
            </h2>
            <p className="text-xs text-[var(--coffee-muted)] mb-6">
              Fill out the form below and our estate concierge will respond within 24 hours.
            </p>

            {submitted ? (
              <div className="py-12 text-center space-y-3 bg-[var(--coffee-cream)]/40 rounded-2xl border border-[var(--coffee-border)] animate-fade-in">
                <CheckCircle2 className="w-12 h-12 text-[#2E5A3D] mx-auto" />
                <h3 className="font-serif text-xl font-bold text-[var(--coffee-espresso)]">Inquiry Submitted!</h3>
                <p className="text-xs text-[var(--coffee-muted)] max-w-sm mx-auto leading-relaxed">
                  Thank you for writing to SJT Farms. Your message has been safely registered in our concierge queue.
                </p>

                <div className="pt-2">
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-5 py-2.5 bg-[var(--coffee-espresso)] text-[var(--coffee-cream)] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[var(--coffee-roast)] transition-colors cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-[var(--coffee-error)] font-medium">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[var(--coffee-text)] block mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rohith Varma"
                      className="w-full text-xs p-3 rounded-xl border border-[var(--coffee-border)] bg-[var(--coffee-bg)] focus:outline-none focus:border-[var(--coffee-caramel)] focus:ring-1 focus:ring-[var(--coffee-caramel)]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--coffee-text)] block mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rohith@example.com"
                      className="w-full text-xs p-3 rounded-xl border border-[var(--coffee-border)] bg-[var(--coffee-bg)] focus:outline-none focus:border-[var(--coffee-caramel)] focus:ring-1 focus:ring-[var(--coffee-caramel)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[var(--coffee-text)] block mb-1.5">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full text-xs p-3 rounded-xl border border-[var(--coffee-border)] bg-[var(--coffee-bg)] focus:outline-none focus:border-[var(--coffee-caramel)] focus:ring-1 focus:ring-[var(--coffee-caramel)]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--coffee-text)] block mb-1.5">
                      Subject / Topic
                    </label>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-[var(--coffee-border)] bg-[var(--coffee-bg)] focus:outline-none focus:border-[var(--coffee-caramel)] focus:ring-1 focus:ring-[var(--coffee-caramel)] font-medium cursor-pointer"
                    >
                      <option value="Order & Delivery Query">Order & Delivery Tracking</option>
                      <option value="Grind & Brewing Advice">Grind & Brewing Advice</option>
                      <option value="Subscription Assistance">Subscription Assistance</option>
                      <option value="Corporate / Wholesale Gifting">Corporate / Wholesale Gifting</option>
                      <option value="Farm Visit Inquiries">Farm Visit Inquiries</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--coffee-text)] block mb-1.5">
                    Your Message *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How may our coffee team help you today?"
                    className="w-full text-xs p-3 rounded-xl border border-[var(--coffee-border)] bg-[var(--coffee-bg)] focus:outline-none focus:border-[var(--coffee-caramel)] focus:ring-1 focus:ring-[var(--coffee-caramel)]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[var(--coffee-espresso)] text-[var(--coffee-cream)] hover:bg-[var(--coffee-roast)] disabled:opacity-60 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-[var(--coffee-espresso)]/20 cursor-pointer hover:translate-y-[-1px]"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Sending Message...' : 'Send Message to Concierge'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
