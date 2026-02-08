/**
 * Send Document Request Email API
 * 
 * Creates a unique upload token and sends an email to the customer
 * requesting additional documents with a secure upload link.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { rateLimiters, getClientIp } from '@/lib/rateLimit';
import crypto from 'crypto';

const generateToken = () => crypto.randomUUID();

interface SendDocumentRequestBody {
  orderId: string;
  templateId?: string;
  customMessage: string;
  requestedDocuments?: string[];
}

// Email templates for document requests
export const documentRequestTemplates = [
  {
    id: 'missing_original',
    name: 'Saknat originaldokument',
    nameEn: 'Missing original document',
    message: 'Vi behöver originaldokumentet för att kunna fortsätta med legaliseringen. Vänligen ladda upp en kopia av originalet.',
    messageEn: 'We need the original document to proceed with the legalization. Please upload a copy of the original.'
  },
  {
    id: 'unclear_scan',
    name: 'Otydlig skanning',
    nameEn: 'Unclear scan',
    message: 'Den uppladdade skanningen är otydlig eller har dålig kvalitet. Vänligen ladda upp en ny, tydligare version.',
    messageEn: 'The uploaded scan is unclear or of poor quality. Please upload a new, clearer version.'
  },
  {
    id: 'missing_signature',
    name: 'Saknad signatur',
    nameEn: 'Missing signature',
    message: 'Dokumentet saknar nödvändig signatur. Vänligen ladda upp en signerad version av dokumentet.',
    messageEn: 'The document is missing a required signature. Please upload a signed version of the document.'
  },
  {
    id: 'missing_translation',
    name: 'Saknad översättning',
    nameEn: 'Missing translation',
    message: 'Vi behöver en auktoriserad översättning av dokumentet. Vänligen ladda upp översättningen.',
    messageEn: 'We need an authorized translation of the document. Please upload the translation.'
  },
  {
    id: 'additional_document',
    name: 'Kompletterande dokument',
    nameEn: 'Additional document',
    message: 'Vi behöver ett kompletterande dokument för att slutföra ärendet.',
    messageEn: 'We need an additional document to complete the case.'
  },
  {
    id: 'id_verification',
    name: 'ID-verifiering',
    nameEn: 'ID verification',
    message: 'Vi behöver en kopia av din legitimation (pass eller nationellt ID-kort) för att verifiera din identitet.',
    messageEn: 'We need a copy of your ID (passport or national ID card) to verify your identity.'
  },
  {
    id: 'custom',
    name: 'Anpassat meddelande',
    nameEn: 'Custom message',
    message: '',
    messageEn: ''
  }
];

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

  const { orderId, templateId, customMessage, requestedDocuments } = req.body as SendDocumentRequestBody;

  if (!orderId) {
    return res.status(400).json({ error: 'orderId krävs' });
  }

  if (!customMessage?.trim()) {
    return res.status(400).json({ error: 'Ett meddelande krävs' });
  }

  try {
    const db = getAdminDb();
    
    // Get order
    let orderRef = db.collection('orders').doc(orderId);
    let orderSnap = await orderRef.get();
    let actualOrderId = orderId;
    
    // If not found, try to find by orderNumber
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
      return res.status(404).json({ error: 'Order hittades inte' });
    }

    const order = orderSnap.data() as any;
    const customerEmail = order?.customerInfo?.email;
    const customerName = `${order?.customerInfo?.firstName || ''} ${order?.customerInfo?.lastName || ''}`.trim();
    const orderNumber = order?.orderNumber || orderId;
    const orderLocale = order?.locale || 'sv';
    const isEnglish = orderLocale === 'en';

    if (!customerEmail) {
      return res.status(400).json({ error: 'Kunden har ingen e-postadress' });
    }

    // Generate unique upload token
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14); // 14 days expiry

    // Get template info
    const template = documentRequestTemplates.find(t => t.id === templateId);

    // Store document request record
    await db.collection('documentRequests').add({
      orderId: actualOrderId,
      orderNumber,
      token,
      templateId: templateId || 'custom',
      templateName: template ? (isEnglish ? template.nameEn : template.name) : 'Custom',
      customMessage: customMessage.trim(),
      requestedDocuments: requestedDocuments || [],
      customerEmail,
      customerName,
      locale: orderLocale, // Save customer's language preference
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'pending', // pending, uploaded, expired
      uploadedFiles: []
    });

    // Create upload URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://doxvl.se';
    const uploadUrl = `${baseUrl}/upload-documents/${token}`;

    // Queue email
    const emailSubject = isEnglish 
      ? `Document request - Order ${orderNumber}`
      : `Begäran om komplettering - Order ${orderNumber}`;

    await db.collection('customerEmails').add({
      name: customerName,
      email: customerEmail,
      phone: order?.customerInfo?.phone || '',
      subject: emailSubject,
      message: generateEmailHtml({
        customerName,
        orderNumber,
        customMessage: customMessage.trim(),
        uploadUrl,
        locale: orderLocale,
        templateName: template ? (isEnglish ? template.nameEn : template.name) : undefined
      }),
      orderId: actualOrderId,
      createdAt: new Date(),
      status: 'unread',
      type: 'document_request'
    });

    // Update order to track that document request was sent
    await orderRef.set({
      documentRequestSent: true,
      documentRequestSentAt: new Date().toISOString(),
      documentRequestToken: token
    }, { merge: true });

    const successMsg = isEnglish 
      ? `Document request email has been sent to ${customerEmail}`
      : `Begäran om komplettering har skickats till ${customerEmail}`;

    return res.status(200).json({
      success: true,
      message: successMsg,
      uploadUrl
    });

  } catch (error: any) {
    console.error('Error sending document request:', error);
    return res.status(500).json({ error: 'Ett fel uppstod', details: error.message });
  }
}

function generateEmailHtml(data: {
  customerName: string;
  orderNumber: string;
  customMessage: string;
  uploadUrl: string;
  locale: string;
  templateName?: string;
}): string {
  const { customerName, orderNumber, customMessage, uploadUrl, locale, templateName } = data;
  
  const isSwedish = locale !== 'en';
  
  const title = isSwedish ? 'Begäran om komplettering' : 'Document Request';
  const greeting = isSwedish ? `Hej ${customerName}!` : `Dear ${customerName},`;
  const intro = isSwedish 
    ? 'Vi behöver kompletterande dokument för att kunna fortsätta med din order.'
    : 'We need additional documents to proceed with your order.';
  const messageLabel = isSwedish ? 'Meddelande från handläggare:' : 'Message from case handler:';
  const uploadBtn = isSwedish ? '📤 Ladda upp dokument' : '📤 Upload Documents';
  const linkNote = isSwedish 
    ? 'Om du inte kan klicka på knappen, kopiera och klistra in denna länk i din webbläsare:'
    : 'If you cannot click the button, copy and paste this link in your browser:';
  const expiryNote = isSwedish
    ? 'Länken är giltig i 14 dagar.'
    : 'This link is valid for 14 days.';
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
    .message-box { background:#fef3c7; border:1px solid #f59e0b; border-radius:8px; padding:20px; margin:20px 0; }
    .message-box h3 { margin: 0 0 10px 0; color: #92400e; font-size: 15px; font-weight: 600; }
    .message-box p { margin: 0; color: #78350f; white-space: pre-wrap; }
    .button-container { text-align: center; margin: 28px 0; }
    .button {
      display: inline-block;
      background: #0EB0A6;
      color: #ffffff !important;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
    }
    .link-note { font-size: 13px; color: #5f6368; margin-top: 20px; }
    .link-note a { color: #0EB0A6; word-break: break-all; }
    .expiry-note { font-size: 13px; color: #5f6368; text-align: center; margin-top: 10px; }
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

      <div class="message-box">
        <h3>📋 ${messageLabel}</h3>
        <p>${customMessage}</p>
      </div>

      <div class="button-container">
        <a href="${uploadUrl}" class="button">${uploadBtn}</a>
      </div>

      <p class="expiry-note">⏰ ${expiryNote}</p>

      <p class="link-note">
        ${linkNote}<br>
        <a href="${uploadUrl}">${uploadUrl}</a>
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
