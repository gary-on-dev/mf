import { useState, useEffect } from 'react';
import axios from 'axios';

export const useTenants = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Fetch user role to determine the correct endpoint
      const userResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userRole = userResponse.data.role;

      let endpoint;
      if (userRole === 'admin') {
        endpoint = `${process.env.REACT_APP_API_URL}/api/tenants/all`;
      } else if (userRole === 'tenant') {
        endpoint = `${process.env.REACT_APP_API_URL}/api/tenants/me`;
      } else {
        throw new Error('Unauthorized role for fetching tenants');
      }

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTenants(response.data.data || response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tenants:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      setError(error.response?.data?.message || error.message || 'Failed to fetch tenant data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  return { tenants, loading, error, refetch: fetchTenants };
};
