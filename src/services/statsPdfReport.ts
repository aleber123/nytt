/**
 * Stats PDF Report Generator
 *
 * Produces a printable, manager-friendly PDF report from the analytics result
 * shown on /admin/stats. Used for monthly/yearly board reporting.
 *
 * Self-contained: draws everything (KPIs, breakdown bars, tables) using jsPDF
 * primitives so we don't need extra plugins like jspdf-autotable.
 */

import jsPDF from 'jspdf';
import type { AnalyticsResult, Breakdown, CountryStat, MonthlyPoint } from './orderAnalytics';
import { formatCurrency, formatPercent, getStatusMeta } from './orderAnalytics';

// ─── Design tokens ──────────────────────────────────────────────────────────
const PAGE_W = 210; // A4 mm
const PAGE_H = 297;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;

const COLORS = {
  primary: [14, 176, 166] as [number, number, number],   // #0EB0A6 DOX teal
  ink: [33, 37, 41] as [number, number, number],
  muted: [107, 114, 128] as [number, number, number],
  border: [229, 231, 235] as [number, number, number],
  bg: [248, 250, 252] as [number, number, number],
  green: [22, 163, 74] as [number, number, number],
  amber: [217, 119, 6] as [number, number, number],
  red: [220, 38, 38] as [number, number, number],
  blue: [37, 99, 235] as [number, number, number],
};

interface Cursor { y: number; }

// ─── Low-level draw helpers ─────────────────────────────────────────────────

function setFill(doc: jsPDF, c: [number, number, number]) { doc.setFillColor(c[0], c[1], c[2]); }
function setDraw(doc: jsPDF, c: [number, number, number]) { doc.setDrawColor(c[0], c[1], c[2]); }
function setText(doc: jsPDF, c: [number, number, number]) { doc.setTextColor(c[0], c[1], c[2]); }

function ensureSpace(doc: jsPDF, cursor: Cursor, neededMm: number, drawHeader?: () => void) {
  if (cursor.y + neededMm > PAGE_H - 18) {
    addFooter(doc);
    doc.addPage();
    cursor.y = MARGIN;
    if (drawHeader) drawHeader();
  }
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.internal.pages.length - 1;
  const currentPage = (doc as any).getCurrentPageInfo?.()?.pageNumber || pageCount;
  setText(doc, COLORS.muted);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('DOX Visumpartner AB · Confidential', MARGIN, PAGE_H - 8);
  doc.text(`Page ${currentPage}`, PAGE_W - MARGIN, PAGE_H - 8, { align: 'right' });
}

function drawSectionTitle(doc: jsPDF, cursor: Cursor, title: string) {
  ensureSpace(doc, cursor, 10);
  setText(doc, COLORS.ink);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(title, MARGIN, cursor.y);
  // Underline
  setDraw(doc, COLORS.primary);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, cursor.y + 1.2, MARGIN + 30, cursor.y + 1.2);
  cursor.y += 7;
}

function drawKpiCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  hint?: string,
  color: [number, number, number] = COLORS.primary
) {
  // Card border
  setDraw(doc, COLORS.border);
  setFill(doc, [255, 255, 255]);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');
  // Color accent bar (left edge)
  setFill(doc, color);
  doc.rect(x, y, 1.5, h, 'F');
  // Label
  setText(doc, COLORS.muted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(label.toUpperCase(), x + 4, y + 5);
  // Value
  setText(doc, COLORS.ink);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(value, x + 4, y + 12);
  // Hint
  if (hint) {
    setText(doc, COLORS.muted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(hint, x + 4, y + 17);
  }
}

interface TableColumn {
  header: string;
  width: number; // mm
  align?: 'left' | 'right' | 'center';
  /** Optional formatter — receives raw cell value and row index */
  format?: (value: any, row: any) => string;
}

function drawTable(
  doc: jsPDF,
  cursor: Cursor,
  columns: TableColumn[],
  rows: any[][],
  options: { headerColor?: [number, number, number]; rowHeight?: number; emptyMessage?: string } = {}
) {
  const rowHeight = options.rowHeight || 7;
  const headerHeight = 7;
  const headerColor = options.headerColor || COLORS.bg;

  if (rows.length === 0) {
    setText(doc, COLORS.muted);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text(options.emptyMessage || 'No data in this period', MARGIN, cursor.y);
    cursor.y += 6;
    return;
  }

  // Pre-flight: paginate if needed
  ensureSpace(doc, cursor, headerHeight + rowHeight * Math.min(rows.length, 4));

  // Header
  setFill(doc, headerColor);
  doc.rect(MARGIN, cursor.y, CONTENT_W, headerHeight, 'F');
  setText(doc, COLORS.ink);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  let cx = MARGIN + 2;
  columns.forEach(col => {
    const xPos = col.align === 'right' ? cx + col.width - 2 : col.align === 'center' ? cx + col.width / 2 : cx;
    doc.text(col.header.toUpperCase(), xPos, cursor.y + 4.7, { align: col.align || 'left' });
    cx += col.width;
  });
  cursor.y += headerHeight;

  // Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setText(doc, COLORS.ink);
  rows.forEach((row, ri) => {
    ensureSpace(doc, cursor, rowHeight);
    // Zebra stripe
    if (ri % 2 === 1) {
      setFill(doc, [251, 251, 252]);
      doc.rect(MARGIN, cursor.y, CONTENT_W, rowHeight, 'F');
    }
    // Bottom border
    setDraw(doc, COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, cursor.y + rowHeight, MARGIN + CONTENT_W, cursor.y + rowHeight);

    let x = MARGIN + 2;
    columns.forEach((col, ci) => {
      const raw = row[ci];
      const text = col.format ? col.format(raw, row) : (raw == null ? '' : String(raw));
      const tx = col.align === 'right' ? x + col.width - 2 : col.align === 'center' ? x + col.width / 2 : x;
      doc.text(text, tx, cursor.y + 4.8, { align: col.align || 'left', maxWidth: col.width - 4 });
      x += col.width;
    });
    cursor.y += rowHeight;
  });
  cursor.y += 3;
}

function drawBreakdownBars(
  doc: jsPDF,
  cursor: Cursor,
  items: Breakdown,
  options: { barColor?: [number, number, number]; useStatusColors?: boolean; emptyMessage?: string } = {}
) {
  if (items.length === 0) {
    setText(doc, COLORS.muted);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text(options.emptyMessage || 'No data in this period', MARGIN, cursor.y);
    cursor.y += 6;
    return;
  }
  const max = items.reduce((m, i) => Math.max(m, i.count), 0);
  const total = items.reduce((s, i) => s + i.count, 0);
  const labelW = 60;
  const barW = CONTENT_W - labelW - 30;
  const rowH = 5.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  items.forEach(item => {
    ensureSpace(doc, cursor, rowH);
    const pct = max > 0 ? (item.count / max) : 0;
    const sharePct = total > 0 ? (item.count / total) * 100 : 0;
    setText(doc, COLORS.ink);
    doc.text(item.label, MARGIN, cursor.y + 3.5, { maxWidth: labelW - 2 });

    // Bar background
    setFill(doc, [243, 244, 246]);
    doc.roundedRect(MARGIN + labelW, cursor.y + 1, barW, rowH - 2, 0.8, 0.8, 'F');
    // Bar fill
    const color = options.useStatusColors
      ? hexToRgb(getStatusMeta(item.key).color)
      : (options.barColor || COLORS.primary);
    setFill(doc, color);
    doc.roundedRect(MARGIN + labelW, cursor.y + 1, Math.max(0.5, barW * pct), rowH - 2, 0.8, 0.8, 'F');
    // Count + share
    setText(doc, COLORS.muted);
    doc.text(`${item.count}  (${sharePct.toFixed(0)}%)`, MARGIN + CONTENT_W, cursor.y + 3.5, { align: 'right' });
    cursor.y += rowH;
  });
  cursor.y += 2;
}

function drawMonthlyBars(
  doc: jsPDF,
  cursor: Cursor,
  data: MonthlyPoint[],
  metric: 'orders' | 'netRevenue',
  color: [number, number, number]
) {
  if (data.length === 0) return;
  const chartH = 50;
  const chartW = CONTENT_W;
  const max = Math.max(1, ...data.map(d => metric === 'orders' ? d.orders : d.netRevenue));
  const barW = (chartW / data.length) * 0.7;
  const xStep = chartW / data.length;

  ensureSpace(doc, cursor, chartH + 12);

  // Baseline
  setDraw(doc, COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, cursor.y + chartH, MARGIN + chartW, cursor.y + chartH);

  doc.setFont('helvetica', 'normal');

  data.forEach((d, i) => {
    const v = metric === 'orders' ? d.orders : d.netRevenue;
    const x = MARGIN + xStep * i + (xStep - barW) / 2;
    const h = v > 0 ? Math.max(0.5, (v / max) * (chartH - 8)) : 0;
    const y = cursor.y + chartH - h;

    if (h > 0) {
      setFill(doc, color);
      doc.roundedRect(x, y, barW, h, 0.6, 0.6, 'F');
    }
    // Value above bar
    if (v > 0) {
      setText(doc, COLORS.ink);
      doc.setFontSize(7);
      const valueText = metric === 'orders' ? String(v) : formatCurrency(v);
      doc.text(valueText, x + barW / 2, y - 1.5, { align: 'center' });
    }
    // Month label below baseline
    setText(doc, COLORS.muted);
    doc.setFontSize(7.5);
    doc.text(d.label, MARGIN + xStep * i + xStep / 2, cursor.y + chartH + 4, { align: 'center' });
  });
  cursor.y += chartH + 9;
}

function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '');
  return [
    parseInt(cleaned.slice(0, 2), 16),
    parseInt(cleaned.slice(2, 4), 16),
    parseInt(cleaned.slice(4, 6), 16),
  ];
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('sv-SE').format(n);
}

