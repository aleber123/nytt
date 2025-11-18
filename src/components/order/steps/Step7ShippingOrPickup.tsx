/**
 * Step 7: Shipping Instructions OR Pickup Address
 * Shows different UI based on customer's choice:
 * - Shipping instructions if customer chose to send documents themselves
 * - Pickup address form if customer selected pickup service
 * - Skips entirely if documents are uploaded
 */

import React from 'react';
import { useTranslation } from 'next-i18next';
import { StepProps } from '../types';

interface Step7Props extends Omit<StepProps, 'currentLocale'> {
  onSkip: () => void; // Called when step should be skipped
  currentLocale?: string; // Optional since not used in this step
}

export const Step7ShippingOrPickup: React.FC<Step7Props> = ({
  answers,
  setAnswers,
  onNext,
  onBack,
  onSkip
}) => {
  const { t } = useTranslation('common');

  // Skip logic
  React.useEffect(() => {
    // For uploaded documents, skip this step entirely
    if (answers.documentSource === 'upload') {
      onSkip();
      return;
    }

    // If no pickup service and not original documents, skip
    if (!answers.pickupService && answers.documentSource !== 'original') {
      onSkip();
      return;
    }
  }, [answers.documentSource, answers.pickupService, onSkip]);

  // Show shipping instructions if customer chose to send documents themselves
  if (!answers.pickupService && answers.documentSource === 'original') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t('orderFlow.step7.title')}
          </h1>
          <p className="text-lg text-gray-600">
            {t('orderFlow.step7.subtitle')}
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                {t('orderFlow.step7.shippingAddressTitle')}
              </h3>
              <div className="bg-white border border-red-200 rounded-lg p-4 mb-3" id="shipping-address">
                <div className="font-medium text-gray-900 mb-1">{t('orderFlow.step7.companyName')}</div>
                <div className="text-gray-700">{t('orderFlow.step7.attention')}</div>
                <div className="text-gray-700">{t('orderFlow.step7.street')}</div>
                <div className="text-gray-700">{t('orderFlow.step7.postalCode')} {t('orderFlow.step7.city')}</div>
                <div className="text-gray-700">{t('orderFlow.step7.country')}</div>
              </div>
            </div>
            <div className="ml-4">
              <button
                onClick={() => {
                  const printWindow = window.open('', '_blank', 'width=600,height=400');
                  if (printWindow) {
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>LegaliseringsTjänst AB - Leveransadress</title>
                          <style>
                            body {
                              font-family: Arial, sans-serif;
                              margin: 40px;
                              text-align: center;
                            }
                            .address {
                              border: 2px solid #dc2626;
                              padding: 20px;
                              border-radius: 8px;
                              background: #fef2f2;
                              display: inline-block;
                              margin: 20px 0;
                            }
                            .company {
                              font-weight: bold;
                              font-size: 18px;
                              color: #1f2937;
                              margin-bottom: 8px;
                            }
                            .address-line {
                              color: #374151;
                              margin: 4px 0;
                            }
                            @media print {
                              body { margin: 20px; }
                            }
                          </style>
                        </head>
                        <body>
                          <h2>${t('orderFlow.step7.shippingAddressTitle')}</h2>
                          <div class="address">
                            <div class="company">${t('orderFlow.step7.companyName')}</div>
                            <div class="address-line">${t('orderFlow.step7.attention')}</div>
                            <div class="address-line">${t('orderFlow.step7.street')}</div>
                            <div class="address-line">${t('orderFlow.step7.postalCode')} ${t('orderFlow.step7.city')}</div>
                            <div class="address-line">${t('orderFlow.step7.country')}</div>
                          </div>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                    printWindow.focus();
                    setTimeout(() => {
                      printWindow.print();
                      printWindow.close();
                    }, 250);
                  }
                }}
                className="flex items-center justify-center w-12 h-12 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors duration-200"
                title={t('orderFlow.step7.printAddress')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          <button
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            {t('orderFlow.backToPrevious')}
          </button>
          <button
            onClick={onNext}
            className="px-6 py-2 bg-custom-button text-white rounded-md hover:bg-custom-button-hover"
          >
            {t('orderFlow.nextButton')}
          </button>
        </div>
      </div>
    );
  }

  // Show pickup address form if pickup service is selected
  if (answers.pickupService) {
    const isFormValid = answers.pickupAddress.name && 
                       answers.pickupAddress.street && 
                       answers.pickupAddress.postalCode && 
                       answers.pickupAddress.city;

    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t('orderFlow.pickupAddress.title')}
          </h1>
          <p className="text-lg text-gray-600">
            {t('orderFlow.pickupAddress.subtitle')}
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🚚</span>
            <div>
              <div className="font-medium text-blue-900">
                {t('orderFlow.pickupAddress.pickupOrdered')}
              </div>
              <div className="text-sm text-blue-700">
                {t('orderFlow.pickupAddress.pickupContact')}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('orderFlow.pickupAddress.name')} {t('orderFlow.pickupAddress.requiredField')}
            </label>
            <input
              type="text"
              value={answers.pickupAddress.name}
              onChange={(e) => setAnswers(prev => ({
                ...prev,
                pickupAddress: { ...prev.pickupAddress, name: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button"
              placeholder={t('orderFlow.pickupAddress.namePlaceholder')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('orderFlow.pickupAddress.company')}
            </label>
            <input
              type="text"
              value={answers.pickupAddress.company}
              onChange={(e) => setAnswers(prev => ({
                ...prev,
                pickupAddress: { ...prev.pickupAddress, company: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button"
              placeholder={t('orderFlow.pickupAddress.companyPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('orderFlow.pickupAddress.street')} {t('orderFlow.pickupAddress.requiredField')}
            </label>
            <input
              type="text"
              value={answers.pickupAddress.street}
              onChange={(e) => setAnswers(prev => ({
                ...prev,
                pickupAddress: { ...prev.pickupAddress, street: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button"
              placeholder={t('orderFlow.pickupAddress.streetPlaceholder')}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('orderFlow.pickupAddress.postalCode')} {t('orderFlow.pickupAddress.requiredField')}
              </label>
              <input
                type="text"
                value={answers.pickupAddress.postalCode}
                onChange={(e) => setAnswers(prev => ({
                  ...prev,
                  pickupAddress: { ...prev.pickupAddress, postalCode: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button"
                placeholder={t('orderFlow.pickupAddress.postalCodePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('orderFlow.pickupAddress.city')} {t('orderFlow.pickupAddress.requiredField')}
              </label>
              <input
                type="text"
                value={answers.pickupAddress.city}
                onChange={(e) => setAnswers(prev => ({
                  ...prev,
                  pickupAddress: { ...prev.pickupAddress, city: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button"
                placeholder={t('orderFlow.pickupAddress.cityPlaceholder')}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          <button
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            {t('orderFlow.backToPrevious')}
          </button>
          <button
            onClick={onNext}
            disabled={!isFormValid}
            className={`px-6 py-2 rounded-md font-medium ${
              isFormValid
                ? 'bg-custom-button text-white hover:bg-custom-button-hover'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {t('orderFlow.nextButton')}
          </button>
        </div>
      </div>
    );
  }

  // Fallback - should not reach here due to useEffect
  return null;
};

export default Step7ShippingOrPickup;
