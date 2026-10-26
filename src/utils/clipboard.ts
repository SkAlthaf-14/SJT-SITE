/**
 * SJT FARMS - SAFE CLIPBOARD UTILITY
 * 
 * Provides robust clipboard copy with fallback for older browsers,
 * permission restrictions, or non-secure contexts.
 * Returns true on success, false on failure (never throws).
 */

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined' || !text) {
    return false;
  }

  // 1. Primary: Modern Navigator Clipboard API
  try {
    if (navigator?.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('[Clipboard] navigator.clipboard.writeText rejected, attempting fallback:', err);
  }

  // 2. Secondary Fallback: textarea + document.execCommand
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.warn('[Clipboard] document.execCommand fallback failed:', err);
    return false;
  }
}
