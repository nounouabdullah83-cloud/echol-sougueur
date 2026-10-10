/**
 * Maps DRF error payloads to Arabic UI messages.
 *
 * The backend returns English DRF messages (e.g. SimpleJWT `detail` strings and
 * Serializer field errors). Known messages are translated; unknown ones fall
 * back to a generic Arabic message.
 */

const TRANSLATIONS = {
  // Login
  'No active account found with the given credentials':
    'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  'Only superusers are allowed to log in.': 'تسجيل الدخول متاح لمديري النظام فقط.',

  // Field validation
  'This field is required.': 'هذا الحقل مطلوب.',
  'Enter a valid email address.': 'أدخل بريدًا إلكترونيًا صالحًا.',

  // Change password
  'The current password is incorrect.': 'كلمة المرور الحالية غير صحيحة.',
  'The two passwords do not match.': 'كلمتا المرور غير متطابقتين.',
  'This password is too short. It must contain at least 8 characters.':
    'كلمة المرور قصيرة جدًا — يجب ألا تقل عن 8 أحرف.',
  'This password is too common.': 'كلمة المرور شائعة جدًا، اختر كلمة أخرى.',
  'This password is entirely numeric.': 'كلمة المرور يجب ألا تكون أرقامًا فقط.',
  'This password is too similar to the email address.':
    'كلمة المرور مشابهة جدًا للبريد الإلكتروني.',

  // Tokens / logout
  'A refresh token is required.': 'انتهت الجلسة، يرجى تسجيل الدخول مجددًا.',
  'The refresh token is invalid or already blacklisted.':
    'انتهت الجلسة، يرجى تسجيل الدخول مجددًا.',
}

export const GENERIC_ERROR = 'تعذر إكمال العملية، حاول مجددًا.'

function translate(message) {
  return TRANSLATIONS[message] ?? message
}

/**
 * Extract the first human-readable message from a DRF error payload:
 * `{ "detail": "..." }`, `{ "code": ... }`, or field errors like
 * `{ "email": ["This field is required."] }`.
 */
export function extractErrorMessage(payload) {
  if (!payload || typeof payload !== 'object') return GENERIC_ERROR

  const { detail } = payload
  if (typeof detail === 'string' && detail) return translate(detail)
  if (Array.isArray(detail) && detail.length) return translate(String(detail[0]))

  for (const key of Object.keys(payload)) {
    const value = payload[key]
    if (Array.isArray(value) && value.length) return translate(String(value[0]))
    if (typeof value === 'string' && value) return translate(value)
  }

  return GENERIC_ERROR
}