import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { ALL_COUNTRIES } from '@/components/order/data/countries';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAdmin } from '@/lib/adminAuth';

const DEFAULT_SERVICE_FEE = 1200; // Standard service fee in SEK
const DEFAULT_OFFICIAL_FEE = 0; // Will be set to 0, marked as unconfirmed

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const admin = await verifyAdmin(req, res);
  if (!admin) return;

  // Only super_admin can seed data
  if (admin.role !== 'super_admin') {
    return res.status(403).json({ error: 'Only super admins can seed data' });
  }

  try {
    const db = getAdminDb();
    
    // Get existing embassy pricing rules
    const pricingRulesRef = db.collection('pricing');
    const snapshot = await pricingRulesRef.where('serviceType', '==', 'embassy').get();
    
    const existingCountryCodes = new Set<string>();
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.countryCode) {
        existingCountryCodes.add(data.countryCode);
      }
    });

    // Find missing countries (exclude 'other' as it's not a real country)
    const missingCountries = ALL_COUNTRIES.filter(
      c => !existingCountryCodes.has(c.code) && c.code !== 'other'
    );

    if (missingCountries.length === 0) {
      return res.status(200).json({
        message: 'All countries already have embassy pricing rules',
        added: 0,
        existing: existingCountryCodes.size
      });
    }

    // Add missing countries
    const batch = db.batch();
    const addedCountries: string[] = [];

    for (const country of missingCountries) {
      const docId = `${country.code}_embassy`;
      const docRef = pricingRulesRef.doc(docId);
      
      batch.set(docRef, {
        id: docId,
        countryCode: country.code,
        countryName: country.name, // Swedish name (for consistency with existing data)
        serviceType: 'embassy',
        officialFee: DEFAULT_OFFICIAL_FEE,
        serviceFee: DEFAULT_SERVICE_FEE,
        basePrice: DEFAULT_OFFICIAL_FEE + DEFAULT_SERVICE_FEE,
        processingTime: { standard: 15 },
        currency: 'SEK',
        lastUpdated: FieldValue.serverTimestamp(),
        updatedBy: 'system-seed',
        isActive: true,
        priceUnconfirmed: true, // Mark as unconfirmed so admin knows to set real price
        notes: 'Auto-generated. Please update official fee.'
      });
      
      addedCountries.push(`${country.nameEn} (${country.code})`);
    }

    await batch.commit();

    return res.status(200).json({
      message: `Successfully added ${addedCountries.length} embassy pricing rules`,
      added: addedCountries.length,
      existing: existingCountryCodes.size,
      total: existingCountryCodes.size + addedCountries.length,
      addedCountries
    });

  } catch (error: any) {
    console.error('Error seeding embassy prices:', error);
    return res.status(500).json({ error: 'Failed to seed prices', details: error.message });
  }
}
