import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import Sidebar from '../../../components/sidebar/Sidebar'
import { brand } from '../../landingpage/landingData'
import { extractErrorMessage } from '../../../api/errors'
import { createGroup } from '../../../adminFetch/groups'
import { fetchStudents } from '../../../adminFetch/students'
import { fetchTeachers } from '../../../adminFetch/teachers'
import '../admin.css'

/**
 * echol manager — admin home.
 *
 * Renders the shared admin sidebar and a "create group" button that opens a
 * modal form wired to POST /api/groups/.
 */
export default function EcholManagerPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [teachers, setTeachers] = useState([])
  const [students, setStudents] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [groupNumber, setGroupNumber] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [studentIds, setStudentIds] = useState([])
  const [revenue, setRevenue] = useState('')

  // Load teacher/student options the first time the form opens.
  useEffect(() => {
    if (!isOpen || teachers.length || students.length) return

    let cancelled = false

    async function loadOptions() {
      setLoadingOptions(true)
      try {
        const [studentsResult, teachersResult] = await Promise.all([
          fetchStudents(),
          fetchTeachers(),
        ])
        if (cancelled) return
        if (studentsResult.ok) setStudents(studentsResult.data)
        if (teachersResult.ok) setTeachers(teachersResult.data)
      } finally {
        if (!cancelled) setLoadingOptions(false)
      }
    }

    loadOptions()
    return () => {
      cancelled = true
    }
  }, [isOpen, teachers.length, students.length])

  function openForm() {
    setError('')
    setSuccess('')
    setIsOpen(true)
  }

  function closeForm() {
    setError('')
    setIsOpen(false)
  }

  function toggleStudent(id) {
    setStudentIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const result = await createGroup({
        group_number: Number(groupNumber),
        teacher: teacherId ? Number(teacherId) : null,
        students: studentIds,
        revenue_per_student: Number(revenue) || 0,
      })

      if (!result.ok) {
        setError(extractErrorMessage(result.data))
        return
      }

      setIsOpen(false)
      setSuccess(`تم إنشاء المجموعة رقم ${result.data.group_number}.`)
      setGroupNumber('')
      setTeacherId('')
      setStudentIds([])
      setRevenue('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-shell">
      <Sidebar />

      <main className="admin-main">
        <header className="admin-main__head">
          <div>
            <p className="admin-main__eyebrow">{brand.name}</p>
            <h1 className="admin-main__title">echol manager</h1>
            <p className="admin-main__hint">إدارة شؤون النظام — قيد الإنشاء.</p>
          </div>

          <div className="admin-main__actions">
            <button className="lp-btn" type="button" onClick={openForm}>
              create group
            </button>
            <Link className="lp-btn lp-btn--outline" to="/">
              الصفحة الرئيسية
            </Link>
          </div>
        </header>

        {success && (
          <p className="admin-notice" role="status">
            {success}
          </p>
        )}

        {isOpen && (
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-group-title"
          >
            <div className="admin-modal__card">
              <h2 className="admin-modal__title" id="create-group-title">
                إنشاء مجموعة
              </h2>

              <form className="admin-form" onSubmit={handleSubmit}>
                <div className="admin-form__field">
                  <label className="admin-form__label" htmlFor="group-number">
                    رقم المجموعة
                  </label>
                  <input
                    className="admin-form__input"
                    id="group-number"
                    type="number"
                    min="1"
                    required
                    value={groupNumber}
                    onChange={(event) => setGroupNumber(event.target.value)}
                  />
                </div>

                <div className="admin-form__field">
                  <label className="admin-form__label" htmlFor="group-teacher">
                    المعلم
                  </label>
                  <select
                    className="admin-form__input"
                    id="group-teacher"
                    value={teacherId}
                    onChange={(event) => setTeacherId(event.target.value)}
                  >
                    <option value="">—</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <fieldset className="admin-form__field">
                  <legend className="admin-form__label">الطلاب</legend>
                  {loadingOptions && (
                    <p className="admin-form__hint">جارٍ تحميل الطلاب…</p>
                  )}
                  {!loadingOptions && students.length === 0 && (
                    <p className="admin-form__hint">لا يوجد طلاب بعد.</p>
                  )}
                  {!loadingOptions && (
                    <div className="admin-form__checks">
                      {students.map((student) => (
                        <label className="admin-form__check" key={student.id}>
                          <input
                            className="admin-form__checkbox"
                            type="checkbox"
                            checked={studentIds.includes(student.id)}
                            onChange={() => toggleStudent(student.id)}
                          />
                          {student.full_name}
                        </label>
                      ))}
                    </div>
                  )}
                </fieldset>

                <div className="admin-form__field">
                  <label className="admin-form__label" htmlFor="group-revenue">
                    الإيراد لكل طالب
                  </label>
                  <input
                    className="admin-form__input"
                    id="group-revenue"
                    type="number"
                    min="0"
                    step="0.01"
                    value={revenue}
                    onChange={(event) => setRevenue(event.target.value)}
                  />
                </div>

                {error && (
                  <p className="admin-notice admin-notice--error" role="alert">
                    {error}
                  </p>
                )}

                <div className="admin-form__actions">
                  <button
                    className="lp-btn lp-btn--outline"
                    type="button"
                    onClick={closeForm}
                  >
                    إلغاء
                  </button>
                  <button className="lp-btn" type="submit" disabled={submitting}>
                    {submitting ? 'جارٍ الإنشاء…' : 'إنشاء'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}