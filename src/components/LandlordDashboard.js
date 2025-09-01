import React, { useState, useEffect } from 'react';
import { Building, Users, DollarSign, Wrench, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useProperties } from '../hooks/useProperties';
import { useTenants } from '../hooks/useTenants';
import { useMaintenanceRequests } from '../hooks/useMaintenanceRequests';
import { usePayments } from '../hooks/usePayments';
import Layout from './Layout';
import AddPropertyModal from './AddPropertyModal';
import AddBankAccountModal from './AddBankAccountModal';

const socket = io(process.env.REACT_APP_SOCKET_URL);

const LandlordDashboard = () => {
  const navigate = useNavigate();
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showAddBankAccount, setShowAddBankAccount] = useState(false);

  const { properties, loading: propertiesLoading } = useProperties();
  const { tenants, loading: tenantsLoading } = useTenants();
  const { maintenanceRequests, loading: maintenanceLoading } = useMaintenanceRequests();
  const { payments, loading: paymentsLoading } = usePayments();

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
        if (response.data.role !== 'landlord') {
          navigate(
            response.data.role === 'admin'
              ? '/admin-dashboard'
              : '/tenant-dashboard'
          );
        }
      })
      .catch(() => navigate('/login'));

    socket.on('maintenance_request', (data) =>
      console.log('New maintenance request:', data)
    );
    socket.on('payment_initiated', (data) =>
      console.log('New payment initiated:', data)
    );
    socket.on('payment_status', (data) =>
      console.log('Payment status update:', data)
    );

    return () => socket.disconnect();
  }, [navigate]);

  if (propertiesLoading || tenantsLoading || maintenanceLoading || paymentsLoading) {
    return (
      <Layout>
        <div className="min-h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const totalProperties = properties.length;
  const activeTenants = tenants.filter((t) => t.status === 'active').length;
  const pendingMaintenance = maintenanceRequests.filter(
    (r) => r.status === 'pending'
  ).length;
  const monthlyRevenue = payments
    .filter((p) => p.status === 'paid' && p.type === 'rent')
    .reduce((sum, payment) => sum + payment.amount, 0);

  const recentActivities = [
    ...payments.slice(0, 3).map((payment) => ({
      id: `payment-${payment.id}`,
      type: 'payment',
      message: `Payment of KSH${payment.amount} ${
        payment.status === 'paid' ? 'received' : 'pending'
      } via ${payment.payment_method}`,
      time: new Date(payment.created_at).toLocaleString(),
      icon: DollarSign,
      color: payment.status === 'paid' ? 'text-green-600' : 'text-yellow-600',
    })),
    ...maintenanceRequests.slice(0, 2).map((request) => ({
      id: `maintenance-${request.id}`,
      type: 'maintenance',
      message: `${request.priority} priority: ${request.title}`,
      time: new Date(request.created_at).toLocaleString(),
      icon: Wrench,
      color: request.priority === 'urgent' ? 'text-red-600' : 'text-orange-600',
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.time).getTime() - new Date(a.time).getTime()
    )
    .slice(0, 5);

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Landlord Dashboard</h1>
            <p className="text-gray-600">Manage your properties, tenants and accounts.</p>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <button
              onClick={() => setShowAddProperty(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Property
            </button>
            <button
              onClick={() => setShowAddBankAccount(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Bank Account
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Properties</p>
                <p className="text-2xl font-bold text-gray-900">{totalProperties}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-full">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Tenants</p>
                <p className="text-2xl font-bold text-gray-900">{activeTenants}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-full">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  KSH{monthlyRevenue.toLocaleString()}
                </p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          {recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-full bg-gray-50 ${activity.color}`}
                  >
                    <activity.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No recent activity
            </p>
          )}
        </div>

        {showAddProperty && (
          <AddPropertyModal onClose={() => setShowAddProperty(false)} />
        )}

        {showAddBankAccount && (
          <AddBankAccountModal onClose={() => setShowAddBankAccount(false)} />
        )}
      </div>
    </Layout>
  );
};

export default LandlordDashboard;