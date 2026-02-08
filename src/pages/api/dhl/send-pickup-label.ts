/**
 * Send DHL Pickup Label to Customer API
 * 
 * Creates a DHL shipment for pickup, generates the label,
 * and sends it to the customer with instructions.
 * 
 * Uses Firebase Admin SDK to bypass Firestore security rules.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { rateLimiters, getClientIp } from '@/lib/rateLimit';

// DHL API Configuration
const DHL_CONFIG = {
  apiKey: process.env.DHL_API_KEY || '',
  apiSecret: process.env.DHL_API_SECRET || '',
  accountNumber: process.env.DHL_ACCOUNT_NUMBER || '',
  useSandbox: process.env.DHL_USE_SANDBOX !== 'false',
};

const getBaseUrl = () => 
  DHL_CONFIG.useSandbox 
    ? 'https://express.api.dhl.com/mydhlapi/test'
    : 'https://express.api.dhl.com/mydhlapi';

const getAuthHeader = () => {
  const credentials = `${DHL_CONFIG.apiKey}:${DHL_CONFIG.apiSecret}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
};

// DOX Visumpartner company details (receiver for pickup)
const DOX_COMPANY = {
  postalAddress: {
    postalCode: '12162',
    cityName: 'Johanneshov',
    countryCode: 'SE',
    addressLine1: 'Livdjursgatan 4, våning 6'
  },
  contactInformation: {
    companyName: 'DOX Visumpartner AB',
    fullName: 'Henrik Oinas',
    phone: '+46840941900',
    email: 'info@doxvl.se'
  }
};

interface SendPickupLabelRequest {
  orderId: string;
  pickupDate?: string; // Optional, defaults to next business day
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const clientIp = getClientIp(req);
  const rateLimit = rateLimiters.dhl(clientIp);
  
  if (!rateLimit.success) {
    return res.status(429).json({ 
      error: 'Too many requests',
      retryAfter: rateLimit.resetIn
    });
  }

  // Check if API credentials are configured
  if (!DHL_CONFIG.apiKey || !DHL_CONFIG.apiSecret) {
    return res.status(500).json({ 
      error: 'DHL API credentials not configured'
    });
  }

  // Check if account number is configured
  if (!DHL_CONFIG.accountNumber) {
    return res.status(500).json({ 
      error: 'DHL Account Number not configured. Please add DHL_ACCOUNT_NUMBER to .env and restart the server.'
    });
  }

  const { orderId, pickupDate } = req.body as SendPickupLabelRequest;

  if (!orderId) {
    return res.status(400).json({ error: 'orderId krävs' });
  }

  try {
    const db = getAdminDb();
    
    // Get order details using Admin SDK
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return res.status(404).json({ error: 'Order hittades inte' });
    }

    const order = orderSnap.data() as any;
    const customerEmail = order.customerInfo?.email;
    const customerName = `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim();

    if (!customerEmail) {
      return res.status(400).json({ error: 'Kunden har ingen e-postadress' });
    }

    // Get pickup address (from pickupAddress or customerInfo)
    const pa = order.pickupAddress || {};
    const ci = order.customerInfo || {};
    
    const shipperAddress = {
      postalCode: pa.postalCode || ci.postalCode || '',
      cityName: pa.city || ci.city || '',
      countryCode: 'SE',
      addressLine1: pa.street || ci.address || ''
    };

    const shipperContact = {
      companyName: pa.company || ci.companyName || '',
      fullName: pa.name || customerName,
      phone: ci.phone || '',
      email: customerEmail
    };

    if (!shipperAddress.postalCode || !shipperAddress.cityName || !shipperAddress.addressLine1) {
      return res.status(400).json({ error: 'Upphämtningsadress saknas' });
    }

    // Calculate shipping date (next business day if not specified)
    let shippingDate = pickupDate;
    if (!shippingDate) {
      const date = new Date();
      // If after 14:00, use tomorrow
      if (date.getHours() >= 14) {
        date.setDate(date.getDate() + 1);
      }
      // Skip weekends
      if (date.getDay() === 0) date.setDate(date.getDate() + 1);
      if (date.getDay() === 6) date.setDate(date.getDate() + 2);
      shippingDate = date.toISOString().split('T')[0];
    }

    // Create DHL shipment (customer -> DOX)
    const dhlRequest = {
      plannedShippingDateAndTime: `${shippingDate}T10:00:00 GMT+01:00`,
      pickup: {
        isRequested: false  // Don't request pickup in initial shipment creation
      },
      productCode: 'N', // DOMESTIC EXPRESS - always domestic since pickup is within Sweden
      accounts: [{
        typeCode: 'shipper',
        number: DHL_CONFIG.accountNumber
      }],
      customerDetails: {
        shipperDetails: {
          postalAddress: shipperAddress,
          contactInformation: shipperContact
        },
        receiverDetails: DOX_COMPANY
      },
      content: {
        packages: [{
          weight: 0.5,
          dimensions: { length: 35, width: 27, height: 1 }
        }],
        isCustomsDeclarable: false,
        description: `Documents - Order ${order.orderNumber}`,
        incoterm: 'DAP',
        unitOfMeasurement: 'metric'
      }
    };

    // Call DHL API to create shipment
    const dhlResponse = await fetch(`${getBaseUrl()}/shipments`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(dhlRequest)
    });

    const dhlData = await dhlResponse.json();

    if (!dhlResponse.ok) {
      console.error('DHL API Error Response:', JSON.stringify(dhlData, null, 2));
      console.error('DHL Request was:', JSON.stringify(dhlRequest, null, 2));
      
      // Extract more detailed error info
      let errorDetails = dhlData.detail || dhlData.title || dhlData.message || 'Unknown error';
      if (dhlData.additionalDetails) {
        errorDetails += ' - ' + JSON.stringify(dhlData.additionalDetails);
      }
      
      return res.status(dhlResponse.status).json({
        error: 'DHL API Error',
        details: errorDetails,
        fullResponse: dhlData
      });
    }

    const trackingNumber = dhlData.shipmentTrackingNumber || '';
    // Use DHL Express tracking URL format - works for Swedish customers
    const trackingUrl = dhlData.trackingUrl || `https://www.dhl.com/se-sv/home/tracking/tracking-express.html?submit=1&tracking-id=${trackingNumber}`;
    
    // Get the label PDF (base64 encoded)
    const labelDocument = dhlData.documents?.find((d: any) => d.typeCode === 'label');
    const labelBase64 = labelDocument?.content || '';

    // Update order with pickup info using Admin SDK
    // Store the label PDF as base64 for later download
    await orderRef.update({
      pickupTrackingNumber: trackingNumber,
      pickupTrackingUrl: trackingUrl,
      pickupLabelSent: true,
      pickupLabelSentAt: new Date().toISOString(),
      pickupShippingDate: shippingDate,
      dhlPickupShipmentCreated: true,
      pickupLabelPdf: labelBase64 || null // Store PDF for admin download
    });

    // Queue email with label attachment using customerEmails collection
    const emailsRef = db.collection('customerEmails');
    const orderLocale = order.locale || 'sv';
    const isEnglish = orderLocale === 'en';
    const emailSubject = isEnglish 
      ? `Pickup Instructions - Order ${order.orderNumber}`
      : `Upphämtningsinstruktioner - Order ${order.orderNumber}`;
    
    await emailsRef.add({
      name: customerName,
      email: customerEmail,
      phone: order.customerInfo?.phone || '',
      subject: emailSubject,
      message: generatePickupEmailHtml({
        customerName,
        orderNumber: order.orderNumber,
        trackingNumber,
        trackingUrl,
        pickupDate: shippingDate,
        pickupAddress: {
          companyName: shipperContact.companyName,
          contactName: shipperContact.fullName,
          street: shipperAddress.addressLine1,
          postalCode: shipperAddress.postalCode,
          city: shipperAddress.cityName
        },
        locale: orderLocale
      }),
      attachments: labelBase64 ? [{
        filename: `DHL-Label-${order.orderNumber}.pdf`,
        content: labelBase64,
        encoding: 'base64',
        contentType: 'application/pdf'
      }] : [],
      orderId,
      createdAt: new Date(),
      status: 'unread'
    });

    const envLabel = DHL_CONFIG.useSandbox ? ' (SANDBOX)' : '';
    const successMsg = isEnglish 
      ? `Pickup label sent to ${customerEmail}${envLabel}`
      : `Upphämtningsetikett skickad till ${customerEmail}${envLabel}`;
    return res.status(200).json({
      success: true,
      message: successMsg,
      trackingNumber,
      trackingUrl,
      pickupDate: shippingDate,
      environment: DHL_CONFIG.useSandbox ? 'sandbox' : 'production'
    });

  } catch (error: any) {
    console.error('Send pickup label error:', error);
    return res.status(500).json({ error: 'Ett fel uppstod', details: error.message });
  }
}

// Generate email HTML - matches existing DOX email template design
function generatePickupEmailHtml(data: {
  customerName: string;
  orderNumber: string;
  trackingNumber: string;
  trackingUrl: string;
  pickupDate: string;
  pickupAddress: {
    companyName?: string;
    contactName: string;
    street: string;
    postalCode: string;
    city: string;
  };
  locale: string;
}): string {
  const { customerName, orderNumber, trackingNumber, trackingUrl, pickupDate, pickupAddress, locale } = data;
  
  const isSwedish = locale !== 'en';
  
  const formattedDate = new Date(pickupDate).toLocaleDateString(isSwedish ? 'sv-SE' : 'en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Translations
  const t = {
    title: isSwedish ? 'Upphämtningsinstruktioner' : 'Pickup Instructions',
    subtitle: isSwedish ? 'Uppdatering för din order hos DOX Visumpartner AB' : 'Update for your order with DOX Visumpartner AB',
    greeting: isSwedish ? `Hej ${customerName}!` : `Dear ${customerName},`,
    intro: isSwedish 
      ? 'Tack för din beställning! Här kommer instruktioner för upphämtning av dina dokument.'
      : 'Thank you for your order! Here are the instructions for picking up your documents.',
    orderNumber: isSwedish ? 'Ordernummer' : 'Order number',
    attachmentNote: isSwedish 
      ? 'DHL-etiketten finns bifogad i detta mail som PDF. Skriv ut den och fäst på försändelsen.'
      : 'The DHL label is attached to this email as a PDF. Print it and attach it to the shipment.',
    trackingLabel: isSwedish ? 'Spårningsnummer' : 'Tracking number',
    trackBtn: isSwedish ? 'Spåra försändelse' : 'Track shipment',
    pickupDateLabel: isSwedish ? 'Upphämtningsdatum' : 'Pickup date',
    pickupTimeNote: isSwedish 
      ? 'DHL hämtar normalt mellan kl. 09:00-18:00'
      : 'DHL typically picks up between 09:00-18:00',
    pickupAddressLabel: isSwedish ? 'Upphämtningsadress' : 'Pickup address',
    instructionsLabel: isSwedish ? 'Instruktioner' : 'Instructions',
    instruction1: isSwedish 
      ? '<strong>Skriv ut etiketten</strong> som finns bifogad i detta mail (PDF-fil)'
      : '<strong>Print the label</strong> attached to this email (PDF file)',
    instruction2: isSwedish 
      ? '<strong>Packa dokumenten</strong> i ett kuvert eller paket'
      : '<strong>Pack the documents</strong> in an envelope or package',
    instruction3: isSwedish 
      ? '<strong>Fäst etiketten</strong> väl synlig på utsidan av försändelsen'
      : '<strong>Attach the label</strong> visibly on the outside of the shipment',
    instruction4: isSwedish 
      ? '<strong>Var tillgänglig</strong> på upphämtningsdagen - DHL ringer inte innan'
      : '<strong>Be available</strong> on the pickup day - DHL does not call ahead',
    instruction5: isSwedish 
      ? '<strong>Lämna försändelsen</strong> i receptionen eller till en kollega om du inte kan vara på plats'
      : '<strong>Leave the shipment</strong> at reception or with a colleague if you cannot be present',
    warning: isSwedish 
      ? 'Se till att dokumenten är väl skyddade i försändelsen. Om du inte kan ta emot upphämtningen, kontakta oss så snart som möjligt.'
      : 'Make sure the documents are well protected in the shipment. If you cannot receive the pickup, please contact us as soon as possible.',
    recipientLabel: isSwedish ? 'Mottagare' : 'Recipient',
    questionsLabel: isSwedish ? 'Frågor?' : 'Questions?',
    contactText: isSwedish ? 'Kontakta oss gärna:' : 'Feel free to contact us:',
    footerText: isSwedish ? 'Professionell dokumentlegalisering sedan många år' : 'Professional document legalisation for many years',
    autoMsg: isSwedish ? 'Detta är ett automatiskt genererat meddelande.' : 'This is an automatically generated message.',
    important: isSwedish ? 'Viktigt' : 'Important'
  };

  return `
<!DOCTYPE html>
<html lang="${isSwedish ? 'sv' : 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title}</title>
  <style>
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
    .header p {
      margin: 8px 0 0 0;
      opacity: 0.9;
      font-size: 14px;
    }
    .dhl-badge {
      display: inline-block;
      background: #FFCC00;
      color: #D40511;
      font-weight: bold;
      padding: 6px 14px;
      border-radius: 4px;
      margin-top: 12px;
      font-size: 13px;
    }
    .content { padding: 32px 36px; }
    .greeting { font-size: 17px; font-weight: 600; color: #202124; margin-bottom: 16px; }
    .order-number { background:#0EB0A6; color:#fff; padding:10px 16px; border-radius:6px; display:inline-block; font-weight:700; font-size:15px; margin: 12px 0; }
    .tracking-box { background:#FFFBEB; border:2px solid #FFCC00; border-radius:8px; padding:20px; margin:20px 0; text-align:center; }
    .tracking-number { font-size: 22px; font-weight: bold; color: #D40511; letter-spacing: 2px; margin: 8px 0; }
    .info-box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px; margin:20px 0; }
    .info-box h3 { margin: 0 0 12px 0; color: #202124; font-size: 15px; font-weight: 600; }
    .info-box p { margin: 5px 0; color: #202124; }
    .attachment-note { background:#DCFCE7; border:1px solid #22C55E; border-radius:8px; padding:16px; margin:20px 0; text-align:center; }
    .attachment-note p { margin: 0; color: #166534; font-size: 14px; }
    .instructions { background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; padding:20px; margin:20px 0; }
    .instructions h3 { color: #202124; margin: 0 0 12px 0; font-size: 15px; font-weight: 600; }
    .instructions ol { margin: 0; padding-left: 20px; color: #202124; }
    .instructions li { margin: 8px 0; }
    .warning-box { background:#fef3c7; border:1px solid #f59e0b; border-radius:8px; padding:16px; margin:20px 0; }
    .warning-box p { margin: 0; color: #92400e; font-size: 14px; }
    .button {
      display: inline-block;
      background: #D40511;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      margin: 8px 0;
    }
    .contact-info { background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; padding:18px; margin:22px 0; text-align:center; }
    .contact-info h3 { margin: 0 0 8px 0; color: #202124; font-size: 15px; }
    .contact-info p { margin: 5px 0; color: #5f6368; font-size: 14px; }
    .contact-info a { color: #0EB0A6; text-decoration: none; }
    .footer { background:#f8f9fa; padding:24px 36px; text-align:center; border-top:1px solid #eaecef; }
    .footer p { margin:5px 0; color:#5f6368; font-size:13px; }
    .footer strong { color: #202124; }
    @media (max-width:600px){ body{padding:10px;} .header,.content,.footer{padding:20px;} }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>${t.title}</h1>
      <p>${t.subtitle}</p>
      <div class="dhl-badge">📦 DHL Express</div>
    </div>

    <div class="content">
      <div class="greeting">${t.greeting}</div>

      <p>${t.intro}</p>
      
      <div class="order-number">
        ${t.orderNumber}: #${orderNumber}
      </div>

      <div class="attachment-note">
        <p>📎 <strong>${t.important}:</strong> ${t.attachmentNote}</p>
      </div>

      <div class="tracking-box">
        <p style="margin: 0; color: #666; font-size: 13px;">${t.trackingLabel}</p>
        <div class="tracking-number">${trackingNumber}</div>
        <a href="${trackingUrl}" class="button">🔍 ${t.trackBtn}</a>
      </div>

      <div class="info-box">
        <h3>📅 ${t.pickupDateLabel}</h3>
        <p style="font-size: 17px; font-weight: bold; margin: 0;">${formattedDate}</p>
        <p style="margin: 8px 0 0 0; color: #5f6368; font-size: 13px;">${t.pickupTimeNote}</p>
      </div>

      <div class="info-box">
        <h3>📍 ${t.pickupAddressLabel}</h3>
        ${pickupAddress.companyName ? `<p style="font-weight: bold; margin: 0;">${pickupAddress.companyName}</p>` : ''}
        <p>${pickupAddress.contactName}</p>
        <p>${pickupAddress.street}</p>
        <p>${pickupAddress.postalCode} ${pickupAddress.city}</p>
      </div>

      <div class="instructions">
        <h3>📋 ${t.instructionsLabel}</h3>
        <ol>
          <li>${t.instruction1}</li>
          <li>${t.instruction2}</li>
          <li>${t.instruction3}</li>
          <li>${t.instruction4}</li>
          <li>${t.instruction5}</li>
        </ol>
      </div>

      <div class="warning-box">
        <p>⚠️ <strong>${t.important}:</strong> ${t.warning}</p>
      </div>

      <div class="info-box">
        <h3>📬 ${t.recipientLabel}</h3>
        <p style="font-weight: bold; margin: 0;">DOX Visumpartner AB</p>
        <p>Livdjursgatan 4, våning 6</p>
        <p>121 62 Johanneshov</p>
      </div>

      <div style="background:#f0fdf4; border:2px solid #22c55e; border-radius:8px; padding:20px; margin:22px 0; text-align:center;">
        <h3 style="color:#166534; margin:0 0 10px; font-size:17px;">📍 ${isSwedish ? 'Följ din order' : 'Track Your Order'}</h3>
        <p style="color:#15803d; margin:0 0 14px; font-size:14px;">${isSwedish ? 'Följ ditt ärende i realtid:' : 'Follow the progress of your order in real-time:'}</p>
        <a href="https://doxvl.se/orderstatus?order=${orderNumber}" style="display:inline-block; background:#22c55e; color:#fff; padding:12px 28px; border-radius:6px; text-decoration:none; font-weight:700; font-size:15px;">${isSwedish ? 'Se orderstatus' : 'Track Order Status'}</a>
      </div>

      <div class="contact-info">
        <h3>${t.questionsLabel}</h3>
        <p>${t.contactText}</p>
        <p>
          📧 <a href="mailto:info@doxvl.se">info@doxvl.se</a><br>
          📞 08-409 419 00
        </p>
      </div>
    </div>

    <div class="footer">
      <p><strong>DOX Visumpartner AB</strong></p>
      <p>${t.footerText}</p>
      <p>${t.autoMsg}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
