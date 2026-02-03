import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import CountryFlag from '@/components/ui/CountryFlag';
import { getVisaRequirement, DocumentRequirement } from '@/firebase/visaRequirementsService';

export default function ThailandVisumPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const locale = router.locale || 'sv';
  const [documentRequirements, setDocumentRequirements] = useState<DocumentRequirement[]>([]);
  const [selectedProductName, setSelectedProductName] = useState<string>('');

  useEffect(() => {
    const fetchRequirements = async () => {
      try {
        const requirement = await getVisaRequirement('TH');
        if (requirement?.visaProducts && requirement.visaProducts.length > 0) {
          const firstProduct = requirement.visaProducts[0];
          setSelectedProductName(locale === 'en' ? (firstProduct.nameEn || firstProduct.name) : firstProduct.name);
          if (firstProduct.documentRequirements) {
            setDocumentRequirements(firstProduct.documentRequirements.filter((d: DocumentRequirement) => d.isActive));
          }
        }
      } catch {
        // Silent fail
      }
    };
    fetchRequirements();
  }, [locale]);

  const visumTypes = [
    {
      name: 'Turistvisum (TR)',
      duration: '60 dagar',
      description: 'För turism och semester, kan förlängas på plats'
    },
    {
      name: 'Non-Immigrant B',
      duration: '90 dagar',
      description: 'För affärer och arbete i Thailand'
    },
    {
      name: 'Non-Immigrant O',
      duration: '90 dagar',
      description: 'För besök hos familj eller pensionärer'
    },
    {
      name: 'Non-Immigrant O-A',
      duration: '1 år',
      description: 'Långtidsvisum för pensionärer 50+'
    }
  ];

  const requiredDocuments = [
    'Giltigt pass (minst 6 månaders giltighet)',
    'Ifylld visumansökan',
    'Passfoto (2 st, 35x45mm)',
    'Bekräftad flygbokning tur och retur',
    'Hotellbokning eller inbjudan',
    'Kontoutdrag (minst 20 000 kr)'
  ];

  return (
    <>
      <Head>
        <title>Visum till Thailand - Ansök om thailändskt visum | DOX Visumpartner</title>
        <meta name="description" content="Behöver du visum till Thailand? Vi hjälper dig med visumansökan. Turistvisum, affärsvisum och pensionärsvisum. Svenska medborgare kan vistas visumfritt i 30 dagar." />
        <meta name="keywords" content="Thailand visum, visum Thailand, thailändskt visum, turistvisum Thailand, affärsvisum Thailand, pensionärsvisum Thailand, Non-Immigrant O-A, visumansökan Thailand" />
        
        <meta property="og:title" content="Visum till Thailand - Ansök om thailändskt visum | DOX Visumpartner" />
        <meta property="og:description" content="Vi hjälper dig med visumansökan till Thailand. Turistvisum, affärsvisum och pensionärsvisum via Thailands ambassad." />
        <meta property="og:url" content="https://www.doxvl.se/visum/thailand" />
        <meta property="og:type" content="website" />
        
        <link rel="canonical" href="https://www.doxvl.se/visum/thailand" />
        
        {/* Service Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Visum till Thailand",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB",
            "url": "https://www.doxvl.se",
            "logo": "https://www.doxvl.se/images/dox-logo.png",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Livdjursgatan 4",
              "addressLocality": "Johanneshov",
              "postalCode": "121 62",
              "addressCountry": "SE"
            },
            "telephone": "+46-8-409-419-00"
          },
          "description": "Visumservice för Thailand. Vi hjälper dig med ansökan om turistvisum, affärsvisum och pensionärsvisum till Thailand.",
          "areaServed": {
            "@type": "Country",
            "name": "Sweden"
          },
          "serviceType": "Visa Application Service",
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "SEK",
            "lowPrice": "1700",
            "highPrice": "4500",
            "offerCount": "4"
          }
        })}} />

        {/* BreadcrumbList Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Hem",
              "item": "https://www.doxvl.se"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Visum",
              "item": "https://www.doxvl.se/visum"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": "Thailand",
              "item": "https://www.doxvl.se/visum/thailand"
            }
          ]
        })}} />

        {/* FAQPage Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Hur länge kan jag stanna utan visum i Thailand?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Svenska medborgare kan stanna i Thailand utan visum i upp till 30 dagar vid inresa via flygplats. Detta kan förlängas med ytterligare 30 dagar på plats."
              }
            },
            {
              "@type": "Question",
              "name": "Kan jag förlänga mitt turistvisum i Thailand?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Ja, turistvisum kan förlängas med 30 dagar vid ett immigrationskontor i Thailand. Avgiften är 1 900 baht. Ansök innan ditt nuvarande visum går ut."
              }
            },
            {
              "@type": "Question",
              "name": "Vad kostar visum till Thailand?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Priset varierar beroende på visumtyp. Turistvisum kostar från ca 1 700 kr, medan pensionärsvisum (O-A) kostar mer. Kontakta oss för exakt pris."
              }
            },
            {
              "@type": "Question",
              "name": "Hur lång tid tar handläggningen för Thailand-visum?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Normal handläggningstid är 3-5 arbetsdagar för turistvisum. Pensionärsvisum kan ta längre tid. Vi erbjuder även expresshantering."
              }
            }
          ]
        })}} />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#A51931] via-[#F4F5F8] to-[#2D2A4A] text-gray-900 py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <CountryFlag code="TH" size={64} />
              <div>
                <h1 className="text-3xl md:text-5xl font-bold">
                  Visum till Thailand
                </h1>
                <p className="text-xl text-gray-600">Thailands ambassad i Stockholm</p>
              </div>
            </div>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl">
              Planerar du en längre vistelse i Thailand? Svenska medborgare kan vistas visumfritt 
              i 30 dagar, men för längre resor behöver du visum. Vi hjälper dig!
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/visum/bestall?destination=TH" className="bg-[#A51931] hover:bg-[#8A1528] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                Beställ visum till Thailand
              </Link>
              <Link href="/kontakt" className="border-2 border-[#2D2A4A] hover:bg-[#2D2A4A] hover:text-white text-[#2D2A4A] font-semibold px-8 py-4 rounded-lg transition-colors">
                Kontakta oss för offert
              </Link>
            </div>
          </div>
        </section>

        {/* Legalization Link Banner */}
        <section className="py-4 bg-[#A51931] text-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <p className="flex items-center gap-2">
                <span className="text-xl">📄</span>
                <span>Behöver du legalisera dokument för Thailand? Vi hjälper med UD-legalisering och översättning.</span>
              </p>
              <Link href="/legalisering/thailand" className="bg-white text-[#A51931] font-semibold px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap">
                Läs om legalisering →
              </Link>
            </div>
          </div>
        </section>

        {/* Visa Free Info */}
        <section className="py-8 bg-blue-50 border-y border-blue-200">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-start gap-4">
              <span className="text-3xl">ℹ️</span>
              <div>
                <h3 className="font-semibold text-blue-900">Visumfritt för korta besök</h3>
                <p className="text-blue-800">
                  Svenska medborgare kan resa till Thailand utan visum för turistbesök upp till 30 dagar. 
                  För längre vistelser eller andra ändamål (arbete, studier, pensionär) krävs visum.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Visum Types Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Typer av visum till Thailand
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {visumTypes.map((visum) => (
                <div key={visum.name} className="bg-gray-50 p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-lg text-[#A51931] mb-2">{visum.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">{visum.duration}</p>
                  <p className="text-gray-700">{visum.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Visa Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              När behöver du visum till Thailand?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-700 mb-4">
                  Thailand är ett av svenskarnas mest populära resmål. För korta turistbesök 
                  upp till 30 dagar behövs inget visum, men för längre vistelser eller 
                  specifika ändamål krävs visum.
                </p>
                <h3 className="font-semibold text-lg mb-3 mt-6">Du behöver visum om du:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-[#A51931] mr-2">•</span>
                    Vill stanna längre än 30 dagar som turist
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#A51931] mr-2">•</span>
                    Ska arbeta eller göra affärer i Thailand
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#A51931] mr-2">•</span>
                    Är pensionär och vill bo i Thailand
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#A51931] mr-2">•</span>
                    Ska studera vid thailändsk skola
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#A51931] mr-2">•</span>
                    Har thailändsk familj du vill besöka
                  </li>
                </ul>
              </div>
              <div className="bg-[#A51931]/10 p-6 rounded-lg border border-[#A51931]/30">
                <h3 className="font-semibold text-lg mb-4">
                  {documentRequirements.length > 0 && selectedProductName
                    ? `Dokument som krävs för ${selectedProductName}:`
                    : 'Dokument som krävs:'}
                </h3>
                {documentRequirements.length > 0 ? (
                  <ul className="space-y-3 text-gray-700">
                    {documentRequirements.sort((a, b) => a.order - b.order).map((doc) => (
                      <li key={doc.id} className="flex items-start">
                        <span className={`mr-2 flex-shrink-0 ${doc.required ? 'text-[#A51931]' : 'text-gray-400'}`}>
                          {doc.required ? '✓' : '○'}
                        </span>
                        <div>
                          <span className="font-medium">
                            {locale === 'en' ? doc.nameEn : doc.name}
                            {doc.required && <span className="text-[#A51931] ml-1">*</span>}
                          </span>
                          <p className="text-sm text-gray-600 mt-0.5">
                            {locale === 'en' ? doc.descriptionEn : doc.description}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="space-y-2 text-gray-700">
                    {requiredDocuments.map((doc, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-[#A51931] mr-2">✓</span>
                        {doc}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-gray-500 mt-4">* = Obligatoriskt</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pensionärsvisum Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Pensionärsvisum till Thailand (Non-Immigrant O-A)
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-[#A51931]/5 to-[#2D2A4A]/5 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">Krav för pensionärsvisum:</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Minst 50 år gammal
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Pension på minst 65 000 baht/månad (~21 000 kr)
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Utdrag ur belastningsregistret
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Läkarintyg på engelska
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Reseförsäkring med sjukvårdstäckning
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-gray-700 mb-4">
                  Non-Immigrant O-A är ett populärt visum för svenska pensionärer som vill 
                  tillbringa längre tid i Thailand. Visumet är giltigt i 1 år och tillåter 
                  multipla inresor.
                </p>
                <p className="text-gray-700 mb-4">
                  Ansökan görs via Thailands ambassad i Stockholm och kräver flera dokument, 
                  inklusive pensionsintyg och läkarintyg. Vi hjälper dig genom hela processen.
                </p>
                <Link href="/kontakt" className="inline-block bg-[#A51931] hover:bg-[#8A1528] text-white font-semibold px-6 py-3 rounded-lg transition-colors">
                  Få hjälp med pensionärsvisum
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Så fungerar visumprocessen
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: '1', title: 'Kontakta oss', desc: 'Berätta om din resa och visumbehov.' },
                { step: '2', title: 'Samla dokument', desc: 'Vi berättar exakt vad som behövs.' },
                { step: '3', title: 'Vi ansöker', desc: 'Vi lämnar in till Thailands ambassad.' },
                { step: '4', title: 'Visum klart', desc: 'Hämta eller få visumet levererat.' },
              ].map((item) => (
                <div key={item.step} className="bg-white p-6 rounded-lg text-center shadow-sm">
                  <div className="w-12 h-12 bg-[#A51931] text-white font-bold text-xl rounded-full flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Vanliga frågor om visum till Thailand
            </h2>
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Hur länge kan jag stanna utan visum?</h3>
                <p className="text-gray-700">
                  Svenska medborgare kan stanna i Thailand utan visum i upp till 30 dagar vid 
                  inresa via flygplats. Detta kan förlängas med ytterligare 30 dagar på plats.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Kan jag förlänga mitt turistvisum i Thailand?</h3>
                <p className="text-gray-700">
                  Ja, turistvisum kan förlängas med 30 dagar vid ett immigrationskontor i Thailand. 
                  Avgiften är 1 900 baht. Ansök innan ditt nuvarande visum går ut.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Vad kostar visum till Thailand?</h3>
                <p className="text-gray-700">
                  Priset varierar beroende på visumtyp. Turistvisum kostar från ca 1 700 kr, 
                  medan pensionärsvisum (O-A) kostar mer. Kontakta oss för exakt pris.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Hur lång tid tar handläggningen?</h3>
                <p className="text-gray-700">
                  Normal handläggningstid är 3-5 arbetsdagar för turistvisum. Pensionärsvisum 
                  kan ta längre tid. Vi erbjuder även expresshantering.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-[#A51931] to-[#2D2A4A] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Behöver du visum till Thailand?
            </h2>
            <p className="text-white/90 mb-8">
              Kontakta oss idag för personlig rådgivning. Vi hjälper dig med rätt visum för din resa.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/visum/bestall?destination=TH" className="bg-white hover:bg-gray-100 text-[#A51931] font-semibold px-8 py-4 rounded-lg transition-colors">
                Beställ visum nu
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-[#2D2A4A] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                Kontakta oss
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'sv', ['common'])),
    },
  };
};
