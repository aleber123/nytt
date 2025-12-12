/**
 * GDPR Admin API
 * Handles GDPR-related operations like anonymization and data export
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  getGdprStats, 
  getOrdersForGdprProcessing, 
  runGdprCleanup,
  anonymizeOrder,
  deleteOrderFiles,
  exportCustomerData,
  deleteCustomerData
} from '@/services/gdprService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow authenticated admin requests
  // In production, add proper authentication check here
  
  const { action } = req.query;
  
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
        const result = await runGdprCleanup(anonymizeYears, deleteFilesDays, dryRun);
        return res.status(200).json(result);
        
      case 'anonymize-order':
        // POST /api/admin/gdpr?action=anonymize-order
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        const { orderId } = req.body;
        if (!orderId) {
          return res.status(400).json({ error: 'orderId is required' });
        }
        const anonymizeResult = await anonymizeOrder(orderId);
        return res.status(200).json(anonymizeResult);
        
      case 'delete-files':
        // POST /api/admin/gdpr?action=delete-files
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        const { orderId: fileOrderId } = req.body;
        if (!fileOrderId) {
          return res.status(400).json({ error: 'orderId is required' });
        }
        const deleteResult = await deleteOrderFiles(fileOrderId);
        return res.status(200).json(deleteResult);
        
      case 'export-customer':
        // GET /api/admin/gdpr?action=export-customer&email=xxx
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        const { email } = req.query;
        if (!email || typeof email !== 'string') {
          return res.status(400).json({ error: 'email is required' });
        }
        const exportResult = await exportCustomerData(email);
        return res.status(200).json(exportResult);
        
      case 'delete-customer':
        // POST /api/admin/gdpr?action=delete-customer
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        const { email: deleteEmail } = req.body;
        if (!deleteEmail) {
          return res.status(400).json({ error: 'email is required' });
        }
        const deleteCustomerResult = await deleteCustomerData(deleteEmail);
        return res.status(200).json(deleteCustomerResult);
        
      default:
        return res.status(400).json({ 
          error: 'Invalid action',
          validActions: ['stats', 'preview', 'cleanup', 'anonymize-order', 'delete-files', 'export-customer', 'delete-customer']
        });
    }
  } catch (error) {
    console.error('GDPR API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
