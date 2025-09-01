import React, { useState } from 'react';
import axios from 'axios';
import { useProperties } from '../hooks/useProperties';

const AddTenantModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    property_id: '',
    role: 'tenant',
  });
  const [error, setError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const { properties, loading: propertiesLoading, error: propertiesError } = useProperties();

  const validateForm = () => {
    if (!formData.email || !formData.property_id) {
      return 'Please provide email and property';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return 'Please provide a valid email';
    }
    return null;
  };

  const checkEmailAvailability = async (email) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }
      const normalizedEmail = email.toLowerCase();
      const [usersResponse, allowedResponse] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${process.env.REACT_APP_API_URL}/api/auth/allowed-emails`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const users = usersResponse.data.data || usersResponse.data;
      const allowedEmails = allowedResponse.data.data || allowedResponse.data;
      const isUser = users.some((user) => user.email.toLowerCase() === normalizedEmail);
      const isAllowed = allowedEmails.some((ae) => ae.email.toLowerCase() === normalizedEmail);
      
      if (isUser) {
        setError('This email is already registered as a user.');
        return false;
      }
      if (isAllowed) {
        setError('This email is already approved for signup.');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error checking email availability:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to check email availability';
      setError(errorMessage);
      return false;
    }
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

    const isEmailAvailable = await checkEmailAvailability(formData.email);
    if (!isEmailAvailable) {
      return; // Error is already set in checkEmailAvailability
    }

    setSubmitLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to approve emails');
        return;
      }

      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/allowed-emails`,
        {
          email: formData.email.toLowerCase(),
          role: formData.role,
          property_id: formData.property_id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const selectedProperty = properties.find((p) => p.id === parseInt(formData.property_id));
      setSuccessMessage(
        `Email approved successfully! The tenant can now sign up with this email and will be assigned to ${selectedProperty?.name || 'the selected property'}.`
      );
      setTimeout(() => {
        if (typeof onClose === 'function') {
          onClose();
        } else {
          console.warn('onClose is not a function');
        }
      }, 2000);
    } catch (error) {
      console.error('Error approving email:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to approve email. Please check server connection or try again.';
      setError(errorMessage);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancel = () => {
    console.log('Tenant modal cancel clicked');
    if (typeof onClose === 'function') {
      onClose();
    } else {
      console.warn('onClose is not a function');
    }
  };

  if (propertiesLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-xs sm:max-w-md">
          <p className="text-gray-600 text-center text-xs sm:text-base">Loading properties...</p>
        </div>
      </div>
    );
  }

  if (propertiesError) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-xs sm:max-w-md">
          <p className="text-red-600 text-center text-xs sm:text-base">{propertiesError}</p>
          <button
            onClick={handleCancel}
            className="mt-4 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 overflow-y-auto py-4 sm:py-0">
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-xs sm:max-w-md mx-4 sm:mx-0">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Approve Tenant Email</h3>
        {(error || propertiesError) && (
          <p className="text-red-600 text-xs sm:text-sm mb-4">{error || propertiesError}</p>
        )}
        {successMessage && (
          <p className="text-green-600 text-xs sm:text-sm mb-4">{successMessage}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700">Tenant Email</label>
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
              {submitLoading ? 'Approving...' : 'Approve Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTenantModal;