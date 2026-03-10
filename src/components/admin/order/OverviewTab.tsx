import { useState } from 'react';
import Link from 'next/link';
import CountryFlag from '@/components/ui/CountryFlag';
import { ALL_COUNTRIES } from '@/components/order/data/countries';
import { PREDEFINED_DOCUMENT_TYPES } from '@/firebase/pricingService';
import type { ExtendedOrder, ProcessingStep, Invoice } from './types';

interface OverviewTabProps {
  order: ExtendedOrder;
  orderId: string;
  linkedOrders: string[];
  linkedOrdersDetails: any[];
  duplicateTrackingOrders: any[];
  processingSteps: ProcessingStep[];
  internalNotesList: any[];
  invoices: Invoice[];
  editedReturnAddress: any;
  setEditedReturnAddress: (addr: any) => void;
  savingReturnAddress: boolean;
  saveReturnAddress: () => Promise<void>;
  creatingInvoice: boolean;
  onCreateInvoice: () => Promise<void>;
  formatDate: (date: any) => string;
  getCountryInfo: (code: string | undefined) => { name: string; code: string };
  getProcessingStepCardClasses: (status: string) => string;
  stripFlagEmoji: (text: string) => string;
  setActiveTab: (tab: any) => void;
  onUnlinkOrder: (orderId: string) => Promise<void>;
  onLinkDuplicateOrder: (orderId: string) => Promise<void>;
  applyCustomerHistoryEntry: (entry: any) => void;
  onConfirmReturnAddress?: () => Promise<void>;
  internalNoteText: string;
  setInternalNoteText: (text: string) => void;
  addInternalNote: () => Promise<void>;
}

