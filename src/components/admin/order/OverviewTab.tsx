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
}

export default function OverviewTab({
  order, orderId, linkedOrders, linkedOrdersDetails, duplicateTrackingOrders,
  processingSteps, internalNotesList, invoices,
  editedReturnAddress, setEditedReturnAddress, savingReturnAddress, saveReturnAddress,
  creatingInvoice, onCreateInvoice, formatDate, getCountryInfo,
  getProcessingStepCardClasses, stripFlagEmoji, setActiveTab,
  onUnlinkOrder, onLinkDuplicateOrder, applyCustomerHistoryEntry,
}: OverviewTabProps) {
  return (
                  <div className="space-y-6">
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
                                    </div>
                                  );
                                })()
                              )}
                            </div>

                            {/* Processing Steps Overview */}
                            <div>
                              <h3 className="text-xs font-semibold uppercase tracking-wide mb-1 text-gray-700">Processing steps</h3>
                              <div className="space-y-2">
                                {processingSteps.map((step, index) => (
                                  <div key={step.id} className={`flex items-center justify-between px-3 py-2 rounded-md ${getProcessingStepCardClasses(step.status)}`}>
                                    <div className="flex items-center">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-3 ${
                                        step.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        step.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                        step.status === 'pending' ? 'bg-gray-100 text-gray-600' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {step.status === 'completed' ? '✓' :
                                         step.status === 'in_progress' ? (
                                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                                         ) :
                                         step.status === 'pending' ? index + 1 : '✗'}
                                      </div>
                                      <div>
                                        <span className="font-medium text-sm">{stripFlagEmoji(step.name)}</span>
                                        <div className="text-xs text-gray-500">{step.description}</div>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className={`text-xs font-medium capitalize px-2 py-1 rounded ${
                                        step.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        step.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                        step.status === 'pending' ? 'bg-gray-100 text-gray-600' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {step.status === 'completed' ? 'Completed' :
                                         step.status === 'in_progress' ? 'In progress' :
                                         step.status === 'pending' ? 'Pending' : 'Skipped'}
                                      </span>
                                      {step.status === 'completed' && step.completedAt && (
                                        <span className="text-xs text-gray-500">
                                          {formatDate(step.completedAt)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-2">
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('processing')}
                                  className="text-primary-600 text-sm underline"
                                >
                                  Manage processing →
                                </button>
                              </div>
                            </div>

                            {/* Pricing Breakdown removed from Overview as requested */}

                            {/* Notes summary in Overview */}
                            <div>
                              <h3 className="text-lg font-medium mb-4">Notes</h3>
                              <div className="space-y-3">
                                {internalNotesList.length === 0 && (
                                  <div className="text-sm text-gray-500">No notes yet</div>
                                )}
                                {internalNotesList.slice(0, 5).map((n) => (
                                  <div key={n.id} className="border border-gray-200 rounded p-3 bg-white">
                                    <div className="whitespace-pre-wrap text-sm text-gray-800">{n.content}</div>
                                    <div className="mt-2 text-xs text-gray-500">
                                      Created {formatDate(n.createdAt)} by {n.createdBy || 'Unknown'}
                                    </div>
                                  </div>
                                ))}
                                {internalNotesList.length > 5 && (
                                  <div className="text-sm text-gray-600">Showing the latest 5 notes</div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('processing')}
                                  className="text-primary-600 text-sm underline"
                                >
                                  View all notes →
                                </button>
                              </div>
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
                                    {order.customerInfo?.firstName} {order.customerInfo?.lastName}
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
