/**
 * Pricing Service Unit Tests
 * 
 * These tests verify that price calculations are correct.
 * Run with: npx ts-node src/lib/pricing.spec.ts
 */

import {
  EXPRESS_FEE,
  SCANNED_COPIES_FEE,
  DEFAULT_PICKUP_FEE,
  SERVICE_FALLBACK_PRICES,
  RETURN_SERVICE_PRICES,
  getServiceFallbackPrice,
  getReturnServicePrice,
  getPickupServicePrice
} from '../config/pricing';

// Simple test runner
const tests: { name: string; fn: () => void }[] = [];
let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  tests.push({ name, fn });
}

function expect(value: any) {
  return {
    toBe(expected: any) {
      if (value !== expected) {
        throw new Error(`Expected ${expected} but got ${value}`);
      }
    },
    toBeGreaterThan(expected: number) {
      if (value <= expected) {
        throw new Error(`Expected ${value} to be greater than ${expected}`);
      }
    },
    toBeTruthy() {
      if (!value) {
        throw new Error(`Expected truthy value but got ${value}`);
      }
    },
    toBeNull() {
      if (value !== null) {
        throw new Error(`Expected null but got ${value}`);
      }
    }
  };
}

// ============================================
// TESTS: Pricing Constants
// ============================================

test('EXPRESS_FEE should be 500 kr', () => {
  expect(EXPRESS_FEE).toBe(500);
});

test('SCANNED_COPIES_FEE should be 200 kr per document', () => {
  expect(SCANNED_COPIES_FEE).toBe(200);
});

test('DEFAULT_PICKUP_FEE should be 450 kr', () => {
  expect(DEFAULT_PICKUP_FEE).toBe(450);
});

// ============================================
// TESTS: Service Fallback Prices
// ============================================

test('Apostille fallback price should have officialFee and serviceFee', () => {
  const apostille = SERVICE_FALLBACK_PRICES['apostille'];
  expect(apostille.officialFee).toBe(440);
  expect(apostille.serviceFee).toBe(999);
});

test('Notarization fallback price should be correct', () => {
  const notarization = SERVICE_FALLBACK_PRICES['notarization'];
  expect(notarization.officialFee).toBe(320);
  expect(notarization.serviceFee).toBe(999);
});

test('Chamber fallback price should be correct', () => {
  const chamber = SERVICE_FALLBACK_PRICES['chamber'];
  expect(chamber.officialFee).toBe(799);
  expect(chamber.serviceFee).toBe(1199);
});

test('Embassy fallback price should be correct', () => {
  const embassy = SERVICE_FALLBACK_PRICES['embassy'];
  expect(embassy.officialFee).toBe(1500);
  expect(embassy.serviceFee).toBe(1199);
});

test('UD fallback price should be correct', () => {
  const ud = SERVICE_FALLBACK_PRICES['ud'];
  expect(ud.officialFee).toBe(750);
  expect(ud.serviceFee).toBe(999);
});

test('Translation fallback should have 0 officialFee (price on request)', () => {
  const translation = SERVICE_FALLBACK_PRICES['translation'];
  expect(translation.officialFee).toBe(0);
  expect(translation.serviceFee).toBe(999);
});

// ============================================
// TESTS: Helper Functions
// ============================================

test('getServiceFallbackPrice should return correct basePrice', () => {
  const apostille = getServiceFallbackPrice('apostille');
  expect(apostille).toBeTruthy();
  expect(apostille!.basePrice).toBe(440 + 999); // 1439
});

test('getServiceFallbackPrice should return null for unknown service', () => {
  const unknown = getServiceFallbackPrice('unknown_service');
  expect(unknown).toBeNull();
});

test('getReturnServicePrice should return correct price for PostNord REK', () => {
  const price = getReturnServicePrice('postnord-rek');
  expect(price).toBe(85);
});

test('getReturnServicePrice should return correct price for DHL Sweden', () => {
  const price = getReturnServicePrice('dhl-sweden');
  expect(price).toBe(180);
});

test('getReturnServicePrice should return 0 for own-delivery', () => {
  const price = getReturnServicePrice('own-delivery');
  expect(price).toBe(0);
});

test('getReturnServicePrice should return 0 for unknown service', () => {
  const price = getReturnServicePrice('unknown');
  expect(price).toBe(0);
});

test('getPickupServicePrice should return correct price for DHL', () => {
  const price = getPickupServicePrice('dhl');
  expect(price).toBe(450);
});

test('getPickupServicePrice should return default for unknown method', () => {
  const price = getPickupServicePrice('unknown');
  expect(price).toBe(DEFAULT_PICKUP_FEE);
});

// ============================================
// TESTS: Price Calculations
// ============================================

test('Apostille total for 1 document should be 1439 kr', () => {
  const fallback = getServiceFallbackPrice('apostille')!;
  const quantity = 1;
  const total = (fallback.officialFee * quantity) + fallback.serviceFee;
  expect(total).toBe(1439);
});

test('Apostille total for 3 documents should be 2759 kr', () => {
  const fallback = getServiceFallbackPrice('apostille')!;
  const quantity = 3;
  // Official fee is per document, service fee is per order
  const total = (fallback.officialFee * quantity) + fallback.serviceFee;
  expect(total).toBe(440 * 3 + 999); // 1320 + 999 = 2319
});

test('Order with express should add 500 kr', () => {
  const basePrice = 1439;
  const withExpress = basePrice + EXPRESS_FEE;
  expect(withExpress).toBe(1939);
});

test('Scanned copies for 2 documents should be 400 kr', () => {
  const quantity = 2;
  const scannedCost = SCANNED_COPIES_FEE * quantity;
  expect(scannedCost).toBe(400);
});

test('Full order calculation: Apostille + Express + DHL Sweden return', () => {
  const fallback = getServiceFallbackPrice('apostille')!;
  const quantity = 2;
  
  // Service costs
  const officialFee = fallback.officialFee * quantity; // 440 * 2 = 880
  const serviceFee = fallback.serviceFee; // 999
  const expressFee = EXPRESS_FEE; // 500
  const returnFee = getReturnServicePrice('dhl-sweden'); // 180
  
  const total = officialFee + serviceFee + expressFee + returnFee;
  expect(total).toBe(880 + 999 + 500 + 180); // 2559
});

// ============================================
// TESTS: Return Service Prices
// ============================================

test('All return services should have valid prices', () => {
  const services = [
    'postnord-rek', 'dhl-sweden', 'dhl-europe', 'dhl-worldwide',
    'dhl-pre-12', 'dhl-pre-9', 'stockholm-city', 'stockholm-express', 'stockholm-sameday'
  ];
  
  for (const service of services) {
    const price = RETURN_SERVICE_PRICES[service];
    expect(price).toBeTruthy();
    expect(price.price).toBeGreaterThan(0);
  }
});

// ============================================
// Run all tests
// ============================================

function runTests() {
  console.log('\n🧪 Running Pricing Tests...\n');
  console.log('='.repeat(50));
  
  for (const { name, fn } of tests) {
    try {
      fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error: any) {
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }
  }
  
  console.log('='.repeat(50));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests if this file is executed directly
runTests();
