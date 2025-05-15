// src/components/common/ProtectedRoute/ProtectedRoute.js
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

// This component protects routes that require authentication
// adminOnly - if true, only admins can access the route
const ProtectedRoute = ({ adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();
  
  // Show loading indicator while checking auth status
  if (loading) {
    return <div className="loading">Loading authentication status...</div>;
  }
  
  // If user is not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If route requires admin privileges and user is not admin, redirect to home
  if (adminOnly && !isAdmin) {
    console.log("Access denied: Admin privileges required");
    return <Navigate to="/" replace />;
  }
  
  // Otherwise, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;