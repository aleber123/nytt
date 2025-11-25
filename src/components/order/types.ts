/**
 * Shared types for order flow components
 */

export interface OrderAnswers {
  country: string;
  documentType: string;
  services: string[];
  quantity: number;
  expedited: boolean;
  documentSource: string;
  pickupService: boolean;
  pickupMethod?: string; // Pickup service ID (dhl-sweden, dhl-europe, dhl-worldwide, stockholm-city, no-pickup)
  premiumPickup?: string; // Premium pickup option ID (dhl-pre-12, dhl-pre-9, stockholm-express, stockholm-sameday)
  pickupAddress: {
    name: string;
    company: string;
    street: string;
    postalCode: string;
    city: string;
  };
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
  };
  invoiceReference: string;
  additionalNotes: string;
  paymentMethod: string;
}

export interface StepProps {
  answers: OrderAnswers;
  setAnswers: (answers: OrderAnswers | ((prev: OrderAnswers) => OrderAnswers)) => void;
  onNext: () => void;
  onBack: () => void;
  currentLocale: string;
}

export interface Country {
  code: string;
  name: string;
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
