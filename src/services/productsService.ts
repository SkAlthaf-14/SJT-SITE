/**
 * SJT FARMS - FIRESTORE PRODUCTS SERVICE
 * 
 * Provides live Firestore data operations and real-time listeners for the product catalogue.
 * Single source of truth is Cloud Firestore.
 * Zero Google Sheets dependencies.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Product } from '../types';
import { PRODUCTS as INITIAL_PRODUCTS } from '../data/products';

export interface FirestoreProduct {
  id: string;
  name: string;
  slug: string;
  category: 'Coffee Powder' | 'Filter Coffee' | 'Specialty' | 'Accessories';
  tagline: string;
  description: string;
  longDescription?: string;
  price: number;
  originalPrice?: number;
  stock: number;
  status: 'active' | 'inactive';
  rating: number;
  reviewCount: number;
  imageUrl?: string;
  images: string[];
  weights: string[];
  weightPrices?: Record<string, number>;
  jarImages?: Record<string, string>;
  labelImages?: Record<string, string>;
  labelSvgs?: Record<string, string>;
  verifiedBlendRatio?: string;
  theme?: {
    primary: string;
    secondary: string;
    accent: string;
    badge: string;
    border: string;
    bgGrad: string;
  };
  preparationInstructions?: string[];
  storageInstructions?: string;
  flaggedNotice?: string;
  strength?: 'Mild' | 'Medium' | 'Strong';
  roastLevel?: string;
  flavourNotes?: string[];
  brewMethods?: string[];
  chicoryRatio?: string;
  ingredients?: string;
  shippingInfo?: string;
  featured?: boolean;
  isBestseller?: boolean;
  isNew?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Real-time listener for products collection in Firestore.
 * Automatically unsubscribes when the returned function is called.
 */
