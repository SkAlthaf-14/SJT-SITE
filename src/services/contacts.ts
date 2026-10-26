import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { ContactInquiry } from '../types';

const CONTACT_STORAGE_KEY = 'sjt_contact_submissions';

export async function submitContactForm(
  inquiry: ContactInquiry
): Promise<{ success: boolean; message: string }> {
  try {
    if (!inquiry.name.trim() || !inquiry.email.trim() || !inquiry.message.trim()) {
      return { success: false, message: 'Please fill in all required fields.' };
    }

    const payload = {
      name: inquiry.name.trim(),
      email: inquiry.email.trim().toLowerCase(),
      phone: inquiry.phone?.trim() || '',
      subject: inquiry.topic || 'General Inquiry',
      message: inquiry.message.trim(),
      status: 'new' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (isFirebaseConfigured) {
      try {
        await addDoc(collection(db, 'contacts'), payload);
      } catch (firestoreErr) {
        console.warn('[Contacts Service] Firestore contact save notice:', firestoreErr);
      }
    }

    // Persist locally for offline resilience
    try {
      const localItem = {
        ...inquiry,
        status: 'new',
        id: `inquiry-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      const existing = JSON.parse(localStorage.getItem(CONTACT_STORAGE_KEY) || '[]');
      localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify([localItem, ...existing]));
    } catch {
      // ignore
    }

    return {
      success: true,
      message: 'Thank you for reaching out. An SJT concierge will respond within 24 hours.',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Failed to submit inquiry. Please try again.',
    };
  }
}

export async function updateContactStatus(
  contactId: string,
  status: 'new' | 'read' | 'replied' | 'closed'
): Promise<void> {
  const docRef = doc(db, 'contacts', contactId);
  await updateDoc(docRef, {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteContactMessage(contactId: string): Promise<void> {
  const docRef = doc(db, 'contacts', contactId);
  await deleteDoc(docRef);
}
