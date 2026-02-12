import { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  getAllVisaAddons,
  saveVisaAddon,
  deleteVisaAddon,
  VisaAddon,
  AddonCategory,
  AddonRequiredField,
  ADDON_CATEGORY_LABELS,
} from '@/firebase/visaAddonService';

const EMPTY_ADDON: Partial<VisaAddon> = {
  name: '',
  nameEn: '',
  description: '',
  descriptionEn: '',
  adminNotes: '',
  icon: '📋',
  price: 0,
  category: 'other',
  perTraveler: true,
  applicableCountries: ['all'],
  applicableCategories: ['all'],
  applicableProductIds: ['all'],
  required: false,
  enabled: true,
  sortOrder: 100,
  requiredFields: [],
};

const EMPTY_FIELD: AddonRequiredField = {
  id: '',
  label: '',
  labelEn: '',
  type: 'text',
  placeholder: '',
  placeholderEn: '',
  required: true,
};

function AdminVisaAddonsPage() {
  const { currentUser } = useAuth();
  const [addons, setAddons] = useState<VisaAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingAddon, setEditingAddon] = useState<Partial<VisaAddon> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const adminName = currentUser?.displayName || currentUser?.email || 'Admin';

  useEffect(() => {
    loadAddons();
  }, []);

  const loadAddons = async () => {
    setLoading(true);
    try {
      const data = await getAllVisaAddons();
      setAddons(data);
    } catch (err) {
      toast.error('Failed to load addons');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingAddon) return;
    if (!editingAddon.nameEn?.trim()) {
      toast.error('English name is required');
      return;
    }
    setSaving(true);
    try {
      const id = await saveVisaAddon(editingAddon, adminName);
      toast.success(isCreating ? 'Addon created' : 'Addon updated');
      setEditingAddon(null);
      setIsCreating(false);
      await loadAddons();
    } catch (err) {
      toast.error('Failed to save addon');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (addonId: string) => {
    if (!confirm('Are you sure you want to delete this addon? This cannot be undone.')) return;
    setDeletingId(addonId);
    try {
      await deleteVisaAddon(addonId);
      toast.success('Addon deleted');
      setAddons(prev => prev.filter(a => a.id !== addonId));
    } catch (err) {
      toast.error('Failed to delete addon');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleEnabled = async (addon: VisaAddon) => {
    try {
      await saveVisaAddon({ id: addon.id, enabled: !addon.enabled }, adminName);
      setAddons(prev => prev.map(a => a.id === addon.id ? { ...a, enabled: !a.enabled } : a));
      toast.success(addon.enabled ? 'Addon disabled' : 'Addon enabled');
    } catch (err) {
      toast.error('Failed to toggle addon');
    }
  };

  const updateEditField = (field: string, value: any) => {
    setEditingAddon(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const addRequiredField = () => {
    const fields = editingAddon?.requiredFields || [];
    const newField: AddonRequiredField = {
      ...EMPTY_FIELD,
      id: `field_${Date.now()}`,
    };
    updateEditField('requiredFields', [...fields, newField]);
  };

  const updateRequiredField = (index: number, field: string, value: any) => {
    const fields = [...(editingAddon?.requiredFields || [])];
    fields[index] = { ...fields[index], [field]: value };
    updateEditField('requiredFields', fields);
  };

  const removeRequiredField = (index: number) => {
    const fields = (editingAddon?.requiredFields || []).filter((_, i) => i !== index);
    updateEditField('requiredFields', fields);
  };

  // Parse comma-separated string to array, handling "all"
  const parseArrayField = (value: string): string[] => {
    const trimmed = value.trim();
    if (trimmed.toLowerCase() === 'all') return ['all'];
    return trimmed.split(',').map(s => s.trim()).filter(Boolean);
  };

  const arrayToString = (arr: string[]): string => {
    if (arr.length === 1 && arr[0] === 'all') return 'all';
    return arr.join(', ');
  };

  return (
    <>
      <Head>
        <title>Visa Add-on Services - Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                  ← Admin
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">🧩 Visa Add-on Services</h1>
              <p className="text-gray-600 mt-1">
                Manage add-on services offered alongside visa products (e.g., Svensklistan registration, photo services)
              </p>
            </div>
            <button
              onClick={() => {
                setEditingAddon({ ...EMPTY_ADDON });
                setIsCreating(true);
              }}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
            >
              + Create Addon
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="text-gray-500 mt-3">Loading addons...</p>
            </div>
          )}

          {/* Addons List */}
          {!loading && !editingAddon && (
            <>
              {addons.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                  <p className="text-4xl mb-4">🧩</p>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No add-on services yet</h3>
                  <p className="text-gray-600 mb-6">Create your first add-on service to offer alongside visa products.</p>
                  <button
                    onClick={() => {
                      setEditingAddon({ ...EMPTY_ADDON });
                      setIsCreating(true);
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
                  >
                    + Create First Addon
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {addons.map((addon) => (
                    <div
                      key={addon.id}
                      className={`bg-white rounded-xl shadow-sm border p-6 transition-all ${
                        !addon.enabled ? 'opacity-60 border-gray-200' : 'border-emerald-100'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <span className="text-3xl">{addon.icon}</span>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold text-gray-900">{addon.nameEn}</h3>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                addon.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {addon.enabled ? 'Active' : 'Disabled'}
                              </span>
                              {addon.required && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  Required
                                </span>
                              )}
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {ADDON_CATEGORY_LABELS[addon.category]?.icon} {ADDON_CATEGORY_LABELS[addon.category]?.label}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{addon.descriptionEn}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="font-semibold text-emerald-700">{addon.price} kr</span>
                              <span>{addon.perTraveler ? 'Per traveler' : 'Per order'}</span>
                              <span>Countries: {arrayToString(addon.applicableCountries)}</span>
                              <span>Categories: {arrayToString(addon.applicableCategories)}</span>
                              {addon.requiredFields?.length > 0 && (
                                <span>{addon.requiredFields.length} extra field(s)</span>
                              )}
                              <span className="text-gray-400">Sort: {addon.sortOrder}</span>
                            </div>
                            {addon.adminNotes && (
                              <p className="text-xs text-amber-700 mt-2 bg-amber-50 px-2 py-1 rounded">
                                📝 {addon.adminNotes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleEnabled(addon)}
                            className={`px-3 py-1.5 rounded text-sm font-medium ${
                              addon.enabled
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {addon.enabled ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => {
                              setEditingAddon({ ...addon });
                              setIsCreating(false);
                            }}
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(addon.id)}
                            disabled={deletingId === addon.id}
                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200 disabled:opacity-50"
                          >
                            {deletingId === addon.id ? '...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Edit/Create Form */}
          {editingAddon && (
            <div className="bg-white rounded-xl shadow-sm border p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {isCreating ? '✨ Create New Add-on Service' : `✏️ Edit: ${editingAddon.nameEn || 'Addon'}`}
              </h2>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon (emoji)</label>
                    <input
                      type="text"
                      value={editingAddon.icon || ''}
                      onChange={(e) => updateEditField('icon', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="📋"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={editingAddon.category || 'other'}
                      onChange={(e) => updateEditField('category', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      {Object.entries(ADDON_CATEGORY_LABELS).map(([key, val]) => (
                        <option key={key} value={key}>{val.icon} {val.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Names */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name (Swedish) 🇸🇪</label>
                    <input
                      type="text"
                      value={editingAddon.name || ''}
                      onChange={(e) => updateEditField('name', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="e.g., Registrering på Svensklistan"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name (English) 🇬🇧 *</label>
                    <input
                      type="text"
                      value={editingAddon.nameEn || ''}
                      onChange={(e) => updateEditField('nameEn', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="e.g., Svensklistan Registration"
                    />
                  </div>
                </div>

                {/* Descriptions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (Swedish) 🇸🇪</label>
                    <textarea
                      value={editingAddon.description || ''}
                      onChange={(e) => updateEditField('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Beskrivning som visas för kunden..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (English) 🇬🇧</label>
                    <textarea
                      value={editingAddon.descriptionEn || ''}
                      onChange={(e) => updateEditField('descriptionEn', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Description shown to the customer..."
                    />
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes (internal only)</label>
                  <textarea
                    value={editingAddon.adminNotes || ''}
                    onChange={(e) => updateEditField('adminNotes', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Internal notes for staff..."
                  />
                </div>

                {/* Price & Billing */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (SEK incl. VAT)</label>
                    <input
                      type="number"
                      value={editingAddon.price || 0}
                      onChange={(e) => updateEditField('price', Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Billing</label>
                    <select
                      value={editingAddon.perTraveler ? 'per-traveler' : 'per-order'}
                      onChange={(e) => updateEditField('perTraveler', e.target.value === 'per-traveler')}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="per-traveler">Per traveler</option>
                      <option value="per-order">Per order</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={editingAddon.sortOrder || 100}
                      onChange={(e) => updateEditField('sortOrder', Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      min={0}
                    />
                  </div>
                </div>

                {/* Applicability Rules */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">📍 Applicability Rules</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Countries (comma-separated codes, or &quot;all&quot;)
                      </label>
                      <input
                        type="text"
                        value={arrayToString(editingAddon.applicableCountries || ['all'])}
                        onChange={(e) => updateEditField('applicableCountries', parseArrayField(e.target.value))}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                        placeholder="all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Visa categories (comma-separated, or &quot;all&quot;)
                      </label>
                      <input
                        type="text"
                        value={arrayToString(editingAddon.applicableCategories || ['all'])}
                        onChange={(e) => updateEditField('applicableCategories', parseArrayField(e.target.value))}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                        placeholder="all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Product IDs (comma-separated, or &quot;all&quot;)
                      </label>
                      <input
                        type="text"
                        value={arrayToString(editingAddon.applicableProductIds || ['all'])}
                        onChange={(e) => updateEditField('applicableProductIds', parseArrayField(e.target.value))}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                        placeholder="all"
                      />
                    </div>
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingAddon.enabled ?? true}
                      onChange={(e) => updateEditField('enabled', e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Enabled</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingAddon.required ?? false}
                      onChange={(e) => updateEditField('required', e.target.checked)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Required (auto-selected, cannot deselect)</span>
                  </label>
                </div>

                {/* Required Fields */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">📝 Extra Fields (collected from customer)</h3>
                    <button
                      onClick={addRequiredField}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      + Add Field
                    </button>
                  </div>
                  {(editingAddon.requiredFields || []).length === 0 ? (
                    <p className="text-sm text-gray-500">No extra fields. The addon will use existing order data only.</p>
                  ) : (
                    <div className="space-y-3">
                      {(editingAddon.requiredFields || []).map((field, idx) => (
                        <div key={field.id || idx} className="bg-white rounded-lg p-3 border flex gap-3 items-start">
                          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                            <input
                              type="text"
                              value={field.labelEn}
                              onChange={(e) => updateRequiredField(idx, 'labelEn', e.target.value)}
                              placeholder="Label (EN)"
                              className="px-2 py-1.5 border rounded text-sm"
                            />
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) => updateRequiredField(idx, 'label', e.target.value)}
                              placeholder="Label (SV)"
                              className="px-2 py-1.5 border rounded text-sm"
                            />
                            <select
                              value={field.type}
                              onChange={(e) => updateRequiredField(idx, 'type', e.target.value)}
                              className="px-2 py-1.5 border rounded text-sm"
                            >
                              <option value="text">Text</option>
                              <option value="email">Email</option>
                              <option value="phone">Phone</option>
                              <option value="date">Date</option>
                              <option value="textarea">Textarea</option>
                              <option value="select">Select</option>
                            </select>
                            <label className="flex items-center gap-1 text-sm">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => updateRequiredField(idx, 'required', e.target.checked)}
                                className="rounded"
                              />
                              Required
                            </label>
                          </div>
                          <button
                            onClick={() => removeRequiredField(idx)}
                            className="text-red-500 hover:text-red-700 px-2 py-1"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : isCreating ? 'Create Addon' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingAddon(null);
                      setIsCreating(false);
                    }}
                    className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function ProtectedAdminVisaAddonsPage() {
  return (
    <ProtectedRoute>
      <AdminVisaAddonsPage />
    </ProtectedRoute>
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
