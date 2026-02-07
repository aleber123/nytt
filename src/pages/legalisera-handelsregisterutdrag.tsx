import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';

export default function LegaliseraHandelsregisterutdragPage() {
  const faq = [
    {
      q: 'Vad är ett handelsregisterutdrag?',
      a: 'Ett handelsregisterutdrag (registreringsbevis) är ett officiellt dokument från Bolagsverket som visar information om ett svenskt företag – organisationsnummer, firmanamn, styrelse, firmatecknare och verksamhetsbeskrivning.',
    },
    {
      q: 'Varför behöver jag legalisera mitt handelsregisterutdrag?',
      a: 'När du gör affärer internationellt kräver utländska myndigheter, banker och affärspartners ofta ett legaliserat handelsregisterutdrag för att verifiera att ditt företag är registrerat i Sverige och att dokumentet är äkta.',
    },
    {
      q: 'Hur lång tid tar legalisering av handelsregisterutdrag?',
      a: 'Apostille tar normalt 5-7 arbetsdagar. Full ambassadlegalisering tar 2-4 veckor beroende på destinationsland. Vi erbjuder expresshantering från 3 arbetsdagar.',
    },
    {
      q: 'Vad kostar det att legalisera ett handelsregisterutdrag?',
      a: 'Apostille från 695 kr. Full legalisering inklusive ambassadstämpel från 1 495 kr. Priset varierar beroende på destinationsland och antal dokument. Kontakta oss för exakt offert.',
    },
    {
      q: 'Behöver jag översätta handelsregisterutdraget?',
      a: 'Ja, i de flesta fall krävs en auktoriserad översättning till engelska eller destinationslandets språk. Vi erbjuder auktoriserad översättning som tilläggstjänst och kan hantera hela processen.',
    },
    {
      q: 'Kan jag legalisera andra företagsdokument samtidigt?',
      a: 'Ja, vi legaliserar alla typer av företagsdokument: fullmakter, bolagsordningar, årsredovisningar, styrelseprotokoll och avtal. Du kan beställa legalisering av flera dokument samtidigt.',
    },
    {
      q: 'Vilken version av handelsregisterutdraget behövs?',
      a: 'Det beror på syftet. Vanligtvis räcker ett aktuellt registreringsbevis från Bolagsverket. Vissa länder kräver ett utdrag som inte är äldre än 3 månader. Vi hjälper dig att beställa rätt version.',
    },
  ];

  const useCases = [
    { icon: '🤝', title: 'Internationella affärer', desc: 'Verifiera ditt företag för utländska affärspartners och leverantörer' },
    { icon: '🏦', title: 'Bankkonto utomlands', desc: 'Öppna företagskonto i utländsk bank' },
    { icon: '📑', title: 'Offentlig upphandling', desc: 'Delta i upphandlingar i andra länder' },
    { icon: '🏢', title: 'Etablera dotterbolag', desc: 'Starta filial eller dotterbolag utomlands' },
    { icon: '⚖️', title: 'Juridiska ärenden', desc: 'Rättsprocesser eller avtal med utländska parter' },
    { icon: '🛃', title: 'Import & export', desc: 'Tullmyndigheter kräver verifierade företagshandlingar' },
  ];

  const documents = [
    { title: 'Registreringsbevis', desc: 'Bolagsverkets officiella utdrag med företagsinformation' },
    { title: 'Fullmakter', desc: 'Generalfullmakt, specialfullmakt och prokura' },
    { title: 'Bolagsordning', desc: 'Företagets stadgar och regler' },
    { title: 'Styrelseprotokoll', desc: 'Beslut om firmateckning, fullmakter m.m.' },
    { title: 'Årsredovisning', desc: 'Reviderad årsredovisning och revisionsberättelse' },
    { title: 'Avtal & kontrakt', desc: 'Kommersiella avtal som ska användas internationellt' },
    { title: 'Certifikat', desc: 'ISO-certifikat, kvalitetscertifikat och branschcertifikat' },
    { title: 'Intyg', desc: 'Skatteintyg, F-skattsedel och andra myndighetsintyg' },
  ];

  return (
    <>
      <Head>
        <title>Legalisera Handelsregisterutdrag för Företag | Apostille & Ambassad | DOX</title>
        <meta name="description" content="Behöver du legalisera handelsregisterutdrag eller andra företagsdokument för internationella affärer? Vi hjälper dig med Apostille och ambassadlegalisering. Från 695 kr." />
        <meta name="keywords" content="legalisera handelsregisterutdrag, apostille registreringsbevis, legalisering företagsdokument, legalisera bolagshandlingar, apostille fullmakt, legalisera bolagsordning, företagsdokument utomlands, Bolagsverket legalisering" />
        <link rel="canonical" href="https://www.doxvl.se/legalisera-handelsregisterutdrag" />

        <meta property="og:title" content="Legalisera Handelsregisterutdrag för Företag | DOX Visumpartner" />
        <meta property="og:description" content="Professionell legalisering av handelsregisterutdrag och företagsdokument för internationella affärer." />
        <meta property="og:url" content="https://www.doxvl.se/legalisera-handelsregisterutdrag" />
        <meta property="og:type" content="website" />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Legalisering av Handelsregisterutdrag",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB",
            "url": "https://www.doxvl.se"
          },
          "description": "Professionell legalisering av handelsregisterutdrag och företagsdokument för internationellt bruk.",
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
        <section className="bg-gradient-to-br from-[#1a3c34] to-[#0d1f1a] text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="max-w-3xl">
              <div className="inline-flex items-center bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
                🏢 Företagsdokument & bolagshandlingar
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-6">
                Legalisera Handelsregisterutdrag & Företagsdokument
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Gör internationella affärer? Utländska myndigheter och partners kräver legaliserade företagsdokument. 
                <strong className="text-white"> Vi hanterar hela processen – från Bolagsverket till ambassadstämpel.</strong>
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
                  Få gratis offert
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
              <div className="flex items-center gap-2"><span className="text-2xl">🏢</span><span className="font-medium">Alla företagsformer</span></div>
              <div className="flex items-center gap-2"><span className="text-2xl">⚡</span><span className="font-medium">Express från 3 dagar</span></div>
              <div className="flex items-center gap-2"><span className="text-2xl">🌍</span><span className="font-medium">Alla länder</span></div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
              När behöver företag legalisera dokument?
            </h2>
            <p className="text-lg text-gray-600 text-center mb-12 max-w-3xl mx-auto">
              Svenska företagsdokument accepteras inte automatiskt utomlands. Legalisering krävs för att verifiera dokumentens äkthet.
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

        {/* Documents we legalize */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Företagsdokument vi legaliserar
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {documents.map((doc, i) => (
                <div key={i} className="bg-white rounded-xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-1">{doc.title}</h3>
                  <p className="text-gray-600 text-sm">{doc.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Legaliseringsprocessen för företagsdokument
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: '1', title: 'Notarius Publicus', desc: 'Bestyrker kopior och verifierar underskrifter', color: 'bg-blue-100' },
                { step: '2', title: 'Handelskammaren', desc: 'Bekräftar notariens behörighet – särskilt viktigt för företagsdokument', color: 'bg-amber-100' },
                { step: '3', title: 'Utrikesdepartementet', desc: 'UD-stämpel eller Apostille beroende på destinationsland', color: 'bg-green-100' },
                { step: '4', title: 'Ambassad', desc: 'Slutlig legalisering för icke-Haag-länder', color: 'bg-red-100' },
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-6 text-center">
                  <div className={`w-12 h-12 ${item.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <span className="text-xl font-bold text-gray-800">{item.step}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-gray-500 mt-8 text-sm">
              * Haag-konventionens länder kräver bara Apostille (steg 3). Mellanöstern, Kina och flera asiatiska länder kräver alla steg.
            </p>
          </div>
        </section>

        {/* Popular countries for business */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
              Vanliga destinationsländer för företag
            </h2>
            <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Svenska företag behöver oftast legalisera dokument för dessa marknader.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Saudiarabien', flag: '🇸🇦', note: 'Full legalisering' },
                { name: 'UAE / Dubai', flag: '🇦🇪', note: 'Full legalisering' },
                { name: 'Qatar', flag: '🇶🇦', note: 'Full legalisering' },
                { name: 'Kina', flag: '🇨🇳', note: 'Full legalisering' },
                { name: 'Indien', flag: '🇮🇳', note: 'Full legalisering' },
                { name: 'USA', flag: '🇺🇸', note: 'Apostille räcker' },
                { name: 'Tyskland', flag: '🇩🇪', note: 'Apostille räcker' },
                { name: 'Egypten', flag: '🇪🇬', note: 'Full legalisering' },
              ].map((c, i) => (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm text-center">
                  <span className="text-3xl block mb-2">{c.flag}</span>
                  <h3 className="font-semibold text-gray-900">{c.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{c.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Vanliga frågor om legalisering av företagsdokument
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
        <section className="py-16 bg-gradient-to-br from-[#1a3c34] to-[#0d1f1a] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Behöver du legalisera företagsdokument?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Vi hanterar hela processen åt dig. Beställ online eller kontakta oss för en skräddarsydd offert för ditt företag.
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
                Kontakta oss för offert
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
