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
import {
  EXPRESS_FEE,
  SCANNED_COPIES_FEE,
  DEFAULT_PICKUP_FEE,
  SERVICE_FALLBACK_PRICES,
  SERVICE_NAMES_SV,
  VAT_RATES,
  VAT_EXEMPT_OFFICIAL_FEES
} from '../config/pricing';

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
  priceUnconfirmed?: boolean; // When true, show "Price on request" to customer instead of actual price
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

export interface PickupPricing {
  id: string;
  method: 'dhl' | 'stockholm_courier' | 'dhl_express' | 'stockholm_sameday';
  name: string;
  description: string;
  price: number; // Price in SEK
  isActive: boolean;
  coverage: string; // e.g., "Nationwide" or "Stockholm area"
  isPremium?: boolean; // True for express/premium options
  baseMethod?: 'dhl' | 'stockholm_courier'; // Reference to base method for premium options
  estimatedPickup?: string; // e.g., "Nästa arbetsdag", "Samma dag"
  lastUpdated: Timestamp;
  updatedBy: string;
  notes?: string;
}

// Create or update a pricing rule
export const setPricingRule = async (rule: Omit<PricingRule, 'id' | 'lastUpdated'>): Promise<string> => {
  try {
    // Check if Firebase is initialized (client-side only)
    if (!db) {
      // Firebase not initialized
      throw new Error('Firebase not available');
    }

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
    // Check if Firebase is initialized (client-side only)
    if (!db) {
      // Firebase not initialized
      return null;
    }

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
    // Check if Firebase is initialized (client-side only)
    if (!db) {
      // Firebase not initialized, using mock data
      const mockRules = getMockPricingRules();
      return mockRules.filter(rule => rule.countryCode === countryCode);
    }

    // Add timeout to prevent hanging on Vercel
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firebase timeout')), 3000)
    );

    const firebasePromise = (async () => {
      const q = query(
        collection(db, 'pricing'),
        where('countryCode', '==', countryCode),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);
      const rules = querySnapshot.docs.map(doc => doc.data() as PricingRule);

      // Sort client-side to avoid composite index requirement
      return rules.sort((a, b) => b.lastUpdated.toMillis() - a.lastUpdated.toMillis());
    })();

    const rules = await Promise.race([firebasePromise, timeoutPromise]);
    return rules;
  } catch (error) {
    console.error('Error getting country pricing rules:', error);
    // Return mock data filtered by country if Firebase fails
    // Using mock pricing data for country
    const mockRules = getMockPricingRules();
    return mockRules.filter(rule => rule.countryCode === countryCode);
  }
};

// Get all active pricing rules
export const getAllActivePricingRules = async (): Promise<PricingRule[]> => {
  try {
    // Check if Firebase is initialized (client-side only)
    if (!db) {
      // Firebase not initialized, using mock pricing data
      return getMockPricingRules();
    }

    // Add timeout to prevent hanging on Vercel
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firebase timeout')), 3000)
    );

    const firebasePromise = (async () => {
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
    })();

    const rules = await Promise.race([firebasePromise, timeoutPromise]);
    return rules;
  } catch (error) {
    console.error('Error getting all active pricing rules:', error);
    // Return mock data if Firebase fails
    // Using mock pricing data due to Firebase connection issues
    return getMockPricingRules();
  }
};

