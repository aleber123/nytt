// JavaScript version of pricing service for compatibility with test scripts
const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  doc,
  setDoc,
  Timestamp
} = require('firebase/firestore');

// Firebase config (you may need to adjust this based on your setup)
const firebaseConfig = {
  // Add your Firebase config here or load from environment
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

// Initialize Firebase (only if not already initialized)
let app;
let db;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  // In mock mode, we'll just log the operations
}

// Create or update a pricing rule
const setPricingRule = async (rule) => {
  try {
    if (!db) {
      return `${rule.countryCode}_${rule.serviceType}`;
    }

    const ruleId = `${rule.countryCode}_${rule.serviceType}`;
    const ruleRef = doc(db, 'pricing', ruleId);

    const ruleData = {
      ...rule,
      id: ruleId,
      lastUpdated: Timestamp.now()
    };

    await setDoc(ruleRef, ruleData);
    return ruleId;
  } catch (error) {
    console.error('❌ Error setting pricing rule:', error);
    // Return mock ID in case of error
    return `${rule.countryCode}_${rule.serviceType}`;
  }
};

module.exports = {
  setPricingRule
};