/**
 * SJT FARMS - CENTRALIZED BODY SCROLL LOCK MANAGER
 *
 * Provides reference-counted, idempotent scroll locking for all modals, drawers, and overlays.
 *
 * Solves:
 * 1. Modal scroll chaining & background-page scrolling on mobile.
 * 2. Conflicting lock/unlock calls when multiple modals transition or open concurrently.
 * 3. Permanently frozen body scroll if a modal closes via route change or browser Back button.
 * 4. iOS Safari rubber-band background scroll leakage.
 */

import { useEffect, useId } from 'react';

const activeLocks = new Set<string>();
let originalPaddingRight = '';

/**
 * Locks background document scrolling.
 * Multiple components can acquire locks independently using unique IDs.
 * Compensates for scrollbar width to prevent horizontal layout shift (CLS).
 */
export function lockBodyScroll(lockId: string): void {
  if (typeof document === 'undefined') return;

  activeLocks.add(lockId);

  if (activeLocks.size === 1) {
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollBarWidth > 0) {
      originalPaddingRight = document.body.style.paddingRight;
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }
}

/**
 * Releases a scroll lock for the specified ID.
 * Body scrolling is restored only when all active locks have been released.
 */
export function unlockBodyScroll(lockId: string): void {
  if (typeof document === 'undefined') return;

  activeLocks.delete(lockId);

  if (activeLocks.size === 0) {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    document.body.style.paddingRight = originalPaddingRight;
    originalPaddingRight = '';
  }
}

/**
 * Forcibly clears all scroll locks and restores natural page scrolling.
 * Invoked on route navigation and page transitions to guarantee the new page is never frozen.
 */
export function clearAllScrollLocks(): void {
  if (typeof document === 'undefined') return;

  activeLocks.clear();
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
  document.body.style.paddingRight = originalPaddingRight;
  originalPaddingRight = '';
}

/**
 * React hook that manages body scroll locking for a component lifecycle.
 * Automatically cleans up on unmount or when `isLocked` becomes false.
 */
export function useBodyScrollLock(isLocked: boolean, customId?: string): void {
  const autoId = useId();
  const id = customId || autoId;

  useEffect(() => {
    if (isLocked) {
      lockBodyScroll(id);
    } else {
      unlockBodyScroll(id);
    }

    return () => {
      unlockBodyScroll(id);
    };
  }, [isLocked, id]);
}
