/**
 * Create Portal Customer API
 * 
 * Creates a portal customer account in Firestore and optionally
 * creates a Firebase Auth user (server-side, so admin stays logged in).
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb, getAdminAuth } from '@/lib/firebaseAdmin';
import { verifyAdmin, requirePermission } from '@/lib/adminAuth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await verifyAdmin(req, res, 'adminEmail');
  if (!admin) return;
  if (!requirePermission(admin, res, 'canManageCustomers')) return;

  try {
    const db = getAdminDb();
    const authAdmin = getAdminAuth();

    const { email, displayName, companyName, phone, password, isActive, notes } = req.body as {
      email: string;
      displayName: string;
      companyName: string;
      phone?: string;
      password?: string;
      isActive?: boolean;
      notes?: string;
    };

    if (!email || !displayName || !companyName) {
      return res.status(400).json({ error: 'Email, displayName och companyName krävs' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Generate companyId
    const companyId = companyName
      .toLowerCase()
      .replace(/[^a-z0-9åäöü]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    let firebaseUid: string | null = null;

    // Create Firebase Auth user if password provided
    if (password && password.length >= 6) {
      try {
        const userRecord = await authAdmin.createUser({
          email: normalizedEmail,
          password,
          displayName,
        });
        firebaseUid = userRecord.uid;
      } catch (authErr: any) {
        if (authErr.code === 'auth/email-already-exists') {
          // User already exists in Auth, get their UID
          try {
            const existingUser = await authAdmin.getUserByEmail(normalizedEmail);
            firebaseUid = existingUser.uid;
          } catch {
            // Ignore - will use pending ID
          }
        } else {
          return res.status(400).json({ error: `Auth-fel: ${authErr.message}` });
        }
      }
    }

    // Determine document ID
    const docId = firebaseUid || `pending_${normalizedEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

    // Create Firestore document
    const docRef = db.collection('portalCustomers').doc(docId);
    await docRef.set({
      email: normalizedEmail,
      displayName,
      companyName,
      companyId,
      phone: phone || '',
      isActive: isActive !== false,
      notes: notes || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      id: docId,
      firebaseAuthCreated: !!firebaseUid,
      message: firebaseUid
        ? `Kund skapad med Firebase Auth-konto (${normalizedEmail})`
        : `Kund skapad (kunden behöver skapa lösenord själv)`,
    });

  } catch (error: any) {
    console.error('Create portal customer error:', error);
    return res.status(500).json({ error: 'Kunde inte skapa kund', details: error.message });
  }
}
