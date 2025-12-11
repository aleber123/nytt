/**
 * DHL Express MyDHL API Service
 * 
 * Handles pickup bookings and shipment creation via DHL Express API.
 * 
 * Sandbox URL: https://express.api.dhl.com/mydhlapi/test
 * Production URL: https://express.api.dhl.com/mydhlapi
 * 
 * Documentation: https://developer.dhl.com/api-reference/dhl-express-mydhl-api
 */

// Environment configuration
const DHL_CONFIG = {
  // Sandbox credentials - move to environment variables in production
  apiKey: process.env.NEXT_PUBLIC_DHL_API_KEY || '',
  apiSecret: process.env.DHL_API_SECRET || '',
  
  // API URLs
  sandboxUrl: 'https://express.api.dhl.com/mydhlapi/test',
  productionUrl: 'https://express.api.dhl.com/mydhlapi',
  
  // Use sandbox by default, set to false for production
  useSandbox: process.env.NODE_ENV !== 'production' || process.env.DHL_USE_SANDBOX === 'true',
  
  // Account number for billing
  accountNumber: process.env.DHL_ACCOUNT_NUMBER || '',
};

// Get the base URL based on environment
const getBaseUrl = () => DHL_CONFIG.useSandbox ? DHL_CONFIG.sandboxUrl : DHL_CONFIG.productionUrl;

// Create Basic Auth header
const getAuthHeader = () => {
  const credentials = `${DHL_CONFIG.apiKey}:${DHL_CONFIG.apiSecret}`;
  const encoded = typeof window !== 'undefined' 
    ? window.btoa(credentials)
    : Buffer.from(credentials).toString('base64');
  return `Basic ${encoded}`;
};

// Types
export interface DHLAddress {
  postalCode: string;
  cityName: string;
  countryCode: string; // ISO 2-letter code (e.g., 'SE')
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  countyName?: string;
}

export interface DHLContact {
  companyName?: string;
  fullName: string;
  phone: string;
  email?: string;
}

export interface DHLPickupRequest {
  plannedPickupDateAndTime: string; // ISO format: 2024-12-15T10:00:00
  closeTime: string; // Format: HH:MM (e.g., "18:00")
  location: string; // e.g., "reception", "back door"
  pickupLocation: {
    address: DHLAddress;
    contact: DHLContact;
  };
  specialInstructions?: string;
  // Package details
  packages: {
    weight: number; // in kg
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
  }[];
}

export interface DHLPickupResponse {
  dispatchConfirmationNumber: string;
  readyByTime: string;
  nextPickupDate?: string;
  warnings?: string[];
}

export interface DHLShipmentRequest {
  plannedShippingDateAndTime: string;
  pickup: {
    isRequested: boolean;
    closeTime?: string;
    location?: string;
  };
  productCode: string; // e.g., 'P' for Express Worldwide, 'D' for Express Domestic
  localProductCode?: string;
  accounts: {
    typeCode: 'shipper' | 'receiver' | 'thirdParty';
    number: string;
  }[];
  customerDetails: {
    shipperDetails: {
      postalAddress: DHLAddress;
      contactInformation: DHLContact;
    };
    receiverDetails: {
      postalAddress: DHLAddress;
      contactInformation: DHLContact;
    };
  };
  content: {
    packages: {
      weight: number;
      dimensions?: {
        length: number;
        width: number;
        height: number;
      };
    }[];
    isCustomsDeclarable: boolean;
    declaredValue?: number;
    declaredValueCurrency?: string;
    description: string;
    incoterm?: string;
  };
  outputImageProperties?: {
    printerDPI?: number;
    encodingFormat?: 'pdf' | 'png' | 'gif' | 'zpl' | 'epl';
    imageOptions?: {
      typeCode: 'label' | 'waybillDoc' | 'invoice' | 'receipt';
      templateName?: string;
      isRequested?: boolean;
    }[];
  };
}

export interface DHLShipmentResponse {
  shipmentTrackingNumber: string;
  trackingUrl: string;
  dispatchConfirmationNumber?: string;
  packages: {
    trackingNumber: string;
    referenceNumber?: number;
  }[];
  documents?: {
    typeCode: string;
    content: string; // Base64 encoded
    format: string;
  }[];
  warnings?: string[];
}

export interface DHLRateRequest {
  customerDetails: {
    shipperDetails: {
      postalCode: string;
      cityName: string;
      countryCode: string;
    };
    receiverDetails: {
      postalCode: string;
      cityName: string;
      countryCode: string;
    };
  };
  accounts: {
    typeCode: 'shipper';
    number: string;
  }[];
  plannedShippingDateAndTime: string;
  unitOfMeasurement: 'metric' | 'imperial';
  isCustomsDeclarable: boolean;
  packages: {
    weight: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
  }[];
}

