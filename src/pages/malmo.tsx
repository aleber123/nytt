import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';

export default function MalmoPage() {
  const services = [
    { icon: '📜', title: 'Apostille', desc: 'Haagkonventionens legalisering', price: 'Från 695 kr', href: '/tjanster/apostille' },
    { icon: '🏛️', title: 'Ambassadlegalisering', desc: 'Full legalisering för alla länder', price: 'Från 1495 kr', href: '/tjanster/ambassadlegalisering' },
    { icon: '📝', title: 'Notarius Publicus', desc: 'Verifiering av dokument', price: 'Från 495 kr', href: '/tjanster/notarius-publicus' },
    { icon: '🌍', title: 'Översättning', desc: 'Auktoriserad översättning', price: 'Offert', href: '/tjanster/oversattning' },
  ];

  const areas = ['Centrum', 'Västra Hamnen', 'Limhamn', 'Rosengård', 'Hyllie', 'Oxie', 'Lund', 'Helsingborg'];

  return (
    <>
      <Head>
        <title>Legalisering Malmö | Dokumentlegalisering & Apostille | DOX</title>
        <meta name="description" content="Behöver du legalisera dokument i Malmö? Vi erbjuder snabb dokumentlegalisering, apostille och ambassadstämpel. Service i hela Skåne. Från 695 kr." />
        <meta name="keywords" content="legalisering Malmö, dokumentlegalisering Malmö, apostille Malmö, notarius publicus Malmö, ambassadlegalisering Malmö, legalisering Skåne" />
        <link rel="canonical" href="https://doxvl.se/malmo" />
        
        <meta property="og:title" content="Legalisering Malmö | DOX Visumpartner" />
        <meta property="og:description" content="Professionell dokumentlegalisering i Malmö och Skåne. Apostille, ambassadlegalisering och översättning." />
        <meta property="og:url" content="https://doxvl.se/malmo" />
        <meta property="og:type" content="website" />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": "DOX Visumpartner - Malmö",
          "description": "Dokumentlegalisering och apostille-tjänster i Malmö och Skåne",
          "url": "https://doxvl.se/malmo",
          "logo": "https://doxvl.se/dox-logo.webp",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Malmö",
            "addressRegion": "Skåne",
            "addressCountry": "SE"
          },
          "areaServed": {
            "@type": "City",
            "name": "Malmö"
          },
          "priceRange": "695-5000 SEK",
          "openingHours": "Mo-Fr 09:00-17:00"
        })}} />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#2E2D2C] to-[#1a1918] text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="max-w-3xl">
              <div className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
                📍 Malmö & Skåne
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-6">
                Legalisering av Dokument i Malmö
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Behöver du legalisera dokument i Malmö? Vi erbjuder <strong>snabb och professionell 
                dokumentlegalisering</strong> för privatpersoner och företag i hela Skåne.
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
                  Kontakta oss
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
                <span className="text-2xl">🇩🇰</span>
                <span className="font-medium">Nära Köpenhamn</span>
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
              Våra tjänster i Malmö
            </h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Vi erbjuder komplett dokumentlegalisering för alla typer av dokument och destinationsländer.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service, i) => (
                <Link
                  key={i}
                  href={service.href}
                  className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow border border-gray-200"
                >
                  <span className="text-4xl mb-4 block">{service.icon}</span>
                  <h3 className="font-bold text-gray-900 mb-2">{service.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{service.desc}</p>
                  <p className="text-[#eab308] font-bold">{service.price}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Varför välja DOX i Malmö?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">🚀</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Snabb handläggning</h3>
                <p className="text-gray-600">
                  Skicka dina dokument till oss och vi hanterar allt. Expresstjänst tillgänglig för brådskande ärenden.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">🌍</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Internationell expertis</h3>
                <p className="text-gray-600">
                  Malmös läge nära Danmark ger oss unik erfarenhet av nordiska och internationella ärenden.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">📦</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Enkel process</h3>
                <p className="text-gray-600">
                  Skicka dokument med post eller bud. Vi returnerar allt färdiglegaliserat direkt till dig.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Areas Served */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
              Vi betjänar hela Skåne
            </h2>
            <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
              Oavsett var i Skåne du befinner dig kan vi hjälpa dig med dokumentlegalisering.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {areas.map((area, i) => (
                <span key={i} className="bg-gray-100 px-4 py-2 rounded-full text-gray-700 font-medium">
                  {area}
                </span>
              ))}
              <span className="bg-[#eab308] px-4 py-2 rounded-full text-black font-medium">
                + hela Skåne
              </span>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-[#2E2D2C] to-[#1a1918] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Behöver du legalisera dokument i Malmö?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Kontakta oss idag för snabb och professionell service.
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
