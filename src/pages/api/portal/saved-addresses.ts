/**
 * Portal Saved Addresses API
 * 
 * Manages saved addresses for portal customers.
 * POST: Add a new saved address
 * DELETE: Remove a saved address by ID
 * GET: Fetch all saved addresses
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb, getAdminAuth } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing authorization' });

  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await getAdminAuth().verifyIdToken(token);
    if (!decoded.email) return res.status(401).json({ error: 'No email in token' });

    const db = getAdminDb();
    const custRef = db.collection('portalCustomers').doc(decoded.uid);
    const custSnap = await custRef.get();
    if (!custSnap.exists) return res.status(403).json({ error: 'Not a portal customer' });

    const customer = custSnap.data()!;
    const savedAddresses = customer.savedAddresses || [];

    if (req.method === 'GET') {
      return res.status(200).json({ savedAddresses });
    }

    if (req.method === 'POST') {
      const { label, street, postalCode, city, contactName, contactPhone } = req.body;
      if (!label || !street || !postalCode || !city) {
        return res.status(400).json({ error: 'Label, street, postal code, and city are required' });
      }

      const newAddress = {
        id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        label,
        street,
        postalCode,
        city,
        contactName: contactName || '',
        contactPhone: contactPhone || '',
      };

      await custRef.update({
        savedAddresses: [...savedAddresses, newAddress],
        updatedAt: new Date(),
      });

      return res.status(200).json({ savedAddresses: [...savedAddresses, newAddress] });
    }

    if (req.method === 'DELETE') {
      const { addressId } = req.body;
      if (!addressId) return res.status(400).json({ error: 'addressId is required' });

      const updated = savedAddresses.filter((a: any) => a.id !== addressId);
      await custRef.update({
        savedAddresses: updated,
        updatedAt: new Date(),
      });

      return res.status(200).json({ savedAddresses: updated });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Portal saved addresses error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
