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
  VisaRequirement,
  VisaType,
  VisaCategory,
  VisaProduct,
  NationalityRule
} from '@/firebase/visaRequirementsService';
import { ALL_COUNTRIES } from '@/components/order/data/countries';

const VISA_TYPE_LABELS: Record<VisaType, { label: string; color: string; description: string }> = {
  'e-visa': { label: 'E-Visa', color: 'bg-green-100 text-green-800', description: 'Electronic visa, no passport shipping needed' },
  'sticker': { label: 'Sticker Visa', color: 'bg-blue-100 text-blue-800', description: 'Traditional visa stamped in passport' },
  'both': { label: 'Both Options', color: 'bg-purple-100 text-purple-800', description: 'Customer can choose e-visa or sticker' },
  'not-required': { label: 'Visa Free', color: 'bg-gray-100 text-gray-800', description: 'No visa required for this combination' },
  'not-supported': { label: 'Not Supported', color: 'bg-red-100 text-red-800', description: 'We cannot help with this destination' }
};

const VISA_CATEGORY_LABELS: Record<VisaCategory, { label: string; labelSv: string; color: string }> = {
  'tourist': { label: 'Tourist', labelSv: 'Turist', color: 'bg-sky-100 text-sky-800' },
  'business': { label: 'Business', labelSv: 'Affärs', color: 'bg-amber-100 text-amber-800' },
  'transit': { label: 'Transit', labelSv: 'Transit', color: 'bg-slate-100 text-slate-800' },
  'student': { label: 'Student', labelSv: 'Student', color: 'bg-indigo-100 text-indigo-800' },
  'work': { label: 'Work', labelSv: 'Arbete', color: 'bg-orange-100 text-orange-800' },
  'medical': { label: 'Medical', labelSv: 'Medicinsk', color: 'bg-rose-100 text-rose-800' },
  'conference': { label: 'Conference', labelSv: 'Konferens', color: 'bg-teal-100 text-teal-800' }
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
  const [showNationalityModal, setShowNationalityModal] = useState<string | null>(null);
  const [showProductsModal, setShowProductsModal] = useState<string | null>(null);

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
      await loadRequirements();
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
      await loadRequirements();
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
      await loadRequirements();
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
      await loadRequirements();
      toast.success('Visa product removed!');
    } catch (error) {
      toast.error('Could not remove visa product');
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
                          <button
                            onClick={() => setShowProductsModal(req.countryCode)}
                            className="text-xs text-primary-600 hover:text-primary-800"
                          >
                            {req.visaProducts?.length ? 'Edit' : '+ Add'}
                          </button>
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
                          <button
                            onClick={() => setShowNationalityModal(req.countryCode)}
                            className="text-xs text-primary-600 hover:text-primary-800"
                          >
                            {req.nationalityRules?.length ? 'Edit' : '+ Add'}
                          </button>
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
                          onClick={() => setEditingCountry(req)}
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

      {/* Edit Country Modal */}
      {editingCountry && (
        <EditCountryModal
          requirement={editingCountry}
          onClose={() => setEditingCountry(null)}
          onSave={(updates) => handleUpdateCountry(editingCountry.countryCode, updates)}
          saving={saving}
        />
      )}

      {/* Nationality Rules Modal */}
      {showNationalityModal && (
        <NationalityRulesModal
          countryCode={showNationalityModal}
          requirement={requirements.find(r => r.countryCode === showNationalityModal)!}
          onClose={() => setShowNationalityModal(null)}
          onAddRule={handleAddNationalityRule}
          onRemoveRule={handleRemoveNationalityRule}
          saving={saving}
        />
      )}

      {/* Visa Products Modal */}
      {showProductsModal && (
        <VisaProductsModal
          countryCode={showProductsModal}
          requirement={requirements.find(r => r.countryCode === showProductsModal)!}
          onClose={() => setShowProductsModal(null)}
          onAddProduct={handleAddProduct}
          onRemoveProduct={handleRemoveProduct}
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

// Edit Country Modal Component
function EditCountryModal({
  requirement,
  onClose,
  onSave,
  saving
}: {
  requirement: VisaRequirement;
  onClose: () => void;
  onSave: (updates: Partial<VisaRequirement>) => void;
  saving: boolean;
}) {
  const [defaultVisaType, setDefaultVisaType] = useState(requirement.defaultVisaType);
  const [eVisaPrice, setEVisaPrice] = useState(requirement.eVisaPrice?.toString() || '');
  const [stickerVisaPrice, setStickerVisaPrice] = useState(requirement.stickerVisaPrice?.toString() || '');
  const [serviceFee, setServiceFee] = useState(requirement.serviceFee?.toString() || '500');
  const [eVisaProcessingDays, setEVisaProcessingDays] = useState(requirement.eVisaProcessingDays?.toString() || '');
  const [stickerVisaProcessingDays, setStickerVisaProcessingDays] = useState(requirement.stickerVisaProcessingDays?.toString() || '');
  const [notes, setNotes] = useState(requirement.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      defaultVisaType,
      eVisaPrice: eVisaPrice ? parseInt(eVisaPrice) : undefined,
      stickerVisaPrice: stickerVisaPrice ? parseInt(stickerVisaPrice) : undefined,
      serviceFee: parseInt(serviceFee) || 500,
      eVisaProcessingDays: eVisaProcessingDays ? parseInt(eVisaProcessingDays) : undefined,
      stickerVisaProcessingDays: stickerVisaProcessingDays ? parseInt(stickerVisaProcessingDays) : undefined,
      notes
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Edit {requirement.countryNameEn || requirement.countryName}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              disabled={saving}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Nationality Rules Modal Component
function NationalityRulesModal({
  countryCode,
  requirement,
  onClose,
  onAddRule,
  onRemoveRule,
  saving
}: {
  countryCode: string;
  requirement: VisaRequirement;
  onClose: () => void;
  onAddRule: (countryCode: string, rule: NationalityRule) => void;
  onRemoveRule: (countryCode: string, nationalityCode: string) => void;
  saving: boolean;
}) {
  const [nationalityCode, setNationalityCode] = useState('');
  const [nationalityName, setNationalityName] = useState('');
  const [visaType, setVisaType] = useState<VisaType>('e-visa');

  const handleNationalitySelect = (code: string) => {
    setNationalityCode(code);
    const country = ALL_COUNTRIES.find(c => c.code === code);
    if (country) {
      setNationalityName(country.nameEn || country.name);
    }
  };

  const handleAdd = () => {
    if (nationalityCode && nationalityName) {
      onAddRule(countryCode, {
        nationalityCode: nationalityCode.toUpperCase(),
        nationalityName,
        visaType
      });
      setNationalityCode('');
      setNationalityName('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">
            Nationality Rules for {requirement.countryNameEn || requirement.countryName}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Default: <span className={`px-2 py-0.5 rounded ${VISA_TYPE_LABELS[requirement.defaultVisaType]?.color}`}>
              {VISA_TYPE_LABELS[requirement.defaultVisaType]?.label}
            </span>
          </p>
        </div>

        <div className="p-6">
          {/* Existing Rules */}
          {requirement.nationalityRules && requirement.nationalityRules.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Current Rules</h3>
              <div className="space-y-2">
                {requirement.nationalityRules.map((rule) => (
                  <div
                    key={rule.nationalityCode}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{rule.nationalityName}</span>
                      <span className={`px-2 py-0.5 text-xs rounded ${VISA_TYPE_LABELS[rule.visaType]?.color}`}>
                        {VISA_TYPE_LABELS[rule.visaType]?.label}
                      </span>
                    </div>
                    <button
                      onClick={() => onRemoveRule(countryCode, rule.nationalityCode)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Rule */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Add Nationality Rule</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nationality</label>
                <select
                  value={nationalityCode}
                  onChange={(e) => handleNationalitySelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select...</option>
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
                  value={visaType}
                  onChange={(e) => setVisaType(e.target.value as VisaType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                >
                  {Object.entries(VISA_TYPE_LABELS).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAdd}
                  disabled={saving || !nationalityCode}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  Add Rule
                </button>
              </div>
            </div>
          </div>
        </div>

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

// Visa Products Modal Component
function VisaProductsModal({
  countryCode,
  requirement,
  onClose,
  onAddProduct,
  onRemoveProduct,
  saving
}: {
  countryCode: string;
  requirement: VisaRequirement;
  onClose: () => void;
  onAddProduct: (countryCode: string, product: VisaProduct) => void;
  onRemoveProduct: (countryCode: string, productId: string) => void;
  saving: boolean;
}) {
  const [category, setCategory] = useState<VisaCategory>('tourist');
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [visaType, setVisaType] = useState<VisaType>('e-visa');
  const [entryType, setEntryType] = useState<'single' | 'double' | 'multiple'>('single');
  const [validityDays, setValidityDays] = useState('30');
  const [stayDays, setStayDays] = useState('');
  const [serviceFee, setServiceFee] = useState('');
  const [embassyFee, setEmbassyFee] = useState('');
  const [processingDays, setProcessingDays] = useState('5');
  const [expressAvailable, setExpressAvailable] = useState(false);
  const [expressDays, setExpressDays] = useState('');
  const [expressPrice, setExpressPrice] = useState('');
  
  // Calculate total price
  const totalPrice = (parseInt(serviceFee) || 0) + (parseInt(embassyFee) || 0);

  const handleAdd = () => {
    if (name && (serviceFee || embassyFee)) {
      const productId = `${category}-${entryType}-${validityDays}-${Date.now()}`;
      onAddProduct(countryCode, {
        id: productId,
        category,
        name,
        nameEn: nameEn || undefined,
        visaType,
        entryType,
        validityDays: parseInt(validityDays) || 30,
        stayDays: stayDays ? parseInt(stayDays) : undefined,
        price: totalPrice,
        serviceFee: parseInt(serviceFee) || 0,
        embassyFee: parseInt(embassyFee) || 0,
        processingDays: parseInt(processingDays) || 5,
        expressAvailable: expressAvailable || undefined,
        expressDays: expressDays ? parseInt(expressDays) : undefined,
        expressPrice: expressPrice ? parseInt(expressPrice) : undefined,
        isActive: true
      });
      // Reset form
      setName('');
      setNameEn('');
      setServiceFee('');
      setEmbassyFee('');
      setStayDays('');
      setExpressAvailable(false);
      setExpressDays('');
      setExpressPrice('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">
            Visa Products for {requirement.countryNameEn || requirement.countryName}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Add different visa types customers can order (tourist, business, etc.)
          </p>
        </div>

        <div className="p-6">
          {/* Existing Products */}
          {requirement.visaProducts && requirement.visaProducts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Current Products ({requirement.visaProducts.length})</h3>
              <div className="space-y-2">
                {requirement.visaProducts.map((product) => (
                  <div
                    key={product.id}
                    className="p-3 bg-gray-50 rounded-lg"
                  >
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
                      <button
                        onClick={() => onRemoveProduct(countryCode, product.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                      <span>Validity: {product.validityDays} days</span>
                      {product.stayDays && <span>Max stay: {product.stayDays} days</span>}
                      <span>Processing: {product.processingDays} days</span>
                      <span className="font-medium text-green-700" title={`Service: ${product.serviceFee || 0} kr + Embassy: ${product.embassyFee || 0} kr`}>
                        {product.price} kr
                      </span>
                      {product.expressAvailable && (
                        <span className="text-amber-600">⚡ Express: {product.expressDays} days (+{product.expressPrice} kr)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Product */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Add Visa Product</h3>
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="t.ex. Turistvisum 30 dagar"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Product Name (EN)</label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Tourist Visa 30 days"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Visa Type</label>
                <select
                  value={visaType}
                  onChange={(e) => setVisaType(e.target.value as VisaType)}
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
                  placeholder="30, 60, 90, 180..."
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
                  value={serviceFee}
                  onChange={(e) => setServiceFee(e.target.value)}
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
                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Express Extra Fee (kr)</label>
                    <input
                      type="number"
                      value={expressPrice}
                      onChange={(e) => setExpressPrice(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4">
              <button
                onClick={handleAdd}
                disabled={saving || !name || totalPrice === 0}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                Add Product
              </button>
            </div>
          </div>
        </div>

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
