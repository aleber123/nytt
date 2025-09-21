import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations directly
import svCommon from './locales/sv/common.json';
import enCommon from './locales/en/common.json';

// Don't want to use this?
// have a look at the Quick start guide
// for passing in lng and translations on init

i18n
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languagedetector
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    fallbackLng: 'sv',
    defaultNS: 'common',
    ns: ['common'],
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    resources: {
      sv: {
        common: svCommon,
      },
      en: {
        common: enCommon,
      },
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
