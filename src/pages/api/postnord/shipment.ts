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

// Generate unique item ID for PostNord (format: RR123456789SE for registered mail)
function generateItemId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nums = '0123456789';
  let id = 'RR'; // Registered mail prefix
  for (let i = 0; i < 9; i++) {
    id += nums.charAt(Math.floor(Math.random() * nums.length));
  }
  id += 'SE'; // Country code
  return id;
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

    // Build PostNord EDI Labels API request
    // Using Shipment API v3 EDI format
    const postnordRequest = {
      messageDate: messageDate,
      updateIndicator: 'Original',
      shipment: [{
        shipmentId: body.orderNumber,
        dateOfDespatch: body.shippingDate,
        service: {
          basicServiceCode: serviceCode,
          additionalServiceCode: body.withReceipt ? ['A1'] : []
        },
        numberOfParcels: 1,
        parties: {
          sender: {
            partyId: {
              type: 'CustomerNumber',
              value: POSTNORD_CONFIG.customerNumber
            },
            name: DOX_COMPANY.name,
            contact: DOX_COMPANY.contact,
            address1: DOX_COMPANY.street1,
            address2: DOX_COMPANY.street2,
            postalCode: DOX_COMPANY.postalCode,
            city: DOX_COMPANY.city,
            countryCode: DOX_COMPANY.countryCode,
            phone: DOX_COMPANY.phone,
            email: DOX_COMPANY.email
          },
          receiver: {
            name: body.receiver.name,
            address1: body.receiver.street1,
            address2: body.receiver.street2 || '',
            postalCode: body.receiver.postalCode,
            city: body.receiver.city,
            countryCode: body.receiver.countryCode.toUpperCase(),
            phone: body.receiver.phone || '',
            email: body.receiver.email || ''
          }
        },
        items: [{
          itemId: itemId,
          grossWeight: {
            value: (body.weight || 100) / 1000, // Convert grams to kg
            unit: 'kg'
          },
          volume: {
            value: 0.001, // 1 liter for documents
            unit: 'm3'
          }
        }],
        references: {
          reference: [{
            referenceType: 'CU',
            value: body.orderNumber
          }]
        }
      }]
    };

    // Call PostNord EDI Labels API
    const apiUrl = `${getBaseUrl()}/rest/shipment/v3/edi/labels?apikey=${POSTNORD_CONFIG.apiKey}`;
    
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
