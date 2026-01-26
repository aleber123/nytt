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
  VisaOrder, 
  VisaProcessingStep 
} from '@/firebase/visaOrderService';

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
    const items: Array<{ label: string; amount: number }> = [];
    
    // Visa product price
    if (order.visaProduct?.price) {
      items.push({ label: `Visa Product (${order.visaProduct.name})`, amount: order.visaProduct.price });
    }
    
    // Shipping fee
    if (order.pricingBreakdown?.shippingFee) {
      items.push({ label: 'Shipping', amount: order.pricingBreakdown.shippingFee });
    }
    
    // Expedited fee
    if (order.pricingBreakdown?.expeditedFee) {
      items.push({ label: 'Expedited Processing', amount: order.pricingBreakdown.expeditedFee });
    }
    
    const initial = items.map((item, idx) => ({
      index: idx,
      label: item.label,
      baseAmount: item.amount,
      overrideAmount: null,
      vatPercent: null,
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
        setOrder(orderData);
        setInternalNotes(orderData.internalNotes || '');
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
      await updateVisaProcessingStep(order.id, stepId, { 
        status: newStatus,
        completedBy: currentUser?.email || 'admin'
      });
      
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
                          <div className="flex items-start justify-between">
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
                      
                      {order.visaProduct?.visaType !== 'e-visa' && (
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
                      
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                        <span className="text-4xl mb-3 block">📎</span>
                        <p className="text-gray-600 mb-2">Document uploads and attachments</p>
                        <p className="text-sm text-gray-500">Passport copies, photos, and other required documents</p>
                        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          Upload Document
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Invoice Tab */}
                  {activeTab === 'invoice' && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Invoice</h3>
                      
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-medium text-gray-900">Create Invoice</h4>
                            <p className="text-sm text-gray-500">Generate an invoice for this visa order</p>
                          </div>
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Create Invoice
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
                              <span className="font-medium text-gray-900">{order.totalPrice?.toLocaleString()} kr</span>
                            </div>
                            {order.customerType === 'company' && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">VAT (25%):</span>
                                <span className="text-gray-900">{((order.totalPrice || 0) * 0.25).toLocaleString()} kr</span>
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
