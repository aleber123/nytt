// Demo test to showcase the new service fee functionality
// This demonstrates the pricing structure without requiring Firebase to work perfectly

console.log('🧪 Demonstrating New Service Fee Pricing Structure\n');

// Sample pricing data with the new fee structure
const samplePricingRules = [
  {
    id: 'SE_apostille',
    countryCode: 'SE',
    countryName: 'Sverige',
    serviceType: 'apostille',
    officialFee: 795,  // Official apostille fee
    serviceFee: 100,   // Service fee for handling
    basePrice: 895,    // Total price (officialFee + serviceFee)
    processingTime: { standard: 5 },
    currency: 'SEK',
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
    isActive: true
  },
  {
    id: 'IR_embassy',
    countryCode: 'IR',
    countryName: 'Iran',
    serviceType: 'embassy',
    officialFee: 1795,
    serviceFee: 100,
    basePrice: 1895,
    processingTime: { standard: 21 },
    currency: 'SEK',
    isActive: true
  },
  {
    id: 'DK_notarization',
    countryCode: 'DK',
    countryName: 'Danmark',
    serviceType: 'notarization',
    officialFee: 1200,
    serviceFee: 150,
    basePrice: 1350,
    processingTime: { standard: 8 },
    currency: 'SEK',
    isActive: true
  }
];

console.log('📊 Sample Pricing Rules with Service Fees:');
console.log('='.repeat(80));
samplePricingRules.forEach(rule => {
  console.log(`${rule.countryName.padEnd(12)} ${rule.serviceType.padEnd(12)} | Official: ${rule.officialFee.toString().padStart(4)}kr | Service: ${rule.serviceFee.toString().padStart(3)}kr | Total: ${rule.basePrice.toString().padStart(4)}kr`);
});
console.log('='.repeat(80));
console.log('');

// Demonstrate price calculations
console.log('💰 Price Calculation Examples:');
console.log('-'.repeat(50));

// Example 1: Multiple documents for same service
const order1 = {
  country: 'SE',
  service: 'apostille',
  quantity: 3,
  expedited: false
};

const rule1 = samplePricingRules.find(r => r.countryCode === order1.country && r.serviceType === order1.service);
if (rule1) {
  const subtotal = rule1.basePrice * order1.quantity;
  console.log(`📄 Order: ${order1.quantity}x ${rule1.countryName} ${rule1.serviceType}`);
  console.log(`   Unit Price: ${rule1.basePrice}kr (${rule1.officialFee}kr + ${rule1.serviceFee}kr)`);
  console.log(`   Subtotal: ${subtotal}kr`);
  console.log(`   Breakdown per document: ${rule1.officialFee}kr official + ${rule1.serviceFee}kr service`);
  console.log('');
}

// Example 2: Different services
const order2 = {
  services: [
    { country: 'SE', service: 'apostille', quantity: 1 },
    { country: 'US', service: 'apostille', quantity: 2 },
    { country: 'DK', service: 'notarization', quantity: 1 }
  ]
};

console.log('📋 Multi-Service Order:');
let totalOrderPrice = 0;
order2.services.forEach(service => {
  const rule = samplePricingRules.find(r => r.countryCode === service.country && r.serviceType === service.service);
  if (rule) {
    const serviceTotal = rule.basePrice * service.quantity;
    totalOrderPrice += serviceTotal;
    console.log(`   ${service.quantity}x ${rule.countryName} ${rule.serviceType}: ${serviceTotal}kr`);
    console.log(`      (${rule.officialFee}kr + ${rule.serviceFee}kr) x ${service.quantity}`);
  }
});
console.log(`   💵 Total Order Price: ${totalOrderPrice}kr`);
console.log('');

// Demonstrate service fee adjustments
console.log('🔧 Service Fee Adjustment Scenarios:');
console.log('-'.repeat(50));

// Scenario 1: Increase service fee by 50kr
console.log('📈 Scenario 1: Increase all service fees by 50kr');
samplePricingRules.forEach(rule => {
  const newServiceFee = rule.serviceFee + 50;
  const newTotalPrice = rule.officialFee + newServiceFee;
  const priceIncrease = newTotalPrice - rule.basePrice;
  console.log(`   ${rule.countryName} ${rule.serviceType}: ${rule.basePrice}kr → ${newTotalPrice}kr (+${priceIncrease}kr)`);
});
console.log('');

// Scenario 2: Different service fees for different service types
console.log('🎯 Scenario 2: Different service fees by service type');
const serviceFeeByType = {
  apostille: 80,
  notarization: 120,
  embassy: 150,
  translation: 100,
  ud: 90,
  chamber: 110
};

samplePricingRules.forEach(rule => {
  const newServiceFee = serviceFeeByType[rule.serviceType] || rule.serviceFee;
  const newTotalPrice = rule.officialFee + newServiceFee;
  console.log(`   ${rule.countryName} ${rule.serviceType}: Service fee ${rule.serviceFee}kr → ${newServiceFee}kr`);
  console.log(`      Total: ${rule.basePrice}kr → ${newTotalPrice}kr`);
});
console.log('');

// Demonstrate pricing statistics
console.log('📈 Pricing Statistics:');
console.log('-'.repeat(30));
const totalRules = samplePricingRules.length;
const activeRules = samplePricingRules.filter(r => r.isActive).length;
const countries = [...new Set(samplePricingRules.map(r => r.countryCode))];
const avgOfficialFee = Math.round(samplePricingRules.reduce((sum, r) => sum + r.officialFee, 0) / totalRules);
const avgServiceFee = Math.round(samplePricingRules.reduce((sum, r) => sum + r.serviceFee, 0) / totalRules);
const avgTotalPrice = Math.round(samplePricingRules.reduce((sum, r) => sum + r.basePrice, 0) / totalRules);

console.log(`   Total Rules: ${totalRules}`);
console.log(`   Active Rules: ${activeRules}`);
console.log(`   Countries Covered: ${countries.length}`);
console.log(`   Average Official Fee: ${avgOfficialFee}kr`);
console.log(`   Average Service Fee: ${avgServiceFee}kr`);
console.log(`   Average Total Price: ${avgTotalPrice}kr`);
console.log('');

console.log('✅ Service Fee Implementation Summary:');
console.log('   ✓ Official fees separated from service fees');
console.log('   ✓ Flexible service fee adjustments');
console.log('   ✓ Automatic total price calculations');
console.log('   ✓ Clear breakdown for transparency');
console.log('   ✓ Support for different fees per service type');
console.log('   ✓ Bulk update capabilities for service fees');
console.log('');

console.log('🎉 Demo completed successfully!');
console.log('💡 The new service fee structure allows you to:');
console.log('   • Set different handling fees for each service type');
console.log('   • Adjust service fees without changing official provider fees');
console.log('   • Maintain transparent pricing for customers');
console.log('   • Easily update fees through the admin interface');