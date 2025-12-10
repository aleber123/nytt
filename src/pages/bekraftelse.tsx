import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
// Defer importing Firebase-dependent service to client to avoid SSR issues

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

export function ConfirmationPage() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    const fetchOrder = async () => {
      const oid = (router.query.orderId as string) || '';
      const token = (router.query.token as string) || '';

      if (!oid && !token) {
        setOrder(null);
        setError(t('confirmation.noOrderDescription'));
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const hybridOrderService = (await import('@/services/hybridOrderService')).default;
        const { getOrderById, getOrderConfirmationByToken } = hybridOrderService;

        let orderData: any = null;

        // 1) Försök först med hemlig länk via token (orderConfirmations)
        if (token && typeof getOrderConfirmationByToken === 'function') {
          orderData = await getOrderConfirmationByToken(token);
        }

        // 2) Fallback: om inget hittades via token, försök med orderId (för gamla länkar eller dev/mock-läge)
        if (!orderData && oid && typeof getOrderById === 'function') {
          orderData = await getOrderById(oid);
        }

        if (orderData) {
          setOrder(orderData);
          setError(null);
        } else {
          setOrder(null);
          setError(t('confirmation.noOrderDescription'));
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setOrder(null);
        setError(t('confirmation.error'));
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [router.isReady, router.query.orderId, router.query.token, t]);

  // Function to get localized service name
  const getServiceName = (serviceId: string) => {
    // Normalize legacy/internal IDs to canonical service keys
    let key: string;
    switch (serviceId) {
      case 'apostille':
        key = 'apostille';
        break;
      case 'notarisering':
      case 'notarization':
        key = 'notarization';
        break;
      case 'ambassad':
      case 'embassy':
        key = 'embassy';
        break;
      case 'oversattning':
      case 'translation':
        key = 'translation';
        break;
      case 'utrikesdepartementet':
      case 'ud':
        key = 'ud';
        break;
      case 'chamber':
        key = 'chamber';
        break;
      default:
        key = serviceId;
        break;
    }

    // Map canonical keys to i18n titles
    switch (key) {
      case 'apostille':
        return t('services.apostille.title', 'Apostille');
      case 'notarization':
        return t('services.notarization.title', 'Notarisering');
      case 'embassy':
        return t('services.embassy.title', 'Ambassadlegalisering');
      case 'translation':
        return t('services.translation.title', 'Auktoriserad översättning');
      case 'ud':
        return t('services.ud.title', 'Utrikesdepartementets legalisering');
      case 'chamber':
        return t('services.chamber.title', 'Handelskammarens legalisering');
      default:
        return serviceId;
    }
  };

  // Function to get human readable return shipping name
  const getReturnServiceName = (serviceId: string) => {
    switch (serviceId) {
      case 'postnord-rek':
        return 'PostNord REK';
      case 'postnord-express':
        return 'PostNord Express';
      case 'dhl-sweden':
        return 'DHL Sweden';
      case 'dhl-europe':
        return 'DHL Europe';
      case 'dhl-worldwide':
        return 'DHL Worldwide';
      case 'dhl-pre-12':
        return 'DHL Pre 12';
      case 'dhl-pre-9':
        return 'DHL Pre 9';
      case 'stockholm-city':
        return 'Stockholm City Courier';
      case 'stockholm-express':
        return 'Stockholm Express';
      case 'stockholm-sameday':
        return 'Stockholm Same Day';
      default:
        return serviceId;
    }
  };

  return (
    <>
      <Head>
        <title>{t('confirmation.title')} | Legaliseringstjänst</title>
        <meta
          name="description"
          content={t('confirmation.description')}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      

      <main className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-custom-button mb-4"></div>
                <p className="text-gray-600">{t('confirmation.loading')}</p>
              </div>
            ) : error ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <div className="text-red-500 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-heading font-bold mb-4">{t('confirmation.error')}</h1>
                <p className="text-gray-600 mb-6">{error}</p>
                <Link href="/" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-custom-button hover:bg-custom-button/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-button">
                  {t('common.backToHome')}
                </Link>
              </div>
            ) : order ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="text-center mb-12">
                  <div className="text-green-500 mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h1 className="text-3xl font-heading font-bold text-gray-900 mb-4">
                    {t('confirmation.thankYou')}
                  </h1>
                  <p className="text-xl text-gray-600">
                    {t('confirmation.orderReceived')}
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-8 mb-8">
                  <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6">{t('confirmation.orderDetails')}</h2>

                  <div className="bg-gray-50 rounded-lg p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-500 block mb-1">{t('confirmation.orderNumber')}:</span>
                        <span className="text-lg font-semibold text-gray-900">{order.orderNumber || order.id}</span>
                      </div>

                      <div>
                        <span className="text-sm text-gray-500 block mb-1">{t('confirmation.orderStatus')}:</span>
                        <span className="text-lg font-semibold text-gray-900 capitalize">{order.status}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">{t('confirmation.services')}:</h3>
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <ul className="space-y-2">
                        {Array.isArray(order.services) ? (
                          order.services.map((service, index) => (
                            <li key={index} className="flex items-center text-gray-700">
                              <svg className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              {getServiceName(service)}
                            </li>
                          ))
                        ) : (
                          <li className="flex items-center text-gray-700">
                            <svg className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {getServiceName(order.services as unknown as string)}
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">{t('confirmation.customerInfo')}:</h3>
                      <div className="space-y-3">
                        <p className="text-gray-700">
                          <span className="font-medium">{order.customerInfo.firstName} {order.customerInfo.lastName}</span>
                        </p>
                        <p className="text-gray-700">
                          <span className="font-medium">{order.customerInfo.email}</span>
                        </p>
                        <p className="text-gray-700">
                          <span className="font-medium">{order.customerInfo.phone}</span>
                        </p>
                        {order.invoiceReference && (
                          <p className="text-gray-700">
                            <span className="font-medium">Fakturareferens:</span> {order.invoiceReference}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">{t('confirmation.deliveryAddress')}:</h3>
                      <div className="space-y-3">
                        <p className="text-gray-700">{order.customerInfo.address}</p>
                        <p className="text-gray-700">{order.customerInfo.postalCode} {order.customerInfo.city}</p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Order Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">{t('confirmation.orderDetails')}:</h3>
                      <div className="space-y-3">
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

                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">{t('confirmation.additionalServices')}:</h3>
                      <div className="space-y-3">
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
                            <span className="font-medium">Returfrakt:</span> {getReturnServiceName(order.returnService)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pickup Address */}
                  {order.pickupService && order.pickupAddress && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
                      <h3 className="text-lg font-heading font-semibold text-orange-800 mb-3">📍 {t('confirmation.pickupAddress')}:</h3>
                      <div className="space-y-2">
                        <p className="text-orange-700 font-medium">{order.pickupAddress.street}</p>
                        <p className="text-orange-700 font-medium">{order.pickupAddress.postalCode} {order.pickupAddress.city}</p>
                        <p className="text-orange-600 text-sm mt-3">Vi kontaktar dig inom 24 timmar för att boka hämtning.</p>
                      </div>
                    </div>
                  )}

                  {/* Additional Notes */}
                  {order.additionalNotes && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                      <h3 className="text-lg font-heading font-semibold text-blue-800 mb-3">📝 {t('confirmation.additionalInfo')}:</h3>
                      <p className="text-blue-700 whitespace-pre-wrap">{order.additionalNotes}</p>
                    </div>
                  )}

                  {/* Uploaded Files */}
                  {order.documentSource === 'upload' && order.uploadedFiles && order.uploadedFiles.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
                      <h3 className="text-lg font-heading font-semibold text-green-800 mb-3">📎 {t('confirmation.uploadedFiles')}:</h3>
                      <div className="space-y-2">
                        {order.uploadedFiles.map((file: any, index: number) => (
                          <p key={index} className="text-green-700">
                            • {file.name || `Dokument ${index + 1}`} ({file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Okänd storlek'})
                          </p>
                        ))}
                      </div>
                      <p className="text-green-600 text-sm mt-3">Filer har sparats och kommer att bearbetas.</p>
                    </div>
                  )}
                  
                </div>
                
                <div className="border-t border-gray-200 pt-8">
                  <div className="text-center mb-8">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                      <div className="flex items-center justify-center mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <h3 className="text-lg font-heading font-semibold text-green-800">{t('confirmation.emailConfirmationTitle')}</h3>
                      </div>
                      <p className="text-green-700">
                        {t('confirmation.emailSent')}
                      </p>
                    </div>
                  </div>

                  {/* Invoice-specific information */}
                  {order.paymentMethod === 'invoice' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                      <div className="flex items-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-lg font-heading font-semibold text-blue-800">{t('confirmation.invoiceInfo')}</h3>
                      </div>
                      <div className="space-y-3">
                        <p className="text-gray-700">En faktura kommer skickats till din e-postadress: <span className="font-medium">{order.customerInfo.email}</span></p>
                        <p className="text-gray-700">Betalningsvillkor: <span className="font-medium">14 dagar</span></p>
                        <p className="text-gray-700">Betalningsinformation finns i fakturan.</p>
                      </div>
                    </div>
                  )}

                  <div className="text-center">
                    <Link href="/" className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-custom-button hover:bg-custom-button/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-button transition-colors duration-200">
                      {t('common.backToHome')}
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-card p-8 text-center">
                <h1 className="text-2xl font-bold mb-4">{t('confirmation.noOrder')}</h1>
                <p className="text-gray-600 mb-6">
                  {t('confirmation.noOrderDescription')}
                </p>
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

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'sv', ['common'])),
    },
  };
};

export default ConfirmationPage;
