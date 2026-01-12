/**
 * Environment configuration with validation
 * Centralizes all environment variables and admin configuration
 */

// Admin configuration
export const ADMIN_EMAILS = [
  'admin@doxvl.se',
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
 * All values MUST be set in environment variables - no hardcoded fallbacks
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ''
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
 * Call this at app startup to catch missing config early
 */
export const validateEnv = (): boolean => {
  const required = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.join(', '));
    return false;
  }
  
  return true;
};
