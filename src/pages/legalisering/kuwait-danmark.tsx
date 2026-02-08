import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';
import CountryFlag from '@/components/ui/CountryFlag';

export default function KuwaitDanmarkPage() {
  const embassyInfo = {
    name: 'Kuwaits ambassade i Stockholm',
    address: 'Box 7279',
    postalCode: '103 89 Stockholm, Sverige',
    phone: '+46 8 679 70 00',
    email: 'info@kuwaitembassy.se',
    website: 'https://kuwaitembassy.se',
    openingHours: 'Mandag-Fredag 09:00-16:00, Konsulær: 09:00-13:00'
  };

  const content = {
    title: 'Legalisering ved Kuwaits ambassade',
    subtitle: 'Embassy of Kuwait i Stockholm – Professionel legaliseringsservice for Danmark',
    heroText: 'Har du brug for at legalisere dokumenter ved Embassy of Kuwait i Stockholm? Vi tilbyder komplet legaliseringsservice for danske kunder – fra notarisering til ambassadestempel. Hurtigt, pålideligt og nemt.',
    orderBtn: 'Bestil ambassadelegalisering',
    contactBtn: 'Kontakt os',
    whyTitle: 'Hvorfor har du brug for Embassy of Kuwait til at legalisere dine dokumenter?',
    whyText1: 'Embassy of Kuwait i Stockholm er den eneste myndighed, der kan legalisere nordiske dokumenter til brug i Kuwait. Denne ambassadelegalisering er obligatorisk for arbejdstilladelser, virksomhedsetablering, uddannelse og familiesager i Kuwait.',
    whyText2: 'Embassy of Kuwait har været placeret i Stockholm siden 1994 og betjener alle nordiske lande, herunder Danmark. Vi har etablerede relationer med ambassaden og kender deres præcise krav og procedurer for dokumentlegalisering.',
    whyText3: 'Vores team besøger Embassy of Kuwait regelmæssigt og kan sikre, at dine dokumenter behandles korrekt første gang. Vi håndterer alt fra start til slut.',
    commonDocsTitle: 'Dokumenter vi legaliserer ved Embassy of Kuwait:',
    docs: [
      'Eksamensbeviser og uddannelsescertifikater til Kuwait',
      'Arbejdsattester og CV til Kuwait arbejdsvisum',
      'Fødselsattester og personlige dokumenter',
      'Vielsesattester og skilsmissedomme',
      'Selskabsdokumenter, fuldmagter og kontrakter',
      'Lægeerklæringer og sundhedsdokumenter'
    ],
    processTitle: 'Embassy of Kuwait legaliseringsproces',
    steps: [
      { step: '1', title: 'Notarius Publicus', desc: 'Dokumenter notariseres af dansk eller svensk Notarius Publicus.' },
      { step: '2', title: 'Udenrigsministeriet', desc: 'UM verificerer dokumentets ægthed.' },
      { step: '3', title: 'Embassy of Kuwait', desc: 'Endelig legalisering ved Embassy of Kuwait i Stockholm.' },
      { step: '4', title: 'Levering', desc: 'Legaliserede dokumenter sendes til dig i Danmark.' },
    ],
    embassyTitle: 'Embassy of Kuwait i Stockholm – Kontaktoplysninger',
    contactTitle: 'Embassy of Kuwait adresse',
    postalLabel: 'Postadresse:',
    phoneLabel: 'Telefon:',
    websiteLabel: 'Hjemmeside:',
    hoursLabel: 'Åbningstider:',
    weHandleTitle: 'Vi håndterer din Embassy of Kuwait legalisering',
    weHandleText: 'Du behøver ikke besøge Embassy of Kuwait selv. Vi håndterer al kontakt med ambassaden og sikrer, at dine dokumenter bliver korrekt legaliseret i henhold til Kuwaits krav.',
    weHandleItems: [
      'Vi afleverer dine dokumenter til Embassy of Kuwait',
      'Vi henter dem, når legaliseringen er fuldført',
      'Vi sender dem til dig hvor som helst i Danmark'
    ],
    orderNow: 'Bestil ambassadelegalisering',
    ctaTitle: 'Klar til at legalisere dine dokumenter ved Embassy of Kuwait?',
    ctaText: 'Vi har hjulpet hundredvis af danske kunder med Embassy of Kuwait legalisering. Bestil online eller kontakt os for ekspertrådgivning om dine specifikke dokumenter.',
    nordicAdvantage: 'Fordel for danske kunder',
    nordicAdvantageText: 'Som dansk kunde får du samme professionelle service som vores svenske kunder. Embassy of Kuwait i Stockholm betjener hele Norden, og vi sørger for hurtig og sikker levering til Danmark.',
    nordicItems: [
      'Gratis fragt til Danmark',
      'Dansk kundeservice',
      'Erfaring med danske dokumenter',
      'Hurtig behandlingstid'
    ],
    faqTitle: 'Ofte stillede spørgsmål om Embassy of Kuwait legalisering',
    faqs: [
      {
        question: 'Hvordan legaliserer jeg dokumenter ved Embassy of Kuwait i Stockholm?',
        answer: 'For at legalisere dokumenter ved Embassy of Kuwait skal du først have dem notariseret af en dansk eller svensk Notarius Publicus, derefter autentificeret af Udenrigsministeriet, og til sidst legaliseret ved Embassy of Kuwait i Stockholm. DOX Visumpartner håndterer hele denne proces for dig.'
      },
      {
        question: 'Hvor lang tid tager Embassy of Kuwait legalisering?',
        answer: 'Den komplette legaliseringsproces ved Embassy of Kuwait tager typisk 5-10 hverdage, afhængigt af dokumenttype og aktuelle behandlingstider ved ambassaden. Vi tilbyder ekspresservice til hastesager.'
      },
      {
        question: 'Hvilke dokumenter kan legaliseres ved Embassy of Kuwait?',
        answer: 'Embassy of Kuwait i Stockholm kan legalisere de fleste nordiske dokumenter, herunder eksamensbeviser, fødselsattester, vielsesattester, arbejdsattester, selskabsdokumenter, fuldmagter og lægeerklæringer.'
      },
      {
        question: 'Hvor ligger Embassy of Kuwait?',
        answer: 'Embassy of Kuwait ligger på Box 7279, 103 89 Stockholm, Sverige. Ambassaden håndterer legalisering for alle nordiske lande, herunder Danmark, Sverige og Finland.'
      },
      {
        question: 'Hvad koster Embassy of Kuwait legalisering?',
        answer: 'Prisen afhænger af dokumenttype og de nødvendige tjenester. Kontakt DOX Visumpartner for et gratis tilbud. Vi tilbyder faste priser uden skjulte gebyrer for komplet Embassy of Kuwait legaliseringsservice.'
      },
      {
        question: 'Skal jeg besøge Embassy of Kuwait selv?',
        answer: 'Nej, du behøver ikke besøge Embassy of Kuwait selv. DOX Visumpartner håndterer alle ambassadebesøg, dokumentaflevering og afhentning på dine vegne. Vi leverer de legaliserede dokumenter direkte til dig i Danmark.'
      }
    ]
  };

  // FAQ Schema for AEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": content.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <>
      <Head>
        <title>Embassy of Kuwait Legalisering Danmark | Dokumentattestering Stockholm | DOX</title>
        <meta name="description" content="Professionel dokumentlegalisering ved Embassy of Kuwait i Stockholm for danske kunder. Komplet service inkl. notarisering, UM-verificering og ambassadestempel. Hurtig behandling, faste priser." />
        <meta name="keywords" content="Embassy of Kuwait, Kuwait ambassade Danmark, legalisering Kuwait Danmark, Kuwait attestering, ambassadelegalisering Kuwait, legalisere dokumenter Kuwait, Kuwait arbejdsvisum dokumenter, Kuwaits ambassade Stockholm, Kuwait embassy Denmark" />
        
        <meta property="og:title" content="Embassy of Kuwait Legalisering Danmark | DOX Visumpartner" />
        <meta property="og:description" content="Professionel Embassy of Kuwait legaliseringsservice i Stockholm for danske kunder. Vi håndterer hele processen for dig." />
        <meta property="og:url" content="https://doxvl.se/legalisering/kuwait-danmark" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="da_DK" />
        <meta property="og:site_name" content="DOX Visumpartner" />
        <meta property="og:image" content="https://doxvl.se/dox-logo-new.png" />
        <meta name="twitter:card" content="summary" />
        
        <link rel="canonical" href="https://doxvl.se/legalisering/kuwait-danmark" />
        
        <link rel="alternate" hrefLang="sv" href="https://doxvl.se/legalisering/kuwait" />
        <link rel="alternate" hrefLang="en" href="https://doxvl.se/en/legalisering/kuwait" />
        <link rel="alternate" hrefLang="fi" href="https://doxvl.se/legalisering/kuwait-finland" />
        <link rel="alternate" hrefLang="da" href="https://doxvl.se/legalisering/kuwait-danmark" />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Embassy of Kuwait Dokumentlegalisering for Danmark",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB"
          },
          "description": "Professionel dokumentlegaliseringsservice ved Embassy of Kuwait i Stockholm for danske kunder",
          "areaServed": ["DK", "KW"],
          "serviceType": "Document Legalization"
        })}} />
        
        {/* FAQ Schema for AEO */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#007A3D] to-[#005a2d] text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-2 mb-4">
              <CountryFlag code="DK" size={32} />
              <span className="text-white/80 text-sm">Service for danske kunder</span>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <CountryFlag code="KW" size={64} />
              <div>
                <h1 className="text-3xl md:text-5xl font-bold">
                  {content.title}
                </h1>
                <p className="text-xl text-white/80">{content.subtitle}</p>
              </div>
            </div>
            <p className="text-xl text-white/90 mb-8 max-w-2xl">
              {content.heroText}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/bestall" className="bg-white hover:bg-gray-100 text-[#007A3D] font-semibold px-8 py-4 rounded-lg transition-colors">
                {content.orderBtn}
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-[#007A3D] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                {content.contactBtn}
              </Link>
            </div>
          </div>
        </section>

        {/* Nordic Advantage Banner */}
        <section className="bg-red-800 text-white py-8">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-4">
              <CountryFlag code="DK" size={40} />
              <h2 className="text-xl font-bold">{content.nordicAdvantage}</h2>
            </div>
            <p className="text-white/90 mb-4">{content.nordicAdvantageText}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {content.nordicItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Kuwait Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              {content.whyTitle}
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-700 mb-4">
                  {content.whyText1}
                </p>
                <p className="text-gray-700 mb-4">
                  {content.whyText2}
                </p>
                <p className="text-gray-700">
                  {content.whyText3}
                </p>
              </div>
              <div className="bg-[#007A3D]/5 p-6 rounded-lg border border-[#007A3D]/20">
                <h3 className="font-semibold text-lg mb-4">{content.commonDocsTitle}</h3>
                <ul className="space-y-2 text-gray-700">
                  {content.docs.map((doc, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-[#007A3D] mr-2">✓</span>
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              {content.processTitle}
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {content.steps.map((item) => (
                <div key={item.step} className="bg-white p-6 rounded-lg shadow-sm text-center">
                  <div className="w-12 h-12 bg-[#007A3D] text-white font-bold text-xl rounded-full flex items-center justify-center mx-auto mb-4">
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
              {content.embassyTitle}
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">{content.contactTitle}</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-3">📍</span>
                    <div>
                      <strong>{content.postalLabel}</strong><br />
                      {embassyInfo.address}<br />
                      {embassyInfo.postalCode}
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-3">📞</span>
                    <div>
                      <strong>{content.phoneLabel}</strong><br />
                      {embassyInfo.phone}
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-3">🌐</span>
                    <div>
                      <strong>{content.websiteLabel}</strong><br />
                      <a href={embassyInfo.website} target="_blank" rel="noopener noreferrer" className="text-[#007A3D] hover:underline">
                        {embassyInfo.website}
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-3">🕐</span>
                    <div>
                      <strong>{content.hoursLabel}</strong><br />
                      {embassyInfo.openingHours}
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-[#007A3D]/5 p-6 rounded-lg border border-[#007A3D]/20">
                <h3 className="font-semibold text-lg mb-4">{content.weHandleTitle}</h3>
                <p className="text-gray-700 mb-4">
                  {content.weHandleText}
                </p>
                <ul className="space-y-2 text-gray-700 mb-6">
                  {content.weHandleItems.map((item, index) => (
                    <li key={index} className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/bestall" className="block w-full bg-[#007A3D] hover:bg-[#005a2d] text-white font-semibold py-3 rounded-lg transition-colors text-center">
                  {content.orderNow}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section - AEO Optimized */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              {content.faqTitle}
            </h2>
            <div className="space-y-4">
              {content.faqs.map((faq, index) => (
                <details 
                  key={index}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 group"
                >
                  <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                    <h3 className="font-semibold text-gray-900 pr-4">{faq.question}</h3>
                    <span className="text-[#007A3D] group-open:rotate-180 transition-transform">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </summary>
                  <div className="px-6 pb-6 text-gray-700">
                    <p>{faq.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[#007A3D] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {content.ctaTitle}
            </h2>
            <p className="text-white/80 mb-8">
              {content.ctaText}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/bestall" className="bg-white hover:bg-gray-100 text-[#007A3D] font-semibold px-8 py-4 rounded-lg transition-colors">
                {content.orderBtn}
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-[#007A3D] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                {content.contactBtn}
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
