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

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'doxvl-51a30';
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'doxvl-51a30.firebasestorage.app';

  // In Google Cloud environments (Firebase Hosting with Cloud Run), use default credentials
  // This works automatically without needing a service account JSON
  if (process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || process.env.K_SERVICE) {
    console.log('Using Google Cloud default credentials');
    return admin.initializeApp({
      projectId,
      storageBucket,
    });
  }

  // Try to use environment variable (for custom deployments)
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
        storageBucket,
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
      storageBucket,
    });
  } catch (e) {
    // Final fallback: Try default credentials
    console.warn('No service account found, trying default credentials');
    return admin.initializeApp({
      projectId,
      storageBucket,
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
