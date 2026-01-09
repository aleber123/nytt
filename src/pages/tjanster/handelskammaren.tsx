import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';



export default function HandelskammarenPage() {
  const { t } = useTranslation('common');
  const sp = 'servicePages.handelskammaren';

  return (
    <>
      <Head>
        <title>{t(`${sp}.title`)} | DOX Visumpartner</title>
        <meta name="description" content={t(`${sp}.metaDescription`)} />
        <meta name="keywords" content="handelskammaren, ursprungsintyg, certificate of origin, exportdokument, legalisering, internationell handel" />
        <link rel="canonical" href="https://www.doxvl.se/tjanster/handelskammaren" />
        
        <meta property="og:title" content={`${t(`${sp}.title`)} | DOX Visumpartner`} />
        <meta property="og:description" content={t(`${sp}.metaDescription`)} />
        <meta property="og:url" content="https://www.doxvl.se/tjanster/handelskammaren" />
        <meta property="og:type" content="website" />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Legalisering hos Handelskammaren",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB",
            "telephone": "+46-8-40941900",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Box 38",
              "postalCode": "121 25",
              "addressLocality": "Stockholm-Globen",
              "addressCountry": "SE"
            }
          },
          "description": "Certifiering av kommersiella dokument för internationell handel hos Handelskammaren. Ursprungsintyg, fakturor och exportdokument.",
          "areaServed": "SE",
          "serviceType": "Document Certification",
          "offers": {
            "@type": "Offer",
            "price": "2250",
            "priceCurrency": "SEK",
            "priceValidUntil": "2026-12-31"
          }
        })}} />
        
        {/* FAQ Schema for SEO */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Vad är Handelskammaren?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Handelskammaren (Chamber of Commerce) är en organisation som certifierar och legaliserar kommersiella dokument för internationell handel. Deras stämpel bekräftar att dokumenten är äkta och utfärdade av ett svenskt företag."
              }
            },
            {
              "@type": "Question",
              "name": "Vilka dokument kan Handelskammaren certifiera?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Handelskammaren certifierar ursprungsintyg (Certificate of Origin), kommersiella fakturor, fraktdokument, packlista, försäkringscertifikat, hälso- och kvalitetsintyg samt agentavtal och distributörsavtal."
              }
            },
            {
              "@type": "Question",
              "name": "Vilka länder kräver Handelskammar-certifiering?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Många länder i Mellanöstern kräver Handelskammar-certifiering, inklusive Saudiarabien, Förenade Arabemiraten (UAE), Qatar, Kuwait, Bahrain, Oman, Egypten och Jordanien."
              }
            },
            {
              "@type": "Question",
              "name": "Vad kostar legalisering hos Handelskammaren?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Priset varierar beroende på dokumenttyp och antal dokument. Kontakta oss för en exakt offert."
              }
            },
            {
              "@type": "Question",
              "name": "Hur lång tid tar Handelskammar-certifiering?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Handelskammar-certifiering tar normalt 2-5 arbetsdagar. Vi erbjuder även expresstjänster för brådskande ärenden."
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

        {/* What is Handelskammaren Section */}
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
