// src/pages/Admin/Users.js
import React, { useState, useEffect } from 'react';
import './Admin.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user'
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Fetch users from API
    const fetchUsers = async () => {
      try {
        // Simulated API call
        setTimeout(() => {
          const mockUsers = [
            { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin', createdAt: '2024-01-15' },
            { id: '2', name: 'John Doe', email: 'john@example.com', role: 'user', createdAt: '2024-02-20' },
            { id: '3', name: 'Jane Smith', email: 'jane@example.com', role: 'user', createdAt: '2024-03-05' },
            { id: '4', name: 'Mike Johnson', email: 'mike@example.com', role: 'user', createdAt: '2024-03-12' },
            { id: '5', name: 'Lisa Brown', email: 'lisa@example.com', role: 'user', createdAt: '2024-03-25' },
            { id: '6', name: 'Robert Williams', email: 'robert@example.com', role: 'user', createdAt: '2024-04-01' }
          ];
          setUsers(mockUsers);
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching users:', error);
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role
    });
    setIsEditing(true);
  };

  const handleCreateNew = () => {
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'user'
    });
    setIsEditing(true);
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedUser(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (selectedUser) {
      // Edit existing user
      const updatedUsers = users.map(user => 
        user.id === selectedUser.id ? { ...user, ...formData } : user
      );
      setUsers(updatedUsers);
    } else {
      // Create new user
      const newUser = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setUsers([...users, newUser]);
    }
    
    setIsEditing(false);
    setSelectedUser(null);
  };

  const handleDelete = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="admin-loading">Loading users...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Manage Users</h1>
        <button className="admin-button" onClick={handleCreateNew}>Add New User</button>
      </div>

      <div className="admin-search">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      {isEditing ? (
        <div className="admin-form-container">
          <h2>{selectedUser ? 'Edit User' : 'Create New User'}</h2>
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleFormChange}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="admin-button">
                {selectedUser ? 'Update User' : 'Create User'}
              </button>
              <button type="button" className="admin-button secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{user.createdAt}</td>
                    <td className="action-buttons">
                      <button
                        className="edit-button"
                        onClick={() => handleEditClick(user)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => handleDelete(user.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-results">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;