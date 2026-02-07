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
  
  const currentYear = new Date().getFullYear();
  
  const footerNavigation = {
    services: [
      { name: safeT('footer.services.apostille', 'Apostille'), href: '/tjanster/apostille' },
      { name: safeT('footer.services.notarization', 'Notarisering'), href: '/tjanster/notarius-publicus' },
      { name: safeT('footer.services.embassy', 'Ambassadlegalisering'), href: '/tjanster/ambassadlegalisering' },
      { name: safeT('footer.services.translation', 'Auktoriserad översättning'), href: '/tjanster/oversattning' },
    ],
    countries: [
      { name: 'Angola', code: 'AO', href: '/legalisering/angola' },
      { name: 'Egypten', code: 'EG', href: '/legalisering/egypten' },
      { name: 'Etiopien', code: 'ET', href: '/legalisering/etiopien' },
      { name: 'Indien', code: 'IN', href: '/legalisering/indien' },
      { name: 'Irak', code: 'IQ', href: '/legalisering/irak' },
      { name: 'Kuwait', code: 'KW', href: '/legalisering/kuwait' },
      { name: 'Libanon', code: 'LB', href: '/legalisering/libanon' },
      { name: 'Libyen', code: 'LY', href: '/legalisering/libyen' },
      { name: 'Moçambique', code: 'MZ', href: '/legalisering/mocambique' },
      { name: 'Nigeria', code: 'NG', href: '/legalisering/nigeria' },
      { name: 'Palestina', code: 'PS', href: '/legalisering/palestina' },
      { name: 'Qatar', code: 'QA', href: '/legalisering/qatar' },
      { name: 'Saudiarabien', code: 'SA', href: '/legalisering/saudiarabien' },
      { name: 'Spanien', code: 'ES', href: '/legalisering/spanien' },
      { name: 'Sri Lanka', code: 'LK', href: '/legalisering/sri-lanka' },
      { name: 'Syrien', code: 'SY', href: '/legalisering/syrien' },
      { name: 'Taiwan', code: 'TW', href: '/legalisering/taiwan' },
      { name: 'Thailand', code: 'TH', href: '/legalisering/thailand' },
      { name: 'UAE', code: 'AE', href: '/legalisering/uae' },
      { name: 'Vietnam', code: 'VN', href: '/legalisering/vietnam' },
    ],
    visas: [
      { name: 'Angola', code: 'AO', href: '/visum/angola' },
      { name: 'Brasilien', code: 'BR', href: '/visum/brasilien' },
      { name: 'Indien', code: 'IN', href: '/visum/indien' },
      { name: 'Kenya', code: 'KE', href: '/visum/kenya' },
      { name: 'Saudiarabien', code: 'SA', href: '/visum/saudiarabien' },
      { name: 'Sri Lanka', code: 'LK', href: '/visum/sri-lanka' },
      { name: 'Storbritannien', code: 'GB', href: '/visum/storbritannien' },
      { name: 'Tanzania', code: 'TZ', href: '/visum/tanzania' },
      { name: 'Thailand', code: 'TH', href: '/visum/thailand' },
      { name: 'USA', code: 'US', href: '/visum/usa' },
    ],
    nordic: [
      { name: 'Norge', code: 'NO', href: '/norge' },
      { name: 'Danmark', code: 'DK', href: '/danmark' },
      { name: 'Finland', code: 'FI', href: '/finland' },
      { name: 'Kuwait (DK)', code: 'KW', href: '/legalisering/kuwait-danmark' },
      { name: 'Kuwait (FI)', code: 'KW', href: '/legalisering/kuwait-finland' },
    ],
    support: [
      { name: safeT('footer.support.faq', 'Vanliga frågor'), href: '/faq' },
      { name: safeT('footer.support.contact', 'Kontakta oss'), href: '/kontakt' },
      { name: safeT('footer.support.pricing', 'Priser'), href: '/priser' },
      { name: safeT('footer.support.delivery', 'Leveranstider'), href: '/leveranstider' },
    ],
    company: [
      { name: safeT('footer.company.about', 'Om oss'), href: '/om-oss' },
      { name: safeT('footer.company.careers', 'Karriär'), href: '/karriar' },
      { name: safeT('footer.company.blog', 'Blogg'), href: '/blogg' },
      { name: safeT('footer.company.press', 'Press'), href: '/press' },
    ],
    legal: [
      { name: safeT('footer.legal.privacy', 'Integritetspolicy'), href: '/integritetspolicy' },
      { name: safeT('footer.legal.terms', 'Villkor'), href: '/villkor' },
      { name: safeT('footer.legal.accessibility', 'Tillgänglighet'), href: '/tillganglighet' },
      { name: safeT('footer.legal.cookies', 'Cookies'), href: '/cookies' },
    ],
  };

  return (
    <footer aria-labelledby="footer-heading" style={{ backgroundColor: 'rgba(46,45,44,1)' }}>
      <h2 id="footer-heading" className="sr-only">
        {safeT('footer.title', 'Sidfot')}
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
              Sveriges bästa visum & legaliseringsföretag
              {"\n"}
              &copy; DOX Visumpartner AB.
              {"\n"}
              Box: 38
              {"\n"}
              Postnummer: 121 25
              {"\n"}
              Postort: Stockholm-Globen
              {"\n"}
              Bankgiro: 0896-8869
              {"\n"}
              Swish: 123 100 7764
              {"\n"}
              Org.nr: 559015-4521
              {"\n\n"}
              Kontakt
              {"\n"}
              Öppettider
              {"\n"}
              Mån - Tor | 09:00 - 16:00
              {"\n"}
              Fre | 09:00 - 15:00
              {"\n"}
              Lör - Sön Stängt
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
                  {safeT('footer.services.title', 'Tjänster')}
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
                  {safeT('footer.company.title', 'Företag')}
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
                  {safeT('footer.legal.title', 'Juridisk information')}
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
                Legalisering per land
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
                Visum per land
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
                Norden
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
            &copy; {currentYear} DOX Visumpartner AB. Alla rättigheter förbehållna.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
