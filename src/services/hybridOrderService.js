// Hybrid Order Service - tries Firebase first, falls back to local storage
const { initializeApp, getApps, getApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDoc, doc, setDoc, updateDoc, Timestamp } = require('firebase/firestore');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const { mockFirebase } = require('./mockFirebase');

// Check if we should use mock only
const useMockOnly = process.env.USE_MOCK_ONLY === 'true';

if (useMockOnly) {
}

// Firebase configuration - using environment variables for security
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Import initializeFirestore for proper configuration
const { initializeFirestore } = require('firebase/firestore');

// Initialize Firebase lazily to handle SSR properly
let db = null;
let storage = null;
let firebaseAvailable = false;
let firebaseInitialized = false;

// Check if Firebase config is valid (has required fields)
const hasValidConfig = firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.apiKey !== '';

// Lazy initialization function - called before each operation
function ensureFirebaseInitialized() {
  if (firebaseInitialized) return;
  firebaseInitialized = true;

  if (useMockOnly || !hasValidConfig) {
    firebaseAvailable = false;
    return;
  }

  try {
    // Use existing app if already initialized, otherwise create new one
    const existingApps = getApps();
    const app = existingApps.length > 0 ? getApp() : initializeApp(firebaseConfig);

    // Initialize Firestore with settings to avoid WebSocket connection issues
    try {
      db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
        experimentalAutoDetectLongPolling: false
      });
    } catch (firestoreError) {
      // Firestore might already be initialized, try to get existing instance
      db = getFirestore(app);
    }

    storage = getStorage(app);
    firebaseAvailable = true;
  } catch (error) {
    firebaseAvailable = false;
  }
}

// Format the order ID with SWE prefix and padded number
function formatOrderId(number) {
  return `SWE${number.toString().padStart(6, '0')}`;
}

// Get next order number (self-healing based on both counter doc and actual orders count)
async function getNextOrderNumber() {
  ensureFirebaseInitialized();
  if (firebaseAvailable && db) {
    try {
      // Try to get the counter document
      const counterRef = doc(db, 'counters', 'orders');
      const counterSnap = await getDoc(counterRef);

      let currentCount = 0;
      if (counterSnap.exists()) {
        const data = counterSnap.data();
        currentCount = typeof data.currentCount === 'number' ? data.currentCount : 0;
      }

      // Self-healing: compare with actual number of orders in the collection
      try {
        const { getCountFromServer } = require('firebase/firestore');
        const ordersCollectionRef = collection(db, 'orders');
        const snapshot = await getCountFromServer(ordersCollectionRef);
        const realCount = snapshot.data().count || 0;

        if (realCount > currentCount) {
          currentCount = realCount;
        }
      } catch (innerError) {
      }

      const nextNumber = currentCount + 1;

      // Update the counter (create if doesn't exist)
      await setDoc(counterRef, {
        currentCount: nextNumber,
        lastUpdated: Timestamp.now()
      });

      return nextNumber;
    } catch (error) {
    }
  }

  // Fallback to mock counter
  const counter = mockFirebase.counters.get('orders');
  counter.currentCount += 1;
  counter.lastUpdated = new Date().toISOString();
  return counter.currentCount;
}

// Helper function to remove undefined values from an object (Firebase doesn't accept undefined)
// Preserves Firestore Timestamp objects so they are stored correctly
function removeUndefinedValues(obj) {
  if (obj === null || obj === undefined) return obj;
  
  // Preserve Firestore Timestamp objects (they have toDate method)
  if (obj && typeof obj === 'object' && typeof obj.toDate === 'function') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedValues(item));
  }
  if (typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedValues(value);
      }
    }
    return cleaned;
  }
  return obj;
}

