/**
 * Firebase Client SDK Configuration
 * 
 * This module initializes the Firebase client SDK for use in the browser.
 * It provides authentication and Firestore instances for client-side operations.
 * 
 * SECURITY NOTE: Client-side Firebase operations are subject to Firestore Security Rules.
 * Critical operations (flag validation, score updates) MUST go through API Routes.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Lazy initialization variables
let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

/**
 * Get Firebase configuration from environment variables
 */
function getFirebaseConfig() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // Validate required fields only at runtime
  if (typeof window !== "undefined") {
    const requiredKeys = ["apiKey", "authDomain", "projectId", "appId"] as const;
    for (const key of requiredKeys) {
      if (!config[key]) {
        throw new Error(`Missing required Firebase config: ${key}`);
      }
    }
  }

  return config;
}

/**
 * Get or create Firebase app instance
 */
function getOrCreateApp(): FirebaseApp {
  if (_app) {
    return _app;
  }

  if (getApps().length > 0) {
    _app = getApp();
    return _app;
  }

  _app = initializeApp(getFirebaseConfig());
  return _app;
}

/**
 * Get Firebase Auth instance (lazy loaded)
 */
export function getFirebaseAuth(): Auth {
  if (!_auth) {
    _auth = getAuth(getOrCreateApp());
  }
  return _auth;
}

/**
 * Get Firestore instance (lazy loaded)
 */
export function getFirebaseDb(): Firestore {
  if (!_db) {
    _db = getFirestore(getOrCreateApp());
  }
  return _db;
}

// Export lazy getters that only initialize when accessed
// This allows build to succeed without environment variables
export const auth: Auth = typeof window !== "undefined" 
  ? getFirebaseAuth()
  : ({} as Auth);

export const db: Firestore = typeof window !== "undefined"
  ? getFirebaseDb()
  : ({} as Firestore);

export const app: FirebaseApp = typeof window !== "undefined"
  ? getOrCreateApp()
  : ({} as FirebaseApp);
