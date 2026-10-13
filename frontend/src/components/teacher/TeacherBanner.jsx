import { Link } from 'react-router-dom'

/** Format a numeric amount with thousands separators. */
function formatCost(value) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

/**
 * teacher banner — a compact card that summarises a teacher.
 *
 * Renders the teacher's name, the number of groups they teach, their student
 * count and their current-month revenue when available, alongside a "see
 * teacher details" button that opens the teacher's card page.
 *
 * Revenue fields (`students_count`, `current_month_revenue`) are optional: they
 * are only displayed when the caller passes a teacher enriched with them.
 */
export default function TeacherBanner({ teacher, groupsCount = 0 }) {
  const { full_name, students_count, current_month_revenue } = teacher

  return (
    <article className="teacher-banner">
      <div className="teacher-banner__body">
        <h3 className="teacher-banner__title">{full_name}</h3>
        <p className="teacher-banner__meta">المجموعات: {groupsCount}</p>
        {students_count !== undefined && (
          <p className="teacher-banner__meta">عدد الطلاب: {students_count}</p>
        )}
        {current_month_revenue !== undefined && (
          <p className="teacher-banner__meta">
            إيراد الشهر الحالي:{' '}
            <span className="teacher-banner__amount">
              {formatCost(current_month_revenue)}
            </span>
          </p>
        )}
      </div>

      <Link
        className="lp-btn teacher-banner__cta"
        to={`/admin/teachers/${teacher.id}`}
      >
        see teacher details
      </Link>
    </article>
  )
}
