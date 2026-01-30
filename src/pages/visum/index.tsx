import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import Seo from '@/components/Seo';

export default function VisumPage() {
  const { t } = useTranslation('common');

  return (
    <>
      <Seo 
        title={t('visa.pageTitle', 'Visumtjänster | DOX Visumpartner')} 
        description={t('visa.pageDescription', 'Vi hjälper dig med visum till alla länder. Snabb och professionell service.')} 
      />
      
      <Head>
        <meta name="keywords" content="visum, visumtjänster, visumansökan, e-visum, turistvisum, affärsvisum, visum Sverige, DOX Visumpartner" />
        <link rel="canonical" href="https://www.doxvl.se/visum" />
        
        {/* Service Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Visumtjänster",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB",
            "url": "https://www.doxvl.se",
            "logo": "https://www.doxvl.se/images/dox-logo.png",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Livdjursgatan 4",
              "addressLocality": "Johanneshov",
              "postalCode": "121 62",
              "addressCountry": "SE"
            },
            "telephone": "+46-8-409-419-00"
          },
          "description": "Professionell visumservice för alla länder. Vi hjälper dig med e-visum, turistvisum och affärsvisum. Snabb handläggning och personlig service.",
          "areaServed": { "@type": "Country", "name": "Sweden" },
          "serviceType": "Visa Application Service",
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "SEK",
            "lowPrice": "800",
            "highPrice": "6000"
          }
        })}} />

        {/* BreadcrumbList Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Hem", "item": "https://www.doxvl.se" },
            { "@type": "ListItem", "position": 2, "name": "Visum", "item": "https://www.doxvl.se/visum" }
          ]
        })}} />

        {/* ItemList Schema - Popular Destinations */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Populära visumdestinationer",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Visum till Indien", "url": "https://www.doxvl.se/visum/indien" },
            { "@type": "ListItem", "position": 2, "name": "Visum till Thailand", "url": "https://www.doxvl.se/visum/thailand" },
            { "@type": "ListItem", "position": 3, "name": "Visum till Kenya", "url": "https://www.doxvl.se/visum/kenya" },
            { "@type": "ListItem", "position": 4, "name": "Visum till Tanzania", "url": "https://www.doxvl.se/visum/tanzania" },
            { "@type": "ListItem", "position": 5, "name": "Visum till Sri Lanka", "url": "https://www.doxvl.se/visum/sri-lanka" },
            { "@type": "ListItem", "position": 6, "name": "Visum till Angola", "url": "https://www.doxvl.se/visum/angola" }
          ]
        })}} />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/images/AdobeStock_343503546.jpeg)' }}>
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          
          <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-6">
                {t('visa.heroTitle', 'Visumtjänster')}
              </h1>
              <p className="text-lg md:text-xl text-white/80 mb-10">
                {t('visa.heroSubtitle', 'Vi hjälper dig att ansöka om visum till destinationer världen över. Snabbt, enkelt och professionellt.')}
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/visum/bestall"
                  className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-custom-button hover:bg-custom-button/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-button"
                >
                  {t('visa.orderCta', 'Beställ visum')}
                </Link>
              </div>
            </div>
          </div>
          
          <div className="absolute left-0 right-0" style={{ bottom: '-1px' }}>
            <svg className="block w-full" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 120L48 105C96 90 192 60 288 50C384 40 480 50 576 55C672 60 768 60 864 65C960 70 1056 80 1152 75C1248 70 1344 50 1392 40L1440 30V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z" fill="white"/>
            </svg>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-heading font-bold text-gray-900 mb-8 text-center">
                {t('visa.howItWorksTitle', 'Så fungerar det')}
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-custom-button/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-custom-button">1</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{t('visa.step1Title', 'Fyll i formuläret')}</h3>
                  <p className="text-gray-600">{t('visa.step1Desc', 'Ange destination, resedatum och övrig information.')}</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-custom-button/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-custom-button">2</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{t('visa.step2Title', 'Skicka pass & dokument')}</h3>
                  <p className="text-gray-600">{t('visa.step2Desc', 'Vi hämtar eller tar emot ditt pass och nödvändiga dokument.')}</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-custom-button/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-custom-button">3</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{t('visa.step3Title', 'Få ditt visum')}</h3>
                  <p className="text-gray-600">{t('visa.step3Desc', 'Vi levererar tillbaka ditt pass med visum.')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-heading font-bold text-gray-900 mb-6">
              {t('visa.ctaTitle', 'Redo att beställa?')}
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {t('visa.ctaText', 'Starta din visumansökan idag. Vi guidar dig genom hela processen.')}
            </p>
            <Link 
              href="/visum/bestall" 
              className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-custom-button hover:bg-custom-button/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-button"
            >
              {t('visa.ctaButton', 'Beställ visum nu')}
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'sv', ['common'])),
    },
  };
};
