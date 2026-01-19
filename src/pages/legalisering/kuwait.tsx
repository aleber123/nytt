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
    title: isEnglish ? 'Document Legalization for Kuwait' : 'Legalisering för Kuwait',
    subtitle: isEnglish ? 'Embassy of Kuwait in Stockholm' : 'Kuwaits ambassad i Stockholm',
    heroText: isEnglish 
      ? 'Planning to work, study or do business in Kuwait? We help you with complete document legalization – from notarization to embassy stamp.'
      : 'Planerar du att arbeta, studera eller göra affärer i Kuwait? Vi hjälper dig med komplett legalisering av dina dokument – från notarisering till ambassadstämpel.',
    orderBtn: isEnglish ? 'Order legalization' : 'Beställ legalisering',
    contactBtn: isEnglish ? 'Contact us' : 'Kontakta oss',
    whyTitle: isEnglish ? 'Why is legalization required for Kuwait?' : 'Varför behövs legalisering för Kuwait?',
    whyText1: isEnglish
      ? 'Kuwait requires foreign documents to be legalized before they can be used in the country. This is a requirement for work visas, company establishment and family matters.'
      : 'Kuwait kräver att utländska dokument legaliseras innan de kan användas i landet. Detta är ett krav för arbetsvisum, företagsetablering och familjeärenden.',
    whyText2: isEnglish
      ? 'Kuwait has had an embassy in Stockholm since 1994 that handles legalization of Swedish documents. The process requires several steps that we can help you with.'
      : 'Kuwait har sedan 1994 en ambassad i Stockholm som hanterar legalisering av svenska dokument. Processen kräver flera steg som vi kan hjälpa dig med.',
    whyText3: isEnglish
      ? 'We have extensive experience handling documents for Kuwait and know the embassy\'s requirements and procedures.'
      : 'Vi har lång erfarenhet av att hantera dokument för Kuwait och känner till ambassadens krav och rutiner.',
    commonDocsTitle: isEnglish ? 'Common documents for Kuwait:' : 'Vanliga dokument för Kuwait:',
    docs: isEnglish ? [
      'Diplomas and educational certificates',
      'Employment certificates and CV',
      'Personal certificates and birth certificates',
      'Marriage certificates and divorce decrees',
      'Company documents and powers of attorney',
      'Medical certificates'
    ] : [
      'Examensbevis och utbildningsintyg',
      'Arbetsgivarintyg och CV',
      'Personbevis och födelsebevis',
      'Vigselbevis och skilsmässodom',
      'Bolagshandlingar och fullmakter',
      'Medicinska intyg'
    ],
    processTitle: isEnglish ? 'Legalization process for Kuwait' : 'Legaliseringsprocessen för Kuwait',
    steps: isEnglish ? [
      { step: '1', title: 'Notary Public', desc: 'Private documents are notarized first.' },
      { step: '2', title: 'Ministry of Foreign Affairs', desc: 'MFA verifies document authenticity.' },
      { step: '3', title: 'Kuwait Embassy', desc: 'Final legalization for Kuwait.' },
      { step: '4', title: 'Delivery', desc: 'Documents are sent to you.' },
    ] : [
      { step: '1', title: 'Notarius Publicus', desc: 'Privata dokument notariseras först.' },
      { step: '2', title: 'Utrikesdepartementet', desc: 'UD verifierar dokumentets äkthet.' },
      { step: '3', title: 'Kuwaits ambassad', desc: 'Slutlig legalisering för Kuwait.' },
      { step: '4', title: 'Leverans', desc: 'Dokumenten skickas till dig.' },
    ],
    embassyTitle: isEnglish ? 'Embassy of Kuwait in Stockholm' : 'Kuwaits ambassad i Stockholm',
    contactTitle: isEnglish ? 'Contact details' : 'Kontaktuppgifter',
    postalLabel: isEnglish ? 'Postal address:' : 'Postadress:',
    phoneLabel: isEnglish ? 'Phone:' : 'Telefon:',
    websiteLabel: isEnglish ? 'Website:' : 'Webbplats:',
    hoursLabel: isEnglish ? 'Opening hours:' : 'Öppettider:',
    weHandleTitle: isEnglish ? 'We handle everything for you' : 'Vi sköter allt åt dig',
    weHandleText: isEnglish
      ? 'You don\'t need to visit the embassy yourself. We handle all contact with the Kuwait Embassy and ensure your documents are correctly legalized.'
      : 'Du behöver inte besöka ambassaden själv. Vi hanterar all kontakt med Kuwaits ambassad och ser till att dina dokument blir korrekt legaliserade.',
    weHandleItems: isEnglish ? [
      'We submit your documents',
      'We collect them when ready',
      'We send them to you'
    ] : [
      'Vi lämnar in dina dokument',
      'Vi hämtar ut dem när de är klara',
      'Vi skickar dem till dig'
    ],
    orderNow: isEnglish ? 'Order now' : 'Beställ nu',
    ctaTitle: isEnglish ? 'Ready to legalize your documents for Kuwait?' : 'Redo att legalisera dina dokument för Kuwait?',
    ctaText: isEnglish
      ? 'We have helped hundreds of customers with legalization for Kuwait. Order online or contact us for advice.'
      : 'Vi har hjälpt hundratals kunder med legalisering för Kuwait. Beställ online eller kontakta oss för rådgivning.',
    metaTitle: isEnglish 
      ? 'Document Legalization for Kuwait - Kuwait Embassy Stockholm | DOX Visumpartner'
      : 'Legalisering för Kuwait - Kuwaits ambassad Stockholm | DOX Visumpartner',
    metaDesc: isEnglish
      ? 'We help you with document legalization for Kuwait. Complete service incl. notarization, MFA and Kuwait Embassy in Stockholm. Fixed price, fast handling.'
      : 'Vi hjälper dig med legalisering av dokument för Kuwait. Komplett service inkl. notarisering, UD och Kuwaits ambassad i Stockholm. Fast pris, snabb hantering.',
    metaKeywords: isEnglish
      ? 'Kuwait, legalization, embassy, Stockholm, documents, Kuwait City, work, visa'
      : 'Kuwait, legalisering, ambassad, Stockholm, dokument, Kuwait City, arbete, visum',
    ogDesc: isEnglish
      ? 'Complete legalization service for Kuwait. We handle the entire process for you.'
      : 'Komplett legaliseringsservice för Kuwait. Vi hanterar hela processen åt dig.',
    schemaName: isEnglish ? 'Document Legalization for Kuwait' : 'Legalisering för Kuwait',
    schemaDesc: isEnglish
      ? 'Legalization of documents for use in Kuwait via the Embassy of Kuwait in Stockholm'
      : 'Legalisering av dokument för användning i Kuwait via Kuwaits ambassad i Stockholm'
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
