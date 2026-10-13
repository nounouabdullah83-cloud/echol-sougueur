import { Route, Routes } from 'react-router-dom'

import LandingPage from './pages/landingpage/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import EcholManagerPage from './pages/admin/echolmanager/EcholManagerPage'
import GroupViewPage from './pages/admin/groupview/GroupViewPage'
import StudentDetailsPage from './pages/admin/studentdetails/StudentDetailsPage'
import TeacherDetailsPage from './pages/admin/teacherdetails/TeacherDetailsPage'
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
        path="/admin/groups/:id"
        element={
          <ProtectedRoute>
            <GroupViewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students/:id"
        element={
          <ProtectedRoute>
            <StudentDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/teachers/:id"
        element={
          <ProtectedRoute>
            <TeacherDetailsPage />
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