// Create order with hybrid approach
const createOrder = async (orderData) => {
  ensureFirebaseInitialized();
  try {

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

        // Remove undefined values - Firebase doesn't accept them
        const cleanedOrder = removeUndefinedValues(orderWithTimestamps);

        await setDoc(doc(db, 'orders', formattedOrderId), {
          ...cleanedOrder,
          orderNumber: formattedOrderId // Store the formatted order number as a field
        });

        // Optionally create a public confirmation document keyed by a random token
        const publicAccessToken = orderData && orderData.publicAccessToken ? orderData.publicAccessToken : null;
        if (publicAccessToken) {
          try {
            const confirmationRef = doc(db, 'orderConfirmations', publicAccessToken);

            // Store only the minimal, non-sensitive subset needed for the public confirmation view
            const confirmationData = {
              orderNumber: formattedOrderId,
              status: orderWithTimestamps.status,
              services: orderWithTimestamps.services,
              documentType: orderWithTimestamps.documentType,
              country: orderWithTimestamps.country,
              quantity: orderWithTimestamps.quantity,
              expedited: orderWithTimestamps.expedited,
              documentSource: orderWithTimestamps.documentSource,
              scannedCopies: orderWithTimestamps.scannedCopies,
              pickupService: orderWithTimestamps.pickupService,
              pickupAddress: orderWithTimestamps.pickupAddress,
              returnService: orderWithTimestamps.returnService,
              customerInfo: orderWithTimestamps.customerInfo,
              paymentMethod: orderWithTimestamps.paymentMethod,
              totalPrice: orderWithTimestamps.totalPrice,
              invoiceReference: orderWithTimestamps.invoiceReference,
              additionalNotes: orderWithTimestamps.additionalNotes,
              createdAt: orderWithTimestamps.createdAt
            };

            await setDoc(confirmationRef, confirmationData);
          } catch (confirmationError) {
            console.error('⚠️ Failed to save order confirmation document, continuing without public copy:', confirmationError.message);
          }
        }

        return formattedOrderId;

      } catch (firebaseError) {
        console.error('❌ Firebase order creation failed:', firebaseError.message);
        console.error('Stack:', firebaseError.stack);
        // Fall through to mock service
      }
    }

    // Fallback to mock service
    console.warn('⚠️ Using mock service for order creation (firebaseAvailable:', firebaseAvailable, ', db:', !!db, ')');
    const orderWithDefaults = {
      ...orderData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const orderId = await mockFirebase.createOrder(orderWithDefaults);
    return orderId;

  } catch (error) {
    console.error('❌ Error creating order:', error);
    throw error;
  }
};

// Get order by ID with hybrid approach
const getOrderById = async (orderId) => {
  ensureFirebaseInitialized();
  
  if (!orderId) {
    console.error('❌ Error: No order ID provided to getOrderById');
    return null;
  }

  try {
    if (firebaseAvailable && db) {
      try {
        
        // Try direct lookup by document ID first
        const docRef = doc(db, 'orders', orderId);
        
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          return {
            id: docSnap.id,
            ...docSnap.data()
          };
        }

        // If not found by ID, try searching by orderNumber
        const { query, where, getDocs } = require('firebase/firestore');
        const ordersQuery = query(
          collection(db, 'orders'),
          where('orderNumber', '==', orderId)
        );

        const querySnapshot = await getDocs(ordersQuery);
        
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          return {
            id: doc.id,
            ...doc.data()
          };
        }
        
        
      } catch (firebaseError) {
        console.error('❌ Firebase retrieval failed:', firebaseError);
        console.error('Stack:', firebaseError.stack);
      }
    } else {
    }

    // Fallback to mock service
    const mockOrder = await mockFirebase.getOrderById(orderId);
    if (mockOrder) {
      return mockOrder;
    }
    
    return null;

  } catch (error) {
    console.error('❌ Error in getOrderById:', error);
    console.error('Stack:', error.stack);
    throw error;
  }
};

// Get public order confirmation by token
const getOrderConfirmationByToken = async (token) => {
  ensureFirebaseInitialized();

  if (!token) {
    console.error('❌ Error: No token provided to getOrderConfirmationByToken');
    return null;
  }

  try {
    if (firebaseAvailable && db) {
      try {
        const confirmationRef = doc(db, 'orderConfirmations', token);
        const confirmationSnap = await getDoc(confirmationRef);

        if (confirmationSnap.exists()) {
          return {
            id: confirmationSnap.id,
            ...confirmationSnap.data()
          };
        }

      } catch (firebaseError) {
        console.error('❌ Firebase retrieval failed in getOrderConfirmationByToken:', firebaseError);
        console.error('Stack:', firebaseError.stack);
      }
    } else {
    }

    return null;
  } catch (error) {
    console.error('❌ Error in getOrderConfirmationByToken:', error);
    console.error('Stack:', error.stack);
    throw error;
  }
};

