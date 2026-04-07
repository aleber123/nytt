/**
 * Admin Email Templates — Process Map + Template Editor
 *
 * Shows all automated emails in a visual process flow,
 * lets admin preview and edit email content.
 */

import { useState, useEffect, useMemo } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import {
  EmailTemplate,
  EmailCategory,
  EmailDesignSettings,
  getAllEmailTemplates,
  updateEmailTemplateContent,
  seedEmailTemplates,
  getEmailDesignSettings,
  saveEmailDesignSettings,
  DEFAULT_EMAIL_TEMPLATES,
  DEFAULT_DESIGN_SETTINGS,
} from '@/firebase/emailTemplateService';

// ============================================================
// CONSTANTS
// ============================================================

const CATEGORY_CONFIG: Record<EmailCategory, { label: string; color: string; icon: string }> = {
  'order-confirmation': { label: 'Order Confirmation', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '📦' },
  'visa-status':        { label: 'Visa Status',        color: 'bg-green-100 text-green-800 border-green-200', icon: '🛂' },
  'document-handling':  { label: 'Documents',          color: 'bg-amber-100 text-amber-800 border-amber-200', icon: '📄' },
  'shipping':           { label: 'Shipping',           color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '🚚' },
  'billing':            { label: 'Billing',            color: 'bg-rose-100 text-rose-800 border-rose-200', icon: '💰' },
  'custom':             { label: 'Other',              color: 'bg-gray-100 text-gray-800 border-gray-200', icon: '✉️' },
  'internal':           { label: 'Internal',           color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: '👥' },
};

const TRIGGER_LABELS: Record<string, { label: string; color: string }> = {
  automatic: { label: 'Automatic', color: 'bg-emerald-100 text-emerald-700' },
  manual:    { label: 'Manual',    color: 'bg-sky-100 text-sky-700' },
  scheduled: { label: 'Scheduled', color: 'bg-violet-100 text-violet-700' },
};

const PROCESS_GROUPS = [
  { id: 'Beställning',       label: 'Order',               icon: '🛒', step: 1, color: 'border-blue-400 bg-blue-50' },
  { id: 'Dokumenthantering', label: 'Document Handling',    icon: '📋', step: 2, color: 'border-amber-400 bg-amber-50' },
  { id: 'Handläggning',      label: 'Processing',          icon: '⚙️', step: 5, color: 'border-green-400 bg-green-50' },
  { id: 'Resultat',          label: 'Result',              icon: '🎯', step: 7, color: 'border-indigo-400 bg-indigo-50' },
  { id: 'Leverans',          label: 'Delivery',            icon: '📬', step: 8, color: 'border-purple-400 bg-purple-50' },
  { id: 'Övriga',            label: 'Other',               icon: '✉️', step: 0, color: 'border-gray-400 bg-gray-50' },
  { id: 'Internal',          label: 'Internal Communication', icon: '👥', step: 99, color: 'border-indigo-500 bg-indigo-50' },
];

// ============================================================
// MAIN PAGE
// ============================================================

