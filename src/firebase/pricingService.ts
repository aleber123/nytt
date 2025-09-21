import { db } from './config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';

export interface PricingRule {
  id: string;
  countryCode: string;
  countryName: string;
  serviceType: 'apostille' | 'notarization' | 'embassy' | 'ud' | 'translation' | 'chamber';
  officialFee: number; // Official fee charged by the service provider in SEK
  serviceFee: number; // Service fee for handling the order in SEK
  basePrice: number; // Total price (officialFee + serviceFee) - kept for backward compatibility
  additionalFees?: {
    express?: number;
    rush?: number;
    weekend?: number;
    complex?: number;
  };
  processingTime: {
    standard: number; // days
    express?: number; // days
    rush?: number; // days
  };
  currency: 'SEK';
  lastUpdated: Timestamp;
  updatedBy: string;
  isActive: boolean;
  notes?: string;
}

export interface BulkPricingUpdate {
  countryCodes: string[];
  serviceTypes: string[];
  priceAdjustment: number; // percentage or fixed amount
  adjustmentType: 'percentage' | 'fixed';
  reason: string;
  updatedBy: string;
}

export interface PricingStats {
  totalRules: number;
  activeRules: number;
  countriesCovered: number;
  lastUpdated: Timestamp;
  averagePrice: number;
}

// Create or update a pricing rule
export const setPricingRule = async (rule: Omit<PricingRule, 'id' | 'lastUpdated'>): Promise<string> => {
  try {
    const ruleId = `${rule.countryCode}_${rule.serviceType}`;
    const ruleRef = doc(db, 'pricing', ruleId);

    const ruleData: PricingRule = {
      ...rule,
      id: ruleId,
      lastUpdated: Timestamp.now()
    };

    await setDoc(ruleRef, ruleData);
    return ruleId;
  } catch (error) {
    console.error('Error setting pricing rule:', error);
    throw error;
  }
};

// Get pricing rule for specific country and service
export const getPricingRule = async (countryCode: string, serviceType: string): Promise<PricingRule | null> => {
  try {
    const ruleId = `${countryCode}_${serviceType}`;
    const ruleRef = doc(db, 'pricing', ruleId);
    const ruleSnap = await getDoc(ruleRef);

    if (ruleSnap.exists()) {
      return ruleSnap.data() as PricingRule;
    }
    return null;
  } catch (error) {
    console.error('Error getting pricing rule:', error);
    throw error;
  }
};

