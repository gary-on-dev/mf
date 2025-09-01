import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useProperties } from '../hooks/useProperties';

const EditTenantModal = ({ tenant, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: tenant.name,
    email: tenant.email,
    phone: tenant.phone || '',
    role: 'tenant',
    property_id: tenant.property_id,
    status: tenant.status,
    lease_start: tenant.lease_start.split('T')[0],
    lease_end: tenant.lease_end.split('T')[0],
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const { properties, loading: propertiesLoading, error: propertiesError } = useProperties();

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.property_id) {
      return 'Please provide tenant name, email, and property';
    }
    if (!formData.lease_start || !formData.lease_end) {
      return 'Please provide lease start and end dates';
    }
    if (new Date(formData.lease_end) <= new Date(formData.lease_start)) {
      return 'Lease end date must be after lease start date';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Update user
      const userResponse = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/users/${tenant.user_id}`,
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: 'tenant',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Tenant user updated:', userResponse.data);
      // Update tenancy
      const tenantResponse = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/tenants/${tenant.id}`,
        {
          user_id: tenant.user_id,
          property_id: formData.property_id,
          status: formData.status,
          lease_start: formData.lease_start,
          lease_end: formData.lease_end,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Tenancy updated:', tenantResponse.data);
      setSuccessMessage('Tenant updated successfully!');
      onUpdate({ ...tenantResponse.data.data, name: formData.name, email: formData.email });
      setTimeout(() => {
        if (typeof onClose === 'function') {
          onClose();
        }
      }, 1500);
    } catch (error) {
      console.error('Error updating tenant:', error);
      setError(error.response?.data?.message || 'Failed to update tenant');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancel = () => {
    console.log('Edit tenant modal cancel clicked');
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  if (loading || propertiesLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-xs sm:max-w-md">
          <p className="text-gray-600 text-center text-xs sm:text-base">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 overflow-y-auto py-4 sm:py-0">
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-xs sm:max-w-md mx-4 sm:mx-0">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Edit Tenant</h3>
        {(error || propertiesError) && <p className="text-red-600 text-xs sm:text-sm mb-4">{error || propertiesError}</p>}
        {successMessage && <p className="text-green-600 text-xs sm:text-sm mb-4">{successMessage}</p>}
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700">Tenant Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={submitLoading}
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={submitLoading}
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500"
              disabled={submitLoading}
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700">Property</label>
            <select
              value={formData.property_id}
              onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={submitLoading}
            >
              <option value="">Select Property</option>
              {Array.isArray(properties) && properties.length > 0 ? (
                properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))
              ) : (
                <option disabled>No properties available</option>
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500"
              disabled={submitLoading}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700">Lease Start</label>
            <input
              type="date"
              value={formData.lease_start}
              onChange={(e) => setFormData({ ...formData, lease_start: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={submitLoading}
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700">Lease End</label>
            <input
              type="date"
              value={formData.lease_end}
              onChange={(e) => setFormData({ ...formData, lease_end: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={submitLoading}
            />
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="w-full sm:w-auto bg-gray-300 text-gray-700 px-3 sm:px-4 py-2 rounded-md hover:bg-gray-400 disabled:opacity-50 text-xs sm:text-sm min-h-[38px]"
              disabled={submitLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto bg-green-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 text-xs sm:text-sm min-h-[38px]"
              disabled={submitLoading}
            >
              {submitLoading ? 'Updating...' : 'Update Tenant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTenantModal;