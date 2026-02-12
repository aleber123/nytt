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
        <title>{t(`${sp}.title`)} | DOX Visumpartner – Auktoriserad Översättning Sverige</title>
        <meta name="description" content={t(`${sp}.metaDescription`)} />
        <meta name="keywords" content="auktoriserad översättning, certified translation, officiell översättning, Kammarkollegiet, auktoriserad översättare, översätta dokument, översättning födelsebevis, översättning examensbevis, översättning vigselbevis, översättning fullmakt, översättning engelska, översättning arabiska, översättning pris, översättning Stockholm, juridisk översättning, edsvuren översättare, översättning för legalisering, översättning intyg, dokument översättning online" />
        <link rel="canonical" href="https://doxvl.se/tjanster/oversattning" />
        <link rel="alternate" hrefLang="sv" href="https://doxvl.se/tjanster/oversattning" />
        <link rel="alternate" hrefLang="en" href="https://doxvl.se/en/tjanster/oversattning" />
        <link rel="alternate" hrefLang="x-default" href="https://doxvl.se/tjanster/oversattning" />
        
        <meta property="og:title" content={`${t(`${sp}.title`)} | DOX Visumpartner`} />
        <meta property="og:description" content={t(`${sp}.metaDescription`)} />
        <meta property="og:url" content="https://doxvl.se/tjanster/oversattning" />
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
          "name": "Auktoriserad översättning – Certifierad dokumentöversättning i Sverige",
          "alternateName": "Certified Translation Sweden",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB",
            "url": "https://doxvl.se",
            "logo": "https://doxvl.se/dox-logo.webp",
            "telephone": "+46840941900",
            "email": "info@doxvl.se",
            "address": { "@type": "PostalAddress", "streetAddress": "Livdjursgatan 4", "addressLocality": "Stockholm", "postalCode": "121 62", "addressCountry": "SE" }
          },
          "description": "Auktoriserad översättning av dokument för internationellt bruk. Våra översättare är godkända av Kammarkollegiet och översättningarna har juridisk giltighet. Vi översätter födelsebevis, examensbevis, vigselbevis, fullmakter och alla typer av officiella dokument.",
          "areaServed": [
            { "@type": "Country", "name": "Sweden" },
            { "@type": "Country", "name": "Norway" },
            { "@type": "Country", "name": "Denmark" },
            { "@type": "Country", "name": "Finland" }
          ],
          "serviceType": "Certified Translation",
          "category": "Dokumentöversättning"
        })}} />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Hem", "item": "https://doxvl.se" },
            { "@type": "ListItem", "position": 2, "name": "Tjänster", "item": "https://doxvl.se/tjanster" },
            { "@type": "ListItem", "position": 3, "name": "Auktoriserad översättning", "item": "https://doxvl.se/tjanster/oversattning" }
          ]
        })}} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Vad är auktoriserad översättning?",
              "acceptedAnswer": { "@type": "Answer", "text": "En auktoriserad översättning är utförd av en översättare som är godkänd av Kammarkollegiet i Sverige. Översättningen har samma juridiska giltighet som originaldokumentet och accepteras av myndigheter, ambassader och domstolar världen över." }
            },
            {
              "@type": "Question",
              "name": "Vilka språk erbjuder ni översättning till?",
              "acceptedAnswer": { "@type": "Answer", "text": "Vi erbjuder auktoriserad översättning till och från de flesta språk, inklusive engelska, tyska, franska, spanska, arabiska, kinesiska, ryska, persiska, turkiska, polska, finska, norska, danska och många fler." }
            },
            {
              "@type": "Question",
              "name": "Hur lång tid tar en auktoriserad översättning?",
              "acceptedAnswer": { "@type": "Answer", "text": "Leveranstiden beror på dokumentets längd och komplexitet. Vanligtvis 3-5 arbetsdagar för standarddokument som födelsebevis eller examensbevis. Expresstjänst med 1-2 dagars leverans finns tillgänglig." }
            },
            {
              "@type": "Question",
              "name": "Vilka dokument kan ni översätta?",
              "acceptedAnswer": { "@type": "Answer", "text": "Vi översätter alla typer av officiella dokument: födelsebevis, vigselbevis, dödsbevis, examensbevis, gymnasiebevis, universitetsbevis, körkort, pass, fullmakter, bolagshandlingar, domstolshandlingar, medicinska intyg och avtal." }
            },
            {
              "@type": "Question",
              "name": "Behöver jag auktoriserad översättning för legalisering?",
              "acceptedAnswer": { "@type": "Answer", "text": "Ja, i de flesta fall krävs auktoriserad översättning när dokument ska legaliseras för användning utomlands. Vi kan hantera både översättning och legalisering (apostille eller ambassadlegalisering) som en komplett tjänst." }
            },
            {
              "@type": "Question",
              "name": "Kan jag beställa auktoriserad översättning online?",
              "acceptedAnswer": { "@type": "Answer", "text": "Ja, beställ enkelt online via doxvl.se. Ladda upp eller skicka in ditt dokument, välj målspråk, och vi levererar en auktoriserad översättning. Vi betjänar kunder i hela Norden." }
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

        {/* Related Services - Internal Linking */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 text-center">
              Relaterade tjänster
            </h2>
            <p className="text-gray-600 text-center mb-8">
              Behöver du legalisera ditt översatta dokument? Vi erbjuder hela kedjan.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <Link href="/tjanster/apostille" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-teal-300 transition-all group">
                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">Apostille</h3>
                <p className="text-gray-600 text-sm">Apostille-stämpel för översatta dokument som ska användas i Haagkonventionsländer.</p>
              </Link>
              <Link href="/tjanster/notarius-publicus" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-teal-300 transition-all group">
                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">Notarius Publicus</h3>
                <p className="text-gray-600 text-sm">Bestyrkning av översatta dokument via Notarius Publicus.</p>
              </Link>
              <Link href="/tjanster/ambassadlegalisering" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-teal-300 transition-all group">
                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">Ambassadlegalisering</h3>
                <p className="text-gray-600 text-sm">Legalisering av översatta dokument via utländska ambassader.</p>
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
