/**
 * Document Upload API
 * 
 * Handles file uploads from customers via the secure upload link.
 * Files are sent as base64 encoded data.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb, getAdminStorage } from '@/lib/firebaseAdmin';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

interface FileData {
  name: string;
  type: string;
  size: number;
  data: string; // base64 encoded
}

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = getAdminDb();
    const storage = getAdminStorage();
    
    const { token, files } = req.body as { token: string; files: FileData[] };

    if (!token) {
      return res.status(400).json({ error: 'Token krävs' });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Inga filer att ladda upp' });
    }

    // Find document request by token
    const querySnap = await db.collection('documentRequests')
      .where('token', '==', token)
      .limit(1)
      .get();

    if (querySnap.empty) {
      return res.status(404).json({ error: 'Ogiltig uppladdningslänk' });
    }

    const docRef = querySnap.docs[0].ref;
    const docData = querySnap.docs[0].data();

    // Check if expired
    if (new Date(docData.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Uppladdningslänken har gått ut' });
    }

    // Check if already uploaded
    if (docData.status === 'uploaded') {
      return res.status(400).json({ error: 'Dokument har redan laddats upp via denna länk' });
    }

    const orderId = docData.orderId;
    const orderNumber = docData.orderNumber;
    const bucket = storage.bucket();
    const uploadedFileInfos: UploadedFile[] = [];

    // Upload each file to Firebase Storage
    for (const file of files) {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `orders/${orderId}/supplementary/${timestamp}_${safeName}`;

      // Decode base64 and upload
      const fileBuffer = Buffer.from(file.data, 'base64');
      const storageFile = bucket.file(storagePath);
      
      await storageFile.save(fileBuffer, {
        metadata: {
          contentType: file.type || 'application/octet-stream',
          metadata: {
            originalName: file.name,
            orderId,
            orderNumber,
            uploadedVia: 'document-request',
            token
          }
        }
      });

      // Make file publicly accessible
      await storageFile.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

      uploadedFileInfos.push({
        name: file.name,
        url: publicUrl,
        size: file.size,
        type: file.type || 'unknown',
        uploadedAt: new Date().toISOString()
      });
    }

    // Update document request status
    await docRef.update({
      status: 'uploaded',
      uploadedFiles: uploadedFileInfos,
      uploadedAt: new Date().toISOString()
    });

    // Also add files to the order's supplementary files
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    const orderData = orderSnap.exists ? (orderSnap.data() as any) : {};
    
    if (orderSnap.exists) {
      const existingSupplementary = orderData.supplementaryFiles || [];
      
      await orderRef.update({
        supplementaryFiles: [...existingSupplementary, ...uploadedFileInfos],
        hasSupplementaryFiles: true,
        lastSupplementaryUpload: new Date().toISOString()
      });
    }

    // Add internal note about the upload (in English for international use)
    await db.collection('orders').doc(orderId).collection('internalNotes').add({
      content: `📎 Customer uploaded ${uploadedFileInfos.length} supplementary document${uploadedFileInfos.length > 1 ? 's' : ''}:\n${uploadedFileInfos.map(f => `- ${f.name}`).join('\n')}`,
      createdAt: new Date(),
      createdBy: 'System',
      readBy: [] // No one has read it yet
    });

    // Get customer info for notification email
    const customerName = `${orderData?.customerInfo?.firstName || ''} ${orderData?.customerInfo?.lastName || ''}`.trim() || 'Customer';

    // Send notification email to admin (info@doxvl.se)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://doxvl.se';
    const adminOrderUrl = `${baseUrl}/admin/orders/${orderId}`;
    
    // Use emailQueue collection which triggers sendInvoiceEmail Cloud Function
    await db.collection('emailQueue').add({
      to: 'info@doxvl.se',
      subject: `📎 New file upload - Order ${orderNumber}`,
      html: generateAdminNotificationEmail({
        orderNumber,
        customerName,
        files: uploadedFileInfos,
        adminOrderUrl
      }),
      createdAt: new Date(),
      status: 'pending'
    });

    return res.status(200).json({
      success: true,
      message: 'Filerna har laddats upp',
      files: uploadedFileInfos.map(f => ({ name: f.name, size: f.size }))
    });

  } catch (error: any) {
    return res.status(500).json({ error: 'Ett fel uppstod vid uppladdningen', details: error.message });
  }
}

// Generate admin notification email HTML
function generateAdminNotificationEmail(data: {
  orderNumber: string;
  customerName: string;
  files: UploadedFile[];
  adminOrderUrl: string;
}): string {
  const { orderNumber, customerName, files, adminOrderUrl } = data;
  
  const fileList = files.map(f => {
    const sizeKB = Math.round(f.size / 1024);
    return `<li style="margin: 8px 0; padding: 8px; background: #f8f9fa; border-radius: 4px;">
      📄 <strong>${f.name}</strong> <span style="color: #666;">(${sizeKB} KB)</span>
    </li>`;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New File Upload</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #202124; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
  <div style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); overflow: hidden;">
    
    <div style="background: #0EB0A6; color: #ffffff; padding: 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 20px;">📎 New File Upload</h1>
    </div>

    <div style="padding: 24px;">
      <p style="margin: 0 0 16px 0;">
        <strong>${customerName}</strong> uploaded ${files.length} file${files.length > 1 ? 's' : ''} to order <strong>#${orderNumber}</strong>.
      </p>

      <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 14px;">Uploaded files:</h3>
        <ul style="margin: 0; padding: 0; list-style: none;">
          ${fileList}
        </ul>
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${adminOrderUrl}" style="display: inline-block; background: #0EB0A6; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 15px;">
          🔗 Open order in admin
        </a>
      </div>

      <p style="font-size: 13px; color: #666; text-align: center; margin-top: 20px;">
        Go to the Files tab to view the uploaded documents.
      </p>
    </div>

    <div style="background: #f8f9fa; padding: 16px; text-align: center; border-top: 1px solid #eaecef;">
      <p style="margin: 0; color: #666; font-size: 12px;">
        This is an automated message from DOX Visumpartner AB
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
