import { Link, Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const DefaultLayout = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showLogout, setShowLogout] = useState(false);

  // Function to check if the link is active
  const isActive = (path) => {
    return location.pathname === path ? 'bg-blue-500/10 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50';
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col fixed h-full">
        {/* Logo section */}
        <div className="flex items-center gap-3 px-8 py-6 border-b border-gray-50">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Attendance</h1>
            <p className="text-xs text-gray-400">Management System</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-8 space-y-1.5">
          <Link
            to="/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive('/dashboard')}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="text-sm">Dashboard</span>
          </Link>

          <Link
            to="/students"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive('/students')}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-sm">Students</span>
          </Link>

          <Link
            to="/attendance"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive('/attendance')}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span className="text-sm">Attendance</span>
          </Link>

          <Link
            to="/sections"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive('/sections')}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-sm">Sections</span>
          </Link>

          <Link
            to="/settings"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive('/settings')}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm">Settings</span>
          </Link>
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-gray-50 p-4">
          <div className="bg-gray-50/50 rounded-xl p-4">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setShowLogout(!showLogout)}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-medium shadow-lg shadow-blue-500/20">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{user?.name}</div>
                <div className="text-xs text-gray-400 truncate">{user?.email}</div>
              </div>
              <button className="p-1 hover:bg-white rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Logout Option */}
            {showLogout && (
              <div 
                className="mt-2 px-4 py-3 text-sm text-red-600 rounded-lg cursor-pointer bg-red-50 hover:bg-red-100 transition-colors flex items-center gap-2"
                onClick={logout}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-72">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="px-8 py-5">
            <h2 className="text-xl font-semibold text-gray-800">
              {location.pathname.split('/')[1].charAt(0).toUpperCase() + location.pathname.split('/')[1].slice(1)}
            </h2>
          </div>
        </header>
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DefaultLayout
