/**
 * React Query hook for pricing data
 * Provides caching and automatic refetching
 */

import { useQuery } from '@tanstack/react-query';
import { getCountryPricingRules } from '@/firebase/pricingService';

export const usePricing = (country: string) => {
  return useQuery({
    queryKey: ['pricing', country],
    queryFn: () => getCountryPricingRules(country),
    enabled: !!country, // Only fetch if country is selected
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes (formerly cacheTime)
    retry: 2, // Retry failed requests twice
  });
};

export const useAllPricingRules = () => {
  return useQuery({
    queryKey: ['pricing', 'all'],
    queryFn: async () => {
      // Import dynamically to avoid circular dependencies
      const { getAllActivePricingRules } = await import('@/firebase/pricingService');
      return getAllActivePricingRules();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  });
};
