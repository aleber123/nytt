/**
 * Email Renderer — produces final {subject, html} from a template id + variables.
 *
 * This is the NEW system. Senders may opt in by checking template.useCustomTemplate;
 * when false the existing hardcoded path runs unchanged.
 *
 * Two variants:
 *   - renderEmail()       — client SDK, used inside React components / pages
 *   - renderEmailAdmin()  — Admin SDK companion lives in emailRendererAdmin.ts
 */

import {
  EmailTemplate,
  EmailTemplateVariable,
  EmailDesignSettings,
  DEFAULT_DESIGN_SETTINGS,
  DEFAULT_EMAIL_TEMPLATES,
  generateEmailWrapper,
  getEmailTemplate,
  getEmailDesignSettings,
} from '@/firebase/emailTemplateService';

// ─── Variable substitution ──────────────────────────────────────────────────

const ESCAPE_HTML_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, ch => ESCAPE_HTML_MAP[ch]);
}

/**
 * Replace {{variableName}} placeholders in a string.
 * Variables marked isHtml: true are inserted raw; everything else is HTML-escaped.
 * Missing variables resolve to '' and log a console warning (dev-friendly).
 */
export function substituteVariables(
  template: string,
  variables: Record<string, any>,
  variableSchema: EmailTemplateVariable[] = []
): string {
  const isHtmlMap = new Map(variableSchema.map(v => [v.key, !!(v as any).isHtml]));
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = variables[key];
    if (value == null || value === '') {
      // eslint-disable-next-line no-console
      console.warn(`[emailRenderer] Missing variable "${key}" — rendered as empty string`);
      return '';
    }
    const str = String(value);
    return isHtmlMap.get(key) ? str : escapeHtml(str);
  });
}

/**
 * Auto-format a plain-text email body into HTML paragraphs.
 *
 * If the body already contains block-level HTML tags (an admin who knows
 * HTML), it is returned unchanged. Otherwise paragraphs separated by blank
 * lines become <p>...</p> and single line breaks become <br>.
 *
 * Paragraphs that consist of nothing but a single HTML variable placeholder
 * (e.g. `{{orderSummary}}` where orderSummary is `isHtml: true`) are kept
 * as block-level inserts and NOT wrapped in <p> — preventing invalid
 * `<p><table>...</table></p>` structures after substitution.
 */
export function formatBodyAsHtml(
  body: string,
  htmlVariableKeys: Set<string> = new Set()
): string {
  if (!body) return '';
  // If the body already contains block-level HTML tags, treat it as authored HTML
  if (/<\s*(p|div|table|h[1-6]|ul|ol|blockquote|hr|br)[\s>]/i.test(body)) {
    return body;
  }
  const paragraphs = body
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
  return paragraphs.map(p => {
    // Single HTML-variable placeholder on its own line — leave as-is so
    // substitution inserts a block element directly into the body
    const onlyVarMatch = p.match(/^\{\{(\w+)\}\}$/);
    if (onlyVarMatch && htmlVariableKeys.has(onlyVarMatch[1])) {
      return p;
    }
    return `<p>${p.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');
}

// ─── Local fallback lookup ──────────────────────────────────────────────────

function findDefaultTemplate(id: string): EmailTemplate | null {
  const found = DEFAULT_EMAIL_TEMPLATES.find(t => t.id === id);
  if (!found) return null;
  return { ...found, createdAt: null, updatedAt: null } as EmailTemplate;
}

// ─── Main render API ────────────────────────────────────────────────────────

export interface RenderEmailOptions {
  /** Order number for the tracking button + URL builder */
  orderNumber?: string;
  /** Override headerSubtitle if the template doesn't define one */
  headerSubtitle?: string;
  /** Force showing/hiding the contact section (defaults to true) */
  showContactSection?: boolean;
  /** Force showing/hiding the tracking button (defaults to template setting or auto when orderNumber present) */
  showTrackingButton?: boolean;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  /** True when the template was found and used; false when caller should fall back */
  rendered: boolean;
  /** The resolved template (useful for callers that want metadata) */
  template?: EmailTemplate;
}

/**
 * Render an email from the catalog.
 *
 * @returns RenderedEmail. Always succeeds — when the template can't be loaded the
 *          subject/html are empty and `rendered=false`, signalling the caller to
 *          fall back to its hardcoded path.
 */
export async function renderEmail(
  templateId: string,
  variables: Record<string, any>,
  locale: 'sv' | 'en',
  options: RenderEmailOptions = {}
): Promise<RenderedEmail> {
  let template: EmailTemplate | null = null;
  let settings: EmailDesignSettings = DEFAULT_DESIGN_SETTINGS;

  try {
    template = await getEmailTemplate(templateId);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[emailRenderer] Failed to load template "${templateId}" from Firestore — using local default`, err);
  }

  if (!template) template = findDefaultTemplate(templateId);

  if (!template) {
    // eslint-disable-next-line no-console
    console.warn(`[emailRenderer] No template found for id "${templateId}" — caller should fall back`);
    return { subject: '', html: '', rendered: false };
  }

  try {
    settings = await getEmailDesignSettings();
  } catch {
    // Use defaults
  }

  return renderTemplate(template, settings, variables, locale, options);
}

/**
 * Render a fully-loaded template (no Firestore I/O). Exposed so the admin
 * variant can share the same logic without re-implementing it.
 */
export function renderTemplate(
  template: EmailTemplate,
  settings: EmailDesignSettings,
  variables: Record<string, any>,
  locale: 'sv' | 'en',
  options: RenderEmailOptions = {}
): RenderedEmail {
  const subjectTpl = locale === 'en' ? template.subjectEn : template.subjectSv;
  const bodyTpl = locale === 'en' ? template.bodyEn : template.bodySv;

  const subject = substituteVariables(subjectTpl, variables, template.variables);
  // Auto-format plain text bodies into HTML paragraphs so admin can write
  // natural prose without manually adding <p> tags. Bodies that already
  // contain block-level HTML are passed through unchanged.
  // Format first so paragraph detection runs on the raw template; then
  // substitute, so HTML variables (e.g. {{orderSummary}}) get inserted
  // as block elements that aren't wrapped in <p>.
  const htmlVarKeys = new Set(
    (template.variables || []).filter(v => (v as any).isHtml).map(v => v.key)
  );
  const bodyFormatted = formatBodyAsHtml(bodyTpl, htmlVarKeys);
  const bodyContent = substituteVariables(bodyFormatted, variables, template.variables);

  const orderNumber = options.orderNumber || variables.orderNumber || undefined;
  const showTracking = options.showTrackingButton ?? !!orderNumber;

  const html = generateEmailWrapper({
    settings,
    lang: locale,
    title: subject,
    headerTitle: subject,
    headerSubtitle: options.headerSubtitle,
    bodyContent,
    showTrackingButton: showTracking,
    orderNumber: orderNumber ? String(orderNumber) : undefined,
    showContactSection: options.showContactSection,
  });

  return { subject, html, rendered: true, template };
}
