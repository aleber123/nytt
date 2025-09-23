import { Order } from '@/firebase/orderService';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
  setDoc,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import jsPDF from 'jspdf';

// Invoice interfaces and types
export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  vatRate: number;
  vatAmount: number;
  serviceType?: string;
  officialFee?: number;
  serviceFee?: number;
}

export interface Invoice {
  id?: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber?: string;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    postalCode: string;
    city: string;
    companyName?: string;
    orgNumber?: string;
  };
  lineItems: InvoiceLineItem[];
  subtotal: number;
  vatTotal: number;
  totalAmount: number;
  currency: 'SEK';
  issueDate: Timestamp;
  dueDate: Timestamp;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'credit_note';
  paymentTerms: string;
  paymentReference: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Company information
  companyInfo: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    orgNumber: string;
    vatNumber: string;
    phone: string;
    email: string;
  };
}

const INVOICES_COLLECTION = 'invoices';
const COUNTERS_COLLECTION = 'counters';

// Swedish VAT rates (as of 2024)
const VAT_RATES = {
  STANDARD: 0.25, // 25% for most services
  REDUCED: 0.12,  // 12% for some services (not applicable here)
  ZERO: 0.00      // 0% for exports (not applicable here)
} as const;

// Company information for invoices
const COMPANY_INFO = {
  name: 'Legaliseringstjänst AB',
  address: 'Sveavägen 100',
  postalCode: '113 50',
  city: 'Stockholm',
  orgNumber: '556123-4567',
  vatNumber: 'SE556123456701',
  phone: '070-123 45 67',
  email: 'info@legaliseringstjanst.se'
};

// Generate unique invoice number
export async function generateInvoiceNumber(): Promise<string> {
  try {
    // Get the current count from the invoices collection
    const snapshot = await getCountFromServer(collection(db, INVOICES_COLLECTION));
    const count = snapshot.data().count;

    // Start from 1 if no invoices exist, otherwise use count + 1
    const nextNumber = count > 0 ? count + 1 : 1;

    // Update the counter document
    await setDoc(doc(db, COUNTERS_COLLECTION, 'invoices'), {
      currentCount: nextNumber,
      lastUpdated: Timestamp.now()
    }, { merge: true });

    // Format as INV-YYYY-NNNNNN (e.g., INV-2024-000001)
    const year = new Date().getFullYear();
    const paddedNumber = nextNumber.toString().padStart(6, '0');

    return `INV-${year}-${paddedNumber}`;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    // Fallback to timestamp-based number if counter fails
    const timestamp = Date.now().toString().slice(-8);
    return `INV-${new Date().getFullYear()}-${timestamp}`;
  }
}

// Calculate VAT for Swedish compliance
function calculateVAT(amount: number, vatRate: number = VAT_RATES.STANDARD): { vatAmount: number; totalWithVAT: number } {
  const vatAmount = Math.round(amount * vatRate * 100) / 100; // Round to 2 decimal places
  const totalWithVAT = Math.round((amount + vatAmount) * 100) / 100;

  return { vatAmount, totalWithVAT };
}

