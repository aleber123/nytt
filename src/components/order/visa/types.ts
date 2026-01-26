/**
 * Types for the visa order flow
 * Extended from OrderAnswers to reuse existing components
 */

import type { OrderAnswers } from '../types';
import type { VisaProduct, VisaCategory } from '@/firebase/visaRequirementsService';

// Selected visa product info stored in answers
export interface SelectedVisaProduct {
  id: string;
  name: string;
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
