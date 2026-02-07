// @ts-nocheck
import type { ExtendedOrder } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ServicesTabProps {
  ctx: any;
}

export default function ServicesTab({ ctx }: ServicesTabProps) {
  const {
    order, orderId, removingService, onRemoveService, onUpdateOrder, setOrder,
    EditVisaOrderInfoSection, EditOrderInfoSection,
    router, initializeProcessingSteps, getServiceName, getServiceStatus, getServiceStatusColor,
    addingService, handleAddService, newServiceToAdd, setNewServiceToAdd, setProcessingSteps,
  } = ctx;
  return (
                  <div className="space-y-6">
                    {/* Edit Order Information Section - different for visa vs legalization */}
                    {order.orderType === 'visa' ? (
                      <EditVisaOrderInfoSection
                        order={order}
                        onUpdate={async (updates) => {
                          const orderId = router.query.id as string;
                          await onUpdateOrder(orderId, updates);
                          setOrder(prev => prev ? { ...prev, ...updates } : null);
                        }}
                      />
                    ) : (
                      <EditOrderInfoSection
                        order={order}
                        onUpdate={async (updates) => {
                          const orderId = router.query.id as string;
                          await onUpdateOrder(orderId, updates);
                          setOrder(prev => prev ? { ...prev, ...updates } : null);
                        }}
                        onRegenerateSteps={async (updatedOrder) => {
                          const newSteps = initializeProcessingSteps(updatedOrder as ExtendedOrder);
                          const orderIdToUpdate = order.orderNumber || order.id || '';
                          await onUpdateOrder(orderIdToUpdate, { processingSteps: newSteps });
                          setProcessingSteps(newSteps);
                        }}
                      />
                    )}

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium mb-4">Order Services</h3>
                      {(() => {
                        const baseServices: string[] = Array.isArray(order.services) ? order.services : [];
                        const extraServices: string[] = [];
                        if (order.pickupService) extraServices.push('pickup_service');
                        if ((order as any).premiumPickup) extraServices.push('premium_pickup');
                        if (order.scannedCopies) extraServices.push('scanned_copies');
                        if (order.expedited) extraServices.push('express');
                        if (order.returnService) extraServices.push('return');
                        const allServices = [...baseServices, ...extraServices];

                        const currentSet = new Set(allServices);
                        const possibleServices: { id: string; label: string }[] = [
                          // Main legalization services
                          { id: 'notarization', label: getServiceName('notarization') },
                          { id: 'translation', label: getServiceName('translation') },
                          { id: 'chamber', label: getServiceName('chamber') },
                          { id: 'ud', label: getServiceName('ud') },
                          { id: 'embassy', label: getServiceName('embassy') },
                          { id: 'apostille', label: getServiceName('apostille') },
                          // Pickup options
                          { id: 'pickup_service', label: 'Document Pickup (Standard)' },
                          { id: 'premium_pickup', label: 'Document Pickup (Premium/Express)' },
                          // Additional services
                          { id: 'scanned_copies', label: 'Scanned Copies' },
                          { id: 'express', label: 'Express Processing' },
                          { id: 'return', label: getServiceName('return') }
                        ];

                        const addableServices = possibleServices.filter(s => !currentSet.has(s.id));

                        return (
                          <div className="space-y-6">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-800 mb-2">Active Services</h4>
                              {allServices.length === 0 ? (
                                <p className="text-sm text-gray-500">No services registered on this order.</p>
                              ) : (
                                <div className="space-y-2">
                                  {allServices.map((serviceId) => {
                                    const status = getServiceStatus(serviceId);
                                    const statusColor = getServiceStatusColor(status);
                                    return (
                                      <div
                                        key={serviceId}
                                        className="flex items-center justify-between border border-gray-200 rounded-md px-3 py-2 bg-white"
                                      >
                                        <div>
                                          <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium text-gray-900">{getServiceName(serviceId)}</span>
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusColor}`}>
                                              {status}
                                            </span>
                                          </div>
                                          <p className="text-xs text-gray-500 mt-0.5">
                                            Status based on processing steps.
                                          </p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => onRemoveService(serviceId)}
                                          disabled={removingService === serviceId}
                                          className="px-2 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                                        >
                                          {removingService === serviceId ? 'Removing...' : 'Remove'}
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            <div>
                              <h4 className="text-sm font-semibold text-gray-800 mb-2">Add Service</h4>
                              {addableServices.length === 0 ? (
                                <p className="text-sm text-gray-500">All available services have been added.</p>
                              ) : (
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                  <select
                                    value={newServiceToAdd}
                                    onChange={(e) => setNewServiceToAdd(e.target.value)}
                                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                                  >
                                    <option value="">Select service to add...</option>
                                    {addableServices.map((s) => (
                                      <option key={s.id} value={s.id}>
                                        {s.label}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => newServiceToAdd && handleAddService(newServiceToAdd)}
                                    disabled={!newServiceToAdd || addingService}
                                    className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {addingService ? 'Adding...' : 'Add Service'}
                                  </button>
                                </div>
                              )}
                              <p className="mt-2 text-xs text-gray-500">
                                When you add or remove a service, the price and processing steps are updated automatically.
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
  );
}
