/**
 * Business Order Email Template
 * HTML email sent to business inbox when a new order is placed
 */

interface BusinessEmailParams {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  countryName: string;
  documentType: string;
  quantity: number;
  services: string;
  totalPrice: number;
  documentSource: 'upload' | 'original';
  returnService: string;
  invoiceReference?: string;
  additionalNotes?: string;
  siteUrl?: string;
}

export const generateBusinessOrderEmail = (params: BusinessEmailParams): string => {
  const {
    orderId,
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    countryName,
    documentType,
    quantity,
    services,
    totalPrice,
    documentSource,
    returnService,
    invoiceReference,
    additionalNotes,
    siteUrl = 'https://doxvl-51a30.web.app'
  } = params;

  const date = new Date().toLocaleDateString('sv-SE');

  return `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ny beställning order #${orderId} | DOX Visumpartner AB</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #202124; max-width: 700px; margin: 0 auto; background: #f8f9fa; padding: 20px; }
    .wrap { background: #fff; border-radius: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background: #2E2D2C; color: #fff; padding: 24px 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
    .content { padding: 24px 28px; }
    .badge { display:inline-block; background:#0EB0A6; color:#fff; border-radius: 6px; padding: 8px 12px; font-weight: 700; margin: 8px 0 16px; }
    .section { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin:16px 0; }
    .row { display:flex; justify-content:space-between; gap: 12px; padding:8px 0; border-bottom:1px solid #eef2f6; }
    .row:last-child { border-bottom:none; }
    .label { color:#5f6368; font-weight:600; }
    .value { color:#202124; font-weight:700; }
    .address { background:#fff; border:2px solid #065f46; border-radius:6px; padding:14px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size:14px; }
    .button { display:inline-block; background:#0EB0A6; color:#fff !important; text-decoration:none; border-radius:6px; padding:10px 16px; font-weight:700; margin-top:12px; }
    .muted { color:#5f6368; font-size:13px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>Ny beställning</h1>
    </div>
    <div class="content">
      <div class="badge">Order #${orderId}</div>

      <div class="section">
        <div class="row"><span class="label">Datum</span><span class="value">${date}</span></div>
        <div class="row"><span class="label">Land</span><span class="value">${countryName}</span></div>
        <div class="row"><span class="label">Dokumenttyp</span><span class="value">${documentType}</span></div>
        <div class="row"><span class="label">Antal dokument</span><span class="value">${quantity} st</span></div>
        <div class="row"><span class="label">Valda tjänster</span><span class="value">${services}</span></div>
        <div class="row"><span class="label">Totalbelopp</span><span class="value">${totalPrice} kr</span></div>
        <div class="row"><span class="label">Dokumentkälla</span><span class="value">${documentSource === 'original' ? 'Originaldokument' : 'Uppladdade filer'}</span></div>
        <div class="row"><span class="label">Returfrakt</span><span class="value">${returnService}</span></div>
      </div>

      <div class="section">
        <div class="row"><span class="label">Kund</span><span class="value">${customerName}</span></div>
        <div class="row"><span class="label">E-post</span><span class="value">${customerEmail}</span></div>
        <div class="row"><span class="label">Telefon</span><span class="value">${customerPhone || '-'}</span></div>
        <div class="row"><span class="label">Adress</span><span class="value">${customerAddress}</span></div>
        ${invoiceReference ? `<div class="row"><span class="label">Fakturareferens</span><span class="value">${invoiceReference}</span></div>` : ''}
      </div>

      ${documentSource === 'original' ? `
      <div class="section">
        <div class="label" style="margin-bottom:6px;">Inkommande postadress</div>
        <div class="address">
          DOX Visumpartner AB<br/>
          Att: Dokumenthantering<br/>
          Box 38<br/>
          121 25 Stockholm-Globen<br/>
          Sverige
        </div>
        <a class="button" href="${siteUrl}/shipping-label?orderId=${orderId}" target="_blank" rel="noopener">Skriv ut fraktsedel</a>
        <div class="muted">Be kunden alltid märka med Order #${orderId} och skicka med REK.</div>
      </div>
      ` : ''}

      ${additionalNotes ? `<div class="section"><div class="label" style="margin-bottom:6px;">Övriga kommentarer</div><div class="value" style="font-weight:500;">${additionalNotes}</div></div>` : ''}

      <div class="muted">DOX Visumpartner AB • info@doxvl.se • 08-40941900</div>
    </div>
  </div>
</body>
</html>
  `.trim();
};
