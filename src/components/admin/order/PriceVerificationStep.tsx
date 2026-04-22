// @ts-nocheck
/**
 * Price verification step — inline in the ProcessingTab expanded panel.
 *
 * Lets admin:
 *  - See price lines in a predictable order (general DOX fees → per-service
 *    pairs [DOX fee, official fee] → extras).
 *  - Edit the unit price per line; totals recompute automatically.
 *  - Save edits back to `order.pricingBreakdown`.
 *  - Send a quote to the customer (reuses /api/quote/send).
 *  - If the order is from a contract customer (matched by email domain),
 *    optionally sync edited unit prices back to `customer.customPricing`.
 */
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getCustomers, updateCustomer, type Customer, type CustomerPricing } from '@/firebase/customerService';
import { translatePricingDesc } from './translatePricingDesc';

interface Line {
  service?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  vatRate?: number;
  isTBC?: boolean;
  fee?: number;
}

interface Props {
  order: any;
  orderId: string;
  onUpdateOrder: (orderId: string, updates: Record<string, any>) => Promise<void>;
  setOrder: (updater: (prev: any) => any) => void;
}

// Service-group ranking — lines are sorted by (groupRank, subRank).
// Lower rank = appears first.
const SERVICE_GROUP_RANK: Record<string, number> = {
  // "General" DOX service fees without a service parent
  dox_service: 0,
  general_service: 0,
  // Embassy is singled out in admin's mental model — service fee typically
  // larger than others — keep it near the top after general fees.
  embassy: 1,
  // Main document services
  apostille: 2,
  notarization: 3,
  ud: 4,
  chamber: 5,
  translation: 6,
  // Extras
  express: 10,
  pickup: 11,
  return: 12,
  shipping: 12,
};

// Within a service group: DOX service fee first, then official fee.
const SUB_RANK_SERVICE = 0;
const SUB_RANK_OFFICIAL = 1;

function getServiceGroup(service?: string, description?: string): { group: string; sub: number } {
  const s = (service || '').toLowerCase();
  const desc = (description || '').toLowerCase();

  // Per-service pair pattern: "<service>_service" vs "<service>_official"
  const m = s.match(/^(apostille|notarization|ud|chamber|translation|embassy)_(service|official)$/);
  if (m) {
    return { group: m[1], sub: m[2] === 'service' ? SUB_RANK_SERVICE : SUB_RANK_OFFICIAL };
  }

  // Extras
  if (s === 'express') return { group: 'express', sub: 0 };
  if (s.includes('pickup')) return { group: 'pickup', sub: 0 };
  if (s.includes('return') || s.includes('shipping') || desc.includes('shipping') || desc.includes('retur')) {
    return { group: 'return', sub: 0 };
  }

  // Fallback: classify by description when service code is missing.
  if (desc.includes('express')) return { group: 'express', sub: 0 };
  if (desc.includes('dox') || desc.includes('service fee') || desc.includes('serviceavgift')) {
    return { group: 'dox_service', sub: 0 };
  }
  return { group: 'zzz_other', sub: 99 };
}

function sortLines(lines: Line[]): Array<Line & { _origIndex: number }> {
  return lines
    .map((l, i) => ({ ...l, _origIndex: i }))
    .sort((a, b) => {
      const ga = getServiceGroup(a.service, a.description);
      const gb = getServiceGroup(b.service, b.description);
      const ra = SERVICE_GROUP_RANK[ga.group] ?? 99;
      const rb = SERVICE_GROUP_RANK[gb.group] ?? 99;
      if (ra !== rb) return ra - rb;
      if (ga.sub !== gb.sub) return ga.sub - gb.sub;
      return a._origIndex - b._origIndex;
    });
}

// Map an order line's `service` field to the corresponding CustomerPricing
// field so edits can be mirrored back to the customer registry.
function serviceToCustomerPricingField(service?: string): keyof CustomerPricing | null {
  switch ((service || '').toLowerCase()) {
    case 'apostille_service': return 'apostilleServiceFee';
    case 'apostille_official': return 'apostilleOfficialFee';
    case 'notarization_service': return 'notarizationServiceFee';
    case 'notarization_official': return 'notarizationOfficialFee';
    case 'chamber_service': return 'chamberServiceFee';
    case 'chamber_official': return 'chamberOfficialFee';
    case 'ud_service': return 'udServiceFee';
    case 'ud_official': return 'udOfficialFee';
    case 'embassy_service': return 'embassyServiceFee';
    case 'embassy_official': return 'embassyOfficialFee';
    case 'translation_service': return 'translationServiceFee';
    case 'express': return 'expressServiceFee';
    default: return null;
  }
}

