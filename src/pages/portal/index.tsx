import { useState, useEffect, useMemo } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { PortalCustomer } from '@/firebase/portalCustomerService';
import { toast, Toaster } from 'react-hot-toast';
import PortalNewOrderModal from '@/components/portal/PortalNewOrderModal';
import { ALL_COUNTRIES } from '@/components/order/data/countries';

// ---------- types ----------

interface PortalOrder {
  id: string;
  orderNumber?: string;
  orderType?: 'visa' | string;
  status: string;
  services?: string[];
  documentType?: string;
  country?: string;
  destinationCountry?: string;
  visaProduct?: { name?: string; category?: string; visaType?: string };
  travelers?: { firstName: string; lastName: string }[];
  travelerCount?: number;
  customerInfo?: { firstName?: string; lastName?: string; companyName?: string; email?: string };
  pickupService?: boolean;
  pickupTrackingNumber?: string;
  returnTrackingNumber?: string;
  returnTrackingUrl?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  additionalNotes?: string;
  quantity?: number;
}

// ---------- helpers ----------

const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  'pending':                { label: 'Received',             color: 'bg-blue-100 text-blue-800',    icon: '📥' },
  'received':               { label: 'Received',             color: 'bg-blue-100 text-blue-800',    icon: '📥' },
  'waiting-for-documents':  { label: 'Awaiting documents',   color: 'bg-yellow-100 text-yellow-800', icon: '📄' },
  'documents-required':     { label: 'Documents required',   color: 'bg-yellow-100 text-yellow-800', icon: '📄' },
  'processing':             { label: 'Processing',           color: 'bg-purple-100 text-purple-800', icon: '⚙️' },
  'submitted':              { label: 'Submitted',            color: 'bg-indigo-100 text-indigo-800', icon: '📤' },
  'submitted-to-embassy':   { label: 'At embassy',           color: 'bg-indigo-100 text-indigo-800', icon: '🏛️' },
  'approved':               { label: 'Approved',             color: 'bg-green-100 text-green-800',  icon: '✅' },
  'action-required':        { label: 'Action required',      color: 'bg-red-100 text-red-800',      icon: '⚠️' },
  'ready-for-return':       { label: 'Ready for return',     color: 'bg-teal-100 text-teal-800',    icon: '📦' },
  'completed':              { label: 'Completed',            color: 'bg-green-100 text-green-800',  icon: '✅' },
  'rejected':               { label: 'Rejected',             color: 'bg-red-100 text-red-800',      icon: '❌' },
  'cancelled':              { label: 'Cancelled',            color: 'bg-gray-100 text-gray-800',    icon: '🚫' },
};

function statusInfo(status: string) {
  return STATUS_MAP[status] || { label: status, color: 'bg-gray-100 text-gray-600', icon: '❓' };
}

function formatDate(ts: any): string {
  if (!ts) return '–';
  const d = new Date(ts);
  return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
}

const SERVICE_NAME_MAP: Record<string, string> = {
  apostille: 'Apostille',
  notarization: 'Notarization',
  notarisering: 'Notarization',
  notarius: 'Notarization',
  embassy: 'Embassy Legalization',
  ambassad: 'Embassy Legalization',
  ambassadlegalisering: 'Embassy Legalization',
  ud: 'Ministry of Foreign Affairs',
  utrikesdepartementet: 'Ministry of Foreign Affairs',
  translation: 'Translation',
  oversattning: 'Translation',
  chamber: 'Chamber of Commerce',
  handelskammaren: 'Chamber of Commerce',
};

function translateServiceName(id: string): string {
  return SERVICE_NAME_MAP[id.toLowerCase()] || id.charAt(0).toUpperCase() + id.slice(1);
}

function resolveCountryName(codeOrName: string): string {
  if (!codeOrName) return '';
  const upper = codeOrName.toUpperCase();
  const lower = codeOrName.toLowerCase();
  const match = ALL_COUNTRIES.find(c =>
    c.code === upper ||
    c.name.toLowerCase() === lower ||
    (c.nameEn && c.nameEn.toLowerCase() === lower)
  );
  if (match) return match.nameEn || match.name;
  return codeOrName;
}

