import { Outlet } from 'react-router-dom'

const GuestLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-xl"></div>
        </div>
        <Outlet />
      </div>
    </div>
  )
}

export default GuestLayout
