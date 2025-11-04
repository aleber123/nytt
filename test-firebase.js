// Firebase connection test
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBaXYbWRbryxW-YL4aWIFDzb5Po-r1sj3g",
  authDomain: "doxvl-51a30.firebaseapp.com",
  projectId: "doxvl-51a30",
  storageBucket: "doxvl-51a30.firebasestorage.app",
  messagingSenderId: "195927020517",
  appId: "1:195927020517:web:309ee643e3499d883ed50c",
  measurementId: "G-F603S6T43P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFirebaseConnection() {
  try {
    console.log('🔥 Testing Firebase connection...');

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
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    console.log('📤 Attempting to create test order...');
    const docRef = await addDoc(collection(db, 'orders'), testOrder);

    console.log('✅ Firebase connection successful!');
    console.log('🆔 Test order created with ID:', docRef.id);
    console.log('📋 Order data:', JSON.stringify(testOrder, null, 2));

    return docRef.id;
  } catch (error) {
    console.error('❌ Firebase test failed:', error.message);
    console.error('🔍 Error details:', error);
    throw error;
  }
}

// Run the test
testFirebaseConnection()
  .then((orderId) => {
    console.log('\n🎉 Firebase test completed successfully!');
    console.log('📝 Test order ID:', orderId);
    console.log('💡 You can verify this order in Firebase Console');
  })
  .catch((error) => {
    console.error('\n💥 Firebase test failed:', error);
    process.exit(1);
  });