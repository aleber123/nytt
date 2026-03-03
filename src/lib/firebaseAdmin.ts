/**
 * Firebase Admin SDK initialization
 * 
 * Used for server-side operations that need elevated privileges,
 * bypassing Firestore security rules.
 * 
 * IMPORTANT: This should only be used in API routes, never in client code.
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'doxvl-51a30';
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'doxvl-51a30.firebasestorage.app';

// Initialize Firebase Admin at module load time
let app: App;

if (getApps().length === 0) {
  // Check if we're in a Google Cloud / Cloud Run / Firebase environment
  const isGoogleCloud = !!(
    process.env.K_SERVICE ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    process.env.FIREBASE_CONFIG ||
    process.env.CLOUD_RUNTIME_ENV
  );
  
  let initialized = false;

  // Try service account file (local development)
  if (!isGoogleCloud) {
    try {
      // Try multiple possible paths for the service account file
      const possiblePaths = [
        path.resolve(process.cwd(), 'service-account.json'),
        path.resolve(__dirname, '../../service-account.json'),
        path.resolve(__dirname, '../../../service-account.json'),
      ];
      
      for (const saPath of possiblePaths) {
        if (fs.existsSync(saPath)) {
          const serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'));
          app = initializeApp({
            credential: cert(serviceAccount),
            projectId: serviceAccount.project_id,
            storageBucket,
          });
          initialized = true;
          break;
        }
      }
    } catch (e) {
      // Will fall through to default credentials
      console.warn('[firebaseAdmin] Service account file not found or invalid, using default credentials');
    }
  }

  // Fallback: Application Default Credentials (works in Cloud Run and GCP)
  if (!initialized) {
    app = initializeApp({
      projectId,
      storageBucket,
    });
  }
} else {
  app = getApps()[0];
}

// Cached instances
let _db: Firestore | null = null;
let _auth: Auth | null = null;
let _storage: Storage | null = null;

// Lazy getters for Firebase services
export function getAdminDb(): Firestore {
  if (!_db) {
    _db = getFirestore(app);
  }
  return _db;
}

export function getAdminAuth(): Auth {
  if (!_auth) {
    _auth = getAuth(app);
  }
  return _auth;
}

export function getAdminStorage(): Storage {
  if (!_storage) {
    _storage = getStorage(app);
  }
  return _storage;
}

// Legacy exports for backward compatibility
export const adminDb = {
  collection: (path: string) => getAdminDb().collection(path),
  doc: (path: string) => getAdminDb().doc(path),
  batch: () => getAdminDb().batch(),
  runTransaction: <T>(fn: (transaction: FirebaseFirestore.Transaction) => Promise<T>) => getAdminDb().runTransaction(fn),
};

export const adminAuth = {
  verifyIdToken: (token: string) => getAdminAuth().verifyIdToken(token),
  getUser: (uid: string) => getAdminAuth().getUser(uid),
  createUser: (properties: any) => getAdminAuth().createUser(properties),
  updateUser: (uid: string, properties: any) => getAdminAuth().updateUser(uid, properties),
  deleteUser: (uid: string) => getAdminAuth().deleteUser(uid),
};

export const adminStorage = {
  bucket: (name?: string) => getAdminStorage().bucket(name),
};
