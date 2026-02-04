/**
 * User Service
 * Manages admin users and their roles/permissions
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

// User roles
export type UserRole = 'super_admin' | 'admin' | 'editor' | 'viewer';

// Role permissions
export const ROLE_PERMISSIONS: Record<UserRole, {
  label: string;
  description: string;
  canManageUsers: boolean;
  canManageOrders: boolean;
  canManageCustomers: boolean;
  canManagePricing: boolean;
  canManageVisaRequirements: boolean;
  canViewReports: boolean;
}> = {
  super_admin: {
    label: 'Super Admin',
    description: 'Full access to all features including user management',
    canManageUsers: true,
    canManageOrders: true,
    canManageCustomers: true,
    canManagePricing: true,
    canManageVisaRequirements: true,
    canViewReports: true
  },
  admin: {
    label: 'Admin',
    description: 'Full access to orders, customers, and pricing',
    canManageUsers: false,
    canManageOrders: true,
    canManageCustomers: true,
    canManagePricing: true,
    canManageVisaRequirements: true,
    canViewReports: true
  },
  editor: {
    label: 'Editor',
    description: 'Can manage orders and customers, but not pricing',
    canManageUsers: false,
    canManageOrders: true,
    canManageCustomers: true,
    canManagePricing: false,
    canManageVisaRequirements: false,
    canViewReports: true
  },
  viewer: {
    label: 'Viewer',
    description: 'Read-only access to orders and reports',
    canManageUsers: false,
    canManageOrders: false,
    canManageCustomers: false,
    canManagePricing: false,
    canManageVisaRequirements: false,
    canViewReports: true
  }
};

// Admin user interface
export interface AdminUser {
  id: string; // Firebase Auth UID
  email: string;
  displayName?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;
  lastLoginAt?: Timestamp;
  notes?: string;
}

export interface AdminUserInput {
  email: string;
  displayName?: string;
  role: UserRole;
  isActive?: boolean;
  notes?: string;
}

const COLLECTION_NAME = 'adminUsers';

// Get user by UID
export async function getAdminUser(uid: string): Promise<AdminUser | null> {
  try {
    if (!db) return null;
    
    const docRef = doc(db, COLLECTION_NAME, uid);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return { id: docSnap.id, ...docSnap.data() } as AdminUser;
  } catch (error) {
    console.error('Error fetching admin user:', error);
    return null;
  }
}

// Get user by email
export async function getAdminUserByEmail(email: string): Promise<AdminUser | null> {
  try {
    if (!db) return null;
    
    const usersRef = collection(db, COLLECTION_NAME);
    const q = query(usersRef, where('email', '==', email.toLowerCase()));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as AdminUser;
  } catch (error) {
    console.error('Error fetching admin user by email:', error);
    return null;
  }
}

// Get all admin users
export async function getAllAdminUsers(): Promise<AdminUser[]> {
  try {
    if (!db) return [];
    
    const usersRef = collection(db, COLLECTION_NAME);
    const q = query(usersRef, orderBy('email', 'asc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AdminUser[];
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return [];
  }
}

// Create or update admin user
export async function createOrUpdateAdminUser(
  uid: string,
  data: AdminUserInput,
  createdBy?: string
): Promise<void> {
  try {
    if (!db) throw new Error('Database not initialized');
    
    const docRef = doc(db, COLLECTION_NAME, uid);
    const existingDoc = await getDoc(docRef);
    
    if (existingDoc.exists()) {
      // Update existing user
      await updateDoc(docRef, {
        ...data,
        email: data.email.toLowerCase(),
        updatedAt: Timestamp.now()
      });
    } else {
      // Create new user
      await setDoc(docRef, {
        ...data,
        email: data.email.toLowerCase(),
        isActive: data.isActive ?? true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: createdBy || 'system'
      });
    }
  } catch (error) {
    console.error('Error creating/updating admin user:', error);
    throw error;
  }
}

// Update admin user role
export async function updateAdminUserRole(uid: string, role: UserRole): Promise<void> {
  try {
    if (!db) throw new Error('Database not initialized');
    
    const docRef = doc(db, COLLECTION_NAME, uid);
    await updateDoc(docRef, {
      role,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating admin user role:', error);
    throw error;
  }
}

// Deactivate admin user
export async function deactivateAdminUser(uid: string): Promise<void> {
  try {
    if (!db) throw new Error('Database not initialized');
    
    const docRef = doc(db, COLLECTION_NAME, uid);
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error deactivating admin user:', error);
    throw error;
  }
}

// Reactivate admin user
export async function reactivateAdminUser(uid: string): Promise<void> {
  try {
    if (!db) throw new Error('Database not initialized');
    
    const docRef = doc(db, COLLECTION_NAME, uid);
    await updateDoc(docRef, {
      isActive: true,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error reactivating admin user:', error);
    throw error;
  }
}

// Delete admin user (permanent)
export async function deleteAdminUser(uid: string): Promise<void> {
  try {
    if (!db) throw new Error('Database not initialized');
    
    const docRef = doc(db, COLLECTION_NAME, uid);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting admin user:', error);
    throw error;
  }
}

// Update last login timestamp
export async function updateLastLogin(uid: string): Promise<void> {
  try {
    if (!db) return;
    
    const docRef = doc(db, COLLECTION_NAME, uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      await updateDoc(docRef, {
        lastLoginAt: Timestamp.now()
      });
    }
  } catch (error) {
    // Silent fail - not critical
  }
}

// Check if user has permission
export function hasPermission(role: UserRole, permission: keyof typeof ROLE_PERMISSIONS['super_admin']): boolean {
  if (permission === 'label' || permission === 'description') return true;
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}
