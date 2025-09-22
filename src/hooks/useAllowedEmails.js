import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const socket = io(process.env.REACT_APP_SOCKET_URL || 'https://metovan-backend.onrender.com');

export const useAllowedEmails = () => {
  const [allowedEmails, setAllowedEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllowedEmails = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/allowed-emails`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllowedEmails(response.data.data || response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching allowed emails:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(err.response?.data?.message || err.message || 'Failed to fetch approved emails');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllowedEmails();
    socket.on('email_approved', (data) => {
      setAllowedEmails((prev) => [...prev, data]);
    });
    socket.on('email_removed', (data) => {
      setAllowedEmails((prev) => prev.filter((email) => email.email !== data.email));
    });
    return () => {
      socket.off('email_approved');
      socket.off('email_removed');
    };
  }, []);

  return { allowedEmails, loading, error, refetch: fetchAllowedEmails };
};
