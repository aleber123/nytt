/**
 * Public Form Complete API
 * 
 * Called by the customer visa form after successful submission.
 * Updates the processing step to 'completed' using Admin SDK
 * (client-side Firestore rules don't allow customers to write to orders).
 * 
 * POST /api/public/form-complete
 * Body: { token: string }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = getClientIp(req);
  const rl = checkRateLimit(ip, { limit: 5, windowSeconds: 60, identifier: 'form-complete' });
  if (!rl.success) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  try {
    const { token } = req.body as { token: string };

    if (!token) {
      return res.status(400).json({ error: 'Missing token' });
    }

    const db = getAdminDb();

    // Verify the form submission token and get the orderId
    const submissionsSnap = await db.collection('visaFormSubmissions')
      .where('token', '==', token)
      .limit(1)
      .get();

    if (submissionsSnap.empty) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const submission = submissionsSnap.docs[0].data();
    const orderId = submission.orderId;

    if (!orderId) {
      return res.status(400).json({ error: 'No order linked to this submission' });
    }

    // Get the order and update the processing step
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const orderData = orderSnap.data() as any;
    const steps = orderData.processingSteps || [];

    const updatedSteps = steps.map((step: any) => {
      if (step.id === 'data_collection_form') {
        return {
          ...step,
          status: 'completed',
          completedAt: new Date().toISOString(),
          notes: `Customer submitted form data at ${new Date().toLocaleString('sv-SE')}`,
        };
      }
      return step;
    });

    await orderRef.update({ processingSteps: updatedSteps });

    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update processing step' });
  }
}
