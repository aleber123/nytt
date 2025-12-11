/**
 * Business Order Email Template
 * HTML email sent to business inbox when a new order is placed
 * Language: English (internal company language)
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
  // Pickup service info
  pickupService?: boolean;
  pickupMethod?: string;
  pickupAddress?: {
    name: string;
    company?: string;
    street: string;
    postalCode: string;
    city: string;
  };
  premiumPickup?: string;
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
    siteUrl = 'https://doxvl-51a30.web.app',
    pickupService = false,
    pickupMethod,
    pickupAddress,
    premiumPickup
  } = params;

  const date = new Date().toLocaleDateString('en-GB');
  
  // Get pickup method display name
  const getPickupMethodName = (method?: string): string => {
    const methods: { [key: string]: string } = {
      'dhl-sweden': 'DHL Sweden',
      'dhl-europe': 'DHL Europe',
      'dhl-worldwide': 'DHL Worldwide',
      'stockholm-city': 'Stockholm City Courier'
    };
    return method ? methods[method] || method : 'Not specified';
  };

  // Get premium pickup display name
  const getPremiumPickupName = (premium?: string): string => {
    const premiums: { [key: string]: string } = {
      'dhl-pre-12': 'DHL Express before 12:00',
      'dhl-pre-9': 'DHL Express before 09:00',
      'stockholm-express': 'Stockholm Express',
      'stockholm-sameday': 'Stockholm Same Day'
    };
    return premium ? premiums[premium] || premium : '';
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Order #${orderId} | DOX Visumpartner AB</title>
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
    .pickup-alert { background:#FEF3C7; border:2px solid #F59E0B; border-radius:8px; padding:16px; margin:16px 0; }
    .pickup-alert-header { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
    .pickup-alert-icon { font-size:28px; }
    .pickup-alert-title { color:#92400E; font-size:18px; font-weight:700; margin:0; }
    .pickup-address { background:#fff; border:2px solid #F59E0B; border-radius:6px; padding:14px; margin-top:12px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>New Order${pickupService ? ' 📦 PICKUP REQUESTED' : ''}</h1>
    </div>
    <div class="content">
      <div class="badge">Order #${orderId}</div>

      ${pickupService ? `
      <!-- PICKUP ALERT - VERY VISIBLE -->
      <div class="pickup-alert">
        <div class="pickup-alert-header">
          <span class="pickup-alert-icon">🚚</span>
          <h2 class="pickup-alert-title">PICKUP REQUESTED!</h2>
        </div>
        <p style="margin:0 0 8px 0; color:#92400E; font-weight:600;">
          Customer has requested document pickup. Book DHL pickup!
        </p>
        <div class="row" style="border:none; padding:4px 0;"><span class="label">Pickup Service</span><span class="value">${getPickupMethodName(pickupMethod)}</span></div>
        ${premiumPickup ? `<div class="row" style="border:none; padding:4px 0;"><span class="label">Premium</span><span class="value">${getPremiumPickupName(premiumPickup)}</span></div>` : ''}
        
        ${pickupAddress ? `
        <div class="pickup-address">
          <div style="font-weight:700; margin-bottom:8px; color:#92400E;">📍 Pickup Address:</div>
          ${pickupAddress.company ? `<div style="font-weight:700;">${pickupAddress.company}</div>` : ''}
          <div>${pickupAddress.name}</div>
          <div>${pickupAddress.street}</div>
          <div>${pickupAddress.postalCode} ${pickupAddress.city}</div>
        </div>
        ` : ''}
      </div>
      ` : ''}

      <div class="section">
        <div class="row"><span class="label">Date</span><span class="value">${date}</span></div>
        <div class="row"><span class="label">Country</span><span class="value">${countryName}</span></div>
        <div class="row"><span class="label">Document Type</span><span class="value">${documentType}</span></div>
        <div class="row"><span class="label">Quantity</span><span class="value">${quantity} pcs</span></div>
        <div class="row"><span class="label">Selected Services</span><span class="value">${services}</span></div>
        <div class="row"><span class="label">Total Amount</span><span class="value">${totalPrice} SEK</span></div>
        <div class="row"><span class="label">Document Source</span><span class="value">${documentSource === 'original' ? 'Original Documents' : 'Uploaded Files'}</span></div>
        <div class="row"><span class="label">Pickup</span><span class="value" style="${pickupService ? 'color:#D97706; font-weight:800;' : ''}">${pickupService ? '✅ YES - BOOK PICKUP' : '❌ No'}</span></div>
        <div class="row"><span class="label">Return Shipping</span><span class="value">${returnService}</span></div>
      </div>

      <div class="section">
        <div class="row"><span class="label">Customer</span><span class="value">${customerName}</span></div>
        <div class="row"><span class="label">Email</span><span class="value">${customerEmail}</span></div>
        <div class="row"><span class="label">Phone</span><span class="value">${customerPhone || '-'}</span></div>
        <div class="row"><span class="label">Address</span><span class="value">${customerAddress}</span></div>
        ${invoiceReference ? `<div class="row"><span class="label">Invoice Reference</span><span class="value">${invoiceReference}</span></div>` : ''}
      </div>

      ${documentSource === 'original' && !pickupService ? `
      <div class="section">
        <div class="label" style="margin-bottom:6px;">Incoming Mail Address (customer sends themselves)</div>
        <div class="address">
          DOX Visumpartner AB<br/>
          Attn: Document Processing<br/>
          Box 38<br/>
          121 25 Stockholm-Globen<br/>
          Sweden
        </div>
        <a class="button" href="${siteUrl}/shipping-label?orderId=${orderId}" target="_blank" rel="noopener">Print Shipping Label</a>
        <div class="muted">Always ask customer to mark with Order #${orderId} and send via registered mail.</div>
      </div>
      ` : ''}

      ${additionalNotes ? `<div class="section"><div class="label" style="margin-bottom:6px;">Additional Notes</div><div class="value" style="font-weight:500;">${additionalNotes}</div></div>` : ''}

      <div class="muted">DOX Visumpartner AB • info@doxvl.se • +46 8 409 419 00</div>
    </div>
  </div>
</body>
</html>
  `.trim();
};
