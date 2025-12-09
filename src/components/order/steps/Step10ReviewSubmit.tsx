/**
 * Step 10: Review & Submit
 * Final review of order with customer information, file uploads, and payment
 * This is a complex component that handles the entire order submission process
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import ReCAPTCHA from 'react-google-recaptcha';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { createOrderWithFiles } from '@/services/hybridOrderService';
import { calculateOrderPrice } from '@/firebase/pricingService';
import { printShippingLabel } from '@/services/shippingLabelService';
import { StepProps } from '../types';
import CountryFlag from '../../ui/CountryFlag';

interface Step10Props extends Omit<StepProps, 'currentLocale'> {
  allCountries: any[];
  returnServices: any[];
  loadingReturnServices: boolean;
  pricingBreakdown: any[];
  loadingPricing: boolean;
  totalPrice: number;
  recaptchaRef: React.RefObject<ReCAPTCHA>;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  currentLocale?: string;
}

export const Step10ReviewSubmit: React.FC<Step10Props> = ({
  answers,
  setAnswers,
  onBack,
  allCountries,
  returnServices,
  loadingReturnServices,
  pricingBreakdown,
  loadingPricing,
  totalPrice,
  recaptchaRef,
  isSubmitting,
  onSubmit,
  currentLocale
}) => {
  const { t } = useTranslation('common');
  const router = useRouter();

  const locale = currentLocale || router.locale || 'sv';

  // Local state for Step 10
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const [isInCooldown, setIsInCooldown] = useState(false);
  const submissionInProgressRef = useRef(false);
  const cooldownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [returnCountrySearch, setReturnCountrySearch] = useState('');
  const [showReturnCountryDropdown, setShowReturnCountryDropdown] = useState(false);
  const returnCountryDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (returnCountryDropdownRef.current && !returnCountryDropdownRef.current.contains(event.target as Node)) {
        setShowReturnCountryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReturnCountrySelect = (countryCode: string) => {
    const country = allCountries.find((c: any) => c.code === countryCode);
    setAnswers(prev => ({
      ...prev,
      customerInfo: {
        ...prev.customerInfo,
        countryCode: countryCode,
        country: country ? getLocalizedCountryName(country.code) : ''
      }
    }));
    setReturnCountrySearch(country ? getLocalizedCountryName(country.code) : '');
    setShowReturnCountryDropdown(false);
  };

  const addressInputRef = useRef<HTMLInputElement | null>(null);

  // Helper function to get service name
  const getServiceName = (serviceType: string) => {
    const names: { [key: string]: string } = {
      apostille: t('services.apostille.title'),
      notarization: t('services.notarization.title'),
      embassy: t('services.embassy.title'),
      ud: t('services.ud.title'),
      translation: t('services.translation.title'),
      chamber: t('services.chamber.title')
    };
    return names[serviceType] || serviceType;
  };

  const translatePricingDescription = (description: string) => {
    if (!description) return '';
    if (locale === 'en') {
      if (description.startsWith('Handelskammarens legalisering - Officiell avgift')) {
        return description.replace(
          'Handelskammarens legalisering - Officiell avgift',
          'Chamber of Commerce legalization - Official fee'
        );
      }
      if (description.startsWith('Handelskammarens legalisering - Serviceavgift')) {
        return description.replace(
          'Handelskammarens legalisering - Serviceavgift',
          'Chamber of Commerce legalization - Service fee'
        );
      }
      if (description.startsWith('Notarisering - Officiell avgift')) {
        return description.replace(
          'Notarisering - Officiell avgift',
          'Notarization - Official fee'
        );
      }
      if (description.startsWith('Notarisering - Serviceavgift')) {
        return description.replace(
          'Notarisering - Serviceavgift',
          'Notarization - Service fee'
        );
      }
      if (description.startsWith('Skannade kopior')) {
        return description.replace('Skannade kopior', 'Scanned copies');
      }
    }
    return description;
  };

  const getLocalizedCountryName = (countryCode: string) => {
    try {
      if (typeof Intl !== 'undefined' && (Intl as any).DisplayNames && countryCode && countryCode.length === 2) {
        const displayNames = new Intl.DisplayNames([locale], { type: 'region' });
        const localized = displayNames.of(countryCode);
        if (localized && typeof localized === 'string') return localized;
      }
    } catch {}
    return t(`countries.names.${countryCode}`, { defaultValue: countryCode });
  };

  const uniqueCountries = React.useMemo(() => {
    const seen = new Set<string>();
    return allCountries.filter((c: any) => {
      if (!c || !c.code) return false;
      if (seen.has(c.code)) return false;
      seen.add(c.code);
      return true;
    });
  }, [allCountries]);

  // Dummy clearProgress function (should be passed as prop ideally)
  const clearProgress = () => {
    // This would normally clear saved progress
    sessionStorage.removeItem('orderDraft');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {t('orderFlow.step10.title')}
        </h1>
        <p className="text-lg text-gray-600">
          {t('orderFlow.step10.subtitle')}
        </p>
      </div>

      {/* Final Order Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4">
          {t('orderFlow.step10.summaryTitle')}
        </h3>

        <div className="space-y-3">
          {/* Country and Document Type */}
          <div className="flex justify-between items-center py-2 border-b border-green-200">
            <span className="text-gray-700">{t('orderFlow.step10.country')}:</span>
            <span className="font-medium text-gray-900">
              {(() => {
                const code = answers.country;
                const name = getLocalizedCountryName(code);
                return (
                  <span className="inline-flex items-center space-x-1">
                    <CountryFlag code={code} size={20} />
                    <span>{name}</span>
                  </span>
                );
              })()}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-green-200">
            <span className="text-gray-700">{t('orderFlow.step10.documentType')}:</span>
            <span className="font-medium text-gray-900">
              {answers.documentType === 'birthCertificate' ? t('orderFlow.step2.birthCertificate') :
               answers.documentType === 'marriageCertificate' ? t('orderFlow.step2.marriageCertificate') :
               answers.documentType === 'diploma' ? t('orderFlow.step2.diploma') :
               answers.documentType === 'commercial' ? t('orderFlow.step2.commercial') :
               answers.documentType === 'powerOfAttorney' ? t('orderFlow.step2.powerOfAttorney') : t('orderFlow.step2.other')}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-green-200">
            <span className="text-gray-700">{t('orderFlow.step10.quantity')}:</span>
            <span className="font-medium text-gray-900">{answers.quantity} st</span>
          </div>

          {/* Selected Services */}
          <div className="py-2">
            <span className="text-gray-700 font-medium">{t('orderFlow.step10.services')}:</span>
            <div className="mt-2 space-y-2">
              {loadingPricing ? (
                <div className="text-sm text-gray-500">Beräknar priser...</div>
              ) : (
                pricingBreakdown.map((item, index) => (
                  <div key={`${item.service}_${index}`} className="text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        • {translatePricingDescription(item.description)}{' '}
                        {item.quantity && item.quantity > 1 && item.unitPrice ? `(${item.unitPrice} kr × ${item.quantity})` : ''}
                      </span>
                      <span className="font-medium text-gray-900">{item.total || 0} kr</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Additional Services */}
          {answers.expedited && (
            <div className="flex justify-between items-center py-2 border-b border-green-200">
              <span className="text-gray-700">{t('orderFlow.step10.expedited')}:</span>
              <span className="font-medium text-gray-900">500 kr</span>
            </div>
          )}

          {answers.pickupService && (
            <div className="flex justify-between items-center py-2 border-b border-green-200">
              <span className="text-gray-700">{t('orderFlow.step10.pickup')}:</span>
              <span className="font-medium text-gray-900">Från 450 kr</span>
            </div>
          )}


          {answers.returnService && (
            <>
              <div className="py-2">
                <span className="text-gray-700 font-medium">{t('orderFlow.step10.returnShipping')}:</span>
                <div className="mt-2 space-y-2">
                  <div className="text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        • {(() => {
                          const returnService = returnServices.find(s => s.id === answers.returnService);
                          const isOwnReturn = answers.returnService === 'own-delivery';
                          const isOfficePickup = answers.returnService === 'office-pickup';

                          const label = isOwnReturn
                            ? t('orderFlow.step9.ownReturnTitle')
                            : isOfficePickup
                            ? t('orderFlow.step9.officePickupTitle')
                            : returnService?.name || '';

                          return label;
                        })()}
                      </span>
                      <span className="font-medium text-gray-900">
                        {(() => {
                          const returnService = returnServices.find(s => s.id === answers.returnService);
                          let totalReturnCost = 0;

                          if (returnService && returnService.price) {
                            const priceMatch = returnService.price.match(/(\d+)/);
                            if (priceMatch) {
                              totalReturnCost += parseInt(priceMatch[1]);
                            }
                          }

                          // Add premium delivery cost
                          if (answers.premiumDelivery) {
                            const premiumService = returnServices.find(s => s.id === answers.premiumDelivery);
                            if (premiumService && premiumService.price) {
                              const priceMatch = premiumService.price.match(/(\d+)/);
                              if (priceMatch) {
                                totalReturnCost += parseInt(priceMatch[1]);
                              }
                            }
                          }

                          return `${totalReturnCost} kr`;
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {answers.returnService === 'own-delivery' && answers.ownReturnTrackingNumber && (
                <div className="flex justify-between items-center py-2 border-b border-green-200">
                  <span className="text-gray-700">
                    {t('orderFlow.step9.ownReturnTrackingLabel', 'Spårningsnummer')}:
                  </span>
                  <span className="font-medium text-gray-900">
                    {answers.ownReturnTrackingNumber}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Total Price */}
          <div className="flex justify-between items-center py-3 border-t-2 border-green-300 bg-green-100 -mx-6 px-6 rounded-b-lg">
            <span className="text-lg font-semibold text-green-900">{t('orderFlow.step10.total')}:</span>
            <span className="text-xl font-bold text-green-900">
              {(() => {
                if (loadingPricing) return 'Beräknar...';

                // Use totalPrice from pricingBreakdown directly - it already includes everything
                const total = pricingBreakdown.reduce((sum, item) => sum + (item.total || 0), 0);
                
                return `${total.toLocaleString()} kr`;
              })()}
            </span>
          </div>
        </div>
      </div>

      {answers.documentSource === 'upload' ? (
        <div className="space-y-4">
          {/* File Upload Section - Moved to top */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-2xl mr-3">📎</span>
              <div>
                <div className="font-medium text-green-900">
                  Upload {answers.quantity} documents
                </div>
                <div className="text-sm text-green-700">
                  Upload documents in PDF, JPG, PNG format. Files must be clear and readable.
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {Array.from({ length: answers.quantity }, (_, index) => (
              <div key={index} className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-custom-button transition-colors">
                <div className="text-center">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setAnswers(prev => {
                          const newFiles = [...prev.uploadedFiles];
                          newFiles[index] = file;
                          return { ...prev, uploadedFiles: newFiles };
                        });
                      }
                    }}
                    className="hidden"
                    id={`file-upload-${index}`}
                  />
                  <label
                    htmlFor={`file-upload-${index}`}
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <span className="text-4xl mb-2">📄</span>
                    <span className="text-lg font-medium text-gray-900 mb-1">
                      Document {index + 1}
                    </span>
                    {answers.uploadedFiles[index] ? (
                      <span className="text-sm text-green-600 font-medium">
                        ✓ {answers.uploadedFiles[index].name}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-600">
                        Choose file
                      </span>
                    )}
                  </label>
                </div>
              </div>
            ))}
          </div>


          {/* Terms and Conditions Acceptance */}
          <div className="pt-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms-acceptance-original"
                  name="terms-acceptance-original"
                  type="checkbox"
                  className="h-4 w-4 text-custom-button focus:ring-custom-button border-gray-300 rounded"
                  required
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms-acceptance-original" className="text-gray-700">
                  {locale === 'en' ? (
                    <>
                      I have read and accept the{' '}
                      <Link
                        href="/villkor"
                        target="_blank"
                        className="text-custom-button hover:text-custom-button-hover underline"
                      >
                        terms and conditions
                      </Link>{' '}
                      and{' '}
                      <Link
                        href="/integritetspolicy"
                        target="_blank"
                        className="text-custom-button hover:text-custom-button-hover underline"
                      >
                        privacy policy
                      </Link>
                      .
                    </>
                  ) : (
                    <>
                      Jag har läst och accepterar{' '}
                      <Link
                        href="/villkor"
                        target="_blank"
                        className="text-custom-button hover:text-custom-button-hover underline"
                      >
                        allmänna villkor
                      </Link>{' '}
                      och{' '}
                      <Link
                        href="/integritetspolicy"
                        target="_blank"
                        className="text-custom-button hover:text-custom-button-hover underline"
                      >
                        integritetspolicy
                      </Link>
                      .
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Customer Information Form */}
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {locale === 'en' ? 'Customer details' : 'Kunduppgifter'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('orderFlow.step10.firstName')} {t('orderFlow.step10.requiredField')}
                </label>
                <input
                  type="text"
                  value={answers.customerInfo.firstName}
                  onChange={(e) => setAnswers(prev => ({
                    ...prev,
                    customerInfo: { ...prev.customerInfo, firstName: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={t('orderFlow.step10.firstNamePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('orderFlow.step10.lastName')} {t('orderFlow.step10.requiredField')}
                </label>
                <input
                  type="text"
                  value={answers.customerInfo.lastName}
                  onChange={(e) => setAnswers(prev => ({
                    ...prev,
                    customerInfo: { ...prev.customerInfo, lastName: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={t('orderFlow.step10.lastNamePlaceholder')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('orderFlow.step10.email')} {t('orderFlow.step10.requiredField')}
              </label>
              <input
                type="email"
                value={answers.customerInfo.email}
                onChange={(e) => setAnswers(prev => ({
                  ...prev,
                  customerInfo: { ...prev.customerInfo, email: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={t('orderFlow.step10.emailPlaceholder')}
                pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                title="Ange en giltig e-postadress"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('orderFlow.step10.phone')} {t('orderFlow.step10.requiredField')}
              </label>
              <input
                type="tel"
                value={answers.customerInfo.phone}
                onChange={(e) => setAnswers(prev => ({
                  ...prev,
                  customerInfo: { ...prev.customerInfo, phone: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={t('orderFlow.step10.phonePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('order.form.address')} {t('orderFlow.step10.requiredField')}
              </label>
              <input
                type="text"
                ref={addressInputRef}
                value={answers.customerInfo.address || ''}
                onChange={(e) => setAnswers(prev => ({
                  ...prev,
                  customerInfo: { ...prev.customerInfo, address: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={t('order.form.address')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('order.form.postalCode')} {t('orderFlow.step10.requiredField')}
                </label>
                <input
                  type="text"
                  value={answers.customerInfo.postalCode || ''}
                  onChange={(e) => setAnswers(prev => ({
                    ...prev,
                    customerInfo: { ...prev.customerInfo, postalCode: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={t('order.form.postalCode')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('order.form.city')} {t('orderFlow.step10.requiredField')}
                </label>
                <input
                  type="text"
                  value={answers.customerInfo.city || ''}
                  onChange={(e) => setAnswers(prev => ({
                    ...prev,
                    customerInfo: { ...prev.customerInfo, city: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={t('order.form.city')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('order.form.country', 'Land')} {t('orderFlow.step10.requiredField')}
              </label>
              <div className="relative" ref={returnCountryDropdownRef}>
                <input
                  type="text"
                  value={returnCountrySearch}
                  onChange={(e) => {
                    setReturnCountrySearch(e.target.value);
                    setShowReturnCountryDropdown(true);
                  }}
                  onFocus={() => setShowReturnCountryDropdown(true)}
                  placeholder={t('orderFlow.step10.returnCountrySearchPlaceholder', locale === 'en' ? 'Search return country (e.g. "no" for Norway)...' : 'Sök returland (t.ex. "no" för Norge)...')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {showReturnCountryDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {(() => {
                      const filtered = uniqueCountries.filter((country: any) => {
                        if (!returnCountrySearch.trim()) return false;
                        const searchLower = returnCountrySearch.toLowerCase();
                        const localized = getLocalizedCountryName(country.code).toLowerCase();
                        const swedish = (country.name || '').toLowerCase();
                        return (
                          localized.includes(searchLower) ||
                          swedish.includes(searchLower) ||
                          country.code.toLowerCase().includes(searchLower)
                        );
                      });

                      if (filtered.length > 0) {
                        return filtered.map((country: any) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => handleReturnCountrySelect(country.code)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2"
                          >
                            <CountryFlag code={country.code} size={20} />
                            <span>{getLocalizedCountryName(country.code)}</span>
                          </button>
                        ));
                      }

                      return (
                        <div className="px-4 py-2 text-gray-500">
                          {t('orderFlow.step1.noResults', 'Inga resultat')}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('orderFlow.step10.invoiceReference')}
              </label>
              <input
                type="text"
                value={answers.invoiceReference}
                onChange={(e) => setAnswers(prev => ({
                  ...prev,
                  invoiceReference: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={t('orderFlow.step10.invoiceReferencePlaceholder')}
              />
              <p className="text-xs text-gray-500 mt-1">{t('orderFlow.step10.invoiceReferenceNote')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('orderFlow.step10.additionalNotes')}
              </label>
              <textarea
                value={answers.additionalNotes}
                onChange={(e) => setAnswers(prev => ({
                  ...prev,
                  additionalNotes: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={t('orderFlow.step10.additionalNotesPlaceholder')}
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">{t('orderFlow.step10.additionalNotesNote')}</p>
            </div>
          </div>


          {/* reCAPTCHA */}
          <div className="pt-4">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
            />
          </div>

          <div className="mt-8 flex justify-between">
            <button
              onClick={onBack}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              {t('orderFlow.backToPrevious')}
            </button>
            <button
              ref={submitButtonRef}
              onClick={async (event) => {
                // Check reCAPTCHA
                const recaptchaToken = recaptchaRef.current?.getValue();
                if (!recaptchaToken) {
                  toast.error('Vänligen verifiera att du inte är en robot genom att slutföra reCAPTCHA.');
                  return;
                }

                // Prevent multiple submissions - check ref immediately (more reliable than state)
                if (submissionInProgressRef.current || isSubmitting || isInCooldown) {
                  console.log('🚫 Submission already in progress or in cooldown, ignoring click');
                  event.preventDefault();
                  return;
                }

                // Immediately disable button in DOM to prevent any further clicks
                if (submitButtonRef.current) {
                  submitButtonRef.current.disabled = true;
                  submitButtonRef.current.style.opacity = '0.5';
                  submitButtonRef.current.style.cursor = 'not-allowed';
                }

                console.log('🚀 Starting order submission...');
                submissionInProgressRef.current = true;
                // isSubmitting is managed by parent

                try {
                  console.log('📤 Submitting final order...');

                  // Calculate pricing using Firebase pricing service
                  console.log('💰 Calculating order price from Firebase...');
                  const pricingResult = await calculateOrderPrice({
                    country: answers.country,
                    services: answers.services,
                    quantity: answers.quantity,
                    expedited: answers.expedited,
                    returnService: answers.returnService,
                    returnServices: returnServices,
                    scannedCopies: answers.scannedCopies,
                    pickupService: answers.pickupService,
                    premiumDelivery: answers.premiumDelivery
                  });
                  
                  console.log('✅ Pricing calculated from Firebase:', pricingResult);

                  // Prepare order data
                  console.log('📋 Preparing order data with totalPrice:', pricingResult.totalPrice);
                  const publicAccessToken =
                    typeof window !== 'undefined' &&
                    window.crypto &&
                    'randomUUID' in window.crypto
                      ? (window.crypto as any).randomUUID()
                      : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
                  const orderData = {
                    country: answers.country,
                    documentType: answers.documentType,
                    services: answers.services,
                    quantity: answers.quantity,
                    expedited: answers.expedited,
                    documentSource: answers.documentSource,
                    scannedCopies: answers.scannedCopies,
                    pickupService: answers.pickupService,
                    pickupAddress: answers.pickupAddress,
                    returnService: answers.returnService,
                    // If customer has chosen own delivery, persist their tracking number on the order
                    returnTrackingNumber:
                      answers.returnService === 'own-delivery'
                        ? (answers.ownReturnTrackingNumber || '')
                        : '',
                    premiumDelivery: answers.premiumDelivery,
                    customerInfo: answers.customerInfo,
                    paymentMethod: 'invoice', // Default to invoice payment
                    totalPrice: pricingResult.totalPrice,
                    pricingBreakdown: pricingResult.breakdown,
                    invoiceReference: answers.invoiceReference,
                    additionalNotes: answers.additionalNotes,
                    locale: locale,
                    publicAccessToken
                  };
                  console.log('📋 Order data prepared:', { ...orderData, uploadedFiles: 'excluded from log' });

                  // Submit order
                  const orderId = await createOrderWithFiles(orderData, answers.uploadedFiles || []);

                  console.log('✅ Order submitted successfully:', orderId);

                  // Send email notification (save to Firestore for external processing, same as contact form)
                  try {
                    let returfraktText = 'Ej vald';
                    if (answers.returnService === 'own-delivery') {
                      returfraktText = 'Egen returfrakt (redan bokad)';
                      if (answers.ownReturnTrackingNumber) {
                        returfraktText += `  Spårningsnummer: ${answers.ownReturnTrackingNumber}`;
                      }
                    } else if (answers.returnService === 'office-pickup') {
                      returfraktText = 'Hämtning på vårt kontor';
                    } else if (answers.returnService) {
                      const rs = returnServices.find(s => s.id === answers.returnService);
                      returfraktText = rs?.name || answers.returnService;
                    }

                    let premiumText = '';
                    if (answers.premiumDelivery) {
                      const premiumService = returnServices.find(s => s.id === answers.premiumDelivery);
                      if (premiumService) {
                        premiumText = `Premiumleverans: ${premiumService.name}`;
                      }
                    }

                    const emailData = {
                      name: `Ny beställning - Order #${orderId}`,
                      email: 'noreply@legaliseringstjanst.se',
                      phone: '',
                      subject: `Ny beställning mottagen - Order #${orderId}`,
                      message: `
Ny beställning har mottagits!

Ordernummer: ${orderId}
Kund: ${answers.customerInfo.firstName} ${answers.customerInfo.lastName}
E-post: ${answers.customerInfo.email}
Telefon: ${answers.customerInfo.phone}

Land: ${allCountries.find(c => c.code === answers.country)?.name}
Dokumenttyp: ${answers.documentType === 'birthCertificate' ? 'Födelsebevis' :
              answers.documentType === 'marriageCertificate' ? 'Vigselbevis' :
              answers.documentType === 'diploma' ? 'Examensbevis' :
              answers.documentType === 'commercial' ? 'Handelsdokument' :
              answers.documentType === 'powerOfAttorney' ? 'Fullmakt' : 'Annat dokument'}
Antal dokument: ${answers.quantity}

Valda tjänster: ${answers.services.map(serviceId => getServiceName(serviceId)).join(', ')}
Totalbelopp: ${pricingResult.totalPrice} kr

Dokumentkälla: ${answers.documentSource === 'original' ? 'Originaldokument' : 'Uppladdade filer'}
Returfrakt: ${returfraktText}
${premiumText}

${answers.additionalNotes ? `Övriga kommentarer: ${answers.additionalNotes}` : ''}
                      `.trim(),
                      orderId: orderId,
                      createdAt: Timestamp.now(),
                      status: 'unread'
                    };

                    await addDoc(collection(db, 'contactMessages'), emailData);
                    console.log('📧 Email notification queued for order:', orderId);
                  } catch (emailError) {
                    console.error('❌ Failed to queue email notification:', emailError);
                    // Don't block the order flow if email notification fails
                  }

                  // Reset reCAPTCHA
                  recaptchaRef.current?.reset();

                  // Show beautiful success toast
                  toast.success(
                    <div className="text-center">
                      <div className="font-bold text-lg mb-2">{t('orderFlow.orderSubmitted')}</div>
                      <div className="text-sm">
                        <strong>{t('orderFlow.orderNumber', { orderId })}</strong><br/>
                        <span className="text-green-600">{t('orderFlow.documentsReturn')}</span>
                      </div>
                    </div>,
                    {
                      duration: 6000,
                      style: {
                        background: '#10B981',
                        color: 'white',
                        borderRadius: '12px',
                        padding: '16px',
                        fontSize: '16px',
                        maxWidth: '400px'
                      }
                    }
                  );

                  // Redirect to confirmation page after a short delay
                  setTimeout(() => {
                    router.push(`/bekraftelse?orderId=${orderId}&token=${publicAccessToken}`);
                  }, 2000);

                } catch (error) {
                  console.error('❌ Error submitting order:', error);

                  // Show beautiful error toast
                  toast.error(
                    <div className="text-center">
                      <div className="font-bold text-lg mb-2">{t('orderFlow.errorOccurred')}</div>
                      <div className="text-sm">
                        {t('orderFlow.submissionFailed')}<br/>
                        <span className="text-red-200">{t('orderFlow.tryAgainOrContact')}</span>
                      </div>
                    </div>,
                    {
                      duration: 5000,
                      style: {
                        background: '#EF4444',
                        color: 'white',
                        borderRadius: '12px',
                        padding: '16px',
                        fontSize: '16px',
                        maxWidth: '400px'
                      }
                    }
                  );
                } finally {
                  // isSubmitting is managed by parent
                  submissionInProgressRef.current = false;

                  // Start cooldown period (10 seconds)
                  setIsInCooldown(true);
                  cooldownTimeoutRef.current = setTimeout(() => {
                    setIsInCooldown(false);
                    // Re-enable button in DOM
                    if (submitButtonRef.current) {
                      submitButtonRef.current.disabled = false;
                      submitButtonRef.current.style.opacity = '';
                      submitButtonRef.current.style.cursor = '';
                    }
                  }, 10000); // 10 seconds cooldown
                }
              }}
              disabled={
                isSubmitting ||
                submissionInProgressRef.current ||
                isInCooldown ||
                answers.uploadedFiles.length !== answers.quantity ||
                answers.uploadedFiles.some(file => !file) ||
                !answers.customerInfo.firstName ||
                !answers.customerInfo.lastName ||
                !answers.customerInfo.email ||
                !answers.customerInfo.phone ||
                !answers.customerInfo.countryCode
              }
              className={`px-8 py-3 font-semibold text-lg rounded-md transition-all duration-200 ${
                isSubmitting || submissionInProgressRef.current || isInCooldown
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50'
                  : answers.uploadedFiles.length === answers.quantity &&
                    answers.uploadedFiles.every(file => file) &&
                    answers.customerInfo.firstName &&
                    answers.customerInfo.lastName &&
                    answers.customerInfo.email &&
                    answers.customerInfo.phone &&
                    answers.customerInfo.countryCode
                  ? 'bg-custom-button text-white hover:bg-custom-button-hover'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting || submissionInProgressRef.current ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('orderFlow.submittingOrder')}
                </div>
              ) : isInCooldown ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M12 2v6m0 0l-4-4m4 4l4-4m-4 14v6m0 0l4-4m-4 4l-4-4"></path>
                  </svg>
                  {t('orderFlow.wait10Seconds')}
                </div>
              ) : (
                t('orderFlow.submitOrder')
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Address Display for Original Documents */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  {t('orderFlow.step10.shippingAddressTitle')}
                </h3>
                <div className="bg-white border border-red-200 rounded-lg p-4 mb-3" id="shipping-address-final">
                  <div className="font-medium text-gray-900 mb-1">{t('orderFlow.step7.companyName')}</div>
                  <div className="text-gray-700">{t('orderFlow.step7.attention')}</div>
                  <div className="text-gray-700">{t('orderFlow.step7.street')}</div>
                  <div className="text-gray-700">{t('orderFlow.step7.postalCode')} {t('orderFlow.step7.city')}</div>
                  <div className="text-gray-700">{t('orderFlow.step7.country')}</div>
                </div>
                <div className="text-sm text-red-700">
                  <strong>Viktigt:</strong> Skriv tydligt ordernumret på kuvertet eller skriv ut en fraktsedel nedan.
                </div>
              </div>
              <div className="ml-4">
                <button
                  onClick={() => {
                    // Print shipping label with blank order number so customer can write it by hand
                    printShippingLabel(undefined);
                  }}
                  className="flex items-center justify-center w-12 h-12 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors duration-200"
                  title="Skriv ut fraktsedel"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v5a2 2 0 01-2 2h-2M7 8H5a2 2 0 00-2 2v5a2 2 0 002 2h2m10-9V5a2 2 0 00-2-2H9a2 2 0 00-2 2v3m10 9H7m10 0v4H7v-4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Customer Information Form */}
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {locale === 'en' ? 'Customer details' : 'Kunduppgifter'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('orderFlow.step10.firstName')} {t('orderFlow.step10.requiredField')}
                </label>
                <input
                  type="text"
                  value={answers.customerInfo.firstName}
                  onChange={(e) => setAnswers(prev => ({
                    ...prev,
                    customerInfo: { ...prev.customerInfo, firstName: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={t('orderFlow.step10.firstNamePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('orderFlow.step10.lastName')} {t('orderFlow.step10.requiredField')}
                </label>
                <input
                  type="text"
                  value={answers.customerInfo.lastName}
                  onChange={(e) => setAnswers(prev => ({
                    ...prev,
                    customerInfo: { ...prev.customerInfo, lastName: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={t('orderFlow.step10.lastNamePlaceholder')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('orderFlow.step10.email')} {t('orderFlow.step10.requiredField')}
              </label>
              <input
                type="email"
                value={answers.customerInfo.email}
                onChange={(e) => setAnswers(prev => ({
                  ...prev,
                  customerInfo: { ...prev.customerInfo, email: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={t('orderFlow.step10.emailPlaceholder')}
                pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                title="Ange en giltig e-postadress"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('orderFlow.step10.phone')} {t('orderFlow.step10.requiredField')}
              </label>
              <input
                type="tel"
                value={answers.customerInfo.phone}
                onChange={(e) => setAnswers(prev => ({
                  ...prev,
                  customerInfo: { ...prev.customerInfo, phone: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={t('orderFlow.step10.phonePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('order.form.address')} {t('orderFlow.step10.requiredField')}
              </label>
              <input
                type="text"
                ref={addressInputRef}
                value={answers.customerInfo.address || ''}
                onChange={(e) => setAnswers(prev => ({
                  ...prev,
                  customerInfo: { ...prev.customerInfo, address: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={t('order.form.address')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('order.form.postalCode')} {t('orderFlow.step10.requiredField')}
                </label>
                <input
                  type="text"
                  value={answers.customerInfo.postalCode || ''}
                  onChange={(e) => setAnswers(prev => ({
                    ...prev,
                    customerInfo: { ...prev.customerInfo, postalCode: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={t('order.form.postalCode')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('order.form.city')} {t('orderFlow.step10.requiredField')}
                </label>
                <input
                  type="text"
                  value={answers.customerInfo.city || ''}
                  onChange={(e) => setAnswers(prev => ({
                    ...prev,
                    customerInfo: { ...prev.customerInfo, city: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={t('order.form.city')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('order.form.country', 'Land')} {t('orderFlow.step10.requiredField')}
              </label>
              <div className="relative" ref={returnCountryDropdownRef}>
                <input
                  type="text"
                  value={returnCountrySearch}
                  onChange={(e) => {
                    setReturnCountrySearch(e.target.value);
                    setShowReturnCountryDropdown(true);
                  }}
                  onFocus={() => setShowReturnCountryDropdown(true)}
                  placeholder={t('orderFlow.step10.returnCountrySearchPlaceholder', locale === 'en' ? 'Search return country (e.g. "no" for Norway)...' : 'Sök returland (t.ex. "no" för Norge)...')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {showReturnCountryDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {(() => {
                      const filtered = uniqueCountries.filter((country: any) => {
                        if (!returnCountrySearch.trim()) return false;
                        const searchLower = returnCountrySearch.toLowerCase();
                        const localized = getLocalizedCountryName(country.code).toLowerCase();
                        const swedish = (country.name || '').toLowerCase();
                        return (
                          localized.includes(searchLower) ||
                          swedish.includes(searchLower) ||
                          country.code.toLowerCase().includes(searchLower)
                        );
                      });

                      if (filtered.length > 0) {
                        return filtered.map((country: any) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => handleReturnCountrySelect(country.code)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2"
                          >
                            <CountryFlag code={country.code} size={20} />
                            <span>{getLocalizedCountryName(country.code)}</span>
                          </button>
                        ));
                      }

                      return (
                        <div className="px-4 py-2 text-gray-500">
                          {t('orderFlow.step1.noResults', 'Inga resultat')}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('orderFlow.step10.invoiceReference')}
              </label>
              <input
                type="text"
                value={answers.invoiceReference}
                onChange={(e) => setAnswers(prev => ({
                  ...prev,
                  invoiceReference: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={t('orderFlow.step10.invoiceReferencePlaceholder')}
              />
              <p className="text-xs text-gray-500 mt-1">{t('orderFlow.step10.invoiceReferenceNote')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('orderFlow.step10.additionalNotes')}
              </label>
              <textarea
                value={answers.additionalNotes}
                onChange={(e) => setAnswers(prev => ({
                  ...prev,
                  additionalNotes: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={t('orderFlow.step10.additionalNotesPlaceholder')}
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">{t('orderFlow.step10.additionalNotesNote')}</p>
            </div>
          </div>

          {/* Terms and Conditions Acceptance */}
          <div className="pt-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms-acceptance-original"
                  name="terms-acceptance-original"
                  type="checkbox"
                  className="h-4 w-4 text-custom-button focus:ring-custom-button border-gray-300 rounded"
                  required
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms-acceptance-original" className="text-gray-700">
                  {locale === 'en' ? (
                    <>
                      I have read and accept the{' '}
                      <Link
                        href="/villkor"
                        target="_blank"
                        className="text-custom-button hover:text-custom-button-hover underline"
                      >
                        terms and conditions
                      </Link>{' '}
                      and{' '}
                      <Link
                        href="/integritetspolicy"
                        target="_blank"
                        className="text-custom-button hover:text-custom-button-hover underline"
                      >
                        privacy policy
                      </Link>
                      .
                    </>
                  ) : (
                    <>
                      Jag har läst och accepterar{' '}
                      <Link
                        href="/villkor"
                        target="_blank"
                        className="text-custom-button hover:text-custom-button-hover underline"
                      >
                        allmänna villkor
                      </Link>{' '}
                      och{' '}
                      <Link
                        href="/integritetspolicy"
                        target="_blank"
                        className="text-custom-button hover:text-custom-button-hover underline"
                      >
                        integritetspolicy
                      </Link>
                      .
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* reCAPTCHA */}
          <div className="pt-4">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
            />
          </div>

          <div className="mt-8 flex justify-between">
            <button
              onClick={onBack}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              {t('orderFlow.backToPrevious')}
            </button>
            <button
              ref={submitButtonRef}
              onClick={async (event) => {
                // Check reCAPTCHA
                const recaptchaToken = recaptchaRef.current?.getValue();
                if (!recaptchaToken) {
                  toast.error('Vänligen verifiera att du inte är en robot genom att slutföra reCAPTCHA.');
                  return;
                }

                // Prevent multiple submissions - check ref immediately (more reliable than state)
                if (submissionInProgressRef.current || isSubmitting || isInCooldown) {
                  console.log('🚫 Submission already in progress or in cooldown, ignoring click');
                  event.preventDefault();
                  return;
                }

                // Immediately disable button in DOM to prevent any further clicks
                if (submitButtonRef.current) {
                  submitButtonRef.current.disabled = true;
                  submitButtonRef.current.style.opacity = '0.5';
                  submitButtonRef.current.style.cursor = 'not-allowed';
                }

                console.log('🚀 Starting order submission...');
                submissionInProgressRef.current = true;
                // isSubmitting is managed by parent

                try {
                  console.log('📤 Submitting final order...');

                  // Calculate pricing using Firebase pricing service
                  console.log('💰 Calculating order price from Firebase...');
                  const pricingResult = await calculateOrderPrice({
                    country: answers.country,
                    services: answers.services,
                    quantity: answers.quantity,
                    expedited: answers.expedited,
                    returnService: answers.returnService,
                    returnServices: returnServices,
                    scannedCopies: answers.scannedCopies,
                    pickupService: answers.pickupService,
                    premiumDelivery: answers.premiumDelivery
                  });
                  
                  console.log('✅ Pricing calculated from Firebase:', pricingResult);

                  // Prepare order data
                  console.log('📋 Preparing order data with totalPrice:', pricingResult.totalPrice);
                  const publicAccessToken =
                    typeof window !== 'undefined' &&
                    window.crypto &&
                    'randomUUID' in window.crypto
                      ? (window.crypto as any).randomUUID()
                      : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
                  const orderData = {
                    country: answers.country,
                    documentType: answers.documentType,
                    services: answers.services,
                    quantity: answers.quantity,
                    expedited: answers.expedited,
                    documentSource: answers.documentSource,
                    scannedCopies: answers.scannedCopies,
                    pickupService: answers.pickupService,
                    pickupAddress: answers.pickupAddress,
                    returnService: answers.returnService,
                    premiumDelivery: answers.premiumDelivery,
                    customerInfo: answers.customerInfo,
                    paymentMethod: 'invoice', // Default to invoice payment
                    totalPrice: pricingResult.totalPrice,
                    pricingBreakdown: pricingResult.breakdown,
                    invoiceReference: answers.invoiceReference,
                    additionalNotes: answers.additionalNotes,
                    locale: locale,
                    publicAccessToken
                  };
                  console.log('📋 Order data prepared:', { ...orderData, uploadedFiles: 'excluded from log' });

                  // Submit order
                  const orderId = await createOrderWithFiles(orderData, answers.uploadedFiles || []);

                  console.log('✅ Order submitted successfully:', orderId);

                  // Clear saved progress since order is complete
                  clearProgress();

                  // Expose order number for shipping label printing in this session
                  try { (window as any).__finalOrderNumber = orderId; } catch {}

                  // Send email notification to business (styled HTML via customerEmails)
                  try {
                    const siteUrlInternal = process.env.NEXT_PUBLIC_SITE_URL || 'https://doxvl-51a30.web.app';
                    const internalHtml = `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ny beställning order #${orderId} | DOX Visumpartner AB</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #202124; max-width: 700px; margin: 0 auto; background: #f8f9fa; padding: 20px; }
    .wrap { background: #fff; border-radius: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background: #2E2D2C; color: #fff; padding: 24px 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
    .content { padding: 24px 28px; }
    .badge { display:inline-block; background:#0EB0A6; color:#fff; border-radius: 6px; padding: 8px 12px; font-weight: 700; margin: 8px 0 16px; }
    .section { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin:16px 0; }
    .row { display:flex; justify-content:space-between; gap: 12px; padding:8px 0; border-bottom:1px solid #eef2f6; }
    .row:last-child { border-bottom:none; }
    .label { color:#5f6368; font-weight:600; }
    .value { color:#202124; font-weight:700; }
    .address { background:#fff; border:2px solid #065f46; border-radius:6px; padding:14px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size:14px; }
    .button { display:inline-block; background:#0EB0A6; color:#fff !important; text-decoration:none; border-radius:6px; padding:10px 16px; font-weight:700; margin-top:12px; }
    .muted { color:#5f6368; font-size:13px; }
  </style>
  </head>
  <body>
    <div class="wrap">
      <div class="header">
        <h1>Ny beställning</h1>
      </div>
      <div class="content">
        <div class="badge">Order #${orderId}</div>

        <div class="section">
          <div class="row"><span class="label">Datum</span><span class="value">${new Date().toLocaleDateString('sv-SE')}</span></div>
          <div class="row"><span class="label">Land</span><span class="value">${allCountries.find(c => c.code === answers.country)?.name}</span></div>
          <div class="row"><span class="label">Dokumenttyp</span><span class="value">${answers.documentType === 'birthCertificate' ? 'Födelsebevis' : answers.documentType === 'marriageCertificate' ? 'Vigselbevis' : answers.documentType === 'diploma' ? 'Examensbevis' : answers.documentType === 'commercial' ? 'Handelsdokument' : answers.documentType === 'powerOfAttorney' ? 'Fullmakt' : 'Annat dokument'}</span></div>
          <div class="row"><span class="label">Antal dokument</span><span class="value">${answers.quantity} st</span></div>
          <div class="row"><span class="label">Valda tjänster</span><span class="value">${answers.services.map(s => getServiceName(s)).join(', ')}</span></div>
          <div class="row"><span class="label">Totalbelopp</span><span class="value">${pricingResult.totalPrice} kr</span></div>
          <div class="row"><span class="label">Dokumentkälla</span><span class="value">${answers.documentSource === 'original' ? 'Originaldokument' : 'Uppladdade filer'}</span></div>
          <div class="row"><span class="label">Returfrakt</span><span class="value">${answers.returnService ? returnServices.find(s => s.id === answers.returnService)?.name : 'Ej vald'}</span></div>
        </div>

        <div class="section">
          <div class="row"><span class="label">Kund</span><span class="value">${answers.customerInfo.firstName} ${answers.customerInfo.lastName}</span></div>
          <div class="row"><span class="label">E-post</span><span class="value">${answers.customerInfo.email}</span></div>
          <div class="row"><span class="label">Telefon</span><span class="value">${answers.customerInfo.phone || '-'}</span></div>
          <div class="row"><span class="label">Adress</span><span class="value">${answers.customerInfo.address}, ${answers.customerInfo.postalCode} ${answers.customerInfo.city}</span></div>
          ${answers.invoiceReference ? `<div class="row"><span class="label">Fakturareferens</span><span class="value">${answers.invoiceReference}</span></div>` : ''}
        </div>

        ${answers.documentSource === 'original' ? `
        <div class="section">
          <div class="label" style="margin-bottom:6px;">Inkommande postadress</div>
          <div class="address">
            DOX Visumpartner AB<br/>
            Att: Dokumenthantering<br/>
            Box 38<br/>
            121 25 Stockholm-Globen<br/>
            Sverige
          </div>
          <a class="button" href="${siteUrlInternal}/shipping-label?orderId=${orderId}" target="_blank" rel="noopener">Skriv ut fraktsedel</a>
          <div class="muted">Be kunden alltid märka med Order #${orderId} och skicka med REK.</div>
        </div>
        ` : ''}

        ${answers.additionalNotes ? `<div class="section"><div class="label" style="margin-bottom:6px;">Övriga kommentarer</div><div class="value" style="font-weight:500;">${answers.additionalNotes}</div></div>` : ''}

        <div class="muted">DOX Visumpartner AB • info@doxvl.se • 08-40941900</div>
      </div>
    </div>
  </body>
</html>
                    `.trim();

                    // Send a styled HTML email via the customerEmails queue to the business inbox
                    // This uses the already-deployed sendCustomerConfirmationEmail function which sends HTML as-is
                    await addDoc(collection(db, 'customerEmails'), {
                      name: `Order #${orderId}`,
                      email: 'info@doxvl.se,info@visumpartner.se',
                      subject: `Ny beställning - Order ${orderId && orderId.startsWith('SWE') ? orderId.replace(/^SWE/, '#SWE') : `#SWE${orderId}`}`,
                      message: internalHtml, // HTML body is supported by that function
                      createdAt: Timestamp.now(),
                      status: 'queued'
                    });
                    console.log('📧 Business email queued via customerEmails for styled HTML delivery:', orderId);
                  } catch (emailError) {
                    console.error('❌ Failed to queue business email notification:', emailError);
                    // Don't block the order flow if email notification fails
                  }

                  // Send confirmation email to customer
                  try {
                    const isEnglish = locale === 'en';
                    const customerHtml = isEnglish
                      ? `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #202124;
      max-width: 600px;
      margin: 0 auto;
      background-color: #f8f9fa;
      padding: 20px;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .header {
      background: #2E2D2C;
      color: #ffffff;
      padding: 28px 36px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.2px;
    }
    .content { padding: 32px 36px; }
    .greeting { font-size: 17px; font-weight: 600; color: #202124; margin-bottom: 16px; }
    .order-summary { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px; margin:20px 0; }
    .order-number { background:#0EB0A6; color:#fff; padding:10px 16px; border-radius:6px; display:inline-block; font-weight:700; font-size:15px; margin: 12px 0; }
    .order-details { margin: 16px 0; }
    .detail-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eaecef; }
    .detail-row:last-child { border-bottom:none; }
    .detail-label { font-weight:500; color:#5f6368; }
    .detail-value { font-weight:700; color:#202124; }
    .next-steps { background:#ecfdf5; border:1px solid #a7f3d0; border-radius:8px; padding:18px; margin:20px 0; }
    .next-steps h3 { color:#065f46; margin:0 0 8px; font-size:17px; }
    .address-box { background:#fff; border:2px solid #065f46; border-radius:6px; padding:14px; margin:12px 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size:14px; }
    .contact-info { background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; padding:18px; margin:22px 0; text-align:center; }
    .footer { background:#f8f9fa; padding:24px 36px; text-align:center; border-top:1px solid #eaecef; }
    .footer p { margin:5px 0; color:#5f6368; font-size:13px; }
    .highlight { background:#fef3c7; padding:2px 6px; border-radius:3px; font-weight:700; }
    @media (max-width:600px){ body{padding:10px;} .header,.content,.footer{padding:20px;} .detail-row{flex-direction:column; gap:4px;} }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Order Confirmation</h1>
      <p>Thank you for your order with DOX Visumpartner AB</p>
    </div>

    <div class="content">
      <div class="greeting">
        Dear ${answers.customerInfo.firstName} ${answers.customerInfo.lastName},
      </div>

      <p>We have received your order and will now start processing it. Here is a summary:</p>

      <div class="order-summary">
        <div class="order-number">
          Order number: #${orderId}
        </div>

        <div class="order-details">
          <div class="detail-row">
            <span class="detail-label">Date:</span>
            <span class="detail-value">${new Date().toLocaleDateString('en-GB')}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Country:</span>
            <span class="detail-value">${allCountries.find(c => c.code === answers.country)?.name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Document type:</span>
            <span class="detail-value">${answers.documentType === 'birthCertificate' ? 'Birth certificate' :
              answers.documentType === 'marriageCertificate' ? 'Marriage certificate' :
              answers.documentType === 'diploma' ? 'Diploma' :
              answers.documentType === 'commercial' ? 'Commercial document' :
              answers.documentType === 'powerOfAttorney' ? 'Power of attorney' : 'Other document'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Number of documents:</span>
            <span class="detail-value">${answers.quantity}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Selected services:</span>
            <span class="detail-value">${answers.services.map(serviceId => getServiceName(serviceId)).join(', ')}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Total amount:</span>
            <span class="detail-value highlight">${pricingResult.totalPrice} SEK</span>
          </div>
        </div>
      </div>

      ${answers.documentSource === 'original' ?
        `<div class="next-steps">
          <h3>📦 Next steps</h3>
          <p>Please send your original documents to the following address:</p>
          <div class="address-box">
            <strong>DOX Visumpartner AB</strong><br>
            Att: Document handling<br>
            Box 38<br>
            121 25 Stockholm-Globen<br>
            Sweden
          </div>
          <p><strong>Important:</strong> Mark the envelope with <span class="highlight">"Order #${orderId}"</span> and send it as <strong>registered mail</strong>.</p>
        </div>`
        :
        `<div class="next-steps">
          <h3>✅ Your files have been received</h3>
          <p>Your uploaded files have been received and will be processed shortly.</p>
        </div>`}

      <p>You will receive your legalized documents via <strong>${answers.returnService ? returnServices.find(s => s.id === answers.returnService)?.name : 'the selected shipping method'}</strong>.</p>

      <div class="contact-info">
        <h3>Questions?</h3>
        <p>Feel free to contact us:</p>
        <p>
          📧 <a href="mailto:info@doxvl.se">info@doxvl.se</a><br>
          📞 08-40941900
        </p>
      </div>
    </div>

    <div class="footer">
      <p><strong>DOX Visumpartner AB</strong></p>
      <p>Professional document legalisation for many years</p>
      <p>This is an automatically generated message.</p>
    </div>
  </div>
</body>
</html>
                      `.trim()
                      : `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Orderbekräftelse</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #202124;
      max-width: 600px;
      margin: 0 auto;
      background-color: #f8f9fa;
      padding: 20px;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .header {
      background: #2E2D2C;
      color: #ffffff;
      padding: 28px 36px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.2px;
    }
    .content { padding: 32px 36px; }
    .greeting { font-size: 17px; font-weight: 600; color: #202124; margin-bottom: 16px; }
    .order-summary { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px; margin:20px 0; }
    .order-number { background:#0EB0A6; color:#fff; padding:10px 16px; border-radius:6px; display:inline-block; font-weight:700; font-size:15px; margin: 12px 0; }
    .order-details { margin: 16px 0; }
    .detail-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eaecef; }
    .detail-row:last-child { border-bottom:none; }
    .detail-label { font-weight:500; color:#5f6368; }
    .detail-value { font-weight:700; color:#202124; }
    .next-steps { background:#ecfdf5; border:1px solid #a7f3d0; border-radius:8px; padding:18px; margin:20px 0; }
    .next-steps h3 { color:#065f46; margin:0 0 8px; font-size:17px; }
    .address-box { background:#fff; border:2px solid #065f46; border-radius:6px; padding:14px; margin:12px 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size:14px; }
    .contact-info { background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; padding:18px; margin:22px 0; text-align:center; }
    .footer { background:#f8f9fa; padding:24px 36px; text-align:center; border-top:1px solid #eaecef; }
    .footer p { margin:5px 0; color:#5f6368; font-size:13px; }
    .highlight { background:#fef3c7; padding:2px 6px; border-radius:3px; font-weight:700; }
    @media (max-width:600px){ body{padding:10px;} .header,.content,.footer{padding:20px;} .detail-row{flex-direction:column; gap:4px;} }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Orderbekräftelse</h1>
      <p>Tack för din beställning hos DOX Visumpartner AB</p>
    </div>

    <div class="content">
      <div class="greeting">
        Hej ${answers.customerInfo.firstName}!
      </div>

      <p>Vi har mottagit din beställning och den behandlas nu. Här är en sammanfattning:</p>

      <div class="order-summary">
        <div class="order-number">
          Ordernummer: #${orderId}
        </div>

        <div class="order-details">
          <div class="detail-row">
            <span class="detail-label">Datum:</span>
            <span class="detail-value">${new Date().toLocaleDateString('sv-SE')}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Land:</span>
            <span class="detail-value">${allCountries.find(c => c.code === answers.country)?.name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Dokumenttyp:</span>
            <span class="detail-value">${answers.documentType === 'birthCertificate' ? 'Födelsebevis' :
              answers.documentType === 'marriageCertificate' ? 'Vigselbevis' :
              answers.documentType === 'diploma' ? 'Examensbevis' :
              answers.documentType === 'commercial' ? 'Handelsdokument' :
              answers.documentType === 'powerOfAttorney' ? 'Fullmakt' : 'Annat dokument'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Antal dokument:</span>
            <span class="detail-value">${answers.quantity} st</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Valda tjänster:</span>
            <span class="detail-value">${answers.services.map(serviceId => getServiceName(serviceId)).join(', ')}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Totalbelopp:</span>
            <span class="detail-value highlight">${pricingResult.totalPrice} kr</span>
          </div>
        </div>
      </div>

      ${answers.documentSource === 'original' ?
        `<div class="next-steps">
          <h3>📦 Nästa steg</h3>
          <p>Skicka dina originaldokument till följande adress:</p>
          <div class="address-box">
            <strong>DOX Visumpartner AB</strong><br>
            Att: Dokumenthantering<br>
            Box 38<br>
            121 25 Stockholm-Globen<br>
            Sverige
          </div>
          <p><strong>Viktigt:</strong> Märk försändelsen med <span class="highlight">"Order #${orderId}"</span> och skicka med <strong>REK (rekommenderat brev)</strong>.</p>
        </div>`
        :
        `<div class="next-steps">
          <h3>✅ Dina filer har mottagits</h3>
          <p>Dina uppladdade filer har mottagits och kommer att behandlas inom kort.</p>
        </div>`}

      <p>Du kommer att få dina legaliserade dokument returnerade via <strong>${answers.returnService ? returnServices.find(s => s.id === answers.returnService)?.name : 'vald fraktmetod'}</strong>.</p>

      <div class="contact-info">
        <h3>Har du frågor?</h3>
        <p>Kontakta oss gärna:</p>
        <p>
          📧 <a href="mailto:info@doxvl.se">info@doxvl.se</a><br>
          📞 08-40941900
        </p>
      </div>
    </div>

    <div class="footer">
      <p><strong>DOX Visumpartner AB</strong></p>
      <p>Professionell dokumentlegalisering sedan många år</p>
      <p>Detta är ett automatiskt genererat meddelande.</p>
    </div>
  </div>
</body>
</html>
                      `.trim();

                    const customerEmailData = {
                      name: `${answers.customerInfo.firstName} ${answers.customerInfo.lastName}`,
                      email: answers.customerInfo.email,
                      phone: answers.customerInfo.phone,
                      subject: isEnglish
                        ? `Order Confirmation – ${orderId}`
                        : `Orderbekräftelse – ${orderId}`,
                      message: customerHtml,
                      orderId: orderId,
                      createdAt: Timestamp.now(),
                      status: 'unread'
                    };

                    await addDoc(collection(db, 'customerEmails'), customerEmailData);
                    console.log('📧 Customer confirmation email queued for order:', orderId);
                  } catch (customerEmailError) {
                    console.error('❌ Failed to queue customer email notification:', customerEmailError);
                    // Don't block the order flow if customer email fails
                  }

                  // Show beautiful success toast
                  toast.success(
                    <div className="text-center">
                      <div className="font-bold text-lg mb-2">{t('orderFlow.orderSubmitted')}</div>
                      <div className="text-sm">
                        <strong>{t('orderFlow.orderNumber', { orderId })}</strong><br/>
                        <span className="text-green-600">{t('orderFlow.documentsReturn')}</span>
                      </div>
                    </div>,
                    {
                      duration: 6000,
                      style: {
                        background: '#10B981',
                        color: 'white',
                        borderRadius: '12px',
                        padding: '16px',
                        fontSize: '16px',
                        maxWidth: '400px'
                      }
                    }
                  );

                  // Redirect to confirmation page after a short delay
                  setTimeout(() => {
                    router.push(`/bekraftelse?orderId=${orderId}&token=${publicAccessToken}`);
                  }, 2000);

                } catch (error) {
                  console.error('❌ Error submitting order:', error);

                  // Show beautiful error toast
                  toast.error(
                    <div className="text-center">
                      <div className="font-bold text-lg mb-2">❌ Ett fel uppstod</div>
                      <div className="text-sm">
                        Kunde inte skicka beställning.<br/>
                        <span className="text-red-200">Försök igen eller kontakta support</span>
                      </div>
                    </div>,
                    {
                      duration: 5000,
                      style: {
                        background: '#EF4444',
                        color: 'white',
                        borderRadius: '12px',
                        padding: '16px',
                        fontSize: '16px',
                        maxWidth: '400px'
                      }
                    }
                  );
                } finally {
                  // isSubmitting is managed by parent
                  submissionInProgressRef.current = false;

                  // Start cooldown period (10 seconds)
                  setIsInCooldown(true);
                  cooldownTimeoutRef.current = setTimeout(() => {
                    setIsInCooldown(false);
                    // Re-enable button in DOM
                    if (submitButtonRef.current) {
                      submitButtonRef.current.disabled = false;
                      submitButtonRef.current.style.opacity = '';
                      submitButtonRef.current.style.cursor = '';
                    }
                  }, 10000); // 10 seconds cooldown
                }
              }}
              disabled={
                isSubmitting ||
                submissionInProgressRef.current ||
                isInCooldown ||
                !answers.customerInfo.firstName ||
                !answers.customerInfo.lastName ||
                !answers.customerInfo.email ||
                !answers.customerInfo.phone ||
                !answers.customerInfo.countryCode
              }
              className={`px-8 py-3 font-semibold text-lg rounded-md transition-all duration-200 ${
                isSubmitting || submissionInProgressRef.current || isInCooldown
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50'
                  : answers.customerInfo.firstName &&
                    answers.customerInfo.lastName &&
                    answers.customerInfo.email &&
                    answers.customerInfo.phone &&
                    answers.customerInfo.countryCode
                  ? 'bg-custom-button text-white hover:bg-custom-button-hover'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting || submissionInProgressRef.current ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('orderFlow.submittingOrder')}
                </div>
              ) : isInCooldown ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M12 2v6m0 0l-4-4m4 4l4-4m-4 14v6m0 0l4-4m-4 4l-4-4"></path>
                  </svg>
                  {t('orderFlow.wait10Seconds')}
                </div>
              ) : (
                t('orderFlow.submitOrder')
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step10ReviewSubmit;
