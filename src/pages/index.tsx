import { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Seo from '@/components/Seo';
import Link from 'next/link';
import HeroCarousel from '@/components/ui/HeroCarousel';
import ProcessSteps from '@/components/ui/ProcessSteps';
import TestimonialSection from '@/components/ui/TestimonialSection';
import FAQSection from '@/components/ui/FAQSection';
import { getAllActivePricingRules, PricingRule } from '@/firebase/pricingService';

interface ServiceOverview {
  id: string;
  serviceType: string;
  title: string;
  shortDescription: string;
  icon: string;
  price: string;
  timeframe: string;
  popular: boolean;
  features: string[];
}

export default function Home() {
  const { t } = useTranslation('common');
  const router = useRouter();

  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);

  const getServiceFeatures = (serviceType: string, fallbackFeatures: string[] = []): string[] => {
    const key = `home.servicesFeatures.${serviceType}`;
    const translated = t(key, { returnObjects: true }) as unknown;
    if (Array.isArray(translated)) {
      return (translated as unknown[]).filter((item): item is string => typeof item === 'string');
    }
    return fallbackFeatures;
  };

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
          id: service.serviceType, // Use serviceType as ID (not translated name)
          serviceType: service.serviceType,
          title: t(`services.${service.serviceType}.title`),
          shortDescription: t(`services.${service.serviceType}.description`),
          icon: getServiceIcon(service.serviceType),
          price:
            (service.serviceType === 'translation' || service.serviceType === 'visa')
              ? t('home.translationPriceLabel', 'Offert')
              : service.totalPrice,
          timeframe: service.timeframe,
          popular: service.serviceType === 'apostille',
          features: getServiceFeatures(service.serviceType, service.features || [])
        })));

      } catch (err) {
        // On Firebase error, show services without prices
        const fallbackData = getFallbackPricingData();
        setServices(fallbackData.map(service => ({
          id: service.serviceType, // Use serviceType as ID (not translated name)
          serviceType: service.serviceType,
          title: t(`services.${service.serviceType}.title`),
          shortDescription: t(`services.${service.serviceType}.description`),
          icon: getServiceIcon(service.serviceType),
          price: '', // No price shown on error
          timeframe: '',
          popular: service.serviceType === 'apostille',
          features: getServiceFeatures(service.serviceType, service.features || [])
        })));
      } finally {
        setLoading(false);
      }
    };

    fetchPricingData();
  }, [router.locale]); // Re-run when language changes

  // Helper functions
  const getPricingData = (rules: PricingRule[]) => {
    // Start with fallback data
    const fallbackData = getFallbackPricingData();
    const pricingData: any[] = [...fallbackData];

    if (rules.length > 0) {
      // Group by service type and get average prices - filter for Sweden (SE) since admin manages Swedish services
      const swedishRules = rules.filter(rule => rule.countryCode === 'SE');

      const serviceGroups: { [key: string]: PricingRule[] } = {};
      swedishRules.forEach(rule => {
        if (!serviceGroups[rule.serviceType]) {
          serviceGroups[rule.serviceType] = [];
        }
        serviceGroups[rule.serviceType].push(rule);
      });

      // Update pricing data with Firebase data where available
      Object.entries(serviceGroups).forEach(([serviceType, serviceRules]) => {
        // Use the first rule for pricing (assuming all Swedish rules have similar pricing)
        const rule = serviceRules[0];
        const processingTime = rule.processingTime?.standard || rule.processingTime || 5; // Default to 5 if not set

        // Find the corresponding fallback entry and update it
        const fallbackIndex = pricingData.findIndex(p => p.serviceType === serviceType);

        if (fallbackIndex !== -1) {
          // Update timeframe for all services from Firebase data
          pricingData[fallbackIndex] = {
            ...pricingData[fallbackIndex],
            officialFee: `${rule.officialFee} kr`,
            serviceFee: `${rule.serviceFee} kr`,
            totalPrice: `${rule.basePrice} kr`,
            timeframe: `${processingTime} arbetsdagar`
          };
        } else {
          // No fallback entry found for this serviceType
        }
      });
    }

    return pricingData;
  };

  const getFallbackPricingData = () => [
    {
      serviceType: 'apostille',
      service: 'Apostille',
      description: t('services.apostille.description'),
      officialFee: '',
      serviceFee: '',
      totalPrice: '',
      timeframe: '',
      features: ['Officiell legalisering', 'Giltig i Haag-länder', 'Snabb handläggning', 'Digital leverans']
    },
    {
      serviceType: 'notarization',
      service: 'Notarisering',
      description: t('services.notarization.description'),
      officialFee: '',
      serviceFee: '',
      totalPrice: '',
      timeframe: '',
      features: ['Notarius publicus', 'Juridisk giltighet', 'Digital leverans', 'Snabb handläggning']
    },
    {
      serviceType: 'embassy',
      service: 'Ambassadlegalisering',
      description: t('services.embassy.description'),
      officialFee: '',
      serviceFee: '',
      totalPrice: '',
      timeframe: '',
      features: ['Ambassad/konsulat', 'Internationell giltighet', 'Komplex process', 'Hög säkerhet']
    },
    {
      serviceType: 'translation',
      service: 'Auktoriserad översättning',
      description: t('services.translation.description'),
      officialFee: '',
      serviceFee: '',
      totalPrice: '',
      timeframe: '',
      features: ['Certifierade översättare', 'Alla språk', 'Officiell stämpel']
    },
    {
      serviceType: 'chamber',
      service: 'Handelskammaren',
      description: t('services.chamber.description'),
      officialFee: '',
      serviceFee: '',
      totalPrice: '',
      timeframe: '',
      features: ['Handelskammarens stämpel', 'Internationell giltighet', 'Företagshandlingar', 'Officiell legalisering']
    },
    {
      serviceType: 'ud',
      service: 'Utrikesdepartementet',
      description: t('services.ud.description'),
      officialFee: '',
      serviceFee: '',
      totalPrice: '',
      timeframe: '',
      features: ['Utrikesdepartementets stämpel', 'Högsta myndighet', 'Internationell giltighet', 'Officiell legalisering']
    },
    {
      serviceType: 'visa',
      service: 'Visum',
      description: t('services.visa.description'),
      officialFee: '',
      serviceFee: '',
      totalPrice: '',
      timeframe: '',
      features: ['Alla länder', 'E-visum & sticker-visum', 'Snabb handläggning', 'Personlig service']
    }
  ];

  const getServiceIcon = (serviceType: string): string => {
    switch (serviceType) {
      case 'apostille':
        return 'document-check';
      case 'notarization':
        return 'seal';
      case 'embassy':
        return 'building';
      case 'translation':
        return 'language';
      case 'chamber':
        return 'home';
      case 'ud':
        return 'landmark';
      case 'visa':
        return 'passport';
      default:
        return 'document-check';
    }
  };

  // Map serviceType to URL slug (always Swedish slugs since pages are in Swedish)
  const getServiceSlug = (serviceType: string): string => {
    switch (serviceType) {
      case 'apostille':
        return 'apostille';
      case 'notarization':
        return 'notarius-publicus';
      case 'embassy':
        return 'ambassadlegalisering';
      case 'translation':
        return 'oversattning';
      case 'chamber':
        return 'handelskammaren';
      case 'ud':
        return 'utrikesdepartementet';
      case 'visa':
        return 'visum';
      default:
        return serviceType;
    }
  };

  const steps = [
    {
      id: 1,
      title: t('home.steps.1.title'),
      description: t('home.steps.1.description'),
      icon: 'form'
    },
    {
      id: 2,
      title: t('home.steps.2.title'),
      description: t('home.steps.2.description'),
      icon: 'document'
    },
    {
      id: 3,
      title: t('home.steps.3.title'),
      description: t('home.steps.3.description'),
      icon: 'delivery'
    }
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-custom-button mx-auto"></div>
        </div>
      </div>
    );
  }

  // Funktion för att rendera ikoner baserat på ikonnamn
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'document-check':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-custom-button" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'seal':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-custom-button" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        );
      case 'building':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-custom-button" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'language':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-custom-button" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
        );
      case 'government':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-custom-button" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M3 10h18M3 18h18M5 21v-3m2 0v-3m2 0v-3m2 0v-3m2 0v-3m2 0v-3m2 0v-3M12 3l-7 4h14l-7-4z" />
          </svg>
        );
      case 'landmark':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-custom-button" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'home':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-custom-button" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case 'passport':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-custom-button" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Seo 
        title={t('home.title', 'Legalisering av Dokument | Apostille & Ambassad') + ' | DOX Visumpartner'} 
        description={t('home.description', 'Professionell legalisering för utlandet. Apostille, notarisering, UD och ambassad. Snabb service i Stockholm.')} 
        keywords="legalisering, apostille, ambassadlegalisering, notarius publicus, utrikesdepartementet, dokumentlegalisering, UD legalisering"
      />

      <main>
        <HeroCarousel />

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-heading font-bold text-gray-900 mb-4">
                {t('home.servicesHeading')}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {t('home.servicesSubheading')}
              </p>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {services.map((service) => (
                <div key={service.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      {renderIcon(service.icon)}
                      <h3 className="text-xl font-heading font-bold text-gray-900 ml-3">
                        {service.title}
                      </h3>
                    </div>
                    {service.popular && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-custom-button/10 text-custom-button">
                        {t('home.popularLabel')}
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 mb-4">
                    {service.shortDescription}
                  </p>

                  <div className="space-y-2 mb-6 flex-grow">
                    {service.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-600">
                        <svg className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 mt-auto">
                    {service.price ? (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500">{t('home.from')}</p>
                        <p className="text-lg font-bold text-custom-button">{service.price}</p>
                        <p className="text-xs text-gray-400">{t('home.inclVat', 'inkl. moms')}</p>
                      </div>
                    ) : (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500">{t('services.contactForPrice', { defaultValue: 'Kontakta oss för pris' })}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Link
                        href={service.serviceType === 'visa' ? '/visum/bestall' : `/bestall?service=${service.id}`}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-custom-button hover:bg-custom-button/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-button"
                      >
                        {t('home.chooseService')}
                      </Link>
                      <Link
                        href={service.serviceType === 'visa' ? '/visum' : `/tjanster/${getServiceSlug(service.serviceType)}`}
                        className="inline-flex items-center justify-center px-4 py-2 border border-custom-button text-custom-button hover:bg-custom-button hover:text-white rounded-md transition-colors duration-200"
                      >
                        {t('home.learnMore')}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <ProcessSteps
          title={t('home.howItWorksTitle')}
          subtitle={t('home.howItWorksSubtitle')}
          steps={steps}
        />

        {/* Trust Badges Section */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-custom-button/10 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-custom-button" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-900">{t('home.trustBadges.customers', '500+ nöjda kunder')}</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-custom-button/10 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-custom-button" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-900">{t('home.trustBadges.fastDelivery', 'Snabb leverans')}</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-custom-button/10 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-custom-button" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-900">{t('home.trustBadges.secureHandling', 'Säker hantering')}</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-custom-button/10 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-custom-button" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-900">{t('home.trustBadges.personalService', 'Personlig service')}</span>
              </div>
              <div className="flex flex-col items-center text-center col-span-2 md:col-span-1">
                <div className="w-12 h-12 bg-custom-button/10 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-custom-button" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-900">{t('home.trustBadges.gdpr', 'GDPR-säkrat')}</span>
              </div>
            </div>
          </div>
        </section>

        <FAQSection />

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-heading font-bold text-gray-900 mb-6">
              {t('home.ctaTitle')}
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {t('home.ctaText')}
            </p>
            <Link href="/bestall" className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-custom-button hover:bg-custom-button/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-button">
              {t('home.ctaButton')}
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'sv', ['common'])),
    },
  };
};
