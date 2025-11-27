/**
 * Step 3: Services Selection
 * Allows customer to select legalization services based on destination country
 * Dynamically loads services from Firebase and filters based on Hague Convention status
 */

import React from 'react';
import { useTranslation } from 'next-i18next';
import { StepContainer } from '../shared/StepContainer';
import { StepProps, Service } from '../types';
import { HAGUE_CONVENTION_COUNTRIES } from '../data/countries';

interface Step3Props extends StepProps {
  availableServices: Service[];
  loadingServices: boolean;
  allCountries?: any[];
}

export const Step3ServicesSelection: React.FC<Step3Props> = ({
  answers,
  setAnswers,
  onNext,
  onBack,
  availableServices,
  loadingServices,
  currentLocale,
  allCountries
}) => {
  const { t } = useTranslation('common');

  const isHagueCountry = HAGUE_CONVENTION_COUNTRIES.includes(answers.country);

  const handleToggleService = (serviceId: string) => {
    const isSelected = answers.services.includes(serviceId);
    
    if (isSelected) {
      setAnswers({
        ...answers,
        services: answers.services.filter(s => s !== serviceId)
      });
    } else {
      setAnswers({
        ...answers,
        services: [...answers.services, serviceId]
      });
    }
  };

  const getCountryName = (countryCode: string) => {
    try {
      if (countryCode && countryCode.length === 2) {
        const displayNames = new Intl.DisplayNames([currentLocale], { type: 'region' });
        const localized = displayNames.of(countryCode);
        if (localized && typeof localized === 'string') return localized;
      }
    } catch {}
    return t(`countries.names.${countryCode}`, { defaultValue: countryCode });
  };

  const getDocumentTypeName = () => {
    const typeMap: { [key: string]: string } = {
      birthCertificate: t('orderFlow.step2.birthCertificate', 'Födelsebevis'),
      marriageCertificate: t('orderFlow.step2.marriageCertificate', 'Vigselbevis'),
      diploma: t('orderFlow.step2.diploma', 'Examensbevis'),
      commercial: t('orderFlow.step2.commercial', 'Handelsdokument'),
      powerOfAttorney: t('orderFlow.step2.powerOfAttorney', 'Fullmakt'),
      other: t('orderFlow.step2.other', 'Annat dokument')
    };
    if (Array.isArray(answers.documentTypes) && answers.documentTypes.length > 0) {
      const names = answers.documentTypes.map((type) => typeMap[type] || type);
      return names.join(', ');
    }

    return typeMap[answers.documentType] || answers.documentType;
  };

  const getServiceBadge = (serviceId: string) => {
    const badges: { [key: string]: { text: string; color: string; description?: string } } = {
      apostille: {
        text: t('orderFlow.step3.apostilleRecommended', 'Rekommenderas'),
        color: 'bg-green-100 text-green-800'
      },
      chamber: {
        text: t('orderFlow.step3.chamberStep', 'Steg 1'),
        color: 'bg-orange-100 text-orange-800',
        description: t('orderFlow.step3.chamberDescription', 'Handelskammarens legalisering')
      },
      notarization: {
        text: t('orderFlow.step3.notarizationStep', 'Steg 1'),
        color: 'bg-green-100 text-green-800',
        description: t('orderFlow.step3.notarizationDescription', 'Notarius publicus')
      },
      ud: {
        text: t('orderFlow.step3.udStep', 'Steg 2'),
        color: 'bg-purple-100 text-purple-800'
      },
      embassy: {
        text: t('orderFlow.step3.embassyStep', 'Steg 3'),
        color: 'bg-blue-100 text-blue-800'
      }
    };
    return badges[serviceId];
  };

  const handleServiceKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, serviceId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggleService(serviceId);
    }
  };

  return (
    <StepContainer
      title={t('orderFlow.step3.title', 'Välj tjänster')}
      subtitle={t('orderFlow.step3.subtitle', 'Vilka tjänster behöver du?')}
      onNext={onNext}
      onBack={onBack}
      nextDisabled={answers.services.length === 0}
    >
      {/* Country & Document Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <span className="text-2xl mr-3">
            {allCountries?.find(c => c.code === answers.country)?.flag || '🌍'}
          </span>
          <div>
            <div className="font-medium text-blue-900">
              {t('orderFlow.step3.selectedCountry', { country: getCountryName(answers.country) })}
            </div>
            <div className="text-sm text-blue-700">
              {t('orderFlow.step3.selectedDocument', { document: getDocumentTypeName() })}
            </div>
          </div>
        </div>
      </div>


      {/* Loading State */}
      {loadingServices && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-custom-button"></div>
          <p className="mt-2 text-gray-600">{t('orderFlow.step3.loadingServices', 'Laddar tillgängliga tjänster...')}</p>
        </div>
      )}

      {/* Services List */}
      {!loadingServices && (
        <div className="space-y-4">
          {availableServices.map((service) => {
            const isSelected = answers.services.includes(service.id);
            const badge = getServiceBadge(service.id);

            return (
              <div
                key={service.id}
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => handleToggleService(service.id)}
                onKeyDown={(event) => handleServiceKeyDown(event, service.id)}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-custom-button bg-custom-button-bg shadow-md'
                    : 'border-gray-200 hover:border-custom-button-light hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">{service.name}</h3>
                    <p className="text-gray-600 mb-2">{service.description}</p>
                    <span className="text-custom-button font-medium">{service.price}</span>
                    
                    {/* Service Badge */}
                    {badge && (
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${badge.color}`}>
                          {badge.text}
                        </span>
                        {badge.description && (
                          <p className="text-xs text-gray-600 mt-1">{badge.description}</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Checkbox */}
                  <div className="ml-4 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleToggleService(service.id);
                      }}
                      className="h-5 w-5 accent-custom-button rounded focus:ring-custom-button pointer-events-none"
                      tabIndex={-1}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No Services Available */}
      {!loadingServices && availableServices.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">
            {t('orderFlow.step3.noServices', 'Inga tjänster tillgängliga för detta land')}
          </p>
        </div>
      )}

      {/* Help Text removed per new design */}
    </StepContainer>
  );
};

export default Step3ServicesSelection;
