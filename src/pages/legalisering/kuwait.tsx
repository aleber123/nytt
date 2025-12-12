import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function KuwaitLegaliseringPage() {
  const { t } = useTranslation('common');

  const embassyInfo = {
    name: 'Kuwaits ambassad i Stockholm',
    address: 'Box 7279',
    postalCode: '103 89 Stockholm',
    phone: '+46 8 679 70 00',
    email: 'info@kuwaitembassy.se',
    website: 'https://kuwaitembassy.se',
    openingHours: 'Måndag-Fredag 09:00-16:00, Konsulär: 09:00-13:00'
  };

  return (
    <>
      <Head>
        <title>Legalisering för Kuwait - Kuwaits ambassad Stockholm | DOX Visumpartner</title>
        <meta name="description" content="Vi hjälper dig med legalisering av dokument för Kuwait. Komplett service inkl. notarisering, UD och Kuwaits ambassad i Stockholm. Fast pris, snabb hantering." />
        <meta name="keywords" content="Kuwait, legalisering, ambassad, Stockholm, dokument, Kuwait City, arbete, visum" />
        <link rel="canonical" href="https://www.doxvl.se/legalisering/kuwait" />
        
        <meta property="og:title" content="Legalisering för Kuwait - Kuwaits ambassad Stockholm | DOX Visumpartner" />
        <meta property="og:description" content="Komplett legaliseringsservice för Kuwait. Vi hanterar hela processen åt dig." />
        <meta property="og:url" content="https://www.doxvl.se/legalisering/kuwait" />
        <meta property="og:type" content="website" />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Legalisering för Kuwait",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB"
          },
          "description": "Legalisering av dokument för användning i Kuwait via Kuwaits ambassad i Stockholm",
          "areaServed": ["SE", "KW"],
          "serviceType": "Document Legalization"
        })}} />
      </Head>

      <Header />

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#007A3D] to-[#005a2d] text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-6xl">🇰🇼</span>
              <div>
                <h1 className="text-3xl md:text-5xl font-bold">
                  Legalisering för Kuwait
                </h1>
                <p className="text-xl text-white/80">Kuwaits ambassad i Stockholm</p>
              </div>
            </div>
            <p className="text-xl text-white/90 mb-8 max-w-2xl">
              Planerar du att arbeta, studera eller göra affärer i Kuwait? Vi hjälper dig med 
              komplett legalisering av dina dokument – från notarisering till ambassadstämpel.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/bestall" className="bg-white hover:bg-gray-100 text-[#007A3D] font-semibold px-8 py-4 rounded-lg transition-colors">
                Beställ legalisering
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-[#007A3D] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                Kontakta oss
              </Link>
            </div>
          </div>
        </section>

        {/* Why Kuwait Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Varför behövs legalisering för Kuwait?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-700 mb-4">
                  Kuwait kräver att utländska dokument legaliseras innan de kan användas i landet. 
                  Detta är ett krav för arbetsvisum, företagsetablering och familjeärenden.
                </p>
                <p className="text-gray-700 mb-4">
                  Kuwait har sedan 1994 en ambassad i Stockholm som hanterar legalisering av 
                  svenska dokument. Processen kräver flera steg som vi kan hjälpa dig med.
                </p>
                <p className="text-gray-700">
                  Vi har lång erfarenhet av att hantera dokument för Kuwait och känner till 
                  ambassadens krav och rutiner.
                </p>
              </div>
              <div className="bg-[#007A3D]/5 p-6 rounded-lg border border-[#007A3D]/20">
                <h3 className="font-semibold text-lg mb-4">Vanliga dokument för Kuwait:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-[#007A3D] mr-2">✓</span>
                    Examensbevis och utbildningsintyg
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#007A3D] mr-2">✓</span>
                    Arbetsgivarintyg och CV
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#007A3D] mr-2">✓</span>
                    Personbevis och födelsebevis
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#007A3D] mr-2">✓</span>
                    Vigselbevis och skilsmässodom
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#007A3D] mr-2">✓</span>
                    Bolagshandlingar och fullmakter
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#007A3D] mr-2">✓</span>
                    Medicinska intyg
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Legaliseringsprocessen för Kuwait
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: '1', title: 'Notarius Publicus', desc: 'Privata dokument notariseras först.', time: '1-2 dagar' },
                { step: '2', title: 'Utrikesdepartementet', desc: 'UD verifierar dokumentets äkthet.', time: '2-3 dagar' },
                { step: '3', title: 'Kuwaits ambassad', desc: 'Slutlig legalisering för Kuwait.', time: '3-5 dagar' },
                { step: '4', title: 'Leverans', desc: 'Dokumenten skickas till dig.', time: '1-2 dagar' },
              ].map((item) => (
                <div key={item.step} className="bg-white p-6 rounded-lg shadow-sm text-center">
                  <div className="w-12 h-12 bg-[#007A3D] text-white font-bold text-xl rounded-full flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{item.desc}</p>
                  <span className="text-xs text-[#007A3D] font-medium">{item.time}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-gray-600 mt-8">
              Total handläggningstid: ca 7-12 arbetsdagar
            </p>
          </div>
        </section>

        {/* Embassy Info Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Kuwaits ambassad i Stockholm
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">Kontaktuppgifter</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-3">📍</span>
                    <div>
                      <strong>Postadress:</strong><br />
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
                    <span className="text-gray-400 mr-3">🌐</span>
                    <div>
                      <strong>Webbplats:</strong><br />
                      <a href={embassyInfo.website} target="_blank" rel="noopener noreferrer" className="text-[#007A3D] hover:underline">
                        {embassyInfo.website}
                      </a>
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
              <div className="bg-[#007A3D]/5 p-6 rounded-lg border border-[#007A3D]/20">
                <h3 className="font-semibold text-lg mb-4">Vi sköter allt åt dig</h3>
                <p className="text-gray-700 mb-4">
                  Du behöver inte besöka ambassaden själv. Vi hanterar all kontakt med 
                  Kuwaits ambassad och ser till att dina dokument blir korrekt legaliserade.
                </p>
                <ul className="space-y-2 text-gray-700 mb-6">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Vi lämnar in dina dokument
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Vi hämtar ut dem när de är klara
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Vi skickar dem till dig
                  </li>
                </ul>
                <Link href="/bestall" className="block w-full bg-[#007A3D] hover:bg-[#005a2d] text-white font-semibold py-3 rounded-lg transition-colors text-center">
                  Beställ nu
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[#007A3D] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Redo att legalisera dina dokument för Kuwait?
            </h2>
            <p className="text-white/80 mb-8">
              Vi har hjälpt hundratals kunder med legalisering för Kuwait. Beställ online eller kontakta oss för rådgivning.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/bestall" className="bg-white hover:bg-gray-100 text-[#007A3D] font-semibold px-8 py-4 rounded-lg transition-colors">
                Beställ legalisering
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-[#007A3D] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
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
