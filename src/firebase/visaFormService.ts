/**
 * Visa Form Service
 * 
 * Manages dynamic visa application forms:
 * - Form templates per country/visa type (configurable from admin)
 * - Form submissions (token-based, customer fills in via email link)
 * - Data stored on order for use in visa application automation
 */

import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, where, orderBy, addDoc } from 'firebase/firestore';
import { db } from './config';

// ============================================================
// FORM FIELD DEFINITIONS
// ============================================================

export type FormFieldType = 'text' | 'email' | 'phone' | 'date' | 'textarea' | 'select' | 'file' | 'photo' | 'checkbox' | 'personnummer';

export interface FormField {
  id: string;
  label: string;       // Swedish
  labelEn: string;     // English
  type: FormFieldType;
  placeholder?: string;
  placeholderEn?: string;
  helpText?: string;    // Swedish help text
  helpTextEn?: string;
  required: boolean;
  options?: { value: string; label: string; labelEn: string }[]; // For select type
  validation?: string;  // Regex pattern
  group: string;        // Group name for visual grouping (e.g., "personal", "passport", "travel")
  perTraveler: boolean; // If true, collect per traveler; if false, once per order
  sortOrder: number;
  // Pre-fill mapping: which order field to use as default value
  prefillFrom?: string; // e.g., "customerInfo.email", "travelers[i].firstName", "departureDate"
}

export interface FormFieldGroup {
  id: string;
  label: string;
  labelEn: string;
  icon: string;
  sortOrder: number;
}

// ============================================================
// FORM TEMPLATES
// ============================================================

