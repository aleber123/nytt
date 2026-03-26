/**
 * GDPR Admin Page
 * Manage data retention, anonymization, and customer data requests
 */

import { useState, useEffect } from 'react';
import type { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { adminFetch } from '@/lib/adminFetch';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

interface GdprStats {
  ordersToAnonymize: number;
  ordersWithFilesToDelete: number;
  totalOrders: number;
  oldestOrderDate: string | null;
  contactMessagesToDelete: number;
  customerEmailsToDelete: number;
}

interface OrderPreview {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
}

interface GdprPreview {
  toAnonymize: OrderPreview[];
  toDeleteFiles: OrderPreview[];
}

interface AuditEntry {
  id: string;
  action: string;
  performedBy: string;
  performedAt: string;
  targetType: string;
  targetId?: string;
  targetEmail?: string;
  details: Record<string, any>;
}

function GdprAdminPageContent() {
  const { currentUser } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<GdprStats | null>(null);
  const [preview, setPreview] = useState<GdprPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Customer data request
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerData, setCustomerData] = useState<any>(null);
  const [customerLoading, setCustomerLoading] = useState(false);

  // Audit log
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);

  // GDPR requests tracking
  const [requests, setRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [newRequestEmail, setNewRequestEmail] = useState('');
  const [newRequestType, setNewRequestType] = useState('access');
  const [newRequestNotes, setNewRequestNotes] = useState('');

  // Settings
  const [anonymizeYears, setAnonymizeYears] = useState(7);
  const [deleteFilesDays, setDeleteFilesDays] = useState(90);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && currentUser) {
      loadStats();
    }
  }, [mounted, currentUser]);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, previewRes] = await Promise.all([
        adminFetch('/api/admin/gdpr?action=stats'),
        adminFetch('/api/admin/gdpr?action=preview')
      ]);

      if (!statsRes.ok || !previewRes.ok) {
        throw new Error('Failed to load GDPR data');
      }

      setStats(await statsRes.json());
      setPreview(await previewRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLog = async () => {
    setAuditLoading(true);
    try {
      const res = await adminFetch('/api/admin/gdpr?action=audit-log&limit=50');
      if (res.ok) {
        const data = await res.json();
        setAuditLog(data.entries || []);
      }
    } catch (err) {
      console.error('Failed to load audit log', err);
    } finally {
      setAuditLoading(false);
    }
  };

  const toggleAuditLog = () => {
    const next = !showAuditLog;
    setShowAuditLog(next);
    if (next && auditLog.length === 0) {
      loadAuditLog();
    }
  };

  const loadRequests = async () => {
    setRequestsLoading(true);
    try {
      const res = await adminFetch('/api/admin/gdpr?action=requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Failed to load requests', err);
    } finally {
      setRequestsLoading(false);
    }
  };

  const toggleRequests = () => {
    const next = !showRequests;
    setShowRequests(next);
    if (next && requests.length === 0) {
      loadRequests();
    }
  };

  const createRequest = async () => {
    if (!newRequestEmail) return;
    try {
      const res = await adminFetch('/api/admin/gdpr?action=create-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newRequestEmail, type: newRequestType, notes: newRequestNotes }),
      });
      if (res.ok) {
        setNewRequestEmail('');
        setNewRequestNotes('');
        await loadRequests();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const updateRequestStatus = async (requestId: string, status: string) => {
    try {
      const res = await adminFetch('/api/admin/gdpr?action=update-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status }),
      });
      if (res.ok) {
        await loadRequests();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const runCleanup = async (dryRun: boolean = false) => {
    if (!dryRun && !confirm('Are you sure you want to run GDPR cleanup? This cannot be undone.')) {
      return;
    }

    setProcessing(true);
    setResult(null);
    setError(null);

    try {
      const res = await adminFetch('/api/admin/gdpr?action=cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dryRun,
          anonymizeYears,
          deleteFilesDays
        })
      });

      if (!res.ok) {
        throw new Error('Failed to run cleanup');
      }

      const data = await res.json();
      setResult(data);

      if (!dryRun) {
        await loadStats();
        // Refresh audit log if it's open
        if (showAuditLog) {
          await loadAuditLog();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setProcessing(false);
    }
  };

  const exportCustomerData = async () => {
    if (!customerEmail) {
      alert('Please enter an email address');
      return;
    }

    setCustomerLoading(true);
    setCustomerData(null);

    try {
      const res = await adminFetch(`/api/admin/gdpr?action=export-customer&email=${encodeURIComponent(customerEmail)}`);
      const data = await res.json();
      setCustomerData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCustomerLoading(false);
    }
  };

  const deleteCustomerDataHandler = async () => {
    if (!customerEmail) {
      alert('Please enter an email address');
      return;
    }

    if (!confirm(`Are you sure you want to delete all data for ${customerEmail}? This cannot be undone.`)) {
      return;
    }

    setCustomerLoading(true);

    try {
      const res = await adminFetch('/api/admin/gdpr?action=delete-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: customerEmail })
      });

      const data = await res.json();
      const summary = [
        data.deletedOrders > 0 ? `${data.deletedOrders} orders anonymized` : '',
        data.deletedContactMessages > 0 ? `${data.deletedContactMessages} contact messages deleted` : '',
        data.deletedCustomerEmails > 0 ? `${data.deletedCustomerEmails} customer emails deleted` : '',
        data.deletedVisaSubmissions > 0 ? `${data.deletedVisaSubmissions} visa submissions deleted` : '',
        data.deletedDocumentRequests > 0 ? `${data.deletedDocumentRequests} document requests deleted` : '',
      ].filter(Boolean).join(', ');
      alert(`Data deleted for ${customerEmail}: ${summary || 'No data found'}`);
      setCustomerData(null);
      await loadStats();
      if (showAuditLog) await loadAuditLog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCustomerLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('sv-SE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!mounted) {
    return (
      <>
        <Head>
          <title>GDPR Management | Admin</title>
        </Head>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </>
    );
  }

  const isDryRun = result?.errors?.some((e: string) => e.includes('DRY RUN'));

  return (
    <>
      <Head>
        <title>GDPR Management | Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Link href="/admin" className="text-gray-500 hover:text-gray-700 mr-4">
                  ← Back
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">
                  GDPR Management
                </h1>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={toggleRequests}
                  className={`px-4 py-2 rounded-lg text-sm ${showRequests ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Requests {requests.filter(r => r.status === 'pending' || r.status === 'in_progress').length > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                      {requests.filter(r => r.status === 'pending' || r.status === 'in_progress').length}
                    </span>
                  )}
                </button>
                <button
                  onClick={toggleAuditLog}
                  className={`px-4 py-2 rounded-lg text-sm ${showAuditLog ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Audit Log
                </button>
                <button
                  onClick={loadStats}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-5">
              <div className="text-2xl font-bold text-gray-900">
                {loading ? '...' : stats?.totalOrders || 0}
              </div>
              <div className="text-sm text-gray-500">Total orders</div>
            </div>

            <div className="bg-white rounded-lg shadow p-5">
              <div className="text-2xl font-bold text-amber-600">
                {loading ? '...' : stats?.ordersToAnonymize || 0}
              </div>
              <div className="text-sm text-gray-500">To anonymize</div>
              <div className="text-xs text-gray-400 mt-1">Older than {anonymizeYears} years</div>
            </div>

            <div className="bg-white rounded-lg shadow p-5">
              <div className="text-2xl font-bold text-blue-600">
                {loading ? '...' : stats?.ordersWithFilesToDelete || 0}
              </div>
              <div className="text-sm text-gray-500">Files to delete</div>
              <div className="text-xs text-gray-400 mt-1">Older than {deleteFilesDays} days</div>
            </div>

            <div className="bg-white rounded-lg shadow p-5">
              <div className="text-2xl font-bold text-purple-600">
                {loading ? '...' : stats?.contactMessagesToDelete || 0}
              </div>
              <div className="text-sm text-gray-500">Contact msgs</div>
              <div className="text-xs text-gray-400 mt-1">Older than 2 years</div>
            </div>

            <div className="bg-white rounded-lg shadow p-5">
              <div className="text-2xl font-bold text-teal-600">
                {loading ? '...' : stats?.customerEmailsToDelete || 0}
              </div>
              <div className="text-sm text-gray-500">Customer emails</div>
              <div className="text-xs text-gray-400 mt-1">Older than 2 years</div>
            </div>

            <div className="bg-white rounded-lg shadow p-5">
              <div className="text-sm font-medium text-gray-900">
                {loading ? '...' : stats?.oldestOrderDate ? formatDate(stats.oldestOrderDate) : 'N/A'}
              </div>
              <div className="text-sm text-gray-500">Oldest order</div>
            </div>
          </div>

          {/* Audit Log (expandable) */}
          {showAuditLog && (
            <div className="mb-8 bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Audit Log (GDPR Art. 5(2) Accountability)
                </h2>
                <button
                  onClick={loadAuditLog}
                  disabled={auditLoading}
                  className="text-sm px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  {auditLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                {auditLog.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    {auditLoading ? 'Loading audit log...' : 'No audit log entries yet'}
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Time</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Action</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Performed By</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Target</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {auditLog.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">
                            {formatDateTime(entry.performedAt)}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              entry.action.includes('delete') ? 'bg-red-100 text-red-800' :
                              entry.action.includes('anonymize') ? 'bg-amber-100 text-amber-800' :
                              entry.action.includes('export') ? 'bg-green-100 text-green-800' :
                              entry.action.includes('cleanup') ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {entry.action.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">{entry.performedBy}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {entry.targetEmail || entry.targetId || entry.targetType}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500 max-w-xs truncate">
                            {Object.entries(entry.details || {})
                              .filter(([, v]) => v !== undefined && v !== null)
                              .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
                              .join(', ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* GDPR Requests Tracking (Art. 12(3) - 30 day deadline) */}
          {showRequests && (
            <div className="mb-8 bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Data Subject Requests (GDPR Art. 12-22)
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Track requests with 30-day legal deadline (Art. 12(3))
                </p>
              </div>

              {/* New request form */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={newRequestEmail}
                      onChange={(e) => setNewRequestEmail(e.target.value)}
                      placeholder="customer@example.com"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="w-40">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                    <select
                      value={newRequestType}
                      onChange={(e) => setNewRequestType(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md"
                    >
                      <option value="access">Access (Art. 15)</option>
                      <option value="erasure">Erasure (Art. 17)</option>
                      <option value="rectification">Rectification (Art. 16)</option>
                      <option value="portability">Portability (Art. 20)</option>
                      <option value="objection">Objection (Art. 21)</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                    <input
                      type="text"
                      value={newRequestNotes}
                      onChange={(e) => setNewRequestNotes(e.target.value)}
                      placeholder="Optional notes"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md"
                    />
                  </div>
                  <button
                    onClick={createRequest}
                    disabled={!newRequestEmail}
                    className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </div>

              {/* Requests list */}
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                {requestsLoading ? (
                  <div className="p-6 text-center text-gray-500">Loading requests...</div>
                ) : requests.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">No requests yet</div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Created</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Deadline</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Notes</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {requests.map((req) => {
                        const isOverdue = new Date(req.deadline) < new Date() && req.status !== 'completed' && req.status !== 'rejected';
                        return (
                          <tr key={req.id} className={isOverdue ? 'bg-red-50' : 'hover:bg-gray-50'}>
                            <td className="px-4 py-2 text-sm">{req.email}</td>
                            <td className="px-4 py-2 text-sm">
                              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {req.type}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                req.status === 'completed' ? 'bg-green-100 text-green-800' :
                                req.status === 'rejected' ? 'bg-gray-100 text-gray-600' :
                                req.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                isOverdue ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {isOverdue && req.status === 'pending' ? 'OVERDUE' : req.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">
                              {formatDateTime(req.createdAt)}
                            </td>
                            <td className="px-4 py-2 text-sm whitespace-nowrap">
                              <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}>
                                {formatDateTime(req.deadline)}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500 max-w-[150px] truncate">
                              {req.notes || '-'}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {req.status !== 'completed' && req.status !== 'rejected' && (
                                <div className="flex gap-1">
                                  {req.status === 'pending' && (
                                    <button
                                      onClick={() => updateRequestStatus(req.id, 'in_progress')}
                                      className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                    >
                                      Start
                                    </button>
                                  )}
                                  <button
                                    onClick={() => updateRequestStatus(req.id, 'completed')}
                                    className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                                  >
                                    Complete
                                  </button>
                                  <button
                                    onClick={() => updateRequestStatus(req.id, 'rejected')}
                                    className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                              {req.status === 'completed' && (
                                <span className="text-xs text-green-600">
                                  {req.completedAt ? formatDateTime(req.completedAt) : 'Done'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Cleanup Section */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Automatic Cleanup
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Anonymize old orders, delete files, and clean up all collections
                </p>
              </div>

              <div className="p-6 space-y-4">
                {/* Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Anonymize after (years)
                    </label>
                    <input
                      type="number"
                      value={anonymizeYears}
                      onChange={(e) => setAnonymizeYears(parseInt(e.target.value) || 7)}
                      min={1}
                      max={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delete files after (days)
                    </label>
                    <input
                      type="number"
                      value={deleteFilesDays}
                      onChange={(e) => setDeleteFilesDays(parseInt(e.target.value) || 90)}
                      min={30}
                      max={365}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                {/* Result */}
                {result && (
                  <div className={`p-4 rounded-lg ${isDryRun ? 'bg-blue-50 border border-blue-200' : 'bg-green-50 border border-green-200'}`}>
                    <div className="font-medium">
                      {isDryRun ? 'Preview (no changes made)' : 'Cleanup completed'}
                    </div>
                    <div className="text-sm mt-2 space-y-1">
                      <div>Orders to anonymize: {result.anonymizedOrders}</div>
                      <div>Files to delete: {result.deletedFiles}</div>
                      {(result.deletedContactMessages > 0 || isDryRun) && (
                        <div>Contact messages: {result.deletedContactMessages}</div>
                      )}
                      {(result.deletedCustomerEmails > 0 || isDryRun) && (
                        <div>Customer emails: {result.deletedCustomerEmails}</div>
                      )}
                      {result.anonymizedCollections?.length > 0 && (
                        <div className="mt-1 text-xs text-gray-600">
                          Collections: {result.anonymizedCollections.join(', ')}
                        </div>
                      )}
                    </div>
                    {result.errors?.length > 0 && !isDryRun && (
                      <div className="text-sm text-red-600 mt-2">
                        Errors: {result.errors.join(', ')}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => runCleanup(true)}
                    disabled={processing}
                    className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Preview'}
                  </button>
                  <button
                    onClick={() => runCleanup(false)}
                    disabled={processing}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Run Cleanup'}
                  </button>
                </div>
              </div>
            </div>

            {/* Customer Data Request */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Customer Data Request
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Export or delete customer data across all collections (GDPR Art. 15 & 17)
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer email address
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={exportCustomerData}
                    disabled={customerLoading || !customerEmail}
                    className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50"
                  >
                    {customerLoading ? 'Loading...' : 'Export Data'}
                  </button>
                  <button
                    onClick={deleteCustomerDataHandler}
                    disabled={customerLoading || !customerEmail}
                    className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
                  >
                    {customerLoading ? 'Loading...' : 'Delete Data'}
                  </button>
                </div>

                {customerData && (
                  <div className="mt-4">
                    {customerData.success ? (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="font-medium mb-2">Data found for {customerEmail}:</div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Orders: {customerData.data?.orders?.length || 0}</div>
                          <div>Contact messages: {customerData.data?.contactMessages?.length || 0}</div>
                          <div>Customer emails: {customerData.data?.customerEmails?.length || 0}</div>
                          <div>Visa submissions: {customerData.data?.visaFormSubmissions?.length || 0}</div>
                          <div>Document requests: {customerData.data?.documentRequests?.length || 0}</div>
                        </div>
                        <button
                          onClick={() => {
                            const blob = new Blob([JSON.stringify(customerData.data, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `gdpr-export-${customerEmail}-${new Date().toISOString().split('T')[0]}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="mt-3 text-sm text-blue-600 hover:underline"
                        >
                          Download as JSON
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                        {customerData.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview Tables */}
          {preview && (preview.toAnonymize.length > 0 || preview.toDeleteFiles.length > 0) && (
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {preview.toAnonymize.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">
                      Orders to anonymize ({preview.toAnonymize.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Order</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Customer</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {preview.toAnonymize.slice(0, 10).map((order) => (
                          <tr key={order.id}>
                            <td className="px-4 py-2 text-sm">{order.orderNumber}</td>
                            <td className="px-4 py-2 text-sm">{order.customerName}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {preview.toAnonymize.length > 10 && (
                      <div className="p-4 text-center text-sm text-gray-500">
                        ... and {preview.toAnonymize.length - 10} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {preview.toDeleteFiles.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">
                      Files to delete ({preview.toDeleteFiles.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Order</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Customer</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {preview.toDeleteFiles.slice(0, 10).map((order) => (
                          <tr key={order.id}>
                            <td className="px-4 py-2 text-sm">{order.orderNumber}</td>
                            <td className="px-4 py-2 text-sm">{order.customerName}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {preview.toDeleteFiles.length > 10 && (
                      <div className="p-4 text-center text-sm text-gray-500">
                        ... and {preview.toDeleteFiles.length - 10} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info Section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3">About GDPR Cleanup</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>
                <strong>Order anonymization (after {anonymizeYears} years):</strong> Personal data is replaced with [RADERAT].
                Order data (amounts, document types, dates) and company identifiers (org.nr, VAT) are retained for accounting (Bokf&ouml;ringslagen 7:2).
              </p>
              <p>
                <strong>File deletion (after {deleteFilesDays} days):</strong> Uploaded documents (ID copies, certificates)
                are permanently deleted from Firebase Storage. Order information is retained.
              </p>
              <p>
                <strong>Other collections (after 2 years):</strong> Contact messages, customer emails,
                visa form submissions, and document requests are cleaned up after 2 years.
              </p>
              <p>
                <strong>Customer data request:</strong> Export searches across all collections (orders, contact messages,
                customer emails, visa submissions, document requests). Delete anonymizes orders and removes data from other collections.
              </p>
              <p>
                <strong>Audit log:</strong> All GDPR actions are logged with timestamp, performer, and details for
                accountability compliance (GDPR Art. 5(2)).
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

// Disable SSR for this page to avoid hydration issues
const GdprAdminPageNoSSR = dynamic(
  () => Promise.resolve(function GdprAdminPageWrapper() {
    return (
      <ProtectedRoute requiredPermission="canManageGdpr">
        <GdprAdminPageContent />
      </ProtectedRoute>
    );
  }),
  { ssr: false }
);

export default function GdprAdminPage() {
  return <GdprAdminPageNoSSR />;
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
