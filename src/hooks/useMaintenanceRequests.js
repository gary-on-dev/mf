import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const socket = io(process.env.REACT_APP_SOCKET_URL);

export const useMaintenanceRequests = () => {
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMaintenanceRequests = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/maintenance`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setMaintenanceRequests(response.data);
        setLoading(false);
      } catch (error) {
        setError('Failed to fetch maintenance requests');
        setLoading(false);
        console.error('Error fetching maintenance requests:', error);
      }
    };
    fetchMaintenanceRequests();

    socket.on('maintenance_request', (data) => {
      setMaintenanceRequests((prev) => [...prev, data]);
    });
    socket.on('maintenance_update', (data) => {
      setMaintenanceRequests((prev) =>
        prev.map((req) => (req.id === data.id ? data : req))
      );
    });

    return () => socket.disconnect();
  }, []);

  return { maintenanceRequests, loading, error };
};