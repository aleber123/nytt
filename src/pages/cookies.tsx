import React from 'react';
import Head from 'next/head';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';

const CookiesPage: React.FC = () => {
  const { t, i18n } = useTranslation('common');
  const locale = i18n?.language === 'sv' ? 'sv-SE' : 'en-GB';
  const formattedDate = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());

  return (
    <>
      <Head>
        <title>{t('cookiesPage.metaTitle')}</title>
        <meta name="description" content={t('cookiesPage.metaDescription') as string} />
      </Head>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-4">{t('cookiesPage.title')}</h1>
          <p className="text-gray-700 mb-8">{t('cookiesPage.intro')}</p>

          <div className="space-y-8">
            <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-heading font-bold text-gray-900 mb-3">{t('cookiesPage.whatAre.title')}</h2>
              <p className="text-gray-700">{t('cookiesPage.whatAre.text')}</p>
            </section>

            <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-heading font-bold text-gray-900 mb-3">{t('cookiesPage.types.title')}</h2>
              <p className="text-gray-700 mb-3">{t('cookiesPage.types.intro')}</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li><strong>{t('cookiesPage.types.necessaryTitle')}:</strong> {t('cookiesPage.types.necessaryDesc')}</li>
                <li><strong>{t('cookiesPage.types.analyticsTitle')}:</strong> {t('cookiesPage.types.analyticsDesc')}</li>
                <li><strong>{t('cookiesPage.types.functionalTitle')}:</strong> {t('cookiesPage.types.functionalDesc')}</li>
              </ul>
            </section>

            <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-heading font-bold text-gray-900 mb-3">{t('cookiesPage.consent.title')}</h2>
              <p className="text-gray-700 mb-3">{t('cookiesPage.consent.text1')}</p>
              <p className="text-gray-700">{t('cookiesPage.consent.text2')}</p>
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  {t('cookiesPage.manageHint')} <a href="/integritetspolicy" className="underline">{t('cookie.privacyPolicy')}</a>.
                </p>
              </div>
            </section>

            <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-heading font-bold text-gray-900 mb-3">{t('cookiesPage.changes.title')}</h2>
              <p className="text-gray-700">{t('cookiesPage.changes.text')}</p>
            </section>

            <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-heading font-bold text-gray-900 mb-3">{t('cookiesPage.contact.title')}</h2>
              <p className="text-gray-700">{t('cookiesPage.contact.text')} <a className="underline" href="mailto:info@doxvl.se">info@doxvl.se</a>.</p>
            </section>

            <p className="text-xs text-gray-500 mt-6">{t('cookiesPage.lastUpdated', { date: formattedDate })}</p>
          </div>
        </div>
      </div>
    </>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'sv', ['common'])),
    },
  };
};

export default CookiesPage;
