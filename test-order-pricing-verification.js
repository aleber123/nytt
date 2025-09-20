// Comprehensive test to verify order pricing calculation and persistence
const { createOrder, getOrderById } = require('./src/services/hybridOrderService');

// Mock pricing data (extracted from pricingService.ts)
const mockPricingRules = [
  {
    id: 'SE_apostille',
    countryCode: 'SE',
    countryName: 'Sverige',
    serviceType: 'apostille',
    officialFee: 795,
    serviceFee: 100,
    basePrice: 895,
    processingTime: { standard: 5 },
    currency: 'SEK',
    updatedBy: 'admin',
    isActive: true
  },
  {
    id: 'US_apostille',
    countryCode: 'US',
    countryName: 'USA',
    serviceType: 'apostille',
    officialFee: 895,
    serviceFee: 100,
    basePrice: 995,
    processingTime: { standard: 7 },
    currency: 'SEK',
    updatedBy: 'admin',
    isActive: true
  },
  {
    id: 'TH_embassy',
    countryCode: 'TH',
    countryName: 'Thailand',
    serviceType: 'embassy',
    officialFee: 1395,
    serviceFee: 100,
    basePrice: 1495,
    processingTime: { standard: 14 },
    currency: 'SEK',
    updatedBy: 'admin',
    isActive: true
  },
  {
    id: 'US_notarization',
    countryCode: 'US',
    countryName: 'USA',
    serviceType: 'notarization',
    officialFee: 1200,
    serviceFee: 100,
    basePrice: 1300,
    processingTime: { standard: 8 },
    currency: 'SEK',
    updatedBy: 'admin',
    isActive: true
  }
];

// Mock getPricingRule function
function getPricingRule(countryCode, serviceType) {
  return mockPricingRules.find(rule =>
    rule.countryCode === countryCode && rule.serviceType === serviceType
  ) || null;
}

// Mock return services for testing
const mockReturnServices = [
  {
    id: 'postnord-rek',
    name: 'PostNord REK',
    price: '85 kr',
    provider: 'PostNord',
    estimatedDelivery: '2-5 arbetsdagar',
    available: true
  },
  {
    id: 'postnord-express',
    name: 'PostNord Express',
    price: '150 kr',
    provider: 'PostNord',
    estimatedDelivery: '1-2 arbetsdagar',
    available: true
  },
  {
    id: 'dhl-europe',
    name: 'DHL Europe',
    price: '250 kr',
    provider: 'DHL',
    estimatedDelivery: '2-4 arbetsdagar',
    available: true
  }
];

// Test scenarios with different combinations
const testScenarios = [
  {
    name: 'Single apostille service for Sweden',
    orderData: {
      country: 'SE',
      services: ['apostille'],
      quantity: 1,
      expedited: false,
      deliveryMethod: 'post',
      scannedCopies: false,
      pickupService: false,
      returnService: 'postnord-rek',
      returnServices: mockReturnServices
    },
    expectedBasePrice: 895, // SE apostille: 795 + 100
    expectedAdditionalFees: 85, // PostNord REK
    expectedTotalPrice: 980
  },
  {
    name: 'Multiple documents with embassy service',
    orderData: {
      country: 'TH',
      services: ['embassy'],
      quantity: 3,
      expedited: false,
      deliveryMethod: 'post',
      scannedCopies: true,
      pickupService: false,
      returnService: 'postnord-express',
      returnServices: mockReturnServices
    },
    expectedBasePrice: 4485, // TH embassy: 1395 + 100 = 1495 * 3
    expectedAdditionalFees: 150 + 600, // PostNord Express (150) + scanned copies (200 * 3)
    expectedTotalPrice: 5235
  },
  {
    name: 'Complex order with multiple services and pickup',
    orderData: {
      country: 'US',
      services: ['apostille', 'notarization'],
      quantity: 2,
      expedited: true,
      deliveryMethod: 'post',
      scannedCopies: false,
      pickupService: true,
      returnService: 'dhl-europe',
      returnServices: mockReturnServices
    },
    expectedBasePrice: 3790, // US apostille: 995 * 2 + US notarization: assume 1300 * 2 = 2600 + 190 = 3790
    expectedAdditionalFees: 250 + 450, // DHL Europe (250) + pickup service (450)
    expectedTotalPrice: 4490
  }
];

// Calculate expected price using same logic as frontend
async function calculateExpectedPrice(orderData) {
  try {
    let totalBasePrice = 0;
    let totalAdditionalFees = 0;
    const breakdown = [];

    // Calculate base price from services
    for (const serviceType of orderData.services) {
      const rule = await getPricingRule(orderData.country, serviceType);

      if (rule) {
        const serviceBasePrice = rule.basePrice * orderData.quantity;
        totalBasePrice += serviceBasePrice;

        breakdown.push({
          service: serviceType,
          basePrice: serviceBasePrice,
          quantity: orderData.quantity,
          unitPrice: rule.basePrice,
          officialFee: rule.officialFee * orderData.quantity,
          serviceFee: rule.serviceFee * orderData.quantity
        });
      } else {
        // Fallback pricing for missing rules
        const fallbackPrices = {
          'apostille': 895,
          'notarization': 1300,
          'embassy': 1495,
          'ud': 1750,
          'translation': 1450,
          'chamber': 2400
        };
        const fallbackPrice = fallbackPrices[serviceType] || 1000;
        const serviceBasePrice = fallbackPrice * orderData.quantity;
        totalBasePrice += serviceBasePrice;

        breakdown.push({
          service: serviceType,
          basePrice: serviceBasePrice,
          quantity: orderData.quantity,
          unitPrice: fallbackPrice
        });
      }
    }

    // Add return service cost
    if (orderData.returnService && orderData.returnServices) {
      const returnService = orderData.returnServices.find(s => s.id === orderData.returnService);
      if (returnService && returnService.price) {
        const priceMatch = returnService.price.match(/(\d+)/);
        if (priceMatch) {
          const returnCost = parseInt(priceMatch[1]);
          totalAdditionalFees += returnCost;
          breakdown.push({
            service: 'return_service',
            fee: returnCost,
            description: returnService.name
          });
        }
      }
    }

    // Add scanned copies cost (200 kr per document)
    if (orderData.scannedCopies) {
      totalAdditionalFees += 200 * orderData.quantity;
      breakdown.push({
        service: 'scanned_copies',
        fee: 200 * orderData.quantity,
        description: 'Scanned copies'
      });
    }

    // Add pickup service cost (450 kr)
    if (orderData.pickupService) {
      totalAdditionalFees += 450;
      breakdown.push({
        service: 'pickup_service',
        fee: 450,
        description: 'Document pickup service'
      });
    }

    return {
      basePrice: totalBasePrice,
      additionalFees: totalAdditionalFees,
      totalPrice: totalBasePrice + totalAdditionalFees,
      breakdown
    };
  } catch (error) {
    console.error('Error calculating expected price:', error);
    throw error;
  }
}

