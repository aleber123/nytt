// Add comprehensive pricing rules for ALL countries with ALL service types
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, Timestamp } = require('firebase/firestore');

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

// Country data with realistic pricing
const countries = [
  { code: 'SE', name: 'Sverige', category: 'EU' },
  { code: 'DK', name: 'Danmark', category: 'EU' },
  { code: 'NO', name: 'Norge', category: 'EU' },
  { code: 'FI', name: 'Finland', category: 'EU' },
  { code: 'DE', name: 'Tyskland', category: 'EU' },
  { code: 'FR', name: 'Frankrike', category: 'EU' },
  { code: 'GB', name: 'Storbritannien', category: 'EU' },
  { code: 'NL', name: 'Nederländerna', category: 'EU' },
  { code: 'BE', name: 'Belgien', category: 'EU' },
  { code: 'IT', name: 'Italien', category: 'EU' },
  { code: 'ES', name: 'Spanien', category: 'EU' },
  { code: 'PT', name: 'Portugal', category: 'EU' },
  { code: 'AT', name: 'Österrike', category: 'EU' },
  { code: 'CH', name: 'Schweiz', category: 'EU' },
  { code: 'US', name: 'USA', category: 'Non-EU' },
  { code: 'CA', name: 'Kanada', category: 'Non-EU' },
  { code: 'AU', name: 'Australien', category: 'Non-EU' },
  { code: 'NZ', name: 'Nya Zeeland', category: 'Non-EU' },
  { code: 'JP', name: 'Japan', category: 'Non-EU' },
  { code: 'KR', name: 'Sydkorea', category: 'Non-EU' },
  { code: 'CN', name: 'Kina', category: 'Non-EU' },
  { code: 'IN', name: 'Indien', category: 'Non-EU' },
  { code: 'BR', name: 'Brasilien', category: 'Non-EU' },
  { code: 'MX', name: 'Mexiko', category: 'Non-EU' },
  { code: 'AR', name: 'Argentina', category: 'Non-EU' },
  { code: 'ZA', name: 'Sydafrika', category: 'Non-EU' },
  { code: 'EG', name: 'Egypten', category: 'Non-EU' },
  { code: 'TR', name: 'Turkiet', category: 'Non-EU' },
  { code: 'TH', name: 'Thailand', category: 'Non-EU' },
  { code: 'VN', name: 'Vietnam', category: 'Non-EU' },
  { code: 'MY', name: 'Malaysia', category: 'Non-EU' },
  { code: 'SG', name: 'Singapore', category: 'Non-EU' },
  { code: 'PH', name: 'Filippinerna', category: 'Non-EU' },
  { code: 'ID', name: 'Indonesien', category: 'Non-EU' },
  { code: 'IR', name: 'Iran', category: 'Non-EU' },
  { code: 'PK', name: 'Pakistan', category: 'Non-EU' },
  { code: 'BD', name: 'Bangladesh', category: 'Non-EU' },
  { code: 'LK', name: 'Sri Lanka', category: 'Non-EU' },
  { code: 'NP', name: 'Nepal', category: 'Non-EU' },
  { code: 'MM', name: 'Myanmar', category: 'Non-EU' }
];

// Service types with pricing multipliers
const serviceTypes = {
  apostille: { name: 'Apostille', baseMultiplier: 1.0, processingDays: 5 },
  notarization: { name: 'Notarization', baseMultiplier: 1.2, processingDays: 8 },
  translation: { name: 'Translation', baseMultiplier: 0.8, processingDays: 7 },
  chamber: { name: 'Chamber of Commerce', baseMultiplier: 1.5, processingDays: 12 },
  embassy: { name: 'Embassy', baseMultiplier: 1.3, processingDays: 15 },
  ud: { name: 'UD', baseMultiplier: 1.1, processingDays: 10 }
};

// Base prices by country category
const basePrices = {
  EU: {
    apostille: 895,
    notarization: 1200,
    translation: 950,
    chamber: 1450,
    embassy: 1200,
    ud: 1050
  },
  'Non-EU': {
    apostille: 1295,
    notarization: 1800,
    translation: 1350,
    chamber: 2200,
    embassy: 1950,
    ud: 1600
  }
};

// Service fee percentages by service type
const serviceFeePercentages = {
  apostille: 0.11,      // 11% service fee
  notarization: 0.13,   // 13% service fee
  translation: 0.14,    // 14% service fee
  chamber: 0.15,        // 15% service fee
  embassy: 0.12,        // 12% service fee
  ud: 0.12              // 12% service fee
};

