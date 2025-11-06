const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testFirestoreAccess() {
  try {
    console.log('Testing Firestore access...');
    
    // Test write to customerEmails
    const testDoc = await db.collection('customerEmails').add({
      test: 'This is a test document',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Successfully wrote test document to customerEmails');
    
    // Clean up
    await testDoc.delete();
    console.log('✅ Cleaned up test document');
    
  } catch (error) {
    console.error('❌ Error accessing Firestore:', error.message);
    if (error.code === 'PERMISSION_DENIED') {
      console.error('\n🔥 Permission denied! Please check your Firestore security rules.');
      console.error('Make sure your rules allow writes to the customerEmails collection.');
    }
  }
}

testFirestoreAccess().then(() => process.exit(0));
