/**
 * GDPR Service
 * Handles anonymization and deletion of personal data according to GDPR requirements
 * 
 * Retention periods:
 * - Order data (for accounting): 7 years (Swedish Bokföringslagen)
 * - Uploaded files (ID, documents): 90 days after order completion
 * - Personal data: Anonymized after 7 years
 */

import { adminDb } from '@/lib/firebaseAdmin';

// Anonymized placeholder values
const ANONYMIZED_DATA = {
  firstName: '[RADERAT]',
  lastName: '[RADERAT]',
  email: 'anonymized@deleted.local',
  phone: '[RADERAT]',
  address: '[RADERAT]',
  street: '[RADERAT]',
  postalCode: '00000',
  city: '[RADERAT]',
  companyName: '[RADERAT]',
  organizationNumber: '[RADERAT]',
  vatNumber: '[RADERAT]',
  contactPerson: '[RADERAT]',
  name: '[RADERAT]',
  company: '[RADERAT]',
};

export interface GdprStats {
  ordersToAnonymize: number;
  ordersWithFilesToDelete: number;
  totalOrders: number;
  oldestOrderDate: string | null;
}

export interface GdprResult {
  success: boolean;
  anonymizedOrders: number;
  deletedFiles: number;
  errors: string[];
}

/**
 * Get statistics about orders that need GDPR processing
 */
export async function getGdprStats(anonymizeAfterYears: number = 7, deleteFilesAfterDays: number = 90): Promise<GdprStats> {
  const ordersRef = adminDb.collection('orders');
  const allOrdersSnapshot = await ordersRef.get();
  
  const now = new Date();
  const anonymizeCutoff = new Date(now.getFullYear() - anonymizeAfterYears, now.getMonth(), now.getDate());
  const fileDeleteCutoff = new Date(now.getTime() - (deleteFilesAfterDays * 24 * 60 * 60 * 1000));
  
  let ordersToAnonymize = 0;
  let ordersWithFilesToDelete = 0;
  let oldestOrderDate: Date | null = null as Date | null;
  
  allOrdersSnapshot.forEach((doc) => {
    const data = doc.data();
    const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
    
    // Check if order should be anonymized (older than 7 years and not already anonymized)
    if (createdAt < anonymizeCutoff && !data.gdprAnonymized) {
      ordersToAnonymize++;
    }
    
    // Check if order has files that should be deleted (older than 90 days and has files)
    if (createdAt < fileDeleteCutoff && !data.gdprFilesDeleted && data.hasUploadedFiles) {
      ordersWithFilesToDelete++;
    }
    
    // Track oldest order
    if (!oldestOrderDate || createdAt < oldestOrderDate) {
      oldestOrderDate = createdAt;
    }
  });
  
  return {
    ordersToAnonymize,
    ordersWithFilesToDelete,
    totalOrders: allOrdersSnapshot.size,
    oldestOrderDate: oldestOrderDate ? oldestOrderDate.toISOString() : null,
  };
}

/**
 * Get list of orders that will be affected by GDPR processing
 */
export async function getOrdersForGdprProcessing(
  anonymizeAfterYears: number = 7, 
  deleteFilesAfterDays: number = 90,
  limit: number = 100
): Promise<{
  toAnonymize: Array<{ id: string; orderNumber: string; createdAt: string; customerName: string }>;
  toDeleteFiles: Array<{ id: string; orderNumber: string; createdAt: string; customerName: string }>;
}> {
  const ordersRef = adminDb.collection('orders');
  const allOrdersSnapshot = await ordersRef.get();
  
  const now = new Date();
  const anonymizeCutoff = new Date(now.getFullYear() - anonymizeAfterYears, now.getMonth(), now.getDate());
  const fileDeleteCutoff = new Date(now.getTime() - (deleteFilesAfterDays * 24 * 60 * 60 * 1000));
  
  const toAnonymize: Array<{ id: string; orderNumber: string; createdAt: string; customerName: string }> = [];
  const toDeleteFiles: Array<{ id: string; orderNumber: string; createdAt: string; customerName: string }> = [];
  
  allOrdersSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
    const customerName = data.customerInfo 
      ? `${data.customerInfo.firstName || ''} ${data.customerInfo.lastName || ''}`.trim() || '[Okänd]'
      : '[Okänd]';
    
    const orderInfo = {
      id: docSnap.id,
      orderNumber: data.orderNumber || docSnap.id,
      createdAt: createdAt.toISOString(),
      customerName,
    };
    
    if (createdAt < anonymizeCutoff && !data.gdprAnonymized && toAnonymize.length < limit) {
      toAnonymize.push(orderInfo);
    }
    
    if (createdAt < fileDeleteCutoff && !data.gdprFilesDeleted && data.hasUploadedFiles && toDeleteFiles.length < limit) {
      toDeleteFiles.push(orderInfo);
    }
  });
  
  // Sort by date (oldest first)
  toAnonymize.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  toDeleteFiles.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  
  return { toAnonymize, toDeleteFiles };
}

/**
 * Anonymize personal data in an order
 * Keeps: order number, amounts, document types, services, dates
 * Removes: names, addresses, emails, phones, company details
 */
