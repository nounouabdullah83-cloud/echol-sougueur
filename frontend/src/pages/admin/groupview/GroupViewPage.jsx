import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import Sidebar from '../../../components/sidebar/Sidebar'
import { brand } from '../../landingpage/landingData'
import { extractErrorMessage } from '../../../api/errors'
import { addStudentToGroup, fetchGroup, updateGroup } from '../../../adminFetch/groups'
import { fetchStudents } from '../../../adminFetch/students'
import '../admin.css'

/** Today's date as an ISO `yyyy-mm-dd` string, for date inputs. */
function todayISO() {
  return new Date().toISOString().slice(0, 10)
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

  const [showStudentForm, setShowStudentForm] = useState(false)
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
  const availableStudents = allStudents.filter(
    (student) => !currentIds.includes(student.id),
  )

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
    } finally {
      setSaving(false)
    }
  }

  function addStudent(student) {
    changeStudents([...currentIds, student.id])
  }

  function removeStudent(student) {
    changeStudents(currentIds.filter((entry) => entry !== student.id))
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
            <button className="lp-btn" type="button" onClick={openStudentForm}>
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
                  {members.map((student) => (
                    <div className="group-student" key={student.id}>
                      <Link
                        className="group-student__link"
                        to={`/admin/students/${student.id}`}
                      >
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
                          المدرسة: {student.school || '—'}
                        </p>
                        <p className="group-student__meta">
                          تاريخ الميلاد: {student.birthdate || '—'}
                        </p>
                        <p className="group-student__meta">
                          هاتف المسؤول: {student.responsible_phone1 || '—'}
                        </p>
                      </Link>
                      <button
                        className="lp-btn lp-btn--outline"
                        type="button"
                        disabled={saving}
                        onClick={() => removeStudent(student)}
                      >
                        إزالة
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="admin-section__title">
                إضافة طلاب للمجموعة
              </h2>

              {availableStudents.length === 0 ? (
                <p>لا يوجد طلاب متاحون لإضافتهم (أو كل الطلاب في المجموعة).</p>
              ) : (
                <div className="group-students">
                  {availableStudents.map((student) => (
                    <div className="group-student" key={student.id}>
                      <Link
                        className="group-student__link"
                        to={`/admin/students/${student.id}`}
                      >
                        <h3 className="group-student__name">
                          {student.full_name}
                        </h3>
                        <p className="group-student__meta">
                          المدرسة: {student.school || '—'}
                        </p>
                      </Link>
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
              )}
            </section>
          </>
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
      </main>
    </div>
  )
}