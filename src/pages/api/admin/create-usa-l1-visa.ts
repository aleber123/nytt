/**
 * API endpoint to create USA L-1 visa product with document requirements
 * L-1 is for intracompany transferees (managers, executives, specialized knowledge)
 * 
 * Run once: GET /api/admin/create-usa-l1-visa
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin
function getAdminDb() {
  if (getApps().length === 0) {
    const possiblePaths = [
      path.join(process.cwd(), 'service-account.json'),
      path.join(process.cwd(), 'secrets', 'service-account.json'),
      '/etc/secrets/service-account.json',
    ];
    
    let serviceAccount = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        serviceAccount = JSON.parse(fs.readFileSync(p, 'utf8'));
        break;
      }
    }
    
    if (!serviceAccount) {
      throw new Error('Service account not found');
    }
    
    initializeApp({
      credential: cert(serviceAccount),
    });
  }
  return getFirestore();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = getAdminDb();
    
    // L-1 Visa Products
    const l1Products = [
      {
        id: 'us-l1a-manager',
        name: 'L-1A Manager/Executive',
        nameEn: 'L-1A Manager/Executive Visa',
        description: 'För chefer och ledande befattningshavare som överförs inom företaget',
        descriptionEn: 'For managers and executives transferring within the company',
        category: 'work',
        price: 4995,
        currency: 'SEK',
        processingTime: '2-4 veckor efter I-129 godkännande',
        processingTimeEn: '2-4 weeks after I-129 approval',
        validity: 'Upp till 3 år (kan förlängas till max 7 år)',
        validityEn: 'Up to 3 years (extendable to max 7 years)',
        entries: 'multiple',
        isActive: true,
        requiresInterview: true,
        requiresAppointment: true,
        formType: 'DS-160',
        notes: 'Kräver godkänd I-129 petition från USCIS innan visumansökan',
      },
      {
        id: 'us-l1b-specialized',
        name: 'L-1B Specialized Knowledge',
        nameEn: 'L-1B Specialized Knowledge Visa',
        description: 'För anställda med specialiserad kunskap som överförs inom företaget',
        descriptionEn: 'For employees with specialized knowledge transferring within the company',
        category: 'work',
        price: 4995,
        currency: 'SEK',
        processingTime: '2-4 veckor efter I-129 godkännande',
        processingTimeEn: '2-4 weeks after I-129 approval',
        validity: 'Upp till 3 år (kan förlängas till max 5 år)',
        validityEn: 'Up to 3 years (extendable to max 5 years)',
        entries: 'multiple',
        isActive: true,
        requiresInterview: true,
        requiresAppointment: true,
        formType: 'DS-160',
        notes: 'Kräver godkänd I-129 petition från USCIS innan visumansökan',
      },
      {
        id: 'us-l1-blanket',
        name: 'L-1 Blanket Petition',
        nameEn: 'L-1 Blanket Petition Visa',
        description: 'För företag med godkänd blanket petition - snabbare process',
        descriptionEn: 'For companies with approved blanket petition - faster process',
        category: 'work',
        price: 5495,
        currency: 'SEK',
        processingTime: '1-2 veckor',
        processingTimeEn: '1-2 weeks',
        validity: 'Upp till 3 år',
        validityEn: 'Up to 3 years',
        entries: 'multiple',
        isActive: true,
        requiresInterview: true,
        requiresAppointment: true,
        formType: 'DS-160',
        notes: 'Företaget måste ha godkänd I-129S blanket petition',
      },
    ];

    // Document requirements for L-1 visa
    const l1DocumentRequirements = {
      'us-l1a-manager': [
        {
          id: 'passport',
          name: 'Pass',
          nameEn: 'Passport',
          description: 'Giltigt i minst 6 månader efter planerad vistelse',
          descriptionEn: 'Valid for at least 6 months beyond intended stay',
          required: true,
          category: 'identity',
          acceptedFormats: ['original'],
          sortOrder: 1,
        },
        {
          id: 'photo',
          name: 'Passfoto',
          nameEn: 'Passport Photo',
          description: '5x5 cm, vit bakgrund, taget inom 6 månader (US-specifikationer)',
          descriptionEn: '2x2 inch, white background, taken within 6 months (US specifications)',
          required: true,
          category: 'identity',
          acceptedFormats: ['digital', 'physical'],
          sortOrder: 2,
        },
        {
          id: 'ds160-confirmation',
          name: 'DS-160 Bekräftelse',
          nameEn: 'DS-160 Confirmation',
          description: 'Utskriven bekräftelsesida från DS-160 ansökan',
          descriptionEn: 'Printed confirmation page from DS-160 application',
          required: true,
          category: 'application',
          acceptedFormats: ['printed'],
          sortOrder: 3,
        },
        {
          id: 'i129-approval',
          name: 'I-129 Godkännande (I-797)',
          nameEn: 'I-129 Approval Notice (I-797)',
          description: 'Godkänd I-129 petition från USCIS',
          descriptionEn: 'Approved I-129 petition from USCIS',
          required: true,
          category: 'petition',
          acceptedFormats: ['original', 'copy'],
          sortOrder: 4,
        },
        {
          id: 'i129-petition-copy',
          name: 'Kopia av I-129 Petition',
          nameEn: 'Copy of I-129 Petition',
          description: 'Komplett kopia av den inlämnade I-129 petitionen med alla bilagor',
          descriptionEn: 'Complete copy of filed I-129 petition with all attachments',
          required: true,
          category: 'petition',
          acceptedFormats: ['copy'],
          sortOrder: 5,
        },
        {
          id: 'employment-letter-us',
          name: 'Anställningsbrev (US-företag)',
          nameEn: 'Employment Letter (US Company)',
          description: 'Brev från det amerikanska företaget som bekräftar position och lön',
          descriptionEn: 'Letter from US company confirming position and salary',
          required: true,
          category: 'employment',
          acceptedFormats: ['original'],
          sortOrder: 6,
        },
        {
          id: 'employment-letter-foreign',
          name: 'Anställningsbrev (Utländskt företag)',
          nameEn: 'Employment Letter (Foreign Company)',
          description: 'Brev från nuvarande arbetsgivare som bekräftar anställning och chefsroll',
          descriptionEn: 'Letter from current employer confirming employment and managerial role',
          required: true,
          category: 'employment',
          acceptedFormats: ['original'],
          sortOrder: 7,
        },
        {
          id: 'resume-cv',
          name: 'CV/Meritförteckning',
          nameEn: 'Resume/CV',
          description: 'Detaljerat CV som visar chefserfarehet och kvalifikationer',
          descriptionEn: 'Detailed resume showing managerial experience and qualifications',
          required: true,
          category: 'employment',
          acceptedFormats: ['printed'],
          sortOrder: 8,
        },
        {
          id: 'org-chart',
          name: 'Organisationsschema',
          nameEn: 'Organizational Chart',
          description: 'Organisationsschema som visar din position i både utländska och amerikanska företaget',
          descriptionEn: 'Organizational chart showing your position in both foreign and US company',
          required: true,
          category: 'employment',
          acceptedFormats: ['printed'],
          sortOrder: 9,
        },
        {
          id: 'company-relationship',
          name: 'Bevis på företagsrelation',
          nameEn: 'Proof of Company Relationship',
          description: 'Dokumentation som visar förhållandet mellan utländska och amerikanska företaget',
          descriptionEn: 'Documentation showing relationship between foreign and US company',
          required: true,
          category: 'company',
          acceptedFormats: ['copy'],
          sortOrder: 10,
        },
        {
          id: 'interview-appointment',
          name: 'Intervjubokning',
          nameEn: 'Interview Appointment',
          description: 'Bekräftelse på bokad intervju vid amerikanska ambassaden',
          descriptionEn: 'Confirmation of scheduled interview at US Embassy',
          required: true,
          category: 'application',
          acceptedFormats: ['printed'],
          sortOrder: 11,
        },
        {
          id: 'previous-us-visas',
          name: 'Tidigare US-visum',
          nameEn: 'Previous US Visas',
          description: 'Kopior av tidigare amerikanska visum om tillämpligt',
          descriptionEn: 'Copies of previous US visas if applicable',
          required: false,
          category: 'travel',
          acceptedFormats: ['copy'],
          sortOrder: 12,
        },
      ],
      'us-l1b-specialized': [
        {
          id: 'passport',
          name: 'Pass',
          nameEn: 'Passport',
          description: 'Giltigt i minst 6 månader efter planerad vistelse',
          descriptionEn: 'Valid for at least 6 months beyond intended stay',
          required: true,
          category: 'identity',
          acceptedFormats: ['original'],
          sortOrder: 1,
        },
        {
          id: 'photo',
          name: 'Passfoto',
          nameEn: 'Passport Photo',
          description: '5x5 cm, vit bakgrund, taget inom 6 månader (US-specifikationer)',
          descriptionEn: '2x2 inch, white background, taken within 6 months (US specifications)',
          required: true,
          category: 'identity',
          acceptedFormats: ['digital', 'physical'],
          sortOrder: 2,
        },
        {
          id: 'ds160-confirmation',
          name: 'DS-160 Bekräftelse',
          nameEn: 'DS-160 Confirmation',
          description: 'Utskriven bekräftelsesida från DS-160 ansökan',
          descriptionEn: 'Printed confirmation page from DS-160 application',
          required: true,
          category: 'application',
          acceptedFormats: ['printed'],
          sortOrder: 3,
        },
        {
          id: 'i129-approval',
          name: 'I-129 Godkännande (I-797)',
          nameEn: 'I-129 Approval Notice (I-797)',
          description: 'Godkänd I-129 petition från USCIS',
          descriptionEn: 'Approved I-129 petition from USCIS',
          required: true,
          category: 'petition',
          acceptedFormats: ['original', 'copy'],
          sortOrder: 4,
        },
        {
          id: 'specialized-knowledge-letter',
          name: 'Brev om specialiserad kunskap',
          nameEn: 'Specialized Knowledge Letter',
          description: 'Detaljerat brev som beskriver din specialiserade kunskap och varför den är unik',
          descriptionEn: 'Detailed letter describing your specialized knowledge and why it is unique',
          required: true,
          category: 'employment',
          acceptedFormats: ['original'],
          sortOrder: 5,
        },
        {
          id: 'employment-letter-us',
          name: 'Anställningsbrev (US-företag)',
          nameEn: 'Employment Letter (US Company)',
          description: 'Brev från det amerikanska företaget som bekräftar position och lön',
          descriptionEn: 'Letter from US company confirming position and salary',
          required: true,
          category: 'employment',
          acceptedFormats: ['original'],
          sortOrder: 6,
        },
        {
          id: 'employment-letter-foreign',
          name: 'Anställningsbrev (Utländskt företag)',
          nameEn: 'Employment Letter (Foreign Company)',
          description: 'Brev från nuvarande arbetsgivare som bekräftar anställning i minst 1 år',
          descriptionEn: 'Letter from current employer confirming employment for at least 1 year',
          required: true,
          category: 'employment',
          acceptedFormats: ['original'],
          sortOrder: 7,
        },
        {
          id: 'resume-cv',
          name: 'CV/Meritförteckning',
          nameEn: 'Resume/CV',
          description: 'Detaljerat CV som visar specialiserad erfarenhet',
          descriptionEn: 'Detailed resume showing specialized experience',
          required: true,
          category: 'employment',
          acceptedFormats: ['printed'],
          sortOrder: 8,
        },
        {
          id: 'training-certificates',
          name: 'Utbildningscertifikat',
          nameEn: 'Training Certificates',
          description: 'Certifikat för specialiserad utbildning eller träning',
          descriptionEn: 'Certificates for specialized education or training',
          required: false,
          category: 'education',
          acceptedFormats: ['copy'],
          sortOrder: 9,
        },
        {
          id: 'company-relationship',
          name: 'Bevis på företagsrelation',
          nameEn: 'Proof of Company Relationship',
          description: 'Dokumentation som visar förhållandet mellan utländska och amerikanska företaget',
          descriptionEn: 'Documentation showing relationship between foreign and US company',
          required: true,
          category: 'company',
          acceptedFormats: ['copy'],
          sortOrder: 10,
        },
        {
          id: 'interview-appointment',
          name: 'Intervjubokning',
          nameEn: 'Interview Appointment',
          description: 'Bekräftelse på bokad intervju vid amerikanska ambassaden',
          descriptionEn: 'Confirmation of scheduled interview at US Embassy',
          required: true,
          category: 'application',
          acceptedFormats: ['printed'],
          sortOrder: 11,
        },
      ],
      'us-l1-blanket': [
        {
          id: 'passport',
          name: 'Pass',
          nameEn: 'Passport',
          description: 'Giltigt i minst 6 månader efter planerad vistelse',
          descriptionEn: 'Valid for at least 6 months beyond intended stay',
          required: true,
          category: 'identity',
          acceptedFormats: ['original'],
          sortOrder: 1,
        },
        {
          id: 'photo',
          name: 'Passfoto',
          nameEn: 'Passport Photo',
          description: '5x5 cm, vit bakgrund, taget inom 6 månader (US-specifikationer)',
          descriptionEn: '2x2 inch, white background, taken within 6 months (US specifications)',
          required: true,
          category: 'identity',
          acceptedFormats: ['digital', 'physical'],
          sortOrder: 2,
        },
        {
          id: 'ds160-confirmation',
          name: 'DS-160 Bekräftelse',
          nameEn: 'DS-160 Confirmation',
          description: 'Utskriven bekräftelsesida från DS-160 ansökan',
          descriptionEn: 'Printed confirmation page from DS-160 application',
          required: true,
          category: 'application',
          acceptedFormats: ['printed'],
          sortOrder: 3,
        },
        {
          id: 'i129s-form',
          name: 'I-129S Formulär',
          nameEn: 'I-129S Form',
          description: 'Ifyllt I-129S formulär för blanket petition',
          descriptionEn: 'Completed I-129S form for blanket petition',
          required: true,
          category: 'petition',
          acceptedFormats: ['original'],
          sortOrder: 4,
        },
        {
          id: 'blanket-approval',
          name: 'Blanket Petition Godkännande',
          nameEn: 'Blanket Petition Approval',
          description: 'Kopia av företagets godkända blanket petition (I-797)',
          descriptionEn: 'Copy of company\'s approved blanket petition (I-797)',
          required: true,
          category: 'petition',
          acceptedFormats: ['copy'],
          sortOrder: 5,
        },
        {
          id: 'employment-letter-us',
          name: 'Anställningsbrev (US-företag)',
          nameEn: 'Employment Letter (US Company)',
          description: 'Brev från det amerikanska företaget som bekräftar position och lön',
          descriptionEn: 'Letter from US company confirming position and salary',
          required: true,
          category: 'employment',
          acceptedFormats: ['original'],
          sortOrder: 6,
        },
        {
          id: 'employment-letter-foreign',
          name: 'Anställningsbrev (Utländskt företag)',
          nameEn: 'Employment Letter (Foreign Company)',
          description: 'Brev från nuvarande arbetsgivare som bekräftar anställning',
          descriptionEn: 'Letter from current employer confirming employment',
          required: true,
          category: 'employment',
          acceptedFormats: ['original'],
          sortOrder: 7,
        },
        {
          id: 'resume-cv',
          name: 'CV/Meritförteckning',
          nameEn: 'Resume/CV',
          description: 'Detaljerat CV',
          descriptionEn: 'Detailed resume',
          required: true,
          category: 'employment',
          acceptedFormats: ['printed'],
          sortOrder: 8,
        },
        {
          id: 'interview-appointment',
          name: 'Intervjubokning',
          nameEn: 'Interview Appointment',
          description: 'Bekräftelse på bokad intervju vid amerikanska ambassaden',
          descriptionEn: 'Confirmation of scheduled interview at US Embassy',
          required: true,
          category: 'application',
          acceptedFormats: ['printed'],
          sortOrder: 9,
        },
      ],
    };

    // Get or create USA visa requirements document
    const usaRef = db.collection('visaRequirements').doc('US');
    const usaDoc = await usaRef.get();
    
    let existingProducts: any[] = [];
    if (usaDoc.exists) {
      existingProducts = usaDoc.data()?.visaProducts || [];
    }

    // Add L-1 products if they don't exist
    for (const product of l1Products) {
      const exists = existingProducts.some((p: any) => p.id === product.id);
      if (!exists) {
        existingProducts.push(product);
      }
    }

    // Update USA visa requirements with L-1 products
    await usaRef.set({
      countryCode: 'US',
      countryName: 'USA',
      countryNameEn: 'United States',
      isActive: true,
      visaProducts: existingProducts,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    // Create document requirements for each L-1 product
    for (const [productId, requirements] of Object.entries(l1DocumentRequirements)) {
      const docReqRef = db.collection('documentRequirements').doc(`US-${productId}`);
      await docReqRef.set({
        countryCode: 'US',
        productId: productId,
        requirements: requirements,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return res.status(200).json({
      success: true,
      message: 'USA L-1 visa products and document requirements created successfully',
      products: l1Products.map(p => ({ id: p.id, name: p.name })),
      documentRequirements: Object.keys(l1DocumentRequirements),
    });

  } catch (error: any) {
    console.error('Error creating L-1 visa products:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create L-1 visa products',
    });
  }
}
