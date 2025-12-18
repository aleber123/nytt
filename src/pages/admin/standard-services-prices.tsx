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
      console.log('🔄 Admin page - loaded all rules:', allRules.length);

      // Filter to only standard services for Sweden
      const standardRules = allRules.filter(rule =>
        ['apostille', 'notarization', 'chamber', 'translation', 'ud'].includes(rule.serviceType) &&
        rule.countryCode === 'SE'
      );
      console.log('🇸🇪 Admin page - Swedish standard rules:', standardRules.length);
      console.log('📋 Admin page - Swedish rules details:', standardRules.map(r => ({
        serviceType: r.serviceType,
        processingTime: r.processingTime,
        basePrice: r.basePrice
      })));

      // Merge with default services
      const mergedServices = defaultServices.map(defaultService => {
        const existingRule = standardRules.find(rule => rule.serviceType === defaultService.code);
        if (existingRule) {
          // Validate processing time to ensure it's reasonable (1-90 days)
          const processingTime = existingRule.processingTime?.standard;
          const validProcessingTime = (typeof processingTime === 'number' && processingTime >= 1 && processingTime <= 90)
            ? processingTime
            : defaultService.processingTime;

          console.log(`✅ Admin page - loaded ${defaultService.code}: processingTime=${processingTime} → valid=${validProcessingTime}`);

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
        console.log(`⚠️ Admin page - no Firebase record for ${defaultService.code}, using default processingTime=${defaultService.processingTime}`);
        return defaultService;
      });

      console.log('📊 Admin page - final merged services:', mergedServices.map(s => ({
        code: s.code,
        processingTime: s.processingTime,
        lastUpdated: s.lastUpdated
      })));

      setServices(mergedServices);
    } catch (error) {
      console.error('❌ Error loading standard services:', error);
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
      console.log(`🔄 Admin: Starting update for ${serviceCode}, processingTime=${newProcessingTime}`);

      const service = services.find(s => s.code === serviceCode);
      if (!service) {
        console.error(`❌ Admin: Service ${serviceCode} not found in local state`);
        return;
      }

      const serviceFee = newServiceFee !== undefined ? newServiceFee : service.serviceFee;
      const processingTime = newProcessingTime !== undefined ? newProcessingTime : service.processingTime;
      const ruleId = `SE_${serviceCode}`;
      const newTotalPrice = newOfficialFee + serviceFee;

      console.log(`📋 Admin: Updating ${serviceCode} - officialFee: ${newOfficialFee}, serviceFee: ${serviceFee}, processingTime: ${processingTime}, totalPrice: ${newTotalPrice}`);

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

      console.log(`✅ Admin: Successfully saved ${serviceCode} to Firebase`);

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
      console.error('❌ Admin: Error updating service fee:', error);
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
      console.error('Error toggling price unconfirmed:', error);
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📋 Standard Services - Sweden
            </h1>
            <p className="text-gray-600">
              Update prices for standard services. All changes are automatically saved to Firebase.
            </p>
          </div>


          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
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

          {/* Summary */}
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Summary - Sweden</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{services.length}</div>
                <div className="text-sm text-gray-600">Standard services</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {services.reduce((sum, s) => sum + s.totalPrice, 0).toLocaleString('sv-SE')}
                </div>
                <div className="text-sm text-gray-600">kr total (sum)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(services.reduce((sum, s) => sum + s.totalPrice, 0) / services.length).toLocaleString('sv-SE')}
                </div>
                <div className="text-sm text-gray-600">kr average</div>
              </div>
            </div>
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