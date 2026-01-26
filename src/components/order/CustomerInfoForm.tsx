/**
 * CustomerInfoForm - Shared customer information form component
 * Used in Step 10 for both upload and original document flows
 * 
 * Sections:
 * 1. Customer Type (Private/Company)
 * 2. Return Address (where documents should be sent back)
 * 3. Billing Information (for invoicing)
 */

import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { ALL_COUNTRIES } from '@/components/order/data/countries';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';
import { OrderAnswers } from './types';
import { useSavedCustomerInfo } from '@/hooks/useSavedCustomerInfo';

interface CustomerInfoFormProps {
  answers: OrderAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<OrderAnswers>>;
  locale: string;
  addressInputRef?: React.RefObject<HTMLInputElement>;
  showValidation?: boolean;
  hideReturnAddressOption?: boolean; // Hide "Same as return address" checkbox (e.g., for e-visa)
}

export const CustomerInfoForm: React.FC<CustomerInfoFormProps> = ({
  answers,
  setAnswers,
  locale,
  addressInputRef,
  showValidation = false,
  hideReturnAddressOption = false
}) => {
  const { t } = useTranslation('common');
  const hasPrefilledRef = useRef(false);
  const hasLoadedSavedInfoRef = useRef(false);
  const isEn = locale === 'en';
  const { savedInfo, saveCustomerInfo, clearSavedInfo, hasSavedInfo } = useSavedCustomerInfo();
  const [saveAddressChecked, setSaveAddressChecked] = useState(true);
  const [showSavedInfoBanner, setShowSavedInfoBanner] = useState(false);

  // Check if we have saved info to offer on mount
  useEffect(() => {
    if (hasLoadedSavedInfoRef.current) return;
    if (hasSavedInfo && savedInfo) {
      // Only show banner if billingInfo is empty
      const billingEmpty = !answers.billingInfo.firstName && !answers.billingInfo.email;
      if (billingEmpty) {
        setShowSavedInfoBanner(true);
      }
    }
    hasLoadedSavedInfoRef.current = true;
  }, [hasSavedInfo, savedInfo, answers.billingInfo.firstName, answers.billingInfo.email]);

  // Function to load saved info into form
  const loadSavedInfo = () => {
    if (!savedInfo) return;
    
    setAnswers(prev => ({
      ...prev,
      billingInfo: {
        ...prev.billingInfo,
        firstName: savedInfo.firstName,
        lastName: savedInfo.lastName,
        companyName: savedInfo.companyName || '',
        street: savedInfo.street,
        postalCode: savedInfo.postalCode,
        city: savedInfo.city,
        countryCode: savedInfo.countryCode,
        country: ALL_COUNTRIES.find(c => c.code === savedInfo.countryCode)?.name || savedInfo.countryCode,
        email: savedInfo.email,
        phone: savedInfo.phone
      }
    }));
    setShowSavedInfoBanner(false);
  };

  // Function to save current info to localStorage (called when form is complete)
  const handleSaveInfo = () => {
    if (!saveAddressChecked) return;
    
    const info = answers.billingInfo;
    if (info.firstName && info.email && info.street) {
      saveCustomerInfo({
        firstName: info.firstName,
        lastName: info.lastName,
        companyName: info.companyName,
        street: info.street,
        postalCode: info.postalCode,
        city: info.city,
        countryCode: info.countryCode,
        email: info.email,
        phone: info.phone
      });
    }
  };

  // Expose save function to parent via a custom event
  useEffect(() => {
    const handleSaveEvent = () => handleSaveInfo();
    window.addEventListener('saveCustomerInfo', handleSaveEvent);
    return () => window.removeEventListener('saveCustomerInfo', handleSaveEvent);
  }, [answers.billingInfo, saveAddressChecked]);

  // Pre-fill return address from pickup address if available
  useEffect(() => {
    if (hasPrefilledRef.current) return;
    if (!answers.pickupService) return;
    if (!answers.returnAddress.sameAsPickup) return;
    
    const pa = answers.pickupAddress;
    const hasPickupData = pa.name || pa.street || pa.postalCode || pa.city;
    
    if (hasPickupData) {
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
          countryCode: 'SE'
        },
        // Also update legacy customerInfo for backward compatibility
        customerInfo: {
          ...prev.customerInfo,
          firstName,
          lastName,
          companyName: pa.company || '',
          address: pa.street || '',
          postalCode: pa.postalCode || '',
          city: pa.city || '',
          country: pa.country || 'Sverige',
          countryCode: 'SE'
        }
      }));
      
      hasPrefilledRef.current = true;
    }
  }, [answers.pickupService, answers.pickupAddress, answers.returnAddress.sameAsPickup, setAnswers]);

  // Sync return address to billing when sameAsReturn is true
  useEffect(() => {
    if (answers.billingInfo.sameAsReturn) {
      setAnswers(prev => ({
        ...prev,
        billingInfo: {
          ...prev.billingInfo,
          firstName: prev.returnAddress.firstName,
          lastName: prev.returnAddress.lastName,
          companyName: prev.returnAddress.companyName,
          street: prev.returnAddress.street,
          postalCode: prev.returnAddress.postalCode,
          city: prev.returnAddress.city,
          country: prev.returnAddress.country,
          countryCode: prev.returnAddress.countryCode,
          email: prev.returnAddress.email,
          phone: prev.returnAddress.phone
        }
      }));
    }
  }, [answers.returnAddress, answers.billingInfo.sameAsReturn, setAnswers]);

  // Sync to legacy customerInfo whenever billing info changes
  // All customer info comes from billingInfo (the invoice/contact section)
  // For company customers, use contactPerson as the name
  useEffect(() => {
    setAnswers(prev => {
      // For company customers, split contactPerson into firstName/lastName
      let firstName: string;
      let lastName: string;
      
      if (prev.customerType === 'company' && prev.billingInfo.contactPerson) {
        const nameParts = prev.billingInfo.contactPerson.trim().split(/\s+/);
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      } else {
        firstName = prev.billingInfo.firstName || prev.returnAddress.firstName;
        lastName = prev.billingInfo.lastName || prev.returnAddress.lastName;
      }
      
      return {
        ...prev,
        customerInfo: {
          ...prev.customerInfo,
          firstName: firstName,
          lastName: lastName,
          companyName: prev.billingInfo.companyName || prev.returnAddress.companyName,
          contactPerson: prev.billingInfo.contactPerson,
          email: prev.billingInfo.email || prev.returnAddress.email,
          phone: prev.billingInfo.phone || prev.returnAddress.phone,
          address: prev.billingInfo.street || prev.returnAddress.street,
          postalCode: prev.billingInfo.postalCode || prev.returnAddress.postalCode,
          city: prev.billingInfo.city || prev.returnAddress.city,
          country: prev.billingInfo.country || prev.returnAddress.country,
          countryCode: prev.billingInfo.countryCode || prev.returnAddress.countryCode
        }
      };
    });
  }, [answers.billingInfo, answers.returnAddress, answers.customerType, setAnswers]);

  // Email validation helper
  const isValidEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  // Swedish organization number validation (10 digits, format XXXXXX-XXXX)
  const isValidOrgNumber = (orgNr: string) => {
    const cleaned = orgNr.replace(/\D/g, '');
    return cleaned.length === 10;
  };

  // Helper to get input class with validation styling
  const getInputClass = (value: string | undefined, isSelect = false, isEmail = false) => {
    const baseClass = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500${isSelect ? ' bg-white' : ''}`;
    const isEmpty = !value || value.trim() === '';
    
    if (showValidation && isEmpty) {
      return `${baseClass} border-red-500 bg-red-50`;
    }
    if (showValidation && isEmail && value && !isValidEmail(value)) {
      return `${baseClass} border-red-500 bg-red-50`;
    }
    return `${baseClass} border-gray-300`;
  };

  // Helper to show error message
  const ErrorMessage = ({ show, message }: { show: boolean; message: string }) => {
    if (!show) return null;
    return <p className="text-xs text-red-600 mt-1">{message}</p>;
  };

  // Section header component
  const SectionHeader = ({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) => (
    <div className="flex items-start space-x-3 mb-4">
      <span className="text-2xl">{icon}</span>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div className="mt-8 space-y-8">
      {/* Saved Info Banner */}
      {showSavedInfoBanner && savedInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">💾</span>
              <div>
                <h4 className="font-medium text-blue-900">
                  {isEn ? 'Use saved information?' : 'Använda sparad information?'}
                </h4>
                <p className="text-sm text-blue-700 mt-1">
                  {isEn 
                    ? `We found your saved details: ${savedInfo.firstName} ${savedInfo.lastName}, ${savedInfo.email}`
                    : `Vi hittade dina sparade uppgifter: ${savedInfo.firstName} ${savedInfo.lastName}, ${savedInfo.email}`}
                </p>
                <div className="flex space-x-3 mt-3">
                  <button
                    type="button"
                    onClick={loadSavedInfo}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {isEn ? 'Yes, use saved info' : 'Ja, använd sparade uppgifter'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSavedInfoBanner(false)}
                    className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    {isEn ? 'No, enter new info' : 'Nej, ange nya uppgifter'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== SECTION: Billing Information ===== */}
      {/* Note: Customer Type selection has been moved to the top of Step10 */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <SectionHeader 
          icon="🧾" 
          title={isEn ? 'Contact Information' : 'Kontaktuppgifter'}
          subtitle={isEn ? 'For invoice and contact' : 'För faktura och kontakt'}
        />

        {/* Same as return address checkbox - only show if return address is provided and not hidden (e.g., for e-visa) */}
        {!answers.confirmReturnAddressLater && !hideReturnAddressOption && (
          <label className="flex items-center space-x-2 mb-4 p-3 bg-white border border-green-200 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={answers.billingInfo.sameAsReturn}
              onChange={(e) => {
                const checked = e.target.checked;
                if (checked) {
                  // Copy return address to billing
                  setAnswers(prev => ({
                    ...prev,
                    billingInfo: {
                      ...prev.billingInfo,
                      sameAsReturn: true,
                      firstName: prev.returnAddress.firstName,
                      lastName: prev.returnAddress.lastName,
                      companyName: prev.returnAddress.companyName,
                      street: prev.returnAddress.street,
                      postalCode: prev.returnAddress.postalCode,
                      city: prev.returnAddress.city,
                      country: prev.returnAddress.country,
                      countryCode: prev.returnAddress.countryCode,
                      email: prev.returnAddress.email,
                      phone: prev.returnAddress.phone
                    }
                  }));
                } else {
                  setAnswers(prev => ({
                    ...prev,
                    billingInfo: { ...prev.billingInfo, sameAsReturn: false }
                  }));
                }
              }}
              className="h-5 w-5 text-primary-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">
              {isEn ? 'Same as return address' : 'Samma som returadress'}
            </span>
          </label>
        )}

        {/* Show billing fields only if not same as return, or if confirming return address later */}
        {(answers.confirmReturnAddressLater || !answers.billingInfo.sameAsReturn) && (
          <div className="space-y-4">
            {/* Company-specific fields */}
            {answers.customerType === 'company' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isEn ? 'Company Name' : 'Företagsnamn'} *
                  </label>
                  <input
                    type="text"
                    value={answers.billingInfo.companyName || ''}
                    onChange={(e) => setAnswers(prev => ({
                      ...prev,
                      billingInfo: { ...prev.billingInfo, companyName: e.target.value }
                    }))}
                    className={getInputClass(answers.billingInfo.companyName)}
                    placeholder={isEn ? 'Company name' : 'Företagsnamn'}
                  />
                  <ErrorMessage 
                    show={showValidation && answers.customerType === 'company' && !answers.billingInfo.companyName} 
                    message={isEn ? 'Company name is required' : 'Företagsnamn krävs'} 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isEn ? 'Organization Number' : 'Organisationsnummer'}
                      <span className="text-gray-400 font-normal ml-1">({isEn ? 'optional' : 'valfritt'})</span>
                    </label>
                    <input
                      type="text"
                      value={answers.billingInfo.organizationNumber || ''}
                      onChange={(e) => setAnswers(prev => ({
                        ...prev,
                        billingInfo: { ...prev.billingInfo, organizationNumber: e.target.value }
                      }))}
                      className={getInputClass(answers.billingInfo.organizationNumber)}
                      placeholder="XXXXXX-XXXX"
                    />
                    <ErrorMessage 
                      show={
                        showValidation &&
                        !!answers.billingInfo.organizationNumber &&
                        !isValidOrgNumber(answers.billingInfo.organizationNumber)
                      }
                      message={isEn ? 'Invalid format (10 digits)' : 'Ogiltigt format (10 siffror)'} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isEn ? 'VAT Number' : 'Momsregistreringsnummer'}
                      <span className="text-gray-400 font-normal ml-1">({isEn ? 'optional' : 'valfritt'})</span>
                    </label>
                    <input
                      type="text"
                      value={answers.billingInfo.vatNumber || ''}
                      onChange={(e) => setAnswers(prev => ({
                        ...prev,
                        billingInfo: { ...prev.billingInfo, vatNumber: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="SE123456789001"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isEn ? 'Contact Person' : 'Kontaktperson'}
                    <span className="text-gray-400 font-normal ml-1">({isEn ? 'optional' : 'valfritt'})</span>
                  </label>
                  <input
                    type="text"
                    value={answers.billingInfo.contactPerson || ''}
                    onChange={(e) => setAnswers(prev => ({
                      ...prev,
                      billingInfo: { ...prev.billingInfo, contactPerson: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder={isEn ? 'Contact person name' : 'Kontaktpersonens namn'}
                  />
                </div>
              </>
            )}

            {/* Name fields for private customers */}
            {answers.customerType === 'private' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isEn ? 'First Name' : 'Förnamn'} *
                  </label>
                  <input
                    type="text"
                    value={answers.billingInfo.firstName}
                    onChange={(e) => setAnswers(prev => ({
                      ...prev,
                      billingInfo: { ...prev.billingInfo, firstName: e.target.value }
                    }))}
                    className={getInputClass(answers.billingInfo.firstName)}
                    placeholder={isEn ? 'First name' : 'Förnamn'}
                  />
                  <ErrorMessage 
                    show={showValidation && !answers.billingInfo.firstName} 
                    message={isEn ? 'First name is required' : 'Förnamn krävs'} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isEn ? 'Last Name' : 'Efternamn'} *
                  </label>
                  <input
                    type="text"
                    value={answers.billingInfo.lastName}
                    onChange={(e) => setAnswers(prev => ({
                      ...prev,
                      billingInfo: { ...prev.billingInfo, lastName: e.target.value }
                    }))}
                    className={getInputClass(answers.billingInfo.lastName)}
                    placeholder={isEn ? 'Last name' : 'Efternamn'}
                  />
                  <ErrorMessage 
                    show={showValidation && !answers.billingInfo.lastName} 
                    message={isEn ? 'Last name is required' : 'Efternamn krävs'} 
                  />
                </div>
              </div>
            )}

            {/* Address fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isEn ? 'Street Address' : 'Gatuadress'} *
              </label>
              <AddressAutocomplete
                value={answers.billingInfo.street}
                onChange={(value) =>
                  setAnswers((prev) => ({
                    ...prev,
                    billingInfo: { ...prev.billingInfo, street: value }
                  }))
                }
                onSelect={(data) => {
                  setAnswers((prev) => ({
                    ...prev,
                    billingInfo: {
                      ...prev.billingInfo,
                      street: data.street ?? prev.billingInfo.street,
                      postalCode: data.postalCode ?? prev.billingInfo.postalCode,
                      city: data.city ?? prev.billingInfo.city,
                      countryCode: data.countryCode ?? prev.billingInfo.countryCode
                    }
                  }));
                }}
                placeholder={isEn ? 'Street address' : 'Gatuadress'}
                className={getInputClass(answers.billingInfo.street)}
                countryRestriction={['se', 'no', 'dk', 'fi']}
              />
              <ErrorMessage 
                show={showValidation && !answers.billingInfo.street} 
                message={isEn ? 'Street address is required' : 'Gatuadress krävs'} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isEn ? 'Postal Code' : 'Postnummer'} *
                </label>
                <input
                  type="text"
                  value={answers.billingInfo.postalCode}
                  onChange={(e) => setAnswers(prev => ({
                    ...prev,
                    billingInfo: { ...prev.billingInfo, postalCode: e.target.value }
                  }))}
                  className={getInputClass(answers.billingInfo.postalCode)}
                  placeholder={isEn ? 'Postal code' : 'Postnummer'}
                />
                <ErrorMessage 
                  show={showValidation && !answers.billingInfo.postalCode} 
                  message={isEn ? 'Postal code is required' : 'Postnummer krävs'} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isEn ? 'City' : 'Stad'} *
                </label>
                <input
                  type="text"
                  value={answers.billingInfo.city}
                  onChange={(e) => setAnswers(prev => ({
                    ...prev,
                    billingInfo: { ...prev.billingInfo, city: e.target.value }
                  }))}
                  className={getInputClass(answers.billingInfo.city)}
                  placeholder={isEn ? 'City' : 'Stad'}
                />
                <ErrorMessage 
                  show={showValidation && !answers.billingInfo.city} 
                  message={isEn ? 'City is required' : 'Stad krävs'} 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isEn ? 'Country' : 'Land'} *
              </label>
              <select
                value={answers.billingInfo.countryCode}
                onChange={(e) => {
                  const code = e.target.value;
                  const countryObj = ALL_COUNTRIES.find(c => c.code === code);
                  setAnswers(prev => ({
                    ...prev,
                    billingInfo: {
                      ...prev.billingInfo,
                      countryCode: code,
                      country: isEn ? (countryObj?.nameEn || countryObj?.name || code) : (countryObj?.name || code)
                    }
                  }));
                }}
                className={getInputClass(answers.billingInfo.countryCode, true)}
              >
                <option value="">{isEn ? 'Select country' : 'Välj land'}</option>
                {ALL_COUNTRIES.map(country => (
                  <option key={country.code} value={country.code}>
                    {isEn ? (country.nameEn || country.name) : country.name}
                  </option>
                ))}
              </select>
              <ErrorMessage 
                show={showValidation && !answers.billingInfo.countryCode} 
                message={isEn ? 'Country is required' : 'Land krävs'} 
              />
            </div>

            {/* Contact info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isEn ? 'Email' : 'E-post'} *
                </label>
                <input
                  type="email"
                  value={answers.billingInfo.email}
                  onChange={(e) => setAnswers(prev => ({
                    ...prev,
                    billingInfo: { ...prev.billingInfo, email: e.target.value }
                  }))}
                  className={getInputClass(answers.billingInfo.email, false, true)}
                  placeholder={isEn ? 'Email address' : 'E-postadress'}
                />
                <ErrorMessage 
                  show={showValidation && !answers.billingInfo.email} 
                  message={isEn ? 'Email is required' : 'E-post krävs'} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isEn ? 'Phone' : 'Telefon'} *
                </label>
                <input
                  type="tel"
                  value={answers.billingInfo.phone}
                  onChange={(e) => setAnswers(prev => ({
                    ...prev,
                    billingInfo: { ...prev.billingInfo, phone: e.target.value }
                  }))}
                  className={getInputClass(answers.billingInfo.phone)}
                  placeholder={isEn ? 'Phone number' : 'Telefonnummer'}
                />
                <ErrorMessage 
                  show={showValidation && !answers.billingInfo.phone} 
                  message={isEn ? 'Phone is required' : 'Telefon krävs'} 
                />
              </div>
            </div>
          </div>
        )}

        {/* Invoice Reference - always visible */}
        <div className="mt-4 pt-4 border-t border-green-200">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isEn ? 'Invoice Reference' : 'Fakturareferens'}
            <span className="text-gray-400 font-normal ml-1">({isEn ? 'optional' : 'valfritt'})</span>
          </label>
          <input
            type="text"
            value={answers.invoiceReference}
            onChange={(e) => setAnswers(prev => ({
              ...prev,
              invoiceReference: e.target.value
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder={isEn ? 'Your reference (e.g. PO number)' : 'Er referens (t.ex. beställningsnummer)'}
          />
          <p className="text-xs text-gray-500 mt-1">
            {isEn ? 'Will be shown on the invoice' : 'Visas på fakturan'}
          </p>
        </div>
      </div>

      {/* ===== Additional Notes ===== */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {isEn ? 'Additional Notes' : 'Övriga kommentarer'}
          <span className="text-gray-400 font-normal ml-1">({isEn ? 'optional' : 'valfritt'})</span>
        </label>
        <textarea
          value={answers.additionalNotes}
          onChange={(e) => setAnswers(prev => ({
            ...prev,
            additionalNotes: e.target.value
          }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder={isEn ? 'Any special instructions or comments...' : 'Eventuella särskilda instruktioner eller kommentarer...'}
          rows={3}
        />
      </div>

      {/* Save info checkbox */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={saveAddressChecked}
            onChange={(e) => setSaveAddressChecked(e.target.checked)}
            className="h-5 w-5 text-primary-600 rounded mt-0.5"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">
              {isEn ? 'Save my information for future orders' : 'Spara mina uppgifter för framtida beställningar'}
            </span>
            <p className="text-xs text-gray-500 mt-1">
              {isEn 
                ? 'Your contact details will be saved locally in your browser for convenience on your next order.'
                : 'Dina kontaktuppgifter sparas lokalt i din webbläsare för att underlätta vid nästa beställning.'}
            </p>
          </div>
        </label>
      </div>
    </div>
  );
};

export default CustomerInfoForm;
