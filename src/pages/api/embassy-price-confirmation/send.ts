/**
 * Send Embassy Price Confirmation Email API
 * 
 * Creates a confirmation token and queues an email to the customer
 * to confirm the embassy official fee before proceeding.
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
  confirmedEmbassyPrice: number;
  confirmedTotalPrice: number;
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
  const rateLimit = rateLimiters.addressConfirmation(clientIp);
  
  if (!rateLimit.success) {
    return res.status(429).json({ 
      error: 'Too many requests',
      retryAfter: rateLimit.resetIn
    });
  }

  const { orderId, confirmedEmbassyPrice, confirmedTotalPrice } = req.body as SendConfirmationRequest;

  if (!orderId) {
    return res.status(400).json({ error: 'orderId krävs' });
  }

  if (typeof confirmedEmbassyPrice !== 'number' || confirmedEmbassyPrice < 0) {
    return res.status(400).json({ error: 'confirmedEmbassyPrice måste vara ett positivt tal' });
  }

  if (typeof confirmedTotalPrice !== 'number' || confirmedTotalPrice < 0) {
    return res.status(400).json({ error: 'confirmedTotalPrice måste vara ett positivt tal' });
  }

  try {
    // Try to get order by document ID first using Admin SDK
    let orderRef = adminDb.collection('orders').doc(orderId);
    let orderSnap = await orderRef.get();
    let actualOrderId = orderId;
    
    // If not found, try to find by orderNumber
    if (!orderSnap.exists) {
      const querySnap = await adminDb.collection('orders')
        .where('orderNumber', '==', orderId)
        .limit(1)
        .get();
      
      if (!querySnap.empty) {
        const foundDoc = querySnap.docs[0];
        orderSnap = foundDoc;
        actualOrderId = foundDoc.id;
        orderRef = adminDb.collection('orders').doc(actualOrderId);
      }
    }

    if (!orderSnap.exists) {
      return res.status(404).json({ error: 'Order hittades inte' });
    }

    const order = orderSnap.data() as any;
    const customerEmail = order?.customerInfo?.email;
    const customerName = `${order?.customerInfo?.firstName || ''} ${order?.customerInfo?.lastName || ''}`.trim();

    if (!customerEmail) {
      return res.status(400).json({ error: 'Kunden har ingen e-postadress' });
    }

    // Get country name for the email
    const countryCode = order?.country || '';
    
    // Generate unique token
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14); // 14 days expiry

    // Get the original pricing breakdown to show what changed
    const originalPricingBreakdown = order?.pricingBreakdown || [];
    const originalTotalPrice = order?.totalPrice || 0;

    // Store confirmation record using Admin SDK
    await adminDb.collection('embassyPriceConfirmations').add({
      orderId: actualOrderId,
      orderNumber: order?.orderNumber || orderId,
      confirmedEmbassyPrice,
      confirmedTotalPrice,
      originalTotalPrice,
      originalPricingBreakdown,
      confirmed: false,
      declined: false,
      token,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      customerEmail,
      customerName,
      countryCode
    });

    // Create confirmation URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://doxvl.se';
    const confirmationUrl = `${baseUrl}/confirm-embassy-price/${token}`;

    // Queue email using customerEmails collection (Admin SDK)
    const orderNum = order?.orderNumber || orderId;
    // Get order locale for email language
    const orderLocale = order?.locale || 'sv';
    const isEnglish = orderLocale === 'en';
    
    const emailSubject = isEnglish 
      ? `Confirm embassy fee - Order ${orderNum}`
      : `Bekräfta ambassadavgift - Order ${orderNum}`;

    await adminDb.collection('customerEmails').add({
      name: customerName,
      email: customerEmail,
      phone: order?.customerInfo?.phone || '',
      subject: emailSubject,
      message: generateEmailHtml({
        customerName,
        orderNumber: orderNum,
        confirmedEmbassyPrice,
        confirmedTotalPrice,
        originalTotalPrice,
        confirmationUrl,
        locale: orderLocale,
        countryCode
      }),
      orderId: actualOrderId,
      createdAt: new Date(),
      status: 'unread'
    });

    // Update order to track that confirmation was sent
    await orderRef.set({
      embassyPriceConfirmationSent: true,
      embassyPriceConfirmationSentAt: new Date().toISOString(),
      pendingEmbassyPrice: confirmedEmbassyPrice,
      pendingTotalPrice: confirmedTotalPrice
    }, { merge: true });

    const successMsg = isEnglish 
      ? `Price confirmation email has been sent to ${customerEmail}`
      : `Prisbekräftelsemail har skickats till ${customerEmail}`;
    
    return res.status(200).json({
      success: true,
      message: successMsg,
      confirmationUrl // For testing purposes
    });

  } catch (error: any) {
    console.error('Embassy price confirmation error:', error);
    return res.status(500).json({ error: 'Ett fel uppstod', details: error.message });
  }
}

// Generate email HTML - matches existing DOX email template design
function generateEmailHtml(data: {
  customerName: string;
  orderNumber: string;
  confirmedEmbassyPrice: number;
  confirmedTotalPrice: number;
  originalTotalPrice: number;
  confirmationUrl: string;
  locale: string;
  countryCode: string;
}): string {
  const { customerName, orderNumber, confirmedEmbassyPrice, confirmedTotalPrice, originalTotalPrice, confirmationUrl, locale, countryCode } = data;
  
  // Determine language based on order locale
  const isSwedish = locale !== 'en';
  
  const title = isSwedish ? 'Bekräfta ambassadavgift' : 'Confirm Embassy Fee';
  const greeting = isSwedish ? `Hej ${customerName}!` : `Dear ${customerName},`;
  const intro = isSwedish 
    ? `Vi har nu fått bekräftat den officiella avgiften för ambassadlegalisering för din order. Vänligen granska och godkänn det uppdaterade priset innan vi kan fortsätta.`
    : `We have now confirmed the official embassy legalization fee for your order. Please review and approve the updated price before we can proceed.`;
  
  const priceLabel = isSwedish ? 'Ambassadavgift (officiell)' : 'Embassy fee (official)';
  const newTotalLabel = isSwedish ? 'Nytt totalbelopp' : 'New total amount';
  const previousTotalLabel = isSwedish ? 'Tidigare angivet belopp' : 'Previously stated amount';
  
  const warningText = isSwedish 
    ? 'Genom att godkänna bekräftar du att du accepterar det nya totalbeloppet för din beställning.'
    : 'By approving, you confirm that you accept the new total amount for your order.';
  
  const confirmBtn = isSwedish ? '✓ Godkänn och fortsätt' : '✓ Approve and continue';
  const declineBtn = isSwedish ? '✗ Avböj beställning' : '✗ Decline order';
  
  const linkNote = isSwedish 
    ? 'Om du inte kan klicka på knapparna, kopiera och klistra in denna länk i din webbläsare:'
    : 'If you cannot click the buttons, copy and paste this link in your browser:';
  const questionsTitle = isSwedish ? 'Frågor?' : 'Questions?';
  const contactText = isSwedish ? 'Kontakta oss gärna:' : 'Feel free to contact us:';
  const footerText = isSwedish ? 'Professionell dokumentlegalisering sedan många år' : 'Professional document legalisation for many years';
  const autoMsg = isSwedish ? 'Detta är ett automatiskt genererat meddelande.' : 'This is an automatically generated message.';

  const priceDifference = confirmedTotalPrice - originalTotalPrice;
  const priceDifferenceText = priceDifference > 0 
    ? (isSwedish ? `+${priceDifference.toLocaleString()} kr` : `+${priceDifference.toLocaleString()} SEK`)
    : (isSwedish ? `${priceDifference.toLocaleString()} kr` : `${priceDifference.toLocaleString()} SEK`);

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
    .price-box { background:#f0fdf4; border:2px solid #22c55e; border-radius:8px; padding:20px; margin:20px 0; }
    .price-box h3 { margin: 0 0 15px 0; color: #166534; font-size: 16px; font-weight: 600; }
    .price-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #dcfce7; }
    .price-row:last-child { border-bottom: none; }
    .price-label { color: #166534; }
    .price-value { font-weight: 700; color: #166534; }
    .price-total { font-size: 18px; background: #22c55e; color: white; padding: 12px; border-radius: 6px; margin-top: 15px; }
    .price-previous { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:15px; margin:15px 0; }
    .price-previous p { margin: 0; color: #64748b; font-size: 14px; }
    .warning-box { background:#fef3c7; border:1px solid #f59e0b; border-radius:8px; padding:16px; margin:20px 0; }
    .warning-box p { margin: 0; color: #92400e; font-size: 14px; }
    .button-container { text-align: center; margin: 28px 0; }
    .button {
      display: inline-block;
      background: #22c55e;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 15px;
      margin: 6px;
    }
    .button-decline {
      background: #ef4444;
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
      <h1>💰 ${title}</h1>
      <p>${isSwedish ? 'Prisbekräftelse för din order hos DOX Visumpartner AB' : 'Price confirmation for your order with DOX Visumpartner AB'}</p>
    </div>

    <div class="content">
      <div class="greeting">${greeting}</div>

      <p>${intro}</p>
      
      <div class="order-number">
        ${isSwedish ? 'Ordernummer' : 'Order number'}: #${orderNumber}
      </div>

      <div class="price-box">
        <h3>💰 ${isSwedish ? 'Prissammanfattning' : 'Price Summary'}</h3>
        <div class="price-row">
          <span class="price-label">${priceLabel}:</span>
          <span class="price-value">${confirmedEmbassyPrice.toLocaleString()} kr</span>
        </div>
        <div class="price-total" style="display: flex; justify-content: space-between; align-items: center;">
          <span>${newTotalLabel}:</span>
          <span style="font-size: 20px;">${confirmedTotalPrice.toLocaleString()} kr</span>
        </div>
      </div>

      <div class="price-previous">
        <p><strong>${previousTotalLabel}:</strong> ${originalTotalPrice.toLocaleString()} kr</p>
        <p style="margin-top: 8px; color: ${priceDifference > 0 ? '#dc2626' : '#16a34a'};">
          <strong>${isSwedish ? 'Skillnad' : 'Difference'}:</strong> ${priceDifferenceText}
        </p>
      </div>

      <div class="warning-box">
        <p>⚠️ <strong>${isSwedish ? 'Viktigt:' : 'Important:'}</strong> ${warningText}</p>
      </div>

      <div class="button-container">
        <a href="${confirmationUrl}?action=confirm" class="button">${confirmBtn}</a>
        <br><br>
        <a href="${confirmationUrl}?action=decline" class="button button-decline">${declineBtn}</a>
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
