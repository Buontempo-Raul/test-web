// backend/controllers/auctionPurchaseController.js
const AuctionPurchase = require('../models/AuctionPurchase');
const Artwork = require('../models/Artwork');
const { sendEmail } = require('../utils/sendEmail');

// @desc    Get auction purchase by ID
// @route   GET /api/auction-purchases/:auctionId
// @access  Public (but restricted to winner)
const getAuctionPurchase = async (req, res) => {
  try {
    const { auctionId } = req.params;

    const purchase = await AuctionPurchase.findOne({ auctionId })
      .populate('artwork', 'title description images')
      .populate('artist', 'username email')
      .populate('winner', 'username email');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Auction purchase not found'
      });
    }

    // Check if purchase has expired
    if (purchase.isExpired && purchase.status === 'pending') {
      purchase.status = 'expired';
      await purchase.save();
    }

    res.json({
      success: true,
      purchase: {
        auctionId: purchase.auctionId,
        artwork: purchase.artwork,
        artist: {
          username: purchase.artist.username,
          _id: purchase.artist._id
        },
        winner: {
          username: purchase.winner.username,
          _id: purchase.winner._id
        },
        winningBid: purchase.winningBid,
        platformFee: purchase.platformFee,
        shippingFee: purchase.shippingFee,
        totalAmount: purchase.totalAmount,
        status: purchase.status,
        timeRemaining: purchase.timeRemaining,
        isExpired: purchase.isExpired,
        shippingAddress: purchase.shippingAddress,
        trackingNumber: purchase.trackingNumber,
        shippingCarrier: purchase.shippingCarrier,
        createdAt: purchase.createdAt,
        expiresAt: purchase.expiresAt
      }
    });
  } catch (error) {
    console.error('Error fetching auction purchase:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching auction purchase'
    });
  }
};

// @desc    Update shipping address
// @route   PUT /api/auction-purchases/:auctionId/shipping
// @access  Protected (winner only)
const updateShippingAddress = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const userId = req.user._id;
    const {
      fullName,
      address,
      city,
      state,
      postalCode,
      country,
      phoneNumber
    } = req.body;

    // Find the purchase
    const purchase = await AuctionPurchase.findOne({ auctionId });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Auction purchase not found'
      });
    }

    // Check if user is the winner
    if (purchase.winner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the auction winner can update shipping address'
      });
    }

    // Check if purchase is still valid
    if (purchase.status === 'expired' || purchase.isExpired) {
      return res.status(400).json({
        success: false,
        message: 'Purchase window has expired'
      });
    }

    // Update shipping address
    purchase.shippingAddress = {
      fullName,
      address,
      city,
      state,
      postalCode,
      country,
      phoneNumber
    };

    // Update status if this is the first time providing address
    if (purchase.status === 'pending') {
      await purchase.updateStatus('address_provided');
    }

    await purchase.save();

    res.json({
      success: true,
      message: 'Shipping address updated successfully',
      purchase: {
        auctionId: purchase.auctionId,
        status: purchase.status,
        shippingAddress: purchase.shippingAddress
      }
    });
  } catch (error) {
    console.error('Error updating shipping address:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating shipping address'
    });
  }
};

// @desc    Complete payment
// @route   POST /api/auction-purchases/:auctionId/payment
// @access  Protected (winner only)
const completePayment = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const userId = req.user._id;
    const {
      paymentMethod,
      paymentResult
    } = req.body;

    // Find the purchase
    const purchase = await AuctionPurchase.findOne({ auctionId })
      .populate('artwork', 'title')
      .populate('artist', 'username email')
      .populate('winner', 'username email');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Auction purchase not found'
      });
    }

    // Check if user is the winner
    if (purchase.winner._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the auction winner can complete payment'
      });
    }

    // Check if purchase is still valid
    if (purchase.status === 'expired' || purchase.isExpired) {
      return res.status(400).json({
        success: false,
        message: 'Purchase window has expired'
      });
    }

    // Check if shipping address is provided
    if (!purchase.shippingAddress || !purchase.shippingAddress.address) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address must be provided before payment'
      });
    }

    // Update payment information
    purchase.paymentMethod = paymentMethod;
    purchase.paymentResult = paymentResult;

    // Update status to paid
    await purchase.updateStatus('paid');

    // Send notification email to artist
    await sendArtistPaymentNotification(purchase);

    res.json({
      success: true,
      message: 'Payment completed successfully',
      purchase: {
        auctionId: purchase.auctionId,
        status: purchase.status,
        paidAt: purchase.paidAt
      }
    });
  } catch (error) {
    console.error('Error completing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing payment'
    });
  }
};

