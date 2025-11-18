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
      <div className="flex items-center justify-center space-x-4 mb-8">
        {/* Decrease Button */}
        <button
          onClick={handleDecrease}
          disabled={answers.quantity <= MIN_QUANTITY}
          className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-primary-500 hover:bg-primary-50"
        >
          <span className="text-2xl">{t('orderFlow.step4.decrease', '−')}</span>
        </button>

        {/* Quantity Display */}
        <div className="text-center">
          <div className="text-4xl font-bold text-custom-button mb-2">{answers.quantity}</div>
          <div className="text-gray-600">{t('orderFlow.step4.quantityLabel', 'dokument')}</div>
        </div>

        {/* Increase Button */}
        <button
          onClick={handleIncrease}
          disabled={answers.quantity >= MAX_QUANTITY}
          className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-custom-button hover:bg-custom-button-bg"
        >
          <span className="text-2xl">{t('orderFlow.step4.increase', '+')}</span>
        </button>
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
