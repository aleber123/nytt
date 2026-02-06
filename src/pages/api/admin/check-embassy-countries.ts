import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { ALL_COUNTRIES } from '@/components/order/data/countries';
import { verifyAdmin } from '@/lib/adminAuth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await verifyAdmin(req, res);
  if (!admin) return;

  try {
    const db = getAdminDb();
    
    // Get all embassy pricing rules from Firebase
    const pricingRulesRef = db.collection('pricing');
    const snapshot = await pricingRulesRef.where('serviceType', '==', 'embassy').get();
    
    const existingCountryCodes = new Set<string>();
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.countryCode) {
        existingCountryCodes.add(data.countryCode);
      }
    });

    // Compare with ALL_COUNTRIES
    const allCountryCodes = ALL_COUNTRIES.map(c => c.code);
    const missingCountries = ALL_COUNTRIES.filter(c => !existingCountryCodes.has(c.code));
    const existingCountries = ALL_COUNTRIES.filter(c => existingCountryCodes.has(c.code));

    return res.status(200).json({
      totalInSystem: ALL_COUNTRIES.length,
      totalInFirebase: existingCountryCodes.size,
      missingCount: missingCountries.length,
      existingCountries: existingCountries.map(c => ({ code: c.code, name: c.nameEn })),
      missingCountries: missingCountries.map(c => ({ code: c.code, name: c.nameEn }))
    });

  } catch (error: any) {
    console.error('Error checking embassy countries:', error);
    return res.status(500).json({ error: 'Failed to check countries', details: error.message });
  }
}
