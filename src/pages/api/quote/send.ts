/**
 * Send Quote Email API
 * 
 * Creates a quote with line items from the order's pricing,
 * generates a unique token, and queues an email to the customer
 * with accept/decline links.
 * 
 * Uses Firebase Admin SDK to bypass Firestore security rules.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { rateLimiters, getClientIp } from '@/lib/rateLimit';
import crypto from 'crypto';

const generateToken = () => crypto.randomUUID();

// Translate Swedish pricing descriptions to English
function translateDescription(desc: string): string {
  const map: Record<string, string> = {
    'Apostille - Officiell avgift': 'Apostille - Official Fee',
    'Notarisering - Officiell avgift': 'Notarization - Official Fee',
    'Ambassadlegalisering - Officiell avgift': 'Embassy Legalization - Official Fee',
    'Utrikesdepartementets legalisering - Officiell avgift': 'Ministry of Foreign Affairs - Official Fee',
    'Handelskammarens legalisering - Officiell avgift': 'Chamber of Commerce - Official Fee',
    'Auktoriserad översättning - Officiell avgift': 'Certified Translation - Official Fee',
    'Skannade kopior': 'Scanned Copies',
    'Scannade kopior': 'Scanned Copies',
    'Returfrakt': 'Return Shipping',
    'Returservice': 'Return Service',
    'Expresstjänst': 'Express Service',
    'Expresshantering': 'Express Handling',
    'Dokumenthämtning': 'Document Pickup',
    'Upphämtningstjänst': 'Pickup Service',
  };
  if (map[desc]) return map[desc];
  // DOX Visumpartner serviceavgift (X) → DOX Visumpartner Service Fee (X)
  const svcPatterns: [RegExp, string][] = [
    [/DOX Visumpartner serviceavgift \(Notarisering\)/, 'DOX Visumpartner Service Fee (Notarization)'],
    [/DOX Visumpartner serviceavgift \(Apostille\)/, 'DOX Visumpartner Service Fee (Apostille)'],
    [/DOX Visumpartner serviceavgift \(Ambassadlegalisering\)/, 'DOX Visumpartner Service Fee (Embassy Legalization)'],
    [/DOX Visumpartner serviceavgift \(Utrikesdepartementets legalisering\)/, 'DOX Visumpartner Service Fee (Ministry of Foreign Affairs)'],
    [/DOX Visumpartner serviceavgift \(Handelskammarens legalisering\)/, 'DOX Visumpartner Service Fee (Chamber of Commerce)'],
    [/DOX Visumpartner serviceavgift \(Auktoriserad översättning\)/, 'DOX Visumpartner Service Fee (Certified Translation)'],
    [/DOX Visumpartner serviceavgift \((.+)\)/, 'DOX Visumpartner Service Fee ($1)'],
  ];
  for (const [pattern, replacement] of svcPatterns) {
    if (pattern.test(desc)) return desc.replace(pattern, replacement);
  }
  if (desc.includes(' - Officiell avgift')) return desc.replace(' - Officiell avgift', ' - Official Fee');
  if (desc.includes(' - officiell avgift')) return desc.replace(' - officiell avgift', ' - Official Fee');
  return desc;
}

interface QuoteLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  vatRate: number;
}

interface SendQuoteRequest {
  orderId: string;
  lineItems: QuoteLineItem[];
  totalAmount: number;
  message?: string;
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

  const { orderId, lineItems, totalAmount, message } = req.body as SendQuoteRequest;

  if (!orderId) {
    return res.status(400).json({ error: 'orderId is required' });
  }

  if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
    return res.status(400).json({ error: 'lineItems are required' });
  }

  if (typeof totalAmount !== 'number' || totalAmount <= 0) {
    return res.status(400).json({ error: 'totalAmount must be a positive number' });
  }

  try {
    const db = getAdminDb();
    
    // Find order
    let orderRef = db.collection('orders').doc(orderId);
    let orderSnap = await orderRef.get();
    let actualOrderId = orderId;
    
    if (!orderSnap.exists) {
      const querySnap = await db.collection('orders')
        .where('orderNumber', '==', orderId)
        .limit(1)
        .get();
      
      if (!querySnap.empty) {
        const foundDoc = querySnap.docs[0];
        orderSnap = foundDoc;
        actualOrderId = foundDoc.id;
        orderRef = db.collection('orders').doc(actualOrderId);
      }
    }

    if (!orderSnap.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderSnap.data() as any;
    const customerEmail = order?.customerInfo?.email;
    const customerName = `${order?.customerInfo?.firstName || ''} ${order?.customerInfo?.lastName || ''}`.trim();
    const orderNumber = order?.orderNumber || orderId;
    const orderLocale = order?.locale || 'sv';
    const isEnglish = orderLocale === 'en';
    const customerType = order?.customerType || 'private'; // 'private' | 'company'

    if (!customerEmail) {
      return res.status(400).json({ error: 'Customer has no email address' });
    }

    // Generate unique token
    const token = generateToken();

    // Translate line item descriptions if customer locale is English
    const translatedLineItems = isEnglish
      ? lineItems.map(item => ({ ...item, description: translateDescription(item.description) }))
      : lineItems;

    // Store quote record (with translated descriptions)
    await db.collection('quotes').add({
      orderId: actualOrderId,
      orderNumber,
      lineItems: translatedLineItems,
      totalAmount,
      customerType,
      message: message || '',
      status: 'sent',
      token,
      createdAt: new Date().toISOString(),
      customerEmail,
      customerName,
      locale: orderLocale
    });

    // Create quote URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://doxvl.se';
    const quoteUrl = `${baseUrl}/quote/${token}`;

    // Queue email
    const emailSubject = isEnglish 
      ? `Price Quote - Order ${orderNumber}`
      : `Offert - Order ${orderNumber}`;

    await db.collection('customerEmails').add({
      name: customerName,
      email: customerEmail,
      phone: order?.customerInfo?.phone || '',
      subject: emailSubject,
      message: generateQuoteEmailHtml({
        customerName,
        orderNumber,
        lineItems: translatedLineItems,
        totalAmount,
        customerType,
        message: message || '',
        quoteUrl,
        locale: orderLocale
      }),
      orderId: actualOrderId,
      createdAt: new Date(),
      status: 'unread',
      type: 'quote'
    });

    // Update order to track that quote was sent
    await orderRef.set({
      quote: {
        status: 'sent',
        sentAt: new Date().toISOString(),
        token,
        totalAmount,
        lineItems: translatedLineItems
      }
    }, { merge: true });

    // Log in email history
    const emailHistory = order.emailHistory || [];
    emailHistory.push({
      type: 'quote',
      subject: emailSubject,
      sentAt: new Date().toISOString(),
      sentTo: customerEmail
    });

    await orderRef.set({ emailHistory, lastEmailSentAt: new Date().toISOString() }, { merge: true });

    const successMsg = isEnglish 
      ? `Quote has been sent to ${customerEmail}`
      : `Offert har skickats till ${customerEmail}`;

    return res.status(200).json({
      success: true,
      message: successMsg,
      quoteUrl
    });

  } catch (error: any) {
    console.error('Error sending quote:', error);
    return res.status(500).json({ error: 'An error occurred', details: error.message });
  }
}

// Generate quote email HTML
function generateQuoteEmailHtml(data: {
  customerName: string;
  orderNumber: string;
  lineItems: QuoteLineItem[];
  totalAmount: number;
  customerType: string;
  message: string;
  quoteUrl: string;
  locale: string;
}): string {
  const { customerName, orderNumber, lineItems, totalAmount, customerType, message, quoteUrl, locale } = data;
  
  const isSwedish = locale !== 'en';
  const isCompany = customerType === 'company';
  
  const title = isSwedish ? 'Offert' : 'Price Quote';
  const greeting = isSwedish ? `Hej ${customerName}!` : `Dear ${customerName},`;
  const intro = isSwedish 
    ? `Vi har tagit fram en offert för din order. Vänligen granska priserna nedan och godkänn eller avböj offerten.`
    : `We have prepared a quote for your order. Please review the prices below and accept or decline the quote.`;
  
  const descHeader = isSwedish ? 'Beskrivning' : 'Description';
  const qtyHeader = isSwedish ? 'Antal' : 'Qty';
  const unitPriceHeader = isSwedish ? 'À-pris' : 'Unit Price';
  const amountHeader = isSwedish ? 'Belopp' : 'Amount';

  // Calculate VAT
  // pricingBreakdown prices are stored EXCLUDING VAT
  // vatRate per item is 25 (standard) or 0 (exempt)
  const totalVat = lineItems.reduce((sum, item) => {
    const rate = (item.vatRate && item.vatRate > 0) ? (item.vatRate > 1 ? item.vatRate / 100 : item.vatRate) : 0;
    return sum + Math.round(item.total * rate);
  }, 0);
  const totalInclVat = totalAmount + totalVat;

  // For company: show ex. moms + moms row + total inkl. moms
  // For private: show prices inkl. moms per row, total inkl. moms
  const subtotalLabel = isSwedish ? 'Summa exkl. moms' : 'Subtotal excl. VAT';
  const vatLabel = isSwedish ? 'Moms' : 'VAT';
  const totalLabel = isSwedish 
    ? (isCompany ? 'Totalbelopp inkl. moms' : 'Totalbelopp inkl. moms')
    : (isCompany ? 'Total incl. VAT' : 'Total incl. VAT');
  const vatNote = isCompany
    ? (isSwedish ? 'Priser visas exkl. moms' : 'Prices shown excl. VAT')
    : (isSwedish ? 'Priser visas inkl. moms' : 'Prices shown incl. VAT');
  
  const acceptBtn = isSwedish ? '✓ Godkänn offert' : '✓ Accept Quote';
  const declineBtn = isSwedish ? '✗ Avböj offert' : '✗ Decline Quote';
  
  const linkNote = isSwedish 
    ? 'Om du inte kan klicka på knapparna, kopiera och klistra in denna länk i din webbläsare:'
    : 'If you cannot click the buttons, copy and paste this link in your browser:';
  const questionsTitle = isSwedish ? 'Frågor?' : 'Questions?';
  const contactText = isSwedish ? 'Kontakta oss gärna:' : 'Feel free to contact us:';
  const footerText = isSwedish ? 'Professionell dokumentlegalisering sedan många år' : 'Professional document legalisation for many years';
  const autoMsg = isSwedish ? 'Detta är ett automatiskt genererat meddelande.' : 'This is an automatically generated message.';

  // Build line items table rows
  // For company: show prices ex. moms as-is
  // For private: add VAT to each line item price for display
  const lineItemRows = lineItems.map(item => {
    const rate = (item.vatRate && item.vatRate > 0) ? (item.vatRate > 1 ? item.vatRate / 100 : item.vatRate) : 0;
    const displayUnitPrice = isCompany ? item.unitPrice : Math.round(item.unitPrice * (1 + rate));
    const displayTotal = isCompany ? item.total : Math.round(item.total * (1 + rate));
    return `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px;">${item.description}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px; text-align: right; white-space: nowrap;">${displayUnitPrice.toLocaleString()} kr</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px; text-align: right; font-weight: 600; white-space: nowrap;">${displayTotal.toLocaleString()} kr</td>
    </tr>`;
  }).join('');

  const messageSection = message ? `
    <div style="background-color: #f9fafb; border-left: 4px solid #0EB0A6; padding: 16px; margin: 20px 0;">
      <p style="color: #374151; font-size: 14px; margin: 0; white-space: pre-wrap; line-height: 1.6;">${message}</p>
    </div>
  ` : '';

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
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.2px; }
    .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 14px; }
    .content { padding: 32px 36px; }
    .greeting { font-size: 17px; font-weight: 600; color: #202124; margin-bottom: 16px; }
    .order-number { background:#0EB0A6; color:#fff; padding:10px 16px; border-radius:6px; display:inline-block; font-weight:700; font-size:15px; margin: 12px 0; }
    .button-container { text-align: center; margin: 28px 0; }
    .button {
      display: inline-block;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 15px;
      margin: 6px;
    }
    .button-accept { background: #22c55e; }
    .button-decline { background: #ef4444; }
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
      <h1>📋 ${title}</h1>
      <p>${isSwedish ? 'Prisförslag för din order hos DOX Visumpartner AB' : 'Price proposal for your order with DOX Visumpartner AB'}</p>
    </div>

    <div class="content">
      <div class="greeting">${greeting}</div>

      <p style="color: #5f6368; font-size: 15px;">${intro}</p>
      
      <div class="order-number">
        ${isSwedish ? 'Ordernummer' : 'Order number'}: #${orderNumber}
      </div>

      ${messageSection}

      <!-- Price table -->
      <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="padding: 12px; text-align: left; font-size: 13px; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb; width: 45%;">${descHeader}</th>
            <th style="padding: 12px; text-align: center; font-size: 13px; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb; width: 10%;">${qtyHeader}</th>
            <th style="padding: 12px; text-align: right; font-size: 13px; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb; width: 22%;">${unitPriceHeader}</th>
            <th style="padding: 12px; text-align: right; font-size: 13px; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb; width: 23%;">${amountHeader}</th>
          </tr>
        </thead>
        <tbody>
          ${lineItemRows}
        </tbody>
        <tfoot>
          ${isCompany ? `
          <tr style="background-color: #f9fafb;">
            <td colspan="3" style="padding: 10px 12px; color: #374151; font-weight: 600; font-size: 14px; text-align: right; border-top: 2px solid #e5e7eb;">${subtotalLabel}</td>
            <td style="padding: 10px 12px; color: #374151; font-weight: 600; font-size: 14px; text-align: right; border-top: 2px solid #e5e7eb; white-space: nowrap;">${totalAmount.toLocaleString()} kr</td>
          </tr>
          <tr style="background-color: #f9fafb;">
            <td colspan="3" style="padding: 10px 12px; color: #6b7280; font-size: 14px; text-align: right;">${vatLabel} (25%)</td>
            <td style="padding: 10px 12px; color: #6b7280; font-size: 14px; text-align: right; white-space: nowrap;">${totalVat.toLocaleString()} kr</td>
          </tr>
          ` : ''}
          <tr style="background-color: #0EB0A6;">
            <td colspan="3" style="padding: 14px 12px; color: #ffffff; font-weight: 700; font-size: 16px;">${totalLabel}</td>
            <td style="padding: 14px 12px; color: #ffffff; font-weight: 700; font-size: 18px; text-align: right; white-space: nowrap;">${totalInclVat.toLocaleString()} kr</td>
          </tr>
        </tfoot>
      </table>

      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 8px 0 20px 0;">${vatNote}</p>

      <div class="button-container">
        <a href="${quoteUrl}?action=accept" class="button button-accept">${acceptBtn}</a>
        <br><br>
        <a href="${quoteUrl}?action=decline" class="button button-decline">${declineBtn}</a>
      </div>

      <p class="link-note">
        ${linkNote}<br>
        <a href="${quoteUrl}">${quoteUrl}</a>
      </p>

      <div style="background:#f0fdf4; border:2px solid #22c55e; border-radius:8px; padding:20px; margin:22px 0; text-align:center;">
        <h3 style="color:#166534; margin:0 0 10px; font-size:17px;">📍 ${isSwedish ? 'Följ din order' : 'Track Your Order'}</h3>
        <p style="color:#15803d; margin:0 0 14px; font-size:14px;">${isSwedish ? 'Följ ditt ärende i realtid:' : 'Follow the progress of your order in real-time:'}</p>
        <a href="https://doxvl.se/orderstatus?order=${orderNumber}" style="display:inline-block; background:#22c55e; color:#fff; padding:12px 28px; border-radius:6px; text-decoration:none; font-weight:700; font-size:15px;">${isSwedish ? 'Se orderstatus' : 'Track Order Status'}</a>
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
