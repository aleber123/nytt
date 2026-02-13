/**
 * Visa Addon Service
 * 
 * Manages global visa add-on services stored in Firestore.
 * These are add-on services that can be offered alongside visa products,
 * managed from the admin panel and applied based on country/category rules.
 */

import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from './config';

export type AddonCategory = 'registration' | 'photo' | 'document' | 'insurance' | 'other';

export interface VisaAddon {
  id: string;
  name: string;        // Swedish name
  nameEn: string;      // English name
  description: string; // Swedish description
  descriptionEn: string; // English description
  adminNotes: string;  // Internal notes for staff
  icon: string;        // Emoji icon
  price: number;       // Price in SEK (incl. VAT)
  category: AddonCategory;
  perTraveler: boolean; // Charge per traveler or per order
  // Applicability rules
  applicableCountries: string[]; // Country codes, or ["all"] for all countries
  applicableCategories: string[]; // Visa categories, or ["all"] for all
  applicableProductIds: string[]; // Specific product IDs, or ["all"] for all
  // Behavior
  required: boolean;   // If true, auto-selected and cannot be deselected
  enabled: boolean;    // Toggle on/off without deleting
  includedInProduct: boolean; // If true, shown as included info on product card (not a selectable addon)
  sortOrder: number;   // Display order
  // Extra fields the customer must fill in
  requiredFields: AddonRequiredField[];
  // Link to a form template for data collection (if addon needs extra info from customer)
  formTemplateId?: string;
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface AddonRequiredField {
  id: string;
  label: string;      // Swedish label
  labelEn: string;    // English label
  type: 'text' | 'email' | 'phone' | 'date' | 'textarea' | 'select';
  placeholder?: string;
  placeholderEn?: string;
  options?: string[];  // For select type
  required: boolean;
}

const COLLECTION = 'visaAddons';

// Get all addons
export const getAllVisaAddons = async (): Promise<VisaAddon[]> => {
  try {
    const snapshot = await getDocs(
      query(collection(db, COLLECTION), orderBy('sortOrder', 'asc'))
    );
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as VisaAddon));
  } catch (error) {
    // If orderBy fails (no index), fall back to unordered
    const snapshot = await getDocs(collection(db, COLLECTION));
    const addons = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as VisaAddon));
    return addons.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }
};

// Get enabled addons for a specific country + category + product
export const getApplicableAddons = async (
  countryCode: string,
  category: string,
  productId: string
): Promise<VisaAddon[]> => {
  const allAddons = await getAllVisaAddons();
  
  return allAddons.filter(addon => {
    if (!addon.enabled) return false;
    
    // Check country applicability
    const countryMatch = addon.applicableCountries.includes('all') || 
                         addon.applicableCountries.includes(countryCode.toUpperCase());
    if (!countryMatch) return false;
    
    // When 'all' is passed as category/product, skip those filters
    // (caller will do per-product filtering later)
    if (category !== 'all') {
      const categoryMatch = addon.applicableCategories.includes('all') || 
                            addon.applicableCategories.includes(category);
      if (!categoryMatch) return false;
    }
    
    if (productId !== 'all') {
      const productMatch = addon.applicableProductIds.includes('all') || 
                           addon.applicableProductIds.includes(productId);
      if (!productMatch) return false;
    }
    
    return true;
  });
};

// Get a single addon by ID
export const getVisaAddon = async (addonId: string): Promise<VisaAddon | null> => {
  const docRef = doc(db, COLLECTION, addonId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as VisaAddon;
};

// Create or update an addon
export const saveVisaAddon = async (addon: Partial<VisaAddon> & { id?: string }, updatedBy: string): Promise<string> => {
  const now = new Date().toISOString();
  
  if (addon.id) {
    // Update existing
    const docRef = doc(db, COLLECTION, addon.id);
    const { id, ...data } = addon;
    await setDoc(docRef, {
      ...data,
      updatedAt: now,
      updatedBy,
    }, { merge: true });
    return addon.id;
  } else {
    // Create new with auto-generated ID
    const newDocRef = doc(collection(db, COLLECTION));
    const newAddon: Omit<VisaAddon, 'id'> = {
      name: addon.name || '',
      nameEn: addon.nameEn || '',
      description: addon.description || '',
      descriptionEn: addon.descriptionEn || '',
      adminNotes: addon.adminNotes || '',
      icon: addon.icon || '📋',
      price: addon.price || 0,
      category: addon.category || 'other',
      perTraveler: addon.perTraveler ?? true,
      applicableCountries: addon.applicableCountries || ['all'],
      applicableCategories: addon.applicableCategories || ['all'],
      applicableProductIds: addon.applicableProductIds || ['all'],
      required: addon.required ?? false,
      enabled: addon.enabled ?? true,
      includedInProduct: addon.includedInProduct ?? false,
      sortOrder: addon.sortOrder ?? 100,
      requiredFields: addon.requiredFields || [],
      createdAt: now,
      updatedAt: now,
      createdBy: updatedBy,
      updatedBy,
    };
    await setDoc(newDocRef, newAddon);
    return newDocRef.id;
  }
};

// Delete an addon
export const deleteVisaAddon = async (addonId: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION, addonId));
};

// Get addon category labels
export const ADDON_CATEGORY_LABELS: Record<AddonCategory, { label: string; icon: string }> = {
  registration: { label: 'Registration', icon: '📝' },
  photo: { label: 'Photo Services', icon: '📸' },
  document: { label: 'Document Services', icon: '📄' },
  insurance: { label: 'Insurance', icon: '🛡️' },
  other: { label: 'Other', icon: '📋' },
};
