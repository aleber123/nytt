import { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getAllOrders } from '@/services/hybridOrderService';
import { getInvoicesByOrderId, convertOrderToInvoice, storeInvoice } from '@/services/invoiceService';
import { ALL_COUNTRIES } from '@/components/order/data/countries';
import { adminFetch } from '@/lib/adminFetch';

// Admin email check (temporary solution until custom claims work)
const ADMIN_EMAILS = ['admin@doxvl.se', 'sofia@sofia.se'];

// Define Order interface locally to match the updated interface
interface Order {
  id?: string;
  orderNumber?: string;
  orderType?: 'visa' | 'legalization'; // To distinguish visa orders from legalization orders
  userId?: string;
  services?: string[];
  documentType?: string;
  country?: string;
  quantity?: number;
  expedited?: boolean;
  documentSource?: string;
  pickupService?: boolean;
  pickupAddress?: {
    street: string;
    postalCode: string;
    city: string;
  };
  scannedCopies?: boolean;
  returnService?: string;
  customerInfo?: {
    firstName?: string;
    lastName?: string;
    companyName?: string;
    email?: string;
    phone?: string;
    address?: string;
    postalCode?: string;
    city?: string;
  };
  deliveryMethod?: string;
  paymentMethod?: string;
  status: 'pending' | 'received' | 'waiting-for-documents' | 'processing' | 'submitted' | 'action-required' | 'ready-for-return' | 'completed' | 'cancelled' | 'documents-required' | 'submitted-to-embassy' | 'approved' | 'rejected';
  totalPrice?: number;
  createdAt?: any;
  updatedAt?: any;
  uploadedFiles?: any[];
  filesUploaded?: boolean;
  filesUploadedAt?: any;
  uploadError?: string;
  invoiceReference?: string;
  additionalNotes?: string;
  linkedOrders?: string[]; // Linked orders for combined shipping
  confirmReturnAddressLater?: boolean;
  returnAddressConfirmationRequired?: boolean;
  returnAddressConfirmed?: boolean;
  // Assignment fields
  assignedTo?: string;
  assignedToName?: string;
  assignedAt?: string;
  assignedBy?: string;
  // Visa-specific fields
  destinationCountry?: string;
  destinationCountryCode?: string;
  visaProduct?: {
    name?: string;
    nameEn?: string;
    category?: string;
  };
}
import { toast } from 'react-hot-toast';

const DEFAULT_STATUS_FILTER: Order['status'][] = ['pending', 'received', 'waiting-for-documents', 'processing', 'submitted', 'documents-required', 'submitted-to-embassy'];
const ALL_STATUSES: Order['status'][] = ['pending', 'received', 'waiting-for-documents', 'processing', 'submitted', 'action-required', 'ready-for-return', 'completed', 'cancelled', 'documents-required', 'submitted-to-embassy', 'approved', 'rejected'];

// Helper function to get country name from country code
const getCountryName = (countryCode: string): string => {
  if (!countryCode) return '—';
  const country = ALL_COUNTRIES.find(c => c.code === countryCode.toUpperCase());
  return country?.nameEn || countryCode;
};

