/**
 * Portal Customer Service
 * Manages customer portal accounts for enterprise/large customers.
 * These customers can log in to view their orders and place new ones.
 */

import { db } from './config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';

export interface SavedAddress {
  id: string;
  label: string;          // e.g. "Head Office", "Warehouse"
  street: string;
  postalCode: string;
  city: string;
  contactName: string;
  contactPhone: string;
}

export interface PortalCustomer {
  id: string;             // Firebase Auth UID (set after first login)
  email: string;
  displayName: string;
  companyName: string;
  companyId: string;      // Unique company identifier for filtering orders
  phone?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
  notes?: string;
  savedAddresses?: SavedAddress[];
}

export interface PortalCustomerInput {
  email: string;
  displayName: string;
  companyName: string;
  phone?: string;
  isActive?: boolean;
  notes?: string;
}

const COLLECTION_NAME = 'portalCustomers';

// Get portal customer by UID
export async function getPortalCustomer(uid: string): Promise<PortalCustomer | null> {
  try {
    if (!db) return null;
    const docRef = doc(db, COLLECTION_NAME, uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as PortalCustomer;
  } catch (error) {
    console.error('Error getting portal customer:', error);
    return null;
  }
}

// Get portal customer by email
export async function getPortalCustomerByEmail(email: string): Promise<PortalCustomer | null> {
  try {
    if (!db) return null;
    const q = query(collection(db, COLLECTION_NAME), where('email', '==', email.toLowerCase()));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return { id: d.id, ...d.data() } as PortalCustomer;
  } catch (error) {
    console.error('Error getting portal customer by email:', error);
    return null;
  }
}

// Link pending portal customer to Firebase Auth UID (on first login)
export async function linkPortalCustomer(realUid: string, email: string): Promise<PortalCustomer | null> {
  try {
    if (!db) return null;

    // Check if already linked by UID
    const realDocRef = doc(db, COLLECTION_NAME, realUid);
    const realDocSnap = await getDoc(realDocRef);
    if (realDocSnap.exists()) {
      return { id: realDocSnap.id, ...realDocSnap.data() } as PortalCustomer;
    }

    // Find pending document by email
    const q = query(collection(db, COLLECTION_NAME), where('email', '==', email.toLowerCase()));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const pendingDoc = snapshot.docs[0];
    const pendingData = pendingDoc.data();

    if (pendingDoc.id === realUid) {
      return { id: pendingDoc.id, ...pendingData } as PortalCustomer;
    }

    // Copy to new doc with real UID
    await setDoc(realDocRef, {
      ...pendingData,
      updatedAt: Timestamp.now(),
      lastLoginAt: Timestamp.now(),
    });

    // Delete old pending doc
    await deleteDoc(doc(db, COLLECTION_NAME, pendingDoc.id));

    return { id: realUid, ...pendingData, lastLoginAt: Timestamp.now() } as PortalCustomer;
  } catch (error) {
    console.error('Error linking portal customer:', error);
    return null;
  }
}

// Update last login
export async function updatePortalLastLogin(uid: string): Promise<void> {
  try {
    if (!db) return;
    const docRef = doc(db, COLLECTION_NAME, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await updateDoc(docRef, { lastLoginAt: Timestamp.now() });
    }
  } catch (error) {
    // Silent fail
  }
}

// Get all portal customers (for admin)
export async function getAllPortalCustomers(): Promise<PortalCustomer[]> {
  try {
    if (!db) return [];
    const q = query(collection(db, COLLECTION_NAME), orderBy('companyName', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PortalCustomer));
  } catch (error) {
    console.error('Error getting all portal customers:', error);
    return [];
  }
}

// Create portal customer (from admin)
export async function createPortalCustomer(input: PortalCustomerInput): Promise<string> {
  if (!db) throw new Error('Database not available');

  const companyId = input.companyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const pendingId = `pending_${input.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const docRef = doc(db, COLLECTION_NAME, pendingId);

  await setDoc(docRef, {
    email: input.email.toLowerCase(),
    displayName: input.displayName,
    companyName: input.companyName,
    companyId,
    phone: input.phone || '',
    isActive: input.isActive !== false,
    notes: input.notes || '',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return pendingId;
}

// Update portal customer
export async function updatePortalCustomer(id: string, updates: Partial<PortalCustomerInput>): Promise<void> {
  if (!db) throw new Error('Database not available');
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

// Delete portal customer
export async function deletePortalCustomer(id: string): Promise<void> {
  if (!db) throw new Error('Database not available');
  await deleteDoc(doc(db, COLLECTION_NAME, id));
}
