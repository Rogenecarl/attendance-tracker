import { Outlet } from 'react-router-dom'

const GuestLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50/50 flex items-center justify-center p-6">
      <div className="w-full max-w-[420px]">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl shadow-blue-500/20 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Attendance Tracker
          </h1>
          <p className="text-sm text-gray-500 mt-1">Management System</p>
        </div>

        {/* Content Area */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl shadow-black/5 border border-gray-100">
          <Outlet />
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Attendance Tracker. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default GuestLayout 