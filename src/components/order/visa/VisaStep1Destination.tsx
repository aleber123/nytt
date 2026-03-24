/**
 * Visa Step 1: Destination Country Selection
 * Dynamically loads available countries from visaRequirements in Firestore
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { StepContainer } from '../shared/StepContainer';
import { VisaOrderAnswers } from './types';
import CountryFlag from '@/components/ui/CountryFlag';
import { trackVisaDestinationSelection, getPopularVisaDestinations, VisaDestinationPopularity } from '@/firebase/pricingService';
import { getAllVisaRequirements } from '@/firebase/visaRequirementsService';

interface Props {
  answers: VisaOrderAnswers;
  onUpdate: (updates: Partial<VisaOrderAnswers>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface VisaCountry {
  code: string;
  name: string;
  nameEn: string;
}

const VisaStep1Destination: React.FC<Props> = ({ answers, onUpdate, onNext, onBack }) => {
  const { t, i18n } = useTranslation('common');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [popularCountries, setPopularCountries] = useState<VisaDestinationPopularity[]>([]);
  const [allVisaCountries, setAllVisaCountries] = useState<VisaCountry[]>([]);
  const [loading, setLoading] = useState(true);

  const isSwedish = i18n.language === 'sv';

  // Load available visa countries from Firestore on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load both popular destinations and all active visa requirements
        const [popular, requirements] = await Promise.all([
          getPopularVisaDestinations(12).catch(() => []),
          getAllVisaRequirements().catch(() => [])
        ]);
        
        console.log('Loaded visa requirements:', requirements.length, 'countries');
        
        setPopularCountries(popular);
        
        // Convert visa requirements to VisaCountry format
        // Only include active countries that have visa products
        const countries: VisaCountry[] = requirements
          .filter(r => r.isActive && r.visaProducts && r.visaProducts.length > 0)
          .map(r => ({
            code: r.countryCode,
            name: r.countryName,
            nameEn: r.countryNameEn || r.countryName
          }))
          .sort((a: VisaCountry, b: VisaCountry) => a.name.localeCompare(b.name, 'sv'));
        
        console.log('Filtered visa countries with products:', countries.length);
        setAllVisaCountries(countries);
      } catch (error) {
        console.error('Error loading visa countries:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Convert popularity data to VisaCountry format
  const popularAsCountries = useMemo(() => {
    return popularCountries.map(p => ({
      code: p.countryCode,
      name: p.countryName,
      nameEn: p.countryNameEn
    }));
  }, [popularCountries]);

  const filteredCountries = useMemo(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return allVisaCountries.filter(
        (c) => c.name.toLowerCase().includes(term) || c.nameEn.toLowerCase().includes(term)
      );
    }
    // If no popular countries loaded yet, show all
    if (showAllCountries || popularAsCountries.length === 0) {
      return allVisaCountries;
    }
    return popularAsCountries;
  }, [searchTerm, showAllCountries, popularAsCountries, allVisaCountries]);

  const handleSelect = (country: VisaCountry) => {
    onUpdate({
      destinationCountry: isSwedish ? country.name : country.nameEn,
      destinationCountryCode: country.code,
    });
    
    // Track selection for popularity ranking (fire and forget)
    trackVisaDestinationSelection(country.code, country.name, country.nameEn).catch(() => {
      // Silently fail - tracking should not block user flow
    });

    // Auto-advance to next step immediately (like legalization flow)
    onNext();
  };

  const isSelected = (code: string) => answers.destinationCountryCode === code;

  return (
    <StepContainer
      title={t('visaOrder.step1.title', 'Vilket land ska du resa till?')}
      subtitle={t('visaOrder.step1.subtitle', 'Välj destinationsland för din resa')}
      onNext={onNext}
      onBack={onBack}
      nextDisabled={!answers.destinationCountryCode}
      showBack={false}
    >
      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder={t('visaOrder.step1.searchPlaceholder', 'Sök land...')}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (e.target.value) setShowAllCountries(true);
          }}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-button focus:border-transparent"
        />
      </div>

      {/* Popular countries label */}
      {!searchTerm && !showAllCountries && (
        <p className="text-sm text-gray-500 mb-3">
          {t('visaOrder.step1.popularCountries', 'Populära destinationer')}
        </p>
      )}

      {/* Country grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {loading && !showAllCountries && !searchTerm ? (
          // Show skeleton placeholders while loading
          Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg animate-pulse"
            >
              <div className="w-6 h-6 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-20" />
            </div>
          ))
        ) : (
          filteredCountries.map((country) => (
            <button
              key={country.code}
              onClick={() => handleSelect(country)}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                isSelected(country.code)
                  ? 'border-custom-button bg-custom-button/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <CountryFlag code={country.code} size={24} />
              <span className="text-sm font-medium text-left">
                {isSwedish ? country.name : country.nameEn}
              </span>
            </button>
          ))
        )}
      </div>

      {/* Show all countries toggle */}
      {!searchTerm && (
        <button
          onClick={() => setShowAllCountries(!showAllCountries)}
          className="text-custom-button hover:underline text-sm"
        >
          {showAllCountries
            ? t('visaOrder.step1.showLess', 'Visa färre')
            : t('visaOrder.step1.showAll', 'Visa alla länder')}
        </button>
      )}
    </StepContainer>
  );
};

export default VisaStep1Destination;
