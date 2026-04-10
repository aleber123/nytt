// @ts-nocheck
import { useState } from 'react';
import type { ExtendedOrder, ProcessingStep } from './types';

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
    toast,
  } = ctx;

  const [confirmingRemove, setConfirmingRemove] = useState<string | null>(null);

  // ── Price lookup per service ──
  const getServicePrice = (serviceId: string): string | null => {
    // Visa orders: object-based pricingBreakdown
    if (order.orderType === 'visa' && order.pricingBreakdown && !Array.isArray(order.pricingBreakdown)) {
      const pb = order.pricingBreakdown;
      if (serviceId === 'return' && pb.shippingFee) return `${pb.shippingFee} kr`;
      if (serviceId === 'express' && pb.expressPrice) return `${pb.expressPrice} kr`;
      return null;
    }
    // Legalization orders: array-based pricingBreakdown
    if (Array.isArray(order.pricingBreakdown)) {
      const item = order.pricingBreakdown.find((p: any) =>
        p.service === serviceId ||
        p.serviceType === serviceId ||
        (p.description || '').toLowerCase().includes(serviceId.toLowerCase())
      );
      if (item) {
        const total = item.total ?? item.fee ?? item.basePrice ?? null;
        if (total != null) return `${total} kr`;
      }
    }
    // Special cases
    if (serviceId === 'scanned_copies' && order.quantity) return `${200 * order.quantity} kr`;
    if (serviceId === 'pickup_service') return '450 kr';
    return null;
  };

  // ── Embassy country label ──
  const getServiceLabel = (serviceId: string): string => {
    const base = getServiceName(serviceId);
    if (serviceId === 'embassy' || serviceId === 'ambassad') {
      const country = order.destinationCountry || order.country;
      if (country) {
        // Try to get English name from ALL_COUNTRIES-style data on order
        const countryName = order.destinationCountry || country;
        return `${base} — ${countryName}`;
      }
    }
    return base;
  };

  // ── Confirm remove handler ──
  const handleConfirmRemove = (serviceId: string) => {
    setConfirmingRemove(serviceId);
  };

  const handleDoRemove = async (serviceId: string) => {
    setConfirmingRemove(null);
    // Log to internal notes
    try {
      const db = (await import('@/firebase/config')).db;
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      if (db) {
        const adminName = ctx.adminName || 'Admin';
        await addDoc(collection(db, 'orders', orderId, 'internalNotes'), {
          content: `🔧 Service removed: ${getServiceLabel(serviceId)}`,
          createdAt: serverTimestamp(),
          createdBy: adminName,
          readBy: [],
        });
      }
    } catch { /* non-blocking */ }
    onRemoveService(serviceId);
  };

  // ── Log add service to internal notes ──
  const handleAddServiceWithLog = async (serviceId: string) => {
    await handleAddService(serviceId);
    try {
      const db = (await import('@/firebase/config')).db;
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      if (db) {
        const adminName = ctx.adminName || 'Admin';
        await addDoc(collection(db, 'orders', orderId, 'internalNotes'), {
          content: `🔧 Service added: ${getServiceLabel(serviceId)}`,
          createdAt: serverTimestamp(),
          createdBy: adminName,
          readBy: [],
        });
      }
    } catch { /* non-blocking */ }
  };

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
            { id: 'notarization', label: getServiceName('notarization') },
            { id: 'translation', label: getServiceName('translation') },
            { id: 'chamber', label: getServiceName('chamber') },
            { id: 'ud', label: getServiceName('ud') },
            { id: 'embassy', label: getServiceName('embassy') },
            { id: 'apostille', label: getServiceName('apostille') },
            { id: 'pickup_service', label: 'Document Pickup (Standard)' },
            { id: 'premium_pickup', label: 'Document Pickup (Premium/Express)' },
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
                      const isSkipped = status === 'skipped';
                      const price = getServicePrice(serviceId);
                      const label = getServiceLabel(serviceId);

                      return (
                        <div key={serviceId}>
                          <div
                            className={`flex items-center justify-between border rounded-md px-4 py-3 ${
                              isSkipped
                                ? 'border-gray-200 bg-gray-50 opacity-60'
                                : 'border-gray-200 bg-white'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-sm font-medium ${isSkipped ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                  {label}
                                </span>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusColor}`}>
                                  {status}
                                </span>
                                {price && (
                                  <span className="text-xs text-gray-500 font-mono">{price}</span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleConfirmRemove(serviceId)}
                              disabled={removingService === serviceId}
                              className="px-2.5 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50 disabled:opacity-50 ml-3 shrink-0"
                            >
                              {removingService === serviceId ? 'Removing...' : 'Remove'}
                            </button>
                          </div>

                          {/* Confirm remove inline */}
                          {confirmingRemove === serviceId && (
                            <div className="mt-1 flex items-center gap-2 bg-red-50 border border-red-200 rounded-md px-4 py-2">
                              <span className="text-xs text-red-800 flex-1">
                                Remove <strong>{label}</strong>? This will update the price and processing steps.
                              </span>
                              <button
                                onClick={() => handleDoRemove(serviceId)}
                                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 font-medium"
                              >
                                Yes, remove
                              </button>
                              <button
                                onClick={() => setConfirmingRemove(null)}
                                className="px-3 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-white"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Visa addon services */}
              {order.orderType === 'visa' && (order as any).addOnServices?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Add-on Services</h4>
                  <div className="space-y-2">
                    {(order as any).addOnServices.map((addon: any) => (
                      <div
                        key={addon.id}
                        className="flex items-center justify-between border border-emerald-200 rounded-md px-4 py-3 bg-emerald-50"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900">
                            {addon.nameEn || addon.name}
                          </span>
                          <span className="text-xs text-gray-500 font-mono">{addon.price} kr</span>
                          {addon.perTraveler && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-800">per traveler</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                      onClick={() => newServiceToAdd && handleAddServiceWithLog(newServiceToAdd)}
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

              {/* Total price summary */}
              <div className="border-t pt-4 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Total order price</span>
                <span className="text-lg font-bold text-gray-900">
                  {order.totalPrice ? `${order.totalPrice.toLocaleString('sv-SE')} kr` : '—'}
                </span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
