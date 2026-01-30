import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';

export default function FinlandPage() {
  // Ambassader som inte finns i Finland men finns i Sverige
  const embassies = [
    { country: 'Kuwait', flag: '🇰🇼', service: 'Legalisointi & Viisumi' },
    { country: 'Qatar', flag: '🇶🇦', service: 'Legalisointi & Viisumi' },
    { country: 'Libyen', flag: '🇱🇾', service: 'Legalisointi' },
    { country: 'Syrien', flag: '🇸🇾', service: 'Legalisointi' },
    { country: 'Libanon', flag: '🇱🇧', service: 'Legalisointi & Viisumi' },
    { country: 'Angola', flag: '🇦🇴', service: 'Viisumi' },
    { country: 'Palestina', flag: '🇵🇸', service: 'Legalisointi' },
    { country: 'Irak', flag: '🇮🇶', service: 'Legalisointi & Viisumi' },
  ];

  const services = [
    { icon: '📜', title: 'Suurlähetystölegalisointi', desc: 'Legalisoimme suomalaiset asiakirjat Tukholman suurlähetystöjen kautta', price: 'Alkaen 1495 kr' },
    { icon: '🛂', title: 'Viisumihakemus', desc: 'Autamme viisumihakemuksissa maihin, joilla ei ole suurlähetystöä Suomessa', price: 'Tarjous' },
    { icon: '🌍', title: 'Käännös', desc: 'Virallinen käännös suomalaisista asiakirjoista', price: 'Tarjous' },
    { icon: '📦', title: 'Asiakirjakäsittely', desc: 'Noudamme ja toimitamme asiakirjat koko Pohjoismaissa', price: 'Alkaen 295 kr' },
  ];

  return (
    <>
      <Head>
        <title>Legalisointi Suomelle | Suurlähetystöt Tukholmassa | DOX Visumpartner</title>
        <meta name="description" content="Asutko Suomessa ja tarvitset asiakirjojen legalisointia tai viisumia maihin, joilla ei ole suurlähetystöä Helsingissä? Autamme Tukholman suurlähetystöjen kautta. Kuwait, Qatar, Libya ym." />
        <meta name="keywords" content="legalisointi Suomi, viisumi Suomi, suurlähetystö Tukholma, Kuwait viisumi Suomi, Qatar legalisointi Suomi, suomalaiset asiakirjat legalisointi" />
        <link rel="canonical" href="https://www.doxvl.se/finland" />
        
        <meta property="og:title" content="Legalisointi Suomelle | Suurlähetystöt Tukholmassa" />
        <meta property="og:description" content="Autamme suomalaisia asiakkaita legalisoinnissa ja viisumihakemuksissa Tukholman suurlähetystöjen kautta." />
        <meta property="og:url" content="https://www.doxvl.se/finland" />
        <meta property="og:type" content="website" />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Asiakirjojen legalisointi Suomelle",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB",
            "url": "https://www.doxvl.se"
          },
          "description": "Legalisointi- ja viisumipalvelut suomalaisille asiakkaille Tukholman suurlähetystöjen kautta",
          "areaServed": { "@type": "Country", "name": "Finland" },
          "serviceType": "Document Legalization"
        })}} />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#2E2D2C] to-[#1a1918] text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="max-w-3xl">
              <div className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
                🇫🇮 Palvelut Suomelle
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-6">
                Legalisointi ja Viisumi Suomelle
              </h1>
              <p className="text-xl text-gray-300 mb-4">
                Asutko Suomessa ja tarvitset <strong>asiakirjojen legalisointia</strong> tai <strong>viisumia</strong> maihin, joilla ei ole suurlähetystöä Helsingissä?
              </p>
              <p className="text-lg text-gray-400 mb-8">
                Autamme sinua Tukholman suurlähetystöjen kautta. Lähetä asiakirjat meille – me hoidamme loput.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/bestall"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#eab308] hover:bg-[#ca9a06] text-black font-bold rounded-lg text-lg transition-colors"
                >
                  Tilaa nyt
                </Link>
                <Link
                  href="/kontakt"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg transition-colors"
                >
                  Ota yhteyttä
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
                <span className="text-2xl">🇫🇮</span>
                <span className="font-medium">Suomalaiset asiakkaat tervetulleita</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">📦</span>
                <span className="font-medium">Toimitus Suomeen</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <span className="font-medium">Nopea käsittely</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">💬</span>
                <span className="font-medium">Palvelemme englanniksi</span>
              </div>
            </div>
          </div>
        </section>

        {/* Why Sweden */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Miksi Ruotsin kautta?
              </h2>
              <p className="text-lg text-gray-600">
                Monilla mailla ei ole suurlähetystöä Suomessa, mutta on Ruotsissa. Asiakirjojen legalisoimiseksi 
                tai viisumin hakemiseksi näihin maihin sinun on mentävä Tukholman kautta. <strong>Me teemme työn puolestasi.</strong>
              </p>
            </div>
          </div>
        </section>

        {/* Embassies List */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
              Suurlähetystöt Tukholmassa (ei Helsingissä)
            </h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Näillä mailla on suurlähetystö Tukholmassa mutta ei Helsingissä. Autamme legalisoinnissa ja viisumihakemuksissa.
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
              Tarvitsetko apua toisen maan kanssa? <Link href="/kontakt" className="text-[#eab308] hover:underline font-medium">Ota yhteyttä</Link>
            </p>
          </div>
        </section>

        {/* Services */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Palvelumme suomalaisille asiakkaille
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
              Näin se toimii
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#eab308] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-black">1</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Lähetä asiakirjat</h3>
                <p className="text-gray-600 text-sm">Postita asiakirjat meille Tukholmaan</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#eab308] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-black">2</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Me käsittelemme</h3>
                <p className="text-gray-600 text-sm">Hoidamme kaiken suurlähetystön kanssa</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#eab308] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-black">3</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Valmis</h3>
                <p className="text-gray-600 text-sm">Asiakirjat legalisoitu/viisumi valmis</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#eab308] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-black">4</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Toimitus</h3>
                <p className="text-gray-600 text-sm">Lähetämme kaiken takaisin Suomeen</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-[#2E2D2C] to-[#1a1918] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Tarvitsetko apua Suomesta?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Ota yhteyttä tänään. Autamme legalisoinnissa ja viisumihakemuksissa Tukholman kautta.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/bestall"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#eab308] hover:bg-[#ca9a06] text-black font-bold rounded-lg text-lg transition-colors"
              >
                Tilaa nyt
              </Link>
              <Link
                href="/kontakt"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg transition-colors"
              >
                Ota yhteyttä
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
