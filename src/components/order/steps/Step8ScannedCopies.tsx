/**
 * Step 8: Scanned Copies
 * Allows customer to choose if they want scanned copies of their legalized documents
 */

import React from 'react';
import { useTranslation } from 'next-i18next';
import { StepContainer } from '../shared/StepContainer';
import { StepProps } from '../types';

export const Step8ScannedCopies: React.FC<StepProps> = ({
  answers,
  setAnswers,
  onNext,
  onBack
}) => {
  const { t } = useTranslation('common');

  const handleSelect = (wantsCopies: boolean) => {
    setAnswers({
      ...answers,
      scannedCopies: wantsCopies
    });
    onNext();
  };

  const scannedCopiesPrice = 200 * answers.quantity;

  return (
    <StepContainer
      title={t('orderFlow.step8.title', 'Vill du ha skannade kopior?')}
      subtitle={t('orderFlow.step8.subtitle', 'Vi kan skanna dina legaliserade dokument och skicka dem digitalt')}
      onBack={onBack}
      showNext={false}
    >
      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <span className="text-2xl mr-3">📄</span>
          <div>
            <div className="font-medium text-blue-900">
              {t('orderFlow.step8.selectedQuantity', { quantity: answers.quantity })}
            </div>
            <div className="text-sm text-blue-700">
              {t('orderFlow.step8.scannedCopiesPrice', `Skannade kopior: ${scannedCopiesPrice} kr (${200} kr per dokument)`)}
            </div>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-4">
        {/* No Copies */}
        <button
          onClick={() => handleSelect(false)}
          className={`w-full p-6 border-2 rounded-lg hover:border-custom-button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-custom-button text-left ${
            answers.scannedCopies === false
              ? 'border-custom-button bg-custom-button-light'
              : 'border-gray-200'
          }`}
        >
          <div className="flex items-start">
            <span className="text-3xl mr-4">📋</span>
            <div className="flex-1">
              <div className="text-lg font-medium text-gray-900 mb-2">
                {t('orderFlow.step8.noCopies', 'Nej tack')}
              </div>
              <div className="text-gray-600 text-sm">
                {t('orderFlow.step8.noCopiesDescription', 'Jag behöver bara de fysiska dokumenten')}
              </div>
              <div className="mt-3 flex items-start space-x-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm text-gray-700">Ingen extra kostnad</span>
              </div>
            </div>
          </div>
        </button>

        {/* Yes Copies */}
        <button
          onClick={() => handleSelect(true)}
          className={`w-full p-6 border-2 rounded-lg hover:border-custom-button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-custom-button text-left ${
            answers.scannedCopies === true
              ? 'border-custom-button bg-custom-button-light'
              : 'border-gray-200'
          }`}
        >
          <div className="flex items-start">
            <span className="text-3xl mr-4">📧</span>
            <div className="flex-1">
              <div className="text-lg font-medium text-gray-900 mb-2">
                {t('orderFlow.step8.yesCopies', 'Ja tack, skicka digitala kopior')}
              </div>
              <div className="text-gray-600 text-sm">
                {t('orderFlow.step8.yesCopiesDescription', 'Få högkvalitativa skanningar via e-post')}
              </div>
              <div className="mt-3 flex items-start space-x-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm text-gray-700">Snabb digital leverans</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm text-gray-700">Högkvalitativa PDF-filer</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm text-gray-700">Perfekt för e-postverifiering</span>
              </div>
              <div className="flex items-start space-x-2 mt-2">
                <span className="text-custom-button">+</span>
                <span className="text-sm font-medium text-custom-button">
                  {scannedCopiesPrice} kr ({answers.quantity} × 200 kr)
                </span>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start">
          <span className="text-2xl mr-3">💡</span>
          <div>
            <h4 className="font-medium text-amber-900 mb-1">
              {t('orderFlow.step8.helpTitle', 'Varför välja skannade kopior?')}
            </h4>
            <p className="text-sm text-amber-800">
              {t('orderFlow.step8.helpText', 'Skannade kopior är perfekta om du behöver skicka dokumenten via e-post eller ladda upp dem digitalt. Du får både fysiska originalen och digitala kopior.')}
            </p>
          </div>
        </div>
      </div>
    </StepContainer>
  );
};

export default Step8ScannedCopies;
