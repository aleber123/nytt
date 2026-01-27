/**
 * Visa Order Confirmation Page
 * Displays order confirmation after successful visa order submission
 */

import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import CountryFlag from '@/components/ui/CountryFlag';
import { getVisaOrderConfirmationByToken } from '@/firebase/visaOrderService';

// Order confirmation data from orderConfirmations collection
interface OrderConfirmation {
  orderId: string;
  orderType: string;
  orderNumber: string;
  destinationCountry: string;
  destinationCountryCode: string;
  nationality: string;
  nationalityCode: string;
  visaProduct: {
    name: string;
    nameEn?: string;
    visaType: 'e-visa' | 'sticker';
    entryType: 'single' | 'multiple';
    validityDays: number;
    processingDays: number;
    price: number;
  };
  departureDate: string;
  returnDate: string;
  passportNeededBy: string;
  totalPrice: number;
  pricingBreakdown?: {
    serviceFee?: number;
    embassyFee?: number;
    expressPrice?: number;
    urgentPrice?: number;
  };
  customerType: 'private' | 'company';
  customerInfo: {
    firstName?: string;
    lastName?: string;
    companyName?: string;
    email?: string;
    phone?: string;
  };
  returnAddress?: {
    firstName?: string;
    lastName?: string;
    companyName?: string;
    street?: string;
    postalCode?: string;
    city?: string;
    country?: string;
  };
  status: string;
}

// Translation helper for nationality names
const translateNationality = (nationality: string, locale: string): string => {
  if (locale !== 'en') return nationality;
  const translations: Record<string, string> = {
    'Svensk': 'Swedish',
    'Norsk': 'Norwegian',
    'Dansk': 'Danish',
    'Finsk': 'Finnish',
    'Tysk': 'German',
    'Brittisk': 'British',
    'Amerikansk': 'American',
    'Fransk': 'French',
    'Spansk': 'Spanish',
    'Italiensk': 'Italian',
    'Nederländsk': 'Dutch',
    'Belgisk': 'Belgian',
    'Schweizisk': 'Swiss',
    'Österrikisk': 'Austrian',
    'Polsk': 'Polish',
    'Tjeckisk': 'Czech',
    'Ungersk': 'Hungarian',
    'Portugisisk': 'Portuguese',
    'Grekisk': 'Greek',
    'Irländsk': 'Irish',
  };
  return translations[nationality] || nationality;
};

// Translation helper for visa product names
const translateVisaProductName = (name: string, locale: string): string => {
  if (locale !== 'en') return name;
  const translations: Record<string, string> = {
    'Korttidsvisum': 'Short-term Visa',
    'Långtidsvisum': 'Long-term Visa',
    'Turistvisum': 'Tourist Visa',
    'Affärsvisum': 'Business Visa',
    'Transitvisum': 'Transit Visa',
    'Studentvisum': 'Student Visa',
    'Arbetsvisum': 'Work Visa',
  };
  return translations[name] || name;
};

