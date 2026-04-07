/**
 * Manager Reminders Overview
 *
 * Restricted to super_admin and admin roles.
 * Shows all open reminders across the team grouped by assignee, with the ability to:
 *  - Ping (email) a handler about a specific reminder
 *  - Reassign one or many reminders to another handler (e.g. when someone is sick)
 *  - Snooze / dismiss reminders as a manager override
 *  - Open the underlying order or CRM lead
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAllActiveReminders,
  bulkReassignReminders,
  logReminderPing,
  snoozeReminder,
  dismissReminder,
  type Reminder,
} from '@/firebase/reminderService';
import { getAllAdminUsers, type AdminUser } from '@/firebase/userService';
import toast from 'react-hot-toast';

type FilterMode = 'all' | 'overdue' | 'today' | 'upcoming';

interface ReminderWithDate extends Reminder {
  _due: Date;
}

function ManagerPage() {
  const { currentUser, adminUser, userRole, loading: authLoading } = useAuth();
  const router = useRouter();

  const [reminders, setReminders] = useState<ReminderWithDate[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [collapsedAssignees, setCollapsedAssignees] = useState<Set<string>>(new Set());
  const [working, setWorking] = useState<string | null>(null);

  // Reassign modal
  const [reassignTarget, setReassignTarget] = useState<{ ids: string[]; sourceLabel: string } | null>(null);
  const [reassignTo, setReassignTo] = useState<string>('');

  // Ping modal
  const [pingTarget, setPingTarget] = useState<ReminderWithDate | null>(null);
  const [pingNote, setPingNote] = useState('');
  const [sendingPing, setSendingPing] = useState(false);

  // Block access for non-managers
  const isManager = userRole === 'super_admin' || userRole === 'admin';

  useEffect(() => {
    if (!authLoading && !isManager) {
      toast.error('Access denied — manager role required');
      router.replace('/admin');
    }
  }, [authLoading, isManager, router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allReminders, users] = await Promise.all([
        getAllActiveReminders(),
        getAllAdminUsers(),
      ]);
      const enriched = allReminders.map(r => {
        const due = r.dueDate && typeof r.dueDate === 'object' && 'toDate' in r.dueDate
          ? (r.dueDate as any).toDate()
          : new Date(r.dueDate as string);
        return { ...r, _due: due } as ReminderWithDate;
      });
      setReminders(enriched);
      setAdminUsers(users.filter(u => u.isActive));
    } catch (e) {
      console.error('Failed to load manager data:', e);
      toast.error('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isManager) loadData();
  }, [isManager, loadData]);

  // ── DATE BUCKETS ──
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const filteredReminders = useMemo(() => {
    return reminders.filter(r => {
      switch (filter) {
        case 'overdue': return r._due <= now;
        case 'today': return r._due <= endOfToday;
        case 'upcoming': return r._due > endOfToday;
        case 'all':
        default: return true;
      }
    });
  }, [reminders, filter]);

  // Group by assignee
  const grouped = useMemo(() => {
    const map: Record<string, { name: string; uid: string; reminders: ReminderWithDate[] }> = {};
    filteredReminders.forEach(r => {
      const key = r.assignedTo || 'unassigned';
      if (!map[key]) {
        map[key] = {
          uid: r.assignedTo || '',
          name: r.assignedToName || (key === 'unassigned' ? 'Unassigned' : key.slice(0, 8)),
          reminders: [],
        };
      }
      map[key].reminders.push(r);
    });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredReminders]);

  // Summary counts
  const summary = useMemo(() => {
    const overdue = reminders.filter(r => r._due <= now).length;
    const today = reminders.filter(r => r._due > now && r._due <= endOfToday).length;
    const upcoming = reminders.filter(r => r._due > endOfToday).length;
    return { total: reminders.length, overdue, today, upcoming };
  }, [reminders]);

  // ── ACTIONS ──
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllForAssignee = (uids: string[]) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      const allSelected = uids.every(id => next.has(id));
      if (allSelected) {
        uids.forEach(id => next.delete(id));
      } else {
        uids.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const toggleAssigneeCollapse = (uid: string) => {
    setCollapsedAssignees(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const openPingModal = (r: ReminderWithDate) => {
    setPingTarget(r);
    setPingNote('');
  };

  const sendPing = async () => {
    if (!pingTarget || !currentUser?.uid) return;
    setSendingPing(true);
    try {
      // Lookup assignee email
      const assignee = adminUsers.find(u => u.id === pingTarget.assignedTo);
      if (!assignee?.email) {
        toast.error('Assignee has no email address');
        setSendingPing(false);
        return;
      }

      const actorName = adminUser?.displayName || currentUser.email || 'Manager';
      const dueFmt = pingTarget._due.toLocaleString('sv-SE');
      const entityUrl = pingTarget.entityType === 'crm_lead'
        ? `${window.location.origin}/admin/crm?lead=${pingTarget.entityId}`
        : `${window.location.origin}/admin/orders/${pingTarget.entityId || pingTarget.orderId}`;

      // Queue email via customerEmails collection (same pattern as send-custom-email)
      const { addDoc, collection: fbCollection, serverTimestamp } = await import('firebase/firestore');
      const { db: firebaseDb } = await import('@/firebase/config');
      await addDoc(fbCollection(firebaseDb, 'customerEmails'), {
        name: assignee.displayName || assignee.email,
        email: assignee.email,
        subject: `🔔 Reminder ping from ${actorName}: ${pingTarget.message}`,
        message: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #dc2626; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 20px;">🔔 Reminder Ping — DOX Visumpartner</h1>
  </div>
  <div style="padding: 24px; background: #ffffff; border: 1px solid #fecaca; border-top: none;">
    <p style="margin: 0 0 12px 0; color: #374151;">Hi ${assignee.displayName || assignee.email},</p>
    <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;"><strong>${actorName}</strong> is following up on this reminder:</p>
    <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px 0; color: #991b1b; font-weight: bold; font-size: 16px;">${pingTarget.message}</p>
      <p style="margin: 0; color: #6b7280; font-size: 13px;">Due: <strong>${dueFmt}</strong></p>
      <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 13px;">${pingTarget.entityLabel || ''}</p>
    </div>
    ${pingNote.trim() ? `
    <div style="background: #f9fafb; border-radius: 6px; padding: 12px 16px; margin: 16px 0;">
      <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">Note from ${actorName}</p>
      <p style="margin: 0; color: #374151; white-space: pre-wrap;">${pingNote.trim()}</p>
    </div>
    ` : ''}
    <div style="text-align: center; margin: 24px 0;">
      <a href="${entityUrl}" style="display: inline-block; background: #0EB0A6; color: white; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold;">Open ${pingTarget.entityType === 'crm_lead' ? 'Lead' : 'Order'}</a>
    </div>
  </div>
  <div style="background: #f5f5f5; padding: 12px; text-align: center; font-size: 11px; color: #999;">
    DOX Visumpartner internal manager ping
  </div>
</div>
        `.trim(),
        orderId: pingTarget.entityId || pingTarget.orderId || '',
        createdAt: serverTimestamp(),
        status: 'unread',
        type: 'reminder_ping',
      });

      // Log the ping on the reminder
      await logReminderPing(pingTarget.id!, currentUser.uid, actorName, pingNote.trim() || undefined);

      // Update local state with new ping history
      setReminders(prev => prev.map(r => r.id === pingTarget.id ? {
        ...r,
        pingHistory: [
          ...(r.pingHistory || []),
          { byUid: currentUser.uid, byName: actorName, sentAt: new Date().toISOString(), ...(pingNote.trim() ? { note: pingNote.trim() } : {}) }
        ]
      } : r));

      toast.success(`Ping sent to ${assignee.displayName || assignee.email}`);
      setPingTarget(null);
      setPingNote('');
    } catch (e) {
      console.error('Failed to send ping:', e);
      toast.error('Failed to send ping');
    } finally {
      setSendingPing(false);
    }
  };

  const openReassignModal = (ids: string[], sourceLabel: string) => {
    setReassignTarget({ ids, sourceLabel });
    setReassignTo('');
  };

  const confirmReassign = async () => {
    if (!reassignTarget || !reassignTo) return;
    const target = adminUsers.find(u => u.id === reassignTo);
    if (!target) return;
    setWorking('reassign');
    try {
      await bulkReassignReminders(
        reassignTarget.ids,
        target.id,
        target.displayName || target.email
      );
      setReminders(prev => prev.map(r =>
        reassignTarget.ids.includes(r.id!)
          ? { ...r, assignedTo: target.id, assignedToName: target.displayName || target.email }
          : r
      ));
      toast.success(`Reassigned ${reassignTarget.ids.length} reminder(s) to ${target.displayName || target.email}`);
      setReassignTarget(null);
      setReassignTo('');
      setSelectedIds(new Set());
    } catch (e) {
      console.error('Failed to reassign:', e);
      toast.error('Failed to reassign');
    } finally {
      setWorking(null);
    }
  };

  const handleSnooze = async (id: string, hours: number) => {
    setWorking(id);
    try {
      const until = new Date(Date.now() + hours * 60 * 60 * 1000);
      await snoozeReminder(id, until);
      setReminders(prev => prev.map(r => r.id === id ? { ...r, status: 'snoozed' as const, _due: until, dueDate: until.toISOString() } : r));
      toast.success(`Snoozed for ${hours}h`);
    } catch {
      toast.error('Failed to snooze');
    } finally {
      setWorking(null);
    }
  };

  const handleDismiss = async (id: string) => {
    if (!confirm('Mark this reminder as completed/dismissed?')) return;
    setWorking(id);
    try {
      await dismissReminder(id);
      setReminders(prev => prev.filter(r => r.id !== id));
      toast.success('Reminder dismissed');
    } catch {
      toast.error('Failed to dismiss');
    } finally {
      setWorking(null);
    }
  };

  const getEntityUrl = (r: Reminder) => {
    if (r.entityType === 'crm_lead' && r.entityId) return `/admin/crm?lead=${r.entityId}`;
    if (r.entityType === 'order' && r.entityId) return `/admin/orders/${r.entityId}`;
    if (r.orderId) return `/admin/orders/${r.orderId}`;
    return '#';
  };

  const getEntityIcon = (r: Reminder) => {
    if (r.entityType === 'crm_lead') return '👤';
    return '📋';
  };

  const getDueLabel = (due: Date) => {
    const diffMs = due.getTime() - now.getTime();
    if (diffMs < 0) {
      const hoursOverdue = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
      if (hoursOverdue < 24) return `${hoursOverdue}h overdue`;
      return `${Math.floor(hoursOverdue / 24)}d overdue`;
    }
    if (due <= endOfToday) {
      return `Today ${due.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return due.toLocaleString('sv-SE');
  };

  const getDueColor = (due: Date) => {
    if (due <= now) return 'text-red-700 bg-red-50 border-red-200';
    if (due <= endOfToday) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  if (!isManager && !authLoading) {
    return null;
  }

  return (
    <ProtectedRoute>
      <Head>
        <title>Manager — Reminders Overview</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <svg className="h-7 w-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Manager — Reminders Overview
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Monitor open reminders across the team. Ping handlers, reassign on the fly, and clear out the day.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadData}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50"
              >
                ↻ Refresh
              </button>
              <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                Dashboard
              </Link>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`text-left bg-white rounded-xl border p-4 transition-all ${filter === 'all' ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
              <div className="text-xs text-gray-500 mt-1">Total Open</div>
            </button>
            <button
              onClick={() => setFilter('overdue')}
              className={`text-left rounded-xl border p-4 transition-all ${filter === 'overdue' ? 'border-red-500 ring-2 ring-red-100 bg-red-50' : 'bg-white border-red-100 hover:border-red-300'}`}
            >
              <div className="text-2xl font-bold text-red-700">{summary.overdue}</div>
              <div className="text-xs text-gray-500 mt-1">🔴 Overdue</div>
            </button>
            <button
              onClick={() => setFilter('today')}
              className={`text-left rounded-xl border p-4 transition-all ${filter === 'today' ? 'border-amber-500 ring-2 ring-amber-100 bg-amber-50' : 'bg-white border-amber-100 hover:border-amber-300'}`}
            >
              <div className="text-2xl font-bold text-amber-700">{summary.today}</div>
              <div className="text-xs text-gray-500 mt-1">🟡 Due Today</div>
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`text-left rounded-xl border p-4 transition-all ${filter === 'upcoming' ? 'border-green-500 ring-2 ring-green-100 bg-green-50' : 'bg-white border-green-100 hover:border-green-300'}`}
            >
              <div className="text-2xl font-bold text-green-700">{summary.upcoming}</div>
              <div className="text-xs text-gray-500 mt-1">🟢 Upcoming</div>
            </button>
          </div>

          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div className="mb-4 flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3">
              <span className="text-sm font-medium text-indigo-900">
                {selectedIds.size} reminder{selectedIds.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openReassignModal(Array.from(selectedIds), `${selectedIds.size} selected`)}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700"
                >
                  🔄 Reassign all
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="px-3 py-1.5 border border-gray-300 text-sm text-gray-700 rounded hover:bg-white"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-16 text-gray-400">Loading reminders...</div>
          ) : grouped.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <div className="text-5xl mb-3">🎉</div>
              <p className="text-gray-700 font-medium">No reminders match this filter</p>
              <p className="text-sm text-gray-500 mt-1">Everyone is on top of things.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {grouped.map(group => {
                const isCollapsed = collapsedAssignees.has(group.uid);
                const overdueCount = group.reminders.filter(r => r._due <= now).length;
                const todayCount = group.reminders.filter(r => r._due > now && r._due <= endOfToday).length;
                const upcomingCount = group.reminders.filter(r => r._due > endOfToday).length;
                const groupIds = group.reminders.map(r => r.id!);
                const allSelectedInGroup = groupIds.every(id => selectedIds.has(id));

                return (
                  <div key={group.uid} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {/* Group header */}
                    <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleAssigneeCollapse(group.uid)}
                          className="text-gray-500 hover:text-gray-700"
                          title={isCollapsed ? 'Expand' : 'Collapse'}
                        >
                          <svg className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <input
                          type="checkbox"
                          checked={allSelectedInGroup}
                          onChange={() => selectAllForAssignee(groupIds)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          title="Select all in group"
                        />
                        <h3 className="text-base font-semibold text-gray-900">{group.name}</h3>
                        <span className="text-sm text-gray-500">({group.reminders.length})</span>
                        {overdueCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">🔴 {overdueCount}</span>
                        )}
                        {todayCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">🟡 {todayCount}</span>
                        )}
                        {upcomingCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">🟢 {upcomingCount}</span>
                        )}
                      </div>
                      <button
                        onClick={() => openReassignModal(groupIds, group.name)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Reassign all from {group.name} →
                      </button>
                    </div>

                    {/* Reminder rows */}
                    {!isCollapsed && (
                      <div className="divide-y divide-gray-100">
                        {group.reminders.map(r => {
                          const dueColor = getDueColor(r._due);
                          const pingCount = r.pingHistory?.length || 0;
                          return (
                            <div key={r.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.has(r.id!)}
                                  onChange={() => toggleSelect(r.id!)}
                                  className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span>{getEntityIcon(r)}</span>
                                    <span className="text-sm font-medium text-gray-900">{r.message}</span>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${dueColor}`}>
                                      {getDueLabel(r._due)}
                                    </span>
                                    {r.status === 'snoozed' && (
                                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">😴 Snoozed</span>
                                    )}
                                    {pingCount > 0 && (
                                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700" title={`Pinged ${pingCount} time${pingCount !== 1 ? 's' : ''}`}>
                                        📨 {pingCount}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {r.entityLabel || r.orderNumber || '—'}
                                    {r.createdBy && <span> · created by {r.createdBy}</span>}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => openPingModal(r)}
                                    disabled={working === r.id}
                                    className="px-2.5 py-1 text-xs font-medium bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                                    title="Send email ping to assignee"
                                  >
                                    📨 Ping
                                  </button>
                                  <button
                                    onClick={() => openReassignModal([r.id!], r.assignedToName || group.name)}
                                    disabled={working === r.id}
                                    className="px-2.5 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 disabled:opacity-50"
                                    title="Reassign to another handler"
                                  >
                                    🔄
                                  </button>
                                  <button
                                    onClick={() => handleSnooze(r.id!, 24)}
                                    disabled={working === r.id}
                                    className="px-2.5 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50"
                                    title="Snooze 24h"
                                  >
                                    😴 24h
                                  </button>
                                  <button
                                    onClick={() => handleDismiss(r.id!)}
                                    disabled={working === r.id}
                                    className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                                    title="Mark as completed"
                                  >
                                    ✓ Done
                                  </button>
                                  <Link
                                    href={getEntityUrl(r)}
                                    className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                    title="Open entity"
                                  >
                                    Open →
                                  </Link>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Reassign modal */}
      {reassignTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reassign reminders</h3>
            <p className="text-sm text-gray-600 mb-4">
              Move {reassignTarget.ids.length} reminder{reassignTarget.ids.length !== 1 ? 's' : ''} from{' '}
              <strong>{reassignTarget.sourceLabel}</strong> to:
            </p>
            <select
              value={reassignTo}
              onChange={(e) => setReassignTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a handler...</option>
              {adminUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.displayName || u.email} {u.role ? `(${u.role})` : ''}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setReassignTarget(null); setReassignTo(''); }}
                className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReassign}
                disabled={!reassignTo || working === 'reassign'}
                className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {working === 'reassign' ? 'Reassigning...' : 'Reassign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ping modal */}
      {pingTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">📨 Ping handler</h3>
            <p className="text-sm text-gray-600 mb-1">
              Send an email reminder to <strong>{pingTarget.assignedToName}</strong> about:
            </p>
            <p className="text-sm bg-gray-50 border border-gray-200 rounded px-3 py-2 mb-4 text-gray-800">
              {pingTarget.message}
            </p>
            <label className="block text-xs text-gray-600 mb-1">Optional note (will be included in the email)</label>
            <textarea
              value={pingNote}
              onChange={(e) => setPingNote(e.target.value)}
              rows={3}
              placeholder="e.g. Customer called twice, needs status update by EOD"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500"
            />
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setPingTarget(null); setPingNote(''); }}
                className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={sendPing}
                disabled={sendingPing}
                className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {sendingPing ? 'Sending...' : '📨 Send Ping'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}

export default ManagerPage;

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
