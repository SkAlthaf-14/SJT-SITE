import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

/**
 * SJT FARMS - SINGLETON FIREBASE INITIALIZATION MODULE
 * Project: sjtfarms-5eaeb
 * Hosting URL: https://sjtfarms-5eaeb.web.app
 */

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export const firebaseConfig: FirebaseClientConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCO30dNxp6Ax0kn5vMCwnMw2Jsfr0LmiCE',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'sjtfarms-5eaeb.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'sjtfarms-5eaeb',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'sjtfarms-5eaeb.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '732402317142',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:732402317142:web:c115fe066a50c73e8d08f7',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-ZGZB3DL3T9',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes('your_firebase_api_key')
);

// Initialize Firebase once and reuse existing instance across the application
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth: Auth = getAuth(app);

// Initialize Cloud Firestore
export const db: Firestore = getFirestore(app);

// Initialize Firebase Storage
export const storage: FirebaseStorage = getStorage(app);

// Pre-configured Google Auth Provider
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
});

