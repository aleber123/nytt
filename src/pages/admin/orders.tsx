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

// Admin email check (temporary solution until custom claims work)
const ADMIN_EMAILS = ['admin@doxvl.se', 'sofia@sofia.se'];

// Define Order interface locally to match the updated interface
interface Order {
  id?: string;
  orderNumber?: string;
  userId?: string;
  services: string[];
  documentType: string;
  country: string;
  quantity: number;
  expedited: boolean;
  documentSource: string;
  pickupService: boolean;
  pickupAddress?: {
    street: string;
    postalCode: string;
    city: string;
  };
  scannedCopies: boolean;
  returnService: string;
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
  deliveryMethod: string;
  paymentMethod: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'shipped' | 'delivered';
  totalPrice: number;
  createdAt?: any;
  updatedAt?: any;
  uploadedFiles?: any[];
  filesUploaded?: boolean;
  filesUploadedAt?: any;
  uploadError?: string;
  invoiceReference?: string;
  additionalNotes?: string;
  linkedOrders?: string[]; // Linked orders for combined shipping
}
import { toast } from 'react-hot-toast';

const DEFAULT_STATUS_FILTER: Order['status'][] = ['pending', 'processing'];
const ALL_STATUSES: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'completed'];

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

  useEffect(() => {
    fetchOrders();
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
      console.error('Error fetching orders:', err);
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
          const response = await fetch('/api/admin/update-order', {
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
      console.error('Error bulk updating order status:', err);
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
      const invoice = await convertOrderToInvoice(order);
      const invoiceId = await storeInvoice(invoice);

      toast.success(`Invoice ${invoice.invoiceNumber} created for order ${order.orderNumber}`);

      // Redirect to invoices page
      setTimeout(() => {
        window.location.href = `/admin/invoices?orderId=${order.id}`;
      }, 1500);

    } catch (error) {
      console.error('Error creating invoice for order:', error);
      toast.error('Could not create invoice for order');
    } finally {
      setCreatingInvoiceForOrder(null);
    }
  };

  // Function to get service name
  const getServiceName = (serviceId: string) => {
    switch (serviceId) {
      case 'apostille':
        return t('services.apostille.title');
      case 'notarisering':
        return t('services.notarization.title');
      case 'ambassad':
        return t('services.embassy.title');
      case 'oversattning':
        return t('services.translation.title');
      case 'utrikesdepartementet':
      case 'ud':
        return t('services.ud.title');
      case 'chamber':
        return t('services.chamber.title');
      default:
        return serviceId;
    }
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

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800';
        break;
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
        break;
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
        break;
      case 'delivered':
        return 'bg-green-100 text-green-800';
        break;
      case 'cancelled':
        return 'bg-red-100 text-red-800';
        break;
      default:
        return 'bg-gray-100 text-gray-800';
        break;
    }
  };
  
  // Get translated status label for admin views
  const getStatusLabel = (status: Order['status']) => {
    return t(`orderStatus.statuses.${status}`, status);
  };

  // Filter orders based on status and search query
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const byStatus =
    selectedStatuses.length === 0
      ? orders
      : orders.filter((o) => selectedStatuses.includes(o.status));
  const filteredOrders = normalizedQuery
    ? byStatus.filter((o) => {
        const fields = [
          o.orderNumber || o.id || '',
          `${o.customerInfo?.firstName || ''} ${o.customerInfo?.lastName || ''}`,
          o.customerInfo?.email || '',
          o.country || '',
          o.status || '',
          o.returnService || ''
        ].join(' ').toLowerCase();
        return fields.includes(normalizedQuery);
      })
    : byStatus;

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

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{t('admin.orders.summaryTotal', 'Total orders')}</p>
                  <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{t('admin.orders.summaryPending', 'Waiting for processing')}</p>
                  <p className="text-2xl font-bold text-gray-900">{orders.filter(o => o.status === 'pending').length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{t('admin.orders.summaryProcessing', 'Being processed')}</p>
                  <p className="text-2xl font-bold text-gray-900">{orders.filter(o => o.status === 'processing').length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{t('admin.orders.summaryDelivered', 'Delivered')}</p>
                  <p className="text-2xl font-bold text-gray-900">{orders.filter(o => o.status === 'delivered').length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-medium text-gray-800">{t('admin.orders.panelTitle', 'Order Management')}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedStatuses.length === 0
                      ? t('admin.orders.summaryAll', 'Showing all {{count}} orders', { count: filteredOrders.length })
                      : t(
                          'admin.orders.summaryWithStatus',
                          'Showing {{count}} orders with status "{{statuses}}"',
                          {
                            count: filteredOrders.length,
                            statuses: selectedStatuses
                              .map((status: Order['status']) => getStatusLabel(status))
                              .join(', ')
                          }
                        )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full justify-between">
                  {/* Search */}
                  <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                    <label htmlFor="order-search" className="sr-only">{t('admin.orders.searchLabel', 'Search')}</label>
                    <div className="relative w-full max-w-sm">
                      <input
                        id="order-search"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('admin.orders.searchPlaceholder', 'Search order number, customer, email, country or status...')}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <svg className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <span className="mr-2 text-sm text-gray-600 font-medium">
                      {t('admin.orders.statusLabel', 'Status:')}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedStatuses((prev: Order['status'][]) =>
                            prev.includes('pending')
                              ? prev.filter((s: Order['status']) => s !== 'pending')
                              : [...prev, 'pending']
                          )
                        }
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                          selectedStatuses.includes('pending')
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        {getStatusLabel('pending')}
                      </button>
                      {ALL_STATUSES.filter((status) => status !== 'pending').map((status: Order['status']) => {
                        const isActive = selectedStatuses.includes(status);
                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() =>
                              setSelectedStatuses((prev: Order['status'][]) =>
                                prev.includes(status)
                                  ? prev.filter((s: Order['status']) => s !== status)
                                  : [...prev, status]
                              )
                            }
                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                              isActive
                                ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                            }`}
                          >
                            {getStatusLabel(status)}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setSelectedStatuses([])}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                          selectedStatuses.length === 0
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        {t('admin.orders.filterAllLabel', 'All')}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 font-medium">{t('admin.orders.quickFilterLabel', 'Quick filter:')}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedStatuses([])}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        selectedStatuses.length === 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {t('admin.orders.quickFilterAll', 'All ({{count}})', { count: orders.length })}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStatuses(['pending'])}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        selectedStatuses.includes('pending') ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {t('admin.orders.quickFilterPending', 'Pending ({{count}})', { count: orders.filter(o => o.status === 'pending').length })}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Filter for orders with files
                        const fileOrders = orders.filter(o => o.uploadedFiles && o.uploadedFiles.length > 0);
                        // For now, just show all - could implement custom filter
                        setSelectedStatuses([]);
                      }}
                      className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                    >
                      {t('admin.orders.quickFilterWithFiles', 'With files ({{count}})', { count: orders.filter(o => o.uploadedFiles && o.uploadedFiles.length > 0).length })}
                    </button>
                  </div>

                  <button
                    onClick={fetchOrders}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {t('admin.orders.refreshButton', 'Refresh')}
                  </button>
                </div>
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
                            {order.linkedOrders && order.linkedOrders.length > 0 && (
                              <span 
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800"
                                title={`Samskick med ${order.linkedOrders.length} ${order.linkedOrders.length === 1 ? 'order' : 'ordrar'}`}
                              >
                                📦 +{order.linkedOrders.length}
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
                            {Array.isArray(order.services) ? (
                              order.services.slice(0, 3).map((service, idx) => (
                                <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-indigo-100 text-indigo-800">
                                  {getServiceName(service)}
                                </span>
                              ))
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-indigo-100 text-indigo-800">
                                {getServiceName(order.services as unknown as string)}
                              </span>
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
                            {order.country || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                          {(order.customerInfo?.firstName || '') + ' ' + (order.customerInfo?.lastName || '')}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                          {order.customerInfo?.companyName || '—'}
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
