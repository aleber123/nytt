/**
 * Visa Step 10: Review and Submit
 * Final review of order before submission
 */

import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { StepContainer } from '../shared/StepContainer';
import { VisaOrderAnswers } from './types';
import { CheckCircleIcon, PencilIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { createVisaOrder, getVisaOrder } from '@/firebase/visaOrderService';
import { generateVisaConfirmationEmail } from '../templates/visaConfirmationEmail';

interface Props {
  answers: VisaOrderAnswers;
  onUpdate: (updates: Partial<VisaOrderAnswers>) => void;
  onBack: () => void;
  onGoToStep: (step: number) => void;
  isEVisa?: boolean;
}

const VisaStep10Review: React.FC<Props> = ({ answers, onUpdate, onBack, onGoToStep, isEVisa = false }) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!termsAccepted || !answers.selectedVisaProduct) return;
    
    setIsSubmitting(true);
    
    try {
      // Get customer info from billingInfo (where CustomerInfoForm saves data)
      const customerName = answers.billingInfo?.companyName 
        || `${answers.billingInfo?.firstName || ''} ${answers.billingInfo?.lastName || ''}`.trim()
        || `${answers.returnAddress?.firstName || ''} ${answers.returnAddress?.lastName || ''}`.trim();
      const customerEmail = answers.billingInfo?.email || answers.returnAddress?.email || '';
      const customerPhone = answers.billingInfo?.phone || answers.returnAddress?.phone || '';
      
      // Create visa order using the new service - returns { orderId, token }
      const orderResult = await createVisaOrder({
        // Destination & nationality
        destinationCountry: answers.destinationCountry,
        destinationCountryCode: answers.destinationCountryCode,
        nationality: answers.nationality,
        nationalityCode: answers.nationalityCode,
        
        // Selected visa product
        visaProduct: {
          id: answers.selectedVisaProduct.id,
          name: answers.selectedVisaProduct.name,
          category: answers.selectedVisaProduct.category,
          visaType: answers.selectedVisaProduct.visaType,
          entryType: answers.selectedVisaProduct.entryType,
          validityDays: answers.selectedVisaProduct.validityDays,
          price: answers.selectedVisaProduct.price,
          processingDays: answers.selectedVisaProduct.processingDays,
        },
        
        // Travel dates
        departureDate: answers.departureDate,
        returnDate: answers.returnDateVisa,
        passportNeededBy: answers.passportNeededBy,
        
        // Traveler count
        travelerCount: 1,
        
        // Shipping (only for sticker visa)
        ...(isEVisa ? {} : {
          pickupService: answers.pickupService,
          pickupMethod: answers.pickupMethod,
          pickupAddress: answers.pickupAddress,
          returnService: answers.returnService,
          returnAddress: answers.returnAddress,
        }),
        
        // Customer info
        customerType: answers.customerType as 'private' | 'company' || 'private',
        customerInfo: {
          firstName: answers.billingInfo?.firstName || answers.returnAddress?.firstName,
          lastName: answers.billingInfo?.lastName || answers.returnAddress?.lastName,
          companyName: answers.billingInfo?.companyName || answers.returnAddress?.companyName,
          email: customerEmail,
          phone: customerPhone,
          address: answers.billingInfo?.street,
          postalCode: answers.billingInfo?.postalCode,
          city: answers.billingInfo?.city,
          country: answers.billingInfo?.country,
        },
        billingInfo: answers.billingInfo,
        
        // Additional info
        invoiceReference: answers.invoiceReference,
        additionalNotes: answers.additionalNotes,
        
        // Pricing
        totalPrice: answers.selectedVisaProduct.price,
        pricingBreakdown: {
          serviceFee: answers.selectedVisaProduct.serviceFee || 0,
          embassyFee: answers.selectedVisaProduct.embassyFee || 0,
        },
        
        // Locale
        locale: router.locale || 'sv',
      });
      
      const { orderId: createdOrderId, token: confirmationToken } = orderResult;
      
      setOrderId(createdOrderId);
      setIsSubmitted(true);
      
      // Fetch the created order to get full data for email
      const createdOrder = await getVisaOrder(createdOrderId);
      
      // Send confirmation email to customer
      if (createdOrder && customerEmail) {
        try {
          const customerEmailHtml = generateVisaConfirmationEmail({
            order: createdOrder,
            locale: router.locale || 'sv'
          });
          
          const customerEmailData = {
            name: customerName || 'Visumkund',
            email: customerEmail,
            subject: router.locale === 'en' 
              ? `Visa Order Confirmation – ${createdOrderId}` 
              : `Orderbekräftelse – ${createdOrderId}`,
            message: customerEmailHtml,
            orderId: createdOrderId,
            createdAt: Timestamp.now(),
            status: 'pending'
          };
          
          const emailsRef = collection(db, 'customerEmails');
          await addDoc(emailsRef, customerEmailData);
        } catch (emailError) {
          // Don't fail the order if email fails
        }
      }
      
      // Send notification email to business
      try {
        const businessEmailData = {
          name: customerName || 'Visumkund',
          email: 'info@doxvl.se,info@visumpartner.se',
          subject: `Ny visumbeställning ${createdOrderId}: ${answers.destinationCountry}`,
          message: `
Ny visumbeställning mottagen!

Order: ${createdOrderId}
Produkt: ${answers.selectedVisaProduct.name}
Typ: ${isEVisa ? 'E-Visum' : 'Sticker Visum'}

Destination: ${answers.destinationCountry}
Nationalitet: ${answers.nationality}
Giltighet: ${answers.selectedVisaProduct.validityDays} dagar
Inresor: ${answers.selectedVisaProduct.entryType === 'single' ? 'Single entry' : answers.selectedVisaProduct.entryType === 'double' ? 'Double entry' : 'Multiple entry'}

Avresa: ${answers.departureDate}
Hemresa: ${answers.returnDateVisa}
Behöver visum senast: ${answers.passportNeededBy}

Kund: ${customerName}
E-post: ${customerEmail}
Telefon: ${customerPhone}

Serviceavgift: ${answers.selectedVisaProduct.serviceFee || 0} kr
Ambassadavgift: ${answers.selectedVisaProduct.embassyFee || 0} kr
Totalt: ${answers.selectedVisaProduct.price} kr
          `.trim(),
          createdAt: Timestamp.now(),
          status: 'queued'
        };
        
        const emailsRef = collection(db, 'customerEmails');
        await addDoc(emailsRef, businessEmailData);
      } catch (emailError) {
        // Don't fail the order if email fails
      }
      
      // Trigger save customer info event (for "Save my information" checkbox)
      window.dispatchEvent(new Event('saveCustomerInfo'));
      
      toast.success(t('visaOrder.step10.successToast', 'Beställning skickad!'));
      
      // Redirect to confirmation page with secure token
      router.push(`/visum/bekraftelse?token=${confirmationToken}`);
      
    } catch (error) {
      toast.error(t('visaOrder.step10.errorToast', 'Kunde inte skicka beställning. Försök igen.'));
      setIsSubmitting(false);
    }
  };

  const locale = router.locale || 'sv';

  // Full screen loading overlay during submission (matching legalization flow)
  if (isSubmitting) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-900/70 to-black/80 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl px-6 sm:px-10 py-6 sm:py-8 max-w-md mx-4 text-center space-y-6 animate-fade-in">
          {/* Animated Logo/Icon */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Outer ring */}
              <div className="w-20 h-20 rounded-full border-4 border-gray-200"></div>
              {/* Spinning ring */}
              <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-custom-button animate-spin"></div>
              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-8 h-8 text-custom-button" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {locale === 'en' ? 'Processing Your Visa Order' : 'Behandlar din visumbeställning'}
            </h2>
            <p className="text-gray-500 text-sm">
              {locale === 'en' ? 'Please wait while we secure your order' : 'Vänligen vänta medan vi säkrar din beställning'}
            </p>
          </div>

          {/* Progress steps */}
          <div className="space-y-3 text-left bg-gray-50 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">
                {locale === 'en' ? 'Validating information' : 'Validerar information'}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-custom-button rounded-full flex items-center justify-center animate-pulse">
                <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <span className="text-sm text-gray-700 font-medium">
                {locale === 'en' ? 'Creating your visa order...' : 'Skapar din visumbeställning...'}
              </span>
            </div>
            <div className="flex items-center space-x-3 opacity-50">
              <div className="flex-shrink-0 w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">3</span>
              </div>
              <span className="text-sm text-gray-500">
                {locale === 'en' ? 'Sending confirmation' : 'Skickar bekräftelse'}
              </span>
            </div>
          </div>

          {/* Warning message */}
          <div className="flex items-center justify-center space-x-2 text-amber-600 bg-amber-50 rounded-lg py-3 px-4">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm font-medium">
              {locale === 'en' ? 'Do not close this window' : 'Stäng inte detta fönster'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const sections: { title: string; step: number; items: { label: string; value: string | undefined }[] }[] = [
    {
      title: t('visaOrder.step10.travelInfo', 'Reseinformation'),
      step: 1,
      items: [
        { label: t('visaOrder.summary.destination', 'Destination'), value: answers.destinationCountry },
        { label: t('visaOrder.summary.nationality', 'Nationalitet'), value: answers.nationality },
      ],
    },
    {
      title: t('visaOrder.step10.visaProduct', 'Visumprodukt'),
      step: 3,
      items: [
        { label: t('visaOrder.summary.product', 'Produkt'), value: answers.selectedVisaProduct?.name },
        { label: t('visaOrder.summary.visaType', 'Visumtyp'), value: answers.selectedVisaProduct?.visaType === 'e-visa' ? 'E-Visa' : 'Sticker Visa' },
        { label: t('visaOrder.summary.entryType', 'Inresor'), value: answers.selectedVisaProduct?.entryType === 'single' 
          ? (locale === 'sv' ? 'Enkelinresa' : 'Single entry') 
          : answers.selectedVisaProduct?.entryType === 'double' 
            ? (locale === 'sv' ? 'Dubbelinresa' : 'Double entry') 
            : (locale === 'sv' ? 'Flerresor' : 'Multiple entry') },
        { label: t('visaOrder.summary.validity', 'Giltighet'), value: answers.selectedVisaProduct ? `${answers.selectedVisaProduct.validityDays} ${locale === 'sv' ? 'dagar' : 'days'}` : undefined },
        { label: t('visaOrder.summary.serviceFee', 'Serviceavgift'), value: answers.selectedVisaProduct?.serviceFee ? `${answers.selectedVisaProduct.serviceFee.toLocaleString()} kr` : undefined },
        { label: t('visaOrder.summary.embassyFee', 'Ambassadavgift'), value: answers.selectedVisaProduct?.embassyFee ? `${answers.selectedVisaProduct.embassyFee.toLocaleString()} kr` : undefined },
        ...(answers.expressRequired && answers.selectedVisaProduct?.expressPrice ? [{ label: t('visaOrder.summary.expressFee', 'Expressavgift'), value: `+${answers.selectedVisaProduct.expressPrice.toLocaleString()} kr` }] : []),
        { label: t('visaOrder.summary.totalPrice', 'Totalt'), value: answers.selectedVisaProduct ? `${(answers.selectedVisaProduct.price + (answers.expressRequired ? (answers.selectedVisaProduct.expressPrice || 0) : 0)).toLocaleString()} kr` : undefined },
      ],
    },
    {
      title: t('visaOrder.step10.dates', 'Datum'),
      step: 4,
      items: [
        { label: t('visaOrder.summary.departure', 'Avresa'), value: answers.departureDate },
        { label: t('visaOrder.summary.return', 'Hemresa'), value: answers.returnDateVisa },
        { label: isEVisa 
          ? (locale === 'sv' ? 'Behöver visumet senast' : 'Visa needed by') 
          : (locale === 'sv' ? 'Behöver passet senast' : 'Passport needed by'), 
          value: answers.passportNeededBy },
      ],
    },
  ];

  // Add shipping section only for sticker visa
  if (!isEVisa) {
    sections.push({
      title: t('visaOrder.step10.delivery', 'Leverans'),
      step: 6,
      items: [
        { label: t('visaOrder.step7.title', 'Hämtning'), value: answers.pickupService ? t('visaOrder.step7.yesPickup.title', 'Ja, hämta mitt pass') : t('visaOrder.step7.noPickup.title', 'Nej, jag skickar själv') },
        { label: t('visaOrder.step8.title', 'Retur'), value: answers.returnService || '-' },
      ],
    });

    if (answers.returnAddress?.street) {
      sections.push({
        title: t('visaOrder.step10.returnAddress', 'Leveransadress'),
        step: 8,
        items: [
          { label: t('visaOrder.step9.firstNameLabel', 'Namn'), value: `${answers.returnAddress.firstName || ''} ${answers.returnAddress.lastName || ''}`.trim() },
          { label: t('visaOrder.step9.streetLabel', 'Adress'), value: answers.returnAddress.street },
          { label: t('visaOrder.step9.cityLabel', 'Ort'), value: `${answers.returnAddress.postalCode || ''} ${answers.returnAddress.city || ''}`.trim() },
        ],
      });
    }
  }

  // Add customer info section
  const customerName = answers.billingInfo?.companyName 
    || `${answers.billingInfo?.firstName || ''} ${answers.billingInfo?.lastName || ''}`.trim();
  const customerEmail = answers.billingInfo?.email || '';
  const customerPhone = answers.billingInfo?.phone || '';
  
  if (customerName || customerEmail) {
    sections.push({
      title: t('visaOrder.step10.customerInfo', 'Kontaktuppgifter'),
      step: 9,
      items: [
        { label: t('visaOrder.summary.name', 'Namn'), value: customerName },
        { label: t('visaOrder.summary.email', 'E-post'), value: customerEmail },
        { label: t('visaOrder.summary.phone', 'Telefon'), value: customerPhone },
        ...(answers.billingInfo?.street ? [{ label: t('visaOrder.summary.address', 'Adress'), value: `${answers.billingInfo.street}, ${answers.billingInfo.postalCode} ${answers.billingInfo.city}` }] : []),
      ],
    });
  }

  return (
    <StepContainer
      title={t('visaOrder.step10.title', 'Granska din beställning')}
      subtitle={t('visaOrder.step10.subtitle', 'Kontrollera att allt stämmer innan du skickar')}
      onBack={onBack}
      showNext={false}
    >
      <div className="space-y-6">
        {sections.map((section, idx) => (
          <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">{section.title}</h3>
              <button
                onClick={() => onGoToStep(section.step)}
                className="text-custom-button hover:text-custom-button/80 text-sm flex items-center gap-1"
              >
                <PencilIcon className="h-4 w-4" />
                {t('visaOrder.step10.edit', 'Ändra')}
              </button>
            </div>
            <div className="px-4 py-3 space-y-2">
              {section.items.map((item, itemIdx) => (
                <div key={itemIdx} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.label}:</span>
                  <span className="font-medium text-gray-900">{item.value || '-'}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Terms acceptance */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="w-5 h-5 mt-0.5 text-custom-button rounded focus:ring-custom-button"
            />
            <span className="text-sm text-gray-700">
              {t('visaOrder.step10.termsText', 'Jag godkänner')} {' '}
              <a href="/villkor" target="_blank" className="text-custom-button hover:underline">
                {t('visaOrder.step10.termsLink', 'allmänna villkor')}
              </a>
              {' '} {t('visaOrder.step10.termsAnd', 'och')} {' '}
              <a href="/integritetspolicy" target="_blank" className="text-custom-button hover:underline">
                {t('visaOrder.step10.privacyLink', 'integritetspolicy')}
              </a>
            </span>
          </label>
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!termsAccepted || isSubmitting}
          className={`w-full py-3 px-6 rounded-md font-medium transition-colors ${
            termsAccepted && !isSubmitting
              ? 'bg-custom-button text-white hover:bg-custom-button/90'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSubmitting 
            ? t('visaOrder.step10.submitting', 'Skickar...') 
            : t('visaOrder.step10.submitButton', 'Skicka beställning')}
        </button>

        <p className="text-xs text-gray-500 text-center">
          {t('visaOrder.step10.contactNote', 'Vi kontaktar dig inom 1 arbetsdag med prisuppgift och nästa steg.')}
        </p>
      </div>
    </StepContainer>
  );
};

export default VisaStep10Review;
