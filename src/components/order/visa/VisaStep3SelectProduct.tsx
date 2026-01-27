/**
 * VisaStep3SelectProduct - Select visa product step
 * Replaces the old TripType and EntryType steps with a single product selection
 */

import React, { useEffect, useState } from 'react';
import { VisaOrderAnswers, SelectedVisaProduct } from './types';
import { getAvailableVisaProducts, VisaProduct, VisaType } from '@/firebase/visaRequirementsService';

interface VisaStep3SelectProductProps {
  answers: VisaOrderAnswers;
  onUpdate: (updates: Partial<VisaOrderAnswers>) => void;
  onNext: () => void;
  onBack: () => void;
  locale: string;
}

const CATEGORY_LABELS: Record<string, { sv: string; en: string; icon: string }> = {
  tourist: { sv: 'Turist', en: 'Tourist', icon: '🏖️' },
  business: { sv: 'Affärs', en: 'Business', icon: '💼' },
  transit: { sv: 'Transit', en: 'Transit', icon: '✈️' },
  student: { sv: 'Student', en: 'Student', icon: '🎓' },
  work: { sv: 'Arbete', en: 'Work', icon: '👷' },
  medical: { sv: 'Medicinsk', en: 'Medical', icon: '🏥' },
  conference: { sv: 'Konferens', en: 'Conference', icon: '🎤' },
};

