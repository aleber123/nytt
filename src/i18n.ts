import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Check if we're on the server or client
const isServer = typeof window === 'undefined';

// Don't import translations directly to avoid including them in the client bundle
// They will be loaded dynamically

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'sv',
    defaultNS: 'common',
    ns: ['common'],
    debug: false,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      nsMode: 'default'
    },
    detection: {
      order: ['path', 'navigator'],
      caches: ['cookie'],
    }
  });

// Only load translations on the client side
if (!isServer) {
  // Using dynamic imports to avoid including translations in the server bundle
  Promise.all([
    import('../public/locales/sv/common.json'),
    import('../public/locales/en/common.json')
  ]).then(([svCommon, enCommon]) => {
    i18n.addResourceBundle('sv', 'common', svCommon);
    i18n.addResourceBundle('en', 'common', enCommon);    
  }).catch(error => {
    console.error('Failed to load translation files:', error);
  });
}

export default i18n;
