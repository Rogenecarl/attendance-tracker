import { createHashRouter } from 'react-router-dom'
import DefaultLayout from './components/DefaultLayout'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Attendance from './pages/Attendance'
import Settings from './pages/Settings'
import GuestLayout from './components/GuestLayout'
import Login from './pages/Login'
import Signup from './pages/Signup'

const router = createHashRouter([
  {
    path: '/',
    element: <DefaultLayout />,
    children: [
      {
        path: '/',
        element: <Dashboard />
      },
      {
        path: '/dashboard',
        element: <Dashboard />
      },
      {
        path: '/students',
        element: <Students />
      },
      {
        path: '/attendance',
        element: <Attendance />
      },
      {
        path: '/settings',
        element: <Settings />
      }
    ]
  },

  {
    path: '/',
    element: <GuestLayout />,
    children: [
      {
        path: '/login',
        element: <Login />
      },
      {
        path: '/signup',
        element: <Signup />
      }
    ]
  }
]);

export default router;
