import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';



export default function SriLankaLegaliseringPage() {
  const { t } = useTranslation('common');

  const embassyInfo = {
    name: 'Sri Lankas ambassad i Stockholm',
    address: 'Strandvägen 39, 1 tr',
    postalCode: '114 56 Stockholm',
    phone: '+46 8 663 35 23',
    email: 'consular.stockholm@mfa.gov.lk',
    website: 'https://www.stockholm.embassy.gov.lk',
    openingHours: 'Måndag-Fredag 09:00-17:00, Konsulär: 09:30-13:30'
  };

  return (
    <>
      <Head>
        <title>Legalisering för Sri Lanka - Sri Lankas ambassad Stockholm | DOX Visumpartner</title>
        <meta name="description" content="Vi hjälper dig med legalisering av dokument för Sri Lanka. Komplett service inkl. notarisering, UD och Sri Lankas ambassad i Stockholm." />
        <meta name="keywords" content="Sri Lanka, legalisering, ambassad, Stockholm, dokument, Colombo, visum" />
        <link rel="canonical" href="https://www.doxvl.se/legalisering/sri-lanka" />
        
        <meta property="og:title" content="Legalisering för Sri Lanka - Sri Lankas ambassad Stockholm | DOX Visumpartner" />
        <meta property="og:description" content="Komplett legaliseringsservice för Sri Lanka. Vi hanterar hela processen åt dig." />
        <meta property="og:url" content="https://www.doxvl.se/legalisering/sri-lanka" />
        <meta property="og:type" content="website" />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Legalisering för Sri Lanka",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB"
          },
          "description": "Legalisering av dokument för användning i Sri Lanka via Sri Lankas ambassad i Stockholm",
          "areaServed": ["SE", "LK"],
          "serviceType": "Document Legalization"
        })}} />
      </Head>

      

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#8D153A] to-[#5d0f27] text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-6xl">🇱🇰</span>
              <div>
                <h1 className="text-3xl md:text-5xl font-bold">
                  Legalisering för Sri Lanka
                </h1>
                <p className="text-xl text-white/80">Sri Lankas ambassad i Stockholm</p>
              </div>
            </div>
            <p className="text-xl text-white/90 mb-8 max-w-2xl">
              Planerar du att arbeta, studera eller göra affärer i Sri Lanka? Vi hjälper dig med 
              komplett legalisering av dina dokument.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/bestall" className="bg-[#FFBE29] hover:bg-[#e5ab25] text-black font-semibold px-8 py-4 rounded-lg transition-colors">
                Beställ legalisering
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-[#8D153A] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                Kontakta oss
              </Link>
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Varför behövs legalisering för Sri Lanka?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-700 mb-4">
                  Sri Lanka kräver att utländska dokument legaliseras innan de kan användas i landet. 
                  Detta gäller för arbete, studier, äktenskap och affärsärenden.
                </p>
                <p className="text-gray-700 mb-4">
                  Sri Lankas ambassad i Stockholm ligger på Strandvägen och hanterar legalisering 
                  av svenska dokument. Konsulära ärenden hanteras på förmiddagar.
                </p>
                <p className="text-gray-700">
                  Vi har erfarenhet av att hantera dokument för Sri Lanka och känner till 
                  ambassadens krav och rutiner.
                </p>
              </div>
              <div className="bg-[#8D153A]/5 p-6 rounded-lg border border-[#8D153A]/20">
                <h3 className="font-semibold text-lg mb-4">Vanliga dokument för Sri Lanka:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-[#8D153A] mr-2">✓</span>
                    Examensbevis och utbildningsintyg
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#8D153A] mr-2">✓</span>
                    Personbevis och födelsebevis
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#8D153A] mr-2">✓</span>
                    Vigselbevis och hindersprövning
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#8D153A] mr-2">✓</span>
                    Fullmakter och juridiska dokument
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#8D153A] mr-2">✓</span>
                    Bolagshandlingar
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#8D153A] mr-2">✓</span>
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
              Legaliseringsprocessen för Sri Lanka
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: '1', title: 'Notarius Publicus', desc: 'Privata dokument notariseras först.' },
                { step: '2', title: 'Utrikesdepartementet', desc: 'UD verifierar dokumentets äkthet.' },
                { step: '3', title: 'Sri Lankas ambassad', desc: 'Slutlig legalisering.' },
                { step: '4', title: 'Leverans', desc: 'Dokumenten skickas till dig.' },
              ].map((item) => (
                <div key={item.step} className="bg-white p-6 rounded-lg shadow-sm text-center">
                  <div className="w-12 h-12 bg-[#8D153A] text-white font-bold text-xl rounded-full flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Embassy Info Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Sri Lankas ambassad i Stockholm
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg">
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
              <div className="bg-[#8D153A]/5 p-6 rounded-lg border border-[#8D153A]/20">
                <h3 className="font-semibold text-lg mb-4">Vi sköter allt åt dig</h3>
                <p className="text-gray-700 mb-4">
                  Du behöver inte besöka ambassaden själv. Vi hanterar all kontakt med 
                  Sri Lankas ambassad och ser till att dina dokument blir korrekt legaliserade.
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
                <Link href="/bestall" className="block w-full bg-[#8D153A] hover:bg-[#5d0f27] text-white font-semibold py-3 rounded-lg transition-colors text-center">
                  Beställ nu
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[#8D153A] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Behöver du legalisera dokument för Sri Lanka?
            </h2>
            <p className="text-white/80 mb-8">
              Vi hjälper dig med hela processen. Beställ online eller kontakta oss för rådgivning.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/bestall" className="bg-[#FFBE29] hover:bg-[#e5ab25] text-black font-semibold px-8 py-4 rounded-lg transition-colors">
                Beställ legalisering
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-[#8D153A] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
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
