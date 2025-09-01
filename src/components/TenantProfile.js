import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';

const TenantProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    emailNotifications: true,
    smsNotifications: false,
    defaultPaymentMethod: 'mpesa',
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch tenant profile
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { name, email, phone } = response.data;
        const prefsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/preferences`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFormData({
          name: name || '',
          email: email || '',
          phone: phone || '',
          emailNotifications: prefsResponse.data.emailNotifications ?? true,
          smsNotifications: prefsResponse.data.smsNotifications ?? false,
          defaultPaymentMethod: prefsResponse.data.defaultPaymentMethod || 'mpesa',
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile');
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      // Update user details
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/users/me`,
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update preferences
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/preferences`,
        {
          emailNotifications: formData.emailNotifications,
          smsNotifications: formData.smsNotifications,
          defaultPaymentMethod: formData.defaultPaymentMethod,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-sm mx-auto bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Profile Settings</h2>
          <button
            onClick={() => navigate('/tenant-dashboard')}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-4">{success}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
              disabled={loading}
            />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-900 mb-2">Notification Preferences</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.emailNotifications}
                  onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={loading}
                />
                Email Notifications
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.smsNotifications}
                  onChange={(e) => setFormData({ ...formData, smsNotifications: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={loading}
                />
                SMS Notifications
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Default Payment Method</label>
            <select
              value={formData.defaultPaymentMethod}
              onChange={(e) => setFormData({ ...formData, defaultPaymentMethod: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
              disabled={loading}
            >
              <option value="mpesa">M-Pesa</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantProfile;