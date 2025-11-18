import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { logger } from '@/utils/logger';
import { firebaseConfig } from '@/config/env';

// Lazy initialization - only initialize when first accessed
let firebaseApp: any = null;
let firestoreDb: any = null;
let firebaseAuth: any = null;
let initialized = false;

function initializeFirebase() {
  if (initialized || typeof window === 'undefined') return;

  try {
    firebaseApp = initializeApp(firebaseConfig);
    firestoreDb = getFirestore(firebaseApp);
    firebaseAuth = getAuth(firebaseApp);
    initialized = true;
  } catch (error) {
    logger.error('❌ Firebase initialization failed:', error);
    logger.error('❌ Error details:', error instanceof Error ? error.message : String(error));
    // Continue without Firebase - app should still work with mock services
  }
}

// Export getters that initialize on first access
export const getFirebaseApp = () => {
  initializeFirebase();
  return firebaseApp;
};

export const getFirebaseDb = () => {
  initializeFirebase();
  return firestoreDb;
};

export const getFirebaseAuth = () => {
  initializeFirebase();
  return firebaseAuth;
};

// For backward compatibility - these will trigger initialization
export const app = (() => { initializeFirebase(); return firebaseApp; })();
export const db = (() => { initializeFirebase(); return firestoreDb; })();
export const auth = (() => { initializeFirebase(); return firebaseAuth; })();
