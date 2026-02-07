/**
 * Visa Step 4: Travel Dates + Deadline (combined)
 * Departure date, return date, and when you need the visa/passport back
 */

import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { StepContainer } from '../shared/StepContainer';
import { VisaOrderAnswers } from './types';
import { CalendarIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

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

// Calculate business days between two dates (excludes Saturdays and Sundays)
const getBusinessDays = (startDate: Date, endDate: Date): number => {
  let count = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  
  while (current < end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
};

const VisaStep4TravelDatesAndDeadline: React.FC<Props> = ({ answers, onUpdate, onNext, onBack }) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const locale = router.locale || 'sv';
  const isSv = locale === 'sv' || locale?.startsWith('sv');

  const [expressAccepted, setExpressAccepted] = useState(answers.expressRequired || false);
  const [urgentAccepted, setUrgentAccepted] = useState(answers.urgentRequired || false);

  const today = new Date().toISOString().split('T')[0];

  // Check if this is an E-Visa based on selected product
  const isEVisa = answers.selectedVisaProduct?.visaType === 'e-visa';

  // Get processing times from selected product (in business days)
  const normalProcessingDays = answers.selectedVisaProduct?.processingDays || 10;
  const expressProcessingDays = answers.selectedVisaProduct?.expressDays || Math.ceil(normalProcessingDays / 2);
  const expressAvailable = answers.selectedVisaProduct?.expressAvailable || false;
  const expressPrice = answers.selectedVisaProduct?.expressPrice || 0;
  const urgentProcessingDays = answers.selectedVisaProduct?.urgentDays || 1;
  const urgentAvailable = answers.selectedVisaProduct?.urgentAvailable || false;
  const urgentPrice = answers.selectedVisaProduct?.urgentPrice || 0;

  // Auto-set deadline to 1 week before departure if departure is set and deadline is not
  const handleDepartureDateChange = (date: string) => {
    onUpdate({ departureDate: date });
    if (date && !answers.passportNeededBy) {
      const dep = new Date(date);
      dep.setDate(dep.getDate() - 7);
      const autoDeadline = dep.toISOString().split('T')[0];
      if (autoDeadline >= today) {
        onUpdate({ departureDate: date, passportNeededBy: autoDeadline });
      }
    }
  };

  // Calculate business days until deadline
  const businessDaysUntilDeadline = answers.passportNeededBy
    ? getBusinessDays(new Date(), new Date(answers.passportNeededBy))
    : null;

  const daysUntilDeadline = answers.passportNeededBy
    ? Math.ceil((new Date(answers.passportNeededBy).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Determine urgency
  const needsExpress = businessDaysUntilDeadline !== null && businessDaysUntilDeadline < normalProcessingDays && businessDaysUntilDeadline >= expressProcessingDays;
  const needsUrgent = businessDaysUntilDeadline !== null && businessDaysUntilDeadline < expressProcessingDays && businessDaysUntilDeadline >= urgentProcessingDays;
  const canDoExpress = needsExpress && expressAvailable;
  const canDoUrgent = needsUrgent && urgentAvailable;
  const tooShort = businessDaysUntilDeadline !== null && (
    (needsUrgent && !urgentAvailable) ||
    (needsExpress && !expressAvailable && !urgentAvailable) ||
    (businessDaysUntilDeadline < urgentProcessingDays && urgentAvailable) ||
    (businessDaysUntilDeadline < expressProcessingDays && !urgentAvailable)
  );
  const isWarning = businessDaysUntilDeadline !== null && businessDaysUntilDeadline < normalProcessingDays + 3 && !needsExpress && !needsUrgent;

  // Validation
  const datesValid = answers.departureDate && answers.returnDateVisa && answers.returnDateVisa >= answers.departureDate;
  const deadlineValid = answers.passportNeededBy && !tooShort &&
    (!needsExpress || expressAccepted) &&
    (!needsUrgent || urgentAccepted);
  const isValid = datesValid && deadlineValid;

  // Deadline label adapts for e-visa vs sticker
  const deadlineLabel = isEVisa
    ? (isSv ? 'Senast behöver jag visumet' : 'I need the visa by')
    : (isSv ? 'Senast behöver jag passet tillbaka' : 'I need the passport back by');

  const hint = isEVisa
    ? (isSv ? 'Tips: E-visum levereras digitalt via e-post. Planera för att ha visumet klart minst några dagar före avresa.' : 'Tip: E-visa is delivered digitally by email. Plan to have the visa ready at least a few days before departure.')
    : (isSv ? 'Tips: Planera för att ha passet tillbaka minst 1 vecka före avresa för oförutsedda förseningar.' : 'Tip: Plan to have the passport back at least 1 week before departure for unforeseen delays.');

  return (
    <StepContainer
      title={isSv ? 'Resedatum & deadline' : 'Travel dates & deadline'}
      subtitle={isSv ? 'Ange datum för din resa och när du behöver visumet klart' : 'Enter your travel dates and when you need the visa ready'}
      onNext={onNext}
      onBack={onBack}
      nextDisabled={!isValid}
    >
      <div className="space-y-6">
        {/* Travel dates section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Departure date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="inline h-4 w-4 mr-1" />
              {isSv ? 'Avresedatum' : 'Departure date'}
            </label>
            <input
              type="date"
              lang={locale}
              value={answers.departureDate}
              min={today}
              onChange={(e) => handleDepartureDateChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-button focus:border-transparent text-base appearance-none bg-white [&::-webkit-date-and-time-value]:text-left"
              style={{ minHeight: '48px' }}
            />
            {answers.departureDate && (
              <p className="text-sm text-gray-600 mt-1 font-medium">
                {formatDisplayDate(answers.departureDate, locale)}
              </p>
            )}
          </div>

          {/* Return date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="inline h-4 w-4 mr-1" />
              {isSv ? 'Hemresedatum' : 'Return date'}
            </label>
            <input
              type="date"
              lang={locale}
              value={answers.returnDateVisa}
              min={answers.departureDate || today}
              onChange={(e) => onUpdate({ returnDateVisa: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-button focus:border-transparent text-base appearance-none bg-white [&::-webkit-date-and-time-value]:text-left"
              style={{ minHeight: '48px' }}
            />
            {answers.returnDateVisa && (
              <p className="text-sm text-gray-600 mt-1 font-medium">
                {formatDisplayDate(answers.returnDateVisa, locale)}
              </p>
            )}
          </div>
        </div>

        {/* Duration display */}
        {datesValid && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              {isSv ? 'Resans längd' : 'Trip duration'}: {' '}
              <span className="font-semibold">
                {Math.ceil((new Date(answers.returnDateVisa).getTime() - new Date(answers.departureDate).getTime()) / (1000 * 60 * 60 * 24))} {isSv ? 'dagar' : 'days'}
              </span>
            </p>
          </div>
        )}

        {/* Date error */}
        {answers.departureDate && answers.returnDateVisa && answers.returnDateVisa < answers.departureDate && (
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-red-600">
              {isSv ? 'Hemresedatum måste vara efter avresedatum' : 'Return date must be after departure date'}
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            <ClockIcon className="inline h-5 w-5 mr-1" />
            {isEVisa ? (isSv ? 'När behöver du visumet?' : 'When do you need the visa?') : (isSv ? 'När behöver du passet tillbaka?' : 'When do you need the passport back?')}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {hint}
          </p>
        </div>

        {/* Deadline date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <ClockIcon className="inline h-4 w-4 mr-1" />
            {deadlineLabel}
          </label>
          <input
            type="date"
            lang={locale}
            value={answers.passportNeededBy}
            min={today}
            onChange={(e) => onUpdate({ passportNeededBy: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-button focus:border-transparent text-base appearance-none bg-white [&::-webkit-date-and-time-value]:text-left"
            style={{ minHeight: '48px' }}
          />
          {answers.passportNeededBy && (
            <p className="text-sm text-gray-600 mt-1 font-medium">
              {formatDisplayDate(answers.passportNeededBy, locale)}
            </p>
          )}
        </div>

        {/* Time remaining display */}
        {daysUntilDeadline !== null && (
          <div className={`p-4 rounded-lg ${
            tooShort ? 'bg-red-50' : needsUrgent ? 'bg-red-50' : needsExpress ? 'bg-amber-50' : isWarning ? 'bg-yellow-50' : 'bg-green-50'
          }`}>
            <div className="flex items-start gap-3">
              {(isWarning || needsExpress || needsUrgent || tooShort) && (
                <ExclamationTriangleIcon className={`h-5 w-5 flex-shrink-0 ${
                  tooShort ? 'text-red-500' : needsUrgent ? 'text-red-500' : needsExpress ? 'text-amber-500' : 'text-yellow-500'
                }`} />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  tooShort ? 'text-red-800' : needsUrgent ? 'text-red-800' : needsExpress ? 'text-amber-800' : isWarning ? 'text-yellow-800' : 'text-green-800'
                }`}>
                  {businessDaysUntilDeadline} {isSv ? 'arbetsdagar kvar' : 'business days remaining'}
                  <span className="text-gray-500 font-normal"> ({daysUntilDeadline} {isSv ? 'kalenderdagar' : 'calendar days'})</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isSv
                    ? `Normal handläggning: ~${normalProcessingDays} arbetsdagar`
                    : `Normal processing: ~${normalProcessingDays} business days`}
                  {expressAvailable && (
                    <span> • Express: ~{expressProcessingDays} {isSv ? 'arbetsdagar' : 'business days'}</span>
                  )}
                  {urgentAvailable && (
                    <span> • 🚨 Urgent: ~{urgentProcessingDays} {isSv ? 'arbetsdag' : 'business day'}{urgentProcessingDays > 1 ? (isSv ? 'ar' : 's') : ''}</span>
                  )}
                </p>

                {/* Too short */}
                {tooShort && (
                  <p className="text-sm text-red-600 mt-2">
                    {isSv
                      ? 'Tyvärr är denna deadline för kort. Vänligen välj ett senare datum.'
                      : 'Unfortunately, this deadline is too short. Please select a later date.'}
                  </p>
                )}

                {/* Needs urgent */}
                {needsUrgent && canDoUrgent && !tooShort && (
                  <div className="mt-2">
                    <p className="text-sm text-red-700 font-medium">
                      🚨 {isSv
                        ? 'Mycket kort tid! Urgent-hantering krävs.'
                        : 'Very short deadline! Urgent processing is required.'}
                    </p>
                    {urgentPrice > 0 && (
                      <p className="text-sm text-red-600 font-medium mt-1">
                        {isSv
                          ? `Urgent-avgift: +${urgentPrice.toLocaleString()} kr`
                          : `Urgent fee: +${urgentPrice.toLocaleString()} kr`}
                      </p>
                    )}
                    <label className="flex items-center gap-2 mt-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={urgentAccepted}
                        onChange={(e) => {
                          setUrgentAccepted(e.target.checked);
                          onUpdate({ urgentRequired: e.target.checked, expressRequired: false });
                        }}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm text-red-800">
                        {isSv
                          ? 'Jag accepterar att urgent-hantering krävs och att extra avgifter tillkommer'
                          : 'I accept that urgent processing is required and additional fees apply'}
                      </span>
                    </label>
                  </div>
                )}

                {/* Needs express */}
                {needsExpress && canDoExpress && !tooShort && (
                  <div className="mt-2">
                    <p className="text-sm text-amber-700">
                      ⚡ {isSv
                        ? 'Kort tid! Expresshantering krävs.'
                        : 'Short deadline! Express processing is required.'}
                    </p>
                    {expressPrice > 0 && (
                      <p className="text-sm text-amber-600 font-medium mt-1">
                        {isSv
                          ? `Expressavgift: +${expressPrice.toLocaleString()} kr`
                          : `Express fee: +${expressPrice.toLocaleString()} kr`}
                      </p>
                    )}
                    <label className="flex items-center gap-2 mt-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={expressAccepted}
                        onChange={(e) => {
                          setExpressAccepted(e.target.checked);
                          onUpdate({ expressRequired: e.target.checked, urgentRequired: false });
                        }}
                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm text-amber-800">
                        {isSv
                          ? 'Jag accepterar att expresshantering krävs och att extra avgifter kan tillkomma'
                          : 'I accept that express processing is required and additional fees may apply'}
                      </span>
                    </label>
                  </div>
                )}

                {/* Warning */}
                {isWarning && !needsExpress && !needsUrgent && (
                  <p className="text-sm text-yellow-600 mt-1">
                    {isSv
                      ? 'Kort tid. Vi rekommenderar att du skickar in din ansökan så snart som möjligt.'
                      : 'Tight deadline. We recommend submitting your application as soon as possible.'}
                  </p>
                )}

                {/* Good time */}
                {!isWarning && !needsExpress && !needsUrgent && !tooShort && (
                  <p className="text-sm text-green-600 mt-1">
                    {isSv
                      ? 'God tid för normal handläggning.'
                      : 'Good time for normal processing.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="p-3 bg-gray-100 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600">
            <strong>{isSv ? 'Viktigt:' : 'Important:'}</strong>{' '}
            {isSv
              ? 'Vi kan aldrig garantera att ett visum blir godkänt eller klart inom angiven tid. Det slutgiltiga beslutet och handläggningstiden bestäms alltid av ambassaden eller konsulatet.'
              : 'We cannot guarantee that a visa will be approved or processed within the stated timeframe. The final decision and processing time is always determined by the embassy or consulate.'}
          </p>
        </div>
      </div>
    </StepContainer>
  );
};

export default VisaStep4TravelDatesAndDeadline;
