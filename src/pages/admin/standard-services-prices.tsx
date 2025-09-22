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
      description: 'För länder anslutna till Haagkonventionen',
      officialFee: 850,
      serviceFee: 100,
      totalPrice: 950,
      processingTime: 5
    },
    {
      code: 'notarization',
      name: 'Notarisering',
      description: 'Officiell notarisering av dokument',
      officialFee: 1200,
      serviceFee: 100,
      totalPrice: 1300,
      processingTime: 8
    },
    {
      code: 'chamber',
      name: 'Handelskammarens legalisering',
      description: 'Legaliserng av handelsdokument genom Handelskammaren',
      officialFee: 2300,
      serviceFee: 100,
      totalPrice: 2400,
      processingTime: 7
    },
    {
      code: 'translation',
      name: 'Auktoriserad översättning',
      description: 'Officiella översättningar av dokument - från-pris',
      officialFee: 1350,
      serviceFee: 100,
      totalPrice: 1450,
      processingTime: 10
    },
    {
      code: 'ud',
      name: 'Utrikesdepartementet',
      description: 'UD:s legalisering för icke-Haagkonventionsländer',
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
            lastUpdated: existingRule.lastUpdated?.toDate()
          };
        }
        return defaultService;
      });

      setServices(mergedServices);
    } catch (error) {
      console.error('Error loading standard services:', error);
      // Use default values if Firebase fails
      setServices(defaultServices);
      toast.error('Kunde inte ladda priser från Firebase - använder standardpriser');
    } finally {
      setLoading(false);
    }
  };

  const updateServiceFee = async (serviceCode: string, newOfficialFee: number, newServiceFee?: number, newProcessingTime?: number) => {
    try {
      setSaving(true);

      const service = services.find(s => s.code === serviceCode);
      if (!service) return;

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

      toast.success(`${service.name} priser uppdaterade!`);
    } catch (error) {
      console.error('Error updating service fee:', error);
      toast.error('Kunde inte uppdatera priset');
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
        <title>Standardtjänster - Sverige - Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📋 Standardtjänster - Sverige
            </h1>
            <p className="text-gray-600">
              Uppdatera priser för standardtjänster. Alla ändringar sparas automatiskt i Firebase.
            </p>
          </div>


          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service.code} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* Service Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                      <p className="text-sm text-gray-500">{service.code.toUpperCase()}</p>
                    </div>
                  </div>
                  {service.lastUpdated && (
                    <span className="text-xs text-gray-400">
                      Uppdaterad {service.lastUpdated.toLocaleDateString('sv-SE')}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4">{service.description}</p>

                {/* Price Breakdown */}
                <div className="space-y-3">
                  {service.code === 'translation' ? (
                    /* Special UI for translation service */
                    <>
                      {/* Official Fee - Editable for translation */}
                      <div className="flex items-center justify-between py-1">
                        <span className="text-sm text-gray-600 flex-shrink-0 w-32">Officiell avgift:</span>
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
                            onFocus={(e) => {
                              // Select all text when focused for better UX
                              e.target.select();
                            }}
                            onBlur={(e) => updateServiceFee(service.code, parseInt((e.target as HTMLInputElement).value) || 0)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                updateServiceFee(service.code, parseInt((e.target as HTMLInputElement).value) || 0);
                              }
                            }}
                            className="w-28 px-3 py-2 text-right border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                            disabled={saving}
                          />
                          <span className="text-sm text-gray-500 ml-2">kr</span>
                        </div>
                      </div>

                      {/* Service Fee - Editable for translation */}
                      <div className="flex items-center justify-between py-1">
                        <span className="text-sm text-gray-600 flex-shrink-0 w-32">Serviceavgift:</span>
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
                            onFocus={(e) => {
                              // Select all text when focused for better UX
                              e.target.select();
                            }}
                            onBlur={(e) => updateServiceFee(service.code, service.officialFee, parseInt((e.target as HTMLInputElement).value) || 0)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                updateServiceFee(service.code, service.officialFee, parseInt((e.target as HTMLInputElement).value) || 0);
                              }
                            }}
                            className="w-24 px-3 py-2 text-right border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                            disabled={saving}
                          />
                          <span className="text-sm text-gray-500 ml-2">kr</span>
                        </div>
                      </div>

                      {/* Processing Time - Editable for translation */}
                      <div className="flex items-center justify-between py-1">
                        <span className="text-sm text-gray-600 flex-shrink-0 w-32">Handläggningstid:</span>
                        <div className="flex items-center">
                          <input
                            type="number"
                            value={service.processingTime || 10}
                            onChange={(e) => {
                              const newProcessingTime = Math.max(1, Math.min(90, parseInt(e.target.value) || 1));
                              setServices(prev =>
                                prev.map(s =>
                                  s.code === service.code
                                    ? { ...s, processingTime: newProcessingTime }
                                    : s
                                )
                              );
                            }}
                            onFocus={(e) => {
                              // Select all text when focused for better UX
                              e.target.select();
                            }}
                            onBlur={(e) => {
                              const value = parseInt((e.target as HTMLInputElement).value) || 1;
                              const validValue = Math.max(1, Math.min(90, value));
                              updateServiceFee(service.code, service.officialFee, service.serviceFee, validValue);
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const value = parseInt((e.target as HTMLInputElement).value) || 1;
                                const validValue = Math.max(1, Math.min(90, value));
                                updateServiceFee(service.code, service.officialFee, service.serviceFee, validValue);
                              }
                            }}
                            className="w-28 px-3 py-2 text-right border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                            disabled={saving}
                            min="1"
                            max="90"
                          />
                          <span className="text-sm text-gray-500 ml-2">dagar</span>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-200"></div>

                      {/* Total Price */}
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-gray-900">Från-pris:</span>
                        <span className="text-xl font-bold text-green-600">Från {service.totalPrice || 1450} kr</span>
                      </div>

                      {/* Information about variable pricing */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                        <div className="flex items-start">
                          <span className="text-lg mr-2">📝</span>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-blue-900 mb-1">Variabel prissättning</div>
                            <div className="text-xs text-blue-700">
                              Detta är baspriset. Slutpriset kan variera beroende på språkpar, längd och komplexitet.
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Regular price inputs for other services */
                    <>
                      {/* Official Fee - Editable */}
                      <div className="flex items-center justify-between py-1">
                        <span className="text-sm text-gray-600 flex-shrink-0 w-32">Officiell avgift:</span>
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
                            onFocus={(e) => {
                              // Select all text when focused for better UX
                              e.target.select();
                            }}
                            onBlur={(e) => updateServiceFee(service.code, parseInt((e.target as HTMLInputElement).value) || 0)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                updateServiceFee(service.code, parseInt((e.target as HTMLInputElement).value) || 0);
                              }
                            }}
                            className="w-24 px-3 py-2 text-right border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                            disabled={saving}
                          />
                          <span className="text-sm text-gray-500 ml-2">kr</span>
                        </div>
                      </div>

                      {/* Service Fee - Editable */}
                      <div className="flex items-center justify-between py-1">
                        <span className="text-sm text-gray-600 flex-shrink-0 w-32">Serviceavgift:</span>
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
                            onFocus={(e) => {
                              // Select all text when focused for better UX
                              e.target.select();
                            }}
                            onBlur={(e) => updateServiceFee(service.code, service.officialFee, parseInt((e.target as HTMLInputElement).value) || 0)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                updateServiceFee(service.code, service.officialFee, parseInt((e.target as HTMLInputElement).value) || 0);
                              }
                            }}
                            className="w-24 px-3 py-2 text-right border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                            disabled={saving}
                          />
                          <span className="text-sm text-gray-500 ml-2">kr</span>
                        </div>
                      </div>

                      {/* Processing Time - Editable */}
                      <div className="flex items-center justify-between py-1">
                        <span className="text-sm text-gray-600 flex-shrink-0 w-32">Handläggningstid:</span>
                        <div className="flex items-center">
                          <input
                            type="number"
                            value={service.processingTime}
                            onChange={(e) => {
                              const newProcessingTime = Math.max(1, Math.min(90, parseInt(e.target.value) || 1));
                              setServices(prev =>
                                prev.map(s =>
                                  s.code === service.code
                                    ? { ...s, processingTime: newProcessingTime }
                                    : s
                                )
                              );
                            }}
                            onFocus={(e) => {
                              // Select all text when focused for better UX
                              e.target.select();
                            }}
                            onBlur={(e) => {
                              const value = parseInt((e.target as HTMLInputElement).value) || 1;
                              const validValue = Math.max(1, Math.min(90, value));
                              updateServiceFee(service.code, service.officialFee, service.serviceFee, validValue);
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const value = parseInt((e.target as HTMLInputElement).value) || 1;
                                const validValue = Math.max(1, Math.min(90, value));
                                updateServiceFee(service.code, service.officialFee, service.serviceFee, validValue);
                              }
                            }}
                            className="w-28 px-3 py-2 text-right border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                            disabled={saving}
                            min="1"
                            max="90"
                          />
                          <span className="text-sm text-gray-500 ml-2">dagar</span>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-200"></div>

                      {/* Total Price */}
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-gray-900">Totalpris:</span>
                        <span className="text-xl font-bold text-green-600">{service.totalPrice} kr</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Status Indicator */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-xs text-gray-500">
                      {saving ? 'Sparar...' : 'Redo att uppdatera'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Sammanfattning - Sverige</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{services.length}</div>
                <div className="text-sm text-gray-600">Standardtjänster</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {services.reduce((sum, s) => sum + s.totalPrice, 0).toLocaleString('sv-SE')}
                </div>
                <div className="text-sm text-gray-600">kr totalt (medel)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(services.reduce((sum, s) => sum + s.totalPrice, 0) / services.length).toLocaleString('sv-SE')}
                </div>
                <div className="text-sm text-gray-600">kr genomsnitt</div>
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
      ...(await serverSideTranslations(locale || 'sv', ['common'])),
    },
  };
};

export default StandardServicesPricesPage;