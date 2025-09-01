import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import metovan1 from '../assets/metovan1.png';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'tenant',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password) {
      return 'Please provide name, email, and password';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return 'Please provide a valid email';
    }
    if (formData.password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (formData.phone && !/^\+?\d{10,15}$/.test(formData.phone)) {
      return 'Please provide a valid phone number (10-15 digits)';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/signup`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || null,
        role: formData.role,
      });

      localStorage.setItem('token', response.data.token);
      navigate(formData.role === 'tenant' ? '/tenant-dashboard' : '/landlord-dashboard');
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to sign up. Please ensure your email is approved or try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center">
                  <div className="flex justify-center">
                    <div className="bg-white-600 p-3 rounded-xl">
                      <img
                        src={metovan1}
                        alt="Logo"
                        className="h-12 w-12 object-contain"
                      />
                      
                    </div>
                  </div>
                <h2 className="mb-5 text-3xl font-bold text-gray-900">METOVAN</h2>
                </div>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
            >
              <option value="tenant">Tenant</option>
              <option value="landlord">Landlord</option>
              <option value="admin">Agent</option>
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Signing Up...' : 'Sign Up'}
            </button>
            
          </div>
          <p className="mt-4 text-sm text-gray-600">
                      Already have an account? <a href="/login" className="text-blue-600 hover:underline">Login</a>
                    </p>
        </form>

      </div>
    </div>
  );
};

export default Signup;