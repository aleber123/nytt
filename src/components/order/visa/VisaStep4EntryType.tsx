/**
 * Visa Step 4: Entry Type Selection (Single or Multiple)
 */

import React from 'react';
import { useTranslation } from 'next-i18next';
import { StepContainer } from '../shared/StepContainer';
import { VisaOrderAnswers } from './types';

interface Props {
  answers: VisaOrderAnswers;
  onUpdate: (updates: Partial<VisaOrderAnswers>) => void;
  onNext: () => void;
  onBack: () => void;
}

const VisaStep4EntryType: React.FC<Props> = ({ answers, onUpdate, onNext, onBack }) => {
  const { t } = useTranslation('common');

  const entryTypes = [
    {
      id: 'single' as const,
      title: t('visaOrder.step4.single.title', 'Single entry'),
      description: t('visaOrder.step4.single.description', 'En inresa till landet'),
      icon: '1️⃣',
    },
    {
      id: 'multiple' as const,
      title: t('visaOrder.step4.multiple.title', 'Multiple entry'),
      description: t('visaOrder.step4.multiple.description', 'Flera inresor under visumets giltighetstid'),
      icon: '🔄',
    },
  ];

  const handleSelect = (type: 'single' | 'multiple') => {
    onUpdate({ entryType: type });
  };

  return (
    <StepContainer
      title={t('visaOrder.step4.title', 'Hur många inresor behöver du?')}
      subtitle={t('visaOrder.step4.subtitle', 'Välj antal inresor')}
      onNext={onNext}
      onBack={onBack}
      nextDisabled={!answers.entryType}
    >
      <div className="space-y-4">
        {entryTypes.map((type) => {
          const isSelected = answers.entryType === type.id;

          return (
            <button
              key={type.id}
              onClick={() => handleSelect(type.id)}
              className={`w-full flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? 'border-custom-button bg-custom-button/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`p-3 rounded-full text-2xl ${isSelected ? 'bg-custom-button/10' : 'bg-gray-100'}`}>
                {type.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{type.title}</h3>
                <p className="text-sm text-gray-600">{type.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          {t('visaOrder.step4.hint', 'Tips: Om du är osäker, välj single entry. Multiple entry är vanligtvis dyrare och kräver ofta mer dokumentation.')}
        </p>
      </div>
    </StepContainer>
  );
};

export default VisaStep4EntryType;
