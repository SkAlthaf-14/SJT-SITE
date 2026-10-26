import React from 'react';
import { Coffee } from 'lucide-react';

interface LogoProps {
  variant?: 'header' | 'footer' | 'compact' | 'light';
  className?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({ variant = 'header', className = '', onClick }) => {
  const isLight = variant === 'light';
  const isFooter = variant === 'footer';

  const badgeBg = isLight
    ? 'bg-[#EFE3D2] text-[#2A1812] border-[#DED2C4]'
    : 'bg-[#2A1812] text-[#EFE3D2] border-[#A66A3F]/30';

  const brandColor = isLight ? 'text-[#FCFAF6]' : 'text-[#2B211C]';
  const taglineColor = isLight ? 'text-[#EFE3D2]' : 'text-[#A66A3F]';

  const [imgError, setImgError] = React.useState(false);

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2 sm:gap-2.5 select-none cursor-pointer group text-left ${className}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.();
        }
      }}
      aria-label="SJT FARMS — Farm to Cup"
    >
      {/* Icon / Authentic Emblem Badge */}
      <div
        className={`flex-shrink-0 w-7 h-7 min-[360px]:w-8 min-[360px]:h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border shadow-subtle transition-transform duration-200 group-hover:scale-105 overflow-hidden p-0.5 ${badgeBg}`}
      >
        {!imgError ? (
          <img
            src="/images/sjt_farms_authentic_logo.png"
            alt="SJT Farms"
            className="w-full h-full object-contain filter drop-shadow-sm"
            onError={() => setImgError(true)}
          />
        ) : (
          <Coffee className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
        )}
      </div>

      {/* Brand & Tagline typography */}
      {isFooter ? (
        <div className="flex flex-col">
          <span className={`font-serif tracking-widest text-lg sm:text-xl font-bold uppercase whitespace-nowrap ${brandColor}`}>
            SJT FARMS
          </span>
          <span className={`text-[9px] sm:text-[10px] tracking-[0.25em] font-semibold uppercase ${taglineColor}`}>
            Farm to Cup
          </span>
        </div>
      ) : (
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center whitespace-nowrap">
            <span
              className={`font-serif tracking-wider sm:tracking-widest text-xs min-[360px]:text-sm sm:text-lg md:text-xl font-extrabold uppercase whitespace-nowrap transition-colors duration-200 group-hover:text-[#A66A3F] ${brandColor}`}
            >
              SJT FARMS
            </span>

            {/* Inline separator and tagline for horizontal layout on screens >= 480px */}
            <span className="hidden min-[480px]:inline-block mx-1.5 text-xs text-[#A66A3F]/50 font-light">
              •
            </span>
            <span
              className={`hidden min-[480px]:inline-block text-[9px] sm:text-[10px] tracking-[0.22em] font-bold uppercase ${taglineColor}`}
            >
              Farm to Cup
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
