import React, { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  getAllPortalCustomers,
  updatePortalCustomer,
  deletePortalCustomer,
  PortalCustomer,
  PortalCustomerInput,
} from '@/firebase/portalCustomerService';
import { auth } from '@/firebase/config';
import { toast, Toaster } from 'react-hot-toast';

function PortalCustomersPage() {
  const [customers, setCustomers] = useState<PortalCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<PortalCustomer | null>(null);

  // Form
  const [formData, setFormData] = useState<PortalCustomerInput & { password?: string }>({
    email: '',
    displayName: '',
    companyName: '',
    phone: '',
    isActive: true,
    notes: '',
    password: '',
  });

  const loadCustomers = async () => {
    setLoading(true);
    const data = await getAllPortalCustomers();
    setCustomers(data);
    setLoading(false);
  };

  useEffect(() => { loadCustomers(); }, []);

  const resetForm = () => {
    setFormData({
      email: '',
      displayName: '',
      companyName: '',
      phone: '',
      isActive: true,
      notes: '',
      password: '',
    });
    setEditingCustomer(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (customer: PortalCustomer) => {
    setEditingCustomer(customer);
    setFormData({
      email: customer.email,
      displayName: customer.displayName,
      companyName: customer.companyName,
      phone: customer.phone || '',
      isActive: customer.isActive,
      notes: customer.notes || '',
      password: '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingCustomer) {
        // Update existing
        await updatePortalCustomer(editingCustomer.id, {
          displayName: formData.displayName,
          companyName: formData.companyName,
          phone: formData.phone,
          isActive: formData.isActive,
          notes: formData.notes,
        });
        toast.success('Kund uppdaterad');
      } else {
        // Create new via server-side API (avoids signing out admin)
        if (!formData.email || !formData.displayName || !formData.companyName) {
          toast.error('Fyll i alla obligatoriska fält');
          return;
        }

        // Get admin auth token
        const currentUser = auth?.currentUser;
        if (!currentUser) {
          toast.error('Du måste vara inloggad som admin');
          return;
        }
        const token = await currentUser.getIdToken();

        const resp = await fetch('/api/admin/create-portal-customer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: formData.email,
            displayName: formData.displayName,
            companyName: formData.companyName,
            phone: formData.phone,
            password: formData.password,
            isActive: formData.isActive,
            notes: formData.notes,
          }),
        });

        const result = await resp.json();
        if (!resp.ok) {
          toast.error(result.error || 'Kunde inte skapa kund');
          return;
        }
        toast.success(result.message || 'Kund skapad');
      }

      setShowModal(false);
      resetForm();
      loadCustomers();
    } catch (err: any) {
      toast.error(`Fel: ${err.message}`);
    }
  };

  const handleDelete = async (customer: PortalCustomer) => {
    if (!confirm(`Vill du verkligen ta bort ${customer.companyName} (${customer.email})?`)) return;
    try {
      await deletePortalCustomer(customer.id);
      toast.success('Kund borttagen');
      loadCustomers();
    } catch (err: any) {
      toast.error(`Fel: ${err.message}`);
    }
  };

  const handleToggleActive = async (customer: PortalCustomer) => {
    try {
      await updatePortalCustomer(customer.id, { isActive: !customer.isActive });
      toast.success(customer.isActive ? 'Kund inaktiverad' : 'Kund aktiverad');
      loadCustomers();
    } catch (err: any) {
      toast.error(`Fel: ${err.message}`);
    }
  };

  const formatDate = (ts: any): string => {
    if (!ts) return '–';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('sv-SE', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Kundportal – Hantera kunder | Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <Toaster position="top-center" />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Link href="/admin" className="text-gray-400 hover:text-gray-600 text-sm">
                  ← Admin
                </Link>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Portalkundkonton</h1>
              <p className="text-sm text-gray-500 mt-1">
                Hantera konton för kundportalen ({customers.length} kunder)
              </p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-custom-button text-white text-sm font-medium rounded-lg hover:bg-custom-button/90 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Ny kund
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-custom-button mb-4"></div>
              <p className="text-gray-500">Laddar kunder...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Inga portalkunder ännu</h3>
              <p className="text-gray-500 mb-6 text-sm">Skapa ett kundkonto för att komma igång.</p>
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-custom-button text-white text-sm font-medium rounded-lg hover:bg-custom-button/90 transition-colors"
              >
                Skapa första kunden
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Företag</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontaktperson</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-post</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Senast inloggad</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Åtgärder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-gray-900">{c.companyName}</div>
                        <div className="text-xs text-gray-400 font-mono">{c.companyId}</div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">{c.displayName}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">{c.email}</td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggleActive(c)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                            c.isActive
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {c.isActive ? 'Aktiv' : 'Inaktiv'}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400">
                        {formatDate(c.lastLoginAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Redigera
                          </button>
                          <button
                            onClick={() => handleDelete(c)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium"
                          >
                            Ta bort
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => { setShowModal(false); resetForm(); }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {editingCustomer ? 'Redigera kund' : 'Ny portalkund'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Företagsnamn *</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-custom-button/30 focus:border-custom-button"
                  placeholder="Företag AB"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kontaktperson *</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-custom-button/30 focus:border-custom-button"
                  placeholder="Anna Svensson"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-post *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!!editingCustomer}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-custom-button/30 focus:border-custom-button disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="anna@foretag.se"
                />
              </div>

              {!editingCustomer && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lösenord (valfritt)</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-custom-button/30 focus:border-custom-button"
                    placeholder="Minst 6 tecken"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Om du anger ett lösenord skapas även ett Firebase Auth-konto. Annars kan kunden skapa konto manuellt.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-custom-button/30 focus:border-custom-button"
                  placeholder="070-123 45 67"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Anteckningar</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-custom-button/30 focus:border-custom-button resize-none"
                  placeholder="Interna anteckningar..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-custom-button focus:ring-custom-button"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">Aktiv (kan logga in)</label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 bg-custom-button text-white text-sm font-medium rounded-lg hover:bg-custom-button/90 transition-colors"
              >
                {editingCustomer ? 'Spara ändringar' : 'Skapa kund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}

export default PortalCustomersPage;

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'sv', ['common'])),
  },
});
