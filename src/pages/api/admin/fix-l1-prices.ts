/**
 * Fix L-1 visa product prices in Firestore
 * GET /api/admin/fix-l1-prices
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

function getAdminDb() {
  if (getApps().length === 0) {
    const possiblePaths = [
      path.join(process.cwd(), 'service-account.json'),
      path.join(process.cwd(), 'secrets', 'service-account.json'),
      '/etc/secrets/service-account.json',
    ];
    
    let serviceAccount = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        serviceAccount = JSON.parse(fs.readFileSync(p, 'utf8'));
        break;
      }
    }
    
    if (!serviceAccount) {
      throw new Error('Service account not found');
    }
    
    initializeApp({ credential: cert(serviceAccount) });
  }
  return getFirestore();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const db = getAdminDb();
    
    // Get current USA visa requirements
    const usaRef = db.collection('visaRequirements').doc('US');
    const usaDoc = await usaRef.get();
    
    if (!usaDoc.exists) {
      return res.status(404).json({ error: 'USA visa requirements not found' });
    }
    
    const data = usaDoc.data();
    const visaProducts = data?.visaProducts || [];
    
    // Find and log L-1 products
    const l1Products = visaProducts.filter((p: any) => p.id?.startsWith('us-l1'));
    
    // DS-160 form template ID
    const ds160TemplateId = 'rf0yt34JxWJMa7JH7PDn';
    
    // DS-160 add-on service (included in product, price 0)
    const ds160AddOn = {
      id: 'ds160-form',
      name: 'DS-160 Formulär',
      nameEn: 'DS-160 Form',
      description: 'Vi fyller i DS-160 formuläret åt dig',
      descriptionEn: 'We fill in the DS-160 form for you',
      price: 0,
      includedInProduct: true,
      formTemplateId: ds160TemplateId,
    };
    
    // Fix L-1 products with correct price structure and DS-160 add-on
    // UI uses serviceFee (ex VAT) + embassyFee (0% VAT) to calculate total
    // For L-1: serviceFee = DOX fee (ex VAT), embassyFee = US visa fee ($190 = ~2000 SEK)
    const fixedProducts = visaProducts.map((p: any) => {
      if (p.id === 'us-l1a-manager') {
        return {
          ...p,
          price: 4995,
          serviceFee: 2995, // DOX fee ex VAT (2995 * 1.25 = 3744 inkl moms)
          embassyFee: 2000, // US visa fee (~$190)
          visaType: 'sticker',
          entryType: 'multiple',
          validityDays: 1095,
          processingDays: 14,
          addOnServices: [ds160AddOn],
        };
      }
      if (p.id === 'us-l1b-specialized') {
        return {
          ...p,
          price: 4995,
          serviceFee: 2995, // DOX fee ex VAT
          embassyFee: 2000, // US visa fee
          visaType: 'sticker',
          entryType: 'multiple',
          validityDays: 1095,
          processingDays: 14,
          addOnServices: [ds160AddOn],
        };
      }
      if (p.id === 'us-l1-blanket') {
        return {
          ...p,
          price: 5495,
          serviceFee: 3495, // DOX fee ex VAT
          embassyFee: 2000, // US visa fee
          visaType: 'sticker',
          entryType: 'multiple',
          validityDays: 1095,
          processingDays: 7,
          addOnServices: [ds160AddOn],
        };
      }
      return p;
    });
    
    // Update Firestore
    await usaRef.update({
      visaProducts: fixedProducts,
      updatedAt: FieldValue.serverTimestamp(),
    });
    
    // Get updated products
    const updatedDoc = await usaRef.get();
    const updatedProducts = updatedDoc.data()?.visaProducts || [];
    const updatedL1 = updatedProducts.filter((p: any) => p.id?.startsWith('us-l1'));
    
    return res.status(200).json({
      success: true,
      message: 'L-1 prices fixed',
      before: l1Products,
      after: updatedL1,
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
