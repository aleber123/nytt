import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { orderId, email } = req.query as { orderId?: string; email?: string };

  if (!orderId) {
    return res.status(400).json({ error: 'Missing orderId' });
  }
  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  try {
    const normalizedEmail = String(email).toLowerCase();

    // Try direct document ID first
    let docSnap = await adminDb.collection('orders').doc(orderId!).get();

    if (!docSnap.exists) {
      // Fallback: query by orderNumber field
      const qs = await adminDb
        .collection('orders')
        .where('orderNumber', '==', orderId)
        .limit(1)
        .get();
      if (!qs.empty) {
        docSnap = qs.docs[0];
      }
    }

    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const data = docSnap.data() || {};
    const customerEmail: string | undefined = data?.customerInfo?.email;

    if (!customerEmail || String(customerEmail).toLowerCase() !== normalizedEmail) {
      return res.status(403).json({ error: 'Not authorized to view this order' });
    }

    return res.status(200).json({ id: docSnap.id, ...data });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('API /api/orders/get error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
