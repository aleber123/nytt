/**
 * Step 4: Quantity Selection
 * Allows customer to select how many documents they want to legalize
 */

import React from 'react';
import { useTranslation } from 'next-i18next';
import { StepContainer } from '../shared/StepContainer';
import { StepProps } from '../types';

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 10;

export const Step4Quantity: React.FC<StepProps> = ({
  answers,
  setAnswers,
  onNext,
  onBack
}) => {
  const { t } = useTranslation('common');

  const handleDecrease = () => {
    setAnswers({
      ...answers,
      quantity: Math.max(MIN_QUANTITY, answers.quantity - 1)
    });
  };

  const handleIncrease = () => {
    setAnswers({
      ...answers,
      quantity: Math.min(MAX_QUANTITY, answers.quantity + 1)
    });
  };

  const handleInputChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= MIN_QUANTITY && num <= MAX_QUANTITY) {
      setAnswers({
        ...answers,
        quantity: num
      });
    }
  };

  return (
    <StepContainer
      title={t('orderFlow.step4.title', 'Hur många dokument?')}
      subtitle={t('orderFlow.step4.subtitle', 'Ange antal dokument som ska legaliseras')}
      onNext={onNext}
      onBack={onBack}
      nextDisabled={false}
    >
      {/* Quantity Selector */}
      <div className="flex items-center justify-center space-x-6 mb-8">
        {/* Decrease Button */}
        <button
          onClick={handleDecrease}
          disabled={answers.quantity <= MIN_QUANTITY}
          className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all ${
            answers.quantity <= MIN_QUANTITY
              ? 'border-gray-200 text-gray-300 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 hover:border-custom-button hover:bg-custom-button-light'
          }`}
          aria-label="Decrease quantity"
        >
          <span className="text-3xl">−</span>
        </button>

        {/* Quantity Display */}
        <div className="text-center">
          <input
            type="number"
            min={MIN_QUANTITY}
            max={MAX_QUANTITY}
            value={answers.quantity}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-24 text-5xl font-bold text-custom-button text-center border-0 focus:outline-none focus:ring-0"
          />
          <div className="text-gray-600 mt-2">
            {t('orderFlow.step4.quantityLabel', 'dokument')}
          </div>
        </div>

        {/* Increase Button */}
        <button
          onClick={handleIncrease}
          disabled={answers.quantity >= MAX_QUANTITY}
          className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all ${
            answers.quantity >= MAX_QUANTITY
              ? 'border-gray-200 text-gray-300 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 hover:border-custom-button hover:bg-custom-button-light'
          }`}
          aria-label="Increase quantity"
        >
          <span className="text-3xl">+</span>
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <span className="text-2xl mr-3">💡</span>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">
              {t('orderFlow.step4.infoTitle', 'Tips')}
            </h4>
            <p className="text-sm text-blue-800">
              {t('orderFlow.step4.infoText', 'Du kan legalisera upp till 10 dokument i samma beställning. Varje dokument behandlas individuellt.')}
            </p>
          </div>
        </div>
      </div>

      {/* Quantity Limits Info */}
      {answers.quantity >= MAX_QUANTITY && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <h4 className="font-medium text-amber-900 mb-1">
                Maximum antal nått
              </h4>
              <p className="text-sm text-amber-800">
                För beställningar över 10 dokument, vänligen kontakta oss direkt för en skräddarsydd offert.
              </p>
            </div>
          </div>
        </div>
      )}
    </StepContainer>
  );
};

export default Step4Quantity;
