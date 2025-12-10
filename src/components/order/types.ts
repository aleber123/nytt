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
  // Optional supporting documents for notarization (collected in Step 10)
  idDocumentFile?: File | null; // ID or passport copy for signature verification
  signingAuthorityFile?: File | null; // Registration certificate or other proof of signing authority
  willSendIdDocumentLater?: boolean; // Customer will send ID/pass copy later
  willSendSigningAuthorityLater?: boolean; // Customer will send signing authority proof later
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
  customerInfo: {
    firstName: string;
    lastName: string;
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