export interface DHLRateResponse {
  products: {
    productName: string;
    productCode: string;
    localProductCode?: string;
    networkTypeCode?: string;
    totalPrice: {
      price: number;
      currencyCode: string;
    }[];
    deliveryCapabilities?: {
      deliveryTypeCode: string;
      estimatedDeliveryDateAndTime?: string;
    };
  }[];
}

// API Error type
export interface DHLApiError {
  status: number;
  title: string;
  detail?: string;
  instance?: string;
}

/**
 * Book a pickup with DHL Express
 */
export async function bookPickup(request: DHLPickupRequest): Promise<DHLPickupResponse> {
  const url = `${getBaseUrl()}/pickups`;
  
  const body = {
    plannedPickupDateAndTime: request.plannedPickupDateAndTime,
    closeTime: request.closeTime,
    location: request.location,
    locationType: 'business',
    accounts: [{
      typeCode: 'shipper',
      number: DHL_CONFIG.accountNumber
    }],
    specialInstructions: [
      {
        value: request.specialInstructions || 'Documents for legalization service',
        typeCode: 'TBD'
      }
    ],
    customerDetails: {
      shipperDetails: {
        postalAddress: request.pickupLocation.address,
        contactInformation: {
          companyName: request.pickupLocation.contact.companyName || request.pickupLocation.contact.fullName,
          fullName: request.pickupLocation.contact.fullName,
          phone: request.pickupLocation.contact.phone,
          email: request.pickupLocation.contact.email
        }
      }
    },
    shipmentDetails: [{
      productCode: 'D', // Domestic Express
      localProductCode: 'D',
      accounts: [{
        typeCode: 'shipper',
        number: DHL_CONFIG.accountNumber
      }],
      isCustomsDeclarable: false,
      unitOfMeasurement: 'metric',
      packages: request.packages.map((pkg, index) => ({
        weight: pkg.weight,
        dimensions: pkg.dimensions || { length: 30, width: 21, height: 1 }, // A4 envelope default
        customerReferences: [{
          value: `PKG-${index + 1}`,
          typeCode: 'CU'
        }]
      }))
    }]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`DHL API Error: ${response.status} - ${errorData.detail || errorData.title || response.statusText}`);
    }

    const data = await response.json();
    return {
      dispatchConfirmationNumber: data.dispatchConfirmationNumber,
      readyByTime: data.readyByTime,
      nextPickupDate: data.nextPickupDate,
      warnings: data.warnings
    };
  } catch (error) {
    console.error('DHL Pickup booking failed:', error);
    throw error;
  }
}

/**
 * Create a shipment with DHL Express
 */
export async function createShipment(request: DHLShipmentRequest): Promise<DHLShipmentResponse> {
  const url = `${getBaseUrl()}/shipments`;

  const body = {
    plannedShippingDateAndTime: request.plannedShippingDateAndTime,
    pickup: request.pickup,
    productCode: request.productCode,
    localProductCode: request.localProductCode,
    accounts: request.accounts.length > 0 ? request.accounts : [{
      typeCode: 'shipper',
      number: DHL_CONFIG.accountNumber
    }],
    customerDetails: request.customerDetails,
    content: {
      ...request.content,
      unitOfMeasurement: 'metric'
    },
    outputImageProperties: request.outputImageProperties || {
      printerDPI: 300,
      encodingFormat: 'pdf',
      imageOptions: [
        { typeCode: 'label', isRequested: true },
        { typeCode: 'waybillDoc', isRequested: true }
      ]
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`DHL API Error: ${response.status} - ${errorData.detail || errorData.title || response.statusText}`);
    }

    const data = await response.json();
    return {
      shipmentTrackingNumber: data.shipmentTrackingNumber,
      trackingUrl: data.trackingUrl,
      dispatchConfirmationNumber: data.dispatchConfirmationNumber,
      packages: data.packages || [],
      documents: data.documents,
      warnings: data.warnings
    };
  } catch (error) {
    console.error('DHL Shipment creation failed:', error);
    throw error;
  }
}

/**
 * Get shipping rates from DHL Express
 */
