import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import Sidebar from '../../../components/sidebar/Sidebar'
import { brand } from '../../landingpage/landingData'
import { extractErrorMessage } from '../../../api/errors'
import { fetchTeacherRevenues } from '../../../adminFetch/revenues'
import '../admin.css'
import './finance.css'

/** Format a numeric amount with thousands separators. */
function formatCost(value) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

/**
 * finance manager — shows each teacher's revenue.
 *
 * Revenue accrues at a fixed rate per student taught and resets every month,
 * so the table lists the running total for the current month alongside the
 * final total of the previous month.
 */
export default function FinanceManagerPage() {
  const [revenues, setRevenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const result = await fetchTeacherRevenues()
        if (cancelled) return
        if (result.ok) {
          setRevenues(result.data)
        } else {
          setError(extractErrorMessage(result.data))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const totals = revenues.reduce(
    (acc, row) => ({
      students: acc.students + (row.students_count || 0),
      current: acc.current + Number(row.current_month_revenue || 0),
      last: acc.last + Number(row.last_month_revenue || 0),
    }),
    { students: 0, current: 0, last: 0 },
  )

  return (
    <div className="admin-shell">
      <Sidebar />

      <main className="admin-main">
        <header className="admin-main__head">
          <div>
            <p className="admin-main__eyebrow">{brand.name}</p>
            <h1 className="admin-main__title">finance manager</h1>
            <p className="admin-main__hint">
              إيرادات المعلمين — الشهر الماضي والشهر الحالي.
            </p>
          </div>

          <Link className="lp-btn lp-btn--outline" to="/">
            الصفحة الرئيسية
          </Link>
        </header>

        {loading && <p>جارٍ تحميل الإيرادات…</p>}
        {error && (
          <p className="admin-notice admin-notice--error" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && (
          <section>
            <h2 className="admin-section__title">إيرادات المعلمين</h2>

            {revenues.length === 0 ? (
              <p>لا يوجد معلمون بعد.</p>
            ) : (
              <div className="finance-table-wrap">
                <table className="finance-table">
                  <thead>
                    <tr>
                      <th>المعلم</th>
                      <th>عدد الطلاب</th>
                      <th>إيراد الشهر الماضي</th>
                      <th>إيراد الشهر الحالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenues.map((row) => (
                      <tr key={row.id}>
                        <td>{row.full_name}</td>
                        <td>{row.students_count}</td>
                        <td>{formatCost(row.last_month_revenue)}</td>
                        <td>{formatCost(row.current_month_revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>المجموع</td>
                      <td>{totals.students}</td>
                      <td>{formatCost(totals.last)}</td>
                      <td>{formatCost(totals.current)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
