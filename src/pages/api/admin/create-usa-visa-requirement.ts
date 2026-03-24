/**
 * API endpoint to create USA visa requirement in Firestore
 * 
 * POST /api/admin/create-usa-visa-requirement
 * 
 * This creates the USA entry in visaRequirements collection
 * so that USA appears in the destination country list.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebaseAdmin';

const VISA_REQUIREMENTS_COLLECTION = 'visaRequirements';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = getAdminDb();
    
    // Check if USA requirement already exists
    const docRef = db.collection(VISA_REQUIREMENTS_COLLECTION).doc('US');
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();
      return res.status(200).json({
        message: 'USA visa requirement already exists',
        requirement: { id: 'US', ...data },
      });
    }

    // Create USA visa requirement with DS-160 product
    const now = new Date().toISOString();
    const usaRequirement = {
      countryCode: 'US',
      countryName: 'USA',
      countryNameEn: 'USA',
      isActive: true,
      isSupported: true,
      defaultVisaType: 'required',
      notes: 'DS-160 nonimmigrant visa application required for most visa types.',
      notesEn: 'DS-160 nonimmigrant visa application required for most visa types.',
      visaProducts: [
        {
          id: 'us-b1b2-tourist-business',
          name: 'B1/B2 Turist- och Affärsvisum',
          nameEn: 'B1/B2 Tourist and Business Visa',
          category: 'tourist',
          visaType: 'B1/B2',
          description: 'Kombinerat turist- och affärsvisum för kortare besök i USA.',
          descriptionEn: 'Combined tourist and business visa for short visits to the USA.',
          processingTime: '3-5 veckor efter intervju',
          processingTimeEn: '3-5 weeks after interview',
          validityPeriod: 'Upp till 10 år',
          validityPeriodEn: 'Up to 10 years',
          maxStay: '6 månader per besök',
          maxStayEn: '6 months per visit',
          entries: 'multiple',
          price: 2990,
          governmentFee: 185, // USD converted to SEK approximately
          isActive: true,
          requiresInterview: true,
          requiresPhoto: true,
          photoRequirements: '5x5 cm, vit bakgrund, tagen inom 6 månader',
          photoRequirementsEn: '5x5 cm, white background, taken within 6 months',
          documentRequirements: [
            {
              id: 'passport',
              name: 'Pass',
              nameEn: 'Passport',
              description: 'Giltigt pass med minst 6 månaders giltighet',
              descriptionEn: 'Valid passport with at least 6 months validity',
              isRequired: true,
              isActive: true,
              order: 1,
            },
            {
              id: 'photo',
              name: 'Passfoto',
              nameEn: 'Passport Photo',
              description: '5x5 cm foto enligt US-krav',
              descriptionEn: '5x5 cm photo per US requirements',
              isRequired: true,
              isActive: true,
              order: 2,
            },
            {
              id: 'ds160-confirmation',
              name: 'DS-160 bekräftelse',
              nameEn: 'DS-160 Confirmation',
              description: 'Bekräftelsesida från DS-160 ansökan',
              descriptionEn: 'Confirmation page from DS-160 application',
              isRequired: true,
              isActive: true,
              order: 3,
            },
            {
              id: 'interview-appointment',
              name: 'Intervjubokning',
              nameEn: 'Interview Appointment',
              description: 'Bekräftelse på ambassadintervju',
              descriptionEn: 'Embassy interview confirmation',
              isRequired: true,
              isActive: true,
              order: 4,
            },
          ],
        },
        {
          id: 'us-esta',
          name: 'ESTA (Visa Waiver)',
          nameEn: 'ESTA (Visa Waiver)',
          category: 'tourist',
          visaType: 'ESTA',
          description: 'Elektronisk reseauktorisation för medborgare i Visa Waiver-länder (inkl. Sverige).',
          descriptionEn: 'Electronic travel authorization for citizens of Visa Waiver countries (incl. Sweden).',
          processingTime: '72 timmar',
          processingTimeEn: '72 hours',
          validityPeriod: '2 år',
          validityPeriodEn: '2 years',
          maxStay: '90 dagar per besök',
          maxStayEn: '90 days per visit',
          entries: 'multiple',
          price: 490,
          governmentFee: 21, // USD
          isActive: true,
          requiresInterview: false,
          requiresPhoto: false,
          documentRequirements: [
            {
              id: 'passport',
              name: 'Pass',
              nameEn: 'Passport',
              description: 'Giltigt e-pass',
              descriptionEn: 'Valid e-passport',
              isRequired: true,
              isActive: true,
              order: 1,
            },
          ],
        },
      ],
      nationalityRules: [
        {
          nationalityCode: 'SE',
          nationalityName: 'Sverige',
          visaType: 'visa-waiver',
          notes: 'Svenska medborgare kan ansöka om ESTA för turistbesök upp till 90 dagar.',
          notesEn: 'Swedish citizens can apply for ESTA for tourist visits up to 90 days.',
        },
      ],
      createdAt: now,
      lastUpdated: now,
      updatedBy: 'system',
    };

    await docRef.set(usaRequirement);

    return res.status(201).json({
      message: 'USA visa requirement created successfully',
      requirement: { id: 'US', ...usaRequirement },
    });
  } catch (error) {
    console.error('Error creating USA visa requirement:', error);
    return res.status(500).json({
      error: 'Failed to create USA visa requirement',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
