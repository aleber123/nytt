/**
 * Reminder Service
 * Manages reminders for admin users (handläggare)
 * Supports both orders and CRM leads
 */

import { db } from './config';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';

// Entity types that can have reminders
export type ReminderEntityType = 'order' | 'crm_lead';

// Reminder types (mainly for CRM)
export type ReminderType = 'follow-up' | 'call' | 'email' | 'meeting' | 'task' | 'other';

export interface Reminder {
  id?: string;
  // Generic entity reference (replaces orderId for flexibility)
  entityType: ReminderEntityType;
  entityId: string;
  entityLabel?: string; // "Order #12345" or "Acme Corp" for display
  
  // Legacy field for backwards compatibility with existing order reminders
  orderId?: string;
  orderNumber?: string;
  
  assignedTo: string; // AdminUser UID
  assignedToName?: string;
  message: string;
  dueDate: Timestamp | string;
  createdAt: Timestamp | string;
  createdBy: string;
  status: 'active' | 'snoozed' | 'dismissed';
  snoozedUntil?: Timestamp | string | null;
  
  // CRM-specific fields
  reminderType?: ReminderType;
}

// Backwards compatibility alias
export type OrderReminder = Reminder;

const COLLECTION_NAME = 'reminders';

/**
 * Create a new reminder
 */
export async function createReminder(reminder: Omit<OrderReminder, 'id'>): Promise<string> {
  if (!db) throw new Error('Database not initialized');
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...reminder,
    createdAt: Timestamp.now(),
    status: 'active',
  });
  return docRef.id;
}

/**
 * Get all reminders for a specific order
 */
export async function getRemindersByOrder(orderId: string): Promise<OrderReminder[]> {
  if (!db) return [];
  const q = query(
    collection(db, COLLECTION_NAME),
    where('orderId', '==', orderId),
    orderBy('dueDate', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrderReminder));
}

/**
 * Get all active/snoozed reminders for a specific user
 */
export async function getRemindersByUser(userId: string): Promise<OrderReminder[]> {
  if (!db) return [];
  const q = query(
    collection(db, COLLECTION_NAME),
    where('assignedTo', '==', userId),
    where('status', 'in', ['active', 'snoozed']),
    orderBy('dueDate', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrderReminder));
}

/**
 * Snooze a reminder until a given date
 */
export async function snoozeReminder(reminderId: string, snoozedUntil: Date): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  const docRef = doc(db, COLLECTION_NAME, reminderId);
  await updateDoc(docRef, {
    status: 'snoozed',
    snoozedUntil: Timestamp.fromDate(snoozedUntil),
    dueDate: Timestamp.fromDate(snoozedUntil),
  });
}

/**
 * Dismiss a reminder
 */
export async function dismissReminder(reminderId: string): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  const docRef = doc(db, COLLECTION_NAME, reminderId);
  await updateDoc(docRef, { status: 'dismissed' });
}

/**
 * Update a reminder (edit message, dueDate, assignedTo, etc.)
 */
export async function updateReminder(reminderId: string, updates: Partial<Pick<OrderReminder, 'message' | 'dueDate' | 'assignedTo' | 'assignedToName'>>): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  const docRef = doc(db, COLLECTION_NAME, reminderId);
  const data: Record<string, any> = {};
  if (updates.message !== undefined) data.message = updates.message;
  if (updates.assignedTo !== undefined) data.assignedTo = updates.assignedTo;
  if (updates.assignedToName !== undefined) data.assignedToName = updates.assignedToName;
  if (updates.dueDate !== undefined) {
    const d = typeof updates.dueDate === 'string' ? new Date(updates.dueDate) : updates.dueDate;
    data.dueDate = d instanceof Date ? Timestamp.fromDate(d) : d;
  }
  if (Object.keys(data).length > 0) {
    await updateDoc(docRef, data);
  }
}

/**
 * Delete a reminder permanently
 */
export async function deleteReminder(reminderId: string): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  const docRef = doc(db, COLLECTION_NAME, reminderId);
  await deleteDoc(docRef);
}

/**
 * Get all reminders for a specific entity (order or CRM lead)
 */
export async function getRemindersByEntity(entityType: ReminderEntityType, entityId: string): Promise<Reminder[]> {
  if (!db) return [];
  const q = query(
    collection(db, COLLECTION_NAME),
    where('entityType', '==', entityType),
    where('entityId', '==', entityId),
    orderBy('dueDate', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reminder));
}

/**
 * Create a CRM reminder (convenience function)
 */
export async function createCrmReminder(params: {
  leadId: string;
  leadLabel: string; // Company name or contact name
  assignedTo: string;
  assignedToName?: string;
  message: string;
  dueDate: Date;
  reminderType: ReminderType;
  createdBy: string;
}): Promise<string> {
  return createReminder({
    entityType: 'crm_lead',
    entityId: params.leadId,
    entityLabel: params.leadLabel,
    assignedTo: params.assignedTo,
    assignedToName: params.assignedToName,
    message: params.message,
    dueDate: Timestamp.fromDate(params.dueDate),
    createdAt: Timestamp.now(),
    createdBy: params.createdBy,
    status: 'active',
    reminderType: params.reminderType,
  });
}

/**
 * Create an order reminder (convenience function, maintains backwards compatibility)
 */
export async function createOrderReminder(params: {
  orderId: string;
  orderNumber?: string;
  assignedTo: string;
  assignedToName?: string;
  message: string;
  dueDate: Date;
  createdBy: string;
}): Promise<string> {
  return createReminder({
    entityType: 'order',
    entityId: params.orderId,
    entityLabel: params.orderNumber ? `Order #${params.orderNumber}` : undefined,
    orderId: params.orderId, // Legacy field
    orderNumber: params.orderNumber, // Legacy field
    assignedTo: params.assignedTo,
    assignedToName: params.assignedToName,
    message: params.message,
    dueDate: Timestamp.fromDate(params.dueDate),
    createdAt: Timestamp.now(),
    createdBy: params.createdBy,
    status: 'active',
  });
}
