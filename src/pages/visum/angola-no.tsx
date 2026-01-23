import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import CountryFlag from '@/components/ui/CountryFlag';

export default function AngolaVisumNorskPage() {
  const { t } = useTranslation('common');

  const embassyInfo = {
    name: 'Angolas ambassade i Stockholm',
    address: 'Ulriksdals Slottsväg 4',
    postalCode: '170 79 Solna, Sverige',
    phone: '+46 8 655 00 70',
    email: 'embassy@angolaemb.se',
    openingHours: 'Mandag-Fredag 09:00-16:00'
  };

  const visumTypes = [
    {
      name: 'Turistvisum',
      duration: 'Opptil 30 dager',
      description: 'For turisme og besøk hos familie/venner'
    },
    {
      name: 'Forretningsvisum',
      duration: 'Opptil 90 dager',
      description: 'For forretningsmøter, konferanser og bedriftsbesøk'
    },
    {
      name: 'Arbeidsvisum',
      duration: 'Varierer',
      description: 'For ansettelse hos angolansk selskap'
    },
    {
      name: 'Transittvisum',
      duration: 'Opptil 5 dager',
      description: 'For gjennomreise til annet land'
    }
  ];

  const requiredDocuments = [
    'Gyldig pass (minst 6 måneders gyldighet)',
    'Utfylt visumsøknad',
    'Passfoto (2 stk, 35x45mm)',
    'Invitasjonsbrev eller hotellreservasjon',
    'Returbillett eller reiseplan',
    'Bevis på økonomiske midler',
    'Gulfeber-vaksinasjonssertifikat',
    'Reiseforsikring'
  ];

  return (
    <>
      <Head>
        <title>Visum til Angola - Søk om angolansk visum | DOX Visumpartner</title>
        <meta name="description" content="Trenger du visum til Angola? Vi hjelper deg med visumsøknad til Angola. Turistvisum, forretningsvisum og arbeidsvisum. Rask behandling via Angolas ambassade." />
        <meta name="keywords" content="Angola visum, visum Angola, angolansk visum, turistvisum Angola, forretningsvisum Angola, arbeidsvisum Angola, Angolas ambassade, visumsøknad Angola, visum Norge" />
        
        <meta property="og:title" content="Visum til Angola - Søk om angolansk visum | DOX Visumpartner" />
        <meta property="og:description" content="Vi hjelper deg med visumsøknad til Angola. Turistvisum, forretningsvisum og arbeidsvisum via Angolas ambassade." />
        <meta property="og:url" content="https://www.doxvl.se/visum/angola-no" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="nb_NO" />
        
        <link rel="canonical" href="https://www.doxvl.se/visum/angola-no" />
        <link rel="alternate" hrefLang="sv" href="https://www.doxvl.se/visum/angola" />
        <link rel="alternate" hrefLang="nb" href="https://www.doxvl.se/visum/angola-no" />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Visum til Angola",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB",
            "url": "https://www.doxvl.se"
          },
          "description": "Visumtjeneste for Angola. Vi hjelper deg med søknad om turistvisum, forretningsvisum og arbeidsvisum til Angola.",
          "areaServed": ["NO", "SE"],
          "serviceType": "Visa Application Service"
        })}} />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#CE1126] to-[#A00D1E] text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <CountryFlag code="AO" size={64} />
              <div>
                <h1 className="text-3xl md:text-5xl font-bold">
                  Visum til Angola
                </h1>
                <p className="text-xl text-white/80">For norske statsborgere</p>
              </div>
            </div>
            <p className="text-xl text-white/90 mb-8 max-w-2xl">
              Planlegger du å reise til Angola? Vi hjelper deg med hele visumprosessen – 
              fra søknad til godkjent visum. Kontakt oss for personlig rådgivning.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/kontakt" className="bg-white hover:bg-gray-100 text-[#CE1126] font-semibold px-8 py-4 rounded-lg transition-colors">
                Kontakt oss for tilbud
              </Link>
              <a href="tel:+46812345678" className="border-2 border-white hover:bg-white hover:text-[#CE1126] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                Ring oss
              </a>
            </div>
          </div>
        </section>

        {/* Visum Types Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Typer visum til Angola
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {visumTypes.map((visum) => (
                <div key={visum.name} className="bg-gray-50 p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-lg text-[#CE1126] mb-2">{visum.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">{visum.duration}</p>
                  <p className="text-gray-700">{visum.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Angola Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Hvorfor trengs visum til Angola?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-700 mb-4">
                  Angola krever visum for norske statsborgere som ønsker å besøke landet. 
                  Uansett om du reiser for turisme, forretninger eller arbeid, trenger du et gyldig visum 
                  før avreise.
                </p>
                <p className="text-gray-700 mb-4">
                  Visumsøknad gjøres via Angolas ambassade i Stockholm. Prosessen kan være 
                  tidkrevende og krever korrekte dokumenter. Vi hjelper deg å unngå 
                  vanlige feil og sikrer at søknaden din blir godkjent.
                </p>
                <p className="text-gray-700">
                  Angola er et land med store muligheter innen olje, diamanter og landbruk. 
                  Mange norske selskaper har virksomhet i landet, noe som gjør forretningsvisum til 
                  en vanlig forespørsel.
                </p>
              </div>
              <div className="bg-[#CE1126]/5 p-6 rounded-lg border border-[#CE1126]/20">
                <h3 className="font-semibold text-lg mb-4">Dokumenter som kreves:</h3>
                <ul className="space-y-2 text-gray-700">
                  {requiredDocuments.map((doc, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-[#CE1126] mr-2">✓</span>
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Slik fungerer visumprosessen
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: '1', title: 'Kontakt oss', desc: 'Fortell om reisen din, så gir vi deg et tilbud.' },
                { step: '2', title: 'Send dokumenter', desc: 'Vi forteller nøyaktig hvilke dokumenter som trengs.' },
                { step: '3', title: 'Vi søker', desc: 'Vi leverer søknaden din til ambassaden.' },
                { step: '4', title: 'Visum klart', desc: 'Du får visumet ditt levert hjem.' },
              ].map((item) => (
                <div key={item.step} className="bg-gray-50 p-6 rounded-lg text-center">
                  <div className="w-12 h-12 bg-[#CE1126] text-white font-bold text-xl rounded-full flex items-center justify-center mx-auto mb-4">
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
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Angolas ambassade i Stockholm
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-lg mb-4">Kontaktinformasjon</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-3">📍</span>
                    <div>
                      <strong>Adresse:</strong><br />
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
                    <span className="text-gray-400 mr-3">🕐</span>
                    <div>
                      <strong>Åpningstider:</strong><br />
                      {embassyInfo.openingHours}
                    </div>
                  </li>
                </ul>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>For norske kunder:</strong> Angola har ikke ambassade i Norge. 
                    Visumsøknader behandles via ambassaden i Stockholm, Sverige.
                  </p>
                </div>
              </div>
              <div className="bg-[#CE1126]/5 p-6 rounded-lg border border-[#CE1126]/20">
                <h3 className="font-semibold text-lg mb-4">La oss hjelpe deg</h3>
                <p className="text-gray-700 mb-4">
                  Visumsøknad til Angola kan være komplisert. Vi har erfaring med å 
                  hjelpe både privatpersoner og bedrifter med angolanske visum.
                </p>
                <ul className="space-y-2 text-gray-700 mb-6">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Personlig rådgivning
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Gjennomgang av dokumenter
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Innlevering til ambassaden
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Oppfølging og levering
                  </li>
                </ul>
                <Link href="/kontakt" className="block w-full bg-[#CE1126] hover:bg-[#A00D1E] text-white font-semibold py-3 rounded-lg transition-colors text-center">
                  Kontakt oss
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Vanlige spørsmål om visum til Angola
            </h2>
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Hvor lang tid tar det å få visum til Angola?</h3>
                <p className="text-gray-700">
                  Behandlingstiden varierer, men er normalt 5-10 virkedager. Vi anbefaler 
                  å søke minst 3-4 uker før planlagt avreise.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Trenger jeg gulfebervaksine?</h3>
                <p className="text-gray-700">
                  Ja, Angola krever gulfeber-vaksinasjonssertifikat for alle reisende. 
                  Vaksinasjonen må være gjort minst 10 dager før innreise.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Kan jeg forlenge visumet mitt i Angola?</h3>
                <p className="text-gray-700">
                  Ja, det er mulig å forlenge visum i Angola ved å kontakte 
                  immigrasjonsmyndigheten (SME) i Luanda før ditt nåværende visum utløper.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Hva koster visum til Angola?</h3>
                <p className="text-gray-700">
                  Kostnaden varierer avhengig av visumtype og behandlingstid. 
                  Kontakt oss for et nøyaktig tilbud basert på dine behov.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Jeg bor i Norge - hvordan søker jeg?</h3>
                <p className="text-gray-700">
                  Siden Angola ikke har ambassade i Norge, behandles søknader via Stockholm. 
                  Vi kan håndtere hele prosessen for deg, inkludert forsendelse av dokumenter.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[#CE1126] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Trenger du visum til Angola?
            </h2>
            <p className="text-white/80 mb-8">
              Kontakt oss i dag for personlig rådgivning og et tilbud. Vi hjelper deg gjennom hele visumprosessen.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/kontakt" className="bg-white hover:bg-gray-100 text-[#CE1126] font-semibold px-8 py-4 rounded-lg transition-colors">
                Kontakt oss
              </Link>
              <Link href="/visum/angola" className="border-2 border-white hover:bg-white hover:text-[#CE1126] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                Svenska versionen
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
