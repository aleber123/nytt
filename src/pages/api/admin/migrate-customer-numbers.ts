/**
 * One-time migration: Replace sequential customer numbers (K-0001) with
 * random alphanumeric ones (K-7A3X9M) to prevent enumeration.
 * Also updates customerNumber references in orders and visaOrders.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyAdmin, requirePermission } from '@/lib/adminAuth';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1
const LENGTH = 6;

function generateId(): string {
  let result = '';
  for (let i = 0; i < LENGTH; i++) {
    result += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return `K-${result}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await verifyAdmin(req, res);
  if (!admin) return;
  if (!requirePermission(admin, res, 'canManageCustomers')) return;

  const db = getAdminDb();

  try {
    // 1. Load all customers
    const customersSnap = await db.collection('customers').get();
    const usedNumbers = new Set<string>();
    const mapping: Record<string, string> = {}; // oldNumber -> newNumber

    // Generate new numbers for each customer
    for (const doc of customersSnap.docs) {
      const oldNumber = doc.data().customerNumber as string | undefined;
      if (!oldNumber) continue;

      let newNumber = generateId();
      while (usedNumbers.has(newNumber)) {
        newNumber = generateId();
      }
      usedNumbers.add(newNumber);
      mapping[oldNumber] = newNumber;
    }

    // 2. Update customers
    const batch1 = db.batch();
    let count = 0;
    for (const doc of customersSnap.docs) {
      const oldNumber = doc.data().customerNumber as string | undefined;
      if (!oldNumber || !mapping[oldNumber]) continue;
      batch1.update(doc.ref, { customerNumber: mapping[oldNumber] });
      count++;
    }
    await batch1.commit();

    // 3. Update orders that reference old customer numbers
    let orderCount = 0;
    const ordersSnap = await db.collection('orders').get();
    const orderBatches: FirebaseFirestore.WriteBatch[] = [db.batch()];
    let batchIdx = 0;
    let batchCount = 0;

    for (const doc of ordersSnap.docs) {
      const oldNum = doc.data().customerNumber as string | undefined;
      if (oldNum && mapping[oldNum]) {
        orderBatches[batchIdx].update(doc.ref, { customerNumber: mapping[oldNum] });
        orderCount++;
        batchCount++;
        if (batchCount >= 400) {
          orderBatches.push(db.batch());
          batchIdx++;
          batchCount = 0;
        }
      }
    }

    // 4. Update visa orders
    let visaOrderCount = 0;
    const visaSnap = await db.collection('visaOrders').get();
    for (const doc of visaSnap.docs) {
      const oldNum = doc.data().customerNumber as string | undefined;
      if (oldNum && mapping[oldNum]) {
        orderBatches[batchIdx].update(doc.ref, { customerNumber: mapping[oldNum] });
        visaOrderCount++;
        batchCount++;
        if (batchCount >= 400) {
          orderBatches.push(db.batch());
          batchIdx++;
          batchCount = 0;
        }
      }
    }

    for (const b of orderBatches) {
      await b.commit();
    }

    return res.status(200).json({
      success: true,
      customersUpdated: count,
      ordersUpdated: orderCount,
      visaOrdersUpdated: visaOrderCount,
      mapping,
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return res.status(500).json({ error: 'Migration failed', details: error.message });
  }
}
