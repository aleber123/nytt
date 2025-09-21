import React from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticProps } from 'next';
import { ErrorPage } from '@/components/error';
import Head from 'next/head';

const NotFoundPage = () => {
  const { t } = useTranslation('common');
  
  return (
    <>
      <Head>
        <title>{t('errorBoundary.notFoundTitle')}</title>
      </Head>
      <ErrorPage 
        title={t('errorBoundary.notFoundTitle')}
        subtitle={t('errorBoundary.notFoundSubtitle')}
        description={t('errorBoundary.notFoundDescription')}
        showTechnicalDetails={false}
        showTryAgain={false}
      />
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

export default NotFoundPage;
