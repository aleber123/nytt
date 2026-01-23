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
  if (!docType) return 'Document';
  
  const names: Record<string, string> = {
    birthCertificate: 'Birth Certificate',
    marriageCertificate: 'Marriage Certificate',
    diploma: 'Diploma',
    commercial: 'Commercial Document',
    powerOfAttorney: 'Power of Attorney',
    certificateOfOrigin: 'Certificate of Origin',
    passport: 'Passport',
    passportCopy: 'Passport Copy',
    idCard: 'ID Card',
    drivingLicense: 'Driving License',
    residencePermit: 'Residence Permit',
    degreeCertificate: 'Degree Certificate',
    transcript: 'Transcript',
    employmentCertificate: 'Employment Certificate',
    salaryCertificate: 'Salary Certificate',
    letterOfAppointment: 'Letter of Appointment',
    criminalRecord: 'Criminal Record',
    declarationLetter: 'Declaration Letter',
    companyRegistration: 'Company Registration',
    articlesOfAssociation: 'Articles of Association',
    annualReport: 'Annual Report',
    boardResolution: 'Board Resolution',
    minutesOfMeeting: 'Minutes of Meeting',
    businessDocuments: 'Business Documents',
    freeSalesCertificate: 'Free Sales Certificate',
    priceCertificate: 'Price Certificate',
    invoice: 'Invoice',
    contract: 'Contract',
    distributionAgreement: 'Distribution Agreement',
    terminationAgreement: 'Termination of Agreement',
    euDeclarationOfConformity: 'EU Declaration of Conformity',
    euCertificate: 'EU Certificate',
    isoCertificate: 'ISO Certificate',
    fscCertificate: 'FSC Certificate',
    productionLicense: 'Production License',
    manufacturerAuthorisation: 'Manufacturer/Importer Authorisation',
    medicalCertificate: 'Medical Certificate',
    bankStatement: 'Bank Statement',
    deathCertificate: 'Death Certificate',
    divorceDecree: 'Divorce Decree',
    adoptionCertificate: 'Adoption Certificate',
    nameChange: 'Name Change Certificate',
    other: 'Other Document'
  };
  
  if (names[docType]) return names[docType];
  
  // Handle custom document types
  if (docType.startsWith('custom_')) {
    const name = docType.replace('custom_', '').replace(/_/g, ' ');
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  
  return docType;
}

// Get all document types as display string (for orders with multiple types)
function getAllDocumentTypesDisplay(order: Order): string {
  const types = Array.isArray((order as any).documentTypes) && (order as any).documentTypes.length > 0
    ? (order as any).documentTypes
    : order.documentType ? [order.documentType] : [];
  return types.map(getDocumentTypeName).join(', ') || 'Document';
}

function getCountryName(country?: string): string {
  if (!country) return '';

  // Use Intl.DisplayNames to get full English country name
  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
    const fullName = displayNames.of(country.toUpperCase());
    if (fullName) return fullName;
  } catch {}

  // Fallback map for common countries
  const map: Record<string, string> = {
    US: 'United States of America',
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
    TR: 'Turkey',
    KW: 'Kuwait',
    BR: 'Brazil',
    MX: 'Mexico',
    AE: 'United Arab Emirates',
    SA: 'Saudi Arabia',
    QA: 'Qatar',
    IQ: 'Iraq',
    SY: 'Syria',
    LB: 'Lebanon',
    ET: 'Ethiopia',
    AO: 'Angola',
    TW: 'Taiwan'
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
    pickup_service: 'Document Pickup',
    'dhl-sweden': 'DHL Sweden',
    'dhl-europe': 'DHL Europe',
    'dhl-world': 'DHL World',
    'dhl-express-12': 'DHL Express 12:00',
    'dhl-express-09': 'DHL Express 09:00',
    'postnord-rek': 'PostNord Registered',
    'office-pickup': 'Office Pickup',
    'own-delivery': 'Own Delivery',
    express: 'Express Service',
    return_service: 'Return Shipping',
    premium_delivery: 'Premium Delivery',
    premium_pickup: 'Premium Pickup'
  };
  return map[id] || id;
}

