// backend/utils/sendEmail.js - Fixed working version
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create a transporter (FIXED: createTransport, not createTransporter)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  });

  // Define email options
  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  // Add HTML content if provided
  if (options.html) {
    mailOptions.html = options.html;
  }

  // Add attachments if provided (for embedding images)
  if (options.attachments) {
    mailOptions.attachments = options.attachments;
  }

  // Send email
  await transporter.sendMail(mailOptions);
};

// Auction winner email template
const sendAuctionWinnerEmail = async (winnerData) => {
  const {
    winnerEmail,
    winnerUsername,
    artwork,
    finalBid,
    artistUsername,
    auctionId
  } = winnerData;

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const completePurchaseUrl = `${frontendUrl}/auction-purchase/${auctionId}`;
  
  // Get the first image of the artwork
  const artworkImageUrl = artwork.images && artwork.images.length > 0 
    ? artwork.images[0] 
    : null;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Congratulations! You Won the Auction</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 2em;
                font-weight: bold;
            }
            .trophy {
                font-size: 3em;
                margin-bottom: 10px;
            }
            .content {
                padding: 30px;
            }
            .artwork-section {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                text-align: center;
            }
            .artwork-image {
                max-width: 100%;
                height: 200px;
                object-fit: cover;
                border-radius: 8px;
                margin-bottom: 15px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }
            .artwork-title {
                font-size: 1.5em;
                font-weight: bold;
                color: #2c3e50;
                margin-bottom: 10px;
            }
            .artwork-description {
                color: #666;
                margin-bottom: 15px;
            }
            .price-section {
                background: linear-gradient(135deg, #ffd700, #ffed4e);
                color: #1a1a1a;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                margin: 20px 0;
            }
            .price-label {
                font-size: 1.1em;
                font-weight: 500;
                margin-bottom: 5px;
            }
            .price-amount {
                font-size: 2.5em;
                font-weight: bold;
                margin-bottom: 5px;
            }
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #28a745, #20c997);
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                font-size: 1.1em;
                text-align: center;
                margin: 20px 0;
                box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
            }
            .info-section {
                background: #e3f2fd;
                border-left: 4px solid #2196f3;
                padding: 15px;
                margin: 20px 0;
            }
            .footer {
                background: #2c3e50;
                color: white;
                padding: 20px;
                text-align: center;
                font-size: 0.9em;
            }
            .artist-info {
                margin: 15px 0;
                padding: 15px;
                background: #f1f3f4;
                border-radius: 6px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="trophy">🏆</div>
                <h1>Congratulations!</h1>
                <p>You won the auction!</p>
            </div>
            
            <div class="content">
                <p>Dear ${winnerUsername},</p>
                
                <p>We're excited to inform you that you have won the auction for this beautiful artwork:</p>
                
                <div class="artwork-section">
                    ${artworkImageUrl ? `<img src="${artworkImageUrl}" alt="${artwork.title}" class="artwork-image">` : ''}
                    <div class="artwork-title">${artwork.title}</div>
                    <div class="artwork-description">${artwork.description}</div>
                    <div class="artist-info">
                        <strong>Artist:</strong> ${artistUsername}
                    </div>
                </div>
                
                <div class="price-section">
                    <div class="price-label">Your Winning Bid</div>
                    <div class="price-amount">$${finalBid.toFixed(2)}</div>
                </div>
                
                <div class="info-section">
                    <h3>📦 Next Steps</h3>
                    <p>To complete your purchase, you need to:</p>
                    <ul>
                        <li>Provide your shipping address</li>
                        <li>Complete the payment process</li>
                        <li>The artist will then ship your artwork</li>
                    </ul>
                </div>
                
                <div style="text-align: center;">
                    <a href="${completePurchaseUrl}" class="cta-button">
                        Complete Your Purchase
                    </a>
                </div>
                
                <div class="info-section">
                    <h3>⏰ Important</h3>
                    <p>Please complete your purchase within 7 days to secure your artwork.</p>
                </div>
                
                <p>If you have any questions, please don't hesitate to contact us.</p>
                
                <p>Best regards,<br>
                The Uncreated Team</p>
            </div>
            
            <div class="footer">
                <p>&copy; 2024 Uncreated. All rights reserved.</p>
                <p>Auction ID: ${auctionId}</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const textContent = `
    Congratulations ${winnerUsername}!
    
    You have won the auction for "${artwork.title}" by ${artistUsername}.
    
    Artwork Details:
    - Title: ${artwork.title}
    - Description: ${artwork.description}
    - Your Winning Bid: $${finalBid.toFixed(2)}
    
    To complete your purchase, please visit: ${completePurchaseUrl}
    
    You need to provide your shipping address and complete the payment process.
    Please complete your purchase within 7 days to secure your artwork.
    
    Best regards,
    The Uncreated Team
  `;

  await sendEmail({
    email: winnerEmail,
    subject: `🎉 Congratulations! You won "${artwork.title}"`,
    message: textContent,
    html: htmlContent
  });
};

module.exports = {
  sendEmail,
  sendAuctionWinnerEmail
};