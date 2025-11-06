const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkCustomerEmails() {
  try {
    console.log('Checking customer emails...');
    const snapshot = await db.collection('customerEmails').limit(10).get();
    
    if (snapshot.empty) {
      console.log('No customer emails found in the collection.');
      return;
    }

    console.log('\nFound customer emails:');
    snapshot.forEach(doc => {
      console.log('\n--- Document ID:', doc.id);
      console.log('Data:', JSON.stringify(doc.data(), null, 2));
    });
  } catch (error) {
    console.error('Error checking customer emails:', error);
  }
}

checkCustomerEmails().then(() => process.exit(0));
