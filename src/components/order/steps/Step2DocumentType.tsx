/**
 * Step 2: Document Type Selection
 * Allows customer to select the type of document to be legalized
 */

import React from 'react';
import { useTranslation } from 'next-i18next';
import { StepContainer } from '../shared/StepContainer';
import { StepProps } from '../types';

const DOCUMENT_TYPES = [
  { id: 'birthCertificate' },
  { id: 'marriageCertificate' },
  { id: 'diploma' },
  { id: 'commercial' },
  { id: 'powerOfAttorney' },
  { id: 'other' }
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
      <div className="space-y-4">
        {DOCUMENT_TYPES.map((docType) => (
          <button
            key={docType.id}
            onClick={() => handleSelect(docType.id)}
            className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-custom-button hover:bg-custom-button-bg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button text-left"
          >
            <span className="text-lg font-medium text-gray-900">
              {t(`orderFlow.step2.${docType.id}`, docType.id)}
            </span>
          </button>
        ))}
      </div>
    </StepContainer>
  );
};

export default Step2DocumentType;
