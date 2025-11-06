import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
  setDoc,
  getCountFromServer
} from 'firebase/firestore';
import { db, auth } from './config';
import { getAuth } from 'firebase/auth';

// Define the Order interface
export interface Order {
  id?: string;
  orderNumber?: string; // New formatted order ID (SWE000001)
  userId?: string; // Firebase Auth UID of the user who created the order
  services: string[];
  documentType: string;
  country: string;
  quantity: number;
  expedited: boolean;
  documentSource: string; // 'original' or 'upload'
  pickupService: boolean; // Whether pickup service is requested
  pickupAddress?: { // Pickup address details
    street: string;
    postalCode: string;
    city: string;
  };
  scannedCopies: boolean; // Whether scanned copies are requested
  returnService: string; // Return service selection
  customerInfo?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    postalCode?: string;
    city?: string;
  };
  deliveryMethod: string;
  paymentMethod: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'shipped' | 'delivered';
  totalPrice: number;
  pricingBreakdown?: any[]; // Store pricing breakdown for validation
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  // File upload related properties
  uploadedFiles?: any[];
  filesUploaded?: boolean;
  filesUploadedAt?: Timestamp;
  uploadError?: string;
  // Additional order fields
  invoiceReference?: string;
  additionalNotes?: string;
  // Admin management fields
  processingSteps?: any[];
  adminNotes?: any[];
  internalNotes?: string;
}

const ORDERS_COLLECTION = 'orders';
const COUNTERS_COLLECTION = 'counters';

// Get the next order number from the counter collection
async function getNextOrderNumber(): Promise<number> {
  try {
    // Get the current count from the orders collection
    const snapshot = await getCountFromServer(collection(db, ORDERS_COLLECTION));
    const count = snapshot.data().count;
    
    // Start from 1 if no orders exist, otherwise use count + 1
    const nextNumber = count > 0 ? count + 1 : 1;
    
    // Update the counter document
    await setDoc(doc(db, COUNTERS_COLLECTION, 'orders'), { 
      currentCount: nextNumber,
      lastUpdated: Timestamp.now()
    }, { merge: true });
    
    return nextNumber;
  } catch (error) {
    console.error('Error getting next order number:', error);
    // Fallback to a timestamp-based number if counter fails
    return Math.floor(Date.now() / 1000);
  }
}

// Format the order ID with SWE prefix and padded number
function formatOrderId(number: number): string {
  return `SWE${number.toString().padStart(6, '0')}`;
}

// Create a new order with a formatted order ID
export const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'userId'>): Promise<string> => {
  try {
    // Get the current authenticated user (optional for anonymous orders)
    const currentUser = auth.currentUser;

    // Get the next order number
    const nextNumber = await getNextOrderNumber();

    // Format the order ID
    const formattedOrderId = formatOrderId(nextNumber);

    const orderWithTimestamps = {
      ...orderData,
      userId: currentUser?.uid || null, // Add userId if authenticated, null for anonymous
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      orderNumber: formattedOrderId // Store the formatted order number
    };

    // Create the document with the formatted ID
    await setDoc(doc(db, ORDERS_COLLECTION, formattedOrderId), orderWithTimestamps);

    return formattedOrderId;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Get all orders
export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const ordersQuery = query(
      collection(db, ORDERS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(ordersQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));
  } catch (error) {
    console.error('Error getting orders:', error);
    throw error;
  }
};

// Get orders by customer email
export const getOrdersByEmail = async (email: string): Promise<Order[]> => {
  try {
    const ordersQuery = query(
      collection(db, ORDERS_COLLECTION),
      where('customerInfo.email', '==', email),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(ordersQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));
  } catch (error) {
    console.error('Error getting orders by email:', error);
    throw error;
  }
};

// Get a single order by ID
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Order;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting order by ID:', error);
    throw error;
  }
};

// Update an order
export const updateOrder = async (orderId: string, orderData: Partial<Order>): Promise<void> => {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    
    await updateDoc(docRef, {
      ...orderData,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
};

// Update order status
export const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<void> => {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    
    await updateDoc(docRef, {
      status,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Delete an order
export const deleteOrder = async (orderId: string): Promise<void> => {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
};

// Get orders by status
export const getOrdersByStatus = async (status: Order['status']): Promise<Order[]> => {
  try {
    const ordersQuery = query(
      collection(db, ORDERS_COLLECTION),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(ordersQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));
  } catch (error) {
    console.error('Error getting orders by status:', error);
    throw error;
  }
};
