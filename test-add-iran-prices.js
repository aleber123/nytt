// Add pricing rules for Iran with all service types
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

async function addIranPricingRules() {
  console.log('🇮🇷 Adding comprehensive pricing rules for Iran...\n');

  try {
    // Iran pricing rules for all service types
    const iranPricingRules = [
      {
        id: 'IR_apostille',
        countryCode: 'IR',
        countryName: 'Iran',
        serviceType: 'apostille',
        officialFee: 1795,
        serviceFee: 100,
        basePrice: 1895,
        processingTime: { standard: 21 },
        currency: 'SEK',
        updatedBy: 'admin',
        isActive: true,
        lastUpdated: Timestamp.now()
      },
      {
        id: 'IR_notarization',
        countryCode: 'IR',
        countryName: 'Iran',
        serviceType: 'notarization',
        officialFee: 1450,
        serviceFee: 120,
        basePrice: 1570,
        processingTime: { standard: 14 },
        currency: 'SEK',
        updatedBy: 'admin',
        isActive: true,
        lastUpdated: Timestamp.now()
      },
      {
        id: 'IR_translation',
        countryCode: 'IR',
        countryName: 'Iran',
        serviceType: 'translation',
        officialFee: 1200,
        serviceFee: 150,
        basePrice: 1350,
        processingTime: { standard: 10 },
        currency: 'SEK',
        updatedBy: 'admin',
        isActive: true,
        lastUpdated: Timestamp.now()
      },
      {
        id: 'IR_chamber',
        countryCode: 'IR',
        countryName: 'Iran',
        serviceType: 'chamber',
        officialFee: 2100,
        serviceFee: 200,
        basePrice: 2300,
        processingTime: { standard: 28 },
        currency: 'SEK',
        updatedBy: 'admin',
        isActive: true,
        lastUpdated: Timestamp.now()
      },
      {
        id: 'IR_embassy',
        countryCode: 'IR',
        countryName: 'Iran',
        serviceType: 'embassy',
        officialFee: 1895,
        serviceFee: 100,
        basePrice: 1995,
        processingTime: { standard: 21 },
        currency: 'SEK',
        updatedBy: 'admin',
        isActive: true,
        lastUpdated: Timestamp.now()
      },
      {
        id: 'IR_ud',
        countryCode: 'IR',
        countryName: 'Iran',
        serviceType: 'ud',
        officialFee: 1650,
        serviceFee: 130,
        basePrice: 1780,
        processingTime: { standard: 18 },
        currency: 'SEK',
        updatedBy: 'admin',
        isActive: true,
        lastUpdated: Timestamp.now()
      }
    ];

    console.log('📝 Adding pricing rules for Iran:');
    console.log('='.repeat(80));

    for (const rule of iranPricingRules) {
      const ruleRef = doc(db, 'pricing', rule.id);
      await setDoc(ruleRef, rule);

      console.log(`✅ ${rule.countryName} ${rule.serviceType}:`);
      console.log(`   Officiell avgift: ${rule.officialFee}kr`);
      console.log(`   Serviceavgift: ${rule.serviceFee}kr`);
      console.log(`   Totalpris: ${rule.basePrice}kr`);
      console.log(`   Bearbetningstid: ${rule.processingTime.standard} dagar`);
      console.log('');
    }

    console.log('🎉 All Iran pricing rules added successfully!');
    console.log('');
    console.log('📊 Summary of Iran pricing:');
    console.log('='.repeat(50));
    iranPricingRules.forEach(rule => {
      console.log(`${rule.serviceType.padEnd(12)}: ${rule.basePrice}kr (${rule.officialFee}kr + ${rule.serviceFee}kr)`);
    });
    console.log('='.repeat(50));
    console.log('');
    console.log('💡 Now when you select Iran, you should see prices for:');
    console.log('   • Apostille legalization');
    console.log('   • Notarization (Notarisering)');
    console.log('   • Translation (Översättning)');
    console.log('   • Chamber of Commerce (Handelskammaren)');
    console.log('   • Embassy legalization');
    console.log('   • UD legalization');
    console.log('');
    console.log('🔧 You can edit these prices in the admin panel at /admin/pricing');

  } catch (error) {
    console.error('❌ Failed to add Iran pricing rules:', error);
    console.error('Error details:', error.message);
  }
}

// Run the script
addIranPricingRules().then(() => {
  console.log('\n🏁 Iran pricing rules setup completed');
}).catch(error => {
  console.error('\n💥 Setup failed:', error);
  process.exit(1);
});