import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';



export default function HandelskammarenPage() {
  const { t } = useTranslation('common');

  return (
    <>
      <Head>
        <title>Legalisering hos Handelskammaren | DOX Visumpartner</title>
        <meta name="description" content="Handelskammaren certifierar kommersiella dokument för internationell handel. Vi hjälper dig med ursprungsintyg, fakturor och exportdokument. Från 2250 kr." />
        <meta name="keywords" content="handelskammaren, ursprungsintyg, certificate of origin, exportdokument, legalisering, internationell handel" />
        <link rel="canonical" href="https://www.doxvl.se/tjanster/handelskammaren" />
        
        <meta property="og:title" content="Legalisering hos Handelskammaren | DOX Visumpartner" />
        <meta property="og:description" content="Professionell hjälp med certifiering av handelsdokument hos Handelskammaren." />
        <meta property="og:url" content="https://www.doxvl.se/tjanster/handelskammaren" />
        <meta property="og:type" content="website" />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Legalisering hos Handelskammaren",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB"
          },
          "description": "Certifiering av kommersiella dokument för internationell handel",
          "areaServed": "SE",
          "serviceType": "Document Certification"
        })}} />
      </Head>

      

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#2E2D2C] to-[#1a1918] text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-5xl font-bold mb-6">
                Legalisering hos Handelskammaren
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Handelskammaren certifierar kommersiella dokument för internationell handel. 
                Vi hanterar ursprungsintyg, fakturor och andra exportdokument åt dig.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/bestall" className="bg-[#D4AF37] hover:bg-[#C4A030] text-black font-semibold px-8 py-4 rounded-lg transition-colors">
                  Beställ nu – från 2 250 kr
                </Link>
                <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-black text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                  Kontakta oss
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* What is Handelskammaren Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Vad gör Handelskammaren?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-700 mb-4">
                  Handelskammaren (Chamber of Commerce) är en organisation som certifierar och legaliserar 
                  kommersiella dokument för internationell handel. Deras stämpel bekräftar att dokumenten 
                  är äkta och utfärdade av ett svenskt företag.
                </p>
                <p className="text-gray-700 mb-4">
                  Många länder, särskilt i Mellanöstern och Asien, kräver att handelsdokument är 
                  certifierade av Handelskammaren innan de kan användas för import/export.
                </p>
                <p className="text-gray-700">
                  Efter Handelskammarens certifiering behöver dokumenten ofta också legaliseras hos 
                  Utrikesdepartementet och destinationslandets ambassad.
                </p>
              </div>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">Dokument vi hanterar:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Ursprungsintyg (Certificate of Origin)
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Kommersiella fakturor
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Fraktdokument och packlista
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Försäkringscertifikat
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Hälso- och kvalitetsintyg
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Agentavtal och distributörsavtal
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Countries Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Länder som kräver Handelskammar-certifiering
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { flag: '🇸🇦', name: 'Saudiarabien' },
                { flag: '🇦🇪', name: 'Förenade Arabemiraten' },
                { flag: '🇶🇦', name: 'Qatar' },
                { flag: '🇰🇼', name: 'Kuwait' },
                { flag: '🇧🇭', name: 'Bahrain' },
                { flag: '🇴🇲', name: 'Oman' },
                { flag: '🇪🇬', name: 'Egypten' },
                { flag: '🇯🇴', name: 'Jordanien' },
              ].map((country) => (
                <div key={country.name} className="bg-white p-4 rounded-lg shadow-sm text-center">
                  <span className="text-3xl mb-2 block">{country.flag}</span>
                  <span className="font-medium">{country.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Priser
            </h2>
            <div className="max-w-md mx-auto bg-gray-50 rounded-lg p-8 text-center">
              <div className="text-4xl font-bold text-[#2E2D2C] mb-2">från 2 250 kr</div>
              <div className="text-gray-600 mb-6">per dokument</div>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Handelskammarens avgift inkluderad
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Granskning av dokument
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Professionell hantering
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

        {/* CTA Section */}
        <section className="py-16 bg-[#2E2D2C] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Behöver du hjälp med handelsdokument?
            </h2>
            <p className="text-gray-300 mb-8">
              Vi har lång erfarenhet av att hantera exportdokument för företag. Kontakta oss för en offert.
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
