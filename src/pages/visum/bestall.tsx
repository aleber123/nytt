import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Seo from '@/components/Seo';
import { VisaOrderAnswers, initialVisaOrderAnswers, VISA_TOTAL_STEPS } from '@/components/order/visa/types';
import type { OrderAnswers } from '@/components/order/types';
import { getAllActivePricingRules } from '@/firebase/pricingService';
import { getVisaTypeForNationality, VisaType } from '@/firebase/visaRequirementsService';
import { OrderSummary } from '@/components/order/OrderSummary';
import { Step6PickupService } from '@/components/order/steps/Step6PickupService';
import Step9ReturnService from '@/components/order/steps/Step9ReturnService';
import Step9bReturnAddress from '@/components/order/steps/Step9bReturnAddress';
import Step9CustomerInfo from '@/components/order/steps/Step9CustomerInfo';

import VisaStep1Destination from '@/components/order/visa/VisaStep1Destination';
import VisaStep2Nationality from '@/components/order/visa/VisaStep2Nationality';
import VisaStep3SelectProduct from '@/components/order/visa/VisaStep3SelectProduct';
import VisaStep4TravelDatesAndDeadline from '@/components/order/visa/VisaStep4TravelDatesAndDeadline';
import VisaStep10Review from '@/components/order/visa/VisaStep10Review';

