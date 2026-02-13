/**
 * FormDataPrintButton — Opens a clean printable view of customer form data
 * 
 * Case handlers use this to double-check data when filling visa portals.
 * Fields are ordered to match the India e-Visa portal page structure exactly.
 * Uses window.print() for native PDF export / printing.
 */

import { useState } from 'react';
import { getFormSubmissionsForOrder } from '@/firebase/visaFormService';

interface FormDataPrintButtonProps {
  order: any;
  templateFields?: any[];
}

// India e-Visa portal page order — fields listed in the exact order they appear on each page
const PORTAL_PAGE_ORDER: { title: string; fields: { id: string; label: string }[] }[] = [
  {
    title: 'Page 1 — Registration',
    fields: [
      { id: 'nationality', label: 'Nationality' },
      { id: 'passportType', label: 'Passport Type' },
      { id: 'dateOfBirth', label: 'Date of Birth' },
      { id: 'email', label: 'Email' },
      { id: 'expectedDateOfArrival', label: 'Expected Date of Arrival' },
      { id: 'purposeOfVisit', label: 'Visa Purpose' },
    ],
  },
  {
    title: 'Page 2 — Personal & Passport Details',
    fields: [
      { id: 'surname', label: 'Surname' },
      { id: 'givenName', label: 'Given Name / First Name' },
      { id: 'haveYouChangedName', label: 'Have You Changed Name?' },
      { id: 'previousName', label: 'Previous Name' },
      { id: 'gender', label: 'Gender' },
      { id: 'townCityOfBirth', label: 'Town/City of Birth' },
      { id: 'countryOfBirth', label: 'Country of Birth' },
      { id: 'citizenshipNationalId', label: 'National ID / Personnummer' },
      { id: 'religion', label: 'Religion' },
      { id: 'visibleIdentificationMark', label: 'Visible Identification Mark' },
      { id: 'educationalQualification', label: 'Educational Qualification' },
      { id: 'passportNumber', label: 'Passport Number' },
      { id: 'placeOfIssue', label: 'Passport Place of Issue' },
      { id: 'dateOfIssue', label: 'Passport Date of Issue' },
      { id: 'dateOfExpiry', label: 'Passport Date of Expiry' },
      { id: 'anyOtherPassport', label: 'Any Other Passport?' },
      { id: 'otherPassportCountry', label: 'Other Passport Country' },
      { id: 'otherPassportNumber', label: 'Other Passport Number' },
    ],
  },
  {
    title: 'Page 3 — Address, Family & Profession',
    fields: [
      { id: 'houseNoStreet', label: 'Address Line 1 (House/Street)' },
      { id: 'village', label: 'Address Line 2 (Village/Town)' },
      { id: 'city', label: 'City' },
      { id: 'state', label: 'State / Province' },
      { id: 'postalCode', label: 'Postal Code' },
      { id: 'phoneNo', label: 'Phone Number' },
      { id: 'fatherName', label: 'Father\'s Name' },
      { id: 'fatherNationality', label: 'Father\'s Nationality' },
      { id: 'fatherPlaceOfBirth', label: 'Father\'s Place of Birth' },
      { id: 'fatherCountryOfBirth', label: 'Father\'s Country of Birth' },
      { id: 'motherName', label: 'Mother\'s Name' },
      { id: 'motherNationality', label: 'Mother\'s Nationality' },
      { id: 'motherPlaceOfBirth', label: 'Mother\'s Place of Birth' },
      { id: 'motherCountryOfBirth', label: 'Mother\'s Country of Birth' },
      { id: 'maritalStatus', label: 'Marital Status' },
      { id: 'spouseName', label: 'Spouse\'s Name' },
      { id: 'spouseNationality', label: 'Spouse\'s Nationality' },
      { id: 'spousePlaceOfBirth', label: 'Spouse\'s Place of Birth' },
      { id: 'spouseCountryOfBirth', label: 'Spouse\'s Country of Birth' },
      { id: 'presentOccupation', label: 'Present Occupation' },
      { id: 'employerName', label: 'Employer Name' },
      { id: 'employerAddress', label: 'Employer Address' },
      { id: 'employerPhone', label: 'Employer Phone' },
      { id: 'wereYouInMilitary', label: 'Military / Semi-military Service?' },
    ],
  },
  {
    title: 'Page 4 — Travel, Visa History & References',
    fields: [
      { id: 'placesToVisit', label: 'Places to Visit in India' },
      { id: 'detailsOfPurpose', label: 'Details of Business Purpose' },
      { id: 'invitingCompanyName', label: 'Inviting Company Name' },
      { id: 'invitingCompanyAddress', label: 'Inviting Company Address' },
      { id: 'invitingCompanyPhone', label: 'Inviting Company Phone' },
      { id: 'expectedPortOfExit', label: 'Expected Port of Exit' },
      { id: 'portOfArrival', label: 'Port of Arrival' },
      { id: 'haveYouVisitedIndiaBefore', label: 'Visited India Before?' },
      { id: 'previousVisaNo', label: 'Previous Visa Number' },
      { id: 'previousVisaType', label: 'Previous Visa Type' },
      { id: 'previousVisaPlaceOfIssue', label: 'Previous Visa Place of Issue' },
      { id: 'previousVisaDateOfIssue', label: 'Previous Visa Date of Issue' },
      { id: 'haveYouBeenRefusedVisa', label: 'Ever Been Refused Visa?' },
      { id: 'refusedVisaDetails', label: 'Refusal Details' },
      { id: 'countriesVisitedInLast10Years', label: 'Countries Visited (Last 10 Years)' },
      { id: 'referenceNameInIndia', label: 'Reference in India — Name' },
      { id: 'referenceAddressInIndia', label: 'Reference in India — Address' },
      { id: 'referencePhoneInIndia', label: 'Reference in India — Phone' },
      { id: 'referenceNameInHomeCountry', label: 'Reference in Home Country — Name' },
      { id: 'referenceAddressInHomeCountry', label: 'Reference in Home Country — Address' },
      { id: 'referencePhoneInHomeCountry', label: 'Reference in Home Country — Phone' },
    ],
  },
];

