import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import Sidebar from '../../../components/sidebar/Sidebar'
import SubscriptionBadge from '../../../components/student/SubscriptionBadge'
import TeacherBanner from '../../../components/teacher/TeacherBanner'
import Pagination from '../../../components/pagination/Pagination'
import { brand } from '../../landingpage/landingData'
import { extractErrorMessage } from '../../../api/errors'
import { createGroup, fetchGroups } from '../../../adminFetch/groups'
import { fetchStudents } from '../../../adminFetch/students'
import { createTeacher, fetchTeachers } from '../../../adminFetch/teachers'
import { fetchTeacherRevenues } from '../../../adminFetch/revenues'
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

/** Levels selectable in the filter toolbar, mirroring the create-group form. */
const levels = [
  { value: 'primary', label: 'ابتدائية' },
  { value: 'middle', label: 'متوسطة' },
  { value: 'secondary', label: 'ثانوية' },
]

/** Number of cards shown per page in the groups and teachers sections. */
const PAGE_SIZE = 10

/**
 * echol manager — admin home.
 *
 * Renders the shared admin sidebar, a "create group" button wired to
 * POST /api/groups/ and an "add teacher" button wired to POST /api/teachers/.
 * Below the paginated groups grid it lists the teachers (banners linking to
 * each teacher's card page). Groups and teachers are paginated 10 per page.
 */
