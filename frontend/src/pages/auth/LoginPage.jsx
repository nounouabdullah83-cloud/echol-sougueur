import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import Logo from '../../components/landingpage/Logo'
import { brand } from '../landingpage/landingData'
import { useAuth } from '../../authcontext/AuthContext'
import './auth.css'

/**
 * Login page, wired to the AdminAuth JWT endpoint.
 *
 * Only superusers can log in (enforced server-side). On success the tokens are
 * stored and the user is sent to the dashboard. There is no username — login
 * is email + password.
 */
export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, isLoading: authLoading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Already logged in? Skip the login page straight to the admin home.
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/admin/echolmanager', { replace: true })
    }
  }, [authLoading, isAuthenticated, navigate])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const result = await login({ email, password, remember })

      if (!result.ok) {
        setError(result.message)
        return
      }

      // Send the admin to the admin home, or back to where they were headed.
      const destination = location.state?.from?.pathname || '/admin/echolmanager'
      navigate(destination, { replace: true })
    } catch {
      setError('تعذر الاتصال بالخادم، حاول مجددًا.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth">
      <div className="auth__card">
        <Link className="auth__brand" to="/" aria-label={brand.name}>
          <Logo size={44} />
          <span className="auth__brand-text">
            <strong>{brand.name}</strong>
            <small>{brand.tagline}</small>
          </span>
        </Link>

        <h1 className="auth__title">تسجيل الدخول</h1>
        <p className="auth__subtitle">أدخل بياناتك للوصول إلى لوحة التحكم.</p>

        <form className="auth__form" onSubmit={handleSubmit}>
          <div className="auth__field">
            <label className="auth__label" htmlFor="login-email">
              البريد الإلكتروني
            </label>
            <input
              className="auth__input"
              id="login-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setError('')
              }}
              autoComplete="email"
              required
            />
          </div>

          <div className="auth__field">
            <label className="auth__label" htmlFor="login-password">
              كلمة المرور
            </label>
            <input
              className="auth__input"
              id="login-password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setError('')
              }}
              autoComplete="current-password"
              required
            />
          </div>

          <div className="auth__row">
            <label className="auth__check" htmlFor="login-remember">
              <input
                className="auth__checkbox"
                id="login-remember"
                name="remember"
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              تذكّرني
            </label>
            <Link className="auth__link" to="/reset-password">
              هل نسيت كلمة المرور؟
            </Link>
          </div>

          {error && (
            <p className="auth__message" role="alert">
              {error}
            </p>
          )}

          <button className="lp-btn auth__submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'جارٍ التحقق…' : 'دخول'}
          </button>
        </form>

        <div className="auth__footer">
          <Link className="auth__link" to="/">
            العودة إلى الصفحة الرئيسية
          </Link>
        </div>
      </div>
    </main>
  )
}