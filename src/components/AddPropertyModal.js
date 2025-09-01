import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddPropertyModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    rent_amount: '',
    landlord_id: '',
    bank_account_id: '',
  });
  const [landlords, setLandlords] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [filteredBankAccounts, setFilteredBankAccounts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        const [landlordsResponse, bankResponse] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/api/users`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${process.env.REACT_APP_API_URL}/api/bankaccounts`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        console.log('Landlords fetched:', landlordsResponse.data);
        console.log('Bank accounts fetched:', bankResponse.data);
        const landlordsData = landlordsResponse.data.data || landlordsResponse.data;
        setLandlords(Array.isArray(landlordsData) ? landlordsData.filter(user => user.role === 'landlord') : []);
        const bankData = bankResponse.data.data || bankResponse.data;
        setBankAccounts(Array.isArray(bankData) ? bankData : []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.response?.data?.message || 'Failed to fetch landlords or bank accounts');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    // Filter bank accounts when landlord_id changes
    if (formData.landlord_id) {
      const filtered = bankAccounts.filter(account => account.user_id === Number(formData.landlord_id));
      setFilteredBankAccounts(filtered);
      // Reset bank_account_id if it’s not in filtered accounts
      if (!filtered.some(account => account.id === Number(formData.bank_account_id))) {
        setFormData(prev => ({ ...prev, bank_account_id: '' }));
      }
    } else {
      setFilteredBankAccounts([]);
      setFormData(prev => ({ ...prev, bank_account_id: '' }));
    }
  }, [formData.landlord_id, bankAccounts]);

  const validateForm = () => {
    if (!formData.name || !formData.address || !formData.rent_amount) {
      return 'Please provide property name, address, and rent amount';
    }
    if (!formData.landlord_id) {
      return 'Please select a landlord';
    }
    if (isNaN(formData.rent_amount) || Number(formData.rent_amount) <= 0) {
      return 'Rent amount must be a positive number';
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
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/properties`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Property added:', response.data);
      setSuccessMessage('Property added successfully!');
      setTimeout(() => {
        if (typeof onClose === 'function') {
          onClose();
        } else {
          console.warn('onClose is not a function');
        }
      }, 1500);
    } catch (error) {
      console.error('Error adding property:', error);
      setError(error.response?.data?.message || 'Failed to add property');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancel = () => {
    console.log('Property modal cancel clicked');
    if (typeof onClose === 'function') {
      onClose();
    } else {
      console.warn('onClose is not a function');
    }
  };

  if (loading) {
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
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Add Property</h3>
        {error && <p className="text-red-600 text-xs sm:text-sm mb-4">{error}</p>}
        {successMessage && <p className="text-green-600 text-xs sm:text-sm mb-4">{successMessage}</p>}
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700">Property Name</label>
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
            <label className="block text-xs sm:text-sm font-medium text-gray-700">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={submitLoading}
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500"
              rows="3"
              disabled={submitLoading}
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700">Rent Amount (KSH)</label>
            <input
              type="number"
              value={formData.rent_amount}
              onChange={(e) => setFormData({ ...formData, rent_amount: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={submitLoading}
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700">Landlord</label>
            <select
              value={formData.landlord_id}
              onChange={(e) => setFormData({ ...formData, landlord_id: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={submitLoading}
            >
              <option value="">Select Landlord</option>
              {Array.isArray(landlords) && landlords.length > 0 ? (
                landlords.map((landlord) => (
                  <option key={landlord.id} value={landlord.id}>
                    {landlord.name} ({landlord.email})
                  </option>
                ))
              ) : (
                <option disabled>No landlords available</option>
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700">Bank Account</label>
            <select
              value={formData.bank_account_id}
              onChange={(e) => setFormData({ ...formData, bank_account_id: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500"
              disabled={submitLoading || !formData.landlord_id}
            >
              <option value="">Select Bank Account (Optional)</option>
              {Array.isArray(filteredBankAccounts) && filteredBankAccounts.length > 0 ? (
                filteredBankAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.bank_name} - {account.account_number}
                  </option>
                ))
              ) : (
                <option disabled>No bank accounts available for this landlord</option>
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
              className="w-full sm:w-auto bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-xs sm:text-sm min-h-[38px]"
              disabled={submitLoading}
            >
              {submitLoading ? 'Adding...' : 'Add Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPropertyModal;