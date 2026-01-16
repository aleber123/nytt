/**
 * Step 1: Country Selection
 * Allows customer to select destination country for document legalization
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { StepContainer } from '../shared/StepContainer';
import { StepProps, Country } from '../types';
import { ALL_COUNTRIES, POPULAR_COUNTRIES, HAGUE_CONVENTION_COUNTRIES } from '../data/countries';
import CountryFlag from '../../ui/CountryFlag';
import { trackCountrySelection, getPopularCountries, CountryPopularity } from '@/firebase/pricingService';

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
  const [dynamicPopularCountries, setDynamicPopularCountries] = useState<CountryPopularity[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(true);

  // Load dynamic popular countries on mount
  useEffect(() => {
    const loadPopularCountries = async () => {
      try {
        const popular = await getPopularCountries(12);
        setDynamicPopularCountries(popular);
      } catch (error) {
        // Fallback handled by getPopularCountries
      } finally {
        setLoadingPopular(false);
      }
    };
    loadPopularCountries();
  }, []);

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
    
    // Track country selection for popularity ranking (fire and forget)
    trackCountrySelection(countryCode).catch(() => {
      // Silently fail - tracking should not block user flow
    });
    
    // Automatically go to next step
    onNext();
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
      subtitle={t('orderFlow.step1.subtitle', 'Vilket land ska dokumenten användas i?')}
      onNext={onNext}
      showNext={false}
    >
      {/* Country Search */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('orderFlow.step1.searchLabel', 'Sök alla länder')}
        </label>
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
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button"
          />

          {/* Dropdown */}
          {showCountryDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => handleCountrySelect(country.code)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <CountryFlag code={country.code} size={24} />
                    <span>{getCountryName(country.code)}</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-500">
                  {t('orderFlow.step1.noResults', 'Inga resultat')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Popular Countries - Dynamic based on actual selections */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          {t('orderFlow.step1.popularCountries', 'Populära länder')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {loadingPopular ? (
            // Show static fallback while loading
            POPULAR_COUNTRIES.slice(0, 12).map((country) => (
              <button
                key={country.code}
                onClick={() => handleCountrySelect(country.code)}
                className="flex items-center space-x-2 p-3 border border-gray-200 rounded-md hover:border-custom-button hover:bg-custom-button-light transition-colors"
              >
                <CountryFlag code={country.code} size={24} />
                <span className="text-sm">{getCountryName(country.code)}</span>
              </button>
            ))
          ) : (
            // Show dynamic popular countries
            dynamicPopularCountries.map((country) => (
              <button
                key={country.countryCode}
                onClick={() => handleCountrySelect(country.countryCode)}
                className="flex items-center space-x-2 p-3 border border-gray-200 rounded-md hover:border-custom-button hover:bg-custom-button-light transition-colors"
              >
                <CountryFlag code={country.countryCode} size={24} />
                <span className="text-sm">{getCountryName(country.countryCode)}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Selected Country Display */}
      {answers.country && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="mr-3">
              <CountryFlag code={answers.country} size={32} />
            </div>
            <div>
              <div className="font-medium text-green-900">
                {selectedCountryName}
              </div>
              <div className="text-sm text-green-700">
                {isHagueCountry 
                  ? t('orderFlow.step1.hagueDescription', 'Haagkonventionen - Apostille tillgänglig')
                  : t('orderFlow.step1.embassyDescription', 'Ambassadlegalisering krävs')
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hague Convention Info */}
      {answers.country && isHagueCountry && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <span className="text-2xl mr-3">ℹ️</span>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">
                {t('orderFlow.step1.hagueConventionTitle', 'Haagkonventionen')}
              </h4>
              <p className="text-sm text-blue-800">
                {t('orderFlow.step1.hagueConventionDescription', 'Detta land är anslutet till Haagkonventionen. Apostille räcker för legalisering.')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Non-Hague Info */}
      {answers.country && !isHagueCountry && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <span className="text-2xl mr-3">📋</span>
            <div>
              <h4 className="font-medium text-amber-900 mb-1">
                {t('orderFlow.step1.nonHagueTitle', 'Ambassadlegalisering')}
              </h4>
              <p className="text-sm text-amber-800">
                {t('orderFlow.step1.nonHagueDescription', 'Detta land kräver ambassadlegalisering (ej Haagkonventionen).')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Continue Button */}
      {answers.country && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={onNext}
            className="px-4 sm:px-6 py-2 bg-custom-button text-white rounded-md hover:bg-custom-button-hover"
          >
            {t('orderFlow.continueButton', 'Fortsätt')}
          </button>
        </div>
      )}
    </StepContainer>
  );
};

export default Step1CountrySelection;
