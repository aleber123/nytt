/**
 * Send Custom Email API
 * 
 * Sends a custom email to the customer for an order.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { rateLimiters, getClientIp } from '@/lib/rateLimit';

interface SendCustomEmailBody {
  orderId: string;
  subject: string;
  message: string;
  templateId?: string;
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

  const { orderId, subject, message, templateId } = req.body as SendCustomEmailBody;

  if (!orderId) {
    return res.status(400).json({ error: 'orderId is required' });
  }

  if (!subject?.trim()) {
    return res.status(400).json({ error: 'Subject is required' });
  }

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message is required' });
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
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderSnap.data() as any;
    const customerEmail = order?.customerInfo?.email;
    const customerName = `${order?.customerInfo?.firstName || ''} ${order?.customerInfo?.lastName || ''}`.trim();
    const orderNumber = order?.orderNumber || orderId;
    const orderLocale = order?.locale || 'sv';
    const isEnglish = orderLocale === 'en';

    if (!customerEmail) {
      return res.status(400).json({ error: 'Customer has no email address' });
    }

    // Queue email
    await db.collection('customerEmails').add({
      name: customerName,
      email: customerEmail,
      phone: order?.customerInfo?.phone || '',
      subject: subject.trim(),
      message: generateEmailHtml({
        customerName,
        orderNumber,
        subject: subject.trim(),
        message: message.trim(),
        locale: orderLocale
      }),
      orderId: actualOrderId,
      createdAt: new Date(),
      status: 'unread',
      type: 'custom_email',
      templateId: templateId || 'custom'
    });

    // Log the email in order history
    const emailHistory = order.emailHistory || [];
    emailHistory.push({
      type: 'custom_email',
      templateId: templateId || 'custom',
      subject: subject.trim(),
      sentAt: new Date().toISOString(),
      sentTo: customerEmail
    });

    await orderRef.set({
      emailHistory,
      lastEmailSentAt: new Date().toISOString()
    }, { merge: true });

    const successMsg = isEnglish 
      ? `Email has been sent to ${customerEmail}`
      : `E-post har skickats till ${customerEmail}`;

    return res.status(200).json({
      success: true,
      message: successMsg
    });

  } catch (error: any) {
    console.error('Error sending custom email:', error);
    return res.status(500).json({ error: 'An error occurred', details: error.message });
  }
}

function generateEmailHtml(data: {
  customerName: string;
  orderNumber: string;
  subject: string;
  message: string;
  locale: string;
}): string {
  const { customerName, orderNumber, subject, message, locale } = data;
  
  const isSwedish = locale !== 'en';
  
  const greeting = isSwedish ? `Hej ${customerName}!` : `Dear ${customerName},`;
  const regardingOrder = isSwedish 
    ? `Angående din order ${orderNumber}:`
    : `Regarding your order ${orderNumber}:`;
  const questionsTitle = isSwedish ? 'Frågor?' : 'Questions?';
  const contactText = isSwedish ? 'Kontakta oss gärna:' : 'Feel free to contact us:';
  const footerText = isSwedish ? 'Professionell dokumentlegalisering sedan många år' : 'Professional document legalisation for many years';
  const autoMsg = isSwedish ? 'Detta är ett meddelande från DOX Visumpartner.' : 'This is a message from DOX Visumpartner.';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                📧 ${subject}
              </h1>
              <p style="color: #93c5fd; margin: 10px 0 0 0; font-size: 14px;">
                Order ${orderNumber}
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                ${greeting}
              </p>
              
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 16px 0;">
                ${regardingOrder}
              </p>
              
              <!-- Message -->
              <div style="background-color: #f9fafb; border-left: 4px solid #2563eb; padding: 16px; margin-bottom: 20px;">
                <p style="color: #374151; font-size: 14px; margin: 0; white-space: pre-wrap; line-height: 1.6;">
${message}
                </p>
              </div>
              
              <!-- Contact Section -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-top: 20px;">
                <h3 style="color: #374151; font-size: 16px; margin: 0 0 12px 0;">
                  ${questionsTitle}
                </h3>
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">
                  ${contactText}
                </p>
                <p style="margin: 0;">
                  <a href="mailto:info@doxvl.se" style="color: #2563eb; text-decoration: none;">info@doxvl.se</a>
                  <span style="color: #9ca3af; margin: 0 8px;">|</span>
                  <a href="tel:+46101992400" style="color: #2563eb; text-decoration: none;">010-199 24 00</a>
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1e3a5f; padding: 20px; text-align: center;">
              <p style="color: #93c5fd; font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">
                DOX Visumpartner
              </p>
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                ${footerText}
              </p>
              <p style="color: #475569; font-size: 11px; margin: 12px 0 0 0;">
                ${autoMsg}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
