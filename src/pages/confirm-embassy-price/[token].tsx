/**
 * Embassy Price Confirmation Page
 * 
 * Allows customers to confirm or decline the embassy official fee
 * before the order proceeds to embassy legalization.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

interface ConfirmationData {
  confirmedEmbassyPrice: number;
  confirmedTotalPrice: number;
  originalTotalPrice: number;
  originalPricingBreakdown: any[];
  confirmed: boolean;
  declined: boolean;
  confirmedAt?: string;
  declinedAt?: string;
  countryCode: string;
}

interface OrderData {
  orderNumber: string;
  customerName: string;
  country: string;
  services: string[];
  locale: string;
}

export default function ConfirmEmbassyPricePage() {
  const router = useRouter();
  const { token, action: urlAction } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationData | null>(null);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);

  const isSwedish = order?.locale !== 'en';

  useEffect(() => {
    if (!token) return;

    const fetchConfirmation = async () => {
      try {
        const response = await fetch(`/api/embassy-price-confirmation/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Ett fel uppstod');
          return;
        }

        setConfirmation(data.confirmation);
        setOrder(data.order);

        // Check if already confirmed or declined
        if (data.confirmation.confirmed || data.confirmation.declined) {
          setSubmitted(true);
          setSubmitResult({
            success: data.confirmation.confirmed,
            message: data.confirmation.confirmed 
              ? (data.order?.locale === 'en' ? 'Price has been confirmed!' : 'Priset har bekräftats!')
              : (data.order?.locale === 'en' ? 'Order has been declined.' : 'Beställningen har avböjts.')
          });
        }
      } catch (err) {
        setError('Kunde inte hämta bekräftelseinformation');
      } finally {
        setLoading(false);
      }
    };

    fetchConfirmation();
  }, [token]);

  // Handle URL action parameter (from email links)
  useEffect(() => {
    if (urlAction && confirmation && !submitted && !submitting) {
      if (urlAction === 'confirm') {
        handleSubmit('confirm');
      } else if (urlAction === 'decline') {
        // Show decline confirmation dialog instead of auto-declining
        const shouldDecline = window.confirm(
          isSwedish 
            ? 'Är du säker på att du vill avböja beställningen? Detta kan inte ångras.'
            : 'Are you sure you want to decline the order? This cannot be undone.'
        );
        if (shouldDecline) {
          handleSubmit('decline');
        }
      }
    }
  }, [urlAction, confirmation, submitted, submitting]);

  const handleSubmit = async (action: 'confirm' | 'decline') => {
    if (submitting || submitted) return;

    // Confirm decline action
    if (action === 'decline') {
      const shouldDecline = window.confirm(
        isSwedish 
          ? 'Är du säker på att du vill avböja beställningen? Detta kan inte ångras.'
          : 'Are you sure you want to decline the order? This cannot be undone.'
      );
      if (!shouldDecline) return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/embassy-price-confirmation/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ett fel uppstod');
        return;
      }

      setSubmitted(true);
      setSubmitResult({
        success: action === 'confirm',
        message: data.message
      });

      // Update local state
      if (confirmation) {
        setConfirmation({
          ...confirmation,
          confirmed: action === 'confirm',
          declined: action === 'decline'
        });
      }
    } catch (err) {
      setError('Kunde inte skicka bekräftelse');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {isSwedish ? 'Ett fel uppstod' : 'An error occurred'}
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/" className="inline-block px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition">
            {isSwedish ? 'Gå till startsidan' : 'Go to homepage'}
          </Link>
        </div>
      </div>
    );
  }

  if (submitted && submitResult) {
    return (
      <>
        <Head>
          <title>{submitResult.success ? (isSwedish ? 'Pris bekräftat' : 'Price Confirmed') : (isSwedish ? 'Beställning avböjd' : 'Order Declined')} | DOX Visumpartner</title>
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 text-center">
            <div className={`w-16 h-16 ${submitResult.success ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
              {submitResult.success ? (
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {submitResult.success 
                ? (isSwedish ? 'Tack för din bekräftelse!' : 'Thank you for your confirmation!')
                : (isSwedish ? 'Beställning avböjd' : 'Order Declined')}
            </h1>
            <p className="text-gray-600 mb-6">{submitResult.message}</p>
            
            {order && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-500 mb-1">{isSwedish ? 'Ordernummer' : 'Order number'}</p>
                <p className="font-bold text-lg text-gray-900">#{order.orderNumber}</p>
              </div>
            )}

            <div className="space-y-3">
              {order && (
                <Link 
                  href={`/orderstatus?order=${order.orderNumber}`}
                  className="block w-full px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition"
                >
                  {isSwedish ? 'Följ din order' : 'Track your order'}
                </Link>
              )}
              <Link href="/" className="block w-full px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition">
                {isSwedish ? 'Gå till startsidan' : 'Go to homepage'}
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const priceDifference = (confirmation?.confirmedTotalPrice || 0) - (confirmation?.originalTotalPrice || 0);

  return (
    <>
      <Head>
        <title>{isSwedish ? 'Bekräfta ambassadavgift' : 'Confirm Embassy Fee'} | DOX Visumpartner</title>
      </Head>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💰</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isSwedish ? 'Bekräfta ambassadavgift' : 'Confirm Embassy Fee'}
            </h1>
            <p className="text-gray-600">
              {isSwedish 
                ? 'Vänligen granska och godkänn det uppdaterade priset för din beställning.'
                : 'Please review and approve the updated price for your order.'}
            </p>
          </div>

          {/* Order info */}
          {order && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">{isSwedish ? 'Ordernummer' : 'Order number'}</span>
                <span className="font-bold text-teal-600">#{order.orderNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{isSwedish ? 'Kund' : 'Customer'}</span>
                <span className="font-medium text-gray-900">{order.customerName}</span>
              </div>
            </div>
          )}

          {/* Price summary */}
          {confirmation && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
              <div className="bg-green-50 border-b border-green-200 p-4">
                <h2 className="font-semibold text-green-900 flex items-center">
                  <span className="mr-2">💰</span>
                  {isSwedish ? 'Prissammanfattning' : 'Price Summary'}
                </h2>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Embassy fee */}
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">
                      {isSwedish ? 'Ambassadavgift (officiell)' : 'Embassy fee (official)'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {isSwedish ? 'Bekräftat pris' : 'Confirmed price'}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {confirmation.confirmedEmbassyPrice.toLocaleString()} kr
                  </span>
                </div>

                {/* Previous total */}
                <div className="flex justify-between items-center py-2 text-gray-500">
                  <span>{isSwedish ? 'Tidigare angivet belopp' : 'Previously stated amount'}</span>
                  <span>{confirmation.originalTotalPrice.toLocaleString()} kr</span>
                </div>

                {/* Difference */}
                <div className={`flex justify-between items-center py-2 ${priceDifference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  <span>{isSwedish ? 'Skillnad' : 'Difference'}</span>
                  <span className="font-medium">
                    {priceDifference > 0 ? '+' : ''}{priceDifference.toLocaleString()} kr
                  </span>
                </div>

                {/* New total */}
                <div className="bg-green-100 -mx-6 px-6 py-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-green-900">
                      {isSwedish ? 'Nytt totalbelopp' : 'New total amount'}
                    </span>
                    <span className="text-2xl font-bold text-green-900">
                      {confirmation.confirmedTotalPrice.toLocaleString()} kr
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <span className="text-xl mr-3">⚠️</span>
              <div>
                <p className="font-medium text-amber-900 mb-1">
                  {isSwedish ? 'Viktigt' : 'Important'}
                </p>
                <p className="text-sm text-amber-800">
                  {isSwedish 
                    ? 'Genom att godkänna bekräftar du att du accepterar det nya totalbeloppet för din beställning. Om du avböjer kommer beställningen att avbrytas.'
                    : 'By approving, you confirm that you accept the new total amount for your order. If you decline, the order will be cancelled.'}
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleSubmit('confirm')}
              disabled={submitting}
              className="w-full px-6 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {submitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isSwedish ? 'Bekräftar...' : 'Confirming...'}
                </span>
              ) : (
                <>
                  <span className="mr-2">✓</span>
                  {isSwedish ? 'Godkänn och fortsätt' : 'Approve and continue'}
                </>
              )}
            </button>

            <button
              onClick={() => handleSubmit('decline')}
              disabled={submitting}
              className="w-full px-6 py-4 bg-red-100 text-red-700 font-semibold rounded-xl hover:bg-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <span className="mr-2">✗</span>
              {isSwedish ? 'Avböj beställning' : 'Decline order'}
            </button>
          </div>

          {/* Contact info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-2">
              {isSwedish ? 'Har du frågor? Kontakta oss:' : 'Have questions? Contact us:'}
            </p>
            <p className="text-sm">
              <a href="mailto:info@doxvl.se" className="text-teal-600 hover:underline">info@doxvl.se</a>
              {' • '}
              <a href="tel:+4684094190" className="text-teal-600 hover:underline">08-409 419 00</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
