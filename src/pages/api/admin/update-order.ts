/**
 * Admin Order Update API
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

    // First try direct document ID
    let docRef = db.collection('orders').doc(orderId);
    let docSnap = await docRef.get();
    let actualDocId = orderId;

    // If not found by ID, try searching by orderNumber
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
        return res.status(404).json({ error: 'Order not found' });
      }
    }

    // Update the order with sanitized data
    await docRef.update({
      ...sanitizedUpdates,
      updatedAt: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      orderId: actualDocId
    });

  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to update order',
      details: error.message
    });
  }
}
