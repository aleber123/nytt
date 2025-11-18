/**
 * Step 5: Document Source
 * Allows customer to choose between sending original documents or uploading digital copies
 */

import React from 'react';
import { useTranslation } from 'next-i18next';
import { StepContainer } from '../shared/StepContainer';
import { StepProps } from '../types';

export const Step5DocumentSource: React.FC<StepProps> = ({
  answers,
  setAnswers,
  onNext,
  onBack
}) => {
  const { t } = useTranslation('common');

  const handleSelect = (source: string) => {
    if (source === 'original') {
      setAnswers({ ...answers, documentSource: 'original', uploadedFiles: [] });
    } else {
      setAnswers({
        ...answers,
        documentSource: 'upload',
        uploadedFiles: new Array(answers.quantity).fill(null)
      });
    }
    onNext();
  };

  return (
    <StepContainer
      title={t('orderFlow.step5.title', 'Hur skickar du dokumenten?')}
      subtitle={t('orderFlow.step5.subtitle', 'Välj hur du vill skicka dina dokument till oss')}
      onBack={onBack}
      showNext={false}
    >
      {/* Quantity Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <span className="text-2xl mr-3">📄</span>
          <div>
            <div className="font-medium text-blue-900">
              {t('orderFlow.step5.selectedQuantity', { quantity: answers.quantity })}
            </div>
            <div className="text-sm text-blue-700">
              {t('orderFlow.step5.quantityNote', 'Du har valt att legalisera {{quantity}} dokument', { quantity: answers.quantity })}
            </div>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-4">
        {/* Original Documents */}
        <button
          onClick={() => handleSelect('original')}
          className={`w-full p-6 border-2 rounded-lg hover:border-custom-button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-custom-button text-left ${
            answers.documentSource === 'original'
              ? 'border-custom-button bg-custom-button-light'
              : 'border-gray-200'
          }`}
        >
          <div className="flex items-start">
            <span className="text-3xl mr-4">📮</span>
            <div className="flex-1">
              <div className="text-lg font-medium text-gray-900 mb-2">
                {t('orderFlow.step5.originalDocuments', 'Skicka originaldokument')}
              </div>
              <div className="text-gray-600 text-sm">
                {t('orderFlow.step5.originalDescription', 'Du skickar fysiska originaldokument till oss via post eller hämtning')}
              </div>
              <div className="mt-3 flex items-start space-x-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm text-gray-700">Rekommenderas för officiella dokument</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm text-gray-700">Vi kan erbjuda hämtning (tillval)</span>
              </div>
            </div>
          </div>
        </button>

        {/* Upload Documents */}
        <button
          onClick={() => handleSelect('upload')}
          className={`w-full p-6 border-2 rounded-lg hover:border-custom-button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-custom-button text-left ${
            answers.documentSource === 'upload'
              ? 'border-custom-button bg-custom-button-light'
              : 'border-gray-200'
          }`}
        >
          <div className="flex items-start">
            <span className="text-3xl mr-4">☁️</span>
            <div className="flex-1">
              <div className="text-lg font-medium text-gray-900 mb-2">
                {t('orderFlow.step5.uploadDocuments', 'Ladda upp dokument')}
              </div>
              <div className="text-gray-600 text-sm">
                {t('orderFlow.step5.uploadDescription', 'Ladda upp digitala kopior av dina dokument (PDF, JPG, PNG)')}
              </div>
              <div className="mt-3 flex items-start space-x-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm text-gray-700">Snabbare start på processen</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm text-gray-700">Ingen fysisk försändelse behövs</span>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start">
          <span className="text-2xl mr-3">💡</span>
          <div>
            <h4 className="font-medium text-amber-900 mb-1">
              {t('orderFlow.step5.infoTitle', 'Viktigt att veta')}
            </h4>
            <p className="text-sm text-amber-800">
              {t('orderFlow.step5.infoText', 'För vissa länder och dokumenttyper kan originaldokument krävas. Vi kontaktar dig om detta gäller din beställning.')}
            </p>
          </div>
        </div>
      </div>
    </StepContainer>
  );
};

export default Step5DocumentSource;
