import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  limit,
  startAfter,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from './config';

// Customer types
export interface CustomerContact {
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  isPrimary: boolean;
}

export interface CustomerAddress {
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

// Custom pricing overrides for specific customers
export interface CustomerPricing {
  // Service fees
  doxServiceFee?: number;      // Custom DOX service fee (e.g., 900 kr instead of standard)
  expressServiceFee?: number;  // Custom express fee
  apostilleServiceFee?: number;
  notarizationServiceFee?: number;
  embassyServiceFee?: number;
  translationServiceFee?: number;
  chamberServiceFee?: number;
  udServiceFee?: number;
  
  // Pickup fees
  dhlPickupFee?: number;              // DHL standard pickup
  dhlExpressPickupFee?: number;       // DHL premium/express pickup
  stockholmCourierFee?: number;       // Stockholm local courier
  stockholmSamedayFee?: number;       // Stockholm same-day courier
  
  // DHL Return delivery options
  dhlEndOfDayFee?: number;            // DHL End of Day delivery
  dhlPre12Fee?: number;               // DHL Pre 12 delivery
  dhlPre9Fee?: number;                // DHL Pre 9 delivery
  
  // Stockholm Courier return delivery options
  stockholmCityFee?: number;          // Stockholm City (normal)
  stockholmExpressFee?: number;       // Stockholm Express
  stockholmUrgentFee?: number;        // Stockholm Urgent/Same-day
  
  // Return/delivery fees
  scannedCopiesFee?: number;          // Scanned copies fee
  returnDhlFee?: number;              // DHL return shipping
  returnPostnordFee?: number;         // PostNord return shipping
  returnBudFee?: number;              // Local courier return
}

export interface Customer {
  id?: string;
  customerNumber: string;
  
  // Company info
  companyName: string;
  organizationNumber?: string;
  customerType: 'company' | 'government' | 'private';
  industry?: string;
  website?: string;
  
  // Addresses
  billingAddress: CustomerAddress;
  visitingAddress?: CustomerAddress;
  
  // Contact
  phone?: string;
  email?: string;
  
  // Contact persons
  contacts: CustomerContact[];
  
  // Business terms
  paymentTerms: 10 | 20 | 30;
  discountPercent?: number;
  invoiceMethod: 'email' | 'efaktura' | 'paper';
  invoiceReference?: string;
  creditLimit?: number;
  
  // Metadata
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  isActive: boolean;
  
  // Custom pricing and VAT settings
  customPricing?: CustomerPricing;
  vatExempt?: boolean;           // If true, no VAT is charged (e.g., for government or foreign companies)
  emailDomains?: string[];       // Email domains for automatic customer matching (e.g., ['doxvl.se'])
}

export type CustomerInput = Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'customerNumber'>;

const COLLECTION_NAME = 'customers';

// Generate next customer number (K-0001, K-0002, etc.)
async function generateCustomerNumber(): Promise<string> {
  try {
    const customersRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(customersRef);
    
    if (snapshot.empty) {
      return 'K-0001';
    }
    
    // Find highest customer number
    let maxNumber = 0;
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.customerNumber) {
        const num = parseInt(data.customerNumber.replace('K-', ''), 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    });
    
    return `K-${(maxNumber + 1).toString().padStart(4, '0')}`;
  } catch (error) {
    // Fallback: generate based on timestamp
    const timestamp = Date.now().toString().slice(-6);
    return `K-${timestamp}`;
  }
}

// Helper to remove undefined values from object (Firestore doesn't accept undefined)
function removeUndefined(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value === undefined) {
      return; // Skip undefined values
    }
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Timestamp)) {
      result[key] = removeUndefined(value);
    } else {
      result[key] = value;
    }
  });
  return result;
}

// Create a new customer
export async function createCustomer(data: CustomerInput): Promise<string> {
  const customerNumber = await generateCustomerNumber();
  const now = Timestamp.now();
  
  const customerData: Omit<Customer, 'id'> = {
    ...data,
    customerNumber,
    createdAt: now,
    updatedAt: now,
    isActive: true
  };
  
  // Remove undefined values before saving to Firestore
  const cleanData = removeUndefined(customerData);
  
  const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanData);
  return docRef.id;
}

