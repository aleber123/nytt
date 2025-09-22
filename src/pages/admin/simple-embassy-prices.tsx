import React, { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import {
  getAllActivePricingRules,
  setPricingRule,
  updatePricingRule,
  updateOrCreatePricingRule
} from '@/firebase/pricingService';

interface EmbassyCountry {
  code: string;
  name: string;
  flag: string;
  officialFee: number;
  serviceFee: number;
  totalPrice: number;
  lastUpdated?: Date;
}

function SimpleEmbassyPricesPage() {
  const { t } = useTranslation('common');
  const { currentUser } = useAuth();
  const [countries, setCountries] = useState<EmbassyCountry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [bulkServiceFee, setBulkServiceFee] = useState(1200);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Predefined countries with embassy services (Non-Hague Convention countries with embassies in Stockholm)
  const defaultCountries: EmbassyCountry[] = [
    // Africa
    { code: 'AO', name: 'Angola', flag: '🇦🇴', officialFee: 5000, serviceFee: 150, totalPrice: 5150 },
    { code: 'EG', name: 'Egypten', flag: '🇪🇬', officialFee: 850, serviceFee: 150, totalPrice: 1000 },
    { code: 'MA', name: 'Marocko', flag: '🇲🇦', officialFee: 950, serviceFee: 150, totalPrice: 1100 },
    { code: 'TN', name: 'Tunisien', flag: '🇹🇳', officialFee: 800, serviceFee: 150, totalPrice: 950 },
    { code: 'DZ', name: 'Algeriet', flag: '🇩🇿', officialFee: 1100, serviceFee: 150, totalPrice: 1250 },
    { code: 'ET', name: 'Etiopien', flag: '🇪🇹', officialFee: 1200, serviceFee: 150, totalPrice: 1350 },
    { code: 'KE', name: 'Kenya', flag: '🇰🇪', officialFee: 900, serviceFee: 150, totalPrice: 1050 },
    { code: 'UG', name: 'Uganda', flag: '🇺🇬', officialFee: 950, serviceFee: 150, totalPrice: 1100 },
    { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', officialFee: 1000, serviceFee: 150, totalPrice: 1150 },
    { code: 'ZM', name: 'Zambia', flag: '🇿🇲', officialFee: 1100, serviceFee: 150, totalPrice: 1250 },
    { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', officialFee: 1200, serviceFee: 150, totalPrice: 1350 },
    { code: 'MZ', name: 'Moçambique', flag: '🇲🇿', officialFee: 1300, serviceFee: 150, totalPrice: 1450 },
    { code: 'NA', name: 'Namibia', flag: '🇳🇦', officialFee: 1400, serviceFee: 150, totalPrice: 1550 },
    { code: 'BW', name: 'Botswana', flag: '🇧🇼', officialFee: 1150, serviceFee: 150, totalPrice: 1300 },

    // Middle East
    { code: 'IQ', name: 'Irak', flag: '🇮🇶', officialFee: 1920, serviceFee: 150, totalPrice: 2070 },
    { code: 'IR', name: 'Iran', flag: '🇮🇷', officialFee: 1795, serviceFee: 150, totalPrice: 1945 },
    { code: 'JO', name: 'Jordanien', flag: '🇯🇴', officialFee: 750, serviceFee: 150, totalPrice: 900 },
    { code: 'LB', name: 'Libanon', flag: '🇱🇧', officialFee: 800, serviceFee: 150, totalPrice: 950 },
    { code: 'SY', name: 'Syrien', flag: '🇸🇾', officialFee: 900, serviceFee: 150, totalPrice: 1050 },
    { code: 'TR', name: 'Turkiet', flag: '🇹🇷', officialFee: 1200, serviceFee: 150, totalPrice: 1350 },
    { code: 'IL', name: 'Israel', flag: '🇮🇱', officialFee: 650, serviceFee: 150, totalPrice: 800 },
    { code: 'SA', name: 'Saudiarabien', flag: '🇸🇦', officialFee: 1500, serviceFee: 150, totalPrice: 1650 },
    { code: 'AE', name: 'Förenade Arabemiraten', flag: '🇦🇪', officialFee: 1400, serviceFee: 150, totalPrice: 1550 },
    { code: 'QA', name: 'Qatar', flag: '🇶🇦', officialFee: 1300, serviceFee: 150, totalPrice: 1450 },
    { code: 'KW', name: 'Kuwait', flag: '🇰🇼', officialFee: 1250, serviceFee: 150, totalPrice: 1400 },
    { code: 'BH', name: 'Bahrain', flag: '🇧🇭', officialFee: 1100, serviceFee: 150, totalPrice: 1250 },
    { code: 'OM', name: 'Oman', flag: '🇴🇲', officialFee: 1350, serviceFee: 150, totalPrice: 1500 },
    { code: 'YE', name: 'Jemen', flag: '🇾🇪', officialFee: 1000, serviceFee: 150, totalPrice: 1150 },

    // Asia
    { code: 'TH', name: 'Thailand', flag: '🇹🇭', officialFee: 1395, serviceFee: 150, totalPrice: 1545 },
    { code: 'VN', name: 'Vietnam', flag: '🇻🇳', officialFee: 950, serviceFee: 150, totalPrice: 1100 },
    { code: 'PH', name: 'Filippinerna', flag: '🇵🇭', officialFee: 800, serviceFee: 150, totalPrice: 950 },
    { code: 'ID', name: 'Indonesien', flag: '🇮🇩', officialFee: 700, serviceFee: 150, totalPrice: 850 },
    { code: 'MY', name: 'Malaysia', flag: '🇲🇾', officialFee: 850, serviceFee: 150, totalPrice: 1000 },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬', officialFee: 900, serviceFee: 150, totalPrice: 1050 },
    { code: 'KR', name: 'Sydkorea', flag: '🇰🇷', officialFee: 750, serviceFee: 150, totalPrice: 900 },
    { code: 'CN', name: 'Kina', flag: '🇨🇳', officialFee: 600, serviceFee: 150, totalPrice: 750 },
    { code: 'IN', name: 'Indien', flag: '🇮🇳', officialFee: 550, serviceFee: 150, totalPrice: 700 },
    { code: 'PK', name: 'Pakistan', flag: '🇵🇰', officialFee: 650, serviceFee: 150, totalPrice: 800 },
    { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', officialFee: 600, serviceFee: 150, totalPrice: 750 },
    { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', officialFee: 700, serviceFee: 150, totalPrice: 850 },
    { code: 'NP', name: 'Nepal', flag: '🇳🇵', officialFee: 650, serviceFee: 150, totalPrice: 800 },
    { code: 'AF', name: 'Afghanistan', flag: '🇦🇫', officialFee: 800, serviceFee: 150, totalPrice: 950 },

    // Latin America
    { code: 'CU', name: 'Kuba', flag: '🇨🇺', officialFee: 1200, serviceFee: 150, totalPrice: 1350 },
    { code: 'VE', name: 'Venezuela', flag: '🇻🇪', officialFee: 1100, serviceFee: 150, totalPrice: 1250 },
    { code: 'BO', name: 'Bolivia', flag: '🇧🇴', officialFee: 1000, serviceFee: 150, totalPrice: 1150 },
    { code: 'EC', name: 'Ecuador', flag: '🇪🇨', officialFee: 950, serviceFee: 150, totalPrice: 1100 },
    { code: 'PE', name: 'Peru', flag: '🇵🇪', officialFee: 900, serviceFee: 150, totalPrice: 1050 },
    { code: 'CO', name: 'Colombia', flag: '🇨🇴', officialFee: 850, serviceFee: 150, totalPrice: 1000 },
    { code: 'CL', name: 'Chile', flag: '🇨🇱', officialFee: 800, serviceFee: 150, totalPrice: 950 },
    { code: 'BR', name: 'Brasilien', flag: '🇧🇷', officialFee: 750, serviceFee: 150, totalPrice: 900 },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷', officialFee: 700, serviceFee: 150, totalPrice: 850 },
    { code: 'MX', name: 'Mexiko', flag: '🇲🇽', officialFee: 650, serviceFee: 150, totalPrice: 800 },
    { code: 'GT', name: 'Guatemala', flag: '🇬🇹', officialFee: 950, serviceFee: 150, totalPrice: 1100 },
    { code: 'HN', name: 'Honduras', flag: '🇭🇳', officialFee: 1000, serviceFee: 150, totalPrice: 1150 },
    { code: 'NI', name: 'Nicaragua', flag: '🇳🇮', officialFee: 1050, serviceFee: 150, totalPrice: 1200 },
    { code: 'CR', name: 'Costa Rica', flag: '🇨🇷', officialFee: 900, serviceFee: 150, totalPrice: 1050 },
    { code: 'PA', name: 'Panama', flag: '🇵🇦', officialFee: 850, serviceFee: 150, totalPrice: 1000 },
    { code: 'DO', name: 'Dominikanska Republiken', flag: '🇩🇴', officialFee: 800, serviceFee: 150, totalPrice: 950 },

    // Eastern Europe & Central Asia
    { code: 'RS', name: 'Serbien', flag: '🇷🇸', officialFee: 600, serviceFee: 150, totalPrice: 750 },
    { code: 'BA', name: 'Bosnien och Hercegovina', flag: '🇧🇦', officialFee: 650, serviceFee: 150, totalPrice: 800 },
    { code: 'ME', name: 'Montenegro', flag: '🇲🇪', officialFee: 700, serviceFee: 150, totalPrice: 850 },
    { code: 'MK', name: 'Nordmakedonien', flag: '🇲🇰', officialFee: 750, serviceFee: 150, totalPrice: 900 },
    { code: 'AL', name: 'Albanien', flag: '🇦🇱', officialFee: 550, serviceFee: 150, totalPrice: 700 },
    { code: 'XK', name: 'Kosovo', flag: '🇽🇰', officialFee: 600, serviceFee: 150, totalPrice: 750 },
    { code: 'KZ', name: 'Kazakstan', flag: '🇰🇿', officialFee: 800, serviceFee: 150, totalPrice: 950 },
    { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿', officialFee: 750, serviceFee: 150, totalPrice: 900 },
    { code: 'AZ', name: 'Azerbajdzjan', flag: '🇦🇿', officialFee: 700, serviceFee: 150, totalPrice: 850 },
    { code: 'GE', name: 'Georgien', flag: '🇬🇪', officialFee: 650, serviceFee: 150, totalPrice: 800 },
    { code: 'AM', name: 'Armenien', flag: '🇦🇲', officialFee: 600, serviceFee: 150, totalPrice: 750 },
    { code: 'BY', name: 'Vitryssland', flag: '🇧🇾', officialFee: 550, serviceFee: 150, totalPrice: 700 },
    { code: 'UA', name: 'Ukraina', flag: '🇺🇦', officialFee: 500, serviceFee: 150, totalPrice: 650 },
    { code: 'MD', name: 'Moldavien', flag: '🇲🇩', officialFee: 600, serviceFee: 150, totalPrice: 750 }
  ];

  useEffect(() => {
    loadEmbassyPrices();
  }, []);

  const loadEmbassyPrices = async () => {
    try {
      setLoading(true);
      const allRules = await getAllActivePricingRules();
      const embassyRules = allRules.filter(rule => rule.serviceType === 'embassy');

      // Merge with default countries
      const mergedCountries = defaultCountries.map(defaultCountry => {
        const existingRule = embassyRules.find(rule => rule.countryCode === defaultCountry.code);
        if (existingRule) {
          return {
            ...defaultCountry,
            officialFee: existingRule.officialFee,
            serviceFee: existingRule.serviceFee,
            totalPrice: existingRule.basePrice,
            lastUpdated: existingRule.lastUpdated?.toDate()
          };
        }
        return defaultCountry;
      });

      setCountries(mergedCountries);
    } catch (error) {
      console.error('Error loading embassy prices:', error);
      // Use default countries if Firebase fails
      setCountries(defaultCountries);
      toast.error('Kunde inte ladda priser från Firebase - använder standardpriser');
    } finally {
      setLoading(false);
    }
  };

  // Filter countries based on search term
  const filteredCountries = countries.filter(country => {
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase().trim();
    const nameLower = country.name.toLowerCase();
    const codeLower = country.code.toLowerCase();

    // Search by country name or code
    return nameLower.includes(searchLower) || codeLower.includes(searchLower);
  });

  const updateEmbassyFee = async (countryCode: string, newOfficialFee: number, newServiceFee?: number) => {
    try {
      setSaving(true);

      const country = countries.find(c => c.code === countryCode);
      if (!country) return;

      const serviceFee = newServiceFee !== undefined ? newServiceFee : country.serviceFee;
      const ruleId = `${countryCode}_embassy`;
      const newTotalPrice = newOfficialFee + serviceFee;

      // Use the new updateOrCreatePricingRule function
      await updateOrCreatePricingRule(
        ruleId,
        {
          officialFee: newOfficialFee,
          serviceFee: serviceFee,
          basePrice: newTotalPrice,
          updatedBy: currentUser?.email || 'admin'
        },
        {
          countryCode,
          countryName: country.name,
          serviceType: 'embassy',
          officialFee: newOfficialFee,
          serviceFee: serviceFee,
          basePrice: newTotalPrice,
          processingTime: { standard: 15 },
          currency: 'SEK',
          updatedBy: currentUser?.email || 'admin',
          isActive: true
        }
      );

      // Update local state
      setCountries(prev =>
        prev.map(c =>
          c.code === countryCode
            ? {
                ...c,
                officialFee: newOfficialFee,
                serviceFee: serviceFee,
                totalPrice: newTotalPrice,
                lastUpdated: new Date()
              }
            : c
        )
      );

      toast.success(`${country.name} priser uppdaterade!`);
    } catch (error) {
      console.error('Error updating embassy fee:', error);
      toast.error('Kunde inte uppdatera priset');
    } finally {
      setSaving(false);
    }
  };

  const bulkUpdateServiceFee = async (newServiceFee: number) => {
    try {
      setBulkUpdating(true);
      toast.loading('Uppdaterar serviceavgift för alla länder...', { id: 'bulk-update' });

      // Update all countries in parallel
      const updatePromises = countries.map(async (country) => {
        const ruleId = `${country.code}_embassy`;
        const newTotalPrice = country.officialFee + newServiceFee;

        await updateOrCreatePricingRule(
          ruleId,
          {
            officialFee: country.officialFee,
            serviceFee: newServiceFee,
            basePrice: newTotalPrice,
            updatedBy: currentUser?.email || 'admin'
          },
          {
            countryCode: country.code,
            countryName: country.name,
            serviceType: 'embassy',
            officialFee: country.officialFee,
            serviceFee: newServiceFee,
            basePrice: newTotalPrice,
            processingTime: { standard: 15 },
            currency: 'SEK',
            updatedBy: currentUser?.email || 'admin',
            isActive: true
          }
        );
      });

      await Promise.all(updatePromises);

      // Update local state
      setCountries(prev =>
        prev.map(c => ({
          ...c,
          serviceFee: newServiceFee,
          totalPrice: c.officialFee + newServiceFee,
          lastUpdated: new Date()
        }))
      );

      toast.success(`Serviceavgift uppdaterad till ${newServiceFee} kr för alla ${countries.length} länder!`, { id: 'bulk-update' });
    } catch (error) {
      console.error('Error bulk updating service fee:', error);
      toast.error('Kunde inte uppdatera serviceavgifter', { id: 'bulk-update' });
    } finally {
      setBulkUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <Head>
        <title>Ambassadpriser - Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🏛️ Ambassadpriser per land
            </h1>
            <p className="text-gray-600">
              Uppdatera officiella ambassadavgifter. Alla ändringar sparas automatiskt.
            </p>
          </div>

          {/* Search Box */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">🔍 Sök efter land</h3>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Rensa sökning
                </button>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Sök efter landnamn eller landskod (t.ex. 'Sverige' eller 'SE')..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                />
              </div>
              <div className="text-sm text-gray-500 whitespace-nowrap">
                {filteredCountries.length} av {countries.length} länder
              </div>
            </div>
            {searchTerm && (
              <div className="mt-3 text-sm text-gray-600">
                Söker efter: <strong>"{searchTerm}"</strong>
              </div>
            )}
          </div>

          {/* Bulk Update Service Fee */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-2xl mr-3">🔄</div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800 mb-1">
                    Massuppdatering av Serviceavgift
                  </h3>
                  <p className="text-sm text-green-700">
                    Uppdatera serviceavgiften för alla länder på en gång
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-4">
              <div className="flex items-center">
                <label className="text-sm font-medium text-green-800 mr-3">
                  Ny serviceavgift:
                </label>
                <input
                  type="number"
                  value={bulkServiceFee}
                  onChange={(e) => setBulkServiceFee(parseInt(e.target.value) || 0)}
                  className="w-24 px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm font-medium"
                  disabled={bulkUpdating}
                />
                <span className="text-sm text-green-700 ml-2">kr</span>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('Är du säker på att du vill uppdatera serviceavgiften för alla länder?')) {
                    bulkUpdateServiceFee(bulkServiceFee);
                  }
                }}
                disabled={bulkUpdating}
                className={`px-4 py-2 rounded-md font-medium text-white ${
                  bulkUpdating
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500'
                }`}
              >
                {bulkUpdating ? 'Uppdaterar...' : 'Uppdatera alla länder'}
              </button>
            </div>
            <div className="mt-3 text-xs text-green-600">
              ⚠️ Detta kommer att uppdatera serviceavgiften för alla {countries.length} länder
            </div>
          </div>


          {/* Countries Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCountries.map((country) => (
              <div key={country.code} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* Country Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{country.flag}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{country.name}</h3>
                      <p className="text-sm text-gray-500">{country.code}</p>
                    </div>
                  </div>
                  {country.lastUpdated && (
                    <span className="text-xs text-gray-400">
                      Uppdaterad {country.lastUpdated.toLocaleDateString('sv-SE')}
                    </span>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3">
                  {/* Official Fee - Editable */}
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-600 flex-shrink-0 w-32">Ambassadavgift:</span>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={country.officialFee}
                        onChange={(e) => {
                          const newValue = parseInt(e.target.value) || 0;
                          setCountries(prev =>
                            prev.map(c =>
                              c.code === country.code
                                ? { ...c, officialFee: newValue, totalPrice: newValue + c.serviceFee }
                                : c
                            )
                          );
                        }}
                        onFocus={(e) => {
                          // Select all text when focused for better UX
                          e.target.select();
                        }}
                        onBlur={(e) => updateEmbassyFee(country.code, parseInt((e.target as HTMLInputElement).value) || 0)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            updateEmbassyFee(country.code, parseInt((e.target as HTMLInputElement).value) || 0);
                          }
                        }}
                        className="w-24 px-3 py-2 text-right border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                        disabled={saving}
                      />
                      <span className="text-sm text-gray-500 ml-2">kr</span>
                    </div>
                  </div>

                  {/* Service Fee - Editable */}
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-600 flex-shrink-0 w-32">Serviceavgift:</span>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={country.serviceFee}
                        onChange={(e) => {
                          const newServiceFee = parseInt(e.target.value) || 0;
                          setCountries(prev =>
                            prev.map(c =>
                              c.code === country.code
                                ? { ...c, serviceFee: newServiceFee, totalPrice: c.officialFee + newServiceFee }
                                : c
                            )
                          );
                        }}
                        onFocus={(e) => {
                          // Select all text when focused for better UX
                          e.target.select();
                        }}
                        onBlur={(e) => updateEmbassyFee(country.code, country.officialFee, parseInt((e.target as HTMLInputElement).value) || 0)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            updateEmbassyFee(country.code, country.officialFee, parseInt((e.target as HTMLInputElement).value) || 0);
                          }
                        }}
                        className="w-24 px-3 py-2 text-right border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                        disabled={saving}
                      />
                      <span className="text-sm text-gray-500 ml-2">kr</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200"></div>

                  {/* Total Price */}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900">Totalpris:</span>
                    <span className="text-xl font-bold text-green-600">{country.totalPrice} kr</span>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-xs text-gray-500">
                      {saving ? 'Sparar...' : 'Redo att uppdatera'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Sammanfattning</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{countries.length}</div>
                <div className="text-sm text-gray-600">Länder</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {countries.reduce((sum, c) => sum + c.totalPrice, 0).toLocaleString('sv-SE')}
                </div>
                <div className="text-sm text-gray-600">kr totalt (medel)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(countries.reduce((sum, c) => sum + c.totalPrice, 0) / countries.length).toLocaleString('sv-SE')}
                </div>
                <div className="text-sm text-gray-600">kr genomsnitt</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'sv', ['common'])),
    },
  };
};

export default SimpleEmbassyPricesPage;