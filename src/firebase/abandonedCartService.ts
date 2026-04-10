/**
 * Abandoned Cart Service
 *
 * Tracks partially completed orders (legalization + visa) in Firestore.
 * When a customer starts filling in the order form but doesn't submit,
 * their progress is saved so admin can follow up as a lead.
 *
 * Collection: `abandonedCarts`
 * Lifecycle: active → abandoned (30 min inactivity) → converted | dismissed
 * Auto-cleanup: docs older than 30 days are eligible for deletion.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';

const COLLECTION = 'abandonedCarts';

export type AbandonedCartStatus = 'active' | 'abandoned' | 'converted' | 'dismissed';

export interface AbandonedCart {
  id: string;
  /** Unique session identifier (generated once per browser session) */
  sessionId: string;
  /** 'legalization' or 'visa' */
  orderType: 'legalization' | 'visa';
  /** Current/last step the customer reached (1-based) */
  currentStep: number;
  /** Total steps in the flow */
  totalSteps: number;

  // ── Extracted key fields (denormalized for admin list view) ──
  /** Destination country code */
  country?: string;
  countryName?: string;
  /** Selected services (legalization) */
  services?: string[];
  /** Visa product name */
  visaProductName?: string;
  /** Destination country (visa) */
  destinationCountry?: string;
  /** Customer email — only available if they reached the customer info step */
  email?: string;
  /** Customer name */
  customerName?: string;
  /** Customer phone */
  phone?: string;

  // ── Full answers snapshot ──
  /** Complete answers object (everything the customer filled in) */
  answers: Record<string, any>;

  // ── Metadata ──
  status: AbandonedCartStatus;
  /** Browser user-agent for bot filtering */
  userAgent?: string;
  /** Page URL */
  pageUrl?: string;
  /** Locale */
  locale?: string;

  firstSeenAt: any; // Timestamp
  lastActivityAt: any; // Timestamp
  /** Set when status transitions to 'abandoned' */
  abandonedAt?: any;
  /** Set when status transitions to 'converted' (order was placed) */
  convertedAt?: any;
  convertedOrderId?: string;
  /** Set when admin dismisses */
  dismissedAt?: any;
  dismissedBy?: string;

  /** If a recovery email was sent */
  recoveryEmailSentAt?: any;
  recoveryEmailSentBy?: string;
}

// ── WRITE OPERATIONS (called from the order flow) ──

/**
 * Create or update an abandoned cart entry.
 * Called on every step change in the order flow.
 * Uses sessionId as the document ID for idempotent upserts.
 */
export async function upsertAbandonedCart(data: {
  sessionId: string;
  orderType: 'legalization' | 'visa';
  currentStep: number;
  totalSteps: number;
  answers: Record<string, any>;
  locale?: string;
}): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, COLLECTION, data.sessionId);
    const existing = await getDoc(docRef);

    // Extract key fields from answers for quick admin viewing
    const a = data.answers || {};
    const email = a.billingInfo?.email || a.returnAddress?.email || a.customerInfo?.email || '';
    const customerName = [
      a.billingInfo?.firstName || a.returnAddress?.firstName || a.customerInfo?.firstName || '',
      a.billingInfo?.lastName || a.returnAddress?.lastName || a.customerInfo?.lastName || ''
    ].filter(Boolean).join(' ');
    const phone = a.billingInfo?.phone || a.returnAddress?.phone || a.customerInfo?.phone || '';

    // Visa-specific
    const destinationCountry = a.destinationCountry || '';
    const visaProductName = a.selectedVisaProduct?.name || '';

    // Legalization-specific
    const country = a.country || '';
    const services = Array.isArray(a.services) ? a.services : [];

    const payload: Record<string, any> = {
      sessionId: data.sessionId,
      orderType: data.orderType,
      currentStep: data.currentStep,
      totalSteps: data.totalSteps,
      country,
      countryName: destinationCountry || country,
      services,
      visaProductName,
      destinationCountry,
      email,
      customerName,
      phone,
      answers: data.answers,
      locale: data.locale || 'sv',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      pageUrl: typeof window !== 'undefined' ? window.location.href : '',
      lastActivityAt: serverTimestamp(),
    };

    if (!existing.exists()) {
      // New entry
      payload.status = 'active';
      payload.firstSeenAt = serverTimestamp();
      await setDoc(docRef, payload);
    } else {
      // Update existing — don't overwrite status if already converted/dismissed
      const existingData = existing.data() as AbandonedCart;
      if (existingData.status === 'converted' || existingData.status === 'dismissed') {
        return; // Don't update completed/dismissed carts
      }
      payload.status = 'active'; // Reset to active on new activity
      await updateDoc(docRef, payload);
    }
  } catch (err) {
    // Non-blocking — don't break the order flow
    // eslint-disable-next-line no-console
    console.warn('[abandonedCartService] upsertAbandonedCart failed', err);
  }
}

