import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import CountryFlag from '@/components/ui/CountryFlag';



export default function KuwaitLegaliseringPage() {
  const { t } = useTranslation('common');
  const { locale } = useRouter();
  const isEnglish = locale === 'en';

  const embassyInfo = {
    name: isEnglish ? 'Embassy of Kuwait in Stockholm' : 'Kuwaits ambassad i Stockholm',
    address: 'Box 7279',
    postalCode: '103 89 Stockholm',
    phone: '+46 8 679 70 00',
    email: 'info@kuwaitembassy.se',
    website: 'https://kuwaitembassy.se',
    openingHours: isEnglish ? 'Monday-Friday 09:00-16:00, Consular: 09:00-13:00' : 'Måndag-Fredag 09:00-16:00, Konsulär: 09:00-13:00'
  };

  const content = {
    title: isEnglish ? 'Document Legalization at the Embassy of Kuwait' : 'Legalisering vid Kuwaits ambassad',
    subtitle: isEnglish ? 'Embassy of Kuwait in Stockholm – Professional Legalization Service' : 'Kuwaits ambassad i Stockholm – Professionell legaliseringstjänst',
    heroText: isEnglish 
      ? 'Need documents legalized at the Embassy of Kuwait in Stockholm? We provide complete legalization services – from notarization to embassy attestation. Fast, reliable and hassle-free.'
      : 'Behöver du legalisera dokument vid Kuwaits ambassad i Stockholm? Vi erbjuder komplett legaliseringsservice – från notarisering till ambassadstämpel. Snabbt, pålitligt och enkelt.',
    orderBtn: isEnglish ? 'Order Embassy Legalization' : 'Beställ ambassadlegalisering',
    contactBtn: isEnglish ? 'Contact us' : 'Kontakta oss',
    whyTitle: isEnglish ? 'Why do you need the Embassy of Kuwait to legalize your documents?' : 'Varför behöver du Kuwaits ambassad för att legalisera dina dokument?',
    whyText1: isEnglish
      ? 'The Embassy of Kuwait in Stockholm is the only authority that can legalize Swedish documents for use in Kuwait. This embassy legalization is mandatory for work permits, business establishment, education and family matters in Kuwait.'
      : 'Kuwaits ambassad i Stockholm är den enda myndigheten som kan legalisera svenska dokument för användning i Kuwait. Denna ambassadlegalisering är obligatorisk för arbetstillstånd, företagsetablering, utbildning och familjeärenden i Kuwait.',
    whyText2: isEnglish
      ? 'The Embassy of Kuwait has been located in Stockholm since 1994 and serves all Nordic countries. We have established relationships with the embassy and know their exact requirements and procedures for document legalization.'
      : 'Kuwaits ambassad har funnits i Stockholm sedan 1994 och betjänar alla nordiska länder. Vi har etablerade relationer med ambassaden och känner till deras exakta krav och rutiner för dokumentlegalisering.',
    whyText3: isEnglish
      ? 'Our team visits the Embassy of Kuwait regularly and can ensure your documents are processed correctly the first time. We handle everything from start to finish.'
      : 'Vårt team besöker Kuwaits ambassad regelbundet och kan säkerställa att dina dokument behandlas korrekt första gången. Vi hanterar allt från början till slut.',
    commonDocsTitle: isEnglish ? 'Documents we legalize at the Embassy of Kuwait:' : 'Dokument vi legaliserar vid Kuwaits ambassad:',
    docs: isEnglish ? [
      'Diplomas and educational certificates for Kuwait',
      'Employment certificates and CV for Kuwait work visa',
      'Birth certificates and personal documents',
      'Marriage certificates and divorce decrees',
      'Company documents, powers of attorney and contracts',
      'Medical certificates and health documents'
    ] : [
      'Examensbevis och utbildningsintyg för Kuwait',
      'Arbetsgivarintyg och CV för arbetsvisum till Kuwait',
      'Födelsebevis och personbevis',
      'Vigselbevis och skilsmässodom',
      'Bolagshandlingar, fullmakter och kontrakt',
      'Medicinska intyg och hälsodokument'
    ],
    processTitle: isEnglish ? 'Embassy of Kuwait Legalization Process' : 'Legaliseringsprocessen vid Kuwaits ambassad',
    steps: isEnglish ? [
      { step: '1', title: 'Notary Public', desc: 'Documents are notarized by Swedish Notary Public.' },
      { step: '2', title: 'Ministry of Foreign Affairs', desc: 'Swedish MFA authenticates the document.' },
      { step: '3', title: 'Embassy of Kuwait', desc: 'Final legalization at the Embassy of Kuwait in Stockholm.' },
      { step: '4', title: 'Delivery', desc: 'Legalized documents sent to you anywhere in Scandinavia.' },
    ] : [
      { step: '1', title: 'Notarius Publicus', desc: 'Dokument notariseras av svensk Notarius Publicus.' },
      { step: '2', title: 'Utrikesdepartementet', desc: 'Svenska UD verifierar dokumentets äkthet.' },
      { step: '3', title: 'Kuwaits ambassad', desc: 'Slutlig legalisering vid Kuwaits ambassad i Stockholm.' },
      { step: '4', title: 'Leverans', desc: 'Legaliserade dokument skickas till dig i hela Skandinavien.' },
    ],
    embassyTitle: isEnglish ? 'Embassy of Kuwait in Stockholm – Contact Information' : 'Kuwaits ambassad i Stockholm – Kontaktinformation',
    contactTitle: isEnglish ? 'Embassy of Kuwait Address' : 'Kuwaits ambassads adress',
    postalLabel: isEnglish ? 'Postal address:' : 'Postadress:',
    phoneLabel: isEnglish ? 'Phone:' : 'Telefon:',
    websiteLabel: isEnglish ? 'Website:' : 'Webbplats:',
    hoursLabel: isEnglish ? 'Opening hours:' : 'Öppettider:',
    weHandleTitle: isEnglish ? 'We handle your Embassy of Kuwait legalization' : 'Vi sköter din legalisering vid Kuwaits ambassad',
    weHandleText: isEnglish
      ? 'You don\'t need to visit the Embassy of Kuwait yourself. We handle all contact with the embassy and ensure your documents are correctly legalized according to Kuwait\'s requirements.'
      : 'Du behöver inte besöka Kuwaits ambassad själv. Vi hanterar all kontakt med ambassaden och ser till att dina dokument blir korrekt legaliserade enligt Kuwaits krav.',
    weHandleItems: isEnglish ? [
      'We submit your documents to the Embassy of Kuwait',
      'We collect them when the legalization is complete',
      'We send them to you anywhere in Sweden, Norway or Denmark'
    ] : [
      'Vi lämnar in dina dokument till Kuwaits ambassad',
      'Vi hämtar ut dem när legaliseringen är klar',
      'Vi skickar dem till dig i Sverige, Norge eller Danmark'
    ],
    orderNow: isEnglish ? 'Order Embassy Legalization' : 'Beställ ambassadlegalisering',
    ctaTitle: isEnglish ? 'Ready to legalize your documents at the Embassy of Kuwait?' : 'Redo att legalisera dina dokument vid Kuwaits ambassad?',
    ctaText: isEnglish
      ? 'We have helped hundreds of customers with Embassy of Kuwait legalization. Order online or contact us for expert advice on your specific documents.'
      : 'Vi har hjälpt hundratals kunder med legalisering vid Kuwaits ambassad. Beställ online eller kontakta oss för expertrådgivning om dina specifika dokument.',
    metaTitle: isEnglish 
      ? 'Embassy of Kuwait Legalization Stockholm | Document Attestation Service | DOX'
      : 'Kuwaits ambassad legalisering Stockholm | Dokumentlegalisering | DOX Visumpartner',
    metaDesc: isEnglish
      ? 'Professional document legalization at the Embassy of Kuwait in Stockholm. Complete service including notarization, MFA authentication and embassy attestation. Serving Sweden, Norway & Denmark. Fast turnaround, fixed prices.'
      : 'Professionell dokumentlegalisering vid Kuwaits ambassad i Stockholm. Komplett service inkl. notarisering, UD-verifiering och ambassadstämpel. Betjänar Sverige, Norge & Danmark. Snabb hantering, fasta priser.',
    metaKeywords: isEnglish
      ? 'Embassy of Kuwait, Kuwait Embassy Stockholm, document legalization Kuwait, Kuwait attestation, Kuwait embassy legalization, legalize documents Kuwait, Kuwait work visa documents, Kuwait embassy Sweden, Kuwait embassy Norway, Kuwait embassy Denmark'
      : 'Kuwaits ambassad, Kuwait ambassad Stockholm, legalisering Kuwait, Kuwait attestering, ambassadlegalisering Kuwait, legalisera dokument Kuwait, Kuwait arbetsvisum dokument, Kuwaits ambassad Sverige, Kuwait ambassad Norge, Kuwait ambassad Danmark',
    ogDesc: isEnglish
      ? 'Professional Embassy of Kuwait legalization service in Stockholm. We handle the complete process for customers in Sweden, Norway and Denmark.'
      : 'Professionell legaliseringstjänst vid Kuwaits ambassad i Stockholm. Vi hanterar hela processen för kunder i Sverige, Norge och Danmark.',
    schemaName: isEnglish ? 'Embassy of Kuwait Document Legalization Service' : 'Dokumentlegalisering vid Kuwaits ambassad',
    schemaDesc: isEnglish
      ? 'Professional document legalization service at the Embassy of Kuwait in Stockholm for customers in Sweden, Norway and Denmark'
      : 'Professionell dokumentlegaliseringstjänst vid Kuwaits ambassad i Stockholm för kunder i Sverige, Norge och Danmark',
    faqTitle: isEnglish ? 'Frequently Asked Questions about Embassy of Kuwait Legalization' : 'Vanliga frågor om legalisering vid Kuwaits ambassad',
    faqs: isEnglish ? [
      {
        question: 'How do I legalize documents at the Embassy of Kuwait in Stockholm?',
        answer: 'To legalize documents at the Embassy of Kuwait, you need to first have them notarized by a Swedish Notary Public, then authenticated by the Swedish Ministry of Foreign Affairs, and finally legalized at the Embassy of Kuwait in Stockholm. DOX Visumpartner handles this entire process for you.'
      },
      {
        question: 'How long does Embassy of Kuwait legalization take?',
        answer: 'The complete legalization process at the Embassy of Kuwait typically takes 5-10 business days, depending on the document type and current processing times at the embassy. We offer express service for urgent cases.'
      },
      {
        question: 'What documents can be legalized at the Embassy of Kuwait?',
        answer: 'The Embassy of Kuwait in Stockholm can legalize most Swedish documents including diplomas, birth certificates, marriage certificates, employment certificates, company documents, powers of attorney, and medical certificates.'
      },
      {
        question: 'Where is the Embassy of Kuwait located in Stockholm?',
        answer: 'The Embassy of Kuwait is located at Box 7279, 103 89 Stockholm, Sweden. The embassy handles legalization for all Nordic countries including Sweden, Finland and Denmark.'
      },
      {
        question: 'How much does Embassy of Kuwait legalization cost?',
        answer: 'The cost depends on the document type and services required. Contact DOX Visumpartner for a free quote. We offer fixed prices with no hidden fees for complete Embassy of Kuwait legalization service.'
      },
      {
        question: 'Do I need to visit the Embassy of Kuwait myself?',
        answer: 'No, you do not need to visit the Embassy of Kuwait yourself. DOX Visumpartner handles all embassy visits, document submission and collection on your behalf. We deliver the legalized documents directly to you.'
      }
    ] : [
      {
        question: 'Hur legaliserar jag dokument vid Kuwaits ambassad i Stockholm?',
        answer: 'För att legalisera dokument vid Kuwaits ambassad behöver du först notarisera dem hos svensk Notarius Publicus, sedan verifiera dem hos Utrikesdepartementet, och slutligen legalisera dem vid Kuwaits ambassad i Stockholm. DOX Visumpartner hanterar hela denna process åt dig.'
      },
      {
        question: 'Hur lång tid tar legalisering vid Kuwaits ambassad?',
        answer: 'Den kompletta legaliseringsprocessen vid Kuwaits ambassad tar normalt 5-10 arbetsdagar, beroende på dokumenttyp och aktuella handläggningstider vid ambassaden. Vi erbjuder expressservice för brådskande ärenden.'
      },
      {
        question: 'Vilka dokument kan legaliseras vid Kuwaits ambassad?',
        answer: 'Kuwaits ambassad i Stockholm kan legalisera de flesta svenska dokument inklusive examensbevis, födelsebevis, vigselbevis, arbetsgivarintyg, bolagshandlingar, fullmakter och medicinska intyg.'
      },
      {
        question: 'Var ligger Kuwaits ambassad i Stockholm?',
        answer: 'Kuwaits ambassad ligger på Box 7279, 103 89 Stockholm, Sverige. Ambassaden hanterar legalisering för alla nordiska länder inklusive Sverige, Finland och Danmark.'
      },
      {
        question: 'Vad kostar legalisering vid Kuwaits ambassad?',
        answer: 'Kostnaden beror på dokumenttyp och vilka tjänster som behövs. Kontakta DOX Visumpartner för en kostnadsfri offert. Vi erbjuder fasta priser utan dolda avgifter för komplett legaliseringsservice vid Kuwaits ambassad.'
      },
      {
        question: 'Måste jag besöka Kuwaits ambassad själv?',
        answer: 'Nej, du behöver inte besöka Kuwaits ambassad själv. DOX Visumpartner hanterar alla ambassadbesök, inlämning och uthämtning av dokument åt dig. Vi levererar de legaliserade dokumenten direkt till dig.'
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
        <title>{content.metaTitle}</title>
        <meta name="description" content={content.metaDesc} />
        <meta name="keywords" content={content.metaKeywords} />
                
        <meta property="og:title" content={content.metaTitle} />
        <meta property="og:description" content={content.ogDesc} />
        <meta property="og:url" content="https://www.doxvl.se/legalisering/kuwait" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="DOX Visumpartner" />
        <meta property="og:image" content="https://www.doxvl.se/dox-logo-new.png" />
        
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={content.metaTitle} />
        <meta name="twitter:description" content={content.ogDesc} />
        
        <link rel="canonical" href="https://www.doxvl.se/legalisering/kuwait" />
        <link rel="alternate" hrefLang="sv" href="https://www.doxvl.se/legalisering/kuwait" />
        <link rel="alternate" hrefLang="en" href="https://www.doxvl.se/en/legalisering/kuwait" />
        <link rel="alternate" hrefLang="fi" href="https://www.doxvl.se/legalisering/kuwait-finland" />
        <link rel="alternate" hrefLang="da" href="https://www.doxvl.se/legalisering/kuwait-danmark" />
        <link rel="alternate" hrefLang="x-default" href="https://www.doxvl.se/legalisering/kuwait" />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": content.schemaName,
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB"
          },
          "description": content.schemaDesc,
          "areaServed": ["SE", "KW"],
          "serviceType": "Document Legalization"
        })}} />
        
        {/* FAQ Schema for AEO - Answer Engine Optimization */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      </Head>

      

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#007A3D] to-[#005a2d] text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
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
