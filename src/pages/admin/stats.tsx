import React, { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useTranslation } from 'next-i18next';
import { getAllInvoices, Invoice } from '@/services/invoiceService';
import { getAllOrders } from '@/services/hybridOrderService';
import { toast } from 'react-hot-toast';

interface Order {
   id: string;
   orderNumber: string;
   customerInfo: {
     firstName: string;
     lastName: string;
     email: string;
   };
   country: string;
   status: string;
   createdAt: any;
   totalPrice: number;
 }

interface StatsData {
  totalOrders: number;
  totalRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingOrders: number;
  completedOrders: number;
  averageOrderValue: number;
  monthlyRevenue: { [key: string]: number };
  topCountries: { country: string; count: number }[];
  recentOrders: Order[];
}

function AdminStatsPage() {
  const { t } = useTranslation('common');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const invoices = await getAllInvoices();
      const orders = await getAllOrders();

      // Calculate stats
      const totalOrders = orders.length;
      const totalRevenue = orders
        .filter((order: Order) => order.status === 'delivered')
        .reduce((sum: number, order: Order) => sum + (order.totalPrice || 0), 0);

      const totalInvoices = invoices.length;
      const paidInvoices = invoices.filter((inv: any) => inv.status === 'paid').length;
      const pendingOrders = orders.filter((order: Order) => order.status === 'pending' || order.status === 'processing').length;
      const completedOrders = orders.filter((order: Order) => order.status === 'delivered').length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Monthly revenue
      const monthlyRevenue: { [key: string]: number } = {};
      orders
        .filter((order: Order) => order.status === 'delivered')
        .forEach((order: Order) => {
          const date = new Date(order.createdAt);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + (order.totalPrice || 0);
        });

      // Top countries
      const countryCount: { [key: string]: number } = {};
      orders.forEach((order: Order) => {
        const country = order.country || 'Unknown';
        countryCount[country] = (countryCount[country] || 0) + 1;
      });

      const topCountries = Object.entries(countryCount)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Recent orders (last 10)
      const recentOrders = orders
        .sort((a: Order, b: Order) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 10);

      setStats({
        totalOrders,
        totalRevenue,
        totalInvoices,
        paidInvoices,
        pendingOrders,
        completedOrders,
        averageOrderValue,
        monthlyRevenue,
        topCountries,
        recentOrders
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK'
    }).format(amount);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      let date: Date;
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        date = new Date(timestamp);
      }
      return new Intl.DateTimeFormat('sv-SE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    } catch (error) {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-custom-button mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading statistics...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !stats) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8 shadow-sm">
                <div className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error || 'Could not load statistics'}
                  <button
                    onClick={fetchStats}
                    className="ml-4 underline text-red-700 hover:text-red-900 font-medium"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Head>
        <title>Statistics - Admin</title>
        <meta name="description" content="Statistics and analytics for legalization service" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Statistics & Analytics</h1>
            <p className="text-gray-600">Overview of your legalization service performance</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Invoices</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalInvoices}</p>
                  <p className="text-xs text-gray-500">{stats.paidInvoices} paid</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avg. order value</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averageOrderValue)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Status & Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Order Status Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-600">Pending</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{stats.pendingOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-600">Completed</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{stats.completedOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-400 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-600">Total</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{stats.totalOrders}</span>
                </div>
              </div>
            </div>

            {/* Top Countries */}
            <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top countries</h3>
              <div className="space-y-3">
                {stats.topCountries.map((item, index) => (
                  <div key={item.country} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 mr-2">#{index + 1}</span>
                      <span className="text-sm text-gray-600">{item.country}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.count} orders</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent orders</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.customerInfo.firstName} {order.customerInfo.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.country}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status === 'delivered' ? 'Completed' :
                           order.status === 'processing' ? 'Processing' :
                           order.status === 'pending' ? 'Pending' : order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  // Admin pages always use English
  return {
    props: {
      ...(await serverSideTranslations('en', ['common'])),
    },
  };
};

export default AdminStatsPage;