// Update pricing rule
export const updatePricingRule = async (
  ruleId: string,
  updates: Partial<Omit<PricingRule, 'id' | 'lastUpdated'>>
): Promise<void> => {
  try {
    // Check if Firebase is initialized (client-side only)
    if (!db) {
      // Firebase not initialized
      throw new Error('Firebase not available');
    }

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
    // Check if Firebase is initialized (client-side only)
    if (!db) {
      // Firebase not initialized
      throw new Error('Firebase not available');
    }


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

// Helper function to extract numeric price from service object
// Supports both numeric priceValue field and string price field (e.g., "Från 85 kr")
const extractPrice = (service: any): number => {
  // Prefer numeric priceValue if available
  if (typeof service.priceValue === 'number') {
    return service.priceValue;
  }
  // Fall back to parsing string price
  if (typeof service.price === 'string') {
    // Remove spaces and extract all digits
    const cleanedPrice = service.price.replace(/\s/g, '');
    const priceMatch = cleanedPrice.match(/(\d+)/);
    if (priceMatch) {
      return parseInt(priceMatch[1]);
    }
  }
  // If price is already a number
  if (typeof service.price === 'number') {
    return service.price;
  }
  return 0;
};

// Customer pricing interface (imported from customerService)
interface CustomerPricingData {
  customPricing?: {
    // Service fees (DOX handling fees)
    doxServiceFee?: number;
    expressServiceFee?: number;
    apostilleServiceFee?: number;
    notarizationServiceFee?: number;
    embassyServiceFee?: number;
    translationServiceFee?: number;
    chamberServiceFee?: number;
    udServiceFee?: number;
    // Official fees (government/authority fees - can be customized per customer)
    apostilleOfficialFee?: number;
    notarizationOfficialFee?: number;
    chamberOfficialFee?: number;
    udOfficialFee?: number;
    embassyOfficialFee?: number;
    // Pickup fees
    dhlPickupFee?: number;
    dhlExpressPickupFee?: number;
    stockholmCourierFee?: number;
    stockholmSamedayFee?: number;
    // DHL Return delivery options
    dhlEndOfDayFee?: number;
    dhlPre12Fee?: number;
    dhlPre9Fee?: number;
    // Stockholm Courier return delivery options
    stockholmCityFee?: number;
    stockholmExpressFee?: number;
    stockholmUrgentFee?: number;
    // Return fees
    scannedCopiesFee?: number;
    returnDhlFee?: number;
    returnPostnordFee?: number;
    returnBudFee?: number;
  };
  vatExempt?: boolean;
  companyName?: string;
}

// Helper to get custom service fee for a service type
const getCustomServiceFee = (serviceType: string, customerPricing?: CustomerPricingData['customPricing']): number | undefined => {
  if (!customerPricing) return undefined;
  
  const feeMap: Record<string, number | undefined> = {
    'apostille': customerPricing.apostilleServiceFee,
    'notarization': customerPricing.notarizationServiceFee,
    'embassy': customerPricing.embassyServiceFee,
    'translation': customerPricing.translationServiceFee,
    'chamber': customerPricing.chamberServiceFee,
    'ud': customerPricing.udServiceFee
  };
  
  return feeMap[serviceType];
};

// Helper to get custom official fee for a service type (government/authority fees)
const getCustomOfficialFee = (serviceType: string, customerPricing?: CustomerPricingData['customPricing']): number | undefined => {
  if (!customerPricing) return undefined;
  
  const feeMap: Record<string, number | undefined> = {
    'apostille': customerPricing.apostilleOfficialFee,
    'notarization': customerPricing.notarizationOfficialFee,
    'embassy': customerPricing.embassyOfficialFee,
    'chamber': customerPricing.chamberOfficialFee,
    'ud': customerPricing.udOfficialFee
  };
  
  return feeMap[serviceType];
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
  pickupMethod?: 'dhl' | 'stockholm_courier';
  premiumPickup?: string;
  premiumDelivery?: string;
  customerPricing?: CustomerPricingData; // Customer-specific pricing data
}): Promise<{
  basePrice: number;
  additionalFees: number;
  totalPrice: number;
  breakdown: any[];
  hasUnconfirmedPrices?: boolean;
  unconfirmedServices?: string[];
  vatExempt?: boolean;
  matchedCustomer?: string;
}> => {
  try {
    let totalBasePrice = 0;
    let totalAdditionalFees = 0;
    const breakdown: any[] = [];
    let hasUnconfirmedPrices = false;
    const unconfirmedServices: string[] = [];
    
    // Check if customer is VAT exempt
    const isVatExempt = orderData.customerPricing?.vatExempt || false;

    for (const serviceType of orderData.services) {
      let rule = await getPricingRule(orderData.country, serviceType);

      // If no country-specific rule, try to get standard Swedish rule for standard services
      if (!rule && ['notarization', 'chamber', 'ud', 'apostille'].includes(serviceType)) {
        rule = await getPricingRule('SE', serviceType);
      }

      // If still no rule, use fallback prices from centralized config
      if (!rule) {
        const fallback = SERVICE_FALLBACK_PRICES[serviceType];
        if (fallback) {
          rule = {
            id: `${orderData.country}_${serviceType}_fallback`,
            countryCode: orderData.country,
            countryName: '',
            serviceType: serviceType,
            officialFee: fallback.officialFee,
            serviceFee: fallback.serviceFee,
            basePrice: fallback.officialFee + fallback.serviceFee,
            processingTime: { standard: 14 },
            currency: 'SEK',
            updatedBy: 'system',
            isActive: true,
            lastUpdated: Timestamp.now()
          } as PricingRule;
        }
      }

      if (rule) {
        // Check if this service has unconfirmed pricing
        if (rule.priceUnconfirmed) {
          hasUnconfirmedPrices = true;
          unconfirmedServices.push(serviceType);
        }

        // Get service name from centralized config
        const serviceName = SERVICE_NAMES_SV[serviceType] || serviceType;
        
        // Check for customer-specific official fee, otherwise use standard
        const customOfficialFee = getCustomOfficialFee(serviceType, orderData.customerPricing?.customPricing);
        const officialFeeToUse = customOfficialFee !== undefined ? customOfficialFee : rule.officialFee;
        const officialTotal = officialFeeToUse * orderData.quantity;
        
        // Check for customer-specific service fee, otherwise use standard
        const customServiceFee = getCustomServiceFee(serviceType, orderData.customerPricing?.customPricing);
        const serviceFeeTotal = customServiceFee !== undefined ? customServiceFee : rule.serviceFee;
        
        // Check for custom DOX service fee (applies to all services as a general override)
        const doxServiceFee = orderData.customerPricing?.customPricing?.doxServiceFee;
        const finalServiceFee = doxServiceFee !== undefined && customServiceFee === undefined 
          ? doxServiceFee 
          : serviceFeeTotal;

        totalBasePrice += officialTotal + finalServiceFee;

        // Add official fee line (per document)
        // Only UD and embassy official fees are VAT exempt (government fees)
        const isOfficialFeeVatExempt = VAT_EXEMPT_OFFICIAL_FEES.includes(serviceType);
        breakdown.push({
          service: `${serviceType}_official`,
          description: `${serviceName} - Officiell avgift`,
          quantity: orderData.quantity,
          unitPrice: officialFeeToUse,
          total: officialTotal,
          vatRate: isOfficialFeeVatExempt ? VAT_RATES.EXEMPT : (isVatExempt ? VAT_RATES.EXEMPT : VAT_RATES.STANDARD),
          isTBC: rule.priceUnconfirmed || false
        });

        // Add service fee line (per order, not per document)
        // VAT rate depends on customer VAT exempt status
        breakdown.push({
          service: `${serviceType}_service`,
          description: `DOX Visumpartner serviceavgift (${serviceName})`,
          quantity: 1,
          unitPrice: finalServiceFee,
          total: finalServiceFee,
          vatRate: isVatExempt ? VAT_RATES.EXEMPT : VAT_RATES.STANDARD,
          isTBC: false // Service fee is always confirmed
        });

      }
    }

    // Add express fee if applicable (once per order, not per service)
    // Use customer-specific express fee if available
    if (orderData.expedited) {
      const customExpressFee = orderData.customerPricing?.customPricing?.expressServiceFee;
      const expressFee = customExpressFee !== undefined ? customExpressFee : EXPRESS_FEE;
      totalAdditionalFees += expressFee;
      breakdown.push({
        service: 'express',
        description: 'Expresstjänst',
        fee: expressFee,
        total: expressFee,
        quantity: 1,
        unitPrice: expressFee,
        vatRate: isVatExempt ? VAT_RATES.EXEMPT : VAT_RATES.STANDARD
      });
    }

    // Add return service cost (with customer-specific overrides)
    if (orderData.returnService && orderData.returnServices) {
      const returnService = orderData.returnServices.find(s => s.id === orderData.returnService);
      if (returnService) {
        const standardReturnCost = extractPrice(returnService);
        
        // Check for customer-specific return fee based on service type
        let customReturnFee: number | undefined;
        const serviceId = orderData.returnService.toLowerCase();
        // DHL options
        if (serviceId.includes('pre12') || serviceId.includes('pre-12')) {
          customReturnFee = orderData.customerPricing?.customPricing?.dhlPre12Fee;
        } else if (serviceId.includes('pre9') || serviceId.includes('pre-9')) {
          customReturnFee = orderData.customerPricing?.customPricing?.dhlPre9Fee;
        } else if (serviceId.includes('endofday') || serviceId.includes('end-of-day') || serviceId.includes('end_of_day')) {
          customReturnFee = orderData.customerPricing?.customPricing?.dhlEndOfDayFee;
        } else if (serviceId.includes('dhl')) {
          customReturnFee = orderData.customerPricing?.customPricing?.returnDhlFee ?? orderData.customerPricing?.customPricing?.dhlEndOfDayFee;
        // Stockholm Courier options
        } else if (serviceId.includes('stockholm-city') || serviceId.includes('stockholm_city')) {
          customReturnFee = orderData.customerPricing?.customPricing?.stockholmCityFee;
        } else if (serviceId.includes('stockholm-express') || serviceId.includes('stockholm_express')) {
          customReturnFee = orderData.customerPricing?.customPricing?.stockholmExpressFee;
        } else if (serviceId.includes('stockholm-sameday') || serviceId.includes('stockholm_sameday') || serviceId.includes('stockholm-urgent') || serviceId.includes('stockholm_urgent')) {
          customReturnFee = orderData.customerPricing?.customPricing?.stockholmUrgentFee;
        // Other options
        } else if (serviceId.includes('postnord')) {
          customReturnFee = orderData.customerPricing?.customPricing?.returnPostnordFee;
        } else if (serviceId.includes('bud') || serviceId.includes('courier')) {
          customReturnFee = orderData.customerPricing?.customPricing?.returnBudFee;
        }
        
        const finalReturnCost = customReturnFee !== undefined ? customReturnFee : standardReturnCost;
        if (finalReturnCost > 0) {
          totalAdditionalFees += finalReturnCost;
          breakdown.push({
            service: 'return_service',
            description: returnService.name,
            fee: finalReturnCost,
            total: finalReturnCost,
            quantity: 1,
            unitPrice: finalReturnCost,
            vatRate: isVatExempt ? VAT_RATES.EXEMPT : VAT_RATES.STANDARD
          });
        }
      }
    }

    // Add scanned copies cost (use customer-specific fee if available)
    if (orderData.scannedCopies) {
      const customScannedFee = orderData.customerPricing?.customPricing?.scannedCopiesFee;
      const scannedUnitFee = customScannedFee !== undefined ? customScannedFee : SCANNED_COPIES_FEE;
      const scannedCost = scannedUnitFee * orderData.quantity;
      totalAdditionalFees += scannedCost;
      breakdown.push({
        service: 'scanned_copies',
        description: 'Skannade kopior',
        fee: scannedCost,
        total: scannedCost,
        quantity: orderData.quantity,
        unitPrice: scannedUnitFee,
        vatRate: isVatExempt ? VAT_RATES.EXEMPT : VAT_RATES.STANDARD
      });
    }

    // Add pickup service cost (dynamic pricing based on method, with customer overrides)
    if (orderData.pickupService && orderData.pickupMethod) {
      const pickupPricing = await getPickupPricingByMethod(orderData.pickupMethod);
      
      // Check for customer-specific pickup fee
      let customPickupFee: number | undefined;
      if (orderData.pickupMethod === 'dhl') {
        customPickupFee = orderData.customerPricing?.customPricing?.dhlPickupFee;
      } else if (orderData.pickupMethod === 'stockholm_courier') {
        customPickupFee = orderData.customerPricing?.customPricing?.stockholmCourierFee;
      }
      
      if (pickupPricing) {
        const finalPickupPrice = customPickupFee !== undefined ? customPickupFee : pickupPricing.price;
        totalAdditionalFees += finalPickupPrice;
        breakdown.push({
          service: 'pickup_service',
          description: pickupPricing.name,
          fee: finalPickupPrice,
          total: finalPickupPrice,
          quantity: 1,
          unitPrice: finalPickupPrice,
          vatRate: isVatExempt ? VAT_RATES.EXEMPT : VAT_RATES.STANDARD
        });
      } else {
        // Fallback to default price from centralized config
        const fallbackPrice = customPickupFee !== undefined ? customPickupFee : DEFAULT_PICKUP_FEE;
        totalAdditionalFees += fallbackPrice;
        breakdown.push({
          service: 'pickup_service',
          description: 'Hämtning av dokument',
          fee: fallbackPrice,
          total: fallbackPrice,
          quantity: 1,
          unitPrice: fallbackPrice,
          vatRate: isVatExempt ? VAT_RATES.EXEMPT : VAT_RATES.STANDARD
        });
      }
    }

    // Add premium pickup cost if selected (with customer overrides)
    if (orderData.premiumPickup) {
      const premiumPickupPricing = await getPickupPricingByMethod(orderData.premiumPickup as any);
      
      // Check for customer-specific premium pickup fee
      let customPremiumPickupFee: number | undefined;
      if (orderData.premiumPickup === 'dhl_express') {
        customPremiumPickupFee = orderData.customerPricing?.customPricing?.dhlExpressPickupFee;
      } else if (orderData.premiumPickup === 'stockholm_sameday') {
        customPremiumPickupFee = orderData.customerPricing?.customPricing?.stockholmSamedayFee;
      }
      
      if (premiumPickupPricing) {
        const finalPremiumPrice = customPremiumPickupFee !== undefined ? customPremiumPickupFee : premiumPickupPricing.price;
        totalAdditionalFees += finalPremiumPrice;
        breakdown.push({
          service: 'premium_pickup',
          description: premiumPickupPricing.name,
          fee: finalPremiumPrice,
          total: finalPremiumPrice,
          quantity: 1,
          unitPrice: finalPremiumPrice,
          vatRate: isVatExempt ? VAT_RATES.EXEMPT : VAT_RATES.STANDARD
        });
      }
    }

    // Add premium delivery cost (if selected separately from return service, with customer overrides)
    if (orderData.premiumDelivery && orderData.returnServices) {
      const premiumService = orderData.returnServices.find((s: any) => s.id === orderData.premiumDelivery);
      if (premiumService) {
        const standardPremiumCost = extractPrice(premiumService);
        
        // Check for customer-specific premium delivery fee
        let customPremiumDeliveryFee: number | undefined;
        const deliveryId = orderData.premiumDelivery.toLowerCase();
        if (deliveryId.includes('dhl')) {
          customPremiumDeliveryFee = orderData.customerPricing?.customPricing?.returnDhlFee;
        } else if (deliveryId.includes('bud') || deliveryId.includes('courier')) {
          customPremiumDeliveryFee = orderData.customerPricing?.customPricing?.returnBudFee;
        }
        
        const finalPremiumCost = customPremiumDeliveryFee !== undefined ? customPremiumDeliveryFee : standardPremiumCost;
        if (finalPremiumCost > 0) {
          totalAdditionalFees += finalPremiumCost;
          breakdown.push({
            service: 'premium_delivery',
            description: premiumService.name,
            fee: finalPremiumCost,
            total: finalPremiumCost,
            quantity: 1,
            unitPrice: finalPremiumCost,
            vatRate: isVatExempt ? VAT_RATES.EXEMPT : VAT_RATES.STANDARD
          });
        }
      }
    }

    return {
      basePrice: totalBasePrice,
      additionalFees: totalAdditionalFees,
      totalPrice: totalBasePrice + totalAdditionalFees,
      breakdown,
      hasUnconfirmedPrices,
      unconfirmedServices,
      vatExempt: isVatExempt,
      matchedCustomer: orderData.customerPricing?.companyName
    };
  } catch (error) {
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
    // Using mock pricing stats
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
    // Check if Firebase is initialized (client-side only)
    if (!db) {
      // Firebase not initialized
      return;
    }

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
    // Check if Firebase is initialized (client-side only)
    if (!db) {
      return getStaticPopularCountries().map(country => ({
        countryCode: country.code,
        countryName: country.name,
        flag: country.flag,
        selectionCount: Math.max(1, Math.floor((country.popularity || 0) / 10)),
        lastSelected: Timestamp.now()
      })).sort((a, b) => b.selectionCount - a.selectionCount).slice(0, maxResults);
    }

    // Get all dynamic popularity data - simple query without compound index
    const q = query(
      collection(db, 'countryPopularity'),
      orderBy('selectionCount', 'desc'),
      limit(maxResults * 2) // Get more than needed to allow for sorting
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

// Admin function: Seed initial popularity for specific countries
// Call this once from browser console or admin page to set up initial data
export const seedCountryPopularity = async (): Promise<{ success: number; failed: number; countries: string[] }> => {
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  // Countries to seed with initial clicks (based on expected demand)
  const countriesToSeed = [
    { code: 'VN', name: 'Vietnam', flag: '🇻🇳', clicks: 100 },
    { code: 'QA', name: 'Qatar', flag: '🇶🇦', clicks: 100 },
    { code: 'KW', name: 'Kuwait', flag: '🇰🇼', clicks: 100 },
    { code: 'TW', name: 'Taiwan', flag: '🇹🇼', clicks: 100 },
    { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', clicks: 100 },
    { code: 'LB', name: 'Lebanon', flag: '🇱🇧', clicks: 100 },
    { code: 'SY', name: 'Syria', flag: '🇸🇾', clicks: 100 },
    { code: 'AO', name: 'Angola', flag: '🇦🇴', clicks: 100 },
    { code: 'TH', name: 'Thailand', flag: '🇹🇭', clicks: 100 },
    { code: 'AE', name: 'UAE', flag: '🇦🇪', clicks: 100 },
    { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', clicks: 100 },
    { code: 'IQ', name: 'Iraq', flag: '🇮🇶', clicks: 100 },
  ];

  let success = 0;
  let failed = 0;
  const seededCountries: string[] = [];

  for (const country of countriesToSeed) {
    try {
      const popularityRef = doc(db, 'countryPopularity', country.code);
      const docSnap = await getDoc(popularityRef);
      
      if (docSnap.exists()) {
        // Add to existing count
        const currentCount = docSnap.data().selectionCount || 0;
        await updateDoc(popularityRef, {
          selectionCount: currentCount + country.clicks,
          lastSelected: Timestamp.now()
        });
      } else {
        // Create new document
        await setDoc(popularityRef, {
          countryCode: country.code,
          countryName: country.name,
          flag: country.flag,
          selectionCount: country.clicks,
          lastSelected: Timestamp.now()
        });
      }
      success++;
      seededCountries.push(country.name);
    } catch (error) {
      failed++;
    }
  }

  return { success, failed, countries: seededCountries };
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

// ============================================================================
// PICKUP PRICING FUNCTIONS
// ============================================================================

// Get all pickup pricing options
export const getAllPickupPricing = async (): Promise<PickupPricing[]> => {
  try {
    if (!db) {
      // Firebase not initialized
      return [];
    }

    const pickupRef = collection(db, 'pickupPricing');
    const snapshot = await getDocs(pickupRef);
    
    return snapshot.docs.map(doc => doc.data() as PickupPricing);
  } catch (error) {
    console.error('Error getting pickup pricing:', error);
    return [];
  }
};

// Get active pickup pricing options
export const getActivePickupPricing = async (): Promise<PickupPricing[]> => {
  try {
    if (!db) {
      // Firebase not initialized
      return [];
    }

    const pickupRef = collection(db, 'pickupPricing');
    const q = query(pickupRef, where('isActive', '==', true));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => doc.data() as PickupPricing);
  } catch (error) {
    console.error('Error getting active pickup pricing:', error);
    return [];
  }
};

// Get specific pickup pricing by method
export const getPickupPricingByMethod = async (method: 'dhl' | 'stockholm_courier'): Promise<PickupPricing | null> => {
  try {
    if (!db) {
      console.log('Firebase not initialized, returning null');
      return null;
    }

    const pickupRef = doc(db, 'pickupPricing', method);
    const snapshot = await getDoc(pickupRef);
    
    if (snapshot.exists()) {
      return snapshot.data() as PickupPricing;
    }
    return null;
  } catch (error) {
    console.error('Error getting pickup pricing by method:', error);
    return null;
  }
};

// Set or update pickup pricing
export const setPickupPricing = async (pricing: Omit<PickupPricing, 'lastUpdated'>): Promise<void> => {
  try {
    if (!db) {
      // Firebase not initialized
      throw new Error('Firebase not available');
    }

    const pickupRef = doc(db, 'pickupPricing', pricing.id);
    
    const pricingData: PickupPricing = {
      ...pricing,
      lastUpdated: Timestamp.now()
    };

    await setDoc(pickupRef, pricingData);
  } catch (error) {
    console.error('Error setting pickup pricing:', error);
    throw error;
  }
};

// Update pickup pricing
export const updatePickupPricing = async (
  method: 'dhl' | 'stockholm_courier' | 'dhl_express' | 'stockholm_sameday',
  updates: Partial<Omit<PickupPricing, 'id' | 'method' | 'lastUpdated'>>
): Promise<void> => {
  try {
    if (!db) {
      // Firebase not initialized
      throw new Error('Firebase not available');
    }

    const pickupRef = doc(db, 'pickupPricing', method);
    
    await updateDoc(pickupRef, {
      ...updates,
      lastUpdated: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating pickup pricing:', error);
    throw error;
  }
};

// Initialize default pickup pricing (call this once to set up the collection)
export const initializePickupPricing = async (updatedBy: string): Promise<void> => {
  try {
    if (!db) {
      // Firebase not initialized
      throw new Error('Firebase not available');
    }

    const defaultPricing: Omit<PickupPricing, 'lastUpdated'>[] = [
      {
        id: 'dhl',
        method: 'dhl',
        name: 'DHL Upphämtning',
        description: 'Rikstäckande upphämtning med DHL',
        price: 450,
        isActive: true,
        coverage: 'Hela Sverige',
        isPremium: false,
        estimatedPickup: 'Nästa arbetsdag',
        updatedBy,
        notes: 'Standard DHL upphämtning, spårbar och säker'
      },
      {
        id: 'dhl_express',
        method: 'dhl_express',
        name: 'DHL Premium Upphämtning',
        description: 'Snabbare upphämtning',
        price: 750,
        isActive: true,
        coverage: 'Hela Sverige',
        isPremium: true,
        baseMethod: 'dhl',
        estimatedPickup: 'Snabbare',
        updatedBy,
        notes: 'Premium upphämtning för brådskande ärenden'
      },
      {
        id: 'stockholm_courier',
        method: 'stockholm_courier',
        name: 'Stockholm Lokalbud',
        description: 'Snabb upphämtning med lokalbud i Stockholm',
        price: 350,
        isActive: true,
        coverage: 'Stockholm med omnejd',
        isPremium: false,
        estimatedPickup: 'Nästa arbetsdag',
        updatedBy,
        notes: 'Nästa dag upphämtning i Stockholmsområdet'
      },
      {
        id: 'stockholm_sameday',
        method: 'stockholm_sameday',
        name: 'Stockholm Premium Lokalbud',
        description: 'Snabbare upphämtning',
        price: 550,
        isActive: true,
        coverage: 'Stockholm innerstad',
        isPremium: true,
        baseMethod: 'stockholm_courier',
        estimatedPickup: 'Snabbare',
        updatedBy,
        notes: 'Premium alternativ för Stockholm'
      }
    ];

    for (const pricing of defaultPricing) {
      await setPickupPricing(pricing);
    }

  } catch (error) {
    console.error('Error initializing pickup pricing:', error);
    throw error;
  }
};

// ============================================
// Document Type Popularity Tracking
// ============================================

export interface DocumentTypePopularity {
  documentTypeId: string;
  documentTypeName: string;
  documentTypeNameEn: string;
  selectionCount: number;
  lastSelected: Timestamp;
  isCustom?: boolean; // True if this was a custom/freetext document type
}

// Predefined document types with translations (no emojis)
export const PREDEFINED_DOCUMENT_TYPES = [
  // Personal documents
  { id: 'birthCertificate', name: 'Födelsebevis', nameEn: 'Birth Certificate' },
  { id: 'marriageCertificate', name: 'Vigselbevis', nameEn: 'Marriage Certificate' },
  { id: 'deathCertificate', name: 'Dödsbevis', nameEn: 'Death Certificate' },
  { id: 'divorceDecree', name: 'Skilsmässodom', nameEn: 'Divorce Decree' },
  { id: 'adoptionCertificate', name: 'Adoptionshandling', nameEn: 'Adoption Certificate' },
  { id: 'nameChange', name: 'Namnändring', nameEn: 'Name Change Certificate' },
  
  // ID documents
  { id: 'passport', name: 'Pass', nameEn: 'Passport' },
  { id: 'passportCopy', name: 'Passkopia', nameEn: 'Passport Copy' },
  { id: 'idCard', name: 'ID-kort', nameEn: 'ID Card' },
  { id: 'drivingLicense', name: 'Körkort', nameEn: 'Driving License' },
  { id: 'residencePermit', name: 'Uppehållstillstånd', nameEn: 'Residence Permit' },
  
  // Education
  { id: 'diploma', name: 'Examensbevis', nameEn: 'Diploma' },
  { id: 'degreeCertificate', name: 'Examensbevis (högskola)', nameEn: 'Degree Certificate' },
  { id: 'transcript', name: 'Betyg/Studieintyg', nameEn: 'Transcript' },
  
  // Employment
  { id: 'employmentCertificate', name: 'Arbetsgivarintyg', nameEn: 'Employment Certificate' },
  { id: 'salaryCertificate', name: 'Löneintyg', nameEn: 'Salary Certificate' },
  { id: 'letterOfAppointment', name: 'Förordnande/Utnämning', nameEn: 'Letter of Appointment' },
  
  // Legal documents
  { id: 'powerOfAttorney', name: 'Fullmakt', nameEn: 'Power of Attorney' },
  { id: 'criminalRecord', name: 'Utdrag ur belastningsregistret', nameEn: 'Criminal Record' },
  { id: 'declarationLetter', name: 'Försäkran/Deklaration', nameEn: 'Declaration Letter' },
  
  // Company documents
  { id: 'companyRegistration', name: 'Registreringsbevis', nameEn: 'Company Registration' },
  { id: 'articlesOfAssociation', name: 'Bolagsordning', nameEn: 'Articles of Association' },
  { id: 'annualReport', name: 'Årsredovisning', nameEn: 'Annual Report' },
  { id: 'boardResolution', name: 'Styrelseprotokoll', nameEn: 'Board Resolution' },
  { id: 'minutesOfMeeting', name: 'Mötesprotokoll', nameEn: 'Minutes of Meeting' },
  { id: 'businessDocuments', name: 'Affärshandlingar', nameEn: 'Business Documents' },
  
  // Trade & Commercial
  { id: 'certificateOfOrigin', name: 'Ursprungsintyg', nameEn: 'Certificate of Origin' },
  { id: 'commercial', name: 'Handelshandling', nameEn: 'Commercial Document' },
  { id: 'freeSalesCertificate', name: 'Free Sales Certificate', nameEn: 'Free Sales Certificate' },
  { id: 'priceCertificate', name: 'Prisintyg', nameEn: 'Price Certificate' },
  { id: 'invoice', name: 'Faktura', nameEn: 'Invoice' },
  { id: 'contract', name: 'Avtal/Kontrakt', nameEn: 'Contract' },
  { id: 'distributionAgreement', name: 'Distributionsavtal', nameEn: 'Distribution Agreement' },
  { id: 'terminationAgreement', name: 'Uppsägning av avtal', nameEn: 'Termination of Agreement' },
  
  // Certifications & Compliance
  { id: 'euDeclarationOfConformity', name: 'EU-försäkran om överensstämmelse', nameEn: 'EU Declaration of Conformity' },
  { id: 'euCertificate', name: 'EU-certifikat', nameEn: 'EU Certificate' },
  { id: 'isoCertificate', name: 'ISO-certifikat', nameEn: 'ISO Certificate' },
  { id: 'fscCertificate', name: 'FSC-certifikat', nameEn: 'FSC Certificate' },
  { id: 'productionLicense', name: 'Produktionslicens', nameEn: 'Production License' },
  { id: 'manufacturerAuthorisation', name: 'Tillverkar-/Importörsauktorisation', nameEn: 'Manufacturer/Importer Authorisation' },
  
  // Medical & Health
  { id: 'medicalCertificate', name: 'Läkarintyg', nameEn: 'Medical Certificate' },
  
  // Financial
  { id: 'bankStatement', name: 'Kontoutdrag', nameEn: 'Bank Statement' },
  
  // Other
  { id: 'other', name: 'Övrigt', nameEn: 'Other' }
];

// Get document type info by ID
export const getDocumentTypeInfo = (documentTypeId: string) => {
  return PREDEFINED_DOCUMENT_TYPES.find(dt => dt.id === documentTypeId) || null;
};

// Track document type selection for popularity ranking
export const trackDocumentTypeSelection = async (documentTypeId: string, customName?: string): Promise<void> => {
  try {
    if (!db) {
      return;
    }

    const docTypeInfo = getDocumentTypeInfo(documentTypeId);
    const isCustom = !docTypeInfo && !!customName;
    
    // For custom types, use the custom name as the ID (sanitized)
    const docId = isCustom ? `custom_${customName?.toLowerCase().replace(/[^a-z0-9åäö]/g, '_')}` : documentTypeId;
    const popularityRef = doc(db, 'documentTypePopularity', docId);

    const popularityData: DocumentTypePopularity = {
      documentTypeId: docId,
      documentTypeName: docTypeInfo?.name || customName || documentTypeId,
      documentTypeNameEn: docTypeInfo?.nameEn || customName || documentTypeId,
      selectionCount: 1,
      lastSelected: Timestamp.now(),
      isCustom
    };

    const docSnap = await getDoc(popularityRef);
    if (docSnap.exists()) {
      await updateDoc(popularityRef, {
        selectionCount: increment(1),
        lastSelected: Timestamp.now()
      });
    } else {
      await setDoc(popularityRef, popularityData);
    }
  } catch (error) {
    // Don't throw - tracking should not break user flow
  }
};

// Get popular document types sorted by selection count
export const getPopularDocumentTypes = async (maxResults: number = 12): Promise<DocumentTypePopularity[]> => {
  try {
    if (!db) {
      return getStaticPopularDocumentTypes().slice(0, maxResults);
    }

    const q = query(
      collection(db, 'documentTypePopularity'),
      orderBy('selectionCount', 'desc'),
      limit(maxResults * 2)
    );

    const querySnapshot = await getDocs(q);
    const dynamicTypes = querySnapshot.docs.map(doc => doc.data() as DocumentTypePopularity);

    if (dynamicTypes.length >= maxResults) {
      return dynamicTypes.slice(0, maxResults);
    }

    // Merge with static data
    const staticPopular = getStaticPopularDocumentTypes();
    const existingIds = new Set(dynamicTypes.map(dt => dt.documentTypeId));

    const mergedTypes = [...dynamicTypes];
    for (const staticType of staticPopular) {
      if (!existingIds.has(staticType.documentTypeId) && mergedTypes.length < maxResults) {
        mergedTypes.push(staticType);
      }
    }

    return mergedTypes.sort((a, b) => b.selectionCount - a.selectionCount).slice(0, maxResults);

  } catch (error) {
    return getStaticPopularDocumentTypes().slice(0, maxResults);
  }
};

// Static fallback for popular document types
const getStaticPopularDocumentTypes = (): DocumentTypePopularity[] => {
  const popularIds = [
    'birthCertificate',
    'diploma',
    'marriageCertificate',
    'powerOfAttorney',
    'companyRegistration',
    'criminalRecord',
    'employmentCertificate',
    'certificateOfOrigin',
    'passport',
    'medicalCertificate',
    'divorceDecree',
    'commercial'
  ];

  return popularIds.map((id, index) => {
    const info = getDocumentTypeInfo(id);
    return {
      documentTypeId: id,
      documentTypeName: info?.name || id,
      documentTypeNameEn: info?.nameEn || id,
      selectionCount: 100 - index * 5, // Decreasing popularity
      lastSelected: Timestamp.now()
    };
  });
};

// Seed initial document type popularity (admin function)
export const seedDocumentTypePopularity = async (): Promise<{ success: number; failed: number }> => {
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  const typesToSeed = [
    { id: 'birthCertificate', clicks: 150 },
    { id: 'diploma', clicks: 140 },
    { id: 'marriageCertificate', clicks: 120 },
    { id: 'powerOfAttorney', clicks: 110 },
    { id: 'companyRegistration', clicks: 100 },
    { id: 'criminalRecord', clicks: 90 },
    { id: 'employmentCertificate', clicks: 85 },
    { id: 'certificateOfOrigin', clicks: 80 },
    { id: 'passport', clicks: 75 },
    { id: 'medicalCertificate', clicks: 70 },
    { id: 'divorceDecree', clicks: 65 },
    { id: 'commercial', clicks: 60 }
  ];

  let success = 0;
  let failed = 0;

  for (const type of typesToSeed) {
    try {
      const info = getDocumentTypeInfo(type.id);
      if (!info) continue;

      const popularityRef = doc(db, 'documentTypePopularity', type.id);
      const docSnap = await getDoc(popularityRef);

      if (docSnap.exists()) {
        const currentCount = docSnap.data().selectionCount || 0;
        await updateDoc(popularityRef, {
          selectionCount: currentCount + type.clicks,
          lastSelected: Timestamp.now()
        });
      } else {
        await setDoc(popularityRef, {
          documentTypeId: type.id,
          documentTypeName: info.name,
          documentTypeNameEn: info.nameEn,
          selectionCount: type.clicks,
          lastSelected: Timestamp.now(),
          isCustom: false
        });
      }
      success++;
    } catch (error) {
      failed++;
    }
  }

  return { success, failed };
};

// ============================================
// VISA DESTINATION POPULARITY TRACKING
// ============================================

export interface VisaDestinationPopularity {
  countryCode: string;
  countryName: string;
  countryNameEn: string;
  selectionCount: number;
  lastSelected: Timestamp;
}

// Track visa destination selection for popularity ranking
export const trackVisaDestinationSelection = async (countryCode: string, countryName: string, countryNameEn: string): Promise<void> => {
  try {
    if (!db) return;

    const popularityRef = doc(db, 'visaDestinationPopularity', countryCode);
    const docSnap = await getDoc(popularityRef);
    
    if (docSnap.exists()) {
      await updateDoc(popularityRef, {
        selectionCount: increment(1),
        lastSelected: Timestamp.now()
      });
    } else {
      await setDoc(popularityRef, {
        countryCode,
        countryName,
        countryNameEn,
        selectionCount: 1,
        lastSelected: Timestamp.now()
      });
    }
  } catch (error) {
    // Silently fail - tracking should not break user flow
  }
};

// Get popular visa destinations sorted by selection count
export const getPopularVisaDestinations = async (maxResults: number = 15): Promise<VisaDestinationPopularity[]> => {
  // Static fallback list - curated popular destinations
  const staticPopular: VisaDestinationPopularity[] = [
    { countryCode: 'IN', countryName: 'Indien', countryNameEn: 'India', selectionCount: 150, lastSelected: Timestamp.now() },
    { countryCode: 'TR', countryName: 'Turkiet', countryNameEn: 'Turkey', selectionCount: 145, lastSelected: Timestamp.now() },
    { countryCode: 'VN', countryName: 'Vietnam', countryNameEn: 'Vietnam', selectionCount: 140, lastSelected: Timestamp.now() },
    { countryCode: 'EG', countryName: 'Egypten', countryNameEn: 'Egypt', selectionCount: 135, lastSelected: Timestamp.now() },
    { countryCode: 'LK', countryName: 'Sri Lanka', countryNameEn: 'Sri Lanka', selectionCount: 130, lastSelected: Timestamp.now() },
    { countryCode: 'ID', countryName: 'Indonesien', countryNameEn: 'Indonesia', selectionCount: 125, lastSelected: Timestamp.now() },
    { countryCode: 'TH', countryName: 'Thailand', countryNameEn: 'Thailand', selectionCount: 120, lastSelected: Timestamp.now() },
    { countryCode: 'KE', countryName: 'Kenya', countryNameEn: 'Kenya', selectionCount: 115, lastSelected: Timestamp.now() },
    { countryCode: 'TZ', countryName: 'Tanzania', countryNameEn: 'Tanzania', selectionCount: 110, lastSelected: Timestamp.now() },
    { countryCode: 'SA', countryName: 'Saudiarabien', countryNameEn: 'Saudi Arabia', selectionCount: 105, lastSelected: Timestamp.now() },
    { countryCode: 'JP', countryName: 'Japan', countryNameEn: 'Japan', selectionCount: 100, lastSelected: Timestamp.now() },
    { countryCode: 'KR', countryName: 'Sydkorea', countryNameEn: 'South Korea', selectionCount: 95, lastSelected: Timestamp.now() },
    { countryCode: 'CD', countryName: 'Kongo-Kinshasa', countryNameEn: 'DR Congo', selectionCount: 90, lastSelected: Timestamp.now() },
    { countryCode: 'AO', countryName: 'Angola', countryNameEn: 'Angola', selectionCount: 85, lastSelected: Timestamp.now() },
    { countryCode: 'NG', countryName: 'Nigeria', countryNameEn: 'Nigeria', selectionCount: 80, lastSelected: Timestamp.now() },
  ];

  try {
    if (!db) {
      return staticPopular.slice(0, maxResults);
    }

    const q = query(
      collection(db, 'visaDestinationPopularity'),
      orderBy('selectionCount', 'desc'),
      limit(maxResults * 2)
    );

    const querySnapshot = await getDocs(q);
    const dynamicCountries = querySnapshot.docs.map(doc => doc.data() as VisaDestinationPopularity);

    if (dynamicCountries.length >= maxResults) {
      return dynamicCountries.slice(0, maxResults);
    }

    // Merge with static data
    const existingCodes = new Set(dynamicCountries.map(c => c.countryCode));
    const merged = [...dynamicCountries];
    
    for (const staticCountry of staticPopular) {
      if (!existingCodes.has(staticCountry.countryCode) && merged.length < maxResults) {
        merged.push({ ...staticCountry, selectionCount: Math.floor(staticCountry.selectionCount / 10) });
      }
    }

    return merged.sort((a, b) => b.selectionCount - a.selectionCount).slice(0, maxResults);
  } catch (error) {
    return staticPopular.slice(0, maxResults);
  }
};