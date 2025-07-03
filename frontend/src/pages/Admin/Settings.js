import React, { useState, useEffect } from 'react';

// Import the admin API service
const adminAPI = {
  getSiteSettings: () => {
    // Note: Site settings backend endpoint not implemented yet
    // This will return mock data for now
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          settings: {
            general: {},
            seo: {},
            social: {},
            email: {},
            platform: {},
            security: {}
          }
        });
      }, 500);
    });
  },

  updateSiteSettings: (settings) => {
    // Note: Site settings backend endpoint not implemented yet
    // This will simulate a successful update
    console.log('Site settings would be saved:', settings);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Settings saved successfully'
        });
      }, 1000);
    });
  }
};

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  const [generalSettings, setGeneralSettings] = useState({
    siteName: '',
    tagline: '',
    description: '',
    email: '',
    phone: '',
    address: '',
    logo: '',
    favicon: '',
    timezone: 'UTC',
    language: 'en',
    currency: 'USD'
  });
  
  const [seoSettings, setSeoSettings] = useState({
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    ogImage: '',
    twitterCard: 'summary_large_image',
    robotsTxt: '',
    sitemap: true,
    googleAnalytics: '',
    googleSearchConsole: ''
  });
  
  const [socialMediaLinks, setSocialMediaLinks] = useState({
    facebook: '',
    instagram: '',
    twitter: '',
    pinterest: '',
    youtube: '',
    linkedin: '',
    tiktok: ''
  });

  const [emailSettings, setEmailSettings] = useState({
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromName: '',
    fromEmail: '',
    replyToEmail: '',
    emailNotifications: true,
    welcomeEmailEnabled: true,
    orderConfirmationEnabled: true,
    newsletterEnabled: true
  });

  const [platformSettings, setPlatformSettings] = useState({
    userRegistration: true,
    artistApplications: true,
    guestCheckout: false,
    reviewsEnabled: true,
    commentsEnabled: true,
    auctionsEnabled: true,
    minimumArtworkPrice: 10,
    maximumArtworkPrice: 10000,
    commissionRate: 5,
    paymentMethods: ['credit_card', 'paypal'],
    shippingRegions: ['domestic', 'international'],
    maintenanceMode: false,
    maintenanceMessage: ''
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    passwordMinLength: 8,
    passwordRequireSpecial: true,
    passwordRequireNumbers: true,
    passwordRequireUppercase: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    ipWhitelist: '',
    backupFrequency: 'daily',
    backupRetention: 30
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      
      // Simulate API call to fetch current settings
      setTimeout(() => {
        setGeneralSettings({
          siteName: 'Uncreated',
          tagline: 'A platform for artists to showcase and sell their creations',
          description: 'Discover and purchase unique art pieces from talented creators worldwide. Support independent artists and find one-of-a-kind artworks for your collection.',
          email: 'admin@uncreated.com',
          phone: '+1 (555) 123-4567',
          address: '123 Art Street, Creative City, State 12345',
          logo: '',
          favicon: '',
          timezone: 'America/New_York',
          language: 'en',
          currency: 'USD'
        });

        setSeoSettings({
          metaTitle: 'Uncreated | Art and Creative Marketplace',
          metaDescription: 'Discover and purchase unique art pieces from talented creators on Uncreated. Support independent artists and find one-of-a-kind artworks.',
          keywords: 'art, handmade, creative, marketplace, artists, crafts, paintings, digital art, photography',
          ogImage: '',
          twitterCard: 'summary_large_image',
          robotsTxt: 'User-agent: *\nAllow: /',
          sitemap: true,
          googleAnalytics: '',
          googleSearchConsole: ''
        });

        setSocialMediaLinks({
          facebook: 'https://facebook.com/uncreated',
          instagram: 'https://instagram.com/uncreated',
          twitter: 'https://twitter.com/uncreated',
          pinterest: 'https://pinterest.com/uncreated',
          youtube: '',
          linkedin: '',
          tiktok: ''
        });

        setEmailSettings({
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          smtpUser: 'notifications@uncreated.com',
          smtpPassword: '',
          fromName: 'Uncreated Team',
          fromEmail: 'no-reply@uncreated.com',
          replyToEmail: 'support@uncreated.com',
          emailNotifications: true,
          welcomeEmailEnabled: true,
          orderConfirmationEnabled: true,
          newsletterEnabled: true
        });

        setPlatformSettings({
          userRegistration: true,
          artistApplications: true,
          guestCheckout: false,
          reviewsEnabled: true,
          commentsEnabled: true,
          auctionsEnabled: true,
          minimumArtworkPrice: 10,
          maximumArtworkPrice: 10000,
          commissionRate: 5,
          paymentMethods: ['credit_card', 'paypal'],
          shippingRegions: ['domestic', 'international'],
          maintenanceMode: false,
          maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back shortly.'
        });

        setSecuritySettings({
          twoFactorEnabled: false,
          passwordMinLength: 8,
          passwordRequireSpecial: true,
          passwordRequireNumbers: true,
          passwordRequireUppercase: true,
          sessionTimeout: 30,
          maxLoginAttempts: 5,
          ipWhitelist: '',
          backupFrequency: 'daily',
          backupRetention: 30
        });

        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setIsLoading(false);
    }
  };

  const handleSettingChange = (category, setting, value) => {
    setHasChanges(true);
    
    switch (category) {
      case 'general':
        setGeneralSettings(prev => ({ ...prev, [setting]: value }));
        break;
      case 'seo':
        setSeoSettings(prev => ({ ...prev, [setting]: value }));
        break;
      case 'social':
        setSocialMediaLinks(prev => ({ ...prev, [setting]: value }));
        break;
      case 'email':
        setEmailSettings(prev => ({ ...prev, [setting]: value }));
        break;
      case 'platform':
        setPlatformSettings(prev => ({ ...prev, [setting]: value }));
        break;
      case 'security':
        setSecuritySettings(prev => ({ ...prev, [setting]: value }));
        break;
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      
      const allSettings = {
        general: generalSettings,
        seo: seoSettings,
        social: socialMediaLinks,
        email: emailSettings,
        platform: platformSettings,
        security: securitySettings
      };

      // In real implementation, call adminAPI.updateSiteSettings()
      console.log('Saving settings:', allSettings);
      
      // Simulate API call
      setTimeout(() => {
        setLastSaved(new Date());
        setHasChanges(false);
        setIsSaving(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'general', name: 'General', icon: '⚙️' },
    { id: 'seo', name: 'SEO & Meta', icon: '🔍' },
    { id: 'social', name: 'Social Media', icon: '📱' },
    { id: 'email', name: 'Email', icon: '📧' },
    { id: 'platform', name: 'Platform', icon: '🎨' },
    { id: 'security', name: 'Security', icon: '🔒' }
  ];

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="header-content">
          <h1>Site Settings</h1>
          <p>Configure your platform settings and preferences</p>
          <div className="settings-note">
            <strong>Note:</strong> Site settings backend is not yet implemented. Changes will be logged to console for now.
          </div>
        </div>
        
        <div className="header-actions">
          {lastSaved && (
            <div className="last-saved">
              Last saved: {lastSaved.toLocaleTimeString()}
            </div>
          )}
          <button 
            onClick={handleSaveSettings} 
            disabled={!hasChanges || isSaving}
            className={`save-button ${hasChanges ? 'has-changes' : ''}`}
          >
            {isSaving ? (
              <>
                <span className="spinner"></span>
                Saving...
              </>
            ) : (
              <>
                💾 Save Changes
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="settings-container">
        <div className="settings-tabs">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-name">{tab.name}</span>
            </button>
          ))}
        </div>
        
        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="settings-section">
              <h3>General Settings</h3>
              <div className="settings-grid">
                <div className="setting-group">
                  <label>Site Name</label>
                  <input
                    type="text"
                    value={generalSettings.siteName}
                    onChange={(e) => handleSettingChange('general', 'siteName', e.target.value)}
                    placeholder="Enter site name"
                  />
                </div>
                
                <div className="setting-group">
                  <label>Tagline</label>
                  <input
                    type="text"
                    value={generalSettings.tagline}
                    onChange={(e) => handleSettingChange('general', 'tagline', e.target.value)}
                    placeholder="Enter site tagline"
                  />
                </div>
                
                <div className="setting-group full-width">
                  <label>Description</label>
                  <textarea
                    value={generalSettings.description}
                    onChange={(e) => handleSettingChange('general', 'description', e.target.value)}
                    placeholder="Enter site description"
                    rows="3"
                  />
                </div>
                
                <div className="setting-group">
                  <label>Contact Email</label>
                  <input
                    type="email"
                    value={generalSettings.email}
                    onChange={(e) => handleSettingChange('general', 'email', e.target.value)}
                    placeholder="contact@example.com"
                  />
                </div>
                
                <div className="setting-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={generalSettings.phone}
                    onChange={(e) => handleSettingChange('general', 'phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                
                <div className="setting-group full-width">
                  <label>Address</label>
                  <input
                    type="text"
                    value={generalSettings.address}
                    onChange={(e) => handleSettingChange('general', 'address', e.target.value)}
                    placeholder="123 Main St, City, State 12345"
                  />
                </div>
                
                <div className="setting-group">
                  <label>Timezone</label>
                  <select
                    value={generalSettings.timezone}
                    onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>
                
                <div className="setting-group">
                  <label>Currency</label>
                  <select
                    value={generalSettings.currency}
                    onChange={(e) => handleSettingChange('general', 'currency', e.target.value)}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD (C$)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="settings-section">
              <h3>SEO & Meta Settings</h3>
              <div className="settings-grid">
                <div className="setting-group full-width">
                  <label>Meta Title</label>
                  <input
                    type="text"
                    value={seoSettings.metaTitle}
                    onChange={(e) => handleSettingChange('seo', 'metaTitle', e.target.value)}
                    placeholder="Site title for search engines"
                  />
                </div>
                
                <div className="setting-group full-width">
                  <label>Meta Description</label>
                  <textarea
                    value={seoSettings.metaDescription}
                    onChange={(e) => handleSettingChange('seo', 'metaDescription', e.target.value)}
                    placeholder="Site description for search engines"
                    rows="3"
                  />
                </div>
                
                <div className="setting-group full-width">
                  <label>Keywords</label>
                  <input
                    type="text"
                    value={seoSettings.keywords}
                    onChange={(e) => handleSettingChange('seo', 'keywords', e.target.value)}
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
                
                <div className="setting-group">
                  <label>Google Analytics ID</label>
                  <input
                    type="text"
                    value={seoSettings.googleAnalytics}
                    onChange={(e) => handleSettingChange('seo', 'googleAnalytics', e.target.value)}
                    placeholder="G-XXXXXXXXXX"
                  />
                </div>
                
                <div className="setting-group">
                  <label>Search Console</label>
                  <input
                    type="text"
                    value={seoSettings.googleSearchConsole}
                    onChange={(e) => handleSettingChange('seo', 'googleSearchConsole', e.target.value)}
                    placeholder="Verification code"
                  />
                </div>
                
                <div className="setting-group">
                  <label>Twitter Card Type</label>
                  <select
                    value={seoSettings.twitterCard}
                    onChange={(e) => handleSettingChange('seo', 'twitterCard', e.target.value)}
                  >
                    <option value="summary">Summary</option>
                    <option value="summary_large_image">Summary Large Image</option>
                  </select>
                </div>
                
                <div className="setting-group checkbox-group">
                  <input
                    type="checkbox"
                    id="sitemap"
                    checked={seoSettings.sitemap}
                    onChange={(e) => handleSettingChange('seo', 'sitemap', e.target.checked)}
                  />
                  <label htmlFor="sitemap">Generate XML Sitemap</label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="settings-section">
              <h3>Social Media Links</h3>
              <div className="settings-grid">
                <div className="setting-group">
                  <label>📘 Facebook</label>
                  <input
                    type="url"
                    value={socialMediaLinks.facebook}
                    onChange={(e) => handleSettingChange('social', 'facebook', e.target.value)}
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
                
                <div className="setting-group">
                  <label>📷 Instagram</label>
                  <input
                    type="url"
                    value={socialMediaLinks.instagram}
                    onChange={(e) => handleSettingChange('social', 'instagram', e.target.value)}
                    placeholder="https://instagram.com/youraccount"
                  />
                </div>
                
                <div className="setting-group">
                  <label>🐦 Twitter</label>
                  <input
                    type="url"
                    value={socialMediaLinks.twitter}
                    onChange={(e) => handleSettingChange('social', 'twitter', e.target.value)}
                    placeholder="https://twitter.com/youraccount"
                  />
                </div>
                
                <div className="setting-group">
                  <label>📌 Pinterest</label>
                  <input
                    type="url"
                    value={socialMediaLinks.pinterest}
                    onChange={(e) => handleSettingChange('social', 'pinterest', e.target.value)}
                    placeholder="https://pinterest.com/youraccount"
                  />
                </div>
                
                <div className="setting-group">
                  <label>🎥 YouTube</label>
                  <input
                    type="url"
                    value={socialMediaLinks.youtube}
                    onChange={(e) => handleSettingChange('social', 'youtube', e.target.value)}
                    placeholder="https://youtube.com/yourchannel"
                  />
                </div>
                
                <div className="setting-group">
                  <label>💼 LinkedIn</label>
                  <input
                    type="url"
                    value={socialMediaLinks.linkedin}
                    onChange={(e) => handleSettingChange('social', 'linkedin', e.target.value)}
                    placeholder="https://linkedin.com/company/yourcompany"
                  />
                </div>
                
                <div className="setting-group">
                  <label>🎵 TikTok</label>
                  <input
                    type="url"
                    value={socialMediaLinks.tiktok}
                    onChange={(e) => handleSettingChange('social', 'tiktok', e.target.value)}
                    placeholder="https://tiktok.com/@youraccount"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="settings-section">
              <h3>Email Configuration</h3>
              <div className="settings-grid">
                <div className="setting-group">
                  <label>SMTP Host</label>
                  <input
                    type="text"
                    value={emailSettings.smtpHost}
                    onChange={(e) => handleSettingChange('email', 'smtpHost', e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                
                <div className="setting-group">
                  <label>SMTP Port</label>
                  <input
                    type="number"
                    value={emailSettings.smtpPort}
                    onChange={(e) => handleSettingChange('email', 'smtpPort', parseInt(e.target.value))}
                    placeholder="587"
                  />
                </div>
                
                <div className="setting-group">
                  <label>SMTP Username</label>
                  <input
                    type="text"
                    value={emailSettings.smtpUser}
                    onChange={(e) => handleSettingChange('email', 'smtpUser', e.target.value)}
                    placeholder="your-email@gmail.com"
                  />
                </div>
                
                <div className="setting-group">
                  <label>SMTP Password</label>
                  <input
                    type="password"
                    value={emailSettings.smtpPassword}
                    onChange={(e) => handleSettingChange('email', 'smtpPassword', e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                
                <div className="setting-group">
                  <label>From Name</label>
                  <input
                    type="text"
                    value={emailSettings.fromName}
                    onChange={(e) => handleSettingChange('email', 'fromName', e.target.value)}
                    placeholder="Your Site Name"
                  />
                </div>
                
                <div className="setting-group">
                  <label>From Email</label>
                  <input
                    type="email"
                    value={emailSettings.fromEmail}
                    onChange={(e) => handleSettingChange('email', 'fromEmail', e.target.value)}
                    placeholder="no-reply@yoursite.com"
                  />
                </div>
                
                <div className="setting-group full-width">
                  <h4>Email Notifications</h4>
                  <div className="checkbox-list">
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id="emailNotifications"
                        checked={emailSettings.emailNotifications}
                        onChange={(e) => handleSettingChange('email', 'emailNotifications', e.target.checked)}
                      />
                      <label htmlFor="emailNotifications">Enable Email Notifications</label>
                    </div>
                    
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id="welcomeEmailEnabled"
                        checked={emailSettings.welcomeEmailEnabled}
                        onChange={(e) => handleSettingChange('email', 'welcomeEmailEnabled', e.target.checked)}
                      />
                      <label htmlFor="welcomeEmailEnabled">Welcome Email for New Users</label>
                    </div>
                    
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id="orderConfirmationEnabled"
                        checked={emailSettings.orderConfirmationEnabled}
                        onChange={(e) => handleSettingChange('email', 'orderConfirmationEnabled', e.target.checked)}
                      />
                      <label htmlFor="orderConfirmationEnabled">Order Confirmation Emails</label>
                    </div>
                    
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id="newsletterEnabled"
                        checked={emailSettings.newsletterEnabled}
                        onChange={(e) => handleSettingChange('email', 'newsletterEnabled', e.target.checked)}
                      />
                      <label htmlFor="newsletterEnabled">Newsletter Subscriptions</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'platform' && (
            <div className="settings-section">
              <h3>Platform Settings</h3>
              <div className="settings-grid">
                <div className="setting-group full-width">
                  <h4>User Registration & Access</h4>
                  <div className="checkbox-list">
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id="userRegistration"
                        checked={platformSettings.userRegistration}
                        onChange={(e) => handleSettingChange('platform', 'userRegistration', e.target.checked)}
                      />
                      <label htmlFor="userRegistration">Allow User Registration</label>
                    </div>
                    
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id="artistApplications"
                        checked={platformSettings.artistApplications}
                        onChange={(e) => handleSettingChange('platform', 'artistApplications', e.target.checked)}
                      />
                      <label htmlFor="artistApplications">Accept Artist Applications</label>
                    </div>
                    
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id="guestCheckout"
                        checked={platformSettings.guestCheckout}
                        onChange={(e) => handleSettingChange('platform', 'guestCheckout', e.target.checked)}
                      />
                      <label htmlFor="guestCheckout">Allow Guest Checkout</label>
                    </div>
                  </div>
                </div>

                <div className="setting-group full-width">
                  <h4>Features</h4>
                  <div className="checkbox-list">
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id="reviewsEnabled"
                        checked={platformSettings.reviewsEnabled}
                        onChange={(e) => handleSettingChange('platform', 'reviewsEnabled', e.target.checked)}
                      />
                      <label htmlFor="reviewsEnabled">Enable Reviews & Ratings</label>
                    </div>
                    
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id="commentsEnabled"
                        checked={platformSettings.commentsEnabled}
                        onChange={(e) => handleSettingChange('platform', 'commentsEnabled', e.target.checked)}
                      />
                      <label htmlFor="commentsEnabled">Enable Comments on Posts</label>
                    </div>
                    
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id="auctionsEnabled"
                        checked={platformSettings.auctionsEnabled}
                        onChange={(e) => handleSettingChange('platform', 'auctionsEnabled', e.target.checked)}
                      />
                      <label htmlFor="auctionsEnabled">Enable Auction System</label>
                    </div>
                  </div>
                </div>
                
                <div className="setting-group">
                  <label>Minimum Artwork Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={platformSettings.minimumArtworkPrice}
                    onChange={(e) => handleSettingChange('platform', 'minimumArtworkPrice', parseFloat(e.target.value))}
                  />
                </div>
                
                <div className="setting-group">
                  <label>Maximum Artwork Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={platformSettings.maximumArtworkPrice}
                    onChange={(e) => handleSettingChange('platform', 'maximumArtworkPrice', parseFloat(e.target.value))}
                  />
                </div>
                
                <div className="setting-group">
                  <label>Commission Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.1"
                    value={platformSettings.commissionRate}
                    onChange={(e) => handleSettingChange('platform', 'commissionRate', parseFloat(e.target.value))}
                  />
                </div>

                <div className="setting-group full-width">
                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      id="maintenanceMode"
                      checked={platformSettings.maintenanceMode}
                      onChange={(e) => handleSettingChange('platform', 'maintenanceMode', e.target.checked)}
                    />
                    <label htmlFor="maintenanceMode">Maintenance Mode</label>
                  </div>
                  
                  {platformSettings.maintenanceMode && (
                    <textarea
                      value={platformSettings.maintenanceMessage}
                      onChange={(e) => handleSettingChange('platform', 'maintenanceMessage', e.target.value)}
                      placeholder="Maintenance message to display to users"
                      rows="3"
                      className="maintenance-message"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-section">
              <h3>Security Settings</h3>
              <div className="settings-grid">
                <div className="setting-group full-width">
                  <h4>Password Requirements</h4>
                  <div className="setting-row">
                    <div className="setting-group">
                      <label>Minimum Length</label>
                      <input
                        type="number"
                        min="6"
                        max="20"
                        value={securitySettings.passwordMinLength}
                        onChange={(e) => handleSettingChange('security', 'passwordMinLength', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  <div className="checkbox-list">
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id="passwordRequireUppercase"
                        checked={securitySettings.passwordRequireUppercase}
                        onChange={(e) => handleSettingChange('security', 'passwordRequireUppercase', e.target.checked)}
                      />
                      <label htmlFor="passwordRequireUppercase">Require Uppercase Letters</label>
                    </div>
                    
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id="passwordRequireNumbers"
                        checked={securitySettings.passwordRequireNumbers}
                        onChange={(e) => handleSettingChange('security', 'passwordRequireNumbers', e.target.checked)}
                      />
                      <label htmlFor="passwordRequireNumbers">Require Numbers</label>
                    </div>
                    
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id="passwordRequireSpecial"
                        checked={securitySettings.passwordRequireSpecial}
                        onChange={(e) => handleSettingChange('security', 'passwordRequireSpecial', e.target.checked)}
                      />
                      <label htmlFor="passwordRequireSpecial">Require Special Characters</label>
                    </div>
                  </div>
                </div>

                <div className="setting-group">
                  <label>Session Timeout (minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="1440"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="setting-group">
                  <label>Max Login Attempts</label>
                  <input
                    type="number"
                    min="3"
                    max="20"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="setting-group">
                  <label>Backup Frequency</label>
                  <select
                    value={securitySettings.backupFrequency}
                    onChange={(e) => handleSettingChange('security', 'backupFrequency', e.target.value)}
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                
                <div className="setting-group">
                  <label>Backup Retention (days)</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={securitySettings.backupRetention}
                    onChange={(e) => handleSettingChange('security', 'backupRetention', parseInt(e.target.value))}
                  />
                </div>

                <div className="setting-group checkbox-group">
                  <input
                    type="checkbox"
                    id="twoFactorEnabled"
                    checked={securitySettings.twoFactorEnabled}
                    onChange={(e) => handleSettingChange('security', 'twoFactorEnabled', e.target.checked)}
                  />
                  <label htmlFor="twoFactorEnabled">Enable Two-Factor Authentication</label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .admin-page {
          padding: 0;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-content h1 {
          margin: 0 0 0.5rem 0;
          color: #2c3e50;
        }

        .header-content p {
          margin: 0 0 0.5rem 0;
          color: #7f8c8d;
        }

        .settings-note {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 6px;
          padding: 0.75rem;
          margin-top: 1rem;
          color: #856404;
          font-size: 0.9rem;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .last-saved {
          font-size: 0.9rem;
          color: #7f8c8d;
        }

        .save-button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #e9ecef;
          color: #6c757d;
        }

        .save-button.has-changes {
          background: #667eea;
          color: white;
        }

        .save-button:hover.has-changes {
          background: #5a6fd8;
        }

        .save-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .settings-container {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          display: grid;
          grid-template-columns: 250px 1fr;
          min-height: 600px;
        }

        .settings-tabs {
          background: #f8f9fa;
          border-right: 1px solid #e9ecef;
          padding: 1rem 0;
        }

        .settings-tab {
          width: 100%;
          padding: 1rem 1.5rem;
          border: none;
          background: none;
          text-align: left;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #6c757d;
        }

        .settings-tab:hover {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
        }

        .settings-tab.active {
          background: #667eea;
          color: white;
          border-left: 4px solid #5a6fd8;
        }

        .tab-icon {
          font-size: 1.2rem;
        }

        .tab-name {
          font-weight: 500;
        }

        .settings-content {
          padding: 2rem;
          overflow-y: auto;
        }

        .settings-section h3 {
          margin: 0 0 2rem 0;
          color: #2c3e50;
          font-size: 1.5rem;
        }

        .settings-section h4 {
          margin: 0 0 1rem 0;
          color: #2c3e50;
          font-size: 1.1rem;
          border-bottom: 2px solid #e9ecef;
          padding-bottom: 0.5rem;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          align-items: start;
        }

        .setting-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .setting-group.full-width {
          grid-column: 1 / -1;
        }

        .setting-group.checkbox-group {
          flex-direction: row;
          align-items: center;
          gap: 0.75rem;
        }

        .setting-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .setting-group label {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 0.5rem;
        }

        .checkbox-group label {
          margin-bottom: 0;
          font-weight: 500;
        }

        .setting-group input,
        .setting-group select,
        .setting-group textarea {
          padding: 0.75rem;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        .setting-group input:focus,
        .setting-group select:focus,
        .setting-group textarea:focus {
          outline: none;
          border-color: #667eea;
        }

        .checkbox-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .checkbox-group input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #667eea;
        }

        .maintenance-message {
          margin-top: 1rem;
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

        @media (max-width: 768px) {
          .settings-container {
            grid-template-columns: 1fr;
          }

          .settings-tabs {
            display: flex;
            overflow-x: auto;
            border-right: none;
            border-bottom: 1px solid #e9ecef;
          }

          .settings-tab {
            flex-shrink: 0;
            padding: 1rem;
          }

          .settings-grid {
            grid-template-columns: 1fr;
          }

          .admin-header {
            flex-direction: column;
            align-items: stretch;
          }

          .header-actions {
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminSettings;