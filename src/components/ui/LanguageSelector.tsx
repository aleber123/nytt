import React from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

interface Language {
  code: string;
  name: string;
  flag: string;
}

interface LanguageSelectorProps {
  className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className = '' }) => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { pathname, asPath, query } = router;
  
  // Define available languages - easy to add more languages for international expansion
  const languages: Language[] = [
    { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    // Add more languages here as needed for international expansion
    // Example: { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    // Example: { code: 'fr', name: 'Français', flag: '🇫🇷' },
    // Example: { code: 'es', name: 'Español', flag: '🇪🇸' },
  ];
  
  const currentLanguage = languages.find(lang => lang.code === router.locale) || languages[0];
  
  return (
    <div className={`relative ${className}`}>
      <div className="group">
        <button
          className="flex items-center space-x-1 text-sm text-gray-700 hover:text-primary-600 transition-colors"
          aria-expanded="false"
          aria-haspopup="true"
        >
          <GlobeAltIcon className="h-5 w-5" aria-hidden="true" />
          <span>{currentLanguage.flag}</span>
          <span className="hidden md:inline">{currentLanguage.name}</span>
        </button>
        
        <div className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="language-menu-button">
            {languages.map((language) => (
              <Link
                key={language.code}
                href={{ pathname, query }}
                as={asPath}
                locale={language.code}
                className={`flex items-center px-4 py-2 text-sm ${
                  router.locale === language.code
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                role="menuitem"
                aria-label={
                  language.code === 'sv'
                    ? t('accessibility.switchToSwedish')
                    : language.code === 'en'
                    ? t('accessibility.switchToEnglish')
                    : `Switch to ${language.name}`
                }
              >
                <span className="mr-2">{language.flag}</span>
                <span>{language.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;
