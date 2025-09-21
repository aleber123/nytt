import React, { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Link from 'next/link';
import Head from 'next/head';
import { getAllActivePricingRules, PricingRule } from '@/firebase/pricingService';

interface ServiceOverview {
  id: string;
  title: string;
  shortDescription: string;
  icon: string;
  price: string;
  timeframe: string;
  popular: boolean;
  features: string[];
}

const ServicesPage: React.FC = () => {
  const { t } = useTranslation('common');

  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);

  // Fetch pricing data from Firebase
  useEffect(() => {
    const fetchPricingData = async () => {
      try {
        setLoading(true);
        const rules = await getAllActivePricingRules();
        setPricingRules(rules);

        // Create services from pricing data
        const pricingData = getPricingData(rules);
        setServices(pricingData.map(service => ({
          id: service.service.toLowerCase().replace(/\s+/g, ''),
          title: service.service,
          shortDescription: service.description,
          icon: getServiceIcon(service.service.toLowerCase()),
          price: service.totalPrice,
          timeframe: service.timeframe,
          popular: service.service === 'Apostille',
          features: service.features
        })));

      } catch (err) {
        console.error('Error fetching pricing data:', err);
        // Fallback to hardcoded data
        const fallbackData = getFallbackPricingData();
        setServices(fallbackData.map(service => ({
          id: service.service.toLowerCase().replace(/\s+/g, ''),
          title: service.service,
          shortDescription: service.description,
          icon: getServiceIcon(service.service.toLowerCase()),
          price: service.totalPrice,
          timeframe: service.timeframe,
          popular: service.service === 'Apostille',
          features: service.features
        })));
      } finally {
        setLoading(false);
      }
    };

    fetchPricingData();
  }, []);

  // Helper functions
  const getPricingData = (rules: PricingRule[]) => {
    if (rules.length === 0) {
      return getFallbackPricingData();
    }

    // Group by service type and get average prices
    const serviceGroups: { [key: string]: PricingRule[] } = {};
    rules.forEach(rule => {
      if (!serviceGroups[rule.serviceType]) {
        serviceGroups[rule.serviceType] = [];
      }
      serviceGroups[rule.serviceType].push(rule);
    });

    // Filter out return services (ud) - only keep core legalization services
    const allowedServices = ['apostille', 'notarization', 'embassy', 'translation', 'chamber'];
    const filteredServiceGroups = Object.fromEntries(
      Object.entries(serviceGroups).filter(([serviceType]) => allowedServices.includes(serviceType))
    );

    // Create pricing data from Firebase data
    const pricingData = Object.entries(filteredServiceGroups).map(([serviceType, serviceRules]) => {
      // Calculate average price for this service type
      const avgPrice = serviceRules.reduce((sum, rule) => sum + rule.basePrice, 0) / serviceRules.length;
      const avgProcessingTime = Math.round(serviceRules.reduce((sum, rule) => sum + rule.processingTime.standard, 0) / serviceRules.length);

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
        title: serviceType,
        description: `Legaliserings tjänst för ${serviceType}`,
        features: ['Officiell legalisering', 'Internationell giltighet', 'Snabb handläggning', 'Digital leverans']
      };

      // Handle quoted services (translation and embassy)
      if (serviceType === 'translation') {
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

      // Handle embassy services with VAT clarification
      if (serviceType === 'embassy') {
        return {
          service: serviceInfo.title,
          description: serviceInfo.description,
          officialFee: 'Från 1,500 kr (exkl. moms)',
          serviceFee: '150 kr (inkl. moms)',
          totalPrice: 'Från 1,650 kr',
          timeframe: `${avgProcessingTime} arbetsdagar`,
          features: serviceInfo.features
        };
      }

      return {
        service: serviceInfo.title,
        description: serviceInfo.description,
        officialFee: `${Math.round(avgPrice * 0.9)} kr`,
        serviceFee: `${Math.round(avgPrice * 0.1)} kr`,
        totalPrice: `${Math.round(avgPrice)} kr`,
        timeframe: `${avgProcessingTime} arbetsdagar`,
        features: serviceInfo.features
      };
    });

    return pricingData;
  };

  const getFallbackPricingData = () => [
    {
      service: 'Apostille',
      description: 'För länder anslutna till Haagkonventionen',
      officialFee: '850 kr',
      serviceFee: '100 kr',
      totalPrice: '950 kr',
      timeframe: '5-7 arbetsdagar',
      features: ['Officiell legalisering', 'Giltig i Haag-länder', 'Snabb handläggning', 'Digital leverans']
    },
    {
      service: 'Notarisering',
      description: 'Juridisk bekräftelse av dokument',
      officialFee: '1,200 kr',
      serviceFee: '100 kr',
      totalPrice: '1,300 kr',
      timeframe: '8 arbetsdagar',
      features: ['Notarius publicus', 'Juridisk giltighet', 'Originaldokument krävs', 'Snabb handläggning']
    },
    {
      service: 'Ambassadlegalisering',
      description: 'För länder utanför Haagkonventionen',
      officialFee: 'Från 1,500 kr (exkl. moms)',
      serviceFee: '150 kr (inkl. moms)',
      totalPrice: 'Från 1,650 kr',
      timeframe: '15 arbetsdagar',
      features: ['Ambassad/konsulat', 'Internationell giltighet', 'Komplex process', 'Hög säkerhet']
    },
    {
      service: 'Auktoriserad översättning',
      description: 'Officiella översättningar',
      officialFee: 'Från 1,350 kr',
      serviceFee: '100 kr',
      totalPrice: 'Från 1,450 kr',
      timeframe: '10 arbetsdagar',
      features: ['Certifierade översättare', 'Officiell stämpel', 'Alla språk', 'Kvalitetsgaranti']
    },
    {
      service: 'Handelskammaren',
      description: 'Handelskammarens legalisering',
      officialFee: '2,300 kr',
      serviceFee: '100 kr',
      totalPrice: '2,400 kr',
      timeframe: '12 arbetsdagar',
      features: ['Handelskammarens stämpel', 'Internationell giltighet', 'Företagshandlingar', 'Officiell legalisering']
    }
  ];

  const getServiceDescription = (serviceType: string): string => {
    switch (serviceType) {
      case 'apostille':
        return 'Snabb legalisering för Haagkonventionsländer';
      case 'notarization':
        return 'Officiell bekräftelse av dokument och signaturer';
      case 'embassy':
        return 'Legalistering via ambassad för icke-Haagländer';
      case 'translation':
        return 'Auktoriserade översättningar för officiellt bruk';
      case 'ud':
        return 'Officiell legalisering via svenska UD';
      default:
        return '';
    }
  };

  const getServiceIcon = (serviceType: string): string => {
    switch (serviceType) {
      case 'apostille':
      case 'apostille':
        return 'document-check';
      case 'notarization':
      case 'notarisering':
        return 'seal';
      case 'embassy':
      case 'ambassad':
        return 'building';
      case 'translation':
      case 'oversattning':
        return 'language';
      case 'chamber':
      case 'handelskammaren':
        return 'building';
      case 'ud':
      case 'utrikesdepartementet':
        return 'government';
      default:
        return 'document-check';
    }
  };

  const getServiceFeatures = (serviceType: string): string[] => {
    switch (serviceType) {
      case 'apostille':
        return ['För 120+ länder', 'Snabb process', 'Kostnadseffektiv'];
      case 'notarization':
        return ['Juridisk giltighet', 'Personlig identifiering', 'Officiell stämpel'];
      case 'embassy':
        return ['För Asien och Mellanöstern', 'Ambassadkontakt', 'Komplett process'];
      case 'translation':
        return ['Certifierade översättare', 'Alla språk', 'Officiell stämpel'];
      case 'ud':
        return ['Svensk myndighet', 'Internationell giltighet', 'Officiell process'];
      default:
        return [];
    }
  };

  const getFallbackServices = (t: any): ServiceOverview[] => [
    {
      id: 'apostille',
      title: t('services.apostille.title'),
      shortDescription: 'Snabb legalisering för Haagkonventionsländer',
      icon: 'document-check',
      price: t('services.apostille.price'),
      timeframe: t('services.apostille.timeframe'),
      popular: true,
      features: ['För 120+ länder', 'Snabb process', 'Kostnadseffektiv']
    },
    {
      id: 'notarisering',
      title: t('services.notarization.title'),
      shortDescription: 'Officiell bekräftelse av dokument och signaturer',
      icon: 'seal',
      price: t('services.notarization.price'),
      timeframe: t('services.notarization.timeframe'),
      popular: false,
      features: ['Juridisk giltighet', 'Personlig identifiering', 'Officiell stämpel']
    },
    {
      id: 'ambassad',
      title: t('services.embassy.title'),
      shortDescription: 'Legalistering via ambassad för icke-Haagländer',
      icon: 'building',
      price: t('services.embassy.price'),
      timeframe: t('services.embassy.timeframe'),
      popular: false,
      features: ['För Asien och Mellanöstern', 'Ambassadkontakt', 'Komplett process']
    },
    {
      id: 'oversattning',
      title: t('services.translation.title'),
      shortDescription: 'Auktoriserade översättningar för officiellt bruk',
      icon: 'language',
      price: t('services.translation.price'),
      timeframe: t('services.translation.timeframe'),
      popular: false,
      features: ['Certifierade översättare', 'Alla språk', 'Officiell stämpel']
    },
    {
      id: 'ud',
      title: 'Utrikesdepartementet',
      shortDescription: 'Officiell legalisering via svenska UD',
      icon: 'government',
      price: 'Från 795 kr',
      timeframe: '5-7 arbetsdagar',
      popular: false,
      features: ['Svensk myndighet', 'Internationell giltighet', 'Officiell process']
    }
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar tjänster...</p>
        </div>
      </div>
    );
  }


  // Funktion för att rendera ikoner baserat på ikonnamn
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'document-check':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'seal':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        );
      case 'building':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'language':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
        );
      case 'government':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M3 10h18M3 18h18M5 21v-3m2 0v-3m2 0v-3m2 0v-3m2 0v-3m2 0v-3m2 0v-3M12 3l-7 4h14l-7-4z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Head>
        <title>{t('services.pageTitle') || 'Tjänster & Priser - Legaliseringstjänst'}</title>
        <meta
          name="description"
          content={t('services.pageDescription') || 'Se våra tjänster och priser för dokumentlegalisering. Apostille, notarisering, ambassadlegalisering och auktoriserad översättning med transparent prissättning.'}
        />
      </Head>

      <div className="bg-primary-700 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-white text-center">
            {t('services.pageTitle') || 'Tjänster & Priser'}
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto mb-16 text-center">
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
            {t('services.pageIntro') || 'Välj rätt tjänst för dina behov'}
          </h2>
          <p className="text-lg text-gray-600">
            Vi förenklar legaliseringsprocessen med tydliga tjänster anpassade för olika situationer
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {services.map((service) => (
            <div key={service.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  {renderIcon(service.icon)}
                  <h3 className="text-xl font-heading font-bold text-gray-900 ml-3">
                    {service.title}
                  </h3>
                </div>
                {service.popular && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    Populär
                  </span>
                )}
              </div>

              <p className="text-gray-600 mb-4">
                {service.shortDescription}
              </p>

              <div className="space-y-2 mb-6">
                {service.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-600">
                    <svg className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Från</p>
                    <p className="text-lg font-bold text-primary-600">{service.price}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Leveranstid</p>
                    <p className="text-sm font-medium">{service.timeframe}</p>
                  </div>
                </div>

                <Link
                  href={`/bestall?service=${service.id}`}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Välj tjänst
                </Link>
              </div>
            </div>
          ))}
        </div>


        {/* Call to Action */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-heading font-bold text-gray-900 mb-4">
            Osäker vilken tjänst du behöver?
          </h3>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Kontakta oss så hjälper vi dig att välja rätt legaliseringstjänst för dina dokument och destination.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/kontakt"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Kontakta oss
            </Link>
            <Link
              href="/bestall"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Starta beställning
            </Link>
          </div>
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

export default ServicesPage;
