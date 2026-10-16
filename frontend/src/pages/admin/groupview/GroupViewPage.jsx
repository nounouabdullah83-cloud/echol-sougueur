import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import Sidebar from '../../../components/sidebar/Sidebar'
import SubscriptionBadge from '../../../components/student/SubscriptionBadge'
import { brand } from '../../landingpage/landingData'
import { extractErrorMessage } from '../../../api/errors'
import { addStudentToGroup, fetchGroup, updateGroup } from '../../../adminFetch/groups'
import { fetchStudents, deleteStudent } from '../../../adminFetch/students'
import { renewEnrollment } from '../../../adminFetch/enrollments'
import '../admin.css'

/** Today's date as an ISO `yyyy-mm-dd` string, for date inputs. */
function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

/** Normalize a value for searching: lowercase, ignore spaces and dashes. */
function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[\s-]+/g, '')
}

/** Whether a student matches a search query (name, phone, or parents' names). */
function matchesStudent(student, query) {
  const needle = normalize(query)
  if (!needle) return true
  return [
    student.full_name,
    student.first_name,
    student.last_name,
    student.father_name,
    student.mother_first_name,
    student.mother_last_name,
    student.responsible_phone1,
    student.responsible_phone2,
  ].some((field) => normalize(field).includes(needle))
}

/**
 * group view — shows a single group's information and its students.
 *
 * Reached by clicking a group card in the echol manager grid. New students can
 * be created here; a newly created student is automatically joined to this
 * group (the M2M `groups` relation is set on the student).
 */
