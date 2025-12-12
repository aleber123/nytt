import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function UtrikesdepartementetPage() {
  const { t } = useTranslation('common');

  return (
    <>
      <Head>
        <title>Legalisering hos Utrikesdepartementet (UD) | DOX Visumpartner</title>
        <meta name="description" content="Vi hjälper dig med legalisering av dokument hos Utrikesdepartementet (UD). Snabb handläggning, fast pris från 955 kr. Krävs för dokument som ska användas utomlands." />
        <meta name="keywords" content="utrikesdepartementet, UD, legalisering, dokument, Sverige, apostille, stämpel" />
        <link rel="canonical" href="https://www.doxvl.se/tjanster/utrikesdepartementet" />
        
        <meta property="og:title" content="Legalisering hos Utrikesdepartementet (UD) | DOX Visumpartner" />
        <meta property="og:description" content="Professionell hjälp med legalisering av dokument hos Utrikesdepartementet. Fast pris, snabb service." />
        <meta property="og:url" content="https://www.doxvl.se/tjanster/utrikesdepartementet" />
        <meta property="og:type" content="website" />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Legalisering hos Utrikesdepartementet",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB"
          },
          "description": "Legalisering av dokument hos Utrikesdepartementet för användning utomlands",
          "areaServed": "SE",
          "serviceType": "Document Legalization"
        })}} />
      </Head>

      <Header />

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#2E2D2C] to-[#1a1918] text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-5xl font-bold mb-6">
                Legalisering hos Utrikesdepartementet
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Utrikesdepartementet (UD) verifierar att svenska dokument är äkta innan de kan användas utomlands. 
                Vi hanterar hela processen åt dig – snabbt och professionellt.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/bestall" className="bg-[#D4AF37] hover:bg-[#C4A030] text-black font-semibold px-8 py-4 rounded-lg transition-colors">
                  Beställ nu – från 955 kr
                </Link>
                <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-black text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                  Kontakta oss
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* What is UD Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Vad är legalisering hos Utrikesdepartementet?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-700 mb-4">
                  Utrikesdepartementet (UD) är den svenska myndighet som verifierar äktheten av svenska offentliga dokument 
                  som ska användas i andra länder. Detta kallas för <strong>legalisering</strong>.
                </p>
                <p className="text-gray-700 mb-4">
                  UD-stämpeln bekräftar att dokumentet är utfärdat av en behörig svensk myndighet och att underskriften 
                  är äkta. Detta är ofta ett krav för att dokumentet ska accepteras utomlands.
                </p>
                <p className="text-gray-700">
                  För länder som är anslutna till Haagkonventionen utfärdar UD istället en <strong>Apostille</strong>, 
                  som är en internationellt erkänd stämpel.
                </p>
              </div>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">Vanliga dokument som legaliseras:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Personbevis och utdrag från Skatteverket
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Examensbevis och utbildningsintyg
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Registerutdrag från Bolagsverket
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Domar och juridiska dokument
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Vigselbevis och födelsebevis
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Fullmakter och avtal
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
              Så fungerar det
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: '1', title: 'Beställ online', desc: 'Fyll i vårt enkla beställningsformulär och ladda upp dina dokument.' },
                { step: '2', title: 'Skicka dokument', desc: 'Skicka originaldokumenten till oss eller boka upphämtning.' },
                { step: '3', title: 'Vi hanterar UD', desc: 'Vi lämnar in dina dokument till Utrikesdepartementet.' },
                { step: '4', title: 'Leverans', desc: 'Du får tillbaka dina legaliserade dokument inom 3-5 arbetsdagar.' },
              ].map((item) => (
                <div key={item.step} className="bg-white p-6 rounded-lg shadow-sm text-center">
                  <div className="w-12 h-12 bg-[#D4AF37] text-black font-bold text-xl rounded-full flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
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
              <div className="text-4xl font-bold text-[#2E2D2C] mb-2">från 955 kr</div>
              <div className="text-gray-600 mb-6">per dokument</div>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  UD:s avgift inkluderad
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Professionell hantering
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Spårbar leverans
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Support under hela processen
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
                { q: 'Hur lång tid tar legalisering hos UD?', a: 'Normalt tar det 3-5 arbetsdagar från att vi mottagit dina dokument. Vid brådskande ärenden kan vi erbjuda expresshantering.' },
                { q: 'Vilka dokument kan legaliseras?', a: 'De flesta svenska offentliga dokument kan legaliseras, t.ex. personbevis, examensbevis, registerutdrag och juridiska dokument.' },
                { q: 'Vad är skillnaden mellan legalisering och apostille?', a: 'Apostille används för länder som är anslutna till Haagkonventionen. För andra länder krävs traditionell legalisering via UD och sedan ambassaden.' },
                { q: 'Behöver jag notarisering först?', a: 'Det beror på dokumenttypen. Privata dokument (t.ex. fullmakter) behöver ofta notariseras av Notarius Publicus innan UD kan legalisera dem.' },
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
              Redo att komma igång?
            </h2>
            <p className="text-gray-300 mb-8">
              Vi hjälper dig med hela legaliseringsprocessen. Beställ online eller kontakta oss för rådgivning.
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