/**
 * Mark a cart as converted (order was successfully placed).
 * Called from the submit handler after order creation.
 */
export async function markCartConverted(sessionId: string, orderId: string): Promise<void> {
  if (!db || !sessionId) return;
  try {
    const docRef = doc(db, COLLECTION, sessionId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      await updateDoc(docRef, {
        status: 'converted',
        convertedAt: serverTimestamp(),
        convertedOrderId: orderId,
      });
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[abandonedCartService] markCartConverted failed', err);
  }
}

// ── READ OPERATIONS (called from admin) ──

/**
 * Get all abandoned carts for the admin leads view.
 * Returns the most recent 200, sorted by lastActivityAt desc.
 */
export async function getAllAbandonedCarts(opts?: {
  status?: AbandonedCartStatus;
  hasEmail?: boolean;
  orderType?: 'legalization' | 'visa';
  maxResults?: number;
}): Promise<AbandonedCart[]> {
  if (!db) return [];
  try {
    let q;
    if (opts?.status) {
      q = query(
        collection(db, COLLECTION),
        where('status', '==', opts.status),
        limit(opts?.maxResults || 200)
      );
    } else {
      q = query(
        collection(db, COLLECTION),
        limit(opts?.maxResults || 200)
      );
    }
    const snap = await getDocs(q);
    let results = snap.docs.map(d => ({ id: d.id, ...(d.data() as object) } as AbandonedCart));

    // Client-side filters (Firestore doesn't support multiple inequality filters)
    if (opts?.hasEmail) {
      results = results.filter(c => !!c.email);
    }
    if (opts?.orderType) {
      results = results.filter(c => c.orderType === opts.orderType);
    }

    // Sort by lastActivityAt desc
    results.sort((a, b) => {
      const aTime = a.lastActivityAt?.toMillis ? a.lastActivityAt.toMillis() : 0;
      const bTime = b.lastActivityAt?.toMillis ? b.lastActivityAt.toMillis() : 0;
      return bTime - aTime;
    });

    return results;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[abandonedCartService] getAllAbandonedCarts failed', err);
    return [];
  }
}

/**
 * Get a single abandoned cart by ID.
 */
export async function getAbandonedCart(id: string): Promise<AbandonedCart | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as object) } as AbandonedCart;
  } catch {
    return null;
  }
}

// ── ADMIN ACTIONS ──

/**
 * Dismiss a cart (admin doesn't want to follow up).
 */
export async function dismissAbandonedCart(id: string, dismissedBy: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, COLLECTION, id), {
    status: 'dismissed',
    dismissedAt: serverTimestamp(),
    dismissedBy,
  });
}

/**
 * Mark that a recovery email was sent.
 */
export async function markRecoveryEmailSent(id: string, sentBy: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, COLLECTION, id), {
    recoveryEmailSentAt: serverTimestamp(),
    recoveryEmailSentBy: sentBy,
  });
}

/**
 * Bulk mark old active carts as abandoned (no activity for >30 min).
 * Called by admin page on load or by a future Cloud Function.
 */
export async function markStaleCartsAbandoned(): Promise<number> {
  if (!db) return 0;
  try {
    const thirtyMinAgo = Timestamp.fromDate(new Date(Date.now() - 30 * 60 * 1000));
    const q = query(
      collection(db, COLLECTION),
      where('status', '==', 'active'),
      where('lastActivityAt', '<=', thirtyMinAgo),
      limit(100)
    );
    const snap = await getDocs(q);
    let count = 0;
    for (const d of snap.docs) {
      await updateDoc(d.ref, {
        status: 'abandoned',
        abandonedAt: serverTimestamp(),
      });
      count++;
    }
    return count;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[abandonedCartService] markStaleCartsAbandoned failed', err);
    return 0;
  }
}

/**
 * Delete carts older than 30 days (GDPR cleanup).
 */
export async function deleteOldCarts(): Promise<number> {
  if (!db) return 0;
  try {
    const thirtyDaysAgo = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const q = query(
      collection(db, COLLECTION),
      where('firstSeenAt', '<=', thirtyDaysAgo),
      limit(200)
    );
    const snap = await getDocs(q);
    let count = 0;
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
      count++;
    }
    return count;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[abandonedCartService] deleteOldCarts failed', err);
    return 0;
  }
}
