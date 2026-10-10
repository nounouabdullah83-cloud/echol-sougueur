/* eslint-disable react-refresh/only-export-components --
   Context modules legitimately export a provider component and a hook together. */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'

import {
  changePassword as changePasswordRequest,
  login as loginRequest,
  logout as logoutRequest,
} from '../api/auth'
import { extractErrorMessage } from '../api/errors'
import { clearTokens, getTokens, setTokens } from '../api/tokenStore'

const AuthContext = createContext(null)

/** Read the persisted session once, synchronously, before the first render. */
function readStoredSession() {
  const stored = getTokens()
  return stored?.access && stored?.refresh ? stored : null
}

export function AuthProvider({ children }) {
  const navigate = useNavigate()

  const [session] = useState(readStoredSession)
  const [user, setUser] = useState(session?.user ?? null)
  const [accessToken, setAccessToken] = useState(session?.access ?? null)
  const [refreshToken, setRefreshToken] = useState(session?.refresh ?? null)
  const [isLoading] = useState(false)

  // Keep React state in sync with what the API client persists, in case a
  // silent refresh rotates the tokens or the session expires.
  useEffect(() => {
    function onTokens(event) {
      setAccessToken(event.detail?.access ?? null)
      setRefreshToken(event.detail?.refresh ?? null)
    }
    function onExpired() {
      setAccessToken(null)
      setRefreshToken(null)
      setUser(null)
    }
    window.addEventListener('auth:tokens', onTokens)
    window.addEventListener('auth:expired', onExpired)
    return () => {
      window.removeEventListener('auth:tokens', onTokens)
      window.removeEventListener('auth:expired', onExpired)
    }
  }, [])

  const login = useCallback(async ({ email, password, remember }) => {
    let result
    try {
      result = await loginRequest({ email, password })
    } catch {
      return { ok: false, message: 'تعذر الاتصال بالخادم، حاول مجددًا.' }
    }

    if (!result.ok) {
      return { ok: false, message: extractErrorMessage(result.data) }
    }

    const { access, refresh } = result.data || {}
    if (!access || !refresh) {
      return { ok: false, message: 'استجابة غير متوقعة من الخادم.' }
    }

    setTokens({ access, refresh, user: result.data.user }, remember)
    setAccessToken(access)
    setRefreshToken(refresh)
    setUser(result.data.user ?? null)

    return { ok: true }
  }, [])

  const logout = useCallback(async () => {
    const stored = getTokens()
    if (stored?.refresh) {
      try {
        await logoutRequest(stored.refresh)
      } catch {
        // Best-effort — always clear local state even if the call fails.
      }
    }
    clearTokens()
    setAccessToken(null)
    setRefreshToken(null)
    setUser(null)
    navigate('/login', { replace: true })
  }, [navigate])

  const changePassword = useCallback(async (values) => {
    const result = await changePasswordRequest(values)
    if (!result.ok) {
      return { ok: false, message: extractErrorMessage(result.data) }
    }
    return { ok: true, message: result.data?.detail ?? 'تم تحديث كلمة المرور بنجاح.' }
  }, [])

  const value = useMemo(
    () => ({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(accessToken && refreshToken && user),
      isLoading,
      login,
      logout,
      changePassword,
    }),
    [user, accessToken, refreshToken, isLoading, login, logout, changePassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}