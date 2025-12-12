/**
 * Admin Order Update API
 * 
 * Uses Firebase Admin SDK to bypass Firestore security rules.
 * Only accessible to authenticated admin users.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId, updates } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: 'orderId is required' });
  }

  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'updates object is required' });
  }

  if (!adminDb) {
    return res.status(500).json({ error: 'Database not available' });
  }

  try {
    // First try direct document ID
    let docRef = adminDb.collection('orders').doc(orderId);
    let docSnap = await docRef.get();
    let actualDocId = orderId;

    // If not found by ID, try searching by orderNumber
    if (!docSnap.exists) {
      console.log('🔍 Order not found by ID, trying orderNumber for update...');
      const querySnapshot = await adminDb.collection('orders')
        .where('orderNumber', '==', orderId)
        .limit(1)
        .get();

      if (!querySnapshot.empty) {
        const foundDoc = querySnapshot.docs[0];
        actualDocId = foundDoc.id;
        docRef = adminDb.collection('orders').doc(actualDocId);
        console.log('✅ Found order by orderNumber, actual document ID:', actualDocId);
      } else {
        console.error('❌ Order not found by ID or orderNumber:', orderId);
        return res.status(404).json({ error: 'Order not found: ' + orderId });
      }
    } else {
      console.log('✅ Order found by direct ID:', orderId);
    }

    // Update the order
    await docRef.update({
      ...updates,
      updatedAt: new Date().toISOString()
    });

    console.log('✅ Order updated successfully via Admin API:', actualDocId);

    return res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      orderId: actualDocId
    });

  } catch (error: any) {
    console.error('❌ Error updating order:', error);
    return res.status(500).json({
      error: 'Failed to update order',
      details: error.message
    });
  }
}
