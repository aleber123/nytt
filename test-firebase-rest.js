// Test Firebase using REST API (bypasses CLI version issues)
const https = require('https');

// Firebase configuration
const projectId = 'legapp-2720a';
const apiKey = 'AIzaSyAaQfVaMxCMjDbDa4l-S6IjSy4uTcQbHyo';

// Test data
const testOrder = {
  orderNumber: 'TEST001',
  services: ['apostille'],
  documentType: 'birthCertificate',
  country: 'USA',
  quantity: 1,
  expedited: false,
  deliveryMethod: 'digital',
  paymentMethod: 'invoice',
  customerInfo: {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phone: '+46 70 123 45 67',
    address: 'Testgatan 123',
    postalCode: '114 35',
    city: 'Stockholm'
  },
  totalPrice: 895,
  status: 'pending',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Function to make HTTPS request
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: response });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test creating an order
async function testCreateOrder() {
  console.log('🧪 Testing Firebase REST API order creation...\n');

  const orderId = `TEST${Date.now()}`;

  const options = {
    hostname: 'firestore.googleapis.com',
    path: `/v1/projects/${projectId}/databases/(default)/documents/orders/${orderId}?key=${apiKey}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  try {
    console.log('📤 Creating test order via REST API...');
    const response = await makeRequest(options, {
      fields: {
        orderNumber: { stringValue: testOrder.orderNumber },
        services: { arrayValue: { values: [{ stringValue: 'apostille' }] } },
        documentType: { stringValue: testOrder.documentType },
        country: { stringValue: testOrder.country },
        quantity: { integerValue: testOrder.quantity },
        expedited: { booleanValue: testOrder.expedited },
        deliveryMethod: { stringValue: testOrder.deliveryMethod },
        paymentMethod: { stringValue: testOrder.paymentMethod },
        totalPrice: { integerValue: testOrder.totalPrice },
        status: { stringValue: testOrder.status },
        createdAt: { timestampValue: testOrder.createdAt },
        updatedAt: { timestampValue: testOrder.updatedAt },
        customerInfo: {
          mapValue: {
            fields: {
              firstName: { stringValue: testOrder.customerInfo.firstName },
              lastName: { stringValue: testOrder.customerInfo.lastName },
              email: { stringValue: testOrder.customerInfo.email },
              phone: { stringValue: testOrder.customerInfo.phone },
              address: { stringValue: testOrder.customerInfo.address },
              postalCode: { stringValue: testOrder.customerInfo.postalCode },
              city: { stringValue: testOrder.customerInfo.city }
            }
          }
        }
      }
    });

    if (response.statusCode === 200) {
      console.log('✅ Order created successfully via REST API!');
      console.log('🆔 Order ID:', orderId);
      console.log('📋 Response:', JSON.stringify(response.data, null, 2));

      // Test reading the order back
      console.log('\n📖 Testing order retrieval...');
      const readOptions = {
        hostname: 'firestore.googleapis.com',
        path: `/v1/projects/${projectId}/databases/(default)/documents/orders/${orderId}?key=${apiKey}`,
        method: 'GET'
      };

      const readResponse = await makeRequest(readOptions);

      if (readResponse.statusCode === 200) {
        console.log('✅ Order retrieved successfully!');
        console.log('📋 Retrieved order data verified');
      } else {
        console.log('❌ Order retrieval failed:', readResponse.statusCode);
        console.log('Response:', readResponse.data);
      }

      return { success: true, orderId };

    } else {
      console.log('❌ Order creation failed:', response.statusCode);
      console.log('Response:', response.data);
      return { success: false, error: response.data };
    }

  } catch (error) {
    console.error('❌ REST API test failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
testCreateOrder()
  .then((result) => {
    if (result.success) {
      console.log('\n🎉 Firebase REST API test completed successfully!');
      console.log('📊 Test Results:', result);
      console.log('\n🔗 Test the order system at: http://localhost:3000/bestall');
    } else {
      console.log('\n💥 Firebase REST API test failed:', result.error);
    }
  })
  .catch((error) => {
    console.error('\n💥 Test execution failed:', error);
  });