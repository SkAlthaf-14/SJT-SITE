import type { User as FirebaseUser } from 'firebase/auth';

export interface AuthUser {
  id: string; // Firebase UID
  uid?: string; // UID alias
  email: string;
  name: string;
  avatarUrl: string | null;
  phone?: string;
  provider?: string;
  role?: string;
  confirmedAt?: string;
  createdAt?: string;
  lastLogin?: string;
  rawUser?: FirebaseUser;
}

export type AuthModalMode = 'login' | 'register' | 'forgot-password';

export interface AuthContextType {
  // Central Auth & Role State
  user: AuthUser | null;
  profile: AuthUser | null;
  role: 'admin' | 'customer' | null;
  isLoading: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;

  // Modal UI State
  isAuthModalOpen: boolean;
  authModalMode: AuthModalMode;
  error: string | null;
  successMessage: string | null;

  // Modal Controllers
  openAuthModal: (mode?: AuthModalMode) => void;
  closeAuthModal: () => void;
  clearError: () => void;
  clearSuccessMessage: () => void;

  // Authentication Methods
  login: (email: string, password: string) => Promise<boolean>;
  loginWithEmail: (email: string, password: string) => Promise<boolean>;
  register: (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<boolean>;
  signupWithEmail: (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  logoutUser: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  updateProfileData: (data: { fullName?: string; phone?: string; photoURL?: string }) => Promise<boolean>;
  refreshAdminClaim?: () => Promise<boolean>;
}
