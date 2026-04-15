/**
 * Order Analytics
 *
 * Aggregates raw orders into the metrics shown on /admin/stats.
 * All time-series and breakdown calculations live here so the stats page
 * stays presentation-only and the same numbers can be reused elsewhere.
 *
 * Handles the dual-collection reality: visa orders use `destinationCountry`
 * + `destinationCountryCode`, legalization orders use `country` (an ISO code).
 * `orderType: 'visa'` is set on visa orders; legacy legalization orders may
 * have no orderType field.
 */

import { ALL_COUNTRIES } from '@/components/order/data/countries';

// ─── Types ──────────────────────────────────────────────────────────────────

export type AnyOrder = Record<string, any>;

export type DateRange =
  | 'all'
  | '7d'
  | '30d'
  | '90d'
  | 'this-month'
  | 'last-month'
  | 'this-year'
  | 'custom';

export interface DateFilter {
  range: DateRange;
  /** ISO date string, used when range === 'custom' */
  customStart?: string;
  customEnd?: string;
}

/** Maps display label to count; used for status, services, categories, etc. */
export type Breakdown = Array<{ key: string; label: string; count: number; revenue?: number }>;

export interface CountryStat {
  /** ISO 3166-1 alpha-2 code (lowercase for FlagCDN), or 'other' */
  code: string;
  /** Human-readable name (English) */
  name: string;
  count: number;
  revenue: number;
}

export interface HandlerStat {
  uid: string;
  name: string;
  active: number;       // open orders (not completed/cancelled/rejected)
  completed: number;    // completed in the period
  totalRevenue: number; // gross revenue from completed orders in the period
  netRevenue: number;   // DOX net income from completed orders in the period
}

export interface CustomerStat {
  /** Stable grouping key: "company:<normalized>" or "email:<email>" */
  key: string;
  /** Primary display name (company name if grouped by company, else person name) */
  name: string;
  /** Company name if this row was grouped by company */
  companyName?: string;
  /** Distinct emails seen for this customer (after filtering out internal addresses) */
  emails: string[];
  /** Number of distinct contact persons seen for this customer */
  contactCount: number;
  /** Alternate company name spellings that were merged into this row */
  aliases: string[];
  orderCount: number;
  totalRevenue: number; // gross — what they paid us
  netRevenue: number;   // DOX net income from this customer
}

/**
 * Internal email domains — DOX staff addresses used when we place an order on
 * behalf of a customer. These should never be the grouping key for "top
 * customers" since they'd lump unrelated orders together.
 */
const INTERNAL_EMAIL_DOMAINS = ['doxvl.se', 'doxvl.dk', 'doxvl.no', 'visumpartner.se'];

/**
 * Company-name patterns that indicate the order was placed internally (e.g.
 * DOX staff entered our own name when testing / placing admin orders).
 * Matches against the aggressively-normalized company key (lowercase, no
 * punctuation, no suffix). Extend the list if new internal patterns appear.
 */
const INTERNAL_COMPANY_PATTERNS: RegExp[] = [
  /^dox$/,
  /^dox\s*vl$/,
  /^visumpartner$/,
  /^dox\s*visumpartner$/,
];

/**
 * Common company suffixes that should be ignored when comparing names.
 * Kept as a set of lowercase tokens — matched against standalone words.
 */
const COMPANY_SUFFIX_TOKENS = new Set([
  'ab', 'aps', 'as', 'oy', 'oyj', 'sa', 'sl', 'bv', 'gmbh', 'mbh',
  'inc', 'llc', 'ltd', 'limited', 'corp', 'corporation', 'co',
  'plc', 'srl', 'spa', 'kg', 'ag', 'nv', 'gmbh',
]);

function isInternalEmail(email: string): boolean {
  const lower = (email || '').toLowerCase().trim();
  if (!lower) return false;
  return INTERNAL_EMAIL_DOMAINS.some(d => lower.endsWith('@' + d));
}

