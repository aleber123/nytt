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
import CountryFlag from '../../ui/CountryFlag';

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

  const [isNotarizationModalOpen, setIsNotarizationModalOpen] = React.useState(false);

  const handleToggleService = (serviceId: string) => {
    const isSelected = answers.services.includes(serviceId);
    
    if (isSelected) {
      const updatedServices = answers.services.filter(s => s !== serviceId);
      const updatedAnswers = {
        ...answers,
        services: updatedServices
      };

      // Reset notarization details and related supporting docs if notarization is deselected
      if (serviceId === 'notarization') {
        (updatedAnswers as any).notarizationDetails = {
          signature: false,
          signingAuthority: false,
          copy: false,
          unknown: false,
          other: false,
          otherText: ''
        };
        (updatedAnswers as any).idDocumentFile = null;
        (updatedAnswers as any).signingAuthorityFile = null;
        (updatedAnswers as any).willSendIdDocumentLater = false;
        (updatedAnswers as any).willSendSigningAuthorityLater = false;
      }

      setAnswers(updatedAnswers);
    } else {
      const updatedServices = [...answers.services, serviceId];
      setAnswers({
        ...answers,
        services: updatedServices,
        helpMeChooseServices: false
      });

      if (serviceId === 'notarization') {
        setIsNotarizationModalOpen(true);
      }
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
      birthCertificate: t('orderFlow.step2.birthCertificate', { defaultValue: 'Birth Certificate' }),
      marriageCertificate: t('orderFlow.step2.marriageCertificate', { defaultValue: 'Marriage Certificate' }),
      certificateOfOrigin: t('orderFlow.step2.certificateOfOrigin', { defaultValue: 'Certificate of Origin (COO)' }),
      diploma: t('orderFlow.step2.diploma', { defaultValue: 'Diploma' }),
      passport: t('orderFlow.step2.passport', { defaultValue: 'Passport' }),
      commercial: t('orderFlow.step2.commercial', { defaultValue: 'Commercial Documents' }),
      powerOfAttorney: t('orderFlow.step2.powerOfAttorney', { defaultValue: 'Power of Attorney' }),
      other: t('orderFlow.step2.other', { defaultValue: 'Other document' })
    };
    if (Array.isArray(answers.documentTypes) && answers.documentTypes.length > 0) {
      const names = answers.documentTypes.map((type) => typeMap[type] || type);
      return names.join(', ');
    }

    return typeMap[answers.documentType] || answers.documentType;
  };

  const hasNotarizationSelected = answers.services.includes('notarization');

  const notarizationDetails = answers.notarizationDetails || {
    signature: false,
    signingAuthority: false,
    copy: false,
    unknown: false,
    other: false,
    otherText: ''
  };

  const updateNotarizationDetails = (patch: Partial<typeof notarizationDetails>) => {
    let next = {
      ...notarizationDetails,
      ...patch
    };

    // If customer selects "Vet ej / Not sure", clear the other options for clarity
    if (patch.unknown) {
      if (patch.unknown === true) {
        next = {
          signature: false,
          signingAuthority: false,
          copy: false,
          other: false,
          otherText: '',
          unknown: true
        };
      } else {
        next.unknown = false;
      }
    }

    setAnswers({
      ...answers,
      notarizationDetails: next
    });
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

  const handleToggleHelpMeChoose = () => {
    const newValue = !answers.helpMeChooseServices;

    if (newValue) {
      setAnswers({
        ...answers,
        helpMeChooseServices: true,
        services: [],
        billingInfo: {
          ...answers.billingInfo,
          sameAsReturn: false
        }
      });
    } else {
      setAnswers({
        ...answers,
        helpMeChooseServices: false
      });
    }
  };

  return (
    <StepContainer
      title={t('orderFlow.step3.title', 'Vilka tjänster behöver du?')}
      subtitle={t(
        'orderFlow.step3.subtitle',
        'Baserat på ditt valda land rekommenderar vi följande tjänster.'
      )}
      centerTitle
      onNext={onNext}
      onBack={onBack}
      nextDisabled={answers.services.length === 0 && !answers.helpMeChooseServices}
    >
      {/* Country & Document Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <span className="text-2xl mr-3">
            <CountryFlag code={answers.country} size={24} />
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
        </div>
      )}

      {/* Services List */}
      {!loadingServices && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-1 break-words">{service.name}</h3>
                    {/* <p className="text-gray-600 mb-2">{service.description}</p> */}
                    <span className="text-custom-button font-medium break-words">{service.price}</span>

                    {/* Service Badge (temporarily hidden to reduce text in cards)
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
                    */}
                  </div>
                  
                  {/* Checkbox */}
                  <div className="flex-shrink-0 self-start sm:self-auto sm:ml-4">
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

          {/* Help me choose option */}
          <div
            role="checkbox"
            aria-checked={answers.helpMeChooseServices}
            tabIndex={0}
            onClick={handleToggleHelpMeChoose}
            onKeyDown={(event) => handleServiceKeyDown(event, 'helpMeChoose')}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
              answers.helpMeChooseServices
                ? 'border-custom-button bg-custom-button-bg shadow-md'
                : 'border-gray-200 hover:border-custom-button-light hover:bg-gray-50'
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {t('orderFlow.step3.helpMeChooseTitle', 'Vet ej vilka tjänster jag behöver')}
                </h3>
                {/*
                <p className="text-gray-600 mb-2">
                  {t(
                    'orderFlow.step3.helpMeChooseDescription',
                    'Välj detta om du är osäker. En handläggare går igenom ditt ärende och kontaktar dig med förslag och pris.'
                  )}
                </p>
                */}
                <span className="text-custom-button font-medium">
                  {t('orderFlow.step3.translationOnRequest', currentLocale === 'en' ? 'On request' : 'På förfrågan')}
                </span>
              </div>

              <div className="flex-shrink-0 self-start sm:self-auto sm:ml-4">
                <input
                  type="checkbox"
                  checked={answers.helpMeChooseServices}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleToggleHelpMeChoose();
                  }}
                  className="h-5 w-5 accent-custom-button rounded focus:ring-custom-button pointer-events-none"
                  tabIndex={-1}
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notarization details modal - only when notarization service is selected */}
      {hasNotarizationSelected && isNotarizationModalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsNotarizationModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">
                  {t('orderFlow.step3.notarizationDetailsTitle', 'Vilken typ av notarisering behövs?')}
                </h4>
                <p className="mt-1 text-sm text-gray-600">
                  {t(
                    'orderFlow.step3.notarizationDetailsInfo',
                    'Du kan välja flera alternativ eller markera "Vet ej" om du är osäker.'
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNotarizationModalOpen(false)}
                className="inline-flex items-center justify-center rounded-full p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-custom-button"
                aria-label="Stäng"
              >
                <span className="text-2xl leading-none">×</span>
              </button>
            </div>

            <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-5 w-5 text-custom-button focus:ring-custom-button border-gray-300 rounded"
                  checked={notarizationDetails.signature}
                  onChange={(e) => updateNotarizationDetails({ signature: e.target.checked, unknown: false })}
                />
                <span className="text-sm md:text-base text-gray-900">
                  {t('orderFlow.step3.notarizationOptionSignature', 'Bestyrka signatur')}
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-5 w-5 text-custom-button focus:ring-custom-button border-gray-300 rounded"
                  checked={notarizationDetails.signingAuthority}
                  onChange={(e) => updateNotarizationDetails({ signingAuthority: e.target.checked, unknown: false })}
                />
                <span className="text-sm md:text-base text-gray-900">
                  {t('orderFlow.step3.notarizationOptionSigningAuthority', 'Verifiera rätt att signera')}
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-5 w-5 text-custom-button focus:ring-custom-button border-gray-300 rounded"
                  checked={notarizationDetails.copy}
                  onChange={(e) => updateNotarizationDetails({ copy: e.target.checked, unknown: false })}
                />
                <span className="text-sm md:text-base text-gray-900">
                  {t('orderFlow.step3.notarizationOptionCopy', 'Bestyrka kopia')}
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-5 w-5 text-custom-button focus:ring-custom-button border-gray-300 rounded"
                  checked={notarizationDetails.other}
                  onChange={(e) => updateNotarizationDetails({ other: e.target.checked, unknown: false })}
                />
                <span className="text-sm md:text-base text-gray-900">
                  {t('orderFlow.step3.notarizationOptionOther', 'Annat')}
                </span>
              </label>

              {notarizationDetails.other && (
                <div className="pt-1">
                  <input
                    type="text"
                    value={notarizationDetails.otherText}
                    onChange={(e) => updateNotarizationDetails({ otherText: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-custom-button"
                    placeholder={t(
                      'orderFlow.step3.notarizationOptionOtherPlaceholder',
                      'Beskriv annan typ av notarisering...'
                    )}
                  />
                </div>
              )}

              <label className="flex items-center space-x-3 pt-3 border-t border-gray-200 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-5 w-5 text-custom-button focus:ring-custom-button border-gray-300 rounded"
                  checked={notarizationDetails.unknown}
                  onChange={(e) => updateNotarizationDetails({ unknown: e.target.checked })}
                />
                <span className="text-sm md:text-base text-gray-900">
                  {t('orderFlow.step3.notarizationOptionUnknown', 'Vet ej')}
                </span>
              </label>
            </div>

            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex justify-end bg-gray-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setIsNotarizationModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-custom-button rounded-full hover:bg-custom-button-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-custom-button transition-colors"
              >
                {t('orderFlow.step3.notarizationModalClose', 'Klar')}
              </button>
            </div>
          </div>
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
