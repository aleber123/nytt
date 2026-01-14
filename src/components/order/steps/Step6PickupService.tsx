/**
 * Step 6: Pickup Service Selection
 * Allows customer to select pickup service for their documents
 * Includes premium pickup options for DHL and Stockholm City Courier
 */

import React from 'react';
import { useTranslation } from 'next-i18next';
import { StepContainer } from '../shared/StepContainer';
import { StepProps } from '../types';

interface PickupService {
  id: string;
  name: string;
  description: string;
  price: string;
  estimatedPickup: string;
  provider: string;
}

interface Step6Props extends StepProps {
  pickupServices: PickupService[];
  loadingPickupServices: boolean;
}

export const Step6PickupService: React.FC<Step6Props> = ({
  answers,
  setAnswers,
  onNext,
  onBack,
  pickupServices,
  loadingPickupServices
}) => {
  const { t } = useTranslation('common');
  const [showPickupOptions, setShowPickupOptions] = React.useState(false);

  const handleNoPickup = () => {
    setAnswers({
      ...answers,
      pickupService: false,
      pickupMethod: undefined,
      premiumPickup: ''
    });
    onNext();
  };

  const handleYesPickup = () => {
    setShowPickupOptions(true);
  };

  const handleServiceSelect = (serviceId: string) => {
    setAnswers({
      ...answers,
      pickupService: true,
      pickupMethod: serviceId,
      premiumPickup: '' // Reset premium pickup when changing base service
    });
  };

  const handlePremiumSelect = (premiumId: string) => {
    setAnswers({
      ...answers,
      premiumPickup: premiumId
    });
  };

  // Filter out premium pickup options from main list
  const baseServices = pickupServices.filter(
    service => !['dhl-pre-12', 'dhl-pre-9', 'stockholm-express', 'stockholm-sameday'].includes(service.id)
  );

  // Premium DHL options
  const dhlPremiumOptions = pickupServices
    .filter(service => ['dhl-pre-12', 'dhl-pre-9'].includes(service.id))
    .sort((a, b) => {
      const order = ['dhl-pre-12', 'dhl-pre-9'];
      return order.indexOf(a.id) - order.indexOf(b.id);
    });

  const dhlTimeOptions = [
    {
      id: '',
      name: t('orderFlow.step6.dhlEndOfDayName', 'End of day (standard)'),
      description: t('orderFlow.step6.dhlEndOfDayDescription', 'Leverans/hämtning sker innan dagens slut'),
      price: ''
    },
    ...dhlPremiumOptions
  ];

  // Premium Stockholm options
  const stockholmPremiumOptions = pickupServices
    .filter(service => ['stockholm-express', 'stockholm-sameday'].includes(service.id))
    .sort((a, b) => {
      const order = ['stockholm-express', 'stockholm-sameday'];
      return order.indexOf(a.id) - order.indexOf(b.id);
    });

  const stockholmTimeOptions = [
    {
      id: '',
      name: t('orderFlow.step6.stockholmStandardName', 'Standard (end of day)'),
      description: t('orderFlow.step6.stockholmStandardDescription', 'Hämtning sker under dagen'),
      price: ''
    },
    ...stockholmPremiumOptions
  ];

  const showDHLPremium = answers.pickupMethod && ['dhl-sweden', 'dhl-europe', 'dhl-worldwide'].includes(answers.pickupMethod);
  const showStockholmPremium = answers.pickupMethod === 'stockholm-city';

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
      title={t('orderFlow.step6.title', 'Önskar du att vi hämtar dina dokument?')}
      subtitle={t('orderFlow.step6.subtitle', 'Vi kan komma och hämta dina originaldokument hemma eller på jobbet')}
      onNext={showPickupOptions ? onNext : undefined}
      onBack={onBack}
      showNext={showPickupOptions}
      nextDisabled={showPickupOptions && !answers.pickupMethod}
    >
      {!showPickupOptions ? (
        /* Initial Choice - Two Simple Buttons */
        <div className="space-y-4">
          <button
            onClick={handleNoPickup}
            className="w-full p-4 sm:p-6 border-2 rounded-lg hover:border-custom-button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button border-gray-200"
          >
            <div className="text-lg font-medium text-gray-900">
              {t('orderFlow.step6.noPickup', 'Nej tack, jag skickar själv')}
            </div>
          </button>

          <button
            onClick={handleYesPickup}
            className="w-full p-4 sm:p-6 border-2 rounded-lg hover:border-custom-button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button border-gray-200"
          >
            <div className="text-lg font-medium text-gray-900">
              {t('orderFlow.step6.yesPickup', 'Ja tack, hämta mina dokument')}
            </div>
          </button>
        </div>
      ) : (
        /* Pickup Service Options */
        <>
          {/* Loading State */}
          {loadingPickupServices && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Service Options */}
          {!loadingPickupServices && (
            <div className="space-y-4">
              {baseServices.map((service) => (
            <div key={service.id}>
              {/* Base Service */}
              <button
                onClick={() => handleServiceSelect(service.id)}
                className={`w-full p-4 sm:p-6 border-2 rounded-lg hover:border-custom-button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button ${
                  answers.pickupMethod === service.id
                    ? 'border-custom-button bg-custom-button-bg'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center">
                    <div className="text-left">
                      <div className="text-lg font-medium text-gray-900 break-words">
                        {t(`orderFlow.step6.services.${service.id}.name`, service.name)}
                      </div>
                      <div className="text-gray-600 break-words">
                        {t(`orderFlow.step6.services.${service.id}.description`, service.description)}
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-lg font-semibold text-custom-button">
                      {t(`orderFlow.step6.services.${service.id}.price`, service.price)}
                    </div>
                    <div className="text-xs text-gray-500">{service.provider}</div>
                  </div>
                </div>
              </button>

              {/* DHL Premium Options */}
              {answers.pickupMethod === service.id && showDHLPremium && (
                <div className="mt-4 ml-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-3">
                    🚀 {t('orderFlow.step6.pickupTimeOptions', 'Välj hämtningstid (valfritt)')}
                  </h4>
                  <div className="space-y-3" role="radiogroup" aria-label={t('orderFlow.step6.pickupTimeOptions', 'Välj hämtningstid (valfritt)')}>
                    {dhlTimeOptions.map((premium) => (
                      <label
                        key={premium.id}
                        className="flex items-center space-x-3 cursor-pointer hover:bg-blue-100 p-2 rounded transition-colors"
                        role="radio"
                        aria-checked={answers.premiumPickup === premium.id}
                        tabIndex={0}
                        onKeyDown={(event) => handlePremiumOptionKeyDown(event, premium.id)}
                      >
                        <input
                          type="radio"
                          name="premium-pickup"
                          value={premium.id}
                          checked={answers.premiumPickup === premium.id}
                          onChange={(e) => handlePremiumSelect(e.target.value)}
                          className="h-4 w-4 text-custom-button focus:ring-custom-button border-gray-300"
                          tabIndex={-1}
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {premium.id
                              ? t(`orderFlow.step6.services.${premium.id}.name`, premium.name)
                              : premium.name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {premium.id
                              ? t(`orderFlow.step6.services.${premium.id}.description`, premium.description)
                              : premium.description}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-custom-button">
                          {(() => {
                            if (!premium.id) return t('orderFlow.step6.noExtraCost', '+0 kr');
                            const rawPrice = t(`orderFlow.step6.services.${premium.id}.price`, premium.price);
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
              {answers.pickupMethod === service.id && showStockholmPremium && (
                <div className="mt-4 ml-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-medium text-green-900 mb-3">
                    ⚡ {t('orderFlow.step6.pickupTimeOptionsStockholm', 'Välj hämtningstid (valfritt)')}
                  </h4>
                  <div className="space-y-3" role="radiogroup" aria-label={t('orderFlow.step6.pickupTimeOptionsStockholm', 'Välj hämtningstid (valfritt)')}>
                    {stockholmTimeOptions.map((premium) => (
                      <label
                        key={premium.id}
                        className="flex items-center space-x-3 cursor-pointer hover:bg-green-100 p-2 rounded transition-colors"
                        role="radio"
                        aria-checked={answers.premiumPickup === premium.id}
                        tabIndex={0}
                        onKeyDown={(event) => handlePremiumOptionKeyDown(event, premium.id)}
                      >
                        <input
                          type="radio"
                          name="premium-pickup"
                          value={premium.id}
                          checked={answers.premiumPickup === premium.id}
                          onChange={(e) => handlePremiumSelect(e.target.value)}
                          className="h-4 w-4 text-custom-button focus:ring-custom-button border-gray-300"
                          tabIndex={-1}
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {premium.id
                              ? t(`orderFlow.step6.services.${premium.id}.name`, premium.name)
                              : premium.name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {premium.id
                              ? t(`orderFlow.step6.services.${premium.id}.description`, premium.description)
                              : premium.description}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-custom-button">
                          {(() => {
                            if (!premium.id) return t('orderFlow.step6.noExtraCost', '+0 kr');
                            const rawPrice = t(`orderFlow.step6.services.${premium.id}.price`, premium.price);
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
            </div>
          ))}
            </div>
          )}

          {/* Pricing Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
            <div className="flex items-start">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <h4 className="font-medium text-amber-900 mb-1">
                  {t('orderFlow.step6.priceDisclaimerTitle', 'Observera: Priserna kan variera')}
                </h4>
                <p className="text-sm text-amber-800">
                  {t('orderFlow.step6.priceDisclaimerText', 'De angivna priserna är från-priser och kan variera beroende på vikt, storlek och upphämtningsadress. Det slutgiltiga priset bekräftas vid upphämtning.')}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </StepContainer>
  );
};

export default Step6PickupService;
