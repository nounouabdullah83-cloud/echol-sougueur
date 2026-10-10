import { Link } from 'react-router-dom'

import Sidebar from '../../../components/sidebar/Sidebar'
import { brand } from '../../landingpage/landingData'
import '../admin.css'

/**
 * finance manager — placeholder for the finance section.
 *
 * Renders the shared admin sidebar until the real views are built.
 */
export default function FinanceManagerPage() {
  return (
    <div className="admin-shell">
      <Sidebar />

      <main className="admin-main">
        <header className="admin-main__head">
          <div>
            <p className="admin-main__eyebrow">{brand.name}</p>
            <h1 className="admin-main__title">finance manager</h1>
            <p className="admin-main__hint">إدارة الشؤون المالية — قيد الإنشاء.</p>
          </div>

          <Link className="lp-btn lp-btn--outline" to="/">
            الصفحة الرئيسية
          </Link>
        </header>
      </main>
    </div>
  )
}
