/**
 * Fillable PDF Form Generator
 *
 * Creates a fillable (AcroForm) PDF from a VisaFormTemplate definition.
 * The customer fills in the PDF in Adobe Reader / Preview / Chrome, sends
 * it back, and the admin uploads it. The companion extractPdfFormData()
 * function reads the filled values back.
 *
 * Uses pdf-lib which has excellent AcroForm support.
 */

import { PDFDocument, PDFFont, PDFPage, PDFTextField, PDFDropdown, rgb, StandardFonts } from 'pdf-lib';
import type { VisaFormTemplate, FormField } from '@/firebase/visaFormService';

// ─── Design tokens ──────────────────────────────────────────────────────────
const PAGE_W = 595.28;  // A4 pt
const PAGE_H = 841.89;
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FIELD_HEIGHT = 22;
const LABEL_SIZE = 9;
const FIELD_GAP = 6;
const GROUP_GAP = 18;
const ROW_HEIGHT = FIELD_HEIGHT + LABEL_SIZE + FIELD_GAP + 4;

const COLORS = {
  headerBg: rgb(46 / 255, 45 / 255, 44 / 255),       // #2E2D2C
  accent: rgb(14 / 255, 176 / 255, 166 / 255),         // #0EB0A6
  labelText: rgb(0.3, 0.3, 0.3),
  fieldBorder: rgb(0.75, 0.75, 0.75),
  fieldBg: rgb(0.98, 0.98, 0.98),
  groupTitle: rgb(14 / 255, 176 / 255, 166 / 255),
  footerText: rgb(0.6, 0.6, 0.6),
  white: rgb(1, 1, 1),
  black: rgb(0, 0, 0),
};

interface Cursor {
  page: PDFPage;
  y: number;
}

function needsNewPage(cursor: Cursor, neededHeight: number): boolean {
  return cursor.y - neededHeight < 60; // Leave room for footer
}

function addPage(doc: PDFDocument): PDFPage {
  return doc.addPage([PAGE_W, PAGE_H]);
}

function drawFooter(page: PDFPage, font: PDFFont, pageNum: number, totalPages: string) {
  page.drawText(`Page ${pageNum} ${totalPages}`, {
    x: PAGE_W - MARGIN - 40,
    y: 30,
    size: 7,
    font,
    color: COLORS.footerText,
  });
}

// ─── Main generator ─────────────────────────────────────────────────────────

