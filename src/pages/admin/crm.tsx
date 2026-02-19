import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import {
  getAllLeads,
  createLead,
  updateLead,
  deleteLead,
  bulkImportLeads,
  addActivity,
  getActivitiesForLead,
  sendCrmEmail,
  sendBulkCrmEmails,
  generateSalesEmailHtml,
  exportLeadsToCsv,
  type CrmLead,
  type CrmActivity,
  type LeadStatus,
  type LeadSource,
} from '@/firebase/crmService';

const STATUS_OPTIONS: { value: LeadStatus; label: string; color: string; bg: string }[] = [
  { value: 'new', label: 'New', color: 'text-blue-800', bg: 'bg-blue-100' },
  { value: 'contacted', label: 'Contacted', color: 'text-yellow-800', bg: 'bg-yellow-100' },
  { value: 'meeting', label: 'Meeting', color: 'text-purple-800', bg: 'bg-purple-100' },
  { value: 'proposal', label: 'Proposal', color: 'text-orange-800', bg: 'bg-orange-100' },
  { value: 'won', label: 'Won', color: 'text-green-800', bg: 'bg-green-100' },
  { value: 'lost', label: 'Lost', color: 'text-red-800', bg: 'bg-red-100' },
];

const SOURCE_OPTIONS: { value: LeadSource; label: string }[] = [
  { value: 'email-list', label: 'Email List' },
  { value: 'referral', label: 'Referral' },
  { value: 'website', label: 'Website' },
  { value: 'cold-call', label: 'Cold Call' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' },
];

const getStatusStyle = (status: LeadStatus) => STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];

