import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';

export default function LegaliseraDokumentPage() {
  const { t } = useTranslation('common');

  const countries = [
    { name: 'Saudiarabien', slug: 'saudiarabien', flag: '🇸🇦' },
    { name: 'UAE', slug: 'uae', flag: '🇦🇪' },
    { name: 'Qatar', slug: 'qatar', flag: '🇶🇦' },
    { name: 'Kuwait', slug: 'kuwait', flag: '🇰🇼' },
    { name: 'Egypten', slug: 'egypten', flag: '🇪🇬' },
    { name: 'Indien', slug: 'indien', flag: '🇮🇳' },
    { name: 'Kina', slug: 'kina', flag: '🇨🇳' },
    { name: 'Thailand', slug: 'thailand', flag: '🇹🇭' },
  ];

  const documentTypes = [
    { icon: '📜', title: 'Examensbevis & Diplom', desc: 'Universitetsexamen, gymnasiebetyg, yrkesbevis' },
    { icon: '💍', title: 'Civilståndshandlingar', desc: 'Vigselbevis, födelsebevis, dödsbevis' },
    { icon: '🏢', title: 'Företagsdokument', desc: 'Bolagshandlingar, fullmakter, avtal' },
    { icon: '⚖️', title: 'Juridiska dokument', desc: 'Domstolshandlingar, intyg, certifikat' },
  ];

  const steps = [
    { num: '1', title: 'Skicka dokument', desc: 'Ladda upp eller skicka dina dokument till oss' },
    { num: '2', title: 'Vi hanterar allt', desc: 'Notarius, Handelskammare, UD & Ambassad' },
    { num: '3', title: 'Färdigt dokument', desc: 'Vi skickar tillbaka ditt legaliserade dokument' },
  ];

  return (
    <>
      <Head>
        <title>Legalisera Dokument i Sverige | Snabb & Säker Dokumentlegalisering | DOX</title>
        <meta name="description" content="Behöver du legalisera dokument för utlandet? Vi hjälper dig med hela processen - Notarius Publicus, Handelskammare, UD och ambassadlegalisering. Från 695 kr." />
        <meta name="keywords" content="legalisera dokument, dokumentlegalisering, legalisering Sverige, apostille, ambassadlegalisering, notarius publicus, handelskammare, UD legalisering" />
        <link rel="canonical" href="https://doxvl.se/legalisera-dokument" />
        
        <meta property="og:title" content="Legalisera Dokument i Sverige | DOX Visumpartner" />
        <meta property="og:description" content="Professionell dokumentlegalisering för alla länder. Vi hanterar hela processen åt dig." />
        <meta property="og:url" content="https://doxvl.se/legalisera-dokument" />
        <meta property="og:type" content="website" />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Dokumentlegalisering",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB",
            "url": "https://doxvl.se",
            "logo": "https://doxvl.se/dox-logo.webp"
          },
          "description": "Professionell legalisering av dokument för internationellt bruk. Apostille, ambassadlegalisering och översättning.",
          "areaServed": { "@type": "Country", "name": "Sweden" },
          "serviceType": "Document Legalization",
          "offers": {
            "@type": "Offer",
            "price": "695",
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
              "name": "Vad innebär det att legalisera ett dokument?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Att legalisera ett dokument innebär att verifiera dess äkthet så att det accepteras i ett annat land. Processen kan inkludera Notarius Publicus, Handelskammare, Utrikesdepartementet och ambassadlegalisering beroende på destinationsland."
              }
            },
            {
              "@type": "Question",
              "name": "Hur lång tid tar det att legalisera dokument?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Handläggningstiden varierar beroende på typ av legalisering. Apostille tar vanligtvis 5-7 arbetsdagar. Full ambassadlegalisering kan ta 2-4 veckor beroende på land."
              }
            },
            {
              "@type": "Question",
              "name": "Vad kostar det att legalisera dokument?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Priserna varierar beroende på typ av legalisering och destinationsland. Apostille från 695 kr, full legalisering från 1495 kr. Kontakta oss för exakt pris."
              }
            },
            {
              "@type": "Question",
              "name": "Vilka dokument kan legaliseras?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "De flesta officiella dokument kan legaliseras: examensbevis, födelsebevis, vigselbevis, fullmakter, bolagshandlingar, domstolshandlingar och certifikat."
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
                ✅ Över 500 nöjda kunder
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-6">
                Legalisera Dokument för Utlandet
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Behöver du legalisera dokument för användning utomlands? Vi hjälper dig med hela processen - 
                från Notarius Publicus till ambassadstämpel. <strong>Snabbt, säkert och professionellt.</strong>
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/bestall"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#eab308] hover:bg-[#ca9a06] text-black font-bold rounded-lg text-lg transition-colors"
                >
                  Beställ nu – från 695 kr
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
                <span className="font-medium">500+ nöjda kunder</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <span className="font-medium">Snabb leverans</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔒</span>
                <span className="font-medium">Säker hantering</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">💬</span>
                <span className="font-medium">Personlig service</span>
              </div>
            </div>
          </div>
        </section>

        {/* What is Legalization */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Vad innebär dokumentlegalisering?
              </h2>
              <p className="text-lg text-gray-600">
                Dokumentlegalisering är processen att verifiera ett dokuments äkthet så att det accepteras 
                av myndigheter i ett annat land. Beroende på destinationsland kan processen inkludera flera steg.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📝</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Notarius Publicus</h3>
                <p className="text-gray-600 text-sm">Första steget - verifiering av dokumentets äkthet</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🏛️</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Handelskammaren</h3>
                <p className="text-gray-600 text-sm">Bekräftar notariens underskrift</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🇸🇪</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Utrikesdepartementet</h3>
                <p className="text-gray-600 text-sm">UD-stämpel eller Apostille</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🏢</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Ambassad</h3>
                <p className="text-gray-600 text-sm">Slutlig legalisering för destinationslandet</p>
              </div>
            </div>
          </div>
        </section>

        {/* Document Types */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Vilka dokument kan legaliseras?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {documentTypes.map((doc, i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-4xl mb-4 block">{doc.icon}</span>
                  <h3 className="font-bold text-gray-900 mb-2">{doc.title}</h3>
                  <p className="text-gray-600 text-sm">{doc.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Så fungerar det – 3 enkla steg
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, i) => (
                <div key={i} className="text-center">
                  <div className="w-16 h-16 bg-[#eab308] rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-black">{step.num}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Countries */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
              Populära destinationsländer
            </h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Vi hjälper dig legalisera dokument för alla länder. Här är några av de vanligaste:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {countries.map((country) => (
                <Link
                  key={country.slug}
                  href={`/legalisering/${country.slug}`}
                  className="bg-white rounded-xl p-4 text-center hover:shadow-md transition-shadow border border-gray-200"
                >
                  <span className="text-4xl mb-2 block">{country.flag}</span>
                  <span className="font-medium text-gray-900">{country.name}</span>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/lander"
                className="inline-flex items-center text-[#eab308] hover:text-[#ca9a06] font-medium"
              >
                Se alla länder →
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Vanliga frågor om dokumentlegalisering
            </h2>
            <div className="space-y-4">
              <details className="bg-gray-50 rounded-xl p-6 group">
                <summary className="font-bold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                  Vad innebär det att legalisera ett dokument?
                  <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-4 text-gray-600">
                  Att legalisera ett dokument innebär att verifiera dess äkthet så att det accepteras i ett annat land. 
                  Processen kan inkludera Notarius Publicus, Handelskammare, Utrikesdepartementet och ambassadlegalisering 
                  beroende på destinationsland.
                </p>
              </details>
              <details className="bg-gray-50 rounded-xl p-6 group">
                <summary className="font-bold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                  Hur lång tid tar det att legalisera dokument?
                  <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-4 text-gray-600">
                  Handläggningstiden varierar beroende på typ av legalisering. Apostille tar vanligtvis 5-7 arbetsdagar. 
                  Full ambassadlegalisering kan ta 2-4 veckor beroende på land. Vi erbjuder även expresstjänst.
                </p>
              </details>
              <details className="bg-gray-50 rounded-xl p-6 group">
                <summary className="font-bold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                  Vad kostar det att legalisera dokument?
                  <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-4 text-gray-600">
                  Priserna varierar beroende på typ av legalisering och destinationsland. Apostille från 695 kr, 
                  full legalisering från 1495 kr. Kontakta oss för exakt pris för ditt ärende.
                </p>
              </details>
              <details className="bg-gray-50 rounded-xl p-6 group">
                <summary className="font-bold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                  Behöver jag översätta mitt dokument?
                  <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-4 text-gray-600">
                  Många länder kräver att dokumentet översätts till landets officiella språk eller engelska. 
                  Vi erbjuder auktoriserad översättning som en del av våra tjänster.
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-[#2E2D2C] to-[#1a1918] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Redo att legalisera dina dokument?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Vi hjälper dig med hela processen. Snabbt, säkert och till fast pris.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/bestall"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#eab308] hover:bg-[#ca9a06] text-black font-bold rounded-lg text-lg transition-colors"
              >
                Beställ nu
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
