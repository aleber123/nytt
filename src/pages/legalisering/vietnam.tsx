import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import LegaliseringCountrySEO from '@/components/SEO/LegaliseringCountrySEO';
import Link from 'next/link';
import CountryFlag from '@/components/ui/CountryFlag';

export default function VietnamLegaliseringPage() {
  const { t } = useTranslation('common');

  const embassyInfo = {
    name: 'Vietnams ambassad i Stockholm',
    address: 'Ormingevägen 30',
    postalCode: '132 37 Saltsjö-Boo',
    phone: '+46 8 556 817 60',
    email: 'vnemb.se@mofa.gov.vn',
    website: 'https://vnembassy-stockholm.mofa.gov.vn',
    openingHours: 'Måndag-Fredag 09:00-12:00, 14:00-17:00'
  };

  return (
    <>
<LegaliseringCountrySEO
        countryName="Vietnam"
        countryNameEn="Vietnam"
        countryCode="VN"
        slug="vietnam"
        title="Legalisering för Vietnam | DOX Visumpartner"
        titleEn="Document Legalization for Vietnam | DOX Visumpartner"
        description="Vi hjälper dig med legalisering av dokument för Vietnam. Komplett service inkl. notarisering, UD och ambassadlegalisering. Fast pris, snabb hantering."
        descriptionEn="We help you with document legalization for Vietnam. Complete service including notarization, MFA and embassy legalization."
        keywords="Vietnam legalisering, legalisering Vietnam, Vietnams ambassad Stockholm, legalisera dokument Vietnam, ambassadlegalisering Vietnam, Hanoi, Ho Chi Minh, dokumentlegalisering"
        priceLow="1200"
        priceHigh="4500"
        faqItems={[
          { question: 'Hur legaliserar jag dokument för Vietnam?', answer: 'Legaliseringsprocessen inkluderar notarisering, UD-verifiering och slutlig legalisering. DOX Visumpartner hanterar hela processen åt dig.' },
          { question: 'Hur lång tid tar legalisering för Vietnam?', answer: 'Normalt 5-15 arbetsdagar beroende på dokumenttyp och handläggningstider.' },
          { question: 'Vad kostar legalisering för Vietnam?', answer: 'Kontakta oss för en kostnadsfri offert. Vi erbjuder fasta priser utan dolda avgifter.' },
        ]}
      />

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#DA251D] to-[#a81d17] text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <CountryFlag code="VN" size={64} />
              <div>
                <h1 className="text-3xl md:text-5xl font-bold">
                  Legalisering för Vietnam
                </h1>
                <p className="text-xl text-white/80">Vietnams ambassad i Stockholm</p>
              </div>
            </div>
            <p className="text-xl text-white/90 mb-8 max-w-2xl">
              Ska du arbeta, studera eller göra affärer i Vietnam? Vi hjälper dig med komplett 
              legalisering av dina dokument – från notarisering till ambassadstämpel.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/bestall" className="bg-white hover:bg-gray-100 text-[#DA251D] font-semibold px-8 py-4 rounded-lg transition-colors">
                Beställ legalisering
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-[#DA251D] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                Kontakta oss
              </Link>
            </div>
          </div>
        </section>

        {/* Why Vietnam Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Varför behövs legalisering för Vietnam?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-700 mb-4">
                  Vietnam kräver att utländska dokument legaliseras innan de kan användas i landet. 
                  Detta gäller för arbete, studier, företagsetablering och familjeärenden.
                </p>
                <p className="text-gray-700 mb-4">
                  Legaliseringsprocessen för Vietnam inkluderar flera steg: notarisering, 
                  Utrikesdepartementet och slutligen Vietnams ambassad i Stockholm.
                </p>
                <p className="text-gray-700">
                  Vi hanterar hela processen åt dig så att du kan fokusera på dina planer i Vietnam.
                </p>
              </div>
              <div className="bg-[#DA251D]/5 p-6 rounded-lg border border-[#DA251D]/20">
                <h3 className="font-semibold text-lg mb-4">Vanliga dokument för Vietnam:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-[#DA251D] mr-2">✓</span>
                    Examensbevis och utbildningsintyg
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#DA251D] mr-2">✓</span>
                    Arbetsgivarintyg och anställningsavtal
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#DA251D] mr-2">✓</span>
                    Personbevis och födelsebevis
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#DA251D] mr-2">✓</span>
                    Vigselbevis och familjedokument
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#DA251D] mr-2">✓</span>
                    Bolagshandlingar och fullmakter
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#DA251D] mr-2">✓</span>
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
              Legaliseringsprocessen för Vietnam
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: '1', title: 'Notarius Publicus', desc: 'Privata dokument notariseras först.' },
                { step: '2', title: 'Utrikesdepartementet', desc: 'UD verifierar dokumentets äkthet.' },
                { step: '3', title: 'Vietnams ambassad', desc: 'Slutlig legalisering för Vietnam.' },
                { step: '4', title: 'Leverans', desc: 'Dokumenten skickas till dig.' },
              ].map((item) => (
                <div key={item.step} className="bg-white p-6 rounded-lg shadow-sm text-center">
                  <div className="w-12 h-12 bg-[#DA251D] text-white font-bold text-xl rounded-full flex items-center justify-center mx-auto mb-4">
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
              Vietnams ambassad i Stockholm
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
              <div className="bg-[#DA251D]/5 p-6 rounded-lg border border-[#DA251D]/20">
                <h3 className="font-semibold text-lg mb-4">Låt oss sköta kontakten</h3>
                <p className="text-gray-700 mb-4">
                  Du behöver inte besöka ambassaden själv. Vi hanterar all kontakt med 
                  Vietnams ambassad och ser till att dina dokument blir korrekt legaliserade.
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
                <Link href="/bestall" className="block w-full bg-[#DA251D] hover:bg-[#b82018] text-white font-semibold py-3 rounded-lg transition-colors text-center">
                  Beställ nu
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[#DA251D] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Redo att legalisera dina dokument för Vietnam?
            </h2>
            <p className="text-white/80 mb-8">
              Vi har hjälpt hundratals kunder med legalisering för Vietnam. Beställ online eller kontakta oss för rådgivning.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/bestall" className="bg-white hover:bg-gray-100 text-[#DA251D] font-semibold px-8 py-4 rounded-lg transition-colors">
                Beställ legalisering
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-[#DA251D] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
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
