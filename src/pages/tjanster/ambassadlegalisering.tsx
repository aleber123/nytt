import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';

export default function AmbassadlegaliseringPage() {
  const { t } = useTranslation('common');
  const sp = 'servicePages.ambassadlegalisering';

  return (
    <>
      <Head>
        <title>{t(`${sp}.title`)} | DOX Visumpartner – Ambassadlegalisering Sverige</title>
        <meta name="description" content={t(`${sp}.metaDescription`)} />
        <meta name="keywords" content="ambassadlegalisering, ambassadlegalisering Sverige, legalisering ambassad, legalisera dokument ambassad, konsulat legalisering, legalisering Qatar, legalisering Kuwait, legalisering UAE, legalisering Saudiarabien, legalisering Egypten, legalisering Kina, dokument utomlands, internationell legalisering, ambassadlegalisering pris, ambassadlegalisering Stockholm, legalisering mellanöstern, legalisering afrika" />
        <link rel="canonical" href="https://doxvl.se/tjanster/ambassadlegalisering" />
        <link rel="alternate" hrefLang="sv" href="https://doxvl.se/tjanster/ambassadlegalisering" />
        <link rel="alternate" hrefLang="en" href="https://doxvl.se/en/tjanster/ambassadlegalisering" />
        <link rel="alternate" hrefLang="x-default" href="https://doxvl.se/tjanster/ambassadlegalisering" />
        
        <meta property="og:title" content={`${t(`${sp}.title`)} | DOX Visumpartner`} />
        <meta property="og:description" content={t(`${sp}.metaDescription`)} />
        <meta property="og:url" content="https://doxvl.se/tjanster/ambassadlegalisering" />
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
          "name": "Ambassadlegalisering Sverige – Legalisering via utländska ambassader",
          "alternateName": "Embassy Legalization",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB",
            "url": "https://doxvl.se",
            "logo": "https://doxvl.se/dox-logo.webp",
            "telephone": "+46840941900",
            "email": "info@doxvl.se",
            "address": { "@type": "PostalAddress", "streetAddress": "Livdjursgatan 4", "addressLocality": "Stockholm", "postalCode": "121 62", "addressCountry": "SE" }
          },
          "description": "Ambassadlegalisering för dokument som ska användas i länder utanför Haagkonventionen. Vi hanterar hela processen med ambassader och konsulat i Stockholm. Från 1 495 kr inkl. moms.",
          "areaServed": [
            { "@type": "Country", "name": "Sweden" },
            { "@type": "Country", "name": "Norway" },
            { "@type": "Country", "name": "Denmark" },
            { "@type": "Country", "name": "Finland" }
          ],
          "serviceType": "Embassy Document Legalization",
          "category": "Dokumentlegalisering",
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Ambassadlegaliseringstjänster",
            "itemListElement": [
              { "@type": "Offer", "name": "Ambassadlegalisering – Standard", "price": "1495", "priceCurrency": "SEK", "availability": "https://schema.org/InStock", "priceValidUntil": "2027-12-31" },
              { "@type": "Offer", "name": "Ambassadlegalisering – Express", "price": "1995", "priceCurrency": "SEK", "availability": "https://schema.org/InStock", "priceValidUntil": "2027-12-31" }
            ]
          }
        })}} />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Hem", "item": "https://doxvl.se" },
            { "@type": "ListItem", "position": 2, "name": "Tjänster", "item": "https://doxvl.se/tjanster" },
            { "@type": "ListItem", "position": 3, "name": "Ambassadlegalisering", "item": "https://doxvl.se/tjanster/ambassadlegalisering" }
          ]
        })}} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "Hur man legaliserar dokument via ambassad i Sverige",
          "description": "Steg-för-steg guide för ambassadlegalisering av svenska dokument.",
          "totalTime": "P14D",
          "estimatedCost": { "@type": "MonetaryAmount", "currency": "SEK", "value": "1495" },
          "step": [
            { "@type": "HowToStep", "position": 1, "name": "Beställ online", "text": "Fyll i beställningsformuläret med information om dokument och destinationsland." },
            { "@type": "HowToStep", "position": 2, "name": "Skicka in dokument", "text": "Skicka originaldokumentet till oss. Vi verifierar att det uppfyller ambassadens krav." },
            { "@type": "HowToStep", "position": 3, "name": "Notarisering & UD", "text": "Vi hanterar eventuell notarisering och UD-legalisering som krävs innan ambassadlegalisering." },
            { "@type": "HowToStep", "position": 4, "name": "Ambassadlegalisering", "text": "Vi lämnar in dokumentet till rätt ambassad och bevakar ärendet tills det är klart." },
            { "@type": "HowToStep", "position": 5, "name": "Returnering", "text": "Ditt legaliserade dokument skickas tillbaka med spårbar frakt." }
          ]
        })}} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Vad är ambassadlegalisering?",
              "acceptedAnswer": { "@type": "Answer", "text": "Ambassadlegalisering krävs för dokument som ska användas i länder utanför Haagkonventionen. Dokumentet måste först legaliseras av svenska myndigheter (Notarius Publicus och Utrikesdepartementet) och sedan av det aktuella landets ambassad eller konsulat i Stockholm." }
            },
            {
              "@type": "Question",
              "name": "Vilka länder kräver ambassadlegalisering?",
              "acceptedAnswer": { "@type": "Answer", "text": "Länder som inte är anslutna till Haagkonventionen kräver ambassadlegalisering, bland annat: Qatar, Kuwait, Förenade Arabemiraten (UAE), Saudiarabien, Egypten, Irak, Libanon, Libyen, Syrien, Angola, Etiopien, Nigeria, Moçambique och Vietnam." }
            },
            {
              "@type": "Question",
              "name": "Hur lång tid tar ambassadlegalisering?",
              "acceptedAnswer": { "@type": "Answer", "text": "Handläggningstiden varierar beroende på ambassad, vanligtvis 7-14 arbetsdagar. Vissa ambassader kan ta längre tid. Vi informerar alltid om förväntad tid för ditt specifika ärende och erbjuder expresstjänst där det är möjligt." }
            },
            {
              "@type": "Question",
              "name": "Vad kostar ambassadlegalisering?",
              "acceptedAnswer": { "@type": "Answer", "text": "Ambassadlegalisering hos DOX Visumpartner kostar från 1 495 kr inklusive moms. Priset varierar beroende på land och ambassadens egna avgifter. Vi ger alltid en exakt offert innan vi påbörjar arbetet." }
            },
            {
              "@type": "Question",
              "name": "Vilka steg ingår i ambassadlegalisering?",
              "acceptedAnswer": { "@type": "Answer", "text": "Ambassadlegalisering är en flerstegsprocess: 1) Notarisering via Notarius Publicus, 2) Legalisering via Utrikesdepartementet (UD), 3) Legalisering vid den utländska ambassaden. Vi hanterar alla steg åt dig." }
            },
            {
              "@type": "Question",
              "name": "Kan jag beställa ambassadlegalisering online?",
              "acceptedAnswer": { "@type": "Answer", "text": "Ja, beställ enkelt online via doxvl.se. Fyll i formuläret, skicka in ditt dokument per post, och vi hanterar hela kedjan – från notarisering till ambassadlegalisering. Vi betjänar kunder i hela Norden." }
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

        {/* What is Embassy Legalization Section */}
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
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              {t(`${sp}.countriesTitle`)}
            </h2>
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
              Relaterade tjänster
            </h2>
            <p className="text-gray-600 text-center mb-8">
              Ambassadlegalisering kräver ofta föregående steg. Vi erbjuder hela kedjan.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <Link href="/tjanster/notarius-publicus" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-teal-300 transition-all group">
                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">Notarius Publicus</h3>
                <p className="text-gray-600 text-sm">Steg 1: Bestyrkning av dokument – krävs innan UD-legalisering.</p>
              </Link>
              <Link href="/tjanster/utrikesdepartementet" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-teal-300 transition-all group">
                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">UD-legalisering</h3>
                <p className="text-gray-600 text-sm">Steg 2: Legalisering via Utrikesdepartementet – krävs innan ambassadlegalisering.</p>
              </Link>
              <Link href="/tjanster/oversattning" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-teal-300 transition-all group">
                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">Auktoriserad översättning</h3>
                <p className="text-gray-600 text-sm">Behöver ditt dokument översättas? Vi erbjuder certifierad översättning.</p>
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
