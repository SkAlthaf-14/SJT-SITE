import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';
import { useBodyScrollLock } from '../../utils/scrollLock';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    openAuthModal,
    closeAuthModal,
    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    sendPasswordReset,
    isLoading,
    error,
    successMessage,
    clearError,
    clearSuccessMessage,
  } = useAuth();

  // Lock background scroll when auth modal is open
  useBodyScrollLock(isAuthModalOpen, 'auth-modal');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localValidation, setLocalValidation] = useState<string | null>(null);
  const [isGoogleConnecting, setIsGoogleConnecting] = useState(false);

  const handleGoogleSignIn = async () => {
    setLocalValidation(null);
    setIsGoogleConnecting(true);
    try {
      await loginWithGoogle();
    } finally {
      setIsGoogleConnecting(false);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  // Reset form when modal opens or mode changes
  useEffect(() => {
    if (isAuthModalOpen) {
      setLocalValidation(null);
      clearError();
      clearSuccessMessage();
    }
  }, [isAuthModalOpen, authModalMode, clearError, clearSuccessMessage]);

  if (!isAuthModalOpen) return null;

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalValidation(null);

    if (!email.trim() || !password) {
      setLocalValidation('Please enter both your email address and password.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setLocalValidation('Please enter a valid email address.');
      return;
    }

    const success = await loginWithEmail(email, password);
    if (success) {
      setEmail('');
      setPassword('');
    }
  };

  // Handle Signup Submit
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalValidation(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.replace(/\D/g, '');

    if (!cleanName) {
      setLocalValidation('Please enter your full name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setLocalValidation('Please enter a valid email address.');
      return;
    }

    if (cleanPhone.length < 10) {
      setLocalValidation('Please provide a valid 10-digit phone number.');
      return;
    }

    if (password.length < 6) {
      setLocalValidation('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalValidation('Passwords do not match. Please re-enter.');
      return;
    }

    const success = await signupWithEmail({
      fullName: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      password,
    });

    if (success) {
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setConfirmPassword('');
    }
  };

  // Handle Forgot Password Submit
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalValidation(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setLocalValidation('Please enter a valid email address.');
      return;
    }

    await sendPasswordReset(email);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain animate-fadeIn"
      aria-labelledby="auth-modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#160D08]/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={closeAuthModal}
      />

      <div className="min-h-full flex items-start sm:items-center justify-center p-3 sm:p-6 py-6 sm:py-8">
        {/* Modal Container */}
        <div className="relative w-full max-w-md bg-white rounded-3xl border border-[var(--coffee-border)] shadow-2xl overflow-hidden z-10 transition-all duration-300 my-auto">
        {/* Top Decorative Amber Rim */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[var(--coffee-roast)] via-[var(--coffee-caramel)] to-[var(--coffee-cream)]" />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 text-[var(--coffee-text-muted)] hover:text-[var(--coffee-espresso)] hover:bg-[var(--coffee-cream)] rounded-full transition-colors cursor-pointer z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Header & Brand */}
          <div className="text-center mb-6">
            <div className="inline-block mb-3">
              <Logo variant="header" />
            </div>

            {authModalMode === 'login' && (
              <>
                <h2
                  id="auth-modal-title"
                  className="font-serif text-2xl sm:text-3xl font-bold text-[var(--coffee-espresso)] tracking-tight"
                >
                  Welcome Back
                </h2>
                <p className="text-xs sm:text-sm text-[var(--coffee-text-muted)] mt-1">
                  Access your estate coffee subscriptions & orders
                </p>
              </>
            )}

            {authModalMode === 'register' && (
              <>
                <h2
                  id="auth-modal-title"
                  className="font-serif text-2xl sm:text-3xl font-bold text-[var(--coffee-espresso)] tracking-tight"
                >
                  Join the Brew Club
                </h2>
                <p className="text-xs sm:text-sm text-[var(--coffee-text-muted)] mt-1">
                  Create your SJT customer account for farm-fresh privileges
                </p>
              </>
            )}

            {authModalMode === 'forgot-password' && (
              <>
                <h2
                  id="auth-modal-title"
                  className="font-serif text-2xl sm:text-3xl font-bold text-[var(--coffee-espresso)] tracking-tight"
                >
                  Reset Password
                </h2>
                <p className="text-xs sm:text-sm text-[var(--coffee-text-muted)] mt-1">
                  We'll send recovery instructions to your email
                </p>
              </>
            )}
          </div>

          {/* Feedback Alerts */}
          {(error || localValidation) && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{localValidation || error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {authModalMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-[var(--coffee-espresso)] mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--coffee-text-muted)]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--coffee-cream)]/20 border border-[var(--coffee-border)] rounded-xl text-sm text-[var(--coffee-espresso)] placeholder-[var(--coffee-text-muted)] focus:outline-none focus:border-[var(--coffee-caramel)] focus:ring-1 focus:ring-[var(--coffee-caramel)] transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[var(--coffee-espresso)] uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => openAuthModal('forgot-password')}
                    className="text-xs text-[var(--coffee-caramel)] hover:text-[var(--coffee-espresso)] font-medium transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--coffee-text-muted)]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-11 py-2.5 bg-[var(--coffee-cream)]/20 border border-[var(--coffee-border)] rounded-xl text-sm text-[var(--coffee-espresso)] placeholder-[var(--coffee-text-muted)] focus:outline-none focus:border-[var(--coffee-caramel)] focus:ring-1 focus:ring-[var(--coffee-caramel)] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--coffee-text-muted)] hover:text-[var(--coffee-espresso)] transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading || isGoogleConnecting}
                className="w-full py-3 px-4 bg-[var(--coffee-espresso)] hover:bg-[var(--coffee-roast)] text-[var(--coffee-cream)] font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2 active:scale-95"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--coffee-cream)]" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="w-4 h-4 text-[var(--coffee-caramel)]" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--coffee-border)]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-[var(--coffee-text-muted)] uppercase tracking-wider font-semibold">
                    OR
                  </span>
                </div>
              </div>

              {/* Continue with Google */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading || isGoogleConnecting}
                className="w-full py-2.5 px-4 bg-white hover:bg-[var(--coffee-cream)] text-[var(--coffee-espresso)] font-semibold text-xs rounded-xl border border-[var(--coffee-border)] shadow-xs transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 active:scale-95"
              >
                {isGoogleConnecting ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin text-[var(--coffee-caramel)]" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
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
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {/* Register Link */}
              <div className="text-center pt-3 text-xs text-[var(--coffee-text-muted)]">
                New to SJT FARMS?{' '}
                <button
                  type="button"
                  onClick={() => openAuthModal('register')}
                  className="font-bold text-[var(--coffee-caramel)] hover:text-[var(--coffee-espresso)] underline transition-colors cursor-pointer"
                >
                  Create an account
                </button>
              </div>
            </form>
          )}

          {/* 2. REGISTER FORM */}
          {authModalMode === 'register' && (
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-[var(--coffee-espresso)] mb-1 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--coffee-text-muted)]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Aditi Rao"
                    required
                    className="w-full pl-10 pr-4 py-2 bg-[var(--coffee-cream)]/20 border border-[var(--coffee-border)] rounded-xl text-sm text-[var(--coffee-espresso)] placeholder-[var(--coffee-text-muted)] focus:outline-none focus:border-[var(--coffee-caramel)] focus:ring-1 focus:ring-[var(--coffee-caramel)] transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-[var(--coffee-espresso)] mb-1 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--coffee-text-muted)]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="aditi@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2 bg-[var(--coffee-cream)]/20 border border-[var(--coffee-border)] rounded-xl text-sm text-[var(--coffee-espresso)] placeholder-[var(--coffee-text-muted)] focus:outline-none focus:border-[var(--coffee-caramel)] focus:ring-1 focus:ring-[var(--coffee-caramel)] transition-all"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-[var(--coffee-espresso)] mb-1 uppercase tracking-wider">
                  Phone (WhatsApp Delivery Updates)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--coffee-text-muted)]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    required
                    maxLength={10}
                    className="w-full pl-10 pr-4 py-2 bg-[var(--coffee-cream)]/20 border border-[var(--coffee-border)] rounded-xl text-sm text-[var(--coffee-espresso)] placeholder-[var(--coffee-text-muted)] focus:outline-none focus:border-[var(--coffee-caramel)] focus:ring-1 focus:ring-[var(--coffee-caramel)] transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-[var(--coffee-espresso)] mb-1 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--coffee-text-muted)]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    className="w-full pl-10 pr-11 py-2 bg-[var(--coffee-cream)]/20 border border-[var(--coffee-border)] rounded-xl text-sm text-[var(--coffee-espresso)] placeholder-[var(--coffee-text-muted)] focus:outline-none focus:border-[var(--coffee-caramel)] focus:ring-1 focus:ring-[var(--coffee-caramel)] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8A796E] hover:text-[#201814] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-[var(--coffee-espresso)] mb-1 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--coffee-text-muted)]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    className="w-full pl-10 pr-11 py-2 bg-[var(--coffee-cream)]/20 border border-[var(--coffee-border)] rounded-xl text-sm text-[var(--coffee-espresso)] placeholder-[var(--coffee-text-muted)] focus:outline-none focus:border-[var(--coffee-caramel)] focus:ring-1 focus:ring-[var(--coffee-caramel)] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8A796E] hover:text-[#201814] transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Create Account Button */}
              <button
                type="submit"
                disabled={isLoading || isGoogleConnecting}
                className="w-full py-3 px-4 bg-[var(--coffee-espresso)] hover:bg-[var(--coffee-roast)] text-[var(--coffee-cream)] font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-3 active:scale-95"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--coffee-cream)]" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[var(--coffee-caramel)]" />
                    <span>Create account</span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E4D8C8]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#FBF7F0] px-3 text-[#8A796E] uppercase tracking-wider font-semibold">
                    OR
                  </span>
                </div>
              </div>

              {/* Continue with Google */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading || isGoogleConnecting}
                className="w-full py-2.5 px-4 bg-white hover:bg-[#F2EAE0] text-[#201814] font-semibold text-sm rounded-xl border border-[#D5C6B3] shadow-xs hover:shadow-sm transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
              >
                {isGoogleConnecting ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin text-[#C49A5A]" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
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
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {/* Login Link */}
              <div className="text-center pt-2 text-xs text-[#6B5B52]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="font-bold text-[#A37936] hover:text-[#201814] underline transition-colors cursor-pointer"
                >
                  Sign in
                </button>
              </div>
            </form>
          )}

          {/* 3. FORGOT PASSWORD FORM */}
          {authModalMode === 'forgot-password' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--coffee-espresso)] mb-1.5 uppercase tracking-wider">
                  Registered Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--coffee-text-muted)]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--coffee-cream)]/20 border border-[var(--coffee-border)] rounded-xl text-sm text-[var(--coffee-espresso)] placeholder-[var(--coffee-text-muted)] focus:outline-none focus:border-[var(--coffee-caramel)] focus:ring-1 focus:ring-[var(--coffee-caramel)] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[var(--coffee-espresso)] hover:bg-[var(--coffee-roast)] text-[var(--coffee-cream)] font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-95"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--coffee-cream)]" />
                    <span>Sending instructions...</span>
                  </>
                ) : (
                  <span>Send Recovery Instructions</span>
                )}
              </button>

              <div className="text-center pt-2 text-xs text-[var(--coffee-text-muted)]">
                Remembered your password?{' '}
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="font-bold text-[var(--coffee-caramel)] hover:text-[var(--coffee-espresso)] underline transition-colors cursor-pointer"
                >
                  Return to sign in
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};
