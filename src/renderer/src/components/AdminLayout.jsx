import { Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AdminSidebar from './AdminSidebar'

export default function AdminLayout() {
  const { isAdmin } = useAuth()

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="ml-64 p-6">
        <Outlet />
      </div>
    </div>
  )
} 