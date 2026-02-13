/**
 * VisaStep3SelectProduct - Select visa product step
 * Shows filter phase (category + entry type) when many products exist,
 * then shows filtered product list for final selection.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { VisaOrderAnswers, SelectedVisaProduct, VisaAddOnService } from './types';
import { getAvailableVisaProducts, VisaProduct, VisaType, VisaProductsResult } from '@/firebase/visaRequirementsService';
import { getApplicableAddons, VisaAddon } from '@/firebase/visaAddonService';

interface VisaStep3SelectProductProps {
  answers: VisaOrderAnswers;
  onUpdate: (updates: Partial<VisaOrderAnswers>) => void;
  onNext: () => void;
  onBack: () => void;
  locale: string;
}

const CATEGORY_LABELS: Record<string, { sv: string; en: string; icon: string; desc_sv: string; desc_en: string }> = {
  tourist: { sv: 'Turistvisum', en: 'Tourist Visa', icon: '🏖️', desc_sv: 'För semester och turism', desc_en: 'For holiday and tourism' },
  business: { sv: 'Affärsvisum', en: 'Business Visa', icon: '💼', desc_sv: 'För affärsresor och möten', desc_en: 'For business trips and meetings' },
  transit: { sv: 'Transitvisum', en: 'Transit Visa', icon: '✈️', desc_sv: 'För genomresa', desc_en: 'For transit' },
  student: { sv: 'Studentvisum', en: 'Student Visa', icon: '🎓', desc_sv: 'För studier', desc_en: 'For studies' },
  work: { sv: 'Arbetsvisum', en: 'Work Visa', icon: '👷', desc_sv: 'För arbete', desc_en: 'For work' },
  medical: { sv: 'Medicinskt visum', en: 'Medical Visa', icon: '🏥', desc_sv: 'För medicinsk behandling', desc_en: 'For medical treatment' },
  conference: { sv: 'Konferensvisum', en: 'Conference Visa', icon: '🎤', desc_sv: 'För konferenser', desc_en: 'For conferences' },
  journalist: { sv: 'Journalistvisum', en: 'Journalist Visa', icon: '📰', desc_sv: 'För journalister och media', desc_en: 'For journalists and media' },
  crew: { sv: 'Besättningsvisum', en: 'Crew Visa', icon: '⚓', desc_sv: 'För flyg- och fartygsbesättning', desc_en: 'For airline and ship crew' },
  religious: { sv: 'Religiöst visum', en: 'Religious Visa', icon: '🕊️', desc_sv: 'För religiösa ändamål', desc_en: 'For religious purposes' },
  diplomatic: { sv: 'Diplomatvisum', en: 'Diplomatic Visa', icon: '🏛️', desc_sv: 'För diplomater och tjänstemän', desc_en: 'For diplomats and officials' },
  research: { sv: 'Forskningsvisum', en: 'Research Visa', icon: '🔬', desc_sv: 'För forskning och akademiskt arbete', desc_en: 'For research and academic work' },
  volunteer: { sv: 'Volontärvisum', en: 'Volunteer Visa', icon: '🤝', desc_sv: 'För volontärarbete', desc_en: 'For volunteer work' },
  family: { sv: 'Familjevisum', en: 'Family Visa', icon: '👨‍👩‍👧‍👦', desc_sv: 'För familjeåterförening eller besök', desc_en: 'For family reunion or visit' },
  other: { sv: 'Övrigt visum', en: 'Other Visa', icon: '📋', desc_sv: 'Övriga visumtyper', desc_en: 'Other visa types' },
};

const ENTRY_TYPE_LABELS: Record<string, { sv: string; en: string; icon: string; desc_sv: string; desc_en: string }> = {
  single: { sv: 'En inresa', en: 'Single Entry', icon: '➡️', desc_sv: 'Gäller för en inresa i landet', desc_en: 'Valid for one entry into the country' },
  multiple: { sv: 'Flera inresor', en: 'Multiple Entry', icon: '🔄', desc_sv: 'Gäller för flera inresor under visumets giltighetstid', desc_en: 'Valid for multiple entries during the visa validity period' },
  double: { sv: 'Dubbel inresa', en: 'Double Entry', icon: '↔️', desc_sv: 'Gäller för två inresor', desc_en: 'Valid for two entries' },
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
  const [useStandardPricing, setUseStandardPricing] = useState(true);
  const [pricingNote, setPricingNote] = useState<string | undefined>();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    answers.selectedVisaProduct?.id || null
  );

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showProducts, setShowProducts] = useState(false);

  // Add-on services state
  const [showAddOns, setShowAddOns] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<VisaProduct | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  // Global addons from Firestore
  const [globalAddons, setGlobalAddons] = useState<VisaAddon[]>([]);

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
        setUseStandardPricing(result.useStandardPricing);
        setPricingNote(result.pricingNote);
        setLoading(false);
      }
    };
    loadProducts();
  }, [answers.destinationCountryCode, answers.nationalityCode]);

  // Load global addons when destination country is known
  useEffect(() => {
    const loadGlobalAddons = async () => {
      if (answers.destinationCountryCode) {
        try {
          // Load with 'all' category/product initially; will re-filter per product
          const addons = await getApplicableAddons(answers.destinationCountryCode, 'all', 'all');
          setGlobalAddons(addons);
        } catch {
          setGlobalAddons([]);
        }
      }
    };
    loadGlobalAddons();
  }, [answers.destinationCountryCode]);

  // Determine available categories and entry types
  const availableCategories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category)));
    return cats;
  }, [products]);

  // Check if we need the filter phase (only based on categories)
  const needsFilter = availableCategories.length > 1;

  // Auto-skip filter if only one category and one entry type
  useEffect(() => {
    if (!loading && products.length > 0 && !needsFilter) {
      setShowProducts(true);
    }
  }, [loading, products, needsFilter]);

  // Filtered products based on category selection
  const filteredProducts = useMemo(() => {
    if (selectedCategory) {
      return products.filter(p => p.category === selectedCategory);
    }
    return products;
  }, [products, selectedCategory]);

  // Get merged addons for a product: product-specific + applicable global addons
  const getMergedAddons = (product: VisaProduct): VisaAddOnService[] => {
    const productAddons: VisaAddOnService[] = product.addOnServices || [];
    // Filter global addons applicable to this product's category and ID
    const applicableGlobal = globalAddons.filter(ga => {
      const catMatch = ga.applicableCategories.includes('all') || ga.applicableCategories.includes(product.category);
      const prodMatch = ga.applicableProductIds.includes('all') || ga.applicableProductIds.includes(product.id);
      return catMatch && prodMatch;
    });
    // Convert global addons to VisaAddOnService format, avoiding ID conflicts
    const existingIds = new Set(productAddons.map(a => a.id));
    const globalAsAddOns: VisaAddOnService[] = applicableGlobal
      .filter(ga => !existingIds.has(ga.id))
      .map(ga => ({
        id: ga.id,
        name: ga.name,
        nameEn: ga.nameEn,
        description: ga.description,
        descriptionEn: ga.descriptionEn,
        price: ga.price,
        icon: ga.icon,
        required: ga.required,
        includedInProduct: ga.includedInProduct,
        formTemplateId: ga.formTemplateId,
      }));
    return [...productAddons, ...globalAsAddOns];
  };

  const finalizeProductSelection = (product: VisaProduct, addOns: Set<string>) => {
    const selectedProduct: SelectedVisaProduct = {
      id: product.id,
      name: product.name,
      nameEn: product.nameEn,
      category: product.category,
      visaType: product.visaType as 'e-visa' | 'sticker',
      entryType: product.entryType as 'single' | 'double' | 'multiple',
      validityDays: product.validityDays,
      price: useStandardPricing ? product.price : 0,
      serviceFee: product.serviceFee,
      embassyFee: useStandardPricing ? product.embassyFee : 0,
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
      useStandardPricing,
      pricingNote,
    };

    // Build selected add-on services array from merged addons (product + global)
    // Always include 'includedInProduct' addons automatically (price=0, with formTemplateId)
    const mergedAddons = getMergedAddons(product);
    const selectedAddOnServices = mergedAddons
      .filter(a => a.includedInProduct || addOns.has(a.id))
      .map(a => ({ id: a.id, name: a.name, nameEn: a.nameEn, price: a.includedInProduct ? 0 : a.price, ...(a.formTemplateId ? { formTemplateId: a.formTemplateId } : {}) }));

    onUpdate({
      selectedVisaProduct: selectedProduct,
      tripType: product.category === 'business' ? 'business' : 'tourist',
      entryType: product.entryType as 'single' | 'double' | 'multiple',
      selectedAddOnServices,
    });

    onNext();
  };

  const handleSelectProduct = (product: VisaProduct) => {
    setSelectedProductId(product.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Check if this product has add-on services (product-specific + global)
    const mergedAddons = getMergedAddons(product);
    // Separate selectable addons from included-in-product addons
    const selectableAddons = mergedAddons.filter(a => !a.includedInProduct);
    if (selectableAddons.length > 0) {
      // Temporarily store merged addons on the product for the add-on phase
      // (only show selectable ones, included ones are handled automatically)
      const productWithMergedAddons = { ...product, addOnServices: selectableAddons };
      setPendingProduct(productWithMergedAddons);
      setSelectedAddOns(new Set(
        selectableAddons.filter(a => a.required).map(a => a.id)
      ));
      setShowAddOns(true);
      return;
    }

    // No selectable add-ons, finalize immediately (included addons still get added)
    finalizeProductSelection(product, new Set());
  };

  const handleContinue = () => {
    if (selectedProductId) {
      onNext();
    }
  };

  const handleFilterContinue = () => {
    setShowProducts(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterBack = () => {
    if (showAddOns) {
      setShowAddOns(false);
      setPendingProduct(null);
      setSelectedProductId(null);
      return;
    }
    if (showProducts) {
      setShowProducts(false);
      setSelectedProductId(null);
    } else {
      onBack();
    }
  };

  const handleToggleAddOn = (addOnId: string, required?: boolean) => {
    if (required) return; // Cannot toggle required add-ons
    setSelectedAddOns(prev => {
      const next = new Set(prev);
      if (next.has(addOnId)) {
        next.delete(addOnId);
      } else {
        next.add(addOnId);
      }
      return next;
    });
  };

  const handleAddOnContinue = () => {
    if (pendingProduct) {
      finalizeProductSelection(pendingProduct, selectedAddOns);
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

  // === FILTER PHASE (category only) ===
  if (needsFilter && !showProducts) {
    const canContinue = !!selectedCategory;

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {locale === 'en' ? 'What type of visa do you need?' : 'Vilken typ av visum behöver du?'}
            </h2>
            <p className="text-gray-600">
              {locale === 'en' 
                ? `Select your preferences for ${answers.destinationCountry}`
                : `Välj dina preferenser för ${answers.destinationCountry}`}
            </p>
          </div>

          {/* Category selection */}
          {availableCategories.length > 1 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                {locale === 'en' ? 'Purpose of travel' : 'Syfte med resan'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableCategories.map((cat) => {
                  const label = CATEGORY_LABELS[cat];
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                      }}
                      className={`flex items-center p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        isSelected
                          ? 'border-custom-button bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-2xl mr-3">{label?.icon || '📋'}</span>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {locale === 'en' ? label?.en || cat : label?.sv || cat}
                        </div>
                        <div className="text-sm text-gray-500">
                          {locale === 'en' ? label?.desc_en : label?.desc_sv}
                        </div>
                      </div>
                      {isSelected && (
                        <svg className="w-5 h-5 text-custom-button ml-auto flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex justify-between">
            <button
              onClick={onBack}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {locale === 'en' ? '← Back' : '← Tillbaka'}
            </button>
            <button
              onClick={handleFilterContinue}
              disabled={!canContinue}
              className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${
                canContinue
                  ? 'bg-custom-button text-white hover:bg-custom-button-hover'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {locale === 'en' 
                ? `Show options (${filteredProducts.length}) →` 
                : `Visa alternativ (${filteredProducts.length}) →`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === ADD-ON SERVICES PHASE ===
  if (showAddOns && pendingProduct && pendingProduct.addOnServices) {
    const addOnTotal = pendingProduct.addOnServices
      .filter(a => selectedAddOns.has(a.id))
      .reduce((sum, a) => sum + a.price, 0);

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {locale === 'en' ? 'Additional services' : 'Tilläggstjänster'}
            </h2>
            <p className="text-gray-600">
              {locale === 'en'
                ? 'The following services are available for your selected visa product'
                : 'Följande tjänster finns tillgängliga för din valda visumprodukt'}
            </p>
          </div>

          {/* Selected product summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-blue-900">
                  {locale === 'en' && pendingProduct.nameEn ? pendingProduct.nameEn : pendingProduct.name}
                </div>
                <div className="text-sm text-blue-700">
                  {useStandardPricing ? `${pendingProduct.price.toLocaleString()} kr` : (locale === 'en' ? 'Price TBC' : 'Pris TBC')}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddOns(false);
                  setPendingProduct(null);
                  setSelectedProductId(null);
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                {locale === 'en' ? 'Change' : 'Ändra'}
              </button>
            </div>
          </div>

          {/* Add-on services list */}
          <div className="space-y-3 mb-8">
            {pendingProduct.addOnServices.map((addOn) => {
              const isSelected = selectedAddOns.has(addOn.id);
              return (
                <button
                  key={addOn.id}
                  onClick={() => handleToggleAddOn(addOn.id, addOn.required)}
                  className={`w-full flex items-start p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    isSelected
                      ? 'border-custom-button bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  } ${addOn.required ? 'opacity-80 cursor-default' : ''}`}
                >
                  <span className="text-2xl mr-3 mt-0.5">{addOn.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {locale === 'en' ? addOn.nameEn : addOn.name}
                      </span>
                      {addOn.required && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          {locale === 'en' ? 'Required' : 'Obligatorisk'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {locale === 'en' ? addOn.descriptionEn : addOn.description}
                    </p>
                    <div className="text-sm font-semibold text-gray-900 mt-2">
                      +{addOn.price.toLocaleString()} kr
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-3 mt-1">
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-custom-button border-custom-button'
                        : 'border-gray-300 bg-white'
                    }`}>
                      {isSelected && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Total with add-ons */}
          {addOnTotal > 0 && useStandardPricing && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{locale === 'en' ? 'Visa product' : 'Visumprodukt'}:</span>
                <span>{pendingProduct.price.toLocaleString()} kr</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>{locale === 'en' ? 'Add-on services' : 'Tilläggstjänster'}:</span>
                <span>+{addOnTotal.toLocaleString()} kr</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>{locale === 'en' ? 'Total' : 'Totalt'}:</span>
                <span>{(pendingProduct.price + addOnTotal).toLocaleString()} kr</span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={handleFilterBack}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {locale === 'en' ? '← Back' : '← Tillbaka'}
            </button>
            <button
              onClick={handleAddOnContinue}
              className="px-8 py-3 rounded-lg font-semibold bg-custom-button text-white hover:bg-custom-button-hover transition-all duration-200"
            >
              {locale === 'en' ? 'Continue →' : 'Fortsätt →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === PRODUCT LIST PHASE ===
  const displayProducts = needsFilter ? filteredProducts : products;

  // Group products by category (for non-filtered view)
  const groupedProducts = displayProducts.reduce((acc, product) => {
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
            {locale === 'en' ? 'Select your visa' : 'Välj ditt visum'}
          </h2>
          <p className="text-gray-600">
            {locale === 'en' 
              ? `Choose the validity period for your visa to ${answers.destinationCountry}`
              : `Välj giltighetstid för ditt visum till ${answers.destinationCountry}`}
          </p>
          {/* Show active filters */}
          {needsFilter && selectedCategory && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {CATEGORY_LABELS[selectedCategory]?.icon} {locale === 'en' ? CATEGORY_LABELS[selectedCategory]?.en : CATEGORY_LABELS[selectedCategory]?.sv}
              </span>
              <button
                onClick={() => {
                  setShowProducts(false);
                  setSelectedProductId(null);
                }}
                className="text-sm text-custom-button hover:underline ml-1"
              >
                {locale === 'en' ? 'Change' : 'Ändra'}
              </button>
            </div>
          )}
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

                          {/* Included services info */}
                          {(() => {
                            const included = getMergedAddons(product).filter(a => a.includedInProduct);
                            if (included.length === 0) return null;
                            return (
                              <div className="mt-2 space-y-0.5">
                                {included.map(a => (
                                  <p key={a.id} className="text-sm text-blue-700">
                                    ✓ {locale === 'en' 
                                      ? `${a.nameEn} included` 
                                      : `${a.name} ingår`}
                                  </p>
                                ))}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Price */}
                        <div className="text-right ml-4">
                          {useStandardPricing ? (
                            <>
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
                            </>
                          ) : (
                            <>
                              <div className="text-lg font-bold text-amber-600">
                                {locale === 'en' ? 'Price TBC' : 'Pris TBC'}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {pricingNote || (locale === 'en' 
                                  ? 'Embassy fee confirmed after application' 
                                  : 'Ambassadavgift bekräftas efter ansökan')}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {locale === 'en' ? 'Service' : 'Service'}: {(product.serviceFee || 0).toLocaleString()} kr
                              </div>
                            </>
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
            onClick={handleFilterBack}
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
