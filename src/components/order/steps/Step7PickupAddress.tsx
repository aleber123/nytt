/**
 * Step 7: Pickup Address
 * Collects pickup address if customer selected pickup service in Step 6
 * Only shown if pickupService is true
 */

import React from 'react';
import { useTranslation } from 'next-i18next';
import { StepContainer } from '../shared/StepContainer';
import { StepProps } from '../types';

export const Step7PickupAddress: React.FC<StepProps> = ({
  answers,
  setAnswers,
  onNext,
  onBack
}) => {
  const { t } = useTranslation('common');

  const handleAddressChange = (field: string, value: string) => {
    setAnswers({
      ...answers,
      pickupAddress: {
        ...answers.pickupAddress,
        [field]: value
      }
    });
  };

  const isFormValid = () => {
    const { name, street, postalCode, city } = answers.pickupAddress;
    return name.trim() && street.trim() && postalCode.trim() && city.trim();
  };

  return (
    <StepContainer
      title={t('orderFlow.step7.title', 'Hämtningsadress')}
      subtitle={t('orderFlow.step7.subtitle', 'Var ska vi hämta dina dokument?')}
      onNext={onNext}
      onBack={onBack}
      nextDisabled={!isFormValid()}
    >
      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <span className="text-2xl mr-3">📍</span>
          <div>
            <div className="font-medium text-blue-900">
              {t('orderFlow.step7.pickupInfo', 'Hämtning inom 1-2 arbetsdagar')}
            </div>
            <div className="text-sm text-blue-700">
              {t('orderFlow.step7.pickupDescription', 'Vi kontaktar dig för att boka en lämplig tid')}
            </div>
          </div>
        </div>
      </div>

      {/* Address Form */}
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('orderFlow.step7.name', 'Namn')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={answers.pickupAddress.name}
            onChange={(e) => handleAddressChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button"
            placeholder={t('orderFlow.step7.namePlaceholder', 'Ditt namn')}
            required
          />
        </div>

        {/* Company (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('orderFlow.step7.company', 'Företag')} <span className="text-gray-400 text-xs">(valfritt)</span>
          </label>
          <input
            type="text"
            value={answers.pickupAddress.company}
            onChange={(e) => handleAddressChange('company', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button"
            placeholder={t('orderFlow.step7.companyPlaceholder', 'Företagsnamn')}
          />
        </div>

        {/* Street Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('orderFlow.step7.street', 'Gatuadress')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={answers.pickupAddress.street}
            onChange={(e) => handleAddressChange('street', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button"
            placeholder={t('orderFlow.step7.streetPlaceholder', 'Gatuadress')}
            required
          />
        </div>

        {/* Postal Code & City */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('orderFlow.step7.postalCode', 'Postnummer')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={answers.pickupAddress.postalCode}
              onChange={(e) => handleAddressChange('postalCode', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button"
              placeholder={t('orderFlow.step7.postalCodePlaceholder', '123 45')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('orderFlow.step7.city', 'Stad')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={answers.pickupAddress.city}
              onChange={(e) => handleAddressChange('city', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button"
              placeholder={t('orderFlow.step7.cityPlaceholder', 'Stockholm')}
              required
            />
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start">
          <span className="text-2xl mr-3">💡</span>
          <div>
            <h4 className="font-medium text-amber-900 mb-1">
              {t('orderFlow.step7.helpTitle', 'Tips')}
            </h4>
            <p className="text-sm text-amber-800">
              {t('orderFlow.step7.helpText', 'Se till att någon är tillgänglig på hämtningsadressen under kontorstid (09:00-17:00).')}
            </p>
          </div>
        </div>
      </div>
    </StepContainer>
  );
};

export default Step7PickupAddress;
