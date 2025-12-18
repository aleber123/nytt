/**
 * Embassy Price Confirmation API
 * 
 * Handles embassy price confirmation tokens.
 * GET: Returns price details for confirmation page
 * POST: Confirms or declines the price
 * 
 * Uses Firebase Admin SDK to bypass Firestore security rules.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebaseAdmin';

interface EmbassyPriceConfirmation {
  orderId: string;
  orderNumber: string;
  confirmedEmbassyPrice: number;
  confirmedTotalPrice: number;
  originalTotalPrice: number;
  originalPricingBreakdown: any[];
  confirmed: boolean;
  declined: boolean;
  confirmedAt?: string;
  declinedAt?: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  customerEmail: string;
  customerName: string;
  countryCode: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Token saknas' });
  }

  try {
    const db = getAdminDb();
    
    // Find the confirmation by token using Admin SDK
    const snapshot = await db.collection('embassyPriceConfirmations')
      .where('token', '==', token)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Ogiltig eller utgången länk' });
    }

    const confirmationDoc = snapshot.docs[0];
    const confirmation = confirmationDoc.data() as EmbassyPriceConfirmation;

    // Check if expired
    if (new Date(confirmation.expiresAt) < new Date()) {
      return res.status(410).json({ error: 'Länken har gått ut. Kontakta oss för en ny bekräftelselänk.' });
    }

    // GET: Return confirmation details
    if (req.method === 'GET') {
      // Get order details
      const orderSnap = await db.collection('orders').doc(confirmation.orderId).get();
      const orderData = orderSnap.exists ? orderSnap.data() : null;

      return res.status(200).json({
        success: true,
        confirmation: {
          confirmedEmbassyPrice: confirmation.confirmedEmbassyPrice,
          confirmedTotalPrice: confirmation.confirmedTotalPrice,
          originalTotalPrice: confirmation.originalTotalPrice,
          originalPricingBreakdown: confirmation.originalPricingBreakdown,
          confirmed: confirmation.confirmed,
          declined: confirmation.declined,
          confirmedAt: confirmation.confirmedAt,
          declinedAt: confirmation.declinedAt,
          countryCode: confirmation.countryCode
        },
        order: orderData ? {
          orderNumber: orderData.orderNumber,
          customerName: `${orderData.customerInfo?.firstName || ''} ${orderData.customerInfo?.lastName || ''}`.trim(),
          country: orderData.country,
          services: orderData.services,
          locale: orderData.locale || 'sv'
        } : null
      });
    }

    // POST: Confirm or decline price
    if (req.method === 'POST') {
      const { action } = req.body;

      if (action === 'confirm') {
        // Check if already confirmed or declined
        if (confirmation.confirmed) {
          return res.status(400).json({ error: 'Priset har redan bekräftats' });
        }
        if (confirmation.declined) {
          return res.status(400).json({ error: 'Beställningen har redan avböjts' });
        }

        // Confirm the price
        await confirmationDoc.ref.update({
          confirmed: true,
          confirmedAt: new Date().toISOString()
        });

        // Update order with confirmed price
        const orderRef = db.collection('orders').doc(confirmation.orderId);
        
        // Get current pricing breakdown and update the TBC item
        const orderSnap = await orderRef.get();
        const orderData = orderSnap.data();
        let updatedPricingBreakdown = orderData?.pricingBreakdown || [];
        
        // Update the embassy official fee in the pricing breakdown
        updatedPricingBreakdown = updatedPricingBreakdown.map((item: any) => {
          if (item.service === 'embassy_official' && item.isTBC) {
            return {
              ...item,
              total: confirmation.confirmedEmbassyPrice,
              unitPrice: confirmation.confirmedEmbassyPrice / (item.quantity || 1),
              isTBC: false
            };
          }
          return item;
        });

        await orderRef.update({
          embassyPriceConfirmed: true,
          embassyPriceConfirmedAt: new Date().toISOString(),
          confirmedEmbassyPrice: confirmation.confirmedEmbassyPrice,
          totalPrice: confirmation.confirmedTotalPrice,
          pricingBreakdown: updatedPricingBreakdown,
          hasUnconfirmedPrices: false
        });

        return res.status(200).json({
          success: true,
          message: 'Priset har bekräftats! Vi fortsätter nu med din beställning.'
        });
      }

      if (action === 'decline') {
        // Check if already confirmed or declined
        if (confirmation.confirmed) {
          return res.status(400).json({ error: 'Priset har redan bekräftats' });
        }
        if (confirmation.declined) {
          return res.status(400).json({ error: 'Beställningen har redan avböjts' });
        }

        // Decline the order
        await confirmationDoc.ref.update({
          declined: true,
          declinedAt: new Date().toISOString()
        });

        // Update order status
        const orderRef = db.collection('orders').doc(confirmation.orderId);
        await orderRef.update({
          embassyPriceDeclined: true,
          embassyPriceDeclinedAt: new Date().toISOString(),
          status: 'cancelled',
          cancellationReason: 'Customer declined embassy price'
        });

        return res.status(200).json({
          success: true,
          message: 'Beställningen har avböjts. Kontakta oss om du har frågor.'
        });
      }

      return res.status(400).json({ error: 'Ogiltig åtgärd' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('Embassy price confirmation error:', error);
    return res.status(500).json({ error: 'Ett fel uppstod', details: error.message });
  }
}
