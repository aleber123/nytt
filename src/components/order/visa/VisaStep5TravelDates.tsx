/**
 * Visa Step 5: Travel Dates (Departure and Return)
 */

import React from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { StepContainer } from '../shared/StepContainer';
import { VisaOrderAnswers } from './types';
import { CalendarIcon } from '@heroicons/react/24/outline';

interface Props {
  answers: VisaOrderAnswers;
  onUpdate: (updates: Partial<VisaOrderAnswers>) => void;
  onNext: () => void;
  onBack: () => void;
}

const formatDisplayDate = (dateStr: string, locale: string): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString(locale === 'en' ? 'en-GB' : 'sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const VisaStep5TravelDates: React.FC<Props> = ({ answers, onUpdate, onNext, onBack }) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const locale = router.locale || 'sv';

  const today = new Date().toISOString().split('T')[0];

  const isValid = answers.departureDate && answers.returnDateVisa && answers.returnDateVisa >= answers.departureDate;

  return (
    <StepContainer
      title={t('visaOrder.step5.title', 'När ska du resa?')}
      subtitle={t('visaOrder.step5.subtitle', 'Ange datum för avresa och hemresa')}
      onNext={onNext}
      onBack={onBack}
      nextDisabled={!isValid}
    >
      <div className="space-y-6">
        {/* Departure date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <CalendarIcon className="inline h-4 w-4 mr-1" />
            {t('visaOrder.step5.departureLabel', 'Avresedatum')}
          </label>
          <div className="relative">
            <input
              type="date"
              lang={locale}
              value={answers.departureDate}
              min={today}
              onChange={(e) => onUpdate({ departureDate: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-button focus:border-transparent text-base appearance-none bg-white [&::-webkit-date-and-time-value]:text-left"
              style={{ minHeight: '48px' }}
            />
          </div>
          {answers.departureDate && (
            <p className="text-sm text-gray-600 mt-1.5 font-medium">
              {formatDisplayDate(answers.departureDate, locale)}
            </p>
          )}
        </div>

        {/* Return date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <CalendarIcon className="inline h-4 w-4 mr-1" />
            {t('visaOrder.step5.returnLabel', 'Hemresedatum')}
          </label>
          <div className="relative">
            <input
              type="date"
              lang={locale}
              value={answers.returnDateVisa}
              min={answers.departureDate || today}
              onChange={(e) => onUpdate({ returnDateVisa: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-button focus:border-transparent text-base appearance-none bg-white [&::-webkit-date-and-time-value]:text-left"
              style={{ minHeight: '48px' }}
            />
          </div>
          {answers.returnDateVisa && (
            <p className="text-sm text-gray-600 mt-1.5 font-medium">
              {formatDisplayDate(answers.returnDateVisa, locale)}
            </p>
          )}
        </div>

        {/* Duration display */}
        {answers.departureDate && answers.returnDateVisa && answers.returnDateVisa >= answers.departureDate && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              {t('visaOrder.step5.duration', 'Resans längd')}: {' '}
              <span className="font-semibold">
                {Math.ceil((new Date(answers.returnDateVisa).getTime() - new Date(answers.departureDate).getTime()) / (1000 * 60 * 60 * 24))} {t('visaOrder.step5.days', 'dagar')}
              </span>
            </p>
          </div>
        )}

        {/* Error message */}
        {answers.departureDate && answers.returnDateVisa && answers.returnDateVisa < answers.departureDate && (
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-600">
              {t('visaOrder.step5.dateError', 'Hemresedatum måste vara efter avresedatum')}
            </p>
          </div>
        )}
      </div>
    </StepContainer>
  );
};

export default VisaStep5TravelDates;
