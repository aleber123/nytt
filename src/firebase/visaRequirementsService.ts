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

// Document requirement types
export type DocumentType = 'passport' | 'photo' | 'form' | 'financial' | 'invitation' | 'insurance' | 'itinerary' | 'accommodation' | 'employment' | 'other';

// Single document requirement
export interface DocumentRequirement {
  id: string;
  type: DocumentType;
  name: string;           // Swedish name
  nameEn: string;         // English name
  description: string;    // Swedish description
  descriptionEn: string;  // English description
  required: boolean;      // Is this mandatory?
  uploadable: boolean;    // Can customer upload this?
  templateUrl?: string;   // Link to downloadable template/form
  order: number;          // Display order
  isActive: boolean;
}

// Visa categories (purpose of travel)
export type VisaCategory = 'tourist' | 'business' | 'transit' | 'student' | 'work' | 'medical' | 'conference' | 'non-immigrant';

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
  expressPrice?: number; // Total express price (for backwards compatibility)
  expressEmbassyFee?: number; // Embassy express fee (0% VAT)
  expressDoxFee?: number; // DOX express service fee (25% VAT)
  urgentAvailable?: boolean;
  urgentDays?: number;
  urgentPrice?: number; // Total urgent price (for backwards compatibility)
  urgentEmbassyFee?: number; // Embassy urgent fee (0% VAT)
  urgentDoxFee?: number; // DOX urgent service fee (25% VAT)
  isActive: boolean;
  // Document requirements specific to this visa product
  documentRequirements?: DocumentRequirement[];
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

// Get document requirements for a specific visa product
export const getDocumentRequirementsForProduct = async (
  countryCode: string,
  productId: string
): Promise<DocumentRequirement[]> => {
  try {
    const requirement = await getVisaRequirement(countryCode);
    if (!requirement) return [];

    const product = requirement.visaProducts?.find(p => p.id === productId);
    if (!product || !product.documentRequirements) return [];

    return product.documentRequirements
      .filter(doc => doc.isActive)
      .sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('Error getting document requirements:', error);
    return [];
  }
};

// Update document requirements for a visa product
export const updateProductDocumentRequirements = async (
  countryCode: string,
  productId: string,
  documentRequirements: DocumentRequirement[],
  updatedBy: string
): Promise<void> => {
  try {
    const requirement = await getVisaRequirement(countryCode);
    if (!requirement) {
      throw new Error('Visa requirement not found for country: ' + countryCode);
    }

    const products = requirement.visaProducts || [];
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
      throw new Error('Visa product not found: ' + productId);
    }

    // Update the product's document requirements
    products[productIndex] = {
      ...products[productIndex],
      documentRequirements
    };

    await updateVisaRequirement(countryCode, {
      visaProducts: products,
      updatedBy
    });
  } catch (error) {
    console.error('Error updating document requirements:', error);
    throw error;
  }
};

// Default document requirements templates for common visa types
export const getDefaultDocumentRequirements = (visaCategory: VisaCategory): DocumentRequirement[] => {
  const baseRequirements: DocumentRequirement[] = [
    {
      id: 'passport',
      type: 'passport',
      name: 'Pass',
      nameEn: 'Passport',
      description: 'Giltigt i minst 6 månader efter planerad hemresa. Minst 2 tomma sidor.',
      descriptionEn: 'Valid for at least 6 months after planned return. At least 2 blank pages.',
      required: true,
      uploadable: false,
      order: 1,
      isActive: true
    },
    {
      id: 'photo',
      type: 'photo',
      name: 'Passfoto',
      nameEn: 'Passport Photo',
      description: '2 st passfoto (35x45mm, vit bakgrund, tagna inom 6 månader)',
      descriptionEn: '2 passport photos (35x45mm, white background, taken within 6 months)',
      required: true,
      uploadable: true,
      order: 2,
      isActive: true
    },
    {
      id: 'application_form',
      type: 'form',
      name: 'Ansökningsformulär',
      nameEn: 'Application Form',
      description: 'Ifyllt och undertecknat ansökningsformulär',
      descriptionEn: 'Completed and signed application form',
      required: true,
      uploadable: false,
      order: 3,
      isActive: true
    }
  ];

  // Add category-specific requirements
  if (visaCategory === 'business') {
    baseRequirements.push(
      {
        id: 'invitation_letter',
        type: 'invitation',
        name: 'Inbjudningsbrev',
        nameEn: 'Invitation Letter',
        description: 'Officiellt inbjudningsbrev från företag/organisation i destinationslandet',
        descriptionEn: 'Official invitation letter from company/organization in destination country',
        required: true,
        uploadable: true,
        order: 4,
        isActive: true
      },
      {
        id: 'employment_letter',
        type: 'employment',
        name: 'Anställningsintyg',
        nameEn: 'Employment Letter',
        description: 'Intyg från arbetsgivare med uppgifter om anställning och resans syfte',
        descriptionEn: 'Letter from employer with employment details and purpose of trip',
        required: true,
        uploadable: true,
        order: 5,
        isActive: true
      }
    );
  } else if (visaCategory === 'tourist') {
    baseRequirements.push(
      {
        id: 'itinerary',
        type: 'itinerary',
        name: 'Resplan',
        nameEn: 'Travel Itinerary',
        description: 'Flygbokningar eller resplan (tur och retur)',
        descriptionEn: 'Flight bookings or travel itinerary (round trip)',
        required: true,
        uploadable: true,
        order: 4,
        isActive: true
      },
      {
        id: 'accommodation',
        type: 'accommodation',
        name: 'Hotellbokning',
        nameEn: 'Hotel Booking',
        description: 'Hotellbokning eller inbjudan från värd i destinationslandet',
        descriptionEn: 'Hotel booking or invitation from host in destination country',
        required: true,
        uploadable: true,
        order: 5,
        isActive: true
      }
    );
  }

  // Common additional requirements
  baseRequirements.push(
    {
      id: 'bank_statement',
      type: 'financial',
      name: 'Kontoutdrag',
      nameEn: 'Bank Statement',
      description: 'Kontoutdrag från de senaste 3 månaderna som visar tillräckliga medel',
      descriptionEn: 'Bank statement from the last 3 months showing sufficient funds',
      required: true,
      uploadable: true,
      order: 6,
      isActive: true
    },
    {
      id: 'travel_insurance',
      type: 'insurance',
      name: 'Reseförsäkring',
      nameEn: 'Travel Insurance',
      description: 'Reseförsäkring som täcker hela vistelsen (minst 30 000 EUR)',
      descriptionEn: 'Travel insurance covering the entire stay (minimum 30,000 EUR)',
      required: false,
      uploadable: true,
      order: 7,
      isActive: true
    }
  );

  return baseRequirements;
};
