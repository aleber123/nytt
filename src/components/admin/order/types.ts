/**
 * Shared types for admin order detail sub-components.
 * Extracted from pages/admin/orders/[id].tsx
 */

import type { Order } from '@/firebase/orderService';
import type { Timestamp as FbTimestamp } from 'firebase/firestore';
import type { Invoice } from '@/services/invoiceService';
import type { NotaryApostilleCoverLetterData, EmbassyCoverLetterData, UDCoverLetterData } from '@/services/coverLetterService';

export interface ExtendedOrder extends Order {
  processingSteps?: ProcessingStep[];
  adminNotes?: AdminNote[];
  internalNotes?: string;
  adminPrice?: any;
  hasUnconfirmedPrices?: boolean;
  embassyPriceConfirmationSent?: boolean;
  embassyPriceConfirmed?: boolean;
  embassyPriceDeclined?: boolean;
  confirmedEmbassyPrice?: number;
  pendingEmbassyPrice?: number;
  pendingTotalPrice?: number;
  willSendMainDocsLater?: boolean;
  confirmReturnAddressLater?: boolean;
  returnAddressConfirmationRequired?: boolean;
  returnAddressConfirmed?: boolean;
  returnAddressConfirmedAt?: string;
  returnAddressConfirmationSent?: boolean;
  returnAddressConfirmationSentAt?: string;
  orderType?: 'visa' | 'legalization';
  destinationCountry?: string;
  destinationCountryCode?: string;
  nationality?: string;
  nationalityCode?: string;
  visaProduct?: {
    id?: string;
    name?: string;
    nameEn?: string;
    visaType?: 'e-visa' | 'sticker';
    entryType?: 'single' | 'double' | 'multiple';
    category?: string;
    validityDays?: number;
    processingDays?: number;
    price?: number;
  };
  departureDate?: string;
  returnDate?: string;
  passportNeededBy?: string;
  locale?: string;
}

export interface ProcessingStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completedAt?: Date | FbTimestamp;
  completedBy?: string;
  notes?: string;
  submittedAt?: Date | FbTimestamp;
  expectedCompletionDate?: Date | FbTimestamp;
  notifiedExpectedCompletionDate?: string;
}

export interface AdminNote {
  id: string;
  content: string;
  createdAt: Date;
  createdBy: string;
  type: 'general' | 'processing' | 'customer' | 'issue';
}

export type { Invoice, NotaryApostilleCoverLetterData, EmbassyCoverLetterData, UDCoverLetterData };
