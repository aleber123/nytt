import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';

export default function StockholmPage() {
  const services = [
    { icon: '📜', title: 'Apostille', desc: 'Haagkonventionens legalisering', price: 'Från 695 kr', href: '/tjanster/apostille' },
    { icon: '🏛️', title: 'Ambassadlegalisering', desc: 'Full legalisering för alla länder', price: 'Från 1495 kr', href: '/tjanster/ambassadlegalisering' },
    { icon: '📝', title: 'Notarius Publicus', desc: 'Verifiering av dokument', price: 'Från 495 kr', href: '/tjanster/notarius-publicus' },
    { icon: '🌍', title: 'Översättning', desc: 'Auktoriserad översättning', price: 'Offert', href: '/tjanster/oversattning' },
  ];

  const areas = ['Södermalm', 'Östermalm', 'Kungsholmen', 'Vasastan', 'Norrmalm', 'Gamla Stan', 'Solna', 'Sundbyberg'];

  return (
    <>
      <Head>
        <title>Legalisering Stockholm | Dokumentlegalisering & Apostille | DOX</title>
        <meta name="description" content="Behöver du legalisera dokument i Stockholm? Vi erbjuder snabb dokumentlegalisering, apostille och ambassadstämpel. Hämtning i hela Stockholmsområdet. Från 695 kr." />
        <meta name="keywords" content="legalisering Stockholm, dokumentlegalisering Stockholm, apostille Stockholm, notarius publicus Stockholm, ambassadlegalisering Stockholm" />
        
        <meta property="og:title" content="Legalisering Stockholm | DOX Visumpartner" />
        <meta property="og:description" content="Professionell dokumentlegalisering i Stockholm. Apostille, ambassadlegalisering och översättning." />
        <meta property="og:url" content="https://doxvl.se/stockholm" />
        <meta property="og:type" content="website" />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": "DOX Visumpartner - Stockholm",
          "description": "Dokumentlegalisering och apostille-tjänster i Stockholm",
          "url": "https://doxvl.se/stockholm",
          "logo": "https://doxvl.se/dox-logo.webp",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Stockholm",
            "addressRegion": "Stockholm",
            "addressCountry": "SE"
          },
          "areaServed": {
            "@type": "City",
            "name": "Stockholm"
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
                📍 Stockholm & Stockholmsområdet
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-6">
                Legalisering av Dokument i Stockholm
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Behöver du legalisera dokument i Stockholm? Vi erbjuder <strong>snabb och professionell 
                dokumentlegalisering</strong> för privatpersoner och företag i hela Stockholmsområdet.
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
                <span className="text-2xl">📍</span>
                <span className="font-medium">Lokal service</span>
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
              Våra tjänster i Stockholm
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
              Varför välja DOX i Stockholm?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">🚀</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Snabb handläggning</h3>
                <p className="text-gray-600">
                  Vi har kontor i Stockholm och kan hantera dina dokument snabbt. Expresstjänst tillgänglig.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">🏢</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Lokal expertis</h3>
                <p className="text-gray-600">
                  Vi känner till alla ambassader och myndigheter i Stockholm och vet exakt vad som krävs.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">📦</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Hämtning & leverans</h3>
                <p className="text-gray-600">
                  Vi kan hämta och leverera dokument i hela Stockholmsområdet för din bekvämlighet.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Areas Served */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
              Vi betjänar hela Stockholmsområdet
            </h2>
            <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
              Oavsett var i Stockholm du befinner dig kan vi hjälpa dig med dokumentlegalisering.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {areas.map((area, i) => (
                <span key={i} className="bg-gray-100 px-4 py-2 rounded-full text-gray-700 font-medium">
                  {area}
                </span>
              ))}
              <span className="bg-[#eab308] px-4 py-2 rounded-full text-black font-medium">
                + hela länet
              </span>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-[#2E2D2C] to-[#1a1918] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Behöver du legalisera dokument i Stockholm?
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
              <a
                href="tel:+46812345678"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg transition-colors"
              >
                📞 Ring oss
              </a>
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