function translateVisaProductName(name: string): string {
  return name
    .replace(/Affärsvisum/gi, 'Business Visa')
    .replace(/Turistvisum/gi, 'Tourist Visa')
    .replace(/Transitvisum/gi, 'Transit Visa')
    .replace(/Studentvisum/gi, 'Student Visa')
    .replace(/Arbetsvisum/gi, 'Work Visa')
    .replace(/Journalistvisum/gi, 'Journalist Visa')
    .replace(/Besöksvisum/gi, 'Visitor Visa')
    .replace(/Visum/gi, 'Visa')
    .replace(/(\d+)\s*år/gi, '$1 year(s)')
    .replace(/dagar/gi, 'days')
    .replace(/Saudiarabien/gi, 'Saudi Arabia')
    .replace(/Förenade Arabemiraten/gi, 'United Arab Emirates')
    .replace(/Kina/gi, 'China')
    .replace(/Indien/gi, 'India')
    .replace(/Ryssland/gi, 'Russia')
    .replace(/Egypten/gi, 'Egypt')
    .replace(/Turkiet/gi, 'Turkey')
    .replace(/Vietnam/gi, 'Vietnam');
}

function orderTitle(o: PortalOrder): string {
  if (o.orderType === 'visa') {
    const rawDest = o.destinationCountry || o.country || '';
    const dest = resolveCountryName(rawDest);
    const rawProduct = o.visaProduct?.name || 'Visa';
    const product = translateVisaProductName(rawProduct);
    return `${product}${dest ? ` – ${dest}` : ''}`;
  }
  const services = o.services?.map(translateServiceName).join(', ') || o.documentType || 'Legalization';
  const rawCountry = o.country || '';
  const country = resolveCountryName(rawCountry);
  return `${services}${country ? ` – ${country}` : ''}`;
}

function travelerNames(o: PortalOrder): string {
  if (o.travelers && o.travelers.length > 0) {
    return o.travelers.map(t => `${t.firstName} ${t.lastName}`).join(', ');
  }
  if (o.customerInfo) {
    return `${o.customerInfo.firstName || ''} ${o.customerInfo.lastName || ''}`.trim();
  }
  return '–';
}

// ---------- component ----------

