/**
 * Admin Visa Order Detail Page
 * Displays and manages a single visa order
 */

import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import CountryFlag from '@/components/ui/CountryFlag';
import { 
  getVisaOrder, 
  updateVisaOrder, 
  updateVisaOrderStatus,
  updateVisaProcessingStep,
  getDefaultVisaProcessingSteps,
  VisaOrder, 
  VisaProcessingStep 
} from '@/firebase/visaOrderService';
import { getAvailableVisaProducts, VisaProduct } from '@/firebase/visaRequirementsService';
import { 
  convertVisaOrderToInvoice, 
  storeInvoice, 
  getInvoicesByOrderId, 
  generateInvoicePDF, 
  sendInvoiceEmail,
  Invoice 
} from '@/services/invoiceService';

type VisaOrderStatus = VisaOrder['status'];

const STATUS_LABELS: Record<VisaOrderStatus, string> = {
  'pending': 'Pending',
  'received': 'Received',
  'documents-required': 'Documents Required',
  'processing': 'Processing',
  'submitted-to-embassy': 'Submitted to Embassy',
  'approved': 'Approved',
  'ready-for-return': 'Ready for Return',
  'completed': 'Completed',
  'rejected': 'Rejected',
  'cancelled': 'Cancelled'
};

const STATUS_COLORS: Record<VisaOrderStatus, string> = {
  'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'received': 'bg-blue-100 text-blue-800 border-blue-300',
  'documents-required': 'bg-orange-100 text-orange-800 border-orange-300',
  'processing': 'bg-purple-100 text-purple-800 border-purple-300',
  'submitted-to-embassy': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'approved': 'bg-green-100 text-green-800 border-green-300',
  'ready-for-return': 'bg-teal-100 text-teal-800 border-teal-300',
  'completed': 'bg-gray-100 text-gray-800 border-gray-300',
  'rejected': 'bg-red-100 text-red-800 border-red-300',
  'cancelled': 'bg-gray-200 text-gray-600 border-gray-400'
};

const ALL_STATUSES: VisaOrderStatus[] = [
  'pending', 'received', 'documents-required', 'processing', 
  'submitted-to-embassy', 'approved', 'ready-for-return', 
  'completed', 'rejected', 'cancelled'
];

// Helper function to update visa order via Admin API (bypasses Firestore security rules)
const adminUpdateVisaOrder = async (orderId: string, updates: Record<string, any>): Promise<void> => {
  const response = await fetch('/api/admin/update-visa-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, updates })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update visa order');
  }
};

function VisaOrderDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { currentUser, signOut } = useAuth();
  
  const [order, setOrder] = useState<VisaOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'processing' | 'coverletters' | 'services' | 'price' | 'files' | 'invoice' | 'notes'>('overview');
  const [internalNotes, setInternalNotes] = useState('');
  
  // Pricing adjustment state
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [adjustments, setAdjustments] = useState<Array<{ description: string; amount: number }>>([]);
  const [lineOverrides, setLineOverrides] = useState<Array<{ index: number; label: string; baseAmount: number; overrideAmount?: number | null; vatPercent?: number | null; include: boolean }>>([]);
  
  // Invoice state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState<string | null>(null);
  
  // Return address editing state
  const [editedReturnAddress, setEditedReturnAddress] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    street: '',
    postalCode: '',
    city: '',
    country: '',
    phone: '',
    email: ''
  });
  const [savingReturnAddress, setSavingReturnAddress] = useState(false);
  
  // Service management state
  const [newServiceToAdd, setNewServiceToAdd] = useState('');
  const [addingService, setAddingService] = useState(false);
  const [removingService, setRemovingService] = useState<string | null>(null);
  
  // Visa product change state
  const [showChangeVisa, setShowChangeVisa] = useState(false);
  const [availableVisaProducts, setAvailableVisaProducts] = useState<VisaProduct[]>([]);
  const [loadingVisaProducts, setLoadingVisaProducts] = useState(false);
  const [changingVisaProduct, setChangingVisaProduct] = useState(false);
  
  // Document request state
  const [showDocumentRequestModal, setShowDocumentRequestModal] = useState(false);
  const [documentRequestTemplate, setDocumentRequestTemplate] = useState('custom');
  const [documentRequestMessage, setDocumentRequestMessage] = useState('');
  const [sendingDocumentRequest, setSendingDocumentRequest] = useState(false);
  
  // Embassy cover letter state
  const [embassyCoverLetterData, setEmbassyCoverLetterData] = useState<{
    embassyName: string;
    embassyAddress: string;
    applicantName: string;
    passportNumber: string;
    nationality: string;
    visaType: string;
    travelDates: string;
    purpose: string;
    orderNumber: string;
    invoiceReference: string;
    paymentMethod: string;
    returnMethod: string;
  } | null>(null);

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadOrder(id);
    }
  }, [id]);

  // Initialize pricing editor from order.adminPrice if available
  useEffect(() => {
    if (order && (order as any).adminPrice) {
      const ap = (order as any).adminPrice;
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
  }, [(order as any)?.adminPrice]);

  // Initialize line overrides from order pricing if no saved overrides
  useEffect(() => {
    if (!order) return;
    
    // Skip if we already have saved lineOverrides from adminPrice
    const ap = (order as any).adminPrice;
    if (ap && Array.isArray(ap.lineOverrides) && ap.lineOverrides.length > 0) {
      return;
    }
    
    // Build line items from visa order pricing
    // Split into embassy fee (0% VAT) and service fee (25% VAT) - same as legalizations
    const items: Array<{ label: string; amount: number; defaultVat: number }> = [];
    
    // Embassy fee - 0% VAT (official government fee)
    if (order.pricingBreakdown?.embassyFee) {
      items.push({ 
        label: `Embassy Fee - ${order.visaProduct?.name || 'Visa'}`, 
        amount: order.pricingBreakdown.embassyFee,
        defaultVat: 0 
      });
    }
    
    // Service fee - 25% VAT (DOX service fee)
    if (order.pricingBreakdown?.serviceFee) {
      items.push({ 
        label: `DOX Service Fee - ${order.visaProduct?.name || 'Visa'}`, 
        amount: order.pricingBreakdown.serviceFee,
        defaultVat: 25 
      });
    }
    
    // Fallback: if no breakdown, use total visa product price
    if (!order.pricingBreakdown?.embassyFee && !order.pricingBreakdown?.serviceFee && order.visaProduct?.price) {
      const basePrice = order.visaProduct.price - 
        (order.pricingBreakdown?.expressPrice || 0) - 
        (order.pricingBreakdown?.urgentPrice || 0);
      items.push({ 
        label: `Visa Product (${order.visaProduct.name})`, 
        amount: basePrice > 0 ? basePrice : order.visaProduct.price,
        defaultVat: 25 
      });
    }
    
    // Express fee - 25% VAT
    if (order.pricingBreakdown?.expressPrice) {
      items.push({ label: 'Express Processing', amount: order.pricingBreakdown.expressPrice, defaultVat: 25 });
    }
    
    // Urgent fee - 25% VAT
    if (order.pricingBreakdown?.urgentPrice) {
      items.push({ label: 'Urgent Processing', amount: order.pricingBreakdown.urgentPrice, defaultVat: 25 });
    }
    
    // Shipping fee - 25% VAT
    if (order.pricingBreakdown?.shippingFee) {
      items.push({ label: 'Shipping', amount: order.pricingBreakdown.shippingFee, defaultVat: 25 });
    }
    
    // Expedited fee (legacy) - 25% VAT
    if (order.pricingBreakdown?.expeditedFee) {
      items.push({ label: 'Expedited Processing', amount: order.pricingBreakdown.expeditedFee, defaultVat: 25 });
    }
    
    const initial = items.map((item, idx) => ({
      index: idx,
      label: item.label,
      baseAmount: item.amount,
      overrideAmount: null,
      vatPercent: item.defaultVat,
      include: true
    }));
    
    setLineOverrides(initial);
  }, [order?.id, order?.visaProduct?.price, order?.pricingBreakdown]);

  // Pricing helper functions
  const getBreakdownTotal = () => {
    if (lineOverrides.length > 0) {
      return lineOverrides.reduce((sum, o) => {
        if (!o.include) return sum;
        const val = o.overrideAmount !== undefined && o.overrideAmount !== null ? Number(o.overrideAmount) : Number(o.baseAmount || 0);
        return sum + (isNaN(val) ? 0 : val);
      }, 0);
    }
    return Number(order?.totalPrice || 0);
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
    if (!order?.id) return;
    setSaving(true);
    try {
      const base = getBreakdownTotal();
      const total = getComputedTotal();
      const actor = currentUser?.email || 'admin';
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
      await adminUpdateVisaOrder(order.id, {
        adminPrice,
        totalPrice: total
      });
      setOrder({ ...order, adminPrice, totalPrice: total } as any);
      toast.success('Price updated');
    } catch (e) {
      toast.error('Could not save price');
    } finally {
      setSaving(false);
    }
  };

  const loadOrder = async (orderId: string) => {
    setLoading(true);
    try {
      const orderData = await getVisaOrder(orderId);
      if (orderData) {
        // Initialize processing steps if they don't exist or are empty
        if (!orderData.processingSteps || orderData.processingSteps.length === 0) {
          const defaultSteps = getDefaultVisaProcessingSteps(orderData);
          orderData.processingSteps = defaultSteps;
          // Save the initialized steps to the database
          try {
            await updateVisaOrder(orderId, { processingSteps: defaultSteps });
          } catch (e) {
            // Silent fail - steps will still show in UI
          }
        }
        setOrder(orderData);
        setInternalNotes(orderData.internalNotes || '');
        // Initialize return address editing state
        setEditedReturnAddress({
          firstName: orderData.returnAddress?.firstName || '',
          lastName: orderData.returnAddress?.lastName || '',
          companyName: orderData.returnAddress?.companyName || '',
          street: orderData.returnAddress?.street || '',
          postalCode: orderData.returnAddress?.postalCode || '',
          city: orderData.returnAddress?.city || '',
          country: orderData.returnAddress?.country || '',
          phone: orderData.returnAddress?.phone || '',
          email: orderData.returnAddress?.email || ''
        });
        // Fetch invoices for this order
        await fetchInvoices(orderId);
      } else {
        toast.error('Order not found');
        router.push('/admin/visa-orders');
      }
    } catch (error) {
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: VisaOrderStatus) => {
    if (!order?.id) return;
    
    setSaving(true);
    try {
      await adminUpdateVisaOrder(order.id, { status: newStatus });
      setOrder(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success(`Status updated to ${STATUS_LABELS[newStatus]}`);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const saveReturnAddress = async () => {
    if (!order?.id) return;
    
    setSavingReturnAddress(true);
    try {
      await adminUpdateVisaOrder(order.id, { returnAddress: editedReturnAddress });
      setOrder(prev => prev ? { ...prev, returnAddress: editedReturnAddress } : null);
      toast.success('Return address saved');
    } catch (error) {
      toast.error('Failed to save return address');
    } finally {
      setSavingReturnAddress(false);
    }
  };

  const handleStepStatusChange = async (stepId: string, newStatus: VisaProcessingStep['status']) => {
    if (!order?.id) return;
    
    setSaving(true);
    try {
      // Check if we should send customer notification email
      const shouldSendSubmissionEmail = 
        newStatus === 'completed' && 
        (stepId === 'embassy_delivery' || stepId === 'portal_submission');
      
      // Update processing steps via Admin API (bypasses Firestore security rules)
      const updatedSteps = order.processingSteps?.map(step => 
        step.id === stepId 
          ? { 
              ...step, 
              status: newStatus,
              completedBy: currentUser?.email || 'admin',
              ...(newStatus === 'completed' ? { completedAt: new Date().toISOString() } : {})
            }
          : step
      ) || [];
      
      await adminUpdateVisaOrder(order.id, { processingSteps: updatedSteps });
      
      // Send customer notification email when application is submitted
      if (shouldSendSubmissionEmail && order.customerInfo?.email) {
        try {
          const isEVisa = order.visaProduct?.visaType === 'e-visa';
          const locale = order.locale || 'sv';
          const customerEmail = order.customerInfo.email;
          const customerName = order.customerInfo.companyName || 
            `${order.customerInfo.firstName || ''} ${order.customerInfo.lastName || ''}`.trim() || 
            'Kund';
          
          // Generate email based on locale and visa type
          const subject = locale === 'en'
            ? `Your visa application has been submitted – ${order.orderNumber}`
            : `Din visumansökan har lämnats in – ${order.orderNumber}`;
          
          const emailBody = locale === 'en'
            ? (isEVisa 
                ? `<p>Dear ${customerName},</p><p>Your e-visa application for ${order.destinationCountry} has been submitted through the online portal.</p><p>We will notify you as soon as we receive a response.</p><p>Best regards,<br>DOX Visumpartner</p>`
                : `<p>Dear ${customerName},</p><p>Your visa application for ${order.destinationCountry} has been submitted to the embassy.</p><p>We will notify you as soon as we receive a response.</p><p>Best regards,<br>DOX Visumpartner</p>`)
            : (isEVisa
                ? `<p>Hej ${customerName},</p><p>Din e-visumansökan för ${order.destinationCountry} har skickats in via onlineportalen.</p><p>Vi meddelar dig så snart vi får svar.</p><p>Med vänliga hälsningar,<br>DOX Visumpartner</p>`
                : `<p>Hej ${customerName},</p><p>Din visumansökan för ${order.destinationCountry} har lämnats in på ambassaden.</p><p>Vi meddelar dig så snart vi får svar.</p><p>Med vänliga hälsningar,<br>DOX Visumpartner</p>`);
          
          // Save email to Firestore for sending
          const { collection, addDoc, Timestamp } = await import('firebase/firestore');
          const { getFirebaseDb } = await import('@/firebase/config');
          const db = getFirebaseDb();
          if (!db) throw new Error('Firebase not initialized');
          
          await addDoc(collection(db, 'emailQueue'), {
            name: customerName,
            email: customerEmail,
            subject: subject,
            message: emailBody,
            source: 'visa-submission-notification',
            orderId: order.id,
            orderNumber: order.orderNumber,
            createdAt: Timestamp.now(),
            status: 'pending'
          });
          
          toast.success(locale === 'en' 
            ? 'Customer notified about submission' 
            : 'Kund meddelad om inlämning');
        } catch (emailError) {
          // Don't fail the step update if email fails
          toast.error('Could not send notification email');
        }
      }
      
      // Reload order to get updated steps
      await loadOrder(order.id);
      toast.success('Step updated');
    } catch (error) {
      toast.error('Failed to update step');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!order?.id) return;
    
    setSaving(true);
    try {
      await adminUpdateVisaOrder(order.id, { internalNotes });
      toast.success('Notes saved');
    } catch (error) {
      toast.error('Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  // Get default values for embassy cover letter
  const getEmbassyCoverLetterDefaults = (order: VisaOrder) => {
    const travelers = (order as any).travelers;
    const travelerName = travelers?.[0] 
      ? `${travelers[0].firstName || ''} ${travelers[0].lastName || ''}`.trim()
      : `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim();
    
    return {
      embassyName: `Embassy of ${order.destinationCountry || 'the destination country'}`,
      embassyAddress: '',
      applicantName: travelerName || 'Applicant',
      passportNumber: travelers?.[0]?.passportNumber || '',
      nationality: order.nationality || '',
      visaType: order.visaProduct?.name || 'Visa',
      travelDates: order.departureDate && order.returnDate 
        ? `${order.departureDate} - ${order.returnDate}` 
        : order.departureDate || '',
      purpose: order.visaProduct?.category || 'Travel',
      orderNumber: order.orderNumber || order.id || '',
      invoiceReference: order.invoiceReference || '',
      paymentMethod: 'Invoice / Faktura',
      returnMethod: order.returnService === 'own-delivery' ? 'Customer pickup' : 'DOX will collect'
    };
  };

  // Generate and download embassy cover letter PDF
  const downloadEmbassyCoverLetter = async () => {
    if (!embassyCoverLetterData || !order) return;
    
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('DOX Visumpartner', 20, 20);
    doc.text('Kungsgatan 8, 111 43 Stockholm', 20, 25);
    doc.text('info@doxvl.se | +46 8 123 456 78', 20, 30);
    
    // Date
    doc.text(new Date().toLocaleDateString('sv-SE'), 170, 20);
    
    // Embassy address
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(embassyCoverLetterData.embassyName, 20, 50);
    if (embassyCoverLetterData.embassyAddress) {
      doc.text(embassyCoverLetterData.embassyAddress, 20, 56);
    }
    
    // Subject line
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Re: Visa Application - ${embassyCoverLetterData.applicantName}`, 20, 75);
    
    // Body
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    let y = 90;
    const lineHeight = 6;
    
    doc.text('Dear Sir/Madam,', 20, y);
    y += lineHeight * 2;
    
    doc.text(`We hereby submit a visa application on behalf of our client:`, 20, y);
    y += lineHeight * 2;
    
    // Applicant details
    doc.setFont('helvetica', 'bold');
    doc.text('Applicant Details:', 20, y);
    doc.setFont('helvetica', 'normal');
    y += lineHeight;
    doc.text(`Name: ${embassyCoverLetterData.applicantName}`, 25, y);
    y += lineHeight;
    if (embassyCoverLetterData.passportNumber) {
      doc.text(`Passport Number: ${embassyCoverLetterData.passportNumber}`, 25, y);
      y += lineHeight;
    }
    doc.text(`Nationality: ${embassyCoverLetterData.nationality}`, 25, y);
    y += lineHeight;
    doc.text(`Visa Type: ${embassyCoverLetterData.visaType}`, 25, y);
    y += lineHeight;
    if (embassyCoverLetterData.travelDates) {
      doc.text(`Travel Dates: ${embassyCoverLetterData.travelDates}`, 25, y);
      y += lineHeight;
    }
    if (embassyCoverLetterData.purpose) {
      doc.text(`Purpose: ${embassyCoverLetterData.purpose}`, 25, y);
      y += lineHeight;
    }
    
    y += lineHeight;
    
    // Order details
    doc.setFont('helvetica', 'bold');
    doc.text('Order Reference:', 20, y);
    doc.setFont('helvetica', 'normal');
    y += lineHeight;
    doc.text(`Order Number: ${embassyCoverLetterData.orderNumber}`, 25, y);
    y += lineHeight;
    if (embassyCoverLetterData.invoiceReference) {
      doc.text(`Customer Reference: ${embassyCoverLetterData.invoiceReference}`, 25, y);
      y += lineHeight;
    }
    doc.text(`Payment: ${embassyCoverLetterData.paymentMethod}`, 25, y);
    y += lineHeight;
    doc.text(`Collection: ${embassyCoverLetterData.returnMethod}`, 25, y);
    y += lineHeight * 2;
    
    // Closing
    doc.text('We kindly request that you process this application at your earliest convenience.', 20, y);
    y += lineHeight * 2;
    doc.text('Thank you for your assistance.', 20, y);
    y += lineHeight * 2;
    doc.text('Yours faithfully,', 20, y);
    y += lineHeight * 2;
    doc.text('DOX Visumpartner', 20, y);
    
    // Save
    doc.save(`Embassy_Cover_Letter_${order.orderNumber || order.id}.pdf`);
  };

  // Document request templates (with both Swedish and English messages)
  const documentRequestTemplates = [
    { id: 'custom', name: 'Custom message', messageSv: '', messageEn: '' },
    { id: 'passport_copy', name: 'Passport copy needed', messageSv: 'Vi behöver en tydlig kopia av ditt pass (alla sidor med stämplar samt ID-sidan). Vänligen ladda upp via länken nedan.', messageEn: 'We need a clear copy of your passport (all pages with stamps and the ID page). Please upload via the link below.' },
    { id: 'photo', name: 'Visa photo needed', messageSv: 'Vi behöver ett passfoto som uppfyller visumkraven. Vänligen ladda upp ett foto med vit bakgrund.', messageEn: 'We need a passport photo that meets visa requirements. Please upload a photo with white background.' },
    { id: 'missing_document', name: 'Missing document', messageSv: 'Det saknas ett dokument för din visumansökan. Vänligen ladda upp det saknade dokumentet.', messageEn: 'A document is missing for your visa application. Please upload the missing document.' },
    { id: 'unclear_scan', name: 'Unclear scan', messageSv: 'Den uppladdade skanningen är otydlig eller har dålig kvalitet. Vänligen ladda upp en ny, tydligare version.', messageEn: 'The uploaded scan is unclear or of poor quality. Please upload a new, clearer version.' },
    { id: 'invitation_letter', name: 'Invitation letter needed', messageSv: 'Vi behöver ett inbjudningsbrev för din visumansökan. Vänligen ladda upp brevet.', messageEn: 'We need an invitation letter for your visa application. Please upload the letter.' },
    { id: 'travel_itinerary', name: 'Travel itinerary needed', messageSv: 'Vi behöver din resplan/bokningsbekräftelse. Vänligen ladda upp dokumentet.', messageEn: 'We need your travel itinerary/booking confirmation. Please upload the document.' },
    { id: 'hotel_booking', name: 'Hotel booking needed', messageSv: 'Vi behöver din hotellbokning/boendeinformation. Vänligen ladda upp bekräftelsen.', messageEn: 'We need your hotel booking/accommodation information. Please upload the confirmation.' },
    { id: 'bank_statement', name: 'Bank statement needed', messageSv: 'Vi behöver ett kontoutdrag som visar tillräckliga medel. Vänligen ladda upp dokumentet.', messageEn: 'We need a bank statement showing sufficient funds. Please upload the document.' },
    { id: 'return_label', name: 'Return shipping label', messageSv: 'Vi behöver din returfraktetikett för att kunna skicka tillbaka ditt pass. Vänligen ladda upp etiketten i PDF-format.', messageEn: 'We need your return shipping label to send back your passport. Please upload the label in PDF format.' }
  ];

  // Get message in customer's language
  const getTemplateMessage = (templateId: string) => {
    const template = documentRequestTemplates.find(t => t.id === templateId);
    if (!template) return '';
    const isEnglish = order?.locale === 'en';
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
          orderType: 'visa',
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

  // Invoice functions
  const fetchInvoices = async (orderId: string) => {
    try {
      const invoicesData = await getInvoicesByOrderId(orderId);
      setInvoices(invoicesData);
    } catch (err) {
      // Don't set error state for invoices, just log it
    }
  };

  const handleCreateInvoice = async () => {
    if (!order) return;

    setCreatingInvoice(true);
    try {
      // Convert visa order to invoice
      const invoice = await convertVisaOrderToInvoice(order);

      // Store the invoice
      const invoiceId = await storeInvoice(invoice);

      toast.success('Invoice created successfully');

      // Refresh invoices list
      await fetchInvoices(order.id || '');

      // Switch to invoice tab
      setActiveTab('invoice');
    } catch (err) {
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
        await fetchInvoices(order?.id || '');
      } else {
        toast.error('Could not send invoice via email');
      }
    } catch (err) {
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
      toast.error('Could not download invoice');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      if (isNaN(date.getTime())) return 'N/A';
      return new Intl.DateTimeFormat('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!order) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Order not found</h2>
            <Link href="/admin/visa-orders" className="text-blue-600 hover:underline mt-2 block">
              Back to Visa Orders
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Head>
        <title>Order {order.orderNumber} | Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <Link href="/admin/visa-orders" className="text-gray-500 hover:text-gray-700">
                  ← Back to Visa Orders
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">
                  Order {order.orderNumber}
                </h1>
              </div>
              <button
                onClick={() => signOut()}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Order Status</h2>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${STATUS_COLORS[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(e.target.value as VisaOrderStatus)}
                    disabled={saving}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {ALL_STATUSES.map(status => (
                      <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-lg shadow">
                <div className="border-b border-gray-200">
                  <nav className="flex -mb-px">
                    {[
                      { id: 'overview', label: '📋 Overview' },
                      { id: 'processing', label: '⚙️ Processing' },
                      { id: 'coverletters', label: '✉️ Cover Letters' },
                      { id: 'services', label: '🧩 Services' },
                      { id: 'price', label: '💰 Price' },
                      { id: 'files', label: '📎 Files' },
                      { id: 'invoice', label: '🧾 Invoice' },
                      { id: 'notes', label: '📝 Notes' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="p-6">
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="space-y-4">
                      {/* Order Information - compact like legaliseringar */}
                      <div>
                        <h3 className="text-sm font-semibold mb-1 text-gray-800">Order information</h3>
                        <div className="space-y-0.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Visa type:</span>
                            <span className="font-medium text-gray-900">{order.visaProduct?.name}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Type:</span>
                            <span className="font-medium text-gray-900">
                              {order.visaProduct?.visaType === 'e-visa' ? 'E-Visa' : 'Sticker Visa'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Destination:</span>
                            <span className="flex items-center space-x-1 font-medium text-gray-900">
                              <CountryFlag code={order.destinationCountryCode} size={16} />
                              <span>{order.destinationCountry}</span>
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Nationality:</span>
                            <span className="flex items-center space-x-1 font-medium text-gray-900">
                              <CountryFlag code={order.nationalityCode} size={16} />
                              <span>{order.nationality}</span>
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Category:</span>
                            <span className="font-medium text-gray-900 capitalize">{order.visaProduct?.category}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Entry type:</span>
                            <span className="font-medium text-gray-900 capitalize">{order.visaProduct?.entryType}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Validity:</span>
                            <span className="font-medium text-gray-900">{order.visaProduct?.validityDays} days</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Processing:</span>
                            <span className="font-medium text-gray-900">~{order.visaProduct?.processingDays} days</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Departure:</span>
                            <span className="font-medium text-gray-900">{order.departureDate || 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Return:</span>
                            <span className="font-medium text-gray-900">{order.returnDate || 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Visa needed by:</span>
                            <span className="font-medium text-gray-900">{order.passportNeededBy || 'N/A'}</span>
                          </div>
                          {order.visaProduct?.visaType === 'sticker' && order.returnService && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Return service:</span>
                              <span className="font-medium text-gray-900">{order.returnService}</span>
                            </div>
                          )}
                          {order.invoiceReference && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Customer ref:</span>
                              <span className="font-medium text-gray-900">{order.invoiceReference}</span>
                            </div>
                          )}
                          {order.customerInfo?.companyName && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Company:</span>
                              <span className="font-medium text-gray-900">{order.customerInfo.companyName}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Processing Steps Overview */}
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wide mb-1 text-gray-700">Processing steps</h3>
                        <div className="space-y-2">
                          {order.processingSteps?.map((step, index) => (
                            <div key={step.id} className={`flex items-center justify-between px-3 py-2 rounded-md ${
                              step.status === 'completed' ? 'bg-green-50' :
                              step.status === 'in_progress' ? 'bg-blue-50' :
                              step.status === 'skipped' ? 'bg-gray-100' :
                              'bg-gray-50'
                            }`}>
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
                            className="text-blue-600 text-sm underline"
                          >
                            Manage processing →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Processing Tab */}
                  {activeTab === 'processing' && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Processing Steps</h3>
                      
                      {order.processingSteps?.map((step, index) => (
                        <div 
                          key={step.id} 
                          className={`border rounded-lg p-4 ${
                            step.status === 'completed' ? 'border-green-200 bg-green-50' :
                            step.status === 'in_progress' ? 'border-blue-200 bg-blue-50' :
                            step.status === 'skipped' ? 'border-gray-200 bg-gray-50' :
                            'border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start">
                              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-3 ${
                                step.status === 'completed' ? 'bg-green-500 text-white' :
                                step.status === 'in_progress' ? 'bg-blue-500 text-white' :
                                step.status === 'skipped' ? 'bg-gray-400 text-white' :
                                'bg-gray-200 text-gray-600'
                              }`}>
                                {step.status === 'completed' ? '✓' : index + 1}
                              </span>
                              <div>
                                <h4 className="font-medium text-gray-900">{step.name}</h4>
                                <p className="text-sm text-gray-500">{step.description}</p>
                                {step.completedAt && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    Completed: {formatDate(step.completedAt)}
                                    {step.completedBy && ` by ${step.completedBy}`}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <select
                              value={step.status}
                              onChange={(e) => handleStepStatusChange(step.id, e.target.value as VisaProcessingStep['status'])}
                              disabled={saving}
                              className="text-sm border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="skipped">Skipped</option>
                            </select>
                          </div>
                          
                          {/* Embassy delivery date input */}
                          {step.id === 'embassy_delivery' && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <label className="block text-xs text-gray-500 mb-1">Date submitted to embassy</label>
                              <input
                                type="date"
                                className="text-sm border border-gray-300 rounded px-2 py-1 w-40"
                                placeholder="yyyy-mm-dd"
                              />
                            </div>
                          )}
                          
                          {/* Embassy pickup expected date input */}
                          {step.id === 'embassy_pickup' && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <label className="block text-xs text-gray-500 mb-1">Expected completion date</label>
                              <input
                                type="date"
                                className="text-sm border border-gray-300 rounded px-2 py-1 w-40"
                                placeholder="yyyy-mm-dd"
                              />
                            </div>
                          )}
                          
                          {/* Return shipping tracking number input */}
                          {step.id === 'return_shipping' && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="mb-2">
                                <span className="text-xs text-gray-500">Customer selected return service:</span>
                                <span className="ml-2 text-sm font-medium text-gray-900">
                                  📦 {order.returnService === 'own-delivery' ? 'Own Delivery' : order.returnService || 'Standard'}
                                </span>
                              </div>
                              <label className="block text-xs text-gray-500 mb-1">Return tracking number</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  defaultValue={order.returnTrackingNumber || ''}
                                  className="text-sm border border-gray-300 rounded px-2 py-1 flex-1"
                                  placeholder="Enter tracking number"
                                />
                                <button 
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                  onClick={async () => {
                                    const input = document.querySelector(`input[placeholder="Enter tracking number"]`) as HTMLInputElement;
                                    if (input && order?.id) {
                                      try {
                                        await adminUpdateVisaOrder(order.id, { returnTrackingNumber: input.value });
                                        toast.success('Tracking number saved');
                                      } catch (e) {
                                        toast.error('Could not save tracking number');
                                      }
                                    }
                                  }}
                                >
                                  Save
                                </button>
                              </div>
                              {order.returnService === 'own-delivery' && (
                                <p className="text-xs text-blue-600 mt-2">
                                  ℹ️ Customer selected: Own delivery - No return shipment booking is needed for this return option.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Cover Letters Tab */}
                  {activeTab === 'coverletters' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Cover Letters</h3>
                        <p className="text-sm text-gray-500">Generate cover letters for embassy submissions</p>
                      </div>

                      {/* Embassy Cover Letter */}
                      {(() => {
                        // Initialize embassy data if not set
                        if (!embassyCoverLetterData && order) {
                          const defaults = getEmbassyCoverLetterDefaults(order);
                          setEmbassyCoverLetterData(defaults);
                          return null;
                        }
                        if (!embassyCoverLetterData) return null;

                        return (
                          <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-lg p-5">
                            <div className="flex items-center space-x-3 mb-4">
                              <span className="text-2xl">🏛️</span>
                              <div>
                                <h4 className="font-medium text-gray-900">Embassy Cover Letter</h4>
                                <p className="text-sm text-amber-700">Formal letter for visa application submission</p>
                              </div>
                            </div>

                            <div className="space-y-4 border-t border-amber-200 pt-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Embassy name</label>
                                  <input type="text" value={embassyCoverLetterData.embassyName} onChange={(e) => setEmbassyCoverLetterData({...embassyCoverLetterData, embassyName: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="e.g. Embassy of Angola" />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Embassy address</label>
                                  <input type="text" value={embassyCoverLetterData.embassyAddress} onChange={(e) => setEmbassyCoverLetterData({...embassyCoverLetterData, embassyAddress: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="Street, City" />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Applicant name</label>
                                  <input type="text" value={embassyCoverLetterData.applicantName} onChange={(e) => setEmbassyCoverLetterData({...embassyCoverLetterData, applicantName: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Passport number</label>
                                  <input type="text" value={embassyCoverLetterData.passportNumber} onChange={(e) => setEmbassyCoverLetterData({...embassyCoverLetterData, passportNumber: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                                  <input type="text" value={embassyCoverLetterData.nationality} onChange={(e) => setEmbassyCoverLetterData({...embassyCoverLetterData, nationality: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Visa type</label>
                                  <input type="text" value={embassyCoverLetterData.visaType} onChange={(e) => setEmbassyCoverLetterData({...embassyCoverLetterData, visaType: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Travel dates</label>
                                  <input type="text" value={embassyCoverLetterData.travelDates} onChange={(e) => setEmbassyCoverLetterData({...embassyCoverLetterData, travelDates: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                                  <input type="text" value={embassyCoverLetterData.purpose} onChange={(e) => setEmbassyCoverLetterData({...embassyCoverLetterData, purpose: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Order number (fixed)</label>
                                  <input type="text" value={order?.orderNumber || order?.id || ''} disabled className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-100 text-gray-600 cursor-not-allowed" />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer reference</label>
                                  <input type="text" value={embassyCoverLetterData.invoiceReference} onChange={(e) => setEmbassyCoverLetterData({...embassyCoverLetterData, invoiceReference: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="Optional" />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment method</label>
                                  <input type="text" value={embassyCoverLetterData.paymentMethod} onChange={(e) => setEmbassyCoverLetterData({...embassyCoverLetterData, paymentMethod: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Collection method</label>
                                  <input type="text" value={embassyCoverLetterData.returnMethod} onChange={(e) => setEmbassyCoverLetterData({...embassyCoverLetterData, returnMethod: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <button onClick={() => setEmbassyCoverLetterData(getEmbassyCoverLetterDefaults(order))} className="text-sm text-gray-500 hover:text-gray-700 underline">Reset to defaults</button>
                              </div>
                            </div>

                            <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-amber-200">
                              <button onClick={async () => { try { await downloadEmbassyCoverLetter(); toast.success('Cover letter downloaded'); } catch (err) { toast.error('Failed to generate cover letter'); }}} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center">
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Download PDF
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Services Tab */}
                  {activeTab === 'services' && (
                    <div className="space-y-6">
                      {/* Change Visa Product Section */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium">Visa Product</h3>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!showChangeVisa && order?.destinationCountryCode && order?.nationalityCode) {
                                setLoadingVisaProducts(true);
                                try {
                                  const { products } = await getAvailableVisaProducts(
                                    order.destinationCountryCode,
                                    order.nationalityCode
                                  );
                                  setAvailableVisaProducts(products);
                                } catch (err) {
                                  toast.error('Could not load visa products');
                                }
                                setLoadingVisaProducts(false);
                              }
                              setShowChangeVisa(!showChangeVisa);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            {showChangeVisa ? 'Cancel' : 'Change Visa Type'}
                          </button>
                        </div>
                        
                        {/* Current visa product display */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-gray-900">{order.visaProduct?.name}</span>
                              <p className="text-sm text-gray-500">
                                {order.visaProduct?.visaType === 'e-visa' ? 'E-Visa' : 'Sticker Visa'} • 
                                {order.visaProduct?.entryType === 'single' ? ' Single Entry' : order.visaProduct?.entryType === 'double' ? ' Double Entry' : ' Multiple Entry'} • 
                                {order.visaProduct?.validityDays} days validity
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                defaultValue={order.visaProduct?.price || 0}
                                className="w-24 px-2 py-1 text-sm text-right border border-gray-300 rounded"
                                onBlur={async (e) => {
                                  const newPrice = parseFloat(e.target.value);
                                  if (!isNaN(newPrice) && newPrice !== order.visaProduct?.price && order?.id) {
                                    try {
                                      const updatedProduct = { ...order.visaProduct, price: newPrice };
                                      await adminUpdateVisaOrder(order.id, { visaProduct: updatedProduct });
                                      setOrder(prev => prev ? { ...prev, visaProduct: updatedProduct } : null);
                                      toast.success('Price updated');
                                    } catch (err) {
                                      toast.error('Failed to update price');
                                      e.target.value = String(order.visaProduct?.price || 0);
                                    }
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                }}
                              />
                              <span className="text-sm text-gray-500">kr</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Change visa product panel */}
                        {showChangeVisa && (
                          <div className="border-t border-gray-200 pt-4">
                            <h4 className="text-sm font-semibold text-gray-800 mb-3">Select New Visa Product</h4>
                            {loadingVisaProducts ? (
                              <div className="flex items-center justify-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                              </div>
                            ) : availableVisaProducts.length === 0 ? (
                              <p className="text-sm text-gray-500">No other visa products available for this destination.</p>
                            ) : (
                              <div className="space-y-2">
                                {availableVisaProducts
                                  .filter(p => p.id !== order.visaProduct?.id)
                                  .map((product) => (
                                    <div
                                      key={product.id}
                                      className="flex items-center justify-between border border-gray-200 rounded-md px-3 py-2 hover:bg-gray-50"
                                    >
                                      <div>
                                        <span className="text-sm font-medium text-gray-900">{product.name}</span>
                                        <p className="text-xs text-gray-500">
                                          {product.visaType === 'e-visa' ? 'E-Visa' : 'Sticker Visa'} • 
                                          {product.entryType === 'single' ? ' Single' : product.entryType === 'double' ? ' Double' : ' Multiple'} • 
                                          {product.validityDays} days • {product.price.toLocaleString()} kr
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          if (!order?.id) return;
                                          setChangingVisaProduct(true);
                                          try {
                                            await adminUpdateVisaOrder(order.id, { visaProduct: product });
                                            setOrder(prev => prev ? { ...prev, visaProduct: product as any } : null);
                                            setShowChangeVisa(false);
                                            toast.success(`Changed to ${product.name}`);
                                          } catch (err) {
                                            toast.error('Failed to change visa product');
                                          }
                                          setChangingVisaProduct(false);
                                        }}
                                        disabled={changingVisaProduct}
                                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                      >
                                        {changingVisaProduct ? 'Changing...' : 'Select'}
                                      </button>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-medium mb-4">Additional Services</h3>
                        {(() => {
                          // Build list of current services (excluding main visa product which is shown above)
                          const currentServices: { id: string; name: string; description: string; price: number }[] = [];
                          
                          // Return shipping (for sticker visa)
                          if (order.visaProduct?.visaType !== 'e-visa' && order.returnService) {
                            currentServices.push({
                              id: 'return_shipping',
                              name: 'Return Shipping',
                              description: order.returnService,
                              price: order.pricingBreakdown?.shippingFee || 0
                            });
                          }
                          
                          // Additional services from order
                          const additionalServices = (order as any).additionalServices || [];
                          additionalServices.forEach((svc: any) => {
                            currentServices.push({
                              id: svc.id || svc.name,
                              name: svc.name,
                              description: svc.description || '',
                              price: svc.price || 0
                            });
                          });
                          
                          // Possible services to add
                          const possibleServices = [
                            { id: 'express_processing', name: 'Express Processing', description: 'Faster processing time' },
                            { id: 'apostille', name: 'Apostille', description: 'Apostille certification of documents' },
                            { id: 'notarization', name: 'Notarization', description: 'Notarization of documents' },
                            { id: 'translation', name: 'Translation Service', description: 'Document translation' },
                            { id: 'chamber', name: 'Chamber of Commerce', description: 'Chamber of Commerce certification' },
                            { id: 'ud', name: 'UD Legalization', description: 'Ministry of Foreign Affairs legalization' },
                            { id: 'embassy', name: 'Embassy Legalization', description: 'Embassy/Consulate legalization' },
                            { id: 'document_review', name: 'Document Review', description: 'Pre-submission document check' },
                            { id: 'photo_service', name: 'Photo Service', description: 'Visa photo preparation' },
                            { id: 'insurance', name: 'Travel Insurance', description: 'Travel insurance coverage' },
                            { id: 'courier_pickup', name: 'Courier Pickup', description: 'Document pickup from your address' },
                          ];
                          
                          const currentIds = new Set(currentServices.map(s => s.id));
                          const addableServices = possibleServices.filter(s => !currentIds.has(s.id));
                          
                          const handleAddService = async (serviceId: string) => {
                            if (!order?.id) return;
                            setAddingService(true);
                            try {
                              const serviceToAdd = possibleServices.find(s => s.id === serviceId);
                              if (!serviceToAdd) return;
                              
                              const currentAdditional = (order as any).additionalServices || [];
                              const newService = { id: serviceId, name: serviceToAdd.name, description: serviceToAdd.description, price: 0 };
                              const updatedServices = [...currentAdditional, newService];
                              
                              await adminUpdateVisaOrder(order.id, { additionalServices: updatedServices });
                              setOrder(prev => prev ? { ...prev, additionalServices: updatedServices } as any : null);
                              setNewServiceToAdd('');
                              toast.success(`${serviceToAdd.name} added`);
                            } catch (err) {
                              toast.error('Failed to add service');
                            } finally {
                              setAddingService(false);
                            }
                          };
                          
                          const handleRemoveService = async (serviceId: string) => {
                            if (!order?.id) return;
                            // Don't allow removing the main visa product
                            if (serviceId === 'visa_product') {
                              toast.error('Cannot remove the main visa product');
                              return;
                            }
                            setRemovingService(serviceId);
                            try {
                              if (serviceId === 'return_shipping') {
                                await adminUpdateVisaOrder(order.id, { returnService: null });
                                setOrder(prev => prev ? { ...prev, returnService: undefined } : null);
                              } else {
                                const currentAdditional = (order as any).additionalServices || [];
                                const updatedServices = currentAdditional.filter((s: any) => (s.id || s.name) !== serviceId);
                                await adminUpdateVisaOrder(order.id, { additionalServices: updatedServices });
                                setOrder(prev => prev ? { ...prev, additionalServices: updatedServices } as any : null);
                              }
                              toast.success('Service removed');
                            } catch (err) {
                              toast.error('Failed to remove service');
                            } finally {
                              setRemovingService(null);
                            }
                          };
                          
                          return (
                            <div className="space-y-6">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-800 mb-2">Active Services</h4>
                                {currentServices.length === 0 ? (
                                  <p className="text-sm text-gray-500">No services registered on this order.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {currentServices.map((service) => (
                                      <div
                                        key={service.id}
                                        className="flex items-center justify-between border border-gray-200 rounded-md px-3 py-2 bg-white"
                                      >
                                        <div className="flex-1">
                                          <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-900">{service.name}</span>
                                            {service.id === 'visa_product' ? (
                                              <div className="flex items-center gap-1">
                                                <input
                                                  type="number"
                                                  defaultValue={service.price}
                                                  className="w-24 px-2 py-1 text-sm text-right border border-gray-300 rounded"
                                                  onBlur={async (e) => {
                                                    const newPrice = parseFloat(e.target.value);
                                                    if (!isNaN(newPrice) && newPrice !== service.price && order?.id) {
                                                      try {
                                                        const updatedProduct = { ...order.visaProduct, price: newPrice };
                                                        await adminUpdateVisaOrder(order.id, { visaProduct: updatedProduct });
                                                        setOrder(prev => prev ? { ...prev, visaProduct: updatedProduct } : null);
                                                        toast.success('Price updated');
                                                      } catch (err) {
                                                        toast.error('Failed to update price');
                                                        e.target.value = String(service.price);
                                                      }
                                                    }
                                                  }}
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                                  }}
                                                />
                                                <span className="text-sm text-gray-500">kr</span>
                                              </div>
                                            ) : (
                                              <span className="text-sm font-medium text-gray-900">{service.price.toLocaleString()} kr</span>
                                            )}
                                          </div>
                                          <p className="text-xs text-gray-500 mt-0.5">{service.description}</p>
                                        </div>
                                        {service.id !== 'visa_product' && (
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveService(service.id)}
                                            disabled={removingService === service.id}
                                            className="ml-3 px-2 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                                          >
                                            {removingService === service.id ? 'Removing...' : 'Remove'}
                                          </button>
                                        )}
                                      </div>
                                    ))}
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
                                          {s.name}
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      type="button"
                                      onClick={() => newServiceToAdd && handleAddService(newServiceToAdd)}
                                      disabled={!newServiceToAdd || addingService}
                                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {addingService ? 'Adding...' : 'Add Service'}
                                    </button>
                                  </div>
                                )}
                                <p className="mt-2 text-xs text-gray-500">
                                  When you add or remove a service, the price can be adjusted in the Price tab.
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
                              {lineOverrides.length > 0 ? (
                                lineOverrides.map((o, idx) => (
                                  <tr key={idx} className="border-t">
                                    <td className="px-3 py-2">
                                      <input
                                        type="checkbox"
                                        checked={o.include !== false}
                                        onChange={(e) => {
                                          const next = [...lineOverrides];
                                          next[idx] = { ...o, include: e.target.checked };
                                          setLineOverrides(next);
                                        }}
                                      />
                                    </td>
                                    <td className="px-3 py-2">{o.label || '-'}</td>
                                    <td className="px-3 py-2 text-right">{Number(o.baseAmount).toFixed(2)} kr</td>
                                    <td className="px-3 py-2 text-right">
                                      <input
                                        type="number"
                                        className="w-28 border rounded px-2 py-1 text-right"
                                        value={o.overrideAmount ?? ''}
                                        placeholder=""
                                        onChange={(e) => {
                                          const val = e.target.value === '' ? null : Number(e.target.value);
                                          const next = [...lineOverrides];
                                          next[idx] = { ...o, overrideAmount: val };
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
                                          next[idx] = { ...o, vatPercent: val };
                                          setLineOverrides(next);
                                        }}
                                      />
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={5} className="px-3 py-4 text-center text-gray-500">No line items</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Base Amount</p>
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
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Save Price'}
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        Customer type: <span className="font-medium capitalize">{order.customerType}</span>
                        {order.customerType === 'company' && ' (prices excl. VAT)'}
                      </div>
                    </div>
                  )}

                  {/* Files Tab */}
                  {activeTab === 'files' && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Files & Documents</h3>
                      
                      {/* Return Shipping Label Section - for own-delivery */}
                      {order.returnService === 'own-delivery' && (
                        <div className={`border rounded-lg p-4 ${
                          order.uploadedFiles?.find((f: any) => f.originalName === order.returnLabelFileName)
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-amber-50 border-amber-200'
                        }`}>
                          <div className="flex items-center mb-3">
                            <span className="text-2xl mr-2">📦</span>
                            <h4 className={`text-lg font-medium ${
                              order.uploadedFiles?.find((f: any) => f.originalName === order.returnLabelFileName)
                                ? 'text-blue-900'
                                : 'text-amber-900'
                            }`}>Return Shipping Label</h4>
                          </div>
                          <p className={`text-sm mb-3 ${
                            order.uploadedFiles?.find((f: any) => f.originalName === order.returnLabelFileName)
                              ? 'text-blue-700'
                              : 'text-amber-700'
                          }`}>
                            Customer uploaded their own return shipping label. Print and attach to package.
                          </p>
                          {order.uploadedFiles?.find((f: any) => f.originalName === order.returnLabelFileName) ? (
                            <div className="flex space-x-2">
                              <a
                                href={order.uploadedFiles.find((f: any) => f.originalName === order.returnLabelFileName)?.downloadURL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                              >
                                📥 Download Label
                              </a>
                              <button
                                onClick={() => {
                                  const labelFile = order.uploadedFiles?.find((f: any) => f.originalName === order.returnLabelFileName);
                                  if (labelFile?.downloadURL) {
                                    const printWindow = window.open(labelFile.downloadURL, '_blank');
                                    if (printWindow) {
                                      printWindow.onload = () => printWindow.print();
                                    }
                                  }
                                }}
                                className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium"
                              >
                                🖨️ Print Label
                              </button>
                            </div>
                          ) : order.hasReturnLabel ? (
                            <div className="bg-amber-100 border border-amber-300 rounded p-3">
                              <p className="text-amber-800 font-medium">⚠️ Return label missing</p>
                              <p className="text-amber-700 text-sm mt-1">
                                Customer selected own return but the label was not uploaded correctly.
                                {order.returnLabelFileName && (
                                  <span> Expected filename: <code className="bg-amber-200 px-1 rounded">{order.returnLabelFileName}</code></span>
                                )}
                              </p>
                              <p className="text-amber-700 text-sm mt-2">
                                <strong>Action:</strong> Contact the customer and ask them to send the return label via email.
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">Customer did not upload a return label.</p>
                          )}
                          
                          {/* Show tracking number if provided */}
                          {order.returnTrackingNumber && (
                            <div className="mt-3 pt-3 border-t border-blue-200">
                              <span className="text-sm text-gray-500">Tracking Number:</span>
                              <span className="ml-2 font-mono text-gray-900">{order.returnTrackingNumber}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Return Shipping for non-own-delivery */}
                      {order.visaProduct?.visaType !== 'e-visa' && order.returnService !== 'own-delivery' && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Return Shipping</h4>
                          {order.returnTrackingNumber ? (
                            <div className="text-sm">
                              <span className="text-gray-500">Tracking Number:</span>
                              <span className="ml-2 font-mono text-gray-900">{order.returnTrackingNumber}</span>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No tracking number added yet</p>
                          )}
                        </div>
                      )}
                      
                      {/* Uploaded Files List */}
                      {order.uploadedFiles && order.uploadedFiles.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Uploaded Files</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {order.uploadedFiles.map((file: any, index: number) => {
                              const isReturnLabel = order.returnLabelFileName && file.originalName === order.returnLabelFileName;
                              return (
                                <div key={index} className={`border rounded-lg p-4 ${isReturnLabel ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center">
                                      {isReturnLabel ? (
                                        <span className="text-2xl mr-3">📦</span>
                                      ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                      )}
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <p className="font-medium text-gray-900">{file.originalName}</p>
                                          {isReturnLabel && (
                                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                                              Return Label
                                            </span>
                                          )}
                                        </div>
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
                                      className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                    >
                                      Download
                                    </a>
                                    <a
                                      href={file.downloadURL}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                                    >
                                      View
                                    </a>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Upload placeholder if no files */}
                      {(!order.uploadedFiles || order.uploadedFiles.length === 0) && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                          <span className="text-4xl mb-3 block">📎</span>
                          <p className="text-gray-600 mb-2">No documents uploaded yet</p>
                          <p className="text-sm text-gray-500">Passport copies, photos, and other required documents</p>
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
                    </div>
                  )}

                  {/* Invoice Tab */}
                  {activeTab === 'invoice' && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Invoice</h3>
                      
                      {/* Existing Invoices */}
                      {invoices.length > 0 && (
                        <div className="space-y-4 mb-6">
                          <h4 className="font-medium text-gray-900">Existing Invoices</h4>
                          {invoices.map((invoice) => (
                            <div key={invoice.id} className="bg-white border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <span className="font-medium text-gray-900">{invoice.invoiceNumber}</span>
                                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                                    invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                                    invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                                    invoice.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {invoice.status}
                                  </span>
                                </div>
                                <span className="font-semibold text-gray-900">{invoice.totalAmount?.toLocaleString()} kr</span>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleDownloadInvoice(invoice)}
                                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                                >
                                  Download PDF
                                </button>
                                {invoice.status === 'draft' && (
                                  <button
                                    onClick={() => handleSendInvoice(invoice)}
                                    disabled={sendingInvoice === invoice.id}
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                                  >
                                    {sendingInvoice === invoice.id ? 'Sending...' : 'Send Invoice'}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-medium text-gray-900">Create Invoice</h4>
                            <p className="text-sm text-gray-500">Generate an invoice for this visa order</p>
                          </div>
                          <button 
                            onClick={handleCreateInvoice}
                            disabled={creatingInvoice}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            {creatingInvoice ? 'Creating...' : 'Create Invoice'}
                          </button>
                        </div>
                        
                        <div className="border-t pt-4">
                          <h4 className="font-medium text-gray-900 mb-2">Invoice Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Customer:</span>
                              <span className="text-gray-900">
                                {order.customerInfo?.companyName || `${order.customerInfo?.firstName} ${order.customerInfo?.lastName}`}
                              </span>
                            </div>
                            {order.invoiceReference && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Reference:</span>
                                <span className="text-gray-900">{order.invoiceReference}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-gray-500">Amount:</span>
                              <span className="font-medium text-gray-900">{getComputedTotal().toLocaleString()} kr</span>
                            </div>
                            {order.customerType !== 'company' && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">VAT (25%):</span>
                                <span className="text-gray-900">{(getComputedTotal() * 0.25).toLocaleString()} kr</span>
                              </div>
                            )}
                            {order.customerType === 'company' && (
                              <div className="flex justify-between text-gray-500 italic">
                                <span>VAT:</span>
                                <span>Excl. (company)</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes Tab */}
                  {activeTab === 'notes' && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Internal Notes</h3>
                      
                      <textarea
                        value={internalNotes}
                        onChange={(e) => setInternalNotes(e.target.value)}
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Add internal notes about this order..."
                      />
                      
                      <button
                        onClick={handleSaveNotes}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Notes'}
                      </button>
                      
                      {order.additionalNotes && (
                        <div className="mt-6">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Customer Notes</h4>
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-gray-700">
                            {order.additionalNotes}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                
                <div className="space-y-3 text-sm">
                  {order.customerInfo?.companyName && (
                    <div>
                      <span className="text-gray-500">Company:</span>
                      <span className="ml-2 font-medium text-gray-900">{order.customerInfo.companyName}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {order.customerInfo?.firstName} {order.customerInfo?.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <a href={`mailto:${order.customerInfo?.email}`} className="ml-2 text-blue-600 hover:underline">
                      {order.customerInfo?.email}
                    </a>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <a href={`tel:${order.customerInfo?.phone}`} className="ml-2 text-blue-600 hover:underline">
                      {order.customerInfo?.phone}
                    </a>
                  </div>
                </div>
              </div>

              {/* Return Address - for sticker visa */}
              {order.visaProduct?.visaType === 'sticker' && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Return Address</h3>
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">First name</label>
                        <input
                          type="text"
                          value={editedReturnAddress.firstName}
                          onChange={(e) => setEditedReturnAddress({ ...editedReturnAddress, firstName: e.target.value })}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Last name</label>
                        <input
                          type="text"
                          value={editedReturnAddress.lastName}
                          onChange={(e) => setEditedReturnAddress({ ...editedReturnAddress, lastName: e.target.value })}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Company</label>
                      <input
                        type="text"
                        value={editedReturnAddress.companyName}
                        onChange={(e) => setEditedReturnAddress({ ...editedReturnAddress, companyName: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Street</label>
                      <input
                        type="text"
                        value={editedReturnAddress.street}
                        onChange={(e) => setEditedReturnAddress({ ...editedReturnAddress, street: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Postal code</label>
                        <input
                          type="text"
                          value={editedReturnAddress.postalCode}
                          onChange={(e) => setEditedReturnAddress({ ...editedReturnAddress, postalCode: e.target.value })}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">City</label>
                        <input
                          type="text"
                          value={editedReturnAddress.city}
                          onChange={(e) => setEditedReturnAddress({ ...editedReturnAddress, city: e.target.value })}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Country</label>
                      <input
                        type="text"
                        value={editedReturnAddress.country}
                        onChange={(e) => setEditedReturnAddress({ ...editedReturnAddress, country: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div className="flex justify-end mt-3">
                      <button
                        type="button"
                        onClick={saveReturnAddress}
                        disabled={savingReturnAddress}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        {savingReturnAddress ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Info */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h3>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500">Order Number:</span>
                    <span className="ml-2 font-medium text-gray-900">{order.orderNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <span className="ml-2 text-gray-900">{formatDate(order.createdAt)}</span>
                  </div>
                  {order.invoiceReference && (
                    <div>
                      <span className="text-gray-500">Invoice Ref:</span>
                      <span className="ml-2 text-gray-900">{order.invoiceReference}</span>
                    </div>
                  )}
                  {order.returnTrackingNumber && (
                    <div>
                      <span className="text-gray-500">Tracking:</span>
                      <span className="ml-2 text-gray-900">{order.returnTrackingNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                
                <div className="space-y-2">
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200">
                    📧 Send Email to Customer
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200">
                    🧾 Create Invoice
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200">
                    🖨️ Print Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

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
                  {order?.locale === 'en' ? '🇬🇧 English' : '🇸🇪 Swedish'}
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
    </ProtectedRoute>
  );
}

export default VisaOrderDetailPage;

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'])),
    },
  };
};
