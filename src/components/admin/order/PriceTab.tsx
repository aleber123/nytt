import { useState } from 'react';
import { toast } from 'react-hot-toast';
import type { ExtendedOrder } from './types';

interface LineOverride {
  index: number;
  label: string;
  baseAmount: number;
  overrideAmount?: number | null;
  overrideUnitPrice?: number | null;
  quantity?: number | null;
  vatPercent?: number | null;
  include: boolean;
}

interface PriceTabProps {
  order: ExtendedOrder;
  orderId: string;
  adminPrice: any;
  setAdminPrice: (price: any) => void;
  onSavePriceData: (data: { adminPrice: any; total: number }) => Promise<void>;
  lineOverrides: LineOverride[];
  setLineOverrides: (overrides: LineOverride[]) => void;
  discountAmount: number;
  setDiscountAmount: (amount: number) => void;
  discountPercent: number;
  setDiscountPercent: (percent: number) => void;
  adjustments: Array<{ description: string; amount: number }>;
  setAdjustments: (adj: Array<{ description: string; amount: number }>) => void;
  getBreakdownTotal: () => number;
  getServiceName: (serviceId: string) => string;
  adminName: string;
  onRecalculate?: () => Promise<void>;
}

export default function PriceTab({
  order, orderId, adminPrice, setAdminPrice, onSavePriceData,
  lineOverrides, setLineOverrides, discountAmount, setDiscountAmount,
  discountPercent, setDiscountPercent, adjustments, setAdjustments,
  getBreakdownTotal, getServiceName, adminName, onRecalculate,
}: PriceTabProps) {
  const [savingPrice, setSavingPrice] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  const translatePricingDescription = (description: string): string => {
    if (!description) return '-';
    const translations: { [key: string]: string } = {
      'Ambassadlegalisering - Officiell avgift': 'Embassy Legalization - Official Fee',
      'Ambassadlegalisering - officiell avgift': 'Embassy Legalization - Official Fee',
      'DOX Visumpartner serviceavgift (Ambassadlegalisering)': 'DOX Visumpartner Service Fee (Embassy Legalization)',
      'DOX Visumpartner serviceavgift (Apostille)': 'DOX Visumpartner Service Fee (Apostille)',
      'DOX Visumpartner serviceavgift (Notarisering)': 'DOX Visumpartner Service Fee (Notarization)',
      'DOX Visumpartner serviceavgift (Auktoriserad \u00f6vers\u00e4ttning)': 'DOX Visumpartner Service Fee (Certified Translation)',
      'DOX Visumpartner serviceavgift (\u00d6vers\u00e4ttning)': 'DOX Visumpartner Service Fee (Translation)',
      'DOX Visumpartner serviceavgift (Utrikesdepartementets legalisering)': 'DOX Visumpartner Service Fee (Ministry of Foreign Affairs)',
      'DOX Visumpartner serviceavgift (Utrikesdepartementet)': 'DOX Visumpartner Service Fee (Ministry of Foreign Affairs)',
      'DOX Visumpartner serviceavgift (Handelskammarens legalisering)': 'DOX Visumpartner Service Fee (Chamber of Commerce)',
      'DOX Visumpartner serviceavgift (Handelskammare)': 'DOX Visumpartner Service Fee (Chamber of Commerce)',
      'Skannade kopior': 'Scanned Copies',
      'Scannade kopior': 'Scanned Copies',
      'Returfrakt': 'Return Shipping',
      'Returservice': 'Return Service',
      'Upph\u00e4mtningstj\u00e4nst': 'Pickup Service',
      'Dokumenth\u00e4mtning': 'Document Pickup',
      'Expresstill\u00e4gg': 'Express Service',
      'Expresstj\u00e4nst': 'Express Service',
      'Apostille - Officiell avgift': 'Apostille - Official Fee',
      'Apostille - officiell avgift': 'Apostille - Official Fee',
      'Notarisering - Officiell avgift': 'Notarization - Official Fee',
      'Notarisering - officiell avgift': 'Notarization - Official Fee',
      'Auktoriserad \u00f6vers\u00e4ttning - Officiell avgift': 'Certified Translation - Official Fee',
      '\u00d6vers\u00e4ttning - Officiell avgift': 'Translation - Official Fee',
      '\u00d6vers\u00e4ttning - officiell avgift': 'Translation - Official Fee',
      'Utrikesdepartementets legalisering - Officiell avgift': 'Ministry of Foreign Affairs - Official Fee',
      'Utrikesdepartementets legalisering': 'Ministry of Foreign Affairs Legalization',
      'Utrikesdepartementet - Officiell avgift': 'Ministry of Foreign Affairs - Official Fee',
      'Handelskammarens legalisering - Officiell avgift': 'Chamber of Commerce - Official Fee',
      'Handelskammarintyg': 'Chamber of Commerce Certificate',
      'Handelskammare - Officiell avgift': 'Chamber of Commerce - Official Fee',
    };
    if (translations[description]) return translations[description];
    for (const [swedish, english] of Object.entries(translations)) {
      if (description.includes(swedish)) return description.replace(swedish, english);
    }
    // Pattern: DOX Visumpartner serviceavgift (X) → DOX Visumpartner Service Fee (X)
    const svcFeeMatch = description.match(/DOX Visumpartner serviceavgift \((.+)\)/);
    if (svcFeeMatch) return `DOX Visumpartner Service Fee (${svcFeeMatch[1]})`;
    if (description.includes(' - Serviceavgift')) {
      const serviceName = description.replace(' - Serviceavgift', '');
      return `DOX Visumpartner Service Fee (${serviceName})`;
    }
    if (description.includes(' - Officiell avgift')) return description.replace(' - Officiell avgift', ' - Official Fee');
    if (description.includes(' - officiell avgift')) return description.replace(' - officiell avgift', ' - Official Fee');
    return description;
  };

  const getAdjustmentsTotal = () => adjustments.reduce((s, a) => s + (Number(a.amount) || 0), 0);
  const getDiscountTotal = (base: number) => (base * (Number(discountPercent) || 0) / 100) + (Number(discountAmount) || 0);
  const getComputedTotal = () => {
    const base = getBreakdownTotal();
    const adj = getAdjustmentsTotal();
    const disc = getDiscountTotal(base);
    return Math.max(0, Math.round((base + adj - disc) * 100) / 100);
  };

  const savePricingAdjustments = async () => {
    if (!order) return;
    try {
      const base = getBreakdownTotal();
      const total = getComputedTotal();
      const priceData = {
        discountAmount: Number(discountAmount) || 0,
        discountPercent: Number(discountPercent) || 0,
        adjustments: adjustments.map(a => ({ description: a.description, amount: Number(a.amount) || 0 })),
        breakdownBase: base,
        computedTotal: total,
        updatedAt: new Date().toISOString(),
        updatedBy: adminName,
        lineOverrides: lineOverrides.map((o, idx) => {
          // Always sync label from current pricingBreakdown to avoid stale labels in PDF
          let currentLabel = o.label;
          if (Array.isArray(order?.pricingBreakdown) && order!.pricingBreakdown[idx]) {
            const item = order!.pricingBreakdown[idx] as any;
            currentLabel = item.description || getServiceName(item.service) || o.label;
          }
          // If overrideUnitPrice is set and we have quantity, compute overrideAmount
          let finalOverrideAmount = o.overrideAmount !== undefined && o.overrideAmount !== null ? Number(o.overrideAmount) : null;
          const savedUnitPrice = o.overrideUnitPrice !== undefined && o.overrideUnitPrice !== null ? Number(o.overrideUnitPrice) : null;
          const savedQuantity = o.quantity ? Number(o.quantity) : null;
          if (savedUnitPrice !== null && savedQuantity && savedQuantity > 1) {
            finalOverrideAmount = savedUnitPrice * savedQuantity;
          }
          return {
            index: o.index, label: currentLabel, baseAmount: Number(o.baseAmount || 0),
            overrideAmount: finalOverrideAmount,
            overrideUnitPrice: savedUnitPrice,
            quantity: savedQuantity,
            vatPercent: o.vatPercent !== undefined && o.vatPercent !== null ? Number(o.vatPercent) : null,
            include: o.include !== false
          };
        })
      };
      await onSavePriceData({ adminPrice: priceData, total });
      toast.success('Price updated');
    } catch (e) {
      toast.error('Could not save price');
    }
  };

  const quoteStatus = (order as any).quote?.status as string | undefined;

  return (
                <div className="space-y-6">
                    {/* Quote price lock warning */}
                    {(quoteStatus === 'sent' || quoteStatus === 'accepted') && (
                      <div className={`border rounded-lg p-4 ${quoteStatus === 'sent' ? 'bg-amber-50 border-amber-300' : 'bg-green-50 border-green-300'}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{quoteStatus === 'sent' ? '⚠️' : '✅'}</span>
                          <div>
                            <p className={`font-semibold text-sm ${quoteStatus === 'sent' ? 'text-amber-800' : 'text-green-800'}`}>
                              {quoteStatus === 'sent' ? 'Quote pending — prices should not be changed' : 'Quote accepted — prices should match the accepted quote'}
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5">
                              {quoteStatus === 'sent' 
                                ? 'A quote has been sent to the customer. Changing prices now will cause a mismatch with the quoted amounts.'
                                : 'The customer has accepted the quote. Only change prices if absolutely necessary and communicate the change to the customer.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Price Adjustments</h3>
                        {onRecalculate && order?.orderType !== 'visa' && (
                          <button
                            onClick={async () => {
                              setRecalculating(true);
                              try {
                                await onRecalculate();
                                toast.success('Prices recalculated with customer pricing');
                              } catch {
                                toast.error('Could not recalculate prices');
                              } finally {
                                setRecalculating(false);
                              }
                            }}
                            disabled={recalculating}
                            className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                          >
                            {recalculating ? 'Recalculating...' : '↻ Recalculate Prices'}
                          </button>
                        )}
                      </div>
                      {/* Per-service override table */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm border border-gray-200 rounded">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left">Include</th>
                              <th className="px-3 py-2 text-left">Description</th>
                              <th className="px-3 py-2 text-right">Base Amount</th>
                              <th className="px-3 py-2 text-right">New Unit Price</th>
                              <th className="px-3 py-2 text-right">New Total</th>
                              <th className="px-3 py-2 text-right">VAT %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Handle visa orders with object-based pricingBreakdown */}
                            {order?.orderType === 'visa' && order?.pricingBreakdown && !Array.isArray(order.pricingBreakdown) ? (
                              (() => {
                                const pb = order.pricingBreakdown as any;
                                // Always show serviceFee and embassyFee (even if 0), only filter optional fees
                                const visaLineItems = [
                                  { key: 'serviceFee', label: 'DOX Visumpartner Service Fee', amount: pb.serviceFee || 0, alwaysShow: true },
                                  { key: 'embassyFee', label: 'Embassy Official Fee', amount: pb.embassyFee || 0, alwaysShow: true },
                                  ...(pb.shippingFee ? [{ key: 'shippingFee', label: 'Shipping Fee', amount: pb.shippingFee, alwaysShow: false }] : []),
                                  ...(pb.expeditedFee ? [{ key: 'expeditedFee', label: 'Expedited Fee', amount: pb.expeditedFee, alwaysShow: false }] : []),
                                  ...(pb.expressPrice ? [{ key: 'expressPrice', label: 'Express Processing', amount: pb.expressPrice, alwaysShow: false }] : []),
                                  ...(pb.urgentPrice ? [{ key: 'urgentPrice', label: 'Urgent Processing', amount: pb.urgentPrice, alwaysShow: false }] : []),
                                ].filter(item => item.alwaysShow || item.amount > 0);
                                
                                return visaLineItems.length > 0 ? visaLineItems.map((item, idx) => {
                                  // Default VAT: 25% for service fees, 0% for embassy fees
                                  const defaultVat = item.key === 'embassyFee' ? 0 : 25;
                                  const o = lineOverrides[idx] || { index: idx, label: item.label, baseAmount: item.amount, include: true, vatPercent: defaultVat };
                                  return (
                                    <tr key={item.key} className="border-t">
                                      <td className="px-3 py-2">
                                        <input
                                          type="checkbox"
                                          checked={o.include !== false}
                                          onChange={(e) => {
                                            const next = [...lineOverrides];
                                            next[idx] = { ...o, index: idx, label: item.label, baseAmount: item.amount, include: e.target.checked };
                                            setLineOverrides(next);
                                          }}
                                        />
                                      </td>
                                      <td className="px-3 py-2">{item.label}</td>
                                      <td className="px-3 py-2 text-right">{item.amount.toFixed(2)} kr</td>
                                      <td className="px-3 py-2 text-right"><span className="text-gray-300">—</span></td>
                                      <td className="px-3 py-2 text-right">
                                        <input
                                          type="number"
                                          className="w-28 border rounded px-2 py-1 text-right"
                                          value={o.overrideAmount ?? ''}
                                          placeholder=""
                                          onChange={(e) => {
                                            const val = e.target.value === '' ? null : Number(e.target.value);
                                            const next = [...lineOverrides];
                                            next[idx] = { ...o, index: idx, label: item.label, baseAmount: item.amount, overrideAmount: val };
                                            setLineOverrides(next);
                                          }}
                                        />
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        <input
                                          type="number"
                                          className="w-20 border rounded px-2 py-1 text-right"
                                          value={o.vatPercent ?? defaultVat}
                                          placeholder={String(defaultVat)}
                                          onChange={(e) => {
                                            const val = e.target.value === '' ? null : Number(e.target.value);
                                            const next = [...lineOverrides];
                                            next[idx] = { ...o, index: idx, label: item.label, baseAmount: item.amount, vatPercent: val };
                                            setLineOverrides(next);
                                          }}
                                        />
                                      </td>
                                    </tr>
                                  );
                                }) : (
                                  <tr>
                                    <td colSpan={6} className="px-3 py-4 text-center text-gray-500">No line items</td>
                                  </tr>
                                );
                              })()
                            ) : Array.isArray(order?.pricingBreakdown) && order!.pricingBreakdown.length > 0 ? (
                              order!.pricingBreakdown.map((item: any, idx: number) => {
                                const o = lineOverrides[idx] || { index: idx, label: item.description || getServiceName(item.service) || 'Line', baseAmount: 0, include: true };
                                const base = (() => {
                                  // For multi-quantity items, unitPrice × quantity is always authoritative
                                  if (typeof item.unitPrice === 'number' && item.quantity && item.quantity > 1) return item.unitPrice * item.quantity;
                                  // For single-quantity items, use saved baseAmount or fallback
                                  if (o.baseAmount) return o.baseAmount;
                                  if (typeof item.total === 'number') return item.total;
                                  if (typeof item.fee === 'number') return item.fee;
                                  if (typeof item.basePrice === 'number') return item.basePrice;
                                  if (typeof item.unitPrice === 'number') return item.unitPrice * (item.quantity || 1);
                                  if (typeof item.officialFee === 'number' && typeof item.serviceFee === 'number') return (item.officialFee + item.serviceFee) * (item.quantity || 1);
                                  return 0;
                                })();
                                return (
                                  <tr key={idx} className="border-t">
                                    <td className="px-3 py-2">
                                      <input
                                        type="checkbox"
                                        checked={o.include !== false}
                                        onChange={(e) => {
                                          const next = [...lineOverrides];
                                          next[idx] = { ...(o as any), index: idx, label: o.label, baseAmount: Number(base || 0), include: e.target.checked };
                                          setLineOverrides(next);
                                        }}
                                      />
                                    </td>
                                    <td className="px-3 py-2">{translatePricingDescription(item.description || o.label || '-')}</td>
                                    <td className="px-3 py-2 text-right">
                                      {item.quantity && item.quantity > 1 && typeof item.unitPrice === 'number'
                                        ? <span className="text-gray-500">{item.quantity} × {item.unitPrice} = <strong>{Number(item.unitPrice * item.quantity).toLocaleString()}</strong> kr</span>
                                        : <span>{Number(base).toLocaleString()} kr</span>
                                      }
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      {item.quantity && item.quantity > 1 ? (
                                        <div className="flex items-center justify-end gap-1">
                                          <input
                                            type="number"
                                            className="w-24 border rounded px-2 py-1 text-right"
                                            value={o.overrideUnitPrice ?? ''}
                                            placeholder={typeof item.unitPrice === 'number' ? String(item.unitPrice) : ''}
                                            onChange={(e) => {
                                              const val = e.target.value === '' ? null : Number(e.target.value);
                                              const next = [...lineOverrides];
                                              const computedTotal = val !== null ? val * item.quantity : null;
                                              next[idx] = { ...(o as any), index: idx, label: o.label, baseAmount: Number(base || 0), overrideUnitPrice: val, quantity: item.quantity, overrideAmount: computedTotal };
                                              setLineOverrides(next);
                                            }}
                                          />
                                          <span className="text-gray-400 text-xs">× {item.quantity}</span>
                                        </div>
                                      ) : (
                                        <span className="text-gray-300">—</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      {item.quantity && item.quantity > 1 ? (
                                        <span className={o.overrideAmount != null ? 'font-semibold text-blue-700' : 'text-gray-400'}>
                                          {o.overrideAmount != null ? `${Number(o.overrideAmount).toLocaleString()} kr` : '—'}
                                        </span>
                                      ) : (
                                        <input
                                          type="number"
                                          className="w-28 border rounded px-2 py-1 text-right"
                                          value={o.overrideAmount ?? ''}
                                          placeholder=""
                                          onChange={(e) => {
                                            const val = e.target.value === '' ? null : Number(e.target.value);
                                            const next = [...lineOverrides];
                                            next[idx] = { ...(o as any), index: idx, label: o.label, baseAmount: Number(base || 0), overrideAmount: val };
                                            setLineOverrides(next);
                                          }}
                                        />
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      <input
                                        type="number"
                                        className="w-20 border rounded px-2 py-1 text-right"
                                        value={o.vatPercent ?? ''}
                                        placeholder=""
                                        onChange={(e) => {
                                          const val = e.target.value === '' ? null : Number(e.target.value);
                                          const next = [...lineOverrides];
                                          next[idx] = { ...(o as any), index: idx, label: o.label, baseAmount: Number(base || 0), vatPercent: val };
                                          setLineOverrides(next);
                                        }}
                                      />
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={6} className="px-3 py-4 text-center text-gray-500">No line items</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Base Amount (from pricing breakdown)</p>
                          <div className="text-xl font-semibold">{getBreakdownTotal()} SEK</div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">New Total Amount</p>
                          <div className="text-xl font-semibold">{getComputedTotal()} SEK</div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h4 className="font-medium mb-2">Discount</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Discount in SEK</label>
                            <input type="number" value={discountAmount} onChange={(e) => setDiscountAmount(Number(e.target.value))} className="w-full border rounded px-3 py-2" />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Discount in %</label>
                            <input type="number" value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))} className="w-full border rounded px-3 py-2" />
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h4 className="font-medium mb-2">Adjustments</h4>
                        <div className="space-y-3">
                          {adjustments.map((adj, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                              <input
                                type="text"
                                placeholder="Description"
                                value={adj.description}
                                onChange={(e) => {
                                  const next = [...adjustments];
                                  next[idx] = { ...next[idx], description: e.target.value };
                                  setAdjustments(next);
                                }}
                                className="col-span-7 border rounded px-3 py-2"
                              />
                              <input
                                type="number"
                                placeholder="Amount (+/-)"
                                value={adj.amount}
                                onChange={(e) => {
                                  const next = [...adjustments];
                                  next[idx] = { ...next[idx], amount: Number(e.target.value) };
                                  setAdjustments(next);
                                }}
                                className="col-span-3 border rounded px-3 py-2"
                              />
                              <button
                                onClick={() => setAdjustments(adjustments.filter((_, i) => i !== idx))}
                                className="col-span-2 text-red-600 border border-red-300 rounded px-2 py-2 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => setAdjustments([...adjustments, { description: '', amount: 0 }])}
                            className="px-3 py-2 border border-gray-300 rounded text-sm"
                          >
                            Add Line
                          </button>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Total adjustments: {getAdjustmentsTotal()} SEK • Total discount: {getDiscountTotal(getBreakdownTotal())} SEK
                        </div>
                        <button
                          onClick={savePricingAdjustments}
                          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                        >
                          Save Price
                        </button>
                      </div>
                    </div>
                  </div>
  );
}