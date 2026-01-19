const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Set global options for all functions
setGlobalOptions({ region: 'us-central1' });

// Initialize Firebase Admin
admin.initializeApp();

// reCAPTCHA verification helper
const verifyRecaptcha = async (token, expectedAction = null) => {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  if (!secretKey) {
    console.warn('reCAPTCHA secret key not configured - skipping verification');
    return { success: true, score: 1.0, skipped: true };
  }

  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secretKey}&response=${token}`
    });

    const data = await response.json();
    
    // reCAPTCHA v3 returns a score between 0.0 and 1.0
    // 1.0 is very likely a good interaction, 0.0 is very likely a bot
    const isValid = data.success && data.score >= 0.5;
    
    // Optionally verify the action matches
    if (expectedAction && data.action !== expectedAction) {
      console.warn(`reCAPTCHA action mismatch: expected ${expectedAction}, got ${data.action}`);
    }

    return {
      success: isValid,
      score: data.score,
      action: data.action,
      errorCodes: data['error-codes']
    };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return { success: false, error: error.message };
  }
};

// Configure nodemailer transport (using environment variables)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.office365.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
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
exports.sendContactEmail = onDocumentCreated('contactMessages/{messageId}', async (event) => {
    const snap = event.data;
    if (!snap) return null;
    const messageData = snap.data();
    const messageId = event.params.messageId;

    // Verify reCAPTCHA token if present
    if (messageData.recaptchaToken) {
      const recaptchaResult = await verifyRecaptcha(messageData.recaptchaToken, 'contact_form');
      
      if (!recaptchaResult.success && !recaptchaResult.skipped) {
        console.warn(`reCAPTCHA verification failed for contact message ${messageId}:`, recaptchaResult);
        
        // Mark as spam and don't send email
        await snap.ref.update({
          status: 'spam_blocked',
          recaptchaScore: recaptchaResult.score || 0,
          recaptchaError: recaptchaResult.errorCodes || recaptchaResult.error,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        return null; // Don't send email for suspected spam
      }
      
      // Log the score for monitoring
      console.log(`reCAPTCHA score for contact message: ${recaptchaResult.score}`);
    } else {
      console.warn(`No reCAPTCHA token for contact message ${messageId}`);
    }

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
      from: `"DOX Visumpartner" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
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

// Cloud Function to verify reCAPTCHA for new orders
exports.verifyOrderRecaptcha = onDocumentCreated('orders/{orderId}', async (event) => {
    const snap = event.data;
    if (!snap) return null;
    const orderData = snap.data();
    const orderId = event.params.orderId;
    
    // Verify reCAPTCHA token if present
    if (orderData.recaptchaToken) {
      const recaptchaResult = await verifyRecaptcha(orderData.recaptchaToken, 'submit_order');
      
      // Update order with reCAPTCHA verification result
      await snap.ref.update({
        recaptchaVerified: recaptchaResult.success,
        recaptchaScore: recaptchaResult.score || 0,
        recaptchaVerifiedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      if (!recaptchaResult.success && !recaptchaResult.skipped) {
        console.warn(`reCAPTCHA verification failed for order ${orderId}:`, recaptchaResult);
        
        // Mark order as potentially suspicious but don't block it
        // Orders involve payment so we don't want to block legitimate customers
        await snap.ref.update({
          recaptchaWarning: 'Low reCAPTCHA score - potential bot',
          recaptchaError: recaptchaResult.errorCodes || recaptchaResult.error
        });
      } else {
        console.log(`reCAPTCHA verified for order ${orderId}, score: ${recaptchaResult.score}`);
      }
    } else {
      console.warn(`No reCAPTCHA token for order ${orderId}`);
      await snap.ref.update({
        recaptchaVerified: false,
        recaptchaWarning: 'No reCAPTCHA token provided'
      });
    }
    
    return null;
  });

// Cloud Function triggered when a new customer email needs to be sent
exports.sendCustomerConfirmationEmail = onDocumentCreated('customerEmails/{emailId}', async (event) => {
    const snap = event.data;
    if (!snap) return null;
    const emailData = snap.data();
    
    // Skip if already processed
    if (emailData.status === 'sent') return null;
    
    try {
      const mailOptions = {
        from: `"DOX Visumpartner" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
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
exports.sendInvoiceEmail = onDocumentCreated('emailQueue/{emailId}', async (event) => {
    const snap = event.data;
    if (!snap) return null;
    const emailData = snap.data();
    
    // Skip if already processed
    if (emailData.status === 'sent') return null;
    
    try {
      const mailOptions = {
        from: `"DOX Visumpartner" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
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

const USE_DHL_MOCK = !process.env.DHL_API_KEY;

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
      throw new HttpsError('not-found', `Order ${orderId} not found`);
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

exports.createDhlShipment = onCall(async (request) => {
  const data = request.data;
  const orderId = data && typeof data.orderId === 'string' ? data.orderId.trim() : '';
  if (!orderId) {
    throw new HttpsError('invalid-argument', 'orderId is required');
  }

  try {
    const result = USE_DHL_MOCK
      ? await createMockDhlShipment(orderId)
      : await createRealDhlShipment(orderId);
    return result;
  } catch (error) {
    console.error('Error creating mock DHL shipment:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    const message = (error && error.message) ? String(error.message) : String(error);
    throw new HttpsError('internal', `Failed to create DHL shipment: ${message}`);
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
      throw new HttpsError('not-found', `Order ${orderId} not found`);
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

exports.createDhlPickup = onCall(async (request) => {
  const data = request.data;
  const orderId = data && typeof data.orderId === 'string' ? data.orderId.trim() : '';
  if (!orderId) {
    throw new HttpsError('invalid-argument', 'orderId is required');
  }

  try {
    const result = USE_DHL_MOCK
      ? await createMockDhlPickup(orderId)
      : await createRealDhlPickup(orderId);
    return result;
  } catch (error) {
    console.error('Error creating mock DHL pickup:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    const message = (error && error.message) ? String(error.message) : String(error);
    throw new HttpsError('internal', `Failed to create DHL pickup: ${message}`);
  }
});

// Test function to verify email setup
exports.testEmail = onCall(async (request) => {
  const mailOptions = {
    from: `"DOX Visumpartner Test" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
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