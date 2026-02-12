/**
 * Quote Response Page
 * 
 * Allows customers to review, accept, or decline a quote
 * sent by the admin from the Communication tab.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

interface QuoteLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  vatRate: number;
}

interface QuoteData {
  lineItems: QuoteLineItem[];
  totalAmount: number;
  message: string;
  status: 'sent' | 'accepted' | 'declined';
  createdAt: string;
  respondedAt?: string;
  declineReason?: string;
}

interface OrderData {
  orderNumber: string;
  customerName: string;
  customerType: string;
  locale: string;
}

export default function QuotePage() {
  const router = useRouter();
  const { token, action: urlAction } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  const isSwedish = order?.locale !== 'en';
  const isCompany = order?.customerType === 'company';

  useEffect(() => {
    if (!token) return;

    const fetchQuote = async () => {
      try {
        const response = await fetch(`/api/quote/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || (isSwedish ? 'Ett fel uppstod' : 'An error occurred'));
          return;
        }

        setQuote(data.quote);
        setOrder(data.order);

        // Check if already responded
        if (data.quote.status === 'accepted' || data.quote.status === 'declined') {
          setSubmitted(true);
          setSubmitResult({
            success: data.quote.status === 'accepted',
            message: data.quote.status === 'accepted'
              ? (data.order?.locale === 'en' ? 'Quote has been accepted!' : 'Offerten har godkänts!')
              : (data.order?.locale === 'en' ? 'Quote has been declined.' : 'Offerten har avböjts.')
          });
        }
      } catch (err) {
        setError('Could not load quote');
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [token]);

  // Handle URL action parameter (from email links)
  useEffect(() => {
    if (urlAction && quote && !submitted && !submitting) {
      if (urlAction === 'accept') {
        handleAccept();
      } else if (urlAction === 'decline') {
        setShowDeclineForm(true);
      }
    }
  }, [urlAction, quote, submitted, submitting]);

  const handleAccept = async () => {
    if (submitting || submitted) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/quote/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'An error occurred');
        return;
      }

      setSubmitted(true);
      setSubmitResult({ success: true, message: data.message });

      if (quote) {
        setQuote({ ...quote, status: 'accepted' });
      }
    } catch (err) {
      setError('Could not submit response');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (submitting || submitted) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/quote/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'decline', declineReason })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'An error occurred');
        return;
      }

      setSubmitted(true);
      setSubmitResult({ success: false, message: data.message });

      if (quote) {
        setQuote({ ...quote, status: 'declined' });
      }
    } catch (err) {
      setError('Could not submit response');
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

  // Already responded
  if (submitted && submitResult) {
    return (
      <>
        <Head>
          <title>{submitResult.success ? (isSwedish ? 'Offert godkänd' : 'Quote Accepted') : (isSwedish ? 'Offert avböjd' : 'Quote Declined')} | DOX Visumpartner</title>
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
                ? (isSwedish ? 'Tack för ditt svar!' : 'Thank you for your response!')
                : (isSwedish ? 'Offert avböjd' : 'Quote Declined')}
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

  return (
    <>
      <Head>
        <title>{isSwedish ? 'Offert' : 'Price Quote'} | DOX Visumpartner</title>
      </Head>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📋</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isSwedish ? 'Offert' : 'Price Quote'}
            </h1>
            <p className="text-gray-600">
              {isSwedish 
                ? 'Vänligen granska priserna nedan och godkänn eller avböj offerten.'
                : 'Please review the prices below and accept or decline the quote.'}
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

          {/* Admin message */}
          {quote?.message && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">💬</span>
                {isSwedish ? 'Meddelande' : 'Message'}
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap">{quote.message}</p>
            </div>
          )}

          {/* Price table */}
          {quote && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
              <div className="bg-teal-50 border-b border-teal-200 p-4">
                <h2 className="font-semibold text-teal-900 flex items-center">
                  <span className="mr-2">💰</span>
                  {isSwedish ? 'Prisspecifikation' : 'Price Specification'}
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {isSwedish ? 'Beskrivning' : 'Description'}
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {isSwedish ? 'Antal' : 'Qty'}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {isSwedish ? 'À-pris' : 'Unit Price'}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {isSwedish ? 'Belopp' : 'Amount'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.lineItems.map((item, idx) => {
                      const rate = (item.vatRate && item.vatRate > 0) ? (item.vatRate > 1 ? item.vatRate / 100 : item.vatRate) : 0;
                      const displayUnitPrice = isCompany ? item.unitPrice : Math.round(item.unitPrice * (1 + rate));
                      const displayTotal = isCompany ? item.total : Math.round(item.total * (1 + rate));
                      return (
                        <tr key={idx} className="border-b border-gray-100 last:border-b-0">
                          <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">{displayUnitPrice.toLocaleString()} kr</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{displayTotal.toLocaleString()} kr</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* VAT summary */}
              {(() => {
                const totalVat = quote.lineItems.reduce((sum, item) => {
                  const rate = (item.vatRate && item.vatRate > 0) ? (item.vatRate > 1 ? item.vatRate / 100 : item.vatRate) : 0;
                  return sum + Math.round(item.total * rate);
                }, 0);
                const totalInclVat = quote.totalAmount + totalVat;
                return (
                  <>
                    {isCompany && (
                      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 font-medium">{isSwedish ? 'Summa exkl. moms' : 'Subtotal excl. VAT'}</span>
                          <span className="text-gray-900 font-medium">{quote.totalAmount.toLocaleString()} kr</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">{isSwedish ? 'Moms' : 'VAT'} (25%)</span>
                          <span className="text-gray-700">{totalVat.toLocaleString()} kr</span>
                        </div>
                      </div>
                    )}
                    <div className="bg-teal-600 px-4 py-4 flex justify-between items-center">
                      <span className="text-white font-bold text-lg">
                        {isSwedish ? 'Totalbelopp inkl. moms' : 'Total incl. VAT'}
                      </span>
                      <span className="text-white font-bold text-2xl">
                        {totalInclVat.toLocaleString()} kr
                      </span>
                    </div>
                  </>
                );
              })()}

              <p className="text-xs text-gray-400 text-center py-2">
                {isCompany
                  ? (isSwedish ? 'Priser visas exkl. moms' : 'Prices shown excl. VAT')
                  : (isSwedish ? 'Priser visas inkl. moms' : 'Prices shown incl. VAT')}
              </p>
            </div>
          )}

          {/* Decline form */}
          {showDeclineForm && (
            <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 mb-6">
              <h2 className="font-semibold text-red-900 mb-3">
                {isSwedish ? 'Avböj offert' : 'Decline Quote'}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {isSwedish 
                  ? 'Vänligen berätta varför du avböjer offerten (valfritt):'
                  : 'Please let us know why you are declining the quote (optional):'}
              </p>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder={isSwedish ? 'Ange anledning...' : 'Enter reason...'}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeclineForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
                >
                  {isSwedish ? 'Avbryt' : 'Cancel'}
                </button>
                <button
                  onClick={handleDecline}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {submitting 
                    ? (isSwedish ? 'Skickar...' : 'Submitting...')
                    : (isSwedish ? 'Avböj offert' : 'Decline Quote')}
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!showDeclineForm && (
            <div className="space-y-3">
              <button
                onClick={handleAccept}
                disabled={submitting}
                className="w-full px-6 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {submitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isSwedish ? 'Godkänner...' : 'Accepting...'}
                  </span>
                ) : (
                  <>
                    <span className="mr-2">✓</span>
                    {isSwedish ? 'Godkänn offert' : 'Accept Quote'}
                  </>
                )}
              </button>

              <button
                onClick={() => setShowDeclineForm(true)}
                disabled={submitting}
                className="w-full px-6 py-4 bg-red-100 text-red-700 font-semibold rounded-xl hover:bg-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <span className="mr-2">✗</span>
                {isSwedish ? 'Avböj offert' : 'Decline Quote'}
              </button>
            </div>
          )}

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
