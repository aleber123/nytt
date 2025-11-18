/**
 * React Query hook for return services data
 * Provides caching for return shipping options
 */

import { useQuery } from '@tanstack/react-query';

interface ReturnService {
  id: string;
  name: string;
  price: string;
  description: string;
}

// Mock data - replace with actual API call
const fetchReturnServices = async (): Promise<ReturnService[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return [
    {
      id: 'standard',
      name: 'Standard',
      price: '150 kr',
      description: 'Leverans inom 5-7 arbetsdagar'
    },
    {
      id: 'express',
      name: 'Express',
      price: '300 kr',
      description: 'Leverans inom 2-3 arbetsdagar'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '500 kr',
      description: 'Leverans nästa arbetsdag'
    }
  ];
};

export const useReturnServices = () => {
  return useQuery({
    queryKey: ['returnServices'],
    queryFn: fetchReturnServices,
    staleTime: 15 * 60 * 1000, // 15 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
};
