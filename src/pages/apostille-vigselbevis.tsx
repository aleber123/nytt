import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';

export default function ApostilleVigselbevisPage() {
  const faq = [
    {
      q: 'Vad är en Apostille på ett vigselbevis?',
      a: 'En Apostille är en internationell stämpel som verifierar att ditt svenska vigselbevis är äkta. Den utfärdas av Utrikesdepartementet (UD) och gör att dokumentet accepteras i alla länder som är med i Haagkonventionen – över 120 länder.',
    },
    {
      q: 'Behöver jag Apostille eller full legalisering för mitt vigselbevis?',
      a: 'Det beror på destinationslandet. Länder som är med i Haagkonventionen (t.ex. USA, EU-länder, Australien) accepterar Apostille. Länder utanför konventionen (t.ex. Saudiarabien, UAE, Kina) kräver full ambassadlegalisering.',
    },
    {
      q: 'Hur lång tid tar det att få Apostille på ett vigselbevis?',
      a: 'Normal handläggningstid är 5-7 arbetsdagar. Vi erbjuder även expresshantering från 3 arbetsdagar. Full ambassadlegalisering tar 2-4 veckor beroende på land.',
    },
    {
      q: 'Behöver jag översätta mitt vigselbevis?',
      a: 'Ja, i de flesta fall krävs en auktoriserad översättning till engelska eller destinationslandets språk. Vi erbjuder auktoriserad översättning som tilläggstjänst.',
    },
    {
      q: 'Kan jag legalisera ett vigselbevis utfärdat av Svenska kyrkan?',
      a: 'Ja, vigselbevis utfärdade av Svenska kyrkan, Skatteverket eller andra svenska myndigheter kan legaliseras. Det viktiga är att dokumentet är ett officiellt svenskt dokument.',
    },
    {
      q: 'Vad kostar Apostille på ett vigselbevis?',
      a: 'Apostille från 695 kr. Full legalisering inklusive ambassadstämpel från 1 495 kr. Priset varierar beroende på destinationsland. Kontakta oss för exakt pris.',
    },
  ];

  const useCases = [
    { icon: '💍', title: 'Gifta sig utomlands', desc: 'Bevisa att du är gift eller ogift för att kunna gifta dig i ett annat land' },
    { icon: '🏠', title: 'Flytta utomlands', desc: 'Uppehållstillstånd och medborgarskap kräver ofta legaliserat vigselbevis' },
    { icon: '📋', title: 'Familjeåterförening', desc: 'Bevisa äktenskap för att ta med make/maka vid flytt utomlands' },
    { icon: '🏦', title: 'Bankärenden', desc: 'Öppna gemensamt bankkonto eller hantera arv i utlandet' },
    { icon: '🏥', title: 'Försäkring & pension', desc: 'Utländska försäkringsbolag kräver verifierat vigselbevis' },
    { icon: '⚖️', title: 'Juridiska ärenden', desc: 'Skilsmässa, vårdnad eller andra familjerättsliga ärenden utomlands' },
  ];

  return (
    <>
      <Head>
        <title>Apostille för Vigselbevis | Legalisera Vigselbevis för Utlandet | DOX</title>
        <meta name="description" content="Behöver du Apostille eller legalisering av ditt vigselbevis? Vi hjälper dig med Apostille, UD-stämpel och ambassadlegalisering för alla länder. Från 695 kr." />
        <meta name="keywords" content="apostille vigselbevis, legalisera vigselbevis, vigselbevis utomlands, apostille äktenskapsbevis, legalisering vigselbevis, vigselbevis Saudiarabien, vigselbevis UAE, legalisera giftermål" />

        <meta property="og:title" content="Apostille för Vigselbevis | DOX Visumpartner" />
        <meta property="og:description" content="Professionell legalisering av vigselbevis för utlandet. Apostille, UD och ambassadlegalisering." />
        <meta property="og:url" content="https://doxvl.se/apostille-vigselbevis" />
        <meta property="og:type" content="website" />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Apostille för Vigselbevis",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB",
            "url": "https://doxvl.se"
          },
          "description": "Professionell legalisering och Apostille av vigselbevis för internationellt bruk.",
          "areaServed": { "@type": "Country", "name": "Sweden" },
          "serviceType": "Document Legalization",
          "offers": {
            "@type": "Offer",
            "price": "695",
            "priceCurrency": "SEK",
            "availability": "https://schema.org/InStock"
          }
        })}} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faq.map(item => ({
            "@type": "Question",
            "name": item.q,
            "acceptedAnswer": { "@type": "Answer", "text": item.a }
          }))
        })}} />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="bg-gradient-to-br from-[#7c2d5a] to-[#4a1a36] text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="max-w-3xl">
              <div className="inline-flex items-center bg-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
                💍 Vigselbevis & civilståndshandlingar
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-6">
                Apostille & Legalisering av Vigselbevis
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Ska du flytta utomlands, gifta dig i ett annat land eller behöver bevisa ditt civilstånd? 
                <strong className="text-white"> Vi legaliserar ditt vigselbevis så att det accepteras internationellt.</strong>
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/bestall"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#eab308] hover:bg-[#ca9a06] text-black font-bold rounded-lg text-lg transition-colors"
                >
                  Beställ nu – från 695 kr
                </Link>
                <Link
                  href="/kontakt"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg transition-colors"
                >
                  Få gratis rådgivning
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="bg-white border-b py-6">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-wrap justify-center items-center gap-8 text-gray-600">
              <div className="flex items-center gap-2"><span className="text-2xl">🏆</span><span className="font-medium">500+ nöjda kunder</span></div>
              <div className="flex items-center gap-2"><span className="text-2xl">⚡</span><span className="font-medium">Express från 3 dagar</span></div>
              <div className="flex items-center gap-2"><span className="text-2xl">🌍</span><span className="font-medium">Giltigt i 120+ länder</span></div>
              <div className="flex items-center gap-2"><span className="text-2xl">🔒</span><span className="font-medium">Säker hantering</span></div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
              När behöver du legalisera ditt vigselbevis?
            </h2>
            <p className="text-lg text-gray-600 text-center mb-12 max-w-3xl mx-auto">
              Det finns många situationer där ett legaliserat vigselbevis krävs för att det ska accepteras utomlands.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {useCases.map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-6">
                  <span className="text-3xl mb-3 block">{item.icon}</span>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Apostille vs Full Legalization */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Apostille eller full legalisering?
            </h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-white rounded-xl p-8 shadow-sm border-2 border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">✅</span>
                  <h3 className="text-xl font-bold text-gray-900">Apostille</h3>
                </div>
                <p className="text-gray-600 mb-4">Räcker för Haagkonventionens 120+ länder</p>
                <p className="text-2xl font-bold text-green-700 mb-4">Från 695 kr</p>
                <p className="text-sm text-gray-500 mb-4">Handläggningstid: 5-7 arbetsdagar</p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>USA, Kanada</li>
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>EU-länder (Tyskland, Frankrike, Spanien...)</li>
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Storbritannien, Australien</li>
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Japan, Sydkorea</li>
                </ul>
              </div>
              <div className="bg-white rounded-xl p-8 shadow-sm border-2 border-amber-200">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">🏛️</span>
                  <h3 className="text-xl font-bold text-gray-900">Full legalisering</h3>
                </div>
                <p className="text-gray-600 mb-4">Krävs för länder utanför Haagkonventionen</p>
                <p className="text-2xl font-bold text-amber-700 mb-4">Från 1 495 kr</p>
                <p className="text-sm text-gray-500 mb-4">Handläggningstid: 2-4 veckor</p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center"><span className="text-amber-500 mr-2">✓</span>Saudiarabien, UAE, Qatar</li>
                  <li className="flex items-center"><span className="text-amber-500 mr-2">✓</span>Kina, Indien</li>
                  <li className="flex items-center"><span className="text-amber-500 mr-2">✓</span>Egypten, Jordanien</li>
                  <li className="flex items-center"><span className="text-amber-500 mr-2">✓</span>Thailand, Vietnam</li>
                </ul>
              </div>
            </div>
            <p className="text-center mt-8 text-gray-500 text-sm">
              Osäker på vad som krävs? <Link href="/kontakt" className="text-custom-button hover:underline font-medium">Kontakta oss</Link> så hjälper vi dig.
            </p>
          </div>
        </section>

        {/* Which documents */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Civilståndshandlingar vi legaliserar
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: '💍', title: 'Vigselbevis', desc: 'Från Svenska kyrkan, Skatteverket eller annan vigselförrättare' },
                { icon: '👶', title: 'Födelsebevis', desc: 'Personbevis med födelseinformation från Skatteverket' },
                { icon: '📋', title: 'Civilståndsbevis', desc: 'Intyg om civilstånd – gift, ogift, skild, änka/änkling' },
                { icon: '⚖️', title: 'Skilsmässodom', desc: 'Tingsrättens dom om äktenskapsskillnad' },
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-6 text-center">
                  <span className="text-4xl mb-4 block">{item.icon}</span>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Så fungerar det – 3 enkla steg
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { step: '1', title: 'Beställ online', desc: 'Fyll i vårt formulär och berätta vart dokumentet ska användas. Vi guidar dig till rätt tjänst.' },
                { step: '2', title: 'Vi hanterar allt', desc: 'Skicka dokumentet till oss. Vi sköter Notarius, Handelskammare, UD och ambassad.' },
                { step: '3', title: 'Färdigt dokument', desc: 'Du får tillbaka ditt legaliserade vigselbevis med post eller bud.' },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="w-16 h-16 bg-custom-button text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Vanliga frågor om Apostille för vigselbevis
            </h2>
            <div className="space-y-6">
              {faq.map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">{item.q}</h3>
                  <p className="text-gray-700">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-br from-[#7c2d5a] to-[#4a1a36] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Redo att legalisera ditt vigselbevis?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Vi hanterar hela processen åt dig – från Notarius till ambassadstämpel. Beställ online eller ring oss.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/bestall"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#eab308] hover:bg-[#ca9a06] text-black font-bold rounded-lg text-lg transition-colors"
              >
                Beställ nu – från 695 kr
              </Link>
              <Link
                href="/kontakt"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg transition-colors"
              >
                Kontakta oss
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'sv', ['common'])),
  },
});
