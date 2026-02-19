/**
 * CRM Service
 * Simple sales CRM for tracking leads, contacts and follow-ups
 */

import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';

const CRM_LEADS_COLLECTION = 'crmLeads';
const CRM_ACTIVITIES_COLLECTION = 'crmActivities';

export type LeadStatus = 'new' | 'contacted' | 'meeting' | 'proposal' | 'won' | 'lost';
export type LeadSource = 'email-list' | 'referral' | 'website' | 'cold-call' | 'linkedin' | 'event' | 'other';

export interface CrmLead {
  id?: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website?: string;
  status: LeadStatus;
  source: LeadSource;
  notes: string;
  followUpDate?: string; // YYYY-MM-DD
  estimatedValue?: number; // SEK
  tags?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;
}

export interface CrmActivity {
  id?: string;
  leadId: string;
  type: 'note' | 'call' | 'email' | 'meeting';
  description: string;
  createdAt: Timestamp;
  createdBy?: string;
}

// ── LEADS ──

export const getAllLeads = async (): Promise<CrmLead[]> => {
  if (!db) throw new Error('Firestore is not initialized');
  const q = query(collection(db, CRM_LEADS_COLLECTION), orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CrmLead));
};

export const getLead = async (id: string): Promise<CrmLead | null> => {
  if (!db) throw new Error('Firestore is not initialized');
  const snap = await getDoc(doc(db, CRM_LEADS_COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as CrmLead;
};

export const createLead = async (lead: Omit<CrmLead, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  if (!db) throw new Error('Firestore is not initialized');
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, CRM_LEADS_COLLECTION), {
    ...lead,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
};

export const updateLead = async (id: string, data: Partial<CrmLead>): Promise<void> => {
  if (!db) throw new Error('Firestore is not initialized');
  const { id: _id, ...rest } = data as any;
  await updateDoc(doc(db, CRM_LEADS_COLLECTION, id), {
    ...rest,
    updatedAt: Timestamp.now(),
  });
};

export const deleteLead = async (id: string): Promise<void> => {
  if (!db) throw new Error('Firestore is not initialized');
  await deleteDoc(doc(db, CRM_LEADS_COLLECTION, id));
};

// Parse a messy line into structured lead data
interface ParsedLine {
  email: string;
  contactName: string;
  companyName: string;
  phone: string;
  notes: string;
  tags: string[];
}

const parseLine = (raw: string): ParsedLine | null => {
  const line = raw.trim();
  if (!line) return null;

  // Extract email (first thing that looks like an email)
  const emailMatch = line.match(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/);
  if (!emailMatch) return null;
  const email = emailMatch[0].toLowerCase();

  // Remove the email from the line to parse the rest
  let rest = line.replace(emailMatch[0], '').trim();

  // Extract phone number (Swedish format: 07xx, +46, or 0xxx)
  let phone = '';
  const phoneMatch = rest.match(/(?:\+46|0)\s*\d[\d\s\-]{6,12}/);
  if (phoneMatch) {
    phone = phoneMatch[0].replace(/\s+/g, '').trim();
    rest = rest.replace(phoneMatch[0], '').trim();
  }

  // Detect star/priority tags
  const tags: string[] = [];
  if (rest.includes('⭐') || rest.includes('*')) {
    tags.push('priority');
    rest = rest.replace(/[⭐️*]/g, '').trim();
  }

  // Clean up separators
  rest = rest.replace(/^[-–—]+/, '').replace(/[-–—]+$/, '').trim();

  // Extract company name from email domain
  const domain = email.split('@')[1] || '';
  const domainBase = domain.split('.')[0] || '';
  const companyFromDomain = domainBase.charAt(0).toUpperCase() + domainBase.slice(1);

  // Try to extract contact name from the email local part (firstname.lastname@)
  const localPart = email.split('@')[0] || '';
  let contactName = '';
  if (localPart.includes('.') || localPart.includes('_')) {
    const parts = localPart.split(/[._]/).filter((p) => p.length > 1 && !/^\d+$/.test(p) && !/^ext$/i.test(p));
    if (parts.length >= 2) {
      contactName = parts
        .slice(0, 2)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(' ');
    }
  }

  // Whatever is left becomes notes (company name hints, role info, etc.)
  const notes = rest.replace(/^[,;\s]+/, '').replace(/[,;\s]+$/, '').trim();

  // If rest looks like a person name (mentioned after email), use it
  const nameFromRest = notes.match(/^([A-ZÅÄÖ][a-zåäö]+(?:\s+[A-ZÅÄÖ][a-zåäö]+)?)\s*$/);
  let finalContactName = contactName;
  let finalNotes = notes;
  if (nameFromRest) {
    finalContactName = nameFromRest[1];
    finalNotes = '';
  }

  return {
    email,
    contactName: finalContactName,
    companyName: companyFromDomain,
    phone,
    notes: finalNotes,
    tags,
  };
};

// Bulk import leads from raw text lines (handles messy data with emails, names, phones, notes)
export const bulkImportLeads = async (
  lines: string[],
  source: LeadSource = 'email-list',
  createdBy?: string
): Promise<number> => {
  if (!db) throw new Error('Firestore is not initialized');

  // Parse all lines
  const parsed: ParsedLine[] = [];
  const seenEmails = new Set<string>();
  for (const line of lines) {
    const result = parseLine(line);
    if (result && !seenEmails.has(result.email)) {
      seenEmails.add(result.email);
      parsed.push(result);
    }
  }
  if (parsed.length === 0) return 0;

  // Check which emails already exist
  const existing = await getAllLeads();
  const existingEmails = new Set(existing.map((l) => l.email.toLowerCase()));
  const newLeads = parsed.filter((p) => !existingEmails.has(p.email));

  if (newLeads.length === 0) return 0;

  const now = Timestamp.now();
  // Firestore batch limit is 500
  const batches: ParsedLine[][] = [];
  for (let i = 0; i < newLeads.length; i += 400) {
    batches.push(newLeads.slice(i, i + 400));
  }

  let imported = 0;
  for (const batch of batches) {
    const fb = writeBatch(db);
    for (const lead of batch) {
      const ref = doc(collection(db, CRM_LEADS_COLLECTION));
      fb.set(ref, {
        companyName: lead.companyName,
        contactName: lead.contactName,
        email: lead.email,
        phone: lead.phone,
        status: 'new' as LeadStatus,
        source,
        notes: lead.notes,
        tags: lead.tags,
        createdAt: now,
        updatedAt: now,
        createdBy: createdBy || '',
      });
      imported++;
    }
    await fb.commit();
  }

  return imported;
};

// ── ACTIVITIES ──

export const getActivitiesForLead = async (leadId: string): Promise<CrmActivity[]> => {
  if (!db) throw new Error('Firestore is not initialized');
  const q = query(
    collection(db, CRM_ACTIVITIES_COLLECTION),
    where('leadId', '==', leadId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CrmActivity));
};

export const addActivity = async (activity: Omit<CrmActivity, 'id' | 'createdAt'>): Promise<string> => {
  if (!db) throw new Error('Firestore is not initialized');
  const ref = await addDoc(collection(db, CRM_ACTIVITIES_COLLECTION), {
    ...activity,
    createdAt: Timestamp.now(),
  });
  // Also bump the lead's updatedAt
  try {
    await updateDoc(doc(db, CRM_LEADS_COLLECTION, activity.leadId), { updatedAt: Timestamp.now() });
  } catch (_) { /* ignore */ }
  return ref.id;
};