export default function GroupViewPage() {
  const { id } = useParams()
  const [group, setGroup] = useState(null)
  const [allStudents, setAllStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [renewingId, setRenewingId] = useState(null)

  const [showStudentForm, setShowStudentForm] = useState(false)
  const [showAddChoice, setShowAddChoice] = useState(false)
  const [showExistingPicker, setShowExistingPicker] = useState(false)
  const [existingQuery, setExistingQuery] = useState('')
  const [submittingStudent, setSubmittingStudent] = useState(false)
  const [studentError, setStudentError] = useState('')
  const [studentSuccess, setStudentSuccess] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [birthplace, setBirthplace] = useState('')
  const [sex, setSex] = useState('')
  const [school, setSchool] = useState('')
  const [fatherName, setFatherName] = useState('')
  const [motherFirstName, setMotherFirstName] = useState('')
  const [motherLastName, setMotherLastName] = useState('')
  const [responsiblePhone1, setResponsiblePhone1] = useState('')
  const [responsiblePhone2, setResponsiblePhone2] = useState('')
  const [address, setAddress] = useState('')
  const [registrationDate, setRegistrationDate] = useState('')

  // Delete ("إزالة") confirmation modal state — removes the student from the
  // database entirely, not just from this group.
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [groupResult, studentsResult] = await Promise.all([
          fetchGroup(id),
          fetchStudents(),
        ])
        if (cancelled) return
        if (groupResult.ok) {
          setGroup(groupResult.data)
        } else {
          setError(extractErrorMessage(groupResult.data))
        }
        if (studentsResult.ok) setAllStudents(studentsResult.data)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id])

  const currentIds = (group?.students ?? []).map((entry) =>
    typeof entry === 'number' ? entry : entry.id,
  )
  const members = group?.students_detail ?? []
  // Each member's subscription for *this* group — independent of any other
  // group the student belongs to.
  const enrollmentByStudent = new Map(
    (group?.enrollments ?? []).map((enrollment) => [
      enrollment.student,
      enrollment,
    ]),
  )
  const availableStudents = allStudents.filter(
    (student) => !currentIds.includes(student.id),
  )
  const availableMatches = availableStudents.filter((student) =>
    matchesStudent(student, existingQuery),
  )

  function openAddChoice() {
    setStudentError('')
    setStudentSuccess('')
    setShowAddChoice(true)
  }

  function closeAddChoice() {
    setShowAddChoice(false)
  }

  function chooseNewStudent() {
    setShowAddChoice(false)
    openStudentForm()
  }

  function chooseExistingStudent() {
    setShowAddChoice(false)
    setExistingQuery('')
    setShowExistingPicker(true)
  }

  function closeExistingPicker() {
    setExistingQuery('')
    setShowExistingPicker(false)
  }

  function resetStudentForm() {
    setFirstName('')
    setLastName('')
    setBirthdate('')
    setBirthplace('')
    setSex('')
    setSchool('')
    setFatherName('')
    setMotherFirstName('')
    setMotherLastName('')
    setResponsiblePhone1('')
    setResponsiblePhone2('')
    setAddress('')
    setRegistrationDate(todayISO())
  }

  function openStudentForm() {
    setStudentError('')
    setStudentSuccess('')
    resetStudentForm()
    setShowStudentForm(true)
  }

  function closeStudentForm() {
    setStudentError('')
    setShowStudentForm(false)
  }

  async function handleAddStudentSubmit(event) {
    event.preventDefault()
    setStudentError('')
    setStudentSuccess('')
    setSubmittingStudent(true)

    try {
      const result = await addStudentToGroup(id, {
        first_name: firstName,
        last_name: lastName,
        birthdate: birthdate || undefined,
        birthplace: birthplace,
        sex: sex,
        school: school,
        father_name: fatherName,
        mother_first_name: motherFirstName,
        mother_last_name: motherLastName,
        responsible_phone1: responsiblePhone1,
        responsible_phone2: responsiblePhone2 || undefined,
        address: address,
        registration_date: registrationDate || undefined,
      })

      if (!result.ok) {
        setStudentError(extractErrorMessage(result.data))
        return
      }

      const fullName = `${firstName} ${lastName}`.trim() || result.data.group_number
      setGroup(result.data)
      setShowStudentForm(false)
      setStudentSuccess(`تم إضافة الطالب ${fullName} إلى المجموعة.`)
      resetStudentForm()

      const studentsResult = await fetchStudents()
      if (studentsResult.ok) setAllStudents(studentsResult.data)
    } finally {
      setSubmittingStudent(false)
    }
  }

  async function changeStudents(nextIds) {
    setSaving(true)
    setActionError('')
    try {
      const result = await updateGroup(id, { students: nextIds })
      if (result.ok) {
        setGroup(result.data)
      } else {
        setActionError(extractErrorMessage(result.data))
      }
      return result
    } finally {
      setSaving(false)
    }
  }

  async function addStudent(student) {
    setStudentSuccess('')
    const result = await changeStudents([...currentIds, student.id])
    if (result?.ok) {
      setStudentSuccess(`تم إضافة الطالب ${student.full_name} إلى المجموعة.`)
    }
  }

  /** Renew this group's subscription for one member — other groups untouched. */
  async function handleRenew(enrollment) {
    if (!enrollment || renewingId === enrollment.id) return
    setRenewingId(enrollment.id)
    setActionError('')
    setStudentSuccess('')
    try {
      const result = await renewEnrollment(enrollment.id)
      if (!result.ok) {
        setActionError(extractErrorMessage(result.data))
        return
      }
      const groupResult = await fetchGroup(id)
      if (groupResult.ok) setGroup(groupResult.data)
      setStudentSuccess(`تم تجديد اشتراك الطالب في المجموعة ${group?.group_number ?? ''}.`)
    } finally {
      setRenewingId(null)
    }
  }

  function removeStudent(student) {
    setDeleteError('')
    setDeleteTarget(student)
  }

  function closeDelete() {
    setDeleteError('')
    setDeleteTarget(null)
  }

  /** Permanently delete the student from the database, then refresh. */
  async function confirmDeleteStudent() {
    const student = deleteTarget
    if (!student) return

    setDeleteError('')
    setDeleting(true)
    try {
      const result = await deleteStudent(student.id)
      // 404 means it was already deleted — treat it as success.
      if (!result.ok && result.status !== 404) {
        setDeleteError(extractErrorMessage(result.data))
        return
      }

      setDeleteTarget(null)
      setStudentSuccess(`تم حذف الطالب ${student.full_name} نهائيًا من قاعدة البيانات.`)

      const [groupResult, studentsResult] = await Promise.all([
        fetchGroup(id),
        fetchStudents(),
      ])
      if (groupResult.ok) setGroup(groupResult.data)
      if (studentsResult.ok) setAllStudents(studentsResult.data)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="admin-shell">
      <Sidebar />

      <main className="admin-main">
        <header className="admin-main__head">
          <div>
            <p className="admin-main__eyebrow">{brand.name}</p>
            <h1 className="admin-main__title">
              {group ? `group ${group.group_number}` : 'group'}
            </h1>
            <p className="admin-main__hint">معلومات المجموعة والطلاب.</p>
          </div>

          <div className="admin-main__actions">
            <button className="lp-btn" type="button" onClick={openAddChoice}>
              add student
            </button>
            <Link className="lp-btn lp-btn--outline" to="/admin/echolmanager">
              رجوع إلى echol manager
            </Link>
          </div>
        </header>

        {loading && <p>جارٍ تحميل المجموعة…</p>}
        {error && (
          <p className="admin-notice admin-notice--error" role="alert">
            {error}
          </p>
        )}

        {group && !loading && (
          <>
            <section className="group-detail" aria-label="معلومات المجموعة">
              <div className="group-detail__list">
                <div className="group-detail__item">
                  <span className="group-detail__label">رقم المجموعة</span>
                  <span className="group-detail__value">{group.group_number}</span>
                </div>
                <div className="group-detail__item">
                  <span className="group-detail__label">المادة</span>
                  <span className="group-detail__value">{group.subject || '—'}</span>
                </div>
                <div className="group-detail__item">
                  <span className="group-detail__label">المستوى</span>
                  <span className="group-detail__value">
                    {group.level_display || '—'}
                  </span>
                </div>
                <div className="group-detail__item">
                  <span className="group-detail__label">القسم</span>
                  <span className="group-detail__value">
                    {group.class_name_display || '—'}
                  </span>
                </div>
                <div className="group-detail__item">
                  <span className="group-detail__label">المعلم</span>
                  <span className="group-detail__value">
                    {group.teacher_name || '—'}
                  </span>
                </div>
                <div className="group-detail__item">
                  <span className="group-detail__label">الإيراد لكل طالب</span>
                  <span className="group-detail__value">
                    {group.revenue_per_student}
                  </span>
                </div>
                <div className="group-detail__item">
                  <span className="group-detail__label">عدد الطلاب</span>
                  <span className="group-detail__value">{members.length}</span>
                </div>
              </div>
            </section>

            {studentSuccess && (
              <p className="admin-notice" role="status">
                {studentSuccess}
              </p>
            )}
            {actionError && (
              <p className="admin-notice admin-notice--error" role="alert">
                {actionError}
              </p>
            )}

            <section>
              <h2 className="admin-section__title">الطلاب</h2>

              {members.length === 0 ? (
                <p>لا يوجد طلاب في هذه المجموعة بعد.</p>
              ) : (
                <div className="group-students">
                  {members.map((student) => {
                    const enrollment = enrollmentByStudent.get(student.id)
                    return (
                      <div className="group-student" key={student.id}>
                        <Link
                          className="group-student__link"
                          to={`/admin/students/${student.id}`}
                        >
                          <h3 className="group-student__name">
                            {student.full_name}
                          </h3>
                          <SubscriptionBadge
                            isSubscribed={Boolean(
                              enrollment
                                ? enrollment.is_subscription_active
                                : student.is_subscribed,
                            )}
                          />
                          <p className="group-student__meta">
                            {student.level_display}
                            {student.class_name_display
                              ? ` — ${student.class_name_display}`
                              : ''}
                          </p>
                          <p className="group-student__meta">
                            المدرسة: {student.school || '—'}
                          </p>
                          <p className="group-student__meta">
                            تاريخ الميلاد: {student.birthdate || '—'}
                          </p>
                          <p className="group-student__meta">
                            هاتف المسؤول: {student.responsible_phone1 || '—'}
                          </p>
                        </Link>
                        {enrollment && (
                          <p className="group-student__meta">
                            اشتراك هذه المجموعة: {enrollment.renewal_date || '—'}
                            {' ← '}
                            {enrollment.expiry_date || '—'}
                          </p>
                        )}
                        <div className="group-student__actions">
                          {enrollment && (
                            <button
                              className="lp-btn"
                              type="button"
                              disabled={
                                saving ||
                                deleting ||
                                enrollment.is_subscription_active ||
                                renewingId === enrollment.id
                              }
                              title={
                                enrollment.is_subscription_active
                                  ? 'الاشتراك مفعّل في هذه المجموعة'
                                  : 'تجديد الاشتراك لهذه المجموعة فقط'
                              }
                              onClick={() => handleRenew(enrollment)}
                            >
                              {renewingId === enrollment.id
                                ? 'جارٍ التجديد…'
                                : 'تجديد الاشتراك'}
                            </button>
                          )}
                          <button
                            className="lp-btn lp-btn--outline"
                            type="button"
                            disabled={saving || deleting}
                            onClick={() => removeStudent(student)}
                          >
                            إزالة
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {showAddChoice && (
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-choice-title"
          >
            <div className="admin-modal__card admin-modal__card--narrow">
              <h2 className="admin-modal__title" id="add-choice-title">
                إضافة طالب
              </h2>
              <p className="admin-form__hint">اختر طريقة الإضافة:</p>

              <div className="admin-choice">
                <button
                  className="admin-choice__option"
                  type="button"
                  onClick={chooseExistingStudent}
                >
                  <span className="admin-choice__title">طالب موجود</span>
                  <span className="admin-choice__hint">
                    البحث عن طالب مسجّل مسبقًا وإضافته إلى هذه المجموعة.
                  </span>
                </button>

                <button
                  className="admin-choice__option"
                  type="button"
                  onClick={chooseNewStudent}
                >
                  <span className="admin-choice__title">طالب جديد</span>
                  <span className="admin-choice__hint">
                    إنشاء ملف طالب جديد وإضافته إلى هذه المجموعة.
                  </span>
                </button>
              </div>

              <div className="admin-form__actions">
                <button
                  className="lp-btn lp-btn--outline"
                  type="button"
                  onClick={closeAddChoice}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {showExistingPicker && (
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="existing-student-title"
          >
            <div className="admin-modal__card">
              <h2 className="admin-modal__title" id="existing-student-title">
                إضافة طالب موجود
              </h2>

              <div className="admin-form__field">
                <label className="admin-form__label" htmlFor="existing-search">
                  بحث عن طالب
                </label>
                <input
                  className="admin-form__input"
                  id="existing-search"
                  type="search"
                  placeholder="الاسم الكامل، رقم الهاتف، أو اسم الوالدين…"
                  value={existingQuery}
                  onChange={(event) => setExistingQuery(event.target.value)}
                />
              </div>

              {existingQuery.trim() !== '' &&
                (availableMatches.length === 0 ? (
                  <p className="admin-picker__empty">
                    {availableStudents.length === 0
                      ? 'كل الطلاب مسجّلون في هذه المجموعة بالفعل.'
                      : 'لا يوجد طلاب مطابقون للبحث.'}
                  </p>
                ) : (
                  <div className="admin-picker">
                    {availableMatches.map((student) => (
                      <div className="admin-picker__item" key={student.id}>
                        <div className="admin-picker__info">
                          <h3 className="group-student__name">
                            {student.full_name}
                          </h3>
                          <p className="group-student__meta">
                            {student.level_display}
                            {student.class_name_display
                              ? ` — ${student.class_name_display}`
                              : ''}
                          </p>
                          <p className="group-student__meta">
                            هاتف المسؤول: {student.responsible_phone1 || '—'}
                          </p>
                        </div>
                        <button
                          className="lp-btn"
                          type="button"
                          disabled={saving}
                          onClick={() => addStudent(student)}
                        >
                          إضافة
                        </button>
                      </div>
                    ))}
                  </div>
                ))}

              <div className="admin-form__actions">
                <button
                  className="lp-btn lp-btn--outline"
                  type="button"
                  onClick={closeExistingPicker}
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

        {showStudentForm && (
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-student-title"
          >
            <div className="admin-modal__card">
              <h2 className="admin-modal__title" id="add-student-title">
                إضافة طالب للمجموعة
              </h2>

              <form className="admin-form" onSubmit={handleAddStudentSubmit}>
                <div className="admin-form__field">
                  <label className="admin-form__label" htmlFor="student-first">
                    الاسم الأول
                  </label>
                  <input
                    className="admin-form__input"
                    id="student-first"
                    type="text"
                    required
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                  />
                </div>

                <div className="admin-form__field">
                  <label className="admin-form__label" htmlFor="student-last">
                    اسم العائلة
                  </label>
                  <input
                    className="admin-form__input"
                    id="student-last"
                    type="text"
                    required
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                  />
                </div>

                <div className="admin-form__field">
                  <label className="admin-form__label" htmlFor="student-birthdate">
                    تاريخ الميلاد
                  </label>
                  <input
                    className="admin-form__input"
                    id="student-birthdate"
                    type="date"
                    required
                    value={birthdate}
                    onChange={(event) => setBirthdate(event.target.value)}
                  />
                </div>

                <div className="admin-form__field">
                  <label className="admin-form__label" htmlFor="student-birthplace">
                    مكان الميلاد
                  </label>
                  <input
                    className="admin-form__input"
                    id="student-birthplace"
                    type="text"
                    required
                    value={birthplace}
                    onChange={(event) => setBirthplace(event.target.value)}
                  />
                </div>

                <div className="admin-form__field">
                  <label className="admin-form__label" htmlFor="student-sex">
                    الجنس
                  </label>
                  <select
                    className="admin-form__input"
                    id="student-sex"
                    required
                    value={sex}
                    onChange={(event) => setSex(event.target.value)}
                  >
                    <option value="">—</option>
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                  </select>
                </div>

                <div className="admin-form__field">
                  <label className="admin-form__label" htmlFor="student-school">
                    المدرسة الحكومية
                  </label>
                  <input
                    className="admin-form__input"
                    id="student-school"
                    type="text"
                    required
                    value={school}
                    onChange={(event) => setSchool(event.target.value)}
                  />
                </div>

                <div className="admin-form__field">
                  <label className="admin-form__label" htmlFor="student-father">
                    اسم الأب
                  </label>
                  <input
                    className="admin-form__input"
                    id="student-father"
                    type="text"
                    required
                    value={fatherName}
                    onChange={(event) => setFatherName(event.target.value)}
                  />
                </div>

                <div className="admin-form__field">
                  <label className="admin-form__label" htmlFor="student-mother-first">
                    الاسم الأول للأم
                  </label>
                  <input
                    className="admin-form__input"
                    id="student-mother-first"
                    type="text"
                    required
                    value={motherFirstName}
                    onChange={(event) => setMotherFirstName(event.target.value)}
                  />
                </div>

                <div className="admin-form__field">
                  <label className="admin-form__label" htmlFor="student-mother-last">
                    لقب الأم
                  </label>
                  <input
                    className="admin-form__input"
                    id="student-mother-last"
                    type="text"
                    required
                    value={motherLastName}
                    onChange={(event) => setMotherLastName(event.target.value)}
                  />
                </div>

                <div className="admin-form__field">
                  <label className="admin-form__label" htmlFor="student-phone1">
                    هاتف المسؤول 1
                  </label>
                  <input
                    className="admin-form__input"
                    id="student-phone1"
                    type="tel"
                    required
                    value={responsiblePhone1}
                    onChange={(event) => setResponsiblePhone1(event.target.value)}
                  />
                </div>

                <div className="admin-form__field">
                  <label className="admin-form__label" htmlFor="student-phone2">
                    هاتف المسؤول 2 (اختياري)
                  </label>
                  <input
                    className="admin-form__input"
                    id="student-phone2"
                    type="tel"
                    value={responsiblePhone2}
                    onChange={(event) => setResponsiblePhone2(event.target.value)}
                  />
                </div>

                <div className="admin-form__field">
                  <label className="admin-form__label" htmlFor="student-address">
                    العنوان
                  </label>
                  <input
                    className="admin-form__input"
                    id="student-address"
                    type="text"
                    required
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                  />
                </div>

                <div className="admin-form__field">
                  <label className="admin-form__label" htmlFor="student-registration">
                    تاريخ التسجيل
                  </label>
                  <input
                    className="admin-form__input"
                    id="student-registration"
                    type="date"
                    required
                    value={registrationDate}
                    onChange={(event) => setRegistrationDate(event.target.value)}
                  />
                </div>

                {studentError && (
                  <p className="admin-notice admin-notice--error" role="alert">
                    {studentError}
                  </p>
                )}

                <div className="admin-form__actions">
                  <button
                    className="lp-btn lp-btn--outline"
                    type="button"
                    onClick={closeStudentForm}
                  >
                    إلغاء
                  </button>
                  <button className="lp-btn" type="submit" disabled={submittingStudent}>
                    {submittingStudent ? 'جارٍ الإضافة…' : 'إضافة'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteTarget && (
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-student-title"
          >
            <div className="admin-modal__card admin-modal__card--narrow">
              <h2 className="admin-modal__title" id="delete-student-title">
                إزالة الطالب
              </h2>

              <div className="admin-form">
                <p className="admin-form__hint">
                  سيتم حذف الطالب
                  {` «${deleteTarget.full_name}»`} نهائيًا من قاعدة البيانات،
                  مع خروجه من كل مجموعاته. هذا الإجراء لا يمكن التراجع عنه.
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
                    onClick={confirmDeleteStudent}
                  >
                    {deleting ? 'جارٍ الحذف…' : 'حذف'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}