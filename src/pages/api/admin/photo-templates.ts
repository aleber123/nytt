/**
 * Custom Photo Template CRUD API
 *
 * GET  — list all custom templates from Firestore
 * POST — create or update a custom template
 * DELETE — delete a custom template (via body { id })
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyAdmin, requirePermission } from '@/lib/adminAuth';

const COLLECTION = 'photoTemplates';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await verifyAdmin(req, res);
  if (!admin) return;
  if (!requirePermission(admin, res, 'canManageOrders')) return;

  const db = getAdminDb();

  // ── GET: list custom templates ──
  if (req.method === 'GET') {
    try {
      const snap = await db.collection(COLLECTION).orderBy('name', 'asc').get();
      const templates = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return res.status(200).json({ success: true, templates });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch templates', details: error.message });
    }
  }

  // ── POST: create / update ──
  if (req.method === 'POST') {
    try {
      const { id, name, widthMm, heightMm, backgroundColor, notes } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Name is required' });
      }
      if (!widthMm || !heightMm || widthMm < 10 || widthMm > 200 || heightMm < 10 || heightMm > 200) {
        return res.status(400).json({ error: 'Width and height must be between 10 and 200 mm' });
      }
      if (!['white', 'light-grey', 'light-blue'].includes(backgroundColor)) {
        return res.status(400).json({ error: 'Invalid background color' });
      }

      const data = {
        name: name.trim(),
        widthMm: Number(widthMm),
        heightMm: Number(heightMm),
        backgroundColor,
        notes: notes?.trim() || '',
        isCustom: true,
        updatedAt: new Date().toISOString(),
        updatedBy: admin.email,
      };

      if (id) {
        // Update existing or save override for a default template
        await db.collection(COLLECTION).doc(id).set({
          ...data,
          createdAt: new Date().toISOString(),
          createdBy: admin.email,
        }, { merge: true });
        return res.status(200).json({ success: true, id, message: 'Template updated' });
      } else {
        // Create new
        const ref = await db.collection(COLLECTION).add({
          ...data,
          createdAt: new Date().toISOString(),
          createdBy: admin.email,
        });
        return res.status(200).json({ success: true, id: ref.id, message: 'Template created' });
      }
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to save template', details: error.message });
    }
  }

  // ── DELETE ──
  if (req.method === 'DELETE') {
    try {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Template id is required' });
      await db.collection(COLLECTION).doc(id).delete();
      return res.status(200).json({ success: true, message: 'Template deleted' });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to delete template', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
