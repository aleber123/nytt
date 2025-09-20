const {
  getPricingRule
} = require('./src/services/mockPricingService');

async function testStandardPrices() {
  console.log('🧪 Testing standard prices for core services...\n');

  const services = ['apostille', 'notarization', 'translation', 'ud', 'embassy'];

  for (const serviceType of services) {
    try {
      const pricingRule = await getPricingRule('GLOBAL', serviceType);
      if (pricingRule) {
        console.log(`✅ ${serviceType}: ${pricingRule.basePrice} kr total (${pricingRule.officialFee}kr officiell + ${pricingRule.serviceFee}kr service)`);
      } else {
        console.log(`❌ ${serviceType}: No pricing found`);
      }
    } catch (error) {
      console.log(`❌ Failed to get ${serviceType}: ${error.message}`);
    }
  }

  console.log('\n🎉 Standard prices test completed!');
  console.log('\n📋 Expected prices:');
  console.log('• Apostille: 645 kr (545 + 100)');
  console.log('• Notarization: 695 kr (595 + 100)');
  console.log('• Translation: 995 kr (895 + 100)');
  console.log('• UD: 795 kr (695 + 100)');
  console.log('• Embassy: 1295 kr (1195 + 100)');

  console.log('\n🔧 Frontend should now show these prices instead of "Kontakta oss"');
}

// Run if called directly
if (require.main === module) {
  testStandardPrices().then(() => {
    console.log('\n🏁 Standard prices test completed');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testStandardPrices };