// Get all orders
const getAllOrders = async () => {
  ensureFirebaseInitialized();
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

        return firebaseOrders;
      } catch (firebaseError) {
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
  ensureFirebaseInitialized();
  
  try {
    if (firebaseAvailable && db) {
      // First try direct document ID
      let docRef = doc(db, 'orders', orderId);
      let docSnap = await getDoc(docRef);
      let actualDocId = orderId;
      
      // If not found by ID, try searching by orderNumber
      if (!docSnap.exists()) {
        const { query, where, getDocs } = require('firebase/firestore');
        const ordersQuery = query(
          collection(db, 'orders'),
          where('orderNumber', '==', orderId)
        );
        const querySnapshot = await getDocs(ordersQuery);
        
        if (!querySnapshot.empty) {
          const foundDoc = querySnapshot.docs[0];
          actualDocId = foundDoc.id;
          docRef = doc(db, 'orders', actualDocId);
        } else {
          console.error('❌ Order not found by ID or orderNumber:', orderId);
          throw new Error('Order not found: ' + orderId);
        }
      } else {
      }
      
      // Remove undefined values - Firebase doesn't accept them
      const cleanedUpdates = removeUndefinedValues(updates);
      
      await updateDoc(docRef, {
        ...cleanedUpdates,
        updatedAt: Timestamp.now()
      });
      return true;
    }

    // Only use mock service if Firebase is not available
    const updatedOrder = await mockFirebase.updateOrder(orderId, updates);
    if (updatedOrder) {
    }
    return updatedOrder;

  } catch (error) {
    console.error('❌ Error updating order:', error);
    console.error('❌ Stack:', error.stack);
    throw error;
  }
};

// Upload files to Firebase Storage or mock service
const uploadFiles = async (files, orderId) => {
  ensureFirebaseInitialized();
  if (!firebaseAvailable || !storage) {
    // Use mock service for file upload
    return await mockFirebase.uploadFiles(files, orderId);
  }

  try {
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

    return uploadedFiles;

  } catch (error) {
    console.error('❌ Error uploading files:', error);
    throw error;
  }
};

// Check for duplicate orders (within last 5 minutes)
const checkForDuplicateOrder = async (orderData) => {
  ensureFirebaseInitialized();
  
  // Safety check - if customerInfo or email is missing, skip duplicate check
  if (!orderData?.customerInfo?.email) {
    return { isDuplicate: false };
  }
  
  try {
    const fiveMinutesAgo = new Date(Date.now() - 300000); // 5 minutes ago

    if (firebaseAvailable && db) {
      try {
        // Check Firebase for recent orders with same customer email and services
        const { query, where, orderBy, limit, getDocs } = require('firebase/firestore');

        const duplicateQuery = query(
          collection(db, 'orders'),
          where('customerInfo.email', '==', orderData.customerInfo.email),
          where('services', '==', orderData.services),
          where('createdAt', '>=', Timestamp.fromDate(fiveMinutesAgo)),
          orderBy('createdAt', 'desc'),
          limit(1)
        );

        const querySnapshot = await getDocs(duplicateQuery);
        if (!querySnapshot.empty) {
          const existingOrder = querySnapshot.docs[0];
          return {
            isDuplicate: true,
            existingOrderId: existingOrder.id
          };
        }
      } catch (firebaseError) {
        // Silently continue - duplicate check is not critical
      }
    }

    // Skip mock storage check in production (it's not used)
    return { isDuplicate: false };
  } catch (error) {
    return { isDuplicate: false }; // Allow order creation if check fails
  }
};

// Create order with file uploads
const createOrderWithFiles = async (orderData, files = []) => {
  try {

    // Check for duplicate orders (within last 30 seconds)
    const duplicateCheck = await checkForDuplicateOrder(orderData);
    if (duplicateCheck.isDuplicate) {
      return duplicateCheck.existingOrderId;
    }

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
};

module.exports = {
createOrder,
createOrderWithFiles,
uploadFiles,
getOrderById,
getOrderConfirmationByToken,
getAllOrders,
updateOrder,
clearAllOrders,
formatOrderId,
firebaseAvailable
};