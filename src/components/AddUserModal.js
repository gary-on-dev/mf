import React, { useState } from 'react';
import axios from 'axios';

const AddUserModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'admin', // Default to 'admin'
    bank_name: '',
    bank_account_number: '',
    bank_routing_number: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Validate form inputs
  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.role) {
      return 'Name, email, and role are required';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return 'Please provide a valid email';
    }
    if (!['admin', 'agent', 'landlord', 'tenant'].includes(formData.role)) {
      return 'Invalid role selected';
    }
    if (formData.role === 'landlord') {
      if (!formData.bank_name || !formData.bank_account_number) {
        return 'Bank name and account number are required for landlords';
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      // Map 'agent' to 'admin' for backend
      const role = formData.role === 'agent' ? 'admin' : formData.role;

      // Step 1: Add email to allowed_emails
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/allowed-emails`,
        {
          email: formData.email.toLowerCase(),
          role,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Step 2: Create user
      const payload = {
        name: formData.name,
        email: formData.email.toLowerCase(),
        phone: formData.phone || null,
        role,
      };
      if (formData.role === 'landlord') {
        payload.bank_name = formData.bank_name;
        payload.bank_account_number = formData.bank_account_number;
        payload.bank_routing_number = formData.bank_routing_number || null;
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/users`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMessage(`User added successfully! Temporary password: ${response.data.temporaryPassword}`);
      setTimeout(() => {
        if (typeof onClose === 'function') {
          onClose();
        } else {
          console.warn('onClose is not a function');
        }
      }, 2000);
    } catch (error) {
      console.error('Error adding user:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to add user';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-sm w-full max-w-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add User</h2>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        {successMessage && <p className="text-green-600 text-sm mb-4">{successMessage}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full border border-gray-200 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full border border-gray-200 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1 block w-full border border-gray-200 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="mt-1 block w-full border border-gray-200 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
            >
              <option value="admin">Admin</option>
              <option value="agent">Agent</option>
              <option value="landlord">Landlord</option>
              <option value="tenant">Tenant</option>
            </select>
          </div>
          {formData.role === 'landlord' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="mt-1 block w-full border border-gray-200 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bank Account Number</label>
                <input
                  type="text"
                  value={formData.bank_account_number}
                  onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                  className="mt-1 block w-full border border-gray-200 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bank Routing Number (Optional)</label>
                <input
                  type="text"
                  value={formData.bank_routing_number}
                  onChange={(e) => setFormData({ ...formData, bank_routing_number: e.target.value })}
                  className="mt-1 block w-full border border-gray-200 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
            </>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
