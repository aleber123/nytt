import React, { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import { getAllActivePricingRules, PricingRule } from '@/firebase/pricingService';

const PricesPage: React.FC = () => {
  const { t } = useTranslation('common');
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch pricing data from Firebase
  useEffect(() => {
    const fetchPricingData = async () => {
      try {
        setLoading(true);
        const rules = await getAllActivePricingRules();
        setPricingRules(rules);
        setError(null);
      } catch (err) {
        console.error('Error fetching pricing data:', err);
        setError('Kunde inte ladda prisdata');
        // Fallback to empty array
        setPricingRules([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPricingData();
  }, []);

  // Group pricing rules by service type and get representative prices
  const getPricingData = () => {
    if (pricingRules.length === 0) {
      // Fallback to hardcoded data if no Firebase data - with REAL prices instead of "kontakta oss"
      return [
        {
          service: 'Apostille',
          description: 'För länder anslutna till Haagkonventionen',
          officialFee: '850 kr',
          serviceFee: '100 kr',
          totalPrice: '950 kr',
          timeframe: '5-7 arbetsdagar',
          features: [
            'Officiell legalisering',
            'Giltig i Haag-länder',
            'Snabb handläggning',
            'Digital leverans'
          ]
        },
        {
          service: 'Notarisering',
          description: 'Juridisk bekräftelse av dokument',
          officialFee: '1,200 kr',
          serviceFee: '100 kr',
          totalPrice: '1,300 kr',
          timeframe: '8 arbetsdagar',
          features: [
            'Notarius publicus',
            'Juridisk giltighet',
            'Originaldokument krävs',
            'Snabb handläggning'
          ]
        },
        {
          service: 'Ambassadlegalisering',
          description: 'För länder utanför Haagkonventionen',
          officialFee: 'Från 1,500 kr',
          serviceFee: '150 kr',
          totalPrice: 'Från 1,650 kr',
          timeframe: '15 arbetsdagar',
          features: [
            'Ambassad/konsulat',
            'Internationell giltighet',
            'Komplex process',
            'Hög säkerhet'
          ]
        },
        {
          service: 'Auktoriserad översättning',
          description: 'Officiella översättningar',
          officialFee: 'Från 1,350 kr',
          serviceFee: '100 kr',
          totalPrice: 'Från 1,450 kr',
          timeframe: '10 arbetsdagar',
          features: [
            'Certifierade översättare',
            'Officiell stämpel',
            'Alla språk',
            'Kvalitetsgaranti'
          ]
        },
        {
          service: 'Handelskammaren',
          description: 'Handelskammarens legalisering',
          officialFee: '2,300 kr',
          serviceFee: '100 kr',
          totalPrice: '2,400 kr',
          timeframe: '12 arbetsdagar',
          features: [
            'Handelskammarens stämpel',
            'Internationell giltighet',
            'Företagshandlingar',
            'Officiell legalisering'
          ]
        },
        {
          service: 'Utrikesdepartementet',
          description: 'UD:s legalisering',
          officialFee: '1,650 kr',
          serviceFee: '100 kr',
          totalPrice: '1,750 kr',
          timeframe: '10 arbetsdagar',
          features: [
            'Utrikesdepartementets stämpel',
            'Högsta myndighet',
            'Internationell giltighet',
            'Officiell legalisering'
          ]
        }
      ];
    }

    // Group by service type and get average prices
    const serviceGroups: { [key: string]: PricingRule[] } = {};
    pricingRules.forEach(rule => {
      if (!serviceGroups[rule.serviceType]) {
        serviceGroups[rule.serviceType] = [];
      }
      serviceGroups[rule.serviceType].push(rule);
    });

    // Create pricing data from Firebase data
    const pricingData = Object.entries(serviceGroups).map(([serviceType, rules]) => {
      // Calculate average price for this service type
      const avgPrice = rules.reduce((sum, rule) => sum + rule.basePrice, 0) / rules.length;
      const avgProcessingTime = Math.round(rules.reduce((sum, rule) => sum + rule.processingTime.standard, 0) / rules.length);

      const serviceLabels = {
        apostille: {
          title: 'Apostille',
          description: 'För länder anslutna till Haagkonventionen',
          features: ['Officiell legalisering', 'Giltig i Haag-länder', 'Snabb handläggning', 'Digital leverans']
        },
        notarization: {
          title: 'Notarisering',
          description: 'Juridisk bekräftelse av dokument',
          features: ['Notarius publicus', 'Juridisk giltighet', 'Originaldokument krävs', 'Snabb handläggning']
        },
        embassy: {
          title: 'Ambassadlegalisering',
          description: 'För länder utanför Haagkonventionen',
          features: ['Ambassad/konsulat', 'Internationell giltighet', 'Komplex process', 'Hög säkerhet']
        },
        translation: {
          title: 'Auktoriserad översättning',
          description: 'Officiella översättningar',
          features: ['Certifierade översättare', 'Officiell stämpel', 'Alla språk', 'Kvalitetsgaranti']
        },
        chamber: {
          title: 'Handelskammaren',
          description: 'Handelskammarens legalisering',
          features: ['Handelskammarens stämpel', 'Internationell giltighet', 'Företagshandlingar', 'Officiell legalisering']
        },
        ud: {
          title: 'Utrikesdepartementet',
          description: 'UD:s legalisering',
          features: ['Utrikesdepartementets stämpel', 'Högsta myndighet', 'Internationell giltighet', 'Officiell legalisering']
        }
      };

      const serviceInfo = serviceLabels[serviceType as keyof typeof serviceLabels] || {
        title: serviceType.charAt(0).toUpperCase() + serviceType.slice(1),
        description: `Legaliserings tjänst för ${serviceType}`,
        features: ['Officiell legalisering', 'Internationell giltighet', 'Snabb handläggning', 'Digital leverans']
      };

      // Handle quoted services (translation and embassy)
      if (serviceType === 'translation' || serviceType === 'embassy') {
        return {
          service: serviceInfo.title,
          description: serviceInfo.description,
          officialFee: 'Offereras',
          serviceFee: 'Offereras',
          totalPrice: 'Offereras',
          timeframe: `${avgProcessingTime} arbetsdagar`,
          features: serviceInfo.features
        };
      }

      return {
        service: serviceInfo.title,
        description: serviceInfo.description,
        officialFee: `${Math.round(avgPrice * 0.9)} kr`, // Approximate official fee
        serviceFee: `${Math.round(avgPrice * 0.1)} kr`,   // Approximate service fee
        totalPrice: `${Math.round(avgPrice)} kr`,
        timeframe: `${avgProcessingTime} arbetsdagar`,
        features: serviceInfo.features
      };
    });

    return pricingData;
  };

  const pricingData = getPricingData();

  const additionalFees = [
    { service: 'Express-service', price: '+500 kr', description: 'Snabbare handläggning' },
    { service: 'Postleverans', price: '+50 kr', description: 'Leverans med post' },
    { service: 'Expressleverans', price: '+150 kr', description: 'Expressleverans' },
    { service: 'Fler dokument', price: 'Enligt offert', description: 'För stora volymer' }
  ];

  // Show loading state
  if (loading) {
    return (
      <>
        <Head>
          <title>{t('prices.title') || 'Priser - Legaliseringstjänst'}</title>
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Laddar prisinformation...</p>
          </div>
        </div>
      </>
    );
  }

  // Show error state
  if (error) {
    return (
      <>
        <Head>
          <title>{t('prices.title') || 'Priser - Legaliseringstjänst'}</title>
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Kunde inte ladda priser</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
            >
              Försök igen
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{t('prices.title') || 'Priser - Legaliseringstjänst'}</title>
        <meta
          name="description"
          content={t('prices.description') || 'Se våra konkurrenskraftiga priser för dokumentlegalisering. Transparent prissättning utan dolda avgifter.'}
        />
      </Head>

      <div className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 py-16 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>

            <h1 className="text-4xl md:text-5xl font-heading font-bold text-white text-center mb-4">
              {t('prices.title') || 'Priser'}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 text-center mt-4 max-w-3xl mx-auto leading-relaxed">
              {t('prices.subtitle') || 'Transparent prissättning utan dolda avgifter'}
            </p>

            <div className="mt-8">
              {pricingRules.length > 0 ? (
                <div className="inline-flex items-center px-6 py-3 rounded-full text-base font-medium bg-green-500/20 text-green-100 border border-green-400/30">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Uppdaterade priser från {pricingRules.length} länder
                </div>
              ) : (
                <div className="inline-flex items-center px-6 py-3 rounded-full text-base font-medium bg-yellow-500/20 text-yellow-100 border border-yellow-400/30">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Visar standardpriser (systemet laddar fortfarande)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Main Services Pricing */}
          <section className="mb-16">
            <h2 className="text-2xl font-heading font-bold text-gray-900 mb-8 text-center">
              {t('prices.servicesTitle') || 'Våra tjänster'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pricingData.map((service, index) => (
                <div key={index} className="bg-white rounded-lg shadow-card p-6 border border-gray-200 hover:shadow-lg transition-shadow flex flex-col h-full">
                  <div className="flex-1">
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {service.service}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
                        {service.description}
                      </p>
                      <div className="text-3xl font-bold text-primary-600 mb-2">
                        {service.totalPrice}
                      </div>
                      <div className="text-sm text-gray-500">
                        {service.timeframe}
                      </div>
                    </div>

                    <ul className="space-y-2 mb-6">
                      {service.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href="/bestall"
                    className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors text-center block mt-auto"
                  >
                    {t('prices.orderButton') || 'Beställ'}
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* Additional Fees */}
          <section className="mb-16">
            <h2 className="text-3xl font-heading font-bold text-gray-900 mb-12 text-center">
              {t('prices.additionalTitle') || 'Tilläggstjänster'}
            </h2>

            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-8 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {additionalFees.map((fee, index) => (
                  <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div>
                      <div className="font-semibold text-gray-900 text-lg mb-2">{fee.service}</div>
                      <div className="text-gray-600 text-sm leading-relaxed">{fee.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Pricing Information */}
          <section className="mb-16">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                {t('prices.infoTitle') || 'Viktig information'}
              </h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {t('prices.info1') || 'Alla priser är exklusive moms (25%)'}
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {t('prices.info2') || 'Priserna kan variera beroende på dokumenttyp och komplexitet'}
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {t('prices.info3') || 'Digital leverans är kostnadsfri för de flesta tjänster'}
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {t('prices.info4') || 'Kontakta oss för offert vid större volymer eller specialfall'}
                </li>
              </ul>
            </div>
          </section>

          {/* Call to Action */}
          <section className="text-center">
            <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
              {t('prices.ctaTitle') || 'Redo att beställa?'}
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              {t('prices.ctaText') || 'Få dina dokument legaliserade snabbt och enkelt. Kontakta oss idag för att komma igång.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/bestall"
                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {t('prices.ctaButton') || 'Beställ nu'}
              </Link>
              <Link
                href="/kontakt"
                className="inline-flex items-center justify-center px-8 py-3 border border-primary-600 text-base font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {t('prices.contactButton') || 'Kontakta oss'}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'sv', ['common'])),
    },
  };
};

export default PricesPage;