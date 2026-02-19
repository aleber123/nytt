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

// ── SALES EMAIL ──

const CUSTOMER_EMAILS_COLLECTION = 'customerEmails';

export interface CrmEmailParams {
  to: string;
  toName: string;
  subject: string;
  bodyHtml: string;
  leadId: string;
  sentBy: string;
}

// Generate a professional sales email HTML wrapper
export const generateSalesEmailHtml = (params: {
  recipientName: string;
  bodyText: string;
  senderName: string;
}): string => {
  const { recipientName, bodyText, senderName } = params;
  const bodyHtml = bodyText.replace(/\n/g, '<br/>');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #202124; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px; }
    .email-container { background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background: #2E2D2C; color: #ffffff; padding: 24px 36px; text-align: center; }
    .header img { max-height: 40px; width: auto; }
    .content { padding: 32px 36px; }
    .greeting { font-size: 16px; font-weight: 600; color: #202124; margin-bottom: 16px; }
    .body-text { font-size: 15px; color: #374151; line-height: 1.7; }
    .signature { margin-top: 28px; padding-top: 20px; border-top: 1px solid #eaecef; font-size: 14px; color: #5f6368; }
    .footer { background: #f8f9fa; padding: 20px 36px; text-align: center; border-top: 1px solid #eaecef; }
    .footer p { margin: 4px 0; color: #9ca3af; font-size: 12px; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="https://doxvl.se/dox-logo-new.png" alt="DOX Visumpartner AB">
    </div>
    <div class="content">
      ${recipientName ? `<div class="greeting">Dear ${recipientName},</div>` : ''}
      <div class="body-text">${bodyHtml}</div>
      <div class="signature">
        <strong>${senderName}</strong><br/>
        DOX Visumpartner AB<br/>
        📧 <a href="mailto:info@doxvl.se">info@doxvl.se</a> · 📞 08-40941900<br/>
        <a href="https://doxvl.se">doxvl.se</a>
      </div>
    </div>
    <div class="footer">
      <p>DOX Visumpartner AB · Livdjursgatan 4 · 121 62 Johanneshov</p>
    </div>
  </div>
</body>
</html>`;
};

// Send a sales email via the customerEmails queue (triggers Cloud Function)
export const sendCrmEmail = async (params: CrmEmailParams): Promise<void> => {
  if (!db) throw new Error('Firestore is not initialized');

  // Queue the email (Cloud Function will pick it up and send via SMTP)
  await addDoc(collection(db, CUSTOMER_EMAILS_COLLECTION), {
    name: params.toName,
    email: params.to,
    phone: '',
    subject: params.subject,
    message: params.bodyHtml,
    orderId: '',
    createdAt: new Date(),
    status: 'unread',
    type: 'crm_sales_email',
    crmLeadId: params.leadId,
  });

  // Log as activity on the lead
  await addActivity({
    leadId: params.leadId,
    type: 'email',
    description: `Email sent: "${params.subject}"`,
    createdBy: params.sentBy,
  });

  // Update lead status to 'contacted' if still 'new'
  try {
    const lead = await getLead(params.leadId);
    if (lead && lead.status === 'new') {
      await updateLead(params.leadId, { status: 'contacted' as LeadStatus });
    }
  } catch (_) { /* ignore */ }
};

// Send bulk sales emails to multiple leads
export const sendBulkCrmEmails = async (
  leadIds: string[],
  subject: string,
  bodyText: string,
  senderName: string,
): Promise<{ sent: number; failed: number }> => {
  let sent = 0;
  let failed = 0;

  for (const leadId of leadIds) {
    try {
      const lead = await getLead(leadId);
      if (!lead || !lead.email) { failed++; continue; }

      const html = generateSalesEmailHtml({
        recipientName: lead.contactName || '',
        bodyText,
        senderName,
      });

      await sendCrmEmail({
        to: lead.email,
        toName: lead.contactName || lead.companyName || '',
        subject,
        bodyHtml: html,
        leadId,
        sentBy: senderName,
      });
      sent++;
    } catch (_) {
      failed++;
    }
  }

  return { sent, failed };
};

// ── CSV EXPORT ──

export const exportLeadsToCsv = (leads: CrmLead[]): string => {
  const headers = ['Company', 'Contact', 'Email', 'Phone', 'Website', 'Status', 'Source', 'Follow-up', 'Est. Value (SEK)', 'Notes', 'Tags', 'Created'];
  const rows = leads.map((l) => [
    l.companyName || '',
    l.contactName || '',
    l.email || '',
    l.phone || '',
    l.website || '',
    l.status || '',
    l.source || '',
    l.followUpDate || '',
    l.estimatedValue != null ? String(l.estimatedValue) : '',
    (l.notes || '').replace(/[\n\r]+/g, ' '),
    (l.tags || []).join('; '),
    l.createdAt?.toDate ? l.createdAt.toDate().toISOString().split('T')[0] : '',
  ]);

  const escape = (v: string) => {
    if (v.includes(',') || v.includes('"') || v.includes('\n')) {
      return '"' + v.replace(/"/g, '""') + '"';
    }
    return v;
  };

  const lines = [headers.map(escape).join(',')];
  for (const row of rows) {
    lines.push(row.map(escape).join(','));
  }
  return lines.join('\n');
};
