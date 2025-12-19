/**
 * SEO Component for Order/Checkout Page
 * Provides comprehensive SEO metadata including Open Graph and Structured Data
 */

import Head from 'next/head';
import { siteConfig } from '@/config/env';
import { useTranslation } from 'next-i18next';

interface OrderSEOProps {
  step?: number;
  totalSteps?: number;
}

export const OrderSEO: React.FC<OrderSEOProps> = ({ step, totalSteps = 10 }) => {
  const { t, i18n } = useTranslation('common');
  const locale = i18n.language || 'sv';

  const baseTitleText = t(
    'seo.order.title',
    locale.startsWith('en') ? 'Order document legalization' : 'Beställ legalisering av dokument'
  );
  const brandName = 'DOX Visumpartner AB';

  const title = step
    ? locale.startsWith('en')
      ? `${baseTitleText} – Step ${step}/${totalSteps} | ${brandName}`
      : `${baseTitleText} – Steg ${step}/${totalSteps} | ${brandName}`
    : `${baseTitleText} | ${brandName}`;

  const description = t(
    'seo.order.description',
    locale.startsWith('en')
      ? 'Order professional legalization of your documents. Apostille, notarization and embassy legalization for all countries. Fast, secure and reliable service.'
      : 'Beställ professionell legalisering av dina dokument. Apostille, notarisering och ambassadlegalisering för alla länder. Snabb, säker och pålitlig service.'
  );

  const keywords = locale.startsWith('en')
    ? 'legalization, apostille, embassy legalization, document legalization, MFA legalization, notary public, chamber of commerce, ministry for foreign affairs'
    : 'legalisering, apostille, ambassadlegalisering, dokumentlegalisering, UD legalisering, notarius publicus, handelskammaren, utrikesdepartementet';

  const baseUrl = siteConfig.url;
  const orderPath = '/bestall';
  const orderUrl = `${baseUrl}${orderPath}`;
  const ogImage = `${baseUrl}/images/og-image.jpg`;
  const twitterImage = `${baseUrl}/images/twitter-image.jpg`;
  const ogLocale = locale.startsWith('en') ? 'en_US' : 'sv_SE';

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
      <meta property="og:url" content={orderUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:site_name" content="DOX Visumpartner AB" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={orderUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={twitterImage} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={orderUrl} />
      
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
              "name": "DOX Visumpartner AB",
              "url": baseUrl,
              "logo": `${baseUrl}/logo.png`,
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+46-8-40941900",
                "contactType": "Customer Service",
                "areaServed": "SE",
                "availableLanguage": ["Swedish", "English"]
              }
            },
            "areaServed": {
              "@type": "Country",
              "name": "Sweden"
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
                "item": baseUrl
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Beställ",
                "item": orderUrl
              }
            ]
          })
        }}
      />
    </Head>
  );
};

export default OrderSEO;
