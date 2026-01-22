/**
 * Hook for saving and retrieving customer information from localStorage
 * Allows customers to have their address pre-filled on future orders
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'doxvl_saved_customer_info';

export interface SavedCustomerInfo {
  firstName: string;
  lastName: string;
  companyName?: string;
  street: string;
  addressLine2?: string;
  postalCode: string;
  city: string;
  countryCode: string;
  email: string;
  phone: string;
  savedAt: number;
}

interface UseSavedCustomerInfoReturn {
  savedInfo: SavedCustomerInfo | null;
  saveCustomerInfo: (info: Omit<SavedCustomerInfo, 'savedAt'>) => void;
  clearSavedInfo: () => void;
  hasSavedInfo: boolean;
}

export function useSavedCustomerInfo(): UseSavedCustomerInfoReturn {
  const [savedInfo, setSavedInfo] = useState<SavedCustomerInfo | null>(null);

  // Load saved info on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SavedCustomerInfo;
        // Check if saved info is less than 1 year old
        const oneYearMs = 365 * 24 * 60 * 60 * 1000;
        if (Date.now() - parsed.savedAt < oneYearMs) {
          setSavedInfo(parsed);
        } else {
          // Clear expired data
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      // Ignore errors (e.g., localStorage not available)
    }
  }, []);

  const saveCustomerInfo = useCallback((info: Omit<SavedCustomerInfo, 'savedAt'>) => {
    try {
      const dataToSave: SavedCustomerInfo = {
        ...info,
        savedAt: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      setSavedInfo(dataToSave);
    } catch (error) {
      // Ignore errors
    }
  }, []);

  const clearSavedInfo = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setSavedInfo(null);
    } catch (error) {
      // Ignore errors
    }
  }, []);

  return {
    savedInfo,
    saveCustomerInfo,
    clearSavedInfo,
    hasSavedInfo: savedInfo !== null
  };
}

export default useSavedCustomerInfo;
