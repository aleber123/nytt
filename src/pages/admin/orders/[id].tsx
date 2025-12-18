import { useState, useEffect, useRef } from 'react';
import type { Timestamp as FbTimestamp } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { Order } from '@/firebase/orderService';
import { toast } from 'react-hot-toast';
import { ALL_COUNTRIES } from '@/components/order/data/countries';
import CountryFlag from '@/components/ui/CountryFlag';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { convertOrderToInvoice, storeInvoice, getInvoicesByOrderId, generateInvoicePDF, sendInvoiceEmail } from '@/services/invoiceService';
import { Invoice } from '@/services/invoiceService';
import { downloadCoverLetter, printCoverLetter, downloadOrderConfirmation } from '@/services/coverLetterService';
import { collection, addDoc, doc as fsDoc, getDoc, serverTimestamp, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getFirebaseDb, getFirebaseApp } from '@/firebase/config';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { downloadDhlReturnLabel } from '@/services/shippingLabelService';

// Define Order interface locally to match the updated interface
interface ExtendedOrder extends Order {
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
}

interface ProcessingStep {
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

interface AdminNote {
  id: string;
  content: string;
  createdAt: Date;
  createdBy: string;
  type: 'general' | 'processing' | 'customer' | 'issue';
}

// Helper function to get friendly return service name
const getReturnServiceName = (serviceCode: string | undefined): string => {
  if (!serviceCode) return 'return';
  const serviceNames: Record<string, string> = {
    'dhl': 'DHL Express',
    'retur': 'DHL Express',
    'dhl-sweden': 'DHL Sweden',
    'dhl-international': 'DHL International',
    'postnord': 'PostNord',
    'postnord-rek': 'PostNord REK',
    'postnord-express': 'PostNord Express',
    'stockholm-city': 'Stockholm City Courier',
    'stockholm-express': 'Stockholm Express',
    'stockholm-sameday': 'Stockholm Same Day',
    'own-delivery': 'Own Delivery',
    'office-pickup': 'Office Pickup',
  };
  return serviceNames[serviceCode] || serviceCode;
};

// Helper function to update order via Admin API (bypasses Firestore security rules)
const adminUpdateOrder = async (orderId: string, updates: Record<string, any>): Promise<void> => {
  const response = await fetch('/api/admin/update-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, updates })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update order');
  }
};

function AdminOrderDetailPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { signOut, currentUser } = useAuth();
  const [adminProfile, setAdminProfile] = useState<{ name?: string; phone?: string; email?: string } | null>(null);
  const [order, setOrder] = useState<ExtendedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editedStatus, setEditedStatus] = useState<Order['status']>('pending');
  const [activeTab, setActiveTab] = useState<'overview' | 'processing' | 'services' | 'price' | 'files' | 'notes' | 'invoice'>('overview');
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'general' | 'processing' | 'customer' | 'issue'>('general');
  const [internalNotes, setInternalNotes] = useState('');
  const [internalNoteText, setInternalNoteText] = useState('');
  const [internalNotesList, setInternalNotesList] = useState<Array<{ id: string; content: string; createdAt?: any; createdBy?: string; readBy?: string[] }>>([]);
  const [unreadNotesCount, setUnreadNotesCount] = useState(0);
  const [processingSteps, setProcessingSteps] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState<string | null>(null);
  const [removingService, setRemovingService] = useState<string | null>(null);
  const [newServiceToAdd, setNewServiceToAdd] = useState<string>('');
  const [addingService, setAddingService] = useState(false);
  // Pricing tab state
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [adjustments, setAdjustments] = useState<Array<{ description: string; amount: number }>>([]);
  const [lineOverrides, setLineOverrides] = useState<Array<{ index: number; label: string; baseAmount: number; overrideAmount?: number | null; vatPercent?: number | null; include: boolean }>>([]);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [pickupTrackingNumber, setPickupTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [savingTracking, setSavingTracking] = useState(false);
  const [bookingDhlShipment, setBookingDhlShipment] = useState(false);
  const [bookingDhlPickup, setBookingDhlPickup] = useState(false);
  const [bookingPostNordShipment, setBookingPostNordShipment] = useState(false);
  const [isUploadingPickupLabel, setIsUploadingPickupLabel] = useState(false);
  const [sendingPickupLabel, setSendingPickupLabel] = useState(false);
  const [creatingDhlPickupLabel, setCreatingDhlPickupLabel] = useState(false);
  const pickupLabelInputRef = useRef<HTMLInputElement | null>(null);
  // Document request state
  const [showDocumentRequestModal, setShowDocumentRequestModal] = useState(false);
  const [documentRequestTemplate, setDocumentRequestTemplate] = useState('custom');
  const [documentRequestMessage, setDocumentRequestMessage] = useState('');
  const [sendingDocumentRequest, setSendingDocumentRequest] = useState(false);
  const [unreadSupplementaryCount, setUnreadSupplementaryCount] = useState(0);
  const [editedCustomer, setEditedCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
    country: ''
  });
  const [editedPickupAddress, setEditedPickupAddress] = useState({
    street: '',
    postalCode: '',
    city: '',
    country: '',
    company: '',
    name: ''
  });
  const [savingCustomerInfo, setSavingCustomerInfo] = useState(false);
  
  // DHL address edit modal state
  const [showDhlAddressModal, setShowDhlAddressModal] = useState(false);
  const [dhlAddressError, setDhlAddressError] = useState('');
  const [dhlEditAddress, setDhlEditAddress] = useState({
    postalCode: '',
    city: '',
    country: 'SE'
  });
  
  // Address confirmation states
  const [sendingAddressConfirmation, setSendingAddressConfirmation] = useState(false);
  const [showAddressWarningModal, setShowAddressWarningModal] = useState(false);
  const [pendingStepUpdate, setPendingStepUpdate] = useState<{
    stepId: string;
    status: ProcessingStep['status'];
    notes?: string;
    updatedStep?: Partial<ProcessingStep>;
  } | null>(null);

  // Embassy price confirmation states
  const [sendingEmbassyPriceConfirmation, setSendingEmbassyPriceConfirmation] = useState(false);
  const [embassyPriceInput, setEmbassyPriceInput] = useState<string>('');
  const [showEmbassyPriceWarningModal, setShowEmbassyPriceWarningModal] = useState(false);

  useEffect(() => {
    const orderId = router.query.id as string | undefined;
    if (orderId) {
      fetchOrder(orderId);
    }
  }, [router.query.id]);

  // Initialize pricing editor from order.adminPrice if available
  useEffect(() => {
    if (order && order.adminPrice) {
      const ap = order.adminPrice as any;
      setDiscountAmount(Number(ap.discountAmount || 0));
      setDiscountPercent(Number(ap.discountPercent || 0));
      setAdjustments(Array.isArray(ap.adjustments) ? ap.adjustments.map((a: any) => ({ description: String(a.description || ''), amount: Number(a.amount || 0) })) : []);
      if (Array.isArray(ap.lineOverrides)) {
        setLineOverrides(
          ap.lineOverrides.map((o: any) => ({
            index: Number(o.index),
            label: String(o.label || ''),
            baseAmount: Number(o.baseAmount || 0),
            overrideAmount: o.overrideAmount !== undefined && o.overrideAmount !== null ? Number(o.overrideAmount) : null,
            vatPercent: o.vatPercent !== undefined && o.vatPercent !== null ? Number(o.vatPercent) : null,
            include: o.include !== false
          }))
        );
      }
    }
  }, [order?.adminPrice]);

  // If no stored overrides, initialize defaults from breakdown once order loads
  useEffect(() => {
    if (!order || !Array.isArray(order.pricingBreakdown)) return;
    // Always reinitialize to pick up latest pricing structure
    const initial = order.pricingBreakdown.map((item: any, idx: number) => {
      const base = (() => {
        // Prefer total field if it exists (matches pricingService output)
        if (typeof item.total === 'number') {
          return item.total;
        }
        // Fallback to other fields for backwards compatibility
        if (typeof item.fee === 'number') return item.fee;
        if (typeof item.basePrice === 'number') return item.basePrice;
        if (typeof item.unitPrice === 'number') return item.unitPrice * (item.quantity || 1);
        if (typeof item.officialFee === 'number' && typeof item.serviceFee === 'number') return (item.officialFee + item.serviceFee) * (item.quantity || 1);
        return 0;
      })();
      const label = item.description || getServiceName(item.service) || 'Rad';
      return { index: idx, label, baseAmount: Number(base || 0), overrideAmount: null, vatPercent: null, include: true };
    });
    const totalFromInitial = initial.reduce((sum, o) => sum + o.baseAmount, 0);
    setLineOverrides(initial);
  }, [order?.pricingBreakdown]);

  const getBreakdownTotal = () => {
    try {
      if (!order) {
        return 0;
      }
      if (order.pricingBreakdown && Array.isArray(order.pricingBreakdown)) {
        // If overrides exist, use them respecting include toggle
        if (lineOverrides.length === order.pricingBreakdown.length) {
          const overrideTotal = lineOverrides.reduce((sum, o) => {
            if (!o.include) return sum;
            const val = o.overrideAmount !== undefined && o.overrideAmount !== null ? Number(o.overrideAmount) : Number(o.baseAmount || 0);
            return sum + (isNaN(val) ? 0 : val);
          }, 0);
          return overrideTotal;
        }
        // Fallback to raw breakdown - use total field first, then fallback to other fields
        const calculatedTotal = order.pricingBreakdown.reduce((sum: number, item: any) => {
          // Prefer total field if it exists
          if (typeof item.total === 'number') return sum + item.total;
          // Fallback to other fields
          if (typeof item.fee === 'number') return sum + item.fee;
          if (typeof item.basePrice === 'number') return sum + item.basePrice;
          if (typeof item.unitPrice === 'number') return sum + (item.unitPrice * (item.quantity || 1));
          if (typeof item.officialFee === 'number' && typeof item.serviceFee === 'number') return sum + ((item.officialFee + item.serviceFee) * (item.quantity || 1));
          return sum;
        }, 0);
        return calculatedTotal;
      }
      // Fallback to existing totalPrice if breakdown missing
      return Number(order.totalPrice || 0);
    } catch (e) {
      console.error('❌ Error calculating breakdown total:', e);
      return Number(order?.totalPrice || 0);
    }
  };

  const getAuthorityPickupServiceNames = (stepId: string, orderData: ExtendedOrder) => {
    const embassyCountry = getCountryInfo(orderData.country);
    const embassyName = embassyCountry.name || embassyCountry.code || orderData.country || '';

    switch (stepId) {
      case 'notarization_pickup':
        return { sv: 'notarien', en: 'the notary public' };
      case 'chamber_pickup':
        return { sv: 'Handelskammaren', en: 'the Chamber of Commerce' };
      case 'ud_pickup':
        return { sv: 'Utrikesdepartementet', en: 'the Ministry for Foreign Affairs' };
      case 'apostille_pickup':
        return { sv: 'Utrikesdepartementet', en: 'the Ministry for Foreign Affairs' };
      case 'embassy_pickup':
        return {
          sv: embassyName ? `${embassyName} ambassad` : 'ambassaden',
          en: embassyName ? `the ${embassyName} embassy` : 'the embassy'
        };
      case 'translation_pickup':
        return { sv: 'översättaren', en: 'the translator' };
      default:
        return { sv: 'myndigheten', en: 'the authority' };
    }
  };

  const handleAddService = async (serviceToAdd: string) => {
    if (!order || !serviceToAdd) return;
    const orderId = router.query.id as string;

    setAddingService(true);
    try {
      let updatedServices = Array.isArray(order.services) ? [...order.services] : [];
      let updatedScannedCopies = order.scannedCopies;
      let updatedPickupService = order.pickupService;
      let updatedReturnService = order.returnService;
      let updatedExpedited = order.expedited;
      let updatedPremiumPickup = (order as any).premiumPickup;

      if (serviceToAdd === 'scanned_copies') {
        if (updatedScannedCopies) {
          setAddingService(false);
          return;
        }
        updatedScannedCopies = true;
      } else if (serviceToAdd === 'pickup_service') {
        if (updatedPickupService) {
          setAddingService(false);
          return;
        }
        updatedPickupService = true;
      } else if (serviceToAdd === 'premium_pickup') {
        // Premium pickup also enables regular pickup
        updatedPickupService = true;
        updatedPremiumPickup = 'dhl_express'; // Default premium option
      } else if (serviceToAdd === 'express') {
        if (updatedExpedited) {
          setAddingService(false);
          return;
        }
        updatedExpedited = true;
      } else if (serviceToAdd === 'return') {
        if (updatedReturnService) {
          setAddingService(false);
          return;
        }
        updatedReturnService = 'retur';
      } else {
        if (!updatedServices.includes(serviceToAdd)) {
          updatedServices.push(serviceToAdd);
        } else {
          setAddingService(false);
          return;
        }
      }

      const { calculateOrderPrice } = await import('@/firebase/pricingService');
      const pricingResult = await calculateOrderPrice({
        country: order.country,
        services: updatedServices,
        quantity: order.quantity,
        expedited: updatedExpedited,
        deliveryMethod: order.deliveryMethod,
        returnService: updatedReturnService,
        returnServices: [],
        scannedCopies: updatedScannedCopies,
        pickupService: updatedPickupService,
        premiumPickup: updatedPremiumPickup
      });

      const baseSteps = (order.processingSteps && order.processingSteps.length > 0)
        ? order.processingSteps
        : initializeProcessingSteps(order as ExtendedOrder);

      const updatedOrderForSteps = {
        ...(order as ExtendedOrder),
        services: updatedServices,
        scannedCopies: updatedScannedCopies,
        pickupService: updatedPickupService,
        returnService: updatedReturnService,
        expedited: updatedExpedited,
        premiumPickup: updatedPremiumPickup
      } as ExtendedOrder;

      const templateSteps = initializeProcessingSteps(updatedOrderForSteps);
      const mergedSteps = templateSteps.map((step) => {
        const existing = baseSteps.find((s: any) => s.id === step.id);
        return existing || step;
      });

      const updatedOrder = {
        ...order,
        services: updatedServices,
        scannedCopies: updatedScannedCopies,
        pickupService: updatedPickupService,
        returnService: updatedReturnService,
        expedited: updatedExpedited,
        premiumPickup: updatedPremiumPickup,
        totalPrice: pricingResult.totalPrice,
        pricingBreakdown: pricingResult.breakdown,
        processingSteps: mergedSteps
      } as ExtendedOrder;

      await adminUpdateOrder(orderId, {
        services: updatedServices,
        scannedCopies: updatedScannedCopies,
        pickupService: updatedPickupService,
        returnService: updatedReturnService,
        expedited: updatedExpedited,
        premiumPickup: updatedPremiumPickup,
        totalPrice: pricingResult.totalPrice,
        pricingBreakdown: pricingResult.breakdown,
        processingSteps: mergedSteps
      });

      setOrder(updatedOrder);
      setProcessingSteps(mergedSteps);
      setNewServiceToAdd('');
      toast.success(`Service "${getServiceName(serviceToAdd)}" has been added to the order`);
    } catch (err) {
      console.error('Error adding service:', err);
      toast.error('Could not add service to order');
    } finally {
      setAddingService(false);
    }
  };

  const getCountryInfo = (codeOrName: string | undefined | null) => {
    const value = (codeOrName || '').trim();
    if (!value) return { code: '', name: '', flag: '🌍' };

    const upper = value.toUpperCase();

    // Try match by ISO code
    let match = ALL_COUNTRIES.find(c => c.code === upper);
    if (match) return { code: match.code, name: match.name, flag: match.flag };

    // Try match by full name
    match = ALL_COUNTRIES.find(c => c.name.toLowerCase() === value.toLowerCase());
    if (match) return { code: match.code, name: match.name, flag: match.flag };

    // Fallback: derive flag emoji from 2-letter country code
    if (/^[A-Za-z]{2}$/.test(value)) {
      const base = 127397;
      const chars = upper.split('');
      const flag = String.fromCodePoint(...chars.map(ch => base + ch.charCodeAt(0)));
      return { code: upper, name: upper, flag };
    }

    return { code: value, name: value, flag: '🌍' };
  };

  const getAdjustmentsTotal = () => adjustments.reduce((s, a) => s + (Number(a.amount) || 0), 0);
  const getDiscountTotal = (base: number) => (base * (Number(discountPercent) || 0) / 100) + (Number(discountAmount) || 0);
  const getComputedTotal = () => {
    const base = getBreakdownTotal();
    const adj = getAdjustmentsTotal();
    const disc = getDiscountTotal(base);
    const total = Math.max(0, Math.round((base + adj - disc) * 100) / 100);
    return total;
  };

  const savePricingAdjustments = async () => {
    if (!order) return;
    const orderId = router.query.id as string;
    try {
      const base = getBreakdownTotal();
      const total = getComputedTotal();
      const actor = (adminProfile?.name || currentUser?.displayName || currentUser?.email || currentUser?.uid || 'Admin') as string;
      const adminPrice = {
        discountAmount: Number(discountAmount) || 0,
        discountPercent: Number(discountPercent) || 0,
        adjustments: adjustments.map(a => ({ description: a.description, amount: Number(a.amount) || 0 })),
        breakdownBase: base,
        computedTotal: total,
        updatedAt: new Date().toISOString(),
        updatedBy: actor,
        lineOverrides: lineOverrides.map((o) => ({
          index: o.index,
          label: o.label,
          baseAmount: Number(o.baseAmount || 0),
          overrideAmount: o.overrideAmount !== undefined && o.overrideAmount !== null ? Number(o.overrideAmount) : null,
          vatPercent: o.vatPercent !== undefined && o.vatPercent !== null ? Number(o.vatPercent) : null,
          include: o.include !== false
        }))
      };
      await adminUpdateOrder(orderId, {
        adminPrice,
        totalPrice: total
      });
      setOrder({ ...order, adminPrice, totalPrice: total } as any);
      toast.success('Price updated');
    } catch (e) {
      console.error('Failed to save pricing:', e);
      toast.error('Could not save price');
    }
  };

  // Subscribe to append-only internal notes subcollection
  useEffect(() => {
    const orderId = router.query.id as string | undefined;
    const db = getFirebaseDb();
    if (!db || !orderId) return;
    const q = query(
      collection(db, 'orders', orderId, 'internalNotes'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const notes = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setInternalNotesList(notes);
      
      // Count unread notes (notes not created by current user and not marked as read)
      if (currentUser?.uid) {
        const unread = notes.filter(note => {
          const readBy = note.readBy || [];
          const createdByCurrentUser = note.createdBy === currentUser.uid || 
            note.createdBy === currentUser.email ||
            note.createdBy === currentUser.displayName;
          return !createdByCurrentUser && !readBy.includes(currentUser.uid);
        });
        setUnreadNotesCount(unread.length);
      }
    });
    return () => unsub();
  }, [router.query.id, currentUser?.uid, currentUser?.email, currentUser?.displayName]);

  // Check for unread supplementary files
  useEffect(() => {
    if (!order || !currentUser?.uid) return;
    
    const supplementaryFiles = (order as any).supplementaryFiles || [];
    const viewedBy = (order as any).supplementaryViewedBy || {};
    const lastViewed = viewedBy[currentUser.uid];
    
    if (supplementaryFiles.length === 0) {
      setUnreadSupplementaryCount(0);
      return;
    }
    
    if (!lastViewed) {
      // Never viewed - all are unread
      setUnreadSupplementaryCount(supplementaryFiles.length);
    } else {
      // Count files uploaded after last view
      const lastViewedDate = new Date(lastViewed);
      const unread = supplementaryFiles.filter((file: any) => {
        if (!file.uploadedAt) return false;
        return new Date(file.uploadedAt) > lastViewedDate;
      });
      setUnreadSupplementaryCount(unread.length);
    }
  }, [order, currentUser?.uid]);

  // Load current admin profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!currentUser) return;
        const { doc, getDoc } = await import('firebase/firestore');
        const { getFirebaseDb } = await import('@/firebase/config');
        const db = getFirebaseDb();
        if (!db) return;
        const ref = doc(db, 'adminProfiles', currentUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setAdminProfile(snap.data() as any);
        }
      } catch (e) {
        console.warn('Could not load admin profile', e);
      }
    };
    loadProfile();
  }, [currentUser]);

  // Initialize processing steps based on order type
  const initializeProcessingSteps = (orderData: ExtendedOrder): ProcessingStep[] => {
    const steps: ProcessingStep[] = [];

    // STEP 1: Order verification - Always first
    steps.push({
      id: 'order_verification',
      name: '✓ Order verification',
      description: 'Check order details, pricing and customer information',
      status: 'pending'
    });

    // STEP 2: Pickup booking - If customer selected pickup service
    if (orderData.pickupService) {
      steps.push({
        id: 'pickup_booking',
        name: '📦 Schedule pickup',
        description: `Schedule pickup at ${orderData.pickupAddress?.street || 'customer'}`,
        status: 'pending'
      });
    }

    // STEP 3: Document receipt - Different based on source
    if (orderData.documentSource === 'original') {
      steps.push({
        id: 'document_receipt',
        name: '📄 Documents received',
        description: orderData.pickupService
          ? 'Original documents have been picked up and registered'
          : 'Original documents have been received and registered',
        status: 'pending'
      });
    } else {
      steps.push({
        id: 'file_upload_verification',
        name: '📤 File upload verified',
        description: `Verify that the customer has uploaded ${orderData.quantity} documents`,
        status: orderData.filesUploaded ? 'completed' : 'pending'
      });
    }

    // STEP 4: Quality control - Check documents
    steps.push({
      id: 'quality_control',
      name: '🔍 Quality control',
      description: 'Review documents – readability, completeness, correct type',
      status: 'pending'
    });

    // STEP 5-X: Service-specific steps (in logical order)
    if (Array.isArray(orderData.services)) {
      // Notarization usually comes first
      if (orderData.services.includes('notarization')) {
        steps.push({
          id: 'notarization_delivery',
          name: '✍️ Notarization – drop off',
          description: 'Submit documents for notarization with the notary public',
          status: 'pending'
        });
        steps.push({
          id: 'notarization_pickup',
          name: '✍️ Notarization – pick up',
          description: 'Pick up notarized documents from the notary public',
          status: 'pending'
        });
      }

      // Apostille (alternative to embassy)
      if (orderData.services.includes('apostille')) {
        steps.push({
          id: 'apostille_delivery',
          name: '📋 Apostille – drop off',
          description: 'Submit documents for apostille at the Swedish Ministry for Foreign Affairs',
          status: 'pending'
        });
        steps.push({
          id: 'apostille_pickup',
          name: '📋 Apostille – pick up',
          description: 'Pick up apostilled documents from the Swedish Ministry for Foreign Affairs',
          status: 'pending'
        });
      }

      // Chamber legalization
      if (orderData.services.includes('chamber')) {
        steps.push({
          id: 'chamber_delivery',
          name: '🏛️ Chamber of Commerce – drop off',
          description: 'Submit documents for legalization at the Chamber of Commerce',
          status: 'pending'
        });
        steps.push({
          id: 'chamber_pickup',
          name: '🏛️ Chamber of Commerce – pick up',
          description: 'Pick up legalized documents from the Chamber of Commerce',
          status: 'pending'
        });
      }

      // UD processing
      if (orderData.services.includes('ud')) {
        steps.push({
          id: 'ud_delivery',
          name: '🇸🇪 Ministry for Foreign Affairs – drop off',
          description: 'Submit documents for legalization at the Swedish Ministry for Foreign Affairs',
          status: 'pending'
        });
        steps.push({
          id: 'ud_pickup',
          name: '🇸🇪 Ministry for Foreign Affairs – pick up',
          description: 'Pick up legalized documents from the Swedish Ministry for Foreign Affairs',
          status: 'pending'
        });
      }

      // Embassy legalization (usually after UD)
      if (orderData.services.includes('embassy')) {
        const embassyCountry = getCountryInfo(orderData.country);
        
        // Add price confirmation step if order has unconfirmed embassy prices
        if (orderData.hasUnconfirmedPrices) {
          steps.push({
            id: 'embassy_price_confirmation',
            name: '💰 Confirm embassy price',
            description: `Confirm official embassy fee for ${embassyCountry.name || embassyCountry.code || orderData.country} and get customer approval`,
            status: 'pending'
          });
        }
        
        steps.push({
          id: 'embassy_delivery',
          name: '📤 Embassy – drop off',
          description: `Submit documents for legalization at the ${embassyCountry.name || embassyCountry.code || orderData.country} embassy`,
          status: 'pending'
        });
        steps.push({
          id: 'embassy_pickup',
          name: '📦 Embassy – pick up',
          description: `Pick up legalized documents from the ${embassyCountry.name || embassyCountry.code || orderData.country} embassy`,
          status: 'pending'
        });
      }

      // Translation (usually last)
      if (orderData.services.includes('translation')) {
        steps.push({
          id: 'translation_delivery',
          name: '🌐 Translation – drop off',
          description: 'Submit documents for certified translation',
          status: 'pending'
        });
        steps.push({
          id: 'translation_pickup',
          name: '🌐 Translation – pick up',
          description: 'Pick up translated documents from the translator',
          status: 'pending'
        });
      }
    }

    // STEP: Scanning - If requested
    if (orderData.scannedCopies) {
      steps.push({
        id: 'scanning',
        name: '📸 Scanned copies',
        description: 'Create and send digital copies of the documents',
        status: 'pending'
      });
    }

    // STEP: Final quality check
    steps.push({
      id: 'final_check',
      name: '✅ Final check',
      description: 'Verify that all services have been completed correctly',
      status: 'pending'
    });

    // STEP: Prepare return shipment
    steps.push({
      id: 'prepare_return',
      name: '📦 Prepare return',
      description: `Pack documents for ${getReturnServiceName(orderData.returnService)}`,
      status: 'pending'
    });

    // STEP: Return shipping
    steps.push({
      id: 'return_shipping',
      name: '🚚 Return shipment sent',
      description: 'Documents sent to the customer – add tracking number',
      status: 'pending'
    });

    steps.push({
      id: 'invoicing',
      name: '🧾 Invoicing',
      description: 'Create and send invoice to the customer',
      status: 'pending'
    });

    return steps;
  };

  const fetchOrder = async (orderIdParam?: string) => {
    setLoading(true);
    try {
      const mod = await import('@/services/hybridOrderService');
      const getOrderById = mod.default?.getOrderById || mod.getOrderById;
      const orderId = orderIdParam || (router.query.id as string);
      if (!orderId) throw new Error('Missing order id');
      const orderData = await getOrderById(orderId);
      if (orderData) {
        const extendedOrder = orderData as ExtendedOrder;
        setOrder(extendedOrder);
        setEditedStatus(extendedOrder.status);
        setInternalNotes(extendedOrder.internalNotes || '');
        setProcessingSteps(extendedOrder.processingSteps || initializeProcessingSteps(extendedOrder));
        setTrackingNumber(extendedOrder.returnTrackingNumber || '');
        setTrackingUrl(extendedOrder.returnTrackingUrl || '');
        setPickupTrackingNumber((extendedOrder as any).pickupTrackingNumber || '');

        const ci = extendedOrder.customerInfo || {};
        setEditedCustomer({
          firstName: ci.firstName || '',
          lastName: ci.lastName || '',
          email: ci.email || '',
          phone: ci.phone || '',
          address: ci.address || '',
          postalCode: ci.postalCode || '',
          city: ci.city || '',
          country: ci.country || ''
        });

        const pa = extendedOrder.pickupAddress || ({} as any);
        setEditedPickupAddress({
          street: pa.street || '',
          postalCode: pa.postalCode || '',
          city: pa.city || '',
          country: pa.country || '',
          company: pa.company || '',
          name: pa.name || ''
        });

        // Fetch invoices for this order
        await fetchInvoices(orderId);
      } else {
        setError('Order not found');
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async (orderId: string) => {
    try {
      const invoicesData = await getInvoicesByOrderId(orderId);
      setInvoices(invoicesData);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      // Don't set error state for invoices, just log it
    }
  };

  const handleCreateInvoice = async () => {
    if (!order) return;

    setCreatingInvoice(true);
    try {
      // Convert order to invoice
      const invoice = await convertOrderToInvoice(order);

      // Store the invoice
      const invoiceId = await storeInvoice(invoice);

      toast.success('Invoice created successfully');

      // Refresh invoices list
      await fetchInvoices(router.query.id as string);

      // Switch to invoice tab
      setActiveTab('invoice');
    } catch (err) {
      console.error('Error creating invoice:', err);
      toast.error('Could not create invoice');
    } finally {
      setCreatingInvoice(false);
    }
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    setSendingInvoice(invoice.id!);
    try {
      const success = await sendInvoiceEmail(invoice);
      if (success) {
        toast.success('Invoice sent via email');
      } else {
        toast.error('Could not send invoice via email');
      }
    } catch (err) {
      console.error('Error sending invoice:', err);
      toast.error('Could not send invoice via email');
    } finally {
      setSendingInvoice(null);
    }
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      await generateInvoicePDF(invoice);
      toast.success('Invoice downloading');
    } catch (err) {
      console.error('Error downloading invoice:', err);
      toast.error('Could not download invoice');
    }
  };

  const handleDownloadCover = () => {
    if (!order) return;
    try {
      downloadCoverLetter(order);
      toast.success('Packing slip downloading');
    } catch (err) {
      console.error('Error generating cover letter:', err);
      toast.error('Could not create packing slip');
    }
  };

  const handleDownloadOrderConfirmation = () => {
    if (!order) return;
    try {
      downloadOrderConfirmation(order);
      toast.success('Order confirmation downloading');
    } catch (err) {
      console.error('Error generating order confirmation:', err);
      toast.error('Could not create order confirmation');
    }
  };

  const handlePrintCover = () => {
    if (!order) return;
    try {
      printCoverLetter(order);
      toast.success('Printing started');
    } catch (err) {
      console.error('Error printing cover letter:', err);
      toast.error('Could not print packing slip');
    }
  };

  const handleStatusUpdate = async () => {
    if (!order) return;
    const orderId = router.query.id as string;

    setIsUpdating(true);
    try {
      await adminUpdateOrder(orderId, { status: editedStatus });
      setOrder({ ...order, status: editedStatus });
      toast.success('Order status updated successfully');
    } catch (err) {
      console.error('Error updating order status:', err);
      toast.error('Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  // Update processing step status
  const updateProcessingStep = async (stepId: string, status: ProcessingStep['status'], notes?: string, updatedStep?: Partial<ProcessingStep>) => {
    if (!order) return;
    const orderId = router.query.id as string;

    const previousStep = processingSteps.find((step) => step.id === stepId) as ProcessingStep | undefined;
    const customerEmail = order.customerInfo?.email || '';
    let shouldSendDocumentReceiptEmail = false;
    let shouldSendReturnShipmentEmail = false;
    let shouldSendOwnDeliveryReturnEmail = false;
    let shouldSendOfficePickupReadyEmail = false;

    const trackingNumberForEmail = trackingNumber || (order as any).returnTrackingNumber || '';
    const trackingUrlForEmail = trackingUrl || (order as any).returnTrackingUrl || '';

    // Helper for date-only string (YYYY-MM-DD)
    const toDateOnlyString = (value: any): string => {
      if (!value) return '';
      const jsDate = value instanceof Date ? value : value.toDate ? value.toDate() : null;
      return jsDate ? jsDate.toISOString().split('T')[0] : '';
    };

    // Pickup/authority notification logic
    const isPickupAuthorityStep = previousStep && isAuthorityService(previousStep.id) && previousStep.id.endsWith('_pickup');
    let shouldSendPickupInitialEmail = false;
    let shouldSendPickupUpdateEmail = false;
    let pickupExpectedDateForEmail: Date | null = null;
    let pickupServiceNameSv = '';
    let pickupServiceNameEn = '';
    let nextNotifiedExpectedCompletionDate: string = (previousStep as any)?.notifiedExpectedCompletionDate || '';

    // Validate required dates for authority services before changing status via dropdown
    if (
      previousStep &&
      updatedStep === undefined &&
      status !== previousStep.status &&
      status !== 'skipped' &&
      isAuthorityService(previousStep.id)
    ) {
      const hasSubmitted = !!previousStep.submittedAt;
      const hasExpected = !!previousStep.expectedCompletionDate;
      let missingRequiredDate = false;

      if (previousStep.id.endsWith('_delivery')) {
        // Delivery step: require submittedAt (Datum för inlämning till myndighet)
        missingRequiredDate = !hasSubmitted;
      } else if (previousStep.id.endsWith('_pickup')) {
        // Pickup step: require expectedCompletionDate (Datum klart för upphämtning)
        missingRequiredDate = !hasExpected;
      } else {
        // Legacy single-step authority: require at least one of the dates
        missingRequiredDate = !hasSubmitted && !hasExpected;
      }

      if (missingRequiredDate) {
        toast.error('Du måste ange datum på detta steg innan du kan ändra status.');
        return;
      }
    }

    if (
      previousStep &&
      previousStep.id === 'document_receipt' &&
      previousStep.status !== 'completed' &&
      status === 'completed' &&
      customerEmail
    ) {
      if (typeof window !== 'undefined') {
        shouldSendDocumentReceiptEmail = window.confirm(
          'Do you want to send a confirmation to the customer that we have received their documents?'
        );
      }
    }

    if (
      previousStep &&
      previousStep.id === 'return_shipping' &&
      previousStep.status !== 'completed' &&
      status === 'completed' &&
      customerEmail
    ) {
      const returnService = (order as any)?.returnService as string | undefined;
      const extOrder = order as any;
      const alreadySentOwnDelivery = !!extOrder.ownDeliveryReturnEmailSent;
      const alreadySentOfficePickup = !!extOrder.officePickupReadyEmailSent;

      if (returnService === 'own-delivery') {
        if (!alreadySentOwnDelivery) {
          if (typeof window !== 'undefined') {
            const confirmSend = window.confirm('Do you want to send an email to the customer confirming that the tracking number has been registered?');
            if (confirmSend) {
              shouldSendOwnDeliveryReturnEmail = true;
            }
          } else {
            shouldSendOwnDeliveryReturnEmail = true;
          }
        }
      } else if (returnService === 'office-pickup') {
        if (!alreadySentOfficePickup) {
          if (typeof window !== 'undefined') {
            const confirmSend = window.confirm('Do you want to send an email to the customer informing them that the documents are ready for pickup at our office?');
            if (confirmSend) {
              shouldSendOfficePickupReadyEmail = true;
            }
          } else {
            shouldSendOfficePickupReadyEmail = true;
          }
        }
      } else {
        if (typeof window !== 'undefined') {
          const confirmReturn = window.confirm(
            'Do you want to send an email to the customer informing them that the return shipment has been sent, including the tracking number?'
          );
          if (confirmReturn) {
            shouldSendReturnShipmentEmail = true;
          }
        } else {
          shouldSendReturnShipmentEmail = true;
        }
      }
    }

    if (previousStep && isPickupAuthorityStep && customerEmail) {
      const prevAny: any = previousStep;
      let nextExpected: any = prevAny.expectedCompletionDate;

      if (updatedStep && Object.prototype.hasOwnProperty.call(updatedStep, 'expectedCompletionDate')) {
        nextExpected = updatedStep.expectedCompletionDate;
      }

      const nextExpectedStr = toDateOnlyString(nextExpected);
      const notifiedStr = typeof nextNotifiedExpectedCompletionDate === 'string'
        ? nextNotifiedExpectedCompletionDate
        : '';

      if (nextExpectedStr) {
        const serviceNames = getAuthorityPickupServiceNames(previousStep.id, order as ExtendedOrder);
        pickupServiceNameSv = serviceNames.sv;
        pickupServiceNameEn = serviceNames.en;

        // Initial mail: first time status becomes in_progress and we have a date, and no previous notification
        if (status === 'in_progress' && !notifiedStr) {
          const serviceNames = getAuthorityPickupServiceNames(previousStep.id, order as ExtendedOrder);
          const serviceName = serviceNames.en;

          if (typeof window !== 'undefined') {
            const confirmInitial = window.confirm(
              `Do you want to send an email to the customer informing them that the case has been submitted to ${serviceName} with the expected completion date?`
            );
            if (confirmInitial) {
              shouldSendPickupInitialEmail = true;
              nextNotifiedExpectedCompletionDate = nextExpectedStr;
              const jsDate = nextExpected instanceof Date ? nextExpected : nextExpected?.toDate ? nextExpected.toDate() : null;
              pickupExpectedDateForEmail = jsDate || null;
            }
          } else {
            shouldSendPickupInitialEmail = true;
            nextNotifiedExpectedCompletionDate = nextExpectedStr;
            const jsDate = nextExpected instanceof Date ? nextExpected : nextExpected?.toDate ? nextExpected.toDate() : null;
            pickupExpectedDateForEmail = jsDate || null;
          }
        }

        // Update mail: date changed while step is in_progress and we have already notified once
        if (
          status === 'in_progress' &&
          notifiedStr &&
          nextExpectedStr !== notifiedStr &&
          updatedStep &&
          Object.prototype.hasOwnProperty.call(updatedStep, 'expectedCompletionDate')
        ) {
          const serviceNames = getAuthorityPickupServiceNames(previousStep.id, order as ExtendedOrder);
          const serviceName = serviceNames.en;

          if (typeof window !== 'undefined') {
            const confirmUpdate = window.confirm(
              `Do you want to send an updated email to the customer with the new expected completion date at ${serviceName}?`
            );
            if (confirmUpdate) {
              shouldSendPickupUpdateEmail = true;
              nextNotifiedExpectedCompletionDate = nextExpectedStr;
              const jsDate = nextExpected instanceof Date ? nextExpected : nextExpected?.toDate ? nextExpected.toDate() : null;
              pickupExpectedDateForEmail = jsDate || null;
            }
          } else {
            shouldSendPickupUpdateEmail = true;
            nextNotifiedExpectedCompletionDate = nextExpectedStr;
            const jsDate = nextExpected instanceof Date ? nextExpected : nextExpected?.toDate ? nextExpected.toDate() : null;
            pickupExpectedDateForEmail = jsDate || null;
          }
        }
      }
    }

    const updatedSteps = processingSteps.map(step => {
      if (step.id === stepId) {
        // Create a clean object without undefined values
        const cleanStep: any = {
          id: step.id,
          name: step.name,
          description: step.description,
          status: status,
          notes: notes || step.notes || ''
        };

        // Always preserve date fields if they exist
        if (step.submittedAt) {
          cleanStep.submittedAt = step.submittedAt;
        }
        if (step.expectedCompletionDate) {
          cleanStep.expectedCompletionDate = step.expectedCompletionDate;
        }

        // Apply any additional updates from updatedStep
        if (updatedStep) {
          if (updatedStep.submittedAt !== undefined) {
            cleanStep.submittedAt = updatedStep.submittedAt;
          }
          if (updatedStep.expectedCompletionDate !== undefined) {
            cleanStep.expectedCompletionDate = updatedStep.expectedCompletionDate;
          }
        }

        // Preserve or update notifiedExpectedCompletionDate for pickup authority steps
        if (isPickupAuthorityStep && nextNotifiedExpectedCompletionDate) {
          cleanStep.notifiedExpectedCompletionDate = nextNotifiedExpectedCompletionDate;
        } else if ((step as any).notifiedExpectedCompletionDate) {
          cleanStep.notifiedExpectedCompletionDate = (step as any).notifiedExpectedCompletionDate;
        }

        // Only add completedAt and completedBy if status is completed
        if (status === 'completed') {
          cleanStep.completedAt = new Date();
          const actor = (adminProfile?.name || currentUser?.displayName || currentUser?.email || currentUser?.uid || 'Admin') as string;
          cleanStep.completedBy = actor;
        }

        return cleanStep;
      }
      return step;
    });

    const updatedOrder = {
      ...order,
      processingSteps: updatedSteps
    };

    try {
      // Use Admin API to bypass Firestore security rules
      await adminUpdateOrder(orderId, { processingSteps: updatedSteps });
      setProcessingSteps(updatedSteps);
      setOrder(updatedOrder);
      toast.success('Processing step updated');

      if (shouldSendDocumentReceiptEmail) {
        try {
          const db = getFirebaseDb();
          if (db) {
            const customerName = `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim() || 'Customer';
            const orderNumber = order.orderNumber || orderId;
            const emailLocale = (order as any).locale === 'en' ? 'en' : 'sv';
            const messageHtml = emailLocale === 'en'
              ? `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Documents received</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #202124;
      max-width: 600px;
      margin: 0 auto;
      background-color: #f8f9fa;
      padding: 20px;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .header {
      background: #2E2D2C;
      color: #ffffff;
      padding: 28px 36px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.2px;
    }
    .content { padding: 32px 36px; }
    .greeting { font-size: 17px; font-weight: 600; color: #202124; margin-bottom: 16px; }
    .order-summary { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px; margin:20px 0; }
    .order-number { background:#0EB0A6; color:#fff; padding:10px 16px; border-radius:6px; display:inline-block; font-weight:700; font-size:15px; margin: 12px 0; }
    .order-details { margin: 16px 0; }
    .detail-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eaecef; }
    .detail-row:last-child { border-bottom:none; }
    .detail-label { font-weight:500; color:#5f6368; }
    .detail-value { font-weight:700; color:#202124; }
    .contact-info { background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; padding:18px; margin:22px 0; text-align:center; }
    .footer { background:#f8f9fa; padding:24px 36px; text-align:center; border-top:1px solid #eaecef; }
    .footer p { margin:5px 0; color:#5f6368; font-size:13px; }
    @media (max-width:600px){ body{padding:10px;} .header,.content,.footer{padding:20px;} .detail-row{flex-direction:column; gap:4px;} }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Documents received</h1>
      <p>Update for your order with DOX Visumpartner AB</p>
    </div>

    <div class="content">
      <div class="greeting">
        Dear ${customerName},
      </div>

      <p>We confirm that we have received your documents for order ${orderNumber}.</p>
      <p>We will now start the legalization process according to the services you have ordered.</p>

      <div class="order-summary">
        <div class="order-number">
          Order number: #${orderNumber}
        </div>
        <div class="order-details">
          <div class="detail-row">
            <span class="detail-label">Date:</span>
            <span class="detail-value">${new Date().toLocaleDateString('en-GB')}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Number of documents:</span>
            <span class="detail-value">${order.quantity || ''}</span>
          </div>
        </div>
      </div>

      <div class="contact-info">
        <h3>Questions?</h3>
        <p>Feel free to contact us:</p>
        <p>
          📧 <a href="mailto:info@doxvl.se">info@doxvl.se</a><br>
          📞 08-40941900
        </p>
      </div>
    </div>

    <div class="footer">
      <p><strong>DOX Visumpartner AB</strong></p>
      <p>Professional document legalisation for many years</p>
      <p>This is an automatically generated message.</p>
    </div>
  </div>
</body>
</html>
              `.trim()
              : `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dokument mottagna</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #202124;
      max-width: 600px;
      margin: 0 auto;
      background-color: #f8f9fa;
      padding: 20px;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .header {
      background: #2E2D2C;
      color: #ffffff;
      padding: 28px 36px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.2px;
    }
    .content { padding: 32px 36px; }
    .greeting { font-size: 17px; font-weight: 600; color: #202124; margin-bottom: 16px; }
    .order-summary { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px; margin:20px 0; }
    .order-number { background:#0EB0A6; color:#fff; padding:10px 16px; border-radius:6px; display:inline-block; font-weight:700; font-size:15px; margin: 12px 0; }
    .order-details { margin: 16px 0; }
    .detail-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eaecef; }
    .detail-row:last-child { border-bottom:none; }
    .detail-label { font-weight:500; color:#5f6368; }
    .detail-value { font-weight:700; color:#202124; }
    .contact-info { background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; padding:18px; margin:22px 0; text-align:center; }
    .footer { background:#f8f9fa; padding:24px 36px; text-align:center; border-top:1px solid #eaecef; }
    .footer p { margin:5px 0; color:#5f6368; font-size:13px; }
    @media (max-width:600px){ body{padding:10px;} .header,.content,.footer{padding:20px;} .detail-row{flex-direction:column; gap:4px;} }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Dokument mottagna</h1>
      <p>Uppdatering för din order hos DOX Visumpartner AB</p>
    </div>

    <div class="content">
      <div class="greeting">
        Hej ${customerName}!
      </div>

      <p>Vi bekräftar härmed att vi har mottagit dina dokument för order ${orderNumber}.</p>
      <p>Våra handläggare kommer nu att börja behandla ditt ärende enligt de tjänster du har beställt.</p>

      <div class="order-summary">
        <div class="order-number">
          Ordernummer: #${orderNumber}
        </div>
        <div class="order-details">
          <div class="detail-row">
            <span class="detail-label">Datum:</span>
            <span class="detail-value">${new Date().toLocaleDateString('sv-SE')}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Antal dokument:</span>
            <span class="detail-value">${order.quantity || ''}</span>
          </div>
        </div>
      </div>

      <div class="contact-info">
        <h3>Har du frågor?</h3>
        <p>Kontakta oss gärna:</p>
        <p>
          📧 <a href="mailto:info@doxvl.se">info@doxvl.se</a><br>
          📞 08-40941900
        </p>
      </div>
    </div>

    <div class="footer">
      <p><strong>DOX Visumpartner AB</strong></p>
      <p>Professionell dokumentlegalisering sedan många år</p>
      <p>Detta är ett automatiskt genererat meddelande.</p>
    </div>
  </div>
</body>
</html>
              `.trim();

            const subject = emailLocale === 'en'
              ? `Confirmation: We have received your documents – ${orderNumber}`
              : `Bekräftelse: Vi har mottagit dina dokument – ${orderNumber}`;

            await addDoc(collection(db, 'customerEmails'), {
              name: customerName,
              email: customerEmail,
              phone: order.customerInfo?.phone || '',
              subject,
              message: messageHtml,
              orderId: orderNumber,
              createdAt: serverTimestamp(),
              status: 'unread'
            });
            toast.success('Confirmation email to customer queued');
          }
        } catch (emailErr) {
          console.error('Error queuing customer document receipt email:', emailErr);
          toast.error('Could not create confirmation email to customer');
        }
      }

      if ((shouldSendPickupInitialEmail || shouldSendPickupUpdateEmail) && pickupExpectedDateForEmail) {
        try {
          const db = getFirebaseDb();
          if (db) {
            const customerName = `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim() || 'Customer';
            const orderNumber = order.orderNumber || orderId;
            const emailLocale = (order as any).locale === 'en' ? 'en' : 'sv';
            const expectedDateFormatted = emailLocale === 'en'
              ? pickupExpectedDateForEmail.toLocaleDateString('en-GB')
              : pickupExpectedDateForEmail.toLocaleDateString('sv-SE');
            const serviceName = emailLocale === 'en' ? pickupServiceNameEn : pickupServiceNameSv;
            const isUpdate = shouldSendPickupUpdateEmail;

            const messageHtml = emailLocale === 'en'
              ? `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isUpdate ? 'Updated expected pickup date' : 'Documents submitted'}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #202124;
      max-width: 600px;
      margin: 0 auto;
      background-color: #f8f9fa;
      padding: 20px;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .header {
      background: #2E2D2C;
      color: #ffffff;
      padding: 28px 36px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.2px;
    }
    .content { padding: 32px 36px; }
    .greeting { font-size: 17px; font-weight: 600; color: #202124; margin-bottom: 16px; }
    .order-summary { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px; margin:20px 0; }
    .order-number { background:#0EB0A6; color:#fff; padding:10px 16px; border-radius:6px; display:inline-block; font-weight:700; font-size:15px; margin: 12px 0; }
    .detail-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eaecef; }
    .detail-row:last-child { border-bottom:none; }
    .detail-label { font-weight:500; color:#5f6368; }
    .detail-value { font-weight:700; color:#202124; }
    .footer { background:#f8f9fa; padding:24px 36px; text-align:center; border-top:1px solid #eaecef; }
    .footer p { margin:5px 0; color:#5f6368; font-size:13px; }
    @media (max-width:600px){ body{padding:10px;} .header,.content,.footer{padding:20px;} .detail-row{flex-direction:column; gap:4px;} }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>${isUpdate ? 'Updated expected pickup date' : 'Documents submitted to ' + serviceName}</h1>
      <p>Update for your order with DOX Visumpartner AB</p>
    </div>

    <div class="content">
      <div class="greeting">
        Dear ${customerName},
      </div>

      <p>
        ${isUpdate
          ? `We have updated the expected date when your documents will be ready for pickup from ${serviceName}.`
          : `We have now submitted your documents to ${serviceName}.`}
      </p>

      <p>
        ${isUpdate
          ? `New expected pickup date: <strong>${expectedDateFormatted}</strong>.`
          : `Expected date when your documents will be ready for pickup: <strong>${expectedDateFormatted}</strong>.`}
      </p>

      <div class="order-summary">
        <div class="order-number">
          Order number: #${orderNumber}
        </div>
      </div>

      <p>If you have any questions, you are welcome to contact us at
        <a href="mailto:info@doxvl.se">info@doxvl.se</a> or by phone.
      </p>
    </div>

    <div class="footer">
      <p><strong>DOX Visumpartner AB</strong></p>
      <p>Professional document legalisation for many years</p>
      <p>This is an automatically generated message.</p>
    </div>
  </div>
</body>
</html>
              `.trim()
              : `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isUpdate ? 'Uppdaterat förväntat klart datum' : 'Ärende inlämnat'}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #202124;
      max-width: 600px;
      margin: 0 auto;
      background-color: #f8f9fa;
      padding: 20px;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .header {
      background: #2E2D2C;
      color: #ffffff;
      padding: 28px 36px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.2px;
    }
    .content { padding: 32px 36px; }
    .greeting { font-size: 17px; font-weight: 600; color: #202124; margin-bottom: 16px; }
    .order-summary { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px; margin:20px 0; }
    .order-number { background:#0EB0A6; color:#fff; padding:10px 16px; border-radius:6px; display:inline-block; font-weight:700; font-size:15px; margin: 12px 0; }
    .detail-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eaecef; }
    .detail-row:last-child { border-bottom:none; }
    .detail-label { font-weight:500; color:#5f6368; }
    .detail-value { font-weight:700; color:#202124; }
    .footer { background:#f8f9fa; padding:24px 36px; text-align:center; border-top:1px solid #eaecef; }
    .footer p { margin:5px 0; color:#5f6368; font-size:13px; }
    @media (max-width:600px){ body{padding:10px;} .header,.content,.footer{padding:20px;} .detail-row{flex-direction:column; gap:4px;} }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>${isUpdate ? 'Uppdaterat förväntat klart datum' : 'Ärende inlämnat till ' + serviceName}</h1>
      <p>Uppdatering för din order hos DOX Visumpartner AB</p>
    </div>

    <div class="content">
      <div class="greeting">
        Hej ${customerName}!
      </div>

      <p>
        ${isUpdate
          ? `Vi har uppdaterat det förväntade datumet då dina dokument är klara för upphämtning från ${serviceName}.`
          : `Vi har nu lämnat in dina dokument till ${serviceName}.`}
      </p>

      <p>
        ${isUpdate
          ? `Nytt förväntat klart datum: <strong>${expectedDateFormatted}</strong>.`
          : `Beräknat datum då dina dokument är klara för upphämtning: <strong>${expectedDateFormatted}</strong>.`}
      </p>

      <div class="order-summary">
        <div class="order-number">
          Ordernummer: #${orderNumber}
        </div>
      </div>

      <p>Har du frågor är du välkommen att kontakta oss på
        <a href="mailto:info@doxvl.se">info@doxvl.se</a> eller via telefon.
      </p>
    </div>

    <div class="footer">
      <p><strong>DOX Visumpartner AB</strong></p>
      <p>Professionell dokumentlegalisering sedan många år</p>
      <p>Detta är ett automatiskt genererat meddelande.</p>
    </div>
  </div>
</body>
</html>
              `.trim();

            const subject = emailLocale === 'en'
              ? isUpdate
                ? `Update: New expected pickup date at ${serviceName} – ${orderNumber}`
                : `Confirmation: Your documents have been submitted to ${serviceName} – ${orderNumber}`
              : isUpdate
                ? `Uppdatering: Nytt förväntat klart datum hos ${serviceName} – ${orderNumber}`
                : `Bekräftelse: Ärendet är inlämnat till ${serviceName} – ${orderNumber}`;

            await addDoc(collection(db, 'customerEmails'), {
              name: customerName,
              email: customerEmail,
              phone: order.customerInfo?.phone || '',
              subject,
              message: messageHtml,
              orderId: orderNumber,
              createdAt: serverTimestamp(),
              status: 'unread'
            });

            toast.success('Pickup email to customer queued');
          }
        } catch (pickupEmailErr) {
          console.error('Error queuing pickup expected completion email:', pickupEmailErr);
          toast.error('Could not create pickup email to customer');
        }
      }

      if (shouldSendOwnDeliveryReturnEmail) {
        try {
          const db = getFirebaseDb();
          if (db) {
            // Try customerInfo first, then billingInfo as fallback for older orders
            const extOrder = order as any;
            const firstName = order.customerInfo?.firstName || extOrder.billingInfo?.firstName || '';
            const lastName = order.customerInfo?.lastName || extOrder.billingInfo?.lastName || '';
            const customerName = `${firstName} ${lastName}`.trim() || 'Customer';
            const orderNumber = order.orderNumber || orderId;
            const emailLocale = (order as any).locale === 'en' ? 'en' : 'sv';
            const trackingNumberText = trackingNumberForEmail || '';

            if (!trackingNumberText) {
              toast.error('Tracking number is missing – cannot send Own delivery email');
            } else {
              const messageHtml = emailLocale === 'en'
                ? `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tracking registered</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #202124;
      max-width: 600px;
      margin: 0 auto;
      background-color: #f8f9fa;
      padding: 20px;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .header {
      background: #2E2D2C;
      color: #ffffff;
      padding: 28px 36px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.2px;
    }
    .content { padding: 32px 36px; }
    .greeting { font-size: 17px; font-weight: 600; color: #202124; margin-bottom: 16px; }
    .order-summary { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px; margin:20px 0; }
    .order-number { background:#0EB0A6; color:#fff; padding:10px 16px; border-radius:6px; display:inline-block; font-weight:700; font-size:15px; margin: 12px 0; }
    .footer { background:#f8f9fa; padding:24px 36px; text-align:center; border-top:1px solid #eaecef; }
    .footer p { margin:5px 0; color:#5f6368; font-size:13px; }
    .highlight { background:#fef3c7; padding:2px 6px; border-radius:3px; font-weight:700; }
    @media (max-width:600px){ body{padding:10px;} .header,.content,.footer{padding:20px;} }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Tracking number registered</h1>
      <p>Update for your order with DOX Visumpartner AB</p>
    </div>

    <div class="content">
      <div class="greeting">
        Dear ${customerName},
      </div>

      <p>
        You selected <strong>Own delivery</strong> (you have already booked the return shipment).
        We have registered your tracking number and linked it to your order.
      </p>

      <p>Tracking number: <span class="highlight">${trackingNumberText}</span></p>

      <div class="order-summary">
        <div class="order-number">Order number: #${orderNumber}</div>
      </div>

      <p>If you have any questions, you are welcome to contact us at
        <a href="mailto:info@doxvl.se">info@doxvl.se</a> or by phone.
      </p>
    </div>

    <div class="footer">
      <p><strong>DOX Visumpartner AB</strong></p>
      <p>Professional document legalisation for many years</p>
      <p>This is an automatically generated message.</p>
    </div>
  </div>
</body>
</html>
              `.trim()
                : `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Spårningsnummer registrerat</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #202124;
      max-width: 600px;
      margin: 0 auto;
      background-color: #f8f9fa;
      padding: 20px;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .header {
      background: #2E2D2C;
      color: #ffffff;
      padding: 28px 36px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.2px;
    }
    .content { padding: 32px 36px; }
    .greeting { font-size: 17px; font-weight: 600; color: #202124; margin-bottom: 16px; }
    .order-summary { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px; margin:20px 0; }
    .order-number { background:#0EB0A6; color:#fff; padding:10px 16px; border-radius:6px; display:inline-block; font-weight:700; font-size:15px; margin: 12px 0; }
    .footer { background:#f8f9fa; padding:24px 36px; text-align:center; border-top:1px solid #eaecef; }
    .footer p { margin:5px 0; color:#5f6368; font-size:13px; }
    .highlight { background:#fef3c7; padding:2px 6px; border-radius:3px; font-weight:700; }
    @media (max-width:600px){ body{padding:10px;} .header,.content,.footer{padding:20px;} }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Spårningsnummer registrerat</h1>
      <p>Uppdatering för din order hos DOX Visumpartner AB</p>
    </div>

    <div class="content">
      <div class="greeting">
        Hej ${customerName}!
      </div>

      <p>
        Du har valt <strong>Egen returfrakt</strong> (du har redan bokat returfrakten).
        Vi har registrerat ditt spårningsnummer och kopplat det till din order.
      </p>

      <p>Spårningsnummer: <span class="highlight">${trackingNumberText}</span></p>

      <div class="order-summary">
        <div class="order-number">Ordernummer: #${orderNumber}</div>
      </div>

      <p>Har du frågor är du välkommen att kontakta oss på
        <a href="mailto:info@doxvl.se">info@doxvl.se</a> eller via telefon.
      </p>
    </div>

    <div class="footer">
      <p><strong>DOX Visumpartner AB</strong></p>
      <p>Professionell dokumentlegalisering sedan många år</p>
      <p>Detta är ett automatiskt genererat meddelande.</p>
    </div>
  </div>
</body>
</html>
              `.trim();

              const subject = emailLocale === 'en'
                ? `Update: Tracking number registered – ${orderNumber}`
                : `Uppdatering: Spårningsnummer registrerat – ${orderNumber}`;

              await addDoc(collection(db, 'customerEmails'), {
                name: customerName,
                email: customerEmail,
                phone: order.customerInfo?.phone || '',
                subject,
                message: messageHtml,
                orderId: orderNumber,
                createdAt: serverTimestamp(),
                status: 'unread'
              });

              await adminUpdateOrder(orderId, {
                ownDeliveryReturnEmailSent: true,
                ownDeliveryReturnEmailSentAt: new Date().toISOString()
              });
              const sentAt = new Date().toISOString();
              setOrder((prev) => ({
                ...(prev as any),
                ownDeliveryReturnEmailSent: true,
                ownDeliveryReturnEmailSentAt: sentAt
              }) as ExtendedOrder);
              toast.success('Own delivery mail has been queued');
            }
          }
        } catch (ownDeliveryEmailErr) {
          console.error('Error queuing own delivery return email:', ownDeliveryEmailErr);
          toast.error('Could not queue Own delivery email');
        }
      }

      if (shouldSendOfficePickupReadyEmail) {
        try {
          const db = getFirebaseDb();
          if (db) {
            // Try customerInfo first, then billingInfo as fallback for older orders
            const extOrderPickup = order as any;
            const firstNamePickup = order.customerInfo?.firstName || extOrderPickup.billingInfo?.firstName || '';
            const lastNamePickup = order.customerInfo?.lastName || extOrderPickup.billingInfo?.lastName || '';
            const customerName = `${firstNamePickup} ${lastNamePickup}`.trim() || 'Customer';
            const orderNumber = order.orderNumber || orderId;
            const emailLocale = (order as any).locale === 'en' ? 'en' : 'sv';
            const officeAddressLines = emailLocale === 'en'
              ? 'DOX Visumpartner AB<br/>Livdjursgatan 4<br/>121 62 Johanneshov<br/>Sweden'
              : 'DOX Visumpartner AB<br/>Livdjursgatan 4<br/>121 62 Johanneshov<br/>Sverige';
            const openingHours = emailLocale === 'en'
              ? 'Mon–Fri 09:00–15:00'
              : 'Mån–Fre 09:00–15:00';

            const messageHtml = emailLocale === 'en'
              ? `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ready for pickup</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #202124;
      max-width: 600px;
      margin: 0 auto;
      background-color: #f8f9fa;
      padding: 20px;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .header {
      background: #2E2D2C;
      color: #ffffff;
      padding: 28px 36px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.2px;
    }
    .content { padding: 32px 36px; }
    .greeting { font-size: 17px; font-weight: 600; color: #202124; margin-bottom: 16px; }
    .order-summary { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px; margin:20px 0; }
    .order-number { background:#0EB0A6; color:#fff; padding:10px 16px; border-radius:6px; display:inline-block; font-weight:700; font-size:15px; margin: 12px 0; }
    .address-box { background:#fff; border:2px solid #0EB0A6; border-radius:8px; padding:14px; margin:12px 0; }
    .footer { background:#f8f9fa; padding:24px 36px; text-align:center; border-top:1px solid #eaecef; }
    .footer p { margin:5px 0; color:#5f6368; font-size:13px; }
    @media (max-width:600px){ body{padding:10px;} .header,.content,.footer{padding:20px;} }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Ready for pickup</h1>
      <p>Update for your order with DOX Visumpartner AB</p>
    </div>

    <div class="content">
      <div class="greeting">
        Dear ${customerName},
      </div>

      <p>Your documents are now ready for pickup at our office in Stockholm.</p>

      <div class="order-summary">
        <div class="order-number">Order number: #${orderNumber}</div>
      </div>

      <div class="address-box">
        <div style="font-weight:700; margin-bottom:8px;">Pickup address</div>
        ${officeAddressLines}
        <div style="margin-top:10px; font-size:13px; color:#5f6368;">
          <strong>Opening hours:</strong><br/>
          ${openingHours}
        </div>
      </div>

      <p>Please bring valid ID and your order number when collecting your documents.</p>

      <p>If you have any questions, you are welcome to contact us at
        <a href="mailto:info@doxvl.se">info@doxvl.se</a> or by phone.
      </p>
    </div>

    <div class="footer">
      <p><strong>DOX Visumpartner AB</strong></p>
      <p>Professional document legalisation for many years</p>
      <p>This is an automatically generated message.</p>
    </div>
  </div>
</body>
</html>
              `.trim()
              : `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Klara för upphämtning</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #202124;
      max-width: 600px;
      margin: 0 auto;
      background-color: #f8f9fa;
      padding: 20px;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .header {
      background: #2E2D2C;
      color: #ffffff;
      padding: 28px 36px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.2px;
    }
    .content { padding: 32px 36px; }
    .greeting { font-size: 17px; font-weight: 600; color: #202124; margin-bottom: 16px; }
    .order-summary { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px; margin:20px 0; }
    .order-number { background:#0EB0A6; color:#fff; padding:10px 16px; border-radius:6px; display:inline-block; font-weight:700; font-size:15px; margin: 12px 0; }
    .address-box { background:#fff; border:2px solid #0EB0A6; border-radius:8px; padding:14px; margin:12px 0; }
    .footer { background:#f8f9fa; padding:24px 36px; text-align:center; border-top:1px solid #eaecef; }
    .footer p { margin:5px 0; color:#5f6368; font-size:13px; }
    @media (max-width:600px){ body{padding:10px;} .header,.content,.footer{padding:20px;} }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Dina dokument är klara att hämta</h1>
      <p>Uppdatering för din order hos DOX Visumpartner AB</p>
    </div>

    <div class="content">
      <div class="greeting">
        Hej ${customerName}!
      </div>

      <p>Dina dokument är nu klara för upphämtning på vårt kontor i Stockholm.</p>

      <div class="order-summary">
        <div class="order-number">Ordernummer: #${orderNumber}</div>
      </div>

      <div class="address-box">
        <div style="font-weight:700; margin-bottom:8px;">Upphämtningsadress</div>
        ${officeAddressLines}
        <div style="margin-top:10px; font-size:13px; color:#5f6368;">
          <strong>Öppettider:</strong><br/>
          ${openingHours}
        </div>
      </div>

      <p>Ta med giltig legitimation och ditt ordernummer när du hämtar dina dokument.</p>

      <p>Har du frågor är du välkommen att kontakta oss på
        <a href="mailto:info@doxvl.se">info@doxvl.se</a> eller via telefon.
      </p>
    </div>

    <div class="footer">
      <p><strong>DOX Visumpartner AB</strong></p>
      <p>Professionell dokumentlegalisering sedan många år</p>
      <p>Detta är ett automatiskt genererat meddelande.</p>
    </div>
  </div>
</body>
</html>
              `.trim();

            const subject = emailLocale === 'en'
              ? `Your documents are ready for pickup – ${orderNumber}`
              : `Dina dokument är klara för upphämtning – ${orderNumber}`;

            await addDoc(collection(db, 'customerEmails'), {
              name: customerName,
              email: customerEmail,
              phone: order.customerInfo?.phone || '',
              subject,
              message: messageHtml,
              orderId: orderNumber,
              createdAt: serverTimestamp(),
              status: 'unread'
            });

            await adminUpdateOrder(orderId, {
              officePickupReadyEmailSent: true,
              officePickupReadyEmailSentAt: new Date().toISOString()
            });
            const sentAt = new Date().toISOString();
            setOrder((prev) => ({
              ...(prev as any),
              officePickupReadyEmailSent: true,
              officePickupReadyEmailSentAt: sentAt
            }) as ExtendedOrder);
            toast.success('Office pickup mail has been queued');
          }
        } catch (officePickupEmailErr) {
          console.error('Error queuing office pickup ready email:', officePickupEmailErr);
          toast.error('Could not queue Office pickup email');
        }
      }

      if (shouldSendReturnShipmentEmail) {
        try {
          const db = getFirebaseDb();
          if (db) {
            const customerName = `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim() || 'Customer';
            const orderNumber = order.orderNumber || orderId;
            const emailLocale = (order as any).locale === 'en' ? 'en' : 'sv';
            const trackingNumberText = trackingNumberForEmail || '';
            const trackingUrlText = trackingUrlForEmail || '';

            const trackingHtmlSv = trackingNumberText
              ? `<p>Spårningsnummer: <strong>${trackingNumberText}</strong></p>`
              : '';
            const trackingHtmlEn = trackingNumberText
              ? `<p>Tracking number: <strong>${trackingNumberText}</strong></p>`
              : '';

            const trackingLinkSv = trackingUrlText
              ? `<p>Du kan följa din försändelse här: <a href="${trackingUrlText}">${trackingUrlText}</a></p>`
              : '';
            const trackingLinkEn = trackingUrlText
              ? `<p>You can track your shipment here: <a href="${trackingUrlText}">${trackingUrlText}</a></p>`
              : '';

            const messageHtml = emailLocale === 'en'
              ? `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Return shipment sent</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #202124;
      max-width: 600px;
      margin: 0 auto;
      background-color: #f8f9fa;
      padding: 20px;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .header {
      background: #2E2D2C;
      color: #ffffff;
      padding: 28px 36px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.2px;
    }
    .content { padding: 32px 36px; }
    .greeting { font-size: 17px; font-weight: 600; color: #202124; margin-bottom: 16px; }
    .order-summary { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px; margin:20px 0; }
    .order-number { background:#0EB0A6; color:#fff; padding:10px 16px; border-radius:6px; display:inline-block; font-weight:700; font-size:15px; margin: 12px 0; }
    .footer { background:#f8f9fa; padding:24px 36px; text-align:center; border-top:1px solid #eaecef; }
    .footer p { margin:5px 0; color:#5f6368; font-size:13px; }
    @media (max-width:600px){ body{padding:10px;} .header,.content,.footer{padding:20px;} }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Your documents have been shipped</h1>
      <p>Update for your order with DOX Visumpartner AB</p>
    </div>

    <div class="content">
      <div class="greeting">
        Dear ${customerName},
      </div>

      <p>We have now sent your documents to the return address you provided.</p>

      ${trackingHtmlEn}
      ${trackingLinkEn}

      <div class="order-summary">
        <div class="order-number">
          Order number: #${orderNumber}
        </div>
      </div>

      <p>If you have any questions, you are welcome to contact us at
        <a href="mailto:info@doxvl.se">info@doxvl.se</a> or by phone.
      </p>
    </div>

    <div class="footer">
      <p><strong>DOX Visumpartner AB</strong></p>
      <p>Professional document legalisation for many years</p>
      <p>This is an automatically generated message.</p>
    </div>
  </div>
</body>
</html>
              `.trim()
              : `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Return shipment sent</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #202124;
      max-width: 600px;
      margin: 0 auto;
      background-color: #f8f9fa;
      padding: 20px;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .header {
      background: #2E2D2C;
      color: #ffffff;
      padding: 28px 36px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.2px;
    }
    .content { padding: 32px 36px; }
    .greeting { font-size: 17px; font-weight: 600; color: #202124; margin-bottom: 16px; }
    .order-summary { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px; margin:20px 0; }
    .order-number { background:#0EB0A6; color:#fff; padding:10px 16px; border-radius:6px; display:inline-block; font-weight:700; font-size:15px; margin: 12px 0; }
    .footer { background:#f8f9fa; padding:24px 36px; text-align:center; border-top:1px solid #eaecef; }
    .footer p { margin:5px 0; color:#5f6368; font-size:13px; }
    @media (max-width:600px){ body{padding:10px;} .header,.content,.footer{padding:20px;} }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Dina dokument har skickats</h1>
      <p>Uppdatering för din order hos DOX Visumpartner AB</p>
    </div>

    <div class="content">
      <div class="greeting">
        Hej ${customerName}!
      </div>

      <p>Vi har nu skickat dina dokument till den returadress du angav.</p>

      ${trackingHtmlSv}
      ${trackingLinkSv}

      <div class="order-summary">
        <div class="order-number">
          Ordernummer: #${orderNumber}
        </div>
      </div>

      <p>Har du frågor är du välkommen att kontakta oss på
        <a href="mailto:info@doxvl.se">info@doxvl.se</a> eller via telefon.
      </p>
    </div>

    <div class="footer">
      <p><strong>DOX Visumpartner AB</strong></p>
      <p>Professionell dokumentlegalisering sedan många år</p>
      <p>Detta är ett automatiskt genererat meddelande.</p>
    </div>
  </div>
</body>
</html>
              `.trim();

            const subject = emailLocale === 'en'
              ? `Your documents have been shipped – ${orderNumber}`
              : `Dina dokument har skickats – ${orderNumber}`;

            await addDoc(collection(db, 'customerEmails'), {
              name: customerName,
              email: customerEmail,
              phone: order.customerInfo?.phone || '',
              subject,
              message: messageHtml,
              orderId: orderNumber,
              createdAt: serverTimestamp(),
              status: 'unread'
            });

            toast.success('Return shipment email to customer queued');
          }
        } catch (returnEmailErr) {
          console.error('Error queuing return shipment email:', returnEmailErr);
          toast.error('Could not create return shipment email to customer');
        }
      }
    } catch (err) {
      console.error('Error updating processing step:', err);
      toast.error('Could not update processing step');
    }
  };

  // Save internal notes
  const saveInternalNotes = async () => {
    if (!order) return;
    const orderId = router.query.id as string;

    try {
      await adminUpdateOrder(orderId, { internalNotes });
      setOrder({ ...order, internalNotes });
      toast.success('Internal notes saved');
    } catch (err) {
      console.error('Error saving internal notes:', err);
      toast.error('Could not save internal notes');
    }
  };

  // Save tracking information
  const saveTrackingInfo = async () => {
    if (!order) return;
    const orderId = router.query.id as string;
    setSavingTracking(true);

    try {
      await adminUpdateOrder(orderId, {
        returnTrackingNumber: trackingNumber,
        returnTrackingUrl: trackingUrl
      });
      setOrder({ ...order, returnTrackingNumber: trackingNumber, returnTrackingUrl: trackingUrl });
      toast.success('Tracking information saved');
    } catch (err) {
      console.error('Error saving tracking info:', err);
      toast.error('Could not save tracking information');
    } finally {
      setSavingTracking(false);
    }
  };

  // Save edited DHL address and retry booking
  const saveDhlAddressAndRetry = async () => {
    if (!order) return;
    
    const lookupId = (order.orderNumber as string) || (router.query.id as string);
    if (!lookupId) return;

    try {
      // Update order with new address
      await adminUpdateOrder(lookupId, {
        'customerInfo.postalCode': dhlEditAddress.postalCode,
        'customerInfo.city': dhlEditAddress.city,
        'customerInfo.country': dhlEditAddress.country
      });

      // Update local state
      setOrder({
        ...order,
        customerInfo: {
          ...order.customerInfo,
          postalCode: dhlEditAddress.postalCode,
          city: dhlEditAddress.city,
          country: dhlEditAddress.country
        }
      } as ExtendedOrder);

      setShowDhlAddressModal(false);
      toast.success('Address updated');
      
      // Retry booking with new address
      setTimeout(() => bookDhlShipment(), 500);
    } catch (err: any) {
      toast.error(`Could not update address: ${err.message}`);
    }
  };

  const bookDhlShipment = async () => {
    if (!order) {
      toast.error('Order missing, cannot book DHL shipping');
      return;
    }

    const lookupId = (order.orderNumber as string) || (router.query.id as string);
    if (!lookupId) {
      toast.error('Order number missing, cannot book DHL shipping');
      return;
    }

    // Check if return address has been confirmed by customer
    const extOrder = order as any;
    if (!extOrder.returnAddressConfirmed) {
      const proceed = window.confirm(
        '⚠️ Return address has not been confirmed by customer.\n\nDo you want to continue with DHL booking anyway?'
      );
      if (!proceed) {
        return;
      }
    }

    // Validate customer info
    const ci = order.customerInfo;
    if (!ci?.address || !ci?.postalCode || !ci?.city || !ci?.phone) {
      toast.error('Customer info missing (address, postal code, city or phone)');
      return;
    }

    try {
      setBookingDhlShipment(true);

      // Step 1: Get shipping settings (max price limit) via API
      let maxPriceEnabled = true;
      let maxPrice = 300;
      try {
        const settingsResponse = await fetch('/api/admin/shipping-settings');
        if (settingsResponse.ok) {
          const responseData = await settingsResponse.json();
          const shippingSettings = responseData.settings || responseData;
          maxPriceEnabled = shippingSettings.dhlMaxPriceEnabled !== false;
          maxPrice = shippingSettings.dhlMaxPrice || 300;
          console.log('Shipping settings loaded:', { maxPriceEnabled, maxPrice, shippingSettings });
        }
      } catch (settingsErr) {
        console.error('Failed to load shipping settings:', settingsErr);
        // Use defaults if settings fetch fails
      }

      // Step 2: Get DHL rate quote first
      // Validate required fields for rates
      if (!ci.postalCode || !ci.city) {
        toast.error('Customer postal code or city is missing - cannot get DHL rate');
        setBookingDhlShipment(false);
        return;
      }

      // Convert country name to 2-letter code if needed
      const countryNameToCode: Record<string, string> = {
        'sweden': 'SE', 'sverige': 'SE',
        'norway': 'NO', 'norge': 'NO',
        'denmark': 'DK', 'danmark': 'DK',
        'finland': 'FI',
        'germany': 'DE', 'deutschland': 'DE', 'tyskland': 'DE',
        'united kingdom': 'GB', 'uk': 'GB', 'storbritannien': 'GB',
        'united states': 'US', 'usa': 'US',
        'france': 'FR', 'frankrike': 'FR',
        'spain': 'ES', 'spanien': 'ES',
        'italy': 'IT', 'italien': 'IT',
        'netherlands': 'NL', 'holland': 'NL', 'nederländerna': 'NL',
        'belgium': 'BE', 'belgien': 'BE',
        'austria': 'AT', 'österrike': 'AT',
        'switzerland': 'CH', 'schweiz': 'CH',
        'poland': 'PL', 'polen': 'PL'
      };
      
      let countryCode = ci.country || 'SE';
      if (countryCode.length > 2) {
        const normalized = countryCode.toLowerCase().trim();
        countryCode = countryNameToCode[normalized] || 'SE';
      }

      // Format postal code for DHL (Swedish format: "123 45")
      let formattedPostalCode = ci.postalCode.replace(/\s/g, ''); // First remove all spaces
      if (countryCode === 'SE' && formattedPostalCode.length === 5) {
        formattedPostalCode = formattedPostalCode.slice(0, 3) + ' ' + formattedPostalCode.slice(3);
      }

      const ratesRequestBody = {
        receiver: {
          postalCode: formattedPostalCode,
          cityName: ci.city,
          countryCode: countryCode,
        },
        isPickup: false, // Return shipment: DOX -> Customer
      };

      const ratesResponse = await fetch('/api/dhl/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ratesRequestBody)
      });

      const ratesData = await ratesResponse.json();

      if (!ratesResponse.ok || !ratesData.success) {
        // If rates API fails, show address edit modal
        const errorDetail = ratesData.details || ratesData.error || 'Unknown error';
        setDhlAddressError(errorDetail);
        
        // Convert country name to code if needed
        const countryNameToCode: Record<string, string> = {
          'sweden': 'SE', 'sverige': 'SE',
          'norway': 'NO', 'norge': 'NO',
          'denmark': 'DK', 'danmark': 'DK',
          'finland': 'FI',
          'germany': 'DE', 'deutschland': 'DE', 'tyskland': 'DE',
          'united kingdom': 'GB', 'uk': 'GB', 'storbritannien': 'GB',
          'united states': 'US', 'usa': 'US',
          'france': 'FR', 'frankrike': 'FR',
          'spain': 'ES', 'spanien': 'ES',
          'italy': 'IT', 'italien': 'IT',
          'netherlands': 'NL', 'holland': 'NL', 'nederländerna': 'NL',
          'belgium': 'BE', 'belgien': 'BE',
          'austria': 'AT', 'österrike': 'AT',
          'switzerland': 'CH', 'schweiz': 'CH',
          'poland': 'PL', 'polen': 'PL'
        };
        
        let countryCode = ci.country || 'SE';
        // If country is longer than 2 chars, try to convert it
        if (countryCode.length > 2) {
          const normalized = countryCode.toLowerCase().trim();
          countryCode = countryNameToCode[normalized] || 'SE';
        }
        
        setDhlEditAddress({
          postalCode: ci.postalCode || '',
          city: ci.city || '',
          country: countryCode
        });
        setShowDhlAddressModal(true);
        setBookingDhlShipment(false);
        return;
      } else {
        // Check price against max limit
        const dhlPrice = ratesData.rate?.price || 0;
        const currency = ratesData.rate?.currency || 'SEK';
        
        if (maxPriceEnabled && dhlPrice > maxPrice) {
          toast.error(
            `❌ DHL price (${dhlPrice} ${currency}) exceeds max limit (${maxPrice} SEK). Please book manually via DHL website.`,
            { duration: 8000 }
          );
          setBookingDhlShipment(false);
          return;
        }

        // Show price confirmation
        const confirmBooking = window.confirm(
          `DHL price: ${dhlPrice} ${currency}\n\nDo you want to book DHL shipping for this order?`
        );
        if (!confirmBooking) {
          setBookingDhlShipment(false);
          return;
        }
      }

      // Step 3: Proceed with booking
      // Include premiumDelivery if customer selected DHL Pre 9 or Pre 12
      const premiumDelivery = (order as any)?.premiumDelivery;
      
      const response = await fetch('/api/dhl/shipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: lookupId,
          shippingDate: new Date().toISOString().split('T')[0],
          receiver: {
            address: {
              postalCode: ci.postalCode,
              cityName: ci.city,
              countryCode: ci.country || 'SE',
              addressLine1: ci.address
            },
            contact: {
              companyName: ci.companyName,
              fullName: `${ci.firstName || ''} ${ci.lastName || ''}`.trim(),
              phone: ci.phone,
              email: ci.email
            }
          },
          includePickup: false,
          premiumDelivery: premiumDelivery, // Pass 'dhl-pre-9' or 'dhl-pre-12' if selected
          deliveryAddressType: (order as any).deliveryAddressType || 'residential' // 'business' or 'residential'
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.details || data.error || 'DHL API error');
      }

      const newTrackingNumber: string = data.shipmentTrackingNumber || '';
      const newTrackingUrl: string = data.trackingUrl || '';

      if (newTrackingNumber) {
        setTrackingNumber(newTrackingNumber);
      }
      if (newTrackingUrl) {
        setTrackingUrl(newTrackingUrl);
      }

      // Get label document (base64 PDF)
      const labelDoc = data.documents?.find((d: any) => d.typeCode === 'label');
      const labelBase64 = labelDoc?.content || '';

      // Save to order
      await adminUpdateOrder(lookupId, {
        returnTrackingNumber: newTrackingNumber,
        returnTrackingUrl: newTrackingUrl,
        dhlShipmentBooked: true,
        dhlShipmentBookedAt: new Date().toISOString(),
        dhlReturnLabelBase64: labelBase64 // Store the label for later download
      });

      setOrder({
        ...order,
        returnTrackingNumber: newTrackingNumber || (order as any).returnTrackingNumber,
        returnTrackingUrl: newTrackingUrl || (order as any).returnTrackingUrl,
        dhlShipmentBooked: true,
        dhlShipmentBookedAt: new Date().toISOString(),
        dhlReturnLabelBase64: labelBase64
      } as any);

      const envLabel = data.environment === 'sandbox' ? ' (SANDBOX)' : '';
      toast.success(`DHL return shipment booked${envLabel}! Tracking: ${newTrackingNumber}`);
    } catch (err: any) {
      console.error('Error booking DHL shipment:', err);
      toast.error(`Could not book DHL return shipment: ${err.message}`);
    } finally {
      setBookingDhlShipment(false);
    }
  };

  const bookPostNordShipment = async () => {
    if (!order) {
      toast.error('Order missing, cannot book PostNord shipment');
      return;
    }

    const lookupId = (order.orderNumber as string) || (router.query.id as string);
    if (!lookupId) {
      toast.error('Order number missing, cannot book PostNord shipment');
      return;
    }

    // Get return address from order
    const ra = (order as any).returnAddress || {};
    const ci = order.customerInfo || {};
    
    const receiverAddress = ra.street ? ra : {
      firstName: ci.firstName,
      lastName: ci.lastName,
      street: ci.address,
      postalCode: ci.postalCode,
      city: ci.city,
      country: ci.country || 'SE',
      phone: ci.phone,
      email: ci.email
    };

    // Validate required fields
    if (!receiverAddress.street || !receiverAddress.postalCode || !receiverAddress.city) {
      toast.error('Return address is incomplete - cannot book PostNord shipment');
      return;
    }

    // Confirm booking
    const confirmBooking = window.confirm(
      `Book PostNord REK (Registered Mail) for order ${order.orderNumber}?\n\nRecipient:\n${receiverAddress.firstName || ''} ${receiverAddress.lastName || ''}\n${receiverAddress.street}\n${receiverAddress.postalCode} ${receiverAddress.city}`
    );
    if (!confirmBooking) return;

    try {
      setBookingPostNordShipment(true);

      // Get tomorrow's date for shipping
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const shippingDate = tomorrow.toISOString().split('T')[0];

      // Determine country code
      let countryCode = receiverAddress.country || 'SE';
      if (countryCode.length > 2) {
        const countryNameToCode: Record<string, string> = {
          'Sweden': 'SE', 'Sverige': 'SE',
          'Norway': 'NO', 'Norge': 'NO',
          'Denmark': 'DK', 'Danmark': 'DK',
          'Finland': 'FI',
          'Germany': 'DE', 'Deutschland': 'DE', 'Tyskland': 'DE',
        };
        countryCode = countryNameToCode[countryCode] || countryCode.substring(0, 2).toUpperCase();
      }

      const response = await fetch('/api/postnord/shipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          shippingDate,
          receiver: {
            name: `${receiverAddress.firstName || ''} ${receiverAddress.lastName || ''}`.trim() || 'Customer',
            street1: receiverAddress.street,
            postalCode: receiverAddress.postalCode,
            city: receiverAddress.city,
            countryCode,
            phone: receiverAddress.phone || '',
            email: receiverAddress.email || ''
          },
          withReceipt: false // Can be made configurable
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'PostNord booking failed');
      }

      // Save tracking info to order
      const newTrackingNumber = data.trackingNumber || data.shipmentId;
      
      await adminUpdateOrder(lookupId, {
        postnordShipmentBooked: true,
        postnordTrackingNumber: newTrackingNumber,
        postnordTrackingUrl: data.trackingUrl,
        postnordLabelBase64: data.labelBase64,
        postnordBookedAt: new Date().toISOString(),
        postnordServiceName: data.serviceName,
        returnTrackingNumber: newTrackingNumber,
        returnTrackingUrl: data.trackingUrl
      });

      // Update local state
      setOrder((prev: any) => prev ? {
        ...prev,
        postnordShipmentBooked: true,
        postnordTrackingNumber: newTrackingNumber,
        postnordTrackingUrl: data.trackingUrl,
        postnordLabelBase64: data.labelBase64,
        returnTrackingNumber: newTrackingNumber,
        returnTrackingUrl: data.trackingUrl
      } : prev);

      setTrackingNumber(newTrackingNumber);
      setTrackingUrl(data.trackingUrl || '');

      const envLabel = data.environment === 'sandbox' ? ' (SANDBOX)' : '';
      toast.success(`PostNord REK booked${envLabel}! Tracking: ${newTrackingNumber}`);
    } catch (err: any) {
      toast.error(`Could not book PostNord shipment: ${err.message}`);
    } finally {
      setBookingPostNordShipment(false);
    }
  };

  const bookDhlPickup = async () => {
    if (!order) {
      toast.error('Order missing, cannot book DHL pickup');
      return;
    }

    const lookupId = (order.orderNumber as string) || (router.query.id as string);
    if (!lookupId) {
      toast.error('Order number missing, cannot book DHL pickup');
      return;
    }

    // Get pickup address (either from pickupAddress or customerInfo)
    const pa = (order as any).pickupAddress || {};
    const ci = order.customerInfo || {};
    
    const pickupAddress = pa.street ? pa : {
      street: ci.address,
      postalCode: ci.postalCode,
      city: ci.city
    };

    if (!pickupAddress.street || !pickupAddress.postalCode || !pickupAddress.city) {
      toast.error('Pickup address missing');
      return;
    }

    const contactPhone = ci.phone || '';
    const contactName = `${ci.firstName || ''} ${ci.lastName || ''}`.trim();
    
    if (!contactPhone || !contactName) {
      toast.error('Contact details missing (name or phone)');
      return;
    }

    try {
      setBookingDhlPickup(true);

      // Calculate pickup date (tomorrow if after 14:00, otherwise today)
      const now = new Date();
      const pickupDate = new Date();
      if (now.getHours() >= 14) {
        pickupDate.setDate(pickupDate.getDate() + 1);
      }
      // Skip weekends
      if (pickupDate.getDay() === 0) pickupDate.setDate(pickupDate.getDate() + 1);
      if (pickupDate.getDay() === 6) pickupDate.setDate(pickupDate.getDate() + 2);

      // Call our DHL API endpoint
      const response = await fetch('/api/dhl/pickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupDate: pickupDate.toISOString().split('T')[0] + 'T10:00:00',
          closeTime: '18:00',
          location: 'reception',
          orderNumber: lookupId, // For DHL tracking reference
          address: {
            postalCode: pickupAddress.postalCode,
            cityName: pickupAddress.city,
            countryCode: 'SE',
            addressLine1: pickupAddress.street
          },
          contact: {
            companyName: ci.companyName,
            fullName: contactName,
            phone: contactPhone,
            email: ci.email
          },
          specialInstructions: `Order ${lookupId} - Documents for legalization`
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.details || data.error || 'DHL API error');
      }

      const confirmationNumber: string = data.dispatchConfirmationNumber || '';

      if (confirmationNumber) {
        setPickupTrackingNumber(confirmationNumber);
        
        // Save to order
        await adminUpdateOrder(lookupId, {
          pickupTrackingNumber: confirmationNumber,
          dhlPickupBooked: true,
          dhlPickupBookedAt: new Date().toISOString(),
          dhlPickupDate: pickupDate.toISOString()
        });

        setOrder({
          ...order,
          pickupTrackingNumber: confirmationNumber
        } as any);
      }

      const envLabel = data.environment === 'sandbox' ? ' (SANDBOX)' : '';
      toast.success(`DHL pickup booked${envLabel}! Confirmation: ${confirmationNumber}`);
    } catch (err: any) {
      console.error('Error booking DHL pickup:', err);
      toast.error(`Could not book DHL pickup: ${err.message}`);
    } finally {
      setBookingDhlPickup(false);
    }
  };

  // Download DHL return label PDF
  const downloadDhlLabel = () => {
    if (!order) {
      toast.error('Order missing');
      return;
    }

    const labelBase64 = (order as any).dhlReturnLabelBase64;
    if (!labelBase64) {
      // Fallback to generated label if no real label exists
      downloadDhlReturnLabel(order as any);
      return;
    }

    // Create blob from base64 and download
    const byteCharacters = atob(labelBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DHL-Returetikett-${order.orderNumber || 'order'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('DHL label downloaded');
  };

  // Create DHL pickup label and send to customer
  const createAndSendDhlPickupLabel = async () => {
    if (!order) {
      toast.error('Order missing');
      return;
    }

    const orderId = (order.orderNumber as string) || (router.query.id as string);
    if (!orderId) {
      toast.error('Order number missing');
      return;
    }

    setCreatingDhlPickupLabel(true);
    try {
      // Step 1: Get shipping settings (max price limit) via API
      let maxPriceEnabled = true;
      let maxPrice = 300;
      try {
        const settingsResponse = await fetch('/api/admin/shipping-settings');
        if (settingsResponse.ok) {
          const responseData = await settingsResponse.json();
          const pickupShippingSettings = responseData.settings || responseData;
          maxPriceEnabled = pickupShippingSettings.dhlPickupMaxPriceEnabled !== false;
          maxPrice = pickupShippingSettings.dhlPickupMaxPrice || 300;
          console.log('Pickup shipping settings loaded:', { maxPriceEnabled, maxPrice, pickupShippingSettings });
        }
      } catch (settingsErr) {
        console.error('Failed to load pickup shipping settings:', settingsErr);
        // Use defaults if settings fetch fails
      }

      // Step 2: Get pickup address for rate check
      const pa = (order as any).pickupAddress || {};
      const ci = order.customerInfo || {};
      const pickupAddress = {
        postalCode: pa.postalCode || ci.postalCode || '',
        cityName: pa.city || ci.city || '',
        countryCode: 'SE',
      };

      // Step 3: Get DHL rate quote first
      const ratesResponse = await fetch('/api/dhl/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver: pickupAddress,
          shipper: pickupAddress,
          isPickup: true, // Pickup shipment: Customer -> DOX
        })
      });

      const ratesData = await ratesResponse.json();

      if (!ratesResponse.ok || !ratesData.success) {
        // If rates API fails, show warning but allow manual override
        const proceed = window.confirm(
          `⚠️ Could not fetch DHL price: ${ratesData.details || ratesData.error || 'Unknown error'}\n\nDo you want to continue with the booking anyway?`
        );
        if (!proceed) {
          setCreatingDhlPickupLabel(false);
          return;
        }
      } else {
        // Check price against max limit
        const dhlPrice = ratesData.rate?.price || 0;
        const currency = ratesData.rate?.currency || 'SEK';
        
        if (maxPriceEnabled && dhlPrice > maxPrice) {
          toast.error(
            `❌ DHL price (${dhlPrice} ${currency}) exceeds max limit (${maxPrice} SEK). Please book manually via DHL website.`,
            { duration: 8000 }
          );
          setCreatingDhlPickupLabel(false);
          return;
        }

        // Show price confirmation
        const confirmBooking = window.confirm(
          `DHL pickup price: ${dhlPrice} ${currency}\n\nDo you want to create and send DHL label to customer?`
        );
        if (!confirmBooking) {
          setCreatingDhlPickupLabel(false);
          return;
        }
      }

      // Step 4: Proceed with creating and sending label
      const response = await fetch('/api/dhl/send-pickup-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.details || data.error || 'Could not create DHL label');
      }

      // Update local state
      if (data.trackingNumber) {
        setPickupTrackingNumber(data.trackingNumber);
      }

      // Refresh order
      await fetchOrder(orderId);

      const envLabel = data.environment === 'sandbox' ? ' (SANDBOX)' : '';
      toast.success(`${data.message}${envLabel}`);
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setCreatingDhlPickupLabel(false);
    }
  };

  // Send address confirmation email to customer via API (with clickable confirmation links)
  const sendAddressConfirmation = async (type: 'pickup' | 'return') => {
    if (!order) return;
    
    setSendingAddressConfirmation(true);
    try {
      const orderId = order.orderNumber || (router.query.id as string);
      const addressTypeText = type === 'pickup' ? 'pickup address' : 'return address';
      
      const response = await fetch('/api/address-confirmation/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, type })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not send confirmation email');
      }

      toast.success(`Confirmation email for ${addressTypeText} sent to ${order.customerInfo?.email}`);
      
      // Refresh order to update confirmation status
      await fetchOrder(router.query.id as string);
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setSendingAddressConfirmation(false);
    }
  };

  // Send embassy price confirmation email to customer
  const sendEmbassyPriceConfirmation = async (confirmedPrice: number) => {
    if (!order) return;
    
    setSendingEmbassyPriceConfirmation(true);
    try {
      const orderId = order.orderNumber || (router.query.id as string);
      
      // Calculate new total price
      // Get current total (excluding TBC items) and add the confirmed embassy price
      const currentTotalExcludingTBC = (order.pricingBreakdown || []).reduce((sum: number, item: any) => {
        if (item.isTBC) return sum;
        return sum + (item.total || 0);
      }, 0);
      const confirmedTotalPrice = currentTotalExcludingTBC + confirmedPrice;
      
      const response = await fetch('/api/embassy-price-confirmation/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId, 
          confirmedEmbassyPrice: confirmedPrice,
          confirmedTotalPrice
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not send price confirmation email');
      }

      toast.success(`Price confirmation email sent to ${order.customerInfo?.email}`);
      
      // Refresh order to update confirmation status
      await fetchOrder(router.query.id as string);
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setSendingEmbassyPriceConfirmation(false);
    }
  };

  // Check if embassy price confirmation is needed
  const needsEmbassyPriceConfirmation = (stepId: string): boolean => {
    return stepId === 'embassy_price_confirmation';
  };

  // Check if embassy price has been confirmed
  const isEmbassyPriceConfirmed = (): boolean => {
    if (!order) return false;
    const extOrder = order as any;
    return !!extOrder.embassyPriceConfirmed;
  };

  // Check if embassy price confirmation email has been sent
  const isEmbassyPriceConfirmationSent = (): boolean => {
    if (!order) return false;
    const extOrder = order as any;
    return !!extOrder.embassyPriceConfirmationSent;
  };

  // Check if embassy price was declined
  const isEmbassyPriceDeclined = (): boolean => {
    if (!order) return false;
    const extOrder = order as any;
    return !!extOrder.embassyPriceDeclined;
  };

  // Check if address confirmation is needed for a step
  const needsAddressConfirmation = (stepId: string): 'pickup' | 'return' | null => {
    if (stepId === 'order_verification' && order?.pickupService) {
      return 'pickup';
    }
    if (stepId === 'prepare_return') {
      const returnService = (order as any)?.returnService as string | undefined;
      if (returnService && ['own-delivery', 'office-pickup'].includes(returnService)) {
        return null;
      }
      return 'return';
    }
    return null;
  };

  // Check if address has been confirmed
  const isAddressConfirmed = (type: 'pickup' | 'return'): boolean => {
    if (!order) return false;
    const extOrder = order as any;
    return type === 'pickup' 
      ? !!extOrder.pickupAddressConfirmed 
      : !!extOrder.returnAddressConfirmed;
  };

  // Check if confirmation email has been sent
  const isConfirmationSent = (type: 'pickup' | 'return'): boolean => {
    if (!order) return false;
    const extOrder = order as any;
    return type === 'pickup'
      ? !!extOrder.pickupAddressConfirmationSent
      : !!extOrder.returnAddressConfirmationSent;
  };

  // Handle step update with address confirmation check
  const handleStepUpdateWithConfirmation = (
    stepId: string,
    status: ProcessingStep['status'],
    notes?: string,
    updatedStep?: Partial<ProcessingStep>
  ) => {
    const confirmationType = needsAddressConfirmation(stepId);
    
    // Check if completing a step that needs address confirmation
    if (status === 'completed' && confirmationType && !isAddressConfirmed(confirmationType)) {
      // Show warning modal
      setPendingStepUpdate({ stepId, status, notes, updatedStep });
      setShowAddressWarningModal(true);
      return;
    }

    // Check if completing embassy price confirmation step without customer confirmation
    if (status === 'completed' && stepId === 'embassy_price_confirmation' && !isEmbassyPriceConfirmed()) {
      setPendingStepUpdate({ stepId, status, notes, updatedStep });
      setShowEmbassyPriceWarningModal(true);
      return;
    }
    
    // Proceed with update
    updateProcessingStep(stepId, status, notes, updatedStep);
  };

  // Proceed with step update after warning confirmation
  const proceedWithStepUpdate = () => {
    if (pendingStepUpdate) {
      updateProcessingStep(
        pendingStepUpdate.stepId,
        pendingStepUpdate.status,
        pendingStepUpdate.notes,
        pendingStepUpdate.updatedStep
      );
    }
    setShowAddressWarningModal(false);
    setPendingStepUpdate(null);
  };

  const applyCustomerHistoryEntry = (entry: any) => {
    const ci = entry?.customerInfo || {};
    const pa = entry?.pickupAddress || {};
    setEditedCustomer({
      firstName: ci.firstName || '',
      lastName: ci.lastName || '',
      email: ci.email || '',
      phone: ci.phone || '',
      address: ci.address || '',
      postalCode: ci.postalCode || '',
      city: ci.city || '',
      country: ci.country || ''
    });
    setEditedPickupAddress({
      street: pa.street || '',
      postalCode: pa.postalCode || '',
      city: pa.city || '',
      country: pa.country || '',
      company: pa.company || '',
      name: pa.name || ''
    });
    toast.success('Previous customer info loaded – remember to save');
  };

  // Upload pickup label file (e.g. DHL-label)
  const handlePickupLabelUpload = async (file: File) => {
    if (!order) return;
    const orderId = (order.orderNumber as string) || (router.query.id as string);
    if (!orderId) {
      toast.error('Order number missing, cannot upload label');
      return;
    }

    // Enforce filename rule: must contain order number
    if (!file.name.includes(orderId)) {
      toast.error(`Filename must contain order number ${orderId}`);
      return;
    }

    setIsUploadingPickupLabel(true);

    try {
      const mod = await import('@/services/hybridOrderService');
      const uploadFiles = (mod as any).default?.uploadFiles || (mod as any).uploadFiles;
      if (typeof uploadFiles !== 'function') {
        toast.error('Cannot upload label right now');
        return;
      }

      const uploaded = await uploadFiles([file], orderId);
      const labelMeta = uploaded && uploaded.length > 0 ? uploaded[0] : null;
      if (!labelMeta) {
        toast.error('Could not upload label');
        return;
      }

      await adminUpdateOrder(orderId, { pickupLabelFile: labelMeta });
      setOrder({ ...order, pickupLabelFile: labelMeta } as ExtendedOrder);
      toast.success('Label uploaded');
    } catch (err) {
      toast.error('Could not upload label');
    } finally {
      setIsUploadingPickupLabel(false);
    }
  };

  const handlePickupLabelFileSelected = async (event: any) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await handlePickupLabelUpload(file);
    event.target.value = '';
  };

  // Send uploaded pickup label to customer via email
  const handleSendPickupLabel = async () => {
    if (!order) return;
    const orderId = (order.orderNumber as string) || (router.query.id as string);
    const customerEmail = order.customerInfo?.email;
    const labelFile: any = (order as any).pickupLabelFile;

    if (!customerEmail) {
      toast.error('Customer email missing');
      return;
    }

    if (!labelFile || !labelFile.downloadURL) {
      toast.error('No label uploaded yet');
      return;
    }

    setSendingPickupLabel(true);

    try {
      const db = getFirebaseDb();
      if (!db) {
        toast.error('Cannot connect to database to send email');
        return;
      }

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2a67aa;">Fraktsedel för upphämtning</h2>
          <p>Hej ${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''},</p>
          <p>Här är din fraktsedel för upphämtning av dokument för order <strong>${orderId}</strong>.</p>
          <p>Vänligen skriv ut fraktsedeln, sätt den tydligt på kuvertet och lämna in den enligt instruktionerna från transportören.</p>
          <p>Om du har några frågor är du välkommen att kontakta oss.</p>
          <p>Med vänliga hälsningar,<br/>Legaliseringstjänst</p>
        </div>
      `;

      const emailData: any = {
        to: customerEmail,
        subject: `Fraktsedel för upphämtning – order ${orderId}`,
        html: emailHtml,
        attachments: [
          {
            filename: labelFile.originalName || `Pickup-label-${orderId}.pdf`,
            // Backend-funktionen som skickar e-post hämtar själv filen från Storage
            downloadURL: labelFile.downloadURL,
            storagePath: labelFile.storagePath,
            contentType: labelFile.type || 'application/pdf',
          },
        ],
        orderId,
        orderNumber: order.orderNumber || null,
        customerEmail,
        type: 'pickup_label',
        createdAt: serverTimestamp(),
        status: 'pending',
      };

      await addDoc(collection(db, 'emailQueue'), emailData);
      toast.success('Label sent to customer');
    } catch (err) {
      toast.error('Could not send label via email');
    } finally {
      setSendingPickupLabel(false);
    }
  };

  // Save pickup tracking information
  const savePickupTrackingInfo = async () => {
    if (!order) return;
    const orderId = router.query.id as string;
    setSavingTracking(true);

    try {
      await adminUpdateOrder(orderId, {
        pickupTrackingNumber
      });
      setOrder({ ...order, pickupTrackingNumber });
      toast.success('Pickup tracking saved');
    } catch (err) {
      console.error('Error saving pickup tracking info:', err);
      toast.error('Could not save pickup tracking');
    } finally {
      setSavingTracking(false);
    }
  };

  // Save editable customer info and append previous values to history
  const saveCustomerInfo = async () => {
    if (!order) return;
    const orderId = router.query.id as string;
    if (!orderId) return;

    const currentCustomer = order.customerInfo || {};
    const newCustomer = {
      firstName: editedCustomer.firstName.trim(),
      lastName: editedCustomer.lastName.trim(),
      email: editedCustomer.email.trim(),
      phone: editedCustomer.phone.trim(),
      address: editedCustomer.address.trim(),
      postalCode: editedCustomer.postalCode.trim(),
      city: editedCustomer.city.trim(),
      country: editedCustomer.country.trim()
    };

    const currentPickup: any = order.pickupAddress || {};
    const newPickup: any = order.pickupService
      ? {
          street: editedPickupAddress.street.trim(),
          postalCode: editedPickupAddress.postalCode.trim(),
          city: editedPickupAddress.city.trim(),
          country: editedPickupAddress.country.trim(),
          company: editedPickupAddress.company.trim(),
          name: editedPickupAddress.name.trim()
        }
      : currentPickup;

    const hasCustomerChanges =
      (currentCustomer.firstName || '') !== newCustomer.firstName ||
      (currentCustomer.lastName || '') !== newCustomer.lastName ||
      (currentCustomer.email || '') !== newCustomer.email ||
      (currentCustomer.phone || '') !== newCustomer.phone ||
      (currentCustomer.address || '') !== newCustomer.address ||
      (currentCustomer.postalCode || '') !== newCustomer.postalCode ||
      (currentCustomer.city || '') !== newCustomer.city ||
      (currentCustomer.country || '') !== newCustomer.country;

    const hasPickupChanges = order.pickupService && (
      (currentPickup.street || '') !== newPickup.street ||
      (currentPickup.postalCode || '') !== newPickup.postalCode ||
      (currentPickup.city || '') !== newPickup.city ||
      (currentPickup.country || '') !== newPickup.country ||
      (currentPickup.company || '') !== newPickup.company ||
      (currentPickup.name || '') !== newPickup.name
    );

    if (!hasCustomerChanges && !hasPickupChanges) {
      toast('Inga ändringar att spara');
      return;
    }

    const actor = (adminProfile?.name || currentUser?.displayName || currentUser?.email || currentUser?.uid || 'Admin') as string;
    const historyEntry = {
      timestamp: new Date().toISOString(),
      changedBy: actor,
      customerInfo: currentCustomer,
      pickupAddress: currentPickup
    };

    const updatedHistory = [...(order.customerHistory || []), historyEntry];

    setSavingCustomerInfo(true);

    try {
      const updates: any = {
        customerInfo: newCustomer,
        customerHistory: updatedHistory
      };

      if (order.pickupService) {
        updates.pickupAddress = newPickup;
      }

      await adminUpdateOrder(orderId, updates);

      setOrder({
        ...order,
        customerInfo: newCustomer,
        pickupAddress: updates.pickupAddress || order.pickupAddress,
        customerHistory: updatedHistory
      } as ExtendedOrder);

      toast.success('Customer information saved');
    } catch (err) {
      console.error('Error saving customer info:', err);
      toast.error('Could not save customer information');
    } finally {
      setSavingCustomerInfo(false);
    }
  };

  // Add a new internal note (append-only)
  const addInternalNote = async () => {
    const text = internalNoteText.trim();
    if (!text) return;
    try {
      const db = getFirebaseDb();
      const orderId = router.query.id as string;
      if (!db || !orderId) return;
      const actor = (adminProfile?.name || currentUser?.displayName || currentUser?.email || currentUser?.uid || 'Admin') as string;
      await addDoc(collection(db, 'orders', orderId, 'internalNotes'), {
        content: text,
        createdAt: serverTimestamp(),
        createdBy: actor,
        readBy: currentUser?.uid ? [currentUser.uid] : [] // Mark as read by creator
      });
      setInternalNoteText('');
      toast.success('Note added');
    } catch (e) {
      toast.error('Could not add note');
    }
  };

  // Mark all unread notes as read when opening Notes tab
  const markNotesAsRead = async () => {
    if (!currentUser?.uid) return;
    const db = getFirebaseDb();
    const orderId = router.query.id as string;
    if (!db || !orderId) return;

    const unreadNotes = internalNotesList.filter(note => {
      const readBy = note.readBy || [];
      const createdByCurrentUser = note.createdBy === currentUser.uid || 
        note.createdBy === currentUser.email ||
        note.createdBy === currentUser.displayName;
      return !createdByCurrentUser && !readBy.includes(currentUser.uid);
    });

    // Update each unread note to add current user to readBy array
    const { doc, updateDoc, arrayUnion } = await import('firebase/firestore');
    for (const note of unreadNotes) {
      try {
        const noteRef = doc(db, 'orders', orderId, 'internalNotes', note.id);
        await updateDoc(noteRef, {
          readBy: arrayUnion(currentUser.uid)
        });
      } catch (e) {
        // Silently fail - not critical
      }
    }
    setUnreadNotesCount(0);
  };

  // Document request templates (with both Swedish and English messages)
  const documentRequestTemplates = [
    { id: 'custom', name: 'Custom message', messageSv: '', messageEn: '' },
    { id: 'missing_original', name: 'Missing original document', messageSv: 'Vi behöver originaldokumentet för att kunna fortsätta med legaliseringen. Vänligen ladda upp en kopia av originalet.', messageEn: 'We need the original document to proceed with the legalization. Please upload a copy of the original.' },
    { id: 'unclear_scan', name: 'Unclear scan', messageSv: 'Den uppladdade skanningen är otydlig eller har dålig kvalitet. Vänligen ladda upp en ny, tydligare version.', messageEn: 'The uploaded scan is unclear or of poor quality. Please upload a new, clearer version.' },
    { id: 'missing_signature', name: 'Missing signature', messageSv: 'Dokumentet saknar nödvändig signatur. Vänligen ladda upp en signerad version av dokumentet.', messageEn: 'The document is missing a required signature. Please upload a signed version of the document.' },
    { id: 'missing_translation', name: 'Missing translation', messageSv: 'Vi behöver en auktoriserad översättning av dokumentet. Vänligen ladda upp översättningen.', messageEn: 'We need an authorized translation of the document. Please upload the translation.' },
    { id: 'additional_document', name: 'Additional document', messageSv: 'Vi behöver ett kompletterande dokument för att slutföra ärendet.', messageEn: 'We need an additional document to complete the case.' },
    { id: 'id_verification', name: 'ID verification', messageSv: 'Vi behöver en kopia av din legitimation (pass eller nationellt ID-kort) för att verifiera din identitet.', messageEn: 'We need a copy of your ID (passport or national ID card) to verify your identity.' }
  ];

  // Get message in customer's language
  const getTemplateMessage = (templateId: string) => {
    const template = documentRequestTemplates.find(t => t.id === templateId);
    if (!template) return '';
    const isEnglish = (order as any)?.locale === 'en';
    return isEnglish ? template.messageEn : template.messageSv;
  };

  // Send document request to customer
  const sendDocumentRequest = async () => {
    if (!documentRequestMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSendingDocumentRequest(true);
    try {
      const orderId = router.query.id as string;
      const response = await fetch('/api/document-request/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          templateId: documentRequestTemplate,
          customMessage: documentRequestMessage
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not send request');
      }

      toast.success('Document request has been sent to the customer');
      setShowDocumentRequestModal(false);
      setDocumentRequestMessage('');
      setDocumentRequestTemplate('custom');
    } catch (error: any) {
      toast.error(error.message || 'Could not send request');
    } finally {
      setSendingDocumentRequest(false);
    }
  };

  // Mark supplementary files as viewed
  const markSupplementaryAsViewed = async () => {
    if (!currentUser?.uid) return;
    const orderId = router.query.id as string;
    if (!orderId) return;

    try {
      await adminUpdateOrder(orderId, {
        [`supplementaryViewedBy.${currentUser.uid}`]: new Date().toISOString()
      });
      setUnreadSupplementaryCount(0);
    } catch (e) {
      // Silently fail
    }
  };

  // Add a new note
  const addNote = async () => {
    if (!newNote.trim() || !order) return;

    const note: AdminNote = {
      id: Date.now().toString(),
      content: newNote.trim(),
      createdAt: new Date(),
      createdBy: (adminProfile?.name || currentUser?.displayName || currentUser?.email || currentUser?.uid || 'Admin') as string,
      type: noteType
    };

    const updatedOrder = {
      ...order,
      adminNotes: [...(order.adminNotes || []), note]
    };

    try {
      const orderId = router.query.id as string;
      await adminUpdateOrder(orderId, { adminNotes: updatedOrder.adminNotes });
      setOrder(updatedOrder);
      setNewNote('');
      toast.success('Note added');
    } catch (err) {
      console.error('Error adding note:', err);
      toast.error('Could not add note');
    }
  };

  // Remove a service from the order
  const handleRemoveService = async (serviceToRemove: string) => {
    if (!order) return;
    const orderId = router.query.id as string;

    setRemovingService(serviceToRemove);
    try {
      let updatedServices = Array.isArray(order.services) ? [...order.services] : [];
      let updatedScannedCopies = order.scannedCopies;
      let updatedPickupService = order.pickupService;
      let updatedReturnService = order.returnService;

      // Handle removal of additional services
      if (serviceToRemove === 'scanned_copies') {
        updatedScannedCopies = false;
      } else if (serviceToRemove === 'pickup_service') {
        updatedPickupService = false;
      } else if (serviceToRemove === 'return') {
        updatedReturnService = '';
      } else {
        // Remove from main services array
        updatedServices = updatedServices.filter(service => service !== serviceToRemove);
      }

      // Recalculate pricing with the updated services
      const { calculateOrderPrice } = await import('@/firebase/pricingService');
      const pricingResult = await calculateOrderPrice({
        country: order.country,
        services: updatedServices,
        quantity: order.quantity,
        expedited: order.expedited,
        deliveryMethod: order.deliveryMethod,
        returnService: updatedReturnService,
        returnServices: [],
        scannedCopies: updatedScannedCopies,
        pickupService: updatedPickupService
      });

      // Update processing steps - remove steps related to the removed service
      const updatedProcessingSteps = (order.processingSteps || initializeProcessingSteps(order))
        .filter(step => {
          // Keep steps that are not specific to the removed service
          if (serviceToRemove === 'chamber' && step.id === 'chamber_processing') return false;
          if (serviceToRemove === 'notarization' && step.id === 'notarization') return false;
          if (serviceToRemove === 'translation' && step.id === 'translation') return false;
          if (serviceToRemove === 'ud' && step.id === 'ud_processing') return false;
          if (serviceToRemove === 'embassy' && (step.id === 'embassy_processing' || step.id === 'embassy_delivery' || step.id === 'embassy_pickup')) return false;
          if (serviceToRemove === 'apostille' && (step.id === 'apostille' || step.id === 'apostille_delivery' || step.id === 'apostille_pickup')) return false;
          if (serviceToRemove === 'scanned_copies' && step.id === 'scanning') return false;
          return true;
        });

      // Update the order
      const updatedOrder = {
        ...order,
        services: updatedServices,
        scannedCopies: updatedScannedCopies,
        pickupService: updatedPickupService,
        returnService: updatedReturnService,
        totalPrice: pricingResult.totalPrice,
        pricingBreakdown: pricingResult.breakdown,
        processingSteps: updatedProcessingSteps
      };

      await adminUpdateOrder(orderId, {
        services: updatedServices,
        scannedCopies: updatedScannedCopies,
        pickupService: updatedPickupService,
        returnService: updatedReturnService,
        totalPrice: pricingResult.totalPrice,
        pricingBreakdown: pricingResult.breakdown,
        processingSteps: updatedProcessingSteps
      });

      setOrder(updatedOrder);
      setProcessingSteps(updatedProcessingSteps);
      toast.success(`Service "${getServiceName(serviceToRemove)}" has been removed from the order`);
    } catch (err) {
      console.error('Error removing service:', err);
      toast.error('Could not remove service from order');
    } finally {
      setRemovingService(null);
    }
  };

  // Function to get service name (English for admin panel)
  const getServiceName = (serviceId: string) => {
    switch (serviceId) {
      case 'apostille':
        return 'Apostille';
      case 'notarization':
      case 'notarisering':
        return 'Notarization';
      case 'embassy':
      case 'ambassad':
        return 'Embassy Legalization';
      case 'translation':
      case 'oversattning':
        return 'Translation';
      case 'utrikesdepartementet':
      case 'ud':
        return 'Ministry of Foreign Affairs';
      case 'chamber':
        return 'Chamber of Commerce';
      case 'return':
        return 'Return Shipping';
      case 'pickup_service':
        return 'Document Pickup';
      case 'premium_pickup':
        return 'Premium Pickup';
      case 'scanned_copies':
        return 'Scanned Copies';
      case 'express':
        return 'Express Processing';
      default:
        return serviceId;
    }
  };

  // Function to check if a step is an authority service
  const isAuthorityService = (stepId: string) => {
    return [
      // Notarization
      'notarization', // legacy single-step
      'notarization_delivery',
      'notarization_pickup',
      // Chamber
      'chamber_processing', // legacy single-step
      'chamber_delivery',
      'chamber_pickup',
      // UD
      'ud_processing', // legacy single-step
      'ud_delivery',
      'ud_pickup',
      // Translation
      'translation', // legacy single-step
      'translation_delivery',
      'translation_pickup',
      // Apostille (always single-step)
      'apostille',
      'apostille_delivery',
      'apostille_pickup',
      // Embassy
      'embassy_delivery',
      'embassy_pickup',
      'embassy_processing' // legacy
    ].includes(stepId);
  };

  // Function to get service status based on processing steps (English for admin panel)
  const getServiceStatus = (serviceId: string) => {
    if (!processingSteps || processingSteps.length === 0) return 'pending';

    const aggregateStatuses = (steps: ProcessingStep[]) => {
      if (!steps || steps.length === 0) return 'pending';

      const statuses = steps.map((s) => s.status);

      if (statuses.every((s) => s === 'skipped')) {
        return 'skipped';
      }

      if (statuses.every((s) => s === 'completed' || s === 'skipped')) {
        return 'completed';
      }

      if (statuses.some((s) => s === 'in_progress' || s === 'completed')) {
        return 'in progress';
      }

      return 'pending';
    };

    // Special handling for embassy which now has separate delivery/pickup steps
    if (serviceId === 'embassy' || serviceId === 'ambassad') {
      const embassySteps = processingSteps.filter((s) =>
        ['embassy_delivery', 'embassy_pickup', 'embassy_processing'].includes(s.id)
      );
      return aggregateStatuses(embassySteps as ProcessingStep[]);
    }

    // Multi-step services: notarization, translation, UD, chamber
    const multiStepServiceMap: { [key: string]: string[] } = {
      notarization: ['notarization_delivery', 'notarization_pickup', 'notarization'],
      notarisering: ['notarization_delivery', 'notarization_pickup', 'notarization'],
      translation: ['translation_delivery', 'translation_pickup', 'translation'],
      oversattning: ['translation_delivery', 'translation_pickup', 'translation'],
      utrikesdepartementet: ['ud_delivery', 'ud_pickup', 'ud_processing'],
      ud: ['ud_delivery', 'ud_pickup', 'ud_processing'],
      chamber: ['chamber_delivery', 'chamber_pickup', 'chamber_processing'],
      apostille: ['apostille_delivery', 'apostille_pickup', 'apostille']
    };

    const multiStepIds = multiStepServiceMap[serviceId];
    if (multiStepIds) {
      const stepsForService = processingSteps.filter((s) => multiStepIds.includes(s.id));
      return aggregateStatuses(stepsForService as ProcessingStep[]);
    }

    // Map remaining service IDs to single processing step IDs
    const serviceToStepMap: { [key: string]: string } = {
      apostille: 'apostille',
      scanned_copies: 'scanning',
      pickup_service: 'document_receipt', // Map pickup to document receipt step
      return: 'return_shipping'
    };

    const stepId = serviceToStepMap[serviceId];
    if (!stepId) return 'pending';

    const step = processingSteps.find((s) => s.id === stepId) as ProcessingStep | undefined;
    if (!step) return 'pending';

    switch (step.status) {
      case 'completed':
        return 'completed';
      case 'in_progress':
        return 'in progress';
      case 'pending':
        return 'pending';
      case 'skipped':
        return 'skipped';
      default:
        return 'pending';
    }
  };

  // Function to get status color class (English status values)
  const getServiceStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'in progress':
        return 'text-blue-600 bg-blue-50';
      case 'pending':
        return 'text-gray-600 bg-gray-50';
      case 'skipped':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';

    try {
      let date: Date;

      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        // Firebase Timestamp
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        // Already a Date object
        date = timestamp;
      } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        // String or number timestamp
        date = new Date(timestamp);
      } else {
        // Try to convert from object
        date = new Date(timestamp);
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'N/A';
      }

      return new Intl.DateTimeFormat('sv-SE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error, timestamp);
      return 'N/A';
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProcessingStepCardClasses = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'in_progress':
        return 'border-blue-200 bg-blue-50';
      case 'pending':
        return 'border-gray-200 bg-white';
      case 'skipped':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  return (
    <>
      <Head>
        <title>Order Details | Admin | Legaliseringstjänst</title>
        <meta name="description" content="Comprehensive order management system" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="bg-gray-100 min-h-screen">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Link href="/admin/orders" className="text-gray-500 hover:text-gray-700 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">
                  {loading ? 'Loading...' : `Order ${order?.orderNumber || (router.query.id as string || '')}`}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => signOut()}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Sign Out
                </button>
                <Link href="/admin" className="text-primary-600 hover:text-primary-800">
                  Dashboard
                </Link>
                <Link href="/admin/orders" className="text-primary-600 hover:text-primary-800">
                  All Orders
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
              <button
                onClick={() => fetchOrder()}
                className="ml-4 underline text-red-700 hover:text-red-900"
              >
                Försök igen
              </button>
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-600">Loading order details...</p>
            </div>
          ) : order ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Quick Actions Bar */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(order.status)}`}>
                      {order.status === 'pending' ? 'Pending' :
                       order.status === 'processing' ? 'Processing' :
                       order.status === 'shipped' ? 'Shipped' :
                       order.status === 'delivered' ? 'Delivered' :
                       order.status === 'cancelled' ? 'Cancelled' : order.status}
                    </span>
                    <span className="text-lg font-semibold text-gray-900">{getComputedTotal()} kr</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={editedStatus}
                      onChange={(e) => setEditedStatus(e.target.value as Order['status'])}
                      className="border border-gray-300 rounded px-3 py-2 text-sm"
                      disabled={isUpdating}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button
                      onClick={handleStatusUpdate}
                      disabled={isUpdating || order.status === editedStatus}
                      className="px-4 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                    >
                      {isUpdating ? 'Updating...' : 'Update status'}
                    </button>
                    <button
                      onClick={handleDownloadCover}
                      className="px-3 py-1 border border-gray-300 rounded text-sm bg-white text-gray-700 hover:bg-gray-50 flex items-center"
                      title="Download packing slip as PDF"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Packing slip PDF
                    </button>
                    <button
                      onClick={handleDownloadOrderConfirmation}
                      className="px-3 py-1 border border-gray-300 rounded text-sm bg-white text-gray-700 hover:bg-gray-50 flex items-center"
                      title="Download order confirmation as PDF"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Order confirmation PDF
                    </button>
                    <button
                      onClick={handlePrintCover}
                      className="px-3 py-1 border border-gray-300 rounded text-sm bg-white text-gray-700 hover:bg-gray-50 flex items-center"
                      title="Print packing slip"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-3a2 2 0 00-2-2h-2V7a2 2 0 00-2-2H9a2 2 0 00-2 2v3H5a2 2 0 00-2 2v3a2 2 0 002 2h2m2 0h6v4H7v-4h6z" />
                      </svg>
                      Print
                    </button>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <nav className="flex">
                  {[
                    { id: 'overview', label: 'Overview', icon: '📋' },
                    { id: 'processing', label: 'Processing', icon: '⚙️' },
                    { id: 'services', label: 'Services', icon: '🧩' },
                    { id: 'price', label: 'Price', icon: '💰' },
                    { id: 'files', label: 'Files', icon: '📎' },
                    { id: 'invoice', label: 'Invoice', icon: '🧾' },
                    { id: 'notes', label: 'Notes', icon: '📝' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        if (tab.id === 'notes') {
                          markNotesAsRead();
                        }
                        if (tab.id === 'files') {
                          markSupplementaryAsViewed();
                        }
                      }}
                      className={`relative flex items-center px-4 py-2 mr-2 rounded-md font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                      }`}
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.label}
                      {/* Unread notes badge */}
                      {tab.id === 'notes' && unreadNotesCount > 0 && activeTab !== 'notes' && (
                        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full">
                          {unreadNotesCount > 9 ? '9+' : unreadNotesCount}
                        </span>
                      )}
                      {/* Unread supplementary files badge */}
                      {tab.id === 'files' && unreadSupplementaryCount > 0 && activeTab !== 'files' && (
                        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full">
                          {unreadSupplementaryCount > 9 ? '9+' : unreadSupplementaryCount}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Order Summary Card */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                      <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-lg font-medium text-gray-800">Order overview</h3>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Order Details */}
                          <div className="lg:col-span-2 space-y-4">
                            {/* Basic Order Info + compact services */}
                            <div>
                              <h3 className="text-sm font-semibold mb-1 text-gray-800">
                                {t('order.summary.orderDetails', 'Orderinformation')}
                              </h3>
                              {(() => {
                                const c = getCountryInfo(order.country);
                                return (
                                  <div className="space-y-0.5 text-xs">
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-500">
                                        {t('order.summary.documentType', 'Dokumenttyp')}:
                                      </span>
                                      <span className="font-medium text-gray-900">
                                        {order.documentType === 'birthCertificate'
                                          ? t('documents.birthCertificate', 'Födelsebevis')
                                          : order.documentType === 'marriageCertificate'
                                          ? t('documents.marriageCertificate', 'Vigselbevis')
                                          : order.documentType === 'diploma'
                                          ? t('documents.diploma', 'Examensbevis')
                                          : order.documentType === 'commercial'
                                          ? t('documents.commercialDocuments', 'Handelsdokument')
                                          : order.documentType === 'powerOfAttorney'
                                          ? t('documents.powerOfAttorney', 'Fullmakt')
                                          : t('documents.other', 'Annat dokument')}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-500">
                                        {t('order.summary.country', 'Land')}:
                                      </span>
                                      <span className="flex items-center space-x-1 font-medium text-gray-900">
                                        <span aria-hidden="true">
                                          <CountryFlag code={c.code || order.country || ''} size={16} />
                                        </span>
                                        <span>{c.name || c.code}</span>
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-500">
                                        {t('order.summary.quantity', 'Number of documents')}:
                                      </span>
                                      <span className="font-medium text-gray-900">{order.quantity}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-500">
                                        {t('admin.orderDetail.labels.source', 'Source')}:
                                      </span>
                                      <span className="font-medium text-gray-900">
                                        {order.documentSource === 'original'
                                          ? t('admin.orderDetail.source.original', 'Original document')
                                          : t('admin.orderDetail.source.files', 'Uploaded files')}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-500">
                                        {t('admin.orderDetail.labels.customerRef', 'Customer ref')}:
                                      </span>
                                      <span className="font-medium text-gray-900">{order.invoiceReference}</span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Processing Steps Overview */}
                            <div>
                              <h3 className="text-xs font-semibold uppercase tracking-wide mb-1 text-gray-700">Processing steps</h3>
                              <div className="space-y-2">
                                {processingSteps.map((step, index) => (
                                  <div key={step.id} className={`flex items-center justify-between px-3 py-2 rounded-md ${getProcessingStepCardClasses(step.status)}`}>
                                    <div className="flex items-center">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-3 ${
                                        step.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        step.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                        step.status === 'pending' ? 'bg-gray-100 text-gray-600' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {step.status === 'completed' ? '✓' :
                                         step.status === 'in_progress' ? (
                                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                                         ) :
                                         step.status === 'pending' ? index + 1 : '✗'}
                                      </div>
                                      <div>
                                        <span className="font-medium text-sm">{step.name}</span>
                                        <div className="text-xs text-gray-500">{step.description}</div>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className={`text-xs font-medium capitalize px-2 py-1 rounded ${
                                        step.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        step.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                        step.status === 'pending' ? 'bg-gray-100 text-gray-600' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {step.status === 'completed' ? 'Completed' :
                                         step.status === 'in_progress' ? 'In progress' :
                                         step.status === 'pending' ? 'Pending' : 'Skipped'}
                                      </span>
                                      {step.status === 'completed' && step.completedAt && (
                                        <span className="text-xs text-gray-500">
                                          {formatDate(step.completedAt)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-2">
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('processing')}
                                  className="text-primary-600 text-sm underline"
                                >
                                  Manage processing →
                                </button>
                              </div>
                            </div>

                            {/* Pricing Breakdown removed from Overview as requested */}

                            {/* Notes summary in Overview */}
                            <div>
                              <h3 className="text-lg font-medium mb-4">Notes</h3>
                              <div className="space-y-3">
                                {internalNotesList.length === 0 && (
                                  <div className="text-sm text-gray-500">No notes yet</div>
                                )}
                                {internalNotesList.slice(0, 5).map((n) => (
                                  <div key={n.id} className="border border-gray-200 rounded p-3 bg-white">
                                    <div className="whitespace-pre-wrap text-sm text-gray-800">{n.content}</div>
                                    <div className="mt-2 text-xs text-gray-500">
                                      Created {formatDate(n.createdAt)} by {n.createdBy || 'Unknown'}
                                    </div>
                                  </div>
                                ))}
                                {internalNotesList.length > 5 && (
                                  <div className="text-sm text-gray-600">Showing the latest 5 notes</div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('processing')}
                                  className="text-primary-600 text-sm underline"
                                >
                                  View all notes →
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Customer Info Sidebar */}
                          <div className="space-y-6">
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                              <h3 className="text-lg font-medium mb-4">Customer information</h3>
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">First name</label>
                                    <input
                                      type="text"
                                      value={editedCustomer.firstName}
                                      onChange={(e) => setEditedCustomer({ ...editedCustomer, firstName: e.target.value })}
                                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">Last name</label>
                                    <input
                                      type="text"
                                      value={editedCustomer.lastName}
                                      onChange={(e) => setEditedCustomer({ ...editedCustomer, lastName: e.target.value })}
                                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Email</label>
                                  <input
                                    type="email"
                                    value={editedCustomer.email}
                                    onChange={(e) => setEditedCustomer({ ...editedCustomer, email: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Phone</label>
                                  <input
                                    type="tel"
                                    value={editedCustomer.phone}
                                    onChange={(e) => setEditedCustomer({ ...editedCustomer, phone: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Address</label>
                                  <input
                                    type="text"
                                    value={editedCustomer.address}
                                    onChange={(e) => setEditedCustomer({ ...editedCustomer, address: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm mb-1"
                                  />
                                  <div className="grid grid-cols-2 gap-2 mt-1">
                                    <input
                                      type="text"
                                      placeholder="Postal code"
                                      value={editedCustomer.postalCode}
                                      onChange={(e) => setEditedCustomer({ ...editedCustomer, postalCode: e.target.value })}
                                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                                    />
                                    <input
                                      type="text"
                                      placeholder="City"
                                      value={editedCustomer.city}
                                      onChange={(e) => setEditedCustomer({ ...editedCustomer, city: e.target.value })}
                                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                                    />
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="Country"
                                    value={editedCustomer.country}
                                    onChange={(e) => setEditedCustomer({ ...editedCustomer, country: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm mt-1"
                                  />
                                </div>

                                {order.pickupService && (
                                  <div className="mt-4 border-t border-gray-200 pt-3 space-y-2">
                                    <p className="text-sm font-medium text-gray-700">Pickup address</p>
                                    <input
                                      type="text"
                                      placeholder="Company name"
                                      value={editedPickupAddress.company}
                                      onChange={(e) => setEditedPickupAddress({ ...editedPickupAddress, company: e.target.value })}
                                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Contact name"
                                      value={editedPickupAddress.name}
                                      onChange={(e) => setEditedPickupAddress({ ...editedPickupAddress, name: e.target.value })}
                                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Street address"
                                      value={editedPickupAddress.street}
                                      onChange={(e) => setEditedPickupAddress({ ...editedPickupAddress, street: e.target.value })}
                                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                      <input
                                        type="text"
                                        placeholder="Postal code"
                                        value={editedPickupAddress.postalCode}
                                        onChange={(e) => setEditedPickupAddress({ ...editedPickupAddress, postalCode: e.target.value })}
                                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                                      />
                                      <input
                                        type="text"
                                        placeholder="City"
                                        value={editedPickupAddress.city}
                                        onChange={(e) => setEditedPickupAddress({ ...editedPickupAddress, city: e.target.value })}
                                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                                      />
                                    </div>
                                    <input
                                      type="text"
                                      placeholder="Country"
                                      value={editedPickupAddress.country}
                                      onChange={(e) => setEditedPickupAddress({ ...editedPickupAddress, country: e.target.value })}
                                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                    />
                                  </div>
                                )}

                                <div className="mt-4 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={saveCustomerInfo}
                                    disabled={savingCustomerInfo}
                                    className="px-3 py-1.5 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {savingCustomerInfo ? 'Saving...' : 'Save customer info'}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Customer history */}
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                              <h3 className="text-lg font-medium mb-3">Previous customer details</h3>
                              {order.customerHistory && order.customerHistory.length > 0 ? (
                                <div className="space-y-2 max-h-64 overflow-y-auto text-sm">
                                  {order.customerHistory
                                    .slice()
                                    .reverse()
                                    .slice(0, 5)
                                    .map((h: any, idx: number) => (
                                      <div key={idx} className="border border-gray-200 rounded p-2 bg-gray-50">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="font-medium text-gray-800">
                                            {h.customerInfo?.firstName || ''} {h.customerInfo?.lastName || ''}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => applyCustomerHistoryEntry(h)}
                                            className="text-xs text-primary-600 underline"
                                          >
                                            Load
                                          </button>
                                        </div>
                                        <div className="text-xs text-gray-600">
                                          {h.customerInfo?.address && (
                                            <div>
                                              {h.customerInfo.address}, {h.customerInfo.postalCode} {h.customerInfo.city}
                                            </div>
                                          )}
                                          <div>{h.customerInfo?.email}</div>
                                          <div>{h.customerInfo?.phone}</div>
                                          <div className="mt-1 text-[11px] text-gray-500">
                                            Updated {formatDate(h.timestamp)} by {h.changedBy || 'Unknown'}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">No history yet</p>
                              )}
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                              <h3 className="text-lg font-medium mb-4">Quick actions</h3>
                              <div className="space-y-2">
                                {invoices.length === 0 && (
                                  <button
                                    onClick={handleCreateInvoice}
                                    disabled={creatingInvoice}
                                    className="w-full flex items-center justify-center py-2 px-4 border border-primary-300 rounded-md text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 disabled:opacity-50"
                                  >
                                    {creatingInvoice ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                                        Creating invoice...
                                      </>
                                    ) : (
                                      <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Create invoice
                                      </>
                                    )}
                                  </button>
                                )}
                                {invoices.length > 0 && (
                                  <button
                                    onClick={() => setActiveTab('invoice')}
                                    className="w-full flex items-center justify-center py-2 px-4 border border-primary-300 rounded-md text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    View invoices ({invoices.length})
                                  </button>
                                )}
                                <Link
                                  href={`mailto:${order.customerInfo?.email || ''}?subject=Order ${order?.orderNumber || (router.query.id as string || '')}`}
                                  className={`w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md text-sm font-medium ${
                            order.customerInfo?.email 
                              ? 'text-gray-700 bg-white hover:bg-gray-50' 
                              : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                          }`}
                                  onClick={(e) => {
                            if (!order.customerInfo?.email) {
                              e.preventDefault();
                            }
                          }}
                        >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  Send email
                                </Link>
                                <button
                                  onClick={() => window.print()}
                                  className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                  </svg>
                                  Print
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Services Tab */}
                {activeTab === 'services' && (
                  <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium mb-4">Order Services</h3>
                      {(() => {
                        const baseServices: string[] = Array.isArray(order.services) ? order.services : [];
                        const extraServices: string[] = [];
                        if (order.pickupService) extraServices.push('pickup_service');
                        if ((order as any).premiumPickup) extraServices.push('premium_pickup');
                        if (order.scannedCopies) extraServices.push('scanned_copies');
                        if (order.expedited) extraServices.push('express');
                        if (order.returnService) extraServices.push('return');
                        const allServices = [...baseServices, ...extraServices];

                        const currentSet = new Set(allServices);
                        const possibleServices: { id: string; label: string }[] = [
                          // Main legalization services
                          { id: 'notarization', label: getServiceName('notarization') },
                          { id: 'translation', label: getServiceName('translation') },
                          { id: 'chamber', label: getServiceName('chamber') },
                          { id: 'ud', label: getServiceName('ud') },
                          { id: 'embassy', label: getServiceName('embassy') },
                          { id: 'apostille', label: getServiceName('apostille') },
                          // Pickup options
                          { id: 'pickup_service', label: 'Document Pickup (Standard)' },
                          { id: 'premium_pickup', label: 'Document Pickup (Premium/Express)' },
                          // Additional services
                          { id: 'scanned_copies', label: 'Scanned Copies' },
                          { id: 'express', label: 'Express Processing' },
                          { id: 'return', label: getServiceName('return') }
                        ];

                        const addableServices = possibleServices.filter(s => !currentSet.has(s.id));

                        return (
                          <div className="space-y-6">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-800 mb-2">Active Services</h4>
                              {allServices.length === 0 ? (
                                <p className="text-sm text-gray-500">No services registered on this order.</p>
                              ) : (
                                <div className="space-y-2">
                                  {allServices.map((serviceId) => {
                                    const status = getServiceStatus(serviceId);
                                    const statusColor = getServiceStatusColor(status);
                                    return (
                                      <div
                                        key={serviceId}
                                        className="flex items-center justify-between border border-gray-200 rounded-md px-3 py-2 bg-white"
                                      >
                                        <div>
                                          <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium text-gray-900">{getServiceName(serviceId)}</span>
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusColor}`}>
                                              {status}
                                            </span>
                                          </div>
                                          <p className="text-xs text-gray-500 mt-0.5">
                                            Status based on processing steps.
                                          </p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveService(serviceId)}
                                          disabled={removingService === serviceId}
                                          className="px-2 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                                        >
                                          {removingService === serviceId ? 'Removing...' : 'Remove'}
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            <div>
                              <h4 className="text-sm font-semibold text-gray-800 mb-2">Add Service</h4>
                              {addableServices.length === 0 ? (
                                <p className="text-sm text-gray-500">All available services have been added.</p>
                              ) : (
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                  <select
                                    value={newServiceToAdd}
                                    onChange={(e) => setNewServiceToAdd(e.target.value)}
                                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                                  >
                                    <option value="">Select service to add...</option>
                                    {addableServices.map((s) => (
                                      <option key={s.id} value={s.id}>
                                        {s.label}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => newServiceToAdd && handleAddService(newServiceToAdd)}
                                    disabled={!newServiceToAdd || addingService}
                                    className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {addingService ? 'Adding...' : 'Add Service'}
                                  </button>
                                </div>
                              )}
                              <p className="mt-2 text-xs text-gray-500">
                                When you add or remove a service, the price and processing steps are updated automatically.
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Price Tab */}
                {activeTab === 'price' && (
                  <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium mb-4">Price Adjustments</h3>
                      {/* Per-service override table */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm border border-gray-200 rounded">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left">Include</th>
                              <th className="px-3 py-2 text-left">Description</th>
                              <th className="px-3 py-2 text-right">Base Amount</th>
                              <th className="px-3 py-2 text-right">New Amount</th>
                              <th className="px-3 py-2 text-right">VAT %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.isArray(order?.pricingBreakdown) && order!.pricingBreakdown.length > 0 ? (
                              order!.pricingBreakdown.map((item: any, idx: number) => {
                                const o = lineOverrides[idx] || { index: idx, label: item.description || getServiceName(item.service) || 'Line', baseAmount: 0, include: true };
                                const base = o.baseAmount || (() => {
                                  if (typeof item.fee === 'number') return item.fee;
                                  if (typeof item.basePrice === 'number') return item.basePrice;
                                  if (typeof item.unitPrice === 'number') return item.unitPrice * (item.quantity || 1);
                                  if (typeof item.officialFee === 'number' && typeof item.serviceFee === 'number') return (item.officialFee + item.serviceFee) * (item.quantity || 1);
                                  return 0;
                                })();
                                return (
                                  <tr key={idx} className="border-t">
                                    <td className="px-3 py-2">
                                      <input
                                        type="checkbox"
                                        checked={o.include !== false}
                                        onChange={(e) => {
                                          const next = [...lineOverrides];
                                          next[idx] = { ...(o as any), index: idx, label: o.label, baseAmount: Number(base || 0), include: e.target.checked };
                                          setLineOverrides(next);
                                        }}
                                      />
                                    </td>
                                    <td className="px-3 py-2">{item.description || o.label || '-'}</td>
                                    <td className="px-3 py-2 text-right">{Number(base).toFixed(2)} kr</td>
                                    <td className="px-3 py-2 text-right">
                                      <input
                                        type="number"
                                        className="w-28 border rounded px-2 py-1 text-right"
                                        value={o.overrideAmount ?? ''}
                                        placeholder=""
                                        onChange={(e) => {
                                          const val = e.target.value === '' ? null : Number(e.target.value);
                                          const next = [...lineOverrides];
                                          next[idx] = { ...(o as any), index: idx, label: o.label, baseAmount: Number(base || 0), overrideAmount: val };
                                          setLineOverrides(next);
                                        }}
                                      />
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      <input
                                        type="number"
                                        className="w-20 border rounded px-2 py-1 text-right"
                                        value={o.vatPercent ?? ''}
                                        placeholder=""
                                        onChange={(e) => {
                                          const val = e.target.value === '' ? null : Number(e.target.value);
                                          const next = [...lineOverrides];
                                          next[idx] = { ...(o as any), index: idx, label: o.label, baseAmount: Number(base || 0), vatPercent: val };
                                          setLineOverrides(next);
                                        }}
                                      />
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={5} className="px-3 py-4 text-center text-gray-500">No line items</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Base Amount (from pricing breakdown)</p>
                          <div className="text-xl font-semibold">{getBreakdownTotal()} SEK</div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">New Total Amount</p>
                          <div className="text-xl font-semibold">{getComputedTotal()} SEK</div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h4 className="font-medium mb-2">Discount</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Discount in SEK</label>
                            <input type="number" value={discountAmount} onChange={(e) => setDiscountAmount(Number(e.target.value))} className="w-full border rounded px-3 py-2" />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Discount in %</label>
                            <input type="number" value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))} className="w-full border rounded px-3 py-2" />
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h4 className="font-medium mb-2">Adjustments</h4>
                        <div className="space-y-3">
                          {adjustments.map((adj, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                              <input
                                type="text"
                                placeholder="Description"
                                value={adj.description}
                                onChange={(e) => {
                                  const next = [...adjustments];
                                  next[idx] = { ...next[idx], description: e.target.value };
                                  setAdjustments(next);
                                }}
                                className="col-span-7 border rounded px-3 py-2"
                              />
                              <input
                                type="number"
                                placeholder="Amount (+/-)"
                                value={adj.amount}
                                onChange={(e) => {
                                  const next = [...adjustments];
                                  next[idx] = { ...next[idx], amount: Number(e.target.value) };
                                  setAdjustments(next);
                                }}
                                className="col-span-3 border rounded px-3 py-2"
                              />
                              <button
                                onClick={() => setAdjustments(adjustments.filter((_, i) => i !== idx))}
                                className="col-span-2 text-red-600 border border-red-300 rounded px-2 py-2 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => setAdjustments([...adjustments, { description: '', amount: 0 }])}
                            className="px-3 py-2 border border-gray-300 rounded text-sm"
                          >
                            Add Line
                          </button>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Total adjustments: {getAdjustmentsTotal()} SEK • Total discount: {getDiscountTotal(getBreakdownTotal())} SEK
                        </div>
                        <button
                          onClick={savePricingAdjustments}
                          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                        >
                          Save Price
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Processing Tab */}
                {activeTab === 'processing' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Processing steps</h3>
                      <div className="space-y-4">
                        {processingSteps.map((step, index) => (
                          <div key={step.id} className={`border ${getProcessingStepCardClasses(step.status)} rounded-lg p-4`}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-3 ${
                                  step.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  step.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                  step.status === 'pending' ? 'bg-gray-100 text-gray-600' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {step.status === 'completed' ? '✓' :
                                   step.status === 'in_progress' ? '⟳' :
                                   step.status === 'pending' ? index + 1 : '✗'}
                                </div>
                                <div>
                                  <h4 className="font-medium">{step.name}</h4>
                                  <p className="text-sm text-gray-600">{step.description}</p>
                                </div>
                              </div>
                              <select
                                value={step.status}
                                onChange={(e) => handleStepUpdateWithConfirmation(step.id, e.target.value as ProcessingStep['status'])}
                                className="border border-gray-300 rounded px-2 py-1 text-sm"
                              >
                                <option value="pending">Pending</option>
                                <option value="in_progress">In progress</option>
                                <option value="completed">Completed</option>
                                <option value="skipped">Skipped</option>
                              </select>
                            </div>
                            
                            {/* Address confirmation section */}
                            {needsAddressConfirmation(step.id) && (
                              <div className={`mt-3 p-3 rounded-lg border ${
                                isAddressConfirmed(needsAddressConfirmation(step.id)!) 
                                  ? 'bg-green-50 border-green-200' 
                                  : 'bg-blue-50 border-blue-200'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className={`text-sm font-medium ${
                                      isAddressConfirmed(needsAddressConfirmation(step.id)!) 
                                        ? 'text-green-900' 
                                        : 'text-blue-900'
                                    }`}>
                                      {needsAddressConfirmation(step.id) === 'pickup' ? '📍 Pickup address' : '📍 Return address'}
                                    </p>
                                    {isAddressConfirmed(needsAddressConfirmation(step.id)!) ? (
                                      <div className="mt-1">
                                        <p className="text-xs text-green-700 flex items-center gap-1">
                                          <span>✓</span> Confirmed by customer
                                          {(() => {
                                            const extOrder = order as any;
                                            const confirmedAt = needsAddressConfirmation(step.id) === 'pickup'
                                              ? extOrder.pickupAddressConfirmedAt
                                              : extOrder.returnAddressConfirmedAt;
                                            if (confirmedAt) {
                                              const date = new Date(confirmedAt);
                                              return <span className="text-green-600 ml-1">({date.toLocaleDateString('sv-SE')} {date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })})</span>;
                                            }
                                            return null;
                                          })()}
                                        </p>
                                        {(() => {
                                          const extOrder = order as any;
                                          const wasUpdated = needsAddressConfirmation(step.id) === 'pickup'
                                            ? extOrder.pickupAddressUpdatedByCustomer
                                            : extOrder.returnAddressUpdatedByCustomer;
                                          if (wasUpdated) {
                                            return (
                                              <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                                                <span>⚠️</span> Customer updated the address
                                              </p>
                                            );
                                          }
                                          return null;
                                        })()}
                                      </div>
                                    ) : isConfirmationSent(needsAddressConfirmation(step.id)!) ? (
                                      <div className="mt-1">
                                        <p className="text-xs text-yellow-700 flex items-center gap-1">
                                          <span>⏳</span> Awaiting customer confirmation
                                        </p>
                                        {(() => {
                                          const extOrder = order as any;
                                          const sentAt = needsAddressConfirmation(step.id) === 'pickup'
                                            ? extOrder.pickupAddressConfirmationSentAt
                                            : extOrder.returnAddressConfirmationSentAt;
                                          if (sentAt) {
                                            const date = new Date(sentAt);
                                            return (
                                              <p className="text-xs text-gray-500 mt-0.5">
                                                Email sent: {date.toLocaleDateString('sv-SE')} {date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                                              </p>
                                            );
                                          }
                                          return null;
                                        })()}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-gray-600 mt-1">
                                        Send confirmation email to customer
                                      </p>
                                    )}
                                  </div>
                                  {!isAddressConfirmed(needsAddressConfirmation(step.id)!) && (
                                    <button
                                      onClick={() => sendAddressConfirmation(needsAddressConfirmation(step.id)!)}
                                      disabled={sendingAddressConfirmation}
                                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {sendingAddressConfirmation ? 'Sending...' : 
                                       isConfirmationSent(needsAddressConfirmation(step.id)!) ? 'Send reminder' : 'Send confirmation email'}
                                    </button>
                                  )}
                                </div>
                                
                                {/* Show current address */}
                                {isAddressConfirmed(needsAddressConfirmation(step.id)!) && (
                                  <div className="mt-3 pt-3 border-t border-green-200">
                                    <p className="text-xs font-medium text-green-800 mb-1">Confirmed address:</p>
                                    <div className="text-xs text-green-700 space-y-0.5">
                                      {(() => {
                                        const extOrder = order as any;
                                        if (needsAddressConfirmation(step.id) === 'pickup') {
                                          const pa = extOrder.pickupAddress || {};
                                          return (
                                            <>
                                              {pa.company && <p className="font-medium">{pa.company}</p>}
                                              {pa.name && <p>{pa.name}</p>}
                                              <p>{pa.street || order?.customerInfo?.address}</p>
                                              <p>{pa.postalCode || order?.customerInfo?.postalCode} {pa.city || order?.customerInfo?.city}</p>
                                            </>
                                          );
                                        } else {
                                          const ci = order?.customerInfo || {};
                                          return (
                                            <>
                                              {ci.companyName && <p className="font-medium">{ci.companyName}</p>}
                                              <p>{ci.firstName} {ci.lastName}</p>
                                              <p>{ci.address}</p>
                                              <p>{ci.postalCode} {ci.city}</p>
                                            </>
                                          );
                                        }
                                      })()}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Embassy price confirmation section */}
                            {needsEmbassyPriceConfirmation(step.id) && (
                              <div className={`mt-3 p-3 rounded-lg border ${
                                isEmbassyPriceConfirmed() 
                                  ? 'bg-green-50 border-green-200' 
                                  : isEmbassyPriceDeclined()
                                  ? 'bg-red-50 border-red-200'
                                  : 'bg-amber-50 border-amber-200'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className={`text-sm font-medium ${
                                      isEmbassyPriceConfirmed() 
                                        ? 'text-green-900' 
                                        : isEmbassyPriceDeclined()
                                        ? 'text-red-900'
                                        : 'text-amber-900'
                                    }`}>
                                      💰 Embassy official fee
                                    </p>
                                    {isEmbassyPriceConfirmed() ? (
                                      <div className="mt-1">
                                        <p className="text-xs text-green-700 flex items-center gap-1">
                                          <span>✓</span> Confirmed by customer
                                          {(order as any)?.embassyPriceConfirmedAt && (
                                            <span className="text-green-600 ml-1">
                                              ({new Date((order as any).embassyPriceConfirmedAt).toLocaleDateString('sv-SE')})
                                            </span>
                                          )}
                                        </p>
                                        <p className="text-sm font-bold text-green-800 mt-1">
                                          {(order as any)?.confirmedEmbassyPrice?.toLocaleString()} kr
                                        </p>
                                      </div>
                                    ) : isEmbassyPriceDeclined() ? (
                                      <div className="mt-1">
                                        <p className="text-xs text-red-700 flex items-center gap-1">
                                          <span>✗</span> Declined by customer
                                          {(order as any)?.embassyPriceDeclinedAt && (
                                            <span className="text-red-600 ml-1">
                                              ({new Date((order as any).embassyPriceDeclinedAt).toLocaleDateString('sv-SE')})
                                            </span>
                                          )}
                                        </p>
                                      </div>
                                    ) : isEmbassyPriceConfirmationSent() ? (
                                      <div className="mt-1">
                                        <p className="text-xs text-yellow-700 flex items-center gap-1">
                                          <span>⏳</span> Awaiting customer confirmation
                                        </p>
                                        {(order as any)?.embassyPriceConfirmationSentAt && (
                                          <p className="text-xs text-gray-500 mt-0.5">
                                            Email sent: {new Date((order as any).embassyPriceConfirmationSentAt).toLocaleDateString('sv-SE')} {new Date((order as any).embassyPriceConfirmationSentAt).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                                          </p>
                                        )}
                                        {(order as any)?.pendingEmbassyPrice && (
                                          <p className="text-sm font-medium text-amber-800 mt-1">
                                            Pending: {(order as any).pendingEmbassyPrice.toLocaleString()} kr
                                          </p>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-gray-600 mt-1">
                                        Enter confirmed price and send to customer
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Price input and send button */}
                                {!isEmbassyPriceConfirmed() && !isEmbassyPriceDeclined() && (
                                  <div className="mt-3 pt-3 border-t border-amber-200">
                                    <div className="flex items-end gap-2">
                                      <div className="flex-1">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          Confirmed embassy fee (SEK)
                                        </label>
                                        <input
                                          type="number"
                                          value={embassyPriceInput}
                                          onChange={(e) => setEmbassyPriceInput(e.target.value)}
                                          placeholder="e.g. 1500"
                                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                                        />
                                      </div>
                                      <button
                                        onClick={() => {
                                          const price = parseFloat(embassyPriceInput);
                                          if (isNaN(price) || price <= 0) {
                                            toast.error('Please enter a valid price');
                                            return;
                                          }
                                          sendEmbassyPriceConfirmation(price);
                                        }}
                                        disabled={sendingEmbassyPriceConfirmation || !embassyPriceInput}
                                        className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                      >
                                        {sendingEmbassyPriceConfirmation ? 'Sending...' : 
                                         isEmbassyPriceConfirmationSent() ? '📧 Send reminder' : '📧 Send to customer'}
                                      </button>
                                    </div>
                                    {embassyPriceInput && !isNaN(parseFloat(embassyPriceInput)) && (
                                      <div className="mt-2 p-2 bg-white rounded border border-amber-100">
                                        <p className="text-xs text-gray-600">
                                          New total: <span className="font-bold text-gray-900">
                                            {(() => {
                                              const currentTotalExcludingTBC = (order?.pricingBreakdown || []).reduce((sum: number, item: any) => {
                                                if (item.isTBC) return sum;
                                                return sum + (item.total || 0);
                                              }, 0);
                                              return (currentTotalExcludingTBC + parseFloat(embassyPriceInput)).toLocaleString();
                                            })()} kr
                                          </span>
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {isAuthorityService(step.id) && (
                              <div className="mt-4 space-y-4">
                                {/* Embassy delivery: only date in */}
                                {step.id.endsWith('_delivery') && (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Date submitted to authority
                                    </label>
                                    <input
                                      type="date"
                                      value={step.submittedAt ? new Date(step.submittedAt.toDate ? step.submittedAt.toDate() : step.submittedAt).toISOString().split('T')[0] : ''}
                                      onChange={(e) => {
                                        const dateValue = e.target.value;
                                        const updatedStep = {
                                          ...step,
                                          submittedAt: dateValue ? new Date(dateValue) : undefined
                                        };
                                        updateProcessingStep(step.id, step.status, step.notes, updatedStep);
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                )}

                                {/* Embassy pickup: only date out */}
                                {step.id.endsWith('_pickup') && (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Expected completion date
                                    </label>
                                    <input
                                      type="date"
                                      value={step.expectedCompletionDate ? new Date(step.expectedCompletionDate.toDate ? step.expectedCompletionDate.toDate() : step.expectedCompletionDate).toISOString().split('T')[0] : ''}
                                      onChange={(e) => {
                                        const dateValue = e.target.value;
                                        const updatedStep = {
                                          ...step,
                                          expectedCompletionDate: dateValue ? new Date(dateValue) : undefined
                                        };
                                        updateProcessingStep(step.id, step.status, step.notes, updatedStep);
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                )}

                                {/* All other authorities: both date in and date out */}
                                {!step.id.endsWith('_delivery') && !step.id.endsWith('_pickup') && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date submitted to authority
                                      </label>
                                      <input
                                        type="date"
                                        value={step.submittedAt ? new Date(step.submittedAt.toDate ? step.submittedAt.toDate() : step.submittedAt).toISOString().split('T')[0] : ''}
                                        onChange={(e) => {
                                          const dateValue = e.target.value;
                                          const updatedStep = {
                                            ...step,
                                            submittedAt: dateValue ? new Date(dateValue) : undefined
                                          };
                                          updateProcessingStep(step.id, step.status, step.notes, updatedStep);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Expected completion date
                                      </label>
                                      <input
                                        type="date"
                                        value={step.expectedCompletionDate ? new Date(step.expectedCompletionDate.toDate ? step.expectedCompletionDate.toDate() : step.expectedCompletionDate).toISOString().split('T')[0] : ''}
                                        onChange={(e) => {
                                          const dateValue = e.target.value;
                                          const updatedStep = {
                                            ...step,
                                            expectedCompletionDate: dateValue ? new Date(dateValue) : undefined
                                          };
                                          updateProcessingStep(step.id, step.status, step.notes, updatedStep);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {step.status === 'completed' && step.completedAt && (
                              <div className="text-xs text-gray-500 mt-2">
                                Completed {formatDate(step.completedAt)} by {step.completedBy}
                              </div>
                            )}
                            {step.notes && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                {step.notes}
                              </div>
                            )}
                            {step.id === 'pickup_booking' && (
                              <div className="mt-3 space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tracking-nummer för upphämtning
                                  </label>
                                  <input
                                    type="text"
                                    value={pickupTrackingNumber}
                                    onChange={(e) => setPickupTrackingNumber(e.target.value)}
                                    onBlur={savePickupTrackingInfo}
                                    placeholder="t.ex. 1234567890"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  {/* Show if label has been sent */}
                                  {(order as any)?.pickupLabelSent ? (
                                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="text-green-800 font-medium text-sm">✓ DHL label already sent to customer</p>
                                          {(order as any)?.pickupLabelSentAt && (
                                            <p className="text-green-600 text-xs mt-1">
                                              Sent: {new Date((order as any).pickupLabelSentAt).toLocaleString('sv-SE')}
                                            </p>
                                          )}
                                          {(order as any)?.pickupTrackingNumber && (
                                            <p className="text-green-600 text-xs">
                                              Tracking: {(order as any).pickupTrackingNumber}
                                            </p>
                                          )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                          {(order as any)?.pickupLabelPdf ? (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const pdf = (order as any).pickupLabelPdf;
                                                const link = document.createElement('a');
                                                link.href = `data:application/pdf;base64,${pdf}`;
                                                link.download = `DHL-Label-${order?.orderNumber || 'label'}.pdf`;
                                                link.click();
                                              }}
                                              className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 flex items-center gap-1"
                                            >
                                              📥 Download label
                                            </button>
                                          ) : (order as any)?.pickupTrackingNumber ? (
                                            <span className="text-xs text-gray-500 italic">
                                              Label not stored (created before update)
                                            </span>
                                          ) : null}
                                          {(order as any)?.pickupTrackingNumber && (
                                            <a
                                              href={`https://www.dhl.com/se-sv/home/tracking/tracking-express.html?submit=1&tracking-id=${(order as any).pickupTrackingNumber}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="px-3 py-1.5 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600 flex items-center gap-1"
                                            >
                                              🔍 Track shipment
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                      <p className="text-amber-700 text-xs mt-2 bg-amber-50 p-2 rounded border border-amber-200">
                                        ⚠️ A DHL shipment has already been created. Creating another will result in duplicate shipments and charges.
                                      </p>
                                    </div>
                                  ) : (
                                    <>
                                      {/* Check if customer selected Stockholm Courier for pickup */}
                                      {(order as any)?.premiumPickup && ['stockholm-city', 'stockholm-express', 'stockholm-sameday'].includes((order as any).premiumPickup) ? (
                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                                          <p className="text-blue-800 font-medium text-sm">
                                            ℹ️ Customer selected: {(order as any).premiumPickup === 'stockholm-city' ? 'Stockholm City Courier' :
                                              (order as any).premiumPickup === 'stockholm-express' ? 'Stockholm Express' :
                                              'Stockholm Same Day'}
                                          </p>
                                          <p className="text-blue-600 text-xs mt-1">
                                            DHL pickup is not needed. Use Stockholm Courier for pickup instead.
                                          </p>
                                        </div>
                                      ) : (
                                        <div className="flex flex-wrap items-center gap-2 pt-1">
                                          <button
                                            type="button"
                                            onClick={createAndSendDhlPickupLabel}
                                            disabled={creatingDhlPickupLabel || !order}
                                            className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            {creatingDhlPickupLabel ? '📧 Creating & sending...' : '📧 Create & send DHL label to customer'}
                                          </button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>

                                <div className="space-y-2 border-t pt-3 mt-3">
                                  <div className="text-sm text-gray-700">
                                    <p className="font-medium">Manual upload (alternative)</p>
                                    <p className="text-xs text-gray-500">
                                      Filename must contain order number {order?.orderNumber || (router.query.id as string)}.
                                    </p>
                                  </div>

                                  {order && (order as any).pickupLabelFile && (
                                    <div className="flex items-center justify-between text-sm bg-gray-50 border border-gray-200 rounded px-3 py-2">
                                      <div>
                                        <p className="font-medium">Uploaded label</p>
                                        <p className="text-gray-700 truncate max-w-xs">{(order as any).pickupLabelFile.originalName}</p>
                                      </div>
                                      {(order as any).pickupLabelFile.downloadURL && (
                                        <a
                                          href={(order as any).pickupLabelFile.downloadURL}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-primary-600 text-sm underline ml-4"
                                        >
                                          Open
                                        </a>
                                      )}
                                    </div>
                                  )}

                                  <div className="flex flex-wrap items-center gap-3">
                                    <input
                                      ref={pickupLabelInputRef}
                                      type="file"
                                      accept=".pdf,image/*"
                                      onChange={handlePickupLabelFileSelected}
                                      className="hidden"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => pickupLabelInputRef.current?.click()}
                                      disabled={isUploadingPickupLabel}
                                      className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {isUploadingPickupLabel ? 'Uploading...' : 'Upload label'}
                                    </button>
                                    <button
                                      onClick={handleSendPickupLabel}
                                      disabled={sendingPickupLabel || !(order as any).pickupLabelFile}
                                      className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {sendingPickupLabel ? 'Sending...' : 'Send label'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                            {step.id === 'return_shipping' && (
                              <div className="mt-3 space-y-3">
                                {/* Show selected return service */}
                                <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                                  <p className="text-sm font-medium text-gray-700 mb-1">Customer selected return service:</p>
                                  <p className="text-base font-semibold">
                                    {order?.returnService ? (
                                      <>
                                        {order.returnService.includes('dhl') || order.returnService === 'retur' || order.returnService === 'own-delivery' ? '📦 ' :
                                         order.returnService.includes('postnord') ? '📮 ' :
                                         order.returnService.includes('stockholm') ? '🚴 ' :
                                         order.returnService === 'office-pickup' ? '🏢 ' : '📦 '}
                                        {getReturnServiceName(order.returnService)}
                                      </>
                                    ) : '❌ No return service selected'}
                                  </p>
                                </div>

                                {/* Hide tracking number input for office-pickup since no shipping is needed */}
                                {order?.returnService !== 'office-pickup' && (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Return tracking number
                                    </label>
                                    <input
                                      type="text"
                                      value={trackingNumber}
                                      onChange={(e) => setTrackingNumber(e.target.value)}
                                      onBlur={saveTrackingInfo}
                                      placeholder="t.ex. 1234567890"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                )}
                                
                                {/* Show if shipment already booked */}
                                {/* Show if return shipment has been booked */}
                                {(order as any)?.dhlShipmentBooked ? (
                                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-green-800 font-medium text-sm">✓ DHL return shipment already booked</p>
                                        {(order as any)?.dhlShipmentBookedAt && (
                                          <p className="text-green-600 text-xs mt-1">
                                            Booked: {new Date((order as any).dhlShipmentBookedAt).toLocaleString('sv-SE')}
                                          </p>
                                        )}
                                        {trackingNumber && (
                                          <p className="text-green-600 text-xs">
                                            Tracking: {trackingNumber}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex flex-col gap-2">
                                        {(order as any)?.dhlReturnLabelBase64 ? (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const pdf = (order as any).dhlReturnLabelBase64;
                                              const link = document.createElement('a');
                                              link.href = `data:application/pdf;base64,${pdf}`;
                                              link.download = `DHL-Return-Label-${order?.orderNumber || 'label'}.pdf`;
                                              link.click();
                                            }}
                                            className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 flex items-center gap-1"
                                          >
                                            📥 Download label
                                          </button>
                                        ) : trackingNumber ? (
                                          <button
                                            type="button"
                                            onClick={() => downloadDhlLabel()}
                                            className="px-3 py-1.5 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700 flex items-center gap-1"
                                          >
                                            📄 Generate label
                                          </button>
                                        ) : null}
                                        {trackingUrl && (
                                          <a
                                            href={trackingUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-1.5 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600 flex items-center gap-1"
                                          >
                                            🔍 Track shipment
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-amber-700 text-xs mt-2 bg-amber-50 p-2 rounded border border-amber-200">
                                      ⚠️ A DHL return shipment has already been booked. Booking another will result in duplicate shipments and charges.
                                    </p>
                                  </div>
                                ) : (
                                  <>
                                    {/* Check if customer selected non-DHL return service */}
                                    {order?.returnService === 'postnord-rek' ? (
                                      // PostNord REK booking
                                      (order as any).postnordShipmentBooked ? (
                                        <div className="p-3 bg-green-50 border border-green-200 rounded">
                                          <p className="text-green-800 font-medium text-sm">
                                            ✅ PostNord REK booked
                                          </p>
                                          <div className="mt-2 flex flex-wrap gap-2 items-center">
                                            {(order as any).postnordTrackingNumber && (
                                              <span className="text-xs bg-white px-2 py-1 rounded border">
                                                📮 {(order as any).postnordTrackingNumber}
                                              </span>
                                            )}
                                            {(order as any).postnordTrackingUrl && (
                                              <a
                                                href={(order as any).postnordTrackingUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:underline"
                                              >
                                                🔍 Track shipment
                                              </a>
                                            )}
                                            {(order as any).postnordLabelBase64 && (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const link = document.createElement('a');
                                                  link.href = `data:application/pdf;base64,${(order as any).postnordLabelBase64}`;
                                                  link.download = `postnord-label-${order.orderNumber}.pdf`;
                                                  link.click();
                                                }}
                                                className="text-xs text-green-600 hover:underline"
                                              >
                                                📄 Download label
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex flex-wrap items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={bookPostNordShipment}
                                            disabled={bookingPostNordShipment || !order}
                                            className="px-3 py-1.5 bg-yellow-600 text-white rounded-md text-sm hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            {bookingPostNordShipment ? '📮 Booking PostNord REK...' : '📮 Book PostNord REK'}
                                          </button>
                                          <span className="text-xs text-gray-500">
                                            Customer selected: PostNord REK (Registered Mail)
                                          </span>
                                        </div>
                                      )
                                    ) : order?.returnService && ['postnord-express', 'stockholm-city', 'stockholm-express', 'stockholm-sameday'].includes(order.returnService) ? (
                                      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                                        <p className="text-blue-800 font-medium text-sm">
                                          ℹ️ Customer selected: {order.returnService === 'postnord-express' ? 'PostNord Express' :
                                            order.returnService === 'stockholm-city' ? 'Stockholm City Courier' :
                                            order.returnService === 'stockholm-express' ? 'Stockholm Express' :
                                            'Stockholm Same Day'}
                                        </p>
                                        <p className="text-blue-600 text-xs mt-1">
                                          Manual booking required for this shipping method.
                                        </p>
                                      </div>
                                    ) : order?.returnService && ['own-delivery', 'office-pickup'].includes(order.returnService) ? (
                                      <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                                        <p className="text-slate-800 font-medium text-sm">
                                          ℹ️ Customer selected: {order.returnService === 'own-delivery' ? 'Own delivery' : 'Office pickup'}
                                        </p>
                                        <p className="text-slate-600 text-xs mt-1">
                                          No return shipment booking is needed for this return option.
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="flex flex-wrap items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={bookDhlShipment}
                                          disabled={bookingDhlShipment || !order}
                                          className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {bookingDhlShipment ? '📦 Booking DHL return...' : '📦 Book DHL return shipment'}
                                        </button>
                                        {/* Show premium delivery info if selected */}
                                        {(order as any)?.premiumDelivery && ['dhl-pre-9', 'dhl-pre-12'].includes((order as any).premiumDelivery) && (
                                          <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                                            ⚡ {(order as any).premiumDelivery === 'dhl-pre-9' ? 'DHL Pre 9:00' : 'DHL Pre 12:00'}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Internal Notes (append-only) */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">Internal notes</h3>
                      <div className="space-y-3 mb-4">
                        {internalNotesList.length === 0 && (
                          <div className="text-sm text-gray-500">No notes yet</div>
                        )}
                        {internalNotesList.map((n) => (
                          <div key={n.id} className="border border-gray-200 rounded p-3 bg-gray-50">
                            <div className="whitespace-pre-wrap text-sm text-gray-800">{n.content}</div>
                            <div className="mt-2 text-xs text-gray-500">
                              Created {formatDate(n.createdAt)} by {n.createdBy || 'Unknown'}
                            </div>
                          </div>
                        ))}
                      </div>
                      <textarea
                        value={internalNoteText}
                        onChange={(e) => setInternalNoteText(e.target.value)}
                        placeholder="Write a new internal note..."
                        className="w-full border border-gray-300 rounded-lg p-3"
                        rows={3}
                      />
                      <div className="mt-2">
                        <button
                          onClick={addInternalNote}
                          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                        >
                          Add note
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Files Tab */}
                {activeTab === 'files' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Uploaded files</h3>
                      {order.uploadedFiles && order.uploadedFiles.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {order.uploadedFiles.map((file: any, index: number) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <div>
                                    <p className="font-medium text-gray-900">{file.originalName}</p>
                                    <p className="text-sm text-gray-500">
                                      {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <a
                                  href={file.downloadURL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 text-center px-3 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm"
                                >
                                  Download
                                </a>
                                <button
                                  onClick={() => window.open(file.downloadURL, '_blank')}
                                  className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                                >
                                  Preview
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p>No files uploaded yet</p>
                        </div>
                      )}
                    </div>

                    {/* Supplementary Files */}
                    {(order as any).supplementaryFiles && (order as any).supplementaryFiles.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-4">Supplementary Documents</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(order as any).supplementaryFiles.map((file: any, index: number) => (
                            <div key={index} className="border border-green-200 bg-green-50 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <div>
                                    <p className="font-medium text-gray-900">{file.name}</p>
                                    <p className="text-sm text-gray-500">
                                      {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ''} 
                                      {file.uploadedAt && ` • ${new Date(file.uploadedAt).toLocaleDateString('sv-SE')}`}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 text-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                >
                                  Download
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Request Additional Documents */}
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-medium mb-4">Request Additional Documents</h3>
                      <p className="text-gray-600 mb-4">
                        Send an email to the customer with a secure upload link to request additional documents.
                      </p>
                      <button
                        onClick={() => setShowDocumentRequestModal(true)}
                        className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Send Document Request
                      </button>
                      {(order as any).documentRequestSent && (
                        <p className="text-sm text-green-600 mt-2">
                          ✓ Request sent {(order as any).documentRequestSentAt && new Date((order as any).documentRequestSentAt).toLocaleDateString('en-GB')}
                        </p>
                      )}
                    </div>

                    {/* Pickup Address */}
                    {order.pickupService && order.pickupAddress && (
                      <div>
                        <h3 className="text-lg font-medium mb-4">Pickup address</h3>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="font-medium text-blue-800">Document pickup ordered</span>
                          </div>
                          <p className="text-blue-700">{order.pickupAddress.street}</p>
                          <p className="text-blue-700">{order.pickupAddress.postalCode} {order.pickupAddress.city}</p>
                          <p className="text-blue-600 text-sm mt-2">We will contact the customer within 24 hours to schedule the pickup.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Invoice Tab */}
                {activeTab === 'invoice' && (
                  <div className="space-y-6">
                    {/* Create Invoice Section */}
                    {invoices.length === 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-blue-800 mb-2">No invoice created yet</h3>
                            <p className="text-blue-700 mb-4">
                              Create an invoice for this order to send it to the customer and track payments.
                            </p>
                            <button
                              onClick={handleCreateInvoice}
                              disabled={creatingInvoice}
                              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
                            >
                              {creatingInvoice ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Creating invoice...
                                </>
                              ) : (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                  Create Invoice
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Existing Invoices */}
                    {invoices.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium">Invoices ({invoices.length})</h3>
                          <button
                            onClick={handleCreateInvoice}
                            disabled={creatingInvoice}
                            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 flex items-center text-sm"
                          >
                            {creatingInvoice ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Creating...
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                New Invoice
                              </>
                            )}
                          </button>
                        </div>

                        <div className="space-y-4">
                          {invoices.map((invoice) => (
                            <div key={invoice.id} className="border border-gray-200 rounded-lg p-6 bg-white">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h4 className="text-xl font-bold text-gray-900">{invoice.invoiceNumber}</h4>
                                  <p className="text-sm text-gray-600">
                                    Created {formatDate(invoice.issueDate)} • Due {formatDate(invoice.dueDate)}
                                  </p>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                                    invoice.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                    invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                                    invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                                    invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {invoice.status === 'draft' ? 'Draft' :
                                     invoice.status === 'sent' ? 'Sent' :
                                     invoice.status === 'paid' ? 'Paid' :
                                     invoice.status === 'overdue' ? 'Overdue' :
                                     invoice.status}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-gray-900">{invoice.totalAmount} SEK</div>
                                  <div className="text-sm text-gray-600">Incl. VAT</div>
                                </div>
                              </div>

                              {/* Invoice Actions */}
                              <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                                <button
                                  onClick={() => handleDownloadInvoice(invoice)}
                                  className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Download PDF
                                </button>

                                <button
                                  onClick={() => handleSendInvoice(invoice)}
                                  disabled={sendingInvoice === invoice.id}
                                  className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                  {sendingInvoice === invoice.id ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                                      Sending...
                                    </>
                                  ) : (
                                    <>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                      </svg>
                                      Send via Email
                                    </>
                                  )}
                                </button>

                                <Link
                                  href={`/admin/invoices/${invoice.id}`}
                                  className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  View Details
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes Tab */}
                {activeTab === 'notes' && (
                  <div className="space-y-6">
                    {/* Add New Note */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Add Note</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Note Type</label>
                          <select
                            value={noteType}
                            onChange={(e) => setNoteType(e.target.value as AdminNote['type'])}
                            className="border border-gray-300 rounded px-3 py-2"
                          >
                            <option value="general">General</option>
                            <option value="processing">Processing</option>
                            <option value="customer">Customer Related</option>
                            <option value="issue">Issue</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                          <textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Write your note here..."
                            className="w-full border border-gray-300 rounded-lg p-3"
                            rows={3}
                          />
                        </div>
                        <button
                          onClick={addNote}
                          disabled={!newNote.trim()}
                          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                        >
                          Add Note
                        </button>
                      </div>
                    </div>

                    {/* Existing Notes */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Previous notes</h3>
                      {order.adminNotes && order.adminNotes.length > 0 ? (
                        <div className="space-y-4">
                          {order.adminNotes.map((note: AdminNote, index: number) => (
                            <div key={note.id} className={`border rounded-lg p-4 ${
                              note.type === 'issue' ? 'border-red-200 bg-red-50' :
                              note.type === 'customer' ? 'border-blue-200 bg-blue-50' :
                              note.type === 'processing' ? 'border-yellow-200 bg-yellow-50' :
                              'border-gray-200 bg-gray-50'
                            }`}>
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-2 ${
                                    note.type === 'issue' ? 'bg-red-100 text-red-800' :
                                    note.type === 'customer' ? 'bg-blue-100 text-blue-800' :
                                    note.type === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {note.type === 'general' ? 'General' :
                                     note.type === 'processing' ? 'Processing' :
                                     note.type === 'customer' ? 'Customer' : 'Issue'}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    {formatDate(note.createdAt)} by {note.createdBy}
                                  </span>
                                </div>
                              </div>
                              <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <p>No notes yet</p>
                        </div>
                      )}
                    </div>

                    {/* Customer Information from Order */}
                    {(order.invoiceReference || order.additionalNotes) && (
                      <div>
                        <h3 className="text-lg font-medium mb-4">Customer information</h3>
                        <div className="space-y-4">
                          {order.invoiceReference && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <h4 className="font-medium text-green-800 mb-2">Invoice reference</h4>
                              <p className="text-green-700">{order.invoiceReference}</p>
                            </div>
                          )}
                          {order.additionalNotes && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                              <h4 className="font-medium text-purple-800 mb-2">Additional information</h4>
                              <p className="text-purple-700 whitespace-pre-wrap">{order.additionalNotes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600">Order not found</p>
              <Link href="/admin/orders" className="mt-4 inline-block text-primary-600 hover:text-primary-800">
                Back to all orders
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Address Warning Modal */}
      {showAddressWarningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Address not confirmed
              </h3>
              <p className="text-gray-600">
                Customer has not confirmed their {pendingStepUpdate?.stepId === 'order_verification' ? 'pickup address' : 'return address'} yet.
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                ⚠️ Proceeding without confirmation may cause delivery issues if the address is incorrect.
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowAddressWarningModal(false);
                  setPendingStepUpdate(null);
                  const type = pendingStepUpdate?.stepId === 'order_verification' ? 'pickup' : 'return';
                  sendAddressConfirmation(type);
                }}
                className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
              >
                📧 Send confirmation email first
              </button>
              
              <button
                onClick={proceedWithStepUpdate}
                className="w-full px-4 py-3 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition"
              >
                ⚠️ Proceed anyway
              </button>
              
              <button
                onClick={() => {
                  setShowAddressWarningModal(false);
                  setPendingStepUpdate(null);
                }}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embassy Price Warning Modal */}
      {showEmbassyPriceWarningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Price not confirmed
              </h3>
              <p className="text-gray-600">
                Customer has not confirmed the embassy official fee yet.
              </p>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-800">
                ⚠️ Proceeding without price confirmation means the customer has not explicitly approved the final cost.
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowEmbassyPriceWarningModal(false);
                  setPendingStepUpdate(null);
                }}
                className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
              >
                📧 Go back and send confirmation first
              </button>
              
              <button
                onClick={() => {
                  if (pendingStepUpdate) {
                    updateProcessingStep(
                      pendingStepUpdate.stepId,
                      pendingStepUpdate.status,
                      pendingStepUpdate.notes,
                      pendingStepUpdate.updatedStep
                    );
                  }
                  setShowEmbassyPriceWarningModal(false);
                  setPendingStepUpdate(null);
                }}
                className="w-full px-4 py-3 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition"
              >
                ⚠️ Proceed anyway
              </button>
              
              <button
                onClick={() => {
                  setShowEmbassyPriceWarningModal(false);
                  setPendingStepUpdate(null);
                }}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DHL Address Edit Modal */}
      {showDhlAddressModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-xl">⚠️</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">DHL Address Issue</h3>
                <p className="text-sm text-gray-500">Please correct the address to proceed</p>
              </div>
            </div>

            {/* User-friendly error message */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-amber-800 mb-1">Please check the following:</p>
              <ul className="text-sm text-amber-700 list-disc list-inside space-y-1">
                {dhlAddressError.toLowerCase().includes('postcode') || dhlAddressError.toLowerCase().includes('postal') ? (
                  <li>Postal code format may be incorrect (Swedish: 123 45)</li>
                ) : null}
                {dhlAddressError.toLowerCase().includes('country') ? (
                  <li>Country code must be selected from the dropdown</li>
                ) : null}
                {dhlAddressError.toLowerCase().includes('city') ? (
                  <li>City name may be missing or incorrect</li>
                ) : null}
                {!dhlAddressError.toLowerCase().includes('postcode') && 
                 !dhlAddressError.toLowerCase().includes('postal') && 
                 !dhlAddressError.toLowerCase().includes('country') && 
                 !dhlAddressError.toLowerCase().includes('city') ? (
                  <li>Address validation failed - please verify all fields</li>
                ) : null}
              </ul>
              <details className="mt-2">
                <summary className="text-xs text-amber-600 cursor-pointer">Technical details</summary>
                <p className="text-xs text-amber-600 mt-1 font-mono">{dhlAddressError}</p>
              </details>
            </div>

            {/* Address form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={dhlEditAddress.postalCode}
                  onChange={(e) => setDhlEditAddress({ ...dhlEditAddress, postalCode: e.target.value })}
                  placeholder="123 45"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    dhlAddressError.toLowerCase().includes('postcode') || dhlAddressError.toLowerCase().includes('postal')
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                />
                <p className="text-xs text-gray-500 mt-1">Format: 123 45 (with space)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={dhlEditAddress.city}
                  onChange={(e) => setDhlEditAddress({ ...dhlEditAddress, city: e.target.value })}
                  placeholder="Stockholm"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    dhlAddressError.toLowerCase().includes('city')
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  value={dhlEditAddress.country}
                  onChange={(e) => setDhlEditAddress({ ...dhlEditAddress, country: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    dhlAddressError.toLowerCase().includes('country')
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                >
                  <option value="SE">🇸🇪 Sweden (SE)</option>
                  <option value="NO">🇳🇴 Norway (NO)</option>
                  <option value="DK">🇩🇰 Denmark (DK)</option>
                  <option value="FI">🇫🇮 Finland (FI)</option>
                  <option value="DE">🇩🇪 Germany (DE)</option>
                  <option value="GB">🇬🇧 United Kingdom (GB)</option>
                  <option value="US">🇺🇸 United States (US)</option>
                  <option value="FR">🇫🇷 France (FR)</option>
                  <option value="ES">🇪🇸 Spain (ES)</option>
                  <option value="IT">🇮🇹 Italy (IT)</option>
                  <option value="NL">🇳🇱 Netherlands (NL)</option>
                  <option value="BE">🇧🇪 Belgium (BE)</option>
                  <option value="AT">🇦🇹 Austria (AT)</option>
                  <option value="CH">🇨🇭 Switzerland (CH)</option>
                  <option value="PL">🇵🇱 Poland (PL)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Must be a 2-letter country code</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDhlAddressModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveDhlAddressAndRetry}
                className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
              >
                Save & Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Request Modal */}
      {showDocumentRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Request Additional Documents</h2>
                <button
                  onClick={() => setShowDocumentRequestModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-gray-600 mb-4">
                An email with a secure upload link will be sent to the customer at: <strong>{order?.customerInfo?.email}</strong>
              </p>

              {/* Customer language indicator */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Customer language:</span>{' '}
                  {(order as any)?.locale === 'en' ? '🇬🇧 English' : '🇸🇪 Swedish'}
                  <span className="text-blue-600 ml-2">(Email will be sent in this language)</span>
                </p>
              </div>

              {/* Template Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select template</label>
                <select
                  value={documentRequestTemplate}
                  onChange={(e) => {
                    setDocumentRequestTemplate(e.target.value);
                    const message = getTemplateMessage(e.target.value);
                    if (message) {
                      setDocumentRequestMessage(message);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  {documentRequestTemplates.map(template => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message to customer <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={documentRequestMessage}
                  onChange={(e) => setDocumentRequestMessage(e.target.value)}
                  placeholder="Describe which documents are needed and why..."
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This message will be shown in the email and on the upload page.
                </p>
              </div>

              {/* Preview */}
              {documentRequestMessage && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 mb-2">Preview:</p>
                  <p className="text-sm text-yellow-700 whitespace-pre-wrap">{documentRequestMessage}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDocumentRequestModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={sendDocumentRequest}
                  disabled={sendingDocumentRequest || !documentRequestMessage.trim()}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center"
                >
                  {sendingDocumentRequest ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Send Request
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const ClientOnlyAdminOrderDetail = () => (
  <ProtectedRoute>
    <AdminOrderDetailPage />
  </ProtectedRoute>
);

export default dynamic(() => Promise.resolve(ClientOnlyAdminOrderDetail), { ssr: false });
