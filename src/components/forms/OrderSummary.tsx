import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { calculateOrderPrice } from '@/firebase/pricingService';

interface OrderSummaryProps {
  orderData: any;
  onSubmit: () => void;
  onBack: () => void;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ orderData, onSubmit, onBack }) => {
  const { t } = useTranslation('common');
  const [pricing, setPricing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate price using the dynamic pricing service
  useEffect(() => {
    const calculatePrice = async () => {
      try {
        setLoading(true);
        setError(null);

        // Prepare order data for pricing calculation
        const pricingData = {
          country: orderData.country,
          services: Array.isArray(orderData.services) ? orderData.services :
                   Array.isArray(orderData.service) ? orderData.service :
                   [orderData.service],
          quantity: orderData.quantity || 1,
          expedited: orderData.expedited,
          deliveryMethod: orderData.deliveryMethod,
          returnService: orderData.returnService,
          returnServices: orderData.returnServices,
          scannedCopies: orderData.scannedCopies,
          pickupService: orderData.pickupService,
          pickupMethod: orderData.pickupMethod,
          premiumPickup: orderData.premiumPickup
        };

        const result = await calculateOrderPrice(pricingData);
        setPricing(result);
      } catch (err) {
        console.error('Error calculating price:', err);
        setError('Failed to calculate pricing. Please try again.');
        // Fallback to basic calculation
        setPricing({
          basePrice: 0,
          additionalFees: 0,
          totalPrice: 0,
          breakdown: []
        });
      } finally {
        setLoading(false);
      }
    };

    if (orderData) {
      calculatePrice();
    }
  }, [orderData]);
  
  // Hämta tjänstnamn baserat på ID
  const getServiceName = (serviceId: string) => {
    switch (serviceId) {
      case 'apostille':
        return 'Apostille';
      case 'notarisering':
      case 'notarization':
        return 'Notarisering';
      case 'ambassad':
      case 'embassy':
        return 'Ambassadlegalisering';
      case 'oversattning':
      case 'translation':
        return 'Auktoriserad översättning';
      case 'utrikesdepartementet':
      case 'ud':
        return 'Utrikesdepartementet';
      case 'chamber':
        return 'Handelskammaren';
      default:
        return serviceId;
    }
  };

  // Helper function to get service description
  const getServiceDescription = (serviceType: string) => {
    const descriptions: { [key: string]: string } = {
      'apostille': 'Apostille',
      'notarisering': 'Notarisering',
      'notarization': 'Notarisering',
      'ambassad': 'Ambassadlegalisering',
      'embassy': 'Ambassadlegalisering',
      'oversattning': 'Översättning',
      'translation': 'Översättning',
      'utrikesdepartementet': 'Utrikesdepartementet',
      'ud': 'Utrikesdepartementet',
      'chamber': 'Handelskammaren',
      'express': 'Expresstillägg',
      'return_service': 'Returfrakt',
      'scanned_copies': 'Skannade kopior',
      'pickup_service': 'Dokumenthämtning'
    };

    return descriptions[serviceType] || serviceType;
  };
  
  
  // Hämta dokumenttyp baserat på ID
  const getDocumentTypeName = (documentTypeId: string) => {
    switch (documentTypeId) {
      case 'birth-certificate':
        return t('documents.birthCertificate');
      case 'marriage-certificate':
        return t('documents.marriageCertificate');
      case 'diploma':
        return t('documents.diploma');
      case 'commercial-documents':
        return t('documents.commercialDocuments');
      case 'power-of-attorney':
        return t('documents.powerOfAttorney');
      case 'other':
        return t('documents.other');
      default:
        return documentTypeId;
    }
  };
  
  // Hämta leveransmetod baserat på ID
  const getDeliveryMethodName = (deliveryMethodId: string) => {
    switch (deliveryMethodId) {
      case 'digital':
        return t('order.form.deliveryDigital');
      case 'post':
        return t('order.form.deliveryPost');
      case 'express':
        return t('order.form.deliveryExpress');
      default:
        return deliveryMethodId;
    }
  };
  
  // Beräkna leveranstid baserat på beställningsdata
  const getEstimatedDelivery = () => {
    let baseDays = 0;
    
    // Grundtid baserat på tjänst
    switch (orderData.service) {
      case 'apostille':
        baseDays = 5;
        break;
      case 'notarisering':
        baseDays = 3;
        break;
      case 'ambassad':
        baseDays = 10;
        break;
      case 'oversattning':
        baseDays = 7;
        break;
      default:
        baseDays = 5;
    }
    
    // Minska tid för expresstjänst om vald
    if (orderData.expedited) {
      baseDays = Math.max(2, Math.floor(baseDays / 2));
    }
    
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + baseDays);
    
    // Formatera datum till läsbart format
    return deliveryDate.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const estimatedDelivery = getEstimatedDelivery();

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">{t('order.summary.title')}</h2>
      <p className="text-gray-600 mb-8">{t('order.summary.description')}</p>
      
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium mb-4">{t('order.summary.orderDetails')}</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">{t('order.summary.service')}:</span>
            <span className="font-medium">
              {Array.isArray(orderData.services) ?
                orderData.services.map((service: string) => getServiceName(service)).join(', ') :
                getServiceName(orderData.services || orderData.service)
              }
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">{t('order.summary.documentType')}:</span>
            <span className="font-medium">{getDocumentTypeName(orderData.documentType)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">{t('order.summary.quantity')}:</span>
            <span className="font-medium">{orderData.quantity}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">{t('order.summary.expedited')}:</span>
            <span className="font-medium">{orderData.expedited ? t('common.yes') : t('common.no')}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">{t('order.summary.deliveryMethod')}:</span>
            <span className="font-medium">{getDeliveryMethodName(orderData.deliveryMethod)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">{t('order.summary.estimatedDelivery')}:</span>
            <span className="font-medium">{estimatedDelivery}</span>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium mb-4">{t('order.summary.customerInfo')}</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">{t('order.summary.name')}:</span>
            <span className="font-medium">{orderData.customerInfo.firstName} {orderData.customerInfo.lastName}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">{t('order.summary.email')}:</span>
            <span className="font-medium">{orderData.customerInfo.email}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">{t('order.summary.phone')}:</span>
            <span className="font-medium">{orderData.customerInfo.phone}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">{t('order.summary.address')}:</span>
            <span className="font-medium">{orderData.customerInfo.address}, {orderData.customerInfo.postalCode} {orderData.customerInfo.city}</span>
          </div>
        </div>
      </div>
      
      {/* Process Explanation */}
      <div className="bg-blue-50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium mb-4 text-blue-900">Vad ingår i din beställning?</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>Process:</strong> Dina {orderData.quantity} dokument kommer att legaliseras enligt följande steg för destinationen {orderData.country === 'GB' ? 'Storbritannien' : 'det valda landet'}:
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            {Array.isArray(orderData.services) ?
              orderData.services.map((service: string, index: number) => (
                <li key={service}>
                  {getServiceDescription(service)} - officiell legalisering
                </li>
              )) :
              <li>{getServiceDescription(orderData.services || orderData.service)} - officiell legalisering</li>
            }
          </ol>
          <p className="mt-3">
            <strong>Leverans:</strong> Dina legaliserade dokument returneras enligt valt fraktalternativ.
          </p>
        </div>
      </div>

      <div className="bg-primary-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium mb-4">{t('order.summary.pricing')}</h3>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-gray-600">Beräknar pris...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : pricing ? (
          <div className="space-y-3">
            {/* Base Price Section */}
            <div className="bg-white/50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Legaliseringskostnader</h4>
              <div className="text-xs text-gray-600 mb-3">
                Alla tjänster debiteras per dokument. För {orderData.quantity} dokument blir det:
              </div>
              <div className="space-y-2">
                {pricing.breakdown && pricing.breakdown
                  .filter((item: any) => !['return_service', 'scanned_copies', 'pickup_service'].includes(item.service))
                  .map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {getServiceDescription(item.service)}
                        <span className="text-gray-500 ml-1">
                          ({Math.round((item.basePrice || item.fee || 0) / item.quantity)} kr × {item.quantity} {item.quantity > 1 ? 'dokument' : 'dokument'})
                        </span>
                      </span>
                      <span>{item.basePrice || item.fee || 0} kr</span>
                    </div>
                  ))}
              </div>
              <div className="flex justify-between font-medium border-t border-gray-200 pt-2 mt-2">
                <span>Total legaliseringskostnad</span>
                <span>{pricing.basePrice} kr</span>
              </div>
            </div>

            {/* Additional Fees Section */}
            {(pricing.additionalFees > 0) && (
              <div className="bg-white/50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Tilläggstjänster</h4>
                <div className="space-y-2">
                  {pricing.breakdown && pricing.breakdown
                    .filter((item: any) => item.service !== 'apostille' && item.service !== 'notarization' && item.service !== 'embassy' && item.service !== 'translation' && item.service !== 'ud' && item.service !== 'chamber')
                    .map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{getServiceDescription(item.service)}</span>
                        <span>{item.fee || item.basePrice || 0} kr</span>
                      </div>
                    ))}

                  {orderData.expedited && !pricing.breakdown?.some((item: any) => item.service?.includes('express')) && (
                    <div className="flex justify-between text-sm">
                      <span>Express-service</span>
                      <span>500 kr</span>
                    </div>
                  )}

                  {orderData.pickupService && !pricing.breakdown?.some((item: any) => item.service?.includes('pickup')) && (
                    <div className="flex justify-between text-sm">
                      <span>Dokumenthämtning</span>
                      <span>450 kr</span>
                    </div>
                  )}

                  {orderData.scannedCopies && !pricing.breakdown?.some((item: any) => item.service?.includes('scanned')) && (
                    <div className="flex justify-between text-sm">
                      <span>Skannade kopior ({orderData.quantity} st)</span>
                      <span>{(200 * orderData.quantity).toFixed(0)} kr</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between font-medium border-t border-gray-200 pt-2 mt-2">
                  <span>Total tilläggstjänster</span>
                  <span>{pricing.additionalFees} kr</span>
                </div>
              </div>
            )}

            {/* Total Section */}
            <div className="border-t-2 border-gray-300 pt-4 mt-4">
              <div className="flex justify-between font-bold text-lg">
                <span>Totalbelopp</span>
                <span>{pricing.totalPrice} kr</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>Moms (25%)</span>
                <span>{Math.round(pricing.totalPrice * 0.25)} kr</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Kunde inte beräkna pris
          </div>
        )}
      </div>
      
      <div className="flex justify-between pt-5">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {t('common.back')}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {t('common.continue')}
        </button>
      </div>
    </div>
  );
};

export default OrderSummary;
