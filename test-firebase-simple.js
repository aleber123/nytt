// Simple Firebase test - create and read an order
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, getDoc, setDoc, Timestamp } = require('firebase/firestore');

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

async function testFirebaseOrder() {
  console.log('🧪 Testing Firebase order creation and retrieval...\n');

  // Test order data
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
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };

  try {
    console.log('📤 Creating test order...');
    const docRef = await addDoc(collection(db, 'orders'), testOrder);

    console.log('✅ Order created successfully!');
    console.log('🆔 Document ID:', docRef.id);
    console.log('📋 Order data:', JSON.stringify(testOrder, null, 2));

    // Test reading the order back
    console.log('\n📖 Testing order retrieval...');
    const docSnap = await getDoc(doc(db, 'orders', docRef.id));

    if (docSnap.exists()) {
      console.log('✅ Order retrieved successfully!');
      const retrievedOrder = docSnap.data();
      console.log('📋 Retrieved order:', JSON.stringify(retrievedOrder, null, 2));

      // Verify data integrity
      if (retrievedOrder.orderNumber === testOrder.orderNumber) {
        console.log('✅ Order data integrity verified!');
      } else {
        console.log('❌ Order data integrity check failed!');
      }
    } else {
      console.log('❌ Order not found!');
    }

    return {
      success: true,
      orderId: docRef.id,
      orderData: testOrder
    };

  } catch (error) {
    console.error('❌ Firebase test failed:', error.message);
    console.error('🔍 Full error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
testFirebaseOrder()
  .then((result) => {
    if (result.success) {
      console.log('\n🎉 Firebase test completed successfully!');
      console.log('📊 Test Results:', {
        orderId: result.orderId,
        orderNumber: result.orderData.orderNumber,
        totalPrice: result.orderData.totalPrice
      });
      console.log('\n🔗 Test the order system at: http://localhost:3000/bestall');
    } else {
      console.log('\n💥 Firebase test failed:', result.error);
    }
  })
  .catch((error) => {
    console.error('\n💥 Test execution failed:', error);
  });