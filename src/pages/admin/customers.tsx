import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/contexts/AuthContext';
import {
  Customer,
  CustomerInput,
  CustomerContact,
  CustomerAddress,
  CustomerPricing,
  getCustomers,
  createCustomer,
  updateCustomer,
  deactivateCustomer,
  reactivateCustomer
} from '@/firebase/customerService';
import { Timestamp } from 'firebase/firestore';

type ModalMode = 'create' | 'edit' | 'view' | null;

const emptyAddress: CustomerAddress = {
  street: '',
  postalCode: '',
  city: '',
  country: 'Sweden'
};

const emptyContact: CustomerContact = {
  name: '',
  role: '',
  phone: '',
  email: '',
  isPrimary: true
};

const emptyCustomPricing: CustomerPricing = {
  doxServiceFee: undefined,
  expressServiceFee: undefined,
  apostilleServiceFee: undefined,
  notarizationServiceFee: undefined,
  embassyServiceFee: undefined,
  translationServiceFee: undefined,
  chamberServiceFee: undefined,
  udServiceFee: undefined,
  // Pickup fees
  dhlPickupFee: undefined,
  dhlExpressPickupFee: undefined,
  stockholmCourierFee: undefined,
  stockholmSamedayFee: undefined,
  // DHL Return delivery options
  dhlEndOfDayFee: undefined,
  dhlPre12Fee: undefined,
  dhlPre9Fee: undefined,
  // Stockholm Courier return delivery options
  stockholmCityFee: undefined,
  stockholmExpressFee: undefined,
  stockholmUrgentFee: undefined,
  // Return fees
  scannedCopiesFee: undefined,
  returnDhlFee: undefined,
  returnPostnordFee: undefined,
  returnBudFee: undefined
};

const defaultFormData: Omit<CustomerInput, 'createdBy'> = {
  companyName: '',
  organizationNumber: '',
  customerType: 'company',
  industry: '',
  website: '',
  billingAddress: { ...emptyAddress },
  visitingAddress: undefined,
  phone: '',
  email: '',
  contacts: [{ ...emptyContact }],
  paymentTerms: 30,
  discountPercent: 0,
  invoiceMethod: 'email',
  invoiceReference: '',
  creditLimit: undefined,
  notes: '',
  isActive: true,
  customPricing: undefined,
  vatExempt: false,
  emailDomains: []
};