export async function getRates(request: DHLRateRequest): Promise<DHLRateResponse> {
  const url = `${getBaseUrl()}/rates`;

  const body = {
    ...request,
    accounts: request.accounts.length > 0 ? request.accounts : [{
      typeCode: 'shipper',
      number: DHL_CONFIG.accountNumber
    }]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`DHL API Error: ${response.status} - ${errorData.detail || errorData.title || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('DHL Rate request failed:', error);
    throw error;
  }
}

/**
 * Cancel a pickup
 */
export async function cancelPickup(dispatchConfirmationNumber: string, reason: string = 'Cancelled by customer'): Promise<boolean> {
  const url = `${getBaseUrl()}/pickups/${dispatchConfirmationNumber}`;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ reason })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`DHL API Error: ${response.status} - ${errorData.detail || errorData.title || response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('DHL Pickup cancellation failed:', error);
    throw error;
  }
}

/**
 * Track a shipment
 */
export async function trackShipment(trackingNumber: string): Promise<any> {
  const url = `${getBaseUrl()}/tracking?shipmentTrackingNumber=${trackingNumber}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader(),
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`DHL API Error: ${response.status} - ${errorData.detail || errorData.title || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('DHL Tracking request failed:', error);
    throw error;
  }
}

/**
 * Test API connection
 */
export async function testConnection(): Promise<{ success: boolean; message: string; environment: string }> {
  const url = `${getBaseUrl()}/address-validate?type=pickup&countryCode=SE&postalCode=12162&cityName=Johanneshov`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader(),
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      return {
        success: true,
        message: 'DHL API connection successful',
        environment: DHL_CONFIG.useSandbox ? 'sandbox' : 'production'
      };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: `DHL API Error: ${response.status} - ${errorData.detail || errorData.title || response.statusText}`,
        environment: DHL_CONFIG.useSandbox ? 'sandbox' : 'production'
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Connection failed: ${error.message}`,
      environment: DHL_CONFIG.useSandbox ? 'sandbox' : 'production'
    };
  }
}

// ============================================
// Helper functions for common use cases
// ============================================

/**
 * DOX Visumpartner company details (shipper)
 */
export const DOX_COMPANY_DETAILS = {
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

/**
 * Create a pickup request for customer documents
 */
export function createCustomerPickupRequest(
  customerAddress: DHLAddress,
  customerContact: DHLContact,
  pickupDateTime: Date,
  closeTime: string = '18:00',
  specialInstructions?: string
): DHLPickupRequest {
  return {
    plannedPickupDateAndTime: pickupDateTime.toISOString().slice(0, 19),
    closeTime,
    location: 'reception',
    pickupLocation: {
      address: customerAddress,
      contact: customerContact
    },
    specialInstructions: specialInstructions || 'Documents for legalization - handle with care',
    packages: [{
      weight: 0.5, // Default weight for documents
      dimensions: {
        length: 30,
        width: 21,
        height: 1
      }
    }]
  };
}

/**
 * Create a return shipment to customer
 */
export function createReturnShipmentRequest(
  customerAddress: DHLAddress,
  customerContact: DHLContact,
  shippingDate: Date,
  orderNumber: string,
  includePickup: boolean = false
): DHLShipmentRequest {
  return {
    plannedShippingDateAndTime: shippingDate.toISOString().slice(0, 19) + ' GMT+01:00',
    pickup: {
      isRequested: includePickup,
      closeTime: includePickup ? '18:00' : undefined,
      location: includePickup ? 'office' : undefined
    },
    productCode: 'D', // Domestic Express
    localProductCode: 'D',
    accounts: [{
      typeCode: 'shipper',
      number: DHL_CONFIG.accountNumber
    }],
    customerDetails: {
      shipperDetails: DOX_COMPANY_DETAILS,
      receiverDetails: {
        postalAddress: customerAddress,
        contactInformation: customerContact
      }
    },
    content: {
      packages: [{
        weight: 0.5,
        dimensions: {
          length: 30,
          width: 21,
          height: 1
        }
      }],
      isCustomsDeclarable: false,
      description: `Legalized documents - Order ${orderNumber}`,
      incoterm: 'DAP'
    },
    outputImageProperties: {
      printerDPI: 300,
      encodingFormat: 'pdf',
      imageOptions: [
        { typeCode: 'label', isRequested: true },
        { typeCode: 'waybillDoc', isRequested: true }
      ]
    }
  };
}

// Export config for debugging
export const getDHLConfig = () => ({
  useSandbox: DHL_CONFIG.useSandbox,
  hasApiKey: !!DHL_CONFIG.apiKey,
  hasApiSecret: !!DHL_CONFIG.apiSecret,
  hasAccountNumber: !!DHL_CONFIG.accountNumber,
  baseUrl: getBaseUrl()
});
