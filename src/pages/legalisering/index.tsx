import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const countries = [
  // Populära destinationer
  { code: 'qatar', name: 'Qatar', flag: '🇶🇦', popular: true },
  { code: 'kuwait', name: 'Kuwait', flag: '🇰🇼', popular: true },
  { code: 'spanien', name: 'Spanien (NIE)', flag: '🇪🇸', popular: true },
  { code: 'thailand', name: 'Thailand', flag: '🇹🇭', popular: true },
  // Mellanöstern
  { code: 'egypten', name: 'Egypten', flag: '🇪🇬', popular: false },
  { code: 'irak', name: 'Irak', flag: '🇮🇶', popular: false },
  { code: 'libanon', name: 'Libanon', flag: '🇱🇧', popular: false },
  { code: 'libyen', name: 'Libyen', flag: '🇱🇾', popular: false },
  { code: 'palestina', name: 'Palestina', flag: '🇵🇸', popular: false },
  { code: 'syrien', name: 'Syrien', flag: '🇸🇾', popular: false },
  // Afrika
  { code: 'angola', name: 'Angola', flag: '🇦🇴', popular: false },
  { code: 'etiopien', name: 'Etiopien', flag: '🇪🇹', popular: false },
  { code: 'mocambique', name: 'Moçambique', flag: '🇲🇿', popular: false },
  { code: 'nigeria', name: 'Nigeria', flag: '🇳🇬', popular: false },
  // Asien
  { code: 'sri-lanka', name: 'Sri Lanka', flag: '🇱🇰', popular: false },
  { code: 'taiwan', name: 'Taiwan', flag: '🇹🇼', popular: false },
];

export default function LegaliseringIndexPage() {
  const { t } = useTranslation('common');

  const popularCountries = countries.filter(c => c.popular);
  const otherCountries = countries.filter(c => !c.popular);

  return (
    <>
      <Head>
        <title>Legalisering av dokument för alla länder | DOX Visumpartner</title>
        <meta name="description" content="Vi hjälper dig med legalisering av dokument för alla länder. Komplett service inkl. notarisering, Utrikesdepartementet och ambassad. Snabb hantering, fasta priser." />
        <meta name="keywords" content="legalisering, dokument, ambassad, notarisering, utrikesdepartementet, apostille" />
        <link rel="canonical" href="https://www.doxvl.se/legalisering" />
        
        <meta property="og:title" content="Legalisering av dokument för alla länder | DOX Visumpartner" />
        <meta property="og:description" content="Komplett legaliseringsservice för alla länder. Vi hanterar hela processen åt dig." />
        <meta property="og:url" content="https://www.doxvl.se/legalisering" />
        <meta property="og:type" content="website" />
      </Head>

      <Header />

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#2E2D2C] to-[#1a1918] text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <h1 className="text-3xl md:text-5xl font-bold mb-6">
              Legalisering av dokument
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl">
              Vi hjälper dig att legalisera dokument för användning utomlands. 
              Komplett service från notarisering till ambassadstämpel.
            </p>
            <Link href="/bestall" className="bg-[#D4AF37] hover:bg-[#C4A030] text-black font-semibold px-8 py-4 rounded-lg transition-colors inline-block">
              Beställ legalisering
            </Link>
          </div>
        </section>

        {/* Popular Countries */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Populära destinationer
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularCountries.map((country) => (
                <Link 
                  key={country.code} 
                  href={`/legalisering/${country.code}`}
                  className="bg-gray-50 hover:bg-gray-100 p-6 rounded-lg transition-colors group"
                >
                  <span className="text-4xl mb-3 block">{country.flag}</span>
                  <h3 className="font-semibold text-lg group-hover:text-[#D4AF37] transition-colors">
                    {country.name}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">Legalisering →</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* All Countries */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Fler länder
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {otherCountries.map((country) => (
                <Link 
                  key={country.code} 
                  href={`/legalisering/${country.code}`}
                  className="bg-white hover:bg-gray-50 p-4 rounded-lg transition-colors text-center group"
                >
                  <span className="text-3xl mb-2 block">{country.flag}</span>
                  <span className="font-medium text-sm group-hover:text-[#D4AF37] transition-colors">
                    {country.name}
                  </span>
                </Link>
              ))}
            </div>
            <p className="text-center text-gray-600 mt-8">
              Hittar du inte ditt land? <Link href="/kontakt" className="text-[#D4AF37] hover:underline">Kontakta oss</Link> så hjälper vi dig.
            </p>
          </div>
        </section>

        {/* Process Overview */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Så fungerar legalisering
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#D4AF37] text-black font-bold text-2xl rounded-full flex items-center justify-center mx-auto mb-4">
                  1
                </div>
                <h3 className="font-semibold text-lg mb-2">Notarisering</h3>
                <p className="text-gray-600">
                  Privata dokument notariseras av Notarius Publicus för att bekräfta äktheten.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#D4AF37] text-black font-bold text-2xl rounded-full flex items-center justify-center mx-auto mb-4">
                  2
                </div>
                <h3 className="font-semibold text-lg mb-2">Utrikesdepartementet</h3>
                <p className="text-gray-600">
                  UD verifierar dokumentet och utfärdar apostille eller legalisering.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#D4AF37] text-black font-bold text-2xl rounded-full flex items-center justify-center mx-auto mb-4">
                  3
                </div>
                <h3 className="font-semibold text-lg mb-2">Ambassaden</h3>
                <p className="text-gray-600">
                  Slutlig legalisering hos destinationslandets ambassad i Stockholm.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[#2E2D2C] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Behöver du hjälp med legalisering?
            </h2>
            <p className="text-gray-300 mb-8">
              Vi har hjälpt tusentals kunder med legalisering för länder över hela världen.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/bestall" className="bg-[#D4AF37] hover:bg-[#C4A030] text-black font-semibold px-8 py-4 rounded-lg transition-colors">
                Beställ nu
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-black text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                Kontakta oss
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
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
