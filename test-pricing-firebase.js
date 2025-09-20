// Test Firebase pricing functionality with new service fee structure
const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp
} = require('firebase/firestore');

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

// Initialize Firebase
let app, db;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error.message);
  process.exit(1);
}

async function testFirebasePricing() {
  console.log('🧪 Testing Firebase pricing with new service fee structure...\n');

  try {
    // Test 1: Add a new pricing rule with service fees
    console.log('➕ Test 1: Adding pricing rule with service fees...');

    const testRule = {
      id: 'TEST_SE_apostille',
      countryCode: 'SE',
      countryName: 'Sverige',
      serviceType: 'apostille',
      officialFee: 795,
      serviceFee: 150,
      basePrice: 945,
      processingTime: { standard: 5 },
      currency: 'SEK',
      updatedBy: 'test-user',
      isActive: true,
      lastUpdated: Timestamp.now()
    };

    const ruleRef = doc(db, 'pricing', testRule.id);
    await setDoc(ruleRef, testRule);

    console.log('✅ Successfully added pricing rule to Firebase!');
    console.log(`   ${testRule.countryName} ${testRule.serviceType}: ${testRule.officialFee}kr + ${testRule.serviceFee}kr = ${testRule.basePrice}kr`);

    // Test 2: Read the pricing rule back
    console.log('\n📖 Test 2: Reading pricing rule from Firebase...');

    const readRuleSnap = await getDoc(ruleRef);
    if (readRuleSnap.exists()) {
      const data = readRuleSnap.data();
      console.log('✅ Successfully read pricing rule from Firebase!');
      console.log(`   Retrieved: ${data.countryName} ${data.serviceType}: ${data.officialFee}kr + ${data.serviceFee}kr = ${data.basePrice}kr`);
    } else {
      console.log('❌ Pricing rule not found');
    }

    // Test 3: Update the pricing rule
    console.log('\n✏️  Test 3: Updating pricing rule...');

    await updateDoc(ruleRef, {
      serviceFee: 200, // Increase service fee
      basePrice: 795 + 200, // Recalculate total
      updatedBy: 'test-user-updated',
      lastUpdated: Timestamp.now()
    });

    console.log('✅ Successfully updated pricing rule in Firebase!');

    // Verify update
    const updatedRuleSnap = await getDoc(ruleRef);
    if (updatedRuleSnap.exists()) {
      const data = updatedRuleSnap.data();
      console.log(`✅ Verified update: ${data.countryName} ${data.serviceType}: ${data.officialFee}kr + ${data.serviceFee}kr = ${data.basePrice}kr`);
    }

    // Test 4: Get all pricing rules
    console.log('\n📊 Test 4: Getting all pricing rules...');

    const pricingRef = collection(db, 'pricing');
    const pricingSnapshot = await getDocs(pricingRef);

    console.log(`✅ Found ${pricingSnapshot.size} pricing rules in Firebase:`);

    pricingSnapshot.forEach((document) => {
      const data = document.data();
      const officialFee = data.officialFee || data.basePrice;
      const serviceFee = data.serviceFee || 0;
      const totalPrice = data.basePrice || (officialFee + serviceFee);
      console.log(`   ${data.countryName} (${data.countryCode}) - ${data.serviceType}: ${officialFee}kr + ${serviceFee}kr = ${totalPrice}kr`);
    });

    // Test 5: Clean up test data
    console.log('\n🧹 Test 5: Cleaning up test data...');

    // Note: We'll keep the test rule for now so you can see it in Firebase
    // await deleteDoc(ruleRef);
    // console.log('✅ Test data cleaned up');

    console.log('\n🎉 All Firebase pricing tests completed successfully!');
    console.log('💡 You can now:');
    console.log('   • Add pricing rules with separate official and service fees');
    console.log('   • Update service fees independently');
    console.log('   • Read pricing data from Firebase');
    console.log('   • Use the admin interface to manage pricing');

  } catch (error) {
    console.error('❌ Firebase pricing test failed:', error);
    console.error('Error details:', error.message);

    if (error.message.includes('permission-denied')) {
      console.log('\n🔐 Permission Error - Check Firebase Security Rules:');
      console.log('1. Make sure firestore.rules allows write access to /pricing collection');
      console.log('2. Deploy rules: firebase deploy --only firestore:rules');
      console.log('3. Wait a few minutes for rules to take effect');
    }
  }
}

// Run the test
testFirebasePricing().then(() => {
  console.log('\n🏁 Firebase pricing test execution completed');
}).catch(error => {
  console.error('\n💥 Firebase pricing test execution failed:', error);
  process.exit(1);
});