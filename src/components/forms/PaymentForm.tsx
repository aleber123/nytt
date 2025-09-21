import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';

interface PaymentFormProps {
  totalAmount: number;
  onSubmit: (paymentMethod: string) => void;
  onBack: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ totalAmount, onSubmit, onBack }) => {
  const { t } = useTranslation('common');
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardName, setCardName] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [cvc, setCvc] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Formatera kortnummer med mellanslag efter var fjärde siffra
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // Formatera utgångsdatum (MM/YY)
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    
    return v;
  };

  // Hantera kortinmatning
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCardNumber(e.target.value);
    setCardNumber(formattedValue);
  };

  // Hantera utgångsdatuminmatning
  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace('/', '');
    const formattedValue = formatExpiryDate(value);
    setExpiryDate(formattedValue);
  };

  // Validera formulär innan inlämning
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (paymentMethod === 'card') {
      if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
        newErrors.cardNumber = t('order.payment.errors.cardNumberInvalid');
      }

      if (!cardName) {
        newErrors.cardName = t('order.payment.errors.cardNameRequired');
      }

      if (!expiryDate || expiryDate.length < 5) {
        newErrors.expiryDate = t('order.payment.errors.expiryDateInvalid');
      }

      if (!cvc || cvc.length < 3) {
        newErrors.cvc = t('order.payment.errors.cvcInvalid');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Hantera formulärinlämning
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(paymentMethod);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">{t('order.payment.title')}</h2>
      <p className="text-gray-600 mb-8">{t('order.payment.description')}</p>

      <form onSubmit={handleSubmit}>
        <div className="mb-8">
          <fieldset>
            <legend className="sr-only">{t('order.payment.selectMethod')}</legend>
            <div className="space-y-4">
              {/* Kortbetalning */}
              <div className="relative border rounded-lg p-4 flex cursor-pointer focus-within:ring-2 focus-within:ring-primary-500">
                <input
                  id="payment-method-card"
                  name="payment-method"
                  type="radio"
                  className="h-4 w-4 mt-1 cursor-pointer text-primary-600 border-gray-300 focus:ring-primary-500"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  aria-labelledby="payment-method-card-label"
                />
                <label
                  htmlFor="payment-method-card"
                  className="ml-3 flex flex-col cursor-pointer"
                  id="payment-method-card-label"
                >
                  <span className="block text-sm font-medium text-gray-900">
                    {t('order.payment.card')}
                  </span>
                  <span className="block text-sm text-gray-500">
                    Visa, Mastercard, American Express
                  </span>
                  <div className="mt-2 flex space-x-2">
                    <img src="/images/visa.svg" alt="Visa" className="h-8" />
                    <img src="/images/mastercard.svg" alt="Mastercard" className="h-8" />
                    <img src="/images/amex.svg" alt="American Express" className="h-8" />
                  </div>
                </label>
              </div>

              {/* Swish */}
              <div className="relative border rounded-lg p-4 flex cursor-pointer focus-within:ring-2 focus-within:ring-primary-500">
                <input
                  id="payment-method-swish"
                  name="payment-method"
                  type="radio"
                  className="h-4 w-4 mt-1 cursor-pointer text-primary-600 border-gray-300 focus:ring-primary-500"
                  checked={paymentMethod === 'swish'}
                  onChange={() => setPaymentMethod('swish')}
                  aria-labelledby="payment-method-swish-label"
                />
                <label
                  htmlFor="payment-method-swish"
                  className="ml-3 flex flex-col cursor-pointer"
                  id="payment-method-swish-label"
                >
                  <span className="block text-sm font-medium text-gray-900">
                    {t('order.payment.swish')}
                  </span>
                  <span className="block text-sm text-gray-500">
                    Betala direkt med Swish
                  </span>
                  <div className="mt-2">
                    <img src="/images/swish.svg" alt="Swish" className="h-8" />
                  </div>
                </label>
              </div>

              {/* Faktura */}
              <div className="relative border rounded-lg p-4 flex cursor-pointer focus-within:ring-2 focus-within:ring-primary-500">
                <input
                  id="payment-method-invoice"
                  name="payment-method"
                  type="radio"
                  className="h-4 w-4 mt-1 cursor-pointer text-primary-600 border-gray-300 focus:ring-primary-500"
                  checked={paymentMethod === 'invoice'}
                  onChange={() => setPaymentMethod('invoice')}
                  aria-labelledby="payment-method-invoice-label"
                />
                <label
                  htmlFor="payment-method-invoice"
                  className="ml-3 flex flex-col cursor-pointer"
                  id="payment-method-invoice-label"
                >
                  <span className="block text-sm font-medium text-gray-900">
                    {t('order.payment.invoice')}
                  </span>
                  <span className="block text-sm text-gray-500">
                    Betala via faktura med 14 dagars betalningsvillkor
                  </span>
                </label>
              </div>
            </div>
          </fieldset>
        </div>

        {/* Kortbetalningsformulär */}
        {paymentMethod === 'card' && (
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium mb-4">{t('order.payment.cardDetails')}</h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="card-number" className="block text-sm font-medium text-gray-700">
                  {t('order.payment.cardNumber')}
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="card-number"
                    name="card-number"
                    autoComplete="cc-number"
                    className={`block w-full rounded-md shadow-sm ${
                      errors.cardNumber
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                    }`}
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    maxLength={19}
                    aria-invalid={errors.cardNumber ? 'true' : 'false'}
                    aria-describedby={errors.cardNumber ? 'card-number-error' : undefined}
                  />
                  {errors.cardNumber && (
                    <p className="mt-2 text-sm text-red-600" id="card-number-error">
                      {errors.cardNumber}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="card-name" className="block text-sm font-medium text-gray-700">
                  {t('order.payment.cardName')}
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="card-name"
                    name="card-name"
                    autoComplete="cc-name"
                    className={`block w-full rounded-md shadow-sm ${
                      errors.cardName
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                    }`}
                    placeholder="FÖRNAMN EFTERNAMN"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    aria-invalid={errors.cardName ? 'true' : 'false'}
                    aria-describedby={errors.cardName ? 'card-name-error' : undefined}
                  />
                  {errors.cardName && (
                    <p className="mt-2 text-sm text-red-600" id="card-name-error">
                      {errors.cardName}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="expiry-date" className="block text-sm font-medium text-gray-700">
                    {t('order.payment.expiryDate')}
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="expiry-date"
                      name="expiry-date"
                      autoComplete="cc-exp"
                      className={`block w-full rounded-md shadow-sm ${
                        errors.expiryDate
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                      }`}
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChange={handleExpiryDateChange}
                      maxLength={5}
                      aria-invalid={errors.expiryDate ? 'true' : 'false'}
                      aria-describedby={errors.expiryDate ? 'expiry-date-error' : undefined}
                    />
                    {errors.expiryDate && (
                      <p className="mt-2 text-sm text-red-600" id="expiry-date-error">
                        {errors.expiryDate}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="cvc" className="block text-sm font-medium text-gray-700">
                    {t('order.payment.cvc')}
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="cvc"
                      name="cvc"
                      autoComplete="cc-csc"
                      className={`block w-full rounded-md shadow-sm ${
                        errors.cvc
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                      }`}
                      placeholder="123"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/[^0-9]/g, ''))}
                      maxLength={4}
                      aria-invalid={errors.cvc ? 'true' : 'false'}
                      aria-describedby={errors.cvc ? 'cvc-error' : undefined}
                    />
                    {errors.cvc && (
                      <p className="mt-2 text-sm text-red-600" id="cvc-error">
                        {errors.cvc}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sammanfattning av betalning */}
        <div className="bg-primary-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-medium mb-4">{t('order.payment.summary')}</h3>
          <div className="flex justify-between font-medium">
            <span>{t('order.summary.total')}</span>
            <span>{totalAmount} kr</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>{t('order.summary.vat')}</span>
            <span>{Math.round(totalAmount * 0.25)} kr</span>
          </div>
        </div>

        {/* Säkerhetsinformation */}
        <div className="mb-8">
          <div className="flex items-center text-sm text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            {t('order.payment.securePayment')}
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
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {t('order.payment.completeOrder')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;
