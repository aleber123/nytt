/**
 * Abandoned Carts / Leads — Admin page
 *
 * Shows partially completed orders (customers who started but didn't submit).
 * Handlers can follow up by email or phone if contact info was captured.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import CountryFlag from '@/components/ui/CountryFlag';
import {
  getAllAbandonedCarts,
  dismissAbandonedCart,
  markStaleCartsAbandoned,
  deleteOldCarts,
  markRecoveryEmailSent,
  type AbandonedCart,
  type AbandonedCartStatus,
} from '@/firebase/abandonedCartService';

type FilterStatus = 'all' | AbandonedCartStatus;
type FilterType = 'all' | 'legalization' | 'visa';

const STATUS_COLORS: Record<AbandonedCartStatus, string> = {
  active: 'bg-green-100 text-green-800',
  abandoned: 'bg-amber-100 text-amber-800',
  converted: 'bg-blue-100 text-blue-800',
  dismissed: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<AbandonedCartStatus, string> = {
  active: 'Active (in progress)',
  abandoned: 'Abandoned',
  converted: 'Converted (order placed)',
  dismissed: 'Dismissed',
};

function AbandonedCartsPage() {
  const { adminUser, currentUser } = useAuth();
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('abandoned');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterHasEmail, setFilterHasEmail] = useState(false);
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);

  const actorName = adminUser?.displayName || currentUser?.email || 'Admin';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Mark stale active carts as abandoned on each load
      const staleCount = await markStaleCartsAbandoned();
      if (staleCount > 0) {
        console.log(`Marked ${staleCount} stale carts as abandoned`);
      }

      const data = await getAllAbandonedCarts();
      setCarts(data);
    } catch (err) {
      console.error('Failed to load abandoned carts', err);
      toast.error('Failed to load abandoned carts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = carts;
    if (filterStatus !== 'all') list = list.filter(c => c.status === filterStatus);
    if (filterType !== 'all') list = list.filter(c => c.orderType === filterType);
    if (filterHasEmail) list = list.filter(c => !!c.email);
    return list;
  }, [carts, filterStatus, filterType, filterHasEmail]);

  const summary = useMemo(() => ({
    total: carts.length,
    active: carts.filter(c => c.status === 'active').length,
    abandoned: carts.filter(c => c.status === 'abandoned').length,
    converted: carts.filter(c => c.status === 'converted').length,
    withEmail: carts.filter(c => !!c.email).length,
  }), [carts]);

  const handleDismiss = async (id: string) => {
    if (!confirm('Dismiss this lead? It will be moved to the dismissed list.')) return;
    try {
      await dismissAbandonedCart(id, actorName);
      toast.success('Lead dismissed');
      await load();
      if (selectedCart?.id === id) setSelectedCart(null);
    } catch {
      toast.error('Failed to dismiss');
    }
  };

  const handleCleanup = async () => {
    if (!confirm('Delete all abandoned carts older than 30 days? This cannot be undone.')) return;
    try {
      const count = await deleteOldCarts();
      toast.success(count > 0 ? `Deleted ${count} old carts` : 'No old carts to delete');
      await load();
    } catch {
      toast.error('Cleanup failed');
    }
  };

  const formatDate = (ts: any): string => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString('sv-SE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStepLabel = (cart: AbandonedCart): string => {
    return `Step ${cart.currentStep}/${cart.totalSteps}`;
  };

  const getProgressPercent = (cart: AbandonedCart): number => {
    return Math.round((cart.currentStep / cart.totalSteps) * 100);
  };

  return (
    <ProtectedRoute requiredPermission="canManageOrders">
      <Head>
        <title>Abandoned Carts / Leads — Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700 mb-1 inline-block">
                &larr; Back to Admin
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Abandoned Carts / Leads</h1>
              <p className="text-gray-600 mt-1">
                Customers who started an order but didn't complete it. Follow up to recover the sale.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCleanup}
                className="text-sm px-3 py-2 border border-gray-300 rounded-md hover:bg-white text-gray-700"
                title="Delete abandoned carts older than 30 days (GDPR)"
              >
                🗑️ Cleanup old
              </button>
              <button
                onClick={load}
                className="text-sm px-3 py-2 border border-gray-300 rounded-md hover:bg-white text-gray-700"
              >
                ↻ Refresh
              </button>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <button
              onClick={() => setFilterStatus('all')}
              className={`text-left bg-white rounded-xl border p-4 transition-all ${filterStatus === 'all' ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-gray-200'}`}
            >
              <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
              <div className="text-xs text-gray-500 mt-1">Total</div>
            </button>
            <button
              onClick={() => setFilterStatus('abandoned')}
              className={`text-left rounded-xl border p-4 transition-all ${filterStatus === 'abandoned' ? 'border-amber-500 ring-2 ring-amber-100 bg-amber-50' : 'bg-white border-amber-100'}`}
            >
              <div className="text-2xl font-bold text-amber-700">{summary.abandoned}</div>
              <div className="text-xs text-gray-500 mt-1">Abandoned</div>
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`text-left rounded-xl border p-4 transition-all ${filterStatus === 'active' ? 'border-green-500 ring-2 ring-green-100 bg-green-50' : 'bg-white border-green-100'}`}
            >
              <div className="text-2xl font-bold text-green-700">{summary.active}</div>
              <div className="text-xs text-gray-500 mt-1">Active now</div>
            </button>
            <button
              onClick={() => setFilterStatus('converted')}
              className={`text-left rounded-xl border p-4 transition-all ${filterStatus === 'converted' ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50' : 'bg-white border-blue-100'}`}
            >
              <div className="text-2xl font-bold text-blue-700">{summary.converted}</div>
              <div className="text-xs text-gray-500 mt-1">Converted</div>
            </button>
            <div className="bg-white rounded-xl border border-purple-100 p-4">
              <div className="text-2xl font-bold text-purple-700">{summary.withEmail}</div>
              <div className="text-xs text-gray-500 mt-1">With email</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All types</option>
              <option value="legalization">Legalization</option>
              <option value="visa">Visa</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filterHasEmail}
                onChange={(e) => setFilterHasEmail(e.target.checked)}
                className="rounded"
              />
              Only with email
            </label>
            <span className="text-sm text-gray-500">{filtered.length} results</span>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-16 text-gray-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-500">
              No abandoned carts match this filter.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Country / Product</th>
                      <th className="px-4 py-3 text-left">Progress</th>
                      <th className="px-4 py-3 text-left">Contact</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map(cart => {
                      const progress = getProgressPercent(cart);
                      return (
                        <tr
                          key={cart.id}
                          className={`hover:bg-gray-50 cursor-pointer ${cart.status === 'dismissed' ? 'opacity-50' : ''}`}
                          onClick={() => setSelectedCart(cart)}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-gray-900">{formatDate(cart.lastActivityAt)}</div>
                            <div className="text-xs text-gray-400">{formatDate(cart.firstSeenAt)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              cart.orderType === 'visa' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {cart.orderType === 'visa' ? '🛂 Visa' : '📜 Legalization'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {cart.country && <CountryFlag code={cart.country} size={18} />}
                              <div>
                                <div className="text-gray-900 text-sm">
                                  {cart.destinationCountry || cart.countryName || cart.country || '—'}
                                </div>
                                {cart.orderType === 'visa' && cart.visaProductName && (
                                  <div className="text-xs text-gray-500">{cart.visaProductName}</div>
                                )}
                                {cart.orderType === 'legalization' && cart.services && cart.services.length > 0 && (
                                  <div className="text-xs text-gray-500">{cart.services.join(', ')}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${progress >= 80 ? 'bg-green-500' : progress >= 50 ? 'bg-amber-500' : 'bg-red-400'}`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">{getStepLabel(cart)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {cart.email ? (
                              <div>
                                <div className="text-gray-900 text-sm">{cart.customerName || '—'}</div>
                                <div className="text-xs text-blue-600">{cart.email}</div>
                                {cart.phone && <div className="text-xs text-gray-500">{cart.phone}</div>}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">No contact info yet</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[cart.status]}`}>
                              {cart.status}
                            </span>
                            {cart.recoveryEmailSentAt && (
                              <div className="text-[10px] text-gray-400 mt-0.5">Recovery sent</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            {cart.status === 'abandoned' && (
                              <button
                                onClick={() => handleDismiss(cart.id)}
                                className="text-xs px-2 py-1 text-gray-600 hover:text-gray-800"
                              >
                                Dismiss
                              </button>
                            )}
                            {cart.convertedOrderId && (
                              <Link
                                href={`/admin/orders/${cart.convertedOrderId}`}
                                className="text-xs px-2 py-1 text-blue-600 hover:text-blue-800 font-medium"
                              >
                                View order →
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      {selectedCart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedCart.orderType === 'visa' ? '🛂 Visa' : '📜 Legalization'} Lead
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Session: {selectedCart.sessionId} · {getStepLabel(selectedCart)} · {STATUS_LABELS[selectedCart.status]}
                </p>
              </div>
              <button onClick={() => setSelectedCart(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Contact info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Contact Information</h4>
                {selectedCart.email ? (
                  <div className="space-y-1 text-sm">
                    {selectedCart.customerName && <div><span className="text-gray-500">Name:</span> <span className="font-medium">{selectedCart.customerName}</span></div>}
                    <div><span className="text-gray-500">Email:</span> <a href={`mailto:${selectedCart.email}`} className="text-blue-600 hover:underline">{selectedCart.email}</a></div>
                    {selectedCart.phone && <div><span className="text-gray-500">Phone:</span> <a href={`tel:${selectedCart.phone}`} className="text-blue-600">{selectedCart.phone}</a></div>}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Customer didn't reach the contact information step yet.</p>
                )}
              </div>

              {/* Order details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Order Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Type:</span> <span className="font-medium">{selectedCart.orderType}</span></div>
                  <div><span className="text-gray-500">Country:</span> <span className="font-medium">{selectedCart.destinationCountry || selectedCart.countryName || selectedCart.country || '—'}</span></div>
                  {selectedCart.visaProductName && (
                    <div className="col-span-2"><span className="text-gray-500">Visa product:</span> <span className="font-medium">{selectedCart.visaProductName}</span></div>
                  )}
                  {selectedCart.services && selectedCart.services.length > 0 && (
                    <div className="col-span-2"><span className="text-gray-500">Services:</span> <span className="font-medium">{selectedCart.services.join(', ')}</span></div>
                  )}
                  <div><span className="text-gray-500">Progress:</span> <span className="font-medium">{getStepLabel(selectedCart)} ({getProgressPercent(selectedCart)}%)</span></div>
                  <div><span className="text-gray-500">Locale:</span> <span className="font-medium">{selectedCart.locale || 'sv'}</span></div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Timeline</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="text-gray-500">First seen:</span> {formatDate(selectedCart.firstSeenAt)}</div>
                  <div><span className="text-gray-500">Last activity:</span> {formatDate(selectedCart.lastActivityAt)}</div>
                  {selectedCart.abandonedAt && <div><span className="text-gray-500">Abandoned:</span> {formatDate(selectedCart.abandonedAt)}</div>}
                  {selectedCart.convertedAt && <div><span className="text-gray-500">Converted:</span> {formatDate(selectedCart.convertedAt)}</div>}
                  {selectedCart.recoveryEmailSentAt && <div><span className="text-gray-500">Recovery email sent:</span> {formatDate(selectedCart.recoveryEmailSentAt)} by {selectedCart.recoveryEmailSentBy}</div>}
                </div>
              </div>

              {/* Raw answers (collapsible) */}
              <details className="bg-gray-50 rounded-lg p-4">
                <summary className="text-sm font-semibold text-gray-900 cursor-pointer">Raw form data (click to expand)</summary>
                <pre className="mt-2 text-xs text-gray-600 overflow-x-auto max-h-[300px] overflow-y-auto bg-white p-3 rounded border">
                  {JSON.stringify(selectedCart.answers, null, 2)}
                </pre>
              </details>
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {selectedCart.status === 'abandoned' && (
                  <button
                    onClick={() => handleDismiss(selectedCart.id)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded text-gray-700 hover:bg-white"
                  >
                    Dismiss
                  </button>
                )}
                {selectedCart.convertedOrderId && (
                  <Link
                    href={`/admin/orders/${selectedCart.convertedOrderId}`}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                  >
                    View order →
                  </Link>
                )}
              </div>
              <button
                onClick={() => setSelectedCart(null)}
                className="px-4 py-1.5 text-sm border border-gray-300 rounded text-gray-700 hover:bg-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}

export default AbandonedCartsPage;

export const getStaticProps: GetStaticProps = async () => {
  const i18nConfig = {
    i18n: { defaultLocale: 'sv', locales: ['sv', 'en'], localeDetection: false as const },
  };
  return {
    props: {
      ...(await serverSideTranslations('en', ['common'], i18nConfig)),
    },
  };
};
