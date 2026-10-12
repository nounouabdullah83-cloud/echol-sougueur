import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { brand } from '../../landingpage/landingData'
import { extractErrorMessage } from '../../../api/errors'
import { fetchStudent } from '../../../adminFetch/students'
import './studentdetails.css'

/**
 * Student details — a paper-like document showing a single student's
 * information only, with a single "رجوع" button to go back.
 *
 * Reached by clicking a student card in the group view.
 */
export default function StudentDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const result = await fetchStudent(id)
        if (cancelled) return
        if (result.ok) {
          setStudent(result.data)
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
  }, [id])

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
          </div>
        )}

        <div className="student-paper__actions">
          <button
            className="lp-btn lp-btn--outline"
            type="button"
            onClick={() => navigate(-1)}
          >
            رجوع
          </button>
        </div>
      </article>
    </div>
  )
}