export default function EcholManagerPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [teachers, setTeachers] = useState([])
  const [teacherRevenues, setTeacherRevenues] = useState([])
  const [groups, setGroups] = useState([])
  const [students, setStudents] = useState([])
  const [groupsLoading, setGroupsLoading] = useState(false)
  const [groupsError, setGroupsError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [searchQuery, setSearchQuery] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')

  const [subject, setSubject] = useState('')
  const [groupLevel, setGroupLevel] = useState('primary')
  const [groupClass, setGroupClass] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [revenue, setRevenue] = useState('')

  // "Add teacher" modal state.
  const [isTeacherFormOpen, setIsTeacherFormOpen] = useState(false)
  const [teacherName, setTeacherName] = useState('')
  const [teacherSubmitting, setTeacherSubmitting] = useState(false)
  const [teacherError, setTeacherError] = useState('')

  // Pagination (10 cards per page for both sections).
  const [groupsPage, setGroupsPage] = useState(1)
  const [teachersPage, setTeachersPage] = useState(1)

  /**
   * Refetch the teacher list together with their revenue summaries. Used on
   * mount and after a teacher is added, so a teacher created in this session
   * shows the same banner data a full page refresh would show.
   */
  const loadTeachersAndRevenues = useCallback(async () => {
    const [teachersResult, revenuesResult] = await Promise.all([
      fetchTeachers(),
      fetchTeacherRevenues(),
    ])
    if (teachersResult.ok) setTeachers(teachersResult.data)
    if (revenuesResult.ok) setTeacherRevenues(revenuesResult.data)
  }, [])

  // Load groups, students, teachers and their revenues once on mount.
  useEffect(() => {
    let cancelled = false

    async function loadData() {
      setGroupsLoading(true)
      try {
        const [groupsResult, studentsResult] = await Promise.all([
          fetchGroups(),
          fetchStudents(),
        ])
        if (cancelled) return
        if (groupsResult.ok) {
          setGroups(groupsResult.data)
        } else {
          setGroupsError(extractErrorMessage(groupsResult.data))
        }
        if (studentsResult.ok) setStudents(studentsResult.data)
        await loadTeachersAndRevenues()
      } finally {
        if (!cancelled) setGroupsLoading(false)
      }
    }

    loadData()
    return () => {
      cancelled = true
    }
  }, [loadTeachersAndRevenues])

  function openForm() {
    setError('')
    setSuccess('')
    setIsOpen(true)
  }

  function closeForm() {
    setError('')
    setIsOpen(false)
  }

  function openTeacherForm() {
    setTeacherError('')
    setSuccess('')
    setTeacherName('')
    setIsTeacherFormOpen(true)
  }

  function closeTeacherForm() {
    setTeacherError('')
    setIsTeacherFormOpen(false)
  }

  async function handleCreateTeacher(event) {
    event.preventDefault()
    setTeacherError('')
    setTeacherSubmitting(true)

    try {
      const result = await createTeacher({ full_name: teacherName.trim() })

      if (!result.ok) {
        setTeacherError(extractErrorMessage(result.data))
        return
      }

      setIsTeacherFormOpen(false)
      setTeacherName('')
      setSuccess(`تم إضافة المعلم ${result.data.full_name}.`)
      // Refetch teacher + revenue data so the new banner shows the full
      // summary (students count and revenue), not just the group count.
      await loadTeachersAndRevenues()
    } finally {
      setTeacherSubmitting(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const result = await createGroup({
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

  const subjects = Array.from(
    new Set(groups.map((group) => group.subject).filter(Boolean)),
  ).sort()

  const classOptions = levelFilter
    ? classesByLevel[levelFilter] || []
    : classesByLevel.primary

  const filteredGroups = groups.filter((group) => {
    if (subjectFilter && group.subject !== subjectFilter) return false
    if (levelFilter && group.level !== levelFilter) return false
    if (classFilter && group.class_name !== classFilter) return false
    return true
  })

  // Groups: 10 per page. The page is clamped so a shrinking list never
  // leaves the section stuck on an out-of-range page.
  const groupsPageCount = Math.max(1, Math.ceil(filteredGroups.length / PAGE_SIZE))
  const safeGroupsPage = Math.min(groupsPage, groupsPageCount)
  const visibleGroups = filteredGroups.slice(
    (safeGroupsPage - 1) * PAGE_SIZE,
    safeGroupsPage * PAGE_SIZE,
  )

  // Teachers, enriched with their revenue summary and the number of groups
  // they teach, then sliced to 10 per page.
  const revenueByTeacher = new Map(
    teacherRevenues.map((row) => [row.id, row]),
  )
  const groupCountByTeacher = groups.reduce((accumulator, group) => {
    if (group.teacher) {
      accumulator[group.teacher] = (accumulator[group.teacher] || 0) + 1
    }
    return accumulator
  }, {})
  const teacherRows = teachers.map((teacher) => ({
    ...teacher,
    ...(revenueByTeacher.get(teacher.id) || {}),
    groupsCount: groupCountByTeacher[teacher.id] || 0,
  }))
  const teachersPageCount = Math.max(1, Math.ceil(teacherRows.length / PAGE_SIZE))
  const safeTeachersPage = Math.min(teachersPage, teachersPageCount)
  const visibleTeachers = teacherRows.slice(
    (safeTeachersPage - 1) * PAGE_SIZE,
    safeTeachersPage * PAGE_SIZE,
  )

  // Search students by full name, phone numbers, and parents' names.
  const normalizedQuery = searchQuery.trim().toLowerCase().replace(/[\s-]+/g, '')
  const searchResults = normalizedQuery
    ? students.filter((student) =>
        [
          student.full_name,
          student.first_name,
          student.last_name,
          student.father_name,
          student.mother_first_name,
          student.mother_last_name,
          student.responsible_phone1,
          student.responsible_phone2,
        ].some((field) =>
          String(field ?? '')
            .toLowerCase()
            .replace(/[\s-]+/g, '')
            .includes(normalizedQuery),
        ),
      )
    : []

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
          <button
            className="lp-btn"
            type="button"
            onClick={openTeacherForm}
          >
            add teacher
          </button>
        </div>

        <div className="admin-filters">
          <div className="admin-filters__field admin-filters__search">
            <label className="admin-form__label" htmlFor="filter-search">
              بحث عن طالب
            </label>
            <input
              className="admin-form__input"
              id="filter-search"
              type="search"
              placeholder="الاسم الكامل، رقم الهاتف، أو اسم الوالدين…"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <div className="admin-filters__field">
            <label className="admin-form__label" htmlFor="filter-subject">
              المادة
            </label>
            <select
              className="admin-form__input"
              id="filter-subject"
              value={subjectFilter}
              onChange={(event) => {
                setSubjectFilter(event.target.value)
                setGroupsPage(1)
              }}
            >
              <option value="">كل المواد</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-filters__field">
            <label className="admin-form__label" htmlFor="filter-level">
              المستوى
            </label>
            <select
              className="admin-form__input"
              id="filter-level"
              value={levelFilter}
              onChange={(event) => {
                setLevelFilter(event.target.value)
                setClassFilter('')
                setGroupsPage(1)
              }}
            >
              <option value="">كل المستويات</option>
              {levels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-filters__field">
            <label className="admin-form__label" htmlFor="filter-class">
              القسم
            </label>
            <select
              className="admin-form__input"
              id="filter-class"
              value={classFilter}
              onChange={(event) => {
                setClassFilter(event.target.value)
                setGroupsPage(1)
              }}
            >
              <option value="">كل الأقسام</option>
              {classOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {success && (
          <p className="admin-notice" role="status">
            {success}
          </p>
        )}

        {normalizedQuery && (
          <section>
            <h2 className="admin-section__title">نتائج البحث عن الطلاب</h2>

            {searchResults.length === 0 ? (
              <p>لا يوجد طلاب مطابقون للبحث.</p>
            ) : (
              <div className="group-students">
                {searchResults.map((student) => (
                  <div className="group-student" key={student.id}>
                    <Link
                      className="group-student__link"
                      to={`/admin/students/${student.id}`}
                    >
                      <h3 className="group-student__name">
                        {student.full_name}
                      </h3>
                      <SubscriptionBadge isSubscribed={student.is_subscribed} />
                      <p className="group-student__meta">
                        {student.level_display}
                        {student.class_name_display
                          ? ` — ${student.class_name_display}`
                          : ''}
                      </p>
                      <p className="group-student__meta">
                        هاتف المسؤول: {student.responsible_phone1 || '—'}
                      </p>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <section>
          <h2 className="admin-section__title">المجموعات</h2>

          {groupsLoading && <p>جارٍ تحميل المجموعات…</p>}
          {groupsError && <p role="alert">{groupsError}</p>}
          {!groupsLoading && groups.length === 0 && <p>لا توجد مجموعات بعد.</p>}
          {!groupsLoading && groups.length > 0 && filteredGroups.length === 0 && (
            <p>لا توجد مجموعات مطابقة للتصفية.</p>
          )}

          <div className="group-grid">
            {visibleGroups.map((group) => (
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

          <Pagination
            page={safeGroupsPage}
            pageCount={groupsPageCount}
            onChange={setGroupsPage}
          />
        </section>

        <section>
          <h2 className="admin-section__title">المعلمون</h2>

          {teachers.length === 0 ? (
            <p>لا يوجد معلمون بعد.</p>
          ) : (
            <>
              <div className="teacher-grid">
                {visibleTeachers.map((teacher) => (
                  <TeacherBanner
                    key={teacher.id}
                    teacher={teacher}
                    groupsCount={teacher.groupsCount}
                  />
                ))}
              </div>

              <Pagination
                page={safeTeachersPage}
                pageCount={teachersPageCount}
                onChange={setTeachersPage}
              />
            </>
          )}
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

        {isTeacherFormOpen && (
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-teacher-title"
          >
            <div className="admin-modal__card admin-modal__card--narrow">
              <h2 className="admin-modal__title" id="create-teacher-title">
                إضافة معلم
              </h2>

              <form className="admin-form" onSubmit={handleCreateTeacher}>
                <div className="admin-form__field">
                  <label className="admin-form__label" htmlFor="teacher-name">
                    الاسم الكامل
                  </label>
                  <input
                    className="admin-form__input"
                    id="teacher-name"
                    type="text"
                    required
                    value={teacherName}
                    onChange={(event) => setTeacherName(event.target.value)}
                  />
                </div>

                {teacherError && (
                  <p className="admin-notice admin-notice--error" role="alert">
                    {teacherError}
                  </p>
                )}

                <div className="admin-form__actions">
                  <button
                    className="lp-btn lp-btn--outline"
                    type="button"
                    onClick={closeTeacherForm}
                  >
                    إلغاء
                  </button>
                  <button
                    className="lp-btn"
                    type="submit"
                    disabled={teacherSubmitting}
                  >
                    {teacherSubmitting ? 'جارٍ الإضافة…' : 'إضافة'}
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