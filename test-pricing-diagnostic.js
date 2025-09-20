const {
  setPricingRule,
  getPricingRule,
  getAllActivePricingRules,
  updatePricingRule,
  bulkUpdatePricing,
  calculateOrderPrice,
  getPricingStats,
  initializeDefaultPricing
} = require('./src/firebase/pricingService.ts');

async function runPricingDiagnostic() {
  console.log('🔍 Starting comprehensive pricing system diagnostic...\n');

  const results = {
    firebaseConnection: false,
    pricingRules: [],
    priceUpdates: [],
    frontendVerification: [],
    errors: []
  };

  try {
    // Test 1: Firebase Connection
    console.log('1️⃣ Testing Firebase Connection...');
    try {
      const rules = await getAllActivePricingRules();
      results.firebaseConnection = true;
      results.pricingRules = rules;
      console.log(`✅ Firebase connected - Found ${rules.length} pricing rules`);
    } catch (error) {
      results.errors.push(`Firebase connection failed: ${error.message}`);
      console.log(`❌ Firebase connection failed: ${error.message}`);
      console.log('🔄 Falling back to mock data for testing');
    }

    // Test 2: Initialize Default Pricing
    console.log('\n2️⃣ Testing Default Pricing Initialization...');
    try {
      await initializeDefaultPricing();
      console.log('✅ Default pricing initialized successfully');
    } catch (error) {
      results.errors.push(`Default pricing initialization failed: ${error.message}`);
      console.log(`❌ Default pricing initialization failed: ${error.message}`);
    }

    // Test 3: Create Test Pricing Rules for Different Countries
    console.log('\n3️⃣ Creating Test Pricing Rules for Different Countries...');

    const testCountries = [
      { code: 'SE', name: 'Sverige', service: 'apostille', officialFee: 850, serviceFee: 100 },
      { code: 'DK', name: 'Danmark', service: 'apostille', officialFee: 900, serviceFee: 120 },
      { code: 'NO', name: 'Norge', service: 'notarization', officialFee: 1200, serviceFee: 150 },
      { code: 'FI', name: 'Finland', service: 'translation', officialFee: 1350, serviceFee: 130 },
      { code: 'DE', name: 'Tyskland', service: 'embassy', officialFee: 2000, serviceFee: 200 },
      { code: 'FR', name: 'Frankrike', service: 'apostille', officialFee: 950, serviceFee: 110 },
      { code: 'GB', name: 'Storbritannien', service: 'chamber', officialFee: 2300, serviceFee: 180 },
      { code: 'US', name: 'USA', service: 'apostille', officialFee: 895, serviceFee: 105 },
      { code: 'IR', name: 'Iran', service: 'embassy', officialFee: 1795, serviceFee: 155 },
      { code: 'TH', name: 'Thailand', service: 'embassy', officialFee: 1395, serviceFee: 125 }
    ];

    const createdRules = [];
    for (const country of testCountries) {
      try {
        const ruleData = {
          countryCode: country.code,
          countryName: country.name,
          serviceType: country.service,
          officialFee: country.officialFee,
          serviceFee: country.serviceFee,
          basePrice: country.officialFee + country.serviceFee,
          processingTime: { standard: 5 + Math.floor(Math.random() * 10) },
          currency: 'SEK',
          updatedBy: 'diagnostic-test',
          isActive: true
        };

        const ruleId = await setPricingRule(ruleData);
        createdRules.push({ ...ruleData, id: ruleId });
        console.log(`✅ Created ${country.name} ${country.service}: ${country.officialFee}kr + ${country.serviceFee}kr = ${ruleData.basePrice}kr`);
      } catch (error) {
        results.errors.push(`Failed to create ${country.name} rule: ${error.message}`);
        console.log(`❌ Failed to create ${country.name} rule: ${error.message}`);
      }
    }

    // Test 4: Verify Created Rules
    console.log('\n4️⃣ Verifying Created Pricing Rules...');
    for (const rule of createdRules.slice(0, 3)) { // Test first 3
      try {
        const retrievedRule = await getPricingRule(rule.countryCode, rule.serviceType);
        if (retrievedRule) {
          const match = retrievedRule.officialFee === rule.officialFee &&
                       retrievedRule.serviceFee === rule.serviceFee &&
                       retrievedRule.basePrice === rule.basePrice;
          console.log(`${match ? '✅' : '❌'} ${rule.countryName}: Retrieved ${retrievedRule.officialFee}kr + ${retrievedRule.serviceFee}kr = ${retrievedRule.basePrice}kr`);
        } else {
          console.log(`❌ ${rule.countryName}: Rule not found`);
        }
      } catch (error) {
        console.log(`❌ ${rule.countryName}: Retrieval failed - ${error.message}`);
      }
    }

    // Test 5: Update Pricing Rules
    console.log('\n5️⃣ Testing Price Updates...');
    if (createdRules.length > 0) {
      const ruleToUpdate = createdRules[0];
      try {
        await updatePricingRule(ruleToUpdate.id, {
          serviceFee: ruleToUpdate.serviceFee + 50,
          basePrice: ruleToUpdate.basePrice + 50,
          updatedBy: 'diagnostic-update-test'
        });

        const updatedRule = await getPricingRule(ruleToUpdate.countryCode, ruleToUpdate.serviceType);
        if (updatedRule && updatedRule.serviceFee === ruleToUpdate.serviceFee + 50) {
          console.log(`✅ Price update successful: ${ruleToUpdate.countryName} service fee increased by 50kr`);
          results.priceUpdates.push({
            country: ruleToUpdate.countryName,
            oldPrice: ruleToUpdate.basePrice,
            newPrice: updatedRule.basePrice,
            success: true
          });
        } else {
          console.log(`❌ Price update failed for ${ruleToUpdate.countryName}`);
        }
      } catch (error) {
        console.log(`❌ Price update error: ${error.message}`);
        results.errors.push(`Price update failed: ${error.message}`);
      }
    }

    // Test 6: Bulk Price Updates
    console.log('\n6️⃣ Testing Bulk Price Updates...');
    try {
      const bulkUpdateData = {
        countryCodes: ['SE', 'DK', 'NO'],
        serviceTypes: ['apostille', 'notarization'],
        priceAdjustment: 25,
        adjustmentType: 'fixed',
        reason: 'Diagnostic bulk update test',
        updatedBy: 'diagnostic-bulk-test'
      };

      await bulkUpdatePricing(bulkUpdateData);
      console.log('✅ Bulk price update completed');

      // Verify bulk update
      const seRule = await getPricingRule('SE', 'apostille');
      if (seRule) {
        console.log(`✅ SE apostille after bulk update: ${seRule.serviceFee}kr service fee`);
      }
    } catch (error) {
      console.log(`❌ Bulk update failed: ${error.message}`);
      results.errors.push(`Bulk update failed: ${error.message}`);
    }

    // Test 7: Price Calculations
    console.log('\n7️⃣ Testing Price Calculations...');
    const testOrders = [
      { country: 'SE', services: ['apostille'], quantity: 2 },
      { country: 'DK', services: ['apostille'], quantity: 1 },
      { country: 'NO', services: ['notarization'], quantity: 3 }
    ];

    for (const order of testOrders) {
      try {
        const priceResult = await calculateOrderPrice({
          ...order,
          expedited: false,
          deliveryMethod: 'post'
        });

        console.log(`✅ ${order.country} ${order.services[0]} x${order.quantity}:`);
        console.log(`   Base Price: ${priceResult.basePrice}kr`);
        console.log(`   Additional Fees: ${priceResult.additionalFees}kr`);
        console.log(`   Total Price: ${priceResult.totalPrice}kr`);

        if (priceResult.breakdown && priceResult.breakdown.length > 0) {
          const breakdown = priceResult.breakdown[0];
          if (breakdown.officialFee !== undefined) {
            console.log(`   Breakdown: ${breakdown.officialFee}kr (official) + ${breakdown.serviceFee}kr (service)`);
          }
        }
      } catch (error) {
        console.log(`❌ Price calculation failed for ${order.country}: ${error.message}`);
        results.errors.push(`Price calculation failed for ${order.country}: ${error.message}`);
      }
    }

    // Test 8: Frontend Verification Simulation
    console.log('\n8️⃣ Simulating Frontend Price Display...');
    try {
      const allRules = await getAllActivePricingRules();
      const frontendPrices = {};

      // Group by service type
      allRules.forEach(rule => {
        if (!frontendPrices[rule.serviceType]) {
          frontendPrices[rule.serviceType] = [];
        }
        frontendPrices[rule.serviceType].push({
          country: rule.countryName,
          price: rule.basePrice,
          officialFee: rule.officialFee,
          serviceFee: rule.serviceFee
        });
      });

      console.log('✅ Frontend price simulation:');
      Object.entries(frontendPrices).forEach(([service, countries]) => {
        console.log(`   ${service}: ${countries.length} countries`);
        countries.slice(0, 2).forEach(country => {
          console.log(`     ${country.country}: ${country.price}kr (${country.officialFee}kr + ${country.serviceFee}kr)`);
        });
      });

      results.frontendVerification = frontendPrices;
    } catch (error) {
      console.log(`❌ Frontend verification failed: ${error.message}`);
      results.errors.push(`Frontend verification failed: ${error.message}`);
    }

    // Test 9: Performance Test
    console.log('\n9️⃣ Performance Testing...');
    const startTime = Date.now();
    try {
      for (let i = 0; i < 10; i++) {
        await getAllActivePricingRules();
      }
      const endTime = Date.now();
      const avgTime = (endTime - startTime) / 10;
      console.log(`✅ Performance test: Average ${avgTime.toFixed(2)}ms per request`);
    } catch (error) {
      console.log(`❌ Performance test failed: ${error.message}`);
    }

  } catch (error) {
    results.errors.push(`Diagnostic failed: ${error.message}`);
    console.log(`❌ Diagnostic failed: ${error.message}`);
  }

  // Summary
  console.log('\n📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(50));
  console.log(`Firebase Connection: ${results.firebaseConnection ? '✅ Working' : '❌ Failed'}`);
  console.log(`Pricing Rules Created: ${results.pricingRules.length}`);
  console.log(`Price Updates Tested: ${results.priceUpdates.length}`);
  console.log(`Frontend Verification: ${Object.keys(results.frontendVerification).length} services`);
  console.log(`Errors Found: ${results.errors.length}`);

  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS DETECTED:');
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  console.log('\n🔧 RECOMMENDATIONS:');
  if (!results.firebaseConnection) {
    console.log('   • Fix Firebase connection issues');
    console.log('   • Check Firebase configuration');
    console.log('   • Verify network connectivity');
  }
  if (results.errors.length > 0) {
    console.log('   • Address the errors listed above');
    console.log('   • Check Firebase security rules');
    console.log('   • Verify data structure compatibility');
  }
  console.log('   • Test with real Firebase data');
  console.log('   • Monitor performance in production');

  return results;
}

// Export for use in other tests
module.exports = { runPricingDiagnostic };

// Run if called directly
if (require.main === module) {
  runPricingDiagnostic().then(() => {
    console.log('\n🏁 Diagnostic completed');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Diagnostic failed:', error);
    process.exit(1);
  });
}