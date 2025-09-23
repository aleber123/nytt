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
  limit,
  Timestamp,
  increment
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
    console.log(`🔥 Firebase: updateOrCreatePricingRule called for ${ruleId}`);
    console.log('🔥 Firebase: updates:', updates);
    console.log('🔥 Firebase: createData:', createData);

    const ruleRef = doc(db, 'pricing', ruleId);

    // Check if document exists first
    const docSnap = await getDoc(ruleRef);
    console.log(`🔥 Firebase: Document ${ruleId} exists:`, docSnap.exists());

    if (docSnap.exists()) {
      // Document exists, update it
      console.log('🔥 Firebase: Updating existing document');
      await updateDoc(ruleRef, {
        ...updates,
        lastUpdated: Timestamp.now()
      });
      console.log('🔥 Firebase: Update successful');
    } else if (createData) {
      // Document doesn't exist, create it
      console.log('🔥 Firebase: Creating new document');
      const ruleData: PricingRule = {
        ...createData,
        ...updates,
        id: ruleId,
        lastUpdated: Timestamp.now()
      };
      console.log('🔥 Firebase: Final ruleData to save:', ruleData);
      await setDoc(ruleRef, ruleData);
      console.log('🔥 Firebase: Create successful');
    } else {
      throw new Error(`Document ${ruleId} does not exist and no createData provided.`);
    }
  } catch (error) {
    console.error('❌ Firebase: Error updating or creating pricing rule:', error);
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

// Country Popularity Tracking
export interface CountryPopularity {
  countryCode: string;
  countryName: string;
  flag: string;
  selectionCount: number;
  lastSelected: Timestamp;
}

// Track country selection for popularity ranking
export const trackCountrySelection = async (countryCode: string): Promise<void> => {
  try {
    const popularityRef = doc(db, 'countryPopularity', countryCode);

    // Get country name and flag from allCountries array (we'll need to import this or pass it)
    const country = getAllCountries().find(c => c.code === countryCode);
    if (!country) return;

    const popularityData: CountryPopularity = {
      countryCode,
      countryName: country.name,
      flag: country.flag,
      selectionCount: 1,
      lastSelected: Timestamp.now()
    };

    // Try to update existing document, create if it doesn't exist
    const docSnap = await getDoc(popularityRef);
    if (docSnap.exists()) {
      // Increment selection count
      await updateDoc(popularityRef, {
        selectionCount: increment(1),
        lastSelected: Timestamp.now()
      });
    } else {
      // Create new document
      await setDoc(popularityRef, popularityData);
    }
  } catch (error) {
    console.error('Error tracking country selection:', error);
    // Don't throw error - tracking should not break the user flow
  }
};

// Get popular countries sorted by actual selection count
export const getPopularCountries = async (maxResults: number = 18): Promise<CountryPopularity[]> => {
  try {
    // Get all dynamic popularity data
    const q = query(
      collection(db, 'countryPopularity'),
      orderBy('selectionCount', 'desc'),
      orderBy('lastSelected', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const dynamicCountries = querySnapshot.docs.map(doc => doc.data() as CountryPopularity);

    // If we have enough dynamic data, return it
    if (dynamicCountries.length >= maxResults) {
      return dynamicCountries.slice(0, maxResults);
    }

    // Otherwise, merge with static data for countries not in dynamic data
    const staticPopular = getStaticPopularCountries();
    const existingCodes = new Set(dynamicCountries.map(c => c.countryCode));

    // Add static countries that aren't already in the dynamic list, but give them lower priority
    const mergedCountries = [...dynamicCountries];
    for (const staticCountry of staticPopular) {
      if (!existingCodes.has(staticCountry.code) && mergedCountries.length < maxResults) {
        mergedCountries.push({
          countryCode: staticCountry.code,
          countryName: staticCountry.name,
          flag: staticCountry.flag,
          selectionCount: Math.max(1, Math.floor((staticCountry.popularity || 0) / 10)), // Reduce static popularity significantly
          lastSelected: Timestamp.now()
        });
      }
    }

    // Sort again to ensure dynamic data comes first
    return mergedCountries.sort((a, b) => {
      // Dynamic data (higher selection counts) first
      if (a.selectionCount !== b.selectionCount) {
        return b.selectionCount - a.selectionCount;
      }
      // Then by last selected
      return b.lastSelected.toMillis() - a.lastSelected.toMillis();
    }).slice(0, maxResults);

  } catch (error) {
    console.error('Error getting popular countries:', error);
    // Fall back to static popular countries with reduced popularity
    return getStaticPopularCountries().map(country => ({
      countryCode: country.code,
      countryName: country.name,
      flag: country.flag,
      selectionCount: Math.max(1, Math.floor((country.popularity || 0) / 10)), // Reduce static popularity significantly
      lastSelected: Timestamp.now()
    })).sort((a, b) => b.selectionCount - a.selectionCount).slice(0, maxResults);
  }
};

// Get static popular countries as fallback
const getStaticPopularCountries = () => [
  { code: 'US', name: 'USA', flag: '🇺🇸', popularity: 95 },
  { code: 'GB', name: 'Storbritannien', flag: '🇬🇧', popularity: 85 },
  { code: 'DE', name: 'Tyskland', flag: '🇩🇪', popularity: 80 },
  { code: 'SE', name: 'Sverige', flag: '🇸🇪', popularity: 75 },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', popularity: 72 },
  { code: 'NO', name: 'Norge', flag: '🇳🇴', popularity: 70 },
  { code: 'DK', name: 'Danmark', flag: '🇩🇰', popularity: 65 },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', popularity: 60 },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', popularity: 58 },
  { code: 'FR', name: 'Frankrike', flag: '🇫🇷', popularity: 55 },
  { code: 'IR', name: 'Iran', flag: '🇮🇷', popularity: 52 },
  { code: 'ES', name: 'Spanien', flag: '🇪🇸', popularity: 50 },
  { code: 'IT', name: 'Italien', flag: '🇮🇹', popularity: 45 },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', popularity: 42 },
  { code: 'NL', name: 'Nederländerna', flag: '🇳🇱', popularity: 40 },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', popularity: 38 },
  { code: 'PL', name: 'Polen', flag: '🇵🇱', popularity: 35 },
  { code: 'CA', name: 'Kanada', flag: '🇨🇦', popularity: 30 }
];

// Get all countries list (copied from bestall.tsx to avoid circular imports)
const getAllCountries = () => [
  // Afrika (54 länder)
  { code: 'DZ', name: 'Algeriet', flag: '🇩🇿' },
  { code: 'AO', name: 'Angola', flag: '🇦🇴' },
  { code: 'BJ', name: 'Benin', flag: '🇧🇯' },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'BI', name: 'Burundi', flag: '🇧🇮' },
  { code: 'CV', name: 'Kap Verde', flag: '🇨🇻' },
  { code: 'CM', name: 'Kamerun', flag: '🇨🇲' },
  { code: 'CF', name: 'Centralafrikanska republiken', flag: '🇨🇫' },
  { code: 'TD', name: 'Tchad', flag: '🇹🇩' },
  { code: 'KM', name: 'Komorerna', flag: '🇰🇲' },
  { code: 'CG', name: 'Kongo-Brazzaville', flag: '🇨🇬' },
  { code: 'CD', name: 'Kongo-Kinshasa', flag: '🇨🇩' },
  { code: 'CI', name: 'Elfenbenskusten', flag: '🇨🇮' },
  { code: 'DJ', name: 'Djibouti', flag: '🇩🇯' },
  { code: 'EG', name: 'Egypten', flag: '🇪🇬' },
  { code: 'GQ', name: 'Ekvatorialguinea', flag: '🇬🇶' },
  { code: 'ER', name: 'Eritrea', flag: '🇪🇷' },
  { code: 'SZ', name: 'Eswatini', flag: '🇸🇿' },
  { code: 'ET', name: 'Etiopien', flag: '🇪🇹' },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦' },
  { code: 'GM', name: 'Gambia', flag: '🇬🇲' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'GN', name: 'Guinea', flag: '🇬🇳' },
  { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'LS', name: 'Lesotho', flag: '🇱🇸' },
  { code: 'LR', name: 'Liberia', flag: '🇱🇷' },
  { code: 'LY', name: 'Libyen', flag: '🇱🇾' },
  { code: 'MG', name: 'Madagaskar', flag: '🇲🇬' },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱' },
  { code: 'MR', name: 'Mauretanien', flag: '🇲🇷' },
  { code: 'MU', name: 'Mauritius', flag: '🇲🇺' },
  { code: 'MA', name: 'Marocko', flag: '🇲🇦' },
  { code: 'MZ', name: 'Moçambique', flag: '🇲🇿' },
  { code: 'NA', name: 'Namibia', flag: '🇳🇦' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
  { code: 'ST', name: 'São Tomé och Príncipe', flag: '🇸🇹' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳' },
  { code: 'SC', name: 'Seychellerna', flag: '🇸🇨' },
  { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱' },
  { code: 'SO', name: 'Somalia', flag: '🇸🇴' },
  { code: 'ZA', name: 'Sydafrika', flag: '🇿🇦' },
  { code: 'SS', name: 'Sydsudan', flag: '🇸🇸' },
  { code: 'SD', name: 'Sudan', flag: '🇸🇩' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬' },
  { code: 'TN', name: 'Tunisien', flag: '🇹🇳' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼' },

  // Asien (48 länder)
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫' },
  { code: 'AM', name: 'Armenien', flag: '🇦🇲' },
  { code: 'AZ', name: 'Azerbajdzjan', flag: '🇦🇿' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'BT', name: 'Bhutan', flag: '🇧🇹' },
  { code: 'BN', name: 'Brunei', flag: '🇧🇳' },
  { code: 'KH', name: 'Kambodja', flag: '🇰🇭' },
  { code: 'CN', name: 'Kina', flag: '🇨🇳' },
  { code: 'CY', name: 'Cypern', flag: '🇨🇾' },
  { code: 'GE', name: 'Georgien', flag: '🇬🇪' },
  { code: 'IN', name: 'Indien', flag: '🇮🇳' },
  { code: 'ID', name: 'Indonesien', flag: '🇮🇩' },
  { code: 'IR', name: 'Iran', flag: '🇮🇷' },
  { code: 'IQ', name: 'Irak', flag: '🇮🇶' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'JO', name: 'Jordanien', flag: '🇯🇴' },
  { code: 'KZ', name: 'Kazakstan', flag: '🇰🇿' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼' },
  { code: 'KG', name: 'Kirgizistan', flag: '🇰🇬' },
  { code: 'LA', name: 'Laos', flag: '🇱🇦' },
  { code: 'LB', name: 'Libanon', flag: '🇱🇧' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'MV', name: 'Maldiverna', flag: '🇲🇻' },
  { code: 'MN', name: 'Mongoliet', flag: '🇲🇳' },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵' },
  { code: 'KP', name: 'Nordkorea', flag: '🇰🇵' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'PS', name: 'Palestina', flag: '🇵🇸' },
  { code: 'PH', name: 'Filippinerna', flag: '🇵🇭' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: 'SA', name: 'Saudiarabien', flag: '🇸🇦' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'KR', name: 'Sydkorea', flag: '🇰🇷' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'SY', name: 'Syrien', flag: '🇸🇾' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼' },
  { code: 'TJ', name: 'Tadzjikistan', flag: '🇹🇯' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'TL', name: 'Östtimor', flag: '🇹🇱' },
  { code: 'TR', name: 'Turkiet', flag: '🇹🇷' },
  { code: 'TM', name: 'Turkmenistan', flag: '🇹🇲' },
  { code: 'AE', name: 'Förenade Arabemiraten', flag: '🇦🇪' },
  { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'YE', name: 'Jemen', flag: '🇾🇪' },

  // Europa (44 länder)
  { code: 'AL', name: 'Albanien', flag: '🇦🇱' },
  { code: 'AD', name: 'Andorra', flag: '🇦🇩' },
  { code: 'AT', name: 'Österrike', flag: '🇦🇹' },
  { code: 'BY', name: 'Vitryssland', flag: '🇧🇾' },
  { code: 'BE', name: 'Belgien', flag: '🇧🇪' },
  { code: 'BA', name: 'Bosnien och Hercegovina', flag: '🇧🇦' },
  { code: 'BG', name: 'Bulgarien', flag: '🇧🇬' },
  { code: 'HR', name: 'Kroatien', flag: '🇭🇷' },
  { code: 'CY', name: 'Cypern', flag: '🇨🇾' },
  { code: 'CZ', name: 'Tjeckien', flag: '🇨🇿' },
  { code: 'DK', name: 'Danmark', flag: '🇩🇰' },
  { code: 'EE', name: 'Estland', flag: '🇪🇪' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'FR', name: 'Frankrike', flag: '🇫🇷' },
  { code: 'DE', name: 'Tyskland', flag: '🇩🇪' },
  { code: 'GR', name: 'Grekland', flag: '🇬🇷' },
  { code: 'HU', name: 'Ungern', flag: '🇭🇺' },
  { code: 'IS', name: 'Island', flag: '🇮🇸' },
  { code: 'IE', name: 'Irland', flag: '🇮🇪' },
  { code: 'IT', name: 'Italien', flag: '🇮🇹' },
  { code: 'LV', name: 'Lettland', flag: '🇱🇻' },
  { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮' },
  { code: 'LT', name: 'Litauen', flag: '🇱🇹' },
  { code: 'LU', name: 'Luxemburg', flag: '🇱🇺' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹' },
  { code: 'MD', name: 'Moldavien', flag: '🇲🇩' },
  { code: 'MC', name: 'Monaco', flag: '🇲🇨' },
  { code: 'ME', name: 'Montenegro', flag: '🇲🇪' },
  { code: 'NL', name: 'Nederländerna', flag: '🇳🇱' },
  { code: 'MK', name: 'Nordmakedonien', flag: '🇲🇰' },
  { code: 'NO', name: 'Norge', flag: '🇳🇴' },
  { code: 'PL', name: 'Polen', flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'RO', name: 'Rumänien', flag: '🇷🇴' },
  { code: 'RU', name: 'Ryssland', flag: '🇷🇺' },
  { code: 'SM', name: 'San Marino', flag: '🇸🇲' },
  { code: 'RS', name: 'Serbien', flag: '🇷🇸' },
  { code: 'SK', name: 'Slovakien', flag: '🇸🇰' },
  { code: 'SI', name: 'Slovenien', flag: '🇸🇮' },
  { code: 'ES', name: 'Spanien', flag: '🇪🇸' },
  { code: 'SE', name: 'Sverige', flag: '🇸🇪' },
  { code: 'CH', name: 'Schweiz', flag: '🇨🇭' },
  { code: 'UA', name: 'Ukraina', flag: '🇺🇦' },
  { code: 'GB', name: 'Storbritannien', flag: '🇬🇧' },
  { code: 'VA', name: 'Vatikanstaten', flag: '🇻🇦' },

  // Nordamerika (23 länder)
  { code: 'AG', name: 'Antigua och Barbuda', flag: '🇦🇬' },
  { code: 'BS', name: 'Bahamas', flag: '🇧🇸' },
  { code: 'BB', name: 'Barbados', flag: '🇧🇧' },
  { code: 'BZ', name: 'Belize', flag: '🇧🇿' },
  { code: 'CA', name: 'Kanada', flag: '🇨🇦' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'CU', name: 'Kuba', flag: '🇨🇺' },
  { code: 'DM', name: 'Dominica', flag: '🇩🇲' },
  { code: 'DO', name: 'Dominikanska republiken', flag: '🇩🇴' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻' },
  { code: 'GD', name: 'Grenada', flag: '🇬🇩' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'HT', name: 'Haiti', flag: '🇭🇹' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳' },
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲' },
  { code: 'MX', name: 'Mexiko', flag: '🇲🇽' },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
  { code: 'PA', name: 'Panama', flag: '🇵🇦' },
  { code: 'KN', name: 'Saint Kitts och Nevis', flag: '🇰🇳' },
  { code: 'LC', name: 'Saint Lucia', flag: '🇱🇨' },
  { code: 'VC', name: 'Saint Vincent och Grenadinerna', flag: '🇻🇨' },
  { code: 'TT', name: 'Trinidad och Tobago', flag: '🇹🇹' },
  { code: 'US', name: 'USA', flag: '🇺🇸' },

  // Sydamerika (12 länder)
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
  { code: 'BR', name: 'Brasilien', flag: '🇧🇷' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'GY', name: 'Guyana', flag: '🇬🇾' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪' },
  { code: 'SR', name: 'Surinam', flag: '🇸🇷' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },

  // Oceanien (14 länder)
  { code: 'AU', name: 'Australien', flag: '🇦🇺' },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯' },
  { code: 'KI', name: 'Kiribati', flag: '🇰🇮' },
  { code: 'MH', name: 'Marshallöarna', flag: '🇲🇭' },
  { code: 'FM', name: 'Mikronesiska federationen', flag: '🇫🇲' },
  { code: 'NR', name: 'Nauru', flag: '🇳🇷' },
  { code: 'NZ', name: 'Nya Zeeland', flag: '🇳🇿' },
  { code: 'PW', name: 'Palau', flag: '🇵🇼' },
  { code: 'PG', name: 'Papua Nya Guinea', flag: '🇵🇬' },
  { code: 'WS', name: 'Samoa', flag: '🇼🇸' },
  { code: 'SB', name: 'Salomonöarna', flag: '🇸🇧' },
  { code: 'TO', name: 'Tonga', flag: '🇹🇴' },
  { code: 'TV', name: 'Tuvalu', flag: '🇹🇻' },
  { code: 'VU', name: 'Vanuatu', flag: '🇻🇺' },

  // Övriga
  { code: 'other', name: 'Annat land', flag: '🌍' }
];