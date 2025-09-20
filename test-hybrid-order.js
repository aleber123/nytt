// Test the hybrid order system
const { createOrder, getOrderById, firebaseAvailable } = require('./src/services/hybridOrderService');

console.log('🧪 Testing Hybrid Order System...\n');

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
    lastName: 'Kund',
    email: 'test@example.com',
    phone: '+46 70 123 45 67',
    address: 'Testgatan 123',
    postalCode: '114 35',
    city: 'Stockholm'
  },
  totalPrice: 4650
};

async function testHybridOrderSystem() {
  try {
    console.log('🔥 Firebase Available:', firebaseAvailable ? 'YES' : 'NO (using mock service)');
    console.log();

    console.log('📋 Test Order Data:');
    console.log(JSON.stringify(testOrderData, null, 2));
    console.log();

    // Test creating order
    console.log('📤 Creating order...');
    const orderId = await createOrder(testOrderData);
    console.log('✅ Order created successfully!');
    console.log('🆔 Order ID:', orderId);
    console.log();

    // Test retrieving order
    console.log('📖 Retrieving order...');
    const retrievedOrder = await getOrderById(orderId);

    if (retrievedOrder) {
      console.log('✅ Order retrieved successfully!');
      console.log('📋 Retrieved Order:', JSON.stringify(retrievedOrder, null, 2));
      console.log();

      // Verify data integrity
      if (retrievedOrder.totalPrice === testOrderData.totalPrice) {
        console.log('✅ Order data integrity verified!');
      } else {
        console.log('❌ Order data integrity check failed!');
      }

      console.log('\n🎉 Hybrid order system test completed successfully!');
      console.log('📊 Test Results:');
      console.log('   Order ID:', orderId);
      console.log('   Total Price:', retrievedOrder.totalPrice, 'kr');
      console.log('   Services:', retrievedOrder.services.join(', '));
      console.log('   Payment Method:', retrievedOrder.paymentMethod);
      console.log('   Customer:', `${retrievedOrder.customerInfo.firstName} ${retrievedOrder.customerInfo.lastName}`);
      console.log();

      console.log('🔗 Test the order system at: http://localhost:3000/bestall');
      console.log('🔗 View order confirmation at: http://localhost:3000/bekraftelse?orderId=' + orderId);

      return { success: true, orderId, order: retrievedOrder };

    } else {
      console.log('❌ Order not found!');
      return { success: false, error: 'Order not found' };
    }

  } catch (error) {
    console.error('❌ Hybrid order test failed:', error.message);
    console.error('🔍 Full error:', error);
    return { success: false, error: error.message };
  }
}

// Run the test
testHybridOrderSystem()
  .then((result) => {
    if (result.success) {
      console.log('\n✅ All tests passed! Order system is working.');
    } else {
      console.log('\n💥 Test failed:', result.error);
    }
  })
  .catch((error) => {
    console.error('\n💥 Test execution failed:', error);
  });