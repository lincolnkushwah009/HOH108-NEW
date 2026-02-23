import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../utils/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check authentication on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('hoh108_admin_token')
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await authAPI.getMe()
      const userData = response.data || response.user || response
      setUser(userData)
      // Ensure active company is set to user's primary company
      if (userData.company) {
        const companyId = typeof userData.company === 'object' ? userData.company._id : userData.company
        localStorage.setItem('hoh108_active_company', companyId)
      }
    } catch (err) {
      console.error('Auth check failed:', err.message)
      // Only remove token if it's actually a 401 error (handled in api.js)
      // Don't remove token for network errors or other issues
      if (err.message === 'Session expired') {
        localStorage.removeItem('hoh108_admin_token')
        setUser(null)
      }
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    setError(null)
    try {
      const response = await authAPI.login(email, password)
      localStorage.setItem('hoh108_admin_token', response.token)
      // Set active company to user's primary company on login
      if (response.user?.company) {
        const companyId = typeof response.user.company === 'object' ? response.user.company._id : response.user.company
        localStorage.setItem('hoh108_active_company', companyId)
      }
      setUser(response.user)
      return response
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const logout = () => {
    localStorage.removeItem('hoh108_admin_token')
    localStorage.removeItem('hoh108_active_company')
    setUser(null)
  }

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
  }

  return (
    <AuthContext.Provider value={value}>
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

export default AuthContext
