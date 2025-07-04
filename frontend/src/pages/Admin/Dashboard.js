import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    bannedUsers: 0,
    pausedUsers: 0,
    totalArtists: 0,
    totalPosts: 0,
    totalArtworks: 0,
    activeAuctions: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [dataSource, setDataSource] = useState('loading');

  // Safe number formatter that handles undefined/null values
  const safeToLocaleString = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0';
    }
    return Number(value).toLocaleString();
  };

  // API helper function
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
      console.log('🔍 Fetching dashboard data...');

      // Test backend connectivity
      await fetchWithFallback('/api/test');
      console.log('✅ Backend connection successful');

      // Fetch dashboard stats
      const statsResponse = await fetchWithFallback('/api/admin/dashboard/stats');
      
      if (statsResponse.success && statsResponse.stats) {
        // Ensure all required fields exist with default values
        const safeStats = {
          totalUsers: statsResponse.stats.totalUsers || 0,
          activeUsers: statsResponse.stats.activeUsers || 0,
          bannedUsers: statsResponse.stats.bannedUsers || 0,
          pausedUsers: statsResponse.stats.pausedUsers || 0,
          totalArtists: statsResponse.stats.totalArtists || 0,
          totalPosts: statsResponse.stats.totalPosts || 0,
          totalArtworks: statsResponse.stats.totalArtworks || 0,
          activeAuctions: statsResponse.stats.activeAuctions || 0
        };
        
        setStats(safeStats);
        setDataSource('api');
        console.log('📊 Stats loaded:', safeStats);
      } else {
        throw new Error(statsResponse.message || 'Invalid stats response format');
      }

      setLastUpdated(new Date());
      setIsLoading(false);

    } catch (error) {
      console.warn('❌ API failed, using fallback data:', error.message);
      
      // Fallback to mock data
      const fallbackStats = {
        totalUsers: 42,
        activeUsers: 38,
        bannedUsers: 2,
        pausedUsers: 2,
        totalArtists: 15,
        totalPosts: 128,
        totalArtworks: 67,
        activeAuctions: 8
      };
      
      setStats(fallbackStats);
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
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Admin Dashboard</h1>
          <p>Welcome back, {currentUser?.username || 'Admin'}!</p>
          <div className="dashboard-meta">
            <span>Last updated: {formatTime(lastUpdated)}</span>
            {getDataSourceBadge()}
          </div>
        </div>
        <button 
          className="refresh-btn" 
          onClick={refreshStats}
          disabled={isLoading}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Error/Connection Issues */}
      {error && dataSource === 'mock' && (
        <div className="connection-help">
          <h3>⚠️ Using Demo Data</h3>
          <p>Cannot connect to backend API. Here are some common fixes:</p>
          
          <details>
            <summary>🔧 Troubleshooting Steps</summary>
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
            <div className="stat-number">{safeToLocaleString(stats.totalUsers)}</div>
            <div className="stat-sublabel">
              <span className="stat-detail active">🟢 {safeToLocaleString(stats.activeUsers)} Active</span>
              {(stats.bannedUsers > 0 || stats.pausedUsers > 0) && (
                <span className="stat-detail warning">
                  🔴 {safeToLocaleString(stats.bannedUsers)} Banned
                  {stats.pausedUsers > 0 && ` • ⏸️ ${safeToLocaleString(stats.pausedUsers)} Paused`}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="stat-card artists">
          <div className="stat-icon">🎨</div>
          <div className="stat-content">
            <h3>Artists</h3>
            <div className="stat-number">{safeToLocaleString(stats.totalArtists)}</div>
            <div className="stat-label">Verified creators</div>
          </div>
        </div>

        <div className="stat-card posts">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>Posts</h3>
            <div className="stat-number">{safeToLocaleString(stats.totalPosts)}</div>
            <div className="stat-label">Community posts</div>
          </div>
        </div>

        <div className="stat-card artworks">
          <div className="stat-icon">🖼️</div>
          <div className="stat-content">
            <h3>Artworks</h3>
            <div className="stat-number">{safeToLocaleString(stats.totalArtworks)}</div>
            <div className="stat-label">Published artworks</div>
          </div>
        </div>

        <div className="stat-card auctions">
          <div className="stat-icon">🔨</div>
          <div className="stat-content">
            <h3>Active Auctions</h3>
            <div className="stat-number">{safeToLocaleString(stats.activeAuctions)}</div>
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
            <p>View, ban, pause user accounts</p>
          </a>

          <a href="/admin/posts" className="action-card">
            <div className="action-icon">📝</div>
            <h3>Review Posts</h3>
            <p>Monitor community content</p>
          </a>

          <a href="/admin/artworks" className="action-card">
            <div className="action-icon">🎨</div>
            <h3>Artwork Gallery</h3>
            <p>Manage published artworks</p>
          </a>

          <a href="/admin/auctions" className="action-card">
            <div className="action-icon">🔨</div>
            <h3>Auction Control</h3>
            <p>Monitor auction activities</p>
          </a>

          <a href="/admin/artist-requests" className="action-card">
            <div className="action-icon">✨</div>
            <h3>Artist Requests</h3>
            <p>Review artist applications</p>
          </a>

          <a href="/admin/settings" className="action-card">
            <div className="action-icon">⚙️</div>
            <h3>Site Settings</h3>
            <p>Configure platform settings</p>
          </a>
        </div>
      </div>

      {/* Footer Info */}
      <div className="dashboard-footer">
        <div className="system-info">
          <span>📊 Dashboard Version: 2.0</span>
          <span>🛡️ Admin Level: {currentUser?.role || 'Admin'}</span>
          <span>⏰ Session: {formatTime(new Date())}</span>
          <span>🌐 Environment: {process.env.NODE_ENV || 'development'}</span>
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
          background: #f8f9fa;
          min-height: 100vh;
        }

        .loading-container {
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
          font-size: 2.5rem;
          font-weight: 700;
        }

        .header-content p {
          margin: 0 0 1rem 0;
          color: #666;
          font-size: 1.1rem;
        }

        .dashboard-meta {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          align-items: center;
          font-size: 0.9rem;
          color: #666;
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
          color: #495057;
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
          transition: transform 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .stat-card.users {
          border-left: 4px solid #3498db;
        }

        .stat-card.artists {
          border-left: 4px solid #9b59b6;
        }

        .stat-card.posts {
          border-left: 4px solid #2ecc71;
        }

        .stat-card.artworks {
          border-left: 4px solid #e67e22;
        }

        .stat-card.auctions {
          border-left: 4px solid #e74c3c;
        }

        .stat-icon {
          font-size: 3rem;
          opacity: 0.8;
        }

        .stat-content {
          flex: 1;
        }

        .stat-content h3 {
          margin: 0 0 0.5rem 0;
          color: #2c3e50;
          font-size: 1rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-number {
          font-size: 2.5rem;
          font-weight: 700;
          color: #2c3e50;
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          color: #666;
          font-size: 0.9rem;
        }

        .stat-sublabel {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .stat-detail {
          font-size: 0.8rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          display: inline-block;
        }

        .stat-detail.active {
          background: #d4edda;
          color: #155724;
        }

        .stat-detail.warning {
          background: #f8d7da;
          color: #721c24;
        }

        .quick-actions {
          margin-bottom: 3rem;
        }

        .quick-actions h2 {
          margin: 0 0 1.5rem 0;
          color: #2c3e50;
          font-size: 1.5rem;
        }

        .action-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .action-card {
          background: white;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          padding: 2rem;
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