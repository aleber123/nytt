const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  getDocs,
  query,
  where
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

async function checkPricingRules() {
  console.log('📊 Checking all pricing rules in Firebase...\n');

  try {
    // Get all pricing rules
    const pricingRef = collection(db, 'pricing');
    const pricingSnapshot = await getDocs(pricingRef);

    console.log(`📋 Found ${pricingSnapshot.size} total pricing rules\n`);

    // Group by country
    const rulesByCountry = {};
    const allRules = [];

    pricingSnapshot.forEach((doc) => {
      const data = doc.data();
      allRules.push(data);

      const country = data.countryCode;
      if (!rulesByCountry[country]) {
        rulesByCountry[country] = [];
      }
      rulesByCountry[country].push(data);
    });

    // Show countries with rules
    console.log('🌍 Countries with pricing rules:');
    Object.keys(rulesByCountry).sort().forEach(countryCode => {
      const rules = rulesByCountry[countryCode];
      const countryName = rules[0].countryName;
      console.log(`   ${countryCode} (${countryName}): ${rules.length} services`);
    });

    console.log('');

    // Check specifically for GB (Great Britain)
    console.log('🇬🇧 Checking Great Britain (GB) pricing rules:');
    if (rulesByCountry['GB']) {
      console.log('   ✅ GB pricing rules found:');
      rulesByCountry['GB'].forEach(rule => {
        console.log(`      ${rule.serviceType}: ${rule.basePrice} kr (${rule.officialFee} + ${rule.serviceFee})`);
      });
    } else {
      console.log('   ❌ No GB pricing rules found!');
    }

    console.log('');

    // Check for Sweden (SE) as comparison
    console.log('🇸🇪 Sweden (SE) pricing rules for comparison:');
    if (rulesByCountry['SE']) {
      rulesByCountry['SE'].forEach(rule => {
        console.log(`   ${rule.serviceType}: ${rule.basePrice} kr (${rule.officialFee} + ${rule.serviceFee})`);
      });
    } else {
      console.log('   ❌ No SE pricing rules found!');
    }

    console.log('');

    // Analyze the issue
    console.log('🔍 Analysis for Order SWE000044:');
    console.log('   Order details: GB country, services: [notarization, apostille, chamber]');
    console.log('   Current status: Missing GB pricing rules');
    console.log('');

    if (!rulesByCountry['GB']) {
      console.log('💡 SOLUTION: Need to add GB pricing rules');
      console.log('   Suggested GB prices (based on similar countries):');

      // Suggest prices based on similar countries
      const similarCountries = ['SE', 'NO', 'DK', 'FI']; // Nordic countries
      const avgPrices = {};

      similarCountries.forEach(country => {
        if (rulesByCountry[country]) {
          rulesByCountry[country].forEach(rule => {
            if (!avgPrices[rule.serviceType]) {
              avgPrices[rule.serviceType] = { total: 0, count: 0 };
            }
            avgPrices[rule.serviceType].total += rule.basePrice;
            avgPrices[rule.serviceType].count++;
          });
        }
      });

      Object.keys(avgPrices).forEach(serviceType => {
        const avg = Math.round(avgPrices[serviceType].total / avgPrices[serviceType].count);
        console.log(`      GB_${serviceType}: ${avg} kr (estimated)`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking pricing rules:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the check
checkPricingRules().then(() => {
  console.log('\n🏁 Pricing rules check completed');
}).catch(error => {
  console.error('\n💥 Check failed:', error);
});