// Get all pricing rules for a country
export const getCountryPricingRules = async (countryCode: string): Promise<PricingRule[]> => {
  try {
    const q = query(
      collection(db, 'pricing'),
      where('countryCode', '==', countryCode),
      where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const rules = querySnapshot.docs.map(doc => doc.data() as PricingRule);

    // Sort client-side to avoid composite index requirement
    return rules.sort((a, b) => b.lastUpdated.toMillis() - a.lastUpdated.toMillis());
  } catch (error) {
    console.error('Error getting country pricing rules:', error);
    // Return mock data filtered by country if Firebase fails
    console.log('🔄 Using mock pricing data for country:', countryCode);
    const mockRules = getMockPricingRules();
    return mockRules.filter(rule => rule.countryCode === countryCode);
  }
};

// Get all active pricing rules
export const getAllActivePricingRules = async (): Promise<PricingRule[]> => {
  try {
    const q = query(
      collection(db, 'pricing'),
      where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const rules = querySnapshot.docs.map(doc => doc.data() as PricingRule);

    // Sort client-side to avoid composite index requirement
    return rules.sort((a, b) => {
      const countryCompare = a.countryName.localeCompare(b.countryName);
      if (countryCompare !== 0) return countryCompare;
      return a.serviceType.localeCompare(b.serviceType);
    });
  } catch (error) {
    console.error('Error getting all active pricing rules:', error);
    // Return mock data if Firebase fails
    console.log('🔄 Using mock pricing data due to Firebase connection issues');
    return getMockPricingRules();
  }
};

// Update pricing rule
export const updatePricingRule = async (
  ruleId: string,
  updates: Partial<Omit<PricingRule, 'id' | 'lastUpdated'>>
): Promise<void> => {
  try {
    const ruleRef = doc(db, 'pricing', ruleId);

    // Check if document exists first
    const docSnap = await getDoc(ruleRef);

    if (docSnap.exists()) {
      // Document exists, update it
      await updateDoc(ruleRef, {
        ...updates,
        lastUpdated: Timestamp.now()
      });
    } else {
      // Document doesn't exist, we need more information to create it
      // This should be handled by the calling function
      throw new Error(`Document ${ruleId} does not exist. Cannot update.`);
    }
  } catch (error) {
    console.error('Error updating pricing rule:', error);
    throw error;
  }
};

// Update or create pricing rule (handles both cases)
export const updateOrCreatePricingRule = async (
  ruleId: string,
  updates: Partial<Omit<PricingRule, 'id' | 'lastUpdated'>>,
  createData?: Omit<PricingRule, 'id' | 'lastUpdated'>
): Promise<void> => {
  try {
    const ruleRef = doc(db, 'pricing', ruleId);

    // Check if document exists first
    const docSnap = await getDoc(ruleRef);

    if (docSnap.exists()) {
      // Document exists, update it
      await updateDoc(ruleRef, {
        ...updates,
        lastUpdated: Timestamp.now()
      });
    } else if (createData) {
      // Document doesn't exist, create it
      const ruleData: PricingRule = {
        ...createData,
        ...updates,
        id: ruleId,
        lastUpdated: Timestamp.now()
      };
      await setDoc(ruleRef, ruleData);
    } else {
      throw new Error(`Document ${ruleId} does not exist and no createData provided.`);
    }
  } catch (error) {
    console.error('Error updating or creating pricing rule:', error);
    throw error;
  }
};

// Bulk update pricing rules
export const bulkUpdatePricing = async (update: BulkPricingUpdate): Promise<void> => {
  try {
    const rulesToUpdate: PricingRule[] = [];

    // Get all rules that match the criteria
    for (const countryCode of update.countryCodes) {
      for (const serviceType of update.serviceTypes) {
        const rule = await getPricingRule(countryCode, serviceType);
        if (rule) {
          rulesToUpdate.push(rule);
        }
      }
    }

    // Update each rule
    for (const rule of rulesToUpdate) {
      let updates: Partial<PricingRule> = {
        updatedBy: update.updatedBy,
        notes: update.reason
      };

      if (update.adjustmentType === 'percentage') {
        // Apply percentage adjustment to serviceFee only (keep officialFee unchanged)
        const newServiceFee = rule.serviceFee * (1 + update.priceAdjustment / 100);
        updates.serviceFee = Math.round(newServiceFee);
        updates.basePrice = rule.officialFee + Math.round(newServiceFee);
      } else {
        // Apply fixed adjustment to serviceFee only (keep officialFee unchanged)
        const newServiceFee = rule.serviceFee + update.priceAdjustment;
        updates.serviceFee = Math.max(0, Math.round(newServiceFee)); // Ensure not negative
        updates.basePrice = rule.officialFee + updates.serviceFee;
      }

      await updatePricingRule(rule.id, updates);
    }
  } catch (error) {
    console.error('Error bulk updating pricing:', error);
    throw error;
  }
};

// Calculate price for an order
export const calculateOrderPrice = async (orderData: {
  country: string;
  services: string[];
  quantity: number;
  expedited?: boolean;
  deliveryMethod?: string;
  returnService?: string;
  returnServices?: any[];
  scannedCopies?: boolean;
  pickupService?: boolean;
}): Promise<{
  basePrice: number;
  additionalFees: number;
  totalPrice: number;
  breakdown: any[];
}> => {
  try {
    let totalBasePrice = 0;
    let totalAdditionalFees = 0;
    const breakdown: any[] = [];

    for (const serviceType of orderData.services) {
      const rule = await getPricingRule(orderData.country, serviceType);

      if (rule) {
        const serviceBasePrice = rule.basePrice * orderData.quantity;
        totalBasePrice += serviceBasePrice;

        breakdown.push({
          service: serviceType,
          basePrice: serviceBasePrice,
          quantity: orderData.quantity,
          unitPrice: rule.basePrice,
          officialFee: rule.officialFee * orderData.quantity,
          serviceFee: rule.serviceFee * orderData.quantity
        });

        // Add express fee if applicable
        if (orderData.expedited && rule.additionalFees?.express) {
          totalAdditionalFees += rule.additionalFees.express;
          breakdown.push({
            service: `${serviceType}_express`,
            fee: rule.additionalFees.express,
            description: 'Express service'
          });
        }
      }
    }

    // Add return service cost
    if (orderData.returnService && orderData.returnServices) {
      const returnService = orderData.returnServices.find(s => s.id === orderData.returnService);
      if (returnService && returnService.price) {
        const priceMatch = returnService.price.match(/(\d+)/);
        if (priceMatch) {
          const returnCost = parseInt(priceMatch[1]);
          totalAdditionalFees += returnCost;
          breakdown.push({
            service: 'return_service',
            fee: returnCost,
            description: returnService.name
          });
        }
      }
    }

    // Add scanned copies cost (200 kr per document)
    if (orderData.scannedCopies) {
      totalAdditionalFees += 200 * orderData.quantity;
      breakdown.push({
        service: 'scanned_copies',
        fee: 200 * orderData.quantity,
        description: 'Scanned copies'
      });
    }

    // Add pickup service cost (450 kr)
    if (orderData.pickupService) {
      totalAdditionalFees += 450;
      breakdown.push({
        service: 'pickup_service',
        fee: 450,
        description: 'Document pickup service'
      });
    }

    return {
      basePrice: totalBasePrice,
      additionalFees: totalAdditionalFees,
      totalPrice: totalBasePrice + totalAdditionalFees,
      breakdown
    };
  } catch (error) {
    console.error('Error calculating order price:', error);
    throw error;
  }
};

// Get pricing statistics
export const getPricingStats = async (): Promise<PricingStats> => {
  try {
    const allRules = await getAllActivePricingRules();

    const countriesCovered = new Set(allRules.map(rule => rule.countryCode)).size;
    const averagePrice = allRules.length > 0
      ? allRules.reduce((sum, rule) => sum + rule.basePrice, 0) / allRules.length
      : 0;

    const lastUpdated = allRules.length > 0
      ? allRules.reduce((latest, rule) =>
          rule.lastUpdated > latest ? rule.lastUpdated : latest,
          allRules[0].lastUpdated
        )
      : Timestamp.now();

    return {
      totalRules: allRules.length,
      activeRules: allRules.filter(rule => rule.isActive).length,
      countriesCovered,
      lastUpdated,
      averagePrice: Math.round(averagePrice)
    };
  } catch (error) {
    console.error('Error getting pricing stats:', error);
    // Return mock stats if Firebase fails
    console.log('🔄 Using mock pricing stats due to Firebase connection issues');
    const mockRules = getMockPricingRules();
    return {
      totalRules: mockRules.length,
      activeRules: mockRules.length,
      countriesCovered: new Set(mockRules.map(rule => rule.countryCode)).size,
      lastUpdated: Timestamp.now(),
      averagePrice: Math.round(mockRules.reduce((sum, rule) => sum + rule.basePrice, 0) / mockRules.length)
    };
  }
};

// Initialize default pricing rules
export const initializeDefaultPricing = async (): Promise<void> => {
  try {
    const defaultRules: Omit<PricingRule, 'id' | 'lastUpdated'>[] = [
      // Sweden (Hague Convention)
      {
        countryCode: 'SE',
        countryName: 'Sverige',
        serviceType: 'apostille',
        officialFee: 795, // Official apostille fee
        serviceFee: 100,  // Service fee for handling
        basePrice: 895,   // Total price (officialFee + serviceFee)
        processingTime: { standard: 5 },
        currency: 'SEK',
        updatedBy: 'system',
        isActive: true
      },
      // USA (Hague Convention)
      {
        countryCode: 'US',
        countryName: 'USA',
        serviceType: 'apostille',
        officialFee: 895, // Official apostille fee
        serviceFee: 100,  // Service fee for handling
        basePrice: 995,   // Total price (officialFee + serviceFee)
        processingTime: { standard: 7 },
        currency: 'SEK',
        updatedBy: 'system',
        isActive: true
      },
      // Thailand (Non-Hague)
      {
        countryCode: 'TH',
        countryName: 'Thailand',
        serviceType: 'embassy',
        officialFee: 1395, // Official embassy fee
        serviceFee: 100,   // Service fee for handling
        basePrice: 1495,   // Total price (officialFee + serviceFee)
        processingTime: { standard: 14 },
        currency: 'SEK',
        updatedBy: 'system',
        isActive: true
      },
      // Iran (Non-Hague)
      {
        countryCode: 'IR',
        countryName: 'Iran',
        serviceType: 'embassy',
        officialFee: 1795, // Official embassy fee
        serviceFee: 100,   // Service fee for handling
        basePrice: 1895,   // Total price (officialFee + serviceFee)
        processingTime: { standard: 21 },
        currency: 'SEK',
        updatedBy: 'system',
        isActive: true
      }
    ];

    for (const rule of defaultRules) {
      await setPricingRule(rule);
    }

    console.log('Default pricing rules initialized');
  } catch (error) {
    console.error('Error initializing default pricing:', error);
    throw error;
  }
};

// Mock pricing rules for fallback when Firebase fails
const getMockPricingRules = (): PricingRule[] => {
  const now = Timestamp.now();
  return [
    // Swedish standard services (matching Firebase initialization)
    {
      id: 'SE_apostille',
      countryCode: 'SE',
      countryName: 'Sverige',
      serviceType: 'apostille',
      officialFee: 795,
      serviceFee: 100,
      basePrice: 895,
      processingTime: { standard: 5 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'SE_notarization',
      countryCode: 'SE',
      countryName: 'Sverige',
      serviceType: 'notarization',
      officialFee: 1200,
      serviceFee: 100,
      basePrice: 1300,
      processingTime: { standard: 8 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'SE_translation',
      countryCode: 'SE',
      countryName: 'Sverige',
      serviceType: 'translation',
      officialFee: 1350,
      serviceFee: 100,
      basePrice: 1450,
      processingTime: { standard: 10 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'SE_chamber',
      countryCode: 'SE',
      countryName: 'Sverige',
      serviceType: 'chamber',
      officialFee: 2300,
      serviceFee: 100,
      basePrice: 2400,
      processingTime: { standard: 12 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'SE_ud',
      countryCode: 'SE',
      countryName: 'Sverige',
      serviceType: 'ud',
      officialFee: 1650,
      serviceFee: 100,
      basePrice: 1750,
      processingTime: { standard: 10 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    // Egypt - standard services (matching admin defaults)
    {
      id: 'EG_chamber',
      countryCode: 'EG',
      countryName: 'Egypten',
      serviceType: 'chamber',
      officialFee: 2300,
      serviceFee: 100,
      basePrice: 2400,
      processingTime: { standard: 12 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'EG_notarization',
      countryCode: 'EG',
      countryName: 'Egypten',
      serviceType: 'notarization',
      officialFee: 1200,
      serviceFee: 100,
      basePrice: 1300,
      processingTime: { standard: 8 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'EG_translation',
      countryCode: 'EG',
      countryName: 'Egypten',
      serviceType: 'translation',
      officialFee: 1350,
      serviceFee: 100,
      basePrice: 1450,
      processingTime: { standard: 10 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'EG_ud',
      countryCode: 'EG',
      countryName: 'Egypten',
      serviceType: 'ud',
      officialFee: 1650,
      serviceFee: 100,
      basePrice: 1750,
      processingTime: { standard: 10 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    // Egypt - embassy service (matching admin defaults)
    {
      id: 'EG_embassy',
      countryCode: 'EG',
      countryName: 'Egypten',
      serviceType: 'embassy',
      officialFee: 850,
      serviceFee: 150,
      basePrice: 1000,
      processingTime: { standard: 14 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    // Embassy services matching current admin panel values
    {
      id: 'AO_embassy',
      countryCode: 'AO',
      countryName: 'Angola',
      serviceType: 'embassy',
      officialFee: 2000,
      serviceFee: 1200,
      basePrice: 3200,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'EG_embassy',
      countryCode: 'EG',
      countryName: 'Egypten',
      serviceType: 'embassy',
      officialFee: 1500,
      serviceFee: 150,
      basePrice: 1650,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'MA_embassy',
      countryCode: 'MA',
      countryName: 'Marocko',
      serviceType: 'embassy',
      officialFee: 950,
      serviceFee: 150,
      basePrice: 1100,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'TN_embassy',
      countryCode: 'TN',
      countryName: 'Tunisien',
      serviceType: 'embassy',
      officialFee: 800,
      serviceFee: 150,
      basePrice: 950,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'DZ_embassy',
      countryCode: 'DZ',
      countryName: 'Algeriet',
      serviceType: 'embassy',
      officialFee: 1100,
      serviceFee: 150,
      basePrice: 1250,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'ET_embassy',
      countryCode: 'ET',
      countryName: 'Etiopien',
      serviceType: 'embassy',
      officialFee: 1200,
      serviceFee: 150,
      basePrice: 1350,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'KE_embassy',
      countryCode: 'KE',
      countryName: 'Kenya',
      serviceType: 'embassy',
      officialFee: 900,
      serviceFee: 150,
      basePrice: 1050,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'UG_embassy',
      countryCode: 'UG',
      countryName: 'Uganda',
      serviceType: 'embassy',
      officialFee: 950,
      serviceFee: 150,
      basePrice: 1100,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'TZ_embassy',
      countryCode: 'TZ',
      countryName: 'Tanzania',
      serviceType: 'embassy',
      officialFee: 1000,
      serviceFee: 150,
      basePrice: 1150,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'ZM_embassy',
      countryCode: 'ZM',
      countryName: 'Zambia',
      serviceType: 'embassy',
      officialFee: 1100,
      serviceFee: 150,
      basePrice: 1250,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'ZW_embassy',
      countryCode: 'ZW',
      countryName: 'Zimbabwe',
      serviceType: 'embassy',
      officialFee: 1200,
      serviceFee: 150,
      basePrice: 1350,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'MZ_embassy',
      countryCode: 'MZ',
      countryName: 'Moçambique',
      serviceType: 'embassy',
      officialFee: 1300,
      serviceFee: 150,
      basePrice: 1450,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'NA_embassy',
      countryCode: 'NA',
      countryName: 'Namibia',
      serviceType: 'embassy',
      officialFee: 1400,
      serviceFee: 150,
      basePrice: 1550,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'BW_embassy',
      countryCode: 'BW',
      countryName: 'Botswana',
      serviceType: 'embassy',
      officialFee: 1150,
      serviceFee: 150,
      basePrice: 1300,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'IQ_embassy',
      countryCode: 'IQ',
      countryName: 'Irak',
      serviceType: 'embassy',
      officialFee: 1920,
      serviceFee: 150,
      basePrice: 2070,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'IR_embassy',
      countryCode: 'IR',
      countryName: 'Iran',
      serviceType: 'embassy',
      officialFee: 23123,
      serviceFee: 100,
      basePrice: 23223,
      processingTime: { standard: 21 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'JO_embassy',
      countryCode: 'JO',
      countryName: 'Jordanien',
      serviceType: 'embassy',
      officialFee: 750,
      serviceFee: 150,
      basePrice: 900,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'LB_embassy',
      countryCode: 'LB',
      countryName: 'Libanon',
      serviceType: 'embassy',
      officialFee: 800,
      serviceFee: 150,
      basePrice: 950,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'SY_embassy',
      countryCode: 'SY',
      countryName: 'Syrien',
      serviceType: 'embassy',
      officialFee: 900,
      serviceFee: 150,
      basePrice: 1050,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'TR_embassy',
      countryCode: 'TR',
      countryName: 'Turkiet',
      serviceType: 'embassy',
      officialFee: 49232,
      serviceFee: 150,
      basePrice: 49382,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'IL_embassy',
      countryCode: 'IL',
      countryName: 'Israel',
      serviceType: 'embassy',
      officialFee: 650,
      serviceFee: 150,
      basePrice: 800,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'SA_embassy',
      countryCode: 'SA',
      countryName: 'Saudiarabien',
      serviceType: 'embassy',
      officialFee: 1500,
      serviceFee: 150,
      basePrice: 1650,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'AE_embassy',
      countryCode: 'AE',
      countryName: 'Förenade Arabemiraten',
      serviceType: 'embassy',
      officialFee: 1400,
      serviceFee: 150,
      basePrice: 1550,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'QA_embassy',
      countryCode: 'QA',
      countryName: 'Qatar',
      serviceType: 'embassy',
      officialFee: 5000,
      serviceFee: 2300,
      basePrice: 7300,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'KW_embassy',
      countryCode: 'KW',
      countryName: 'Kuwait',
      serviceType: 'embassy',
      officialFee: 23214,
      serviceFee: 23123,
      basePrice: 46337,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'BH_embassy',
      countryCode: 'BH',
      countryName: 'Bahrain',
      serviceType: 'embassy',
      officialFee: 1100,
      serviceFee: 150,
      basePrice: 1250,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'OM_embassy',
      countryCode: 'OM',
      countryName: 'Oman',
      serviceType: 'embassy',
      officialFee: 1350,
      serviceFee: 150,
      basePrice: 1500,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'YE_embassy',
      countryCode: 'YE',
      countryName: 'Jemen',
      serviceType: 'embassy',
      officialFee: 1000,
      serviceFee: 150,
      basePrice: 1150,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'TH_embassy',
      countryCode: 'TH',
      countryName: 'Thailand',
      serviceType: 'embassy',
      officialFee: 1395,
      serviceFee: 100,
      basePrice: 1495,
      processingTime: { standard: 14 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'VN_embassy',
      countryCode: 'VN',
      countryName: 'Vietnam',
      serviceType: 'embassy',
      officialFee: 242342340,
      serviceFee: 499,
      basePrice: 242342839,
      processingTime: { standard: 14 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'PH_embassy',
      countryCode: 'PH',
      countryName: 'Filippinerna',
      serviceType: 'embassy',
      officialFee: 800,
      serviceFee: 150,
      basePrice: 950,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'ID_embassy',
      countryCode: 'ID',
      countryName: 'Indonesien',
      serviceType: 'embassy',
      officialFee: 700,
      serviceFee: 150,
      basePrice: 850,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'MY_embassy',
      countryCode: 'MY',
      countryName: 'Malaysia',
      serviceType: 'embassy',
      officialFee: 850,
      serviceFee: 150,
      basePrice: 1000,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'SG_embassy',
      countryCode: 'SG',
      countryName: 'Singapore',
      serviceType: 'embassy',
      officialFee: 900,
      serviceFee: 150,
      basePrice: 1050,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'KR_embassy',
      countryCode: 'KR',
      countryName: 'Sydkorea',
      serviceType: 'embassy',
      officialFee: 750,
      serviceFee: 150,
      basePrice: 900,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'CN_embassy',
      countryCode: 'CN',
      countryName: 'Kina',
      serviceType: 'embassy',
      officialFee: 600,
      serviceFee: 150,
      basePrice: 750,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'IN_embassy',
      countryCode: 'IN',
      countryName: 'Indien',
      serviceType: 'embassy',
      officialFee: 550,
      serviceFee: 150,
      basePrice: 700,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'PK_embassy',
      countryCode: 'PK',
      countryName: 'Pakistan',
      serviceType: 'embassy',
      officialFee: 650,
      serviceFee: 150,
      basePrice: 800,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'BD_embassy',
      countryCode: 'BD',
      countryName: 'Bangladesh',
      serviceType: 'embassy',
      officialFee: 600,
      serviceFee: 150,
      basePrice: 750,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'LK_embassy',
      countryCode: 'LK',
      countryName: 'Sri Lanka',
      serviceType: 'embassy',
      officialFee: 700,
      serviceFee: 150,
      basePrice: 850,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'NP_embassy',
      countryCode: 'NP',
      countryName: 'Nepal',
      serviceType: 'embassy',
      officialFee: 650,
      serviceFee: 150,
      basePrice: 800,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'AF_embassy',
      countryCode: 'AF',
      countryName: 'Afghanistan',
      serviceType: 'embassy',
      officialFee: 800,
      serviceFee: 150,
      basePrice: 950,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'CU_embassy',
      countryCode: 'CU',
      countryName: 'Kuba',
      serviceType: 'embassy',
      officialFee: 1200,
      serviceFee: 150,
      basePrice: 1350,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'VE_embassy',
      countryCode: 'VE',
      countryName: 'Venezuela',
      serviceType: 'embassy',
      officialFee: 1100,
      serviceFee: 150,
      basePrice: 1250,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'BO_embassy',
      countryCode: 'BO',
      countryName: 'Bolivia',
      serviceType: 'embassy',
      officialFee: 1000,
      serviceFee: 150,
      basePrice: 1150,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'EC_embassy',
      countryCode: 'EC',
      countryName: 'Ecuador',
      serviceType: 'embassy',
      officialFee: 950,
      serviceFee: 150,
      basePrice: 1100,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'PE_embassy',
      countryCode: 'PE',
      countryName: 'Peru',
      serviceType: 'embassy',
      officialFee: 900,
      serviceFee: 150,
      basePrice: 1050,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'CO_embassy',
      countryCode: 'CO',
      countryName: 'Colombia',
      serviceType: 'embassy',
      officialFee: 850,
      serviceFee: 150,
      basePrice: 1000,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'CL_embassy',
      countryCode: 'CL',
      countryName: 'Chile',
      serviceType: 'embassy',
      officialFee: 800,
      serviceFee: 150,
      basePrice: 950,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'BR_embassy',
      countryCode: 'BR',
      countryName: 'Brasilien',
      serviceType: 'embassy',
      officialFee: 750,
      serviceFee: 150,
      basePrice: 900,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'AR_embassy',
      countryCode: 'AR',
      countryName: 'Argentina',
      serviceType: 'embassy',
      officialFee: 700,
      serviceFee: 150,
      basePrice: 850,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'MX_embassy',
      countryCode: 'MX',
      countryName: 'Mexiko',
      serviceType: 'embassy',
      officialFee: 650,
      serviceFee: 150,
      basePrice: 800,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'GT_embassy',
      countryCode: 'GT',
      countryName: 'Guatemala',
      serviceType: 'embassy',
      officialFee: 950,
      serviceFee: 150,
      basePrice: 1100,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'HN_embassy',
      countryCode: 'HN',
      countryName: 'Honduras',
      serviceType: 'embassy',
      officialFee: 1000,
      serviceFee: 150,
      basePrice: 1150,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'NI_embassy',
      countryCode: 'NI',
      countryName: 'Nicaragua',
      serviceType: 'embassy',
      officialFee: 1050,
      serviceFee: 150,
      basePrice: 1200,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'CR_embassy',
      countryCode: 'CR',
      countryName: 'Costa Rica',
      serviceType: 'embassy',
      officialFee: 900,
      serviceFee: 150,
      basePrice: 1050,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'PA_embassy',
      countryCode: 'PA',
      countryName: 'Panama',
      serviceType: 'embassy',
      officialFee: 850,
      serviceFee: 150,
      basePrice: 1000,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'DO_embassy',
      countryCode: 'DO',
      countryName: 'Dominikanska Republiken',
      serviceType: 'embassy',
      officialFee: 800,
      serviceFee: 150,
      basePrice: 950,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'RS_embassy',
      countryCode: 'RS',
      countryName: 'Serbien',
      serviceType: 'embassy',
      officialFee: 600,
      serviceFee: 150,
      basePrice: 750,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'BA_embassy',
      countryCode: 'BA',
      countryName: 'Bosnien och Hercegovina',
      serviceType: 'embassy',
      officialFee: 650,
      serviceFee: 150,
      basePrice: 800,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'ME_embassy',
      countryCode: 'ME',
      countryName: 'Montenegro',
      serviceType: 'embassy',
      officialFee: 700,
      serviceFee: 150,
      basePrice: 850,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'MK_embassy',
      countryCode: 'MK',
      countryName: 'Nordmakedonien',
      serviceType: 'embassy',
      officialFee: 750,
      serviceFee: 150,
      basePrice: 900,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'AL_embassy',
      countryCode: 'AL',
      countryName: 'Albanien',
      serviceType: 'embassy',
      officialFee: 550,
      serviceFee: 150,
      basePrice: 700,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'XK_embassy',
      countryCode: 'XK',
      countryName: 'Kosovo',
      serviceType: 'embassy',
      officialFee: 600,
      serviceFee: 150,
      basePrice: 750,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'KZ_embassy',
      countryCode: 'KZ',
      countryName: 'Kazakstan',
      serviceType: 'embassy',
      officialFee: 800,
      serviceFee: 150,
      basePrice: 950,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'UZ_embassy',
      countryCode: 'UZ',
      countryName: 'Uzbekistan',
      serviceType: 'embassy',
      officialFee: 750,
      serviceFee: 150,
      basePrice: 900,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'AZ_embassy',
      countryCode: 'AZ',
      countryName: 'Azerbajdzjan',
      serviceType: 'embassy',
      officialFee: 700,
      serviceFee: 150,
      basePrice: 850,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'GE_embassy',
      countryCode: 'GE',
      countryName: 'Georgien',
      serviceType: 'embassy',
      officialFee: 650,
      serviceFee: 150,
      basePrice: 800,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'AM_embassy',
      countryCode: 'AM',
      countryName: 'Armenien',
      serviceType: 'embassy',
      officialFee: 600,
      serviceFee: 150,
      basePrice: 750,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'BY_embassy',
      countryCode: 'BY',
      countryName: 'Vitryssland',
      serviceType: 'embassy',
      officialFee: 550,
      serviceFee: 150,
      basePrice: 700,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'UA_embassy',
      countryCode: 'UA',
      countryName: 'Ukraina',
      serviceType: 'embassy',
      officialFee: 500,
      serviceFee: 150,
      basePrice: 650,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'MD_embassy',
      countryCode: 'MD',
      countryName: 'Moldavien',
      serviceType: 'embassy',
      officialFee: 600,
      serviceFee: 150,
      basePrice: 750,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },

    // Keep some legacy entries for backward compatibility
    {
      id: 'US_apostille',
      countryCode: 'US',
      countryName: 'USA',
      serviceType: 'apostille',
      officialFee: 895,
      serviceFee: 100,
      basePrice: 995,
      processingTime: { standard: 7 },
      currency: 'SEK',
      updatedBy: 'system',
      isActive: true,
      lastUpdated: now
    }
  ];
};