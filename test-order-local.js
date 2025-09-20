// Local order test - simulates the order process without Firebase
console.log('🧪 Starting local order test...\n');

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
  }
};

console.log('📋 Order data:');
console.log(JSON.stringify(testOrderData, null, 2));
console.log();

// Calculate price function
function calculatePrice(orderData) {
  let basePrice = 0;

  // Calculate price based on selected services
  if (orderData.services && orderData.services.length > 0) {
    basePrice = orderData.services.length * 1000; // 1000 kr per service
  }

  // Multiply by quantity
  const quantity = orderData.quantity || 1;
  let totalPrice = basePrice * quantity;

  // Add expedited service cost
  if (orderData.expedited) {
    totalPrice += 500;
  }

  // Add delivery method cost
  if (orderData.deliveryMethod === 'express') {
    totalPrice += 150;
  } else if (orderData.deliveryMethod === 'post') {
    totalPrice += 50;
  }

  return totalPrice;
}

// Generate order number
function generateOrderNumber() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `SWE${timestamp.toString().slice(-6)}${random.toString().padStart(3, '0')}`;
}

// Simulate order creation
function createOrder(orderData) {
  const orderId = generateOrderNumber();
  const totalPrice = calculatePrice(orderData);

  const order = {
    id: orderId,
    orderNumber: orderId,
    ...orderData,
    totalPrice,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return { orderId, order };
}

// Simulate invoice email
function sendInvoiceEmail(order) {
  console.log('📧 SIMULATED EMAIL: Invoice sent to', order.customerInfo.email);
  console.log('📄 Invoice details:');
  console.log('   Order Number:', order.orderNumber);
  console.log('   Total Amount:', order.totalPrice, 'kr');
  console.log('   Services:', order.services.join(', '));
  console.log('   Customer:', `${order.customerInfo.firstName} ${order.customerInfo.lastName}`);
  console.log('   Payment Terms: 14 days');
  console.log();
}

// Main test function
function testOrderProcess() {
  console.log('💰 Calculating total price...');
  const totalPrice = calculatePrice(testOrderData);
  console.log('💰 Total price:', totalPrice, 'kr\n');

  console.log('📤 Creating order...');
  const { orderId, order } = createOrder(testOrderData);
  console.log('✅ Order created successfully!');
  console.log('🆔 Order ID:', orderId);
  console.log();

  // Process invoice payment
  if (order.paymentMethod === 'invoice') {
    console.log('📧 Processing invoice payment...');
    sendInvoiceEmail(order);
    console.log('✅ Invoice sent successfully!');
  }

  console.log('\n🎉 Order process completed successfully!');
  console.log('📝 Order Summary:');
  console.log('   Order Number:', orderId);
  console.log('   Services:', testOrderData.services.join(', '));
  console.log('   Total Price:', totalPrice, 'kr');
  console.log('   Payment Method:', testOrderData.paymentMethod);
  console.log('   Customer:', `${testOrderData.customerInfo.firstName} ${testOrderData.customerInfo.lastName}`);
  console.log('   Email:', testOrderData.customerInfo.email);
  console.log();

  console.log('🔗 Confirmation URL:');
  console.log(`   http://localhost:3000/bekraftelse?orderId=${orderId}`);
  console.log();

  console.log('📋 Price Breakdown:');
  console.log('   Base price (2 services × 1000 kr):', 2 * 1000, 'kr');
  console.log('   Quantity multiplier (×2):', 2 * 1000 * 2, 'kr');
  console.log('   Expedited service (+500 kr):', 500, 'kr');
  console.log('   Express delivery (+150 kr):', 150, 'kr');
  console.log('   Total:', totalPrice, 'kr');

  return { orderId, totalPrice, order };
}

// Run the test
const result = testOrderProcess();

console.log('\n✅ Test completed successfully!');
console.log('📊 Test Results:', {
  orderId: result.orderId,
  totalPrice: result.totalPrice,
  services: testOrderData.services,
  paymentMethod: testOrderData.paymentMethod
});

module.exports = { testOrderProcess, calculatePrice, generateOrderNumber };