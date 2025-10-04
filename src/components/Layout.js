import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { Menu, User, Bell, LogOut } from 'lucide-react';
import metovanLogo from '../assets/metovan1.png';

// Initialize Socket.IO with the correct URL.
const socket = io(process.env.REACT_APP_API_URL || 'https://metovan-backend.onrender.com', {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

const Layout = ({ children, onMenuToggle, role }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found, redirecting to login');
        navigate('/login');
        return;
      }
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      localStorage.removeItem('token');
      navigate('/login');
    }
  }, [navigate]);

  const fetchActivities = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token for activities, skipping fetch');
        return;
      }
      console.log('Fetching activities from:', `${process.env.REACT_APP_API_URL}/api/activity`);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/activity`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const activities = response.data.data || [];
      setNotifications(activities);
      setUnreadCount(activities.length);
    } catch (error) {
      console.error('Error fetching activities:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      // Optionally, set an error state for UI feedback
      // setNotifications([{ type: 'error', message: 'Failed to load activities', created_at: new Date() }]);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    socket.disconnect();
    navigate('/login');
  };

  useEffect(() => {
    console.log('API URL:', process.env.REACT_APP_API_URL); // Debug
    fetchUser();
    fetchActivities();

    socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
    });

    socket.on('tenant_created', (data) => {
      console.log('Socket: tenant_created', data);
      setNotifications((prev) => [
        { ...data, type: 'tenant_created', message: `New tenant ${data.email} assigned to ${data.property_name}` },
        ...prev.slice(0, 9),
      ]);
      setUnreadCount((prev) => prev + 1);
    });

    socket.on('email_approved', (data) => {
      console.log('Socket: email_approved', data);
      setNotifications((prev) => [
        { ...data, type: 'email_approved', message: `Email ${data.email} approved for ${data.property_name || data.role}` },
        ...prev.slice(0, 9),
      ]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.off('tenant_created');
      socket.off('email_approved');
      socket.off('connect');
    };
  }, [fetchUser, fetchActivities]);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    setUnreadCount(0);
    setShowProfileDropdown(false);
  };

  const handleProfileClick = () => {
    setShowProfileDropdown(!showProfileDropdown);
    setShowNotifications(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={onMenuToggle}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors md:hidden"
              >
                <Menu className="h-6 w-6 text-gray-600" />
              </button>
              <div className="flex items-center space-x-2">
                <img src={metovanLogo} alt="Metovan Logo" className="h-10 w-auto" />
                <span className="text-2xl font-bold text-blue-600">Metovan</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={handleNotificationClick}
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors relative focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Bell className="h-6 w-6 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-md border border-gray-200 z-50">
                    <div className="p-4">
                      <h3 className="text-base font-semibold text-gray-900 mb-3">Notifications</h3>
                      {notifications.length === 0 ? (
                        <p className="text-sm text-gray-600">No recent activity</p>
                      ) : (
                        <ul className="space-y-2">
                          {notifications.map((activity, index) => (
                            <li key={index} className="text-sm text-gray-700">
                              <span className="font-medium">{activity.message}</span>
                              <br />
                              <span className="text-xs text-gray-500">
                                {new Date(activity.created_at).toLocaleString()}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <div className="bg-gray-200 p-2 rounded-full">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                    <span className="hidden sm:block text-base font-medium text-gray-900">
                      {user?.name || user?.email || 'User'}
                    </span>
                  </button>
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md border border-gray-200 z-50">
                      <div className="p-2">
                        <button
                          onClick={() => {
                            navigate(role === 'tenant' ? '/tenant-profile' : '/profile');
                            setShowProfileDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-base text-gray-900 hover:bg-gray-100"
                        >
                          Profile
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-base text-red-600 hover:bg-gray-100"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>
      <main className="flex-1 max-w-7xl mx-auto py-4 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
};

export default Layout;
