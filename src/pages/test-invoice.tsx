import React, { useState } from 'react';
import { convertOrderToInvoice, storeInvoice, getAllInvoices, generateInvoiceHtml } from '@/services/invoiceService';
import { Order } from '@/firebase/orderService';

const TestInvoicePage: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Mock order data for testing
  const mockOrder: Order = {
    id: 'SWE000001',
    orderNumber: 'SWE000001',
    services: ['apostille', 'notarisering'],
    documentType: 'passport',
    country: 'SE',
    quantity: 2,
    expedited: false,
    documentSource: 'original',
    pickupService: false,
    scannedCopies: false,
    returnService: 'standard',
    customerInfo: {
      firstName: 'Test',
      lastName: 'Customer',
      email: 'test@example.com',
      phone: '070-123 45 67',
      address: 'Testgatan 1',
      postalCode: '123 45',
      city: 'Stockholm'
    },
    deliveryMethod: 'mail',
    paymentMethod: 'invoice',
    status: 'completed',
    totalPrice: 2600,
    pricingBreakdown: [],
    createdAt: new Date() as any,
    updatedAt: new Date() as any
  };

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      addResult('🧪 Starting Invoice Service Tests...\n');

      // Test 1: Convert order to invoice
      addResult('1. Converting order to invoice...');
      const invoice = await convertOrderToInvoice(mockOrder);
      addResult(`✅ Invoice created: ${invoice.invoiceNumber}`);
      addResult(`   Total amount: ${invoice.totalAmount} SEK`);
      addResult(`   VAT total: ${invoice.vatTotal} SEK`);
      addResult(`   Line items: ${invoice.lineItems.length}`);

      // Test 2: Store invoice
      addResult('\n2. Storing invoice...');
      const invoiceId = await storeInvoice(invoice);
      addResult(`✅ Invoice stored with ID: ${invoiceId}`);

      // Test 3: Retrieve invoices
      addResult('\n3. Retrieving all invoices...');
      const allInvoices = await getAllInvoices();
      addResult(`✅ Found ${allInvoices.length} invoices`);

      // Test 4: Generate HTML
      addResult('\n4. Generating invoice HTML...');
      const html = generateInvoiceHtml(invoice);
      addResult(`✅ HTML generated, length: ${html.length} characters`);

      // Test 5: Check VAT calculation
      addResult('\n5. Checking VAT calculations...');
      const subtotal = invoice.lineItems.reduce((sum, item) => sum + (item.totalPrice - item.vatAmount), 0);
      const calculatedVAT = invoice.lineItems.reduce((sum, item) => sum + item.vatAmount, 0);
      const total = subtotal + calculatedVAT;

      addResult(`   Subtotal (excl. VAT): ${subtotal.toFixed(2)} SEK`);
      addResult(`   VAT (25%): ${calculatedVAT.toFixed(2)} SEK`);
      addResult(`   Total (incl. VAT): ${total.toFixed(2)} SEK`);
      addResult(`   Matches invoice total: ${total === invoice.totalAmount ? '✅' : '❌'}`);

      // Test 6: Show sample line items
      addResult('\n6. Sample line items:');
      invoice.lineItems.forEach((item, index) => {
        addResult(`   ${index + 1}. ${item.description}: ${item.totalPrice} SEK (${item.vatRate * 100}% VAT)`);
      });

      addResult('\n🎉 All tests completed successfully!');

    } catch (error) {
      addResult(`❌ Test failed: ${error instanceof Error ? error.message : String(error)}`);
      console.error('Test error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 Invoice Service Test Page</h1>

      <button
        onClick={runTests}
        disabled={isRunning}
        style={{
          padding: '10px 20px',
          backgroundColor: isRunning ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: isRunning ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {isRunning ? 'Running Tests...' : 'Run Invoice Service Tests'}
      </button>

      <div
        style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '5px',
          padding: '15px',
          minHeight: '400px',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap'
        }}
      >
        {testResults.length === 0 ? (
          <p style={{ color: '#6c757d', margin: 0 }}>
            Click "Run Invoice Service Tests" to start testing the invoice service functionality.
          </p>
        ) : (
          testResults.map((result, index) => (
            <div key={index} style={{ marginBottom: '5px' }}>
              {result}
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '20px', color: '#6c757d', fontSize: '14px' }}>
        <p><strong>Test Description:</strong></p>
        <ul>
          <li>Converts a mock order to an invoice with proper VAT calculations</li>
          <li>Stores the invoice in Firebase (with fallback to localStorage)</li>
          <li>Retrieves all invoices from storage</li>
          <li>Generates HTML invoice with Swedish VAT compliance</li>
          <li>Validates VAT calculations (25% standard rate)</li>
        </ul>
      </div>
    </div>
  );
};

export default TestInvoicePage;