import { createContext, useContext, useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const VendorAuthContext = createContext(null)

export const VendorAuthProvider = ({ children }) => {
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('vendor_portal_token')
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE}/vendor-portal/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Session expired')
      }

      const data = await response.json()
      setVendor(data.data)
    } catch (err) {
      console.error('Vendor auth check failed:', err.message)
      localStorage.removeItem('vendor_portal_token')
      setVendor(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/vendor-portal/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      localStorage.setItem('vendor_portal_token', data.token)
      setVendor(data.vendor)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const logout = () => {
    localStorage.removeItem('vendor_portal_token')
    setVendor(null)
  }

  // Get token from localStorage
  const token = localStorage.getItem('vendor_portal_token')

  const value = {
    vendor,
    token,
    loading,
    error,
    isAuthenticated: !!vendor,
    login,
    logout,
    checkAuth,
  }

  return (
    <VendorAuthContext.Provider value={value}>
      {children}
    </VendorAuthContext.Provider>
  )
}

export const useVendorAuth = () => {
  const context = useContext(VendorAuthContext)
  if (!context) {
    throw new Error('useVendorAuth must be used within a VendorAuthProvider')
  }
  return context
}

export default VendorAuthContext
