import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLogin from '../components/admin/AdminLogin';
import AdminDashboard from '../components/admin/AdminDashboard';
import UserManagement from '../components/admin/UserManagement';

const AdminPortal: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('admin_auth_token');
      const storedUser = localStorage.getItem('admin_user');

      if (token && storedUser) {
        // Verify token is still valid
        const response = await fetch('/api/admin/verify', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setAdminUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        } else {
          // Token is invalid, clear storage
          localStorage.removeItem('admin_auth_token');
          localStorage.removeItem('admin_user');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear storage on error
      localStorage.removeItem('admin_auth_token');
      localStorage.removeItem('admin_user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (user: any) => {
    setAdminUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth_token');
    localStorage.removeItem('admin_user');
    setAdminUser(null);
    setIsAuthenticated(false);
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminDashboard adminUser={adminUser} />
    </div>
  );
};

export default AdminPortal;
