/**
 * GDPR Admin API
 * Handles GDPR-related operations like anonymization, data export, and audit logging
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  getGdprStats,
  getOrdersForGdprProcessing,
  runGdprCleanup,
  anonymizeOrder,
  deleteOrderFiles,
  exportCustomerData,
  deleteCustomerData,
  getGdprAuditLog,
  createGdprRequest,
  getGdprRequests,
  updateGdprRequest,
} from '@/services/gdprService';
import { verifyAdmin, requirePermission } from '@/lib/adminAuth';
import { isValidDocId, isValidEmail } from '@/lib/sanitize';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await verifyAdmin(req, res, 'gdpr');
  if (!admin) return;
  if (!requirePermission(admin, res, 'canManageGdpr')) return;

  const { action } = req.query;
  const performedBy = admin.email || admin.uid;

  try {
    switch (action) {
      case 'stats':
        // GET /api/admin/gdpr?action=stats
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        const stats = await getGdprStats();
        return res.status(200).json(stats);

      case 'preview':
        // GET /api/admin/gdpr?action=preview
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        const preview = await getOrdersForGdprProcessing();
        return res.status(200).json(preview);

      case 'cleanup':
        // POST /api/admin/gdpr?action=cleanup
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        const { dryRun = false, anonymizeYears = 7, deleteFilesDays = 90 } = req.body;
        const safeAnonymizeYears = Math.max(1, Math.min(50, Number(anonymizeYears) || 7));
        const safeDeleteFilesDays = Math.max(1, Math.min(3650, Number(deleteFilesDays) || 90));
        const result = await runGdprCleanup(safeAnonymizeYears, safeDeleteFilesDays, !!dryRun, performedBy);
        return res.status(200).json(result);

      case 'anonymize-order':
        // POST /api/admin/gdpr?action=anonymize-order
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        const { orderId } = req.body;
        if (!isValidDocId(orderId)) {
          return res.status(400).json({ error: 'Invalid or missing orderId' });
        }
        const anonymizeResult = await anonymizeOrder(orderId, performedBy);
        return res.status(200).json(anonymizeResult);

      case 'delete-files':
        // POST /api/admin/gdpr?action=delete-files
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        const { orderId: fileOrderId } = req.body;
        if (!isValidDocId(fileOrderId)) {
          return res.status(400).json({ error: 'Invalid or missing orderId' });
        }
        const deleteResult = await deleteOrderFiles(fileOrderId, performedBy);
        return res.status(200).json(deleteResult);

      case 'export-customer':
        // GET /api/admin/gdpr?action=export-customer&email=xxx
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        const { email } = req.query;
        if (!isValidEmail(email)) {
          return res.status(400).json({ error: 'Valid email is required' });
        }
        const exportResult = await exportCustomerData(email);
        return res.status(200).json(exportResult);

      case 'delete-customer':
        // POST /api/admin/gdpr?action=delete-customer
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        const { email: deleteEmail } = req.body;
        if (!isValidEmail(deleteEmail)) {
          return res.status(400).json({ error: 'Valid email is required' });
        }
        const deleteCustomerResult = await deleteCustomerData(deleteEmail, performedBy);
        return res.status(200).json(deleteCustomerResult);

      case 'audit-log':
        // GET /api/admin/gdpr?action=audit-log
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
        const auditLog = await getGdprAuditLog(limit);
        return res.status(200).json({ entries: auditLog });

      case 'create-request':
        // POST /api/admin/gdpr?action=create-request
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        const { email: reqEmail, type: reqType, notes: reqNotes } = req.body;
        if (!isValidEmail(reqEmail)) {
          return res.status(400).json({ error: 'Valid email is required' });
        }
        if (!['access', 'erasure', 'rectification', 'portability', 'objection'].includes(reqType)) {
          return res.status(400).json({ error: 'Invalid request type' });
        }
        const createResult = await createGdprRequest(reqEmail, reqType, performedBy, reqNotes);
        return res.status(200).json(createResult);

      case 'requests':
        // GET /api/admin/gdpr?action=requests&status=pending
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        const statusFilter = req.query.status as string | undefined;
        const validStatuses = ['pending', 'in_progress', 'completed', 'rejected'];
        const requests = await getGdprRequests(
          statusFilter && validStatuses.includes(statusFilter) ? statusFilter as any : undefined
        );
        return res.status(200).json({ requests });

      case 'update-request':
        // POST /api/admin/gdpr?action=update-request
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        const { requestId: updReqId, status: updStatus, notes: updNotes } = req.body;
        if (!isValidDocId(updReqId)) {
          return res.status(400).json({ error: 'Invalid or missing requestId' });
        }
        if (!['pending', 'in_progress', 'completed', 'rejected'].includes(updStatus)) {
          return res.status(400).json({ error: 'Invalid status' });
        }
        const updateResult = await updateGdprRequest(updReqId, updStatus, performedBy, updNotes);
        return res.status(200).json(updateResult);

      default:
        return res.status(400).json({
          error: 'Invalid action',
          validActions: ['stats', 'preview', 'cleanup', 'anonymize-order', 'delete-files', 'export-customer', 'delete-customer', 'audit-log', 'create-request', 'requests', 'update-request']
        });
    }
  } catch (error) {
    console.error('GDPR API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('GDPR API Stack:', errorStack);
    return res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
    });
  }
}
