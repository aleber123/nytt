/**
 * Types for the visa order flow
 * Extended from OrderAnswers to reuse existing components
 */

import type { OrderAnswers } from '../types';
import type { VisaProduct, VisaCategory } from '@/firebase/visaRequirementsService';

// Add-on service that can be offered alongside a visa product
export interface VisaAddOnService {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  price: number; // Price in SEK
  icon: string; // Emoji icon
  // Which product categories/IDs this add-on applies to
  applicableCategories?: VisaCategory[];
  applicableProductIds?: string[];
  required?: boolean; // If true, auto-selected and cannot be deselected
}

// Selected visa product info stored in answers
export interface SelectedVisaProduct {
  id: string;
  name: string;
  nameEn?: string;
  category: VisaCategory;
  visaType: 'e-visa' | 'sticker';
  entryType: 'single' | 'double' | 'multiple';
  validityDays: number;
  price: number; // Total price (serviceFee + embassyFee)
  serviceFee?: number; // DOX service fee
  embassyFee?: number; // Embassy/government fee
  processingDays: number;
  expressAvailable?: boolean;
  expressDays?: number;
  expressPrice?: number;
  expressEmbassyFee?: number;
  expressDoxFee?: number;
  urgentAvailable?: boolean;
  urgentDays?: number;
  urgentPrice?: number;
  urgentEmbassyFee?: number;
  urgentDoxFee?: number;
  // Nationality-based pricing
  useStandardPricing?: boolean; // true = show price, false = TBC
  pricingNote?: string; // e.g., "Embassy fee confirmed after application"
}

// Traveler info for visa orders
export interface VisaTraveler {
  firstName: string;
  lastName: string;
  passportNumber?: string;
}

// Visa-specific fields that extend the base OrderAnswers
export interface VisaOrderAnswers extends OrderAnswers {
  // Visa-specific fields
  destinationCountry: string;
  destinationCountryCode: string;
  nationality: string;
  nationalityCode: string;
  tripType: 'business' | 'tourist' | '';
  entryType: 'single' | 'double' | 'multiple' | '';
  departureDate: string;
  returnDateVisa: string; // renamed to avoid conflict with returnAddress
  passportNeededBy: string;
  // Selected visa product
  selectedVisaProduct: SelectedVisaProduct | null;
  // Express processing
  expressRequired?: boolean;
  // Urgent processing
  urgentRequired?: boolean;
  // Add-on services (e.g., chamber of commerce legalization)
  selectedAddOnServices?: { id: string; name: string; nameEn: string; price: number }[];
  // Travelers (one visa per traveler)
  travelers: VisaTraveler[];
}

export const initialVisaOrderAnswers: VisaOrderAnswers = {
  // Visa-specific fields
  destinationCountry: '',
  destinationCountryCode: '',
  nationality: '',
  nationalityCode: '',
  tripType: '',
  entryType: '',
  departureDate: '',
  returnDateVisa: '',
  passportNeededBy: '',
  selectedVisaProduct: null,
  expressRequired: false,
  urgentRequired: false,
  selectedAddOnServices: [],
  travelers: [{ firstName: '', lastName: '' }],
  
  // Base OrderAnswers fields (required for reusing components)
  country: '',
  documentType: '',
  documentTypes: [],
  documentTypeQuantities: {},
  services: [],
  helpMeChooseServices: false,
  notarizationDetails: {
    signature: false,
    signingAuthority: false,
    copy: false,
    unknown: false,
    other: false,
    otherText: ''
  },
  quantity: 1,
  expedited: false,
  documentSource: '',
  pickupService: false,
  shippingMethod: null,
  pickupMethod: undefined,
  premiumPickup: undefined,
  pickupAddress: {
    name: '',
    company: '',
    street: '',
    postalCode: '',
    city: '',
    country: 'SE',
  },
  pickupDate: undefined,
  pickupTimeWindow: undefined,
  scannedCopies: false,
  returnService: '',
  ownReturnTrackingNumber: '',
  premiumDelivery: '',
  returnDeliveryDate: undefined,
  deliveryAddressType: 'residential',
  uploadedFiles: [],
  customerType: 'private',
  returnAddress: {
    sameAsPickup: false,
    firstName: '',
    lastName: '',
    companyName: '',
    street: '',
    addressLine2: '',
    postalCode: '',
    city: '',
    country: 'Sverige',
    countryCode: 'SE',
    phone: '',
    email: '',
  },
  billingInfo: {
    sameAsReturn: false,
    firstName: '',
    lastName: '',
    companyName: '',
    organizationNumber: '',
    vatNumber: '',
    contactPerson: '',
    street: '',
    postalCode: '',
    city: '',
    country: 'Sverige',
    countryCode: 'SE',
    email: '',
    phone: '',
  },
  customerInfo: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
    country: '',
    countryCode: '',
  },
  invoiceReference: '',
  additionalNotes: '',
  paymentMethod: '',
};

export const VISA_TOTAL_STEPS = 10;
