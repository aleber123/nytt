/**
 * PostNord Shipment API Route
 * 
 * Handles shipment creation (Rekommenderad post / Registered Mail) via PostNord Booking API.
 * This route protects API credentials by keeping them server-side.
 * 
 * PostNord API Documentation:
 * - Sandbox: atapi2.postnord.com
 * - Production: api2.postnord.com
 * - EDI Labels API v3: /rest/shipment/v3/edi/labels
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { rateLimiters, getClientIp } from '@/lib/rateLimit';

// PostNord API Configuration
const POSTNORD_CONFIG = {
  apiKey: process.env.POSTNORD_API_KEY || '',
  customerNumber: process.env.POSTNORD_CUSTOMER_NUMBER || '',
  useSandbox: process.env.POSTNORD_USE_SANDBOX !== 'false',
};

const getBaseUrl = () => 
  POSTNORD_CONFIG.useSandbox 
    ? 'https://atapi2.postnord.com'
    : 'https://api2.postnord.com';

// DOX Visumpartner company details (sender)
const DOX_COMPANY = {
  name: 'DOX Visumpartner AB',
  contact: 'Henrik Oinas',
  street1: 'Livdjursgatan 4',
  street2: 'Våning 6',
  postalCode: '12162',
  city: 'Johanneshov',
  countryCode: 'SE',
  phone: '+46840941900',
  email: 'info@doxvl.se'
};

// PostNord Service Codes for Sweden
// REK = Rekommenderad post (Registered Mail)
const SERVICE_CODES = {
  // Domestic Sweden
  REK_DOMESTIC: '38', // Rekommenderat brev inrikes
  REK_DOMESTIC_RECEIPT: '39', // Rekommenderat brev med mottagningsbevis
  
  // International
  REK_INTERNATIONAL: '34', // Rekommenderat brev utrikes
  REK_INTERNATIONAL_RECEIPT: '35', // Rekommenderat brev utrikes med mottagningsbevis
};

interface PostNordShipmentRequest {
  orderNumber: string;
  shippingDate: string; // ISO date string YYYY-MM-DD
  receiver: {
    name: string;
    street1: string;
    street2?: string;
    postalCode: string;
    city: string;
    countryCode: string;
    phone?: string;
    email?: string;
  };
  serviceCode?: string; // Override default service code
  withReceipt?: boolean; // Request delivery receipt (mottagningsbevis)
  weight?: number; // Weight in grams, default 100g for documents
}

// Generate unique item ID with correct S10 check digit
// S10 format: 2 letters + 8 digits + check digit + 2 letter country code
// Check digit calculation: weighted sum mod 11, mapped to 0-9 (5 for 10, 0 for 11)
function generateItemId(): string {
  const prefix = 'RR'; // Registered mail prefix
  const countryCode = 'SE';
  
  // Generate 8 random digits
  let digits = '';
  for (let i = 0; i < 8; i++) {
    digits += Math.floor(Math.random() * 10).toString();
  }
  
  // Calculate S10 check digit
  // Weights: 8, 6, 4, 2, 3, 5, 9, 7 for positions 1-8
  const weights = [8, 6, 4, 2, 3, 5, 9, 7];
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += parseInt(digits[i]) * weights[i];
  }
  const remainder = sum % 11;
  let checkDigit: number;
  if (remainder === 0) checkDigit = 5;
  else if (remainder === 1) checkDigit = 0;
  else checkDigit = 11 - remainder;
  
  return `${prefix}${digits}${checkDigit}${countryCode}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const clientIp = getClientIp(req);
  const rateLimit = rateLimiters.postnord(clientIp);
  
  if (!rateLimit.success) {
    return res.status(429).json({ 
      error: 'Too many requests',
      retryAfter: rateLimit.resetIn
    });
  }

  // Check if API credentials are configured
  if (!POSTNORD_CONFIG.apiKey) {
    return res.status(500).json({ 
      error: 'PostNord API credentials not configured',
      details: 'Please set POSTNORD_API_KEY environment variable'
    });
  }

  if (!POSTNORD_CONFIG.customerNumber) {
    return res.status(500).json({ 
      error: 'PostNord customer number not configured',
      details: 'Please set POSTNORD_CUSTOMER_NUMBER environment variable'
    });
  }

  try {
    const body: PostNordShipmentRequest = req.body;

    // Validate required fields
    if (!body.orderNumber || !body.shippingDate || !body.receiver) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'orderNumber, shippingDate, and receiver are required'
      });
    }

    // Determine if domestic or international
    const isDomestic = body.receiver.countryCode.toUpperCase() === 'SE';
    
    // Select appropriate service code
    let serviceCode: string;
    if (body.serviceCode) {
      serviceCode = body.serviceCode;
    } else if (isDomestic) {
      serviceCode = body.withReceipt 
        ? SERVICE_CODES.REK_DOMESTIC_RECEIPT 
        : SERVICE_CODES.REK_DOMESTIC;
    } else {
      serviceCode = body.withReceipt 
        ? SERVICE_CODES.REK_INTERNATIONAL_RECEIPT 
        : SERVICE_CODES.REK_INTERNATIONAL;
    }

    // Generate message date in ISO format
    const messageDate = new Date().toISOString();
    
    // Generate unique item ID
    const itemId = generateItemId();

    // Build PostNord EDI Labels API request according to Swagger spec
    // The request body must follow the ediInstruction schema
    const postnordRequest = {
      messageDate: messageDate,
      messageFunction: 'Instruction',
      updateIndicator: 'Original',
      shipment: [{
        shipmentIdentification: {
          shipmentId: body.orderNumber
        },
        dateAndTimes: {
          loadingDate: `${body.shippingDate}T08:00:00Z`
        },
        service: {
          basicServiceCode: serviceCode,
          ...(body.withReceipt ? { additionalServiceCode: ['A1'] } : {})
        },
        numberOfPackages: {
          value: 1
        },
        totalGrossWeight: {
          value: (body.weight || 100) / 1000,
          unit: 'KGM'
        },
        parties: {
          consignor: {
            issuerCode: 'Z12', // Z12 = PostNord Sweden
            partyIdentification: {
              partyId: POSTNORD_CONFIG.customerNumber,
              partyIdType: '160' // 160 = Customer number
            },
            party: {
              nameIdentification: {
                name: DOX_COMPANY.name,
                companyName: DOX_COMPANY.name
              },
              address: {
                streets: [DOX_COMPANY.street1, DOX_COMPANY.street2],
                postalCode: DOX_COMPANY.postalCode,
                city: DOX_COMPANY.city,
                countryCode: DOX_COMPANY.countryCode
              },
              contact: {
                contactName: DOX_COMPANY.contact,
                emailAddress: DOX_COMPANY.email,
                phoneNo: DOX_COMPANY.phone
              }
            }
          },
          consignee: {
            party: {
              nameIdentification: {
                name: body.receiver.name
              },
              address: {
                streets: [body.receiver.street1, body.receiver.street2 || ''].filter(s => s),
                postalCode: body.receiver.postalCode,
                city: body.receiver.city,
                countryCode: body.receiver.countryCode.toUpperCase()
              },
              contact: {
                emailAddress: body.receiver.email || '',
                phoneNo: body.receiver.phone || '',
                smsNo: body.receiver.phone || ''
              }
            }
          }
        },
        goodsItem: [{
          packageTypeCode: 'EN', // EN = Envelope (for documents)
          numberOfPackageTypeCodeItems: {
            value: 1
          },
          items: [{
            itemIdentification: {
              itemId: itemId,
              itemIdType: 'S10'
            },
            grossWeight: {
              value: (body.weight || 100) / 1000,
              unit: 'KGM'
            }
          }]
        }],
        references: [{
          referenceNo: body.orderNumber,
          referenceType: 'CU'
        }]
      }]
    };

    // Call PostNord EDI Labels API - use /v3/edi/labels/pdf endpoint
    const apiUrl = `${getBaseUrl()}/rest/shipment/v3/edi/labels/pdf?apikey=${POSTNORD_CONFIG.apiKey}`;
    
    const postnordResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(postnordRequest)
    });

    const responseData = await postnordResponse.json().catch(() => ({}));

    if (!postnordResponse.ok) {
      let errorDetails = responseData.message || responseData.error || 'Unknown error';
      if (responseData.compositeFault?.faults && Array.isArray(responseData.compositeFault.faults)) {
        errorDetails = responseData.compositeFault.faults.map((e: any) => e.explanationText || e.message || e).join(', ');
      }
      if (responseData.errors && Array.isArray(responseData.errors)) {
        errorDetails = responseData.errors.map((e: any) => e.message || e).join(', ');
      }
      
      return res.status(postnordResponse.status).json({
        error: 'PostNord API Error',
        status: postnordResponse.status,
        details: errorDetails,
        postnordResponse: responseData,
        sentRequest: postnordRequest
      });
    }

    // Extract shipment details from response
    const shipmentResult = responseData.shipment?.[0] || responseData;
    const shipmentId = shipmentResult.shipmentId || responseData.shipmentId || body.orderNumber;
    const trackingNumber = shipmentResult.items?.[0]?.itemId || itemId;
    
    // Generate public tracking URL
    const publicTrackingUrl = trackingNumber 
      ? `https://www.postnord.se/vara-verktyg/spara-brev-paket-och-pall?shipmentId=${trackingNumber}`
      : null;

    // Extract label PDF if available
    let labelBase64 = null;
    if (shipmentResult.labels && shipmentResult.labels.length > 0) {
      labelBase64 = shipmentResult.labels[0].data || shipmentResult.labels[0].content || shipmentResult.labels[0].labelData;
    } else if (responseData.labels && responseData.labels.length > 0) {
      labelBase64 = responseData.labels[0].data || responseData.labels[0].content || responseData.labels[0].labelData;
    } else if (responseData.printout) {
      labelBase64 = responseData.printout;
    }

    // Return success response
    return res.status(200).json({
      success: true,
      shipmentId,
      trackingNumber,
      trackingUrl: publicTrackingUrl,
      labelBase64,
      serviceCode,
      serviceName: isDomestic 
        ? (body.withReceipt ? 'Rekommenderat brev med mottagningsbevis' : 'Rekommenderat brev')
        : (body.withReceipt ? 'Rekommenderat brev utrikes med mottagningsbevis' : 'Rekommenderat brev utrikes'),
      environment: POSTNORD_CONFIG.useSandbox ? 'sandbox' : 'production',
      rawResponse: responseData
    });

  } catch (error: any) {
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
