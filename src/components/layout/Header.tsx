import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Bars3Icon, XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
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
    { name: safeT('nav.legalization', 'Legaliseringar'), href: '/bestall' },
    { name: safeT('nav.visa', 'Visum'), href: '/visum/bestall' },
    { name: safeT('nav.about', 'Om oss'), href: '/om-oss' },
    { name: safeT('nav.contact', 'Kontakt'), href: '/kontakt' },
    { name: safeT('nav.orderStatus', 'Orderstatus'), href: '/orderstatus' },
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
    <>
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
            
            <button
              onClick={() => setShowServiceModal(true)}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-custom-button hover:bg-custom-button/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-button shadow-sm transition-all duration-200 hover:shadow"
            >
              {safeT('nav.order', 'Beställ nu')}
            </button>
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
            
            <button
              onClick={() => { setIsMenuOpen(false); setShowServiceModal(true); }}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-custom-button hover:bg-custom-button/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-button shadow-sm transition-all duration-200 hover:shadow"
            >
              {t('nav.order')}
            </button>
          </div>
        </div>
      </div>
    </header>

      {/* Service Selection Modal */}
      {showServiceModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setShowServiceModal(false)}
        >
          {/* Backdrop with blur */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          
          {/* Modal content */}
          <div 
            className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowServiceModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={safeT('accessibility.closeMenu', 'Stäng')}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              {safeT('serviceModal.title', 'Vad vill du beställa?')}
            </h2>
            <p className="text-gray-600 text-center mb-8">
              {safeT('serviceModal.subtitle', 'Välj den tjänst du behöver')}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Legalization option */}
              <Link
                href="/bestall"
                onClick={() => setShowServiceModal(false)}
                className="group flex flex-col items-center p-6 border-2 border-gray-200 rounded-xl hover:border-custom-button hover:bg-custom-button/5 transition-all duration-200"
              >
                <div className="w-16 h-16 bg-custom-button/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-custom-button/20 transition-colors">
                  <svg className="w-8 h-8 text-custom-button" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {safeT('serviceModal.legalization', 'Legalisering')}
                </h3>
                <p className="text-sm text-gray-500 text-center">
                  {safeT('serviceModal.legalizationDesc', 'Apostille, UD, ambassad & notarius')}
                </p>
                <ChevronRightIcon className="w-5 h-5 text-custom-button mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              
              {/* Visa option */}
              <Link
                href="/visum/bestall"
                onClick={() => setShowServiceModal(false)}
                className="group flex flex-col items-center p-6 border-2 border-gray-200 rounded-xl hover:border-custom-button hover:bg-custom-button/5 transition-all duration-200"
              >
                <div className="w-16 h-16 bg-custom-button/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-custom-button/20 transition-colors">
                  <svg className="w-8 h-8 text-custom-button" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {safeT('serviceModal.visa', 'Visum')}
                </h3>
                <p className="text-sm text-gray-500 text-center">
                  {safeT('serviceModal.visaDesc', 'Ansök om visum till alla länder')}
                </p>
                <ChevronRightIcon className="w-5 h-5 text-custom-button mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
