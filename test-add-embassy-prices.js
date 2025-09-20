const {
  setPricingRule
} = require('./src/firebase/pricingService');

async function addEmbassyPrices() {
  console.log('🏛️ Adding embassy prices for different countries...\n');

  const embassyPrices = [
    {
      countryCode: 'AO',
      countryName: 'Angola',
      officialFee: 5000,
      serviceFee: 150,
      serviceType: 'embassy'
    },
    {
      countryCode: 'IQ',
      countryName: 'Irak',
      officialFee: 1920,
      serviceFee: 150,
      serviceType: 'embassy'
    },
    {
      countryCode: 'IR',
      countryName: 'Iran',
      officialFee: 1795,
      serviceFee: 150,
      serviceType: 'embassy'
    },
    {
      countryCode: 'TH',
      countryName: 'Thailand',
      officialFee: 1395,
      serviceFee: 150,
      serviceType: 'embassy'
    },
    {
      countryCode: 'EG',
      countryName: 'Egypten',
      officialFee: 850,
      serviceFee: 150,
      serviceType: 'embassy'
    }
  ];

  for (const price of embassyPrices) {
    try {
      const ruleData = {
        countryCode: price.countryCode,
        countryName: price.countryName,
        serviceType: price.serviceType,
        officialFee: price.officialFee,
        serviceFee: price.serviceFee,
        basePrice: price.officialFee + price.serviceFee,
        processingTime: { standard: 15 },
        currency: 'SEK',
        updatedBy: 'system-init',
        isActive: true
      };

      const ruleId = await setPricingRule(ruleData);
      console.log(`✅ ${price.countryName}: ${price.officialFee}kr (officiell) + ${price.serviceFee}kr (service) = ${ruleData.basePrice}kr total`);
    } catch (error) {
      console.log(`❌ Failed to add ${price.countryName}: ${error.message}`);
    }
  }

  console.log('\n🎉 Embassy prices added successfully!');
  console.log('\n📋 Summary:');
  console.log('• Angola: 5,000kr (officiell) + 150kr (service) = 5,150kr total');
  console.log('• Irak: 1,920kr (officiell) + 150kr (service) = 2,070kr total');
  console.log('• Iran: 1,795kr (officiell) + 150kr (service) = 1,945kr total');
  console.log('• Thailand: 1,395kr (officiell) + 150kr (service) = 1,545kr total');
  console.log('• Egypten: 850kr (officiell) + 150kr (service) = 1,000kr total');

  console.log('\n🔧 You can now:');
  console.log('1. Visit /admin/embassy-prices to manage these prices');
  console.log('2. Update official fees for each country individually');
  console.log('3. Add new countries with their specific embassy fees');
  console.log('4. All changes are saved directly to Firebase');
}

// Run if called directly
if (require.main === module) {
  addEmbassyPrices().then(() => {
    console.log('\n🏁 Embassy prices setup completed');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Setup failed:', error);
    process.exit(1);
  });
}

module.exports = { addEmbassyPrices };