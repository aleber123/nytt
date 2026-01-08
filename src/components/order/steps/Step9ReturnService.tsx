/**
 * Step 9: Return Service Selection
 * Allows customer to select how they want their documents returned
 * Includes premium delivery options for DHL and Stockholm City Courier
 */

import React from 'react';
import { useTranslation } from 'next-i18next';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { StepContainer } from '../shared/StepContainer';
import { StepProps } from '../types';

interface ReturnService {
  id: string;
  name: string;
  description: string;
  price: string;
  estimatedDelivery: string;
  provider: string;
}

interface Step9Props extends Omit<StepProps, 'currentLocale'> {
  returnServices: ReturnService[];
  loadingReturnServices: boolean;
}

export const Step9ReturnService: React.FC<Step9Props> = ({
  answers,
  setAnswers,
  onNext,
  onBack,
  returnServices,
  loadingReturnServices
}) => {
  const { t } = useTranslation('common');

  const getStockholmNow = () => {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Stockholm',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(now);

    const get = (type: string) => parts.find((p) => p.type === type)?.value;
    const year = Number(get('year'));
    const month = Number(get('month'));
    const day = Number(get('day'));
    const hour = Number(get('hour'));
    const minute = Number(get('minute'));

    return { year, month, day, hour, minute };
  };

  const formatYmd = (y: number, m: number, d: number) => {
    const mm = String(m).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  const getNextBusinessDay = (ymd: string) => {
    const [y, m, d] = ymd.split('-').map((v) => Number(v));
    const date = new Date(Date.UTC(y, m - 1, d));
    date.setUTCDate(date.getUTCDate() + 1);
    while (date.getUTCDay() === 0 || date.getUTCDay() === 6) {
      date.setUTCDate(date.getUTCDate() + 1);
    }
    return formatYmd(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  };

  const isStockholmOptionAvailableToday = (leadHours: number) => {
    const { year, month, day, hour, minute } = getStockholmNow();
    const todayYmd = formatYmd(year, month, day);
    const selected = answers.returnDeliveryDate || todayYmd;

    if (selected !== todayYmd) return true;

    const openMinutes = 8 * 60;
    const closeMinutes = 15 * 60;
    const nowMinutes = hour * 60 + minute;

    if (nowMinutes >= closeMinutes) return false;

    const effectiveStart = Math.max(nowMinutes, openMinutes);
    const readyAt = effectiveStart + leadHours * 60;
    return readyAt <= closeMinutes;
  };

  const getEarliestStockholmDeliveryDate = () => {
    const { year, month, day, hour, minute } = getStockholmNow();
    const todayYmd = formatYmd(year, month, day);
    const closeMinutes = 15 * 60;
    const nowMinutes = hour * 60 + minute;
    if (nowMinutes >= closeMinutes) return getNextBusinessDay(todayYmd);
    return todayYmd;
  };

  const handleServiceSelect = (serviceId: string) => {
    setAnswers({
      ...answers,
      returnService: serviceId,
      premiumDelivery: '', // Reset premium delivery when changing base service
      billingInfo: {
        ...answers.billingInfo,
        sameAsReturn: serviceId === 'own-delivery' ? false : answers.billingInfo.sameAsReturn
      },
      // Clear tracking number when switching away from own-delivery
      ownReturnTrackingNumber: serviceId === 'own-delivery' ? answers.ownReturnTrackingNumber : ''
    });
  };

  const handlePremiumSelect = (premiumId: string) => {
    setAnswers({
      ...answers,
      premiumDelivery: premiumId
    });
  };

  // Filter out premium delivery options from main list
  const baseServices = returnServices.filter(
    service => !['dhl-pre-12', 'dhl-pre-9', 'stockholm-express', 'stockholm-sameday'].includes(service.id)
  );

  // Premium DHL options
  const dhlPremiumOptions = returnServices
    .filter(service => ['dhl-pre-12', 'dhl-pre-9'].includes(service.id))
    .sort((a, b) => {
      const order = ['dhl-pre-12', 'dhl-pre-9'];
      return order.indexOf(a.id) - order.indexOf(b.id);
    });

  const dhlTimeOptions = [
    {
      id: '',
      name: t('orderFlow.step9.dhlEndOfDayName', 'End of day (standard)'),
      description: t('orderFlow.step9.dhlEndOfDayDescription', 'Leverans sker innan dagens slut'),
      price: ''
    },
    ...dhlPremiumOptions
  ];

  // Premium Stockholm options
  const stockholmPremiumOptions = returnServices
    .filter(service => ['stockholm-express', 'stockholm-sameday'].includes(service.id))
    .sort((a, b) => {
      const order = ['stockholm-express', 'stockholm-sameday'];
      return order.indexOf(a.id) - order.indexOf(b.id);
    });

  const stockholmTimeOptions = [
    {
      id: '',
      name: t('orderFlow.step9.stockholmStandardName', 'Standard (end of day)'),
      description: t('orderFlow.step9.stockholmStandardDescription', 'Leverans sker under dagen'),
      price: ''
    },
    ...stockholmPremiumOptions
  ];

  const showDHLPremium = answers.returnService && ['dhl-sweden', 'dhl-europe', 'dhl-worldwide'].includes(answers.returnService);
  const showStockholmPremium = answers.returnService === 'stockholm-city';

  const isOwnReturn = answers.returnService === 'own-delivery';
  
  const isNextDisabled = !answers.returnService || 
    (isOwnReturn && !answers.ownReturnTrackingNumber?.trim());

  const handlePremiumOptionKeyDown = (
    event: React.KeyboardEvent<HTMLLabelElement>,
    premiumId: string
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handlePremiumSelect(premiumId);
    }
  };

  return (
    <StepContainer
      title={t('orderFlow.step9.title', 'Välj returleverans')}
      subtitle={t('orderFlow.step9.subtitle', 'Hur vill du få tillbaka dina legaliserade dokument?')}
      onNext={onNext}
      onBack={onBack}
      nextDisabled={isNextDisabled}
    >
      {/* Loading State */}
      {loadingReturnServices && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">
            {t('orderFlow.step9.loadingServices', 'Laddar fraktalternativ...')}
          </span>
        </div>
      )}

      {/* Service Options */}
      {!loadingReturnServices && (
        <div className="space-y-4">
          {baseServices.map((service) => (
            <div key={service.id}>
              {/* Base Service */}
              <button
                onClick={() => handleServiceSelect(service.id)}
                className={`w-full p-4 sm:p-6 border-2 rounded-lg hover:border-custom-button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button ${
                  answers.returnService === service.id
                    ? 'border-custom-button bg-custom-button-bg'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center">
                    <div className="text-left">
                      <div className="text-lg font-medium text-gray-900 break-words">
                        {t(`orderFlow.step9.services.${service.id}.name`, service.name)}
                      </div>
                      <div className="text-gray-600 break-words">
                        {t(`orderFlow.step9.services.${service.id}.description`, service.description)}
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-lg font-semibold text-custom-button break-words">
                      {t(`orderFlow.step9.services.${service.id}.price`, service.price)}
                    </div>
                    <div className="text-xs text-gray-500">{service.provider}</div>
                  </div>
                </div>
              </button>

              {/* DHL Premium Options */}
              {answers.returnService === service.id && showDHLPremium && (
                <div className="mt-4 ml-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-3">
                    🚀 {t('orderFlow.step9.deliveryTimeOptions', 'Välj leveranstid')}
                  </h4>
                  <div className="space-y-3" role="radiogroup" aria-label={t('orderFlow.step9.deliveryTimeOptions', 'Välj leveranstid')}>
                    {dhlTimeOptions.map((premium) => (
                      <label
                        key={premium.id}
                        className="flex items-center space-x-3 cursor-pointer hover:bg-blue-100 p-2 rounded transition-colors"
                        role="radio"
                        aria-checked={answers.premiumDelivery === premium.id}
                        tabIndex={0}
                        onKeyDown={(event) => handlePremiumOptionKeyDown(event, premium.id)}
                      >
                        <input
                          type="radio"
                          name="premium-delivery"
                          value={premium.id}
                          checked={answers.premiumDelivery === premium.id}
                          onChange={(e) => handlePremiumSelect(e.target.value)}
                          className="h-4 w-4 text-custom-button focus:ring-custom-button border-gray-300"
                          tabIndex={-1}
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {premium.id
                              ? t(`orderFlow.step9.services.${premium.id}.name`, premium.name)
                              : premium.name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {premium.id
                              ? t(`orderFlow.step9.services.${premium.id}.description`, premium.description)
                              : premium.description}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-custom-button">
                          {(() => {
                            if (!premium.id) return t('orderFlow.step9.noExtraCost', '+0 kr');
                            const rawPrice = t(`orderFlow.step9.services.${premium.id}.price`, premium.price);
                            if (rawPrice.startsWith('Från +')) return rawPrice;
                            if (rawPrice.startsWith('Från ')) {
                              return `Från +${rawPrice.slice('Från '.length)}`;
                            }
                            return rawPrice.startsWith('+') ? rawPrice : `+${rawPrice}`;
                          })()}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Stockholm Premium Options */}
              {answers.returnService === service.id && showStockholmPremium && (
                <div className="mt-4 ml-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="mb-4">
                    <label htmlFor="return-delivery-date" className="block text-sm font-medium text-green-900 mb-1">
                      {t('orderFlow.step9.stockholmDeliveryDateLabel', 'Önskat leveransdatum')}
                    </label>
                    <DatePicker
                      id="return-delivery-date"
                      selected={answers.returnDeliveryDate ? new Date(answers.returnDeliveryDate + 'T12:00:00') : null}
                      onChange={(date: Date | null) => {
                        if (date) {
                          const y = date.getFullYear();
                          const m = String(date.getMonth() + 1).padStart(2, '0');
                          const d = String(date.getDate()).padStart(2, '0');
                          setAnswers((prev) => ({
                            ...prev,
                            returnDeliveryDate: `${y}-${m}-${d}`
                          }));
                        } else {
                          setAnswers((prev) => ({
                            ...prev,
                            returnDeliveryDate: ''
                          }));
                        }
                      }}
                      minDate={new Date(getEarliestStockholmDeliveryDate() + 'T12:00:00')}
                      filterDate={(date: Date) => {
                        const day = date.getDay();
                        return day !== 0 && day !== 6; // Disable weekends
                      }}
                      dateFormat="yyyy-MM-dd"
                      placeholderText={t('orderFlow.step9.stockholmDeliveryDatePlaceholder', 'Välj datum')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button bg-white"
                    />
                  </div>

                  <h4 className="text-sm font-medium text-green-900 mb-3">
                    ⚡ {t('orderFlow.step9.deliveryTimeOptionsStockholm', 'Välj leveranstid')}
                  </h4>
                  <div className="space-y-3" role="radiogroup" aria-label={t('orderFlow.step9.deliveryTimeOptionsStockholm', 'Välj leveranstid')}>
                    {stockholmTimeOptions.map((premium) => (
                      (() => {
                        const leadHours = !premium.id
                          ? 0
                          : premium.id === 'stockholm-sameday'
                            ? 2
                            : premium.id === 'stockholm-express'
                              ? 4
                              : 0;
                        const isAvailable = isStockholmOptionAvailableToday(leadHours);

                        return (
                      <label
                        key={premium.id}
                        className={`flex items-center space-x-3 p-2 rounded transition-colors ${
                          isAvailable ? 'cursor-pointer hover:bg-green-100' : 'opacity-50 cursor-not-allowed'
                        }`}
                        role="radio"
                        aria-checked={answers.premiumDelivery === premium.id}
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (!isAvailable) return;
                          handlePremiumOptionKeyDown(event, premium.id);
                        }}
                      >
                        <input
                          type="radio"
                          name="premium-delivery"
                          value={premium.id}
                          checked={answers.premiumDelivery === premium.id}
                          onChange={(e) => {
                            if (!isAvailable) return;
                            handlePremiumSelect(e.target.value);
                          }}
                          className="h-4 w-4 text-custom-button focus:ring-custom-button border-gray-300"
                          tabIndex={-1}
                          disabled={!isAvailable}
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {premium.id
                              ? t(`orderFlow.step9.services.${premium.id}.name`, premium.name)
                              : premium.name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {premium.id
                              ? t(`orderFlow.step9.services.${premium.id}.description`, premium.description)
                              : premium.description}
                          </div>
                          {!isAvailable && (
                            <div className="text-xs text-gray-500 mt-1">
                              {t('orderFlow.step9.stockholmNotAvailableToday', 'Inte tillgänglig idag – välj annat alternativ eller en senare dag.')}
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-custom-button">
                          {!premium.id
                            ? t('orderFlow.step9.noExtraCost', '+0 kr')
                            : t(`orderFlow.step9.services.${premium.id}.price`, premium.price)}
                        </div>
                      </label>
                        );
                      })()
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Other return options */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              {t('orderFlow.step9.otherOptionsTitle', 'Andra alternativ')}
            </h4>

            {/* Own return shipping (customer-arranged) */}
            <button
              type="button"
              onClick={() => handleServiceSelect('own-delivery')}
              className={`w-full p-4 border-2 rounded-lg text-left hover:border-custom-button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button ${
                answers.returnService === 'own-delivery'
                  ? 'border-custom-button bg-custom-button-bg'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {t('orderFlow.step9.ownReturnTitle', 'Egen returfrakt (redan bokad)')}
                  </div>
                  <div className="text-xs text-gray-600">
                    {t(
                      'orderFlow.step9.ownReturnDescription',
                      'Du har själv bokat returfrakt för dina dokument. Ange spårningsnumret så att vi kan koppla returen till din beställning.'
                    )}
                  </div>
                </div>
                <div className="text-left sm:text-right sm:ml-4">
                  <div className="text-sm font-semibold text-custom-button">0 kr</div>
                </div>
              </div>
            </button>

            {answers.returnService === 'own-delivery' && (
              <div className="mt-4 ml-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-blue-900">
                    {t('orderFlow.step9.ownReturnTrackingLabel', 'Spårningsnummer')}
                  </label>
                  <input
                    type="text"
                    value={answers.ownReturnTrackingNumber || ''}
                    onChange={(e) =>
                      setAnswers(prev => ({
                        ...prev,
                        ownReturnTrackingNumber: e.target.value
                      }))
                    }
                    placeholder={t(
                      'orderFlow.step9.ownReturnTrackingPlaceholder',
                      'Ange spårningsnummer för din retur...'
                    )}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button bg-white"
                  />
                </div>
              </div>
            )}

            {/* Pickup at office */}
            <button
              type="button"
              onClick={() => handleServiceSelect('office-pickup')}
              className={`mt-4 w-full p-4 border-2 rounded-lg text-left hover:border-custom-button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button ${
                answers.returnService === 'office-pickup'
                  ? 'border-custom-button bg-custom-button-bg'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {t('orderFlow.step9.officePickupTitle', 'Hämtning på vårt kontor')}
                  </div>
                  <div className="text-xs text-gray-600">
                    {t(
                      'orderFlow.step9.officePickupDescription',
                      'Du hämtar själv dina färdiga dokument på vårt kontor i Stockholm.'
                    )}
                  </div>
                </div>
                <div className="text-left sm:text-right sm:ml-4">
                  <div className="text-sm font-semibold text-custom-button">0 kr</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Pricing Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
        <div className="flex items-start">
          <span className="text-2xl mr-3">⚠️</span>
          <div>
            <h4 className="font-medium text-amber-900 mb-1">
              {t('orderFlow.step9.priceDisclaimerTitle', 'Observera: Priserna kan variera')}
            </h4>
            <p className="text-sm text-amber-800">
              {t('orderFlow.step9.priceDisclaimerText', 'De angivna priserna är från-priser och kan variera beroende på vikt, storlek och destinationsadress. Det slutgiltiga priset bekräftas vid leverans.')}
            </p>
          </div>
        </div>
      </div>
    </StepContainer>
  );
};

export default Step9ReturnService;
