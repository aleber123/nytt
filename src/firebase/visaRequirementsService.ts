/**
 * Visa Requirements Service
 * Manages visa rules per destination country and nationality
 */

import { db } from './config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';

// Visa types available (e-visa vs sticker)
export type VisaType = 'e-visa' | 'sticker' | 'both' | 'not-required' | 'not-supported';

// Visa categories (purpose of travel)
export type VisaCategory = 'tourist' | 'business' | 'transit' | 'student' | 'work' | 'medical' | 'conference';

// Visa product offered for a specific country
export interface VisaProduct {
  id: string; // e.g., 'tourist-single-30', 'business-multiple-90'
  category: VisaCategory;
  name: string; // e.g., 'Tourist Visa 30 days'
  nameEn?: string;
  description?: string;
  descriptionEn?: string;
  visaType: VisaType; // e-visa or sticker
  entryType: 'single' | 'double' | 'multiple';
  validityDays: number; // e.g., 30, 60, 90, 365
  stayDays?: number; // max stay per entry
  price: number; // Total price in SEK (serviceFee + embassyFee)
  serviceFee: number; // DOX service fee in SEK
  embassyFee: number; // Embassy/government fee in SEK
  processingDays: number; // Standard processing time
  expressAvailable?: boolean;
  expressDays?: number;
  expressPrice?: number;
  isActive: boolean;
}

// Nationality-specific rule (overrides default country rule)
export interface NationalityRule {
  nationalityCode: string; // e.g., 'SE' for Swedish
  nationalityName: string;
  visaType: VisaType;
  availableProducts?: string[]; // IDs of available visa products for this nationality
  processingTime?: number; // days
  price?: number; // override price for this nationality
  notes?: string;
}

// Main visa requirement for a destination country
export interface VisaRequirement {
  id: string;
  countryCode: string; // Destination country code
  countryName: string; // Destination country name
  countryNameEn?: string; // English name
  
  // Default visa type (applies when no nationality-specific rule exists)
  defaultVisaType: VisaType;
  
  // Whether we can help with visas for this country
  isSupported: boolean;
  
  // Nationality-specific rules (overrides default)
  nationalityRules: NationalityRule[];
  
  // Available visa products for this country
  visaProducts: VisaProduct[];
  
  // Pricing (legacy - use visaProducts instead)
  eVisaPrice?: number; // Price for e-visa service
  stickerVisaPrice?: number; // Price for sticker visa service
  serviceFee: number; // Our handling fee
  
  // Processing times
  eVisaProcessingDays?: number;
  stickerVisaProcessingDays?: number;
  
  // Additional info
  notes?: string;
  requirements?: string; // What documents are needed
  embassyUrl?: string; // Link to embassy website
  
  // Metadata
  lastUpdated: Timestamp;
  updatedBy: string;
  isActive: boolean;
}

