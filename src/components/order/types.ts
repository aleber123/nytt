/**
 * Shared types for order flow components
 */

import type { Dispatch, SetStateAction } from 'react';
export interface OrderAnswers {
  country: string;
  documentType: string;
  documentTypes: string[];
  documentTypeQuantities: { [key: string]: number };
  services: string[];
  helpMeChooseServices: boolean;
  notarizationDetails?: {
    signature: boolean;
    signingAuthority: boolean;
    copy: boolean;
    unknown: boolean;
    other: boolean;
    otherText: string;
  };
  // Optional supporting documents for notarization
  idDocumentFile?: File | null; // ID or passport copy for signature verification
  registrationCertFile?: File | null; // Registration certificate (registreringsbevis) for signing authority
  signingAuthorityIdFile?: File | null; // ID/passport of the person with signing authority
  willSendIdDocumentLater?: boolean; // Customer will send ID/pass copy later
  willSendRegistrationCertLater?: boolean; // Customer will send registration certificate later
  willSendSigningAuthorityIdLater?: boolean; // Customer will send signing authority ID later
  willSendMainDocsLater?: boolean; // Customer will send main documents later via email
  quantity: number;
  expedited: boolean;
  documentSource: string;
  pickupService: boolean;
  shippingMethod: 'rek' | 'courier' | null; // How customer sends originals: REK (box) or courier (visiting address)
  pickupMethod?: string; // Pickup service ID (dhl-sweden, dhl-europe, dhl-worldwide, stockholm-city, no-pickup)
  premiumPickup?: string; // Premium pickup option ID (dhl-pre-12, dhl-pre-9, stockholm-express, stockholm-sameday)
  pickupAddress: {
    name: string;
    company: string;
    street: string;
    postalCode: string;
    city: string;
    country: string;
  };
  pickupDate?: string; // Desired pickup date (YYYY-MM-DD), required when pickupService is true
  pickupTimeWindow?: string; // Optional time window text/id for pickup
  scannedCopies: boolean;
  returnService: string;
  ownReturnTrackingNumber: string;
  premiumDelivery: string;
  uploadedFiles: File[];
  
  // Customer type: private person or company
  customerType: 'private' | 'company';
  
  // Return address (where documents should be sent back)
  returnAddress: {
    sameAsPickup: boolean; // If true, use pickup address for return
    firstName: string;
    lastName: string;
    companyName?: string; // Company name (for deliveries to companies)
    street: string; // addressLine1 for DHL API
    addressLine2?: string; // c/o, apartment number, floor, etc.
    postalCode: string;
    city: string;
    country: string;
    countryCode: string;
    phone: string;
    email: string;
  };
  
  // Billing information (for invoicing)
  billingInfo: {
    sameAsReturn: boolean; // If true, use return address for billing
    // For private customers
    firstName: string;
    lastName: string;
    // For company customers
    companyName?: string;
    organizationNumber?: string; // Swedish: Organisationsnummer
    vatNumber?: string; // VAT/Moms-nummer (optional, for EU companies)
    // Contact person at company
    contactPerson?: string;
    // Address
    street: string;
    postalCode: string;
    city: string;
    country: string;
    countryCode: string;
    // Contact
    email: string;
    phone: string;
  };
  
  // Legacy customerInfo - kept for backward compatibility
  customerInfo: {
    firstName: string;
    lastName: string;
    companyName?: string;
    email: string;
    phone: string;
    address: string;
    postalCode: string;
    city: string;
    country: string;
    countryCode: string;
  };
  invoiceReference: string;
  additionalNotes: string;
  paymentMethod: string;
}

export interface StepProps {
  answers: OrderAnswers;
  setAnswers: Dispatch<SetStateAction<OrderAnswers>>;
  onNext: () => void;
  onBack: () => void;
  currentLocale: string;
}

export interface Country {
  code: string;
  name: string;
  nameEn?: string; // English name for the country
  flag: string;
  popularity?: number;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
  timeframe: string;
  icon?: string;
}

export interface PricingBreakdownItem {
  service: string;
  description: string;
  quantity?: number;
  unitPrice?: number;
  total: number;
  vatRate?: number;
  fee?: number;
}
