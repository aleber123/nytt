/**
 * Admin page for managing Visa Form Templates
 * 
 * Templates define which fields to collect from customers for each visa type/country.
 * Admin can create templates using predefined common fields or custom fields.
 */

import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import {
  getAllFormTemplates,
  saveFormTemplate,
  deleteFormTemplate,
  VisaFormTemplate,
  FormField,
  FormFieldGroup,
  DEFAULT_FIELD_GROUPS,
  COMMON_FIELDS,
  FormFieldType,
} from '@/firebase/visaFormService';

export default function VisaFormTemplatesPage() {
  const { currentUser } = useAuth();
  const [templates, setTemplates] = useState<VisaFormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<VisaFormTemplate | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await getAllFormTemplates();
      setTemplates(data);
    } catch {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditing({
      id: '',
      name: '',
      nameEn: '',
      countryCode: 'all',
      visaCategory: 'all',
      visaProductId: 'all',
      groups: [...DEFAULT_FIELD_GROUPS],
      fields: [],
      enabled: true,
      createdAt: '',
      updatedAt: '',
      updatedBy: '',
    });
    setShowEditor(true);
  };

  const handleEdit = (template: VisaFormTemplate) => {
    setEditing({ ...template });
    setShowEditor(true);
  };

  const handleDelete = async (template: VisaFormTemplate) => {
    if (!confirm(`Delete template "${template.nameEn || template.name}"?`)) return;
    try {
      await deleteFormTemplate(template.id);
      toast.success('Template deleted');
      loadTemplates();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Visa Form Templates - Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block">
                ← Back to Admin
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">📋 Visa Form Templates</h1>
              <p className="text-gray-600 mt-1">
                Configure which fields to collect from customers for each visa type
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
            >
              + Create Template
            </button>
          </div>

          {/* Template list */}
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : templates.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center">
              <p className="text-4xl mb-4">📋</p>
              <p className="text-gray-600 mb-4">No form templates yet. Create one to start collecting customer data.</p>
              <button onClick={handleCreate} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                + Create First Template
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {templates.map(t => (
                <div key={t.id} className="bg-white rounded-xl border p-5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{t.nameEn || t.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                        {t.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Country: <strong>{t.countryCode.toUpperCase()}</strong> | 
                      Category: <strong>{t.visaCategory}</strong> | 
                      Product: <strong>{t.visaProductId}</strong> | 
                      Fields: <strong>{t.fields.length}</strong>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(t)} className="px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">
                      ✏️ Edit
                    </button>
                    <button onClick={() => handleDelete(t)} className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Editor modal */}
          {showEditor && editing && (
            <TemplateEditor
              template={editing}
              onSave={async (updated) => {
                try {
                  await saveFormTemplate(updated, currentUser?.email || 'admin');
                  toast.success('Template saved');
                  setShowEditor(false);
                  setEditing(null);
                  loadTemplates();
                } catch {
                  toast.error('Failed to save template');
                }
              }}
              onClose={() => { setShowEditor(false); setEditing(null); }}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

// ============================================================
// TEMPLATE EDITOR COMPONENT
// ============================================================

interface TemplateEditorProps {
  template: VisaFormTemplate;
  onSave: (template: VisaFormTemplate) => Promise<void>;
  onClose: () => void;
}

function TemplateEditor({ template, onSave, onClose }: TemplateEditorProps) {
  const [data, setData] = useState<VisaFormTemplate>({ ...template });
  const [saving, setSaving] = useState(false);
  const [showFieldPicker, setShowFieldPicker] = useState(false);

  const handleSave = async () => {
    if (!data.name && !data.nameEn) {
      toast.error('Please enter a template name');
      return;
    }
    setSaving(true);
    try {
      await onSave(data);
    } finally {
      setSaving(false);
    }
  };

  const addCommonField = (fieldKey: string) => {
    const commonField = COMMON_FIELDS[fieldKey];
    if (!commonField) return;
    if (data.fields.some(f => f.id === commonField.id)) {
      toast.error('Field already added');
      return;
    }
    const newField: FormField = {
      ...commonField,
      sortOrder: data.fields.length + 1,
    };
    setData(prev => ({ ...prev, fields: [...prev.fields, newField] }));
  };

  const addCustomField = () => {
    const newField: FormField = {
      id: `custom_${Date.now()}`,
      label: '',
      labelEn: '',
      type: 'text',
      required: false,
      group: 'other',
      perTraveler: false,
      sortOrder: data.fields.length + 1,
    };
    setData(prev => ({ ...prev, fields: [...prev.fields, newField] }));
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    setData(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => i === index ? { ...f, ...updates } : f),
    }));
  };

  const removeField = (index: number) => {
    setData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...data.fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    newFields.forEach((f, i) => f.sortOrder = i + 1);
    setData(prev => ({ ...prev, fields: newFields }));
  };

  // Group fields for display
  const groupedFields: Record<string, { field: FormField; index: number }[]> = {};
  data.fields.forEach((field, index) => {
    if (!groupedFields[field.group]) groupedFields[field.group] = [];
    groupedFields[field.group].push({ field, index });
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {template.id ? 'Edit Template' : 'Create Template'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name (Swedish)</label>
              <input
                type="text"
                value={data.name}
                onChange={e => setData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., Indien Business e-Visum"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name (English)</label>
              <input
                type="text"
                value={data.nameEn}
                onChange={e => setData(prev => ({ ...prev, nameEn: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., India Business e-Visa"
              />
            </div>
          </div>

          {/* Matching rules */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Applicability Rules</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Country Code</label>
                <input
                  type="text"
                  value={data.countryCode}
                  onChange={e => setData(prev => ({ ...prev, countryCode: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="e.g., IN or all"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Visa Category</label>
                <input
                  type="text"
                  value={data.visaCategory}
                  onChange={e => setData(prev => ({ ...prev, visaCategory: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="e.g., business or all"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Product ID</label>
                <input
                  type="text"
                  value={data.visaProductId}
                  onChange={e => setData(prev => ({ ...prev, visaProductId: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="e.g., specific ID or all"
                />
              </div>
            </div>
          </div>

          {/* Enabled toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.enabled}
              onChange={e => setData(prev => ({ ...prev, enabled: e.target.checked }))}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-gray-700">Enabled</span>
          </label>

          {/* Fields section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Form Fields ({data.fields.length})</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFieldPicker(!showFieldPicker)}
                  className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                >
                  + Add Common Field
                </button>
                <button
                  onClick={addCustomField}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  + Custom Field
                </button>
              </div>
            </div>

            {/* Common field picker */}
            {showFieldPicker && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-purple-900 mb-2">Select common fields to add:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(COMMON_FIELDS).map(([key, field]) => {
                    const alreadyAdded = data.fields.some(f => f.id === field.id);
                    return (
                      <button
                        key={key}
                        onClick={() => addCommonField(key)}
                        disabled={alreadyAdded}
                        className={`text-left px-3 py-2 rounded-lg text-sm border transition-all ${
                          alreadyAdded
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-purple-400 hover:bg-purple-50'
                        }`}
                      >
                        <span className="font-medium">{field.labelEn}</span>
                        <span className="text-xs text-gray-500 block">{field.group} • {field.type}{field.perTraveler ? ' • per traveler' : ''}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setShowFieldPicker(false)}
                  className="mt-3 text-sm text-purple-600 hover:text-purple-800"
                >
                  Close picker
                </button>
              </div>
            )}

            {/* Field list grouped */}
            {data.fields.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                No fields added yet. Use the buttons above to add fields.
              </p>
            ) : (
              <div className="space-y-2">
                {data.fields
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((field, idx) => (
                    <div key={field.id + idx} className="bg-gray-50 rounded-lg p-3 border">
                      <div className="flex items-start gap-3">
                        {/* Sort controls */}
                        <div className="flex flex-col gap-0.5 pt-1">
                          <button onClick={() => moveField(idx, 'up')} className="text-gray-400 hover:text-gray-600 text-xs">▲</button>
                          <button onClick={() => moveField(idx, 'down')} className="text-gray-400 hover:text-gray-600 text-xs">▼</button>
                        </div>
                        
                        {/* Field config */}
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-0.5">Label (EN)</label>
                            <input
                              type="text"
                              value={field.labelEn}
                              onChange={e => updateField(idx, { labelEn: e.target.value })}
                              className="w-full px-2 py-1 border rounded text-sm"
                              placeholder="English label"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-0.5">Label (SV)</label>
                            <input
                              type="text"
                              value={field.label}
                              onChange={e => updateField(idx, { label: e.target.value })}
                              className="w-full px-2 py-1 border rounded text-sm"
                              placeholder="Swedish label"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-0.5">Type</label>
                            <select
                              value={field.type}
                              onChange={e => updateField(idx, { type: e.target.value as FormFieldType })}
                              className="w-full px-2 py-1 border rounded text-sm"
                            >
                              <option value="text">Text</option>
                              <option value="email">Email</option>
                              <option value="phone">Phone</option>
                              <option value="date">Date</option>
                              <option value="textarea">Textarea</option>
                              <option value="select">Select</option>
                              <option value="file">File Upload</option>
                              <option value="photo">Photo</option>
                              <option value="checkbox">Checkbox</option>
                              <option value="personnummer">Personnummer</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-0.5">Group</label>
                            <select
                              value={field.group}
                              onChange={e => updateField(idx, { group: e.target.value })}
                              className="w-full px-2 py-1 border rounded text-sm"
                            >
                              {DEFAULT_FIELD_GROUPS.map(g => (
                                <option key={g.id} value={g.id}>{g.icon} {g.labelEn}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Toggles */}
                        <div className="flex flex-col gap-1 pt-1">
                          <label className="flex items-center gap-1 text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={e => updateField(idx, { required: e.target.checked })}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            Required
                          </label>
                          <label className="flex items-center gap-1 text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.perTraveler}
                              onChange={e => updateField(idx, { perTraveler: e.target.checked })}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            Per traveler
                          </label>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeField(idx)}
                          className="text-red-400 hover:text-red-600 text-sm pt-1"
                          title="Remove field"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const i18nConfig = {
    i18n: { defaultLocale: 'sv', locales: ['sv', 'en'], localeDetection: false as const },
  };
  return {
    props: {
      ...(await serverSideTranslations(locale || 'sv', ['common'], i18nConfig)),
    },
  };
};
