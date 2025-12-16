/**
 * DHL Rates API Route
 * 
 * Gets shipping rates/quotes from DHL Express API before booking.
 * Used to check price and enforce max price limits.
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

// DOX Visumpartner company details (shipper for return shipments)
const DOX_COMPANY = {
  postalCode: '12162',
  cityName: 'Johanneshov',
  countryCode: 'SE',
};

interface RatesRequestBody {
  // Destination address
  receiver: {
    postalCode: string;
    cityName: string;
    countryCode: string;
  };
  // Optional: for pickup shipments (customer -> DOX)
  isPickup?: boolean;
  // Shipper address (only needed for pickup)
  shipper?: {
    postalCode: string;
    cityName: string;
    countryCode: string;
  };
  // Package details
  weight?: number; // kg, default 0.5
  productCode?: string; // 'N' for domestic, 'P' for international
  // Address type: 'business' or 'residential' (affects pricing)
  deliveryAddressType?: 'business' | 'residential';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
      error: 'DHL API credentials not configured'
    });
  }

  if (!DHL_CONFIG.accountNumber) {
    return res.status(500).json({ 
      error: 'DHL Account Number not configured'
    });
  }

  const { receiver, isPickup, shipper, weight, productCode, deliveryAddressType } = req.body as RatesRequestBody;

  if (!receiver?.postalCode || !receiver?.cityName || !receiver?.countryCode) {
    return res.status(400).json({ error: 'Receiver address required (postalCode, cityName, countryCode)' });
  }

  // Helper to format postal code for DHL (Swedish format: "123 45")
  const formatPostalCode = (postalCode: string, countryCode: string): string => {
    const cleaned = postalCode.replace(/\s/g, '');
    if (countryCode === 'SE' && cleaned.length === 5) {
      return cleaned.slice(0, 3) + ' ' + cleaned.slice(3);
    }
    return postalCode;
  };

  try {
    // Determine shipper and receiver based on shipment type
    let originAddress, destinationAddress;
    
    if (isPickup) {
      // Pickup: Customer -> DOX
      const formattedShipper = shipper || receiver;
      originAddress = {
        ...formattedShipper,
        postalCode: formatPostalCode(formattedShipper.postalCode, formattedShipper.countryCode)
      };
      destinationAddress = DOX_COMPANY;
    } else {
      // Return: DOX -> Customer
      originAddress = DOX_COMPANY;
      destinationAddress = {
        ...receiver,
        postalCode: formatPostalCode(receiver.postalCode, receiver.countryCode)
      };
    }

    // Calculate shipping date (next business day)
    const shippingDate = new Date();
    if (shippingDate.getHours() >= 14) {
      shippingDate.setDate(shippingDate.getDate() + 1);
    }
    if (shippingDate.getDay() === 0) shippingDate.setDate(shippingDate.getDate() + 1);
    if (shippingDate.getDay() === 6) shippingDate.setDate(shippingDate.getDate() + 2);

    // Determine product code based on destination
    const isDomestic = originAddress.countryCode === 'SE' && destinationAddress.countryCode === 'SE';
    
    // EU country codes
    const euCountries = [
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES'
    ];
    const isEU = euCountries.includes(destinationAddress.countryCode);
    
    // DHL Service codes for DOCUMENTS (from DHL support):
    // Express inrikes (Domestic):
    //   X = EXPRESS ENVELOPE (billigare för dokument)
    //   N = DOMESTIC EXPRESS (DOM)
    //   1 = DOMESTIC EXPRESS 12:00 (DOT)
    //   I = DOMESTIC EXPRESS 9:00 (DOK)
    // EU:
    //   U = EXPRESS WORLDWIDE (ECX)
    //   T = EXPRESS 12:00 (TDT)
    //   K = EXPRESS 9:00 (TDK)
    // Dokument utanför EU:
    //   D = EXPRESS WORLDWIDE (DOX)
    //   T = EXPRESS 12:00 (TDT)
    //   K = EXPRESS 9:00 (TDK)
    let effectiveProductCode: string;
    if (productCode) {
      effectiveProductCode = productCode;
    } else if (isDomestic || isEU) {
      effectiveProductCode = 'X'; // EXPRESS ENVELOPE (cheaper for documents - domestic & EU)
    } else {
      effectiveProductCode = 'D'; // EXPRESS WORLDWIDE DOX (outside EU)
    }

    // Build DHL Rates request
    // Note: typeCode is NOT supported in Rates API, only in Shipment API
    // The residential surcharge will be applied at shipment time if applicable
    
    const ratesRequest = {
      customerDetails: {
        shipperDetails: {
          postalCode: originAddress.postalCode,
          cityName: originAddress.cityName,
          countryCode: originAddress.countryCode,
        },
        receiverDetails: {
          postalCode: destinationAddress.postalCode,
          cityName: destinationAddress.cityName,
          countryCode: destinationAddress.countryCode,
        }
      },
      accounts: [{
        typeCode: 'shipper',
        number: DHL_CONFIG.accountNumber
      }],
      plannedShippingDateAndTime: shippingDate.toISOString().slice(0, 10) + 'T10:00:00 GMT+01:00',
      unitOfMeasurement: 'metric',
      isCustomsDeclarable: false, // Documents are not customs declarable
      productCode: effectiveProductCode,
      packages: [{
        weight: weight || 0.3,
        dimensions: {
          length: 25,
          width: 20,
          height: 1
        } // Envelope size for EXPRESS ENVELOPE (X)
      }]
    };

    // Call DHL Rates API
    const response = await fetch(`${getBaseUrl()}/rates`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(ratesRequest)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('DHL Rates API Error:', JSON.stringify(data, null, 2));
      console.error('DHL Rates Request was:', JSON.stringify(ratesRequest, null, 2));
      return res.status(response.status).json({
        error: 'DHL API Error',
        details: data.detail || data.title || data.message || data.additionalDetails?.join(', ') || 'Unknown error',
        fullResponse: data
      });
    }

    // Extract pricing from response
    const products = data.products || [];
    
    // Find the requested product or first available
    const product = products.find((p: any) => p.productCode === effectiveProductCode) || products[0];
    
    if (!product) {
      return res.status(404).json({
        error: 'No rates available',
        details: 'DHL did not return any rates for this shipment'
      });
    }

    // Get total price
    const totalPrice = product.totalPrice || [];
    const priceSEK = totalPrice.find((p: any) => p.currencyType === 'BILLC' || p.currencyType === 'BASEC');
    
    const priceAmount = priceSEK?.price || product.totalPrice?.[0]?.price || 0;
    const currency = priceSEK?.priceCurrency || product.totalPrice?.[0]?.priceCurrency || 'SEK';

    // Return rate information
    return res.status(200).json({
      success: true,
      rate: {
        price: priceAmount,
        currency: currency,
        productCode: product.productCode,
        productName: product.productName || product.localProductName || 'DHL Express',
        deliveryTime: product.deliveryCapabilities?.estimatedDeliveryDateAndTime || null,
      },
      environment: DHL_CONFIG.useSandbox ? 'sandbox' : 'production',
      debug: DHL_CONFIG.useSandbox ? { request: ratesRequest, response: data } : undefined
    });

  } catch (error: any) {
    console.error('DHL Rates error:', error);
    return res.status(500).json({ 
      error: 'Failed to get DHL rates',
      details: error.message 
    });
  }
}
