import { Route, Routes } from 'react-router-dom'

import LandingPage from './pages/landingpage/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import EcholManagerPage from './pages/admin/echolmanager/EcholManagerPage'
import FinanceManagerPage from './pages/admin/financemanager/FinanceManagerPage'
import AdminDashboardPage from './pages/admin/dashboard/DashboardPage'
import ProtectedRoute from './authcontext/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/echolmanager"
        element={
          <ProtectedRoute>
            <EcholManagerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/financemanager"
        element={
          <ProtectedRoute>
            <FinanceManagerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
