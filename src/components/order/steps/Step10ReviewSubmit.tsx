/**
 * Step 10: Review & Submit
 * Final review of order and submission
 * 
 * NOTE: This is a simplified version. The full implementation in bestall.tsx
 * includes customer info form, file upload, and complex submission logic.
 * Consider keeping Step 10 inline in bestall.tsx for now due to its complexity.
 */

import React from 'react';
import { useTranslation } from 'next-i18next';
import { StepProps } from '../types';

interface Step10Props extends StepProps {
  pricingBreakdown: any[];
  loadingPricing: boolean;
  returnServices: any[];
  allCountries: any[];
  getCountryName: (code: string) => string;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const Step10ReviewSubmit: React.FC<Step10Props> = ({
  answers,
  onBack,
  pricingBreakdown,
  loadingPricing,
  returnServices,
  allCountries,
  getCountryName,
  onSubmit,
  isSubmitting
}) => {
  const { t } = useTranslation('common');

  const getDocumentTypeName = () => {
    const typeMap: { [key: string]: string } = {
      birthCertificate: t('orderFlow.step2.birthCertificate', 'Födelsebevis'),
      marriageCertificate: t('orderFlow.step2.marriageCertificate', 'Vigselbevis'),
      diploma: t('orderFlow.step2.diploma', 'Examensbevis'),
      commercial: t('orderFlow.step2.commercial', 'Handelsdokument'),
      powerOfAttorney: t('orderFlow.step2.powerOfAttorney', 'Fullmakt'),
      other: t('orderFlow.step2.other', 'Annat dokument')
    };
    return typeMap[answers.documentType] || answers.documentType;
  };

  const calculateTotal = () => {
    let total = pricingBreakdown.reduce((sum, item) => sum + (item.total || 0), 0);

    // Add additional fees
    if (answers.expedited) total += 500;
    if (answers.pickupService) total += 450;
    if (answers.scannedCopies) total += 200 * answers.quantity;

    // Add return service cost
    if (answers.returnService) {
      const returnService = returnServices.find(s => s.id === answers.returnService);
      if (returnService && returnService.price) {
        const priceMatch = returnService.price.match(/(\d+)/);
        if (priceMatch) {
          total += parseInt(priceMatch[1]);
        }
      }
    }

    // Add premium delivery cost
    if (answers.premiumDelivery) {
      const premiumService = returnServices.find(s => s.id === answers.premiumDelivery);
      if (premiumService && premiumService.price) {
        const priceMatch = premiumService.price.match(/(\d+)/);
        if (priceMatch) {
          total += parseInt(priceMatch[1]);
        }
      }
    }

    return total;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {t('orderFlow.step10.title', 'Slutför din beställning')}
        </h1>
        <p className="text-lg text-gray-600">
          {t('orderFlow.step10.subtitle', 'Granska din beställning och slutför genom att fylla i dina uppgifter nedan')}
        </p>
      </div>

      {/* Order Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4">
          {t('orderFlow.step10.summaryTitle', 'Slutgiltig beställningssammanfattning')}
        </h3>

        <div className="space-y-3">
          {/* Country */}
          <div className="flex justify-between items-center py-2 border-b border-green-200">
            <span className="text-gray-700">{t('orderFlow.step10.country', 'Land')}:</span>
            <span className="font-medium text-gray-900">
              {getCountryName(answers.country)} {allCountries.find(c => c.code === answers.country)?.flag}
            </span>
          </div>

          {/* Document Type */}
          <div className="flex justify-between items-center py-2 border-b border-green-200">
            <span className="text-gray-700">{t('orderFlow.step10.documentType', 'Dokumenttyp')}:</span>
            <span className="font-medium text-gray-900">{getDocumentTypeName()}</span>
          </div>

          {/* Quantity */}
          <div className="flex justify-between items-center py-2 border-b border-green-200">
            <span className="text-gray-700">{t('orderFlow.step10.quantity', 'Antal dokument')}:</span>
            <span className="font-medium text-gray-900">{answers.quantity} st</span>
          </div>

          {/* Services Pricing Breakdown */}
          <div className="py-2">
            <span className="text-gray-700 font-medium">{t('orderFlow.step10.services', 'Valda tjänster')}:</span>
            <div className="mt-2 space-y-2">
              {loadingPricing ? (
                <div className="text-sm text-gray-500">Beräknar priser...</div>
              ) : (
                pricingBreakdown.map((item, index) => (
                  <div key={`${item.service}_${index}`} className="text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        • {item.description} {item.quantity && item.quantity > 1 && item.unitPrice ? `(${item.unitPrice} kr × ${item.quantity})` : ''}
                      </span>
                      <span className="font-medium text-gray-900">{item.total || 0} kr</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Additional Services */}
          {answers.scannedCopies && (
            <div className="flex justify-between items-center py-2 border-b border-green-200">
              <span className="text-gray-700">Skannade kopior ({answers.quantity} st):</span>
              <span className="font-medium text-gray-900">{200 * answers.quantity} kr</span>
            </div>
          )}

          {answers.pickupService && (
            <div className="flex justify-between items-center py-2 border-b border-green-200">
              <span className="text-gray-700">Hämtning:</span>
              <span className="font-medium text-gray-900">450 kr</span>
            </div>
          )}

          {answers.returnService && (
            <div className="flex justify-between items-center py-2 border-b border-green-200">
              <span className="text-gray-700">Returfrakt:</span>
              <span className="font-medium text-gray-900">
                {(() => {
                  const returnService = returnServices.find(s => s.id === answers.returnService);
                  if (returnService && returnService.price) {
                    const priceMatch = returnService.price.match(/(\d+)/);
                    return priceMatch ? `${priceMatch[1]} kr` : returnService.price;
                  }
                  return '0 kr';
                })()}
              </span>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between items-center py-3 border-t-2 border-green-300 bg-green-100 -mx-6 px-6 rounded-b-lg">
            <span className="text-lg font-semibold text-green-900">
              {t('orderFlow.step10.total', 'Totalbelopp')}:
            </span>
            <span className="text-xl font-bold text-green-900">
              {loadingPricing ? 'Beräknar...' : `${calculateTotal().toLocaleString()} kr`}
            </span>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-900">
          <strong>⚠️ OBS:</strong> Detta är en förenklad version av Step 10. 
          Den fullständiga implementationen i bestall.tsx inkluderar:
          <ul className="list-disc ml-5 mt-2">
            <li>Kunduppgiftsformulär</li>
            <li>Filuppladdning (för upload-flödet)</li>
            <li>Villkorsacceptans</li>
            <li>reCAPTCHA</li>
            <li>Komplex submission-logik</li>
          </ul>
          <strong className="block mt-2">Rekommendation:</strong> Behåll Step 10 inline i bestall.tsx tills vidare.
        </p>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          disabled={isSubmitting}
        >
          {t('orderFlow.backToPrevious', 'Tillbaka')}
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className={`px-6 py-3 rounded-md font-medium ${
            isSubmitting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-custom-button text-white hover:bg-custom-button-hover'
          }`}
        >
          {isSubmitting ? 'Skickar...' : t('orderFlow.submitOrder', 'Skicka beställning')}
        </button>
      </div>
    </div>
  );
};

export default Step10ReviewSubmit;
