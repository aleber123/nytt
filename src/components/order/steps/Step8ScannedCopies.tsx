/**
 * Step 8: Scanned Copies
 * Allows customer to choose if they want scanned copies of their legalized documents
 */

import React from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { StepContainer } from '../shared/StepContainer';
import { StepProps } from '../types';

export const Step8ScannedCopies: React.FC<StepProps> = ({
  answers,
  setAnswers,
  onNext,
  onBack
}) => {
  const { t, i18n } = useTranslation('common');
  const router = useRouter();
  const isEn = i18n.language === 'en' || router.locale === 'en';

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
      title={isEn ? 'Would you like scanned copies?' : 'Vill du ha skannade kopior?'}
      subtitle={isEn ? 'We can scan your legalized documents and send digital copies to you' : 'Vi kan skanna dina legaliserade dokument och skicka dem digitalt'}
      onBack={onBack}
      showNext={false}
    >
      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <span className="text-2xl mr-3">📄</span>
          <div>
            <div className="font-medium text-blue-900">
              {isEn ? `You have selected: ${answers.quantity} document${answers.quantity > 1 ? 's' : ''}` : `Du har valt: ${answers.quantity} dokument`}
            </div>
            <div className="text-sm text-blue-700">
              {isEn ? `Scanned copies cost ${scannedCopiesPrice} kr (200 kr per document)` : `Skannade kopior: ${scannedCopiesPrice} kr (200 kr per dokument)`}
            </div>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-4">
        {/* Yes Copies */}
        <button
          onClick={() => handleSelect(true)}
          className={`w-full p-4 sm:p-6 border-2 rounded-lg hover:border-custom-button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button ${
            answers.scannedCopies === true
              ? 'border-custom-button bg-custom-button-bg'
              : 'border-gray-200'
          }`}
        >
          <div className="flex items-center">
            <div className="text-left">
              <div className="text-lg font-medium text-gray-900">
                {isEn ? 'Yes please' : 'Ja tack'}
              </div>
              <div className="text-gray-600">
                {isEn ? `Add scanned copies (+${scannedCopiesPrice} kr)` : `Lägg till skannade kopior (+${scannedCopiesPrice} kr)`}
              </div>
            </div>
          </div>
        </button>

        {/* No Copies */}
        <button
          onClick={() => handleSelect(false)}
          className={`w-full p-4 sm:p-6 border-2 rounded-lg hover:border-custom-button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button ${
            answers.scannedCopies === false
              ? 'border-custom-button bg-custom-button-bg'
              : 'border-gray-200'
          }`}
        >
          <div className="flex items-center">
            <div className="text-left">
              <div className="text-lg font-medium text-gray-900">
                {isEn ? 'No thanks' : 'Nej tack'}
              </div>
              <div className="text-gray-600">
                {isEn ? "I don't need scanned copies" : 'Jag behöver inte skannade kopior'}
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
              {isEn ? 'Why choose scanned copies?' : 'Varför välja skannade kopior?'}
            </h4>
            <p className="text-sm text-amber-800">
              {isEn 
                ? 'Scanned copies are perfect if you need to send documents via email or upload them digitally. You get both the physical originals and digital copies.'
                : 'Skannade kopior är perfekta om du behöver skicka dokumenten via e-post eller ladda upp dem digitalt. Du får både fysiska originalen och digitala kopior.'}
            </p>
          </div>
        </div>
      </div>
    </StepContainer>
  );
};

export default Step8ScannedCopies;