export default function VisaConfirmationPage() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [order, setOrder] = useState<OrderConfirmation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const locale = router.locale || 'sv';

  useEffect(() => {
    if (!router.isReady) return;

    const fetchOrder = async () => {
      const token = router.query.token as string;

      if (!token) {
        setOrder(null);
        setError(locale === 'en' ? 'Invalid confirmation link' : 'Ogiltig bekräftelselänk');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const orderData = await getVisaOrderConfirmationByToken(token);

        if (orderData) {
          setOrder(orderData as OrderConfirmation);
          setError(null);
        } else {
          setOrder(null);
          setError(locale === 'en' ? 'Order not found' : 'Beställningen hittades inte');
        }
      } catch (err) {
        setOrder(null);
        setError(locale === 'en' ? 'Error loading order' : 'Kunde inte ladda beställningen');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [router.isReady, router.query.token, locale]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString(locale === 'en' ? 'en-GB' : 'sv-SE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <Head>
        <title>{locale === 'en' ? 'Order Confirmation | Visa Partner' : 'Orderbekräftelse | Visumpartner'}</title>
        <meta name="description" content={locale === 'en' ? 'Your visa order confirmation' : 'Din visumbeställning är bekräftad'} />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <main className="bg-gray-50 py-16 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-custom-button mb-4"></div>
                <p className="text-gray-600">{locale === 'en' ? 'Loading order...' : 'Laddar beställning...'}</p>
              </div>
            ) : error ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <div className="text-red-500 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold mb-4">{locale === 'en' ? 'Error' : 'Fel'}</h1>
                <p className="text-gray-600 mb-6">{error}</p>
                <Link href="/visum" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-custom-button hover:bg-custom-button/90">
                  {locale === 'en' ? 'Back to Visa Services' : 'Tillbaka till Visumtjänster'}
                </Link>
              </div>
            ) : order ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                {/* Success Header */}
                <div className="text-center mb-12">
                  <div className="text-green-500 mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {locale === 'en' ? 'Thank you for your order!' : 'Tack för din beställning!'}
                  </h1>
                  <p className="text-xl text-gray-600">
                    {locale === 'en' 
                      ? 'We have received your visa application and will contact you shortly.' 
                      : 'Vi har mottagit din visumansökan och återkommer inom kort.'}
                  </p>
                </div>

                {/* Order Number */}
                <div className="bg-gray-50 rounded-lg p-6 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">
                        {locale === 'en' ? 'Order Number' : 'Ordernummer'}:
                      </span>
                      <span className="text-lg font-semibold text-gray-900">{order.orderNumber}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">
                        {locale === 'en' ? 'Status' : 'Status'}:
                      </span>
                      <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {locale === 'en' ? 'Pending' : 'Mottagen'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Visa Product Details */}
                <div className="border-t border-gray-200 pt-8 mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {locale === 'en' ? 'Visa Details' : 'Visumdetaljer'}
                  </h2>

                  <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{locale === 'en' && order.visaProduct?.nameEn ? order.visaProduct.nameEn : translateVisaProductName(order.visaProduct?.name || '', locale)}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                            order.visaProduct?.visaType === 'e-visa' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {order.visaProduct?.visaType === 'e-visa' ? 'E-Visa' : 'Sticker Visa'}
                          </span>
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
                            {order.visaProduct?.entryType === 'single' 
                              ? (locale === 'en' ? 'Single Entry' : 'Enkel inresa')
                              : (locale === 'en' ? 'Multiple Entry' : 'Flera inresor')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-gray-900">
                          {order.totalPrice?.toLocaleString()} kr
                        </span>
                        {/* Show fee breakdown if express or urgent */}
                        {(order.pricingBreakdown?.expressPrice || order.pricingBreakdown?.urgentPrice) && (
                          <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                            <div>{locale === 'en' ? 'Base' : 'Grund'}: {order.visaProduct?.price?.toLocaleString()} kr</div>
                            {order.pricingBreakdown?.expressPrice ? (
                              <div className="text-orange-600">
                                {locale === 'en' ? 'Express' : 'Express'}: +{order.pricingBreakdown.expressPrice.toLocaleString()} kr
                              </div>
                            ) : null}
                            {order.pricingBreakdown?.urgentPrice ? (
                              <div className="text-red-600">
                                {locale === 'en' ? 'Urgent' : 'Brådskande'}: +{order.pricingBreakdown.urgentPrice.toLocaleString()} kr
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">{locale === 'en' ? 'Validity' : 'Giltighet'}:</span>
                        <span className="ml-2 text-gray-900">{order.visaProduct?.validityDays} {locale === 'en' ? 'days' : 'dagar'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">{locale === 'en' ? 'Processing Time' : 'Handläggningstid'}:</span>
                        <span className="ml-2 text-gray-900">~{order.visaProduct?.processingDays} {locale === 'en' ? 'days' : 'dagar'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Destination & Nationality */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                        {locale === 'en' ? 'Destination' : 'Destination'}
                      </h3>
                      <div className="flex items-center">
                        <CountryFlag code={order.destinationCountryCode} size={32} />
                        <span className="ml-3 text-lg font-medium text-gray-900">{order.destinationCountry}</span>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                        {locale === 'en' ? 'Nationality' : 'Nationalitet'}
                      </h3>
                      <div className="flex items-center">
                        <CountryFlag code={order.nationalityCode} size={32} />
                        <span className="ml-3 text-lg font-medium text-gray-900">{translateNationality(order.nationality, locale)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Travel Dates */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                      {locale === 'en' ? 'Travel Dates' : 'Resdatum'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-gray-500 block">{locale === 'en' ? 'Departure' : 'Avresa'}</span>
                        <span className="font-medium text-gray-900">{formatDate(order.departureDate)}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 block">{locale === 'en' ? 'Return' : 'Hemresa'}</span>
                        <span className="font-medium text-gray-900">{formatDate(order.returnDate)}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 block">
                          {order.visaProduct?.visaType === 'e-visa' 
                            ? (locale === 'en' ? 'Visa Needed By' : 'Visum behövs senast')
                            : (locale === 'en' ? 'Passport Needed By' : 'Pass behövs senast')}
                        </span>
                        <span className="font-medium text-gray-900">{formatDate(order.passportNeededBy)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="border-t border-gray-200 pt-8 mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {locale === 'en' ? 'Contact Information' : 'Kontaktuppgifter'}
                  </h2>
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="space-y-3">
                      {order.customerInfo?.companyName && (
                        <p className="text-gray-700">
                          <span className="font-medium">{order.customerInfo.companyName}</span>
                        </p>
                      )}
                      <p className="text-gray-700">
                        <span className="font-medium">{order.customerInfo?.firstName} {order.customerInfo?.lastName}</span>
                      </p>
                      <p className="text-gray-700">
                        <span className="font-medium">{order.customerInfo?.email}</span>
                      </p>
                      <p className="text-gray-700">
                        <span className="font-medium">{order.customerInfo?.phone}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Shipping Info (for sticker visa) */}
                {order.visaProduct?.visaType === 'sticker' && order.returnAddress && (
                  <div className="border-t border-gray-200 pt-8 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                      {locale === 'en' ? 'Return Address' : 'Returadress'}
                    </h2>
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="space-y-2">
                        {order.returnAddress.companyName && (
                          <p className="text-gray-700 font-medium">{order.returnAddress.companyName}</p>
                        )}
                        <p className="text-gray-700">
                          {order.returnAddress.firstName} {order.returnAddress.lastName}
                        </p>
                        <p className="text-gray-700">{order.returnAddress.street}</p>
                        <p className="text-gray-700">
                          {order.returnAddress.postalCode} {order.returnAddress.city}
                        </p>
                        <p className="text-gray-700">{order.returnAddress.country}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Next Steps */}
                <div className="border-t border-gray-200 pt-8">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                    <div className="flex items-center mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-green-800">
                        {locale === 'en' ? 'Confirmation Email Sent' : 'Bekräftelsemail skickat'}
                      </h3>
                    </div>
                    <p className="text-green-700">
                      {locale === 'en' 
                        ? `A confirmation has been sent to ${order.customerInfo?.email}. Please check your inbox.`
                        : `En bekräftelse har skickats till ${order.customerInfo?.email}. Kontrollera din inkorg.`}
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3">
                      {locale === 'en' ? 'What happens next?' : 'Vad händer nu?'}
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-blue-700">
                      <li>{locale === 'en' ? 'We will review your order within 1 business day' : 'Vi granskar din beställning inom 1 arbetsdag'}</li>
                      <li>{locale === 'en' ? 'We will contact you with any required documents' : 'Vi kontaktar dig om eventuella dokument som behövs'}</li>
                      {order.visaProduct?.visaType === 'e-visa' ? (
                        <li>{locale === 'en' ? 'Your e-visa will be sent to your email when approved' : 'Ditt e-visum skickas till din e-post när det är godkänt'}</li>
                      ) : (
                        <>
                          <li>{locale === 'en' ? 'Send your passport to us (we will provide instructions)' : 'Skicka ditt pass till oss (vi skickar instruktioner)'}</li>
                          <li>{locale === 'en' ? 'We submit your application to the embassy' : 'Vi lämnar in din ansökan till ambassaden'}</li>
                          <li>{locale === 'en' ? 'Your passport with visa will be returned to you' : 'Ditt pass med visum skickas tillbaka till dig'}</li>
                        </>
                      )}
                    </ol>
                  </div>

                  <div className="text-center">
                    <Link 
                      href="/" 
                      className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-custom-button hover:bg-custom-button/90 transition-colors duration-200"
                    >
                      {locale === 'en' ? 'Back to Home' : 'Tillbaka till startsidan'}
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-card p-8 text-center">
                <h1 className="text-2xl font-bold mb-4">
                  {locale === 'en' ? 'Order Not Found' : 'Beställning hittades inte'}
                </h1>
                <p className="text-gray-600 mb-6">
                  {locale === 'en' 
                    ? 'We could not find the order you are looking for.'
                    : 'Vi kunde inte hitta beställningen du söker.'}
                </p>
                <Link href="/visum" className="inline-block px-6 py-2 bg-custom-button text-white rounded-md hover:bg-custom-button/90">
                  {locale === 'en' ? 'Back to Visa Services' : 'Tillbaka till Visumtjänster'}
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
