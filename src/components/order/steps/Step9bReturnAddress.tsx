/**
 * Step 9b: Return Address
 * Collects the return address for DHL/Stockholm City deliveries
 * Similar to Step 7 pickup address form
 */

import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { StepContainer } from '../shared/StepContainer';
import { StepProps } from '../types';
import { ALL_COUNTRIES } from '@/components/order/data/countries';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';

interface SavedAddressOption {
  id: string;
  label: string;
  type: string;
  contactName: string;
  companyName: string;
  street: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  country: string;
  countryCode: string;
  phone: string;
  email: string;
  isDefault: boolean;
}

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

  // Customer number lookup state for saved addresses
  const [custNumInput, setCustNumInput] = useState(answers.customerNumber || '');
  const [custLookupLoading, setCustLookupLoading] = useState(false);
  const [custLookupStatus, setCustLookupStatus] = useState<'found' | 'not-found' | null>(null);
  const [custName, setCustName] = useState('');
  const [custAddresses, setCustAddresses] = useState<SavedAddressOption[]>([]);
  const custTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAutoLooked = useRef(false);

  const lookupCustomer = useCallback(async (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) { setCustLookupStatus(null); setCustAddresses([]); return; }
    setCustLookupLoading(true);
    try {
      const res = await fetch('/api/customer-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerNumber: trimmed }),
      });
      const data = await res.json();
      if (data.found && data.customer) {
        const addrs = data.customer.savedAddresses || [];
        setCustLookupStatus(addrs.length > 0 ? 'found' : null);
        setCustName(data.customer.companyName || data.customer.contactName || '');
        setCustAddresses(addrs);
        setAnswers(prev => ({ ...prev, customerNumber: data.customerNumber }));
      } else {
        setCustLookupStatus('not-found');
        setCustName('');
        setCustAddresses([]);
      }
    } catch {
      setCustLookupStatus('not-found');
      setCustAddresses([]);
    } finally {
      setCustLookupLoading(false);
    }
  }, [setAnswers]);

  // Auto-lookup if customerNumber already set (from a previous step)
  React.useEffect(() => {
    if (answers.customerNumber && !hasAutoLooked.current) {
      hasAutoLooked.current = true;
      lookupCustomer(answers.customerNumber);
    }
  }, [answers.customerNumber, lookupCustomer]);

  const handleCustNumChange = (value: string) => {
    setCustNumInput(value);
    setCustLookupStatus(null);
    setCustAddresses([]);
    if (!value.trim()) {
      setAnswers(prev => ({ ...prev, customerNumber: '' }));
      return;
    }
    if (custTimerRef.current) clearTimeout(custTimerRef.current);
    custTimerRef.current = setTimeout(() => lookupCustomer(value), 600);
  };

  const applyAddress = (addr: SavedAddressOption) => {
    const countryMatch = ALL_COUNTRIES.find(
      c => c.code.toLowerCase() === (addr.countryCode || '').toLowerCase()
        || c.name.toLowerCase() === (addr.country || '').toLowerCase()
        || (c.nameEn && c.nameEn.toLowerCase() === (addr.country || '').toLowerCase())
    );
    setAnswers(prev => ({
      ...prev,
      confirmReturnAddressLater: false,
      deliveryAddressType: addr.companyName ? 'business' : prev.deliveryAddressType,
      returnAddress: {
        ...prev.returnAddress,
        sameAsPickup: false,
        firstName: addr.contactName?.split(' ')[0] || prev.returnAddress.firstName,
        lastName: addr.contactName?.split(' ').slice(1).join(' ') || prev.returnAddress.lastName,
        companyName: addr.companyName || prev.returnAddress.companyName,
        street: addr.street,
        addressLine2: addr.addressLine2 || '',
        postalCode: addr.postalCode,
        city: addr.city,
        country: countryMatch?.name || addr.country || prev.returnAddress.country,
        countryCode: countryMatch?.code || addr.countryCode || prev.returnAddress.countryCode,
        phone: addr.phone || prev.returnAddress.phone,
        email: addr.email || prev.returnAddress.email,
      },
    }));
  };

  // Check if this step should be shown
  const requiresReturnAddress = !!answers.returnService && 
    ['dhl-sweden', 'dhl-europe', 'dhl-worldwide', 'stockholm-city', 'postnord-rek'].includes(answers.returnService);

  // Skip if return address is not required
  const skipTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    if (!requiresReturnAddress) {
      // Defer to avoid React StrictMode double-fire incrementing step twice
      if (skipTimer.current) clearTimeout(skipTimer.current);
      skipTimer.current = setTimeout(() => onSkip(), 0);
    }
    return () => {
      if (skipTimer.current) clearTimeout(skipTimer.current);
    };
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
    // Allow proceeding if "confirm later" is checked, even if form is incomplete
    if (answers.confirmReturnAddressLater) {
      onNext();
      return;
    }
    
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <span className="text-2xl mr-3 hidden sm:inline">📦</span>
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

      {/* Customer number lookup for saved addresses */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
        <div className="flex items-start space-x-3 mb-3">
          <span className="text-xl">🔍</span>
          <div>
            <h4 className="font-medium text-indigo-900">
              {isEn ? 'Have a customer number?' : 'Har du ett kundnummer?'}
            </h4>
            <p className="text-sm text-indigo-700">
              {isEn ? 'Enter it to use your saved addresses' : 'Ange det för att använda dina sparade adresser'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={custNumInput}
            onChange={(e) => handleCustNumChange(e.target.value.toUpperCase())}
            className="flex-1 px-3 py-2 border border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            placeholder={isEn ? 'Customer number' : 'Kundnummer'}
          />
          {custLookupLoading && (
            <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
        </div>
        {custLookupStatus === 'found' && (
          <p className="mt-2 text-sm text-green-700 font-medium">
            ✓ {custName}
          </p>
        )}
        {custLookupStatus === 'not-found' && (
          <p className="mt-2 text-sm text-amber-700">
            {isEn ? 'No customer found.' : 'Inget kundnummer hittades.'}
          </p>
        )}

        {/* Saved address cards */}
        {custAddresses.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-medium text-indigo-800 mb-2">
              {isEn ? 'Choose a saved address:' : 'Välj en sparad adress:'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {custAddresses.map((addr) => {
                const typeLabel = addr.type === 'return'
                  ? (isEn ? 'Return' : 'Retur')
                  : addr.type === 'pickup'
                    ? (isEn ? 'Pickup' : 'Upphämtning')
                    : addr.type === 'delivery'
                      ? (isEn ? 'Delivery' : 'Leverans')
                      : (isEn ? 'Other' : 'Övrigt');
                return (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => applyAddress(addr)}
                    className="text-left p-3 border border-indigo-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-400 transition-colors bg-white"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">{typeLabel}</span>
                      {addr.isDefault && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">
                          {isEn ? 'Default' : 'Standard'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900">{addr.label}</p>
                    <p className="text-xs text-gray-600">{addr.street}, {addr.postalCode} {addr.city}</p>
                    {addr.contactName && <p className="text-xs text-gray-500">{addr.contactName}</p>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Address type selector with 3 options */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {isEn ? 'Address Type' : 'Adresstyp'} *
        </label>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <label 
            className={`flex items-center p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${
              answers.deliveryAddressType === 'business' && !answers.confirmReturnAddressLater
                ? 'border-custom-button bg-custom-button/5' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="addressType"
              value="business"
              checked={answers.deliveryAddressType === 'business' && !answers.confirmReturnAddressLater}
              onChange={() => setAnswers(prev => ({ ...prev, deliveryAddressType: 'business', confirmReturnAddressLater: false }))}
              className="sr-only"
            />
            <div className="flex items-center">
              <span className="text-2xl mr-2 sm:mr-3 hidden sm:inline">🏢</span>
              <div>
                <div className="font-medium text-gray-900 text-sm sm:text-base">
                  {isEn ? 'Business' : 'Företag'}
                </div>
                <div className="text-xs text-gray-500 hidden sm:block">
                  {isEn ? 'Office, company' : 'Kontor, företag'}
                </div>
              </div>
            </div>
          </label>
          <label 
            className={`flex items-center p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${
              answers.deliveryAddressType === 'residential' && !answers.confirmReturnAddressLater
                ? 'border-custom-button bg-custom-button/5' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="addressType"
              value="residential"
              checked={answers.deliveryAddressType === 'residential' && !answers.confirmReturnAddressLater}
              onChange={() => setAnswers(prev => ({ ...prev, deliveryAddressType: 'residential', confirmReturnAddressLater: false }))}
              className="sr-only"
            />
            <div className="flex items-center">
              <span className="text-2xl mr-2 sm:mr-3 hidden sm:inline">🏠</span>
              <div>
                <div className="font-medium text-gray-900 text-sm sm:text-base">
                  {isEn ? 'Home' : 'Hem'}
                </div>
                <div className="text-xs text-gray-500 hidden sm:block">
                  {isEn ? 'Private residence' : 'Privatbostad'}
                </div>
              </div>
            </div>
          </label>
          <label 
            className={`flex items-center p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${
              answers.confirmReturnAddressLater
                ? 'border-amber-500 bg-amber-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="addressType"
              value="later"
              checked={answers.confirmReturnAddressLater || false}
              onChange={() => setAnswers(prev => ({ ...prev, confirmReturnAddressLater: true }))}
              className="sr-only"
            />
            <div className="flex items-center">
              <span className="text-2xl mr-2 sm:mr-3 hidden sm:inline">📩</span>
              <div>
                <div className="font-medium text-gray-900 text-sm sm:text-base">
                  {isEn ? 'Confirm later' : 'Bekräftar senare'}
                </div>
                <div className="text-xs text-gray-500 hidden sm:block">
                  {isEn ? 'Via email' : 'Via email'}
                </div>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Only show address form if NOT confirming later */}
      {!answers.confirmReturnAddressLater && (
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

        {/* Company name - show only if business address is selected */}
        {answers.deliveryAddressType === 'business' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isEn ? 'Company Name' : 'Företagsnamn'} *
            </label>
            <input
              type="text"
              value={answers.returnAddress.companyName || ''}
              onChange={(e) => setAnswers(prev => ({
                ...prev,
                returnAddress: { ...prev.returnAddress, companyName: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button"
              placeholder={isEn ? 'Company name' : 'Företagsnamn'}
            />
          </div>
        )}

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
          <AddressAutocomplete
            value={answers.returnAddress.street}
            onChange={(value) =>
              setAnswers((prev) => ({
                ...prev,
                returnAddress: { ...prev.returnAddress, street: value }
              }))
            }
            onSelect={(data) => {
              setAnswers((prev) => ({
                ...prev,
                returnAddress: {
                  ...prev.returnAddress,
                  street: data.street ?? prev.returnAddress.street,
                  postalCode: data.postalCode ?? prev.returnAddress.postalCode,
                  city: data.city ?? prev.returnAddress.city,
                  countryCode: data.countryCode ?? prev.returnAddress.countryCode
                }
              }));
            }}
            placeholder={isEn ? 'Street address' : 'Gatuadress'}
            className={getInputClassName(validation.street)}
            required
            countryRestriction={['se', 'no', 'dk', 'fi']}
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
        {showValidation && !isFormValid && !answers.confirmReturnAddressLater && (
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
      )}
    </StepContainer>
  );
};

export default Step9bReturnAddress;
