// src/pages/Admin/Orders.js
import React, { useState, useEffect } from 'react';
import './Admin.css';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Fetch orders from API
    const fetchOrders = async () => {
      try {
        // Simulated API call
        setTimeout(() => {
          const mockOrders = [
            { 
              id: 'ORD-001', 
              customer: 'John Doe',
              email: 'john@example.com',
              date: '2024-04-12',
              total: 249.98,
              status: 'completed',
              items: [
                { id: '1', name: 'Abstract Painting', quantity: 1, price: 199.99 },
                { id: '3', name: 'Digital Art Print', quantity: 1, price: 49.99 }
              ],
              shippingAddress: '123 Main St, New York, NY 10001',
              paymentMethod: 'Credit Card'
            },
            { 
              id: 'ORD-002', 
              customer: 'Jane Smith',
              email: 'jane@example.com',
              date: '2024-04-10',
              total: 79.99,
              status: 'processing',
              items: [
                { id: '2', name: 'Handmade Ceramic Vase', quantity: 1, price: 79.99 }
              ],
              shippingAddress: '456 Elm St, Boston, MA 02108',
              paymentMethod: 'PayPal'
            },
            { 
              id: 'ORD-003', 
              customer: 'Robert Johnson',
              email: 'robert@example.com',
              date: '2024-04-08',
              total: 349.99,
              status: 'shipped',
              items: [
                { id: '4', name: 'Handwoven Tapestry', quantity: 1, price: 349.99 }
              ],
              shippingAddress: '789 Oak Ave, Chicago, IL 60007',
              paymentMethod: 'Credit Card'
            },
            { 
              id: 'ORD-004', 
              customer: 'Maria Garcia',
              email: 'maria@example.com',
              date: '2024-04-05',
              total: 99.98,
              status: 'cancelled',
              items: [
                { id: '3', name: 'Digital Art Print', quantity: 2, price: 49.99 }
              ],
              shippingAddress: '321 Pine Rd, Miami, FL 33101',
              paymentMethod: 'PayPal'
            },
            { 
              id: 'ORD-005', 
              customer: 'David Wilson',
              email: 'david@example.com',
              date: '2024-04-01',
              total: 429.97,
              status: 'completed',
              items: [
                { id: '3', name: 'Digital Art Print', quantity: 1, price: 49.99 },
                { id: '5', name: 'Portrait Sketch', quantity: 1, price: 149.99 },
                { id: '2', name: 'Handmade Ceramic Vase', quantity: 2, price: 79.99 }
              ],
              shippingAddress: '555 Cedar Ln, Seattle, WA 98101',
              paymentMethod: 'Credit Card'
            }
          ];
          setOrders(mockOrders);
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
  };

  const handleCloseDetails = () => {
    setSelectedOrder(null);
  };

  const handleUpdateStatus = (orderId, newStatus) => {
    const updatedOrders = orders.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus } 
        : order
    );
    setOrders(updatedOrders);
    
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  // Filter orders based on search term and status filter
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || order.status === filter;
    
    return matchesSearch && matchesFilter;
  });

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case 'completed':
        return 'status-completed';
      case 'processing':
        return 'status-processing';
      case 'shipped':
        return 'status-shipped';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  if (isLoading) {
    return <div className="admin-loading">Loading orders...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Manage Orders</h1>
        <div className="filter-container">
          <select 
            value={filter} 
            onChange={handleFilterChange}
            className="status-filter"
          >
            <option value="all">All Orders</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="admin-search">
        <input
          type="text"
          placeholder="Search orders by ID, customer name, or email..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      {selectedOrder ? (
        <div className="order-details">
          <div className="order-details-header">
            <h2>Order Details: {selectedOrder.id}</h2>
            <button className="admin-button secondary" onClick={handleCloseDetails}>
              Back to Orders
            </button>
          </div>
          
          <div className="order-info-grid">
            <div className="order-info-card">
              <h3>Customer Information</h3>
              <p><strong>Name:</strong> {selectedOrder.customer}</p>
              <p><strong>Email:</strong> {selectedOrder.email}</p>
              <p><strong>Shipping Address:</strong> {selectedOrder.shippingAddress}</p>
              <p><strong>Payment Method:</strong> {selectedOrder.paymentMethod}</p>
            </div>
            
            <div className="order-info-card">
              <h3>Order Information</h3>
              <p><strong>Order ID:</strong> {selectedOrder.id}</p>
              <p><strong>Date:</strong> {selectedOrder.date}</p>
              <p><strong>Total:</strong> ${selectedOrder.total.toFixed(2)}</p>
              <p>
                <strong>Status:</strong> 
                <span className={`status-badge ${getStatusClass(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </p>
              
              <div className="status-actions">
                <p><strong>Update Status:</strong></p>
                <div className="status-buttons">
                  <button 
                    className={`status-button processing ${selectedOrder.status === 'processing' ? 'active' : ''}`}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'processing')}
                    disabled={selectedOrder.status === 'processing'}
                  >
                    Processing
                  </button>
                  <button 
                    className={`status-button shipped ${selectedOrder.status === 'shipped' ? 'active' : ''}`}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'shipped')}
                    disabled={selectedOrder.status === 'shipped'}
                  >
                    Shipped
                  </button>
                  <button 
                    className={`status-button completed ${selectedOrder.status === 'completed' ? 'active' : ''}`}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                    disabled={selectedOrder.status === 'completed'}
                  >
                    Completed
                  </button>
                  <button 
                    className={`status-button cancelled ${selectedOrder.status === 'cancelled' ? 'active' : ''}`}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                    disabled={selectedOrder.status === 'cancelled'}
                  >
                    Cancelled
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="order-items">
            <h3>Order Items</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Product Name</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items.map((item) => (
                  <tr key={`${selectedOrder.id}-${item.id}`}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>${item.price.toFixed(2)}</td>
                    <td>{item.quantity}</td>
                    <td>${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="order-total">
                  <td colSpan="4" className="text-right"><strong>Order Total:</strong></td>
                  <td><strong>${selectedOrder.total.toFixed(2)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map(order => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.customer}</td>
                    <td>{order.date}</td>
                    <td>${order.total.toFixed(2)}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="action-buttons">
                      <button
                        className="view-button"
                        onClick={() => handleViewDetails(order)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-results">
                    No orders found matching your search.
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

export default AdminOrders;