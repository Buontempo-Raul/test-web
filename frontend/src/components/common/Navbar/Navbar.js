// src/components/common/Navbar/Navbar.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import './Navbar.css';

// Placeholder for logo - you should update this path to match your actual logo location
const logo = '../../../assets/images/uncreated.logotransparent.png';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <img src={logo} alt="Uncreated" />
        </Link>
        
        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/" className="navbar-item" onClick={() => setIsMenuOpen(false)}>Home</Link>
          <Link to="/shop" className="navbar-item" onClick={() => setIsMenuOpen(false)}>Shop</Link>
          <Link to="/explore" className="navbar-item" onClick={() => setIsMenuOpen(false)}>Explore</Link>
          
          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Link to="/admin/dashboard" className="navbar-item" onClick={() => setIsMenuOpen(false)}>
                  Admin Dashboard
                </Link>
              )}
              
              {!isAdmin && (
                <Link to={`/profile/${currentUser?.username || 'user'}`} className="navbar-item" onClick={() => setIsMenuOpen(false)}>
                  Profile
                </Link>
              )}
              
              <button className="navbar-item logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-item" onClick={() => setIsMenuOpen(false)}>Login</Link>
              <Link to="/register" className="navbar-item register-btn" onClick={() => setIsMenuOpen(false)}>
                Register
              </Link>
            </>
          )}
        </div>
        
        <div className="navbar-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;