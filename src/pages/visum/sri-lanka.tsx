import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import CountryFlag from '@/components/ui/CountryFlag';
import { getVisaRequirement, DocumentRequirement } from '@/firebase/visaRequirementsService';

export default function SriLankaVisumPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const locale = router.locale || 'sv';
  const [documentRequirements, setDocumentRequirements] = useState<DocumentRequirement[]>([]);
  const [selectedProductName, setSelectedProductName] = useState<string>('');

  useEffect(() => {
    const fetchRequirements = async () => {
      try {
        const requirement = await getVisaRequirement('LK');
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
      name: 'ETA Turistvisum',
      duration: '30 dagar',
      description: 'Elektroniskt resetillstånd för turism'
    },
    {
      name: 'ETA Affärsvisum',
      duration: '30 dagar',
      description: 'För affärsmöten och konferenser'
    },
    {
      name: 'ETA Transit',
      duration: '2 dagar',
      description: 'För genomresa till annat land'
    },
    {
      name: 'Förlängning',
      duration: 'Upp till 90 dagar',
      description: 'Kan förlängas på plats i Sri Lanka'
    }
  ];

  const requiredDocuments = [
    'Giltigt pass (minst 6 månaders giltighet)',
    'Digital passkopia',
    'Bekräftad flygbokning tur och retur',
    'Hotellbokning',
    'Bevis på ekonomiska medel'
  ];

  return (
    <>
      <Head>
        <title>Visum till Sri Lanka - Ansök om ETA online | DOX Visumpartner</title>
        <meta name="description" content="Behöver du visum till Sri Lanka? Vi hjälper dig med ETA (Electronic Travel Authorization). Besök tempel, teplanteringar och vackra stränder. Snabb handläggning." />
        <meta name="keywords" content="Sri Lanka visum, visum Sri Lanka, ETA Sri Lanka, turistvisum Sri Lanka, Electronic Travel Authorization, Colombo, Kandy, Galle" />
        
        <meta property="og:title" content="Visum till Sri Lanka - Ansök om ETA online | DOX Visumpartner" />
        <meta property="og:description" content="Vi hjälper dig med ETA till Sri Lanka. Besök tempel, teplanteringar och paradisiska stränder." />
        <meta property="og:url" content="https://www.doxvl.se/visum/sri-lanka" />
        <meta property="og:type" content="website" />
        
        <link rel="canonical" href="https://www.doxvl.se/visum/sri-lanka" />
        
        {/* Service Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Visum till Sri Lanka",
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
          "description": "ETA och visumservice för Sri Lanka. Vi hjälper dig med ansökan om turistvisum och affärsvisum till Sri Lanka.",
          "areaServed": {
            "@type": "Country",
            "name": "Sweden"
          },
          "serviceType": "Visa Application Service",
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "SEK",
            "lowPrice": "800",
            "highPrice": "1500",
            "offerCount": "4"
          }
        })}} />

        {/* BreadcrumbList Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Hem", "item": "https://www.doxvl.se" },
            { "@type": "ListItem", "position": 2, "name": "Visum", "item": "https://www.doxvl.se/visum" },
            { "@type": "ListItem", "position": 3, "name": "Sri Lanka", "item": "https://www.doxvl.se/visum/sri-lanka" }
          ]
        })}} />

        {/* FAQPage Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Hur lång tid tar det att få ETA till Sri Lanka?",
              "acceptedAnswer": { "@type": "Answer", "text": "ETA handläggs normalt inom 24-48 timmar. Vi rekommenderar att ansöka minst en vecka innan avresa för att ha marginal." }
            },
            {
              "@type": "Question",
              "name": "Kan jag förlänga mitt ETA i Sri Lanka?",
              "acceptedAnswer": { "@type": "Answer", "text": "Ja, ETA kan förlängas på plats vid Department of Immigration i Colombo. Du kan förlänga med upp till 90 dagar totalt (inklusive de första 30 dagarna)." }
            },
            {
              "@type": "Question",
              "name": "Vad kostar ETA till Sri Lanka?",
              "acceptedAnswer": { "@type": "Answer", "text": "ETA för turism kostar från ca 800 kr inklusive vår serviceavgift. Kontakta oss för exakt pris." }
            },
            {
              "@type": "Question",
              "name": "Behöver jag vaccinationer för Sri Lanka?",
              "acceptedAnswer": { "@type": "Answer", "text": "Inga vaccinationer är obligatoriska för svenska medborgare, men hepatit A och B, tyfoid och japansk encefalit rekommenderas." }
            }
          ]
        })}} />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#8D153A] via-[#FFBE29] to-[#005641] text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <CountryFlag code="LK" size={64} />
              <div>
                <h1 className="text-3xl md:text-5xl font-bold">
                  Visum till Sri Lanka
                </h1>
                <p className="text-xl text-white/80">ETA – Electronic Travel Authorization</p>
              </div>
            </div>
            <p className="text-xl text-white/90 mb-8 max-w-2xl">
              Upptäck Sri Lankas fantastiska tempel, gröna teplanteringar och paradisiska stränder. 
              Vi hjälper dig med ETA så du snabbt kan börja din resa.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/visum/bestall?destination=LK" className="bg-white hover:bg-gray-100 text-[#8D153A] font-semibold px-8 py-4 rounded-lg transition-colors">
                Beställ ETA till Sri Lanka
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-[#005641] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                Kontakta oss för offert
              </Link>
            </div>
          </div>
        </section>

        {/* Visum Types Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Typer av ETA till Sri Lanka
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {visumTypes.map((visum) => (
                <div key={visum.name} className="bg-gray-50 p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-lg text-[#8D153A] mb-2">{visum.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">{visum.duration}</p>
                  <p className="text-gray-700">{visum.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ETA Info Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Vad är ETA till Sri Lanka?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-700 mb-4">
                  ETA (Electronic Travel Authorization) är ett elektroniskt resetillstånd som 
                  krävs för alla besökare till Sri Lanka. Det ersätter det traditionella visumet 
                  och gör ansökan enkel och snabb.
                </p>
                <p className="text-gray-700 mb-4">
                  ETA är giltigt för dubbel inresa inom 30 dagar och kan förlängas på plats 
                  i Sri Lanka med upp till 90 dagar totalt.
                </p>
                <p className="text-gray-700 mb-4">
                  Handläggningstiden är normalt 24-48 timmar. Vi rekommenderar att ansöka 
                  minst en vecka innan avresa.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="text-blue-800 text-sm">
                    <strong>Tips:</strong> ETA tillåter dubbel inresa, perfekt om du vill 
                    kombinera Sri Lanka med en dagstur till Maldiverna!
                  </p>
                </div>
              </div>
              <div className="bg-[#8D153A]/10 p-6 rounded-lg border border-[#8D153A]/30">
                <h3 className="font-semibold text-lg mb-4">
                  {documentRequirements.length > 0 && selectedProductName
                    ? `Dokument som krävs för ${selectedProductName}:`
                    : 'Dokument som krävs för ETA:'}
                </h3>
                {documentRequirements.length > 0 ? (
                  <ul className="space-y-3 text-gray-700">
                    {documentRequirements.sort((a, b) => a.order - b.order).map((doc) => (
                      <li key={doc.id} className="flex items-start">
                        <span className={`mr-2 flex-shrink-0 ${doc.required ? 'text-[#8D153A]' : 'text-gray-400'}`}>
                          {doc.required ? '✓' : '○'}
                        </span>
                        <div>
                          <span className="font-medium">
                            {locale === 'en' ? doc.nameEn : doc.name}
                            {doc.required && <span className="text-[#8D153A] ml-1">*</span>}
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
                        <span className="text-[#8D153A] mr-2">✓</span>
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

        {/* Popular Destinations */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Populära resmål i Sri Lanka
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: 'Colombo', desc: 'Huvudstaden med kolonial arkitektur, marknader och modern skyline.' },
                { name: 'Kandy', desc: 'Kulturell huvudstad med Tandtemplet och vackra botaniska trädgårdar.' },
                { name: 'Galle', desc: 'Historiskt fort från kolonialtiden, UNESCO-världsarv vid kusten.' },
                { name: 'Sigiriya', desc: 'Den ikoniska Lejonklippan med antika fresker och fantastisk utsikt.' },
                { name: 'Ella', desc: 'Bergsby med teplanteringar, vandringar och Nine Arch Bridge.' },
                { name: 'Mirissa', desc: 'Paradisisk strand perfekt för surfing och valskådning.' },
              ].map((dest) => (
                <div key={dest.name} className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-lg text-[#8D153A] mb-2">{dest.name}</h3>
                  <p className="text-gray-600 text-sm">{dest.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Så fungerar ETA-processen
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: '1', title: 'Beställ online', desc: 'Fyll i vårt enkla formulär med dina uppgifter.' },
                { step: '2', title: 'Skicka passkopia', desc: 'Ladda upp en kopia på ditt pass.' },
                { step: '3', title: 'Vi ansöker', desc: 'Vi hanterar hela ansökan åt dig.' },
                { step: '4', title: 'ETA klart', desc: 'Du får ETA via e-post inom 24-48 timmar.' },
              ].map((item) => (
                <div key={item.step} className="bg-white p-6 rounded-lg text-center shadow-sm">
                  <div className="w-12 h-12 bg-[#8D153A] text-white font-bold text-xl rounded-full flex items-center justify-center mx-auto mb-4">
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
              Vanliga frågor om ETA till Sri Lanka
            </h2>
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Hur lång tid tar det att få ETA?</h3>
                <p className="text-gray-700">
                  ETA handläggs normalt inom 24-48 timmar. Vi rekommenderar att ansöka 
                  minst en vecka innan avresa för att ha marginal.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Kan jag förlänga mitt ETA i Sri Lanka?</h3>
                <p className="text-gray-700">
                  Ja, ETA kan förlängas på plats vid Department of Immigration i Colombo. 
                  Du kan förlänga med upp till 90 dagar totalt (inklusive de första 30 dagarna).
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Vad kostar ETA till Sri Lanka?</h3>
                <p className="text-gray-700">
                  ETA för turism kostar från ca 800 kr inklusive vår serviceavgift. 
                  Kontakta oss för exakt pris.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Behöver jag vaccinationer för Sri Lanka?</h3>
                <p className="text-gray-700">
                  Inga vaccinationer är obligatoriska för svenska medborgare, men hepatit A och B, 
                  tyfoid och japansk encefalit rekommenderas. Kontakta en vaccinationsmottagning 
                  för personlig rådgivning.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-[#8D153A] via-[#FFBE29] to-[#005641] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Redo att upptäcka Sri Lanka?
            </h2>
            <p className="text-white/90 mb-8">
              Beställ ditt ETA idag och börja planera din resa till paradiset. Vi gör processen enkel och snabb.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/visum/bestall?destination=LK" className="bg-white hover:bg-gray-100 text-[#8D153A] font-semibold px-8 py-4 rounded-lg transition-colors">
                Beställ ETA nu
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-[#005641] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
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
