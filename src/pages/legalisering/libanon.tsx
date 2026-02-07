import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import LegaliseringCountrySEO from '@/components/SEO/LegaliseringCountrySEO';
import Link from 'next/link';
import CountryFlag from '@/components/ui/CountryFlag';



export default function LibanonLegaliseringPage() {
  const country = {
    name: 'Libanon',
    countryCode: 'LB',
    color: '#EE161F',
    colorDark: '#b8111a',
  };

  const embassy = {
    name: 'Libanons ambassad i Stockholm',
    address: 'Kommendörsgatan 35',
    postalCode: '114 58 Stockholm',
    phone: '+46 8 665 19 65',
    email: 'info@libanonembassy.se',
    openingHours: 'Måndag-Fredag, endast tidsbokning'
  };

  const documents = [
    'Personbevis och födelsebevis',
    'Vigselbevis och familjedokument',
    'Examensbevis och utbildningsintyg',
    'Fullmakter och juridiska dokument',
    'Bolagshandlingar',
    'Medicinska intyg'
  ];

  return (
    <>
<LegaliseringCountrySEO
        countryName="Libanon"
        countryNameEn="Lebanon"
        countryCode="LB"
        slug="libanon"
        title="Legalisering för Libanon | DOX Visumpartner"
        titleEn="Document Legalization for Lebanon | DOX Visumpartner"
        description="Vi hjälper dig med legalisering av dokument för Libanon. Komplett service inkl. notarisering, UD och ambassadlegalisering. Fast pris, snabb hantering."
        descriptionEn="We help you with document legalization for Lebanon. Complete service including notarization, MFA and embassy legalization."
        keywords="Libanon legalisering, legalisering Libanon, Libanons ambassad Stockholm, legalisera dokument Libanon, ambassadlegalisering Libanon, Beirut, dokumentlegalisering"
        priceLow="1200"
        priceHigh="4500"
        faqItems={[
          { question: 'Hur legaliserar jag dokument för Libanon?', answer: 'Legaliseringsprocessen inkluderar notarisering, UD-verifiering och slutlig legalisering. DOX Visumpartner hanterar hela processen åt dig.' },
          { question: 'Hur lång tid tar legalisering för Libanon?', answer: 'Normalt 5-15 arbetsdagar beroende på dokumenttyp och handläggningstider.' },
          { question: 'Vad kostar legalisering för Libanon?', answer: 'Kontakta oss för en kostnadsfri offert. Vi erbjuder fasta priser utan dolda avgifter.' },
        ]}
      />

      

      <main className="min-h-screen bg-gray-50">
        <section className="bg-gradient-to-br text-white py-16 md:py-24" style={{ background: `linear-gradient(to bottom right, ${country.color}, ${country.colorDark})` }}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <CountryFlag code={country.countryCode} size={64} />
              <div>
                <h1 className="text-3xl md:text-5xl font-bold">Legalisering för {country.name}</h1>
                <p className="text-xl text-white/80">{embassy.name}</p>
              </div>
            </div>
            <p className="text-xl text-white/90 mb-8 max-w-2xl">
              Ska du använda dokument i {country.name}? Vi hjälper dig med komplett legalisering – från notarisering till ambassadstämpel.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/bestall" className="bg-white hover:bg-gray-100 font-semibold px-8 py-4 rounded-lg transition-colors" style={{ color: country.color }}>
                Beställ legalisering
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white text-white hover:text-gray-900 font-semibold px-8 py-4 rounded-lg transition-colors">
                Kontakta oss
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Vanliga dokument för {country.name}</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-700 mb-4">
                  {country.name} kräver att utländska dokument legaliseras innan de kan användas i landet. 
                  Vi hanterar hela processen åt dig – från notarisering till färdig ambassadstämpel.
                </p>
                <p className="text-gray-700">
                  Legaliseringsprocessen inkluderar notarisering hos Notarius Publicus, 
                  verifiering hos Utrikesdepartementet och slutlig legalisering hos {country.name}s ambassad.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">Dokument vi hanterar:</h3>
                <ul className="space-y-2 text-gray-700">
                  {documents.map((doc, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2" style={{ color: country.color }}>✓</span>
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">{embassy.name}</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-lg mb-4">Kontaktuppgifter</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start"><span className="text-gray-400 mr-3">📍</span><div><strong>Adress:</strong><br />{embassy.address}<br />{embassy.postalCode}</div></li>
                  <li className="flex items-start"><span className="text-gray-400 mr-3">📞</span><div><strong>Telefon:</strong><br />{embassy.phone}</div></li>
                  <li className="flex items-start"><span className="text-gray-400 mr-3">🕐</span><div><strong>Öppettider:</strong><br />{embassy.openingHours}</div></li>
                </ul>
              </div>
              <div className="p-6 rounded-lg border" style={{ backgroundColor: `${country.color}10`, borderColor: `${country.color}30` }}>
                <h3 className="font-semibold text-lg mb-4">Vi sköter allt åt dig</h3>
                <p className="text-gray-700 mb-4">Du behöver inte besöka ambassaden själv. Vi hanterar all kontakt och ser till att dina dokument blir korrekt legaliserade.</p>
                <ul className="space-y-2 text-gray-700 mb-6">
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Vi lämnar in dina dokument</li>
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Vi hämtar ut dem när de är klara</li>
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Vi skickar dem till dig</li>
                </ul>
                <Link href="/bestall" className="block w-full text-white font-semibold py-3 rounded-lg transition-colors text-center" style={{ backgroundColor: country.color }}>
                  Beställ nu
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 text-white" style={{ backgroundColor: country.color }}>
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Behöver du legalisera dokument för {country.name}?</h2>
            <p className="text-white/80 mb-8">Vi hjälper dig med hela processen. Beställ online eller kontakta oss för rådgivning.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/bestall" className="bg-white font-semibold px-8 py-4 rounded-lg transition-colors" style={{ color: country.color }}>Beställ legalisering</Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white text-white hover:text-gray-900 font-semibold px-8 py-4 rounded-lg transition-colors">Kontakta oss</Link>
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
