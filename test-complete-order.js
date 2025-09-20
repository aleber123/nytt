// Complete order test script - simulates the full order process
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp, setDoc, doc, getCountFromServer } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAaQfVaMxCMjDbDa4l-S6IjSy4uTcQbHyo",
  authDomain: "legapp-2720a.firebaseapp.com",
  projectId: "legapp-2720a",
  storageBucket: "legapp-2720a.firebasestorage.app",
  messagingSenderId: "1003184294483",
  appId: "1:1003184294483:web:55e86d1f5833ee0cad14a6",
  measurementId: "G-V694ZBTV7F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Mock invoice service (since we can't actually send emails)
const mockSendInvoiceEmail = async (order) => {
  console.log('📧 MOCK EMAIL: Invoice sent to', order.customerInfo.email);
  console.log('📄 Invoice details:', {
    orderNumber: order.orderNumber,
    totalAmount: order.totalPrice,
    services: order.services,
    customer: `${order.customerInfo.firstName} ${order.customerInfo.lastName}`
  });
  return true;
};

// Get next order number
async function getNextOrderNumber() {
  try {
    const snapshot = await getCountFromServer(collection(db, 'orders'));
    const count = snapshot.data().count;
    const nextNumber = count > 0 ? count + 1 : 1;

    await setDoc(doc(db, 'counters', 'orders'), {
      currentCount: nextNumber,
      lastUpdated: Timestamp.now()
    }, { merge: true });

    return nextNumber;
  } catch (error) {
    console.error('Error getting next order number:', error);
    return Math.floor(Date.now() / 1000);
  }
}

// Format order ID
function formatOrderId(number) {
  return `SWE${number.toString().padStart(6, '0')}`;
}

// Create order function
async function createOrder(orderData) {
  try {
    const nextNumber = await getNextOrderNumber();
    const formattedOrderId = formatOrderId(nextNumber);

    const orderWithTimestamps = {
      ...orderData,
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      orderNumber: formattedOrderId
    };

    await setDoc(doc(db, 'orders', formattedOrderId), orderWithTimestamps);

    return formattedOrderId;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

// Calculate price function
function calculatePrice(orderData) {
  let basePrice = 0;

  if (orderData.services && orderData.services.length > 0) {
    basePrice = orderData.services.length * 1000; // 1000 kr per service
  }

  const quantity = orderData.quantity || 1;
  let totalPrice = basePrice * quantity;

  if (orderData.expedited) {
    totalPrice += 500;
  }

  if (orderData.deliveryMethod === 'express') {
    totalPrice += 150;
  } else if (orderData.deliveryMethod === 'post') {
    totalPrice += 50;
  }

  return totalPrice;
}

// Main test function
async function testCompleteOrderProcess() {
  console.log('🧪 Starting complete order test...');

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
      address: 'Sveavägen 159',
      postalCode: '114 35',
      city: 'Stockholm'
    }
  };

  try {
    console.log('📋 Order data:', JSON.stringify(testOrderData, null, 2));

    // Calculate total price
    const totalPrice = calculatePrice(testOrderData);
    console.log('💰 Calculated total price:', totalPrice, 'kr');

    // Create the order
    console.log('📤 Creating order...');
    const orderId = await createOrder({
      ...testOrderData,
      totalPrice
    });

    console.log('✅ Order created successfully!');
    console.log('🆔 Order ID:', orderId);

    // Simulate invoice payment process
    if (testOrderData.paymentMethod === 'invoice') {
      console.log('📧 Processing invoice payment...');

      const orderWithId = {
        ...testOrderData,
        id: orderId,
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        orderNumber: orderId,
        totalPrice
      };

      await mockSendInvoiceEmail(orderWithId);
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

    console.log('\n🔗 Confirmation URL:');
    console.log(`   http://localhost:3000/bekraftelse?orderId=${orderId}`);

    return {
      orderId,
      totalPrice,
      orderData: testOrderData
    };

  } catch (error) {
    console.error('❌ Order test failed:', error.message);
    console.error('🔍 Full error:', error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testCompleteOrderProcess()
    .then((result) => {
      console.log('\n✅ Test completed successfully!');
      console.log('📊 Test Results:', result);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testCompleteOrderProcess, calculatePrice };