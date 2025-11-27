import React from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';

const DeliveryTimesPage: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <>
      <Head>
        <title>{t('delivery.metaTitle')}</title>
        <meta name="description" content={t('delivery.metaDescription')} />
      </Head>

      <div className="container mx-auto px-4 pt-12">
        <h1 className="text-3xl font-heading font-bold text-gray-900 text-center mb-6">{t('delivery.title')}</h1>
        <p className="text-lg text-gray-600 text-center mb-8">{t('delivery.subtitle')}</p>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Info notice */}
          <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-6">
            <h2 className="text-lg font-heading font-bold text-yellow-900 mb-2">{t('delivery.noticeTitle')}</h2>
            <p className="text-yellow-900">
              {t('delivery.noticeText1')}
              {t('delivery.noticeText2')}
              <a href="mailto:info@doxvl.se" className="underline"> info@doxvl.se</a>
              {" "}
              {t('common.or')}
              {" "}
              <a href="tel:081234567" className="underline">08‑123 45 67</a>.
            </p>
          </div>

          {/* Handläggningstider */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-heading font-bold text-gray-900 mb-4">{t('delivery.processingTitle')}</h2>
            <p className="text-gray-700 mb-3">{t('delivery.processingP1')}</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>{t('delivery.processingBullets.0')}</li>
              <li>{t('delivery.processingBullets.1')}</li>
              <li>{t('delivery.processingBullets.2')}</li>
              <li>{t('delivery.processingBullets.3')}</li>
            </ul>
            <p className="text-gray-700 mt-3">{t('delivery.processingP2')}</p>
          </div>

          {/* Leveranssätt */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-heading font-bold text-gray-900 mb-4">{t('delivery.methodsTitle')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('delivery.methods.postnord.title')}</h3>
                <p className="text-gray-700 text-sm">{t('delivery.methods.postnord.desc')}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('delivery.methods.dhl.title')}</h3>
                <p className="text-gray-700 text-sm">{t('delivery.methods.dhl.desc')}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('delivery.methods.local.title')}</h3>
                <p className="text-gray-700 text-sm">{t('delivery.methods.local.desc')}</p>
              </div>
            </div>
          </div>

          {/* Spårning & avisering */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-heading font-bold text-gray-900 mb-4">{t('delivery.trackingTitle')}</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>{t('delivery.tracking.items.0')}</li>
              <li>{t('delivery.tracking.items.1')}</li>
              <li>{t('delivery.tracking.items.2')}</li>
            </ul>
          </div>

          {/* Kontakt */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-heading font-bold text-gray-900 mb-3">{t('delivery.contactTitle')}</h2>
            <p className="text-gray-700 mb-4">{t('delivery.contactP')}</p>
            <a href="/kontakt" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-custom-button hover:bg-custom-button/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-button">{t('delivery.contactCta')}</a>
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

export default DeliveryTimesPage;
