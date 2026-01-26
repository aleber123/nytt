/**
 * Visa Step 3: Trip Type Selection (Business or Tourist)
 */

import React from 'react';
import { useTranslation } from 'next-i18next';
import { StepContainer } from '../shared/StepContainer';
import { VisaOrderAnswers } from './types';
import { BriefcaseIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

interface Props {
  answers: VisaOrderAnswers;
  onUpdate: (updates: Partial<VisaOrderAnswers>) => void;
  onNext: () => void;
  onBack: () => void;
}

const VisaStep3TripType: React.FC<Props> = ({ answers, onUpdate, onNext, onBack }) => {
  const { t } = useTranslation('common');

  const tripTypes = [
    {
      id: 'business' as const,
      icon: BriefcaseIcon,
      title: t('visaOrder.step3.business.title', 'Affärsresa'),
      description: t('visaOrder.step3.business.description', 'Möten, konferenser, affärsförhandlingar'),
    },
    {
      id: 'tourist' as const,
      icon: GlobeAltIcon,
      title: t('visaOrder.step3.tourist.title', 'Turistresa'),
      description: t('visaOrder.step3.tourist.description', 'Semester, besök hos familj/vänner'),
    },
  ];

  const handleSelect = (type: 'business' | 'tourist') => {
    onUpdate({ tripType: type });
  };

  return (
    <StepContainer
      title={t('visaOrder.step3.title', 'Vad är syftet med din resa?')}
      subtitle={t('visaOrder.step3.subtitle', 'Välj typ av resa')}
      onNext={onNext}
      onBack={onBack}
      nextDisabled={!answers.tripType}
    >
      <div className="space-y-4">
        {tripTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = answers.tripType === type.id;

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
              <div className={`p-3 rounded-full ${isSelected ? 'bg-custom-button/10' : 'bg-gray-100'}`}>
                <Icon className={`h-6 w-6 ${isSelected ? 'text-custom-button' : 'text-gray-500'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{type.title}</h3>
                <p className="text-sm text-gray-600">{type.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </StepContainer>
  );
};

export default VisaStep3TripType;
