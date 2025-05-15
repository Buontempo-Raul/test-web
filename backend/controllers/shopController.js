// backend/controllers/shopController.js
const Order = require('../models/Order');
const Artwork = require('../models/Artwork');

// @desc    Create new order
// @route   POST /api/shop/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items'
      });
    }

    // Create order
    const order = new Order({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice
    });

    const createdOrder = await order.save();

    // Update artwork status to sold
    for (const item of orderItems) {
      await Artwork.findByIdAndUpdate(item.artwork, {
        isSold: true,
        forSale: false
      });
    }

    res.status(201).json({
      success: true,
      order: createdOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/shop/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'username email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order belongs to user
    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/shop/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id });
    
    res.json({
      success: true,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update order to paid
// @route   PUT /api/shop/orders/:id/pay
// @access  Private
const updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.email_address
    };

    const updatedOrder = await order.save();

    res.json({
      success: true,
      order: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update order to delivered
// @route   PUT /api/shop/orders/:id/deliver
// @access  Private
const updateOrderToDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order
    order.isDelivered = true;
    order.deliveredAt = Date.now();

    const updatedOrder = await order.save();

    res.json({
      success: true,
      order: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get featured artworks for shop
// @route   GET /api/shop/featured
// @access  Public
const getFeaturedArtworks = async (req, res) => {
  try {
    const featuredArtworks = await Artwork.find({
      forSale: true,
      isSold: false
    })
      .sort({ views: -1, likes: -1 })
      .limit(6)
      .populate('creator', 'username profileImage');

    // Format image URLs
    const formattedArtworks = featuredArtworks.map(artwork => {
      const artworkObj = artwork.toObject();
      artworkObj.images = artwork.images.map(image => {
        return `${req.protocol}://${req.get('host')}/${image}`;
      });
      
      if (artworkObj.creator && artworkObj.creator.profileImage) {
        artworkObj.creator.profileImage = `${req.protocol}://${req.get('host')}/${artworkObj.creator.profileImage}`;
      }
      
      return artworkObj;
    });

    res.json({
      success: true,
      artworks: formattedArtworks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


module.exports = {
  createOrder,
  getOrderById,
  getMyOrders,
  updateOrderToPaid,
  updateOrderToDelivered,
  getFeaturedArtworks
};