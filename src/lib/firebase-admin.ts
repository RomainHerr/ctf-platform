/**
 * Firebase Admin SDK Configuration
 * 
 * This module initializes the Firebase Admin SDK for server-side operations.
 * It is used ONLY in API Routes and server components.
 * 
 * SECURITY CRITICAL:
 * - This file must NEVER be imported in client-side code
 * - The private key must be kept secret and never exposed
 * - All operations bypass Firestore Security Rules (use with caution)
 */

import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

// Lazy initialization variables
let _adminApp: App | null = null;
let _adminAuth: Auth | null = null;
let _adminDb: Firestore | null = null;

/**
 * Checks if required environment variables are present
 */
function hasRequiredEnvVars(): boolean {
  return !!(
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
  );
}

/**
 * Initialize Admin SDK (lazy, singleton pattern)
 */
function getOrCreateAdminApp(): App {
  if (_adminApp) {
    return _adminApp;
  }

  if (getApps().length > 0) {
    _adminApp = getApps()[0];
    return _adminApp;
  }

  if (!hasRequiredEnvVars()) {
    throw new Error(
      "Missing required Firebase Admin environment variables. " +
      "Please set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY."
    );
  }

  // Handle newlines in private key (common issue with env vars)
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(
    /\\n/g,
    "\n"
  );

  _adminApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
      privateKey: privateKey,
    }),
  });

  return _adminApp;
}

/**
 * Get Firebase Admin Auth instance (lazy loaded)
 */
export function getAdminAuth(): Auth {
  if (!_adminAuth) {
    _adminAuth = getAuth(getOrCreateAdminApp());
  }
  return _adminAuth;
}

/**
 * Get Firebase Admin Firestore instance (lazy loaded)
 */
export function getAdminDb(): Firestore {
  if (!_adminDb) {
    _adminDb = getFirestore(getOrCreateAdminApp());
  }
  return _adminDb;
}

// Re-export using getters for backward compatibility
// These will be lazily initialized when accessed
export const adminAuth = {
  verifyIdToken: (token: string, checkRevoked?: boolean) => 
    getAdminAuth().verifyIdToken(token, checkRevoked),
};

export const adminDb = {
  collection: (collectionPath: string) => 
    getAdminDb().collection(collectionPath),
  runTransaction: <T>(
    updateFunction: (transaction: FirebaseFirestore.Transaction) => Promise<T>
  ) => getAdminDb().runTransaction(updateFunction),
};
