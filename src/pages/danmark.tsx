import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';

export default function DanmarkPage() {
  // Ambassader som inte finns i Danmark men finns i Sverige
  const embassies = [
    { country: 'Kuwait', flag: '🇰🇼', service: 'Legalisering & Visum' },
    { country: 'Qatar', flag: '🇶🇦', service: 'Legalisering & Visum' },
    { country: 'Libyen', flag: '🇱🇾', service: 'Legalisering' },
    { country: 'Syrien', flag: '🇸🇾', service: 'Legalisering' },
    { country: 'Irak', flag: '🇮🇶', service: 'Legalisering & Visum' },
    { country: 'Angola', flag: '🇦🇴', service: 'Visum' },
    { country: 'Etiopien', flag: '🇪🇹', service: 'Legalisering & Visum' },
    { country: 'Nigeria', flag: '🇳🇬', service: 'Legalisering & Visum' },
  ];

  const services = [
    { icon: '📜', title: 'Ambassadelegalisering', desc: 'Vi legaliserer danske dokumenter via ambassader i Stockholm', price: 'Fra 1495 kr' },
    { icon: '🛂', title: 'Visumansøgning', desc: 'Vi hjælper dig med visum til lande uden ambassade i Danmark', price: 'Tilbud' },
    { icon: '🌍', title: 'Oversættelse', desc: 'Autoriseret oversættelse af danske dokumenter', price: 'Tilbud' },
    { icon: '📦', title: 'Dokumenthåndtering', desc: 'Vi henter og leverer dokumenter i hele Norden', price: 'Fra 295 kr' },
  ];

  return (
    <>
      <Head>
        <title>Legalisering for Danmark | Ambassader i Stockholm | DOX Visumpartner</title>
        <meta name="description" content="Bor du i Danmark og skal legalisere dokumenter eller søge visum for lande uden ambassade i København? Vi hjælper dig via ambassader i Stockholm. Kuwait, Qatar, Libyen m.fl." />
        <meta name="keywords" content="legalisering Danmark, visum Danmark, ambassade Stockholm, Kuwait visum Danmark, Qatar legalisering Danmark, danske dokumenter legalisering" />
        <link rel="canonical" href="https://doxvl.se/danmark" />
        
        <meta property="og:title" content="Legalisering for Danmark | Ambassader i Stockholm" />
        <meta property="og:description" content="Vi hjælper danske kunder med legalisering og visum via ambassader i Stockholm." />
        <meta property="og:url" content="https://doxvl.se/danmark" />
        <meta property="og:type" content="website" />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Dokumentlegalisering for Danmark",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB",
            "url": "https://doxvl.se"
          },
          "description": "Legalisering og visumtjenester for danske kunder via ambassader i Stockholm",
          "areaServed": { "@type": "Country", "name": "Denmark" },
          "serviceType": "Document Legalization"
        })}} />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#2E2D2C] to-[#1a1918] text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="max-w-3xl">
              <div className="inline-flex items-center bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
                🇩🇰 Tjenester for Danmark
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-6">
                Legalisering og Visum for Danmark
              </h1>
              <p className="text-xl text-gray-300 mb-4">
                Bor du i Danmark og skal <strong>legalisere dokumenter</strong> eller søge om <strong>visum</strong> for lande uden ambassade i København?
              </p>
              <p className="text-lg text-gray-400 mb-8">
                Vi hjælper dig via ambassader i Stockholm. Send dokumenterne til os – vi klarer resten.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/bestall"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#eab308] hover:bg-[#ca9a06] text-black font-bold rounded-lg text-lg transition-colors"
                >
                  Bestil nu
                </Link>
                <Link
                  href="/kontakt"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg transition-colors"
                >
                  Kontakt os
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
                <span className="text-2xl">🇩🇰</span>
                <span className="font-medium">Danske kunder velkommen</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">📦</span>
                <span className="font-medium">Levering til Danmark</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <span className="font-medium">Hurtig behandling</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">💬</span>
                <span className="font-medium">Vi forstår dansk</span>
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
                Mange lande har ikke ambassade i Danmark, men har det i Sverige. For at legalisere dokumenter 
                eller søge visum for disse lande skal du gå via Stockholm. <strong>Vi gør arbejdet for dig.</strong>
              </p>
            </div>
          </div>
        </section>

        {/* Embassies List */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
              Ambassader i Stockholm (ikke i København)
            </h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Disse lande har ambassade i Stockholm men ikke i København. Vi hjælper dig med legalisering og visum.
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
              Har du brug for hjælp med et andet land? <Link href="/kontakt" className="text-[#eab308] hover:underline font-medium">Kontakt os</Link>
            </p>
          </div>
        </section>

        {/* Services */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Vores tjenester for danske kunder
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
              Sådan fungerer det
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#eab308] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-black">1</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Send dokumenter</h3>
                <p className="text-gray-600 text-sm">Post dokumenterne til os i Stockholm</p>
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
                <h3 className="font-bold text-gray-900 mb-2">Færdig</h3>
                <p className="text-gray-600 text-sm">Dokumenterne er legaliseret/visum klar</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#eab308] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-black">4</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Levering</h3>
                <p className="text-gray-600 text-sm">Vi sender alt tilbage til Danmark</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-[#2E2D2C] to-[#1a1918] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Har du brug for hjælp fra Danmark?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Kontakt os i dag. Vi hjælper dig med legalisering og visum via Stockholm.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/bestall"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#eab308] hover:bg-[#ca9a06] text-black font-bold rounded-lg text-lg transition-colors"
              >
                Bestil nu
              </Link>
              <Link
                href="/kontakt"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg transition-colors"
              >
                Kontakt os
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
