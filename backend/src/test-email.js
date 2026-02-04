// e:\Aquaflow\backend\src\scripts\test-email.js
import { sendEmail } from './utils/sendEmail.js';

// Get recipient from command line arguments
const recipient = process.argv[2];

if (!recipient) {
  console.error('❌ Please provide a recipient email address.');
  console.error('Usage: node src/scripts/test-email.js <recipient-email>');
  process.exit(1);
}

const run = async () => {
  console.log(`📧 Attempting to send test email to: ${recipient}`);
  
  try {
    await sendEmail({
      email: recipient,
      subject: 'AquaFlow API Test',
      message: `
        <h1>It Works!</h1>
        <p>This is a test email from your Aquaflow backend configuration.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
    });
    console.log('✅ Email sent successfully!');
  } catch (error) {
    console.error('❌ Failed to send email.');
    console.error('Error Message:', error.message);
    if (error.response) {
      console.error('SendGrid Response:', JSON.stringify(error.response.body, null, 2));
    }
  }
};

run();
