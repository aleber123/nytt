import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function IrakLegaliseringPage() {
  const country = { name: 'Irak', flag: '🇮🇶', color: '#007A3D', colorDark: '#005a2d' };
  const embassy = {
    name: 'Iraks ambassad i Stockholm',
    address: 'Släggbacken 9 (konsulär)',
    postalCode: '531 71 Solna',
    phone: '+46 8 411 44 43',
    email: 'amb.stockholm@mofa.gov.iq',
    openingHours: 'Måndag-Fredag 09:00-13:00 (konsulär)'
  };

  const documents = ['Personbevis och födelsebevis', 'Vigselbevis', 'Examensbevis', 'Fullmakter', 'Bolagshandlingar', 'Juridiska dokument'];

  return (
    <>
      <Head>
        <title>Legalisering för {country.name} - Ambassad Stockholm | DOX Visumpartner</title>
        <meta name="description" content={`Vi hjälper dig med legalisering av dokument för ${country.name}. Komplett service via Iraks ambassad i Stockholm/Solna.`} />
        <link rel="canonical" href="https://www.doxvl.se/legalisering/irak" />
      </Head>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <section className="text-white py-16 md:py-24" style={{ background: `linear-gradient(to bottom right, ${country.color}, ${country.colorDark})` }}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-6xl">{country.flag}</span>
              <div><h1 className="text-3xl md:text-5xl font-bold">Legalisering för {country.name}</h1><p className="text-xl text-white/80">{embassy.name}</p></div>
            </div>
            <p className="text-xl text-white/90 mb-8 max-w-2xl">Vi hjälper dig med komplett legalisering av dokument för {country.name}.</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/bestall" className="bg-white hover:bg-gray-100 font-semibold px-8 py-4 rounded-lg" style={{ color: country.color }}>Beställ legalisering</Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white text-white hover:text-gray-900 font-semibold px-8 py-4 rounded-lg">Kontakta oss</Link>
            </div>
          </div>
        </section>
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-8">
            <div><h2 className="text-2xl font-bold mb-4">Dokument för {country.name}</h2><p className="text-gray-700">Vi hanterar hela legaliseringsprocessen för dokument som ska användas i {country.name}.</p></div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-4">Vanliga dokument:</h3>
              <ul className="space-y-2">{documents.map((d, i) => <li key={i} className="flex items-start"><span className="mr-2" style={{ color: country.color }}>✓</span>{d}</li>)}</ul>
            </div>
          </div>
        </section>
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-4">Kontaktuppgifter</h3>
              <p className="text-gray-700"><strong>Konsulär adress:</strong> {embassy.address}, {embassy.postalCode}</p>
              <p className="text-gray-700"><strong>Telefon:</strong> {embassy.phone}</p>
              <p className="text-gray-700"><strong>Öppettider:</strong> {embassy.openingHours}</p>
            </div>
            <div className="p-6 rounded-lg" style={{ backgroundColor: `${country.color}10` }}>
              <h3 className="font-semibold mb-4">Vi sköter allt åt dig</h3>
              <Link href="/bestall" className="block w-full text-white font-semibold py-3 rounded-lg text-center" style={{ backgroundColor: country.color }}>Beställ nu</Link>
            </div>
          </div>
        </section>
        <section className="py-16 text-white" style={{ backgroundColor: country.color }}>
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Redo att legalisera?</h2>
            <Link href="/bestall" className="bg-white font-semibold px-8 py-4 rounded-lg inline-block" style={{ color: country.color }}>Beställ nu</Link>
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