// Translate Swedish pricing descriptions to English
function translateDescription(desc: string): string {
  if (!desc) return '';
  
  const translations: Record<string, string> = {
    'Skannade kopior': 'Scanned Copies',
    'Expresstjänst': 'Express Service',
    'Hämtning av dokument': 'Document Pickup',
    'Officiell avgift': 'Official Fee',
    'serviceavgift': 'Service Fee',
    'DOX Visumpartner serviceavgift': 'DOX Visumpartner Service Fee',
    'Apostille - Officiell avgift': 'Apostille - Official Fee',
    'Notarisering - Officiell avgift': 'Notarization - Official Fee',
    'Handelskammarlegalisering - Officiell avgift': 'Chamber of Commerce - Official Fee',
    'Utrikesdepartementets legalisering - Officiell avgift': 'Ministry for Foreign Affairs - Official Fee',
    'Ambassadlegalisering - Officiell avgift': 'Embassy Legalisation - Official Fee',
    'Översättning - Officiell avgift': 'Translation - Official Fee'
  };
  
  // Check for exact match first
  if (translations[desc]) return translations[desc];
  
  // Check for partial matches and replace
  let result = desc;
  
  // Replace Swedish service names in descriptions
  result = result.replace(/Apostille/g, 'Apostille');
  result = result.replace(/Notarisering/g, 'Notarization');
  result = result.replace(/Handelskammarlegalisering/g, 'Chamber of Commerce');
  result = result.replace(/Utrikesdepartementets legalisering/g, 'Ministry for Foreign Affairs');
  result = result.replace(/Ambassadlegalisering/g, 'Embassy Legalisation');
  result = result.replace(/Översättning/g, 'Translation');
  result = result.replace(/Officiell avgift/g, 'Official Fee');
  result = result.replace(/serviceavgift/g, 'Service Fee');
  result = result.replace(/Skannade kopior/g, 'Scanned Copies');
  result = result.replace(/Expresstjänst/g, 'Express Service');
  result = result.replace(/Hämtning av dokument/g, 'Document Pickup');
  
  return result;
}

