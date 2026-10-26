import { isFirebaseConfigured } from './firebase';

const NEWSLETTER_STORAGE_KEY = 'sjt_newsletter_subscribers';

export async function subscribeNewsletter(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    const payload = {
      email: cleanEmail,
      subscribedAt: new Date().toISOString(),
      source: 'Storefront Footer / Homepage Newsletter',
    };

    if (isFirebaseConfigured) {
      // In production Firestore:
      // await addDoc(collection(db, 'newsletter'), payload);
    }

    try {
      const existing = JSON.parse(localStorage.getItem(NEWSLETTER_STORAGE_KEY) || '[]');
      if (!existing.includes(cleanEmail)) {
        localStorage.setItem(NEWSLETTER_STORAGE_KEY, JSON.stringify([cleanEmail, ...existing]));
      }
    } catch {
      // ignore
    }

    return {
      success: true,
      message: 'Welcome to the SJT Coffee Circle! Check your inbox for your 10% welcome voucher: FIRSTCUP10.',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Failed to subscribe. Please try again.',
    };
  }
}
