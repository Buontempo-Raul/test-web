// backend/scripts/testEmail.js - Email configuration test script
require('dotenv').config();
const { sendEmail, sendAuctionWinnerEmail } = require('../utils/sendEmail');

const testBasicEmail = async () => {
  console.log('📧 Testing basic email functionality...\n');
  
  try {
    // Check if environment variables are set
    console.log('🔍 Checking environment variables:');
    console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || '❌ Not set'}`);
    console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || '❌ Not set'}`);
    console.log(`   SMTP_EMAIL: ${process.env.SMTP_EMAIL || '❌ Not set'}`);
    console.log(`   SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? '✅ Set' : '❌ Not set'}`);
    console.log(`   FROM_NAME: ${process.env.FROM_NAME || '❌ Not set'}`);
    console.log(`   FROM_EMAIL: ${process.env.FROM_EMAIL || '❌ Not set'}\n`);
    
    if (!process.env.SMTP_HOST || !process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      console.log('❌ Missing required environment variables!');
      console.log('Please check your .env file and try again.\n');
      return false;
    }
    
    // Test basic email
    console.log('📤 Sending test email...');
    
    const testEmailAddress = 'raulbuontempo@gmail.com'; // Change this to your email
    
    await sendEmail({
      email: testEmailAddress,
      subject: '🧪 Uncreated Email Test - Basic Functionality',
      message: `
        Hello!
        
        This is a test email from your Uncreated auction platform.
        
        If you receive this email, your basic email configuration is working correctly!
        
        Configuration details:
        - SMTP Host: ${process.env.SMTP_HOST}
        - SMTP Port: ${process.env.SMTP_PORT}
        - From: ${process.env.FROM_EMAIL}
        
        Test sent at: ${new Date().toLocaleString()}
        
        Best regards,
        Your Uncreated Platform
      `
    });
    
    console.log('✅ Basic email sent successfully!');
    console.log(`📬 Check your inbox at: ${testEmailAddress}\n`);
    return true;
    
  } catch (error) {
    console.error('❌ Basic email test failed:');
    console.error('   Error:', error.message);
    
    // Provide helpful troubleshooting tips
    if (error.message.includes('Invalid login')) {
      console.log('\n💡 Troubleshooting tips for "Invalid login":');
      console.log('   - Gmail: Make sure you\'re using an App Password, not your regular password');
      console.log('   - Enable 2-Factor Authentication first, then generate App Password');
      console.log('   - Outlook: Similar process - use App Password');
    } else if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Troubleshooting tips for connection issues:');
      console.log('   - Check your SMTP_HOST and SMTP_PORT settings');
      console.log('   - Try port 465 instead of 587');
      console.log('   - Check if your firewall is blocking the connection');
    }
    
    console.log('\n');
    return false;
  }
};

const testAuctionWinnerEmail = async () => {
  console.log('🎯 Testing auction winner email template...\n');
  
  try {
    const testEmailAddress = 'raulbuontempo@gmail.com'; // Change this to your email
    
    // Sample auction winner data
    const mockWinnerData = {
      winnerEmail: testEmailAddress,
      winnerUsername: 'TestWinner',
      artwork: {
        title: 'Beautiful Sunset Painting',
        description: 'A stunning oil painting depicting a golden sunset over rolling hills. The warm colors and soft brushstrokes create a peaceful, contemplative mood.',
        images: ['https://via.placeholder.com/600x400/ff7f50/ffffff?text=Sample+Artwork']
      },
      finalBid: 250.00,
      artistUsername: 'ArtistJohnDoe',
      auctionId: 'test-auction-12345'
    };
    
    console.log('📤 Sending auction winner notification email...');
    console.log(`   Artwork: ${mockWinnerData.artwork.title}`);
    console.log(`   Winner: ${mockWinnerData.winnerUsername}`);
    console.log(`   Final Bid: $${mockWinnerData.finalBid}`);
    console.log(`   Artist: ${mockWinnerData.artistUsername}\n`);
    
    await sendAuctionWinnerEmail(mockWinnerData);
    
    console.log('✅ Auction winner email sent successfully!');
    console.log(`📬 Check your inbox at: ${testEmailAddress}`);
    console.log('   This email should contain:');
    console.log('   - Beautiful HTML template');
    console.log('   - Artwork image and details');
    console.log('   - Purchase button/link');
    console.log('   - Professional styling\n');
    
    return true;
    
  } catch (error) {
    console.error('❌ Auction winner email test failed:');
    console.error('   Error:', error.message);
    console.log('\n');
    return false;
  }
};

const runAllTests = async () => {
  console.log('🚀 Starting Email Configuration Tests');
  console.log('=' * 50);
  console.log('Make sure to update the test email address in this script!\n');
  
  try {
    // Test 1: Basic email functionality
    const basicEmailSuccess = await testBasicEmail();
    
    if (!basicEmailSuccess) {
      console.log('🛑 Basic email test failed. Please fix configuration before proceeding.\n');
      return;
    }
    
    // Wait a moment between tests
    console.log('⏳ Waiting 3 seconds before next test...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 2: Auction winner email template
    const auctionEmailSuccess = await testAuctionWinnerEmail();
    
    // Final results
    console.log('🎉 Email Testing Complete!');
    console.log('=' * 50);
    
    if (basicEmailSuccess && auctionEmailSuccess) {
      console.log('✅ All tests passed!');
      console.log('🚀 Your email system is ready for auction notifications!');
      console.log('\nNext steps:');
      console.log('1. Start your server: npm run dev');
      console.log('2. Test the complete auction flow');
      console.log('3. End an auction to trigger real winner emails');
    } else {
      console.log('❌ Some tests failed. Please check the errors above.');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error during testing:', error);
  }
};

// Helper function to validate email address
const validateEmailAddress = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const testEmail = 'raulbuontempo@gmail.com'; // This should be updated by user
  
  if (testEmail === 'your-email@example.com') {
    console.log('⚠️  IMPORTANT: Please update the testEmailAddress variable in this script!');
    console.log('   Change "your-email@example.com" to your actual email address\n');
    return false;
  }
  
  if (!emailRegex.test(testEmail)) {
    console.log('❌ Invalid email address format');
    return false;
  }
  
  return true;
};

// Run the tests
if (require.main === module) {
  // Check email address first
  if (!validateEmailAddress()) {
    console.log('Please update the email address in this script and try again.');
    process.exit(1);
  }
  
  runAllTests().catch(console.error);
}

module.exports = {
  testBasicEmail,
  testAuctionWinnerEmail,
  runAllTests
};