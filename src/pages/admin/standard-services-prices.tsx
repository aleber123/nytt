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
  updateOrCreatePricingRule
} from '@/firebase/pricingService';

interface StandardService {
  code: string;
  name: string;
  description: string;
  officialFee: number;
  serviceFee: number;
  totalPrice: number;
  processingTime: number;
  lastUpdated?: Date;
  priceUnconfirmed?: boolean;
}

function StandardServicesPricesPage() {
  const { t } = useTranslation('common');
  const { currentUser } = useAuth();
  const [services, setServices] = useState<StandardService[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'unconfirmed'>('all');

  // Standard services for Sweden
  const defaultServices: StandardService[] = [
    {
      code: 'apostille',
      name: 'Apostille',
      description: 'For countries connected to the Hague Convention. International document legalization.',
      officialFee: 850,
      serviceFee: 100,
      totalPrice: 950,
      processingTime: 5
    },
    {
      code: 'notarization',
      name: 'Notarization',
      description: 'Official notarization of documents. Legal confirmation and validity.',
      officialFee: 1200,
      serviceFee: 100,
      totalPrice: 1300,
      processingTime: 8
    },
    {
      code: 'chamber',
      name: 'Chamber of Commerce',
      description: 'Legalization of trade documents through the Chamber of Commerce. Business documents.',
      officialFee: 2300,
      serviceFee: 100,
      totalPrice: 2400,
      processingTime: 7
    },
    {
      code: 'translation',
      name: 'Translation',
      description: 'Official document translations. Certified translators and stamp.',
      officialFee: 1350,
      serviceFee: 100,
      totalPrice: 1450,
      processingTime: 10
    },
    {
      code: 'ud',
      name: 'Ministry of Foreign Affairs',
      description: 'MFA legalization for non-Hague Convention countries.',
      officialFee: 1650,
      serviceFee: 100,
      totalPrice: 1750,
      processingTime: 10
    }
  ];

  useEffect(() => {
    loadStandardServices();
  }, []);

  const loadStandardServices = async () => {
    try {
      setLoading(true);
      const allRules = await getAllActivePricingRules();

      // Filter to only standard services for Sweden
      const standardRules = allRules.filter(rule =>
        ['apostille', 'notarization', 'chamber', 'translation', 'ud'].includes(rule.serviceType) &&
        rule.countryCode === 'SE'
      );

      // Merge with default services
      const mergedServices = defaultServices.map(defaultService => {
        const existingRule = standardRules.find(rule => rule.serviceType === defaultService.code);
        if (existingRule) {
          // Validate processing time to ensure it's reasonable (1-90 days)
          const processingTime = existingRule.processingTime?.standard;
          const validProcessingTime = (typeof processingTime === 'number' && processingTime >= 1 && processingTime <= 90)
            ? processingTime
            : defaultService.processingTime;

          return {
            ...defaultService,
            officialFee: existingRule.officialFee,
            serviceFee: existingRule.serviceFee,
            totalPrice: existingRule.basePrice,
            processingTime: validProcessingTime,
            lastUpdated: existingRule.lastUpdated?.toDate(),
            priceUnconfirmed: existingRule.priceUnconfirmed || false
          };
        }
        return defaultService;
      });

      setServices(mergedServices);
    } catch (error) {
      // Use default values if Firebase fails
      setServices(defaultServices);
      toast.error('Could not load prices from Firebase - using default prices');
    } finally {
      setLoading(false);
    }
  };

  const updateServiceFee = async (serviceCode: string, newOfficialFee: number, newServiceFee?: number, newProcessingTime?: number) => {
    try {
      setSaving(true);

      const service = services.find(s => s.code === serviceCode);
      if (!service) {
        return;
      }

      const serviceFee = newServiceFee !== undefined ? newServiceFee : service.serviceFee;
      const processingTime = newProcessingTime !== undefined ? newProcessingTime : service.processingTime;
      const ruleId = `SE_${serviceCode}`;
      const newTotalPrice = newOfficialFee + serviceFee;

      // Use the new updateOrCreatePricingRule function
      await updateOrCreatePricingRule(
        ruleId,
        {
          officialFee: newOfficialFee,
          serviceFee: serviceFee,
          basePrice: newTotalPrice,
          updatedBy: currentUser?.email || 'admin'
        },
        {
          countryCode: 'SE',
          countryName: 'Sverige',
          serviceType: serviceCode as any,
          officialFee: newOfficialFee,
          serviceFee: serviceFee,
          basePrice: newTotalPrice,
          processingTime: { standard: processingTime },
          currency: 'SEK',
          updatedBy: currentUser?.email || 'admin',
          isActive: true
        }
      );

      // Update local state
      setServices(prev =>
        prev.map(s =>
          s.code === serviceCode
            ? {
                ...s,
                officialFee: newOfficialFee,
                serviceFee: serviceFee,
                processingTime: processingTime,
                totalPrice: newTotalPrice,
                lastUpdated: new Date()
              }
            : s
        )
      );

      toast.success(`${service.name} prices updated!`);
    } catch (error) {
      toast.error(`Could not update ${serviceCode}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const togglePriceUnconfirmed = async (serviceCode: string, unconfirmed: boolean) => {
    try {
      setSaving(true);
      const service = services.find(s => s.code === serviceCode);
      if (!service) return;

      const ruleId = `SE_${serviceCode}`;

      await updateOrCreatePricingRule(
        ruleId,
        {
          priceUnconfirmed: unconfirmed,
          updatedBy: currentUser?.email || 'admin'
        },
        {
          countryCode: 'SE',
          countryName: 'Sverige',
          serviceType: serviceCode as any,
          officialFee: service.officialFee,
          serviceFee: service.serviceFee,
          basePrice: service.totalPrice,
          processingTime: { standard: service.processingTime },
          currency: 'SEK',
          updatedBy: currentUser?.email || 'admin',
          isActive: true,
          priceUnconfirmed: unconfirmed
        }
      );

      setServices(prev =>
        prev.map(s =>
          s.code === serviceCode
            ? { ...s, priceUnconfirmed: unconfirmed, lastUpdated: new Date() }
            : s
        )
      );

      toast.success(unconfirmed ? 'Price marked as unconfirmed' : 'Price marked as confirmed');
    } catch (error) {
      toast.error('Could not update price status');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <Head>
        <title>Standard Services - Sweden - Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">📋 Standard Services - Sweden</h1>
          </div>

          {/* Summary Stats - Like Orders/Embassy page */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total services</p>
                  <p className="text-2xl font-bold text-gray-900">{services.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Confirmed</p>
                  <p className="text-2xl font-bold text-gray-900">{services.filter(s => !s.priceUnconfirmed).length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Unconfirmed</p>
                  <p className="text-2xl font-bold text-gray-900">{services.filter(s => s.priceUnconfirmed).length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avg. price</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(services.reduce((sum, s) => sum + s.totalPrice, 0) / services.length || 0)} kr</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm text-gray-600">Quick filters:</span>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors ${statusFilter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                All ({services.length})
              </button>
              <button
                onClick={() => setStatusFilter('confirmed')}
                className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors ${statusFilter === 'confirmed' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                ✓ Confirmed ({services.filter(s => !s.priceUnconfirmed).length})
              </button>
              <button
                onClick={() => setStatusFilter('unconfirmed')}
                className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors ${statusFilter === 'unconfirmed' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                ⚠ Unconfirmed ({services.filter(s => s.priceUnconfirmed).length})
              </button>
              <button
                onClick={() => loadStandardServices()}
                className="ml-auto px-4 py-2 text-primary-600 hover:text-primary-800 font-medium"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services
              .filter(service => {
                if (statusFilter === 'confirmed') return !service.priceUnconfirmed;
                if (statusFilter === 'unconfirmed') return service.priceUnconfirmed;
                return true;
              })
              .map((service) => (
              <div key={service.code} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{service.name}</h3>
                      <p className="text-sm text-gray-600 font-medium">{service.code.toUpperCase()}</p>
                    </div>
                    {service.lastUpdated && (
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Last updated</div>
                        <div className="text-xs font-medium text-gray-700">
                          {service.lastUpdated.toLocaleDateString('sv-SE')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6">
                  {/* Description */}
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 leading-relaxed">{service.description}</p>
                  </div>

                  {/* Price Configuration */}
                  <div className="space-y-4">
                    {service.code === 'translation' ? (
                      /* Special UI for translation service */
                      <>
                        <div className="grid grid-cols-1 gap-4">
                          {/* Official Fee */}
                          <div className="bg-gray-50 rounded-lg p-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Official fee
                            </label>
                            <div className="flex items-center">
                              <input
                                type="number"
                                value={service.officialFee || 1350}
                                onChange={(e) => {
                                  const newValue = parseInt(e.target.value) || 0;
                                  setServices(prev =>
                                    prev.map(s =>
                                      s.code === service.code
                                        ? { ...s, officialFee: newValue, totalPrice: newValue + s.serviceFee }
                                        : s
                                    )
                                  );
                                }}
                                onFocus={(e) => e.target.select()}
                                onBlur={(e) => updateServiceFee(service.code, parseInt((e.target as HTMLInputElement).value) || 0)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    updateServiceFee(service.code, parseInt((e.target as HTMLInputElement).value) || 0);
                                  }
                                }}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium text-right"
                                disabled={saving}
                              />
                              <span className="ml-2 text-sm text-gray-500 font-medium">kr</span>
                            </div>
                          </div>

                          {/* Service Fee */}
                          <div className="bg-gray-50 rounded-lg p-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Service fee
                            </label>
                            <div className="flex items-center">
                              <input
                                type="number"
                                value={service.serviceFee || 100}
                                onChange={(e) => {
                                  const newServiceFee = parseInt(e.target.value) || 0;
                                  setServices(prev =>
                                    prev.map(s =>
                                      s.code === service.code
                                        ? { ...s, serviceFee: newServiceFee, totalPrice: s.officialFee + newServiceFee }
                                        : s
                                    )
                                  );
                                }}
                                onFocus={(e) => e.target.select()}
                                onBlur={(e) => updateServiceFee(service.code, service.officialFee, parseInt((e.target as HTMLInputElement).value) || 0)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    updateServiceFee(service.code, service.officialFee, parseInt((e.target as HTMLInputElement).value) || 0);
                                  }
                                }}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium text-right"
                                disabled={saving}
                              />
                              <span className="ml-2 text-sm text-gray-500 font-medium">kr</span>
                            </div>
                          </div>
                        </div>

                        {/* Total Price */}
                        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold text-green-900">Starting price:</span>
                            <span className="text-2xl font-bold text-green-600">From {service.totalPrice || 1450} kr</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Regular price inputs for other services */
                      <>
                        <div className="grid grid-cols-1 gap-4">
                          {/* Official Fee */}
                          <div className="bg-gray-50 rounded-lg p-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Official fee
                            </label>
                            <div className="flex items-center">
                              <input
                                type="number"
                                value={service.officialFee}
                                onChange={(e) => {
                                  const newValue = parseInt(e.target.value) || 0;
                                  setServices(prev =>
                                    prev.map(s =>
                                      s.code === service.code
                                        ? { ...s, officialFee: newValue, totalPrice: newValue + s.serviceFee }
                                        : s
                                    )
                                  );
                                }}
                                onFocus={(e) => e.target.select()}
                                onBlur={(e) => updateServiceFee(service.code, parseInt((e.target as HTMLInputElement).value) || 0)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    updateServiceFee(service.code, parseInt((e.target as HTMLInputElement).value) || 0);
                                  }
                                }}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium text-right"
                                disabled={saving}
                              />
                              <span className="ml-2 text-sm text-gray-500 font-medium">kr</span>
                            </div>
                          </div>

                          {/* Service Fee */}
                          <div className="bg-gray-50 rounded-lg p-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Service fee
                            </label>
                            <div className="flex items-center">
                              <input
                                type="number"
                                value={service.serviceFee}
                                onChange={(e) => {
                                  const newServiceFee = parseInt(e.target.value) || 0;
                                  setServices(prev =>
                                    prev.map(s =>
                                      s.code === service.code
                                        ? { ...s, serviceFee: newServiceFee, totalPrice: s.officialFee + newServiceFee }
                                        : s
                                    )
                                  );
                                }}
                                onFocus={(e) => e.target.select()}
                                onBlur={(e) => updateServiceFee(service.code, service.officialFee, parseInt((e.target as HTMLInputElement).value) || 0)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    updateServiceFee(service.code, service.officialFee, parseInt((e.target as HTMLInputElement).value) || 0);
                                  }
                                }}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium text-right"
                                disabled={saving}
                              />
                              <span className="ml-2 text-sm text-gray-500 font-medium">kr</span>
                            </div>
                          </div>
                        </div>

                        {/* Total Price */}
                        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold text-green-900">Total price:</span>
                            <span className="text-2xl font-bold text-green-600">{service.totalPrice} kr</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Price Unconfirmed Toggle */}
                <div className="px-6 py-3 border-t border-gray-100">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={service.priceUnconfirmed || false}
                      onChange={(e) => togglePriceUnconfirmed(service.code, e.target.checked)}
                      className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                      disabled={saving}
                    />
                    <span className={`ml-2 text-sm ${service.priceUnconfirmed ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
                      ⚠️ Price not confirmed
                    </span>
                  </label>
                  {service.priceUnconfirmed && (
                    <p className="mt-1 text-xs text-orange-600 ml-6">
                      Customer sees "To be confirmed" instead of the price
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 mt-auto">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${service.priceUnconfirmed ? 'bg-orange-500' : saving ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></div>
                      <span className="text-xs font-medium text-gray-600">
                        {saving ? 'Saving changes...' : service.priceUnconfirmed ? 'Price unconfirmed' : 'Ready to update'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Press Enter to save
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </ProtectedRoute>
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

export default StandardServicesPricesPage;