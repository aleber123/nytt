import React from 'react';
import { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';

const TermsAndConditionsPage: React.FC = () => {
  const { t, i18n } = useTranslation('common');
  const locale = i18n?.language === 'sv' ? 'sv-SE' : 'en-GB';
  const formattedDate = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());

  return (
    <>
      <Head>
        <title>{t('termsPage.metaTitle')}</title>
        <meta name="description" content={t('termsPage.metaDescription') as string} />
      </Head>

      

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-gray-700">
              <div className="mb-6 p-4 border border-yellow-300 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-900">{t('termsPage.legalNotice')}</p>
              </div>
              <p className="text-gray-600 mb-6"><em>{t('termsPage.lastUpdated', { date: formattedDate })}</em></p>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">1. {t('termsPage.sections.general.title')}</h2>
              <p className="text-gray-700 mb-6">{t('termsPage.sections.general.text')}</p>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">2. {t('termsPage.sections.services.title')}</h2>
              <p className="text-gray-700 mb-6">{t('termsPage.sections.services.text')}</p>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">3. {t('termsPage.sections.customer.title')}</h2>
              <p className="text-gray-700 mb-4">{t('termsPage.sections.customer.intro')}</p>
              <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                <li>{t('termsPage.sections.customer.items.0')}</li>
                <li>{t('termsPage.sections.customer.items.1')}</li>
                <li>{t('termsPage.sections.customer.items.2')}</li>
                <li>{t('termsPage.sections.customer.items.3')}</li>
              </ul>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">4. {t('termsPage.sections.liability.title')}</h2>
              <p className="text-gray-700 mb-4">{t('termsPage.sections.liability.intro')}</p>
              <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                <li>{t('termsPage.sections.liability.items.0')}</li>
                <li>{t('termsPage.sections.liability.items.1')}</li>
                <li>{t('termsPage.sections.liability.items.2')}</li>
              </ul>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">5. {t('termsPage.sections.pricing.title')}</h2>
              <p className="text-gray-700 mb-6">{t('termsPage.sections.pricing.text')}</p>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">6. {t('termsPage.sections.cancellation.title')}</h2>
              <p className="text-gray-700 mb-6">{t('termsPage.sections.cancellation.text')}</p>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">7. {t('termsPage.sections.forceMajeure.title')}</h2>
              <p className="text-gray-700 mb-6">{t('termsPage.sections.forceMajeure.text')}</p>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">8. {t('termsPage.sections.law.title')}</h2>
              <p className="text-gray-700 mb-6">{t('termsPage.sections.law.text')}</p>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">9. {t('termsPage.sections.changes.title')}</h2>
              <p className="text-gray-700 mb-6">{t('termsPage.sections.changes.text')}</p>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">10. {t('termsPage.sections.contact.title')}</h2>
              <p className="text-gray-700 mb-6">{t('termsPage.sections.contact.text')}</p>
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-gray-700">
                  <strong>{t('termsPage.company.name')}</strong><br />
                  {t('termsPage.company.addressLine1')}<br />
                  {t('termsPage.company.addressLine2')}<br />
                  {t('termsPage.company.country')}<br />
                  <br />
                  {t('termsPage.company.email')}<br />
                  {t('termsPage.company.phone')}
                </p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <Link
                href="/kontakt"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {t('termsPage.backToContact')}
              </Link>
            </div>
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

export default TermsAndConditionsPage;