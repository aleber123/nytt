/**
 * Admin Visa Order Update API
 * 
 * Uses Firebase Admin SDK to bypass Firestore security rules.
 * Only accessible to authenticated admin users.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyAdmin } from '@/lib/adminAuth';
import { isValidDocId, sanitizeOrderUpdates } from '@/lib/sanitize';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await verifyAdmin(req, res);
  if (!admin) return;

  const { orderId, updates } = req.body;

  if (!isValidDocId(orderId)) {
    return res.status(400).json({ error: 'Invalid or missing orderId' });
  }

  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    return res.status(400).json({ error: 'updates object is required' });
  }

  const sanitizedUpdates = sanitizeOrderUpdates(updates);
  if (Object.keys(sanitizedUpdates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  try {
    const db = getAdminDb();

    let docRef = db.collection('orders').doc(orderId);
    let docSnap = await docRef.get();
    let actualDocId = orderId;

    if (!docSnap.exists) {
      const querySnapshot = await db.collection('orders')
        .where('orderNumber', '==', orderId)
        .limit(1)
        .get();

      if (!querySnapshot.empty) {
        const foundDoc = querySnapshot.docs[0];
        actualDocId = foundDoc.id;
        docRef = db.collection('orders').doc(actualDocId);
      } else {
        return res.status(404).json({ error: 'Visa order not found' });
      }
    }

    await docRef.update({
      ...sanitizedUpdates,
      updatedAt: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: 'Visa order updated successfully',
      orderId: actualDocId
    });

  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to update visa order',
      details: error.message
    });
  }
}
