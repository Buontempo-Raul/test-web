// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/globals.css';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext'; // Import CartProvider

// Pages
import Home from './pages/Home/Home';
import Shop from './pages/Shop/Shop';
import ProductDetail from './pages/Shop/ProductDetail';
import Explore from './pages/Explore/Explore';
import Events from './pages/Events/Events';
import EventDetail from './pages/Events/EventDetail';
import MyEventRequests from './pages/Events/MyEventRequests';
import Profile from './pages/Profile/Profile';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import NotFound from './pages/NotFound/NotFound';

// Admin Pages
import AdminLayout from './components/admin/Layout/AdminLayout';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminUsers from './pages/Admin/Users';
import AdminProducts from './pages/Admin/Products';
import AdminOrders from './pages/Admin/Orders';
import AdminSettings from './pages/Admin/Settings';
import AdminEventRequests from './pages/Admin/EventRequests';

// Components
import Navbar from './components/common/Navbar/Navbar';
import Footer from './components/common/Footer/Footer';
import ProtectedRoute from './components/common/ProtectedRoute/ProtectedRoute';
import EventRequestForm from './components/events/EventRequestForm/EventRequestForm';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider> {/* Wrap with CartProvider */}
          <div className="app">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/shop/product/:id" element={<ProductDetail />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/profile/:username" element={<Profile />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected Routes - Regular User */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/request-event" element={<EventRequestForm />} />
                  <Route path="/my-event-requests" element={<MyEventRequests />} />
                </Route>
                
                {/* Admin Routes */}
                <Route path="/admin" element={<ProtectedRoute adminOnly={true} />}>
                  <Route element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="event-requests" element={<AdminEventRequests />} />
                  </Route>
                </Route>
                
                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;