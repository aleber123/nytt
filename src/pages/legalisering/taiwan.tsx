import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function TaiwanLegaliseringPage() {
  const { t } = useTranslation('common');

  const embassyInfo = {
    name: 'Taipei Mission in Sweden (Taiwans representationskontor)',
    address: 'Wenner-Gren Center, 18tr, Sveavägen 166',
    postalCode: '113 46 Stockholm',
    phone: '+46 8 728 85 13',
    email: 'consular.section@tmis.se',
    website: 'https://www.roc-taiwan.org/se',
    openingHours: 'Måndag-Fredag 09:00-12:00, 13:30-17:00'
  };

  return (
    <>
      <Head>
        <title>Legalisering för Taiwan - Taipei Mission Stockholm | DOX Visumpartner</title>
        <meta name="description" content="Vi hjälper dig med legalisering av dokument för Taiwan. Komplett service via Taipei Mission i Stockholm. Apostille och dokumentverifiering." />
        <meta name="keywords" content="Taiwan, legalisering, Taipei Mission, Stockholm, dokument, apostille, Taipei" />
        <link rel="canonical" href="https://www.doxvl.se/legalisering/taiwan" />
        
        <meta property="og:title" content="Legalisering för Taiwan - Taipei Mission Stockholm | DOX Visumpartner" />
        <meta property="og:description" content="Komplett legaliseringsservice för Taiwan. Vi hanterar hela processen åt dig." />
        <meta property="og:url" content="https://www.doxvl.se/legalisering/taiwan" />
        <meta property="og:type" content="website" />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Legalisering för Taiwan",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB"
          },
          "description": "Legalisering av dokument för användning i Taiwan via Taipei Mission i Stockholm",
          "areaServed": ["SE", "TW"],
          "serviceType": "Document Legalization"
        })}} />
      </Head>

      <Header />

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#FE0000] to-[#cc0000] text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-6xl">🇹🇼</span>
              <div>
                <h1 className="text-3xl md:text-5xl font-bold">
                  Legalisering för Taiwan
                </h1>
                <p className="text-xl text-white/80">Taipei Mission in Sweden</p>
              </div>
            </div>
            <p className="text-xl text-white/90 mb-8 max-w-2xl">
              Ska du arbeta, studera eller göra affärer i Taiwan? Vi hjälper dig med 
              legalisering av dina dokument via Taipei Mission i Stockholm.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/bestall" className="bg-white hover:bg-gray-100 text-[#FE0000] font-semibold px-8 py-4 rounded-lg transition-colors">
                Beställ legalisering
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-[#FE0000] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                Kontakta oss
              </Link>
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Legalisering för Taiwan
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-700 mb-4">
                  Taiwan (Republiken Kina) har ett representationskontor i Stockholm som hanterar 
                  konsulära ärenden, inklusive legalisering av dokument.
                </p>
                <p className="text-gray-700 mb-4">
                  Taiwan är anslutet till Haagkonventionen, vilket innebär att många dokument 
                  kan förses med Apostille istället för traditionell legalisering.
                </p>
                <p className="text-gray-700">
                  Vi hjälper dig att avgöra vilken typ av legalisering som krävs för dina 
                  specifika dokument och hanterar hela processen åt dig.
                </p>
              </div>
              <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                <h3 className="font-semibold text-lg mb-4">Vanliga dokument för Taiwan:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-[#FE0000] mr-2">✓</span>
                    Examensbevis och utbildningsintyg
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#FE0000] mr-2">✓</span>
                    Personbevis och födelsebevis
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#FE0000] mr-2">✓</span>
                    Vigselbevis och familjedokument
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#FE0000] mr-2">✓</span>
                    Bolagshandlingar och fullmakter
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#FE0000] mr-2">✓</span>
                    Straffregisterutdrag
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#FE0000] mr-2">✓</span>
                    Arbetsgivarintyg
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Embassy Info Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Taipei Mission in Sweden
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-lg mb-4">Kontaktuppgifter</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-3">📍</span>
                    <div>
                      <strong>Adress:</strong><br />
                      {embassyInfo.address}<br />
                      {embassyInfo.postalCode}
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-3">📞</span>
                    <div>
                      <strong>Telefon:</strong><br />
                      {embassyInfo.phone}
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-3">✉️</span>
                    <div>
                      <strong>E-post:</strong><br />
                      {embassyInfo.email}
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-3">🕐</span>
                    <div>
                      <strong>Öppettider:</strong><br />
                      {embassyInfo.openingHours}
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                <h3 className="font-semibold text-lg mb-4">Vi sköter allt åt dig</h3>
                <p className="text-gray-700 mb-4">
                  Du behöver inte besöka Taipei Mission själv. Vi hanterar all kontakt och 
                  ser till att dina dokument blir korrekt legaliserade.
                </p>
                <ul className="space-y-2 text-gray-700 mb-6">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Apostille via Utrikesdepartementet
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Verifiering vid Taipei Mission
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Spårbar leverans till dig
                  </li>
                </ul>
                <Link href="/bestall" className="block w-full bg-[#FE0000] hover:bg-[#cc0000] text-white font-semibold py-3 rounded-lg transition-colors text-center">
                  Beställ nu
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[#FE0000] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Behöver du legalisera dokument för Taiwan?
            </h2>
            <p className="text-white/80 mb-8">
              Vi hjälper dig med hela processen. Beställ online eller kontakta oss för rådgivning.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/bestall" className="bg-white hover:bg-gray-100 text-[#FE0000] font-semibold px-8 py-4 rounded-lg transition-colors">
                Beställ legalisering
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-[#FE0000] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                Kontakta oss
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
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
