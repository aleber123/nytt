/**
 * Send Order Update Notification Email API
 * 
 * Sends an email to the customer when order information has been updated
 * (e.g., country, document type, quantity changes).
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { rateLimiters, getClientIp } from '@/lib/rateLimit';

interface SendOrderUpdateBody {
  orderId: string;
  changes: {
    field: string;
    oldValue: string;
    newValue: string;
  }[];
  customMessage?: string;
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

  const { orderId, changes, customMessage } = req.body as SendOrderUpdateBody;

  if (!orderId) {
    return res.status(400).json({ error: 'orderId is required' });
  }

  if (!changes || changes.length === 0) {
    return res.status(400).json({ error: 'No changes provided' });
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
    const emailSubject = isEnglish 
      ? `Order Updated - Order ${orderNumber}`
      : `Order uppdaterad - Order ${orderNumber}`;

    await db.collection('customerEmails').add({
      name: customerName,
      email: customerEmail,
      phone: order?.customerInfo?.phone || '',
      subject: emailSubject,
      message: generateEmailHtml({
        customerName,
        orderNumber,
        changes,
        customMessage,
        locale: orderLocale
      }),
      orderId: actualOrderId,
      createdAt: new Date(),
      status: 'unread',
      type: 'order_update'
    });

    // Update order to track that update notification was sent
    await orderRef.set({
      orderUpdateNotificationSent: true,
      orderUpdateNotificationSentAt: new Date().toISOString()
    }, { merge: true });

    const successMsg = isEnglish 
      ? `Order update notification has been sent to ${customerEmail}`
      : `Uppdateringsmeddelande har skickats till ${customerEmail}`;

    return res.status(200).json({
      success: true,
      message: successMsg
    });

  } catch (error: any) {
    console.error('Error sending order update notification:', error);
    return res.status(500).json({ error: 'An error occurred', details: error.message });
  }
}

function generateEmailHtml(data: {
  customerName: string;
  orderNumber: string;
  changes: { field: string; oldValue: string; newValue: string }[];
  customMessage?: string;
  locale: string;
}): string {
  const { customerName, orderNumber, changes, customMessage, locale } = data;
  
  const isSwedish = locale !== 'en';
  
  const title = isSwedish ? 'Din order har uppdaterats' : 'Your Order Has Been Updated';
  const greeting = isSwedish ? `Hej ${customerName}!` : `Dear ${customerName},`;
  const intro = isSwedish 
    ? `Vi vill informera dig om att din order ${orderNumber} har uppdaterats med följande ändringar:`
    : `We would like to inform you that your order ${orderNumber} has been updated with the following changes:`;
  
  // Field name translations
  const fieldNames: Record<string, { sv: string; en: string }> = {
    country: { sv: 'Destinationsland', en: 'Destination Country' },
    documentType: { sv: 'Dokumenttyp', en: 'Document Type' },
    documentTypes: { sv: 'Dokumenttyper', en: 'Document Types' },
    quantity: { sv: 'Antal dokument', en: 'Number of Documents' },
    documentSource: { sv: 'Dokumentkälla', en: 'Document Source' },
    companyName: { sv: 'Företagsnamn', en: 'Company Name' },
    invoiceReference: { sv: 'Kundreferens', en: 'Customer Reference' }
  };

  const getFieldName = (field: string) => {
    const names = fieldNames[field];
    if (names) {
      return isSwedish ? names.sv : names.en;
    }
    return field;
  };

  const changesHtml = changes.map(change => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 500; color: #374151;">
        ${getFieldName(change.field)}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #9ca3af; text-decoration: line-through;">
        ${change.oldValue || '—'}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #059669; font-weight: 500;">
        ${change.newValue || '—'}
      </td>
    </tr>
  `).join('');

  const fromLabel = isSwedish ? 'Från' : 'From';
  const toLabel = isSwedish ? 'Till' : 'To';
  const fieldLabel = isSwedish ? 'Fält' : 'Field';
  
  const additionalMessageLabel = isSwedish ? 'Meddelande från handläggare:' : 'Message from case handler:';
  const questionsTitle = isSwedish ? 'Frågor?' : 'Questions?';
  const contactText = isSwedish ? 'Kontakta oss gärna:' : 'Feel free to contact us:';
  const footerText = isSwedish ? 'Professionell dokumentlegalisering sedan många år' : 'Professional document legalisation for many years';
  const autoMsg = isSwedish ? 'Detta är ett automatiskt genererat meddelande.' : 'This is an automatically generated message.';
  const noActionNeeded = isSwedish 
    ? 'Du behöver inte göra något. Dessa ändringar har redan genomförts.'
    : 'No action is required from you. These changes have already been applied.';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
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
                📋 ${title}
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
              
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 20px 0;">
                ${intro}
              </p>
              
              <!-- Changes Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">
                      ${fieldLabel}
                    </th>
                    <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">
                      ${fromLabel}
                    </th>
                    <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">
                      ${toLabel}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${changesHtml}
                </tbody>
              </table>
              
              <!-- No action needed notice -->
              <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <p style="color: #065f46; font-size: 14px; margin: 0;">
                  ✅ ${noActionNeeded}
                </p>
              </div>
              
              ${customMessage ? `
              <!-- Custom Message -->
              <div style="background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <p style="color: #92400e; font-size: 12px; font-weight: 600; margin: 0 0 8px 0; text-transform: uppercase;">
                  ${additionalMessageLabel}
                </p>
                <p style="color: #78350f; font-size: 14px; margin: 0; white-space: pre-wrap;">
                  ${customMessage}
                </p>
              </div>
              ` : ''}
              
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
