const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Initialize Firebase Admin
admin.initializeApp();

// Configure nodemailer transport (now using SMTP, e.g. Microsoft 365)
const transporter = nodemailer.createTransport({
  host: functions.config().email.host || 'smtp.office365.com',
  port: Number(functions.config().email.port) || 587,
  secure: false,
  auth: {
    user: functions.config().email.user, // Set this in Firebase config
    pass: functions.config().email.pass  // Set this in Firebase config
  }
});

// Helper function to update document status
const updateStatus = async (ref, status, error = null) => {
  const updateData = {
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  if (error) {
    updateData.error = error.message || String(error);
  }
  
  return ref.update(updateData);
};

// Cloud Function triggered when a new contact message is created
exports.sendContactEmail = functions.firestore
  .document('contactMessages/{messageId}')
  .onCreate(async (snap, context) => {
    const messageData = snap.data();

    // Email content (allow custom HTML if provided)
    const defaultHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Nytt kontaktmeddelande</h2>

          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Kontaktuppgifter:</h3>
            <p><strong>Namn:</strong> ${messageData.name}</p>
            <p><strong>E-post:</strong> ${messageData.email}</p>
            <p><strong>Telefon:</strong> ${messageData.phone || 'Ej angivet'}</p>
            <p><strong>Ämne:</strong> ${messageData.subject}</p>
          </div>

          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Meddelande:</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${messageData.message || ''}</p>
          </div>

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e;">
              <strong>Skickat:</strong> ${messageData.createdAt?.toDate ? messageData.createdAt.toDate().toLocaleString('sv-SE') : ''}
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #6b7280; font-size: 14px;">
            Detta meddelande skickades från kontaktformuläret på doxvl.se
          </p>
        </div>
      `;
    const htmlBody = messageData.html || defaultHtml;
    const textBody = messageData.text || (messageData.message ? String(messageData.message) : '');
    const mailOptions = {
      from: `"DOX Visumpartner" <${functions.config().email.from || functions.config().email.user}>`,
      to: 'info@doxvl.se,info@visumpartner.se',
      subject: messageData.subject || `Nytt kontaktmeddelande från ${messageData.name}`,
      html: htmlBody,
      text: textBody.replace(/<[^>]*>?/gm, '')
    };

    try {
      // Send email
      await transporter.sendMail(mailOptions);
      console.log('Contact email sent successfully to info@doxvl.se and info@visumpartner.se');

      // Update the message status to 'emailed'
      await snap.ref.update({
        status: 'emailed',
        emailedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return null;
    } catch (error) {
      console.error('Error sending contact email:', error);

      // Update the message status to 'email_failed'
      await snap.ref.update({
        status: 'email_failed',
        emailError: error.message
      });

      throw error;
    }
  });

// Cloud Function triggered when a new customer email needs to be sent
exports.sendCustomerConfirmationEmail = functions.firestore
  .document('customerEmails/{emailId}')
  .onCreate(async (snap, context) => {
    const emailData = snap.data();
    
    // Skip if already processed
    if (emailData.status === 'sent') return null;
    
    try {
      const mailOptions = {
        from: `"DOX Visumpartner" <${functions.config().email.from || functions.config().email.user}>`,
        to: emailData.email,
        subject: emailData.subject || 'Bekräftelse på din beställning',
        html: emailData.message,
        text: emailData.message.replace(/<[^>]*>?/gm, ''), // Strip HTML for plain text version
        attachments: emailData.attachments || []
      };
      
      // Send email
      await transporter.sendMail(mailOptions);
      console.log(`Customer confirmation email sent to ${emailData.email}`);
      
      // Update status
      await snap.ref.update({
        status: 'sent',
        sentAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return null;
    } catch (error) {
      console.error('Error sending customer confirmation email:', error);
      await snap.ref.update({
        status: 'error',
        error: error.message,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      throw error;
    }
  });

// Cloud Function triggered when an invoice email needs to be sent
exports.sendInvoiceEmail = functions.firestore
  .document('emailQueue/{emailId}')
  .onCreate(async (snap, context) => {
    const emailData = snap.data();
    
    // Skip if already processed
    if (emailData.status === 'sent') return null;
    
    try {
      const mailOptions = {
        from: `"DOX Visumpartner" <${functions.config().email.from || functions.config().email.user}>`,
        to: emailData.to,
        subject: emailData.subject || 'Din faktura från Legaliseringstjänst',
        html: emailData.html,
        text: emailData.html.replace(/<[^>]*>?/gm, ''), // Strip HTML for plain text version
        attachments: emailData.attachments || []
      };
      
      // Send email
      await transporter.sendMail(mailOptions);
      console.log(`Invoice email sent to ${emailData.to}`);
      
      // Update status
      await snap.ref.update({
        status: 'sent',
        sentAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return null;
    } catch (error) {
      console.error('Error sending invoice email:', error);
      await snap.ref.update({
        status: 'error',
        error: error.message,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      throw error;
    }
  });

const USE_DHL_MOCK = !functions.config().dhl || !functions.config().dhl.api_key;

// Callable function to create a mock DHL shipment for a given order
async function createMockDhlShipment(orderId) {
  const db = admin.firestore();

  let orderDoc = await db.collection('orders').doc(orderId).get();
  let docId = orderId;

  if (!orderDoc.exists) {
    const querySnap = await db
      .collection('orders')
      .where('orderNumber', '==', orderId)
      .limit(1)
      .get();

    if (querySnap.empty) {
      throw new functions.https.HttpsError('not-found', `Order ${orderId} not found`);
    }

    orderDoc = querySnap.docs[0];
    docId = orderDoc.id;
  }

  const orderData = orderDoc.data() || {};
  const customerInfo = orderData.customerInfo || {};

  const randomSuffix = Math.floor(100000000 + Math.random() * 900000000);
  const trackingNumber = `DHL-MOCK-${randomSuffix}`;

  const trackingUrl = `https://www.dhl.com/global-en/home/tracking/tracking-express.html?AWB=${encodeURIComponent(
    trackingNumber
  )}&brand=DHL`;

  await db.collection('orders').doc(docId).update({
    returnTrackingNumber: trackingNumber,
    returnTrackingUrl: trackingUrl,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return {
    orderId: docId,
    trackingNumber,
    trackingUrl,
    customer: {
      name: `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim(),
      email: customerInfo.email || ''
    }
  };
}

