import React, { useState, useEffect } from 'react';

// Import the admin API service
const adminAPI = {
  getDashboardStats: () => {
    return fetch('/api/admin/dashboard/stats', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    }).then(res => res.json());
  },
  
  getRecentActivity: (limit = 10) => {
    return fetch(`/api/admin/dashboard/activity?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    }).then(res => res.json());
  }
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalArtworks: 0,
    totalOrders: 0,
    activeAuctions: 0,
    pendingArtistRequests: 0,
    revenue: 0
  });
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // Mock current user for demo
  const currentUser = { username: 'admin' };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch dashboard stats and recent activity from real API
      const [statsResponse, activityResponse] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getRecentActivity(10)
      ]);

      if (statsResponse.success) {
        setStats(statsResponse.stats);
      } else {
        throw new Error(statsResponse.message || 'Failed to fetch stats');
      }

      if (activityResponse.success) {
        setActivities(activityResponse.activities);
      } else {
        // If activity fails, just log it but don't fail the whole dashboard
        console.warn('Failed to fetch activity:', activityResponse.message);
        setActivities([]);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data. Please try again.');
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now - time) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - time) / (1000 * 60));
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_registration':
        return '👤';
      case 'order_placed':
        return '🛒';
      case 'post_created':
        return '🎨';
      case 'artwork_created':
        return '🖼️';
      case 'auction_started':
        return '🔨';
      default:
        return '📝';
    }
  };

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <div className="error-message">
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {currentUser?.username || 'Admin'}!</h1>
        <p className="dashboard-subtitle">Here's an overview of your platform's performance</p>
      </div>
      
      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <p className="stat-value">{stats.totalUsers.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>Total Posts</h3>
            <p className="stat-value">{stats.totalPosts.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🎨</div>
          <div className="stat-content">
            <h3>Total Artworks</h3>
            <p className="stat-value">{stats.totalArtworks.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🛒</div>
          <div className="stat-content">
            <h3>Total Orders</h3>
            <p className="stat-value">{stats.totalOrders.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🔨</div>
          <div className="stat-content">
            <h3>Active Auctions</h3>
            <p className="stat-value">{stats.activeAuctions.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Total Revenue</h3>
            <p className="stat-value">{formatCurrency(stats.revenue)}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <div className="admin-button">
              <span className="button-icon">👥</span>
              Manage Users
            </div>
            <div className="admin-button">
              <span className="button-icon">📝</span>
              Manage Posts
            </div>
            <div className="admin-button">
              <span className="button-icon">🎨</span>
              Manage Artworks
            </div>
            <div className="admin-button">
              <span className="button-icon">🔨</span>
              View Auctions
            </div>
            <div className="admin-button">
              <span className="button-icon">✋</span>
              Artist Requests
              {stats.pendingArtistRequests > 0 && (
                <span className="notification-badge">{stats.pendingArtistRequests}</span>
              )}
            </div>
            <div className="admin-button">
              <span className="button-icon">⚙️</span>
              Site Settings
            </div>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            {activities.length > 0 ? (
              activities.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="activity-content">
                    <p className="activity-description">{activity.description}</p>
                    <p className="activity-time">{formatTimeAgo(activity.timestamp)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-activity">
                <p>No recent activity to display.</p>
              </div>
            )}
          </div>
          
          {activities.length > 0 && (
            <div className="view-all-activity">
              <button onClick={fetchDashboardData} className="refresh-button">
                Refresh Activity
              </button>
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .admin-dashboard {
          padding: 0;
        }

        .dashboard-header {
          margin-bottom: 2rem;
        }

        .dashboard-header h1 {
          margin: 0 0 0.5rem 0;
          color: #2c3e50;
          font-size: 2rem;
        }

        .dashboard-subtitle {
          color: #7f8c8d;
          margin: 0;
        }

        .admin-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          border: 1px solid #e9ecef;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .stat-icon {
          font-size: 2.5rem;
          opacity: 0.8;
        }

        .stat-content h3 {
          margin: 0 0 0.5rem 0;
          color: #6c757d;
          font-size: 0.9rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-value {
          margin: 0;
          font-size: 2rem;
          font-weight: 700;
          color: #2c3e50;
        }

        .dashboard-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .dashboard-section {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          border: 1px solid #e9ecef;
        }

        .dashboard-section h2 {
          margin: 0 0 1.5rem 0;
          color: #2c3e50;
          font-size: 1.5rem;
        }

        .action-buttons {
          display: grid;
          gap: 1rem;
        }

        .admin-button {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }

        .admin-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        .button-icon {
          font-size: 1.2rem;
        }

        .notification-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #e74c3c;
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: bold;
        }

        .activity-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .activity-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem 0;
          border-bottom: 1px solid #eee;
        }

        .activity-item:last-child {
          border-bottom: none;
        }

        .activity-icon {
          font-size: 1.5rem;
          margin-top: 0.25rem;
        }

        .activity-content {
          flex: 1;
        }

        .activity-description {
          margin: 0 0 0.25rem 0;
          color: #2c3e50;
          font-weight: 500;
        }

        .activity-time {
          margin: 0;
          color: #7f8c8d;
          font-size: 0.9rem;
        }

        .no-activity {
          text-align: center;
          padding: 2rem;
          color: #7f8c8d;
        }

        .refresh-button {
          background: #3498db;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s ease;
          margin-top: 1rem;
          width: 100%;
        }

        .refresh-button:hover {
          background: #2980b9;
        }

        .admin-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .admin-error {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
        }

        .error-message {
          text-align: center;
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          border: 1px solid #e74c3c;
        }

        .error-message h3 {
          color: #e74c3c;
          margin: 0 0 1rem 0;
        }

        .retry-button {
          background: #e74c3c;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 1rem;
        }

        .retry-button:hover {
          background: #c0392b;
        }

        @media (max-width: 768px) {
          .admin-stats {
            grid-template-columns: 1fr;
          }

          .dashboard-content {
            grid-template-columns: 1fr;
          }

          .stat-card {
            padding: 1rem;
          }

          .dashboard-section {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;