export default function OverviewTab({
  order, orderId, linkedOrders, linkedOrdersDetails, duplicateTrackingOrders,
  processingSteps, internalNotesList, invoices,
  editedReturnAddress, setEditedReturnAddress, savingReturnAddress, saveReturnAddress,
  creatingInvoice, onCreateInvoice, formatDate, getCountryInfo,
  getProcessingStepCardClasses, stripFlagEmoji, setActiveTab,
  onUnlinkOrder, onLinkDuplicateOrder, applyCustomerHistoryEntry,
  onConfirmReturnAddress,
  internalNoteText, setInternalNoteText, addInternalNote,
}: OverviewTabProps) {
  const [activityFilter, setActivityFilter] = useState<Set<string>>(new Set(['admin', 'customer', 'system']));
  const quoteStatus = (order as any).quote?.status as string | undefined;
  const quoteSentAt = (order as any).quote?.sentAt as string | undefined;
  const quoteRespondedAt = (order as any).quote?.respondedAt as string | undefined;
  const quoteDeclineReason = (order as any).quote?.declineReason as string | undefined;

  return (
                  <div className="space-y-6">
                    {/* Quote Status Banner */}
                    {quoteStatus && (
                      <div className={`border rounded-lg p-4 ${
                        quoteStatus === 'sent' ? 'bg-blue-50 border-blue-200' :
                        quoteStatus === 'accepted' ? 'bg-green-50 border-green-200' :
                        'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {quoteStatus === 'sent' ? '📤' : quoteStatus === 'accepted' ? '✅' : '❌'}
                          </span>
                          <div>
                            <h4 className={`font-semibold ${
                              quoteStatus === 'sent' ? 'text-blue-800' :
                              quoteStatus === 'accepted' ? 'text-green-800' :
                              'text-red-800'
                            }`}>
                              {quoteStatus === 'sent' ? 'Quote sent — awaiting customer response' : quoteStatus === 'accepted' ? 'Quote accepted by customer' : 'Quote declined by customer'}
                            </h4>
                            <p className="text-sm text-gray-600 mt-0.5">
                              {quoteSentAt && <>Sent {new Date(quoteSentAt).toLocaleDateString('en-GB')}</>}
                              {quoteRespondedAt && <> · Responded {new Date(quoteRespondedAt).toLocaleDateString('en-GB')}</>}
                            </p>
                            {quoteStatus === 'declined' && quoteDeclineReason && (
                              <p className="text-sm text-red-700 mt-1">Reason: {quoteDeclineReason}</p>
                            )}
                            {quoteStatus === 'sent' && (
                              <p className="text-sm text-amber-700 mt-1 font-medium">⚠️ Do not change prices while a quote is pending — the customer has been quoted specific amounts.</p>
                            )}
                            {quoteStatus === 'accepted' && (
                              <p className="text-sm text-amber-700 mt-1 font-medium">⚠️ Prices should match the accepted quote. Only change if absolutely necessary.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Return Address Missing Banner */}
                    {((order as any).confirmReturnAddressLater || (order as any).returnAddressConfirmationRequired) && !(order as any).returnAddressConfirmed && (
                      <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📍</span>
                          <div className="flex-1">
                            <h4 className="font-semibold text-amber-800">
                              Return address not confirmed
                            </h4>
                            <p className="text-sm text-amber-700 mt-0.5">
                              Customer chose to confirm return address later. Make sure to request the address before shipping documents back.
                            </p>
                          </div>
                          {onConfirmReturnAddress && (
                            <button
                              onClick={onConfirmReturnAddress}
                              className="px-3 py-1.5 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors whitespace-nowrap"
                            >
                              Mark as confirmed
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Linked Orders Display - Show if this order has linked orders (from tracking number match) */}
                    {linkedOrders.length > 0 && linkedOrdersDetails.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <span className="text-2xl mr-3">🔗</span>
                          <div className="flex-1">
                            <h4 className="font-medium text-green-800">
                              Combined shipping with {linkedOrders.length} {linkedOrders.length === 1 ? 'order' : 'orders'}
                            </h4>
                            <p className="text-sm text-green-700 mt-1">
                              These orders should be shipped together.
                            </p>
                            <div className="mt-3 space-y-2">
                              {linkedOrdersDetails.map((linkedOrder) => (
                                <div 
                                  key={linkedOrder.id} 
                                  className="flex items-center justify-between p-2 bg-white rounded"
                                >
                                  <div className="flex items-center space-x-3">
                                    <a 
                                      href={`/admin/orders/${linkedOrder.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-medium text-primary-600 hover:underline"
                                    >
                                      {linkedOrder.orderNumber || linkedOrder.id}
                                    </a>
                                    <span className="text-sm text-gray-500">
                                      {(() => {
                                        const c = ALL_COUNTRIES.find(country => country.code === linkedOrder.country);
                                        return c?.name || linkedOrder.country;
                                      })()}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                      linkedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      linkedOrder.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                      linkedOrder.status === 'completed' ? 'bg-green-100 text-green-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {linkedOrder.status}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => onUnlinkOrder(linkedOrder.id!)}
                                    className="text-sm px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                                  >
                                    Unlink
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Duplicate Tracking Number Warning - Show if other orders have same tracking number */}
                    {duplicateTrackingOrders.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <span className="text-2xl mr-3">⚠️</span>
                          <div className="flex-1">
                            <h4 className="font-medium text-amber-800">
                              Same tracking number on {duplicateTrackingOrders.length} other {duplicateTrackingOrders.length === 1 ? 'order' : 'orders'}
                            </h4>
                            <p className="text-sm text-amber-700 mt-1">
                              Tracking number <strong>{order?.returnTrackingNumber}</strong> is also used on the following orders. Link them for combined shipping?
                            </p>
                            <div className="mt-3 space-y-2">
                              {duplicateTrackingOrders.map((dupOrder) => (
                                <div 
                                  key={dupOrder.id} 
                                  className="flex items-center justify-between p-2 bg-white rounded"
                                >
                                  <div className="flex items-center space-x-3">
                                    <a 
                                      href={`/admin/orders/${dupOrder.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-medium text-primary-600 hover:underline"
                                    >
                                      {dupOrder.orderNumber || dupOrder.id}
                                    </a>
                                    <span className="text-sm text-gray-500">
                                      {(() => {
                                        const c = ALL_COUNTRIES.find(country => country.code === dupOrder.country);
                                        return c?.name || dupOrder.country;
                                      })()}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                      dupOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      dupOrder.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {dupOrder.status}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => onLinkDuplicateOrder(dupOrder.id!)}
                                    className="text-sm px-3 py-1 rounded bg-primary-100 text-primary-700 hover:bg-primary-200"
                                  >
                                    Link for combined shipping
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order Summary Card */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                      <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-lg font-medium text-gray-800">Order overview</h3>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Order Details */}
                          <div className="lg:col-span-2 space-y-4">
                            {/* Basic Order Info + compact services */}
                            <div>
                              <h3 className="text-sm font-semibold mb-1 text-gray-800">
                                Order information
                                {order.orderType === 'visa' && (
                                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                                    🛂 Visa
                                  </span>
                                )}
                              </h3>
                              {order.orderType === 'visa' ? (
                                /* Visa Order Information */
                                (() => {
                                  const destCountry = getCountryInfo(order.destinationCountryCode || order.destinationCountry);
                                  const natCountry = getCountryInfo(order.nationalityCode || order.nationality);
                                  return (
                                    <div className="space-y-0.5 text-xs">
                                      <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Visa product:</span>
                                        <span className="font-medium text-gray-900">{order.visaProduct?.nameEn || order.visaProduct?.name}</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Visa type:</span>
                                        <span className="font-medium text-gray-900">
                                          {order.visaProduct?.visaType === 'e-visa' ? 'E-Visa' : 'Sticker Visa'}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Entry type:</span>
                                        <span className="font-medium text-gray-900">
                                          {order.visaProduct?.entryType === 'single' ? 'Single' : order.visaProduct?.entryType === 'double' ? 'Double' : 'Multiple'}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Destination:</span>
                                        <span className="flex items-center space-x-1 font-medium text-gray-900">
                                          <CountryFlag code={destCountry.code || ''} size={16} />
                                          <span>{destCountry.name}</span>
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Nationality:</span>
                                        <span className="flex items-center space-x-1 font-medium text-gray-900">
                                          <CountryFlag code={natCountry.code || ''} size={16} />
                                          <span>{natCountry.name}</span>
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Validity:</span>
                                        <span className="font-medium text-gray-900">{order.visaProduct?.validityDays} days</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Processing time:</span>
                                        <span className="font-medium text-gray-900">~{order.visaProduct?.processingDays} days</span>
                                      </div>
                                      {order.departureDate && (
                                        <div className="flex items-center justify-between">
                                          <span className="text-gray-500">Departure:</span>
                                          <span className="font-medium text-gray-900">{new Date(order.departureDate).toLocaleDateString('en-GB')}</span>
                                        </div>
                                      )}
                                      {order.returnDate && (
                                        <div className="flex items-center justify-between">
                                          <span className="text-gray-500">Return:</span>
                                          <span className="font-medium text-gray-900">{new Date(order.returnDate).toLocaleDateString('en-GB')}</span>
                                        </div>
                                      )}
                                      {(order as any).travelers && (order as any).travelers.length > 0 && (
                                        <div className="flex items-center justify-between">
                                          <span className="text-gray-500">Travelers:</span>
                                          <span className="font-medium text-gray-900">
                                            {(order as any).travelers.map((t: any) => `${t.firstName} ${t.lastName}`).join(', ')}
                                          </span>
                                        </div>
                                      )}
                                      {order.customerInfo?.companyName && (
                                        <div className="flex items-center justify-between">
                                          <span className="text-gray-500">Company:</span>
                                          <span className="font-medium text-gray-900">{order.customerInfo.companyName}</span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()
                              ) : (
                                /* Legalization Order Information */
                                (() => {
                                  const c = getCountryInfo(order.country);
                                  return (
                                    <div className="space-y-0.5 text-xs">
                                      <div className="flex items-center justify-between">
                                        <span className="text-gray-500">
                                          Document type:
                                        </span>
                                        <span className="font-medium text-gray-900">
                                          {(() => {
                                            const getDocTypeName = (typeId: string): string => {
                                              const predefined = PREDEFINED_DOCUMENT_TYPES.find(dt => dt.id === typeId);
                                              if (predefined) return predefined.nameEn || predefined.name;
                                              if (typeId?.startsWith('custom_')) {
                                                const name = typeId.replace('custom_', '').replace(/_/g, ' ');
                                                return name.charAt(0).toUpperCase() + name.slice(1);
                                              }
                                              return typeId || 'Other document';
                                            };
                                            const types = Array.isArray((order as any).documentTypes) && (order as any).documentTypes.length > 0
                                              ? (order as any).documentTypes
                                              : order.documentType ? [order.documentType] : [];
                                            return types.map(getDocTypeName).join(', ') || 'Other document';
                                          })()}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-gray-500">
                                          Country:
                                        </span>
                                        <span className="flex items-center space-x-1 font-medium text-gray-900">
                                          <span aria-hidden="true">
                                            <CountryFlag code={c.code || order.country || ''} size={16} />
                                          </span>
                                          <span>{c.name || c.code}</span>
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-gray-500">
                                          Quantity:
                                        </span>
                                        <span className="font-medium text-gray-900">{order.quantity}</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-gray-500">
                                          Source:
                                        </span>
                                        <span className="font-medium text-gray-900">
                                          {order.documentSource === 'original'
                                            ? 'Original documents'
                                            : 'Uploaded files'}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-gray-500">
                                          Customer ref:
                                        </span>
                                        <span className="font-medium text-gray-900">{order.invoiceReference}</span>
                                      </div>
                                      {order.customerInfo?.companyName && (
                                        <div className="flex items-center justify-between">
                                          <span className="text-gray-500">
                                            Company:
                                          </span>
                                          <span className="font-medium text-gray-900">{order.customerInfo.companyName}</span>
                                        </div>
                                      )}
                                      {(order as any).translationDetails?.fromLanguage && (order as any).translationDetails?.toLanguage && (
                                        <div className="flex items-center justify-between">
                                          <span className="text-gray-500">
                                            Translation:
                                          </span>
                                          <span className="font-medium text-gray-900">
                                            {(() => {
                                              const LANG_NAMES: Record<string, string> = {
                                                sv: 'Swedish', en: 'English', ar: 'Arabic', fa: 'Persian/Farsi',
                                                fr: 'French', es: 'Spanish', de: 'German', tr: 'Turkish',
                                                th: 'Thai', zh: 'Chinese', ja: 'Japanese', ko: 'Korean',
                                                pt: 'Portuguese', it: 'Italian', nl: 'Dutch', pl: 'Polish',
                                                ru: 'Russian', uk: 'Ukrainian', hi: 'Hindi', ur: 'Urdu',
                                                bn: 'Bengali', vi: 'Vietnamese', fi: 'Finnish', no: 'Norwegian',
                                                da: 'Danish', el: 'Greek', ro: 'Romanian', hu: 'Hungarian',
                                                cs: 'Czech', he: 'Hebrew', so: 'Somali', ti: 'Tigrinya',
                                                am: 'Amharic', ku: 'Kurdish', bs: 'Bosnian', sr: 'Serbian',
                                                hr: 'Croatian', sq: 'Albanian', ms: 'Malay', id: 'Indonesian',
                                                sw: 'Swahili', ta: 'Tamil', si: 'Sinhala', my: 'Burmese',
                                                km: 'Khmer', lo: 'Lao', ne: 'Nepali', ka: 'Georgian',
                                                hy: 'Armenian', az: 'Azerbaijani', other: 'Other'
                                              };
                                              const from = LANG_NAMES[(order as any).translationDetails.fromLanguage] || (order as any).translationDetails.fromLanguage;
                                              const to = LANG_NAMES[(order as any).translationDetails.toLanguage] || (order as any).translationDetails.toLanguage;
                                              return `${from} → ${to}`;
                                            })()}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()
                              )}
                            </div>

                            {/* Unified Activity Feed */}
                            <div>
                              <h3 className="text-lg font-medium mb-3">Notes & Activity</h3>

                              {/* Quick add note */}
                              <div className="flex gap-2 mb-4">
                                <input
                                  type="text"
                                  value={internalNoteText}
                                  onChange={(e) => setInternalNoteText(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && internalNoteText.trim()) { e.preventDefault(); addInternalNote(); } }}
                                  placeholder="Add a note..."
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                                <button
                                  onClick={addInternalNote}
                                  disabled={!internalNoteText.trim()}
                                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  Add
                                </button>
                              </div>

                              {/* Filter buttons (multi-select) */}
                              <div className="flex gap-1 mb-3">
                                {(() => {
                                  const allTypes = ['admin', 'customer', 'system'];
                                  const isAll = allTypes.every(t => activityFilter.has(t));
                                  const toggleFilter = (key: string) => {
                                    if (key === 'all') {
                                      setActivityFilter(new Set(allTypes));
                                      return;
                                    }
                                    const next = new Set(activityFilter);
                                    if (next.has(key)) {
                                      next.delete(key);
                                      if (next.size === 0) { setActivityFilter(new Set(allTypes)); return; }
                                    } else {
                                      next.add(key);
                                    }
                                    setActivityFilter(next);
                                  };
                                  return [
                                    { key: 'all', label: 'All' },
                                    { key: 'admin', label: 'Admin' },
                                    { key: 'customer', label: 'Customer' },
                                    { key: 'system', label: 'System' },
                                  ].map(f => (
                                    <button
                                      key={f.key}
                                      onClick={() => toggleFilter(f.key)}
                                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                        (f.key === 'all' ? isAll : activityFilter.has(f.key))
                                          ? 'bg-primary-100 text-primary-800 border border-primary-300'
                                          : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                                      }`}
                                    >
                                      {f.label}
                                    </button>
                                  ));
                                })()}
                              </div>

                              {/* Activity items */}
                              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                {(() => {
                                  // Build unified activity feed
                                  type ActivityItem = { id: string; type: 'admin' | 'customer' | 'system'; content: string; createdAt: Date; createdBy: string; icon: string; color: string };
                                  const items: ActivityItem[] = [];

                                  // Customer notes from order (additionalNotes)
                                  if (order.additionalNotes) {
                                    items.push({
                                      id: 'customer_additional_notes',
                                      type: 'customer',
                                      content: order.additionalNotes,
                                      createdAt: order.createdAt ? (typeof order.createdAt === 'object' && 'toDate' in order.createdAt ? (order.createdAt as any).toDate() : new Date(order.createdAt as any)) : new Date(0),
                                      createdBy: `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim() || 'Customer',
                                      icon: '💬',
                                      color: 'border-purple-200 bg-purple-50',
                                    });
                                  }

                                  // Customer invoice reference
                                  if (order.invoiceReference) {
                                    items.push({
                                      id: 'customer_invoice_ref',
                                      type: 'customer',
                                      content: `Invoice reference: ${order.invoiceReference}`,
                                      createdAt: order.createdAt ? (typeof order.createdAt === 'object' && 'toDate' in order.createdAt ? (order.createdAt as any).toDate() : new Date(order.createdAt as any)) : new Date(0),
                                      createdBy: `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim() || 'Customer',
                                      icon: '🧾',
                                      color: 'border-green-200 bg-green-50',
                                    });
                                  }

                                  // Internal notes (admin handläggare notes)
                                  internalNotesList.forEach((n) => {
                                    const date = n.createdAt?.toDate ? n.createdAt.toDate() : (n.createdAt ? new Date(n.createdAt) : new Date(0));
                                    items.push({
                                      id: `note_${n.id}`,
                                      type: 'admin',
                                      content: n.content,
                                      createdAt: date,
                                      createdBy: n.createdBy || 'Admin',
                                      icon: '📝',
                                      color: 'border-blue-200 bg-blue-50',
                                    });
                                  });

                                  // Processing step status changes
                                  processingSteps.forEach((step) => {
                                    const s = step as any;
                                    // In progress — only show spinner if step is still in_progress
                                    if (s.startedAt) {
                                      const date = typeof s.startedAt === 'object' && 'toDate' in s.startedAt ? s.startedAt.toDate() : new Date(s.startedAt);
                                      const isStillInProgress = step.status === 'in_progress';
                                      items.push({
                                        id: `step_started_${step.id}`,
                                        type: 'system',
                                        content: `${stripFlagEmoji(step.name)} → ${isStillInProgress ? 'In progress' : 'Started'}`,
                                        createdAt: date,
                                        createdBy: s.startedBy || 'System',
                                        icon: isStillInProgress ? 'spinner' : 'started',
                                        color: isStillInProgress ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50',
                                      });
                                    }
                                    // Completed
                                    if (step.status === 'completed' && step.completedAt) {
                                      const date = typeof step.completedAt === 'object' && 'toDate' in step.completedAt ? (step.completedAt as any).toDate() : new Date(step.completedAt as any);
                                      items.push({
                                        id: `step_${step.id}`,
                                        type: 'system',
                                        content: `${stripFlagEmoji(step.name)} → Completed${step.notes ? `: ${step.notes}` : ''}`,
                                        createdAt: date,
                                        createdBy: step.completedBy || 'System',
                                        icon: 'check',
                                        color: 'border-green-200 bg-green-50',
                                      });
                                    }
                                  });

                                  // Sort by date descending (newest first)
                                  items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

                                  // Apply filter
                                  const filtered = items.filter(i => activityFilter.has(i.type));

                                  if (filtered.length === 0) {
                                    return <div className="text-sm text-gray-500 py-4 text-center">No activity yet</div>;
                                  }

                                  return filtered.map((item) => (
                                    <div key={item.id} className={`border rounded-lg px-3 py-2.5 ${item.color}`}>
                                      <div className="flex items-start gap-2">
                                        <span className="text-sm flex-shrink-0 mt-0.5">{
                                          item.icon === 'spinner' ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" /> :
                                          item.icon === 'check' ? <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center"><svg className="w-3 h-3 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></div> :
                                          item.icon === 'started' ? <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center"><svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></div> :
                                          item.icon
                                        }</span>
                                        <div className="flex-1 min-w-0">
                                          <div className="whitespace-pre-wrap text-sm text-gray-800">{item.content}</div>
                                          <div className="mt-1 text-xs text-gray-500 flex items-center gap-2">
                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                              item.type === 'customer' ? 'bg-purple-100 text-purple-700' :
                                              item.type === 'admin' ? 'bg-blue-100 text-blue-700' :
                                              'bg-gray-100 text-gray-600'
                                            }`}>
                                              {item.type === 'customer' ? 'Customer' : item.type === 'admin' ? 'Admin' : 'System'}
                                            </span>
                                            <span>{item.createdBy}</span>
                                            <span>·</span>
                                            <span>{formatDate(item.createdAt)}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ));
                                })()}
                              </div>
                            </div>

                            {/* Quick link to processing tab */}
                            <div>
                              <button
                                type="button"
                                onClick={() => setActiveTab('processing')}
                                className="text-primary-600 text-sm underline"
                              >
                                Manage processing steps →
                              </button>
                            </div>
                          </div>

                          {/* Customer Info Sidebar */}
                          <div className="space-y-6">
                            {/* Customer Information - Read-only display */}
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                              <h3 className="text-lg font-medium mb-4">Customer information</h3>
                              <div className="space-y-3 text-sm">
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Name</label>
                                  <div className="font-medium text-gray-900">
                                    {order.orderType === 'visa' ? (
                                      // For visa orders, show traveler names
                                      (order as any).travelers && (order as any).travelers.length > 0
                                        ? (order as any).travelers.map((t: any) => `${t.firstName} ${t.lastName}`).join(', ')
                                        : `${(order as any).travelerCount || 1} traveler(s)`
                                    ) : (
                                      // For legalization orders, show customer name
                                      `${order.customerInfo?.firstName} ${order.customerInfo?.lastName}`
                                    )}
                                  </div>
                                </div>
                                {order.customerInfo?.companyName && (
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">Company</label>
                                    <div className="font-medium text-gray-900">{order.customerInfo.companyName}</div>
                                  </div>
                                )}
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Email</label>
                                  <a href={`mailto:${order.customerInfo?.email}`} className="text-blue-600 hover:underline">
                                    {order.customerInfo?.email}
                                  </a>
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Phone</label>
                                  <a href={`tel:${order.customerInfo?.phone}`} className="text-blue-600 hover:underline">
                                    {order.customerInfo?.phone || '-'}
                                  </a>
                                </div>
                                {order.customerInfo?.address && (
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">Address</label>
                                    <div className="text-gray-900">
                                      {order.customerInfo.address}<br />
                                      {order.customerInfo.postalCode} {order.customerInfo.city}<br />
                                      {order.customerInfo.country}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Return Address - Separate card */}
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                              <h3 className="text-lg font-medium mb-4">Return address</h3>
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">First name</label>
                                    <input
                                      type="text"
                                      value={editedReturnAddress.firstName}
                                      onChange={(e) => setEditedReturnAddress({ ...editedReturnAddress, firstName: e.target.value })}
                                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">Last name</label>
                                    <input
                                      type="text"
                                      value={editedReturnAddress.lastName}
                                      onChange={(e) => setEditedReturnAddress({ ...editedReturnAddress, lastName: e.target.value })}
                                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Company name</label>
                                  <input
                                    type="text"
                                    value={editedReturnAddress.companyName}
                                    onChange={(e) => setEditedReturnAddress({ ...editedReturnAddress, companyName: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Street address</label>
                                  <input
                                    type="text"
                                    value={editedReturnAddress.street}
                                    onChange={(e) => setEditedReturnAddress({ ...editedReturnAddress, street: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">Postal code</label>
                                    <input
                                      type="text"
                                      value={editedReturnAddress.postalCode}
                                      onChange={(e) => setEditedReturnAddress({ ...editedReturnAddress, postalCode: e.target.value })}
                                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">City</label>
                                    <input
                                      type="text"
                                      value={editedReturnAddress.city}
                                      onChange={(e) => setEditedReturnAddress({ ...editedReturnAddress, city: e.target.value })}
                                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Country</label>
                                  <input
                                    type="text"
                                    value={editedReturnAddress.country}
                                    onChange={(e) => setEditedReturnAddress({ ...editedReturnAddress, country: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Phone</label>
                                  <input
                                    type="tel"
                                    value={editedReturnAddress.phone}
                                    onChange={(e) => setEditedReturnAddress({ ...editedReturnAddress, phone: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Email</label>
                                  <input
                                    type="email"
                                    value={editedReturnAddress.email}
                                    onChange={(e) => setEditedReturnAddress({ ...editedReturnAddress, email: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                  />
                                </div>

                                <div className="mt-4 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={saveReturnAddress}
                                    disabled={savingReturnAddress}
                                    className="px-3 py-1.5 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {savingReturnAddress ? 'Saving...' : 'Save return address'}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Customer history */}
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                              <h3 className="text-lg font-medium mb-3">Previous customer details</h3>
                              {order.customerHistory && order.customerHistory.length > 0 ? (
                                <div className="space-y-2 max-h-64 overflow-y-auto text-sm">
                                  {order.customerHistory
                                    .slice()
                                    .reverse()
                                    .slice(0, 5)
                                    .map((h: any, idx: number) => (
                                      <div key={idx} className="border border-gray-200 rounded p-2 bg-gray-50">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="font-medium text-gray-800">
                                            {h.customerInfo?.firstName || ''} {h.customerInfo?.lastName || ''}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => applyCustomerHistoryEntry(h)}
                                            className="text-xs text-primary-600 underline"
                                          >
                                            Load
                                          </button>
                                        </div>
                                        <div className="text-xs text-gray-600">
                                          {h.customerInfo?.address && (
                                            <div>
                                              {h.customerInfo.address}, {h.customerInfo.postalCode} {h.customerInfo.city}
                                            </div>
                                          )}
                                          <div>{h.customerInfo?.email}</div>
                                          <div>{h.customerInfo?.phone}</div>
                                          <div className="mt-1 text-[11px] text-gray-500">
                                            Updated {formatDate(h.timestamp)} by {h.changedBy || 'Unknown'}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">No history yet</p>
                              )}
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                              <h3 className="text-lg font-medium mb-4">Quick actions</h3>
                              <div className="space-y-2">
                                {invoices.length === 0 && (
                                  <button
                                    onClick={onCreateInvoice}
                                    disabled={creatingInvoice}
                                    className="w-full flex items-center justify-center py-2 px-4 border border-primary-300 rounded-md text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 disabled:opacity-50"
                                  >
                                    {creatingInvoice ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                                        Creating invoice...
                                      </>
                                    ) : (
                                      <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Create invoice
                                      </>
                                    )}
                                  </button>
                                )}
                                {invoices.length > 0 && (
                                  <button
                                    onClick={() => setActiveTab('invoice')}
                                    className="w-full flex items-center justify-center py-2 px-4 border border-primary-300 rounded-md text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    View invoices ({invoices.length})
                                  </button>
                                )}
                                <Link
                                  href={`mailto:${order.customerInfo?.email || ''}?subject=Order ${order?.orderNumber || orderId}`}
                                  className={`w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md text-sm font-medium ${
                            order.customerInfo?.email 
                              ? 'text-gray-700 bg-white hover:bg-gray-50' 
                              : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                          }`}
                                  onClick={(e) => {
                            if (!order.customerInfo?.email) {
                              e.preventDefault();
                            }
                          }}
                        >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  Send email
                                </Link>
                                <button
                                  onClick={() => window.print()}
                                  className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                  </svg>
                                  Print
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
  );
}
