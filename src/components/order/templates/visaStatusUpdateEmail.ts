/**
 * Visa Status Update Email Templates
 * HTML emails sent to customers when visa order processing steps are completed
 */

interface VisaStatusEmailParams {
  customerName: string;
  orderNumber: string;
  destinationCountry: string;
  visaProductName: string;
  visaProductNameEn?: string;
  locale: string;
  invoiceReference?: string;
}

const emailStyles = `
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
    background: #ffffff;
    color: #2E2D2C;
    padding: 28px 36px;
    text-align: center;
    border-bottom: 2px solid #2E2D2C;
  }
  .header h1 {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 0.2px;
    color: #2E2D2C;
  }
  .header p {
    color: #5f6368;
  }
  .content { padding: 32px 36px; }
  .greeting { font-size: 17px; font-weight: 600; color: #202124; margin-bottom: 16px; }
  .order-summary { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px; margin:20px 0; }
  .order-number { background:#0EB0A6; color:#fff; padding:10px 16px; border-radius:6px; display:inline-block; font-weight:700; font-size:15px; margin: 12px 0; }
  .detail-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eaecef; }
  .detail-row:last-child { border-bottom:none; }
  .detail-label { font-weight:500; color:#5f6368; }
  .detail-value { font-weight:700; color:#202124; }
  .status-box { border-radius:8px; padding:18px; margin:20px 0; }
  .contact-info { background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; padding:18px; margin:22px 0; text-align:center; }
  .footer { background:#f8f9fa; padding:24px 36px; text-align:center; border-top:1px solid #eaecef; }
  .footer p { margin:5px 0; color:#5f6368; font-size:13px; }
  .highlight { background:#fef3c7; padding:2px 6px; border-radius:3px; font-weight:700; }
  @media (max-width:600px){ body{padding:10px;} .header,.content,.footer{padding:20px;} .detail-row{flex-direction:column; gap:4px;} }
`;

function orderSummaryHtml(params: VisaStatusEmailParams, isEnglish: boolean): string {
  const date = new Date().toLocaleDateString(isEnglish ? 'en-GB' : 'sv-SE');
  return `
    <div class="order-summary">
      <div class="order-number">
        ${isEnglish ? 'Order number' : 'Ordernummer'}: #${params.orderNumber}
      </div>
      <div style="margin-top:12px;">
        <div class="detail-row">
          <span class="detail-label">${isEnglish ? 'Date' : 'Datum'}:</span>
          <span class="detail-value">${date}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${isEnglish ? 'Destination' : 'Destination'}:</span>
          <span class="detail-value">${params.destinationCountry}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${isEnglish ? 'Visa type' : 'Visumtyp'}:</span>
          <span class="detail-value">${isEnglish ? (params.visaProductNameEn || params.visaProductName) : params.visaProductName}</span>
        </div>
        ${params.invoiceReference ? `
        <div class="detail-row">
          <span class="detail-label">${isEnglish ? 'Your reference' : 'Er referens'}:</span>
          <span class="detail-value">${params.invoiceReference}</span>
        </div>
        ` : ''}
      </div>
    </div>
  `;
}

function contactHtml(isEnglish: boolean): string {
  return `
    <div class="contact-info">
      <h3>${isEnglish ? 'Questions?' : 'Har du frågor?'}</h3>
      <p>${isEnglish ? 'Feel free to contact us:' : 'Kontakta oss gärna:'}</p>
      <p>
        📧 <a href="mailto:info@doxvl.se">info@doxvl.se</a><br>
        📞 08-40941900
      </p>
    </div>
  `;
}

function footerHtml(isEnglish: boolean): string {
  return `
    <div class="footer">
      <p><strong>DOX Visumpartner AB</strong></p>
      <p>${isEnglish ? 'Professional visa & document legalisation services' : 'Professionella visum- & legaliseringstjänster'}</p>
      <p>${isEnglish ? 'This is an automatically generated message.' : 'Detta är ett automatiskt genererat meddelande.'}</p>
    </div>
  `;
}

function trackingHtml(params: VisaStatusEmailParams, isEnglish: boolean): string {
  return `
    <div style="background:#f0fdf4; border:2px solid #22c55e; border-radius:8px; padding:20px; margin:22px 0; text-align:center;">
      <h3 style="color:#166534; margin:0 0 10px; font-size:17px;">📍 ${isEnglish ? 'Track Your Order' : 'Följ din order'}</h3>
      <p style="color:#15803d; margin:0 0 14px; font-size:14px;">${isEnglish ? 'Follow the progress of your visa application in real-time:' : 'Följ ditt visumärende i realtid:'}</p>
      <a href="https://doxvl.se/orderstatus?order=${params.orderNumber}" style="display:inline-block; background:#22c55e; color:#fff; padding:12px 28px; border-radius:6px; text-decoration:none; font-weight:700; font-size:15px;">${isEnglish ? 'Track Order Status' : 'Se orderstatus'}</a>
    </div>
  `;
}