export default function CustomersPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'company' | 'government' | 'private'>('all');
  const [showInactive, setShowInactive] = useState(false);
  
  // Modal state
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<Omit<CustomerInput, 'createdBy'>>(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Same visiting address checkbox
  const [sameAsVisiting, setSameAsVisiting] = useState(true);

  // Auth check
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/admin/login');
    }
  }, [currentUser, authLoading, router]);

  // Load customers
  useEffect(() => {
    if (currentUser) {
      loadCustomers();
    }
  }, [currentUser, showInactive]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const { customers: data } = await getCustomers({ activeOnly: !showInactive });
      setCustomers(data);
    } catch (err) {
      setError('Could not load customers');
    } finally {
      setLoading(false);
    }
  };

  // Filter customers
  const filteredCustomers = customers.filter(c => {
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        c.companyName.toLowerCase().includes(term) ||
        c.customerNumber.toLowerCase().includes(term) ||
        c.organizationNumber?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.contacts.some(contact => 
          contact.name.toLowerCase().includes(term) ||
          contact.email?.toLowerCase().includes(term)
        );
      if (!matchesSearch) return false;
    }
    
    // Type filter
    if (filterType !== 'all' && c.customerType !== filterType) {
      return false;
    }
    
    return true;
  });

  // Open modal
  const openModal = (mode: ModalMode, customer?: Customer) => {
    setModalMode(mode);
    setError(null);
    
    if (customer && (mode === 'edit' || mode === 'view')) {
      setSelectedCustomer(customer);
      setFormData({
        companyName: customer.companyName,
        organizationNumber: customer.organizationNumber || '',
        customerType: customer.customerType,
        industry: customer.industry || '',
        website: customer.website || '',
        billingAddress: customer.billingAddress,
        visitingAddress: customer.visitingAddress,
        phone: customer.phone || '',
        email: customer.email || '',
        contacts: customer.contacts.length > 0 ? customer.contacts : [{ ...emptyContact }],
        paymentTerms: customer.paymentTerms,
        discountPercent: customer.discountPercent || 0,
        invoiceMethod: customer.invoiceMethod,
        invoiceReference: customer.invoiceReference || '',
        creditLimit: customer.creditLimit,
        notes: customer.notes || '',
        isActive: customer.isActive,
        customPricing: customer.customPricing || undefined,
        vatExempt: customer.vatExempt || false,
        emailDomains: customer.emailDomains || []
      });
      setSameAsVisiting(!customer.visitingAddress);
    } else {
      setSelectedCustomer(null);
      setFormData({ ...defaultFormData, contacts: [{ ...emptyContact }] });
      setSameAsVisiting(true);
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedCustomer(null);
    setFormData({ ...defaultFormData });
    setError(null);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const dataToSave: CustomerInput = {
        ...formData,
        visitingAddress: sameAsVisiting ? undefined : formData.visitingAddress,
        createdBy: currentUser?.uid || 'unknown'
      };

      if (modalMode === 'create') {
        await createCustomer(dataToSave);
      } else if (modalMode === 'edit' && selectedCustomer?.id) {
        await updateCustomer(selectedCustomer.id, dataToSave);
      }

      await loadCustomers();
      closeModal();
    } catch (err: any) {
      console.error('Customer save error:', err);
      setError(err?.message || 'Could not save customer. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle deactivate/reactivate
  const handleToggleActive = async (customer: Customer) => {
    if (!customer.id) return;
    
    try {
      if (customer.isActive) {
        await deactivateCustomer(customer.id);
      } else {
        await reactivateCustomer(customer.id);
      }
      await loadCustomers();
    } catch (err) {
      setError('Could not update customer status');
    }
  };

  // Add contact person
  const addContact = () => {
    setFormData(prev => ({
      ...prev,
      contacts: [...prev.contacts, { ...emptyContact, isPrimary: false }]
    }));
  };

  // Remove contact person
  const removeContact = (index: number) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index)
    }));
  };

  // Update contact person
  const updateContact = (index: number, field: keyof CustomerContact, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.map((c, i) => {
        if (i === index) {
          return { ...c, [field]: value };
        }
        // If setting isPrimary to true, set others to false
        if (field === 'isPrimary' && value === true) {
          return { ...c, isPrimary: false };
        }
        return c;
      })
    }));
  };

  // Format date
  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return '-';
    return timestamp.toDate().toLocaleDateString('sv-SE');
  };

  // Customer type label
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'company': return 'Company';
      case 'government': return 'Government';
      case 'private': return 'Private';
      default: return type;
    }
  };

  if (authLoading || !currentUser) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Customer Registry | Admin</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Registry</h1>
            <p className="text-gray-600 mt-1">Manage business customers and contacts</p>
          </div>
          <button
            onClick={() => openModal('create')}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Customer
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by company name, customer number, org. no., email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            {/* Type filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Types</option>
              <option value="company">Company</option>
              <option value="government">Government</option>
              <option value="private">Private</option>
            </select>
            
            {/* Show inactive */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">Show inactive</span>
            </label>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Customer list */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm || filterType !== 'all' 
                ? 'No customers match your search'
                : 'No customers registered yet'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Terms
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
                  {filteredCustomers.map((customer) => {
                    const primaryContact = customer.contacts.find(c => c.isPrimary) || customer.contacts[0];
                    return (
                      <tr key={customer.id} className={!customer.isActive ? 'bg-gray-50 opacity-60' : ''}>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{customer.companyName}</div>
                          <div className="text-sm text-gray-500">{customer.customerNumber}</div>
                          {customer.organizationNumber && (
                            <div className="text-xs text-gray-400">Org. No: {customer.organizationNumber}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            customer.customerType === 'company' ? 'bg-blue-100 text-blue-800' :
                            customer.customerType === 'government' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {getTypeLabel(customer.customerType)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {primaryContact ? (
                            <div>
                              <div className="text-sm text-gray-900">{primaryContact.name}</div>
                              {primaryContact.email && (
                                <div className="text-sm text-gray-500">{primaryContact.email}</div>
                              )}
                              {primaryContact.phone && (
                                <div className="text-xs text-gray-400">{primaryContact.phone}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{customer.paymentTerms} days</div>
                          {customer.discountPercent && customer.discountPercent > 0 && (
                            <div className="text-xs text-green-600">{customer.discountPercent}% discount</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            customer.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {customer.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openModal('view', customer)}
                              className="text-gray-600 hover:text-gray-900"
                              title="View"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => openModal('edit', customer)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleToggleActive(customer)}
                              className={customer.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                              title={customer.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {customer.isActive ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 text-sm text-gray-500">
          Showing {filteredCustomers.length} of {customers.length} customers
        </div>
      </div>

      {/* Modal */}
      {modalMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {modalMode === 'create' && 'Add New Customer'}
                {modalMode === 'edit' && 'Edit Customer'}
                {modalMode === 'view' && 'Customer Details'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Company info */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={modalMode === 'view'}
                      value={formData.companyName}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Organization Number
                    </label>
                    <input
                      type="text"
                      disabled={modalMode === 'view'}
                      value={formData.organizationNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, organizationNumber: e.target.value }))}
                      placeholder="XXXXXX-XXXX"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      disabled={modalMode === 'view'}
                      value={formData.customerType}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerType: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    >
                      <option value="company">Company</option>
                      <option value="government">Government</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Industry
                    </label>
                    <input
                      type="text"
                      disabled={modalMode === 'view'}
                      value={formData.industry}
                      onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website
                    </label>
                    <input
                      type="url"
                      disabled={modalMode === 'view'}
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email (General)
                    </label>
                    <input
                      type="email"
                      disabled={modalMode === 'view'}
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone (Switchboard)
                    </label>
                    <input
                      type="tel"
                      disabled={modalMode === 'view'}
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Billing address */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Billing Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={modalMode === 'view'}
                      value={formData.billingAddress.street}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        billingAddress: { ...prev.billingAddress, street: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={modalMode === 'view'}
                      value={formData.billingAddress.postalCode}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        billingAddress: { ...prev.billingAddress, postalCode: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={modalMode === 'view'}
                      value={formData.billingAddress.city}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        billingAddress: { ...prev.billingAddress, city: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      disabled={modalMode === 'view'}
                      value={formData.billingAddress.country}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        billingAddress: { ...prev.billingAddress, country: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Visiting address */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Visiting Address</h3>
                  {modalMode !== 'view' && (
                    <label className="flex items-center gap-2 ml-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sameAsVisiting}
                        onChange={(e) => setSameAsVisiting(e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-600">Same as billing address</span>
                    </label>
                  )}
                </div>
                {!sameAsVisiting && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                      <input
                        type="text"
                        disabled={modalMode === 'view'}
                        value={formData.visitingAddress?.street || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          visitingAddress: { ...(prev.visitingAddress || emptyAddress), street: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                      <input
                        type="text"
                        disabled={modalMode === 'view'}
                        value={formData.visitingAddress?.postalCode || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          visitingAddress: { ...(prev.visitingAddress || emptyAddress), postalCode: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        disabled={modalMode === 'view'}
                        value={formData.visitingAddress?.city || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          visitingAddress: { ...(prev.visitingAddress || emptyAddress), city: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input
                        type="text"
                        disabled={modalMode === 'view'}
                        value={formData.visitingAddress?.country || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          visitingAddress: { ...(prev.visitingAddress || emptyAddress), country: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Contact persons */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Contact Persons</h3>
                  {modalMode !== 'view' && (
                    <button
                      type="button"
                      onClick={addContact}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Contact
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {formData.contacts.map((contact, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="primaryContact"
                            checked={contact.isPrimary}
                            disabled={modalMode === 'view'}
                            onChange={() => updateContact(index, 'isPrimary', true)}
                            className="text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-600">Primary Contact</span>
                        </label>
                        {modalMode !== 'view' && formData.contacts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeContact(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <input
                            type="text"
                            disabled={modalMode === 'view'}
                            value={contact.name}
                            onChange={(e) => updateContact(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role/Title</label>
                          <input
                            type="text"
                            disabled={modalMode === 'view'}
                            value={contact.role || ''}
                            onChange={(e) => updateContact(index, 'role', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            disabled={modalMode === 'view'}
                            value={contact.email || ''}
                            onChange={(e) => updateContact(index, 'email', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                          <input
                            type="tel"
                            disabled={modalMode === 'view'}
                            value={contact.phone || ''}
                            onChange={(e) => updateContact(index, 'phone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Business terms */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Business Terms</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Terms <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      disabled={modalMode === 'view'}
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: parseInt(e.target.value) as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    >
                      <option value={10}>10 days</option>
                      <option value={20}>20 days</option>
                      <option value={30}>30 days</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      disabled={modalMode === 'view'}
                      value={formData.discountPercent || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, discountPercent: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice Method <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      disabled={modalMode === 'view'}
                      value={formData.invoiceMethod}
                      onChange={(e) => setFormData(prev => ({ ...prev, invoiceMethod: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    >
                      <option value="email">Email (PDF)</option>
                      <option value="efaktura">E-Invoice</option>
                      <option value="paper">Paper</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice Reference
                    </label>
                    <input
                      type="text"
                      disabled={modalMode === 'view'}
                      value={formData.invoiceReference}
                      onChange={(e) => setFormData(prev => ({ ...prev, invoiceReference: e.target.value }))}
                      placeholder="Cost center, project no..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credit Limit (SEK)
                    </label>
                    <input
                      type="number"
                      min="0"
                      disabled={modalMode === 'view'}
                      value={formData.creditLimit || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, creditLimit: parseFloat(e.target.value) || undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Custom Pricing & VAT Settings */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Custom Pricing & VAT Settings</h3>
                
                {/* VAT Exempt */}
                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={modalMode === 'view'}
                      checked={formData.vatExempt || false}
                      onChange={(e) => setFormData(prev => ({ ...prev, vatExempt: e.target.checked }))}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">VAT Exempt (No VAT charged)</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-6">Enable for government agencies, foreign companies, or other VAT-exempt customers</p>
                </div>

                {/* Email Domains */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Domains (for automatic matching)
                  </label>
                  <input
                    type="text"
                    disabled={modalMode === 'view'}
                    value={formData.emailDomains?.join(', ') || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      emailDomains: e.target.value.split(',').map(d => d.trim().toLowerCase()).filter(d => d.length > 0)
                    }))}
                    placeholder="doxvl.se, example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Comma-separated list of email domains. Orders from these domains will automatically use this customer's pricing.</p>
                </div>

                {/* Custom Service Fees */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DOX Service Fees (leave empty for standard)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">These fees apply only to DOX service fees - not official fees (embassy, UD, etc.)</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">General service fee</label>
                      <input
                        type="number"
                        min="0"
                        disabled={modalMode === 'view'}
                        value={formData.customPricing?.doxServiceFee ?? ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          customPricing: { 
                            ...prev.customPricing, 
                            doxServiceFee: e.target.value !== '' ? parseFloat(e.target.value) : undefined 
                          }
                        }))}
                        placeholder="Standard"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Express</label>
                      <input
                        type="number"
                        min="0"
                        disabled={modalMode === 'view'}
                        value={formData.customPricing?.expressServiceFee ?? ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          customPricing: { 
                            ...prev.customPricing, 
                            expressServiceFee: e.target.value !== '' ? parseFloat(e.target.value) : undefined 
                          }
                        }))}
                        placeholder="Standard"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Apostille Fee</label>
                      <input
                        type="number"
                        min="0"
                        disabled={modalMode === 'view'}
                        value={formData.customPricing?.apostilleServiceFee ?? ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          customPricing: { 
                            ...prev.customPricing, 
                            apostilleServiceFee: e.target.value !== '' ? parseFloat(e.target.value) : undefined 
                          }
                        }))}
                        placeholder="Standard"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Notarization Fee</label>
                      <input
                        type="number"
                        min="0"
                        disabled={modalMode === 'view'}
                        value={formData.customPricing?.notarizationServiceFee ?? ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          customPricing: { 
                            ...prev.customPricing, 
                            notarizationServiceFee: e.target.value !== '' ? parseFloat(e.target.value) : undefined 
                          }
                        }))}
                        placeholder="Standard"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Embassy Fee</label>
                      <input
                        type="number"
                        min="0"
                        disabled={modalMode === 'view'}
                        value={formData.customPricing?.embassyServiceFee ?? ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          customPricing: { 
                            ...prev.customPricing, 
                            embassyServiceFee: e.target.value !== '' ? parseFloat(e.target.value) : undefined 
                          }
                        }))}
                        placeholder="Standard"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Translation Fee</label>
                      <input
                        type="number"
                        min="0"
                        disabled={modalMode === 'view'}
                        value={formData.customPricing?.translationServiceFee ?? ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          customPricing: { 
                            ...prev.customPricing, 
                            translationServiceFee: e.target.value !== '' ? parseFloat(e.target.value) : undefined 
                          }
                        }))}
                        placeholder="Standard"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Chamber Fee</label>
                      <input
                        type="number"
                        min="0"
                        disabled={modalMode === 'view'}
                        value={formData.customPricing?.chamberServiceFee ?? ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          customPricing: { 
                            ...prev.customPricing, 
                            chamberServiceFee: e.target.value !== '' ? parseFloat(e.target.value) : undefined 
                          }
                        }))}
                        placeholder="Standard"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">UD Fee</label>
                      <input
                        type="number"
                        min="0"
                        disabled={modalMode === 'view'}
                        value={formData.customPricing?.udServiceFee ?? ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          customPricing: { 
                            ...prev.customPricing, 
                            udServiceFee: e.target.value !== '' ? parseFloat(e.target.value) : undefined 
                          }
                        }))}
                        placeholder="Standard"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  {/* Pickup Fees */}
                  <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
                    Pickup
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">DHL Pickup</label>
                      <input
                        type="number"
                        min="0"
                        disabled={modalMode === 'view'}
                        value={formData.customPricing?.dhlPickupFee ?? ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          customPricing: { 
                            ...prev.customPricing, 
                            dhlPickupFee: e.target.value !== '' ? parseFloat(e.target.value) : undefined 
                          }
                        }))}
                        placeholder="Standard"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">DHL Express Pickup</label>
                      <input
                        type="number"
                        min="0"
                        disabled={modalMode === 'view'}
                        value={formData.customPricing?.dhlExpressPickupFee ?? ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          customPricing: { 
                            ...prev.customPricing, 
                            dhlExpressPickupFee: e.target.value !== '' ? parseFloat(e.target.value) : undefined 
                          }
                        }))}
                        placeholder="Standard"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Stockholm Courier</label>
                      <input
                        type="number"
                        min="0"
                        disabled={modalMode === 'view'}
                        value={formData.customPricing?.stockholmCourierFee ?? ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          customPricing: { 
                            ...prev.customPricing, 
                            stockholmCourierFee: e.target.value !== '' ? parseFloat(e.target.value) : undefined 
                          }
                        }))}
                        placeholder="Standard"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Stockholm Same-day</label>
                      <input
                        type="number"
                        min="0"
                        disabled={modalMode === 'view'}
                        value={formData.customPricing?.stockholmSamedayFee ?? ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          customPricing: { 
                            ...prev.customPricing, 
                            stockholmSamedayFee: e.target.value !== '' ? parseFloat(e.target.value) : undefined 
                          }
                        }))}
                        placeholder="Standard"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  {/* DHL Return Delivery Options */}
                  <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
                    DHL Return Delivery
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">DHL End of Day</label>
                      <input
                        type="number"
                        min="0"
                        disabled={modalMode === 'view'}
                        value={formData.customPricing?.dhlEndOfDayFee ?? ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          customPricing: { 
                            ...prev.customPricing, 
                            dhlEndOfDayFee: e.target.value !== '' ? parseFloat(e.target.value) : undefined 
                          }
                        }))}
                        placeholder="Standard"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">DHL Pre 12</label>
                      <input
                        type="number"
                        min="0"
                        disabled={modalMode === 'view'}
                        value={formData.customPricing?.dhlPre12Fee ?? ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          customPricing: { 
                            ...prev.customPricing, 
                            dhlPre12Fee: e.target.value !== '' ? parseFloat(e.target.value) : undefined 
                          }
                        }))}
                        placeholder="Standard"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">DHL Pre 9</label>
                      <input
                        type="number"
                        min="0"
                        disabled={modalMode === 'view'}
                        value={formData.customPricing?.dhlPre9Fee ?? ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          customPricing: { 
                            ...prev.customPricing, 
                            dhlPre9Fee: e.target.value !== '' ? parseFloat(e.target.value) : undefined 
                          }
                        }))}
                        placeholder="Standard"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  {/* Stockholm Courier Return Delivery Options */}
                  <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
                    Stockholm Courier Return Delivery
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Stockholm City (Normal)</label>
                      <input
                        type="number"
                        min="0"
                        disabled={modalMode === 'view'}
                        value={formData.customPricing?.stockholmCityFee ?? ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          customPricing: { 
                            ...prev.customPricing, 
                            stockholmCityFee: e.target.value !== '' ? parseFloat(e.target.value) : undefined 
                          }
                        }))}
                        placeholder="Standard"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Stockholm Express</label>
                      <input
                        type="number"
                        min="0"
                        disabled={modalMode === 'view'}
                        value={formData.customPricing?.stockholmExpressFee ?? ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          customPricing: { 
                            ...prev.customPricing, 
                            stockholmExpressFee: e.target.value !== '' ? parseFloat(e.target.value) : undefined 
                          }
                        }))}
                        placeholder="Standard"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Stockholm Urgent</label>
                      <input
                        type="number"
                        min="0"
                        disabled={modalMode === 'view'}
                        value={formData.customPricing?.stockholmUrgentFee ?? ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          customPricing: { 
                            ...prev.customPricing, 
                            stockholmUrgentFee: e.target.value !== '' ? parseFloat(e.target.value) : undefined 
                          }
                        }))}
                        placeholder="Standard"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  {/* Other Fees */}
                  <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
                    Other
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Scanned copies</label>
                      <input
                        type="number"
                        min="0"
                        disabled={modalMode === 'view'}
                        value={formData.customPricing?.scannedCopiesFee ?? ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          customPricing: { 
                            ...prev.customPricing, 
                            scannedCopiesFee: e.target.value !== '' ? parseFloat(e.target.value) : undefined 
                          }
                        }))}
                        placeholder="Standard"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">PostNord Registered (REK)</label>
                      <input
                        type="number"
                        min="0"
                        disabled={modalMode === 'view'}
                        value={formData.customPricing?.returnPostnordFee ?? ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          customPricing: { 
                            ...prev.customPricing, 
                            returnPostnordFee: e.target.value !== '' ? parseFloat(e.target.value) : undefined 
                          }
                        }))}
                        placeholder="Standard"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
                <textarea
                  rows={3}
                  disabled={modalMode === 'view'}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Internal notes about the customer..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                />
              </div>

              {/* View mode: metadata */}
              {modalMode === 'view' && selectedCustomer && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Metadata</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Customer No:</span>
                      <span className="ml-2 font-medium">{selectedCustomer.customerNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2">{formatDate(selectedCustomer.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Updated:</span>
                      <span className="ml-2">{formatDate(selectedCustomer.updatedAt)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className={`ml-2 ${selectedCustomer.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedCustomer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  {modalMode === 'view' ? 'Close' : 'Cancel'}
                </button>
                {modalMode === 'view' && (
                  <button
                    type="button"
                    onClick={() => setModalMode('edit')}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                  >
                    Edit
                  </button>
                )}
                {modalMode !== 'view' && (
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    {modalMode === 'create' ? 'Create Customer' : 'Save Changes'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
