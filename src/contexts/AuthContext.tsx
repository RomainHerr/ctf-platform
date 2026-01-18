"use client";

/**
 * Authentication Context Provider
 * 
 * This module provides authentication state and methods throughout the application.
 * It wraps Firebase Authentication with additional functionality like user data
 * management and protected route logic.
 * 
 * SECURITY NOTES:
 * - Token refresh is handled automatically by Firebase
 * - User state is synced with Firestore on auth changes
 * - Email verification status is checked before granting access
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import { User, SignUpCredentials, SignInCredentials } from "@/types";
import {
  validatePassword,
  validateEmail,
  sanitizeDisplayName,
  GENERIC_ERRORS,
} from "@/lib/security";

// ============================================
// Types
// ============================================

interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  error: string | null;
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signOut: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  getIdToken: () => Promise<string | null>;
}

// ============================================
// Context
// ============================================

const AuthContext = createContext<AuthContextType | null>(null);

// ============================================
// Provider
// ============================================

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.ReactElement {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // OAuth providers
  const googleProvider = useMemo(() => new GoogleAuthProvider(), []);
  const githubProvider = useMemo(() => new GithubAuthProvider(), []);

  /**
   * Creates or updates user document in Firestore
   */
  const syncUserData = useCallback(async (firebaseUser: FirebaseUser): Promise<User | null> => {
    try {
      const db = getFirebaseDb();
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // Update last login
        await setDoc(
          userRef,
          {
            lastLoginAt: serverTimestamp(),
            emailVerified: firebaseUser.emailVerified,
          },
          { merge: true }
        );
        return userSnap.data() as User;
      } else {
        // Create new user document
        const newUser: Partial<User> = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: sanitizeDisplayName(firebaseUser.displayName || ""),
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
          score: 0,
          solvedChallenges: [],
          rank: null,
          isAdmin: false,
          isBanned: false,
        };

        await setDoc(userRef, {
          ...newUser,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        });

        return newUser as User;
      }
    } catch (err) {
      console.error("Error syncing user data:", err);
      return null;
    }
  }, []);

  /**
   * Listen to auth state changes
   */
  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const data = await syncUserData(firebaseUser);
        setUserData(data);
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [syncUserData]);

  /**
   * Get ID token for API authentication
   */
  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await user.getIdToken(true);
    } catch {
      return null;
    }
  }, [user]);

  /**
   * Sign up with email and password
   */
  const signUp = useCallback(
    async ({ email, password, displayName }: SignUpCredentials): Promise<void> => {
      setError(null);
      setLoading(true);

      try {
        // Validate email
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
          throw new Error(emailValidation.errors[0]);
        }

        // Validate password
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
          throw new Error(passwordValidation.errors[0]);
        }

        // Create account
        const auth = getFirebaseAuth();
        const { user: newUser } = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Update profile with display name
        const sanitizedName = sanitizeDisplayName(displayName);
        if (sanitizedName) {
          await updateProfile(newUser, { displayName: sanitizedName });
        }

        // Send verification email
        await sendEmailVerification(newUser);

        // Sync user data
        await syncUserData(newUser);
      } catch (err) {
        // Use generic error message to prevent enumeration
        const message =
          err instanceof Error && err.message.includes("email-already-in-use")
            ? GENERIC_ERRORS.AUTH_FAILED
            : err instanceof Error
            ? err.message
            : GENERIC_ERRORS.SERVER_ERROR;
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [syncUserData]
  );

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(
    async ({ email, password }: SignInCredentials): Promise<void> => {
      setError(null);
      setLoading(true);

      try {
        const auth = getFirebaseAuth();
        await signInWithEmailAndPassword(auth, email, password);
      } catch {
        // Always use generic error to prevent enumeration
        setError(GENERIC_ERRORS.INVALID_CREDENTIALS);
        throw new Error(GENERIC_ERRORS.INVALID_CREDENTIALS);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Sign in with Google OAuth
   */
  const signInWithGoogle = useCallback(async (): Promise<void> => {
    setError(null);
    setLoading(true);

    try {
      const auth = getFirebaseAuth();
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const message =
        err instanceof Error && err.message.includes("popup-closed")
          ? "Sign in cancelled"
          : GENERIC_ERRORS.AUTH_FAILED;
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [googleProvider]);

  /**
   * Sign in with GitHub OAuth
   */
  const signInWithGithub = useCallback(async (): Promise<void> => {
    setError(null);
    setLoading(true);

    try {
      const auth = getFirebaseAuth();
      await signInWithPopup(auth, githubProvider);
    } catch (err) {
      const message =
        err instanceof Error && err.message.includes("popup-closed")
          ? "Sign in cancelled"
          : GENERIC_ERRORS.AUTH_FAILED;
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [githubProvider]);

  /**
   * Sign out
   */
  const signOut = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const auth = getFirebaseAuth();
      await firebaseSignOut(auth);
      setUserData(null);
    } catch {
      setError(GENERIC_ERRORS.SERVER_ERROR);
    }
  }, []);

  /**
   * Resend verification email
   */
  const resendVerificationEmail = useCallback(async (): Promise<void> => {
    if (!user) {
      setError("No user logged in");
      return;
    }

    try {
      await sendEmailVerification(user);
    } catch {
      setError(GENERIC_ERRORS.SERVER_ERROR);
      throw new Error(GENERIC_ERRORS.SERVER_ERROR);
    }
  }, [user]);

  /**
   * Send password reset email
   */
  const resetPassword = useCallback(async (email: string): Promise<void> => {
    setError(null);

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.errors[0]);
      throw new Error(emailValidation.errors[0]);
    }

    try {
      const auth = getFirebaseAuth();
      await sendPasswordResetEmail(auth, email);
    } catch {
      // Don't reveal if email exists - always show success
      // This prevents email enumeration attacks
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  // Context value
  const value = useMemo<AuthContextType>(
    () => ({
      user,
      userData,
      loading,
      error,
      signUp,
      signIn,
      signInWithGoogle,
      signInWithGithub,
      signOut,
      resendVerificationEmail,
      resetPassword,
      clearError,
      getIdToken,
    }),
    [
      user,
      userData,
      loading,
      error,
      signUp,
      signIn,
      signInWithGoogle,
      signInWithGithub,
      signOut,
      resendVerificationEmail,
      resetPassword,
      clearError,
      getIdToken,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================
// Hook
// ============================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
