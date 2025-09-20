// Test script to simulate placing an order
const { createOrder } = require('./src/firebase/orderService');

// Test order data
const testOrderData = {
  services: ['apostille', 'notarisering'],
  documentType: 'birthCertificate',
  country: 'USA',
  quantity: 2,
  expedited: true,
  deliveryMethod: 'express',
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
  totalPrice: 2500
};

async function testOrderCreation() {
  try {
    console.log('🧪 Testing order creation...');
    console.log('📋 Order data:', JSON.stringify(testOrderData, null, 2));

    const orderId = await createOrder(testOrderData);

    console.log('✅ Order created successfully!');
    console.log('🆔 Order ID:', orderId);
    console.log('📧 Invoice should be sent to:', testOrderData.customerInfo.email);

    return orderId;
  } catch (error) {
    console.error('❌ Order creation failed:', error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testOrderCreation()
    .then((orderId) => {
      console.log('\n🎉 Test completed successfully!');
      console.log('📝 You can now visit the confirmation page:');
      console.log(`   http://localhost:3000/bekraftelse?orderId=${orderId}`);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testOrderCreation, testOrderData };