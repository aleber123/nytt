/**
 * Customer Lookup API
 *
 * Looks up a customer by their customer number (K-XXXXXX) and returns
 * contact info, billing address, etc. for auto-filling order forms.
 * Uses Firebase Admin SDK since order forms are used by unauthenticated visitors.
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

  const { customerNumber } = req.body;

  if (!customerNumber || typeof customerNumber !== 'string') {
    return res.status(400).json({ error: 'Customer number is required' });
  }

  // Normalize: accept "K-ABC123", "k-abc123", "KABC123", "ABC123" etc.
  const raw = customerNumber.trim().toUpperCase().replace(/^K-?/, '');
  if (!raw || raw.length < 4 || raw.length > 8 || !/^[A-Z0-9]+$/.test(raw)) {
    return res.status(400).json({ error: 'Invalid customer number format' });
  }
  // Support both old sequential (K-0042) and new alphanumeric (K-7A3X9M) formats
  const formattedNumber = `K-${raw}`;

  try {
    const db = getAdminDb();
    const snapshot = await db.collection('customers')
      .where('customerNumber', '==', formattedNumber)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(200).json({ found: false });
    }

    const data = snapshot.docs[0].data();
    const primaryContact = data.contacts?.find((c: any) => c.isPrimary) || data.contacts?.[0];

    // Return only form-relevant data (no sensitive business terms or pricing)
    return res.status(200).json({
      found: true,
      customerNumber: formattedNumber,
      customer: {
        companyName: data.companyName || '',
        organizationNumber: data.organizationNumber || '',
        customerType: data.customerType === 'private' ? 'private' : 'company',
        // Primary contact
        contactName: primaryContact?.name || '',
        contactEmail: primaryContact?.email || data.email || '',
        contactPhone: primaryContact?.phone || data.phone || '',
        // Billing address
        billingAddress: data.billingAddress || null,
        // Invoice reference (default for this customer)
        invoiceReference: data.invoiceReference || '',
        // Saved addresses (return, pickup, delivery)
        savedAddresses: (data.savedAddresses || []).map((a: any) => ({
          id: a.id,
          label: a.label,
          type: a.type,
          contactName: a.contactName || '',
          companyName: a.companyName || '',
          street: a.street,
          addressLine2: a.addressLine2 || '',
          postalCode: a.postalCode,
          city: a.city,
          country: a.country,
          countryCode: a.countryCode || 'SE',
          phone: a.phone || '',
          email: a.email || '',
          isDefault: a.isDefault || false,
        })),
      },
    });
  } catch (error: any) {
    console.error('Error looking up customer:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