async function createRealDhlShipment(orderId) {
  return createMockDhlShipment(orderId);
}

exports.createDhlShipment = functions.https.onCall(async (data, context) => {
  const orderId = data && typeof data.orderId === 'string' ? data.orderId.trim() : '';
  if (!orderId) {
    throw new functions.https.HttpsError('invalid-argument', 'orderId is required');
  }

  try {
    const result = USE_DHL_MOCK
      ? await createMockDhlShipment(orderId)
      : await createRealDhlShipment(orderId);
    return result;
  } catch (error) {
    console.error('Error creating mock DHL shipment:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    const message = (error && error.message) ? String(error.message) : String(error);
    throw new functions.https.HttpsError('internal', `Failed to create DHL shipment: ${message}`);
  }
});

// Callable function to create a mock DHL pickup for a given order
async function createMockDhlPickup(orderId) {
  const db = admin.firestore();

  let orderDoc = await db.collection('orders').doc(orderId).get();
  let docId = orderId;

  if (!orderDoc.exists) {
    const querySnap = await db
      .collection('orders')
      .where('orderNumber', '==', orderId)
      .limit(1)
      .get();

    if (querySnap.empty) {
      throw new functions.https.HttpsError('not-found', `Order ${orderId} not found`);
    }

    orderDoc = querySnap.docs[0];
    docId = orderDoc.id;
  }

  const orderData = orderDoc.data() || {};
  const customerInfo = orderData.customerInfo || {};

  const randomSuffix = Math.floor(100000000 + Math.random() * 900000000);
  const trackingNumber = `DHL-PICKUP-MOCK-${randomSuffix}`;

  await db.collection('orders').doc(docId).update({
    pickupTrackingNumber: trackingNumber,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return {
    orderId: docId,
    trackingNumber,
    customer: {
      name: `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim(),
      email: customerInfo.email || ''
    }
  };
}

async function createRealDhlPickup(orderId) {
  return createMockDhlPickup(orderId);
}

exports.createDhlPickup = functions.https.onCall(async (data, context) => {
  const orderId = data && typeof data.orderId === 'string' ? data.orderId.trim() : '';
  if (!orderId) {
    throw new functions.https.HttpsError('invalid-argument', 'orderId is required');
  }

  try {
    const result = USE_DHL_MOCK
      ? await createMockDhlPickup(orderId)
      : await createRealDhlPickup(orderId);
    return result;
  } catch (error) {
    console.error('Error creating mock DHL pickup:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    const message = (error && error.message) ? String(error.message) : String(error);
    throw new functions.https.HttpsError('internal', `Failed to create DHL pickup: ${message}`);
  }
});

// Test function to verify email setup
exports.testEmail = functions.https.onCall(async (data, context) => {
  const mailOptions = {
    from: `"DOX Visumpartner Test" <${functions.config().email.from || functions.config().email.user}>`,
    to: 'alexander.bergqvist@gmail.com',
    subject: 'Test Email från Firebase Functions',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Test Email</h2>
        <p>Detta är ett testmeddelande från Firebase Functions med nodemailer.</p>
        <p>Skickat: ${new Date().toLocaleString('sv-SE')}</p>
      </div>
    `,
    text: `Test Email från Firebase Functions. Skickat: ${new Date().toLocaleString('sv-SE')}`
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Test email sent successfully' };
  } catch (error) {
    console.error('Test email failed:', error);
    return { success: false, error: error.message };
  }
});