async function generatePricingRules() {
  console.log('🌍 Generating comprehensive pricing rules for ALL countries...\n');

  const allPricingRules = [];
  let totalRules = 0;

  for (const country of countries) {
    const countryBasePrices = basePrices[country.category];

    for (const [serviceKey, serviceInfo] of Object.entries(serviceTypes)) {
      const basePrice = countryBasePrices[serviceKey];
      const officialFee = Math.round(basePrice * serviceInfo.baseMultiplier);
      const serviceFeePercentage = serviceFeePercentages[serviceKey];
      const serviceFee = Math.round(officialFee * serviceFeePercentage);
      const totalPrice = officialFee + serviceFee;

      const rule = {
        id: `${country.code}_${serviceKey}`,
        countryCode: country.code,
        countryName: country.name,
        serviceType: serviceKey,
        officialFee: officialFee,
        serviceFee: serviceFee,
        basePrice: totalPrice,
        processingTime: { standard: serviceInfo.processingDays },
        currency: 'SEK',
        updatedBy: 'system-bulk',
        isActive: true,
        lastUpdated: Timestamp.now()
      };

      allPricingRules.push(rule);
      totalRules++;
    }
  }

  console.log(`📊 Generated ${totalRules} pricing rules for ${countries.length} countries`);
  console.log(`   - ${Object.keys(serviceTypes).length} service types per country`);
  console.log(`   - EU countries: ${countries.filter(c => c.category === 'EU').length}`);
  console.log(`   - Non-EU countries: ${countries.filter(c => c.category === 'Non-EU').length}\n`);

  return allPricingRules;
}

async function savePricingRulesToFirebase(rules) {
  console.log('💾 Saving pricing rules to Firebase...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const rule of rules) {
    try {
      const ruleRef = doc(db, 'pricing', rule.id);
      await setDoc(ruleRef, rule);
      successCount++;

      if (successCount % 50 === 0) {
        console.log(`✅ Saved ${successCount}/${rules.length} rules...`);
      }
    } catch (error) {
      console.error(`❌ Failed to save ${rule.id}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n🎉 Firebase save complete!`);
  console.log(`✅ Successfully saved: ${successCount} rules`);
  if (errorCount > 0) {
    console.log(`❌ Failed to save: ${errorCount} rules`);
  }
}

async function displaySamplePricing() {
  console.log('\n📋 Sample pricing for different countries:\n');

  const sampleCountries = ['SE', 'US', 'IR', 'TH'];
  const sampleServices = ['apostille', 'notarization', 'translation', 'chamber'];

  console.log('='.repeat(100));
  console.log('Land'.padEnd(15) + 'Tjänst'.padEnd(15) + 'Officiell'.padStart(12) + 'Service'.padStart(10) + 'Total'.padStart(10));
  console.log('='.repeat(100));

  for (const countryCode of sampleCountries) {
    for (const service of sampleServices) {
      const ruleId = `${countryCode}_${service}`;
      try {
        const ruleRef = doc(db, 'pricing', ruleId);
        const ruleSnap = await ruleRef.get();

        if (ruleSnap.exists()) {
          const data = ruleSnap.data();
          const countryName = countries.find(c => c.code === countryCode)?.name || countryCode;
          const serviceName = serviceTypes[service]?.name || service;

          console.log(
            countryName.padEnd(15) +
            serviceName.padEnd(15) +
            `${data.officialFee}kr`.padStart(12) +
            `${data.serviceFee}kr`.padStart(10) +
            `${data.basePrice}kr`.padStart(10)
          );
        }
      } catch (error) {
        console.log(`${countryCode} ${service}: Error reading data`);
      }
    }
    console.log('-'.repeat(100));
  }
}

async function main() {
  try {
    console.log('🚀 Starting comprehensive pricing setup...\n');

    // Generate all pricing rules
    const pricingRules = await generatePricingRules();

    // Save to Firebase
    await savePricingRulesToFirebase(pricingRules);

    // Display sample pricing
    await displaySamplePricing();

    console.log('\n🎯 Setup Summary:');
    console.log('✅ All countries now have pricing for all service types');
    console.log('✅ Each service has separate official fee + service fee');
    console.log('✅ Prices are categorized by EU vs Non-EU countries');
    console.log('✅ All data saved to Firebase');
    console.log('\n🔧 You can now:');
    console.log('   • Edit any country\'s service fees in the admin panel');
    console.log('   • Add new countries with complete pricing');
    console.log('   • Bulk update service fees across countries');
    console.log('   • See transparent pricing breakdown for customers');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.error('Error details:', error.message);
  }
}

// Run the setup
main().then(() => {
  console.log('\n🏁 Comprehensive pricing setup completed!');
}).catch(error => {
  console.error('\n💥 Setup failed:', error);
  process.exit(1);
});