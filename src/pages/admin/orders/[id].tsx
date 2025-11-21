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
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { convertOrderToInvoice, storeInvoice, getInvoicesByOrderId, generateInvoicePDF, sendInvoiceEmail } from '@/services/invoiceService';
import { Invoice } from '@/services/invoiceService';
import { downloadCoverLetter, printCoverLetter } from '@/services/coverLetterService';
import { collection, addDoc, doc as fsDoc, serverTimestamp, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getFirebaseDb } from '@/firebase/config';

// Define Order interface locally to match the updated interface
interface ExtendedOrder extends Order {
  processingSteps?: ProcessingStep[];
  adminNotes?: AdminNote[];
  internalNotes?: string;
  adminPrice?: any;
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
}

interface AdminNote {
  id: string;
  content: string;
  createdAt: Date;
  createdBy: string;
  type: 'general' | 'processing' | 'customer' | 'issue';
}

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
  const [activeTab, setActiveTab] = useState<'overview' | 'processing' | 'price' | 'files' | 'notes' | 'invoice'>('overview');
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'general' | 'processing' | 'customer' | 'issue'>('general');
  const [internalNotes, setInternalNotes] = useState('');
  const [internalNoteText, setInternalNoteText] = useState('');
  const [internalNotesList, setInternalNotesList] = useState<Array<{ id: string; content: string; createdAt?: any; createdBy?: string }>>([]);
  const [processingSteps, setProcessingSteps] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState<string | null>(null);
  const [removingService, setRemovingService] = useState<string | null>(null);
  // Pricing tab state
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [adjustments, setAdjustments] = useState<Array<{ description: string; amount: number }>>([]);
  const [lineOverrides, setLineOverrides] = useState<Array<{ index: number; label: string; baseAmount: number; overrideAmount?: number | null; vatPercent?: number | null; include: boolean }>>([]);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [pickupTrackingNumber, setPickupTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [savingTracking, setSavingTracking] = useState(false);
  const [isUploadingPickupLabel, setIsUploadingPickupLabel] = useState(false);
  const [sendingPickupLabel, setSendingPickupLabel] = useState(false);
  const pickupLabelInputRef = useRef<HTMLInputElement | null>(null);
  const [editedCustomer, setEditedCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: ''
  });
  const [editedPickupAddress, setEditedPickupAddress] = useState({
    street: '',
    postalCode: '',
    city: ''
  });
  const [savingCustomerInfo, setSavingCustomerInfo] = useState(false);

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
          console.log('✅ Using item.total:', item.total, 'for', item.description);
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
    console.log('🔍 Initializing lineOverrides, total:', totalFromInitial);
    setLineOverrides(initial);
  }, [order?.pricingBreakdown]);

  const getBreakdownTotal = () => {
    try {
      if (!order) {
        console.log('⚠️ getBreakdownTotal: No order yet');
        return 0;
      }
      console.log('🔍 getBreakdownTotal called, order.pricingBreakdown:', order.pricingBreakdown);
      if (order.pricingBreakdown && Array.isArray(order.pricingBreakdown)) {
        // If overrides exist, use them respecting include toggle
        if (lineOverrides.length === order.pricingBreakdown.length) {
          const overrideTotal = lineOverrides.reduce((sum, o) => {
            if (!o.include) return sum;
            const val = o.overrideAmount !== undefined && o.overrideAmount !== null ? Number(o.overrideAmount) : Number(o.baseAmount || 0);
            return sum + (isNaN(val) ? 0 : val);
          }, 0);
          console.log('🔍 Using lineOverrides, total:', overrideTotal);
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
        console.log('🔍 Breakdown Total Calculated:', calculatedTotal, 'vs DB totalPrice:', order.totalPrice);
        return calculatedTotal;
      }
      // Fallback to existing totalPrice if breakdown missing
      console.log('⚠️ No breakdown, using order.totalPrice:', order.totalPrice);
      return Number(order.totalPrice || 0);
    } catch (e) {
      console.error('❌ Error calculating breakdown total:', e);
      return Number(order?.totalPrice || 0);
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
      const mod = await import('@/services/hybridOrderService');
      const updateOrder = (mod as any).default?.updateOrder || (mod as any).updateOrder;
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
      if (typeof updateOrder !== 'function') throw new Error('updateOrder not available');
      await updateOrder(orderId, {
        adminPrice,
        totalPrice: total
      });
      setOrder({ ...order, adminPrice, totalPrice: total } as any);
      toast.success('Pris uppdaterat');
    } catch (e) {
      console.error('Failed to save pricing:', e);
      toast.error('Kunde inte spara pris');
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
    });
    return () => unsub();
  }, [router.query.id]);

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
      name: '✓ Orderverifiering',
      description: 'Kontrollera orderdetaljer, pris och kundinformation',
      status: 'pending'
    });

    // STEP 2: Pickup booking - If customer selected pickup service
    if (orderData.pickupService) {
      steps.push({
        id: 'pickup_booking',
        name: '📦 Boka upphämtning',
        description: `Boka upphämtning hos ${orderData.pickupAddress?.street || 'kund'}`,
        status: 'pending'
      });
    }

    // STEP 3: Document receipt - Different based on source
    if (orderData.documentSource === 'original') {
      steps.push({
        id: 'document_receipt',
        name: '📄 Dokument mottagna',
        description: orderData.pickupService 
          ? 'Originaldokument har hämtats och registrerats'
          : 'Originaldokument har mottagits och registrerats',
        status: 'pending'
      });
    } else {
      steps.push({
        id: 'file_upload_verification',
        name: '📤 Filuppladdning verifierad',
        description: `Kontrollera att kund laddat upp ${orderData.quantity} st dokument`,
        status: orderData.filesUploaded ? 'completed' : 'pending'
      });
    }

    // STEP 4: Quality control - Check documents
    steps.push({
      id: 'quality_control',
      name: '🔍 Kvalitetskontroll',
      description: 'Granska dokument - läsbarhet, komplett, rätt typ',
      status: 'pending'
    });

    // STEP 5-X: Service-specific steps (in logical order)
    if (Array.isArray(orderData.services)) {
      // Notarization usually comes first
      if (orderData.services.includes('notarization')) {
        steps.push({
          id: 'notarization',
          name: '✍️ Notarisering',
          description: 'Notarisering av dokument hos notarius publicus',
          status: 'pending'
        });
      }

      // Translation
      if (orderData.services.includes('translation')) {
        steps.push({
          id: 'translation',
          name: '🌐 Översättning',
          description: 'Auktoriserad översättning av dokument',
          status: 'pending'
        });
      }

      // Chamber legalization
      if (orderData.services.includes('chamber')) {
        steps.push({
          id: 'chamber_processing',
          name: '🏛️ Handelskammaren',
          description: 'Legalisering hos Handelskammaren',
          status: 'pending'
        });
      }

      // UD processing
      if (orderData.services.includes('ud')) {
        steps.push({
          id: 'ud_processing',
          name: '🇸🇪 Utrikesdepartementet',
          description: 'Legalisering hos svenska UD',
          status: 'pending'
        });
      }

      // Apostille (alternative to embassy)
      if (orderData.services.includes('apostille')) {
        steps.push({
          id: 'apostille',
          name: '📋 Apostille',
          description: 'Apostille från svenska UD',
          status: 'pending'
        });
      }

      // Embassy legalization (usually last service)
      if (orderData.services.includes('embassy')) {
        steps.push({
          id: 'embassy_processing',
          name: '🏢 Ambassad',
          description: `Legalisering på ${orderData.country} ambassad`,
          status: 'pending'
        });
      }
    }

    // STEP: Scanning - If requested
    if (orderData.scannedCopies) {
      steps.push({
        id: 'scanning',
        name: '📸 Scannade kopior',
        description: 'Skapa och skicka digitala kopior av dokument',
        status: 'pending'
      });
    }

    // STEP: Final quality check
    steps.push({
      id: 'final_check',
      name: '✅ Slutkontroll',
      description: 'Kontrollera att alla tjänster är utförda korrekt',
      status: 'pending'
    });

    // STEP: Prepare return shipment
    steps.push({
      id: 'prepare_return',
      name: '📦 Förbered retur',
      description: `Packa dokument för ${orderData.returnService || 'retur'}`,
      status: 'pending'
    });

    // STEP: Return shipping
    steps.push({
      id: 'return_shipping',
      name: '🚚 Returfrakt skickad',
      description: 'Dokument skickade till kund - lägg in tracking-nummer',
      status: 'pending'
    });

    steps.push({
      id: 'invoicing',
      name: '🧾 Fakturering',
      description: 'Skapa och skicka faktura till kund',
      status: 'pending'
    });

    return steps;
  };

  const fetchOrder = async (orderIdParam?: string) => {
    setLoading(true);
    try {
      const { getOrderById } = (await import('@/services/hybridOrderService')).default;
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
          city: ci.city || ''
        });

        const pa = extendedOrder.pickupAddress || ({} as any);
        setEditedPickupAddress({
          street: pa.street || '',
          postalCode: pa.postalCode || '',
          city: pa.city || ''
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

      toast.success('Faktura skapad framgångsrikt');

      // Refresh invoices list
      await fetchInvoices(router.query.id as string);

      // Switch to invoice tab
      setActiveTab('invoice');
    } catch (err) {
      console.error('Error creating invoice:', err);
      toast.error('Kunde inte skapa faktura');
    } finally {
      setCreatingInvoice(false);
    }
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    setSendingInvoice(invoice.id!);
    try {
      const success = await sendInvoiceEmail(invoice);
      if (success) {
        toast.success('Faktura skickad via e-post');
      } else {
        toast.error('Kunde inte skicka faktura via e-post');
      }
    } catch (err) {
      console.error('Error sending invoice:', err);
      toast.error('Kunde inte skicka faktura via e-post');
    } finally {
      setSendingInvoice(null);
    }
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      console.log('Starting PDF generation for invoice:', invoice.invoiceNumber);
      await generateInvoicePDF(invoice);
      toast.success('Faktura laddas ner');
    } catch (err) {
      console.error('Error downloading invoice:', err);
      toast.error('Kunde inte ladda ner faktura');
    }
  };

  const handleDownloadCover = () => {
    if (!order) return;
    try {
      downloadCoverLetter(order);
      toast.success('Följesedel laddas ner');
    } catch (err) {
      console.error('Error generating cover letter:', err);
      toast.error('Kunde inte skapa följesedel');
    }
  };

  const handlePrintCover = () => {
    if (!order) return;
    try {
      printCoverLetter(order);
      toast.success('Utskrift startar');
    } catch (err) {
      console.error('Error printing cover letter:', err);
      toast.error('Kunde inte skriva ut följesedel');
    }
  };

  const handleStatusUpdate = async () => {
    if (!order) return;
    const orderId = router.query.id as string;

    setIsUpdating(true);
    try {
      const { updateOrder } = (await import('@/services/hybridOrderService')).default;
      await updateOrder(orderId, { status: editedStatus });
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
      const { updateOrder } = (await import('@/services/hybridOrderService')).default;
      await updateOrder(orderId, { processingSteps: updatedSteps });
      setProcessingSteps(updatedSteps);
      setOrder(updatedOrder);
      toast.success('Bearbetningssteg uppdaterat');
    } catch (err) {
      console.error('Error updating processing step:', err);
      toast.error('Kunde inte uppdatera bearbetningssteg');
    }
  };

  // Save internal notes
  const saveInternalNotes = async () => {
    if (!order) return;
    const orderId = router.query.id as string;

    try {
      const mod = await import('@/services/hybridOrderService');
      const updateOrder = (mod as any).default?.updateOrder || (mod as any).updateOrder;
      if (typeof updateOrder !== 'function') throw new Error('updateOrder not available');
      await updateOrder(orderId, { internalNotes });
      setOrder({ ...order, internalNotes });
      toast.success('Interna anteckningar sparade');
    } catch (err) {
      console.error('Error saving internal notes:', err);
      toast.error('Kunde inte spara interna anteckningar');
    }
  };

  // Save tracking information
  const saveTrackingInfo = async () => {
    if (!order) return;
    const orderId = router.query.id as string;
    setSavingTracking(true);

    try {
      const mod = await import('@/services/hybridOrderService');
      const updateOrder = (mod as any).default?.updateOrder || (mod as any).updateOrder;
      if (typeof updateOrder !== 'function') throw new Error('updateOrder not available');
      await updateOrder(orderId, { 
        returnTrackingNumber: trackingNumber,
        returnTrackingUrl: trackingUrl
      });
      setOrder({ ...order, returnTrackingNumber: trackingNumber, returnTrackingUrl: trackingUrl });
      toast.success('Tracking-information sparad');
    } catch (err) {
      console.error('Error saving tracking info:', err);
      toast.error('Kunde inte spara tracking-information');
    } finally {
      setSavingTracking(false);
    }
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
      city: ci.city || ''
    });
    setEditedPickupAddress({
      street: pa.street || '',
      postalCode: pa.postalCode || '',
      city: pa.city || ''
    });
    toast.success('Tidigare kunduppgifter inlästa – glöm inte att spara');
  };

  // Upload pickup label file (e.g. DHL-label)
  const handlePickupLabelUpload = async (file: File) => {
    if (!order) return;
    const orderId = (order.orderNumber as string) || (router.query.id as string);
    if (!orderId) {
      toast.error('Ordernummer saknas, kan inte ladda upp label');
      return;
    }

    // Enforce filename rule: must contain order number
    if (!file.name.includes(orderId)) {
      toast.error(`Filnamnet måste innehålla ordernumret ${orderId}`);
      return;
    }

    setIsUploadingPickupLabel(true);

    try {
      const mod = await import('@/services/hybridOrderService');
      const uploadFiles = (mod as any).default?.uploadFiles || (mod as any).uploadFiles;
      const updateOrder = (mod as any).default?.updateOrder || (mod as any).updateOrder;
      if (typeof uploadFiles !== 'function' || typeof updateOrder !== 'function') {
        toast.error('Kan inte ladda upp label just nu');
        return;
      }

      const uploaded = await uploadFiles([file], orderId);
      const labelMeta = uploaded && uploaded.length > 0 ? uploaded[0] : null;
      if (!labelMeta) {
        toast.error('Kunde inte ladda upp label');
        return;
      }

      await updateOrder(orderId, { pickupLabelFile: labelMeta });
      setOrder({ ...order, pickupLabelFile: labelMeta } as ExtendedOrder);
      toast.success('Label uppladdad');
    } catch (err) {
      toast.error('Kunde inte ladda upp label');
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
      toast.error('Kundens e-post saknas');
      return;
    }

    if (!labelFile || !labelFile.downloadURL) {
      toast.error('Ingen label uppladdad ännu');
      return;
    }

    setSendingPickupLabel(true);

    try {
      const db = getFirebaseDb();
      if (!db) {
        toast.error('Kan inte ansluta till databasen för att skicka e-post');
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
      toast.success('Label skickad till kunden');
    } catch (err) {
      toast.error('Kunde inte skicka label via e-post');
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
      const mod = await import('@/services/hybridOrderService');
      const updateOrder = (mod as any).default?.updateOrder || (mod as any).updateOrder;
      if (typeof updateOrder !== 'function') throw new Error('updateOrder not available');
      await updateOrder(orderId, {
        pickupTrackingNumber
      });
      setOrder({ ...order, pickupTrackingNumber });
      toast.success('Tracking för upphämtning sparad');
    } catch (err) {
      console.error('Error saving pickup tracking info:', err);
      toast.error('Kunde inte spara tracking för upphämtning');
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
      city: editedCustomer.city.trim()
    };

    const currentPickup: any = order.pickupAddress || {};
    const newPickup: any = order.pickupService
      ? {
          street: editedPickupAddress.street.trim(),
          postalCode: editedPickupAddress.postalCode.trim(),
          city: editedPickupAddress.city.trim()
        }
      : currentPickup;

    const hasCustomerChanges =
      (currentCustomer.firstName || '') !== newCustomer.firstName ||
      (currentCustomer.lastName || '') !== newCustomer.lastName ||
      (currentCustomer.email || '') !== newCustomer.email ||
      (currentCustomer.phone || '') !== newCustomer.phone ||
      (currentCustomer.address || '') !== newCustomer.address ||
      (currentCustomer.postalCode || '') !== newCustomer.postalCode ||
      (currentCustomer.city || '') !== newCustomer.city;

    const hasPickupChanges = order.pickupService && (
      (currentPickup.street || '') !== newPickup.street ||
      (currentPickup.postalCode || '') !== newPickup.postalCode ||
      (currentPickup.city || '') !== newPickup.city
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
      const mod = await import('@/services/hybridOrderService');
      const updateOrder = (mod as any).default?.updateOrder || (mod as any).updateOrder;
      if (typeof updateOrder !== 'function') throw new Error('updateOrder not available');

      const updates: any = {
        customerInfo: newCustomer,
        customerHistory: updatedHistory
      };

      if (order.pickupService) {
        updates.pickupAddress = newPickup;
      }

      await updateOrder(orderId, updates);

      setOrder({
        ...order,
        customerInfo: newCustomer,
        pickupAddress: updates.pickupAddress || order.pickupAddress,
        customerHistory: updatedHistory
      } as ExtendedOrder);

      toast.success('Kundinformation sparad');
    } catch (err) {
      console.error('Error saving customer info:', err);
      toast.error('Kunde inte spara kundinformation');
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
        createdBy: actor
      });
      setInternalNoteText('');
      toast.success('Anteckning tillagd');
    } catch (e) {
      console.error('Failed to add internal note:', e);
      toast.error('Kunde inte lägga till anteckning');
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
      const { updateOrder } = (await import('@/services/hybridOrderService')).default;
      await updateOrder(orderId, { adminNotes: updatedOrder.adminNotes });
      setOrder(updatedOrder);
      setNewNote('');
      toast.success('Anteckning tillagd');
    } catch (err) {
      console.error('Error adding note:', err);
      toast.error('Kunde inte lägga till anteckning');
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

      // Handle removal of additional services
      if (serviceToRemove === 'scanned_copies') {
        updatedScannedCopies = false;
      } else if (serviceToRemove === 'pickup_service') {
        updatedPickupService = false;
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
        returnService: order.returnService,
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
          if (serviceToRemove === 'embassy' && step.id === 'embassy_processing') return false;
          if (serviceToRemove === 'apostille' && step.id === 'apostille') return false;
          if (serviceToRemove === 'scanned_copies' && step.id === 'scanning') return false;
          return true;
        });

      // Update the order
      const updatedOrder = {
        ...order,
        services: updatedServices,
        scannedCopies: updatedScannedCopies,
        pickupService: updatedPickupService,
        totalPrice: pricingResult.totalPrice,
        pricingBreakdown: pricingResult.breakdown,
        processingSteps: updatedProcessingSteps
      };

      const { updateOrder } = (await import('@/services/hybridOrderService')).default;
      await updateOrder(orderId, {
        services: updatedServices,
        scannedCopies: updatedScannedCopies,
        pickupService: updatedPickupService,
        totalPrice: pricingResult.totalPrice,
        pricingBreakdown: pricingResult.breakdown,
        processingSteps: updatedProcessingSteps
      });

      setOrder(updatedOrder);
      setProcessingSteps(updatedProcessingSteps);
      toast.success(`Tjänst "${getServiceName(serviceToRemove)}" har tagits bort från ordern`);
    } catch (err) {
      console.error('Error removing service:', err);
      toast.error('Kunde inte ta bort tjänsten från ordern');
    } finally {
      setRemovingService(null);
    }
  };

  // Function to get service name
  const getServiceName = (serviceId: string) => {
    switch (serviceId) {
      case 'apostille':
        return 'Apostille';
      case 'notarization':
      case 'notarisering':
        return 'Notarisering';
      case 'embassy':
      case 'ambassad':
        return 'Ambassadlegalisering';
      case 'translation':
      case 'oversattning':
        return 'Översättning';
      case 'utrikesdepartementet':
      case 'ud':
        return 'Utrikesdepartementet';
      case 'chamber':
        return 'Handelskammarens legalisering';
      default:
        return serviceId;
    }
  };

  // Function to check if a step is an authority service
  const isAuthorityService = (stepId: string) => {
    return ['notarization', 'chamber_processing', 'ud_processing', 'apostille', 'embassy_processing', 'translation'].includes(stepId);
  };

  // Function to get service status based on processing steps
  const getServiceStatus = (serviceId: string) => {
    if (!processingSteps || processingSteps.length === 0) return 'väntar';

    // Map service IDs to processing step IDs
    const serviceToStepMap: { [key: string]: string } = {
      'apostille': 'apostille',
      'notarisering': 'notarization',
      'notarization': 'notarization',
      'ambassad': 'embassy_processing',
      'embassy': 'embassy_processing',
      'oversattning': 'translation',
      'translation': 'translation',
      'utrikesdepartementet': 'ud_processing',
      'ud': 'ud_processing',
      'chamber': 'chamber_processing',
      'scanned_copies': 'scanning',
      'pickup_service': 'document_receipt' // Map pickup to document receipt step
    };

    const stepId = serviceToStepMap[serviceId];
    if (!stepId) return 'väntar';

    const step = processingSteps.find(s => s.id === stepId);
    if (!step) return 'väntar';

    switch (step.status) {
      case 'completed':
        return 'klar';
      case 'in_progress':
        return 'pågår';
      case 'pending':
        return 'väntar';
      case 'skipped':
        return 'hoppas över';
      default:
        return 'väntar';
    }
  };

  // Function to get status color class
  const getServiceStatusColor = (status: string) => {
    switch (status) {
      case 'klar':
        return 'text-green-600 bg-green-50';
      case 'pågår':
        return 'text-blue-600 bg-blue-50';
      case 'väntar':
        return 'text-gray-600 bg-gray-50';
      case 'hoppas över':
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
              <p className="text-gray-600">Laddar orderdetaljer...</p>
            </div>
          ) : order ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Quick Actions Bar */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(order.status)}`}>
                      {order.status === 'pending' ? 'Väntar' :
                       order.status === 'processing' ? 'Bearbetas' :
                       order.status === 'shipped' ? 'Skickad' :
                       order.status === 'delivered' ? 'Levererad' :
                       order.status === 'cancelled' ? 'Avbruten' : order.status}
                    </span>
                    <span className="text-lg font-semibold text-gray-900">{getComputedTotal()} kr</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={editedStatus}
                      onChange={(e) => setEditedStatus(e.target.value as Order['status'])}
                      className="border border-gray-300 rounded px-3 py-1 text-sm"
                      disabled={isUpdating}
                    >
                      <option value="pending">Väntar</option>
                      <option value="processing">Bearbetas</option>
                      <option value="shipped">Skickad</option>
                      <option value="delivered">Levererad</option>
                      <option value="cancelled">Avbruten</option>
                    </select>
                    <button
                      onClick={handleStatusUpdate}
                      disabled={isUpdating || order.status === editedStatus}
                      className="px-4 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-sm"
                    >
                      {isUpdating ? 'Uppdaterar...' : 'Uppdatera'}
                    </button>
                    <button
                      onClick={handleDownloadCover}
                      className="px-3 py-1 border border-gray-300 rounded text-sm bg-white text-gray-700 hover:bg-gray-50 flex items-center"
                      title="Ladda ner följesedel som PDF"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Följesedel PDF
                    </button>
                    <button
                      onClick={handlePrintCover}
                      className="px-3 py-1 border border-gray-300 rounded text-sm bg-white text-gray-700 hover:bg-gray-50 flex items-center"
                      title="Skriv ut följesedel"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-3a2 2 0 00-2-2h-2V7a2 2 0 00-2-2H9a2 2 0 00-2 2v3H5a2 2 0 00-2 2v3a2 2 0 002 2h2m2 0h6v4H7v-4h6z" />
                      </svg>
                      Skriv ut
                    </button>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <nav className="flex">
                  {[
                    { id: 'overview', label: 'Översikt', icon: '📋' },
                    { id: 'processing', label: 'Bearbetning', icon: '⚙️' },
                    { id: 'price', label: 'Pris', icon: '💰' },
                    { id: 'files', label: 'Filer', icon: '📎' },
                    { id: 'invoice', label: 'Faktura', icon: '🧾' },
                    { id: 'notes', label: 'Anteckningar', icon: '📝' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center px-4 py-2 mr-2 rounded-md font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                      }`}
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.label}
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
                        <h3 className="text-lg font-medium text-gray-800">Orderöversikt</h3>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Order Details */}
                          <div className="lg:col-span-2 space-y-4">
                            {/* Basic Order Info + compact services */}
                            <div>
                              <h3 className="text-sm font-semibold mb-1 text-gray-800">Orderinformation</h3>
                              {(() => {
                                const c = getCountryInfo(order.country);
                                return (
                                  <div className="space-y-0.5 text-xs">
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-500">Dokumenttyp:</span>
                                      <span className="font-medium text-gray-900">
                                        {order.documentType === 'birthCertificate' ? 'Födelsebevis' :
                                         order.documentType === 'marriageCertificate' ? 'Vigselbevis' :
                                         order.documentType === 'diploma' ? 'Examensbevis' :
                                         order.documentType === 'commercial' ? 'Handelsdokument' :
                                         order.documentType === 'powerOfAttorney' ? 'Fullmakt' : 'Annat dokument'}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-500">Land:</span>
                                      <span className="flex items-center space-x-1 font-medium text-gray-900">
                                        <span aria-hidden="true">{c.flag}</span>
                                        <span>{c.name || c.code}</span>
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-500">Antal dokument:</span>
                                      <span className="font-medium text-gray-900">{order.quantity} st</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-500">Källa:</span>
                                      <span className="font-medium text-gray-900">
                                        {order.documentSource === 'original' ? 'Originaldokument' : 'Uppladdade filer'}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Processing Steps Overview */}
                            <div>
                              <h3 className="text-xs font-semibold uppercase tracking-wide mb-1 text-gray-700">Bearbetningssteg</h3>
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
                                        {step.status === 'completed' ? 'Klar' :
                                         step.status === 'in_progress' ? 'Pågår' :
                                         step.status === 'pending' ? 'Väntar' : 'Hoppas över'}
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
                                  Hantera bearbetning →
                                </button>
                              </div>
                            </div>

                            {/* Pricing Breakdown removed from Overview as requested */}

                            {/* Notes summary in Overview */}
                            <div>
                              <h3 className="text-lg font-medium mb-4">Anteckningar</h3>
                              <div className="space-y-3">
                                {internalNotesList.length === 0 && (
                                  <div className="text-sm text-gray-500">Inga anteckningar ännu</div>
                                )}
                                {internalNotesList.slice(0, 5).map((n) => (
                                  <div key={n.id} className="border border-gray-200 rounded p-3 bg-white">
                                    <div className="whitespace-pre-wrap text-sm text-gray-800">{n.content}</div>
                                    <div className="mt-2 text-xs text-gray-500">
                                      Skapad {formatDate(n.createdAt)} av {n.createdBy || 'Okänd'}
                                    </div>
                                  </div>
                                ))}
                                {internalNotesList.length > 5 && (
                                  <div className="text-sm text-gray-600">Visar de senaste 5 anteckningarna</div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('processing')}
                                  className="text-primary-600 text-sm underline"
                                >
                                  Visa alla anteckningar →
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Customer Info Sidebar */}
                          <div className="space-y-6">
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                              <h3 className="text-lg font-medium mb-4">Kundinformation</h3>
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">Förnamn</label>
                                    <input
                                      type="text"
                                      value={editedCustomer.firstName}
                                      onChange={(e) => setEditedCustomer({ ...editedCustomer, firstName: e.target.value })}
                                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">Efternamn</label>
                                    <input
                                      type="text"
                                      value={editedCustomer.lastName}
                                      onChange={(e) => setEditedCustomer({ ...editedCustomer, lastName: e.target.value })}
                                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">E-post</label>
                                  <input
                                    type="email"
                                    value={editedCustomer.email}
                                    onChange={(e) => setEditedCustomer({ ...editedCustomer, email: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Telefon</label>
                                  <input
                                    type="tel"
                                    value={editedCustomer.phone}
                                    onChange={(e) => setEditedCustomer({ ...editedCustomer, phone: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Adress</label>
                                  <input
                                    type="text"
                                    value={editedCustomer.address}
                                    onChange={(e) => setEditedCustomer({ ...editedCustomer, address: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm mb-1"
                                  />
                                  <div className="grid grid-cols-2 gap-2 mt-1">
                                    <input
                                      type="text"
                                      placeholder="Postnummer"
                                      value={editedCustomer.postalCode}
                                      onChange={(e) => setEditedCustomer({ ...editedCustomer, postalCode: e.target.value })}
                                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Ort"
                                      value={editedCustomer.city}
                                      onChange={(e) => setEditedCustomer({ ...editedCustomer, city: e.target.value })}
                                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                                    />
                                  </div>
                                </div>

                                {order.pickupService && (
                                  <div className="mt-4 border-t border-gray-200 pt-3 space-y-2">
                                    <p className="text-sm font-medium text-gray-700">Hämtningsadress</p>
                                    <input
                                      type="text"
                                      placeholder="Gatuadress"
                                      value={editedPickupAddress.street}
                                      onChange={(e) => setEditedPickupAddress({ ...editedPickupAddress, street: e.target.value })}
                                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm mb-1"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                      <input
                                        type="text"
                                        placeholder="Postnummer"
                                        value={editedPickupAddress.postalCode}
                                        onChange={(e) => setEditedPickupAddress({ ...editedPickupAddress, postalCode: e.target.value })}
                                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                                      />
                                      <input
                                        type="text"
                                        placeholder="Ort"
                                        value={editedPickupAddress.city}
                                        onChange={(e) => setEditedPickupAddress({ ...editedPickupAddress, city: e.target.value })}
                                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                                      />
                                    </div>
                                  </div>
                                )}

                                <div className="mt-4 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={saveCustomerInfo}
                                    disabled={savingCustomerInfo}
                                    className="px-3 py-1.5 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {savingCustomerInfo ? 'Sparar...' : 'Spara kundinfo'}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Customer history */}
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                              <h3 className="text-lg font-medium mb-3">Tidigare kunduppgifter</h3>
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
                                            Ladda in
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
                                            Ändrad {formatDate(h.timestamp)} av {h.changedBy || 'Okänd'}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">Ingen historik ännu</p>
                              )}
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                              <h3 className="text-lg font-medium mb-4">Snabba åtgärder</h3>
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
                                        Skapar faktura...
                                      </>
                                    ) : (
                                      <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Skapa faktura
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
                                    Visa fakturor ({invoices.length})
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
                                  Skicka e-post
                                </Link>
                                <button
                                  onClick={() => window.print()}
                                  className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                  </svg>
                                  Skriv ut
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Price Tab */}
                {activeTab === 'price' && (
                  <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium mb-4">Prisjusteringar</h3>
                      {/* Per-service override table */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm border border-gray-200 rounded">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left">Inkludera</th>
                              <th className="px-3 py-2 text-left">Beskrivning</th>
                              <th className="px-3 py-2 text-right">Grundbelopp</th>
                              <th className="px-3 py-2 text-right">Nytt belopp</th>
                              <th className="px-3 py-2 text-right">Moms %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.isArray(order?.pricingBreakdown) && order!.pricingBreakdown.length > 0 ? (
                              order!.pricingBreakdown.map((item: any, idx: number) => {
                                const o = lineOverrides[idx] || { index: idx, label: item.description || getServiceName(item.service) || 'Rad', baseAmount: 0, include: true };
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
                                <td colSpan={5} className="px-3 py-4 text-center text-gray-500">Inga rader</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Grundbelopp (från prisuppdelning)</p>
                          <div className="text-xl font-semibold">{getBreakdownTotal()} kr</div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Nytt totalbelopp</p>
                          <div className="text-xl font-semibold">{getComputedTotal()} kr</div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h4 className="font-medium mb-2">Rabatt</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Rabatt i kr</label>
                            <input type="number" value={discountAmount} onChange={(e) => setDiscountAmount(Number(e.target.value))} className="w-full border rounded px-3 py-2" />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Rabatt i %</label>
                            <input type="number" value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))} className="w-full border rounded px-3 py-2" />
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h4 className="font-medium mb-2">Justeringar</h4>
                        <div className="space-y-3">
                          {adjustments.map((adj, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                              <input
                                type="text"
                                placeholder="Beskrivning"
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
                                placeholder="Belopp (+/-)"
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
                                Ta bort
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => setAdjustments([...adjustments, { description: '', amount: 0 }])}
                            className="px-3 py-2 border border-gray-300 rounded text-sm"
                          >
                            Lägg till rad
                          </button>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Summa justeringar: {getAdjustmentsTotal()} kr • Rabatt totalt: {getDiscountTotal(getBreakdownTotal())} kr
                        </div>
                        <button
                          onClick={savePricingAdjustments}
                          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                        >
                          Spara pris
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Processing Tab */}
                {activeTab === 'processing' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Bearbetningssteg</h3>
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
                                onChange={(e) => updateProcessingStep(step.id, e.target.value as ProcessingStep['status'])}
                                className="border border-gray-300 rounded px-2 py-1 text-sm"
                              >
                                <option value="pending">Väntar</option>
                                <option value="in_progress">Pågår</option>
                                <option value="completed">Klar</option>
                                <option value="skipped">Hoppas över</option>
                              </select>
                            </div>
                            {isAuthorityService(step.id) && (
                              <div className="mt-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Datum för inlämning till myndighet
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
                                      Datum klart för upphämtning
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
                              </div>
                            )}
                            {step.status === 'completed' && step.completedAt && (
                              <div className="text-xs text-gray-500 mt-2">
                                Slutfört {formatDate(step.completedAt)} av {step.completedBy}
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
                                </div>

                                <div className="space-y-2">
                                  <div className="text-sm text-gray-700">
                                    <p className="font-medium">DHL-label</p>
                                    <p className="text-xs text-gray-500">
                                      Filnamnet måste innehålla ordernumret {order?.orderNumber || (router.query.id as string)}.
                                    </p>
                                  </div>

                                  {order && (order as any).pickupLabelFile && (
                                    <div className="flex items-center justify-between text-sm bg-gray-50 border border-gray-200 rounded px-3 py-2">
                                      <div>
                                        <p className="font-medium">Uppladdad label</p>
                                        <p className="text-gray-700 truncate max-w-xs">{(order as any).pickupLabelFile.originalName}</p>
                                      </div>
                                      {(order as any).pickupLabelFile.downloadURL && (
                                        <a
                                          href={(order as any).pickupLabelFile.downloadURL}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-primary-600 text-sm underline ml-4"
                                        >
                                          Öppna
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
                                      {isUploadingPickupLabel ? 'Laddar upp...' : 'Ladda upp label'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleSendPickupLabel}
                                      disabled={sendingPickupLabel || !(order as any).pickupLabelFile}
                                      className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {sendingPickupLabel ? 'Skickar...' : 'Skicka label'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                            {step.id === 'return_shipping' && (
                              <div className="mt-3 space-y-2">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tracking-nummer för retur
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
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Internal Notes (append-only) */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">Interna anteckningar</h3>
                      <div className="space-y-3 mb-4">
                        {internalNotesList.length === 0 && (
                          <div className="text-sm text-gray-500">Inga anteckningar ännu</div>
                        )}
                        {internalNotesList.map((n) => (
                          <div key={n.id} className="border border-gray-200 rounded p-3 bg-gray-50">
                            <div className="whitespace-pre-wrap text-sm text-gray-800">{n.content}</div>
                            <div className="mt-2 text-xs text-gray-500">
                              Skapad {formatDate(n.createdAt)} av {n.createdBy || 'Okänd'}
                            </div>
                          </div>
                        ))}
                      </div>
                      <textarea
                        value={internalNoteText}
                        onChange={(e) => setInternalNoteText(e.target.value)}
                        placeholder="Skriv en ny intern anteckning..."
                        className="w-full border border-gray-300 rounded-lg p-3"
                        rows={3}
                      />
                      <div className="mt-2">
                        <button
                          onClick={addInternalNote}
                          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                        >
                          Lägg till anteckning
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Files Tab */}
                {activeTab === 'files' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Uppladdade filer</h3>
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
                                  Ladda ner
                                </a>
                                <button
                                  onClick={() => window.open(file.downloadURL, '_blank')}
                                  className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                                >
                                  Förhandsvisa
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
                          <p>Inga filer uppladdade än</p>
                        </div>
                      )}
                    </div>

                    {/* Pickup Address */}
                    {order.pickupService && order.pickupAddress && (
                      <div>
                        <h3 className="text-lg font-medium mb-4">Hämtningsadress</h3>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="font-medium text-blue-800">Dokumenthämtning beställd</span>
                          </div>
                          <p className="text-blue-700">{order.pickupAddress.street}</p>
                          <p className="text-blue-700">{order.pickupAddress.postalCode} {order.pickupAddress.city}</p>
                          <p className="text-blue-600 text-sm mt-2">Vi kommer att kontakta kunden inom 24 timmar för att boka tid för hämtning.</p>
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
                            <h3 className="text-lg font-medium text-blue-800 mb-2">Ingen faktura skapad än</h3>
                            <p className="text-blue-700 mb-4">
                              Skapa en faktura för denna order för att kunna skicka den till kunden och hålla koll på betalningar.
                            </p>
                            <button
                              onClick={handleCreateInvoice}
                              disabled={creatingInvoice}
                              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
                            >
                              {creatingInvoice ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Skapar faktura...
                                </>
                              ) : (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                  Skapa faktura
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
                          <h3 className="text-lg font-medium">Fakturor ({invoices.length})</h3>
                          <button
                            onClick={handleCreateInvoice}
                            disabled={creatingInvoice}
                            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 flex items-center text-sm"
                          >
                            {creatingInvoice ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Skapar...
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Ny faktura
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
                                    Skapad {formatDate(invoice.issueDate)} • Förfaller {formatDate(invoice.dueDate)}
                                  </p>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                                    invoice.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                    invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                                    invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                                    invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {invoice.status === 'draft' ? 'Utkast' :
                                     invoice.status === 'sent' ? 'Skickad' :
                                     invoice.status === 'paid' ? 'Betald' :
                                     invoice.status === 'overdue' ? 'Förfallen' :
                                     invoice.status}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-gray-900">{invoice.totalAmount} kr</div>
                                  <div className="text-sm text-gray-600">Inkl. moms</div>
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
                                  Ladda ner PDF
                                </button>

                                <button
                                  onClick={() => handleSendInvoice(invoice)}
                                  disabled={sendingInvoice === invoice.id}
                                  className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                  {sendingInvoice === invoice.id ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                                      Skickar...
                                    </>
                                  ) : (
                                    <>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                      </svg>
                                      Skicka via e-post
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
                                  Visa detaljer
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
                      <h3 className="text-lg font-medium mb-4">Lägg till anteckning</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Typ av anteckning</label>
                          <select
                            value={noteType}
                            onChange={(e) => setNoteType(e.target.value as AdminNote['type'])}
                            className="border border-gray-300 rounded px-3 py-2"
                          >
                            <option value="general">Allmänt</option>
                            <option value="processing">Bearbetning</option>
                            <option value="customer">Kundrelaterat</option>
                            <option value="issue">Problem</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Anteckning</label>
                          <textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Skriv din anteckning här..."
                            className="w-full border border-gray-300 rounded-lg p-3"
                            rows={3}
                          />
                        </div>
                        <button
                          onClick={addNote}
                          disabled={!newNote.trim()}
                          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                        >
                          Lägg till anteckning
                        </button>
                      </div>
                    </div>

                    {/* Existing Notes */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Tidigare anteckningar</h3>
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
                                    {note.type === 'general' ? 'Allmänt' :
                                     note.type === 'processing' ? 'Bearbetning' :
                                     note.type === 'customer' ? 'Kund' : 'Problem'}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    {formatDate(note.createdAt)} av {note.createdBy}
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
                          <p>Inga anteckningar än</p>
                        </div>
                      )}
                    </div>

                    {/* Customer Information from Order */}
                    {(order.invoiceReference || order.additionalNotes) && (
                      <div>
                        <h3 className="text-lg font-medium mb-4">Kundens information</h3>
                        <div className="space-y-4">
                          {order.invoiceReference && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <h4 className="font-medium text-green-800 mb-2">Fakturareferens</h4>
                              <p className="text-green-700">{order.invoiceReference}</p>
                            </div>
                          )}
                          {order.additionalNotes && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                              <h4 className="font-medium text-purple-800 mb-2">Ytterligare information</h4>
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
              <p className="text-gray-600">Ordern hittades inte</p>
              <Link href="/admin/orders" className="mt-4 inline-block text-primary-600 hover:text-primary-800">
                Tillbaka till alla ordrar
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const ClientOnlyAdminOrderDetail = () => (
  <ProtectedRoute>
    <AdminOrderDetailPage />
  </ProtectedRoute>
);

export default dynamic(() => Promise.resolve(ClientOnlyAdminOrderDetail), { ssr: false });
