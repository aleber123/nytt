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
  { id: 'certificateOfOrigin' },
  { id: 'diploma' },
  { id: 'passport' },
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

  const handleToggleDocumentType = (documentTypeId: string) => {
    const currentSelection = Array.isArray(answers.documentTypes) ? answers.documentTypes : [];
    const isSelected = currentSelection.includes(documentTypeId);

    const updatedSelection = isSelected
      ? currentSelection.filter((id) => id !== documentTypeId)
      : [...currentSelection, documentTypeId];

    setAnswers({
      ...answers,
      documentTypes: updatedSelection,
      // Keep single documentType in sync for backward compatibility
      documentType: updatedSelection[0] || ''
    });
  };

  const handleDocumentTypeKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    documentTypeId: string
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggleDocumentType(documentTypeId);
    }
  };

  const handleNext = () => {
    const selectedTypes = Array.isArray(answers.documentTypes) ? answers.documentTypes : [];

    if (selectedTypes.length > 0) {
      const existingQuantities = (answers as any).documentTypeQuantities || {};
      const documentTypeQuantities: { [key: string]: number } = {};

      selectedTypes.forEach((typeId: string) => {
        const existing = existingQuantities[typeId];
        documentTypeQuantities[typeId] = existing && existing >= 1 ? existing : 1;
      });

      const totalQuantity = Object.values(documentTypeQuantities).reduce(
        (sum, q) => sum + (q || 0),
        0
      ) || 1;

      setAnswers({
        ...answers,
        documentTypes: selectedTypes,
        documentTypeQuantities,
        // Keep single documentType in sync with the first selected for backward compatibility
        documentType: selectedTypes[0] || answers.documentType || '',
        quantity: totalQuantity
      });
    }

    onNext();
  };

  return (
    <StepContainer
      title={t('orderFlow.step2.title', 'Välj dokumenttyp')}
      subtitle={t('orderFlow.step2.subtitle', 'Vilken typ av dokument ska legaliseras?')}
      onBack={onBack}
      onNext={handleNext}
      nextDisabled={!answers.documentTypes || answers.documentTypes.length === 0}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DOCUMENT_TYPES.map((docType) => {
          const isSelected = Array.isArray(answers.documentTypes)
            ? answers.documentTypes.includes(docType.id)
            : false;

          return (
            <div
              key={docType.id}
              role="checkbox"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => handleToggleDocumentType(docType.id)}
              onKeyDown={(event) => handleDocumentTypeKeyDown(event, docType.id)}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-custom-button bg-custom-button-bg shadow-md'
                  : 'border-gray-200 hover:border-custom-button hover:bg-custom-button-bg'
              }`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-lg font-medium text-gray-900 break-words">
                  {t(`orderFlow.step2.${docType.id}`, docType.id)}
                </span>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleToggleDocumentType(docType.id);
                  }}
                  className="h-5 w-5 accent-custom-button rounded focus:ring-custom-button pointer-events-none self-start sm:self-auto"
                  tabIndex={-1}
                  readOnly
                />
              </div>
            </div>
          );
        })}
      </div>
    </StepContainer>
  );
};

export default Step2DocumentType;
