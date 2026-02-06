/**
 * Input Sanitization & Validation Helpers
 * 
 * Provides functions to validate and sanitize user input
 * before it reaches Firestore or other sensitive operations.
 */

/**
 * Sanitize a string by trimming whitespace and removing null bytes.
 */
export function sanitizeString(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\0/g, '');
}

/**
 * Validate that a string matches expected format for a Firestore document ID.
 * Firestore IDs must not contain '/' and should be reasonable length.
 */
export function isValidDocId(id: unknown): id is string {
  if (typeof id !== 'string') return false;
  if (id.length === 0 || id.length > 200) return false;
  if (id.includes('/') || id.includes('..')) return false;
  return true;
}

/**
 * Validate that a value is a valid email address (basic check).
 */
export function isValidEmail(email: unknown): email is string {
  if (typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 320;
}

/**
 * Validate that a URL is a valid HTTPS URL (for file URLs).
 */
export function isValidUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * List of Firestore fields that should NEVER be writable via the admin update API.
 * These are either system-managed or security-sensitive.
 */
const BLOCKED_UPDATE_FIELDS = [
  'id',
  'orderNumber',
  'createdAt',
  'userId',
  'customerInfo.email', // Should not be changed via generic update
];

/**
 * List of top-level fields that are allowed in order updates.
 * Any field not in this list will be stripped.
 */
const ALLOWED_ORDER_FIELDS = [
  'status',
  'processingSteps',
  'adminNotes',
  'internalNotes',
  'adminPrice',
  'hasUnconfirmedPrices',
  'confirmedEmbassyPrice',
  'pendingEmbassyPrice',
  'pendingTotalPrice',
  'embassyPriceConfirmationSent',
  'embassyPriceConfirmed',
  'embassyPriceDeclined',
  'returnAddressConfirmationRequired',
  'returnAddressConfirmed',
  'returnAddressConfirmedAt',
  'returnAddressConfirmationSent',
  'returnAddressConfirmationSentAt',
  'returnTrackingNumber',
  'returnTrackingUrl',
  'pickupTrackingNumber',
  'pickupLabelFile',
  'country',
  'documentType',
  'quantity',
  'documentSource',
  'invoiceReference',
  'customerInfo',
  'adminFiles',
  'hasAdminFiles',
  'lastAdminFileUpload',
  'lastFileSentToCustomer',
  'totalPrice',
  'pricingBreakdown',
  'services',
  'returnService',
  'returnAddress',
  'linkedOrders',
  'additionalNotes',
  'updatedAt',
  'supplementaryViewedBy',
  // Visa-specific
  'visaProduct',
  'destinationCountry',
  'destinationCountryCode',
  'nationality',
  'nationalityCode',
  'departureDate',
  'returnDate',
  'passportNeededBy',
];

/**
 * Sanitize an order updates object by:
 * 1. Removing blocked fields
 * 2. Only allowing known fields
 * 3. Stripping any fields with '__proto__' or 'constructor' keys (prototype pollution)
 */
export function sanitizeOrderUpdates(updates: Record<string, any>): Record<string, any> {
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    return {};
  }

  const sanitized: Record<string, any> = {};

  for (const key of Object.keys(updates)) {
    // Block prototype pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }

    // Block system fields
    if (BLOCKED_UPDATE_FIELDS.includes(key)) {
      continue;
    }

    // Allow known fields, or dot-notation fields that start with an allowed prefix
    const topLevelKey = key.split('.')[0];
    if (ALLOWED_ORDER_FIELDS.includes(topLevelKey)) {
      sanitized[key] = updates[key];
    }
  }

  return sanitized;
}

/**
 * Allowed MIME types for admin file uploads.
 */
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/zip',
  'application/x-zip-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB per file
const MAX_FILES_PER_UPLOAD = 10;

/**
 * Validate a file upload payload.
 * Returns an error string if invalid, or null if valid.
 */
export function validateFileUpload(files: any[]): string | null {
  if (!Array.isArray(files)) {
    return 'Files must be an array';
  }

  if (files.length === 0) {
    return 'No files to upload';
  }

  if (files.length > MAX_FILES_PER_UPLOAD) {
    return `Maximum ${MAX_FILES_PER_UPLOAD} files per upload`;
  }

  for (const file of files) {
    if (!file.name || typeof file.name !== 'string') {
      return 'Each file must have a name';
    }

    if (file.name.length > 255) {
      return 'File name too long (max 255 characters)';
    }

    if (!file.data || typeof file.data !== 'string') {
      return 'Each file must have base64 data';
    }

    if (typeof file.size === 'number' && file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" exceeds maximum size of 25 MB`;
    }

    if (file.type && !ALLOWED_FILE_TYPES.includes(file.type)) {
      return `File type "${file.type}" is not allowed`;
    }
  }

  return null;
}
