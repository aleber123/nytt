/**
 * Admin Visa Orders Page
 * Lists and manages visa orders with VISA-prefixed order numbers
 */

import { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getAllVisaOrders, VisaOrder, updateVisaOrderStatus } from '@/firebase/visaOrderService';
import { toast } from 'react-hot-toast';
import CountryFlag from '@/components/ui/CountryFlag';

const ADMIN_EMAILS = ['admin@doxvl.se', 'sofia@sofia.se'];

type VisaOrderStatus = VisaOrder['status'];

const ALL_STATUSES: VisaOrderStatus[] = [
  'pending', 
  'received', 
  'documents-required', 
  'processing', 
  'submitted-to-embassy', 
  'approved', 
  'ready-for-return', 
  'completed', 
  'rejected', 
  'cancelled'
];

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
  'pending': 'bg-yellow-100 text-yellow-800',
  'received': 'bg-blue-100 text-blue-800',
  'documents-required': 'bg-orange-100 text-orange-800',
  'processing': 'bg-purple-100 text-purple-800',
  'submitted-to-embassy': 'bg-indigo-100 text-indigo-800',
  'approved': 'bg-green-100 text-green-800',
  'ready-for-return': 'bg-teal-100 text-teal-800',
  'completed': 'bg-gray-100 text-gray-800',
  'rejected': 'bg-red-100 text-red-800',
  'cancelled': 'bg-gray-200 text-gray-600'
};

function AdminVisaOrdersPage() {
  const { currentUser, signOut } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<VisaOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<VisaOrderStatus[]>(['pending', 'received', 'processing', 'submitted-to-embassy']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<VisaOrderStatus | ''>('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const ordersData = await getAllVisaOrders();
      setOrders(ordersData);
    } catch (err) {
      setError('Failed to load visa orders. Please try again.');
    } finally {
      setLoading(false);
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

  const toggleStatus = (status: VisaOrderStatus) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
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
      await Promise.all(
        selectedOrderIds.map(async (orderId) => {
          const response = await fetch('/api/admin/update-visa-order', {
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

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.id!).filter(Boolean));
    }
  };

  const filteredOrders = orders.filter(order => {
    // Status filter
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(order.status)) {
      return false;
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesOrderNumber = order.orderNumber?.toLowerCase().includes(query);
      const matchesEmail = order.customerInfo?.email?.toLowerCase().includes(query);
      const matchesName = `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.toLowerCase().includes(query);
      const matchesCompany = order.customerInfo?.companyName?.toLowerCase().includes(query);
      const matchesDestination = order.destinationCountry?.toLowerCase().includes(query);
      
      if (!matchesOrderNumber && !matchesEmail && !matchesName && !matchesCompany && !matchesDestination) {
        return false;
      }
    }
    
    return true;
  });

  // Count orders by status
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <ProtectedRoute>
      <Head>
        <title>Visa Orders | Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                  ← Back to Dashboard
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Visa Orders</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">{currentUser?.email}</span>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Summary Stats - Same style as legalization orders */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-yellow-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                    <span className="text-xl">⏳</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts['pending'] || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xl">📥</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Received</p>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts['received'] || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-xl">⚙️</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Processing</p>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts['processing'] || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-indigo-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-xl">🏛️</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">At Embassy</p>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts['submitted-to-embassy'] || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-xl">✅</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts['approved'] || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-teal-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                    <span className="text-xl">📦</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Ready for Return</p>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts['ready-for-return'] || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-medium text-gray-800">Visa Order Management</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedStatuses.length === 0
                      ? `Showing all ${filteredOrders.length} orders`
                      : `Showing ${filteredOrders.length} orders with selected statuses`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full justify-between">
                  {/* Search */}
                  <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                    <div className="relative w-full max-w-sm">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search order number, customer, email..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-10"
                      />
                      <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                  {/* Refresh */}
                  <button
                    onClick={fetchOrders}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <svg className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            {/* Status Filters */}
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {ALL_STATUSES.map(status => (
                  <button
                    key={status}
                    onClick={() => toggleStatus(status)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                      selectedStatuses.includes(status)
                        ? STATUS_COLORS[status] + ' border-transparent'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {STATUS_LABELS[status]} ({statusCounts[status] || 0})
                  </button>
                ))}
                <button
                  onClick={() => setSelectedStatuses([])}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    selectedStatuses.length === 0
                      ? 'bg-blue-100 text-blue-800 border-transparent'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  All ({orders.length})
                </button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedOrderIds.length > 0 && (
              <div className="p-4 bg-blue-50 border-t border-blue-100">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-blue-800">
                    {selectedOrderIds.length} order{selectedOrderIds.length > 1 ? 's' : ''} selected
                  </span>
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value as VisaOrderStatus | '')}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select new status...</option>
                    {ALL_STATUSES.map(status => (
                      <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleBulkStatusUpdate}
                    disabled={!bulkStatus || isBulkUpdating}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBulkUpdating ? 'Updating...' : 'Update Status'}
                  </button>
                  <button
                    onClick={() => setSelectedOrderIds([])}
                    className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-sm"
                  >
                    Clear selection
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Orders Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visa Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Destination
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                        <p className="mt-2 text-gray-500">Loading orders...</p>
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                        No visa orders found
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr 
                                        key={order.id} 
                                        className={`hover:bg-gray-50 cursor-pointer ${selectedOrderIds.includes(order.id!) ? 'bg-blue-50' : ''}`}
                                        onClick={(e) => {
                                          // Don't navigate if clicking on checkbox or link
                                          if ((e.target as HTMLElement).tagName === 'INPUT' || 
                                              (e.target as HTMLElement).tagName === 'A' ||
                                              (e.target as HTMLElement).closest('a')) {
                                            return;
                                          }
                                          window.location.href = `/admin/visa-orders/${order.id}`;
                                        }}
                                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedOrderIds.includes(order.id!)}
                            onChange={() => toggleOrderSelection(order.id!)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link 
                            href={`/admin/visa-orders/${order.id}`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            #{order.orderNumber}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[order.status]}`}>
                            {STATUS_LABELS[order.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{order.visaProduct?.name}</div>
                            <div className="text-gray-500 flex items-center gap-2">
                              <span className={`inline-flex px-1.5 py-0.5 text-xs rounded ${
                                order.visaProduct?.visaType === 'e-visa' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {order.visaProduct?.visaType === 'e-visa' ? 'E-Visa' : 'Sticker'}
                              </span>
                              <span className="text-xs">
                                {order.visaProduct?.entryType === 'single' ? 'Single' : 'Multiple'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <CountryFlag code={order.destinationCountryCode} size={20} />
                            <span className="ml-2 text-sm text-gray-900">{order.destinationCountry}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {order.customerInfo?.companyName || `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`}
                            </div>
                            <div className="text-gray-500">{order.customerInfo?.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {order.totalPrice?.toLocaleString()} kr
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/admin/visa-orders/${order.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </ProtectedRoute>
  );
}

export default AdminVisaOrdersPage;

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'])),
    },
  };
};
