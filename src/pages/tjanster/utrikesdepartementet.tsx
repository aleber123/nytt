import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';



export default function UtrikesdepartementetPage() {
  const { t } = useTranslation('common');
  const sp = 'servicePages.utrikesdepartementet';

  return (
    <>
      <Head>
        <title>{t(`${sp}.title`)} | DOX Visumpartner – UD-legalisering Sverige</title>
        <meta name="description" content={t(`${sp}.metaDescription`)} />
        <meta name="keywords" content="utrikesdepartementet, UD legalisering, UD-legalisering, legalisering utrikesdepartementet, legalisering UD Sverige, UD stämpel, legalisera dokument UD, utrikesdepartementet legalisering pris, UD legalisering Stockholm, legalisering innan ambassad, UD legalisering handläggningstid, legalisering svenska dokument, UD legalisering online, utrikesdepartementet dokument, legalisering för utlandet, UD legalisering 255 kr, Malmtorgsgatan 3A, legalisering myndighetshandlingar, UD legalisering nya regler 2025, legalisering postförskott, legalisering stämpel namnteckning, legalisering universitet betyg, legalisering vigselbevis, legalisering fullmakt notarius publicus, EU undantag legalisering apostille" />
        <link rel="canonical" href="https://doxvl.se/tjanster/utrikesdepartementet" />
        <link rel="alternate" hrefLang="sv" href="https://doxvl.se/tjanster/utrikesdepartementet" />
        <link rel="alternate" hrefLang="en" href="https://doxvl.se/en/tjanster/utrikesdepartementet" />
        <link rel="alternate" hrefLang="x-default" href="https://doxvl.se/tjanster/utrikesdepartementet" />
        
        <meta property="og:title" content={`${t(`${sp}.title`)} | DOX Visumpartner`} />
        <meta property="og:description" content={t(`${sp}.metaDescription`)} />
        <meta property="og:url" content="https://doxvl.se/tjanster/utrikesdepartementet" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://doxvl.se/dox-logo.webp" />
        <meta property="og:site_name" content="DOX Visumpartner" />
        <meta property="og:locale" content="sv_SE" />
        <meta property="og:locale:alternate" content="en_GB" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${t(`${sp}.title`)} | DOX Visumpartner`} />
        <meta name="twitter:description" content={t(`${sp}.metaDescription`)} />
        <meta name="twitter:image" content="https://doxvl.se/dox-logo.webp" />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "UD-legalisering – Legalisering via Utrikesdepartementet i Sverige",
          "alternateName": "Ministry for Foreign Affairs Legalization",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB",
            "url": "https://doxvl.se",
            "logo": "https://doxvl.se/dox-logo.webp",
            "telephone": "+46840941900",
            "email": "info@doxvl.se",
            "address": { "@type": "PostalAddress", "streetAddress": "Livdjursgatan 4", "addressLocality": "Stockholm", "postalCode": "121 62", "addressCountry": "SE" }
          },
          "description": "Legalisering av dokument hos Utrikesdepartementet (UD) för användning utomlands. UD intygar att namnteckning och stämpel på svenska handlingar är äkta. UD:s egen avgift är 255 kr per legalisering. Vi hanterar hela processen åt dig – inlämning på Malmtorgsgatan 3A, bevakning och returnering. Från 895 kr inkl. moms och hantering.",
          "areaServed": [
            { "@type": "Country", "name": "Sweden" },
            { "@type": "Country", "name": "Norway" },
            { "@type": "Country", "name": "Denmark" },
            { "@type": "Country", "name": "Finland" }
          ],
          "serviceType": "Document Legalization – Ministry for Foreign Affairs",
          "category": "Dokumentlegalisering",
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "UD-legaliseringstjänster",
            "itemListElement": [
              { "@type": "Offer", "name": "UD-legalisering – Standard", "price": "895", "priceCurrency": "SEK", "availability": "https://schema.org/InStock", "priceValidUntil": "2027-12-31" },
              { "@type": "Offer", "name": "UD-legalisering – Express", "price": "1395", "priceCurrency": "SEK", "availability": "https://schema.org/InStock", "priceValidUntil": "2027-12-31" }
            ]
          }
        })}} />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Hem", "item": "https://doxvl.se" },
            { "@type": "ListItem", "position": 2, "name": "Tjänster", "item": "https://doxvl.se/tjanster" },
            { "@type": "ListItem", "position": 3, "name": "Utrikesdepartementet", "item": "https://doxvl.se/tjanster/utrikesdepartementet" }
          ]
        })}} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "Hur man legaliserar dokument via Utrikesdepartementet",
          "description": "Steg-för-steg guide för UD-legalisering av svenska dokument. UD:s expedition finns på Malmtorgsgatan 3A i Stockholm.",
          "totalTime": "P5D",
          "estimatedCost": { "@type": "MonetaryAmount", "currency": "SEK", "value": "895" },
          "step": [
            { "@type": "HowToStep", "position": 1, "name": "Beställ online", "text": "Fyll i beställningsformuläret på doxvl.se med information om dokument och destinationsland. Vi kontrollerar att dokumentet uppfyller UD:s krav – handlingen måste vara försedd med stämpel, namnunderskrift i original och namnförtydligande." },
            { "@type": "HowToStep", "position": 2, "name": "Skicka in dokument", "text": "Skicka originaldokumentet till oss per post. Dokumentet måste vara på svenska eller engelska (krav sedan 1 juli 2025). Om översättning behövs kan vi ordna auktoriserad översättning via Kammarkollegiet-godkänd translator." },
            { "@type": "HowToStep", "position": 3, "name": "UD-legalisering", "text": "Vi lämnar in ditt dokument på UD:s expedition på Malmtorgsgatan 3A i Stockholm. UD intygar att namnteckningen och stämpeln är äkta samt i vilken egenskap undertecknaren har skrivit på. UD:s avgift är 255 kr per legalisering." },
            { "@type": "HowToStep", "position": 4, "name": "Eventuell ambassadlegalisering", "text": "Efter UD-legalisering ska handlingen vanligen bestyrkas av den utländska ambassaden i Stockholm som företräder det land där handlingen ska användas. Vi kan hantera även detta steg." },
            { "@type": "HowToStep", "position": 5, "name": "Returnering", "text": "Ditt legaliserade dokument skickas tillbaka med spårbar frakt, redo att användas utomlands." }
          ]
        })}} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Vad gör Utrikesdepartementet vid legalisering?",
              "acceptedAnswer": { "@type": "Answer", "text": "Utrikesdepartementet (UD) intygar att en namnteckning och sigill/stämpel på en svensk handling är äkta, samt i vilken egenskap undertecknaren har skrivit på. En legalisering säger ingenting om innehållet i handlingen. Efter UD-legalisering ska handlingen vanligen också bestyrkas av den utländska ambassaden i Stockholm." }
            },
            {
              "@type": "Question",
              "name": "Vilka dokument kan UD legalisera?",
              "acceptedAnswer": { "@type": "Answer", "text": "UD kan legalisera: allmänna handlingar från statliga svenska myndigheter, betyg/intyg från universitet och högskolor, dokument från Försäkringskassan och Arbetsförmedlingen, handlingar från Riks- och landsarkivet, namnunderskrifter från läkare och andra av Socialstyrelsen legitimerade yrken, registerutdrag och polisiära handlingar, dokument undertecknade av Notarius Publicus, handelskammarhandlingar, vigselbevis från borgerliga vigselförrättare, samt översättningar av auktoriserade translatorer godkända av Kammarkollegiet." }
            },
            {
              "@type": "Question",
              "name": "Vilka dokument kan UD INTE legalisera?",
              "acceptedAnswer": { "@type": "Answer", "text": "UD kan inte legalisera: kopior som saknar namnunderskrift i original, handlingar utfärdade av privatpersoner, fullmakter, betyg från andra skolor än universitet/högskolor, fakturor och handelsdokument (dessa hanteras av handelskammaren), handlingar från banker/advokater/privata företag, handlingar från landstingsarkiv och kommunala arkiv, vigselbevis från icke borgerliga vigselförrättare, samt översättningar av icke auktoriserade översättare." }
            },
            {
              "@type": "Question",
              "name": "Vad kostar UD-legalisering?",
              "acceptedAnswer": { "@type": "Answer", "text": "UD:s egen avgift är 255 kr per legalisering (per namnteckning/stämpel som ska intygas). UD-legalisering via DOX Visumpartner kostar från 895 kr inklusive moms, vilket inkluderar hantering, inlämning på UD:s expedition och returnering. Expresstjänst kostar från 1 395 kr." }
            },
            {
              "@type": "Question",
              "name": "Vilka nya regler gäller från 1 juli 2025?",
              "acceptedAnswer": { "@type": "Answer", "text": "Från 1 juli 2025 gäller nya regler enligt Förordning 2025:549: 1) Legalisering får inte ske om det är uppenbart att handlingen kan ifrågasättas eller användas för lagstridiga syften. 2) Legalisering får inte ske av Notarius Publicus bestyrkande av kopia om originalhandlingen kan förses med behörig persons underskrift. 3) Handlingen måste vara skriven på eller översatt till svenska eller engelska. 4) Översättningar av icke auktoriserade översättare ska förses med en försäkran på heder och samvete inför Notarius Publicus." }
            },
            {
              "@type": "Question",
              "name": "Hur lång tid tar UD-legalisering?",
              "acceptedAnswer": { "@type": "Answer", "text": "UD:s expedition på Malmtorgsgatan 3A i Stockholm har öppet helgfria vardagar måndag–torsdag kl 09:00–11:00. Vid personligt besök görs legaliseringen medan man väntar (max 6 handlingar per besök). Via post tar det i genomsnitt 1–2 veckor. Via DOX Visumpartner erbjuder vi standardtjänst (3–5 arbetsdagar) och expresstjänst (1–2 dagar)." }
            },
            {
              "@type": "Question",
              "name": "Vad är skillnaden mellan UD-legalisering och apostille?",
              "acceptedAnswer": { "@type": "Answer", "text": "UD utfärdar inte apostille – det gör enbart Notarius Publicus sedan 1 januari 2005. Apostille gäller för länder anslutna till Haagkonventionen och ersätter hela legaliseringskedjan. UD-legalisering behövs för länder utanför Haagkonventionen (t.ex. Qatar, Kuwait, UAE, Saudiarabien) och kräver efterföljande ambassadlegalisering." }
            },
            {
              "@type": "Question",
              "name": "Gäller EU-undantag från legalisering?",
              "acceptedAnswer": { "@type": "Answer", "text": "Ja, enligt en EU-förordning är vissa officiella handlingar och bestyrkta kopior undantagna från legalisering och apostille inom EU sedan 16 februari 2019. Detta innebär att dokument som ska användas inom EU ofta inte behöver legaliseras alls." }
            },
            {
              "@type": "Question",
              "name": "Vilka steg kommer efter UD-legalisering?",
              "acceptedAnswer": { "@type": "Answer", "text": "Efter UD-legalisering ska dokumentet vanligtvis legaliseras av det aktuella landets ambassad i Stockholm (ambassadlegalisering). Vi kan hantera hela kedjan: notarisering → UD → ambassad som en komplett tjänst. Vanliga destinationsländer: Qatar, Kuwait, Saudiarabien, UAE, Egypten, Irak, Angola och Nigeria." }
            },
            {
              "@type": "Question",
              "name": "Kan jag beställa UD-legalisering online?",
              "acceptedAnswer": { "@type": "Answer", "text": "Ja, beställ enkelt online via doxvl.se. Skicka in ditt dokument per post och vi hanterar hela processen med Utrikesdepartementet åt dig – inklusive inlämning på UD:s expedition, bevakning och returnering med spårbar frakt. Vi betjänar kunder i hela Sverige samt Norge, Danmark och Finland." }
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
                {t(`${sp}.title`)}
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                {t(`${sp}.heroText`)}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/bestall" className="bg-custom-button hover:bg-custom-button/90 text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                  {t('servicePages.orderNow')}
                </Link>
                <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-black text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                  {t('servicePages.contactUs')}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* What is UD Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              {t(`${sp}.whatTitle`)}
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-700 mb-4">
                  {t(`${sp}.whatText1`)}
                </p>
                <p className="text-gray-700 mb-4">
                  {t(`${sp}.whatText2`)}
                </p>
                <p className="text-gray-700">
                  {t(`${sp}.whatText3`)}
                </p>
              </div>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">{t(`${sp}.documentsTitle`)}</h3>
                <ul className="space-y-2 text-gray-700">
                  {(t(`${sp}.documents`, { returnObjects: true }) as string[]).map((doc, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
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
              {t(`${sp}.processTitle`)}
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {(t(`${sp}.processSteps`, { returnObjects: true }) as Array<{title: string; desc: string}>).map((item, idx) => (
                <div key={idx} className="bg-white p-6 rounded-lg shadow-sm text-center">
                  <div className="w-12 h-12 bg-custom-button text-white font-bold text-xl rounded-full flex items-center justify-center mx-auto mb-4">
                    {idx + 1}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              {t(`${sp}.faqTitle`)}
            </h2>
            <div className="space-y-4">
              {(t(`${sp}.faqs`, { returnObjects: true }) as Array<{q: string; a: string}>).map((faq, idx) => (
                <div key={idx} className="bg-white p-6 rounded-lg shadow-sm">
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
              {t(`${sp}.ctaTitle`)}
            </h2>
            <p className="text-gray-300 mb-8">
              {t(`${sp}.ctaText`)}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/bestall" className="bg-custom-button hover:bg-custom-button/90 text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                {t('servicePages.orderNow')}
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-black text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                {t('servicePages.contactUs')}
              </Link>
            </div>
          </div>
        </section>

        {/* Related Services - Internal Linking */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 text-center">
              Relaterade tjänster
            </h2>
            <p className="text-gray-600 text-center mb-8">
              UD-legalisering är ett steg i kedjan. Vi erbjuder komplett legaliseringsservice.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <Link href="/tjanster/notarius-publicus" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-teal-300 transition-all group">
                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">Notarius Publicus</h3>
                <p className="text-gray-600 text-sm">Steg 1: Bestyrkning av dokument – krävs innan UD-legalisering.</p>
              </Link>
              <Link href="/tjanster/ambassadlegalisering" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-teal-300 transition-all group">
                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">Ambassadlegalisering</h3>
                <p className="text-gray-600 text-sm">Steg 3: Legalisering via utländska ambassader – nästa steg efter UD.</p>
              </Link>
              <Link href="/tjanster/oversattning" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-teal-300 transition-all group">
                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">Auktoriserad översättning</h3>
                <p className="text-gray-600 text-sm">Behöver ditt dokument översättas innan legalisering?</p>
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
