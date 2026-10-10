import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from './AuthContext'

/**
 * Redirects unauthenticated users to /login. The attempted location is passed
 * along so the login page can send the user back where they were headed.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}