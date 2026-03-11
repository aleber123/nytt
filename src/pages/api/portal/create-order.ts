/**
 * Portal Create Order API
 * 
 * Creates a new order (legalization or visa) from the customer portal.
 * Also sends email notification to staff.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb, getAdminAuth } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing authorization' });

  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await getAdminAuth().verifyIdToken(token);
    if (!decoded.email) return res.status(401).json({ error: 'No email in token' });

    const db = getAdminDb();
    const email = decoded.email.toLowerCase();

    // Verify portal customer
    const custSnap = await db.collection('portalCustomers').doc(decoded.uid).get();
    if (!custSnap.exists) return res.status(403).json({ error: 'Not a portal customer' });
    const customer = custSnap.data()!;
    if (!customer.isActive) return res.status(403).json({ error: 'Account deactivated' });

    const { orderType, orderData } = req.body;

    if (!orderType || !orderData) {
      return res.status(400).json({ error: 'orderType and orderData are required' });
    }

    const baseData = {
      companyId: customer.companyId || '',
      portalCustomerId: decoded.uid,
      source: 'portal',
      status: 'pending',
      customerInfo: {
        companyName: customer.companyName || '',
        firstName: (customer.displayName || '').split(' ')[0] || '',
        lastName: (customer.displayName || '').split(' ').slice(1).join(' ') || '',
        email: customer.email || email,
        phone: customer.phone || '',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      ...orderData,
    };

    let orderId: string;
    let collectionName: string;

    if (orderType === 'visa') {
      const orderNumber = `VISA${Date.now().toString().slice(-6)}`;
      collectionName = 'orders'; // Use same collection as visaOrderService
      const visaData = {
        ...baseData,
        orderType: 'visa',
        orderNumber,
      };
      await db.collection('orders').doc(orderNumber).set(visaData);
      orderId = orderNumber;
    } else {
      const orderNumber = `SWE${Date.now().toString().slice(-6)}`;
      collectionName = 'orders';
      const legData = {
        ...baseData,
        orderNumber,
      };
      await db.collection('orders').doc(orderNumber).set(legData);
      orderId = orderNumber;
    }

    // Send email notification to staff
    try {
      const typeLabel = orderType === 'visa' ? 'Visum' : 'Legalisering';
      const country = orderData.destinationCountry || orderData.country || '–';
      const services = orderData.services?.join(', ') || '';
      const pickup = orderData.pickupService ? 'Ja' : 'Nej';
      const travelers = orderData.travelers
        ? orderData.travelers.map((t: any) => `${t.firstName} ${t.lastName}`).join(', ')
        : '';

      const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f8f9fa;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #fff; padding: 24px 32px;">
      <h1 style="margin: 0; font-size: 20px;">📋 Ny portalbeställning</h1>
      <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Order #${orderId}</p>
    </div>
    <div style="padding: 32px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 8px 0; color: #6b7280; width: 140px;">Företag</td><td style="padding: 8px 0; font-weight: 600;">${customer.companyName}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280;">Kontaktperson</td><td style="padding: 8px 0;">${customer.displayName}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280;">E-post</td><td style="padding: 8px 0;">${customer.email}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280;">Typ</td><td style="padding: 8px 0; font-weight: 600;">${typeLabel}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280;">Land</td><td style="padding: 8px 0;">${country}</td></tr>
        ${services ? `<tr><td style="padding: 8px 0; color: #6b7280;">Tjänster</td><td style="padding: 8px 0;">${services}</td></tr>` : ''}
        ${orderData.documentType ? `<tr><td style="padding: 8px 0; color: #6b7280;">Dokumenttyp</td><td style="padding: 8px 0;">${orderData.documentType} × ${orderData.quantity || 1}</td></tr>` : ''}
        ${travelers ? `<tr><td style="padding: 8px 0; color: #6b7280;">Resenärer</td><td style="padding: 8px 0;">${travelers}</td></tr>` : ''}
        <tr><td style="padding: 8px 0; color: #6b7280;">DHL-upphämtning</td><td style="padding: 8px 0;">${pickup}</td></tr>
        ${orderData.additionalNotes ? `<tr><td style="padding: 8px 0; color: #6b7280;">Meddelande</td><td style="padding: 8px 0;">${orderData.additionalNotes}</td></tr>` : ''}
      </table>
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 13px; color: #9ca3af;">Beställningen finns i admin under ordrar.</p>
      </div>
    </div>
  </div>
</body>
</html>`.trim();

      await db.collection('emailQueue').add({
        to: 'info@doxvl.se,info@visumpartner.se',
        subject: `Ny portalbeställning #${orderId} – ${customer.companyName} (${typeLabel})`,
        html: emailHtml,
        createdAt: new Date(),
        status: 'pending',
        metadata: {
          orderId,
          type: 'portal-order-notification',
        },
      });
    } catch (emailErr) {
      console.error('Failed to queue staff notification email:', emailErr);
      // Don't fail the order creation because of email failure
    }

    return res.status(200).json({ success: true, orderId, collection: collectionName });
  } catch (error: any) {
    console.error('Portal create order error:', error);
    return res.status(500).json({ error: 'Could not create order', details: error.message });
  }
}
