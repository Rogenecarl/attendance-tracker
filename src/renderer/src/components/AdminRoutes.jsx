import { Routes, Route } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

// Admin Dashboard Component
const AdminDashboard = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
    <div className="bg-white rounded-lg shadow p-6">
      <p>Welcome to the admin dashboard</p>
    </div>
  </div>
)

// User Management Component
const UserManagement = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">User Management</h1>
    <div className="bg-white rounded-lg shadow p-6">
      <p>Manage users here</p>
    </div>
  </div>
)

// System Settings Component
const SystemSettings = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">System Settings</h1>
    <div className="bg-white rounded-lg shadow p-6">
      <p>Configure system settings</p>
    </div>
  </div>
)

export const AdminRoutes = () => {
  const { isAdmin } = useAuth()

  if (!isAdmin()) {
    return <Navigate to="/unauthorized" replace />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="settings" element={<SystemSettings />} />
      </Routes>
    </div>
  )
} 