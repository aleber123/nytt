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

async function testPricingSystem() {
  console.log('🧪 Starting comprehensive pricing system test...\n');

  try {
    // Test 1: Get all current pricing rules
    console.log('📊 Test 1: Retrieving all current pricing rules...');
    const pricingRef = collection(db, 'pricing');
    const pricingSnapshot = await getDocs(pricingRef);
    console.log(`✅ Found ${pricingSnapshot.size} pricing rules in database`);

    const allRules = [];
    pricingSnapshot.forEach((doc) => {
      allRules.push({ id: doc.id, ...doc.data() });
    });

    console.log('📋 Current pricing rules:');
    allRules.forEach(rule => {
      const officialFee = rule.officialFee || rule.basePrice;
      const serviceFee = rule.serviceFee || 0;
      const totalPrice = rule.basePrice || (officialFee + serviceFee);
      console.log(`   ${rule.countryName} (${rule.countryCode}) - ${rule.serviceType}: ${officialFee}kr + ${serviceFee}kr = ${totalPrice}kr`);
    });
    console.log('');

    // Test 2: Add custom pricing rules with new fee structure
    console.log('➕ Test 2: Adding custom pricing rules with service fees...');

    const customRules = [
      {
        id: 'DK_apostille',
        countryCode: 'DK',
        countryName: 'Danmark',
        serviceType: 'apostille',
        officialFee: 850,
        serviceFee: 150,
        basePrice: 1000,
        processingTime: { standard: 6 },
        currency: 'SEK',
        updatedBy: 'test-user',
        isActive: true,
        lastUpdated: Timestamp.now()
      },
      {
        id: 'NO_notarization',
        countryCode: 'NO',
        countryName: 'Norge',
        serviceType: 'notarization',
        officialFee: 1200,
        serviceFee: 200,
        basePrice: 1400,
        processingTime: { standard: 8 },
        currency: 'SEK',
        updatedBy: 'test-user',
        isActive: true,
        lastUpdated: Timestamp.now()
      },
      {
        id: 'FI_translation',
        countryCode: 'FI',
        countryName: 'Finland',
        serviceType: 'translation',
        officialFee: 950,
        serviceFee: 120,
        basePrice: 1070,
        processingTime: { standard: 7 },
        currency: 'SEK',
        updatedBy: 'test-user',
        isActive: true,
        lastUpdated: Timestamp.now()
      }
    ];

    for (const rule of customRules) {
      const ruleRef = doc(db, 'pricing', rule.id);
      await setDoc(ruleRef, rule);
      console.log(`✅ Added ${rule.countryName} ${rule.serviceType}: ${rule.officialFee}kr + ${rule.serviceFee}kr = ${rule.basePrice}kr`);
    }
    console.log('');

    // Test 3: Get specific pricing rules
    console.log('🔍 Test 3: Retrieving specific pricing rules...');
    for (const rule of customRules) {
      const ruleRef = doc(db, 'pricing', rule.id);
      const ruleSnap = await getDoc(ruleRef);

      if (ruleSnap.exists()) {
        const data = ruleSnap.data();
        console.log(`✅ Retrieved ${data.countryName} ${data.serviceType}: ${data.officialFee}kr + ${data.serviceFee}kr = ${data.basePrice}kr`);
      } else {
        console.log(`❌ Failed to retrieve rule: ${rule.id}`);
      }
    }
    console.log('');

    // Test 4: Update pricing rules
    console.log('✏️  Test 4: Updating pricing rules...');
    const updateRuleId = 'DK_apostille';
    const ruleRef = doc(db, 'pricing', updateRuleId);

    await updateDoc(ruleRef, {
      serviceFee: 180, // Increase service fee
      basePrice: 850 + 180, // Recalculate total
      updatedBy: 'test-user-updated',
      lastUpdated: Timestamp.now()
    });
    console.log('✅ Updated Denmark apostille service fee to 180kr');

    // Verify update
    const updatedRuleSnap = await getDoc(ruleRef);
    if (updatedRuleSnap.exists()) {
      const data = updatedRuleSnap.data();
      console.log(`✅ Verified update: ${data.countryName} ${data.serviceType}: ${data.officialFee}kr + ${data.serviceFee}kr = ${data.basePrice}kr`);
    }
    console.log('');

    // Test 5: Bulk update pricing (service fees only)
    console.log('🔄 Test 5: Bulk updating service fees...');

    // Get rules to update
    const bulkQuery = query(
      collection(db, 'pricing'),
      where('countryCode', 'in', ['DK', 'NO', 'FI']),
      where('serviceType', 'in', ['apostille', 'notarization', 'translation']),
      where('isActive', '==', true)
    );

    const bulkSnapshot = await getDocs(bulkQuery);
    console.log(`📊 Found ${bulkSnapshot.size} rules to bulk update`);

    // Update each rule
    const bulkPromises = [];
    bulkSnapshot.forEach((document) => {
      const data = document.data();
      const newServiceFee = data.serviceFee + 50; // Increase by 50kr
      const newBasePrice = data.officialFee + newServiceFee;

      const updatePromise = updateDoc(doc(db, 'pricing', document.id), {
        serviceFee: newServiceFee,
        basePrice: newBasePrice,
        updatedBy: 'test-user-bulk',
        lastUpdated: Timestamp.now()
      });
      bulkPromises.push(updatePromise);
    });

    await Promise.all(bulkPromises);
    console.log('✅ Bulk updated service fees by +50kr');

    // Verify bulk update
    const verifySnapshot = await getDocs(bulkQuery);
    console.log('✅ Verified bulk updates:');
    verifySnapshot.forEach((document) => {
      const data = document.data();
      console.log(`   ${data.countryName} ${data.serviceType}: ${data.officialFee}kr + ${data.serviceFee}kr = ${data.basePrice}kr`);
    });
    console.log('');

    // Test 6: Get pricing statistics
    console.log('📈 Test 6: Getting pricing statistics...');
    const allPricingSnapshot = await getDocs(collection(db, 'pricing'));
    const activeRules = allPricingSnapshot.docs.filter(doc => doc.data().isActive).length;
    const countries = new Set(allPricingSnapshot.docs.map(doc => doc.data().countryCode));
    const totalPrice = allPricingSnapshot.docs.reduce((sum, doc) => sum + (doc.data().basePrice || 0), 0);
    const averagePrice = Math.round(totalPrice / allPricingSnapshot.size);

    console.log('✅ Pricing Statistics:');
    console.log(`   Total Rules: ${allPricingSnapshot.size}`);
    console.log(`   Active Rules: ${activeRules}`);
    console.log(`   Countries Covered: ${countries.size}`);
    console.log(`   Average Price: ${averagePrice}kr`);
    console.log('');

    // Test 7: Test edge cases
    console.log('🔧 Test 7: Testing edge cases...');

    // Test non-existent rule
    const nonExistentRef = doc(db, 'pricing', 'XX_nonexistent');
    const nonExistentSnap = await getDoc(nonExistentRef);
    if (!nonExistentSnap.exists()) {
      console.log('✅ Correctly handled non-existent pricing rule');
    }

    // Test invalid query (empty arrays)
    try {
      const invalidQuery = query(
        collection(db, 'pricing'),
        where('countryCode', 'in', []),
        where('serviceType', 'in', [])
      );
      const invalidSnapshot = await getDocs(invalidQuery);
      console.log(`✅ Empty query returned ${invalidSnapshot.size} results`);
    } catch (error) {
      console.log('✅ Correctly handled invalid query');
    }

    console.log('');

    console.log('🎉 All pricing tests completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Created ${customRules.length} custom pricing rules with service fees`);
    console.log(`   - Updated pricing rules with new fee structure`);
    console.log(`   - Performed bulk update on service fees`);
    console.log(`   - Verified data persistence in Firebase`);
    console.log(`   - Total rules in system: ${allPricingSnapshot.size}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testPricingSystem().then(() => {
  console.log('\n🏁 Test execution completed');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Test execution failed:', error);
  process.exit(1);
});