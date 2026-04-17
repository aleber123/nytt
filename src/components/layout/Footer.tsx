import React from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useTranslation } from 'next-i18next';
import CountryFlag from '@/components/ui/CountryFlag';

const Footer: React.FC = () => {
  const { t } = useTranslation('common');
  const safeT = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const currentYear = 2026;

  // Helper: translate a country code to localised name via footer.countryNames
  const cn = (code: string, fallback: string) => safeT(`footer.countryNames.${code}`, fallback);

  const footerNavigation = {
    services: [
      { name: safeT('footer.services.apostille', 'Apostille'), href: '/tjanster/apostille' },
      { name: safeT('footer.services.notarization', 'Notarization'), href: '/tjanster/notarius-publicus' },
      { name: safeT('footer.services.embassy', 'Embassy legalization'), href: '/tjanster/ambassadlegalisering' },
      { name: safeT('footer.services.translation', 'Authorized translation'), href: '/tjanster/oversattning' },
    ],
    countries: [
      { name: cn('AO', 'Angola'), code: 'AO', href: '/legalisering/angola' },
      { name: cn('EG', 'Egypt'), code: 'EG', href: '/legalisering/egypten' },
      { name: cn('ET', 'Ethiopia'), code: 'ET', href: '/legalisering/etiopien' },
      { name: cn('IN', 'India'), code: 'IN', href: '/legalisering/indien' },
      { name: cn('IQ', 'Iraq'), code: 'IQ', href: '/legalisering/irak' },
      { name: cn('KW', 'Kuwait'), code: 'KW', href: '/legalisering/kuwait' },
      { name: cn('LB', 'Lebanon'), code: 'LB', href: '/legalisering/libanon' },
      { name: cn('LY', 'Libya'), code: 'LY', href: '/legalisering/libyen' },
      { name: cn('MZ', 'Mozambique'), code: 'MZ', href: '/legalisering/mocambique' },
      { name: cn('NG', 'Nigeria'), code: 'NG', href: '/legalisering/nigeria' },
      { name: cn('PS', 'Palestine'), code: 'PS', href: '/legalisering/palestina' },
      { name: cn('QA', 'Qatar'), code: 'QA', href: '/legalisering/qatar' },
      { name: cn('SA', 'Saudi Arabia'), code: 'SA', href: '/legalisering/saudiarabien' },
      { name: cn('ES', 'Spain'), code: 'ES', href: '/legalisering/spanien' },
      { name: cn('LK', 'Sri Lanka'), code: 'LK', href: '/legalisering/sri-lanka' },
      { name: cn('SY', 'Syria'), code: 'SY', href: '/legalisering/syrien' },
      { name: cn('TW', 'Taiwan'), code: 'TW', href: '/legalisering/taiwan' },
      { name: cn('TH', 'Thailand'), code: 'TH', href: '/legalisering/thailand' },
      { name: cn('AE', 'UAE'), code: 'AE', href: '/legalisering/uae' },
      { name: cn('VN', 'Vietnam'), code: 'VN', href: '/legalisering/vietnam' },
    ],
    visas: [
      { name: cn('AO', 'Angola'), code: 'AO', href: '/visum/angola' },
      { name: cn('BR', 'Brazil'), code: 'BR', href: '/visum/brasilien' },
      { name: cn('IN', 'India'), code: 'IN', href: '/visum/indien' },
      { name: cn('KE', 'Kenya'), code: 'KE', href: '/visum/kenya' },
      { name: cn('SA', 'Saudi Arabia'), code: 'SA', href: '/visum/saudiarabien' },
      { name: cn('LK', 'Sri Lanka'), code: 'LK', href: '/visum/sri-lanka' },
      { name: cn('GB', 'United Kingdom'), code: 'GB', href: '/visum/storbritannien' },
      { name: cn('TZ', 'Tanzania'), code: 'TZ', href: '/visum/tanzania' },
      { name: cn('TH', 'Thailand'), code: 'TH', href: '/visum/thailand' },
      { name: cn('US', 'USA'), code: 'US', href: '/visum/usa' },
    ],
    nordic: [
      { name: cn('NO', 'Norway'), code: 'NO', href: '/norge' },
      { name: cn('DK', 'Denmark'), code: 'DK', href: '/danmark' },
      { name: cn('FI', 'Finland'), code: 'FI', href: '/finland' },
      { name: 'Kuwait (DK)', code: 'KW', href: '/legalisering/kuwait-danmark' },
      { name: 'Kuwait (FI)', code: 'KW', href: '/legalisering/kuwait-finland' },
    ],
    support: [
      { name: safeT('footer.support.faq', 'FAQ'), href: '/faq' },
      { name: safeT('footer.support.contact', 'Contact us'), href: '/kontakt' },
      { name: safeT('footer.support.pricing', 'Pricing'), href: '/priser' },
      { name: safeT('footer.support.delivery', 'Delivery times'), href: '/leveranstider' },
    ],
    company: [
      { name: safeT('footer.company.about', 'About us'), href: '/om-oss' },
      { name: safeT('footer.company.careers', 'Careers'), href: '/karriar' },
      { name: safeT('footer.company.blog', 'Blog'), href: '/blogg' },
      { name: safeT('footer.company.press', 'Press'), href: '/press' },
    ],
    legal: [
      { name: safeT('footer.legal.privacy', 'Privacy policy'), href: '/integritetspolicy' },
      { name: safeT('footer.legal.terms', 'Terms'), href: '/villkor' },
      { name: safeT('footer.legal.accessibility', 'Accessibility'), href: '/tillganglighet' },
      { name: safeT('footer.legal.cookies', 'Cookies'), href: '/cookies' },
    ],
  };

  return (
    <footer aria-labelledby="footer-heading" style={{ backgroundColor: 'rgba(46,45,44,1)' }}>
      <h2 id="footer-heading" className="sr-only">
        {safeT('footer.title', 'Footer')}
      </h2>
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <Link href="/" className="flex items-center">
              <NextImage
                src="/logo-new.svg"
                alt="DOX Visumpartner AB"
                width={259}
                height={131}
                style={{ height: 'auto', width: 'auto', maxHeight: '4.3rem' }}
              />
            </Link>
            <p className="text-base text-gray-200 whitespace-pre-line">
              {safeT('footer.tagline', 'Sweden\'s leading visa & legalisation company')}
              {"\n"}
              &copy; DOX Visumpartner AB.
              {"\n"}
              Box: 38
              {"\n"}
              {safeT('footer.postalCode', 'Postnummer')}: 121 25
              {"\n"}
              {safeT('footer.city', 'Postort')}: Stockholm-Globen
              {"\n"}
              Bankgiro: 0896-8869
              {"\n"}
              Swish: 123 100 7764
              {"\n"}
              Org.nr: 559015-4521
              {"\n\n"}
              {safeT('footer.contact', 'Contact')}
              {"\n"}
              {safeT('footer.openingHours', 'Opening hours')}
              {"\n"}
              {safeT('footer.monThu', 'Mon - Thu | 09:00 - 16:00')}
              {"\n"}
              {safeT('footer.fri', 'Fri | 09:00 - 15:00')}
              {"\n"}
              {safeT('footer.satSun', 'Sat - Sun Closed')}
            </p>
            <div className="flex space-x-6">
              <a href="https://www.linkedin.com/company/doxvl/posts/?feedView=all" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-300" aria-label="LinkedIn">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">
                  {safeT('footer.services.title', 'Services')}
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  {footerNavigation.services.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="text-base text-gray-300 hover:text-white">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">
                  {safeT('footer.support.title', 'Support')}
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  {footerNavigation.support.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="text-base text-gray-300 hover:text-white">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">
                  {safeT('footer.company.title', 'Company')}
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  {footerNavigation.company.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="text-base text-gray-300 hover:text-white">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">
                  {safeT('footer.legal.title', 'Legal information')}
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  {footerNavigation.legal.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="text-base text-gray-300 hover:text-white">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Countries section – full width */}
        <div className="mt-12 pt-10 border-t border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Legalisering */}
            <div>
              <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">
                {safeT('footer.legalizationByCountry', 'Legalisation by country')}
              </h3>
              <ul role="list" className="grid grid-cols-2 gap-x-6 gap-y-2">
                {footerNavigation.countries.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm text-gray-300 hover:text-white flex items-center gap-1.5 py-0.5 transition-colors">
                      <CountryFlag code={item.code} size={16} />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Visum */}
            <div>
              <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">
                {safeT('footer.visaByCountry', 'Visa by country')}
              </h3>
              <ul role="list" className="grid grid-cols-2 gap-x-6 gap-y-2">
                {footerNavigation.visas.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm text-gray-300 hover:text-white flex items-center gap-1.5 py-0.5 transition-colors">
                      <CountryFlag code={item.code} size={16} />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Norden */}
            <div>
              <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">
                {safeT('footer.nordic', 'Nordics')}
              </h3>
              <ul role="list" className="grid grid-cols-1 gap-y-2">
                {footerNavigation.nordic.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm text-gray-300 hover:text-white flex items-center gap-1.5 py-0.5 transition-colors">
                      <CountryFlag code={item.code} size={16} />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-700 pt-8">
          <p className="text-base text-gray-300 xl:text-center">
            &copy; {currentYear} DOX Visumpartner AB. {safeT('footer.rights', 'All rights reserved.')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
