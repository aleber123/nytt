import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Bars3Icon, XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const { t, i18n } = useTranslation('common');
  
  const navigation = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.services'), href: '/tjanster' },
    { name: 'Artiklar', href: '/artiklar' },
    { name: t('nav.about'), href: '/om-oss' },
    { name: t('nav.contact'), href: '/kontakt' },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const changeLanguage = (locale: string) => {
    router.push(router.pathname, router.asPath, { locale });
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/" className="flex items-center" aria-label={t('accessibility.homeLogo')}>
              <img 
                src="/logo.svg" 
                alt="Legaliseringstjänst" 
                className="h-12 w-auto" 
                width="220" 
                height="50"
              />
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <nav className="hidden md:flex space-x-8" aria-label={t('accessibility.mainNav')}>
            {navigation.map((item) => (
              <Link 
                key={item.name}
                href={item.href}
                className={`text-base font-medium px-1 py-2 transition-colors duration-200 ${
                  router.pathname === item.href
                    ? 'text-custom-button border-b-2 border-custom-button font-semibold'
                    : 'text-gray-700 hover:text-custom-button hover:border-b-2 hover:border-custom-button/50'
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
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-custom-button hover:bg-custom-button/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-button shadow-sm transition-all duration-200 hover:shadow"
            >
              {t('nav.order')}
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-custom-button hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-custom-button"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
              onClick={toggleMenu}
            >
              <span className="sr-only">{isMenuOpen ? t('accessibility.closeMenu') : t('accessibility.openMenu')}</span>
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
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200 shadow-inner bg-gray-50">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`block px-3 py-3 rounded-md text-base font-medium transition-colors duration-200 ${
                router.pathname === item.href
                  ? 'text-custom-button bg-custom-button/5 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-custom-button'
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
