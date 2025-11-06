import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';

const Footer: React.FC = () => {
  const { t } = useTranslation('common');
  
  const currentYear = new Date().getFullYear();
  
  const footerNavigation = {
    services: [
      { name: t('footer.services.apostille'), href: '/tjanster/apostille' },
      { name: t('footer.services.notarization'), href: '/tjanster/notarisering' },
      { name: t('footer.services.embassy'), href: '/tjanster/ambassadlegalisering' },
      { name: t('footer.services.translation'), href: '/tjanster/oversattning' },
    ],
    support: [
      { name: t('footer.support.faq'), href: '/faq' },
      { name: t('footer.support.contact'), href: '/kontakt' },
      { name: t('footer.support.pricing'), href: '/priser' },
      { name: t('footer.support.delivery'), href: '/leveranstider' },
    ],
    company: [
      { name: t('footer.company.about'), href: '/om-oss' },
      { name: t('footer.company.careers'), href: '/karriar' },
      { name: t('footer.company.blog'), href: '/blogg' },
      { name: t('footer.company.press'), href: '/press' },
    ],
    legal: [
      { name: t('footer.legal.privacy'), href: '/integritetspolicy' },
      { name: t('footer.legal.terms'), href: '/villkor' },
      { name: t('footer.legal.accessibility'), href: '/tillganglighet' },
      { name: t('footer.legal.cookies'), href: '/cookies' },
    ],
  };

  return (
    <footer aria-labelledby="footer-heading" style={{ backgroundColor: 'rgba(46,45,44,1)' }}>
      <h2 id="footer-heading" className="sr-only">
        {t('footer.title')}
      </h2>
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <Link href="/" className="flex items-center">
              <img
                src="/dox-logo.webp"
                alt="DOX Visumpartner AB"
                className="h-10 w-auto"
              />
              <span className="ml-3 text-xl font-heading font-bold text-white">
                Legaliseringstjänst
              </span>
            </Link>
            <p className="text-base text-gray-300 whitespace-pre-line">
              Sveriges bästa visum & legaliseringsföretag
              {"\n"}
              © DOX Visumpartner AB.
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
                  {t('footer.services.title')}
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
                  {t('footer.support.title')}
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
                  {t('footer.company.title')}
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
                  {t('footer.legal.title')}
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
