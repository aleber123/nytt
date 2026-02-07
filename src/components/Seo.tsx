import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { siteConfig } from '@/config/env';

interface FAQItem {
  question: string;
  answer: string;
}

interface SeoProps {
  title: string;
  description: string;
  noindex?: boolean;
  image?: string;
  keywords?: string;
  faqItems?: FAQItem[];
  serviceType?: string;
  priceRange?: string;
  servicePrice?: string;
  serviceCurrency?: string;
  isHomePage?: boolean;
}

const Seo: React.FC<SeoProps> = ({ 
  title, 
  description, 
  noindex, 
  image, 
  keywords,
  faqItems,
  serviceType,
  priceRange,
  servicePrice,
  serviceCurrency = 'SEK',
  isHomePage = false
}) => {
  const router = useRouter();
  const baseUrl = siteConfig.url;
  
  // Build canonical URL based on current locale
  // For Swedish (default), use base path without /sv prefix
  // For English, include /en prefix
  const currentLocale = router.locale || 'sv';
  const pathWithoutLocale = router.asPath.replace(/^\/en(\/|$)/, '/').replace(/\/$/, '') || '/';
  const canonicalPath = currentLocale === 'en' 
    ? `/en${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`
    : (pathWithoutLocale === '/' ? '' : pathWithoutLocale);
  const url = `${baseUrl}${canonicalPath}`;
  const ogImage = image || `${baseUrl}/dox-logo-new.png`;

  // Create structured data for local business with AggregateRating
  const localBusinessData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": siteConfig.name,
    "description": siteConfig.description,
    "url": baseUrl,
    "telephone": "+46-8-40941900",
    "email": "info@doxvl.se",
    "priceRange": priceRange || "$$",
    "image": ogImage,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Box 38",
      "postalCode": "121 25",
      "addressLocality": "Stockholm-Globen",
      "addressCountry": "SE"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "59.2934",
      "longitude": "18.0831"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday"],
        "opens": "09:00",
        "closes": "16:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Friday",
        "opens": "09:00",
        "closes": "15:00"
      }
    ],
    "sameAs": [
      "https://www.facebook.com/doxvisumpartner",
      "https://www.linkedin.com/company/dox-visumpartner",
      "https://www.trustpilot.com/review/doxvl.dk"
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "127",
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  // Create Organization schema
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "DOX Visumpartner AB",
    "alternateName": ["DOXVL", "DOX Visumpartner"],
    "url": baseUrl,
    "logo": {
      "@type": "ImageObject",
      "url": `${baseUrl}/dox-logo-new.png`,
      "width": 512,
      "height": 512
    },
    "image": `${baseUrl}/dox-logo-new.png`,
    "description": "Sveriges ledande byrå för dokumentlegalisering och visumtjänster. Apostille, UD-legalisering, ambassadlegalisering och visum.",
    "foundingDate": "2009",
    "numberOfEmployees": {
      "@type": "QuantitativeValue",
      "minValue": 5,
      "maxValue": 15
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Livdjursgatan 4",
      "postalCode": "121 62",
      "addressLocality": "Johanneshov",
      "addressRegion": "Stockholm",
      "addressCountry": "SE"
    },
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "telephone": "+46-8-40941900",
        "contactType": "customer service",
        "availableLanguage": ["Swedish", "English", "Norwegian", "Danish"],
        "areaServed": ["SE", "NO", "DK", "FI"]
      }
    ],
    "sameAs": [
      "https://www.facebook.com/doxvisumpartner",
      "https://www.linkedin.com/company/dox-visumpartner",
      "https://www.trustpilot.com/review/doxvl.dk"
    ],
    "knowsAbout": [
      "Document legalization",
      "Apostille",
      "Embassy legalization",
      "Visa applications",
      "Notarius Publicus",
      "Ministry for Foreign Affairs legalization",
      "Chamber of Commerce certification"
    ]
  };

  // WebSite schema with SearchAction (for Google sitelinks search box)
  const websiteSchema = isHomePage ? {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "DOX Visumpartner",
    "alternateName": "DOXVL",
    "url": baseUrl,
    "inLanguage": ["sv", "en"],
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/lander?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  } : null;

  // Create FAQ schema if faqItems provided
  const faqSchema = faqItems && faqItems.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  } : null;

  // Create Service schema if serviceType provided (with optional pricing)
  const serviceSchema = serviceType ? {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": serviceType,
    "provider": {
      "@type": "Organization",
      "name": "DOX Visumpartner",
      "url": "https://www.doxvl.se"
    },
    "areaServed": {
      "@type": "Country",
      "name": "Sweden"
    },
    "description": description,
    ...(servicePrice && {
      "offers": {
        "@type": "Offer",
        "price": servicePrice,
        "priceCurrency": serviceCurrency,
        "availability": "https://schema.org/InStock",
        "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
      }
    })
  } : null;

  // Create BreadcrumbList schema
  const pathSegments = router.asPath.split('/').filter(Boolean);
  const breadcrumbSchema = pathSegments.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Hem",
        "item": baseUrl
      },
      ...pathSegments.map((segment, index) => ({
        "@type": "ListItem",
        "position": index + 2,
        "name": segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
        "item": `${baseUrl}/${pathSegments.slice(0, index + 1).join('/')}`
      }))
    ]
  } : null;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />

      {/* Language alternates - handle locale prefix correctly */}
      <link rel="alternate" hrefLang="sv" href={`${baseUrl}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`} />
      <link rel="alternate" hrefLang="en" href={`${baseUrl}/en${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`} />
      <link rel="alternate" hrefLang="x-default" href={`${baseUrl}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={siteConfig.name} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="sv_SE" />
      <meta property="og:locale:alternate" content="en_GB" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Additional SEO meta tags */}
      <meta name="author" content="DOX Visumpartner" />
      <meta name="geo.region" content="SE-AB" />
      <meta name="geo.placename" content="Stockholm" />
      <meta name="geo.position" content="59.2934;18.0831" />
      <meta name="ICBM" content="59.2934, 18.0831" />

      {/* Structured Data - Local Business */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessData) }}
      />

      {/* Structured Data - Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
      />

      {/* Structured Data - WebSite (homepage only) */}
      {websiteSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      )}

      {/* Structured Data - FAQ (if provided) */}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {/* Structured Data - Service (if provided) */}
      {serviceSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
        />
      )}

      {/* Structured Data - Breadcrumb */}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
    </Head>
  );
};

export default Seo;
