/**
 * Hague Convention Country Service
 *
 * Manages the dynamic list of countries that are part of the Hague Apostille
 * Convention. Stored in Firestore so admins can add/remove countries as the
 * convention membership changes — no code deploy needed.
 *
 * Storage: one document per country in `hagueCountries` collection. Soft-delete
 * via `enabled: false` so we keep history.
 *
 * Read path is cached at the client level (see useHagueCountries hook).
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { HAGUE_CONVENTION_COUNTRIES, ALL_COUNTRIES } from '@/components/order/data/countries';

const COLLECTION = 'hagueCountries';

export interface HagueCountry {
  /** ISO 3166-1 alpha-2 country code, also used as the document ID */
  code: string;
  name: string;
  nameEn: string;
  /** When the country joined the Hague Apostille Convention (YYYY-MM-DD) */
  joinedDate?: string;
  /** Internal admin notes */
  notes?: string;
  /** Soft-toggle — set false to hide without losing history */
  enabled: boolean;
  createdAt?: any;
  updatedAt?: any;
  updatedBy?: string;
}

const colRef = () => collection(db, COLLECTION);
const docRef = (code: string) => doc(db, COLLECTION, code.toUpperCase());

/** Get every Hague country document (including disabled) */
export async function getAllHagueCountries(): Promise<HagueCountry[]> {
  try {
    const snap = await getDocs(colRef());
    if (snap.empty) return [];
    return snap.docs.map(d => ({ code: d.id, ...(d.data() as object) } as HagueCountry));
  } catch (err) {
    console.warn('[hagueConventionService] getAllHagueCountries failed', err);
    return [];
  }
}

/**
 * Get just the codes of currently enabled Hague countries.
 * This is the hot path used by the order flow — keep it fast.
 *
 * Falls back to the hardcoded HAGUE_CONVENTION_COUNTRIES list when Firestore
 * is empty or unavailable so the order flow never breaks.
 */
export async function getEnabledHagueCountryCodes(): Promise<string[]> {
  try {
    const snap = await getDocs(colRef());
    if (snap.empty) return [...HAGUE_CONVENTION_COUNTRIES];
    const codes = snap.docs
      .filter(d => (d.data() as HagueCountry).enabled !== false)
      .map(d => d.id.toUpperCase());
    if (codes.length === 0) return [...HAGUE_CONVENTION_COUNTRIES];
    return codes;
  } catch (err) {
    console.warn('[hagueConventionService] getEnabledHagueCountryCodes failed, using fallback', err);
    return [...HAGUE_CONVENTION_COUNTRIES];
  }
}

/** Check if a single country code is currently a Hague member */
export async function isHagueCountry(code: string): Promise<boolean> {
  if (!code) return false;
  try {
    const snap = await getDoc(docRef(code));
    if (snap.exists()) {
      const data = snap.data() as HagueCountry;
      return data.enabled !== false;
    }
    // Fallback to hardcoded list if not yet seeded
    return HAGUE_CONVENTION_COUNTRIES.includes(code.toUpperCase());
  } catch {
    return HAGUE_CONVENTION_COUNTRIES.includes(code.toUpperCase());
  }
}

/** Add a new country to the list (or re-enable a soft-deleted one) */
export async function addHagueCountry(
  country: { code: string; name?: string; nameEn?: string; joinedDate?: string; notes?: string },
  updatedBy: string
): Promise<void> {
  const upperCode = country.code.toUpperCase();
  // Look up canonical names from ALL_COUNTRIES if not provided
  const canonical = ALL_COUNTRIES.find(c => c.code === upperCode);
  const name = country.name || canonical?.name || upperCode;
  const nameEn = country.nameEn || canonical?.nameEn || canonical?.name || upperCode;

  await setDoc(docRef(upperCode), {
    name,
    nameEn,
    enabled: true,
    ...(country.joinedDate ? { joinedDate: country.joinedDate } : {}),
    ...(country.notes ? { notes: country.notes } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy,
  }, { merge: true });
}

/** Update editable fields on an existing entry */
export async function updateHagueCountry(
  code: string,
  updates: { joinedDate?: string; notes?: string; enabled?: boolean; name?: string; nameEn?: string },
  updatedBy: string
): Promise<void> {
  const cleanUpdates: Record<string, any> = {
    updatedAt: serverTimestamp(),
    updatedBy,
  };
  if (updates.joinedDate !== undefined) cleanUpdates.joinedDate = updates.joinedDate;
  if (updates.notes !== undefined) cleanUpdates.notes = updates.notes;
  if (updates.enabled !== undefined) cleanUpdates.enabled = updates.enabled;
  if (updates.name !== undefined) cleanUpdates.name = updates.name;
  if (updates.nameEn !== undefined) cleanUpdates.nameEn = updates.nameEn;
  await updateDoc(docRef(code), cleanUpdates);
}

/** Soft-remove a country (sets enabled: false) */
export async function removeHagueCountry(code: string, updatedBy: string): Promise<void> {
  await updateDoc(docRef(code), {
    enabled: false,
    updatedAt: serverTimestamp(),
    updatedBy,
  });
}

/**
 * Seed Firestore from the hardcoded HAGUE_CONVENTION_COUNTRIES list.
 * Idempotent: existing documents are NOT overwritten — only missing ones added.
 * Used on first visit to the admin page or via a manual "sync defaults" button.
 */
export async function seedHagueCountries(updatedBy: string): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;
  for (const code of HAGUE_CONVENTION_COUNTRIES) {
    const upperCode = code.toUpperCase();
    const existing = await getDoc(docRef(upperCode));
    if (existing.exists()) {
      skipped++;
      continue;
    }
    const canonical = ALL_COUNTRIES.find(c => c.code === upperCode);
    await setDoc(docRef(upperCode), {
      name: canonical?.name || upperCode,
      nameEn: canonical?.nameEn || canonical?.name || upperCode,
      enabled: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy,
    });
    created++;
  }
  return { created, skipped };
}
