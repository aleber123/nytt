import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import CountryFlag from '@/components/ui/CountryFlag';

export default function ThailandLegaliseringPage() {
  const { t } = useTranslation('common');

  return (
    <>
      <Head>
        <title>Legalisering för Thailand - UD-stämpel & Översättning | DOX Visumpartner</title>
        <meta name="description" content="Legalisering av svenska dokument för Thailand. Vi hjälper med UD-legalisering, auktoriserad översättning och ambassadlegalisering för vigselbevis, födelsebevis och andra dokument." />
        <meta name="keywords" content="Thailand legalisering, UD legalisering Thailand, översättning thailändska, vigselbevis Thailand, giftemål Thailand, legalisera dokument Thailand, apostille Thailand, auktoriserad översättning" />
        
        <meta property="og:title" content="Legalisering för Thailand - UD-stämpel & Översättning | DOX Visumpartner" />
        <meta property="og:description" content="Komplett legaliseringsservice för Thailand. UD-legalisering, auktoriserad översättning till engelska och thailändska." />
        <meta property="og:url" content="https://doxvl.se/legalisering/thailand" />
        <meta property="og:type" content="website" />
        
        <link rel="canonical" href="https://doxvl.se/legalisering/thailand" />
        
        {/* Service Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Legalisering för Thailand",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB",
            "url": "https://doxvl.se",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Livdjursgatan 4",
              "addressLocality": "Johanneshov",
              "postalCode": "121 62",
              "addressCountry": "SE"
            },
            "telephone": "+46-8-409-419-00"
          },
          "description": "Legalisering av svenska dokument för användning i Thailand. UD-legalisering, auktoriserad översättning och ambassadlegalisering.",
          "areaServed": ["SE", "TH"],
          "serviceType": "Document Legalization Service"
        })}} />

        {/* BreadcrumbList Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Hem", "item": "https://doxvl.se" },
            { "@type": "ListItem", "position": 2, "name": "Legalisering", "item": "https://doxvl.se/legalisering" },
            { "@type": "ListItem", "position": 3, "name": "Thailand", "item": "https://doxvl.se/legalisering/thailand" }
          ]
        })}} />

        {/* FAQPage Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Hur legaliserar jag ett vigselbevis för Thailand?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "För att legalisera ett vigselbevis för Thailand behövs: 1) Auktoriserad översättning till engelska och/eller thailändska, 2) Notarisering hos Notarius Publicus, 3) UD-legalisering, 4) Legalisering vid Thailands ambassad. Vi hanterar hela processen åt dig."
              }
            },
            {
              "@type": "Question",
              "name": "Hur lång tid tar legalisering för Thailand?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Normal handläggningstid är 2-3 veckor för komplett legalisering inklusive översättning, UD-stämpel och ambassadlegalisering. Vi erbjuder även expresshantering för brådskande ärenden."
              }
            },
            {
              "@type": "Question",
              "name": "Vad kostar det att legalisera dokument för Thailand?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Priset beror på dokumenttyp och vilka tjänster som behövs. Grundpris för UD-legalisering är från 1 319 kr per dokument. Översättning och ambassadlegalisering tillkommer. Kontakta oss för exakt offert."
              }
            },
            {
              "@type": "Question",
              "name": "Behöver jag översätta dokument till thailändska?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Det beror på användningsområdet. För giftemålsregistrering i Thailand krävs ofta översättning till både engelska och thailändska. Vi erbjuder auktoriserad översättning till båda språken."
              }
            }
          ]
        })}} />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#A51931] via-[#F4F5F8] to-[#2D2A4A] text-gray-900 py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <CountryFlag code="TH" size={64} />
              <div>
                <h1 className="text-3xl md:text-5xl font-bold">
                  Legalisering för Thailand
                </h1>
                <p className="text-xl text-gray-600">UD-legalisering & Auktoriserad översättning</p>
              </div>
            </div>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl">
              Ska du gifta dig, arbeta eller bosätta dig i Thailand? Vi hjälper dig med komplett 
              legalisering av svenska dokument – från översättning till UD-stämpel och ambassadlegalisering.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/bestall" className="bg-[#A51931] hover:bg-[#8A1528] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                Beställ legalisering
              </Link>
              <Link href="/kontakt" className="border-2 border-[#2D2A4A] hover:bg-[#2D2A4A] hover:text-white text-[#2D2A4A] font-semibold px-8 py-4 rounded-lg transition-colors">
                Kontakta oss för offert
              </Link>
            </div>
          </div>
        </section>

        {/* Visa Link Banner */}
        <section className="py-4 bg-[#2D2A4A] text-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <p className="flex items-center gap-2">
                <span className="text-xl">🛂</span>
                <span>Behöver du även visum till Thailand? Vi hjälper med pensionärsvisum, turistvisum och affärsvisum.</span>
              </p>
              <Link href="/visum/thailand" className="bg-white text-[#2D2A4A] font-semibold px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap">
                Läs om Thailand-visum →
              </Link>
            </div>
          </div>
        </section>

        {/* Marriage/Giftemål Section - Most relevant for the customer */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="bg-gradient-to-r from-pink-50 to-red-50 border border-pink-200 rounded-xl p-8 mb-12">
              <div className="flex items-start gap-4">
                <span className="text-4xl">💒</span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Giftemål & Äktenskapsregistrering i Thailand
                  </h2>
                  <p className="text-gray-700 mb-4">
                    Planerar du att gifta dig eller registrera ditt äktenskap i Thailand? Du behöver legaliserade 
                    dokument från Sverige. Vi hanterar hela processen – från översättning till färdig legalisering.
                  </p>
                  <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Dokument som ofta behövs:</h3>
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-start">
                          <span className="text-[#A51931] mr-2">✓</span>
                          Vigselbevis (borgerligt eller kyrkligt)
                        </li>
                        <li className="flex items-start">
                          <span className="text-[#A51931] mr-2">✓</span>
                          Personbevis/hindersprövning
                        </li>
                        <li className="flex items-start">
                          <span className="text-[#A51931] mr-2">✓</span>
                          Födelsebevis
                        </li>
                        <li className="flex items-start">
                          <span className="text-[#A51931] mr-2">✓</span>
                          Skilsmässobevis (om tillämpligt)
                        </li>
                        <li className="flex items-start">
                          <span className="text-[#A51931] mr-2">✓</span>
                          Dödsbevis för tidigare make/maka
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Vår kompletta tjänst:</h3>
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          Auktoriserad översättning till engelska
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          Auktoriserad översättning till thailändska
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          Notarisering hos Notarius Publicus
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          UD-legalisering (Utrikesdepartementet)
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          Legalisering vid Thailands ambassad
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Legaliseringsprocessen för Thailand
            </h2>
            <p className="text-gray-700 mb-8 max-w-3xl">
              Thailand är inte medlem i Haagkonventionen, vilket innebär att svenska dokument måste 
              genomgå full legalisering för att accepteras. Processen inkluderar flera steg som vi 
              hanterar åt dig.
            </p>
            
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: '1', title: 'Översättning', desc: 'Auktoriserad översättning till engelska och/eller thailändska av godkänd översättare.' },
                { step: '2', title: 'Notarisering', desc: 'Notarius Publicus bestyrker dokumentets äkthet och översättningens korrekthet.' },
                { step: '3', title: 'UD-legalisering', desc: 'Utrikesdepartementet legaliserar dokumentet för internationellt bruk.' },
                { step: '4', title: 'Ambassad', desc: 'Thailands ambassad i Stockholm slutlegaliserar dokumentet.' },
              ].map((item) => (
                <div key={item.step} className="bg-gray-50 p-6 rounded-lg text-center">
                  <div className="w-12 h-12 bg-[#A51931] text-white font-bold text-xl rounded-full flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Documents Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Vanliga dokument för Thailand
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-lg text-[#A51931] mb-4">👤 Personliga dokument</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start"><span className="text-[#A51931] mr-2">✓</span>Vigselbevis</li>
                  <li className="flex items-start"><span className="text-[#A51931] mr-2">✓</span>Födelsebevis</li>
                  <li className="flex items-start"><span className="text-[#A51931] mr-2">✓</span>Personbevis</li>
                  <li className="flex items-start"><span className="text-[#A51931] mr-2">✓</span>Dödsbevis</li>
                  <li className="flex items-start"><span className="text-[#A51931] mr-2">✓</span>Skilsmässobevis</li>
                  <li className="flex items-start"><span className="text-[#A51931] mr-2">✓</span>Namnändringsintyg</li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-lg text-[#A51931] mb-4">🎓 Utbildning & Arbete</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start"><span className="text-[#A51931] mr-2">✓</span>Examensbevis</li>
                  <li className="flex items-start"><span className="text-[#A51931] mr-2">✓</span>Betyg och intyg</li>
                  <li className="flex items-start"><span className="text-[#A51931] mr-2">✓</span>Arbetsgivarintyg</li>
                  <li className="flex items-start"><span className="text-[#A51931] mr-2">✓</span>Pensionsintyg</li>
                  <li className="flex items-start"><span className="text-[#A51931] mr-2">✓</span>Läkarintyg</li>
                  <li className="flex items-start"><span className="text-[#A51931] mr-2">✓</span>Straffregisterutdrag</li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-lg text-[#A51931] mb-4">🏢 Företagsdokument</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start"><span className="text-[#A51931] mr-2">✓</span>Registreringsbevis</li>
                  <li className="flex items-start"><span className="text-[#A51931] mr-2">✓</span>Bolagsordning</li>
                  <li className="flex items-start"><span className="text-[#A51931] mr-2">✓</span>Fullmakter</li>
                  <li className="flex items-start"><span className="text-[#A51931] mr-2">✓</span>Årsredovisning</li>
                  <li className="flex items-start"><span className="text-[#A51931] mr-2">✓</span>Avtal och kontrakt</li>
                  <li className="flex items-start"><span className="text-[#A51931] mr-2">✓</span>Exportdokument</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Pensionär Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-8">
              <div className="flex items-start gap-4">
                <span className="text-4xl">🌴</span>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Pensionär i Thailand? Vi hjälper dig!
                  </h2>
                  <p className="text-gray-700 mb-4">
                    Många svenska pensionärer väljer att bo i Thailand. För att ansöka om pensionärsvisum 
                    (Non-Immigrant O-A) behöver du legaliserade dokument från Sverige.
                  </p>
                  <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Dokument för pensionärsvisum:</h3>
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-start">
                          <span className="text-blue-600 mr-2">✓</span>
                          Pensionsintyg (från Pensionsmyndigheten)
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-600 mr-2">✓</span>
                          Utdrag ur belastningsregistret
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-600 mr-2">✓</span>
                          Läkarintyg på engelska
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-600 mr-2">✓</span>
                          Kontoutdrag/bankintyg
                        </li>
                      </ul>
                    </div>
                    <div className="flex flex-col justify-center">
                      <p className="text-gray-700 mb-4">
                        Vi erbjuder komplett service för pensionärer – legalisering av alla dokument 
                        plus hjälp med visumansökan.
                      </p>
                      <Link href="/visum/thailand" className="inline-block bg-[#2D2A4A] hover:bg-[#1a1539] text-white font-semibold px-6 py-3 rounded-lg transition-colors text-center">
                        Läs mer om pensionärsvisum →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Translation Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Auktoriserad översättning
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-700 mb-4">
                  För att svenska dokument ska accepteras i Thailand krävs ofta översättning till 
                  engelska och/eller thailändska. Översättningen måste göras av en auktoriserad 
                  översättare för att vara giltig.
                </p>
                <p className="text-gray-700 mb-4">
                  Vi samarbetar med auktoriserade översättare för både engelska och thailändska, 
                  vilket säkerställer att dina dokument accepteras av thailändska myndigheter.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>Tips:</strong> För giftemålsregistrering i Thailand krävs ofta översättning 
                    till både engelska OCH thailändska. Kontakta oss för att få veta exakt vad som 
                    behövs för ditt ärende.
                  </p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-lg mb-4">Vi erbjuder översättning till:</h3>
                <ul className="space-y-4">
                  <li className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <span className="text-2xl">🇬🇧</span>
                    <div>
                      <span className="font-semibold">Engelska</span>
                      <p className="text-sm text-gray-600">Auktoriserad översättning</p>
                    </div>
                  </li>
                  <li className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <span className="text-2xl">🇹🇭</span>
                    <div>
                      <span className="font-semibold">Thailändska</span>
                      <p className="text-sm text-gray-600">Auktoriserad översättning</p>
                    </div>
                  </li>
                </ul>
                <Link href="/kontakt" className="block w-full mt-6 bg-[#A51931] hover:bg-[#8A1528] text-white font-semibold py-3 rounded-lg transition-colors text-center">
                  Begär offert för översättning
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Embassy Info */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Thailands ambassad i Stockholm
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">Kontaktuppgifter</h3>
                <ul className="space-y-3 text-gray-700">
                  <li><strong>Adress:</strong> Floragatan 3, 114 31 Stockholm</li>
                  <li><strong>Telefon:</strong> +46 8 791 95 00</li>
                  <li><strong>E-post:</strong> info@thaiembassy.se</li>
                  <li><strong>Webb:</strong> <a href="https://thaiembassy.se" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">thaiembassy.se</a></li>
                </ul>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <strong>Öppettider legalisering:</strong><br />
                    Måndag–fredag 09:00–12:00
                  </p>
                </div>
              </div>
              <div className="bg-[#A51931]/10 p-6 rounded-lg border border-[#A51931]/30">
                <h3 className="font-semibold text-lg mb-4">Vi sköter ambassadbesöket</h3>
                <p className="text-gray-700 mb-4">
                  Du behöver inte besöka ambassaden själv. Vi lämnar in och hämtar ut dina 
                  dokument åt dig, vilket sparar tid och krångel.
                </p>
                <ul className="space-y-2 text-gray-700 mb-6">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Vi hanterar all kommunikation
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Vi lämnar in dokumenten
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Vi hämtar ut färdiga dokument
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Vi skickar till dig
                  </li>
                </ul>
                <Link href="/bestall" className="block w-full bg-[#A51931] hover:bg-[#8A1528] text-white font-semibold py-3 rounded-lg transition-colors text-center">
                  Beställ legalisering
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Vanliga frågor om legalisering för Thailand
            </h2>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-lg mb-2">Hur legaliserar jag ett vigselbevis för Thailand?</h3>
                <p className="text-gray-700">
                  För att legalisera ett vigselbevis för Thailand behövs: 1) Auktoriserad översättning 
                  till engelska och/eller thailändska, 2) Notarisering hos Notarius Publicus, 
                  3) UD-legalisering, 4) Legalisering vid Thailands ambassad. Vi hanterar hela processen åt dig.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-lg mb-2">Hur lång tid tar legalisering för Thailand?</h3>
                <p className="text-gray-700">
                  Normal handläggningstid är 2-3 veckor för komplett legalisering inklusive översättning, 
                  UD-stämpel och ambassadlegalisering. Vi erbjuder även expresshantering för brådskande ärenden.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-lg mb-2">Vad kostar det att legalisera dokument för Thailand?</h3>
                <p className="text-gray-700">
                  Priset beror på dokumenttyp och vilka tjänster som behövs. Grundpris för UD-legalisering 
                  är från 1 319 kr per dokument. Översättning och ambassadlegalisering tillkommer. 
                  Kontakta oss för exakt offert.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-lg mb-2">Behöver jag översätta dokument till thailändska?</h3>
                <p className="text-gray-700">
                  Det beror på användningsområdet. För giftemålsregistrering i Thailand krävs ofta 
                  översättning till både engelska och thailändska. Vi erbjuder auktoriserad översättning 
                  till båda språken.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-lg mb-2">Kan ni hjälpa med visum också?</h3>
                <p className="text-gray-700">
                  Ja! Vi erbjuder komplett service för Thailand – både legalisering av dokument och 
                  hjälp med visumansökan. Vi är specialiserade på pensionärsvisum (O-A) men hjälper 
                  även med turistvisum och affärsvisum.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-[#A51931] to-[#2D2A4A] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Behöver du legalisera dokument för Thailand?
            </h2>
            <p className="text-white/90 mb-8">
              Kontakta oss idag för personlig rådgivning och offert. Vi hanterar hela processen 
              – från översättning till färdig legalisering.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/bestall" className="bg-white hover:bg-gray-100 text-[#A51931] font-semibold px-8 py-4 rounded-lg transition-colors">
                Beställ legalisering
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-[#2D2A4A] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
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
  props: { ...(await serverSideTranslations(locale ?? 'sv', ['common'])) },
});
