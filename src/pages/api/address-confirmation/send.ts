/**
 * Send Address Confirmation Email API
 * 
 * Creates a confirmation token and queues an email to the customer
 * to confirm their pickup or return address.
 * 
 * Uses Firebase Admin SDK to bypass Firestore security rules.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { rateLimiters, getClientIp } from '@/lib/rateLimit';
import crypto from 'crypto';

// Generate UUID using Node.js crypto
const generateToken = () => crypto.randomUUID();

interface SendConfirmationRequest {
  orderId: string;
  type: 'pickup' | 'return';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('📧 Address confirmation API called');
  console.log('📧 Method:', req.method);
  console.log('📧 Body:', JSON.stringify(req.body));
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const clientIp = getClientIp(req);
  const rateLimit = rateLimiters.addressConfirmation(clientIp);
  
  if (!rateLimit.success) {
    return res.status(429).json({ 
      error: 'Too many requests',
      retryAfter: rateLimit.resetIn
    });
  }

  const { orderId, type } = req.body as SendConfirmationRequest;
  console.log('📧 orderId:', orderId, 'type:', type);

  if (!orderId || !type) {
    console.log('📧 ERROR: Missing orderId or type');
    return res.status(400).json({ error: 'orderId och type krävs' });
  }

  if (type !== 'pickup' && type !== 'return') {
    console.log('📧 ERROR: Invalid type');
    return res.status(400).json({ error: 'type måste vara "pickup" eller "return"' });
  }

  try {
    console.log('📧 Getting order:', orderId);
    
    // Try to get order by document ID first using Admin SDK
    let orderRef = adminDb.collection('orders').doc(orderId);
    let orderSnap = await orderRef.get();
    let actualOrderId = orderId;
    
    // If not found, try to find by orderNumber
    if (!orderSnap.exists) {
      console.log('📧 Order not found by ID, searching by orderNumber...');
      const querySnap = await adminDb.collection('orders')
        .where('orderNumber', '==', orderId)
        .limit(1)
        .get();
      
      if (!querySnap.empty) {
        const foundDoc = querySnap.docs[0];
        orderSnap = foundDoc;
        actualOrderId = foundDoc.id;
        orderRef = adminDb.collection('orders').doc(actualOrderId);
        console.log('📧 Found order by orderNumber, actual ID:', actualOrderId);
      }
    }
    
    console.log('📧 Order exists:', orderSnap.exists);

    if (!orderSnap.exists) {
      console.log('📧 ERROR: Order not found');
      return res.status(404).json({ error: 'Order hittades inte' });
    }

    const order = orderSnap.data() as any;
    console.log('📧 Order data keys:', Object.keys(order || {}));
    const customerEmail = order?.customerInfo?.email;
    console.log('📧 Customer email:', customerEmail);
    const customerName = `${order?.customerInfo?.firstName || ''} ${order?.customerInfo?.lastName || ''}`.trim();

    if (!customerEmail) {
      return res.status(400).json({ error: 'Kunden har ingen e-postadress' });
    }

    // Get the address to confirm
    let address;
    if (type === 'pickup') {
      const pa = order?.pickupAddress || {};
      address = {
        street: pa.street || order?.customerInfo?.address || '',
        postalCode: pa.postalCode || order?.customerInfo?.postalCode || '',
        city: pa.city || order?.customerInfo?.city || '',
        country: pa.country || 'Sverige',
        companyName: pa.company || order?.customerInfo?.companyName || '',
        contactName: pa.name || customerName,
        phone: order?.customerInfo?.phone || ''
      };
    } else {
      address = {
        street: order?.customerInfo?.address || '',
        postalCode: order?.customerInfo?.postalCode || '',
        city: order?.customerInfo?.city || '',
        country: order?.customerInfo?.country || 'Sverige',
        companyName: order?.customerInfo?.companyName || '',
        contactName: customerName,
        phone: order?.customerInfo?.phone || ''
      };
    }

    // Generate unique token
    console.log('📧 Generating token...');
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry
    console.log('📧 Token generated:', token);

    // Store confirmation record using Admin SDK
    console.log('📧 Storing confirmation record...');
    await adminDb.collection('addressConfirmations').add({
      orderId: actualOrderId,
      orderNumber: order?.orderNumber || orderId,
      type,
      address,
      confirmed: false,
      token,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      customerEmail,
      customerName
    });
    console.log('📧 Confirmation record stored');

    // Create confirmation URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://doxvl.se';
    const confirmationUrl = `${baseUrl}/confirm-address/${token}`;
    console.log('📧 Confirmation URL:', confirmationUrl);

    // Queue email using customerEmails collection (Admin SDK)
    console.log('📧 Queueing email...');
    const orderNum = order?.orderNumber || orderId;
    // Get order locale for email language
    const orderLocale = order?.locale || 'sv';
    const isEnglish = orderLocale === 'en';
    
    const emailSubject = type === 'pickup' 
      ? (isEnglish ? `Confirm pickup address - Order ${orderNum}` : `Bekräfta upphämtningsadress - Order ${orderNum}`)
      : (isEnglish ? `Confirm return address - Order ${orderNum}` : `Bekräfta returadress - Order ${orderNum}`);

    const addressTypeText = type === 'pickup' 
      ? (isEnglish ? 'pickup address' : 'upphämtningsadress')
      : (isEnglish ? 'return address' : 'returadress');

    await adminDb.collection('customerEmails').add({
      name: customerName,
      email: customerEmail,
      phone: order?.customerInfo?.phone || '',
      subject: emailSubject,
      message: generateEmailHtml({
        customerName,
        orderNumber: orderNum,
        addressType: addressTypeText,
        address,
        confirmationUrl,
        locale: orderLocale
      }),
      orderId: actualOrderId,
      createdAt: new Date(),
      status: 'unread'
    });
    console.log('📧 Email queued successfully');

    // Update order to track that confirmation was sent
    console.log('📧 Updating order...');
    const updateField = type === 'pickup' 
      ? 'pickupAddressConfirmationSent' 
      : 'returnAddressConfirmationSent';
    
    await orderRef.set({
      [updateField]: true,
      [`${updateField}At`]: new Date().toISOString()
    }, { merge: true });
    console.log('📧 Order updated');

    console.log('📧 SUCCESS - returning response');
    const successMsg = isEnglish 
      ? `Confirmation email for ${addressTypeText} has been sent to ${customerEmail}`
      : `Bekräftelsemail för ${addressTypeText} har skickats till ${customerEmail}`;
    return res.status(200).json({
      success: true,
      message: successMsg,
      confirmationUrl // For testing purposes
    });

  } catch (error: any) {
    console.error('📧 ERROR in catch block:', error);
    console.error('📧 Error name:', error.name);
    console.error('📧 Error message:', error.message);
    console.error('📧 Error stack:', error.stack);
    return res.status(500).json({ error: 'Ett fel uppstod', details: error.message });
  }
}

// Generate email HTML - matches existing DOX email template design
function generateEmailHtml(data: {
  customerName: string;
  orderNumber: string;
  addressType: string;
  address: any;
  confirmationUrl: string;
  locale: string;
}): string {
  const { customerName, orderNumber, addressType, address, confirmationUrl, locale } = data;
  
  // Determine language based on order locale
  const isSwedish = locale !== 'en';
  
  const title = isSwedish ? 'Bekräfta din adress' : 'Confirm your address';
  const greeting = isSwedish ? `Hej ${customerName}!` : `Dear ${customerName},`;
  const intro = isSwedish 
    ? `Vi behöver din bekräftelse av <strong>${addressType}</strong> innan vi kan fortsätta med din order.`
    : `We need you to confirm your <strong>${addressType}</strong> before we can proceed with your order.`;
  const addressLabel = isSwedish ? `📍 ${addressType.charAt(0).toUpperCase() + addressType.slice(1)}` : `📍 ${addressType.charAt(0).toUpperCase() + addressType.slice(1)}`;
  const warningText = isSwedish 
    ? 'Kontrollera att adressen är korrekt. Felaktig adress kan leda till förseningar eller missade leveranser.'
    : 'Please verify the address is correct. An incorrect address may cause delays or missed deliveries.';
  const confirmBtn = isSwedish ? '✓ Bekräfta adress' : '✓ Confirm address';
  const editBtn = isSwedish ? '✎ Ändra adress' : '✎ Edit address';
  const linkNote = isSwedish 
    ? 'Om du inte kan klicka på knapparna, kopiera och klistra in denna länk i din webbläsare:'
    : 'If you cannot click the buttons, copy and paste this link in your browser:';
  const questionsTitle = isSwedish ? 'Frågor?' : 'Questions?';
  const contactText = isSwedish ? 'Kontakta oss gärna:' : 'Feel free to contact us:';
  const footerText = isSwedish ? 'Professionell dokumentlegalisering sedan många år' : 'Professional document legalisation for many years';
  const autoMsg = isSwedish ? 'Detta är ett automatiskt genererat meddelande.' : 'This is an automatically generated message.';

  return `
<!DOCTYPE html>
<html lang="${isSwedish ? 'sv' : 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
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
    .content { padding: 32px 36px; }
    .greeting { font-size: 17px; font-weight: 600; color: #202124; margin-bottom: 16px; }
    .order-number { background:#0EB0A6; color:#fff; padding:10px 16px; border-radius:6px; display:inline-block; font-weight:700; font-size:15px; margin: 12px 0; }
    .address-box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px; margin:20px 0; }
    .address-box h3 { margin: 0 0 15px 0; color: #202124; font-size: 16px; font-weight: 600; }
    .address-line { margin: 5px 0; color: #202124; }
    .warning-box { background:#fef3c7; border:1px solid #f59e0b; border-radius:8px; padding:16px; margin:20px 0; }
    .warning-box p { margin: 0; color: #92400e; font-size: 14px; }
    .button-container { text-align: center; margin: 28px 0; }
    .button {
      display: inline-block;
      background: #0EB0A6;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 15px;
      margin: 6px;
    }
    .button-secondary {
      background: #5f6368;
    }
    .link-note { font-size: 13px; color: #5f6368; margin-top: 20px; }
    .link-note a { color: #0EB0A6; }
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
      <h1>${title}</h1>
      <p>${isSwedish ? 'Uppdatering för din order hos DOX Visumpartner AB' : 'Update for your order with DOX Visumpartner AB'}</p>
    </div>

    <div class="content">
      <div class="greeting">${greeting}</div>

      <p>${intro}</p>
      
      <div class="order-number">
        ${isSwedish ? 'Ordernummer' : 'Order number'}: #${orderNumber}
      </div>

      <div class="address-box">
        <h3>${addressLabel}</h3>
        ${address.companyName ? `<div class="address-line"><strong>${address.companyName}</strong></div>` : ''}
        ${address.contactName ? `<div class="address-line">${address.contactName}</div>` : ''}
        <div class="address-line">${address.street}</div>
        <div class="address-line">${address.postalCode} ${address.city}</div>
        <div class="address-line">${address.country}</div>
        ${address.phone ? `<div class="address-line">📞 ${address.phone}</div>` : ''}
      </div>

      <div class="warning-box">
        <p>⚠️ <strong>${isSwedish ? 'Viktigt:' : 'Important:'}</strong> ${warningText}</p>
      </div>

      <div class="button-container">
        <a href="${confirmationUrl}" class="button">${confirmBtn}</a>
        <br>
        <a href="${confirmationUrl}?edit=true" class="button button-secondary">${editBtn}</a>
      </div>

      <p class="link-note">
        ${linkNote}<br>
        <a href="${confirmationUrl}">${confirmationUrl}</a>
      </p>

      <div style="background:#f0fdf4; border:2px solid #22c55e; border-radius:8px; padding:20px; margin:22px 0; text-align:center;">
        <h3 style="color:#166534; margin:0 0 10px; font-size:17px;">📍 ${isSwedish ? 'Följ din order' : 'Track Your Order'}</h3>
        <p style="color:#15803d; margin:0 0 14px; font-size:14px;">${isSwedish ? 'Följ ditt ärende i realtid:' : 'Follow the progress of your order in real-time:'}</p>
        <a href="https://www.doxvl.se/orderstatus?order=${orderNumber}" style="display:inline-block; background:#22c55e; color:#fff; padding:12px 28px; border-radius:6px; text-decoration:none; font-weight:700; font-size:15px;">${isSwedish ? 'Se orderstatus' : 'Track Order Status'}</a>
      </div>

      <div class="contact-info">
        <h3>${questionsTitle}</h3>
        <p>${contactText}</p>
        <p>
          📧 <a href="mailto:info@doxvl.se">info@doxvl.se</a><br>
          📞 08-409 419 00
        </p>
      </div>
    </div>

    <div class="footer">
      <p><strong>DOX Visumpartner AB</strong></p>
      <p>${footerText}</p>
      <p>${autoMsg}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