// Get all visa requirements
export const getAllVisaRequirements = async (): Promise<VisaRequirement[]> => {
  try {
    if (!db) {
      console.warn('Firebase not initialized');
      return [];
    }

    const requirementsRef = collection(db, 'visaRequirements');
    const q = query(requirementsRef, orderBy('countryName', 'asc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as VisaRequirement));
  } catch (error) {
    console.error('Error fetching visa requirements:', error);
    return [];
  }
};

// Get active visa requirements only
export const getActiveVisaRequirements = async (): Promise<VisaRequirement[]> => {
  try {
    if (!db) {
      return [];
    }

    const requirementsRef = collection(db, 'visaRequirements');
    const q = query(
      requirementsRef,
      where('isActive', '==', true),
      orderBy('countryName', 'asc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as VisaRequirement));
  } catch (error) {
    console.error('Error fetching active visa requirements:', error);
    return [];
  }
};

// Get visa requirement for a specific country
export const getVisaRequirement = async (countryCode: string): Promise<VisaRequirement | null> => {
  try {
    if (!db) {
      return null;
    }

    const docRef = doc(db, 'visaRequirements', countryCode);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as VisaRequirement;
    }

    return null;
  } catch (error) {
    console.error('Error fetching visa requirement:', error);
    return null;
  }
};

// Get visa type for a specific destination + nationality combination
export const getVisaTypeForNationality = async (
  destinationCode: string,
  nationalityCode: string
): Promise<{ visaType: VisaType; isSupported: boolean; requirement: VisaRequirement | null }> => {
  try {
    const requirement = await getVisaRequirement(destinationCode);

    if (!requirement) {
      return { visaType: 'not-supported', isSupported: false, requirement: null };
    }

    if (!requirement.isSupported || !requirement.isActive) {
      return { visaType: 'not-supported', isSupported: false, requirement };
    }

    // Check for nationality-specific rule
    const nationalityRule = requirement.nationalityRules?.find(
      rule => rule.nationalityCode === nationalityCode
    );

    if (nationalityRule) {
      return {
        visaType: nationalityRule.visaType,
        isSupported: nationalityRule.visaType !== 'not-supported',
        requirement
      };
    }

    // Return default visa type
    return {
      visaType: requirement.defaultVisaType,
      isSupported: requirement.defaultVisaType !== 'not-supported',
      requirement
    };
  } catch (error) {
    console.error('Error getting visa type for nationality:', error);
    return { visaType: 'not-supported', isSupported: false, requirement: null };
  }
};

// Get available visa products for a destination + nationality combination
export const getAvailableVisaProducts = async (
  destinationCode: string,
  nationalityCode: string
): Promise<{ products: VisaProduct[]; visaType: VisaType; isSupported: boolean }> => {
  try {
    const requirement = await getVisaRequirement(destinationCode);

    if (!requirement || !requirement.isSupported || !requirement.isActive) {
      return { products: [], visaType: 'not-supported', isSupported: false };
    }

    // Check for nationality-specific rule
    const nationalityRule = requirement.nationalityRules?.find(
      rule => rule.nationalityCode === nationalityCode
    );

    const visaType = nationalityRule?.visaType || requirement.defaultVisaType;
    
    if (visaType === 'not-supported' || visaType === 'not-required') {
      return { products: [], visaType, isSupported: visaType === 'not-required' };
    }

    // Get active products
    let products = (requirement.visaProducts || []).filter(p => p.isActive);

    // If nationality has specific available products, filter by those
    if (nationalityRule?.availableProducts && nationalityRule.availableProducts.length > 0) {
      products = products.filter(p => nationalityRule.availableProducts!.includes(p.id));
    }

    // If visa type is e-visa only, filter out sticker products
    if (visaType === 'e-visa') {
      products = products.filter(p => p.visaType === 'e-visa');
    } else if (visaType === 'sticker') {
      products = products.filter(p => p.visaType === 'sticker');
    }
    // If 'both', show all products

    return { products, visaType, isSupported: true };
  } catch (error) {
    return { products: [], visaType: 'not-supported', isSupported: false };
  }
};

// Create or update a visa requirement
export const setVisaRequirement = async (
  requirement: Omit<VisaRequirement, 'id' | 'lastUpdated'>
): Promise<string> => {
  try {
    if (!db) {
      throw new Error('Firebase not available');
    }

    const docRef = doc(db, 'visaRequirements', requirement.countryCode);

    // Remove undefined values to avoid Firestore error
    const cleanData: Record<string, any> = {
      id: requirement.countryCode,
      countryCode: requirement.countryCode,
      countryName: requirement.countryName,
      defaultVisaType: requirement.defaultVisaType,
      isSupported: requirement.isSupported,
      nationalityRules: requirement.nationalityRules || [],
      visaProducts: requirement.visaProducts || [],
      serviceFee: requirement.serviceFee,
      updatedBy: requirement.updatedBy,
      isActive: requirement.isActive,
      lastUpdated: Timestamp.now()
    };

    // Only add optional fields if they have values
    if (requirement.countryNameEn) cleanData.countryNameEn = requirement.countryNameEn;
    if (requirement.eVisaPrice !== undefined && requirement.eVisaPrice !== null) {
      cleanData.eVisaPrice = requirement.eVisaPrice;
    }
    if (requirement.stickerVisaPrice !== undefined && requirement.stickerVisaPrice !== null) {
      cleanData.stickerVisaPrice = requirement.stickerVisaPrice;
    }
    if (requirement.eVisaProcessingDays) cleanData.eVisaProcessingDays = requirement.eVisaProcessingDays;
    if (requirement.stickerVisaProcessingDays) cleanData.stickerVisaProcessingDays = requirement.stickerVisaProcessingDays;
    if (requirement.notes) cleanData.notes = requirement.notes;
    if (requirement.requirements) cleanData.requirements = requirement.requirements;
    if (requirement.embassyUrl) cleanData.embassyUrl = requirement.embassyUrl;

    await setDoc(docRef, cleanData);
    return requirement.countryCode;
  } catch (error) {
    console.error('Error setting visa requirement:', error);
    throw error;
  }
};

// Update an existing visa requirement
export const updateVisaRequirement = async (
  countryCode: string,
  updates: Partial<Omit<VisaRequirement, 'id' | 'countryCode'>>
): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Firebase not available');
    }

    const docRef = doc(db, 'visaRequirements', countryCode);

    // Remove undefined values to avoid Firestore error
    const cleanUpdates: Record<string, any> = {
      lastUpdated: Timestamp.now()
    };

    // Only add fields that have defined values
    if (updates.countryName !== undefined) cleanUpdates.countryName = updates.countryName;
    if (updates.countryNameEn !== undefined) cleanUpdates.countryNameEn = updates.countryNameEn;
    if (updates.defaultVisaType !== undefined) cleanUpdates.defaultVisaType = updates.defaultVisaType;
    if (updates.isSupported !== undefined) cleanUpdates.isSupported = updates.isSupported;
    if (updates.nationalityRules !== undefined) cleanUpdates.nationalityRules = updates.nationalityRules;
    if (updates.visaProducts !== undefined) cleanUpdates.visaProducts = updates.visaProducts;
    if (updates.serviceFee !== undefined) cleanUpdates.serviceFee = updates.serviceFee;
    if (updates.updatedBy !== undefined) cleanUpdates.updatedBy = updates.updatedBy;
    if (updates.isActive !== undefined) cleanUpdates.isActive = updates.isActive;
    if (updates.notes !== undefined) cleanUpdates.notes = updates.notes;
    if (updates.requirements !== undefined) cleanUpdates.requirements = updates.requirements;
    if (updates.embassyUrl !== undefined) cleanUpdates.embassyUrl = updates.embassyUrl;
    
    // Handle optional numeric fields - use deleteField() for empty values or include if set
    if (updates.eVisaPrice !== undefined && updates.eVisaPrice !== null) {
      cleanUpdates.eVisaPrice = updates.eVisaPrice;
    }
    if (updates.stickerVisaPrice !== undefined && updates.stickerVisaPrice !== null) {
      cleanUpdates.stickerVisaPrice = updates.stickerVisaPrice;
    }
    if (updates.eVisaProcessingDays !== undefined && updates.eVisaProcessingDays !== null) {
      cleanUpdates.eVisaProcessingDays = updates.eVisaProcessingDays;
    }
    if (updates.stickerVisaProcessingDays !== undefined && updates.stickerVisaProcessingDays !== null) {
      cleanUpdates.stickerVisaProcessingDays = updates.stickerVisaProcessingDays;
    }

    await updateDoc(docRef, cleanUpdates);
  } catch (error) {
    console.error('Error updating visa requirement:', error);
    throw error;
  }
};

