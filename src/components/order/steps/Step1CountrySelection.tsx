/**
 * Step 1: Country Selection
 * Allows customer to select destination country for document legalization
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import CountryFlag from '@/components/ui/CountryFlag';
import { StepContainer } from '../shared/StepContainer';
import { StepProps, Country } from '../types';
import { ALL_COUNTRIES, POPULAR_COUNTRIES, HAGUE_CONVENTION_COUNTRIES } from '../data/countries';

export const Step1CountrySelection: React.FC<StepProps> = ({
  answers,
  setAnswers,
  onNext,
  currentLocale
}) => {
  const { t } = useTranslation('common');
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get localized country name
  const getCountryName = (countryCode: string) => {
    try {
      if (countryCode && countryCode.length === 2) {
        const displayNames = new Intl.DisplayNames([currentLocale], { type: 'region' });
        const localized = displayNames.of(countryCode);
        if (localized && typeof localized === 'string') return localized;
      }
    } catch {}
    return t(`countries.names.${countryCode}`, { defaultValue: countryCode });
  };

  // Filter countries based on search
  const filteredCountries = ALL_COUNTRIES.filter(country => {
    if (!countrySearch.trim()) return false;
    const searchLower = countrySearch.toLowerCase();
    const countryName = getCountryName(country.code).toLowerCase();
    return countryName.includes(searchLower) || country.code.toLowerCase().includes(searchLower);
  });

  // Handle country selection
  const handleCountrySelect = (countryCode: string) => {
    setAnswers({ ...answers, country: countryCode });
    setCountrySearch('');
    setShowCountryDropdown(false);
  };

  // Handle clicking outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCountryName = answers.country ? getCountryName(answers.country) : '';
  const isHagueCountry = HAGUE_CONVENTION_COUNTRIES.includes(answers.country);

  return (
    <StepContainer
      title={t('orderFlow.step1.title', 'Välj land')}
      subtitle={t('orderFlow.step1.subtitle', 'Vilket land ska dokumenten legaliseras för?')}
      onNext={onNext}
      nextDisabled={!answers.country}
      showBack={false}
    >
      {/* Selected Country Display */}
      {answers.country && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CountryFlag countryCode={answers.country} size="lg" />
              <div>
                <p className="font-semibold text-gray-900">{selectedCountryName}</p>
                <p className="text-sm text-gray-600">
                  {isHagueCountry ? (
                    <span className="text-green-600">✓ Haagkonventionen (Apostille tillgänglig)</span>
                  ) : (
                    <span className="text-blue-600">Ambassadlegalisering krävs</span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setAnswers({ ...answers, country: '' })}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Ändra
            </button>
          </div>
        </div>
      )}

      {/* Popular Countries */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('orderFlow.step1.popularCountries', 'Populära länder')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {POPULAR_COUNTRIES.map((country) => (
            <button
              key={country.code}
              onClick={() => handleCountrySelect(country.code)}
              className={`p-3 border rounded-lg hover:border-custom-button hover:bg-custom-button-light transition-all ${
                answers.country === country.code
                  ? 'border-custom-button bg-custom-button-light ring-2 ring-custom-button'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <CountryFlag countryCode={country.code} size="md" />
                <span className="text-sm font-medium text-gray-900 text-center">
                  {getCountryName(country.code)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Search All Countries */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('orderFlow.step1.searchCountries', 'Sök alla länder')}
        </h3>
        <div className="relative" ref={dropdownRef}>
          <input
            type="text"
            value={countrySearch}
            onChange={(e) => {
              setCountrySearch(e.target.value);
              setShowCountryDropdown(true);
            }}
            onFocus={() => setShowCountryDropdown(true)}
            placeholder={t('orderFlow.step1.searchPlaceholder', 'Sök land...')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-button focus:border-custom-button"
          />

          {/* Dropdown */}
          {showCountryDropdown && countrySearch && filteredCountries.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => handleCountrySelect(country.code)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
                >
                  <CountryFlag countryCode={country.code} size="sm" />
                  <span className="text-gray-900">{getCountryName(country.code)}</span>
                  <span className="text-gray-500 text-sm">({country.code})</span>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {showCountryDropdown && countrySearch && filteredCountries.length === 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
              <p className="text-gray-500 text-center">
                {t('orderFlow.step1.noResults', 'Inga länder hittades')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>💡 Tips:</strong> Välj det land där dokumenten ska användas. Vi hanterar alla nödvändiga legaliseringar.
        </p>
      </div>
    </StepContainer>
  );
};

export default Step1CountrySelection;
