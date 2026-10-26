import React from 'react';
import { SubscriptionSection } from '../components/home/SubscriptionSection';
import { ShieldCheck, Truck, RotateCcw, Sparkles } from 'lucide-react';

export const SubscriptionPage: React.FC = () => {
  return (
    <div className="bg-[var(--coffee-bg)] min-h-screen py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* TOP BENEFIT PILLARS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { title: '15% Off Always', desc: 'Guaranteed savings on all recurring deliveries', icon: Sparkles },
            { title: 'Free Express Shipping', desc: 'Complimentary doorstep delivery on every box', icon: Truck },
            { title: 'Flexible Schedule', desc: 'Pause, delay, or swap blend with 1-click', icon: RotateCcw },
            { title: 'Peak Freshness', desc: 'Small-batch roasted within 48h of dispatch', icon: ShieldCheck },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="bg-white p-5 rounded-2xl border border-[var(--coffee-border)] flex items-center gap-4 shadow-xs hover:border-[var(--coffee-border-dark)] transition-all">
                <div className="w-11 h-11 rounded-xl bg-[var(--coffee-cream)] flex items-center justify-center text-[var(--coffee-espresso)] shrink-0 border border-[var(--coffee-border)]">
                  <Icon className="w-5 h-5 text-[var(--coffee-caramel)]" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-[var(--coffee-espresso)]">{item.title}</h4>
                  <p className="text-xs text-[var(--coffee-text-muted)] mt-0.5">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <SubscriptionSection />
    </div>
  );
};
