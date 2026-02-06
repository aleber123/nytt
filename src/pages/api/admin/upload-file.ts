/**
 * Admin File Upload API
 * 
 * Allows admin to upload files to an order that can be sent to customers.
 * Files are stored in Firebase Storage under orders/{orderId}/admin-files/
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb, getAdminStorage } from '@/lib/firebaseAdmin';
import { verifyAdmin } from '@/lib/adminAuth';
import { isValidDocId, sanitizeString, validateFileUpload } from '@/lib/sanitize';

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

interface AdminUploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
  sentToCustomer?: boolean;
  sentAt?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await verifyAdmin(req, res, 'adminUpload');
  if (!admin) return;

  try {
    const db = getAdminDb();
    const storage = getAdminStorage();
    
    const { orderId, files, uploadedBy } = req.body as { 
      orderId: string; 
      files: FileData[];
      uploadedBy: string;
    };

    if (!isValidDocId(orderId)) {
      return res.status(400).json({ error: 'Invalid or missing Order ID' });
    }

    const fileError = validateFileUpload(files);
    if (fileError) {
      return res.status(400).json({ error: fileError });
    }

    // Verify order exists
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    
    if (!orderSnap.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const orderData = orderSnap.data() as any;
    const bucket = storage.bucket();
    const uploadedFileInfos: AdminUploadedFile[] = [];

    // Upload each file to Firebase Storage
    for (const file of files) {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `orders/${orderId}/admin-files/${timestamp}_${safeName}`;

      // Decode base64 and upload
      const fileBuffer = Buffer.from(file.data, 'base64');
      const storageFile = bucket.file(storagePath);
      
      await storageFile.save(fileBuffer, {
        metadata: {
          contentType: file.type || 'application/octet-stream',
          metadata: {
            originalName: file.name,
            orderId,
            orderNumber: orderData.orderNumber,
            uploadedBy,
            uploadedVia: 'admin-panel'
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
        uploadedAt: new Date().toISOString(),
        uploadedBy: uploadedBy || 'Admin',
        sentToCustomer: false
      });
    }

    // Add files to the order's adminFiles array
    const existingAdminFiles = orderData.adminFiles || [];
    
    await orderRef.update({
      adminFiles: [...existingAdminFiles, ...uploadedFileInfos],
      hasAdminFiles: true,
      lastAdminFileUpload: new Date().toISOString()
    });

    // Add internal note about the upload
    await db.collection('orders').doc(orderId).collection('internalNotes').add({
      content: `📤 Admin uploaded ${uploadedFileInfos.length} file${uploadedFileInfos.length > 1 ? 's' : ''}:\n${uploadedFileInfos.map(f => `- ${f.name}`).join('\n')}`,
      createdAt: new Date(),
      createdBy: uploadedBy || 'Admin',
      readBy: []
    });

    return res.status(200).json({
      success: true,
      message: 'Files uploaded successfully',
      files: uploadedFileInfos.map(f => ({ name: f.name, url: f.url, size: f.size }))
    });

  } catch (error: any) {
    console.error('Admin file upload error:', error);
    return res.status(500).json({ error: 'Upload failed', details: error.message });
  }
}
