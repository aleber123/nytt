import React from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetServerSideProps } from 'next';
import { ErrorPage } from '@/components/error';
import Head from 'next/head';

interface ErrorProps {
  statusCode?: number;
  title?: string;
}

const ErrorPageWrapper: React.FC<ErrorProps> = ({ statusCode, title }) => {
  const { t } = useTranslation('common');

  // Determine error type based on status code
  const getErrorContent = () => {
    if (statusCode === 404) {
      return {
        title: t('errorBoundary.notFoundTitle'),
        subtitle: t('errorBoundary.notFoundSubtitle'),
        description: t('errorBoundary.notFoundDescription'),
        showTryAgain: false,
        showTechnicalDetails: false
      };
    } else if (statusCode === 500) {
      return {
        title: t('errorBoundary.serverErrorTitle'),
        subtitle: t('errorBoundary.serverErrorSubtitle'),
        description: t('errorBoundary.serverErrorDescription'),
        showTryAgain: true,
        showTechnicalDetails: false
      };
    } else {
      return {
        title: title || t('errorBoundary.title'),
        subtitle: t('errorBoundary.subtitle'),
        description: t('errorBoundary.description'),
        showTryAgain: true,
        showTechnicalDetails: process.env.NODE_ENV === 'development'
      };
    }
  };

  const errorContent = getErrorContent();

  return (
    <>
      <Head>
        <title>{errorContent.title}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <ErrorPage
        title={errorContent.title}
        subtitle={errorContent.subtitle}
        description={errorContent.description}
        showTryAgain={errorContent.showTryAgain}
        showTechnicalDetails={errorContent.showTechnicalDetails}
        errorDetails={statusCode ? `Status Code: ${statusCode}` : undefined}
      />
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale, res }) => {
  const statusCode = res?.statusCode || 500;

  return {
    props: {
      statusCode,
      ...(await serverSideTranslations(locale || 'sv', ['common'])),
    },
  };
};

export default ErrorPageWrapper;