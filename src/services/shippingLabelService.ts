import jsPDF from 'jspdf';
import type { Order } from '@/firebase/orderService';

function formatAddressLine(order: Order): string {
  const name = `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim();
  const addr = order.customerInfo?.address || '';
  const zipCity = [order.customerInfo?.postalCode, order.customerInfo?.city].filter(Boolean).join(' ');
  const country = order.customerInfo?.country || '';
  return [name, addr, zipCity, country].filter(Boolean).join('\n');
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

const REK_ADDRESS = {
  name: 'DOX Visumpartner AB',
  attention: 'Att: Dokumenthantering',
  street: 'Box 38',
  postalCity: '121 25 Stockholm-Globen',
  country: 'Sverige',
};

const BUD_ADDRESS = {
  name: 'DOX Visumpartner AB',
  attention: 'Att: Dokumenthantering',
  street: 'Livdjursgatan 4, våning 6',
  postalCity: '121 62 Johanneshov',
  country: 'Sverige',
};

export function generateShippingLabelPDF(opts: LabelOptions = {}): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'A4' }); // A4 for both addresses

  // Header band
  doc.setFillColor(46, 45, 44);
  doc.rect(0, 0, 210, 25, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Fraktsedel - DOX Visumpartner AB', 105, 12, { align: 'center' });
  
  if (opts.orderNumber) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Order: ${opts.orderNumber}`, 105, 20, { align: 'center' });
  }

  let y = 35;
  doc.setTextColor(32, 33, 36);

  // Instruction text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Välj adressen som matchar din fraktmetod. Skriv ordernumret tydligt på kuvertet.', 105, y, { align: 'center' });
  y += 15;

  // ===== REK ADDRESS (Left side) =====
  const rekX = 15;
  const boxWidth = 85;
  const boxHeight = 75;

  // REK label badge
  doc.setFillColor(220, 38, 38); // Red
  doc.roundedRect(rekX, y, 30, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('REK', rekX + 15, y + 5.5, { align: 'center' });

  // REK subtitle
  doc.setTextColor(220, 38, 38);
  doc.setFontSize(10);
  doc.text('Rekommenderat brev', rekX + 35, y + 5.5);

  y += 12;

  // REK address box
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(1);
  doc.roundedRect(rekX, y, boxWidth, boxHeight, 3, 3, 'S');

  let rekY = y + 10;
  doc.setTextColor(32, 33, 36);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(REK_ADDRESS.name, rekX + 5, rekY); rekY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(REK_ADDRESS.attention, rekX + 5, rekY); rekY += 7;
  doc.text(REK_ADDRESS.street, rekX + 5, rekY); rekY += 7;
  doc.text(REK_ADDRESS.postalCity, rekX + 5, rekY); rekY += 7;
  doc.setFont('helvetica', 'bold');
  doc.text(REK_ADDRESS.country, rekX + 5, rekY);

  // ===== BUD/DHL ADDRESS (Right side) =====
  const budX = 110;

  // BUD label badge
  doc.setFillColor(37, 99, 235); // Blue
  doc.roundedRect(budX, y - 12, 45, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('BUD / DHL', budX + 22.5, y - 6.5, { align: 'center' });

  // BUD subtitle
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(10);
  doc.text('Bud / Kurir', budX + 50, y - 6.5);

  // BUD address box
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(1);
  doc.roundedRect(budX, y, boxWidth, boxHeight, 3, 3, 'S');

  let budY = y + 10;
  doc.setTextColor(32, 33, 36);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(BUD_ADDRESS.name, budX + 5, budY); budY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(BUD_ADDRESS.attention, budX + 5, budY); budY += 7;
  doc.text(BUD_ADDRESS.street, budX + 5, budY); budY += 7;
  doc.text(BUD_ADDRESS.postalCity, budX + 5, budY); budY += 7;
  doc.setFont('helvetica', 'bold');
  doc.text(BUD_ADDRESS.country, budX + 5, budY);

  y += boxHeight + 15;

  // Order number section
  doc.setTextColor(32, 33, 36);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  const orderLabel = opts.orderNumber ? `Order: ${opts.orderNumber}` : 'Order: ________________';
  doc.text(orderLabel, 105, y, { align: 'center' });
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(95, 99, 104);
  doc.text('Skriv ordernumret tydligt på kuvertet/paketet.', 105, y, { align: 'center' });

  // Footer instructions
  y = 260;
  doc.setFontSize(9);
  doc.setTextColor(95, 99, 104);
  doc.text('Tips: Klipp ut den adress du behöver och fäst på kuvertet.', 105, y, { align: 'center' });
  y += 5;
  doc.text('REK = Rekommenderat brev via Posten | BUD/DHL = Bud eller kurirtjänst', 105, y, { align: 'center' });

  return doc;
}

export function printShippingLabel(orderNumber?: string): void {
  const doc = generateShippingLabelPDF({ orderNumber });
  const blobUrl = doc.output('bloburl');
  const win = window.open(blobUrl);
  if (!win) {
    doc.save(`Fraktsedel ${orderNumber || ''}.pdf`);
  }
}
