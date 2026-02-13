// @ts-nocheck
import type { ExtendedOrder, ProcessingStep } from './types';
import SvensklistanButton from './SvensklistanButton';
import IndiaEVisaButton from './IndiaEVisaButton';

// ProcessingTab receives all needed state/functions via a context object
// to avoid 50+ individual props
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ProcessingTabProps {
  ctx: any;
}

export default function ProcessingTab({ ctx }: ProcessingTabProps) {
  const {
    order, orderId, processingSteps, setProcessingSteps,
    internalNotesList, internalNoteText, setInternalNoteText, addInternalNote,
    formatDate, getProcessingStepCardClasses, stripFlagEmoji,
    adminUpdateOrder, setOrder, adminName, currentUserId,
    downloadOrderConfirmation, downloadDhlReturnLabel,
    showEmbassyPriceWarningModal, setShowEmbassyPriceWarningModal,
    pendingStepUpdate, setPendingStepUpdate, toast,
    router, initializeProcessingSteps,
    trackingNumber, setTrackingNumber, trackingUrl,
    pickupTrackingNumber, setPickupTrackingNumber,
    savingTracking, saveTrackingInfo, savePickupTrackingInfo,
    bookingDhlShipment, bookDhlShipment,
    bookingPostNordShipment, bookPostNordShipment, rebookPostNordShipment,
    downloadDhlLabel, createAndSendDhlPickupLabel, creatingDhlPickupLabel,
    handlePickupLabelFileSelected, handleSendPickupLabel,
    isUploadingPickupLabel, sendingPickupLabel, pickupLabelInputRef,
    embassyPriceInput, setEmbassyPriceInput,
    sendEmbassyPriceConfirmation, sendingEmbassyPriceConfirmation,
    isEmbassyPriceConfirmationSent, isEmbassyPriceConfirmed, isEmbassyPriceDeclined,
    needsEmbassyPriceConfirmation,
    sendAddressConfirmation, sendingAddressConfirmation,
    needsAddressConfirmation, isAddressConfirmed, isConfirmationSent,
    confirmedPrices, setConfirmedPrices, savingConfirmedPrices, saveConfirmedPrices,
    receivedDocumentsDescription, setReceivedDocumentsDescription, savingReceivedDocs, saveReceivedDocumentsDescription,
    handleStepUpdateWithConfirmation, updateProcessingStep,
    isAuthorityService, getReturnServiceName,
  } = ctx;
  const steps = processingSteps as ProcessingStep[];
  const notes = internalNotesList as any[];
  return (
                <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Processing steps</h3>
                        <button
                          onClick={async () => {
                            if (!order) return;
                            if (!confirm('This will reset all processing steps to default. Any progress will be lost. Continue?')) return;
                            try {
                              let newSteps;
                              if (order?.orderType === 'visa') {
                                const { getDefaultVisaProcessingSteps } = await import('@/firebase/visaOrderService');
                                newSteps = getDefaultVisaProcessingSteps({
                                  visaProduct: order.visaProduct,
                                  destinationCountry: order.destinationCountry,
                                  returnService: (order as any).returnService,
                                  hasReturnLabel: (order as any).hasReturnLabel,
                                  pickupService: (order as any).pickupService,
                                  confirmReturnAddressLater: (order as any).confirmReturnAddressLater,
                                  returnAddressConfirmed: (order as any).returnAddressConfirmed,
                                  addOnServices: (order as any).addOnServices,
                                });
                              } else {
                                // Legalization order - use initializeProcessingSteps
                                newSteps = initializeProcessingSteps(order as ExtendedOrder);
                              }
                              const orderIdToUpdate = order.orderNumber || order.id || '';
                              if (!orderIdToUpdate) throw new Error('No order ID');
                              await adminUpdateOrder(orderIdToUpdate, { processingSteps: newSteps });
                              setProcessingSteps(newSteps);
                              toast.success('Processing steps regenerated');
                            } catch (err) {
                              toast.error('Failed to regenerate steps');
                            }
                          }}
                          className="text-sm px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
                        >
                          🔄 Regenerate steps
                        </button>
                      </div>
                      <div className="space-y-4">
                        {processingSteps.map((step, index) => (
                          <div key={step.id} className={`border ${getProcessingStepCardClasses(step.status)} rounded-lg p-4`}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-3 ${
                                  step.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  step.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                  step.status === 'pending' ? 'bg-gray-100 text-gray-600' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {step.status === 'completed' ? '✓' :
                                   step.status === 'in_progress' ? '⟳' :
                                   step.status === 'pending' ? index + 1 : '✗'}
                                </div>
                                <div>
                                  <h4 className="font-medium">{stripFlagEmoji(step.name)}</h4>
                                  <p className="text-sm text-gray-600">{step.description}</p>
                                </div>
                              </div>
                              <select
                                value={step.status}
                                onChange={(e) => handleStepUpdateWithConfirmation(step.id, e.target.value as ProcessingStep['status'])}
                                className="border border-gray-300 rounded px-2 py-1 text-sm"
                              >
                                <option value="pending">Pending</option>
                                <option value="in_progress">In progress</option>
                                <option value="completed">Completed</option>
                                <option value="skipped">Skipped</option>
                              </select>
                            </div>
                            
                            {/* Action buttons — shown when data_collection_form step is completed */}
                            {step.id === 'data_collection_form' && step.status === 'completed' && (() => {
                              const addons = (order as any).addOnServices || [];
                              const hasSvensklistan = addons.some((a: any) => 
                                a.name?.toLowerCase().includes('svensklistan') || a.id?.toLowerCase().includes('svensklistan')
                              );
                              const hasIndiaEVisa = addons.some((a: any) => 
                                a.name?.toLowerCase().includes('india') || a.name?.toLowerCase().includes('indien') ||
                                a.id?.toLowerCase().includes('india') || a.id?.toLowerCase().includes('indien')
                              );
                              const hasTravelers = (order as any).travelers?.length > 0;

                              return (
                                <div className="mt-3 space-y-3">
                                  <div className="p-3 rounded-lg border bg-green-50 border-green-200">
                                    <p className="text-sm font-medium text-green-900">✅ Customer data received</p>
                                  </div>

                                  {hasSvensklistan && hasTravelers && (
                                    <div className="p-3 rounded-lg border bg-green-50 border-green-200">
                                      <p className="text-sm font-medium text-green-900 mb-2">🇸🇪 Svensklistan — run auto-fill script:</p>
                                      <div className="flex flex-wrap gap-2">
                                        {(order as any).travelers.map((t: any, idx: number) => (
                                          <SvensklistanButton key={idx} order={order} travelerIndex={idx} />
                                        ))}
                                      </div>
                                      <p className="text-xs text-green-700 mt-2">
                                        Click → script copied → paste in browser console on Svensklistan page
                                      </p>
                                    </div>
                                  )}

                                  {hasIndiaEVisa && hasTravelers && (
                                    <div className="p-3 rounded-lg border bg-orange-50 border-orange-200">
                                      <p className="text-sm font-medium text-orange-900 mb-2">🇮🇳 India e-Visa — run auto-fill scripts:</p>
                                      <div className="space-y-2">
                                        {(order as any).travelers.map((t: any, idx: number) => (
                                          <IndiaEVisaButton key={idx} order={order} travelerIndex={idx} />
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            {/* Address confirmation section */}
                            {needsAddressConfirmation(step.id) && (
                              <div className={`mt-3 p-3 rounded-lg border ${
                                isAddressConfirmed(needsAddressConfirmation(step.id)!) 
                                  ? 'bg-green-50 border-green-200' 
                                  : 'bg-blue-50 border-blue-200'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className={`text-sm font-medium ${
                                      isAddressConfirmed(needsAddressConfirmation(step.id)!) 
                                        ? 'text-green-900' 
                                        : 'text-blue-900'
                                    }`}>
                                      {needsAddressConfirmation(step.id) === 'pickup' ? '📍 Pickup address' : '📍 Return address'}
                                    </p>
                                    {isAddressConfirmed(needsAddressConfirmation(step.id)!) ? (
                                      <div className="mt-1">
                                        <p className="text-xs text-green-700 flex items-center gap-1">
                                          <span>✓</span> Confirmed by customer
                                          {(() => {
                                            const extOrder = order as any;
                                            const confirmedAt = needsAddressConfirmation(step.id) === 'pickup'
                                              ? extOrder.pickupAddressConfirmedAt
                                              : extOrder.returnAddressConfirmedAt;
                                            if (confirmedAt) {
                                              const date = new Date(confirmedAt);
                                              return <span className="text-green-600 ml-1">({date.toLocaleDateString('sv-SE')} {date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })})</span>;
                                            }
                                            return null;
                                          })()}
                                        </p>
                                        {(() => {
                                          const extOrder = order as any;
                                          const wasUpdated = needsAddressConfirmation(step.id) === 'pickup'
                                            ? extOrder.pickupAddressUpdatedByCustomer
                                            : extOrder.returnAddressUpdatedByCustomer;
                                          if (wasUpdated) {
                                            return (
                                              <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                                                <span>⚠️</span> Customer updated the address
                                              </p>
                                            );
                                          }
                                          return null;
                                        })()}
                                      </div>
                                    ) : isConfirmationSent(needsAddressConfirmation(step.id)!) ? (
                                      <div className="mt-1">
                                        <p className="text-xs text-yellow-700 flex items-center gap-1">
                                          <span>⏳</span> Awaiting customer confirmation
                                        </p>
                                        {(() => {
                                          const extOrder = order as any;
                                          const sentAt = needsAddressConfirmation(step.id) === 'pickup'
                                            ? extOrder.pickupAddressConfirmationSentAt
                                            : extOrder.returnAddressConfirmationSentAt;
                                          if (sentAt) {
                                            const date = new Date(sentAt);
                                            return (
                                              <p className="text-xs text-gray-500 mt-0.5">
                                                Email sent: {date.toLocaleDateString('sv-SE')} {date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                                              </p>
                                            );
                                          }
                                          return null;
                                        })()}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-gray-600 mt-1">
                                        Send confirmation email to customer
                                      </p>
                                    )}
                                  </div>
                                  {!isAddressConfirmed(needsAddressConfirmation(step.id)!) && (
                                    <button
                                      onClick={() => sendAddressConfirmation(needsAddressConfirmation(step.id)!)}
                                      disabled={sendingAddressConfirmation}
                                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {sendingAddressConfirmation ? 'Sending...' : 
                                       isConfirmationSent(needsAddressConfirmation(step.id)!) ? 'Send reminder' : 'Send confirmation email'}
                                    </button>
                                  )}
                                </div>
                                
                                {/* Show current address */}
                                {isAddressConfirmed(needsAddressConfirmation(step.id)!) && (
                                  <div className="mt-3 pt-3 border-t border-green-200">
                                    <p className="text-xs font-medium text-green-800 mb-1">Confirmed address:</p>
                                    <div className="text-xs text-green-700 space-y-0.5">
                                      {(() => {
                                        const extOrder = order as any;
                                        if (needsAddressConfirmation(step.id) === 'pickup') {
                                          const pa = extOrder.pickupAddress || {};
                                          return (
                                            <>
                                              {pa.company && <p className="font-medium">{pa.company}</p>}
                                              {pa.name && <p>{pa.name}</p>}
                                              <p>{pa.street || order?.customerInfo?.address}</p>
                                              <p>{pa.postalCode || order?.customerInfo?.postalCode} {pa.city || order?.customerInfo?.city}</p>
                                            </>
                                          );
                                        } else {
                                          const ci = order?.customerInfo || {};
                                          return (
                                            <>
                                              {ci.companyName && <p className="font-medium">{ci.companyName}</p>}
                                              <p>{ci.firstName} {ci.lastName}</p>
                                              <p>{ci.address}</p>
                                              <p>{ci.postalCode} {ci.city}</p>
                                            </>
                                          );
                                        }
                                      })()}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Embassy price confirmation section */}
                            {needsEmbassyPriceConfirmation(step.id) && (
                              <div className={`mt-3 p-3 rounded-lg border ${
                                isEmbassyPriceConfirmed() 
                                  ? 'bg-green-50 border-green-200' 
                                  : isEmbassyPriceDeclined()
                                  ? 'bg-red-50 border-red-200'
                                  : 'bg-amber-50 border-amber-200'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className={`text-sm font-medium ${
                                      isEmbassyPriceConfirmed() 
                                        ? 'text-green-900' 
                                        : isEmbassyPriceDeclined()
                                        ? 'text-red-900'
                                        : 'text-amber-900'
                                    }`}>
                                      💰 Embassy official fee
                                    </p>
                                    {isEmbassyPriceConfirmed() ? (
                                      <div className="mt-1">
                                        <p className="text-xs text-green-700 flex items-center gap-1">
                                          <span>✓</span> Confirmed by customer
                                          {(order as any)?.embassyPriceConfirmedAt && (
                                            <span className="text-green-600 ml-1">
                                              ({new Date((order as any).embassyPriceConfirmedAt).toLocaleDateString('sv-SE')})
                                            </span>
                                          )}
                                        </p>
                                        <p className="text-sm font-bold text-green-800 mt-1">
                                          {(order as any)?.confirmedEmbassyPrice?.toLocaleString()} kr
                                        </p>
                                      </div>
                                    ) : isEmbassyPriceDeclined() ? (
                                      <div className="mt-1">
                                        <p className="text-xs text-red-700 flex items-center gap-1">
                                          <span>✗</span> Declined by customer
                                          {(order as any)?.embassyPriceDeclinedAt && (
                                            <span className="text-red-600 ml-1">
                                              ({new Date((order as any).embassyPriceDeclinedAt).toLocaleDateString('sv-SE')})
                                            </span>
                                          )}
                                        </p>
                                      </div>
                                    ) : isEmbassyPriceConfirmationSent() ? (
                                      <div className="mt-1">
                                        <p className="text-xs text-yellow-700 flex items-center gap-1">
                                          <span>⏳</span> Awaiting customer confirmation
                                        </p>
                                        {(order as any)?.embassyPriceConfirmationSentAt && (
                                          <p className="text-xs text-gray-500 mt-0.5">
                                            Email sent: {new Date((order as any).embassyPriceConfirmationSentAt).toLocaleDateString('sv-SE')} {new Date((order as any).embassyPriceConfirmationSentAt).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                                          </p>
                                        )}
                                        {(order as any)?.pendingEmbassyPrice && (
                                          <p className="text-sm font-medium text-amber-800 mt-1">
                                            Pending: {(order as any).pendingEmbassyPrice.toLocaleString()} kr
                                          </p>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-gray-600 mt-1">
                                        Enter confirmed price and send to customer
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Price input and send button */}
                                {!isEmbassyPriceConfirmed() && !isEmbassyPriceDeclined() && (
                                  <div className="mt-3 pt-3 border-t border-amber-200">
                                    <div className="flex items-end gap-2">
                                      <div className="flex-1">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          Confirmed embassy fee (SEK)
                                        </label>
                                        <input
                                          type="number"
                                          value={embassyPriceInput}
                                          onChange={(e) => setEmbassyPriceInput(e.target.value)}
                                          placeholder="e.g. 1500"
                                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                                        />
                                      </div>
                                      <button
                                        onClick={() => {
                                          const price = parseFloat(embassyPriceInput);
                                          if (isNaN(price) || price <= 0) {
                                            toast.error('Please enter a valid price');
                                            return;
                                          }
                                          sendEmbassyPriceConfirmation(price);
                                        }}
                                        disabled={sendingEmbassyPriceConfirmation || !embassyPriceInput}
                                        className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                      >
                                        {sendingEmbassyPriceConfirmation ? 'Sending...' : 
                                         isEmbassyPriceConfirmationSent() ? '📧 Send reminder' : '📧 Send to customer'}
                                      </button>
                                    </div>
                                    {embassyPriceInput && !isNaN(parseFloat(embassyPriceInput)) && (
                                      <div className="mt-2 p-2 bg-white rounded border border-amber-100">
                                        <p className="text-xs text-gray-600">
                                          New total: <span className="font-bold text-gray-900">
                                            {(() => {
                                              const currentTotalExcludingTBC = (order?.pricingBreakdown || []).reduce((sum: number, item: any) => {
                                                if (item.isTBC) return sum;
                                                return sum + (item.total || 0);
                                              }, 0);
                                              return (currentTotalExcludingTBC + parseFloat(embassyPriceInput)).toLocaleString();
                                            })()} kr
                                          </span>
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {isAuthorityService(step.id) && (
                              <div className="mt-4 space-y-4">
                                {/* Embassy delivery: only date in */}
                                {step.id.endsWith('_delivery') && (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Date submitted to authority
                                    </label>
                                    <input
                                      type="date"
                                      value={step.submittedAt ? new Date(step.submittedAt.toDate ? step.submittedAt.toDate() : step.submittedAt).toISOString().split('T')[0] : ''}
                                      onChange={(e) => {
                                        const dateValue = e.target.value;
                                        const updatedStep = {
                                          ...step,
                                          submittedAt: dateValue ? new Date(dateValue) : undefined
                                        };
                                        updateProcessingStep(step.id, step.status, step.notes, updatedStep);
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                )}

                                {/* Embassy pickup: only date out */}
                                {step.id.endsWith('_pickup') && (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Expected completion date
                                    </label>
                                    <input
                                      type="date"
                                      value={step.expectedCompletionDate ? new Date(step.expectedCompletionDate.toDate ? step.expectedCompletionDate.toDate() : step.expectedCompletionDate).toISOString().split('T')[0] : ''}
                                      onChange={(e) => {
                                        const dateValue = e.target.value;
                                        const updatedStep = {
                                          ...step,
                                          expectedCompletionDate: dateValue ? new Date(dateValue) : undefined
                                        };
                                        updateProcessingStep(step.id, step.status, step.notes, updatedStep);
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                )}

                                {/* All other authorities: both date in and date out */}
                                {!step.id.endsWith('_delivery') && !step.id.endsWith('_pickup') && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date submitted to authority
                                      </label>
                                      <input
                                        type="date"
                                        value={step.submittedAt ? new Date(step.submittedAt.toDate ? step.submittedAt.toDate() : step.submittedAt).toISOString().split('T')[0] : ''}
                                        onChange={(e) => {
                                          const dateValue = e.target.value;
                                          const updatedStep = {
                                            ...step,
                                            submittedAt: dateValue ? new Date(dateValue) : undefined
                                          };
                                          updateProcessingStep(step.id, step.status, step.notes, updatedStep);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Expected completion date
                                      </label>
                                      <input
                                        type="date"
                                        value={step.expectedCompletionDate ? new Date(step.expectedCompletionDate.toDate ? step.expectedCompletionDate.toDate() : step.expectedCompletionDate).toISOString().split('T')[0] : ''}
                                        onChange={(e) => {
                                          const dateValue = e.target.value;
                                          const updatedStep = {
                                            ...step,
                                            expectedCompletionDate: dateValue ? new Date(dateValue) : undefined
                                          };
                                          updateProcessingStep(step.id, step.status, step.notes, updatedStep);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {step.status === 'completed' && step.completedAt && (
                              <div className="text-xs text-gray-500 mt-2">
                                Completed {formatDate(step.completedAt)} by {step.completedBy}
                              </div>
                            )}
                            {step.notes && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                {step.notes}
                              </div>
                            )}
                            {/* Documents received description field */}
                            {(step.id === 'document_receipt' || step.id === 'email_documents_received') && (
                              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <label className="block text-sm font-medium text-blue-900 mb-2">
                                  📋 Received documents
                                </label>
                                <p className="text-xs text-blue-700 mb-2">
                                  Describe which documents were received (e.g. "1 x Power of Attorney, 2 x Certificate of Incorporation")
                                </p>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={receivedDocumentsDescription}
                                    onChange={(e) => setReceivedDocumentsDescription(e.target.value)}
                                    placeholder="e.g. 1 x Power of Attorney, 2 x Birth Certificate"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                  />
                                  <button
                                    onClick={saveReceivedDocumentsDescription}
                                    disabled={savingReceivedDocs}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
                                  >
                                    {savingReceivedDocs ? 'Saving...' : 'Save'}
                                  </button>
                                </div>
                                {(order as any)?.receivedDocumentsDescription && (
                                  <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
                                    <span>✓</span> Saved: {(order as any).receivedDocumentsDescription}
                                  </p>
                                )}
                              </div>
                            )}

                            {step.id === 'pickup_booking' && (
                              <div className="mt-3 space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tracking-nummer för upphämtning
                                  </label>
                                  <input
                                    type="text"
                                    value={pickupTrackingNumber}
                                    onChange={(e) => setPickupTrackingNumber(e.target.value)}
                                    onBlur={savePickupTrackingInfo}
                                    placeholder="t.ex. 1234567890"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  {/* Show if label has been sent */}
                                  {(order as any)?.pickupLabelSent ? (
                                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="text-green-800 font-medium text-sm">✓ DHL label already sent to customer</p>
                                          {(order as any)?.pickupLabelSentAt && (
                                            <p className="text-green-600 text-xs mt-1">
                                              Sent: {new Date((order as any).pickupLabelSentAt).toLocaleString('sv-SE')}
                                            </p>
                                          )}
                                          {(order as any)?.pickupTrackingNumber && (
                                            <p className="text-green-600 text-xs">
                                              Tracking: {(order as any).pickupTrackingNumber}
                                            </p>
                                          )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                          {(order as any)?.pickupLabelPdf ? (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const pdf = (order as any).pickupLabelPdf;
                                                const link = document.createElement('a');
                                                link.href = `data:application/pdf;base64,${pdf}`;
                                                link.download = `DHL-Label-${order?.orderNumber || 'label'}.pdf`;
                                                link.click();
                                              }}
                                              className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 flex items-center gap-1"
                                            >
                                              📥 Download label
                                            </button>
                                          ) : (order as any)?.pickupTrackingNumber ? (
                                            <span className="text-xs text-gray-500 italic">
                                              Label not stored (created before update)
                                            </span>
                                          ) : null}
                                          {(order as any)?.pickupTrackingNumber && (
                                            <a
                                              href={`https://www.dhl.com/se-sv/home/tracking/tracking-express.html?submit=1&tracking-id=${(order as any).pickupTrackingNumber}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="px-3 py-1.5 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600 flex items-center gap-1"
                                            >
                                              🔍 Track shipment
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                      <p className="text-amber-700 text-xs mt-2 bg-amber-50 p-2 rounded border border-amber-200">
                                        ⚠️ A DHL shipment has already been created. Creating another will result in duplicate shipments and charges.
                                      </p>
                                    </div>
                                  ) : (
                                    <>
                                      {/* Check if customer selected Stockholm Courier for pickup */}
                                      {(order as any)?.premiumPickup && ['stockholm-city', 'stockholm-express', 'stockholm-sameday'].includes((order as any).premiumPickup) ? (
                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                                          <p className="text-blue-800 font-medium text-sm">
                                            ℹ️ Customer selected: {(order as any).premiumPickup === 'stockholm-city' ? 'Stockholm City Courier' :
                                              (order as any).premiumPickup === 'stockholm-express' ? 'Stockholm Express' :
                                              'Stockholm Same Day'}
                                          </p>
                                          <p className="text-blue-600 text-xs mt-1">
                                            DHL pickup is not needed. Use Stockholm Courier for pickup instead.
                                          </p>
                                        </div>
                                      ) : (
                                        <div className="flex flex-wrap items-center gap-2 pt-1">
                                          <button
                                            type="button"
                                            onClick={createAndSendDhlPickupLabel}
                                            disabled={creatingDhlPickupLabel || !order}
                                            className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            {creatingDhlPickupLabel ? '📧 Creating & sending...' : '📧 Create & send DHL label to customer'}
                                          </button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>

                                <div className="space-y-2 border-t pt-3 mt-3">
                                  <div className="text-sm text-gray-700">
                                    <p className="font-medium">Manual upload (alternative)</p>
                                    <p className="text-xs text-gray-500">
                                      Filename must contain order number {order?.orderNumber || (router.query.id as string)}.
                                    </p>
                                  </div>

                                  {order && (order as any).pickupLabelFile && (
                                    <div className="flex items-center justify-between text-sm bg-gray-50 border border-gray-200 rounded px-3 py-2">
                                      <div>
                                        <p className="font-medium">Uploaded label</p>
                                        <p className="text-gray-700 truncate max-w-xs">{(order as any).pickupLabelFile.originalName}</p>
                                      </div>
                                      {(order as any).pickupLabelFile.downloadURL && (
                                        <a
                                          href={(order as any).pickupLabelFile.downloadURL}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-primary-600 text-sm underline ml-4"
                                        >
                                          Open
                                        </a>
                                      )}
                                    </div>
                                  )}

                                  <div className="flex flex-wrap items-center gap-3">
                                    <input
                                      ref={pickupLabelInputRef}
                                      type="file"
                                      accept=".pdf,image/*"
                                      onChange={handlePickupLabelFileSelected}
                                      className="hidden"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => pickupLabelInputRef.current?.click()}
                                      disabled={isUploadingPickupLabel}
                                      className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {isUploadingPickupLabel ? 'Uploading...' : 'Upload label'}
                                    </button>
                                    <button
                                      onClick={handleSendPickupLabel}
                                      disabled={sendingPickupLabel || !(order as any).pickupLabelFile}
                                      className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {sendingPickupLabel ? 'Sending...' : 'Send label'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                            {step.id === 'return_shipping' && (
                              <div className="mt-3 space-y-3">
                                {/* Show selected return service */}
                                <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                                  <p className="text-sm font-medium text-gray-700 mb-1">Customer selected return service:</p>
                                  <p className="text-base font-semibold">
                                    {order?.returnService ? (
                                      <>
                                        {order.returnService.includes('dhl') || order.returnService === 'retur' || order.returnService === 'own-delivery' ? '📦 ' :
                                         order.returnService.includes('postnord') ? '📮 ' :
                                         order.returnService.includes('stockholm') ? '🚴 ' :
                                         order.returnService === 'office-pickup' ? '🏢 ' : '📦 '}
                                        {getReturnServiceName(order.returnService)}
                                      </>
                                    ) : '❌ No return service selected'}
                                  </p>
                                </div>

                                {/* Confirmed prices for email - optional */}
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                  <label className="block text-sm font-medium text-amber-900 mb-2">
                                    💰 Confirm prices for customer email (optional)
                                  </label>
                                  <p className="text-xs text-amber-700 mb-3">
                                    If you enter prices here, they will be included in the completion email sent to both the customer and fakturor@visumpartner.se
                                  </p>
                                  
                                  {confirmedPrices.map((price, index) => (
                                    <div key={index} className="flex gap-2 mb-2">
                                      <input
                                        type="text"
                                        value={price.label}
                                        onChange={(e) => {
                                          const newPrices = [...confirmedPrices];
                                          newPrices[index] = { ...newPrices[index], label: e.target.value };
                                          setConfirmedPrices(newPrices);
                                        }}
                                        placeholder="Service name (e.g. Embassy Official Fee)"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                                      />
                                      <input
                                        type="text"
                                        value={price.amount}
                                        onChange={(e) => {
                                          const newPrices = [...confirmedPrices];
                                          newPrices[index] = { ...newPrices[index], amount: e.target.value };
                                          setConfirmedPrices(newPrices);
                                        }}
                                        placeholder="Amount (e.g. 1200 kr)"
                                        className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                                      />
                                      <button
                                        onClick={() => {
                                          const newPrices = confirmedPrices.filter((_, i) => i !== index);
                                          setConfirmedPrices(newPrices);
                                        }}
                                        className="px-2 py-2 text-red-600 hover:bg-red-50 rounded"
                                        title="Remove"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                  
                                  <div className="flex gap-2 mt-2">
                                    <button
                                      onClick={() => setConfirmedPrices([...confirmedPrices, { label: '', amount: '' }])}
                                      className="px-3 py-1.5 text-sm text-amber-700 border border-amber-300 rounded hover:bg-amber-100"
                                    >
                                      + Add price row
                                    </button>
                                    {confirmedPrices.length > 0 && (
                                      <button
                                        onClick={saveConfirmedPrices}
                                        disabled={savingConfirmedPrices}
                                        className="px-4 py-1.5 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50 text-sm font-medium"
                                      >
                                        {savingConfirmedPrices ? 'Saving...' : 'Save prices'}
                                      </button>
                                    )}
                                  </div>
                                  
                                  {(order as any)?.confirmedPrices?.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-amber-200">
                                      <p className="text-xs text-green-700 flex items-center gap-1">
                                        <span>✓</span> Saved prices will be included in completion email
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Hide tracking number input for office-pickup since no shipping is needed */}
                                {order?.returnService !== 'office-pickup' && (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Return tracking number
                                    </label>
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={trackingNumber}
                                        onChange={(e) => setTrackingNumber(e.target.value)}
                                        placeholder="e.g. 1234567890"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                      <button
                                        onClick={saveTrackingInfo}
                                        disabled={savingTracking}
                                        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
                                      >
                                        {savingTracking ? 'Saving...' : 'Save'}
                                      </button>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Show if shipment already booked */}
                                {/* Show if return shipment has been booked */}
                                {(order as any)?.dhlShipmentBooked ? (
                                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-green-800 font-medium text-sm">✓ DHL return shipment already booked</p>
                                        {(order as any)?.dhlShipmentBookedAt && (
                                          <p className="text-green-600 text-xs mt-1">
                                            Booked: {new Date((order as any).dhlShipmentBookedAt).toLocaleString('sv-SE')}
                                          </p>
                                        )}
                                        {trackingNumber && (
                                          <p className="text-green-600 text-xs">
                                            Tracking: {trackingNumber}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex flex-col gap-2">
                                        {(order as any)?.dhlReturnLabelBase64 ? (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const pdf = (order as any).dhlReturnLabelBase64;
                                              const link = document.createElement('a');
                                              link.href = `data:application/pdf;base64,${pdf}`;
                                              link.download = `DHL-Return-Label-${order?.orderNumber || 'label'}.pdf`;
                                              link.click();
                                            }}
                                            className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 flex items-center gap-1"
                                          >
                                            📥 Download label
                                          </button>
                                        ) : trackingNumber ? (
                                          <button
                                            type="button"
                                            onClick={() => downloadDhlLabel()}
                                            className="px-3 py-1.5 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700 flex items-center gap-1"
                                          >
                                            📄 Generate label
                                          </button>
                                        ) : null}
                                        {trackingUrl && (
                                          <a
                                            href={trackingUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-1.5 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600 flex items-center gap-1"
                                          >
                                            🔍 Track shipment
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-amber-700 text-xs mt-2 bg-amber-50 p-2 rounded border border-amber-200">
                                      ⚠️ A DHL return shipment has already been booked. Booking another will result in duplicate shipments and charges.
                                    </p>
                                  </div>
                                ) : (
                                  <>
                                    {/* Check if customer selected non-DHL return service */}
                                    {order?.returnService === 'postnord-rek' ? (
                                      // PostNord REK booking
                                      (order as any).postnordShipmentBooked ? (
                                        <div className="p-3 bg-green-50 border border-green-200 rounded">
                                          <div className="flex justify-between items-start">
                                            <p className="text-green-800 font-medium text-sm">
                                              ✅ PostNord REK booked
                                            </p>
                                            <button
                                              type="button"
                                              onClick={rebookPostNordShipment}
                                              disabled={bookingPostNordShipment}
                                              className="text-xs text-orange-600 hover:text-orange-800 hover:underline disabled:opacity-50"
                                              title="Boka om PostNord REK"
                                            >
                                              ⟳ Boka om
                                            </button>
                                          </div>
                                          <div className="mt-2 flex flex-wrap gap-2 items-center">
                                            {(order as any).postnordTrackingNumber && (
                                              <span className="text-xs bg-white px-2 py-1 rounded border">
                                                📮 {(order as any).postnordTrackingNumber}
                                              </span>
                                            )}
                                            {(order as any).postnordTrackingUrl && (
                                              <a
                                                href={(order as any).postnordTrackingUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:underline"
                                              >
                                                🔍 Track shipment
                                              </a>
                                            )}
                                            {(order as any).postnordLabelBase64 ? (
                                              <>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const link = document.createElement('a');
                                                    link.href = `data:application/pdf;base64,${(order as any).postnordLabelBase64}`;
                                                    link.download = `postnord-label-${order.orderNumber}.pdf`;
                                                    link.click();
                                                  }}
                                                  className="text-xs text-green-600 hover:underline"
                                                >
                                                  📄 Download label
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const pdfData = (order as any).postnordLabelBase64;
                                                    const byteCharacters = atob(pdfData);
                                                    const byteNumbers = new Array(byteCharacters.length);
                                                    for (let i = 0; i < byteCharacters.length; i++) {
                                                      byteNumbers[i] = byteCharacters.charCodeAt(i);
                                                    }
                                                    const byteArray = new Uint8Array(byteNumbers);
                                                    const blob = new Blob([byteArray], { type: 'application/pdf' });
                                                    const url = URL.createObjectURL(blob);
                                                    const printWindow = window.open(url, '_blank');
                                                    if (printWindow) {
                                                      printWindow.onload = () => {
                                                        printWindow.print();
                                                      };
                                                    }
                                                  }}
                                                  className="text-xs text-purple-600 hover:underline"
                                                >
                                                  🖨️ Print label
                                                </button>
                                              </>
                                            ) : (
                                              <a
                                                href="https://portal.postnord.com/portal/shipments"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                                              >
                                                🖨️ Print from PostNord Portal
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex flex-wrap items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={bookPostNordShipment}
                                            disabled={bookingPostNordShipment || !order}
                                            className="px-3 py-1.5 bg-yellow-600 text-white rounded-md text-sm hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            {bookingPostNordShipment ? '📮 Booking PostNord REK...' : '📮 Book PostNord REK'}
                                          </button>
                                          <span className="text-xs text-gray-500">
                                            Customer selected: PostNord REK (Registered Mail)
                                          </span>
                                        </div>
                                      )
                                    ) : order?.returnService && ['postnord-express', 'stockholm-city', 'stockholm-express', 'stockholm-sameday'].includes(order.returnService) ? (
                                      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                                        <p className="text-blue-800 font-medium text-sm">
                                          ℹ️ Customer selected: {order.returnService === 'postnord-express' ? 'PostNord Express' :
                                            order.returnService === 'stockholm-city' ? 'Stockholm City Courier' :
                                            order.returnService === 'stockholm-express' ? 'Stockholm Express' :
                                            'Stockholm Same Day'}
                                        </p>
                                        <p className="text-blue-600 text-xs mt-1">
                                          Manual booking required for this shipping method.
                                        </p>
                                      </div>
                                    ) : order?.returnService && ['own-delivery', 'office-pickup'].includes(order.returnService) ? (
                                      <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                                        <p className="text-slate-800 font-medium text-sm">
                                          ℹ️ Customer selected: {order.returnService === 'own-delivery' ? 'Own delivery' : 'Office pickup'}
                                        </p>
                                        <p className="text-slate-600 text-xs mt-1">
                                          No return shipment booking is needed for this return option.
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="flex flex-wrap items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={bookDhlShipment}
                                          disabled={bookingDhlShipment || !order}
                                          className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {bookingDhlShipment ? '📦 Booking DHL return...' : '📦 Book DHL return shipment'}
                                        </button>
                                        {/* Show premium delivery info if selected */}
                                        {(order as any)?.premiumDelivery && ['dhl-pre-9', 'dhl-pre-12'].includes((order as any).premiumDelivery) && (
                                          <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                                            ⚡ {(order as any).premiumDelivery === 'dhl-pre-9' ? 'DHL Pre 9:00' : 'DHL Pre 12:00'}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Internal Notes (append-only) */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">Internal notes</h3>
                      <div className="space-y-3 mb-4">
                        {internalNotesList.length === 0 && (
                          <div className="text-sm text-gray-500">No notes yet</div>
                        )}
                        {internalNotesList.map((n) => (
                          <div key={n.id} className="border border-gray-200 rounded p-3 bg-gray-50">
                            <div className="whitespace-pre-wrap text-sm text-gray-800">{n.content}</div>
                            <div className="mt-2 text-xs text-gray-500">
                              Created {formatDate(n.createdAt)} by {n.createdBy || 'Unknown'}
                            </div>
                          </div>
                        ))}
                      </div>
                      <textarea
                        value={internalNoteText}
                        onChange={(e) => setInternalNoteText(e.target.value)}
                        placeholder="Write a new internal note..."
                        className="w-full border border-gray-300 rounded-lg p-3"
                        rows={3}
                      />
                      <div className="mt-2">
                        <button
                          onClick={addInternalNote}
                          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                        >
                          Add note
                        </button>
                      </div>
                    </div>
                  </div>
  );
}