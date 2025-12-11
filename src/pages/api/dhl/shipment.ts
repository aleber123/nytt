/**
 * DHL Shipment API Route
 * 
 * Handles shipment creation (return labels) via DHL Express API.
 * This route protects API credentials by keeping them server-side.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

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

    // Determine product code based on destination country
    const isInternational = body.receiver.address.countryCode !== 'SE';
    const productCode = body.productCode || (isInternational ? 'P' : 'D');

    // Build DHL API request
    const dhlRequest = {
      plannedShippingDateAndTime: `${body.shippingDate}T10:00:00 GMT+01:00`,
      pickup: {
        isRequested: body.includePickup || false,
        closeTime: body.includePickup ? '18:00' : undefined,
        location: body.includePickup ? 'office' : undefined
      },
      productCode,
      localProductCode: productCode,
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
            countryCode: body.receiver.address.countryCode,
            addressLine1: body.receiver.address.addressLine1,
            addressLine2: body.receiver.address.addressLine2
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
        // Always 1 Express Envelope package
        packages: [{
          weight: 0.5,
          dimensions: { length: 35, width: 27.5, height: 1 } // DHL Express Envelope max dimensions
        }],
        isCustomsDeclarable: isInternational,
        description: `Legalized documents - Order ${body.orderNumber}`,
        incoterm: 'DAP',
        unitOfMeasurement: 'metric'
      },
      // Add shipment reference for easy tracking
      shipmentNotification: [{
        typeCode: 'email',
        receiverId: 'info@doxvl.se',
        languageCode: 'swe'
      }],
      customerReferences: [{
        value: body.orderNumber,
        typeCode: 'CU' // Customer reference
      }],
      outputImageProperties: {
        printerDPI: 300,
        encodingFormat: 'pdf',
        imageOptions: [
          { typeCode: 'label', isRequested: true },
          { typeCode: 'waybillDoc', isRequested: true }
        ]
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
      return res.status(dhlResponse.status).json({
        error: 'DHL API Error',
        status: dhlResponse.status,
        details: responseData.detail || responseData.title || 'Unknown error',
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
