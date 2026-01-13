import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';

export default function OversattningPage() {
  const { t } = useTranslation('common');
  const sp = 'servicePages.oversattning';

  return (
    <>
      <Head>
        <title>{t(`${sp}.title`)} | DOX Visumpartner</title>
        <meta name="description" content={t(`${sp}.metaDescription`)} />
        <meta name="keywords" content="auktoriserad översättning, certified translation, officiell översättning, Kammarkollegiet, translator, dokument översättning" />
        <link rel="canonical" href="https://www.doxvl.se/tjanster/oversattning" />
        
        <meta property="og:title" content={`${t(`${sp}.title`)} | DOX Visumpartner`} />
        <meta property="og:description" content={t(`${sp}.metaDescription`)} />
        <meta property="og:url" content="https://www.doxvl.se/tjanster/oversattning" />
        <meta property="og:type" content="website" />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Auktoriserad översättning",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB",
            "url": "https://www.doxvl.se",
            "logo": "https://www.doxvl.se/dox-logo.webp"
          },
          "description": "Auktoriserad översättning av dokument för internationellt bruk. Certifierade översättare godkända av Kammarkollegiet.",
          "areaServed": {
            "@type": "Country",
            "name": "Sweden"
          },
          "serviceType": "Certified Translation",
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "bestRating": "5",
            "ratingCount": "1200"
          }
        })}} />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Vad är auktoriserad översättning?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "En auktoriserad översättning är utförd av en översättare som är godkänd av Kammarkollegiet. Översättningen har samma juridiska giltighet som originaldokumentet."
              }
            },
            {
              "@type": "Question",
              "name": "Vilka språk erbjuder ni översättning till?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Vi erbjuder auktoriserad översättning till och från de flesta språk, inklusive engelska, tyska, franska, spanska, arabiska, kinesiska, ryska och många fler."
              }
            },
            {
              "@type": "Question",
              "name": "Hur lång tid tar en auktoriserad översättning?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Leveranstiden beror på dokumentets längd och komplexitet. Vanligtvis 3-5 arbetsdagar för standarddokument. Expresstjänst finns tillgänglig."
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

        {/* What is Section */}
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
              {t(`${sp}.processTitle`)}
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {(t(`${sp}.processSteps`, { returnObjects: true }) as Array<{title: string; desc: string}>).map((item, idx) => (
                <div key={idx} className={`p-6 rounded-lg text-center ${idx === 1 ? 'bg-custom-button text-white' : 'bg-white shadow-sm'}`}>
                  <div className={`w-12 h-12 ${idx === 1 ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'} font-bold text-xl rounded-full flex items-center justify-center mx-auto mb-4`}>
                    {idx + 1}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className={`text-sm ${idx === 1 ? 'text-black/80' : 'text-gray-600'}`}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Languages Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 text-center">
              {t(`${sp}.languagesTitle`)}
            </h2>
            <p className="text-gray-600 text-center mb-8">
              {t(`${sp}.languagesText`)}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
              {(t(`${sp}.languages`, { returnObjects: true }) as string[]).map((lang, idx) => (
                <div key={idx} className="bg-gray-50 p-3 rounded-lg text-center text-gray-700">
                  {lang}
                </div>
              ))}
            </div>
            <p className="text-gray-500 text-center text-sm">
              {t(`${sp}.languagesNote`)}
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
