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

// Lazy initialization - only initialize when first accessed
let _app: admin.app.App | null = null;
let _db: admin.firestore.Firestore | null = null;
let _auth: admin.auth.Auth | null = null;
let _storage: admin.storage.Storage | null = null;

// Get or initialize Firebase Admin app
function getAdminApp(): admin.app.App {
  if (_app) {
    return _app;
  }

  if (getApps().length > 0) {
    _app = admin.app();
    return _app;
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'doxvl-51a30';
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'doxvl-51a30.firebasestorage.app';

  // In Google Cloud environments (Firebase Hosting with Cloud Run), use default credentials
  // K_SERVICE is set in Cloud Run, GOOGLE_CLOUD_PROJECT in other GCP environments
  if (process.env.K_SERVICE || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT) {
    console.log('Firebase Admin: Using Google Cloud default credentials');
    _app = admin.initializeApp({
      projectId,
      storageBucket,
    });
    return _app;
  }

  // Try to use environment variable (for custom deployments)
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      console.log('Firebase Admin: Using FIREBASE_SERVICE_ACCOUNT env var');
      _app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
        storageBucket,
      });
      return _app;
    } catch (parseError) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', parseError);
    }
  }

  // Fallback: Try to use service account file (local development)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const serviceAccount = require('../../service-account.json');
    console.log('Firebase Admin: Using local service-account.json');
    _app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
      storageBucket,
    });
    return _app;
  } catch (e) {
    // Final fallback: Try default credentials (may work in some environments)
    console.warn('Firebase Admin: No service account found, trying default credentials');
    _app = admin.initializeApp({
      projectId,
      storageBucket,
    });
    return _app;
  }
}

// Lazy getters for Firebase services
export function getAdminDb(): admin.firestore.Firestore {
  if (!_db) {
    _db = admin.firestore(getAdminApp());
  }
  return _db;
}

export function getAdminAuth(): admin.auth.Auth {
  if (!_auth) {
    _auth = admin.auth(getAdminApp());
  }
  return _auth;
}

export function getAdminStorage(): admin.storage.Storage {
  if (!_storage) {
    _storage = admin.storage(getAdminApp());
  }
  return _storage;
}

// Legacy exports for backward compatibility (lazy initialized)
export const adminDb = {
  collection: (path: string) => getAdminDb().collection(path),
  doc: (path: string) => getAdminDb().doc(path),
  batch: () => getAdminDb().batch(),
  runTransaction: <T>(fn: (transaction: admin.firestore.Transaction) => Promise<T>) => getAdminDb().runTransaction(fn),
};

export const adminAuth = {
  verifyIdToken: (token: string) => getAdminAuth().verifyIdToken(token),
  getUser: (uid: string) => getAdminAuth().getUser(uid),
  createUser: (properties: admin.auth.CreateRequest) => getAdminAuth().createUser(properties),
  updateUser: (uid: string, properties: admin.auth.UpdateRequest) => getAdminAuth().updateUser(uid, properties),
  deleteUser: (uid: string) => getAdminAuth().deleteUser(uid),
};

export const adminStorage = {
  bucket: (name?: string) => getAdminStorage().bucket(name),
};

// Export the admin module for other uses
export { admin };
