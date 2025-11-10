import jsPDF from 'jspdf';

interface LabelOptions {
  orderNumber?: string;
}

const COMPANY = {
  name: 'DOX Visumpartner AB',
  attention: 'Att: Dokumenthantering',
  street: 'Livdjursgatan 4',
  postalCity: '121 62 Johanneshov',
  country: 'Sverige',
};

export function generateShippingLabelPDF(opts: LabelOptions = {}): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'A6' }); // A6 label size

  // Branding band
  doc.setFillColor(46, 45, 44);
  doc.rect(0, 0, 148, 18, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(COMPANY.name, 6, 12);

  // Address block
  let y = 28;
  doc.setTextColor(32, 33, 36);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Ship To:', 6, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(COMPANY.name, 6, y); y += 6;
  doc.text(COMPANY.attention, 6, y); y += 6;
  doc.text(COMPANY.street, 6, y); y += 6;
  doc.text(COMPANY.postalCity, 6, y); y += 6;
  doc.text(COMPANY.country, 6, y); y += 10;

  // Order number box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  const label = 'Order #';
  const value = opts.orderNumber || '________';
  doc.text(`${label}${value}`, 6, y);
  y += 4;
  doc.setDrawColor(46, 45, 44);
  doc.setLineWidth(0.4);
  doc.rect(6, y, 136, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Write the order number clearly inside the box if missing.', 8, y + 6);

  // Instruction
  y += 22;
  doc.setFontSize(9);
  doc.setTextColor(95, 99, 104);
  doc.text('Please place this label on the outside of your envelope.', 6, y);

  return doc;
}

export function printShippingLabel(orderNumber?: string): void {
  const doc = generateShippingLabelPDF({ orderNumber });
  const blobUrl = doc.output('bloburl');
  const win = window.open(blobUrl);
  if (!win) {
    doc.save(`Shipping Label ${orderNumber || ''}.pdf`);
  }
}
