import jsPDF from 'jspdf';
import type { Order } from '@/firebase/orderService';

async function loadImageToDataUrl(src: string): Promise<{ dataUrl: string; width: number; height: number; }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('No canvas context'));
        ctx.drawImage(img, 0, 0);
        resolve({ dataUrl: canvas.toDataURL('image/png'), width: img.naturalWidth, height: img.naturalHeight });
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

function formatDate(timestamp: any): string {
  try {
    let date: Date;
    if (!timestamp) return new Date().toLocaleDateString('en-GB');
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    if (isNaN(date.getTime())) return new Date().toLocaleDateString('en-GB');
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    }).format(date);
  } catch {
    return new Date().toLocaleDateString('en-GB');
  }
}

function formatCurrency(amount?: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '';
  try {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 2
    }).format(amount);
  } catch {
    return `${amount ?? 0} kr`;
  }
}

function getDocumentTypeName(docType?: string): string {
  switch (docType) {
    case 'birthCertificate':
      return 'Birth Certificate';
    case 'marriageCertificate':
      return 'Marriage Certificate';
    case 'diploma':
      return 'Diploma';
    case 'commercial':
      return 'Commercial Document';
    case 'powerOfAttorney':
      return 'Power of Attorney';
    default:
      return docType || 'Document';
  }
}

function getCountryName(country?: string): string {
  if (!country) return '';

  const map: Record<string, string> = {
    US: 'USA',
    GB: 'United Kingdom',
    DE: 'Germany',
    SE: 'Sweden',
    TH: 'Thailand',
    NO: 'Norway',
    DK: 'Denmark',
    FI: 'Finland',
    VN: 'Vietnam',
    FR: 'France',
    IR: 'Iran',
    ES: 'Spain',
    IT: 'Italy',
    BD: 'Bangladesh',
    NL: 'Netherlands',
    LK: 'Sri Lanka',
    PL: 'Poland',
    CA: 'Canada',
    AU: 'Australia',
    TR: 'Turkey'
  };

  const upper = country.toUpperCase();
  return map[upper] || country;
}

function getServiceName(id: string): string {
  const map: Record<string, string> = {
    apostille: 'Apostille',
    notarisering: 'Notarization',
    notarization: 'Notarization',
    ambassad: 'Embassy Legalisation',
    embassy: 'Embassy Legalisation',
    oversattning: 'Translation',
    translation: 'Translation',
    utrikesdepartementet: 'Ministry for Foreign Affairs',
    ud: 'Ministry for Foreign Affairs',
    chamber: 'Chamber of Commerce',
    scanned_copies: 'Scanned Copies',
    pickup_service: 'Document Pickup'
  };
  return map[id] || id;
}

