import React, { useState, useEffect } from 'react';
import { Building, Users, TrendingUp, Wrench, DollarSign, AlertCircle, Plus, Edit, Trash, Home, FileText, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useProperties } from '../hooks/useProperties';
import { useTenants } from '../hooks/useTenants';
import { useMaintenanceRequests } from '../hooks/useMaintenanceRequests';
import { usePayments } from '../hooks/usePayments';
import Layout from './Layout';
import AddPropertyModal from './AddPropertyModal';
import AddTenantModal from './AddTenantModal';
import AddUserModal from './AddUserModal';
import EditUserModal from './EditUserModal';
import EditPropertyModal from './EditPropertyModal';
import EditTenantModal from './EditTenantModal';

// Initialize socket connection
const socket = io(process.env.REACT_APP_SOCKET_URL || 'https://metovan-backend.onrender.com');

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(null);
  const [showEditProperty, setShowEditProperty] = useState(null);
  const [showEditTenant, setShowEditTenant] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [slideDirection, setSlideDirection] = useState(''); // For CRUD content slide

  const { properties, loading: propertiesLoading, error: propertiesError, refetch: refetchProperties } = useProperties();
  const { tenants, loading: tenantsLoading, error: tenantsError, refetch: refetchTenants } = useTenants();
  const { maintenanceRequests, loading: maintenanceLoading, error: maintenanceError } = useMaintenanceRequests();
  const { payments, loading: paymentsLoading } = usePayments();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleTabChange = (tabId) => {
    const currentIndex = ['users', 'properties', 'tenants', 'maintenance', 'reports'].indexOf(activeTab);
    const newIndex = ['users', 'properties', 'tenants', 'maintenance', 'reports'].indexOf(tabId);
    setSlideDirection(newIndex > currentIndex ? 'right' : 'left');
    setActiveTab(tabId);
    setSidebarOpen(false); // Close sidebar on mobile
    setTimeout(() => setSlideDirection(''), 300); // Reset slide direction after animation
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch users (landlords and agents)
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data.data || response.data;
        setUsers(Array.isArray(data) ? data.filter(user => ['landlord', 'agent'].includes(user.role)) : []);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();

    // Verify user role
    axios
      .get(`${process.env.REACT_APP_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        if (response.data.role !== 'admin') {
          navigate(response.data.role === 'landlord' ? '/landlord-dashboard' : '/tenant-dashboard');
        }
      })
      .catch((error) => {
        console.error('Auth error:', error);
        navigate('/login');
      });

    // Socket event listeners (unchanged)
    socket.on('maintenance_request', (data) => {
      setRecentActivities((prev) => [
        {
          id: `maintenance-${data.id}`,
          type: 'maintenance',
          message: `${data.priority} priority: ${data.title}`,
          time: new Date(data.created_at).toLocaleDateString(),
          icon: Wrench,
          color: data.priority === 'urgent' ? 'text-red-600' : 'text-orange-600',
        },
        ...prev.slice(0, 4),
      ]);
    });

    socket.on('payment_initiated', (data) => {
      setRecentActivities((prev) => [
        {
          id: `payment-${data.id}`,
          type: 'payment',
          message: `Payment of KSH${data.amount} initiated via ${data.payment_method}`,
          time: new Date(data.created_at).toLocaleDateString(),
          icon: DollarSign,
          color: 'text-yellow-600',
        },
        ...prev.slice(0, 4),
      ]);
    });

    socket.on('payment_status', (data) => {
      setRecentActivities((prev) => [
        {
          id: `payment-${data.transaction_id}`,
          type: 'payment',
          message: `Payment ${data.status}: ${data.message}`,
          time: new Date().toLocaleDateString(),
          icon: DollarSign,
          color: data.status === 'paid' ? 'text-green-600' : 'text-red-600',
        },
        ...prev.slice(0, 4),
      ]);
    });

    socket.on('user_created', (data) => {
      setRecentActivities((prev) => [
        {
          id: `user-${data.id}`,
          type: 'user',
          message: `New ${data.role} added: ${data.name}`,
          time: new Date().toLocaleDateString(),
          icon: Users,
          color: 'text-blue-600',
        },
        ...prev.slice(0, 4),
      ]);
      if (['landlord', 'agent'].includes(data.role)) {
        setUsers((prev) => [...prev, { id: data.id, name: data.name, role: data.role, email: data.email || '', phone: data.phone || '' }]);
      }
    });

    socket.on('user_updated', (data) => {
      setRecentActivities((prev) => [
        {
          id: `user-${data.id}`,
          type: 'user',
          message: `${data.role} updated: ${data.name}`,
          time: new Date().toLocaleDateString(),
          icon: Users,
          color: 'text-blue-600',
        },
        ...prev.slice(0, 4),
      ]);
      if (['landlord', 'agent'].includes(data.role)) {
        setUsers((prev) =>
          prev.map((u) => (u.id === data.id ? { ...u, name: data.name, role: data.role, email: data.email || '', phone: data.phone || '' } : u))
        );
      }
    });

    socket.on('user_deleted', (data) => {
      setRecentActivities((prev) => [
        {
          id: `user-${data.id}`,
          type: 'user',
          message: `${data.role} deleted`,
          time: new Date().toLocaleDateString(),
          icon: Users,
          color: 'text-red-600',
        },
        ...prev.slice(0, 4),
      ]);
      if (['landlord', 'agent'].includes(data.role)) {
        setUsers((prev) => prev.filter((u) => u.id !== data.id));
      }
    });

    socket.on('property_created', (data) => {
      setRecentActivities((prev) => [
        {
          id: `property-${data.id}`,
          type: 'property',
          message: `New property added: ${data.name}`,
          time: new Date().toLocaleDateString(),
          icon: Building,
          color: 'text-blue-600',
        },
        ...prev.slice(0, 4),
      ]);
      refetchProperties();
    });

    socket.on('property_updated', (data) => {
      setRecentActivities((prev) => [
        {
          id: `property-${data.id}`,
          type: 'property',
          message: `Property updated: ${data.name}`,
          time: new Date().toLocaleDateString(),
          icon: Building,
          color: 'text-blue-600',
        },
        ...prev.slice(0, 4),
      ]);
      refetchProperties();
    });

    socket.on('property_deleted', (data) => {
      setRecentActivities((prev) => [
        {
          id: `property-${data.id}`,
          type: 'property',
          message: `Property deleted`,
          time: new Date().toLocaleDateString(),
          icon: Building,
          color: 'text-red-600',
        },
        ...prev.slice(0, 4),
      ]);
      refetchProperties();
    });

    socket.on('tenant_created', (data) => {
  setRecentActivities((prev) => [
    {
      id: `tenant-${data.id}`,
      type: 'tenant',
      message: `New tenant assigned to property ${data.property_id}`,
      time: new Date().toLocaleDateString(),
      icon: Users,
      color: 'text-green-600',
    },
    ...prev.slice(0, 4),
  ]);
  if (typeof refetchTenants === 'function') {
    refetchTenants().catch((error) => {
      console.error('Error refetching tenants:', error);
    });
  } else {
    console.warn('refetchTenants is not a function');
  }
});

    socket.on('tenant_updated', (data) => {
      setRecentActivities((prev) => [
        {
          id: `tenant-${data.id}`,
          type: 'tenant',
          message: `Tenant updated for property ${data.property_id}`,
          time: new Date().toLocaleDateString(),
          icon: Users,
          color: 'text-green-600',
        },
        ...prev.slice(0, 4),
      ]);
      refetchTenants();
    });

    socket.on('tenant_deleted', (data) => {
      setRecentActivities((prev) => [
        {
          id: `tenant-${data.id}`,
          type: 'tenant',
          message: `Tenant removed`,
          time: new Date().toLocaleDateString(),
          icon: Users,
          color: 'text-red-600',
        },
        ...prev.slice(0, 4),
      ]);
      refetchTenants();
    });

    return () => {
      socket.off('maintenance_request');
      socket.off('payment_initiated');
      socket.off('payment_status');
      socket.off('user_created');
      socket.off('user_updated');
      socket.off('user_deleted');
      socket.off('property_created');
      socket.off('property_updated');
      socket.off('property_deleted');
      socket.off('tenant_created');
      socket.off('tenant_updated');
      socket.off('tenant_deleted');
    };
  }, [navigate, refetchProperties, refetchTenants]);

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/users/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('User deleted:', id);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleDeleteProperty = async (id) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/properties/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('Property deleted:', id);
    } catch (error) {
      console.error('Error deleting property:', error);
      alert(error.response?.data?.message || 'Failed to delete property');
    }
  };

  const handleDeleteTenant = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tenant?')) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/tenants/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('Tenant deleted:', id);
    } catch (error) {
      console.error('Error deleting tenant:', error);
      alert(error.response?.data?.message || 'Failed to delete tenant');
    }
  };

  const handleUpdateUser = (updatedUser) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
    );
    setShowEditUser(null);
  };

  const handleUpdateProperty = (updatedProperty) => {
    refetchProperties();
    setShowEditProperty(null);
  };

  const handleUpdateTenant = (updatedTenant) => {
    refetchTenants();
    setShowEditTenant(null);
  };

  const handleCloseModal = (type) => {
    console.log(`Closing ${type} modal`);
    if (type === 'property') setShowAddProperty(false);
    if (type === 'tenant') setShowAddTenant(false);
    if (type === 'user') setShowAddUser(false);
    if (type === 'editUser') setShowEditUser(null);
    if (type === 'editProperty') setShowEditProperty(null);
    if (type === 'editTenant') setShowEditTenant(null);
  };

  if (propertiesLoading || tenantsLoading || maintenanceLoading || paymentsLoading) {
    return (
      <Layout onMenuToggle={toggleSidebar}>
        <div className="min-h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm">Loading dashboard...</p>
          </div>
        </div>  
        </Layout>
      );
  }

  if (propertiesError) {
    return (
      <Layout onMenuToggle={toggleSidebar}>
        <div className="min-h-96 flex items-center justify-center">
          <p className="text-red-600 text-sm">{propertiesError}</p>
        </div>
      </Layout>
    );
  }

  const totalProperties = Array.isArray(properties) ? properties.length : 0;
  const activeTenants = Array.isArray(tenants)
    ? tenants.filter((t) => t.status === 'active').length
    : 0;
  const pendingMaintenance = Array.isArray(maintenanceRequests)
    ? maintenanceRequests.filter((r) => r.status === 'pending').length
    : 0;
  const urgentMaintenance = Array.isArray(maintenanceRequests)
    ? maintenanceRequests.filter((r) => r.priority === 'urgent').length
    : 0;
  const monthlyRevenue = Array.isArray(payments)
    ? payments
        .filter((p) => p.status === 'paid' && p.type === 'rent')
        .reduce((sum, payment) => sum + (payment.amount || 0), 0)
    : 0;
  const occupancyRate = totalProperties > 0 ? Math.round((activeTenants / totalProperties) * 100) : 0;

  return (
    <Layout onMenuToggle={toggleSidebar}>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 w-64 bg-white shadow-md z-40 md:static md:flex md:flex-col h-auto ${
            sidebarOpen ? 'block' : 'hidden'
          } md:block`}
        >
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Admin Menu</h2>
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
                { id: 'users', label: 'Users', icon: Users },
                { id: 'properties', label: 'Properties', icon: Building },
                { id: 'tenants', label: 'Tenants', icon: Users },
                { id: 'maintenance', label: 'Maintenance', icon: Wrench },
                { id: 'reports', label: 'Reports', icon: FileText },
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

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600 text-sm">Manage users, properties, and more.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeTab === 'properties' && (
                  <button
                    onClick={() => setShowAddProperty(true)}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 flex items-center gap-1 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Property
                  </button>
                )}
                {activeTab === 'tenants' && (
                  <button
                    onClick={() => setShowAddTenant(true)}
                    className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 flex items-center gap-1 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Tenant
                  </button>
                )}
                {activeTab === 'users' && (
                  <button
                    onClick={() => setShowAddUser(true)}
                    className="bg-purple-600 text-white px-3 py-1.5 rounded-md hover:bg-purple-700 flex items-center gap-1 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add User
                  </button>
                )}
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded-lg shadow">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  <h3 className="text-sm font-semibold">Total Properties</h3>
                </div>
                <p className="text-lg font-bold">{totalProperties}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <h3 className="text-sm font-semibold">Active Tenants</h3>
                </div>
                <p className="text-lg font-bold">{activeTenants}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-yellow-600" />
                  <h3 className="text-sm font-semibold">Occupancy Rate</h3>
                </div>
                <p className="text-lg font-bold">{occupancyRate}%</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-orange-600" />
                  <h3 className="text-sm font-semibold">Pending Maintenance</h3>
                </div>
                <p className="text-lg font-bold">{pendingMaintenance}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <h3 className="text-sm font-semibold">Urgent Maintenance</h3>
                </div>
                <p className="text-lg font-bold">{urgentMaintenance}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <h3 className="text-sm font-semibold">Monthly Revenue (KSH)</h3>
                </div>
                <p className="text-lg font-bold">{monthlyRevenue.toLocaleString()}</p>
              </div>
            </div>

            {/* CRUD Content with Slide Animation */}
            <div
              className={`bg-white p-4 rounded-lg shadow relative transition-transform duration-300 ease-in-out ${
                slideDirection === 'right' ? 'translate-x-10 opacity-0' : slideDirection === 'left' ? '-translate-x-10 opacity-0' : 'translate-x-0 opacity-100'
              }`}
            >
              {activeTab === 'users' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold">Users (Landlords & Agents)</h3>
                  </div>
                  {users.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {users.map((user) => (
                            <tr key={user.id}>
                              <td className="px-3 py-2 text-xs sm:text-sm text-gray-900">{user.name || '-'}</td>
                              <td className="px-3 py-2 text-xs sm:text-sm text-gray-900">{user.email || '-'}</td>
                              <td className="px-3 py-2 text-xs sm:text-sm text-gray-900">{user.phone || '-'}</td>
                              <td className="px-3 py-2 text-xs sm:text-sm text-gray-900">{user.role || '-'}</td>
                              <td className="px-3 py-2 text-right text-xs sm:text-sm">
                                <button
                                  onClick={() => setShowEditUser(user)}
                                  className="text-blue-600 hover:text-blue-800 mr-2"
                                  title="Edit User"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Delete User"
                                >
                                  <Trash className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">No users available</p>
                  )}
                </div>
              )}

              {activeTab === 'properties' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold">Properties</h3>
                  </div>
                  {totalProperties > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Landlord</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rent (KSH)</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {properties.map((property) => (
                            <tr key={property.id}>
                              <td className="px-3 py-2 text-xs sm:text-sm text-gray-900">{property.name || '-'}</td>
                              <td className="px-3 py-2 text-xs sm:text-sm text-gray-900">{property.address || '-'}</td>
                              <td className="px-3 py-2 text-xs sm:text-sm text-gray-900">{property.landlord_name || '-'}</td>
                              <td className="px-3 py-2 text-xs sm:text-sm text-gray-900">{property.rent_amount ? property.rent_amount.toLocaleString() : '-'}</td>
                              <td className="px-3 py-2 text-right text-xs sm:text-sm">
                                <button
                                  onClick={() => setShowEditProperty(property)}
                                  className="text-blue-600 hover:text-blue-800 mr-2"
                                  title="Edit Property"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProperty(property.id)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Delete Property"
                                >
                                  <Trash className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">No properties available</p>
                  )}
                </div>
              )}

              {activeTab === 'tenants' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold">Tenants</h3>
                  </div>
                  {tenantsLoading ? (
                    <p className="text-gray-600 text-sm">Loading tenants...</p>
                  ) : tenantsError ? (  // Use tenantsError instead of error to avoid naming conflicts
                    <p className="text-red-600 text-sm">{tenantsError}</p>
                  ) : tenants.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {tenants.map((tenant) => (
                            <tr key={tenant.id}>
                              <td className="px-3 py-2 text-xs sm:text-sm text-gray-900">{tenant.name || '-'}</td>
                              <td className="px-3 py-2 text-xs sm:text-sm text-gray-900">{tenant.email || '-'}</td>
                              <td className="px-3 py-2 text-xs sm:text-sm text-gray-900">
                                {tenant.property_name || properties.find((p) => p.id === tenant.property_id)?.name || '-'}
                              </td>
                              <td className="px-3 py-2 text-xs sm:text-sm text-gray-900">{tenant.status || '-'}</td>
                              <td className="px-3 py-2 text-right text-xs sm:text-sm">
                                <button
                                  onClick={() => setShowEditTenant(tenant)}
                                  className="text-blue-600 hover:text-blue-800 mr-2"
                                  title="Edit Tenant"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTenant(tenant.id)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Delete Tenant"
                                >
                                  <Trash className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">No tenants available</p>
                  )}
                </div>
              )}

              {activeTab === 'maintenance' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold">Maintenance Requests</h3>
                  </div>
                  {maintenanceRequests.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {maintenanceRequests.map((request) => (
                            <tr key={request.id}>
                              <td className="px-3 py-2 text-xs sm:text-sm text-gray-900">{request.title || '-'}</td>
                              <td className="px-3 py-2 text-xs sm:text-sm text-gray-900">
                                {properties.find((p) => p.id === request.property_id)?.name || '-'}
                              </td>
                              <td className="px-3 py-2 text-xs sm:text-sm text-gray-900">{request.priority || '-'}</td>
                              <td className="px-3 py-2 text-xs sm:text-sm text-gray-900">{request.status || '-'}</td>
                              <td className="px-3 py-2 text-right text-xs sm:text-sm">
                                <button
                                  className="text-blue-600 hover:text-blue-800 mr-2"
                                  title="Edit Maintenance Request"
                                  disabled
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  className="text-red-600 hover:text-red-800"
                                  title="Delete Maintenance Request"
                                  disabled
                                >
                                  <Trash className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">No maintenance requests available</p>
                  )}
                </div>
              )}

              {activeTab === 'reports' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold">Reports</h3>
                  </div>
                  <p className="text-gray-600 text-sm">Reports functionality coming soon...</p>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-semibold mb-4">Recent Activity</h3>
              {recentActivities.length > 0 ? (
                <ul className="space-y-2">
                  {recentActivities.map((activity) => (
                    <li key={activity.id} className="flex items-center gap-2 text-xs sm:text-sm">
                      <activity.icon className={`h-4 w-4 ${activity.color}`} />
                      <span>{activity.message}</span>
                      <span className="text-gray-500">({activity.time})</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 text-sm">No recent activity</p>
              )}
            </div>
          </div>

          {/* Modals */}
          {showAddProperty && <AddPropertyModal onClose={() => handleCloseModal('property')} />}
          {showAddTenant && <AddTenantModal onClose={() => handleCloseModal('tenant')} />}
          {showAddUser && <AddUserModal onClose={() => handleCloseModal('user')} />}
          {showEditUser && (
            <EditUserModal
              user={showEditUser}
              onClose={() => handleCloseModal('editUser')}
              onUpdate={handleUpdateUser}
            />
          )}
          {showEditProperty && (
            <EditPropertyModal
              property={showEditProperty}
              onClose={() => handleCloseModal('editProperty')}
              onUpdate={handleUpdateProperty}
            />
          )}
          {showEditTenant && (
            <EditTenantModal
              tenant={showEditTenant}
              onClose={() => handleCloseModal('editTenant')}
              onUpdate={handleUpdateTenant}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