// @desc    Update shipping status (Artist only)
// @route   PUT /api/auction-purchases/:auctionId/shipping-status
// @access  Protected (artist only)
const updateShippingStatus = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const userId = req.user._id;
    const {
      status,
      trackingNumber,
      shippingCarrier,
      artistNotes
    } = req.body;

    // Find the purchase
    const purchase = await AuctionPurchase.findOne({ auctionId })
      .populate('winner', 'username email')
      .populate('artwork', 'title');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Auction purchase not found'
      });
    }

    // Check if user is the artist
    if (purchase.artist.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the artist can update shipping status'
      });
    }

    // Update shipping information
    const updateData = {};
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (shippingCarrier) updateData.shippingCarrier = shippingCarrier;
    if (artistNotes) updateData.artistNotes = artistNotes;

    await purchase.updateStatus(status, updateData);

    // Send notification to winner if shipped
    if (status === 'shipped') {
      await sendWinnerShippingNotification(purchase);
    }

    res.json({
      success: true,
      message: 'Shipping status updated successfully',
      purchase: {
        auctionId: purchase.auctionId,
        status: purchase.status,
        trackingNumber: purchase.trackingNumber,
        shippingCarrier: purchase.shippingCarrier
      }
    });
  } catch (error) {
    console.error('Error updating shipping status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating shipping status'
    });
  }
};

// Helper function to send payment notification to artist
const sendArtistPaymentNotification = async (purchase) => {
  try {
    const subject = `💰 Payment Received for "${purchase.artwork.title}"`;
    const message = `
      Hello ${purchase.artist.username},

      Great news! Payment has been received for your artwork "${purchase.artwork.title}".

      Purchase Details:
      - Winning Bid: $${purchase.winningBid.toFixed(2)}
      - Total Amount: $${purchase.totalAmount.toFixed(2)}
      - Winner: ${purchase.winner.username}

      Shipping Address:
      ${purchase.shippingAddress.fullName}
      ${purchase.shippingAddress.address}
      ${purchase.shippingAddress.city}, ${purchase.shippingAddress.state} ${purchase.shippingAddress.postalCode}
      ${purchase.shippingAddress.country}
      Phone: ${purchase.shippingAddress.phoneNumber}

      Please prepare the artwork for shipping and update the shipping status once sent.

      Best regards,
      The Uncreated Team
    `;

    await sendEmail({
      email: purchase.artist.email,
      subject: subject,
      message: message
    });

    purchase.emailNotificationsSent.artist = true;
    await purchase.save();
  } catch (error) {
    console.error('Error sending artist notification:', error);
  }
};

// Helper function to send shipping notification to winner
const sendWinnerShippingNotification = async (purchase) => {
  try {
    const subject = `📦 Your artwork "${purchase.artwork.title}" has been shipped!`;
    const message = `
      Hello ${purchase.winner.username},

      Your artwork "${purchase.artwork.title}" has been shipped!

      Tracking Information:
      - Carrier: ${purchase.shippingCarrier || 'N/A'}
      - Tracking Number: ${purchase.trackingNumber || 'N/A'}
      
      ${purchase.artistNotes ? `Artist Notes: ${purchase.artistNotes}` : ''}

      Thank you for your purchase!

      Best regards,
      The Uncreated Team
    `;

    await sendEmail({
      email: purchase.winner.email,
      subject: subject,
      message: message
    });
  } catch (error) {
    console.error('Error sending shipping notification:', error);
  }
};

module.exports = {
  getAuctionPurchase,
  updateShippingAddress,
  completePayment,
  updateShippingStatus
};