export default function EmailTemplatesPage() {
  const { currentUser } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [view, setView] = useState<'process' | 'list' | 'design'>('process');
  const [filterCategory, setFilterCategory] = useState<EmailCategory | 'all'>('all');
  const [seeding, setSeeding] = useState(false);
  const [designSettings, setDesignSettings] = useState<EmailDesignSettings>(DEFAULT_DESIGN_SETTINGS);

  useEffect(() => {
    if (currentUser) {
      loadTemplates();
      loadDesignSettings();
    }
  }, [currentUser]);

  const loadDesignSettings = async () => {
    try {
      const settings = await getEmailDesignSettings();
      setDesignSettings(settings);
    } catch {
      // Use defaults
    }
  };

  const handleSaveDesignSettings = async (settings: EmailDesignSettings) => {
    try {
      await saveEmailDesignSettings(settings);
      setDesignSettings(settings);
      toast.success('Design settings saved!');
    } catch {
      toast.error('Failed to save design settings');
    }
  };

  const loadTemplates = async () => {
    try {
      setLoading(true);
      let data = await getAllEmailTemplates();
      if (data.length === 0) {
        // Auto-seed on first visit
        try {
          await seedEmailTemplates();
          data = await getAllEmailTemplates();
        } catch {
          // Firestore might not be ready, use local defaults
          data = DEFAULT_EMAIL_TEMPLATES.map(t => ({
            ...t,
            createdAt: null,
            updatedAt: null,
          })) as EmailTemplate[];
        }
      }
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
      // Fall back to local defaults so the page still works
      const fallback = DEFAULT_EMAIL_TEMPLATES.map(t => ({
        ...t,
        createdAt: null,
        updatedAt: null,
      })) as EmailTemplate[];
      setTemplates(fallback);
      toast.error('Loaded from local defaults — Firestore unavailable');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedTemplates = async () => {
    setSeeding(true);
    try {
      const result = await seedEmailTemplates();
      const parts: string[] = [];
      if (result.created > 0) parts.push(`${result.created} created`);
      if (result.refreshed > 0) parts.push(`${result.refreshed} refreshed`);
      if (result.preservedCustomized > 0) parts.push(`${result.preservedCustomized} customized preserved`);
      toast.success(parts.length ? parts.join(', ') : 'No changes');
      await loadTemplates();
    } catch (error) {
      toast.error('Failed to sync templates');
    } finally {
      setSeeding(false);
    }
  };

  const handleSaveTemplate = async (template: EmailTemplate) => {
    try {
      await updateEmailTemplateContent(template.id, {
        subjectSv: template.subjectSv,
        subjectEn: template.subjectEn,
        bodySv: template.bodySv,
        bodyEn: template.bodyEn,
        useCustomTemplate: template.useCustomTemplate ?? false,
        lastEditedBy: currentUser?.email || 'unknown',
      });
      toast.success('Template saved!');
      setSelectedTemplate(null);
      await loadTemplates();
    } catch (error) {
      toast.error('Failed to save template');
    }
  };

  const filteredTemplates = useMemo(() => {
    if (filterCategory === 'all') return templates;
    return templates.filter(t => t.category === filterCategory);
  }, [templates, filterCategory]);

  // Group templates by processGroup for the flow view
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, EmailTemplate[]> = {};
    for (const pg of PROCESS_GROUPS) {
      groups[pg.id] = [];
    }
    for (const t of filteredTemplates) {
      const group = groups[t.processGroup];
      if (group) group.push(t);
      else if (groups['Övriga']) groups['Övriga'].push(t);
    }
    return groups;
  }, [filteredTemplates]);

  return (
    <ProtectedRoute requiredPermission="canManageOrders">
      <Head>
        <title>Email Templates - Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700 mb-1 inline-block">
                &larr; Back to Admin
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Email Templates &amp; Process Flow</h1>
              <p className="text-gray-600 mt-1">
                All automated emails sent to customers. Edit content and view the process flow.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSeedTemplates}
                disabled={seeding}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                {seeding ? 'Syncing...' : 'Sync Templates'}
              </button>
              <span className="text-sm text-gray-500">{templates.length} templates</span>
            </div>
          </div>

          {/* View Toggle + Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex bg-white border rounded-lg overflow-hidden">
              <button
                onClick={() => setView('process')}
                className={`px-4 py-2 text-sm font-medium ${view === 'process' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Process Map
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-4 py-2 text-sm font-medium ${view === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                List View
              </button>
              <button
                onClick={() => setView('design')}
                className={`px-4 py-2 text-sm font-medium ${view === 'design' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Design Settings
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-3 py-1.5 text-xs rounded-full border ${filterCategory === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
              >
                All ({templates.length})
              </button>
              {(Object.entries(CATEGORY_CONFIG) as [EmailCategory, typeof CATEGORY_CONFIG[EmailCategory]][]).map(([key, cfg]) => {
                const count = templates.filter(t => t.category === key).length;
                if (count === 0) return null;
                return (
                  <button
                    key={key}
                    onClick={() => setFilterCategory(key)}
                    className={`px-3 py-1.5 text-xs rounded-full border ${filterCategory === key ? 'bg-gray-800 text-white border-gray-800' : `${cfg.color} hover:opacity-80`}`}
                  >
                    {cfg.icon} {cfg.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-500">Loading templates...</div>
          ) : view === 'design' ? (
            <DesignSettingsPanel
              settings={designSettings}
              onSave={handleSaveDesignSettings}
            />
          ) : view === 'process' ? (
            <ProcessMapView
              groups={groupedTemplates}
              onSelect={setSelectedTemplate}
            />
          ) : (
            <ListView
              templates={filteredTemplates}
              onSelect={setSelectedTemplate}
            />
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {selectedTemplate && (
        <TemplateEditorModal
          template={selectedTemplate}
          onSave={handleSaveTemplate}
          onClose={() => setSelectedTemplate(null)}
        />
      )}
    </ProtectedRoute>
  );
}

// ============================================================
// PROCESS MAP VIEW
// ============================================================

function ProcessMapView({
  groups,
  onSelect,
}: {
  groups: Record<string, EmailTemplate[]>;
  onSelect: (t: EmailTemplate) => void;
}) {
  const activeGroups = PROCESS_GROUPS.filter(pg => (groups[pg.id] || []).length > 0);

  return (
    <div className="space-y-0">
      {activeGroups.map((pg, idx) => (
        <div key={pg.id}>
          {/* Connector arrow */}
          {idx > 0 && (
            <div className="flex justify-center">
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-4 bg-gray-300" />
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <div className="w-0.5 h-2 bg-gray-300" />
              </div>
            </div>
          )}

          {/* Process group */}
          <div className={`border-2 rounded-xl p-5 ${pg.color}`}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{pg.icon}</span>
              <h3 className="text-lg font-bold text-gray-800">{pg.label}</h3>
              <span className="text-xs bg-white bg-opacity-60 px-2 py-0.5 rounded text-gray-600 ml-2">
                {(groups[pg.id] || []).length} {(groups[pg.id] || []).length === 1 ? 'email' : 'emails'}
              </span>
              <span className="text-xs text-gray-500 ml-auto">
                Step {pg.step > 0 ? pg.step : '—'}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(groups[pg.id] || []).map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onClick={() => onSelect(template)}
                />
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="mt-8 bg-white border rounded-xl p-5">
        <h4 className="font-medium text-gray-700 mb-3">Legend</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          {Object.entries(TRIGGER_LABELS).map(([key, cfg]) => (
            <span key={key} className={`px-3 py-1 rounded-full ${cfg.color}`}>
              {cfg.label}
            </span>
          ))}
          <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-300">
            Customized
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// LIST VIEW
// ============================================================

function ListView({
  templates,
  onSelect,
}: {
  templates: EmailTemplate[];
  onSelect: (t: EmailTemplate) => void;
}) {
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Trigger</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Subject (SV)</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            <th className="text-right px-4 py-3 font-medium text-gray-600">Action</th>
          </tr>
        </thead>
        <tbody>
          {templates.map(t => {
            const catCfg = CATEGORY_CONFIG[t.category];
            const trigCfg = TRIGGER_LABELS[t.trigger] || TRIGGER_LABELS.manual;
            return (
              <tr
                key={t.id}
                className="border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => onSelect(t)}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{t.nameEn}</div>
                  <div className="text-xs text-gray-500">{t.descriptionEn}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs border ${catCfg.color}`}>
                    {catCfg.icon} {catCfg.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${trigCfg.color}`}>
                    {trigCfg.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">
                  {t.subjectSv}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {t.isCustomized ? (
                      <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700 border border-yellow-300 inline-block w-fit">
                        Customized
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500 inline-block w-fit">
                        Default
                      </span>
                    )}
                    {t.useCustomTemplate && (
                      <span className="px-2 py-0.5 rounded text-xs bg-emerald-600 text-white font-bold inline-block w-fit">
                        ✓ NEW system active
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-primary-600 hover:text-primary-700 font-medium">
                    Edit
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// TEMPLATE CARD (for process map)
// ============================================================

function TemplateCard({
  template,
  onClick,
}: {
  template: EmailTemplate;
  onClick: () => void;
}) {
  const trigCfg = TRIGGER_LABELS[template.trigger] || TRIGGER_LABELS.manual;
  const catCfg = CATEGORY_CONFIG[template.category];

  return (
    <button
      onClick={onClick}
      className="bg-white border rounded-lg p-4 text-left hover:shadow-md hover:border-primary-300 transition-all group w-full"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-lg">{catCfg.icon}</span>
        <div className="flex gap-1">
          <span className={`px-1.5 py-0.5 rounded text-[10px] ${trigCfg.color}`}>
            {trigCfg.label}
          </span>
          {template.isCustomized && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-100 text-yellow-700">
              Customized
            </span>
          )}
          {template.useCustomTemplate && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-600 text-white font-bold" title="New editable template is active">
              ✓ NEW
            </span>
          )}
        </div>
      </div>
      <h4 className="font-semibold text-gray-900 text-sm group-hover:text-primary-700">
        {template.nameEn}
      </h4>
      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
        {template.descriptionEn}
      </p>
      <div className="mt-2 text-xs text-gray-400 truncate">
        Subject: {template.subjectSv}
      </div>
    </button>
  );
}

// ============================================================
// TEMPLATE EDITOR MODAL
// ============================================================

function TemplateEditorModal({
  template,
  onSave,
  onClose,
}: {
  template: EmailTemplate;
  onSave: (t: EmailTemplate) => void;
  onClose: () => void;
}) {
  const [editData, setEditData] = useState({
    subjectSv: template.subjectSv,
    subjectEn: template.subjectEn,
    bodySv: template.bodySv,
    bodyEn: template.bodyEn,
    useCustomTemplate: template.useCustomTemplate ?? false,
  });
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'info'>('edit');
  const [lang, setLang] = useState<'sv' | 'en'>('sv');

  const catCfg = CATEGORY_CONFIG[template.category];
  const trigCfg = TRIGGER_LABELS[template.trigger] || TRIGGER_LABELS.manual;

  const handleSave = () => {
    onSave({
      ...template,
      ...editData,
    });
  };

  const hasChanges =
    editData.subjectSv !== template.subjectSv ||
    editData.subjectEn !== template.subjectEn ||
    editData.bodySv !== template.bodySv ||
    editData.bodyEn !== template.bodyEn ||
    editData.useCustomTemplate !== (template.useCustomTemplate ?? false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{catCfg.icon}</span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{template.nameEn}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`px-2 py-0.5 rounded text-xs border ${catCfg.color}`}>
                  {catCfg.label}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs ${trigCfg.color}`}>
                  {trigCfg.label}
                </span>
                {template.isCustomized && (
                  <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700">
                    Customized
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 py-2 border-b flex items-center gap-4">
          {[
            { id: 'edit' as const, label: 'Edit' },
            { id: 'preview' as const, label: 'Preview' },
            { id: 'info' as const, label: 'Details' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-[9px] ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <div className="ml-auto flex bg-gray-100 rounded-lg overflow-hidden">
            <button
              onClick={() => setLang('sv')}
              className={`px-3 py-1 text-xs font-medium ${lang === 'sv' ? 'bg-gray-800 text-white' : 'text-gray-600'}`}
            >
              SV
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1 text-xs font-medium ${lang === 'en' ? 'bg-gray-800 text-white' : 'text-gray-600'}`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'edit' && (
            <div className="space-y-5">
              {/* Feature flag — opt in to the new editable renderer */}
              <div className={`rounded-lg border p-4 ${
                editData.useCustomTemplate
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editData.useCustomTemplate}
                    onChange={(e) => setEditData(prev => ({ ...prev, useCustomTemplate: e.target.checked }))}
                    className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">Use this editable template</span>
                      {editData.useCustomTemplate && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white">ACTIVE</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      When enabled, sent emails use the subject and body below.{' '}
                      When disabled (default), the legacy hardcoded sender runs unchanged — safe to A/B test.
                      {!template.useCustomTemplate && (
                        <span className="block mt-1 text-amber-700">
                          ⚠️ Currently disabled — your edits below will <strong>not</strong> affect outgoing emails until you enable this and click Save.
                        </span>
                      )}
                    </p>
                  </div>
                </label>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject ({lang === 'sv' ? 'Swedish' : 'English'})
                </label>
                <input
                  type="text"
                  value={lang === 'sv' ? editData.subjectSv : editData.subjectEn}
                  onChange={(e) =>
                    setEditData(prev => ({
                      ...prev,
                      [lang === 'sv' ? 'subjectSv' : 'subjectEn']: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Body Text ({lang === 'sv' ? 'Swedish' : 'English'})
                </label>
                <textarea
                  value={lang === 'sv' ? editData.bodySv : editData.bodyEn}
                  onChange={(e) =>
                    setEditData(prev => ({
                      ...prev,
                      [lang === 'sv' ? 'bodySv' : 'bodyEn']: e.target.value,
                    }))
                  }
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {'{{variableName}}'} for dynamic content &mdash; see the &quot;Details&quot; tab for available variables.
                </p>
              </div>

              {/* Variables quick reference */}
              {template.variables.length > 0 && (
                <div className="bg-gray-50 border rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Available Variables</h4>
                  <div className="flex flex-wrap gap-2">
                    {template.variables.map(v => (
                      <button
                        key={v.key}
                        onClick={() => {
                          const key = lang === 'sv' ? 'bodySv' : 'bodyEn';
                          setEditData(prev => ({
                            ...prev,
                            [key]: prev[key] + `{{${v.key}}}`,
                          }));
                        }}
                        className="px-2 py-1 bg-white border rounded text-xs text-gray-700 hover:bg-gray-100 font-mono"
                        title={v.description}
                      >
                        {`{{${v.key}}}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'preview' && (
            <EmailPreview
              subject={lang === 'sv' ? editData.subjectSv : editData.subjectEn}
              body={lang === 'sv' ? editData.bodySv : editData.bodyEn}
              variables={template.variables}
              lang={lang}
              category={template.category}
            />
          )}

          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Description */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-1">About this email</h4>
                <p className="text-sm text-blue-700">{template.descriptionEn}</p>
              </div>

              {/* Trigger info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Trigger</h4>
                  <span className={`px-2 py-1 rounded text-sm ${trigCfg.color}`}>
                    {trigCfg.label}
                  </span>
                  <p className="text-xs text-gray-500 mt-2 font-mono">{template.triggerEvent}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Process Step</h4>
                  <p className="text-sm text-gray-800">
                    {PROCESS_GROUPS.find(pg => pg.id === template.processGroup)?.label || template.processGroup}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Step {template.processStep}</p>
                </div>
              </div>

              {/* Source */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Source Code Reference</h4>
                <p className="text-xs font-mono text-gray-600">{template.sourceFile}</p>
                <p className="text-xs font-mono text-gray-500">{template.sourceFunction}()</p>
              </div>

              {/* Variables */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Template Variables</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-gray-600">Variable</th>
                      <th className="text-left py-2 text-gray-600">Description</th>
                      <th className="text-left py-2 text-gray-600">Example</th>
                    </tr>
                  </thead>
                  <tbody>
                    {template.variables.map(v => (
                      <tr key={v.key} className="border-b border-gray-100">
                        <td className="py-2 font-mono text-xs text-primary-700">{`{{${v.key}}}`}</td>
                        <td className="py-2 text-gray-700">{v.description}</td>
                        <td className="py-2 text-gray-500 text-xs">{v.example}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Last edited */}
              {template.lastEditedBy && (
                <div className="text-xs text-gray-500">
                  Last edited by: {template.lastEditedBy}
                  {template.lastEditedAt && (
                    <> &mdash; {new Date(template.lastEditedAt?.seconds * 1000).toLocaleString('sv-SE')}</>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between rounded-b-2xl">
          <div className="text-sm text-gray-500">
            {hasChanges && (
              <span className="text-amber-600 font-medium">Unsaved changes</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 bg-white border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="px-6 py-2 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// EMAIL PREVIEW
// ============================================================

function EmailPreview({
  subject,
  body,
  variables,
  lang,
  category,
}: {
  subject: string;
  body: string;
  variables: { key: string; example: string }[];
  lang: 'sv' | 'en';
  category: EmailCategory;
}) {
  // Legalization emails use SWE format, visa emails use VISA format
  const isLegalizationEmail = category === 'order-confirmation' && !subject.toLowerCase().includes('visa');
  const sampleOrderNumber = isLegalizationEmail ? 'SWE000325' : 'VISA000451';
  // Replace variables with example values
  let previewBody = body;
  let previewSubject = subject;
  for (const v of variables) {
    const regex = new RegExp(`\\{\\{${v.key}\\}\\}`, 'g');
    previewBody = previewBody.replace(regex, `<span style="background:#fef3c7;padding:2px 6px;border-radius:3px;font-weight:700">${v.example}</span>`);
    previewSubject = previewSubject.replace(regex, v.example);
  }

  const isEn = lang === 'en';

  return (
    <div className="border rounded-xl overflow-hidden shadow-sm">
      {/* Gmail-style email header bar */}
      <div className="bg-gray-100 px-4 py-3 border-b text-sm space-y-1">
        <div><span className="text-gray-500">From:</span> DOX Visumpartner &lt;info@doxvl.se&gt;</div>
        <div><span className="text-gray-500">To:</span> customer@example.com</div>
        <div><span className="text-gray-500">Subject:</span> <strong>{previewSubject}</strong></div>
      </div>

      {/* Actual email body — matches real email structure */}
      <div style={{ background: '#f8f9fa', padding: 20, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif", lineHeight: 1.6, color: '#202124' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', background: '#ffffff', borderRadius: 12, boxShadow: '0 2px 6px rgba(0,0,0,0.08)', overflow: 'hidden' }}>

          {/* Header — matches new wrapEmail() output. Clean logo, no border. */}
          <div style={{ background: '#2E2D2C', color: '#ffffff', padding: '32px 36px 24px', textAlign: 'center', borderBottom: '2px solid #2E2D2C' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-new.png"
              alt="DOX Visumpartner AB"
              style={{ height: 53, width: 'auto', display: 'inline-block', border: 0 }}
            />
            <h1 style={{ margin: '20px 0 0', fontSize: 22, fontWeight: 700, letterSpacing: 0.2, color: '#ffffff' }}>
              {previewSubject}
            </h1>
            <p style={{ color: '#ffffff', opacity: 0.8, margin: '8px 0 0' }}>
              {isEn ? 'Update for your order with DOX Visumpartner AB' : 'Uppdatering för din order hos DOX Visumpartner AB'}
            </p>
          </div>

          {/* Content */}
          <div style={{ padding: '32px 36px' }}>
            {/* Greeting */}
            <div style={{ fontSize: 17, fontWeight: 600, color: '#202124', marginBottom: 16 }}>
              {isEn ? 'Dear' : 'Hej'}{' '}
              <span style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: 3 }}>Erik</span>{isEn ? ',' : '!'}
            </div>

            {/* Body text */}
            <div
              style={{ fontSize: 15, lineHeight: 1.6 }}
              dangerouslySetInnerHTML={{ __html: previewBody }}
            />

            {/* Order summary box */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 20, margin: '20px 0' }}>
              <div style={{ background: '#0EB0A6', color: '#fff', padding: '10px 16px', borderRadius: 6, display: 'inline-block', fontWeight: 700, fontSize: 15, margin: '0 0 12px' }}>
                {isEn ? 'Order number' : 'Ordernummer'}: #<span style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: 3, color: '#92400e' }}>{sampleOrderNumber}</span>
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eaecef' }}>
                  <span style={{ fontWeight: 500, color: '#5f6368' }}>{isEn ? 'Date' : 'Datum'}:</span>
                  <span style={{ fontWeight: 700, color: '#202124' }}>2026-03-31</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eaecef' }}>
                  <span style={{ fontWeight: 500, color: '#5f6368' }}>{isEn ? 'Destination' : 'Destination'}:</span>
                  <span style={{ fontWeight: 700, color: '#202124' }}>Thailand</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ fontWeight: 500, color: '#5f6368' }}>{isEn ? 'Visa type' : 'Visumtyp'}:</span>
                  <span style={{ fontWeight: 700, color: '#202124' }}>{isEn ? 'Tourist Visa 60 days' : 'Turistvisum 60 dagar'}</span>
                </div>
              </div>
            </div>

            {/* Tracking box */}
            <div style={{ background: '#f0fdf4', border: '2px solid #22c55e', borderRadius: 8, padding: 20, margin: '22px 0', textAlign: 'center' }}>
              <h3 style={{ color: '#166534', margin: '0 0 10px', fontSize: 17 }}>
                📍 {isEn ? 'Track Your Order' : 'Följ din order'}
              </h3>
              <p style={{ color: '#15803d', margin: '0 0 14px', fontSize: 14 }}>
                {isEn ? 'Follow the progress of your visa application in real-time:' : 'Följ ditt visumärende i realtid:'}
              </p>
              <span style={{ display: 'inline-block', background: '#22c55e', color: '#fff', padding: '12px 28px', borderRadius: 6, fontWeight: 700, fontSize: 15 }}>
                {isEn ? 'Track Order Status' : 'Se orderstatus'}
              </span>
            </div>

            {/* Contact info */}
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: 18, margin: '22px 0', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 8px' }}>{isEn ? 'Questions?' : 'Har du frågor?'}</h3>
              <p style={{ margin: 0 }}>{isEn ? 'Feel free to contact us:' : 'Kontakta oss gärna:'}</p>
              <p style={{ margin: '8px 0 0' }}>📧 info@doxvl.se &nbsp; 📞 08-40941900</p>
            </div>
          </div>

          {/* Footer */}
          <div style={{ background: '#f8f9fa', padding: '24px 36px', textAlign: 'center', borderTop: '1px solid #eaecef' }}>
            <p style={{ margin: '5px 0', color: '#5f6368', fontSize: 13 }}><strong>DOX Visumpartner AB</strong></p>
            <p style={{ margin: '5px 0', color: '#5f6368', fontSize: 13 }}>
              {isEn ? 'Professional visa & document legalisation services' : 'Professionella visum- & legaliseringstjänster'}
            </p>
            <p style={{ margin: '5px 0', color: '#5f6368', fontSize: 13 }}>
              {isEn ? 'This is an automatically generated message.' : 'Detta är ett automatiskt genererat meddelande.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DESIGN SETTINGS PANEL
// ============================================================

function DesignSettingsPanel({
  settings,
  onSave,
}: {
  settings: EmailDesignSettings;
  onSave: (s: EmailDesignSettings) => void;
}) {
  const [draft, setDraft] = useState<EmailDesignSettings>(settings);
  const [previewLang, setPreviewLang] = useState<'sv' | 'en'>('sv');

  const update = (key: keyof EmailDesignSettings, value: string | number | boolean) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(settings);

  const isEn = previewLang === 'en';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Settings Form */}
      <div className="space-y-6">
        {/* Header Settings */}
        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-bold text-gray-900 mb-4">Header</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
              <input
                type="text"
                value={draft.logoUrl}
                onChange={e => update('logoUrl', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">Use a transparent PNG or SVG. For retina displays, export at 2× the height below.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo link URL</label>
              <input
                type="text"
                value={draft.logoLinkUrl}
                onChange={e => update('logoLinkUrl', e.target.value)}
                placeholder="https://doxvl.se"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">Where the logo links to when clicked in the email.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Logo height (px)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="24"
                    max="80"
                    value={draft.logoHeight}
                    onChange={e => update('logoHeight', Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs font-mono text-gray-600 w-10 text-right">{draft.logoHeight}px</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Logo alignment</label>
                <div className="flex bg-gray-100 rounded-lg overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => update('logoAlign', 'left')}
                    className={`flex-1 py-1.5 font-medium ${draft.logoAlign === 'left' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                  >
                    ⇤ Left
                  </button>
                  <button
                    type="button"
                    onClick={() => update('logoAlign', 'center')}
                    className={`flex-1 py-1.5 font-medium ${draft.logoAlign === 'center' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                  >
                    ⇔ Center
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.showLogo}
                  onChange={e => update('showLogo', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Show logo</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.showHeaderTitle}
                  onChange={e => update('showHeaderTitle', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Show email subject under logo</span>
              </label>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Background</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={draft.headerBackground} onChange={e => update('headerBackground', e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                  <input type="text" value={draft.headerBackground} onChange={e => update('headerBackground', e.target.value)} className="flex-1 px-2 py-1 border rounded text-xs font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Text Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={draft.headerTextColor} onChange={e => update('headerTextColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                  <input type="text" value={draft.headerTextColor} onChange={e => update('headerTextColor', e.target.value)} className="flex-1 px-2 py-1 border rounded text-xs font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Border</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={draft.headerBorderColor} onChange={e => update('headerBorderColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                  <input type="text" value={draft.headerBorderColor} onChange={e => update('headerBorderColor', e.target.value)} className="flex-1 px-2 py-1 border rounded text-xs font-mono" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-bold text-gray-900 mb-4">Colors</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Primary (buttons, links)</label>
              <div className="flex items-center gap-2">
                <input type="color" value={draft.primaryColor} onChange={e => update('primaryColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                <input type="text" value={draft.primaryColor} onChange={e => update('primaryColor', e.target.value)} className="flex-1 px-2 py-1 border rounded text-xs font-mono" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Success (approve, track)</label>
              <div className="flex items-center gap-2">
                <input type="color" value={draft.successColor} onChange={e => update('successColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                <input type="text" value={draft.successColor} onChange={e => update('successColor', e.target.value)} className="flex-1 px-2 py-1 border rounded text-xs font-mono" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Danger (reject, decline)</label>
              <div className="flex items-center gap-2">
                <input type="color" value={draft.dangerColor} onChange={e => update('dangerColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                <input type="text" value={draft.dangerColor} onChange={e => update('dangerColor', e.target.value)} className="flex-1 px-2 py-1 border rounded text-xs font-mono" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-bold text-gray-900 mb-4">Footer</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Background</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={draft.footerBackground} onChange={e => update('footerBackground', e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                  <input type="text" value={draft.footerBackground} onChange={e => update('footerBackground', e.target.value)} className="flex-1 px-2 py-1 border rounded text-xs font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Text Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={draft.footerTextColor} onChange={e => update('footerTextColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                  <input type="text" value={draft.footerTextColor} onChange={e => update('footerTextColor', e.target.value)} className="flex-1 px-2 py-1 border rounded text-xs font-mono" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Company Name</label>
              <input type="text" value={draft.companyName} onChange={e => update('companyName', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tagline (SV)</label>
                <input type="text" value={draft.companyTagline} onChange={e => update('companyTagline', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tagline (EN)</label>
                <input type="text" value={draft.companyTaglineEn} onChange={e => update('companyTaglineEn', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-bold text-gray-900 mb-4">Contact Info</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input type="email" value={draft.contactEmail} onChange={e => update('contactEmail', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input type="text" value={draft.contactPhone} onChange={e => update('contactPhone', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Postal Address</label>
            <textarea value={draft.postalAddress} onChange={e => update('postalAddress', e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
        </div>

        {/* Layout */}
        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-bold text-gray-900 mb-4">Layout</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Max Width (px)</label>
              <input type="number" value={draft.bodyMaxWidth} onChange={e => update('bodyMaxWidth', parseInt(e.target.value) || 600)} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Border Radius (px)</label>
              <input type="number" value={draft.borderRadius} onChange={e => update('borderRadius', parseInt(e.target.value) || 12)} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {hasChanges && <span className="text-amber-600 text-sm font-medium">Unsaved changes</span>}
            <button
              type="button"
              onClick={() => {
                if (confirm('Reset all design settings to defaults? This will overwrite logo, colors, header, footer, and contact info.')) {
                  setDraft(DEFAULT_DESIGN_SETTINGS);
                }
              }}
              className="px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              ↺ Reset to defaults
            </button>
          </div>
          <button
            onClick={() => onSave(draft)}
            disabled={!hasChanges}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            Save Design Settings
          </button>
        </div>
      </div>

      {/* Live Preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Live Preview</h3>
          <div className="flex bg-gray-100 rounded-lg overflow-hidden">
            <button onClick={() => setPreviewLang('sv')} className={`px-3 py-1 text-xs font-medium ${previewLang === 'sv' ? 'bg-gray-800 text-white' : 'text-gray-600'}`}>SV</button>
            <button onClick={() => setPreviewLang('en')} className={`px-3 py-1 text-xs font-medium ${previewLang === 'en' ? 'bg-gray-800 text-white' : 'text-gray-600'}`}>EN</button>
          </div>
        </div>

        <div className="border rounded-xl overflow-hidden shadow-sm sticky top-8">
          {/* Rendered email preview using draft settings */}
          <div style={{ background: '#f8f9fa', padding: 20, fontFamily: draft.fontFamily, lineHeight: 1.6, color: '#202124' }}>
            <div style={{ maxWidth: draft.bodyMaxWidth, margin: '0 auto', background: '#ffffff', borderRadius: draft.borderRadius, boxShadow: '0 2px 6px rgba(0,0,0,0.08)', overflow: 'hidden' }}>

              {/* Header */}
              <div style={{ background: draft.headerBackground, color: draft.headerTextColor, padding: '32px 36px 24px', textAlign: draft.logoAlign, borderBottom: `2px solid ${draft.headerBorderColor}` }}>
                {draft.showLogo && draft.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={draft.logoUrl}
                    alt={draft.companyName}
                    style={{ height: draft.logoHeight, width: 'auto', display: 'inline-block', border: 0 }}
                  />
                )}
                {draft.showHeaderTitle && (
                  <>
                    <h1 style={{ margin: `${draft.showLogo ? 20 : 0}px 0 0`, fontSize: 22, fontWeight: 700, letterSpacing: 0.2, color: draft.headerTextColor }}>
                      {isEn ? 'Your visa application has been submitted' : 'Din visumansökan har skickats in'}
                    </h1>
                    <p style={{ color: draft.headerTextColor, opacity: 0.8, margin: '8px 0 0' }}>
                      {isEn ? 'Update for your order with' : 'Uppdatering för din order hos'} {draft.companyName}
                    </p>
                  </>
                )}
              </div>

              {/* Content */}
              <div style={{ padding: '32px 36px' }}>
                <div style={{ fontSize: 17, fontWeight: 600, color: '#202124', marginBottom: 16 }}>
                  {isEn ? 'Dear Erik,' : 'Hej Erik!'}
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.6, margin: '0 0 16px' }}>
                  {isEn
                    ? 'We have now submitted your visa application for Thailand through the official visa portal.'
                    : 'Vi har nu skickat in din visumansökan för Thailand via den officiella visumportalen.'}
                </p>

                {/* Status box */}
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 18, margin: '20px 0' }}>
                  <p style={{ margin: 0, fontSize: 15 }}>
                    🌐 <strong>{isEn ? 'Status:' : 'Status:'}</strong> {isEn ? 'Application submitted' : 'Ansökan inskickad'}
                  </p>
                </div>

                {/* Order summary */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 20, margin: '20px 0' }}>
                  <div style={{ background: draft.primaryColor, color: '#fff', padding: '10px 16px', borderRadius: 6, display: 'inline-block', fontWeight: 700, fontSize: 15 }}>
                    {isEn ? 'Order number' : 'Ordernummer'}: #VISA000451
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eaecef' }}>
                      <span style={{ fontWeight: 500, color: '#5f6368' }}>{isEn ? 'Date' : 'Datum'}:</span>
                      <span style={{ fontWeight: 700, color: '#202124' }}>2026-03-31</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                      <span style={{ fontWeight: 500, color: '#5f6368' }}>{isEn ? 'Destination' : 'Destination'}:</span>
                      <span style={{ fontWeight: 700, color: '#202124' }}>Thailand</span>
                    </div>
                  </div>
                </div>

                {/* Tracking */}
                <div style={{ background: '#f0fdf4', border: `2px solid ${draft.successColor}`, borderRadius: 8, padding: 20, margin: '22px 0', textAlign: 'center' }}>
                  <h3 style={{ color: '#166534', margin: '0 0 10px', fontSize: 17 }}>
                    📍 {isEn ? 'Track Your Order' : 'Följ din order'}
                  </h3>
                  <span style={{ display: 'inline-block', background: draft.successColor, color: '#fff', padding: '12px 28px', borderRadius: 6, fontWeight: 700, fontSize: 15 }}>
                    {isEn ? 'Track Order Status' : 'Se orderstatus'}
                  </span>
                </div>

                {/* Contact */}
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: 18, margin: '22px 0', textAlign: 'center' }}>
                  <h3 style={{ margin: '0 0 8px' }}>{isEn ? 'Questions?' : 'Har du frågor?'}</h3>
                  <p style={{ margin: 0 }}>{isEn ? 'Feel free to contact us:' : 'Kontakta oss gärna:'}</p>
                  <p style={{ margin: '8px 0 0' }}>📧 <span style={{ color: draft.primaryColor }}>{draft.contactEmail}</span> &nbsp; 📞 {draft.contactPhone}</p>
                </div>
              </div>

              {/* Footer */}
              <div style={{ background: draft.footerBackground, padding: '24px 36px', textAlign: 'center', borderTop: '1px solid #eaecef' }}>
                <p style={{ margin: '5px 0', color: draft.footerTextColor, fontSize: 13 }}><strong>{draft.companyName}</strong></p>
                <p style={{ margin: '5px 0', color: draft.footerTextColor, fontSize: 13 }}>{isEn ? draft.companyTaglineEn : draft.companyTagline}</p>
                <p style={{ margin: '5px 0', color: draft.footerTextColor, fontSize: 13 }}>{isEn ? draft.autoGeneratedNoteEn : draft.autoGeneratedNote}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SSR
// ============================================================

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'sv', ['common'])),
    },
  };
};
