import { useState, useEffect } from 'react';
import axios from 'axios';

export const useTenants = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/tenants/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTenants(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tenants:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      setError(error.response?.data?.message || 'Failed to fetch tenant data');
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  return { tenants, loading, error, refetch };
};
