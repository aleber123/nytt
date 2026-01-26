/**
 * Visa Step 5: Deadline (When do you need the visa/passport back)
 * Adapts text based on whether it's E-Visa or Sticker visa
 */

import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { StepContainer } from '../shared/StepContainer';
import { VisaOrderAnswers } from './types';
import { ClockIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Props {
  answers: VisaOrderAnswers;
  onUpdate: (updates: Partial<VisaOrderAnswers>) => void;
  onNext: () => void;
  onBack: () => void;
}

const VisaStep6Deadline: React.FC<Props> = ({ answers, onUpdate, onNext, onBack }) => {
  const { t, i18n } = useTranslation('common');
  const [showExpressModal, setShowExpressModal] = useState(false);
  const [expressAccepted, setExpressAccepted] = useState(answers.expressRequired || false);
  const locale = i18n.language;
  const isSv = locale === 'sv' || locale?.startsWith('sv');

  const today = new Date().toISOString().split('T')[0];
  
  // Check if this is an E-Visa based on selected product
  const isEVisa = answers.selectedVisaProduct?.visaType === 'e-visa';
  
  // Get processing times from selected product
  const normalProcessingDays = answers.selectedVisaProduct?.processingDays || 10;
  const expressProcessingDays = answers.selectedVisaProduct?.expressDays || Math.ceil(normalProcessingDays / 2);
  const expressAvailable = answers.selectedVisaProduct?.expressAvailable || false;
  const expressPrice = answers.selectedVisaProduct?.expressPrice || 0;
  
  const daysUntilDeadline = answers.passportNeededBy 
    ? Math.ceil((new Date(answers.passportNeededBy).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Determine urgency based on actual processing times
  const needsExpress = daysUntilDeadline !== null && daysUntilDeadline < normalProcessingDays;
  const canDoExpress = daysUntilDeadline !== null && daysUntilDeadline >= expressProcessingDays && expressAvailable;
  const tooShort = daysUntilDeadline !== null && daysUntilDeadline < expressProcessingDays;
  const isUrgent = daysUntilDeadline !== null && daysUntilDeadline < normalProcessingDays + 3;
  const isVeryUrgent = needsExpress;

  // Different text for E-Visa vs Sticker
  const title = isEVisa 
    ? t('visaOrder.step6.titleEVisa', 'När behöver du visumet?')
    : t('visaOrder.step6.title', 'När behöver du passet tillbaka?');
  
  const subtitle = isEVisa
    ? t('visaOrder.step6.subtitleEVisa', 'Ange senaste datum du behöver ditt e-visum klart')
    : t('visaOrder.step6.subtitle', 'Ange senaste datum du behöver ditt pass med visum');
  
  const deadlineLabel = isEVisa
    ? t('visaOrder.step6.deadlineLabelEVisa', 'Senast behöver jag visumet')
    : t('visaOrder.step6.deadlineLabel', 'Senast behöver jag passet');
  
  const hint = isEVisa
    ? t('visaOrder.step6.hintEVisa', 'Tips: E-visum levereras digitalt via e-post. Planera för att ha visumet klart minst några dagar före avresa.')
    : t('visaOrder.step6.hint', 'Tips: Planera för att ha passet tillbaka minst 1 vecka före avresa för oförutsedda förseningar.');

  // Determine if we can proceed
  const canProceed = answers.passportNeededBy && !tooShort && (!needsExpress || !canDoExpress || expressAccepted);

  return (
    <StepContainer
      title={title}
      subtitle={subtitle}
      onNext={onNext}
      onBack={onBack}
      nextDisabled={!canProceed}
    >
      <div className="space-y-6">
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-button focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            {isSv ? 'Format: ÅÅÅÅ-MM-DD' : 'Format: YYYY-MM-DD'}
          </p>
        </div>

        {/* Time remaining display */}
        {daysUntilDeadline !== null && (
          <div className={`p-4 rounded-lg ${
            tooShort ? 'bg-red-50' : needsExpress ? 'bg-amber-50' : isUrgent ? 'bg-yellow-50' : 'bg-green-50'
          }`}>
            <div className="flex items-start gap-3">
              {(isUrgent || needsExpress || tooShort) && (
                <ExclamationTriangleIcon className={`h-5 w-5 flex-shrink-0 ${
                  tooShort ? 'text-red-500' : needsExpress ? 'text-amber-500' : 'text-yellow-500'
                }`} />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  tooShort ? 'text-red-800' : needsExpress ? 'text-amber-800' : isUrgent ? 'text-yellow-800' : 'text-green-800'
                }`}>
                  {daysUntilDeadline} {isSv ? 'dagar kvar' : 'days remaining'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isSv 
                    ? `Normal handläggning: ~${normalProcessingDays} arbetsdagar`
                    : `Normal processing: ~${normalProcessingDays} business days`}
                  {expressAvailable && (
                    <span> • Express: ~{expressProcessingDays} {isSv ? 'dagar' : 'days'}</span>
                  )}
                </p>
                
                {/* Too short - cannot process */}
                {tooShort && (
                  <p className="text-sm text-red-600 mt-2">
                    {isSv 
                      ? 'Tyvärr är denna deadline för kort. Vänligen välj ett senare datum.'
                      : 'Unfortunately, this deadline is too short. Please select a later date.'}
                  </p>
                )}
                
                {/* Needs express - show warning and acceptance */}
                {needsExpress && canDoExpress && !tooShort && (
                  <div className="mt-2">
                    <p className="text-sm text-amber-700">
                      {isSv 
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
                          onUpdate({ expressRequired: e.target.checked });
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
                
                {/* Urgent but still within normal processing */}
                {isUrgent && !needsExpress && (
                  <p className="text-sm text-yellow-600 mt-1">
                    {isSv 
                      ? 'Kort tid. Vi rekommenderar att du skickar in din ansökan så snart som möjligt.'
                      : 'Tight deadline. We recommend submitting your application as soon as possible.'}
                  </p>
                )}
                
                {/* Good time */}
                {!isUrgent && !needsExpress && (
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

        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            {hint}
          </p>
        </div>

        {/* Disclaimer about embassy processing */}
        <div className="p-4 bg-gray-100 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600">
            <strong>{isSv ? 'Viktigt:' : 'Important:'}</strong>{' '}
            {isSv 
              ? 'Vi kan aldrig garantera att ett visum blir godkänt eller klart inom angiven tid. Det slutgiltiga beslutet och handläggningstiden bestäms alltid av ambassaden eller konsulatet. Angivna handläggningstider är uppskattningar baserade på normala förhållanden.'
              : 'We cannot guarantee that a visa will be approved or processed within the stated timeframe. The final decision and processing time is always determined by the embassy or consulate. The processing times shown are estimates based on normal circumstances.'}
          </p>
        </div>
      </div>
    </StepContainer>
  );
};

export default VisaStep6Deadline;
