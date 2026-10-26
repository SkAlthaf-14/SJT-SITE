import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, googleAuthProvider } from '../firebase';
import type { AuthUser, AuthContextType, AuthModalMode } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local Storage Key for caching basic customer profile
const SJT_AUTH_USER_STORAGE = 'sjt_auth_customer_session';

/**
 * Translates Firebase Authentication error codes into customer-friendly notifications
 */
function formatAuthError(err: any): string {
  if (!err) return 'An unexpected error occurred. Please try again.';

  const code = String(err?.code || '').toLowerCase();
  const message = String(err?.message || err || '').toLowerCase();

  // Wrong password / Invalid credentials
  if (
    code === 'auth/wrong-password' ||
    code === 'auth/invalid-credential' ||
    code === 'auth/invalid-login-credentials' ||
    message.includes('wrong-password') ||
    message.includes('invalid-credential')
  ) {
    return 'The email or password is incorrect. Please verify your credentials and try again.';
  }

  // User not found
  if (
    code === 'auth/user-not-found' ||
    message.includes('user-not-found')
  ) {
    return 'No registered account found with this email. Please check for typos or create an account.';
  }

  // Email already registered
  if (
    code === 'auth/email-already-in-use' ||
    code === 'auth/account-exists-with-different-credential' ||
    message.includes('email-already-in-use')
  ) {
    return 'An account with this email already exists. Please sign in or reset your password.';
  }

  // Invalid email
  if (
    code === 'auth/invalid-email' ||
    message.includes('invalid-email')
  ) {
    return 'The email address format is invalid. Please check and try again.';
  }

  // Weak password
  if (
    code === 'auth/weak-password' ||
    message.includes('weak-password')
  ) {
    return 'Your password must be at least 6 characters in length.';
  }

  // Popup closed by user
  if (
    code === 'auth/popup-closed-by-user' ||
    message.includes('popup-closed-by-user')
  ) {
    return 'Google sign-in was cancelled.';
  }

  // Popup blocked
  if (
    code === 'auth/popup-blocked' ||
    message.includes('popup-blocked')
  ) {
    return 'Google sign-in popup was blocked by your browser. Please allow popups for this site and try again.';
  }

  // Unauthorized domain
  if (
    code === 'auth/unauthorized-domain' ||
    message.includes('unauthorized-domain')
  ) {
    return 'This domain is not authorized for Google Sign-In in Firebase Console. Please add https://sjtfarms-5eaeb.web.app to Authorized Domains.';
  }

  // Network failure
  if (
    code === 'auth/network-request-failed' ||
    message.includes('network-request-failed') ||
    message.includes('failed to fetch') ||
    message.includes('network error')
  ) {
    return 'Network connection problem. Please check your internet connection and try again.';
  }

  // Too many requests
  if (
    code === 'auth/too-many-requests' ||
    message.includes('too-many-requests')
  ) {
    return 'Access to this account has been temporarily disabled due to many failed attempts. Please reset your password or try again later.';
  }

  // User disabled
  if (
    code === 'auth/user-disabled' ||
    message.includes('user-disabled')
  ) {
    return 'This user account has been deactivated. Please contact SJT Farms customer support.';
  }

  return err?.message || 'Unable to process authentication request. Please try again.';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Central Auth State with cached session recovery (role is verified via Firestore)
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const cached = localStorage.getItem(SJT_AUTH_USER_STORAGE);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Security constraint: never trust admin role from localStorage
        return { ...parsed, role: 'customer' };
      }
      return null;
    } catch {
      return null;
    }
  });

  const [role, setRole] = useState<'admin' | 'customer' | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('login');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);
  const clearSuccessMessage = useCallback(() => setSuccessMessage(null), []);

  const openAuthModal = useCallback((mode: AuthModalMode = 'login') => {
    setError(null);
    setSuccessMessage(null);
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setError(null);
  }, []);

  // Update both state and localStorage cache immediately
  const updateActiveUser = useCallback((newUser: AuthUser | null) => {
    setUser(newUser);
    if (newUser) {
      const verifiedRole: 'admin' | 'customer' = newUser.role === 'admin' ? 'admin' : 'customer';
      setRole(verifiedRole);
      setIsAdmin(verifiedRole === 'admin');
      try {
        localStorage.setItem(SJT_AUTH_USER_STORAGE, JSON.stringify(newUser));
        localStorage.setItem(
          'sjt_registered_customer',
          JSON.stringify({
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone || '',
            registeredAt: newUser.createdAt || new Date().toISOString(),
          })
        );
        window.dispatchEvent(new CustomEvent('sjt_customer_updated'));
      } catch (e) {
        console.warn('Could not cache user in localStorage', e);
      }
    } else {
      setRole(null);
      setIsAdmin(false);
      localStorage.removeItem(SJT_AUTH_USER_STORAGE);
      localStorage.removeItem('sjt_registered_customer');
      window.dispatchEvent(new CustomEvent('sjt_customer_updated'));
    }
  }, []);

  /**
   * Single authoritative onAuthStateChanged listener.
   * Reads Firestore: users/{user.uid} to determine role.
   * If role === "admin" -> set role to admin (isAdmin = true).
   * If role === "customer" -> set role to customer (isAdmin = false).
   */
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (!isMounted) return;

        if (firebaseUser) {
          setIsLoading(true);

          let verifiedRole: 'admin' | 'customer' = 'customer';
          let profileData: any = {};

          try {
            // 1. Verify custom claims directly from Firebase Auth ID token
            const idTokenResult = await firebaseUser.getIdTokenResult();
            const hasAdminClaim = idTokenResult.claims.admin === true;

            // 2. Read Firestore: users/{user.uid}
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userSnap = await getDoc(userDocRef);

            if (userSnap.exists()) {
              profileData = userSnap.data();
            }

            if (hasAdminClaim || profileData.role === 'admin') {
              verifiedRole = 'admin';
            } else {
              verifiedRole = 'customer';
            }
          } catch (docErr) {
            console.warn('[SJT Auth] Firestore profile fetch error:', docErr);
          }

          if (!isMounted) return;

          const immediateName =
            profileData.name ||
            firebaseUser.displayName ||
            (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'SJT Patron');

          const verifiedUser: AuthUser = {
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email || profileData.email || '',
            name: immediateName,
            avatarUrl: profileData.photoURL || firebaseUser.photoURL || null,
            phone: profileData.phone || firebaseUser.phoneNumber || '',
            provider:
              firebaseUser.providerData[0]?.providerId === 'google.com'
                ? 'google'
                : 'email',
            role: verifiedRole,
            confirmedAt: firebaseUser.emailVerified ? new Date().toISOString() : undefined,
            createdAt:
              profileData.createdAt?.toDate?.()?.toISOString() ||
              firebaseUser.metadata.creationTime,
            lastLogin: new Date().toISOString(),
            rawUser: firebaseUser,
          };

          updateActiveUser(verifiedUser);
          setRole(verifiedRole);
          setIsAdmin(verifiedRole === 'admin');
          setIsLoading(false);
        } else {
          if (isMounted) {
            updateActiveUser(null);
            setRole(null);
            setIsAdmin(false);
            setIsLoading(false);
          }
        }
      },
      (authErr) => {
        console.error('[SJT Auth Listener Error]:', authErr);
        if (isMounted) {
          updateActiveUser(null);
          setRole(null);
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [updateActiveUser]);

  // 1. EMAIL & PASSWORD LOGIN
  const loginWithEmail = async (email: string, pass: string): Promise<boolean> => {
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const firebaseUser = credential.user;

      // Force refresh ID token to get latest custom claims immediately
      const idTokenResult = await firebaseUser.getIdTokenResult(true);
      const hasAdminClaim = idTokenResult.claims.admin === true;

      // Read Firestore users/{uid} to determine role authoritatively
      let userRole: 'admin' | 'customer' = 'customer';
      let profileData: any = {};
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          profileData = userSnap.data();
        }
        if (hasAdminClaim || profileData.role === 'admin') {
          userRole = 'admin';
        }
        // Update lastLogin in Firestore
        setDoc(
          userDocRef,
          {
            lastLogin: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {});
      } catch (docErr) {
        console.warn('[SJT Auth] Firestore profile fetch on login notice:', docErr);
      }

      const immediateName =
        profileData.name ||
        firebaseUser.displayName ||
        (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'SJT Patron');

      const authUser: AuthUser = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email || profileData.email || '',
        name: immediateName,
        avatarUrl: profileData.photoURL || firebaseUser.photoURL || null,
        phone: profileData.phone || firebaseUser.phoneNumber || '',
        provider: 'email',
        role: userRole,
        confirmedAt: firebaseUser.emailVerified ? new Date().toISOString() : undefined,
        createdAt:
          profileData.createdAt?.toDate?.()?.toISOString() ||
          firebaseUser.metadata.creationTime,
        rawUser: firebaseUser,
      };

      updateActiveUser(authUser);
      setRole(userRole);
      setIsAdmin(userRole === 'admin');
      setIsLoading(false);
      setSuccessMessage(`Welcome back, ${authUser.name}!`);
      closeAuthModal();

      return true;
    } catch (err: any) {
      console.error('[SJT Login Error]:', err);
      setError(formatAuthError(err));
      setIsLoading(false);
      return false;
    }
  };

  // 2. EMAIL & PASSWORD REGISTRATION
  const signupWithEmail = async (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<boolean> => {
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const cleanEmail = data.email.trim();
    const cleanName = data.fullName.trim();
    const cleanPhone = data.phone.trim();

    try {
      // 1. Create user in Firebase Authentication
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, data.password);
      const firebaseUser = credential.user;

      // 2. Set Firebase Auth displayName
      try {
        await updateProfile(firebaseUser, { displayName: cleanName });
      } catch (profErr) {
        console.warn('[SJT Auth] Update profile display name notice:', profErr);
      }

      // 3. Immediately construct AuthUser
      const authUser: AuthUser = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: cleanEmail,
        name: cleanName,
        avatarUrl: null,
        phone: cleanPhone,
        provider: 'email',
        role: 'customer',
        createdAt: new Date().toISOString(),
        rawUser: firebaseUser,
      };

      // 4. Update Central Auth State immediately
      updateActiveUser(authUser);
      setIsLoading(false);
      setSuccessMessage('Account created successfully! Welcome to the SJT Farms family.');
      closeAuthModal();

      // 5. Persist Firestore user profile: users/{firebaseUid}
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      try {
        await setDoc(
          userDocRef,
          {
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
            photoURL: '',
            role: 'customer',
            status: 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (firestoreErr) {
        console.warn('[SJT Auth] Firestore profile save notice:', firestoreErr);
      }

      return true;
    } catch (err: any) {
      console.error('[SJT Signup Error]:', err);
      setError(formatAuthError(err));
      setIsLoading(false);
      return false;
    }
  };

  // 3. GOOGLE POPUP SIGN-IN
  const loginWithGoogle = async (): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const googleUser = result.user;

      // Force refresh ID token to get latest custom claims immediately
      const idTokenResult = await googleUser.getIdTokenResult(true);
      const hasAdminClaim = idTokenResult.claims.admin === true;

      const userDocRef = doc(db, 'users', googleUser.uid);
      let userRole: 'admin' | 'customer' = hasAdminClaim ? 'admin' : 'customer';
      let profileData: any = {};

      try {
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          profileData = userSnap.data();
          if (hasAdminClaim || profileData.role === 'admin') {
            userRole = 'admin';
          }
          // Update lastLogin without overwriting existing role
          setDoc(
            userDocRef,
            {
              lastLogin: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          ).catch((e) => console.warn('Google lastLogin update notice:', e));
        } else {
          // New Google account creation
          setDoc(
            userDocRef,
            {
              name: googleUser.displayName || googleUser.email?.split('@')[0] || 'SJT Patron',
              email: googleUser.email || '',
              phone: googleUser.phoneNumber || '',
              photoURL: googleUser.photoURL || '',
              role: userRole,
              status: 'active',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
            },
            { merge: true }
          ).catch((e) => console.warn('Google user creation notice:', e));
        }
      } catch (docErr) {
        console.warn('[SJT Auth] Firestore Google role check notice:', docErr);
      }

      const cleanName =
        profileData.name ||
        googleUser.displayName ||
        (googleUser.email ? googleUser.email.split('@')[0] : 'SJT Patron');
      const cleanEmail = googleUser.email || '';
      const cleanPhone = googleUser.phoneNumber || profileData.phone || '';
      const photoURL = googleUser.photoURL || profileData.photoURL || '';

      const authUser: AuthUser = {
        id: googleUser.uid,
        uid: googleUser.uid,
        email: cleanEmail,
        name: cleanName,
        avatarUrl: photoURL || null,
        phone: cleanPhone,
        provider: 'google',
        role: userRole,
        createdAt:
          profileData.createdAt?.toDate?.()?.toISOString() ||
          googleUser.metadata.creationTime,
        rawUser: googleUser,
      };

      updateActiveUser(authUser);
      setRole(userRole);
      setIsAdmin(userRole === 'admin');
      setIsLoading(false);
      setSuccessMessage(`Welcome back, ${authUser.name}!`);
      closeAuthModal();

      return true;
    } catch (err: any) {
      console.error('[Google Sign-In Error]:', err);
      setError(formatAuthError(err));
      setIsLoading(false);
      return false;
    }
  };

  // 4. LOGOUT
  const logoutUser = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('[Firebase Logout Notice]:', err);
    } finally {
      updateActiveUser(null);
      setRole(null);
      setIsAdmin(false);
      setIsLoading(false);
      setSuccessMessage('You have been logged out successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // 5. PASSWORD RESET REQUEST
  const sendPasswordReset = async (email: string): Promise<boolean> => {
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMessage(
        'Password recovery instructions have been sent to your email address.'
      );
      return true;
    } catch (err: any) {
      console.error('[Password Recovery Error]:', err);
      setError(formatAuthError(err));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 6. PROFILE DATA UPDATE (Firestore users/{uid} update directly)
  const updateProfileData = async (data: {
    fullName?: string;
    phone?: string;
    photoURL?: string;
  }): Promise<boolean> => {
    if (!auth.currentUser) return false;
    const currentUser = auth.currentUser;
    const uid = currentUser.uid;

    try {
      const updates: any = {};
      const newName = data.fullName !== undefined ? data.fullName.trim() : (user?.name || '');
      const newPhone = data.phone !== undefined ? data.phone.trim() : (user?.phone || '');
      const newPhoto = data.photoURL !== undefined ? data.photoURL.trim() : (user?.avatarUrl || null);

      if (data.fullName !== undefined) updates.name = newName;
      if (data.phone !== undefined) updates.phone = newPhone;
      if (data.photoURL !== undefined) updates.photoURL = newPhoto;
      updates.updatedAt = serverTimestamp();

      // 1. Update Firebase Auth displayName
      if (data.fullName) {
        try {
          await updateProfile(currentUser, { displayName: newName });
        } catch (profErr) {
          console.warn('[SJT Auth] Update profile display name notice:', profErr);
        }
      }

      // 2. Update Firestore users/{uid} directly
      const userDocRef = doc(db, 'users', uid);
      await setDoc(userDocRef, updates, { merge: true });

      // 3. Update local state immediately
      const updatedUser: AuthUser = {
        id: uid,
        uid: uid,
        email: user?.email || currentUser.email || '',
        name: newName,
        phone: newPhone,
        avatarUrl: newPhoto,
        provider: user?.provider || 'email',
        role: role || 'customer',
        createdAt: user?.createdAt,
        rawUser: currentUser,
      };
      updateActiveUser(updatedUser);

      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);

      return true;
    } catch (err: any) {
      console.error('[Update Profile Error]:', err);
      setError(err?.message || 'Failed to update profile');
      return false;
    }
  };

  // 7. Force refresh Firebase Auth ID token and evaluate admin claim
  const refreshAdminClaim = useCallback(async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    try {
      const idTokenResult = await auth.currentUser.getIdTokenResult(true);
      const hasAdminClaim = idTokenResult.claims.admin === true;
      let isFirestoreAdmin = false;
      try {
        const userSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userSnap.exists() && userSnap.data()?.role === 'admin') {
          isFirestoreAdmin = true;
        }
      } catch (err) {
        console.warn('[SJT Auth] Could not check Firestore in refreshAdminClaim:', err);
      }

      const verified = hasAdminClaim || isFirestoreAdmin;
      const targetRole: 'admin' | 'customer' = verified ? 'admin' : 'customer';
      setRole(targetRole);
      setIsAdmin(verified);
      setUser((prev) => (prev ? { ...prev, role: targetRole } : null));
      return verified;
    } catch (e) {
      console.error('[SJT Auth] Failed to refresh token claims:', e);
      return false;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: user,
        role,
        isLoading,
        loading: isLoading,
        isAuthenticated: Boolean(user),
        isAdmin,
        isAuthModalOpen,
        authModalMode,
        error,
        successMessage,
        openAuthModal,
        closeAuthModal,
        clearError,
        clearSuccessMessage,
        login: loginWithEmail,
        loginWithEmail,
        register: signupWithEmail,
        signupWithEmail,
        loginWithGoogle,
        logout: logoutUser,
        logoutUser,
        sendPasswordReset,
        updateProfileData,
        refreshAdminClaim,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
