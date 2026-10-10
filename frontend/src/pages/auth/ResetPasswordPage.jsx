import { Link } from 'react-router-dom'

import Logo from '../../components/landingpage/Logo'
import { brand } from '../landingpage/landingData'
import './auth.css'

/**
 * Password recovery page.
 *
 * The backend has NO forgot-password / email-reset endpoint and none is called.
 * Instead of pretending a link was sent, this page tells the user honestly that
 * password resets are handled by the school administration / the server.
 */
export default function ResetPasswordPage() {
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

        <h1 className="auth__title">استعادة كلمة المرور</h1>
        <p className="auth__subtitle">لا توجد خدمة إعادة تعيين ذاتية في النظام حاليًا.</p>

        <div className="auth__notice" role="status">
          <strong>تُدار إعادة تعيين كلمة المرور من قبل إدارة المدرسة.</strong>
          <span>
            يرجى التواصل مع الإدارة أو مسؤول النظام لإعادة تعيين كلمة المرور الخاصة بحسابك.
          </span>
        </div>

        <div className="auth__footer">
          <Link className="auth__link" to="/login">
            العودة إلى تسجيل الدخول
          </Link>
          <Link className="auth__link" to="/">
            العودة إلى الصفحة الرئيسية
          </Link>
        </div>
      </div>
    </main>
  )
}