export async function generateFillablePdf(
  template: VisaFormTemplate,
  options?: {
    customerName?: string;
    orderNumber?: string;
  }
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const form = doc.getForm();

  // ─── Page 1: Header ───
  let page = addPage(doc);
  let y = PAGE_H - MARGIN;

  // Clean title — no branding
  page.drawText(template.nameEn || template.name, {
    x: MARGIN,
    y: PAGE_H - MARGIN,
    size: 18,
    font: fontBold,
    color: COLORS.black,
  });
  page.drawText('Application Form', {
    x: MARGIN,
    y: PAGE_H - MARGIN - 16,
    size: 11,
    font,
    color: COLORS.labelText,
  });

  // Thin separator line
  page.drawRectangle({
    x: MARGIN,
    y: PAGE_H - MARGIN - 22,
    width: CONTENT_W,
    height: 0.5,
    color: COLORS.fieldBorder,
  });

  y = PAGE_H - MARGIN - 38;

  // Instructions
  page.drawText('Please fill in all required fields (*) and return this form.', {
    x: MARGIN,
    y,
    size: 9,
    font,
    color: COLORS.labelText,
  });
  y -= 8;
  page.drawText('You can fill this PDF digitally in Adobe Reader, Preview, or any PDF viewer.', {
    x: MARGIN,
    y,
    size: 8,
    font,
    color: COLORS.footerText,
  });
  y -= 16;

  // ─── Group and render fields ───
  const groups = [...(template.groups || [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const fieldsByGroup = new Map<string, FormField[]>();
  for (const field of (template.fields || []).sort((a, b) => a.sortOrder - b.sortOrder)) {
    const list = fieldsByGroup.get(field.group) || [];
    list.push(field);
    fieldsByGroup.set(field.group, list);
  }

  const cursor: Cursor = { page, y };

  for (const group of groups) {
    const fields = fieldsByGroup.get(group.id);
    if (!fields || fields.length === 0) continue;

    // Group title — ensure the heading + at least 2 field rows fit on this page
    const minGroupHeight = GROUP_GAP + 20 + ROW_HEIGHT * 2;
    if (needsNewPage(cursor, minGroupHeight)) {
      cursor.page = addPage(doc);
      cursor.y = PAGE_H - MARGIN;
    }

    cursor.y -= GROUP_GAP;
    // Group title — no emojis (they don't render in PDF standard fonts)
    cursor.page.drawText(group.labelEn || group.label, {
      x: MARGIN,
      y: cursor.y,
      size: 12,
      font: fontBold,
      color: COLORS.groupTitle,
    });
    cursor.y -= 4;
    // Accent line under group title
    cursor.page.drawRectangle({
      x: MARGIN,
      y: cursor.y,
      width: CONTENT_W,
      height: 1.5,
      color: COLORS.accent,
    });
    cursor.y -= 12;

    // Render fields — try to put 2 per row when both are short text/select.
    // Keep yes/no + detail pairs together on the same page.
    let i = 0;
    while (i < fields.length) {
      const field = fields[i];
      const nextField = fields[i + 1];
      const isWide = field.type === 'textarea';
      const nextIsWide = nextField?.type === 'textarea';

      // Check if this is a yes/no question followed by a detail textarea
      // (e.g., "Have you been refused entry?" + "If yes — details").
      // If so, reserve space for BOTH so they don't split across pages.
      const isYesNoWithDetail =
        field.type === 'select' &&
        field.options?.length === 2 &&
        nextField?.type === 'textarea';
      const pairHeight = isYesNoWithDetail
        ? ROW_HEIGHT * 2 + FIELD_HEIGHT * 2 + 4  // select row + textarea row
        : ROW_HEIGHT + 10;

      if (needsNewPage(cursor, pairHeight)) {
        cursor.page = addPage(doc);
        cursor.y = PAGE_H - MARGIN;
      }

      if (isYesNoWithDetail) {
        // Render yes/no select (full width) + detail textarea together
        drawFormField(doc, form, cursor, field, font, fontBold, MARGIN, CONTENT_W);
        cursor.y -= ROW_HEIGHT;
        const detailHeight = FIELD_HEIGHT * 2.5;
        drawFormField(doc, form, cursor, nextField!, font, fontBold, MARGIN, CONTENT_W, detailHeight);
        cursor.y -= ROW_HEIGHT + FIELD_HEIGHT * 1.5;
        i += 2;
      } else if (!isWide && nextField && !nextIsWide) {
        // Two fields side by side
        drawFormField(doc, form, cursor, field, font, fontBold, MARGIN, CONTENT_W / 2 - 5);
        drawFormField(doc, form, cursor, nextField, font, fontBold, MARGIN + CONTENT_W / 2 + 5, CONTENT_W / 2 - 5);
        cursor.y -= ROW_HEIGHT;
        i += 2;
      } else {
        // Single field (full width)
        const height = isWide ? FIELD_HEIGHT * 3 : FIELD_HEIGHT;
        drawFormField(doc, form, cursor, field, font, fontBold, MARGIN, CONTENT_W, height);
        cursor.y -= (isWide ? ROW_HEIGHT + FIELD_HEIGHT * 2 : ROW_HEIGHT);
        i += 1;
      }
    }
  }

  // ─── Add footers to all pages ───
  const pages = doc.getPages();
  pages.forEach((p, idx) => {
    drawFooter(p, font, idx + 1, `/ ${pages.length}`);
  });

  return doc.save();
}

// ─── Draw a single form field (label + interactive input) ───────────────────

function drawFormField(
  doc: PDFDocument,
  form: ReturnType<PDFDocument['getForm']>,
  cursor: Cursor,
  field: FormField,
  font: PDFFont,
  fontBold: PDFFont,
  x: number,
  width: number,
  height: number = FIELD_HEIGHT
) {
  const { page, y } = cursor;
  const labelText = `${field.labelEn || field.label}${field.required ? ' *' : ''}`;

  // Label — positioned directly above the field box
  page.drawText(labelText, {
    x,
    y: y + 2,
    size: LABEL_SIZE,
    font: field.required ? fontBold : font,
    color: COLORS.labelText,
  });

  // Field box starts right below the label
  const fieldY = y - LABEL_SIZE;

  // Field background + border
  page.drawRectangle({
    x,
    y: fieldY - height,
    width,
    height,
    color: COLORS.fieldBg,
    borderColor: COLORS.fieldBorder,
    borderWidth: 0.5,
  });

  // Use a unique field name (prefix with template id to avoid collisions)
  const fieldName = field.id;

  if (field.type === 'select' && field.options && field.options.length > 0) {
    // Dropdown
    try {
      const dropdown = form.createDropdown(fieldName);
      const optionValues = field.options.map(o => o.labelEn || o.label);
      dropdown.addOptions(optionValues);
      dropdown.addToPage(page, {
        x: x + 2,
        y: fieldY - height + 2,
        width: width - 4,
        height: height - 4,
        borderWidth: 0,
        backgroundColor: rgb(0.98, 0.98, 0.98),
      });
    } catch {
      // Fallback: text field if dropdown fails (e.g., duplicate name)
      createTextField(form, fieldName + '_text', page, x, fieldY, width, height, field.placeholderEn || field.placeholder || '');
    }
  } else if (field.type === 'textarea') {
    const textField = form.createTextField(fieldName);
    textField.enableMultiline();
    textField.addToPage(page, {
      x: x + 2,
      y: fieldY - height + 2,
      width: width - 4,
      height: height - 4,
      borderWidth: 0,
      backgroundColor: rgb(0.98, 0.98, 0.98),
    });
  } else {
    // Text / date / email / phone — all rendered as text field
    const placeholder = field.type === 'date'
      ? 'YYYY-MM-DD'
      : (field.placeholderEn || field.placeholder || '');
    createTextField(form, fieldName, page, x, fieldY, width, height, placeholder);
  }
}

function createTextField(
  form: ReturnType<PDFDocument['getForm']>,
  name: string,
  page: PDFPage,
  x: number,
  fieldY: number,
  width: number,
  height: number,
  _placeholder: string
) {
  try {
    const textField = form.createTextField(name);
    textField.addToPage(page, {
      x: x + 2,
      y: fieldY - height + 2,
      width: width - 4,
      height: height - 4,
      borderWidth: 0,
      backgroundColor: rgb(0.98, 0.98, 0.98),
    });
  } catch {
    // Field name collision — append suffix
    const textField = form.createTextField(name + '_dup');
    textField.addToPage(page, {
      x: x + 2,
      y: fieldY - height + 2,
      width: width - 4,
      height: height - 4,
      borderWidth: 0,
      backgroundColor: rgb(0.98, 0.98, 0.98),
    });
  }
}

// ─── Extract data from a filled PDF ─────────────────────────────────────────

/**
 * Reads all form field values from a filled PDF.
 * Returns a map of field name → value, matching the template field IDs.
 */
export async function extractPdfFormData(
  pdfBytes: Uint8Array
): Promise<Record<string, string>> {
  const doc = await PDFDocument.load(pdfBytes);
  const form = doc.getForm();
  const fields = form.getFields();
  const result: Record<string, string> = {};

  for (const field of fields) {
    const name = field.getName();
    try {
      if (field instanceof PDFTextField) {
        result[name] = field.getText() || '';
      } else if (field instanceof PDFDropdown) {
        const selected = field.getSelected();
        result[name] = selected.length > 0 ? selected[0] : '';
      }
    } catch {
      // Skip unreadable fields
    }
  }

  return result;
}
