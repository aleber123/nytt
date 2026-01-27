/**
 * Visa Order Confirmation Email Template
 * HTML email sent to customer when their visa order is placed
 */

import { VisaOrder } from '@/firebase/visaOrderService';
import { DocumentRequirement } from '@/firebase/visaRequirementsService';

interface VisaEmailParams {
  order: VisaOrder;
  locale: string;
  documentRequirements?: DocumentRequirement[];
  confirmationToken?: string;
}

// Translation helper for nationality names
const translateNationality = (nationality: string, isEnglish: boolean): string => {
  if (!isEnglish) return nationality;
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
const translateVisaProductName = (name: string, isEnglish: boolean): string => {
  if (!isEnglish) return name;
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

export const generateVisaConfirmationEmail = (params: VisaEmailParams): string => {
  const { order, locale, documentRequirements = [], confirmationToken } = params;
  const isEnglish = locale === 'en';
  const date = new Date().toLocaleDateString(isEnglish ? 'en-GB' : 'sv-SE');
  
  // Translate nationality and product name for English emails
  const nationalityDisplay = translateNationality(order.nationality, isEnglish);
  // Use nameEn if available for English, otherwise fall back to translation helper
  const productNameDisplay = isEnglish && order.visaProduct?.nameEn 
    ? order.visaProduct.nameEn 
    : translateVisaProductName(order.visaProduct?.name || '', isEnglish);

  const customerName = order.customerInfo?.companyName 
    || `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim()
    || 'Customer';

  // Generate document requirements HTML section
  const generateDocumentRequirementsHtml = (docs: DocumentRequirement[], isEn: boolean, token?: string): string => {
    if (!docs || docs.length === 0) return '';
    
    const title = isEn ? '📋 Required Documents' : '📋 Dokument som krävs';
    const subtitle = isEn 
      ? 'Please prepare the following documents for your visa application:'
      : 'Vänligen förbered följande dokument för din visumansökan:';
    const requiredLabel = isEn ? 'Required' : 'Obligatoriskt';
    const downloadLabel = isEn ? 'Download form/template' : 'Ladda ner formulär/mall';
    
    const hasUploadable = docs.some(d => d.uploadable);
    const uploadButtonText = isEn ? 'Upload Documents Now' : 'Ladda upp dokument nu';
    const uploadNoteText = isEn 
      ? 'You can upload your documents directly through our secure portal.'
      : 'Du kan ladda upp dina dokument direkt via vår säkra portal.';
    
    const docItems = docs.map((doc, index) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #fde68a;">
          <div style="display: flex; align-items: flex-start;">
            <span style="display: inline-block; width: 24px; height: 24px; background: ${doc.required ? '#fee2e2' : '#f3f4f6'}; color: ${doc.required ? '#b91c1c' : '#6b7280'}; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600; margin-right: 12px; flex-shrink: 0;">${index + 1}</span>
            <div>
              <strong style="color: #1f2937;">${isEn ? doc.nameEn : doc.name}</strong>
              ${doc.required ? `<span style="display: inline-block; margin-left: 8px; padding: 2px 6px; background: #fee2e2; color: #b91c1c; font-size: 10px; border-radius: 4px;">${requiredLabel}</span>` : ''}
              <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 13px;">${isEn ? doc.descriptionEn : doc.description}</p>
              ${doc.templateUrl ? `<a href="${doc.templateUrl}" style="color: #2563eb; font-size: 12px; text-decoration: none;">📎 ${downloadLabel}</a>` : ''}
            </div>
          </div>
        </td>
      </tr>
    `).join('');
    
    const uploadButton = hasUploadable && token ? `
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #fcd34d; text-align: center;">
        <a href="https://www.doxvl.se/visum/dokument?token=${token}" 
           style="display: inline-block; background: #d97706; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
          📤 ${uploadButtonText}
        </a>
        <p style="color: #a16207; font-size: 11px; margin: 8px 0 0 0;">${uploadNoteText}</p>
      </div>
    ` : '';
    
    return `
      <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #92400e; margin: 0 0 8px 0; font-size: 16px;">${title}</h3>
        <p style="color: #a16207; font-size: 14px; margin: 0 0 16px 0;">${subtitle}</p>
        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 6px; overflow: hidden;">
          ${docItems}
        </table>
        ${uploadButton}
      </div>
    `;
  };

  const styles = `
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #202124;
      max-width: 600px;
      margin: 0 auto;
      background-color: #f8f9fa;
      padding: 20px;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .header {
      background-color: #ffffff;
      padding: 28px 36px;
      text-align: center;
      border-bottom: 3px solid #0EB0A6;
    }
    .header-logo-container {
      display: inline-block;
      margin-bottom: 16px;
    }
    .header-logo {
      max-height: 60px;
      width: auto;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.2px;
      color: #202124;
    }
    .header p {
      color: #5f6368;
      margin: 8px 0 0 0;
    }
    .content { padding: 32px 36px; }
    .greeting { font-size: 17px; font-weight: 600; color: #202124; margin-bottom: 16px; }
    .order-summary { background:#f0fdf4; border:1px solid #a7f3d0; border-radius:8px; padding:20px; margin:20px 0; }
    .order-number { background:#0EB0A6; color:#fff; padding:10px 16px; border-radius:6px; display:inline-block; font-weight:700; font-size:15px; margin: 12px 0; }
    .order-details { margin: 16px 0; }
    .detail-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #d1fae5; }
    .detail-row:last-child { border-bottom:none; }
    .detail-label { font-weight:500; color:#5f6368; }
    .detail-value { font-weight:700; color:#202124; }
    .visa-badge { display:inline-block; padding:4px 10px; border-radius:4px; font-size:12px; font-weight:600; margin-right:8px; }
    .visa-badge.e-visa { background:#dcfce7; color:#166534; }
    .visa-badge.sticker { background:#dbeafe; color:#1e40af; }
    .next-steps { background:#fef3c7; border:1px solid #fcd34d; border-radius:8px; padding:18px; margin:20px 0; }
    .next-steps h3 { color:#92400e; margin:0 0 12px; font-size:17px; }
    .next-steps ol { margin:0; padding-left:20px; }
    .next-steps li { margin:8px 0; color:#78350f; }
    .contact-info { background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; padding:18px; margin:22px 0; text-align:center; }
    .footer { background:#f8f9fa; padding:24px 36px; text-align:center; border-top:1px solid #eaecef; }
    .footer p { margin:5px 0; color:#5f6368; font-size:13px; }
    .price-box { background:#ecfdf5; border:2px solid #10b981; border-radius:8px; padding:16px; margin:16px 0; text-align:center; }
    .price-box .amount { font-size:28px; font-weight:700; color:#065f46; }
    @media (max-width:600px){ body{padding:10px;} .header,.content,.footer{padding:20px;} .detail-row{flex-direction:column; gap:4px;} }
  `;

  const visaTypeLabel = order.visaProduct?.visaType === 'e-visa' ? 'E-Visa' : 'Sticker Visa';
  const entryTypeLabel = order.visaProduct?.entryType === 'single' 
    ? (isEnglish ? 'Single Entry' : 'Enkel inresa')
    : (isEnglish ? 'Multiple Entry' : 'Flera inresor');

  if (isEnglish) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Visa Order Confirmation</title>
  <style>${styles}</style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="header-logo-container">
        <img src="https://www.doxvl.se/dox-logo-new.png" alt="DOX Visumpartner" class="header-logo">
      </div>
      <h1>🛂 Visa Order Confirmation</h1>
      <p>Thank you for your visa order with DOX Visumpartner</p>
    </div>

    <div class="content">
      <div class="greeting">
        Dear ${customerName},
      </div>

      <p>We have received your visa application and will start processing it shortly. Here is a summary of your order:</p>

      <div class="order-summary">
        <div class="order-number">
          Order: #${order.orderNumber}
        </div>

        <div class="order-details">
          <div class="detail-row">
            <span class="detail-label">Date:</span>
            <span class="detail-value">${date}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Destination:</span>
            <span class="detail-value">🌍 ${order.destinationCountry}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Nationality:</span>
            <span class="detail-value">${nationalityDisplay}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Visa Product:</span>
            <span class="detail-value">${productNameDisplay}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Visa Type:</span>
            <span class="detail-value">
              <span class="visa-badge ${order.visaProduct?.visaType}">${visaTypeLabel}</span>
              ${entryTypeLabel}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Validity:</span>
            <span class="detail-value">${order.visaProduct?.validityDays} days</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Departure:</span>
            <span class="detail-value">${order.departureDate || '-'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Return:</span>
            <span class="detail-value">${order.returnDate || '-'}</span>
          </div>
        </div>

        <div class="price-box">
          ${(order.pricingBreakdown?.serviceFee || order.pricingBreakdown?.embassyFee || order.pricingBreakdown?.expressPrice || order.pricingBreakdown?.urgentPrice) ? `
          <div style="font-size:14px; color:#6b7280; margin-bottom:8px;">
            <div>Service fee: ${(order.pricingBreakdown?.serviceFee || 0).toLocaleString()} kr</div>
            <div>Embassy fee: ${(order.pricingBreakdown?.embassyFee || 0).toLocaleString()} kr</div>
            ${order.pricingBreakdown?.expressPrice ? `<div style="color:#ea580c;">Express fee: +${order.pricingBreakdown.expressPrice.toLocaleString()} kr</div>` : ''}
            ${order.pricingBreakdown?.urgentPrice ? `<div style="color:#dc2626;">Urgent fee: +${order.pricingBreakdown.urgentPrice.toLocaleString()} kr</div>` : ''}
          </div>
          ` : ''}
          <div class="amount">${order.totalPrice?.toLocaleString()} kr</div>
          <div style="color:#6b7280; font-size:13px;">Total price ${order.customerType === 'company' ? '(excl. VAT)' : '(incl. VAT)'}</div>
        </div>
      </div>

      <div class="next-steps">
        <h3>📋 What happens next?</h3>
        <ol>
          <li><strong>Review:</strong> We will review your order within 1 business day</li>
          <li><strong>Documents:</strong> We will contact you about any required documents</li>
          ${order.visaProduct?.visaType === 'e-visa' ? `
          <li><strong>Processing:</strong> We submit your application through the e-visa portal</li>
          <li><strong>Delivery:</strong> Your approved e-visa will be sent to your email</li>
          ` : `
          <li><strong>Passport:</strong> Send your passport to us (instructions will follow)</li>
          <li><strong>Embassy:</strong> We submit your application to the embassy</li>
          <li><strong>Return:</strong> Your passport with visa will be returned to you</li>
          `}
        </ol>
      </div>

      ${generateDocumentRequirementsHtml(documentRequirements, true, confirmationToken)}

      <div class="contact-info">
        <h3>Questions about your visa?</h3>
        <p>Our visa experts are here to help:</p>
        <p>
          📧 <a href="mailto:info@visumpartner.se">info@visumpartner.se</a><br>
          📞 08-40941900
        </p>
      </div>
    </div>

    <div class="footer">
      <p><strong>DOX Visumpartner</strong></p>
      <p>Professional visa services for travelers</p>
      <p>This is an automatically generated message.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  // Swedish version
  return `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bekräftelse på visumbeställning</title>
  <style>${styles}</style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="header-logo-container">
        <img src="https://www.doxvl.se/dox-logo-new.png" alt="DOX Visumpartner" class="header-logo">
      </div>
      <h1>🛂 Bekräftelse på visumbeställning</h1>
      <p>Tack för din visumbeställning hos DOX Visumpartner</p>
    </div>

    <div class="content">
      <div class="greeting">
        Hej ${customerName}!
      </div>

      <p>Vi har mottagit din visumansökan och kommer att börja behandla den inom kort. Här är en sammanfattning av din beställning:</p>

      <div class="order-summary">
        <div class="order-number">
          Order: #${order.orderNumber}
        </div>

        <div class="order-details">
          <div class="detail-row">
            <span class="detail-label">Datum:</span>
            <span class="detail-value">${date}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Destination:</span>
            <span class="detail-value">🌍 ${order.destinationCountry}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Nationalitet:</span>
            <span class="detail-value">${order.nationality}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Visumprodukt:</span>
            <span class="detail-value">${order.visaProduct?.name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Visumtyp:</span>
            <span class="detail-value">
              <span class="visa-badge ${order.visaProduct?.visaType}">${visaTypeLabel}</span>
              ${entryTypeLabel}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Giltighet:</span>
            <span class="detail-value">${order.visaProduct?.validityDays} dagar</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Avresa:</span>
            <span class="detail-value">${order.departureDate || '-'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Hemresa:</span>
            <span class="detail-value">${order.returnDate || '-'}</span>
          </div>
        </div>

        <div class="price-box">
          ${(order.pricingBreakdown?.serviceFee || order.pricingBreakdown?.embassyFee || order.pricingBreakdown?.expressPrice || order.pricingBreakdown?.urgentPrice) ? `
          <div style="font-size:14px; color:#6b7280; margin-bottom:8px;">
            <div>Serviceavgift: ${(order.pricingBreakdown?.serviceFee || 0).toLocaleString()} kr</div>
            <div>Ambassadavgift: ${(order.pricingBreakdown?.embassyFee || 0).toLocaleString()} kr</div>
            ${order.pricingBreakdown?.expressPrice ? `<div style="color:#ea580c;">Expressavgift: +${order.pricingBreakdown.expressPrice.toLocaleString()} kr</div>` : ''}
            ${order.pricingBreakdown?.urgentPrice ? `<div style="color:#dc2626;">Brådskande avgift: +${order.pricingBreakdown.urgentPrice.toLocaleString()} kr</div>` : ''}
          </div>
          ` : ''}
          <div class="amount">${order.totalPrice?.toLocaleString()} kr</div>
          <div style="color:#6b7280; font-size:13px;">Totalt pris ${order.customerType === 'company' ? '(exkl. moms)' : '(inkl. moms)'}</div>
        </div>
      </div>

      <div class="next-steps">
        <h3>📋 Vad händer nu?</h3>
        <ol>
          <li><strong>Granskning:</strong> Vi granskar din beställning inom 1 arbetsdag</li>
          <li><strong>Dokument:</strong> Vi kontaktar dig om eventuella dokument som behövs</li>
          ${order.visaProduct?.visaType === 'e-visa' ? `
          <li><strong>Behandling:</strong> Vi skickar in din ansökan via e-visumportalen</li>
          <li><strong>Leverans:</strong> Ditt godkända e-visum skickas till din e-post</li>
          ` : `
          <li><strong>Pass:</strong> Skicka ditt pass till oss (instruktioner kommer)</li>
          <li><strong>Ambassad:</strong> Vi lämnar in din ansökan till ambassaden</li>
          <li><strong>Retur:</strong> Ditt pass med visum skickas tillbaka till dig</li>
          `}
        </ol>
      </div>

      ${generateDocumentRequirementsHtml(documentRequirements, false, confirmationToken)}

      <div class="contact-info">
        <h3>Frågor om ditt visum?</h3>
        <p>Våra visumexperter hjälper dig gärna:</p>
        <p>
          📧 <a href="mailto:info@visumpartner.se">info@visumpartner.se</a><br>
          📞 08-40941900
        </p>
      </div>
    </div>

    <div class="footer">
      <p><strong>DOX Visumpartner</strong></p>
      <p>Professionella visumtjänster för resenärer</p>
      <p>Detta är ett automatiskt genererat meddelande.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

// Generate styled HTML email for business/admin notification
export const generateVisaBusinessNotificationEmail = (params: VisaEmailParams): string => {
  const { order } = params;
  const date = new Date().toLocaleDateString('en-GB');

  const customerName = order.customerInfo?.companyName 
    || `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim()
    || 'Customer';

  const styles = `
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #202124;
      max-width: 600px;
      margin: 0 auto;
      background-color: #f8f9fa;
      padding: 20px;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .header {
      background-color: #ffffff;
      padding: 28px 36px;
      text-align: center;
      border-bottom: 3px solid #f59e0b;
    }
    .header-logo-container {
      display: inline-block;
      margin-bottom: 16px;
    }
    .header-logo {
      max-height: 70px;
      width: auto;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.2px;
      color: #202124;
    }
    .header p {
      color: #5f6368;
      margin: 8px 0 0 0;
    }
    .content { padding: 32px 36px; }
    .order-summary { background:#fef3c7; border:1px solid #fcd34d; border-radius:8px; padding:20px; margin:20px 0; }
    .order-number { background:#d97706; color:#fff; padding:10px 16px; border-radius:6px; display:inline-block; font-weight:700; font-size:15px; margin: 12px 0; }
    .order-details { margin: 16px 0; }
    .detail-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #fde68a; }
    .detail-row:last-child { border-bottom:none; }
    .detail-label { font-weight:500; color:#92400e; }
    .detail-value { font-weight:700; color:#202124; }
    .visa-badge { display:inline-block; padding:4px 10px; border-radius:4px; font-size:12px; font-weight:600; margin-right:8px; }
    .visa-badge.e-visa { background:#dcfce7; color:#166534; }
    .visa-badge.sticker { background:#dbeafe; color:#1e40af; }
    .customer-info { background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; padding:18px; margin:20px 0; }
    .customer-info h3 { color:#0369a1; margin:0 0 12px; font-size:17px; }
    .price-box { background:#ecfdf5; border:2px solid #10b981; border-radius:8px; padding:16px; margin:16px 0; text-align:center; }
    .price-box .amount { font-size:28px; font-weight:700; color:#065f46; }
    .footer { background:#f8f9fa; padding:24px 36px; text-align:center; border-top:1px solid #eaecef; }
    .footer p { margin:5px 0; color:#5f6368; font-size:13px; }
    .action-needed { background:#fee2e2; border:2px solid #ef4444; border-radius:8px; padding:16px; margin:20px 0; text-align:center; }
    .action-needed h3 { color:#dc2626; margin:0 0 8px; }
    @media (max-width:600px){ body{padding:10px;} .header,.content,.footer{padding:20px;} .detail-row{flex-direction:column; gap:4px;} }
  `;

  const visaTypeLabel = order.visaProduct?.visaType === 'e-visa' ? 'E-Visa' : 'Sticker Visa';
  const entryTypeLabel = order.visaProduct?.entryType === 'single' 
    ? 'Single entry'
    : order.visaProduct?.entryType === 'double'
      ? 'Double entry'
      : 'Multiple entry';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Visa Order</title>
  <style>${styles}</style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="header-logo-container">
        <img src="https://www.doxvl.se/dox-logo-new.png" alt="DOX Visumpartner" class="header-logo">
      </div>
      <h1>New Visa Order</h1>
      <p>A new visa order has been received</p>
    </div>

    <div class="content">
      <div class="action-needed">
        <h3>Action Required</h3>
        <p>Review the order and contact the customer within 1 business day</p>
      </div>

      <div class="order-summary">
        <div class="order-number">
          Order: #${order.orderNumber}
        </div>

        <div class="order-details">
          <div class="detail-row">
            <span class="detail-label">Date:</span>
            <span class="detail-value">${date}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Destination:</span>
            <span class="detail-value">${order.destinationCountry}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Nationality:</span>
            <span class="detail-value">${order.nationality}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Visa Product:</span>
            <span class="detail-value">${order.visaProduct?.name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Visa Type:</span>
            <span class="detail-value">
              <span class="visa-badge ${order.visaProduct?.visaType}">${visaTypeLabel}</span>
              ${entryTypeLabel}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Validity:</span>
            <span class="detail-value">${order.visaProduct?.validityDays} days</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Departure:</span>
            <span class="detail-value">${order.departureDate || '-'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Return:</span>
            <span class="detail-value">${order.returnDate || '-'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Visa needed by:</span>
            <span class="detail-value">${order.passportNeededBy || '-'}</span>
          </div>
        </div>

        <div class="price-box">
          ${(order.pricingBreakdown?.serviceFee || order.pricingBreakdown?.embassyFee || order.pricingBreakdown?.expressPrice || order.pricingBreakdown?.urgentPrice) ? `
          <div style="font-size:14px; color:#6b7280; margin-bottom:8px;">
            <div>Service fee: ${(order.pricingBreakdown?.serviceFee || 0).toLocaleString()} kr</div>
            <div>Embassy fee: ${(order.pricingBreakdown?.embassyFee || 0).toLocaleString()} kr</div>
            ${order.pricingBreakdown?.expressPrice ? `<div style="color:#ea580c;">Express fee: +${order.pricingBreakdown.expressPrice.toLocaleString()} kr</div>` : ''}
            ${order.pricingBreakdown?.urgentPrice ? `<div style="color:#dc2626;">Urgent fee: +${order.pricingBreakdown.urgentPrice.toLocaleString()} kr</div>` : ''}
          </div>
          ` : ''}
          <div class="amount">${order.totalPrice?.toLocaleString()} kr</div>
          <div style="color:#6b7280; font-size:13px;">Total price ${order.customerType === 'company' ? '(excl. VAT)' : '(incl. VAT)'}</div>
        </div>
      </div>

      <div class="customer-info">
        <h3>Customer Information</h3>
        <div class="order-details">
          <div class="detail-row">
            <span class="detail-label">Name:</span>
            <span class="detail-value">${customerName}</span>
          </div>
          ${order.customerInfo?.companyName ? `
          <div class="detail-row">
            <span class="detail-label">Company:</span>
            <span class="detail-value">${order.customerInfo.companyName}</span>
          </div>
          ` : ''}
          <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span class="detail-value"><a href="mailto:${order.customerInfo?.email}">${order.customerInfo?.email}</a></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Phone:</span>
            <span class="detail-value"><a href="tel:${order.customerInfo?.phone}">${order.customerInfo?.phone}</a></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Customer type:</span>
            <span class="detail-value">${order.customerType === 'company' ? 'Company' : 'Private'}</span>
          </div>
        </div>
      </div>

      ${order.returnAddress ? `
      <div class="customer-info" style="background:#f0fdf4; border-color:#a7f3d0;">
        <h3 style="color:#166534;">Delivery Address</h3>
        <p style="margin:0; color:#202124;">
          ${order.returnAddress.firstName || ''} ${order.returnAddress.lastName || ''}<br>
          ${order.returnAddress.companyName ? `${order.returnAddress.companyName}<br>` : ''}
          ${order.returnAddress.street || ''}<br>
          ${order.returnAddress.postalCode || ''} ${order.returnAddress.city || ''}<br>
          ${order.returnAddress.country || ''}
        </p>
      </div>
      ` : ''}

      <div style="text-align:center; margin-top:24px;">
        <a href="https://www.doxvl.se/admin/visa-orders/${order.id || order.orderNumber}" 
           style="display:inline-block; background:#0EB0A6; color:#fff; padding:14px 28px; border-radius:8px; text-decoration:none; font-weight:600;">
          Open in Admin
        </a>
      </div>
    </div>

    <div class="footer">
      <p><strong>DOX Visumpartner - Internal Notification</strong></p>
      <p>This is an automatically generated message.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};
