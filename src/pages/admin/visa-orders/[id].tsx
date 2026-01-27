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
      await updateVisaOrder(order.id, {
        adminPrice,
        totalPrice: total
      } as any);
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
      await updateVisaOrderStatus(order.id, newStatus);
      setOrder(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success(`Status updated to ${STATUS_LABELS[newStatus]}`);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setSaving(false);
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
      
      await updateVisaProcessingStep(order.id, stepId, { 
        status: newStatus,
        completedBy: currentUser?.email || 'admin'
      });
      
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
          const { db } = await import('@/firebase/config');
          
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
      await updateVisaOrder(order.id, { internalNotes });
      toast.success('Notes saved');
    } catch (error) {
      toast.error('Failed to save notes');
    } finally {
      setSaving(false);
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
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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
                    <div className="space-y-6">
                      {/* Visa Product */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Visa Product</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900">{order.visaProduct?.name}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              order.visaProduct?.visaType === 'e-visa' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {order.visaProduct?.visaType === 'e-visa' ? 'E-Visa' : 'Sticker Visa'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Category:</span>
                              <span className="ml-2 text-gray-900 capitalize">{order.visaProduct?.category}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Entry Type:</span>
                              <span className="ml-2 text-gray-900 capitalize">{order.visaProduct?.entryType}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Validity:</span>
                              <span className="ml-2 text-gray-900">{order.visaProduct?.validityDays} days</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Processing:</span>
                              <span className="ml-2 text-gray-900">~{order.visaProduct?.processingDays} days</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Destination & Nationality */}
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Destination</h3>
                          <div className="flex items-center">
                            <CountryFlag code={order.destinationCountryCode} size={24} />
                            <span className="ml-3 text-gray-900 font-medium">{order.destinationCountry}</span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Nationality</h3>
                          <div className="flex items-center">
                            <CountryFlag code={order.nationalityCode} size={24} />
                            <span className="ml-3 text-gray-900 font-medium">{order.nationality}</span>
                          </div>
                        </div>
                      </div>

                      {/* Travel Dates */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Travel Dates</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-xs text-gray-500">Departure</div>
                            <div className="font-medium text-gray-900">{order.departureDate || 'N/A'}</div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-xs text-gray-500">Return</div>
                            <div className="font-medium text-gray-900">{order.returnDate || 'N/A'}</div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-xs text-gray-500">Visa Needed By</div>
                            <div className="font-medium text-gray-900">{order.passportNeededBy || 'N/A'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Shipping Info (for sticker visa) */}
                      {order.visaProduct?.visaType === 'sticker' && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Shipping</h3>
                          <div className="grid grid-cols-2 gap-4">
                            {order.pickupService && (
                              <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-xs text-gray-500">Pickup Service</div>
                                <div className="font-medium text-gray-900">{order.pickupMethod || 'Yes'}</div>
                              </div>
                            )}
                            {order.returnService && (
                              <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-xs text-gray-500">Return Service</div>
                                <div className="font-medium text-gray-900">{order.returnService}</div>
                              </div>
                            )}
                          </div>
                          
                          {order.returnAddress && (
                            <div className="mt-4 bg-gray-50 rounded-lg p-4">
                              <div className="text-xs text-gray-500 mb-2">Return Address</div>
                              <div className="text-sm text-gray-900">
                                {order.returnAddress.firstName} {order.returnAddress.lastName}<br />
                                {order.returnAddress.companyName && <>{order.returnAddress.companyName}<br /></>}
                                {order.returnAddress.street}<br />
                                {order.returnAddress.postalCode} {order.returnAddress.city}<br />
                                {order.returnAddress.country}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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
                                        await updateVisaOrder(order.id, { returnTrackingNumber: input.value });
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
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Cover Letters</h3>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                        <span className="text-4xl mb-3 block">✉️</span>
                        <p className="text-gray-600 mb-2">Cover letters for visa applications</p>
                        <p className="text-sm text-gray-500">Generate and manage cover letters for embassy submissions</p>
                        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          Generate Cover Letter
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Services Tab */}
                  {activeTab === 'services' && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Visa Services</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <div>
                              <span className="font-medium text-gray-900">{order.visaProduct?.name}</span>
                              <p className="text-sm text-gray-500">
                                {order.visaProduct?.visaType === 'e-visa' ? 'E-Visa' : 'Sticker Visa'} • 
                                {order.visaProduct?.entryType === 'single' ? ' Single Entry' : ' Multiple Entry'} • 
                                {order.visaProduct?.validityDays} days validity
                              </p>
                            </div>
                            <span className="font-medium">{order.visaProduct?.price?.toLocaleString()} kr</span>
                          </div>
                          
                          {order.visaProduct?.visaType !== 'e-visa' && order.returnService && (
                            <div className="flex justify-between items-center py-2">
                              <div>
                                <span className="font-medium text-gray-900">Return Shipping</span>
                                <p className="text-sm text-gray-500">{order.returnService}</p>
                              </div>
                              <span className="font-medium">{order.pricingBreakdown?.shippingFee?.toLocaleString() || 0} kr</span>
                            </div>
                          )}
                        </div>
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
                          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Upload Document
                          </button>
                        </div>
                      )}
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
