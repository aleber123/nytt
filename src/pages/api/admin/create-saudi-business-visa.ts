/**
 * One-shot admin endpoint: attaches the Saudi Arabia business-visa document
 * requirements to the EXISTING business-category products in
 * `visaRequirements/SA`, and removes any products this script previously
 * added by mistake (sa-business-single, sa-business-multiple).
 *
 * Run from the browser: GET /api/admin/create-saudi-business-visa
 *
 * Idempotent — safe to run multiple times. Returns JSON describing the
 * products it touched so you can verify.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebaseAdmin';

// Document requirements for Saudi Arabia business visa.
// Schema matches `DocumentRequirement` in src/firebase/visaRequirementsService.ts.
const SAUDI_BUSINESS_DOCUMENT_REQUIREMENTS = [
  {
    id: 'passport-copy',
    type: 'passport',
    name: 'Digital kopia av passets informationssida',
    nameEn: 'Digital copy of passport info page',
    description:
      'Passet måste gälla i minst 6 månader vid enkel inresa, och 12 månader för flera inresor. ' +
      'Minst 2 tomma sidor bredvid varandra. Passet får inte vara skadat (trasigt, sprucket eller vattenskadat).',
    descriptionEn:
      'Passport must be valid for at least 6 months for single entry, and 12 months for multiple entry. ' +
      'At least 2 blank pages side by side. Passport must not be damaged (torn, cracked, or water-damaged).',
    required: true,
    originalRequired: false,
    uploadable: true,
    order: 1,
    isActive: true,
    applicableNationalities: 'all',
  },
  {
    id: 'visa-application-form',
    type: 'form',
    name: 'Ifylld visumansökningsblankett',
    nameEn: 'Completed visa application form',
    description:
      'Ladda ner ansökningsblanketten, fyll i den och mejla den till oss. ' +
      'Vi fyller i den officiella ansökan åt dig baserat på informationen du skickar in.',
    descriptionEn:
      'Download the application form, fill it out, and email it to us. ' +
      'We complete the official application on your behalf based on the information you provide.',
    required: true,
    originalRequired: false,
    uploadable: true,
    templateUrl: '',
    order: 2,
    isActive: true,
    applicableNationalities: 'all',
  },
  {
    id: 'color-photo',
    type: 'photo',
    name: 'Färgfoto (5 x 3,5 cm, vit bakgrund)',
    nameEn: 'Color photo (5 x 3.5 cm, white background)',
    description:
      'Ett nytaget färgfoto (5 x 3,5 cm) med vit bakgrund. Fotot ska vara av god kvalitet och får inte vara äldre än 3 månader. ' +
      'Skicka fotot till info@visumpartner.se för eventuell redigering och utskrift.',
    descriptionEn:
      'A recently taken color photo (5 x 3.5 cm) with white background. Good quality, not older than 3 months. ' +
      'Send the photo to info@visumpartner.se for editing and printing.',
    required: true,
    originalRequired: false,
    uploadable: true,
    order: 3,
    isActive: true,
    applicableNationalities: 'all',
  },
  {
    id: 'invitation-letter-saudi',
    type: 'invitation',
    name: 'Inbjudningsbrev från Saudiarabien',
    nameEn: 'Invitation letter from Saudi Arabia',
    description:
      'Ett inbjudningsbrev från ett företag i Saudiarabien utfärdat via Ministry of Foreign Affairs. ' +
      'Behöver du hjälp med inbjudningsbrevet? Kontakta oss för support.',
    descriptionEn:
      'An invitation letter from a company in Saudi Arabia issued via the Ministry of Foreign Affairs. ' +
      'Contact us if you need help obtaining the invitation letter.',
    required: true,
    originalRequired: true,
    uploadable: true,
    order: 4,
    isActive: true,
    applicableNationalities: 'all',
  },
  {
    id: 'saudi-company-registration',
    type: 'employment',
    name: 'Registreringsbevis från företaget i Saudiarabien',
    nameEn: 'Company registration certificate (Saudi Arabia)',
    description: 'Utfärdat via bolagsverket i Saudiarabien.',
    descriptionEn: 'Issued by the Saudi Arabian companies registry.',
    required: true,
    originalRequired: false,
    uploadable: true,
    order: 5,
    isActive: true,
    applicableNationalities: 'all',
  },
  {
    id: 'guarantee-letter-swedish-employer',
    type: 'employment',
    name: 'Garantibrev från arbetsgivaren i Sverige',
    nameEn: 'Guarantee letter from Swedish employer',
    description:
      'Ett garantibrev enligt ambassadens standardformat (mall finns att ladda ner). ' +
      'Brevet måste vara stämplat av handelskammaren. ' +
      'Visumtyp och ansökandes position måste matcha informationen i inbjudningsbrevet.',
    descriptionEn:
      'A guarantee letter in the embassy\'s standard format (template available to download). ' +
      'The letter must be stamped by the Swedish Chamber of Commerce. ' +
      'Visa type and applicant position must match the information in the invitation letter.',
    required: true,
    originalRequired: true,
    uploadable: true,
    templateUrl: '',
    order: 6,
    isActive: true,
    applicableNationalities: 'all',
  },
  {
    id: 'swedish-company-registration',
    type: 'employment',
    name: 'Registreringsbevis från företaget i Sverige',
    nameEn: 'Company registration certificate (Sweden)',
    description: 'Utfärdat via Bolagsverket i Sverige.',
    descriptionEn: 'Issued by the Swedish Companies Registration Office (Bolagsverket).',
    required: true,
    originalRequired: false,
    uploadable: true,
    order: 7,
    isActive: true,
    applicableNationalities: 'all',
  },
  {
    id: 'personbevis-non-swedish',
    type: 'residence',
    name: 'Personbevis (på engelska)',
    nameEn: 'Personal certificate (in English)',
    description:
      'Icke-svenska medborgare måste bifoga ett personbevis från Skatteverket på engelska.',
    descriptionEn:
      'Non-Swedish citizens must attach a personal certificate from the Swedish Tax Agency in English.',
    required: true,
    originalRequired: false,
    uploadable: true,
    order: 8,
    isActive: true,
    applicableNationalities: 'non-swedish',
  },
  {
    id: 'residence-permit-non-swedish',
    type: 'residence',
    name: 'Giltigt uppehållstillstånd',
    nameEn: 'Valid residence permit',
    description:
      'Icke-svenska medborgare måste bifoga giltigt uppehållstillstånd (gäller ej EU-medborgare).',
    descriptionEn:
      'Non-Swedish citizens must attach a valid residence permit (not required for EU citizens).',
    required: true,
    originalRequired: false,
    uploadable: true,
    order: 9,
    isActive: true,
    applicableNationalities: 'non-swedish',
  },
];

// IDs this script previously created by mistake. We remove them so the
// admin only sees the real, pre-existing Saudi business visa products.
const ACCIDENTAL_PRODUCT_IDS = ['sa-business-single', 'sa-business-multiple'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = getAdminDb();
    const saRef = db.collection('visaRequirements').doc('SA');
    const saDoc = await saRef.get();

    if (!saDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'visaRequirements/SA document does not exist — create the Saudi visa products first via /admin/visa-document-requirements.',
      });
    }

    const products: any[] = saDoc.data()?.visaProducts || [];

    // Step 1: drop products this script added by mistake earlier
    const removedIds = products
      .filter(p => ACCIDENTAL_PRODUCT_IDS.includes(p.id))
      .map(p => p.id);
    const kept = products.filter(p => !ACCIDENTAL_PRODUCT_IDS.includes(p.id));

    // Step 2: attach document requirements to every business-category product
    const businessProducts = kept.filter(
      (p: any) => (p.category || '').toLowerCase() === 'business'
    );

    if (businessProducts.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No business-category products found in visaRequirements/SA after cleanup.',
        remainingProducts: kept.map((p: any) => ({ id: p.id, name: p.nameEn || p.name, category: p.category })),
        removedAccidentalProducts: removedIds,
      });
    }

    const updated: Array<{ id: string; name: string }> = [];
    for (const prod of businessProducts) {
      prod.documentRequirements = SAUDI_BUSINESS_DOCUMENT_REQUIREMENTS;
      updated.push({ id: prod.id, name: prod.nameEn || prod.name });
    }

    await saRef.set(
      {
        visaProducts: kept,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Saudi Arabia business visa document requirements attached to existing products',
      updatedProducts: updated,
      removedAccidentalProducts: removedIds,
      documentRequirementsCount: SAUDI_BUSINESS_DOCUMENT_REQUIREMENTS.length,
      allProductsInSA: kept.map((p: any) => ({ id: p.id, name: p.nameEn || p.name, category: p.category })),
    });
  } catch (error: any) {
    console.error('Error attaching Saudi business visa requirements:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to attach Saudi business visa requirements',
    });
  }
}
