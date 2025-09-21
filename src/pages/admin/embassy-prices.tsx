import React, { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import {
  getAllActivePricingRules,
  setPricingRule,
  updatePricingRule,
  PricingRule
} from '@/firebase/pricingService';

interface EmbassyPrice {
  countryCode: string;
  countryName: string;
  officialFee: number;
  serviceFee: number;
  totalPrice: number;
  lastUpdated?: Date;
}

function EmbassyPricesAdminPage() {
  const { t } = useTranslation('common');
  const { currentUser } = useAuth();
  const [embassyPrices, setEmbassyPrices] = useState<EmbassyPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load embassy prices from Firebase
  useEffect(() => {
    loadEmbassyPrices();
  }, []);

  const loadEmbassyPrices = async () => {
    try {
      setLoading(true);
      const allRules = await getAllActivePricingRules();

      // Filter only embassy services
      const embassyRules = allRules.filter(rule => rule.serviceType === 'embassy');

      const formattedPrices: EmbassyPrice[] = embassyRules.map(rule => ({
        countryCode: rule.countryCode,
        countryName: rule.countryName,
        officialFee: rule.officialFee,
        serviceFee: rule.serviceFee,
        totalPrice: rule.basePrice,
        lastUpdated: rule.lastUpdated?.toDate()
      }));

      // Sort by country name
      formattedPrices.sort((a, b) => a.countryName.localeCompare(b.countryName));

      setEmbassyPrices(formattedPrices);
    } catch (error) {
      console.error('Error loading embassy prices:', error);
      toast.error('Kunde inte ladda ambassadpriser');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOfficialFee = async (countryCode: string, newOfficialFee: number) => {
    try {
      setSaving(true);

      // Find existing rule
      const existingRule = embassyPrices.find(p => p.countryCode === countryCode);
      if (!existingRule) {
        toast.error('Kunde inte hitta landet');
        return;
      }

      const ruleId = `${countryCode}_embassy`;
      const newTotalPrice = newOfficialFee + existingRule.serviceFee;

      await updatePricingRule(ruleId, {
        officialFee: newOfficialFee,
        basePrice: newTotalPrice,
        updatedBy: currentUser?.email || 'admin'
      });

      // Update local state
      setEmbassyPrices(prev =>
        prev.map(price =>
          price.countryCode === countryCode
            ? {
                ...price,
                officialFee: newOfficialFee,
                totalPrice: newTotalPrice,
                lastUpdated: new Date()
              }
            : price
        )
      );

      toast.success(`${existingRule.countryName} ambassadavgift uppdaterad!`);
    } catch (error) {
      console.error('Error updating embassy fee:', error);
      toast.error('Kunde inte uppdatera ambassadavgift');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateServiceFee = async (countryCode: string, newServiceFee: number) => {
    try {
      setSaving(true);

      // Find existing rule
      const existingRule = embassyPrices.find(p => p.countryCode === countryCode);
      if (!existingRule) {
        toast.error('Kunde inte hitta landet');
        return;
      }

      const ruleId = `${countryCode}_embassy`;
      const newTotalPrice = existingRule.officialFee + newServiceFee;

      await updatePricingRule(ruleId, {
        serviceFee: newServiceFee,
        basePrice: newTotalPrice,
        updatedBy: currentUser?.email || 'admin'
      });

      // Update local state
      setEmbassyPrices(prev =>
        prev.map(price =>
          price.countryCode === countryCode
            ? {
                ...price,
                serviceFee: newServiceFee,
                totalPrice: newTotalPrice,
                lastUpdated: new Date()
              }
            : price
        )
      );

      toast.success(`${existingRule.countryName} serviceavgift uppdaterad!`);
    } catch (error) {
      console.error('Error updating service fee:', error);
      toast.error('Kunde inte uppdatera serviceavgift');
    } finally {
      setSaving(false);
    }
  };

  const handleAddEmbassy = async (countryCode: string, countryName: string, officialFee: number) => {
    try {
      setSaving(true);

      const serviceFee = 100; // Default service fee
      const totalPrice = officialFee + serviceFee;

      await setPricingRule({
        countryCode,
        countryName,
        serviceType: 'embassy',
        officialFee,
        serviceFee,
        basePrice: totalPrice,
        processingTime: { standard: 15 },
        currency: 'SEK',
        updatedBy: currentUser?.email || 'admin',
        isActive: true
      });

      // Add to local state
      const newEmbassy: EmbassyPrice = {
        countryCode,
        countryName,
        officialFee,
        serviceFee,
        totalPrice,
        lastUpdated: new Date()
      };

      setEmbassyPrices(prev => [...prev, newEmbassy].sort((a, b) => a.countryName.localeCompare(b.countryName)));

      toast.success(`${countryName} ambassad tillagd!`);
    } catch (error) {
      console.error('Error adding embassy:', error);
      toast.error('Kunde inte lägga till ambassad');
    } finally {
      setSaving(false);
    }
  };

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
        <title>Ambassadpriser - Admin | Legaliseringstjänst</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Ambassadpriser per land</h1>
            <p className="mt-2 text-gray-600">
              Uppdatera officiella ambassadavgifter som skiljer sig åt beroende på vilket land det gäller.
              Alla ändringar sparas direkt i Firebase och visas för kunder.
            </p>
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
                <h3 className="text-sm font-medium text-blue-800">
                  Hur fungerar detta?
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>• <strong>Officiell avgift</strong>: Vad ambassaden tar (skiljer sig per land)</p>
                  <p>• <strong>Serviceavgift</strong>: Din hanteringsavgift (samma för alla)</p>
                  <p>• <strong>Totalpris</strong>: Vad kunden betalar</p>
                  <p>• <strong>Alla ändringar</strong> sparas direkt i Firebase</p>
                </div>
              </div>
            </div>
          </div>

          {/* Current Embassy Prices */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Nuvarande ambassadpriser</h2>
              <p className="text-sm text-gray-600 mt-1">
                {embassyPrices.length} länder med ambassadlegalisering
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Land
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Officiell avgift
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serviceavgift
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Totalpris
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Senast uppdaterad
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {embassyPrices.map((price) => (
                    <tr key={price.countryCode}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {price.countryName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {price.countryCode}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={price.officialFee}
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value) || 0;
                            // Update local state immediately for better UX
                            setEmbassyPrices(prev =>
                              prev.map(p =>
                                p.countryCode === price.countryCode
                                  ? { ...p, officialFee: newValue, totalPrice: newValue + p.serviceFee }
                                  : p
                              )
                            );
                          }}
                          onBlur={(e) => handleUpdateOfficialFee(price.countryCode, parseInt(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={saving}
                        />
                        <span className="text-sm text-gray-500 ml-1">kr</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={price.serviceFee}
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value) || 0;
                            // Update local state immediately for better UX
                            setEmbassyPrices(prev =>
                              prev.map(p =>
                                p.countryCode === price.countryCode
                                  ? { ...p, serviceFee: newValue, totalPrice: p.officialFee + newValue }
                                  : p
                              )
                            );
                          }}
                          onBlur={(e) => handleUpdateServiceFee(price.countryCode, parseInt(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={saving}
                        />
                        <span className="text-sm text-gray-500 ml-1">kr</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-semibold text-green-600">
                          {price.totalPrice} kr
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {price.lastUpdated ? price.lastUpdated.toLocaleDateString('sv-SE') : 'Aldrig'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add New Embassy */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lägg till nytt land</h3>
            <AddEmbassyForm onAdd={handleAddEmbassy} disabled={saving} />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

// Component for adding new embassy
function AddEmbassyForm({ onAdd, disabled }: { onAdd: (countryCode: string, countryName: string, officialFee: number) => void, disabled: boolean }) {
  const [countryCode, setCountryCode] = useState('');
  const [countryName, setCountryName] = useState('');
  const [officialFee, setOfficialFee] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (countryCode && countryName && officialFee) {
      onAdd(countryCode.toUpperCase(), countryName, parseInt(officialFee));
      setCountryCode('');
      setCountryName('');
      setOfficialFee('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Landskod</label>
        <input
          type="text"
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="AO"
          required
          disabled={disabled}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Land</label>
        <input
          type="text"
          value={countryName}
          onChange={(e) => setCountryName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Angola"
          required
          disabled={disabled}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Officiell avgift (kr)</label>
        <input
          type="number"
          value={officialFee}
          onChange={(e) => setOfficialFee(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="5000"
          required
          disabled={disabled}
        />
      </div>
      <div className="flex items-end">
        <button
          type="submit"
          disabled={disabled || !countryCode || !countryName || !officialFee}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {disabled ? 'Sparar...' : 'Lägg till'}
        </button>
      </div>
    </form>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'sv', ['common'])),
    },
  };
};

export default EmbassyPricesAdminPage;