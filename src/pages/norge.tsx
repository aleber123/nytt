import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';

export default function NorgePage() {
  // Ambassader som inte finns i Norge men finns i Sverige
  const embassies = [
    { country: 'Kuwait', flag: '🇰🇼', service: 'Legalisering & Visum' },
    { country: 'Qatar', flag: '🇶🇦', service: 'Legalisering & Visum' },
    { country: 'Libyen', flag: '🇱🇾', service: 'Legalisering' },
    { country: 'Irak', flag: '🇮🇶', service: 'Legalisering & Visum' },
    { country: 'Syrien', flag: '🇸🇾', service: 'Legalisering' },
    { country: 'Libanon', flag: '🇱🇧', service: 'Legalisering & Visum' },
    { country: 'Angola', flag: '🇦🇴', service: 'Visum' },
    { country: 'Etiopien', flag: '🇪🇹', service: 'Legalisering & Visum' },
  ];

  const services = [
    { icon: '📜', title: 'Ambassadlegalisering', desc: 'Vi legaliserar norska dokument via ambassader i Stockholm', price: 'Från 1495 kr' },
    { icon: '🛂', title: 'Visumansökan', desc: 'Vi hjälper dig ansöka om visum för länder utan ambassad i Norge', price: 'Offert' },
    { icon: '🌍', title: 'Översättning', desc: 'Auktoriserad översättning av norska dokument', price: 'Offert' },
    { icon: '📦', title: 'Dokumenthantering', desc: 'Vi hämtar och levererar dokument i hela Norden', price: 'Från 295 kr' },
  ];

  return (
    <>
      <Head>
        <title>Legalisering för Norge | Ambassader i Stockholm | DOX Visumpartner</title>
        <meta name="description" content="Bor du i Norge och behöver legalisera dokument eller ansöka om visum för länder utan ambassad i Oslo? Vi hjälper dig via ambassader i Stockholm. Kuwait, Qatar, Libyen m.fl." />
        <meta name="keywords" content="legalisering Norge, visum Norge, ambassad Stockholm, Kuwait visum Norge, Qatar legalisering Norge, norska dokument legalisering" />
        <link rel="canonical" href="https://www.doxvl.se/norge" />
        
        <meta property="og:title" content="Legalisering för Norge | Ambassader i Stockholm" />
        <meta property="og:description" content="Vi hjälper norska kunder med legalisering och visum via ambassader i Stockholm." />
        <meta property="og:url" content="https://www.doxvl.se/norge" />
        <meta property="og:type" content="website" />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Dokumentlegalisering för Norge",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB",
            "url": "https://www.doxvl.se"
          },
          "description": "Legalisering och visumtjänster för norska kunder via ambassader i Stockholm",
          "areaServed": { "@type": "Country", "name": "Norway" },
          "serviceType": "Document Legalization"
        })}} />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#2E2D2C] to-[#1a1918] text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="max-w-3xl">
              <div className="inline-flex items-center bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
                🇳🇴 Tjenester for Norge
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-6">
                Legalisering og Visum for Norge
              </h1>
              <p className="text-xl text-gray-300 mb-4">
                Bor du i Norge og trenger å <strong>legalisere dokumenter</strong> eller søke om <strong>visum</strong> for land uten ambassade i Oslo?
              </p>
              <p className="text-lg text-gray-400 mb-8">
                Vi hjelper deg via ambassader i Stockholm. Send dokumentene til oss – vi ordner resten.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/bestall"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#eab308] hover:bg-[#ca9a06] text-black font-bold rounded-lg text-lg transition-colors"
                >
                  Bestill nå
                </Link>
                <Link
                  href="/kontakt"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg transition-colors"
                >
                  Kontakt oss
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
                <span className="text-2xl">🇳🇴</span>
                <span className="font-medium">Norske kunder velkommen</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">📦</span>
                <span className="font-medium">Levering til Norge</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <span className="font-medium">Rask behandling</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">💬</span>
                <span className="font-medium">Vi snakker norsk</span>
              </div>
            </div>
          </div>
        </section>

        {/* Why Sweden */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Hvorfor gå via Sverige?
              </h2>
              <p className="text-lg text-gray-600">
                Mange land har ikke ambassade i Norge, men har det i Sverige. For å legalisere dokumenter 
                eller søke visum for disse landene må du gå via Stockholm. <strong>Vi gjør jobben for deg.</strong>
              </p>
            </div>
          </div>
        </section>

        {/* Embassies List */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
              Ambassader i Stockholm (ikke i Oslo)
            </h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Disse landene har ambassade i Stockholm men ikke i Oslo. Vi hjelper deg med legalisering og visum.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {embassies.map((embassy, i) => (
                <div key={i} className="bg-white rounded-xl p-5 text-center shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <span className="text-5xl mb-3 block">{embassy.flag}</span>
                  <h3 className="font-bold text-gray-900 mb-1">{embassy.country}</h3>
                  <p className="text-sm text-gray-500">{embassy.service}</p>
                </div>
              ))}
            </div>
            <p className="text-center mt-8 text-gray-600">
              Trenger du hjelp med et annet land? <Link href="/kontakt" className="text-[#eab308] hover:underline font-medium">Kontakt oss</Link>
            </p>
          </div>
        </section>

        {/* Services */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Våre tjenester for norske kunder
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <span className="text-4xl mb-4 block">{service.icon}</span>
                  <h3 className="font-bold text-gray-900 mb-2">{service.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{service.desc}</p>
                  <p className="text-[#eab308] font-bold">{service.price}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Slik fungerer det
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#eab308] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-black">1</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Send dokumenter</h3>
                <p className="text-gray-600 text-sm">Post dokumentene til oss i Stockholm</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#eab308] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-black">2</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Vi behandler</h3>
                <p className="text-gray-600 text-sm">Vi håndterer alt med ambassaden</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#eab308] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-black">3</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Ferdig</h3>
                <p className="text-gray-600 text-sm">Dokumentene er legalisert/visum klart</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#eab308] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-black">4</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Levering</h3>
                <p className="text-gray-600 text-sm">Vi sender alt tilbake til Norge</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-[#2E2D2C] to-[#1a1918] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Trenger du hjelp fra Norge?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Kontakt oss i dag. Vi hjelper deg med legalisering og visum via Stockholm.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/bestall"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#eab308] hover:bg-[#ca9a06] text-black font-bold rounded-lg text-lg transition-colors"
              >
                Bestill nå
              </Link>
              <Link
                href="/kontakt"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg transition-colors"
              >
                Kontakt oss
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
