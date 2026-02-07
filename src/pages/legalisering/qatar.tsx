import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import CountryFlag from '@/components/ui/CountryFlag';
import LegaliseringCountrySEO from '@/components/SEO/LegaliseringCountrySEO';



export default function QatarLegaliseringPage() {
  const { t } = useTranslation('common');

  const embassyInfo = {
    name: 'Qatars ambassad i Stockholm',
    address: 'Klarabergsviadukten 63, våning 5',
    postalCode: '111 64 Stockholm',
    phone: '+46 8 22 74 01',
    email: 'stockholm@mofa.gov.qa',
    website: 'https://stockholm.embassy.qa',
    openingHours: 'Måndag-Fredag 09:00-16:00'
  };

  return (
    <>
      <LegaliseringCountrySEO
        countryName="Qatar"
        countryCode="QA"
        slug="qatar"
        title="Legalisering för Qatar - Qatars ambassad Stockholm | DOX Visumpartner"
        titleEn="Document Legalization for Qatar - Embassy of Qatar Stockholm | DOX Visumpartner"
        description="Vi hjälper dig med legalisering av dokument för Qatar. Komplett service inkl. notarisering, UD och Qatars ambassad i Stockholm. Fast pris, snabb hantering."
        descriptionEn="We help you with document legalization for Qatar. Complete service including notarization, MFA and Embassy of Qatar in Stockholm. Fixed prices, fast handling."
        keywords="Qatar legalisering, legalisering Qatar, Qatars ambassad Stockholm, legalisera dokument Qatar, ambassadlegalisering Qatar, Doha, dokumentlegalisering, UD legalisering Qatar, arbetsvisum Qatar, Qatar attestering"
        keywordsEn="Qatar legalization, document legalization Qatar, Embassy of Qatar Stockholm, Qatar attestation, Qatar embassy legalization, Doha, document attestation, Qatar work visa documents"
        ogDescription="Komplett legaliseringsservice för Qatar via Qatars ambassad i Stockholm. Vi hanterar hela processen – notarisering, UD och ambassad."
        schemaDescription="Professionell dokumentlegaliseringstjänst för Qatar via Qatars ambassad i Stockholm. Komplett service inkl. notarisering, UD-verifiering och ambassadlegalisering."
        priceLow="1200"
        priceHigh="4500"
        faqItems={[
          { question: 'Hur legaliserar jag dokument för Qatar?', answer: 'Legaliseringsprocessen för Qatar inkluderar tre steg: 1) Notarisering hos Notarius Publicus, 2) Verifiering hos Utrikesdepartementet (UD), 3) Slutlig legalisering vid Qatars ambassad i Stockholm. DOX Visumpartner hanterar hela processen åt dig.' },
          { question: 'Hur lång tid tar legalisering för Qatar?', answer: 'Den kompletta legaliseringsprocessen tar normalt 5-10 arbetsdagar beroende på dokumenttyp och aktuella handläggningstider vid Qatars ambassad. Vi erbjuder expressservice för brådskande ärenden.' },
          { question: 'Vad kostar legalisering för Qatar?', answer: 'Priset beror på dokumenttyp och antal dokument. Kontakta DOX Visumpartner för en kostnadsfri offert. Vi erbjuder fasta priser utan dolda avgifter.' },
          { question: 'Vilka dokument kan legaliseras för Qatar?', answer: 'De vanligaste dokumenten är examensbevis, arbetsgivarintyg, födelsebevis, vigselbevis, bolagshandlingar, fullmakter och medicinska intyg. Kontakta oss om du är osäker på ditt specifika dokument.' },
          { question: 'Måste jag besöka Qatars ambassad själv?', answer: 'Nej, du behöver inte besöka ambassaden själv. DOX Visumpartner hanterar alla ambassadbesök, inlämning och uthämtning av dokument åt dig.' },
        ]}
      />

      

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#8A1538] to-[#5a0d25] text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <CountryFlag code="QA" size={64} />
              <div>
                <h1 className="text-3xl md:text-5xl font-bold">
                  Legalisering för Qatar
                </h1>
                <p className="text-xl text-white/80">Qatars ambassad i Stockholm</p>
              </div>
            </div>
            <p className="text-xl text-white/90 mb-8 max-w-2xl">
              Ska du arbeta, studera eller göra affärer i Qatar? Vi hjälper dig med komplett 
              legalisering av dina dokument – från notarisering till ambassadstämpel.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/bestall" className="bg-white hover:bg-gray-100 text-[#8A1538] font-semibold px-8 py-4 rounded-lg transition-colors">
                Beställ legalisering
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-[#8A1538] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                Kontakta oss
              </Link>
            </div>
          </div>
        </section>

        {/* Why Qatar Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Varför behövs legalisering för Qatar?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-700 mb-4">
                  Qatar kräver att utländska dokument legaliseras innan de kan användas i landet. 
                  Detta gäller för arbete, studier, företagsetablering och familjeärenden.
                </p>
                <p className="text-gray-700 mb-4">
                  Legaliseringsprocessen för Qatar inkluderar flera steg: notarisering, 
                  Utrikesdepartementet och slutligen Qatars ambassad i Stockholm.
                </p>
                <p className="text-gray-700">
                  Vi hanterar hela processen åt dig så att du kan fokusera på dina planer i Qatar.
                </p>
              </div>
              <div className="bg-[#8A1538]/5 p-6 rounded-lg border border-[#8A1538]/20">
                <h3 className="font-semibold text-lg mb-4">Vanliga dokument för Qatar:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-[#8A1538] mr-2">✓</span>
                    Examensbevis och utbildningsintyg
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#8A1538] mr-2">✓</span>
                    Arbetsgivarintyg och anställningsavtal
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#8A1538] mr-2">✓</span>
                    Personbevis och födelsebevis
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#8A1538] mr-2">✓</span>
                    Vigselbevis och familjedokument
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#8A1538] mr-2">✓</span>
                    Bolagshandlingar och fullmakter
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#8A1538] mr-2">✓</span>
                    Handelsdokument och ursprungsintyg
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
              Legaliseringsprocessen för Qatar
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: '1', title: 'Notarius Publicus', desc: 'Privata dokument notariseras först.' },
                { step: '2', title: 'Utrikesdepartementet', desc: 'UD verifierar dokumentets äkthet.' },
                { step: '3', title: 'Qatars ambassad', desc: 'Slutlig legalisering för Qatar.' },
                { step: '4', title: 'Leverans', desc: 'Dokumenten skickas till dig.' },
              ].map((item) => (
                <div key={item.step} className="bg-white p-6 rounded-lg shadow-sm text-center">
                  <div className="w-12 h-12 bg-[#8A1538] text-white font-bold text-xl rounded-full flex items-center justify-center mx-auto mb-4">
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
              Qatars ambassad i Stockholm
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
              <div className="bg-[#8A1538]/5 p-6 rounded-lg border border-[#8A1538]/20">
                <h3 className="font-semibold text-lg mb-4">Låt oss sköta kontakten</h3>
                <p className="text-gray-700 mb-4">
                  Du behöver inte besöka ambassaden själv. Vi hanterar all kontakt med 
                  Qatars ambassad och ser till att dina dokument blir korrekt legaliserade.
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
                <Link href="/bestall" className="block w-full bg-[#8A1538] hover:bg-[#6a1028] text-white font-semibold py-3 rounded-lg transition-colors text-center">
                  Beställ nu
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[#8A1538] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Redo att legalisera dina dokument för Qatar?
            </h2>
            <p className="text-white/80 mb-8">
              Vi har hjälpt hundratals kunder med legalisering för Qatar. Beställ online eller kontakta oss för rådgivning.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/bestall" className="bg-white hover:bg-gray-100 text-[#8A1538] font-semibold px-8 py-4 rounded-lg transition-colors">
                Beställ legalisering
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-[#8A1538] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
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
