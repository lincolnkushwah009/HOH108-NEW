import { createContext, useContext, useState, useEffect } from 'react'

const API_BASE_URL = import.meta.env.PROD
  ? 'https://hoh108.com/api'
  : `http://${window.location.hostname}:5001/api`

const CustomerAuthContext = createContext()

export const useCustomerAuth = () => useContext(CustomerAuthContext)

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('customer_portal_token')
    const stored = localStorage.getItem('customer_portal_user')
    if (!token || !stored) {
      setLoading(false)
      return
    }
    try {
      const user = JSON.parse(stored)
      setCustomer(user)
    } catch {
      localStorage.removeItem('customer_portal_token')
      localStorage.removeItem('customer_portal_user')
    }
    setLoading(false)
  }

  const login = async (email, password) => {
    setError(null)
    const res = await fetch(`${API_BASE_URL}/customer-portal/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Login failed')
    localStorage.setItem('customer_portal_token', data.token)
    localStorage.setItem('customer_portal_user', JSON.stringify(data.data))
    setCustomer(data.data)
    return data
  }

  const logout = () => {
    localStorage.removeItem('customer_portal_token')
    localStorage.removeItem('customer_portal_user')
    setCustomer(null)
  }

  return (
    <CustomerAuthContext.Provider value={{ customer, loading, error, login, logout, isAuthenticated: !!customer }}>
      {children}
    </CustomerAuthContext.Provider>
  )
}
