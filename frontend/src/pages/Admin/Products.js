// src/pages/Admin/Products.js
import React, { useState, useEffect } from 'react';
import './Admin.css';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'art',
    stock: '',
    featured: false
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Fetch products from API
    const fetchProducts = async () => {
      try {
        // Simulated API call
        setTimeout(() => {
          const mockProducts = [
            { 
              id: '1', 
              title: 'Abstract Painting', 
              description: 'Beautiful abstract painting with vibrant colors.',
              price: 299.99,
              category: 'art',
              stock: 5,
              featured: true,
              createdAt: '2024-02-10',
              imageUrl: 'abstract-painting.jpg'
            },
            { 
              id: '2', 
              title: 'Handmade Ceramic Vase', 
              description: 'Elegant handmade ceramic vase, perfect for any home.',
              price: 79.99,
              category: 'crafts',
              stock: 12,
              featured: false,
              createdAt: '2024-02-15',
              imageUrl: 'ceramic-vase.jpg'
            },
            { 
              id: '3', 
              title: 'Digital Art Print', 
              description: 'High-quality digital art print on premium paper.',
              price: 49.99,
              category: 'digital',
              stock: 25,
              featured: false,
              createdAt: '2024-03-01',
              imageUrl: 'digital-print.jpg'
            },
            { 
              id: '4', 
              title: 'Handwoven Tapestry', 
              description: 'Intricate handwoven tapestry made with natural fibers.',
              price: 349.99,
              category: 'textiles',
              stock: 3,
              featured: true,
              createdAt: '2024-03-12',
              imageUrl: 'tapestry.jpg'
            },
            { 
              id: '5', 
              title: 'Portrait Sketch', 
              description: 'Custom portrait sketch drawn by professional artist.',
              price: 149.99,
              category: 'art',
              stock: 0,
              featured: false,
              createdAt: '2024-03-20',
              imageUrl: 'portrait.jpg'
            }
          ];
          setProducts(mockProducts);
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching products:', error);
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleEditClick = (product) => {
    setSelectedProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price,
      category: product.category,
      stock: product.stock,
      featured: product.featured
    });
    setIsEditing(true);
  };

  const handleCreateNew = () => {
    setSelectedProduct(null);
    setFormData({
      title: '',
      description: '',
      price: '',
      category: 'art',
      stock: '',
      featured: false
    });
    setIsEditing(true);
  };

  const handleFormChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedProduct(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert string values to appropriate types
    const processedData = {
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock, 10)
    };
    
    if (selectedProduct) {
      // Edit existing product
      const updatedProducts = products.map(product => 
        product.id === selectedProduct.id 
          ? { 
              ...product, 
              ...processedData,
              updatedAt: new Date().toISOString().split('T')[0]
            } 
          : product
      );
      setProducts(updatedProducts);
    } else {
      // Create new product
      const newProduct = {
        id: Date.now().toString(),
        ...processedData,
        createdAt: new Date().toISOString().split('T')[0],
        imageUrl: 'placeholder.jpg' // In a real app, you'd handle image upload
      };
      setProducts([...products, newProduct]);
    }
    
    setIsEditing(false);
    setSelectedProduct(null);
  };

  const handleDelete = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(product => product.id !== productId));
    }
  };

  // Filter products based on search term
  const filteredProducts = products.filter(product => 
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="admin-loading">Loading products...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Manage Products</h1>
        <button className="admin-button" onClick={handleCreateNew}>Add New Product</button>
      </div>

      <div className="admin-search">
        <input
          type="text"
          placeholder="Search products by title, description, or category..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      {isEditing ? (
        <div className="admin-form-container">
          <h2>{selectedProduct ? 'Edit Product' : 'Create New Product'}</h2>
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Product Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                rows="4"
                required
              ></textarea>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Price ($)</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleFormChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="stock">Stock</label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={formData.stock}
                  onChange={handleFormChange}
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                required
              >
                <option value="art">Art</option>
                <option value="crafts">Crafts</option>
                <option value="digital">Digital</option>
                <option value="textiles">Textiles</option>
                <option value="jewelry">Jewelry</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-checkbox">
              <input
                type="checkbox"
                id="featured"
                name="featured"
                checked={formData.featured}
                onChange={handleFormChange}
              />
              <label htmlFor="featured">Featured Product</label>
            </div>

            <div className="form-actions">
              <button type="submit" className="admin-button">
                {selectedProduct ? 'Update Product' : 'Create Product'}
              </button>
              <button type="button" className="admin-button secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td>{product.title}</td>
                    <td>{product.category}</td>
                    <td>${product.price.toFixed(2)}</td>
                    <td className={product.stock === 0 ? 'out-of-stock' : ''}>
                      {product.stock > 0 ? product.stock : 'Out of stock'}
                    </td>
                    <td>{product.featured ? 'Yes' : 'No'}</td>
                    <td className="action-buttons">
                      <button
                        className="edit-button"
                        onClick={() => handleEditClick(product)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => handleDelete(product.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-results">
                    No products found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;