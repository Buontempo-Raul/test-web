// src/pages/Shop/ProductDetail.js - Updated part with useCart
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './ProductDetail.css';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart'; // Import useCart hook

const ProductDetail = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart(); // Use the cart context
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  // Mock products data (this would come from your API in a real application)
  const mockProducts = [
    {
      id: '1',
      title: 'Abstract Harmony',
      description: 'A vibrant exploration of color and form. This original abstract painting features dynamic brushstrokes and a harmonious color palette that creates a sense of movement and emotion. Each element in this composition works together to create a visually striking piece that will be a focal point in any space.',
      longDescription: 'This original abstract painting explores the relationship between color, form, and emotion. Created with high-quality acrylic paints on stretched canvas, the artwork features vibrant colors and expressive brushstrokes that convey a sense of energy and harmony. The artist has layered various hues to create depth and visual interest, making it a captivating piece from any viewing angle. The painting comes ready to hang, with finished edges and a protective varnish to ensure its longevity.',
      price: 299.99,
      discountPrice: null,
      images: [
        'https://via.placeholder.com/600x800?text=Abstract+Harmony+1',
        'https://via.placeholder.com/600x800?text=Abstract+Harmony+2',
        'https://via.placeholder.com/600x800?text=Abstract+Harmony+3'
      ],
      category: 'painting',
      tags: ['abstract', 'original', 'acrylic', 'contemporary'],
      dimensions: {
        width: 36,
        height: 48,
        depth: 1.5,
        unit: 'in'
      },
      weight: 5.2,
      materials: ['Acrylic paint', 'Canvas', 'Wood stretcher bars'],
      stock: 1,
      sku: 'AH-001',
      creator: {
        id: '1',
        name: 'Sophia Reynolds',
        username: 'artistic_soul',
        profileImage: 'https://via.placeholder.com/50x50',
        bio: 'Contemporary artist specializing in abstract expressionism'
      },
      reviews: [
        {
          id: '101',
          user: 'Emily W.',
          rating: 5,
          comment: 'Absolutely stunning piece! The colors are even more vibrant in person.',
          date: '2025-02-15'
        },
        {
          id: '102',
          user: 'Michael T.',
          rating: 4,
          comment: 'Beautiful artwork, exactly as described. Arrived well-packaged.',
          date: '2025-03-03'
        }
      ],
      avgRating: 4.5,
      reviewCount: 2,
      related: ['2', '5', '7']
    },
    {
      id: '2',
      title: 'Handmade Ceramic Vase',
      description: 'Elegant handmade ceramic vase, perfect for any home.',
      longDescription: 'This handcrafted ceramic vase showcases the beauty of traditional pottery techniques with a modern aesthetic. Each piece is individually thrown on a potter\'s wheel, giving it unique character and subtle variations that make it one-of-a-kind. The matte finish highlights the natural texture of the clay, while the minimalist design allows it to complement any interior style. Perfect for displaying fresh or dried flower arrangements, or simply as a standalone decorative piece.',
      price: 79.99,
      discountPrice: 69.99,
      images: [
        'https://via.placeholder.com/600x800?text=Ceramic+Vase+1',
        'https://via.placeholder.com/600x800?text=Ceramic+Vase+2'
      ],
      category: 'crafts',
      tags: ['ceramic', 'handmade', 'pottery', 'home decor'],
      dimensions: {
        width: 6,
        height: 12,
        depth: 6,
        unit: 'in'
      },
      weight: 3.0,
      materials: ['Stoneware clay', 'Glaze'],
      stock: 8,
      sku: 'CV-002',
      creator: {
        id: '5',
        name: 'Elena Martinez',
        username: 'ceramic_studio',
        profileImage: 'https://via.placeholder.com/50x50',
        bio: 'Ceramicist specializing in functional pottery and decorative pieces'
      },
      reviews: [
        {
          id: '201',
          user: 'Sarah L.',
          rating: 5,
          comment: 'Beautiful craftsmanship! This vase is even more gorgeous in person.',
          date: '2025-03-18'
        }
      ],
      avgRating: 5.0,
      reviewCount: 1,
      related: ['4', '8', '12']
    }
  ];

  useEffect(() => {
    // In a real app, fetch product data from API
    // This simulates an API call with our mock data
    setIsLoading(true);
    
    setTimeout(() => {
      const foundProduct = mockProducts.find(product => product.id === id);
      
      if (foundProduct) {
        setProduct(foundProduct);
        document.title = `${foundProduct.title} | Uncreated`;
      } else {
        // If product not found, navigate to 404 page
        navigate('/not-found');
      }
      
      setIsLoading(false);
    }, 800);
  }, [id, navigate]);

  const handleQuantityChange = (amount) => {
    const newQuantity = quantity + amount;
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 10)) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      alert('Please log in to add items to your cart');
      return;
    }
    
    setIsAddingToCart(true);
    
    // Create a cart item object from the product
    const cartItem = {
      id: product.id,
      title: product.title,
      price: product.discountPrice || product.price,
      image: product.images[0],
      quantity: quantity
    };
    
    // Add to cart using our context function
    addToCart(cartItem);
    
    // Simulate a small delay for user feedback
    setTimeout(() => {
      setIsAddingToCart(false);
      alert(`Added ${quantity} ${quantity === 1 ? 'item' : 'items'} to your cart!`);
    }, 500);
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      alert('Please log in to purchase items');
      return;
    }
    
    // Add to cart first
    const cartItem = {
      id: product.id,
      title: product.title,
      price: product.discountPrice || product.price,
      image: product.images[0],
      quantity: quantity
    };
    
    addToCart(cartItem);
    
    // Then navigate to checkout
    alert(`Proceeding to checkout with ${quantity} ${quantity === 1 ? 'item' : 'items'}!`);
    // navigate('/checkout'); // Uncomment when you have a checkout page
  };

  if (isLoading) {
    return (
      <div className="product-loading">
        <div className="spinner"></div>
        <p>Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-not-found">
        <h2>Product Not Found</h2>
        <p>The product you're looking for doesn't exist or has been removed.</p>
        <Link to="/shop" className="back-to-shop">Back to Shop</Link>
      </div>
    );
  }

  return (
    <div className="product-detail-container">
      <div className="product-breadcrumbs">
        <Link to="/">Home</Link> / 
        <Link to="/shop">Shop</Link> / 
        <Link to={`/shop/category/${product.category}`}>{product.category.charAt(0).toUpperCase() + product.category.slice(1)}</Link> / 
        <span>{product.title}</span>
      </div>
      
      <div className="product-main">
        <div className="product-gallery">
          <div className="main-image-container">
            <motion.img 
              src={product.images[activeImage]} 
              alt={product.title}
              className="main-image"
              key={activeImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          </div>
          
          {product.images.length > 1 && (
            <div className="image-thumbnails">
              {product.images.map((image, index) => (
                <div 
                  key={index}
                  className={`thumbnail ${index === activeImage ? 'active' : ''}`}
                  onClick={() => setActiveImage(index)}
                >
                  <img src={image} alt={`${product.title} thumbnail ${index + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="product-info">
          <h1 className="product-title">{product.title}</h1>
          
          <div className="product-creator">
            <Link to={`/profile/${product.creator.username}`} className="creator-link">
              <img 
                src={product.creator.profileImage} 
                alt={product.creator.name} 
                className="creator-image"
              />
              <span className="creator-name">By {product.creator.name}</span>
            </Link>
          </div>
          
          <div className="product-rating">
            <div className="stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <span 
                  key={star} 
                  className={`star ${star <= Math.round(product.avgRating) ? 'filled' : ''}`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="review-count">
              {product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'}
            </span>
          </div>
          
          <div className="product-price">
            {product.discountPrice ? (
              <>
                <span className="original-price">${product.price.toFixed(2)}</span>
                <span className="discount-price">${product.discountPrice.toFixed(2)}</span>
              </>
            ) : (
              <span className="current-price">${product.price.toFixed(2)}</span>
            )}
          </div>
          
          <p className="product-description">{product.description}</p>
          
          <div className="product-actions">
            <div className="quantity-selector">
              <span>Quantity:</span>
              <div className="quantity-controls">
                <button 
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="quantity-button"
                >
                  -
                </button>
                <span className="quantity-value">{quantity}</span>
                <button 
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.stock}
                  className="quantity-button"
                >
                  +
                </button>
              </div>
              <span className="stock-info">
                {product.stock > 0 ? (
                  product.stock < 5 ? (
                    <span className="low-stock">Only {product.stock} left in stock!</span>
                  ) : (
                    <span className="in-stock">In stock</span>
                  )
                ) : (
                  <span className="out-of-stock">Out of stock</span>
                )}
              </span>
            </div>
            
            <div className="purchase-buttons">
              <button 
                className="add-to-cart-button"
                onClick={handleAddToCart}
                disabled={isAddingToCart || product.stock === 0}
              >
                {isAddingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
              <button 
                className="buy-now-button"
                onClick={handleBuyNow}
                disabled={product.stock === 0}
              >
                Buy Now
              </button>
            </div>
          </div>
          
          <div className="product-meta">
            <div className="meta-item">
              <span className="meta-label">SKU:</span>
              <span className="meta-value">{product.sku}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Category:</span>
              <Link to={`/shop/category/${product.category}`} className="meta-value category-link">
                {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
              </Link>
            </div>
            <div className="meta-item tags">
              <span className="meta-label">Tags:</span>
              <div className="tag-list">
                {product.tags.map((tag, index) => (
                  <Link key={index} to={`/shop?tag=${tag}`} className="tag">
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="product-details">
        <div className="details-tabs">
          <button className="tab-button active">Description</button>
          <button className="tab-button">Specifications</button>
          <button className="tab-button">Reviews ({product.reviewCount})</button>
        </div>
        
        <div className="tab-content">
          <div className="description-tab">
            <h2>About this item</h2>
            <p>{product.longDescription}</p>
          </div>
          
          <div className="specifications-section">
            <h3>Specifications</h3>
            <div className="specifications-grid">
              <div className="spec-item">
                <h4>Dimensions</h4>
                <p>{product.dimensions.width} × {product.dimensions.height} × {product.dimensions.depth} {product.dimensions.unit}</p>
              </div>
              <div className="spec-item">
                <h4>Weight</h4>
                <p>{product.weight} lbs</p>
              </div>
              <div className="spec-item">
                <h4>Materials</h4>
                <ul>
                  {product.materials.map((material, index) => (
                    <li key={index}>{material}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="customer-reviews">
        <h3>Customer Reviews</h3>
        
        {product.reviews.length > 0 ? (
          <div className="reviews-list">
            {product.reviews.map((review) => (
              <div key={review.id} className="review-item">
                <div className="review-header">
                  <div className="review-user">{review.user}</div>
                  <div className="review-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span 
                        key={star} 
                        className={`star ${star <= review.rating ? 'filled' : ''}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <div className="review-date">{review.date}</div>
                </div>
                <div className="review-content">
                  <p>{review.comment}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-reviews">
            <p>This product has not been reviewed yet. Be the first to leave a review!</p>
          </div>
        )}
        
        {isAuthenticated && (
          <button className="write-review-button">
            Write a Review
          </button>
        )}
      </div>
      
      <div className="related-products">
        <h3>You May Also Like</h3>
        <div className="related-products-grid">
          {mockProducts.filter(relatedProduct => 
            relatedProduct.id !== product.id
          ).map((relatedProduct) => (
            <Link 
              key={relatedProduct.id} 
              to={`/shop/product/${relatedProduct.id}`}
              className="related-product-card"
            >
              <div className="related-product-image">
                <img src={relatedProduct.images[0]} alt={relatedProduct.title} />
              </div>
              <div className="related-product-info">
                <h4>{relatedProduct.title}</h4>
                <div className="related-product-price">
                  {relatedProduct.discountPrice ? (
                    <>
                      <span className="original-price">${relatedProduct.price.toFixed(2)}</span>
                      <span className="discount-price">${relatedProduct.discountPrice.toFixed(2)}</span>
                    </>
                  ) : (
                    <span className="current-price">${relatedProduct.price.toFixed(2)}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;