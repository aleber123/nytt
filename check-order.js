const admin = require('firebase-admin');

// Initialize the default app
admin.initializeApp();

console.log('🔌 Connected to Firebase project:', process.env.GCLOUD_PROJECT || process.env.FIREBASE_CONFIG?.projectId);

const db = admin.firestore();

async function checkOrder(orderId) {
  try {
    console.log(`🔍 Checking for order with ID: ${orderId}`);
    
    // Try to get the order by ID
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) {
      console.log('❌ Order not found by ID, searching by orderNumber...');
      
      // Try to find by orderNumber
      const snapshot = await db.collection('orders')
        .where('orderNumber', '==', orderId)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        console.log('❌ Order not found by orderNumber either');
        return null;
      }
      
      const doc = snapshot.docs[0];
      console.log('✅ Found order by orderNumber:', doc.id);
      return { id: doc.id, ...doc.data() };
    }
    
    console.log('✅ Found order by ID:', orderDoc.id);
    return { id: orderDoc.id, ...orderDoc.data() };
    
  } catch (error) {
    console.error('❌ Error checking order:', error);
    throw error;
  }
}

// Get order ID from command line or use default
const orderId = process.argv[2] || 'SWE000024';

checkOrder(orderId)
  .then(order => {
    if (order) {
      console.log('\n📄 Order details:');
      console.log('-------------------');
      console.log('ID:', order.id);
      console.log('Order Number:', order.orderNumber);
      console.log('Status:', order.status);
      console.log('Customer:', order.customerInfo?.firstName, order.customerInfo?.lastName);
      console.log('Email:', order.customerInfo?.email);
      console.log('Created At:', order.createdAt?.toDate());
      console.log('Total Price:', order.totalPrice);
    } else {
      console.log('\n❌ No order found with ID:', orderId);
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
