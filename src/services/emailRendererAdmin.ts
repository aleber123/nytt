/**
 * Server-side email renderer (Firebase Admin SDK).
 *
 * Used by API routes that run server-side and need to fetch templates without
 * the client SDK. Shares renderTemplate() and substituteVariables() with the
 * client variant so behaviour is identical.
 */

import { getAdminDb } from '@/lib/firebaseAdmin';
import {
  EmailTemplate,
  EmailDesignSettings,
  DEFAULT_DESIGN_SETTINGS,
  DEFAULT_EMAIL_TEMPLATES,
} from '@/firebase/emailTemplateService';
import { renderTemplate, type RenderEmailOptions, type RenderedEmail } from './emailRenderer';

const COLLECTION = 'emailTemplates';
const SETTINGS_DOC_ID = '__design_settings__';

export async function getEmailTemplateAdmin(id: string): Promise<EmailTemplate | null> {
  try {
    const db = getAdminDb();
    const snap = await db.collection(COLLECTION).doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...(snap.data() as object) } as EmailTemplate;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[emailRendererAdmin] Failed to load template "${id}"`, err);
    return null;
  }
}

export async function getEmailDesignSettingsAdmin(): Promise<EmailDesignSettings> {
  try {
    const db = getAdminDb();
    const snap = await db.collection(COLLECTION).doc(SETTINGS_DOC_ID).get();
    if (!snap.exists) return DEFAULT_DESIGN_SETTINGS;
    return { ...DEFAULT_DESIGN_SETTINGS, ...(snap.data() as object) } as EmailDesignSettings;
  } catch {
    return DEFAULT_DESIGN_SETTINGS;
  }
}

function findDefaultTemplate(id: string): EmailTemplate | null {
  const found = DEFAULT_EMAIL_TEMPLATES.find(t => t.id === id);
  if (!found) return null;
  return { ...found, createdAt: null, updatedAt: null } as EmailTemplate;
}

/**
 * Server-side render. Same contract as renderEmail() in emailRenderer.ts.
 */
export async function renderEmailAdmin(
  templateId: string,
  variables: Record<string, any>,
  locale: 'sv' | 'en',
  options: RenderEmailOptions = {}
): Promise<RenderedEmail> {
  let template = await getEmailTemplateAdmin(templateId);
  if (!template) template = findDefaultTemplate(templateId);

  if (!template) {
    // eslint-disable-next-line no-console
    console.warn(`[emailRendererAdmin] No template found for id "${templateId}" — caller should fall back`);
    return { subject: '', html: '', rendered: false };
  }

  const settings = await getEmailDesignSettingsAdmin();
  return renderTemplate(template, settings, variables, locale, options);
}
