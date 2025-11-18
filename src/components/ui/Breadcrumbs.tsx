import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

interface BreadcrumbsProps {
  className?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ className = '' }) => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const safeT = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };
  
  // Skapa breadcrumbs baserat på nuvarande sökväg
  const generateBreadcrumbs = () => {
    // Exkludera språkprefix från sökvägen om det finns
    const asPathWithoutQuery = router.asPath.split('?')[0]; // Remove query parameters
    const asPathWithoutLang = asPathWithoutQuery.split('/').filter(p => p !== 'sv' && p !== 'en').join('/');
    const asPathNestedRoutes = asPathWithoutLang.split('/').filter(v => v.length > 0);
    
    // Om vi är på startsidan, visa ingen breadcrumb
    if (asPathNestedRoutes.length === 0) {
      return [];
    }
    
    // Skapa breadcrumbs-array
    const crumbList = asPathNestedRoutes.map((subpath, idx) => {
      const href = '/' + asPathNestedRoutes.slice(0, idx + 1).join('/');
      return {
        href,
        text: getBreadcrumbText(subpath),
      };
    });
    
    // Lägg till "Hem" som första breadcrumb
    return [{ href: '/', text: safeT('nav.home', 'Hem') }, ...crumbList];
  };
  
  // Översätt sökvägsnamn till läsbara namn
  const getBreadcrumbText = (path: string) => {
    const breadcrumbMap: { [key: string]: string } = {
      'tjanster': safeT('nav.services', 'Tjänster'),
      'bestall': safeT('nav.order', 'Beställ'),
      'lander': safeT('nav.countries', 'Länder'),
      'priser': safeT('nav.prices', 'Priser'),
      'om-oss': safeT('nav.about', 'Om oss'),
      'kontakt': safeT('nav.contact', 'Kontakt'),
      'orderstatus': 'Orderstatus',
      'apostille': safeT('services.apostille.title', 'Apostille'),
      'notarisering': safeT('services.notarization.title', 'Notarisering'),
      'ambassad': safeT('services.embassy.title', 'Ambassadlegalisering'),
      'oversattning': safeT('services.translation.title', 'Auktoriserad översättning'),
      'bekraftelse': safeT('confirmation.title', 'Orderbekräftelse'),
    };
    
    return breadcrumbMap[path] || path;
  };
  
  const breadcrumbs = generateBreadcrumbs();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://doxvl-51a30.web.app';
  const breadcrumbLd = breadcrumbs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: crumb.text,
      item: `${baseUrl}${crumb.href}`
    }))
  } : null;
  
  // Visa inte breadcrumbs om vi är på startsidan
  if (breadcrumbs.length <= 1) return null;
  
  return (
    <nav aria-label={safeT('accessibility.breadcrumbs', 'Brödsmulor')} className={`py-3 ${className}`}>
      {breadcrumbLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
      )}
      <ol className="flex flex-wrap items-center space-x-1 text-sm text-gray-500">
        {breadcrumbs.map((crumb, idx) => (
          <li key={idx} className="flex items-center">
            {idx > 0 && (
              <ChevronRightIcon className="h-4 w-4 mx-1 text-gray-400" aria-hidden="true" />
            )}
            {idx === breadcrumbs.length - 1 ? (
              <span className="font-medium text-gray-900" aria-current="page">
                {crumb.text}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-teal-600 transition-colors duration-200"
              >
                {crumb.text}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
