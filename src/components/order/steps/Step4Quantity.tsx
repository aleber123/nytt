/**
 * Step 4: Quantity Selection
 * Allows customer to select how many documents they want to legalize
 */

import React from 'react';
import { useTranslation } from 'next-i18next';
import { StepContainer } from '../shared/StepContainer';
import { StepProps } from '../types';

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 100;

export const Step4Quantity: React.FC<StepProps> = ({
  answers,
  setAnswers,
  onNext,
  onBack
}) => {
  const { t } = useTranslation('common');
  const selectedDocumentTypes = Array.isArray(answers.documentTypes) && answers.documentTypes.length > 0
    ? answers.documentTypes
    : answers.documentType
    ? [answers.documentType]
    : [];

  const isMultiType = selectedDocumentTypes.length > 1;

  const getDocumentTypeName = (typeId: string) => {
    const names: { [key: string]: string } = {
      birthCertificate: t('orderFlow.step2.birthCertificate', { defaultValue: 'Birth Certificate' }),
      marriageCertificate: t('orderFlow.step2.marriageCertificate', { defaultValue: 'Marriage Certificate' }),
      certificateOfOrigin: t('orderFlow.step2.certificateOfOrigin', { defaultValue: 'Certificate of Origin (COO)' }),
      diploma: t('orderFlow.step2.diploma', { defaultValue: 'Diploma' }),
      passport: t('orderFlow.step2.passport', { defaultValue: 'Passport' }),
      commercial: t('orderFlow.step2.commercial', { defaultValue: 'Commercial Documents' }),
      powerOfAttorney: t('orderFlow.step2.powerOfAttorney', { defaultValue: 'Power of Attorney' }),
      other: t('orderFlow.step2.other', { defaultValue: 'Other document' })
    };
    return names[typeId] || typeId;
  };

  const getQuantityForType = (typeId: string, source: any = answers) => {
    const map = (source as any).documentTypeQuantities || {};
    const value = map[typeId];
    if (typeof value === 'number' && value >= MIN_QUANTITY) {
      return value;
    }
    return 1;
  };

  // Single document type handlers (keep existing UI, but sync per-type quantities)
  const handleSingleDecrease = () => {
    setAnswers(prev => {
      const types = Array.isArray(prev.documentTypes) && prev.documentTypes.length > 0
        ? prev.documentTypes
        : prev.documentType
        ? [prev.documentType]
        : [];
      const docTypeId = types[0];
      const newQuantity = Math.max(MIN_QUANTITY, prev.quantity - 1);
      const prevMap = (prev as any).documentTypeQuantities || {};
      const newMap = docTypeId
        ? { ...prevMap, [docTypeId]: newQuantity }
        : prevMap;

      return {
        ...prev,
        quantity: newQuantity,
        documentTypeQuantities: newMap
      };
    });
  };

  const handleSingleIncrease = () => {
    setAnswers(prev => {
      const types = Array.isArray(prev.documentTypes) && prev.documentTypes.length > 0
        ? prev.documentTypes
        : prev.documentType
        ? [prev.documentType]
        : [];
      const docTypeId = types[0];
      const newQuantity = Math.min(MAX_QUANTITY, prev.quantity + 1);
      const prevMap = (prev as any).documentTypeQuantities || {};
      const newMap = docTypeId
        ? { ...prevMap, [docTypeId]: newQuantity }
        : prevMap;

      return {
        ...prev,
        quantity: newQuantity,
        documentTypeQuantities: newMap
      };
    });
  };

  const handleSingleInputChange = (value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < MIN_QUANTITY || num > MAX_QUANTITY) return;

    setAnswers(prev => {
      const types = Array.isArray(prev.documentTypes) && prev.documentTypes.length > 0
        ? prev.documentTypes
        : prev.documentType
        ? [prev.documentType]
        : [];
      const docTypeId = types[0];
      const prevMap = (prev as any).documentTypeQuantities || {};
      const newMap = docTypeId
        ? { ...prevMap, [docTypeId]: num }
        : prevMap;

      return {
        ...prev,
        quantity: num,
        documentTypeQuantities: newMap
      };
    });
  };

  // Multi document type handlers
  const handleMultiDecrease = (typeId: string) => {
    setAnswers(prev => {
      const map = (prev as any).documentTypeQuantities || {};
      const current = getQuantityForType(typeId, prev);
      if (current <= MIN_QUANTITY) {
        return prev; // Each selected document type must have at least 1
      }

      const newCount = current - 1;
      const newMap = { ...map, [typeId]: newCount };
      const newTotal = Math.max(MIN_QUANTITY, (prev.quantity || 0) - 1);

      return {
        ...prev,
        quantity: newTotal,
        documentTypeQuantities: newMap
      };
    });
  };

  const handleMultiIncrease = (typeId: string) => {
    setAnswers(prev => {
      const currentTotal = prev.quantity || 0;
      if (currentTotal >= MAX_QUANTITY) {
        return prev;
      }

      const map = (prev as any).documentTypeQuantities || {};
      const current = getQuantityForType(typeId, prev);
      const newCount = current + 1;
      if (currentTotal + 1 > MAX_QUANTITY) {
        return prev;
      }

      const newMap = { ...map, [typeId]: newCount };
      const newTotal = currentTotal + 1;

      return {
        ...prev,
        quantity: newTotal,
        documentTypeQuantities: newMap
      };
    });
  };

  const totalReachedMax = answers.quantity >= MAX_QUANTITY;

  return (
    <StepContainer
      title={t('orderFlow.step4.title', 'Hur många dokument?')}
      subtitle={t('orderFlow.step4.subtitle', 'Ange antal dokument som ska legaliseras')}
      onNext={onNext}
      onBack={onBack}
      nextDisabled={false}
    >
      {isMultiType ? (
        <div className="space-y-4 mb-8">
          {selectedDocumentTypes.map((typeId: string) => {
            const qty = getQuantityForType(typeId);
            return (
              <div key={typeId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col gap-1 mb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="font-medium text-gray-900 break-words">
                    {getDocumentTypeName(typeId)}
                  </div>
                </div>

                {/* Quantity Selector per document type */}
                <div className="flex items-center justify-center space-x-4">
                  {/* Decrease Button */}
                  <button
                    onClick={() => handleMultiDecrease(typeId)}
                    disabled={qty <= MIN_QUANTITY}
                    className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-primary-500 hover:bg-primary-50"
                  >
                    <span className="text-2xl">{t('orderFlow.step4.decrease', '−')}</span>
                  </button>

                  {/* Quantity Display */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-custom-button mb-1">{qty}</div>
                    <div className="text-gray-600 text-sm">{t('orderFlow.step4.quantityLabel', 'dokument')}</div>
                  </div>

                  {/* Increase Button */}
                  <button
                    onClick={() => handleMultiIncrease(typeId)}
                    disabled={totalReachedMax}
                    className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-custom-button hover:bg-custom-button-bg"
                  >
                    <span className="text-2xl">{t('orderFlow.step4.increase', '+')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          {/* Quantity Selector */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            {/* Decrease Button */}
            <button
              onClick={handleSingleDecrease}
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
              onClick={handleSingleIncrease}
              disabled={answers.quantity >= MAX_QUANTITY}
              className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-custom-button hover:bg-custom-button-bg"
            >
              <span className="text-2xl">{t('orderFlow.step4.increase', '+')}</span>
            </button>
          </div>
        </>
      )}

      {/* Quantity Limits Info */}
      {totalReachedMax && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <h4 className="font-medium text-amber-900 mb-1">
                Maximum antal nått
              </h4>
              <p className="text-sm text-amber-800">
                För beställningar över 100 dokument, vänligen kontakta oss direkt för en skräddarsydd offert.
              </p>
            </div>
          </div>
        </div>
      )}
    </StepContainer>
  );
};

export default Step4Quantity;
