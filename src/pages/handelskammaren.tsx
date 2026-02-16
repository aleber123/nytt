import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';

export default function HandelskammarenLandingPage() {
  const { t } = useTranslation('common');

  return (
    <>
      <Head>
        <title>Handelskammaren Legalisering | Certifiering av Exportdokument | DOX Visumpartner</title>
        <meta name="description" content="Professionell hjälp med legalisering hos Handelskammaren. Vi hanterar ursprungsintyg, Certificate of Origin, fakturor och exportdokument för internationell handel." />
        <meta name="keywords" content="handelskammaren, handelskammaren legalisering, ursprungsintyg, certificate of origin, exportdokument, legalisering dokument, internationell handel, chamber of commerce" />
        
        <meta property="og:title" content="Handelskammaren Legalisering | DOX Visumpartner" />
        <meta property="og:description" content="Professionell hjälp med certifiering av handelsdokument hos Handelskammaren. Ursprungsintyg, fakturor och exportdokument." />
        <meta property="og:url" content="https://doxvl.se/handelskammaren" />
        <meta property="og:type" content="website" />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Handelskammaren Legalisering",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB",
            "telephone": "+46-8-40941900",
            "url": "https://doxvl.se",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Box 38",
              "postalCode": "121 25",
              "addressLocality": "Stockholm-Globen",
              "addressCountry": "SE"
            }
          },
          "description": "Certifiering och legalisering av kommersiella dokument hos Handelskammaren. Ursprungsintyg, fakturor och exportdokument för internationell handel.",
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
              "name": "Vad kostar legalisering hos Handelskammaren?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Priset varierar beroende på dokumenttyp och antal dokument. Kontakta oss för en exakt offert."
              }
            },
            {
              "@type": "Question",
              "name": "Hur lång tid tar Handelskammar-certifiering?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Handelskammar-certifiering tar normalt 2-5 arbetsdagar. Vi erbjuder även expresstjänster för brådskande ärenden."
              }
            },
            {
              "@type": "Question",
              "name": "Vilka dokument kan Handelskammaren certifiera?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Handelskammaren certifierar ursprungsintyg (Certificate of Origin), kommersiella fakturor, fraktdokument, packlista, försäkringscertifikat, hälso- och kvalitetsintyg samt agentavtal."
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
              <span className="inline-block bg-[#D4AF37] text-black text-sm font-semibold px-3 py-1 rounded-full mb-4">
                Handelskammaren
              </span>
              <h1 className="text-3xl md:text-5xl font-bold mb-6">
                Legalisering hos Handelskammaren
              </h1>
              <p className="text-xl text-gray-300 mb-4">
                Behöver du legalisera dokument hos Handelskammaren? Vi hjälper dig med hela processen – 
                från ursprungsintyg till kommersiella fakturor och exportdokument.
              </p>
              <p className="text-lg text-gray-400 mb-8">
                ✓ Snabb handläggning &nbsp; ✓ Experthjälp &nbsp; ✓ Kontakta oss för pris
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
              Vad är Handelskammaren?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-700 mb-4">
                  <strong>Handelskammaren</strong> (Chamber of Commerce) är en organisation som certifierar och legaliserar 
                  kommersiella dokument för internationell handel. Deras stämpel bekräftar att dokumenten 
                  är äkta och utfärdade av ett svenskt företag.
                </p>
                <p className="text-gray-700 mb-4">
                  Många länder, särskilt i <strong>Mellanöstern</strong> och <strong>Asien</strong>, kräver att handelsdokument är 
                  certifierade av Handelskammaren innan de kan användas för import/export.
                </p>
                <p className="text-gray-700 mb-4">
                  Efter Handelskammarens certifiering behöver dokumenten ofta också legaliseras hos 
                  <strong> Utrikesdepartementet (UD)</strong> och destinationslandets ambassad.
                </p>
                <p className="text-gray-700">
                  Vi på DOX Visumpartner hanterar hela processen åt dig – från Handelskammaren till ambassaden.
                </p>
              </div>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">Dokument vi hanterar:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <strong>Ursprungsintyg</strong> (Certificate of Origin)
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
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Bolagshandlingar
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
              Så fungerar processen
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-[#D4AF37] text-black rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">1</div>
                <h3 className="font-semibold mb-2">Beställ online</h3>
                <p className="text-gray-600 text-sm">Fyll i vårt beställningsformulär och ladda upp eller skicka dina dokument</p>
              </div>
              <div className="text-center bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-[#D4AF37] text-black rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">2</div>
                <h3 className="font-semibold mb-2">Vi granskar</h3>
                <p className="text-gray-600 text-sm">Vi kontrollerar att dokumenten uppfyller Handelskammarens krav</p>
              </div>
              <div className="text-center bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-[#D4AF37] text-black rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">3</div>
                <h3 className="font-semibold mb-2">Handelskammaren</h3>
                <p className="text-gray-600 text-sm">Vi lämnar in dokumenten för certifiering hos Handelskammaren</p>
              </div>
              <div className="text-center bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-[#D4AF37] text-black rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">4</div>
                <h3 className="font-semibold mb-2">Leverans</h3>
                <p className="text-gray-600 text-sm">Vi skickar tillbaka dina certifierade dokument via DHL eller PostNord</p>
              </div>
            </div>
          </div>
        </section>

        {/* Countries Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 text-center">
              Länder som kräver Handelskammar-certifiering
            </h2>
            <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
              Följande länder kräver ofta att handelsdokument är certifierade av Handelskammaren 
              innan de kan användas för import och export.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { flag: '🇸🇦', name: 'Saudiarabien', link: '/legalisering/saudiarabien' },
                { flag: '🇦🇪', name: 'Förenade Arabemiraten', link: '/legalisering/uae' },
                { flag: '🇶🇦', name: 'Qatar', link: '/legalisering/qatar' },
                { flag: '🇰🇼', name: 'Kuwait', link: '/legalisering/kuwait' },
                { flag: '🇧🇭', name: 'Bahrain', link: '/legalisering/bahrain' },
                { flag: '🇴🇲', name: 'Oman', link: '/legalisering/oman' },
                { flag: '🇪🇬', name: 'Egypten', link: '/legalisering/egypten' },
                { flag: '🇯🇴', name: 'Jordanien', link: '/legalisering/jordanien' },
                { flag: '🇮🇶', name: 'Irak', link: '/legalisering/irak' },
                { flag: '🇱🇧', name: 'Libanon', link: '/legalisering/libanon' },
                { flag: '🇱🇾', name: 'Libyen', link: '/legalisering/libyen' },
                { flag: '🇸🇾', name: 'Syrien', link: '/legalisering/syrien' },
              ].map((country) => (
                <div key={country.name} className="bg-gray-50 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
                  <span className="text-3xl mb-2 block">{country.flag}</span>
                  <span className="font-medium">{country.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Priser för Handelskammar-legalisering
            </h2>
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 border-b">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">Handelskammar-certifiering</h3>
                      <p className="text-gray-600 text-sm">Per dokument</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-[#2E2D2C]">Kontakta oss</span>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-gray-50">
                  <p className="text-gray-600 text-sm mb-4">
                    Priset inkluderar vår serviceavgift och Handelskammarens officiella avgift. 
                    Exakt pris beror på dokumenttyp och antal.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>✓ Granskning av dokument</li>
                    <li>✓ Inlämning till Handelskammaren</li>
                    <li>✓ Upphämtning av certifierade dokument</li>
                    <li>✓ Statusuppdateringar via e-post</li>
                  </ul>
                </div>
              </div>
              <p className="text-center text-gray-500 text-sm mt-4">
                Behöver du även UD-legalisering eller ambassadlegalisering? Vi erbjuder paketpriser.
              </p>
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
                <h3 className="font-semibold text-lg mb-2">Vad är ett ursprungsintyg (Certificate of Origin)?</h3>
                <p className="text-gray-700">
                  Ett ursprungsintyg är ett dokument som intygar att varor har sitt ursprung i ett visst land. 
                  Det krävs ofta vid export till länder utanför EU och måste certifieras av Handelskammaren.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Hur lång tid tar Handelskammar-certifiering?</h3>
                <p className="text-gray-700">
                  Handelskammar-certifiering tar normalt 2-5 arbetsdagar. Vi erbjuder även expresstjänster 
                  för brådskande ärenden. Kontakta oss för mer information.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Behöver jag även UD-legalisering?</h3>
                <p className="text-gray-700">
                  Ja, för många länder krävs att dokumenten efter Handelskammarens certifiering även 
                  legaliseras hos Utrikesdepartementet (UD) och sedan hos destinationslandets ambassad. 
                  Vi hjälper dig med hela kedjan.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Vad kostar legalisering hos Handelskammaren?</h3>
                <p className="text-gray-700">
                  Priset varierar beroende på dokumenttyp och antal dokument. Kontakta oss för en exakt offert.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Related Services */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Relaterade tjänster
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Link href="/tjanster/utrikesdepartementet" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-lg mb-2">UD-legalisering</h3>
                <p className="text-gray-600 text-sm">Legalisering hos Utrikesdepartementet för dokument som ska användas utomlands.</p>
              </Link>
              <Link href="/tjanster/ambassadlegalisering" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-lg mb-2">Ambassadlegalisering</h3>
                <p className="text-gray-600 text-sm">Legalisering hos destinationslandets ambassad för full giltighet.</p>
              </Link>
              <Link href="/tjanster/apostille" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-lg mb-2">Apostille</h3>
                <p className="text-gray-600 text-sm">Internationell legalisering för länder anslutna till Haagkonventionen.</p>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[#2E2D2C] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Behöver du hjälp med Handelskammar-legalisering?
            </h2>
            <p className="text-gray-300 mb-8">
              Vi har lång erfarenhet av att hantera exportdokument för företag. Kontakta oss för en offert 
              eller beställ direkt online.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/bestall" className="bg-[#D4AF37] hover:bg-[#C4A030] text-black font-semibold px-8 py-4 rounded-lg transition-colors">
                Beställ nu
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-black text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                Kontakta oss
              </Link>
            </div>
            <p className="text-gray-400 text-sm mt-6">
              📞 Ring oss: 08-40941900 &nbsp; | &nbsp; 📧 E-post: info@doxvl.se
            </p>
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
