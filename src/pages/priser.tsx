import React, { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Seo from '@/components/Seo';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getAllActivePricingRules, PricingRule } from '@/firebase/pricingService';
import { DocumentTextIcon, TruckIcon, BuildingOfficeIcon, GlobeAltIcon, ClockIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

// Service name translations
const getServiceDisplayName = (serviceType: string, isEn: boolean): { title: string; description: string } => {
  const serviceLabels: Record<string, { sv: { title: string; description: string }; en: { title: string; description: string } }> = {
    apostille: {
      sv: { title: 'Apostille', description: 'För länder anslutna till Haagkonventionen' },
      en: { title: 'Apostille', description: 'For countries party to the Hague Convention' }
    },
    notarization: {
      sv: { title: 'Notarisering', description: 'Juridisk bekräftelse av dokument' },
      en: { title: 'Notarization', description: 'Legal certification of documents' }
    },
    embassy: {
      sv: { title: 'Ambassadlegalisering', description: 'För länder utanför Haagkonventionen' },
      en: { title: 'Embassy Legalization', description: 'For countries outside the Hague Convention' }
    },
    translation: {
      sv: { title: 'Auktoriserad översättning', description: 'Officiella översättningar' },
      en: { title: 'Certified Translation', description: 'Official translations' }
    },
    chamber: {
      sv: { title: 'Handelskammaren', description: 'Handelskammarens legalisering' },
      en: { title: 'Chamber of Commerce', description: 'Chamber of Commerce legalization' }
    },
    ud: {
      sv: { title: 'Utrikesdepartementet', description: 'UD:s legalisering' },
      en: { title: 'Ministry for Foreign Affairs', description: 'MFA legalization' }
    },
    'dhl-sweden': {
      sv: { title: 'DHL Sverige', description: 'Leverans inom Sverige' },
      en: { title: 'DHL Sweden', description: 'Delivery within Sweden' }
    },
    'dhl-europe': {
      sv: { title: 'DHL Europa', description: 'Leverans inom Europa' },
      en: { title: 'DHL Europe', description: 'Delivery within Europe' }
    },
    'dhl-world': {
      sv: { title: 'DHL Världen', description: 'Internationell leverans' },
      en: { title: 'DHL World', description: 'International delivery' }
    },
    'dhl-express-12': {
      sv: { title: 'DHL Express 12:00', description: 'Expressleverans före kl. 12' },
      en: { title: 'DHL Express 12:00', description: 'Express delivery before 12:00' }
    },
    'dhl-express-09': {
      sv: { title: 'DHL Express 09:00', description: 'Expressleverans före kl. 09' },
      en: { title: 'DHL Express 09:00', description: 'Express delivery before 09:00' }
    },
    'postnord-rek': {
      sv: { title: 'PostNord Rekommenderat', description: 'Rekommenderad postleverans' },
      en: { title: 'PostNord Registered', description: 'Registered mail delivery' }
    },
    'office-pickup': {
      sv: { title: 'Hämtning på kontoret', description: 'Hämta dina dokument hos oss' },
      en: { title: 'Office Pickup', description: 'Pick up your documents at our office' }
    },
    'own-delivery': {
      sv: { title: 'Egen returfrakt', description: 'Du ordnar egen frakt' },
      en: { title: 'Own Return Shipping', description: 'You arrange your own shipping' }
    },
    express: {
      sv: { title: 'Expresstjänst', description: 'Snabbare handläggning' },
      en: { title: 'Express Service', description: 'Faster processing' }
    },
    pickup_service: {
      sv: { title: 'Upphämtning', description: 'Vi hämtar dina dokument' },
      en: { title: 'Document Pickup', description: 'We pick up your documents' }
    },
    scanned_copies: {
      sv: { title: 'Skannade kopior', description: 'Digitala kopior av dokument' },
      en: { title: 'Scanned Copies', description: 'Digital copies of documents' }
    }
  };

  const lang = isEn ? 'en' : 'sv';
  if (serviceLabels[serviceType]) {
    return serviceLabels[serviceType][lang];
  }
  
  // Fallback: capitalize and clean up the service type
  const cleanName = serviceType
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return { title: cleanName, description: '' };
};

// Get icon for service category
const getServiceIcon = (serviceType: string) => {
  if (serviceType.includes('dhl') || serviceType.includes('postnord') || serviceType === 'own-delivery') {
    return TruckIcon;
  }
  if (serviceType === 'office-pickup' || serviceType === 'pickup_service') {
    return BuildingOfficeIcon;
  }
  if (serviceType === 'embassy') {
    return GlobeAltIcon;
  }
  if (serviceType === 'express') {
    return ClockIcon;
  }
  return DocumentTextIcon;
};

const PricesPage: React.FC = () => {
  const { t } = useTranslation('common');
  const { locale } = useRouter();
  const isEn = locale === 'en';
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
        setError(isEn ? 'Could not load pricing data' : 'Kunde inte ladda prisdata');
        setPricingRules([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPricingData();
  }, [isEn]);

  // Categorize and process pricing data
  const getCategorizedPricing = () => {
    if (pricingRules.length === 0) return { legalization: [], shipping: [], additional: [] };

    const legalizationTypes = ['apostille', 'notarization', 'embassy', 'translation', 'chamber', 'ud'];
    const shippingTypes = ['dhl-sweden', 'dhl-europe', 'dhl-world', 'dhl-express-12', 'dhl-express-09', 'postnord-rek', 'office-pickup', 'own-delivery'];
    const additionalTypes = ['express', 'pickup_service', 'scanned_copies'];

    const categorize = (types: string[]) => {
      return pricingRules
        .filter(rule => types.includes(rule.serviceType))
        .reduce((acc: PricingRule[], rule) => {
          // Only keep one rule per service type (avoid duplicates)
          if (!acc.find(r => r.serviceType === rule.serviceType)) {
            acc.push(rule);
          }
          return acc;
        }, [])
        .sort((a, b) => a.basePrice - b.basePrice);
    };

    return {
      legalization: categorize(legalizationTypes),
      shipping: categorize(shippingTypes),
      additional: categorize(additionalTypes)
    };
  };

  const { legalization, shipping, additional } = getCategorizedPricing();

  const pageTitle = isEn ? 'Prices | DOX Visumpartner' : 'Priser | DOX Visumpartner';
  const pageSubtitle = isEn 
    ? 'Transparent pricing for all our services' 
    : 'Transparent prissättning för alla våra tjänster';

  // Show loading state
  if (loading) {
    return (
      <>
        <Head>
          <title>{pageTitle}</title>
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        </div>
      </>
    );
  }

  // Show error state
  if (error || (legalization.length === 0 && shipping.length === 0)) {
    return (
      <>
        <Head>
          <title>{pageTitle}</title>
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-amber-500 text-6xl mb-4">📋</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {isEn ? 'Contact us for pricing' : 'Kontakta oss för priser'}
            </h2>
            <p className="text-gray-600 mb-6">
              {isEn 
                ? 'We\'ll be happy to provide a quote based on your specific needs.' 
                : 'Vi ger dig gärna en offert baserad på dina specifika behov.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/kontakt"
                className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                {isEn ? 'Contact Us' : 'Kontakta oss'}
              </Link>
              <Link
                href="/bestall"
                className="border border-primary-600 text-primary-600 px-6 py-3 rounded-lg hover:bg-primary-50 transition-colors font-medium"
              >
                {isEn ? 'Order' : 'Beställ'}
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Render a pricing card
  const renderPricingCard = (rule: PricingRule, showFeatures: boolean = false) => {
    const { title, description } = getServiceDisplayName(rule.serviceType, isEn);
    const Icon = getServiceIcon(rule.serviceType);
    const isQuoted = rule.serviceType === 'embassy' || rule.serviceType === 'translation';
    
    const features = {
      apostille: isEn 
        ? ['Official legalization', 'Valid in Hague countries', 'Fast processing'] 
        : ['Officiell legalisering', 'Giltig i Haag-länder', 'Snabb handläggning'],
      notarization: isEn 
        ? ['Notary public', 'Legal validity', 'Original documents required'] 
        : ['Notarius publicus', 'Juridisk giltighet', 'Originaldokument krävs'],
      embassy: isEn 
        ? ['Embassy/consulate', 'International validity', 'High security'] 
        : ['Ambassad/konsulat', 'Internationell giltighet', 'Hög säkerhet'],
      translation: isEn 
        ? ['Certified translators', 'Official stamp', 'All languages'] 
        : ['Certifierade översättare', 'Officiell stämpel', 'Alla språk'],
      chamber: isEn 
        ? ['Chamber stamp', 'International validity', 'Business documents'] 
        : ['Handelskammarens stämpel', 'Internationell giltighet', 'Företagshandlingar'],
      ud: isEn 
        ? ['MFA stamp', 'Highest authority', 'International validity'] 
        : ['UD:s stämpel', 'Högsta myndighet', 'Internationell giltighet']
    };

    return (
      <div key={rule.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
        <div className="flex-1">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-2 bg-primary-50 rounded-lg">
              <Icon className="w-6 h-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              {description && <p className="text-sm text-gray-500">{description}</p>}
            </div>
          </div>
          
          <div className="mb-4">
            <div className="text-2xl font-bold text-primary-600">
              {isQuoted 
                ? (isEn ? 'Quote' : 'Offert') 
                : `${rule.basePrice.toLocaleString('sv-SE')} kr`}
            </div>
            {!isQuoted && (
              <div className="text-xs text-gray-400">{isEn ? 'excl. VAT' : 'exkl. moms'}</div>
            )}
          </div>

          {showFeatures && features[rule.serviceType as keyof typeof features] && (
            <ul className="space-y-2 mb-4">
              {features[rule.serviceType as keyof typeof features].map((feature, idx) => (
                <li key={idx} className="flex items-center text-sm text-gray-600">
                  <ShieldCheckIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Seo
        title={pageTitle}
        description={isEn 
          ? 'See our competitive prices for document legalization, shipping and additional services. Transparent pricing.' 
          : 'Se våra konkurrenskraftiga priser för dokumentlegalisering, frakt och tilläggstjänster. Transparent prissättning.'}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-900 to-primary-800 text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {isEn ? 'Prices' : 'Priser'}
            </h1>
            <p className="text-lg text-primary-100 max-w-2xl mx-auto">
              {pageSubtitle}
            </p>
          </div>
        </div>
      </section>

      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          
          {/* Legalization Services */}
          {legalization.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <DocumentTextIcon className="w-7 h-7 text-primary-600" />
                {isEn ? 'Legalization Services' : 'Legaliseringstjänster'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {legalization.map(rule => renderPricingCard(rule, true))}
              </div>
            </section>
          )}

          {/* Shipping Services */}
          {shipping.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <TruckIcon className="w-7 h-7 text-primary-600" />
                {isEn ? 'Shipping & Delivery' : 'Frakt & Leverans'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {shipping.map(rule => {
                  const { title } = getServiceDisplayName(rule.serviceType, isEn);
                  const Icon = getServiceIcon(rule.serviceType);
                  return (
                    <div key={rule.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className="w-5 h-5 text-primary-600" />
                        <span className="font-medium text-gray-900">{title}</span>
                      </div>
                      <div className="text-xl font-bold text-primary-600">
                        {rule.basePrice === 0 
                          ? (isEn ? 'Free' : 'Gratis') 
                          : `${rule.basePrice.toLocaleString('sv-SE')} kr`}
                      </div>
                      {rule.basePrice > 0 && (
                        <div className="text-xs text-gray-400">{isEn ? 'excl. VAT' : 'exkl. moms'}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Additional Services */}
          {additional.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <ClockIcon className="w-7 h-7 text-primary-600" />
                {isEn ? 'Additional Services' : 'Tilläggstjänster'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {additional.map(rule => {
                  const { title, description } = getServiceDisplayName(rule.serviceType, isEn);
                  const Icon = getServiceIcon(rule.serviceType);
                  return (
                    <div key={rule.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className="w-5 h-5 text-primary-600" />
                        <div>
                          <span className="font-medium text-gray-900">{title}</span>
                          {description && <p className="text-xs text-gray-500">{description}</p>}
                        </div>
                      </div>
                      <div className="text-xl font-bold text-primary-600">
                        +{rule.basePrice.toLocaleString('sv-SE')} kr
                      </div>
                      <div className="text-xs text-gray-400">{isEn ? 'excl. VAT' : 'exkl. moms'}</div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Info Box */}
          <section className="mb-12">
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-primary-900 mb-4">
                {isEn ? 'Good to know' : 'Bra att veta'}
              </h3>
              <ul className="space-y-3 text-primary-800">
                <li className="flex items-start gap-3">
                  <ShieldCheckIcon className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span>{isEn ? 'Prices may vary depending on document type and complexity' : 'Priserna kan variera beroende på dokumenttyp och komplexitet'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheckIcon className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span>{isEn ? 'Contact us for quotes on larger volumes or special cases' : 'Kontakta oss för offert vid större volymer eller specialfall'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheckIcon className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span>{isEn ? 'Digital delivery is free for most services' : 'Digital leverans är kostnadsfri för de flesta tjänster'}</span>
                </li>
              </ul>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {isEn ? 'Ready to get started?' : 'Redo att komma igång?'}
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              {isEn 
                ? 'Get your documents legalized quickly and easily. Contact us today to get started.' 
                : 'Få dina dokument legaliserade snabbt och enkelt. Kontakta oss idag för att komma igång.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/bestall"
                className="inline-flex items-center justify-center px-8 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                {isEn ? 'Order Now' : 'Beställ nu'}
              </Link>
              <Link
                href="/kontakt"
                className="inline-flex items-center justify-center px-8 py-3 border border-primary-600 text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors"
              >
                {isEn ? 'Contact Us' : 'Kontakta oss'}
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