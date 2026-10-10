import { NavLink } from 'react-router-dom'

import './sidebar.css'

/**
 * Administrative sidebar navigation.
 *
 * Static link list for the admin area. The target pages live under
 * `src/pages/admin` and will be wired into the router as they are built.
 */
const links = [
  { to: '/admin/echolmanager', label: 'echol manager' },
  { to: '/admin/financemanager', label: 'finance manager' },
  { to: '/admin/dashboard', label: 'dashboard' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar" aria-label="القائمة الجانبية">
      <nav className="sidebar__nav" aria-label="التنقل الإداري">
        <ul className="sidebar__list">
          {links.map((item) => (
            <li className="sidebar__item" key={item.to}>
              <NavLink
                className={({ isActive }) =>
                  `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
                }
                to={item.to}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
