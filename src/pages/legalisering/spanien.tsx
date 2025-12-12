import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function SpanienLegaliseringPage() {
  const country = { name: 'Spanien', flag: '🇪🇸', color: '#AA151B', colorDark: '#8a1016' };
  const embassy = {
    name: 'Spaniens ambassad i Stockholm',
    address: 'Djurgårdsvägen 21',
    postalCode: '115 21 Stockholm',
    phone: '+46 8 522 800 00',
    email: 'emb.estocolmo@maec.es',
    website: 'https://www.exteriores.gob.es/Embajadas/estocolmo',
    openingHours: 'Måndag-Torsdag 09:00-17:00, Fredag 08:30-15:00'
  };

  return (
    <>
      <Head>
        <title>Spanien - NIE-nummer & Apostille | DOX Visumpartner</title>
        <meta name="description" content="Vi hjälper dig med NIE-nummer för Spanien och apostille av dokument. Komplett service via Spaniens ambassad i Stockholm. Köpa bostad, starta företag." />
        <meta name="keywords" content="Spanien, NIE-nummer, apostille, ambassad, Stockholm, köpa bostad, företag, legalisering" />
        <link rel="canonical" href="https://www.doxvl.se/legalisering/spanien" />
      </Head>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <section className="text-white py-16 md:py-24" style={{ background: `linear-gradient(to bottom right, ${country.color}, ${country.colorDark})` }}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-6xl">{country.flag}</span>
              <div>
                <h1 className="text-3xl md:text-5xl font-bold">Spanien</h1>
                <p className="text-xl text-white/80">NIE-nummer & Apostille</p>
              </div>
            </div>
            <p className="text-xl text-white/90 mb-8 max-w-2xl">
              Planerar du att köpa bostad, starta företag eller arbeta i Spanien? 
              Vi hjälper dig med NIE-nummer och apostille av dokument.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/bestall" className="bg-[#F1BF00] hover:bg-[#d9ab00] text-black font-semibold px-8 py-4 rounded-lg">Beställ nu</Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white text-white hover:text-gray-900 font-semibold px-8 py-4 rounded-lg">Kontakta oss</Link>
            </div>
          </div>
        </section>

        {/* NIE Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Vad är NIE-nummer?</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-700 mb-4">
                  <strong>NIE (Número de Identificación de Extranjero)</strong> är ett spanskt identifikationsnummer 
                  för utlänningar. Det krävs för de flesta ekonomiska och juridiska transaktioner i Spanien.
                </p>
                <p className="text-gray-700 mb-4">
                  Du behöver NIE-nummer för att:
                </p>
                <ul className="space-y-2 text-gray-700 mb-4">
                  <li className="flex items-start"><span className="text-[#AA151B] mr-2">•</span>Köpa eller sälja fastighet</li>
                  <li className="flex items-start"><span className="text-[#AA151B] mr-2">•</span>Öppna bankkonto</li>
                  <li className="flex items-start"><span className="text-[#AA151B] mr-2">•</span>Starta eller driva företag</li>
                  <li className="flex items-start"><span className="text-[#AA151B] mr-2">•</span>Arbeta i Spanien</li>
                  <li className="flex items-start"><span className="text-[#AA151B] mr-2">•</span>Köpa bil eller båt</li>
                  <li className="flex items-start"><span className="text-[#AA151B] mr-2">•</span>Teckna försäkringar</li>
                </ul>
                <p className="text-gray-700">
                  Du kan ansöka om NIE-nummer via Spaniens ambassad i Stockholm eller direkt i Spanien. 
                  <strong> Vi hjälper dig med hela processen!</strong>
                </p>
              </div>
              <div className="bg-[#F1BF00]/10 p-6 rounded-lg border border-[#F1BF00]/30">
                <h3 className="font-semibold text-lg mb-4">Vår NIE-service inkluderar:</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start"><span className="text-green-500 mr-2">✓</span>Hjälp med ansökningsformulär</li>
                  <li className="flex items-start"><span className="text-green-500 mr-2">✓</span>Granskning av dokument</li>
                  <li className="flex items-start"><span className="text-green-500 mr-2">✓</span>Bokning av tid på ambassaden</li>
                  <li className="flex items-start"><span className="text-green-500 mr-2">✓</span>Vägledning genom processen</li>
                  <li className="flex items-start"><span className="text-green-500 mr-2">✓</span>Uppföljning av ärende</li>
                </ul>
                <Link href="/kontakt" className="block w-full bg-[#AA151B] text-white font-semibold py-3 rounded-lg text-center mt-6">
                  Kontakta oss för NIE-hjälp
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Apostille Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Apostille för Spanien</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-700 mb-4">
                  Spanien är anslutet till Haagkonventionen, vilket innebär att svenska dokument kan 
                  förses med <strong>Apostille</strong> istället för traditionell legalisering.
                </p>
                <p className="text-gray-700 mb-4">
                  Apostille utfärdas av Utrikesdepartementet och bekräftar att dokumentet är äkta. 
                  Med Apostille behöver du inte besöka Spaniens ambassad.
                </p>
                <h3 className="font-semibold text-lg mb-3">Vanliga dokument för Spanien:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start"><span className="text-[#AA151B] mr-2">✓</span>Personbevis och födelsebevis</li>
                  <li className="flex items-start"><span className="text-[#AA151B] mr-2">✓</span>Vigselbevis</li>
                  <li className="flex items-start"><span className="text-[#AA151B] mr-2">✓</span>Straffregisterutdrag</li>
                  <li className="flex items-start"><span className="text-[#AA151B] mr-2">✓</span>Fullmakter</li>
                  <li className="flex items-start"><span className="text-[#AA151B] mr-2">✓</span>Bolagshandlingar</li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-lg mb-4">Spaniens ambassad i Stockholm</h3>
                <ul className="space-y-3 text-gray-700">
                  <li><strong>Adress:</strong> {embassy.address}, {embassy.postalCode}</li>
                  <li><strong>Telefon:</strong> {embassy.phone}</li>
                  <li><strong>Webbplats:</strong> <a href={embassy.website} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">exteriores.gob.es</a></li>
                  <li><strong>Öppettider:</strong> {embassy.openingHours}</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 text-white" style={{ backgroundColor: country.color }}>
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Behöver du hjälp med NIE eller Apostille?</h2>
            <p className="text-white/80 mb-8">Vi har hjälpt hundratals svenskar med dokument för Spanien.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/bestall" className="bg-[#F1BF00] text-black font-semibold px-8 py-4 rounded-lg">Beställ Apostille</Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white text-white hover:text-gray-900 font-semibold px-8 py-4 rounded-lg">Fråga om NIE</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await serverSideTranslations(locale ?? 'sv', ['common'])) },
});
