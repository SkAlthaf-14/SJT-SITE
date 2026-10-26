import React from 'react';
import { Coffee, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon | React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: IconProp = Coffee,
  title,
  description,
  actionText,
  actionLabel,
  onAction,
  className = '',
}) => {
  const buttonLabel = actionLabel || actionText;

  // Support both component reference (LucideIcon) and direct JSX node
  const renderIcon = () => {
    if (React.isValidElement(IconProp)) {
      return IconProp;
    }
    if (typeof IconProp === 'function') {
      const IconComponent = IconProp as LucideIcon;
      return <IconComponent className="w-6 h-6 text-[var(--coffee-caramel)]" />;
    }
    return <Coffee className="w-6 h-6 text-[var(--coffee-caramel)]" />;
  };

  return (
    <div
      className={`p-8 sm:p-12 text-center rounded-3xl bg-[var(--coffee-warm-white)] border border-[var(--coffee-border)] space-y-4 max-w-lg mx-auto shadow-xs ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-[var(--coffee-cream)] border border-[var(--coffee-border)] flex items-center justify-center text-[var(--coffee-caramel)] mx-auto shadow-xs">
        {renderIcon()}
      </div>

      <div className="space-y-1.5">
        <h3 className="font-serif text-lg sm:text-xl font-bold text-[var(--coffee-espresso)]">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-[var(--coffee-text-muted)] leading-relaxed max-w-md mx-auto">
          {description}
        </p>
      </div>

      {buttonLabel && onAction && (
        <div className="pt-2">
          <button
            onClick={onAction}
            className="btn-primary text-xs py-2.5 px-6 rounded-xl font-bold cursor-pointer transition-all shadow-xs"
          >
            {buttonLabel}
          </button>
        </div>
      )}
    </div>
  );
};
