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
            "name": "DOX Visumpartner AB",
            "telephone": "+46-8-40941900",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Box 38",
              "postalCode": "121 25",
              "addressLocality": "Stockholm-Globen",
              "addressCountry": "SE"
            }
          },
          "description": "Certifiering av kommersiella dokument för internationell handel hos Handelskammaren. Ursprungsintyg, fakturor och exportdokument.",
          "areaServed": "SE",
          "serviceType": "Document Certification",
          "offers": {
            "@type": "Offer",
            "price": "2250",
            "priceCurrency": "SEK",
            "priceValidUntil": "2026-12-31"
          }
        })}} />
        
        {/* FAQ Schema for SEO */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Vad är Handelskammaren?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Handelskammaren (Chamber of Commerce) är en organisation som certifierar och legaliserar kommersiella dokument för internationell handel. Deras stämpel bekräftar att dokumenten är äkta och utfärdade av ett svenskt företag."
              }
            },
            {
              "@type": "Question",
              "name": "Vilka dokument kan Handelskammaren certifiera?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Handelskammaren certifierar ursprungsintyg (Certificate of Origin), kommersiella fakturor, fraktdokument, packlista, försäkringscertifikat, hälso- och kvalitetsintyg samt agentavtal och distributörsavtal."
              }
            },
            {
              "@type": "Question",
              "name": "Vilka länder kräver Handelskammar-certifiering?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Många länder i Mellanöstern kräver Handelskammar-certifiering, inklusive Saudiarabien, Förenade Arabemiraten (UAE), Qatar, Kuwait, Bahrain, Oman, Egypten och Jordanien."
              }
            },
            {
              "@type": "Question",
              "name": "Vad kostar legalisering hos Handelskammaren?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Legalisering hos Handelskammaren kostar från 2250 kr per dokument. Priset kan variera beroende på dokumenttyp och antal dokument."
              }
            },
            {
              "@type": "Question",
              "name": "Hur lång tid tar Handelskammar-certifiering?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Handelskammar-certifiering tar normalt 2-5 arbetsdagar. Vi erbjuder även expresstjänster för brådskande ärenden."
              }
            }
          ]
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
                  Beställ nu
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

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Vanliga frågor om Handelskammaren
            </h2>
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Vad är Handelskammaren?</h3>
                <p className="text-gray-700">
                  Handelskammaren (Chamber of Commerce) är en organisation som certifierar och legaliserar 
                  kommersiella dokument för internationell handel. Deras stämpel bekräftar att dokumenten 
                  är äkta och utfärdade av ett svenskt företag.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Vilka dokument kan Handelskammaren certifiera?</h3>
                <p className="text-gray-700">
                  Handelskammaren certifierar ursprungsintyg (Certificate of Origin), kommersiella fakturor, 
                  fraktdokument, packlista, försäkringscertifikat, hälso- och kvalitetsintyg samt agentavtal 
                  och distributörsavtal.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Vilka länder kräver Handelskammar-certifiering?</h3>
                <p className="text-gray-700">
                  Många länder i Mellanöstern kräver Handelskammar-certifiering, inklusive Saudiarabien, 
                  Förenade Arabemiraten (UAE), Qatar, Kuwait, Bahrain, Oman, Egypten och Jordanien.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Vad kostar legalisering hos Handelskammaren?</h3>
                <p className="text-gray-700">
                  Legalisering hos Handelskammaren kostar från 2250 kr per dokument. Priset kan variera 
                  beroende på dokumenttyp och antal dokument. Kontakta oss för en exakt offert.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Hur lång tid tar Handelskammar-certifiering?</h3>
                <p className="text-gray-700">
                  Handelskammar-certifiering tar normalt 2-5 arbetsdagar. Vi erbjuder även expresstjänster 
                  för brådskande ärenden.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Så fungerar processen
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#D4AF37] text-black rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">1</div>
                <h3 className="font-semibold mb-2">Beställ online</h3>
                <p className="text-gray-600 text-sm">Fyll i vårt beställningsformulär och ladda upp dina dokument</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#D4AF37] text-black rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">2</div>
                <h3 className="font-semibold mb-2">Vi granskar</h3>
                <p className="text-gray-600 text-sm">Vi kontrollerar att dokumenten uppfyller kraven</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#D4AF37] text-black rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">3</div>
                <h3 className="font-semibold mb-2">Handelskammaren</h3>
                <p className="text-gray-600 text-sm">Vi lämnar in dokumenten för certifiering</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#D4AF37] text-black rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">4</div>
                <h3 className="font-semibold mb-2">Leverans</h3>
                <p className="text-gray-600 text-sm">Vi skickar tillbaka dina certifierade dokument</p>
              </div>
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
