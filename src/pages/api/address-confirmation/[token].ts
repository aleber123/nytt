/**
 * Address Confirmation API
 * 
 * Handles address confirmation tokens for pickup and return addresses.
 * GET: Returns address details for confirmation page
 * POST: Confirms or updates the address
 * 
 * Uses Firebase Admin SDK to bypass Firestore security rules.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

interface AddressConfirmation {
  orderId: string;
  type: 'pickup' | 'return';
  address: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
    companyName?: string;
    contactName?: string;
    phone?: string;
  };
  confirmed: boolean;
  confirmedAt?: string;
  token: string;
  createdAt: string;
  expiresAt: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Token saknas' });
  }

  if (!adminDb) {
    return res.status(500).json({ error: 'Database not available' });
  }

  try {
    // Find the confirmation by token using Admin SDK
    const snapshot = await adminDb.collection('addressConfirmations')
      .where('token', '==', token)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Ogiltig eller utgången länk' });
    }

    const confirmationDoc = snapshot.docs[0];
    const confirmation = confirmationDoc.data() as AddressConfirmation;

    // Check if expired
    if (new Date(confirmation.expiresAt) < new Date()) {
      return res.status(410).json({ error: 'Länken har gått ut. Kontakta oss för en ny bekräftelselänk.' });
    }

    // GET: Return confirmation details
    if (req.method === 'GET') {
      // Get order details
      const orderSnap = await adminDb.collection('orders').doc(confirmation.orderId).get();
      const orderData = orderSnap.exists ? orderSnap.data() : null;

      return res.status(200).json({
        success: true,
        confirmation: {
          type: confirmation.type,
          address: confirmation.address,
          confirmed: confirmation.confirmed,
          confirmedAt: confirmation.confirmedAt
        },
        order: orderData ? {
          orderNumber: orderData.orderNumber,
          customerName: `${orderData.customerInfo?.firstName || ''} ${orderData.customerInfo?.lastName || ''}`.trim()
        } : null
      });
    }

    // POST: Confirm or update address
    if (req.method === 'POST') {
      const { action, updatedAddress } = req.body;

      if (action === 'confirm') {
        // Confirm current address
        await confirmationDoc.ref.update({
          confirmed: true,
          confirmedAt: new Date().toISOString()
        });

        // Update order with confirmation status
        const updateField = confirmation.type === 'pickup' 
          ? 'pickupAddressConfirmed' 
          : 'returnAddressConfirmed';
        
        await adminDb.collection('orders').doc(confirmation.orderId).update({
          [updateField]: true,
          [`${updateField}At`]: new Date().toISOString()
        });

        return res.status(200).json({
          success: true,
          message: 'Adressen har bekräftats!'
        });
      }

      if (action === 'update' && updatedAddress) {
        // Update address
        await confirmationDoc.ref.update({
          address: updatedAddress,
          confirmed: true,
          confirmedAt: new Date().toISOString(),
          addressUpdated: true
        });

        // Update order with new address
        const orderRef = adminDb.collection('orders').doc(confirmation.orderId);
        
        if (confirmation.type === 'pickup') {
          await orderRef.update({
            pickupAddress: {
              street: updatedAddress.street,
              postalCode: updatedAddress.postalCode,
              city: updatedAddress.city,
              country: updatedAddress.country || 'Sverige',
              name: updatedAddress.contactName,
              company: updatedAddress.companyName
            },
            pickupAddressConfirmed: true,
            pickupAddressConfirmedAt: new Date().toISOString(),
            pickupAddressUpdatedByCustomer: true
          });
        } else {
          await orderRef.update({
            'customerInfo.address': updatedAddress.street,
            'customerInfo.postalCode': updatedAddress.postalCode,
            'customerInfo.city': updatedAddress.city,
            'customerInfo.country': updatedAddress.country || 'Sverige',
            returnAddressConfirmed: true,
            returnAddressConfirmedAt: new Date().toISOString(),
            returnAddressUpdatedByCustomer: true
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Adressen har uppdaterats och bekräftats!'
        });
      }

      return res.status(400).json({ error: 'Ogiltig åtgärd' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('Address confirmation error:', error);
    return res.status(500).json({ error: 'Ett fel uppstod', details: error.message });
  }
}
