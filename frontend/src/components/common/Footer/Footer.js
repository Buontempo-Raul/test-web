// src/components/common/Footer/Footer.js
import React from 'react';

const Footer = () => {
  return (
    <footer style={{ 
      backgroundColor: '#121212', 
      color: 'white',
      padding: '20px',
      textAlign: 'center' 
    }}>
      <p>© {new Date().getFullYear()} Uncreated. All rights reserved.</p>
    </footer>
  );
};

export default Footer;