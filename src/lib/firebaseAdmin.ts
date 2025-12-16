/**
 * Firebase Admin SDK initialization
 * 
 * Used for server-side operations that need elevated privileges,
 * bypassing Firestore security rules.
 * 
 * IMPORTANT: This should only be used in API routes, never in client code.
 */

import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    return admin.app();
  }

  // Try to use environment variable first (works in both local and production)
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    } catch (parseError) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', parseError);
    }
  }

  // Fallback: Try to use service account file (local development)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const serviceAccount = require('../../service-account.json');
    
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  } catch (e) {
    // Fallback: Try default credentials (works in Google Cloud environments)
    console.warn('No service account found, trying default credentials');
    return admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'doxvl-51a30',
    });
  }
}

// Initialize the app
const app = initializeFirebaseAdmin();

// Export Firestore instance
export const adminDb = admin.firestore(app);

// Export Auth instance (for verifying tokens, managing users)
export const adminAuth = admin.auth(app);

// Export Storage instance
export const adminStorage = admin.storage(app);

// Export the admin module for other uses
export { admin };
