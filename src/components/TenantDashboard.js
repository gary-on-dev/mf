import React, { useState, useEffect } from 'react';
import { Wrench, DollarSign, User, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useTenants } from '../hooks/useTenants';
import { useMaintenanceRequests } from '../hooks/useMaintenanceRequests';
import { usePayments } from '../hooks/usePayments';
import Layout from './Layout';

// Initialize Socket.IO with explicit options
const socket = io(process.env.REACT_APP_SOCKET_URL || 'https://metovan-backend.onrender.com', {
  transports: ['websocket', 'polling'], // Prefer WebSocket, fallback to polling
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

const TenantDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('transactions');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [slideDirection, setSlideDirection] = useState('');
  const [maintenanceData, setMaintenanceData] = useState({
    title: '',
    description: '',
    priority: 'low',
    property_id: '',
  });
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_method: 'mpesa',
    phone_number: '',
    property_id: '',
  });

  const { tenants, loading: tenantsLoading, error: tenantsError } = useTenants();
  const { maintenanceRequests, loading: maintenanceLoading, error: maintenanceError } = useMaintenanceRequests();
  const { payments, loading: paymentsLoading } = usePayments();

  const tenant = tenants.length > 0 ? tenants[0] : null;

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleTabChange = (tabId) => {
    const currentIndex = ['transactions', 'maintenance', 'profile'].indexOf(activeTab);
    const newIndex = ['transactions', 'maintenance', 'profile'].indexOf(tabId);
    setSlideDirection(newIndex > currentIndex ? 'right' : 'left');
    setActiveTab(tabId);
    setSidebarOpen(false);
    setTimeout(() => setSlideDirection(''), 300);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    axios
      .get(`${process.env.REACT_APP_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        if (response.data.role !== 'tenant') {
          navigate(response.data.role === 'admin' ? '/admin-dashboard' : '/landlord-dashboard');
        }
        if (tenant) {
          setMaintenanceData((prev) => ({ ...prev, property_id: tenant.property_id || '' }));
          setPaymentData((prev) => ({
            ...prev,
            property_id: tenant.property_id || '',
            phone_number: response.data.phone || '',
          }));
        }
      })
      .catch((error) => {
        console.error('Auth error:', error.response?.data || error.message);
        navigate('/login');
      });

    socket.on('connect', () => {
      console.log('Socket.IO connected');
    });
    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error.message);
    });
    socket.on('maintenance_request', (data) => {
      console.log('New maintenance request:', data);
    });
    socket.on('payment_initiated', (data) => {
      console.log('New payment initiated:', data);
    });
    socket.on('payment_status', (data) => {
      console.log('Payment status update:', data);
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('maintenance_request');
      socket.off('payment_initiated');
      socket.off('payment_status');
    };
  }, [navigate, tenant]);

  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault();
    setShowMaintenanceForm(false);
    try {
      if (!tenant) {
        alert('Tenant information not available');
        return;
      }
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/maintenance`,
        maintenanceData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      alert('Maintenance request submitted successfully');
      setMaintenanceData({
        title: '',
        description: '',
        priority: 'low',
        property_id: tenant?.property_id || '',
      });
    } catch (error) {
      console.error('Error submitting maintenance request:', {
        message: error.message,
        response: error.response?.data,
      });
      alert(error.response?.data?.message || 'Failed to submit maintenance request');
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setShowPaymentForm(false);
    try {
      if (!tenant) {
        alert('Tenant information not available');
        return;
      }
      if (!paymentData.amount || isNaN(paymentData.amount) || paymentData.amount <= 0) {
        alert('Please enter a valid amount');
        return;
      }
      if (!paymentData.payment_method) {
        alert('Please select a payment method');
        return;
      }
      if (paymentData.payment_method === 'mpesa' && !paymentData.phone_number) {
        alert('Phone number is required for M-Pesa');
        return;
      }
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/payments`,
        {
          amount: parseFloat(paymentData.amount),
          payment_method: paymentData.payment_method,
          phone_number: paymentData.payment_method === 'mpesa' ? paymentData.phone_number : null,
          property_id: paymentData.property_id,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      alert(response.data.message || 'Payment initiated successfully');
      setPaymentData({
        amount: '',
        payment_method: 'mpesa',
        phone_number: tenant?.phone || '',
        property_id: tenant?.property_id || '',
      });
    } catch (error) {
      console.error('Error initiating payment:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      alert(error.response?.data?.message || 'Failed to initiate payment');
    }
  };

  if (tenantsLoading || maintenanceLoading || paymentsLoading) {
    return (
      <Layout role="tenant" onMenuToggle={toggleSidebar}>
        <div className="min-h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm">Loading dashboard...</p>
          </div>
      </div>
        </Layout>
      );
    );
  }

  if (tenantsError || maintenanceError) {
    return (
      <Layout role="tenant" onMenuToggle={toggleSidebar}>
        <div className="min-h-96 flex items-center justify-center">
          <p className="text-red-600 text-sm">{tenantsError || maintenanceError}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="tenant" onMenuToggle={toggleSidebar}>
      <div className="flex min-h-screen">
        <aside
          className={`fixed top-0 left-0 w-64 bg-white shadow-md z-40 md:static md:flex md:flex-col h-auto ${
            sidebarOpen ? 'block' : 'hidden'
          } md:block`}
        >
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Tenant Menu</h2>
            <button
              onClick={toggleSidebar}
              className="md:hidden text-gray-600 hover:text-gray-800"
              title="Close Sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="p-4">
            <ul className="space-y-2">
              {[
                { id: 'transactions', label: 'Transactions', icon: DollarSign },
                { id: 'maintenance', label: 'Maintenance Requests', icon: Wrench },
                { id: 'profile', label: 'Profile', icon: User },
              ].map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="flex-1 p-4">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Tenant Dashboard</h1>
                <p className="text-gray-600 text-sm">Manage your rent and maintenance requests.</p>
              </div>
              {activeTab === 'transactions' && (
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 flex items-center gap-1 text-sm"
                >
                  <DollarSign className="h-4 w-4" />
                  Pay Rent
                </button>
              )}
              {activeTab === 'maintenance' && (
                <button
                  onClick={() => setShowMaintenanceForm(true)}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 flex items-center gap-1 text-sm"
                >
                  <Wrench className="h-4 w-4" />
                  Request Maintenance
                </button>
              )}
            </div>

            <div
              className={`bg-white p-4 rounded-lg shadow relative transition-transform duration-300 ease-in-out ${
                slideDirection === 'right' ? 'translate-x-10 opacity-0' : slideDirection === 'left' ? '-translate-x-10 opacity-0' : 'translate-x-0 opacity-100'
              }`}
            >
              {activeTab === 'transactions' && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    Payment History - {tenant?.property_name || 'Your Property'}
                  </h3>
                  {payments.length > 0 ? (
                    <div className="space-y-3">
                      {payments.map((payment) => (
                        <div key={payment.id} className="flex items-start gap-2 border-b pb-2">
                          <div
                            className={`p-1.5 rounded-full bg-gray-50 ${
                              payment.status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                            }`}
                          >
                            <DollarSign className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs sm:text-sm text-gray-900">
                              KSH{payment.amount} via {payment.payment_method} for {tenant?.property_name || 'Property'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {payment.status} - {new Date(payment.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">No payments yet</p>
                  )}
                </div>
              )}

              {activeTab === 'maintenance' && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    Maintenance Requests - {tenant?.property_name || 'Your Property'}
                  </h3>
                  {maintenanceRequests.length > 0 ? (
                    <div className="space-y-3">
                      {maintenanceRequests.map((request) => (
                        <div key={request.id} className="flex items-start gap-2 border-b pb-2">
                          <div
                            className={`p-1.5 rounded-full bg-gray-50 ${
                              request.priority === 'urgent' ? 'text-red-600' : 'text-orange-600'
                            }`}
                          >
                            <Wrench className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs sm:text-sm text-gray-900">{request.title}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {request.status} - {new Date(request.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">No maintenance requests yet</p>
                  )}
                </div>
              )}

              {activeTab === 'profile' && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Profile</h3>
                  <p className="text-gray-500 text-sm">
                    Manage your profile settings in the dedicated Profile page.
                  </p>
                  <button
                    onClick={() => navigate('/tenant-profile')}
                    className="mt-4 bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 text-sm"
                  >
                    Go to Profile
                  </button>
                </div>
              )}
            </div>
          </div>

          {showMaintenanceForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-4 rounded-lg shadow-lg max-w-sm w-full">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Request Maintenance</h3>
                <form onSubmit={handleMaintenanceSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      value={maintenanceData.title}
                      onChange={(e) =>
                        setMaintenanceData({ ...maintenanceData, title: e.target.value })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Description</label>
                    <textarea
                      value={maintenanceData.description}
                      onChange={(e) =>
                        setMaintenanceData({ ...maintenanceData, description: e.target.value })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Priority</label>
                    <select
                      value={maintenanceData.priority}
                      onChange={(e) =>
                        setMaintenanceData({ ...maintenanceData, priority: e.target.value })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Property</label>
                    <input
                      type="text"
                      value={tenant?.property_name || ''}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm bg-gray-100"
                      disabled
                    />
                    <input type="hidden" value={tenant?.property_id || ''} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowMaintenanceForm(false)}
                      className="bg-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 text-sm"
                    >
                      Submit
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showPaymentForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-4 rounded-lg shadow-lg max-w-sm w-full">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Make Payment</h3>
                <form onSubmit={handlePaymentSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Amount (KSH)</label>
                    <input
                      type="number"
                      value={paymentData.amount}
                      onChange={(e) =>
                        setPaymentData({ ...paymentData, amount: e.target.value })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Payment Method</label>
                    <select
                      value={paymentData.payment_method}
                      onChange={(e) =>
                        setPaymentData({ ...paymentData, payment_method: e.target.value })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                    >
                      <option value="mpesa">M-Pesa</option>
                      <option value="bank">Bank Transfer</option>
                    </select>
                  </div>
                  {paymentData.payment_method === 'mpesa' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Phone Number</label>
                      <input
                        type="text"
                        value={paymentData.phone_number}
                        onChange={(e) =>
                          setPaymentData({ ...paymentData, phone_number: e.target.value })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                        required
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Property</label>
                    <input
                      type="text"
                      value={tenant?.property_name || ''}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm bg-gray-100"
                      disabled
                    />
                    <input type="hidden" value={tenant?.property_id || ''} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
                      className="bg-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 text-sm"
                    >
                      Pay
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TenantDashboard;
