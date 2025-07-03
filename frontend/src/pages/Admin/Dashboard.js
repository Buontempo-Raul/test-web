// Admin Dashboard with Real Data - frontend/src/pages/Admin/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalArtworks: 0,
    activeAuctions: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [dataSource, setDataSource] = useState('loading'); // 'api', 'mock', or 'loading'

  // API helper function with better error handling
  const fetchWithFallback = async (url, options = {}) => {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      // Check if we got HTML instead of JSON (proxy issue)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Backend API not reachable - check proxy configuration');
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API call failed for ${url}:`, error);
      throw error;
    }
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Fetching real dashboard data...');

      // Test backend connectivity first
      await fetchWithFallback('/api/test');
      console.log('✅ Backend connection successful');

      // Fetch dashboard stats
      const statsResponse = await fetchWithFallback('/api/admin/dashboard/stats');
      
      if (statsResponse.success && statsResponse.stats) {
        setStats(statsResponse.stats);
        setDataSource('api');
        console.log('📊 Real stats loaded:', statsResponse.stats);
      } else {
        throw new Error(statsResponse.message || 'Invalid stats response format');
      }

      setLastUpdated(new Date());
      setIsLoading(false);

    } catch (error) {
      console.warn('❌ API failed, using fallback data:', error.message);
      
      // Fallback to mock data if API fails
      setStats({
        totalUsers: 42,
        totalPosts: 128,
        totalArtworks: 67,
        activeAuctions: 8
      });
      setDataSource('mock');
      setError(`API Error: ${error.message}`);
      setLastUpdated(new Date());
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const refreshStats = () => {
    fetchDashboardData();
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getDataSourceBadge = () => {
    switch (dataSource) {
      case 'api':
        return <span className="badge success">🟢 Live Data</span>;
      case 'mock':
        return <span className="badge warning">🟡 Demo Data</span>;
      default:
        return <span className="badge loading">⚪ Loading...</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h2>Loading Dashboard...</h2>
          <p>Connecting to backend API...</p>
        </div>
        
        <style jsx>{`
          .dashboard-container {
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
          }

          .loading-state {
            text-align: center;
            padding: 4rem 2rem;
          }

          .loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #f0f0f0;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1.5rem auto;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .loading-state h2 {
            color: #2c3e50;
            margin-bottom: 0.5rem;
          }

          .loading-state p {
            color: #666;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>👋 Welcome back, {currentUser?.username || 'Admin'}!</h1>
          <p className="header-subtitle">Platform Overview & Statistics</p>
          <div className="status-row">
            {getDataSourceBadge()}
            {error && <span className="error-indicator">⚠️ {error}</span>}
          </div>
        </div>
        <div className="header-actions">
          <button onClick={refreshStats} className="refresh-btn" disabled={isLoading}>
            🔄 {isLoading ? 'Loading...' : 'Refresh Stats'}
          </button>
        </div>
      </div>

      {/* API Connection Help */}
      {dataSource === 'mock' && (
        <div className="connection-help">
          <h3>🔧 API Connection Issue</h3>
          <p>Dashboard is showing demo data because the backend API is not reachable.</p>
          <details>
            <summary>🛠️ How to fix this</summary>
            <div className="fix-steps">
              <p><strong>1. Make sure your backend is running:</strong></p>
              <code>cd backend && npm run dev</code>
              
              <p><strong>2. Test backend directly:</strong></p>
              <code>Visit: http://localhost:5000/api/test</code>
              
              <p><strong>3. Add proxy to frontend/package.json:</strong></p>
              <code>"proxy": "http://localhost:5000"</code>
              
              <p><strong>4. Restart frontend after adding proxy:</strong></p>
              <code>cd frontend && npm start</code>
            </div>
          </details>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card users">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <div className="stat-number">{stats.totalUsers.toLocaleString()}</div>
            <div className="stat-label">Registered accounts</div>
          </div>
        </div>

        <div className="stat-card posts">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>Posts</h3>
            <div className="stat-number">{stats.totalPosts.toLocaleString()}</div>
            <div className="stat-label">Community posts</div>
          </div>
        </div>

        <div className="stat-card artworks">
          <div className="stat-icon">🎨</div>
          <div className="stat-content">
            <h3>Artworks</h3>
            <div className="stat-number">{stats.totalArtworks.toLocaleString()}</div>
            <div className="stat-label">Published artworks</div>
          </div>
        </div>

        <div className="stat-card auctions">
          <div className="stat-icon">🔨</div>
          <div className="stat-content">
            <h3>Active Auctions</h3>
            <div className="stat-number">{stats.activeAuctions.toLocaleString()}</div>
            <div className="stat-label">Currently running</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>🚀 Quick Actions</h2>
        <div className="action-grid">
          <a href="/admin/users" className="action-card">
            <div className="action-icon">👥</div>
            <h3>Manage Users</h3>
            <p>View and manage user accounts</p>
          </a>

          <a href="/admin/posts" className="action-card">
            <div className="action-icon">📝</div>
            <h3>Review Posts</h3>
            <p>Monitor community content</p>
          </a>

          <a href="/admin/artworks" className="action-card">
            <div className="action-icon">🎨</div>
            <h3>Artwork Gallery</h3>
            <p>Browse published artworks</p>
          </a>

          <a href="/admin/auctions" className="action-card">
            <div className="action-icon">🔨</div>
            <h3>Auction Management</h3>
            <p>Monitor auction activity</p>
          </a>

          <a href="/admin/artist-requests" className="action-card">
            <div className="action-icon">🎭</div>
            <h3>Artist Requests</h3>
            <p>Review new artist applications</p>
          </a>

          <a href="/admin/settings" className="action-card">
            <div className="action-icon">⚙️</div>
            <h3>Settings</h3>
            <p>Configure platform settings</p>
          </a>
        </div>
      </div>

      {/* Footer Info */}
      <div className="dashboard-footer">
        <div className="system-info">
          <span>🕒 Last updated: {formatTime(lastUpdated)}</span>
          <span>💻 Data source: {dataSource === 'api' ? 'Live API' : 'Demo Data'}</span>
          <span>🌐 Environment: Development</span>
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
          background: #f8f9fa;
          min-height: 100vh;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .header-content h1 {
          margin: 0 0 0.5rem 0;
          color: #2c3e50;
          font-size: 2rem;
          font-weight: 700;
        }

        .header-subtitle {
          margin: 0 0 1rem 0;
          color: #666;
          font-size: 1.1rem;
        }

        .status-row {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .badge.success {
          background: #d4edda;
          color: #155724;
        }

        .badge.warning {
          background: #fff3cd;
          color: #856404;
        }

        .badge.loading {
          background: #e2e3e5;
          color: #6c757d;
        }

        .error-indicator {
          font-size: 0.9rem;
          color: #dc3545;
        }

        .refresh-btn {
          background: #667eea;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .refresh-btn:hover:not(:disabled) {
          background: #5a6fd8;
          transform: translateY(-1px);
        }

        .refresh-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .connection-help {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .connection-help h3 {
          margin: 0 0 0.5rem 0;
          color: #856404;
        }

        .connection-help p {
          margin: 0 0 1rem 0;
          color: #856404;
        }

        .fix-steps {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 4px;
        }

        .fix-steps p {
          margin: 0.5rem 0;
          font-weight: 600;
        }

        .fix-steps code {
          display: block;
          background: #2c3e50;
          color: #ecf0f1;
          padding: 0.5rem;
          border-radius: 4px;
          margin: 0.5rem 0 1rem 0;
          font-family: monospace;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          gap: 1.5rem;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .stat-card.users { border-left: 4px solid #3498db; }
        .stat-card.posts { border-left: 4px solid #e74c3c; }
        .stat-card.artworks { border-left: 4px solid #9b59b6; }
        .stat-card.auctions { border-left: 4px solid #f39c12; }

        .stat-icon {
          font-size: 3rem;
          opacity: 0.8;
        }

        .stat-content h3 {
          margin: 0 0 0.5rem 0;
          color: #555;
          font-size: 1rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-number {
          font-size: 2.5rem;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          color: #888;
          font-size: 0.9rem;
        }

        .quick-actions {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          margin-bottom: 2rem;
        }

        .quick-actions h2 {
          margin: 0 0 1.5rem 0;
          color: #2c3e50;
          font-size: 1.5rem;
        }

        .action-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .action-card {
          background: #f8f9fa;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          padding: 1.5rem;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s ease;
          display: block;
        }

        .action-card:hover {
          background: #e9ecef;
          border-color: #667eea;
          transform: translateY(-2px);
          text-decoration: none;
          color: inherit;
        }

        .action-icon {
          font-size: 2rem;
          margin-bottom: 1rem;
        }

        .action-card h3 {
          margin: 0 0 0.5rem 0;
          color: #2c3e50;
          font-size: 1.1rem;
        }

        .action-card p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }

        .dashboard-footer {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .system-info {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
          font-size: 0.9rem;
          color: #666;
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 1rem;
          }

          .dashboard-header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .action-grid {
            grid-template-columns: 1fr;
          }

          .system-info {
            flex-direction: column;
            gap: 0.5rem;
          }

          .header-content h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;