export async function generateCoverLetterPDF(order: Order, opts?: { autoPrint?: boolean }): Promise<jsPDF> {
  const doc = new jsPDF();

  // Brand palette - ink-saving version (no large dark fills)
  const primary: [number, number, number] = [46, 45, 44]; // custom.page-header #2E2D2C
  const text: [number, number, number] = [32, 33, 36]; // gray-900
  const grayText: [number, number, number] = [95, 99, 104]; // gray-700
  const lineGray: [number, number, number] = [180, 180, 180]; // darker line for visibility
  const softBg: [number, number, number] = [245, 245, 245]; // very light gray

  // Header - ink-saving: just a thin line instead of solid fill
  doc.setDrawColor(primary[0], primary[1], primary[2]);
  doc.setLineWidth(1);
  doc.line(20, 28, 190, 28);

  // Logo (left)
  try {
    const { dataUrl, width, height } = await loadImageToDataUrl('/dox-logo.webp');
    const targetH = 20; // mm (doubled for better visibility)
    const ratio = width / height || 1;
    const targetW = targetH * ratio;
    doc.addImage(dataUrl, 'PNG', 20, 6, targetW, targetH);
  } catch {}

  // Order number prominent
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  const ord = order.orderNumber || order.id || '';
  if (ord) doc.text(`Order: ${ord}`, 20, 24);

  // Subtitle right: PACKING SLIP + date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('PACKING SLIP', 190, 14, { align: 'right' });
  doc.text(formatDate(order.createdAt), 190, 20, { align: 'right' });

  // Company info block (place below header to avoid overlap)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const companyLines = [
    'DOX Visumpartner AB',
    'Box 38',
    '121 25 Stockholm-Globen',
    'Tel: 08-40941900',
    'info@doxvl.se'
  ];

  // Body container - adjusted for smaller header
  let y = 40;
  doc.setTextColor(text[0], text[1], text[2]);

  // Render company block at body top-right
  let cy = y;
  doc.setFontSize(8);
  companyLines.forEach((l) => {
    doc.text(l, 190, cy, { align: 'right' });
    cy += 3.5;
  });
  // Leave space under the right block if needed
  const companyBlockBottom = cy;
  // Push the left content below the company block to avoid overlap
  if (companyBlockBottom + 4 > y) {
    y = companyBlockBottom + 4;
  }

  // Card: Orderinformation
  // Section header - simple underlined text instead of filled box (ink-saving)
  doc.setDrawColor(lineGray[0], lineGray[1], lineGray[2]);
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

  details.push(['Document type', getAllDocumentTypesDisplay(order)]);
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

  const hasNotarization = serviceIds.some((id) => id === 'notarisering' || id === 'notarization');
  const hasApostille = serviceIds.some((id) => id === 'apostille');
  const hasChamber = serviceIds.some((id) => id === 'chamber');
  const hasMinistry = serviceIds.some((id) => id === 'utrikesdepartementet' || id === 'ud');
  const hasEmbassy = serviceIds.some((id) => id === 'ambassad' || id === 'embassy');
  const hasTranslation = serviceIds.some((id) => id === 'oversattning' || id === 'translation');

  const checklistItems: string[] = [];
  if (hasNotarization) checklistItems.push('Notarization');
  if (hasApostille) checklistItems.push('Apostille');
  if (hasChamber) checklistItems.push('Chamber of Commerce');
  if (hasMinistry) checklistItems.push('Ministry for Foreign Affairs');
  if (hasEmbassy) checklistItems.push('Embassy Legalisation');
  if (hasTranslation) checklistItems.push('Translation');

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
    `DOX Visumpartner AB • Box 38, 121 25 Stockholm-Globen • Tel: 08-40941900 • info@doxvl.se`,
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

  // Brand palette - ink-saving version (no large dark fills)
  const primary: [number, number, number] = [46, 45, 44];
  const text: [number, number, number] = [32, 33, 36];
  const grayText: [number, number, number] = [95, 99, 104];
  const lineGray: [number, number, number] = [180, 180, 180];
  const softBg: [number, number, number] = [245, 245, 245];

  // Header - ink-saving: just a thin line instead of solid fill
  doc.setDrawColor(primary[0], primary[1], primary[2]);
  doc.setLineWidth(1);
  doc.line(20, 28, 190, 28);

  // Logo (left)
  try {
    const { dataUrl, width, height } = await loadImageToDataUrl('/dox-logo.webp');
    const targetH = 20; // mm (doubled for better visibility)
    const ratio = width / height || 1;
    const targetW = targetH * ratio;
    doc.addImage(dataUrl, 'PNG', 20, 6, targetW, targetH);
  } catch {}

  // Order number prominent
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  const ord = order.orderNumber || order.id || '';
  if (ord) doc.text(`Order: ${ord}`, 20, 24);

  // Subtitle right: ORDER CONFIRMATION + date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('ORDER CONFIRMATION', 190, 14, { align: 'right' });
  doc.text(formatDate(order.createdAt), 190, 20, { align: 'right' });

  // Company info block (right)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const companyLines = [
    'DOX Visumpartner AB',
    'Box 38',
    '121 25 Stockholm-Globen',
    'Tel: 08-40941900',
    'info@doxvl.se'
  ];

  // Body container - adjusted for smaller header
  let y = 40;
  doc.setTextColor(text[0], text[1], text[2]);

  // Render company block at body top-right
  let cy = y;
  doc.setFontSize(8);
  companyLines.forEach((l) => {
    doc.text(l, 190, cy, { align: 'right' });
    cy += 3.5;
  });
  const companyBlockBottom = cy;
  if (companyBlockBottom + 4 > y) {
    y = companyBlockBottom + 4;
  }

  // Section: Order information - simple text header (ink-saving)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(46, 45, 44);
  doc.text('Order Information', 20, y);
  y += 8;

  doc.setTextColor(text[0], text[1], text[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const details: Array<[string, string]> = [];
  details.push(['Order number', ord]);
  details.push(['Date', formatDate(order.createdAt)]);

  const customerName = `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim();
  if (customerName) details.push(['Customer', customerName]);

  details.push(['Document type', getAllDocumentTypesDisplay(order)]);
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
    details.push(['Return method', returnMethod]);
  }
  if (order.returnTrackingNumber) {
    details.push(['Tracking number', String(order.returnTrackingNumber)]);
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

  // Pricing summary - simple text header (ink-saving)
  const hasPricingData = Array.isArray(order.pricingBreakdown) || typeof order.totalPrice === 'number';
  if (hasPricingData) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(46, 45, 44);
    doc.text('Pricing summary', 20, y);
    y += 6;

    const labelX = 20;
    const valueX = 188;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(text[0], text[1], text[2]);

    // Show each line item from pricing breakdown
    if (Array.isArray(order.pricingBreakdown)) {
      order.pricingBreakdown.forEach((item: any) => {
        // Get the price - prefer total, then fee, then calculate from unitPrice
        let price = 0;
        if (typeof item.total === 'number') {
          price = item.total;
        } else if (typeof item.fee === 'number') {
          price = item.fee;
        } else if (typeof item.unitPrice === 'number') {
          price = item.unitPrice * (item.quantity || 1);
        }
        
        if (!price) return;
        
        // Get description - translate if needed
        let description = item.description || getServiceName(item.service) || 'Item';
        description = translateDescription(description);
        
        doc.text(description, labelX, y);
        doc.text(formatCurrency(price), valueX, y, { align: 'right' });
        y += 5;
      });
    }

    // Show total
    if (typeof order.totalPrice === 'number') {
      y += 2;
      doc.setDrawColor(lineGray[0], lineGray[1], lineGray[2]);
      doc.line(labelX, y - 2, valueX, y - 2);
      doc.setFont('helvetica', 'bold');
      doc.text('Total', labelX, y + 2);
      doc.text(formatCurrency(order.totalPrice), valueX, y + 2, { align: 'right' });
      y += 8;
    }

    y += 6;
  }

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

// ============================================================================
// INSTANCE-SPECIFIC COVER LETTERS
// ============================================================================

type CoverLetterType = 'notary-apostille' | 'chamber' | 'ud' | 'embassy' | 'translation';

// Editable fields for cover letter
export interface NotaryApostilleCoverLetterData {
  documentDescription: string; // e.g. "1 x Birth Certificate"
  documentIssuer: string; // Company/authority that issued the document
  actions: string[]; // List of actions to perform
  countryOfUse: string;
  language: string;
  invoiceReference: string; // Our order number (SWE000...)
  paymentMethod: string;
  returnMethod: string;
}

/**
 * Get default data for Notary/Apostille cover letter from order
 */
export function getNotaryApostilleDefaults(order: Order): NotaryApostilleCoverLetterData {
  const services = Array.isArray(order.services) ? order.services : [];
  const hasNotarization = services.some(s => s === 'notarization' || s === 'notarisering');
  const hasApostille = services.some(s => s === 'apostille');

  const notarizationDetails = (order as any).notarizationDetails || {};
  const hasSignature = notarizationDetails.signature === true;
  const hasSigningAuthority = notarizationDetails.signingAuthority === true;
  const hasCopy = notarizationDetails.copy === true;
  const hasOther = notarizationDetails.other === true;
  const otherText = notarizationDetails.otherText || '';

  const actions: string[] = [];
  if (hasNotarization) {
    if (hasSignature) actions.push('Signature verification');
    if (hasSigningAuthority) actions.push('Verify signing authority');
    if (hasCopy) actions.push('Certified copy');
    if (hasOther && otherText) actions.push(otherText);
    if (actions.length === 0 && hasNotarization) {
      actions.push('Notarization');
    }
  }
  if (hasApostille) {
    actions.push('Apostille');
  }

  const quantity = order.quantity || 1;
  const docType = getAllDocumentTypesDisplay(order);

  return {
    documentDescription: `${quantity} x ${docType}`,
    documentIssuer: '', // To be filled in by admin
    actions,
    countryOfUse: getCountryName(order.country),
    language: (order as any).language || (order as any).documentLanguage || 'English',
    invoiceReference: order.orderNumber || '', // Use our order number (SWE000...)
    paymentMethod: order.paymentMethod || 'Invoice',
    returnMethod: 'Pickup by DOX Visumpartner AB'
  };
}

/**
 * Generate a cover letter for Notarius Publicus / Apostille
 * This is used when visiting Notarius Publicus for notarization and/or apostille
 */
export async function generateNotaryApostilleCoverLetter(
  order: Order, 
  data: NotaryApostilleCoverLetterData,
  opts?: { autoPrint?: boolean }
): Promise<jsPDF> {
  const doc = new jsPDF();

  // Brand palette
  const primary: [number, number, number] = [46, 45, 44];
  const text: [number, number, number] = [32, 33, 36];
  const grayText: [number, number, number] = [95, 99, 104];
  const lineGray: [number, number, number] = [180, 180, 180];

  // Header line
  doc.setDrawColor(primary[0], primary[1], primary[2]);
  doc.setLineWidth(1);
  doc.line(20, 28, 190, 28);

  // Logo - use new logo (larger)
  try {
    const { dataUrl, width, height } = await loadImageToDataUrl('/dox-logo-new.png');
    const targetH = 36; // mm (doubled for better visibility)
    const ratio = width / height || 1;
    const targetW = targetH * ratio;
    doc.addImage(dataUrl, 'PNG', 20, 2, targetW, targetH);
  } catch {}

  // Title: Notarius Publicus
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Notarius Publicus', 190, 14, { align: 'right' });

  // Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text(formatDate(new Date()), 190, 20, { align: 'right' });

  // Company info block (right side)
  let y = 40;
  const companyLines = [
    'DOX Visumpartner AB',
    'Box 38',
    '121 25 Stockholm-Globen',
    'Tel: 08-40941900',
    'info@doxvl.se'
  ];
  doc.setFontSize(8);
  let cy = y;
  companyLines.forEach((l) => {
    doc.text(l, 190, cy, { align: 'right' });
    cy += 3.5;
  });

  // Main title
  y = 58;
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Cover Letter', 20, y);
  y += 12;

  // Document info
  doc.setTextColor(text[0], text[1], text[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  // "We request the following action(s) on the document(s):"
  doc.text('We request the following action(s) on the document(s):', 20, y);
  y += 8;

  // Document description (editable)
  doc.setFont('helvetica', 'bold');
  doc.text(data.documentDescription, 20, y);
  y += 6;

  // Document issuer (if provided)
  if (data.documentIssuer) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    doc.setFontSize(10);
    doc.text(`Issued by: ${data.documentIssuer}`, 20, y);
    y += 6;
  }
  y += 2;

  // Requested actions section
  doc.setTextColor(text[0], text[1], text[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Requested Action(s):', 20, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  // Draw actions with checkboxes (from editable data)
  const boxSize = 4;
  data.actions.forEach((action) => {
    doc.setDrawColor(lineGray[0], lineGray[1], lineGray[2]);
    doc.rect(20, y - boxSize + 1, boxSize, boxSize);
    doc.text(action, 20 + boxSize + 4, y + 1);
    y += 7;
  });

  y += 6;

  // Details section
  doc.setDrawColor(lineGray[0], lineGray[1], lineGray[2]);
  doc.line(20, y, 190, y);
  y += 8;

  // Two-column details (from editable data)
  const leftX = 20;
  const rightX = 110;
  const rowH = 12;

  const details: Array<{ label: string; value: string; col: 'left' | 'right' }> = [];

  // Country of use
  if (data.countryOfUse) {
    details.push({ label: 'Country of use', value: data.countryOfUse, col: 'left' });
  }

  // Language
  details.push({ label: 'Language', value: data.language, col: 'right' });

  // Order number (always shown) - use the order number passed via invoiceReference which defaults to order.orderNumber
  const orderNum = order.orderNumber || order.id || '';
  if (orderNum) {
    details.push({ label: 'Order number', value: orderNum, col: 'left' });
  }

  // Additional invoice reference (if provided and different from order number)
  if (data.invoiceReference && data.invoiceReference !== orderNum) {
    details.push({ label: 'Additional reference', value: data.invoiceReference, col: 'left' });
  }

  // Payment method
  details.push({ label: 'Payment method', value: `${data.paymentMethod} (via email: invoice@visumpartner.se)`, col: 'right' });

  // Return method
  details.push({ label: 'Return', value: data.returnMethod, col: 'left' });

  // Render details
  let leftY = y;
  let rightY = y;
  details.forEach((detail) => {
    const x = detail.col === 'left' ? leftX : rightX;
    const currentY = detail.col === 'left' ? leftY : rightY;

    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(detail.label + ':', x, currentY);

    doc.setTextColor(text[0], text[1], text[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(detail.value, x, currentY + 5);

    if (detail.col === 'left') {
      leftY += rowH;
    } else {
      rightY += rowH;
    }
  });

  y = Math.max(leftY, rightY) + 8;

  // Internal notes box
  doc.setDrawColor(lineGray[0], lineGray[1], lineGray[2]);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(16, y, 178, 28, 2, 2);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('Internal notes:', 20, y + 6);

  // Footer
  const footerY = 286;
  doc.setDrawColor(lineGray[0], lineGray[1], lineGray[2]);
  doc.line(20, footerY - 10, 190, footerY - 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text(
    'DOX Visumpartner AB • Box 38, 121 25 Stockholm-Globen • Tel: 08-40941900 • info@doxvl.se',
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

export async function downloadNotaryApostilleCoverLetter(order: Order, data: NotaryApostilleCoverLetterData): Promise<void> {
  const doc = await generateNotaryApostilleCoverLetter(order, data);
  const ord = order.orderNumber || order.id || '';
  const file = ord ? `Notary-Apostille Cover Letter ${ord}.pdf` : 'Notary-Apostille Cover Letter.pdf';
  doc.save(file);
}

export async function printNotaryApostilleCoverLetter(order: Order, data: NotaryApostilleCoverLetterData): Promise<void> {
  const doc = await generateNotaryApostilleCoverLetter(order, data, { autoPrint: true });
  const blobUrl = doc.output('bloburl');
  const win = window.open(blobUrl);
  if (!win) {
    const ord = order.orderNumber || order.id || '';
    const file = ord ? `Notary-Apostille Cover Letter ${ord}.pdf` : 'Notary-Apostille Cover Letter.pdf';
    doc.save(file);
  }
}

// ============================================================================
// EMBASSY COVER LETTER - Elegant formal letter for embassy legalisation
// ============================================================================

export interface EmbassyCoverLetterData {
  embassyName: string; // e.g. "Embassy of Kuwait"
  embassyAddress?: string;
  documentDescription: string; // e.g. "1 x Birth Certificate"
  documentIssuer?: string;
  countryOfUse: string;
  purpose?: string; // e.g. "For use in business registration"
  invoiceReference: string;
  paymentMethod: string;
  returnMethod: string;
  additionalNotes?: string;
}

/**
 * Get default data for Embassy cover letter from order
 */
export function getEmbassyDefaults(order: Order): EmbassyCoverLetterData {
  const quantity = order.quantity || 1;
  const docType = getAllDocumentTypesDisplay(order);
  const countryName = getCountryName(order.country);

  return {
    embassyName: `Embassy of ${countryName}`,
    embassyAddress: '',
    documentDescription: `${quantity} x ${docType}`,
    documentIssuer: '',
    countryOfUse: countryName,
    purpose: '',
    invoiceReference: order.orderNumber || '',
    paymentMethod: order.paymentMethod || 'Invoice',
    returnMethod: 'Collection by DOX Visumpartner AB',
    additionalNotes: ''
  };
}

/**
 * Generate a formal cover letter for Embassy legalisation
 * Clean design matching website colors
 */
export async function generateEmbassyCoverLetter(
  order: Order,
  data: EmbassyCoverLetterData,
  opts?: { autoPrint?: boolean }
): Promise<jsPDF> {
  const doc = new jsPDF();

  // Brand palette matching website
  const primary: [number, number, number] = [46, 45, 44]; // #2E2D2C - page header
  const text: [number, number, number] = [32, 33, 36]; // gray-900
  const grayText: [number, number, number] = [95, 99, 104]; // gray-700
  const lineGray: [number, number, number] = [180, 180, 180]; // subtle lines

  // Page dimensions
  const pageWidth = 210;
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;

  // ========== HEADER SECTION ==========
  // Header line
  doc.setDrawColor(primary[0], primary[1], primary[2]);
  doc.setLineWidth(1);
  doc.line(marginLeft, 48, pageWidth - marginRight, 48);

  // Logo
  try {
    const { dataUrl, width, height } = await loadImageToDataUrl('/dox-logo-new.png');
    const targetH = 20; // mm
    const ratio = width / height || 1;
    const targetW = targetH * ratio;
    doc.addImage(dataUrl, 'PNG', marginLeft, 10, targetW, targetH);
  } catch {}

  // Company info (right aligned)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  const companyLines = [
    'DOX Visumpartner AB',
    'Box 38',
    '121 25 Stockholm-Globen',
    'Tel: 08-40941900',
    'info@doxvl.se'
  ];
  let cy = 14;
  companyLines.forEach((l) => {
    doc.text(l, pageWidth - marginRight, cy, { align: 'right' });
    cy += 3.5;
  });

  // Title: Embassy Cover Letter
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Embassy Cover Letter', marginLeft, 42);

  // ========== DATE AND REFERENCE ==========
  let y = 58;
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text(dateStr, pageWidth - marginRight, y, { align: 'right' });
  
  if (data.invoiceReference) {
    doc.text(`Ref: ${data.invoiceReference}`, pageWidth - marginRight, y + 5, { align: 'right' });
  }

  // ========== EMBASSY ADDRESS ==========
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.text(data.embassyName, marginLeft, y);
  
  if (data.embassyAddress) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(text[0], text[1], text[2]);
    const addressLines = data.embassyAddress.split('\n');
    addressLines.forEach((line, i) => {
      doc.text(line, marginLeft, y + 6 + (i * 5));
    });
    y += 6 + (addressLines.length * 5);
  }

  // ========== SUBJECT LINE ==========
  y = Math.max(y + 15, 85);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.text('RE: Request for Document Legalisation', marginLeft, y);
  y += 12;

  // ========== SALUTATION ==========
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(text[0], text[1], text[2]);
  doc.text('Dear Sir/Madam,', marginLeft, y);
  y += 10;

  // ========== BODY TEXT ==========
  const bodyText = `We respectfully submit the enclosed document(s) for legalisation at your esteemed Embassy. The document(s) have been duly authenticated by the Ministry for Foreign Affairs and are now presented for your attestation.`;
  
  const wrappedBody = doc.splitTextToSize(bodyText, contentWidth);
  doc.text(wrappedBody, marginLeft, y);
  y += wrappedBody.length * 5 + 8;

  // ========== DOCUMENT DETAILS SECTION ==========
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.text('DOCUMENT DETAILS', marginLeft, y);
  y += 6;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(text[0], text[1], text[2]);
  
  // Document description
  doc.text(`Document(s): ${data.documentDescription}`, marginLeft, y);
  y += 5;
  
  // Issuer if provided
  if (data.documentIssuer) {
    doc.text(`Issued by: ${data.documentIssuer}`, marginLeft, y);
    y += 5;
  }
  
  // Country of use
  doc.text(`Country of Use: ${data.countryOfUse}`, marginLeft, y);
  y += 5;
  
  // Purpose if provided
  if (data.purpose) {
    doc.text(`Purpose: ${data.purpose}`, marginLeft, y);
    y += 5;
  }

  y += 8;

  // ========== ADDITIONAL PARAGRAPH ==========
  const additionalText = `We kindly request that the legalisation be processed at your earliest convenience. Upon completion, the document(s) will be collected by our authorised representative.`;
  
  const wrappedAdditional = doc.splitTextToSize(additionalText, contentWidth);
  doc.text(wrappedAdditional, marginLeft, y);
  y += wrappedAdditional.length * 5 + 8;

  // ========== REFERENCE INFO ==========
  const embassyOrderNum = order.orderNumber || order.id || '';
  if (embassyOrderNum) {
    doc.text(`Order Number: ${embassyOrderNum}`, marginLeft, y);
    y += 5;
  }
  // Additional reference if provided and different from order number
  if (data.invoiceReference && data.invoiceReference !== embassyOrderNum) {
    doc.text(`Additional Reference: ${data.invoiceReference}`, marginLeft, y);
    y += 5;
  }
  doc.text(`Payment Method: ${data.paymentMethod}`, marginLeft, y);
  y += 5;
  doc.text(`Collection: ${data.returnMethod}`, marginLeft, y);
  y += 12;

  // ========== CLOSING ==========
  const closingText = 'We thank you for your kind assistance and remain at your disposal for any further information.';
  const wrappedClosing = doc.splitTextToSize(closingText, contentWidth);
  doc.text(wrappedClosing, marginLeft, y);
  y += wrappedClosing.length * 5 + 10;
  
  doc.text('Yours faithfully,', marginLeft, y);
  y += 15;
  
  // Signature area
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.text('DOX Visumpartner AB', marginLeft, y);
  y += 4;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('Authorised Representative', marginLeft, y);

  // ========== FOOTER ==========
  const footerY = 286;
  doc.setDrawColor(lineGray[0], lineGray[1], lineGray[2]);
  doc.line(marginLeft, footerY - 10, pageWidth - marginRight, footerY - 10);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text(
    'DOX Visumpartner AB • Box 38, 121 25 Stockholm-Globen • Tel: 08-40941900 • info@doxvl.se',
    pageWidth / 2,
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

export async function downloadEmbassyCoverLetter(order: Order, data: EmbassyCoverLetterData): Promise<void> {
  const doc = await generateEmbassyCoverLetter(order, data);
  const ord = order.orderNumber || order.id || '';
  const file = ord ? `Embassy Cover Letter ${ord}.pdf` : 'Embassy Cover Letter.pdf';
  doc.save(file);
}

export async function printEmbassyCoverLetter(order: Order, data: EmbassyCoverLetterData): Promise<void> {
  const doc = await generateEmbassyCoverLetter(order, data, { autoPrint: true });
  const blobUrl = doc.output('bloburl');
  const win = window.open(blobUrl);
  if (!win) {
    const ord = order.orderNumber || order.id || '';
    const file = ord ? `Embassy Cover Letter ${ord}.pdf` : 'Embassy Cover Letter.pdf';
    doc.save(file);
  }
}

// ============================================================================
// UD (UTRIKESDEPARTEMENTET) COVER LETTER - Ministry for Foreign Affairs
// ============================================================================

export interface UDCoverLetterData {
  documentDescription: string; // e.g. "1 x Birth Certificate"
  documentIssuer?: string;
  countryOfUse: string;
  language: string;
  invoiceReference: string;
  paymentMethod: string;
  returnMethod: string;
}

/**
 * Get default data for UD cover letter from order
 */
export function getUDDefaults(order: Order): UDCoverLetterData {
  const quantity = order.quantity || 1;
  const docType = getAllDocumentTypesDisplay(order);
  const countryName = getCountryName(order.country);

  return {
    documentDescription: `${quantity} x ${docType}`,
    documentIssuer: '',
    countryOfUse: countryName,
    language: (order as any).language || (order as any).documentLanguage || 'English',
    invoiceReference: order.orderNumber || '',
    paymentMethod: order.paymentMethod || 'Invoice',
    returnMethod: 'Pickup by DOX Visumpartner AB'
  };
}

/**
 * Generate a cover letter for Utrikesdepartementet (Ministry for Foreign Affairs)
 * Used when submitting documents for UD authentication/legalisation
 */
export async function generateUDCoverLetter(
  order: Order,
  data: UDCoverLetterData,
  opts?: { autoPrint?: boolean }
): Promise<jsPDF> {
  const doc = new jsPDF();

  // Brand palette matching website
  const primary: [number, number, number] = [46, 45, 44]; // #2E2D2C - page header
  const text: [number, number, number] = [32, 33, 36]; // gray-900
  const grayText: [number, number, number] = [95, 99, 104]; // gray-700
  const lineGray: [number, number, number] = [180, 180, 180]; // subtle lines

  // Page dimensions
  const pageWidth = 210;
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;

  // ========== HEADER SECTION ==========
  // Header line
  doc.setDrawColor(primary[0], primary[1], primary[2]);
  doc.setLineWidth(1);
  doc.line(marginLeft, 48, pageWidth - marginRight, 48);

  // Logo
  try {
    const { dataUrl, width, height } = await loadImageToDataUrl('/dox-logo-new.png');
    const targetH = 20; // mm
    const ratio = width / height || 1;
    const targetW = targetH * ratio;
    doc.addImage(dataUrl, 'PNG', marginLeft, 10, targetW, targetH);
  } catch {}

  // Company info (right aligned)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  const companyLines = [
    'DOX Visumpartner AB',
    'Box 38',
    '121 25 Stockholm-Globen',
    'Tel: 08-40941900',
    'info@doxvl.se'
  ];
  let cy = 14;
  companyLines.forEach((l) => {
    doc.text(l, pageWidth - marginRight, cy, { align: 'right' });
    cy += 3.5;
  });

  // Title
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Utrikesdepartementet', marginLeft, 42);

  // ========== DATE AND REFERENCE ==========
  let y = 58;
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text(dateStr, pageWidth - marginRight, y, { align: 'right' });
  
  if (data.invoiceReference) {
    doc.text(`Ref: ${data.invoiceReference}`, pageWidth - marginRight, y + 5, { align: 'right' });
  }

  // ========== UD ADDRESS ==========
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.text('Utrikesdepartementet', marginLeft, y);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(text[0], text[1], text[2]);
  doc.text('Legaliseringsenheten', marginLeft, y + 6);
  doc.text('103 39 Stockholm', marginLeft, y + 11);

  // ========== MAIN CONTENT ==========
  y = 90;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.text('Cover Letter', marginLeft, y);
  y += 10;

  // Request text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(text[0], text[1], text[2]);
  doc.text('We request the following action(s) on the document(s):', marginLeft, y);
  y += 8;

  // Document description
  doc.setFont('helvetica', 'bold');
  doc.text(data.documentDescription, marginLeft, y);
  y += 6;

  // Document issuer (if provided)
  if (data.documentIssuer) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    doc.setFontSize(9);
    doc.text(`Issued by: ${data.documentIssuer}`, marginLeft, y);
    y += 6;
  }
  y += 4;

  // Requested actions section
  doc.setTextColor(text[0], text[1], text[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Requested Action(s):', marginLeft, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  // Draw action with checkbox
  const boxSize = 4;
  doc.setDrawColor(lineGray[0], lineGray[1], lineGray[2]);
  doc.rect(marginLeft, y - boxSize + 1, boxSize, boxSize);
  doc.text('UD Legalisation (Ministry for Foreign Affairs authentication)', marginLeft + boxSize + 4, y + 1);
  y += 10;

  // Separator line
  doc.setDrawColor(lineGray[0], lineGray[1], lineGray[2]);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 10;

  // Details section - two columns
  const leftX = marginLeft;
  const rightX = 110;
  const rowH = 14;

  // Country of use
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Country of use:', leftX, y);
  doc.setTextColor(text[0], text[1], text[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(data.countryOfUse, leftX, y + 5);

  // Language
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Language:', rightX, y);
  doc.setTextColor(text[0], text[1], text[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(data.language, rightX, y + 5);
  y += rowH;

  // Order number (always shown)
  const udOrderNum = order.orderNumber || order.id || '';
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Order number:', leftX, y);
  doc.setTextColor(text[0], text[1], text[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(udOrderNum || '—', leftX, y + 5);

  // Payment method
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Payment method:', rightX, y);
  doc.setTextColor(text[0], text[1], text[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`${data.paymentMethod} (via email: invoice@visumpartner.se)`, rightX, y + 5);
  y += rowH;

  // Additional reference (if provided and different from order number)
  if (data.invoiceReference && data.invoiceReference !== udOrderNum) {
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Additional reference:', leftX, y);
    doc.setTextColor(text[0], text[1], text[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(data.invoiceReference, leftX, y + 5);
    y += rowH;
  }

  // Return method
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Return:', leftX, y);
  doc.setTextColor(text[0], text[1], text[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(data.returnMethod, leftX, y + 5);
  y += rowH + 8;

  // Internal notes box
  doc.setDrawColor(lineGray[0], lineGray[1], lineGray[2]);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(marginLeft - 4, y, contentWidth + 8, 28, 2, 2);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('Internal notes:', marginLeft, y + 6);

  // ========== FOOTER ==========
  const footerY = 286;
  doc.setDrawColor(lineGray[0], lineGray[1], lineGray[2]);
  doc.line(marginLeft, footerY - 10, pageWidth - marginRight, footerY - 10);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text(
    'DOX Visumpartner AB • Box 38, 121 25 Stockholm-Globen • Tel: 08-40941900 • info@doxvl.se',
    pageWidth / 2,
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

export async function downloadUDCoverLetter(order: Order, data: UDCoverLetterData): Promise<void> {
  const doc = await generateUDCoverLetter(order, data);
  const ord = order.orderNumber || order.id || '';
  const file = ord ? `UD Cover Letter ${ord}.pdf` : 'UD Cover Letter.pdf';
  doc.save(file);
}

export async function printUDCoverLetter(order: Order, data: UDCoverLetterData): Promise<void> {
  const doc = await generateUDCoverLetter(order, data, { autoPrint: true });
  const blobUrl = doc.output('bloburl');
  const win = window.open(blobUrl);
  if (!win) {
    const ord = order.orderNumber || order.id || '';
    const file = ord ? `UD Cover Letter ${ord}.pdf` : 'UD Cover Letter.pdf';
    doc.save(file);
  }
}
