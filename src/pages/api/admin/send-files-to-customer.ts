/**
 * Send Files to Customer API
 * 
 * Sends selected admin-uploaded files to the customer via email.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { verifyAdmin } from '@/lib/adminAuth';
import { isValidDocId, isValidUrl, sanitizeString } from '@/lib/sanitize';

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
    
    const { orderId, fileUrls, customMessage, sentBy } = req.body as { 
      orderId: string; 
      fileUrls: string[];
      customMessage?: string;
      sentBy: string;
    };

    if (!isValidDocId(orderId)) {
      return res.status(400).json({ error: 'Invalid or missing Order ID' });
    }

    if (!Array.isArray(fileUrls) || fileUrls.length === 0 || fileUrls.length > 20) {
      return res.status(400).json({ error: 'Invalid file selection (1-20 files)' });
    }

    if (!fileUrls.every(isValidUrl)) {
      return res.status(400).json({ error: 'Invalid file URL detected' });
    }

    if (customMessage && typeof customMessage === 'string' && customMessage.length > 2000) {
      return res.status(400).json({ error: 'Message too long (max 2000 characters)' });
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

    // Get file details from adminFiles
    const adminFiles = orderData.adminFiles || [];
    const filesToSend = adminFiles.filter((f: any) => fileUrls.includes(f.url));

    if (filesToSend.length === 0) {
      return res.status(400).json({ error: 'Selected files not found' });
    }

    // Generate email HTML
    const emailHtml = generateFilesEmail({
      customerName,
      orderNumber,
      files: filesToSend,
      customMessage,
      locale
    });

    const subject = locale === 'en' 
      ? `Documents for your order #${orderNumber} - DOX Visumpartner`
      : `Dokument för din order #${orderNumber} - DOX Visumpartner`;

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
        type: 'admin-files',
        fileCount: filesToSend.length
      }
    });

    // Update adminFiles to mark as sent
    const updatedAdminFiles = adminFiles.map((f: any) => {
      if (fileUrls.includes(f.url)) {
        return {
          ...f,
          sentToCustomer: true,
          sentAt: new Date().toISOString(),
          sentBy
        };
      }
      return f;
    });

    await orderRef.update({
      adminFiles: updatedAdminFiles,
      lastFileSentToCustomer: new Date().toISOString()
    });

    // Add internal note
    await db.collection('orders').doc(orderId).collection('internalNotes').add({
      content: `📧 Sent ${filesToSend.length} file${filesToSend.length > 1 ? 's' : ''} to customer:\n${filesToSend.map((f: any) => `- ${f.name}`).join('\n')}${customMessage ? `\n\nMessage: "${customMessage}"` : ''}`,
      createdAt: new Date(),
      createdBy: sentBy || 'Admin',
      readBy: []
    });

    return res.status(200).json({
      success: true,
      message: 'Files sent to customer',
      sentTo: customerEmail,
      fileCount: filesToSend.length
    });

  } catch (error: any) {
    console.error('Send files to customer error:', error);
    return res.status(500).json({ error: 'Failed to send files', details: error.message });
  }
}

function generateFilesEmail(data: {
  customerName: string;
  orderNumber: string;
  files: Array<{ name: string; url: string; size: number }>;
  customMessage?: string;
  locale: string;
}): string {
  const { customerName, orderNumber, files, customMessage, locale } = data;
  const isEnglish = locale === 'en';

  const fileList = files.map(f => {
    const sizeKB = Math.round(f.size / 1024);
    return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eaecef;">
          <div style="display: flex; align-items: center;">
            <span style="font-size: 20px; margin-right: 12px;">📄</span>
            <div>
              <strong style="color: #202124;">${f.name}</strong>
              <div style="font-size: 12px; color: #666;">${sizeKB} KB</div>
            </div>
          </div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eaecef; text-align: right;">
          <a href="${f.url}" style="display: inline-block; background: #0EB0A6; color: #ffffff; text-decoration: none; padding: 8px 16px; border-radius: 4px; font-size: 13px; font-weight: 500;">
            ${isEnglish ? 'Download' : 'Ladda ner'}
          </a>
        </td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isEnglish ? 'Documents for your order' : 'Dokument för din order'}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #202124; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
  <div style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); overflow: hidden;">
    
    <div style="background: linear-gradient(135deg, #0EB0A6 0%, #0a8f87 100%); color: #ffffff; padding: 32px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 600;">
        ${isEnglish ? '📎 Documents for Your Order' : '📎 Dokument för din order'}
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
          ? 'We have prepared the following documents for your order. Click the download button to save each file.'
          : 'Vi har förberett följande dokument för din order. Klicka på ladda ner-knappen för att spara varje fil.'}
      </p>

      ${customMessage ? `
        <div style="background: #f0f9ff; border-left: 4px solid #0EB0A6; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; font-size: 14px; color: #0a8f87; font-weight: 500;">
            ${isEnglish ? 'Message from your case handler:' : 'Meddelande från din handläggare:'}
          </p>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #333;">
            ${customMessage}
          </p>
        </div>
      ` : ''}

      <table style="width: 100%; border-collapse: collapse; margin: 24px 0; background: #fafafa; border-radius: 8px; overflow: hidden;">
        <tbody>
          ${fileList}
        </tbody>
      </table>

      <p style="margin: 24px 0 0 0; font-size: 13px; color: #666;">
        ${isEnglish 
          ? 'If you have any questions about these documents, please reply to this email or contact us at info@doxvl.se.'
          : 'Om du har några frågor om dessa dokument, vänligen svara på detta mail eller kontakta oss på info@doxvl.se.'}
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
