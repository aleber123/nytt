/**
 * Business Card Scanner API
 * 
 * Accepts a base64 image (one page from a scanned PDF), uses Google Cloud Vision API
 * to extract text, then parses contact information (name, email, phone, company, title).
 * 
 * POST /api/admin/business-card-scan
 * Body: { image: string (base64) }
 * Returns: { success: boolean, contacts?: ParsedContact[], rawText?: string, error?: string }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdmin } from '@/lib/adminAuth';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export interface ParsedContact {
  contactName: string;
  companyName: string;
  email: string;
  phone: string;
  title: string;
  website: string;
  notes: string;
}

/**
 * Call Google Cloud Vision API for text detection
 */
async function detectTextFromImage(imageBase64: string): Promise<string> {
  let accessToken: string;
  
  const isGoogleCloud = process.env.K_SERVICE || process.env.GOOGLE_CLOUD_PROJECT;
  
  if (isGoogleCloud) {
    const tokenRes = await fetch(
      'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
      { headers: { 'Metadata-Flavor': 'Google' } }
    );
    const tokenData = await tokenRes.json();
    accessToken = tokenData.access_token;
  } else {
    const { GoogleAuth } = require('google-auth-library');
    const auth = new GoogleAuth({
      keyFilename: require('path').join(process.cwd(), 'service-account.json'),
      scopes: ['https://www.googleapis.com/auth/cloud-vision'],
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    accessToken = tokenResponse.token || '';
  }

  const visionResponse = await fetch(
    `https://vision.googleapis.com/v1/images:annotate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          image: { content: imageBase64 },
          features: [
            { type: 'TEXT_DETECTION', maxResults: 1 },
          ],
        }],
      }),
    }
  );

  if (!visionResponse.ok) {
    const errorText = await visionResponse.text();
    throw new Error(`Vision API error: ${visionResponse.status} - ${errorText}`);
  }

  const visionData = await visionResponse.json();
  const annotations = visionData.responses?.[0]?.textAnnotations;
  
  if (!annotations || annotations.length === 0) {
    return '';
  }

  return annotations[0].description || '';
}

/**
 * Parse business card text into structured contact data.
 * A single page may contain multiple business cards.
 */
function parseBusinessCards(rawText: string): ParsedContact[] {
  if (!rawText.trim()) return [];

  // Split text into potential card blocks.
  // Business cards on a scanned page are usually separated by large gaps.
  // We try splitting by double newlines or by detecting email boundaries.
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  // Extract ALL emails from the entire text
  const allEmails: string[] = [];
  const emailRegex = /[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g;
  for (const line of lines) {
    const matches = line.match(emailRegex);
    if (matches) {
      for (const m of matches) {
        const email = m.toLowerCase();
        if (!allEmails.includes(email)) {
          allEmails.push(email);
        }
      }
    }
  }

  if (allEmails.length === 0) return [];

  // For each email, try to find surrounding context to build a contact
  const contacts: ParsedContact[] = [];

  for (const email of allEmails) {
    // Find the line index containing this email
    const emailLineIdx = lines.findIndex(l => l.toLowerCase().includes(email));
    
    // Gather context: lines around the email (business card is usually 5-10 lines)
    const startIdx = Math.max(0, emailLineIdx - 8);
    const endIdx = Math.min(lines.length, emailLineIdx + 8);
    const contextLines = lines.slice(startIdx, endIdx);
    const contextText = contextLines.join('\n');

    const contact = parseContactFromContext(email, contextText, contextLines);
    contacts.push(contact);
  }

  return contacts;
}

/**
 * Parse a single contact from surrounding text context
 */
function parseContactFromContext(email: string, contextText: string, contextLines: string[]): ParsedContact {
  // Extract phone numbers (Swedish and international formats)
  let phone = '';
  const phonePatterns = [
    /(?:\+46|0046)\s*[\d\s\-()]{7,15}/,
    /0\d[\d\s\-()]{6,12}/,
    /\+\d{1,3}\s*[\d\s\-()]{7,15}/,
  ];
  for (const pattern of phonePatterns) {
    const match = contextText.match(pattern);
    if (match) {
      phone = match[0].replace(/\s+/g, ' ').trim();
      break;
    }
  }

  // Extract website
  let website = '';
  const webMatch = contextText.match(/(?:www\.)[a-zA-Z0-9\-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?/i);
  if (webMatch) {
    website = webMatch[0].toLowerCase();
  } else {
    // Try to derive from email domain
    const domain = email.split('@')[1];
    if (domain && !domain.includes('gmail') && !domain.includes('hotmail') && !domain.includes('yahoo') && !domain.includes('outlook') && !domain.includes('icloud')) {
      website = 'www.' + domain;
    }
  }

  // Extract company name from email domain as fallback
  const domain = email.split('@')[1] || '';
  const domainBase = domain.split('.')[0] || '';
  let companyFromDomain = domainBase.charAt(0).toUpperCase() + domainBase.slice(1);

  // Try to find company name in context (usually in ALL CAPS or prominent position)
  let companyName = '';
  const companyPatterns = [
    // Lines that are mostly uppercase (company names)
    ...contextLines.filter(l => {
      const cleaned = l.replace(/[^a-zA-ZåäöÅÄÖ\s]/g, '').trim();
      return cleaned.length > 2 && cleaned === cleaned.toUpperCase() && !l.includes('@') && !phonePatterns.some(p => p.test(l));
    }),
    // Lines containing AB, Ltd, Inc, etc.
    ...contextLines.filter(l => /\b(?:AB|Ltd|Inc|GmbH|AS|Oy|ApS|BV|SA|SRL|HB|KB)\b/i.test(l) && !l.includes('@')),
  ];
  if (companyPatterns.length > 0) {
    companyName = companyPatterns[0].trim();
  }
  if (!companyName) {
    companyName = companyFromDomain;
  }

  // Extract person name
  let contactName = '';
  
  // Try to find name from context: lines that look like names (2-3 capitalized words, no special chars)
  const namePattern = /^([A-ZÅÄÖ][a-zåäö]+(?:\s+[A-ZÅÄÖ][a-zåäö]+){1,3})$/;
  for (const line of contextLines) {
    const cleaned = line.replace(/[,.:;]/g, '').trim();
    if (namePattern.test(cleaned) && !cleaned.includes('@') && cleaned.toLowerCase() !== companyName.toLowerCase()) {
      contactName = cleaned;
      break;
    }
  }

  // Fallback: derive from email local part (firstname.lastname@)
  if (!contactName) {
    const localPart = email.split('@')[0] || '';
    if (localPart.includes('.') || localPart.includes('_')) {
      const parts = localPart.split(/[._]/).filter(p => p.length > 1 && !/^\d+$/.test(p));
      if (parts.length >= 2) {
        contactName = parts
          .slice(0, 2)
          .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
          .join(' ');
      }
    }
  }

  // Extract title/role
  let title = '';
  const titleKeywords = /\b(?:CEO|CTO|CFO|COO|VD|Director|Manager|Chef|Head|Partner|Founder|Grundare|Konsult|Consultant|Sales|Säljare|Advokat|Lawyer|Jurist|Account|Koordinator|Coordinator|Specialist|Ansvarig|Handläggare|Projektledare|Project\s*Manager)\b/i;
  for (const line of contextLines) {
    if (titleKeywords.test(line) && !line.includes('@') && line !== contactName && line !== companyName) {
      title = line.replace(/[,.:;]/g, '').trim();
      break;
    }
  }

  // Collect remaining lines as notes (excluding already extracted data)
  const usedValues = [email, phone, website, companyName, contactName, title].map(v => v.toLowerCase()).filter(Boolean);
  const noteLines = contextLines.filter(line => {
    const lower = line.toLowerCase().trim();
    return lower.length > 0 && !usedValues.some(v => lower.includes(v)) && !phonePatterns.some(p => p.test(line));
  });

  return {
    contactName,
    companyName,
    email,
    phone,
    title,
    website,
    notes: noteLines.slice(0, 3).join(', '),
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await verifyAdmin(req, res, 'admin');
  if (!admin) return;

  try {
    const { image } = req.body as { image: string };

    if (!image) {
      return res.status(400).json({ error: 'Missing image data' });
    }

    // Strip data URL prefix if present
    const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');

    // Call Vision API
    let rawText: string;
    try {
      rawText = await detectTextFromImage(base64Data);
    } catch (visionError: any) {
      return res.status(500).json({
        success: false,
        error: `OCR failed: ${visionError.message}`,
      });
    }

    if (!rawText.trim()) {
      return res.status(200).json({
        success: true,
        contacts: [],
        rawText: '',
        message: 'No text detected in the image',
      });
    }

    // Parse contacts from OCR text
    const contacts = parseBusinessCards(rawText);

    return res.status(200).json({
      success: true,
      contacts,
      rawText,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: `Business card scan failed: ${error.message}`,
    });
  }
}
