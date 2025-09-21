import { Order } from '@/firebase/orderService';

// Function to generate invoice HTML
export const generateInvoiceHtml = (order: Order): string => {
  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return new Intl.DateTimeFormat('sv-SE', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    }).format(date);
  };

  // Calculate due date (14 days from now)
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);
  const formattedDueDate = new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  }).format(dueDate);

  // Format services
  const formatServices = () => {
    if (!order.services) return '';
    
    const services = Array.isArray(order.services) ? order.services : [order.services];
    
    return services.map(service => {
      let serviceName = '';
      let servicePrice = 0;
      
      switch(service) {
        case 'apostille':
          serviceName = 'Apostille';
          servicePrice = 1200;
          break;
        case 'notarisering':
          serviceName = 'Notarisering';
          servicePrice = 800;
          break;
        case 'ambassad':
          serviceName = 'Ambassadlegalisering';
          servicePrice = 1500;
          break;
        case 'oversattning':
          serviceName = 'Översättning';
          servicePrice = 1000;
          break;
        case 'utrikesdepartementet':
          serviceName = 'Utrikesdepartementet';
          servicePrice = 1200;
          break;
        default:
          serviceName = service;
          servicePrice = 0;
      }
      
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${serviceName}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${servicePrice} kr</td>
        </tr>
      `;
    }).join('');
  };

  // Calculate expedited fee if applicable
  const expeditedFee = order.expedited ? 500 : 0;
  
  // Calculate delivery fee based on method
  let deliveryFee = 0;
  switch(order.deliveryMethod) {
    case 'pickup':
      deliveryFee = 0;
      break;
    case 'mail':
      deliveryFee = 100;
      break;
    case 'express':
      deliveryFee = 250;
      break;
    default:
      deliveryFee = 0;
  }

  // Generate invoice number (using order ID and timestamp)
  const invoiceNumber = `INV-${order.id?.substring(0, 6).toUpperCase()}-${Date.now().toString().substring(9, 13)}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Faktura - ${invoiceNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .invoice-box {
          max-width: 800px;
          margin: auto;
          padding: 30px;
          border: 1px solid #eee;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
        }
        .invoice-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .invoice-header h1 {
          color: #2a67aa;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th {
          padding: 12px;
          text-align: left;
          background-color: #f8f9fa;
          border-bottom: 2px solid #ddd;
        }
        .total-row {
          font-weight: bold;
          background-color: #f8f9fa;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #777;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="invoice-box">
        <div class="invoice-header">
          <div>
            <h1>Legaliseringstjänst</h1>
            <p>
              Sveavägen 100<br>
              113 50 Stockholm<br>
              info@legaliseringstjanst.se<br>
              070-123 45 67
            </p>
          </div>
          <div>
            <h2>FAKTURA</h2>
            <p>
              <strong>Fakturanummer:</strong> ${invoiceNumber}<br>
              <strong>Fakturadatum:</strong> ${formatDate(new Date())}<br>
              <strong>Förfallodatum:</strong> ${formattedDueDate}<br>
              <strong>Ordernummer:</strong> ${order.id}
            </p>
          </div>
        </div>
        
        <div class="customer-info">
          <h3>Faktureras till:</h3>
          <p>
            ${order.customerInfo.firstName} ${order.customerInfo.lastName}<br>
            ${order.customerInfo.address}<br>
            ${order.customerInfo.postalCode} ${order.customerInfo.city}<br>
            ${order.customerInfo.email}<br>
            ${order.customerInfo.phone}
          </p>
        </div>
        
        <h3>Tjänster</h3>
        <table>
          <thead>
            <tr>
              <th>Beskrivning</th>
              <th style="text-align: right;">Pris</th>
            </tr>
          </thead>
          <tbody>
            ${formatServices()}
            
            ${order.expedited ? `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee;">Expresstillägg</td>
              <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${expeditedFee} kr</td>
            </tr>
            ` : ''}
            
            ${deliveryFee > 0 ? `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee;">Leveransavgift (${order.deliveryMethod === 'mail' ? 'Post' : 'Express'})</td>
              <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${deliveryFee} kr</td>
            </tr>
            ` : ''}
            
            <tr class="total-row">
              <td style="padding: 12px; border-top: 2px solid #ddd;"><strong>Totalt</strong></td>
              <td style="padding: 12px; border-top: 2px solid #ddd; text-align: right;"><strong>${order.totalPrice} kr</strong></td>
            </tr>
          </tbody>
        </table>
        
        <div style="margin-top: 30px;">
          <h3>Betalningsinformation</h3>
          <p>
            <strong>Bankgiro:</strong> 123-4567<br>
            <strong>Referens:</strong> ${invoiceNumber}<br>
            <strong>Förfallodatum:</strong> ${formattedDueDate}
          </p>
        </div>
        
        <div class="footer">
          <p>Legaliseringstjänst AB | Org.nr: 556123-4567 | Momsreg.nr: SE556123456701</p>
          <p>Tack för att du valde Legaliseringstjänst!</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Function to send invoice via email (mock implementation)
export const sendInvoiceEmail = async (order: Order): Promise<boolean> => {
  try {
    // In a real implementation, you would use an email service like SendGrid, Mailgun, etc.
    // For now, we'll just log that we would send an email
    console.log(`Invoice would be sent to ${order.customerInfo.email} for order ${order.id}`);
    
    // In a real implementation, you would return true only if the email was sent successfully
    return true;
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return false;
  }
};