export async function generateCoverLetterPDF(order: Order, opts?: { autoPrint?: boolean }): Promise<jsPDF> {
  const doc = new jsPDF();

  // Brand palette (use dark page header color from theme and neutral grays)
  const primary: [number, number, number] = [46, 45, 44]; // custom.page-header #2E2D2C
  const text: [number, number, number] = [32, 33, 36]; // gray-900
  const grayText: [number, number, number] = [95, 99, 104]; // gray-700
  const lineGray: [number, number, number] = [226, 232, 240]; // gray-200
  const softBg: [number, number, number] = [241, 245, 249]; // slate-100 as neutral section bg

  // Header band
  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.rect(0, 0, 210, 40, 'F');

  // Logo (left)
  try {
    const { dataUrl, width, height } = await loadImageToDataUrl('/dox-logo.webp');
    const targetH = 12; // mm
    const ratio = width / height || 1;
    const targetW = targetH * ratio;
    doc.addImage(dataUrl, 'PNG', 20, 10, targetW, targetH);
  } catch {}

  // Order number prominent
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  const ord = order.orderNumber || order.id || '';
  if (ord) doc.text(`${ord}`, 20, 30);

  // Subtitle right: COVER LETTER + date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('COVER LETTER', 190, 16, { align: 'right' });
  doc.text(formatDate(order.createdAt), 190, 22, { align: 'right' });

  // Company info block (place below header to avoid overlap)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const companyLines = [
    'DOX Visumpartner AB',
    'Box 38',
    '121 25 Stockholm-Globen',
    'info@doxvl.se'
  ];

  // Body container
  let y = 56;
  doc.setTextColor(text[0], text[1], text[2]);

  // Render company block at body top-right
  let cy = y - 4;
  companyLines.forEach((l) => {
    doc.text(l, 190, cy, { align: 'right' });
    cy += 4;
  });
  // Leave space under the right block if needed
  const companyBlockBottom = cy;
  // Push the left content below the company block to avoid overlap
  if (companyBlockBottom + 8 > y) {
    y = companyBlockBottom + 8;
  }

  // Card: Orderinformation
  // Section header chip
  doc.setFillColor(softBg[0], softBg[1], softBg[2]);
  doc.roundedRect(16, y - 8, 178, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(46, 45, 44);
  doc.text('Order Information', 20, y);
  y += 12;

  // Grid-like two-column info rows
  doc.setTextColor(text[0], text[1], text[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const details: Array<[string, string]> = [];
  details.push(['Order number', order.orderNumber || order.id || '']);
  details.push(['Date', formatDate(order.createdAt)]);

  const customerName = `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim();
  if (customerName) details.push(['Customer', customerName]);

  details.push(['Document type', getDocumentTypeName(order.documentType)]);
  details.push(['Country of use', getCountryName(order.country)]);
  details.push(['Quantity', `${order.quantity}`]);

  const serviceNames: string[] = Array.isArray(order.services)
    ? order.services.map(getServiceName)
    : order.services
      ? [getServiceName(order.services as unknown as string)]
      : [];

  const leftX = 20;
  const midX = 110;
  const rowH = 8;
  let rowCount = 0;
  details.forEach(([label, value]) => {
    const colX = rowCount % 2 === 0 ? leftX : midX;
    const rowY = y + Math.floor(rowCount / 2) * rowH;
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    doc.text(`${label}`, colX, rowY);
    doc.setTextColor(text[0], text[1], text[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(String(value || '—'), colX, rowY + 4);
    doc.setFont('helvetica', 'normal');
    rowCount++;
  });

  y += Math.ceil(rowCount / 2) * rowH + 10;
  doc.setDrawColor(lineGray[0], lineGray[1], lineGray[2]);
  doc.line(20, y, 190, y);
  y += 12;

  // Selected services (vertical list)
  if (serviceNames.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(46, 45, 44);
    doc.text('Selected services', 20, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(text[0], text[1], text[2]);

    serviceNames.forEach((name) => {
      doc.text(name, 20, y);
      y += 5;
    });

    y += 8;
  }

  // Removed checklist per request

  // Service checklist for driver (only for selected core services)
  const serviceIds = Array.isArray(order.services)
    ? order.services
    : order.services
      ? [order.services as unknown as string]
      : [];

  const hasChamber = serviceIds.some((id) => id === 'chamber');
  const hasNotarization = serviceIds.some((id) => id === 'notarisering' || id === 'notarization');
  const hasMinistry = serviceIds.some((id) => id === 'utrikesdepartementet' || id === 'ud');
  const hasEmbassy = serviceIds.some((id) => id === 'ambassad' || id === 'embassy');

  const checklistItems: string[] = [];
  if (hasChamber) checklistItems.push('Chamber of Commerce');
  if (hasNotarization) checklistItems.push('Notarization');
  if (hasMinistry) checklistItems.push('Ministry for Foreign Affairs');
  if (hasEmbassy) checklistItems.push('Embassy Legalisation');

  if (checklistItems.length > 0) {
    // Section title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(46, 45, 44);
    doc.text('Service checklist', 20, y);
    y += 6;

    // Checklist lines with empty boxes for manual ticking
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(text[0], text[1], text[2]);
    doc.setDrawColor(lineGray[0], lineGray[1], lineGray[2]);

    const boxSize = 4;
    const lineGap = 8;
    const boxX = 20;

    checklistItems.forEach((label) => {
      const baselineY = y;
      // Draw empty checkbox
      doc.rect(boxX, baselineY - boxSize + 1, boxSize, boxSize);
      // Label to the right of checkbox
      doc.text(label, boxX + boxSize + 4, baselineY + 1);
      y += lineGap;
    });

    y += 6;
  }

  // Notes box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(lineGray[0], lineGray[1], lineGray[2]);
  doc.roundedRect(16, y, 178, 28, 2, 2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('Internal notes:', 20, y + 6);
  y += 36;

  // Footer (match footer address)
  const footerY = 286;
  doc.setDrawColor(lineGray[0], lineGray[1], lineGray[2]);
  doc.line(20, footerY - 10, 190, footerY - 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text(
    `DOX Visumpartner AB • Box 38, 121 25 Stockholm-Globen • info@doxvl.se`,
    105,
    footerY,
    { align: 'center' }
  );

  if (opts?.autoPrint) {
    try {
      doc.autoPrint();
    } catch {}
  }

  return doc;
}

export async function downloadCoverLetter(order: Order): Promise<void> {
  const doc = await generateCoverLetterPDF(order);
  const ord = order.orderNumber || order.id || '';
  const file = ord ? `Cover letter ${ord}.pdf` : 'Cover letter.pdf';
  doc.save(file);
}

export async function printCoverLetter(order: Order): Promise<void> {
  const doc = await generateCoverLetterPDF(order, { autoPrint: true });
  const blobUrl = doc.output('bloburl');
  const win = window.open(blobUrl);
  if (!win) {
    const ord = order.orderNumber || order.id || '';
    const file = ord ? `Cover letter ${ord}.pdf` : 'Cover letter.pdf';
    doc.save(file);
  }
}

export async function generateOrderConfirmationPDF(order: Order): Promise<jsPDF> {
  const doc = new jsPDF();

  const primary: [number, number, number] = [46, 45, 44];
  const text: [number, number, number] = [32, 33, 36];
  const grayText: [number, number, number] = [95, 99, 104];
  const lineGray: [number, number, number] = [226, 232, 240];
  const softBg: [number, number, number] = [241, 245, 249];

  // Header band
  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.rect(0, 0, 210, 40, 'F');

  // Logo (left)
  try {
    const { dataUrl, width, height } = await loadImageToDataUrl('/dox-logo.webp');
    const targetH = 12;
    const ratio = width / height || 1;
    const targetW = targetH * ratio;
    doc.addImage(dataUrl, 'PNG', 20, 10, targetW, targetH);
  } catch {}

  // Order number prominent
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  const ord = order.orderNumber || order.id || '';
  if (ord) doc.text(`${ord}`, 20, 30);

  // Subtitle right: ORDER CONFIRMATION + date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('ORDER CONFIRMATION', 190, 16, { align: 'right' });
  doc.text(formatDate(order.createdAt), 190, 22, { align: 'right' });

  // Company info block (right)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const companyLines = [
    'DOX Visumpartner AB',
    'Box 38',
    '121 25 Stockholm-Globen',
    'info@doxvl.se'
  ];

  let y = 56;
  doc.setTextColor(text[0], text[1], text[2]);

  let cy = y - 4;
  companyLines.forEach((l) => {
    doc.text(l, 190, cy, { align: 'right' });
    cy += 4;
  });
  const companyBlockBottom = cy;
  if (companyBlockBottom + 8 > y) {
    y = companyBlockBottom + 8;
  }

  // Section: Order information
  doc.setFillColor(softBg[0], softBg[1], softBg[2]);
  doc.roundedRect(16, y - 8, 178, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(46, 45, 44);
  doc.text('Order Information', 20, y);
  y += 12;

  doc.setTextColor(text[0], text[1], text[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const details: Array<[string, string]> = [];
  details.push(['Order number', ord]);
  details.push(['Date', formatDate(order.createdAt)]);

  const customerName = `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim();
  if (customerName) details.push(['Customer', customerName]);

  details.push(['Document type', getDocumentTypeName(order.documentType)]);
  details.push(['Country of use', getCountryName(order.country)]);
  details.push(['Quantity', `${order.quantity}`]);

  const serviceNames: string[] = Array.isArray(order.services)
    ? order.services.map(getServiceName)
    : order.services
      ? [getServiceName(order.services as unknown as string)]
      : [];

  // Return address (from customer info)
  const addressParts: string[] = [];
  if (customerName) addressParts.push(customerName);
  if (order.customerInfo?.address) addressParts.push(order.customerInfo.address);
  const cityLine = [order.customerInfo?.postalCode, order.customerInfo?.city].filter(Boolean).join(' ');
  if (cityLine) addressParts.push(cityLine);
  const returnAddress = addressParts.join(', ');
  if (returnAddress) {
    details.push(['Return address', returnAddress]);
  }

  // Contact info
  const contactParts: string[] = [];
  if (order.customerInfo?.phone) contactParts.push(order.customerInfo.phone);
  if (order.customerInfo?.email) contactParts.push(order.customerInfo.email);
  const contact = contactParts.join(' | ');
  if (contact) {
    details.push(['Contact', contact]);
  }

  // Return method
  let returnMethod = order.returnService || '';
  if (returnMethod) {
    const returnLabelMap: Record<string, string> = {
      'own-delivery': 'Egen returfrakt (redan bokad)',
      'office-pickup': 'Hämtning på vårt kontor'
    };
    returnMethod = returnLabelMap[returnMethod] || returnMethod;
    if (order.returnTrackingNumber) {
      returnMethod += ` - Spårningsnummer: ${order.returnTrackingNumber}`;
    }
    details.push(['Return method', returnMethod]);
  }

  // Billing information
  if (order.paymentMethod) {
    details.push(['Payment method', order.paymentMethod]);
  }
  if (typeof order.totalPrice === 'number') {
    details.push(['Order total', formatCurrency(order.totalPrice)]);
  }
  if (order.invoiceReference) {
    details.push(['Invoice reference', order.invoiceReference]);
  }

  // Render details in two-column grid
  const leftX = 20;
  const midX = 110;
  const rowH = 8;
  let rowCount = 0;
  details.forEach(([label, value]) => {
    const colX = rowCount % 2 === 0 ? leftX : midX;
    const rowY = y + Math.floor(rowCount / 2) * rowH;
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    doc.text(label, colX, rowY);
    doc.setTextColor(text[0], text[1], text[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(String(value || '—'), colX, rowY + 4);
    doc.setFont('helvetica', 'normal');
    rowCount++;
  });

  y += Math.ceil(rowCount / 2) * rowH + 10;
  doc.setDrawColor(lineGray[0], lineGray[1], lineGray[2]);
  doc.line(20, y, 190, y);
  y += 10;

   // Selected services (vertical list)
  if (serviceNames.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(46, 45, 44);
    doc.text('Selected services', 20, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(text[0], text[1], text[2]);

    serviceNames.forEach((name) => {
      doc.text(name, 20, y);
      y += 5;
    });

    y += 8;
  }

  // Internal notes section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(46, 45, 44);
  doc.text('Internal notes', 20, y);
  y += 4;

  const notesText = (order.internalNotes || '').trim();
  const notesToRender = notesText || 'No internal notes.';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(text[0], text[1], text[2]);

  const wrappedNotes = doc.splitTextToSize(notesToRender, 170);
  const boxHeight = wrappedNotes.length * 5 + 12;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(lineGray[0], lineGray[1], lineGray[2]);
  doc.roundedRect(16, y, 178, boxHeight, 2, 2);
  doc.text(wrappedNotes, 20, y + 8);

  // Footer
  const footerY = 286;
  doc.setDrawColor(lineGray[0], lineGray[1], lineGray[2]);
  doc.line(20, footerY - 10, 190, footerY - 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text(
    'DOX Visumpartner AB • Box 38, 121 25 Stockholm-Globen • info@doxvl.se',
    105,
    footerY,
    { align: 'center' }
  );

  return doc;
}

export async function downloadOrderConfirmation(order: Order): Promise<void> {
  const doc = await generateOrderConfirmationPDF(order);
  const ord = order.orderNumber || order.id || '';
  const file = ord ? `Order confirmation ${ord}.pdf` : 'Order confirmation.pdf';
  doc.save(file);
}
