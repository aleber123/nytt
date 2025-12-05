import jsPDF from 'jspdf';
import type { Order } from '@/firebase/orderService';

function formatAddressLine(order: Order): string {
  const name = `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim();
  const addr = order.customerInfo?.address || '';
  const zipCity = [order.customerInfo?.postalCode, order.customerInfo?.city].filter(Boolean).join(' ');
  return [name, addr, zipCity].filter(Boolean).join('\n');
}

export async function generateDhlReturnLabelPDF(order: Order): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const primary: [number, number, number] = [46, 45, 44];
  const text: [number, number, number] = [32, 33, 36];
  const grayText: [number, number, number] = [95, 99, 104];

  // Header band
  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.rect(0, 0, 210, 30, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('DHL RETURN SHIPMENT', 105, 18, { align: 'center' });

  const ord = order.orderNumber || order.id || '';
  if (ord) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Order: ${ord}`, 105, 25, { align: 'center' });
  }

  let y = 40;
  doc.setTextColor(text[0], text[1], text[2]);

  // Sender box (DOX)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('FROM:', 20, y);
  y += 4;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const senderLines = [
    'DOX Visumpartner AB',
    'Henrik Oinas',
    'Livdjursgatan 4, våning 6',
    '121 62 Johanneshov',
    'SWEDEN',
    '08-409 419 00',
    'info@doxvl.se'
  ];
  senderLines.forEach((line, idx) => {
    doc.text(line, 20, y + idx * 5);
  });

  // Receiver box (customer)
  let ry = 40;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TO:', 120, ry);
  ry += 4;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const address = formatAddressLine(order) || 'Customer address missing';
  const addressLines = address.split('\n');
  addressLines.forEach((line, idx) => {
    doc.text(line, 120, ry + idx * 5);
  });

  y = 80;

  // Tracking number
  const tracking = order.returnTrackingNumber || '';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('TRACKING NUMBER', 20, y);
  y += 8;
  doc.setFontSize(18);
  doc.text(tracking || '—', 20, y);

  y += 20;

  // Barcode placeholder
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  const barcodeX = 20;
  const barcodeY = y;
  const barcodeW = 170;
  const barcodeH = 40;
  doc.rect(barcodeX, barcodeY, barcodeW, barcodeH);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('Barcode (DHL label image will replace this box in future versions)', barcodeX + 2, barcodeY + barcodeH / 2);

  // Footer note
  doc.setFontSize(9);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('Attach this label clearly on the return shipment for DHL pickup/delivery.', 20, 270);

  return doc;
}

export async function downloadDhlReturnLabel(order: Order): Promise<void> {
  const doc = await generateDhlReturnLabelPDF(order);
  const ord = order.orderNumber || order.id || '';
  const fileName = ord ? `DHL return label ${ord}.pdf` : 'DHL return label.pdf';
  doc.save(fileName);
}


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
