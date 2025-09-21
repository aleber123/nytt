import React from 'react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ErrorPageProps {
  title?: string;
  subtitle?: string;
  description?: string;
  showTryAgain?: boolean;
  showContactSupport?: boolean;
  showReturnHome?: boolean;
  showTechnicalDetails?: boolean;
  errorDetails?: string;
  customActions?: React.ReactNode;
}

/**
 * A reusable error page component that can be used for various error scenarios
 * with full i18n support for international expansion
 */
const ErrorPage: React.FC<ErrorPageProps> = ({
  title,
  subtitle,
  description,
  showTryAgain = true,
  showContactSupport = true,
  showReturnHome = true,
  showTechnicalDetails = false,
  errorDetails,
  customActions
}) => {
  const { t } = useTranslation('common');
  
  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full bg-white shadow-lg rounded-lg p-8">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full">
          <ExclamationTriangleIcon className="w-8 h-8 text-red-600" aria-hidden="true" />
        </div>
        
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          {title || t('errorBoundary.title')}
        </h1>
        
        {(subtitle || subtitle === '') && (
          <h2 className="text-lg text-center text-gray-600 mb-6">
            {subtitle || t('errorBoundary.subtitle')}
          </h2>
        )}
        
        {(description || description === '') && (
          <p className="text-gray-600 mb-6">
            {description || t('errorBoundary.description')}
          </p>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {showTryAgain && (
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              aria-label={t('accessibility.refreshPageButton')}
            >
              <ArrowPathIcon className="w-5 h-5 mr-2" />
              {t('errorBoundary.tryAgain')}
            </button>
          )}
          
          {showContactSupport && (
            <Link
              href="/kontakt"
              className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              aria-label={t('accessibility.contactSupportLink')}
            >
              {t('errorBoundary.contactSupport')}
            </Link>
          )}
          
          {customActions}
        </div>
        
        {(showTechnicalDetails && errorDetails) && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              {t('errorBoundary.technicalDetails')}
            </h3>
            
            <p className="text-sm text-gray-600 mb-2 font-mono bg-gray-50 p-2 rounded overflow-auto">
              {errorDetails}
            </p>
          </div>
        )}
        
        {showReturnHome && (
          <div className={`${showTechnicalDetails ? '' : 'border-t border-gray-200 pt-6'}`}>
            <Link
              href="/"
              className="text-sm text-primary-600 hover:text-primary-700"
              aria-label={t('accessibility.returnHomeLink')}
            >
              {t('errorBoundary.returnHome')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorPage;
