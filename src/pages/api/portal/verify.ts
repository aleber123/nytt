/**
 * Portal Verify API
 * 
 * Called after Firebase Auth login to verify the user is a portal customer,
 * link their UID to the pending document, and return customer data.
 * Uses Firebase Admin SDK to bypass Firestore rules.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb, getAdminAuth } from '@/lib/firebaseAdmin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization' });
  }

  try {
    const token = authHeader.split('Bearer ')[1];
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(token);

    if (!decoded.email) {
      return res.status(401).json({ error: 'No email in token' });
    }

    const db = getAdminDb();
    const email = decoded.email.toLowerCase();
    const uid = decoded.uid;

    // 1. Check if already linked by UID
    const uidDoc = await db.collection('portalCustomers').doc(uid).get();
    if (uidDoc.exists) {
      const data = uidDoc.data()!;
      if (!data.isActive) {
        return res.status(403).json({ error: 'Your account has been deactivated.' });
      }
      // Update last login
      await uidDoc.ref.update({ lastLoginAt: new Date(), updatedAt: new Date() });
      return res.status(200).json({ customer: { id: uid, ...data } });
    }

    // 2. Find by email (pending doc)
    const snapshot = await db.collection('portalCustomers')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'No customer account found for this email address.' });
    }

    const pendingDoc = snapshot.docs[0];
    const pendingData = pendingDoc.data();

    if (!pendingData.isActive) {
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact us for more information.' });
    }

    // 3. Link: copy to real UID doc, delete pending
    if (pendingDoc.id !== uid) {
      await db.collection('portalCustomers').doc(uid).set({
        ...pendingData,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      });
      await pendingDoc.ref.delete();
    } else {
      await pendingDoc.ref.update({ lastLoginAt: new Date(), updatedAt: new Date() });
    }

    return res.status(200).json({
      customer: { id: uid, ...pendingData, lastLoginAt: new Date() },
    });

  } catch (error: any) {
    console.error('Portal verify error:', error);
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Verification error', details: error.message });
  }
}
