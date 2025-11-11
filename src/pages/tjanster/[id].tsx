import React, { useState, useEffect } from 'react';
import { GetStaticProps, GetStaticPaths } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Seo from '@/components/Seo';
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
      const fallbackPrices: Record<string, string> = {
        'apostille': t('serviceDetails.fromPrice', { price: 895, formatParams: { price: { maximumFractionDigits: 0 } } }) || `Från 895 kr`,
        'notarization': t('serviceDetails.fromPrice', { price: 695 }) || `Från 695 kr`,
        'embassy': t('serviceDetails.fromPrice', { price: 1295 }) || `Från 1295 kr`,
        'translation': t('serviceDetails.fromPrice', { price: 995 }) || `Från 995 kr`,
        'ud': t('serviceDetails.fromPrice', { price: 1750 }) || `Från 1750 kr`
      };
      return fallbackPrices[serviceType] || (t('serviceDetails.contactUs') || 'Kontakta oss');
    }

    // Find pricing rules for this service type
    const serviceRules = pricingRules.filter(rule => rule.serviceType === serviceType);

    if (serviceRules.length === 0) {
      return t('serviceDetails.contactUs') || 'Kontakta oss';
    }

    // For services with variable pricing (embassy, translation, ud), show "Från" format
    if (serviceType === 'embassy' || serviceType === 'translation' || serviceType === 'ud') {
      const minPrice = Math.min(...serviceRules.map(rule => rule.basePrice));
      return t('serviceDetails.fromPrice', { price: minPrice }) || `Från ${minPrice} kr`;
    }

    // For fixed price services, prioritize Swedish pricing, then show most common
    if (serviceRules.length > 0) {
      // First, try to find Swedish pricing
      const swedishRule = serviceRules.find(rule => rule.countryCode === 'SE');
      if (swedishRule) {
        console.log('🇸🇪 Using Swedish pricing for', serviceType + ':', swedishRule.basePrice, 'kr');
        return `${swedishRule.basePrice} kr`;
      }

      // If no Swedish pricing, show the most common price
      const prices = serviceRules.map(rule => rule.basePrice);
      const mostCommonPrice = prices.sort((a,b) =>
        prices.filter(v => v === a).length - prices.filter(v => v === b).length
      ).pop();

      console.log('🌍 Using most common pricing for', serviceType + ':', mostCommonPrice, 'kr');
      return `${mostCommonPrice} kr`;
    }

    return 'Kontakta oss';
  };
  return [
    {
      id: 'apostille',
      title: t('services.apostille.title') || 'Apostille',
      description: t('services.apostille.description') || 'Internationell legalisering av dokument för länder anslutna till Haagkonventionen',
      longDescription: t('services.apostille.longDescription') ||
        'Apostille är en internationellt erkänd certifiering enligt Haagkonventionen från 1961 som förenklar användningen av svenska officiella dokument utomlands. Apostillen bekräftar äktheten av underskrifter, stämplar och sigill på dokument, vilket eliminerar behovet av ytterligare legalisering i mottagarlandet. Detta gör det enklare och billigare att använda svenska dokument internationellt. Apostillen är en förenklad form av legalisering som ersätter den traditionella konsulära legaliseringen för dokument som ska användas i Haagkonventionsländer.',
      icon: 'document-check',
      price: getServicePrice('apostille'),
      timeframe: t('services.apostille.timeframe') || '2-4 arbetsdagar',
      countries: [
        'Australien', 'Österrike', 'Azerbajdzjan', 'Bahamas', 'Bahrain', 'Barbados', 'Belgien', 'Belize', 'Botswana',
        'Brasilien', 'Brunei', 'Bulgarien', 'Kap Verde', 'Chile', 'Colombia', 'Costa Rica', 'Kroatien', 'Cypern',
        'Tjeckien', 'Danmark', 'Dominica', 'Dominikanska Republiken', 'Ecuador', 'El Salvador', 'Estland', 'Fiji',
        'Finland', 'Frankrike', 'Georgien', 'Tyskland', 'Grekland', 'Grenada', 'Guatemala', 'Honduras', 'Ungern',
        'Island', 'Indien', 'Irland', 'Israel', 'Italien', 'Japan', 'Jordanien', 'Kazakstan', 'Sydkorea', 'Lettland',
        'Lesotho', 'Liberia', 'Liechtenstein', 'Litauen', 'Luxemburg', 'Malta', 'Marshallöarna', 'Mauritius',
        'Mexiko', 'Moldavien', 'Monaco', 'Mongoliet', 'Montenegro', 'Marocko', 'Namibia', 'Nederländerna',
        'Nya Zeeland', 'Nicaragua', 'Niue', 'Nordmakedonien', 'Norge', 'Oman', 'Palau', 'Panama', 'Paraguay',
        'Peru', 'Filippinerna', 'Polen', 'Portugal', 'Qatar', 'Rumänien', 'Ryssland', 'Saint Kitts och Nevis',
        'Saint Lucia', 'Saint Vincent och Grenadinerna', 'Samoa', 'San Marino', 'São Tomé och Príncipe',
        'Saudiarabien', 'Serbien', 'Seychellerna', 'Singapore', 'Slovakien', 'Slovenien', 'Sydafrika', 'Spanien',
        'Surinam', 'Swaziland', 'Sverige', 'Schweiz', 'Tadzjikistan', 'Tanzania', 'Tonga', 'Trinidad och Tobago',
        'Turkiet', 'Turkmenistan', 'Ukraina', 'Förenade Arabemiraten', 'Storbritannien', 'USA', 'Uruguay',
        'Uzbekistan', 'Vanuatu', 'Venezuela', 'Vietnam'
      ],
      documents: [
        'Födelsebevis och dödsbevis',
        'Vigselbevis och partnerskapsbevis',
        'Skiljandehandlingar och äktenskapsförord',
        'Examensbevis och betyg från universitet/högskolor',
        'Medicinska intyg och journaler',
        'Bouppteckningar och arvsskiften',
        'Adoptionshandlingar',
        'Namnändringshandlingar',
        'Medborgarskapsbevis',
        'Körkortsbevis och körkortskopior',
        'Passhandlingar och ID-kort',
        'Fullmakter och prokuror',
        'Bolagshandlingar och registreringsbevis',
        'Exportdokument och ursprungsintyg',
        'Översättningar av officiella dokument',
        'Intyg från myndigheter (Skatteverket, Försäkringskassan, etc.)',
        'Polisintyg och domstolsdokument',
        'Bankdokument och kontobesked',
        'Pensionsintyg och försäkringsdokument'
      ],
      process: [
        'Granskning och verifiering av dokumentets äkthet och kompletthet',
        'Notarisering av dokumentet hos notarius publicus (om inte redan notariebevisat)',
        'Ansökan om apostille hos notarius publicus',
        'Officiell apostillestämpel appliceras av notarius',
        'Slutlig kvalitetskontroll av det apostillerade dokumentet',
        'Säker leverans enligt dina önskemål (post, bud eller upphämtning)'
      ]
    },
    {
      id: 'notarisering',
      title: t('services.notarization.title') || 'Notarisering',
      description: t('services.notarization.description') || 'Notarisering av dokument av notarius publicus för juridisk giltighet',
      longDescription: t('services.notarization.longDescription') ||
        'Notarisering är en officiell process där en notarius publicus verifierar äktheten av underskrifter, dokument och identitet. Notarius publicus är en juridiskt utbildad tjänsteman som har myndighet att utföra officiella handlingar. Notarisering ger dokumentet extra juridisk styrka och trovärdighet, vilket är viktigt för dokument som ska användas i rättsliga sammanhang, fastighetstransaktioner eller internationell användning.',
      icon: 'seal',
      price: getServicePrice('notarization'),
      timeframe: t('services.notarization.timeframe') || '1-2 arbetsdagar',
      countries: [
        'Alla länder - notarisering är internationellt erkänd'
      ],
      documents: [
        'Fullmakter och prokuror',
        'Avtal och kontrakt',
        'Testamenten och arvsavtal',
        'Bouppteckningar och arvsskiften',
        'Äktenskapsförord och samboförord',
        'Utlåtanden och intyg',
        'Bolagshandlingar och firmahandlingar',
        'Fastighetsdokument och tomträttsavtal',
        'Utbildningsdokument och examensbevis',
        'Medicinska intyg och vårdnadshandlingar',
        'Adoptionshandlingar',
        'Namnändringshandlingar',
        'Pensionsavtal och försäkringsdokument',
        'Bankdokument och kontobevis',
        'Översättningsintyg'
      ],
      process: [
        'Inledande granskning av dokumentets form och innehåll',
        'Personlig identifiering av den som ska underteckna dokumentet',
        'Verifiering av att personen förstår dokumentets innebörd och konsekvenser',
        'Närvaro vid underskrift och bevittnande av denna',
        'Officiell notariell stämpel och underskrift från notarius publicus',
        'Registrering av handlingen i notariens protokoll',
        'Utfärdande av notariebevis och leverans av det kompletta dokumentet'
      ]
    },
    {
      id: 'ambassadlegalisering',
      title: t('services.embassy.title') || 'Ambassadlegalisering',
      description: t('services.embassy.description') || 'Legalisering av dokument via ambassader för användning i specifika länder',
      longDescription: t('services.embassy.longDescription') ||
        'Ambassadlegalisering är en diplomatisk process där svenska dokument legaliseras genom ett utländskt lands ambassad eller konsulat i Sverige. Detta krävs för länder som inte är anslutna till Haagkonventionen och behöver en mer omfattande verifiering av dokumentens äkthet. Processen innefattar flera steg av officiell bekräftelse från svenska myndigheter följt av diplomatisk godkännande från destinationslandets representation.',
      icon: 'building',
      price: getServicePrice('embassy'),
      timeframe: t('services.embassy.timeframe') || '5-15 arbetsdagar',
      countries: [
        'Kina (Huvudstaden och provinser)', 'Ryssland', 'Förenade Arabemiraten', 'Saudiarabien',
        'Egypten', 'Indien', 'Vietnam', 'Thailand', 'Indonesien', 'Malaysia', 'Singapore',
        'Filippinerna', 'Japan (vissa regioner)', 'Sydkorea (vissa regioner)', 'Pakistan',
        'Bangladesh', 'Sri Lanka', 'Nepal', 'Bhutan', 'Mongoliet', 'Kazakstan', 'Uzbekistan',
        'Turkmenistan', 'Tadzjikistan', 'Kirgizistan', 'Afghanistan', 'Iran', 'Irak', 'Syrien',
        'Libanon', 'Jordanien', 'Palestina', 'Israel (för vissa ändamål)', 'Turkiet', 'Georgien',
        'Armenien', 'Azerbajdzjan', 'Albanien', 'Bosnien och Hercegovina', 'Kosovo', 'Makedonien',
        'Montenegro', 'Serbien', 'Algeriet', 'Marocko', 'Tunisien', 'Libyen', 'Sudan', 'Etiopien',
        'Eritrea', 'Djibouti', 'Somalia', 'Kenya', 'Tanzania', 'Uganda', 'Rwanda', 'Burundi',
        'Angola', 'Moçambique', 'Zimbabwe', 'Zambia', 'Botswana', 'Namibia', 'Sydafrika',
        'Lesotho', 'Swaziland', 'Madagaskar', 'Mauritius', 'Seychellerna', 'Komorerna',
        'Brasilien (vissa delstater)', 'Argentina', 'Chile', 'Peru', 'Ecuador', 'Colombia',
        'Venezuela', 'Panama', 'Costa Rica', 'Nicaragua', 'Honduras', 'El Salvador', 'Guatemala',
        'Belize', 'Kuba', 'Dominikanska Republiken', 'Haiti', 'Jamaica', 'Trinidad och Tobago',
        'Barbados', 'Bahamas', 'Guyana', 'Surinam', 'Franska Guyana'
      ],
      documents: [
        'Bolagshandlingar och registreringsbevis',
        'Export- och importdokument',
        'Handelsavtal och kontrakt',
        'Fullmakter och prokuror',
        'Fastighetsdokument',
        'Bouppteckningar och arvshandlingar',
        'Adoptionshandlingar',
        'Äktenskaps- och skilsmässodokument',
        'Födelse- och dödsbevis',
        'Medicinska intyg och journaler',
        'Utbildningsdokument och examensbevis',
        'Arbetsintyg och anställningsavtal',
        'Pensionsdokument',
        'Bankdokument och kontobesked',
        'Skattedokument och deklarationer',
        'Tullhandlingar och certifikat',
        'Körkortsbevis',
        'Passhandlingar',
        'Vårdnadshandlingar',
        'Testamenten och arvsavtal'
      ],
      process: [
        'Förberedelse och granskning av dokument',
        'Notarisering av dokumentet hos notarius publicus',
        'Första legalisering hos Utrikesdepartementet (UD)',
        'Ansökan om ambassadlegalisering hos aktuell ambassad',
        'Diplomatisk granskning och godkännande från ambassaden',
        'Eventuell andra legalisering om ambassaden kräver det',
        'Slutlig kvalitetskontroll och paketering',
        'Säker leverans enligt dina önskemål'
      ]
    },
    {
      id: 'oversattning',
      title: t('services.translation.title') || 'Auktoriserad översättning',
      description: t('services.translation.description') || 'Professionell översättning av dokument av auktoriserade översättare',
      longDescription: t('services.translation.longDescription') ||
        'Auktoriserad översättning är en officiell översättning utförd av en översättare som har auktorisation från Kammarkollegiet. Detta är den högsta kvalitetsstandarden för översättningar i Sverige och krävs ofta för dokument som ska användas i officiella sammanhang, rättsliga processer eller internationell kommunikation. Auktorisationen garanterar att översättaren har den nödvändiga kompetensen och följer strikta etiska riktlinjer.',
      icon: 'language',
      price: getServicePrice('translation'),
      timeframe: t('services.translation.timeframe') || '3-7 arbetsdagar',
      countries: [
        'Alla länder - auktoriserade översättningar är internationellt erkända'
      ],
      documents: [
        'Födelse- och dödsbevis',
        'Vigselbevis och skilsmässodokument',
        'Examensbevis och betyg från universitet/högskolor',
        'Medicinska journaler och intyg',
        'Polisrapporter och domstolsdokument',
        'Bolagshandlingar och årsredovisningar',
        'Avtal och kontrakt',
        'Fullmakter och prokuror',
        'Testamenten och arvsavtal',
        'Adoptionshandlingar',
        'Pass och ID-handlingar',
        'Körkortsbevis',
        'Bankdokument och kontobesked',
        'Skattedokument och deklarationer',
        'Pensionsdokument och försäkringsavtal',
        'Patentdokument och varumärkeshandlingar',
        'Tekniska manualer och specifikationer',
        'Marknadsföringsmaterial för officiell användning',
        'Översättningar av tidigare översättningar'
      ],
      process: [
        'Analys av källdokumentets språk, innehåll och syfte',
        'Tilldelning till auktoriserad översättare med rätt språkkombination',
        'Professionell översättning med hänsyn till kulturella och juridiska nyanser',
        'Kvalitetsgranskning av en andra auktoriserad översättare',
        'Officiell certifiering och stämpling från Kammarkollegiet',
        'Verifiering av översättningens korrekthet och kompletthet',
        'Säker leverans av det översatta och certifierade dokumentet'
      ]
    },
    {
      id: 'handelskammaren',
      title: 'Handelskammarens legalisering',
      description: 'Legalisering av handelsdokument genom Handelskammaren',
      longDescription: 'Handelskammarens legalisering är en specialiserad tjänst för företag och organisationer som bedriver internationell handel. Handelskammaren utfärdar officiella intyg och legaliseringar för handelsdokument, vilket krävs av många länder för tullformaliteter, banktransaktioner och affärsavtal. Denna tjänst är särskilt värdefull för exportföretag, importörer och internationella organisationer som behöver verifiera sina dokument för utländska myndigheter.',
      icon: 'building',
      price: getServicePrice('chamber'),
      timeframe: '5-7 arbetsdagar',
      countries: [
        'Alla länder - särskilt viktigt för internationell handel',
        'EU-länder (för vissa dokumenttyper)',
        'Asien (Kina, Indien, Japan, Sydkorea)',
        'Mellanöstern (Saudiarabien, UAE, Qatar)',
        'Nordamerika (USA, Kanada)',
        'Latinamerika (Brasilien, Mexiko, Argentina)',
        'Afrika (Sydafrika, Nigeria, Egypten)'
      ],
      documents: [
        'Kommersiella fakturor och proformafakturor',
        'Export- och importdokument',
        'Kontrakt och avtal',
        'Fullmakter och prokuror',
        'Certifikat av ursprung',
        'Företagscertifikat och registreringsbevis',
        'Årsredovisningar och balansräkningar',
        'Tullhandlingar och varudeklarationer',
        'Transportdokument och försäkringsintyg',
        'Kreditbrev och bankgarantier',
        'Ursprungsintyg och preferensdokument',
        'Tekniska specifikationer och manualer',
        'Kvalitetscertifikat och analysintyg',
        'Miljöcertifikat och hållbarhetsdokument',
        'Patent- och varumärkesdokument'
      ],
      process: [
        'Granskning av alla handelsdokument och företagsuppgifter',
        'Verifiering av företagets registrering och verksamhet',
        'Kontroll av dokumentens överensstämmelse med handelsstandarder',
        'Officiell legalisering och stämpling från Handelskammaren',
        'Utfärdande av Handelskammarens intyg och certifikat',
        'Slutlig kvalitetskontroll av alla handlingar',
        'Säker leverans med spårning och försäkring'
      ]
    },
    {
      id: 'utrikesdepartementet',
      title: 'Utrikesdepartementet',
      description: 'Legalisering av dokument hos Utrikesdepartementet för internationell användning',
      longDescription: 'Utrikesdepartementets legalisering är en diplomatisk tjänst där svenska myndigheter officiellt bekräftar äktheten av dokument som ska användas utomlands. Detta är ofta ett nödvändigt steg innan ambassadlegalisering och krävs för många länder som behöver extra verifiering av svenska officiella dokument. UD:s legalisering är en viktig del av den svenska legaliseringskedjan och säkerställer att dokument möter internationella diplomatiska standarder.',
      icon: 'government',
      price: getServicePrice('ud'),
      timeframe: '3-5 arbetsdagar',
      countries: [
        'Alla länder utanför EU och EES',
        'Asien (Kina, Indien, Japan, Sydkorea, Vietnam)',
        'Mellanöstern (Saudiarabien, UAE, Qatar, Kuwait)',
        'Afrika (Egypten, Marocko, Algeriet, Tunisien)',
        'Latinamerika (Brasilien, Mexiko, Argentina, Chile)',
        'Östeuropa (Ryssland, Ukraina, Belarus)',
        'Karibien och Stillahavsområdet'
      ],
      documents: [
        'Bolagshandlingar och företagsdokument',
        'Export- och importcertifikat',
        'Fullmakter och prokuror',
        'Utlåtanden från myndigheter',
        'Akademiska examensbevis och intyg',
        'Medicinska licenser och certifikat',
        'Juridiska dokument och avtal',
        'Fastighetsdokument',
        'Bouppteckningar och arvshandlingar',
        'Adoptionshandlingar',
        'Pass- och ID-kopior',
        'Körkortsbevis',
        'Polisintyg och domstolsdokument',
        'Skattedokument och deklarationer',
        'Pensionsdokument',
        'Kultur- och utbildningsdokument',
        'Veterinärmedicinska certifikat',
        'Tekniska standardcertifikat'
      ],
      process: [
        'Granskning och förberedelse av alla dokument',
        'Notarisering av dokumentet (om inte redan gjort)',
        'Ansökan om UD-legalisering med nödvändiga formulär',
        'Inlämning till Utrikesdepartementets konsulära avdelning',
        'Diplomatisk granskning och verifiering',
        'Officiell UD-stämpel och underskrift',
        'Återlämning av legaliserade dokument',
        'Slutlig kontroll och säker leverans'
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
        console.log('🔍 Loaded pricing rules:', rules.length, 'rules');
        const apostilleRules = rules.filter(r => r.serviceType === 'apostille');
        console.log('📋 Apostille rules found:', apostilleRules);

        // Log specific pricing for debugging
        if (apostilleRules.length > 0) {
          console.log('💰 Apostille prices:', apostilleRules.map(r => `${r.countryName}: ${r.basePrice} kr`));
        }

        setPricingRules(rules);
      } catch (error) {
        console.error('❌ Error fetching pricing data:', error);
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
        <Link href="/tjanster" className="text-custom-button hover:text-custom-button-hover font-medium">
          Tillbaka till tjänster
        </Link>
      </div>
    );
  }

  // Funktion för att rendera ikoner baserat på ikonnamn
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'document-check':
        return <DocumentTextIcon className="h-12 w-12 text-custom-button" />;
      case 'seal':
        return <CheckCircleIcon className="h-12 w-12 text-custom-button" />;
      case 'building':
        return <DocumentTextIcon className="h-12 w-12 text-custom-button" />;
      case 'language':
        return <GlobeAltIcon className="h-12 w-12 text-custom-button" />;
      case 'government':
        return <DocumentTextIcon className="h-12 w-12 text-custom-button" />;
      default:
        return null;
    }
  };

  return (
    <>
      <Seo title={`${service.title} - Legaliseringstjänst`} description={service.description} />

      <div className="container mx-auto px-4 pt-12">
        <h1 className="text-3xl font-heading font-bold text-gray-900 text-center mb-6">{service.title}</h1>
        <p className="text-lg text-gray-600 text-center mb-8">{service.description}</p>
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
                    <CheckCircleIcon className="h-5 w-5 text-custom-button mr-2" />
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
                <DocumentTextIcon className="h-5 w-5 text-custom-button mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Pris från</p>
                  <p className="font-semibold text-gray-900">{service.price}</p>
                </div>
              </div>

              <div className="flex items-center mb-6">
                <ClockIcon className="h-5 w-5 text-custom-button mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Leveranstid</p>
                  <p className="font-semibold text-gray-900">{service.timeframe}</p>
                </div>
              </div>
              
              <Link
                href="/bestall"
                className="w-full bg-custom-button hover:bg-custom-button-hover text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center transition-colors duration-200"
              >
                {t('serviceDetails.orderService') || 'Beställ tjänst'}
              </Link>
              
              <div className="mt-6 text-center">
                <Link
                  href="/kontakt"
                  className="text-custom-button hover:text-custom-button-hover font-medium"
                >
                  {t('serviceDetails.contactForQuote') || 'Kontakta oss för offert'}
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
