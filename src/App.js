import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AdminDashboard from './components/AdminDashboard';
import LandlordDashboard from './components/LandlordDashboard';
import TenantDashboard from './components/TenantDashboard';
import Login from './components/Login';
import Signup from './components/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './components/Profile';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
      path="/admin-dashboard"
      element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      }
    />
    <Route path="/profile" element={<Profile />} />
        <Route path="/landlord-dashboard" element={<LandlordDashboard />} />
        <Route path="/tenant-dashboard" element={<TenantDashboard />} />
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
};

export default App;