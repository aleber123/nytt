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

interface CustomerInfoFormProps {
  answers: OrderAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<OrderAnswers>>;
  locale: string;
  addressInputRef?: React.RefObject<HTMLInputElement>;
  showValidation?: boolean;
}

export const CustomerInfoForm: React.FC<CustomerInfoFormProps> = ({
  answers,
  setAnswers,
  locale,
  addressInputRef,
  showValidation = false
}) => {
  const { t } = useTranslation('common');
  const hasPrefilledRef = useRef(false);
  const isEn = locale === 'en';

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

  // Sync to legacy customerInfo whenever return address changes
  useEffect(() => {
    setAnswers(prev => ({
      ...prev,
      customerInfo: {
        ...prev.customerInfo,
        firstName: prev.returnAddress.firstName,
        lastName: prev.returnAddress.lastName,
        companyName: prev.returnAddress.companyName,
        email: prev.returnAddress.email,
        phone: prev.returnAddress.phone,
        address: prev.returnAddress.street,
        postalCode: prev.returnAddress.postalCode,
        city: prev.returnAddress.city,
        country: prev.returnAddress.country,
        countryCode: prev.returnAddress.countryCode
      }
    }));
  }, [answers.returnAddress, setAnswers]);

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
      {/* ===== SECTION 1: Customer Type ===== */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <SectionHeader 
          icon="👤" 
          title={isEn ? 'Customer Type' : 'Kundtyp'}
          subtitle={isEn ? 'Are you ordering as a private person or company?' : 'Beställer du som privatperson eller företag?'}
        />
        
        <div className="flex flex-wrap gap-4">
          <label className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
            answers.customerType === 'private' 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}>
            <input
              type="radio"
              name="customerType"
              value="private"
              checked={answers.customerType === 'private'}
              onChange={() => setAnswers(prev => ({ ...prev, customerType: 'private' }))}
              className="h-5 w-5 text-primary-600"
            />
            <div>
              <span className="font-medium text-gray-900">{isEn ? 'Private Person' : 'Privatperson'}</span>
              <p className="text-sm text-gray-500">{isEn ? 'Individual customer' : 'Enskild kund'}</p>
            </div>
          </label>
          
          <label className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
            answers.customerType === 'company' 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}>
            <input
              type="radio"
              name="customerType"
              value="company"
              checked={answers.customerType === 'company'}
              onChange={() => setAnswers(prev => ({ ...prev, customerType: 'company' }))}
              className="h-5 w-5 text-primary-600"
            />
            <div>
              <span className="font-medium text-gray-900">{isEn ? 'Company' : 'Företag'}</span>
              <p className="text-sm text-gray-500">{isEn ? 'Business customer' : 'Företagskund'}</p>
            </div>
          </label>
        </div>
      </div>

      {/* ===== SECTION 2: Billing Information ===== */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <SectionHeader 
          icon="🧾" 
          title={isEn ? 'Contact Information' : 'Kontaktuppgifter'}
          subtitle={isEn ? 'Contact details' : 'Kontaktuppgifter'}
        />

        {/* Same as return address checkbox */}
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

        {/* Show billing fields only if not same as return */}
        {!answers.billingInfo.sameAsReturn && (
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
    </div>
  );
};

export default CustomerInfoForm;
