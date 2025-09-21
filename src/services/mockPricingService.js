// Mock pricing service for immediate testing without Firebase setup
const mockPricingData = {
  'GLOBAL_apostille': {
    id: 'GLOBAL_apostille',
    countryCode: 'GLOBAL',
    countryName: 'Global Standard',
    serviceType: 'apostille',
    officialFee: 545,
    serviceFee: 100,
    basePrice: 645,
    processingTime: { standard: 5 },
    currency: 'SEK',
    lastUpdated: { seconds: Date.now() / 1000 },
    updatedBy: 'system',
    isActive: true
  },
  'GLOBAL_notarization': {
    id: 'GLOBAL_notarization',
    countryCode: 'GLOBAL',
    countryName: 'Global Standard',
    serviceType: 'notarization',
    officialFee: 595,
    serviceFee: 100,
    basePrice: 695,
    processingTime: { standard: 3 },
    currency: 'SEK',
    lastUpdated: { seconds: Date.now() / 1000 },
    updatedBy: 'system',
    isActive: true
  },
  'GLOBAL_translation': {
    id: 'GLOBAL_translation',
    countryCode: 'GLOBAL',
    countryName: 'Global Standard',
    serviceType: 'translation',
    officialFee: 895,
    serviceFee: 100,
    basePrice: 995,
    processingTime: { standard: 5 },
    currency: 'SEK',
    lastUpdated: { seconds: Date.now() / 1000 },
    updatedBy: 'system',
    isActive: true
  },
  'GLOBAL_ud': {
    id: 'GLOBAL_ud',
    countryCode: 'GLOBAL',
    countryName: 'Global Standard',
    serviceType: 'ud',
    officialFee: 695,
    serviceFee: 100,
    basePrice: 795,
    processingTime: { standard: 5 },
    currency: 'SEK',
    lastUpdated: { seconds: Date.now() / 1000 },
    updatedBy: 'system',
    isActive: true
  },
  'GLOBAL_embassy': {
    id: 'GLOBAL_embassy',
    countryCode: 'GLOBAL',
    countryName: 'Global Standard',
    serviceType: 'embassy',
    officialFee: 1195,
    serviceFee: 100,
    basePrice: 1295,
    processingTime: { standard: 7 },
    currency: 'SEK',
    lastUpdated: { seconds: Date.now() / 1000 },
    updatedBy: 'system',
    isActive: true
  },
  'GLOBAL_chamber': {
    id: 'GLOBAL_chamber',
    countryCode: 'GLOBAL',
    countryName: 'Global Standard',
    serviceType: 'chamber',
    officialFee: 2200,
    serviceFee: 200,
    basePrice: 2400,
    processingTime: { standard: 5 },
    currency: 'SEK',
    lastUpdated: { seconds: Date.now() / 1000 },
    updatedBy: 'system',
    isActive: true
  }
};

const getPricingRule = async (countryCode, serviceType) => {
  const key = `${countryCode}_${serviceType}`;
  const pricingRule = mockPricingData[key];

  if (pricingRule) {
    console.log(`📊 Mock pricing: Found ${serviceType} for ${countryCode} - ${pricingRule.basePrice} kr`);
    return pricingRule;
  }

  console.log(`❌ Mock pricing: No pricing found for ${countryCode}_${serviceType}`);
  return null;
};

module.exports = {
  getPricingRule
};