// Create line items from order services using consistent pricing logic
async function createLineItemsFromOrder(order: Order): Promise<InvoiceLineItem[]> {
  const lineItems: InvoiceLineItem[] = [];

  try {
    // Use consistent pricing logic matching order summary and order submission
    for (const serviceId of order.services) {
      try {
        // Try to get pricing rule from Firebase (same logic as order submission)
        const { getPricingRule } = await import('@/firebase/pricingService');
        let pricingRule = await getPricingRule(order.country, serviceId);

        // If not found, try SE standard pricing (same as loadAvailableServices)
        if (!pricingRule) {
          pricingRule = await getPricingRule('SE', serviceId);
        }

        if (pricingRule) {
          const isEmbassyService = serviceId === 'embassy' || serviceId === 'ambassad';

          if (isEmbassyService && pricingRule.officialFee && pricingRule.serviceFee) {
            // Official fee line item (0% VAT)
            const officialFeeTotal = pricingRule.officialFee * order.quantity;
            const { vatAmount: officialVatAmount, totalWithVAT: officialTotalWithVAT } = calculateVAT(officialFeeTotal, VAT_RATES.ZERO);

            lineItems.push({
              id: `${serviceId}_official_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              description: `${getServiceDescription(serviceId, order)} - Officiell avgift`,
              quantity: order.quantity,
              unitPrice: pricingRule.officialFee,
              totalPrice: officialTotalWithVAT,
              vatRate: VAT_RATES.ZERO,
              vatAmount: officialVatAmount,
              serviceType: serviceId,
              officialFee: pricingRule.officialFee
            });

            // Service fee line item (25% VAT) - Fixed fee per service, not per document
            const serviceFeeTotal = pricingRule.serviceFee;
            const { vatAmount: serviceVatAmount, totalWithVAT: serviceTotalWithVAT } = calculateVAT(serviceFeeTotal, VAT_RATES.STANDARD);

            lineItems.push({
              id: `${serviceId}_service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              description: `${getServiceDescription(serviceId, order)} - Serviceavgift`,
              quantity: 1,
              unitPrice: pricingRule.serviceFee,
              totalPrice: serviceTotalWithVAT,
              vatRate: VAT_RATES.STANDARD,
              vatAmount: serviceVatAmount,
              serviceType: serviceId,
              serviceFee: pricingRule.serviceFee
            });
          } else if (pricingRule.officialFee && pricingRule.serviceFee) {
            // For other services with separate fees
            // Official fee line item (0% VAT)
            const officialFeeTotal = pricingRule.officialFee * order.quantity;
            const { vatAmount: officialVatAmount, totalWithVAT: officialTotalWithVAT } = calculateVAT(officialFeeTotal, VAT_RATES.ZERO);

            lineItems.push({
              id: `${serviceId}_official_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              description: `${getServiceDescription(serviceId, order)} - Officiell avgift`,
              quantity: order.quantity,
              unitPrice: pricingRule.officialFee,
              totalPrice: officialTotalWithVAT,
              vatRate: VAT_RATES.ZERO,
              vatAmount: officialVatAmount,
              serviceType: serviceId,
              officialFee: pricingRule.officialFee
            });

            // Service fee line item (25% VAT) - Fixed fee per service, not per document
            const serviceFeeTotal = pricingRule.serviceFee;
            const { vatAmount: serviceVatAmount, totalWithVAT: serviceTotalWithVAT } = calculateVAT(serviceFeeTotal, VAT_RATES.STANDARD);

            lineItems.push({
              id: `${serviceId}_service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              description: `${getServiceDescription(serviceId, order)} - Serviceavgift`,
              quantity: 1,
              unitPrice: pricingRule.serviceFee,
              totalPrice: serviceTotalWithVAT,
              vatRate: VAT_RATES.STANDARD,
              vatAmount: serviceVatAmount,
              serviceType: serviceId,
              serviceFee: pricingRule.serviceFee
            });
          } else {
            // Use total base price for services without separate fees
            const servicePrice = pricingRule.basePrice;
            const vatRate = VAT_RATES.STANDARD;
            const { vatAmount, totalWithVAT } = calculateVAT(servicePrice * order.quantity, vatRate);

            lineItems.push({
              id: `${serviceId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              description: getServiceDescription(serviceId, order),
              quantity: order.quantity,
              unitPrice: servicePrice,
              totalPrice: totalWithVAT,
              vatRate,
              vatAmount,
              serviceType: serviceId
            });
          }
        } else {
          // Fallback to hardcoded prices if Firebase pricing not available
          const servicePrice = getServicePrice(serviceId);
          const vatRate = VAT_RATES.STANDARD;
          const { vatAmount, totalWithVAT } = calculateVAT(servicePrice * order.quantity, vatRate);

          lineItems.push({
            id: `${serviceId}_fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            description: getServiceDescription(serviceId, order),
            quantity: order.quantity,
            unitPrice: servicePrice,
            totalPrice: totalWithVAT,
            vatRate,
            vatAmount,
            serviceType: serviceId
          });
        }
      } catch (error) {
        console.error(`Error getting pricing for service ${serviceId}:`, error);
        // Ultimate fallback to hardcoded prices
        const servicePrice = getServicePrice(serviceId);
        const { vatAmount, totalWithVAT } = calculateVAT(servicePrice * order.quantity);

        lineItems.push({
          id: `${serviceId}_error_fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          description: getServiceDescription(serviceId, order),
          quantity: order.quantity,
          unitPrice: servicePrice,
          totalPrice: totalWithVAT,
          vatRate: VAT_RATES.STANDARD,
          vatAmount,
          serviceType: serviceId
        });
      }
    }

    // Add additional services (scanned copies and pickup service)
    if (order.scannedCopies) {
      const scannedCopiesPrice = 200 * order.quantity; // 200 kr per document
      const { vatAmount: scannedVatAmount, totalWithVAT: scannedTotalWithVAT } = calculateVAT(scannedCopiesPrice, VAT_RATES.STANDARD);

      lineItems.push({
        id: `scanned_copies_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        description: 'Skannade kopior',
        quantity: order.quantity,
        unitPrice: 200,
        totalPrice: scannedTotalWithVAT,
        vatRate: VAT_RATES.STANDARD,
        vatAmount: scannedVatAmount,
        serviceType: 'scanned_copies'
      });
    }

    if (order.pickupService) {
      const pickupPrice = 450; // Fixed pickup service price
      const { vatAmount: pickupVatAmount, totalWithVAT: pickupTotalWithVAT } = calculateVAT(pickupPrice, VAT_RATES.STANDARD);

      lineItems.push({
        id: `pickup_service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        description: 'Dokumenthämtning',
        quantity: 1,
        unitPrice: pickupPrice,
        totalPrice: pickupTotalWithVAT,
        vatRate: VAT_RATES.STANDARD,
        vatAmount: pickupVatAmount,
        serviceType: 'pickup_service'
      });
    }

  } catch (error) {
    console.error('Error creating line items from order:', error);
    // Fallback to basic line items
    for (const service of order.services) {
      const servicePrice = getServicePrice(service);
      const { vatAmount, totalWithVAT } = calculateVAT(servicePrice * order.quantity);

      lineItems.push({
        id: `${service}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        description: getServiceDescription(service, order),
        quantity: order.quantity,
        unitPrice: servicePrice,
        totalPrice: totalWithVAT,
        vatRate: VAT_RATES.STANDARD,
        vatAmount,
        serviceType: service
      });
    }
  }

  return lineItems;
}

// Helper function to get service description
function getServiceDescription(serviceType: string, order: Order): string {
  const descriptions: { [key: string]: string } = {
    'apostille': 'Apostille',
    'notarisering': 'Notarisering',
    'ambassad': 'Ambassadlegalisering',
    'oversattning': 'Översättning',
    'utrikesdepartementet': 'Utrikesdepartementet',
    'chamber': 'Handelskammarintyg',
    'express': 'Expresstillägg',
    'return_service': 'Returfrakt',
    'scanned_copies': 'Skannade kopior',
    'pickup_service': 'Upphämtningstjänst'
  };

  return descriptions[serviceType] || serviceType;
}

// Helper function to get service price (fallback)
function getServicePrice(serviceType: string): number {
  const prices: { [key: string]: number } = {
    'apostille': 895,
    'notarisering': 1300,
    'ambassad': 1650,
    'oversattning': 1450,
    'utrikesdepartementet': 1750,
    'chamber': 2400
  };

  return prices[serviceType] || 1000;
}

// Function to generate invoice HTML from Invoice object
export const generateInvoiceHtml = (invoice: Invoice): string => {
  // Format date
  const formatDate = (timestamp: Timestamp | Date) => {
    if (!timestamp) return 'N/A';

    const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;

    return new Intl.DateTimeFormat('sv-SE', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    }).format(date);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format line items
  const formatLineItems = () => {
    return invoice.lineItems.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.description}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.unitPrice)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${item.vatRate * 100}%</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.totalPrice)}</td>
      </tr>
    `).join('');
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Faktura - ${invoice.invoiceNumber}</title>
      <style>
        body {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          line-height: 1.5;
          color: #1f2937;
          margin: 0;
          padding: 20px;
          background-color: #f9fafb;
        }
        .invoice-box {
          max-width: 800px;
          margin: auto;
          padding: 30px;
          background: white;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
        }
        .invoice-header {
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
          color: white;
          padding: 30px;
          margin: -30px -30px 30px -30px;
          border-radius: 8px 8px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .invoice-header h1 {
          color: white;
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .company-info, .invoice-info {
          flex: 1;
        }
        .company-info {
          padding-right: 20px;
        }
        .invoice-info {
          text-align: right;
        }
        .invoice-info h2 {
          color: #2a67aa;
          margin: 0 0 10px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 25px 0;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        th {
          padding: 14px 12px;
          text-align: left;
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
          color: white;
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
          background-color: white;
        }
        tr:nth-child(even) td {
          background-color: #f9fafb;
        }
        .text-right {
          text-align: right;
        }
        .text-center {
          text-align: center;
        }
        .total-row {
          font-weight: bold;
          background-color: #f8f9fa;
          border-top: 2px solid #dee2e6;
        }
        .summary-table {
          width: 320px;
          margin-left: auto;
          margin-top: 25px;
          border: 2px solid #0ea5e9;
          border-radius: 8px;
          overflow: hidden;
        }
        .summary-table td {
          padding: 10px 15px;
          background-color: white;
        }
        .summary-table .total-row {
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
          color: white;
          font-weight: bold;
          font-size: 14px;
        }
        .footer {
          margin-top: 40px;
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
          color: white;
          padding: 25px;
          text-align: center;
          border-radius: 0 0 8px 8px;
        }
        .payment-info {
          background-color: #f8f9fa;
          padding: 20px;
          margin: 20px 0;
          border-radius: 5px;
        }
        .vat-info {
          font-size: 11px;
          color: #6c757d;
          margin-top: 10px;
        }
        .vat-breakdown {
          background-color: #f8f9fa;
          padding: 15px;
          margin: 15px 0;
          border-radius: 6px;
          border-left: 4px solid #0ea5e9;
        }
        .vat-breakdown h4 {
          margin: 0 0 10px 0;
          color: #1f2937;
          font-size: 14px;
        }
        .vat-breakdown ul {
          margin: 0;
          padding-left: 20px;
        }
        .vat-breakdown li {
          margin-bottom: 5px;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="invoice-box">
        <div class="invoice-header">
          <div class="company-info">
            <h1>${invoice.companyInfo.name}</h1>
            <p>
              ${invoice.companyInfo.address}<br>
              ${invoice.companyInfo.postalCode} ${invoice.companyInfo.city}<br>
              ${invoice.companyInfo.email}<br>
              ${invoice.companyInfo.phone}<br>
              Org.nr: ${invoice.companyInfo.orgNumber}<br>
              Momsreg.nr: ${invoice.companyInfo.vatNumber}
            </p>
          </div>
          <div class="invoice-info">
            <h2>FAKTURA</h2>
            <p>
              <strong>Fakturanummer:</strong> ${invoice.invoiceNumber}<br>
              <strong>Fakturadatum:</strong> ${formatDate(invoice.issueDate)}<br>
              <strong>Förfallodatum:</strong> ${formatDate(invoice.dueDate)}<br>
              ${invoice.orderNumber ? `<strong>Ordernummer:</strong> ${invoice.orderNumber}<br>` : ''}
              <strong>Status:</strong> ${getStatusText(invoice.status)}
            </p>
          </div>
        </div>

        <div class="customer-info">
          <h3>Faktureras till:</h3>
          <p>
            ${invoice.customerInfo.firstName} ${invoice.customerInfo.lastName}<br>
            ${invoice.customerInfo.companyName ? `${invoice.customerInfo.companyName}<br>` : ''}
            ${invoice.customerInfo.address}<br>
            ${invoice.customerInfo.postalCode} ${invoice.customerInfo.city}<br>
            ${invoice.customerInfo.email}<br>
            ${invoice.customerInfo.phone}
            ${invoice.customerInfo.orgNumber ? `<br>Org.nr: ${invoice.customerInfo.orgNumber}` : ''}
          </p>
        </div>

        <h3>Tjänster</h3>
        <table>
          <thead>
            <tr>
              <th>Beskrivning</th>
              <th class="text-center">Antal</th>
              <th class="text-right">À-pris</th>
              <th class="text-right">Moms %</th>
              <th class="text-right">Totalt</th>
            </tr>
          </thead>
          <tbody>
            ${formatLineItems()}
          </tbody>
        </table>

        <table class="summary-table">
          <tr>
            <td><strong>Nettosumma:</strong></td>
            <td class="text-right">${formatCurrency(invoice.subtotal - invoice.vatTotal)}</td>
          </tr>
          <tr>
            <td><strong>Moms:</strong></td>
            <td class="text-right">${formatCurrency(invoice.vatTotal)}</td>
          </tr>
          <tr class="total-row">
            <td><strong>Att betala:</strong></td>
            <td class="text-right"><strong>${formatCurrency(invoice.totalAmount)}</strong></td>
          </tr>
        </table>

        <div class="vat-breakdown">
          <h4>Momsinformation</h4>
          <p>Momsregistreringsnummer: ${invoice.companyInfo.vatNumber}</p>
          <ul>
            ${
              (() => {
                const vatBreakdown = invoice.lineItems.reduce((acc, item) => {
                  const rate = item.vatRate;
                  if (!acc[rate]) {
                    acc[rate] = { amount: 0, description: '' };
                  }
                  acc[rate].amount += item.vatAmount;
                  return acc;
                }, {} as Record<number, { amount: number; description: string }>);

                // Set descriptions based on VAT rate
                Object.keys(vatBreakdown).forEach(rate => {
                  const rateNum = parseFloat(rate);
                  if (rateNum === 0) {
                    vatBreakdown[rateNum].description = 'Ambassadlegalisering - officiella avgifter (momsfri)';
                  } else if (rateNum === 0.25) {
                    vatBreakdown[rateNum].description = 'Serviceavgifter och andra tjänster (25% moms)';
                  }
                });

                return Object.entries(vatBreakdown)
                  .map(([rate, data]) => `<li>${data.description}: ${formatCurrency(data.amount)} (${(parseFloat(rate) * 100).toFixed(0)}%)</li>`)
                  .join('');
              })()
            }
          </ul>
        </div>

        <div class="payment-info">
          <h3>Betalningsinformation</h3>
          <p>
            <strong>Betalningsvillkor:</strong> ${invoice.paymentTerms}<br>
            <strong>Bankgiro:</strong> 123-4567<br>
            <strong>OCR-referens:</strong> ${invoice.paymentReference}<br>
            <strong>Förfallodatum:</strong> ${formatDate(invoice.dueDate)}<br>
            <strong>Valuta:</strong> ${invoice.currency}
          </p>
        </div>

        <div class="footer">
          <p>${invoice.companyInfo.name} | Org.nr: ${invoice.companyInfo.orgNumber} | Momsreg.nr: ${invoice.companyInfo.vatNumber}</p>
          <p>Tack för att du valde Legaliseringstjänst! Vid frågor, kontakta oss på ${invoice.companyInfo.email}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Helper function to get status text in Swedish
function getStatusText(status: Invoice['status']): string {
  const statusMap: { [key in Invoice['status']]: string } = {
    'draft': 'Utkast',
    'sent': 'Skickad',
    'paid': 'Betald',
    'overdue': 'Förfallen',
    'cancelled': 'Makulerad',
    'credit_note': 'Kreditfaktura'
  };
  return statusMap[status] || status;
}

// Generate PDF invoice using jsPDF - Professional Swedish layout with proper table handling
export const generateInvoicePDF = async (invoice: Invoice): Promise<void> => {
  try {
    console.log('Generating PDF for invoice:', invoice.invoiceNumber);
    const doc = new jsPDF();

    // Professional Swedish invoice colors
    const primaryColor: [number, number, number] = [42, 103, 170]; // #2a67aa (professional blue)
    const textColor: [number, number, number] = [51, 51, 51]; // #333
    const lightGray: [number, number, number] = [248, 249, 250]; // #f8f9fa
    const borderColor: [number, number, number] = [229, 231, 235]; // #e5e7eb

    // Helper functions
    const formatDate = (timestamp: any) => {
      if (!timestamp) return 'N/A';
      try {
        let date: Date;
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
          date = timestamp.toDate();
        } else if (timestamp instanceof Date) {
          date = timestamp;
        } else {
          date = new Date(timestamp);
        }
        if (isNaN(date.getTime())) return 'N/A';
        return new Intl.DateTimeFormat('sv-SE', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric'
        }).format(date);
      } catch (error) {
        console.error('Error formatting date in PDF:', error, timestamp);
        return 'N/A';
      }
    };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('sv-SE', {
        style: 'currency',
        currency: 'SEK',
        minimumFractionDigits: 2
      }).format(amount);
    };

    let yPosition = 20;

    // Header - Professional Swedish invoice style
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 35, 'F');

    // Company name and details
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.companyInfo.name, 20, 20);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.companyInfo.address, 20, 26);
    doc.text(`${invoice.companyInfo.postalCode} ${invoice.companyInfo.city}`, 20, 30);
    doc.text(`Org.nr: ${invoice.companyInfo.orgNumber}`, 20, 34);

    // Invoice title and number - right aligned
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.status === 'credit_note' ? 'KREDITFAKTURA' : 'FAKTURA', 190, 20, { align: 'right' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fakturanummer: ${invoice.invoiceNumber}`, 190, 26, { align: 'right' });
    doc.text(`Fakturadatum: ${formatDate(invoice.issueDate)}`, 190, 30, { align: 'right' });
    doc.text(`Förfallodatum: ${formatDate(invoice.dueDate)}`, 190, 34, { align: 'right' });

    yPosition = 50;

    // Customer information section
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Faktureras till:', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${invoice.customerInfo.firstName} ${invoice.customerInfo.lastName}`, 20, yPosition);
    yPosition += 4;

    if (invoice.customerInfo.companyName) {
      doc.setFont('helvetica', 'bold');
      doc.text(invoice.customerInfo.companyName, 20, yPosition);
      doc.setFont('helvetica', 'normal');
      yPosition += 4;
    }

    doc.text(invoice.customerInfo.address, 20, yPosition);
    yPosition += 4;
    doc.text(`${invoice.customerInfo.postalCode} ${invoice.customerInfo.city}`, 20, yPosition);
    yPosition += 4;
    doc.text(invoice.customerInfo.email, 20, yPosition);
    yPosition += 4;
    doc.text(invoice.customerInfo.phone, 20, yPosition);

    if (invoice.customerInfo.orgNumber) {
      yPosition += 4;
      doc.setFontSize(8);
      doc.text(`Org.nr: ${invoice.customerInfo.orgNumber}`, 20, yPosition);
    }

    yPosition += 15;

    // Services table header
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Specifikation', 20, yPosition);
    yPosition += 10;

    // Table headers with borders - fixed column widths
    const tableLeft = 20;
    const tableWidth = 170;
    const colWidths = [75, 20, 25, 20, 30]; // Description, Quantity, Unit Price, VAT %, Total
    const colPositions = [
      tableLeft + 2,
      tableLeft + colWidths[0] + 2,
      tableLeft + colWidths[0] + colWidths[1] + 2,
      tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 2,
      tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2
    ];

    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(tableLeft, yPosition - 3, tableWidth, 8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');

    // Column headers - properly aligned
    doc.text('Beskrivning', colPositions[0], yPosition + 2);
    doc.text('Antal', colPositions[1], yPosition + 2, { align: 'center' });
    doc.text('À-pris', colPositions[2], yPosition + 2, { align: 'right' });
    doc.text('Moms %', colPositions[3], yPosition + 2, { align: 'center' });
    doc.text('Belopp', colPositions[4], yPosition + 2, { align: 'right' });

    yPosition += 10;

    // Table rows - proper row-by-row rendering
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    const rowHeight = 8;
    let currentY = yPosition;

    invoice.lineItems.forEach((item, index) => {
      // Check if we need a new page
      if (currentY + rowHeight > 250) {
        doc.addPage();
        currentY = 20;

        // Re-add table header on new page
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(tableLeft, currentY - 3, tableWidth, 8, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');

        doc.text('Beskrivning', colPositions[0], currentY + 2);
        doc.text('Antal', colPositions[1], currentY + 2, { align: 'center' });
        doc.text('À-pris', colPositions[2], currentY + 2, { align: 'right' });
        doc.text('Moms %', colPositions[3], currentY + 2, { align: 'center' });
        doc.text('Belopp', colPositions[4], currentY + 2, { align: 'right' });

        currentY += 10;
      }

      // Alternate row background
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(tableLeft, currentY - 2, tableWidth, rowHeight, 'F');
      }

      // Border around row
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setLineWidth(0.2);
      doc.rect(tableLeft, currentY - 2, tableWidth, rowHeight);

      // Description - handle long text properly with word wrapping
      const description = item.description;
      const maxDescWidth = colWidths[0] - 4;

      if (doc.getTextWidth(description) > maxDescWidth) {
        // Split description into multiple lines
        const words = description.split(' ');
        let currentLine = '';
        let lines: string[] = [];

        for (const word of words) {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          if (doc.getTextWidth(testLine) > maxDescWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);

        // Display first line
        doc.text(lines[0], colPositions[0], currentY + 2);

        // If there are more lines, display them (but limit to prevent overflow)
        if (lines.length > 1) {
          doc.text(lines[1], colPositions[0], currentY + 5);
        }
      } else {
        doc.text(description, colPositions[0], currentY + 2);
      }

      // Quantity - center aligned
      doc.text(item.quantity.toString(), colPositions[1] + colWidths[1]/2, currentY + 2, { align: 'center' });

      // Unit price - right aligned
      doc.text(formatCurrency(item.unitPrice), colPositions[2] + colWidths[2] - 2, currentY + 2, { align: 'right' });

      // VAT rate - center aligned
      doc.text(`${(item.vatRate * 100).toFixed(0)}%`, colPositions[3] + colWidths[3]/2, currentY + 2, { align: 'center' });

      // Total price - right aligned
      doc.text(formatCurrency(item.totalPrice), colPositions[4] + colWidths[4] - 2, currentY + 2, { align: 'right' });

      currentY += rowHeight;
    });

    yPosition = currentY + 10;

    // Totals section - professional layout
    const totalsStartX = 120;

    // Draw totals box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.rect(totalsStartX - 5, yPosition - 3, 75, 25, 'F');
    doc.rect(totalsStartX - 5, yPosition - 3, 75, 25);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    // Calculate and display totals
    const netAmount = invoice.subtotal - invoice.vatTotal;

    doc.text('Nettosumma:', totalsStartX, yPosition + 2);
    doc.text(formatCurrency(netAmount), 185, yPosition + 2, { align: 'right' });

    if (invoice.vatTotal > 0) {
      yPosition += 6;
      doc.text(`Moms (${VAT_RATES.STANDARD * 100}%):`, totalsStartX, yPosition + 2);
      doc.text(formatCurrency(invoice.vatTotal), 185, yPosition + 2, { align: 'right' });
    }

    // Total amount - highlighted
    yPosition += 8;
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(totalsStartX - 5, yPosition - 1, 75, 8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('ATT BETALA:', totalsStartX, yPosition + 4);
    doc.text(formatCurrency(invoice.totalAmount), 185, yPosition + 4, { align: 'right' });

    yPosition += 20;

    // VAT information section
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    doc.text(`Momsregistreringsnummer: ${invoice.companyInfo.vatNumber}`, 20, yPosition);
    yPosition += 8;

    // VAT breakdown based on services
    const hasZeroVat = invoice.lineItems.some(item => item.vatRate === 0);
    const hasStandardVat = invoice.lineItems.some(item => item.vatRate > 0);

    if (hasZeroVat && hasStandardVat) {
      doc.text('Momssats: 25% på serviceavgifter, 0% på officiella avgifter (ambassadlegalisering)', 20, yPosition);
    } else if (hasZeroVat) {
      doc.text('Momssats: 0% (ambassadlegalisering är momsfri)', 20, yPosition);
    } else {
      doc.text('Momssats: 25% på samtliga tjänster', 20, yPosition);
    }

    yPosition += 12;

    // Payment information
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Betalningsinformation', 20, yPosition);
    yPosition += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Betalningsvillkor: ${invoice.paymentTerms}`, 20, yPosition);
    yPosition += 4;
    doc.text('Bankgiro: 123-4567', 20, yPosition);
    yPosition += 4;
    doc.text(`OCR-referens: ${invoice.paymentReference}`, 20, yPosition);
    yPosition += 4;
    doc.text(`Förfallodatum: ${formatDate(invoice.dueDate)}`, 20, yPosition);
    yPosition += 4;
    doc.text(`Valuta: ${invoice.currency}`, 20, yPosition);

    yPosition += 15;

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    const footerY = pageHeight - 25;

    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, footerY - 5, 210, 25, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');

    const footerText1 = `${invoice.companyInfo.name} | Org.nr: ${invoice.companyInfo.orgNumber} | Momsreg.nr: ${invoice.companyInfo.vatNumber}`;
    doc.text(footerText1, 105, footerY + 3, { align: 'center' });

    const footerText2 = `${invoice.companyInfo.address}, ${invoice.companyInfo.postalCode} ${invoice.companyInfo.city} | ${invoice.companyInfo.email} | ${invoice.companyInfo.phone}`;
    doc.text(footerText2, 105, footerY + 8, { align: 'center' });

    doc.setFontSize(8);
    doc.text('Tack för att du valde Legaliseringstjänst AB för dina legaliseringstjänster!', 105, footerY + 15, { align: 'center' });

    // Save the PDF
    const fileName = invoice.orderNumber ? `faktura-${invoice.orderNumber}.pdf` : `faktura-${invoice.invoiceNumber}.pdf`;
    doc.save(fileName);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

// Main function to convert order to invoice
export const convertOrderToInvoice = async (order: Order): Promise<Invoice> => {
  try {
    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Create line items from order
    const lineItems = await createLineItemsFromOrder(order);

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const vatTotal = lineItems.reduce((sum, item) => sum + item.vatAmount, 0);
    const totalAmount = subtotal;

    // Set due date (30 days from now for Swedish standard)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Create invoice object
    const invoice: Invoice = {
      invoiceNumber,
      orderId: order.id || '',
      orderNumber: order.orderNumber,
      customerInfo: order.customerInfo,
      lineItems,
      subtotal,
      vatTotal,
      totalAmount,
      currency: 'SEK',
      issueDate: Timestamp.now(),
      dueDate: Timestamp.fromDate(dueDate),
      status: 'draft',
      paymentTerms: 'Betalning inom 30 dagar',
      paymentReference: invoiceNumber,
      companyInfo: COMPANY_INFO,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    return invoice;
  } catch (error) {
    console.error('Error converting order to invoice:', error);
    throw error;
  }
};

// Store invoice in Firebase with fallback to mock storage
export const storeInvoice = async (invoice: Invoice): Promise<string> => {
  try {
    // Try to store in Firebase first
    const docRef = await addDoc(collection(db, INVOICES_COLLECTION), {
      ...invoice,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    console.log('Invoice stored in Firebase with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error storing invoice in Firebase:', error);

    // Fallback to mock storage
    try {
      const mockInvoices = getMockInvoices();
      const invoiceWithId = { ...invoice, id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` };
      mockInvoices.push(invoiceWithId);

      // Store in localStorage for persistence
      localStorage.setItem('mock_invoices', JSON.stringify(mockInvoices));

      console.log('Invoice stored in mock storage with ID:', invoiceWithId.id);
      return invoiceWithId.id!;
    } catch (mockError) {
      console.error('Error storing invoice in mock storage:', mockError);
      throw mockError;
    }
  }
};

