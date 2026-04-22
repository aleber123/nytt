/**
 * One-shot admin endpoint: force-refreshes the `send-password` email template
 * in Firestore from the code-level defaults in `emailTemplateService.ts`.
 *
 * Background: the existing `send-password` template body in Firestore is
 * missing the `{{password}}` placeholder, so customers received password
 * emails with no password. We updated the code default; this endpoint
 * pushes that update to Firestore even if the template is flagged
 * `isCustomized: true`.
 *
 * Run once from the browser: GET /api/admin/reseed-password-template
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebaseAdmin';

// Full HTML body so the yellow password box renders correctly. Each
// paragraph is wrapped in <p> because `formatBodyAsHtml` leaves the body
// unchanged when it detects block-level tags — so we can't rely on it to
// add paragraph breaks around the box. The box includes a big "DITT
// LÖSENORD" label + a note that it's the password, not a link — Gmail
// auto-links things like "doxvl.se" so we make the context unmistakable.
const NEW_BODY_SV =
  '<p>Hej {{customerName}},</p>' +
  '<p>Här är lösenordet för att öppna ditt dokument för order <strong>{{orderNumber}}</strong>:</p>' +
  '<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:20px 0;">' +
    '<tr><td style="background:#fef3c7;border:2px dashed #f59e0b;border-radius:10px;padding:20px;text-align:center;">' +
      '<div style="font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#92400e;font-weight:700;margin-bottom:10px;">🔐 Ditt lösenord</div>' +
      '<div style="font-size:26px;font-weight:bold;font-family:\'Courier New\',monospace;letter-spacing:2px;color:#1f2937;padding:8px 0;">{{password}}</div>' +
      '<div style="font-size:12px;color:#92400e;margin-top:8px;font-style:italic;">Används för att öppna PDF-filen — det är inte en länk.</div>' +
    '</td></tr>' +
  '</table>' +
  '<p>Själva filen skickades i ett annat mail med ämne <em>”Dokument för din order – Order {{orderNumber}}”</em>. Kolla inkorgen — och kontrollera skräpposten om du inte hittar det.</p>' +
  '<p style="color:#6b7280;font-size:13px;">För din säkerhet skickas lösenordet i ett separat mail från själva filen.</p>';

const NEW_BODY_EN =
  '<p>Hi {{customerName}},</p>' +
  '<p>Here is the password to open your document for order <strong>{{orderNumber}}</strong>:</p>' +
  '<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:20px 0;">' +
    '<tr><td style="background:#fef3c7;border:2px dashed #f59e0b;border-radius:10px;padding:20px;text-align:center;">' +
      '<div style="font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#92400e;font-weight:700;margin-bottom:10px;">🔐 Your password</div>' +
      '<div style="font-size:26px;font-weight:bold;font-family:\'Courier New\',monospace;letter-spacing:2px;color:#1f2937;padding:8px 0;">{{password}}</div>' +
      '<div style="font-size:12px;color:#92400e;margin-top:8px;font-style:italic;">Use this to open the PDF file — it is not a link.</div>' +
    '</td></tr>' +
  '</table>' +
  '<p>The file was sent in a separate email with subject <em>"Documents for your order – Order {{orderNumber}}"</em>. Check your inbox — and your spam folder if you can\'t find it.</p>' +
  '<p style="color:#6b7280;font-size:13px;">For your security, the password is sent in a separate email from the file itself.</p>';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = getAdminDb();
    const ref = db.collection('emailTemplates').doc('send-password');
    const snap = await ref.get();

    const before = snap.exists ? snap.data() : null;

    await ref.set(
      {
        subjectSv: 'Lösenord för ditt dokument – Order {{orderNumber}}',
        subjectEn: 'Password for your document – Order {{orderNumber}}',
        bodySv: NEW_BODY_SV,
        bodyEn: NEW_BODY_EN,
        // Ensure password is declared as a template variable
        variables: [
          { key: 'customerName', description: 'Kundens namn', example: 'Erik' },
          { key: 'orderNumber', description: 'Ordernummer', example: 'VISA000451' },
          { key: 'password', description: 'Lösenord', example: 'ABC123' },
        ],
        // Keep template active. Preserve other fields via merge.
        isActive: true,
        isCustomized: false,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const after = (await ref.get()).data();

    return res.status(200).json({
      success: true,
      message: 'send-password template force-updated with {{password}} placeholder',
      before: before
        ? {
            bodySv: before.bodySv,
            bodyEn: before.bodyEn,
            useCustomTemplate: before.useCustomTemplate,
            isCustomized: before.isCustomized,
          }
        : null,
      after: after
        ? {
            bodySv: after.bodySv,
            bodyEn: after.bodyEn,
            useCustomTemplate: after.useCustomTemplate,
            isCustomized: after.isCustomized,
          }
        : null,
    });
  } catch (error: any) {
    console.error('Error reseeding password template:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to reseed password template',
    });
  }
}
