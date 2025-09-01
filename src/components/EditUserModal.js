// EditUserModal.js
import React, { useState } from 'react';
import axios from 'axios';

const EditUserModal = ({ user, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    role: user.role || 'landlord',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/users/${user.id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onUpdate(response.data);
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error.response?.data?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-sm w-full max-w-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit User</h2>
        {error && <p className="text-red-600 text-base mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-base text-gray-700">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full border border-gray-200 rounded-md shadow-sm p-2 text-base focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-base text-gray-700">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full border border-gray-200 rounded-md shadow-sm p-2 text-base focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-base text-gray-700">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1 block w-full border border-gray-200 rounded-md shadow-sm p-2 text-base focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-base text-gray-700">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="mt-1 block w-full border border-gray-200 rounded-md shadow-sm p-2 text-base focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="landlord">Landlord</option>
              <option value="agent">Agent</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-base text-gray-600 hover:text-gray-800"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-base"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;