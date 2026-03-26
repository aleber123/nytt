/**
 * GDPR Service
 * Handles anonymization and deletion of personal data according to GDPR requirements
 *
 * Retention periods:
 * - Order data (for accounting): 7 years (Swedish Bokföringslagen 7:2)
 * - Uploaded files (ID, documents): 90 days after order creation
 * - Personal data: Anonymized after 7 years
 *
 * Collections containing personal data:
 * - orders: Customer info, billing, return addresses, uploaded files
 * - contactMessages: Name, email, phone from contact form
 * - customerEmails: Name, email in sent messages
 * - visaFormSubmissions: Visa application form data
 * - crmLeads: Company contacts, emails, phones
 * - documentRequests: Document request submissions
 */

import { getAdminDb, getAdminStorage } from '@/lib/firebaseAdmin';

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
  contactPerson: '[RADERAT]',
  name: '[RADERAT]',
  company: '[RADERAT]',
  message: '[RADERAT]',
};

export interface GdprStats {
  ordersToAnonymize: number;
  ordersWithFilesToDelete: number;
  totalOrders: number;
  oldestOrderDate: string | null;
  contactMessagesToDelete: number;
  customerEmailsToDelete: number;
}

export interface GdprResult {
  success: boolean;
  anonymizedOrders: number;
  deletedFiles: number;
  deletedContactMessages: number;
  deletedCustomerEmails: number;
  anonymizedCollections: string[];
  errors: string[];
}

// ─── Audit Logging ──────────────────────────────────────────────────────────

export interface GdprAuditEntry {
  action: string;
  performedBy: string;
  performedAt: string;
  targetType: string;
  targetId?: string;
  targetEmail?: string;
  details: Record<string, any>;
}

/**
 * Log a GDPR action to the audit trail (Art. 5(2) accountability)
 */
