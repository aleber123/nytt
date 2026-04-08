/**
 * useHagueCountries — client hook that loads the dynamic Hague country list
 * once per browser session and exposes a fast lookup helper.
 *
 * Uses HAGUE_CONVENTION_COUNTRIES as a synchronous fallback so the order flow
 * always has data immediately, even before Firestore responds.
 */

import { useEffect, useState, useCallback } from 'react';
import { getEnabledHagueCountryCodes } from '@/firebase/hagueConventionService';
import { HAGUE_CONVENTION_COUNTRIES } from '@/components/order/data/countries';

// Module-level cache so the same browser session shares results across components
let cachedCodes: Set<string> | null = null;
let cachePromise: Promise<Set<string>> | null = null;

async function loadCodes(): Promise<Set<string>> {
  if (cachedCodes) return cachedCodes;
  if (cachePromise) return cachePromise;
  cachePromise = getEnabledHagueCountryCodes()
    .then(codes => {
      const set = new Set(codes.map(c => c.toUpperCase()));
      cachedCodes = set;
      return set;
    })
    .catch(() => {
      const set = new Set(HAGUE_CONVENTION_COUNTRIES.map(c => c.toUpperCase()));
      cachedCodes = set;
      return set;
    });
  return cachePromise;
}

/** Reset the cache — call this from the admin page after a save */
export function invalidateHagueCache() {
  cachedCodes = null;
  cachePromise = null;
}

export function useHagueCountries() {
  // Initialise with the hardcoded fallback so the first render is non-empty
  const [codes, setCodes] = useState<Set<string>>(
    () => cachedCodes || new Set(HAGUE_CONVENTION_COUNTRIES.map(c => c.toUpperCase()))
  );

  useEffect(() => {
    let mounted = true;
    loadCodes().then(loaded => {
      if (mounted) setCodes(loaded);
    });
    return () => { mounted = false; };
  }, []);

  const isHague = useCallback(
    (code: string) => !!code && codes.has(code.toUpperCase()),
    [codes]
  );

  return { codes, isHague };
}
