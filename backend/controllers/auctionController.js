// backend/controllers/auctionController.js - Updated with start/end functionality
const Artwork = require('../models/Artwork');

// @desc    Place a bid on an artwork
// @route   POST /api/auctions/:artworkId/bid
// @access  Protected
const placeBid = async (req, res) => {
  try {
    const { artworkId } = req.params;
    const { amount } = req.body;
    const bidderId = req.user._id;

    // Basic validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid bid amount is required'
      });
    }

    // Find the artwork
    const artwork = await Artwork.findById(artworkId).populate('creator', 'username');

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'Artwork not found'
      });
    }

    // Check if user is trying to bid on their own artwork
    if (artwork.creator._id.toString() === bidderId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot bid on your own artwork'
      });
    }

    const currentHighest = artwork.currentBid || artwork.price;
    const minimumBid = currentHighest + (artwork.auction?.minimumIncrement || 5);

    if (amount < minimumBid) {
      return res.status(400).json({
        success: false,
        message: `Bid must be at least $${minimumBid.toFixed(2)}`
      });
    }

    // Initialize auction if it doesn't exist
    if (!artwork.auction) {
      const endTime = new Date();
      endTime.setDate(endTime.getDate() + 7); // 7 days from now
      
      artwork.auction = {
        startTime: new Date(),
        endTime: endTime,
        startingPrice: artwork.price,
        currentBid: null,
        highestBidder: null,
        bids: [],
        isActive: true,
        minimumIncrement: 5
      };
    }

    // Check if auction is still active
    const now = new Date();
    const endTime = new Date(artwork.auction.endTime);
    
    if (now > endTime || !artwork.auction.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Auction has ended'
      });
    }

    // Create new bid
    const newBid = {
      bidder: bidderId,
      amount: amount,
      timestamp: new Date()
    };

    // Add bid to history (at the beginning for latest first)
    artwork.auction.bids.unshift(newBid);

    // Update current bid and highest bidder
    artwork.auction.currentBid = amount;
    artwork.auction.highestBidder = bidderId;
    artwork.currentBid = amount;
    artwork.highestBidder = bidderId;

    // Save the artwork
    await artwork.save();

    // Populate user data for response
    await artwork.populate('auction.bids.bidder', 'username');
    await artwork.populate('auction.highestBidder', 'username');

    // Format bid history for response
    const bidHistory = artwork.auction.bids.slice(0, 10).map(bid => ({
      id: bid._id,
      amount: bid.amount,
      bidder: {
        username: bid.bidder.username,
        _id: bid.bidder._id
      },
      timestamp: bid.timestamp
    }));

    res.json({
      success: true,
      message: 'Bid placed successfully',
      bid: {
        amount: amount,
        bidder: req.user.username,
        timestamp: new Date()
      },
      currentBid: artwork.currentBid,
      highestBidder: artwork.auction.highestBidder?.username,
      bidHistory: bidHistory
    });

  } catch (error) {
    console.error('Error placing bid:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while placing bid'
    });
  }
};

// @desc    Start an auction manually (Artist only)
// @route   POST /api/auctions/:artworkId/start
// @access  Protected (Artist only)
const startAuction = async (req, res) => {
  try {
    const { artworkId } = req.params;
    const { duration = 7 } = req.body; // Duration in days, default 7 days
    const userId = req.user._id;

    // Find the artwork
    const artwork = await Artwork.findById(artworkId).populate('creator', 'username');

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'Artwork not found'
      });
    }

    // Check if user is the creator of the artwork
    if (artwork.creator._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the artist can start their artwork auction'
      });
    }

    // Check if auction already exists and is active
    if (artwork.auction && artwork.auction.isActive) {
      const now = new Date();
      const endTime = new Date(artwork.auction.endTime);
      
      if (now <= endTime) {
        return res.status(400).json({
          success: false,
          message: 'Auction is already active'
        });
      }
    }

    // Create new auction
    const startTime = new Date();
    const endTime = new Date();
    endTime.setDate(endTime.getDate() + duration);

    artwork.auction = {
      startTime: startTime,
      endTime: endTime,
      startingPrice: artwork.price,
      currentBid: null,
      highestBidder: null,
      bids: artwork.auction?.bids || [], // Keep existing bids if any
      isActive: true,
      minimumIncrement: artwork.auction?.minimumIncrement || 5,
      winner: null
    };

    // Reset current bid fields
    artwork.currentBid = null;
    artwork.highestBidder = null;

    await artwork.save();

    res.json({
      success: true,
      message: 'Auction started successfully',
      auction: {
        startTime: artwork.auction.startTime,
        endTime: artwork.auction.endTime,
        isActive: artwork.auction.isActive,
        startingPrice: artwork.auction.startingPrice
      }
    });

  } catch (error) {
    console.error('Error starting auction:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while starting auction'
    });
  }
};

