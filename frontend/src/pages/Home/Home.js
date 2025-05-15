// src/pages/Home/Home.js
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Home.css';
import Presentation from '../../components/home/Presentation/Presentation';

const Home = () => {
  return (
    <div className="home">
      {/* Add the presentation component as the first thing visitors see */}
      <Presentation />
      
      {/* Your existing home content follows the presentation */}
      <section className="hero">
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1>Welcome to Uncreated</h1>
          <p>A platform for artists to showcase and sell their creations</p>
          <div className="hero-buttons">
            <Link to="/explore" className="btn btn-primary">Explore Art</Link>
            <Link to="/shop" className="btn btn-secondary">Shop Now</Link>
          </div>
        </motion.div>
      </section>

      <section className="features">
        <div className="feature">
          <h2>Shop</h2>
          <p>Discover and purchase unique art pieces from talented creators</p>
        </div>
        <div className="feature">
          <h2>Explore</h2>
          <p>Browse through a world of creativity and artistic expressions</p>
        </div>
        <div className="feature">
          <h2>Connect</h2>
          <p>Follow your favorite artists and engage with their content</p>
        </div>
      </section>
    </div>
  );
};

export default Home;