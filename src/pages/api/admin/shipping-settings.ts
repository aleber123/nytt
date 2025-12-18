/**
 * Admin Shipping Settings API
 * 
 * Uses Firebase Admin SDK to bypass Firestore security rules.
 * Only accessible by authenticated admin users.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebaseAdmin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const db = getAdminDb();
  const docRef = db.collection('settings').doc('shipping');

  if (req.method === 'GET') {
    try {
      const docSnap = await docRef.get();
      
      if (docSnap.exists) {
        return res.status(200).json({ 
          success: true, 
          settings: docSnap.data() 
        });
      } else {
        // Return default settings if none exist
        return res.status(200).json({ 
          success: true, 
          settings: {
            dhlMaxPrice: 300,
            dhlMaxPriceEnabled: true,
            dhlPickupMaxPrice: 300,
            dhlPickupMaxPriceEnabled: true,
          }
        });
      }
    } catch (error: any) {
      console.error('Error fetching shipping settings:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch settings',
        details: error.message 
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const settings = req.body;
      
      await docRef.set({
        ...settings,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      return res.status(200).json({ 
        success: true, 
        message: 'Settings saved successfully' 
      });
    } catch (error: any) {
      console.error('Error saving shipping settings:', error);
      return res.status(500).json({ 
        error: 'Failed to save settings',
        details: error.message 
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
