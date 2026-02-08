import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';
import CountryFlag from '@/components/ui/CountryFlag';

export default function KuwaitFinlandPage() {
  const embassyInfo = {
    name: 'Kuwaitin suurlähetystö Tukholmassa',
    address: 'Box 7279',
    postalCode: '103 89 Stockholm, Ruotsi',
    phone: '+46 8 679 70 00',
    email: 'info@kuwaitembassy.se',
    website: 'https://kuwaitembassy.se',
    openingHours: 'Maanantai-Perjantai 09:00-16:00, Konsulaatti: 09:00-13:00'
  };

  const content = {
    title: 'Asiakirjojen laillistaminen Kuwaitin suurlähetystössä',
    subtitle: 'Embassy of Kuwait Tukholmassa – Ammattimainen laillistamispalvelu Suomelle',
    heroText: 'Tarvitsetko asiakirjojen laillistamista Embassy of Kuwait -suurlähetystössä Tukholmassa? Tarjoamme täydellisen laillistamispalvelun suomalaisille asiakkaille – notarisoinnista suurlähetystön leimaan. Nopeasti, luotettavasti ja vaivattomasti.',
    orderBtn: 'Tilaa suurlähetystölaillistaminen',
    contactBtn: 'Ota yhteyttä',
    whyTitle: 'Miksi tarvitset Embassy of Kuwait -suurlähetystön laillistamaan asiakirjasi?',
    whyText1: 'Embassy of Kuwait Tukholmassa on ainoa viranomainen, joka voi laillistaa pohjoismaisia asiakirjoja käytettäväksi Kuwaitissa. Tämä suurlähetystölaillistaminen on pakollinen työlupiin, yrityksen perustamiseen, koulutukseen ja perheasioihin Kuwaitissa.',
    whyText2: 'Embassy of Kuwait on sijainnut Tukholmassa vuodesta 1994 ja palvelee kaikkia Pohjoismaita, mukaan lukien Suomea. Meillä on vakiintuneet suhteet suurlähetystöön ja tunnemme heidän tarkat vaatimuksensa ja menettelynsä asiakirjojen laillistamisessa.',
    whyText3: 'Tiimimme vierailee Embassy of Kuwait -suurlähetystössä säännöllisesti ja voi varmistaa, että asiakirjasi käsitellään oikein ensimmäisellä kerralla. Hoidamme kaiken alusta loppuun.',
    commonDocsTitle: 'Asiakirjat, jotka laillistamme Embassy of Kuwait -suurlähetystössä:',
    docs: [
      'Tutkintotodistukset ja koulutussertifikaatit Kuwaitia varten',
      'Työtodistukset ja CV Kuwait-työviisumia varten',
      'Syntymätodistukset ja henkilöasiakirjat',
      'Vihkitodistukset ja avioerotuomiot',
      'Yhtiöasiakirjat, valtakirjat ja sopimukset',
      'Lääkärintodistukset ja terveysasiakirjat'
    ],
    processTitle: 'Embassy of Kuwait laillistamisprosessi',
    steps: [
      { step: '1', title: 'Julkinen notaari', desc: 'Asiakirjat notarisoidaan suomalaisella tai ruotsalaisella julkisella notaarilla.' },
      { step: '2', title: 'Ulkoministeriö', desc: 'UM vahvistaa asiakirjan aitouden.' },
      { step: '3', title: 'Embassy of Kuwait', desc: 'Lopullinen laillistaminen Embassy of Kuwait -suurlähetystössä Tukholmassa.' },
      { step: '4', title: 'Toimitus', desc: 'Laillistetut asiakirjat lähetetään sinulle Suomeen.' },
    ],
    embassyTitle: 'Embassy of Kuwait Tukholmassa – Yhteystiedot',
    contactTitle: 'Embassy of Kuwait osoite',
    postalLabel: 'Postiosoite:',
    phoneLabel: 'Puhelin:',
    websiteLabel: 'Verkkosivusto:',
    hoursLabel: 'Aukioloajat:',
    weHandleTitle: 'Hoidamme Embassy of Kuwait -laillistamisesi',
    weHandleText: 'Sinun ei tarvitse vierailla Embassy of Kuwait -suurlähetystössä itse. Hoidamme kaiken yhteydenpidon suurlähetystöön ja varmistamme, että asiakirjasi laillistetaan oikein Kuwaitin vaatimusten mukaisesti.',
    weHandleItems: [
      'Toimitamme asiakirjasi Embassy of Kuwait -suurlähetystöön',
      'Noudamme ne, kun laillistaminen on valmis',
      'Lähetämme ne sinulle minne tahansa Suomessa'
    ],
    orderNow: 'Tilaa suurlähetystölaillistaminen',
    ctaTitle: 'Valmis laillistamaan asiakirjasi Embassy of Kuwait -suurlähetystössä?',
    ctaText: 'Olemme auttaneet satoja suomalaisia asiakkaita Embassy of Kuwait -laillistamisessa. Tilaa verkossa tai ota yhteyttä asiantuntijaneuvontaa varten.',
    nordicAdvantage: 'Etu suomalaisille asiakkaille',
    nordicAdvantageText: 'Suomalaisena asiakkaana saat saman ammattimaisen palvelun kuin ruotsalaiset asiakkaamme. Embassy of Kuwait Tukholmassa palvelee koko Pohjolaa, ja huolehdimme nopeasta ja turvallisesta toimituksesta Suomeen.',
    nordicItems: [
      'Ilmainen toimitus Suomeen',
      'Palvelu suomeksi',
      'Kokemus suomalaisista asiakirjoista',
      'Nopea käsittelyaika'
    ],
    faqTitle: 'Usein kysytyt kysymykset Embassy of Kuwait -laillistamisesta',
    faqs: [
      {
        question: 'Miten laillistaa asiakirjat Embassy of Kuwait -suurlähetystössä Tukholmassa?',
        answer: 'Asiakirjojen laillistamiseksi Embassy of Kuwait -suurlähetystössä sinun on ensin notarisoitava ne suomalaisella tai ruotsalaisella julkisella notaarilla, sitten todennettava ne ulkoministeriössä ja lopuksi laillistettava ne Embassy of Kuwait -suurlähetystössä Tukholmassa. DOX Visumpartner hoitaa koko tämän prosessin puolestasi.'
      },
      {
        question: 'Kuinka kauan Embassy of Kuwait -laillistaminen kestää?',
        answer: 'Täydellinen laillistamisprosessi Embassy of Kuwait -suurlähetystössä kestää tyypillisesti 5-10 arkipäivää, riippuen asiakirjatyypistä ja suurlähetystön nykyisistä käsittelyajoista. Tarjoamme pikapalvelua kiireellisiin tapauksiin.'
      },
      {
        question: 'Mitä asiakirjoja voidaan laillistaa Embassy of Kuwait -suurlähetystössä?',
        answer: 'Embassy of Kuwait Tukholmassa voi laillistaa useimmat pohjoismaiset asiakirjat, mukaan lukien tutkintotodistukset, syntymätodistukset, vihkitodistukset, työtodistukset, yhtiöasiakirjat, valtakirjat ja lääkärintodistukset.'
      },
      {
        question: 'Missä Embassy of Kuwait sijaitsee?',
        answer: 'Embassy of Kuwait sijaitsee osoitteessa Box 7279, 103 89 Stockholm, Ruotsi. Suurlähetystö käsittelee laillistamisia kaikille Pohjoismaille, mukaan lukien Suomi, Ruotsi ja Tanska.'
      },
      {
        question: 'Paljonko Embassy of Kuwait -laillistaminen maksaa?',
        answer: 'Hinta riippuu asiakirjatyypistä ja tarvittavista palveluista. Ota yhteyttä DOX Visumpartneriin saadaksesi ilmaisen tarjouksen. Tarjoamme kiinteät hinnat ilman piilokustannuksia täydelliselle Embassy of Kuwait -laillistamispalvelulle.'
      },
      {
        question: 'Pitääkö minun vierailla Embassy of Kuwait -suurlähetystössä itse?',
        answer: 'Ei, sinun ei tarvitse vierailla Embassy of Kuwait -suurlähetystössä itse. DOX Visumpartner hoitaa kaikki suurlähetystövierailut, asiakirjojen jättämisen ja noudon puolestasi. Toimitamme laillistetut asiakirjat suoraan sinulle Suomeen.'
      }
    ]
  };

  // FAQ Schema for AEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": content.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <>
      <Head>
        <title>Embassy of Kuwait Laillistaminen Suomi | Asiakirjojen todentaminen Tukholma | DOX</title>
        <meta name="description" content="Ammattimainen asiakirjojen laillistaminen Embassy of Kuwait -suurlähetystössä Tukholmassa suomalaisille asiakkaille. Täydellinen palvelu sis. notarisointi, UM-vahvistus ja suurlähetystöleima. Nopea käsittely, kiinteät hinnat." />
        <meta name="keywords" content="Embassy of Kuwait, Kuwaitin suurlähetystö Suomi, laillistaminen Kuwait Suomi, Kuwait todentaminen, suurlähetystölaillistaminen Kuwait, laillistaa asiakirjat Kuwait, Kuwait työviisumi asiakirjat, Kuwaitin suurlähetystö Tukholma, Kuwait embassy Finland" />
        
        <meta property="og:title" content="Embassy of Kuwait Laillistaminen Suomi | DOX Visumpartner" />
        <meta property="og:description" content="Ammattimainen Embassy of Kuwait -laillistamispalvelu Tukholmassa suomalaisille asiakkaille. Hoidamme koko prosessin puolestasi." />
        <meta property="og:url" content="https://doxvl.se/legalisering/kuwait-finland" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="fi_FI" />
        <meta property="og:site_name" content="DOX Visumpartner" />
        <meta property="og:image" content="https://doxvl.se/dox-logo-new.png" />
        <meta name="twitter:card" content="summary" />
        
        <link rel="canonical" href="https://doxvl.se/legalisering/kuwait-finland" />
        
        <link rel="alternate" hrefLang="sv" href="https://doxvl.se/legalisering/kuwait" />
        <link rel="alternate" hrefLang="en" href="https://doxvl.se/en/legalisering/kuwait" />
        <link rel="alternate" hrefLang="fi" href="https://doxvl.se/legalisering/kuwait-finland" />
        <link rel="alternate" hrefLang="da" href="https://doxvl.se/legalisering/kuwait-danmark" />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Embassy of Kuwait Asiakirjojen laillistaminen Suomelle",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB"
          },
          "description": "Ammattimainen asiakirjojen laillistamispalvelu Embassy of Kuwait -suurlähetystössä Tukholmassa suomalaisille asiakkaille",
          "areaServed": ["FI", "KW"],
          "serviceType": "Document Legalization"
        })}} />
        
        {/* FAQ Schema for AEO */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#007A3D] to-[#005a2d] text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-2 mb-4">
              <CountryFlag code="FI" size={32} />
              <span className="text-white/80 text-sm">Palvelu suomalaisille asiakkaille</span>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <CountryFlag code="KW" size={64} />
              <div>
                <h1 className="text-3xl md:text-5xl font-bold">
                  {content.title}
                </h1>
                <p className="text-xl text-white/80">{content.subtitle}</p>
              </div>
            </div>
            <p className="text-xl text-white/90 mb-8 max-w-2xl">
              {content.heroText}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/bestall" className="bg-white hover:bg-gray-100 text-[#007A3D] font-semibold px-8 py-4 rounded-lg transition-colors">
                {content.orderBtn}
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-[#007A3D] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                {content.contactBtn}
              </Link>
            </div>
          </div>
        </section>

        {/* Nordic Advantage Banner */}
        <section className="bg-blue-900 text-white py-8">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-4">
              <CountryFlag code="FI" size={40} />
              <h2 className="text-xl font-bold">{content.nordicAdvantage}</h2>
            </div>
            <p className="text-white/90 mb-4">{content.nordicAdvantageText}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {content.nordicItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Kuwait Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              {content.whyTitle}
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-700 mb-4">
                  {content.whyText1}
                </p>
                <p className="text-gray-700 mb-4">
                  {content.whyText2}
                </p>
                <p className="text-gray-700">
                  {content.whyText3}
                </p>
              </div>
              <div className="bg-[#007A3D]/5 p-6 rounded-lg border border-[#007A3D]/20">
                <h3 className="font-semibold text-lg mb-4">{content.commonDocsTitle}</h3>
                <ul className="space-y-2 text-gray-700">
                  {content.docs.map((doc, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-[#007A3D] mr-2">✓</span>
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
              {content.processTitle}
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {content.steps.map((item) => (
                <div key={item.step} className="bg-white p-6 rounded-lg shadow-sm text-center">
                  <div className="w-12 h-12 bg-[#007A3D] text-white font-bold text-xl rounded-full flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Embassy Info Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              {content.embassyTitle}
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">{content.contactTitle}</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-3">📍</span>
                    <div>
                      <strong>{content.postalLabel}</strong><br />
                      {embassyInfo.address}<br />
                      {embassyInfo.postalCode}
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-3">📞</span>
                    <div>
                      <strong>{content.phoneLabel}</strong><br />
                      {embassyInfo.phone}
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-3">🌐</span>
                    <div>
                      <strong>{content.websiteLabel}</strong><br />
                      <a href={embassyInfo.website} target="_blank" rel="noopener noreferrer" className="text-[#007A3D] hover:underline">
                        {embassyInfo.website}
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-3">🕐</span>
                    <div>
                      <strong>{content.hoursLabel}</strong><br />
                      {embassyInfo.openingHours}
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-[#007A3D]/5 p-6 rounded-lg border border-[#007A3D]/20">
                <h3 className="font-semibold text-lg mb-4">{content.weHandleTitle}</h3>
                <p className="text-gray-700 mb-4">
                  {content.weHandleText}
                </p>
                <ul className="space-y-2 text-gray-700 mb-6">
                  {content.weHandleItems.map((item, index) => (
                    <li key={index} className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/bestall" className="block w-full bg-[#007A3D] hover:bg-[#005a2d] text-white font-semibold py-3 rounded-lg transition-colors text-center">
                  {content.orderNow}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section - AEO Optimized */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              {content.faqTitle}
            </h2>
            <div className="space-y-4">
              {content.faqs.map((faq, index) => (
                <details 
                  key={index}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 group"
                >
                  <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                    <h3 className="font-semibold text-gray-900 pr-4">{faq.question}</h3>
                    <span className="text-[#007A3D] group-open:rotate-180 transition-transform">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </summary>
                  <div className="px-6 pb-6 text-gray-700">
                    <p>{faq.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[#007A3D] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {content.ctaTitle}
            </h2>
            <p className="text-white/80 mb-8">
              {content.ctaText}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/bestall" className="bg-white hover:bg-gray-100 text-[#007A3D] font-semibold px-8 py-4 rounded-lg transition-colors">
                {content.orderBtn}
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-[#007A3D] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                {content.contactBtn}
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
