/**
 * Visa Order Service
 * Handles CRUD operations for visa orders with VISA-prefixed order numbers
 */

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
  setDoc,
  getCountFromServer
} from 'firebase/firestore';
import { db, auth } from './config';
import type { VisaCategory } from './visaRequirementsService';

// Visa Order interface
export interface VisaOrder {
  id?: string;
  orderNumber?: string; // VISA000001 format
  orderType: 'visa'; // To distinguish from legalization orders
  userId?: string;
  locale?: string;
  
  // Visa-specific fields
  destinationCountry: string;
  destinationCountryCode: string;
  nationality: string;
  nationalityCode: string;
  
  // Selected visa product
  visaProduct: {
    id: string;
    name: string;
    category: VisaCategory;
    visaType: 'e-visa' | 'sticker';
    entryType: 'single' | 'double' | 'multiple';
    validityDays: number;
    price: number;
    processingDays: number;
  };
  
  // Travel dates
  departureDate: string;
  returnDate: string;
  passportNeededBy: string;
  
  // Traveler count
  travelerCount: number;
  
  // Shipping (only for sticker visa)
  pickupService?: boolean;
  pickupMethod?: string;
  pickupAddress?: {
    street: string;
    postalCode: string;
    city: string;
  };
  pickupDate?: string;
  returnService?: string;
  returnAddress?: {
    firstName?: string;
    lastName?: string;
    companyName?: string;
    street?: string;
    addressLine2?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    countryCode?: string;
    phone?: string;
    email?: string;
  };
  
  // Customer info
  customerType: 'private' | 'company';
  customerInfo: {
    firstName?: string;
    lastName?: string;
    companyName?: string;
    email: string;
    phone: string;
    address?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    countryCode?: string;
  };
  billingInfo?: {
    firstName?: string;
    lastName?: string;
    companyName?: string;
    organizationNumber?: string;
    vatNumber?: string;
    street?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    email?: string;
    phone?: string;
  };
  
  // Order details
  invoiceReference?: string;
  additionalNotes?: string;
  
  // Pricing
  totalPrice: number;
  pricingBreakdown?: {
    serviceFee: number; // DOX service fee
    embassyFee: number; // Embassy/government fee
    shippingFee?: number;
    expeditedFee?: number;
  };
  
  // Status
  status: 'pending' | 'received' | 'documents-required' | 'processing' | 'submitted-to-embassy' | 'approved' | 'ready-for-return' | 'completed' | 'rejected' | 'cancelled';
  
  // Processing steps for visa
  processingSteps?: VisaProcessingStep[];
  
  // Admin notes
  adminNotes?: AdminNote[];
  internalNotes?: string;
  
  // Tracking
  returnTrackingNumber?: string;
  returnTrackingUrl?: string;
  
  // Timestamps
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  submittedToEmbassyAt?: Timestamp;
  approvedAt?: Timestamp;
  completedAt?: Timestamp;
}

export interface VisaProcessingStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completedAt?: Timestamp;
  completedBy?: string;
  notes?: string;
}

export interface AdminNote {
  id: string;
  content: string;
  createdAt: Timestamp;
  createdBy: string;
  type: 'general' | 'processing' | 'customer' | 'issue';
}

// Default processing steps for visa orders
export const getDefaultVisaProcessingSteps = (isEVisa: boolean): VisaProcessingStep[] => {
  const baseSteps: VisaProcessingStep[] = [
    {
      id: 'order-verification',
      name: 'Order Verification',
      description: 'Verify order details, pricing and customer information',
      status: 'pending'
    },
    {
      id: 'documents-review',
      name: 'Documents Review',
      description: 'Review uploaded documents for completeness and accuracy',
      status: 'pending'
    },
    {
      id: 'application-preparation',
      name: 'Application Preparation',
      description: 'Prepare visa application forms and supporting documents',
      status: 'pending'
    },
    {
      id: 'submission',
      name: 'Submit to Embassy/Portal',
      description: isEVisa ? 'Submit application through e-visa portal' : 'Submit application to embassy',
      status: 'pending'
    },
    {
      id: 'processing',
      name: 'Embassy Processing',
      description: 'Application is being processed by the embassy',
      status: 'pending'
    },
    {
      id: 'result',
      name: 'Visa Result',
      description: 'Visa approved or rejected',
      status: 'pending'
    }
  ];

  if (isEVisa) {
    baseSteps.push({
      id: 'delivery',
      name: 'E-Visa Delivery',
      description: 'Send approved e-visa to customer via email',
      status: 'pending'
    });
  } else {
    baseSteps.push(
      {
        id: 'prepare-return',
        name: 'Prepare Return',
        description: 'Pack passport with visa for return shipping',
        status: 'pending'
      },
      {
        id: 'return-shipment',
        name: 'Return Shipment',
        description: 'Ship passport back to customer',
        status: 'pending'
      }
    );
  }

  baseSteps.push({
    id: 'invoicing',
    name: 'Invoicing',
    description: 'Create and send invoice to customer',
    status: 'pending'
  });

  return baseSteps;
};

