/**
 * Step 2: Document Type Selection
 * Allows customer to select the type of document to be legalized
 */

import React from 'react';
import { useTranslation } from 'next-i18next';
import { StepContainer } from '../shared/StepContainer';
import { StepProps } from '../types';

const DOCUMENT_TYPES = [
  { id: 'birthCertificate', icon: '👶' },
  { id: 'marriageCertificate', icon: '💍' },
  { id: 'diploma', icon: '🎓' },
  { id: 'commercial', icon: '📄' },
  { id: 'powerOfAttorney', icon: '✍️' },
  { id: 'other', icon: '📋' }
];

export const Step2DocumentType: React.FC<StepProps> = ({
  answers,
  setAnswers,
  onNext,
  onBack
}) => {
  const { t } = useTranslation('common');

  const handleSelect = (documentType: string) => {
    setAnswers({ ...answers, documentType });
    onNext();
  };

  return (
    <StepContainer
      title={t('orderFlow.step2.title', 'Välj dokumenttyp')}
      subtitle={t('orderFlow.step2.subtitle', 'Vilken typ av dokument ska legaliseras?')}
      onBack={onBack}
      showNext={false}
    >
      <div className="space-y-3">
        {DOCUMENT_TYPES.map((docType) => (
          <button
            key={docType.id}
            onClick={() => handleSelect(docType.id)}
            className={`w-full p-6 border-2 rounded-lg transition-all duration-200 text-left hover:border-custom-button hover:bg-custom-button-light focus:outline-none focus:ring-2 focus:ring-custom-button ${
              answers.documentType === docType.id
                ? 'border-custom-button bg-custom-button-light ring-2 ring-custom-button'
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-center space-x-4">
              <span className="text-3xl">{docType.icon}</span>
              <span className="text-lg font-medium text-gray-900">
                {t(`orderFlow.step2.${docType.id}`, docType.id)}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Info box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>💡 Tips:</strong> Välj den dokumenttyp som bäst beskriver ditt dokument. Vi hanterar alla typer av officiella dokument.
        </p>
      </div>
    </StepContainer>
  );
};

export default Step2DocumentType;