function CrmPage() {
  const { currentUser } = useAuth();
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'followUp' | 'company' | 'status'>('updated');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Partial<CrmLead> | null>(null);
  const [saving, setSaving] = useState(false);

  // Detail / activity panel
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [newActivityType, setNewActivityType] = useState<CrmActivity['type']>('note');
  const [newActivityText, setNewActivityText] = useState('');
  const [savingActivity, setSavingActivity] = useState(false);

  // Import modal
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);

  // Email modal (single)
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailLeadId, setEmailLeadId] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Bulk email modal
  const [bulkEmailOpen, setBulkEmailOpen] = useState(false);
  const [bulkSubject, setBulkSubject] = useState('');
  const [bulkBody, setBulkBody] = useState('');
  const [sendingBulk, setSendingBulk] = useState(false);

  const adminName = currentUser?.displayName || currentUser?.email || 'Admin';

  // ── LOAD ──
  const loadLeads = async () => {
    try {
      setLoading(true);
      const data = await getAllLeads();
      setLeads(data);
    } catch (e) {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  // ── FILTER & SORT ──
  const filteredLeads = useMemo(() => {
    let result = leads;
    if (filterStatus !== 'all') {
      result = result.filter((l) => l.status === filterStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.companyName.toLowerCase().includes(q) ||
          l.contactName.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          (l.notes || '').toLowerCase().includes(q)
      );
    }
    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'followUp') {
        if (!a.followUpDate && !b.followUpDate) return 0;
        if (!a.followUpDate) return 1;
        if (!b.followUpDate) return -1;
        return a.followUpDate.localeCompare(b.followUpDate);
      }
      if (sortBy === 'company') return a.companyName.localeCompare(b.companyName);
      if (sortBy === 'status') {
        const order = STATUS_OPTIONS.map((s) => s.value);
        return order.indexOf(a.status) - order.indexOf(b.status);
      }
      // default: updated desc
      const aTime = a.updatedAt?.seconds || 0;
      const bTime = b.updatedAt?.seconds || 0;
      return bTime - aTime;
    });
    return result;
  }, [leads, filterStatus, searchQuery, sortBy]);

  // ── STATS ──
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const weekFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const byStatus: Record<string, number> = {};
    let followUpToday = 0;
    let followUpWeek = 0;
    let pipelineValue = 0;
    let wonValue = 0;
    leads.forEach((l) => {
      byStatus[l.status] = (byStatus[l.status] || 0) + 1;
      if (l.followUpDate) {
        if (l.followUpDate <= today) followUpToday++;
        else if (l.followUpDate <= weekFromNow) followUpWeek++;
      }
      if (l.estimatedValue && l.status !== 'lost' && l.status !== 'won') {
        pipelineValue += l.estimatedValue;
      }
      if (l.estimatedValue && l.status === 'won') {
        wonValue += l.estimatedValue;
      }
    });
    return { byStatus, followUpToday, followUpWeek, total: leads.length, pipelineValue, wonValue };
  }, [leads]);

  // ── SAVE LEAD ──
  const handleSaveLead = async () => {
    if (!editingLead) return;
    try {
      setSaving(true);
      if (editingLead.id) {
        await updateLead(editingLead.id, editingLead);
        toast.success('Lead updated');
      } else {
        await createLead({
          companyName: editingLead.companyName || '',
          contactName: editingLead.contactName || '',
          email: editingLead.email || '',
          phone: editingLead.phone || '',
          website: editingLead.website || '',
          status: editingLead.status || 'new',
          source: editingLead.source || 'other',
          notes: editingLead.notes || '',
          followUpDate: editingLead.followUpDate || undefined,
          estimatedValue: editingLead.estimatedValue || undefined,
          tags: editingLead.tags || [],
          createdBy: adminName,
        });
        toast.success('Lead created');
      }
      setModalOpen(false);
      setEditingLead(null);
      await loadLeads();
    } catch (e) {
      toast.error('Failed to save lead');
    } finally {
      setSaving(false);
    }
  };

  // ── DELETE LEAD ──
  const handleDeleteLead = async (id: string) => {
    if (!confirm('Delete this lead permanently?')) return;
    try {
      await deleteLead(id);
      toast.success('Lead deleted');
      if (selectedLead?.id === id) setSelectedLead(null);
      await loadLeads();
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  // ── QUICK STATUS CHANGE ──
  const handleQuickStatus = async (lead: CrmLead, newStatus: LeadStatus) => {
    try {
      await updateLead(lead.id!, { status: newStatus });
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: newStatus } : l)));
      if (selectedLead?.id === lead.id) setSelectedLead({ ...selectedLead, status: newStatus } as CrmLead);
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  // ── IMPORT ──
  const handleImport = async () => {
    try {
      setImporting(true);
      const lines = importText
        .split(/\n+/)
        .map((e) => e.trim())
        .filter(Boolean);
      if (lines.length === 0) {
        toast.error('No lines to import');
        return;
      }
      const count = await bulkImportLeads(lines, 'email-list', adminName);
      const linesWithEmail = lines.filter((l) => l.includes('@')).length;
      toast.success(`Imported ${count} new leads (${linesWithEmail - count} duplicates/skipped)`);
      setImportOpen(false);
      setImportText('');
      await loadLeads();
    } catch (e) {
      toast.error('Import failed');
    } finally {
      setImporting(false);
    }
  };

  // ── SEND SINGLE EMAIL ──
  const openEmailModal = (lead: CrmLead) => {
    setEmailLeadId(lead.id!);
    setEmailSubject('');
    setEmailBody('');
    setEmailOpen(true);
  };

  const handleSendEmail = async () => {
    if (!emailLeadId || !emailSubject.trim() || !emailBody.trim()) return;
    try {
      setSendingEmail(true);
      const lead = leads.find((l) => l.id === emailLeadId);
      if (!lead) { toast.error('Lead not found'); return; }

      const html = generateSalesEmailHtml({
        recipientName: lead.contactName || '',
        bodyText: emailBody,
        senderName: adminName,
      });

      await sendCrmEmail({
        to: lead.email,
        toName: lead.contactName || lead.companyName || '',
        subject: emailSubject,
        bodyHtml: html,
        leadId: emailLeadId,
        sentBy: adminName,
      });

      toast.success(`Email sent to ${lead.email}`);
      setEmailOpen(false);
      await loadLeads();
      // Refresh activities if this lead is selected
      if (selectedLead?.id === emailLeadId) {
        const acts = await getActivitiesForLead(emailLeadId);
        setActivities(acts);
      }
    } catch (e) {
      toast.error('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  // ── BULK EMAIL ──
  const handleSendBulkEmail = async () => {
    if (!bulkSubject.trim() || !bulkBody.trim()) return;
    const targetLeads = filteredLeads.filter((l) => l.status !== 'won' && l.status !== 'lost');
    if (targetLeads.length === 0) { toast.error('No leads to email'); return; }

    if (!confirm(`Send email to ${targetLeads.length} leads? This cannot be undone.`)) return;

    try {
      setSendingBulk(true);
      const result = await sendBulkCrmEmails(
        targetLeads.map((l) => l.id!),
        bulkSubject,
        bulkBody,
        adminName,
      );
      toast.success(`Sent ${result.sent} emails (${result.failed} failed)`);
      setBulkEmailOpen(false);
      setBulkSubject('');
      setBulkBody('');
      await loadLeads();
    } catch (e) {
      toast.error('Bulk email failed');
    } finally {
      setSendingBulk(false);
    }
  };

  // ── CSV EXPORT ──
  const handleExportCsv = () => {
    const csv = exportLeadsToCsv(filteredLeads);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'crm-leads-' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredLeads.length} leads`);
  };

  // ── ACTIVITIES ──
  const openLeadDetail = async (lead: CrmLead) => {
    setSelectedLead(lead);
    setLoadingActivities(true);
    try {
      const acts = await getActivitiesForLead(lead.id!);
      setActivities(acts);
    } catch (e) {
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleAddActivity = async () => {
    if (!selectedLead?.id || !newActivityText.trim()) return;
    try {
      setSavingActivity(true);
      await addActivity({
        leadId: selectedLead.id,
        type: newActivityType,
        description: newActivityText.trim(),
        createdBy: adminName,
      });
      setNewActivityText('');
      const acts = await getActivitiesForLead(selectedLead.id);
      setActivities(acts);
      toast.success('Activity logged');
    } catch (e) {
      toast.error('Failed to log activity');
    } finally {
      setSavingActivity(false);
    }
  };

  const activityIcon = (type: string) => {
    switch (type) {
      case 'call': return '📞';
      case 'email': return '📧';
      case 'meeting': return '🤝';
      default: return '📝';
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <ProtectedRoute>
      <Head>
        <title>CRM - Sales - DOX Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Link href="/admin" className="text-gray-400 hover:text-gray-600 text-sm">← Admin</Link>
                <h1 className="text-2xl font-bold text-gray-900">Sales CRM</h1>
              </div>
              <p className="text-sm text-gray-500 mt-1">{stats.total} leads total</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExportCsv}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                📊 Export CSV
              </button>
              <button
                onClick={() => setBulkEmailOpen(true)}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                📨 Bulk Email
              </button>
              <button
                onClick={() => setImportOpen(true)}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                📥 Import
              </button>
              <button
                onClick={() => {
                  setEditingLead({ status: 'new', source: 'other', notes: '' });
                  setModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                + New Lead
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => setFilterStatus(filterStatus === s.value ? 'all' : s.value)}
                className={`rounded-lg p-3 text-center transition-all border-2 ${
                  filterStatus === s.value ? 'border-blue-500 shadow-md' : 'border-transparent'
                } ${s.bg}`}
              >
                <div className={`text-2xl font-bold ${s.color}`}>{stats.byStatus[s.value] || 0}</div>
                <div className={`text-xs font-medium ${s.color}`}>{s.label}</div>
              </button>
            ))}
            <div className="rounded-lg p-3 text-center bg-red-50 border-2 border-transparent">
              <div className="text-2xl font-bold text-red-700">{stats.followUpToday}</div>
              <div className="text-xs font-medium text-red-700">Due Today</div>
            </div>
            {stats.followUpWeek > 0 && (
              <div className="rounded-lg p-3 text-center bg-amber-50 border-2 border-transparent">
                <div className="text-2xl font-bold text-amber-700">{stats.followUpWeek}</div>
                <div className="text-xs font-medium text-amber-700">This Week</div>
              </div>
            )}
            {stats.pipelineValue > 0 && (
              <div className="rounded-lg p-3 text-center bg-indigo-50 border-2 border-transparent col-span-2 lg:col-span-1">
                <div className="text-lg font-bold text-indigo-700">{stats.pipelineValue.toLocaleString()}</div>
                <div className="text-xs font-medium text-indigo-700">Pipeline SEK</div>
              </div>
            )}
          </div>

          {/* Search & Sort */}
          <div className="flex flex-wrap gap-3 mb-4">
            <input
              type="text"
              placeholder="Search company, contact, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="updated">Last Updated</option>
              <option value="followUp">Follow-up Date</option>
              <option value="company">Company Name</option>
              <option value="status">Status</option>
            </select>
            {filterStatus !== 'all' && (
              <button
                onClick={() => setFilterStatus('all')}
                className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear filter ✕
              </button>
            )}
          </div>

          {/* Main content: list + detail panel */}
          <div className="flex gap-6">
            {/* Lead list */}
            <div className={`flex-1 ${selectedLead ? 'hidden lg:block' : ''}`}>
              {loading ? (
                <div className="text-center py-12 text-gray-500">Loading...</div>
              ) : filteredLeads.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="text-gray-500">No leads found</p>
                  <p className="text-sm text-gray-400 mt-1">Add a new lead or import emails to get started</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Follow-up</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredLeads.map((lead) => {
                        const statusStyle = getStatusStyle(lead.status);
                        const isOverdue = lead.followUpDate && lead.followUpDate <= today && lead.status !== 'won' && lead.status !== 'lost';
                        return (
                          <tr
                            key={lead.id}
                            className={`hover:bg-gray-50 cursor-pointer ${selectedLead?.id === lead.id ? 'bg-blue-50' : ''} ${isOverdue ? 'border-l-4 border-l-red-400' : ''}`}
                            onClick={() => openLeadDetail(lead)}
                          >
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900 text-sm">{lead.companyName || '—'}</div>
                              <div className="text-xs text-gray-500">{lead.email}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-700">{lead.contactName || '—'}</div>
                              {lead.phone && <div className="text-xs text-gray-400">{lead.phone}</div>}
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={lead.status}
                                onChange={(e) => { e.stopPropagation(); handleQuickStatus(lead, e.target.value as LeadStatus); }}
                                onClick={(e) => e.stopPropagation()}
                                className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${statusStyle.bg} ${statusStyle.color}`}
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              {lead.followUpDate ? (
                                <span className={`text-xs font-medium ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                                  {isOverdue && '⚠ '}{lead.followUpDate}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-300">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-gray-500">{SOURCE_OPTIONS.find((s) => s.value === lead.source)?.label || lead.source}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingLead({ ...lead }); setModalOpen(true); }}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium mr-2"
                              >
                                Edit
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteLead(lead.id!); }}
                                className="text-xs text-red-500 hover:text-red-700 font-medium"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Detail panel */}
            {selectedLead && (
              <div className="w-full lg:w-96 bg-white rounded-lg border border-gray-200 p-5 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{selectedLead.companyName || 'Unnamed'}</h3>
                  <button onClick={() => setSelectedLead(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
                </div>

                {/* Lead info */}
                <div className="space-y-2 mb-5 text-sm">
                  {selectedLead.contactName && (
                    <div><span className="text-gray-500">Contact:</span> <span className="font-medium">{selectedLead.contactName}</span></div>
                  )}
                  <div><span className="text-gray-500">Email:</span> <a href={`mailto:${selectedLead.email}`} className="text-blue-600 hover:underline">{selectedLead.email}</a></div>
                  {selectedLead.phone && (
                    <div><span className="text-gray-500">Phone:</span> <a href={`tel:${selectedLead.phone}`} className="text-blue-600">{selectedLead.phone}</a></div>
                  )}
                  {selectedLead.website && (
                    <div><span className="text-gray-500">Website:</span> <a href={selectedLead.website.startsWith('http') ? selectedLead.website : `https://${selectedLead.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedLead.website}</a></div>
                  )}
                  {selectedLead.estimatedValue != null && selectedLead.estimatedValue > 0 && (
                    <div><span className="text-gray-500">Est. value:</span> <span className="font-medium">{selectedLead.estimatedValue.toLocaleString()} SEK</span></div>
                  )}
                  {selectedLead.notes && (
                    <div className="bg-gray-50 rounded p-2 mt-2">
                      <span className="text-gray-500 text-xs block mb-1">Notes:</span>
                      <p className="text-gray-700 whitespace-pre-wrap text-xs">{selectedLead.notes}</p>
                    </div>
                  )}
                </div>

                {/* Quick actions */}
                <div className="flex gap-2 mb-5">
                  <button
                    onClick={() => { setEditingLead({ ...selectedLead }); setModalOpen(true); }}
                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => openEmailModal(selectedLead)}
                    className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100"
                  >
                    📧 Send Email
                  </button>
                </div>

                {/* Activity log */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Activity Log</h4>

                  {/* Add activity */}
                  <div className="flex gap-2 mb-3">
                    <select
                      value={newActivityType}
                      onChange={(e) => setNewActivityType(e.target.value as CrmActivity['type'])}
                      className="px-2 py-1.5 border border-gray-300 rounded text-xs bg-white"
                    >
                      <option value="note">📝 Note</option>
                      <option value="call">📞 Call</option>
                      <option value="email">📧 Email</option>
                      <option value="meeting">🤝 Meeting</option>
                    </select>
                    <input
                      type="text"
                      placeholder="What happened?"
                      value={newActivityText}
                      onChange={(e) => setNewActivityText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddActivity()}
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleAddActivity}
                      disabled={savingActivity || !newActivityText.trim()}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      Log
                    </button>
                  </div>

                  {/* Activity list */}
                  {loadingActivities ? (
                    <p className="text-xs text-gray-400 text-center py-4">Loading...</p>
                  ) : activities.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">No activities yet</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {activities.map((act) => (
                        <div key={act.id} className="flex gap-2 text-xs">
                          <span className="flex-shrink-0 mt-0.5">{activityIcon(act.type)}</span>
                          <div>
                            <p className="text-gray-700">{act.description}</p>
                            <p className="text-gray-400 mt-0.5">
                              {act.createdAt?.toDate ? act.createdAt.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                              {act.createdBy ? ` · ${act.createdBy}` : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ADD/EDIT LEAD MODAL ── */}
      {modalOpen && editingLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editingLead.id ? 'Edit Lead' : 'New Lead'}</h2>
              <button onClick={() => { setModalOpen(false); setEditingLead(null); }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={editingLead.companyName || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="Acme AB"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={editingLead.contactName || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, contactName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="Anna Svensson"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={editingLead.email || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="anna@acme.se"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editingLead.phone || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="+46 70 123 4567"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="text"
                  value={editingLead.website || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, website: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="www.acme.se"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editingLead.status || 'new'}
                    onChange={(e) => setEditingLead({ ...editingLead, status: e.target.value as LeadStatus })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Source</label>
                  <select
                    value={editingLead.source || 'other'}
                    onChange={(e) => setEditingLead({ ...editingLead, source: e.target.value as LeadSource })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    {SOURCE_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Follow-up Date</label>
                  <input
                    type="date"
                    value={editingLead.followUpDate || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, followUpDate: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Estimated Value (SEK)</label>
                <input
                  type="number"
                  value={editingLead.estimatedValue ?? ''}
                  onChange={(e) => setEditingLead({ ...editingLead, estimatedValue: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="10000"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={editingLead.notes || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="Any notes about this lead..."
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => { setModalOpen(false); setEditingLead(null); }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLead}
                disabled={saving || !editingLead.email}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingLead.id ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── IMPORT MODAL ── */}
      {importOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">📥 Import Email Leads</h2>
              <button onClick={() => setImportOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600 mb-3">
                Paste email addresses below — one per line, or separated by commas. Duplicates will be skipped automatically.
              </p>
              <textarea
                rows={10}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500"
                placeholder={"anna@acme.se\nbob@company.com\ncarl@startup.io"}
              />
              <p className="text-xs text-gray-400 mt-2">
                {importText.split(/\n+/).filter((e) => e.trim() && e.includes('@')).length} lines with emails detected
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setImportOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button
                onClick={handleImport}
                disabled={importing || !importText.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {importing ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── SINGLE EMAIL MODAL ── */}
      {emailOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">📧 Send Email</h2>
              <button onClick={() => setEmailOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
                <p className="text-sm text-gray-600">{leads.find((l) => l.id === emailLeadId)?.email || ''}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="Document legalization services — DOX Visumpartner"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Message (plain text, will be formatted)</label>
                <textarea
                  rows={8}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder={"We help companies with document legalization, apostille and visa services.\n\nWould you be interested in a brief call to discuss how we can help?"}
                />
              </div>
              <p className="text-xs text-gray-400">Email will be sent from DOX Visumpartner with your name as signature.</p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setEmailOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail || !emailSubject.trim() || !emailBody.trim()}
                className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {sendingEmail ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BULK EMAIL MODAL ── */}
      {bulkEmailOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">📨 Bulk Email</h2>
              <button onClick={() => setBulkEmailOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800 font-medium">
                  This will send to {filteredLeads.filter((l) => l.status !== 'won' && l.status !== 'lost').length} leads
                  {filterStatus !== 'all' ? ` (filtered: ${filterStatus})` : ' (excluding Won & Lost)'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={bulkSubject}
                  onChange={(e) => setBulkSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="Document legalization services — DOX Visumpartner"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Message (plain text, personalized with contact name)</label>
                <textarea
                  rows={8}
                  value={bulkBody}
                  onChange={(e) => setBulkBody(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder={"We help companies with document legalization, apostille and visa services for international business.\n\nWould you be interested in a brief call to discuss how we can assist your company?"}
                />
              </div>
              <p className="text-xs text-gray-400">Each email will be personalized with the contact name. Lead status will auto-update to &quot;Contacted&quot; for new leads.</p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setBulkEmailOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button
                onClick={handleSendBulkEmail}
                disabled={sendingBulk || !bulkSubject.trim() || !bulkBody.trim()}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
              >
                {sendingBulk ? 'Sending...' : 'Send to All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await serverSideTranslations(locale ?? 'sv', ['common'])) },
});

export default CrmPage;