// Delete a visa requirement
export const deleteVisaRequirement = async (countryCode: string): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Firebase not available');
    }

    const docRef = doc(db, 'visaRequirements', countryCode);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting visa requirement:', error);
    throw error;
  }
};

// Add or update a nationality rule for a country
export const setNationalityRule = async (
  countryCode: string,
  rule: NationalityRule,
  updatedBy: string
): Promise<void> => {
  try {
    const requirement = await getVisaRequirement(countryCode);

    if (!requirement) {
      throw new Error('Visa requirement not found for country: ' + countryCode);
    }

    // Find existing rule or add new one
    const existingRules = requirement.nationalityRules || [];
    const existingIndex = existingRules.findIndex(
      r => r.nationalityCode === rule.nationalityCode
    );

    let updatedRules: NationalityRule[];
    if (existingIndex >= 0) {
      updatedRules = [...existingRules];
      updatedRules[existingIndex] = rule;
    } else {
      updatedRules = [...existingRules, rule];
    }

    await updateVisaRequirement(countryCode, {
      nationalityRules: updatedRules,
      updatedBy
    });
  } catch (error) {
    console.error('Error setting nationality rule:', error);
    throw error;
  }
};

// Remove a nationality rule
export const removeNationalityRule = async (
  countryCode: string,
  nationalityCode: string,
  updatedBy: string
): Promise<void> => {
  try {
    const requirement = await getVisaRequirement(countryCode);

    if (!requirement) {
      throw new Error('Visa requirement not found');
    }

    const updatedRules = (requirement.nationalityRules || []).filter(
      r => r.nationalityCode !== nationalityCode
    );

    await updateVisaRequirement(countryCode, {
      nationalityRules: updatedRules,
      updatedBy
    });
  } catch (error) {
    console.error('Error removing nationality rule:', error);
    throw error;
  }
};