export default function VisaOrderPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<VisaOrderAnswers>(initialVisaOrderAnswers);
  const [highestStepReached, setHighestStepReached] = useState(1);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [returnServices, setReturnServices] = useState<any[]>([]);
  const [loadingReturnServices, setLoadingReturnServices] = useState(false);
  const [pickupServices, setPickupServices] = useState<any[]>([]);
  const [loadingPickupServices, setLoadingPickupServices] = useState(false);
  const [visaType, setVisaType] = useState<VisaType | null>(null);
  const [loadingVisaType, setLoadingVisaType] = useState(false);
  const currentLocale = router.locale || 'sv';

  // Determine if we need shipping steps based on selected product or visa type
  const selectedProductVisaType = answers.selectedVisaProduct?.visaType;
  const effectiveVisaType = selectedProductVisaType || visaType;
  const needsShipping = effectiveVisaType === 'sticker' || effectiveVisaType === 'both';
  const isEVisaOnly = effectiveVisaType === 'e-visa';
  
  // Total steps: 9 for sticker visa, 6 for e-visa (skip steps 5-7)
  // Flow: 1-Dest, 2-Nat, 3-Product, 4-Dates+Deadline, 5-Pickup, 6-Return, 7-ReturnAddr, 8-CustomerInfo, 9-Review
  const totalSteps = isEVisaOnly ? 6 : 9;

  // Update highest step when moving forward
  useEffect(() => {
    if (currentStep > highestStepReached) {
      setHighestStepReached(currentStep);
    }
  }, [currentStep, highestStepReached]);

  // Load return and pickup services from Firebase (only if needed)
  useEffect(() => {
    if (needsShipping) {
      loadReturnServices();
      loadPickupServices();
    }
  }, [currentLocale, needsShipping]);

  // Check visa type when destination and nationality are selected
  useEffect(() => {
    const checkVisaType = async () => {
      if (answers.destinationCountryCode && answers.nationalityCode) {
        setLoadingVisaType(true);
        try {
          const result = await getVisaTypeForNationality(
            answers.destinationCountryCode,
            answers.nationalityCode
          );
          setVisaType(result.visaType);
        } catch (error) {
          // Default to sticker if we can't determine
          setVisaType('sticker');
        } finally {
          setLoadingVisaType(false);
        }
      }
    };
    checkVisaType();
  }, [answers.destinationCountryCode, answers.nationalityCode]);

  const getShippingServiceName = (serviceType: string) => {
    const names: { [key: string]: { sv: string; en: string } } = {
      'postnord-rek': { sv: 'PostNord REK', en: 'PostNord REK' },
      'dhl-sweden': { sv: 'DHL Sverige', en: 'DHL Sweden' },
      'dhl-europe': { sv: 'DHL Europa', en: 'DHL Europe' },
      'dhl-worldwide': { sv: 'DHL Världen', en: 'DHL Worldwide' },
      'dhl-pre-12': { sv: 'DHL Pre 12', en: 'DHL Pre 12' },
      'dhl-pre-9': { sv: 'DHL Pre 9', en: 'DHL Pre 9' },
      'stockholm-city': { sv: 'Stockholm City Bud', en: 'Stockholm City Courier' },
      'stockholm-express': { sv: 'Stockholm Express', en: 'Stockholm Express' },
      'stockholm-sameday': { sv: 'Stockholm Samma Dag', en: 'Stockholm Same Day' },
    };
    return names[serviceType]?.[currentLocale as 'sv' | 'en'] || serviceType;
  };

  const getShippingServiceDescription = (serviceType: string) => {
    const descriptions: { [key: string]: { sv: string; en: string } } = {
      'postnord-rek': { sv: 'Rekommenderat brev, 1-3 arbetsdagar', en: 'Registered mail, 1-3 business days' },
      'dhl-sweden': { sv: 'Express inom Sverige, nästa arbetsdag', en: 'Express within Sweden, next business day' },
      'dhl-europe': { sv: 'Express inom Europa, 1-2 arbetsdagar', en: 'Express within Europe, 1-2 business days' },
      'dhl-worldwide': { sv: 'Express världen över, 2-5 arbetsdagar', en: 'Express worldwide, 2-5 business days' },
      'dhl-pre-12': { sv: 'Leverans före kl 12', en: 'Delivery before 12 PM' },
      'dhl-pre-9': { sv: 'Leverans före kl 9', en: 'Delivery before 9 AM' },
      'stockholm-city': { sv: 'Bud inom Stockholm, samma dag', en: 'Courier within Stockholm, same day' },
      'stockholm-express': { sv: 'Expressbud Stockholm, 2-4 timmar', en: 'Express courier Stockholm, 2-4 hours' },
      'stockholm-sameday': { sv: 'Samma dag leverans Stockholm', en: 'Same day delivery Stockholm' },
    };
    return descriptions[serviceType]?.[currentLocale as 'sv' | 'en'] || '';
  };

  const loadReturnServices = async () => {
    try {
      setLoadingReturnServices(true);
      const allRules = await getAllActivePricingRules();
      const shippingRules = allRules.filter(rule =>
        ['postnord-rek', 'dhl-sweden', 'dhl-europe', 'dhl-worldwide', 'dhl-pre-12', 'dhl-pre-9', 'stockholm-city', 'stockholm-express', 'stockholm-sameday'].includes(rule.serviceType)
      );

      const fromText = currentLocale === 'en' ? 'From' : 'Från';
      const servicesFromFirebase = shippingRules.map(rule => ({
        id: rule.serviceType,
        name: getShippingServiceName(rule.serviceType),
        description: getShippingServiceDescription(rule.serviceType),
        price: `${fromText} ${rule.basePrice} kr`,
        priceValue: rule.basePrice,
        provider: rule.serviceType.includes('dhl') ? 'DHL' : rule.serviceType.includes('postnord') ? 'PostNord' : 'Lokal',
        estimatedDelivery: getShippingServiceDescription(rule.serviceType),
        available: true
      }));

      setReturnServices(servicesFromFirebase.length > 0 ? servicesFromFirebase : getDefaultReturnServices());
    } catch (error) {
      setReturnServices(getDefaultReturnServices());
    } finally {
      setLoadingReturnServices(false);
    }
  };

  const loadPickupServices = async () => {
    try {
      setLoadingPickupServices(true);
      const allRules = await getAllActivePricingRules();
      const pickupRules = allRules.filter(rule =>
        ['dhl-sweden', 'dhl-europe', 'dhl-worldwide', 'stockholm-city', 'stockholm-express', 'stockholm-sameday'].includes(rule.serviceType)
      );

      const fromText = currentLocale === 'en' ? 'From' : 'Från';
      const servicesFromFirebase = pickupRules.map(rule => ({
        id: rule.serviceType,
        name: getShippingServiceName(rule.serviceType),
        description: getShippingServiceDescription(rule.serviceType),
        price: `${fromText} ${rule.basePrice} kr`,
        priceValue: rule.basePrice,
        provider: rule.serviceType.includes('dhl') ? 'DHL' : 'Lokal',
        estimatedPickup: getShippingServiceDescription(rule.serviceType),
        available: true
      }));

      setPickupServices(servicesFromFirebase.length > 0 ? servicesFromFirebase : getDefaultPickupServices());
    } catch (error) {
      setPickupServices(getDefaultPickupServices());
    } finally {
      setLoadingPickupServices(false);
    }
  };

  const getDefaultReturnServices = () => {
    const fromText = currentLocale === 'en' ? 'From' : 'Från';
    return [
      { id: 'postnord-rek', name: 'PostNord REK', description: getShippingServiceDescription('postnord-rek'), price: `${fromText} 85 kr`, priceValue: 85, provider: 'PostNord', available: true },
      { id: 'dhl-sweden', name: 'DHL Sweden', description: getShippingServiceDescription('dhl-sweden'), price: `${fromText} 180 kr`, priceValue: 180, provider: 'DHL', available: true },
    ];
  };

  const getDefaultPickupServices = () => {
    const fromText = currentLocale === 'en' ? 'From' : 'Från';
    return [
      { id: 'dhl-sweden', name: 'DHL Sweden', description: getShippingServiceDescription('dhl-sweden'), price: `${fromText} 180 kr`, priceValue: 180, provider: 'DHL', available: true },
    ];
  };

  const updateAnswers = (updates: Partial<VisaOrderAnswers>) => {
    setAnswers((prev) => ({ ...prev, ...updates }));
  };

  const goToNext = useCallback(() => {
    setCurrentStep((prev) => {
      let nextStep = prev + 1;
      // If e-visa only, skip shipping steps (5-7) and go to customer info (step 8)
      if (isEVisaOnly && prev === 4) {
        nextStep = 8;
      }
      if (nextStep <= 9) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return nextStep;
      }
      return prev;
    });
  }, [isEVisaOnly]);

  const goToPrevious = () => {
    let prevStep = currentStep - 1;
    
    // If e-visa only and on customer info step (8), go back to step 4 (dates+deadline)
    if (isEVisaOnly && currentStep === 8) {
      prevStep = 4;
    }
    
    if (prevStep >= 1) {
      setCurrentStep(prevStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderStep = () => {
    const commonProps = {
      answers,
      onUpdate: updateAnswers,
      onNext: goToNext,
      onBack: goToPrevious,
    };

    // Flow: 1-Dest, 2-Nat, 3-Product, 4-Dates+Deadline, 5-Pickup, 6-Return, 7-ReturnAddr, 8-CustomerInfo, 9-Review
    switch (currentStep) {
      case 1:
        return <VisaStep1Destination {...commonProps} />;
      case 2:
        return <VisaStep2Nationality {...commonProps} />;
      case 3:
        return <VisaStep3SelectProduct {...commonProps} locale={currentLocale} />;
      case 4:
        return <VisaStep4TravelDatesAndDeadline {...commonProps} />;
      case 5:
        return (
          <Step6PickupService
            answers={answers as OrderAnswers}
            setAnswers={setAnswers as any}
            onNext={goToNext}
            onBack={goToPrevious}
            currentLocale={currentLocale}
            pickupServices={pickupServices}
            loadingPickupServices={loadingPickupServices}
          />
        );
      case 6:
        return (
          <Step9ReturnService
            answers={answers as OrderAnswers}
            setAnswers={setAnswers as any}
            onNext={goToNext}
            onBack={goToPrevious}
            returnServices={returnServices}
            loadingReturnServices={loadingReturnServices}
          />
        );
      case 7:
        return (
          <Step9bReturnAddress
            answers={answers as OrderAnswers}
            setAnswers={setAnswers as any}
            onNext={goToNext}
            onBack={goToPrevious}
            onSkip={goToNext}
            currentLocale={currentLocale}
          />
        );
      case 8:
        return (
          <Step9CustomerInfo
            answers={answers as OrderAnswers}
            setAnswers={setAnswers as any}
            onNext={goToNext}
            onBack={goToPrevious}
            currentLocale={currentLocale}
            isEVisa={isEVisaOnly}
          />
        );
      case 9:
        return (
          <VisaStep10Review 
            answers={answers}
            onUpdate={updateAnswers}
            onBack={goToPrevious}
            onGoToStep={goToStep}
            isEVisa={isEVisaOnly}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Seo
        title={t('visaOrder.pageTitle', 'Beställ visum | DOX Visumpartner')}
        description={t('visaOrder.pageDescription', 'Beställ visum enkelt och snabbt. Vi hjälper dig med hela processen.')}
      />

      <main className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* Progress indicator */}
          <div className="max-w-2xl mx-auto mb-8">
            {/* Desktop: Detailed step indicator */}
            <div className="hidden md:flex items-center justify-center space-x-2">
              {(isEVisaOnly ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6, 7, 8, 9]).map((displayStep, index) => {
                // Map display step to actual step number for e-visa
                // E-visa: display 1-4 = actual 1-4, display 5 = actual 8 (customer info), display 6 = actual 9 (review)
                let actualStep = displayStep;
                if (isEVisaOnly) {
                  if (displayStep === 5) actualStep = 8;
                  else if (displayStep === 6) actualStep = 9;
                }
                const isCompleted = currentStep > actualStep;
                const isCurrent = actualStep === currentStep;
                const isReachable = highestStepReached >= actualStep;

                return (
                  <div key={displayStep} className="flex items-center">
                    <button
                      onClick={() => {
                        if (isReachable) {
                          goToStep(actualStep);
                        }
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                        isCompleted
                          ? 'bg-custom-button text-white hover:bg-custom-button-hover hover:scale-110 cursor-pointer shadow-md'
                          : isCurrent
                          ? 'bg-custom-button text-white ring-2 ring-custom-button-light ring-offset-2 scale-110 shadow-lg'
                          : isReachable
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer border-2 border-blue-300'
                          : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      }`}
                      disabled={!isReachable}
                    >
                      {isCompleted ? '✓' : displayStep}
                    </button>
                    {index < (isEVisaOnly ? 5 : 8) && (
                      <div className={`w-12 h-1 mx-2 transition-colors duration-200 ${
                        isCompleted ? 'bg-custom-button' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mobile: Simple progress bar */}
            <div className="md:hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {t('visaOrder.progressStep', 'Steg {{current}} av {{total}}', { 
                    current: isEVisaOnly 
                      ? (currentStep === 8 ? 5 : currentStep === 9 ? 6 : currentStep) 
                      : currentStep, 
                    total: totalSteps 
                  })}
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round(((isEVisaOnly 
                    ? (currentStep === 8 ? 5 : currentStep === 9 ? 6 : currentStep) 
                    : currentStep) / totalSteps) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-custom-button h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((isEVisaOnly ? (currentStep === 8 ? 5 : currentStep === 9 ? 6 : currentStep) : currentStep) / totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Toggle for summary sidebar */}
          <div className="flex justify-center lg:justify-end mb-6">
            <button
              type="button"
              onClick={() => setIsSummaryExpanded((prev) => !prev)}
              className="inline-flex items-center px-4 py-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              <span className="mr-2">
                {currentLocale === 'en'
                  ? isSummaryExpanded
                    ? 'Hide summary'
                    : 'Show summary'
                  : isSummaryExpanded
                  ? 'Dölj sammanfattning'
                  : 'Visa sammanfattning'}
              </span>
              <svg
                className={`w-4 h-4 text-gray-500 transform transition-transform ${isSummaryExpanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Mobile summary: show directly under toggle */}
          {isSummaryExpanded && (
            <div className="lg:hidden mb-6">
              <VisaOrderSummary answers={answers} currentLocale={currentLocale} t={t} isEVisa={isEVisaOnly} />
            </div>
          )}

          {/* Layout: grid that adapts when summary is expanded/collapsed */}
          <div className={`grid grid-cols-1 ${isSummaryExpanded ? 'lg:grid-cols-3' : ''} gap-8 relative`}>
            {/* Main content - Steps */}
            <div className={isSummaryExpanded ? 'lg:col-span-2 min-h-screen' : 'min-h-screen'}>
              {renderStep()}
            </div>

            {/* Desktop summary sidebar */}
            {isSummaryExpanded && (
              <div className="hidden lg:block">
                <div className="sticky top-24">
                  <VisaOrderSummary answers={answers} currentLocale={currentLocale} t={t} isEVisa={isEVisaOnly} />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

// Visa-specific order summary component
function VisaOrderSummary({ answers, currentLocale, t, isEVisa }: { answers: VisaOrderAnswers; currentLocale: string; t: any; isEVisa?: boolean }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 max-h-[calc(100vh-7rem)] overflow-y-auto">
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          {currentLocale === 'en' ? 'Summary' : 'Sammanfattning'}
        </h3>
      </div>

      {/* Visa Type Badge */}
      {isEVisa !== undefined && (
        <div className="mb-4">
          <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
            isEVisa ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {isEVisa ? (
              <>
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {currentLocale === 'en' ? 'E-Visa' : 'E-Visum'}
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                </svg>
                {currentLocale === 'en' ? 'Sticker Visa' : 'Sticker Visum'}
              </>
            )}
          </div>
        </div>
      )}

      {/* Destination */}
      {answers.destinationCountry && (
        <div className="mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{currentLocale === 'en' ? 'Destination' : 'Destination'}:</span>
            <span className="font-semibold text-gray-900">{answers.destinationCountry}</span>
          </div>
        </div>
      )}

      {/* Nationality */}
      {answers.nationality && (
        <div className="mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{currentLocale === 'en' ? 'Nationality' : 'Nationalitet'}:</span>
            <span className="font-semibold text-gray-900">{answers.nationality}</span>
          </div>
        </div>
      )}

      {/* Selected visa product */}
      {answers.selectedVisaProduct && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              answers.selectedVisaProduct.visaType === 'e-visa' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {answers.selectedVisaProduct.visaType === 'e-visa' ? 'E-Visa' : 'Sticker'}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
              {answers.selectedVisaProduct.entryType === 'single' 
                ? (currentLocale === 'en' ? 'Single' : 'Enkel')
                : answers.selectedVisaProduct.entryType === 'double'
                  ? (currentLocale === 'en' ? 'Double' : 'Dubbel')
                  : (currentLocale === 'en' ? 'Multiple' : 'Flera')}
            </span>
          </div>
          <div className="font-semibold text-gray-900 text-sm">
            {currentLocale === 'en' && answers.selectedVisaProduct.nameEn ? answers.selectedVisaProduct.nameEn : answers.selectedVisaProduct.name}
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              {answers.selectedVisaProduct.validityDays} {currentLocale === 'en' ? 'days' : 'dagar'}
            </span>
            <span className="font-bold text-green-600">
              {(() => {
                const tc = (answers.travelers || []).filter(t => t.firstName.trim() && t.lastName.trim()).length || 1;
                const perPerson = answers.selectedVisaProduct!.price + 
                  (answers.expressRequired ? (answers.selectedVisaProduct!.expressPrice || 0) : 0) + 
                  (answers.urgentRequired ? (answers.selectedVisaProduct!.urgentPrice || 0) : 0) +
                  (answers.selectedAddOnServices || []).reduce((sum, a) => sum + a.price, 0);
                return (perPerson * tc).toLocaleString();
              })()} kr
            </span>
          </div>
          {/* Show fee breakdown */}
          <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>{currentLocale === 'en' ? 'Base price' : 'Grundpris'}:</span>
              <span>{answers.selectedVisaProduct.price.toLocaleString()} kr</span>
            </div>
            {answers.expressRequired && answers.selectedVisaProduct.expressPrice && (
              <div className="flex justify-between text-orange-600">
                <span>{currentLocale === 'en' ? 'Express fee' : 'Expressavgift'}:</span>
                <span>+{answers.selectedVisaProduct.expressPrice.toLocaleString()} kr</span>
              </div>
            )}
            {answers.urgentRequired && answers.selectedVisaProduct.urgentPrice && (
              <div className="flex justify-between text-red-600">
                <span>{currentLocale === 'en' ? 'Urgent fee' : 'Brådskande avgift'}:</span>
                <span>+{answers.selectedVisaProduct.urgentPrice.toLocaleString()} kr</span>
              </div>
            )}
            {answers.selectedAddOnServices && answers.selectedAddOnServices.map(addon => (
              <div key={addon.id} className="flex justify-between text-purple-600">
                <span>{currentLocale === 'en' ? addon.nameEn : addon.name}:</span>
                <span>+{addon.price.toLocaleString()} kr</span>
              </div>
            ))}
            {(answers.travelers || []).filter(t => t.firstName.trim() && t.lastName.trim()).length > 1 && (
              <div className="flex justify-between font-medium text-gray-700 pt-1 border-t border-gray-100">
                <span>{currentLocale === 'en' ? 'Travelers' : 'Resenärer'}:</span>
                <span>× {(answers.travelers || []).filter(t => t.firstName.trim() && t.lastName.trim()).length}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Travelers */}
      {(answers.travelers || []).filter(t => t.firstName.trim() && t.lastName.trim()).length > 0 && (
        <div className="mb-3 pt-3 border-t border-gray-200">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            {currentLocale === 'en' ? 'Travelers' : 'Resenärer'} ({(answers.travelers || []).filter(t => t.firstName.trim() && t.lastName.trim()).length})
          </div>
          {(answers.travelers || []).filter(t => t.firstName.trim() && t.lastName.trim()).map((t, i) => (
            <div key={i} className="flex items-center text-sm text-gray-900 mb-1">
              <svg className="w-3.5 h-3.5 text-gray-400 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {t.firstName} {t.lastName}
            </div>
          ))}
        </div>
      )}

      {/* Travel dates */}
      {answers.departureDate && (
        <div className="mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{currentLocale === 'en' ? 'Departure' : 'Avresa'}:</span>
            <span className="font-semibold text-gray-900">{answers.departureDate}</span>
          </div>
        </div>
      )}

      {answers.returnDateVisa && (
        <div className="mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{currentLocale === 'en' ? 'Return' : 'Hemresa'}:</span>
            <span className="font-semibold text-gray-900">{answers.returnDateVisa}</span>
          </div>
        </div>
      )}

      {/* Pickup service */}
      {answers.pickupService && answers.pickupMethod && (
        <div className="mb-3 pt-3 border-t border-gray-200">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-gray-900">{currentLocale === 'en' ? 'Pickup service' : 'Upphämtning'}</span>
          </div>
        </div>
      )}

      {/* Return service */}
      {answers.returnService && (
        <div className="mb-3">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-gray-900">{currentLocale === 'en' ? 'Return shipping' : 'Returfrakt'}</span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!answers.destinationCountry && !answers.nationality && (
        <div className="text-center py-8">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm text-gray-500">{currentLocale === 'en' ? 'Start your order' : 'Börja din beställning'}</p>
        </div>
      )}
    </div>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'sv', ['common'])),
    },
  };
};
