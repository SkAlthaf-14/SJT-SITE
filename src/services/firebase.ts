/**
 * SJT FARMS - FIREBASE SERVICE PROXY
 * 
 * Re-exports the singleton Firebase initialization from src/firebase.ts
 * to prevent duplicate app initialization.
 */

export {
  app,
  auth,
  db,
  storage,
  googleAuthProvider,
  firebaseConfig,
  isFirebaseConfigured,
  type FirebaseClientConfig,
} from '../firebase';

