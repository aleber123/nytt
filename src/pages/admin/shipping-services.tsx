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

interface ShippingService {
  code: string;
  name: string;
  description: string;
  provider: string;
  basePrice: number;
  additionalPrice?: number; // per kg or per item
  estimatedDelivery: string;
  lastUpdated?: Date;
}

function ShippingServicesPage() {
  const { t } = useTranslation('common');
  const { currentUser } = useAuth();
  const [services, setServices] = useState<ShippingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Default shipping services
  const defaultServices: ShippingService[] = [
    // PostNord
    {
      code: 'postnord-rek',
      name: 'PostNord Rekommenderat',
      description: 'Registered letter - trackable and insured',
      provider: 'PostNord',
      basePrice: 85,
      estimatedDelivery: '2-5 business days'
    },

    // DHL Services
    {
      code: 'dhl-sweden',
      name: 'DHL Sverige',
      description: 'DHL delivery within Sweden',
      provider: 'DHL',
      basePrice: 180,
      estimatedDelivery: '1-2 business days'
    },
    {
      code: 'dhl-europe',
      name: 'DHL Europa',
      description: 'DHL delivery within Europe',
      provider: 'DHL',
      basePrice: 250,
      estimatedDelivery: '2-4 business days'
    },
    {
      code: 'dhl-worldwide',
      name: 'DHL Worldwide',
      description: 'DHL international delivery',
      provider: 'DHL',
      basePrice: 450,
      estimatedDelivery: '3-7 business days'
    },
    {
      code: 'dhl-pre-12',
      name: 'DHL Pre 12',
      description: 'Delivery before 12:00 next business day',
      provider: 'DHL',
      basePrice: 350,
      estimatedDelivery: 'Next business day before 12:00'
    },
    {
      code: 'dhl-pre-9',
      name: 'DHL Pre 9',
      description: 'Delivery before 09:00 next business day',
      provider: 'DHL',
      basePrice: 450,
      estimatedDelivery: 'Next business day before 09:00'
    },

    // Local Stockholm Couriers
    {
      code: 'stockholm-city',
      name: 'Stockholm City Courier',
      description: 'Local courier service within Stockholm',
      provider: 'Lokal',
      basePrice: 120,
      estimatedDelivery: 'Same day (before 16:00)'
    },
    {
      code: 'stockholm-express',
      name: 'Stockholm Express',
      description: 'Express delivery within Stockholm same day',
      provider: 'Lokal',
      basePrice: 180,
      estimatedDelivery: '2-4 hours'
    },
    {
      code: 'stockholm-sameday',
      name: 'Stockholm Same Day',
      description: 'Same day delivery within Stockholm',
      provider: 'Lokal',
      basePrice: 250,
      estimatedDelivery: 'Within 2 hours'
    }
  ];

  useEffect(() => {
    loadShippingServices();
  }, []);

  const loadShippingServices = async () => {
    try {
      setLoading(true);
      const allRules = await getAllActivePricingRules();

      // Filter to only shipping services
      const shippingRules = allRules.filter(rule =>
        ['postnord-rek', 'postnord-express', 'dhl-sweden', 'dhl-europe', 'dhl-worldwide', 'dhl-pre-12', 'dhl-pre-9', 'stockholm-city', 'stockholm-express', 'stockholm-sameday'].includes(rule.serviceType) &&
        rule.countryCode === 'GLOBAL'
      );

      // Merge with default services
      const mergedServices = defaultServices.map(defaultService => {
        const existingRule = shippingRules.find(rule => rule.serviceType === defaultService.code);
        if (existingRule) {
          return {
            ...defaultService,
            basePrice: existingRule.basePrice,
            lastUpdated: existingRule.lastUpdated?.toDate()
          };
        }
        return defaultService;
      });

      setServices(mergedServices);
    } catch (error) {
      // Use default values if Firebase fails
      setServices(defaultServices);
      toast.error('Could not load shipping prices from Firebase - using default prices');
    } finally {
      setLoading(false);
    }
  };

  const updateShippingPrice = async (serviceCode: string, newPrice: number) => {
    try {
      setSaving(true);

      const service = services.find(s => s.code === serviceCode);
      if (!service) return;

      // Use the new updateOrCreatePricingRule function
      await updateOrCreatePricingRule(
        `GLOBAL_${serviceCode}`,
        {
          officialFee: newPrice,
          serviceFee: 0,
          basePrice: newPrice,
          updatedBy: currentUser?.email || 'admin'
        },
        {
          countryCode: 'GLOBAL',
          countryName: 'Global',
          serviceType: serviceCode as any,
          officialFee: newPrice,
          serviceFee: 0,
          basePrice: newPrice,
          processingTime: { standard: 1 },
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
                basePrice: newPrice,
                lastUpdated: new Date()
              }
            : s
        )
      );

      toast.success(`${service.name} price updated!`);
    } catch (error) {
      toast.error('Could not update shipping price');
    } finally {
      setSaving(false);
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'PostNord': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DHL': return 'bg-red-100 text-red-800 border-red-200';
      case 'Lokal': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
        <title>Shipping/Transport Services - Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🚚 Shipping/Transport Services
            </h1>
            <p className="text-gray-600">
              Manage prices for various shipping and transport services. All changes are automatically saved to Firebase.
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <div className="text-2xl mr-3">💡</div>
              <div>
                <h3 className="text-sm font-medium text-blue-800 mb-1">
                  How it works:
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>Click on the price</strong> to change the shipping price</li>
                  <li>• <strong>Enter the new price</strong> and press Enter or click outside</li>
                  <li>• <strong>All changes</strong> are saved directly to Firebase</li>
                  <li>• <strong>Local services</strong> are only available within Stockholm</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Services by Provider */}
          {['PostNord', 'DHL', 'Lokal'].map(provider => {
            const providerServices = services.filter(s => s.provider === provider);

            return (
              <div key={provider} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getProviderColor(provider)} mr-3`}>
                    {provider}
                  </span>
                  {provider === 'PostNord' && '📮'}
                  {provider === 'DHL' && '📦'}
                  {provider === 'Lokal' && '🏙️'}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {providerServices.map((service) => (
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
                            Updated {service.lastUpdated.toLocaleDateString('en-GB')}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-4">{service.description}</p>

                      {/* Delivery Time */}
                      <div className="mb-4">
                        <span className="text-sm text-gray-600">Delivery time:</span>
                        <span className="text-sm font-medium text-gray-900 ml-2">{service.estimatedDelivery}</span>
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-gray-900">Price:</span>
                        <div className="flex items-center">
                          <input
                            type="number"
                            value={service.basePrice}
                            onChange={(e) => {
                              const newValue = parseInt(e.target.value) || 0;
                              setServices(prev =>
                                prev.map(s =>
                                  s.code === service.code
                                    ? { ...s, basePrice: newValue }
                                    : s
                                )
                              );
                            }}
                            onFocus={(e) => {
                              // Select all text when focused for better UX
                              e.target.select();
                            }}
                            onBlur={(e) => updateShippingPrice(service.code, parseInt((e.target as HTMLInputElement).value) || 0)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                updateShippingPrice(service.code, parseInt((e.target as HTMLInputElement).value) || 0);
                              }
                            }}
                            className="w-24 px-3 py-2 text-right border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-bold"
                            disabled={saving}
                          />
                          <span className="text-lg text-gray-500 ml-2">kr</span>
                        </div>
                      </div>

                      {/* Status Indicator */}
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-xs text-gray-500">
                            {saving ? 'Saving...' : 'Ready to update'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Summary */}
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Summary - Shipping Services</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{services.length}</div>
                <div className="text-sm text-gray-600">Shipping services</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {services.reduce((sum, s) => sum + s.basePrice, 0).toLocaleString('en-GB')}
                </div>
                <div className="text-sm text-gray-600">kr total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(services.reduce((sum, s) => sum + s.basePrice, 0) / services.length).toLocaleString('en-GB')}
                </div>
                <div className="text-sm text-gray-600">kr average</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {services.filter(s => s.provider === 'Lokal').length}
                </div>
                <div className="text-sm text-gray-600">local services</div>
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

export default ShippingServicesPage;