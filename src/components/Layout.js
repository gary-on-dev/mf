import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { Menu, User, Bell, LogOut } from 'lucide-react';
import metovanLogo from '../assets/metovan1.png';

const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
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
        navigate('/login');
        return;
      }
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('token');
      navigate('/login');
    }
  }, [navigate]);

  const fetchActivities = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/activity`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data.data || []);
      setUnreadCount(response.data.data.length);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    socket.disconnect();
    navigate('/login');
  };

  useEffect(() => {
    fetchUser();
    fetchActivities();

    socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
    });

    socket.on('tenant_created', (data) => {
      setNotifications((prev) => [data, ...prev.slice(0, 9)]);
      setUnreadCount((prev) => prev + 1);
    });

    socket.on('email_approved', (data) => {
      setNotifications((prev) => [data, ...prev.slice(0, 9)]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.off('tenant_created');
      socket.off('email_approved');
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
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              
              <div className="flex items-center space-x-2">
                <img src={metovanLogo} alt="Metovan Logo" className="h-8 w-auto" />
                <span className="text-xl font-bold text-blue-600">Metovan</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onMenuToggle}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors md:hidden"
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
              <div className="relative">
                <button
                  onClick={handleNotificationClick}
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors relative"
                >
                  <Bell className="h-5 w-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-md border border-gray-200 z-50">
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Notifications</h3>
                      {notifications.length === 0 ? (
                        <p className="text-sm text-gray-600">No recent activity</p>
                      ) : (
                        <ul className="space-y-2">
                          {notifications.map((activity, index) => (
                            <li key={index} className="text-sm text-gray-700">
                              <span className="font-medium">
                                {activity.type === 'tenant_created'
                                  ? `New tenant ${activity.email} assigned to ${activity.property_name}`
                                  : `Email ${activity.email} approved for ${activity.property_name}`}
                              </span>
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
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <div className="bg-gray-200 p-2 rounded-full">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
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
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Profile
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
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