// @desc    End an auction manually (Artist only)
// @route   POST /api/auctions/:artworkId/end
// @access  Protected (Artist only)
const endAuction = async (req, res) => {
  try {
    const { artworkId } = req.params;
    const userId = req.user._id;

    // Find the artwork
    const artwork = await Artwork.findById(artworkId)
      .populate('creator', 'username')
      .populate('auction.highestBidder', 'username');

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'Artwork not found'
      });
    }

    // Check if user is the creator of the artwork
    if (artwork.creator._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the artist can end their artwork auction'
      });
    }

    // Check if auction exists and is active
    if (!artwork.auction || !artwork.auction.isActive) {
      return res.status(400).json({
        success: false,
        message: 'No active auction to end'
      });
    }

    // End the auction
    artwork.auction.isActive = false;
    artwork.auction.endTime = new Date(); // Set end time to now

    // If there are bids, set the winner
    if (artwork.auction.bids && artwork.auction.bids.length > 0) {
      artwork.auction.winner = artwork.auction.highestBidder;
    }

    await artwork.save();

    // Format response
    const auctionResult = {
      endedAt: artwork.auction.endTime,
      finalBid: artwork.auction.currentBid,
      winner: artwork.auction.highestBidder?.username || null,
      totalBids: artwork.auction.bids ? artwork.auction.bids.length : 0
    };

    res.json({
      success: true,
      message: 'Auction ended successfully',
      auctionResult
    });

  } catch (error) {
    console.error('Error ending auction:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while ending auction'
    });
  }
};

// @desc    Get bid history for an artwork
// @route   GET /api/auctions/:artworkId/bids
// @access  Public
const getBidHistory = async (req, res) => {
  try {
    const { artworkId } = req.params;
    const { limit = 20, page = 1 } = req.query;

    const artwork = await Artwork.findById(artworkId)
      .populate('auction.bids.bidder', 'username')
      .populate('auction.highestBidder', 'username');

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'Artwork not found'
      });
    }

    if (!artwork.auction || !artwork.auction.bids) {
      return res.json({
        success: true,
        bids: [],
        auctionInfo: null
      });
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const bids = artwork.auction.bids.slice(startIndex, endIndex);

    const formattedBids = bids.map(bid => ({
      id: bid._id,
      amount: bid.amount,
      bidder: {
        username: bid.bidder.username,
        _id: bid.bidder._id
      },
      timestamp: bid.timestamp
    }));

    res.json({
      success: true,
      bids: formattedBids,
      pagination: {
        currentPage: parseInt(page),
        totalBids: artwork.auction.bids.length,
        totalPages: Math.ceil(artwork.auction.bids.length / limit)
      }
    });
  } catch (error) {
    console.error('Error getting bid history:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bid history'
    });
  }
};

// @desc    Get auction info for an artwork
// @route   GET /api/auctions/:artworkId/info
// @access  Public
const getAuctionInfo = async (req, res) => {
  try {
    const { artworkId } = req.params;

    const artwork = await Artwork.findById(artworkId)
      .populate('auction.highestBidder', 'username')
      .populate('creator', 'username');

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'Artwork not found'
      });
    }

    if (!artwork.auction) {
      return res.json({
        success: true,
        auctionInfo: null,
        message: 'No auction configured for this artwork'
      });
    }

    const now = new Date();
    const endTime = new Date(artwork.auction.endTime);
    const isActive = artwork.auction.isActive && now <= endTime;

    const auctionInfo = {
      artworkId: artwork._id,
      title: artwork.title,
      creator: artwork.creator.username,
      startTime: artwork.auction.startTime,
      endTime: artwork.auction.endTime,
      startingPrice: artwork.auction.startingPrice,
      currentBid: artwork.auction.currentBid,
      highestBidder: artwork.auction.highestBidder?.username,
      isActive: isActive,
      minimumIncrement: artwork.auction.minimumIncrement || 5,
      totalBids: artwork.auction.bids ? artwork.auction.bids.length : 0
    };

    res.json({
      success: true,
      auctionInfo
    });
  } catch (error) {
    console.error('Error getting auction info:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching auction info'
    });
  }
};

module.exports = {
  placeBid,
  startAuction,  // NEW
  endAuction,    // NEW
  getBidHistory,
  getAuctionInfo
};