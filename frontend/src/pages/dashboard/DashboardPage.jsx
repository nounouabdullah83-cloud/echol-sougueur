import { Link } from 'react-router-dom'

import Logo from '../../components/landingpage/Logo'
import { brand } from '../landingpage/landingData'
import { useAuth } from '../../authcontext/AuthContext'
import './dashboard.css'

/**
 * Minimal protected dashboard.
 *
 * Built only to exercise the auth flow (login → logout, ProtectedRoute). The
 * real dashboard — students/teachers/courses management — will replace it.
 */
export default function DashboardPage() {
  const { user, logout } = useAuth()

  return (
    <main className="dash">
      <div className="dash__card">
        <Link className="dash__brand" to="/" aria-label={brand.name}>
          <Logo size={44} />
          <span className="dash__brand-text">
            <strong>{brand.name}</strong>
            <small>{brand.tagline}</small>
          </span>
        </Link>

        <h1 className="dash__title">لوحة التحكم</h1>
        <p className="dash__welcome">مرحبًا، {user?.full_name || user?.email}</p>
        <p className="dash__hint">
          لوحة التحكم قيد الإنشاء — ستتوفر هنا إدارة الطلاب والمعلمين والمقررات.
        </p>

        <div className="dash__actions">
          <Link className="lp-btn lp-btn--outline" to="/">
            الصفحة الرئيسية
          </Link>
          <button className="lp-btn" type="button" onClick={() => logout()}>
            تسجيل الخروج
          </button>
        </div>
      </div>
    </main>
  )
}