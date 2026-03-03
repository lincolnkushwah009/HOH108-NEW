import { createContext, useContext, useState, useEffect } from 'react'

const API_BASE = import.meta.env.PROD
  ? 'https://hoh108.com/api'
  : `http://${window.location.hostname}:5001/api`

const ChannelPartnerAuthContext = createContext(null)

export const ChannelPartnerAuthProvider = ({ children }) => {
  const [partner, setPartner] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('channel_partner_token')
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE}/channel-partner-portal/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Session expired')
      }

      const data = await response.json()
      setPartner(data.data)
    } catch (err) {
      console.error('Channel partner auth check failed:', err.message)
      localStorage.removeItem('channel_partner_token')
      setPartner(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/channel-partner-portal/login`, {
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

      localStorage.setItem('channel_partner_token', data.token)
      setPartner(data.partner)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const logout = () => {
    localStorage.removeItem('channel_partner_token')
    setPartner(null)
  }

  // Get token from localStorage
  const token = localStorage.getItem('channel_partner_token')

  const value = {
    partner,
    token,
    loading,
    error,
    isAuthenticated: !!partner,
    login,
    logout,
    checkAuth,
  }

  return (
    <ChannelPartnerAuthContext.Provider value={value}>
      {children}
    </ChannelPartnerAuthContext.Provider>
  )
}

export const useChannelPartnerAuth = () => {
  const context = useContext(ChannelPartnerAuthContext)
  if (!context) {
    throw new Error('useChannelPartnerAuth must be used within a ChannelPartnerAuthProvider')
  }
  return context
}

export default ChannelPartnerAuthContext
