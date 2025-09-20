// Add pricing rules for Kuwait with all service types
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

async function addKuwaitPricingRules() {
  console.log('🇰🇼 Adding comprehensive pricing rules for Kuwait...\n');

  try {
    // Kuwait pricing rules for all service types (Non-Hague Convention country)
    const kuwaitPricingRules = [
      {
        id: 'KW_embassy',
        countryCode: 'KW',
        countryName: 'Kuwait',
        serviceType: 'embassy',
        officialFee: 1200, // Official embassy fee
        serviceFee: 150,   // Service fee
        basePrice: 1350,   // Total price
        processingTime: { standard: 12 },
        currency: 'SEK',
        updatedBy: 'admin',
        isActive: true,
        lastUpdated: Timestamp.now()
      },
      {
        id: 'KW_notarization',
        countryCode: 'KW',
        countryName: 'Kuwait',
        serviceType: 'notarization',
        officialFee: 800,  // Official notary fee
        serviceFee: 150,   // Service fee
        basePrice: 950,    // Total price
        processingTime: { standard: 5 },
        currency: 'SEK',
        updatedBy: 'admin',
        isActive: true,
        lastUpdated: Timestamp.now()
      },
      {
        id: 'KW_translation',
        countryCode: 'KW',
        countryName: 'Kuwait',
        serviceType: 'translation',
        officialFee: 600,  // Official translation fee
        serviceFee: 150,   // Service fee
        basePrice: 750,    // Total price
        processingTime: { standard: 7 },
        currency: 'SEK',
        updatedBy: 'admin',
        isActive: true,
        lastUpdated: Timestamp.now()
      },
      {
        id: 'KW_chamber',
        countryCode: 'KW',
        countryName: 'Kuwait',
        serviceType: 'chamber',
        officialFee: 900,  // Official chamber fee
        serviceFee: 150,   // Service fee
        basePrice: 1050,   // Total price
        processingTime: { standard: 8 },
        currency: 'SEK',
        updatedBy: 'admin',
        isActive: true,
        lastUpdated: Timestamp.now()
      },
      {
        id: 'KW_ud',
        countryCode: 'KW',
        countryName: 'Kuwait',
        serviceType: 'ud',
        officialFee: 700,  // Official UD fee
        serviceFee: 150,   // Service fee
        basePrice: 850,    // Total price
        processingTime: { standard: 6 },
        currency: 'SEK',
        updatedBy: 'admin',
        isActive: true,
        lastUpdated: Timestamp.now()
      }
    ];

    console.log('📝 Adding pricing rules for Kuwait:');
    console.log('='.repeat(80));

    for (const rule of kuwaitPricingRules) {
      const ruleRef = doc(db, 'pricing', rule.id);
      await setDoc(ruleRef, rule);

      console.log(`✅ ${rule.countryName} ${rule.serviceType}:`);
      console.log(`   Officiell avgift: ${rule.officialFee}kr`);
      console.log(`   Serviceavgift: ${rule.serviceFee}kr`);
      console.log(`   Totalpris: ${rule.basePrice}kr`);
      console.log(`   Bearbetningstid: ${rule.processingTime.standard} dagar`);
      console.log('');
    }

    console.log('🎉 All Kuwait pricing rules added successfully!');
    console.log('');
    console.log('📊 Summary of Kuwait pricing:');
    console.log('='.repeat(50));
    kuwaitPricingRules.forEach(rule => {
      console.log(`${rule.serviceType.padEnd(12)}: ${rule.basePrice}kr (${rule.officialFee}kr + ${rule.serviceFee}kr)`);
    });
    console.log('='.repeat(50));
    console.log('');
    console.log('💡 Now when you select Kuwait, you should see prices for:');
    console.log('   • Embassy legalization');
    console.log('   • Notarization (Notarisering)');
    console.log('   • Translation (Översättning)');
    console.log('   • Chamber of Commerce (Handelskammaren)');
    console.log('   • UD legalization');
    console.log('');
    console.log('🔧 You can edit these prices in the admin panel at /admin/pricing');

  } catch (error) {
    console.error('❌ Failed to add Kuwait pricing rules:', error);
    console.error('Error details:', error.message);
  }
}

// Run the script
addKuwaitPricing().then(() => {
  console.log('\n🏁 Kuwait pricing setup completed');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Kuwait pricing setup failed:', error);
  process.exit(1);
});