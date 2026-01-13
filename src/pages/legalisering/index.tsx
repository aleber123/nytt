import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import CountryFlag from '@/components/ui/CountryFlag';
import { CheckCircleIcon, DocumentTextIcon, BuildingLibraryIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

const countries = [
  // Populära destinationer
  { code: 'qatar', countryCode: 'QA', name: 'Qatar', nameEn: 'Qatar', popular: true },
  { code: 'kuwait', countryCode: 'KW', name: 'Kuwait', nameEn: 'Kuwait', popular: true },
  { code: 'spanien', countryCode: 'ES', name: 'Spanien (NIE)', nameEn: 'Spain (NIE)', popular: true },
  { code: 'thailand', countryCode: 'TH', name: 'Thailand', nameEn: 'Thailand', popular: true },
  // Mellanöstern
  { code: 'egypten', countryCode: 'EG', name: 'Egypten', nameEn: 'Egypt', popular: false },
  { code: 'irak', countryCode: 'IQ', name: 'Irak', nameEn: 'Iraq', popular: false },
  { code: 'libanon', countryCode: 'LB', name: 'Libanon', nameEn: 'Lebanon', popular: false },
  { code: 'libyen', countryCode: 'LY', name: 'Libyen', nameEn: 'Libya', popular: false },
  { code: 'palestina', countryCode: 'PS', name: 'Palestina', nameEn: 'Palestine', popular: false },
  { code: 'syrien', countryCode: 'SY', name: 'Syrien', nameEn: 'Syria', popular: false },
  // Afrika
  { code: 'angola', countryCode: 'AO', name: 'Angola', nameEn: 'Angola', popular: false },
  { code: 'etiopien', countryCode: 'ET', name: 'Etiopien', nameEn: 'Ethiopia', popular: false },
  { code: 'mocambique', countryCode: 'MZ', name: 'Moçambique', nameEn: 'Mozambique', popular: false },
  { code: 'nigeria', countryCode: 'NG', name: 'Nigeria', nameEn: 'Nigeria', popular: false },
  // Asien
  { code: 'sri-lanka', countryCode: 'LK', name: 'Sri Lanka', nameEn: 'Sri Lanka', popular: false },
  { code: 'taiwan', countryCode: 'TW', name: 'Taiwan', nameEn: 'Taiwan', popular: false },
];

export default function LegaliseringIndexPage() {
  const { t } = useTranslation('common');
  const { locale } = useRouter();
  const isEn = locale === 'en';

  const popularCountries = countries.filter(c => c.popular);
  const otherCountries = countries.filter(c => !c.popular);

  const pageTitle = isEn 
    ? 'Document Legalization for All Countries | DOX Visumpartner'
    : 'Legalisering av dokument för alla länder | DOX Visumpartner';
  
  const pageDescription = isEn
    ? 'We help you with document legalization for all countries. Complete service including notarization, Ministry for Foreign Affairs and embassy. Fast handling, fixed prices.'
    : 'Vi hjälper dig med legalisering av dokument för alla länder. Komplett service inkl. notarisering, Utrikesdepartementet och ambassad. Snabb hantering, fasta priser.';

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={isEn 
          ? 'legalization, documents, embassy, notarization, ministry foreign affairs, apostille, Sweden'
          : 'legalisering, dokument, ambassad, notarisering, utrikesdepartementet, apostille'} />
        <link rel="canonical" href="https://www.doxvl.se/legalisering" />
        
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content="https://www.doxvl.se/legalisering" />
        <meta property="og:type" content="website" />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": isEn ? "Document Legalization Service" : "Legaliseringstjänst för dokument",
          "description": pageDescription,
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner",
            "url": "https://www.doxvl.se"
          },
          "areaServed": "SE",
          "serviceType": isEn ? "Document Legalization" : "Dokumentlegalisering"
        })}} />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-900 to-primary-800 text-white py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-5xl font-bold mb-6">
                {isEn ? 'Document Legalization' : 'Legalisering av dokument'}
              </h1>
              <p className="text-xl text-primary-100 mb-8">
                {isEn 
                  ? 'We help you legalize documents for use abroad. Complete service from notarization to embassy stamp.'
                  : 'Vi hjälper dig att legalisera dokument för användning utomlands. Komplett service från notarisering till ambassadstämpel.'}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/bestall" 
                  className="bg-accent-500 hover:bg-accent-600 text-white font-semibold px-8 py-4 rounded-lg transition-colors inline-flex items-center"
                >
                  {isEn ? 'Order Legalization' : 'Beställ legalisering'}
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link 
                  href="/priser" 
                  className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-lg transition-colors"
                >
                  {isEn ? 'View Prices' : 'Se priser'}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Countries */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {isEn ? 'Popular Destinations' : 'Populära destinationer'}
            </h2>
            <p className="text-gray-600 mb-8">
              {isEn ? 'Countries we frequently handle legalization for' : 'Länder vi ofta hanterar legalisering för'}
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularCountries.map((country) => (
                <Link 
                  key={country.code} 
                  href={`/legalisering/${country.code}`}
                  className="bg-gray-50 hover:bg-gray-100 hover:shadow-md p-6 rounded-xl transition-all group border border-gray-100"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <CountryFlag code={country.countryCode} size={32} />
                    <h3 className="font-semibold text-lg text-gray-900 group-hover:text-primary-600 transition-colors">
                      {isEn ? country.nameEn : country.name}
                    </h3>
                  </div>
                  <p className="text-gray-500 text-sm flex items-center">
                    {isEn ? 'View details' : 'Visa detaljer'}
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* All Countries */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {isEn ? 'More Countries' : 'Fler länder'}
            </h2>
            <p className="text-gray-600 mb-8">
              {isEn ? 'We handle legalization for these countries as well' : 'Vi hanterar legalisering för dessa länder också'}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {otherCountries.map((country) => (
                <Link 
                  key={country.code} 
                  href={`/legalisering/${country.code}`}
                  className="bg-white hover:bg-gray-50 hover:shadow-sm p-4 rounded-lg transition-all text-center group border border-gray-100"
                >
                  <div className="flex justify-center mb-2">
                    <CountryFlag code={country.countryCode} size={24} />
                  </div>
                  <span className="font-medium text-sm text-gray-700 group-hover:text-primary-600 transition-colors">
                    {isEn ? country.nameEn : country.name}
                  </span>
                </Link>
              ))}
            </div>
            <p className="text-center text-gray-600 mt-8">
              {isEn 
                ? <>Can&apos;t find your country? <Link href="/kontakt" className="text-primary-600 hover:underline font-medium">Contact us</Link> and we&apos;ll help you.</>
                : <>Hittar du inte ditt land? <Link href="/kontakt" className="text-primary-600 hover:underline font-medium">Kontakta oss</Link> så hjälper vi dig.</>
              }
            </p>
          </div>
        </section>

        {/* Process Overview */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                {isEn ? 'How Legalization Works' : 'Så fungerar legalisering'}
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                {isEn 
                  ? 'The legalization process typically involves three steps to make your documents valid abroad'
                  : 'Legaliseringsprocessen involverar vanligtvis tre steg för att göra dina dokument giltiga utomlands'}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-50 rounded-xl p-8 text-center relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-primary-600 text-white font-bold rounded-full flex items-center justify-center text-sm">
                  1
                </div>
                <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DocumentTextIcon className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-lg mb-3 text-gray-900">
                  {isEn ? 'Notarization' : 'Notarisering'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {isEn 
                    ? 'Private documents are notarized by a Notary Public to confirm authenticity.'
                    : 'Privata dokument notariseras av Notarius Publicus för att bekräfta äktheten.'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-8 text-center relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-primary-600 text-white font-bold rounded-full flex items-center justify-center text-sm">
                  2
                </div>
                <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BuildingLibraryIcon className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-lg mb-3 text-gray-900">
                  {isEn ? 'Ministry for Foreign Affairs' : 'Utrikesdepartementet'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {isEn 
                    ? 'The Ministry verifies the document and issues an apostille or legalization.'
                    : 'UD verifierar dokumentet och utfärdar apostille eller legalisering.'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-8 text-center relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-primary-600 text-white font-bold rounded-full flex items-center justify-center text-sm">
                  3
                </div>
                <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GlobeAltIcon className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-lg mb-3 text-gray-900">
                  {isEn ? 'Embassy' : 'Ambassaden'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {isEn 
                    ? 'Final legalization at the destination country\'s embassy in Stockholm.'
                    : 'Slutlig legalisering hos destinationslandets ambassad i Stockholm.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                {isEn ? 'Why Choose Us?' : 'Varför välja oss?'}
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  title: isEn ? 'Fast Handling' : 'Snabb hantering', 
                  desc: isEn ? 'We handle your documents efficiently' : 'Vi hanterar dina dokument effektivt' 
                },
                { 
                  title: isEn ? 'Fixed Prices' : 'Fasta priser', 
                  desc: isEn ? 'No hidden fees or surprises' : 'Inga dolda avgifter eller överraskningar' 
                },
                { 
                  title: isEn ? 'Expert Support' : 'Expertstöd', 
                  desc: isEn ? 'Personal guidance throughout the process' : 'Personlig vägledning genom hela processen' 
                },
                { 
                  title: isEn ? 'All Countries' : 'Alla länder', 
                  desc: isEn ? 'We handle legalization for all countries' : 'Vi hanterar legalisering för alla länder' 
                },
              ].map((benefit, idx) => (
                <div key={idx} className="bg-white rounded-lg p-6 border border-gray-100">
                  <CheckCircleIcon className="w-8 h-8 text-green-500 mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary-900 text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {isEn ? 'Need Help with Legalization?' : 'Behöver du hjälp med legalisering?'}
            </h2>
            <p className="text-primary-200 mb-8 text-lg">
              {isEn 
                ? 'We have helped thousands of customers with legalization for countries around the world.'
                : 'Vi har hjälpt tusentals kunder med legalisering för länder över hela världen.'}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href="/bestall" 
                className="bg-accent-500 hover:bg-accent-600 text-white font-semibold px-8 py-4 rounded-lg transition-colors"
              >
                {isEn ? 'Order Now' : 'Beställ nu'}
              </Link>
              <Link 
                href="/kontakt" 
                className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-lg transition-colors"
              >
                {isEn ? 'Contact Us' : 'Kontakta oss'}
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
