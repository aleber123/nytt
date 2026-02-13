/**
 * FormDataPrintButton — Opens a clean printable view of customer form data
 * 
 * Case handlers use this to double-check data when filling visa portals.
 * Uses window.print() for native PDF export / printing.
 */

import { useState } from 'react';
import { getFormSubmissionsForOrder } from '@/firebase/visaFormService';

interface FormDataPrintButtonProps {
  order: any;
  templateFields?: any[];
}

export default function FormDataPrintButton({ order, templateFields }: FormDataPrintButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePrint = async () => {
    setLoading(true);

    let formData: Record<string, string> = {};
    try {
      const submissions = await getFormSubmissionsForOrder(order.orderNumber || order.id);
      const completed = submissions.find((s: any) => s.status === 'completed');
      if (completed?.formData) {
        formData = completed.formData;
      } else {
        const latest = submissions[0];
        if (latest?.formData) formData = latest.formData;
      }
    } catch {
      // fallback
    }

    if (Object.keys(formData).length === 0) {
      setLoading(false);
      alert('No form data found for this order.');
      return;
    }

    // Build grouped fields
    const fields = templateFields || [];
    const groupOrder = [
      'personal', 'passport', 'address', 'family', 'profession',
      'travel', 'references', 'previousVisa',
    ];
    const groupLabels: Record<string, string> = {
      personal: 'Personal Information',
      passport: 'Passport Details',
      address: 'Address',
      family: 'Family Details',
      profession: 'Profession & Employer',
      travel: 'Travel Details',
      references: 'References',
      previousVisa: 'Previous Visa',
    };

    // Build rows: use template fields if available, otherwise raw keys
    let rows: { group: string; label: string; value: string }[] = [];

    if (fields.length > 0) {
      const sorted = [...fields].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      for (const f of sorted) {
        const val = formData[f.id];
        if (!val) continue;
        rows.push({
          group: f.group || 'other',
          label: f.labelEn || f.label || f.id,
          value: val,
        });
      }
    } else {
      for (const [key, val] of Object.entries(formData)) {
        if (!val) continue;
        rows.push({ group: 'other', label: key, value: val });
      }
    }

    // Group rows
    const grouped: Record<string, typeof rows> = {};
    for (const row of rows) {
      if (!grouped[row.group]) grouped[row.group] = [];
      grouped[row.group].push(row);
    }

    const orderedGroups = groupOrder.filter(g => grouped[g]).concat(
      Object.keys(grouped).filter(g => !groupOrder.includes(g))
    );

    const customerName = `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim() || 'Customer';
    const orderNumber = order.orderNumber || order.id || '';
    const destination = order.destinationCountry || '';
    const visaProduct = order.visaProduct?.nameEn || order.visaProduct?.name || '';

    // Traveler info
    const travelers = (order.travelers || []).map((t: any, i: number) => 
      `${t.firstName || ''} ${t.lastName || ''}`.trim() || `Traveler ${i + 1}`
    ).join(', ');

    const printHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Form Data — ${orderNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; padding: 32px; max-width: 800px; margin: 0 auto; font-size: 13px; line-height: 1.5; }
    .header { border-bottom: 2px solid #0EB0A6; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 20px; color: #0EB0A6; margin-bottom: 4px; }
    .header .meta { font-size: 12px; color: #6b7280; }
    .header .meta span { margin-right: 16px; }
    .group { margin-bottom: 20px; break-inside: avoid; }
    .group-title { font-size: 14px; font-weight: 700; color: #0EB0A6; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .field-row { display: flex; padding: 4px 0; border-bottom: 1px solid #f3f4f6; }
    .field-row:last-child { border-bottom: none; }
    .field-label { width: 220px; flex-shrink: 0; color: #6b7280; font-size: 12px; padding-right: 12px; }
    .field-value { flex: 1; font-weight: 500; color: #111827; word-break: break-word; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
    @media print {
      body { padding: 16px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom:16px;text-align:right;">
    <button onclick="window.print()" style="background:#0EB0A6;color:white;border:none;padding:8px 20px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">🖨 Print / Save as PDF</button>
  </div>
  <div class="header">
    <h1>DOX Visumpartner — Customer Form Data</h1>
    <div class="meta">
      <span><strong>Order:</strong> ${orderNumber}</span>
      <span><strong>Customer:</strong> ${customerName}</span>
      ${destination ? `<span><strong>Destination:</strong> ${destination}</span>` : ''}
      ${visaProduct ? `<span><strong>Product:</strong> ${visaProduct}</span>` : ''}
    </div>
    ${travelers ? `<div class="meta" style="margin-top:4px;"><span><strong>Travelers:</strong> ${travelers}</span></div>` : ''}
  </div>

  ${orderedGroups.map(groupId => `
    <div class="group">
      <div class="group-title">${groupLabels[groupId] || groupId}</div>
      ${(grouped[groupId] || []).map(row => `
        <div class="field-row">
          <div class="field-label">${row.label}</div>
          <div class="field-value">${row.value}</div>
        </div>
      `).join('')}
    </div>
  `).join('')}

  <div class="footer">
    DOX Visumpartner AB — Printed ${new Date().toLocaleString('sv-SE')}
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printHtml);
      printWindow.document.close();
    }

    setLoading(false);
  };

  return (
    <button
      onClick={handlePrint}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors disabled:opacity-50"
      title="Print customer form data as PDF"
    >
      {loading ? '⏳' : '🖨'} Print Form Data
    </button>
  );
}
