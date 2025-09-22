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
    return [{ href: '/', text: t('nav.home') }, ...crumbList];
  };
  
  // Översätt sökvägsnamn till läsbara namn
  const getBreadcrumbText = (path: string) => {
    const breadcrumbMap: { [key: string]: string } = {
      'tjanster': t('nav.services'),
      'bestall': t('nav.order'),
      'lander': t('nav.countries'),
      'priser': t('nav.prices'),
      'om-oss': t('nav.about'),
      'kontakt': t('nav.contact'),
      'apostille': t('services.apostille.title'),
      'notarisering': t('services.notarization.title'),
      'ambassad': t('services.embassy.title'),
      'oversattning': t('services.translation.title'),
      'bekraftelse': t('confirmation.title'),
    };
    
    return breadcrumbMap[path] || path;
  };
  
  const breadcrumbs = generateBreadcrumbs();
  
  // Visa inte breadcrumbs om vi är på startsidan
  if (breadcrumbs.length <= 1) return null;
  
  return (
    <nav aria-label={t('accessibility.breadcrumbs')} className={`py-3 ${className}`}>
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