export interface VisaFormTemplate {
  id: string;
  name: string;        // e.g., "India Business e-Visa"
  nameEn: string;
  // Matching rules
  countryCode: string;  // e.g., "IN" or "all"
  visaCategory: string; // e.g., "business" or "all"
  visaProductId: string; // specific product or "all"
  // Form structure
  groups: FormFieldGroup[];
  fields: FormField[];
  // Metadata
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

// ============================================================
// FORM SUBMISSIONS (token-based)
// ============================================================

export interface VisaFormSubmission {
  id: string;
  token: string;
  orderId: string;
  orderNumber: string;
  templateId: string;
  // Customer info
  customerEmail: string;
  customerName: string;
  // Status
  status: 'pending' | 'partial' | 'completed';
  sentAt: string;
  completedAt?: string;
  // Submitted data
  formData: Record<string, any>; // field.id -> value (or traveler_0.field.id -> value)
  // Metadata
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// PREDEFINED FIELD GROUPS
// ============================================================

export const DEFAULT_FIELD_GROUPS: FormFieldGroup[] = [
  { id: 'personal', label: 'Personuppgifter', labelEn: 'Personal Information', icon: '👤', sortOrder: 1 },
  { id: 'passport', label: 'Passinformation', labelEn: 'Passport Information', icon: '📘', sortOrder: 2 },
  { id: 'travel', label: 'Reseinformation', labelEn: 'Travel Information', icon: '✈️', sortOrder: 3 },
  { id: 'employment', label: 'Arbetsgivare', labelEn: 'Employment', icon: '💼', sortOrder: 4 },
  { id: 'accommodation', label: 'Boende', labelEn: 'Accommodation', icon: '🏨', sortOrder: 5 },
  { id: 'address', label: 'Adress', labelEn: 'Address', icon: '🏠', sortOrder: 3.5 },
  { id: 'reference', label: 'Referensperson', labelEn: 'Reference Person', icon: '📋', sortOrder: 6 },
  { id: 'documents', label: 'Dokument & Foto', labelEn: 'Documents & Photo', icon: '📎', sortOrder: 7 },
  { id: 'other', label: 'Övrigt', labelEn: 'Other', icon: '📝', sortOrder: 8 },
];

// ============================================================
// PREDEFINED COMMON FIELDS (reusable building blocks)
// ============================================================

export const COMMON_FIELDS: Record<string, Omit<FormField, 'sortOrder'>> = {
  // Personal
  personnummer: {
    id: 'personnummer', label: 'Personnummer', labelEn: 'Personal ID Number',
    type: 'personnummer', placeholder: 'ÅÅÅÅMMDD-NNNN', placeholderEn: 'YYYYMMDD-NNNN',
    required: true, group: 'personal', perTraveler: true,
    helpText: 'Svenskt personnummer i formatet ÅÅÅÅMMDD-NNNN',
    helpTextEn: 'Swedish personal ID number in format YYYYMMDD-NNNN',
  },
  dateOfBirth: {
    id: 'dateOfBirth', label: 'Födelsedatum', labelEn: 'Date of Birth',
    type: 'date', required: true, group: 'personal', perTraveler: true,
  },
  placeOfBirth: {
    id: 'placeOfBirth', label: 'Födelseort', labelEn: 'Place of Birth',
    type: 'text', required: true, group: 'personal', perTraveler: true,
  },
  countryOfBirth: {
    id: 'countryOfBirth', label: 'Födelseland', labelEn: 'Country of Birth',
    type: 'text', required: true, group: 'personal', perTraveler: true,
  },
  gender: {
    id: 'gender', label: 'Kön', labelEn: 'Gender',
    type: 'select', required: true, group: 'personal', perTraveler: true,
    options: [
      { value: 'male', label: 'Man', labelEn: 'Male' },
      { value: 'female', label: 'Kvinna', labelEn: 'Female' },
      { value: 'other', label: 'Annat', labelEn: 'Other' },
    ],
  },
  maritalStatus: {
    id: 'maritalStatus', label: 'Civilstånd', labelEn: 'Marital Status',
    type: 'select', required: false, group: 'personal', perTraveler: true,
    options: [
      { value: 'single', label: 'Ogift', labelEn: 'Single' },
      { value: 'married', label: 'Gift', labelEn: 'Married' },
      { value: 'divorced', label: 'Skild', labelEn: 'Divorced' },
      { value: 'widowed', label: 'Änka/Änkling', labelEn: 'Widowed' },
    ],
  },
  fatherName: {
    id: 'fatherName', label: 'Faderns fullständiga namn', labelEn: "Father's Full Name",
    type: 'text', required: false, group: 'personal', perTraveler: true,
  },
  motherName: {
    id: 'motherName', label: 'Moderns fullständiga namn', labelEn: "Mother's Full Name",
    type: 'text', required: false, group: 'personal', perTraveler: true,
  },

  // Passport
  passportNumber: {
    id: 'passportNumber', label: 'Passnummer', labelEn: 'Passport Number',
    type: 'text', required: true, group: 'passport', perTraveler: true,
    prefillFrom: 'travelers[i].passportNumber',
  },
  passportIssueDate: {
    id: 'passportIssueDate', label: 'Utfärdandedatum', labelEn: 'Passport Issue Date',
    type: 'date', required: true, group: 'passport', perTraveler: true,
  },
  passportExpiryDate: {
    id: 'passportExpiryDate', label: 'Giltighetstid', labelEn: 'Passport Expiry Date',
    type: 'date', required: true, group: 'passport', perTraveler: true,
  },
  passportIssuingCountry: {
    id: 'passportIssuingCountry', label: 'Utfärdandeland', labelEn: 'Passport Issuing Country',
    type: 'text', required: true, group: 'passport', perTraveler: true,
  },
  passportIssuingAuthority: {
    id: 'passportIssuingAuthority', label: 'Utfärdande myndighet', labelEn: 'Issuing Authority',
    type: 'text', required: false, group: 'passport', perTraveler: true,
  },

  // Travel
  cityInCountry: {
    id: 'cityInCountry', label: 'Ort i destinationslandet', labelEn: 'City in Destination Country',
    type: 'text', required: false, group: 'travel', perTraveler: false,
  },
  hotelName: {
    id: 'hotelName', label: 'Hotellnamn', labelEn: 'Hotel Name',
    type: 'text', required: false, group: 'accommodation', perTraveler: false,
  },
  hotelAddress: {
    id: 'hotelAddress', label: 'Hotelladress', labelEn: 'Hotel Address',
    type: 'text', required: false, group: 'accommodation', perTraveler: false,
  },
  hotelCity: {
    id: 'hotelCity', label: 'Hotellstad', labelEn: 'Hotel City',
    type: 'text', required: false, group: 'accommodation', perTraveler: false,
  },
  flightNumber: {
    id: 'flightNumber', label: 'Flygnummer', labelEn: 'Flight Number',
    type: 'text', required: false, group: 'travel', perTraveler: false,
  },
  portOfArrival: {
    id: 'portOfArrival', label: 'Ankomstort/flygplats', labelEn: 'Port of Arrival',
    type: 'text', required: false, group: 'travel', perTraveler: false,
  },
  countriesVisited: {
    id: 'countriesVisited', label: 'Länder besökta senaste 10 åren', labelEn: 'Countries Visited in Last 10 Years',
    type: 'text', required: false, group: 'travel', perTraveler: true,
    helpText: 'Klicka för att välja länder från listan',
    helpTextEn: 'Click to select countries from the list',
  },
  previousVisits: {
    id: 'previousVisits', label: 'Tidigare besök i landet', labelEn: 'Previous Visits to Country',
    type: 'textarea', required: false, group: 'travel', perTraveler: true,
    helpText: 'Ange datum och syfte för tidigare besök',
    helpTextEn: 'Enter dates and purpose of previous visits',
  },

  // Employment
  employerName: {
    id: 'employerName', label: 'Arbetsgivare', labelEn: 'Employer Name',
    type: 'text', required: false, group: 'employment', perTraveler: true,
  },
  employerAddress: {
    id: 'employerAddress', label: 'Arbetsgivarens adress', labelEn: 'Employer Address',
    type: 'text', required: false, group: 'employment', perTraveler: true,
  },
  jobTitle: {
    id: 'jobTitle', label: 'Befattning', labelEn: 'Job Title',
    type: 'text', required: false, group: 'employment', perTraveler: true,
  },
  employerPhone: {
    id: 'employerPhone', label: 'Arbetsgivarens telefon', labelEn: 'Employer Phone',
    type: 'phone', required: false, group: 'employment', perTraveler: true,
  },

  // Reference
  referenceName: {
    id: 'referenceName', label: 'Referensperson i destinationslandet', labelEn: 'Reference Person in Destination',
    type: 'text', required: false, group: 'reference', perTraveler: false,
  },
  referenceAddress: {
    id: 'referenceAddress', label: 'Referenspersonens adress', labelEn: 'Reference Address',
    type: 'text', required: false, group: 'reference', perTraveler: false,
  },
  referencePhone: {
    id: 'referencePhone', label: 'Referenspersonens telefon', labelEn: 'Reference Phone',
    type: 'phone', required: false, group: 'reference', perTraveler: false,
  },
  referenceRelation: {
    id: 'referenceRelation', label: 'Relation till referensperson', labelEn: 'Relationship to Reference',
    type: 'text', required: false, group: 'reference', perTraveler: false,
  },

  // Address
  streetAddress: {
    id: 'streetAddress', label: 'Gatuadress', labelEn: 'Street Address',
    type: 'text', required: true, group: 'address', perTraveler: true,
    helpText: 'Börja skriva för att söka din adress',
    helpTextEn: 'Start typing to search your address',
  },
  city: {
    id: 'city', label: 'Stad', labelEn: 'City',
    type: 'text', required: true, group: 'address', perTraveler: true,
  },
  region: {
    id: 'region', label: 'Län / Region', labelEn: 'State / Region',
    type: 'text', required: false, group: 'address', perTraveler: true,
  },
  postalCode: {
    id: 'postalCode', label: 'Postnummer', labelEn: 'Postal Code',
    type: 'text', required: true, group: 'address', perTraveler: true,
  },
  phone: {
    id: 'phone', label: 'Telefonnummer', labelEn: 'Phone Number',
    type: 'phone', required: true, group: 'address', perTraveler: true,
  },

  // Documents
  passportPhoto: {
    id: 'passportPhoto', label: 'Passfoto (biometriskt)', labelEn: 'Passport Photo (biometric)',
    type: 'photo', required: false, group: 'documents', perTraveler: true,
    helpText: 'Vit bakgrund, 35x45mm, max 6 månader gammalt',
    helpTextEn: 'White background, 35x45mm, max 6 months old',
  },
  passportScan: {
    id: 'passportScan', label: 'Kopia av pass (förstasidan)', labelEn: 'Passport Copy (first page)',
    type: 'file', required: false, group: 'documents', perTraveler: true,
  },
  invitationLetter: {
    id: 'invitationLetter', label: 'Inbjudningsbrev', labelEn: 'Invitation Letter',
    type: 'file', required: false, group: 'documents', perTraveler: false,
  },
};

// ============================================================
// FIRESTORE OPERATIONS
// ============================================================

const TEMPLATES_COLLECTION = 'visaFormTemplates';
const SUBMISSIONS_COLLECTION = 'visaFormSubmissions';

// --- Templates ---

export const getAllFormTemplates = async (): Promise<VisaFormTemplate[]> => {
  try {
    const snapshot = await getDocs(collection(db, TEMPLATES_COLLECTION));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as VisaFormTemplate));
  } catch {
    return [];
  }
};

