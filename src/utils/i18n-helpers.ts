import { GetStaticPropsContext, GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

/**
 * Helper function to get translations for static pages
 * Makes it easy to add more languages and namespaces in the future
 * 
 * @param context GetStaticPropsContext or GetServerSidePropsContext
 * @param namespaces Array of translation namespaces to load
 * @param extraProps Additional props to include
 * @returns Props object with translations
 */
export const getI18nProps = async (
  context: GetStaticPropsContext | GetServerSidePropsContext,
  namespaces: string[] = ['common'],
  extraProps = {}
) => {
  const locale = context.locale || context.defaultLocale || 'sv';
  
  const translations = await serverSideTranslations(locale, namespaces);
  
  return {
    ...translations,
    ...extraProps,
    locale,
  };
};

/**
 * Get all supported locales from the i18n configuration
 * This makes it easy to add more languages in the future
 * 
 * @returns Array of supported locale codes
 */
export const getSupportedLocales = (): string[] => {
  // Import the next-i18next config to get the supported locales
  // This way we only need to update the locales in one place
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { i18n } = require('../../next-i18next.config');
    return i18n.locales || ['sv', 'en'];
  } catch (error) {
    console.error('Error loading i18n config:', error);
    return ['sv', 'en']; // Fallback to default locales
  }
};

/**
 * Format a date according to the locale
 * 
 * @param date Date to format
 * @param locale Locale code
 * @param options DateTimeFormatOptions
 * @returns Formatted date string
 */
export const formatLocalizedDate = (
  date: Date,
  locale = 'sv',
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
): string => {
  return new Intl.DateTimeFormat(locale, options).format(date);
};

/**
 * Format a number according to the locale
 * 
 * @param number Number to format
 * @param locale Locale code
 * @param options NumberFormatOptions
 * @returns Formatted number string
 */
export const formatLocalizedNumber = (
  number: number,
  locale = 'sv',
  options: Intl.NumberFormatOptions = { 
    style: 'currency', 
    currency: 'SEK' 
  }
): string => {
  return new Intl.NumberFormat(locale, options).format(number);
};
