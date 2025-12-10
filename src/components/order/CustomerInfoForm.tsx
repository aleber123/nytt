/**
 * CustomerInfoForm - Shared customer information form component
 * Used in Step 10 for both upload and original document flows
 */

import React from 'react';
import { useTranslation } from 'next-i18next';
import { ALL_COUNTRIES } from './data/countries';
import { OrderAnswers } from './types';

interface CustomerInfoFormProps {
  answers: OrderAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<OrderAnswers>>;
  locale: string;
  addressInputRef?: React.RefObject<HTMLInputElement>;
  showValidation?: boolean; // When true, show red borders on empty required fields
}

export const CustomerInfoForm: React.FC<CustomerInfoFormProps> = ({
  answers,
  setAnswers,
  locale,
  addressInputRef,
  showValidation = false
}) => {
  const { t } = useTranslation('common');

  // Email validation helper
  const isValidEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  // Helper to get input class with validation styling
  const getInputClass = (value: string | undefined, isSelect = false, isEmail = false) => {
    const baseClass = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500${isSelect ? ' bg-white' : ''}`;
    const isEmpty = !value || value.trim() === '';
    
    if (showValidation && isEmpty) {
      return `${baseClass} border-red-500 bg-red-50`;
    }
    // Check for invalid email format
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

  return (
    <div className="mt-8 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {locale === 'en' ? 'Contact details' : 'Kontaktuppgifter'}
      </h3>
      
      {/* First Name / Last Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('orderFlow.step10.firstName')} {t('orderFlow.step10.requiredField')}
          </label>
          <input
            type="text"
            id="customer-firstName"
            value={answers.customerInfo.firstName}
            onChange={(e) => setAnswers(prev => ({
              ...prev,
              customerInfo: { ...prev.customerInfo, firstName: e.target.value }
            }))}
            className={getInputClass(answers.customerInfo.firstName)}
            placeholder={t('orderFlow.step10.firstNamePlaceholder')}
          />
          <ErrorMessage 
            show={showValidation && !answers.customerInfo.firstName} 
            message={locale === 'en' ? 'First name is required' : 'Förnamn krävs'} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('orderFlow.step10.lastName')} {t('orderFlow.step10.requiredField')}
          </label>
          <input
            type="text"
            id="customer-lastName"
            value={answers.customerInfo.lastName}
            onChange={(e) => setAnswers(prev => ({
              ...prev,
              customerInfo: { ...prev.customerInfo, lastName: e.target.value }
            }))}
            className={getInputClass(answers.customerInfo.lastName)}
            placeholder={t('orderFlow.step10.lastNamePlaceholder')}
          />
          <ErrorMessage 
            show={showValidation && !answers.customerInfo.lastName} 
            message={locale === 'en' ? 'Last name is required' : 'Efternamn krävs'} 
          />
        </div>
      </div>

      {/* Country */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('order.form.country', 'Land')} {t('orderFlow.step10.requiredField')}
        </label>
        <select
          id="customer-country"
          value={answers.customerInfo.countryCode || ''}
          onChange={(e) => {
            const code = e.target.value;
            const countryObj = ALL_COUNTRIES.find(c => c.code === code);
            setAnswers(prev => ({
              ...prev,
              customerInfo: {
                ...prev.customerInfo,
                countryCode: code,
                country: locale === 'en' ? (countryObj?.nameEn || countryObj?.name || code) : (countryObj?.name || code)
              }
            }));
          }}
          className={getInputClass(answers.customerInfo.countryCode, true)}
        >
          <option value="">
            {locale === 'en' ? 'Select country' : 'Välj land'}
          </option>
          {ALL_COUNTRIES.map(country => (
            <option key={country.code} value={country.code}>
              {locale === 'en' ? (country.nameEn || country.name) : country.name}
            </option>
          ))}
        </select>
        <ErrorMessage 
          show={showValidation && !answers.customerInfo.countryCode} 
          message={locale === 'en' ? 'Country is required' : 'Land krävs'} 
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('orderFlow.step10.email')} {t('orderFlow.step10.requiredField')}
        </label>
        <input
          type="email"
          id="customer-email"
          value={answers.customerInfo.email}
          onChange={(e) => setAnswers(prev => ({
            ...prev,
            customerInfo: { ...prev.customerInfo, email: e.target.value }
          }))}
          className={getInputClass(answers.customerInfo.email, false, true)}
          placeholder={t('orderFlow.step10.emailPlaceholder')}
        />
        <ErrorMessage 
          show={showValidation && !answers.customerInfo.email} 
          message={locale === 'en' ? 'Email is required' : 'E-post krävs'} 
        />
        <ErrorMessage 
          show={showValidation && !!answers.customerInfo.email && !isValidEmail(answers.customerInfo.email)} 
          message={locale === 'en' ? 'Please enter a valid email address' : 'Ange en giltig e-postadress'} 
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('orderFlow.step10.phone')} {t('orderFlow.step10.requiredField')}
        </label>
        <input
          type="tel"
          id="customer-phone"
          value={answers.customerInfo.phone}
          onChange={(e) => setAnswers(prev => ({
            ...prev,
            customerInfo: { ...prev.customerInfo, phone: e.target.value }
          }))}
          className={getInputClass(answers.customerInfo.phone)}
          placeholder={t('orderFlow.step10.phonePlaceholder')}
        />
        <ErrorMessage 
          show={showValidation && !answers.customerInfo.phone} 
          message={locale === 'en' ? 'Phone is required' : 'Telefon krävs'} 
        />
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('order.form.address')} {t('orderFlow.step10.requiredField')}
        </label>
        <input
          type="text"
          id="customer-address"
          ref={addressInputRef}
          value={answers.customerInfo.address || ''}
          onChange={(e) => setAnswers(prev => ({
            ...prev,
            customerInfo: { ...prev.customerInfo, address: e.target.value }
          }))}
          className={getInputClass(answers.customerInfo.address)}
          placeholder={t('order.form.address')}
        />
        <ErrorMessage 
          show={showValidation && !answers.customerInfo.address} 
          message={locale === 'en' ? 'Address is required' : 'Adress krävs'} 
        />
      </div>

      {/* Postal Code / City */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('order.form.postalCode')} {t('orderFlow.step10.requiredField')}
          </label>
          <input
            type="text"
            id="customer-postalCode"
            value={answers.customerInfo.postalCode || ''}
            onChange={(e) => setAnswers(prev => ({
              ...prev,
              customerInfo: { ...prev.customerInfo, postalCode: e.target.value }
            }))}
            className={getInputClass(answers.customerInfo.postalCode)}
            placeholder={t('order.form.postalCode')}
          />
          <ErrorMessage 
            show={showValidation && !answers.customerInfo.postalCode} 
            message={locale === 'en' ? 'Postal code is required' : 'Postnummer krävs'} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('order.form.city')} {t('orderFlow.step10.requiredField')}
          </label>
          <input
            type="text"
            id="customer-city"
            value={answers.customerInfo.city || ''}
            onChange={(e) => setAnswers(prev => ({
              ...prev,
              customerInfo: { ...prev.customerInfo, city: e.target.value }
            }))}
            className={getInputClass(answers.customerInfo.city)}
            placeholder={t('order.form.city')}
          />
          <ErrorMessage 
            show={showValidation && !answers.customerInfo.city} 
            message={locale === 'en' ? 'City is required' : 'Stad krävs'} 
          />
        </div>
      </div>

      {/* Invoice Reference */}
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

      {/* Additional Notes */}
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
  );
};

export default CustomerInfoForm;
