/**
 * Step 7: Shipping Instructions OR Pickup Address
 * Shows different UI based on customer's choice:
 * - Shipping instructions if customer chose to send documents themselves
 * - Pickup address form if customer selected pickup service
 * - Skips entirely if documents are uploaded
 */

import React from 'react';
import { useTranslation } from 'next-i18next';
import { StepContainer } from '../shared/StepContainer';
import { StepProps } from '../types';
import { ALL_COUNTRIES } from '@/components/order/data/countries';

interface Step7Props extends Omit<StepProps, 'currentLocale'> {
  onSkip: () => void; // Called when step should be skipped
  currentLocale?: string; // Optional since not used in this step
}

export const Step7ShippingOrPickup: React.FC<Step7Props> = ({
  answers,
  setAnswers,
  onNext,
  onBack,
  onSkip
}) => {
  const { t } = useTranslation('common');
  const [selectedShippingMethod, setSelectedShippingMethod] = React.useState<'rek' | 'courier' | null>(
    (answers.shippingMethod as 'rek' | 'courier' | null) ?? null
  );

  // Earliest allowed pickup date: next business day (skip weekends)
  // If after 15:00 Stockholm time, add an extra day since office closes at 15:00
  const earliestPickupDate = React.useMemo(() => {
    const now = new Date();
    // Get current hour in Stockholm timezone (CET/CEST)
    const stockholmHour = parseInt(now.toLocaleString('en-US', { 
      timeZone: 'Europe/Stockholm', 
      hour: 'numeric', 
      hour12: false 
    }));
    
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // If after 15:00 Stockholm time, earliest pickup is day after tomorrow
    // Otherwise, earliest pickup is tomorrow
    if (stockholmHour >= 15) {
      d.setDate(d.getDate() + 2); // Day after tomorrow
    } else {
      d.setDate(d.getDate() + 1); // Tomorrow
    }
    
    // Skip Saturday (6) and Sunday (0)
    while (d.getDay() === 0 || d.getDay() === 6) {
      d.setDate(d.getDate() + 1);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Skip logic
  React.useEffect(() => {
    // For uploaded documents, skip this step entirely
    if (answers.documentSource === 'upload') {
      onSkip();
      return;
    }

    // If no pickup service and not original documents, skip
    if (!answers.pickupService && answers.documentSource !== 'original') {
      onSkip();
      return;
    }
  }, [answers.documentSource, answers.pickupService, onSkip]);

  // Show shipping instructions if customer chose to send documents themselves
  if (!answers.pickupService && answers.documentSource === 'original') {
    return (
      <StepContainer
        title={t('orderFlow.step7.title', 'Skicka dina originaldokument')}
        subtitle={t('orderFlow.step7.subtitle', 'Här är adressen dit du ska skicka dina dokument')}
        onNext={onNext}
        onBack={onBack}
        nextDisabled={!selectedShippingMethod}
      >
        {/* Title for address choice */}
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('orderFlow.step7.shippingAddressTitle')}
        </h3>

        {/* Two white cards – same style as step 6. All info lives inside the selected card. */}
        <div className="space-y-4">
          {/* REK card */}
          <button
            type="button"
            onClick={() => {
              setSelectedShippingMethod('rek');
              setAnswers((prev) => ({
                ...prev,
                shippingMethod: 'rek'
              }));
            }}
            className={`w-full p-6 border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button ${
              selectedShippingMethod === 'rek'
                ? 'border-custom-button bg-custom-button-bg'
                : 'border-gray-200 hover:border-custom-button'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="text-left">
                <div className="text-lg font-medium text-gray-900 mb-1">
                  {t('orderFlow.step7.rekTab', 'REK (rekommenderad post)')}
                </div>

                {selectedShippingMethod === 'rek' && (
                  <div className="mt-3 text-sm text-gray-800" id="shipping-address">
                    <div className="text-xs font-semibold uppercase text-red-700 mb-1">
                      {t('orderFlow.step7.rekLabel', 'Rekommenderat brev (REK) – boxadress')}
                    </div>
                    <div className="font-medium text-gray-900 mb-1">
                      {t(
                        'orderFlow.step7.rekCompanyLine',
                        `REK ${t('orderFlow.step7.companyName')}`
                      )}
                    </div>
                    <div>{t('orderFlow.step7.attention')}</div>
                    <div>{t('orderFlow.step7.street')}</div>
                    <div>
                      {t('orderFlow.step7.postalCode')} {t('orderFlow.step7.city')}
                    </div>
                    <div>{t('orderFlow.step7.country')}</div>
                    <p className="mt-2 text-xs text-gray-600">
                      {t(
                        'orderFlow.step7.rekInfo',
                        'För rekommenderat brev (REK) ska du alltid använda denna boxadress.'
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Print button only for REK, since it prints the REK label */}
              {selectedShippingMethod === 'rek' && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    const printWindow = window.open('', '_blank', 'width=600,height=400');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>DOX Visumpartner AB - Leveransadress</title>
                            <style>
                              body {
                                font-family: Arial, sans-serif;
                                margin: 40px;
                                text-align: center;
                              }
                              .address {
                                border: 2px solid #dc2626;
                                padding: 20px;
                                border-radius: 8px;
                                background: #fef2f2;
                                display: inline-block;
                                margin: 20px 0;
                              }
                              .company {
                                font-weight: bold;
                                font-size: 18px;
                                color: #1f2937;
                                margin-bottom: 8px;
                              }
                              .address-line {
                                color: #374151;
                                margin: 4px 0;
                              }
                              @media print {
                                body { margin: 20px; }
                              }
                            </style>
                          </head>
                          <body>
                            <h2>${t('orderFlow.step7.shippingAddressTitle')}</h2>
                            <div class="address">
                              <div class="company">${t('orderFlow.step7.companyName')}</div>
                              <div class="address-line">${t('orderFlow.step7.attention')}</div>
                              <div class="address-line">${t('orderFlow.step7.street')}</div>
                              <div class="address-line">${t('orderFlow.step7.postalCode')} ${t('orderFlow.step7.city')}</div>
                              <div class="address-line">${t('orderFlow.step7.country')}</div>
                            </div>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.focus();
                      setTimeout(() => {
                        printWindow.print();
                        printWindow.close();
                      }, 250);
                    }
                  }}
                  className="ml-4 flex items-center justify-center w-10 h-10 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors duration-200"
                  title={t('orderFlow.step7.printAddress')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                </button>
              )}
            </div>
          </button>

          {/* Courier / DHL card */}
          <button
            type="button"
            onClick={() => {
              setSelectedShippingMethod('courier');
              setAnswers((prev) => ({
                ...prev,
                shippingMethod: 'courier'
              }));
            }}
            className={`w-full p-6 border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button ${
              selectedShippingMethod === 'courier'
                ? 'border-custom-button bg-custom-button-bg'
                : 'border-gray-200 hover:border-custom-button'
            }`}
          >
            <div className="text-left">
              <div className="text-lg font-medium text-gray-900 mb-1">
                {t('orderFlow.step7.courierTab', 'BUD (t.ex. DHL, Bring m.m.)')}
              </div>

              {selectedShippingMethod === 'courier' && (
                <div className="mt-3 text-sm text-gray-800">
                  <div className="text-xs font-semibold uppercase text-red-700 mb-1">
                    {t('orderFlow.step7.courierLabel', 'Bud / DHL – besöksadress')}
                  </div>
                  <div className="font-medium text-gray-900 mb-1">
                    {t('orderFlow.step7.companyName')}
                  </div>
                  <div>{t('orderFlow.step7.attention')}</div>
                  <div>{t('orderFlow.step7.courierStreet', 'Livdjursgatan 4, våning 6')}</div>
                  <div>
                    {t('orderFlow.step7.courierPostalCode', '121 62')}{' '}
                    {t('orderFlow.step7.courierCity', 'Johanneshov')}
                  </div>
                  <div>
                    {t('orderFlow.step7.courierCountry', 'Sverige')}
                  </div>
                  <p className="mt-2 text-xs text-red-700 font-medium">
                    {t(
                      'orderFlow.step7.courierWarning',
                      'Viktigt: Skicka inte REK till denna adress.'
                    )}
                  </p>
                </div>
              )}
            </div>
          </button>
        </div>
      </StepContainer>
    );
  }

  // Show pickup address form if pickup service is selected
  if (answers.pickupService) {
    const isFormValid =
      answers.pickupAddress.name &&
      answers.pickupAddress.street &&
      answers.pickupAddress.postalCode &&
      answers.pickupAddress.city &&
      !!answers.pickupDate &&
      (!answers.pickupDate || answers.pickupDate >= earliestPickupDate);

    return (
      <StepContainer
        title={t('orderFlow.pickupAddress.title')}
        subtitle={t('orderFlow.pickupAddress.subtitle')}
        onNext={onNext}
        onBack={onBack}
        nextDisabled={!isFormValid}
      >
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🚚</span>
            <div>
              <div className="font-medium text-blue-900">
                {t('orderFlow.pickupAddress.pickupOrdered')}
              </div>
              <div className="text-sm text-blue-700">
                {t('orderFlow.pickupAddress.pickupContact')}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('orderFlow.pickupAddress.name')} {t('orderFlow.pickupAddress.requiredField')}
            </label>
            <input
              type="text"
              value={answers.pickupAddress.name}
              onChange={(e) =>
                setAnswers((prev) => ({
                  ...prev,
                  pickupAddress: { ...prev.pickupAddress, name: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button"
              placeholder={t('orderFlow.pickupAddress.namePlaceholder')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('orderFlow.pickupAddress.company')}
            </label>
            <input
              type="text"
              value={answers.pickupAddress.company}
              onChange={(e) =>
                setAnswers((prev) => ({
                  ...prev,
                  pickupAddress: { ...prev.pickupAddress, company: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button"
              placeholder={t('orderFlow.pickupAddress.companyPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('orderFlow.pickupAddress.street')} {t('orderFlow.pickupAddress.requiredField')}
            </label>
            <input
              type="text"
              value={answers.pickupAddress.street}
              onChange={(e) =>
                setAnswers((prev) => ({
                  ...prev,
                  pickupAddress: { ...prev.pickupAddress, street: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button"
              placeholder={t('orderFlow.pickupAddress.streetPlaceholder')}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('orderFlow.pickupAddress.postalCode')} {t('orderFlow.pickupAddress.requiredField')}
              </label>
              <input
                type="text"
                value={answers.pickupAddress.postalCode}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    pickupAddress: { ...prev.pickupAddress, postalCode: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button"
                placeholder={t('orderFlow.pickupAddress.postalCodePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('orderFlow.pickupAddress.city')} {t('orderFlow.pickupAddress.requiredField')}
              </label>
              <input
                type="text"
                value={answers.pickupAddress.city}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    pickupAddress: { ...prev.pickupAddress, city: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button"
                placeholder={t('orderFlow.pickupAddress.cityPlaceholder')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('orderFlow.pickupAddress.country', 'Land')} {t('orderFlow.pickupAddress.requiredField')}
            </label>
            <select
              value={answers.pickupAddress.country || 'SE'}
              onChange={(e) =>
                setAnswers((prev) => ({
                  ...prev,
                  pickupAddress: { ...prev.pickupAddress, country: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button bg-white"
            >
              {/* Common Nordic countries first */}
              <option value="SE">Sverige</option>
              <option value="NO">Norge</option>
              <option value="DK">Danmark</option>
              <option value="FI">Finland</option>
              <option disabled>──────────</option>
              {/* Rest of countries alphabetically */}
              {ALL_COUNTRIES
                .filter(c => !['SE', 'NO', 'DK', 'FI'].includes(c.code))
                .map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('orderFlow.pickupAddress.date', 'Önskat upphämtningsdatum')} {t('orderFlow.pickupAddress.requiredField')}
              </label>
              <input
                type="date"
                value={answers.pickupDate || ''}
                min={earliestPickupDate}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    pickupDate: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button"
              />
              <p className="mt-1 text-xs text-gray-500">
                {t(
                  'orderFlow.pickupAddress.dateHelp',
                  'Du kan välja tidigast nästa vardag. Vi bokar upphämtning utifrån ditt önskemål.'
                )}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('orderFlow.pickupAddress.timeWindow', 'Önskat tidsfönster (valfritt)')}
              </label>
              <select
                value={answers.pickupTimeWindow || ''}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    pickupTimeWindow: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button bg-white"
              >
                <option value="">{t('orderFlow.pickupAddress.timeWindowAny', 'Hela dagen (09–17)')}</option>
                <option value="morning">{t('orderFlow.pickupAddress.timeWindowMorning', 'Förmiddag (09–12)')}</option>
                <option value="afternoon">{t('orderFlow.pickupAddress.timeWindowAfternoon', 'Eftermiddag (12–17)')}</option>
              </select>
            </div>
          </div>
        </div>
      </StepContainer>
    );
  }

  // Fallback - should not reach here due to useEffect
  return null;
};

export default Step7ShippingOrPickup;
