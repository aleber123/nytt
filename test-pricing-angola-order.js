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

// Mock pricing data for testing (from pricingService.ts)
const getMockPricingRules = () => {
  const now = Timestamp.now();
  return [
    // Angola embassy service
    {
      id: 'AO_embassy',
      countryCode: 'AO',
      countryName: 'Angola',
      serviceType: 'embassy',
      officialFee: 2000,
      serviceFee: 1200,
      basePrice: 3200,
      processingTime: { standard: 15 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    // Sweden standard services (for comparison)
    {
      id: 'SE_notarization',
      countryCode: 'SE',
      countryName: 'Sverige',
      serviceType: 'notarization',
      officialFee: 1200,
      serviceFee: 100,
      basePrice: 1300,
      processingTime: { standard: 8 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    {
      id: 'SE_ud',
      countryCode: 'SE',
      countryName: 'Sverige',
      serviceType: 'ud',
      officialFee: 1650,
      serviceFee: 100,
      basePrice: 1750,
      processingTime: { standard: 10 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    },
    // Global shipping services
    {
      id: 'GLOBAL_dhl-worldwide',
      countryCode: 'GLOBAL',
      countryName: 'Global',
      serviceType: 'dhl-worldwide',
      officialFee: 0,
      serviceFee: 350,
      basePrice: 350,
      processingTime: { standard: 1 },
      currency: 'SEK',
      updatedBy: 'admin',
      isActive: true,
      lastUpdated: now
    }
  ];
};

async function testAngolaOrderPricing() {
  console.log('🧪 Testing Angola embassy + notary + foreign ministry order pricing...\n');

  try {
    // Test order configuration
    const orderConfig = {
      country: 'AO', // Angola
      services: ['embassy', 'notarization', 'ud'], // Embassy + Notary + Foreign Ministry
      quantity: 1,
      documentSource: 'original', // Original documents
      returnService: 'dhl-worldwide', // DHL Worldwide shipping
      scannedCopies: false,
      pickupService: false
    };

    console.log('📋 Order Configuration:');
    console.log(`   Country: Angola (AO)`);
    console.log(`   Services: Embassy legalization + Notarization + Foreign Ministry (UD)`);
    console.log(`   Quantity: ${orderConfig.quantity} document`);
    console.log(`   Document Source: ${orderConfig.documentSource}`);
    console.log(`   Return Service: ${orderConfig.returnService}`);
    console.log('');

    // Step 1: Get pricing rules using mock data
    console.log('📊 Step 1: Retrieving pricing rules...');

    const mockRules = getMockPricingRules();
    const angolaPricingRules = [];

    for (const serviceType of orderConfig.services) {
      const rule = mockRules.find(r => r.countryCode === orderConfig.country && r.serviceType === serviceType);
      if (rule) {
        angolaPricingRules.push(rule);
        console.log(`   ✅ ${serviceType}: ${rule.basePrice} kr (official: ${rule.officialFee}kr + service: ${rule.serviceFee}kr)`);
      } else {
        console.log(`   ❌ No pricing rule found for ${orderConfig.country}_${serviceType}`);
      }
    }

    // Step 2: Get return service pricing
    console.log('\n📦 Step 2: Getting return service pricing...');
    const returnServiceRule = mockRules.find(r => r.serviceType === orderConfig.returnService);
    let returnServicePrice = 0;

    if (returnServiceRule) {
      returnServicePrice = returnServiceRule.basePrice;
      console.log(`   ✅ ${orderConfig.returnService}: ${returnServicePrice} kr`);
    } else {
      returnServicePrice = 350; // Fallback
      console.log(`   ⚠️ Using fallback price: ${returnServicePrice} kr`);
    }

    // Step 3: Calculate expected total using proper pricing logic
    console.log('\n🧮 Step 3: Calculating expected total price...');

    let expectedTotal = 0;
    const breakdown = [];

    // Add service prices
    for (const rule of angolaPricingRules) {
      const serviceTotal = rule.basePrice * orderConfig.quantity;
      expectedTotal += serviceTotal;
      breakdown.push({
        service: rule.serviceType,
        basePrice: serviceTotal,
        quantity: orderConfig.quantity,
        unitPrice: rule.basePrice,
        officialFee: rule.officialFee * orderConfig.quantity,
        serviceFee: rule.serviceFee * orderConfig.quantity
      });
      console.log(`   ${rule.serviceType}: ${serviceTotal} kr (${orderConfig.quantity} × ${rule.basePrice} kr)`);
    }

    // Add return service
    expectedTotal += returnServicePrice;
    breakdown.push({
      service: 'return_service',
      fee: returnServicePrice,
      description: orderConfig.returnService
    });
    console.log(`   ${orderConfig.returnService}: ${returnServicePrice} kr`);

    console.log(`\n💰 Expected Total: ${expectedTotal.toLocaleString()} kr`);

    // Step 4: Simulate UI display calculation (the problematic one)
    console.log('\n🔍 Step 4: Simulating UI display calculation (current buggy method)...');

    // This simulates how the UI currently calculates price for display
    // It extracts numbers from price strings manually
    let uiCalculatedTotal = 0;

    // Mock service objects as they appear in the UI
    const mockServices = [
      { id: 'embassy', name: 'Ambassadlegalisering', price: 'Från 1295 kr' },
      { id: 'notarization', name: 'Notarisering', price: '1300 kr' },
      { id: 'ud', name: 'Utrikesdepartementet', price: '1750 kr' }
    ];

    // Mock return services as they appear in the UI
    const mockReturnServices = [
      { id: 'dhl-worldwide', name: 'DHL Worldwide', price: '350 kr' }
    ];

    // UI calculation logic (from bestall.tsx)
    orderConfig.services.forEach(serviceId => {
      const service = mockServices.find(s => s.id === serviceId);
      if (service && service.price) {
        const priceMatch = service.price.match(/(\d+)/);
        if (priceMatch) {
          const servicePrice = parseInt(priceMatch[1]) * orderConfig.quantity;
          uiCalculatedTotal += servicePrice;
          console.log(`   ${serviceId}: ${servicePrice} kr (extracted from "${service.price}")`);
        }
      }
    });

    // Add return service (UI method)
    const returnService = mockReturnServices.find(s => s.id === orderConfig.returnService);
    if (returnService && returnService.price) {
      const priceMatch = returnService.price.match(/(\d+)/);
      if (priceMatch) {
        const returnPrice = parseInt(priceMatch[1]);
        uiCalculatedTotal += returnPrice;
        console.log(`   ${orderConfig.returnService}: ${returnPrice} kr (extracted from "${returnService.price}")`);
      }
    }

    console.log(`\n💸 UI Display Total: ${uiCalculatedTotal.toLocaleString()} kr`);

    // Step 5: Compare calculations
    console.log('\n📊 Step 5: Comparison of calculations...');
    console.log(`   Expected Total (Firebase pricing): ${expectedTotal.toLocaleString()} kr`);
    console.log(`   UI Display Total (buggy method): ${uiCalculatedTotal.toLocaleString()} kr`);

    const difference = Math.abs(expectedTotal - uiCalculatedTotal);
    if (difference > 0) {
      console.log(`   ❌ PRICE MISMATCH: Difference of ${difference.toLocaleString()} kr`);
      console.log(`   🚨 CUSTOMERS SEE WRONG PRICE IN UI!`);
    } else {
      console.log(`   ✅ Prices match - no issue detected`);
    }

    // Step 6: Show detailed breakdown
    console.log('\n📋 Step 6: Detailed pricing breakdown...');
    console.log('Expected breakdown:');
    breakdown.forEach(item => {
      if (item.basePrice) {
        console.log(`   ${item.service}: ${item.basePrice} kr (${item.quantity || 1} × ${item.unitPrice} kr)`);
        console.log(`     - Official fee: ${item.officialFee} kr`);
        console.log(`     - Service fee: ${item.serviceFee} kr`);
      } else {
        console.log(`   ${item.service}: ${item.fee} kr (${item.description})`);
      }
    });

    console.log(`\n🎯 Final Result:`);
    console.log(`   Angola Embassy + Notary + Foreign Ministry order`);
    console.log(`   With DHL Worldwide shipping`);
    console.log(`   Correct total price: ${expectedTotal.toLocaleString()} kr`);
    if (difference > 0) {
      console.log(`   UI shows: ${uiCalculatedTotal.toLocaleString()} kr (WRONG!)`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testAngolaOrderPricing().then(() => {
  console.log('\n🏁 Pricing test completed');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Test execution failed:', error);
  process.exit(1);
});