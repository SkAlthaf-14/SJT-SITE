import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search, MessageSquare } from 'lucide-react';
import { FAQS } from '../data/faqs';
import { useNavigation } from '../context/NavigationContext';

export const FAQPage: React.FC = () => {
  const { navigateTo } = useNavigation();

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [openFaqId, setOpenFaqId] = useState<string | null>(FAQS[0].id);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Coffee & Freshness', 'Brewing & Equipment', 'Orders & Shipping', 'Subscriptions'];

  const filteredFaqs = FAQS.filter((faq) => {
    if (activeCategory !== 'All' && faq.category !== activeCategory) return false;
    if (
      searchQuery.trim() &&
      !faq.question.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  return (
    <div className="bg-[var(--coffee-bg)] min-h-screen py-12 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[var(--coffee-caramel)] uppercase tracking-[0.25em] mb-3">
            <HelpCircle className="w-4 h-4" />
            <span>Help Center & Knowledge Base</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[var(--coffee-espresso)] tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-sm sm:text-base text-[var(--coffee-text-muted)] mt-3 font-normal max-w-xl mx-auto leading-relaxed">
            Everything you need to know about our shade-grown roasts, chicory blends, shipping timelines, and subscription perks.
          </p>

          {/* SEARCH BOX */}
          <div className="mt-8 max-w-md mx-auto relative">
            <Search className="w-4 h-4 text-[var(--coffee-text-muted)] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions (e.g. chicory, grind, delivery)..."
              className="w-full pl-11 pr-4 py-3.5 text-sm rounded-xl bg-white border border-[var(--coffee-border)] text-[var(--coffee-espresso)] placeholder-[var(--coffee-text-muted)] focus:outline-none focus:border-[var(--coffee-caramel)] focus:ring-1 focus:ring-[var(--coffee-caramel)] shadow-xs transition-all"
            />
          </div>
        </div>

        {/* CATEGORY PILLS */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs sm:text-sm px-5 py-2.5 rounded-full font-semibold transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-[var(--coffee-espresso)] text-[var(--coffee-cream)] shadow-sm'
                  : 'bg-white border border-[var(--coffee-border)] text-[var(--coffee-espresso)] hover:bg-[var(--coffee-cream)] hover:border-[var(--coffee-caramel)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ ACCORDION LIST */}
        <div className="space-y-4">
          {filteredFaqs.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-[var(--coffee-border)] shadow-xs">
              <p className="font-serif text-xl font-bold text-[var(--coffee-espresso)]">No matching questions found</p>
              <p className="text-sm text-[var(--coffee-text-muted)] mt-1">Try another search term or reach out to our concierge.</p>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-2xl border border-[var(--coffee-border)] overflow-hidden shadow-xs hover:border-[var(--coffee-border-dark)] transition-all duration-200"
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 hover:bg-[var(--coffee-cream)]/40 transition-colors"
                  >
                    <span className="font-serif text-base sm:text-lg font-bold text-[var(--coffee-espresso)]">
                      {faq.question}
                    </span>
                    <span className="w-8 h-8 rounded-full bg-[var(--coffee-cream)] flex items-center justify-center text-[var(--coffee-espresso)] shrink-0 border border-[var(--coffee-border)]">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-[var(--coffee-border)]/60 animate-fadeIn">
                      <p className="text-sm text-[var(--coffee-text-muted)] leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* STILL HAVE QUESTIONS */}
        <div className="mt-14 bg-white rounded-3xl p-8 sm:p-10 border border-[var(--coffee-border)] text-center space-y-4 shadow-sm">
          <h3 className="font-serif text-2xl font-bold text-[var(--coffee-espresso)]">
            Still have questions about your brew?
          </h3>
          <p className="text-sm text-[var(--coffee-text-muted)] max-w-md mx-auto leading-relaxed">
            Our estate coffee concierge is always ready to share custom grinding recommendations, water temperature guidance, and recipe tips.
          </p>
          <button
            onClick={() => navigateTo('contact')}
            className="mt-2 px-7 py-3 bg-[var(--coffee-espresso)] text-[var(--coffee-cream)] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[var(--coffee-roast)] transition-all inline-flex items-center gap-2.5 shadow-sm active:scale-95"
          >
            <MessageSquare className="w-4 h-4 text-[var(--coffee-caramel)]" />
            <span>Chat With Concierge</span>
          </button>
        </div>
      </div>
    </div>
  );
};