const VISA_ORDERS_COLLECTION = 'visaOrders';
const COUNTERS_COLLECTION = 'counters';
const ORDER_CONFIRMATIONS_COLLECTION = 'orderConfirmations';

// Generate a random token for order confirmation
function generateConfirmationToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Get the next visa order number using counter document (avoids getCountFromServer permission issues)
async function getNextVisaOrderNumber(): Promise<number> {
  try {
    const counterRef = doc(db, COUNTERS_COLLECTION, 'visaOrders');
    const counterSnap = await getDoc(counterRef);
    
    let currentCount = 0;
    if (counterSnap.exists()) {
      const data = counterSnap.data();
      currentCount = typeof data.currentCount === 'number' ? data.currentCount : 0;
    }
    
    const nextNumber = currentCount + 1;
    
    await setDoc(counterRef, { 
      currentCount: nextNumber,
      lastUpdated: Timestamp.now()
    }, { merge: true });
    
    return nextNumber;
  } catch (error) {
    // Fallback to timestamp-based number if counter fails
    return Math.floor(Date.now() / 1000) % 1000000;
  }
}

// Format visa order ID
function formatVisaOrderId(number: number): string {
  return `VISA${number.toString().padStart(6, '0')}`;
}

// Create a new visa order and return { orderId, token } for confirmation page
export const createVisaOrder = async (
  orderData: Omit<VisaOrder, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'userId' | 'orderNumber' | 'orderType' | 'processingSteps'>
): Promise<{ orderId: string; token: string }> => {
  try {
    const currentUser = auth.currentUser;
    const nextNumber = await getNextVisaOrderNumber();
    const formattedOrderId = formatVisaOrderId(nextNumber);
    const confirmationToken = generateConfirmationToken();
    
    const isEVisa = orderData.visaProduct.visaType === 'e-visa';
    
    // Build order object without undefined values (Firebase doesn't allow undefined)
    const orderWithTimestamps: Record<string, any> = {
      ...orderData,
      orderType: 'visa',
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      orderNumber: formattedOrderId,
      processingSteps: getDefaultVisaProcessingSteps(isEVisa)
    };
    
    // Only add userId if user is logged in
    if (currentUser?.uid) {
      orderWithTimestamps.userId = currentUser.uid;
    }
    
    // Remove any undefined values from the order object
    Object.keys(orderWithTimestamps).forEach(key => {
      if (orderWithTimestamps[key] === undefined) {
        delete orderWithTimestamps[key];
      }
    });

    // Save the order
    await setDoc(doc(db, VISA_ORDERS_COLLECTION, formattedOrderId), orderWithTimestamps);
    
    // Create public confirmation document with token for secure access
    const confirmationData: Record<string, any> = {
      orderId: formattedOrderId,
      orderType: 'visa',
      orderNumber: formattedOrderId,
      createdAt: Timestamp.now(),
      // Non-sensitive order summary for confirmation page
      destinationCountry: orderData.destinationCountry,
      destinationCountryCode: orderData.destinationCountryCode,
      nationality: orderData.nationality,
      nationalityCode: orderData.nationalityCode,
      visaProduct: orderData.visaProduct,
      departureDate: orderData.departureDate,
      returnDate: orderData.returnDate,
      passportNeededBy: orderData.passportNeededBy,
      totalPrice: orderData.totalPrice,
      customerType: orderData.customerType,
      customerInfo: {
        firstName: orderData.customerInfo?.firstName || '',
        lastName: orderData.customerInfo?.lastName || '',
        companyName: orderData.customerInfo?.companyName || '',
        email: orderData.customerInfo?.email || '',
        phone: orderData.customerInfo?.phone || '',
      },
      status: 'pending'
    };
    
    // Only add returnAddress if it exists (not for e-visa)
    if (orderData.returnAddress && orderData.returnAddress.street) {
      confirmationData.returnAddress = orderData.returnAddress;
    }
    
    await setDoc(doc(db, ORDER_CONFIRMATIONS_COLLECTION, confirmationToken), confirmationData);
    
    return { orderId: formattedOrderId, token: confirmationToken };
  } catch (error) {
    throw error;
  }
};

