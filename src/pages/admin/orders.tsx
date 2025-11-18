import { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getAllOrders, updateOrder } from '@/services/hybridOrderService';
import { getInvoicesByOrderId, convertOrderToInvoice, storeInvoice } from '@/services/invoiceService';

// Admin email check (temporary solution until custom claims work)
const ADMIN_EMAILS = ['admin@legaliseringstjanst.se', 'sofia@sofia.se'];

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
}
import { toast } from 'react-hot-toast';

function AdminOrdersPage() {
  const { t } = useTranslation('common');
  const { signOut } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [creatingInvoiceForOrder, setCreatingInvoiceForOrder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

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

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    setUpdatingOrderId(orderId);
    try {
      await updateOrder(orderId, { status: newStatus });

      // Update the local state
      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus, updatedAt: new Date() as any } : order
      ));

      toast.success(`Order ${orderId} status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating order status:', err);
      toast.error('Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCreateOrViewInvoice = async (order: Order) => {
    setCreatingInvoiceForOrder(order.id!);

    try {
      // Check if invoice already exists for this order
      const existingInvoices = await getInvoicesByOrderId(order.id!);

      if (existingInvoices.length > 0) {
        // Invoice exists, redirect to invoices page with filter
        toast.success(`Faktura finns redan för order ${order.orderNumber}. Omdirigerar till fakturor...`);
        setTimeout(() => {
          window.location.href = `/admin/invoices?orderId=${order.id}`;
        }, 1500);
        return;
      }

      // Create new invoice from order
      const invoice = await convertOrderToInvoice(order);
      const invoiceId = await storeInvoice(invoice);

      toast.success(`Faktura ${invoice.invoiceNumber} skapad för order ${order.orderNumber}`);

      // Redirect to invoices page
      setTimeout(() => {
        window.location.href = `/admin/invoices?orderId=${order.id}`;
      }, 1500);

    } catch (error) {
      console.error('Error creating invoice for order:', error);
      toast.error('Kunde inte skapa faktura för ordern');
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

  // Filter orders based on status and search query
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const byStatus = statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter);
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
        <title>Admin - Orders | Legaliseringstjänst</title>
        <meta name="description" content="Admin panel for managing orders" />
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
                <h1 className="text-2xl font-bold text-gray-800">Admin - Orders</h1>
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
                  <p className="text-sm font-medium text-gray-500">Totala ordrar</p>
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
                  <p className="text-sm font-medium text-gray-500">Väntar</p>
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
                  <p className="text-sm font-medium text-gray-500">Skickade</p>
                  <p className="text-2xl font-bold text-gray-900">{orders.filter(o => o.status === 'shipped').length}</p>
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
                  <p className="text-sm font-medium text-gray-500">Levererade</p>
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
                  <h2 className="text-lg font-medium text-gray-800">Orderhantering</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {statusFilter === 'all'
                      ? `Visar alla ${filteredOrders.length} ordrar`
                      : `Visar ${filteredOrders.length} ordrar med status "${statusFilter === 'pending' ? 'Väntar' :
                          statusFilter === 'processing' ? 'Bearbetas' :
                          statusFilter === 'shipped' ? 'Skickad' :
                          statusFilter === 'delivered' ? 'Levererad' : 'Avbruten'}"`
                    }
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full justify-between">
                  {/* Search */}
                  <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                    <label htmlFor="order-search" className="sr-only">Sök</label>
                    <div className="relative w-full max-w-sm">
                      <input
                        id="order-search"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Sök ordernummer, kund, e-post, land eller status..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <svg className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label htmlFor="status-filter" className="mr-2 text-sm text-gray-600 font-medium">
                      Status:
                    </label>
                    <select
                      id="status-filter"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="all">Alla ordrar</option>
                      <option value="pending">Väntar på hantering</option>
                      <option value="processing">Bearbetas</option>
                      <option value="shipped">Skickade</option>
                      <option value="delivered">Levererade</option>
                      <option value="cancelled">Avbrutna</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 font-medium">Snabbfilter:</span>
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        statusFilter === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Alla ({orders.length})
                    </button>
                    <button
                      onClick={() => setStatusFilter('pending')}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        statusFilter === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Väntar ({orders.filter(o => o.status === 'pending').length})
                    </button>
                    <button
                      onClick={() => {
                        // Filter for orders with files
                        const fileOrders = orders.filter(o => o.uploadedFiles && o.uploadedFiles.length > 0);
                        // For now, just show all - could implement custom filter
                        setStatusFilter('all');
                      }}
                      className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                    >
                      Med filer ({orders.filter(o => o.uploadedFiles && o.uploadedFiles.length > 0).length})
                    </button>
                  </div>

                  <button
                    onClick={fetchOrders}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Uppdatera
                  </button>
                </div>
              </div>
            </div>
            
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">Inga ordrar hittades</h3>
                <p className="text-gray-500">
                  {statusFilter === 'all'
                    ? 'Det finns inga ordrar att visa just nu.'
                    : `Inga ordrar med status "${statusFilter === 'pending' ? 'Väntar' :
                        statusFilter === 'processing' ? 'Bearbetas' :
                        statusFilter === 'shipped' ? 'Skickad' :
                        statusFilter === 'delivered' ? 'Levererad' : 'Avbruten'}" hittades.`
                  }
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordernummer</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tjänster</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontaktperson</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retur</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Åtgärder</th>
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
                        <td className="px-4 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">#{order.orderNumber || order.id}</td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${getStatusBadgeColor(order.status)}`}>
                            {order.status === 'pending' ? 'Väntar' :
                             order.status === 'processing' ? 'Bearbetas' :
                             order.status === 'shipped' ? 'Skickad' :
                             order.status === 'delivered' ? 'Levererad' :
                             order.status === 'cancelled' ? 'Avbruten' : order.status}
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
                          {(order.customerInfo?.firstName || '') + ' ' + (order.customerInfo?.lastName || '')}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                          {order.returnService || '—'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm">
                          <div className="inline-flex items-center gap-2">
                            <select
                              disabled={updatingOrderId === order.id}
                              className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id!, e.target.value as Order['status'])}
                            >
                              <option value="pending">Väntar</option>
                              <option value="processing">Bearbetas</option>
                              <option value="shipped">Skickad</option>
                              <option value="delivered">Levererad</option>
                              <option value="cancelled">Avbruten</option>
                            </select>
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                              Visa
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

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'sv', ['common'])),
    },
  };
}
