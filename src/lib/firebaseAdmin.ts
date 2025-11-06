import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK as a singleton
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize firebase-admin:', e);
  }
}

export const adminDb = admin.firestore();
export const adminApp = admin.app();
