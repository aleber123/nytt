/**
 * API endpoint to create the DS-160 form template in Firestore
 * 
 * POST /api/admin/create-ds160-template
 * 
 * This is a one-time setup endpoint to create the DS-160 template.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createDS160FormTemplate } from '../../../services/formAutomation/usaDS160FormTemplate';
import { getAdminDb } from '@/lib/firebaseAdmin';

const TEMPLATES_COLLECTION = 'visaFormTemplates';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = getAdminDb();
    
    // Check if template already exists
    const snapshot = await db.collection(TEMPLATES_COLLECTION).get();
    const existingTemplates = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    const existingDS160 = existingTemplates.find(
      (t: any) => t.countryCode === 'US' && t.name?.includes('DS-160')
    );

    if (existingDS160) {
      return res.status(200).json({
        message: 'DS-160 template already exists',
        templateId: existingDS160.id,
        template: existingDS160,
      });
    }

    // Create the template
    const templateData = createDS160FormTemplate();
    const now = new Date().toISOString();
    
    const docRef = await db.collection(TEMPLATES_COLLECTION).add({
      ...templateData,
      enabled: true,
      createdAt: now,
      updatedAt: now,
      updatedBy: 'system',
    });

    return res.status(201).json({
      message: 'DS-160 template created successfully',
      templateId: docRef.id,
      template: templateData,
    });
  } catch (error) {
    console.error('Error creating DS-160 template:', error);
    return res.status(500).json({
      error: 'Failed to create DS-160 template',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
