import React, { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import {
  getAllVisaRequirements,
  updateProductDocumentRequirements,
  getDefaultDocumentRequirements,
  getResidenceDocuments,
  VisaRequirement,
  VisaProduct,
  DocumentRequirement,
  DocumentType,
  VisaCategory,
  NationalityApplicability
} from '@/firebase/visaRequirementsService';
import { exportToJson, importFromJson } from '@/utils/adminExportImport';

const DOCUMENT_TYPE_LABELS: Record<DocumentType, { label: string; icon: string }> = {
  'passport': { label: 'Passport', icon: '🛂' },
  'photo': { label: 'Photo', icon: '📷' },
  'form': { label: 'Application Form', icon: '📝' },
  'financial': { label: 'Financial Documents', icon: '💰' },
  'invitation': { label: 'Invitation Letter', icon: '✉️' },
  'insurance': { label: 'Travel Insurance', icon: '🏥' },
  'itinerary': { label: 'Travel Itinerary', icon: '✈️' },
  'accommodation': { label: 'Accommodation', icon: '🏨' },
  'employment': { label: 'Employment Letter', icon: '💼' },
  'residence': { label: 'Residence / Permit', icon: '🏠' },
  'other': { label: 'Other', icon: '📄' }
};

const NATIONALITY_APPLICABILITY_LABELS: Record<string, string> = {
  'all': 'All nationalities',
  'swedish-only': 'Swedish citizens only',
  'non-swedish': 'Non-Swedish citizens (residents in Sweden)'
};

function VisaDocumentRequirementsPage() {
  const { currentUser } = useAuth();
  const [requirements, setRequirements] = useState<VisaRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Selection state
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  
  // Document requirements state
  const [documentRequirements, setDocumentRequirements] = useState<DocumentRequirement[]>([]);
  const [editingDoc, setEditingDoc] = useState<DocumentRequirement | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadRequirements();
    }
  }, [currentUser]);

  const loadRequirements = async () => {
    try {
      setLoading(true);
      const data = await getAllVisaRequirements();
      // Only show countries with visa products
      const countriesWithProducts = data.filter(r => r.visaProducts && r.visaProducts.length > 0);
      setRequirements(countriesWithProducts);
    } catch (error) {
      toast.error('Could not load visa requirements');
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setSelectedProduct('');
    setDocumentRequirements([]);
  };

  const handleProductChange = (productId: string) => {
    setSelectedProduct(productId);
    
    // Load existing document requirements for this product
    const country = requirements.find(r => r.countryCode === selectedCountry);
    const product = country?.visaProducts?.find(p => p.id === productId);
    
    if (product?.documentRequirements) {
      setDocumentRequirements([...product.documentRequirements]);
    } else {
      setDocumentRequirements([]);
    }
  };

  const handleCopyFromCountry = (sourceCountryCode: string, sourceProductId: string, selectedDocIds?: string[], replaceAll?: boolean) => {
    const sourceCountry = requirements.find(r => r.countryCode === sourceCountryCode);
    const sourceProduct = sourceCountry?.visaProducts?.find(p => p.id === sourceProductId);
    
    if (!sourceProduct?.documentRequirements?.length) {
      toast.error('Source product has no document requirements');
      return;
    }

    // Filter to selected docs or copy all
    const sourceDocs = selectedDocIds && selectedDocIds.length > 0
      ? sourceProduct.documentRequirements.filter(d => selectedDocIds.includes(d.id))
      : sourceProduct.documentRequirements;

    if (sourceDocs.length === 0) {
      toast.error('No documents selected');
      return;
    }

    if (replaceAll) {
      // Replace all current documents
      const copiedDocs: DocumentRequirement[] = sourceDocs.map((doc, i) => ({
        ...doc,
        order: i + 1
      }));
      setDocumentRequirements(copiedDocs);
    } else {
      // Add to existing documents
      const existingIds = documentRequirements.map(d => d.id);
      const maxOrder = Math.max(...documentRequirements.map(d => d.order), 0);
      const newDocs: DocumentRequirement[] = sourceDocs
        .filter(d => !existingIds.includes(d.id))
        .map((doc, i) => ({
          ...doc,
          order: maxOrder + i + 1
        }));
      if (newDocs.length === 0) {
        toast.error('All selected documents already exist');
        return;
      }
      setDocumentRequirements(prev => [...prev, ...newDocs]);
    }

    setShowCopyModal(false);
    const sourceName = sourceCountry?.countryNameEn || sourceCountry?.countryName;
    const productName = sourceProduct.nameEn || sourceProduct.name;
    toast.success(
      `Copied ${sourceDocs.length} requirement(s) from ${sourceName} – ${productName}. Remember to save!`
    );
  };

  const handleLoadDefaults = () => {
    const country = requirements.find(r => r.countryCode === selectedCountry);
    const product = country?.visaProducts?.find(p => p.id === selectedProduct);
    
    if (product) {
      const defaults = getDefaultDocumentRequirements(product.category);
      setDocumentRequirements(defaults);
      toast.success('Default requirements loaded. Remember to save!');
    }
  };

  const handleSaveRequirements = async () => {
    if (!selectedCountry || !selectedProduct) return;
    
    setSaving(true);
    try {
      await updateProductDocumentRequirements(
        selectedCountry,
        selectedProduct,
        documentRequirements,
        currentUser?.email || 'admin'
      );
      await loadRequirements();
      toast.success('Document requirements saved!');
    } catch (error) {
      toast.error('Could not save document requirements');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDocument = (doc: DocumentRequirement) => {
    setDocumentRequirements(prev => [...prev, doc]);
    setShowAddModal(false);
  };

  const handleUpdateDocument = (doc: DocumentRequirement) => {
    setDocumentRequirements(prev => 
      prev.map(d => d.id === doc.id ? doc : d)
    );
    setEditingDoc(null);
  };

  const handleDeleteDocument = (docId: string) => {
    if (!confirm('Are you sure you want to remove this requirement?')) return;
    setDocumentRequirements(prev => prev.filter(d => d.id !== docId));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newDocs = [...documentRequirements];
    [newDocs[index - 1], newDocs[index]] = [newDocs[index], newDocs[index - 1]];
    // Update order numbers
    newDocs.forEach((d, i) => d.order = i + 1);
    setDocumentRequirements(newDocs);
  };

  const handleMoveDown = (index: number) => {
    if (index === documentRequirements.length - 1) return;
    const newDocs = [...documentRequirements];
    [newDocs[index], newDocs[index + 1]] = [newDocs[index + 1], newDocs[index]];
    // Update order numbers
    newDocs.forEach((d, i) => d.order = i + 1);
    setDocumentRequirements(newDocs);
  };

  const selectedCountryData = requirements.find(r => r.countryCode === selectedCountry);
  const selectedProductData = selectedCountryData?.visaProducts?.find(p => p.id === selectedProduct);

  return (
    <ProtectedRoute>
      <Head>
        <title>Visa Document Requirements | Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Visa Document Requirements</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Manage required documents for each visa product. These will be shown to customers after ordering.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    // Export all document requirements across all countries/products
                    const exportData = requirements.map(r => ({
                      countryCode: r.countryCode,
                      countryName: r.countryNameEn || r.countryName,
                      products: (r.visaProducts || []).map(p => ({
                        id: p.id,
                        name: p.nameEn || p.name,
                        visaType: p.visaType,
                        category: p.category,
                        documentRequirements: p.documentRequirements || []
                      }))
                    }));
                    exportToJson(exportData, 'visa-document-requirements-backup');
                    toast.success(`Exported document requirements for ${requirements.length} countries`);
                  }}
                  className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-1.5 text-sm"
                  title="Export all document requirements as JSON backup"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export All
                </button>
                <button
                  onClick={async () => {
                    const data = await importFromJson<Array<{countryCode: string; products: Array<{id: string; documentRequirements: DocumentRequirement[]}>}>>();
                    if (!data || !Array.isArray(data)) {
                      toast.error('Invalid file. Expected JSON array from a previous export.');
                      return;
                    }
                    const totalProducts = data.reduce((sum, c) => sum + (c.products?.length || 0), 0);
                    if (!confirm(`Import document requirements for ${data.length} countries (${totalProducts} products)? This will overwrite existing document requirements.`)) return;
                    setSaving(true);
                    let success = 0;
                    let errors = 0;
                    for (const country of data) {
                      for (const product of (country.products || [])) {
                        if (product.documentRequirements?.length > 0) {
                          try {
                            await updateProductDocumentRequirements(
                              country.countryCode,
                              product.id,
                              product.documentRequirements,
                              currentUser?.email || 'admin'
                            );
                            success++;
                          } catch { errors++; }
                        }
                      }
                    }
                    await loadRequirements();
                    setSaving(false);
                    toast.success(`Imported ${success} product requirements${errors > 0 ? `, ${errors} failed` : ''}`);
                  }}
                  disabled={saving}
                  className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-1.5 text-sm disabled:opacity-50"
                  title="Import document requirements from JSON backup"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Import All
                </button>
                <a
                  href="/admin/visa-requirements"
                  className="text-sm text-blue-600 hover:text-blue-800 ml-2"
                >
                  ← Back to Visa Requirements
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selection */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium mb-4">Select Visa Product</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Destination Country
                    </label>
                    <select
                      value={selectedCountry}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Select country...</option>
                      {requirements.map(r => (
                        <option key={r.countryCode} value={r.countryCode}>
                          {r.countryNameEn || r.countryName} ({r.visaProducts?.length || 0} products)
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Visa Product
                    </label>
                    <select
                      value={selectedProduct}
                      onChange={(e) => handleProductChange(e.target.value)}
                      disabled={!selectedCountry}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                    >
                      <option value="">Select product...</option>
                      {selectedCountryData?.visaProducts?.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nameEn || p.name} ({p.visaType})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Document Requirements Editor */}
              {selectedProduct && (
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-medium">
                        Document Requirements for {selectedProductData?.nameEn || selectedProductData?.name}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {documentRequirements.length} requirement(s) configured
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowCopyModal(true)}
                        className="px-3 py-2 text-sm border border-purple-300 text-purple-700 rounded-md hover:bg-purple-50"
                      >
                        📋 Copy from Country
                      </button>
                      <button
                        onClick={handleLoadDefaults}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Load Defaults
                      </button>
                      <button
                        onClick={() => {
                          const residenceDocs = getResidenceDocuments();
                          // Check if any residence docs already exist
                          const existingIds = documentRequirements.map(d => d.id);
                          const newDocs = residenceDocs.filter(d => !existingIds.includes(d.id));
                          if (newDocs.length === 0) {
                            toast.error('Residence documents already added');
                            return;
                          }
                          // Update order numbers
                          const maxOrder = Math.max(...documentRequirements.map(d => d.order), 0);
                          newDocs.forEach((d, i) => d.order = maxOrder + i + 1);
                          setDocumentRequirements(prev => [...prev, ...newDocs]);
                          toast.success(`Added ${newDocs.length} residence document(s) for non-Swedish citizens`);
                        }}
                        className="px-3 py-2 text-sm border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50"
                      >
                        🏠 Add Residence Docs
                      </button>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        + Add Requirement
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    {documentRequirements.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No document requirements configured for this product.</p>
                        <p className="text-sm mt-1">Click "Load Defaults" to start with common requirements, or add custom ones.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {documentRequirements
                          .sort((a, b) => a.order - b.order)
                          .map((doc, index) => (
                          <div
                            key={doc.id}
                            className={`border rounded-lg p-4 ${doc.isActive ? 'border-gray-200' : 'border-gray-200 bg-gray-50 opacity-60'}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <span className="text-2xl">{DOCUMENT_TYPE_LABELS[doc.type]?.icon || '📄'}</span>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-medium text-gray-900">{doc.nameEn || doc.name}</h3>
                                    {doc.required && (
                                      <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded">Required</span>
                                    )}
                                    {doc.uploadable && (
                                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">Uploadable</span>
                                    )}
                                    {!doc.isActive && (
                                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">Inactive</span>
                                    )}
                                    {doc.applicableNationalities && doc.applicableNationalities !== 'all' && (
                                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                                        {Array.isArray(doc.applicableNationalities) 
                                          ? `Only: ${doc.applicableNationalities.join(', ')}`
                                          : NATIONALITY_APPLICABILITY_LABELS[doc.applicableNationalities] || doc.applicableNationalities
                                        }
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">{doc.descriptionEn || doc.description}</p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    SV: {doc.name} - {doc.description}
                                  </p>
                                  {doc.templateUrl && (
                                    <a href={doc.templateUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                                      📎 Template/Form link
                                    </a>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleMoveUp(index)}
                                  disabled={index === 0}
                                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                  title="Move up"
                                >
                                  ↑
                                </button>
                                <button
                                  onClick={() => handleMoveDown(index)}
                                  disabled={index === documentRequirements.length - 1}
                                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                  title="Move down"
                                >
                                  ↓
                                </button>
                                <button
                                  onClick={() => setEditingDoc(doc)}
                                  className="p-1 text-blue-600 hover:text-blue-800"
                                  title="Edit"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="p-1 text-red-600 hover:text-red-800"
                                  title="Delete"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Save Button */}
                    <div className="mt-6 pt-4 border-t flex justify-end">
                      <button
                        onClick={handleSaveRequirements}
                        disabled={saving}
                        className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Requirements'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview Section */}
              {selectedProduct && documentRequirements.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-medium mb-4">Customer Preview</h2>
                  <p className="text-sm text-gray-500 mb-4">This is how the requirements will appear to customers (shown in their selected language):</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Swedish Preview */}
                    <div className="border rounded-lg p-6 bg-gray-50">
                      <div className="text-xs font-medium text-gray-400 uppercase mb-2">Swedish (SV)</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        📋 Dokument som krävs för din visumansökan
                      </h3>
                      <div className="space-y-4">
                        {documentRequirements
                          .filter(d => d.isActive)
                          .sort((a, b) => a.order - b.order)
                          .map((doc, index) => (
                          <div key={doc.id} className="flex items-start gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${doc.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {doc.name}
                                {doc.required && <span className="text-red-600 ml-1">*</span>}
                              </div>
                              <p className="text-sm text-gray-600">{doc.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-4">* = Obligatoriskt</p>
                    </div>

                    {/* English Preview */}
                    <div className="border rounded-lg p-6 bg-gray-50">
                      <div className="text-xs font-medium text-gray-400 uppercase mb-2">English (EN)</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        📋 Required Documents for Your Visa Application
                      </h3>
                      <div className="space-y-4">
                        {documentRequirements
                          .filter(d => d.isActive)
                          .sort((a, b) => a.order - b.order)
                          .map((doc, index) => (
                          <div key={doc.id} className="flex items-start gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${doc.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {doc.nameEn}
                                {doc.required && <span className="text-red-600 ml-1">*</span>}
                              </div>
                              <p className="text-sm text-gray-600">{doc.descriptionEn}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-4">* = Required</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Copy from Country Modal */}
      {showCopyModal && (
        <CopyFromCountryModal
          requirements={requirements}
          currentCountryCode={selectedCountry}
          currentProductId={selectedProduct}
          onCopy={handleCopyFromCountry}
          onClose={() => setShowCopyModal(false)}
        />
      )}

      {/* Add/Edit Document Modal */}
      {(showAddModal || editingDoc) && (
        <DocumentRequirementModal
          document={editingDoc}
          onSave={editingDoc ? handleUpdateDocument : handleAddDocument}
          onClose={() => {
            setShowAddModal(false);
            setEditingDoc(null);
          }}
          existingIds={documentRequirements.map(d => d.id)}
          nextOrder={documentRequirements.length + 1}
        />
      )}
    </ProtectedRoute>
  );
}

// Copy from Country Modal Component
function CopyFromCountryModal({
  requirements,
  currentCountryCode,
  currentProductId,
  onCopy,
  onClose
}: {
  requirements: VisaRequirement[];
  currentCountryCode: string;
  currentProductId: string;
  onCopy: (countryCode: string, productId: string, selectedDocIds?: string[], replaceAll?: boolean) => void;
  onClose: () => void;
}) {
  const [selectedSourceCountry, setSelectedSourceCountry] = useState('');
  const [selectedSourceProduct, setSelectedSourceProduct] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [replaceAll, setReplaceAll] = useState(true);

  // Filter countries that have at least one product with document requirements
  const countriesWithDocs = requirements.filter(r =>
    r.visaProducts?.some(p => p.documentRequirements && p.documentRequirements.length > 0)
  );

  const filteredCountries = searchQuery
    ? countriesWithDocs.filter(r =>
        (r.countryNameEn || r.countryName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.countryCode.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : countriesWithDocs;

  const sourceCountryData = requirements.find(r => r.countryCode === selectedSourceCountry);
  const productsWithDocs = sourceCountryData?.visaProducts?.filter(
    p => p.documentRequirements && p.documentRequirements.length > 0
  ) || [];

  const selectedSourceProductData = sourceCountryData?.visaProducts?.find(p => p.id === selectedSourceProduct);
  const sourceDocs = selectedSourceProductData?.documentRequirements?.sort((a, b) => a.order - b.order) || [];

  const allSelected = sourceDocs.length > 0 && selectedDocIds.length === sourceDocs.length;

  const toggleDoc = (docId: string) => {
    setSelectedDocIds(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(sourceDocs.map(d => d.id));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">📋 Copy Requirements from Another Country</h2>
          <p className="text-sm text-gray-500 mt-1">
            Select a country and product, then choose which documents to copy.
          </p>
        </div>

        <div className="p-6 space-y-4">
          {countriesWithDocs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">No countries have document requirements configured yet.</p>
              <p className="text-sm mt-1">Configure at least one country first, then you can copy from it.</p>
            </div>
          ) : (
            <>
              {/* Search */}
              <div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search country..."
                  autoFocus
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              {/* Country + Product list */}
              {!selectedSourceCountry ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select source country ({filteredCountries.length} available)
                  </label>
                  <div className="border rounded-lg max-h-64 overflow-y-auto divide-y">
                    {filteredCountries.length === 0 ? (
                      <div className="p-4 text-center text-gray-400 text-sm">
                        No countries match &quot;{searchQuery}&quot;
                      </div>
                    ) : (
                      filteredCountries.map(r => {
                        const productsCount = r.visaProducts?.filter(p => p.documentRequirements && p.documentRequirements.length > 0).length || 0;
                        const totalDocs = r.visaProducts?.reduce((sum, p) => sum + (p.documentRequirements?.length || 0), 0) || 0;
                        return (
                          <button
                            key={r.countryCode}
                            type="button"
                            onClick={() => {
                              setSelectedSourceCountry(r.countryCode);
                              setSelectedSourceProduct('');
                              setSelectedDocIds([]);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors flex items-center justify-between"
                          >
                            <span className="font-medium text-gray-900">
                              {r.countryNameEn || r.countryName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {productsCount} product(s) · {totalDocs} doc(s)
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : !selectedSourceProduct ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSourceCountry('');
                        setSelectedSourceProduct('');
                        setSelectedDocIds([]);
                      }}
                      className="text-sm text-purple-600 hover:text-purple-800"
                    >
                      ← Back to countries
                    </button>
                    <span className="text-sm text-gray-500">|</span>
                    <span className="text-sm font-medium text-gray-700">
                      {sourceCountryData?.countryNameEn || sourceCountryData?.countryName}
                    </span>
                  </div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select product to copy from
                  </label>
                  <div className="border rounded-lg max-h-64 overflow-y-auto divide-y">
                    {productsWithDocs.length === 0 ? (
                      <div className="p-4 text-center text-gray-400 text-sm">
                        No products with document requirements
                      </div>
                    ) : (
                      productsWithDocs.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedSourceProduct(p.id);
                            // Auto-select all docs
                            const allDocIds = p.documentRequirements?.map(d => d.id) || [];
                            setSelectedDocIds(allDocIds);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors flex items-center justify-between"
                        >
                          <span className="font-medium text-gray-900">
                            {p.nameEn || p.name} <span className="text-gray-400 font-normal">({p.visaType})</span>
                          </span>
                          <span className="text-xs text-gray-500">
                            {p.documentRequirements?.length || 0} doc(s)
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSourceProduct('');
                        setSelectedDocIds([]);
                      }}
                      className="text-sm text-purple-600 hover:text-purple-800"
                    >
                      ← Back to products
                    </button>
                    <span className="text-sm text-gray-500">|</span>
                    <span className="text-sm font-medium text-gray-700">
                      {sourceCountryData?.countryNameEn || sourceCountryData?.countryName} — {selectedSourceProductData?.nameEn || selectedSourceProductData?.name}
                    </span>
                  </div>

                  {/* Document selection with checkboxes */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleAll}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Select all ({sourceDocs.length})
                        </span>
                      </label>
                      <span className="text-xs text-gray-500">
                        {selectedDocIds.length} selected
                      </span>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y">
                      {sourceDocs.map((doc) => {
                        const isSelected = selectedDocIds.includes(doc.id);
                        return (
                          <label
                            key={doc.id}
                            className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                              isSelected ? 'bg-purple-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleDoc(doc.id)}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-base">{DOCUMENT_TYPE_LABELS[doc.type]?.icon || '📄'}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {doc.nameEn || doc.name}
                              </div>
                              {doc.descriptionEn && (
                                <div className="text-xs text-gray-500 truncate">{doc.descriptionEn}</div>
                              )}
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              {doc.required && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700">Required</span>
                              )}
                              {!doc.isActive && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">Inactive</span>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Copy mode toggle */}
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-medium text-amber-800 mb-2">Copy mode:</p>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="copyMode"
                          checked={replaceAll}
                          onChange={() => setReplaceAll(true)}
                          className="text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">
                          <strong>Replace all</strong> — remove current docs and replace
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="copyMode"
                          checked={!replaceAll}
                          onChange={() => setReplaceAll(false)}
                          className="text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">
                          <strong>Add</strong> — append to existing docs
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onCopy(selectedSourceCountry, selectedSourceProduct, selectedDocIds, replaceAll)}
              disabled={!selectedSourceCountry || !selectedSourceProduct || selectedDocIds.length === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selectedDocIds.length > 0
                ? `Copy ${selectedDocIds.length} document${selectedDocIds.length !== 1 ? 's' : ''}`
                : 'Copy Requirements'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Document Requirement Modal Component
function DocumentRequirementModal({
  document,
  onSave,
  onClose,
  existingIds,
  nextOrder
}: {
  document: DocumentRequirement | null;
  onSave: (doc: DocumentRequirement) => void;
  onClose: () => void;
  existingIds: string[];
  nextOrder: number;
}) {
  const [id, setId] = useState(document?.id || '');
  const [type, setType] = useState<DocumentType>(document?.type || 'other');
  const [name, setName] = useState(document?.name || '');
  const [nameEn, setNameEn] = useState(document?.nameEn || '');
  const [description, setDescription] = useState(document?.description || '');
  const [descriptionEn, setDescriptionEn] = useState(document?.descriptionEn || '');
  const [required, setRequired] = useState(document?.required ?? true);
  const [uploadable, setUploadable] = useState(document?.uploadable ?? false);
  const [templateUrl, setTemplateUrl] = useState(document?.templateUrl || '');
  const [isActive, setIsActive] = useState(document?.isActive ?? true);
  const [applicableNationalities, setApplicableNationalities] = useState<string>(
    Array.isArray(document?.applicableNationalities) 
      ? 'specific' 
      : (document?.applicableNationalities || 'all')
  );
  const [specificNationalities, setSpecificNationalities] = useState<string>(
    Array.isArray(document?.applicableNationalities) 
      ? document.applicableNationalities.join(', ') 
      : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const docId = id || `${type}-${Date.now()}`;
    
    // Check for duplicate ID (only for new documents)
    if (!document && existingIds.includes(docId)) {
      toast.error('A requirement with this ID already exists');
      return;
    }

    // Determine applicableNationalities value
    let nationalityValue: NationalityApplicability = 'all';
    if (applicableNationalities === 'specific' && specificNationalities.trim()) {
      nationalityValue = specificNationalities.split(',').map(s => s.trim().toUpperCase()).filter(s => s.length > 0);
    } else if (applicableNationalities !== 'specific') {
      nationalityValue = applicableNationalities as 'all' | 'swedish-only' | 'non-swedish';
    }

    const docData: DocumentRequirement = {
      id: docId,
      type,
      name,
      nameEn,
      description,
      descriptionEn,
      required,
      uploadable,
      order: document?.order || nextOrder,
      isActive,
      applicableNationalities: nationalityValue
    };

    if (templateUrl) {
      docData.templateUrl = templateUrl;
    }

    onSave(docData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">
            {document ? 'Edit Document Requirement' : 'Add Document Requirement'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DocumentType)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.icon} {val.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID (unique identifier)
              </label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                placeholder="e.g., passport, bank_statement"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                disabled={!!document}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name (Swedish) *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Pass"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name (English) *
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g., Passport"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Swedish) *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Giltigt i minst 6 månader efter planerad hemresa"
              required
              rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (English) *
            </label>
            <textarea
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              placeholder="e.g., Valid for at least 6 months after planned return"
              required
              rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template/Form URL (optional)
            </label>
            <input
              type="url"
              value={templateUrl}
              onChange={(e) => setTemplateUrl(e.target.value)}
              placeholder="https://..."
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">Link to downloadable form or template</p>
          </div>

          {/* Nationality Applicability */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Applies to which nationalities?
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="applicableNationalities"
                  value="all"
                  checked={applicableNationalities === 'all'}
                  onChange={(e) => setApplicableNationalities(e.target.value)}
                  className="text-blue-600"
                />
                <span className="text-sm text-gray-700">All nationalities (default)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="applicableNationalities"
                  value="swedish-only"
                  checked={applicableNationalities === 'swedish-only'}
                  onChange={(e) => setApplicableNationalities(e.target.value)}
                  className="text-blue-600"
                />
                <span className="text-sm text-gray-700">Swedish citizens only</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="applicableNationalities"
                  value="non-swedish"
                  checked={applicableNationalities === 'non-swedish'}
                  onChange={(e) => setApplicableNationalities(e.target.value)}
                  className="text-blue-600"
                />
                <span className="text-sm text-gray-700">🏠 Non-Swedish citizens (residents in Sweden)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="applicableNationalities"
                  value="specific"
                  checked={applicableNationalities === 'specific'}
                  onChange={(e) => setApplicableNationalities(e.target.value)}
                  className="text-blue-600"
                />
                <span className="text-sm text-gray-700">Specific nationalities only</span>
              </label>
              {applicableNationalities === 'specific' && (
                <div className="ml-6 mt-2">
                  <input
                    type="text"
                    value={specificNationalities}
                    onChange={(e) => setSpecificNationalities(e.target.value)}
                    placeholder="e.g., NO, DK, FI (comma-separated country codes)"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter ISO country codes separated by commas</p>
                </div>
              )}
            </div>
            {applicableNationalities === 'non-swedish' && (
              <p className="text-xs text-blue-700 mt-2 bg-blue-100 p-2 rounded">
                💡 This document will only be shown to non-Swedish citizens applying from Sweden (e.g., residence permit, population register extract)
              </p>
            )}
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Required (mandatory)</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={uploadable}
                onChange={(e) => setUploadable(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Customer can upload</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {document ? 'Update' : 'Add'} Requirement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'sv', ['common'])),
    },
  };
};

export default VisaDocumentRequirementsPage;