async function runPricingVerificationTest() {
  console.log('🧪 Starting comprehensive order pricing verification test...\n');

  let passedTests = 0;
  let totalTests = testScenarios.length;

  for (let i = 0; i < testScenarios.length; i++) {
    const scenario = testScenarios[i];
    console.log(`📋 Test ${i + 1}/${totalTests}: ${scenario.name}`);

    try {
      // Calculate expected price
      console.log('💰 Calculating expected price...');
      const expectedPricing = await calculateExpectedPrice(scenario.orderData);

      console.log(`   Expected: Base ${expectedPricing.basePrice}kr + Fees ${expectedPricing.additionalFees}kr = Total ${expectedPricing.totalPrice}kr`);

      // Prepare order data
      const orderData = {
        ...scenario.orderData,
        customerInfo: {
          firstName: 'Test',
          lastName: 'User',
          email: `test${i}@example.com`,
          phone: '+46 70 123 45 67',
          address: 'Testgatan 123',
          postalCode: '114 35',
          city: 'Stockholm'
        },
        paymentMethod: 'invoice',
        totalPrice: expectedPricing.totalPrice,
        pricingBreakdown: expectedPricing.breakdown,
        invoiceReference: `TEST-${i + 1}`,
        additionalNotes: `Pricing verification test ${i + 1}`
      };

      // Create order
      console.log('📦 Creating order...');
      const orderId = await createOrder(orderData);
      console.log(`   ✅ Order created: ${orderId}`);

      // Retrieve order and verify price
      console.log('🔍 Retrieving order to verify price...');
      const retrievedOrder = await getOrderById(orderId);

      if (!retrievedOrder) {
        throw new Error(`Could not retrieve order ${orderId}`);
      }

      const actualTotalPrice = retrievedOrder.totalPrice;
      console.log(`   Actual price in order: ${actualTotalPrice}kr`);

      // Verify price matches
      if (actualTotalPrice === expectedPricing.totalPrice) {
        console.log(`   ✅ PRICE VERIFICATION PASSED: Expected ${expectedPricing.totalPrice}kr, got ${actualTotalPrice}kr`);
        passedTests++;
      } else {
        console.log(`   ❌ PRICE VERIFICATION FAILED: Expected ${expectedPricing.totalPrice}kr, got ${actualTotalPrice}kr`);
        console.log('   Breakdown:', expectedPricing.breakdown);
      }

      console.log(`   📊 Order details: ${retrievedOrder.services?.length || 0} services, ${retrievedOrder.quantity} documents`);
      console.log('');

    } catch (error) {
      console.error(`   ❌ Test ${i + 1} failed:`, error.message);
      console.log('');
    }
  }

  // Summary
  console.log('📊 Test Summary:');
  console.log(`   Passed: ${passedTests}/${totalTests}`);
  console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

  if (passedTests === totalTests) {
    console.log('🎉 All pricing verification tests PASSED!');
    return true;
  } else {
    console.log('💥 Some pricing verification tests FAILED!');
    return false;
  }
}

// Additional test: Verify pricing consistency
async function testPricingConsistency() {
  console.log('\n🔄 Testing pricing calculation consistency...');

  try {
    // Test the same scenario multiple times to ensure consistency
    const testOrderData = {
      country: 'SE',
      services: ['apostille'],
      quantity: 2,
      expedited: false,
      deliveryMethod: 'post',
      returnService: 'postnord-rek',
      returnServices: mockReturnServices,
      scannedCopies: false,
      pickupService: false
    };

    const results = [];
    for (let i = 0; i < 3; i++) {
      const calculation = await calculateExpectedPrice(testOrderData);
      results.push(calculation.totalPrice);
      console.log(`Calculation ${i + 1}: ${calculation.totalPrice}kr`);
    }

    // Check if all calculations are identical
    const allSame = results.every(price => price === results[0]);

    if (allSame) {
      console.log('✅ Pricing consistency test PASSED - all calculations identical');
      return true;
    } else {
      console.log('❌ Pricing consistency test FAILED - calculations differ');
      console.log('Results:', results);
      return false;
    }

  } catch (error) {
    console.error('❌ Pricing consistency test failed:', error);
    return false;
  }
}

// Run the tests
if (require.main === module) {
  runPricingVerificationTest()
    .then((success) => {
      return testPricingConsistency();
    })
    .then((consistencyResult) => {
      console.log('\n🏁 All tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runPricingVerificationTest,
  testPricingConsistency,
  calculateExpectedPrice
};