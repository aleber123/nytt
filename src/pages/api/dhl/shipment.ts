/**
 * DHL Shipment API Route
 * 
 * Handles shipment creation (return labels) via DHL Express API.
 * This route protects API credentials by keeping them server-side.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { rateLimiters, getClientIp } from '@/lib/rateLimit';

// DHL API Configuration
const DHL_CONFIG = {
  apiKey: process.env.DHL_API_KEY || '',
  apiSecret: process.env.DHL_API_SECRET || '',
  accountNumber: process.env.DHL_ACCOUNT_NUMBER || '',
  useSandbox: process.env.DHL_USE_SANDBOX !== 'false',
};

const getBaseUrl = () => 
  DHL_CONFIG.useSandbox 
    ? 'https://express.api.dhl.com/mydhlapi/test'
    : 'https://express.api.dhl.com/mydhlapi';

const getAuthHeader = () => {
  const credentials = `${DHL_CONFIG.apiKey}:${DHL_CONFIG.apiSecret}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
};

// DOX Visumpartner company details
const DOX_COMPANY = {
  postalAddress: {
    postalCode: '12162',
    cityName: 'Johanneshov',
    countryCode: 'SE',
    addressLine1: 'Livdjursgatan 4, våning 6'
  },
  contactInformation: {
    companyName: 'DOX Visumpartner AB',
    fullName: 'Henrik Oinas',
    phone: '+46840941900',
    email: 'info@doxvl.se'
  }
};

interface ShipmentRequestBody {
  orderNumber: string;
  shippingDate: string; // ISO date string
  receiver: {
    address: {
      postalCode: string;
      cityName: string;
      countryCode: string;
      addressLine1: string;
      addressLine2?: string;
    };
    contact: {
      companyName?: string;
      fullName: string;
      phone: string;
      email?: string;
    };
  };
  includePickup?: boolean;
  productCode?: string; // 'D' for domestic, 'P' for international
  premiumDelivery?: string; // 'dhl-pre-9' or 'dhl-pre-12' for time-definite delivery
  packages?: {
    weight: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
  }[];
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
  const rateLimit = rateLimiters.dhl(clientIp);
  
  if (!rateLimit.success) {
    return res.status(429).json({ 
      error: 'Too many requests',
      retryAfter: rateLimit.resetIn
    });
  }

  // Check if API credentials are configured
  if (!DHL_CONFIG.apiKey || !DHL_CONFIG.apiSecret) {
    return res.status(500).json({ 
      error: 'DHL API credentials not configured',
      details: 'Please set DHL_API_KEY and DHL_API_SECRET environment variables'
    });
  }

  try {
    const body: ShipmentRequestBody = req.body;

    // Validate required fields
    if (!body.orderNumber || !body.shippingDate || !body.receiver) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'orderNumber, shippingDate, and receiver are required'
      });
    }

    // Convert country name to ISO code if needed
    const countryNameToCode: Record<string, string> = {
      'Sweden': 'SE', 'Sverige': 'SE',
      'Norway': 'NO', 'Norge': 'NO',
      'Denmark': 'DK', 'Danmark': 'DK',
      'Finland': 'FI',
      'Germany': 'DE', 'Deutschland': 'DE', 'Tyskland': 'DE',
      'United Kingdom': 'GB', 'UK': 'GB', 'Storbritannien': 'GB',
      'United States': 'US', 'USA': 'US',
      'France': 'FR', 'Frankrike': 'FR',
      'Spain': 'ES', 'Spanien': 'ES',
      'Italy': 'IT', 'Italien': 'IT',
      'Netherlands': 'NL', 'Nederländerna': 'NL',
      'Belgium': 'BE', 'Belgien': 'BE',
      'Austria': 'AT', 'Österrike': 'AT',
      'Switzerland': 'CH', 'Schweiz': 'CH',
      'Poland': 'PL', 'Polen': 'PL',
    };
    
    let receiverCountryCode = body.receiver.address.countryCode;
    if (receiverCountryCode.length > 2) {
      receiverCountryCode = countryNameToCode[receiverCountryCode] || receiverCountryCode.substring(0, 2).toUpperCase();
    }

    // Determine product code based on destination country and premium delivery option
    const isDomestic = receiverCountryCode === 'SE';
    
    // EU country codes
    const euCountries = [
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES'
    ];
    const isEU = euCountries.includes(receiverCountryCode);
    
    // DHL Product codes for DOCUMENTS:
    // 
    // DOMESTIC (Sweden):
    //   N = DOMESTIC EXPRESS (standard)
    //   1 = DOMESTIC EXPRESS 12:00 (Pre 12)
    //   I = DOMESTIC EXPRESS 9:00 (Pre 9)
    //
    // EU:
    //   U = EXPRESS WORLDWIDE (standard)
    //   T = EXPRESS 12:00 (Pre 12)
    //   K = EXPRESS 9:00 (Pre 9)
    //
    // Outside EU (documents):
    //   D = EXPRESS WORLDWIDE DOX (standard)
    //   T = EXPRESS 12:00 (Pre 12) - limited destinations
    //   K = EXPRESS 9:00 (Pre 9) - limited destinations
    
    let productCode: string;
    let deliveryTimeNote = '';
    
    if (isDomestic) {
      // Sweden domestic
      if (body.premiumDelivery === 'dhl-pre-9') {
        productCode = 'I'; // DOMESTIC EXPRESS 9:00
        deliveryTimeNote = ' - Leverans före 09:00';
      } else if (body.premiumDelivery === 'dhl-pre-12') {
        productCode = '1'; // DOMESTIC EXPRESS 12:00
        deliveryTimeNote = ' - Leverans före 12:00';
      } else {
        productCode = 'N'; // DOMESTIC EXPRESS (standard)
      }
    } else if (isEU) {
      // EU countries
      if (body.premiumDelivery === 'dhl-pre-9') {
        productCode = 'K'; // EXPRESS 9:00
        deliveryTimeNote = ' - Leverans före 09:00';
      } else if (body.premiumDelivery === 'dhl-pre-12') {
        productCode = 'T'; // EXPRESS 12:00
        deliveryTimeNote = ' - Leverans före 12:00';
      } else {
        productCode = 'U'; // EXPRESS WORLDWIDE
      }
    } else {
      // Outside EU (documents)
      if (body.premiumDelivery === 'dhl-pre-9') {
        productCode = 'K'; // EXPRESS 9:00 (limited destinations)
        deliveryTimeNote = ' - Leverans före 09:00';
      } else if (body.premiumDelivery === 'dhl-pre-12') {
        productCode = 'T'; // EXPRESS 12:00 (limited destinations)
        deliveryTimeNote = ' - Leverans före 12:00';
      } else {
        productCode = 'D'; // EXPRESS WORLDWIDE DOX
      }
    }
    
    // Allow override from request body
    if (body.productCode) {
      productCode = body.productCode;
    }

    // Build DHL API request - simplified for sandbox compatibility
    const dhlRequest: any = {
      plannedShippingDateAndTime: `${body.shippingDate}T10:00:00 GMT+01:00`,
      pickup: {
        isRequested: false
      },
      productCode,
      accounts: [{
        typeCode: 'shipper',
        number: DHL_CONFIG.accountNumber
      }],
      customerDetails: {
        shipperDetails: DOX_COMPANY,
        receiverDetails: {
          postalAddress: {
            postalCode: body.receiver.address.postalCode,
            cityName: body.receiver.address.cityName,
            countryCode: receiverCountryCode,
            addressLine1: body.receiver.address.addressLine1
          },
          contactInformation: {
            companyName: body.receiver.contact.companyName || body.receiver.contact.fullName,
            fullName: body.receiver.contact.fullName,
            phone: body.receiver.contact.phone,
            email: body.receiver.contact.email
          }
        }
      },
      content: {
        packages: [{
          weight: 0.5,
          dimensions: { length: 35, width: 27, height: 1 }
        }],
        isCustomsDeclarable: false,
        description: `Legalized documents - Order ${body.orderNumber}`,
        incoterm: 'DAP',
        unitOfMeasurement: 'metric'
      }
    };


    // Call DHL API
    const dhlResponse = await fetch(`${getBaseUrl()}/shipments`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(dhlRequest)
    });

    const responseData = await dhlResponse.json().catch(() => ({}));

    if (!dhlResponse.ok) {
      console.error('DHL Shipment API Error:', JSON.stringify(responseData, null, 2));
      
      let errorDetails = responseData.detail || responseData.title || responseData.message || 'Unknown error';
      if (responseData.additionalDetails) {
        errorDetails += ' - ' + JSON.stringify(responseData.additionalDetails);
      }
      
      return res.status(dhlResponse.status).json({
        error: 'DHL API Error',
        status: dhlResponse.status,
        details: errorDetails,
        dhlResponse: responseData
      });
    }

    // Return success response
    return res.status(200).json({
      success: true,
      shipmentTrackingNumber: responseData.shipmentTrackingNumber,
      trackingUrl: responseData.trackingUrl,
      dispatchConfirmationNumber: responseData.dispatchConfirmationNumber,
      packages: responseData.packages,
      documents: responseData.documents, // Contains base64 encoded labels
      warnings: responseData.warnings,
      environment: DHL_CONFIG.useSandbox ? 'sandbox' : 'production'
    });

  } catch (error: any) {
    console.error('DHL Shipment API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
