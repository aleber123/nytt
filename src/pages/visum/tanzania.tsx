import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import CountryFlag from '@/components/ui/CountryFlag';
import { getVisaRequirement, DocumentRequirement } from '@/firebase/visaRequirementsService';

export default function TanzaniaVisumPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const locale = router.locale || 'sv';
  const [documentRequirements, setDocumentRequirements] = useState<DocumentRequirement[]>([]);
  const [selectedProductName, setSelectedProductName] = useState<string>('');

  useEffect(() => {
    const fetchRequirements = async () => {
      try {
        const requirement = await getVisaRequirement('TZ');
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
      name: 'E-Turistvisum',
      duration: '90 dagar',
      description: 'Elektroniskt visum för turism och safari'
    },
    {
      name: 'E-Affärsvisum',
      duration: '90 dagar',
      description: 'För affärsmöten och konferenser'
    },
    {
      name: 'Transitvisum',
      duration: '7 dagar',
      description: 'För genomresa till annat land'
    },
    {
      name: 'Multiple Entry',
      duration: '1 år',
      description: 'För frekventa resenärer'
    }
  ];

  const requiredDocuments = [
    'Giltigt pass (minst 6 månaders giltighet)',
    'Digital passkopia (skannad)',
    'Passfoto i digital form',
    'Bekräftad flygbokning',
    'Hotellbokning eller safari-bokning',
    'Gul febervaccinationsintyg (vid behov)'
  ];

  return (
    <>
      <Head>
        <title>Visum till Tanzania - Ansök om tanzaniskt e-visum | DOX Visumpartner</title>
        <meta name="description" content="Behöver du visum till Tanzania? Vi hjälper dig med e-visum för safari och turism. Besök Serengeti, Kilimanjaro och Zanzibar. Snabb handläggning online." />
        <meta name="keywords" content="Tanzania visum, visum Tanzania, tanzaniskt visum, e-visum Tanzania, turistvisum Tanzania, safari visum, Zanzibar visum, Serengeti, Kilimanjaro" />
        
        <meta property="og:title" content="Visum till Tanzania - Ansök om tanzaniskt e-visum | DOX Visumpartner" />
        <meta property="og:description" content="Vi hjälper dig med e-visum till Tanzania för safari och turism. Besök Serengeti, Kilimanjaro och Zanzibar." />
        <meta property="og:url" content="https://www.doxvl.se/visum/tanzania" />
        <meta property="og:type" content="website" />
        
        <link rel="canonical" href="https://www.doxvl.se/visum/tanzania" />
        
        {/* Service Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Visum till Tanzania",
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
          "description": "E-visum och visumservice för Tanzania. Vi hjälper dig med ansökan om turistvisum och affärsvisum till Tanzania för safari i Serengeti och Zanzibar.",
          "areaServed": { "@type": "Country", "name": "Sweden" },
          "serviceType": "Visa Application Service",
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "SEK",
            "lowPrice": "1500",
            "highPrice": "3500",
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
            { "@type": "ListItem", "position": 3, "name": "Tanzania", "item": "https://www.doxvl.se/visum/tanzania" }
          ]
        })}} />

        {/* FAQPage Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Hur lång tid tar det att få e-visum till Tanzania?",
              "acceptedAnswer": { "@type": "Answer", "text": "E-visum handläggs normalt inom 3-5 arbetsdagar. Vi rekommenderar att ansöka minst 2 veckor innan avresa för att ha marginal." }
            },
            {
              "@type": "Question",
              "name": "Behöver jag gul febervaccination för Tanzania?",
              "acceptedAnswer": { "@type": "Answer", "text": "Gul febervaccination krävs om du reser från eller via ett land där gula febern förekommer. Det rekommenderas även för alla resenärer." }
            },
            {
              "@type": "Question",
              "name": "Kan jag resa till Zanzibar med samma visum?",
              "acceptedAnswer": { "@type": "Answer", "text": "Ja, Zanzibar är en del av Tanzania och samma visum gäller. Du behöver inte ansöka om separat visum för Zanzibar." }
            },
            {
              "@type": "Question",
              "name": "Vad kostar visum till Tanzania?",
              "acceptedAnswer": { "@type": "Answer", "text": "E-visum för turism kostar från ca 1 500 kr inklusive vår serviceavgift. Kontakta oss för exakt pris baserat på din situation." }
            }
          ]
        })}} />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#1EB53A] via-[#00A3DD] to-[#FCD116] text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <CountryFlag code="TZ" size={64} />
              <div>
                <h1 className="text-3xl md:text-5xl font-bold">
                  Visum till Tanzania
                </h1>
                <p className="text-xl text-white/80">E-visum för safari och äventyr</p>
              </div>
            </div>
            <p className="text-xl text-white/90 mb-8 max-w-2xl">
              Drömmer du om safari i Serengeti, att bestiga Kilimanjaro eller slappa på Zanzibars stränder? 
              Vi hjälper dig med e-visum så du kan fokusera på äventyret.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/visum/bestall?destination=TZ" className="bg-white hover:bg-gray-100 text-[#1EB53A] font-semibold px-8 py-4 rounded-lg transition-colors">
                Beställ visum till Tanzania
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-[#00A3DD] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                Kontakta oss för offert
              </Link>
            </div>
          </div>
        </section>

        {/* Visum Types Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Typer av visum till Tanzania
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {visumTypes.map((visum) => (
                <div key={visum.name} className="bg-gray-50 p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-lg text-[#1EB53A] mb-2">{visum.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">{visum.duration}</p>
                  <p className="text-gray-700">{visum.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* E-visa Info Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              E-visum till Tanzania
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-700 mb-4">
                  Tanzania erbjuder elektroniskt visum (e-Visa) för svenska medborgare. 
                  Detta gör ansökan enkel då du inte behöver besöka ambassaden eller 
                  skicka in ditt pass.
                </p>
                <p className="text-gray-700 mb-4">
                  E-visum är giltigt för inresa via alla internationella flygplatser och 
                  gränsövergångar i Tanzania, inklusive Dar es Salaam, Kilimanjaro Airport 
                  och Zanzibar.
                </p>
                <p className="text-gray-700 mb-4">
                  Handläggningstiden är normalt 3-5 arbetsdagar. Vi rekommenderar att 
                  ansöka minst 2 veckor innan avresa.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>Obs!</strong> Gul febervaccination krävs om du reser från eller 
                    via ett land där gula febern förekommer. Vaccinationsintyg kan krävas vid inresa.
                  </p>
                </div>
              </div>
              <div className="bg-[#1EB53A]/10 p-6 rounded-lg border border-[#1EB53A]/30">
                <h3 className="font-semibold text-lg mb-4">
                  {documentRequirements.length > 0 && selectedProductName
                    ? `Dokument som krävs för ${selectedProductName}:`
                    : 'Dokument som krävs för e-visum:'}
                </h3>
                {documentRequirements.length > 0 ? (
                  <ul className="space-y-3 text-gray-700">
                    {documentRequirements.sort((a, b) => a.order - b.order).map((doc) => (
                      <li key={doc.id} className="flex items-start">
                        <span className={`mr-2 flex-shrink-0 ${doc.required ? 'text-[#1EB53A]' : 'text-gray-400'}`}>
                          {doc.required ? '✓' : '○'}
                        </span>
                        <div>
                          <span className="font-medium">
                            {locale === 'en' ? doc.nameEn : doc.name}
                            {doc.required && <span className="text-[#1EB53A] ml-1">*</span>}
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
                        <span className="text-[#1EB53A] mr-2">✓</span>
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
              Populära resmål i Tanzania
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: 'Serengeti', desc: 'Världens mest kända nationalpark för safari och den stora migrationen.' },
                { name: 'Kilimanjaro', desc: 'Afrikas högsta berg – en dröm för vandrare och bergsbestigare.' },
                { name: 'Zanzibar', desc: 'Paradisö med vita stränder, kryddmarknader och historiska Stone Town.' },
                { name: 'Ngorongoro', desc: 'Spektakulär vulkankrater med otrolig koncentration av vilda djur.' },
                { name: 'Tarangire', desc: 'Känd för sina baobabträd och stora elefanthjordar.' },
                { name: 'Lake Manyara', desc: 'Vacker sjö omgiven av skog, hem för flamingos och trädklättrande lejon.' },
              ].map((dest) => (
                <div key={dest.name} className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-lg text-[#1EB53A] mb-2">{dest.name}</h3>
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
              Så fungerar e-visumprocessen
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: '1', title: 'Beställ online', desc: 'Fyll i vårt enkla formulär med dina uppgifter.' },
                { step: '2', title: 'Ladda upp dokument', desc: 'Skicka passkopia och foto digitalt.' },
                { step: '3', title: 'Vi ansöker', desc: 'Vi hanterar hela ansökan åt dig.' },
                { step: '4', title: 'E-visum klart', desc: 'Du får visumet via e-post inom 3-5 dagar.' },
              ].map((item) => (
                <div key={item.step} className="bg-white p-6 rounded-lg text-center shadow-sm">
                  <div className="w-12 h-12 bg-[#1EB53A] text-white font-bold text-xl rounded-full flex items-center justify-center mx-auto mb-4">
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
              Vanliga frågor om visum till Tanzania
            </h2>
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Hur lång tid tar det att få e-visum?</h3>
                <p className="text-gray-700">
                  E-visum handläggs normalt inom 3-5 arbetsdagar. Vi rekommenderar att ansöka 
                  minst 2 veckor innan avresa för att ha marginal.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Behöver jag gul febervaccination?</h3>
                <p className="text-gray-700">
                  Gul febervaccination krävs om du reser från eller via ett land där gula febern 
                  förekommer. Det rekommenderas även för alla resenärer. Kontakta en 
                  vaccinationsmottagning för rådgivning.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Kan jag resa till Zanzibar med samma visum?</h3>
                <p className="text-gray-700">
                  Ja, Zanzibar är en del av Tanzania och samma visum gäller. Du behöver inte 
                  ansöka om separat visum för Zanzibar.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Vad kostar visum till Tanzania?</h3>
                <p className="text-gray-700">
                  E-visum för turism kostar från ca 1 500 kr inklusive vår serviceavgift. 
                  Kontakta oss för exakt pris baserat på din situation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-[#1EB53A] to-[#00A3DD] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Redo för safari i Tanzania?
            </h2>
            <p className="text-white/90 mb-8">
              Beställ ditt e-visum idag och börja planera ditt afrikanska äventyr. Vi gör processen enkel.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/visum/bestall?destination=TZ" className="bg-white hover:bg-gray-100 text-[#1EB53A] font-semibold px-8 py-4 rounded-lg transition-colors">
                Beställ visum nu
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-[#00A3DD] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
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
