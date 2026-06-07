import { useState } from 'react'
import { AuthContext } from './authContextValue'

const getSavedUser = () => {
  const saved = localStorage.getItem('user')
  return saved ? JSON.parse(saved) : null
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(getSavedUser)
  const [loading]             = useState(false)

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
