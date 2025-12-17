/**
 * PostNord Shipment API Route
 * 
 * Handles shipment creation (Rekommenderad post / Registered Mail) via PostNord Booking API.
 * This route protects API credentials by keeping them server-side.
 * 
 * PostNord API Documentation:
 * - Sandbox: atapi2.postnord.com
 * - Production: api2.postnord.com
 * - Booking API v3: /rest/shipment/v3/booking
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
  street1: 'Livdjursgatan 4, våning 6',
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

    // Build PostNord Booking API request
    // Using Shipment API v3 format
    const postnordRequest = {
      shipment: {
        service: {
          basicServiceCode: serviceCode,
          additionalServiceCodes: body.withReceipt ? ['A1'] : [] // A1 = Mottagningsbevis
        },
        parties: {
          sender: {
            name: DOX_COMPANY.name,
            contact: DOX_COMPANY.contact,
            address1: DOX_COMPANY.street1,
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
        parcels: [{
          weight: {
            value: body.weight || 100, // Default 100g for documents
            unit: 'g'
          },
          contents: `Legalized documents - Order ${body.orderNumber}`
        }],
        orderNo: body.orderNumber,
        customerNo: POSTNORD_CONFIG.customerNumber,
        senderReference: body.orderNumber,
        receiverReference: body.orderNumber
      },
      printConfig: {
        format: 'PDF',
        paperSize: 'A4'
      }
    };

    // Call PostNord Booking API
    const apiUrl = `${getBaseUrl()}/rest/shipment/v3/booking.json?apikey=${POSTNORD_CONFIG.apiKey}`;
    
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
      if (responseData.errors && Array.isArray(responseData.errors)) {
        errorDetails = responseData.errors.map((e: any) => e.message || e).join(', ');
      }
      
      return res.status(postnordResponse.status).json({
        error: 'PostNord API Error',
        status: postnordResponse.status,
        details: errorDetails,
        postnordResponse: responseData
      });
    }

    // Extract shipment details from response
    const shipmentId = responseData.shipmentId || responseData.id;
    const trackingNumber = responseData.itemId || responseData.trackingNumber;
    
    // Generate public tracking URL
    const publicTrackingUrl = trackingNumber 
      ? `https://www.postnord.se/vara-verktyg/spara-brev-paket-och-pall?shipmentId=${trackingNumber}`
      : null;

    // Extract label PDF if available
    let labelBase64 = null;
    if (responseData.labels && responseData.labels.length > 0) {
      labelBase64 = responseData.labels[0].data || responseData.labels[0].content;
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
