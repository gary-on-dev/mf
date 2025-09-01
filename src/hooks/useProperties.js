import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const useProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchProperties = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to access properties');
        navigate('/login');
        return;
      }

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/properties`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Properties fetched:', response.data); // Debug
      const data = response.data.data || response.data;
      setProperties(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching properties:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch properties';
      setError(errorMessage);
      setLoading(false);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token'); // Clear invalid token
        navigate('/login');
      }
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [navigate]);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    await fetchProperties();
  };

  return { properties, loading, error, refetch };
};