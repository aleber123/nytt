import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';



export default function NotariusPublicusPage() {
  const { t } = useTranslation('common');

  return (
    <>
      <Head>
        <title>Notarius Publicus - Notarisering av dokument | DOX Visumpartner</title>
        <meta name="description" content="Notarius Publicus bestyrker underskrifter och dokument. Vi hjälper dig med notarisering för användning utomlands. Snabb service från 499 kr per dokument." />
        <meta name="keywords" content="notarius publicus, notarisering, bestyrka underskrift, legalisering, dokument, Sverige" />
        <link rel="canonical" href="https://www.doxvl.se/tjanster/notarius-publicus" />
        
        <meta property="og:title" content="Notarius Publicus - Notarisering av dokument | DOX Visumpartner" />
        <meta property="og:description" content="Professionell notarisering av dokument för användning utomlands. Fast pris, snabb service." />
        <meta property="og:url" content="https://www.doxvl.se/tjanster/notarius-publicus" />
        <meta property="og:type" content="website" />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Notarius Publicus - Notarisering",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB"
          },
          "description": "Notarisering av dokument och bestyrkande av underskrifter",
          "areaServed": "SE",
          "serviceType": "Notarization"
        })}} />
      </Head>

      

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#2E2D2C] to-[#1a1918] text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-5xl font-bold mb-6">
                Notarius Publicus
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Notarius Publicus bestyrker underskrifter och intygar att dokument är äkta. 
                Detta är ofta första steget för att kunna använda dokument utomlands.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/bestall" className="bg-[#D4AF37] hover:bg-[#C4A030] text-black font-semibold px-8 py-4 rounded-lg transition-colors">
                  Beställ nu – från 499 kr
                </Link>
                <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-black text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                  Kontakta oss
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* What is Notarius Publicus Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Vad gör Notarius Publicus?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-700 mb-4">
                  Notarius Publicus är en offentlig tjänsteman som utses av Länsstyrelsen. 
                  Deras uppgift är att bestyrka underskrifter, intyga att kopior stämmer överens 
                  med original, och utföra andra notariella förrättningar.
                </p>
                <p className="text-gray-700 mb-4">
                  När du ska använda privata dokument (som fullmakter, avtal eller intyg) utomlands, 
                  kräver många länder att dokumenten först notariseras av Notarius Publicus.
                </p>
                <p className="text-gray-700">
                  Efter notariseringen kan dokumentet sedan legaliseras hos Utrikesdepartementet 
                  och eventuellt ambassaden för det land där det ska användas.
                </p>
              </div>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">Vanliga notariseringar:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Bestyrkande av underskrifter
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Fullmakter och avtal
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Kopior av pass och ID-handlingar
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Bolagshandlingar och protokoll
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Äktenskapsintyg och samtycken
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Översättningar (intyg om korrekthet)
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
              Legaliseringskedjan
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { step: '1', title: 'Notarius Publicus', desc: 'Bestyrker underskriften och dokumentets äkthet.', active: true },
                { step: '2', title: 'Utrikesdepartementet', desc: 'Verifierar Notarius Publicus stämpel.' },
                { step: '3', title: 'Ambassaden', desc: 'Slutlig legalisering för destinationslandet.' },
              ].map((item) => (
                <div key={item.step} className={`p-6 rounded-lg text-center ${item.active ? 'bg-[#D4AF37] text-black' : 'bg-white shadow-sm'}`}>
                  <div className={`w-12 h-12 ${item.active ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'} font-bold text-xl rounded-full flex items-center justify-center mx-auto mb-4`}>
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className={`text-sm ${item.active ? 'text-black/80' : 'text-gray-600'}`}>{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-gray-600 mt-8">
              Vi hjälper dig genom hela kedjan – från notarisering till färdig legalisering.
            </p>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Priser
            </h2>
            <div className="max-w-md mx-auto bg-gray-50 rounded-lg p-8 text-center">
              <div className="text-4xl font-bold text-[#2E2D2C] mb-2">från 499 kr</div>
              <div className="text-gray-600 mb-6">per dokument</div>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Notarius Publicus avgift inkluderad
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Granskning av dokument
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Snabb handläggning
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Spårbar leverans
                </li>
              </ul>
              <Link href="/bestall" className="block w-full bg-[#D4AF37] hover:bg-[#C4A030] text-black font-semibold py-4 rounded-lg transition-colors">
                Beställ nu
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Vanliga frågor
            </h2>
            <div className="space-y-4">
              {[
                { q: 'Måste jag vara närvarande vid notariseringen?', a: 'Det beror på dokumenttypen. För bestyrkande av din egen underskrift måste du vara närvarande. För kopior och andra dokument kan vi hantera det åt dig.' },
                { q: 'Hur lång tid tar notarisering?', a: 'Själva notariseringen tar normalt 1-2 arbetsdagar. Om du behöver hela legaliseringskedjan (UD + ambassad) tar det längre.' },
                { q: 'Vilka dokument behöver notariseras?', a: 'Privata dokument som fullmakter, avtal, och intyg behöver ofta notariseras. Offentliga dokument (från myndigheter) går direkt till UD.' },
                { q: 'Kan ni hjälpa med dokument på andra språk?', a: 'Ja, vi kan hantera dokument på de flesta språk. Vid behov kan vi även ordna auktoriserad översättning.' },
              ].map((faq, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
                  <p className="text-gray-600">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[#2E2D2C] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Behöver du notarisering?
            </h2>
            <p className="text-gray-300 mb-8">
              Vi hjälper dig med notarisering och hela legaliseringsprocessen. Beställ online eller kontakta oss.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/bestall" className="bg-[#D4AF37] hover:bg-[#C4A030] text-black font-semibold px-8 py-4 rounded-lg transition-colors">
                Beställ nu
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-black text-white font-semibold px-8 py-4 rounded-lg transition-colors">
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
