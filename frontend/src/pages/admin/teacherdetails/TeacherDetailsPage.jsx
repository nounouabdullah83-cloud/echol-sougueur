import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { brand } from '../../landingpage/landingData'
import { extractErrorMessage } from '../../../api/errors'
import { deleteTeacher, fetchTeacher } from '../../../adminFetch/teachers'
import {
  fetchTeacherRevenue,
  fetchTeacherRevenueEntries,
} from '../../../adminFetch/revenues'
import { fetchGroups } from '../../../adminFetch/groups'
import '../admin.css'
import './teacherdetails.css'

/** Format a numeric amount with thousands separators. */
function formatCost(value) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

/** Format an ISO date (`yyyy-mm-dd`) as `yyyy-mm` for a revenue entry. */
function formatMonth(value) {
  return value ? String(value).slice(0, 7) : '—'
}

/**
 * Teacher details — a standalone card showing one teacher's information
 * together with their revenue: the running current-month total, the previous
 * month's total, the students they teach, and the recent movements that make
 * up those totals.
 *
 * Reached from the "see teacher details" button on a teacher banner in the
 * echol manager page.
 */
export default function TeacherDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [teacher, setTeacher] = useState(null)
  const [summary, setSummary] = useState(null)
  const [entries, setEntries] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Delete ("حذف المعلم") confirmation modal state.
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [teacherResult, summaryResult, entriesResult, groupsResult] =
          await Promise.all([
            fetchTeacher(id),
            fetchTeacherRevenue(id),
            fetchTeacherRevenueEntries(id),
            fetchGroups(),
          ])
        if (cancelled) return

        if (teacherResult.ok) {
          setTeacher(teacherResult.data)
        } else {
          setError(extractErrorMessage(teacherResult.data))
        }
        if (summaryResult.ok) setSummary(summaryResult.data)
        if (entriesResult.ok) setEntries(entriesResult.data)
        if (groupsResult.ok) {
          const teacherId = Number(id)
          setGroups(
            groupsResult.data.filter((group) => group.teacher === teacherId),
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id])

  function openDelete() {
    setDeleteError('')
    setIsDeleteOpen(true)
  }

  function closeDelete() {
    setDeleteError('')
    setIsDeleteOpen(false)
  }

  async function handleDelete() {
    setDeleteError('')
    setDeleting(true)
    try {
      const result = await deleteTeacher(id)
      if (result.ok || result.status === 404) {
        navigate('/admin/echolmanager')
        return
      }
      setDeleteError(extractErrorMessage(result.data))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="teacher-paper-page">
      <article className="teacher-paper" aria-label="بطاقة المعلم">
        <header className="teacher-paper__head">
          <p className="teacher-paper__eyebrow">{brand.name}</p>
          <h1 className="teacher-paper__title">بطاقة المعلم</h1>
        </header>

        {loading && <p className="teacher-paper__status">جارٍ تحميل البيانات…</p>}
        {error && (
          <p
            className="teacher-paper__status teacher-paper__status--error"
            role="alert"
          >
            {error}
          </p>
        )}

        {teacher && !loading && (
          <>
            <div className="teacher-paper__rows">
              <div className="teacher-paper__row">
                <span className="teacher-paper__label">الاسم الكامل</span>
                <span className="teacher-paper__value">{teacher.full_name}</span>
              </div>
              <div className="teacher-paper__row">
                <span className="teacher-paper__label">عدد المجموعات</span>
                <span className="teacher-paper__value">{groups.length}</span>
              </div>
            </div>

            <section
              className="teacher-paper__section"
              aria-label="ملخّص الإيرادات"
            >
              <h2 className="teacher-paper__section-title">الإيرادات</h2>

              <div className="teacher-paper__stats">
                <div className="teacher-paper__stat">
                  <span className="teacher-paper__stat-label">عدد الطلاب</span>
                  <span className="teacher-paper__stat-value">
                    {summary ? summary.students_count : '—'}
                  </span>
                </div>
                <div className="teacher-paper__stat">
                  <span className="teacher-paper__stat-label">
                    إيراد الشهر الماضي
                  </span>
                  <span className="teacher-paper__stat-value">
                    {summary ? formatCost(summary.last_month_revenue) : '—'}
                  </span>
                </div>
                <div className="teacher-paper__stat">
                  <span className="teacher-paper__stat-label">
                    إيراد الشهر الحالي
                  </span>
                  <span className="teacher-paper__stat-value">
                    {summary ? formatCost(summary.current_month_revenue) : '—'}
                  </span>
                </div>
              </div>
            </section>

            <section
              className="teacher-paper__section"
              aria-label="مجموعات المعلم"
            >
              <h2 className="teacher-paper__section-title">المجموعات</h2>

              {groups.length === 0 ? (
                <p className="teacher-paper__status">
                  هذا المعلم غير مسؤول عن أي مجموعة.
                </p>
              ) : (
                <div className="teacher-paper__table-wrap">
                  <table className="teacher-paper__table">
                    <thead>
                      <tr>
                        <th>المجموعة</th>
                        <th>المادة</th>
                        <th>المستوى</th>
                        <th>القسم</th>
                        <th>عدد الطلاب</th>
                        <th>الإيراد لكل طالب</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map((group) => (
                        <tr key={group.id}>
                          <td>
                            <Link
                              className="teacher-paper__link"
                              to={`/admin/groups/${group.id}`}
                            >
                              group {group.group_number}
                            </Link>
                          </td>
                          <td>{group.subject || '—'}</td>
                          <td>{group.level_display || '—'}</td>
                          <td>{group.class_name_display || '—'}</td>
                          <td>{(group.students ?? []).length}</td>
                          <td>{formatCost(group.revenue_per_student)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section
              className="teacher-paper__section"
              aria-label="سجل الإيرادات"
            >
              <h2 className="teacher-paper__section-title">سجل الإيرادات</h2>

              {entries.length === 0 ? (
                <p className="teacher-paper__status">لا توجد حركات إيراد بعد.</p>
              ) : (
                <div className="teacher-paper__table-wrap">
                  <table className="teacher-paper__table">
                    <thead>
                      <tr>
                        <th>الشهر</th>
                        <th>النوع</th>
                        <th>الطالب</th>
                        <th>المبلغ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => (
                        <tr key={entry.id}>
                          <td>{formatMonth(entry.month)}</td>
                          <td>{entry.kind_display}</td>
                          <td>{entry.student_name}</td>
                          <td>{formatCost(entry.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        <div className="teacher-paper__actions">
          <button
            className="lp-btn lp-btn--outline"
            type="button"
            onClick={() => navigate(-1)}
          >
            رجوع
          </button>
          <div className="teacher-paper__actions-end">
            <Link className="lp-btn lp-btn--outline" to="/admin/echolmanager">
              echol manager
            </Link>
            {teacher && !loading && (
              <button
                className="lp-btn lp-btn--danger"
                type="button"
                onClick={openDelete}
              >
                delete teacher
              </button>
            )}
          </div>
        </div>
      </article>

      {isDeleteOpen && (
        <div
          className="admin-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-teacher-title"
        >
          <div className="admin-modal__card admin-modal__card--narrow">
            <h2 className="admin-modal__title" id="delete-teacher-title">
              حذف المعلم
            </h2>

            <div className="admin-form">
              <p className="admin-form__hint">
                سيتم حذف المعلم
                {teacher ? ` «${teacher.full_name}»` : ''} نهائيًا. هذا الإجراء لا
                يمكن التراجع عنه.
              </p>

              {deleteError && (
                <p className="admin-notice admin-notice--error" role="alert">
                  {deleteError}
                </p>
              )}

              <div className="admin-form__actions">
                <button
                  className="lp-btn lp-btn--outline"
                  type="button"
                  onClick={closeDelete}
                >
                  إلغاء
                </button>
                <button
                  className="lp-btn lp-btn--danger"
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                >
                  {deleting ? 'جارٍ الحذف…' : 'حذف'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
