import React from 'react';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle' | 'card' | 'product';
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = '',
  variant = 'rect',
  count = 1,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circle':
        return 'rounded-full';
      case 'text':
        return 'h-4 rounded-md';
      case 'card':
        return 'h-48 rounded-2xl';
      case 'product':
        return 'h-80 rounded-2xl';
      case 'rect':
      default:
        return 'rounded-xl';
    }
  };

  const renderSingleSkeleton = (key: number) => {
    if (variant === 'product') {
      return (
        <div
          key={key}
          className="bg-white rounded-2xl p-4 border border-[#DED2C4] shadow-xs space-y-4"
          aria-hidden="true"
        >
          <div className="aspect-[4/3] w-full rounded-xl skeleton-shimmer" />
          <div className="space-y-2">
            <div className="h-3 w-1/3 rounded skeleton-shimmer" />
            <div className="h-5 w-4/5 rounded skeleton-shimmer" />
            <div className="h-3.5 w-full rounded skeleton-shimmer" />
          </div>
          <div className="pt-3 border-t border-[#DED2C4]/60 flex items-center justify-between">
            <div className="h-6 w-16 rounded skeleton-shimmer" />
            <div className="h-9 w-24 rounded-xl skeleton-shimmer" />
          </div>
        </div>
      );
    }

    return (
      <div
        key={key}
        className={`skeleton-shimmer ${getVariantStyles()} ${className}`}
        aria-hidden="true"
      />
    );
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => renderSingleSkeleton(i))}
    </>
  );
};
