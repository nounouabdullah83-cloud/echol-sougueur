import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import Sidebar from '../../../components/sidebar/Sidebar'
import { brand } from '../../landingpage/landingData'
import { extractErrorMessage } from '../../../api/errors'
import { createGroup, fetchGroups } from '../../../adminFetch/groups'
import { fetchTeachers } from '../../../adminFetch/teachers'
import '../admin.css'

/**
 * Classes selectable for each level, mirroring `Group.CLASSES_BY_LEVEL`.
 * Only the number of years differs between levels.
 */
const classesByLevel = {
  primary: [
    { value: 'first_year', label: 'السنة الأولى' },
    { value: 'second_year', label: 'السنة الثانية' },
    { value: 'third_year', label: 'السنة الثالثة' },
    { value: 'fourth_year', label: 'السنة الرابعة' },
    { value: 'fifth_year', label: 'السنة الخامسة' },
  ],
  middle: [
    { value: 'first_year', label: 'السنة الأولى' },
    { value: 'second_year', label: 'السنة الثانية' },
    { value: 'third_year', label: 'السنة الثالثة' },
    { value: 'fourth_year', label: 'السنة الرابعة' },
  ],
  secondary: [
    { value: 'first_year', label: 'السنة الأولى' },
    { value: 'second_year', label: 'السنة الثانية' },
    { value: 'third_year', label: 'السنة الثالثة' },
  ],
}

/**
 * echol manager — admin home.
 *
 * Renders the shared admin sidebar and a "create group" button that opens a
 * modal form wired to POST /api/groups/.
 */
export default function EcholManagerPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [teachers, setTeachers] = useState([])
  const [groups, setGroups] = useState([])
  const [groupsLoading, setGroupsLoading] = useState(false)
  const [groupsError, setGroupsError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [groupNumber, setGroupNumber] = useState('')
  const [subject, setSubject] = useState('')
  const [groupLevel, setGroupLevel] = useState('primary')
  const [groupClass, setGroupClass] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [revenue, setRevenue] = useState('')

  // Load the group list once on mount.
  useEffect(() => {
    let cancelled = false

    async function loadGroups() {
      setGroupsLoading(true)
      try {
        const result = await fetchGroups()
        if (cancelled) return
        if (result.ok) {
          setGroups(result.data)
        } else {
          setGroupsError(extractErrorMessage(result.data))
        }
      } finally {
        if (!cancelled) setGroupsLoading(false)
      }
    }

    loadGroups()
    return () => {
      cancelled = true
    }
  }, [])

  // Load teachers the first time the form opens.
  useEffect(() => {
    if (!isOpen || teachers.length) return

    let cancelled = false

    async function loadTeachers() {
      const result = await fetchTeachers()
      if (cancelled) return
      if (result.ok) setTeachers(result.data)
    }

    loadTeachers()
    return () => {
      cancelled = true
    }
  }, [isOpen, teachers.length])

  function openForm() {
    setError('')
    setSuccess('')
    setIsOpen(true)
  }

  function closeForm() {
    setError('')
    setIsOpen(false)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const result = await createGroup({
        group_number: Number(groupNumber),
        subject: subject,
        level: groupLevel,
        class_name: groupClass,
        teacher: teacherId ? Number(teacherId) : null,
        revenue_per_student: Number(revenue) || 0,
      })

      if (!result.ok) {
        setError(extractErrorMessage(result.data))
        return
      }

      setIsOpen(false)
      setSuccess(`تم إنشاء المجموعة رقم ${result.data.group_number}.`)
      setGroupNumber('')
      setSubject('')
      setGroupLevel('primary')
      setGroupClass('')
      setTeacherId('')
      setRevenue('')
      setGroups((current) =>
        [...current, result.data].sort((a, b) => a.group_number - b.group_number),
      )
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
            <Link className="lp-btn lp-btn--outline" to="/">
              الصفحة الرئيسية
            </Link>
          </div>
        </header>

        <div className="admin-toolbar">
          <button
            className="lp-btn"
            type="button"
            onClick={openForm}
          >
            create group
          </button>
        </div>

        {success && (
          <p className="admin-notice" role="status">
            {success}
          </p>
        )}

        <section>
          <h2 className="admin-section__title">المجموعات</h2>

          {groupsLoading && <p>جارٍ تحميل المجموعات…</p>}
          {groupsError && <p role="alert">{groupsError}</p>}
          {!groupsLoading && groups.length === 0 && <p>لا توجد مجموعات بعد.</p>}

          <div className="group-grid">
            {groups.map((group) => (
              <Link
                className="group-card"
                key={group.id}
                to={`/admin/groups/${group.id}`}
              >
                <h3 className="group-card__title">group {group.group_number}</h3>
                <p className="group-card__subject">{group.subject}</p>
                <p className="group-card__meta">
                  المستوى: {group.level_display || '—'}
                </p>
                <p className="group-card__meta">
                  القسم: {group.class_name_display || '—'}
                </p>
                <p className="group-card__meta">المعلم: {group.teacher_name || '—'}</p>
                <p className="group-card__meta">عدد الطلاب: {group.students.length}</p>
              </Link>
            ))}
          </div>
        </section>

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
                  <label className="admin-form__label" htmlFor="group-subject">
                    المادة
                  </label>
                  <input
                    className="admin-form__input"
                    id="group-subject"
                    type="text"
                    required
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                  />
                </div>

                <div className="admin-form__field">
                  <label className="admin-form__label" htmlFor="group-level">
                    المستوى
                  </label>
                  <select
                    className="admin-form__input"
                    id="group-level"
                    required
                    value={groupLevel}
                    onChange={(event) => {
                      setGroupLevel(event.target.value)
                      setGroupClass('')
                    }}
                  >
                    <option value="primary">ابتدائية</option>
                    <option value="middle">متوسطة</option>
                    <option value="secondary">ثانوية</option>
                  </select>
                </div>

                <div className="admin-form__field">
                  <label className="admin-form__label" htmlFor="group-class">
                    القسم
                  </label>
                  <select
                    className="admin-form__input"
                    id="group-class"
                    required
                    value={groupClass}
                    onChange={(event) => setGroupClass(event.target.value)}
                  >
                    <option value="">—</option>
                    {(classesByLevel[groupLevel] || []).map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
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