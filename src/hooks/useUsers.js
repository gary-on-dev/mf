import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const socket = io(process.env.REACT_APP_SOCKET_URL || 'https://metovan-backend.onrender.com');

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data.data || response.data);
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(err.response?.data?.message || err.message || 'Failed to fetch users');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    socket.on('user_created', (data) => {
      setUsers((prev) => [...prev, data]);
    });
    socket.on('user_updated', (data) => {
      setUsers((prev) => prev.map((user) => (user.id === data.id ? data : user)));
    });
    socket.on('user_deleted', (data) => {
      setUsers((prev) => prev.filter((user) => user.id !== data.id));
    });
    socket.on('email_approved', (data) => {
      console.log('Email approved:', data);
      // Optionally refresh users or show in a separate "pending" list
    });
    socket.on('email_removed', (data) => {
      console.log('Email removed:', data);
    });
    return () => {
      socket.off('user_created');
      socket.off('user_updated');
      socket.off('user_deleted');
      socket.off('email_approved');
      socket.off('email_removed');
      socket.disconnect();
    };
  }, []);

  return { users, loading, error, refetch: fetchUsers };
};
