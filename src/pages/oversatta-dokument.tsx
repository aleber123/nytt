import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';

export default function OversattaDokumentPage() {
  const { t } = useTranslation('common');

  const languages = [
    { name: 'Engelska', flag: '🇬🇧' },
    { name: 'Arabiska', flag: '🇸🇦' },
    { name: 'Spanska', flag: '🇪🇸' },
    { name: 'Franska', flag: '🇫🇷' },
    { name: 'Tyska', flag: '🇩🇪' },
    { name: 'Kinesiska', flag: '🇨🇳' },
    { name: 'Ryska', flag: '🇷🇺' },
    { name: 'Portugisiska', flag: '🇵🇹' },
  ];

  const documentTypes = [
    { icon: '📜', title: 'Examensbevis', desc: 'Universitetsexamen, gymnasiebetyg, diplom' },
    { icon: '💍', title: 'Civilståndshandlingar', desc: 'Födelsebevis, vigselbevis, dödsbevis' },
    { icon: '🏢', title: 'Företagsdokument', desc: 'Bolagshandlingar, avtal, fullmakter' },
    { icon: '⚖️', title: 'Juridiska dokument', desc: 'Domar, intyg, certifikat' },
    { icon: '🏥', title: 'Medicinska dokument', desc: 'Läkarintyg, journaler, recept' },
    { icon: '🎓', title: 'Akademiska dokument', desc: 'Betyg, kursintyg, studieintyg' },
  ];

  return (
    <>
      <Head>
        <title>Översätta Dokument | Auktoriserad Översättning Sverige | DOX</title>
        <meta name="description" content="Behöver du översätta dokument? Vi erbjuder auktoriserad översättning av Kammarkollegiet-godkända översättare. Snabb leverans, alla språk. Från 495 kr." />
        <meta name="keywords" content="översätta dokument, auktoriserad översättning, certified translation, officiell översättning, Kammarkollegiet, dokumentöversättning, översättare" />
        <link rel="canonical" href="https://doxvl.se/oversatta-dokument" />
        
        <meta property="og:title" content="Översätta Dokument | Auktoriserad Översättning | DOX" />
        <meta property="og:description" content="Auktoriserad översättning av dokument för internationellt bruk. Certifierade översättare godkända av Kammarkollegiet." />
        <meta property="og:url" content="https://doxvl.se/oversatta-dokument" />
        <meta property="og:type" content="website" />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Auktoriserad Dokumentöversättning",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB",
            "url": "https://doxvl.se",
            "logo": "https://doxvl.se/dox-logo.webp"
          },
          "description": "Auktoriserad översättning av dokument för internationellt bruk. Certifierade översättare godkända av Kammarkollegiet.",
          "areaServed": { "@type": "Country", "name": "Sweden" },
          "serviceType": "Certified Translation",
          "offers": {
            "@type": "Offer",
            "price": "495",
            "priceCurrency": "SEK",
            "availability": "https://schema.org/InStock"
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
                "text": "En auktoriserad översättning är utförd av en översättare som är godkänd av Kammarkollegiet. Översättningen har samma juridiska giltighet som originaldokumentet och accepteras av myndigheter världen över."
              }
            },
            {
              "@type": "Question",
              "name": "Vilka språk erbjuder ni översättning till?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Vi erbjuder auktoriserad översättning till och från de flesta språk, inklusive engelska, tyska, franska, spanska, arabiska, kinesiska, ryska, portugisiska och många fler."
              }
            },
            {
              "@type": "Question",
              "name": "Hur lång tid tar en auktoriserad översättning?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Leveranstiden beror på dokumentets längd och komplexitet. Vanligtvis 3-5 arbetsdagar för standarddokument. Expresstjänst finns tillgänglig för brådskande ärenden."
              }
            },
            {
              "@type": "Question",
              "name": "Vad kostar det att översätta dokument?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Priset beror på dokumentets längd, språkkombination och komplexitet. Standarddokument från 495 kr. Kontakta oss för exakt offert."
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
              <div className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
                ✅ Kammarkollegiet-godkända översättare
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-6">
                Översätta Dokument – Auktoriserad Översättning
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Behöver du översätta dokument för myndigheter, arbetsgivare eller utbildning? 
                Vi erbjuder <strong>auktoriserad översättning</strong> som accepteras världen över.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/bestall"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#eab308] hover:bg-[#ca9a06] text-black font-bold rounded-lg text-lg transition-colors"
                >
                  Beställ översättning – från 495 kr
                </Link>
                <Link
                  href="/kontakt"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg transition-colors"
                >
                  Få gratis offert
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="bg-white border-b py-6">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-wrap justify-center items-center gap-8 text-gray-600">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                <span className="font-medium">Kammarkollegiet-godkända</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <span className="font-medium">Snabb leverans</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌍</span>
                <span className="font-medium">50+ språk</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">✅</span>
                <span className="font-medium">Juridiskt giltig</span>
              </div>
            </div>
          </div>
        </section>

        {/* What is Authorized Translation */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Vad är auktoriserad översättning?
                </h2>
                <p className="text-lg text-gray-600 mb-4">
                  En <strong>auktoriserad översättning</strong> är utförd av en översättare som är godkänd av 
                  Kammarkollegiet. Detta innebär att översättningen har samma juridiska giltighet som originaldokumentet.
                </p>
                <p className="text-lg text-gray-600 mb-6">
                  Auktoriserade översättningar krävs ofta av:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="text-gray-700">Myndigheter (Migrationsverket, Skatteverket)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="text-gray-700">Universitet och högskolor</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="text-gray-700">Arbetsgivare för utländska meriter</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="text-gray-700">Utländska ambassader och myndigheter</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8">
                <div className="text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Kammarkollegiet</h3>
                  <p className="text-gray-600">
                    Alla våra översättare är auktoriserade av Kammarkollegiet och följer strikta kvalitetskrav.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Languages */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
              Språk vi översätter till och från
            </h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Vi erbjuder auktoriserad översättning till och från över 50 språk. Här är några av de vanligaste:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {languages.map((lang, i) => (
                <div key={i} className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-200">
                  <span className="text-4xl mb-2 block">{lang.flag}</span>
                  <span className="font-medium text-gray-900">{lang.name}</span>
                </div>
              ))}
            </div>
            <p className="text-center mt-8 text-gray-600">
              Saknar du ett språk? <Link href="/kontakt" className="text-[#eab308] hover:underline font-medium">Kontakta oss</Link> – vi har översättare för de flesta språk.
            </p>
          </div>
        </section>

        {/* Document Types */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Dokument vi översätter
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documentTypes.map((doc, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <span className="text-4xl mb-4 block">{doc.icon}</span>
                  <h3 className="font-bold text-gray-900 mb-2">{doc.title}</h3>
                  <p className="text-gray-600 text-sm">{doc.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Så fungerar det
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#eab308] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-black">1</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Skicka dokument</h3>
                <p className="text-gray-600 text-sm">Ladda upp eller mejla ditt dokument</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#eab308] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-black">2</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Få offert</h3>
                <p className="text-gray-600 text-sm">Vi återkommer med pris och leveranstid</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#eab308] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-black">3</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Översättning</h3>
                <p className="text-gray-600 text-sm">Auktoriserad översättare arbetar</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#eab308] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-black">4</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Leverans</h3>
                <p className="text-gray-600 text-sm">Du får din översättning digitalt & fysiskt</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Vanliga frågor om översättning
            </h2>
            <div className="space-y-4">
              <details className="bg-gray-50 rounded-xl p-6 group">
                <summary className="font-bold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                  Vad är skillnaden mellan auktoriserad och vanlig översättning?
                  <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-4 text-gray-600">
                  En auktoriserad översättning är utförd av en översättare godkänd av Kammarkollegiet och har juridisk giltighet. 
                  Vanlig översättning accepteras inte av myndigheter eller för officiella ändamål.
                </p>
              </details>
              <details className="bg-gray-50 rounded-xl p-6 group">
                <summary className="font-bold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                  Hur lång tid tar en översättning?
                  <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-4 text-gray-600">
                  Standardleverans är 3-5 arbetsdagar för de flesta dokument. Vi erbjuder även expresstjänst 
                  för brådskande ärenden med leverans inom 24-48 timmar.
                </p>
              </details>
              <details className="bg-gray-50 rounded-xl p-6 group">
                <summary className="font-bold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                  Kan ni även legalisera det översatta dokumentet?
                  <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-4 text-gray-600">
                  Ja! Vi erbjuder komplett service med både översättning och legalisering. Vi kan hantera 
                  Notarius Publicus, Handelskammare, UD och ambassadlegalisering.
                </p>
              </details>
              <details className="bg-gray-50 rounded-xl p-6 group">
                <summary className="font-bold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                  Får jag originaldokumentet tillbaka?
                  <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-4 text-gray-600">
                  Ja, vi returnerar alltid ditt originaldokument tillsammans med den översatta versionen. 
                  Du får även en digital kopia via e-post.
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-[#2E2D2C] to-[#1a1918] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Behöver du översätta dokument?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Få en gratis offert idag. Snabb leverans och auktoriserade översättare.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/bestall"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#eab308] hover:bg-[#ca9a06] text-black font-bold rounded-lg text-lg transition-colors"
              >
                Beställ översättning
              </Link>
              <Link
                href="/kontakt"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg transition-colors"
              >
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
