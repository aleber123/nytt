/**
 * Step 9: Return Service Selection
 * Allows customer to select how they want their documents returned
 * Includes premium delivery options for DHL and Stockholm City Courier
 */

import React from 'react';
import { useTranslation } from 'next-i18next';
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

interface Step9Props extends StepProps {
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

  const handleServiceSelect = (serviceId: string) => {
    setAnswers({
      ...answers,
      returnService: serviceId,
      premiumDelivery: '' // Reset premium delivery when changing base service
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
  const dhlPremiumOptions = returnServices.filter(
    service => ['dhl-pre-12', 'dhl-pre-9'].includes(service.id)
  );

  // Premium Stockholm options
  const stockholmPremiumOptions = returnServices.filter(
    service => ['stockholm-express', 'stockholm-sameday'].includes(service.id)
  );

  const showDHLPremium = answers.returnService && ['dhl-sweden', 'dhl-europe', 'dhl-worldwide'].includes(answers.returnService);
  const showStockholmPremium = answers.returnService === 'stockholm-city';

  return (
    <StepContainer
      title={t('orderFlow.step9.title', 'Välj returleverans')}
      subtitle={t('orderFlow.step9.subtitle', 'Hur vill du få tillbaka dina legaliserade dokument?')}
      onNext={onNext}
      onBack={onBack}
      nextDisabled={!answers.returnService}
    >
      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <span className="text-2xl mr-3">📦</span>
          <div>
            <div className="font-medium text-blue-900">
              {t('orderFlow.step9.returnNote', 'Säker returleverans')}
            </div>
            <div className="text-sm text-blue-700">
              {t('orderFlow.step9.returnDescription', 'Vi skickar tillbaka dina dokument säkert och spårbart')}
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loadingReturnServices && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">
            {t('orderFlow.step10.loadingServices', 'Laddar leveransalternativ...')}
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
                className={`w-full p-6 border-2 rounded-lg hover:border-custom-button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button ${
                  answers.returnService === service.id
                    ? 'border-custom-button bg-custom-button-bg'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-left">
                      <div className="text-lg font-medium text-gray-900">{service.name}</div>
                      <div className="text-gray-600">{service.description}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Leveranstid: {service.estimatedDelivery}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-custom-button">{service.price}</div>
                    <div className="text-xs text-gray-500">{service.provider}</div>
                  </div>
                </div>
              </button>

              {/* DHL Premium Options */}
              {answers.returnService === service.id && showDHLPremium && (
                <div className="mt-4 ml-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-3">
                    🚀 Premiumleverans (valfritt)
                  </h4>
                  <div className="space-y-3">
                    {dhlPremiumOptions.map((premium) => (
                      <label
                        key={premium.id}
                        className="flex items-center space-x-3 cursor-pointer hover:bg-blue-100 p-2 rounded transition-colors"
                      >
                        <input
                          type="radio"
                          name="premium-delivery"
                          value={premium.id}
                          checked={answers.premiumDelivery === premium.id}
                          onChange={(e) => handlePremiumSelect(e.target.value)}
                          className="h-4 w-4 text-custom-button focus:ring-custom-button border-gray-300"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{premium.name}</div>
                          <div className="text-xs text-gray-600">{premium.description}</div>
                          <div className="text-xs text-gray-500">
                            Leveranstid: {premium.estimatedDelivery}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-custom-button">{premium.price}</div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Stockholm Premium Options */}
              {answers.returnService === service.id && showStockholmPremium && (
                <div className="mt-4 ml-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-medium text-green-900 mb-3">
                    ⚡ Expressleverans (valfritt)
                  </h4>
                  <div className="space-y-3">
                    {stockholmPremiumOptions.map((premium) => (
                      <label
                        key={premium.id}
                        className="flex items-center space-x-3 cursor-pointer hover:bg-green-100 p-2 rounded transition-colors"
                      >
                        <input
                          type="radio"
                          name="premium-delivery"
                          value={premium.id}
                          checked={answers.premiumDelivery === premium.id}
                          onChange={(e) => handlePremiumSelect(e.target.value)}
                          className="h-4 w-4 text-custom-button focus:ring-custom-button border-gray-300"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{premium.name}</div>
                          <div className="text-xs text-gray-600">{premium.description}</div>
                          <div className="text-xs text-gray-500">
                            Leveranstid: {premium.estimatedDelivery}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-custom-button">{premium.price}</div>
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
              Observera: Priserna kan variera
            </h4>
            <p className="text-sm text-amber-800">
              De angivna priserna är från-priser och kan variera beroende på vikt, storlek och
              destinationsadress. Det slutgiltiga priset bekräftas vid leverans.
            </p>
          </div>
        </div>
      </div>
    </StepContainer>
  );
};

export default Step9ReturnService;
