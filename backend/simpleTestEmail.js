// backend/test-email-simple.js - Simple email test (run from backend directory)
require('dotenv').config();

const testEmail = async () => {
  console.log('📧 Testing email configuration...\n');
  
  // Check if utils/sendEmail.js exists
  const fs = require('fs');
  const path = require('path');
  
  const sendEmailPath = path.join(__dirname, 'utils', 'sendEmail.js');
  if (!fs.existsSync(sendEmailPath)) {
    console.log('❌ Error: utils/sendEmail.js file not found!');
    console.log('   Expected location:', sendEmailPath);
    console.log('   Please make sure you have created the enhanced sendEmail.js file.');
    return;
  }
  
  try {
    const { sendEmail, sendAuctionWinnerEmail } = require('./utils/sendEmail');
    
    // Check environment variables
    console.log('🔍 Checking environment variables:');
    console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || '❌ Not set'}`);
    console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || '❌ Not set'}`);
    console.log(`   SMTP_EMAIL: ${process.env.SMTP_EMAIL || '❌ Not set'}`);
    console.log(`   SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? '✅ Set' : '❌ Not set'}`);
    console.log(`   FROM_NAME: ${process.env.FROM_NAME || '❌ Not set'}`);
    console.log(`   FROM_EMAIL: ${process.env.FROM_EMAIL || '❌ Not set'}\n`);
    
    if (!process.env.SMTP_HOST || !process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      console.log('❌ Missing required environment variables!');
      console.log('Please add these to your .env file:\n');
      console.log('SMTP_HOST=smtp.gmail.com');
      console.log('SMTP_PORT=587');
      console.log('SMTP_EMAIL=your-email@gmail.com');
      console.log('SMTP_PASSWORD=your-app-password');
      console.log('FROM_NAME=Uncreated Art Platform');
      console.log('FROM_EMAIL=your-email@gmail.com');
      console.log('FRONTEND_URL=http://localhost:3000\n');
      return;
    }
    
    // **CHANGE THIS EMAIL TO YOUR EMAIL ADDRESS**
    const testEmailAddress = 'raulbuontempo@gmail.com'; // <-- UPDATE THIS!
    
    if (testEmailAddress === 'your-email@example.com') {
      console.log('⚠️  Please update the testEmailAddress variable in this script!');
      console.log('   Change line with "your-email@example.com" to your actual email.\n');
      return;
    }
    
    console.log('📤 Sending test email...');
    
    await sendEmail({
      email: testEmailAddress,
      subject: '🧪 Uncreated Email Test',
      message: `
        Hello!
        
        This is a test email from your Uncreated auction platform.
        
        If you receive this email, your email configuration is working correctly!
        
        Configuration:
        - SMTP Host: ${process.env.SMTP_HOST}
        - From: ${process.env.FROM_EMAIL}
        
        Test sent at: ${new Date().toLocaleString()}
        
        Best regards,
        Your Uncreated Platform
      `
    });
    
    console.log('✅ Email sent successfully!');
    console.log(`📬 Check your inbox at: ${testEmailAddress}`);
    console.log('\n🎉 Your email system is working!');
    console.log('Next steps:');
    console.log('1. Start your server: npm run dev');
    console.log('2. Test auction functionality');
    console.log('3. End an auction to see winner notifications\n');
    
  } catch (error) {
    console.error('❌ Email test failed:');
    console.error('   Error:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n💡 Gmail troubleshooting:');
      console.log('   1. Enable 2-Factor Authentication');
      console.log('   2. Generate App Password (not regular password)');
      console.log('   3. Use the 16-character App Password in SMTP_PASSWORD');
    } else if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Connection troubleshooting:');
      console.log('   1. Check SMTP_HOST and SMTP_PORT');
      console.log('   2. Try port 465 instead of 587');
      console.log('   3. Check firewall settings');
    }
    console.log('\n');
  }
};

// Run the test
testEmail().catch(console.error);