/**
 * Quote Response API
 * 
 * Handles quote tokens.
 * GET: Returns quote details for the public page
 * POST: Accepts or declines the quote
 * 
 * Uses Firebase Admin SDK to bypass Firestore security rules.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebaseAdmin';

interface QuoteRecord {
  orderId: string;
  orderNumber: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    vatRate: number;
  }>;
  totalAmount: number;
  message: string;
  status: 'sent' | 'accepted' | 'declined';
  token: string;
  createdAt: string;
  customerEmail: string;
  customerName: string;
  locale: string;
  respondedAt?: string;
  declineReason?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Token is missing' });
  }

  try {
    const db = getAdminDb();
    
    // Find the quote by token
    const snapshot = await db.collection('quotes')
      .where('token', '==', token)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Invalid or expired link' });
    }

    const quoteDoc = snapshot.docs[0];
    const quote = quoteDoc.data() as QuoteRecord;

    // GET: Return quote details
    if (req.method === 'GET') {
      const orderSnap = await db.collection('orders').doc(quote.orderId).get();
      const orderData = orderSnap.exists ? orderSnap.data() : null;

      return res.status(200).json({
        success: true,
        quote: {
          lineItems: quote.lineItems,
          totalAmount: quote.totalAmount,
          message: quote.message,
          status: quote.status,
          createdAt: quote.createdAt,
          respondedAt: quote.respondedAt,
          declineReason: quote.declineReason
        },
        order: orderData ? {
          orderNumber: orderData.orderNumber,
          customerName: `${orderData.customerInfo?.firstName || ''} ${orderData.customerInfo?.lastName || ''}`.trim(),
          locale: orderData.locale || 'sv'
        } : null
      });
    }

    // POST: Accept or decline quote
    if (req.method === 'POST') {
      const { action, declineReason } = req.body;

      if (quote.status === 'accepted') {
        return res.status(400).json({ error: 'Quote has already been accepted' });
      }
      if (quote.status === 'declined') {
        return res.status(400).json({ error: 'Quote has already been declined' });
      }

      if (action === 'accept') {
        // Accept the quote
        await quoteDoc.ref.update({
          status: 'accepted',
          respondedAt: new Date().toISOString()
        });

        // Update order
        const orderRef = db.collection('orders').doc(quote.orderId);
        await orderRef.set({
          quote: {
            status: 'accepted',
            sentAt: quote.createdAt,
            respondedAt: new Date().toISOString(),
            token: quote.token,
            totalAmount: quote.totalAmount,
            lineItems: quote.lineItems
          }
        }, { merge: true });

        const orderSnap = await orderRef.get();
        const orderLocale = orderSnap.data()?.locale || 'sv';
        const isEnglish = orderLocale === 'en';

        return res.status(200).json({
          success: true,
          message: isEnglish 
            ? 'Quote accepted! We will proceed with your order.'
            : 'Offerten är godkänd! Vi fortsätter med din beställning.'
        });
      }

      if (action === 'decline') {
        // Decline the quote
        await quoteDoc.ref.update({
          status: 'declined',
          respondedAt: new Date().toISOString(),
          declineReason: declineReason || ''
        });

        // Update order
        const orderRef = db.collection('orders').doc(quote.orderId);
        await orderRef.set({
          quote: {
            status: 'declined',
            sentAt: quote.createdAt,
            respondedAt: new Date().toISOString(),
            token: quote.token,
            totalAmount: quote.totalAmount,
            lineItems: quote.lineItems,
            declineReason: declineReason || ''
          }
        }, { merge: true });

        const orderSnap = await orderRef.get();
        const orderLocale = orderSnap.data()?.locale || 'sv';
        const isEnglish = orderLocale === 'en';

        return res.status(200).json({
          success: true,
          message: isEnglish 
            ? 'Quote declined. Please contact us if you have any questions.'
            : 'Offerten har avböjts. Kontakta oss om du har frågor.'
        });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('Quote response error:', error);
    return res.status(500).json({ error: 'An error occurred', details: error.message });
  }
}
