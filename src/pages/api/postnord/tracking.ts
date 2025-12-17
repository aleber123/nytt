/**
 * PostNord Tracking API Route
 * 
 * Fetches tracking information for PostNord shipments.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { rateLimiters, getClientIp } from '@/lib/rateLimit';

// PostNord API Configuration
const POSTNORD_CONFIG = {
  apiKey: process.env.POSTNORD_API_KEY || '',
  useSandbox: process.env.POSTNORD_USE_SANDBOX !== 'false',
};

const getBaseUrl = () => 
  POSTNORD_CONFIG.useSandbox 
    ? 'https://atapi2.postnord.com'
    : 'https://api2.postnord.com';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const clientIp = getClientIp(req);
  const rateLimit = rateLimiters.postnord(clientIp);
  
  if (!rateLimit.success) {
    return res.status(429).json({ 
      error: 'Too many requests',
      retryAfter: rateLimit.resetIn
    });
  }

  // Check if API credentials are configured
  if (!POSTNORD_CONFIG.apiKey) {
    return res.status(500).json({ 
      error: 'PostNord API credentials not configured',
      details: 'Please set POSTNORD_API_KEY environment variable'
    });
  }

  try {
    const { trackingNumber } = req.query;

    if (!trackingNumber || typeof trackingNumber !== 'string') {
      return res.status(400).json({ 
        error: 'Missing required parameter',
        details: 'trackingNumber is required'
      });
    }

    // Call PostNord Track & Trace API
    const apiUrl = `${getBaseUrl()}/rest/shipment/v5/trackandtrace/findByIdentifier.json?apikey=${POSTNORD_CONFIG.apiKey}&id=${encodeURIComponent(trackingNumber)}&locale=sv`;
    
    const postnordResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    const responseData = await postnordResponse.json().catch(() => ({}));

    if (!postnordResponse.ok) {
      return res.status(postnordResponse.status).json({
        error: 'PostNord API Error',
        status: postnordResponse.status,
        details: responseData.message || 'Unknown error',
        postnordResponse: responseData
      });
    }

    // Parse tracking events
    const shipment = responseData.TrackingInformationResponse?.shipments?.[0];
    
    if (!shipment) {
      return res.status(404).json({
        error: 'Shipment not found',
        trackingNumber
      });
    }

    // Format response
    const events = shipment.items?.[0]?.events?.map((event: any) => ({
      timestamp: event.eventTime,
      description: event.eventDescription,
      location: event.location?.displayName || event.location?.name,
      status: event.status
    })) || [];

    return res.status(200).json({
      success: true,
      trackingNumber,
      status: shipment.status || shipment.items?.[0]?.status,
      statusText: shipment.statusText?.header,
      estimatedDelivery: shipment.estimatedTimeOfArrival,
      events,
      rawResponse: responseData
    });

  } catch (error: any) {
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
