import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';



export default function NotariusPublicusPage() {
  const { t } = useTranslation('common');
  const sp = 'servicePages.notarisering';

  return (
    <>
      <Head>
        <title>{t(`${sp}.title`)} | DOX Visumpartner – Notarius Publicus Sverige</title>
        <meta name="description" content={t(`${sp}.metaDescription`)} />
        <meta name="keywords" content="notarius publicus, notarisering, bestyrka underskrift, bevittna underskrift, notarius publicus Stockholm, notarisering dokument, bestyrkt kopia, notarisering fullmakt, notarisering pris, notarius publicus pris, legalisering dokument, notarisering inför apostille, notarisering inför ambassadlegalisering, bestyrka handlingar, notarius publicus online, notarisering snabb" />
        <link rel="canonical" href="https://doxvl.se/tjanster/notarius-publicus" />
        <link rel="alternate" hrefLang="sv" href="https://doxvl.se/tjanster/notarius-publicus" />
        <link rel="alternate" hrefLang="en" href="https://doxvl.se/en/tjanster/notarius-publicus" />
        <link rel="alternate" hrefLang="x-default" href="https://doxvl.se/tjanster/notarius-publicus" />
        
        <meta property="og:title" content={`${t(`${sp}.title`)} | DOX Visumpartner`} />
        <meta property="og:description" content={t(`${sp}.metaDescription`)} />
        <meta property="og:url" content="https://doxvl.se/tjanster/notarius-publicus" />
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
          "name": "Notarius Publicus – Notarisering av dokument i Sverige",
          "alternateName": "Notarization Sweden",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB",
            "url": "https://doxvl.se",
            "logo": "https://doxvl.se/dox-logo.webp",
            "telephone": "+46840941900",
            "email": "info@doxvl.se",
            "address": { "@type": "PostalAddress", "streetAddress": "Livdjursgatan 4", "addressLocality": "Stockholm", "postalCode": "121 62", "addressCountry": "SE" }
          },
          "description": "Notarisering av dokument och bestyrkande av underskrifter via Notarius Publicus. Vi hanterar notarisering för alla typer av dokument – fullmakter, intyg, kopior och mer. Från 595 kr inkl. moms.",
          "areaServed": [
            { "@type": "Country", "name": "Sweden" },
            { "@type": "Country", "name": "Norway" },
            { "@type": "Country", "name": "Denmark" },
            { "@type": "Country", "name": "Finland" }
          ],
          "serviceType": "Notarization",
          "category": "Dokumentlegalisering",
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Notariseringstjänster",
            "itemListElement": [
              { "@type": "Offer", "name": "Notarisering – Standard", "price": "595", "priceCurrency": "SEK", "availability": "https://schema.org/InStock", "priceValidUntil": "2027-12-31" }
            ]
          }
        })}} />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Hem", "item": "https://doxvl.se" },
            { "@type": "ListItem", "position": 2, "name": "Tjänster", "item": "https://doxvl.se/tjanster" },
            { "@type": "ListItem", "position": 3, "name": "Notarius Publicus", "item": "https://doxvl.se/tjanster/notarius-publicus" }
          ]
        })}} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Vad är Notarius Publicus?",
              "acceptedAnswer": { "@type": "Answer", "text": "Notarius Publicus är en av staten förordnad tjänsteman som har behörighet att bestyrka handlingar, bevittna underskrifter och utfärda apostille. I Sverige utses Notarius Publicus av länsstyrelsen. Notarisering är ofta ett nödvändigt första steg innan apostille eller ambassadlegalisering." }
            },
            {
              "@type": "Question",
              "name": "När behöver jag notarisering?",
              "acceptedAnswer": { "@type": "Answer", "text": "Notarisering behövs ofta för: fullmakter som ska användas utomlands, bestyrkta kopior av pass eller ID-handlingar, intyg och avtal för internationellt bruk, dokument som ska apostille-stämplas, och handlingar inför ambassadlegalisering." }
            },
            {
              "@type": "Question",
              "name": "Vad kostar notarisering?",
              "acceptedAnswer": { "@type": "Answer", "text": "Notarisering hos DOX Visumpartner kostar från 595 kr inklusive moms. Priset varierar beroende på dokumenttyp och komplexitet. Vi erbjuder fasta priser utan dolda avgifter." }
            },
            {
              "@type": "Question",
              "name": "Hur lång tid tar notarisering?",
              "acceptedAnswer": { "@type": "Answer", "text": "Notarisering tar vanligtvis 3-5 arbetsdagar med standardtjänst. Vi erbjuder även expresstjänst med 1-2 dagars handläggning för brådskande ärenden." }
            },
            {
              "@type": "Question",
              "name": "Kan jag beställa notarisering online?",
              "acceptedAnswer": { "@type": "Answer", "text": "Ja, beställ notarisering enkelt online via doxvl.se. Skicka in ditt dokument per post och vi hanterar hela processen med Notarius Publicus åt dig. Vi betjänar kunder i hela Sverige samt Norge, Danmark och Finland." }
            },
            {
              "@type": "Question",
              "name": "Vad är skillnaden mellan notarisering och apostille?",
              "acceptedAnswer": { "@type": "Answer", "text": "Notarisering innebär att Notarius Publicus bestyrker ett dokument eller bevittnar en underskrift. Apostille är en internationell stämpel som bekräftar notariseringens äkthet. Ofta behövs notarisering som ett första steg innan apostille kan utfärdas." }
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

        {/* What is Notarius Publicus Section */}
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

        {/* Process Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              {t(`${sp}.chainTitle`)}
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {(t(`${sp}.chainSteps`, { returnObjects: true }) as Array<{title: string; desc: string}>).map((item, idx) => (
                <div key={idx} className={`p-6 rounded-lg text-center ${idx === 0 ? 'bg-custom-button text-white' : 'bg-white shadow-sm'}`}>
                  <div className={`w-12 h-12 ${idx === 0 ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'} font-bold text-xl rounded-full flex items-center justify-center mx-auto mb-4`}>
                    {idx + 1}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className={`text-sm ${idx === 0 ? 'text-black/80' : 'text-gray-600'}`}>{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-gray-600 mt-8">
              {t(`${sp}.chainNote`)}
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              {t(`${sp}.faqTitle`)}
            </h2>
            <div className="space-y-4">
              {(t(`${sp}.faqs`, { returnObjects: true }) as Array<{q: string; a: string}>).map((faq, idx) => (
                <div key={idx} className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
                  <p className="text-gray-600">{faq.a}</p>
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
              Notarisering är ofta första steget. Vi erbjuder hela legaliseringskedjan.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <Link href="/tjanster/apostille" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-teal-300 transition-all group">
                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">Apostille</h3>
                <p className="text-gray-600 text-sm">Nästa steg efter notarisering – internationell stämpel för Haagkonventionsländer.</p>
              </Link>
              <Link href="/tjanster/utrikesdepartementet" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-teal-300 transition-all group">
                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">UD-legalisering</h3>
                <p className="text-gray-600 text-sm">Legalisering via Utrikesdepartementet – nästa steg för länder utanför Haagkonventionen.</p>
              </Link>
              <Link href="/tjanster/ambassadlegalisering" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-teal-300 transition-all group">
                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">Ambassadlegalisering</h3>
                <p className="text-gray-600 text-sm">Sista steget – legalisering via utländska ambassader i Stockholm.</p>
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
