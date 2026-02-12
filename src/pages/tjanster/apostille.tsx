import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';

export default function ApostillePage() {
  const { t } = useTranslation('common');
  const sp = 'servicePages.apostille';

  return (
    <>
      <Head>
        <title>{t(`${sp}.title`)} | DOX Visumpartner – Apostille Sverige</title>
        <meta name="description" content={t(`${sp}.metaDescription`)} />
        <meta name="keywords" content="apostille, apostille Sverige, apostille stämpel, haagkonventionen, legalisering dokument, apostille födelsebevis, apostille examensbevis, apostille vigselbevis, apostille fullmakt, apostille bolagshandlingar, apostille pris, apostille Stockholm, apostille snabb handläggning, apostille online, legalisera dokument utomlands, internationell dokumentlegalisering" />
        <link rel="canonical" href="https://doxvl.se/tjanster/apostille" />
        <link rel="alternate" hrefLang="sv" href="https://doxvl.se/tjanster/apostille" />
        <link rel="alternate" hrefLang="en" href="https://doxvl.se/en/tjanster/apostille" />
        <link rel="alternate" hrefLang="x-default" href="https://doxvl.se/tjanster/apostille" />
        
        <meta property="og:title" content={`${t(`${sp}.title`)} | DOX Visumpartner`} />
        <meta property="og:description" content={t(`${sp}.metaDescription`)} />
        <meta property="og:url" content="https://doxvl.se/tjanster/apostille" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://doxvl.se/dox-logo.webp" />
        <meta property="og:site_name" content="DOX Visumpartner" />
        <meta property="og:locale" content="sv_SE" />
        <meta property="og:locale:alternate" content="en_GB" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${t(`${sp}.title`)} | DOX Visumpartner`} />
        <meta name="twitter:description" content={t(`${sp}.metaDescription`)} />
        <meta name="twitter:image" content="https://doxvl.se/dox-logo.webp" />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Apostille Sverige – Legalisering av dokument",
          "alternateName": "Apostille-stämpel",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB",
            "url": "https://doxvl.se",
            "logo": "https://doxvl.se/dox-logo.webp",
            "telephone": "+46840941900",
            "email": "info@doxvl.se",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Livdjursgatan 4",
              "addressLocality": "Stockholm",
              "postalCode": "121 62",
              "addressCountry": "SE"
            }
          },
          "description": "Apostille-legalisering för svenska dokument som ska användas i Haagkonventionsländer. Vi hanterar hela processen – skicka in dina dokument och vi ordnar resten. Snabb handläggning, från 695 kr inkl. moms.",
          "areaServed": [
            { "@type": "Country", "name": "Sweden" },
            { "@type": "Country", "name": "Norway" },
            { "@type": "Country", "name": "Denmark" },
            { "@type": "Country", "name": "Finland" }
          ],
          "serviceType": "Document Legalization – Apostille",
          "category": "Dokumentlegalisering",
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Apostille-tjänster",
            "itemListElement": [
              {
                "@type": "Offer",
                "name": "Apostille – Standard",
                "price": "695",
                "priceCurrency": "SEK",
                "availability": "https://schema.org/InStock",
                "priceValidUntil": "2027-12-31"
              },
              {
                "@type": "Offer",
                "name": "Apostille – Express",
                "price": "1195",
                "priceCurrency": "SEK",
                "availability": "https://schema.org/InStock",
                "priceValidUntil": "2027-12-31"
              }
            ]
          }
        })}} />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Hem", "item": "https://doxvl.se" },
            { "@type": "ListItem", "position": 2, "name": "Tjänster", "item": "https://doxvl.se/tjanster" },
            { "@type": "ListItem", "position": 3, "name": "Apostille", "item": "https://doxvl.se/tjanster/apostille" }
          ]
        })}} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "Hur man får apostille på dokument i Sverige",
          "description": "Steg-för-steg guide för att få apostille-stämpel på svenska dokument via DOX Visumpartner.",
          "totalTime": "P7D",
          "estimatedCost": { "@type": "MonetaryAmount", "currency": "SEK", "value": "695" },
          "step": [
            { "@type": "HowToStep", "position": 1, "name": "Beställ online", "text": "Fyll i beställningsformuläret på doxvl.se med information om ditt dokument och vilket land det ska användas i." },
            { "@type": "HowToStep", "position": 2, "name": "Skicka in dokument", "text": "Skicka originaldokumentet till oss per post eller boka upphämtning. Vi tar emot dokument från hela Norden." },
            { "@type": "HowToStep", "position": 3, "name": "Vi hanterar processen", "text": "Vi lämnar in ditt dokument till behörig myndighet för apostille-stämpel och bevakar ärendet." },
            { "@type": "HowToStep", "position": 4, "name": "Dokument returneras", "text": "Ditt apostille-stämplade dokument skickas tillbaka till dig med spårbar frakt." }
          ]
        })}} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Vad är en apostille?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "En apostille är en internationell stämpel enligt Haagkonventionen (1961) som bekräftar ett dokuments äkthet. Med en apostille kan ditt svenska dokument användas i över 120 anslutna länder utan ytterligare legalisering. I Sverige utfärdas apostille av Notarius Publicus."
              }
            },
            {
              "@type": "Question",
              "name": "Hur lång tid tar det att få en apostille?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Standardhandläggning tar vanligtvis 5-7 arbetsdagar från det att vi mottagit ditt dokument. Vi erbjuder även expresstjänst med 1-2 dagars handläggning för brådskande ärenden."
              }
            },
            {
              "@type": "Question",
              "name": "Vilka dokument kan få apostille?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "De flesta officiella svenska dokument kan få apostille, inklusive: födelsebevis, vigselbevis, examensbevis, gymnasiebevis, universitetsbevis, fullmakter, bolagshandlingar, registerutdrag från Bolagsverket, domstolshandlingar, dödsbevis och adoptionshandlingar."
              }
            },
            {
              "@type": "Question",
              "name": "Vad kostar en apostille?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Apostille hos DOX Visumpartner kostar från 695 kr inklusive moms för standardtjänst. Expresstjänst kostar från 1 195 kr. Priset inkluderar hantering och inlämning till myndighet."
              }
            },
            {
              "@type": "Question",
              "name": "Vilka länder accepterar apostille?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Apostille accepteras i alla länder som anslutit sig till Haagkonventionen – över 120 länder inklusive USA, Storbritannien, Frankrike, Tyskland, Spanien, Italien, Australien, Japan och de flesta EU-länder. För länder utanför konventionen krävs istället ambassadlegalisering."
              }
            },
            {
              "@type": "Question",
              "name": "Behöver jag notarisering innan apostille?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "I vissa fall behövs notarisering (Notarius Publicus) innan apostille kan utfärdas, till exempel för kopior av pass eller privata dokument. Vi hjälper dig att avgöra vad som krävs för just ditt dokument."
              }
            },
            {
              "@type": "Question",
              "name": "Kan jag beställa apostille online?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Ja, du kan enkelt beställa apostille online via doxvl.se. Fyll i formuläret, skicka in ditt dokument per post, och vi hanterar hela processen åt dig. Vi betjänar kunder i hela Sverige samt Norge, Danmark och Finland."
              }
            }
          ]
        })}} />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#2E2D2C] to-[#1a1918] text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-5xl font-bold mb-6">
                {t(`${sp}.title`)}
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                {t(`${sp}.heroText`)}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/bestall" className="bg-custom-button hover:bg-custom-button/90 text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                  {t('servicePages.orderNow')}
                </Link>
                <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-black text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                  {t('servicePages.contactUs')}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* What is Apostille Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              {t(`${sp}.whatTitle`)}
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-700 mb-4">
                  {t(`${sp}.whatText1`)}
                </p>
                <p className="text-gray-700 mb-4">
                  {t(`${sp}.whatText2`)}
                </p>
                <p className="text-gray-700">
                  {t(`${sp}.whatText3`)}
                </p>
              </div>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">{t(`${sp}.documentsTitle`)}</h3>
                <ul className="space-y-2 text-gray-700">
                  {(t(`${sp}.documents`, { returnObjects: true }) as string[]).map((doc, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Countries Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 text-center">
              {t(`${sp}.countriesTitle`)}
            </h2>
            <p className="text-gray-600 text-center mb-8">
              {t(`${sp}.countriesText`)}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(t(`${sp}.countries`, { returnObjects: true }) as Array<{flag: string; name: string}>).map((country, idx) => (
                <div key={idx} className="bg-white p-4 rounded-lg shadow-sm text-center">
                  <span className="text-3xl mb-2 block">{country.flag}</span>
                  <span className="font-medium">{country.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              {t(`${sp}.faqTitle`)}
            </h2>
            <div className="space-y-6 max-w-3xl mx-auto">
              {(t(`${sp}.faqs`, { returnObjects: true }) as Array<{q: string; a: string}>).map((faq, idx) => (
                <div key={idx} className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
                  <p className="text-gray-700">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              {t(`${sp}.processTitle`)}
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {(t(`${sp}.processSteps`, { returnObjects: true }) as Array<{title: string; desc: string}>).map((step, idx) => (
                <div key={idx} className="text-center">
                  <div className="w-12 h-12 bg-custom-button text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">{idx + 1}</div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[#2E2D2C] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {t(`${sp}.ctaTitle`)}
            </h2>
            <p className="text-gray-300 mb-8">
              {t(`${sp}.ctaText`)}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/bestall" className="bg-custom-button hover:bg-custom-button/90 text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                {t('servicePages.orderNow')}
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-black text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                {t('servicePages.contactUs')}
              </Link>
            </div>
          </div>
        </section>

        {/* Related Services - Internal Linking */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 text-center">
              {t('servicePages.relatedServicesTitle') !== 'servicePages.relatedServicesTitle' ? t('servicePages.relatedServicesTitle') : 'Relaterade tjänster'}
            </h2>
            <p className="text-gray-600 text-center mb-8">
              {t('servicePages.relatedServicesText') !== 'servicePages.relatedServicesText' ? t('servicePages.relatedServicesText') : 'Behöver du fler legaliseringstjänster? Vi erbjuder ett komplett utbud.'}
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <Link href="/tjanster/notarius-publicus" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-teal-300 transition-all group">
                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">Notarius Publicus</h3>
                <p className="text-gray-600 text-sm">Bestyrkning och verifiering av dokument – ofta ett första steg innan apostille.</p>
              </Link>
              <Link href="/tjanster/utrikesdepartementet" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-teal-300 transition-all group">
                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">UD-legalisering</h3>
                <p className="text-gray-600 text-sm">Legalisering via Utrikesdepartementet för dokument som ska till länder utanför Haagkonventionen.</p>
              </Link>
              <Link href="/tjanster/ambassadlegalisering" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-teal-300 transition-all group">
                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">Ambassadlegalisering</h3>
                <p className="text-gray-600 text-sm">Legalisering via utländska ambassader – krävs för länder som inte accepterar apostille.</p>
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
