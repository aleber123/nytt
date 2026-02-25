/**
 * Portal Orders API
 * 
 * Fetches orders for the authenticated portal customer.
 * Uses Firebase Admin SDK to bypass Firestore composite index requirements.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb, getAdminAuth } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing authorization' });

  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await getAdminAuth().verifyIdToken(token);
    if (!decoded.email) return res.status(401).json({ error: 'No email in token' });

    const db = getAdminDb();

    // Get portal customer
    const custSnap = await db.collection('portalCustomers').doc(decoded.uid).get();
    if (!custSnap.exists) return res.status(403).json({ error: 'Not a portal customer' });
    const customer = custSnap.data()!;
    if (!customer.isActive) return res.status(403).json({ error: 'Account deactivated' });

    const email = customer.email;
    const companyId = customer.companyId;

    // Fetch orders from both collections by email and companyId
    const [legByEmail, legByCompany, visaByEmail, visaByCompany] = await Promise.all([
      db.collection('orders').where('customerInfo.email', '==', email).get(),
      companyId ? db.collection('orders').where('companyId', '==', companyId).get() : Promise.resolve(null),
      db.collection('visaOrders').where('customerInfo.email', '==', email).get(),
      companyId ? db.collection('visaOrders').where('companyId', '==', companyId).get() : Promise.resolve(null),
    ]);

    // Merge and deduplicate
    const map = new Map<string, any>();

    const addDocs = (snap: FirebaseFirestore.QuerySnapshot | null, orderType?: string) => {
      if (!snap) return;
      snap.docs.forEach(d => {
        if (!map.has(d.id)) {
          const data = d.data();
          map.set(d.id, {
            id: d.id,
            ...(orderType ? { orderType } : {}),
            ...data,
            // Convert Firestore Timestamps to ISO strings for JSON serialization
            createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
          });
        }
      });
    };

    addDocs(legByEmail);
    addDocs(legByCompany);
    addDocs(visaByEmail, 'visa');
    addDocs(visaByCompany, 'visa');

    // Sort by createdAt descending
    const orders = Array.from(map.values()).sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    return res.status(200).json({ orders });
  } catch (error: any) {
    console.error('Portal orders error:', error);
    return res.status(500).json({ error: 'Could not fetch orders', details: error.message });
  }
}
