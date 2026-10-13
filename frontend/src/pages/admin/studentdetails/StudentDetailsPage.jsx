import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { brand } from '../../landingpage/landingData'
import { extractErrorMessage } from '../../../api/errors'
import { fetchStudent, renewStudentSubscription } from '../../../adminFetch/students'
import { fetchGroups } from '../../../adminFetch/groups'
import './studentdetails.css'

/** Format a numeric amount with thousands separators. */
function formatCost(value) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

/**
 * Student details — a paper-like document showing a single student's
 * information, the groups they are enrolled in, and the total cost, with a
 * single "رجوع" button to go back.
 *
 * Reached by clicking a student card in the group view.
 */
export default function StudentDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [renewing, setRenewing] = useState(false)
  const [renewError, setRenewError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [studentResult, groupsResult] = await Promise.all([
          fetchStudent(id),
          fetchGroups(),
        ])
        if (cancelled) return

        if (studentResult.ok) {
          setStudent(studentResult.data)
        } else {
          setError(extractErrorMessage(studentResult.data))
        }

        if (groupsResult.ok) {
          const studentId = Number(id)
          setGroups(
            groupsResult.data.filter((group) =>
              (group.students ?? []).some((entry) =>
                (typeof entry === 'number' ? entry : entry.id) === studentId,
              ),
            ),
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

  const totalCost = groups.reduce(
    (sum, group) => sum + (Number(group.revenue_per_student) || 0),
    0,
  )

  async function handleRenewSubscription() {
    if (!student?.id || student.is_subscribed) return
    setRenewing(true)
    setRenewError('')
    try {
      const result = await renewStudentSubscription(student.id)
      if (result.ok) {
        setStudent(result.data)
      } else {
        setRenewError(extractErrorMessage(result.data))
      }
    } finally {
      setRenewing(false)
    }
  }

  return (
    <div className="student-paper-page">
      <article className="student-paper" aria-label="بطاقة الطالب">
        <header className="student-paper__head">
          <p className="student-paper__eyebrow">{brand.name}</p>
          <h1 className="student-paper__title">بطاقة الطالب</h1>
        </header>

        {loading && <p className="student-paper__status">جارٍ تحميل البيانات…</p>}
        {error && (
          <p className="student-paper__status student-paper__status--error" role="alert">
            {error}
          </p>
        )}

        {student && !loading && (
          <div className="student-paper__rows">
            <div className="student-paper__row">
              <span className="student-paper__label">الاسم الكامل</span>
              <span className="student-paper__value">{student.full_name}</span>
            </div>
            <div className="student-paper__row">
              <span className="student-paper__label">الجنس</span>
              <span className="student-paper__value">
                {student.sex_display || '—'}
              </span>
            </div>
            <div className="student-paper__row">
              <span className="student-paper__label">تاريخ الميلاد</span>
              <span className="student-paper__value">
                {student.birthdate || '—'}
              </span>
            </div>
            <div className="student-paper__row">
              <span className="student-paper__label">مكان الميلاد</span>
              <span className="student-paper__value">
                {student.birthplace || '—'}
              </span>
            </div>
            <div className="student-paper__row">
              <span className="student-paper__label">المدرسة</span>
              <span className="student-paper__value">
                {student.school || '—'}
              </span>
            </div>
            <div className="student-paper__row">
              <span className="student-paper__label">المستوى</span>
              <span className="student-paper__value">
                {student.level_display || '—'}
              </span>
            </div>
            <div className="student-paper__row">
              <span className="student-paper__label">القسم</span>
              <span className="student-paper__value">
                {student.class_name_display || '—'}
              </span>
            </div>
            <div className="student-paper__row">
              <span className="student-paper__label">اسم الأب</span>
              <span className="student-paper__value">
                {student.father_name || '—'}
              </span>
            </div>
            <div className="student-paper__row">
              <span className="student-paper__label">اسم الأم</span>
              <span className="student-paper__value">
                {[student.mother_first_name, student.mother_last_name]
                  .filter(Boolean)
                  .join(' ') || '—'}
              </span>
            </div>
            <div className="student-paper__row">
              <span className="student-paper__label">هاتف المسؤول 1</span>
              <span className="student-paper__value">
                {student.responsible_phone1 || '—'}
              </span>
            </div>
            <div className="student-paper__row">
              <span className="student-paper__label">هاتف المسؤول 2</span>
              <span className="student-paper__value">
                {student.responsible_phone2 || '—'}
              </span>
            </div>
            <div className="student-paper__row">
              <span className="student-paper__label">العنوان</span>
              <span className="student-paper__value">
                {student.address || '—'}
              </span>
            </div>
            <div className="student-paper__row">
              <span className="student-paper__label">تاريخ التسجيل</span>
              <span className="student-paper__value">
                {student.registration_date || '—'}
              </span>
            </div>
            <div className="student-paper__row">
              <span className="student-paper__label">تاريخ تجديد الاشتراك</span>
              <span className="student-paper__value">
                {student.renewal_subscription_date || '—'}
              </span>
            </div>
            <div className="student-paper__row">
              <span className="student-paper__label">تاريخ انتهاء الاشتراك</span>
              <span className="student-paper__value">
                {student.subscription_expiry_date || '—'}
              </span>
            </div>
          </div>
        )}

        {renewError && (
          <p
            className="student-paper__status student-paper__status--error"
            role="alert"
          >
            {renewError}
          </p>
        )}

        {student && !loading && (
          <section
            className="student-paper__section"
            aria-label="المجموعات المسجّل بها"
          >
            <h2 className="student-paper__section-title">
              المجموعات المسجّل بها
            </h2>

            {groups.length === 0 ? (
              <p className="student-paper__status">
                هذا الطالب غير مسجّل في أي مجموعة.
              </p>
            ) : (
              <div className="student-paper__table-wrap">
                <table className="student-paper__table">
                  <thead>
                    <tr>
                      <th>المجموعة</th>
                      <th>المادة</th>
                      <th>المستوى</th>
                      <th>القسم</th>
                      <th>المعلم</th>
                      <th>التكلفة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((group) => (
                      <tr key={group.id}>
                        <td>
                          <Link
                            className="student-paper__link"
                            to={`/admin/groups/${group.id}`}
                          >
                            group {group.group_number}
                          </Link>
                        </td>
                        <td>{group.subject || '—'}</td>
                        <td>{group.level_display || '—'}</td>
                        <td>{group.class_name_display || '—'}</td>
                        <td>{group.teacher_name || '—'}</td>
                        <td>{formatCost(group.revenue_per_student)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={5}>المجموع الكلي</td>
                      <td>{formatCost(totalCost)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </section>
        )}

        <div className="student-paper__actions">
          <button
            className="lp-btn lp-btn--outline"
            type="button"
            onClick={() => navigate(-1)}
          >
            رجوع
          </button>
          {student && !loading && (
            <button
              type="button"
              className={`student-paper__subscribe ${
                student.is_subscribed
                  ? 'student-paper__subscribe--on'
                  : 'student-paper__subscribe--off'
              }`}
              disabled={student.is_subscribed || renewing}
              onClick={handleRenewSubscription}
            >
              {student.is_subscribed ? 'subscribed' : 'unsubscribed'}
            </button>
          )}
        </div>
      </article>
    </div>
  )
}
