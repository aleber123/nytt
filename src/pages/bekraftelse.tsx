import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getOrderById } from '@/services/hybridOrderService';

// Define Order interface locally
interface Order {
  id?: string;
  orderNumber?: string;
  services: string[];
  documentType: string;
  country: string;
  quantity: number;
  expedited: boolean;
  documentSource: string;
  pickupService: boolean;
  pickupAddress?: {
    street: string;
    postalCode: string;
    city: string;
  };
  scannedCopies: boolean;
  returnService: string;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    postalCode: string;
    city: string;
  };
  deliveryMethod: string;
  paymentMethod: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  totalPrice: number;
  invoiceReference?: string;
  additionalNotes?: string;
  uploadedFiles?: any[];
  createdAt?: any;
  updatedAt?: any;
}

interface ConfirmationPageProps {
  orderId?: string;
}

export default function ConfirmationPage({ orderId }: ConfirmationPageProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError(t('order.error.noOrderId'));
        setLoading(false);
        return;
      }

      try {
        const orderData = await getOrderById(orderId);
        if (orderData) {
          setOrder(orderData);
        } else {
          setError(t('order.error.orderNotFound'));
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(t('order.error.fetchFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, t]);

  // Function to get service name
  const getServiceName = (serviceId: string) => {
    switch (serviceId) {
      case 'apostille':
        return t('services.apostille.title');
      case 'notarisering':
        return t('services.notarization.title');
      case 'ambassad':
        return t('services.embassy.title');
      case 'oversattning':
        return t('services.translation.title');
      case 'utrikesdepartementet':
        return 'Utrikesdepartementet';
      default:
        return serviceId;
    }
  };

  return (
    <>
      <Head>
        <title>{t('confirmation.title')} | Legaliseringstjänst</title>
        <meta name="description" content={t('confirmation.description')} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="bg-gray-50 py-10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {loading ? (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                <p>{t('common.loading')}</p>
              </div>
            ) : error ? (
              <div className="bg-white rounded-lg shadow-card p-8 text-center">
                <div className="text-red-500 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold mb-4">{t('confirmation.error')}</h1>
                <p className="text-gray-600 mb-6">{error}</p>
                <Link href="/" className="inline-block px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                  {t('common.backToHome')}
                </Link>
              </div>
            ) : order ? (
              <div className="bg-white rounded-lg shadow-card p-8">
                <div className="text-center mb-8">
                  <div className="text-green-500 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold">{t('confirmation.thankYou')}</h1>
                  <p className="text-gray-600 mt-2">{t('confirmation.orderReceived')}</p>
                </div>

                <div className="border-t border-gray-200 pt-6 mb-6">
                  <h2 className="text-lg font-semibold mb-4">{t('confirmation.orderDetails')}</h2>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">{t('confirmation.orderNumber')}:</span>
                      <span className="font-medium">{order.orderNumber || order.id}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('confirmation.orderStatus')}:</span>
                      <span className="font-medium capitalize">{order.status}</span>
                    </div>
                  </div>
                  
                  <h3 className="font-medium mb-2">{t('confirmation.services')}:</h3>
                  <ul className="list-disc list-inside mb-4 pl-2">
                    {Array.isArray(order.services) ? (
                      order.services.map((service, index) => (
                        <li key={index} className="text-gray-700">{getServiceName(service)}</li>
                      ))
                    ) : (
                      <li className="text-gray-700">{getServiceName(order.services as unknown as string)}</li>
                    )}
                  </ul>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <h3 className="font-medium mb-2">{t('confirmation.customerInfo')}:</h3>
                      <p className="text-gray-700">{order.customerInfo.firstName} {order.customerInfo.lastName}</p>
                      <p className="text-gray-700">{order.customerInfo.email}</p>
                      <p className="text-gray-700">{order.customerInfo.phone}</p>
                      {order.invoiceReference && (
                        <p className="text-gray-700 mt-2">
                          <span className="font-medium">Fakturareferens:</span> {order.invoiceReference}
                        </p>
                      )}
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">{t('confirmation.deliveryAddress')}:</h3>
                      <p className="text-gray-700">{order.customerInfo.address}</p>
                      <p className="text-gray-700">{order.customerInfo.postalCode} {order.customerInfo.city}</p>
                    </div>
                  </div>

                  {/* Additional Order Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-3">
                      <h3 className="font-medium">Orderdetaljer:</h3>
                      <div className="text-sm space-y-1">
                        <p className="text-gray-700">
                          <span className="font-medium">Dokumenttyp:</span> {
                            order.documentType === 'birthCertificate' ? 'Födelsebevis' :
                            order.documentType === 'marriageCertificate' ? 'Vigselbevis' :
                            order.documentType === 'diploma' ? 'Examensbevis' :
                            order.documentType === 'commercial' ? 'Handelsdokument' :
                            order.documentType === 'powerOfAttorney' ? 'Fullmakt' : 'Annat dokument'
                          }
                        </p>
                        <p className="text-gray-700">
                          <span className="font-medium">Antal dokument:</span> {order.quantity} st
                        </p>
                        <p className="text-gray-700">
                          <span className="font-medium">Dokumentkälla:</span> {
                            order.documentSource === 'original' ? 'Originaldokument' : 'Uppladdade kopior'
                          }
                        </p>
                        {order.expedited && (
                          <p className="text-gray-700">
                            <span className="font-medium">Expressbehandling:</span> Ja
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-medium">Tjänster:</h3>
                      <div className="text-sm space-y-1">
                        {order.scannedCopies && (
                          <p className="text-gray-700">
                            <span className="font-medium">Scannade kopior:</span> Ja (+{200 * order.quantity} kr)
                          </p>
                        )}
                        {order.pickupService && (
                          <p className="text-gray-700">
                            <span className="font-medium">Dokumenthämtning:</span> Ja (+450 kr)
                          </p>
                        )}
                        {order.returnService && (
                          <p className="text-gray-700">
                            <span className="font-medium">Returfrakt:</span> {order.returnService}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pickup Address */}
                  {order.pickupService && order.pickupAddress && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                      <h3 className="font-medium text-orange-800 mb-2">📍 Hämtadress:</h3>
                      <p className="text-orange-700">{order.pickupAddress.street}</p>
                      <p className="text-orange-700">{order.pickupAddress.postalCode} {order.pickupAddress.city}</p>
                      <p className="text-orange-600 text-sm mt-1">Vi kontaktar dig inom 24 timmar för att boka hämtning.</p>
                    </div>
                  )}

                  {/* Additional Notes */}
                  {order.additionalNotes && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <h3 className="font-medium text-blue-800 mb-2">📝 Ytterligare information:</h3>
                      <p className="text-blue-700 whitespace-pre-wrap">{order.additionalNotes}</p>
                    </div>
                  )}

                  {/* Uploaded Files */}
                  {order.documentSource === 'upload' && order.uploadedFiles && order.uploadedFiles.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                      <h3 className="font-medium text-green-800 mb-2">📎 Uppladdade filer:</h3>
                      <div className="space-y-1">
                        {order.uploadedFiles.map((file: any, index: number) => (
                          <p key={index} className="text-green-700 text-sm">
                            • {file.name || `Dokument ${index + 1}`} ({file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Okänd storlek'})
                          </p>
                        ))}
                      </div>
                      <p className="text-green-600 text-sm mt-2">Filer har sparats och kommer att bearbetas.</p>
                    </div>
                  )}
                  
                </div>
                
                <div className="border-t border-gray-200 pt-6 text-center">
                  <p className="text-gray-600 mb-6">{t('confirmation.emailSent')}</p>
                  
                  {/* Invoice-specific information */}
                  {order.paymentMethod === 'invoice' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                      <h3 className="font-medium text-blue-800 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 10l1.293-1.293z" clipRule="evenodd" />
                        </svg>
                        Fakturainformation
                      </h3>
                      <p className="text-gray-700 mb-2">En faktura har skickats till din e-postadress: <span className="font-medium">{order.customerInfo.email}</span></p>
                      <p className="text-gray-700 mb-2">Betalningsvillkor: 14 dagar</p>
                      <p className="text-gray-700">Betalningsinformation finns i fakturan.</p>
                    </div>
                  )}
                  
                  <div className="flex justify-center">
                    <Link href="/" className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                      {t('common.backToHome')}
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-card p-8 text-center">
                <h1 className="text-2xl font-bold mb-4">{t('confirmation.noOrder')}</h1>
                <p className="text-gray-600 mb-6">{t('confirmation.noOrderDescription')}</p>
                <Link href="/" className="inline-block px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                  {t('common.backToHome')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, query }) => {
  const { orderId } = query;
  
  return {
    props: {
      ...(await serverSideTranslations(locale || 'sv', ['common'])),
      orderId: orderId || null,
    },
  };
};
