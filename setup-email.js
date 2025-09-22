// Setup script for email configuration
// Run this to set up email credentials for Firebase Functions

const { execSync } = require('child_process');

console.log('🔧 Setting up email configuration for Firebase Functions');
console.log('');
console.log('This script will help you configure Gmail credentials for sending contact emails.');
console.log('');
console.log('📋 Prerequisites:');
console.log('1. Enable 2-factor authentication on your Gmail account');
console.log('2. Generate an App Password:');
console.log('   - Go to https://myaccount.google.com/apppasswords');
console.log('   - Select "Mail" and "Other (custom name)"');
console.log('   - Enter "Firebase Functions" as the name');
console.log('   - Copy the 16-character password');
console.log('');
console.log('⚠️  IMPORTANT: Use an App Password, not your regular Gmail password!');
console.log('');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter your Gmail address (e.g., your-email@gmail.com): ', (email) => {
  rl.question('Enter your Gmail App Password (16 characters, no spaces): ', (appPassword) => {
    console.log('');
    console.log('🔄 Setting Firebase Functions config...');

    try {
      // Set the email configuration
      execSync(`firebase functions:config:set email.user="${email}" email.pass="${appPassword}"`, {
        stdio: 'inherit',
        cwd: process.cwd()
      });

      console.log('');
      console.log('✅ Email configuration set successfully!');
      console.log('');
      console.log('📧 Emails will be sent to: alexander.bergqvist@gmail.com');
      console.log('📤 Emails will be sent from:', email);
      console.log('');
      console.log('🚀 Next steps:');
      console.log('1. Deploy the functions: firebase deploy --only functions');
      console.log('2. Test by submitting a contact form on your website');
      console.log('');
      console.log('💡 You can test the email setup by calling the test function:');
      console.log('   firebase functions:call testEmail');

    } catch (error) {
      console.error('');
      console.error('❌ Failed to set email configuration:', error.message);
      console.error('');
      console.error('🔍 Make sure you have Firebase CLI installed and are logged in:');
      console.error('   firebase login');
      console.error('   firebase use --add (select your project)');
    }

    rl.close();
  });
});