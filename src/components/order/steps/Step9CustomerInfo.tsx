/**
 * Step 9: Customer Information
 * Customer type selection, contact info, and additional notes
 * Split from Step 10 to simplify the order flow
 */

import React, { useRef } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { StepProps } from '../types';
import { CustomerInfoForm } from '../CustomerInfoForm';

interface Step9CustomerInfoProps extends Omit<StepProps, 'currentLocale'> {
  currentLocale?: string;
}

export const Step9CustomerInfo: React.FC<Step9CustomerInfoProps> = ({
  answers,
  setAnswers,
  onNext,
  onBack,
  currentLocale
}) => {
  const { t, i18n } = useTranslation('common');
  const router = useRouter();
  const locale = i18n.language || router.locale || currentLocale || 'sv';
  const addressInputRef = useRef<HTMLInputElement | null>(null);

  const isEn = locale === 'en';

  // Check if customer type is selected and required fields are filled
  const canProceed = () => {
    if (!answers.customerType) return false;
    
    // Always validate billingInfo - that's where CustomerInfoForm saves the data
    // When sameAsReturn is true, billingInfo is synced from returnAddress automatically
    if (answers.customerType === 'company') {
      if (!answers.billingInfo.companyName) return false;
    } else {
      if (!answers.billingInfo.firstName || !answers.billingInfo.lastName) return false;
    }
    if (!answers.billingInfo.street || !answers.billingInfo.postalCode || !answers.billingInfo.city) return false;
    if (!answers.billingInfo.email || !answers.billingInfo.phone) return false;
    
    return true;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {isEn ? 'Your Information' : 'Dina uppgifter'}
        </h1>
        <p className="text-lg text-gray-600">
          {isEn ? 'Please provide your contact and billing information' : 'Vänligen ange dina kontakt- och faktureringsuppgifter'}
        </p>
      </div>

      {/* ===== CUSTOMER TYPE SELECTION ===== */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-xl">👤</span>
          <h3 className="text-lg font-semibold text-gray-900">
            {isEn ? 'Customer Type' : 'Kundtyp'}
          </h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          {isEn ? 'Are you ordering as a private person or company?' : 'Beställer du som privatperson eller företag?'}
        </p>
        
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
              <p className="text-sm text-gray-500">{isEn ? 'Prices shown incl. VAT' : 'Priser visas inkl. moms'}</p>
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
              <p className="text-sm text-gray-500">{isEn ? 'Prices shown excl. VAT' : 'Priser visas exkl. moms'}</p>
            </div>
          </label>
        </div>
      </div>

      {/* ===== REST OF CONTENT - ONLY SHOWN AFTER CUSTOMER TYPE IS SELECTED ===== */}
      {!answers.customerType ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <span className="text-3xl mb-2 block">☝️</span>
          <p className="text-amber-800 font-medium">
            {isEn ? 'Please select customer type above to continue' : 'Vänligen välj kundtyp ovan för att fortsätta'}
          </p>
        </div>
      ) : (
        <>
          {/* Customer Information Form - includes invoice reference and additional notes */}
          <CustomerInfoForm
            answers={answers}
            setAnswers={setAnswers}
            locale={locale}
            addressInputRef={addressInputRef}
            showValidation={false}
          />
        </>
      )}

      {/* Navigation Buttons */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <button
          onClick={onBack}
          className="w-full px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 sm:w-auto"
        >
          {isEn ? 'Back' : 'Tillbaka'}
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed()}
          className={`w-full px-6 py-3 rounded-md font-medium sm:w-auto transition-colors ${
            canProceed()
              ? 'bg-custom-button text-white hover:bg-custom-button-hover'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isEn ? 'Continue' : 'Fortsätt'}
        </button>
      </div>
    </div>
  );
};

export default Step9CustomerInfo;
