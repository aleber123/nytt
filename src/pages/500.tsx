import React from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticProps } from 'next';
import { ErrorPage } from '@/components/error';
import Head from 'next/head';

const ServerErrorPage = () => {
  const { t } = useTranslation('common');
  
  return (
    <>
      <Head>
        <title>{t('errorBoundary.serverErrorTitle')}</title>
      </Head>
      <ErrorPage 
        title={t('errorBoundary.serverErrorTitle')}
        subtitle={t('errorBoundary.serverErrorSubtitle')}
        description={t('errorBoundary.serverErrorDescription')}
        showTechnicalDetails={false}
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

export default ServerErrorPage;
