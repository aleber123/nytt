const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp
} = require('firebase/firestore');

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
let app, db;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error.message);
  process.exit(1);
}

async function checkOrderSWE000044() {
  console.log('🔍 Checking Order SWE000044 Pricing...\n');

  try {
    // Find the order by orderNumber
    console.log('📋 Searching for order SWE000044...');

    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('orderNumber', '==', 'SWE000044'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('❌ Order SWE000044 not found in database');
      return;
    }

    const orderDoc = querySnapshot.docs[0];
    const order = { id: orderDoc.id, ...orderDoc.data() };

    console.log('✅ Found order SWE000044:');
    console.log(`   Order ID: ${order.id}`);
    console.log(`   Order Number: ${order.orderNumber}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Country: ${order.country}`);
    console.log(`   Services: ${Array.isArray(order.services) ? order.services.join(', ') : order.services}`);
    console.log(`   Quantity: ${order.quantity || 1}`);
    console.log(`   Expedited: ${order.expedited || false}`);
    console.log(`   Scanned Copies: ${order.scannedCopies || false}`);
    console.log(`   Pickup Service: ${order.pickupService || false}`);
    console.log(`   Return Service: ${order.returnService || 'none'}`);
    console.log(`   Total Price in Database: ${order.totalPrice} kr`);
    console.log('');

    // Load current pricing rules
    console.log('💰 Loading current pricing rules from Firebase...');
    const pricingRules = {};
    const pricingRef = collection(db, 'pricing');
    const pricingSnapshot = await getDocs(pricingRef);

    pricingSnapshot.forEach((doc) => {
      const data = doc.data();
      const key = `${data.countryCode}_${data.serviceType}`;
      pricingRules[key] = data;
    });

    console.log(`📊 Loaded ${Object.keys(pricingRules).length} pricing rules`);
    console.log('');

    // Calculate what the price SHOULD be based on order data
    console.log('🧮 Calculating correct price for this order...');

    const services = Array.isArray(order.services) ? order.services : [order.services];
    const quantity = order.quantity || 1;

    let totalBasePrice = 0;
    let breakdown = [];

    console.log('Services breakdown:');
    for (const service of services) {
      const rule = pricingRules[`${order.country}_${service}`];
      if (rule) {
        const servicePrice = rule.basePrice * quantity;
        totalBasePrice += servicePrice;
        breakdown.push({
          service,
          basePrice: servicePrice,
          quantity,
          unitPrice: rule.basePrice,
          officialFee: rule.officialFee * quantity,
          serviceFee: rule.serviceFee * quantity
        });
        console.log(`   ${service}: ${rule.basePrice} kr × ${quantity} = ${servicePrice} kr`);
        console.log(`      (Official: ${rule.officialFee} kr, Service: ${rule.serviceFee} kr)`);
      } else {
        console.log(`   ❌ No pricing rule found for ${order.country}_${service}`);
      }
    }

    // Add additional fees
    let additionalFees = 0;
    console.log('\nAdditional fees:');

    // Express fee
    if (order.expedited) {
      additionalFees += 500;
      console.log(`   Express service: 500 kr`);
    }

    // Scanned copies fee (200 kr per document)
    if (order.scannedCopies) {
      const scannedFee = 200 * quantity;
      additionalFees += scannedFee;
      console.log(`   Scanned copies: 200 kr × ${quantity} = ${scannedFee} kr`);
    }

    // Pickup service fee
    if (order.pickupService) {
      additionalFees += 450;
      console.log(`   Pickup service: 450 kr`);
    }

    // Return service fee (simplified)
    if (order.returnService) {
      additionalFees += 150; // Simplified return service fee
      console.log(`   Return service: 150 kr`);
    }

    const calculatedTotal = totalBasePrice + additionalFees;

    console.log('');
    console.log('📊 Price Analysis:');
    console.log(`   Base Price: ${totalBasePrice} kr`);
    console.log(`   Additional Fees: ${additionalFees} kr`);
    console.log(`   Calculated Total: ${calculatedTotal} kr`);
    console.log(`   Database Total: ${order.totalPrice} kr`);
    console.log('');

    // Check if prices match
    if (calculatedTotal === order.totalPrice) {
      console.log('✅ PRICES MATCH: Calculated total equals database total');
    } else {
      console.log('❌ PRICE MISMATCH DETECTED!');
      console.log(`   Difference: ${order.totalPrice - calculatedTotal} kr`);
      if (order.totalPrice > calculatedTotal) {
        console.log(`   Database price is ${order.totalPrice - calculatedTotal} kr higher than calculated`);
      } else {
        console.log(`   Database price is ${calculatedTotal - order.totalPrice} kr lower than calculated`);
      }
    }

    // Show detailed breakdown
    console.log('\n📋 Detailed Breakdown:');
    breakdown.forEach(item => {
      console.log(`   ${item.service}:`);
      console.log(`      Quantity: ${item.quantity}`);
      console.log(`      Unit Price: ${item.unitPrice} kr`);
      console.log(`      Official Fee: ${item.officialFee} kr`);
      console.log(`      Service Fee: ${item.serviceFee} kr`);
      console.log(`      Total: ${item.basePrice} kr`);
    });

    if (additionalFees > 0) {
      console.log(`   Additional Services: ${additionalFees} kr`);
    }

    console.log(`   Grand Total: ${calculatedTotal} kr`);

  } catch (error) {
    console.error('❌ Error checking order:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the check
checkOrderSWE000044().then(() => {
  console.log('\n🏁 Order SWE000044 check completed');
}).catch(error => {
  console.error('\n💥 Check failed:', error);
});