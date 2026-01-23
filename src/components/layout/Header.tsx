import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Bars3Icon, XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const { t, i18n } = useTranslation('common');
  const safeT = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  useEffect(() => {
    const handleRouteChangeComplete = () => {
      setIsMenuOpen(false);
    };

    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router.events]);
  
  const navigation = [
    { name: safeT('nav.home', 'Hem'), href: '/' },
    { name: safeT('nav.about', 'Om oss'), href: '/om-oss' },
    { name: safeT('nav.contact', 'Kontakt'), href: '/kontakt' },
    { name: 'Orderstatus', href: '/orderstatus' },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const changeLanguage = (locale: string) => {
    if (router.locale === locale) return;

    // Navigate to the same route but with a different locale.
    // Use pathname + query so Next.js correctly prefixes the URL
    // and reloads page props/translations for the new locale.
    router.push({ pathname: router.pathname, query: router.query }, undefined, { locale });
  };

  return (
    <header className="shadow-sm" style={{ backgroundColor: 'rgba(46,45,44,1)' }}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <NextImage
                src="/logo-new.svg"
                alt="DOX Visumpartner AB"
                width={201}
                height={101}
                priority
                style={{ width: 'auto', height: 'auto', maxHeight: '3.3rem' }}
              />
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <nav className="hidden md:flex space-x-8" aria-label={safeT('accessibility.mainNav', 'Huvudmeny')}>
            {navigation.map((item) => (
              <Link 
                key={item.name}
                href={item.href}
                className={`text-base font-medium px-1 py-2 transition-colors duration-200 ${
                  router.pathname === item.href
                    ? 'text-custom-button border-b-2 border-custom-button font-semibold'
                    : 'text-white hover:text-custom-button hover:border-b-2 hover:border-custom-button/50'
                }`}
                aria-current={router.pathname === item.href ? 'page' : undefined}
              >
                {item.name}
              </Link>
            ))}
          </nav>
          
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex space-x-2">
              <button
                onClick={() => changeLanguage('sv')}
                className={`p-2 rounded-md transition-colors duration-200 ${
                  i18n.language === 'sv'
                    ? 'bg-custom-button/10 text-custom-button font-medium'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                aria-label={safeT('accessibility.switchToSwedish', 'Byt till svenska')}
                aria-pressed={i18n.language === 'sv'}
              >
                SV
              </button>
              <button
                onClick={() => changeLanguage('en')}
                className={`p-2 rounded-md transition-colors duration-200 ${
                  i18n.language === 'en'
                    ? 'bg-custom-button/10 text-custom-button font-medium'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                aria-label={safeT('accessibility.switchToEnglish', 'Switch to English')}
                aria-pressed={i18n.language === 'en'}
              >
                EN
              </button>
            </div>
            
            <Link
              href="/bestall"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-custom-button hover:bg-custom-button/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-button shadow-sm transition-all duration-200 hover:shadow"
            >
              {safeT('nav.order', 'Beställ nu')}
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-custom-button hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-custom-button"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
              onClick={toggleMenu}
            >
              <span className="sr-only">{isMenuOpen ? safeT('accessibility.closeMenu', 'Stäng meny') : safeT('accessibility.openMenu', 'Öppna meny')}</span>
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}
        id="mobile-menu"
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-700 shadow-inner" style={{ backgroundColor: 'rgba(46,45,44,1)' }}>
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
              className={`block px-3 py-3 rounded-md text-base font-medium transition-colors duration-200 ${
                router.pathname === item.href
                  ? 'text-custom-button bg-custom-button/10 font-semibold'
                  : 'text-white hover:bg-white/10 hover:text-custom-button'
              }`}
              aria-current={router.pathname === item.href ? 'page' : undefined}
            >
              {item.name}
            </Link>
          ))}
          
          <div className="flex items-center justify-between px-3 py-4 mt-2 border-t border-gray-200">
            <div className="flex space-x-2">
              <button
                onClick={() => changeLanguage('sv')}
                className={`p-2 rounded-md transition-colors duration-200 ${
                  i18n.language === 'sv'
                    ? 'bg-custom-button/10 text-custom-button font-medium'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                aria-label={t('accessibility.switchToSwedish')}
                aria-pressed={i18n.language === 'sv'}
              >
                SV
              </button>
              <button
                onClick={() => changeLanguage('en')}
                className={`p-2 rounded-md transition-colors duration-200 ${
                  i18n.language === 'en'
                    ? 'bg-custom-button/10 text-custom-button font-medium'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                aria-label={t('accessibility.switchToEnglish')}
                aria-pressed={i18n.language === 'en'}
              >
                EN
              </button>
            </div>
            
            <Link
              href="/bestall"
              onClick={() => setIsMenuOpen(false)}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-custom-button hover:bg-custom-button/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-button shadow-sm transition-all duration-200 hover:shadow"
            >
              {t('nav.order')}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