// ─── Main entry point ───────────────────────────────────────────────────────

export interface PdfReportInput {
  stats: AnalyticsResult;
  periodLabel: string;     // e.g. "Last 30 days", "April 2026", "2026"
  invoiceCount?: { total: number; paid: number };
  generatedAt?: Date;
}

export function generateStatsReportPdf(input: PdfReportInput): jsPDF {
  const { stats, periodLabel, invoiceCount, generatedAt } = input;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const cursor: Cursor = { y: MARGIN };
  const generated = generatedAt || new Date();

  // ─── Header ───
  setFill(doc, COLORS.primary);
  doc.rect(0, 0, PAGE_W, 18, 'F');
  setText(doc, [255, 255, 255]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('DOX Visumpartner AB', MARGIN, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Statistics report', PAGE_W - MARGIN, 11, { align: 'right' });

  cursor.y = 26;
  setText(doc, COLORS.ink);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(`Report — ${periodLabel}`, MARGIN, cursor.y);
  cursor.y += 6;
  setText(doc, COLORS.muted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `Generated ${generated.toLocaleDateString('sv-SE')} at ${generated.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}`,
    MARGIN,
    cursor.y
  );
  if (stats.cancelledExcluded > 0) {
    doc.text(
      `· ${stats.cancelledExcluded} cancelled order${stats.cancelledExcluded === 1 ? '' : 's'} excluded from this report`,
      MARGIN + 60,
      cursor.y
    );
  }
  cursor.y += 8;

  // ─── KPI cards (4 across) ───
  const cardW = (CONTENT_W - 6) / 4;
  const cardH = 22;
  drawKpiCard(doc, MARGIN, cursor.y, cardW, cardH, 'Total orders', formatNumber(stats.totalOrders), formatGrowthHint(stats.growth.orders), COLORS.blue);
  drawKpiCard(doc, MARGIN + (cardW + 2), cursor.y, cardW, cardH, 'Net revenue (DOX)', formatCurrency(stats.totalNetRevenue), formatGrowthHint(stats.growth.netRevenue), COLORS.green);
  drawKpiCard(doc, MARGIN + (cardW + 2) * 2, cursor.y, cardW, cardH, 'Avg. order value', formatCurrency(stats.averageOrderValue), undefined, COLORS.primary);
  drawKpiCard(doc, MARGIN + (cardW + 2) * 3, cursor.y, cardW, cardH, 'Conversion rate', formatPercent(stats.conversionRate), `${stats.completedOrders} done / ${stats.lostOrders} lost`, COLORS.amber);
  cursor.y += cardH + 6;

  // ─── Revenue breakdown ───
  drawSectionTitle(doc, cursor, 'Revenue breakdown');
  ensureSpace(doc, cursor, 30);
  const breakdownCardW = (CONTENT_W - 4) / 3;
  const grossPct = stats.totalRevenue > 0 ? (stats.totalRevenue / stats.totalRevenue) * 100 : 0;
  const passPct = stats.totalRevenue > 0 ? (stats.totalPassThroughFees / stats.totalRevenue) * 100 : 0;
  const netPct = stats.totalRevenue > 0 ? (stats.totalNetRevenue / stats.totalRevenue) * 100 : 0;
  drawKpiCard(doc, MARGIN, cursor.y, breakdownCardW, cardH, 'Gross invoiced', formatCurrency(stats.totalRevenue), `What customers paid (${grossPct.toFixed(0)}%)`, COLORS.muted);
  drawKpiCard(doc, MARGIN + breakdownCardW + 2, cursor.y, breakdownCardW, cardH, 'Pass-through fees', `−${formatCurrency(stats.totalPassThroughFees)}`, `Embassy / UD / chamber (${passPct.toFixed(0)}%)`, COLORS.amber);
  drawKpiCard(doc, MARGIN + (breakdownCardW + 2) * 2, cursor.y, breakdownCardW, cardH, 'DOX net revenue', formatCurrency(stats.totalNetRevenue), `Our actual income (${netPct.toFixed(0)}%)`, COLORS.green);
  cursor.y += cardH + 4;

  // Stacked margin bar
  ensureSpace(doc, cursor, 8);
  const barH = 4;
  setFill(doc, COLORS.green);
  const netBarW = CONTENT_W * (netPct / 100);
  const passBarW = CONTENT_W * (passPct / 100);
  doc.roundedRect(MARGIN, cursor.y, Math.max(0.5, netBarW), barH, 1, 1, 'F');
  setFill(doc, COLORS.amber);
  if (passBarW > 0.5) doc.rect(MARGIN + netBarW, cursor.y, passBarW, barH, 'F');
  cursor.y += barH + 8;

  // ─── Order type split ───
  drawSectionTitle(doc, cursor, 'Order type split');
  drawTable(
    doc,
    cursor,
    [
      { header: 'Type', width: 70 },
      { header: 'Orders', width: 30, align: 'right' },
      { header: 'Net (DOX)', width: 40, align: 'right' },
      { header: 'Gross', width: 42, align: 'right' },
    ],
    [
      ['🛂 Visa', stats.byOrderType.visa.count, formatCurrency(stats.byOrderType.visa.netRevenue), formatCurrency(stats.byOrderType.visa.revenue)],
      ['📋 Legalization', stats.byOrderType.legalization.count, formatCurrency(stats.byOrderType.legalization.netRevenue), formatCurrency(stats.byOrderType.legalization.revenue)],
    ]
  );

  // ─── Monthly charts ───
  if (stats.monthlySeries.length > 0) {
    drawSectionTitle(doc, cursor, 'Orders per month');
    drawMonthlyBars(doc, cursor, stats.monthlySeries, 'orders', COLORS.primary);
    drawSectionTitle(doc, cursor, 'Net revenue per month');
    drawMonthlyBars(doc, cursor, stats.monthlySeries, 'netRevenue', COLORS.green);
  }

  // ─── Status breakdown ───
  drawSectionTitle(doc, cursor, 'Order status');
  drawBreakdownBars(doc, cursor, stats.byStatus, { useStatusColors: true });

  // ─── Top countries ───
  drawSectionTitle(doc, cursor, 'Top visa destinations');
  drawTable(
    doc,
    cursor,
    [
      { header: '#', width: 10, align: 'right' },
      { header: 'Country', width: 80 },
      { header: 'Orders', width: 30, align: 'right' },
      { header: 'Revenue', width: 62, align: 'right' },
    ],
    stats.topVisaDestinations.map((c: CountryStat, i) => [
      i + 1,
      `${c.code.toUpperCase()}  ${c.name}`,
      c.count,
      formatCurrency(c.revenue),
    ])
  );

  drawSectionTitle(doc, cursor, 'Top legalization countries');
  drawTable(
    doc,
    cursor,
    [
      { header: '#', width: 10, align: 'right' },
      { header: 'Country', width: 80 },
      { header: 'Orders', width: 30, align: 'right' },
      { header: 'Revenue', width: 62, align: 'right' },
    ],
    stats.topLegalizationCountries.map((c: CountryStat, i) => [
      i + 1,
      `${c.code.toUpperCase()}  ${c.name}`,
      c.count,
      formatCurrency(c.revenue),
    ])
  );

  // ─── Service mix ───
  if (stats.legalizationServiceMix.length > 0) {
    drawSectionTitle(doc, cursor, 'Legalization service mix');
    drawBreakdownBars(doc, cursor, stats.legalizationServiceMix);
  }
  if (stats.visaCategoryMix.length > 0) {
    drawSectionTitle(doc, cursor, 'Visa categories');
    drawBreakdownBars(doc, cursor, stats.visaCategoryMix);
  }
  if (stats.visaTypeMix.length > 0) {
    drawSectionTitle(doc, cursor, 'Visa types');
    drawBreakdownBars(doc, cursor, stats.visaTypeMix);
  }

  // ─── Handler workload ───
  drawSectionTitle(doc, cursor, 'Handler workload');
  drawTable(
    doc,
    cursor,
    [
      { header: 'Handler', width: 60 },
      { header: 'Active', width: 22, align: 'right' },
      { header: 'Completed', width: 28, align: 'right' },
      { header: 'Net (DOX)', width: 36, align: 'right' },
      { header: 'Gross', width: 36, align: 'right' },
    ],
    stats.handlerWorkload.map(h => [
      h.name,
      h.active,
      h.completed,
      formatCurrency(h.netRevenue),
      formatCurrency(h.totalRevenue),
    ]),
    { emptyMessage: 'No assigned orders in this period' }
  );

  // ─── Top customers ───
  drawSectionTitle(doc, cursor, 'Top customers');
  drawTable(
    doc,
    cursor,
    [
      { header: 'Customer', width: 60 },
      { header: 'Contact(s) / email', width: 72 },
      { header: 'Orders', width: 18, align: 'right' },
      { header: 'Net (DOX)', width: 32, align: 'right' },
    ],
    stats.topCustomers.map(c => {
      const customerLabel = c.companyName && c.contactCount > 1
        ? `${c.name} (${c.contactCount} contacts)`
        : c.name;
      const emailLabel = c.emails.length === 0
        ? '—'
        : c.emails.length === 1
          ? c.emails[0]
          : `${c.emails[0]} (+${c.emails.length - 1} more)`;
      return [
        customerLabel,
        emailLabel,
        c.orderCount,
        formatCurrency(c.netRevenue),
      ];
    }),
    { emptyMessage: 'No customer data in this period' }
  );

  // ─── Operational stats footer ───
  ensureSpace(doc, cursor, 25);
  drawSectionTitle(doc, cursor, 'Operations');
  setText(doc, COLORS.ink);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const lines: string[] = [
    `In progress: ${stats.inProgressOrders}`,
    `Completed: ${stats.completedOrders}`,
    `Lost (rejected): ${stats.lostOrders}`,
    `Average handling time: ${stats.averageHandlingDays !== null ? stats.averageHandlingDays.toFixed(1) + ' days' : 'n/a'}`,
    `Unassigned orders: ${stats.unassignedOrders}`,
  ];
  if (invoiceCount) {
    lines.push(`Invoices: ${invoiceCount.total} total · ${invoiceCount.paid} paid · ${invoiceCount.total - invoiceCount.paid} outstanding`);
  }
  lines.forEach(line => {
    ensureSpace(doc, cursor, 5);
    doc.text(line, MARGIN, cursor.y);
    cursor.y += 5;
  });

  // Final footer on the last page
  addFooter(doc);

  return doc;
}

function formatGrowthHint(pct: number | null): string | undefined {
  if (pct === null) return undefined;
  const arrow = pct >= 0 ? '↑' : '↓';
  return `${arrow} ${Math.abs(pct).toFixed(1)}% vs prev period`;
}

/**
 * Convenience: build the report and trigger a browser download.
 */
export function downloadStatsReportPdf(input: PdfReportInput): void {
  const doc = generateStatsReportPdf(input);
  const safeLabel = input.periodLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const dateStr = (input.generatedAt || new Date()).toISOString().slice(0, 10);
  doc.save(`dox-stats-${safeLabel || 'report'}-${dateStr}.pdf`);
}
