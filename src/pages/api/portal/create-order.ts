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

    // Send email notification to staff via the editable template system
    try {
      const typeLabel = orderType === 'visa' ? 'Visum' : 'Legalisering';
      const country = orderData.destinationCountry || orderData.country || '–';
      const services = orderData.services?.join(', ') || '';
      const pickup = orderData.pickupService ? 'Ja' : 'Nej';
      const travelers = orderData.travelers
        ? orderData.travelers.map((t: any) => `${t.firstName} ${t.lastName}`).join(', ')
        : '';

      const { buildPortalOrderSummaryHtml } = await import('@/services/internalNotificationEmailParts');
      const { renderEmailAdmin } = await import('@/services/emailRendererAdmin');

      const orderSummaryHtml = buildPortalOrderSummaryHtml({
        companyName: customer.companyName || '',
        contactPerson: customer.displayName || '',
        contactEmail: customer.email || '',
        typeLabel,
        country,
        services,
        documentType: orderData.documentType,
        quantity: orderData.quantity,
        travelers,
        pickup,
        additionalNotes: orderData.additionalNotes,
      });

      const rendered = await renderEmailAdmin(
        'internal-portal-order',
        {
          orderNumber: orderId,
          companyName: customer.companyName || '',
          typeLabel,
          orderSummaryHtml,
        },
        'sv',
        { showTrackingButton: false, showContactSection: false }
      );

      const fallbackSubject = `Ny portalbeställning #${orderId} – ${customer.companyName} (${typeLabel})`;
      const fallbackHtml = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:20px;"><h1>📋 Ny portalbeställning</h1><p>Order #${orderId}</p>${orderSummaryHtml}</div>`;

      await db.collection('emailQueue').add({
        to: 'info@doxvl.se,info@visumpartner.se',
        subject: rendered.rendered ? rendered.subject : fallbackSubject,
        html: rendered.rendered ? rendered.html : fallbackHtml,
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
