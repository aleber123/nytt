import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from './Header';
import Footer from './Footer';
import Breadcrumbs from '../ui/Breadcrumbs';
import { useTranslation } from 'next-i18next';
import { siteConfig } from '@/config/env';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t } = useTranslation('common');
  const safeT = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };
  const router = useRouter();
  const { locale, asPath: routerAsPath } = router;
  const baseUrl = siteConfig.url;
  const asPath = routerAsPath || '/';
  
  // Remove any existing locale prefix and query string for clean path
  const cleanPath = asPath.split('?')[0].replace(/^\/(sv|en)/, '') || '/';
  const pathWithSlash = cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath;
  
  // Canonical should point to current page with current locale
  const canonicalUrl = locale === 'en' 
    ? `${baseUrl}/en${pathWithSlash === '/' ? '' : pathWithSlash}`
    : `${baseUrl}${pathWithSlash}`;
  
  // hreflang alternates - Swedish is default (no prefix), English has /en prefix
  const altSv = `${baseUrl}${pathWithSlash}`;
  const altEn = `${baseUrl}/en${pathWithSlash === '/' ? '' : pathWithSlash}`;
  
  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <link rel="canonical" href={canonicalUrl} />
        <link rel="alternate" hrefLang="sv" href={altSv} />
        <link rel="alternate" hrefLang="en" href={altEn} />
        <link rel="alternate" hrefLang="x-default" href={altSv} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'DOX Visumpartner AB',
              url: baseUrl,
              logo: `${baseUrl}/dox-logo.webp`,
              sameAs: [
                'https://www.linkedin.com/company/doxvl/posts/?feedView=all'
              ],
              contactPoint: [{
                '@type': 'ContactPoint',
                contactType: 'customer service',
                email: 'info@doxvl.se',
                areaServed: 'SE',
                availableLanguage: ['sv', 'en']
              }]
            })
          }}
        />
      </Head>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:p-4 focus:bg-primary-700 focus:text-white focus:z-50">
        {safeT('accessibility.skipToContent', 'Hoppa till innehåll')}
      </a>
      
      <Header />
      
      <div className="container mx-auto px-4">
        <Breadcrumbs />
      </div>
      
      <main id="main-content" className="flex-grow main-content">
        {children}
      </main>
      
      <Footer />
    </div>
  );
};

export default Layout;
