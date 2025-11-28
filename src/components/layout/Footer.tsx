import React from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useTranslation } from 'next-i18next';

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
      { name: safeT('footer.services.notarization', 'Notarisering'), href: '/tjanster/notarisering' },
      { name: safeT('footer.services.embassy', 'Ambassadlegalisering'), href: '/tjanster/ambassadlegalisering' },
      { name: safeT('footer.services.translation', 'Auktoriserad översättning'), href: '/tjanster/oversattning' },
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
                src="/dox-logo.webp"
                alt="DOX Visumpartner AB"
                width={120}
                height={40}
                style={{ height: 'auto', width: 'auto', maxHeight: '2.5rem' }}
              />
            </Link>
            <p className="text-base text-gray-300 whitespace-pre-line">
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
                      <Link href={item.href} className="text-base text-gray-400 hover:text-white">
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
                      <Link href={item.href} className="text-base text-gray-400 hover:text-white">
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
                      <Link href={item.href} className="text-base text-gray-400 hover:text-white">
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
                      <Link href={item.href} className="text-base text-gray-400 hover:text-white">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-700 pt-8">
          <p className="text-base text-gray-400 xl:text-center">
            &copy; {currentYear} DOX Visumpartner AB. Alla rättigheter förbehållna.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