export const getFormTemplate = async (templateId: string): Promise<VisaFormTemplate | null> => {
  const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as VisaFormTemplate;
};

export const getTemplateForProduct = async (
  countryCode: string,
  visaCategory: string,
  productId: string
): Promise<VisaFormTemplate | null> => {
  const templates = await getAllFormTemplates();
  
  // Find best match: specific product > specific category > specific country > all
  const matches = templates.filter(t => {
    if (!t.enabled) return false;
    const countryMatch = t.countryCode === 'all' || t.countryCode === countryCode.toUpperCase();
    const categoryMatch = t.visaCategory === 'all' || t.visaCategory === visaCategory;
    const productMatch = t.visaProductId === 'all' || t.visaProductId === productId;
    return countryMatch && categoryMatch && productMatch;
  });

  if (matches.length === 0) return null;

  // Score matches: more specific = higher score
  const scored = matches.map(t => {
    let score = 0;
    if (t.visaProductId !== 'all') score += 4;
    if (t.visaCategory !== 'all') score += 2;
    if (t.countryCode !== 'all') score += 1;
    return { template: t, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].template;
};

export const saveFormTemplate = async (template: Partial<VisaFormTemplate> & { id?: string }, updatedBy: string): Promise<string> => {
  const now = new Date().toISOString();
  
  if (template.id) {
    const docRef = doc(db, TEMPLATES_COLLECTION, template.id);
    const { id, ...data } = template;
    await setDoc(docRef, { ...data, updatedAt: now, updatedBy }, { merge: true });
    return template.id;
  } else {
    const newDocRef = doc(collection(db, TEMPLATES_COLLECTION));
    await setDoc(newDocRef, {
      ...template,
      createdAt: now,
      updatedAt: now,
      updatedBy,
    });
    return newDocRef.id;
  }
};

export const deleteFormTemplate = async (templateId: string): Promise<void> => {
  await deleteDoc(doc(db, TEMPLATES_COLLECTION, templateId));
};

// --- Submissions ---

export const createFormSubmission = async (data: {
  orderId: string;
  orderNumber: string;
  templateId: string;
  customerEmail: string;
  customerName: string;
  prefillData?: Record<string, string>;
}): Promise<{ id: string; token: string }> => {
  const token = generateToken();
  const now = new Date().toISOString();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

  const submission: Omit<VisaFormSubmission, 'id'> = {
    token,
    orderId: data.orderId,
    orderNumber: data.orderNumber,
    templateId: data.templateId,
    customerEmail: data.customerEmail,
    customerName: data.customerName,
    status: 'pending',
    sentAt: now,
    formData: data.prefillData || {},
    expiresAt: expiresAt.toISOString(),
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, SUBMISSIONS_COLLECTION), submission);
  return { id: docRef.id, token };
};

export const getFormSubmissionByToken = async (token: string): Promise<VisaFormSubmission | null> => {
  const q = query(collection(db, SUBMISSIONS_COLLECTION), where('token', '==', token));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as VisaFormSubmission;
};

export const updateFormSubmission = async (submissionId: string, updates: Partial<VisaFormSubmission>): Promise<void> => {
  const docRef = doc(db, SUBMISSIONS_COLLECTION, submissionId);
  await setDoc(docRef, { ...updates, updatedAt: new Date().toISOString() }, { merge: true });
};

export const getFormSubmissionsForOrder = async (orderId: string): Promise<VisaFormSubmission[]> => {
  const q = query(collection(db, SUBMISSIONS_COLLECTION), where('orderId', '==', orderId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as VisaFormSubmission));
};

// ============================================================
// HELPERS
// ============================================================

function generateToken(): string {
  // Generate a URL-safe random token
  const bytes = new Uint8Array(24);
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    // Fallback for Node.js
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Pre-fill form data from order data
 */
export function prefillFormData(
  fields: FormField[],
  order: any,
  travelerIndex: number
): Record<string, string> {
  const data: Record<string, string> = {};
  
  for (const field of fields) {
    if (!field.prefillFrom) continue;
    
    let value = '';
    const path = field.prefillFrom.replace('[i]', `[${travelerIndex}]`);
    
    try {
      // Simple dot-notation resolver
      const parts = path.split('.');
      let obj: any = order;
      for (const part of parts) {
        const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
        if (arrayMatch) {
          obj = obj?.[arrayMatch[1]]?.[parseInt(arrayMatch[2])];
        } else {
          obj = obj?.[part];
        }
      }
      if (obj !== undefined && obj !== null) {
        value = String(obj);
      }
    } catch {
      // Ignore prefill errors
    }
    
    if (value) {
      const key = field.perTraveler ? `traveler_${travelerIndex}.${field.id}` : field.id;
      data[key] = value;
    }
  }
  
  return data;
}
