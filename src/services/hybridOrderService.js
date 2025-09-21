// Hybrid Order Service - tries Firebase first, falls back to local storage
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDoc, doc, setDoc, updateDoc, Timestamp } = require('firebase/firestore');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const { mockFirebase } = require('./mockFirebase');

// Check if we should use mock only
const useMockOnly = process.env.USE_MOCK_ONLY === 'true';
console.log('🔍 USE_MOCK_ONLY environment variable:', process.env.USE_MOCK_ONLY);
console.log('🔍 useMockOnly flag:', useMockOnly);

if (useMockOnly) {
  console.log('🔄 Using mock service only (USE_MOCK_ONLY=true)');
}

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAaQfVaMxCMjDbDa4l-S6IjSy4uTcQbHyo",
  authDomain: "legapp-2720a.firebaseapp.com",
  projectId: "legapp-2720a",
  storageBucket: "legapp-2720a.firebasestorage.app",
  messagingSenderId: "1003184294483",
  appId: "1:1003184294483:web:55e86d1f5833ee0cad14a6",
  measurementId: "G-V694ZBTV7F"
};

// Initialize Firebase
let db = null;
let storage = null;
let firebaseAvailable = false;

if (!useMockOnly) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    firebaseAvailable = true;
    console.log('🔥 Firebase initialized successfully');
  } catch (error) {
    console.log('⚠️ Firebase initialization failed, using mock service:', error.message);
    firebaseAvailable = false;
  }
} else {
  firebaseAvailable = false;
}

// Format the order ID with SWE prefix and padded number
function formatOrderId(number) {
  return `SWE${number.toString().padStart(6, '0')}`;
}

// Get next order number
async function getNextOrderNumber() {
  if (firebaseAvailable && db) {
    try {
      // Try to get and update the counter document
      const counterRef = doc(db, 'counters', 'orders');
      const counterSnap = await getDoc(counterRef);

      let nextNumber = 1;
      if (counterSnap.exists()) {
        const currentCount = counterSnap.data().currentCount || 0;
        nextNumber = currentCount + 1;
      }

      // Update the counter (create if doesn't exist)
      await setDoc(counterRef, {
        currentCount: nextNumber,
        lastUpdated: Timestamp.now()
      });

      console.log('✅ Firebase counter updated:', nextNumber);
      return nextNumber;
    } catch (error) {
      console.log('⚠️ Firebase counter failed, using mock counter:', error.message);
    }
  }

  // Fallback to mock counter
  const counter = mockFirebase.counters.get('orders');
  counter.currentCount += 1;
  counter.lastUpdated = new Date().toISOString();
  return counter.currentCount;
}

// Create order with hybrid approach
const createOrder = async (orderData) => {
  try {
    console.log('📦 Creating order with hybrid service...');

    if (firebaseAvailable && db) {
      try {
        // Try Firebase first
        const nextNumber = await getNextOrderNumber();
        const formattedOrderId = formatOrderId(nextNumber);

        const orderWithTimestamps = {
          ...orderData,
          status: 'pending',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          orderNumber: formattedOrderId
        };

        await setDoc(doc(db, 'orders', formattedOrderId), {
          ...orderWithTimestamps,
          orderNumber: formattedOrderId // Store the formatted order number as a field
        });
        console.log('✅ Order created in Firebase:', formattedOrderId);
        return formattedOrderId;

      } catch (firebaseError) {
        console.log('⚠️ Firebase creation failed, falling back to mock:', firebaseError.message);
      }
    }

    // Fallback to mock service
    const orderWithDefaults = {
      ...orderData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const orderId = await mockFirebase.createOrder(orderWithDefaults);
    console.log('✅ Order created with mock service:', orderId);
    return orderId;

  } catch (error) {
    console.error('❌ Error creating order:', error);
    throw error;
  }
};

// Get order by ID with hybrid approach
const getOrderById = async (orderId) => {
  try {
    if (firebaseAvailable && db) {
      try {
        // Now that we use SWE numbers as document IDs, try direct lookup first
        const docRef = doc(db, 'orders', orderId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          console.log('📖 Order retrieved from Firebase by ID:', orderId);
          return {
            id: docSnap.id,
            ...docSnap.data()
          };
        }

        // Fallback: try to find by orderNumber field for legacy orders
        const { query, where, getDocs } = require('firebase/firestore');
        const ordersQuery = query(
          collection(db, 'orders'),
          where('orderNumber', '==', orderId)
        );

        const querySnapshot = await getDocs(ordersQuery);
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          console.log('📖 Order retrieved from Firebase by orderNumber:', orderId);
          return {
            id: doc.id,
            ...doc.data()
          };
        }
      } catch (firebaseError) {
        console.log('⚠️ Firebase retrieval failed:', firebaseError.message);
      }
    }

    // Fallback to mock service
    const mockOrder = await mockFirebase.getOrderById(orderId);
    if (mockOrder) {
      console.log('📖 Order retrieved from mock service:', orderId);
    }
    return mockOrder;

  } catch (error) {
    console.error('❌ Error getting order by ID:', error);
    throw error;
  }
};

