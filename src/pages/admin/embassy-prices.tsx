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
import { ALL_COUNTRIES } from '@/components/order/data/countries';

// Get English country name by looking up in ALL_COUNTRIES (by Swedish name or code)
const getEnglishCountryName = (swedishName: string, countryCode?: string): string => {
  // First try to find by country code (most reliable)
  if (countryCode) {
    const byCode = ALL_COUNTRIES.find(c => c.code === countryCode);
    if (byCode?.nameEn) return byCode.nameEn;
  }
  // Fallback: try to find by Swedish name
  const byName = ALL_COUNTRIES.find(c => c.name === swedishName);
  if (byName?.nameEn) return byName.nameEn;
  // Last resort: return original name
  return swedishName;
};

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
      toast.error('Could not load embassy prices');
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
        toast.error('Could not find the country');
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

      toast.success(`${existingRule.countryName} embassy fee updated!`);
    } catch (error) {
      toast.error('Could not update embassy fee');
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
        toast.error('Could not find the country');
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

      toast.success(`${existingRule.countryName} service fee updated!`);
    } catch (error) {
      toast.error('Could not update service fee');
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

      toast.success(`${countryName} embassy added!`);
    } catch (error) {
      toast.error('Could not add embassy');
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
        <title>Embassy Prices - Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Embassy Prices by Country</h1>
            <p className="mt-2 text-gray-600">
              Update official embassy fees that vary depending on the country.
              All changes are saved directly to Firebase and shown to customers.
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
                  How does this work?
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>• <strong>Official fee</strong>: What the embassy charges (varies by country)</p>
                  <p>• <strong>Service fee</strong>: Your handling fee (same for all)</p>
                  <p>• <strong>Total price</strong>: What the customer pays</p>
                  <p>• <strong>All changes</strong> are saved directly to Firebase</p>
                </div>
              </div>
            </div>
          </div>

          {/* Current Embassy Prices */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Current Embassy Prices</h2>
              <p className="text-sm text-gray-600 mt-1">
                {embassyPrices.length} countries with embassy legalization
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Country
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Official fee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service fee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last updated
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {embassyPrices.map((price) => (
                    <tr key={price.countryCode}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {getEnglishCountryName(price.countryName, price.countryCode)}
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
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                        {price.lastUpdated ? price.lastUpdated.toLocaleDateString('en-GB') : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add New Embassy */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Country</h3>
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Country code</label>
        <input
          type="text"
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="AO"
          required
          disabled={disabled}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Country name</label>
        <input
          type="text"
          value={countryName}
          onChange={(e) => setCountryName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Angola"
          required
          disabled={disabled}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Official fee (kr)</label>
        <input
          type="number"
          value={officialFee}
          onChange={(e) => setOfficialFee(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="5000"
          required
          disabled={disabled}
        />
      </div>
      <div className="flex items-end">
        <button
          type="submit"
          disabled={disabled || !countryCode || !countryName || !officialFee}
          className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {disabled ? 'Saving...' : 'Add'}
        </button>
      </div>
    </form>
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

export default EmbassyPricesAdminPage;