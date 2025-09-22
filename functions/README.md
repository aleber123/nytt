# Firebase Functions - Email Notifications

This directory contains Firebase Cloud Functions for sending email notifications when contact messages are submitted.

## Setup Instructions

### 1. Gmail App Password Setup

Before deploying, you need to set up Gmail credentials:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (custom name)"
   - Enter "Firebase Functions" as the name
   - Copy the 16-character password

### 2. Configure Email Credentials

Run the setup script from the project root:

```bash
node setup-email.js
```

This will prompt you for:
- Your Gmail address
- Your Gmail App Password (not your regular password)

### 3. Deploy Functions

```bash
firebase deploy --only functions
```

## Functions

### `sendContactEmail`
- **Trigger**: Firestore document creation in `contactMessages` collection
- **Action**: Sends an email to alexander.bergqvist@gmail.com with the contact details
- **Updates**: Sets message status to 'emailed' or 'email_failed'

### `testEmail`
- **Trigger**: HTTPS callable function
- **Action**: Sends a test email to verify configuration
- **Usage**: `firebase functions:call testEmail`

## Email Template

The contact emails include:
- Sender's name, email, phone, subject
- Message content
- Timestamp
- Professional HTML formatting

## Troubleshooting

### Common Issues

1. **"Invalid login" error**:
   - Make sure you're using an App Password, not your regular Gmail password
   - Verify 2FA is enabled on your Gmail account

2. **Functions not deploying**:
   - Check Firebase CLI is installed: `firebase --version`
   - Login to Firebase: `firebase login`
   - Select correct project: `firebase use legapp-2720a`

3. **Emails not sending**:
   - Check function logs: `firebase functions:log`
   - Verify email config: `firebase functions:config:get`

### Testing

Test the email setup:

```bash
# Test the email function
firebase functions:call testEmail

# Submit a test contact message
node test-contact.js
```

## Security Notes

- Email credentials are stored securely in Firebase Functions config
- Never commit email passwords to version control
- App Passwords can be revoked if compromised