// Get all invoices
export const getAllInvoices = async (): Promise<Invoice[]> => {
  try {
    const invoicesQuery = query(
      collection(db, INVOICES_COLLECTION),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(invoicesQuery);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Invoice));
  } catch (error) {
    console.error('Error getting invoices from Firebase:', error);

    // Fallback to mock data
    console.log('🔄 Using mock invoice data due to Firebase connection issues');
    return getMockInvoices();
  }
};

// Get invoice by ID
export const getInvoiceById = async (invoiceId: string): Promise<Invoice | null> => {
  try {
    const docRef = doc(db, INVOICES_COLLECTION, invoiceId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Invoice;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting invoice by ID from Firebase:', error);

    // Fallback to mock data
    const mockInvoices = getMockInvoices();
    return mockInvoices.find(inv => inv.id === invoiceId) || null;
  }
};

// Get invoices by order ID
export const getInvoicesByOrderId = async (orderId: string): Promise<Invoice[]> => {
  try {
    const invoicesQuery = query(
      collection(db, INVOICES_COLLECTION),
      where('orderId', '==', orderId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(invoicesQuery);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Invoice));
  } catch (error) {
    console.error('Error getting invoices by order ID from Firebase:', error);

    // Fallback to mock data
    const mockInvoices = getMockInvoices();
    return mockInvoices.filter(inv => inv.orderId === orderId);
  }
};

// Update invoice status
export const updateInvoiceStatus = async (invoiceId: string, status: Invoice['status']): Promise<void> => {
  try {
    const docRef = doc(db, INVOICES_COLLECTION, invoiceId);

    await updateDoc(docRef, {
      status,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating invoice status in Firebase:', error);

    // Fallback to mock update
    const mockInvoices = getMockInvoices();
    const invoiceIndex = mockInvoices.findIndex(inv => inv.id === invoiceId);

    if (invoiceIndex !== -1) {
      mockInvoices[invoiceIndex].status = status;
      mockInvoices[invoiceIndex].updatedAt = Timestamp.now();
      localStorage.setItem('mock_invoices', JSON.stringify(mockInvoices));
    } else {
      throw new Error(`Invoice ${invoiceId} not found in mock storage`);
    }
  }
};

// Mock storage functions
function getMockInvoices(): Invoice[] {
  try {
    const stored = localStorage.getItem('mock_invoices');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert date strings back to Timestamps
      return parsed.map((inv: any) => ({
        ...inv,
        issueDate: inv.issueDate instanceof Timestamp ? inv.issueDate : Timestamp.fromDate(new Date(inv.issueDate)),
        dueDate: inv.dueDate instanceof Timestamp ? inv.dueDate : Timestamp.fromDate(new Date(inv.dueDate)),
        createdAt: inv.createdAt instanceof Timestamp ? inv.createdAt : Timestamp.fromDate(new Date(inv.createdAt)),
        updatedAt: inv.updatedAt instanceof Timestamp ? inv.updatedAt : Timestamp.fromDate(new Date(inv.updatedAt))
      }));
    }
  } catch (error) {
    console.error('Error parsing mock invoices:', error);
  }

  return [];
}

// Create credit invoice from existing invoice
export const createCreditInvoice = async (originalInvoiceId: string, creditAmount?: number): Promise<Invoice | null> => {
  try {
    // Get the original invoice
    const originalInvoice = await getInvoiceById(originalInvoiceId);
    if (!originalInvoice) {
      throw new Error('Original invoice not found');
    }

    // Generate new invoice number for credit note
    const invoiceNumber = await generateInvoiceNumber();

    // Create credit invoice with negative amounts
    const creditAmountToUse = creditAmount || originalInvoice.totalAmount;

    const creditInvoice: Invoice = {
      invoiceNumber,
      orderId: originalInvoice.orderId,
      orderNumber: originalInvoice.orderNumber,
      customerInfo: originalInvoice.customerInfo,
      lineItems: originalInvoice.lineItems.map(item => ({
        ...item,
        totalPrice: -Math.abs(item.totalPrice), // Make negative
        vatAmount: -Math.abs(item.vatAmount), // Make negative
        id: `${item.id}_credit_${Date.now()}`
      })),
      subtotal: -Math.abs(originalInvoice.subtotal),
      vatTotal: -Math.abs(originalInvoice.vatTotal),
      totalAmount: -Math.abs(creditAmountToUse),
      currency: originalInvoice.currency,
      issueDate: Timestamp.now(),
      dueDate: Timestamp.now(), // Credit notes are typically due immediately
      status: 'credit_note',
      paymentTerms: 'Kreditfaktura - ingen betalning krävs',
      paymentReference: invoiceNumber,
      companyInfo: originalInvoice.companyInfo,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      notes: `Kreditfaktura för faktura ${originalInvoice.invoiceNumber}`
    };

    // Store the credit invoice
    const creditInvoiceId = await storeInvoice(creditInvoice);

    // Update the credit invoice with its ID
    creditInvoice.id = creditInvoiceId;

    return creditInvoice;
  } catch (error) {
    console.error('Error creating credit invoice:', error);
    throw error;
  }
};

// Function to send invoice via email
export const sendInvoiceEmail = async (invoice: Invoice): Promise<boolean> => {
  try {
    // Generate PDF for attachment
    const pdfBlob = await generateInvoicePDFBlob(invoice);

    // Create email data for Firestore (will be processed by external service)
    const emailData = {
      to: invoice.customerInfo.email,
      subject: `Faktura ${invoice.invoiceNumber} från Legaliseringstjänst AB`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2a67aa;">Faktura från Legaliseringstjänst AB</h2>

          <p>Hej ${invoice.customerInfo.firstName} ${invoice.customerInfo.lastName},</p>

          <p>Tack för att du valde Legaliseringstjänst AB för dina legaliseringstjänster.</p>

          <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3 style="margin-top: 0; color: #2a67aa;">Fakturainformation</h3>
            <p><strong>Fakturanummer:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Fakturadatum:</strong> ${invoice.issueDate.toDate().toLocaleDateString('sv-SE')}</p>
            <p><strong>Förfallodatum:</strong> ${invoice.dueDate.toDate().toLocaleDateString('sv-SE')}</p>
            <p><strong>Belopp att betala:</strong> ${invoice.totalAmount} SEK</p>
            <p><strong>Betalningsreferens:</strong> ${invoice.paymentReference}</p>
          </div>

          <p>Fakturan är bifogad som PDF. Vänligen betala enligt betalningsvillkoren.</p>

          <p>Vid frågor, kontakta oss gärna på info@legaliseringstjanst.se eller 070-123 45 67.</p>

          <p>Med vänliga hälsningar,<br/>
          Legaliseringstjänst AB<br/>
          Sveavägen 100<br/>
          113 50 Stockholm<br/>
          Org.nr: 556123-4567<br/>
          Momsreg.nr: SE556123456701</p>
        </div>
      `,
      attachments: [{
        filename: `faktura-${invoice.invoiceNumber}.pdf`,
        content: pdfBlob,
        contentType: 'application/pdf'
      }],
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerEmail: invoice.customerInfo.email,
      createdAt: Timestamp.now(),
      status: 'pending'
    };

    // Store email request in Firestore for processing
    await addDoc(collection(db, 'emailQueue'), emailData);

    console.log(`Invoice email queued for ${invoice.customerInfo.email} with invoice ${invoice.invoiceNumber}`);
    return true;

  } catch (error) {
    console.error('Error queuing invoice email:', error);
    return false;
  }
};

// Helper function to generate PDF blob for email attachment - matches main PDF function
async function generateInvoicePDFBlob(invoice: Invoice): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF();

      // Professional Swedish invoice colors
      const primaryColor: [number, number, number] = [42, 103, 170]; // #2a67aa
      const textColor: [number, number, number] = [51, 51, 51]; // #333
      const lightGray: [number, number, number] = [248, 249, 250]; // #f8f9fa
      const borderColor: [number, number, number] = [229, 231, 235]; // #e5e7eb

      // Helper functions
      const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        try {
          let date: Date;
          if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            date = timestamp.toDate();
          } else if (timestamp instanceof Date) {
            date = timestamp;
          } else {
            date = new Date(timestamp);
          }
          if (isNaN(date.getTime())) return 'N/A';
          return new Intl.DateTimeFormat('sv-SE', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
          }).format(date);
        } catch (error) {
          console.error('Error formatting date in PDF:', error, timestamp);
          return 'N/A';
        }
      };

      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('sv-SE', {
          style: 'currency',
          currency: 'SEK',
          minimumFractionDigits: 2
        }).format(amount);
      };

      let yPosition = 20;

      // Header - Professional Swedish invoice style
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 35, 'F');

      // Company name and details
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(invoice.companyInfo.name, 20, 20);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(invoice.companyInfo.address, 20, 26);
      doc.text(`${invoice.companyInfo.postalCode} ${invoice.companyInfo.city}`, 20, 30);
      doc.text(`Org.nr: ${invoice.companyInfo.orgNumber}`, 20, 34);

      // Invoice title and number - right aligned
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(invoice.status === 'credit_note' ? 'KREDITFAKTURA' : 'FAKTURA', 190, 20, { align: 'right' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fakturanummer: ${invoice.invoiceNumber}`, 190, 26, { align: 'right' });
      doc.text(`Fakturadatum: ${formatDate(invoice.issueDate)}`, 190, 30, { align: 'right' });
      doc.text(`Förfallodatum: ${formatDate(invoice.dueDate)}`, 190, 34, { align: 'right' });

      yPosition = 50;

      // Customer information section
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Faktureras till:', 20, yPosition);
      yPosition += 8;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`${invoice.customerInfo.firstName} ${invoice.customerInfo.lastName}`, 20, yPosition);
      yPosition += 4;

      if (invoice.customerInfo.companyName) {
        doc.setFont('helvetica', 'bold');
        doc.text(invoice.customerInfo.companyName, 20, yPosition);
        doc.setFont('helvetica', 'normal');
        yPosition += 4;
      }

      doc.text(invoice.customerInfo.address, 20, yPosition);
      yPosition += 4;
      doc.text(`${invoice.customerInfo.postalCode} ${invoice.customerInfo.city}`, 20, yPosition);
      yPosition += 4;
      doc.text(invoice.customerInfo.email, 20, yPosition);
      yPosition += 4;
      doc.text(invoice.customerInfo.phone, 20, yPosition);

      if (invoice.customerInfo.orgNumber) {
        yPosition += 4;
        doc.setFontSize(8);
        doc.text(`Org.nr: ${invoice.customerInfo.orgNumber}`, 20, yPosition);
      }

      yPosition += 15;

      // Services table header
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Specifikation', 20, yPosition);
      yPosition += 10;

      // Table headers with borders - fixed column widths
      const tableLeft = 20;
      const tableWidth = 170;
      const colWidths = [75, 20, 25, 20, 30]; // Description, Quantity, Unit Price, VAT %, Total
      const colPositions = [
        tableLeft + 2,
        tableLeft + colWidths[0] + 2,
        tableLeft + colWidths[0] + colWidths[1] + 2,
        tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 2,
        tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2
      ];

      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(tableLeft, yPosition - 3, tableWidth, 8, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');

      // Column headers - properly aligned
      doc.text('Beskrivning', colPositions[0], yPosition + 2);
      doc.text('Antal', colPositions[1], yPosition + 2, { align: 'center' });
      doc.text('À-pris', colPositions[2], yPosition + 2, { align: 'right' });
      doc.text('Moms %', colPositions[3], yPosition + 2, { align: 'center' });
      doc.text('Belopp', colPositions[4], yPosition + 2, { align: 'right' });

      yPosition += 10;

      // Table rows - proper row-by-row rendering
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      const rowHeight = 8;
      let currentY = yPosition;

      invoice.lineItems.forEach((item, index) => {
        // Check if we need a new page
        if (currentY + rowHeight > 250) {
          doc.addPage();
          currentY = 20;

          // Re-add table header on new page
          doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.rect(tableLeft, currentY - 3, tableWidth, 8, 'F');

          doc.setTextColor(255, 255, 255);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');

          doc.text('Beskrivning', colPositions[0], currentY + 2);
          doc.text('Antal', colPositions[1], currentY + 2, { align: 'center' });
          doc.text('À-pris', colPositions[2], currentY + 2, { align: 'right' });
          doc.text('Moms %', colPositions[3], currentY + 2, { align: 'center' });
          doc.text('Belopp', colPositions[4], currentY + 2, { align: 'right' });

          currentY += 10;
        }

        // Alternate row background
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(tableLeft, currentY - 2, tableWidth, rowHeight, 'F');
        }

        // Border around row
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.setLineWidth(0.2);
        doc.rect(tableLeft, currentY - 2, tableWidth, rowHeight);

        // Description - handle long text properly with word wrapping
        const description = item.description;
        const maxDescWidth = colWidths[0] - 4;

        if (doc.getTextWidth(description) > maxDescWidth) {
          // Split description into multiple lines
          const words = description.split(' ');
          let currentLine = '';
          let lines: string[] = [];

          for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            if (doc.getTextWidth(testLine) > maxDescWidth && currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) lines.push(currentLine);

          // Display first line
          doc.text(lines[0], colPositions[0], currentY + 2);

          // If there are more lines, display them (but limit to prevent overflow)
          if (lines.length > 1) {
            doc.text(lines[1], colPositions[0], currentY + 5);
          }
        } else {
          doc.text(description, colPositions[0], currentY + 2);
        }

        // Quantity - center aligned
        doc.text(item.quantity.toString(), colPositions[1] + colWidths[1]/2, currentY + 2, { align: 'center' });

        // Unit price - right aligned
        doc.text(formatCurrency(item.unitPrice), colPositions[2] + colWidths[2] - 2, currentY + 2, { align: 'right' });

        // VAT rate - center aligned
        doc.text(`${(item.vatRate * 100).toFixed(0)}%`, colPositions[3] + colWidths[3]/2, currentY + 2, { align: 'center' });

        // Total price - right aligned
        doc.text(formatCurrency(item.totalPrice), colPositions[4] + colWidths[4] - 2, currentY + 2, { align: 'right' });

        currentY += rowHeight;
      });

      yPosition = currentY + 10;

      // Totals section - professional layout
      const totalsStartX = 120;

      // Draw totals box
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.5);
      doc.rect(totalsStartX - 5, yPosition - 3, 75, 25, 'F');
      doc.rect(totalsStartX - 5, yPosition - 3, 75, 25);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      // Calculate and display totals
      const netAmount = invoice.subtotal - invoice.vatTotal;

      doc.text('Nettosumma:', totalsStartX, yPosition + 2);
      doc.text(formatCurrency(netAmount), 185, yPosition + 2, { align: 'right' });

      if (invoice.vatTotal > 0) {
        yPosition += 6;
        doc.text(`Moms (${VAT_RATES.STANDARD * 100}%):`, totalsStartX, yPosition + 2);
        doc.text(formatCurrency(invoice.vatTotal), 185, yPosition + 2, { align: 'right' });
      }

      // Total amount - highlighted
      yPosition += 8;
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(totalsStartX - 5, yPosition - 1, 75, 8, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('ATT BETALA:', totalsStartX, yPosition + 4);
      doc.text(formatCurrency(invoice.totalAmount), 185, yPosition + 4, { align: 'right' });

      yPosition += 20;

      // VAT information section
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      doc.text(`Momsregistreringsnummer: ${invoice.companyInfo.vatNumber}`, 20, yPosition);
      yPosition += 8;

      // VAT breakdown based on services
      const hasZeroVat = invoice.lineItems.some(item => item.vatRate === 0);
      const hasStandardVat = invoice.lineItems.some(item => item.vatRate > 0);

      if (hasZeroVat && hasStandardVat) {
        doc.text('Momssats: 25% på serviceavgifter, 0% på officiella avgifter (ambassadlegalisering)', 20, yPosition);
      } else if (hasZeroVat) {
        doc.text('Momssats: 0% (ambassadlegalisering är momsfri)', 20, yPosition);
      } else {
        doc.text('Momssats: 25% på samtliga tjänster', 20, yPosition);
      }

      yPosition += 12;

      // Payment information
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Betalningsinformation', 20, yPosition);
      yPosition += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Betalningsvillkor: ${invoice.paymentTerms}`, 20, yPosition);
      yPosition += 4;
      doc.text('Bankgiro: 123-4567', 20, yPosition);
      yPosition += 4;
      doc.text(`OCR-referens: ${invoice.paymentReference}`, 20, yPosition);
      yPosition += 4;
      doc.text(`Förfallodatum: ${formatDate(invoice.dueDate)}`, 20, yPosition);
      yPosition += 4;
      doc.text(`Valuta: ${invoice.currency}`, 20, yPosition);

      yPosition += 15;

      // Footer
      const pageHeight = doc.internal.pageSize.height;
      const footerY = pageHeight - 25;

      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, footerY - 5, 210, 25, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');

      const footerText1 = `${invoice.companyInfo.name} | Org.nr: ${invoice.companyInfo.orgNumber} | Momsreg.nr: ${invoice.companyInfo.vatNumber}`;
      doc.text(footerText1, 105, footerY + 3, { align: 'center' });

      const footerText2 = `${invoice.companyInfo.address}, ${invoice.companyInfo.postalCode} ${invoice.companyInfo.city} | ${invoice.companyInfo.email} | ${invoice.companyInfo.phone}`;
      doc.text(footerText2, 105, footerY + 8, { align: 'center' });

      doc.setFontSize(8);
      doc.text('Tack för att du valde Legaliseringstjänst AB för dina legaliseringstjänster!', 105, footerY + 15, { align: 'center' });

      // Get PDF as Uint8Array
      const pdfOutput = doc.output('arraybuffer');
      resolve(new Uint8Array(pdfOutput));

    } catch (error) {
      reject(error);
    }
  });
}
