/**
 * SJT FARMS - FIRESTORE REVIEWS SERVICE
 * 
 * Provides live Firestore data operations and real-time listeners for customer reviews.
 * Single source of truth is Cloud Firestore.
 * Zero Google Sheets dependencies.
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  QuerySnapshot,
  DocumentData,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface FirestoreReview {
  id: string;
  userId?: string;
  customerName?: string;
  customerEmail?: string;
  productId?: string;
  author: string;
  rating: number;
  comment: string;
  review?: string;
  title?: string;
  location?: string;
  productName?: string;
  status: 'approved' | 'pending' | 'rejected' | 'hidden';
  verified: boolean;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Real-time listener for reviews collection in Firestore.
 */
export function subscribeToReviews(
  callback: (reviews: FirestoreReview[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, 'reviews');
  return onSnapshot(
    colRef,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const items: FirestoreReview[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const authorName = d.customerName || d.author || d.name || 'Coffee Patron';
        const commentText = d.review || d.comment || '';
        items.push({
          id: docSnap.id,
          userId: d.userId || '',
          customerName: authorName,
          customerEmail: d.customerEmail || '',
          productId: d.productId || '',
          author: authorName,
          rating: Number(d.rating) || 5,
          comment: commentText,
          review: commentText,
          title: d.title || '',
          location: d.location || '',
          productName: d.productName || 'Estate Selection',
          status: d.status || 'approved',
          verified: d.verified !== false,
          date: d.date || d.createdAt?.toDate?.()?.toISOString()?.split('T')[0] || 'Recently',
          createdAt: d.createdAt?.toDate?.()?.toISOString() || d.createdAt || '',
          updatedAt: d.updatedAt?.toDate?.()?.toISOString() || d.updatedAt || '',
        });
      });
      // Sort descending by date
      items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(items);
    },
    (err) => {
      console.warn('[Reviews Service] Real-time listener notice:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Submits a new customer review to Firestore.
 */
export async function submitReviewToFirestore(review: {
  userId?: string;
  customerName?: string;
  customerEmail?: string;
  productId?: string;
  author?: string;
  rating: number;
  comment?: string;
  review?: string;
  title?: string;
  location?: string;
  productName?: string;
}): Promise<string> {
  const authorName = (review.customerName || review.author || 'Coffee Patron').trim();
  const commentText = (review.review || review.comment || '').trim();

  const docRef = await addDoc(collection(db, 'reviews'), {
    userId: review.userId || '',
    customerName: authorName,
    customerEmail: (review.customerEmail || '').trim().toLowerCase(),
    productId: review.productId || 'estate-selection',
    author: authorName,
    rating: Number(review.rating) || 5,
    comment: commentText,
    review: commentText,
    title: review.title?.trim() || '',
    location: review.location?.trim() || '',
    productName: review.productName?.trim() || 'Estate Selection',
    status: 'approved',
    verified: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    date: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
  });

  return docRef.id;
}

/**
 * Updates review approval status in Firestore.
 */
export async function updateReviewStatus(
  id: string,
  status: 'approved' | 'rejected' | 'pending' | 'hidden'
): Promise<void> {
  const docRef = doc(db, 'reviews', id);
  await updateDoc(docRef, {
    status,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Deletes a review from Firestore.
 */
export async function deleteReview(id: string): Promise<void> {
  const docRef = doc(db, 'reviews', id);
  await deleteDoc(docRef);
}
