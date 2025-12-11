/**
 * DHL API Connection Test Route
 * 
 * Tests the connection to DHL Express API using address validation.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

// DHL API Configuration
const DHL_CONFIG = {
  apiKey: process.env.DHL_API_KEY || '',
  apiSecret: process.env.DHL_API_SECRET || '',
  accountNumber: process.env.DHL_ACCOUNT_NUMBER || '',
  useSandbox: process.env.DHL_USE_SANDBOX !== 'false',
};

const getBaseUrl = () => 
  DHL_CONFIG.useSandbox 
    ? 'https://express.api.dhl.com/mydhlapi/test'
    : 'https://express.api.dhl.com/mydhlapi';

const getAuthHeader = () => {
  const credentials = `${DHL_CONFIG.apiKey}:${DHL_CONFIG.apiSecret}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Allow GET and POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check configuration
  const configStatus = {
    hasApiKey: !!DHL_CONFIG.apiKey,
    hasApiSecret: !!DHL_CONFIG.apiSecret,
    hasAccountNumber: !!DHL_CONFIG.accountNumber,
    environment: DHL_CONFIG.useSandbox ? 'sandbox' : 'production',
    baseUrl: getBaseUrl()
  };

  if (!DHL_CONFIG.apiKey || !DHL_CONFIG.apiSecret) {
    return res.status(200).json({
      success: false,
      message: 'DHL API credentials not configured',
      config: configStatus,
      instructions: [
        'Add the following to your .env.local file:',
        'DHL_API_KEY=your_api_key',
        'DHL_API_SECRET=your_api_secret',
        'DHL_ACCOUNT_NUMBER=your_account_number',
        'DHL_USE_SANDBOX=true'
      ]
    });
  }

  try {
    // Test with address validation endpoint
    const testUrl = `${getBaseUrl()}/address-validate?type=pickup&countryCode=SE&postalCode=12162&cityName=Johanneshov`;
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader(),
        'Accept': 'application/json'
      }
    });

    const responseData = await response.json().catch(() => ({}));

    if (response.ok) {
      return res.status(200).json({
        success: true,
        message: 'DHL API connection successful!',
        config: configStatus,
        testResult: {
          endpoint: 'address-validate',
          status: response.status,
          data: responseData
        }
      });
    } else {
      return res.status(200).json({
        success: false,
        message: `DHL API returned error: ${response.status}`,
        config: configStatus,
        error: {
          status: response.status,
          details: responseData.detail || responseData.title || 'Unknown error',
          fullResponse: responseData
        }
      });
    }

  } catch (error: any) {
    return res.status(200).json({
      success: false,
      message: `Connection failed: ${error.message}`,
      config: configStatus,
      error: {
        type: 'NetworkError',
        message: error.message
      }
    });
  }
}