export default function FormDataPrintButton({ order }: FormDataPrintButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePrint = async () => {
    setLoading(true);

    let formData: Record<string, string> = {};
    try {
      const submissions = await getFormSubmissionsForOrder(order.orderNumber || order.id);
      const completed = submissions.find((s: any) => s.status === 'completed');
      if (completed?.formData) {
        formData = completed.formData;
      } else {
        const latest = submissions[0];
        if (latest?.formData) formData = latest.formData;
      }
    } catch {
      // fallback
    }

    if (Object.keys(formData).length === 0) {
      setLoading(false);
      alert('No form data found for this order.');
      return;
    }

    const customerName = `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim() || 'Customer';
    const orderNumber = order.orderNumber || order.id || '';
    const destination = order.destinationCountry || '';
    const visaProduct = order.visaProduct?.nameEn || order.visaProduct?.name || '';
    const travelers = (order.travelers || []).map((t: any, i: number) => 
      `${t.firstName || ''} ${t.lastName || ''}`.trim() || `Traveler ${i + 1}`
    ).join(', ');

    // Build pages with portal order; collect used keys to show remaining fields at the end
    const usedKeys = new Set<string>();
    const pagesHtml = PORTAL_PAGE_ORDER.map(page => {
      const rows = page.fields
        .map(f => {
          const val = formData[f.id];
          if (val) usedKeys.add(f.id);
          return val ? `<div class="field-row"><div class="field-label">${f.label}</div><div class="field-value">${val}</div></div>` : '';
        })
        .filter(Boolean)
        .join('');
      if (!rows) return '';
      return `<div class="group"><div class="group-title">${page.title}</div>${rows}</div>`;
    }).filter(Boolean).join('');

    // Any remaining fields not in the portal order
    const extraRows = Object.entries(formData)
      .filter(([key, val]) => val && !usedKeys.has(key))
      .map(([key, val]) => `<div class="field-row"><div class="field-label">${key}</div><div class="field-value">${val}</div></div>`)
      .join('');
    const extraHtml = extraRows ? `<div class="group"><div class="group-title">Other Information</div>${extraRows}</div>` : '';

    const printHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Form Data — ${orderNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; padding: 32px; max-width: 800px; margin: 0 auto; font-size: 13px; line-height: 1.5; }
    .header { border-bottom: 2px solid #0EB0A6; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 20px; color: #0EB0A6; margin-bottom: 4px; }
    .header .meta { font-size: 12px; color: #6b7280; }
    .header .meta span { margin-right: 16px; }
    .group { margin-bottom: 20px; break-inside: avoid; }
    .group-title { font-size: 13px; font-weight: 700; color: #fff; background: #0EB0A6; padding: 6px 10px; border-radius: 4px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .field-row { display: flex; padding: 5px 0; border-bottom: 1px solid #f3f4f6; }
    .field-row:last-child { border-bottom: none; }
    .field-label { width: 240px; flex-shrink: 0; color: #6b7280; font-size: 12px; padding-right: 12px; }
    .field-value { flex: 1; font-weight: 600; color: #111827; word-break: break-word; font-size: 13px; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
    @media print {
      body { padding: 16px; }
      .no-print { display: none; }
      .group { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom:16px;text-align:right;">
    <button onclick="window.print()" style="background:#0EB0A6;color:white;border:none;padding:8px 20px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">Print / Save as PDF</button>
  </div>
  <div class="header">
    <h1>DOX Visumpartner — India e-Visa Application Data</h1>
    <div class="meta">
      <span><strong>Order:</strong> ${orderNumber}</span>
      <span><strong>Customer:</strong> ${customerName}</span>
      ${destination ? `<span><strong>Destination:</strong> ${destination}</span>` : ''}
      ${visaProduct ? `<span><strong>Product:</strong> ${visaProduct}</span>` : ''}
    </div>
    ${travelers ? `<div class="meta" style="margin-top:4px;"><span><strong>Travelers:</strong> ${travelers}</span></div>` : ''}
    <div class="meta" style="margin-top:4px;color:#ef4444;"><strong>Fields ordered to match indianvisaonline.gov.in portal pages</strong></div>
  </div>

  ${pagesHtml}
  ${extraHtml}

  <div class="footer">
    DOX Visumpartner AB — Printed ${new Date().toLocaleString('sv-SE')}
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printHtml);
      printWindow.document.close();
    }

    setLoading(false);
  };

  return (
    <button
      onClick={handlePrint}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors disabled:opacity-50"
      title="Print customer form data as PDF"
    >
      {loading ? '⏳' : '🖨'} Print Form Data
    </button>
  );
}
