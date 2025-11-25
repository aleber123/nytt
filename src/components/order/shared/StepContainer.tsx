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
  showNext = true
}) => {
  const { t } = useTranslation('common');

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          {subtitle && (
            <p className="text-gray-600">{subtitle}</p>
          )}
        </div>

        {/* Content */}
        <div className="mb-8">
          {children}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          {showBack && onBack ? (
            <button
              onClick={onBack}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
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
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
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
