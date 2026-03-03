import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Test 1: Can we import firebase-admin?
    const { getApps } = await import('firebase-admin/app');
    const apps = getApps();
    
    // Test 2: Can we import our firebaseAdmin lib?
    const { getAdminDb } = await import('@/lib/firebaseAdmin');
    const db = getAdminDb();
    
    // Test 3: Can we read from Firestore?
    const testDoc = await db.collection('adminUsers').limit(1).get();
    
    return res.status(200).json({
      ok: true,
      firebaseApps: apps.length,
      firestoreConnected: !testDoc.empty,
      docsFound: testDoc.size,
      env: {
        K_SERVICE: !!process.env.K_SERVICE,
        GOOGLE_CLOUD_PROJECT: !!process.env.GOOGLE_CLOUD_PROJECT,
        FIREBASE_CONFIG: !!process.env.FIREBASE_CONFIG,
        NODE_ENV: process.env.NODE_ENV,
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
      code: error.code,
    });
  }
}
