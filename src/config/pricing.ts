/**
 * Centralized Pricing Configuration
 * 
 * All prices are in SEK (Swedish Kronor).
 * This file serves as the single source of truth for fallback prices
 * when Firebase pricing rules are not available.
 * 
 * Firebase prices take precedence over these defaults.
 */

// Express handling fee (per order)
export const EXPRESS_FEE = 500;

// Scanned copies fee (per document)
export const SCANNED_COPIES_FEE = 200;

// Default pickup service price (fallback)
export const DEFAULT_PICKUP_FEE = 450;

// Service fallback prices (used when Firebase rules are not available)
export const SERVICE_FALLBACK_PRICES: Record<string, { officialFee: number; serviceFee: number }> = {
  apostille: { officialFee: 440, serviceFee: 999 },
  notarization: { officialFee: 320, serviceFee: 999 },
  chamber: { officialFee: 799, serviceFee: 1199 },
  embassy: { officialFee: 1500, serviceFee: 1199 },
  ud: { officialFee: 750, serviceFee: 999 },
  translation: { officialFee: 0, serviceFee: 999 }
};

// Return/delivery service prices
export const RETURN_SERVICE_PRICES: Record<string, { price: number; displayPrice: string }> = {
  'postnord-rek': { price: 85, displayPrice: 'Från 85 kr' },
  'dhl-sweden': { price: 180, displayPrice: 'Från 180 kr' },
  'dhl-europe': { price: 250, displayPrice: 'Från 250 kr' },
  'dhl-worldwide': { price: 450, displayPrice: 'Från 450 kr' },
  'dhl-pre-12': { price: 350, displayPrice: 'Från 350 kr' },
  'dhl-pre-9': { price: 450, displayPrice: 'Från 450 kr' },
  'stockholm-city': { price: 120, displayPrice: 'Från 120 kr' },
  'stockholm-express': { price: 180, displayPrice: 'Från 180 kr' },
  'stockholm-sameday': { price: 250, displayPrice: 'Från 250 kr' },
  'own-delivery': { price: 0, displayPrice: '0 kr' },
  'office-pickup': { price: 0, displayPrice: '0 kr' }
};

// Pickup service prices
export const PICKUP_SERVICE_PRICES: Record<string, { price: number; displayPrice: string }> = {
  'dhl': { price: 450, displayPrice: 'Från 450 kr' },
  'stockholm_courier': { price: 350, displayPrice: 'Från 350 kr' },
  'dhl_express': { price: 650, displayPrice: 'Från 650 kr' },
  'stockholm_sameday': { price: 450, displayPrice: 'Från 450 kr' }
};

// Helper function to get service fallback price
export const getServiceFallbackPrice = (serviceType: string): { officialFee: number; serviceFee: number; basePrice: number } | null => {
  const fallback = SERVICE_FALLBACK_PRICES[serviceType];
  if (fallback) {
    return {
      ...fallback,
      basePrice: fallback.officialFee + fallback.serviceFee
    };
  }
  return null;
};

// Helper function to get return service price
export const getReturnServicePrice = (serviceId: string): number => {
  return RETURN_SERVICE_PRICES[serviceId]?.price ?? 0;
};

// Helper function to get pickup service price
export const getPickupServicePrice = (method: string): number => {
  return PICKUP_SERVICE_PRICES[method]?.price ?? DEFAULT_PICKUP_FEE;
};

// VAT rates
export const VAT_RATES = {
  STANDARD: 25,      // Standard Swedish VAT
  EXEMPT: 0          // VAT exempt (official fees)
};

// Service names (Swedish)
export const SERVICE_NAMES_SV: Record<string, string> = {
  apostille: 'Apostille',
  notarization: 'Notarisering',
  embassy: 'Ambassadlegalisering',
  ud: 'Utrikesdepartementets legalisering',
  translation: 'Auktoriserad översättning',
  chamber: 'Handelskammarens legalisering'
};

// Service names (English)
export const SERVICE_NAMES_EN: Record<string, string> = {
  apostille: 'Apostille',
  notarization: 'Notarization',
  embassy: 'Embassy legalization',
  ud: 'Ministry of Foreign Affairs legalization',
  translation: 'Certified translation',
  chamber: 'Chamber of Commerce legalization'
};

// Get service name by locale
export const getServiceName = (serviceType: string, locale: string = 'sv'): string => {
  const names = locale === 'en' ? SERVICE_NAMES_EN : SERVICE_NAMES_SV;
  return names[serviceType] || serviceType;
};
