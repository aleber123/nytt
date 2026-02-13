/**
 * Passport Scan API
 * 
 * Accepts a passport image (base64), uses Google Cloud Vision API
 * to extract text, then parses the MRZ to get structured passport data.
 * 
 * POST /api/admin/passport-scan
 * Body: { image: string (base64), orderId?: string, travelerIndex?: number }
 * Returns: { success: boolean, data?: PassportData, error?: string }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyAdmin } from '@/lib/adminAuth';
import { parsePassportFromText, extractMRZFromText, parseMRZ } from '@/services/passportService';
import type { PassportData } from '@/services/passportService';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

/**
 * Call Google Cloud Vision API for text detection
 */
async function detectTextFromImage(imageBase64: string): Promise<string> {
  // Use the service account credentials for authentication
  let accessToken: string;
  
  const isGoogleCloud = process.env.K_SERVICE || process.env.GOOGLE_CLOUD_PROJECT;
  
  if (isGoogleCloud) {
    // In Cloud Run, use metadata server for access token
    const tokenRes = await fetch(
      'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
      { headers: { 'Metadata-Flavor': 'Google' } }
    );
    const tokenData = await tokenRes.json();
    accessToken = tokenData.access_token;
  } else {
    // Local development: use service account to get access token
    const { GoogleAuth } = require('google-auth-library');
    const auth = new GoogleAuth({
      keyFilename: require('path').join(process.cwd(), 'service-account.json'),
      scopes: ['https://www.googleapis.com/auth/cloud-vision'],
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    accessToken = tokenResponse.token || '';
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'doxvl-51a30';
  
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
    throw new Error('No text detected in the image');
  }

  return annotations[0].description || '';
}

/**
 * Try to extract MRZ directly from individual text blocks
 * (sometimes Vision API returns MRZ as separate blocks)
 */
function tryExtractMRZFromBlocks(visionText: string): { line1: string; line2: string } | null {
  // First try the standard extraction
  const standard = extractMRZFromText(visionText);
  if (standard) return standard;
  
  // Try joining all lines and looking for P< pattern
  const allText = visionText.replace(/\n/g, ' ');
  const pMatch = allText.match(/P[<A-Z][A-Z<]{41,43}/g);
  if (pMatch && pMatch.length >= 1) {
    const line1 = pMatch[0].substring(0, 44);
    // Find the next 44-char block of MRZ characters after line1
    const afterLine1 = allText.substring(allText.indexOf(line1) + line1.length);
    const line2Match = afterLine1.match(/[A-Z0-9<]{40,44}/);
    if (line2Match) {
      return { line1, line2: line2Match[0].substring(0, 44) };
    }
  }
  
  return null;
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
    const { image, orderId, travelerIndex } = req.body as {
      image: string;
      orderId?: string;
      travelerIndex?: number;
    };

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

    // Try enhanced MRZ extraction first
    const mrzLines = tryExtractMRZFromBlocks(rawText);
    let passportData: PassportData | null = null;
    
    if (mrzLines) {
      passportData = parseMRZ(mrzLines.line1, mrzLines.line2);
    }
    
    // Fallback to standard text parsing
    if (!passportData) {
      const result = parsePassportFromText(rawText);
      if (result.success && result.data) {
        passportData = result.data;
      } else {
        return res.status(200).json({
          success: false,
          rawText,
          error: result.error || 'Could not parse passport MRZ from the image.',
        });
      }
    }

    // If orderId provided, save the extracted data to the order
    if (orderId && passportData) {
      try {
        const db = getAdminDb();
        const orderRef = db.collection('orders').doc(orderId);
        const orderSnap = await orderRef.get();
        
        if (orderSnap.exists) {
          const orderData = orderSnap.data() as any;
          const travelers = orderData.travelers || [];
          const idx = travelerIndex ?? 0;
          
          if (travelers[idx]) {
            // Update traveler with passport data
            travelers[idx] = {
              ...travelers[idx],
              passportData: {
                ...passportData,
                extractedAt: new Date().toISOString(),
                extractedBy: admin.email,
              },
              // Also update top-level traveler fields if empty
              firstName: travelers[idx].firstName || passportData.givenNames.split(' ')[0],
              lastName: travelers[idx].lastName || passportData.surname,
            };
            
            await orderRef.update({ travelers });
          }
        }
      } catch (saveError: any) {
        // Non-critical — still return the data
      }
    }

    return res.status(200).json({
      success: true,
      data: passportData,
      rawText,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: `Passport scan failed: ${error.message}`,
    });
  }
}
