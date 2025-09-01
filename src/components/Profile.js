import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currency: 'KES',
    timezone: 'Africa/Nairobi',
    emailNotifications: true,
    smsNotifications: false,
    rentReminders: true,
    maintenanceUpdates: true,
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

    const fetchPreferences = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/preferences`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFormData({
          currency: response.data.currency || 'KES',
          timezone: response.data.timezone || 'Africa/Nairobi',
          emailNotifications: response.data.emailNotifications ?? true,
          smsNotifications: response.data.smsNotifications ?? false,
          rentReminders: response.data.rentReminders ?? true,
          maintenanceUpdates: response.data.maintenanceUpdates ?? true,
        });
      } catch (error) {
        console.error('Error fetching preferences:', error);
        setError('Failed to load preferences');
      }
    };
    fetchPreferences();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/preferences`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Preferences saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
      setError(error.response?.data?.message || 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">System Preferences</h2>
          <button
            onClick={() => navigate('/admin-dashboard')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-base"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </button>
        </div>
        {error && <p className="text-red-600 text-base mb-4">{error}</p>}
        {success && <p className="text-green-600 text-base mb-4">{success}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-base font-medium text-gray-700">Currency</label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="mt-1 block w-full border border-gray-200 rounded-md shadow-sm p-2 text-base focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="KES">Kenyan Shilling (KES)</option>
            </select>
          </div>
          <div>
            <label className="block text-base font-medium text-gray-700">Timezone</label>
            <select
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              className="mt-1 block w-full border border-gray-200 rounded-md shadow-sm p-2 text-base focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
            </select>
          </div>
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-2">Notifications</h3>
            <div className="space-y-2">
              {[
                { label: 'Email Notifications', key: 'emailNotifications' },
                { label: 'SMS Notifications', key: 'smsNotifications' },
                { label: 'Rent Reminders', key: 'rentReminders' },
                { label: 'Maintenance Updates', key: 'maintenanceUpdates' },
              ].map((item) => (
                <label key={item.key} className="flex items-center gap-2 text-base text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData[item.key]}
                    onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-200 rounded"
                    disabled={loading}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-base"
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

export default Profile;