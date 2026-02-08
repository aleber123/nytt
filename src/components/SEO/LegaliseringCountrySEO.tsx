import Head from 'next/head';
import { useRouter } from 'next/router';

interface FAQItem {
  question: string;
  answer: string;
}

interface LegaliseringCountrySEOProps {
  countryName: string;
  countryNameEn?: string;
  countryCode: string;
  slug: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  keywords: string;
  keywordsEn?: string;
  ogDescription?: string;
  ogDescriptionEn?: string;
  schemaDescription?: string;
  serviceType?: string;
  priceLow?: string;
  priceHigh?: string;
  faqItems?: FAQItem[];
  alternateLanguages?: Array<{ lang: string; href: string }>;
}

export default function LegaliseringCountrySEO({
  countryName,
  countryNameEn,
  countryCode,
  slug,
  title,
  titleEn,
  description,
  descriptionEn,
  keywords,
  keywordsEn,
  ogDescription,
  ogDescriptionEn,
  schemaDescription,
  serviceType = 'Document Legalization',
  priceLow,
  priceHigh,
  faqItems,
  alternateLanguages,
}: LegaliseringCountrySEOProps) {
  const router = useRouter();
  const locale = router.locale || 'sv';
  const isEn = locale === 'en';
  const baseUrl = 'https://doxvl.se';

  const pageTitle = isEn && titleEn ? titleEn : title;
  const pageDescription = isEn && descriptionEn ? descriptionEn : description;
  const pageKeywords = isEn && keywordsEn ? keywordsEn : keywords;
  const pageOgDescription = isEn && ogDescriptionEn ? ogDescriptionEn : (ogDescription || pageDescription);
  const canonicalUrl = `${baseUrl}/legalisering/${slug}`;
  const displayCountry = isEn && countryNameEn ? countryNameEn : countryName;

  // Service Schema
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": isEn ? `Document Legalization for ${displayCountry}` : `Legalisering för ${countryName}`,
    "provider": {
      "@type": "Organization",
      "name": "DOX Visumpartner AB",
      "url": baseUrl,
      "logo": `${baseUrl}/dox-logo-new.png`,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Livdjursgatan 4",
        "addressLocality": "Johanneshov",
        "postalCode": "121 62",
        "addressCountry": "SE"
      },
      "telephone": "+46-8-409-419-00"
    },
    "description": schemaDescription || pageDescription,
    "areaServed": ["SE", countryCode],
    "serviceType": serviceType,
    ...(priceLow && priceHigh ? {
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "SEK",
        "lowPrice": priceLow,
        "highPrice": priceHigh,
        "offerCount": "3"
      }
    } : {})
  };

  // BreadcrumbList Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": isEn ? "Home" : "Hem", "item": baseUrl },
      { "@type": "ListItem", "position": 2, "name": isEn ? "Legalization" : "Legalisering", "item": `${baseUrl}/legalisering` },
      { "@type": "ListItem", "position": 3, "name": displayCountry, "item": canonicalUrl }
    ]
  };

  // FAQ Schema
  const faqSchema = faqItems && faqItems.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": { "@type": "Answer", "text": item.answer }
    }))
  } : null;

  return (
    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={pageKeywords} />

      {/* Canonical */}
      <link rel="canonical" href={canonicalUrl} />

      {/* hreflang */}
      <link rel="alternate" hrefLang="sv" href={`${baseUrl}/legalisering/${slug}`} />
      <link rel="alternate" hrefLang="en" href={`${baseUrl}/en/legalisering/${slug}`} />
      <link rel="alternate" hrefLang="x-default" href={`${baseUrl}/legalisering/${slug}`} />
      {alternateLanguages?.map(alt => (
        <link key={alt.lang} rel="alternate" hrefLang={alt.lang} href={alt.href} />
      ))}

      {/* Open Graph */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageOgDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="DOX Visumpartner" />
      <meta property="og:image" content={`${baseUrl}/dox-logo-new.png`} />
      <meta property="og:locale" content={isEn ? 'en_GB' : 'sv_SE'} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageOgDescription} />

      {/* Structured Data - Service */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />

      {/* Structured Data - BreadcrumbList */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Structured Data - FAQ (if provided) */}
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
    </Head>
  );
}