function AdminOrdersPage() {
  const { t } = useTranslation('common');
  const { currentUser, signOut } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<Order['status'][]>([]);
  const [creatingInvoiceForOrder, setCreatingInvoiceForOrder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<Order['status'] | ''>('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'mine' | 'unassigned' | string>('all');
  const [adminUsers, setAdminUsers] = useState<Array<{ id: string; email: string; displayName?: string }>>([]);

  useEffect(() => {
    fetchOrders();
    // Load admin users for assignment filter
    const loadAdminUsers = async () => {
      try {
        const { getAllAdminUsers } = await import('@/firebase/userService');
        const users = await getAllAdminUsers();
        setAdminUsers(users.filter(u => u.isActive).map(u => ({
          id: u.id,
          email: u.email,
          displayName: u.displayName
        })));
      } catch (e) { /* ignore */ }
    };
    loadAdminUsers();
  }, []);

  useEffect(() => {
    const defaultStatuses = DEFAULT_STATUS_FILTER;

    if (typeof window === 'undefined') {
      setSelectedStatuses(defaultStatuses);
      return;
    }

    const userId = currentUser?.uid || currentUser?.email || 'guest';
    const storageKey = `adminOrdersStatusFilter:${userId}`;

    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          parsed.every((s) => (ALL_STATUSES as string[]).includes(s as string))
        ) {
          setSelectedStatuses(parsed as Order['status'][]);
          return;
        }
      }
    } catch {
    }

    setSelectedStatuses(defaultStatuses);
  }, [currentUser]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const userId = currentUser?.uid || currentUser?.email || 'guest';
    const storageKey = `adminOrdersStatusFilter:${userId}`;

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(selectedStatuses));
    } catch {
    }
  }, [selectedStatuses, currentUser]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const ordersData = await getAllOrders();
      setOrders(ordersData);
    } catch (err) {
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus || selectedOrderIds.length === 0) return;

    if (bulkStatus === 'cancelled' && typeof window !== 'undefined') {
      const confirmed = window.confirm(
        `Are you sure you want to set ${selectedOrderIds.length} orders to status "Cancelled"?`
      );
      if (!confirmed) return;
    }

    setIsBulkUpdating(true);
    try {
      // Use Admin API to bypass Firestore security rules
      await Promise.all(
        selectedOrderIds.map(async (orderId) => {
          const response = await adminFetch('/api/admin/update-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, updates: { status: bulkStatus } })
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update order');
          }
          return response.json();
        })
      );

      setOrders((prev) =>
        prev.map((order) =>
          order.id && selectedOrderIds.includes(order.id)
            ? { ...order, status: bulkStatus }
            : order
        )
      );

      toast.success(`Status updated for ${selectedOrderIds.length} orders`);
      setSelectedOrderIds([]);
      setBulkStatus('');
    } catch (err) {
      toast.error('Could not update status for all selected orders');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleCreateOrViewInvoice = async (order: Order) => {
    setCreatingInvoiceForOrder(order.id!);

    try {
      // Check if invoice already exists for this order
      const existingInvoices = await getInvoicesByOrderId(order.id!);

      if (existingInvoices.length > 0) {
        // Invoice exists, redirect to invoices page with filter
        toast.success(`Invoice already exists for order ${order.orderNumber}. Redirecting to invoices...`);
        setTimeout(() => {
          window.location.href = `/admin/invoices?orderId=${order.id}`;
        }, 1500);
        return;
      }

      // Create new invoice from order
      const invoice = await convertOrderToInvoice(order as any);
      const invoiceId = await storeInvoice(invoice);

      toast.success(`Invoice ${invoice.invoiceNumber} created for order ${order.orderNumber}`);

      // Redirect to invoices page
      setTimeout(() => {
        window.location.href = `/admin/invoices?orderId=${order.id}`;
      }, 1500);

    } catch (error) {
      toast.error('Could not create invoice for order');
    } finally {
      setCreatingInvoiceForOrder(null);
    }
  };

  // Function to get service name
  const getServiceName = (serviceId: string) => {
    const names: Record<string, string> = {
      apostille: 'Apostille',
      notarisering: 'Notarization',
      notarization: 'Notarization',
      ambassad: 'Embassy',
      embassy: 'Embassy',
      oversattning: 'Translation',
      translation: 'Translation',
      utrikesdepartementet: 'UD',
      ud: 'UD',
      chamber: 'Chamber',
    };
    return names[serviceId] || serviceId.charAt(0).toUpperCase() + serviceId.slice(1);
  };

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

    return new Intl.DateTimeFormat('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Get status badge color (colorblind-friendly palette)
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'received':
        return 'bg-purple-100 text-purple-800';
      case 'waiting-for-documents':
        return 'bg-orange-100 text-orange-800';
      case 'processing':
        return 'bg-amber-100 text-amber-800';
      case 'submitted':
        return 'bg-indigo-100 text-indigo-800';
      case 'action-required':
        return 'bg-orange-100 text-orange-800';
      case 'ready-for-return':
        return 'bg-teal-100 text-teal-800';
      case 'completed':
        return 'bg-gray-700 text-white';
      case 'cancelled':
        return 'bg-gray-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get translated status label for admin views
  const getStatusLabel = (status: Order['status']) => {
    return t(`orderStatus.statuses.${status}`, status);
  };

  // Filter orders based on status, assignment, and search query
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const byStatus =
    selectedStatuses.length === 0
      ? orders
      : orders.filter((o) => selectedStatuses.includes(o.status));
  const byAssignment = assignmentFilter === 'all'
    ? byStatus
    : assignmentFilter === 'mine'
      ? byStatus.filter((o) => o.assignedTo === currentUser?.uid)
      : assignmentFilter === 'unassigned'
        ? byStatus.filter((o) => !o.assignedTo)
        : byStatus.filter((o) => o.assignedTo === assignmentFilter);
  const filteredOrders = normalizedQuery
    ? byAssignment.filter((o) => {
        const fields = [
          o.orderNumber || o.id || '',
          `${o.customerInfo?.firstName || ''} ${o.customerInfo?.lastName || ''}`,
          o.customerInfo?.companyName || '',
          o.customerInfo?.email || '',
          o.customerInfo?.phone || '',
          o.country || '',
          o.status || '',
          o.invoiceReference || '',
          o.returnService || ''
        ].join(' ').toLowerCase();
        return fields.includes(normalizedQuery);
      })
    : byAssignment;

  return (
    <>
      <Head>
        <title>{t('admin.orders.metaTitle', 'Admin - Orders')}</title>
        <meta name="description" content={t('admin.orders.metaDescription', 'Admin panel for managing orders')} />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="bg-gray-100 min-h-screen">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Link href="/admin" className="text-gray-500 hover:text-gray-700 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">{t('admin.orders.heading', 'Admin - Orders')}</h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => signOut()}
                  className="text-gray-600 hover:text-gray-800"
                >
                  {t('admin.orders.headerSignOut', 'Sign Out')}
                </button>
                <Link href="/admin" className="text-primary-600 hover:text-primary-800">
                  {t('admin.orders.headerDashboard', 'Dashboard')}
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
                onClick={fetchOrders} 
                className="ml-4 underline text-red-700 hover:text-red-900"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Summary Stats - clickable to filter */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            {([
              { status: 'pending' as Order['status'], icon: '⏳', label: 'Pending', border: 'border-blue-200', bg: 'bg-blue-100', ring: 'ring-blue-400' },
              { status: 'received' as Order['status'], icon: '📥', label: 'Received', border: 'border-purple-200', bg: 'bg-purple-100', ring: 'ring-purple-400' },
              { status: 'processing' as Order['status'], icon: '⚙️', label: 'Processing', border: 'border-amber-200', bg: 'bg-amber-100', ring: 'ring-amber-400' },
              { status: 'submitted' as Order['status'], icon: '📤', label: 'Submitted', border: 'border-indigo-200', bg: 'bg-indigo-100', ring: 'ring-indigo-400' },
              { status: 'action-required' as Order['status'], icon: '⚠️', label: 'Action Required', border: 'border-orange-200', bg: 'bg-orange-100', ring: 'ring-orange-400' },
              { status: 'ready-for-return' as Order['status'], icon: '📦', label: 'Ready for Return', border: 'border-teal-200', bg: 'bg-teal-100', ring: 'ring-teal-400' },
            ]).map(card => {
              const isActive = selectedStatuses.length === 1 && selectedStatuses[0] === card.status;
              return (
                <button
                  key={card.status}
                  type="button"
                  onClick={() => setSelectedStatuses(isActive ? [] : [card.status])}
                  className={`bg-white rounded-lg shadow-sm border ${card.border} p-4 text-left cursor-pointer hover:shadow-md transition-all ${isActive ? 'ring-2 ' + card.ring : ''}`}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`h-8 w-8 rounded-full ${card.bg} flex items-center justify-center`}>
                        <span className="text-xl">{card.icon}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">{card.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{orders.filter(o => o.status === card.status).length}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Controls */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            {/* Row 1: Title, Search, Assignment, Refresh */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="flex-shrink-0">
                  <h2 className="text-lg font-medium text-gray-800">Order Management</h2>
                  <p className="text-xs text-gray-500">{filteredOrders.length} of {orders.length} orders</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="relative max-w-md">
                    <input id="order-search" type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search order, customer, email, country..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                    <svg className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" /></svg>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select value={assignmentFilter} onChange={(e) => setAssignmentFilter(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary-500">
                    <option value="all">All handlers</option>
                    <option value="mine">My orders ({orders.filter(o => o.assignedTo === currentUser?.uid).length})</option>
                    <option value="unassigned">Unassigned ({orders.filter(o => !o.assignedTo).length})</option>
                    {adminUsers.map(u => (<option key={u.id} value={u.id}>{u.displayName || u.email}</option>))}
                  </select>
                  <button onClick={fetchOrders} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50" title="Refresh">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Row 2: Status filter pills - grouped */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex flex-wrap items-center gap-1.5">
                {/* All */}
                <button type="button" onClick={() => setSelectedStatuses([])} className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${selectedStatuses.length === 0 ? 'bg-primary-100 text-primary-800 border-primary-300' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}>
                  All ({orders.length})
                </button>
                <span className="text-gray-300 mx-0.5">|</span>
                {/* Active workflow statuses */}
                {(['pending', 'received', 'waiting-for-documents', 'processing', 'submitted', 'action-required', 'ready-for-return'] as Order['status'][]).map(status => {
                  const count = orders.filter(o => o.status === status).length;
                  const isActive = selectedStatuses.includes(status);
                  return (
                    <button key={status} type="button" onClick={() => setSelectedStatuses((prev: Order['status'][]) => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status])} className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${isActive ? getStatusBadgeColor(status) + ' border-current font-medium' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}>
                      {getStatusLabel(status)} {count > 0 && <span className="opacity-60">({count})</span>}
                    </button>
                  );
                })}
                <span className="text-gray-300 mx-0.5">|</span>
                {/* Final + Visa statuses */}
                {(['completed', 'cancelled', 'documents-required', 'submitted-to-embassy', 'approved', 'rejected'] as Order['status'][]).map(status => {
                  const count = orders.filter(o => o.status === status).length;
                  const isActive = selectedStatuses.includes(status);
                  return (
                    <button key={status} type="button" onClick={() => setSelectedStatuses((prev: Order['status'][]) => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status])} className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${isActive ? getStatusBadgeColor(status) + ' border-current font-medium' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}>
                      {getStatusLabel(status)} {count > 0 && <span className="opacity-60">({count})</span>}
                    </button>
                  );
                })}
              </div>
            </div>


            {selectedOrderIds.length > 0 && (
              <div className="px-4 py-3 border-b border-gray-200 bg-yellow-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-sm text-gray-700">
                  {t('admin.orders.bulkSelected', '{{count}} orders selected', { count: selectedOrderIds.length })}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value as Order['status'] | '')}
                    className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">{t('admin.orders.bulkSelectStatusPlaceholder', 'Select new status...')}</option>
                    {ALL_STATUSES.map((status: Order['status']) => (
                      <option key={status} value={status}>
                        {t(`orderStatus.statuses.${status}`, status)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleBulkStatusUpdate}
                    disabled={!bulkStatus || isBulkUpdating}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    {isBulkUpdating
                      ? t('admin.orders.bulkUpdateProcessing', 'Updating...')
                      : t('admin.orders.bulkUpdateButton', 'Update status')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedOrderIds([]); setBulkStatus(''); }}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    {t('admin.orders.bulkClearSelection', 'Clear selection')}
                  </button>
                </div>
              </div>
            )}
            
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="animate-pulse">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-2">
                          <div className="h-5 bg-gray-200 rounded w-32"></div>
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </div>
                        <div className="text-right space-y-2">
                          <div className="h-8 bg-gray-200 rounded w-20"></div>
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, j) => (
                          <div key={j} className="space-y-2">
                            <div className="h-3 bg-gray-200 rounded w-16"></div>
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                            <div className="h-3 bg-gray-200 rounded w-20"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('admin.orders.emptyTitle', 'No orders found')}</h3>
                <p className="text-gray-500">
                  {selectedStatuses.length === 0
                    ? t('admin.orders.emptyNoOrders', 'There are no orders to display right now.')
                    : t(
                        'admin.orders.emptyNoOrdersWithStatus',
                        'No orders with status "{{statuses}}" found.',
                        {
                          statuses: selectedStatuses
                            .map((status: Order['status']) => getStatusLabel(status))
                            .join(', ')
                        }
                      )}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 w-10">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                          checked={
                            filteredOrders.length > 0 &&
                            filteredOrders.every((o) => o.id && selectedOrderIds.includes(o.id))
                          }
                          onChange={(e) => {
                            const checked = e.target.checked;
                            if (checked) {
                              const ids = filteredOrders
                                .map((o) => o.id)
                                .filter((id): id is string => Boolean(id));
                              setSelectedOrderIds(ids);
                            } else {
                              setSelectedOrderIds([]);
                            }
                          }}
                        />
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.orders.table.orderNumber', 'Order number')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.orders.table.status', 'Status')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.orders.table.services', 'Services')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.orders.table.country', 'Country')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.orders.table.contact', 'Contact')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.orders.table.company', 'Company')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.orders.table.actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            router.push(`/admin/orders/${order.id}`);
                          }
                        }}
                      >
                        <td className="px-4 py-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                            checked={order.id ? selectedOrderIds.includes(order.id) : false}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const orderId = order.id;
                              if (!orderId) return;
                              setSelectedOrderIds((prev: string[]) =>
                                checked
                                  ? [...prev.filter((id) => id !== orderId), orderId]
                                  : prev.filter((id) => id !== orderId)
                              );
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            #{order.orderNumber || order.id}
                            <button
                              title="Copy order number"
                              onClick={(e) => {
                                e.stopPropagation();
                                const num = order.orderNumber || order.id || '';
                                navigator.clipboard.writeText(num).then(() => {
                                  toast.success(`Copied ${num}`);
                                }).catch(() => {
                                  toast.error('Could not copy');
                                });
                              }}
                              className="inline-flex items-center p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                            {order.orderType === 'visa' && (
                              <span 
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800"
                                title="Visa order"
                              >
                                🛂 Visa
                              </span>
                            )}
                            {order.linkedOrders && order.linkedOrders.length > 0 && (
                              <span 
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800"
                                title={`Samskick med ${order.linkedOrders.length} ${order.linkedOrders.length === 1 ? 'order' : 'ordrar'}`}
                              >
                                📦 +{order.linkedOrders.length}
                              </span>
                            )}
                            {(order.confirmReturnAddressLater || order.returnAddressConfirmationRequired) && !order.returnAddressConfirmed && (
                              <span 
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800"
                                title="Return address not confirmed"
                              >
                                📍 No return addr
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${getStatusBadgeColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          <div className="flex flex-wrap gap-1">
                            {order.orderType === 'visa' ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-purple-100 text-purple-800">
                                {order.visaProduct?.nameEn || order.visaProduct?.name || order.visaProduct?.category || 'Visa'}
                              </span>
                            ) : Array.isArray(order.services) ? (
                              order.services.slice(0, 3).map((service, idx) => (
                                <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-indigo-100 text-indigo-800">
                                  {getServiceName(service)}
                                </span>
                              ))
                            ) : order.services ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-indigo-100 text-indigo-800">
                                {getServiceName(order.services as unknown as string)}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                            {Array.isArray(order.services) && order.services.length > 3 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-600">
                                +{order.services.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-blue-100 text-blue-800">
                            {order.orderType === 'visa' 
                              ? (getCountryName(order.destinationCountryCode || '') !== '—' ? getCountryName(order.destinationCountryCode || '') : (order.destinationCountry || '—'))
                              : getCountryName(order.country || '')}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                          {(order.customerInfo?.firstName || '') + ' ' + (order.customerInfo?.lastName || '')}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                          {order.customerInfo?.companyName || '—'}
                        </td>
                        <td className="px-4 py-2 text-sm whitespace-nowrap">
                          {order.assignedToName ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              order.assignedTo === currentUser?.uid
                                ? 'bg-primary-100 text-primary-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {order.assignedToName}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm">
                          <div className="inline-flex items-center gap-2">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                              {t('admin.orders.table.view', 'View')}
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function ProtectedAdminOrdersPage() {
  return (
    <ProtectedRoute>
      <AdminOrdersPage />
    </ProtectedRoute>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  // Admin pages always use English
  const i18nConfig = {
    i18n: { defaultLocale: 'sv', locales: ['sv', 'en'], localeDetection: false as const },
  };
  return {
    props: {
      ...(await serverSideTranslations('en', ['common'], i18nConfig)),
    },
  };
}
