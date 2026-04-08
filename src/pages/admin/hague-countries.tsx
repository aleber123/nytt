/**
 * Hague Convention Countries Admin
 *
 * Manages the dynamic list of countries that are part of the Hague Apostille
 * Convention. Add or remove countries when membership changes — no code deploy
 * needed. The order flow reads this list to decide whether apostille is shown.
 *
 * Restricted to roles with canManageVisaRequirements (super_admin + admin).
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
import { ALL_COUNTRIES } from '@/components/order/data/countries';
import {
  getAllHagueCountries,
  addHagueCountry,
  updateHagueCountry,
  removeHagueCountry,
  seedHagueCountries,
  type HagueCountry,
} from '@/firebase/hagueConventionService';
import { invalidateHagueCache } from '@/hooks/useHagueCountries';

function HagueCountriesPage() {
  const { adminUser, currentUser } = useAuth();
  const [countries, setCountries] = useState<HagueCountry[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [editing, setEditing] = useState<HagueCountry | null>(null);

  const actorName = adminUser?.displayName || currentUser?.email || 'Admin';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllHagueCountries();
      // If empty, auto-seed from defaults the first time
      if (data.length === 0) {
        const result = await seedHagueCountries(actorName);
        if (result.created > 0) {
          toast.success(`Seeded ${result.created} default countries`);
        }
        const fresh = await getAllHagueCountries();
        setCountries(fresh);
      } else {
        setCountries(data);
      }
      invalidateHagueCache();
    } catch (err) {
      console.error('Failed to load Hague countries', err);
      toast.error('Failed to load countries');
    } finally {
      setLoading(false);
    }
  }, [actorName]);

  useEffect(() => { load(); }, [load]);

  const enabledCount = useMemo(() => countries.filter(c => c.enabled !== false).length, [countries]);

  const filtered = useMemo(() => {
    let list = [...countries];
    if (!showInactive) list = list.filter(c => c.enabled !== false);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.nameEn || '').toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => (a.nameEn || a.name).localeCompare(b.nameEn || b.name));
  }, [countries, search, showInactive]);

  const handleAdd = async (countryCode: string, joinedDate: string, notes: string) => {
    try {
      await addHagueCountry({ code: countryCode, joinedDate, notes }, actorName);
      toast.success(`${countryCode} added to the Hague list`);
      setShowAddModal(false);
      await load();
    } catch (err) {
      toast.error('Failed to add country');
    }
  };

  const handleToggleEnabled = async (country: HagueCountry) => {
    const newEnabled = country.enabled === false;
    const action = newEnabled ? 'restored' : 'removed from the list';
    if (!confirm(`${newEnabled ? 'Restore' : 'Remove'} ${country.nameEn || country.name}?`)) return;
    try {
      if (newEnabled) {
        await updateHagueCountry(country.code, { enabled: true }, actorName);
      } else {
        await removeHagueCountry(country.code, actorName);
      }
      toast.success(`${country.nameEn || country.name} ${action}`);
      await load();
    } catch (err) {
      toast.error('Failed to update country');
    }
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    try {
      await updateHagueCountry(editing.code, {
        joinedDate: editing.joinedDate || '',
        notes: editing.notes || '',
      }, actorName);
      toast.success('Saved');
      setEditing(null);
      await load();
    } catch (err) {
      toast.error('Failed to save');
    }
  };

  const handleSyncDefaults = async () => {
    if (!confirm('Sync defaults from the hardcoded list? Existing entries will not be overwritten — only missing ones added.')) return;
    setSeeding(true);
    try {
      const result = await seedHagueCountries(actorName);
      toast.success(`Sync complete: ${result.created} added, ${result.skipped} unchanged`);
      await load();
    } catch (err) {
      toast.error('Sync failed');
    } finally {
      setSeeding(false);
    }
  };

  // For the add modal: pre-built option list of countries NOT yet on the Hague list
  const existingCodes = useMemo(() => new Set(countries.map(c => c.code.toUpperCase())), [countries]);
  const candidates = useMemo(
    () => ALL_COUNTRIES.filter(c => c.code !== 'other' && !existingCodes.has(c.code.toUpperCase())),
    [existingCodes]
  );

  return (
    <ProtectedRoute requiredPermission="canManageVisaRequirements">
      <Head>
        <title>Hague Convention Countries — Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700 mb-1 inline-block">
                &larr; Back to Admin
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Hague Convention Countries</h1>
              <p className="text-gray-600 mt-1">
                Manage which countries accept apostille legalization. Changes take effect immediately on the order flow.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSyncDefaults}
                disabled={seeding}
                className="text-sm px-3 py-2 border border-gray-300 rounded-md hover:bg-white text-gray-700 disabled:opacity-50"
              >
                {seeding ? 'Syncing...' : '↻ Sync defaults'}
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-sm px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium"
              >
                + Add country
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-emerald-100 rounded-xl p-4">
              <div className="text-2xl font-bold text-emerald-700">{enabledCount}</div>
              <div className="text-xs text-gray-500 mt-1">Active members</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-2xl font-bold text-gray-700">{countries.length - enabledCount}</div>
              <div className="text-xs text-gray-500 mt-1">Inactive (soft-removed)</div>
            </div>
            <div className="bg-white border border-blue-100 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-700">{ALL_COUNTRIES.length - 1 - enabledCount}</div>
              <div className="text-xs text-gray-500 mt-1">Non-Hague countries</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code or name..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500"
            />
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded"
              />
              Show inactive
            </label>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-16 text-gray-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-500">
              {search ? 'No countries match this search.' : 'No countries yet — click + Add country to start.'}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left">Country</th>
                      <th className="px-4 py-3 text-left whitespace-nowrap">Code</th>
                      <th className="px-4 py-3 text-left whitespace-nowrap">Joined</th>
                      <th className="px-4 py-3 text-left">Notes</th>
                      <th className="px-4 py-3 text-left whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((country) => (
                      <tr key={country.code} className={country.enabled === false ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <CountryFlag code={country.code} size={24} />
                            <div>
                              <div className="font-medium text-gray-900">{country.nameEn || country.name}</div>
                              {country.name !== country.nameEn && (
                                <div className="text-xs text-gray-500">{country.name}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">{country.code}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{country.joinedDate || '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 max-w-[260px] truncate" title={country.notes || ''}>
                          {country.notes || '—'}
                        </td>
                        <td className="px-4 py-3">
                          {country.enabled === false ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">Inactive</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Active</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => setEditing(country)}
                            className="text-xs px-2.5 py-1 text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleEnabled(country)}
                            className={`text-xs px-2.5 py-1 font-medium ${
                              country.enabled === false
                                ? 'text-emerald-600 hover:text-emerald-800'
                                : 'text-red-600 hover:text-red-800'
                            }`}
                          >
                            {country.enabled === false ? 'Restore' : 'Remove'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add modal */}
      {showAddModal && (
        <AddCountryModal
          candidates={candidates}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
        />
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <CountryFlag code={editing.code} size={28} />
              <div>
                <h3 className="text-lg font-bold text-gray-900">{editing.nameEn || editing.name}</h3>
                <span className="text-xs text-gray-500 font-mono">{editing.code}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Joined date</label>
                <input
                  type="date"
                  value={editing.joinedDate || ''}
                  onChange={(e) => setEditing({ ...editing, joinedDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes (internal)</label>
                <textarea
                  value={editing.notes || ''}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  rows={3}
                  placeholder="e.g. Joined recently — verify with embassy"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}

function AddCountryModal({
  candidates,
  onClose,
  onAdd,
}: {
  candidates: { code: string; name: string; nameEn?: string; flag?: string }[];
  onClose: () => void;
  onAdd: (code: string, joinedDate: string, notes: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [joinedDate, setJoinedDate] = useState('');
  const [notes, setNotes] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return candidates.slice(0, 50);
    const q = search.toLowerCase();
    return candidates
      .filter(c =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.nameEn || '').toLowerCase().includes(q)
      )
      .slice(0, 50);
  }, [candidates, search]);

  const selected = candidates.find(c => c.code === selectedCode);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[92vh] flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Add country to Hague list</h3>

        {!selected ? (
          <>
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country name or code..."
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 mb-3"
            />
            <div className="flex-1 overflow-y-auto border border-gray-200 rounded">
              {filtered.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No countries found</div>
              ) : (
                filtered.map(c => (
                  <button
                    key={c.code}
                    onClick={() => setSelectedCode(c.code)}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                  >
                    <CountryFlag code={c.code} size={20} />
                    <span className="text-sm flex-1">{c.nameEn || c.name}</span>
                    <span className="text-xs text-gray-400 font-mono">{c.code}</span>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4 p-3 bg-emerald-50 rounded">
              <CountryFlag code={selected.code} size={28} />
              <div className="flex-1">
                <div className="font-medium text-gray-900">{selected.nameEn || selected.name}</div>
                <div className="text-xs text-gray-500 font-mono">{selected.code}</div>
              </div>
              <button
                onClick={() => setSelectedCode(null)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Change
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Joined date (optional)</label>
                <input
                  type="date"
                  value={joinedDate}
                  onChange={(e) => setJoinedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. Joined April 2026 — confirmed via embassy"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          {selected && (
            <button
              onClick={() => onAdd(selected.code, joinedDate, notes)}
              className="px-4 py-2 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700"
            >
              Add to list
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default HagueCountriesPage;

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
