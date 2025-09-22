const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Initialize Firebase Admin
admin.initializeApp();

// Configure nodemailer with Gmail (you'll need to set up app password)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().email.user, // Set this in Firebase config
    pass: functions.config().email.pass  // Set this in Firebase config (app password)
  }
});

// Cloud Function triggered when a new contact message is created
exports.sendContactEmail = functions.firestore
  .document('contactMessages/{messageId}')
  .onCreate(async (snap, context) => {
    const messageData = snap.data();

    // Email content
    const mailOptions = {
      from: `"Legaliseringstjänst" <${functions.config().email.user}>`,
      to: 'alexander.bergqvist@gmail.com',
      subject: `Nytt kontaktmeddelande från ${messageData.name}`,
      html: `
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
            <p style="white-space: pre-wrap; line-height: 1.6;">${messageData.message}</p>
          </div>

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e;">
              <strong>Skickat:</strong> ${messageData.createdAt.toDate().toLocaleString('sv-SE')}
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #6b7280; font-size: 14px;">
            Detta meddelande skickades från kontaktformuläret på Legaliseringstjänst.se
          </p>
        </div>
      `,
      // Plain text version for email clients that don't support HTML
      text: `
Nytt kontaktmeddelande från ${messageData.name}

Kontaktuppgifter:
Namn: ${messageData.name}
E-post: ${messageData.email}
Telefon: ${messageData.phone || 'Ej angivet'}
Ämne: ${messageData.subject}

Meddelande:
${messageData.message}

Skickat: ${messageData.createdAt.toDate().toLocaleString('sv-SE')}

Detta meddelande skickades från kontaktformuläret på Legaliseringstjänst.se
      `
    };

    try {
      // Send email
      await transporter.sendMail(mailOptions);
      console.log('Contact email sent successfully to alexander.bergqvist@gmail.com');

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

// Test function to verify email setup
exports.testEmail = functions.https.onCall(async (data, context) => {
  const mailOptions = {
    from: `"Legaliseringstjänst Test" <${functions.config().email.user}>`,
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