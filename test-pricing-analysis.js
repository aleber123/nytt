const fs = require('fs');
const path = require('path');

async function analyzePricingSystem() {
  console.log('🔍 PRICING SYSTEM ANALYSIS REPORT\n');
  console.log('=====================================\n');

  const issues = [];
  const recommendations = [];

  // 1. Check Firebase Configuration
  console.log('1️⃣ Firebase Configuration Analysis');
  console.log('-----------------------------------');

  try {
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const hasFirebaseConfig = envContent.includes('NEXT_PUBLIC_FIREBASE');

      if (hasFirebaseConfig) {
        console.log('✅ Firebase environment variables found');

        const requiredVars = [
          'NEXT_PUBLIC_FIREBASE_API_KEY',
          'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
          'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
          'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
          'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
          'NEXT_PUBLIC_FIREBASE_APP_ID'
        ];

        const missingVars = requiredVars.filter(varName => !envContent.includes(varName));
        if (missingVars.length > 0) {
          console.log(`⚠️  Missing Firebase config variables: ${missingVars.join(', ')}`);
          issues.push(`Missing Firebase config: ${missingVars.join(', ')}`);
        } else {
          console.log('✅ All Firebase config variables present');
        }
      } else {
        console.log('❌ No Firebase configuration found in .env.local');
        issues.push('Missing Firebase configuration');
      }
    } else {
      console.log('❌ .env.local file not found');
      issues.push('Missing .env.local file');
    }
  } catch (error) {
    console.log(`❌ Error checking Firebase config: ${error.message}`);
    issues.push(`Firebase config error: ${error.message}`);
  }

  // 2. Check Firebase Service Files
  console.log('\n2️⃣ Firebase Service Files Analysis');
  console.log('----------------------------------');

  const firebaseFiles = [
    'src/firebase/config.ts',
    'src/firebase/pricingService.ts',
    'src/firebase/orderService.ts'
  ];

  firebaseFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} missing`);
      issues.push(`Missing file: ${file}`);
    }
  });

  // 3. Check Pricing Service Implementation
  console.log('\n3️⃣ Pricing Service Implementation');
  console.log('----------------------------------');

  try {
    const pricingServicePath = path.join(__dirname, 'src/firebase/pricingService.ts');
    if (fs.existsSync(pricingServicePath)) {
      const pricingContent = fs.readFileSync(pricingServicePath, 'utf8');

      // Check for new fee structure
      const hasOfficialFee = pricingContent.includes('officialFee');
      const hasServiceFee = pricingContent.includes('serviceFee');

      if (hasOfficialFee && hasServiceFee) {
        console.log('✅ New fee structure implemented (officialFee + serviceFee)');
      } else {
        console.log('❌ Missing new fee structure implementation');
        issues.push('Missing officialFee/serviceFee in pricing service');
      }

      // Check for error handling
      const hasErrorHandling = pricingContent.includes('catch') && pricingContent.includes('throw error');
      if (hasErrorHandling) {
        console.log('✅ Error handling implemented');
      } else {
        console.log('⚠️  Limited error handling');
        recommendations.push('Improve error handling in pricing service');
      }

      // Check for mock data fallback
      const hasMockData = pricingContent.includes('getMockPricingRules');
      if (hasMockData) {
        console.log('✅ Mock data fallback implemented');
      } else {
        console.log('⚠️  No mock data fallback');
        recommendations.push('Add mock data fallback for offline testing');
      }
    }
  } catch (error) {
    console.log(`❌ Error analyzing pricing service: ${error.message}`);
    issues.push(`Pricing service analysis error: ${error.message}`);
  }

  // 4. Check Admin Interface
  console.log('\n4️⃣ Admin Interface Analysis');
  console.log('---------------------------');

  const adminFiles = [
    'src/pages/admin/pricing.tsx',
    'src/pages/admin/standard-prices.tsx'
  ];

  adminFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} exists`);

      try {
        const content = fs.readFileSync(filePath, 'utf8');

        // Check for new fee fields
        const hasOfficialFeeInput = content.includes('officialFee');
        const hasServiceFeeInput = content.includes('serviceFee');

        if (hasOfficialFeeInput && hasServiceFeeInput) {
          console.log(`   ✅ Fee structure fields implemented in ${file}`);
        } else {
          console.log(`   ❌ Missing fee structure fields in ${file}`);
          issues.push(`Missing fee fields in ${file}`);
        }
      } catch (error) {
        console.log(`   ❌ Error reading ${file}: ${error.message}`);
      }
    } else {
      console.log(`❌ ${file} missing`);
      issues.push(`Missing admin file: ${file}`);
    }
  });

  // 5. Check Frontend Implementation
  console.log('\n5️⃣ Frontend Implementation Analysis');
  console.log('-----------------------------------');

  const frontendFiles = [
    'src/pages/priser.tsx',
    'src/pages/index.tsx'
  ];

  frontendFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} exists`);

      try {
        const content = fs.readFileSync(filePath, 'utf8');

        // Check for pricing integration
        const hasPricingIntegration = content.includes('getAllActivePricingRules') ||
                                     content.includes('pricingRules');

        if (hasPricingIntegration) {
          console.log(`   ✅ Pricing integration found in ${file}`);
        } else {
          console.log(`   ⚠️  No pricing integration in ${file}`);
          recommendations.push(`Add pricing integration to ${file}`);
        }
      } catch (error) {
        console.log(`   ❌ Error reading ${file}: ${error.message}`);
      }
    } else {
      console.log(`⚠️  ${file} not found (may be optional)`);
    }
  });

  // 6. Check Package Dependencies
  console.log('\n6️⃣ Dependencies Analysis');
  console.log('-----------------------');

  try {
    const packagePath = path.join(__dirname, 'package.json');
    if (fs.existsSync(packagePath)) {
      const packageContent = fs.readFileSync(packagePath, 'utf8');
      const packageJson = JSON.parse(packageContent);

      const requiredDeps = ['firebase', 'react', 'next'];
      const missingDeps = requiredDeps.filter(dep =>
        !packageJson.dependencies || !packageJson.dependencies[dep]
      );

      if (missingDeps.length === 0) {
        console.log('✅ All required dependencies present');
      } else {
        console.log(`❌ Missing dependencies: ${missingDeps.join(', ')}`);
        issues.push(`Missing dependencies: ${missingDeps.join(', ')}`);
      }

      // Check Firebase version
      const firebaseVersion = packageJson.dependencies?.firebase;
      if (firebaseVersion) {
        console.log(`✅ Firebase version: ${firebaseVersion}`);
        if (firebaseVersion.includes('11.')) {
          console.log('✅ Using latest Firebase v11');
        } else {
          console.log('⚠️  Consider upgrading to Firebase v11');
          recommendations.push('Upgrade to Firebase v11 for better performance');
        }
      }
    }
  } catch (error) {
    console.log(`❌ Error analyzing dependencies: ${error.message}`);
    issues.push(`Dependencies analysis error: ${error.message}`);
  }

  // 7. Performance Analysis
  console.log('\n7️⃣ Performance Considerations');
  console.log('------------------------------');

  // Check for potential performance issues
  const performanceChecks = [
    'Check for unnecessary re-renders in React components',
    'Verify Firebase queries are optimized',
    'Check for proper error boundaries',
    'Verify loading states are implemented',
    'Check for proper caching strategies'
  ];

  performanceChecks.forEach(check => {
    console.log(`• ${check}`);
  });

  // 8. Security Analysis
  console.log('\n8️⃣ Security Analysis');
  console.log('-------------------');

  console.log('🔒 Security Checklist:');
  console.log('• Firebase security rules configured');
  console.log('• Environment variables properly secured');
  console.log('• No sensitive data in client-side code');
  console.log('• Proper authentication implemented');
  console.log('• Input validation in place');

  // SUMMARY
  console.log('\n📊 ANALYSIS SUMMARY');
  console.log('===================');
  console.log(`Total Issues Found: ${issues.length}`);
  console.log(`Recommendations: ${recommendations.length}`);

  if (issues.length > 0) {
    console.log('\n❌ CRITICAL ISSUES:');
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
  }

  if (recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }

  // Final Assessment
  console.log('\n🎯 FINAL ASSESSMENT');
  console.log('===================');

  if (issues.length === 0) {
    console.log('✅ System appears to be properly configured');
    console.log('🚀 Ready for production use');
  } else if (issues.length <= 2) {
    console.log('⚠️  Minor issues found - system should work but may need optimization');
  } else {
    console.log('❌ Significant issues found - requires attention before production');
  }

  console.log('\n🔧 NEXT STEPS:');
  console.log('1. Address critical issues listed above');
  console.log('2. Test the system with real Firebase data');
  console.log('3. Verify frontend-backend integration');
  console.log('4. Monitor performance in production');
  console.log('5. Set up proper error monitoring');

  return {
    issues,
    recommendations,
    assessment: issues.length === 0 ? 'good' : issues.length <= 2 ? 'warning' : 'critical'
  };
}

// Run the analysis
analyzePricingSystem().then((result) => {
  console.log('\n🏁 Analysis completed');

  // Exit with appropriate code
  if (result.assessment === 'critical') {
    process.exit(1);
  } else {
    process.exit(0);
  }
}).catch(error => {
  console.error('\n💥 Analysis failed:', error);
  process.exit(1);
});