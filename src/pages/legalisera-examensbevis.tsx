import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';

export default function LegaliseraExamensbevisPage() {
  const faq = [
    {
      q: 'Vilka examensbevis kan legaliseras?',
      a: 'De flesta svenska examensbevis kan legaliseras: universitetsexamen, högskoleexamen, gymnasiebetyg, yrkesexamen, doktorsexamen och andra utbildningsbevis utfärdade av svenska lärosäten.',
    },
    {
      q: 'Behöver jag en auktoriserad översättning av mitt examensbevis?',
      a: 'Ja, i de flesta fall krävs en auktoriserad översättning till engelska eller destinationslandets språk. Vi erbjuder auktoriserad översättning som tilläggstjänst och kan hantera hela processen åt dig.',
    },
    {
      q: 'Hur lång tid tar det att legalisera ett examensbevis?',
      a: 'Apostille tar normalt 5-7 arbetsdagar. Full ambassadlegalisering (Notarius + Handelskammare + UD + Ambassad) tar 2-4 veckor beroende på destinationsland. Vi erbjuder även expresshantering.',
    },
    {
      q: 'Vad kostar det att legalisera ett examensbevis?',
      a: 'Apostille från 695 kr. Full legalisering inklusive ambassadstämpel från 1 495 kr. Priset varierar beroende på destinationsland och antal steg som krävs. Kontakta oss för exakt pris.',
    },
    {
      q: 'Behöver jag skicka originaldokumentet?',
      a: 'Det beror på vilken typ av legalisering som krävs. För Apostille krävs normalt originalet eller en bestyrkt kopia. Vi guidar dig genom exakt vad som behövs för ditt specifika fall.',
    },
    {
      q: 'Kan jag legalisera ett examensbevis för flera länder samtidigt?',
      a: 'Ja, men varje land kan kräva olika legaliseringsprocesser. Haag-konventionens länder accepterar Apostille, medan andra länder kräver full ambassadlegalisering. Vi hjälper dig med rätt process för varje land.',
    },
  ];

  const countries = [
    { name: 'Saudiarabien', flag: '🇸🇦', note: 'Full legalisering krävs' },
    { name: 'UAE / Dubai', flag: '🇦🇪', note: 'Full legalisering krävs' },
    { name: 'Qatar', flag: '🇶🇦', note: 'Full legalisering krävs' },
    { name: 'Kina', flag: '🇨🇳', note: 'Full legalisering krävs' },
    { name: 'USA', flag: '🇺🇸', note: 'Apostille räcker' },
    { name: 'Storbritannien', flag: '🇬🇧', note: 'Apostille räcker' },
    { name: 'Tyskland', flag: '🇩🇪', note: 'Apostille räcker' },
    { name: 'Indien', flag: '🇮🇳', note: 'Full legalisering krävs' },
  ];

  return (
    <>
      <Head>
        <title>Legalisera Examensbevis för Utlandsstudier | Apostille & Ambassad | DOX</title>
        <meta name="description" content="Behöver du legalisera ditt examensbevis för utlandsstudier eller arbete utomlands? Vi hjälper dig med Apostille, UD-stämpel och ambassadlegalisering. Från 695 kr." />
        <meta name="keywords" content="legalisera examensbevis, apostille examensbevis, legalisering universitetsexamen, examensbevis utomlands, legalisera diplom, apostille diplom, examensbevis Saudiarabien, examensbevis UAE, legalisera betyg" />

        <meta property="og:title" content="Legalisera Examensbevis för Utlandsstudier | DOX Visumpartner" />
        <meta property="og:description" content="Professionell legalisering av examensbevis för utlandsstudier och arbete. Apostille, UD och ambassadlegalisering." />
        <meta property="og:url" content="https://doxvl.se/legalisera-examensbevis" />
        <meta property="og:type" content="website" />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Legalisering av Examensbevis",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB",
            "url": "https://doxvl.se"
          },
          "description": "Professionell legalisering av examensbevis och diplom för internationellt bruk. Apostille, UD-stämpel och ambassadlegalisering.",
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
        <section className="bg-gradient-to-br from-[#1e3a5f] to-[#0f1f33] text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="max-w-3xl">
              <div className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
                🎓 Specialister på examensbevis
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-6">
                Legalisera Examensbevis för Utlandsstudier & Arbete
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Ska du studera eller arbeta utomlands? Ditt svenska examensbevis behöver legaliseras för att accepteras i andra länder. 
                <strong className="text-white"> Vi hanterar hela processen åt dig – snabbt och säkert.</strong>
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
              <div className="flex items-center gap-2"><span className="text-2xl">🎓</span><span className="font-medium">Alla typer av examensbevis</span></div>
              <div className="flex items-center gap-2"><span className="text-2xl">🌍</span><span className="font-medium">Giltigt i alla länder</span></div>
            </div>
          </div>
        </section>

        {/* When do you need this */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
              När behöver du legalisera ditt examensbevis?
            </h2>
            <p className="text-lg text-gray-600 text-center mb-12 max-w-3xl mx-auto">
              Ett svenskt examensbevis accepteras inte automatiskt utomlands. Legalisering krävs för att bevisa dokumentets äkthet.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: '🎓', title: 'Utlandsstudier', desc: 'Master- eller doktorandstudier vid utländskt universitet' },
                { icon: '💼', title: 'Arbete utomlands', desc: 'Arbetsgivare kräver verifierat examensbevis' },
                { icon: '🏥', title: 'Yrkeslicens', desc: 'Läkare, ingenjörer och andra yrken som kräver licensiering' },
                { icon: '🏛️', title: 'Myndighetskrav', desc: 'Visum, uppehållstillstånd eller medborgarskap' },
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
              Så legaliserar vi ditt examensbevis
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: '1', title: 'Notarius Publicus', desc: 'Verifierar att kopian stämmer med originalet', color: 'bg-blue-100' },
                { step: '2', title: 'Handelskammaren', desc: 'Bekräftar notariens underskrift och behörighet', color: 'bg-amber-100' },
                { step: '3', title: 'Utrikesdepartementet', desc: 'UD-stämpel eller Apostille beroende på land', color: 'bg-green-100' },
                { step: '4', title: 'Ambassad', desc: 'Slutlig legalisering för icke-Haag-länder', color: 'bg-red-100' },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-6 text-center shadow-sm">
                  <div className={`w-12 h-12 ${item.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <span className="text-xl font-bold text-gray-800">{item.step}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-gray-500 mt-8 text-sm">
              * Haag-konventionens länder (t.ex. USA, EU) kräver bara Apostille (steg 3). Övriga länder kräver alla steg.
            </p>
          </div>
        </section>

        {/* Which documents */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Examensbevis vi legaliserar
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: 'Universitetsexamen', items: ['Kandidatexamen', 'Masterexamen', 'Doktorsexamen', 'Magisterexamen'] },
                { title: 'Gymnasie- & yrkesbevis', items: ['Gymnasiebetyg', 'Yrkesexamen', 'Komvux-betyg', 'Folkhögskolebevis'] },
                { title: 'Övriga utbildningsbevis', items: ['Kursintyg', 'Certifikat', 'Diploma supplement', 'Betygsutdrag'] },
              ].map((cat, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-4 text-lg">{cat.title}</h3>
                  <ul className="space-y-2">
                    {cat.items.map((item, j) => (
                      <li key={j} className="flex items-center text-gray-700">
                        <span className="text-green-500 mr-2">✓</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular countries */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
              Populära destinationsländer
            </h2>
            <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Vi legaliserar examensbevis för alla länder i världen. Här är de vanligaste.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {countries.map((c, i) => (
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
              Vanliga frågor om legalisering av examensbevis
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
        <section className="py-16 bg-gradient-to-br from-[#1e3a5f] to-[#0f1f33] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Redo att legalisera ditt examensbevis?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Vi hanterar hela processen åt dig. Beställ online eller kontakta oss för personlig rådgivning.
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
