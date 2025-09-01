import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const socket = io(process.env.REACT_APP_SOCKET_URL);

export const usePayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/payments`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setPayments(response.data);
        setLoading(false);
      } catch (error) {
        setError('Failed to fetch payments');
        setLoading(false);
        console.error('Error fetching payments:', error);
      }
    };
    fetchPayments();

    socket.on('payment_initiated', (data) => {
      setPayments((prev) => [...prev, data]);
    });
    socket.on('payment_status', (data) => {
      setPayments((prev) =>
        prev.map((payment) =>
          payment.transaction_id === data.transaction_id ? { ...payment, status: data.status } : payment
        )
      );
    });

    return () => socket.disconnect();
  }, []);

  return { payments, loading, error };
};