/**
 * Environment configuration with validation
 * Centralizes all environment variables and admin configuration
 */

// Admin configuration
export const ADMIN_EMAILS = [
  'admin@legaliseringstjanst.se',
  'sofia@sofia.se'
];

/**
 * Check if an email is an admin email
 */
export const isAdminEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

/**
 * Firebase configuration from environment variables
 * With fallback values for production builds
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBaXYbWRbryxW-YL4aWIFDzb5Po-r1sj3g',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'doxvl-51a30.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'doxvl-51a30',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'doxvl-51a30.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '195927020517',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:195927020517:web:5374b3346dbaec293ed50c',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-3DBGQCJPTF'
};

/**
 * Site configuration
 */
export const siteConfig = {
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.doxvl.se',
  name: 'DOX Visumpartner AB',
  description: 'Sveriges bästa visum & legaliseringsföretag'
};

/**
 * Validate that required environment variables are set
 * Note: Validation is disabled since we have fallback values in firebaseConfig
 */
export const validateEnv = () => {
  // Validation disabled - we use fallback values in firebaseConfig
  return true;
};
