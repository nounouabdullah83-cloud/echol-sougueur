import { Link } from 'react-router-dom'

import Sidebar from '../../../components/sidebar/Sidebar'
import { brand } from '../../landingpage/landingData'
import '../admin.css'

/**
 * Admin dashboard — overview placeholder.
 *
 * Renders the shared admin sidebar until real data is wired up.
 */
export default function DashboardPage() {
  return (
    <div className="admin-shell">
      <Sidebar />

      <main className="admin-main">
        <header className="admin-main__head">
          <div>
            <p className="admin-main__eyebrow">{brand.name}</p>
            <h1 className="admin-main__title">dashboard</h1>
            <p className="admin-main__hint">نظرة عامة على النظام — قيد الإنشاء.</p>
          </div>

          <Link className="lp-btn lp-btn--outline" to="/">
            الصفحة الرئيسية
          </Link>
        </header>
      </main>
    </div>
  )
}
