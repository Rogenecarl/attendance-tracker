import { createHashRouter, Navigate } from 'react-router-dom'
import DefaultLayout from './components/DefaultLayout'
import GuestLayout from './components/GuestLayout'
import AdminLayout from './components/AdminLayout'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Attendance from './pages/Attendance'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Sections from './pages/Sections'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import UserManagement from './pages/admin/UserManagement'
import SystemSettings from './pages/admin/SystemSettings'

const router = createHashRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" />,
  },
  {
    path: '/',
    element: <GuestLayout />,
    children: [
      {
        path: 'login',
        element: <Login />
      },
      {
        path: 'signup',
        element: <Signup />
      }
    ]
  },
  // Teacher routes
  {
    path: '/',
    element: (
      <ProtectedRoute allowedRoles={['teacher']}>
        <DefaultLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />
      },
      {
        path: 'students',
        element: <Students />
      },
      {
        path: 'attendance',
        element: <Attendance />
      },
      {
        path: 'settings',
        element: <Settings />
      },
      {
        path: 'sections',
        element: <Sections />
      }
    ]
  },
  // Admin routes
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '',
        element: <AdminDashboard />
      },
      {
        path: 'users',
        element: <UserManagement />
      },
      {
        path: 'settings',
        element: <SystemSettings />
      }
    ]
  },
  // Unauthorized access route
  {
    path: '/unauthorized',
    element: (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Unauthorized Access</h1>
        <p className="mt-2 text-gray-600">You don't have permission to access this page.</p>
      </div>
    )
  },
  // Root redirect based on role
  {
    path: '/dashboard',
    element: <RoleBasedRedirect />
  },
  // Catch all route
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />
  }
])

// Component to handle role-based redirects
function RoleBasedRedirect() {
  const { user } = useAuth()
  
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }
  
  if (user?.role === 'teacher') {
    return <Navigate to="/dashboard" replace />
  }
  
  return <Navigate to="/login" replace />
}

export default router