export async function anonymizeOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const orderRef = adminDb.collection('orders').doc(orderId);
    
    await orderRef.update({
      // Anonymize customerInfo
      'customerInfo.firstName': ANONYMIZED_DATA.firstName,
      'customerInfo.lastName': ANONYMIZED_DATA.lastName,
      'customerInfo.email': ANONYMIZED_DATA.email,
      'customerInfo.phone': ANONYMIZED_DATA.phone,
      'customerInfo.address': ANONYMIZED_DATA.address,
      'customerInfo.companyName': ANONYMIZED_DATA.companyName,
      
      // Anonymize returnAddress
      'returnAddress.firstName': ANONYMIZED_DATA.firstName,
      'returnAddress.lastName': ANONYMIZED_DATA.lastName,
      'returnAddress.email': ANONYMIZED_DATA.email,
      'returnAddress.phone': ANONYMIZED_DATA.phone,
      'returnAddress.street': ANONYMIZED_DATA.street,
      'returnAddress.companyName': ANONYMIZED_DATA.companyName,
      
      // Anonymize billingInfo
      'billingInfo.firstName': ANONYMIZED_DATA.firstName,
      'billingInfo.lastName': ANONYMIZED_DATA.lastName,
      'billingInfo.email': ANONYMIZED_DATA.email,
      'billingInfo.phone': ANONYMIZED_DATA.phone,
      'billingInfo.street': ANONYMIZED_DATA.street,
      'billingInfo.companyName': ANONYMIZED_DATA.companyName,
      'billingInfo.organizationNumber': ANONYMIZED_DATA.organizationNumber,
      'billingInfo.vatNumber': ANONYMIZED_DATA.vatNumber,
      'billingInfo.contactPerson': ANONYMIZED_DATA.contactPerson,
      
      // Anonymize pickupAddress
      'pickupAddress.name': ANONYMIZED_DATA.name,
      'pickupAddress.company': ANONYMIZED_DATA.company,
      'pickupAddress.street': ANONYMIZED_DATA.street,
      
      // Clear sensitive notes
      'additionalNotes': '[RADERAT]',
      
      // Mark as anonymized
      'gdprAnonymized': true,
      'gdprAnonymizedAt': new Date().toISOString(),
    });
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Mark uploaded files as deleted for an order
 * Note: If files are stored in Firebase Storage, they would need to be deleted manually
 * or via a separate process. This function marks the order as having files deleted.
 */
export async function deleteOrderFiles(orderId: string): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  try {
    // Update order to mark files as deleted
    // Note: Actual file deletion from storage would need to be implemented
    // based on where files are stored (Firebase Storage, external service, etc.)
    const orderRef = adminDb.collection('orders').doc(orderId);
    await orderRef.update({
      'gdprFilesDeleted': true,
      'gdprFilesDeletedAt': new Date().toISOString(),
      'hasUploadedFiles': false,
      // Clear any file references stored in the order
      'uploadedFileUrls': [],
      'idDocumentUrl': null,
      'registrationCertUrl': null,
      'signingAuthorityIdUrl': null,
    });
    
    return { success: true, deletedCount: 1 };
  } catch (error) {
    return { 
      success: false, 
      deletedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Run full GDPR cleanup process
 */
export async function runGdprCleanup(
  anonymizeAfterYears: number = 7,
  deleteFilesAfterDays: number = 90,
  dryRun: boolean = false
): Promise<GdprResult> {
  const errors: string[] = [];
  let anonymizedOrders = 0;
  let deletedFiles = 0;
  
  const { toAnonymize, toDeleteFiles } = await getOrdersForGdprProcessing(
    anonymizeAfterYears,
    deleteFilesAfterDays
  );
  
  if (dryRun) {
    return {
      success: true,
      anonymizedOrders: toAnonymize.length,
      deletedFiles: toDeleteFiles.length,
      errors: ['DRY RUN - No changes made'],
    };
  }
  
  // Anonymize old orders
  for (const order of toAnonymize) {
    const result = await anonymizeOrder(order.id);
    if (result.success) {
      anonymizedOrders++;
    } else {
      errors.push(`Failed to anonymize order ${order.orderNumber}: ${result.error}`);
    }
  }
  
  // Delete old files
  for (const order of toDeleteFiles) {
    const result = await deleteOrderFiles(order.id);
    if (result.success) {
      deletedFiles += result.deletedCount;
    } else {
      errors.push(`Failed to delete files for order ${order.orderNumber}: ${result.error}`);
    }
  }
  
  return {
    success: errors.length === 0,
    anonymizedOrders,
    deletedFiles,
    errors,
  };
}

/**
 * Export all data for a customer (GDPR right to data portability)
 */
export async function exportCustomerData(email: string): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const ordersRef = adminDb.collection('orders');
    const snapshot = await ordersRef.where('customerInfo.email', '==', email).get();
    
    const orders = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        orderId: doc.id,
        ...data,
        // Remove internal fields
        gdprAnonymized: undefined,
        gdprAnonymizedAt: undefined,
        gdprFilesDeleted: undefined,
        gdprFilesDeletedAt: undefined,
      };
    });
    
    return { success: true, data: orders };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete all data for a customer (GDPR right to erasure)
 */
export async function deleteCustomerData(email: string): Promise<{
  success: boolean;
  deletedOrders: number;
  error?: string;
}> {
  try {
    const ordersRef = adminDb.collection('orders');
    const snapshot = await ordersRef.where('customerInfo.email', '==', email).get();
    
    let deletedOrders = 0;
    
    for (const docSnap of snapshot.docs) {
      // Delete files first
      await deleteOrderFiles(docSnap.id);
      
      // Then anonymize the order (we keep anonymized records for accounting)
      const result = await anonymizeOrder(docSnap.id);
      if (result.success) {
        deletedOrders++;
      }
    }
    
    return { success: true, deletedOrders };
  } catch (error) {
    return {
      success: false,
      deletedOrders: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
