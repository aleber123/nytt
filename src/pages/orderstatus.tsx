import React, { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface OrderStatusProps {}

const OrderStatusPage: React.FC<OrderStatusProps> = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');

  // Pre-fill order number from URL query parameter
  useEffect(() => {
    if (router.isReady && router.query.order) {
      setOrderNumber(router.query.order as string);
    }
  }, [router.isReady, router.query.order]);
  const [orderStatus, setOrderStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Real order status check using API
  const checkOrderStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Validate input
    if (!orderNumber || !email) {
      setError(t('orderStatus.errors.missingFields'));
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, email })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (response.status === 404) {
          setError(t('orderStatus.errors.notFound'));
        } else {
          setError(t('orderStatus.errors.technical'));
        }
        setIsLoading(false);
        return;
      }

      // Format the order data for display
      const formattedOrder = formatOrderForDisplayFromApi(data.order);
      setOrderStatus(formattedOrder);
    } catch (error) {
      setError(t('orderStatus.errors.technical'));
    } finally {
      setIsLoading(false);
    }
  };

  // Format order data from API response
  const formatOrderForDisplayFromApi = (orderData: any) => {
    const status = orderData.status;
    const createdAtIso = orderData.createdAt;
    const updatedAtIso = orderData.updatedAt;

    const processingSteps = orderData.processingSteps as any[] | undefined;
    const hasProcessingSteps = Array.isArray(processingSteps) && processingSteps.length > 0;

    const isProcessingStarted = ['processing', 'completed', 'shipped', 'delivered'].includes(status);
    const isProcessingCompleted = ['completed', 'shipped', 'delivered'].includes(status);
    const isShipped = ['shipped', 'delivered'].includes(status);
    const isDelivered = status === 'delivered';

    let steps: {
      name: string;
      description: string;
      completed: boolean;
      date?: string;
    }[] = [];

    if (hasProcessingSteps) {
      const coreProcessingStepIds = new Set<string>([
        'document_receipt', 'pickup_booking', 'notarization_delivery', 'notarization_pickup',
        'translation_delivery', 'translation_pickup', 'chamber_delivery', 'chamber_pickup',
        'ud_delivery', 'ud_pickup', 'embassy_delivery', 'embassy_pickup', 'scanning'
      ]);

      const coreCompletedSteps = processingSteps.filter(
        (s: any) => coreProcessingStepIds.has(s.id) && s.status === 'completed' && s.completedAt
      );

      let earliestCoreCompletedDate: Date | undefined;
      let latestCoreCompletedDate: Date | undefined;

      coreCompletedSteps.forEach((s: any) => {
        const date = s.completedAt ? new Date(s.completedAt) : undefined;
        if (!date || isNaN(date.getTime())) return;
        if (!earliestCoreCompletedDate || date < earliestCoreCompletedDate) earliestCoreCompletedDate = date;
        if (!latestCoreCompletedDate || date > latestCoreCompletedDate) latestCoreCompletedDate = date;
      });

      const allCoreStepsCompleted = processingSteps.filter((s: any) => coreProcessingStepIds.has(s.id)).length > 0 &&
        processingSteps.filter((s: any) => coreProcessingStepIds.has(s.id)).every((s: any) => s.status === 'completed');

      const finalCheckStep = processingSteps.find((s: any) => s.id === 'final_check' && s.status === 'completed' && s.completedAt);
      const finalCheckCompletedDate = finalCheckStep?.completedAt ? new Date(finalCheckStep.completedAt) : undefined;

      const orderReceivedStep = {
        name: t('orderStatus.steps.orderReceived.name'),
        description: t('orderStatus.steps.orderReceived.description'),
        completed: true,
        date: createdAtIso
      };

      const processingStep = {
        name: t('orderStatus.steps.processing.name'),
        description: t('orderStatus.steps.processing.description'),
        completed: !!earliestCoreCompletedDate,
        date: earliestCoreCompletedDate ? earliestCoreCompletedDate.toISOString() : undefined
      };

      let legalizedCompleted = false;
      let legalizedDate: Date | undefined;
      if (finalCheckCompletedDate) {
        legalizedCompleted = true;
        legalizedDate = finalCheckCompletedDate;
      } else if (allCoreStepsCompleted && latestCoreCompletedDate) {
        legalizedCompleted = true;
        legalizedDate = latestCoreCompletedDate;
      }

      const legalizedStep = {
        name: t('orderStatus.steps.legalized.name'),
        description: t('orderStatus.steps.legalized.description'),
        completed: legalizedCompleted,
        date: legalizedDate ? legalizedDate.toISOString() : undefined
      };

      const returnShippingStep = processingSteps.find((s: any) => s.id === 'return_shipping' && s.status === 'completed' && s.completedAt);
      const shippedDate = returnShippingStep?.completedAt ? new Date(returnShippingStep.completedAt) : undefined;

      const shippedStep = {
        name: t('orderStatus.steps.shipped.name'),
        description: t('orderStatus.steps.shipped.description'),
        completed: !!shippedDate || isShipped || isDelivered,
        date: shippedDate ? shippedDate.toISOString() : (status === 'shipped' ? updatedAtIso : undefined)
      };

      const deliveredStep = {
        name: t('orderStatus.steps.delivered.name'),
        description: t('orderStatus.steps.delivered.description'),
        completed: isDelivered,
        date: isDelivered ? updatedAtIso : undefined
      };

      steps = [orderReceivedStep, processingStep, legalizedStep, shippedStep, deliveredStep];
    } else {
      // Fallback: customer-facing steps based on high-level order status
      steps = [
        { name: t('orderStatus.steps.orderReceived.name'), description: t('orderStatus.steps.orderReceived.description'), completed: true, date: createdAtIso },
        { name: t('orderStatus.steps.processing.name'), description: t('orderStatus.steps.processing.description'), completed: isProcessingCompleted || isShipped || isDelivered, date: isProcessingStarted ? updatedAtIso : undefined },
        { name: t('orderStatus.steps.legalized.name'), description: t('orderStatus.steps.legalized.description'), completed: isShipped || isDelivered, date: isProcessingCompleted ? updatedAtIso : undefined },
        { name: t('orderStatus.steps.shipped.name'), description: t('orderStatus.steps.shipped.description'), completed: isShipped || isDelivered, date: status === 'shipped' ? updatedAtIso : undefined },
        { name: t('orderStatus.steps.delivered.name'), description: t('orderStatus.steps.delivered.description'), completed: isDelivered, date: isDelivered ? updatedAtIso : undefined }
      ];
    }

    // Calculate estimated delivery
    const addBusinessDays = (startDate: Date, businessDays: number) => {
      const date = new Date(startDate);
      let added = 0;
      while (added < businessDays) {
        date.setDate(date.getDate() + 1);
        const day = date.getDay();
        if (day !== 0 && day !== 6) added++;
      }
      return date;
    };

    const createdDate = createdAtIso ? new Date(createdAtIso) : new Date();
    const returnShippingStep = hasProcessingSteps ? processingSteps?.find((s: any) => s.id === 'return_shipping' && s.status === 'completed' && s.completedAt) : undefined;
    
    let estimatedDeliveryDate: Date;
    if (returnShippingStep?.completedAt) {
      estimatedDeliveryDate = addBusinessDays(new Date(returnShippingStep.completedAt), 2);
    } else {
      estimatedDeliveryDate = new Date(createdDate);
      estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 7);
    }

    return {
      orderNumber: orderData.orderNumber,
      status: orderData.status,
      createdAt: createdAtIso,
      estimatedDelivery: estimatedDeliveryDate.toISOString().split('T')[0],
      service: Array.isArray(orderData.services) ? orderData.services[0] : orderData.services,
      services: orderData.services,
      customer: {
        name: orderData.customerInfo ? `${orderData.customerInfo.firstName || ''} ${orderData.customerInfo.lastName || ''}`.trim() || t('common.notSpecified', 'Not specified') : t('common.notSpecified', 'Not specified'),
        email: orderData.customerInfo?.email || t('common.noEmailProvided', 'No email provided')
      },
      steps: steps,
      totalPrice: orderData.totalPrice,
      returnTrackingNumber: orderData.returnTrackingNumber || null,
      returnTrackingUrl: orderData.returnTrackingUrl || null,
      returnDate: orderData.status === 'cancelled' ? updatedAtIso : null
    };
  };

  // Format date for display - uses locale from router
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const locale = router.locale === 'en' ? 'en-GB' : 'sv-SE';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Hämta statustext baserat på status (colorblind-friendly palette)
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          text: t('orderStatus.statuses.pending'),
          color: 'bg-blue-100 text-blue-800',
          description: t('orderStatus.statusDescriptions.pending')
        };
      case 'received':
        return {
          text: t('orderStatus.statuses.received'),
          color: 'bg-purple-100 text-purple-800',
          description: t('orderStatus.statusDescriptions.received')
        };
      case 'processing':
        return {
          text: t('orderStatus.statuses.processing'),
          color: 'bg-amber-100 text-amber-800',
          description: t('orderStatus.statusDescriptions.processing')
        };
      case 'submitted':
        return {
          text: t('orderStatus.statuses.submitted'),
          color: 'bg-indigo-100 text-indigo-800',
          description: t('orderStatus.statusDescriptions.submitted')
        };
      case 'action-required':
        return {
          text: t('orderStatus.statuses.action-required'),
          color: 'bg-orange-100 text-orange-800',
          description: t('orderStatus.statusDescriptions.action-required')
        };
      case 'ready-for-return':
        return {
          text: t('orderStatus.statuses.ready-for-return'),
          color: 'bg-teal-100 text-teal-800',
          description: t('orderStatus.statusDescriptions.ready-for-return')
        };
      case 'completed':
        return {
          text: t('orderStatus.statuses.completed'),
          color: 'bg-gray-700 text-white',
          description: t('orderStatus.statusDescriptions.completed')
        };
      case 'cancelled':
        return {
          text: t('orderStatus.statuses.cancelled'),
          color: 'bg-gray-100 text-red-700',
          description: t('orderStatus.statusDescriptions.cancelled')
        };
      default:
        return {
          text: status,
          color: 'bg-gray-100 text-gray-800',
          description: t('orderStatus.statusDescriptions.default')
        };
    }
  };

  return (
    <>
      <Head>
        <title>{t('orderStatus.pageTitle')}</title>
        <meta 
          name="description" 
          content={t('orderStatus.pageDescription')} 
        />
      </Head>

      

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto mb-16 text-center">
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
            {t('orderStatus.title')}
          </h2>
          <p className="text-lg text-gray-600">
            {t('orderStatus.subtitle')}
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-heading font-bold text-gray-900 mb-6 text-center">
                {t('orderStatus.trackTitle')}
              </h3>

              <form onSubmit={checkOrderStatus} className="space-y-4">
                <div>
                  <label htmlFor="order-number" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('orderStatus.orderNumber')} *
                  </label>
                  <input
                    type="text"
                    id="order-number"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button"
                    placeholder="SWE000000"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('orderStatus.email')} *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button"
                    placeholder="exempel@mail.se"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-custom-button hover:bg-custom-button/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-button disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t('orderStatus.checking')}
                      </>
                    ) : (
                      t('orderStatus.check')
                    )}
                  </button>
                </div>
              </form>

              {orderStatus && (
                <div className="mt-8 border-t border-gray-200 pt-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">
                    {t('orderStatus.result')}
                  </h3>

                  <div className="bg-gray-50 rounded-lg p-6">
                    {/* Status Summary */}
                    <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center mb-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusText(orderStatus.status).color} mr-3`}>
                              {getStatusText(orderStatus.status).text}
                            </span>
                            <span className="text-sm text-gray-500 break-words">
                              {t('orderStatus.orderNumber')}: {orderStatus.orderNumber}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {getStatusText(orderStatus.status).description}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          {t('orderStatus.orderDate')}:
                        </p>
                        <p>{formatDate(orderStatus.createdAt)}</p>
                      </div>

                      {orderStatus.actualShipment && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            {t('orderStatus.shipmentDate')}:
                          </p>
                          <p>{orderStatus.actualShipment}</p>
                        </div>
                      )}

                      {orderStatus.trackingNumber && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            {t('orderStatus.trackingNumber')}:
                          </p>
                          <p className="break-words">{orderStatus.trackingNumber}</p>
                        </div>
                      )}

                      {orderStatus.actualDelivery && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            {t('orderStatus.deliveryDate')}:
                          </p>
                          <p>{orderStatus.actualDelivery}</p>
                        </div>
                      )}

                      {/* Return tracking information - only show when documents have been shipped */}
                      {orderStatus.returnTrackingNumber && ['shipped', 'delivered', 'completed', 'ready-for-return'].includes(orderStatus.status) && (
                        <>
                          <div className="col-span-2 border-t border-gray-200 pt-4 mt-4">
                            <h4 className="text-base font-medium text-gray-900 mb-3">
                              {t('orderStatus.returnInfo')}
                            </h4>
                          </div>

                          <div className="col-span-2">
                            <p className="text-sm text-gray-500 mb-1">
                              {t('orderStatus.returnTrackingNumber')}:
                            </p>
                            <p className="font-mono text-sm font-medium break-all">{orderStatus.returnTrackingNumber}</p>
                            {(orderStatus as any).returnTrackingUrl && (
                              <a 
                                href={(orderStatus as any).returnTrackingUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center mt-2 text-sm text-blue-600 hover:text-blue-800 underline break-words"
                              >
                                {t('orderStatus.trackShipment')} →
                              </a>
                            )}
                          </div>

                          {orderStatus.returnDate && (
                            <div>
                              <p className="text-sm text-gray-500 mb-1">
                                {t('orderStatus.returnDate')}:
                              </p>
                              <p>{orderStatus.returnDate}</p>
                            </div>
                          )}

                          <div className="col-span-2">
                            <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                              {t('orderStatus.returnInstructions')}
                            </p>
                          </div>
                        </>
                      )}

                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          {t('orderStatus.service')}:
                        </p>
                        <p className="break-words">
                          {Array.isArray(orderStatus.services)
                            ? orderStatus.services.map((service: string) => t(`services.${service}.title`) || service).join(', ')
                            : t(`services.${orderStatus.service}.title`) || orderStatus.service
                          }
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="text-base font-medium mb-4">
                        {t('orderStatus.progress')}
                      </h4>

                      <ol className="relative border-l border-gray-200 ml-3">
                        {orderStatus.steps.map((step: any, index: number) => (
                          <li key={index} className="mb-6 ml-6">
                            <span className={`absolute flex items-center justify-center w-6 h-6 rounded-full -left-3 ${
                              step.completed
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-200 text-gray-500'
                            }`}>
                              {step.completed ? (
                                <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <span className="text-xs">{index + 1}</span>
                              )}
                            </span>
                            <h5 className={`font-medium ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                              {step.name}
                            </h5>
                            {step.date && (
                              <p className="text-sm text-gray-500">
                                {formatDate(step.date)}
                              </p>
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="mt-6 border-t border-gray-200 pt-6">
                      <p className="text-sm text-gray-500">
                        {t('orderStatus.questions')}{' '}
                        <a href="/kontakt" className="text-primary-600 hover:text-primary-500">
                          {t('orderStatus.contactUs')}
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'sv', ['common'])),
    },
  };
};

export default OrderStatusPage;
