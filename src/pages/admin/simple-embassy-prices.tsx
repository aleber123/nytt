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
import CountryFlag from '@/components/ui/CountryFlag';
import { ALL_COUNTRIES } from '@/components/order/data/countries';

// Get English country name by country code
const getEnglishCountryName = (countryCode: string): string => {
  const country = ALL_COUNTRIES.find(c => c.code === countryCode);
  return country?.nameEn || countryCode;
};

interface EmbassyCountry {
  code: string;
  name: string;
  flag: string;
  officialFee: number;
  serviceFee: number;
  totalPrice: number;
  lastUpdated?: Date;
  priceUnconfirmed?: boolean; // When true, show "Price on request" to customer
}

type SortField = 'name' | 'officialFee' | 'serviceFee' | 'totalPrice' | 'status' | 'lastUpdated';
type SortDirection = 'asc' | 'desc';
type StatusFilter = 'all' | 'confirmed' | 'unconfirmed';

function SimpleEmbassyPricesPage() {
  const { t } = useTranslation('common');
  const { currentUser } = useAuth();
  const [countries, setCountries] = useState<EmbassyCountry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [bulkServiceFee, setBulkServiceFee] = useState(1200);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  
  // Selection state
  const [selectedCountryCodes, setSelectedCountryCodes] = useState<Set<string>>(new Set());
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  
  // Bulk edit for selected
  const [bulkOfficialFee, setBulkOfficialFee] = useState<number>(0);
  const [bulkSelectedServiceFee, setBulkSelectedServiceFee] = useState<number>(1200);

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

      // Load ALL countries from Firebase (not just hardcoded ones)
      const allCountriesFromFirebase: EmbassyCountry[] = embassyRules.map(rule => {
        const countryData = ALL_COUNTRIES.find(c => c.code === rule.countryCode);
        return {
          code: rule.countryCode,
          name: countryData?.name || rule.countryName || rule.countryCode,
          flag: countryData?.flag || '🏳️',
          officialFee: rule.officialFee,
          serviceFee: rule.serviceFee,
          totalPrice: rule.basePrice,
          lastUpdated: rule.lastUpdated?.toDate(),
          priceUnconfirmed: rule.priceUnconfirmed || false
        };
      });

      // Sort by English name
      allCountriesFromFirebase.sort((a, b) => 
        getEnglishCountryName(a.code).localeCompare(getEnglishCountryName(b.code))
      );

      setCountries(allCountriesFromFirebase);
    } catch (error) {
      // Use default countries if Firebase fails
      setCountries(defaultCountries);
      toast.error('Could not load prices from Firebase - using default prices');
    } finally {
      setLoading(false);
    }
  };

  // Filter countries based on search term and status
  const filteredCountries = countries
    .filter(country => {
      // Status filter
      if (statusFilter === 'confirmed' && country.priceUnconfirmed) return false;
      if (statusFilter === 'unconfirmed' && !country.priceUnconfirmed) return false;
      
      // Search filter
      if (!searchTerm.trim()) return true;
      const searchLower = searchTerm.toLowerCase().trim();
      const englishName = getEnglishCountryName(country.code).toLowerCase();
      const codeLower = country.code.toLowerCase();
      return englishName.includes(searchLower) || codeLower.includes(searchLower);
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = getEnglishCountryName(a.code).localeCompare(getEnglishCountryName(b.code));
          break;
        case 'officialFee':
          comparison = a.officialFee - b.officialFee;
          break;
        case 'serviceFee':
          comparison = a.serviceFee - b.serviceFee;
          break;
        case 'totalPrice':
          comparison = a.totalPrice - b.totalPrice;
          break;
        case 'status':
          comparison = (a.priceUnconfirmed ? 1 : 0) - (b.priceUnconfirmed ? 1 : 0);
          break;
        case 'lastUpdated':
          const aTime = a.lastUpdated?.getTime() || 0;
          const bTime = b.lastUpdated?.getTime() || 0;
          comparison = aTime - bTime;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  // Selection helpers
  const isAllSelected = filteredCountries.length > 0 && filteredCountries.every(c => selectedCountryCodes.has(c.code));
  const selectedCount = selectedCountryCodes.size;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCountryCodes(new Set());
    } else {
      setSelectedCountryCodes(new Set(filteredCountries.map(c => c.code)));
    }
  };

  const toggleSelectCountry = (code: string) => {
    const newSet = new Set(selectedCountryCodes);
    if (newSet.has(code)) {
      newSet.delete(code);
    } else {
      newSet.add(code);
    }
    setSelectedCountryCodes(newSet);
  };

  const clearSelection = () => {
    setSelectedCountryCodes(new Set());
  };

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Bulk update selected countries
  const bulkUpdateSelected = async (updates: { officialFee?: number; serviceFee?: number; priceUnconfirmed?: boolean }) => {
    if (selectedCountryCodes.size === 0) return;
    
    setBulkUpdating(true);
    try {
      const updatePromises = Array.from(selectedCountryCodes).map(async (code) => {
        const country = countries.find(c => c.code === code);
        if (!country) return;

        const newOfficialFee = updates.officialFee !== undefined ? updates.officialFee : country.officialFee;
        const newServiceFee = updates.serviceFee !== undefined ? updates.serviceFee : country.serviceFee;
        const ruleId = `${code}_embassy`;

        await updateOrCreatePricingRule(
          ruleId,
          {
            officialFee: newOfficialFee,
            serviceFee: newServiceFee,
            basePrice: newOfficialFee + newServiceFee,
            ...(updates.priceUnconfirmed !== undefined && { priceUnconfirmed: updates.priceUnconfirmed }),
            updatedBy: currentUser?.email || 'admin'
          },
          {
            countryCode: code,
            countryName: country.name,
            serviceType: 'embassy',
            officialFee: newOfficialFee,
            serviceFee: newServiceFee,
            basePrice: newOfficialFee + newServiceFee,
            processingTime: { standard: 15 },
            currency: 'SEK',
            updatedBy: currentUser?.email || 'admin',
            isActive: true,
            priceUnconfirmed: updates.priceUnconfirmed !== undefined ? updates.priceUnconfirmed : country.priceUnconfirmed
          }
        );
      });

      await Promise.all(updatePromises);

      // Update local state
      setCountries(prev =>
        prev.map(c => {
          if (!selectedCountryCodes.has(c.code)) return c;
          return {
            ...c,
            officialFee: updates.officialFee !== undefined ? updates.officialFee : c.officialFee,
            serviceFee: updates.serviceFee !== undefined ? updates.serviceFee : c.serviceFee,
            totalPrice: (updates.officialFee !== undefined ? updates.officialFee : c.officialFee) + 
                       (updates.serviceFee !== undefined ? updates.serviceFee : c.serviceFee),
            priceUnconfirmed: updates.priceUnconfirmed !== undefined ? updates.priceUnconfirmed : c.priceUnconfirmed,
            lastUpdated: new Date()
          };
        })
      );

      toast.success(`Updated ${selectedCountryCodes.size} countries`);
      clearSelection();
    } catch (error) {
      toast.error('Could not update selected countries');
    } finally {
      setBulkUpdating(false);
    }
  };

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

      toast.success(`${country.name} prices updated!`);
    } catch (error) {
      toast.error('Could not update price');
    } finally {
      setSaving(false);
    }
  };

  const togglePriceUnconfirmed = async (countryCode: string, unconfirmed: boolean) => {
    try {
      setSaving(true);

      const country = countries.find(c => c.code === countryCode);
      if (!country) return;

      const ruleId = `${countryCode}_embassy`;

      // Use the new updateOrCreatePricingRule function
      await updateOrCreatePricingRule(
        ruleId,
        {
          priceUnconfirmed: unconfirmed,
          updatedBy: currentUser?.email || 'admin'
        },
        {
          countryCode,
          countryName: country.name,
          serviceType: 'embassy',
          officialFee: country.officialFee,
          serviceFee: country.serviceFee,
          basePrice: country.totalPrice,
          processingTime: { standard: 15 },
          currency: 'SEK',
          updatedBy: currentUser?.email || 'admin',
          isActive: true,
          priceUnconfirmed: unconfirmed
        }
      );

      // Update local state
      setCountries(prev =>
        prev.map(c =>
          c.code === countryCode
            ? {
                ...c,
                priceUnconfirmed: unconfirmed,
                lastUpdated: new Date()
              }
            : c
        )
      );

      toast.success(`${country.name}: Price ${unconfirmed ? 'marked as unconfirmed' : 'confirmed'}!`);
    } catch (error) {
      toast.error('Could not update status');
    } finally {
      setSaving(false);
    }
  };

  const bulkUpdateServiceFee = async (newServiceFee: number) => {
    try {
      setBulkUpdating(true);
      toast.loading('Updating service fee for all countries...', { id: 'bulk-update' });

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

      toast.success(`Service fee updated to ${newServiceFee} SEK for all ${countries.length} countries!`, { id: 'bulk-update' });
    } catch (error) {
      toast.error('Could not update service fees', { id: 'bulk-update' });
    } finally {
      setBulkUpdating(false);
    }
  };

  // Bulk confirm/unconfirm all prices
  const bulkConfirmPrices = async (confirm: boolean) => {
    try {
      setBulkUpdating(true);
      const action = confirm ? 'Confirming' : 'Unconfirming';
      toast.loading(`${action} prices for all countries...`, { id: 'bulk-confirm' });

      // Update all countries in parallel
      const updatePromises = countries.map(async (country) => {
        const ruleId = `${country.code}_embassy`;

        await updateOrCreatePricingRule(
          ruleId,
          {
            priceUnconfirmed: !confirm,
            updatedBy: currentUser?.email || 'admin'
          },
          {
            countryCode: country.code,
            countryName: country.name,
            serviceType: 'embassy',
            officialFee: country.officialFee,
            serviceFee: country.serviceFee,
            basePrice: country.totalPrice,
            processingTime: { standard: 15 },
            currency: 'SEK',
            updatedBy: currentUser?.email || 'admin',
            isActive: true,
            priceUnconfirmed: !confirm
          }
        );
      });

      await Promise.all(updatePromises);

      // Update local state
      setCountries(prev =>
        prev.map(c => ({
          ...c,
          priceUnconfirmed: !confirm,
          lastUpdated: new Date()
        }))
      );

      const actionDone = confirm ? 'confirmed' : 'marked as unconfirmed';
      toast.success(`All ${countries.length} countries ${actionDone}!`, { id: 'bulk-confirm' });
    } catch (error) {
      toast.error('Could not update price status', { id: 'bulk-confirm' });
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
        <title>Embassy Prices - Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">🏛️ Embassy Prices</h1>
          </div>

          {/* Summary Stats - Like Orders page */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total countries</p>
                  <p className="text-2xl font-bold text-gray-900">{countries.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Confirmed</p>
                  <p className="text-2xl font-bold text-gray-900">{countries.filter(c => !c.priceUnconfirmed).length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Unconfirmed</p>
                  <p className="text-2xl font-bold text-gray-900">{countries.filter(c => c.priceUnconfirmed).length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avg. price</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(countries.reduce((sum, c) => sum + c.totalPrice, 0) / countries.length || 0)} kr</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar - Like Orders page */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col gap-4">
              {/* Search Row */}
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by country name or code..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <button
                  onClick={() => loadEmbassyPrices()}
                  className="px-4 py-2 text-primary-600 hover:text-primary-800 font-medium"
                >
                  Refresh
                </button>
              </div>
              
              {/* Quick Filters Row */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-600 mr-2">Quick filters:</span>
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                    statusFilter === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All ({countries.length})
                </button>
                <button
                  onClick={() => setStatusFilter('confirmed')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                    statusFilter === 'confirmed'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ✓ Confirmed ({countries.filter(c => !c.priceUnconfirmed).length})
                </button>
                <button
                  onClick={() => setStatusFilter('unconfirmed')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                    statusFilter === 'unconfirmed'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ⚠ Unconfirmed ({countries.filter(c => c.priceUnconfirmed).length})
                </button>
                
                {/* Show count */}
                <span className="ml-auto text-sm text-gray-500">
                  Showing {filteredCountries.length} countries
                </span>
              </div>
            </div>
          </div>

          {/* Bulk Actions Bar - Shows when items are selected */}
          {selectedCount > 0 && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-primary-800">
                    {selectedCount} {selectedCount === 1 ? 'country' : 'countries'} selected
                  </span>
                  <button
                    onClick={clearSelection}
                    className="text-sm text-primary-600 hover:text-primary-800 underline"
                  >
                    Clear
                  </button>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  {/* Set Official Fee */}
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={bulkOfficialFee}
                      onChange={(e) => setBulkOfficialFee(parseInt(e.target.value) || 0)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="0"
                    />
                    <button
                      onClick={() => bulkUpdateSelected({ officialFee: bulkOfficialFee })}
                      disabled={bulkUpdating}
                      className="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 disabled:opacity-50"
                    >
                      Set Official Fee
                    </button>
                  </div>
                  
                  {/* Set Service Fee */}
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={bulkSelectedServiceFee}
                      onChange={(e) => setBulkSelectedServiceFee(parseInt(e.target.value) || 0)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="1200"
                    />
                    <button
                      onClick={() => bulkUpdateSelected({ serviceFee: bulkSelectedServiceFee })}
                      disabled={bulkUpdating}
                      className="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 disabled:opacity-50"
                    >
                      Set Service Fee
                    </button>
                  </div>
                  
                  {/* Confirm/Unconfirm */}
                  <button
                    onClick={() => bulkUpdateSelected({ priceUnconfirmed: false })}
                    disabled={bulkUpdating}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    ✓ Confirm
                  </button>
                  <button
                    onClick={() => bulkUpdateSelected({ priceUnconfirmed: true })}
                    disabled={bulkUpdating}
                    className="px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 disabled:opacity-50"
                  >
                    ⚠ Unconfirm
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Countries Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Embassy Prices</h2>
              <p className="text-sm text-gray-600 mt-1">
                {filteredCountries.length} of {countries.length} countries
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        Country
                        {sortField === 'name' && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('officialFee')}
                    >
                      <div className="flex items-center gap-1">
                        Official fee
                        {sortField === 'officialFee' && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('serviceFee')}
                    >
                      <div className="flex items-center gap-1">
                        Service fee
                        {sortField === 'serviceFee' && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('totalPrice')}
                    >
                      <div className="flex items-center gap-1">
                        Total price
                        {sortField === 'totalPrice' && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        Status
                        {sortField === 'status' && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('lastUpdated')}
                    >
                      <div className="flex items-center gap-1">
                        Last updated
                        {sortField === 'lastUpdated' && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCountries.map((country) => (
                    <tr 
                      key={country.code} 
                      className={`${country.priceUnconfirmed ? 'bg-orange-50' : ''} ${selectedCountryCodes.has(country.code) ? 'bg-primary-50' : ''}`}
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedCountryCodes.has(country.code)}
                          onChange={() => toggleSelectCountry(country.code)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="mr-3"><CountryFlag code={country.code} size={24} /></span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {getEnglishCountryName(country.code)}
                            </div>
                            <div className="text-sm text-gray-500">{country.code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                          onBlur={(e) => updateEmbassyFee(country.code, parseInt(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          disabled={saving}
                        />
                        <span className="text-sm text-gray-500 ml-1">kr</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                          onBlur={(e) => updateEmbassyFee(country.code, country.officialFee, parseInt(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          disabled={saving}
                        />
                        <span className="text-sm text-gray-500 ml-1">kr</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {country.priceUnconfirmed ? (
                          <span className="text-lg font-semibold text-orange-500">TBC</span>
                        ) : (
                          <span className="text-lg font-semibold text-green-600">{country.totalPrice} kr</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={country.priceUnconfirmed || false}
                            onChange={(e) => togglePriceUnconfirmed(country.code, e.target.checked)}
                            className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                            disabled={saving}
                          />
                          <span className={`ml-2 text-xs ${country.priceUnconfirmed ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
                            {country.priceUnconfirmed ? 'Unconfirmed' : 'Confirmed'}
                          </span>
                        </label>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {country.lastUpdated ? country.lastUpdated.toLocaleDateString('en-GB') : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  // Admin pages always use English
  const i18nConfig = {
    i18n: { defaultLocale: 'sv', locales: ['sv', 'en'], localeDetection: false as const },
  };
  return {
    props: {
      ...(await serverSideTranslations('en', ['common'], i18nConfig)),
    },
  };
};

export default SimpleEmbassyPricesPage;