// Get visa order confirmation by token (for public confirmation page)
export const getVisaOrderConfirmationByToken = async (token: string): Promise<any | null> => {
  try {
    if (!token) return null;
    
    const confirmationRef = doc(db, ORDER_CONFIRMATIONS_COLLECTION, token);
    const confirmationSnap = await getDoc(confirmationRef);
    
    if (confirmationSnap.exists()) {
      return { id: confirmationSnap.id, ...confirmationSnap.data() };
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

// Get all visa orders
export const getAllVisaOrders = async (): Promise<VisaOrder[]> => {
  try {
    const ordersQuery = query(
      collection(db, VISA_ORDERS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(ordersQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as VisaOrder));
  } catch (error) {
    throw error;
  }
};

// Get a single visa order by ID
export const getVisaOrder = async (orderId: string): Promise<VisaOrder | null> => {
  try {
    const docRef = doc(db, VISA_ORDERS_COLLECTION, orderId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as VisaOrder;
    }
    return null;
  } catch (error) {
    throw error;
  }
};

// Update a visa order
export const updateVisaOrder = async (orderId: string, updates: Partial<VisaOrder>): Promise<void> => {
  try {
    const docRef = doc(db, VISA_ORDERS_COLLECTION, orderId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    throw error;
  }
};

// Update visa order status
export const updateVisaOrderStatus = async (
  orderId: string, 
  status: VisaOrder['status']
): Promise<void> => {
  try {
    const updates: Partial<VisaOrder> = { status };
    
    // Add timestamp for specific statuses
    if (status === 'submitted-to-embassy') {
      updates.submittedToEmbassyAt = Timestamp.now();
    } else if (status === 'approved') {
      updates.approvedAt = Timestamp.now();
    } else if (status === 'completed') {
      updates.completedAt = Timestamp.now();
    }
    
    await updateVisaOrder(orderId, updates);
  } catch (error) {
    throw error;
  }
};

// Update processing step
export const updateVisaProcessingStep = async (
  orderId: string,
  stepId: string,
  stepUpdate: Partial<VisaProcessingStep>
): Promise<void> => {
  try {
    const order = await getVisaOrder(orderId);
    if (!order || !order.processingSteps) return;
    
    const updatedSteps = order.processingSteps.map(step => 
      step.id === stepId 
        ? { ...step, ...stepUpdate, completedAt: stepUpdate.status === 'completed' ? Timestamp.now() : step.completedAt }
        : step
    );
    
    await updateVisaOrder(orderId, { processingSteps: updatedSteps });
  } catch (error) {
    throw error;
  }
};

// Get visa orders by customer email
export const getVisaOrdersByEmail = async (email: string): Promise<VisaOrder[]> => {
  try {
    const ordersQuery = query(
      collection(db, VISA_ORDERS_COLLECTION),
      where('customerInfo.email', '==', email),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(ordersQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as VisaOrder));
  } catch (error) {
    throw error;
  }
};

// Get visa orders by status
export const getVisaOrdersByStatus = async (status: VisaOrder['status']): Promise<VisaOrder[]> => {
  try {
    const ordersQuery = query(
      collection(db, VISA_ORDERS_COLLECTION),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(ordersQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as VisaOrder));
  } catch (error) {
    throw error;
  }
};

// Delete a visa order (admin only)
export const deleteVisaOrder = async (orderId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, VISA_ORDERS_COLLECTION, orderId));
  } catch (error) {
    throw error;
  }
};
