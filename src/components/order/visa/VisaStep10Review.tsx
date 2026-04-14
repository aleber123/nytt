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
  /** Called after a visa order is successfully created — used to mark abandoned cart as converted */
  onOrderCreated?: (orderId: string) => void;
}

const VisaStep10Review: React.FC<Props> = ({ answers, onUpdate, onBack, onGoToStep, isEVisa = false, onOrderCreated }) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!termsAccepted || !answers.selectedVisaProduct) return;
    
    // Validate customer contact info is present (guards against step-skipping via progress bar)
    const customerEmail = answers.billingInfo?.email || answers.returnAddress?.email || '';
    const customerPhone = answers.billingInfo?.phone || answers.returnAddress?.phone || '';
    const customerName = answers.billingInfo?.companyName 
      || `${answers.billingInfo?.firstName || ''} ${answers.billingInfo?.lastName || ''}`.trim()
      || `${answers.returnAddress?.firstName || ''} ${answers.returnAddress?.lastName || ''}`.trim();
    
    if (!customerEmail || !customerName) {
      toast.error(
        router.locale === 'en'
          ? 'Please fill in your contact information before submitting.'
          : 'Vänligen fyll i dina kontaktuppgifter innan du skickar.'
      );
      onGoToStep(8); // Navigate to customer info step
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      
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
        
        // Customer info - handle company customers with contactPerson
        customerType: answers.customerType as 'private' | 'company' || 'private',
        customerInfo: (() => {
          let firstName = answers.billingInfo?.firstName || answers.returnAddress?.firstName || '';
          let lastName = answers.billingInfo?.lastName || answers.returnAddress?.lastName || '';
          
          // For company customers, split contactPerson into firstName/lastName if firstName is empty
          if (answers.customerType === 'company' && answers.billingInfo?.contactPerson && !firstName) {
            const nameParts = answers.billingInfo.contactPerson.trim().split(/\s+/);
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
          }
          
          return {
            firstName,
            lastName,
            companyName: answers.billingInfo?.companyName || answers.returnAddress?.companyName,
            email: customerEmail,
            phone: customerPhone,
            address: answers.billingInfo?.street,
            postalCode: answers.billingInfo?.postalCode,
            city: answers.billingInfo?.city,
            country: answers.billingInfo?.country,
          };
        })(),
        billingInfo: answers.billingInfo,
        
        // Additional info
        customerNumber: answers.customerNumber || undefined,
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
      onOrderCreated?.(createdOrderId);

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
          const isEn = router.locale === 'en';
          let finalSubject = isEn
            ? `Visa Order Confirmation – ${createdOrderId}`
            : `Orderbekräftelse – ${createdOrderId}`;
          let finalHtml = '';
          let renderer: 'new' | 'legacy' = 'legacy';

          // Try the new editable template system first
          try {
            const { getEmailTemplate } = await import('@/firebase/emailTemplateService');
            const { renderEmail } = await import('@/services/emailRenderer');
            const tmpl = await getEmailTemplate('order-confirmation-visa');
            if (tmpl?.useCustomTemplate) {
              const o: any = createdOrder;
              const product = o.visaProduct || {};
              const productName = isEn && product.nameEn ? product.nameEn : product.name || 'Visa';
              const travelersList = (o.travelers || [])
                .map((t: any) => `${t.firstName || ''} ${t.lastName || ''}`.trim())
                .filter(Boolean)
                .join(', ');

              const orderSummaryHtml = `
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;">
  <div style="background:#0EB0A6;color:#fff;padding:10px 16px;border-radius:6px;display:inline-block;font-weight:700;font-size:15px;margin-bottom:12px;">
    ${isEn ? 'Order' : 'Order'}: #${createdOrderId}
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:8px;">
    <tr><td style="padding:8px 0;color:#5f6368;border-bottom:1px solid #eaecef;">${isEn ? 'Date' : 'Datum'}:</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#202124;border-bottom:1px solid #eaecef;">${new Date().toLocaleDateString(isEn ? 'en-GB' : 'sv-SE')}</td></tr>
    <tr><td style="padding:8px 0;color:#5f6368;border-bottom:1px solid #eaecef;">${isEn ? 'Destination' : 'Destination'}:</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#202124;border-bottom:1px solid #eaecef;">${o.destinationCountry || ''}</td></tr>
    <tr><td style="padding:8px 0;color:#5f6368;border-bottom:1px solid #eaecef;">${isEn ? 'Visa product' : 'Visumprodukt'}:</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#202124;border-bottom:1px solid #eaecef;">${productName}</td></tr>
    ${travelersList ? `<tr><td style="padding:8px 0;color:#5f6368;border-bottom:1px solid #eaecef;">${isEn ? 'Travellers' : 'Resenärer'}:</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#202124;border-bottom:1px solid #eaecef;">${travelersList}</td></tr>` : ''}
    ${o.totalPrice ? `<tr><td style="padding:8px 0;color:#5f6368;">${isEn ? 'Total' : 'Totalt'}:</td><td style="padding:8px 0;text-align:right;font-weight:800;color:#202124;font-size:15px;">${o.totalPrice} kr</td></tr>` : ''}
  </table>
</div>`.trim();

              const result = await renderEmail(
                'order-confirmation-visa',
                {
                  customerName: o.customerInfo?.firstName || customerName || (isEn ? 'customer' : 'kund'),
                  orderNumber: String(createdOrderId),
                  destinationCountry: o.destinationCountry || '',
                  visaProduct: productName,
                  travelers: travelersList,
                  orderSummary: orderSummaryHtml,
                },
                isEn ? 'en' : 'sv',
                { orderNumber: String(createdOrderId) }
              );
              if (result.rendered) {
                finalSubject = result.subject || finalSubject;
                finalHtml = result.html;
                renderer = 'new';
              }
            }
          } catch (rendererErr) {
            console.warn('[order-confirmation-visa] new renderer failed, falling back to legacy', rendererErr);
          }

          if (!finalHtml) {
            finalHtml = generateVisaConfirmationEmail({
              order: createdOrder,
              locale: router.locale || 'sv',
              documentRequirements,
              confirmationToken
            });
          }

          const customerEmailData = {
            name: customerName || 'Visumkund',
            email: customerEmail,
            subject: finalSubject,
            message: finalHtml,
            orderId: createdOrderId,
            createdAt: Timestamp.now(),
            status: 'pending',
            renderer,
          };

          const emailsRef = collection(db, 'customerEmails');
          await addDoc(emailsRef, customerEmailData);
        } catch (emailError) {
          // Don't fail the order if email fails
        }
      }
      
      // Send notification email to business via the editable template system
      try {
        if (createdOrder) {
          const {
            buildVisaInternalSummaryHtml,
            buildInternalCustomerInfoHtml,
          } = await import('@/services/internalNotificationEmailParts');
          const { renderEmail: renderInternalEmail } = await import('@/services/emailRenderer');

          const destinationCountryEn = createdOrder.destinationCountry || '';
          const nationalityEn = createdOrder.nationality || '';
          const visaProductNameEn = (createdOrder.visaProduct as any)?.nameEn || createdOrder.visaProduct?.name || '';
          const visaTypeLabel = createdOrder.visaProduct?.visaType === 'e-visa' ? 'E-Visa' : 'Sticker Visa';
          const entryTypeLabel = createdOrder.visaProduct?.entryType === 'single'
            ? 'Single entry'
            : createdOrder.visaProduct?.entryType === 'double'
              ? 'Double entry'
              : 'Multiple entry';

          const orderSummaryHtml = buildVisaInternalSummaryHtml({
            orderNumber: createdOrder.orderNumber || createdOrderId,
            destinationCountry: destinationCountryEn,
            nationality: nationalityEn,
            visaProductName: visaProductNameEn,
            visaType: visaTypeLabel,
            entryType: entryTypeLabel,
            validityDays: createdOrder.visaProduct?.validityDays,
            departureDate: createdOrder.departureDate,
            returnDate: createdOrder.returnDate,
            passportNeededBy: createdOrder.passportNeededBy,
            travelers: createdOrder.travelers?.map(t => ({ firstName: t.firstName, lastName: t.lastName })),
            travelerCount: createdOrder.travelerCount,
            totalPrice: createdOrder.totalPrice,
            customerType: createdOrder.customerType,
            pricingBreakdown: createdOrder.pricingBreakdown,
          });

          const customerInfoHtml = buildInternalCustomerInfoHtml({
            firstName: createdOrder.customerInfo?.firstName || '',
            lastName: createdOrder.customerInfo?.lastName || '',
            email: createdOrder.customerInfo?.email || '',
            phone: createdOrder.customerInfo?.phone,
            address: createdOrder.customerInfo?.address,
            postalCode: createdOrder.customerInfo?.postalCode,
            city: createdOrder.customerInfo?.city,
            companyName: createdOrder.customerInfo?.companyName,
          });

          const rendered = await renderInternalEmail(
            'internal-new-order-visa',
            {
              orderNumber: createdOrder.orderNumber || createdOrderId,
              destinationCountry: answers.destinationCountry,
              orderSummaryHtml,
              customerInfoHtml,
            },
            'sv',
            { showTrackingButton: false, showContactSection: false }
          );

          // Fall back to legacy renderer when the template can't be loaded
          const fallbackHtml = rendered.rendered
            ? rendered.html
            : generateVisaBusinessNotificationEmail({ order: createdOrder, locale: 'sv' });
          const fallbackSubject = rendered.rendered
            ? rendered.subject
            : `🛂 Ny visumbeställning ${createdOrderId}: ${answers.destinationCountry}`;

          const businessEmailData = {
            name: customerName || 'Visumkund',
            email: 'info@doxvl.se,info@visumpartner.se',
            subject: fallbackSubject,
            message: fallbackHtml,
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

        // Only show product info, no prices (prices are shown in Sammanfattning sidebar)
        const items: { label: string; value: string | undefined }[] = [
          { label: locale === 'en' ? 'Product' : 'Produkt', value: locale === 'en' && p.nameEn ? p.nameEn : p.name },
          { label: locale === 'en' ? 'Visa Type' : 'Visumtyp', value: p.visaType === 'e-visa' ? 'E-Visa' : 'Sticker Visa' },
          { label: locale === 'en' ? 'Entries' : 'Inresor', value: p.entryType === 'single' 
            ? (locale === 'en' ? 'Single entry' : 'Enkelinresa') 
            : p.entryType === 'double' 
              ? (locale === 'en' ? 'Double entry' : 'Dubbelinresa') 
              : (locale === 'en' ? 'Multiple entry' : 'Flerresor') },
          { label: locale === 'en' ? 'Validity' : 'Giltighet', value: `${p.validityDays} ${locale === 'en' ? 'days' : 'dagar'}` },
        ];

        // Show add-on services names (without prices)
        if (answers.selectedAddOnServices && answers.selectedAddOnServices.length > 0) {
          const addOnNames = answers.selectedAddOnServices
            .map(a => locale === 'en' ? a.nameEn : a.name)
            .join(', ');
          items.push({ label: locale === 'en' ? 'Add-on services' : 'Tilläggstjänster', value: addOnNames });
        }

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
        ...(answers.customerNumber ? [{ label: locale === 'en' ? 'Customer Number' : 'Kundnummer', value: answers.customerNumber }] : []),
        { label: locale === 'en' ? 'Name' : 'Namn', value: customerName },
        { label: locale === 'en' ? 'Email' : 'E-post', value: customerEmail },
        { label: locale === 'en' ? 'Phone' : 'Telefon', value: customerPhone },
        ...(answers.billingInfo?.street ? [{ label: locale === 'en' ? 'Address' : 'Adress', value: `${answers.billingInfo.street}, ${answers.billingInfo.postalCode} ${answers.billingInfo.city}` }] : []),
        ...(answers.invoiceReference ? [{ label: locale === 'en' ? 'Invoice Reference' : 'Fakturareferens', value: answers.invoiceReference }] : []),
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
