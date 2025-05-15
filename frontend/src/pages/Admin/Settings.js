// src/pages/Admin/Settings.js
import React, { useState } from 'react';
import './Admin.css';

const AdminSettings = () => {
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'Uncreated',
    tagline: 'A platform for artists to showcase and sell their creations',
    email: 'admin@uncreated.com',
    phone: '+1 (555) 123-4567',
    address: '123 Art Street, Creative City, State 12345'
  });
  
  const [seoSettings, setSeoSettings] = useState({
    metaTitle: 'Uncreated | Art and Creative Marketplace',
    metaDescription: 'Discover and purchase unique art pieces from talented creators on Uncreated.',
    keywords: 'art, handmade, creative, marketplace, artists, crafts'
  });
  
  const [socialMediaLinks, setSocialMediaLinks] = useState({
    facebook: 'https://facebook.com/uncreated',
    instagram: 'https://instagram.com/uncreated',
    twitter: 'https://twitter.com/uncreated',
    pinterest: 'https://pinterest.com/uncreated'
  });
  
  const [activeTab, setActiveTab] = useState('general');
  const [isSuccess, setIsSuccess] = useState(false);
  
  const handleGeneralChange = (e) => {
    setGeneralSettings({
      ...generalSettings,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSeoChange = (e) => {
    setSeoSettings({
      ...seoSettings,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSocialChange = (e) => {
    setSocialMediaLinks({
      ...socialMediaLinks,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // In a real app, you'd send the data to your backend API
    console.log('Saving settings...');
    console.log('General:', generalSettings);
    console.log('SEO:', seoSettings);
    console.log('Social Media:', socialMediaLinks);
    
    // Show success message
    setIsSuccess(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setIsSuccess(false);
    }, 3000);
  };
  
  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Site Settings</h1>
      </div>
      
      {isSuccess && (
        <div className="success-message">
          Settings saved successfully!
        </div>
      )}
      
      <div className="settings-container">
        <div className="settings-tabs">
          <button 
            className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button 
            className={`settings-tab ${activeTab === 'seo' ? 'active' : ''}`}
            onClick={() => setActiveTab('seo')}
          >
            SEO
          </button>
          <button 
            className={`settings-tab ${activeTab === 'social' ? 'active' : ''}`}
            onClick={() => setActiveTab('social')}
          >
            Social Media
          </button>
        </div>
        
        <div className="settings-content">
          {activeTab === 'general' && (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="siteName">Site Name</label>
                <input
                  type="text"
                  id="siteName"
                  name="siteName"
                  value={generalSettings.siteName}
                  onChange={handleGeneralChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="tagline">Tagline</label>
                <input
                  type="text"
                  id="tagline"
                  name="tagline"
                  value={generalSettings.tagline}
                  onChange={handleGeneralChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Contact Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={generalSettings.email}
                  onChange={handleGeneralChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="phone">Contact Phone</label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={generalSettings.phone}
                  onChange={handleGeneralChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="address">Business Address</label>
                <textarea
                  id="address"
                  name="address"
                  value={generalSettings.address}
                  onChange={handleGeneralChange}
                  rows="3"
                />
              </div>
              
              <button type="submit" className="admin-button">Save Settings</button>
            </form>
          )}
          
          {activeTab === 'seo' && (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="metaTitle">Meta Title</label>
                <input
                  type="text"
                  id="metaTitle"
                  name="metaTitle"
                  value={seoSettings.metaTitle}
                  onChange={handleSeoChange}
                  required
                />
                <small>The title that appears in search engine results (recommended: 50-60 characters)</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="metaDescription">Meta Description</label>
                <textarea
                  id="metaDescription"
                  name="metaDescription"
                  value={seoSettings.metaDescription}
                  onChange={handleSeoChange}
                  rows="3"
                  required
                />
                <small>The description that appears in search engine results (recommended: 150-160 characters)</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="keywords">Keywords</label>
                <input
                  type="text"
                  id="keywords"
                  name="keywords"
                  value={seoSettings.keywords}
                  onChange={handleSeoChange}
                />
                <small>Comma-separated keywords related to your site</small>
              </div>
              
              <button type="submit" className="admin-button">Save Settings</button>
            </form>
          )}
          
          {activeTab === 'social' && (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="facebook">Facebook URL</label>
                <input
                  type="url"
                  id="facebook"
                  name="facebook"
                  value={socialMediaLinks.facebook}
                  onChange={handleSocialChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="instagram">Instagram URL</label>
                <input
                  type="url"
                  id="instagram"
                  name="instagram"
                  value={socialMediaLinks.instagram}
                  onChange={handleSocialChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="twitter">Twitter URL</label>
                <input
                  type="url"
                  id="twitter"
                  name="twitter"
                  value={socialMediaLinks.twitter}
                  onChange={handleSocialChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="pinterest">Pinterest URL</label>
                <input
                  type="url"
                  id="pinterest"
                  name="pinterest"
                  value={socialMediaLinks.pinterest}
                  onChange={handleSocialChange}
                />
              </div>
              
              <button type="submit" className="admin-button">Save Settings</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;