// src/pages/Admin/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Admin.css';
import { useAuth } from '../../hooks/useAuth';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    revenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    // Fetch admin dashboard data
    const fetchDashboardData = async () => {
      try {
        // This would normally come from your API
        // For now, we'll simulate the data
        setTimeout(() => {
          setStats({
            totalUsers: 120,
            totalProducts: 45,
            totalOrders: 230,
            revenue: 15780
          });
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <div className="admin-loading">Loading dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      <h1>Welcome, {currentUser?.username || 'Admin'}</h1>
      <p className="dashboard-subtitle">Here's an overview of your platform's performance</p>
      
      <div className="admin-stats">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-value">{stats.totalUsers}</p>
        </div>
        <div className="stat-card">
          <h3>Total Products</h3>
          <p className="stat-value">{stats.totalProducts}</p>
        </div>
        <div className="stat-card">
          <h3>Total Orders</h3>
          <p className="stat-value">{stats.totalOrders}</p>
        </div>
        <div className="stat-card">
          <h3>Revenue</h3>
          <p className="stat-value">${stats.revenue.toLocaleString()}</p>
        </div>
      </div>

      <div className="admin-actions-section">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <Link to="/admin/users" className="admin-button">Manage Users</Link>
          <Link to="/admin/products" className="admin-button">Manage Products</Link>
          <Link to="/admin/orders" className="admin-button">View Orders</Link>
          <Link to="/admin/event-requests" className="admin-button">Review Event Requests</Link>
          <Link to="/admin/settings" className="admin-button">Site Settings</Link>
        </div>
      </div>

      <div className="recent-activity-section">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          <div className="activity-item">
            <p className="activity-time">2 hours ago</p>
            <p className="activity-description">New user registered: John Doe</p>
          </div>
          <div className="activity-item">
            <p className="activity-time">5 hours ago</p>
            <p className="activity-description">New order #1234 placed: $129.99</p>
          </div>
          <div className="activity-item">
            <p className="activity-time">Yesterday</p>
            <p className="activity-description">New event request submitted: "Modern Art Workshop"</p>
          </div>
          <div className="activity-item">
            <p className="activity-time">2 days ago</p>
            <p className="activity-description">Product "Abstract Art" updated</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;