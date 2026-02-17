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
import { createVisaOrder, getVisaOrder, updateVisaOrder } from '@/firebase/visaOrderService';
import { generateVisaConfirmationEmail, generateVisaBusinessNotificationEmail } from '../templates/visaConfirmationEmail';
import { getDocumentRequirementsForProduct, filterDocumentsByNationality } from '@/firebase/visaRequirementsService';
import { getCustomerByEmailDomain } from '@/firebase/customerService';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFormTemplate, createFormSubmission } from '@/firebase/visaFormService';

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
      
      // Check for customer-specific pricing based on email domain
      let matchedCustomer = null;
      let customServiceFee: number | undefined = undefined;
      let customDiscountPercent: number | undefined = undefined;
      
      if (customerEmail) {
        matchedCustomer = await getCustomerByEmailDomain(customerEmail);
        if (matchedCustomer?.customPricing) {
          customServiceFee = matchedCustomer.customPricing.visaServiceFee;
          customDiscountPercent = matchedCustomer.customPricing.visaDiscountPercent;
        }
      }
      
      // Calculate pricing with customer-specific adjustments
      const travelerCount = (answers.travelers || [{ firstName: '', lastName: '' }]).filter(t => t.firstName.trim() && t.lastName.trim()).length || 1;
      const baseServiceFee = answers.selectedVisaProduct.serviceFee || 0;
      const embassyFee = answers.selectedVisaProduct.embassyFee || 0;
      const expressPrice = answers.expressRequired ? (answers.selectedVisaProduct.expressPrice || 0) : 0;
      const urgentPrice = answers.urgentRequired ? (answers.selectedVisaProduct.urgentPrice || 0) : 0;
      const addOnServicesTotal = (answers.selectedAddOnServices || []).reduce((sum, a) => sum + a.price, 0);
      
      // Apply custom service fee if set, otherwise use standard
      const finalServiceFee = customServiceFee !== undefined ? customServiceFee : baseServiceFee;
      
      // Per-person subtotal (all fees apply per traveler)
      const perPersonSubtotal = finalServiceFee + embassyFee + expressPrice + urgentPrice + addOnServicesTotal;
      let subtotal = perPersonSubtotal * travelerCount;
      
      // Apply discount if set
      let discountAmount = 0;
      if (customDiscountPercent && customDiscountPercent > 0) {
        discountAmount = Math.round(subtotal * (customDiscountPercent / 100));
        subtotal = subtotal - discountAmount;
      }
      
      const finalTotalPrice = subtotal;
      
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
          nameEn: answers.selectedVisaProduct.nameEn,
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
        
        // Travelers
        travelerCount,
        travelers: (answers.travelers || []).filter(t => t.firstName.trim() && t.lastName.trim()).map(t => ({
          firstName: t.firstName.trim(),
          lastName: t.lastName.trim(),
          ...(t.passportNumber ? { passportNumber: t.passportNumber } : {}),
        })),
        
        // Shipping (only for sticker visa)
        ...(isEVisa ? {} : {
          pickupService: answers.pickupService,
          pickupMethod: answers.pickupMethod,
          pickupAddress: answers.pickupAddress,
          returnService: answers.returnService,
          returnTrackingNumber: answers.returnService === 'own-delivery' ? (answers.ownReturnTrackingNumber || '') : undefined,
          hasReturnLabel: answers.returnService === 'own-delivery' && !!answers.ownReturnLabelFile,
          returnLabelFileName: answers.ownReturnLabelFile?.name || undefined,
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
        
        // Add-on services
        ...(answers.selectedAddOnServices && answers.selectedAddOnServices.length > 0 ? {
          addOnServices: answers.selectedAddOnServices,
        } : {}),
        
        // Pricing with customer-specific adjustments
        totalPrice: finalTotalPrice,
        pricingBreakdown: {
          serviceFee: finalServiceFee,
          embassyFee: embassyFee,
          expressPrice: expressPrice,
          ...(answers.expressRequired && answers.selectedVisaProduct.expressEmbassyFee ? { expressEmbassyFee: answers.selectedVisaProduct.expressEmbassyFee } : {}),
          ...(answers.expressRequired && answers.selectedVisaProduct.expressDoxFee ? { expressDoxFee: answers.selectedVisaProduct.expressDoxFee } : {}),
          urgentPrice: urgentPrice,
          ...(answers.urgentRequired && answers.selectedVisaProduct.urgentEmbassyFee ? { urgentEmbassyFee: answers.selectedVisaProduct.urgentEmbassyFee } : {}),
          ...(answers.urgentRequired && answers.selectedVisaProduct.urgentDoxFee ? { urgentDoxFee: answers.selectedVisaProduct.urgentDoxFee } : {}),
          ...(addOnServicesTotal > 0 ? { addOnServicesTotal } : {}),
          ...(discountAmount > 0 ? { discountAmount, discountPercent: customDiscountPercent } : {}),
          // VAT info: DOX fees have 25% VAT (included in price), embassy fees are 0% VAT
          vatRate: 0.25,
          vatNote: 'DOX service fees include 25% VAT. Embassy fees are exempt (0% VAT).',
        },
        
        // Customer pricing info (for reference in admin)
        ...(matchedCustomer ? {
          matchedCustomerId: matchedCustomer.id,
          matchedCustomerName: matchedCustomer.companyName,
        } : {}),
        
        // Locale
        locale: router.locale || 'sv',
      });
      
      const { orderId: createdOrderId, token: confirmationToken } = orderResult;
      
      // Upload return label file if present
      if (answers.ownReturnLabelFile && answers.returnService === 'own-delivery') {
        try {
          const storage = getStorage();
          const file = answers.ownReturnLabelFile;
          const fileExtension = file.name.split('.').pop() || 'file';
          const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const fileName = `${createdOrderId}_return_label_${cleanFileName}`;
          const storageRef = ref(storage, `visa-documents/${fileName}`);
          
          const snapshot = await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(snapshot.ref);
          
          const uploadedFileData = {
            originalName: file.name,
            size: file.size,
            type: file.type,
            downloadURL: downloadURL,
            storagePath: `visa-documents/${fileName}`,
            uploadedAt: Timestamp.now()
          };
          
          // Update the order with the uploaded file
          await updateVisaOrder(createdOrderId, {
            uploadedFiles: [uploadedFileData],
            filesUploaded: true,
            filesUploadedAt: Timestamp.now()
          });
        } catch (uploadError) {
          // File upload failed but order was created - continue
        }
      }
      
      setOrderId(createdOrderId);
      setIsSubmitted(true);
      
      // Fetch the created order to get full data for email
      const createdOrder = await getVisaOrder(createdOrderId);
      
      // Fetch document requirements for this visa product (filtered by nationality)
      let documentRequirements: Awaited<ReturnType<typeof getDocumentRequirementsForProduct>> = [];
      if (createdOrder?.destinationCountryCode && createdOrder?.visaProduct?.id) {
        try {
          const allDocs = await getDocumentRequirementsForProduct(
            createdOrder.destinationCountryCode,
            createdOrder.visaProduct.id
          );
          // Filter documents based on customer's nationality
          const nationalityCode = createdOrder.nationalityCode || answers.nationalityCode || 'SE';
          documentRequirements = filterDocumentsByNationality(allDocs, nationalityCode);
        } catch {
          // Silent fail - document requirements are optional
        }
      }
      
      // Send confirmation email to customer
      if (createdOrder && customerEmail) {
        try {
          const customerEmailHtml = generateVisaConfirmationEmail({
            order: createdOrder,
            locale: router.locale || 'sv',
            documentRequirements,
            confirmationToken
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
      
      // Send notification email to business (styled HTML)
      try {
        if (createdOrder) {
          const businessEmailHtml = generateVisaBusinessNotificationEmail({
            order: createdOrder,
            locale: 'sv'
          });
          
          const businessEmailData = {
            name: customerName || 'Visumkund',
            email: 'info@doxvl.se,info@visumpartner.se',
            subject: `🛂 Ny visumbeställning ${createdOrderId}: ${answers.destinationCountry}`,
            message: businessEmailHtml,
            orderId: createdOrderId,
            createdAt: Timestamp.now(),
            status: 'queued'
          };
          
          const emailsRef = collection(db, 'customerEmails');
          await addDoc(emailsRef, businessEmailData);
        }
      } catch (emailError) {
        // Don't fail the order if email fails
      }
      
      // Auto-send data collection form if order has addons that need extra info
      // (e.g., Svensklistan requires personnummer)
      const addonsWithForms = (answers.selectedAddOnServices || []).filter(a => a.formTemplateId);
      if (createdOrder && customerEmail && addonsWithForms.length > 0) {
        try {
          // Pick the most comprehensive template (most fields) so e.g. India e-Visa
          // (65 fields) is chosen over Svensklistan when both are present
          let formTemplate = null;
          for (const addon of addonsWithForms) {
            const tmpl = await getFormTemplate(addon.formTemplateId!);
            if (tmpl && (!formTemplate || (tmpl.fields?.length || 0) > (formTemplate.fields?.length || 0))) {
              formTemplate = tmpl;
            }
          }
          
          if (formTemplate) {
            // Pre-fill form data from order to avoid asking for info we already have
            const prefillData: Record<string, string> = {};
            const travelers = (answers.travelers || []).filter(t => t.firstName.trim() && t.lastName.trim());
            for (const field of (formTemplate.fields || [])) {
              if (!field.prefillFrom) continue;
              let val = '';
              if (field.prefillFrom === 'customerInfo.email') val = customerEmail;
              else if (field.prefillFrom === 'customerInfo.phone') val = customerPhone;
              else if (field.prefillFrom === 'departureDate') val = answers.departureDate || '';
              else if (field.prefillFrom === 'returnDateVisa') val = answers.returnDateVisa || '';
              else if (field.prefillFrom === 'destinationCountry') val = answers.destinationCountry || '';
              else if (field.prefillFrom.startsWith('travelers[i].') && !field.perTraveler) {
                // For non-per-traveler fields, use first traveler
                const prop = field.prefillFrom.replace('travelers[i].', '') as keyof typeof travelers[0];
                if (travelers[0]) val = (travelers[0] as any)[prop] || '';
              } else if (field.prefillFrom.startsWith('travelers[i].') && field.perTraveler) {
                // Per-traveler fields: pre-fill each traveler
                const prop = field.prefillFrom.replace('travelers[i].', '') as keyof typeof travelers[0];
                travelers.forEach((t, i) => {
                  const key = `${field.id}_${i}`;
                  prefillData[key] = (t as any)[prop] || '';
                });
                continue; // Skip the single-field assignment below
              }
              if (val) prefillData[field.id] = val;
            }

            const { token: formToken } = await createFormSubmission({
              orderId: createdOrderId,
              orderNumber: createdOrderId,
              templateId: formTemplate.id,
              customerEmail,
              customerName: customerName || 'Kund',
              prefillData,
            });
            
            const formUrl = `${window.location.origin}/visa-form/${formToken}`;
            const formLocale = router.locale || 'sv';
            const isEn = formLocale === 'en';
            
            const formEmailHtml = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #0EB0A6; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 22px;">DOX Visumpartner</h1>
  </div>
  <div style="padding: 30px; background: #ffffff;">
    <p>${isEn ? `Hi ${customerName}` : `Hej ${customerName}`},</p>
    <p>${isEn 
      ? `Thank you for your order (#${createdOrderId})! To process your visa application and selected add-on services, we need some additional information from you.`
      : `Tack för din beställning (#${createdOrderId})! För att vi ska kunna behandla din visumansökan och valda tilläggstjänster behöver vi lite mer information från dig.`}</p>
    <p>${isEn ? 'Please click the button below to fill in the form:' : 'Klicka på knappen nedan för att fylla i formuläret:'}</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${formUrl}" style="display: inline-block; background: #0EB0A6; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
        ${isEn ? 'Fill in the form' : 'Fyll i formuläret'}
      </a>
    </div>
    <p style="color: #666; font-size: 14px;">${isEn 
      ? 'You can save your progress and return to the form later. The link is valid for 30 days.'
      : 'Du kan spara ditt framsteg och återkomma till formuläret senare. Länken är giltig i 30 dagar.'}</p>
  </div>
  <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #999;">
    DOX Visumpartner AB | info@doxvl.se | 08-409 419 00
  </div>
</div>`;
            
            const formEmailData = {
              name: customerName || 'Visumkund',
              email: customerEmail,
              phone: customerPhone || '',
              subject: isEn 
                ? `Complete your visa application – ${createdOrderId}`
                : `Komplettera din visumansökan – ${createdOrderId}`,
              message: formEmailHtml,
              orderId: createdOrderId,
              createdAt: Timestamp.now(),
              status: 'pending',
            };
            
            const emailsRef = collection(db, 'customerEmails');
            await addDoc(emailsRef, formEmailData);
          }
        } catch {
          // Don't fail the order if form email fails
        }
      }
      
      // Trigger save customer info event (for "Save my information" checkbox)
      window.dispatchEvent(new Event('saveCustomerInfo'));
      
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
      title: locale === 'en' ? 'Visa Product' : 'Visumprodukt',
      step: 3,
      items: (() => {
        const p = answers.selectedVisaProduct;
        if (!p) return [];

        const vatLabel0 = locale === 'en' ? '0% VAT' : '0% moms';
        const vatLabel25 = locale === 'en' ? 'incl. 25% VAT' : 'inkl. 25% moms';

        // Express fee breakdown
        const expressEmbassy = answers.expressRequired ? (p.expressEmbassyFee || 0) : 0;
        const expressDox = answers.expressRequired ? (p.expressDoxFee || 0) : 0;
        const expressFallback = answers.expressRequired && !p.expressEmbassyFee && !p.expressDoxFee ? (p.expressPrice || 0) : 0;

        // Urgent fee breakdown
        const urgentEmbassy = answers.urgentRequired ? (p.urgentEmbassyFee || 0) : 0;
        const urgentDox = answers.urgentRequired ? (p.urgentDoxFee || 0) : 0;
        const urgentFallback = answers.urgentRequired && !p.urgentEmbassyFee && !p.urgentDoxFee ? (p.urgentPrice || 0) : 0;

        // Add-on total
        const addOnTotal = (answers.selectedAddOnServices || []).reduce((sum, a) => sum + a.price, 0);

        // VAT calculation: 25% on DOX fees (service fee, express DOX, urgent DOX, add-ons)
        // Embassy fees are 0% VAT
        const doxFeesTotal = (p.serviceFee || 0) + expressDox + urgentDox + addOnTotal + expressFallback + urgentFallback;
        const vatAmount = Math.round(doxFeesTotal * 0.25 / 1.25); // VAT is included in price

        // Per-person total
        const perPerson = (p.price || 0) + (answers.expressRequired ? (p.expressPrice || 0) : 0) + (answers.urgentRequired ? (p.urgentPrice || 0) : 0) + addOnTotal;
        const travelerCount = (answers.travelers || []).filter(t => t.firstName.trim() && t.lastName.trim()).length || 1;
        const total = perPerson * travelerCount;
        const totalVat = vatAmount * travelerCount;

        const items: { label: string; value: string | undefined }[] = [
          { label: locale === 'en' ? 'Product' : 'Produkt', value: locale === 'en' && p.nameEn ? p.nameEn : p.name },
          { label: locale === 'en' ? 'Visa Type' : 'Visumtyp', value: p.visaType === 'e-visa' ? 'E-Visa' : 'Sticker Visa' },
          { label: locale === 'en' ? 'Entries' : 'Inresor', value: p.entryType === 'single' 
            ? (locale === 'en' ? 'Single entry' : 'Enkelinresa') 
            : p.entryType === 'double' 
              ? (locale === 'en' ? 'Double entry' : 'Dubbelinresa') 
              : (locale === 'en' ? 'Multiple entry' : 'Flerresor') },
          { label: locale === 'en' ? 'Validity' : 'Giltighet', value: `${p.validityDays} ${locale === 'en' ? 'days' : 'dagar'}` },
          { label: `${locale === 'en' ? 'Service fee' : 'Serviceavgift'} (${vatLabel25})`, value: p.serviceFee ? `${p.serviceFee.toLocaleString()} kr` : undefined },
          { label: `${locale === 'en' ? 'Embassy fee' : 'Ambassadavgift'} (${vatLabel0})`, value: p.embassyFee ? `${p.embassyFee.toLocaleString()} kr` : undefined },
        ];

        // Express fee split
        if (answers.expressRequired && (expressEmbassy || expressDox)) {
          items.push({ label: `${locale === 'en' ? 'Express – embassy fee' : 'Express – ambassadavgift'} (${vatLabel0})`, value: `+${expressEmbassy.toLocaleString()} kr` });
          items.push({ label: `${locale === 'en' ? 'Express – service fee' : 'Express – serviceavgift'} (${vatLabel25})`, value: `+${expressDox.toLocaleString()} kr` });
        } else if (answers.expressRequired && expressFallback) {
          items.push({ label: locale === 'en' ? 'Express fee' : 'Expressavgift', value: `+${expressFallback.toLocaleString()} kr` });
        }

        // Urgent fee split
        if (answers.urgentRequired && (urgentEmbassy || urgentDox)) {
          items.push({ label: `${locale === 'en' ? 'Urgent – embassy fee' : 'Brådskande – ambassadavgift'} (${vatLabel0})`, value: `+${urgentEmbassy.toLocaleString()} kr` });
          items.push({ label: `${locale === 'en' ? 'Urgent – service fee' : 'Brådskande – serviceavgift'} (${vatLabel25})`, value: `+${urgentDox.toLocaleString()} kr` });
        } else if (answers.urgentRequired && urgentFallback) {
          items.push({ label: locale === 'en' ? 'Urgent fee' : 'Brådskande avgift', value: `+${urgentFallback.toLocaleString()} kr` });
        }

        // Add-on services
        if (answers.selectedAddOnServices && answers.selectedAddOnServices.length > 0) {
          answers.selectedAddOnServices.forEach(a => {
            items.push({ label: `${locale === 'en' ? a.nameEn : a.name} (${vatLabel25})`, value: `+${a.price.toLocaleString()} kr` });
          });
        }

        // Per person & total
        items.push({ label: locale === 'en' ? 'Price per person' : 'Pris per person', value: `${perPerson.toLocaleString()} kr` });

        if (travelerCount > 1) {
          items.push({ label: locale === 'en' ? 'Travelers' : 'Resenärer', value: `${travelerCount} ${locale === 'en' ? 'persons' : 'personer'}` });
        }

        items.push({ label: `${locale === 'en' ? 'VAT (25%)' : 'Varav moms (25%)'}`, value: `${totalVat.toLocaleString()} kr` });
        items.push({ label: locale === 'en' ? 'Total' : 'Totalt', value: `${total.toLocaleString()} kr` });

        return items;
      })(),
    },
    {
      title: locale === 'en' ? 'Travelers & dates' : 'Resenärer & datum',
      step: 4,
      items: [
        ...(answers.travelers || []).filter(t => t.firstName.trim() && t.lastName.trim()).map((t, i) => ({
          label: `${locale === 'en' ? 'Traveler' : 'Resenär'} ${i + 1}`,
          value: `${t.firstName} ${t.lastName}`
        })),
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
        { label: t('visaOrder.step8.title', 'Retur'), value: (() => {
          if (!answers.returnService) return '-';
          if (answers.returnService === 'own-delivery') return locale === 'en' ? 'Own return shipping' : 'Egen returfrakt';
          if (answers.returnService === 'office-pickup') return locale === 'en' ? 'Office pickup' : 'Hämtning på kontor';
          if (answers.returnService === 'dhl-sweden') return locale === 'en' ? 'DHL Express Sweden' : 'DHL Express Sverige';
          if (answers.returnService === 'dhl-europe') return locale === 'en' ? 'DHL Express Europe' : 'DHL Express Europa';
          if (answers.returnService === 'dhl-world') return locale === 'en' ? 'DHL Express Worldwide' : 'DHL Express Världen';
          return answers.returnService;
        })() },
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
      title: locale === 'en' ? 'Contact Information' : 'Kontaktuppgifter',
      step: 9,
      items: [
        { label: locale === 'en' ? 'Name' : 'Namn', value: customerName },
        { label: locale === 'en' ? 'Email' : 'E-post', value: customerEmail },
        { label: locale === 'en' ? 'Phone' : 'Telefon', value: customerPhone },
        ...(answers.billingInfo?.street ? [{ label: locale === 'en' ? 'Address' : 'Adress', value: `${answers.billingInfo.street}, ${answers.billingInfo.postalCode} ${answers.billingInfo.city}` }] : []),
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
