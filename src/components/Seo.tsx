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
}

const Seo: React.FC<SeoProps> = ({ 
  title, 
  description, 
  noindex, 
  image, 
  keywords,
  faqItems,
  serviceType,
  priceRange
}) => {
  const router = useRouter();
  const baseUrl = siteConfig.url;
  const url = `${baseUrl}${router.asPath || '/'}`;
  const ogImage = image || `${baseUrl}/og-image.jpg`;

  // Create structured data for local business
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
      "https://www.linkedin.com/company/dox-visumpartner"
    ]
  };

  // Create Organization schema
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "DOX Visumpartner",
    "alternateName": "DOXVL",
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+46-8-40941900",
      "contactType": "customer service",
      "availableLanguage": ["Swedish", "English"]
    }
  };

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

  // Create Service schema if serviceType provided
  const serviceSchema = serviceType ? {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": serviceType,
    "provider": {
      "@type": "Organization",
      "name": "DOX Visumpartner"
    },
    "areaServed": {
      "@type": "Country",
      "name": "Sweden"
    },
    "description": description
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

      {/* Language alternates */}
      <link rel="alternate" hrefLang="sv" href={`${baseUrl}${router.asPath}`} />
      <link rel="alternate" hrefLang="en" href={`${baseUrl}/en${router.asPath}`} />
      <link rel="alternate" hrefLang="x-default" href={`${baseUrl}${router.asPath}`} />

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
