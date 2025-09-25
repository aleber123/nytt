import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

console.log('🔥 FIREBASE CONFIG MODULE LOADED');

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Lazy initialization - only initialize when first accessed
let firebaseApp: any = null;
let firestoreDb: any = null;
let firebaseAuth: any = null;
let initialized = false;

function initializeFirebase() {
  if (initialized || typeof window === 'undefined') return;

  console.log('🔍 Firebase Config Debug:');
  console.log('🔍 API Key:', firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 20) + '...' : 'UNDEFINED');
  console.log('🔍 API Key length:', firebaseConfig.apiKey?.length);
  console.log('🔍 Project ID:', firebaseConfig.projectId);
  console.log('🔍 Auth Domain:', firebaseConfig.authDomain);
  console.log('🔍 All env vars:', {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'UNDEFINED',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'SET' : 'UNDEFINED',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'SET' : 'UNDEFINED',
  });

  try {
    firebaseApp = initializeApp(firebaseConfig);
    firestoreDb = getFirestore(firebaseApp);
    firebaseAuth = getAuth(firebaseApp);
    initialized = true;
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    console.error('❌ Error details:', error instanceof Error ? error.message : String(error));
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
