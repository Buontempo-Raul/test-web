// src/components/admin/Layout/AdminLayout.js
import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import './AdminLayout.css';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>Admin Panel</h2>
          <div className="admin-user-info">
            <p>{user?.name}</p>
            <span className="admin-badge">Admin</span>
          </div>
        </div>
        
        <nav className="admin-menu">
          <NavLink 
            to="/admin/dashboard" 
            className={({isActive}) => isActive ? 'admin-menu-item active' : 'admin-menu-item'}
          >
            Dashboard
          </NavLink>
          
          <NavLink 
            to="/admin/users" 
            className={({isActive}) => isActive ? 'admin-menu-item active' : 'admin-menu-item'}
          >
            Manage Users
          </NavLink>

          <NavLink to="/admin/posts" className={({isActive}) => isActive ? 'admin-menu-item active' : 'admin-menu-item'}>
            Manage Posts
          </NavLink>

          <NavLink to="/admin/artworks" className={({isActive}) => isActive ? 'admin-menu-item active' : 'admin-menu-item'}>
            Manage Artworks
          </NavLink>

          <NavLink to="/admin/auctions" className={({isActive}) => isActive ? 'admin-menu-item active' : 'admin-menu-item'}>
            Auctions
          </NavLink>

          <NavLink to="/admin/artist-requests" className={({isActive}) => isActive ? 'admin-menu-item active' : 'admin-menu-item'}>
            Artist Requests
          </NavLink>
        </nav>
        
        <div className="admin-sidebar-footer">
          <NavLink to="/" className="admin-menu-item">
            View Site
          </NavLink>
          <button onClick={handleLogout} className="admin-logout-btn">
            Logout
          </button>
        </div>
      </div>
      
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;