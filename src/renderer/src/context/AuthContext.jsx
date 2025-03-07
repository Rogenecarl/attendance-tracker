import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)

  const login = (userData) => {
    setUser(userData)
  }

  const logout = () => {
    setUser(null)
    // Instead of using navigate directly, we'll let the component handle navigation
    window.location.hash = '/login'
  }

  const isAdmin = () => user?.role === 'admin'
  const isTeacher = () => user?.role === 'teacher'

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, isTeacher }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 