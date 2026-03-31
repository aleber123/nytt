/**
 * API endpoint to create ESTA + Madagascar form templates in Firestore
 *
 * POST /api/admin/create-esta-template
 *
 * One-time setup endpoint to create both templates.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createESTAFormTemplate } from '../../../services/formAutomation/usaESTAFormTemplate';
import { createMadagascarFormTemplate } from '../../../services/formAutomation/madagascarVisaFormTemplate';
import { getAdminDb } from '@/lib/firebaseAdmin';

const TEMPLATES_COLLECTION = 'visaFormTemplates';

interface TemplateConfig {
  key: string;
  matchCountryCode: string;
  matchName: string;
  create: () => ReturnType<typeof createESTAFormTemplate>;
}

const TEMPLATES_TO_CREATE: TemplateConfig[] = [
  {
    key: 'ESTA',
    matchCountryCode: 'US',
    matchName: 'ESTA',
    create: createESTAFormTemplate,
  },
  {
    key: 'Madagascar',
    matchCountryCode: 'MG',
    matchName: 'Madagaskar',
    create: createMadagascarFormTemplate,
  },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = getAdminDb();
    const snapshot = await db.collection(TEMPLATES_COLLECTION).get();
    const existingTemplates = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    const results: { key: string; status: string; templateId?: string }[] = [];

    for (const config of TEMPLATES_TO_CREATE) {
      const existing = existingTemplates.find(
        (t: any) => t.countryCode === config.matchCountryCode &&
          (t.name?.includes(config.matchName) || t.nameEn?.includes(config.matchName))
      );

      if (existing) {
        results.push({ key: config.key, status: 'already exists', templateId: existing.id });
        continue;
      }

      const templateData = config.create();
      const now = new Date().toISOString();

      const docRef = await db.collection(TEMPLATES_COLLECTION).add({
        ...templateData,
        enabled: true,
        createdAt: now,
        updatedAt: now,
        updatedBy: 'system',
      });

      results.push({ key: config.key, status: 'created', templateId: docRef.id });
    }

    return res.status(201).json({
      message: 'Template setup complete',
      results,
    });
  } catch (error) {
    console.error('Error creating templates:', error);
    return res.status(500).json({
      error: 'Failed to create templates',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
