import { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import { getAllOrders, updateOrder } from '@/services/hybridOrderService';

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
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    postalCode: string;
    city: string;
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

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
        return 'Utrikesdepartementet';
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

  // Filter orders based on status
  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

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

                <div className="flex flex-wrap items-center gap-4">
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
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
                    <div className="p-6">
                      {/* Header with Order Number and Price */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">
                              #{order.orderNumber || order.id}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                              {order.status === 'pending' ? 'Väntar' :
                               order.status === 'processing' ? 'Bearbetas' :
                               order.status === 'shipped' ? 'Skickad' :
                               order.status === 'delivered' ? 'Levererad' :
                               order.status === 'cancelled' ? 'Avbruten' : order.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900 mb-1">
                            {order.totalPrice} kr
                          </div>
                          <div className="text-sm text-gray-600">
                            {order.quantity} dokument
                          </div>
                        </div>
                      </div>

                      {/* Service Indicators */}
                      <div className="flex items-center gap-2 mb-4">
                        {order.uploadedFiles && order.uploadedFiles.length > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            📎 {order.uploadedFiles.length} fil{order.uploadedFiles.length > 1 ? 'er' : ''}
                          </span>
                        )}
                        {order.pickupService && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            🚚 Hämtning
                          </span>
                        )}
                        {order.scannedCopies && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            📋 Kopior
                          </span>
                        )}
                      </div>

                      {/* Main Content Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {/* Customer Info */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Kund</h4>
                          <div className="space-y-1">
                            <p className="text-base font-medium text-gray-900">
                              {order.customerInfo.firstName} {order.customerInfo.lastName}
                            </p>
                            <p className="text-sm text-gray-600 truncate">{order.customerInfo.email}</p>
                            <p className="text-sm text-gray-600">{order.customerInfo.phone}</p>
                          </div>
                        </div>

                        {/* Document & Services */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Dokument & Tjänster</h4>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {order.documentType === 'birthCertificate' ? 'Födelsebevis' :
                                 order.documentType === 'marriageCertificate' ? 'Vigselbevis' :
                                 order.documentType === 'diploma' ? 'Examensbevis' :
                                 order.documentType === 'commercial' ? 'Handelsdokument' :
                                 order.documentType === 'powerOfAttorney' ? 'Fullmakt' : 'Annat dokument'}
                              </p>
                              <p className="text-sm text-gray-600">{order.country}</p>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {Array.isArray(order.services) ? (
                                order.services.slice(0, 3).map((service, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800">
                                    {getServiceName(service)}
                                  </span>
                                ))
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800">
                                  {getServiceName(order.services as unknown as string)}
                                </span>
                              )}
                              {Array.isArray(order.services) && order.services.length > 3 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                                  +{order.services.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Åtgärder</h4>
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                              <select
                                disabled={updatingOrderId === order.id}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                value={order.status}
                                onChange={(e) => handleStatusChange(order.id!, e.target.value as Order['status'])}
                              >
                                <option value="pending">Väntar</option>
                                <option value="processing">Bearbetas</option>
                                <option value="shipped">Skickad</option>
                                <option value="delivered">Levererad</option>
                                <option value="cancelled">Avbruten</option>
                              </select>
                              {updatingOrderId === order.id && (
                                <div className="flex items-center mt-1">
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-600 mr-2"></div>
                                  <span className="text-xs text-gray-500">Uppdaterar...</span>
                                </div>
                              )}
                            </div>
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Visa detaljer
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
