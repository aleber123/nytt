import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';

export default function GoteborgPage() {
  const services = [
    { icon: '📜', title: 'Apostille', desc: 'Haagkonventionens legalisering', price: 'Från 695 kr', href: '/tjanster/apostille' },
    { icon: '🏛️', title: 'Ambassadlegalisering', desc: 'Full legalisering för alla länder', price: 'Från 1495 kr', href: '/tjanster/ambassadlegalisering' },
    { icon: '📝', title: 'Notarius Publicus', desc: 'Verifiering av dokument', price: 'Från 495 kr', href: '/tjanster/notarius-publicus' },
    { icon: '🌍', title: 'Översättning', desc: 'Auktoriserad översättning', price: 'Offert', href: '/tjanster/oversattning' },
  ];

  const areas = ['Centrum', 'Hisingen', 'Majorna', 'Linnéstaden', 'Örgryte', 'Härlanda', 'Mölndal', 'Partille'];

  return (
    <>
      <Head>
        <title>Legalisering Göteborg | Dokumentlegalisering & Apostille | DOX</title>
        <meta name="description" content="Behöver du legalisera dokument i Göteborg? Vi erbjuder snabb dokumentlegalisering, apostille och ambassadstämpel. Service i hela Göteborgsområdet. Från 695 kr." />
        <meta name="keywords" content="legalisering Göteborg, dokumentlegalisering Göteborg, apostille Göteborg, notarius publicus Göteborg, ambassadlegalisering Göteborg" />
        <link rel="canonical" href="https://www.doxvl.se/goteborg" />
        
        <meta property="og:title" content="Legalisering Göteborg | DOX Visumpartner" />
        <meta property="og:description" content="Professionell dokumentlegalisering i Göteborg. Apostille, ambassadlegalisering och översättning." />
        <meta property="og:url" content="https://www.doxvl.se/goteborg" />
        <meta property="og:type" content="website" />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": "DOX Visumpartner - Göteborg",
          "description": "Dokumentlegalisering och apostille-tjänster i Göteborg",
          "url": "https://www.doxvl.se/goteborg",
          "logo": "https://www.doxvl.se/dox-logo.webp",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Göteborg",
            "addressRegion": "Västra Götaland",
            "addressCountry": "SE"
          },
          "areaServed": {
            "@type": "City",
            "name": "Göteborg"
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
                📍 Göteborg & Västra Götaland
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-6">
                Legalisering av Dokument i Göteborg
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Behöver du legalisera dokument i Göteborg? Vi erbjuder <strong>snabb och professionell 
                dokumentlegalisering</strong> för privatpersoner och företag i hela Göteborgsområdet.
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
                <span className="font-medium">Rikstäckande service</span>
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
              Våra tjänster i Göteborg
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
              Varför välja DOX i Göteborg?
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
                  <span className="text-2xl">🏢</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Rikstäckande nätverk</h3>
                <p className="text-gray-600">
                  Vi har kontakter på alla ambassader och myndigheter och vet exakt vad som krävs för varje land.
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
              Vi betjänar hela Göteborgsområdet
            </h2>
            <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
              Oavsett var i Göteborg du befinner dig kan vi hjälpa dig med dokumentlegalisering.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {areas.map((area, i) => (
                <span key={i} className="bg-gray-100 px-4 py-2 rounded-full text-gray-700 font-medium">
                  {area}
                </span>
              ))}
              <span className="bg-[#eab308] px-4 py-2 rounded-full text-black font-medium">
                + hela Västra Götaland
              </span>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-[#2E2D2C] to-[#1a1918] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Behöver du legalisera dokument i Göteborg?
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