export default function VisaStep3SelectProduct({
  answers,
  onUpdate,
  onNext,
  onBack,
  locale
}: VisaStep3SelectProductProps) {
  const [products, setProducts] = useState<VisaProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [visaType, setVisaType] = useState<VisaType>('sticker');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    answers.selectedVisaProduct?.id || null
  );

  useEffect(() => {
    const loadProducts = async () => {
      if (answers.destinationCountryCode && answers.nationalityCode) {
        setLoading(true);
        const result = await getAvailableVisaProducts(
          answers.destinationCountryCode,
          answers.nationalityCode
        );
        setProducts(result.products);
        setVisaType(result.visaType);
        setLoading(false);
      }
    };
    loadProducts();
  }, [answers.destinationCountryCode, answers.nationalityCode]);

  const handleSelectProduct = (product: VisaProduct) => {
    setSelectedProductId(product.id);
    
    const selectedProduct: SelectedVisaProduct = {
      id: product.id,
      name: product.name,
      nameEn: product.nameEn,
      category: product.category,
      visaType: product.visaType as 'e-visa' | 'sticker',
      entryType: product.entryType as 'single' | 'double' | 'multiple',
      validityDays: product.validityDays,
      price: product.price,
      serviceFee: product.serviceFee,
      embassyFee: product.embassyFee,
      processingDays: product.processingDays,
      expressAvailable: product.expressAvailable,
      expressDays: product.expressDays,
      expressPrice: product.expressPrice,
      expressEmbassyFee: product.expressEmbassyFee,
      expressDoxFee: product.expressDoxFee,
      urgentAvailable: product.urgentAvailable,
      urgentDays: product.urgentDays,
      urgentPrice: product.urgentPrice,
      urgentEmbassyFee: product.urgentEmbassyFee,
      urgentDoxFee: product.urgentDoxFee,
    };

    onUpdate({
      selectedVisaProduct: selectedProduct,
      tripType: product.category === 'business' ? 'business' : 'tourist',
      entryType: product.entryType as 'single' | 'double' | 'multiple',
    });
  };

  const handleContinue = () => {
    if (selectedProductId) {
      onNext();
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {locale === 'en' ? 'No visa products available' : 'Inga visumprodukter tillgängliga'}
            </h3>
            <p className="text-gray-600 mb-6">
              {locale === 'en' 
                ? 'We currently don\'t have any visa products configured for this destination and nationality combination. Please contact us and we will help you.'
                : 'Vi har för närvarande inga visumprodukter konfigurerade för denna destination och nationalitet. Kontakta oss så hjälper vi dig.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={onBack}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {locale === 'en' ? '← Back' : '← Tillbaka'}
              </button>
              <a
                href="/kontakt"
                className="px-6 py-2 bg-custom-button text-white rounded-lg hover:bg-custom-button/90 text-center"
              >
                {locale === 'en' ? 'Contact us' : 'Kontakta oss'}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Group products by category
  const groupedProducts = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, VisaProduct[]>);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {locale === 'en' ? 'Select your visa type' : 'Välj din visumtyp'}
          </h2>
          <p className="text-gray-600">
            {locale === 'en' 
              ? `Available visa options for ${answers.destinationCountry}`
              : `Tillgängliga visumalternativ för ${answers.destinationCountry}`}
          </p>
        </div>

        {/* Products */}
        <div className="space-y-6">
          {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
            <div key={category}>
              {/* Category header - only show if multiple categories */}
              {Object.keys(groupedProducts).length > 1 && (
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                  <span className="mr-2">{CATEGORY_LABELS[category]?.icon || '📋'}</span>
                  {locale === 'en' 
                    ? CATEGORY_LABELS[category]?.en || category 
                    : CATEGORY_LABELS[category]?.sv || category}
                </h3>
              )}

              <div className="grid gap-4">
                {categoryProducts.map((product) => {
                  const isSelected = selectedProductId === product.id;
                  const isEVisa = product.visaType === 'e-visa';

                  return (
                    <button
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className={`w-full text-left p-4 sm:p-5 rounded-xl border-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {/* Visa type badge */}
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              isEVisa 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {isEVisa ? (
                                <>
                                  <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  E-Visa
                                </>
                              ) : (
                                <>
                                  <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                                  </svg>
                                  {locale === 'en' ? 'Sticker' : 'Sticker'}
                                </>
                              )}
                            </span>

                            {/* Entry type badge */}
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                              {product.entryType === 'single' 
                                ? (locale === 'en' ? 'Single entry' : 'Enkel inresa')
                                : (locale === 'en' ? 'Multiple entry' : 'Flera inresor')}
                            </span>
                          </div>

                          <h4 className="text-lg font-semibold text-gray-900 mb-1">
                            {locale === 'en' && product.nameEn ? product.nameEn : product.name}
                          </h4>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {product.validityDays} {locale === 'en' ? 'days validity' : 'dagars giltighet'}
                            </span>
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              ~{product.processingDays} {locale === 'en' ? 'days processing' : 'dagars handläggning'}
                            </span>
                          </div>

                          {/* E-visa benefit text */}
                          {isEVisa && (
                            <p className="mt-2 text-sm text-green-700">
                              ✓ {locale === 'en' 
                                ? 'No passport shipping required' 
                                : 'Inget pass behöver skickas'}
                            </p>
                          )}
                        </div>

                        {/* Price */}
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-gray-900">
                            {product.price.toLocaleString()} kr
                          </div>
                          <div className="text-xs text-gray-500">
                            {locale === 'en' ? 'incl. VAT' : 'inkl. moms'}
                          </div>
                          {(product.serviceFee || product.embassyFee) ? (
                            <div className="text-xs text-gray-400 space-y-0.5 mt-1">
                              <div>{locale === 'en' ? 'Service' : 'Service'}: {(product.serviceFee || 0).toLocaleString()} kr</div>
                              <div>{locale === 'en' ? 'Embassy' : 'Ambassad'}: {(product.embassyFee || 0).toLocaleString()} kr</div>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500">
                              {locale === 'en' ? 'incl. service fee' : 'inkl. serviceavgift'}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-primary-200">
                          <div className="flex items-center text-primary-700 text-sm font-medium">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {locale === 'en' ? 'Selected' : 'Vald'}
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={onBack}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {locale === 'en' ? '← Back' : '← Tillbaka'}
          </button>
          <button
            onClick={handleContinue}
            disabled={!selectedProductId}
            className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${
              selectedProductId
                ? 'bg-custom-button text-white hover:bg-custom-button-hover'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {locale === 'en' ? 'Continue →' : 'Fortsätt →'}
          </button>
        </div>
      </div>
    </div>
  );
}
