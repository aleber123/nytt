const path = require('path');

module.exports = {
  i18n: {
    defaultLocale: 'sv',
    locales: ['sv', 'en'],
    // Future languages can be easily added here:
    // locales: ['sv', 'en', 'de', 'fr', 'es', 'ar', 'zh', 'ru'],
    localeDetection: false,
  },
  localePath: path.resolve('./public/locales'),
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};
