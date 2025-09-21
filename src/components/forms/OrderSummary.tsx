import React from 'react';
import { useTranslation } from 'next-i18next';

interface OrderSummaryProps {
  orderData: any;
  onSubmit: () => void;
  onBack: () => void;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ orderData, onSubmit, onBack }) => {
  const { t } = useTranslation('common');
  
  // Beräkna pris baserat på beställningsdata
  const calculatePrice = () => {
    let serviceFees = 0;
    let officialFees = 0;
    let additionalFees = 0;

    // Kontrollera om orderData.services eller orderData.service används
    const services = Array.isArray(orderData.services) ? orderData.services :
                    Array.isArray(orderData.service) ? orderData.service :
                    [orderData.service];

    // Beräkna priser baserat på alla valda tjänster
    services.forEach((service: string) => {
      switch (service) {
        case 'apostille':
          serviceFees += 100; // Service fee
          officialFees += 850; // Official fee
          break;
        case 'notarisering':
        case 'notarization':
          serviceFees += 100; // Service fee
          officialFees += 1200; // Official fee
          break;
        case 'ambassad':
        case 'embassy':
          serviceFees += 150; // Service fee
          officialFees += 1295; // Official fee
          break;
        case 'oversattning':
        case 'translation':
          serviceFees += 100; // Service fee
          officialFees += 1350; // Official fee
          break;
        case 'utrikesdepartementet':
        case 'ud':
          serviceFees += 100; // Service fee
          officialFees += 1650; // Official fee
          break;
        case 'chamber':
          serviceFees += 100; // Service fee
          officialFees += 2300; // Official fee
          break;
        default:
          serviceFees += 0;
          officialFees += 0;
      }
    });

    // Multiplicera med antal dokument
    const quantity = orderData.quantity || 1;
    serviceFees *= quantity;
    officialFees *= quantity;

    // Lägg till kostnad för expresstjänst om vald
    if (orderData.expedited) {
      additionalFees += 500;
    }

    // Lägg till kostnad för leveransmetod
    if (orderData.deliveryMethod === 'express') {
      additionalFees += 150;
    } else if (orderData.deliveryMethod === 'post') {
      additionalFees += 50;
    }

    // Pickup service fee
    if (orderData.pickupService) {
      additionalFees += 450;
    }

    // Scanned copies fee
    if (orderData.scannedCopies) {
      additionalFees += 200 * quantity;
    }

    return {
      serviceFees,
      officialFees,
      additionalFees,
      total: serviceFees + officialFees + additionalFees
    };
  };
  
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
  
  // Hämta priser för en specifik tjänst (separerade avgifter)
  const getServicePrices = (serviceId: string) => {
    switch (serviceId) {
      case 'apostille':
        return { serviceFee: 100, officialFee: 850 };
      case 'notarisering':
      case 'notarization':
        return { serviceFee: 100, officialFee: 1200 };
      case 'ambassad':
      case 'embassy':
        return { serviceFee: 150, officialFee: 1295 };
      case 'oversattning':
      case 'translation':
        return { serviceFee: 100, officialFee: 1350 };
      case 'utrikesdepartementet':
      case 'ud':
        return { serviceFee: 100, officialFee: 1650 };
      case 'chamber':
        return { serviceFee: 100, officialFee: 2300 };
      default:
        return { serviceFee: 0, officialFee: 0 };
    }
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
  
  const pricing = calculatePrice();
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
      
      <div className="bg-primary-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium mb-4">{t('order.summary.pricing')}</h3>

        <div className="space-y-3">
          {/* Service Fees Section */}
          <div className="bg-white/50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Serviceavgifter</h4>
            <div className="space-y-2">
              {Array.isArray(orderData.services) ? (
                orderData.services.map((service: string, index: number) => {
                  const prices = getServicePrices(service);
                  return (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{getServiceName(service)} ({orderData.quantity} {orderData.quantity > 1 ? t('common.items') : t('common.item')})</span>
                      <span>{(prices.serviceFee * orderData.quantity).toFixed(0)} kr</span>
                    </div>
                  );
                })
              ) : (
                <div className="flex justify-between text-sm">
                  <span>{getServiceName(orderData.services || orderData.service)} ({orderData.quantity} {orderData.quantity > 1 ? t('common.items') : t('common.item')})</span>
                  <span>{(getServicePrices(orderData.services || orderData.service).serviceFee * orderData.quantity).toFixed(0)} kr</span>
                </div>
              )}
            </div>
            <div className="flex justify-between font-medium border-t border-gray-200 pt-2 mt-2">
              <span>Total serviceavgifter</span>
              <span>{pricing.serviceFees} kr</span>
            </div>
          </div>

          {/* Official Fees Section */}
          <div className="bg-white/50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Officiella avgifter</h4>
            <div className="space-y-2">
              {Array.isArray(orderData.services) ? (
                orderData.services.map((service: string, index: number) => {
                  const prices = getServicePrices(service);
                  return (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{getServiceName(service)} ({orderData.quantity} {orderData.quantity > 1 ? t('common.items') : t('common.item')})</span>
                      <span>{(prices.officialFee * orderData.quantity).toFixed(0)} kr</span>
                    </div>
                  );
                })
              ) : (
                <div className="flex justify-between text-sm">
                  <span>{getServiceName(orderData.services || orderData.service)} ({orderData.quantity} {orderData.quantity > 1 ? t('common.items') : t('common.item')})</span>
                  <span>{(getServicePrices(orderData.services || orderData.service).officialFee * orderData.quantity).toFixed(0)} kr</span>
                </div>
              )}
            </div>
            <div className="flex justify-between font-medium border-t border-gray-200 pt-2 mt-2">
              <span>Total officiella avgifter</span>
              <span>{pricing.officialFees} kr</span>
            </div>
          </div>

          {/* Additional Fees Section */}
          {(pricing.additionalFees > 0) && (
            <div className="bg-white/50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Tilläggstjänster</h4>
              <div className="space-y-2">
                {orderData.expedited && (
                  <div className="flex justify-between text-sm">
                    <span>Express-service</span>
                    <span>500 kr</span>
                  </div>
                )}

                {orderData.deliveryMethod === 'express' && (
                  <div className="flex justify-between text-sm">
                    <span>Expressleverans</span>
                    <span>150 kr</span>
                  </div>
                )}

                {orderData.deliveryMethod === 'post' && (
                  <div className="flex justify-between text-sm">
                    <span>Postleverans</span>
                    <span>50 kr</span>
                  </div>
                )}

                {orderData.pickupService && (
                  <div className="flex justify-between text-sm">
                    <span>Dokumenthämtning</span>
                    <span>Från 450 kr</span>
                  </div>
                )}

                {orderData.scannedCopies && (
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
              <span>{pricing.total} kr</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>Moms (25%)</span>
              <span>{Math.round(pricing.total * 0.25)} kr</span>
            </div>
          </div>
        </div>
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
