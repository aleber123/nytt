import React, { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import {
  getAllVisaRequirements,
  setVisaRequirement,
  updateVisaRequirement,
  deleteVisaRequirement,
  setNationalityRule,
  removeNationalityRule,
  updateProductDocumentRequirements,
  getDefaultDocumentRequirements,
  VisaRequirement,
  VisaType,
  VisaCategory,
  VisaProduct,
  NationalityRule,
  DocumentRequirement,
  DocumentType
} from '@/firebase/visaRequirementsService';
import { ALL_COUNTRIES } from '@/components/order/data/countries';

const VISA_TYPE_LABELS: Record<VisaType, { label: string; color: string; description: string }> = {
  'e-visa': { label: 'E-Visa', color: 'bg-green-100 text-green-800', description: 'Electronic visa, no passport shipping needed' },
  'sticker': { label: 'Sticker Visa', color: 'bg-blue-100 text-blue-800', description: 'Traditional visa stamped in passport' },
  'both': { label: 'Both Options', color: 'bg-purple-100 text-purple-800', description: 'Customer can choose e-visa or sticker' },
  'not-required': { label: 'Visa Free', color: 'bg-gray-100 text-gray-800', description: 'No visa required for this combination' },
  'not-supported': { label: 'Not Supported', color: 'bg-red-100 text-red-800', description: 'We cannot help with this destination' }
};

const VISA_CATEGORY_LABELS: Record<string, { label: string; labelSv: string; color: string }> = {
  'tourist': { label: 'Tourist', labelSv: 'Turist', color: 'bg-sky-100 text-sky-800' },
  'business': { label: 'Business', labelSv: 'Affärs', color: 'bg-amber-100 text-amber-800' },
  'transit': { label: 'Transit', labelSv: 'Transit', color: 'bg-slate-100 text-slate-800' },
  'student': { label: 'Student', labelSv: 'Student', color: 'bg-indigo-100 text-indigo-800' },
  'work': { label: 'Work', labelSv: 'Arbete', color: 'bg-orange-100 text-orange-800' },
  'medical': { label: 'Medical', labelSv: 'Medicinsk', color: 'bg-rose-100 text-rose-800' },
  'conference': { label: 'Conference', labelSv: 'Konferens', color: 'bg-teal-100 text-teal-800' },
  'non-immigrant': { label: 'Non-Immigrant', labelSv: 'Non-Immigrant', color: 'bg-violet-100 text-violet-800' },
  'other': { label: 'Other', labelSv: 'Övrigt', color: 'bg-gray-100 text-gray-800' }
};

function VisaRequirementsAdminPage() {
  const { currentUser } = useAuth();
  const [requirements, setRequirements] = useState<VisaRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<VisaType | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCountry, setEditingCountry] = useState<VisaRequirement | null>(null);
  const [editingTab, setEditingTab] = useState<'general' | 'products' | 'nationality'>('general');
  const [showBulkNationalityModal, setShowBulkNationalityModal] = useState(false);

  useEffect(() => {
    // Wait for user to be authenticated before loading
    if (currentUser) {
      loadRequirements();
    }
  }, [currentUser]);

  const loadRequirements = async () => {
    try {
      setLoading(true);
      const data = await getAllVisaRequirements();
      setRequirements(data);
    } catch (error) {
      toast.error('Could not load visa requirements');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCountry = async (data: Omit<VisaRequirement, 'id' | 'lastUpdated'>) => {
    try {
      setSaving(true);
      await setVisaRequirement(data);
      await loadRequirements();
      setShowAddModal(false);
      toast.success(`${data.countryName} added successfully!`);
    } catch (error) {
      toast.error('Could not add country');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCountry = async (countryCode: string, updates: Partial<VisaRequirement>) => {
    try {
      setSaving(true);
      await updateVisaRequirement(countryCode, {
        ...updates,
        updatedBy: currentUser?.email || 'admin'
      });
      await loadRequirements();
      setEditingCountry(null);
      toast.success('Country updated successfully!');
    } catch (error) {
      toast.error('Could not update country');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCountry = async (countryCode: string, countryName: string) => {
    if (!confirm(`Are you sure you want to delete ${countryName}?`)) return;
    
    try {
      setSaving(true);
      await deleteVisaRequirement(countryCode);
      await loadRequirements();
      toast.success(`${countryName} deleted!`);
    } catch (error) {
      toast.error('Could not delete country');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSupported = async (req: VisaRequirement) => {
    try {
      await updateVisaRequirement(req.countryCode, {
        isSupported: !req.isSupported,
        updatedBy: currentUser?.email || 'admin'
      });
      setRequirements(prev =>
        prev.map(r =>
          r.countryCode === req.countryCode
            ? { ...r, isSupported: !r.isSupported }
            : r
        )
      );
      toast.success(`${req.countryName} ${!req.isSupported ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Could not update status');
    }
  };

  const handleAddNationalityRule = async (countryCode: string, rule: NationalityRule) => {
    try {
      setSaving(true);
      await setNationalityRule(countryCode, rule, currentUser?.email || 'admin');
      const data = await getAllVisaRequirements();
      setRequirements(data);
      // Update editingCountry with fresh data
      const updatedCountry = data.find(r => r.countryCode === countryCode);
      if (updatedCountry) {
        setEditingCountry(updatedCountry);
      }
      toast.success('Nationality rule added!');
    } catch (error) {
      toast.error('Could not add nationality rule');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveNationalityRule = async (countryCode: string, nationalityCode: string) => {
    try {
      await removeNationalityRule(countryCode, nationalityCode, currentUser?.email || 'admin');
      const data = await getAllVisaRequirements();
      setRequirements(data);
      // Update editingCountry with fresh data
      const updatedCountry = data.find(r => r.countryCode === countryCode);
      if (updatedCountry) {
        setEditingCountry(updatedCountry);
      }
      toast.success('Nationality rule removed!');
    } catch (error) {
      toast.error('Could not remove nationality rule');
    }
  };

  const handleAddProduct = async (countryCode: string, product: VisaProduct) => {
    try {
      setSaving(true);
      const req = requirements.find(r => r.countryCode === countryCode);
      if (!req) return;
      
      const updatedProducts = [...(req.visaProducts || []), product];
      await updateVisaRequirement(countryCode, {
        visaProducts: updatedProducts,
        updatedBy: currentUser?.email || 'admin'
      });
      const data = await getAllVisaRequirements();
      setRequirements(data);
      const updatedCountry = data.find(r => r.countryCode === countryCode);
      if (updatedCountry) setEditingCountry(updatedCountry);
      toast.success('Visa product added!');
    } catch (error) {
      toast.error('Could not add visa product');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveProduct = async (countryCode: string, productId: string) => {
    try {
      const req = requirements.find(r => r.countryCode === countryCode);
      if (!req) return;
      
      const updatedProducts = (req.visaProducts || []).filter(p => p.id !== productId);
      await updateVisaRequirement(countryCode, {
        visaProducts: updatedProducts,
        updatedBy: currentUser?.email || 'admin'
      });
      const data = await getAllVisaRequirements();
      setRequirements(data);
      const updatedCountry = data.find(r => r.countryCode === countryCode);
      if (updatedCountry) setEditingCountry(updatedCountry);
      toast.success('Visa product removed!');
    } catch (error) {
      toast.error('Could not remove visa product');
    }
  };

  const handleUpdateProduct = async (countryCode: string, product: VisaProduct) => {
    try {
      setSaving(true);
      const req = requirements.find(r => r.countryCode === countryCode);
      if (!req) return;
      
      const updatedProducts = (req.visaProducts || []).map(p => 
        p.id === product.id ? product : p
      );
      await updateVisaRequirement(countryCode, {
        visaProducts: updatedProducts,
        updatedBy: currentUser?.email || 'admin'
      });
      const data = await getAllVisaRequirements();
      setRequirements(data);
      const updatedCountry = data.find(r => r.countryCode === countryCode);
      if (updatedCountry) setEditingCountry(updatedCountry);
      toast.success('Visa product updated!');
    } catch (error) {
      toast.error('Could not update visa product');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAddNationalityRules = async (
    countryCodes: string[],
    rule: NationalityRule
  ) => {
    try {
      setSaving(true);
      let successCount = 0;
      let errorCount = 0;
      
      for (const countryCode of countryCodes) {
        try {
          await setNationalityRule(countryCode, rule, currentUser?.email || 'admin');
          successCount++;
        } catch {
          errorCount++;
        }
      }
      
      await loadRequirements();
      
      if (errorCount === 0) {
        toast.success(`Added ${rule.nationalityName} rule to ${successCount} countries!`);
      } else {
        toast.success(`Added to ${successCount} countries, ${errorCount} failed`);
      }
      
      setShowBulkNationalityModal(false);
    } catch (error) {
      toast.error('Could not add bulk nationality rules');
    } finally {
      setSaving(false);
    }
  };

  const filteredRequirements = requirements.filter(req => {
    const matchesSearch = req.countryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.countryCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || req.defaultVisaType === filterType;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <Head>
        <title>Visa Requirements - Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Visa Requirements</h1>
            <p className="mt-2 text-gray-600">
              Manage visa types and rules for each destination country. Set up nationality-specific rules for different requirements.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <a
              href="/admin/visa-document-requirements"
              className="inline-flex items-center px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors"
            >
              <span className="mr-2">📋</span>
              Manage Document Requirements
              <span className="ml-2 text-xs bg-amber-200 px-2 py-0.5 rounded">Per visa product</span>
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-2xl font-bold text-gray-900">{requirements.length}</div>
              <div className="text-sm text-gray-600">Total Countries</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-2xl font-bold text-green-600">
                {requirements.filter(r => r.isSupported).length}
              </div>
              <div className="text-sm text-gray-600">Supported</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-2xl font-bold text-blue-600">
                {requirements.filter(r => r.defaultVisaType === 'e-visa' || r.defaultVisaType === 'both').length}
              </div>
              <div className="text-sm text-gray-600">E-Visa Available</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-2xl font-bold text-purple-600">
                {requirements.reduce((acc, r) => acc + (r.nationalityRules?.length || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Nationality Rules</div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">How visa types work</h3>
                <div className="mt-2 text-sm text-blue-700 space-y-1">
                  <p>• <strong>E-Visa</strong>: Electronic visa - no passport shipping needed, skip pickup/return steps</p>
                  <p>• <strong>Sticker Visa</strong>: Traditional visa stamped in passport - requires shipping</p>
                  <p>• <strong>Both</strong>: Customer can choose between e-visa or sticker visa</p>
                  <p>• <strong>Nationality Rules</strong>: Override default visa type for specific nationalities</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <input
                  type="text"
                  placeholder="Search countries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as VisaType | 'all')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Types</option>
                  {Object.entries(VISA_TYPE_LABELS).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBulkNationalityModal(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Bulk Nationality Rules
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Country
                </button>
              </div>
            </div>
          </div>

          {/* Countries Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Country
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Default Visa Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visa Products
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nationality Rules
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequirements.map((req) => (
                    <tr key={req.countryCode} className={!req.isSupported ? 'bg-gray-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {req.countryNameEn || req.countryName}
                            </div>
                            <div className="text-sm text-gray-500">{req.countryCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${VISA_TYPE_LABELS[req.defaultVisaType]?.color || 'bg-gray-100'}`}>
                          {VISA_TYPE_LABELS[req.defaultVisaType]?.label || req.defaultVisaType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {req.visaProducts?.slice(0, 3).map((product) => (
                            <span
                              key={product.id}
                              className={`inline-flex px-2 py-0.5 text-xs rounded ${VISA_CATEGORY_LABELS[product.category]?.color || 'bg-gray-100'}`}
                              title={`${product.name} - ${product.price} kr`}
                            >
                              {VISA_CATEGORY_LABELS[product.category]?.label || product.category}
                            </span>
                          ))}
                          {(req.visaProducts?.length || 0) > 3 && (
                            <span className="text-xs text-gray-500">
                              +{(req.visaProducts?.length || 0) - 3} more
                            </span>
                          )}
                          {!req.visaProducts?.length && (
                            <span className="text-xs text-gray-400">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {req.nationalityRules?.slice(0, 3).map((rule) => (
                            <span
                              key={rule.nationalityCode}
                              className={`inline-flex px-2 py-0.5 text-xs rounded ${VISA_TYPE_LABELS[rule.visaType]?.color || 'bg-gray-100'}`}
                              title={`${rule.nationalityName}: ${VISA_TYPE_LABELS[rule.visaType]?.label}`}
                            >
                              {rule.nationalityCode}
                            </span>
                          ))}
                          {(req.nationalityRules?.length || 0) > 3 && (
                            <span className="text-xs text-gray-500">
                              +{(req.nationalityRules?.length || 0) - 3} more
                            </span>
                          )}
                          {!req.nationalityRules?.length && (
                            <span className="text-xs text-gray-400">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleSupported(req)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            req.isSupported ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              req.isSupported ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setEditingCountry(req);
                            setEditingTab('general');
                          }}
                          className="text-primary-600 hover:text-primary-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCountry(req.countryCode, req.countryName)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredRequirements.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No countries found. Add your first country above.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Country Modal */}
      {showAddModal && (
        <AddCountryModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddCountry}
          saving={saving}
          currentUser={currentUser?.email || 'admin'}
        />
      )}

      {/* Unified Edit Country Modal */}
      {editingCountry && (
        <UnifiedEditModal
          requirement={editingCountry}
          activeTab={editingTab}
          onTabChange={setEditingTab}
          onClose={() => setEditingCountry(null)}
          onSave={(updates) => handleUpdateCountry(editingCountry.countryCode, updates)}
          onAddRule={handleAddNationalityRule}
          onRemoveRule={handleRemoveNationalityRule}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onRemoveProduct={handleRemoveProduct}
          saving={saving}
        />
      )}

      {/* Bulk Nationality Rules Modal */}
      {showBulkNationalityModal && (
        <BulkNationalityRulesModal
          requirements={requirements}
          onClose={() => setShowBulkNationalityModal(false)}
          onApply={handleBulkAddNationalityRules}
          saving={saving}
        />
      )}
    </ProtectedRoute>
  );
}

// Add Country Modal Component
function AddCountryModal({
  onClose,
  onAdd,
  saving,
  currentUser
}: {
  onClose: () => void;
  onAdd: (data: Omit<VisaRequirement, 'id' | 'lastUpdated'>) => void;
  saving: boolean;
  currentUser: string;
}) {
  const [countryCode, setCountryCode] = useState('');
  const [countryName, setCountryName] = useState('');
  const [defaultVisaType, setDefaultVisaType] = useState<VisaType>('sticker');
  const [eVisaPrice, setEVisaPrice] = useState('');
  const [stickerVisaPrice, setStickerVisaPrice] = useState('');
  const [serviceFee, setServiceFee] = useState('500');

  const handleCountrySelect = (code: string) => {
    setCountryCode(code);
    const country = ALL_COUNTRIES.find(c => c.code === code);
    if (country) {
      setCountryName(country.nameEn || country.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      countryCode: countryCode.toUpperCase(),
      countryName,
      countryNameEn: countryName,
      defaultVisaType,
      isSupported: true,
      nationalityRules: [],
      visaProducts: [],
      eVisaPrice: eVisaPrice ? parseInt(eVisaPrice) : undefined,
      stickerVisaPrice: stickerVisaPrice ? parseInt(stickerVisaPrice) : undefined,
      serviceFee: parseInt(serviceFee) || 500,
      updatedBy: currentUser,
      isActive: true
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Add New Country</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <select
              value={countryCode}
              onChange={(e) => handleCountrySelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Select a country...</option>
              {ALL_COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.nameEn || country.name} ({country.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Visa Type</label>
            <select
              value={defaultVisaType}
              onChange={(e) => setDefaultVisaType(e.target.value as VisaType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {Object.entries(VISA_TYPE_LABELS).map(([key, { label, description }]) => (
                <option key={key} value={key}>{label} - {description}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-Visa Price (kr)</label>
              <input
                type="number"
                value={eVisaPrice}
                onChange={(e) => setEVisaPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sticker Visa Price (kr)</label>
              <input
                type="number"
                value={stickerVisaPrice}
                onChange={(e) => setStickerVisaPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Fee (kr)</label>
            <input
              type="number"
              value={serviceFee}
              onChange={(e) => setServiceFee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !countryCode}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Country'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Unified Edit Modal Component with Tabs
function UnifiedEditModal({
  requirement,
  activeTab,
  onTabChange,
  onClose,
  onSave,
  onAddRule,
  onRemoveRule,
  onAddProduct,
  onUpdateProduct,
  onRemoveProduct,
  saving
}: {
  requirement: VisaRequirement;
  activeTab: 'general' | 'products' | 'nationality';
  onTabChange: (tab: 'general' | 'products' | 'nationality') => void;
  onClose: () => void;
  onSave: (updates: Partial<VisaRequirement>) => void;
  onAddRule: (countryCode: string, rule: NationalityRule) => void;
  onRemoveRule: (countryCode: string, nationalityCode: string) => void;
  onAddProduct: (countryCode: string, product: VisaProduct) => void;
  onUpdateProduct: (countryCode: string, product: VisaProduct) => void;
  onRemoveProduct: (countryCode: string, productId: string) => void;
  saving: boolean;
}) {
  // General tab state
  const [defaultVisaType, setDefaultVisaType] = useState(requirement.defaultVisaType);
  const [eVisaPrice, setEVisaPrice] = useState(requirement.eVisaPrice?.toString() || '');
  const [stickerVisaPrice, setStickerVisaPrice] = useState(requirement.stickerVisaPrice?.toString() || '');
  const [serviceFee, setServiceFee] = useState(requirement.serviceFee?.toString() || '500');
  const [eVisaProcessingDays, setEVisaProcessingDays] = useState(requirement.eVisaProcessingDays?.toString() || '');
  const [stickerVisaProcessingDays, setStickerVisaProcessingDays] = useState(requirement.stickerVisaProcessingDays?.toString() || '');
  const [notes, setNotes] = useState(requirement.notes || '');

  // Nationality tab state
  const [editingRuleCode, setEditingRuleCode] = useState<string | null>(null);
  const [nationalityCode, setNationalityCode] = useState('');
  const [nationalityName, setNationalityName] = useState('');
  const [nationalityVisaType, setNationalityVisaType] = useState<VisaType>('e-visa');
  const [ruleUseStandardPricing, setRuleUseStandardPricing] = useState(true);
  const [ruleEmbassyFeeOverride, setRuleEmbassyFeeOverride] = useState('');
  const [rulePricingNote, setRulePricingNote] = useState('');

  // Products tab state
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [category, setCategory] = useState<VisaCategory>('tourist');
  const [productName, setProductName] = useState('');
  const [productNameEn, setProductNameEn] = useState('');
  const [productVisaType, setProductVisaType] = useState<VisaType>('e-visa');
  const [entryType, setEntryType] = useState<'single' | 'double' | 'multiple'>('single');
  const [validityDays, setValidityDays] = useState('30');
  const [stayDays, setStayDays] = useState('');
  const [productServiceFee, setProductServiceFee] = useState('');
  const [embassyFee, setEmbassyFee] = useState('');
  const [processingDays, setProcessingDays] = useState('5');
  const [expressAvailable, setExpressAvailable] = useState(false);
  const [expressDays, setExpressDays] = useState('');
  const [expressEmbassyFee, setExpressEmbassyFee] = useState('');
  const [expressDoxFee, setExpressDoxFee] = useState('');
  const [urgentAvailable, setUrgentAvailable] = useState(false);
  const [urgentDays, setUrgentDays] = useState('');
  const [urgentEmbassyFee, setUrgentEmbassyFee] = useState('');
  const [urgentDoxFee, setUrgentDoxFee] = useState('');

  const totalPrice = (parseInt(productServiceFee) || 0) + (parseInt(embassyFee) || 0);
  const totalExpressPrice = (parseInt(expressEmbassyFee) || 0) + (parseInt(expressDoxFee) || 0);
  const totalUrgentPrice = (parseInt(urgentEmbassyFee) || 0) + (parseInt(urgentDoxFee) || 0);

  const handleEditProduct = (product: VisaProduct) => {
    setEditingProductId(product.id);
    setCategory(product.category);
    setProductName(product.name);
    setProductNameEn(product.nameEn || '');
    setProductVisaType(product.visaType);
    setEntryType(product.entryType);
    setValidityDays(String(product.validityDays));
    setStayDays(product.stayDays ? String(product.stayDays) : '');
    setProductServiceFee(String(product.serviceFee || 0));
    setEmbassyFee(String(product.embassyFee || 0));
    setProcessingDays(String(product.processingDays));
    setExpressAvailable(product.expressAvailable || false);
    setExpressDays(product.expressDays ? String(product.expressDays) : '');
    setExpressEmbassyFee(product.expressEmbassyFee ? String(product.expressEmbassyFee) : '');
    setExpressDoxFee(product.expressDoxFee ? String(product.expressDoxFee) : '');
    setUrgentAvailable(product.urgentAvailable || false);
    setUrgentDays(product.urgentDays ? String(product.urgentDays) : '');
    setUrgentEmbassyFee(product.urgentEmbassyFee ? String(product.urgentEmbassyFee) : '');
    setUrgentDoxFee(product.urgentDoxFee ? String(product.urgentDoxFee) : '');
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setCategory('tourist');
    setProductName('');
    setProductNameEn('');
    setProductVisaType('e-visa');
    setEntryType('single');
    setValidityDays('30');
    setStayDays('');
    setProductServiceFee('');
    setEmbassyFee('');
    setProcessingDays('5');
    setExpressAvailable(false);
    setExpressDays('');
    setExpressEmbassyFee('');
    setExpressDoxFee('');
    setUrgentAvailable(false);
    setUrgentDays('');
    setUrgentEmbassyFee('');
    setUrgentDoxFee('');
  };

  const handleNationalitySelect = (code: string) => {
    setNationalityCode(code);
    if (code === '*') {
      setNationalityName('Övriga nationaliteter');
    } else {
      const country = ALL_COUNTRIES.find(c => c.code === code);
      if (country) {
        setNationalityName(country.nameEn || country.name);
      }
    }
  };

  const handleEditRule = (rule: NationalityRule) => {
    setEditingRuleCode(rule.nationalityCode);
    setNationalityCode(rule.nationalityCode);
    setNationalityName(rule.nationalityName);
    setNationalityVisaType(rule.visaType);
    setRuleUseStandardPricing(rule.useStandardPricing !== false);
    setRuleEmbassyFeeOverride(rule.embassyFeeOverride?.toString() || '');
    setRulePricingNote(rule.pricingNote || '');
  };

  const resetRuleForm = () => {
    setEditingRuleCode(null);
    setNationalityCode('');
    setNationalityName('');
    setNationalityVisaType('e-visa');
    setRuleUseStandardPricing(true);
    setRuleEmbassyFeeOverride('');
    setRulePricingNote('');
  };

  const handleAddNationalityRule = () => {
    if (nationalityCode && nationalityName) {
      const rule: NationalityRule = {
        nationalityCode: nationalityCode.toUpperCase(),
        nationalityName,
        visaType: nationalityVisaType,
        useStandardPricing: ruleUseStandardPricing,
      };
      if (ruleEmbassyFeeOverride) {
        rule.embassyFeeOverride = parseInt(ruleEmbassyFeeOverride);
      }
      if (rulePricingNote) {
        rule.pricingNote = rulePricingNote;
      }
      
      if (editingRuleCode) {
        // Remove old rule first, then add updated one
        onRemoveRule(requirement.countryCode, editingRuleCode);
      }
      onAddRule(requirement.countryCode, rule);
      resetRuleForm();
    }
  };

  const handleSaveVisaProduct = () => {
    if (productName && totalPrice > 0) {
      const productId = editingProductId || `${category}-${entryType}-${validityDays}-${Date.now()}`;
      
      // Build product data, only including fields with values (Firebase doesn't accept undefined)
      const productData: VisaProduct = {
        id: productId,
        category,
        name: productName,
        visaType: productVisaType,
        entryType,
        validityDays: parseInt(validityDays) || 30,
        price: totalPrice,
        serviceFee: parseInt(productServiceFee) || 0,
        embassyFee: parseInt(embassyFee) || 0,
        processingDays: parseInt(processingDays) || 5,
        isActive: true
      };

      // Add optional fields only if they have values
      if (productNameEn) productData.nameEn = productNameEn;
      if (stayDays) productData.stayDays = parseInt(stayDays);
      if (expressAvailable) {
        productData.expressAvailable = true;
        if (expressDays) productData.expressDays = parseInt(expressDays);
        if (totalExpressPrice > 0) productData.expressPrice = totalExpressPrice;
        if (expressEmbassyFee) productData.expressEmbassyFee = parseInt(expressEmbassyFee);
        if (expressDoxFee) productData.expressDoxFee = parseInt(expressDoxFee);
      }
      if (urgentAvailable) {
        productData.urgentAvailable = true;
        if (urgentDays) productData.urgentDays = parseInt(urgentDays);
        if (totalUrgentPrice > 0) productData.urgentPrice = totalUrgentPrice;
        if (urgentEmbassyFee) productData.urgentEmbassyFee = parseInt(urgentEmbassyFee);
        if (urgentDoxFee) productData.urgentDoxFee = parseInt(urgentDoxFee);
      }

      if (editingProductId) {
        // Update existing product
        onUpdateProduct(requirement.countryCode, productData);
      } else {
        // Add new product
        onAddProduct(requirement.countryCode, productData);
      }
      
      resetProductForm();
    }
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    // Build updates object, only including fields with values (Firebase doesn't accept undefined)
    const updates: Partial<VisaRequirement> = {
      defaultVisaType,
      serviceFee: parseInt(serviceFee) || 500,
    };
    if (eVisaPrice) updates.eVisaPrice = parseInt(eVisaPrice);
    if (stickerVisaPrice) updates.stickerVisaPrice = parseInt(stickerVisaPrice);
    if (eVisaProcessingDays) updates.eVisaProcessingDays = parseInt(eVisaProcessingDays);
    if (stickerVisaProcessingDays) updates.stickerVisaProcessingDays = parseInt(stickerVisaProcessingDays);
    if (notes) updates.notes = notes;
    
    onSave(updates);
  };

  const tabs = [
    { id: 'general' as const, label: 'General', count: null },
    { id: 'products' as const, label: 'Visa Products', count: requirement.visaProducts?.length || 0 },
    { id: 'nationality' as const, label: 'Nationality Rules', count: requirement.nationalityRules?.length || 0 },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Edit {requirement.countryNameEn || requirement.countryName}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Default: <span className={`px-2 py-0.5 rounded text-xs ${VISA_TYPE_LABELS[requirement.defaultVisaType]?.color}`}>
                {VISA_TYPE_LABELS[requirement.defaultVisaType]?.label}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b px-6">
          <nav className="flex gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <form onSubmit={handleSaveGeneral} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Visa Type</label>
                <select
                  value={defaultVisaType}
                  onChange={(e) => setDefaultVisaType(e.target.value as VisaType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {Object.entries(VISA_TYPE_LABELS).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-Visa Price (kr)</label>
                  <input
                    type="number"
                    value={eVisaPrice}
                    onChange={(e) => setEVisaPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sticker Visa Price (kr)</label>
                  <input
                    type="number"
                    value={stickerVisaPrice}
                    onChange={(e) => setStickerVisaPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-Visa Processing (days)</label>
                  <input
                    type="number"
                    value={eVisaProcessingDays}
                    onChange={(e) => setEVisaProcessingDays(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sticker Processing (days)</label>
                  <input
                    type="number"
                    value={stickerVisaProcessingDays}
                    onChange={(e) => setStickerVisaProcessingDays(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Fee (kr)</label>
                <input
                  type="number"
                  value={serviceFee}
                  onChange={(e) => setServiceFee(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Internal notes about this country..."
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Existing Products */}
              {requirement.visaProducts && requirement.visaProducts.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Current Products ({requirement.visaProducts.length})
                  </h3>
                  <div className="space-y-2">
                    {requirement.visaProducts.map((product) => (
                      <div key={product.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 text-xs rounded ${VISA_CATEGORY_LABELS[product.category]?.color || 'bg-gray-100'}`}>
                              {VISA_CATEGORY_LABELS[product.category]?.label || product.category}
                            </span>
                            <span className="font-medium">{product.name}</span>
                            <span className={`px-2 py-0.5 text-xs rounded ${VISA_TYPE_LABELS[product.visaType]?.color || 'bg-gray-100'}`}>
                              {VISA_TYPE_LABELS[product.visaType]?.label}
                            </span>
                            <span className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-800">
                              {product.entryType === 'single' ? 'Single' : product.entryType === 'double' ? 'Double' : 'Multiple'}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="text-primary-600 hover:text-primary-800 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => onRemoveProduct(requirement.countryCode, product.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-600 flex-wrap">
                          <span>Validity: {product.validityDays} days</span>
                          {product.stayDays && <span>Max stay: {product.stayDays} days</span>}
                          <span>Processing: {product.processingDays} days</span>
                          <span className="font-medium text-green-700">{product.price} kr</span>
                          {product.expressAvailable && (
                            <span className="text-amber-600">
                              ⚡ Express: {product.expressDays}d 
                              {(product.expressEmbassyFee || product.expressDoxFee) ? (
                                <>(+{product.expressEmbassyFee || 0}/{product.expressDoxFee || 0})</>
                              ) : product.expressPrice ? (
                                <>(+{product.expressPrice} kr)</>
                              ) : null}
                            </span>
                          )}
                          {product.urgentAvailable && (
                            <span className="text-red-600">
                              🚨 Urgent: {product.urgentDays}d 
                              {(product.urgentEmbassyFee || product.urgentDoxFee) ? (
                                <>(+{product.urgentEmbassyFee || 0}/{product.urgentDoxFee || 0})</>
                              ) : product.urgentPrice ? (
                                <>(+{product.urgentPrice} kr)</>
                              ) : null}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add/Edit Product Form */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  {editingProductId ? 'Edit Visa Product' : 'Add Visa Product'}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as VisaCategory)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                    >
                      {Object.entries(VISA_CATEGORY_LABELS).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Product Name (SV)</label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="t.ex. Turistvisum 30 dagar"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Product Name (EN)</label>
                    <input
                      type="text"
                      value={productNameEn}
                      onChange={(e) => setProductNameEn(e.target.value)}
                      placeholder="e.g. Tourist Visa 30 days"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Visa Type</label>
                    <select
                      value={productVisaType}
                      onChange={(e) => setProductVisaType(e.target.value as VisaType)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="e-visa">E-Visa</option>
                      <option value="sticker">Sticker Visa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Entry Type</label>
                    <select
                      value={entryType}
                      onChange={(e) => setEntryType(e.target.value as 'single' | 'double' | 'multiple')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="single">Single Entry</option>
                      <option value="double">Double Entry</option>
                      <option value="multiple">Multiple Entry</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Validity (days)</label>
                    <input
                      type="number"
                      value={validityDays}
                      onChange={(e) => setValidityDays(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Max Stay (days)</label>
                    <input
                      type="number"
                      value={stayDays}
                      onChange={(e) => setStayDays(e.target.value)}
                      placeholder="e.g. 30 per entry"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">DOX Service Fee (kr)</label>
                    <input
                      type="number"
                      value={productServiceFee}
                      onChange={(e) => setProductServiceFee(e.target.value)}
                      placeholder="500"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Embassy Fee (kr)</label>
                    <input
                      type="number"
                      value={embassyFee}
                      onChange={(e) => setEmbassyFee(e.target.value)}
                      placeholder="1000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  {totalPrice > 0 && (
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-green-600">Total: {totalPrice} kr</span>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Processing (days)</label>
                    <input
                      type="number"
                      value={processingDays}
                      onChange={(e) => setProcessingDays(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Express Options */}
                <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                  <label className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      checked={expressAvailable}
                      onChange={(e) => setExpressAvailable(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-amber-800">Express processing available</span>
                  </label>
                  {expressAvailable && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Express Days</label>
                        <input
                          type="number"
                          value={expressDays}
                          onChange={(e) => setExpressDays(e.target.value)}
                          placeholder="e.g. 2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Embassy Express Fee (kr) <span className="text-gray-400">0% moms</span></label>
                          <input
                            type="number"
                            value={expressEmbassyFee}
                            onChange={(e) => setExpressEmbassyFee(e.target.value)}
                            placeholder="e.g. 300"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">DOX Express Fee (kr) <span className="text-gray-400">25% moms</span></label>
                          <input
                            type="number"
                            value={expressDoxFee}
                            onChange={(e) => setExpressDoxFee(e.target.value)}
                            placeholder="e.g. 200"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                      {totalExpressPrice > 0 && (
                        <div className="text-sm text-amber-700 font-medium">
                          Total Express: {totalExpressPrice} kr
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Urgent Options */}
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <label className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      checked={urgentAvailable}
                      onChange={(e) => setUrgentAvailable(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-red-800">🚨 Urgent processing available</span>
                  </label>
                  {urgentAvailable && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Urgent Days</label>
                        <input
                          type="number"
                          value={urgentDays}
                          onChange={(e) => setUrgentDays(e.target.value)}
                          placeholder="e.g. 1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Embassy Urgent Fee (kr) <span className="text-gray-400">0% moms</span></label>
                          <input
                            type="number"
                            value={urgentEmbassyFee}
                            onChange={(e) => setUrgentEmbassyFee(e.target.value)}
                            placeholder="e.g. 500"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">DOX Urgent Fee (kr) <span className="text-gray-400">25% moms</span></label>
                          <input
                            type="number"
                            value={urgentDoxFee}
                            onChange={(e) => setUrgentDoxFee(e.target.value)}
                            placeholder="e.g. 400"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                      {totalUrgentPrice > 0 && (
                        <div className="text-sm text-red-700 font-medium">
                          Total Urgent: {totalUrgentPrice} kr
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleSaveVisaProduct}
                    disabled={saving || !productName || totalPrice === 0}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {editingProductId ? 'Update Product' : 'Add Product'}
                  </button>
                  {editingProductId && (
                    <button
                      onClick={resetProductForm}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Nationality Rules Tab */}
          {activeTab === 'nationality' && (
            <div className="space-y-6">
              {/* Existing Rules */}
              {requirement.nationalityRules && requirement.nationalityRules.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Current Rules ({requirement.nationalityRules.length})
                  </h3>
                  <div className="space-y-2">
                    {requirement.nationalityRules.map((rule) => (
                      <div
                        key={rule.nationalityCode}
                        className="p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-medium">{rule.nationalityName}</span>
                            <span className={`px-2 py-0.5 text-xs rounded ${VISA_TYPE_LABELS[rule.visaType]?.color}`}>
                              {VISA_TYPE_LABELS[rule.visaType]?.label}
                            </span>
                            {rule.useStandardPricing !== false && rule.embassyFeeOverride && (
                              <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-800">
                                Ambassad: {rule.embassyFeeOverride} kr
                              </span>
                            )}
                            {rule.useStandardPricing === false && (
                              <span className="px-2 py-0.5 text-xs rounded bg-amber-100 text-amber-800">
                                Pris TBC
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditRule(rule)}
                              className="text-primary-600 hover:text-primary-800 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => onRemoveRule(requirement.countryCode, rule.nationalityCode)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        {rule.pricingNote && (
                          <div className="mt-1 text-xs text-gray-500">{rule.pricingNote}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add/Edit Rule */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  {editingRuleCode ? 'Edit Nationality Rule' : 'Add Nationality Rule'}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Nationality</label>
                    <select
                      value={nationalityCode}
                      onChange={(e) => handleNationalitySelect(e.target.value)}
                      disabled={!!editingRuleCode}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    >
                      <option value="">Select...</option>
                      <option value="*">* Övriga nationaliteter</option>
                      {ALL_COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.nameEn || country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Visa Type</label>
                    <select
                      value={nationalityVisaType}
                      onChange={(e) => setNationalityVisaType(e.target.value as VisaType)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                    >
                      {Object.entries(VISA_TYPE_LABELS).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Embassy Fee Override (kr)</label>
                    <input
                      type="number"
                      value={ruleEmbassyFeeOverride}
                      onChange={(e) => setRuleEmbassyFeeOverride(e.target.value)}
                      placeholder="e.g. 1085"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={ruleUseStandardPricing}
                        onChange={(e) => setRuleUseStandardPricing(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Use standard pricing (show price)</span>
                    </label>
                  </div>
                  {!ruleUseStandardPricing && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Pricing Note (TBC message)</label>
                      <input
                        type="text"
                        value={rulePricingNote}
                        onChange={(e) => setRulePricingNote(e.target.value)}
                        placeholder="e.g. Ambassadavgift bekräftas efter ansökan"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleAddNationalityRule}
                    disabled={saving || !nationalityCode}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {editingRuleCode ? 'Update Rule' : 'Add Rule'}
                  </button>
                  {editingRuleCode && (
                    <button
                      onClick={resetRuleForm}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Common nationalities for quick selection
const COMMON_NATIONALITIES = [
  { code: 'SE', name: 'Sweden', nameSv: 'Sverige' },
  { code: 'NO', name: 'Norway', nameSv: 'Norge' },
  { code: 'DK', name: 'Denmark', nameSv: 'Danmark' },
  { code: 'FI', name: 'Finland', nameSv: 'Finland' },
  { code: 'DE', name: 'Germany', nameSv: 'Tyskland' },
  { code: 'GB', name: 'United Kingdom', nameSv: 'Storbritannien' },
  { code: 'US', name: 'United States', nameSv: 'USA' },
  { code: 'FR', name: 'France', nameSv: 'Frankrike' },
  { code: 'NL', name: 'Netherlands', nameSv: 'Nederländerna' },
  { code: 'ES', name: 'Spain', nameSv: 'Spanien' },
];

// Bulk Nationality Rules Modal Component
function BulkNationalityRulesModal({
  requirements,
  onClose,
  onApply,
  saving
}: {
  requirements: VisaRequirement[];
  onClose: () => void;
  onApply: (countryCodes: string[], rule: NationalityRule) => void;
  saving: boolean;
}) {
  const [nationalityCode, setNationalityCode] = useState('');
  const [nationalityName, setNationalityName] = useState('');
  const [visaType, setVisaType] = useState<VisaType>('e-visa');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleNationalitySelect = (code: string) => {
    setNationalityCode(code);
    const country = ALL_COUNTRIES.find(c => c.code === code);
    if (country) {
      setNationalityName(country.nameEn || country.name);
    }
  };

  const handleQuickNationalitySelect = (nat: typeof COMMON_NATIONALITIES[0]) => {
    setNationalityCode(nat.code);
    setNationalityName(nat.name);
  };

  const toggleCountry = (countryCode: string) => {
    setSelectedCountries(prev =>
      prev.includes(countryCode)
        ? prev.filter(c => c !== countryCode)
        : [...prev, countryCode]
    );
  };

  const selectAll = () => {
    setSelectedCountries(requirements.map(r => r.countryCode));
  };

  const deselectAll = () => {
    setSelectedCountries([]);
  };

  const handleApply = () => {
    if (nationalityCode && nationalityName && selectedCountries.length > 0) {
      onApply(selectedCountries, {
        nationalityCode: nationalityCode.toUpperCase(),
        nationalityName,
        visaType
      });
    }
  };

  const filteredRequirements = requirements.filter(req =>
    req.countryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (req.countryNameEn || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.countryCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check which countries already have this nationality rule
  const countriesWithRule = requirements
    .filter(r => r.nationalityRules?.some(rule => rule.nationalityCode === nationalityCode))
    .map(r => r.countryCode);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Bulk Add Nationality Rule</h2>
          <p className="text-sm text-gray-600 mt-1">
            Add a nationality rule to multiple countries at once
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Select Nationality */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <span className="bg-primary-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
              Select Nationality
            </h3>
            
            {/* Quick select common nationalities */}
            <div className="flex flex-wrap gap-2 mb-3">
              {COMMON_NATIONALITIES.map((nat) => (
                <button
                  key={nat.code}
                  onClick={() => handleQuickNationalitySelect(nat)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    nationalityCode === nat.code
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                  }`}
                >
                  {nat.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Or select from all nationalities</label>
                <select
                  value={nationalityCode}
                  onChange={(e) => handleNationalitySelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select nationality...</option>
                  {ALL_COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.nameEn || country.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Visa Type for this nationality</label>
                <select
                  value={visaType}
                  onChange={(e) => setVisaType(e.target.value as VisaType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                >
                  {Object.entries(VISA_TYPE_LABELS).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {nationalityCode && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{nationalityName}</strong> citizens will get{' '}
                  <span className={`px-2 py-0.5 rounded text-xs ${VISA_TYPE_LABELS[visaType]?.color}`}>
                    {VISA_TYPE_LABELS[visaType]?.label}
                  </span>
                  {' '}for selected countries
                </p>
              </div>
            )}
          </div>

          {/* Step 2: Select Countries */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <span className="bg-primary-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
              Select Countries to Apply Rule
              {selectedCountries.length > 0 && (
                <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full text-xs">
                  {selectedCountries.length} selected
                </span>
              )}
            </h3>

            {/* Search and bulk actions */}
            <div className="flex gap-4 mb-3">
              <input
                type="text"
                placeholder="Search countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={selectAll}
                className="px-3 py-2 text-sm text-primary-600 hover:text-primary-800"
              >
                Select All
              </button>
              <button
                onClick={deselectAll}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Deselect All
              </button>
            </div>

            {/* Country grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto border rounded-lg p-3">
              {filteredRequirements.map((req) => {
                const hasRule = countriesWithRule.includes(req.countryCode);
                const isSelected = selectedCountries.includes(req.countryCode);
                
                return (
                  <label
                    key={req.countryCode}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary-50 border border-primary-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    } ${hasRule ? 'opacity-60' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCountry(req.countryCode)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {req.countryNameEn || req.countryName}
                      </div>
                      {hasRule && (
                        <div className="text-xs text-amber-600">Already has this rule</div>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{req.countryCode}</span>
                  </label>
                );
              })}
            </div>

            {filteredRequirements.length === 0 && (
              <p className="text-center text-gray-500 py-4">No countries found</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={saving || !nationalityCode || selectedCountries.length === 0}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Applying...
              </>
            ) : (
              <>
                Apply to {selectedCountries.length} {selectedCountries.length === 1 ? 'country' : 'countries'}
              </>
            )}
          </button>
        </div>
      </div>
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

export default VisaRequirementsAdminPage;