/**
 * Aggressive normalization for company names — strips punctuation (so "DOX
 * VISAS & LEGALISATIONS" === "DOX VISAS LEGALISATIONS"), lowercases, strips
 * common legal-entity suffixes (AB, AS, APS, Inc, Ltd...), and collapses
 * whitespace. Returns the canonical token string used as the grouping key.
 *
 * Handles a/s specially — normalised as "as" after punctuation strip.
 */
function normalizeCompanyKey(name: string): string {
  // Strip anything that isn't a letter (incl. åäö et al.), digit, or whitespace.
  // Using a character-class complement keeps diacritics intact without the /u flag.
  const cleaned = (name || '')
    .toLowerCase()
    .replace(/[!-/:-@\[-`{-~·]/g, ' ')   // ASCII punctuation → space
    .replace(/[&_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  const tokens = cleaned.split(' ').filter(t => t && !COMPANY_SUFFIX_TOKENS.has(t));
  return tokens.join(' ');
}

function isInternalCompany(normalizedKey: string): boolean {
  return INTERNAL_COMPANY_PATTERNS.some(re => re.test(normalizedKey));
}

/**
 * Decide how to group an order for "top customers":
 * - If companyName is present → group by normalized company name
 * - Else if the email is a real customer address → group by email
 * - Else (only internal email, no company) → null (skip — we can't attribute this order)
 *
 * Internal company names (e.g. "DOX") are also skipped.
 */
function getCustomerGroupKey(o: AnyOrder): { key: string; byCompany: boolean } | null {
  const companyName = (o.customerInfo?.companyName || '').trim();
  if (companyName) {
    const normalized = normalizeCompanyKey(companyName);
    if (!normalized || isInternalCompany(normalized)) {
      // Company name is internal / empty after normalization — fall through to email
    } else {
      return { key: 'company:' + normalized, byCompany: true };
    }
  }
  const email = (o.customerInfo?.email || '').toLowerCase().trim();
  if (email && !isInternalEmail(email)) {
    return { key: 'email:' + email, byCompany: false };
  }
  return null;
}

/**
 * Merge groups where one company key is a word-prefix of another.
 * Example: "alfa mobility" is a prefix of "alfa mobility sweden" → merge to
 * the shorter (more general) key.
 *
 * Skips merging when the shorter key is a single short token (< 4 chars) to
 * avoid over-merging unrelated companies that happen to share a common first
 * word like "dox".
 */
function mergePrefixAliases<T extends { key: string; orderCount: number }>(
  groups: Map<string, T>,
  merge: (target: T, source: T) => void
): void {
  const companyEntries = Array.from(groups.entries()).filter(([k]) => k.startsWith('company:'));
  if (companyEntries.length < 2) return;

  // Sort by key length ascending so the shortest (most general) is the merge target
  companyEntries.sort((a, b) => a[0].length - b[0].length);

  for (let i = 0; i < companyEntries.length; i++) {
    const [targetKey, target] = companyEntries[i];
    if (!groups.has(targetKey)) continue; // already merged away
    const targetBody = targetKey.slice('company:'.length);
    const targetTokens = targetBody.split(' ');
    // Guard against over-merging on short single-token keys
    if (targetTokens.length === 1 && targetBody.length < 4) continue;

    for (let j = i + 1; j < companyEntries.length; j++) {
      const [otherKey, other] = companyEntries[j];
      if (!groups.has(otherKey)) continue;
      const otherBody = otherKey.slice('company:'.length);
      if (otherBody === targetBody) continue;
      // Must be a WORD prefix (so "alfa" doesn't match "alfatech")
      if (otherBody.startsWith(targetBody + ' ')) {
        merge(target, other);
        groups.delete(otherKey);
      }
    }
  }
}

export interface MonthlyPoint {
  /** YYYY-MM */
  monthKey: string;
  /** Short label like "Apr" or "Apr 2026" */
  label: string;
  orders: number;
  /** Gross revenue (what customers paid) */
  revenue: number;
  /** Net revenue (DOX income after pass-through fees) */
  netRevenue: number;
}

export interface AnalyticsResult {
  /** Number of cancelled orders that were excluded from this report (in the period) */
  cancelledExcluded: number;
  /** Number of orders in the filtered period */
  totalOrders: number;
  /** Gross revenue — what customers paid us (includes pass-through embassy/UD fees) */
  totalRevenue: number;
  /** Pass-through fees (embassy, UD, chamber, notary, apostille official) — NOT our income */
  totalPassThroughFees: number;
  /** Net revenue — DOX's actual income (gross minus pass-through fees) */
  totalNetRevenue: number;
  /** Average net (DOX income) across completed orders in the period */
  averageOrderValue: number;
  /** Number of orders that reached completed status */
  completedOrders: number;
  /** Number of orders still in progress (anything not completed/cancelled/rejected) */
  inProgressOrders: number;
  /** Number of orders that were cancelled or rejected */
  lostOrders: number;
  /** completedOrders / (completedOrders + lostOrders) */
  conversionRate: number;
  /** Average days between createdAt and completedAt for orders completed in the period */
  averageHandlingDays: number | null;
  /** Orders with no assignedTo */
  unassignedOrders: number;

  /** Comparison vs the previous period of the same length */
  previous: {
    totalOrders: number;
    totalRevenue: number;
    totalNetRevenue: number;
    completedOrders: number;
  };
  growth: {
    /** Percent change vs previous period — null when previous is 0 */
    orders: number | null;
    revenue: number | null;
    netRevenue: number | null;
    completed: number | null;
  };

  /** Visa vs legalization split */
  byOrderType: {
    visa: { count: number; revenue: number; netRevenue: number };
    legalization: { count: number; revenue: number; netRevenue: number };
  };

  /** Status counts (all known statuses) */
  byStatus: Breakdown;

  /** Top destination countries from visa orders */
  topVisaDestinations: CountryStat[];
  /** Top countries from legalization orders */
  topLegalizationCountries: CountryStat[];

  /** Service mix (legalization) — apostille, notarization, embassy, etc. */
  legalizationServiceMix: Breakdown;
  /** Visa product categories (tourist, business, etc.) */
  visaCategoryMix: Breakdown;
  /** Visa type mix (e-visa vs sticker) */
  visaTypeMix: Breakdown;

  /** Per-handler workload + revenue */
  handlerWorkload: HandlerStat[];

  /** Top customers by total spend */
  topCustomers: CustomerStat[];

  /** Monthly revenue + order count for charts (last 12 months when range='all') */
  monthlySeries: MonthlyPoint[];

  /** Recent orders (last 10 from the filtered set) */
  recentOrders: AnyOrder[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

/** Statuses that mean the order is fully done and revenue should be counted. */
export const COMPLETED_STATUSES = new Set(['completed', 'delivered']);

/** Statuses that mean the order failed (not counted in revenue). */
export const LOST_STATUSES = new Set(['cancelled', 'rejected']);

/** All known status values across both order types, in process order. */
export const KNOWN_STATUSES: Array<{ key: string; label: string; color: string }> = [
  { key: 'pending', label: 'Pending', color: '#eab308' },
  { key: 'received', label: 'Received', color: '#0ea5e9' },
  { key: 'waiting-for-documents', label: 'Waiting for documents', color: '#f59e0b' },
  { key: 'documents-required', label: 'Documents required', color: '#f59e0b' },
  { key: 'processing', label: 'Processing', color: '#6366f1' },
  { key: 'submitted', label: 'Submitted', color: '#8b5cf6' },
  { key: 'submitted-to-embassy', label: 'Submitted to embassy', color: '#8b5cf6' },
  { key: 'action-required', label: 'Action required', color: '#ef4444' },
  { key: 'approved', label: 'Approved', color: '#22c55e' },
  { key: 'ready-for-return', label: 'Ready for return', color: '#06b6d4' },
  { key: 'completed', label: 'Completed', color: '#16a34a' },
  { key: 'rejected', label: 'Rejected', color: '#dc2626' },
  { key: 'cancelled', label: 'Cancelled', color: '#6b7280' },
];

const SERVICE_LABELS: Record<string, string> = {
  apostille: 'Apostille',
  notarization: 'Notarization',
  embassy: 'Embassy legalization',
  ud: 'Ministry of Foreign Affairs',
  translation: 'Certified translation',
  chamber: 'Chamber of Commerce',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function toDate(value: any): Date | null {
  if (!value) return null;
  try {
    if (value instanceof Date) return value;
    if (typeof value === 'object' && typeof value.toDate === 'function') return value.toDate();
    if (typeof value === 'object' && typeof value.seconds === 'number') return new Date(value.seconds * 1000);
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function isVisaOrder(o: AnyOrder): boolean {
  return o.orderType === 'visa';
}

/**
 * Split an order's totalPrice into pass-through fees (embassy / UD / chamber /
 * notary / apostille — money we collect but owe to third parties) and net
 * revenue (DOX's actual income). Works for both order types.
 *
 * - Legalization: pricingBreakdown is an array of line items. Lines whose
 *   `service` key ends with `_official` are pass-through.
 * - Visa: pricingBreakdown is a structured object. embassyFee /
 *   expressEmbassyFee / urgentEmbassyFee are pass-through and the per-traveler
 *   amounts are multiplied by travelerCount.
 */
export function calculateOrderRevenue(o: AnyOrder): { gross: number; passThrough: number; net: number } {
  const gross = Number(o.totalPrice) || 0;
  let passThrough = 0;

  if (isVisaOrder(o)) {
    const pb = o.pricingBreakdown || {};
    const travelerCount = Math.max(1, Number(o.travelerCount) || 1);
    const perTraveler =
      (Number(pb.embassyFee) || 0) +
      (Number(pb.expressEmbassyFee) || 0) +
      (Number(pb.urgentEmbassyFee) || 0);
    passThrough = perTraveler * travelerCount;
  } else {
    const pb = o.pricingBreakdown;
    if (Array.isArray(pb)) {
      for (const line of pb) {
        const service = String(line?.service || '');
        if (service.endsWith('_official')) {
          passThrough += Number(line?.total) || 0;
        }
      }
    }
  }

  // Guard: pass-through can never exceed gross (bad data protection)
  passThrough = Math.min(passThrough, gross);
  const net = gross - passThrough;
  return { gross, passThrough, net };
}

function getOrderCountry(o: AnyOrder): { code: string; name: string } {
  if (isVisaOrder(o)) {
    const code = (o.destinationCountryCode || '').toLowerCase();
    const name = o.destinationCountry || code.toUpperCase() || 'Unknown';
    return { code: code || 'other', name };
  }
  // Legalization orders store country as ISO code in `country`
  const code = (o.country || '').toLowerCase();
  if (!code) return { code: 'other', name: 'Unknown' };
  const found = ALL_COUNTRIES.find(c => c.code.toLowerCase() === code);
  return { code, name: found?.nameEn || found?.name || code.toUpperCase() };
}

/** Resolves the start of `range` as a Date, or null for 'all'. */
export function resolveDateFilter(filter: DateFilter): { start: Date | null; end: Date | null } {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  switch (filter.range) {
    case 'all':
      return { start: null, end: null };
    case '7d':
      return { start: startOfDay(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)), end: endOfDay(now) };
    case '30d':
      return { start: startOfDay(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)), end: endOfDay(now) };
    case '90d':
      return { start: startOfDay(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)), end: endOfDay(now) };
    case 'this-month':
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: endOfDay(now) };
    case 'last-month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start, end };
    }
    case 'this-year':
      return { start: new Date(now.getFullYear(), 0, 1), end: endOfDay(now) };
    case 'custom': {
      const start = filter.customStart ? startOfDay(new Date(filter.customStart)) : null;
      const end = filter.customEnd ? endOfDay(new Date(filter.customEnd)) : null;
      return { start, end };
    }
    default:
      return { start: null, end: null };
  }
}

/** Returns the previous-period range of the same length as `current`. */
function previousPeriod(start: Date | null, end: Date | null): { start: Date | null; end: Date | null } {
  if (!start || !end) return { start: null, end: null };
  const length = end.getTime() - start.getTime();
  return {
    start: new Date(start.getTime() - length),
    end: new Date(start.getTime() - 1),
  };
}

function inRange(date: Date | null, start: Date | null, end: Date | null): boolean {
  if (!date) return false;
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

// ─── Main analytics function ────────────────────────────────────────────────

export function calculateAnalytics(orders: AnyOrder[], filter: DateFilter): AnalyticsResult {
  const { start, end } = resolveDateFilter(filter);
  const prev = previousPeriod(start, end);

  // Exclude cancelled orders entirely — they are noise (customer changed mind,
  // didn't pay, etc.) and shouldn't pollute any of the metrics. Rejected
  // orders are kept since they represent real handled work that ended badly.
  const isCancelled = (o: AnyOrder) => o.status === 'cancelled';
  const liveOrders = orders.filter(o => !isCancelled(o));

  // Filter orders by createdAt
  const filtered = liveOrders.filter(o => {
    if (filter.range === 'all') return true;
    return inRange(toDate(o.createdAt), start, end);
  });

  // Count of cancelled orders in the same period (for transparency footnote)
  const cancelledExcluded = orders.filter(o => {
    if (!isCancelled(o)) return false;
    if (filter.range === 'all') return true;
    return inRange(toDate(o.createdAt), start, end);
  }).length;

  const previousFiltered = liveOrders.filter(o =>
    filter.range === 'all' ? false : inRange(toDate(o.createdAt), prev.start, prev.end)
  );

  // Top-level numbers
  const totalOrders = filtered.length;
  const completed = filtered.filter(o => COMPLETED_STATUSES.has(o.status));
  const lost = filtered.filter(o => LOST_STATUSES.has(o.status));
  const inProgress = filtered.filter(o => !COMPLETED_STATUSES.has(o.status) && !LOST_STATUSES.has(o.status));
  let totalRevenue = 0;
  let totalPassThroughFees = 0;
  let totalNetRevenue = 0;
  for (const o of completed) {
    const r = calculateOrderRevenue(o);
    totalRevenue += r.gross;
    totalPassThroughFees += r.passThrough;
    totalNetRevenue += r.net;
  }
  const completedOrders = completed.length;
  const lostOrders = lost.length;
  const inProgressOrders = inProgress.length;
  const averageOrderValue = completedOrders > 0 ? totalNetRevenue / completedOrders : 0;
  const conversionRate =
    completedOrders + lostOrders > 0 ? completedOrders / (completedOrders + lostOrders) : 0;

  // Average handling days
  const handlingDurations: number[] = [];
  for (const o of completed) {
    const created = toDate(o.createdAt);
    const done = toDate(o.completedAt) || toDate(o.updatedAt);
    if (created && done && done > created) {
      handlingDurations.push((done.getTime() - created.getTime()) / (24 * 60 * 60 * 1000));
    }
  }
  const averageHandlingDays =
    handlingDurations.length > 0
      ? handlingDurations.reduce((s, d) => s + d, 0) / handlingDurations.length
      : null;

  const unassignedOrders = filtered.filter(o => !o.assignedTo).length;

  // Previous period comparison
  const previousCompleted = previousFiltered.filter(o => COMPLETED_STATUSES.has(o.status));
  const prevNet = previousCompleted.reduce((s, o) => s + calculateOrderRevenue(o).net, 0);
  const previous = {
    totalOrders: previousFiltered.length,
    totalRevenue: previousCompleted.reduce((s, o) => s + (Number(o.totalPrice) || 0), 0),
    totalNetRevenue: prevNet,
    completedOrders: previousCompleted.length,
  };
  const pctChange = (curr: number, prevVal: number) =>
    prevVal === 0 ? null : ((curr - prevVal) / prevVal) * 100;
  const growth = {
    orders: pctChange(totalOrders, previous.totalOrders),
    revenue: pctChange(totalRevenue, previous.totalRevenue),
    netRevenue: pctChange(totalNetRevenue, previous.totalNetRevenue),
    completed: pctChange(completedOrders, previous.completedOrders),
  };

  // By order type
  const visaOrders = filtered.filter(isVisaOrder);
  const legalizationOrders = filtered.filter(o => !isVisaOrder(o));
  const sumByType = (subset: AnyOrder[]) => {
    const completedSubset = subset.filter(o => COMPLETED_STATUSES.has(o.status));
    let revenue = 0;
    let netRevenue = 0;
    for (const o of completedSubset) {
      const r = calculateOrderRevenue(o);
      revenue += r.gross;
      netRevenue += r.net;
    }
    return { count: subset.length, revenue, netRevenue };
  };
  const byOrderType = {
    visa: sumByType(visaOrders),
    legalization: sumByType(legalizationOrders),
  };

  // Status breakdown — include all known statuses (zero counts hidden in UI)
  const statusCounts = new Map<string, number>();
  filtered.forEach(o => {
    if (!o.status) return;
    statusCounts.set(o.status, (statusCounts.get(o.status) || 0) + 1);
  });
  const byStatus: Breakdown = KNOWN_STATUSES
    .map(s => ({ key: s.key, label: s.label, count: statusCounts.get(s.key) || 0 }))
    .filter(s => s.count > 0)
    // Add any unknown statuses we encountered
    .concat(
      Array.from(statusCounts.keys())
        .filter(k => !KNOWN_STATUSES.find(s => s.key === k))
        .map(k => ({ key: k, label: k, count: statusCounts.get(k) || 0 }))
    )
    .sort((a, b) => b.count - a.count);

  // Top countries (split by order type)
  const buildCountryStats = (subset: AnyOrder[]): CountryStat[] => {
    const map = new Map<string, CountryStat>();
    subset.forEach(o => {
      const { code, name } = getOrderCountry(o);
      const existing = map.get(code) || { code, name, count: 0, revenue: 0 };
      existing.count += 1;
      if (COMPLETED_STATUSES.has(o.status)) {
        existing.revenue += Number(o.totalPrice) || 0;
      }
      map.set(code, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 10);
  };
  const topVisaDestinations = buildCountryStats(visaOrders);
  const topLegalizationCountries = buildCountryStats(legalizationOrders);

  // Service mix (legalization)
  const serviceCounts = new Map<string, number>();
  legalizationOrders.forEach(o => {
    const services: string[] = Array.isArray(o.services) ? o.services : [];
    services.forEach(s => serviceCounts.set(s, (serviceCounts.get(s) || 0) + 1));
  });
  const legalizationServiceMix: Breakdown = Array.from(serviceCounts.entries())
    .map(([key, count]) => ({ key, label: SERVICE_LABELS[key] || key, count }))
    .sort((a, b) => b.count - a.count);

  // Visa category & type mix
  const categoryCounts = new Map<string, number>();
  const typeCounts = new Map<string, number>();
  visaOrders.forEach(o => {
    const cat = o.visaProduct?.category || o.visaProduct?.name || 'Unknown';
    categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
    const t = o.visaProduct?.visaType || 'Unknown';
    typeCounts.set(t, (typeCounts.get(t) || 0) + 1);
  });
  const visaCategoryMix: Breakdown = Array.from(categoryCounts.entries())
    .map(([key, count]) => ({ key, label: key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const visaTypeMix: Breakdown = Array.from(typeCounts.entries())
    .map(([key, count]) => ({
      key,
      label: key === 'e-visa' ? 'E-Visa' : key === 'sticker' ? 'Sticker visa' : key,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // Handler workload
  const handlerMap = new Map<string, HandlerStat>();
  filtered.forEach(o => {
    if (!o.assignedTo) return;
    const uid = String(o.assignedTo);
    const name = String(o.assignedToName || uid.slice(0, 8));
    const existing = handlerMap.get(uid) || { uid, name, active: 0, completed: 0, totalRevenue: 0, netRevenue: 0 };
    if (COMPLETED_STATUSES.has(o.status)) {
      const r = calculateOrderRevenue(o);
      existing.completed += 1;
      existing.totalRevenue += r.gross;
      existing.netRevenue += r.net;
    } else if (!LOST_STATUSES.has(o.status)) {
      existing.active += 1;
    }
    existing.name = name;
    handlerMap.set(uid, existing);
  });
  const handlerWorkload = Array.from(handlerMap.values()).sort(
    (a, b) => b.active + b.completed - (a.active + a.completed)
  );

  // Top customers — grouped by company name when available, else by email.
  // Skips orders that only have an internal DOX email as customer contact
  // (those are orders we placed on behalf of someone and can't attribute).
  type CustomerAcc = CustomerStat & {
    emailSet: Set<string>;
    contactSet: Set<string>;
    aliasSet: Set<string>;
  };
  const customerMap = new Map<string, CustomerAcc>();
  filtered.forEach(o => {
    const group = getCustomerGroupKey(o);
    if (!group) return;
    const companyName = (o.customerInfo?.companyName || '').trim();
    const personName = `${o.customerInfo?.firstName || ''} ${o.customerInfo?.lastName || ''}`.trim();
    const email = (o.customerInfo?.email || '').toLowerCase().trim();

    const existing: CustomerAcc = customerMap.get(group.key) || {
      key: group.key,
      name: group.byCompany ? companyName : (personName || email),
      companyName: group.byCompany ? companyName : undefined,
      emails: [],
      contactCount: 0,
      aliases: [],
      orderCount: 0,
      totalRevenue: 0,
      netRevenue: 0,
      emailSet: new Set<string>(),
      contactSet: new Set<string>(),
      aliasSet: new Set<string>(),
    };
    existing.orderCount += 1;
    if (email && !isInternalEmail(email)) existing.emailSet.add(email);
    if (personName) existing.contactSet.add(personName);
    if (group.byCompany && companyName) existing.aliasSet.add(companyName);
    if (COMPLETED_STATUSES.has(o.status)) {
      const r = calculateOrderRevenue(o);
      existing.totalRevenue += r.gross;
      existing.netRevenue += r.net;
    }
    customerMap.set(group.key, existing);
  });

  // Second pass: merge groups where one company key is a prefix of another
  // (e.g. "alfa mobility" absorbs "alfa mobility sweden").
  mergePrefixAliases(customerMap, (target, source) => {
    target.orderCount += source.orderCount;
    target.totalRevenue += source.totalRevenue;
    target.netRevenue += source.netRevenue;
    source.emailSet.forEach(e => target.emailSet.add(e));
    source.contactSet.forEach(c => target.contactSet.add(c));
    source.aliasSet.forEach(a => target.aliasSet.add(a));
  });

  const topCustomers: CustomerStat[] = Array.from(customerMap.values())
    .map(c => {
      const aliasList = Array.from(c.aliasSet);
      // Primary alias = longest (most specific) original spelling — nicer display
      const primaryName = c.companyName
        ? aliasList.sort((a, b) => b.length - a.length)[0] || c.name
        : c.name;
      return {
        key: c.key,
        name: primaryName,
        companyName: c.companyName ? primaryName : undefined,
        emails: Array.from(c.emailSet).sort(),
        contactCount: c.contactSet.size,
        aliases: aliasList.filter(a => a !== primaryName).sort(),
        orderCount: c.orderCount,
        totalRevenue: c.totalRevenue,
        netRevenue: c.netRevenue,
      };
    })
    .sort((a, b) => b.netRevenue - a.netRevenue || b.orderCount - a.orderCount)
    .slice(0, 10);

  // Monthly series (always last 12 months when range='all', else within range)
  const monthlyMap = new Map<string, { orders: number; revenue: number; netRevenue: number }>();
  const seriesScope = filter.range === 'all' ? liveOrders : filtered;
  seriesScope.forEach(o => {
    const date = toDate(o.createdAt);
    if (!date) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const existing = monthlyMap.get(key) || { orders: 0, revenue: 0, netRevenue: 0 };
    existing.orders += 1;
    if (COMPLETED_STATUSES.has(o.status)) {
      const r = calculateOrderRevenue(o);
      existing.revenue += r.gross;
      existing.netRevenue += r.net;
    }
    monthlyMap.set(key, existing);
  });

  // Build the series — fill gaps with zeros so the chart line is continuous
  const monthKeys = Array.from(monthlyMap.keys()).sort();
  let firstKey = monthKeys[0];
  const lastKey = monthKeys[monthKeys.length - 1];
  // For 'all' range, cap to last 12 months. For others, span the filter window.
  let seriesStart: Date;
  let seriesEnd: Date;
  if (filter.range === 'all') {
    seriesEnd = new Date();
    seriesStart = new Date(seriesEnd.getFullYear(), seriesEnd.getMonth() - 11, 1);
    firstKey = `${seriesStart.getFullYear()}-${String(seriesStart.getMonth() + 1).padStart(2, '0')}`;
  } else if (start && end) {
    seriesStart = new Date(start.getFullYear(), start.getMonth(), 1);
    seriesEnd = end;
  } else {
    // No data and no range — return empty series
    seriesStart = new Date();
    seriesEnd = new Date();
  }
  const monthlySeries: MonthlyPoint[] = [];
  if (firstKey && lastKey) {
    const cursor = new Date(seriesStart.getFullYear(), seriesStart.getMonth(), 1);
    while (cursor <= seriesEnd) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      const data = monthlyMap.get(key) || { orders: 0, revenue: 0, netRevenue: 0 };
      const label = cursor.toLocaleDateString('en-GB', {
        month: 'short',
        ...(filter.range === 'this-year' || filter.range === 'all' ? {} : { year: '2-digit' }),
      });
      monthlySeries.push({
        monthKey: key,
        label,
        orders: data.orders,
        revenue: data.revenue,
        netRevenue: data.netRevenue,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  // Recent orders
  const recentOrders = [...filtered]
    .sort((a, b) => {
      const da = toDate(a.createdAt)?.getTime() || 0;
      const db = toDate(b.createdAt)?.getTime() || 0;
      return db - da;
    })
    .slice(0, 10);

  return {
    cancelledExcluded,
    totalOrders,
    totalRevenue,
    totalPassThroughFees,
    totalNetRevenue,
    averageOrderValue,
    completedOrders,
    inProgressOrders,
    lostOrders,
    conversionRate,
    averageHandlingDays,
    unassignedOrders,
    previous,
    growth,
    byOrderType,
    byStatus,
    topVisaDestinations,
    topLegalizationCountries,
    legalizationServiceMix,
    visaCategoryMix,
    visaTypeMix,
    handlerWorkload,
    topCustomers,
    monthlySeries,
    recentOrders,
  };
}

// ─── Display helpers ────────────────────────────────────────────────────────

export function getStatusMeta(status: string): { label: string; color: string } {
  const found = KNOWN_STATUSES.find(s => s.key === status);
  return found || { label: status, color: '#6b7280' };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatGrowth(pct: number | null): { text: string; positive: boolean | null } {
  if (pct === null) return { text: '—', positive: null };
  const positive = pct >= 0;
  const arrow = positive ? '↑' : '↓';
  return { text: `${arrow} ${Math.abs(pct).toFixed(1)}%`, positive };
}
