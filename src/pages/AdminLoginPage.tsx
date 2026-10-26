import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleAuthProvider } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';

export const AdminLoginPage: React.FC = () => {
  const { user, isAdmin, loading } = useAuth();
  const { navigateTo } = useNavigation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already authenticated as admin, redirect to admin console
  React.useEffect(() => {
    if (!loading && user && isAdmin) {
      navigateTo('admin');
    }
  }, [user, isAdmin, loading, navigateTo]);

  const verifyAndRedirectAdmin = async (firebaseUser: any) => {
    // 1. Force refresh ID token to get latest custom claims from Firebase Auth
    const tokenResult = await firebaseUser.getIdTokenResult(true);
    const hasAdminClaim = tokenResult.claims.admin === true;

    // 2. Read authoritative role from Firestore: users/{firebaseUid}
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userDocRef);
    const isFirestoreAdmin = userSnap.exists() && userSnap.data()?.role === 'admin';

    // 3. Strict admin check
    if (!hasAdminClaim && !isFirestoreAdmin) {
      // Immediately deny access and sign out
      await signOut(auth);
      setErrorMessage('Access denied: This account does not possess administrator privileges.');
      return false;
    }

    // 4. Authorized admin — redirect to admin dashboard
    navigateTo('admin');
    return true;
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Please enter both your admin email and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Firebase Authentication login
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      await verifyAndRedirectAdmin(cred.user);
      setIsSubmitting(false);
    } catch (err: any) {
      setIsSubmitting(false);
      console.error('[Admin Login Error]:', err);
      const code = String(err?.code || '').toLowerCase();
      if (
        code.includes('wrong-password') ||
        code.includes('invalid-credential') ||
        code.includes('user-not-found')
      ) {
        setErrorMessage('Invalid administrator credentials. Please check your email and password.');
      } else if (code.includes('too-many-requests')) {
        setErrorMessage('Access temporarily throttled due to multiple failed attempts. Please try again later.');
      } else {
        setErrorMessage(err?.message || 'Authentication failed. Please verify your credentials.');
      }
    }
  };

  const handleGoogleAdminLogin = async () => {
    setErrorMessage(null);
    setIsGoogleSubmitting(true);

    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      await verifyAndRedirectAdmin(cred.user);
      setIsGoogleSubmitting(false);
    } catch (err: any) {
      setIsGoogleSubmitting(false);
      const code = String(err?.code || '').toLowerCase();
      if (code.includes('popup-closed-by-user')) {
        return; // User intentionally closed popup
      }
      console.error('[Admin Google Login Error]:', err);
      setErrorMessage(err?.message || 'Google administrator authentication failed.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-[var(--coffee-bg)] px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-[var(--coffee-border)] shadow-xl space-y-6 animate-fadeIn">
        {/* ICON & TITLE */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-[var(--coffee-espresso)] flex items-center justify-center text-[var(--coffee-cream)] mx-auto border border-[var(--coffee-caramel)]/30 shadow-md">
            <Lock className="w-8 h-8 text-[var(--coffee-caramel)]" />
          </div>
          <span className="text-[10px] font-bold text-[var(--coffee-caramel)] uppercase tracking-[0.25em] block">
            Security Clearance Required
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--coffee-espresso)]">
            Admin Portal Access
          </h1>
          <p className="text-xs text-[var(--coffee-text-muted)] leading-relaxed">
            Strictly for SJT FARMS personnel. All sessions are cryptographically verified via Cloud Firestore.
          </p>
        </div>

        {/* ERROR NOTICE */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* GOOGLE ADMIN SIGN-IN */}
        <button
          type="button"
          onClick={handleGoogleAdminLogin}
          disabled={isGoogleSubmitting || isSubmitting}
          className="w-full py-3 px-4 rounded-xl border border-[var(--coffee-border)] bg-white hover:bg-[var(--coffee-cream)]/30 text-[var(--coffee-espresso)] text-xs font-semibold flex items-center justify-center gap-3 shadow-sm hover:shadow transition-all disabled:opacity-60 cursor-pointer active:scale-98"
        >
          {isGoogleSubmitting ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-[var(--coffee-espresso)] border-t-transparent animate-spin" />
              <span>Verifying Google Admin Credentials...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign In with Google Administrator</span>
            </>
          )}
        </button>

        {/* DIVIDER */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-[var(--coffee-border)] w-full" />
          <span className="bg-white px-3 text-[10px] font-bold text-[var(--coffee-text-muted)] tracking-wider uppercase absolute">
            or with email credentials
          </span>
        </div>

        {/* LOGIN FORM */}
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--coffee-espresso)] mb-1.5 uppercase tracking-wider">
              Administrator Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[var(--coffee-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sjtfarms.com"
                className="w-full pl-10 pr-3 py-3 rounded-xl border border-[var(--coffee-border)] bg-[var(--coffee-cream)]/20 text-xs text-[var(--coffee-espresso)] focus:outline-none focus:border-[var(--coffee-caramel)] focus:ring-1 focus:ring-[var(--coffee-caramel)] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--coffee-espresso)] mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[var(--coffee-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-[var(--coffee-border)] bg-[var(--coffee-cream)]/20 text-xs text-[var(--coffee-espresso)] focus:outline-none focus:border-[var(--coffee-caramel)] focus:ring-1 focus:ring-[var(--coffee-caramel)] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--coffee-text-muted)] hover:text-[var(--coffee-espresso)] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-[var(--coffee-espresso)] text-[var(--coffee-cream)] hover:bg-[var(--coffee-roast)] disabled:opacity-60 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 mt-2 active:scale-95"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-[var(--coffee-cream)] border-t-transparent animate-spin" />
                <span>Verifying Authorization...</span>
              </>
            ) : (
              <>
                <span>Sign In as Administrator</span>
                <ArrowRight className="w-4 h-4 text-[var(--coffee-caramel)]" />
              </>
            )}
          </button>
        </form>

        {/* FOOTER */}
        <div className="pt-2 border-t border-[var(--coffee-border)] flex flex-col items-center gap-2 text-center">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="text-xs text-[var(--coffee-text-muted)] hover:text-[var(--coffee-espresso)] underline cursor-pointer"
          >
            ← Return to Public Storefront
          </button>
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--coffee-caramel)]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Role-Based Access Control • Firestore Rules Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
};
