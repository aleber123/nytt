/**
 * Customer Confirmation Email Template
 * HTML email sent to customer when their order is placed
 */

interface CustomerEmailParams {
  orderId: string;
  customerFirstName: string;
  customerLastName: string;
  countryName: string;
  documentType: string;
  quantity: number;
  services: string;
  totalPrice: number;
  documentSource: 'upload' | 'original';
  returnService: string;
  locale: string;
}

export const generateCustomerConfirmationEmail = (params: CustomerEmailParams): string => {
  const {
    orderId,
    customerFirstName,
    customerLastName,
    countryName,
    documentType,
    quantity,
    services,
    totalPrice,
    documentSource,
    returnService,
    locale
  } = params;

  const isEnglish = locale === 'en';
  const date = new Date().toLocaleDateString(isEnglish ? 'en-GB' : 'sv-SE');

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
      background: #2E2D2C;
      color: #ffffff;
      padding: 28px 36px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.2px;
    }
    .content { padding: 32px 36px; }
    .greeting { font-size: 17px; font-weight: 600; color: #202124; margin-bottom: 16px; }
    .order-summary { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px; margin:20px 0; }
    .order-number { background:#0EB0A6; color:#fff; padding:10px 16px; border-radius:6px; display:inline-block; font-weight:700; font-size:15px; margin: 12px 0; }
    .order-details { margin: 16px 0; }
    .detail-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eaecef; }
    .detail-row:last-child { border-bottom:none; }
    .detail-label { font-weight:500; color:#5f6368; }
    .detail-value { font-weight:700; color:#202124; }
    .next-steps { background:#ecfdf5; border:1px solid #a7f3d0; border-radius:8px; padding:18px; margin:20px 0; }
    .next-steps h3 { color:#065f46; margin:0 0 8px; font-size:17px; }
    .address-box { background:#fff; border:2px solid #065f46; border-radius:6px; padding:14px; margin:12px 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size:14px; }
    .contact-info { background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; padding:18px; margin:22px 0; text-align:center; }
    .footer { background:#f8f9fa; padding:24px 36px; text-align:center; border-top:1px solid #eaecef; }
    .footer p { margin:5px 0; color:#5f6368; font-size:13px; }
    .highlight { background:#fef3c7; padding:2px 6px; border-radius:3px; font-weight:700; }
    @media (max-width:600px){ body{padding:10px;} .header,.content,.footer{padding:20px;} .detail-row{flex-direction:column; gap:4px;} }
  `;

  if (isEnglish) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
  <style>${styles}</style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Order Confirmation</h1>
      <p>Thank you for your order with DOX Visumpartner AB</p>
    </div>

    <div class="content">
      <div class="greeting">
        Dear ${customerFirstName} ${customerLastName},
      </div>

      <p>We have received your order and will now start processing it. Here is a summary:</p>

      <div class="order-summary">
        <div class="order-number">
          Order number: #${orderId}
        </div>

        <div class="order-details">
          <div class="detail-row">
            <span class="detail-label">Date:</span>
            <span class="detail-value">${date}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Country:</span>
            <span class="detail-value">${countryName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Document type:</span>
            <span class="detail-value">${documentType}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Number of documents:</span>
            <span class="detail-value">${quantity}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Selected services:</span>
            <span class="detail-value">${services}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Total amount:</span>
            <span class="detail-value highlight">${totalPrice} SEK</span>
          </div>
        </div>
      </div>

      ${documentSource === 'original' ?
        `<div class="next-steps">
          <h3>📦 Next steps</h3>
          <p>Please send your original documents to the following address:</p>
          <div class="address-box">
            <strong>DOX Visumpartner AB</strong><br>
            Att: Document handling<br>
            Box 38<br>
            121 25 Stockholm-Globen<br>
            Sweden
          </div>
          <p><strong>Important:</strong> Mark the envelope with <span class="highlight">"Order #${orderId}"</span> and send it as <strong>registered mail</strong>.</p>
        </div>`
        :
        `<div class="next-steps">
          <h3>✅ Your files have been received</h3>
          <p>Your uploaded files have been received and will be processed shortly.</p>
        </div>`}

      <p>You will receive your legalized documents via <strong>${returnService}</strong>.</p>

      <div class="order-tracking" style="background:#f0fdf4; border:2px solid #22c55e; border-radius:8px; padding:20px; margin:22px 0; text-align:center;">
        <h3 style="color:#166534; margin:0 0 10px; font-size:17px;">📍 Track Your Order</h3>
        <p style="color:#15803d; margin:0 0 14px; font-size:14px;">Follow the progress of your order in real-time:</p>
        <a href="https://www.doxvl.se/orderstatus?order=${orderId}" style="display:inline-block; background:#22c55e; color:#fff; padding:12px 28px; border-radius:6px; text-decoration:none; font-weight:700; font-size:15px;">Track Order Status</a>
        <p style="color:#6b7280; margin:14px 0 0; font-size:12px;">Use your email address to verify and view status</p>
      </div>

      <div class="contact-info">
        <h3>Questions?</h3>
        <p>Feel free to contact us:</p>
        <p>
          📧 <a href="mailto:info@doxvl.se">info@doxvl.se</a><br>
          📞 08-40941900
        </p>
      </div>
    </div>

    <div class="footer">
      <p><strong>DOX Visumpartner AB</strong></p>
      <p>Professional document legalisation for many years</p>
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
  <title>Orderbekräftelse</title>
  <style>${styles}</style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Orderbekräftelse</h1>
      <p>Tack för din beställning hos DOX Visumpartner AB</p>
    </div>

    <div class="content">
      <div class="greeting">
        Hej ${customerFirstName}!
      </div>

      <p>Vi har mottagit din beställning och den behandlas nu. Här är en sammanfattning:</p>

      <div class="order-summary">
        <div class="order-number">
          Ordernummer: #${orderId}
        </div>

        <div class="order-details">
          <div class="detail-row">
            <span class="detail-label">Datum:</span>
            <span class="detail-value">${date}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Land:</span>
            <span class="detail-value">${countryName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Dokumenttyp:</span>
            <span class="detail-value">${documentType}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Antal dokument:</span>
            <span class="detail-value">${quantity} st</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Valda tjänster:</span>
            <span class="detail-value">${services}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Totalbelopp:</span>
            <span class="detail-value highlight">${totalPrice} kr</span>
          </div>
        </div>
      </div>

      ${documentSource === 'original' ?
        `<div class="next-steps">
          <h3>📦 Nästa steg</h3>
          <p>Skicka dina originaldokument till följande adress:</p>
          <div class="address-box">
            <strong>DOX Visumpartner AB</strong><br>
            Att: Dokumenthantering<br>
            Box 38<br>
            121 25 Stockholm-Globen<br>
            Sverige
          </div>
          <p><strong>Viktigt:</strong> Märk försändelsen med <span class="highlight">"Order #${orderId}"</span> och skicka med <strong>REK (rekommenderat brev)</strong>.</p>
        </div>`
        :
        `<div class="next-steps">
          <h3>✅ Dina filer har mottagits</h3>
          <p>Dina uppladdade filer har mottagits och kommer att behandlas inom kort.</p>
        </div>`}

      <p>Du kommer att få dina legaliserade dokument returnerade via <strong>${returnService}</strong>.</p>

      <div class="order-tracking" style="background:#f0fdf4; border:2px solid #22c55e; border-radius:8px; padding:20px; margin:22px 0; text-align:center;">
        <h3 style="color:#166534; margin:0 0 10px; font-size:17px;">📍 Följ din order</h3>
        <p style="color:#15803d; margin:0 0 14px; font-size:14px;">Följ ditt ärende i realtid:</p>
        <a href="https://www.doxvl.se/orderstatus?order=${orderId}" style="display:inline-block; background:#22c55e; color:#fff; padding:12px 28px; border-radius:6px; text-decoration:none; font-weight:700; font-size:15px;">Se orderstatus</a>
        <p style="color:#6b7280; margin:14px 0 0; font-size:12px;">Använd din e-postadress för att verifiera och se status</p>
      </div>

      <div class="contact-info">
        <h3>Har du frågor?</h3>
        <p>Kontakta oss gärna:</p>
        <p>
          📧 <a href="mailto:info@doxvl.se">info@doxvl.se</a><br>
          📞 08-40941900
        </p>
      </div>
    </div>

    <div class="footer">
      <p><strong>DOX Visumpartner AB</strong></p>
      <p>Professionell dokumentlegalisering sedan många år</p>
      <p>Detta är ett automatiskt genererat meddelande.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};
