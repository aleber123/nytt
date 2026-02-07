/**
 * Customer Pricing API
 * 
 * Matches a customer by email domain and returns their custom pricing.
 * Uses Firebase Admin SDK to bypass Firestore security rules,
 * since the order form is used by unauthenticated visitors.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { getClientIp, rateLimiters } from '@/lib/rateLimit';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = getClientIp(req);
  const rl = rateLimiters.orderStatus(ip);
  if (!rl.success) {
    return res.status(429).json({ error: 'Too many requests', retryAfter: rl.resetIn });
  }

  const { email } = req.body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  try {
    const domain = email.split('@')[1].toLowerCase();
    const db = getAdminDb();

    const snapshot = await db.collection('customers').get();

    let matchedCustomer: any = null;
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.isActive === false) continue;
      const domains: string[] = data.emailDomains || [];
      if (domains.some((d: string) => d.toLowerCase() === domain)) {
        matchedCustomer = data;
        break;
      }
    }

    if (!matchedCustomer) {
      return res.status(200).json({ matched: false });
    }

    // Return only pricing-relevant data (no sensitive info)
    return res.status(200).json({
      matched: true,
      customPricing: matchedCustomer.customPricing || null,
      vatExempt: matchedCustomer.vatExempt || false,
      companyName: matchedCustomer.companyName || '',
    });
  } catch (error: any) {
    console.error('Error matching customer pricing:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
