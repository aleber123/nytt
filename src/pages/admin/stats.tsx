import React, { useState, useEffect, useMemo } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import CountryFlag from '@/components/ui/CountryFlag';
import { getAllInvoices } from '@/services/invoiceService';
import { getAllOrders } from '@/services/hybridOrderService';
import { seedCountryPopularity } from '@/firebase/pricingService';
import { toast } from 'react-hot-toast';
import {
  calculateAnalytics,
  formatCurrency,
  formatPercent,
  formatGrowth,
  getStatusMeta,
  type AnyOrder,
  type DateRange,
  type DateFilter,
  type AnalyticsResult,
  type Breakdown,
} from '@/services/orderAnalytics';
import { downloadStatsReportPdf } from '@/services/statsPdfReport';

const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'this-month', label: 'This month' },
  { value: 'last-month', label: 'Last month' },
  { value: 'this-year', label: 'This year' },
  { value: 'all', label: 'All time' },
];

function AdminStatsPage() {
  const [orders, setOrders] = useState<AnyOrder[]>([]);
  const [invoiceCount, setInvoiceCount] = useState({ total: 0, paid: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  const filter: DateFilter = useMemo(() => ({ range: dateRange }), [dateRange]);

  const stats: AnalyticsResult | null = useMemo(() => {
    if (loading || !orders.length) return null;
    return calculateAnalytics(orders, filter);
  }, [orders, filter, loading]);

  const handleDownloadPdf = () => {
    if (!stats) {
      toast.error('No data to export');
      return;
    }
    const periodLabel = DATE_RANGES.find(r => r.value === dateRange)?.label || 'Report';
    try {
      downloadStatsReportPdf({
        stats,
        periodLabel,
        invoiceCount,
      });
    } catch (err: any) {
      toast.error(`Failed to generate PDF: ${err?.message || 'Unknown error'}`);
    }
  };

  const handleSeedPopularCountries = async () => {
    if (!confirm('This will add 100 clicks to: Vietnam, Qatar, Kuwait, Taiwan, Ethiopia, Lebanon, Syria, Angola, Thailand, UAE, Saudi Arabia, Iraq. Continue?')) {
      return;
    }
    setSeeding(true);
    try {
      const result = await seedCountryPopularity();
      toast.success(`Seeded ${result.success} countries: ${result.countries.join(', ')}`);
      if (result.failed > 0) {
        toast.error(`Failed to seed ${result.failed} countries`);
      }
    } catch (err: any) {
      toast.error(`Failed to seed: ${err?.message || 'Unknown error'}`);
    } finally {
      setSeeding(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [invoices, allOrders] = await Promise.all([
        getAllInvoices(),
        getAllOrders(),
      ]);
      setOrders(allOrders as AnyOrder[]);
      setInvoiceCount({
        total: invoices.length,
        paid: invoices.filter((inv: any) => inv.status === 'paid').length,
      });
    } catch (err) {
      setError('Failed to load statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8 shadow-sm flex items-center justify-between">
              <span>{error || 'No order data available'}</span>
              <button onClick={fetchData} className="underline text-red-700 hover:text-red-900 font-medium">
                Try again
              </button>
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
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Statistics & Analytics</h1>
              <p className="text-gray-600 text-sm">
                {dateRange === 'all' ? 'All-time overview' : `Showing ${DATE_RANGES.find(r => r.value === dateRange)?.label.toLowerCase()}`}
                {stats.cancelledExcluded > 0 && (
                  <span className="text-gray-400">
                    {' '}· {stats.cancelledExcluded} cancelled order{stats.cancelledExcluded === 1 ? '' : 's'} excluded
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRange)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {DATE_RANGES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <button
                onClick={handleDownloadPdf}
                className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium flex items-center gap-1.5"
                title="Download a printable PDF report of the current view"
              >
                📄 Download PDF
              </button>
              <button
                onClick={handleSeedPopularCountries}
                disabled={seeding}
                className="px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 text-sm font-medium"
              >
                {seeding ? 'Seeding...' : '🌱 Seed countries'}
              </button>
            </div>
          </div>

          {/* Key metrics with growth */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard
              label="Total orders"
              value={stats.totalOrders.toString()}
              growth={stats.growth.orders}
              icon="📦"
              color="blue"
            />
            <KpiCard
              label="DOX net revenue"
              value={formatCurrency(stats.totalNetRevenue)}
              growth={stats.growth.netRevenue}
              hint={`Gross: ${formatCurrency(stats.totalRevenue)}`}
              icon="💰"
              color="green"
            />
            <KpiCard
              label="Avg. order value (net)"
              value={formatCurrency(stats.averageOrderValue)}
              icon="📊"
              color="purple"
            />
            <KpiCard
              label="Conversion rate"
              value={formatPercent(stats.conversionRate)}
              hint={`${stats.completedOrders} done · ${stats.lostOrders} lost`}
              icon="🎯"
              color="emerald"
            />
          </div>

          {/* Fee breakdown — gross vs pass-through vs net */}
          <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Revenue breakdown</h3>
              <p className="text-xs text-gray-500">From completed orders only</p>
            </div>
            <FeeBreakdown
              gross={stats.totalRevenue}
              passThrough={stats.totalPassThroughFees}
              net={stats.totalNetRevenue}
            />
          </div>

          {/* Secondary metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <SmallStat label="In progress" value={stats.inProgressOrders} />
            <SmallStat label="Completed" value={stats.completedOrders} />
            <SmallStat
              label="Avg. handling"
              value={stats.averageHandlingDays !== null ? `${stats.averageHandlingDays.toFixed(1)} d` : '—'}
            />
            <SmallStat label="Unassigned" value={stats.unassignedOrders} highlight={stats.unassignedOrders > 0} />
          </div>

          {/* Visa vs Legalization split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <OrderTypeCard
              title="🛂 Visa orders"
              count={stats.byOrderType.visa.count}
              revenue={stats.byOrderType.visa.revenue}
              netRevenue={stats.byOrderType.visa.netRevenue}
              total={stats.totalOrders}
            />
            <OrderTypeCard
              title="📋 Legalization orders"
              count={stats.byOrderType.legalization.count}
              revenue={stats.byOrderType.legalization.revenue}
              netRevenue={stats.byOrderType.legalization.netRevenue}
              total={stats.totalOrders}
            />
          </div>

          {/* Monthly charts — orders and revenue shown separately for clarity */}
          {stats.monthlySeries.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders per month</h3>
                <SimpleBarChart
                  data={stats.monthlySeries.map(d => ({ label: d.label, value: d.orders }))}
                  barColor="#0EB0A6"
                  formatValue={v => v.toString()}
                />
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Net revenue per month</h3>
                <p className="text-xs text-gray-500 mb-3">DOX income from completed orders (excludes pass-through fees)</p>
                <SimpleBarChart
                  data={stats.monthlySeries.map(d => ({ label: d.label, value: d.netRevenue }))}
                  barColor="#16a34a"
                  formatValue={v => formatCurrency(v)}
                />
              </div>
            </div>
          )}

          {/* Status breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order status breakdown</h3>
              {stats.byStatus.length === 0 ? (
                <p className="text-sm text-gray-500">No orders in this period</p>
              ) : (
                <BreakdownBars items={stats.byStatus} colorByStatus />
              )}
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoices</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total invoices</span>
                  <span className="font-semibold text-gray-900">{invoiceCount.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Paid</span>
                  <span className="font-semibold text-green-700">{invoiceCount.paid}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Outstanding</span>
                  <span className="font-semibold text-amber-700">{invoiceCount.total - invoiceCount.paid}</span>
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <Link
                    href="/admin/invoices"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View all invoices →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Top countries — split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🛂 Top visa destinations</h3>
              {stats.topVisaDestinations.length === 0 ? (
                <p className="text-sm text-gray-500">No visa orders in this period</p>
              ) : (
                <div className="space-y-2">
                  {stats.topVisaDestinations.map((c, i) => (
                    <CountryRow key={c.code} index={i + 1} country={c} />
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Top legalization countries</h3>
              {stats.topLegalizationCountries.length === 0 ? (
                <p className="text-sm text-gray-500">No legalization orders in this period</p>
              ) : (
                <div className="space-y-2">
                  {stats.topLegalizationCountries.map((c, i) => (
                    <CountryRow key={c.code} index={i + 1} country={c} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Service mix and visa categories */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Legalization service mix</h3>
              {stats.legalizationServiceMix.length === 0 ? (
                <p className="text-sm text-gray-500">No legalization orders</p>
              ) : (
                <BreakdownBars items={stats.legalizationServiceMix} />
              )}
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Visa category mix</h3>
              {stats.visaCategoryMix.length === 0 ? (
                <p className="text-sm text-gray-500">No visa orders</p>
              ) : (
                <BreakdownBars items={stats.visaCategoryMix} />
              )}
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Visa type</h3>
              {stats.visaTypeMix.length === 0 ? (
                <p className="text-sm text-gray-500">No visa orders</p>
              ) : (
                <BreakdownBars items={stats.visaTypeMix} />
              )}
            </div>
          </div>

          {/* Handler workload */}
          <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Handler workload</h3>
            {stats.handlerWorkload.length === 0 ? (
              <p className="text-sm text-gray-500">No assigned orders in this period</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Handler</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net (DOX)</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gross</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {stats.handlerWorkload.map(h => (
                      <tr key={h.uid} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{h.name}</td>
                        <td className="px-4 py-2 text-sm text-right text-amber-700 font-medium">{h.active}</td>
                        <td className="px-4 py-2 text-sm text-right text-green-700 font-medium">{h.completed}</td>
                        <td className="px-4 py-2 text-sm text-right text-green-700 font-mono font-semibold">{formatCurrency(h.netRevenue)}</td>
                        <td className="px-4 py-2 text-sm text-right text-gray-500 font-mono">{formatCurrency(h.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top customers */}
          <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top customers by revenue</h3>
            {stats.topCustomers.length === 0 ? (
              <p className="text-sm text-gray-500">No customer data in this period</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net (DOX)</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gross</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {stats.topCustomers.map(c => (
                      <tr key={c.key} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900 align-top">
                          <div className="font-medium">{c.name}</div>
                          {c.companyName && c.contactCount > 1 && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              {c.contactCount} contact{c.contactCount === 1 ? '' : 's'}
                            </div>
                          )}
                          {c.aliases.length > 0 && (
                            <div
                              className="text-xs text-gray-400 mt-0.5 italic"
                              title={`Also spelled as:\n${c.aliases.join('\n')}`}
                            >
                              +{c.aliases.length} variant{c.aliases.length === 1 ? '' : 's'} merged
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500 align-top">
                          {c.emails.length === 0 ? (
                            <span className="italic text-gray-400">No external email</span>
                          ) : c.emails.length === 1 ? (
                            c.emails[0]
                          ) : (
                            <div>
                              <div>{c.emails[0]}</div>
                              <div className="text-xs text-gray-400">+{c.emails.length - 1} more</div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-right text-gray-700 align-top">{c.orderCount}</td>
                        <td className="px-4 py-2 text-sm text-right text-green-700 font-mono font-semibold align-top">{formatCurrency(c.netRevenue)}</td>
                        <td className="px-4 py-2 text-sm text-right text-gray-500 font-mono align-top">{formatCurrency(c.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent orders */}
          <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent orders</h3>
              <Link href="/admin/orders" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                View all →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {stats.recentOrders.map((order: AnyOrder) => {
                    const isVisa = order.orderType === 'visa';
                    const countryName = isVisa
                      ? order.destinationCountry
                      : (order.country || '').toUpperCase();
                    const statusMeta = getStatusMeta(order.status);
                    const date = order.createdAt?.toDate?.() || new Date(order.createdAt);
                    return (
                      <tr key={order.id || order.orderNumber} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium">
                          <Link
                            href={`/admin/orders/${order.id || order.orderNumber}`}
                            className="text-primary-600 hover:underline"
                          >
                            #{order.orderNumber || order.id}
                          </Link>
                        </td>
                        <td className="px-4 py-2 text-xs">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
                            isVisa ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {isVisa ? '🛂 Visa' : '📋 Legalization'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {order.customerInfo?.firstName} {order.customerInfo?.lastName}
                          {order.customerInfo?.companyName && (
                            <div className="text-xs text-gray-500">{order.customerInfo.companyName}</div>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">{countryName || '—'}</td>
                        <td className="px-4 py-2 text-xs">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full font-medium text-white"
                            style={{ backgroundColor: statusMeta.color }}
                          >
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-right font-mono text-gray-700">
                          {order.totalPrice ? formatCurrency(order.totalPrice) : '—'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {!isNaN(date.getTime()) ? date.toLocaleDateString('sv-SE') : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

// ─── Subcomponents ──────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  growth?: number | null;
  hint?: string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'emerald' | 'orange';
}
function KpiCard({ label, value, growth, hint, icon, color }: KpiCardProps) {
  const colorMap = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    orange: 'bg-orange-100 text-orange-600',
  };
  const growthMeta = growth !== undefined ? formatGrowth(growth) : null;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
          {growthMeta && (
            <p className={`text-xs font-medium mt-1 ${
              growthMeta.positive === null
                ? 'text-gray-400'
                : growthMeta.positive
                  ? 'text-green-600'
                  : 'text-red-600'
            }`}>
              {growthMeta.text} <span className="text-gray-400 font-normal">vs prev</span>
            </p>
          )}
        </div>
        <div className={`p-2 rounded-lg text-xl ${colorMap[color]}`}>{icon}</div>
      </div>
    </div>
  );
}

function SmallStat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`bg-white rounded-lg border p-4 ${
      highlight ? 'border-amber-300 bg-amber-50' : 'border-gray-200'
    }`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-xl font-bold mt-1 ${highlight ? 'text-amber-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

function OrderTypeCard({ title, count, revenue, netRevenue, total }: { title: string; count: number; revenue: number; netRevenue: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <span className="text-sm text-gray-500">{pct.toFixed(0)}% of orders</span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Orders</p>
          <p className="text-2xl font-bold text-gray-900">{count}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Net (DOX)</p>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(netRevenue)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Gross</p>
          <p className="text-2xl font-bold text-gray-500">{formatCurrency(revenue)}</p>
        </div>
      </div>
      <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function FeeBreakdown({ gross, passThrough, net }: { gross: number; passThrough: number; net: number }) {
  const grossPct = gross > 0 ? 100 : 0;
  const passPct = gross > 0 ? (passThrough / gross) * 100 : 0;
  const netPct = gross > 0 ? (net / gross) * 100 : 0;
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Gross invoiced</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(gross)}</p>
          <p className="text-xs text-gray-500 mt-1">What customers paid</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs text-amber-700 uppercase tracking-wide">Pass-through fees</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">−{formatCurrency(passThrough)}</p>
          <p className="text-xs text-amber-600 mt-1">Embassy / UD / chamber etc. — not our income ({passPct.toFixed(0)}%)</p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-xs text-green-700 uppercase tracking-wide">DOX net revenue</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(net)}</p>
          <p className="text-xs text-green-600 mt-1">Our actual income ({netPct.toFixed(0)}% margin)</p>
        </div>
      </div>
      {/* Stacked bar */}
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
        <div
          className="h-full bg-green-500 transition-all"
          style={{ width: `${netPct}%` }}
          title={`Net: ${formatCurrency(net)}`}
        />
        <div
          className="h-full bg-amber-400 transition-all"
          style={{ width: `${passPct}%` }}
          title={`Pass-through: ${formatCurrency(passThrough)}`}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1.5">
        <span><span className="inline-block w-2 h-2 bg-green-500 rounded-sm mr-1" />DOX net</span>
        <span><span className="inline-block w-2 h-2 bg-amber-400 rounded-sm mr-1" />Pass-through</span>
        <span>{formatCurrency(gross)} total ({grossPct.toFixed(0)}%)</span>
      </div>
    </div>
  );
}

function CountryRow({ index, country }: { index: number; country: { code: string; name: string; count: number; revenue: number } }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-sm text-gray-400 font-medium w-6">#{index}</span>
        <CountryFlag code={country.code} size={20} className="rounded-sm shadow-sm" />
        <span className="text-sm text-gray-900 truncate">{country.name}</span>
      </div>
      <div className="flex items-center gap-3 text-sm flex-shrink-0">
        <span className="text-gray-500">{country.count} {country.count === 1 ? 'order' : 'orders'}</span>
        {country.revenue > 0 && (
          <span className="text-gray-700 font-mono text-xs">{formatCurrency(country.revenue)}</span>
        )}
      </div>
    </div>
  );
}

function BreakdownBars({ items, colorByStatus }: { items: Breakdown; colorByStatus?: boolean }) {
  const max = items.reduce((m, i) => Math.max(m, i.count), 0);
  const total = items.reduce((s, i) => s + i.count, 0);
  return (
    <div className="space-y-2.5">
      {items.map(item => {
        const pct = max > 0 ? (item.count / max) * 100 : 0;
        const sharePct = total > 0 ? (item.count / total) * 100 : 0;
        const color = colorByStatus ? getStatusMeta(item.key).color : '#0EB0A6';
        return (
          <div key={item.key}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-700 truncate font-medium">{item.label}</span>
              <span className="text-gray-500 ml-2 flex-shrink-0">
                {item.count} <span className="text-gray-400">({sharePct.toFixed(0)}%)</span>
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface SimpleBarChartProps {
  data: Array<{ label: string; value: number }>;
  barColor: string;
  formatValue: (v: number) => string;
}
function SimpleBarChart({ data, barColor, formatValue }: SimpleBarChartProps) {
  const max = Math.max(1, ...data.map(d => d.value));
  const W = 500;
  const H = 220;
  const PAD = { top: 24, right: 12, bottom: 32, left: 12 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const barWidth = (innerW / data.length) * 0.7;
  const xStep = innerW / data.length;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ minWidth: data.length > 6 ? '500px' : '300px' }}>
        {/* Baseline */}
        <line x1={PAD.left} y1={PAD.top + innerH} x2={W - PAD.right} y2={PAD.top + innerH} stroke="#e5e7eb" strokeWidth="1" />

        {data.map((d, i) => {
          const x = PAD.left + xStep * i + (xStep - barWidth) / 2;
          const barH = d.value > 0 ? Math.max(2, (d.value / max) * innerH) : 0;
          const y = PAD.top + innerH - barH;
          return (
            <g key={d.label + i}>
              <title>{`${d.label}: ${formatValue(d.value)}`}</title>
              {barH > 0 && (
                <rect x={x} y={y} width={barWidth} height={barH} fill={barColor} rx="3" opacity={0.85} />
              )}
              {/* Value label above the bar */}
              {d.value > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#111827"
                  fontWeight="600"
                >
                  {formatValue(d.value)}
                </text>
              )}
              {/* Month label */}
              <text
                x={PAD.left + xStep * i + xStep / 2}
                y={H - 10}
                textAnchor="middle"
                fontSize="11"
                fill="#6b7280"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
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
};

export default AdminStatsPage;
