import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';



export default function ThailandLegaliseringPage() {
  const country = { name: 'Thailand', flag: '🇹🇭', color: '#241D4F', colorDark: '#1a1539' };
  const embassy = {
    name: 'Thailands ambassad i Stockholm',
    address: 'Floragatan 3',
    postalCode: '114 31 Stockholm',
    phone: '+46 8 791 95 00',
    email: 'info@thaiembassy.se',
    website: 'https://thaiembassy.se',
    openingHours: 'Måndag-Fredag 09:00-12:00, 13:30-17:00'
  };

  const documents = ['Personbevis och födelsebevis', 'Vigselbevis och äktenskapsintyg', 'Examensbevis', 'Fullmakter', 'Bolagshandlingar', 'Medicinska intyg'];

  return (
    <>
      <Head>
        <title>Legalisering för {country.name} - Thailands ambassad Stockholm | DOX Visumpartner</title>
        <meta name="description" content={`Vi hjälper dig med legalisering av dokument för ${country.name}. Komplett service via Thailands ambassad i Stockholm. Snabb hantering.`} />
        <meta name="keywords" content="Thailand, legalisering, ambassad, Stockholm, dokument, Bangkok, visum, äktenskap" />
        <link rel="canonical" href="https://www.doxvl.se/legalisering/thailand" />
      </Head>
      
      <main className="min-h-screen bg-gray-50">
        <section className="text-white py-16 md:py-24" style={{ background: `linear-gradient(to bottom right, ${country.color}, ${country.colorDark})` }}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-6xl">{country.flag}</span>
              <div><h1 className="text-3xl md:text-5xl font-bold">Legalisering för {country.name}</h1><p className="text-xl text-white/80">{embassy.name}</p></div>
            </div>
            <p className="text-xl text-white/90 mb-8 max-w-2xl">
              Ska du gifta dig, arbeta eller göra affärer i Thailand? Vi hjälper dig med komplett legalisering av dokument.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/bestall" className="bg-[#F4D03F] hover:bg-[#e5c236] text-black font-semibold px-8 py-4 rounded-lg">Beställ legalisering</Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white text-white hover:text-gray-900 font-semibold px-8 py-4 rounded-lg">Kontakta oss</Link>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Legalisering för Thailand</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-700 mb-4">
                  Thailand har inte anslutit sig till Haagkonventionen, vilket innebär att dokument måste 
                  legaliseras genom hela kedjan: Notarius Publicus, Utrikesdepartementet och Thailands ambassad.
                </p>
                <p className="text-gray-700 mb-4">
                  Vanliga anledningar till legalisering för Thailand inkluderar äktenskap, arbete, 
                  företagsetablering och fastighetsköp.
                </p>
                <p className="text-gray-700">
                  Efter legalisering hos ambassaden i Stockholm behöver dokumenten ofta även översättas 
                  till thailändska av en auktoriserad översättare i Thailand.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold mb-4">Vanliga dokument:</h3>
                <ul className="space-y-2">{documents.map((d, i) => <li key={i} className="flex items-start"><span className="mr-2" style={{ color: country.color }}>✓</span>{d}</li>)}</ul>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-4">Thailands ambassad i Stockholm</h3>
              <ul className="space-y-3 text-gray-700">
                <li><strong>Adress:</strong> {embassy.address}, {embassy.postalCode}</li>
                <li><strong>Telefon:</strong> {embassy.phone}</li>
                <li><strong>Webbplats:</strong> <a href={embassy.website} className="text-blue-600 hover:underline">{embassy.website}</a></li>
                <li><strong>Öppettider:</strong> {embassy.openingHours}</li>
              </ul>
            </div>
            <div className="p-6 rounded-lg" style={{ backgroundColor: `${country.color}10` }}>
              <h3 className="font-semibold mb-4">Vi sköter allt åt dig</h3>
              <p className="text-gray-700 mb-4">Du behöver inte besöka ambassaden själv. Vi hanterar hela processen.</p>
              <Link href="/bestall" className="block w-full text-white font-semibold py-3 rounded-lg text-center" style={{ backgroundColor: country.color }}>Beställ nu</Link>
            </div>
          </div>
        </section>

        <section className="py-16 text-white" style={{ backgroundColor: country.color }}>
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Redo att legalisera dokument för Thailand?</h2>
            <p className="text-white/80 mb-8">Vi har hjälpt hundratals kunder med legalisering för Thailand.</p>
            <Link href="/bestall" className="bg-[#F4D03F] text-black font-semibold px-8 py-4 rounded-lg inline-block">Beställ nu</Link>
          </div>
        </section>
      </main>
      
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await serverSideTranslations(locale ?? 'sv', ['common'])) },
});
