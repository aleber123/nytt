import React, { useState } from 'react';
import { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/orderService';
import { Order } from '@/firebase/orderService';

interface OrderStatusProps {}

const OrderStatusPage: React.FC<OrderStatusProps> = () => {
  const { t } = useTranslation('common');
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [orderStatus, setOrderStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Real order status check using Firebase
  const checkOrderStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Validate input
    if (!orderNumber || !email) {
      setError(t('orderStatus.errors.missingFields') || 'Vänligen fyll i både ordernummer och e-post');
      setIsLoading(false);
      return;
    }
    
    try {
      // Query Firestore for the order
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef,
        where('id', '==', orderNumber),
        where('customerInfo.email', '==', email.toLowerCase())
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Try to find by just the order ID (for admin access or if email case is different)
        const orderByIdQuery = query(ordersRef, where('id', '==', orderNumber));
        const orderByIdSnapshot = await getDocs(orderByIdQuery);
        
        if (orderByIdSnapshot.empty) {
          setError(t('orderStatus.errors.notFound') || 'Ingen beställning hittades med angivet ordernummer och e-post');
          setIsLoading(false);
          return;
        }
        
        // Check if the email matches (case insensitive)
        const orderDoc = orderByIdSnapshot.docs[0];
        const orderData = orderDoc.data() as Order;
        
        if (orderData.customerInfo.email.toLowerCase() !== email.toLowerCase()) {
          setError(t('orderStatus.errors.notFound') || 'Ingen beställning hittades med angivet ordernummer och e-post');
          setIsLoading(false);
          return;
        }
        
        // Format the order data for display
        const formattedOrder = formatOrderForDisplay(orderDoc.id, orderData);
        setOrderStatus(formattedOrder);
      } else {
        // Format the order data for display
        const orderDoc = querySnapshot.docs[0];
        const orderData = orderDoc.data() as Order;
        const formattedOrder = formatOrderForDisplay(orderDoc.id, orderData);
        setOrderStatus(formattedOrder);
      }
    } catch (error) {
      console.error('Error checking order status:', error);
      setError(t('orderStatus.errors.technical') || 'Ett tekniskt fel uppstod. Försök igen senare.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format order data for display
  const formatOrderForDisplay = (orderId: string, orderData: Order) => {
    // Create steps based on order status
    const steps = [
      { 
        name: 'Beställning mottagen', 
        completed: true, 
        date: orderData.createdAt?.toDate().toISOString() 
      },
      { 
        name: 'Betalning bekräftad', 
        completed: ['processing', 'shipped', 'delivered'].includes(orderData.status), 
        date: ['processing', 'shipped', 'delivered'].includes(orderData.status) ? 
          orderData.updatedAt?.toDate().toISOString() : undefined 
      },
      { 
        name: 'Dokument under behandling', 
        completed: ['processing', 'shipped', 'delivered'].includes(orderData.status), 
        date: orderData.status === 'processing' ? 
          orderData.updatedAt?.toDate().toISOString() : undefined 
      },
      { 
        name: 'Dokument legaliserade', 
        completed: ['shipped', 'delivered'].includes(orderData.status), 
        date: orderData.status === 'shipped' ? 
          orderData.updatedAt?.toDate().toISOString() : undefined 
      },
      { 
        name: 'Dokument skickade', 
        completed: ['shipped', 'delivered'].includes(orderData.status), 
        date: orderData.status === 'shipped' ? 
          orderData.updatedAt?.toDate().toISOString() : undefined 
      },
      { 
        name: 'Levererade', 
        completed: orderData.status === 'delivered', 
        date: orderData.status === 'delivered' ? 
          orderData.updatedAt?.toDate().toISOString() : undefined 
      }
    ];
    
    // Calculate estimated delivery (7 days from order date)
    const createdDate = orderData.createdAt?.toDate();
    const estimatedDelivery = new Date(createdDate);
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);
    
    // Format the order for display
    return {
      orderNumber: orderId,
      status: orderData.status,
      createdAt: orderData.createdAt?.toDate().toISOString(),
      estimatedDelivery: estimatedDelivery.toISOString().split('T')[0],
      service: Array.isArray(orderData.services) ? orderData.services[0] : orderData.services,
      services: orderData.services,
      customer: {
        name: `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`,
        email: orderData.customerInfo.email
      },
      steps: steps,
      totalPrice: orderData.totalPrice
    };
  };

  // Formatera datum till läsbart format
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Hämta statustext baserat på status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'received':
        return { text: t('orderStatus.statuses.received') || 'Mottagen', color: 'bg-blue-100 text-blue-800' };
      case 'processing':
        return { text: t('orderStatus.statuses.processing') || 'Under behandling', color: 'bg-yellow-100 text-yellow-800' };
      case 'shipped':
        return { text: t('orderStatus.statuses.shipped') || 'Skickad', color: 'bg-purple-100 text-purple-800' };
      case 'delivered':
        return { text: t('orderStatus.statuses.delivered') || 'Levererad', color: 'bg-green-100 text-green-800' };
      default:
        return { text: status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <>
      <Head>
        <title>{t('orderStatus.pageTitle') || 'Orderstatus - Legaliseringstjänst'}</title>
        <meta 
          name="description" 
          content={t('orderStatus.pageDescription') || 'Kontrollera status på din beställning av legaliseringstjänster.'} 
        />
      </Head>

      <div className="bg-primary-700 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-white text-center">
            {t('orderStatus.title') || 'Kontrollera orderstatus'}
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-card p-6">
            <h2 className="text-xl font-medium text-gray-900 mb-6">
              {t('orderStatus.subtitle') || 'Ange ditt ordernummer och e-post för att kontrollera status'}
            </h2>
            
            <form onSubmit={checkOrderStatus} className="space-y-4">
              <div>
                <label htmlFor="order-number" className="block text-sm font-medium text-gray-700">
                  {t('orderStatus.orderNumber') || 'Ordernummer'} *
                </label>
                <input
                  type="text"
                  id="order-number"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="t.ex. ORD-12345"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  {t('orderStatus.email') || 'E-post'} *
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500"
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
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('orderStatus.checking') || 'Kontrollerar...'}
                    </>
                  ) : (
                    t('orderStatus.check') || 'Kontrollera status'
                  )}
                </button>
              </div>
            </form>
            
            {orderStatus && (
              <div className="mt-8 border-t border-gray-200 pt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-6">
                  {t('orderStatus.result') || 'Orderstatus'}
                </h3>
                
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        {t('orderStatus.orderNumber') || 'Ordernummer'}:
                      </p>
                      <p className="text-lg font-medium">{orderStatus.orderNumber}</p>
                    </div>
                    
                    <div className="mt-4 md:mt-0">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusText(orderStatus.status).color}`}>
                        {getStatusText(orderStatus.status).text}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        {t('orderStatus.orderDate') || 'Beställningsdatum'}:
                      </p>
                      <p>{formatDate(orderStatus.createdAt)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        {t('orderStatus.estimatedDelivery') || 'Beräknad leverans'}:
                      </p>
                      <p>{orderStatus.estimatedDelivery}</p>
                    </div>
                    
                    {orderStatus.actualShipment && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          {t('orderStatus.shipmentDate') || 'Skickad datum'}:
                        </p>
                        <p>{orderStatus.actualShipment}</p>
                      </div>
                    )}
                    
                    {orderStatus.trackingNumber && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          {t('orderStatus.trackingNumber') || 'Spårningsnummer'}:
                        </p>
                        <p>{orderStatus.trackingNumber}</p>
                      </div>
                    )}
                    
                    {orderStatus.actualDelivery && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          {t('orderStatus.deliveryDate') || 'Leveransdatum'}:
                        </p>
                        <p>{orderStatus.actualDelivery}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        {t('orderStatus.service') || 'Tjänst'}:
                      </p>
                      <p>
                        {Array.isArray(orderStatus.services) 
                          ? orderStatus.services.map(service => t(`services.${service}.title`) || service).join(', ')
                          : t(`services.${orderStatus.service}.title`) || orderStatus.service
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-base font-medium mb-4">
                      {t('orderStatus.progress') || 'Förlopp'}
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
                      {t('orderStatus.questions') || 'Har du frågor om din beställning?'}{' '}
                      <a href="/kontakt" className="text-primary-600 hover:text-primary-500">
                        {t('orderStatus.contactUs') || 'Kontakta oss'}
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            )}
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
