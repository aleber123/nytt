import React, { useState, useEffect, useCallback } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { getRemindersByUser, snoozeReminder, dismissReminder, updateReminder, type OrderReminder } from '@/firebase/reminderService';
import toast from 'react-hot-toast';

interface MyOrder {
  id: string;
  orderNumber?: string;
  status?: string;
  orderType?: string;
  assignedToName?: string;
  customerInfo?: { firstName?: string; lastName?: string; companyName?: string; email?: string };
  country?: string;
  destinationCountry?: string;
  destinationCountryCode?: string;
  services?: string[];
  createdAt?: any;
  updatedAt?: any;
  totalPrice?: number;
  processingSteps?: Array<{ id: string; name: string; status: string }>;
}

type TabId = 'overview' | 'orders' | 'reminders';

function MyTasksPage() {
  const { currentUser } = useAuth();
  const [myOrders, setMyOrders] = useState<MyOrder[]>([]);
  const [myReminders, setMyReminders] = useState<OrderReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [snoozing, setSnoozing] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!currentUser?.uid) { setLoading(false); return; }
    try {
      const { getAllOrders } = await import('@/services/hybridOrderService');
      const allOrders = await getAllOrders();
      const assigned = allOrders
        .filter((o: any) => o.assignedTo === currentUser.uid && o.status !== 'completed' && o.status !== 'cancelled')
        .map((o: any) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          orderType: o.orderType,
          assignedToName: o.assignedToName,
          customerInfo: o.customerInfo,
          country: o.country,
          destinationCountry: o.destinationCountry,
          destinationCountryCode: o.destinationCountryCode,
          services: o.services,
          createdAt: o.createdAt,
          updatedAt: o.updatedAt,
          totalPrice: o.totalPrice,
          processingSteps: o.processingSteps,
        }));
      setMyOrders(assigned);

      const reminders = await getRemindersByUser(currentUser.uid);
      // Auto-reactivate snoozed reminders whose snooze period has passed
      const now = new Date();
      const reactivatePromises: Promise<void>[] = [];
      for (const r of reminders) {
        if (r.status === 'snoozed' && r.snoozedUntil) {
          const snoozedUntil = (r.snoozedUntil as any)?.toDate
            ? (r.snoozedUntil as any).toDate()
            : new Date(r.snoozedUntil as string);
          if (snoozedUntil <= now && r.id) {
            r.status = 'active';
            const { updateDoc, doc } = await import('firebase/firestore');
            const { db } = await import('@/firebase/config');
            reactivatePromises.push(
              updateDoc(doc(db!, 'reminders', r.id), { status: 'active', snoozedUntil: null })
            );
          }
        }
      }
      if (reactivatePromises.length > 0) {
        await Promise.all(reactivatePromises).catch(() => {});
      }
      setMyReminders(reminders as OrderReminder[]);
    } catch (e) {
      console.error('Failed to load tasks:', e);
    }
    setLoading(false);
  }, [currentUser?.uid]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSnooze = async (reminderId: string, hours: number) => {
    setSnoozing(reminderId);
    try {
      const snoozeUntil = new Date(Date.now() + hours * 60 * 60 * 1000);
      await snoozeReminder(reminderId, snoozeUntil);
      setMyReminders(prev => prev.map(r => r.id === reminderId ? { ...r, status: 'snoozed' as const, dueDate: snoozeUntil.toISOString() } : r));
      toast.success(`Snoozed for ${hours}h`);
    } catch {
      toast.error('Failed to snooze');
    }
    setSnoozing(null);
  };

  const handleSnoozeUntil = async (reminderId: string, until: Date) => {
    setSnoozing(reminderId);
    try {
      await snoozeReminder(reminderId, until);
      setMyReminders(prev => prev.map(r => r.id === reminderId ? { ...r, status: 'snoozed' as const, dueDate: until.toISOString() } : r));
      toast.success(`Snoozed until ${until.toLocaleDateString('sv-SE')} ${until.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}`);
    } catch {
      toast.error('Failed to snooze');
    }
    setSnoozing(null);
  };

  const handleDismiss = async (reminderId: string) => {
    try {
      await dismissReminder(reminderId);
      setMyReminders(prev => prev.filter(r => r.id !== reminderId));
      toast.success('Reminder dismissed');
    } catch {
      toast.error('Failed to dismiss');
    }
  };

  const handleUpdate = async (reminderId: string, updates: { message?: string; dueDate?: string }) => {
    try {
      await updateReminder(reminderId, updates);
      setMyReminders(prev => prev.map(r => {
        if (r.id !== reminderId) return r;
        const updated = { ...r };
        if (updates.message !== undefined) updated.message = updates.message;
        if (updates.dueDate !== undefined) {
          updated.dueDate = updates.dueDate;
          updated.status = 'active' as const;
        }
        return updated;
      }));
      toast.success('Reminder updated');
    } catch {
      toast.error('Failed to update');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '—';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' });
  };

  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return '—';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return `${date.toLocaleDateString('sv-SE')} ${date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'received': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-indigo-100 text-indigo-800';
      case 'submitted': return 'bg-purple-100 text-purple-800';
      case 'action-required': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getServiceName = (serviceId: string) => {
    const names: Record<string, string> = {
      apostille: 'Apostille', notarisering: 'Notarization', notarization: 'Notarization',
      ambassad: 'Embassy', embassy: 'Embassy', oversattning: 'Translation', translation: 'Translation',
      utrikesdepartementet: 'UD', ud: 'UD', chamber: 'Chamber',
    };
    return names[serviceId] || serviceId.charAt(0).toUpperCase() + serviceId.slice(1);
  };

  const activeReminders = myReminders.filter(r => r.status === 'active');
  const snoozedReminders = myReminders.filter(r => r.status === 'snoozed');
  const overdueReminders = activeReminders.filter(r => {
    const due = r.dueDate && typeof r.dueDate === 'object' && 'toDate' in r.dueDate ? (r.dueDate as any).toDate() : new Date(r.dueDate as string);
    return due < new Date();
  });

  const nextStep = (order: MyOrder) => {
    if (!order.processingSteps) return null;
    return order.processingSteps.find(s => s.status === 'in_progress') || order.processingSteps.find(s => s.status === 'pending');
  };

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'orders', label: 'My Orders', count: myOrders.length },
    { id: 'reminders', label: 'Reminders', count: myReminders.length },
  ];

  return (
    <ProtectedRoute>
      <Head>
        <title>My Tasks - Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <svg className="h-7 w-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                My Tasks
              </h1>
              <p className="text-sm text-gray-500 mt-1">Your assigned orders and reminders</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/orders" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                ← All Orders
              </Link>
              <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                Dashboard
              </Link>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-blue-100 p-4">
              <div className="text-2xl font-bold text-blue-700">{myOrders.length}</div>
              <div className="text-xs text-gray-500 mt-1">Assigned Orders</div>
            </div>
            <div className="bg-white rounded-xl border border-amber-100 p-4">
              <div className="text-2xl font-bold text-amber-700">{activeReminders.length}</div>
              <div className="text-xs text-gray-500 mt-1">Active Reminders</div>
            </div>
            <div className={`bg-white rounded-xl border p-4 ${overdueReminders.length > 0 ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
              <div className={`text-2xl font-bold ${overdueReminders.length > 0 ? 'text-red-700' : 'text-gray-400'}`}>{overdueReminders.length}</div>
              <div className="text-xs text-gray-500 mt-1">Overdue</div>
            </div>
            <div className="bg-white rounded-xl border border-purple-100 p-4">
              <div className="text-2xl font-bold text-purple-700">{snoozedReminders.length}</div>
              <div className="text-xs text-gray-500 mt-1">Snoozed</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex gap-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-400">Loading your tasks...</div>
          ) : (
            <>
              {/* ─── OVERVIEW TAB ─── */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Overdue Reminders (urgent) */}
                  {overdueReminders.length > 0 && (
                    <div>
                      <h2 className="text-sm font-semibold text-red-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        Overdue ({overdueReminders.length})
                      </h2>
                      <div className="space-y-2">
                        {overdueReminders.map(r => (
                          <ReminderCard key={r.id} reminder={r} onSnooze={handleSnooze} onSnoozeUntil={handleSnoozeUntil} onDismiss={handleDismiss} onUpdate={handleUpdate} snoozing={snoozing} formatDateTime={formatDateTime} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Reminders (today/upcoming) */}
                  {activeReminders.filter(r => !overdueReminders.includes(r)).length > 0 && (
                    <div>
                      <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-3">
                        Upcoming Reminders ({activeReminders.length - overdueReminders.length})
                      </h2>
                      <div className="space-y-2">
                        {activeReminders.filter(r => !overdueReminders.includes(r)).map(r => (
                          <ReminderCard key={r.id} reminder={r} onSnooze={handleSnooze} onSnoozeUntil={handleSnoozeUntil} onDismiss={handleDismiss} onUpdate={handleUpdate} snoozing={snoozing} formatDateTime={formatDateTime} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assigned Orders */}
                  {myOrders.length > 0 && (
                    <div>
                      <h2 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-3">
                        Assigned Orders ({myOrders.length})
                      </h2>
                      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                        <table className="w-full text-sm table-auto">
                          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                            <tr>
                              <th className="px-3 py-3 text-left whitespace-nowrap">Order</th>
                              <th className="px-3 py-3 text-left">Customer</th>
                              <th className="px-3 py-3 text-left">Type</th>
                              <th className="px-3 py-3 text-left whitespace-nowrap">Status</th>
                              <th className="px-3 py-3 text-left">Next Step</th>
                              <th className="px-3 py-3 text-left whitespace-nowrap">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {myOrders.slice(0, 10).map(o => {
                              const step = nextStep(o);
                              return (
                                <tr key={o.id} className="hover:bg-blue-50 transition-colors cursor-pointer" onClick={() => window.location.href = `/admin/orders/${o.id}`}>
                                  <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap">{o.orderNumber || o.id?.slice(0, 8)}</td>
                                  <td className="px-3 py-3 text-gray-600">
                                    <div className="text-gray-900 truncate max-w-[200px]" title={`${o.customerInfo?.firstName || ''} ${o.customerInfo?.lastName || ''}`.trim()}>
                                      {o.customerInfo?.firstName} {o.customerInfo?.lastName}
                                    </div>
                                    {o.customerInfo?.companyName && (
                                      <div className="text-xs text-gray-400 truncate max-w-[200px]" title={o.customerInfo.companyName}>
                                        {o.customerInfo.companyName}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-3 py-3">
                                    {o.orderType === 'visa' ? (
                                      <span className="text-emerald-700 font-medium truncate block max-w-[140px]" title={o.destinationCountry || o.destinationCountryCode || 'Visa'}>
                                        {o.destinationCountry || o.destinationCountryCode || 'Visa'}
                                      </span>
                                    ) : (
                                      <span className="text-gray-600 truncate block max-w-[180px]" title={Array.isArray(o.services) ? o.services.map(getServiceName).join(', ') : o.country || '—'}>
                                        {Array.isArray(o.services) ? o.services.map(getServiceName).join(', ') : o.country || '—'}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-3 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(o.status)}`}>
                                      {o.status}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 text-gray-500 text-xs">
                                    <span className="truncate block max-w-[180px]" title={step?.name || '—'}>{step?.name || '—'}</span>
                                  </td>
                                  <td className="px-3 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(o.createdAt)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        </div>
                        {myOrders.length > 10 && (
                          <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 text-center">
                            Showing 10 of {myOrders.length} — <button onClick={() => setActiveTab('orders')} className="text-primary-600 hover:underline">View all</button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {myOrders.length === 0 && myReminders.length === 0 && (
                    <div className="text-center py-20">
                      <div className="text-5xl mb-4">✅</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">All clear!</h3>
                      <p className="text-gray-500">No orders assigned and no active reminders.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ─── ORDERS TAB ─── */}
              {activeTab === 'orders' && (
                <div>
                  {myOrders.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">No orders assigned to you</div>
                  ) : (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                      <table className="w-full text-sm table-auto">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                          <tr>
                            <th className="px-3 py-3 text-left whitespace-nowrap">Order</th>
                            <th className="px-3 py-3 text-left">Customer</th>
                            <th className="px-3 py-3 text-left">Type / Services</th>
                            <th className="px-3 py-3 text-left whitespace-nowrap">Status</th>
                            <th className="px-3 py-3 text-left">Next Step</th>
                            <th className="px-3 py-3 text-left whitespace-nowrap">Created</th>
                            <th className="px-3 py-3 text-right whitespace-nowrap">Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {myOrders.map(o => {
                            const step = nextStep(o);
                            return (
                              <tr key={o.id} className="hover:bg-blue-50 transition-colors cursor-pointer" onClick={() => window.location.href = `/admin/orders/${o.id}`}>
                                <td className="px-4 py-3 font-medium text-gray-900">{o.orderNumber || o.id?.slice(0, 8)}</td>
                                <td className="px-4 py-3">
                                  <div className="text-gray-900">{o.customerInfo?.firstName} {o.customerInfo?.lastName}</div>
                                  {o.customerInfo?.companyName && <div className="text-xs text-gray-400">{o.customerInfo.companyName}</div>}
                                </td>
                                <td className="px-4 py-3">
                                  {o.orderType === 'visa' ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800">
                                      Visa · {o.destinationCountry || o.destinationCountryCode || '—'}
                                    </span>
                                  ) : (
                                    <div className="flex flex-wrap gap-1">
                                      {Array.isArray(o.services) ? o.services.slice(0, 3).map(s => (
                                        <span key={s} className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-indigo-100 text-indigo-800">
                                          {getServiceName(s)}
                                        </span>
                                      )) : <span className="text-gray-400">—</span>}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(o.status)}`}>
                                    {o.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-gray-500 text-xs max-w-[160px] truncate">{step?.name || '—'}</td>
                                <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(o.createdAt)}</td>
                                <td className="px-4 py-3 text-right text-gray-700 font-medium text-xs">
                                  {o.totalPrice ? `${o.totalPrice.toLocaleString('sv-SE')} kr` : '—'}
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
              )}

              {/* ─── REMINDERS TAB ─── */}
              {activeTab === 'reminders' && (
                <div className="space-y-6">
                  {myReminders.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">No reminders</div>
                  ) : (
                    <>
                      {overdueReminders.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-red-700 uppercase tracking-wide mb-3">Overdue ({overdueReminders.length})</h3>
                          <div className="space-y-2">
                            {overdueReminders.map(r => (
                              <ReminderCard key={r.id} reminder={r} onSnooze={handleSnooze} onSnoozeUntil={handleSnoozeUntil} onDismiss={handleDismiss} onUpdate={handleUpdate} snoozing={snoozing} formatDateTime={formatDateTime} />
                            ))}
                          </div>
                        </div>
                      )}
                      {activeReminders.filter(r => !overdueReminders.includes(r)).length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-3">Upcoming ({activeReminders.length - overdueReminders.length})</h3>
                          <div className="space-y-2">
                            {activeReminders.filter(r => !overdueReminders.includes(r)).map(r => (
                              <ReminderCard key={r.id} reminder={r} onSnooze={handleSnooze} onSnoozeUntil={handleSnoozeUntil} onDismiss={handleDismiss} onUpdate={handleUpdate} snoozing={snoozing} formatDateTime={formatDateTime} />
                            ))}
                          </div>
                        </div>
                      )}
                      {snoozedReminders.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-purple-700 uppercase tracking-wide mb-3">Snoozed ({snoozedReminders.length})</h3>
                          <div className="space-y-2">
                            {snoozedReminders.map(r => (
                              <ReminderCard key={r.id} reminder={r} onSnooze={handleSnooze} onSnoozeUntil={handleSnoozeUntil} onDismiss={handleDismiss} onUpdate={handleUpdate} snoozing={snoozing} formatDateTime={formatDateTime} />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

// ─── Snooze helpers ───
function getNextMorning(hour = 9): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, 0, 0, 0);
  return d;
}
function getNextMonday(hour = 9): Date {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  const daysUntilMonday = day === 0 ? 1 : (8 - day);
  d.setDate(d.getDate() + daysUntilMonday);
  d.setHours(hour, 0, 0, 0);
  return d;
}

// ─── Reminder Card Component ───
function ReminderCard({
  reminder: r,
  onSnooze,
  onSnoozeUntil,
  onDismiss,
  onUpdate,
  snoozing,
  formatDateTime,
}: {
  reminder: OrderReminder;
  onSnooze: (id: string, hours: number) => void;
  onSnoozeUntil: (id: string, until: Date) => void;
  onDismiss: (id: string) => void;
  onUpdate: (id: string, updates: { message?: string; dueDate?: string }) => void;
  snoozing: string | null;
  formatDateTime: (ts: any) => string;
}) {
  const [showSnoozeMenu, setShowSnoozeMenu] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [editMsg, setEditMsg] = React.useState(r.message);
  const [editDate, setEditDate] = React.useState('');
  const menuRef = React.useRef<HTMLDivElement>(null);

  const due = r.dueDate && typeof r.dueDate === 'object' && 'toDate' in r.dueDate ? (r.dueDate as any).toDate() : new Date(r.dueDate as string);
  const isOverdue = due < new Date();

  // Close menu on outside click
  React.useEffect(() => {
    if (!showSnoozeMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowSnoozeMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSnoozeMenu]);

  const openEdit = () => {
    setEditMsg(r.message);
    const d = r.dueDate && typeof r.dueDate === 'object' && 'toDate' in r.dueDate ? (r.dueDate as any).toDate() : new Date(r.dueDate as string);
    setEditDate(d.toISOString().slice(0, 16));
    setEditing(true);
  };

  const saveEdit = () => {
    const updates: { message?: string; dueDate?: string } = {};
    if (editMsg.trim() && editMsg !== r.message) updates.message = editMsg.trim();
    if (editDate) updates.dueDate = new Date(editDate).toISOString();
    if (Object.keys(updates).length > 0) onUpdate(r.id!, updates);
    setEditing(false);
  };

  const nextMon = getNextMonday();
  const monLabel = `Mon ${nextMon.getDate()}/${nextMon.getMonth() + 1}`;

  return (
    <div className={`px-4 py-3 rounded-xl border transition-colors ${
      isOverdue ? 'bg-red-50 border-red-200' : r.status === 'snoozed' ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <Link href={r.entityType === 'crm_lead' && r.entityId ? `/admin/crm?lead=${r.entityId}` : `/admin/orders/${r.entityId || r.orderId || ''}`} className="flex-1 min-w-0 hover:opacity-80">
          <p className={`text-sm font-medium ${isOverdue ? 'text-red-800' : 'text-gray-900'}`}>
            {r.entityType === 'crm_lead' ? '👤 ' : '📋 '}{r.message}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span className="font-medium">{r.entityLabel || r.orderNumber || (r.orderId ? r.orderId.slice(0, 8) : (r.entityId ? r.entityId.slice(0, 8) : ''))}</span>
            <span>·</span>
            <span>Due: {formatDateTime(r.dueDate)}</span>
            {isOverdue && <span className="text-red-600 font-semibold">OVERDUE</span>}
            {r.status === 'snoozed' && <span className="text-purple-600 font-medium">SNOOZED</span>}
          </div>
        </Link>
        <div className="flex items-center gap-1 flex-shrink-0">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowSnoozeMenu(!showSnoozeMenu)}
              disabled={snoozing === r.id}
              className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
              title="Snooze"
            >
              💤
            </button>
            {showSnoozeMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20">
                <button onClick={() => { onSnooze(r.id!, 1); setShowSnoozeMenu(false); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 text-gray-700">⏰ 1 hour</button>
                <button onClick={() => { onSnooze(r.id!, 4); setShowSnoozeMenu(false); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 text-gray-700">⏰ 4 hours</button>
                <button onClick={() => { onSnoozeUntil(r.id!, getNextMorning()); setShowSnoozeMenu(false); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 text-gray-700">🌅 Tomorrow 09:00</button>
                <button onClick={() => { onSnoozeUntil(r.id!, getNextMonday()); setShowSnoozeMenu(false); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 text-gray-700">📅 {monLabel} 09:00</button>
              </div>
            )}
          </div>
          <button
            onClick={openEdit}
            className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700"
            title="Edit reminder"
          >
            ✏️
          </button>
          <button
            onClick={() => onDismiss(r.id!)}
            className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>

      {editing && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Message</label>
            <input
              type="text"
              value={editMsg}
              onChange={e => setEditMsg(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Due date</label>
            <input
              type="datetime-local"
              value={editDate}
              onChange={e => setEditDate(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditing(false)} className="px-3 py-1 text-xs rounded bg-gray-100 text-gray-600 hover:bg-gray-200">Cancel</button>
            <button onClick={saveEdit} className="px-3 py-1 text-xs rounded bg-primary-600 text-white hover:bg-primary-700">Save</button>
          </div>
        </div>
      )}
    </div>
  );
}

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

export default MyTasksPage;