// Get all orders
const getAllOrders = async () => {
  try {
    if (firebaseAvailable && db) {
      try {
        // Import query and orderBy for Firebase
        const { query, orderBy, getDocs, collection } = require('firebase/firestore');

        const ordersQuery = query(
          collection(db, 'orders'),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(ordersQuery);
        const firebaseOrders = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        console.log('📋 Retrieved', firebaseOrders.length, 'orders from Firebase');
        return firebaseOrders;
      } catch (firebaseError) {
        console.log('⚠️ Firebase getAllOrders failed, falling back to mock:', firebaseError.message);
      }
    }

    // Fallback to mock orders
    return await mockFirebase.getAllOrders();
  } catch (error) {
    console.error('❌ Error getting all orders:', error);
    throw error;
  }
};

// Update order
const updateOrder = async (orderId, updates) => {
  try {
    if (firebaseAvailable && db) {
      try {
        const docRef = doc(db, 'orders', orderId);
        await updateDoc(docRef, {
          ...updates,
          updatedAt: Timestamp.now()
        });
        console.log('📝 Order updated in Firebase:', orderId);
        return true;
      } catch (firebaseError) {
        console.log('⚠️ Firebase update failed:', firebaseError.message);
      }
    }

    // Fallback to mock service
    const updatedOrder = await mockFirebase.updateOrder(orderId, updates);
    if (updatedOrder) {
      console.log('📝 Order updated in mock service:', orderId);
    }
    return updatedOrder;

  } catch (error) {
    console.error('❌ Error updating order:', error);
    throw error;
  }
};

// Upload files to Firebase Storage or mock service
const uploadFiles = async (files, orderId) => {
  if (!firebaseAvailable || !storage) {
    console.log('⚠️ Firebase Storage not available, using mock file upload');
    // Use mock service for file upload
    return await mockFirebase.uploadFiles(files, orderId);
  }

  try {
    console.log('📤 Uploading files to Firebase Storage...');
    const uploadedFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;

      // Create a filename with order number prefix for easy identification
      const fileExtension = file.name.split('.').pop() || 'file';
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // Replace special chars with underscores
      const fileName = `${orderId}_${i + 1}_${cleanFileName}`;
      const storageRef = ref(storage, `documents/${fileName}`);

      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      console.log(`✅ File ${i + 1} uploaded:`, file.name);

      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      uploadedFiles.push({
        originalName: file.name,
        size: file.size,
        type: file.type,
        downloadURL: downloadURL,
        storagePath: `documents/${fileName}`,
        uploadedAt: new Date().toISOString()
      });
    }

    console.log('🎉 All files uploaded successfully');
    return uploadedFiles;

  } catch (error) {
    console.error('❌ Error uploading files:', error);
    throw error;
  }
};

// Create order with file uploads
const createOrderWithFiles = async (orderData, files = []) => {
  try {
    console.log('📦 Creating order with files...');

    // First create the order to get the order ID
    const orderId = await createOrder(orderData);

    // If there are files to upload, upload them
    let uploadedFiles = [];
    if (files.length > 0) {
      try {
        uploadedFiles = await uploadFiles(files, orderId);

        // Update the order with file information
        const orderUpdates = {
          uploadedFiles: uploadedFiles,
          filesUploaded: true,
          filesUploadedAt: Timestamp.now()
        };

        await updateOrder(orderId, orderUpdates);
        console.log('📝 Order updated with file information');

      } catch (uploadError) {
        console.error('⚠️ File upload failed, but order was created:', uploadError);
        // Order is still created, just without files
        const orderUpdates = {
          filesUploaded: false,
          uploadError: uploadError.message
        };
        await updateOrder(orderId, orderUpdates);
      }
    }

    return orderId;

  } catch (error) {
    console.error('❌ Error creating order with files:', error);
    throw error;
  }
};

// Clear all data (for testing)
const clearAllOrders = () => {
  mockFirebase.clear();
  console.log('🧹 All orders cleared');
};

module.exports = {
  createOrder,
  createOrderWithFiles,
  uploadFiles,
  getOrderById,
  getAllOrders,
  updateOrder,
  clearAllOrders,
  formatOrderId,
  firebaseAvailable
};