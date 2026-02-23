import { createContext, useContext, useState, useEffect } from 'react'

const UserContext = createContext(null)

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('hoh108_user')
    const token = localStorage.getItem('hoh108_token')
    if (storedUser && token) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = (userData, token) => {
    localStorage.setItem('hoh108_user', JSON.stringify(userData))
    localStorage.setItem('hoh108_token', token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('hoh108_user')
    localStorage.removeItem('hoh108_token')
    setUser(null)
  }

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates }
    localStorage.setItem('hoh108_user', JSON.stringify(updatedUser))
    setUser(updatedUser)
  }

  return (
    <UserContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  )
}

export default UserContext
