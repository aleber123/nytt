/**
 * Step 10: Review & Submit
 * Final review of order with customer information, file uploads, and payment
 * This is a complex component that handles the entire order submission process
 */

import React, { useState, useRef } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import ReCAPTCHA from 'react-google-recaptcha';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { createOrderWithFiles } from '@/services/hybridOrderService';
import { calculateOrderPrice } from '@/firebase/pricingService';
import { getCustomerByEmailDomain } from '@/firebase/customerService';
import { printShippingLabel } from '@/services/shippingLabelService';
import { StepProps } from '../types';
import CountryFlag from '../../ui/CountryFlag';
import { ALL_COUNTRIES } from '../data/countries';
import { CustomerInfoForm } from '../CustomerInfoForm';
import { TermsAcceptance } from '../TermsAcceptance';

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
  const [showFullScreenLoader, setShowFullScreenLoader] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const submissionInProgressRef = useRef(false);
  const cooldownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addressInputRef = useRef<HTMLInputElement | null>(null);

  // Email validation helper
  const isValidEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  // Validation helper - get list of missing or invalid required fields
  const getMissingFields = () => {
    const missing: { field: string; label: string; id: string }[] = [];
    const isEn = locale === 'en';
    
    // Return address is now validated in Step 9 for DHL/Stockholm deliveries
    // No return address validation needed here

    // === Return address validation (only when billing is set to "same as return") ===
    // This prevents cases where the user checks "same as return" even though the return address steps were skipped.
    if (answers.billingInfo.sameAsReturn) {
      if (answers.customerType === 'company') {
        if (!answers.returnAddress.companyName) {
          missing.push({ field: 'returnCompanyName', label: isEn ? 'Company name (return)' : 'Företagsnamn (returadress)', id: 'return-firstName' });
        }
      } else {
        if (!answers.returnAddress.firstName) {
          missing.push({ field: 'returnFirstName', label: isEn ? 'First name (return)' : 'Förnamn (returadress)', id: 'return-firstName' });
        }
        if (!answers.returnAddress.lastName) {
          missing.push({ field: 'returnLastName', label: isEn ? 'Last name (return)' : 'Efternamn (returadress)', id: 'return-firstName' });
        }
      }
      if (!answers.returnAddress.street) {
        missing.push({ field: 'returnStreet', label: isEn ? 'Street address (return)' : 'Gatuadress (returadress)', id: 'return-firstName' });
      }
      if (!answers.returnAddress.postalCode) {
        missing.push({ field: 'returnPostalCode', label: isEn ? 'Postal code (return)' : 'Postnummer (returadress)', id: 'return-firstName' });
      }
      if (!answers.returnAddress.city) {
        missing.push({ field: 'returnCity', label: isEn ? 'City (return)' : 'Stad (returadress)', id: 'return-firstName' });
      }
      if (!answers.returnAddress.countryCode) {
        missing.push({ field: 'returnCountry', label: isEn ? 'Country (return)' : 'Land (returadress)', id: 'return-firstName' });
      }
      if (!answers.returnAddress.email) {
        missing.push({ field: 'returnEmail', label: isEn ? 'Email (return)' : 'E-post (returadress)', id: 'return-firstName' });
      }
      if (!answers.returnAddress.phone) {
        missing.push({ field: 'returnPhone', label: isEn ? 'Phone (return)' : 'Telefon (returadress)', id: 'return-firstName' });
      }
    }
    
    // === Billing validation (only if not same as return) ===
    if (!answers.billingInfo.sameAsReturn) {
      if (answers.customerType === 'company') {
        if (!answers.billingInfo.companyName) {
          missing.push({ field: 'billingCompanyName', label: isEn ? 'Company name (billing)' : 'Företagsnamn (faktura)', id: 'return-firstName' });
        }
      } else {
        if (!answers.billingInfo.firstName) {
          missing.push({ field: 'billingFirstName', label: isEn ? 'First name (billing)' : 'Förnamn (faktura)', id: 'return-firstName' });
        }
        if (!answers.billingInfo.lastName) {
          missing.push({ field: 'billingLastName', label: isEn ? 'Last name (billing)' : 'Efternamn (faktura)', id: 'return-firstName' });
        }
      }
      if (!answers.billingInfo.street) {
        missing.push({ field: 'billingStreet', label: isEn ? 'Street address (billing)' : 'Gatuadress (faktura)', id: 'return-firstName' });
      }
      if (!answers.billingInfo.postalCode) {
        missing.push({ field: 'billingPostalCode', label: isEn ? 'Postal code (billing)' : 'Postnummer (faktura)', id: 'return-firstName' });
      }
      if (!answers.billingInfo.city) {
        missing.push({ field: 'billingCity', label: isEn ? 'City (billing)' : 'Stad (faktura)', id: 'return-firstName' });
      }
      if (!answers.billingInfo.countryCode) {
        missing.push({ field: 'billingCountry', label: isEn ? 'Country (billing)' : 'Land (faktura)', id: 'return-firstName' });
      }
      if (!answers.billingInfo.email) {
        missing.push({ field: 'billingEmail', label: isEn ? 'Email (billing)' : 'E-post (faktura)', id: 'return-firstName' });
      }
      if (!answers.billingInfo.phone) {
        missing.push({ field: 'billingPhone', label: isEn ? 'Phone (billing)' : 'Telefon (faktura)', id: 'return-firstName' });
      }
    }
    
    // For upload flow, check if files are uploaded
    if (answers.documentSource === 'upload') {
      if (answers.uploadedFiles.length !== answers.quantity || answers.uploadedFiles.some(file => !file)) {
        missing.push({ field: 'files', label: isEn ? 'Document files' : 'Dokumentfiler', id: 'file-upload-0' });
      }
    }

    // Stockholm courier return requires a delivery date
    if (answers.returnService === 'stockholm-city' && !answers.returnDeliveryDate) {
      missing.push({
        field: 'returnDeliveryDate',
        label: isEn ? 'Delivery date (Stockholm courier)' : 'Leveransdatum (Stockholm courier)',
        id: 'return-delivery-date'
      });
    }
    
    return missing;
  };

  // Scroll to first error field
  const scrollToFirstError = () => {
    const missing = getMissingFields();
    if (missing.length > 0) {
      const firstErrorElement = document.getElementById(missing[0].id);
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorElement.focus();
      }
    }
  };

  // Render validation summary
  const renderValidationSummary = () => {
    if (!showValidation) return null;
    
    const missing = getMissingFields();
    if (missing.length === 0) return null;
    
    return (
      <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              {locale === 'en' 
                ? `Please fill in the following ${missing.length} field${missing.length > 1 ? 's' : ''}:` 
                : `Vänligen fyll i följande ${missing.length} fält:`}
            </h3>
            <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
              {missing.map((item) => (
                <li key={item.field}>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(item.id);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.focus();
                      }
                    }}
                    className="underline hover:text-red-900"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

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

  // Dummy clearProgress function (should be passed as prop ideally)
  const clearProgress = () => {
    // This would normally clear saved progress
    sessionStorage.removeItem('orderDraft');
  };

  const hasNotarization = answers.services.includes('notarization');
  const notarizationDetails: any = (answers as any).notarizationDetails || {};

  const requiresIdDocument =
    hasNotarization && (notarizationDetails.signature || notarizationDetails.signingAuthority);
  const requiresSigningAuthorityDocument =
    hasNotarization && notarizationDetails.signingAuthority;

  const hasIdDocumentNow = !!(answers as any).idDocumentFile;
  const willSendIdDocumentLater = !!(answers as any).willSendIdDocumentLater;
  const hasSigningAuthorityNow = !!(answers as any).signingAuthorityFile;
  const willSendSigningAuthorityLater = !!(answers as any).willSendSigningAuthorityLater;

  const notarizationDocsOk =
    (!requiresIdDocument || hasIdDocumentNow || willSendIdDocumentLater) &&
    (!requiresSigningAuthorityDocument || hasSigningAuthorityNow || willSendSigningAuthorityLater);

  const getFilesForUpload = () => {
    const baseFiles =
      answers.documentSource === 'upload' ? (answers.uploadedFiles || []) : [];

    const extraFiles: any[] = [];

    const idDoc = (answers as any).idDocumentFile;
    const signingAuth = (answers as any).signingAuthorityFile;

    if (idDoc) extraFiles.push(idDoc);
    if (signingAuth) extraFiles.push(signingAuth);

    return [...baseFiles, ...extraFiles];
  };

  const renderNotarizationSupportSection = () => {
    if (!hasNotarization || !notarizationDetails) return null;
    if (!notarizationDetails.signature && !notarizationDetails.signingAuthority) return null;

    const isEn = locale === 'en';

    // Helper to render a compact upload row
    const renderUploadRow = (
      id: string,
      title: string,
      fileKey: 'idDocumentFile' | 'signingAuthorityFile',
      laterKey: 'willSendIdDocumentLater' | 'willSendSigningAuthorityLater'
    ) => {
      const file = (answers as any)[fileKey];
      const willSendLater = (answers as any)[laterKey];
      const isComplete = file || willSendLater;

      return (
        <div className={`flex flex-col gap-3 p-3 rounded-lg sm:flex-row sm:items-center sm:justify-between ${isComplete ? 'bg-green-50 border border-green-200' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center space-x-3">
            <span className={`text-lg ${isComplete ? 'text-green-600' : 'text-gray-400'}`}>
              {isComplete ? '✓' : '○'}
            </span>
            <div>
              <span className="text-sm font-medium text-gray-900">{title}</span>
              {file && (
                <p className="text-xs text-green-700 break-words">{file.name}</p>
              )}
              {willSendLater && !file && (
                <p className="text-xs text-blue-600">{isEn ? 'Will send later' : 'Skickas senare'}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:space-x-2">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              id={id}
              className="hidden"
              onChange={(e) => {
                const newFile = e.target.files?.[0] || null;
                setAnswers(prev => ({ ...prev, [fileKey]: newFile }));
              }}
            />
            <label
              htmlFor={id}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
            >
              {file ? (isEn ? 'Change' : 'Byt') : (isEn ? 'Upload' : 'Ladda upp')}
            </label>
            <label className="flex items-center space-x-1 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={!!willSendLater}
                onChange={(e) => setAnswers(prev => ({ ...prev, [laterKey]: e.target.checked }))}
              />
              <span className="text-xs text-gray-600">{isEn ? 'Later' : 'Senare'}</span>
            </label>
          </div>
        </div>
      );
    };

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-blue-600">📋</span>
          <h3 className="text-sm font-semibold text-blue-900">
            {isEn ? 'Required documents for notarization' : 'Dokument som krävs för notarisering'}
          </h3>
        </div>

        <div className="space-y-2">
          {requiresIdDocument && renderUploadRow(
            'id-document-upload',
            isEn ? 'ID or passport copy' : 'ID- eller passkopia',
            'idDocumentFile',
            'willSendIdDocumentLater'
          )}

          {notarizationDetails.signingAuthority && renderUploadRow(
            'signing-authority-upload',
            isEn ? 'Proof of signing authority' : 'Bevis på firmateckningsrätt',
            'signingAuthorityFile',
            'willSendSigningAuthorityLater'
          )}
        </div>

        <p className="text-xs text-blue-700 mt-3">
          {isEn 
            ? 'Upload now or check "Later" to send by email after ordering.'
            : 'Ladda upp nu eller kryssa i "Senare" för att skicka via e-post efter beställning.'}
        </p>
      </div>
    );
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
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6 mb-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4">
          {t('orderFlow.step10.summaryTitle')}
        </h3>

        <div className="space-y-3">
          {/* Country and Document Type */}
          <div className="flex flex-col gap-1 py-2 border-b border-green-200 sm:flex-row sm:justify-between sm:items-center">
            <span className="text-gray-700">{t('orderFlow.step10.country')}:</span>
            <span className="font-medium text-gray-900 break-words">
              {(() => {
                const country = allCountries.find(c => c.code === answers.country);
                const name = country?.name || answers.country;
                return (
                  <span className="inline-flex items-center space-x-1">
                    <CountryFlag code={answers.country} size={20} />
                    <span>{name}</span>
                  </span>
                );
              })()}
            </span>
          </div>

          <div className="flex flex-col gap-1 py-2 border-b border-green-200 sm:flex-row sm:justify-between sm:items-center">
            <span className="text-gray-700">{t('orderFlow.step10.documentType')}:</span>
            <span className="font-medium text-gray-900 break-words">
              {answers.documentType === 'birthCertificate' ? t('orderFlow.step2.birthCertificate') :
               answers.documentType === 'marriageCertificate' ? t('orderFlow.step2.marriageCertificate') :
               answers.documentType === 'certificateOfOrigin' ? t('orderFlow.step2.certificateOfOrigin') :
               answers.documentType === 'diploma' ? t('orderFlow.step2.diploma') :
               answers.documentType === 'passport' ? t('orderFlow.step2.passport') :
               answers.documentType === 'commercial' ? t('orderFlow.step2.commercial') :
               answers.documentType === 'powerOfAttorney' ? t('orderFlow.step2.powerOfAttorney') : t('orderFlow.step2.other')}
            </span>
          </div>

          <div className="flex flex-col gap-1 py-2 border-b border-green-200 sm:flex-row sm:justify-between sm:items-center">
            <span className="text-gray-700">{t('orderFlow.step10.quantity')}:</span>
            <span className="font-medium text-gray-900 break-words">{answers.quantity} st</span>
          </div>

          {/* Selected Services */}
          <div className="py-2">
            <span className="text-gray-700 font-medium">{t('orderFlow.step10.services')}:</span>
            <div className="mt-2 space-y-2">
              {loadingPricing ? (
                <div className="text-sm text-gray-500">Beräknar priser...</div>
              ) : (
                pricingBreakdown.map((item, index) => {
                  // Determine if this is a per-document or per-order fee
                  const isPerDocument = item.quantity && item.quantity > 1;
                  
                  // Check if price is TBC (to be confirmed) - use the isTBC flag from pricing service
                  const isTBC = item.isTBC === true;
                  
                  // Build the price detail string
                  let priceDetail = '';
                  if (isPerDocument && item.unitPrice && !isTBC) {
                    priceDetail = `(${item.unitPrice} kr × ${item.quantity})`;
                  }
                  
                  // Format price display
                  const priceDisplay = isTBC 
                    ? (locale === 'en' ? 'TBC' : 'Bekräftas')
                    : `${item.total?.toLocaleString() || 0} kr`;
                  
                  return (
                    <div key={`${item.service}_${index}`} className="text-sm">
                      <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center">
                        <span className="text-gray-600 break-words">
                          • {translatePricingDescription(item.description)}{' '}
                          {priceDetail}
                        </span>
                        <span className={`font-medium break-words ${isTBC ? 'text-amber-600' : 'text-gray-900'}`}>
                          {priceDisplay}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Own Return Tracking Number - only show if customer provides their own return */}
          {answers.returnService === 'own-delivery' && answers.ownReturnTrackingNumber && (
            <div className="flex flex-col gap-1 py-2 border-b border-green-200 sm:flex-row sm:justify-between sm:items-center">
              <span className="text-gray-700">
                {t('orderFlow.step9.ownReturnTrackingLabel', 'Spårningsnummer')}:
              </span>
              <span className="font-medium text-gray-900 break-words">
                {answers.ownReturnTrackingNumber}
              </span>
            </div>
          )}

          {/* Total Price */}
          <div className="flex flex-col py-3 border-t-2 border-green-300 bg-green-100 -mx-4 sm:-mx-6 px-4 sm:px-6 rounded-b-lg">
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center">
              <span className="text-lg font-semibold text-green-900">
                {t('orderFlow.step10.total')}:
                {pricingBreakdown.some(item => item.isTBC) && '*'}
              </span>
              <span className="text-xl font-bold text-green-900">
                {(() => {
                  if (loadingPricing) return 'Beräknar...';

                  // Use totalPrice from pricingBreakdown - exclude TBC items from total
                  const total = pricingBreakdown.reduce((sum, item) => sum + (item.isTBC ? 0 : (item.total || 0)), 0);
                  
                  return `${total.toLocaleString()} kr`;
                })()}
              </span>
            </div>
            {pricingBreakdown.some(item => item.isTBC) && (
              <p className="text-xs text-green-700 mt-1">
                * {locale === 'en' 
                  ? 'Excl. official fees that will be confirmed separately' 
                  : 'Exkl. officiella avgifter som bekräftas separat'}
              </p>
            )}
          </div>
        </div>
      </div>

      {answers.documentSource === 'upload' ? (
        <div className="space-y-4">
          {/* Uploaded Files Summary */}
          <div className={`${answers.willSendMainDocsLater ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'} border rounded-lg p-4 mb-6`}>
            <div className="flex items-start">
              <span className="text-2xl mr-3">{answers.willSendMainDocsLater ? '📧' : '✅'}</span>
              <div className="flex-1">
                <div className={`font-medium mb-2 ${answers.willSendMainDocsLater ? 'text-amber-900' : 'text-green-900'}`}>
                  {answers.willSendMainDocsLater 
                    ? (locale === 'en' ? 'Documents will be sent via email' : 'Dokument skickas via e-post')
                    : (locale === 'en' ? 'Uploaded documents' : 'Uppladdade dokument')}
                </div>
                {answers.willSendMainDocsLater ? (
                  <div className="text-sm text-amber-700">
                    {locale === 'en' 
                      ? `You will send ${answers.quantity} document${answers.quantity > 1 ? 's' : ''} to info@doxvl.se after placing your order.`
                      : `Du skickar ${answers.quantity} dokument till info@doxvl.se efter att du lagt din beställning.`}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {answers.uploadedFiles.map((file, index) => (
                      <div key={index} className="text-sm text-green-700 flex items-center">
                        <span className="mr-2">📄</span>
                        {file?.name || `Document ${index + 1}`}
                      </div>
                    ))}
                  </div>
                )}
                {/* Show support documents if uploaded */}
                {(answers.idDocumentFile || answers.registrationCertFile || answers.signingAuthorityIdFile) && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <div className="text-xs font-medium text-green-800 mb-1">
                      {locale === 'en' ? 'Supporting documents:' : 'Stöddokument:'}
                    </div>
                    {answers.idDocumentFile && (
                      <div className="text-sm text-green-700 flex items-center">
                        <span className="mr-2">🪪</span>
                        {answers.idDocumentFile.name}
                      </div>
                    )}
                    {answers.registrationCertFile && (
                      <div className="text-sm text-green-700 flex items-center">
                        <span className="mr-2">🏢</span>
                        {answers.registrationCertFile.name}
                      </div>
                    )}
                    {answers.signingAuthorityIdFile && (
                      <div className="text-sm text-green-700 flex items-center">
                        <span className="mr-2">🪪</span>
                        {answers.signingAuthorityIdFile.name}
                      </div>
                    )}
                  </div>
                )}
                {/* Show "will send later" notice for support docs */}
                {(answers.willSendIdDocumentLater || answers.willSendRegistrationCertLater || answers.willSendSigningAuthorityIdLater) && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <div className="text-xs text-amber-700 flex items-center">
                      <span className="mr-2">📧</span>
                      {locale === 'en' 
                        ? 'Some supporting documents will be sent later via email'
                        : 'Vissa stöddokument skickas senare via e-post'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>


          {/* Terms and Conditions Acceptance */}
          <TermsAcceptance locale={locale} id="terms-acceptance-upload" />

          {/* Customer Information Form */}
          <CustomerInfoForm
            answers={answers}
            setAnswers={setAnswers}
            locale={locale}
            addressInputRef={addressInputRef}
            showValidation={showValidation}
          />

          {/* reCAPTCHA */}
          <div className="pt-4">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''}
            />
          </div>

          {/* Validation Summary */}
          {renderValidationSummary()}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button
              onClick={onBack}
              className="w-full px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 sm:w-auto"
            >
              {t('orderFlow.backToPrevious')}
            </button>
            <button
              ref={submitButtonRef}
              onClick={async (event) => {
                // Validate required fields first
                const missing = getMissingFields();
                if (missing.length > 0) {
                  setShowValidation(true);
                  scrollToFirstError();
                  return;
                }

                // Check reCAPTCHA
                const recaptchaToken = recaptchaRef.current?.getValue();
                if (!recaptchaToken) {
                  toast.error('Vänligen verifiera att du inte är en robot genom att slutföra reCAPTCHA.');
                  return;
                }

                // Prevent multiple submissions - check ref immediately (more reliable than state)
                if (submissionInProgressRef.current || isSubmitting || isInCooldown) {
                  event.preventDefault();
                  return;
                }

                // Immediately disable button in DOM to prevent any further clicks
                if (submitButtonRef.current) {
                  submitButtonRef.current.disabled = true;
                  submitButtonRef.current.style.opacity = '0.5';
                  submitButtonRef.current.style.cursor = 'not-allowed';
                }

                submissionInProgressRef.current = true;

                try {
                  setShowFullScreenLoader(true);

                  // Try to match customer by email domain for custom pricing
                  let customerPricingData = undefined;
                  if (answers.customerInfo?.email) {
                    const matchedCustomer = await getCustomerByEmailDomain(answers.customerInfo.email);
                    if (matchedCustomer) {
                      customerPricingData = {
                        customPricing: matchedCustomer.customPricing,
                        vatExempt: matchedCustomer.vatExempt,
                        companyName: matchedCustomer.companyName
                      };
                    }
                  }

                  // Calculate pricing using Firebase pricing service
                  const pricingResult = await calculateOrderPrice({
                    country: answers.country,
                    services: answers.services,
                    quantity: answers.quantity,
                    expedited: answers.expedited,
                    returnService: answers.returnService,
                    returnServices: returnServices,
                    scannedCopies: answers.scannedCopies,
                    pickupService: answers.pickupService,
                    premiumDelivery: answers.premiumDelivery,
                    customerPricing: customerPricingData
                  });

                  // Prepare order data
                  const orderData = {
                    country: answers.country,
                    documentType: answers.documentType,
                    services: answers.services,
                    quantity: answers.quantity,
                    expedited: answers.expedited,
                    documentSource: answers.documentSource,
                    scannedCopies: answers.scannedCopies,
                    pickupService: answers.pickupService,
                    pickupMethod: answers.pickupMethod,
                    premiumPickup: answers.premiumPickup,
                    pickupAddress: answers.pickupAddress,
                    pickupDate: answers.pickupDate,
                    pickupTimeWindow: answers.pickupTimeWindow,
                    returnService: answers.returnService,
                    returnTrackingNumber:
                      answers.returnService === 'own-delivery'
                        ? (answers.ownReturnTrackingNumber || '')
                        : '',
                    premiumDelivery: answers.premiumDelivery,
                    returnDeliveryDate: answers.returnDeliveryDate,
                    returnAddress: answers.returnAddress,
                    customerInfo: answers.customerInfo,
                    paymentMethod: 'invoice',
                    totalPrice: pricingResult.totalPrice,
                    pricingBreakdown: pricingResult.breakdown,
                    invoiceReference: answers.invoiceReference,
                    additionalNotes: answers.additionalNotes,
                    locale: locale
                  };

                  // Submit order (include main documents + any notarization support files)
                  const orderId = await createOrderWithFiles(orderData, getFilesForUpload());

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
                  } catch (emailError) {
                    // Don't block the order flow if email notification fails
                  }

                  // Reset reCAPTCHA
                  recaptchaRef.current?.reset();

                  // Redirect to confirmation page after a short delay
                  setTimeout(() => {
                    router.push(`/bekraftelse?orderId=${orderId}`);
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
                  setShowFullScreenLoader(false);

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
                isInCooldown
              }
              className={`w-full px-6 py-3 rounded-md font-medium text-white transition-all duration-200 sm:w-auto ${
                isSubmitting || isInCooldown
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-custom-button hover:bg-custom-button-hover'
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
          {/* Address Display for Original Documents - only show if services are selected */}
          {!answers.helpMeChooseServices && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 mb-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
                <div className="sm:ml-4">
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
          )}

          {/* Info message when customer chose "help me choose" */}
          {answers.helpMeChooseServices && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 mb-6">
              <div className="flex items-start">
                <span className="text-2xl mr-3">📋</span>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    {locale === 'en' ? 'We will contact you' : 'Vi kontaktar dig'}
                  </h3>
                  <p className="text-sm text-blue-700">
                    {locale === 'en' 
                      ? 'Since you selected "Unsure about services", we will review your order and contact you with a recommendation and price before proceeding. You will receive shipping instructions after we confirm the services.'
                      : 'Eftersom du valde "Osäker på tjänster" kommer vi att granska din beställning och kontakta dig med en rekommendation och pris innan vi fortsätter. Du får leveransinstruktioner efter att vi bekräftat tjänsterna.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Customer Information Form */}
          <CustomerInfoForm
            answers={answers}
            setAnswers={setAnswers}
            locale={locale}
            addressInputRef={addressInputRef}
            showValidation={showValidation}
          />

          {/* Terms and Conditions Acceptance */}
          <TermsAcceptance locale={locale} id="terms-acceptance-original" />

          {/* reCAPTCHA */}
          <div className="pt-4">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''}
            />
          </div>

          {/* Validation Summary */}
          {renderValidationSummary()}

          <div className="mt-8 flex justify-between">
            <button
              onClick={onBack}
              className="px-4 sm:px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              {t('orderFlow.backToPrevious')}
            </button>
            <button
              ref={submitButtonRef}
              onClick={async (event) => {
                // Validate required fields first
                const missing = getMissingFields();
                if (missing.length > 0) {
                  setShowValidation(true);
                  scrollToFirstError();
                  return;
                }

                // Check reCAPTCHA
                const recaptchaToken = recaptchaRef.current?.getValue();
                if (!recaptchaToken) {
                  toast.error('Vänligen verifiera att du inte är en robot genom att slutföra reCAPTCHA.');
                  return;
                }

                // Prevent multiple submissions
                if (submissionInProgressRef.current || isSubmitting || isInCooldown) {
                  event.preventDefault();
                  return;
                }

                // Immediately disable button in DOM to prevent any further clicks
                if (submitButtonRef.current) {
                  submitButtonRef.current.disabled = true;
                  submitButtonRef.current.style.opacity = '0.5';
                  submitButtonRef.current.style.cursor = 'not-allowed';
                }

                submissionInProgressRef.current = true;

                try {
                  // Try to match customer by email domain for custom pricing
                  let customerPricingData2 = undefined;
                  if (answers.customerInfo?.email) {
                    const matchedCustomer2 = await getCustomerByEmailDomain(answers.customerInfo.email);
                    if (matchedCustomer2) {
                      customerPricingData2 = {
                        customPricing: matchedCustomer2.customPricing,
                        vatExempt: matchedCustomer2.vatExempt,
                        companyName: matchedCustomer2.companyName
                      };
                    }
                  }

                  // Calculate pricing using Firebase pricing service
                  const pricingResult = await calculateOrderPrice({
                    country: answers.country,
                    services: answers.services,
                    quantity: answers.quantity,
                    expedited: answers.expedited,
                    returnService: answers.returnService,
                    returnServices: returnServices,
                    scannedCopies: answers.scannedCopies,
                    pickupService: answers.pickupService,
                    premiumDelivery: answers.premiumDelivery,
                    customerPricing: customerPricingData2
                  });

                  // Prepare order data
                  const orderData = {
                    country: answers.country,
                    documentType: answers.documentType,
                    services: answers.services,
                    quantity: answers.quantity,
                    expedited: answers.expedited,
                    documentSource: answers.documentSource,
                    scannedCopies: answers.scannedCopies,
                    pickupService: answers.pickupService,
                    pickupMethod: answers.pickupMethod,
                    premiumPickup: answers.premiumPickup,
                    pickupAddress: answers.pickupAddress,
                    pickupDate: answers.pickupDate,
                    pickupTimeWindow: answers.pickupTimeWindow,
                    returnService: answers.returnService,
                    premiumDelivery: answers.premiumDelivery,
                    returnDeliveryDate: answers.returnDeliveryDate,
                    returnAddress: answers.returnAddress,
                    customerInfo: answers.customerInfo,
                    paymentMethod: 'invoice',
                    totalPrice: pricingResult.totalPrice,
                    pricingBreakdown: pricingResult.breakdown,
                    invoiceReference: answers.invoiceReference,
                    additionalNotes: answers.additionalNotes,
                    locale: locale
                  };

                  // Submit order (include any notarization support files)
                  const orderId = await createOrderWithFiles(orderData, getFilesForUpload());

                  // Clear saved progress since order is complete
                  clearProgress();

                  // Expose order number for shipping label printing in this session
                  try { (window as any).__finalOrderNumber = orderId; } catch {}

                  // Send email notification to business (styled HTML via customerEmails)
                  try {
                    const siteUrlInternal = process.env.NEXT_PUBLIC_SITE_URL || 'https://doxvl-51a30.web.app';
                    
                    // Get pickup method display name
                    const getPickupMethodName = (method?: string): string => {
                      const methods: { [key: string]: string } = {
                        'dhl-sweden': 'DHL Sverige',
                        'dhl-europe': 'DHL Europa',
                        'dhl-worldwide': 'DHL Världen',
                        'stockholm-city': 'Stockholm City Bud'
                      };
                      return method ? methods[method] || method : 'Ej angiven';
                    };
                    
                    // Get premium pickup display name
                    const getPremiumPickupName = (premium?: string): string => {
                      const premiums: { [key: string]: string } = {
                        'dhl-pre-12': 'DHL Express före 12:00',
                        'dhl-pre-9': 'DHL Express före 09:00',
                        'stockholm-express': 'Stockholm Express',
                        'stockholm-sameday': 'Stockholm urgent'
                      };
                      return premium ? premiums[premium] || premium : '';
                    };

                    const getStockholmLevel = (premium?: string): string => {
                      if (!premium) return 'End of day';
                      if (premium === 'stockholm-sameday') return 'Urgent (2h)';
                      if (premium === 'stockholm-express') return 'Express (4h)';
                      return premium;
                    };
                    
                    const hasPickup = answers.pickupService === true;
                    const pickupAddr = answers.pickupAddress;

                    const isStockholmPickup = hasPickup && answers.pickupMethod === 'stockholm-city';
                    const isStockholmReturn = answers.returnService === 'stockholm-city';

                    const returnAddr = answers.returnAddress;
                    const returnAddrLine1 = [returnAddr?.firstName, returnAddr?.lastName].filter(Boolean).join(' ').trim();
                    const returnAddrLine2 = [returnAddr?.companyName].filter(Boolean).join(' ').trim();
                    const returnAddrLine3 = [returnAddr?.street, returnAddr?.addressLine2].filter(Boolean).join(', ').trim();
                    const returnAddrLine4 = [returnAddr?.postalCode, returnAddr?.city].filter(Boolean).join(' ').trim();
                    
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
    .pickup-alert { background:#FEF3C7; border:2px solid #F59E0B; border-radius:8px; padding:16px; margin:16px 0; }
    .pickup-alert-header { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
    .pickup-alert-icon { font-size:28px; }
    .pickup-alert-title { color:#92400E; font-size:18px; font-weight:700; margin:0; }
    .pickup-address { background:#fff; border:2px solid #F59E0B; border-radius:6px; padding:14px; margin-top:12px; }
    .return-alert { background:#E0F2FE; border:2px solid #0284C7; border-radius:8px; padding:16px; margin:16px 0; }
    .return-alert-title { color:#075985; font-size:18px; font-weight:700; margin:0; }
    .return-address { background:#fff; border:2px solid #0284C7; border-radius:6px; padding:14px; margin-top:12px; }
  </style>
  </head>
  <body>
    <div class="wrap">
      <div class="header">
        <h1>Ny beställning${hasPickup ? ' 📦 UPPHÄMTNING BESTÄLLD' : ''}</h1>
      </div>
      <div class="content">
        <div class="badge">Order #${orderId}</div>

        ${hasPickup ? `
        <!-- PICKUP ALERT - VERY VISIBLE -->
        <div class="pickup-alert">
          <div class="pickup-alert-header">
            <span class="pickup-alert-icon">🚚</span>
            <h2 class="pickup-alert-title">UPPHÄMTNING BESTÄLLD!</h2>
          </div>
          <p style="margin:0 0 8px 0; color:#92400E; font-weight:600;">
            Kunden har beställt att vi hämtar dokumenten. Boka DHL-upphämtning!
          </p>
          <div class="row" style="border:none; padding:4px 0;"><span class="label">Upphämtningstjänst</span><span class="value">${getPickupMethodName(answers.pickupMethod)}</span></div>
          ${isStockholmPickup ? `<div class="row" style="border:none; padding:4px 0;"><span class="label">Nivå</span><span class="value">${getStockholmLevel(answers.premiumPickup)}</span></div>` : (answers.premiumPickup ? `<div class="row" style="border:none; padding:4px 0;"><span class="label">Premium</span><span class="value">${getPremiumPickupName(answers.premiumPickup)}</span></div>` : '')}
          ${isStockholmPickup && answers.pickupDate ? `<div class="row" style="border:none; padding:4px 0;"><span class="label">Datum</span><span class="value">${answers.pickupDate}</span></div>` : ''}
          ${isStockholmPickup && answers.pickupTimeWindow ? `<div class="row" style="border:none; padding:4px 0;"><span class="label">Tidsfönster</span><span class="value">${answers.pickupTimeWindow}</span></div>` : ''}
          
          ${pickupAddr && pickupAddr.street ? `
          <div class="pickup-address">
            <div style="font-weight:700; margin-bottom:8px; color:#92400E;">📍 Hämtningsadress:</div>
            ${pickupAddr.company ? `<div style="font-weight:700;">${pickupAddr.company}</div>` : ''}
            <div>${pickupAddr.name || ''}</div>
            <div>${pickupAddr.street}</div>
            <div>${pickupAddr.postalCode} ${pickupAddr.city}</div>
          </div>
          ` : ''}
        </div>
        ` : ''}

        ${isStockholmReturn ? `
        <!-- STOCKHOLM COURIER RETURN ALERT -->
        <div class="return-alert">
          <div class="pickup-alert-header">
            <span class="pickup-alert-icon">⚡</span>
            <h2 class="return-alert-title">STOCKHOLM COURIER - LEVERANS</h2>
          </div>
          <div class="row" style="border:none; padding:4px 0;"><span class="label">Nivå</span><span class="value">${getStockholmLevel(answers.premiumDelivery)}</span></div>
          ${answers.returnDeliveryDate ? `<div class="row" style="border:none; padding:4px 0;"><span class="label">Datum</span><span class="value">${answers.returnDeliveryDate}</span></div>` : ''}

          <div class="return-address">
            <div style="font-weight:700; margin-bottom:8px; color:#075985;">📍 Leveransadress:</div>
            ${returnAddrLine2 ? `<div style="font-weight:700;">${returnAddrLine2}</div>` : ''}
            ${returnAddrLine1 ? `<div>${returnAddrLine1}</div>` : ''}
            ${returnAddrLine3 ? `<div>${returnAddrLine3}</div>` : ''}
            ${returnAddrLine4 ? `<div>${returnAddrLine4}</div>` : ''}
          </div>
        </div>
        ` : ''}

        <div class="section">
          <div class="row"><span class="label">Datum</span><span class="value">${new Date().toLocaleDateString('sv-SE')}</span></div>
          <div class="row"><span class="label">Land</span><span class="value">${allCountries.find(c => c.code === answers.country)?.name}</span></div>
          <div class="row"><span class="label">Dokumenttyp</span><span class="value">${answers.documentType === 'birthCertificate' ? 'Födelsebevis' : answers.documentType === 'marriageCertificate' ? 'Vigselbevis' : answers.documentType === 'diploma' ? 'Examensbevis' : answers.documentType === 'commercial' ? 'Handelsdokument' : answers.documentType === 'powerOfAttorney' ? 'Fullmakt' : 'Annat dokument'}</span></div>
          <div class="row"><span class="label">Antal dokument</span><span class="value">${answers.quantity} st</span></div>
          <div class="row"><span class="label">Valda tjänster</span><span class="value">${answers.services.map(s => getServiceName(s)).join(', ')}</span></div>
          <div class="row"><span class="label">Totalbelopp</span><span class="value">${pricingResult.totalPrice} kr</span></div>
          <div class="row"><span class="label">Dokumentkälla</span><span class="value">${answers.documentSource === 'original' ? 'Originaldokument' : 'Uppladdade filer'}</span></div>
          <div class="row"><span class="label">Upphämtning</span><span class="value" style="${hasPickup ? 'color:#D97706; font-weight:800;' : ''}">${hasPickup ? '✅ JA - BOKA UPPHÄMTNING' : '❌ Nej'}</span></div>
          <div class="row"><span class="label">Returfrakt</span><span class="value">${answers.returnService ? returnServices.find(s => s.id === answers.returnService)?.name : 'Ej vald'}</span></div>
        </div>

        <div class="section">
          <div class="row"><span class="label">Kund</span><span class="value">${answers.customerInfo.firstName} ${answers.customerInfo.lastName}</span></div>
          <div class="row"><span class="label">E-post</span><span class="value">${answers.customerInfo.email}</span></div>
          <div class="row"><span class="label">Telefon</span><span class="value">${answers.customerInfo.phone || '-'}</span></div>
          <div class="row"><span class="label">Adress</span><span class="value">${answers.customerInfo.address}, ${answers.customerInfo.postalCode} ${answers.customerInfo.city}</span></div>
          ${answers.invoiceReference ? `<div class="row"><span class="label">Fakturareferens</span><span class="value">${answers.invoiceReference}</span></div>` : ''}
        </div>

        ${answers.documentSource === 'original' && !hasPickup ? `
        <div class="section">
          <div class="label" style="margin-bottom:6px;">Inkommande postadress (kund skickar själv)</div>
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

        ${answers.documentSource === 'upload' && answers.uploadedFiles && answers.uploadedFiles.length > 0 ? `
        <div class="section" style="background:#ECFDF5; border:2px solid #10B981;">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
            <span style="font-size:24px;">📎</span>
            <h3 style="margin:0; color:#065F46; font-size:16px; font-weight:700;">UPPLADDADE FILER (${answers.uploadedFiles.length} st)</h3>
          </div>
          <div style="background:#fff; border:1px solid #A7F3D0; border-radius:6px; padding:12px;">
            ${answers.uploadedFiles.map((file, i) => `<div style="padding:4px 0; ${i < answers.uploadedFiles.length - 1 ? 'border-bottom:1px solid #D1FAE5;' : ''}">${i + 1}. ${file?.name || 'Fil ' + (i + 1)}</div>`).join('')}
          </div>
          <a class="button" href="${siteUrlInternal}/admin/orders/${orderId}" target="_blank" rel="noopener" style="margin-top:12px;">📂 Visa filer i admin</a>
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
                  } catch (emailError) {
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
        (answers.pickupService ?
          `<div class="next-steps">
            <h3>📦 Next steps</h3>
            <p>You have selected <strong>pickup service</strong>. We will send you a DHL shipping label via email with instructions for the pickup.</p>
            <p style="font-size:13px; color:#5f6368; margin-top:12px;">You will receive the shipping label within 1 business day.</p>
          </div>`
          :
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
          </div>`)
        :
        `<div class="next-steps">
          <h3>✅ Your files have been received</h3>
          <p>We have received the following ${answers.uploadedFiles?.length || answers.quantity} file(s):</p>
          <div style="background:#fff; border:1px solid #a7f3d0; border-radius:6px; padding:12px; margin:12px 0;">
            ${answers.uploadedFiles?.map((file, i) => `<div style="padding:4px 0; ${i < (answers.uploadedFiles?.length || 1) - 1 ? 'border-bottom:1px solid #d1fae5;' : ''}">📄 ${file?.name || 'Document ' + (i + 1)}</div>`).join('') || ''}
          </div>
          <p><strong>What happens next?</strong></p>
          <ol style="margin:8px 0; padding-left:20px;">
            <li>Our team will review your documents within 1-2 business days</li>
            <li>If we need additional information, we will contact you via email</li>
            <li>Once processing begins, you will receive status updates</li>
          </ol>
          <p style="font-size:13px; color:#5f6368;">Estimated processing time: 5-10 business days depending on services selected.</p>
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
        (answers.pickupService ?
          `<div class="next-steps">
            <h3>📦 Nästa steg</h3>
            <p>Du har valt <strong>upphämtningstjänst</strong>. Vi skickar en DHL-fraktsedel till dig via e-post med instruktioner för upphämtningen.</p>
            <p style="font-size:13px; color:#5f6368; margin-top:12px;">Du får fraktsedeln inom 1 arbetsdag.</p>
          </div>`
          :
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
          </div>`)
        :
        `<div class="next-steps">
          <h3>✅ Dina filer har mottagits</h3>
          <p>Vi har mottagit följande ${answers.uploadedFiles?.length || answers.quantity} fil(er):</p>
          <div style="background:#fff; border:1px solid #a7f3d0; border-radius:6px; padding:12px; margin:12px 0;">
            ${answers.uploadedFiles?.map((file, i) => `<div style="padding:4px 0; ${i < (answers.uploadedFiles?.length || 1) - 1 ? 'border-bottom:1px solid #d1fae5;' : ''}">📄 ${file?.name || 'Dokument ' + (i + 1)}</div>`).join('') || ''}
          </div>
          <p><strong>Vad händer nu?</strong></p>
          <ol style="margin:8px 0; padding-left:20px;">
            <li>Vårt team granskar dina dokument inom 1-2 arbetsdagar</li>
            <li>Om vi behöver ytterligare information kontaktar vi dig via e-post</li>
            <li>När behandlingen påbörjas får du statusuppdateringar</li>
          </ol>
          <p style="font-size:13px; color:#5f6368;">Uppskattad handläggningstid: 5-10 arbetsdagar beroende på valda tjänster.</p>
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
                  } catch (customerEmailError) {
                    // Don't block the order flow if customer email fails
                  }

                  // Redirect to confirmation page after a short delay
                  setTimeout(() => {
                    router.push(`/bekraftelse?orderId=${orderId}`);
                  }, 2000);

                } catch (error) {

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
                isInCooldown
              }
              className={`px-6 sm:px-8 py-3 font-semibold text-lg rounded-md transition-all duration-200 ${
                isSubmitting || submissionInProgressRef.current || isInCooldown
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50'
                  : 'bg-custom-button text-white hover:bg-custom-button-hover'
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

      {(showFullScreenLoader) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-900/70 to-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl px-6 sm:px-10 py-6 sm:py-8 max-w-md mx-4 text-center space-y-6 animate-fade-in">
            {/* Animated Logo/Icon */}
            <div className="flex justify-center">
              <div className="relative">
                {/* Outer ring */}
                <div className="w-20 h-20 rounded-full border-4 border-gray-200"></div>
                {/* Spinning ring */}
                <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-custom-button animate-spin"></div>
                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-8 h-8 text-custom-button" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {locale === 'en' ? 'Processing Your Order' : 'Behandlar din beställning'}
              </h2>
              <p className="text-gray-500 text-sm">
                {locale === 'en' ? 'Please wait while we secure your order' : 'Vänligen vänta medan vi säkrar din beställning'}
              </p>
            </div>

            {/* Progress steps */}
            <div className="space-y-3 text-left bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-gray-700">
                  {locale === 'en' ? 'Validating information' : 'Validerar information'}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-custom-button rounded-full flex items-center justify-center animate-pulse">
                  <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <span className="text-sm text-gray-700 font-medium">
                  {locale === 'en' ? 'Creating your order...' : 'Skapar din beställning...'}
                </span>
              </div>
              <div className="flex items-center space-x-3 opacity-50">
                <div className="flex-shrink-0 w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">3</span>
                </div>
                <span className="text-sm text-gray-500">
                  {locale === 'en' ? 'Sending confirmation' : 'Skickar bekräftelse'}
                </span>
              </div>
            </div>

            {/* Warning message */}
            <div className="flex items-center justify-center space-x-2 text-amber-600 bg-amber-50 rounded-lg py-3 px-4">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm font-medium">
                {locale === 'en' ? 'Do not close this window' : 'Stäng inte detta fönster'}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Step10ReviewSubmit;
