/**
 * Reusable container for order flow steps
 * Provides consistent layout and navigation
 */

import React from 'react';
import { useTranslation } from 'next-i18next';

interface StepContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onNext?: () => void;
  onBack?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  backLabel?: string;
  showBack?: boolean;
  showNext?: boolean;
  centerTitle?: boolean;
}

export const StepContainer: React.FC<StepContainerProps> = ({
  title,
  subtitle,
  children,
  onNext,
  onBack,
  nextDisabled = false,
  nextLabel,
  backLabel,
  showBack = true,
  showNext = true,
  centerTitle = false
}) => {
  const { t } = useTranslation('common');

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-8">
        {/* Header */}
        <div className="mb-5 sm:mb-6">
          <h2 className={`text-2xl font-bold text-gray-900 mb-2 ${centerTitle ? 'text-center' : ''}`}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-600">{subtitle}</p>
          )}
        </div>

        {/* Content */}
        <div className="mb-6 sm:mb-8">
          {children}
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-3 pt-6 border-t border-gray-200 sm:flex-row sm:justify-between sm:items-center">
          {showBack && onBack ? (
            <button
              onClick={onBack}
              className="w-full px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors break-words sm:w-auto"
            >
              {backLabel || t('orderFlow.backToPrevious', 'Tillbaka')}
            </button>
          ) : (
            <div />
          )}

          {showNext && onNext && (
            <button
              onClick={onNext}
              disabled={nextDisabled}
              className={`w-full px-6 py-2 rounded-md font-medium transition-colors break-words sm:w-auto ${
                nextDisabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-custom-button text-white hover:bg-custom-button-hover'
              }`}
            >
              {nextLabel || t('orderFlow.continueButton', 'Fortsätt →')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepContainer;
