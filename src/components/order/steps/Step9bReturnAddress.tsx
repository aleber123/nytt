/**
 * Step 9b: Return Address
 * Collects the return address for DHL/Stockholm City deliveries
 * Similar to Step 7 pickup address form
 */

import React from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { StepContainer } from '../shared/StepContainer';
import { StepProps } from '../types';
import { ALL_COUNTRIES } from '@/components/order/data/countries';

interface Step9bProps extends Omit<StepProps, 'currentLocale'> {
  onSkip: () => void;
  currentLocale?: string;
}

export const Step9bReturnAddress: React.FC<Step9bProps> = ({
  answers,
  setAnswers,
  onNext,
  onBack,
  onSkip,
  currentLocale
}) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const locale = currentLocale || router.locale || 'sv';
  const isEn = locale === 'en';

  // State for showing validation errors
  const [showValidation, setShowValidation] = React.useState(false);

  // Check if this step should be shown
  const requiresReturnAddress = !!answers.returnService && 
    ['dhl-sweden', 'dhl-europe', 'dhl-worldwide', 'stockholm-city'].includes(answers.returnService);

  // Skip if return address is not required
  React.useEffect(() => {
    if (!requiresReturnAddress) {
      onSkip();
    }
  }, [requiresReturnAddress, onSkip]);

  // Pre-fill return address from pickup address if sameAsPickup is true and pickup service was used
  React.useEffect(() => {
    if (answers.pickupService && answers.returnAddress.sameAsPickup) {
      const pa = answers.pickupAddress;
      const hasPickupData = pa.name || pa.street || pa.postalCode || pa.city;
      const returnAddressEmpty = !answers.returnAddress.firstName && !answers.returnAddress.street;
      
      // Only pre-fill if pickup has data and return address is empty
      if (hasPickupData && returnAddressEmpty) {
        const nameParts = (pa.name || '').trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        setAnswers(prev => ({
          ...prev,
          returnAddress: {
            ...prev.returnAddress,
            firstName,
            lastName,
            companyName: pa.company || '',
            street: pa.street || '',
            postalCode: pa.postalCode || '',
            city: pa.city || '',
            country: pa.country || 'Sverige',
            countryCode: pa.country || 'SE'
          }
        }));
      }
    }
  }, [answers.pickupService, answers.returnAddress.sameAsPickup, answers.pickupAddress, setAnswers]);

  // Validation checks for each field
  const validation = {
    firstName: !answers.returnAddress.firstName,
    lastName: !answers.returnAddress.lastName,
    street: !answers.returnAddress.street,
    postalCode: !answers.returnAddress.postalCode,
    city: !answers.returnAddress.city,
    countryCode: !answers.returnAddress.countryCode,
    email: !answers.returnAddress.email,
    phone: !answers.returnAddress.phone
  };

  // Check if form is valid
  const isFormValid = !Object.values(validation).some(v => v);

  // Get list of missing fields for error message
  const getMissingFields = () => {
    const fields: string[] = [];
    if (validation.firstName) fields.push(isEn ? 'First name' : 'Förnamn');
    if (validation.lastName) fields.push(isEn ? 'Last name' : 'Efternamn');
    if (validation.street) fields.push(isEn ? 'Street address' : 'Gatuadress');
    if (validation.postalCode) fields.push(isEn ? 'Postal code' : 'Postnummer');
    if (validation.city) fields.push(isEn ? 'City' : 'Stad');
    if (validation.countryCode) fields.push(isEn ? 'Country' : 'Land');
    if (validation.email) fields.push(isEn ? 'Email' : 'E-post');
    if (validation.phone) fields.push(isEn ? 'Phone' : 'Telefon');
    return fields;
  };

  // Handle next button click with validation
  const handleNext = () => {
    if (!isFormValid) {
      setShowValidation(true);
      // Scroll to first error
      const firstErrorField = document.querySelector('.border-red-500');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      onNext();
    }
  };

  // Don't render if not required
  if (!requiresReturnAddress) {
    return null;
  }

  // Helper function for input styling
  const getInputClassName = (hasError: boolean) => {
    const base = "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button";
    return hasError && showValidation
      ? `${base} border-red-500 bg-red-50`
      : `${base} border-gray-300`;
  };

  return (
    <StepContainer
      title={isEn ? 'Return Address' : 'Returadress'}
      subtitle={isEn ? 'Where should we send your documents back?' : 'Vart ska vi skicka tillbaka dina dokument?'}
      onNext={handleNext}
      onBack={onBack}
      nextDisabled={false}
    >
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <span className="text-2xl mr-3">📦</span>
          <div>
            <div className="font-medium text-blue-900">
              {isEn ? 'Delivery address for your documents' : 'Leveransadress för dina dokument'}
            </div>
            <div className="text-sm text-blue-700">
              {isEn ? 'We will send your legalized documents to this address' : 'Vi skickar dina legaliserade dokument till denna adress'}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Same as pickup checkbox - only show if pickup service was selected */}
        {answers.pickupService && (
          <label className="flex items-center space-x-2 p-3 bg-white border border-blue-200 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={answers.returnAddress.sameAsPickup}
              onChange={(e) => {
                const checked = e.target.checked;
                if (checked) {
                  const pa = answers.pickupAddress;
                  const nameParts = (pa.name || '').trim().split(' ');
                  setAnswers(prev => ({
                    ...prev,
                    returnAddress: {
                      ...prev.returnAddress,
                      sameAsPickup: true,
                      firstName: nameParts[0] || '',
                      lastName: nameParts.slice(1).join(' ') || '',
                      companyName: pa.company || '',
                      street: pa.street || '',
                      postalCode: pa.postalCode || '',
                      city: pa.city || '',
                      country: pa.country || 'Sverige',
                      countryCode: 'SE'
                    }
                  }));
                } else {
                  setAnswers(prev => ({
                    ...prev,
                    returnAddress: { ...prev.returnAddress, sameAsPickup: false }
                  }));
                }
              }}
              className="h-5 w-5 text-primary-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">
              {isEn ? 'Same as pickup address' : 'Samma som upphämtningsadress'}
            </span>
          </label>
        )}
        {/* Company name - available for all customers (can deliver to a company) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isEn ? 'Company Name' : 'Företagsnamn'}
            <span className="text-gray-400 font-normal ml-1">({isEn ? 'if applicable' : 'om tillämpligt'})</span>
          </label>
          <input
            type="text"
            value={answers.returnAddress.companyName || ''}
            onChange={(e) => setAnswers(prev => ({
              ...prev,
              returnAddress: { ...prev.returnAddress, companyName: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button"
            placeholder={isEn ? 'Company name (leave empty if private address)' : 'Företagsnamn (lämna tomt om privatadress)'}
          />
        </div>

        {/* Name fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${showValidation && validation.firstName ? 'text-red-600' : 'text-gray-700'}`}>
              {isEn ? 'First Name' : 'Förnamn'} *
            </label>
            <input
              type="text"
              value={answers.returnAddress.firstName}
              onChange={(e) => setAnswers(prev => ({
                ...prev,
                returnAddress: { ...prev.returnAddress, firstName: e.target.value }
              }))}
              className={getInputClassName(validation.firstName)}
              placeholder={isEn ? 'First name' : 'Förnamn'}
              required
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${showValidation && validation.lastName ? 'text-red-600' : 'text-gray-700'}`}>
              {isEn ? 'Last Name' : 'Efternamn'} *
            </label>
            <input
              type="text"
              value={answers.returnAddress.lastName}
              onChange={(e) => setAnswers(prev => ({
                ...prev,
                returnAddress: { ...prev.returnAddress, lastName: e.target.value }
              }))}
              className={getInputClassName(validation.lastName)}
              placeholder={isEn ? 'Last name' : 'Efternamn'}
              required
            />
          </div>
        </div>

        {/* Street address */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${showValidation && validation.street ? 'text-red-600' : 'text-gray-700'}`}>
            {isEn ? 'Street Address' : 'Gatuadress'} *
          </label>
          <input
            type="text"
            value={answers.returnAddress.street}
            onChange={(e) => setAnswers(prev => ({
              ...prev,
              returnAddress: { ...prev.returnAddress, street: e.target.value }
            }))}
            className={getInputClassName(validation.street)}
            placeholder={isEn ? 'Street address' : 'Gatuadress'}
            required
          />
        </div>

        {/* Address line 2 - c/o, apartment, floor, etc. */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isEn ? 'Address Line 2' : 'Adressrad 2'}
            <span className="text-gray-400 font-normal ml-1">({isEn ? 'optional' : 'valfritt'})</span>
          </label>
          <input
            type="text"
            value={answers.returnAddress.addressLine2 || ''}
            onChange={(e) => setAnswers(prev => ({
              ...prev,
              returnAddress: { ...prev.returnAddress, addressLine2: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button"
            placeholder={isEn ? 'c/o, apartment, floor, etc.' : 'c/o, lägenhet, våning, etc.'}
          />
        </div>

        {/* Postal code and city */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${showValidation && validation.postalCode ? 'text-red-600' : 'text-gray-700'}`}>
              {isEn ? 'Postal Code' : 'Postnummer'} *
            </label>
            <input
              type="text"
              value={answers.returnAddress.postalCode}
              onChange={(e) => setAnswers(prev => ({
                ...prev,
                returnAddress: { ...prev.returnAddress, postalCode: e.target.value }
              }))}
              className={getInputClassName(validation.postalCode)}
              placeholder={isEn ? 'Postal code' : 'Postnummer'}
              required
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${showValidation && validation.city ? 'text-red-600' : 'text-gray-700'}`}>
              {isEn ? 'City' : 'Stad'} *
            </label>
            <input
              type="text"
              value={answers.returnAddress.city}
              onChange={(e) => setAnswers(prev => ({
                ...prev,
                returnAddress: { ...prev.returnAddress, city: e.target.value }
              }))}
              className={getInputClassName(validation.city)}
              placeholder={isEn ? 'City' : 'Stad'}
              required
            />
          </div>
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isEn ? 'Country' : 'Land'} *
          </label>
          <select
            value={answers.returnAddress.countryCode || 'SE'}
            onChange={(e) => {
              const code = e.target.value;
              const countryObj = ALL_COUNTRIES.find(c => c.code === code);
              setAnswers(prev => ({
                ...prev,
                returnAddress: {
                  ...prev.returnAddress,
                  countryCode: code,
                  country: isEn ? (countryObj?.nameEn || countryObj?.name || code) : (countryObj?.name || code)
                }
              }));
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button bg-white"
          >
            {/* Common Nordic countries first */}
            <option value="SE">{isEn ? 'Sweden' : 'Sverige'}</option>
            <option value="NO">{isEn ? 'Norway' : 'Norge'}</option>
            <option value="DK">{isEn ? 'Denmark' : 'Danmark'}</option>
            <option value="FI">{isEn ? 'Finland' : 'Finland'}</option>
            <option disabled>──────────</option>
            {/* Rest of countries alphabetically */}
            {ALL_COUNTRIES
              .filter(c => !['SE', 'NO', 'DK', 'FI'].includes(c.code))
              .map(country => (
                <option key={country.code} value={country.code}>
                  {isEn ? (country.nameEn || country.name) : country.name}
                </option>
              ))}
          </select>
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${showValidation && validation.email ? 'text-red-600' : 'text-gray-700'}`}>
              {isEn ? 'Email' : 'E-post'} *
            </label>
            <input
              type="email"
              value={answers.returnAddress.email}
              onChange={(e) => setAnswers(prev => ({
                ...prev,
                returnAddress: { ...prev.returnAddress, email: e.target.value }
              }))}
              className={getInputClassName(validation.email)}
              placeholder={isEn ? 'Email address' : 'E-postadress'}
              required
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${showValidation && validation.phone ? 'text-red-600' : 'text-gray-700'}`}>
              {isEn ? 'Phone' : 'Telefon'} *
            </label>
            <input
              type="tel"
              value={answers.returnAddress.phone}
              onChange={(e) => setAnswers(prev => ({
                ...prev,
                returnAddress: { ...prev.returnAddress, phone: e.target.value }
              }))}
              className={getInputClassName(validation.phone)}
              placeholder={isEn ? 'Phone number' : 'Telefonnummer'}
              required
            />
          </div>
        </div>

        {/* Validation Error Summary */}
        {showValidation && !isFormValid && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
            <div className="flex items-start">
              <span className="text-red-500 text-xl mr-3">⚠️</span>
              <div>
                <div className="font-medium text-red-800">
                  {isEn ? 'Please fill in all required fields' : 'Vänligen fyll i alla obligatoriska fält'}
                </div>
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                  {getMissingFields().map((field, index) => (
                    <li key={index}>{field}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </StepContainer>
  );
};

export default Step9bReturnAddress;
