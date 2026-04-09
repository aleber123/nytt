/**
 * Helper builders for visa document email content blocks.
 *
 * Produces HTML strings injected into editable email templates as
 * `{{documentList}}`, `{{originalDocsBlock}}`, etc. so the bodies in
 * /admin/email-templates can stay as plain prose while the rich
 * document tables are built automatically by the senders.
 */

interface DocumentChecklistItem {
  id?: string;
  name: string;
  nameEn?: string;
  type?: string;
  required?: boolean;
  originalRequired?: boolean;
  received?: boolean;
}

const TYPE_ICONS: Record<string, string> = {
  passport: '🛂',
  photo: '📸',
  form: '📝',
  financial: '💰',
  invitation: '✉️',
  insurance: '🛡️',
  itinerary: '✈️',
  accommodation: '🏨',
  employment: '💼',
  residence: '🏠',
  other: '📄',
};

function formatDocList(docs: DocumentChecklistItem[], locale: 'sv' | 'en'): string {
  return docs
    .map(d => {
      const icon = TYPE_ICONS[d.type || 'other'] || '📄';
      const label = locale === 'en' ? (d.nameEn || d.name) : d.name;
      return `<li style="padding:4px 0;">${icon} ${label}</li>`;
    })
    .join('');
}

interface DocumentInstructionsParams {
  checklist: DocumentChecklistItem[];
  locale: 'sv' | 'en';
}

/**
 * Builds the full grouped document checklist used by the
 * "Documents needed" email — separates originals (must post) from
 * digital docs and lists optional ones at the end.
 */
export function buildDocumentInstructionsBlock(params: DocumentInstructionsParams): string {
  const isEn = params.locale === 'en';
  const originalDocs = params.checklist.filter(d => d.required && d.originalRequired);
  const digitalDocs = params.checklist.filter(d => d.required && !d.originalRequired);
  const optionalDocs = params.checklist.filter(d => !d.required);

  let html = '';

  if (originalDocs.length > 0) {
    html += `
<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px;margin:16px 0;">
  <p style="margin:0 0 4px;font-weight:bold;color:#991b1b;">📮 ${isEn ? 'Must be sent by post (originals required):' : 'Måste skickas per post (original krävs):'}</p>
  <p style="margin:0 0 8px;font-size:12px;color:#991b1b;">${isEn ? 'These documents must be physical originals. Digital copies are not accepted.' : 'Dessa dokument måste vara fysiska original. Digitala kopior godtas inte.'}</p>
  <ul style="margin:0;padding-left:20px;color:#991b1b;">${formatDocList(originalDocs, params.locale)}</ul>
</div>`.trim();
  }

  if (digitalDocs.length > 0) {
    html += `
<div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:16px;margin:16px 0;">
  <p style="margin:0 0 4px;font-weight:bold;color:#065f46;">📧 ${isEn ? 'Can be sent digitally:' : 'Kan skickas digitalt:'}</p>
  <p style="margin:0 0 8px;font-size:12px;color:#065f46;">${isEn ? 'These can be sent as scanned copies or photos via email.' : 'Dessa kan skickas som inskannade kopior eller foton via e-post.'}</p>
  <ul style="margin:0;padding-left:20px;color:#065f46;">${formatDocList(digitalDocs, params.locale)}</ul>
</div>`.trim();
  }

  if (optionalDocs.length > 0) {
    html += `
<div style="background:#f3f4f6;border:1px solid #d1d5db;border-radius:8px;padding:16px;margin:16px 0;">
  <p style="margin:0 0 8px;font-weight:bold;color:#374151;">${isEn ? 'If applicable:' : 'Om tillämpligt:'}</p>
  <ul style="margin:0;padding-left:20px;color:#374151;">${formatDocList(optionalDocs, params.locale)}</ul>
</div>`.trim();
  }

  // Postal address block (only when originals are required)
  if (originalDocs.length > 0) {
    html += `
<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:8px 0 16px;">
  <p style="margin:0 0 6px;font-weight:bold;color:#1e40af;">${isEn ? 'Send original documents by post to:' : 'Skicka originaldokument per post till:'}</p>
  <p style="margin:0;font-size:13px;color:#1e40af;line-height:1.5;">
    <strong>DOX Visumpartner AB</strong><br>
    Livdjursgatan 4, ${isEn ? 'floor 6' : 'våning 6'}<br>
    121 62 Johanneshov<br>
    ${isEn ? 'Sweden' : 'Sverige'}
  </p>
</div>`.trim();
  }

  return html;
}

/**
 * Builds a simpler "missing documents" warning block — used when the
 * handler reminds the customer about specific documents that are still
 * outstanding from the checklist.
 */
export function buildMissingDocumentsBlock(params: {
  checklist: DocumentChecklistItem[];
  locale: 'sv' | 'en';
}): string {
  const isEn = params.locale === 'en';
  const missing = params.checklist.filter(d => !d.received && d.required);
  if (missing.length === 0) return '';
  const list = missing
    .map(d => `<li style="padding:3px 0;">${isEn ? (d.nameEn || d.name) : d.name}</li>`)
    .join('');

  return `
<div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:16px;margin:16px 0;">
  <p style="margin:0 0 8px;font-weight:bold;color:#92400e;">${isEn ? '⚠️ Missing documents:' : '⚠️ Dokument som saknas:'}</p>
  <ul style="margin:0;padding-left:20px;color:#92400e;">${list}</ul>
</div>`.trim();
}
