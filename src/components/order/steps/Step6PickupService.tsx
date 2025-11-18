/**
 * Step 6: Pickup Service
 * Allows customer to choose if they want document pickup service
 * Only shown if customer selected "original documents" in Step 5
 */

import React from 'react';
import { useTranslation } from 'next-i18next';
import { StepContainer } from '../shared/StepContainer';
import { StepProps } from '../types';

export const Step6PickupService: React.FC<StepProps> = ({
  answers,
  setAnswers,
  onNext,
  onBack
}) => {
  const { t } = useTranslation('common');

  const handleSelect = (wantsPickup: boolean) => {
    if (wantsPickup) {
      setAnswers({
        ...answers,
        pickupService: true
      });
    } else {
      setAnswers({
        ...answers,
        pickupService: false,
        pickupAddress: { name: '', company: '', street: '', postalCode: '', city: '' }
      });
    }
    onNext();
  };

  return (
    <StepContainer
      title={t('orderFlow.step6.title', 'Vill du ha hämtning?')}
      subtitle={t('orderFlow.step6.subtitle', 'Vi kan hämta dina dokument direkt från din adress')}
      onBack={onBack}
      showNext={false}
    >
      {/* Pricing Info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div>
            <div className="font-medium text-green-900">
              {t('orderFlow.step6.pickupPrice', 'Hämtning: 450 kr')}
            </div>
            <div className="text-sm text-green-700">
              {t('orderFlow.step6.pickupNote', 'Vi hämtar dina dokument säkert och spårbart')}
            </div>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-4">
        {/* No Pickup */}
        <button
          onClick={() => handleSelect(false)}
          className={`w-full p-6 border-2 rounded-lg hover:border-custom-button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button ${
            answers.pickupService === false
              ? 'border-custom-button bg-custom-button-bg'
              : 'border-gray-200'
          }`}
        >
          <div className="flex items-center">
            <div className="text-left">
              <div className="text-lg font-medium text-gray-900">
                {t('orderFlow.step6.noPickup', 'Nej tack, jag skickar själv')}
              </div>
              <div className="text-gray-600">
                {t('orderFlow.step6.noPickupDescription', 'Jag skickar dokumenten via post till er adress')}
              </div>
            </div>
          </div>
        </button>

        {/* Yes Pickup */}
        <button
          onClick={() => handleSelect(true)}
          className={`w-full p-6 border-2 rounded-lg hover:border-custom-button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button ${
            answers.pickupService === true
              ? 'border-custom-button bg-custom-button-bg'
              : 'border-gray-200'
          }`}
        >
          <div className="flex items-center">
            <div className="text-left">
              <div className="text-lg font-medium text-gray-900">
                {t('orderFlow.step6.yesPickup', 'Ja, hämta mina dokument')}
              </div>
              <div className="text-gray-600">
                {t('orderFlow.step6.yesPickupDescription', 'Vi hämtar dokumenten från din adress (450 kr)')}
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <span className="text-2xl mr-3">💡</span>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">
              {t('orderFlow.step6.infoTitle', 'Tips')}
            </h4>
            <p className="text-sm text-blue-800">
              {t('orderFlow.step6.infoText', 'Hämtning är tillgänglig inom Sverige. För hämtning utanför Sverige, kontakta oss för offert.')}
            </p>
          </div>
        </div>
      </div>
    </StepContainer>
  );
};

export default Step6PickupService;