export default function PriceVerificationStep({ order, orderId, onUpdateOrder, setOrder }: Props) {
  const initialLines: Line[] = useMemo(
    () => (Array.isArray(order.pricingBreakdown) ? order.pricingBreakdown : []) as Line[],
    // deliberately only re-init when the order's breakdown changes identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [order.pricingBreakdown]
  );
  const [lines, setLines] = useState<Line[]>(() => initialLines.map(l => ({ ...l })));
  const [saving, setSaving] = useState(false);
  const [sendingQuote, setSendingQuote] = useState(false);
  const [syncToCustomer, setSyncToCustomer] = useState(false);
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(true);

  // Reset local edits when the upstream order changes
  useEffect(() => {
    setLines(initialLines.map(l => ({ ...l })));
  }, [initialLines]);

  // Match customer by email domain (admin side — use full client SDK fetch
  // so we get the `id` needed to update the registry later).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingCustomer(true);
      try {
        const email = order.customerInfo?.email as string | undefined;
        if (!email || !email.includes('@')) {
          if (!cancelled) setMatchedCustomer(null);
          return;
        }
        const domain = email.split('@')[1].toLowerCase();
        const { customers } = await getCustomers();
        const match = customers.find(c =>
          (c.emailDomains || []).some(d => (d || '').toLowerCase() === domain)
        );
        if (!cancelled) setMatchedCustomer(match || null);
      } catch {
        if (!cancelled) setMatchedCustomer(null);
      } finally {
        if (!cancelled) setLoadingCustomer(false);
      }
    })();
    return () => { cancelled = true; };
  }, [order.customerInfo?.email]);

  const sortedLines = useMemo(() => sortLines(lines), [lines]);

  const grandTotal = useMemo(
    () => lines.reduce((sum, l) => sum + (Number(l.total) || 0), 0),
    [lines]
  );

  const updateLineUnitPrice = (origIndex: number, newUnitPrice: number) => {
    setLines(prev => prev.map((l, i) => {
      if (i !== origIndex) return l;
      const qty = Number(l.quantity) || 1;
      const price = Number.isFinite(newUnitPrice) ? newUnitPrice : 0;
      return { ...l, unitPrice: price, total: price * qty };
    }));
  };

  const updateLineQuantity = (origIndex: number, newQty: number) => {
    setLines(prev => prev.map((l, i) => {
      if (i !== origIndex) return l;
      const qty = Number.isFinite(newQty) && newQty > 0 ? Math.floor(newQty) : 1;
      const price = Number(l.unitPrice) || 0;
      return { ...l, quantity: qty, total: price * qty };
    }));
  };

  const dirty = useMemo(() => {
    if (lines.length !== initialLines.length) return true;
    return lines.some((l, i) => {
      const orig = initialLines[i];
      return !orig || l.unitPrice !== orig.unitPrice || l.total !== orig.total || l.quantity !== orig.quantity;
    });
  }, [lines, initialLines]);

  const handleSavePrices = async () => {
    setSaving(true);
    try {
      await onUpdateOrder(orderId, { pricingBreakdown: lines });
      setOrder(prev => (prev ? { ...prev, pricingBreakdown: lines } : prev));

      // Optional: sync to contract customer's registry pricing
      if (syncToCustomer && matchedCustomer?.id) {
        const customPricing: Partial<CustomerPricing> = { ...(matchedCustomer.customPricing || {}) };
        let synced = 0;
        for (const line of lines) {
          const field = serviceToCustomerPricingField(line.service);
          if (field) {
            customPricing[field] = Number(line.unitPrice) || 0;
            synced++;
          }
        }
        if (synced > 0) {
          await updateCustomer(matchedCustomer.id, { customPricing } as any);
          toast.success(`Prices saved. Synced ${synced} field(s) to ${matchedCustomer.companyName}.`);
        } else {
          toast.success('Prices saved. No matching customer-pricing fields to sync.');
        }
      } else {
        toast.success('Prices saved');
      }
    } catch (err: any) {
      toast.error(`Failed to save: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSendQuote = async () => {
    if (lines.length === 0) {
      toast.error('No line items to quote');
      return;
    }
    if (dirty) {
      toast.error('Save price changes before sending quote');
      return;
    }
    setSendingQuote(true);
    try {
      const lineItems = lines.map(l => ({
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        total: l.total,
        vatRate: l.vatRate ?? 0.25,
      }));
      const response = await fetch('/api/quote/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.orderNumber || orderId,
          lineItems,
          totalAmount: grandTotal,
          message: '',
        }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || 'Quote sent to customer');
      } else {
        toast.error(data.error || 'Failed to send quote');
      }
    } catch (err: any) {
      toast.error(`Failed to send quote: ${err.message || 'Unknown error'}`);
    } finally {
      setSendingQuote(false);
    }
  };

  return (
    <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div>
          <label className="block text-sm font-semibold text-green-900">💰 Verify prices</label>
          <p className="text-xs text-green-700 mt-0.5">
            Review and edit unit prices. Totals update automatically.
          </p>
        </div>
        {loadingCustomer ? (
          <span className="text-xs text-gray-500">Checking customer registry…</span>
        ) : matchedCustomer ? (
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            🏢 Contract customer: {matchedCustomer.companyName}
          </span>
        ) : (
          <span className="text-xs text-gray-500">No contract customer match</span>
        )}
      </div>

      {sortedLines.length === 0 ? (
        <p className="text-sm text-gray-600">No pricing lines on this order yet.</p>
      ) : (
        <div className="bg-white rounded border border-green-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-green-100 text-green-900 text-xs uppercase">
              <tr>
                <th className="text-left px-3 py-2">Description</th>
                <th className="text-right px-3 py-2 w-16">Qty</th>
                <th className="text-right px-3 py-2 w-32">Unit price (kr)</th>
                <th className="text-right px-3 py-2 w-28">Total (kr)</th>
              </tr>
            </thead>
            <tbody>
              {sortedLines.map(line => (
                <tr key={line._origIndex} className="border-t border-green-100">
                  <td className="px-3 py-2 text-gray-900">
                    {translatePricingDesc(line.description)}
                    {line.isTBC && (
                      <span className="ml-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                        TBC
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      min={1}
                      step="1"
                      value={line.quantity}
                      onChange={e => updateLineQuantity(line._origIndex, parseInt(e.target.value, 10) || 1)}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-right font-mono text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      min={0}
                      step="1"
                      value={line.unitPrice}
                      onChange={e => updateLineUnitPrice(line._origIndex, parseFloat(e.target.value) || 0)}
                      className="w-28 px-2 py-1 border border-gray-300 rounded text-right font-mono text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-gray-900 font-semibold">
                    {(Number(line.total) || 0).toLocaleString('sv-SE')}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-green-300 bg-green-50">
                <td colSpan={3} className="px-3 py-2 text-right font-semibold text-green-900">Total (excl. VAT)</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-green-900">
                  {grandTotal.toLocaleString('sv-SE')} kr
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {matchedCustomer && (
        <label className="flex items-start gap-2 mt-3 text-sm text-gray-800 cursor-pointer">
          <input
            type="checkbox"
            checked={syncToCustomer}
            onChange={e => setSyncToCustomer(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            <span className="font-medium">Update contract pricing for {matchedCustomer.companyName}</span>
            <span className="block text-xs text-gray-600">
              When saving, mirror edited prices to the customer's registry so future orders use these values.
            </span>
          </span>
        </label>
      )}

      <div className="flex flex-wrap gap-2 mt-4">
        <button
          onClick={handleSavePrices}
          disabled={saving || !dirty}
          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : '💾 Save prices'}
        </button>
        <button
          onClick={handleSendQuote}
          disabled={sendingQuote || lines.length === 0 || dirty}
          title={dirty ? 'Save price changes before sending quote' : ''}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sendingQuote ? 'Sending…' : '📧 Send quote to customer'}
        </button>
      </div>
    </div>
  );
}