function wrapEmail(lang: string, title: string, headerTitle: string, headerSubtitle: string, bodyContent: string): string {
  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="https://doxvl.se/dox-logo-new.png" alt="DOX Visumpartner AB" style="max-height:50px;width:auto;margin-bottom:16px;border:1px solid #e2e8f0;border-radius:6px;padding:4px;background:#fff;">
      <h1>${headerTitle}</h1>
      <p>${headerSubtitle}</p>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    ${footerHtml(lang === 'en')}
  </div>
</body>
</html>
  `.trim();
}

// ─── Portal Submission / Embassy Drop-off ───────────────────────────────
export function generateVisaSubmittedEmail(params: VisaStatusEmailParams): { subject: string; html: string } {
  const isEn = params.locale === 'en';

  const subject = isEn
    ? `Your visa application has been submitted – ${params.orderNumber}`
    : `Din visumansökan har skickats in – ${params.orderNumber}`;

  const body = `
    <div class="greeting">${isEn ? `Dear ${params.customerName},` : `Hej ${params.customerName}!`}</div>
    <p>${isEn
      ? `We have now submitted your visa application for <strong>${params.destinationCountry}</strong> through the official visa portal.`
      : `Vi har nu skickat in din visumansökan för <strong>${params.destinationCountry}</strong> via den officiella visumportalen.`}</p>
    <p>${isEn
      ? 'Your application is now being processed. We will notify you as soon as we receive a result.'
      : 'Din ansökan behandlas nu. Vi meddelar dig så snart vi får ett resultat.'}</p>
    <div class="status-box" style="background:#eff6ff; border:1px solid #bfdbfe;">
      <p style="margin:0; font-size:15px;">
        ${isEn ? '🌐 <strong>Status:</strong> Application submitted' : '🌐 <strong>Status:</strong> Ansökan inskickad'}
      </p>
    </div>
    ${orderSummaryHtml(params, isEn)}
    ${trackingHtml(params, isEn)}
    ${contactHtml(isEn)}
  `;

  return {
    subject,
    html: wrapEmail(isEn ? 'en' : 'sv',
      isEn ? 'Visa application submitted' : 'Visumansökan inskickad',
      isEn ? 'Visa Application Submitted' : 'Visumansökan inskickad',
      isEn ? 'Update for your order with DOX Visumpartner AB' : 'Uppdatering för din order hos DOX Visumpartner AB',
      body)
  };
}

// ─── Visa Result (Approved) ─────────────────────────────────────────────
export function generateVisaApprovedEmail(params: VisaStatusEmailParams): { subject: string; html: string } {
  const isEn = params.locale === 'en';

  const subject = isEn
    ? `Great news! Your visa has been approved – ${params.orderNumber}`
    : `Goda nyheter! Ditt visum har godkänts – ${params.orderNumber}`;

  const body = `
    <div class="greeting">${isEn ? `Dear ${params.customerName},` : `Hej ${params.customerName}!`}</div>
    <p>${isEn
      ? `We are pleased to inform you that your visa application for <strong>${params.destinationCountry}</strong> has been <strong>approved</strong>! 🎉`
      : `Vi är glada att meddela att din visumansökan för <strong>${params.destinationCountry}</strong> har <strong>godkänts</strong>! 🎉`}</p>
    <div class="status-box" style="background:#f0fdf4; border:1px solid #86efac;">
      <p style="margin:0; font-size:15px;">
        ${isEn ? '✅ <strong>Status:</strong> Visa approved' : '✅ <strong>Status:</strong> Visum godkänt'}
      </p>
    </div>
    ${orderSummaryHtml(params, isEn)}
    ${trackingHtml(params, isEn)}
    ${contactHtml(isEn)}
  `;

  return {
    subject,
    html: wrapEmail(isEn ? 'en' : 'sv',
      isEn ? 'Visa approved' : 'Visum godkänt',
      isEn ? 'Visa Approved ✅' : 'Visum godkänt ✅',
      isEn ? 'Update for your order with DOX Visumpartner AB' : 'Uppdatering för din order hos DOX Visumpartner AB',
      body)
  };
}

// ─── Visa Result (Rejected) ─────────────────────────────────────────────
export function generateVisaRejectedEmail(params: VisaStatusEmailParams): { subject: string; html: string } {
  const isEn = params.locale === 'en';

  const subject = isEn
    ? `Visa application update – ${params.orderNumber}`
    : `Uppdatering om visumansökan – ${params.orderNumber}`;

  const body = `
    <div class="greeting">${isEn ? `Dear ${params.customerName},` : `Hej ${params.customerName}!`}</div>
    <p>${isEn
      ? `Unfortunately, your visa application for <strong>${params.destinationCountry}</strong> has been <strong>rejected</strong> by the authorities.`
      : `Tyvärr har din visumansökan för <strong>${params.destinationCountry}</strong> blivit <strong>avslagen</strong> av myndigheterna.`}</p>
    <p>${isEn
      ? 'Please contact us to discuss next steps and possible options.'
      : 'Vänligen kontakta oss för att diskutera nästa steg och möjliga alternativ.'}</p>
    <div class="status-box" style="background:#fef2f2; border:1px solid #fecaca;">
      <p style="margin:0; font-size:15px;">
        ${isEn ? '❌ <strong>Status:</strong> Visa rejected' : '❌ <strong>Status:</strong> Visum avslaget'}
      </p>
    </div>
    ${orderSummaryHtml(params, isEn)}
    ${contactHtml(isEn)}
  `;

  return {
    subject,
    html: wrapEmail(isEn ? 'en' : 'sv',
      isEn ? 'Visa application update' : 'Uppdatering om visumansökan',
      isEn ? 'Visa Application Update' : 'Uppdatering om visumansökan',
      isEn ? 'Update for your order with DOX Visumpartner AB' : 'Uppdatering för din order hos DOX Visumpartner AB',
      body)
  };
}

// ─── E-Visa Delivery ────────────────────────────────────────────────────
export function generateEVisaDeliveryEmail(params: VisaStatusEmailParams): { subject: string; html: string } {
  const isEn = params.locale === 'en';

  const subject = isEn
    ? `Your e-visa is ready! – ${params.orderNumber}`
    : `Ditt e-visum är klart! – ${params.orderNumber}`;

  const body = `
    <div class="greeting">${isEn ? `Dear ${params.customerName},` : `Hej ${params.customerName}!`}</div>
    <p>${isEn
      ? `Your e-visa for <strong>${params.destinationCountry}</strong> has been approved and is attached to this email or available in your order status page.`
      : `Ditt e-visum för <strong>${params.destinationCountry}</strong> har godkänts och bifogas i detta mail eller finns tillgängligt på din orderstatussida.`}</p>
    <p>${isEn
      ? '<strong>Important:</strong> Print your e-visa and bring it with you when traveling. We also recommend saving a digital copy on your phone.'
      : '<strong>Viktigt:</strong> Skriv ut ditt e-visum och ta med det på resan. Vi rekommenderar även att spara en digital kopia på din telefon.'}</p>
    <div class="status-box" style="background:#f0fdf4; border:1px solid #86efac;">
      <p style="margin:0; font-size:15px;">
        ${isEn ? '📧 <strong>Status:</strong> E-visa delivered' : '📧 <strong>Status:</strong> E-visum levererat'}
      </p>
    </div>
    ${orderSummaryHtml(params, isEn)}
    ${trackingHtml(params, isEn)}
    ${contactHtml(isEn)}
  `;

  return {
    subject,
    html: wrapEmail(isEn ? 'en' : 'sv',
      isEn ? 'E-visa delivered' : 'E-visum levererat',
      isEn ? 'Your E-Visa is Ready! 📧' : 'Ditt e-visum är klart! 📧',
      isEn ? 'Update for your order with DOX Visumpartner AB' : 'Uppdatering för din order hos DOX Visumpartner AB',
      body)
  };
}

// ─── Documents / Passport Received ──────────────────────────────────────
export function generateVisaDocsReceivedEmail(params: VisaStatusEmailParams): { subject: string; html: string } {
  const isEn = params.locale === 'en';

  const subject = isEn
    ? `We have received your documents – ${params.orderNumber}`
    : `Vi har mottagit dina dokument – ${params.orderNumber}`;

  const body = `
    <div class="greeting">${isEn ? `Dear ${params.customerName},` : `Hej ${params.customerName}!`}</div>
    <p>${isEn
      ? `We confirm that we have received your documents for your visa application to <strong>${params.destinationCountry}</strong>.`
      : `Vi bekräftar att vi har mottagit dina dokument för din visumansökan till <strong>${params.destinationCountry}</strong>.`}</p>
    <p>${isEn
      ? 'Our team will now review and prepare your application. We will keep you updated on the progress.'
      : 'Vårt team kommer nu att granska och förbereda din ansökan. Vi håller dig uppdaterad om framstegen.'}</p>
    <div class="status-box" style="background:#eff6ff; border:1px solid #bfdbfe;">
      <p style="margin:0; font-size:15px;">
        ${isEn ? '📄 <strong>Status:</strong> Documents received' : '📄 <strong>Status:</strong> Dokument mottagna'}
      </p>
    </div>
    ${orderSummaryHtml(params, isEn)}
    ${trackingHtml(params, isEn)}
    ${contactHtml(isEn)}
  `;

  return {
    subject,
    html: wrapEmail(isEn ? 'en' : 'sv',
      isEn ? 'Documents received' : 'Dokument mottagna',
      isEn ? 'Documents Received' : 'Dokument mottagna',
      isEn ? 'Update for your order with DOX Visumpartner AB' : 'Uppdatering för din order hos DOX Visumpartner AB',
      body)
  };
}

// ─── Return Shipping (Passport sent back) ───────────────────────────────
export function generateVisaReturnShippingEmail(
  params: VisaStatusEmailParams & { trackingNumber?: string; trackingUrl?: string }
): { subject: string; html: string } {
  const isEn = params.locale === 'en';

  const subject = isEn
    ? `Your passport has been shipped – ${params.orderNumber}`
    : `Ditt pass har skickats – ${params.orderNumber}`;

  const trackingBlock = params.trackingNumber
    ? `<p>${isEn ? 'Tracking number' : 'Spårningsnummer'}: <span class="highlight">${params.trackingNumber}</span></p>
       ${params.trackingUrl ? `<p><a href="${params.trackingUrl}" style="color:#0EB0A6; font-weight:600;">${isEn ? 'Track your shipment →' : 'Spåra din försändelse →'}</a></p>` : ''}`
    : '';

  const body = `
    <div class="greeting">${isEn ? `Dear ${params.customerName},` : `Hej ${params.customerName}!`}</div>
    <p>${isEn
      ? `Your passport with the approved visa for <strong>${params.destinationCountry}</strong> has been shipped and is on its way to you.`
      : `Ditt pass med det godkända visumet för <strong>${params.destinationCountry}</strong> har skickats och är på väg till dig.`}</p>
    ${trackingBlock}
    <div class="status-box" style="background:#f0fdf4; border:1px solid #86efac;">
      <p style="margin:0; font-size:15px;">
        ${isEn ? '🚚 <strong>Status:</strong> Passport shipped' : '🚚 <strong>Status:</strong> Pass skickat'}
      </p>
    </div>
    ${orderSummaryHtml(params, isEn)}
    ${contactHtml(isEn)}
  `;

  return {
    subject,
    html: wrapEmail(isEn ? 'en' : 'sv',
      isEn ? 'Passport shipped' : 'Pass skickat',
      isEn ? 'Your Passport Has Been Shipped 🚚' : 'Ditt pass har skickats 🚚',
      isEn ? 'Update for your order with DOX Visumpartner AB' : 'Uppdatering för din order hos DOX Visumpartner AB',
      body)
  };
}

// ─── Embassy Submission (Sticker Visa) ──────────────────────────────────
export function generateVisaEmbassySubmittedEmail(params: VisaStatusEmailParams): { subject: string; html: string } {
  const isEn = params.locale === 'en';

  const subject = isEn
    ? `Your passport has been submitted to the embassy – ${params.orderNumber}`
    : `Ditt pass har lämnats in till ambassaden – ${params.orderNumber}`;

  const body = `
    <div class="greeting">${isEn ? `Dear ${params.customerName},` : `Hej ${params.customerName}!`}</div>
    <p>${isEn
      ? `We have submitted your passport and visa application documents to the <strong>${params.destinationCountry}</strong> embassy.`
      : `Vi har lämnat in ditt pass och dina visumhandlingar till <strong>${params.destinationCountry}s</strong> ambassad.`}</p>
    <p>${isEn
      ? 'The embassy will now process your application. Processing times vary, but we will notify you as soon as we receive your passport back.'
      : 'Ambassaden kommer nu att behandla din ansökan. Handläggningstiden varierar, men vi meddelar dig så snart vi fått tillbaka ditt pass.'}</p>
    <div class="status-box" style="background:#eff6ff; border:1px solid #bfdbfe;">
      <p style="margin:0; font-size:15px;">
        ${isEn ? '🏛️ <strong>Status:</strong> Submitted to embassy' : '🏛️ <strong>Status:</strong> Inlämnat till ambassaden'}
      </p>
    </div>
    ${orderSummaryHtml(params, isEn)}
    ${trackingHtml(params, isEn)}
    ${contactHtml(isEn)}
  `;

  return {
    subject,
    html: wrapEmail(isEn ? 'en' : 'sv',
      isEn ? 'Submitted to embassy' : 'Inlämnat till ambassaden',
      isEn ? 'Submitted to Embassy 🏛️' : 'Inlämnat till ambassaden 🏛️',
      isEn ? 'Update for your order with DOX Visumpartner AB' : 'Uppdatering för din order hos DOX Visumpartner AB',
      body)
  };
}