export default function PortalDashboard() {
  const router = useRouter();

  // Auth state
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [portalCustomer, setPortalCustomer] = useState<PortalCustomer | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Orders
  const [orders, setOrders] = useState<PortalOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // UI
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [search, setSearch] = useState('');
  const [showNewOrder, setShowNewOrder] = useState(false);

  // ---- Auth listener ----
  useEffect(() => {
    if (!auth) { setAuthLoading(false); return; }
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const token = await user.getIdToken();
          const resp = await fetch('/api/portal/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
          const data = await resp.json();
          if (resp.ok && data.customer) {
            setPortalCustomer(data.customer as PortalCustomer);
            setAuthError(null);
          } else {
            setPortalCustomer(null);
            setAuthError(data.error || 'Your account does not have access to the customer portal.');
          }
        } catch {
          setPortalCustomer(null);
          setAuthError('Could not verify your account. Please try again.');
        }
      } else {
        setPortalCustomer(null);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.replace('/portal/login');
    }
  }, [authLoading, firebaseUser, router]);

  // ---- Fetch orders via API ----
  const fetchOrders = async () => {
    if (!firebaseUser) return;
    try {
      const token = await firebaseUser.getIdToken();
      const resp = await fetch('/api/portal/orders', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        setOrders(data.orders || []);
      }
    } catch {
      // Silently fail – will retry on next poll
    }
    setOrdersLoading(false);
  };

  useEffect(() => {
    if (!portalCustomer || !firebaseUser) { setOrdersLoading(false); return; }
    fetchOrders();
    // Poll every 30 seconds for updates
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [portalCustomer, firebaseUser]);

  // ---- Filtered orders ----
  const filteredOrders = useMemo(() => {
    let list = orders;
    if (filter === 'active') {
      list = list.filter(o => !['completed', 'cancelled', 'rejected'].includes(o.status));
    } else if (filter === 'completed') {
      list = list.filter(o => ['completed', 'cancelled', 'rejected'].includes(o.status));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        (o.orderNumber || '').toLowerCase().includes(q) ||
        orderTitle(o).toLowerCase().includes(q) ||
        travelerNames(o).toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, filter, search]);

  // ---- Stats ----
  const activeCount = orders.filter(o => !['completed', 'cancelled', 'rejected'].includes(o.status)).length;
  const completedCount = orders.filter(o => o.status === 'completed').length;
  const actionCount = orders.filter(o => ['action-required', 'waiting-for-documents', 'documents-required'].includes(o.status)).length;

  // ---- Sign out ----
  const handleSignOut = async () => {
    if (auth) await firebaseSignOut(auth);
    router.push('/portal/login');
  };

  // ---- Loading / error states ----
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-custom-button mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{authError}</p>
          <button onClick={handleSignOut} className="text-custom-button hover:underline text-sm">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (!portalCustomer) return null;

  return (
    <>
      <Head>
        <title>Customer Portal – {portalCustomer.companyName} | DOX</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">{portalCustomer.companyName}</p>
                  <p className="text-xs text-gray-500">{portalCustomer.displayName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowNewOrder(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-custom-button text-white text-sm font-medium rounded-lg hover:bg-custom-button/90 transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  <span className="hidden sm:inline">New order</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100">
              <p className="text-xs sm:text-sm text-gray-500 mb-1">Active cases</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{activeCount}</p>
            </div>
            <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100">
              <p className="text-xs sm:text-sm text-gray-500 mb-1">Completed</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">{completedCount}</p>
            </div>
            <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100">
              <p className="text-xs sm:text-sm text-gray-500 mb-1">Action required</p>
              <p className="text-2xl sm:text-3xl font-bold text-amber-600">{actionCount}</p>
            </div>
          </div>

          {/* Search & filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                placeholder="Search order number, service or traveler..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-custom-button/30 focus:border-custom-button"
              />
            </div>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {(['all', 'active', 'completed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-custom-button text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Completed'}
                </button>
              ))}
            </div>
          </div>

          {/* Orders list */}
          {ordersLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-custom-button mb-4"></div>
              <p className="text-gray-500">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="text-5xl mb-4">📭</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {orders.length === 0 ? 'No orders yet' : 'No matching orders'}
              </h3>
              <p className="text-gray-500 mb-6 text-sm">
                {orders.length === 0
                  ? 'Click "New order" to get started.'
                  : 'Try changing your search or filter.'}
              </p>
              {orders.length === 0 && (
                <button
                  onClick={() => setShowNewOrder(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-custom-button text-white text-sm font-medium rounded-lg hover:bg-custom-button/90 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  New order
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const si = statusInfo(order.status);
                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 sm:p-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${si.color}`}>
                            {si.icon} {si.label}
                          </span>
                          {order.orderType === 'visa' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                              Visa
                            </span>
                          )}
                          {order.orderType !== 'visa' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                              Legalization
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                          {orderTitle(order)}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                          {travelerNames(order)}
                          {(order.travelerCount || order.quantity) && (order.travelerCount || order.quantity || 0) > 1
                            ? ` (${order.travelerCount || order.quantity} pcs)`
                            : ''}
                        </p>
                      </div>

                      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-1 text-right">
                        <span className="text-xs font-mono font-bold text-gray-500">
                          {order.orderNumber || order.id}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Tracking info */}
                    {(order.pickupTrackingNumber || order.returnTrackingNumber) && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-3 text-xs">
                        {order.pickupTrackingNumber && (
                          <span className="inline-flex items-center gap-1 text-gray-500">
                            📦 Pickup: <span className="font-mono font-medium text-gray-700">{order.pickupTrackingNumber}</span>
                          </span>
                        )}
                        {order.returnTrackingNumber && (
                          <a
                            href={order.returnTrackingUrl || `https://www.dhl.com/se-sv/home/tracking/tracking-express.html?submit=1&tracking-id=${order.returnTrackingNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-custom-button hover:underline"
                          >
                            📬 Return: <span className="font-mono font-medium">{order.returnTrackingNumber}</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* New order modal */}
      {showNewOrder && (
        <PortalNewOrderModal
          portalCustomer={portalCustomer}
          firebaseUser={firebaseUser!}
          onClose={() => setShowNewOrder(false)}
          onOrderCreated={(orderId) => {
            setShowNewOrder(false);
            toast.success(`Order submitted! Order number: ${orderId}`);
            fetchOrders();
          }}
        />
      )}
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'sv', ['common'])),
  },
});
