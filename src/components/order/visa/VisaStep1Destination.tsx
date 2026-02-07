/**
 * Visa Step 1: Destination Country Selection
 * Uses dynamic popularity tracking like legalization countries
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'next-i18next';
import { StepContainer } from '../shared/StepContainer';
import { VisaOrderAnswers } from './types';
import CountryFlag from '@/components/ui/CountryFlag';
import { trackVisaDestinationSelection, getPopularVisaDestinations, VisaDestinationPopularity } from '@/firebase/pricingService';

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

// All visa countries (comprehensive list)
const ALL_VISA_COUNTRIES: VisaCountry[] = [
  { code: 'AF', name: 'Afghanistan', nameEn: 'Afghanistan' },
  { code: 'DZ', name: 'Algeriet', nameEn: 'Algeria' },
  { code: 'AO', name: 'Angola', nameEn: 'Angola' },
  { code: 'AU', name: 'Australien', nameEn: 'Australia' },
  { code: 'AZ', name: 'Azerbajdzjan', nameEn: 'Azerbaijan' },
  { code: 'BH', name: 'Bahrain', nameEn: 'Bahrain' },
  { code: 'BD', name: 'Bangladesh', nameEn: 'Bangladesh' },
  { code: 'BY', name: 'Belarus', nameEn: 'Belarus' },
  { code: 'BJ', name: 'Benin', nameEn: 'Benin' },
  { code: 'BT', name: 'Bhutan', nameEn: 'Bhutan' },
  { code: 'BR', name: 'Brasilien', nameEn: 'Brazil' },
  { code: 'DJ', name: 'Djibouti', nameEn: 'Djibouti' },
  { code: 'EG', name: 'Egypten', nameEn: 'Egypt' },
  { code: 'ER', name: 'Eritrea', nameEn: 'Eritrea' },
  { code: 'ET', name: 'Etiopien', nameEn: 'Ethiopia' },
  { code: 'AE', name: 'Förenade Arabemiraten', nameEn: 'United Arab Emirates' },
  { code: 'GH', name: 'Ghana', nameEn: 'Ghana' },
  { code: 'IN', name: 'Indien', nameEn: 'India' },
  { code: 'ID', name: 'Indonesien', nameEn: 'Indonesia' },
  { code: 'IR', name: 'Iran', nameEn: 'Iran' },
  { code: 'IQ', name: 'Irak', nameEn: 'Iraq' },
  { code: 'JP', name: 'Japan', nameEn: 'Japan' },
  { code: 'YE', name: 'Jemen', nameEn: 'Yemen' },
  { code: 'JO', name: 'Jordanien', nameEn: 'Jordan' },
  { code: 'KH', name: 'Kambodja', nameEn: 'Cambodia' },
  { code: 'CM', name: 'Kamerun', nameEn: 'Cameroon' },
  { code: 'KZ', name: 'Kazakstan', nameEn: 'Kazakhstan' },
  { code: 'KE', name: 'Kenya', nameEn: 'Kenya' },
  { code: 'CN', name: 'Kina', nameEn: 'China' },
  { code: 'CD', name: 'Kongo-Kinshasa', nameEn: 'DR Congo' },
  { code: 'CU', name: 'Kuba', nameEn: 'Cuba' },
  { code: 'KW', name: 'Kuwait', nameEn: 'Kuwait' },
  { code: 'LA', name: 'Laos', nameEn: 'Laos' },
  { code: 'LY', name: 'Libyen', nameEn: 'Libya' },
  { code: 'MG', name: 'Madagaskar', nameEn: 'Madagascar' },
  { code: 'MY', name: 'Malaysia', nameEn: 'Malaysia' },
  { code: 'MM', name: 'Myanmar', nameEn: 'Myanmar' },
  { code: 'NP', name: 'Nepal', nameEn: 'Nepal' },
  { code: 'NG', name: 'Nigeria', nameEn: 'Nigeria' },
  { code: 'KP', name: 'Nordkorea', nameEn: 'North Korea' },
  { code: 'OM', name: 'Oman', nameEn: 'Oman' },
  { code: 'PK', name: 'Pakistan', nameEn: 'Pakistan' },
  { code: 'QA', name: 'Qatar', nameEn: 'Qatar' },
  { code: 'RU', name: 'Ryssland', nameEn: 'Russia' },
  { code: 'SA', name: 'Saudiarabien', nameEn: 'Saudi Arabia' },
  { code: 'SN', name: 'Senegal', nameEn: 'Senegal' },
  { code: 'LK', name: 'Sri Lanka', nameEn: 'Sri Lanka' },
  { code: 'SD', name: 'Sudan', nameEn: 'Sudan' },
  { code: 'KR', name: 'Sydkorea', nameEn: 'South Korea' },
  { code: 'SY', name: 'Syrien', nameEn: 'Syria' },
  { code: 'TZ', name: 'Tanzania', nameEn: 'Tanzania' },
  { code: 'TD', name: 'Tchad', nameEn: 'Chad' },
  { code: 'TH', name: 'Thailand', nameEn: 'Thailand' },
  { code: 'TR', name: 'Turkiet', nameEn: 'Turkey' },
  { code: 'UG', name: 'Uganda', nameEn: 'Uganda' },
  { code: 'UZ', name: 'Uzbekistan', nameEn: 'Uzbekistan' },
  { code: 'VN', name: 'Vietnam', nameEn: 'Vietnam' },
  { code: 'ZM', name: 'Zambia', nameEn: 'Zambia' },
  { code: 'ZW', name: 'Zimbabwe', nameEn: 'Zimbabwe' },
].sort((a, b) => a.name.localeCompare(b.name, 'sv'));

const VisaStep1Destination: React.FC<Props> = ({ answers, onUpdate, onNext, onBack }) => {
  const { t, i18n } = useTranslation('common');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [popularCountries, setPopularCountries] = useState<VisaDestinationPopularity[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(true);

  const isSwedish = i18n.language === 'sv';

  // Stable reference to onNext to avoid stale closures
  const stableOnNext = useCallback(() => onNext(), [onNext]);

  // Load dynamic popular countries on mount
  useEffect(() => {
    const loadPopularCountries = async () => {
      try {
        const popular = await getPopularVisaDestinations(12);
        setPopularCountries(popular);
      } catch (error) {
        // Fallback handled by getPopularVisaDestinations
      } finally {
        setLoadingPopular(false);
      }
    };
    loadPopularCountries();
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
      return ALL_VISA_COUNTRIES.filter(
        (c) => c.name.toLowerCase().includes(term) || c.nameEn.toLowerCase().includes(term)
      );
    }
    return showAllCountries ? ALL_VISA_COUNTRIES : popularAsCountries;
  }, [searchTerm, showAllCountries, popularAsCountries]);

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
        {loadingPopular && !showAllCountries && !searchTerm ? (
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
