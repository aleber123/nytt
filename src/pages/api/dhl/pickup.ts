/**
 * DHL Pickup API Route
 * 
 * Handles pickup booking requests via DHL Express API.
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

interface PickupRequestBody {
  pickupDate: string; // ISO date string
  closeTime: string; // HH:MM format
  location: string;
  orderNumber?: string; // For tracking reference
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
  specialInstructions?: string;
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
    const body: PickupRequestBody = req.body;

    // Validate required fields
    if (!body.pickupDate || !body.address || !body.contact) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'pickupDate, address, and contact are required'
      });
    }

    // Build DHL API request
    const dhlRequest = {
      plannedPickupDateAndTime: body.pickupDate,
      closeTime: body.closeTime || '18:00',
      location: body.location || 'reception',
      locationType: 'business',
      accounts: [{
        typeCode: 'shipper',
        number: DHL_CONFIG.accountNumber
      }],
      specialInstructions: body.specialInstructions ? [{
        value: body.specialInstructions,
        typeCode: 'TBD'
      }] : undefined,
      customerDetails: {
        shipperDetails: {
          postalAddress: {
            postalCode: body.address.postalCode,
            cityName: body.address.cityName,
            countryCode: body.address.countryCode,
            addressLine1: body.address.addressLine1,
            addressLine2: body.address.addressLine2
          },
          contactInformation: {
            companyName: body.contact.companyName || body.contact.fullName,
            fullName: body.contact.fullName,
            phone: body.contact.phone,
            email: body.contact.email
          }
        }
      },
      shipmentDetails: [{
        productCode: 'D',
        localProductCode: 'D',
        accounts: [{
          typeCode: 'shipper',
          number: DHL_CONFIG.accountNumber
        }],
        isCustomsDeclarable: false,
        unitOfMeasurement: 'metric',
        // Always 1 Express Envelope package
        packages: [{
          weight: 0.5,
          dimensions: { length: 35, width: 27.5, height: 1 }, // DHL Express Envelope max dimensions
          customerReferences: body.orderNumber ? [{
            value: body.orderNumber,
            typeCode: 'CU'
          }] : undefined
        }]
      }]
    };

    // Call DHL API
    const dhlResponse = await fetch(`${getBaseUrl()}/pickups`, {
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
      dispatchConfirmationNumber: responseData.dispatchConfirmationNumber,
      readyByTime: responseData.readyByTime,
      nextPickupDate: responseData.nextPickupDate,
      warnings: responseData.warnings,
      environment: DHL_CONFIG.useSandbox ? 'sandbox' : 'production'
    });

  } catch (error: any) {
    console.error('DHL Pickup API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