// Get a single customer by ID
export async function getCustomer(id: string): Promise<Customer | null> {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  return { id: docSnap.id, ...docSnap.data() } as Customer;
}

// Get all customers (with pagination)
export async function getCustomers(options?: {
  pageSize?: number;
  lastDoc?: DocumentSnapshot;
  searchTerm?: string;
  customerType?: 'company' | 'government' | 'private';
  activeOnly?: boolean;
}): Promise<{ customers: Customer[]; lastDoc: DocumentSnapshot | null }> {
  try {
    const customersRef = collection(db, COLLECTION_NAME);
    // Simple query without orderBy to avoid index requirements
    const snapshot = await getDocs(customersRef);
    
    let customers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Customer[];
    
    // Client-side filtering
    if (options?.activeOnly !== false) {
      customers = customers.filter(c => c.isActive === true);
    }
    
    if (options?.customerType) {
      customers = customers.filter(c => c.customerType === options.customerType);
    }
    
    // Client-side search filter
    if (options?.searchTerm) {
      const term = options.searchTerm.toLowerCase();
      customers = customers.filter(c => 
        c.companyName?.toLowerCase().includes(term) ||
        c.customerNumber?.toLowerCase().includes(term) ||
        c.organizationNumber?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.contacts?.some(contact => 
          contact.name?.toLowerCase().includes(term) ||
          contact.email?.toLowerCase().includes(term)
        )
      );
    }
    
    // Sort by company name
    customers.sort((a, b) => (a.companyName || '').localeCompare(b.companyName || '', 'sv'));
    
    const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
    
    return { customers, lastDoc };
  } catch (error) {
    console.error('Error fetching customers:', error);
    return { customers: [], lastDoc: null };
  }
}

// Update a customer
export async function updateCustomer(id: string, data: Partial<CustomerInput>): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  
  // Remove undefined values before saving to Firestore
  const cleanData = removeUndefined({
    ...data,
    updatedAt: Timestamp.now()
  });
  
  await updateDoc(docRef, cleanData);
}

// Soft delete a customer (set isActive to false)
export async function deactivateCustomer(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    isActive: false,
    updatedAt: Timestamp.now()
  });
}

// Reactivate a customer
export async function reactivateCustomer(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    isActive: true,
    updatedAt: Timestamp.now()
  });
}

// Hard delete a customer (permanent - use with caution)
export async function deleteCustomer(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}

// Search customers by company name (for autocomplete)
export async function searchCustomersByName(searchTerm: string, maxResults: number = 10): Promise<Customer[]> {
  const { customers } = await getCustomers({ activeOnly: true });
  
  const term = searchTerm.toLowerCase();
  return customers
    .filter(c => c.companyName.toLowerCase().includes(term))
    .slice(0, maxResults);
}

// Get customer by organization number
export async function getCustomerByOrgNumber(orgNumber: string): Promise<Customer | null> {
  const customersRef = collection(db, COLLECTION_NAME);
  const q = query(customersRef, where('organizationNumber', '==', orgNumber), limit(1));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Customer;
}

// Get all customers for a specific type
export async function getCustomersByType(type: 'company' | 'government' | 'private'): Promise<Customer[]> {
  const { customers } = await getCustomers({ customerType: type, activeOnly: true });
  return customers;
}

// Get customer by email domain (for automatic matching during order)
export async function getCustomerByEmailDomain(email: string): Promise<Customer | null> {
  if (!email || !email.includes('@')) {
    return null;
  }
  
  const domain = email.split('@')[1].toLowerCase();
  const { customers } = await getCustomers({ activeOnly: true });
  
  // Find customer with matching email domain
  const matchedCustomer = customers.find(customer => 
    customer.emailDomains?.some(d => d.toLowerCase() === domain)
  );
  
  return matchedCustomer || null;
}
