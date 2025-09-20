const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://legaliseringstjanst-default-rtdb.firebaseio.com'
  });
}

const db = admin.firestore();

async function simplePricingDiagnostic() {
  console.log('🔍 Simple Pricing System Diagnostic\n');

  try {
    // Test 1: Check Firebase connection
    console.log('1️⃣ Testing Firebase Connection...');
    const testDoc = await db.collection('test').doc('diagnostic').get();
    console.log('✅ Firebase connection successful');

    // Test 2: Check existing pricing data
    console.log('\n2️⃣ Checking Existing Pricing Data...');
    const pricingSnapshot = await db.collection('pricing').get();

    if (pricingSnapshot.empty) {
      console.log('⚠️  No pricing data found in Firebase');
    } else {
      console.log(`✅ Found ${pricingSnapshot.size} pricing documents:`);

      pricingSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   ${doc.id}: ${data.countryName} - ${data.serviceType}`);
        console.log(`      Official Fee: ${data.officialFee || 'N/A'} kr`);
        console.log(`      Service Fee: ${data.serviceFee || 'N/A'} kr`);
        console.log(`      Base Price: ${data.basePrice || 'N/A'} kr`);
        console.log('');
      });
    }

    // Test 3: Create a test pricing rule
    console.log('3️⃣ Creating Test Pricing Rule...');
    const testRule = {
      countryCode: 'TEST',
      countryName: 'Test Country',
      serviceType: 'apostille',
      officialFee: 500,
      serviceFee: 150,
      basePrice: 650,
      processingTime: { standard: 3 },
      currency: 'SEK',
      updatedBy: 'diagnostic-test',
      isActive: true,
      lastUpdated: admin.firestore.Timestamp.now()
    };

    const docRef = await db.collection('pricing').add(testRule);
    console.log(`✅ Created test pricing rule with ID: ${docRef.id}`);

    // Test 4: Retrieve the test rule
    console.log('\n4️⃣ Retrieving Test Pricing Rule...');
    const retrievedDoc = await db.collection('pricing').doc(docRef.id).get();

    if (retrievedDoc.exists) {
      const data = retrievedDoc.data();
      console.log('✅ Successfully retrieved test rule:');
      console.log(`   Country: ${data.countryName}`);
      console.log(`   Service: ${data.serviceType}`);
      console.log(`   Official Fee: ${data.officialFee} kr`);
      console.log(`   Service Fee: ${data.serviceFee} kr`);
      console.log(`   Total Price: ${data.basePrice} kr`);
    } else {
      console.log('❌ Failed to retrieve test rule');
    }

    // Test 5: Update the test rule
    console.log('\n5️⃣ Updating Test Pricing Rule...');
    await db.collection('pricing').doc(docRef.id).update({
      serviceFee: 200,
      basePrice: 700,
      lastUpdated: admin.firestore.Timestamp.now()
    });
    console.log('✅ Updated service fee to 200 kr');

    // Verify update
    const updatedDoc = await db.collection('pricing').doc(docRef.id).get();
    if (updatedDoc.exists) {
      const data = updatedDoc.data();
      console.log(`✅ Verified update: Service fee is now ${data.serviceFee} kr, total ${data.basePrice} kr`);
    }

    // Test 6: Clean up test data
    console.log('\n6️⃣ Cleaning Up Test Data...');
    await db.collection('pricing').doc(docRef.id).delete();
    console.log('✅ Test data cleaned up');

    // Test 7: Check for common issues
    console.log('\n7️⃣ Checking for Common Issues...');

    // Check for rules without new fee structure
    const allRules = await db.collection('pricing').get();
    let issuesFound = 0;

    allRules.forEach(doc => {
      const data = doc.data();
      if (!data.officialFee || !data.serviceFee) {
        console.log(`⚠️  Rule ${doc.id} missing fee structure (officialFee: ${data.officialFee}, serviceFee: ${data.serviceFee})`);
        issuesFound++;
      }
    });

    if (issuesFound === 0) {
      console.log('✅ All rules have proper fee structure');
    } else {
      console.log(`❌ Found ${issuesFound} rules with missing fee structure`);
    }

  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
    console.error('Stack trace:', error.stack);

    // Provide troubleshooting tips
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('1. Check Firebase service account credentials');
    console.log('2. Verify Firebase project configuration');
    console.log('3. Check Firestore security rules');
    console.log('4. Ensure network connectivity');
    console.log('5. Check Firebase project billing/quota');
  }
}

// Run the diagnostic
simplePricingDiagnostic().then(() => {
  console.log('\n🏁 Simple diagnostic completed');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Diagnostic failed:', error);
  process.exit(1);
});