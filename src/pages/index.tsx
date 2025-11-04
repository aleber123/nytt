import { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import HeroSection from '@/components/ui/HeroSection';
import ProcessSteps from '@/components/ui/ProcessSteps';
import TestimonialSection from '@/components/ui/TestimonialSection';
import FAQSection from '@/components/ui/FAQSection';
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

export default function Home() {
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
    // Start with fallback data
    const fallbackData = getFallbackPricingData();
    const pricingData: any[] = [...fallbackData];

    if (rules.length > 0) {
      // Group by service type and get average prices - filter for Sweden (SE) since admin manages Swedish services
      const swedishRules = rules.filter(rule => rule.countryCode === 'SE');
      console.log('📊 Landing page - Swedish rules found:', swedishRules.length);
      console.log('📊 Landing page - Swedish apostille rules:', swedishRules.filter(r => r.serviceType === 'apostille').map(r => ({ id: r.id, processingTime: r.processingTime })));

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
        console.log(`🔄 Homepage - updating ${serviceType}: processingTime=${processingTime}, rule.processingTime=`, rule.processingTime, 'type:', typeof rule.processingTime);
        if (typeof rule.processingTime === 'object' && rule.processingTime !== null) {
          console.log(`   - processingTime.standard:`, rule.processingTime.standard);
        }

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
          console.log(`✅ Homepage - updated ${serviceType} timeframe to: "${pricingData[fallbackIndex].timeframe}"`);
        } else {
          console.log(`❌ Homepage - no fallback entry found for ${serviceType}, available types:`, pricingData.map(p => p.serviceType));
        }
      });
    }

    return pricingData;
  };

  const getFallbackPricingData = () => [
    {
      serviceType: 'apostille',
      service: 'Apostille',
      description: 'För länder anslutna till Haagkonventionen',
      officialFee: '850 kr',
      serviceFee: '100 kr',
      totalPrice: '950 kr',
      timeframe: 'Kontakta oss',
      features: ['Officiell legalisering', 'Giltig i Haag-länder', 'Snabb handläggning', 'Digital leverans']
    },
    {
      serviceType: 'notarization',
      service: 'Notarisering',
      description: 'Juridisk bekräftelse av dokument',
      officialFee: '1,200 kr',
      serviceFee: '100 kr',
      totalPrice: '1,300 kr',
      timeframe: 'Kontakta oss',
      features: ['Notarius publicus', 'Juridisk giltighet', 'Originaldokument krävs', 'Snabb handläggning']
    },
    {
      serviceType: 'embassy',
      service: 'Ambassadlegalisering',
      description: 'För länder utanför Haagkonventionen',
      officialFee: 'Från 1,500 kr (exkl. moms)',
      serviceFee: '150 kr (inkl. moms)',
      totalPrice: 'Från 1,650 kr',
      timeframe: 'Kontakta oss',
      features: ['Ambassad/konsulat', 'Internationell giltighet', 'Komplex process', 'Hög säkerhet']
    },
    {
      serviceType: 'translation',
      service: 'Auktoriserad översättning',
      description: 'Officiella översättningar',
      officialFee: 'Från 1,350 kr',
      serviceFee: '100 kr',
      totalPrice: 'Från 1,450 kr',
      timeframe: 'Kontakta oss',
      features: ['Certifierade översättare', 'Alla språk', 'Officiell stämpel']
    },
    {
      serviceType: 'chamber',
      service: 'Handelskammaren',
      description: 'Handelskammarens legalisering',
      officialFee: '2,300 kr',
      serviceFee: '100 kr',
      totalPrice: '2,400 kr',
      timeframe: 'Kontakta oss',
      features: ['Handelskammarens stämpel', 'Internationell giltighet', 'Företagshandlingar', 'Officiell legalisering']
    },
    {
      serviceType: 'ud',
      service: 'Utrikesdepartementet',
      description: 'UD:s legalisering',
      officialFee: '1,650 kr',
      serviceFee: '100 kr',
      totalPrice: '1,750 kr',
      timeframe: 'Kontakta oss',
      features: ['Utrikesdepartementets stämpel', 'Högsta myndighet', 'Internationell giltighet', 'Officiell legalisering']
    }
  ];

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
        return 'home';
      case 'ud':
      case 'utrikesdepartementet':
        return 'landmark';
      default:
        return 'document-check';
    }
  };

  const steps = [
    {
      id: 1,
      title: 'Beställ online',
      description: 'Fyll i vårt enkla beställningsformulär och välj önskad tjänst',
      icon: 'form'
    },
    {
      id: 2,
      title: 'Vi hanterar dina dokument',
      description: 'Våra experter ser till att dina dokument blir korrekt legaliserade',
      icon: 'document'
    },
    {
      id: 3,
      title: 'Få dina legaliserade dokument',
      description: 'Vi levererar dina legaliserade dokument enligt vald leveransmetod',
      icon: 'delivery'
    }
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-custom-button mx-auto mb-4"></div>
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
      default:
        return null;
    }
  };

  return (
    <>
      <Head>
        <title>{t('home.title')} | Legaliseringstjänst</title>
        <meta name="description" content={t('home.description')} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <HeroSection 
          title={t('hero.title')}
          subtitle={t('hero.subtitle')}
          ctaText={t('hero.cta')}
          ctaLink="/bestall"
        />

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-heading font-bold text-gray-900 mb-4">
                Välj rätt tjänst för dina behov
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Vi förenklar legaliseringsprocessen med tydliga tjänster anpassade för olika situationer
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
                        Populär
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
                    <div className="mb-4">
                      <p className="text-sm text-gray-500">Från</p>
                      <p className="text-lg font-bold text-custom-button">{service.price}</p>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/bestall?service=${service.id}`}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-custom-button hover:bg-custom-button/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-button"
                      >
                        Välj tjänst
                      </Link>
                      <Link
                        href={`/tjanster/${service.id === 'auktoriseradöversättning' ? 'oversattning' : service.id}`}
                        className="inline-flex items-center justify-center px-4 py-2 border border-custom-button text-custom-button hover:bg-custom-button hover:text-white rounded-md transition-colors duration-200"
                      >
                        Läs mer
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <ProcessSteps
          title="Så här fungerar det"
          subtitle="Vår process är enkel och effektiv för att spara dig tid och besvär"
          steps={steps}
        />


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
