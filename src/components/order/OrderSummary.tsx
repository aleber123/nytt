/**
 * Order Summary Component
 * Displays a sticky sidebar with selected services and total price
 */

import React from 'react';
import { useTranslation } from 'next-i18next';

interface OrderSummaryProps {
  answers: any;
  pricingBreakdown: any[];
  totalPrice: number;
  allCountries: any[];
  returnServices?: any[];
  pickupServices?: any[];
  hasUnconfirmedPrices?: boolean;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  answers,
  pricingBreakdown,
  totalPrice,
  allCountries,
  returnServices = [],
  pickupServices = [],
  hasUnconfirmedPrices = false
}) => {
  const { t, i18n } = useTranslation('common');
  const currentLocale = i18n.language;

  // Get country name with translation support
  const getCountryName = (code: string) => {
    // Try to use translation first
    const translationKey = `countries.names.${code}`;
    const translated = t(translationKey);
    
    // If translation exists and is different from key, use it
    if (translated && translated !== translationKey) {
      return translated;
    }
    
    // Fallback to allCountries array
    const country = allCountries.find(c => c.code === code);
    return country ? country.name : code;
  };

  // Get service names using translations
  const getServiceName = (serviceType: string) => {
    const translationKeys: { [key: string]: string } = {
      apostille: 'services.apostille.title',
      notarization: 'services.notarization.title',
      embassy: 'services.embassy.title',
      ud: 'services.ud.title',
      translation: 'services.translation.title',
      chamber: 'services.chamber.title'
    };
    const key = translationKeys[serviceType];
    return key ? t(key) : serviceType;
  };

  // Get document type name with translation support
  const getDocumentTypeName = (type: string) => {
    // Try to use translation first, fallback to Swedish
    const translationKey = `orderFlow.step2.${type}`;
    const translated = t(translationKey);
    
    // If translation exists and is different from key, use it
    if (translated && translated !== translationKey) {
      return translated;
    }
    
    // Fallback to Swedish
    const names: { [key: string]: string } = {
      birthCertificate: 'Födelsebevis',
      marriageCertificate: 'Vigselbevis',
      certificateOfOrigin: 'Ursprungscertifikat (COO)',
      deathCertificate: 'Dödsbevis',
      diploma: 'Examensbevis',
      passport: 'Pass',
      transcript: 'Studieutdrag',
      criminalRecord: 'Utdrag ur belastningsregistret',
      other: 'Annat dokument'
    };
    return names[type] || type;
  };

  const documentTypesToDisplay: string[] = Array.isArray(answers.documentTypes) && answers.documentTypes.length > 0
    ? answers.documentTypes
    : answers.documentType
    ? [answers.documentType]
    : [];

  const getQuantityBreakdown = () => {
    const total = answers.quantity || 0;
    const unitLabel = currentLocale === 'en' ? 'pcs' : 'st';
    const totalLabel = total > 0 ? `${total} ${unitLabel}` : '';

    const quantitiesMap = (answers as any).documentTypeQuantities || {};

    if (!documentTypesToDisplay.length || total <= 0) {
      return { totalLabel, parts: [] as string[] };
    }

    const parts = documentTypesToDisplay
      .map((type: string) => {
        const count = typeof quantitiesMap[type] === 'number' ? quantitiesMap[type] : 0;
        if (count <= 0) return null;
        return `${count} ${getDocumentTypeName(type)}`;
      })
      .filter(Boolean) as string[];

    return { totalLabel, parts };
  };

  // Calculate total including all services
  const calculateTotal = () => {
    let total = totalPrice;
    
    // Add scanned copies if not already in pricing breakdown
    const hasScannedInBreakdown = pricingBreakdown.some(item => 
      item.service === 'scanned_copies' || item.description?.includes('Skannade')
    );
    if (answers.scannedCopies && !hasScannedInBreakdown) {
      total += 200 * answers.quantity;
    }
    
    // Add return service if not already in pricing breakdown
    const hasReturnInBreakdown = pricingBreakdown.some(item => 
      item.service === 'return_service' || item.description?.includes('Retur')
    );
    if (answers.returnService && !hasReturnInBreakdown) {
      // Find return service price
      const returnServiceItem = pricingBreakdown.find(item => 
        item.service === 'return_service'
      );
      if (returnServiceItem) {
        total += returnServiceItem.total;
      }
    }
    
    return total;
  };

  const finalTotal = calculateTotal();

  // Calculate additional services with translations
  const additionalServices = [];
  if (answers.expedited) {
    additionalServices.push({ 
      name: currentLocale === 'en' ? 'Express handling' : 'Express-hantering'
    });
  }
  if (answers.pickupService && answers.pickupMethod) {
    // Find the selected pickup service to show its name
    const selectedPickupService = pickupServices.find((s: any) => s.id === answers.pickupMethod);
    const pickupServiceName = selectedPickupService ? selectedPickupService.name : (currentLocale === 'en' ? 'Pickup service' : 'Upphämtning');
    additionalServices.push({ 
      name: pickupServiceName
    });
    
    // Add premium pickup under pickup service if selected
    if (answers.premiumPickup) {
      const premiumPickupService = pickupServices.find((s: any) => s.id === answers.premiumPickup);
      const premiumName = premiumPickupService ? `  → ${premiumPickupService.name}` : 
                          (currentLocale === 'en' ? '  → Premium pickup' : '  → Premiumhämtning');
      additionalServices.push({ 
        name: premiumName
      });
    }
  }
  if (answers.scannedCopies) {
    const pcs = currentLocale === 'en' ? 'pcs' : 'st';
    const label = currentLocale === 'en' ? 'Scanned copies' : 'Skannade kopior';
    additionalServices.push({ 
      name: `${label} (${answers.quantity} ${pcs})`
    });
  }
  if (answers.returnService) {
    // Find the selected return service to show its name
    const selectedReturnService = returnServices.find((s: any) => s.id === answers.returnService);
    const returnServiceName = selectedReturnService ? selectedReturnService.name : (currentLocale === 'en' ? 'Return shipping' : 'Returfrakt');
    additionalServices.push({ 
      name: returnServiceName
    });
    
    // Add premium delivery under return service if selected
    if (answers.premiumDelivery) {
      const premiumName = answers.premiumDelivery === 'pre-12' ? '  → DHL Pre 12' : 
                          answers.premiumDelivery === 'pre-9' ? '  → DHL Pre 9' : 
                          (currentLocale === 'en' ? '  → Premium delivery' : '  → Premiumleverans');
      additionalServices.push({ 
        name: premiumName
      });
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:sticky lg:top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          {currentLocale === 'en' ? 'Summary' : 'Sammanfattning'}
        </h3>
      </div>

      {/* Country */}
      {answers.country && (
        <div className="mb-4">
          <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="text-gray-600">{currentLocale === 'en' ? 'Country' : 'Land'}:</span>
            <span className="font-semibold text-gray-900 break-words">{getCountryName(answers.country)}</span>
          </div>
        </div>
      )}

      {/* Document Type */}
      {documentTypesToDisplay.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="text-gray-600">{currentLocale === 'en' ? 'Document Type' : 'Dokumenttyp'}:</span>
          </div>
          <div className="mt-1 ml-4 space-y-0.5">
            {documentTypesToDisplay.map((type: string) => (
              <div key={type} className="text-xs text-gray-600 break-words">
                • {getDocumentTypeName(type)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      {answers.quantity > 0 && (() => {
        const breakdown = getQuantityBreakdown();
        return (
          <div className="mb-4">
            <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="text-gray-600">{currentLocale === 'en' ? 'Number of documents' : 'Antal dokument'}:</span>
              <span className="font-semibold text-gray-900 break-words">{breakdown.totalLabel}</span>
            </div>
            {breakdown.parts.length > 0 && (
              <div className="mt-1 ml-4 space-y-0.5">
                {breakdown.parts.map((part: string) => (
                  <div key={part} className="text-xs text-gray-600 break-words">• {part}</div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Services */}
      {answers.services && answers.services.length > 0 && (
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">{currentLocale === 'en' ? 'Services' : 'Tjänster'}:</div>
          <div className="space-y-2">
            {answers.services.map((service: string, index: number) => (
              <div key={index} className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-900">{getServiceName(service)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Services */}
      {additionalServices.length > 0 && (
        <div className="mb-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600 mb-2">{currentLocale === 'en' ? 'Additional Services' : 'Tilläggstjänster'}:</div>
          <div className="space-y-2">
            {additionalServices.map((service, index) => (
              <div key={index} className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-900">{service.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unconfirmed Price Warning */}
      {hasUnconfirmedPrices && (
        <div className="mb-4 pt-4 border-t border-gray-200">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-orange-800">
                  {currentLocale === 'en' ? 'Price on request' : 'Pris på förfrågan'}
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  {currentLocale === 'en' 
                    ? 'The embassy fee for this country needs to be confirmed. We will contact you with the final price before processing.'
                    : 'Ambassadavgiften för detta land behöver bekräftas. Vi kontaktar dig med slutpriset innan vi påbörjar ärendet.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!answers.country && documentTypesToDisplay.length === 0 && answers.services.length === 0 && (
        <div className="text-center py-8">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm text-gray-500">Börja din beställning</p>
          <p className="text-xs text-gray-400 mt-1">Välj land och tjänster</p>
        </div>
      )}

    </div>
  );
};

export default OrderSummary;
