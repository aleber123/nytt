// Simple test script to verify Firebase pricing functionality
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

async function testFirebaseConnection() {
  try {
    console.log('🔥 Testing Firebase connection...');

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log('✅ Firebase initialized successfully');

    // Try to read from pricing collection
    const pricingRef = collection(db, 'pricing');
    const pricingSnapshot = await getDocs(pricingRef);

    console.log(`📊 Found ${pricingSnapshot.size} pricing rules in database`);

    if (pricingSnapshot.size > 0) {
      console.log('📋 Current pricing rules:');
      pricingSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`  - ${data.countryName} (${data.countryCode}): ${data.serviceType} - ${data.basePrice} kr`);
      });
    } else {
      console.log('⚠️  No pricing rules found. You may need to initialize default pricing.');
      console.log('💡 Run: node scripts/initializePricing.js');
    }

    console.log('🎉 Firebase connection test completed successfully!');

  } catch (error) {
    console.error('❌ Firebase connection test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your .env.local file has correct Firebase config');
    console.log('2. Make sure Firebase project exists and is accessible');
    console.log('3. Verify Firestore security rules allow read access');
    process.exit(1);
  }
}

// Run the test
testFirebaseConnection();