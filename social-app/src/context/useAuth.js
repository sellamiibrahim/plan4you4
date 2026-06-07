import { useContext } from 'react'
import { AuthContext } from './authContextValue'

// Custom hook - easy to use fi ay component
export function useAuth() {
  return useContext(AuthContext)
}
