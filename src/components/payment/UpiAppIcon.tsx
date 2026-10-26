import React from 'react';
import { UpiAppProvider } from '../../data/paymentConfig';

interface UpiAppIconProps {
  provider: UpiAppProvider;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const UpiAppIcon: React.FC<UpiAppIconProps> = ({
  provider,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-11 h-11 rounded-xl',
    lg: 'w-14 h-14 rounded-2xl',
    xl: 'w-16 h-16 rounded-2xl',
  };

  const containerBase = `${sizeClasses[size]} shadow-xs flex items-center justify-center transition-transform shrink-0 overflow-hidden ${className}`;

  switch (provider) {
    case 'any':
      return (
        <div
          className={`${containerBase} bg-white border border-[#E5DFD7] p-1.5`}
          title="Universal UPI"
          aria-label="Universal UPI Logo"
        >
          <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Orange upper arrow */}
            <path d="M28 6L14 20L18.5 24.5L32.5 10.5L28 6Z" fill="#F47920" />
            {/* Green lower arrow */}
            <path d="M34.5 19L20.5 33L25 37.5L39 23.5L34.5 19Z" fill="#0F7938" />
            {/* Dark slate core arrow */}
            <path d="M19 12L9 22L13.5 26.5L23.5 16.5L19 12Z" fill="#4A5568" />
            {/* Crisp bold UPI text */}
            <text x="20" y="32" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontStyle="italic" fontSize="11" fill="#20150F">UPI</text>
          </svg>
        </div>
      );

    case 'gpay':
      return (
        <div
          className={`${containerBase} bg-white border border-[#E5DFD7] p-2`}
          title="Google Pay"
          aria-label="Google Pay Logo"
        >
          <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" fill="#4285F4" />
            <path d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" fill="#34A853" />
            <path d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" fill="#FBBC05" />
            <path d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" fill="#EA4335" />
          </svg>
        </div>
      );

    case 'phonepe':
      return (
        <div
          className={`${containerBase} bg-[#5F259F] border border-[#4D1D82] p-1.5`}
          title="PhonePe"
          aria-label="PhonePe Logo"
        >
          <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Authentic PhonePe Top Matra */}
            <path d="M26.2 13.2c-1.8-2.4-4.3-4.1-7-5.1-1.1-.4-2.1.8-1.4 1.7 2.1 2.4 4.3 4.9 6.2 7 0.8.9 2 .5 2.3-0.6.1-1 .1-2-.1-3z" fill="#FFFFFF" />
            {/* Top horizontal bar */}
            <rect x="10.5" y="16.2" width="27" height="4.2" rx="1.2" fill="#FFFFFF" />
            {/* Right vertical stem */}
            <rect x="28.5" y="16.2" width="4.2" height="23.2" rx="1.2" fill="#FFFFFF" />
            {/* Left curved loop */}
            <path d="M20.2 20.4c-3.3 0-6 2.7-6 6v1.5c0 3.3 2.7 6 6 6h8.3v-4.2h-8.3c-1 0-1.8-.8-1.8-1.8v-1.5c0-1 .8-1.8 1.8-1.8h8.3v-4.2h-8.3z" fill="#FFFFFF" />
          </svg>
        </div>
      );

    case 'paytm':
      return (
        <div
          className={`${containerBase} bg-white border border-[#E5DFD7] p-1.5`}
          title="Paytm"
          aria-label="Paytm Logo"
        >
          <svg viewBox="0 0 54 28" className="w-full h-auto px-0.5" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* "Pay" in #002970 */}
            <path d="M2 18V4h5.6c3.1 0 5 1.6 5 4.3s-1.9 4.3-5 4.3H5.2V18H2zm3.2-8.5h2.2c1.3 0 2.1-.7 2.1-1.8s-.8-1.8-2.1-1.8H5.2v3.6z" fill="#002970" />
            <path d="M17.6 18.2c-2.1 0-3.6-1.2-3.6-3 0-2 1.7-3 4-3.1l2.4-.1v-.7c0-.9-.7-1.4-1.9-1.4-1 0-1.8.4-2.5.9l-1.2-1.6c1.2-.8 2.4-1.2 3.9-1.2 2.8 0 4.4 1.4 4.4 3.8v6.3h-2.8v-1.4c-.8 1.1-1.9 1.5-2.7 1.5zm2.5-4l-1.8.1c-1.1.1-1.8.5-1.8 1.4s.6 1.3 1.5 1.3c.8 0 1.5-.4 1.9-1.1l.2-1.7z" fill="#002970" />
            <path d="M24.2 8.2h3l2.2 6.7 2.4-6.7h3l-4 9.9c-1.1 2.7-2.5 4.1-4.8 4.1-.6 0-1.3-.1-1.9-.4l.6-2c.4.2.8.3 1.2.3 1.2 0 2-.7 2.5-2l.3-.7-4.5-9.2z" fill="#002970" />
            {/* "tm" in #00BAF2 */}
            <path d="M35.6 18V10.5H34V8.4h1.6V5.9h2.8v2.5h2v2.1h-2V17c0 .5.4.8.9.8.4 0 .8-.1 1.1-.3v2c-.5.3-1.2.4-1.8.4-1.9 0-3-1-3-2.7z" fill="#00BAF2" />
            <path d="M42.4 18V8.4h2.7v1.6c.7-1.2 1.8-1.8 3-1.8 1.4 0 2.5.7 3 1.9.8-1.2 2-1.9 3.3-1.9 2.1 0 3.4 1.4 3.4 3.7V18h-2.8v-5.6c0-1.2-.6-2-1.6-2-.9 0-1.6.7-1.9 1.7V18h-2.8v-5.6c0-1.2-.6-2-1.6-2-.9 0-1.6.7-1.9 1.7V18h-2.4z" fill="#00BAF2" />
          </svg>
        </div>
      );

    default:
      return null;
  }
};