export function subscribeToProducts(
  callback: (products: FirestoreProduct[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, 'products');
  return onSnapshot(
    colRef,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const prods: FirestoreProduct[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const staticMatch = INITIAL_PRODUCTS.find(
          (p) => p.id === docSnap.id || p.slug === d.slug || p.id === d.slug
        );

        const primaryImage =
          d.imageUrl ||
          (Array.isArray(d.images) && d.images.length > 0
            ? d.images[0]
            : staticMatch?.images?.[0] || '/images/products/jars/araku-instant-100g-jar.png');

        prods.push({
          id: docSnap.id,
          name: d.name || staticMatch?.name || '',
          slug: d.slug || staticMatch?.slug || docSnap.id,
          category: d.category || staticMatch?.category || 'Coffee Powder',
          tagline: d.tagline || staticMatch?.tagline || '',
          description: d.description || staticMatch?.description || '',
          longDescription: d.longDescription || staticMatch?.longDescription || '',
          price: Number(d.price) || staticMatch?.price || 0,
          originalPrice: d.originalPrice ? Number(d.originalPrice) : staticMatch?.originalPrice,
          stock: Number(d.stock) || staticMatch?.stock || 0,
          status: d.status === 'inactive' ? 'inactive' : 'active',
          rating: Number(d.rating) || staticMatch?.rating || 5,
          reviewCount: Number(d.reviewCount) || staticMatch?.reviewCount || 0,
          imageUrl: primaryImage,
          images: Array.isArray(d.images) && d.images.length > 0 ? d.images : (staticMatch?.images || [primaryImage]),
          weights: Array.isArray(d.weights) && d.weights.length > 0 ? d.weights : (staticMatch?.weights || ['50g', '100g', '250g']),
          weightPrices: d.weightPrices || staticMatch?.weightPrices || {},
          jarImages: d.jarImages || staticMatch?.jarImages,
          labelImages: d.labelImages || staticMatch?.labelImages,
          labelSvgs: d.labelSvgs || staticMatch?.labelSvgs,
          verifiedBlendRatio: d.verifiedBlendRatio || staticMatch?.verifiedBlendRatio,
          theme: d.theme || staticMatch?.theme,
          preparationInstructions: d.preparationInstructions || staticMatch?.preparationInstructions,
          storageInstructions: d.storageInstructions || staticMatch?.storageInstructions,
          flaggedNotice: d.flaggedNotice || staticMatch?.flaggedNotice,
          strength: d.strength || staticMatch?.strength || 'Medium',
          roastLevel: d.roastLevel || staticMatch?.roastLevel || 'Medium Dark',
          flavourNotes: d.flavourNotes || staticMatch?.flavourNotes || [],
          brewMethods: d.brewMethods || staticMatch?.brewMethods || [],
          chicoryRatio: d.chicoryRatio || staticMatch?.chicoryRatio || '',
          ingredients: d.ingredients || staticMatch?.ingredients || '100% Pure Plantation Coffee Beans',
          shippingInfo: d.shippingInfo || staticMatch?.shippingInfo || 'Dispatched freshly roasted within 24 hours',
          featured: Boolean(d.featured ?? staticMatch?.featured),
          isBestseller: Boolean(d.isBestseller ?? staticMatch?.isBestseller),
          isNew: Boolean(d.isNew ?? staticMatch?.isNew),
          createdAt: d.createdAt?.toDate?.()?.toISOString() || d.createdAt || '',
          updatedAt: d.updatedAt?.toDate?.()?.toISOString() || d.updatedAt || '',
        });
      });
      // Sort with coffee products first
      prods.sort((a, b) => {
        if (a.category !== 'Accessories' && b.category === 'Accessories') return -1;
        if (a.category === 'Accessories' && b.category !== 'Accessories') return 1;
        return a.name.localeCompare(b.name);
      });
      callback(prods);
    },
    (err) => {
      console.warn('[Products Service] Real-time listener notice:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Creates or overwrites a product in Firestore.
 */
export async function saveProduct(product: Partial<FirestoreProduct> & { id?: string; name: string }): Promise<string> {
  const id =
    product.id ||
    product.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const docRef = doc(db, 'products', id);

  const imagesList = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : product.imageUrl ? [product.imageUrl] : ['https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80'];

  const primaryImage = product.imageUrl || imagesList[0];

  const payload = {
    ...product,
    id,
    slug: product.slug || id,
    status: product.status || 'active',
    stock: Number(product.stock) || 0,
    price: Number(product.price) || 0,
    imageUrl: primaryImage,
    images: imagesList,
    updatedAt: serverTimestamp(),
  };

  await setDoc(docRef, payload, { merge: true });
  return id;
}

/**
 * Uploads a product image to Firebase Storage and returns the public download URL.
 */
export async function uploadProductImage(file: File): Promise<string> {
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `products/${Date.now()}_${cleanFileName}`;
  const fileRef = ref(storage, storagePath);

  await uploadBytes(fileRef, file);
  const downloadUrl = await getDownloadURL(fileRef);
  return downloadUrl;
}

/**
 * Updates stock level for a product in Firestore.
 */
export async function updateProductStock(id: string, newStock: number): Promise<void> {
  const docRef = doc(db, 'products', id);
  await updateDoc(docRef, {
    stock: Math.max(0, newStock),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Updates price for a product in Firestore.
 */
export async function updateProductPrice(id: string, newPrice: number): Promise<void> {
  const docRef = doc(db, 'products', id);
  await updateDoc(docRef, {
    price: Math.max(0, newPrice),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Toggles product status between active and inactive.
 */
export async function toggleProductStatus(id: string, newStatus: 'active' | 'inactive'): Promise<void> {
  const docRef = doc(db, 'products', id);
  await updateDoc(docRef, {
    status: newStatus,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Deletes a product document from Firestore.
 */
export async function deleteProduct(id: string): Promise<void> {
  const docRef = doc(db, 'products', id);
  await deleteDoc(docRef);
}

/**
 * Seeds initial roastery products to Firestore if the collection is currently empty.
 */
export async function seedCatalogueToFirestoreIfEmpty(): Promise<number> {
  try {
    const snap = await getDocs(collection(db, 'products'));
    if (!snap.empty) {
      return snap.size;
    }

    let seededCount = 0;
    for (const p of INITIAL_PRODUCTS) {
      const docRef = doc(db, 'products', p.id);
      const img = p.images?.[0] || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80';
      await setDoc(docRef, {
        ...p,
        imageUrl: img,
        status: 'active',
        stock: p.stock || 50,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      seededCount++;
    }
    return seededCount;
  } catch (err) {
    console.error('[Products Service] Seed catalogue notice:', err);
    return 0;
  }
}
