/**
 * Order Status API
 * 
 * Allows customers to check their order status by providing
 * order number and email address.
 * Uses Firebase Admin SDK to bypass security rules.
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

  const { orderNumber, email } = req.body;

  if (!orderNumber || !email) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      details: 'Both orderNumber and email are required'
    });
  }

  try {
    const db = getAdminDb();
    const normalizedOrderNumber = orderNumber.trim().toUpperCase();
    const normalizedEmail = email.trim().toLowerCase();

    let orderData: any = null;
    let orderDocId: string = '';
    let isVisaOrder = false;

    // Check if it's a visa order (starts with VISA)
    if (normalizedOrderNumber.startsWith('VISA')) {
      // Try visa orders collection first
      let orderDoc = await db.collection('visaOrders').doc(normalizedOrderNumber).get();
      orderData = orderDoc.exists ? orderDoc.data() : null;
      orderDocId = orderDoc.id;

      // If not found by ID, try querying by orderNumber field
      if (!orderData) {
        const querySnapshot = await db.collection('visaOrders')
          .where('orderNumber', '==', normalizedOrderNumber)
          .limit(1)
          .get();

        if (!querySnapshot.empty) {
          orderDoc = querySnapshot.docs[0];
          orderData = orderDoc.data();
          orderDocId = orderDoc.id;
        }
      }

      if (orderData) {
        isVisaOrder = true;
      }
    }

    // If not a visa order or not found in visa orders, check legalization orders
    if (!orderData) {
      let orderDoc = await db.collection('orders').doc(normalizedOrderNumber).get();
      orderData = orderDoc.exists ? orderDoc.data() : null;
      orderDocId = orderDoc.id;

      // If not found by ID, try querying by orderNumber field
      if (!orderData) {
        const querySnapshot = await db.collection('orders')
          .where('orderNumber', '==', normalizedOrderNumber)
          .limit(1)
          .get();

        if (!querySnapshot.empty) {
          orderDoc = querySnapshot.docs[0];
          orderData = orderDoc.data();
          orderDocId = orderDoc.id;
        }
      }
    }

    if (!orderData) {
      return res.status(404).json({ 
        error: 'Order not found',
        details: 'No order found with the provided order number'
      });
    }

    // Verify email matches (case insensitive)
    const orderEmail = orderData.customerInfo?.email?.toLowerCase();
    if (!orderEmail || orderEmail !== normalizedEmail) {
      return res.status(404).json({ 
        error: 'Order not found',
        details: 'No order found with the provided order number and email combination'
      });
    }

    // Format order data for customer display (exclude sensitive admin data)
    let safeOrderData: any;

    if (isVisaOrder) {
      // Visa order format
      safeOrderData = {
        orderNumber: orderData.orderNumber || orderDocId,
        orderType: 'visa',
        status: orderData.status,
        createdAt: orderData.createdAt?._seconds 
          ? new Date(orderData.createdAt._seconds * 1000).toISOString()
          : orderData.createdAt,
        updatedAt: orderData.updatedAt?._seconds
          ? new Date(orderData.updatedAt._seconds * 1000).toISOString()
          : orderData.updatedAt,
        // Visa-specific fields
        destinationCountry: orderData.destinationCountry,
        nationality: orderData.nationality,
        visaProduct: orderData.visaProduct ? {
          name: orderData.visaProduct.name,
          visaType: orderData.visaProduct.visaType,
          entryType: orderData.visaProduct.entryType,
          validityDays: orderData.visaProduct.validityDays,
          processingDays: orderData.visaProduct.processingDays
        } : null,
        departureDate: orderData.departureDate,
        returnDate: orderData.returnDate,
        totalPrice: orderData.totalPrice,
        returnService: orderData.returnService,
        returnTrackingNumber: orderData.returnTrackingNumber,
        returnTrackingUrl: orderData.returnTrackingUrl,
        // Processing steps for customer view (simplified)
        processingSteps: orderData.processingSteps?.map((step: any) => ({
          id: step.id,
          name: step.name,
          status: step.status,
          completedAt: step.completedAt
        })),
        // Customer info (only their own data)
        customerInfo: {
          firstName: orderData.customerInfo?.firstName,
          lastName: orderData.customerInfo?.lastName,
          email: orderData.customerInfo?.email
        }
      };
    } else {
      // Legalization order format
      safeOrderData = {
        orderNumber: orderData.orderNumber || orderDocId,
        orderType: 'legalization',
        status: orderData.status,
        createdAt: orderData.createdAt?._seconds 
          ? new Date(orderData.createdAt._seconds * 1000).toISOString()
          : orderData.createdAt,
        updatedAt: orderData.updatedAt?._seconds
          ? new Date(orderData.updatedAt._seconds * 1000).toISOString()
          : orderData.updatedAt,
        services: orderData.services,
        country: orderData.country,
        documentType: orderData.documentType,
        quantity: orderData.quantity,
        totalPrice: orderData.totalPrice,
        returnService: orderData.returnService,
        returnTrackingNumber: orderData.returnTrackingNumber,
        returnTrackingUrl: orderData.returnTrackingUrl,
        pickupService: orderData.pickupService,
        pickupTrackingNumber: orderData.pickupTrackingNumber,
        // Processing steps for customer view (simplified)
        processingSteps: orderData.processingSteps?.map((step: any) => ({
          id: step.id,
          name: step.name,
          status: step.status,
          completedAt: step.completedAt
        })),
        // Customer info (only their own data)
        customerInfo: {
          firstName: orderData.customerInfo?.firstName,
          lastName: orderData.customerInfo?.lastName,
          email: orderData.customerInfo?.email
        }
      };
    }

    return res.status(200).json({
      success: true,
      order: safeOrderData
    });

  } catch (error: any) {
    console.error('Error fetching order status:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
}
