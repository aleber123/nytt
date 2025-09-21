import React, { useState, useEffect } from 'react';
import { GetStaticProps, GetStaticPaths } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { getAllActivePricingRules, PricingRule } from '@/firebase/pricingService';

// Importera ikoner från Heroicons
import { CheckCircleIcon, DocumentTextIcon, ClockIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

interface ServiceDetail {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  icon: string;
  price: string;
  timeframe: string;
  countries: string[];
  documents: string[];
  process: string[];
}

// Funktionen för att hämta alla tjänster med dynamiska priser från Firebase
const getServices = (t: any, pricingRules: PricingRule[] = []): ServiceDetail[] => {
  // Helper function to get price from Firebase or fallback
  const getServicePrice = (serviceType: string): string => {
    if (pricingRules.length === 0) {
      // Fallback prices if Firebase is not available
      const fallbackPrices: { [key: string]: string } = {
        'apostille': '950 kr',
        'notarization': '1300 kr',
        'embassy': 'Från 1295 kr',
        'translation': 'Från 1450 kr',
        'chamber': '2400 kr',
        'ud': 'Från 1750 kr'
      };
      return fallbackPrices[serviceType] || 'Kontakta oss';
    }

    // Find pricing rules for this service type
    const serviceRules = pricingRules.filter(rule => rule.serviceType === serviceType);

    if (serviceRules.length === 0) {
      return 'Kontakta oss';
    }

    // For services with variable pricing (embassy, translation, ud), show "Från" format
    if (serviceType === 'embassy' || serviceType === 'translation' || serviceType === 'ud') {
      const minPrice = Math.min(...serviceRules.map(rule => rule.basePrice));
      return `Från ${minPrice} kr`;
    }

    // For fixed price services, show the most common price
    const prices = serviceRules.map(rule => rule.basePrice);
    const mostCommonPrice = prices.sort((a,b) =>
      prices.filter(v => v === a).length - prices.filter(v => v === b).length
    ).pop();

    return `${mostCommonPrice} kr`;
  };
  return [
    {
      id: 'apostille',
      title: t('services.apostille.title') || 'Apostille',
      description: t('services.apostille.description') || 'Internationell legalisering av dokument för länder anslutna till Haagkonventionen',
      longDescription: t('services.apostille.longDescription') || 
        'Apostille är en internationellt erkänd certifiering som bekräftar äktheten av dokument för användning i länder som är anslutna till Haagkonventionen från 1961. Denna process förenklar användningen av offentliga dokument utomlands genom att eliminera behovet av dubbel legalisering.',
      icon: 'document-check',
      price: getServicePrice('apostille'),
      timeframe: t('services.apostille.timeframe') || '2-4 arbetsdagar',
      countries: [
        'Australien', 'Belgien', 'Brasilien', 'Danmark', 'Finland', 'Frankrike', 
        'Italien', 'Japan', 'Kanada', 'Norge', 'Spanien', 'Storbritannien', 
        'Tyskland', 'USA'
      ],
      documents: [
        t('documents.birthCertificate') || 'Födelsebevis',
        t('documents.marriageCertificate') || 'Vigselbevis',
        t('documents.diploma') || 'Examensbevis',
        t('documents.commercialDocuments') || 'Affärsdokument'
      ],
      process: [
        'Verifiering av dokumentets äkthet',
        'Notarisering av dokumentet',
        'Apostillestämpel från Utrikesdepartementet',
        'Kvalitetskontroll',
        'Leverans enligt önskemål'
      ]
    },
    {
      id: 'notarisering',
      title: t('services.notarization.title') || 'Notarisering',
      description: t('services.notarization.description') || 'Notarisering av dokument av notarius publicus för juridisk giltighet',
      longDescription: t('services.notarization.longDescription') || 
        'Notarisering är en process där en notarius publicus bekräftar äktheten av dokument och signaturer. Detta ger dokumentet juridisk giltighet och trovärdighet, vilket är särskilt viktigt för dokument som ska användas i officiella sammanhang eller utomlands.',
      icon: 'seal',
      price: getServicePrice('notarization'),
      timeframe: t('services.notarization.timeframe') || '1-2 arbetsdagar',
      countries: [
        'Alla länder'
      ],
      documents: [
        t('documents.powerOfAttorney') || 'Fullmakter',
        t('documents.commercialDocuments') || 'Affärsdokument',
        'Testamenten',
        'Intyg',
        'Juridiska dokument'
      ],
      process: [
        'Granskning av dokument',
        'Personlig identifiering',
        'Signering i närvaro av notarius publicus',
        'Notariell bekräftelse',
        'Leverans av notariserat dokument'
      ]
    },
    {
      id: 'ambassadlegalisering',
      title: t('services.embassy.title') || 'Ambassadlegalisering',
      description: t('services.embassy.description') || 'Legalisering av dokument via ambassader för användning i specifika länder',
      longDescription: t('services.embassy.longDescription') || 
        'Ambassadlegalisering är en process där dokument legaliseras via ett lands ambassad eller konsulat för att bekräfta dokumentets giltighet för användning i det specifika landet. Detta krävs ofta för länder som inte är anslutna till Haagkonventionen.',
      icon: 'building',
      price: getServicePrice('embassy'),
      timeframe: t('services.embassy.timeframe') || '5-15 arbetsdagar',
      countries: [
        'Kina', 'Ryssland', 'Förenade Arabemiraten', 'Saudiarabien', 
        'Egypten', 'Indien', 'Vietnam', 'Thailand', 'Indonesien'
      ],
      documents: [
        'Affärsdokument',
        'Exportdokument',
        'Certifikat',
        t('documents.diploma') || 'Examensbevis',
        'Personliga dokument'
      ],
      process: [
        'Notarisering av dokumentet',
        'Legalisering hos Utrikesdepartementet',
        'Legalisering hos ambassaden för destinationslandet',
        'Kvalitetskontroll',
        'Leverans enligt önskemål'
      ]
    },
    {
      id: 'oversattning',
      title: t('services.translation.title') || 'Auktoriserad översättning',
      description: t('services.translation.description') || 'Professionell översättning av dokument av auktoriserade översättare',
      longDescription: t('services.translation.longDescription') || 
        'Auktoriserad översättning utförs av en översättare som har blivit auktoriserad av Kammarkollegiet. Dessa översättningar är officiellt erkända och kan användas för juridiska, akademiska och officiella ändamål både i Sverige och internationellt.',
      icon: 'language',
      price: getServicePrice('translation'),
      timeframe: t('services.translation.timeframe') || '3-7 arbetsdagar',
      countries: [
        'Alla länder'
      ],
      documents: [
        'Akademiska dokument',
        'Juridiska dokument',
        'Personliga dokument',
        'Affärsdokument',
        'Medicinska dokument'
      ],
      process: [
        'Analys av källdokument',
        'Översättning av auktoriserad översättare',
        'Kvalitetsgranskning',
        'Certifiering och stämpling',
        'Leverans enligt önskemål'
      ]
    },
    {
      id: 'handelskammaren',
      title: 'Handelskammarens legalisering',
      description: 'Legalisering av handelsdokument genom Handelskammaren',
      longDescription: 'Handelskammarens legalisering är en officiell process där handelsdokument som fakturor, kontrakt och andra affärsdokument legaliseras genom Handelskammaren. Detta är särskilt viktigt för internationell handel och kräver ofta för företag som exporterar varor eller tjänster.',
      icon: 'building',
      price: getServicePrice('chamber'),
      timeframe: '5-7 arbetsdagar',
      countries: [
        'Alla länder',
        'Särskilt viktigt för export och internationell handel'
      ],
      documents: [
        'Fakturor',
        'Kontrakt',
        'Handelsdokument',
        'Exportdokument',
        'Företagscertifikat'
      ],
      process: [
        'Granskning av handelsdokument',
        'Verifiering av företagsuppgifter',
        'Handelskammarens stämpel och signatur',
        'Officiell legalisering',
        'Kvalitetskontroll och leverans'
      ]
    },
    {
      id: 'utrikesdepartementet',
      title: 'Utrikesdepartementet',
      description: 'Legalisering av dokument hos Utrikesdepartementet för internationell användning',
      longDescription: 'Legalisering via Utrikesdepartementet är en officiell process där svenska dokument verifieras för användning utomlands. Detta är ett viktigt steg för att säkerställa att dokumenten accepteras av utländska myndigheter och institutioner, särskilt i länder som kräver ytterligare verifiering utöver apostille.',
      icon: 'government',
      price: getServicePrice('ud'),
      timeframe: '3-5 arbetsdagar',
      countries: [
        'Alla länder utanför EU',
        'Länder som kräver särskild verifiering'
      ],
      documents: [
        'Bolagshandlingar',
        'Exportdokument',
        'Fullmakter',
        'Officiella intyg',
        'Akademiska dokument'
      ],
      process: [
        'Förberedelse av dokumentation',
        'Notarisering av dokumentet',
        'Inlämning till Utrikesdepartementet',
        'Officiell legalisering',
        'Kvalitetskontroll och leverans'
      ]
    }
  ];
};

const ServiceDetailPage: React.FC = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { id } = router.query;

  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch pricing data from Firebase
  useEffect(() => {
    const fetchPricingData = async () => {
      try {
        setLoading(true);
        const rules = await getAllActivePricingRules();
        setPricingRules(rules);
      } catch (error) {
        console.error('Error fetching pricing data:', error);
        // Use empty array if Firebase fails - component will handle gracefully
        setPricingRules([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPricingData();
  }, []);

  const services = getServices(t, pricingRules);
  const service = services.find(s => s.id === id);
  
  // Show loading state while fetching pricing data
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Breadcrumbs />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Laddar tjänstinformation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Breadcrumbs />
        <h1 className="text-3xl font-heading font-bold text-gray-900 mb-6">Tjänst hittades inte</h1>
        <p className="text-gray-600 mb-6">Den begärda tjänsten kunde inte hittas.</p>
        <Link href="/tjanster" className="text-primary-600 hover:text-primary-800 font-medium">
          Tillbaka till tjänster
        </Link>
      </div>
    );
  }

  // Funktion för att rendera ikoner baserat på ikonnamn
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'document-check':
        return <DocumentTextIcon className="h-12 w-12 text-primary-600" />;
      case 'seal':
        return <CheckCircleIcon className="h-12 w-12 text-primary-600" />;
      case 'building':
        return <DocumentTextIcon className="h-12 w-12 text-primary-600" />;
      case 'language':
        return <GlobeAltIcon className="h-12 w-12 text-primary-600" />;
      case 'government':
        return <DocumentTextIcon className="h-12 w-12 text-primary-600" />;
      default:
        return null;
    }
  };

  return (
    <>
      <Head>
        <title>{service.title} - Legaliseringstjänst</title>
        <meta 
          name="description" 
          content={service.description} 
        />
      </Head>

      <div className="bg-primary-700 py-12">
        <div className="container mx-auto px-4">
          <Breadcrumbs className="text-white/80" />
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-white mt-4">{service.title}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
              <div className="flex items-center mb-6">
                {renderIcon(service.icon)}
                <h2 className="text-2xl font-heading font-semibold text-gray-900 ml-4">Om tjänsten</h2>
              </div>
              <p className="text-gray-600 mb-6">{service.longDescription}</p>
              
              <h3 className="text-xl font-heading font-semibold text-gray-900 mb-4">Process</h3>
              <ul className="space-y-3 mb-8">
                {service.process.map((step, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mr-3 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-gray-600">{step}</span>
                  </li>
                ))}
              </ul>
              
              <h3 className="text-xl font-heading font-semibold text-gray-900 mb-4">Dokument vi kan hjälpa dig med</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                {service.documents.map((doc, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-primary-600 mr-2" />
                    <span className="text-gray-600">{doc}</span>
                  </li>
                ))}
              </ul>
              
              <h3 className="text-xl font-heading font-semibold text-gray-900 mb-4">Länder</h3>
              <div className="bg-gray-50 rounded-lg p-4 mb-8">
                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {service.countries.map((country, index) => (
                    <li key={index} className="text-gray-600">{country}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6 sticky top-4">
              <h3 className="text-xl font-heading font-semibold text-gray-900 mb-4">Pris och leveranstid</h3>
              
              <div className="flex items-center mb-4">
                <DocumentTextIcon className="h-5 w-5 text-primary-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Pris från</p>
                  <p className="font-semibold text-gray-900">{service.price}</p>
                </div>
              </div>
              
              <div className="flex items-center mb-6">
                <ClockIcon className="h-5 w-5 text-primary-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Leveranstid</p>
                  <p className="font-semibold text-gray-900">{service.timeframe}</p>
                </div>
              </div>
              
              <Link 
                href="/bestall" 
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center transition-colors duration-200"
              >
                Beställ tjänst
              </Link>
              
              <div className="mt-6 text-center">
                <Link 
                  href="/kontakt" 
                  className="text-primary-600 hover:text-primary-800 font-medium"
                >
                  Kontakta oss för offert
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  // Definiera de sökvägar som ska förrenderas vid byggtid
  const paths = [
    { params: { id: 'apostille' } },
    { params: { id: 'notarisering' } },
    { params: { id: 'ambassadlegalisering' } },
    { params: { id: 'oversattning' } },
    { params: { id: 'handelskammaren' } },
    { params: { id: 'utrikesdepartementet' } }
  ];
  
  return {
    paths,
    fallback: 'blocking' // Generera sidor som saknas vid förfrågan
  };
};

export const getStaticProps: GetStaticProps = async ({ locale, params }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'sv', ['common'])),
    },
  };
};

export default ServiceDetailPage;
