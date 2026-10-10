import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../../authcontext/AuthContext'
import { brand, nav } from '../../pages/landingpage/landingData'
import Logo from './Logo'

export default function Header() {
  const [open, setOpen] = useState(false)
  const { isAuthenticated, logout } = useAuth()

  function closeMenu() {
    setOpen(false)
  }

  return (
    <header className="lp-header" id="home">
      <div className="lp-container lp-header__inner">
        <div className="lp-header__top">
          <a className="lp-brand" href="#home" onClick={closeMenu} aria-label={brand.name}>
            <Logo />
            <span className="lp-brand__text">
              <strong>{brand.name}</strong>
              <small>{brand.tagline}</small>
            </span>
          </a>

          <button
            type="button"
            className={`lp-toggle${open ? ' lp-toggle--open' : ''}`}
            aria-expanded={open}
            aria-controls="lp-nav"
            aria-label="القائمة الرئيسية"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="lp-toggle__bar" />
            <span className="lp-toggle__bar" />
            <span className="lp-toggle__bar" />
          </button>
        </div>

        <nav
          id="lp-nav"
          className={`lp-nav${open ? ' lp-nav--open' : ''}`}
          aria-label="التنقل الرئيسي"
        >
          <ul>
            {nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} onClick={closeMenu}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          {isAuthenticated ? (
            <>
              <Link
                className="lp-btn lp-btn--outline lp-nav__cta"
                to="/admin/echolmanager"
                onClick={closeMenu}
              >
                لوحة الإدارة
              </Link>
              <button
                className="lp-btn lp-nav__cta"
                type="button"
                onClick={() => {
                  closeMenu()
                  logout()
                }}
              >
                تسجيل الخروج
              </button>
            </>
          ) : (
            <Link className="lp-btn lp-btn--outline lp-nav__cta" to="/login" onClick={closeMenu}>
              تسجيل الدخول
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}