import React, { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import {
  getAllPickupPricing,
  updatePickupPricing,
  initializePickupPricing,
  PickupPricing
} from '@/firebase/pricingService';

function PickupPricingPage() {
  const { t } = useTranslation('common');
  const { currentUser } = useAuth();
  const [pickupOptions, setPickupOptions] = useState<PickupPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMethod, setEditingMethod] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<PickupPricing>>({});

  useEffect(() => {
    loadPickupPricing();
  }, []);

  const loadPickupPricing = async () => {
    try {
      setLoading(true);
      const pricing = await getAllPickupPricing();
      
      if (pricing.length === 0 && currentUser?.email) {
        // Initialize default pricing if none exists
        await initializePickupPricing(currentUser.email);
        const newPricing = await getAllPickupPricing();
        setPickupOptions(newPricing);
      } else {
        setPickupOptions(pricing);
      }
    } catch (error) {
      console.error('Error loading pickup pricing:', error);
      toast.error('Kunde inte ladda upphämtningspriser');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (option: PickupPricing) => {
    setEditingMethod(option.method);
    setEditValues({
      price: option.price,
      isActive: option.isActive,
      notes: option.notes || ''
    });
  };

  const handleSave = async (method: 'dhl' | 'stockholm_courier' | 'dhl_express' | 'stockholm_sameday') => {
    try {
      if (!currentUser?.email) {
        toast.error('Du måste vara inloggad');
        return;
      }

      await updatePickupPricing(method, {
        ...editValues,
        updatedBy: currentUser.email
      });

      toast.success('Priser uppdaterade!');
      setEditingMethod(null);
      await loadPickupPricing();
    } catch (error) {
      console.error('Error updating pickup pricing:', error);
      toast.error('Kunde inte uppdatera priser');
    }
  };

  const handleCancel = () => {
    setEditingMethod(null);
    setEditValues({});
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar upphämtningspriser...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <Head>
          <title>Upphämtningspriser - Admin | Legaliseringstjänst</title>
        </Head>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Upphämtningspriser</h1>
            <p className="mt-2 text-gray-600">
              Hantera priser för DHL och Stockholm lokalbud
            </p>
          </div>

          {/* Base Options */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Bas-alternativ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pickupOptions.filter(o => !o.isPremium).map((option) => {
                const isEditing = editingMethod === option.method;

                return (
                  <div
                    key={option.id}
                    className={`bg-white rounded-lg shadow-sm border-2 p-6 ${
                      option.isActive ? 'border-green-200' : 'border-gray-200'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-3xl">
                          {option.method === 'dhl' ? '📦' : '🚴'}
                        </span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {option.name}
                          </h3>
                          <p className="text-sm text-gray-500">{option.coverage}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {option.isActive ? (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                            Aktiv
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                            Inaktiv
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 mb-4">{option.description}</p>

                    {/* Price */}
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pris (SEK)
                          </label>
                          <input
                            type="number"
                            value={editValues.price || 0}
                            onChange={(e) =>
                              setEditValues({ ...editValues, price: Number(e.target.value) })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Anteckningar
                          </label>
                          <textarea
                            value={editValues.notes || ''}
                            onChange={(e) =>
                              setEditValues({ ...editValues, notes: e.target.value })
                            }
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`active-${option.method}`}
                            checked={editValues.isActive ?? option.isActive}
                            onChange={(e) =>
                              setEditValues({ ...editValues, isActive: e.target.checked })
                            }
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor={`active-${option.method}`}
                            className="ml-2 block text-sm text-gray-700"
                          >
                            Aktiv tjänst
                          </label>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSave(option.method)}
                            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                          >
                            Spara
                          </button>
                          <button
                            onClick={handleCancel}
                            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                          >
                            Avbryt
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="text-3xl font-bold text-gray-900">
                            {option.price} kr
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Senast uppdaterad:{' '}
                            {option.lastUpdated?.toDate?.()?.toLocaleDateString('sv-SE') ||
                              'Okänt datum'}
                          </div>
                        </div>

                        {option.notes && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-blue-800">{option.notes}</p>
                          </div>
                        )}

                        <button
                          onClick={() => handleEdit(option)}
                          className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                        >
                          Redigera
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Premium Options */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Premium-alternativ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pickupOptions.filter(o => o.isPremium).map((option) => {
              const isEditing = editingMethod === option.method;

              return (
                <div
                  key={option.id}
                  className={`bg-white rounded-lg shadow-sm border-2 p-6 ${
                    option.isActive ? 'border-green-200' : 'border-gray-200'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">
                        {option.method === 'dhl' ? '📦' : '🚴'}
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {option.name}
                        </h3>
                        <p className="text-sm text-gray-500">{option.coverage}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {option.isActive ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                          Aktiv
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                          Inaktiv
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 mb-4">{option.description}</p>

                  {/* Price */}
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pris (SEK)
                        </label>
                        <input
                          type="number"
                          value={editValues.price || 0}
                          onChange={(e) =>
                            setEditValues({ ...editValues, price: Number(e.target.value) })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Anteckningar
                        </label>
                        <textarea
                          value={editValues.notes || ''}
                          onChange={(e) =>
                            setEditValues({ ...editValues, notes: e.target.value })
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`active-${option.method}`}
                          checked={editValues.isActive ?? option.isActive}
                          onChange={(e) =>
                            setEditValues({ ...editValues, isActive: e.target.checked })
                          }
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={`active-${option.method}`}
                          className="ml-2 block text-sm text-gray-700"
                        >
                          Aktiv tjänst
                        </label>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSave(option.method)}
                          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                        >
                          Spara
                        </button>
                        <button
                          onClick={handleCancel}
                          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                        >
                          Avbryt
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="text-3xl font-bold text-gray-900">
                          {option.price} kr
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Senast uppdaterad:{' '}
                          {option.lastUpdated?.toDate?.()?.toLocaleDateString('sv-SE') ||
                            'Okänt datum'}
                        </div>
                      </div>

                      {option.notes && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                          <p className="text-sm text-blue-800">{option.notes}</p>
                        </div>
                      )}

                      <button
                        onClick={() => handleEdit(option)}
                        className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                      >
                        Redigera
                      </button>
                    </>
                  )}
                </div>
              );
            })}
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <span className="text-2xl mr-3">💡</span>
              <div>
                <h3 className="font-medium text-blue-900 mb-2">Information</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• DHL: Rikstäckande upphämtning över hela Sverige</li>
                  <li>• Stockholm Lokalbud: Snabb upphämtning inom Stockholmsområdet</li>
                  <li>• Priserna visas för kunden i beställningsflödet</li>
                  <li>• Inaktiva tjänster visas inte för kunden</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'sv', ['common'])),
    },
  };
};

export default PickupPricingPage;
