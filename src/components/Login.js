import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import metovan1 from '../assets/metovan1.png';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    console.log('Form submitted:', formData); // Debug
    console.log('API URL:', process.env.REACT_APP_API_URL); // Debug

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, formData, {
        headers: { 'Content-Type': 'application/json' },
      });
      console.log('Login response:', response.data); // Debug
      const { token, user } = response.data;
      if (!token || !user?.role) {
        throw new Error('Invalid response structure from server');
      }
      localStorage.setItem('token', token);
      navigate(
        user.role === 'admin' ? '/admin-dashboard' :
        user.role === 'landlord' ? '/landlord-dashboard' :
        '/tenant-dashboard'
      );
    } catch (error) {
      console.error('Login error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      setError(
        error.response?.data?.message ||
        (error.response?.status === 401
          ? 'Invalid email or password. Ensure your email is approved and account is created.'
          : 'Failed to login. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-white p-3 rounded-xl">
              <img src={metovan1} alt="Logo" className="h-12 w-12 object-contain" />
            </div>
          </div>
          <h2 className="mb-10 text-3xl font-bold text-gray-900">METOVAN</h2>
        </div>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className={`w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-600">
          Don't have an account? <a href="/signup" className="text-blue-600 hover:underline">Sign up</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
