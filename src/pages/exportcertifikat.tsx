import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';

export default function ExportcertifikatLandingPage() {
  const { t } = useTranslation('common');

  const docs = t('servicePages.exportcertifikat.docs', { returnObjects: true }) as { title: string; desc: string }[];
  const processSteps = t('servicePages.exportcertifikat.processSteps', { returnObjects: true }) as { title: string; desc: string }[];
  const mahPros = t('servicePages.exportcertifikat.mahPros', { returnObjects: true }) as string[];
  const repPros = t('servicePages.exportcertifikat.repPros', { returnObjects: true }) as string[];
  const pricingTiers = t('servicePages.exportcertifikat.pricingTiers', { returnObjects: true }) as { name: string; desc: string; features: string[] }[];
  const whenCards = t('servicePages.exportcertifikat.whenCards', { returnObjects: true }) as { icon: string; title: string; text: string }[];
  const countriesRegion1List = t('servicePages.exportcertifikat.countriesRegion1List', { returnObjects: true }) as { flag: string; name: string }[];
  const countriesRegion2List = t('servicePages.exportcertifikat.countriesRegion2List', { returnObjects: true }) as { flag: string; name: string }[];
  const faqs = t('servicePages.exportcertifikat.faqs', { returnObjects: true }) as { q: string; a: string }[];
  const relatedServices = t('servicePages.exportcertifikat.relatedServices', { returnObjects: true }) as { title: string; desc: string; href: string }[];

  return (
    <>
      <Head>
        <title>{t('servicePages.exportcertifikat.metaTitle')}</title>
        <meta name="description" content={t('servicePages.exportcertifikat.metaDescription')} />
        <meta name="keywords" content="exportcertifikat, CPP, certificate of pharmaceutical product, läkemedelsverket, läkemedel export, pharma export, WHO certifikat, MAH, marketing authorisation holder" />
        
        <meta property="og:title" content={t('servicePages.exportcertifikat.metaTitle')} />
        <meta property="og:description" content={t('servicePages.exportcertifikat.metaDescription')} />
        <meta property="og:url" content="https://doxvl.se/exportcertifikat" />
        <meta property="og:type" content="website" />
        
        <link rel="canonical" href="https://doxvl.se/exportcertifikat" />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Exportcertifikat för läkemedel (CPP)",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB",
            "telephone": "+46-8-40941900",
            "url": "https://doxvl.se",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Box 38",
              "postalCode": "121 25",
              "addressLocality": "Stockholm-Globen",
              "addressCountry": "SE"
            }
          },
          "description": t('servicePages.exportcertifikat.metaDescription'),
          "areaServed": "SE",
          "serviceType": "Certificate of Pharmaceutical Product",
          "offers": {
            "@type": "AggregateOffer",
            "lowPrice": "3000",
            "highPrice": "6000",
            "priceCurrency": "SEK",
            "priceValidUntil": "2026-12-31"
          }
        })}} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": Array.isArray(faqs) ? faqs.map(faq => ({
            "@type": "Question",
            "name": faq.q,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.a
            }
          })) : []
        })}} />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#2E2D2C] to-[#1a1918] text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="max-w-3xl">
              <span className="inline-block bg-[#D4AF37] text-black text-sm font-semibold px-3 py-1 rounded-full mb-4">
                {t('servicePages.exportcertifikat.heroTag')}
              </span>
              <h1 className="text-3xl md:text-5xl font-bold mb-6">
                {t('servicePages.exportcertifikat.title')}
              </h1>
              <p className="text-xl text-gray-300 mb-4">
                {t('servicePages.exportcertifikat.heroText')}
              </p>
              <p className="text-lg text-gray-400 mb-8">
                {t('servicePages.exportcertifikat.heroChecks')}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/kontakt" className="bg-[#D4AF37] hover:bg-[#C4A030] text-black font-semibold px-8 py-4 rounded-lg transition-colors">
                  {t('servicePages.exportcertifikat.orderNow')}
                </Link>
                <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-black text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                  {t('servicePages.exportcertifikat.contactUs')}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* What is CPP Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              {t('servicePages.exportcertifikat.whatTitle')}
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-700 mb-4">{t('servicePages.exportcertifikat.whatText1')}</p>
                <p className="text-gray-700 mb-4">{t('servicePages.exportcertifikat.whatText2')}</p>
                <p className="text-gray-700 mb-4">{t('servicePages.exportcertifikat.whatText3')}</p>
                <p className="text-gray-700">{t('servicePages.exportcertifikat.whatText4')}</p>
              </div>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">{t('servicePages.exportcertifikat.docsTitle')}</h3>
                <ul className="space-y-3 text-gray-700">
                  {Array.isArray(docs) && docs.map((doc, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-green-500 mr-2 mt-0.5">✓</span>
                      <div>
                        <strong>{doc.title}</strong>
                        <p className="text-sm text-gray-500">{doc.desc}</p>
                      </div>
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
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 text-center">
              {t('servicePages.exportcertifikat.processTitle')}
            </h2>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
              {t('servicePages.exportcertifikat.processSubtitle')}
            </p>
            <div className="grid md:grid-cols-4 gap-6">
              {Array.isArray(processSteps) && processSteps.map((step, i) => (
                <div key={i} className="text-center bg-white p-6 rounded-lg shadow-sm">
                  <div className="w-12 h-12 bg-[#D4AF37] text-black rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">{i + 1}</div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who can apply – MAH vs Representative */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 text-center">
              {t('servicePages.exportcertifikat.whoTitle')}
            </h2>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
              {t('servicePages.exportcertifikat.whoSubtitle')}
            </p>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-8">
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-3">🏢</span>
                  <h3 className="text-xl font-bold">{t('servicePages.exportcertifikat.mahTitle')}</h3>
                </div>
                <p className="text-gray-600 mb-4">{t('servicePages.exportcertifikat.mahDesc')}</p>
                <ul className="space-y-2 text-gray-700 mb-6">
                  {Array.isArray(mahPros) && mahPros.map((pro, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      {pro}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-gray-500">{t('servicePages.exportcertifikat.mahNote')}</p>
              </div>
              <div className="bg-[#FFF9E6] border-2 border-[#D4AF37] rounded-lg p-8 relative">
                <span className="absolute -top-3 right-4 bg-[#D4AF37] text-black text-xs font-bold px-3 py-1 rounded-full">
                  {t('servicePages.exportcertifikat.repBadge')}
                </span>
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-3">🤝</span>
                  <h3 className="text-xl font-bold">{t('servicePages.exportcertifikat.repTitle')}</h3>
                </div>
                <p className="text-gray-600 mb-4">{t('servicePages.exportcertifikat.repDesc')}</p>
                <ul className="space-y-2 text-gray-700 mb-6">
                  {Array.isArray(repPros) && repPros.map((pro, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      {pro}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-gray-500">{t('servicePages.exportcertifikat.repNote')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 text-center">
              {t('servicePages.exportcertifikat.pricingTitle')}
            </h2>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
              {t('servicePages.exportcertifikat.pricingSubtitle')}
            </p>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {Array.isArray(pricingTiers) && pricingTiers.map((tier, i) => (
                <div key={i} className={`bg-white rounded-lg overflow-hidden ${i === 1 ? 'shadow-md border-2 border-[#D4AF37] relative' : 'shadow-sm border border-gray-200'}`}>
                  {i === 1 && (
                    <span className="absolute -top-0 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-black text-xs font-bold px-4 py-1 rounded-b-lg">
                      {t('servicePages.exportcertifikat.recommended')}
                    </span>
                  )}
                  <div className={`p-6 border-b ${i === 1 ? 'bg-[#FFF9E6]' : 'bg-gray-50'}`}>
                    <h3 className="font-bold text-lg">{tier.name}</h3>
                    <p className="text-gray-500 text-sm mt-1">{tier.desc}</p>
                  </div>
                  <div className="p-6">
                    <div className="text-3xl font-bold text-[#2E2D2C] mb-4">{t('servicePages.exportcertifikat.contactUs')}</div>
                    <ul className="text-sm text-gray-600 space-y-2 mb-6">
                      {tier.features.map((feature, j) => (
                        <li key={j} className="flex items-start"><span className="text-green-500 mr-2">✓</span>{feature}</li>
                      ))}
                    </ul>
                    <Link href="/kontakt" className={`block text-center font-medium px-6 py-3 rounded-lg transition-colors ${i === 1 ? 'bg-[#D4AF37] hover:bg-[#C4A030] text-black font-semibold' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}>
                      {t('servicePages.exportcertifikat.requestQuote')}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-gray-500 text-sm mt-6">
              {t('servicePages.exportcertifikat.pricingDisclaimer')}
            </p>
          </div>
        </section>

        {/* When do you need CPP */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 text-center">
              {t('servicePages.exportcertifikat.whenTitle')}
            </h2>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
              {t('servicePages.exportcertifikat.whenSubtitle')}
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {Array.isArray(whenCards) && whenCards.map((card, i) => (
                <div key={i} className="bg-gray-50 p-6 rounded-lg">
                  <span className="text-3xl mb-3 block">{card.icon}</span>
                  <h3 className="font-semibold text-lg mb-2">{card.title}</h3>
                  <p className="text-gray-600 text-sm">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Countries Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 text-center">
              {t('servicePages.exportcertifikat.countriesTitle')}
            </h2>
            <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
              {t('servicePages.exportcertifikat.countriesSubtitle')}
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-lg mb-4">{t('servicePages.exportcertifikat.countriesRegion1')}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Array.isArray(countriesRegion1List) && countriesRegion1List.map((country) => (
                    <div key={country.name} className="bg-white p-3 rounded-lg flex items-center gap-2">
                      <span className="text-xl">{country.flag}</span>
                      <span className="text-sm font-medium">{country.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-4">{t('servicePages.exportcertifikat.countriesRegion2')}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Array.isArray(countriesRegion2List) && countriesRegion2List.map((country) => (
                    <div key={country.name} className="bg-white p-3 rounded-lg flex items-center gap-2">
                      <span className="text-xl">{country.flag}</span>
                      <span className="text-sm font-medium">{country.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              {t('servicePages.exportcertifikat.faqTitle')}
            </h2>
            <div className="space-y-6 max-w-3xl mx-auto">
              {Array.isArray(faqs) && faqs.map((faq, i) => (
                <div key={i} className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
                  <p className="text-gray-700">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Related Services */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              {t('servicePages.exportcertifikat.relatedTitle')}
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {Array.isArray(relatedServices) && relatedServices.map((service, i) => (
                <Link key={i} href={service.href} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-lg mb-2">{service.title}</h3>
                  <p className="text-gray-600 text-sm">{service.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[#2E2D2C] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {t('servicePages.exportcertifikat.ctaTitle')}
            </h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              {t('servicePages.exportcertifikat.ctaText')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/kontakt" className="bg-[#D4AF37] hover:bg-[#C4A030] text-black font-semibold px-8 py-4 rounded-lg transition-colors">
                {t('servicePages.exportcertifikat.orderNow')}
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-black text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                {t('servicePages.exportcertifikat.contactUs')}
              </Link>
            </div>
            <p className="text-gray-400 text-sm mt-6">
              {t('servicePages.exportcertifikat.ctaPhone')} &nbsp; | &nbsp; {t('servicePages.exportcertifikat.ctaEmail')}
            </p>
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
