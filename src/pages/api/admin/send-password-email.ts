/**
 * Send Password Email API
 * 
 * Sends the file password to the customer in a separate email for security.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyAdmin } from '@/lib/adminAuth';
import { isValidDocId, sanitizeString } from '@/lib/sanitize';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await verifyAdmin(req, res, 'adminEmail');
  if (!admin) return;

  try {
    const db = getAdminDb();
    
    const { orderId, password, fileName, sentBy } = req.body as { 
      orderId: string; 
      password: string;
      fileName: string;
      sentBy: string;
    };

    if (!isValidDocId(orderId)) {
      return res.status(400).json({ error: 'Invalid or missing Order ID' });
    }

    if (!password || typeof password !== 'string' || password.trim().length === 0 || password.length > 500) {
      return res.status(400).json({ error: 'Invalid password (1-500 characters)' });
    }

    if (fileName && typeof fileName === 'string' && fileName.length > 500) {
      return res.status(400).json({ error: 'File name too long' });
    }

    // Get order data
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    
    if (!orderSnap.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const orderData = orderSnap.data() as any;
    const customerEmail = orderData.customerInfo?.email;
    const customerName = `${orderData.customerInfo?.firstName || ''} ${orderData.customerInfo?.lastName || ''}`.trim() || 'Customer';
    const orderNumber = orderData.orderNumber || orderId;
    const locale = orderData.locale || 'sv';

    if (!customerEmail) {
      return res.status(400).json({ error: 'Customer email not found' });
    }

    // Generate email HTML
    const emailHtml = generatePasswordEmail({
      customerName,
      orderNumber,
      password,
      fileName,
      locale
    });

    const subject = locale === 'en' 
      ? `Password for your document - Order #${orderNumber}`
      : `Lösenord för ditt dokument - Order #${orderNumber}`;

    // Queue email
    await db.collection('emailQueue').add({
      to: customerEmail,
      subject,
      html: emailHtml,
      createdAt: new Date(),
      status: 'pending',
      metadata: {
        orderId,
        orderNumber,
        type: 'file-password'
      }
    });

    // Add internal note
    await db.collection('orders').doc(orderId).collection('internalNotes').add({
      content: `🔐 Sent password for file "${fileName}" to customer via separate email`,
      createdAt: new Date(),
      createdBy: sentBy || 'Admin',
      readBy: []
    });

    return res.status(200).json({
      success: true,
      message: 'Password sent to customer',
      sentTo: customerEmail
    });

  } catch (error: any) {
    console.error('Send password email error:', error);
    return res.status(500).json({ error: 'Failed to send password', details: error.message });
  }
}

function generatePasswordEmail(data: {
  customerName: string;
  orderNumber: string;
  password: string;
  fileName: string;
  locale: string;
}): string {
  const { customerName, orderNumber, password, fileName, locale } = data;
  const isEnglish = locale === 'en';

  return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isEnglish ? 'Password for your document' : 'Lösenord för ditt dokument'}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #202124; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
  <div style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); overflow: hidden;">
    
    <div style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%); color: #ffffff; padding: 32px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 600;">
        🔐 ${isEnglish ? 'Password for Your Document' : 'Lösenord för ditt dokument'}
      </h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">
        ${isEnglish ? 'Order' : 'Order'} #${orderNumber}
      </p>
    </div>

    <div style="padding: 32px;">
      <p style="margin: 0 0 20px 0; font-size: 15px;">
        ${isEnglish ? `Hi ${customerName},` : `Hej ${customerName},`}
      </p>
      
      <p style="margin: 0 0 20px 0; font-size: 15px;">
        ${isEnglish 
          ? 'Here is the password to open the encrypted document we sent you in a separate email.'
          : 'Här är lösenordet för att öppna det krypterade dokumentet vi skickade i ett separat mail.'}
      </p>

      <div style="background: #fef3c7; border: 2px solid #d97706; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 13px; color: #92400e; font-weight: 500;">
          ${isEnglish ? 'Document:' : 'Dokument:'}
        </p>
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #78350f;">
          ${fileName}
        </p>
        <p style="margin: 0 0 8px 0; font-size: 13px; color: #92400e; font-weight: 500;">
          ${isEnglish ? 'Password:' : 'Lösenord:'}
        </p>
        <p style="margin: 0; font-size: 24px; font-weight: 700; color: #78350f; font-family: monospace; letter-spacing: 2px; background: #ffffff; padding: 12px 20px; border-radius: 6px; display: inline-block;">
          ${password}
        </p>
      </div>

      <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0; font-size: 13px; color: #991b1b;">
          <strong>⚠️ ${isEnglish ? 'Security Notice:' : 'Säkerhetsmeddelande:'}</strong><br>
          ${isEnglish 
            ? 'This password is sent separately from the document for your security. Please do not share this password with anyone.'
            : 'Detta lösenord skickas separat från dokumentet för din säkerhet. Vänligen dela inte detta lösenord med någon.'}
        </p>
      </div>

      <p style="margin: 24px 0 0 0; font-size: 13px; color: #666;">
        ${isEnglish 
          ? 'If you have any questions, please reply to this email or contact us at info@doxvl.se.'
          : 'Om du har några frågor, vänligen svara på detta mail eller kontakta oss på info@doxvl.se.'}
      </p>
    </div>

    <div style="background: #f8f9fa; padding: 24px; text-align: center; border-top: 1px solid #eaecef;">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #333;">DOX Visumpartner AB</p>
      <p style="margin: 0; color: #666; font-size: 13px;">
        Box 38, 121 25 Stockholm-Globen<br>
        Tel: 08-40941900 | info@doxvl.se
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
