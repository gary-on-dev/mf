import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const socket = io(process.env.REACT_APP_SOCKET_URL || 'https://metovan-backend.onrender.com');

export const useMaintenanceRequests = () => {
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMaintenanceRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/maintenance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMaintenanceRequests(response.data.data || response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching maintenance requests:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      setError(error.response?.data?.message || error.message || 'Failed to fetch maintenance requests');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenanceRequests();

    socket.on('maintenance_request', (data) => {
      setMaintenanceRequests((prev) => [...prev, data]);
    });
    socket.on('maintenance_update', (data) => {
      setMaintenanceRequests((prev) =>
        prev.map((req) => (req.id === data.id ? data : req))
      );
    });

    return () => {
      socket.off('maintenance_request');
      socket.off('maintenance_update');
      socket.disconnect();
    };
  }, []);

  return { maintenanceRequests, loading, error, refetch: fetchMaintenanceRequests };
};
