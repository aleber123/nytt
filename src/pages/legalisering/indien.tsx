import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import CountryFlag from '@/components/ui/CountryFlag';
import LegaliseringCountrySEO from '@/components/SEO/LegaliseringCountrySEO';

export default function IndienLegaliseringPage() {
  const { t } = useTranslation('common');

  return (
    <>
      <LegaliseringCountrySEO
        countryName="Indien"
        countryNameEn="India"
        countryCode="IN"
        slug="indien"
        title="Apostille för Indien - Dokument för användning i Indien | DOX Visumpartner"
        titleEn="Apostille for India - Documents for use in India | DOX Visumpartner"
        description="Vi hjälper dig med apostille för dokument till Indien. Sedan 2023 är Indien medlem i Haagkonventionen. Snabb och enkel apostille-service. Ingen ambassadlegalisering behövs."
        descriptionEn="We help you with apostille for documents to India. Since 2023, India is a member of the Hague Convention. Fast and easy apostille service."
        keywords="Indien apostille, apostille Indien, Haagkonventionen Indien, legalisera dokument Indien, Delhi, Mumbai, Bangalore, Indien dokument, apostille service Sverige, Indien Haagkonventionen 2023"
        keywordsEn="India apostille, apostille India, Hague Convention India, document legalization India, Delhi, Mumbai, Bangalore, apostille service Sweden"
        ogDescription="Apostille-service för Indien. Indien är medlem i Haagkonventionen sedan 2023 – ingen ambassadlegalisering behövs."
        schemaDescription="Apostille av dokument för användning i Indien. Indien är medlem i Haagkonventionen sedan juli 2023."
        serviceType="Apostille Service"
        priceLow="1200"
        priceHigh="2500"
        faqItems={[
          { question: 'Behöver jag ambassadlegalisering för Indien?', answer: 'Nej, sedan juli 2023 är Indien medlem i Haagkonventionen. Det innebär att apostille räcker – ingen ambassadlegalisering behövs längre för dokument till Indien.' },
          { question: 'Vad kostar apostille för Indien?', answer: 'Apostille för Indien kostar från 1 200 kr per dokument. Kontakta oss för exakt pris baserat på ditt ärende.' },
          { question: 'Hur lång tid tar apostille för Indien?', answer: 'Apostille handläggs normalt inom 3-5 arbetsdagar. Vi erbjuder även expressservice för brådskande ärenden.' },
          { question: 'Vilka dokument kan apostilleras för Indien?', answer: 'De vanligaste dokumenten är examensbevis, födelsebevis, vigselbevis, personbevis, fullmakter och bolagshandlingar.' },
        ]}
      />

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#FF9933] to-[#138808] text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <CountryFlag code="IN" size={64} />
              <div>
                <h1 className="text-3xl md:text-5xl font-bold">
                  Apostille för Indien
                </h1>
                <p className="text-xl text-white/80">Haagkonventionen sedan 2023</p>
              </div>
            </div>
            <p className="text-xl text-white/90 mb-8 max-w-2xl">
              Ska du arbeta, studera eller göra affärer i Indien? Sedan juli 2023 är Indien medlem 
              i Haagkonventionen, vilket innebär att apostille räcker – ingen ambassadlegalisering behövs.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/bestall" className="bg-white hover:bg-gray-100 text-[#138808] font-semibold px-8 py-4 rounded-lg transition-colors">
                Beställ apostille
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-[#138808] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                Kontakta oss
              </Link>
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-lg text-green-800 mb-2">🎉 Goda nyheter!</h3>
              <p className="text-green-700">
                Indien blev medlem i Haagkonventionen den 15 juli 2023. Detta innebär att svenska dokument 
                med apostille nu accepteras direkt i Indien – utan behov av ambassadlegalisering.
              </p>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Vad innebär apostille för Indien?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-700 mb-4">
                  Apostille är en internationell stämpel som verifierar äktheten av offentliga dokument. 
                  Tack vare Haagkonventionen accepteras apostille i alla medlemsländer, inklusive Indien.
                </p>
                <p className="text-gray-700 mb-4">
                  Detta förenklar processen avsevärt jämfört med traditionell ambassadlegalisering. 
                  Du slipper flera steg och får dina dokument klara snabbare.
                </p>
                <p className="text-gray-700">
                  Vi hanterar hela apostille-processen åt dig så att du kan fokusera på dina planer i Indien.
                </p>
              </div>
              <div className="bg-[#FF9933]/10 p-6 rounded-lg border border-[#FF9933]/30">
                <h3 className="font-semibold text-lg mb-4">Vanliga dokument för Indien:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-[#FF9933] mr-2">✓</span>
                    Examensbevis och utbildningsintyg
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#FF9933] mr-2">✓</span>
                    Arbetsgivarintyg och anställningsavtal
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#FF9933] mr-2">✓</span>
                    Personbevis och födelsebevis
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#FF9933] mr-2">✓</span>
                    Vigselbevis och familjedokument
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#FF9933] mr-2">✓</span>
                    Bolagshandlingar och fullmakter
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#FF9933] mr-2">✓</span>
                    Straffregisterutdrag
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
              Apostille-processen för Indien
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { step: '1', title: 'Notarius Publicus', desc: 'Privata dokument notariseras först av Notarius Publicus.' },
                { step: '2', title: 'Apostille från UD', desc: 'Utrikesdepartementet utfärdar apostille-stämpeln.' },
                { step: '3', title: 'Leverans', desc: 'Dokumenten skickas till dig – klara att användas i Indien.' },
              ].map((item) => (
                <div key={item.step} className="bg-white p-6 rounded-lg shadow-sm text-center">
                  <div className="w-12 h-12 bg-[#FF9933] text-white font-bold text-xl rounded-full flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Fördelar med apostille
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">Jämfört med ambassadlegalisering</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3">✓</span>
                    <div>
                      <strong>Snabbare process</strong><br />
                      Färre steg innebär kortare handläggningstid
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3">✓</span>
                    <div>
                      <strong>Lägre kostnad</strong><br />
                      Ingen ambassadavgift behövs
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3">✓</span>
                    <div>
                      <strong>Enklare hantering</strong><br />
                      Apostille accepteras direkt i Indien
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-[#FF9933]/10 p-6 rounded-lg border border-[#FF9933]/30">
                <h3 className="font-semibold text-lg mb-4">Vi hjälper dig</h3>
                <p className="text-gray-700 mb-4">
                  Även om processen är enklare med apostille kan det vara praktiskt att låta oss 
                  hantera allt åt dig. Vi ser till att dina dokument blir korrekt apostillerade.
                </p>
                <ul className="space-y-2 text-gray-700 mb-6">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Vi hanterar notarisering
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Vi ordnar apostille från UD
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Vi skickar dokumenten till dig
                  </li>
                </ul>
                <Link href="/bestall" className="block w-full bg-[#FF9933] hover:bg-[#e68a2e] text-white font-semibold py-3 rounded-lg transition-colors text-center">
                  Beställ nu
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-[#FF9933] to-[#138808] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Redo att apostillera dina dokument för Indien?
            </h2>
            <p className="text-white/80 mb-8">
              Vi har hjälpt hundratals kunder med dokument för Indien. Beställ online eller kontakta oss för rådgivning.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/bestall" className="bg-white hover:bg-gray-100 text-[#138808] font-semibold px-8 py-4 rounded-lg transition-colors">
                Beställ apostille
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-[#138808] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
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