export async function logGdprAction(entry: GdprAuditEntry): Promise<void> {
  try {
    await getAdminDb().collection('gdprAuditLog').add({
      ...entry,
      performedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('GDPR Audit: Failed to write audit log', e);
  }
}

/**
 * Get GDPR audit log entries
 */
export async function getGdprAuditLog(limit: number = 50): Promise<GdprAuditEntry[]> {
  const snapshot = await getAdminDb()
    .collection('gdprAuditLog')
    .orderBy('performedAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseDate(value: any): Date | null {
  if (!value) return null;
  const d = value?.toDate?.() || new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

// ─── Statistics ─────────────────────────────────────────────────────────────

/**
 * Get statistics about orders that need GDPR processing
 */
export async function getGdprStats(anonymizeAfterYears: number = 7, deleteFilesAfterDays: number = 90): Promise<GdprStats> {
  const db = getAdminDb();
  const ordersRef = db.collection('orders');
  const allOrdersSnapshot = await ordersRef.get();

  const now = new Date();
  const anonymizeCutoff = new Date(now.getFullYear() - anonymizeAfterYears, now.getMonth(), now.getDate());
  const fileDeleteCutoff = new Date(now.getTime() - (deleteFilesAfterDays * 24 * 60 * 60 * 1000));
  // Contact messages and customer emails: delete after 2 years (no legal retention requirement)
  const contactDeleteCutoff = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());

  let ordersToAnonymize = 0;
  let ordersWithFilesToDelete = 0;
  let oldestOrderDate: Date | null = null as Date | null;

  allOrdersSnapshot.forEach((doc) => {
    try {
      const data = doc.data();
      const createdAt = parseDate(data.createdAt);
      if (!createdAt) return;

      if (createdAt < anonymizeCutoff && !data.gdprAnonymized) {
        ordersToAnonymize++;
      }

      if (createdAt < fileDeleteCutoff && !data.gdprFilesDeleted &&
          (data.hasUploadedFiles || data.hasAdminFiles || data.hasSupplementaryFiles)) {
        ordersWithFilesToDelete++;
      }

      if (!oldestOrderDate || createdAt < oldestOrderDate) {
        oldestOrderDate = createdAt;
      }
    } catch (e) {
      console.warn('GDPR: Error processing order', doc.id, e);
    }
  });

  // Count contact messages older than 2 years
  let contactMessagesToDelete = 0;
  try {
    const contactSnapshot = await db.collection('contactMessages').get();
    contactSnapshot.forEach((doc) => {
      const createdAt = parseDate(doc.data().createdAt);
      if (createdAt && createdAt < contactDeleteCutoff && !doc.data().gdprDeleted) {
        contactMessagesToDelete++;
      }
    });
  } catch (e) {
    console.warn('GDPR: Error counting contactMessages', e);
  }

  // Count customer emails older than 2 years
  let customerEmailsToDelete = 0;
  try {
    const emailSnapshot = await db.collection('customerEmails').get();
    emailSnapshot.forEach((doc) => {
      const createdAt = parseDate(doc.data().createdAt);
      if (createdAt && createdAt < contactDeleteCutoff && !doc.data().gdprDeleted) {
        customerEmailsToDelete++;
      }
    });
  } catch (e) {
    console.warn('GDPR: Error counting customerEmails', e);
  }

  return {
    ordersToAnonymize,
    ordersWithFilesToDelete,
    totalOrders: allOrdersSnapshot.size,
    oldestOrderDate: oldestOrderDate ? oldestOrderDate.toISOString() : null,
    contactMessagesToDelete,
    customerEmailsToDelete,
  };
}

// ─── Preview ────────────────────────────────────────────────────────────────

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
  const ordersRef = getAdminDb().collection('orders');
  const allOrdersSnapshot = await ordersRef.get();

  const now = new Date();
  const anonymizeCutoff = new Date(now.getFullYear() - anonymizeAfterYears, now.getMonth(), now.getDate());
  const fileDeleteCutoff = new Date(now.getTime() - (deleteFilesAfterDays * 24 * 60 * 60 * 1000));

  const toAnonymize: Array<{ id: string; orderNumber: string; createdAt: string; customerName: string }> = [];
  const toDeleteFiles: Array<{ id: string; orderNumber: string; createdAt: string; customerName: string }> = [];

  allOrdersSnapshot.forEach((docSnap) => {
    try {
      const data = docSnap.data();
      const createdAt = parseDate(data.createdAt);
      if (!createdAt) return;

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

      if (createdAt < fileDeleteCutoff && !data.gdprFilesDeleted &&
          (data.hasUploadedFiles || data.hasAdminFiles || data.hasSupplementaryFiles) &&
          toDeleteFiles.length < limit) {
        toDeleteFiles.push(orderInfo);
      }
    } catch (e) {
      console.warn('GDPR: Error processing order', docSnap.id, e);
    }
  });

  toAnonymize.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  toDeleteFiles.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return { toAnonymize, toDeleteFiles };
}

// ─── Order Anonymization ────────────────────────────────────────────────────

/**
 * Anonymize personal data in an order
 * Keeps: order number, amounts, document types, services, dates, org.nr, VAT
 * Removes: names, addresses, emails, phones
 *
 * Note: organizationNumber and vatNumber are NOT anonymized as they belong
 * to legal entities (companies), not natural persons, and are needed for
 * accounting under Bokföringslagen.
 */
export async function anonymizeOrder(orderId: string, performedBy: string = 'system'): Promise<{ success: boolean; error?: string }> {
  try {
    const orderRef = getAdminDb().collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      return { success: false, error: 'Order not found' };
    }

    await orderRef.update({
      // Anonymize customerInfo (personal data only)
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

      // Anonymize billingInfo (keep org.nr and VAT for accounting)
      'billingInfo.firstName': ANONYMIZED_DATA.firstName,
      'billingInfo.lastName': ANONYMIZED_DATA.lastName,
      'billingInfo.email': ANONYMIZED_DATA.email,
      'billingInfo.phone': ANONYMIZED_DATA.phone,
      'billingInfo.street': ANONYMIZED_DATA.street,
      'billingInfo.companyName': ANONYMIZED_DATA.companyName,
      'billingInfo.contactPerson': ANONYMIZED_DATA.contactPerson,
      // NOTE: billingInfo.organizationNumber and billingInfo.vatNumber are
      // intentionally NOT anonymized - they are company identifiers needed
      // for accounting compliance (Bokföringslagen 7:2).

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

    await logGdprAction({
      action: 'anonymize_order',
      performedBy,
      performedAt: '',
      targetType: 'order',
      targetId: orderId,
      details: { orderNumber: orderSnap.data()?.orderNumber },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ─── File Deletion from Firebase Storage ────────────────────────────────────

/**
 * Delete uploaded files from Firebase Storage and clear references in Firestore.
 * Storage paths follow the pattern: orders/{orderId}/admin-files/ and orders/{orderId}/supplementary/
 */
export async function deleteOrderFiles(orderId: string, performedBy: string = 'system'): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  try {
    const orderRef = getAdminDb().collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      return { success: false, deletedCount: 0, error: 'Order not found' };
    }

    const data = orderSnap.data()!;
    let deletedCount = 0;

    // Delete actual files from Firebase Storage
    try {
      const bucket = getAdminStorage().bucket();

      // Delete all files under orders/{orderId}/ prefix
      const [files] = await bucket.getFiles({ prefix: `orders/${orderId}/` });
      for (const file of files) {
        try {
          await file.delete();
          deletedCount++;
        } catch (e) {
          console.warn(`GDPR: Failed to delete storage file ${file.name}`, e);
        }
      }

      // Also try to delete individually referenced files that might be stored elsewhere
      const urlsToCheck = [
        ...(data.uploadedFileUrls || []),
        data.idDocumentUrl,
        data.registrationCertUrl,
        data.signingAuthorityIdUrl,
        ...(data.adminFiles || []).map((f: any) => f.url),
        ...(data.supplementaryFiles || []).map((f: any) => f.url),
      ].filter(Boolean);

      for (const url of urlsToCheck) {
        try {
          // Extract storage path from public URL
          const storagePath = extractStoragePathFromUrl(url, bucket.name);
          if (storagePath && !storagePath.startsWith(`orders/${orderId}/`)) {
            // Only delete if not already covered by the prefix deletion above
            const file = bucket.file(storagePath);
            const [exists] = await file.exists();
            if (exists) {
              await file.delete();
              deletedCount++;
            }
          }
        } catch (e) {
          // File might not exist or URL format is unexpected - continue
          console.warn(`GDPR: Could not delete file from URL: ${url}`, e);
        }
      }
    } catch (storageError) {
      console.warn('GDPR: Storage deletion error (files may not exist)', storageError);
    }

    // Clear file references in Firestore
    await orderRef.update({
      'gdprFilesDeleted': true,
      'gdprFilesDeletedAt': new Date().toISOString(),
      'hasUploadedFiles': false,
      'hasAdminFiles': false,
      'hasSupplementaryFiles': false,
      'uploadedFileUrls': [],
      'idDocumentUrl': null,
      'registrationCertUrl': null,
      'signingAuthorityIdUrl': null,
      'adminFiles': [],
      'supplementaryFiles': [],
    });

    await logGdprAction({
      action: 'delete_order_files',
      performedBy,
      performedAt: '',
      targetType: 'order',
      targetId: orderId,
      details: { orderNumber: data.orderNumber, filesDeleted: deletedCount },
    });

    return { success: true, deletedCount };
  } catch (error) {
    return {
      success: false,
      deletedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Extract Firebase Storage path from a public URL
 */
function extractStoragePathFromUrl(url: string, bucketName: string): string | null {
  try {
    // Format: https://storage.googleapis.com/{bucket}/{path}
    const prefix = `https://storage.googleapis.com/${bucketName}/`;
    if (url.startsWith(prefix)) {
      return decodeURIComponent(url.slice(prefix.length));
    }
    // Format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encoded_path}?...
    const firebaseMatch = url.match(/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\/([^?]+)/);
    if (firebaseMatch) {
      return decodeURIComponent(firebaseMatch[1]);
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Cleanup of Other Collections ───────────────────────────────────────────

/**
 * Delete old contact messages (no legal retention requirement)
 * Retention: 2 years
 */
async function cleanupContactMessages(cutoffDate: Date, dryRun: boolean, performedBy: string): Promise<{ deleted: number; errors: string[] }> {
  const errors: string[] = [];
  let deleted = 0;

  try {
    const snapshot = await getAdminDb().collection('contactMessages').get();

    for (const doc of snapshot.docs) {
      const createdAt = parseDate(doc.data().createdAt);
      if (!createdAt || createdAt >= cutoffDate || doc.data().gdprDeleted) continue;

      if (!dryRun) {
        try {
          // Anonymize rather than delete to keep count/statistics
          await doc.ref.update({
            name: ANONYMIZED_DATA.name,
            email: ANONYMIZED_DATA.email,
            phone: ANONYMIZED_DATA.phone,
            message: ANONYMIZED_DATA.message,
            subject: doc.data().subject, // keep subject for statistics
            gdprDeleted: true,
            gdprDeletedAt: new Date().toISOString(),
          });
          deleted++;
        } catch (e) {
          errors.push(`Failed to clean contactMessage ${doc.id}: ${(e as Error).message}`);
        }
      } else {
        deleted++;
      }
    }
  } catch (e) {
    errors.push(`Failed to read contactMessages: ${(e as Error).message}`);
  }

  if (!dryRun && deleted > 0) {
    await logGdprAction({
      action: 'cleanup_contact_messages',
      performedBy,
      performedAt: '',
      targetType: 'contactMessages',
      details: { deletedCount: deleted },
    });
  }

  return { deleted, errors };
}

/**
 * Delete old customer emails (no legal retention requirement)
 * Retention: 2 years
 */
async function cleanupCustomerEmails(cutoffDate: Date, dryRun: boolean, performedBy: string): Promise<{ deleted: number; errors: string[] }> {
  const errors: string[] = [];
  let deleted = 0;

  try {
    const snapshot = await getAdminDb().collection('customerEmails').get();

    for (const doc of snapshot.docs) {
      const createdAt = parseDate(doc.data().createdAt);
      if (!createdAt || createdAt >= cutoffDate || doc.data().gdprDeleted) continue;

      if (!dryRun) {
        try {
          await doc.ref.update({
            name: ANONYMIZED_DATA.name,
            email: ANONYMIZED_DATA.email,
            phone: ANONYMIZED_DATA.phone,
            message: ANONYMIZED_DATA.message,
            gdprDeleted: true,
            gdprDeletedAt: new Date().toISOString(),
          });
          deleted++;
        } catch (e) {
          errors.push(`Failed to clean customerEmail ${doc.id}: ${(e as Error).message}`);
        }
      } else {
        deleted++;
      }
    }
  } catch (e) {
    errors.push(`Failed to read customerEmails: ${(e as Error).message}`);
  }

  if (!dryRun && deleted > 0) {
    await logGdprAction({
      action: 'cleanup_customer_emails',
      performedBy,
      performedAt: '',
      targetType: 'customerEmails',
      details: { deletedCount: deleted },
    });
  }

  return { deleted, errors };
}

/**
 * Delete old visa form submissions
 * Retention: 2 years (no legal retention requirement beyond order data)
 */
async function cleanupVisaFormSubmissions(cutoffDate: Date, dryRun: boolean, performedBy: string): Promise<{ deleted: number; errors: string[] }> {
  const errors: string[] = [];
  let deleted = 0;

  try {
    const snapshot = await getAdminDb().collection('visaFormSubmissions').get();

    for (const doc of snapshot.docs) {
      const createdAt = parseDate(doc.data().createdAt || doc.data().submittedAt);
      if (!createdAt || createdAt >= cutoffDate || doc.data().gdprDeleted) continue;

      if (!dryRun) {
        try {
          // Delete the entire document as it contains detailed personal data
          // and has no accounting retention requirement
          await doc.ref.delete();
          deleted++;
        } catch (e) {
          errors.push(`Failed to delete visaFormSubmission ${doc.id}: ${(e as Error).message}`);
        }
      } else {
        deleted++;
      }
    }
  } catch (e) {
    errors.push(`Failed to read visaFormSubmissions: ${(e as Error).message}`);
  }

  if (!dryRun && deleted > 0) {
    await logGdprAction({
      action: 'cleanup_visa_form_submissions',
      performedBy,
      performedAt: '',
      targetType: 'visaFormSubmissions',
      details: { deletedCount: deleted },
    });
  }

  return { deleted, errors };
}

/**
 * Cleanup document requests - anonymize old ones
 * Retention: 2 years
 */
async function cleanupDocumentRequests(cutoffDate: Date, dryRun: boolean, performedBy: string): Promise<{ deleted: number; errors: string[] }> {
  const errors: string[] = [];
  let deleted = 0;

  try {
    const snapshot = await getAdminDb().collection('documentRequests').get();

    for (const doc of snapshot.docs) {
      const createdAt = parseDate(doc.data().createdAt);
      if (!createdAt || createdAt >= cutoffDate || doc.data().gdprDeleted) continue;

      if (!dryRun) {
        try {
          await doc.ref.update({
            customerName: ANONYMIZED_DATA.name,
            customerEmail: ANONYMIZED_DATA.email,
            message: ANONYMIZED_DATA.message,
            gdprDeleted: true,
            gdprDeletedAt: new Date().toISOString(),
          });
          deleted++;
        } catch (e) {
          errors.push(`Failed to clean documentRequest ${doc.id}: ${(e as Error).message}`);
        }
      } else {
        deleted++;
      }
    }
  } catch (e) {
    errors.push(`Failed to read documentRequests: ${(e as Error).message}`);
  }

  if (!dryRun && deleted > 0) {
    await logGdprAction({
      action: 'cleanup_document_requests',
      performedBy,
      performedAt: '',
      targetType: 'documentRequests',
      details: { deletedCount: deleted },
    });
  }

  return { deleted, errors };
}

// ─── Full Cleanup ───────────────────────────────────────────────────────────

/**
 * Run full GDPR cleanup process across all collections
 */
export async function runGdprCleanup(
  anonymizeAfterYears: number = 7,
  deleteFilesAfterDays: number = 90,
  dryRun: boolean = false,
  performedBy: string = 'system'
): Promise<GdprResult> {
  const errors: string[] = [];
  let anonymizedOrders = 0;
  let deletedFiles = 0;
  let deletedContactMessages = 0;
  let deletedCustomerEmails = 0;
  const anonymizedCollections: string[] = [];

  const { toAnonymize, toDeleteFiles } = await getOrdersForGdprProcessing(
    anonymizeAfterYears,
    deleteFilesAfterDays
  );

  if (dryRun) {
    // Also calculate other collections for dry run
    const now = new Date();
    const contactCutoff = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());

    const [contactResult, emailResult, visaResult, docResult] = await Promise.all([
      cleanupContactMessages(contactCutoff, true, performedBy),
      cleanupCustomerEmails(contactCutoff, true, performedBy),
      cleanupVisaFormSubmissions(contactCutoff, true, performedBy),
      cleanupDocumentRequests(contactCutoff, true, performedBy),
    ]);

    return {
      success: true,
      anonymizedOrders: toAnonymize.length,
      deletedFiles: toDeleteFiles.length,
      deletedContactMessages: contactResult.deleted,
      deletedCustomerEmails: emailResult.deleted,
      anonymizedCollections: [
        contactResult.deleted > 0 ? `contactMessages (${contactResult.deleted})` : '',
        emailResult.deleted > 0 ? `customerEmails (${emailResult.deleted})` : '',
        visaResult.deleted > 0 ? `visaFormSubmissions (${visaResult.deleted})` : '',
        docResult.deleted > 0 ? `documentRequests (${docResult.deleted})` : '',
      ].filter(Boolean),
      errors: ['DRY RUN - No changes made'],
    };
  }

  // Log the start of cleanup
  await logGdprAction({
    action: 'cleanup_started',
    performedBy,
    performedAt: '',
    targetType: 'system',
    details: { anonymizeAfterYears, deleteFilesAfterDays, dryRun },
  });

  // Anonymize old orders
  for (const order of toAnonymize) {
    const result = await anonymizeOrder(order.id, performedBy);
    if (result.success) {
      anonymizedOrders++;
    } else {
      errors.push(`Failed to anonymize order ${order.orderNumber}: ${result.error}`);
    }
  }

  // Delete old files
  for (const order of toDeleteFiles) {
    const result = await deleteOrderFiles(order.id, performedBy);
    if (result.success) {
      deletedFiles += result.deletedCount;
    } else {
      errors.push(`Failed to delete files for order ${order.orderNumber}: ${result.error}`);
    }
  }

  // Clean up other collections (2-year retention)
  const now = new Date();
  const contactCutoff = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());

  const [contactResult, emailResult, visaResult, docResult] = await Promise.all([
    cleanupContactMessages(contactCutoff, false, performedBy),
    cleanupCustomerEmails(contactCutoff, false, performedBy),
    cleanupVisaFormSubmissions(contactCutoff, false, performedBy),
    cleanupDocumentRequests(contactCutoff, false, performedBy),
  ]);

  deletedContactMessages = contactResult.deleted;
  deletedCustomerEmails = emailResult.deleted;
  errors.push(...contactResult.errors, ...emailResult.errors, ...visaResult.errors, ...docResult.errors);

  if (contactResult.deleted > 0) anonymizedCollections.push(`contactMessages (${contactResult.deleted})`);
  if (emailResult.deleted > 0) anonymizedCollections.push(`customerEmails (${emailResult.deleted})`);
  if (visaResult.deleted > 0) anonymizedCollections.push(`visaFormSubmissions (${visaResult.deleted})`);
  if (docResult.deleted > 0) anonymizedCollections.push(`documentRequests (${docResult.deleted})`);

  // Log completion
  await logGdprAction({
    action: 'cleanup_completed',
    performedBy,
    performedAt: '',
    targetType: 'system',
    details: {
      anonymizedOrders,
      deletedFiles,
      deletedContactMessages,
      deletedCustomerEmails,
      anonymizedCollections,
      errorCount: errors.length,
    },
  });

  return {
    success: errors.length === 0,
    anonymizedOrders,
    deletedFiles,
    deletedContactMessages,
    deletedCustomerEmails,
    anonymizedCollections,
    errors,
  };
}

// ─── Customer Data Export (Art. 15/20) ──────────────────────────────────────

/**
 * Export all data for a customer across all collections (GDPR right to data portability)
 */
export async function exportCustomerData(email: string): Promise<{
  success: boolean;
  data?: {
    orders: any[];
    contactMessages: any[];
    customerEmails: any[];
    visaFormSubmissions: any[];
    documentRequests: any[];
  };
  error?: string;
}> {
  try {
    const db = getAdminDb();

    // Search across all collections that may contain this email
    const [ordersSnap, contactSnap, emailSnap, visaSnap, docReqSnap] = await Promise.all([
      db.collection('orders').where('customerInfo.email', '==', email).get(),
      db.collection('contactMessages').where('email', '==', email).get(),
      db.collection('customerEmails').where('email', '==', email).get(),
      db.collection('visaFormSubmissions').where('email', '==', email).get()
        .catch(() => ({ docs: [] })), // Collection might not exist
      db.collection('documentRequests').where('customerEmail', '==', email).get()
        .catch(() => ({ docs: [] })),
    ]);

    const cleanDoc = (doc: any) => {
      const data = doc.data();
      // Remove internal GDPR tracking fields from export
      const { gdprAnonymized, gdprAnonymizedAt, gdprFilesDeleted, gdprFilesDeletedAt, gdprDeleted, gdprDeletedAt, ...rest } = data;
      return { documentId: doc.id, ...rest };
    };

    const result = {
      orders: ordersSnap.docs.map(cleanDoc),
      contactMessages: contactSnap.docs.map(cleanDoc),
      customerEmails: emailSnap.docs.map(cleanDoc),
      visaFormSubmissions: visaSnap.docs.map(cleanDoc),
      documentRequests: docReqSnap.docs.map(cleanDoc),
    };

    await logGdprAction({
      action: 'export_customer_data',
      performedBy: 'admin',
      performedAt: '',
      targetType: 'customer',
      targetEmail: email,
      details: {
        ordersFound: result.orders.length,
        contactMessagesFound: result.contactMessages.length,
        customerEmailsFound: result.customerEmails.length,
        visaSubmissionsFound: result.visaFormSubmissions.length,
        documentRequestsFound: result.documentRequests.length,
      },
    });

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ─── Customer Data Deletion (Art. 17) ───────────────────────────────────────

/**
 * Delete all data for a customer across all collections (GDPR right to erasure)
 * Orders are anonymized (not deleted) to preserve accounting records.
 * Other collections are fully deleted as they have no retention requirements.
 */
export async function deleteCustomerData(email: string, performedBy: string = 'admin'): Promise<{
  success: boolean;
  deletedOrders: number;
  deletedContactMessages: number;
  deletedCustomerEmails: number;
  deletedVisaSubmissions: number;
  deletedDocumentRequests: number;
  error?: string;
}> {
  const result = {
    success: true,
    deletedOrders: 0,
    deletedContactMessages: 0,
    deletedCustomerEmails: 0,
    deletedVisaSubmissions: 0,
    deletedDocumentRequests: 0,
    error: undefined as string | undefined,
  };

  try {
    const db = getAdminDb();

    // 1. Anonymize orders (keep for accounting, but strip personal data)
    const ordersSnap = await db.collection('orders').where('customerInfo.email', '==', email).get();
    for (const docSnap of ordersSnap.docs) {
      await deleteOrderFiles(docSnap.id, performedBy);
      const anonymizeResult = await anonymizeOrder(docSnap.id, performedBy);
      if (anonymizeResult.success) {
        result.deletedOrders++;
      }
    }

    // 2. Delete contact messages (no retention requirement)
    const contactSnap = await db.collection('contactMessages').where('email', '==', email).get();
    for (const doc of contactSnap.docs) {
      await doc.ref.delete();
      result.deletedContactMessages++;
    }

    // 3. Delete customer emails
    const emailSnap = await db.collection('customerEmails').where('email', '==', email).get();
    for (const doc of emailSnap.docs) {
      await doc.ref.delete();
      result.deletedCustomerEmails++;
    }

    // 4. Delete visa form submissions
    try {
      const visaSnap = await db.collection('visaFormSubmissions').where('email', '==', email).get();
      for (const doc of visaSnap.docs) {
        await doc.ref.delete();
        result.deletedVisaSubmissions++;
      }
    } catch (e) {
      // Collection might not exist
    }

    // 5. Delete document requests
    try {
      const docReqSnap = await db.collection('documentRequests').where('customerEmail', '==', email).get();
      for (const doc of docReqSnap.docs) {
        await doc.ref.delete();
        result.deletedDocumentRequests++;
      }
    } catch (e) {
      // Collection might not exist
    }

    await logGdprAction({
      action: 'delete_customer_data',
      performedBy,
      performedAt: '',
      targetType: 'customer',
      targetEmail: email,
      details: {
        ordersAnonymized: result.deletedOrders,
        contactMessagesDeleted: result.deletedContactMessages,
        customerEmailsDeleted: result.deletedCustomerEmails,
        visaSubmissionsDeleted: result.deletedVisaSubmissions,
        documentRequestsDeleted: result.deletedDocumentRequests,
      },
    });

    return result;
  } catch (error) {
    return {
      ...result,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ─── GDPR Request Tracking (Art. 12(3) - 30 day deadline) ──────────────────

export interface GdprRequest {
  id?: string;
  email: string;
  type: 'access' | 'erasure' | 'rectification' | 'portability' | 'objection';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  createdAt: string;
  deadline: string;
  completedAt?: string;
  notes?: string;
  createdBy: string;
}

/**
 * Create a GDPR data subject request with a 30-day deadline (Art. 12(3))
 */
export async function createGdprRequest(
  email: string,
  type: GdprRequest['type'],
  createdBy: string,
  notes?: string,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const now = new Date();
    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + 30); // GDPR Art. 12(3): 30 days

    const request: Omit<GdprRequest, 'id'> = {
      email,
      type,
      status: 'pending',
      createdAt: now.toISOString(),
      deadline: deadline.toISOString(),
      notes: notes || '',
      createdBy,
    };

    const docRef = await getAdminDb().collection('gdprRequests').add(request);

    await logGdprAction({
      action: 'request_created',
      performedBy: createdBy,
      performedAt: '',
      targetType: 'gdprRequest',
      targetId: docRef.id,
      targetEmail: email,
      details: { type, deadline: deadline.toISOString() },
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get all GDPR requests, optionally filtered by status
 */
export async function getGdprRequests(status?: GdprRequest['status']): Promise<GdprRequest[]> {
  let query = getAdminDb().collection('gdprRequests').orderBy('createdAt', 'desc') as any;

  if (status) {
    query = query.where('status', '==', status);
  }

  const snapshot = await query.limit(100).get();
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as GdprRequest));
}

/**
 * Update a GDPR request status
 */
export async function updateGdprRequest(
  requestId: string,
  status: GdprRequest['status'],
  performedBy: string,
  notes?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const update: Record<string, any> = { status };
    if (status === 'completed') {
      update.completedAt = new Date().toISOString();
    }
    if (notes !== undefined) {
      update.notes = notes;
    }

    await getAdminDb().collection('gdprRequests').doc(requestId).update(update);

    await logGdprAction({
      action: 'request_updated',
      performedBy,
      performedAt: '',
      targetType: 'gdprRequest',
      targetId: requestId,
      details: { newStatus: status },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
