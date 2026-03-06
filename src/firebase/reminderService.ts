/**
 * Reminder Service
 * Manages order reminders for admin users (handläggare)
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

export interface OrderReminder {
  id?: string;
  orderId: string;
  orderNumber?: string; // Denormalized for fast display
  assignedTo: string; // AdminUser UID
  assignedToName?: string;
  message: string;
  dueDate: Timestamp | string;
  createdAt: Timestamp | string;
  createdBy: string;
  status: 'active' | 'snoozed' | 'dismissed';
  snoozedUntil?: Timestamp | string | null;
}

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
