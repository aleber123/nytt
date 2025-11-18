/**
 * SEO Component for Order/Checkout Page
 * Provides comprehensive SEO metadata including Open Graph and Structured Data
 */

import Head from 'next/head';

interface OrderSEOProps {
  step?: number;
  totalSteps?: number;
}

export const OrderSEO: React.FC<OrderSEOProps> = ({ step, totalSteps = 10 }) => {
  const title = step 
    ? `Beställ Legalisering - Steg ${step}/${totalSteps} | LegaliseringsTjänst AB`
    : 'Beställ Dokumentlegalisering | LegaliseringsTjänst AB';
  
  const description = 'Beställ professionell legalisering av dina dokument. Apostille och ambassadlegalisering för alla länder. Snabb, säker och pålitlig service med över 1,200 nöjda kunder.';

  const keywords = 'legalisering, apostille, ambassadlegalisering, dokumentlegalisering, UD legalisering, notarius publicus, handelskammaren, utrikesdepartementet';

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charSet="utf-8" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://legaliseringstjanst.se/bestall" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content="https://legaliseringstjanst.se/images/og-image.jpg" />
      <meta property="og:locale" content="sv_SE" />
      <meta property="og:site_name" content="LegaliseringsTjänst AB" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content="https://legaliseringstjanst.se/bestall" />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content="https://legaliseringstjanst.se/images/twitter-image.jpg" />
      
      {/* Canonical URL */}
      <link rel="canonical" href="https://legaliseringstjanst.se/bestall" />
      
      {/* Structured Data - Service */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Dokumentlegalisering",
            "description": description,
            "provider": {
              "@type": "Organization",
              "name": "LegaliseringsTjänst AB",
              "url": "https://legaliseringstjanst.se",
              "logo": "https://legaliseringstjanst.se/logo.png",
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+46-XX-XXX-XX-XX",
                "contactType": "Customer Service",
                "areaServed": "SE",
                "availableLanguage": ["Swedish", "English"]
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": "1200"
              }
            },
            "areaServed": {
              "@type": "Country",
              "name": "Sweden"
            },
            "offers": {
              "@type": "Offer",
              "price": "500",
              "priceCurrency": "SEK",
              "priceSpecification": {
                "@type": "PriceSpecification",
                "price": "500",
                "priceCurrency": "SEK",
                "valueAddedTaxIncluded": "false"
              },
              "availability": "https://schema.org/InStock"
            },
            "serviceType": "Document Legalization"
          })
        }}
      />
      
      {/* Structured Data - BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Hem",
                "item": "https://legaliseringstjanst.se"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Beställ",
                "item": "https://legaliseringstjanst.se/bestall"
              }
            ]
          })
        }}
      />
    </Head>
  );
};

export default OrderSEO;
