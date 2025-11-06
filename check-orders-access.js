const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkOrdersAccess() {
  try {
    console.log('Testing access to orders collection...');
    
    // Try to read from the orders collection
    const ordersRef = db.collection('orders');
    const snapshot = await ordersRef.limit(1).get();
    
    if (snapshot.empty) {
      console.log('✅ Orders collection is accessible but empty');
      return;
    }
    
    console.log('✅ Successfully read from orders collection');
    snapshot.forEach(doc => {
      console.log('Sample order:', doc.id, doc.data());
    });
    
  } catch (error) {
    console.error('❌ Error accessing orders collection:', error.message);
    if (error.code === 'PERMISSION_DENIED') {
      console.error('\n🔥 Permission denied! Please check your Firestore security rules.');
      console.error('Make sure your rules allow reads from the orders collection.');
    }
  }
}

checkOrdersAccess().then(() => process.exit(0));
