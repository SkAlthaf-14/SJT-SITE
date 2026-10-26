import React, { useState, useEffect } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import type { AuthUser } from '../../types/auth';

interface ProfileAvatarProps {
  user?: AuthUser | FirebaseUser | null;
  photoUrl?: string | null;
  name?: string;
  email?: string;
  size?: 'header' | 'popup' | 'profile' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showBorder?: boolean;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  user,
  photoUrl: propPhotoUrl,
  name: propName,
  email: propEmail,
  size = 'header',
  className = '',
  showBorder = true,
}) => {
  const [imageError, setImageError] = useState(false);

  // Determine display name
  const name =
    propName ||
    (user as any)?.name ||
    (user as any)?.displayName ||
    (user as any)?.rawUser?.displayName ||
    '';

  // Determine email
  const email = propEmail || (user as any)?.email || '';

  // Determine profile photo URL: check Firebase photoURL first, then avatarUrl
  const pictureUrl =
    propPhotoUrl ||
    (user as any)?.photoURL ||
    (user as any)?.avatarUrl ||
    (user as any)?.pictureUrl ||
    (user as any)?.rawUser?.photoURL ||
    null;

  // Reset broken image state if URL changes
  useEffect(() => {
    setImageError(false);
  }, [pictureUrl]);

  // Fallback to user's initials
  // Example: user.name = "Sadika" -> "S", "Arun Kumar" -> "AK"
  const getInitials = (): string => {
    const cleanName = (name || '').trim();
    if (cleanName) {
      const parts = cleanName.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return cleanName.charAt(0).toUpperCase();
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'S';
  };

  const initials = getInitials();

  // Responsive size definitions:
  // - 32px (mobile) to 38px (desktop) in header
  // - 56px (mobile) to 72px (desktop) in account popup
  // - 80px (mobile) to 110px (desktop) in profile page
  let dimensionClasses = 'w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm';
  if (size === 'header' || size === 'md') {
    dimensionClasses = 'w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm';
  } else if (size === 'popup' || size === 'lg') {
    dimensionClasses = 'w-14 h-14 sm:w-[72px] sm:h-[72px] text-xl sm:text-2xl';
  } else if (size === 'profile' || size === 'xl' || size === '2xl') {
    dimensionClasses = 'w-20 h-20 sm:w-[110px] sm:h-[110px] text-2xl sm:text-4xl';
  } else if (size === 'sm') {
    dimensionClasses = 'w-7 h-7 sm:w-8 sm:h-8 text-xs';
  } else if (size === 'xs') {
    dimensionClasses = 'w-6 h-6 text-[10px]';
  }

  const borderClasses = showBorder
    ? 'border-2 border-[#DFBF82]/70 ring-2 ring-[#C49A5A]/30 shadow-xs'
    : '';

  const hasValidPhoto = Boolean(pictureUrl && !imageError);

  if (hasValidPhoto) {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 select-none bg-[#24150F] ${dimensionClasses} ${borderClasses} ${className}`}
      >
        <img
          src={pictureUrl!}
          alt={name ? `${name}'s profile photo` : 'User profile avatar'}
          className="w-full h-full object-cover transition-opacity duration-200"
          onError={() => setImageError(true)}
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      </div>
    );
  }

  // Initials fallback on premium SJT FARMS deep coffee & gold gradient
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full shrink-0 select-none font-serif font-bold tracking-wide bg-gradient-to-br from-[#2D1B11] via-[#24150F] to-[#150B07] text-[#DFBF82] ${dimensionClasses} ${borderClasses} ${className}`}
      aria-label={name ? `${name}'s avatar` : 'User avatar'}
    >
      <span>{initials}</span>
    </div>
  );
};

// Re-export for compatibility
export { ProfileAvatar as GoogleProfileAvatar };
