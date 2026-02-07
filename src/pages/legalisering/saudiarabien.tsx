import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import CountryFlag from '@/components/ui/CountryFlag';
import LegaliseringCountrySEO from '@/components/SEO/LegaliseringCountrySEO';

export default function SaudiarabienLegaliseringPage() {
  const { t } = useTranslation('common');

  const embassyInfo = {
    name: 'Saudiarabiens ambassad i Stockholm',
    address: 'Engelbrektsgatan 5',
    postalCode: '114 32 Stockholm',
    phone: '+46 8 679 95 00',
    email: 'sweemb@mofa.gov.sa',
    website: 'https://embassies.mofa.gov.sa/sites/sweden',
    openingHours: 'Måndag-Fredag 09:00-15:00'
  };

  return (
    <>
      <LegaliseringCountrySEO
        countryName="Saudiarabien"
        countryNameEn="Saudi Arabia"
        countryCode="SA"
        slug="saudiarabien"
        title="Legalisering för Saudiarabien - Saudiarabiens ambassad Stockholm | DOX Visumpartner"
        titleEn="Document Legalization for Saudi Arabia - Saudi Embassy Stockholm | DOX Visumpartner"
        description="Vi hjälper dig med legalisering av dokument för Saudiarabien. Komplett service inkl. notarisering, UD och Saudiarabiens ambassad i Stockholm. Fast pris, snabb hantering."
        descriptionEn="We help you with document legalization for Saudi Arabia. Complete service including notarization, MFA and Saudi Embassy in Stockholm. Fixed prices."
        keywords="Saudiarabien legalisering, legalisering Saudiarabien, Saudi ambassad Stockholm, legalisera dokument Saudi, ambassadlegalisering Saudiarabien, Riyadh, Jeddah, Iqama, dokumentlegalisering, UD legalisering Saudi, arbetsvisum Saudiarabien"
        keywordsEn="Saudi Arabia legalization, document legalization Saudi Arabia, Saudi Embassy Stockholm, Saudi attestation, Riyadh, Jeddah, Iqama, document attestation, Saudi work visa documents"
        ogDescription="Komplett legaliseringsservice för Saudiarabien via Saudiarabiens ambassad i Stockholm. Notarisering, UD och ambassadlegalisering."
        schemaDescription="Professionell dokumentlegaliseringstjänst för Saudiarabien via Saudiarabiens ambassad i Stockholm."
        priceLow="1200"
        priceHigh="5000"
        faqItems={[
          { question: 'Hur legaliserar jag dokument för Saudiarabien?', answer: 'Legaliseringsprocessen för Saudiarabien inkluderar tre steg: 1) Notarisering hos Notarius Publicus, 2) Verifiering hos Utrikesdepartementet (UD), 3) Slutlig legalisering vid Saudiarabiens ambassad i Stockholm. DOX Visumpartner hanterar hela processen åt dig.' },
          { question: 'Hur lång tid tar legalisering för Saudiarabien?', answer: 'Den kompletta legaliseringsprocessen tar normalt 5-15 arbetsdagar beroende på dokumenttyp. Saudiarabiens ambassad har ibland längre handläggningstider. Vi erbjuder expressservice för brådskande ärenden.' },
          { question: 'Vad kostar legalisering för Saudiarabien?', answer: 'Priset varierar beroende på dokumenttyp och antal dokument. Kontakta DOX Visumpartner för en kostnadsfri offert. Vi erbjuder fasta priser utan dolda avgifter.' },
          { question: 'Vilka dokument behövs för Iqama i Saudiarabien?', answer: 'För Iqama (uppehållstillstånd) behövs vanligtvis legaliserade examensbevis, arbetsgivarintyg och personbevis. Kontakta oss för rådgivning om ditt specifika ärende.' },
          { question: 'Måste jag besöka Saudiarabiens ambassad själv?', answer: 'Nej, DOX Visumpartner hanterar alla ambassadbesök, inlämning och uthämtning av dokument åt dig. Vi levererar de legaliserade dokumenten direkt till dig.' },
        ]}
      />

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#006C35] to-[#004d26] text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <CountryFlag code="SA" size={64} />
              <div>
                <h1 className="text-3xl md:text-5xl font-bold">
                  Legalisering för Saudiarabien
                </h1>
                <p className="text-xl text-white/80">Saudiarabiens ambassad i Stockholm</p>
              </div>
            </div>
            <p className="text-xl text-white/90 mb-8 max-w-2xl">
              Ska du arbeta, studera eller göra affärer i Saudiarabien? Vi hjälper dig med komplett 
              legalisering av dina dokument – från notarisering till ambassadstämpel.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/bestall" className="bg-white hover:bg-gray-100 text-[#006C35] font-semibold px-8 py-4 rounded-lg transition-colors">
                Beställ legalisering
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-[#006C35] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                Kontakta oss
              </Link>
            </div>
          </div>
        </section>

        {/* Why Saudi Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Varför behövs legalisering för Saudiarabien?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-700 mb-4">
                  Saudiarabien kräver att utländska dokument legaliseras innan de kan användas i landet. 
                  Detta gäller för arbete, studier, företagsetablering och familjeärenden.
                </p>
                <p className="text-gray-700 mb-4">
                  Legaliseringsprocessen för Saudiarabien inkluderar flera steg: notarisering, 
                  Utrikesdepartementet och slutligen Saudiarabiens ambassad i Stockholm.
                </p>
                <p className="text-gray-700">
                  Vi hanterar hela processen åt dig så att du kan fokusera på dina planer i Saudiarabien.
                </p>
              </div>
              <div className="bg-[#006C35]/5 p-6 rounded-lg border border-[#006C35]/20">
                <h3 className="font-semibold text-lg mb-4">Vanliga dokument för Saudiarabien:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-[#006C35] mr-2">✓</span>
                    Examensbevis och utbildningsintyg
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#006C35] mr-2">✓</span>
                    Arbetsgivarintyg och anställningsavtal
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#006C35] mr-2">✓</span>
                    Personbevis och födelsebevis
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#006C35] mr-2">✓</span>
                    Vigselbevis och familjedokument
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#006C35] mr-2">✓</span>
                    Bolagshandlingar och fullmakter
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#006C35] mr-2">✓</span>
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
              Legaliseringsprocessen för Saudiarabien
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: '1', title: 'Notarius Publicus', desc: 'Privata dokument notariseras först.' },
                { step: '2', title: 'Utrikesdepartementet', desc: 'UD verifierar dokumentets äkthet.' },
                { step: '3', title: 'Saudiarabiens ambassad', desc: 'Slutlig legalisering för Saudiarabien.' },
                { step: '4', title: 'Leverans', desc: 'Dokumenten skickas till dig.' },
              ].map((item) => (
                <div key={item.step} className="bg-white p-6 rounded-lg shadow-sm text-center">
                  <div className="w-12 h-12 bg-[#006C35] text-white font-bold text-xl rounded-full flex items-center justify-center mx-auto mb-4">
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
              Saudiarabiens ambassad i Stockholm
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
              <div className="bg-[#006C35]/5 p-6 rounded-lg border border-[#006C35]/20">
                <h3 className="font-semibold text-lg mb-4">Låt oss sköta kontakten</h3>
                <p className="text-gray-700 mb-4">
                  Du behöver inte besöka ambassaden själv. Vi hanterar all kontakt med 
                  Saudiarabiens ambassad och ser till att dina dokument blir korrekt legaliserade.
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
                <Link href="/bestall" className="block w-full bg-[#006C35] hover:bg-[#004d26] text-white font-semibold py-3 rounded-lg transition-colors text-center">
                  Beställ nu
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[#006C35] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Redo att legalisera dina dokument för Saudiarabien?
            </h2>
            <p className="text-white/80 mb-8">
              Vi har hjälpt hundratals kunder med legalisering för Saudiarabien. Beställ online eller kontakta oss för rådgivning.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/bestall" className="bg-white hover:bg-gray-100 text-[#006C35] font-semibold px-8 py-4 rounded-lg transition-colors">
                Beställ legalisering
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-[#006C35] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
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
