/**
 * Document Upload API
 * 
 * Handles file uploads from customers via the secure upload link.
 * Files are sent as base64 encoded data.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb, adminStorage } from '@/lib/firebaseAdmin';

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
    const { token, files } = req.body as { token: string; files: FileData[] };

    if (!token) {
      return res.status(400).json({ error: 'Token krävs' });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Inga filer att ladda upp' });
    }

    // Find document request by token
    const querySnap = await adminDb.collection('documentRequests')
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
    const bucket = adminStorage.bucket();
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
    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    
    if (orderSnap.exists) {
      const orderData = orderSnap.data() as any;
      const existingSupplementary = orderData.supplementaryFiles || [];
      
      await orderRef.update({
        supplementaryFiles: [...existingSupplementary, ...uploadedFileInfos],
        hasSupplementaryFiles: true,
        lastSupplementaryUpload: new Date().toISOString()
      });
    }

    // Add internal note about the upload
    await adminDb.collection('orders').doc(orderId).collection('internalNotes').add({
      content: `📎 Kund har laddat upp ${uploadedFileInfos.length} kompletterande dokument:\n${uploadedFileInfos.map(f => `- ${f.name}`).join('\n')}`,
      createdAt: new Date(),
      createdBy: 'System',
      readBy: [] // No one has read it yet
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
